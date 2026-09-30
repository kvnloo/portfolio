import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import test from 'node:test';
const html = await readFile(new URL('../work/quackles/index.html', import.meta.url), 'utf8');
const doc = new JSDOM(html).window.document;
const manifest = JSON.parse(await readFile(new URL('../shared/portfolio-manifest.preview.json', import.meta.url), 'utf8'));

test('Quackles metrics retain units and distinct descriptive labels in the parsed DOM', () => {
  const metrics = [...doc.querySelectorAll('.metric-grid > .metric')];
  assert.equal(metrics.length, 4);
  const expected = [
    ['201.284 MP', 'source master'],
    ['1,055', 'published WebP tiles'],
    ['≤64 MiB', 'mobile decoded-cache policy'],
    ['≤2 jobs', 'mobile concurrent decode policy'],
  ];
  metrics.forEach((metric, i) => {
    assert.equal(metric.children.length, 2, `metric ${i} needs a value and sibling label`);
    assert.equal(metric.children[0].tagName, 'STRONG');
    assert.equal(metric.children[1].tagName, 'SPAN');
    assert.equal(metric.children[0].textContent.replace(/\s+/g, ' ').trim(), expected[i][0]);
    assert.equal(metric.children[1].textContent.trim(), expected[i][1]);
  });
});

test('historical Quackles receipts do not certify current deployment health', () => {
  const project = manifest.projects.find(p => p.id === 'quackles');
  assert.equal(project.health, 'unknown');
  for (const claim of project.claims) assert.equal(claim.temporalScope, 'historical-revision');
  const note = doc.querySelector('#historical-scope');
  assert.ok(note, 'historical scope must be visible near the case-study introduction');
  assert.match(note.textContent, /September 21, 2026/);
  assert.match(note.textContent.replace(/\s+/g, ' '), /current live deployment has not been revalidated/i);
  assert.doesNotMatch(doc.querySelector('.case-body').textContent, /Browser acceptance now|Verification includes/);
});
