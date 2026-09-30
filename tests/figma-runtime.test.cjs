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
  dom.window.scrollTo = () => {};
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
  key('End'); assert.equal(doc.activeElement.dataset.employer, 'bytebros');
  key('ArrowRight'); assert.equal(doc.activeElement.dataset.employer, 'zero');
  key('Home'); assert.equal(doc.activeElement.dataset.employer, 'zero');
  key('Escape'); assert.equal(dom.window.location.hash, '#/experience');
  assert.equal(doc.querySelector('[data-overview]').hidden, false);
  assert.equal(doc.querySelectorAll('[data-employer][tabindex="0"]').length, 1);
  dom.window.close();
});
test('close restores overview and focus without resetting subsequent navigation', () => {
  const dom = app('#/experience/amazon'); click(dom, '[data-show-overview]');
  assert.equal(dom.window.location.hash, '#/experience');
  assert.equal(dom.window.document.activeElement.dataset.story, 'amazon');
  click(dom, 'a[data-page="about"]'); assert.equal(current(dom), 'about');
  click(dom, 'a[data-page="experience"]'); assert.equal(current(dom), 'experience');
  dom.window.close();
});
test('advance control cycles through every career chapter and returns to first', () => {
  const dom = app();
  for (const employer of ['zero', 'outlier', 'sabbatical', 'slalom', 'synchrony', 'amazon', 'bcbs', 'prenosis', 'wipro', 'bytebros', 'zero']) {
    click(dom, '[data-next-employer]');
    assert.equal(dom.window.location.hash, `#/experience/${employer}`);
  }
  dom.window.close();
});
test('source boundaries retain corroborated dates and omit private contacts and unverified metrics', () => {
  const html = load('figma/index.html');
  for (const period of ['May 2019', 'Aug 2019', 'Aug 2018', 'Jan 2019', 'Jun 2018']) assert.ok(html.includes(period));
  assert.doesNotMatch(html, /\+?1?\s*\(331\)|@gmail\.com|84\.8%|500\+|200\+/);
  assert.match(html, /noindex, nofollow/);
  assert.ok(!/fetch\(/.test(script()), 'private career draft must not request third-party data');
});
test('editorial styles retain source accents, responsive layout, focus and reduced-motion rules', () => {
  const css = load('figma/portfolio.css');
  for (const contract of ['Inter', 'Georgia', '1440px', '#fbc600', '#ff9900', '#0094d7', ':focus-visible', 'prefers-reduced-motion', 'max-width: 700px']) assert.ok(css.includes(contract), contract);
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
    if (!href.startsWith('http') && !href.startsWith('#/')) assert.ok(fs.existsSync(path.resolve(root, 'figma', href)), href);
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
    assert.equal(images.length, ['unidentified-tile.svg', 'dot-unidentified.svg', 'dot-synchrony.svg', 'dot-amazon.svg', 'dot-bcbs.svg'].includes(asset.file) ? 0 : 1, asset.file);
    for (const image of images) {
      assert.equal(image.getAttribute('width'), String(asset.width));
      assert.equal(image.getAttribute('height'), String(asset.height));
    }
  }
  assert.deepEqual(manifest.missing.map((asset) => asset.node), ['319:65', '326:99']);
  dom.window.close();
});

test('employer state never turns the document root into a tab or focus target', () => {
  const dom = app('#/experience/amazon'); const doc = dom.window.document;
  assert.equal(doc.documentElement.hasAttribute('data-employer'), false);
  assert.equal(doc.documentElement.hasAttribute('aria-selected'), false);
  assert.equal(doc.querySelectorAll('[data-employer="amazon"]').length, 1);
  doc.querySelector('[data-employer="amazon"]').focus();
  doc.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  assert.equal(doc.activeElement.getAttribute('role'), 'tab');
  assert.equal(doc.activeElement.dataset.employer, 'bcbs');
  doc.querySelector('#main').focus();
  doc.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  assert.equal(dom.window.location.hash, '#/experience/bcbs');
  assert.equal(doc.activeElement.id, 'main');
  dom.window.close();
});

