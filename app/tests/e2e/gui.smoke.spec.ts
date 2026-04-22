import { test, expect } from './_electron.fixture';
import { loadSampleProject } from './utils/sampleProject';

// HARNESS_ONLY:
// Reason: basic packaged-renderer boot smoke for UI presence.
// Owner: app/tests/e2e/gui.smoke.spec.ts
// Retire when: no separate harness smoke lane is needed.

const { projectRoot: sampleProjectPath } = loadSampleProject();

test('boots packaged renderer', async ({ page }) => {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((projectPath) => {
    window.__dev?.setProjectDir?.(projectPath ?? null);
  }, sampleProjectPath);

  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('button', { name: /open project/i })).toBeVisible({ timeout: 30000 });
});
