import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { loadSampleProject } from './utils/sampleProject';

const { loadedProject } = loadSampleProject();

test.describe('Hotkeys status', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ project }) => {
      let offline = false;
      const recoveryLog = { restore: 0 };
      const recoveryState = {
        needsRecovery: true,
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
        checkHealth: async () =>
          offline
            ? { ok: false, error: { message: 'Bridge unreachable', traceId: 'trace-offline' } }
            : { ok: true, data: { status: 'online' }, traceId: 'trace-online' },
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
        getRecoveryStatus: async () => ({
          ok: true,
          data: {
            project_id: project.project_id,
            status: recoveryState.needsRecovery ? 'needs_recovery' : 'idle',
            needs_recovery: recoveryState.needsRecovery,
            last_snapshot: recoveryState.needsRecovery ? recoveryState.snapshot : null,
          },
          traceId: 'trace-recovery',
        }),
        restoreSnapshot: async () => {
          recoveryLog.restore += 1;
          recoveryState.needsRecovery = false;
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
          layoutCalls.loadLayout.push({ projectPath: request.projectPath, layout: layoutState.savedLayout });
          return { layout: layoutState.savedLayout, floatingPanes: [], schemaVersion: 2 };
        },
        async saveLayout(request: { projectPath: string; layout: unknown }) {
          layoutCalls.saveLayout.push({ projectPath: request.projectPath, layout: request.layout });
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

      Object.defineProperty(window, '__layoutCallLog', { value: layoutCalls, configurable: true });
      Object.defineProperty(window, '__setOffline', {
        value: (value: boolean) => {
          offline = value;
        },
        configurable: true,
      });
      Object.defineProperty(window, '__setRecoveryState', {
        value: (value: boolean) => {
          recoveryState.needsRecovery = value;
        },
        configurable: true,
      });
      Object.defineProperty(window, '__recoveryLog', { value: recoveryLog, configurable: true });
      Object.defineProperty(window, 'runtimeConfig', { value: runtimeConfig, configurable: true });
      Object.defineProperty(window, '__runtimeConfigOverride', { value: runtimeConfig, configurable: true });
      Object.defineProperty(window, 'layout', { value: layoutBridge, configurable: true });
      Object.defineProperty(window, 'services', { value: services, configurable: true });
      Object.defineProperty(window, 'projectLoader', { value: projectLoader, configurable: true });
    }, { project: loadedProject });

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
    await serviceStatusPill.click();

    await expect(serviceStatusPill).toHaveAttribute('data-status', 'offline');
    await expect(serviceStatusPill).toHaveAttribute('title', 'Connection lost — retrying.');
    await expect(generateButton).toBeDisabled();
    await expect(critiqueButton).toBeDisabled();

    await page.evaluate(() => window.__setOffline?.(false));
    await serviceStatusPill.click();

    await expect(serviceStatusPill).toHaveAttribute('data-status', 'online');
    await expect(generateButton).toBeEnabled();
    await expect(critiqueButton).toBeEnabled();
  });

  test('restores a snapshot from the recovery banner', async ({ page }) => {
    const recoveryBanner = page.getByTestId('recovery-banner');
    const restoreButton = recoveryBanner.getByRole('button', { name: 'Restore snapshot' });
    await expect(restoreButton).toBeVisible();
    await restoreButton.click();

    await expect
      .poll(() => page.evaluate(() => window.__recoveryLog?.restore ?? 0))
      .toBeGreaterThan(0);
    await expect(restoreButton).not.toBeVisible();
  });
});
