import { test as playwrightTest } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loadSampleProject } from './utils/sampleProject';
import { normalizeProjectPath, projectPathContractMatch } from './utils/pathNormalization';

type HarnessServiceStatus = 'online' | 'offline' | 'port-unavailable';
type HarnessMode = 'flat' | 'full' | 'recovery';

interface BootstrapHarnessOptions {
  expectedServiceStatus?: HarnessServiceStatus | null;
  expectedServiceReason?: string;
  requiredEnabledActions?: string[];
  expectedMode?: HarnessMode;
  allowRecoveryBanner?: boolean;
  requireActiveScene?: boolean;
  requireStartupSnapshot?: boolean;
  expectedProjectPath?: string | null;
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

interface StartupStateSnapshot {
  url: string;
  mode: {
    body: string | null;
    html: string | null;
  };
  datasets: {
    body: Record<string, string>;
    html: Record<string, string>;
  };
  project: {
    loadedBody: string | null;
    loadedHtml: string | null;
    pathBody: string | null;
    pathHtml: string | null;
    idBody: string | null;
    idHtml: string | null;
    subtitle: string | null;
    debugState: unknown;
  };
  service: {
    present: boolean;
    status: string | null;
    reason: string | null;
    visible: boolean;
  };
  actions: Array<{
    testId: string;
    present: boolean;
    visible: boolean;
    enabled: boolean;
    ariaDisabled: string | null;
  }>;
  recovery: {
    present: boolean;
    visible: boolean;
  };
  dock: {
    present: boolean;
    visible: boolean;
    panes: Array<{
      paneId: string | null;
      visible: boolean;
    }>;
  };
  activeScene: {
    present: boolean;
    text: string | null;
  };
  localStorageRelevant: Record<string, string | null>;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const STARTUP_SNAPSHOT_ATTACHMENT = 'startup-state-snapshot.json';
const attachedStartupSnapshots = new Set<string>();

export async function collectStartupStateSnapshot(page: Page): Promise<StartupStateSnapshot> {
  const url = page.url();
  const snapshot = await page.evaluate(() => {
    const bodyDataset = { ...(document.body?.dataset ?? {}) };
    const htmlDataset = { ...(document.documentElement?.dataset ?? {}) };
    const subtitle = document.querySelector('.app-shell__workspace-subtitle') as HTMLElement | null;
    const servicePill = document.querySelector('[data-testid="service-status-pill"]') as HTMLElement | null;
    const recoveryBanner = document.querySelector('[data-testid="recovery-banner"]') as HTMLElement | null;
    const dock = document.querySelector('[data-testid="dock-workspace"]') as HTMLElement | null;
    const actionIds = [
      'workspace-action-generate',
      'workspace-action-critique',
      'workspace-action-snapshot',
      'workspace-action-snapshots',
      'open-project',
    ];
    const actions = actionIds.map((testId) => {
      const node = document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement | null;
      if (!node) {
        return {
          testId,
          present: false,
          visible: false,
          enabled: false,
          ariaDisabled: null,
        };
      }
      const style = window.getComputedStyle(node);
      return {
        testId,
        present: true,
        visible: style.display !== 'none' && style.visibility !== 'hidden',
        enabled: !node.disabled,
        ariaDisabled: node.getAttribute('aria-disabled'),
      };
    });
    const panes = Array.from(document.querySelectorAll('[data-pane-id]')).map((node) => {
      const element = node as HTMLElement;
      const style = window.getComputedStyle(element);
      return {
        paneId: element.getAttribute('data-pane-id'),
        visible: style.display !== 'none' && style.visibility !== 'hidden',
      };
    });
    const activeSceneButton = document.querySelector(
      '.project-home__scene-card--active .project-home__scene-button[aria-pressed="true"]',
    ) as HTMLButtonElement | null;
    const relevantStorage = Object.keys(window.localStorage)
      .filter((key) => /(test|layout|recovery|dock|blackskies)/i.test(key))
      .sort()
      .reduce<Record<string, string | null>>((acc, key) => {
        acc[key] = window.localStorage.getItem(key);
        return acc;
      }, {});
    const debugState = (
      window as typeof window & {
        __testProjectState?: unknown;
        __blackskiesDebugLog?: unknown;
      }
    ).__testProjectState ?? null;
    const isVisible = (element: HTMLElement | null): boolean => {
      if (!element) {
        return false;
      }
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    };
    return {
      mode: {
        body: document.body?.dataset?.testMode ?? null,
        html: document.documentElement?.dataset?.testMode ?? null,
      },
      datasets: {
        body: bodyDataset,
        html: htmlDataset,
      },
      project: {
        loadedBody: document.body?.dataset?.projectLoaded ?? null,
        loadedHtml: document.documentElement?.dataset?.projectLoaded ?? null,
        pathBody: document.body?.dataset?.projectPath ?? null,
        pathHtml: document.documentElement?.dataset?.projectPath ?? null,
        idBody: document.body?.dataset?.projectId ?? null,
        idHtml: document.documentElement?.dataset?.projectId ?? null,
        subtitle: subtitle?.textContent?.trim() ?? null,
        debugState,
      },
      service: {
        present: Boolean(servicePill),
        status: servicePill?.getAttribute('data-status') ?? null,
        reason: servicePill?.getAttribute('data-reason') ?? null,
        visible: isVisible(servicePill),
      },
      actions,
      recovery: {
        present: Boolean(recoveryBanner),
        visible: isVisible(recoveryBanner),
      },
      dock: {
        present: Boolean(dock),
        visible: isVisible(dock),
        panes,
      },
      activeScene: {
        present: Boolean(activeSceneButton),
        text: activeSceneButton?.textContent?.trim() ?? null,
      },
      localStorageRelevant: relevantStorage,
    };
  });
  return {
    url,
    ...snapshot,
  };
}

async function attachStartupStateSnapshot(page: Page, mode: HarnessMode): Promise<void> {
  const testInfo = playwrightTest.info();
  const key = `${testInfo.file}:${testInfo.testId}`;
  if (attachedStartupSnapshots.has(key)) {
    return;
  }
  attachedStartupSnapshots.add(key);
  const snapshot = await collectStartupStateSnapshot(page);
  const payload = {
    recordedAt: new Date().toISOString(),
    expectedMode: mode,
    snapshot,
  };
  await testInfo.attach(STARTUP_SNAPSHOT_ATTACHMENT, {
    body: Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, 'utf-8'),
    contentType: 'application/json',
  });
}

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

