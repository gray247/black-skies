import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';
import { TID } from '../../renderer/utils/testIds';

test('snapshot verification flow (UI)', async ({ page }) => {
  await installServiceStubs(page, 'snapshot', 'flat');
  await bootstrapHarness(page);

  const snapshotButton = page.getByTestId('workspace-action-snapshot');
  await expect(snapshotButton).toBeVisible({ timeout: 30_000 });
  await expect(snapshotButton).toBeEnabled();
  await snapshotButton.click();

  await page.waitForFunction(() => (window as typeof window & { __paneReady?: number }).__paneReady ?? 0 >= 4);
  const toastTitle = page.locator('.toast__title', { hasText: /snapshot created/i });
  await expect(toastTitle).toBeVisible({ timeout: 30_000 });
  const viewReportAction = page.locator('.toast__action-button', { hasText: /view report/i });
  await expect(viewReportAction).toHaveCount(1);
  await expect(viewReportAction).toBeVisible();

  const snapshotsAction = page.getByTestId('snapshots-open-button');
  await expect(snapshotsAction).toBeVisible({ timeout: 30_000 });
  await snapshotsAction.click();
  const panel = page.getByTestId('snapshots-panel');
  await expect(panel).toBeVisible({ timeout: 30_000 });

  const snapshotItem = page.locator('.snapshots-panel__item').first();
  await expect(snapshotItem).toBeVisible();
  const viewFullReportButton = snapshotItem.getByRole('button', { name: /view full report/i });
  await viewFullReportButton.click();

  const modal = page.getByTestId('verification-report-modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByText(/Integrity: OK/i)).toBeVisible();
  await expect(modal.getByText(/Snapshot ID/i)).toBeVisible();
  await expect(modal.getByText(/Files/i)).toBeVisible();
  await expect(modal.getByText(/Total size/i)).toBeVisible();

  await page.evaluate(() => document.body.classList.add('theme--dark'));
  await expect(modal).toBeVisible();

  const closeModalButton = modal.getByRole('button', { name: /close verification report/i });
  await expect(closeModalButton).toBeVisible();
  await closeModalButton.click();
  await expect(modal).not.toBeVisible();

  await expect(panel.getByRole('button', { name: /view full report/i })).toBeVisible();

  await page.waitForTimeout(1000);
  await expect(toastTitle).toBeVisible();

  await expect(page.getByTestId(TID.dockWorkspace)).toBeVisible();
});
