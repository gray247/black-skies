import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { loadSampleProject } from './utils/sampleProject';
import { installServiceStubs } from './utils/serviceStubs';
import { TID } from '../../renderer/utils/testIds';

const { loadedProject } = loadSampleProject();
const FULL_ANALYTICS_E2E = process.env.FULL_ANALYTICS_E2E === '1';
const primaryScene = loadedProject.scenes[0];

type GuiFlowWindow = typeof window & {
  __testBudgetResponse?: unknown;
  __budgetRefresh?: (() => void) | null;
  __revealCalls?: string[];
  __serviceHealthRetry?: (() => Promise<void>) | null;
};

test.describe('GUI flow smoke tests', () => {
  test('smoke_wizard_to_draft_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await page.evaluate(() => {
      (window as typeof window & { __testEnvActiveFlow?: boolean }).__testEnvActiveFlow = true;
    });
    await bootstrapHarness(page);

    await expect(page.getByTestId(TID.wizardRoot)).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => window.__selectSceneForTest?.('sc_0001'));

    await expect(page.getByTestId('workspace-action-generate')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('workspace-action-critique')).toBeVisible({ timeout: 30_000 });
  });

  test('smoke_draft_to_critique_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await page.evaluate(() => {
      (window as typeof window & { __testEnvActiveFlow?: boolean }).__testEnvActiveFlow = true;
    });
    await bootstrapHarness(page);

    await page.evaluate(() => window.__selectSceneForTest?.('sc_0001'));
    const critiqueButton = page.getByTestId('workspace-action-critique');
    await expect(critiqueButton).toBeVisible({ timeout: 30_000 });
  });

  test('snapshot_restore_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'snapshot', 'flat');
    await page.evaluate(() => {
      (window as typeof window & { __testEnvActiveFlow?: boolean }).__testEnvActiveFlow = true;
    });
    await bootstrapHarness(page);

    const lockButton = page.getByRole('button', { name: /Lock$/i }).first();
    await lockButton.click();
    await expect(page.locator('.toast__title', { hasText: 'Input & Scope locked' })).toBeVisible({
      timeout: 30_000,
    });

    const editor = page.locator('.project-home__draft-editor .cm-content');
    const originalText = (await editor.textContent()) ?? '';
    await page.evaluate(() => {
      const el = document.querySelector('.project-home__draft-editor .cm-content') as HTMLElement | null;
      if (el) {
        el.textContent = 'Corrupted by test.';
      }
    });
    await expect(editor).toContainText('Corrupted by test.');

    await page.getByRole('button', { name: 'Restore snapshot' }).click();
    await page.waitForFunction(
      () => (window as typeof window & { __snapshotRestoreDone?: boolean }).__snapshotRestoreDone === true,
    );
    await expect(page.locator('.toast__title', { hasText: 'Restored earlier version.' })).toBeVisible({
      timeout: 30_000,
    });

  });

  test('budget_guardrail_smoke (UI)', async ({ page }) => {
    await installServiceStubs(page, 'budget');
    await bootstrapHarness(page);

    await page.evaluate(() => window.__selectSceneForTest?.('sc_0001'));
    await page.getByTestId('workspace-action-generate').click();

    const preflightDialog = page.getByRole('dialog', { name: /draft preflight/i });
    await expect(preflightDialog).toBeVisible({ timeout: 30_000 });
    await preflightDialog.getByRole('button', { name: 'Proceed' }).click();

    await expect(page.locator('.toast__title', { hasText: "Couldn't write draft." })).toBeVisible();
    await expect(
      page.locator('.toast__description', { hasText: 'Budget limit exceeded.' }),
    ).toBeVisible();

    await preflightDialog.getByRole('button', { name: 'Cancel' }).click();

    await page.getByTestId('workspace-action-critique').click();
    await expect(page.locator('.toast__title', { hasText: 'Feedback unavailable.' })).toBeVisible();
    await expect(
      page.locator('.toast__description', { hasText: 'Budget limit exceeded.' }),
    ).toBeVisible();
  });

  (FULL_ANALYTICS_E2E ? test : test.skip)('budget_indicator_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'budget-indicator');
    await bootstrapHarness(page);

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

    await applyTestBudgetState(
      makeBudgetResponse('near_cap', 90, 10, 'Approaching soft cap.'),
    );
    await expect(indicator).toHaveText(/Budget warning/i);
    await expect(indicatorMessage).toHaveText(/Approaching soft cap\./i);

    await applyTestBudgetState(
      makeBudgetResponse('over_budget', 110, 0, 'Budget exhausted for this project/session.'),
    );
    await expect(indicator).toHaveText(/Budget exhausted/i);
    await expect(indicatorMessage).toHaveText(/Budget exhausted for this project\/session\./i);
    await expect(page.getByTestId('workspace-action-generate')).toBeDisabled();
    await expect(page.getByTestId('workspace-action-critique')).toBeDisabled();
  });

  (FULL_ANALYTICS_E2E ? test : test.skip)('snapshots_panel_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page);

    const panelSnapshots = [
      {
        snapshot_id: 'pw-wizard-final',
        created_at: '2025-01-17T12:00:00.000Z',
        path: 'history/snapshots/pw-wizard-final',
        files_included: [],
      },
    ];
    const verificationReport = {
      project_id: loadedProject.project_id,
      snapshots: panelSnapshots.map((entry) => ({
        snapshot_id: entry.snapshot_id,
        status: 'ok' as const,
      })),
    };

    await page.evaluate(
      ({ snapshots, verification }) => {
          const win = window as GuiFlowWindow;
          win.__revealCalls = [];
        window.__dev?.overrideServices?.({
          listProjectSnapshots: async () => ({
            ok: true,
            traceId: 'trace-list-snapshots',
            data: snapshots,
          }),
          runBackupVerification: async () => ({
            ok: true,
            traceId: 'trace-verify-snapshots',
            data: verification,
          }),
          revealPath: async (targetPath: string) => {
            const win = window as GuiFlowWindow;
            win.__revealCalls = win.__revealCalls ?? [];
            win.__revealCalls.push(targetPath);
          },
        });
      },
      { snapshots: panelSnapshots, verification: verificationReport },
    );

    await page.getByTestId('workspace-action-snapshots').click();
    const panel = page.getByRole('dialog', { name: /snapshots/i });
    await expect(panel).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByText(panelSnapshots[0].snapshot_id)).toBeVisible();
    await expect(panel.getByText(/Verification OK/i)).toBeVisible();

    await panel
      .getByRole('button', { name: `Reveal snapshot ${panelSnapshots[0].snapshot_id}` })
      .click();
    await panel
      .getByRole('button', {
        name: `Reveal manifest for ${panelSnapshots[0].snapshot_id}`,
      })
      .click();

    const revealCalls = await page.evaluate(() => {
      const win = window as GuiFlowWindow;
      return win.__revealCalls ?? [];
    });
    expect(revealCalls).toEqual([
      panelSnapshots[0].path,
      `${panelSnapshots[0].path}/manifest.json`,
    ]);
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
    await bootstrapHarness(page);

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
    await expect(page.getByTestId(TID.serviceHealthBanner)).toHaveCount(0);
    await expect(page.getByTestId('workspace-action-generate')).toBeEnabled({
      timeout: 30_000,
    });
    await expect(page.getByTestId('workspace-action-critique')).toBeEnabled({
      timeout: 30_000,
    });
  });
});
