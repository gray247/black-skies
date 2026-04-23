import { test, expect } from './_electron.fixture';
import { bootstrapHarness, waitForServiceStatus } from './_bootstrap';

// HARNESS_ONLY:
// Reason: validates cached analytics UX in local/offline harness conditions.
// Owner: app/tests/e2e/gui.analytics_offline_cache_flow.spec.ts
// Retire when: offline-cache assertions are covered by a real-service diagnostics lane.

test('analytics offline cache flow keeps cached metrics visible', async ({ page }) => {
  await bootstrapHarness(page, {
    requiredEnabledActions: ['workspace-action-companion'],
  });

  await expect(page.getByTestId('dock-workspace')).toBeVisible({ timeout: 30_000 });

  const companionToggle = page.getByTestId('workspace-action-companion');
  await expect(companionToggle).toBeVisible({ timeout: 30_000 });
  await expect(companionToggle).toBeEnabled({ timeout: 30_000 });
  await companionToggle.click();
  await expect(page.getByTestId('insights-toolbar')).toBeVisible({ timeout: 30_000 });

  await page
    .locator('.analytics-dashboard__readability-badge')
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
  await page.getByText(/Dialogue ratio/).waitFor({ timeout: 30_000 });
  await page
    .locator('.analytics-dashboard__pacing-strip span')
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
  await expect(page.getByTestId('analytics-emotion-graph')).toBeVisible();

  await page.evaluate(() => {
    window.__dev?.overrideServices?.({
      async checkHealth() {
        throw new Error('offline');
      },
    });
    const event = new CustomEvent('test:service-health', {
      detail: { status: 'offline' },
    });
    document.dispatchEvent(event);
    window.dispatchEvent(event);
  });

  await waitForServiceStatus(page, { status: 'offline', reason: 'test-offline' });

  const offlineBanner = page.getByTestId('analytics-offline-banner').first();
  await expect(offlineBanner).toBeVisible({ timeout: 30_000 });

  await expect(page.locator('.analytics-dashboard__readability-badge').first()).toBeVisible();
  await expect(page.locator('.analytics-dashboard__pacing-strip span').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Corkboard' }).first()).toBeVisible();
  await expect(page.locator('.corkboard-card').first()).toBeVisible();

  await page.evaluate(() => {
    window.__dev?.overrideServices?.({
      async checkHealth() {
        return {
          ok: true,
          data: { status: 'online' },
        };
      },
    });
    const event = new CustomEvent('test:service-health', {
      detail: { status: 'online' },
    });
    document.dispatchEvent(event);
    window.dispatchEvent(event);
  });

  await waitForServiceStatus(page, { status: 'online', reason: 'online' });
  await expect(page.getByTestId('analytics-emotion-graph')).toBeVisible();
});
