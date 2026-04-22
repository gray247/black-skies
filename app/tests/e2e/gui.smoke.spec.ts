import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, expect } from './_electron.fixture';

// HARNESS_ONLY:
// Reason: basic packaged-renderer boot smoke for UI presence.
// Owner: app/tests/e2e/gui.smoke.spec.ts
// Retire when: no separate harness smoke lane is needed.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleProjectPath = path.resolve(__dirname, '../../sample_project/Esther_Estate');

test('boots packaged renderer', async ({ page }) => {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((projectPath) => {
    window.__dev?.setProjectDir?.(projectPath ?? null);
  }, sampleProjectPath);

  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('button', { name: /open project/i })).toBeVisible({ timeout: 30000 });
});
