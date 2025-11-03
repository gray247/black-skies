import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const projectId = 'proj_esther_estate';
const projectRoot = path.join(repoRoot, 'sample_project', projectId);
const outline = JSON.parse(fs.readFileSync(path.join(projectRoot, 'outline.json'), 'utf-8'));
const projectMeta = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.json'), 'utf-8'));
const draftsDir = path.join(projectRoot, 'drafts');
const drafts = Object.fromEntries(
  fs
    .readdirSync(draftsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => [path.basename(file, '.md'), fs.readFileSync(path.join(draftsDir, file), 'utf-8')]),
);

const scenes = outline.scenes.map((scene: any) => ({
  id: scene.id,
  title: scene.title,
  order: scene.order,
  chapter_id: scene.chapter_id,
  beat_refs: scene.beat_refs,
  purpose: 'escalation',
  emotion_tag: 'tension',
}));

const loadedProject = {
  path: projectRoot.replace(/\\/g, '/'),
  name: projectMeta.name,
  outline,
  scenes,
  drafts,
  project_id: projectId,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ project }) => {
    const layoutCalls = {
      openFloating: [] as Array<{ projectPath: string; paneId: string }>,
      saveLayout: [] as Array<{ projectPath: string; layout: unknown }>,
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

    const layoutBridge = {
      async loadLayout() {
        return { layout: null, floatingPanes: [], schemaVersion: 2 };
      },
      async saveLayout(request: { projectPath: string; layout: unknown }) {
        layoutCalls.saveLayout.push({ projectPath: request.projectPath, layout: request.layout });
        return;
      },
      async resetLayout() {
        return;
      },
      async listFloatingPanes() {
        return [];
      },
      async openFloatingPane(request: { projectPath: string; paneId: string }) {
        layoutCalls.openFloating.push({ projectPath: request.projectPath, paneId: request.paneId });
        return true;
      },
      async closeFloatingPane() {
        return;
      },
    };

    const runtimeConfig = {
      ui: {
        enableDocking: true,
        defaultPreset: 'standard',
        hotkeys: { enablePresetHotkeys: true, focusCycleOrder: ['wizard', 'draft-board', 'critique', 'history'] },
      },
    };

    Object.defineProperty(window, '__layoutCallLog', { value: layoutCalls, configurable: true });
    Object.defineProperty(window, 'runtimeConfig', { value: runtimeConfig, configurable: true });
    Object.defineProperty(window, 'layout', { value: layoutBridge, configurable: true });
    Object.defineProperty(window, 'services', { value: services, configurable: true });
    Object.defineProperty(window, 'projectLoader', { value: projectLoader, configurable: true });
  }, { project: loadedProject });
});

test.describe('Dock workspace interactions', () => {
  test('supports drag, float, and focus controls', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173');

    await page.getByRole('button', { name: 'Open project' }).click();

    const wizardPane = page.locator('[data-pane-id="wizard"]');
    await expect(wizardPane).toBeVisible();

    await expect(page.locator('.dock-pane__toolbar').first().getByTitle('Expand')).toBeVisible();
    await expect(page.locator('.dock-pane__toolbar').first().getByTitle('Close Window')).toBeVisible();

    const initialSaveCount = await page.evaluate(
      () => window.__layoutCallLog?.saveLayout.length ?? 0,
    );

    const horizontalSplit = page.locator('.mosaic-split.-row').first();
    const splitBox = await horizontalSplit.boundingBox();
    if (!splitBox) {
      throw new Error('Expected to find a horizontal split handle');
    }
    await page.mouse.move(splitBox.x + splitBox.width / 2, splitBox.y + splitBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(splitBox.x + splitBox.width / 2 + 120, splitBox.y + splitBox.height / 2, {
      steps: 8,
    });
    await page.mouse.up();

    await expect
      .poll(() => page.evaluate(() => window.__layoutCallLog?.saveLayout.length ?? 0))
      .toBeGreaterThan(initialSaveCount);
    const layoutHasSplit = await page.evaluate(() => {
      const entry = window.__layoutCallLog?.saveLayout.at(-1);
      if (!entry) {
        return false;
      }
      const hasSplit = (node: any): boolean => {
        if (!node || typeof node !== 'object') {
          return false;
        }
        if (typeof node.splitPercentage === 'number' && !Number.isNaN(node.splitPercentage)) {
          return node.splitPercentage > 0 && node.splitPercentage < 100;
        }
        return hasSplit((node as any).first) || hasSplit((node as any).second);
      };
      return hasSplit(entry.layout);
    });
    expect(layoutHasSplit).toBe(true);

    const floatButton = page.getByRole('button', { name: 'Detach Draft board pane' });
    await floatButton.click();

    const openCalls = await page.evaluate(() => window.__layoutCallLog?.openFloating ?? []);
    expect(openCalls.length).toBeGreaterThan(0);
    expect(openCalls.at(-1)?.paneId).toBe('draft-board');

    await page.mouse.click(5, 5);

    const focusButton = page.getByRole('button', { name: 'Focus Draft board pane' });
    await focusButton.click();

    await expect
      .poll(async () =>
        page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.paneId ?? null),
      )
      .toBe('draft-board');
  });
});

declare global {
  interface Window {
    __layoutCallLog?: {
      openFloating: Array<{ projectPath: string; paneId: string }>;
      saveLayout: Array<{ projectPath: string; layout: unknown }>;
    };
  }
}
