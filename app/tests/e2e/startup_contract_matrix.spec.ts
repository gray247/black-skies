import { test, expect } from './_electron.fixture';
import {
  bootstrapHarness,
  collectStartupStateSnapshot,
  waitForFlatModeReady,
  waitForFullModeReady,
  waitForRecoveryModeReady,
} from './_bootstrap';
import { installServiceStubs } from './utils/serviceStubs';
import { loadSampleProject } from './utils/sampleProject';

// HARNESS_ONLY:
// Reason: matrix tests assert harness-mode startup contracts and guardrails.
// Owner: app/tests/e2e/startup_contract_matrix.spec.ts
// Retire when: equivalent mode-contract guarantees are enforced in truth-lane coverage.

const { loadedProject } = loadSampleProject();

test.describe('startup_contract_matrix', () => {
  test('flat mode contract', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'flat');
    await bootstrapHarness(page, { expectedMode: 'flat' });
    await waitForFlatModeReady(page);

    const flatSnapshot = await collectStartupStateSnapshot(page);
    expect(flatSnapshot.mode.body ?? flatSnapshot.mode.html).toBe('flat');
    expect(flatSnapshot.recovery.visible).toBe(false);
    expect(flatSnapshot.service.status).toBe('online');
    expect(flatSnapshot.project.pathBody ?? flatSnapshot.project.pathHtml).toBeTruthy();

    // Mode lock: attempt to override mode at runtime should be reverted.
    await page.evaluate(() => {
      document.body.dataset.testMode = 'recovery';
      document.documentElement.dataset.testMode = 'recovery';
    });
    await page.waitForFunction(
      () =>
        (document.body.dataset.testMode ?? document.documentElement.dataset.testMode) === 'flat',
      null,
      { timeout: 5_000 },
    );

    // Generate/Critique disabled without active scene.
    await page.evaluate((projectPath) => {
      const original = window.projectLoader?.loadProject?.bind(window.projectLoader);
      if (!original) {
        return;
      }
      window.__dev?.overrideServices?.({
        async checkHealth() {
          return {
            ok: true,
            data: { status: 'online' },
            traceId: 'matrix-health-online',
          };
        },
      });
      window.projectLoader!.loadProject = async () => {
        const loaded = await original({ path: projectPath });
        if (!loaded.ok) {
          return loaded;
        }
        return {
          ...loaded,
          project: {
            ...loaded.project,
            scenes: [],
            drafts: {},
          },
        };
      };
    }, loadedProject.path);
    await page.evaluate((projectPath) => window.__dev?.setProjectDir?.(projectPath), loadedProject.path);
    await page.waitForFunction(
      () => {
        const generate = document.querySelector('[data-testid="workspace-action-generate"]') as
          | HTMLButtonElement
          | null;
        const critique = document.querySelector('[data-testid="workspace-action-critique"]') as
          | HTMLButtonElement
          | null;
        return Boolean(generate?.disabled && critique?.disabled);
      },
      null,
      { timeout: 10_000 },
    );
  });

  test('full mode contract', async ({ page }) => {
    await installServiceStubs(page, 'normal', 'full');
    await bootstrapHarness(page, { expectedMode: 'full' });
    await waitForFullModeReady(page);

    const fullSnapshot = await collectStartupStateSnapshot(page);
    expect(fullSnapshot.mode.body ?? fullSnapshot.mode.html).toBe('full');
    expect(fullSnapshot.dock.present).toBe(true);
    expect(fullSnapshot.recovery.visible).toBe(false);
    const visiblePanes = fullSnapshot.dock.panes.filter((pane) => pane.visible).map((pane) => pane.paneId);
    expect(visiblePanes).toContain('corkboard');
    expect(visiblePanes).toContain('outline');
    expect(visiblePanes).toContain('draftPreview');
  });

  test('recovery mode contract', async ({ page }) => {
    await installServiceStubs(page, 'offline', 'recovery');
    await bootstrapHarness(page, {
      expectedMode: 'recovery',
      expectedServiceStatus: null,
      allowRecoveryBanner: true,
    });
    await waitForRecoveryModeReady(page, {
      expectedServiceStatus: null,
      allowRecoveryBanner: true,
    });

    const recoverySnapshot = await collectStartupStateSnapshot(page);
    expect(recoverySnapshot.mode.body ?? recoverySnapshot.mode.html).toBe('recovery');
    expect(recoverySnapshot.recovery.visible).toBe(true);
  });
});
