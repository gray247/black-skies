import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const disableAnimations = process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1' || !!process.env.CI;
const retriesFromEnv = Number.parseInt(process.env.PLAYWRIGHT_RETRIES ?? '', 10);
const resolvedRetries = Number.isFinite(retriesFromEnv)
  ? Math.max(0, retriesFromEnv)
  : process.env.CI
    ? 2
    : 0;
const reportRoot =
  process.env.PLAYWRIGHT_OUTPUT_DIR ??
  process.cwd();
const resultsRoot = path.join(reportRoot, 'test-results');
const htmlReportFolder = path.join(reportRoot, 'playwright-report');

if (disableAnimations) {
  process.env.PLAYWRIGHT_DISABLE_ANIMATIONS = '1';
}

// Avoid contradictory color env vars that produce noisy Node warnings in test output.
if (process.env.FORCE_COLOR && process.env.NO_COLOR) {
  delete process.env.NO_COLOR;
}

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: fileURLToPath(new URL('../scripts/playwright_pipe_preflight.mjs', import.meta.url)),
  outputDir: resultsRoot,
  timeout: 90_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  retries: resolvedRetries,
  reporter: [['list'], ['html', { open: 'never', outputFolder: htmlReportFolder }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'off',
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
