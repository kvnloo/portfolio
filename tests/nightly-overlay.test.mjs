import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stageNightly, inventoryStaticTree } from '../scripts/stage-nightly.mjs';
const revision = 'a'.repeat(40);
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'nightly-overlay-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'source'), deployment = join(root, 'site');
  for (const p of ['figma/assets', 'work', 'lab', 'oss', 'shared']) await mkdir(join(source, p), { recursive: true });
  for (const p of ['dev/demos/room', 'demos/room', 'nightly']) await mkdir(join(deployment, p), { recursive: true });
  for (const p of ['index.html', 'dev/index.html', 'demos/room/app.js', 'dev/demos/room/app.js', '.nojekyll']) await writeFile(join(deployment, p), `keep:${p}`);
  await writeFile(join(deployment, 'nightly/index.html'), 'old nightly');
  for (const p of ['figma/index.html', 'work/index.html', 'lab/index.html', 'oss/index.html', 'shared/surfaces.js']) await writeFile(join(source, p), `new:${p}`);
  await writeFile(join(source, 'figma/assets/example.svg'), '<svg width="12" height="12"/>');
  await writeFile(join(source, 'figma/README.md'), 'not a published asset');
  return { root, source, deployment, receipt: join(root, 'receipt.json') };
}
test('overlays only nightly and preserves every root/dev/demo byte', async t => {
  const f = await fixture(t); const before = await inventoryStaticTree(f.deployment, true);
  const result = await stageNightly({ ...f, revision, baseRun: '36654880155' });
  assert.deepEqual(await inventoryStaticTree(f.deployment, true), before);
  assert.equal(result.preservedFiles, 5);
  assert.equal(await readFile(join(f.deployment, 'nightly/figma/index.html'), 'utf8'), 'new:figma/index.html');
  assert.match(await readFile(join(f.deployment, 'nightly/index.html'), 'utf8'), /url=\.\/figma\//);
  assert.equal(JSON.parse(await readFile(join(f.deployment, 'nightly/version.json'))).sourceCommit, revision);
  assert.equal(JSON.parse(await readFile(f.receipt)).outsideNightlyChanged, false);
  await assert.rejects(readFile(join(f.deployment, 'nightly/figma/README.md')), /ENOENT/);
});
test('missing source fails before changing existing nightly or production', async t => {
  const f = await fixture(t); await rm(join(f.source, 'oss'), { recursive: true });
  const before = await inventoryStaticTree(f.deployment);
  await assert.rejects(stageNightly({ ...f, revision, baseRun: '1' }), /Missing source/);
  assert.deepEqual(await inventoryStaticTree(f.deployment), before);
});
test('source links are rejected before any writes', async t => {
  const f = await fixture(t); await symlink(join(f.deployment, 'index.html'), join(f.source, 'figma/linked.html'));
  const before = await inventoryStaticTree(f.deployment);
  await assert.rejects(stageNightly({ ...f, revision, baseRun: '1' }), /symbolic link/i);
  assert.deepEqual(await inventoryStaticTree(f.deployment), before);
});
test('existing deployment links cannot escape the preserved tree', async t => {
  const f = await fixture(t); await symlink(f.source, join(f.deployment, 'linked'));
  await assert.rejects(stageNightly({ ...f, revision, baseRun: '1' }), /symbolic link/i);
  assert.equal(await readFile(join(f.deployment, 'nightly/index.html'), 'utf8'), 'old nightly');
});
test('a linked nightly root is rejected, not followed', async t => {
  const f = await fixture(t); await rm(join(f.deployment, 'nightly'), { recursive: true }); await symlink(f.source, join(f.deployment, 'nightly'));
  await assert.rejects(stageNightly({ ...f, revision, baseRun: '1' }), /symbolic link/i);
  assert.equal(await readFile(join(f.source, 'figma/index.html'), 'utf8'), 'new:figma/index.html');
});
test('overlapping paths and malformed revisions are refused', async t => {
  const f = await fixture(t);
  await assert.rejects(stageNightly({ ...f, source: f.deployment, revision, baseRun: '1' }), /separate/);
  await assert.rejects(stageNightly({ ...f, source: join(f.deployment, 'nested'), revision, baseRun: '1' }), /separate/);
  await assert.rejects(stageNightly({ ...f, revision: 'main', baseRun: '1' }), /revision/);
  await assert.rejects(stageNightly({ ...f, revision, baseRun: '../1' }), /run/);
});
test('repeat staging is deterministic and does not touch companions outside nightly', async t => {
  const f = await fixture(t); await stageNightly({ ...f, revision, baseRun: '1' });
  const before = await inventoryStaticTree(f.deployment);
  await stageNightly({ ...f, revision, baseRun: '1' });
  assert.deepEqual(await inventoryStaticTree(f.deployment), before);
});

test('receipt output cannot create a file inside the preserved deployment', async t => {
  const f = await fixture(t); const before = await inventoryStaticTree(f.deployment);
  await assert.rejects(stageNightly({ ...f, revision, baseRun: '1', receipt: join(f.deployment, 'receipt.json') }), /receipt.*outside/i);
  assert.deepEqual(await inventoryStaticTree(f.deployment), before);
});

test('private asset provenance is excluded while runtime JSON remains available', async t => {
  const f = await fixture(t);
  await writeFile(join(f.source, 'figma/assets/manifest.json'), '{"fileKey":"private-source-key"}');
  await writeFile(join(f.source, 'shared/portfolio-manifest.preview.json'), '{"projects":[]}');
  await stageNightly({ ...f, revision, baseRun: '1' });
  await assert.rejects(readFile(join(f.deployment, 'nightly/figma/assets/manifest.json')), /ENOENT/);
  assert.equal(await readFile(join(f.deployment, 'nightly/shared/portfolio-manifest.preview.json'), 'utf8'), '{"projects":[]}');
});
