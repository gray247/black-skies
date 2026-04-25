import { test, expect } from './_electron.fixture';
import { bootstrapHarness, collectStartupStateSnapshot } from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';

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
  const selectionDiagnostics = await page.evaluate((sceneId) => {
    const buttons = Array.from(document.querySelectorAll('.project-home__scene-button'));
    const byId = Array.from(document.querySelectorAll('.project-home__scene-id')).find(
      (node) => (node.textContent ?? '').trim() === sceneId,
    );
    const targetButton =
      (byId?.closest('button') as HTMLButtonElement | null) ??
      (buttons.find((button) => (button.textContent ?? '').includes(sceneId)) as HTMLButtonElement | undefined) ??
      null;
    const result = {
      targetSceneId: sceneId,
      hasSelector: Boolean(targetButton),
      selectionMethod: targetButton ? 'button-click' : 'event-only',
      selectorMatched: targetButton
        ? byId
          ? '.project-home__scene-id -> closest(button.project-home__scene-button)'
          : '.project-home__scene-button (text contains scene id)'
        : null,
      targetText: targetButton?.textContent?.trim() ?? null,
      targetVisible: false,
      targetRect: null as { x: number; y: number; width: number; height: number } | null,
      clickDispatchedAt: null as string | null,
    };
    if (targetButton) {
      const style = window.getComputedStyle(targetButton);
      result.targetVisible = style.display !== 'none' && style.visibility !== 'hidden';
      const rect = targetButton.getBoundingClientRect();
      result.targetRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      targetButton.click();
      result.clickDispatchedAt = new Date().toISOString();
      return result;
    }
    window.dispatchEvent(new CustomEvent('test:select-scene', { detail: sceneId }));
    result.clickDispatchedAt = new Date().toISOString();
    return result;
  }, targetSceneId);

  await testInfo.attach('truth-active-scene-selection.json', {
    body: Buffer.from(`${JSON.stringify(selectionDiagnostics, null, 2)}\n`, 'utf-8'),
    contentType: 'application/json',
  });
  expect(selectionDiagnostics.hasSelector).toBe(true);

  await page.waitForFunction(
    (sceneId) => {
      const active = document.querySelector(
        '.project-home__scene-card--active .project-home__scene-button[aria-pressed="true"]',
      );
      return Boolean(active && (active.textContent ?? '').includes(sceneId));
    },
    targetSceneId,
    { timeout: 30_000 },
  );

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

