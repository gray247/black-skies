import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';

// HARNESS_ONLY:
// Reason: validates snapshot-verification UI plumbing with stubbed service responses.
// Owner: app/tests/e2e/gui.snapshot_verification_flow.spec.ts
// Retire when: snapshot verification is asserted in real-service truth lanes.

test('snapshot verification flow (UI)', async ({ page }) => {
  await installServiceStubs(page, 'snapshot', 'flat');
  await bootstrapHarness(page, {
    allowRecoveryBanner: true,
    requiredEnabledActions: ['workspace-action-snapshot'],
  });

  await page.evaluate(() => {
    const win = window as typeof window & {
      __electronApi?: {
        fs?: {
          stat?: (path: string) => Promise<unknown>;
          readJson?: (path: string) => Promise<unknown>;
        };
      };
    };
    const fs = win.__electronApi?.fs;
    if (!fs) {
      return;
    }
    const originalStat = fs.stat?.bind(fs);
    const originalReadJson = fs.readJson?.bind(fs);
    fs.stat = async (targetPath: string) => {
      const normalized = String(targetPath).replace(/[\\/]+/g, '/');
      if (
        normalized.endsWith('/.snapshots/last_verification.json') ||
        normalized.endsWith('/.snapshots/snapshot-current') ||
        normalized.endsWith('/.snapshots/snapshot-current/manifest.json')
      ) {
        return {
          size: 2048,
          isFile: normalized.endsWith('.json'),
          isDirectory: !normalized.endsWith('.json'),
          mtimeMs: Date.now(),
        };
      }
      return originalStat ? originalStat(targetPath) : undefined;
    };
    fs.readJson = async (targetPath: string) => {
      const normalized = String(targetPath).replace(/[\\/]+/g, '/');
      if (normalized.endsWith('/.snapshots/snapshot-current/metadata.json')) {
        return {
          snapshot_id: 'snapshot-current',
          created_at: '2025-11-17T13:00:00Z',
          label: 'wizard-finalize',
        };
      }
      if (
        normalized.endsWith('/.snapshots/snapshot-current/manifest.json') ||
        normalized.endsWith('/.snapshots/snapshot-current/snapshot.json')
      ) {
        return {
          files_included: [
            { path: 'outline.json' },
            { path: 'drafts/story.json' },
          ],
        };
      }
      return originalReadJson ? originalReadJson(targetPath) : undefined;
    };
  });

  const snapshotButton = page.getByTestId('workspace-action-snapshot');
  await expect(snapshotButton).toBeVisible({ timeout: 30_000 });
  await expect(snapshotButton).toBeEnabled();
  const snapshotsAction = page.getByTestId('snapshots-open-button');
  await expect(snapshotsAction).toBeVisible({ timeout: 30_000 });
  await snapshotsAction.click();
  const panel = page.getByTestId('snapshots-panel');
  await expect(panel).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('snapshot-badge-pw-wizard-final')).toBeVisible();
  await expect(page.getByTestId('snapshots-health-status')).toHaveText(/latest snapshot verified/i);
  await expect(page.getByText(/Last check:/)).toBeVisible();

  await snapshotButton.click();
  await expect(page.getByTestId('snapshot-badge-snapshot-current')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('snapshot-badge-snapshot-current')).toBeVisible();
  await expect(page.getByTestId('snapshots-health-status')).toHaveText(/latest snapshot verified/i);

  const toastTitle = page.locator('.toast__title', { hasText: /snapshot created/i });
  await expect(toastTitle).toBeVisible({ timeout: 30_000 });
  const openPanelAction = page.locator('.toast__action-button', { hasText: /open snapshots panel/i });
  await expect(openPanelAction).toHaveCount(1);
  await expect(openPanelAction).toBeVisible();

  const snapshotItem = page.locator('.snapshots-panel__item').first();
  await expect(snapshotItem).toBeVisible();
  const refreshStatusButton = page.getByTestId('snapshots-refresh-status-button');
  await expect(refreshStatusButton).toBeEnabled();
  await refreshStatusButton.click();
  await expect(page.getByTestId('snapshots-health-status')).toHaveText(/latest snapshot verified/i);
  await expect(page.getByText(/Last check:/)).toBeVisible();

  const rerunButton = snapshotItem.getByRole('button', { name: /re-run verification for this snapshot/i });
  await expect(rerunButton).toBeVisible();
  await rerunButton.click();
  await expect(page.getByText(/Last check:/)).toBeVisible();
  await expect(page.getByTestId('snapshots-health-status')).toHaveText(/latest snapshot verified/i);

  const viewFullReportButton = snapshotItem.getByRole('button', { name: /view snapshot details/i });
  await viewFullReportButton.click();

  const modal = page.getByTestId('verification-report-modal');
  await expect(modal).toBeVisible();
  const reportCard = modal.locator('.snapshots-panel__modal');
  await expect(reportCard).toHaveCSS('background-color', 'rgba(12, 17, 23, 0.98)');
  await expect(reportCard).toHaveCSS('color', 'rgb(231, 236, 242)');
  await expect(modal.getByText(/Integrity:/i)).toBeVisible();
  await expect(modal.getByText(/Snapshot ID/i)).toBeVisible();
  await expect(modal.getByText(/Files/i)).toBeVisible();
  await expect(modal.getByText(/Total size/i)).toBeVisible();
  await expect(modal.getByText(/Integrity:/i)).toBeVisible();

  await page.evaluate(() => document.body.classList.add('theme--dark'));
  await expect(modal).toBeVisible();

  const closeModalButton = modal.getByRole('button', { name: /close verification report/i });
  await expect(closeModalButton).toBeVisible();
  await closeModalButton.click();
  await expect(modal).not.toBeVisible();

  await panel.getByTestId('snapshots-open-report-file-button').click();
  await snapshotItem.getByRole('button', { name: /reveal snapshot snapshot-current/i }).click();
  await snapshotItem.getByRole('button', { name: /reveal manifest for snapshot-current/i }).click();

  await expect(snapshotItem.getByRole('button', { name: /view snapshot details/i })).toBeVisible();
  await expect(page.getByTestId('workspace-action-snapshot')).toBeEnabled({ timeout: 30_000 });
});