  try {
    await page.waitForFunction(
      () => {
        const bodyMode = document.body?.dataset?.testMode;
        const htmlMode = document.documentElement?.dataset?.testMode;
        const mode = bodyMode ?? htmlMode;
        if (mode !== 'flat' && mode !== 'full' && mode !== 'recovery') {
          return false;
        }

        const subtitle = document.querySelector('.app-shell__workspace-subtitle');
        const projectLabel = subtitle?.textContent?.trim() ?? '';
        const bodyLoaded = document.body?.dataset?.projectLoaded;
        const htmlLoaded = document.documentElement?.dataset?.projectLoaded;
        const loaded = bodyLoaded ?? htmlLoaded;
        const bodyPath = document.body?.dataset?.projectPath ?? '';
        const htmlPath = document.documentElement?.dataset?.projectPath ?? '';
        const committedPath = bodyPath || htmlPath;
        return (
          loaded === '1' &&
          Boolean(committedPath) &&
          Boolean(projectLabel) &&
          projectLabel !== 'No project loaded'
        );
      },
      null,
      { timeout: timeoutMs },
    );
  } catch (error) {
    const diagnostics = await page.evaluate(() => {
      const subtitle = document.querySelector('.app-shell__workspace-subtitle') as HTMLElement | null;
      const dock = document.querySelector('[data-testid="dock-workspace"]') as HTMLElement | null;
      const generate = document.querySelector('[data-testid="workspace-action-generate"]') as
        | HTMLButtonElement
        | null;
      const openProject = document.querySelector('[data-testid="open-project"]') as
        | HTMLButtonElement
        | null;
      const recoveryBanner = document.querySelector('[data-testid="recovery-banner"]') as HTMLElement | null;
      const isVisible = (element: HTMLElement | null): boolean => {
        if (!element) {
          return false;
        }
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      };
      const bodyDataset = { ...(document.body?.dataset ?? {}) };
      const htmlDataset = { ...(document.documentElement?.dataset ?? {}) };
      const dockPathFromDataset =
        dock?.getAttribute('data-project-path') ??
        dock?.dataset?.projectPath ??
        dock?.dataset?.path ??
        null;
      const debugState = (
        window as typeof window & {
          __testProjectState?: unknown;
          __blackskiesDebugLog?: unknown;
        }
      ).__testProjectState;
      return {
        testModeBody: document.body?.dataset?.testMode ?? null,
        testModeHtml: document.documentElement?.dataset?.testMode ?? null,
        projectLoadedBody: document.body?.dataset?.projectLoaded ?? null,
        projectLoadedHtml: document.documentElement?.dataset?.projectLoaded ?? null,
        projectPathBody: document.body?.dataset?.projectPath ?? null,
        projectPathHtml: document.documentElement?.dataset?.projectPath ?? null,
        projectIdBody: document.body?.dataset?.projectId ?? null,
        projectIdHtml: document.documentElement?.dataset?.projectId ?? null,
        projectSubtitle: subtitle?.textContent?.trim() ?? null,
        dockWorkspacePresent: Boolean(dock),
        dockWorkspaceVisible: isVisible(dock),
        dockWorkspaceProjectPath: dockPathFromDataset,
        openProjectVisible: isVisible(openProject),
        workspaceActionGenerateVisible: isVisible(generate),
        workspaceActionGenerateEnabled: Boolean(generate && !generate.disabled),
        recoveryBannerPresent: Boolean(recoveryBanner),
        recoveryBannerVisible: isVisible(recoveryBanner),
        bodyDataset,
        htmlDataset,
        debugProjectState: debugState ?? null,
      };
    });
    throw new Error(
      `waitForProjectLoaded did not converge within ${timeoutMs}ms: ${JSON.stringify(diagnostics)}` +
        (error instanceof Error ? ` cause="${error.message}"` : ''),
    );
  }

