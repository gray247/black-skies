import type { Page, TestInfo } from '@playwright/test';

interface SceneSelectionOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  attachmentName?: string;
}

interface SceneSelectionPollSample {
  at: string;
  activeSceneText: string | null;
  activeScenePresent: boolean;
  selectedCardCount: number;
  focused: {
    testId: string | null;
    className: string | null;
    text: string | null;
  };
}

interface SceneSelectionDiagnostics {
  targetSceneId: string;
  matchedSelector: string | null;
  selectionMethod: string | null;
  targetText: string | null;
  targetVisible: boolean;
  targetRect: { x: number; y: number; width: number; height: number } | null;
  clickDispatchedAt: string | null;
  activeSceneReached: boolean;
  timeoutMs: number;
  pollSamples: SceneSelectionPollSample[];
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 500;

export async function selectSceneWithDiagnostics(
  page: Page,
  testInfo: TestInfo,
  sceneId: string,
  options: SceneSelectionOptions = {},
): Promise<SceneSelectionDiagnostics> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const attachmentName = options.attachmentName ?? `scene-selection-${sceneId}.json`;
  const pollSamples: SceneSelectionPollSample[] = [];

  const clickResult = await page.evaluate((targetSceneId) => {
    const buttons = Array.from(document.querySelectorAll('button.project-home__scene-button'));
    const byDataScene = document.querySelector(
      `button.project-home__scene-button[data-scene-id="${targetSceneId}"]`,
    ) as HTMLButtonElement | null;
    const bySceneIdNode = Array.from(document.querySelectorAll('.project-home__scene-id')).find(
      (node) => (node.textContent ?? '').trim() === targetSceneId,
    );
    const bySceneIdNodeButton = bySceneIdNode?.closest('button.project-home__scene-button') as
      | HTMLButtonElement
      | null;
    const byText = buttons.find((button) =>
      (button.textContent ?? '').includes(targetSceneId),
    ) as HTMLButtonElement | undefined;
    const targetButton = byDataScene ?? bySceneIdNodeButton ?? byText ?? null;
    if (targetButton) {
      const style = window.getComputedStyle(targetButton);
      const rect = targetButton.getBoundingClientRect();
      targetButton.click();
      return {
        matchedSelector: byDataScene
          ? 'button.project-home__scene-button[data-scene-id="<scene-id>"]'
          : bySceneIdNodeButton
            ? '.project-home__scene-id -> closest(button.project-home__scene-button)'
            : '.project-home__scene-button (text contains scene id)',
        selectionMethod: 'button-click',
        targetText: targetButton.textContent?.trim() ?? null,
        targetVisible: style.display !== 'none' && style.visibility !== 'hidden',
        targetRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        clickDispatchedAt: new Date().toISOString(),
      };
    }

    const devSelectScene = (
      window as typeof window & { __dev?: { selectScene?: (sceneId: string) => boolean | void } }
    ).__dev?.selectScene;
    if (typeof devSelectScene === 'function') {
      devSelectScene(targetSceneId);
      return {
        matchedSelector: '__dev.selectScene("<scene-id>")',
        selectionMethod: 'dev-api',
        targetText: null,
        targetVisible: false,
        targetRect: null,
        clickDispatchedAt: new Date().toISOString(),
      };
    }

    window.dispatchEvent(new CustomEvent('test:select-scene', { detail: targetSceneId }));
    return {
      matchedSelector: 'window.dispatchEvent("test:select-scene")',
      selectionMethod: 'event-dispatch',
      targetText: null,
      targetVisible: false,
      targetRect: null,
      clickDispatchedAt: new Date().toISOString(),
    };
  }, sceneId);

  if (!clickResult.matchedSelector) {
    const payload: SceneSelectionDiagnostics = {
      targetSceneId: sceneId,
      matchedSelector: null,
      selectionMethod: null,
      targetText: null,
      targetVisible: false,
      targetRect: null,
      clickDispatchedAt: null,
      activeSceneReached: false,
      timeoutMs,
      pollSamples,
    };
    await testInfo.attach(attachmentName, {
      body: Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, 'utf-8'),
      contentType: 'application/json',
    });
    return payload;
  }

  const startedAt = Date.now();
  let activeSceneReached = false;
  while (Date.now() - startedAt <= timeoutMs) {
    const sample = await page.evaluate((targetSceneId) => {
      const active = document.querySelector(
        '.project-home__scene-card--active .project-home__scene-button[aria-pressed="true"]',
      ) as HTMLElement | null;
      const selectedCards = document.querySelectorAll('.project-home__scene-card--active').length;
      const focused = document.activeElement as HTMLElement | null;
      const activeText = active?.textContent?.trim() ?? null;
      const bodySceneId = document.body?.dataset?.activeSceneId ?? null;
      const htmlSceneId = document.documentElement?.dataset?.activeSceneId ?? null;
      const debugState = (
        window as typeof window & {
          __testProjectState?: { activeSceneId?: string | null };
          __blackskiesDebugProjectState?: { activeSceneId?: string | null };
        }
      );
      const debugSceneId =
        debugState.__testProjectState?.activeSceneId ??
        debugState.__blackskiesDebugProjectState?.activeSceneId ??
        null;
      return {
        at: new Date().toISOString(),
        activeSceneText: activeText,
        activeScenePresent: Boolean(active),
        selectedCardCount: selectedCards,
        bodySceneId,
        htmlSceneId,
        debugSceneId,
        focused: {
          testId: focused?.getAttribute('data-testid') ?? null,
          className: focused?.className ?? null,
          text: focused?.textContent?.trim() ?? null,
        },
        matched:
          Boolean(activeText && activeText.includes(targetSceneId)) ||
          bodySceneId === targetSceneId ||
          htmlSceneId === targetSceneId ||
          debugSceneId === targetSceneId,
      };
    }, sceneId);
    pollSamples.push({
      at: sample.at,
      activeSceneText: sample.activeSceneText,
      activeScenePresent: sample.activeScenePresent,
      selectedCardCount: sample.selectedCardCount,
      focused: sample.focused,
    });
    if (sample.matched) {
      activeSceneReached = true;
      break;
    }
    await page.waitForTimeout(pollIntervalMs);
  }

  const payload: SceneSelectionDiagnostics = {
    targetSceneId: sceneId,
    matchedSelector: clickResult.matchedSelector,
    selectionMethod: clickResult.selectionMethod ?? null,
    targetText: clickResult.targetText,
    targetVisible: clickResult.targetVisible,
    targetRect: clickResult.targetRect,
    clickDispatchedAt: clickResult.clickDispatchedAt,
    activeSceneReached,
    timeoutMs,
    pollSamples,
  };
  await testInfo.attach(attachmentName, {
    body: Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, 'utf-8'),
    contentType: 'application/json',
  });
  return payload;
}
