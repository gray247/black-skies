import { test, expect } from './_electron.fixture';
import {
  bootstrapHarness,
  collectStartupStateSnapshot,
  openPreflightDialog,
  waitForFlatModeReady,
  waitForFullModeReady,
  waitForRecoveryModeReady,
} from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';
import { loadSampleProject } from './utils/sampleProject';

// HARNESS_ONLY:
// Reason: startup diagnostics validate harness readiness/seams under stubbed services.
// Owner: app/tests/e2e/startup.diagnostic.spec.ts
// Retire when: equivalent startup contracts are covered by truth-lane startup checks.

const { loadedProject } = loadSampleProject();

test('diagnostic_service_override_survival_after_reload (startup)', async ({ page }) => {
  await installServiceStubs(page, 'normal', 'flat');
  await bootstrapHarness(page, { expectedMode: 'flat' });
  await waitForFlatModeReady(page);

  const initialHealth = await page.evaluate(async () => window.services?.checkHealth?.());
  expect(initialHealth?.ok).toBe(true);
  expect(initialHealth?.data?.status).toBe('online');
  await expect(page.getByTestId('service-status-pill')).toHaveAttribute('data-status', 'online');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await bootstrapHarness(page, { expectedMode: 'flat' });
  await waitForFlatModeReady(page);

  await expect(page.getByTestId('service-status-pill')).toHaveAttribute('data-status', 'online');
  const preflightResult = await page.evaluate(async ({ projectId, sceneId }) => {
    const result = await window.services?.preflightDraft?.({
      projectId,
      unitScope: 'scene',
      unitIds: [sceneId],
    });
    return {
      ok: result?.ok ?? false,
      traceId: result?.traceId ?? null,
      error: result?.error?.message ?? null,
      status: document
        .querySelector('[data-testid="service-status-pill"]')
        ?.getAttribute('data-status'),
      reason: document
        .querySelector('[data-testid="service-status-pill"]')
        ?.getAttribute('data-reason'),
    };
  }, {
    projectId: loadedProject.project_id,
    sceneId: loadedProject.scenes[0]?.id ?? 'sc_0001',
  });
  expect(preflightResult.ok).toBe(true);
  expect(preflightResult.status).toBe('online');
  expect(preflightResult.reason).not.toBe('offline');
});

test('diagnostic_mode_contract_split (startup)', async ({ page }) => {
  await installServiceStubs(page, 'normal', 'flat');
  await bootstrapHarness(page, { expectedMode: 'flat' });
  await waitForFlatModeReady(page);

  await installServiceStubs(page, 'normal', 'full');
  await bootstrapHarness(page, { expectedMode: 'full' });
  await waitForFullModeReady(page);

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
});

