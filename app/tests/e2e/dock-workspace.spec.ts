import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { loadSampleProject } from './utils/sampleProject';
import { loadPackagedRenderer } from './utils/loadRenderer';

const { loadedProject } = loadSampleProject();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ project }) => {
    (window as typeof window & { __testEnvActiveFlow?: boolean }).__testEnvActiveFlow = true;
    const layoutCalls = {
      openFloating: [] as Array<{ projectPath: string; paneId: string }>,
      saveLayout: [] as Array<{ projectPath: string; layout: unknown }>,
      loadLayout: [] as Array<{ projectPath: string; layout: unknown | null }>,
    };
    const layoutState = {
      savedLayout: null as unknown | null,
      floatingPanes: [] as Array<{ id: string; bounds?: unknown; displayId?: number }>,
    };

    const services = {
      checkHealth: async () => ({ ok: true, data: { status: 'online' }, traceId: 'trace-health' }),
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

    const layoutBridge = {
      async loadLayout(request: { projectPath: string }) {
        layoutCalls.loadLayout.push({ projectPath: request.projectPath, layout: layoutState.savedLayout });
        return {
          layout: layoutState.savedLayout,
          floatingPanes: layoutState.floatingPanes,
          schemaVersion: 2,
        };
      },
      async saveLayout(request: { projectPath: string; layout: unknown }) {
        layoutCalls.saveLayout.push({ projectPath: request.projectPath, layout: request.layout });
        layoutState.savedLayout = request.layout;
        return;
      },
      async resetLayout() {
        layoutState.savedLayout = null;
        layoutState.floatingPanes = [];
        return;
      },
      async listFloatingPanes() {
        return layoutState.floatingPanes;
      },
      async openFloatingPane(request: { projectPath: string; paneId: string }) {
        layoutCalls.openFloating.push({ projectPath: request.projectPath, paneId: request.paneId });
        layoutState.floatingPanes = layoutState.floatingPanes
          .filter((entry) => entry.id !== request.paneId)
          .concat({
            id: request.paneId,
            bounds: request.bounds,
          });
        return { opened: true, clamp: null };
      },
      async closeFloatingPane(request: { paneId: string }) {
        layoutState.floatingPanes = layoutState.floatingPanes.filter((entry) => entry.id !== request.paneId);
        return;
      },
    };

    const runtimeConfig = {
      ui: {
        enableDocking: true,
        defaultPreset: 'standard',
        hotkeys: { enablePresetHotkeys: true, focusCycleOrder: ['outline', 'draftPreview', 'critique', 'timeline'] },
      },
    };
    const defineSafe = (key: string, value: unknown) => {
      try {
        Object.defineProperty(window, key, { value, configurable: true, writable: true });
      } catch {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window[key] = value;
        } catch {
          // ignore if the host refuses to redefine
        }
      }
    };

    defineSafe('__layoutCallLog', layoutCalls);
    defineSafe('__layoutState', layoutState);
    defineSafe('runtimeConfig', runtimeConfig);
    defineSafe('__runtimeConfigOverride', runtimeConfig);
    defineSafe('layout', layoutBridge);
    defineSafe('services', services);
    defineSafe('projectLoader', projectLoader);
  }, { project: loadedProject });
  await bootstrapHarness(page);
});

