import { expect, test } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';

// HARNESS_ONLY:
// Reason: responsive ProjectHome layout regression coverage under the Electron harness.
// Owner: app/tests/e2e/project-home-layout.spec.ts
// Retire when: ProjectHome responsive sizing is exercised by a broader layout harness.

test.describe('ProjectHome layout recovery', () => {
  test('keeps the scene metadata sidebar usable in a narrow window', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await page.setViewportSize({ width: 700, height: 900 });
    await bootstrapHarness(page, { expectedMode: 'flat' });

    const layout = page.locator('.project-home__layout');
    const main = page.locator('.project-home__main');
    const sidebar = page.locator('.project-home__sidebar');

    await expect(layout).toBeVisible({ timeout: 30_000 });
    await expect(main).toBeVisible();
    await expect(sidebar).toBeVisible();
    await sidebar.scrollIntoViewIfNeeded();

    const [mainBox, sidebarBox] = await Promise.all([main.boundingBox(), sidebar.boundingBox()]);
    expect(mainBox).not.toBeNull();
    expect(sidebarBox).not.toBeNull();
    expect(sidebarBox!.width).toBeGreaterThanOrEqual(280);
  });
});