  return waitForHarnessMode(page, timeoutMs);
}

interface PostBootstrapStableOptions {
  mode: HarnessMode;
  timeoutMs?: number;
  expectedServiceStatus?: HarnessServiceStatus | null;
  allowRecoveryBanner?: boolean;
  requireDockWorkspace?: boolean;
  requireGenerateAction?: boolean;
  requireActiveScene?: boolean;
  expectedProjectPath?: string | null;
}

export async function assertPostBootstrapStable(
  page: Page,
  options: PostBootstrapStableOptions,
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const expectedServiceStatus = options.expectedServiceStatus ?? 'online';
  const allowRecoveryBanner = options.allowRecoveryBanner ?? false;
  const requireDockWorkspace = options.requireDockWorkspace ?? true;
  const requireGenerateAction = options.requireGenerateAction ?? true;
  const requireActiveScene = options.requireActiveScene ?? false;
  const expectedProjectPath = options.expectedProjectPath ?? null;
  try {
    await page.waitForFunction(
      ({
        expectedMode,
        expectedServiceStatus: expectedStatus,
        allowRecoveryBanner: allowRecovery,
        requireDockWorkspace: requireDock,
        requireGenerateAction: requireGenerate,
        requireActiveScene: requireScene,
      }) => {
        const mode = document.body?.dataset?.testMode ?? document.documentElement?.dataset?.testMode;
        if (mode !== expectedMode) {
          return false;
        }
        const projectPath = document.body?.dataset?.projectPath ?? document.documentElement?.dataset?.projectPath;
        const projectId = document.body?.dataset?.projectId ?? document.documentElement?.dataset?.projectId;
        const projectLoaded =
          document.body?.dataset?.projectLoaded ?? document.documentElement?.dataset?.projectLoaded;
        if (projectLoaded !== '1' || !projectPath || !projectId) {
          return false;
        }
        const subtitle = document.querySelector('.app-shell__workspace-subtitle') as HTMLElement | null;
        if (!subtitle || !subtitle.textContent || subtitle.textContent.trim() === 'No project loaded') {
          return false;
        }
        const servicePill = document.querySelector('[data-testid="service-status-pill"]') as HTMLElement | null;
        if (expectedStatus && expectedStatus !== 'port-unavailable') {
          if (!servicePill || servicePill.getAttribute('data-status') !== expectedStatus) {
            return false;
          }
        }
        const recoveryBanner = document.querySelector('[data-testid="recovery-banner"]') as HTMLElement | null;
        if (!allowRecovery && recoveryBanner) {
          const style = window.getComputedStyle(recoveryBanner);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            return false;
          }
        }
        if (requireDock) {
          const dock = document.querySelector('[data-testid="dock-workspace"]') as HTMLElement | null;
          if (!dock) {
            return false;
          }
          const style = window.getComputedStyle(dock);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
          }
        }
        if (requireGenerate) {
          const generate = document.querySelector('[data-testid="workspace-action-generate"]') as
            | HTMLButtonElement
            | null;
          if (!generate || generate.disabled) {
            return false;
          }
          const style = window.getComputedStyle(generate);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
          }
        }
        if (requireScene) {
          const activeScene = document.querySelector(
            '.project-home__scene-card--active .project-home__scene-button[aria-pressed="true"]',
          );
          if (!activeScene) {
            return false;
          }
        }
        return true;
      },
      {
        expectedMode: options.mode,
        expectedServiceStatus,
        allowRecoveryBanner,
        requireDockWorkspace,
        requireGenerateAction,
        requireActiveScene,
      },
      { timeout: timeoutMs },
    );
  } catch (error) {
    const snapshot = await collectStartupStateSnapshot(page);
    const actualPath = snapshot.project.pathBody ?? snapshot.project.pathHtml;
    const pathMatches =
      !expectedProjectPath || projectPathContractMatch({ actual: actualPath, expected: expectedProjectPath });
    throw new Error(
      `assertPostBootstrapStable failed within ${timeoutMs}ms: ${JSON.stringify({
        expectedMode: options.mode,
        expectedServiceStatus,
        allowRecoveryBanner,
        requireDockWorkspace,
        requireGenerateAction,
        requireActiveScene,
        expectedProjectPath: normalizeProjectPath(expectedProjectPath),
        actualProjectPath: normalizeProjectPath(actualPath),
        projectPathContractMatch: pathMatches,
        snapshot,
      })}` + (error instanceof Error ? ` cause="${error.message}"` : ''),
    );
  }

  if (expectedProjectPath) {
    const snapshot = await collectStartupStateSnapshot(page);
    const actualPath = snapshot.project.pathBody ?? snapshot.project.pathHtml;
    if (!projectPathContractMatch({ actual: actualPath, expected: expectedProjectPath })) {
      throw new Error(
        `assertPostBootstrapStable project path mismatch: ${JSON.stringify({
          expectedProjectPath: normalizeProjectPath(expectedProjectPath),
          actualProjectPath: normalizeProjectPath(actualPath),
          snapshot,
        })}`,
      );
    }
  }
}

