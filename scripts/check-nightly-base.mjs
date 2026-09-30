import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function verifyNightlyBase({ pages, base, artifact, pin, currentRunId }) {
  if (!Array.isArray(pages) || pages.length === 0) throw new Error('Missing run pagination');
  const runs = pages.flatMap(page => page.workflow_runs || []);
  const unique = new Set(runs.map(run => String(run.id)));
  const count = pages[0].total_count;
  if (!Number.isInteger(count) || pages.some(page => page.total_count !== count) || runs.length !== count || unique.size !== count) throw new Error('Incomplete or inconsistent run pagination');
  if (!/^\d+$/.test(String(currentRunId)) || String(currentRunId) === pin.runId) throw new Error('Invalid current run');
  const listedBase = runs.find(run => String(run.id) === pin.runId);
  for (const record of [base, listedBase]) {
    if (!record || String(record.id) !== pin.runId || record.status !== 'completed' || record.conclusion !== 'success' || record.run_attempt !== pin.attempt || record.updated_at !== pin.updatedAt || record.head_sha !== pin.headSha) throw new Error('Pinned base deployment state changed');
  }
  for (const run of runs) {
    if (String(run.id) === pin.runId || String(run.id) === String(currentRunId)) continue;
    if (!run.updated_at || run.updated_at >= pin.updatedAt) throw new Error(`A newer or ambiguous run exists (${run.id}); inspect the live deployment before proceeding`);
  }
  if (!artifact || String(artifact.id) !== pin.artifactId || artifact.name !== 'github-pages' || artifact.expired !== false || String(artifact.workflow_run?.id) !== pin.runId || artifact.digest !== pin.digest) throw new Error('Pinned Pages artifact is unavailable or changed');
  return { baseRun: pin.runId, baseAttempt: pin.attempt, baseUpdatedAt: pin.updatedAt, artifact: pin.artifactId, digest: pin.digest, allRunsInspected: runs.length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [pagesPath, basePath, artifactPath] = process.argv.slice(2);
  const [pages, base, artifact] = await Promise.all([pagesPath, basePath, artifactPath].map(async path => JSON.parse(await readFile(path, 'utf8'))));
  const pin = { runId: process.env.BASE_RUN_ID, artifactId: process.env.BASE_ARTIFACT_ID, attempt: Number(process.env.BASE_ATTEMPT), updatedAt: process.env.BASE_UPDATED_AT, headSha: process.env.BASE_HEAD_SHA, digest: process.env.BASE_DIGEST };
  console.log(JSON.stringify(verifyNightlyBase({ pages, base, artifact, pin, currentRunId: process.env.GITHUB_RUN_ID })));
}
