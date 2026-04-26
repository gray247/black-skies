import { test, expect } from './_electron.fixture';
import { bootstrapHarness, collectStartupStateSnapshot } from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';
import { selectSceneWithDiagnostics } from './utils/sceneSelectionDiagnostics';

// HARNESS_ONLY:
// Reason: diagnostic guard for truth-lane active-scene selection readiness.
// Owner: app/tests/e2e/truth_active_scene_diagnostic.spec.ts
// Retire when: truth lane has stable active-scene diagnostics with CI signal parity.

test('truth_active_scene_diagnostic (UI)', async ({ page }, testInfo) => {
  await installServiceStubs(page, 'normal', 'full');
  await bootstrapHarness(page, { expectedMode: 'full' });

  await expect(page.getByTestId('dock-workspace')).toBeVisible({ timeout: 30_000 });
  const corkboardCard = page.getByTestId('corkboard-card').first();
  await expect(corkboardCard).toBeVisible({ timeout: 30_000 });

  const targetSceneId = 'sc_0001';
  const selectionDiagnostics = await selectSceneWithDiagnostics(page, testInfo, targetSceneId, {
    attachmentName: 'truth-active-scene-selection.json',
    timeoutMs: 30_000,
    pollIntervalMs: 500,
  });
  expect(selectionDiagnostics.matchedSelector).toBeTruthy();
  expect(selectionDiagnostics.activeSceneReached).toBe(true);

  const startupSnapshot = await collectStartupStateSnapshot(page);
  const activeSceneSnapshot = await page.evaluate((sceneId) => {
    const servicePill = document.querySelector('[data-testid="service-status-pill"]');
    const active = document.querySelector(
      '.project-home__scene-card--active .project-home__scene-button[aria-pressed="true"]',
    );
    return {
      capturedAt: new Date().toISOString(),
      targetSceneId: sceneId,
      readyState: document.readyState,
      url: window.location.href,
      datasets: {
        body: { ...(document.body?.dataset ?? {}) },
        html: { ...(document.documentElement?.dataset ?? {}) },
      },
      service: {
        status: servicePill?.getAttribute('data-status') ?? null,
        reason: servicePill?.getAttribute('data-reason') ?? null,
      },
      corkboardCardCounts: {
        byTestId: document.querySelectorAll('[data-testid="corkboard-card"]').length,
        byClass: document.querySelectorAll('.corkboard-card').length,
      },
      activeScene: {
        present: Boolean(active),
        text: active?.textContent?.trim() ?? null,
        bodySceneId: document.body?.dataset?.activeSceneId ?? null,
        htmlSceneId: document.documentElement?.dataset?.activeSceneId ?? null,
      },
      debugState: {
        blackSkiesDebugState:
          (
            window as typeof window & {
              __blackSkiesDebugState?: unknown;
              __blackskiesDebugState?: unknown;
              __blackskiesDebugProjectState?: unknown;
            }
          ).__blackSkiesDebugState ??
          (
            window as typeof window & {
              __blackskiesDebugState?: unknown;
              __blackskiesDebugProjectState?: unknown;
            }
          ).__blackskiesDebugState ??
          (
            window as typeof window & {
              __blackskiesDebugProjectState?: unknown;
            }
          ).__blackskiesDebugProjectState ??
          null,
      },
    };
  }, targetSceneId);

  await testInfo.attach('truth-active-scene-snapshot.json', {
    body: Buffer.from(
      `${JSON.stringify({ startupSnapshot, activeSceneSnapshot }, null, 2)}\n`,
      'utf-8',
    ),
    contentType: 'application/json',
  });
});
