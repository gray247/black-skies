import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { loadSampleProject } from './utils/sampleProject';
import { loadGuiContract } from './utils/guiContract';

const { loadedProject } = loadSampleProject();
const guiContract = loadGuiContract();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ project }) => {
    const layoutBridge = {
      async loadLayout() {
        return { layout: null, floatingPanes: [], schemaVersion: 2 };
      },
      async saveLayout() {
        return;
      },
      async resetLayout() {
        return;
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

    const services = {
      checkHealth: async () => ({ ok: true, data: { status: 'online' }, traceId: 'trace-online' }),
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
            path: 'history/snapshots/20250101T000000Z_accept',
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
          path: 'history/snapshots/20250101T000000Z_accept',
        },
        traceId: 'trace-snapshot',
      }),
      getRecoveryStatus: async () => ({
        ok: true,
        data: {
          project_id: project.project_id,
          status: 'idle',
          needs_recovery: false,
          last_snapshot: null,
        },
        traceId: 'trace-recovery',
      }),
      restoreSnapshot: async () => ({
        ok: true,
        data: {
          project_id: project.project_id,
          status: 'idle',
          needs_recovery: false,
        },
        traceId: 'trace-restore',
      }),
    };

    const projectLoader = {
      openProjectDialog: async () => ({ canceled: false, filePath: project.path }),
      loadProject: async () => ({ ok: true, project, issues: [] }),
      getSampleProjectPath: async () => project.path,
    };

    const runtimeConfig = {
      ui: {
        enableDocking: true,
        defaultPreset: 'standard',
        hotkeys: { enablePresetHotkeys: true },
      },
    };

    Object.defineProperty(window, 'runtimeConfig', { value: runtimeConfig, configurable: true });
    Object.defineProperty(window, '__runtimeConfigOverride', {
      value: runtimeConfig,
      configurable: true,
    });
    Object.defineProperty(window, 'layout', { value: layoutBridge, configurable: true });
    Object.defineProperty(window, 'services', { value: services, configurable: true });
    Object.defineProperty(window, 'projectLoader', { value: projectLoader, configurable: true });
  }, { project: loadedProject });
});

test('matches pane labels defined in documentation', async ({ page }) => {
  await bootstrapHarness(page);

  for (const [paneId, expectedLabel] of Object.entries(guiContract.paneLabels)) {
    if (paneId === 'analytics') {
      await expect(
        page.locator('.dock-workspace__hidden-actions button', { hasText: expectedLabel }),
      ).toBeVisible();
    } else {
      const pane = page.locator(`[data-pane-id="${paneId}"]`);
      await expect(pane).toBeVisible();
      await expect(pane).toHaveAttribute('aria-label', expectedLabel);
    }
  }
});
