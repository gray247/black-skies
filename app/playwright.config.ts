import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm --filter app dev -- --host 127.0.0.1 --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