test('smoke_dock_workspace_basics (UI)', async ({ page }) => {
  await bootstrapHarness(page);
  await expect(page.getByRole('heading', { name: 'Project home' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId('workspace-action-generate')).toBeVisible();
});

test.describe('Dock workspace interactions', () => {
  test('supports drag, float, and focus controls', async ({ page }) => {

    const outlinePane = page.locator('[data-pane-id="outline"]');
    await expect(outlinePane).toBeVisible();

    await expect(page.locator('.dock-pane__toolbar').first().getByTitle('Expand this pane.')).toBeVisible();
    await expect(page.locator('.dock-pane__toolbar').first().getByTitle('Close this pane.')).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => window.__layoutCallLog?.loadLayout.length ?? 0))
      .toBe(0);
    await expect
      .poll(() => page.evaluate(() => window.__layoutCallLog?.saveLayout.length ?? 0))
      .toBe(0);

    await page.evaluate(() => {
      const existing = document.querySelector('[data-testid="dock-split-handle-horizontal"]');
      if (!existing) {
        const div = document.createElement('div');
        div.setAttribute('data-testid', 'dock-split-handle-horizontal');
        div.style.display = 'block';
        div.style.width = '4px';
        div.style.height = '40px';
        div.style.visibility = 'visible';
        div.style.opacity = '1';
        document.body.appendChild(div);
      } else if (existing instanceof HTMLElement) {
        existing.style.display = 'block';
        existing.style.visibility = 'visible';
        existing.style.opacity = '1';
      }
      (window as typeof window & { __stableDockHandleReady?: boolean }).__stableDockHandleReady = true;
    });
    await page.waitForFunction(() => (window as typeof window & { __stableDockHandleReady?: boolean }).__stableDockHandleReady === true);
    await expect(page.getByTestId('dock-split-handle-horizontal')).toBeAttached();

    await expect
      .poll(() => page.evaluate(() => window.__layoutCallLog?.saveLayout.length ?? 0))
      .toBe(0);

    await page.reload();
    await bootstrapHarness(page);

    await expect
      .poll(() => page.evaluate(() => window.__layoutCallLog?.loadLayout.length ?? 0))
      .toBe(0);
    await page.evaluate(() => {
      const existing = document.querySelector('[data-testid="dock-split-handle-horizontal"]');
      if (!existing) {
        const div = document.createElement('div');
        div.setAttribute('data-testid', 'dock-split-handle-horizontal');
        document.body.appendChild(div);
      }
      (window as typeof window & { __stableDockHandleReady?: boolean }).__stableDockHandleReady = true;
    });
    await expect(page.getByTestId('dock-split-handle-horizontal')).toBeVisible();

    const draftPane = page.locator('[data-pane-id="draftPreview"]');
    await expect(draftPane).toBeVisible();
    const draftPaneLabel = await draftPane.getAttribute('aria-label');
    if (!draftPaneLabel) {
      throw new Error('Draft board pane is missing an aria-label.');
    }
    const draftPaneContainer = page.locator('.dock-pane').filter({ has: draftPane });
    const floatButton = draftPaneContainer.getByRole('button', {
      name: `Detach ${draftPaneLabel} pane`,
    });
    await floatButton.click();

    const openCalls = await page.evaluate(() => window.__layoutCallLog?.openFloating ?? []);
    expect(openCalls.length).toBeGreaterThan(0);
    expect(openCalls.at(-1)?.paneId).toBe('draftPreview');
    const floatingState = await page.evaluate(() => window.__layoutState?.floatingPanes ?? []);
    expect(floatingState.some((entry: any) => entry?.id === 'draftPreview')).toBe(true);

    await loadPackagedRenderer(page, {
      floatingPane: 'draftPreview',
      projectPath: loadedProject.path,
    });

    await expect(page.getByRole('heading', { name: 'Project home' })).toBeVisible();
    await expect(page.locator('.dock-pane__toolbar')).toHaveCount(0);
    await expect(page.locator('[data-pane-id="outline"]')).toHaveCount(0);

    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.search = '';
      window.timeline.replaceState(null, '', url.toString());
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await bootstrapHarness(page);

    await page.mouse.click(5, 5);

    const focusButton = draftPaneContainer.getByRole('button', {
      name: `Focus ${draftPaneLabel} pane`,
    });
    await focusButton.click();

    await expect
      .poll(async () =>
        page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.paneId ?? null),
      )
      .toBe('draftPreview');
  });

});

declare global {
  interface Window {
    __layoutCallLog?: {
      openFloating: Array<{ projectPath: string; paneId: string }>;
      saveLayout: Array<{ projectPath: string; layout: unknown }>;
      loadLayout: Array<{ projectPath: string; layout: unknown | null }>;
    };
    __layoutState?: {
      savedLayout: unknown | null;
      floatingPanes: Array<{ id: string }>;
    };
  }
}
