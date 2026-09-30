const { test, expect } = require('@playwright/test');
const sections = ['about', 'contact', 'experience', 'services', 'resources'];
const employers = ['synchrony', 'amazon', 'bcbs', 'unassigned'];

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
  await page.keyboard.press('End'); await expect(page.locator('[data-employer="unassigned"]')).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(page.locator('[data-employer="synchrony"]')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.locator('[data-overview]')).toBeVisible();
  await page.keyboard.press('Space'); await expect(page.locator('#panel-synchrony')).toBeVisible();
});
test('desktop shell and recovered SVGs occupy exact original design slots', async ({ page }, info) => {
  test.skip(info.project.name !== 'figma-desktop', '1440 × 900 authored reference only');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./'); await page.evaluate(() => document.fonts.ready);
  const expectedNav = { about: 198, contact: 359, experience: 531, services: 793, resources: 966 };
  for (const [key, x] of Object.entries(expectedNav)) {
    const box = await page.locator(`.primary-nav [data-page="${key}"]`).boundingBox();
    expect(box.x).toBeCloseTo(x, 0); expect(box.y).toBeCloseTo(41, 0);
  }
  const boxes = [ ['.synchrony-mark', 24, 291, 54, 54], ['.synchrony-outline', 25.02, 288, 52, 60], ['.employer--amazon .employer-art', 11, 356, 78, 78], ['.employer--unassigned .employer-art', 12, 542, 78, 78] ];
  for (const [selector, x, y, width, height] of boxes) {
    const box = await page.locator(selector).boundingBox();
    expect(box.x).toBeCloseTo(x, 0); expect(box.y).toBeCloseTo(y, 0); expect(box.width).toBe(width); expect(box.height).toBe(height);
  }
  await page.locator('[data-employer="synchrony"]').click();
  for (const [key, y] of [['amazon', 369], ['bcbs', 405], ['unassigned', 441]]) {
    const box = await page.locator(`[data-employer="${key}"] .employer-dot`).boundingBox();
    expect(box.x).toBe(45); expect(box.y).toBe(y); expect(box.width).toBe(12);
  }
  await page.locator('[data-employer="amazon"]').click();
  for (const [key, y] of [['synchrony', 282], ['bcbs', 420], ['unassigned', 456]]) {
    const box = await page.locator(`[data-employer="${key}"] .employer-dot`).boundingBox();
    expect(box.x).toBe(45); expect(box.y).toBe(y); expect(box.width).toBe(12);
  }
});
test('small screens retain usable touch targets and avoid overlapping rail hit regions', async ({ page }, info) => {
  await page.goto('./#/experience/synchrony');
  const boxes = await page.locator('[data-employer]').evaluateAll((nodes) => nodes.map((node) => {
    const b = node.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height };
  }));
  for (const box of boxes) { expect(box.width).toBeGreaterThanOrEqual(24); expect(box.height).toBeGreaterThanOrEqual(24); }
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
  for (const route of ['experience', 'experience/synchrony', 'experience/amazon', 'resources']) {
    await page.goto(`./#/${route}`); await page.evaluate(() => document.fonts.ready);
    const [section, employer] = route.split('/');
    await expect(page.locator(`[data-screen="${section}"]`)).toBeVisible();
    if (employer) await expect(page.locator(`[data-employer="${employer}"]`)).toHaveAttribute('aria-selected', 'true');
    await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}.png`), fullPage: true, animations: 'disabled' });
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