test('invalid same-document hash navigation canonicalizes the fallback without extra history', async () => {
  const dom = app('#/experience/amazon');
  const done = new Promise(resolve => dom.window.addEventListener('hashchange', () => setTimeout(resolve, 0), { once: true }));
  const before = dom.window.history.length;
  dom.window.location.hash = '#/experience/not-real'; await done;
  assert.equal(dom.window.location.hash, '#/experience');
  assert.equal(dom.window.history.length, before + 1);
  assert.equal(dom.window.document.querySelector('[data-overview]').hidden, false);
  dom.window.close();
});

test('contribution focus switches the explanation and illustrative model together', () => {
  const dom = app('#/experience/amazon'); const doc = dom.window.document;
  const panel = doc.querySelector('#panel-amazon');
  assert.equal(panel.dataset.focus, '0');
  const toggle = panel.querySelector('[data-focus="1"]');
  assert.ok(toggle, 'an explicit contribution control exists');
  toggle.click();
  assert.equal(panel.dataset.focus, '1');
  assert.equal(toggle.getAttribute('aria-pressed'), 'true');
  assert.equal(panel.querySelector('[data-contribution="1"]').hidden, false);
  assert.equal(panel.querySelector('[data-contribution="0"]').hidden, true);
  assert.match(panel.querySelector('figcaption').textContent, /illustrative model/i);
  assert.equal(dom.window.location.hash, '#/experience/amazon');
  dom.window.close();
});
test('rapid contribution and employer changes leave only the latest view active', async () => {
  const dom = app('#/experience/synchrony'); const doc = dom.window.document;
  for (let i = 0; i < 8; i++) {
    click(dom, '[data-employer="amazon"]');
    click(dom, '#panel-amazon [data-focus="1"]');
    click(dom, '[data-employer="synchrony"]');
    click(dom, '#panel-synchrony [data-focus="1"]');
  }
  await new Promise(resolve => setTimeout(resolve, 350));
  assert.equal(doc.querySelectorAll('[data-employer-panel]:not([hidden])').length, 1);
  assert.equal(doc.querySelector('#panel-synchrony').hidden, false);
  assert.equal(doc.querySelector('#panel-synchrony').dataset.focus, '1');
  assert.equal(doc.querySelector('#panel-amazon').dataset.focus, '1');
  dom.window.close();
});
test('unknown employer has no fabricated public experience or selectable tab', () => {
  const dom = app('#/experience/unassigned'); const doc = dom.window.document;
  assert.equal(doc.querySelector('[data-employer="unassigned"]'), null);
  assert.equal(doc.querySelector('[data-overview]').hidden, false);
  dom.window.close();
});
test('push runs can validate but never enter the protected deployment environment', () => {
  const workflow = load('.github/workflows/deploy-nightly.yml');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /if: \$\{\{ github.event_name == 'workflow_dispatch' && inputs.deploy == true \}\}/);
  assert.match(workflow, /default: false/);
});

test('content and accent colors retain AA contrast on the editorial canvas', () => {
  const luminance = hex => {
    const channels = hex.match(/.{2}/g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return channels.reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  };
  const css = load('figma/portfolio.css');
  const paper = css.match(/--paper: #([a-f0-9]{6})/)[1];
  for (const token of ['--ink', '--muted', '--accent']) {
    for (const match of css.matchAll(new RegExp(`${token}: #([a-f0-9]{6})`, 'g'))) {
      const [dark, light] = [luminance(match[1]), luminance(paper)].sort((a, b) => a - b);
      assert.ok((light + .05) / (dark + .05) >= 4.5, `${token} ${match[1]}`);
    }
  }
});
test('Slalom has substantive primary Experience detail without unsupported metrics', () => {
  const dom = app('#/experience/slalom'); const copy = dom.window.document.querySelector('#panel-slalom').textContent;
  for (const fact of ['Slalom', 'Windows', 'RHEL', 'EC2', 'Terraform', 'Jenkins']) assert.ok(copy.includes(fact));
  assert.doesNotMatch(copy, /500|12 teams|DNA|blood/i);
  dom.window.close();
});

test('a new top-level story opens at its beginning, without smooth-scroll races', () => {
  const dom = app('#/experience/amazon'); const calls = [];
  dom.window.scrollTo = options => calls.push(options);
  click(dom, 'a[data-page="about"]');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].top, 0);
  assert.equal(calls[0].behavior, 'instant');
  dom.window.close();
});

