import { test, expect } from './_electron.fixture';
import {
  bootstrapHarness,
  openPreflightDialog,
  waitForSnapshotRestoreComplete,
} from './_bootstrap';
import { loadSampleProject } from './utils/sampleProject';
import { installServiceStubs } from './utils/serviceStubs';
import { selectSceneWithDiagnostics } from './utils/sceneSelectionDiagnostics';
import { TID } from '../../renderer/utils/testIds';

// HARNESS_ONLY:
// Reason: UI behavior validation under stubbed services and test-mode hooks.
// These checks are appearance/stability lanes, not truth-path/persistence authority.
// Owner: app/tests/e2e/gui.flows.spec.ts
// Retire when: equivalent flows are asserted by real-service truth-lane coverage.

const { loadedProject } = loadSampleProject();
const FULL_ANALYTICS_E2E = process.env.FULL_ANALYTICS_E2E === '1';

type GuiFlowWindow = typeof window & {
  __testBudgetResponse?: unknown;
  __budgetRefresh?: (() => void) | null;
  __revealCalls?: string[];
  __serviceHealthRetry?: (() => Promise<void>) | null;
};

test.describe('GUI flow smoke tests', () => {
  test('smoke_wizard_to_draft_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await bootstrapHarness(page, { expectedMode: 'flat' });

    await expect(page.getByTestId(TID.wizardRoot)).toBeVisible({ timeout: 30_000 });
    const selectionDiagnostics = await selectSceneWithDiagnostics(page, test.info(), 'sc_0001', {
      attachmentName: 'snapshot-restore-scene-selection.json',
      timeoutMs: 30_000,
      pollIntervalMs: 500,
    });
    expect(selectionDiagnostics.activeSceneReached).toBe(true);

    await expect(page.getByTestId('workspace-action-generate')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('workspace-action-critique')).toBeVisible({ timeout: 30_000 });
  });

  test('smoke_draft_to_critique_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await bootstrapHarness(page, { expectedMode: 'flat' });

    await page.evaluate(() => {
      window.__dev?.selectScene?.('sc_0001') ??
        window.dispatchEvent(new CustomEvent('test:select-scene', { detail: 'sc_0001' }));
    });
    const critiqueButton = page.getByTestId('workspace-action-critique');
    await expect(critiqueButton).toBeVisible({ timeout: 30_000 });
  });

  test('snapshot_restore_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'snapshot', 'flat');
    await bootstrapHarness(page, {
      expectedMode: 'full',
      allowRecoveryBanner: true,
      requiredEnabledActions: ['workspace-action-snapshot'],
    });

    const lockButton = page.getByRole('button', { name: /Lock$/i }).first();
    await expect(lockButton).toBeVisible({ timeout: 30_000 });
    await expect(lockButton).toBeEnabled({ timeout: 30_000 });
    await lockButton.click();
    await expect(page.locator('.toast__title', { hasText: 'Input & Scope locked' })).toBeVisible({
      timeout: 30_000,
    });

    await page.evaluate(() => {
      window.__dev?.selectScene?.('sc_0001') ??
        window.dispatchEvent(new CustomEvent('test:select-scene', { detail: 'sc_0001' }));
    });
    const editor = page.locator('.project-home__draft-editor .cm-content').first();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => {
      const el = document.querySelector(
        '.project-home__draft-editor .cm-content',
      ) as HTMLElement | null;
      if (el) {
        el.textContent = 'Corrupted by test.';
      }
    });
    await expect(editor).toContainText('Corrupted by test.');

    await page.getByRole('button', { name: 'Restore snapshot' }).click();
    await waitForSnapshotRestoreComplete(page, { requireBannerDismissed: false });
  });

  test('budget_guardrail_smoke (UI)', async ({ page }) => {
    await installServiceStubs(page, 'budget');
    await page.evaluate(() => {
      (window as typeof window & { __allowBudget402Noise?: boolean }).__allowBudget402Noise = true;
    });
    await bootstrapHarness(page, {
      expectedMode: 'full',
      requiredEnabledActions: ['workspace-action-generate', 'workspace-action-critique'],
    });
    await page.evaluate(() => {
      const budgetExceeded = async () => ({
        ok: false as const,
        error: {
          code: 'BUDGET_EXCEEDED',
          message: 'Budget limit exceeded.',
          httpStatus: 402,
        },
        traceId: 'trace-budget-exceeded',
      });
      window.__dev?.overrideServices?.({
        generateDraft: budgetExceeded,
        critiqueDraft: budgetExceeded,
        phase4Critique: budgetExceeded,
      });
    });

    await page.evaluate(() => {
      window.__dev?.selectScene?.('sc_0001') ??
        window.dispatchEvent(new CustomEvent('test:select-scene', { detail: 'sc_0001' }));
    });
    const preflightDialog = await openPreflightDialog(page, {
      actionTestId: 'workspace-action-generate',
      dialogName: /draft preflight/i,
    });
    await preflightDialog.getByRole('button', { name: 'Proceed' }).click();

    const draftErrorToast = page
      .locator('.toast')
      .filter({ has: page.locator('.toast__title', { hasText: "Couldn't write draft." }) })
      .first();
    await expect(draftErrorToast).toBeVisible();
    await expect(draftErrorToast.locator('.toast__description', { hasText: 'Budget limit exceeded.' })).toBeVisible();

    await preflightDialog.getByRole('button', { name: 'Cancel' }).click();

    await page.getByTestId('workspace-action-critique').click();
    const critiqueErrorToast = page
      .locator('.toast')
      .filter({ has: page.locator('.toast__title', { hasText: 'Feedback unavailable.' }) })
      .first();
    await expect(critiqueErrorToast).toBeVisible();
    await expect(
      critiqueErrorToast.locator('.toast__description', { hasText: 'Budget limit exceeded.' }),
    ).toBeVisible();
  });

  (FULL_ANALYTICS_E2E ? test : test.skip)('budget_indicator_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'budget-indicator');
    await bootstrapHarness(page, { expectedMode: 'full' });

    await expect(page.getByTestId(TID.budgetIndicator).first()).toBeVisible({
      timeout: 30_000,
    });
    const indicator = page.getByTestId(TID.budgetIndicator).first();
    const indicatorMessage = indicator.locator('.budget-indicator__message');

    const makeBudgetResponse = (
      hint: 'stable' | 'near_cap' | 'over_budget',
      spent: number,
      remaining: number,
      message: string,
    ) => ({
      project_id: loadedProject.project_id,
      budget: {
        soft_limit_usd: 100,
        hard_limit_usd: 200,
        spent_usd: spent,
        remaining_usd: remaining,
      },
      hint,
      message,
    });

    const applyTestBudgetState = async (response: ReturnType<typeof makeBudgetResponse>) => {
      await page.evaluate((payload) => {
        const win = window as GuiFlowWindow;
        win.__testBudgetResponse = payload;
        win.__budgetRefresh?.();
      }, response);
      await expect(indicator).toBeVisible({ timeout: 5_000 });
    };

    await applyTestBudgetState(makeBudgetResponse('stable', 5, 95, 'Budget healthy.'));
    await expect(indicator).toHaveText(/Budget OK/i);
    await expect(indicatorMessage).toHaveText(/Budget healthy\./i);

    await applyTestBudgetState(makeBudgetResponse('near_cap', 90, 10, 'Approaching soft cap.'));
    await expect(indicator).toHaveText(/Budget warning/i);
    await expect(indicatorMessage).toHaveText(/Approaching soft cap\./i);

    await applyTestBudgetState(
      makeBudgetResponse('over_budget', 110, 0, 'Budget exhausted for this project/session.'),
    );
    await expect(indicator).toHaveText(/Budget exhausted/i);
    await expect(indicatorMessage).toHaveText(/Budget exhausted for this project\/session\./i);
    await expect(page.getByTestId('workspace-action-generate')).toBeEnabled();
    await expect(page.getByTestId('workspace-action-critique')).toBeEnabled();
  });

  (FULL_ANALYTICS_E2E ? test : test.skip)('snapshots_panel_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, { expectedMode: 'full' });

    await page.getByTestId('snapshots-open-button').click();
    const panel = page.getByRole('dialog', { name: /snapshots/i });
    await expect(panel).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByText(/Latest verification/i)).toBeVisible();
    await expect(panel.locator('.snapshot-row').first()).toBeVisible();
    await panel.getByRole('button', { name: /Reveal snapshot / }).first().click();
    await panel.getByRole('button', { name: /Reveal manifest for / }).first().click();
  });

  test('service_port_unavailable_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'offline');
    await page.evaluate(() => {
      window.__dev?.overrideServices?.({
        async checkHealth() {
          return {
            ok: false,
            error: { message: 'Service port is unavailable.' },
            traceId: 'pw-health-port',
          };
        },
      });
    });
    await bootstrapHarness(page, {
      expectedMode: 'recovery',
      allowRecoveryBanner: true,
      expectedServiceStatus: null,
    });

    await page.waitForFunction(
      () => {
        const win = window as GuiFlowWindow;
        return typeof win.__serviceHealthRetry === 'function';
      },
      null,
      { timeout: 30_000 },
    );

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('test:service-health', {
          detail: {
            status: 'offline',
            portUnavailable: true,
            errorMessage: 'Service port is unavailable.',
          },
        }),
      );
    });

    const banner = page.getByTestId(TID.serviceHealthBanner);
    await expect(banner).toBeVisible({ timeout: 30_000 });
    const statusPill = page.getByTestId(TID.serviceStatusPill);
    await expect(statusPill).toHaveAttribute('data-status', 'port-unavailable');
    await expect(statusPill).toHaveAttribute('data-reason', 'service_port_unavailable');
    await expect(
      banner.getByText(/The writing tools service port is unavailable\./i),
    ).toBeVisible();
    await expect(page.getByTestId('workspace-action-generate')).toBeDisabled();
    await expect(page.getByTestId('workspace-action-critique')).toBeDisabled();

    await page.evaluate(() => {
      window.__dev?.overrideServices?.({
        async checkHealth() {
          return {
            ok: true,
            data: { status: 'online' },
            traceId: 'pw-health-retry',
          };
        },
      });
    });

    await banner.getByRole('button', { name: /retry connection/i }).click();
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('test:service-health', {
          detail: { status: 'online' },
        }),
      );
    });
    await expect(statusPill).toHaveAttribute('data-status', 'online');
    await expect(page.getByTestId(TID.serviceHealthBanner)).toHaveCount(0);
    await expect(page.getByTestId('workspace-action-generate')).toBeEnabled({
      timeout: 30_000,
    });
    await expect(page.getByTestId('workspace-action-critique')).toBeEnabled({
      timeout: 30_000,
    });
  });
});
