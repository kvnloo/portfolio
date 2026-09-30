import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function verifyPagesDeployment({ deployments, statuses, pin, currentRunId, repository }) {
  if (!Array.isArray(deployments)) throw new Error('Invalid Pages deployment inventory');
  const baseIndex = deployments.findIndex(item => String(item.id) === pin.deploymentId);
  if (baseIndex < 0) throw new Error('Pinned Pages deployment is absent from the recent inventory');
  const base = deployments[baseIndex];
  if (base.environment !== 'github-pages' || base.sha !== pin.headSha) throw new Error('Pinned Pages deployment source differs');
  const state = statuses[pin.deploymentId]?.[0];
  if (!state || String(state.id) !== pin.statusId || state.state !== 'success' || state.environment_url !== 'https://kvnloo.github.io/portfolio/' || !state.log_url?.startsWith(`https://github.com/${repository}/actions/runs/${pin.runId}/`)) throw new Error('Pinned Pages deployment is no longer the confirmed successful live generation');
  for (const item of deployments.slice(0, baseIndex)) {
    const latest = statuses[String(item.id)]?.[0];
    if (!latest || !['queued', 'waiting', 'in_progress'].includes(latest.state) || !latest.log_url?.startsWith(`https://github.com/${repository}/actions/runs/${currentRunId}/`)) throw new Error(`A different newer Pages deployment exists (${item.id})`);
  }
  return { deploymentId: pin.deploymentId, successfulStatusId: pin.statusId, baseRun: pin.runId, headSha: pin.headSha, environmentUrl: state.environment_url };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const repository = process.env.GITHUB_REPOSITORY;
  if (repository !== 'kvnloo/portfolio') throw new Error('Unexpected repository');
  const pin = { deploymentId: process.env.BASE_DEPLOYMENT_ID, statusId: process.env.BASE_STATUS_ID, headSha: process.env.BASE_HEAD_SHA, runId: process.env.BASE_RUN_ID };
  async function publicJson(path) {
    const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`Public deployment metadata failed: HTTP ${response.status}`);
    return response.json();
  }
  const deployments = await publicJson('deployments?environment=github-pages&per_page=100');
  const index = deployments.findIndex(item => String(item.id) === pin.deploymentId);
  if (index < 0) throw new Error('Pinned deployment not found; refusing stale publication');
  const statuses = {};
  for (const item of deployments.slice(0, index + 1)) statuses[String(item.id)] = await publicJson(`deployments/${item.id}/statuses?per_page=100`);
  console.log(JSON.stringify(verifyPagesDeployment({ deployments, statuses, pin, currentRunId: process.env.GITHUB_RUN_ID, repository })));
}