export async function waitForFlatModeReady(
  page: Page,
  options: Omit<PostBootstrapStableOptions, 'mode' | 'requireDockWorkspace'> = {},
): Promise<void> {
  await assertPostBootstrapStable(page, {
    ...options,
    mode: 'flat',
    requireDockWorkspace: false,
  });
}

export async function waitForFullModeReady(
  page: Page,
  options: Omit<PostBootstrapStableOptions, 'mode' | 'requireDockWorkspace'> = {},
): Promise<void> {
  await assertPostBootstrapStable(page, {
    ...options,
    mode: 'full',
    requireDockWorkspace: true,
  });
}

export async function waitForRecoveryModeReady(
  page: Page,
  options: Omit<PostBootstrapStableOptions, 'mode'> = {},
): Promise<void> {
  await assertPostBootstrapStable(page, {
    ...options,
    mode: 'recovery',
    allowRecoveryBanner: options.allowRecoveryBanner ?? true,
    requireDockWorkspace: options.requireDockWorkspace ?? false,
  });
}

export async function bootstrapHarness(
  page: Page,
  options: BootstrapHarnessOptions = {},
): Promise<void> {
  const expectedServiceStatus = options.expectedServiceStatus ?? 'online';
  const expectedServiceReason = options.expectedServiceReason;
  const requiredEnabledActions = options.requiredEnabledActions ?? [];
  const expectedMode = options.expectedMode;
  const allowRecoveryBanner = options.allowRecoveryBanner ?? false;
  const requireActiveScene = options.requireActiveScene ?? false;
  const requireStartupSnapshot = options.requireStartupSnapshot ?? true;
  const expectedProjectPath = options.expectedProjectPath;
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
  await page.evaluate((projectPath) => {
    const win = window as typeof window & {
      __dev?: { setProjectDir?: (path: string | null) => void | Promise<void> };
    };
    return Promise.resolve(win.__dev?.setProjectDir?.(projectPath ?? null));
  }, sampleProjectPath);

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

  const resolvedMode = await waitForProjectLoaded(page, { timeoutMs: DEFAULT_TIMEOUT_MS });
  const mode = expectedMode ?? resolvedMode;
  if (expectedMode && resolvedMode !== expectedMode) {
    const snapshot = await collectStartupStateSnapshot(page);
    throw new Error(
      `bootstrapHarness mode mismatch: expected=${expectedMode} actual=${resolvedMode} ` +
        `snapshot=${JSON.stringify(snapshot)}`,
    );
  }
  if (mode === 'flat') {
    await waitForFlatModeReady(page, {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      expectedServiceStatus,
      allowRecoveryBanner,
      requireActiveScene,
      expectedProjectPath,
    });
  } else if (mode === 'full') {
    await waitForFullModeReady(page, {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      expectedServiceStatus,
      allowRecoveryBanner,
      requireActiveScene,
      expectedProjectPath,
    });
  } else {
    await waitForRecoveryModeReady(page, {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      expectedServiceStatus,
      allowRecoveryBanner,
      requireActiveScene,
      expectedProjectPath,
    });
  }
  for (const actionId of requiredEnabledActions) {
    await waitForActionEnabled(page, actionId, DEFAULT_TIMEOUT_MS);
  }
  if (requireStartupSnapshot) {
    await attachStartupStateSnapshot(page, mode);
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
