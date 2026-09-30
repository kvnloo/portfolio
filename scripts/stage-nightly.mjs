import { createReadStream } from 'node:fs';
import { readdir, lstat, mkdir, cp, rm, writeFile } from 'node:fs/promises';
import { resolve, join, relative, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const folders = ['figma', 'work', 'lab', 'oss', 'shared'];
const allowed = new Set(['.html', '.css', '.js', '.svg', '.woff2', '.webp', '.json', '.txt']);
async function fileDigest(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}
export async function inventoryStaticTree(root, omitNightly = false) {
  const files = {};
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name), key = relative(root, path).split(sep).join('/');
      if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${key}`);
      if (omitNightly && (key === 'nightly' || key.startsWith('nightly/'))) continue;
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files[key] = await fileDigest(path);
      else throw new Error(`Refusing special file: ${key}`);
    }
  }
  await visit(root);
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
}
export async function stageNightly({ deployment, source, revision, baseRun, receipt }) {
  deployment = resolve(deployment); source = resolve(source);
  if (source === deployment || source.startsWith(deployment + sep) || deployment.startsWith(source + sep)) throw new Error('Source and deployment must be separate, nonoverlapping directories');
  if (!/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('A pinned 40-character source revision is required');
  if (!/^\d+$/.test(String(baseRun || ''))) throw new Error('A numeric base run is required');
  if (receipt && (resolve(receipt) === deployment || resolve(receipt).startsWith(deployment + sep))) throw new Error('Receipt must be outside the preserved deployment');
  if (receipt && (await lstat(resolve(receipt)).catch(() => null))?.isSymbolicLink()) throw new Error('Receipt must not be a symbolic link');
  const sources = [];
  for (const folder of folders) {
    const dir = join(source, folder);
    const stat = await lstat(dir).catch(() => null);
    if (!stat?.isDirectory() || stat.isSymbolicLink()) throw new Error(`Missing source directory or symbolic link: ${folder}`);
    const inventory = await inventoryStaticTree(dir);
    for (const file of Object.keys(inventory)) if (allowed.has(extname(file)) && !(folder === 'figma' && file === 'assets/manifest.json')) sources.push(join(folder, file));
  }
  if (!sources.includes(join('figma', 'index.html'))) throw new Error('Missing source Figma entry');
  // Inspect the entire prior deployment before any write, including old nightly.
  await inventoryStaticTree(deployment);
  const before = await inventoryStaticTree(deployment, true);
  const target = join(deployment, 'nightly');
  await rm(target, { recursive: true, force: true });
  for (const file of sources) {
    const destination = join(target, file);
    await mkdir(resolve(destination, '..'), { recursive: true });
    await cp(join(source, file), destination, { dereference: false, errorOnExist: true, force: false });
  }
  await writeFile(join(target, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow"><meta http-equiv="refresh" content="0; url=./figma/"><title>Kevin Rajan — nightly preview</title></head><body><p><a href="./figma/">Open the nightly portfolio preview</a></p></body></html>\n');
  await writeFile(join(target, 'version.json'), JSON.stringify({ sourceCommit: revision, preservedDeploymentRun: String(baseRun), path: '/portfolio/nightly/figma/' }, null, 2) + '\n');
  const after = await inventoryStaticTree(deployment, true);
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Preservation failure: files outside nightly changed');
  const result = { sourceCommit: revision, baseRun: String(baseRun), preservedFiles: Object.keys(before).length, publishedNightlyFiles: sources.length + 2, outsideNightlyChanged: false, before, after };
  if (receipt) await writeFile(resolve(receipt), JSON.stringify(result, null, 2) + '\n');
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [deployment, source, revision, baseRun, receipt] = process.argv.slice(2);
  if (!deployment || !source || !receipt) throw new Error('Usage: stage-nightly.mjs DEPLOYMENT SOURCE REVISION BASE_RUN RECEIPT');
  const result = await stageNightly({ deployment, source, revision, baseRun, receipt });
  console.log(JSON.stringify({ sourceCommit: result.sourceCommit, preservedFiles: result.preservedFiles, publishedNightlyFiles: result.publishedNightlyFiles, outsideNightlyChanged: false }));
}
