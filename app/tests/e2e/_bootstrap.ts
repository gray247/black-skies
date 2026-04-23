import type { Page } from '@playwright/test';
import { loadSampleProject } from './utils/sampleProject';

type HarnessServiceStatus = 'online' | 'offline' | 'port-unavailable';
type HarnessMode = 'flat' | 'full' | 'recovery';

interface BootstrapHarnessOptions {
  expectedServiceStatus?: HarnessServiceStatus | null;
  expectedServiceReason?: string;
  requiredEnabledActions?: string[];
}

interface EnsureDockPaneVisibleOptions {
  paneId: string;
  hiddenLabel: string;
}

interface WaitForSnapshotRestoreOptions {
  requireBannerDismissed?: boolean;
}

interface OpenPreflightDialogOptions {
  actionTestId?: string;
  dialogName?: string | RegExp;
  timeoutMs?: number;
}

interface WaitForServiceStatusOptions {
  status: HarnessServiceStatus;
  reason?: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

async function waitForHarnessMode(page: Page, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<HarnessMode> {
  await page.waitForFunction(
    () => {
      const mode = document.body?.dataset?.testMode;
      return mode === 'flat' || mode === 'full' || mode === 'recovery';
    },
    null,
    { timeout: timeoutMs },
  );
  return page.evaluate(() => (document.body?.dataset?.testMode ?? 'full') as HarnessMode);
}

async function waitForActionEnabled(
  page: Page,
  testId: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  await page.waitForFunction(
    (targetTestId) => {
      const button = document.querySelector(`[data-testid="${targetTestId}"]`) as
        | HTMLButtonElement
        | null;
      if (!button) {
        return false;
      }
      if (button.disabled) {
        return false;
      }
      const style = window.getComputedStyle(button);
      return style.display !== 'none' && style.visibility !== 'hidden';
    },
    testId,
    { timeout: timeoutMs },
  );
}

async function waitForProjectLoaded(
  page: Page,
  options: { timeoutMs?: number; mode?: HarnessMode } = {},
): Promise<HarnessMode> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!options.mode) {
    await waitForHarnessMode(page, timeoutMs);
  }

  await page.waitForFunction(
    () => {
      const bodyMode = document.body?.dataset?.testMode;
      if (bodyMode !== 'flat' && bodyMode !== 'full' && bodyMode !== 'recovery') {
        return false;
      }

      const subtitle = document.querySelector('.app-shell__workspace-subtitle');
      const projectLabel = subtitle?.textContent?.trim() ?? '';
      return Boolean(projectLabel) && projectLabel !== 'No project loaded';
    },
    null,
    { timeout: timeoutMs },
  );

  return waitForHarnessMode(page, timeoutMs);
}

export async function bootstrapHarness(
  page: Page,
  options: BootstrapHarnessOptions = {},
): Promise<void> {
  const expectedServiceStatus = options.expectedServiceStatus ?? 'online';
  const expectedServiceReason = options.expectedServiceReason;
  const requiredEnabledActions = options.requiredEnabledActions ?? [];
  await page.waitForFunction(
    () => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true,
    null,
    {
      timeout: DEFAULT_TIMEOUT_MS,
    },
  );
  await page.getByTestId('app-root').waitFor({ timeout: DEFAULT_TIMEOUT_MS });

  await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="companion-overlay"]') as HTMLElement | null;
    if (overlay) {
      overlay.style.display = 'none';
    }
  });

  const { projectRoot: sampleProjectPath, projectId: sampleProjectId } = loadSampleProject();
  await page.evaluate((projectPath) => {
    const win = window as typeof window & {
      __dev?: { setProjectDir?: (path: string | null) => void | Promise<void> };
    };
    return Promise.resolve(win.__dev?.setProjectDir?.(projectPath ?? null));
  }, sampleProjectPath);
  await page.evaluate(
    ({ projectId, projectPath }: { projectId: string; projectPath: string }) => {
      const win = window as typeof window & {
        __testEnvDefaultProjectId?: string;
        __testEnvDefaultProjectPath?: string;
        __testEnvAutoSeedProjectSummary?: boolean;
      };
      win.__testEnvDefaultProjectId = projectId;
      win.__testEnvDefaultProjectPath = projectPath;
      // Keep harness bootstrap state-based but avoid relying on click visibility races
      // for initial project summary hydration in CI startup timing.
      win.__testEnvAutoSeedProjectSummary = true;
    },
    { projectId: sampleProjectId, projectPath: sampleProjectPath },
  );

  const openProject = page.getByTestId('open-project');
  if (await openProject.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await page
      .waitForFunction(
        () => {
          const button = document.querySelector('[data-testid="open-project"]') as
            | HTMLButtonElement
            | null;
          return button !== null && !button.disabled;
        },
        null,
        { timeout: 10_000 },
      )
      .catch(() => undefined);
    if (await openProject.isEnabled().catch(() => false)) {
      await openProject.click({ force: true });
    }
  }

  if (expectedServiceStatus === 'online') {
    await page.evaluate(() => {
      window.__dev?.overrideServices?.({
        async checkHealth() {
          return {
            ok: true,
            data: { status: 'online' },
            traceId: 'pw-health',
          };
        },
      });
      window.dispatchEvent(
        new CustomEvent('test:service-health', {
          detail: { status: 'online' },
        }),
      );
    });
  }

  if (expectedServiceStatus) {
    await page.waitForFunction(
      ({ expectedStatus, expectedReason }) => {
        const pill = document.querySelector('[data-testid="service-status-pill"]') as HTMLElement | null;
        const status = pill?.getAttribute('data-status');
        if (status !== expectedStatus) {
          return false;
        }
        if (!expectedReason) {
          return true;
        }
        return pill?.getAttribute('data-reason') === expectedReason;
      },
      {
        expectedStatus: expectedServiceStatus,
        expectedReason: expectedServiceReason ?? null,
      },
      { timeout: DEFAULT_TIMEOUT_MS },
    );
  }

  await waitForProjectLoaded(page, { timeoutMs: DEFAULT_TIMEOUT_MS });
  for (const actionId of requiredEnabledActions) {
    await waitForActionEnabled(page, actionId, DEFAULT_TIMEOUT_MS);
  }
}

