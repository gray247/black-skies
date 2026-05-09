import { test, expect } from './_electron.fixture';
import {
  bootstrapHarness,
  collectStartupStateSnapshot,
  waitForFlatModeReady,
  waitForFullModeReady,
  waitForRecoveryModeReady,
} from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';

// HARNESS_ONLY:
// Reason: matrix tests assert harness-mode startup contracts and guardrails.
// Owner: app/tests/e2e/startup_contract_matrix.spec.ts
// Retire when: equivalent mode-contract guarantees are enforced in truth-lane coverage.

test.describe('startup_contract_matrix', () => {
  test('flat mode contract', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await bootstrapHarness(page, { expectedMode: 'flat' });
    await waitForFlatModeReady(page);

    const flatSnapshot = await collectStartupStateSnapshot(page);
    expect(flatSnapshot.mode.body ?? flatSnapshot.mode.html).toBe('flat');
    expect(flatSnapshot.recovery.visible).toBe(false);
    expect(flatSnapshot.service.status).toBe('online');
    expect(flatSnapshot.project.pathBody ?? flatSnapshot.project.pathHtml).toBeTruthy();

    // Mode lock contract: startup-config mode remains authoritative even if legacy runtime flags drift.
    await page.evaluate(() => {
      const win = window as typeof window & {
        __testEnvFlatMode?: boolean;
        __testEnvRecoveryMode?: boolean;
      };
      win.__testEnvFlatMode = false;
      win.__testEnvRecoveryMode = true;
    });
    await expect.poll(() => page.evaluate(() => window.testMode?.getMode?.() ?? null)).toBe('flat');
    await expect(page.getByTestId('recovery-banner')).toHaveCount(0);

    // In harness-flat mode, action buttons stay interactive while services are online.
    await expect(page.getByTestId('workspace-action-generate')).toBeEnabled();
    await expect(page.getByTestId('workspace-action-critique')).toBeEnabled();
  });

  test('full mode contract', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, { expectedMode: 'full' });
    await waitForFullModeReady(page);

    const fullSnapshot = await collectStartupStateSnapshot(page);
    expect(fullSnapshot.mode.body ?? fullSnapshot.mode.html).toBe('full');
    expect(fullSnapshot.dock.present).toBe(true);
    expect(fullSnapshot.recovery.visible).toBe(false);
    const visiblePanes = fullSnapshot.dock.panes.filter((pane) => pane.visible).map((pane) => pane.paneId);
    expect(visiblePanes).toContain('corkboard');
    expect(visiblePanes).toContain('outline');
    expect(visiblePanes).toContain('draftPreview');
  });

  test('recovery mode contract', async ({ page }) => {
    await installServiceStubs(page, 'offline', 'recovery');
    await bootstrapHarness(page, {
      expectedMode: 'recovery',
      expectedServiceStatus: null,
      allowRecoveryBanner: true,
    });
    await waitForRecoveryModeReady(page, {
      expectedServiceStatus: null,
      allowRecoveryBanner: true,
    });

    const recoverySnapshot = await collectStartupStateSnapshot(page);
    expect(recoverySnapshot.mode.body ?? recoverySnapshot.mode.html).toBe('recovery');
    expect(recoverySnapshot.recovery.visible).toBe(true);
  });
});
