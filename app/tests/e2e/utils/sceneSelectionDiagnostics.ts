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
    const buttons = Array.from(document.querySelectorAll('.project-home__scene-button'));
    const bySceneIdNode = Array.from(document.querySelectorAll('.project-home__scene-id')).find(
      (node) => (node.textContent ?? '').trim() === targetSceneId,
    );
    const candidateById = bySceneIdNode?.closest('button.project-home__scene-button') as
      | HTMLButtonElement
      | null;
    const candidateByText = buttons.find((button) =>
      (button.textContent ?? '').includes(targetSceneId),
    ) as HTMLButtonElement | undefined;
    const targetButton = candidateById ?? candidateByText ?? null;
    if (!targetButton) {
      return {
        matchedSelector: null,
        targetText: null,
        targetVisible: false,
        targetRect: null,
        clickDispatchedAt: null,
      };
    }

    const style = window.getComputedStyle(targetButton);
    const rect = targetButton.getBoundingClientRect();
    targetButton.click();
    return {
      matchedSelector: candidateById
        ? '.project-home__scene-id -> closest(button.project-home__scene-button)'
        : '.project-home__scene-button (text contains scene id)',
      targetText: targetButton.textContent?.trim() ?? null,
      targetVisible: style.display !== 'none' && style.visibility !== 'hidden',
      targetRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      clickDispatchedAt: new Date().toISOString(),
    };
  }, sceneId);

  if (!clickResult.matchedSelector) {
    const payload: SceneSelectionDiagnostics = {
      targetSceneId: sceneId,
      matchedSelector: null,
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
      return {
        at: new Date().toISOString(),
        activeSceneText: activeText,
        activeScenePresent: Boolean(active),
        selectedCardCount: selectedCards,
        focused: {
          testId: focused?.getAttribute('data-testid') ?? null,
          className: focused?.className ?? null,
          text: focused?.textContent?.trim() ?? null,
        },
        matched: Boolean(activeText && activeText.includes(targetSceneId)),
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
