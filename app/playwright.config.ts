import { defineConfig } from '@playwright/test';

const disableAnimations = process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1' || !!process.env.CI;

if (disableAnimations) {
  process.env.PLAYWRIGHT_DISABLE_ANIMATIONS = '1';
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      headless: !!process.env.CI,
      env: {
        ...process.env,
        ...(disableAnimations ? { PLAYWRIGHT_DISABLE_ANIMATIONS: '1' } : {}),
      },
    },
  },
  projects: [
    {
      name: 'electron',
      testMatch: /.*\.spec\.ts/,
      workers: 1,
    },
  ],
  workers: process.env.CI ? 2 : undefined,
});