export async function ensureDockPaneVisible(
  page: Page,
  options: EnsureDockPaneVisibleOptions,
): Promise<void> {
  await waitForProjectLoaded(page, { timeoutMs: DEFAULT_TIMEOUT_MS });

  const pane = page.locator(`[data-pane-id="${options.paneId}"]`);
  if (await pane.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
    return;
  }

  const hiddenRegion = page.getByRole('region', { name: 'Hidden panes' });
  const restoreButton = hiddenRegion.getByRole('button', { name: options.hiddenLabel });

  try {
    await page.waitForFunction(
      ({ paneId, hiddenLabel }) => {
        const paneVisible = (() => {
          const paneNode = document.querySelector(`[data-pane-id="${paneId}"]`) as HTMLElement | null;
          if (!paneNode) {
            return false;
          }
          const style = window.getComputedStyle(paneNode);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })();
        if (paneVisible) {
          return true;
        }

        const hiddenRegionNode = Array.from(document.querySelectorAll('[role="region"]')).find(
          (element) => element.getAttribute('aria-label') === 'Hidden panes',
        ) as HTMLElement | undefined;
        if (!hiddenRegionNode) {
          return false;
        }
        const hiddenRegionStyle = window.getComputedStyle(hiddenRegionNode);
        if (hiddenRegionStyle.display === 'none' || hiddenRegionStyle.visibility === 'hidden') {
          return false;
        }
        const restoreNode = Array.from(hiddenRegionNode.querySelectorAll('button')).find(
          (button) => button.textContent?.trim() === hiddenLabel,
        ) as HTMLButtonElement | undefined;
        return Boolean(restoreNode && !restoreNode.disabled);
      },
      { paneId: options.paneId, hiddenLabel: options.hiddenLabel },
      { timeout: DEFAULT_TIMEOUT_MS },
    );
  } catch (error) {
    const diagnostics = await page.evaluate(() => {
      const mode = document.body?.dataset?.testMode ?? 'unknown';
      const dock = document.querySelector('[data-testid="dock-workspace"]') as HTMLElement | null;
      const hidden = Array.from(document.querySelectorAll('[role="region"]')).find(
        (element) => element.getAttribute('aria-label') === 'Hidden panes',
      ) as HTMLElement | undefined;
      const projectLabel =
        document.querySelector('.app-shell__workspace-subtitle')?.textContent?.trim() ?? '';
      const isVisible = (node: HTMLElement | null | undefined) => {
        if (!node) {
          return false;
        }
        const style = window.getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      };
      return {
        mode,
        dockPresent: Boolean(dock),
        dockVisible: isVisible(dock),
        hiddenPanesVisible: isVisible(hidden),
        projectLabel,
      };
    });
    throw new Error(
      `Pane "${options.paneId}" failed to converge within ${DEFAULT_TIMEOUT_MS}ms. ` +
        `mode=${diagnostics.mode} dockPresent=${diagnostics.dockPresent} ` +
        `dockVisible=${diagnostics.dockVisible} hiddenPanesVisible=${diagnostics.hiddenPanesVisible} ` +
        `projectLabel="${diagnostics.projectLabel}"` +
        (error instanceof Error ? ` cause="${error.message}"` : ''),
    );
  }

  if (await pane.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
    return;
  }

  await restoreButton.click();
  await pane.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
}

export async function waitForSnapshotRestoreComplete(
  page: Page,
  options: WaitForSnapshotRestoreOptions = {},
): Promise<void> {
  await page.waitForFunction(
    () =>
      (window as typeof window & { __snapshotRestoreDone?: boolean }).__snapshotRestoreDone ===
      true,
    null,
    { timeout: DEFAULT_TIMEOUT_MS },
  );
  if (options.requireBannerDismissed === true) {
    await page.waitForFunction(
      () => document.querySelector('[data-testid="recovery-banner"]') === null,
      null,
      { timeout: DEFAULT_TIMEOUT_MS },
    );
  }
}

export async function openPreflightDialog(
  page: Page,
  options: OpenPreflightDialogOptions = {},
) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const actionTestId = options.actionTestId ?? 'workspace-action-generate';
  const dialogName = options.dialogName ?? /draft preflight/i;

  await waitForProjectLoaded(page, { timeoutMs });
  await waitForActionEnabled(page, actionTestId, timeoutMs);
  await page.getByTestId(actionTestId).click();

  const dialog = page.getByRole('dialog', { name: dialogName });
  await dialog.waitFor({ state: 'visible', timeout: timeoutMs });
  return dialog;
}

export async function waitForServiceStatus(
  page: Page,
  options: WaitForServiceStatusOptions,
): Promise<void> {
  await page.waitForFunction(
    ({ expectedStatus, expectedReason }) => {
      const pill = document.querySelector('[data-testid="service-status-pill"]') as HTMLElement | null;
      if (!pill) {
        return false;
      }
      if (pill.getAttribute('data-status') !== expectedStatus) {
        return false;
      }
      if (!expectedReason) {
        return true;
      }
      return pill.getAttribute('data-reason') === expectedReason;
    },
    {
      expectedStatus: options.status,
      expectedReason: options.reason ?? null,
    },
    { timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS },
  );
}
