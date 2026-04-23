import type { Page } from '@playwright/test';
import { loadSampleProject } from './utils/sampleProject';

type HarnessServiceStatus = 'online' | 'offline' | 'port-unavailable';

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

interface WaitForServiceStatusOptions {
  status: HarnessServiceStatus;
  reason?: string;
  timeoutMs?: number;
}

export async function bootstrapHarness(
  page: Page,
  options: BootstrapHarnessOptions = {},
): Promise<void> {
  const expectedServiceStatus = options.expectedServiceStatus ?? 'online';
  const expectedServiceReason = options.expectedServiceReason;
  const requiredEnabledActions = options.requiredEnabledActions ?? [];
  await page.waitForFunction(() => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true, null, {
    timeout: 30_000,
  });
  await page.getByTestId('app-root').waitFor({ timeout: 30_000 });

  await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="companion-overlay"]') as HTMLElement | null;
    if (overlay) {
      overlay.style.display = 'none';
    }
  });

  const { projectRoot: sampleProjectPath, projectId: sampleProjectId } = loadSampleProject();
  await page.evaluate((projectPath) => {
    (window as any).__dev?.setProjectDir?.(projectPath ?? null);
  }, sampleProjectPath);
  await page.evaluate(
    ({ projectId, projectPath }: { projectId: string; projectPath: string }) => {
      const win = window as typeof window & {
        __testEnvDefaultProjectId?: string;
        __testEnvDefaultProjectPath?: string;
      };
      win.__testEnvDefaultProjectId = projectId;
      win.__testEnvDefaultProjectPath = projectPath;
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
      { timeout: 30_000 },
    );
  }

  await page.waitForFunction(
    () => {
      const mode = document.body?.dataset?.testMode;
      return mode === 'flat' || mode === 'full' || mode === 'recovery';
    },
    null,
    { timeout: 30_000 },
  );
  const mode = await page.evaluate(() => document.body?.dataset?.testMode ?? 'full');
  if (mode === 'flat') {
    await page.getByTestId('wizard-root').waitFor({ state: 'visible', timeout: 30_000 });
  } else {
    await page.getByTestId('dock-workspace').waitFor({ state: 'visible', timeout: 30_000 });
  }
  // Workspace action visibility is stable across flat/full/recovery modes, unlike
  // pane-specific anchors that can vary with persisted layout state.
  await page.getByTestId('workspace-action-generate').waitFor({ state: 'visible', timeout: 30_000 });
  for (const actionId of requiredEnabledActions) {
    await page.waitForFunction(
      (testId) => {
        const button = document.querySelector(`[data-testid="${testId}"]`) as
          | HTMLButtonElement
          | null;
        return button !== null && !button.disabled;
      },
      actionId,
      { timeout: 30_000 },
    );
  }
}

export async function ensureDockPaneVisible(
  page: Page,
  options: EnsureDockPaneVisibleOptions,
): Promise<void> {
  const pane = page.locator(`[data-pane-id="${options.paneId}"]`);
  if (await pane.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
    return;
  }

  const hiddenRegion = page.getByRole('region', { name: 'Hidden panes' });
  if (!(await hiddenRegion.isVisible({ timeout: 3_000 }).catch(() => false))) {
    throw new Error(
      `Pane "${options.paneId}" is not visible and Hidden panes region is unavailable.`,
    );
  }

  const restoreButton = hiddenRegion.getByRole('button', { name: options.hiddenLabel });
  await restoreButton.click();
  await pane.waitFor({ state: 'visible', timeout: 30_000 });
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
    { timeout: 30_000 },
  );
  if (options.requireBannerDismissed !== false) {
    await page.waitForFunction(
      () => document.querySelector('[data-testid="recovery-banner"]') === null,
      null,
      { timeout: 30_000 },
    );
  }
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
    { timeout: options.timeoutMs ?? 30_000 },
  );
}
