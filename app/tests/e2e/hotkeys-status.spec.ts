import { test, expect } from './_electron.fixture';
import { bootstrapHarness, waitForSnapshotRestoreComplete } from './_bootstrap';
import { loadSampleProject } from './utils/sampleProject';
import { setFlatMode } from './utils/testModeConfig';

// HARNESS_ONLY:
// Reason: exercises hotkey/status UI interactions via harness hooks.
// Owner: app/tests/e2e/hotkeys-status.spec.ts
// Retire when: hotkey status behavior is covered by real-service integration checks.

const { loadedProject } = loadSampleProject();

test.describe('Hotkeys status', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(setFlatMode);
    await page.addInitScript(
      ({ project }) => {
        console.log('[hotkeys-status] init script running');
        const flaggedWindow = window as typeof window & { __hotkeysStatusInit?: boolean };
        if (flaggedWindow.__hotkeysStatusInit) {
          return;
        }
        flaggedWindow.__hotkeysStatusInit = true;
        const root = document.documentElement;
        if (root) {
          root.dataset.testNeedsRecovery = '1';
        }
        const body = document.body;
        if (body) {
          body.dataset.testNeedsRecovery = '1';
        }
        let offline = false;
        const recoveryLog = { restore: 0 };
        const recoveryState = {
          needs_recovery: true,
          snapshot: {
            snapshot_id: '20250101T000000Z',
            label: 'accept',
            created_at: '2025-01-01T00:00:00Z',
            path: 'timeline/snapshots/20250101T000000Z_accept',
          },
        };

        const layoutCalls = {
          saveLayout: [] as Array<{ projectPath: string; layout: unknown }>,
          loadLayout: [] as Array<{ projectPath: string; layout: unknown | null }>,
        };
        const layoutState = {
          savedLayout: null as unknown | null,
        };

        const services = {
          checkHealth: async () => {
            return offline
              ? { ok: false, error: { message: 'Bridge unreachable', traceId: 'trace-offline' } }
              : { ok: true, data: { status: 'online' }, traceId: 'trace-online' };
          },
          buildOutline: async () => ({ ok: true, data: project.outline, traceId: 'trace-outline' }),
          preflightDraft: async () => ({
            ok: true,
            data: {
              projectId: project.project_id,
              unitScope: 'scene',
              unitIds: [project.scenes[0]?.id ?? 'sc_0001'],
              model: { name: 'draft-synthesizer-v1', provider: 'stub' },
              scenes: [
                {
                  id: project.scenes[0]?.id ?? 'sc_0001',
                  title: project.scenes[0]?.title ?? 'Scene',
                  order: project.scenes[0]?.order ?? 1,
                  chapter_id: project.scenes[0]?.chapter_id,
                },
              ],
              budget: {
                estimated_usd: 1.25,
                status: 'ok',
                soft_limit_usd: 10,
                hard_limit_usd: 10,
                spent_usd: 1.25,
                total_after_usd: 1.25,
              },
            },
            traceId: 'trace-preflight',
          }),
          generateDraft: async () => ({
            ok: true,
            data: {
              draft_id: 'dr_stub',
              schema_version: 'DraftUnitSchema v1',
              units: [],
              budget: { status: 'ok' },
            },
            traceId: 'trace-generate',
          }),
          critiqueDraft: async () => ({
            ok: true,
            data: {
              unit_id: project.scenes[0]?.id ?? 'sc_0001',
              schema_version: 'CritiqueOutputSchema v1',
              summary: 'Stub critique summary.',
              line_comments: [],
              priorities: ['Voice'],
              model: { name: 'critique-stub', provider: 'stub' },
              budget: {
                estimated_usd: 0.15,
                status: 'ok',
                soft_limit_usd: 10,
                hard_limit_usd: 10,
                spent_usd: 1.4,
                total_after_usd: 1.4,
              },
            },
            traceId: 'trace-critique',
          }),
          acceptDraft: async () => ({
            ok: true,
            data: {
              unit_id: project.scenes[0]?.id ?? 'sc_0001',
              checksum: 'stub-checksum',
              schema_version: 'DraftAcceptResult v1',
              snapshot: {
                snapshot_id: '20250101T000000Z',
                label: 'accept',
                created_at: '2025-01-01T00:00:00Z',
                path: 'timeline/snapshots/20250101T000000Z_accept',
              },
              budget: {
                estimated_usd: 0.15,
                status: 'ok',
                soft_limit_usd: 10,
                hard_limit_usd: 10,
                spent_usd: 1.4,
                total_after_usd: 1.4,
              },
            },
            traceId: 'trace-accept',
          }),
          createSnapshot: async () => ({
            ok: true,
            data: {
              snapshot_id: '20250101T000000Z',
              label: 'accept',
              created_at: '2025-01-01T00:00:00Z',
              path: 'timeline/snapshots/20250101T000000Z_accept',
            },
            traceId: 'trace-snapshot',
          }),
          getRecoveryStatus: async () => {
            console.log('[hotkeys-services] getRecoveryStatus', recoveryState.needs_recovery);
            return {
              ok: true,
              data: {
                project_id: project.project_id,
                status: recoveryState.needs_recovery ? 'needs_recovery' : 'idle',
                needs_recovery: recoveryState.needs_recovery,
                last_snapshot: recoveryState.needs_recovery ? recoveryState.snapshot : null,
              },
              traceId: 'trace-recovery',
            };
          },
          restoreSnapshot: async () => {
            console.log('[hotkeys-services] restoreSnapshot invoked');
            recoveryLog.restore += 1;
            recoveryState.needs_recovery = false;
            return {
              ok: true,
              data: {
                project_id: project.project_id,
                status: 'idle',
                needs_recovery: false,
              },
              traceId: 'trace-restore',
            };
          },
        };

        const projectLoader = {
          openProjectDialog: async () => ({ canceled: false, filePath: project.path }),
          loadProject: async () => ({ ok: true, project, issues: [] }),
          getSampleProjectPath: async () => project.path,
        };

        const layoutBridge = {
          async loadLayout(request: { projectPath: string }) {
            layoutCalls.loadLayout.push({
              projectPath: request.projectPath,
              layout: layoutState.savedLayout,
            });
            return { layout: layoutState.savedLayout, floatingPanes: [], schemaVersion: 2 };
          },
          async saveLayout(request: { projectPath: string; layout: unknown }) {
            layoutCalls.saveLayout.push({
              projectPath: request.projectPath,
              layout: request.layout,
            });
            layoutState.savedLayout = request.layout;
          },
          async resetLayout() {
            layoutState.savedLayout = null;
          },
          async listFloatingPanes() {
            return [];
          },
          async openFloatingPane() {
            return { opened: true, clamp: null };
          },
          async closeFloatingPane() {
            return;
          },
        };

        const runtimeConfig = {
          ui: {
            enableDocking: true,
            defaultPreset: 'standard',
            hotkeys: {
              enablePresetHotkeys: true,
              focusCycleOrder: ['outline', 'draftPreview', 'critique', 'timeline'],
            },
          },
        };

        const defineWindowPropertyIfConfigurable = (key, descriptor) => {
          const existing = Object.getOwnPropertyDescriptor(window, key);
          if (existing && !existing.configurable) {
            return;
          }
          Object.defineProperty(window, key, descriptor);
        };

        Object.defineProperty(window, '__layoutCallLog', {
          value: layoutCalls,
          configurable: true,
        });
        Object.defineProperty(window, '__setOffline', {
          value: (value: boolean) => {
            offline = value;
            const root = document.documentElement;
            const body = document.body ?? root;
            const syncOfflineState = (): void => {
              if (value) {
                root.dataset.testForceOffline = '1';
                body.dataset.testForceOffline = '1';
                root.dataset.testEnvForceOfflineReason = 'test-offline';
                body.dataset.testEnvForceOfflineReason = 'test-offline';
                return;
              }
              delete root.dataset.testForceOffline;
              delete body.dataset.testForceOffline;
              delete root.dataset.testEnvForceOfflineReason;
              delete body.dataset.testEnvForceOfflineReason;
            };
            syncOfflineState();
            window.dispatchEvent(
              new CustomEvent('test:service-status', { detail: value ? 'offline' : 'online' }),
            );
            window.dispatchEvent(new CustomEvent('test:force-offline', { detail: value }));
            window.__testInsights?.setServiceStatus(value ? 'offline' : 'online');
          },
          configurable: true,
        });
        Object.defineProperty(window, '__setRecoveryState', {
          value: (value: boolean) => {
            recoveryState.needs_recovery = value;
          },
          configurable: true,
        });
        Object.defineProperty(window, '__recoveryLog', { value: recoveryLog, configurable: true });
        Object.defineProperty(window, '__runtimeConfigOverride', {
          value: runtimeConfig,
          configurable: true,
        });
        defineWindowPropertyIfConfigurable('layout', { value: layoutBridge, configurable: true });
        defineWindowPropertyIfConfigurable('projectLoader', {
          value: projectLoader,
          configurable: true,
        });
        window.__dev?.overrideServices?.(services);
      },
      { project: loadedProject },
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    await bootstrapHarness(page);
    await page.bringToFront();
    await page.focus('body');
  });

  test('cycles focus and presets via hotkeys', async ({ page }) => {
    const getActivePaneId = () =>
      page.evaluate(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement) {
          return active.dataset?.paneId ?? null;
        }
        return null;
      });

    await page.evaluate(() => {
      console.log(
        '[body-test-env]',
        document.body?.dataset?.testEnv,
        (window as typeof window & { __testEnv?: { isPlaywright?: boolean } }).__testEnv,
      );
      const nodes = Array.from(document.querySelectorAll('[data-pane-id="outline"]'));
      console.log(
        '[outline-query]',
        nodes.length,
        nodes.map((node) => node.className),
      );
    });

    const outlinePane = page.locator('[data-pane-id="outline"]');
    await outlinePane.focus();
    await expect.poll(getActivePaneId).toBe('outline');

    await page.keyboard.press('Control+Alt+BracketRight');
    await expect.poll(getActivePaneId).toBe('draftPreview');

    await page.keyboard.press('Control+Alt+BracketRight');
    await expect.poll(getActivePaneId).toBe('critique');

    await page.keyboard.press('Control+Alt+BracketLeft');
    await expect.poll(getActivePaneId).toBe('draftPreview');

    await page.keyboard.press('Control+Alt+Digit1');
    await expect(page.locator('[data-pane-id="storyInsights"]')).toHaveCount(0);

    await page.keyboard.press('Control+Alt+Digit2');
    await expect(page.locator('[data-pane-id="storyInsights"]')).toBeVisible();

    await page.keyboard.press('Control+Alt+Digit3');
    await expect(page.locator('[data-pane-id="storyInsights"]')).toHaveCount(0);
    await expect(page.locator('[data-pane-id="critique"]')).toBeVisible();
  });

  test('disables writing actions while services are offline', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: 'Generate' });
    const critiqueButton = page.getByTestId('workspace-action-critique');
    await expect(generateButton).toBeEnabled();
    await expect(critiqueButton).toBeEnabled();

    await page.evaluate(() => window.__setOffline?.(true));
    const serviceStatusPill = page.getByTestId('service-status-pill');
    await expect(serviceStatusPill).toHaveAttribute('data-status', 'offline');
    await expect(serviceStatusPill).toHaveAttribute('data-reason', 'test-offline');
    await expect(serviceStatusPill).toHaveAttribute(
      'title',
      'Backend services are forced offline for this automated test run.',
    );
    await expect(generateButton).toBeDisabled();
    await expect(critiqueButton).toBeDisabled();

    await page.evaluate(() => window.__setOffline?.(false));
    await expect(serviceStatusPill).toHaveAttribute('data-status', 'online');
    await expect(serviceStatusPill).toHaveAttribute('data-reason', 'online');
    await expect(generateButton).toBeEnabled();
    await expect(critiqueButton).toBeEnabled();
  });

  test('restores a snapshot from the recovery banner', async ({ page }, testInfo) => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await bootstrapHarness(page, {
      expectedMode: 'flat',
      allowRecoveryBanner: true,
    });
    await page.evaluate(() => window.__setRecoveryState?.(true));

    const recoveryBanner = page
      .getByTestId('recovery-banner')
      .filter({ has: page.getByRole('button', { name: 'Restore snapshot' }) })
      .first();
    const restoreButton = recoveryBanner.getByRole('button', { name: 'Restore snapshot' });
    const recoveryDiagnostics = await page.evaluate(async () => {
      const banner = document.querySelector('[data-testid="recovery-banner"]') as HTMLElement | null;
      const servicePill = document.querySelector('[data-testid="service-status-pill"]') as HTMLElement | null;
      const projectId =
        document.body?.dataset?.projectId ?? document.documentElement?.dataset?.projectId ?? null;
      const serviceRecoveryResponse =
        projectId && window.services?.getRecoveryStatus
          ? await window.services.getRecoveryStatus({ projectId })
          : null;
      const buttonRows = banner
        ? Array.from(banner.querySelectorAll('button')).map((button) => {
            const style = window.getComputedStyle(button);
            return {
              name: button.textContent?.trim() ?? null,
              role: button.getAttribute('role') ?? 'button',
              visible: style.display !== 'none' && style.visibility !== 'hidden',
              disabled: button.disabled,
            };
          })
        : [];
      return {
        capturedAt: new Date().toISOString(),
        startupConfig:
          (window as typeof window & { __E2E_STARTUP_CONFIG?: unknown }).__E2E_STARTUP_CONFIG ?? null,
        recoveryDebugState: {
          recoveryLog:
            (window as typeof window & { __recoveryLog?: unknown }).__recoveryLog ?? null,
          snapshotRestoreDone:
            (window as typeof window & { __snapshotRestoreDone?: boolean }).__snapshotRestoreDone ?? null,
          testNeedsRecoveryBody: document.body?.dataset?.testNeedsRecovery ?? null,
          testNeedsRecoveryHtml: document.documentElement?.dataset?.testNeedsRecovery ?? null,
        },
        service: {
          status: servicePill?.getAttribute('data-status') ?? null,
          reason: servicePill?.getAttribute('data-reason') ?? null,
          recoveryResponse: serviceRecoveryResponse,
        },
        banner: {
          present: Boolean(banner),
          html: banner?.outerHTML ?? null,
          text: banner?.textContent?.trim() ?? null,
          buttons: buttonRows,
        },
      };
    });
    await testInfo.attach('recovery-banner-diagnostic.json', {
      body: Buffer.from(`${JSON.stringify(recoveryDiagnostics, null, 2)}\n`, 'utf-8'),
      contentType: 'application/json',
    });
    await expect(recoveryBanner).toBeVisible({ timeout: 30_000 });
    await expect(restoreButton).toBeVisible({ timeout: 30_000 });
    await restoreButton.click();

    await waitForSnapshotRestoreComplete(page);
    await expect(restoreButton).not.toBeVisible();
    await expect(recoveryBanner).not.toBeVisible();
  });
});
