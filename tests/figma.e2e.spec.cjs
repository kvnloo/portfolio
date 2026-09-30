const { test, expect } = require('@playwright/test');
const sections = ['about', 'contact', 'experience', 'services', 'resources'];
const employers = ['synchrony', 'amazon', 'bcbs'];

test('every section fits the viewport and loads all local assets without errors', async ({ page }) => {
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./'); await page.evaluate(() => document.fonts.ready);
  for (const section of sections) {
    await page.locator(`.primary-nav [data-page="${section}"]`).click();
    await expect(page.locator(`[data-screen="${section}"]`)).toBeVisible();
    await expect(page.locator('.primary-nav [aria-current="page"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(await page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  expect(errors).toEqual([]);
});
test('employer clicks, repeated selection, Close, Back, and Forward preserve route state', async ({ page }) => {
  await page.goto('./');
  await page.locator('[data-employer="synchrony"]').click();
  await expect(page.locator('#panel-synchrony')).toBeVisible();
  const count = await page.evaluate(() => history.length);
  await page.locator('[data-employer="synchrony"]').click();
  expect(await page.evaluate(() => history.length)).toBe(count);
  await page.locator('[data-employer="amazon"]').click();
  await expect(page.locator('#panel-amazon')).toBeVisible();
  await page.goBack(); await expect(page.locator('#panel-synchrony')).toBeVisible();
  await page.goForward(); await expect(page.locator('#panel-amazon')).toBeVisible();
  await page.locator('[data-show-overview]').click();
  await expect(page.locator('[data-overview]')).toBeVisible();
  await expect(page.locator('[data-employer="amazon"]')).toBeFocused();
  await page.locator('[data-page="contact"]').click();
  await page.goBack(); await expect(page.locator('[data-overview]')).toBeVisible();
});
test('deep links and reload restore each employer panel', async ({ page }) => {
  for (const employer of employers) {
    await page.goto(`./#/experience/${employer}`); await page.reload();
    await expect(page.locator(`#panel-${employer}`)).toBeVisible();
    await expect(page.locator(`[data-employer="${employer}"]`)).toHaveAttribute('aria-selected', 'true');
  }
  await page.goto('./#/experience/not-real');
  await expect(page).toHaveURL(/#\/experience$/);
  await expect(page.locator('[data-overview]')).toBeVisible();
});
test('employer rail is keyboard-operable with an unambiguous focus target', async ({ page }) => {
  await page.goto('./');
  await page.locator('[data-employer="synchrony"]').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-employer="amazon"]')).toBeFocused();
  await expect(page.locator('#panel-amazon')).toBeVisible();
  await page.keyboard.press('End'); await expect(page.locator('[data-employer="bcbs"]')).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(page.locator('[data-employer="synchrony"]')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.locator('[data-overview]')).toBeVisible();
  await page.keyboard.press('Space'); await expect(page.locator('#panel-synchrony')).toBeVisible();
});
test('editorial overview has three legible stories and preserves original asset dimensions', async ({ page }, info) => {
  await page.goto('./'); await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.role-index-link')).toHaveCount(3);
  await expect(page.locator('.wordmark')).toContainText('Kevin Rajan');
  for (const selector of ['.synchrony-mark', '.synchrony-outline', '.employer--amazon .employer-art']) {
    const image = page.locator(selector);
    if (info.project.name === 'figma-desktop') {
      const size = await image.boundingBox();
      expect(size.width).toBe(Number(await image.getAttribute('width')));
      expect(size.height).toBe(Number(await image.getAttribute('height')));
    }
  }
  if (info.project.name === 'figma-desktop') {
    const last = await page.locator('.role-index-link').last().boundingBox();
    expect(last.y + last.height).toBeLessThan(900);
  }
});
test('small screens retain usable touch targets and avoid overlapping rail hit regions', async ({ page }, info) => {
  await page.goto('./#/experience/synchrony');
  const boxes = await page.locator('[data-employer]').evaluateAll((nodes) => nodes.map((node) => {
    const b = node.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height };
  }));
  for (const box of boxes) { expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44); }
  for (let i = 0; i < boxes.length - 1; i++) {
    if (info.project.name === 'figma-desktop') expect(boxes[i].bottom).toBeLessThanOrEqual(boxes[i + 1].top);
    else expect(boxes[i].right).toBeLessThanOrEqual(boxes[i + 1].left);
  }
  await expect(page.getByRole('tablist')).toHaveAttribute('aria-orientation', info.project.name === 'figma-desktop' ? 'vertical' : 'horizontal');
});
test('reduced motion disables rail transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('./');
  expect(await page.locator('[data-employer="amazon"]').evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
});
test('all reference states produce inspectable review screenshots', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['experience', 'experience/synchrony', 'experience/amazon', 'experience/bcbs', 'about', 'resources']) {
    await page.goto(`./#/${route}`); await page.evaluate(() => document.fonts.ready);
    const [section, employer] = route.split('/');
    await expect(page.locator(`[data-screen="${section}"]`)).toBeVisible();
    if (employer) await expect(page.locator(`[data-employer="${employer}"]`)).toHaveAttribute('aria-selected', 'true');
    await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}.png`), fullPage: true, animations: 'disabled' });
    if (employer) {
      await page.locator(`#panel-${employer} [data-focus="1"]`).click();
      await expect(page.locator(`#panel-${employer}`)).toHaveAttribute('data-focus', '1');
      await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}-second-focus.png`), fullPage: true, animations: 'disabled' });
    }
  }
});

test('skip link preserves the route and history restores focus out of hidden panels', async ({ page }) => {
  await page.goto('./#/experience/amazon');
  await page.locator('.skip-link').focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/experience\/amazon$/);
  await expect(page.locator('#main')).toBeFocused();
  await page.locator('[data-employer="synchrony"]').click();
  await page.locator('#panel-synchrony').focus(); await page.goBack();
  await expect(page.locator('#panel-amazon')).toBeVisible();
  await expect(page.locator('#main')).toBeFocused();
});

test('navigation target positions stay stable when the active label changes', async ({ page }) => {
  await page.goto('./'); await page.evaluate(() => document.fonts.ready);
  const positions = () => page.locator('.primary-nav a').evaluateAll(links => links.map(link => { const r = link.getBoundingClientRect(); return { x: r.x, y: r.y }; }));
  const before = await positions();
  for (const section of ['about', 'resources', 'services', 'experience']) {
    await page.locator(`.primary-nav [data-page="${section}"]`).click();
    expect(await positions()).toEqual(before);
  }
});


test('contribution controls are immediate, reversible and stable through rapid input', async ({ page }) => {
  await page.goto('./#/experience/amazon');
  const panel = page.locator('#panel-amazon');
  const first = panel.locator('button[data-focus="0"]');
  const second = panel.locator('button[data-focus="1"]');
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))); });
  await second.scrollIntoViewIfNeeded();
  const geometry = locator => locator.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; });
  const before = await geometry(second);
  await second.click();
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.locator('[data-contribution="1"]')).toBeVisible();
  expect(await geometry(second)).toEqual(before);
  await first.click(); await second.click(); await first.click();
  await expect(panel).toHaveAttribute('data-focus', '0');
  await expect(panel.locator('[data-contribution="0"]')).toBeVisible();
  await expect(panel.locator('[data-contribution="1"]')).toBeHidden();
  await second.focus(); await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-focus', '1');
  await page.locator('[data-employer="synchrony"]').click();
  await page.goBack();
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-focus', '1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('illustrations remain semantic and stable with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const employer of employers) {
    await page.goto(`./#/experience/${employer}`);
    await page.evaluate(() => document.fonts.ready);
    const panel = page.locator(`#panel-${employer}`);
    await expect(panel.locator('figcaption')).toContainText('Illustrative model');
    await panel.locator('button[data-focus="1"]').click();
    await expect(panel.locator('[data-contribution="1"]')).toBeVisible();
    expect(await panel.locator('[data-contribution="1"]').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    const geometry = () => panel.locator('figure').evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; });
    const figure = await geometry();
    await panel.locator('button[data-focus="0"]').click();
    expect(await geometry()).toEqual(figure);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test('runtime is local-only and keeps a small script and style budget', async ({ page }) => {
  const requested = [];
  page.on('request', request => requested.push(request.url()));
  await page.goto('./'); await page.evaluate(() => document.fonts.ready);
  const origin = new URL(page.url()).origin;
  expect(requested.every(url => new URL(url).origin === origin)).toBe(true);
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /portfolio\.(js|css)/.test(e.name)).map(e => ({ name: e.name, size: e.decodedBodySize })));
  expect(resources).toHaveLength(2);
  for (const resource of resources) expect(resource.size).toBeLessThan(resource.name.endsWith('.js') ? 12000 : 32000);
});


test('opening another story after scrolling returns to its heading', async ({ page }) => {
  await page.goto('./#/experience/amazon');
  await page.locator('#panel-amazon .case-end a').click();
  await expect(page.locator('#panel-bcbs')).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('#main')).toBeFocused();
});
