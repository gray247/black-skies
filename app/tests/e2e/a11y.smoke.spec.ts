import { injectAxe, checkA11y } from '@axe-core/playwright';

import { test } from './electron.launch';

test.describe('Accessibility smoke', () => {
  test('project home', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
});
