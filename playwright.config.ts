import { defineConfig, devices } from '@playwright/test';
const external = process.env.E2E_BASE_URL;
if (external && !['localhost', '127.0.0.1'].includes(new URL(external).hostname))
  throw new Error('External E2E target must be local');
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: external || 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
          : {},
      },
    },
  ],
  webServer: external
    ? undefined
    : {
        command: 'node scripts/e2e-server.mjs',
        url: 'http://localhost:3100',
        reuseExistingServer: false,
        timeout: 120000,
      },
});
