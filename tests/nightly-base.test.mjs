import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyNightlyBase } from '../scripts/check-nightly-base.mjs';
function fixture() {
  const pin = { runId: '100', artifactId: '200', attempt: 1, updatedAt: '2026-09-30T01:25:15Z', headSha: 'a'.repeat(40), digest: 'sha256:' + 'b'.repeat(64) };
  const base = { id: 100, run_attempt: 1, updated_at: pin.updatedAt, status: 'completed', conclusion: 'success', head_sha: pin.headSha };
  const artifact = { id: 200, name: 'github-pages', expired: false, workflow_run: { id: 100 }, digest: pin.digest };
  const current = { id: 300, updated_at: '2026-09-30T08:00:00Z', status: 'in_progress' };
  return { pin, base, artifact, currentRunId: '300', pages: [{ total_count: 2, workflow_runs: [current, base] }] };
}
test('accepts exactly pinned successful base and only excludes current run', () => {
  assert.equal(verifyNightlyBase(fixture()).baseRun, '100');
});
test('older workflow rerun updated after base is refused regardless of created_at', () => {
  const f = fixture(); f.pages.push({ total_count: 3, workflow_runs: [{ id: 20, created_at: '2025-01-01T00:00:00Z', updated_at: '2026-09-30T07:00:00Z', status: 'completed', conclusion: 'success' }] }); f.pages[0].total_count = 3;
  assert.throws(() => verifyNightlyBase(f), /newer or ambiguous/i);
});
test('a possibly deployed run followed by verification failure is refused', () => {
  const f = fixture(); f.pages[0].workflow_runs.push({ id: 250, updated_at: '2026-09-30T07:00:00Z', status: 'completed', conclusion: 'failure' }); f.pages[0].total_count++;
  assert.throws(() => verifyNightlyBase(f), /newer or ambiguous/i);
});
test('queued/running/unknown-named newer runs are refused without filtering', () => {
  for (const status of ['queued', 'in_progress', 'completed']) {
    const f = fixture(); f.pages[0].workflow_runs.push({ id: 260, name: 'Something unexpected', updated_at: '2026-09-30T07:00:00Z', status }); f.pages[0].total_count++;
    assert.throws(() => verifyNightlyBase(f), /newer or ambiguous/i);
  }
});
test('missing pagination, duplicates, or inconsistent counts fail closed', () => {
  const missing = fixture(); missing.pages[0].total_count++;
  assert.throws(() => verifyNightlyBase(missing), /pagination/i);
  const duplicate = fixture(); duplicate.pages[0].workflow_runs.push(duplicate.base);
  assert.throws(() => verifyNightlyBase(duplicate), /pagination/i);
});
test('changed base attempt/time/status/digest are refused', () => {
  for (const [key, value] of [['run_attempt', 2], ['updated_at', '2026-09-30T08:00:00Z'], ['conclusion', 'failure'], ['status', 'in_progress']]) {
    const f = fixture(); f.base[key] = value; assert.throws(() => verifyNightlyBase(f), /base/i);
  }
  const f = fixture(); f.artifact.digest = 'different'; assert.throws(() => verifyNightlyBase(f), /artifact/i);
});
test('expired and foreign-run artifacts are refused', () => {
  const expired = fixture(); expired.artifact.expired = true; assert.throws(() => verifyNightlyBase(expired), /artifact/i);
  const foreign = fixture(); foreign.artifact.workflow_run.id = 50; assert.throws(() => verifyNightlyBase(foreign), /artifact/i);
});