test('the career index covers all ten entries in the supplied resume', () => {
  const dom = app(); const doc = dom.window.document;
  const ids = ['zero','outlier','sabbatical','slalom','synchrony','amazon','bcbs','prenosis','wipro','bytebros'];
  assert.deepEqual([...doc.querySelectorAll('[data-overview] [data-story]')].map(el => el.dataset.story), ids);
  for (const id of ids) {
    click(dom, `[data-story="${id}"]`);
    assert.equal(dom.window.location.hash, `#/experience/${id}`);
    const panel = doc.querySelector(`[data-employer-panel="${id}"]`);
    assert.ok(panel && !panel.hidden, id);
    assert.ok(panel.textContent.trim().length > 200, id);
  }
  dom.window.close();
});
test('fresh resume dates and titles replace the earlier disputed-source fallback', () => {
  const dom = app(); const doc = dom.window.document;
  const expected = {
    zero: ['Founder & CEO','Jun 2024','Present'],
    outlier: ['LLM Training Specialist','Jan 2025','Present'],
    sabbatical: ['Ultralearning','Jul 2023','Jun 2024'],
    slalom: ['Senior Consultant','Jun 2021','Jul 2023'],
    prenosis: ['Jul 2017','Feb 2018'], wipro: ['May 2016','Jul 2016'], bytebros: ['Jan 2016','Jul 2016']
  };
  for (const [id, facts] of Object.entries(expected)) {
    const copy = doc.querySelector(`#panel-${id}`)?.textContent || '';
    for (const fact of facts) assert.ok(copy.includes(fact), `${id}: ${fact}`);
  }
  assert.equal(doc.querySelector('#panel-sabbatical').dataset.careerKind, 'independent-study');
  dom.window.close();
});
test('mobile career selector switches every entry and Back restores the selected value', async () => {
  const dom = app('#/experience/zero'); const doc = dom.window.document;
  const select = doc.querySelector('[data-career-select]'); assert.ok(select);
  select.value = 'outlier'; select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(dom.window.location.hash, '#/experience/outlier');
  assert.equal(doc.querySelector('#panel-outlier').hidden, false);
  const done = new Promise(resolve => dom.window.addEventListener('popstate', () => setTimeout(resolve, 0), { once: true }));
  dom.window.history.back(); await done;
  assert.equal(select.value, 'zero');
  assert.equal(doc.querySelector('#panel-zero').hidden, false);
  dom.window.close();
});
test('Evolve and HackIllinois are reachable from the active portfolio', () => {
  const dom = app(); const doc = dom.window.document;
  assert.ok(doc.querySelector('[data-overview] a[href="#/community"]'));
  click(dom, '[data-overview] a[href="#/community"]');
  assert.equal(current(dom), 'community');
  const copy = doc.querySelector('[data-screen="community"]').textContent;
  for (const fact of ['Evolve','Claude Code','HackIllinois','Git worktrees','check-in','open-source']) assert.ok(copy.includes(fact), fact);
  dom.window.close();
});

test('returning from a later role brings its focused index row into view', () => {
  const dom = app('#/experience/bytebros'); const doc = dom.window.document; const viewed = [];
  doc.querySelector('[data-story="bytebros"]').scrollIntoView = options => viewed.push(options);
  click(dom, '[data-show-overview]');
  assert.equal(doc.activeElement.dataset.story, 'bytebros');
  assert.equal(viewed.length, 1); assert.equal(viewed[0].behavior, 'instant');
  dom.window.close();
});

test('the compact career picker names the chapter without duplicating long titles', () => {
  const dom = app(); const doc = dom.window.document;
  assert.equal(doc.querySelector('[data-career-select] option[value="slalom"]').textContent, 'Slalom Consulting');
  assert.equal(doc.querySelector('[data-career-select] option[value="sabbatical"]').textContent, 'Sabbatical · Ultralearning');
  dom.window.close();
});
