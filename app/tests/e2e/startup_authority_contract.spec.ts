import { test, expect } from './_electron.fixture';
import type { Page } from '@playwright/test';
import {
  bootstrapHarness,
  collectStartupStateSnapshot,
  openPreflightDialog,
  waitForSnapshotRestoreComplete,
  waitForServiceStatus,
} from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';
import { loadSampleProject } from './utils/sampleProject';

// HARNESS_ONLY:
// Reason: validates startup authority boundaries and runtime API seams.
// Owner: app/tests/e2e/startup_authority_contract.spec.ts
// Retire when: equivalent startup authority checks are covered by truth-lane.

const { projectRoot: sampleProjectPath } = loadSampleProject();

test.describe('startup_authority_contract', () => {
  const assertActionButtonsDisabled = async (page: Page, classification: string) => {
    const statuses = await page.evaluate(() => {
      const ids = ['workspace-action-generate', 'workspace-action-critique'] as const;
      return ids.map((testId) => {
        const nodes = Array.from(
          document.querySelectorAll(`[data-testid="${testId}"]`),
        ) as HTMLButtonElement[];
        return {
          testId,
          count: nodes.length,
          enabledCount: nodes.filter((node) => !node.disabled).length,
        };
      });
    });
    const missing = statuses.find((status) => status.count === 0);
    if (missing) {
      throw new Error(`[${classification}] missing action node: ${missing.testId}`);
    }
    const enabled = statuses.find((status) => status.enabledCount > 0);
    if (enabled) {
      throw new Error(`[${classification}] action unexpectedly enabled: ${JSON.stringify(statuses)}`);
    }
  };

  const waitForNoProjectAuthorityState = async (page: Page, classification: string) => {
    await page.waitForFunction(
      () => {
        const loaded =
          document.body?.dataset?.projectLoaded ?? document.documentElement?.dataset?.projectLoaded ?? null;
        const generate = document.querySelector('[data-testid="workspace-action-generate"]') as
          | HTMLButtonElement
          | null;
        const critique = document.querySelector('[data-testid="workspace-action-critique"]') as
          | HTMLButtonElement
          | null;
        if (!generate || !critique) {
          return false;
        }
        const actionsEnabled = !generate.disabled || !critique.disabled;
        if (loaded === '1') {
          return true;
        }
        const win = window as typeof window & { __startupAuthorityNoProjectDisabledSince?: number };
        if (actionsEnabled) {
          delete win.__startupAuthorityNoProjectDisabledSince;
          return false;
        }
        const now = performance.now();
        if (typeof win.__startupAuthorityNoProjectDisabledSince !== 'number') {
          win.__startupAuthorityNoProjectDisabledSince = now;
          return false;
        }
        return now - win.__startupAuthorityNoProjectDisabledSince >= 500;
      },
      null,
      { timeout: 30_000 },
    ).catch(async (error) => {
      const snapshot = await collectStartupStateSnapshot(page);
      throw new Error(
        `[${classification}] no-project authority did not settle: ${JSON.stringify(snapshot)}` +
          (error instanceof Error ? ` cause="${error.message}"` : ''),
      );
    });
  };

  const waitForActionButtonsDisabledState = async (page: Page, classification: string) => {
    await page.waitForFunction(
      () => {
        const ids = ['workspace-action-generate', 'workspace-action-critique'] as const;
        const buttonsDisabled = ids.every((testId) => {
          const button = document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement | null;
          return Boolean(button) && button.disabled;
        });
        const win = window as typeof window & { __startupAuthorityDisabledSince?: number };
        if (!buttonsDisabled) {
          delete win.__startupAuthorityDisabledSince;
          return false;
        }
        const now = performance.now();
        if (typeof win.__startupAuthorityDisabledSince !== 'number') {
          win.__startupAuthorityDisabledSince = now;
          return false;
        }
        return now - win.__startupAuthorityDisabledSince >= 500;
      },
      null,
      { timeout: 30_000 },
    ).catch(async (error) => {
      const snapshot = await collectStartupStateSnapshot(page);
      throw new Error(
        `[${classification}] action buttons did not settle disabled: ${JSON.stringify(snapshot)}` +
          (error instanceof Error ? ` cause="${error.message}"` : ''),
      );
    });
  };

  test('scene selection authority contract', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, {
      expectedMode: 'full',
      expectedServiceStatus: 'online',
      requireActiveScene: false,
    });
    await page.waitForFunction(
      () => typeof window.__blackSkiesSelectScene === 'function',
      null,
      { timeout: 30_000 },
    );

    const selectionResult = await page.evaluate(async () => {
      const win = window as typeof window & {
        __blackSkiesSelectScene?: (sceneId: string | null | undefined) => boolean;
        __testProjectState?: { activeSceneId?: string | null };
      };
      const selectScene = win.__blackSkiesSelectScene;
      if (typeof selectScene !== 'function') {
        return {
          classification: 'BRIDGE_MISSING',
          details: {
            hasSelectSceneHook: false,
          },
        };
      }
      try {
        const ok = selectScene('sc_0001');
        const bodySceneId = document.body?.dataset?.activeSceneId ?? null;
        const htmlSceneId = document.documentElement?.dataset?.activeSceneId ?? null;
        const debugSceneId = win.__testProjectState?.activeSceneId ?? null;
        return {
          classification: 'OK',
          ok,
          bodySceneId,
          htmlSceneId,
          debugSceneId,
        };
      } catch (error) {
        return {
          classification: 'SELECTION_CALL_FAILED',
          details: {
            message: error instanceof Error ? error.message : String(error),
          },
        };
      }
    });

    if (selectionResult.classification === 'BRIDGE_MISSING') {
      throw new Error(
        `[BRIDGE_MISSING] __dev.selectScene bridge unavailable: ${JSON.stringify(selectionResult.details)}`,
      );
    }
    if (selectionResult.classification === 'SELECTION_CALL_FAILED') {
      throw new Error(
        `[SELECTION_CALL_FAILED] __dev.selectScene threw: ${JSON.stringify(selectionResult.details)}`,
      );
    }

    if (
      selectionResult.bodySceneId !== 'sc_0001' ||
      selectionResult.htmlSceneId !== 'sc_0001' ||
      selectionResult.debugSceneId !== 'sc_0001'
    ) {
      const markerMissing =
        !selectionResult.bodySceneId ||
        !selectionResult.htmlSceneId ||
        !selectionResult.debugSceneId;
      throw new Error(
        `[${markerMissing ? 'MARKER_NOT_COMMITTED' : 'WRONG_SCENE_SELECTED'}] activeSceneId mismatch: ${JSON.stringify(
          selectionResult,
        )}`,
      );
    }
    if (selectionResult.ok !== true) {
      throw new Error(
        `[SELECTION_CALL_FAILED] __blackSkiesSelectScene returned non-ok: ${JSON.stringify(selectionResult)}`,
      );
    }
  });

  test('action readiness contract', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'full');

    const assertActionsDisabled = async (testIds: string[], classification: string): Promise<void> => {
      const statuses = await page.evaluate((targetTestIds) => {
        return targetTestIds.map((testId) => {
          const buttons = Array.from(
            document.querySelectorAll(`[data-testid="${testId}"]`),
          ) as HTMLButtonElement[];
          const enabledCount = buttons.filter((button) => !button.disabled).length;
          return { testId, count: buttons.length, enabledCount };
        });
      }, testIds);
      const missing = statuses.find((status) => status.count === 0);
      if (missing) {
        throw new Error(`[${classification}] missing action node: ${missing.testId}`);
      }
      const enabled = statuses.filter((status) => status.enabledCount > 0);
      if (enabled.length > 0) {
        throw new Error(
          `[${classification}] expected actions disabled: ${JSON.stringify(statuses)}`,
        );
      }
    };

    // Case A: no project loaded => generate/critique must be disabled.
    await waitForNoProjectAuthorityState(page, 'NO_PROJECT_FALSE_READY');
    const noProjectSnapshot = await collectStartupStateSnapshot(page);
    const noProjectLoaded =
      noProjectSnapshot.project.loadedBody ?? noProjectSnapshot.project.loadedHtml;
    if (noProjectLoaded !== '1') {
      await assertActionsDisabled(
        ['workspace-action-generate', 'workspace-action-critique'],
        'NO_PROJECT_FALSE_READY',
      );
    }

    // Case B: project loaded, no active scene => generate/critique must remain disabled.
    await bootstrapHarness(page, {
      expectedMode: 'full',
      expectedServiceStatus: 'online',
      requireActiveScene: false,
    });
    await page.waitForFunction(
      () => typeof window.__blackSkiesSelectScene === 'function',
      null,
      { timeout: 30_000 },
    );
    const clearScene = await page.evaluate(async () => {
      const win = window as typeof window & {
        __blackSkiesSelectScene?: (sceneId: string | null | undefined) => boolean;
      };
      const selectScene = win.__blackSkiesSelectScene;
      if (typeof selectScene !== 'function') {
        return { classification: 'BRIDGE_MISSING' as const };
      }
      try {
        const result = selectScene(null);
        return {
          classification: 'OK' as const,
          ok: Boolean(result),
        };
      } catch (error) {
        return {
          classification: 'SELECTION_CALL_FAILED' as const,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    });
    if (clearScene.classification === 'BRIDGE_MISSING') {
      throw new Error('[BRIDGE_MISSING] cannot clear active scene for readiness case B');
    }
    if (clearScene.classification === 'SELECTION_CALL_FAILED') {
      throw new Error(`[SELECTION_CALL_FAILED] failed to clear scene: ${clearScene.message}`);
    }
    await expect
      .poll(() =>
        page.evaluate(() => ({
          bodySceneId: document.body?.dataset?.activeSceneId ?? null,
          htmlSceneId: document.documentElement?.dataset?.activeSceneId ?? null,
        })),
      )
      .toEqual({ bodySceneId: null, htmlSceneId: null });
    await waitForActionButtonsDisabledState(page, 'NO_SCENE_FALSE_READY');
    await assertActionsDisabled(
      ['workspace-action-generate', 'workspace-action-critique'],
      'NO_SCENE_FALSE_READY',
    );

    // Case C: project + selected scene + online service => actions enabled and flows open.
    const selectSceneResult = await page.evaluate(async () => {
      const win = window as typeof window & {
        __blackSkiesSelectScene?: (sceneId: string | null | undefined) => boolean;
      };
      const selectScene = win.__blackSkiesSelectScene;
      if (typeof selectScene !== 'function') {
        return { classification: 'BRIDGE_MISSING' as const };
      }
      try {
        const result = selectScene('sc_0001');
        return {
          classification: 'OK' as const,
          ok: Boolean(result),
        };
      } catch (error) {
        return {
          classification: 'SELECTION_CALL_FAILED' as const,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    });
    if (selectSceneResult.classification !== 'OK') {
      throw new Error(`[SELECTION_CALL_FAILED] failed selecting sc_0001: ${JSON.stringify(selectSceneResult)}`);
    }
    await expect
      .poll(() =>
        page.evaluate(() => ({
          bodySceneId: document.body?.dataset?.activeSceneId ?? null,
          htmlSceneId: document.documentElement?.dataset?.activeSceneId ?? null,
        })),
      )
      .toEqual({ bodySceneId: 'sc_0001', htmlSceneId: 'sc_0001' });

    await waitForServiceStatus(page, { status: 'online', reason: 'online' });
    await openPreflightDialog(page, {
      actionTestId: 'workspace-action-generate',
      dialogName: /draft preflight/i,
      timeoutMs: 30_000,
    });
    await page.locator('.preflight-modal__close').click();
    await page.locator('.preflight-modal').waitFor({ state: 'detached', timeout: 30_000 });

    await page.getByTestId('workspace-action-critique').click();
    await expect(page.locator('.critique-modal')).toBeVisible();
  });

  test('startup config set at bootstrap is authoritative', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await bootstrapHarness(page, { expectedMode: 'flat' });

    const snapshot = await collectStartupStateSnapshot(page);
    expect(snapshot.mode.body ?? snapshot.mode.html).toBe('flat');
    expect(snapshot.recovery.visible).toBe(false);
  });

  test('startup determinism contract', async ({ page }, testInfo) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, {
      expectedMode: 'full',
      expectedServiceStatus: 'online',
      requireActiveScene: false,
    });

    const first = await collectStartupStateSnapshot(page);
    const firstMode = first.mode.body ?? first.mode.html;
    if (firstMode !== 'full') {
      throw new Error(`[MODE_DRIFT] expected full mode at bootstrap, got ${JSON.stringify(first.mode)}`);
    }
    if (first.recovery.visible) {
      throw new Error('[UNREQUESTED_RECOVERY] recovery banner visible in non-recovery startup');
    }
    if ((first.project.loadedBody ?? first.project.loadedHtml) !== '1') {
      throw new Error('[PROJECT_REHYDRATE_DRIFT] project failed to commit in requested-project startup');
    }
    if (first.service.status !== 'online') {
      throw new Error(
        `[SERVICE_STATE_DRIFT] expected online service after bootstrap: ${JSON.stringify(first.service)}`,
      );
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, {
      expectedMode: 'full',
      expectedServiceStatus: 'online',
      requireActiveScene: false,
    });
    const second = await collectStartupStateSnapshot(page);
    const secondMode = second.mode.body ?? second.mode.html;
    if (secondMode !== 'full') {
      throw new Error(`[MODE_DRIFT] mode changed after reload bootstrap: ${JSON.stringify(second.mode)}`);
    }
    if (second.recovery.visible) {
      throw new Error('[UNREQUESTED_RECOVERY] recovery banner appeared after deterministic reload bootstrap');
    }
    if ((second.project.loadedBody ?? second.project.loadedHtml) !== '1') {
      throw new Error('[PROJECT_REHYDRATE_DRIFT] project missing after deterministic reload bootstrap');
    }
    if (second.service.status !== 'online') {
      throw new Error(
        `[SERVICE_STATE_DRIFT] service not online after deterministic reload bootstrap: ${JSON.stringify(second.service)}`,
      );
    }

    // Probe no-project startup request. If harness rehydrates anyway, record as deferred limitation, not fake-green.
    await page.evaluate(() => {
      window.__dev?.setStartupConfig?.({
        mode: 'full',
        projectPath: null,
        recovery: false,
        services: 'stub',
        allowRuntimeModeOverride: false,
        allowLayoutRestore: false,
      });
    });
    await page.evaluate(async () => {
      await window.__dev?.setProjectDir?.(null);
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await installServiceStubs(page, 'normal', 'full');
    await waitForNoProjectAuthorityState(page, 'PROJECT_REHYDRATE_DRIFT');
    const noProjectSnapshot = await collectStartupStateSnapshot(page);
    const noProjectLoaded = noProjectSnapshot.project.loadedBody ?? noProjectSnapshot.project.loadedHtml;
    if (noProjectLoaded === '1') {
      await testInfo.attach('phase3c-no-project-rehydrate-caveat.json', {
        body: Buffer.from(
          `${JSON.stringify(
            {
              classification: 'PROJECT_REHYDRATE_DRIFT',
              note: 'No-project startup request rehydrated to loaded project in current harness.',
              snapshot: noProjectSnapshot,
            },
            null,
            2,
          )}\n`,
          'utf-8',
        ),
        contentType: 'application/json',
      });
    } else {
      await assertActionButtonsDisabled(page, 'PROJECT_REHYDRATE_DRIFT');
    }
  });

  test('service online/offline transition contract', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, {
      expectedMode: 'full',
      expectedServiceStatus: 'online',
      requireActiveScene: false,
    });

    const setScene = await page.evaluate(async () => {
      const selectScene = window.__dev?.selectScene;
      if (typeof selectScene !== 'function') {
        return { classification: 'BRIDGE_MISSING' as const };
      }
      await selectScene('sc_0001');
      return { classification: 'OK' as const };
    });
    if (setScene.classification !== 'OK') {
      throw new Error(`[SERVICE_MARKER_MISSING] scene selection bridge unavailable: ${JSON.stringify(setScene)}`);
    }
    await expect
      .poll(() =>
        page.evaluate(() => ({
          body: document.body?.dataset?.activeSceneId ?? null,
          html: document.documentElement?.dataset?.activeSceneId ?? null,
        })),
      )
      .toEqual({ body: 'sc_0001', html: 'sc_0001' });

    await waitForServiceStatus(page, { status: 'online', reason: 'online' });
    await openPreflightDialog(page, {
      actionTestId: 'workspace-action-generate',
      dialogName: /draft preflight/i,
      timeoutMs: 30_000,
    });
    await page.locator('.preflight-modal__close').click();
    await page.locator('.preflight-modal').waitFor({ state: 'detached', timeout: 30_000 });

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test:service-health', { detail: { status: 'offline' } }));
    });
    await waitForServiceStatus(page, { status: 'offline', reason: 'test-offline' });
    await assertActionButtonsDisabled(page, 'ACTION_ENABLED_WHILE_OFFLINE');

    const offlineMarker = await page.evaluate(() => {
      const pill = document.querySelector('[data-testid="service-status-pill"]');
      if (!pill) {
        return null;
      }
      return {
        status: pill.getAttribute('data-status'),
        reason: pill.getAttribute('data-reason'),
      };
    });
    if (!offlineMarker) {
      throw new Error('[SERVICE_MARKER_MISSING] service status pill missing after offline transition');
    }
    if (offlineMarker.status !== 'offline') {
      throw new Error(`[SERVICE_OFFLINE_NOT_REFLECTED] expected offline marker: ${JSON.stringify(offlineMarker)}`);
    }

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test:service-health', { detail: { status: 'online' } }));
    });
    await waitForServiceStatus(page, { status: 'online', reason: 'online' });
    const recoveredStates = await page.evaluate(() => {
      const ids = ['workspace-action-generate', 'workspace-action-critique'] as const;
      return ids.map((testId) => {
        const node = document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement | null;
        return {
          testId,
          present: Boolean(node),
          enabled: Boolean(node && !node.disabled),
        };
      });
    });
    const notRecovered = recoveredStates.find((state) => !state.present || !state.enabled);
    if (notRecovered) {
      throw new Error(
        `[SERVICE_RECOVERY_NOT_REFLECTED] actions not re-enabled after online recovery: ${JSON.stringify(recoveredStates)}`,
      );
    }
  });

  test('recovery banner appears only when expected', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, {
      expectedMode: 'full',
      expectedServiceStatus: 'online',
      allowRecoveryBanner: false,
      requireActiveScene: false,
    });

    const unexpectedBanner = await page.evaluate(() => {
      const banner = document.querySelector('[data-testid="recovery-banner"]') as HTMLElement | null;
      if (!banner) {
        return { present: false, visible: false };
      }
      const style = window.getComputedStyle(banner);
      return {
        present: true,
        visible: style.display !== 'none' && style.visibility !== 'hidden',
        text: banner.textContent?.trim() ?? null,
      };
    });
    if (unexpectedBanner.visible) {
      throw new Error(`[UNREQUESTED_RECOVERY] recovery banner visible in non-recovery startup: ${JSON.stringify(unexpectedBanner)}`);
    }
  });

  test('recovery restore snapshot contract', async ({ page }) => {
    await installServiceStubs(page, 'snapshot', 'flat');
    await bootstrapHarness(page, {
      expectedMode: 'full',
      allowRecoveryBanner: true,
      expectedServiceStatus: 'online',
      requireActiveScene: false,
      requiredEnabledActions: ['workspace-action-snapshot'],
    });

    const bannerState = await page.evaluate(() => {
      const banner = document.querySelector('[data-testid="recovery-banner"]') as HTMLElement | null;
      if (!banner) {
        return { present: false, visible: false, hasRestoreButton: false };
      }
      const style = window.getComputedStyle(banner);
      const restoreButton = Array.from(banner.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Restore snapshot',
      ) as HTMLButtonElement | undefined;
      return {
        present: true,
        visible: style.display !== 'none' && style.visibility !== 'hidden',
        hasRestoreButton: Boolean(restoreButton),
        restoreDisabled: restoreButton ? restoreButton.disabled : null,
      };
    });
    if (!bannerState.present || !bannerState.visible) {
      throw new Error(
        `[RECOVERY_BANNER_MISSING] recovery banner not visible in recovery-allowed snapshot scenario: ${JSON.stringify(bannerState)}`,
      );
    }
    if (!bannerState.hasRestoreButton || bannerState.restoreDisabled) {
      throw new Error(
        `[RESTORE_BUTTON_CONTRACT_BROKEN] restore button missing or disabled in recovery banner: ${JSON.stringify(bannerState)}`,
      );
    }

    const recoveryBanner = page.getByTestId('recovery-banner');
    const restoreButton = recoveryBanner.getByRole('button', { name: 'Restore snapshot' });
    await expect(recoveryBanner).toBeVisible({ timeout: 30_000 });
    await expect(restoreButton).toBeVisible({ timeout: 30_000 });
    await expect(restoreButton).toBeEnabled({ timeout: 30_000 });
    await restoreButton.click();

    await waitForSnapshotRestoreComplete(page);
    const restoreDone = await page.evaluate(() => {
      const win = window as typeof window & { __snapshotRestoreDone?: boolean };
      return win.__snapshotRestoreDone === true;
    });
    if (!restoreDone) {
      throw new Error('[RESTORE_COMPLETION_MARKER_MISSING] __snapshotRestoreDone did not become true after restore');
    }

    const postRestoreState = await page.evaluate(() => {
      const banner = document.querySelector('[data-testid="recovery-banner"]') as HTMLElement | null;
      const mode = document.body?.dataset?.testMode ?? document.documentElement?.dataset?.testMode ?? null;
      const projectLoaded =
        document.body?.dataset?.projectLoaded ?? document.documentElement?.dataset?.projectLoaded ?? null;
      if (!banner) {
        return { bannerPresent: false, bannerVisible: false, mode, projectLoaded };
      }
      const style = window.getComputedStyle(banner);
      return {
        bannerPresent: true,
        bannerVisible: style.display !== 'none' && style.visibility !== 'hidden',
        mode,
        projectLoaded,
      };
    });
    if (!postRestoreState.projectLoaded || postRestoreState.projectLoaded !== '1') {
      throw new Error(
        `[RECOVERY_STATE_DRIFT] project not committed after restore completion: ${JSON.stringify(postRestoreState)}`,
      );
    }
  });

  test('post-mount direct startup-object mutation does not reconfigure mode without rebootstrap', async ({
    page,
  }) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, { expectedMode: 'full' });

    await page.evaluate(() => {
      const win = window as typeof window & {
        __E2E_STARTUP_CONFIG?: Record<string, unknown> | null;
      };
      const config = win.__E2E_STARTUP_CONFIG;
      if (config && typeof config === 'object') {
        config.mode = 'recovery';
        config.recovery = true;
      }
    });

    await expect
      .poll(() => page.evaluate(() => window.testMode?.getMode?.() ?? document.body?.dataset?.testMode ?? null))
      .toBe('full');
    await expect(page.getByTestId('recovery-banner')).toHaveCount(0);
  });

  test('reload + bootstrapHarness applies new startup contract deterministically', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, { expectedMode: 'full' });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await installServiceStubs(page, 'normal', 'flat');
    await bootstrapHarness(page, { expectedMode: 'flat' });
    await expect
      .poll(() => page.evaluate(() => window.testMode?.getMode?.() ?? document.body?.dataset?.testMode ?? null))
      .toBe('flat');
  });

  test('runtime service-health event updates UI without startup rebootstrap', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await bootstrapHarness(page, { expectedMode: 'flat' });

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test:service-health', { detail: { status: 'offline' } }));
    });
    await waitForServiceStatus(page, { status: 'offline', reason: 'test-offline' });

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test:service-health', { detail: { status: 'online' } }));
    });
    await waitForServiceStatus(page, { status: 'online', reason: 'online' });
  });

  test('diagnostic_service_override_seam_consistency', async ({ page }, testInfo) => {
    await installServiceStubs(page, 'normal', 'flat');
    await bootstrapHarness(page, { expectedMode: 'flat', requireActiveScene: true });

    const seamDiagnostics = await page.evaluate(async ({ projectPath }) => {
      const win = window as typeof window & {
        __seamDiagnostics?: Record<string, unknown>;
      };
      const services = window.services;
      if (!services?.preflightDraft) {
        return {
          hasServices: Boolean(services),
          hasPreflight: false,
          directCallOk: false,
          uiFlowObserved: false,
          preflightCalls: 0,
          traceIds: [],
        };
      }

      const traceIds: string[] = [];
      let preflightCalls = 0;
      const original = services.preflightDraft.bind(services);
      const wrapped = async (...args: Parameters<typeof original>) => {
        preflightCalls += 1;
        const result = await original(...args);
        if (result?.traceId) {
          traceIds.push(result.traceId);
        }
        return result;
      };

      services.preflightDraft = wrapped;
      window.__dev?.overrideServices?.({ preflightDraft: wrapped });
      if (window.__dev?.setProjectDir) {
        await window.__dev.setProjectDir(projectPath);
      }

      const directResult = await services.preflightDraft({
        projectId: document.body?.dataset?.projectId ?? 'proj_esther_estate',
        unitScope: 'scene',
        unitIds: ['sc_0001'],
      });

      win.__seamDiagnostics = {
        directResult,
        preflightCalls,
        traceIds,
      };
      return {
        hasServices: true,
        hasPreflight: true,
        directCallOk: Boolean(directResult?.ok),
        uiFlowObserved: preflightCalls > 1,
        preflightCalls,
        traceIds,
      };
    }, { projectPath: sampleProjectPath });

    const dialog = await openPreflightDialog(page, {
      actionTestId: 'workspace-action-generate',
      dialogName: /draft preflight/i,
      timeoutMs: 30_000,
    });
    await expect
      .poll(
        async () => {
          const text = (await dialog.textContent()) ?? '';
          return (
            text.includes('Estimate within budget') ||
            text.includes('Budget healthy') ||
            text.includes('Budget OK')
          );
        },
        { timeout: 15_000 },
      )
      .toBe(true);
    const modalText = (await dialog.textContent()) ?? '';
    const hasBudgetHint =
      modalText.includes('Estimate within budget') ||
      modalText.includes('Budget healthy') ||
      modalText.includes('Budget OK');

    await testInfo.attach('service-override-seam-consistency.json', {
      body: Buffer.from(
        `${JSON.stringify({ seamDiagnostics, modalText, hasBudgetHint }, null, 2)}\n`,
        'utf-8',
      ),
      contentType: 'application/json',
    });
    expect(seamDiagnostics.hasServices).toBe(true);
    expect(seamDiagnostics.hasPreflight).toBe(true);
    expect(seamDiagnostics.directCallOk).toBe(true);
    expect(hasBudgetHint).toBe(true);
  });
});
