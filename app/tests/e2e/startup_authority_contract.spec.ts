import { test, expect } from './_electron.fixture';
import {
  bootstrapHarness,
  collectStartupStateSnapshot,
  openPreflightDialog,
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
  test('startup config set at bootstrap is authoritative', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await bootstrapHarness(page, { expectedMode: 'flat' });

    const snapshot = await collectStartupStateSnapshot(page);
    expect(snapshot.mode.body ?? snapshot.mode.html).toBe('flat');
    expect(snapshot.recovery.visible).toBe(false);
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
