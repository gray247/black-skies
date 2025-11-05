import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

import { test } from './electron.launch';

test.describe('Accessibility smoke', () => {
  test('project home', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const results = await new AxeBuilder({ page })
      .setLegacyMode(true)
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toHaveLength(0);
  });
});
