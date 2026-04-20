import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

import { test } from './electron.launch';

// HARNESS_ONLY:
// Reason: accessibility smoke in packaged harness mode, not backend truth-lane authority.
// Owner: app/tests/e2e/a11y.smoke.spec.ts
// Retire when: replaced by equivalent a11y assertions in a real-service truth lane.

test.describe('Accessibility smoke', () => {
  test('project home', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const results = await new AxeBuilder({ page })
      .setLegacyMode(true)
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
  });
});