test('diagnostic_action_readiness_generate_contract (action)', async ({ page }, testInfo) => {
  await installServiceStubs(page, 'normal', 'flat');
  await bootstrapHarness(page, { expectedMode: 'flat', requireActiveScene: true });
  await waitForFlatModeReady(page, { requireActiveScene: true });

  await page.evaluate(() => {
    const win = window as typeof window & {
      __actionReadinessLog?: Array<Record<string, unknown>>;
    };
    win.__actionReadinessLog = [];
    const services = window.services;
    const original = services?.preflightDraft?.bind(services);
    if (!services || !original) {
      return;
    }

    // Patch in place so consumers with an existing services object reference still hit the probe.
    services.preflightDraft = async (input) => {
      const log = win.__actionReadinessLog ?? [];
      try {
        const result = await original(input);
        log.push({
          type: 'preflightDraft',
          input,
          ok: result?.ok ?? false,
          traceId: result?.traceId ?? null,
          error: result?.error?.message ?? null,
        });
        win.__actionReadinessLog = log;
        return result;
      } catch (error) {
        log.push({
          type: 'preflightDraft',
          input,
          ok: false,
          traceId: null,
          error: error instanceof Error ? error.message : String(error),
        });
        win.__actionReadinessLog = log;
        throw error;
      }
    };

    // Keep overrideServices path too for callers that resolve through the dev seam.
    window.__dev?.overrideServices?.({
      async preflightDraft(input) {
        const log = win.__actionReadinessLog ?? [];
        try {
          const result = await original(input);
          log.push({
            type: 'preflightDraft',
            input,
            ok: result?.ok ?? false,
            traceId: result?.traceId ?? null,
            error: result?.error?.message ?? null,
          });
          win.__actionReadinessLog = log;
          return result;
        } catch (error) {
          log.push({
            type: 'preflightDraft',
            input,
            ok: false,
            traceId: null,
            error: error instanceof Error ? error.message : String(error),
          });
          win.__actionReadinessLog = log;
          throw error;
        }
      },
    });
  });

  const buttonStateBefore = await page.evaluate(() => {
    const node = document.querySelector('[data-testid="workspace-action-generate"]') as
      | HTMLButtonElement
      | null;
    if (!node) {
      return null;
    }
    const style = window.getComputedStyle(node);
    return {
      visible: style.display !== 'none' && style.visibility !== 'hidden',
      enabled: !node.disabled,
      ariaDisabled: node.getAttribute('aria-disabled'),
    };
  });
  expect(buttonStateBefore?.visible).toBe(true);
  expect(buttonStateBefore?.enabled).toBe(true);

  const dialog = await openPreflightDialog(page, {
    actionTestId: 'workspace-action-generate',
    timeoutMs: 15_000,
  });

  const modalOpen = await dialog.isVisible();
  const result = await page.evaluate(() => {
    const win = window as typeof window & {
      __actionReadinessLog?: Array<Record<string, unknown>>;
    };
    const dialog = document.querySelector('[role="dialog"][aria-label*="Draft preflight"]');
    const toast = document.querySelector('.toast');
    const toastTitle = toast?.querySelector('.toast__title')?.textContent?.trim() ?? null;
    const toastDescription = toast?.querySelector('.toast__description')?.textContent?.trim() ?? null;
    const dialogText = dialog?.textContent ?? '';
    return {
      preflightCalls: win.__actionReadinessLog ?? [],
      modalHasPreflightContract:
        dialogText.includes('Generation scope: Active scene') &&
        dialogText.includes('1 scene is affected.') &&
        dialogText.includes('Draft text may be replaced for the selected scope after you proceed.') &&
        dialogText.includes('Within budget'),
      toastTitle,
      toastDescription,
    };
  });

  await expect
    .poll(
    async () => {
        const dialogText = (await dialog.textContent()) ?? '';
        return (
          dialogText.includes('Generation scope: Active scene') &&
          dialogText.includes('1 scene is affected.') &&
          dialogText.includes('Draft text may be replaced for the selected scope after you proceed.') &&
          dialogText.includes('Within budget')
        );
      },
      { timeout: 15_000 },
    )
    .toBe(true);

  await testInfo.attach('diagnostic-action-readiness.json', {
    body: Buffer.from(`${JSON.stringify({
      buttonStateBefore,
      result,
    }, null, 2)}\n`, 'utf-8'),
    contentType: 'application/json',
  });
  // The dialog content is the user-visible readiness contract. Fail if it never materializes.
  expect(result.modalHasPreflightContract).toBe(true);
  expect(modalOpen).toBe(true);
});

test('diagnostic_startup_snapshot_shape (startup)', async ({ page }) => {
  await installServiceStubs(page, 'normal', 'full');
  await bootstrapHarness(page, { expectedMode: 'full' });
  const snapshot = await collectStartupStateSnapshot(page);
  expect(snapshot.url.length).toBeGreaterThan(0);
  expect(snapshot.project.pathBody ?? snapshot.project.pathHtml).toBeTruthy();
  expect(snapshot.service.status).toBe('online');
  expect(snapshot.actions.some((entry) => entry.testId === 'workspace-action-generate')).toBe(true);
});
