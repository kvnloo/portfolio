const MANIFEST_URLS = [
  '/boplog/data/portfolio-manifest.json',
  new URL('../shared/portfolio-manifest.preview.json', window.location.href).href,
];
const OSS_URL = '/boplog/data/oss-contributions.json';
const PORTFOLIO_BASE = window.location.pathname.replace(/\/(?:work|lab|oss)\/?$/, '').replace(/\/$/, '');

const $ = (selector) => document.querySelector(selector);

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function link(label, href) {
  const a = node('a', '', label);
  if (!safeHref(href)) return node('span', '', label);
  a.href = href;
  if (/^https?:/.test(href)) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

async function json(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function firstJson(urls) {
  let lastError = null;
  for (const url of urls) {
    try {
      const manifest = await json(url);
      if (manifest?.schemaVersion !== 'portfolio.v1' || !Array.isArray(manifest.projects) || typeof manifest.thesis !== 'string') throw new Error('Invalid portfolio manifest');
      return { manifest, source: url };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No evidence source available');
}

function surfaceProjects(manifest, surface) {
  return manifest.projects
    .filter((project) => project?.visibility === 'public' && typeof project.repo?.url === 'string' && typeof project.title === 'string' && typeof project.summary === 'string' && project.surfaces?.[surface] && project.promotion !== 'discovered')
    .sort((a, b) => (a.surfaces[surface].priority ?? 999) - (b.surfaces[surface].priority ?? 999));
}

function renderClaim(claim) {
  const item = node('li', 'claim', claim.text);
  item.dataset.claimId = claim.id;
  item.dataset.verification = claim.verification;
  const meta = node('small', '', claim.verification);
  if (claim.evidence?.length) {
    meta.append(' · ');
    const evidence = claim.evidence[0];
    const receipt = link('receipt', evidence.url);
    receipt.setAttribute('aria-label', `Evidence: ${claim.text}`);
    meta.append(receipt);
    if (evidence.revision) meta.append(' · ', link(evidence.revision.slice(0, 7), evidence.exactRevisionUrl || evidence.url));
  }
  item.append(meta);
  return item;
}

function renderProject(project, index) {
  const card = node('article', index === 0 ? 'card featured' : 'card');
  const top = node('div', 'card-top');
  top.append(node('h3', '', project.title));
  top.append(node('span', 'badge', project.promotion));
  card.append(top);
  card.append(node('p', 'summary', project.summary));

  const claims = (Array.isArray(project.claims) ? project.claims : []).filter(publishableClaim);
  if (claims.length) {
    const list = node('ul', 'claims');
    for (const claim of claims.slice(0, 3)) list.append(renderClaim(claim));
    card.append(list);
  }

  const links = node('div', 'links');
  links.append(link('GitHub', project.repo.url));
  if (project.id === 'quackles') {
    links.append(link('Case study', `${PORTFOLIO_BASE}/work/quackles/`));
    links.append(link('Live', 'https://kvnloo.github.io/quackles/'));
  }
  if (project.id === 'zer0') links.append(link('Case study', `${PORTFOLIO_BASE}/lab/zer0/`));
  if (project.id === 'z0evals') links.append(link('Evals', 'https://kvnloo.github.io/z0evals/'));
  if (project.id === 'verified-oss-loop') links.append(link('Case study', `${PORTFOLIO_BASE}/oss/verified-loop/`));
  if (project.id === 'aodl') links.append(link('AODL catalog', 'https://kvnloo.github.io/aodl/'));
  for (const anchor of links.querySelectorAll('a')) anchor.setAttribute('aria-label', `${anchor.textContent}: ${project.title}`);
  card.append(links);
  return card;
}

function renderProjects(manifest, surface) {
  const grid = $('#project-grid');
  grid.replaceChildren();
  const projects = surfaceProjects(manifest, surface);
  if (!projects.length) {
    grid.append(node('div', 'empty', 'No promoted projects on this surface yet.'));
    return;
  }
  projects.forEach((project, index) => grid.append(renderProject(project, index)));
}

function renderMeta(manifest, source) {
  $('#thesis').textContent = manifest.thesis;
  $('#manifest-date').textContent = `evidence reviewed ${manifest.updatedAt}`;
  const preview = source !== MANIFEST_URLS[0];
  setStatus('evidence-status', preview
    ? 'Preview snapshot · generated from the canonical Boplog manifest. Live publication is pending.'
    : 'Canonical Boplog evidence · curated claims, with revision-bound receipts.');
}

function contributionRank(item) {
  if (item.kind === 'pull_request' && item.status === 'merged') return 0;
  if (item.kind === 'pull_request' && item.status === 'open_ready') return 1;
  if (item.kind === 'pull_request' && item.status === 'open_draft') return 2;
  if (item.kind === 'issue') return 3;
  return 4;
}

function renderOss(dataset) {
  const summary = $('#oss-summary');
  const receipts = $('#oss-receipts');
  if (!summary || !receipts) return;

  summary.replaceChildren();
  const values = [
    ['recorded merged upstream PRs', dataset.summary?.mergedUpstreamPullRequests],
    ['recorded open ready PRs', dataset.summary?.openReadyUpstreamPullRequests],
    ['recorded upstream communities', dataset.summary?.distinctUpstreamCommunities],
  ];
  for (const [label, value] of values) if (Number.isInteger(value) && value >= 0) summary.append(node('span', 'pill', `${value} ${label}`));
  const generatedAt = Date.parse(dataset.generatedAt);
  const stale = !Number.isFinite(generatedAt) || Date.now() - generatedAt > 24 * 60 * 60 * 1000;
  setStatus('oss-status', stale
    ? `Stale OSS snapshot · historical statuses as of ${dataset.generatedAt || 'an unknown date'}. Follow each upstream receipt for its current disposition.`
    : `OSS snapshot as of ${dataset.generatedAt}. Statuses are observed receipts, not live guarantees.`, stale ? 'stale' : 'current');

  receipts.replaceChildren();
  const items = [...(Array.isArray(dataset.contributions) ? dataset.contributions : [])]
    .filter((item) => item?.relationship === 'canonical_upstream' && safeHref(item.url))
    .sort((a, b) => {
      const rank = contributionRank(a) - contributionRank(b);
      if (rank) return rank;
      return String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''));
    })
    .slice(0, 12);

  for (const item of items) {
    const row = node('div', 'receipt');
    const body = node('div');
    body.append(link(item.title, item.url));
    body.append(node('div', 'repo', `${item.repo} #${item.number}`));
    row.append(body);
    row.append(node('div', 'state', item.status));
    receipts.append(row);
  }
}

function safeHref(href) {
  if (typeof href !== 'string') return false;
  try {
    const url = new URL(href, window.location.origin);
    if (url.username || url.password) return false;
    const explicitHttps = /^https:\/\//i.test(href.trim());
    const localPath = /^\/(?![\/\\])/.test(href);
    return (explicitHttps && url.protocol === 'https:') || (localPath && url.origin === window.location.origin && ['http:', 'https:'].includes(url.protocol));
  } catch { return false; }
}

function publishableClaim(claim) {
  if (!claim || !['public', 'sanitized'].includes(claim.publishability) || !['verified', 'reported', 'provisional'].includes(claim.verification)) return false;
  const evidence = Array.isArray(claim.evidence) ? claim.evidence : [];
  if (evidence.some(item => item?.visibility !== 'public' || !safeHref(item.url))) return false;
  return claim.verification !== 'verified' || evidence.some(item => /^[a-f0-9]{40}$/.test(item.revision) && Number.isFinite(Date.parse(item.observedAt)));
}

function setStatus(id, text, state = 'info') {
  let target = document.getElementById(id);
  if (!target) {
    target = node('p', 'evidence-status');
    target.id = id;
    const anchor = id === 'oss-status' ? $('#oss-summary') : $('#manifest-date');
    anchor?.insertAdjacentElement('afterend', target);
  }
  target.textContent = text;
  target.dataset.state = state;
  target.setAttribute('role', 'status');
}

async function boot() {
  const surface = document.body.dataset.surface || 'work';
  try {
    const { manifest, source } = await firstJson(MANIFEST_URLS);
    renderMeta(manifest, source);
    renderProjects(manifest, surface);
  } catch (error) {
    $('#project-grid').replaceChildren(node('div', 'error', `Evidence feed unavailable: ${error.message}`));
    setStatus('evidence-status', 'Evidence unavailable. No unsupported claims are displayed.', 'unavailable');
  }

  // A broken activity feed must not erase the separately verified project stories.
  if (surface === 'oss') {
    try {
      const oss = await json(OSS_URL);
      renderOss(oss);
      const generated = $('#generated-at');
      if (generated) generated.textContent = `OSS snapshot ${oss.generatedAt || 'date unknown'}`;
    } catch {
      setStatus('oss-status', 'OSS activity feed unavailable. Canonical contribution stories and their receipts remain available above.', 'unavailable');
    }
  }
}

boot();
