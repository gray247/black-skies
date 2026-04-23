import type { Page } from '@playwright/test';
import { loadSampleProject } from './utils/sampleProject';

export async function bootstrapHarness(page: Page): Promise<void> {
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

  await page.waitForFunction(
    () =>
      (document.querySelector('[data-testid="service-status-pill"]') as HTMLElement | null)
        ?.getAttribute('data-status') === 'online',
    null,
    { timeout: 30_000 },
  );

  await page.waitForFunction(
    () => {
      const mode = document.body?.dataset?.testMode;
      return mode === 'flat' || mode === 'full' || mode === 'recovery';
    },
    null,
    { timeout: 30_000 },
  );
  await page.getByTestId('workspace-action-generate').waitFor({ state: 'visible', timeout: 30_000 });
}
