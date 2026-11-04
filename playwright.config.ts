import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against:
 * - a local dev server (default), started automatically on E2E_PORT (4200
 *   unless set, so parallel worktrees each test their own code), or
 * - a deployed URL, such as a PR preview, when E2E_BASE_URL is set.
 */
const externalBaseUrl = process.env['E2E_BASE_URL'];
const port = process.env['E2E_PORT'] ?? '4200';
const baseURL = externalBaseUrl ?? `http://localhost:${port}`;
const isCI = Boolean(process.env['CI']);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Woodworkers use the app on a phone in the shop as much as on a desktop.
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `pnpm start --port ${port}`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
