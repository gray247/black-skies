import { test, expect } from './_electron.fixture';
import { TID } from '../../renderer/utils/testIds';

test.describe('Visual snapshots', () => {
  test('home screen', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(
      () => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true,
      null,
      { timeout: 30_000 },
    );
    await page.getByTestId('app-root').waitFor({ timeout: 30_000 });
    await page.evaluate(() => {
      const overlay = document.querySelector('[data-testid="companion-overlay"]') as
        | HTMLElement
        | null;
      if (overlay) {
        overlay.style.display = 'none';
      }
    });
    await page.getByTestId('dock-workspace').waitFor({ timeout: 30_000 });
    await page.waitForSelector('[data-testid="visual-home-ready"]', { state: 'attached' });
    const openProjectButton = page.getByTestId(TID.openProjectBtn);
    await expect(openProjectButton).toBeVisible();
    await expect(openProjectButton).toBeEnabled();
    await expect(openProjectButton).toHaveText('Open project...');
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});
