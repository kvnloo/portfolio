const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const load = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const script = () => load('figma/portfolio.js');
function app(hash = '') {
  const dom = new JSDOM(load('figma/index.html'), { url: `http://localhost/portfolio/dev/figma/${hash}`, runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.eval(script());
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
}
function click(dom, selector) { dom.window.document.querySelector(selector).click(); }
const current = (dom) => dom.window.document.querySelector('[data-screen]:not([hidden])').dataset.screen;

test('route parsing validates deep links and canonicalizes unknown input', () => {
  const { parseFigmaRoute } = require('../figma/portfolio.js');
  assert.deepEqual(parseFigmaRoute(''), { page: 'experience', employer: null });
  assert.deepEqual(parseFigmaRoute('#/experience/amazon'), { page: 'experience', employer: 'amazon' });
  assert.deepEqual(parseFigmaRoute('#/resources'), { page: 'resources', employer: null });
  for (const invalid of ['#/bogus', '#/experience/unknown', '#/about/more', '#/experience/amazon/more', '#/%3Cscript%3E']) {
    assert.deepEqual(parseFigmaRoute(invalid), { page: 'experience', employer: null });
  }
});
test('initial view is full-rail experience overview and sets navigation semantics', () => {
  const dom = app(); const doc = dom.window.document;
  assert.equal(current(dom), 'experience');
  assert.equal(doc.querySelector('[data-overview]').hidden, false);
  assert.equal(doc.querySelectorAll('[data-employer][aria-selected="true"]').length, 0);
  assert.equal(doc.querySelector('a[data-page="experience"]').getAttribute('aria-current'), 'page');
  assert.equal(doc.documentElement.dataset.page, 'experience');
  dom.window.close();
});
test('direct employer route renders source-backed role without a fetch', () => {
  const dom = app('#/experience/amazon'); const doc = dom.window.document;
  assert.equal(doc.querySelector('[data-employer-panel="amazon"]').hidden, false);
  assert.equal(doc.querySelector('[data-employer="amazon"]').getAttribute('aria-selected'), 'true');
  assert.equal(doc.querySelector('[data-overview]').hidden, true);
  assert.match(doc.querySelector('[data-employer-panel="amazon"]').textContent, /Aug 2018.*Jan 2019/s);
  dom.window.close();
});
test('repeated employer click does not create duplicate history or deselect it', () => {
  const dom = app(); click(dom, '[data-employer="synchrony"]');
  const count = dom.window.history.length;
  click(dom, '[data-employer="synchrony"]');
  assert.equal(dom.window.history.length, count);
  assert.equal(dom.window.location.hash, '#/experience/synchrony');
  assert.equal(dom.window.document.querySelector('[data-employer-panel="synchrony"]').hidden, false);
  dom.window.close();
});
test('all navigation links show distinct useful screens', () => {
  const dom = app();
  for (const page of ['about', 'contact', 'services', 'resources', 'experience']) {
    click(dom, `a[data-page="${page}"]`);
    assert.equal(current(dom), page);
    assert.equal(dom.window.document.querySelectorAll('a[data-page][aria-current="page"]').length, 1);
    assert.ok(dom.window.document.querySelector(`[data-screen="${page}"]`).textContent.trim().length > 80);
  }
  dom.window.close();
});
test('browser Back and Forward restore employer, selection, and displayed content', async () => {
  const dom = app(); click(dom, '[data-employer="synchrony"]'); click(dom, '[data-employer="amazon"]');
  const wait = () => new Promise((resolve) => dom.window.addEventListener('popstate', () => setTimeout(resolve, 0), { once: true }));
  let done = wait(); dom.window.history.back(); await done;
  assert.equal(dom.window.document.querySelector('[data-employer="synchrony"]').getAttribute('aria-selected'), 'true');
  done = wait(); dom.window.history.forward(); await done;
  assert.equal(dom.window.document.querySelector('[data-employer-panel="amazon"]').hidden, false);
  dom.window.close();
});
test('arrows wrap through employer tabs, Home/End jump, Escape restores overview', () => {
  const dom = app(); const doc = dom.window.document;
  const key = (key) => doc.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  doc.querySelector('[data-employer="synchrony"]').focus(); key('ArrowDown');
  assert.equal(doc.activeElement.dataset.employer, 'amazon');
  assert.equal(dom.window.location.hash, '#/experience/amazon');
  key('End'); assert.equal(doc.activeElement.dataset.employer, 'unassigned');
  key('ArrowRight'); assert.equal(doc.activeElement.dataset.employer, 'synchrony');
  key('Home'); assert.equal(doc.activeElement.dataset.employer, 'synchrony');
  key('Escape'); assert.equal(dom.window.location.hash, '#/experience');
  assert.equal(doc.querySelector('[data-overview]').hidden, false);
  assert.equal(doc.querySelectorAll('[data-employer][tabindex="0"]').length, 1);
  dom.window.close();
});
test('close restores overview and focus without resetting subsequent navigation', () => {
  const dom = app('#/experience/amazon'); click(dom, '[data-show-overview]');
  assert.equal(dom.window.location.hash, '#/experience');
  assert.equal(dom.window.document.activeElement.dataset.employer, 'amazon');
  click(dom, 'a[data-page="about"]'); assert.equal(current(dom), 'about');
  click(dom, 'a[data-page="experience"]'); assert.equal(current(dom), 'experience');
  dom.window.close();
});
test('advance control cycles through all four marks and returns to first', () => {
  const dom = app();
  for (const employer of ['synchrony', 'amazon', 'bcbs', 'unassigned', 'synchrony']) {
    click(dom, '[data-next-employer]');
    assert.equal(dom.window.location.hash, `#/experience/${employer}`);
  }
  dom.window.close();
});
test('unknown logo is not silently attributed to an employer', () => {
  const dom = app('#/experience/unassigned');
  const panel = dom.window.document.querySelector('[data-employer-panel="unassigned"]');
  assert.match(panel.textContent, /identity.*confirm/i);
  assert.doesNotMatch(panel.textContent, /Prenosis/);
  dom.window.close();
});
test('draft source boundaries retain dates and omit disputed current roles, private contacts, and metrics', () => {
  const html = load('figma/index.html');
  for (const period of ['May 2019', 'Aug 2019', 'Aug 2018', 'Jan 2019', 'Jun 2018']) assert.ok(html.includes(period));
  assert.doesNotMatch(html, /Present|\+?1?\s*\(331\)|@gmail\.com|84\.8%|500\+|200\+/);
  assert.match(html, /noindex, nofollow/);
  assert.ok(!/fetch\(/.test(script()), 'private career draft must not request third-party data');
});
test('styles preserve the exact desktop shell with responsive and accessibility rules', () => {
  const css = load('figma/portfolio.css');
  for (const contract of ['Inter', '1440px', '900px', '198px', '41px', '12px', '700', '#fbc600', '#ff9900', '#0094d7', '#c0162f', ':focus-visible', 'prefers-reduced-motion', 'max-width: 700px']) assert.ok(css.includes(contract), contract);
  assert.doesNotMatch(css, /img\s*\{[^}]*width:\s*100%/s, 'do not override exported SVG root dimensions');
});
test('all linked local assets and resource targets exist, with no temporary Figma URLs', () => {
  const dom = app(); const doc = dom.window.document;
  for (const node of doc.querySelectorAll('img[src],link[rel="stylesheet"],script[src]')) {
    const source = node.getAttribute('src') || node.getAttribute('href');
    assert.ok(!source.startsWith('http'));
    assert.ok(fs.statSync(path.resolve(root, 'figma', source)).size > 0, source);
  }
  assert.doesNotMatch(load('figma/index.html') + load('figma/portfolio.css') + script(), /figma\.com\/api\/mcp\/asset/);
  for (const anchor of doc.querySelectorAll('[data-screen="resources"] a[href]')) {
    const href = anchor.getAttribute('href');
    if (!href.startsWith('http')) assert.ok(fs.existsSync(path.resolve(root, 'figma', href)), href);
  }
  dom.window.close();
});
test('duplicate initialization does not register duplicate event handlers', () => {
  const dom = app(); const before = dom.window.history.length;
  dom.window.FigmaPortfolio.initFigmaPortfolio(dom.window.document, dom.window);
  click(dom, '[data-employer="bcbs"]');
  assert.equal(dom.window.history.length, before + 1);
  dom.window.close();
});

test('skip link focuses content without losing the active page or employer route', () => {
  for (const hash of ['#/about', '#/experience/amazon']) {
    const dom = app(hash); const doc = dom.window.document;
    click(dom, '.skip-link');
    assert.equal(dom.window.location.hash, hash);
    assert.equal(doc.activeElement.id, 'main');
    assert.equal(current(dom), hash.includes('about') ? 'about' : 'experience');
    if (hash.includes('amazon')) assert.equal(doc.querySelector('#panel-amazon').hidden, false);
    dom.window.close();
  }
});
test('history never leaves keyboard focus trapped inside a newly hidden role panel', async () => {
  const dom = app('#/experience/synchrony'); const doc = dom.window.document;
  click(dom, '[data-employer="amazon"]'); doc.querySelector('#panel-amazon').focus();
  const done = new Promise((resolve) => dom.window.addEventListener('popstate', () => setTimeout(resolve, 0), { once: true }));
  dom.window.history.back(); await done;
  assert.equal(doc.querySelector('#panel-synchrony').hidden, false);
  assert.equal(doc.activeElement.closest('[hidden]'), null);
  assert.equal(doc.activeElement.id, 'main');
  dom.window.close();
});

test('all recovered static SVGs retain exact bytes and intrinsic dimensions at their callsites', () => {
  const { createHash } = require('node:crypto');
  const manifest = JSON.parse(load('figma/assets/manifest.json'));
  const dom = app(); const doc = dom.window.document;
  assert.equal(manifest.assets.length, 9);
  for (const asset of manifest.assets) {
    const bytes = fs.readFileSync(path.join(root, 'figma/assets', asset.file));
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    const images = doc.querySelectorAll(`img[src="./assets/${asset.file}"]`);
    assert.equal(images.length, 1, asset.file);
    assert.equal(images[0].getAttribute('width'), String(asset.width));
    assert.equal(images[0].getAttribute('height'), String(asset.height));
  }
  assert.deepEqual(manifest.missing.map((asset) => asset.node), ['319:65', '326:99']);
  dom.window.close();
});
