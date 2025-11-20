import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { loadSampleProject } from './utils/sampleProject';
import { TID } from '../../renderer/utils/testIds';

test.describe('Phase 5 Export & Integrity flow', () => {
  test('creates snapshot, backup, verification, restore, and export', async ({ page }) => {
    await bootstrapHarness(page);

    const { projectRoot, projectId } = loadSampleProject('Esther_Estate');
    await page.evaluate(async (targetPath) => {
      await window.projectLoader?.loadProject?.({ path: targetPath });
    }, projectRoot);
    await expect(page.getByTestId(TID.dockWorkspace)).toBeVisible({ timeout: 30_000 });

    const snapshotResult = await page.evaluate(
      async (targetProjectId) =>
        window.services?.createProjectSnapshot?.({ projectId: targetProjectId }),
      projectId,
    );
    expect(snapshotResult?.ok).toBe(true);
    const createdSnapshotId = snapshotResult?.data?.snapshot_id;
    expect(typeof createdSnapshotId).toBe('string');

    const snapshotList = await page.evaluate(
      async (targetProjectId) =>
        window.services?.listProjectSnapshots?.({ projectId: targetProjectId }) ?? { ok: false },
      projectId,
    );
    expect(snapshotList?.ok).toBe(true);
    const snapshotEntries =
      (Array.isArray(snapshotList?.data) ? snapshotList.data : []) as Array<{ snapshot_id?: string }>;
    const snapshotIds = snapshotEntries.map((entry) => entry.snapshot_id).filter(Boolean);
    expect(snapshotEntries.length).toBeGreaterThan(0);
    expect(typeof snapshotEntries[0]?.snapshot_id).toBe('string');

    const backupResult = await page.evaluate(
      async (targetProjectId) => window.services?.createBackup?.({ projectId: targetProjectId }),
      projectId,
    );
    expect(backupResult?.ok).toBe(true);

    const backupsList = await page.evaluate(
      async (targetProjectId) =>
        window.services?.listBackups?.({ projectId: targetProjectId }) ?? { ok: false },
      projectId,
    );
    const availableBackups = backupsList.ok ? backupsList.data ?? [] : [];
    expect(Array.isArray(availableBackups)).toBe(true);
    expect(availableBackups.length).toBeGreaterThan(0);
    const backupName = availableBackups[0]?.filename;
    expect(typeof backupName).toBe('string');

    const verificationResult = await page.evaluate(
      async (targetProjectId) =>
        window.services?.runBackupVerification?.({ projectId: targetProjectId, latestOnly: true }),
      projectId,
    );
    expect(verificationResult?.ok).toBe(true);

    const restoreResult = await page.evaluate(
      async (targetBackupName) =>
        targetBackupName ? window.services?.restoreBackup?.({ backupName: targetBackupName }) : null,
      backupName,
    );
    expect(restoreResult?.ok).toBe(true);

    const exportResult = await page.evaluate(
      async (targetProjectId) =>
        window.services?.exportProject?.({ projectId: targetProjectId, format: 'md' }),
      projectId,
    );
    expect(exportResult?.ok).toBe(true);
  });
});
