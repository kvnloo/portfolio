import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPagesDeployment } from '../scripts/check-pages-deployment.mjs';
function fixture() {
  return { repository: 'kvnloo/portfolio', currentRunId: '300', pin: { deploymentId: '10', statusId: '20', runId: '100', headSha: 'a'.repeat(40) }, deployments: [{ id: 10, environment: 'github-pages', sha: 'a'.repeat(40) }], statuses: { '10': [{ id: 20, state: 'success', environment_url: 'https://kvnloo.github.io/portfolio/', log_url: 'https://github.com/kvnloo/portfolio/actions/runs/100/job/50' }] } };
}
test('matches authoritative successful Pages deployment ID/status/source/run', () => {
  assert.equal(verifyPagesDeployment(fixture()).deploymentId, '10');
});
test('permits only this run’s in-progress environment record ahead of base', () => {
  const f = fixture(); f.deployments.unshift({ id: 11 }); f.statuses['11'] = [{ state: 'in_progress', log_url: 'https://github.com/kvnloo/portfolio/actions/runs/300/job/51' }];
  assert.equal(verifyPagesDeployment(f).successfulStatusId, '20');
});
test('another newer deployment fails closed even if its run later failed', () => {
  const f = fixture(); f.deployments.unshift({ id: 11 }); f.statuses['11'] = [{ state: 'failure', log_url: 'https://github.com/kvnloo/portfolio/actions/runs/250/job/51' }];
  assert.throws(() => verifyPagesDeployment(f), /different newer/);
});
test('inactive/changed base or missing authoritative evidence fails closed', () => {
  const f = fixture(); f.statuses['10'][0].state = 'inactive'; assert.throws(() => verifyPagesDeployment(f), /no longer/);
  const missing = fixture(); missing.deployments = []; assert.throws(() => verifyPagesDeployment(missing), /absent/);
  const changed = fixture(); changed.deployments[0].sha = 'other'; assert.throws(() => verifyPagesDeployment(changed), /source differs/);
});
