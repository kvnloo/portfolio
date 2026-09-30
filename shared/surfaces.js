const MANIFEST_URLS = [
  '/boplog/data/portfolio-manifest.json',
  new URL('../shared/portfolio-manifest.preview.json', window.location.href).href,
];
const OSS_URL = '/boplog/data/oss-contributions.json';
const PORTFOLIO_BASE = window.location.pathname.startsWith('/portfolio/dev/')
  ? '/portfolio/dev'
  : '/portfolio';

const $ = (selector) => document.querySelector(selector);

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function link(label, href) {
  const a = node('a', '', label);
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
      return await json(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No evidence source available');
}

function surfaceProjects(manifest, surface) {
  return manifest.projects
    .filter((project) => project.surfaces?.[surface] && project.promotion !== 'discovered')
    .sort((a, b) => (a.surfaces[surface].priority ?? 999) - (b.surfaces[surface].priority ?? 999));
}

function renderClaim(claim) {
  const item = node('li', 'claim', claim.text);
  item.dataset.verification = claim.verification;
  const meta = node('small', '', claim.verification);
  if (claim.evidence?.length) {
    meta.append(' · ');
    const evidence = claim.evidence[0];
    meta.append(link('receipt', evidence.url));
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

  const claims = (project.claims || []).filter((claim) => claim.publishability === 'public' && claim.verification !== 'deprecated');
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

function renderMeta(manifest) {
  $('#thesis').textContent = manifest.thesis;
  $('#manifest-date').textContent = `manifest updated ${manifest.updatedAt}`;
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
    ['merged upstream PRs', dataset.summary?.mergedUpstreamPullRequests ?? 0],
    ['open ready PRs', dataset.summary?.openReadyUpstreamPullRequests ?? 0],
    ['upstream communities', dataset.summary?.distinctUpstreamCommunities ?? 0],
  ];
  for (const [label, value] of values) summary.append(node('span', 'pill', `${value} ${label}`));

  receipts.replaceChildren();
  const items = [...(dataset.contributions || [])]
    .filter((item) => item.relationship === 'canonical_upstream')
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

async function boot() {
  const surface = document.body.dataset.surface || 'work';
  try {
    const manifest = await firstJson(MANIFEST_URLS);
    renderMeta(manifest);
    renderProjects(manifest, surface);

    if (surface === 'oss') {
      const oss = await json(OSS_URL);
      renderOss(oss);
      const generated = $('#generated-at');
      if (generated) generated.textContent = `OSS snapshot ${oss.generatedAt}`;
    }
  } catch (error) {
    const grid = $('#project-grid');
    grid.replaceChildren(node('div', 'error', `Evidence feed unavailable: ${error.message}`));
  }
}

boot();
