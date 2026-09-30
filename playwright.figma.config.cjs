const { defineConfig } = require('@playwright/test');
const remote = Boolean(process.env.FIGMA_PORTFOLIO_BASE_URL);
module.exports = defineConfig({
  testDir: './tests', testMatch: /figma\.e2e\.spec\.cjs/, timeout: 30000,
  fullyParallel: true, retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'receipts/figma/playwright-report', open: 'never' }]],
  outputDir: 'receipts/figma/test-results',
  use: { baseURL: process.env.FIGMA_PORTFOLIO_BASE_URL || 'http://127.0.0.1:4178/portfolio/dev/figma/', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'figma-desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'figma-mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'figma-narrow', use: { browserName: 'chromium', viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
  ],
  webServer: remote ? undefined : { command: 'node tests/figma-server.cjs', url: 'http://127.0.0.1:4178/portfolio/dev/figma/', reuseExistingServer: false, timeout: 15000 },
});
