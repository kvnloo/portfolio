import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import test from 'node:test';
const script = await readFile(new URL('../shared/surfaces.js', import.meta.url), 'utf8');
const canonical = JSON.parse(await readFile(new URL('../shared/portfolio-manifest.preview.json', import.meta.url), 'utf8'));
async function render({ surface = 'work', live = canonical, snapshot = canonical, oss, mutate, origin = 'https://kvnloo.github.io', prefix = '/portfolio/dev' } = {}) {
  const dom = new JSDOM(`<body data-surface="${surface}"><p id="thesis"></p><span id="manifest-date"></span><p id="evidence-status"></p><div id="project-grid"></div><p id="oss-status"></p><div id="oss-summary"></div><div id="oss-receipts"></div><span id="generated-at"></span></body>`, { url: `${origin}${prefix}/${surface}/`, runScripts: 'outside-only' });
  const payload = structuredClone(live); if (mutate && payload) mutate(payload);
  dom.window.fetch = async url => {
    const data = url.includes('oss-contributions') ? oss : url.includes('preview.json') ? snapshot : url.includes('evidence-source') ? { sourceRevision: 'a'.repeat(40), sha256: 'b'.repeat(64) } : payload;
    return { ok: data != null, status: data == null ? 404 : 200, json: async () => data };
  };
  dom.window.eval(script);
  await new Promise(resolve => setTimeout(resolve, 15));
  return dom.window.document;
}
test('fallback is labelled as a preview snapshot', async () => {
  const doc = await render({ live: null });
  assert.match(doc.querySelector('#evidence-status').textContent, /preview snapshot/i);
  assert.match(doc.querySelector('#project-grid').textContent, /Quackles/);
});
test('malformed live data falls back rather than erasing the page', async () => {
  const doc = await render({ live: { schemaVersion: 'wrong' } });
  assert.match(doc.querySelector('#project-grid').textContent, /Quackles/);
});
test('unavailable OSS feed does not erase canonical projects', async () => {
  const doc = await render({ surface: 'oss' });
  assert.match(doc.querySelector('#project-grid').textContent, /Verified OSS/);
  assert.match(doc.querySelector('#oss-status').textContent, /unavailable/i);
});
test('stale OSS results have explicit stale and historical labels', async () => {
  const doc = await render({ surface: 'oss', oss: { generatedAt: '2026-08-25T23:44:43Z', summary: { mergedUpstreamPullRequests: 8 }, contributions: [] } });
  assert.match(doc.querySelector('#oss-status').textContent, /stale/i);
  assert.match(doc.querySelector('#oss-summary').textContent, /recorded/);
});
test('private project content never reaches a surface', async () => {
  const doc = await render({ mutate: d => { d.projects[0].visibility = 'private'; d.projects[0].title = 'SECRET PROJECT'; } });
  assert.doesNotMatch(doc.body.textContent, /SECRET PROJECT/);
});
test('unsafe repository links are not emitted', async () => {
  const doc = await render({ mutate: d => { d.projects[0].repo.url = 'javascript:alert(1)'; } });
  assert.equal(doc.querySelectorAll('a[href^="javascript:"]').length, 0);
});
test('verified claims without pinned evidence are withheld', async () => {
  const doc = await render({ mutate: d => { d.projects[0].claims[0].text = 'UNPINNED CLAIM'; delete d.projects[0].claims[0].evidence[0].revision; } });
  assert.doesNotMatch(doc.body.textContent, /UNPINNED CLAIM/);
});
test('canonical feed and dev navigation remain available', async () => {
  const doc = await render();
  assert.match(doc.querySelector('#evidence-status').textContent, /canonical/i);
  assert.ok([...doc.querySelectorAll('a')].some(a => a.getAttribute('href') === '/portfolio/dev/work/quackles/'));
});

test('unrecognized verification states are withheld', async () => {
  const doc = await render({ mutate: d => { d.projects[0].claims[0].text = 'UNKNOWN CLAIM'; d.projects[0].claims[0].verification = 'hype'; } });
  assert.doesNotMatch(doc.body.textContent, /UNKNOWN CLAIM/);
});
test('local HTTP preview keeps safe relative navigation', async () => {
  const doc = await render({ origin: 'http://127.0.0.1:4173' });
  assert.ok([...doc.querySelectorAll('a')].some(a => a.getAttribute('href') === '/portfolio/dev/work/quackles/'));
});
test('all feeds unavailable yields a useful empty state', async () => {
  const doc = await render({ live: null, snapshot: null });
  assert.match(doc.querySelector('#project-grid').textContent, /unavailable/i);
  assert.match(doc.querySelector('#evidence-status').textContent, /No unsupported claims/);
});

test('isolated preview keeps its own navigation prefix', async () => {
  const doc = await render({ prefix: '/portfolio/previews/evidence-2026' });
  assert.ok([...doc.querySelectorAll('a')].some(a => a.getAttribute('href') === '/portfolio/previews/evidence-2026/work/quackles/'));
});
test('protocol-relative and credential-bearing repository links are rejected', async () => {
  for (const url of ['//evil.test/', '\\\\evil.test/', 'https://user:password@evil.test/']) {
    const doc = await render({ mutate: d => { d.projects[0].repo.url = url; } });
    assert.equal([...doc.querySelectorAll('a')].filter(a => a.href.includes('evil.test')).length, 0);
  }
});
test('repeated project and receipt links have contextual accessible names', async () => {
  const doc = await render();
  const card = doc.querySelector('#project-grid article');
  const caseLink = [...card.querySelectorAll('a')].find(a => a.textContent === 'Case study');
  const receipt = [...card.querySelectorAll('a')].find(a => a.textContent === 'receipt');
  assert.match(caseLink.getAttribute('aria-label') || '', /Quackles/);
  assert.match(receipt.getAttribute('aria-label') || '', /Blue p0000000/);
});
test('malformed individual records cannot erase valid project stories', async () => {
  const doc = await render({ mutate: d => { d.projects[0].repo = null; d.projects[1].claims[0].evidence = [null]; } });
  assert.match(doc.querySelector('#project-grid').textContent, /Verified OSS/);
  assert.doesNotMatch(doc.querySelector('#project-grid').textContent, /Evidence feed unavailable/);
});
