import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const disableAnimations = process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1' || !!process.env.CI;
const reportRoot =
  process.env.PLAYWRIGHT_OUTPUT_DIR ??
  path.join(os.tmpdir(), 'black-skies-playwright', randomUUID());
const resultsRoot = path.join(reportRoot, 'test-results');
const htmlReportFolder = path.join(reportRoot, 'html-report');

if (disableAnimations) {
  process.env.PLAYWRIGHT_DISABLE_ANIMATIONS = '1';
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
  retries: process.env.CI ? 2 : 0,
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
