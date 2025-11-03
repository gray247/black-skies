import { test, expect } from './electron.launch';
import { TID } from '../../renderer/utils/testIds';

test.describe('Visual snapshots', () => {
  test('home screen', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId(TID.openProjectBtn)).toBeVisible();
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});
