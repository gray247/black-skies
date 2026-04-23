import { test, expect } from './_electron.fixture';
import { bootstrapHarness, ensureDockPaneVisible } from './_bootstrap';

// HARNESS_ONLY:
// Reason: protects layout regression behavior in harness environment.
// Owner: app/tests/e2e/layout-no-floating-panes.spec.ts
// Retire when: layout restore policy is fully asserted in truth-lane tests.

test.describe('Layout regression: no floating panes', () => {
  test('does not auto-spawn floating panes on project load', async ({ page, electronApp }) => {
    await bootstrapHarness(page);

    // Ensure only the primary window is present.
    expect(electronApp.windows().length).toBe(1);

    await page.waitForSelector('[data-testid="dock-workspace"]', { timeout: 30_000 });

    const floatingSelectors = [
      '[data-testid*="float"]',
      '.float-window',
      '[role="dialog"]',
      '.floating-window',
    ];
    for (const selector of floatingSelectors) {
      const elements = await page.locator(selector).all();
      expect(elements.length, `Unexpected floating selector: ${selector}`).toBe(0);
    }

    // Layout persistence may start some panes hidden; contract is that core panes are
    // dock-visible or recoverable from Hidden panes without spawning floating windows.
    await ensureDockPaneVisible(page, { paneId: 'outline', hiddenLabel: 'Outline' });
    await ensureDockPaneVisible(page, { paneId: 'draftPreview', hiddenLabel: 'Draft preview' });
    await ensureDockPaneVisible(page, { paneId: 'storyInsights', hiddenLabel: 'Story Insights' });
    await ensureDockPaneVisible(page, { paneId: 'corkboard', hiddenLabel: 'Corkboard' });

    await expect(page.locator('[data-pane-id="outline"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-pane-id="draftPreview"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-pane-id="storyInsights"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-pane-id="corkboard"]')).toBeVisible({ timeout: 30_000 });

    await expect(page.getByRole('heading', { name: /Story Insights/i })).toBeVisible();
    await expect(page.locator('[data-pane-id="relationshipGraph"]')).toHaveCount(0);
    await expect(page.locator('[data-pane-id="timeline"]')).toHaveCount(0);
  });
});
