import { test, expect } from './_electron.fixture';
import { bootstrapHarness, waitForServiceStatus } from './_bootstrap';
import { TID } from '../../renderer/utils/testIds';

// HARNESS_ONLY:
// Reason: verifies insights UX behavior under harness-controlled connectivity toggles.
// Owner: app/tests/e2e/gui.insights.spec.ts
// Retire when: equivalent insights truth-path assertions exist in real-service lane.

test('queues model insights offline and resumes when online', async ({ page }) => {
  await bootstrapHarness(page, {
    requiredEnabledActions: ['workspace-action-companion'],
  });
  await expect(page.getByTestId(TID.dockWorkspace)).toBeVisible({ timeout: 30_000 });
  const companionToggle = page.getByTestId('workspace-action-companion');
  await expect(companionToggle).toBeVisible({ timeout: 30_000 });
  await expect(companionToggle).toBeEnabled({ timeout: 30_000 });
  await companionToggle.click();
  await expect(page.getByTestId('insights-toolbar')).toBeVisible({ timeout: 30_000 });

  await page.waitForFunction(() =>
    Boolean(
      (
        window as typeof window & {
          __testInsights?: { setServiceStatus?: unknown };
        }
      ).__testInsights?.setServiceStatus,
    ),
  );

  await page.evaluate(() => {
    const win = window as typeof window & {
      __testInsights?: {
        selectScene?: (sceneId: string) => void;
        setServiceStatus?: (status: 'online' | 'offline') => void;
      };
    };
    win.__testInsights?.selectScene?.('sc_0001');
    win.__testInsights?.setServiceStatus?.('offline');
  });
  await waitForServiceStatus(page, { status: 'offline', reason: 'test-offline' });

  const runAllInsights = page.getByRole('button', { name: /run all insights/i });
  await expect(runAllInsights).toBeEnabled({ timeout: 30_000 });
  await runAllInsights.click();

  await expect(page.getByTestId('insights-local-ran')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('insights-model-queued')).toBeVisible({ timeout: 30_000 });

  await page.evaluate(() => {
    const win = window as typeof window & {
      __testInsights?: { setServiceStatus?: (status: 'online' | 'offline') => void };
    };
    win.__testInsights?.setServiceStatus?.('online');
  });
  await waitForServiceStatus(page, { status: 'online', reason: 'online' });

  await expect(page.getByTestId('insights-model-resumed')).toBeVisible({ timeout: 30_000 });
});
