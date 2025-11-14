import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
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

// NOTE: These fixtures mirror sample_project/proj_esther_estate. If the sample project
// budgets or outline change, update the stub values below to keep the test in sync.
const loadedProject = {
  path: projectRoot.replace(/\\/g, '/'),
  name: projectMeta.name,
  outline,
  scenes,
  drafts,
  project_id: projectId,
};

const preflightBudget = {
  estimated_usd: 1.75,
  status: 'ok',
  message: 'Estimate within budget.',
  soft_limit_usd: 10.0,
  hard_limit_usd: 10.0,
  spent_usd: 1.75,
  total_after_usd: 1.75,
};

const preflightEstimate = {
  projectId,
  unitScope: 'scene',
  unitIds: [scenes[0]?.id ?? 'sc_0001'],
  model: { name: 'draft-synthesizer-v1', provider: 'stub' },
  scenes: [
    {
      id: scenes[0]?.id ?? 'sc_0001',
      title: scenes[0]?.title ?? 'Scene',
      order: scenes[0]?.order ?? 1,
      chapter_id: scenes[0]?.chapter_id,
    },
  ],
  budget: preflightBudget,
};

const critiqueBudget = {
  estimated_usd: 0.15,
  status: 'ok',
  message: 'Critique telemetry recorded.',
  soft_limit_usd: 10.0,
  hard_limit_usd: 10.0,
  spent_usd: 1.9,
  total_after_usd: 1.9,
};

const critiqueResponse = {
  unit_id: scenes[0]?.id ?? 'sc_0001',
  schema_version: 'CritiqueOutputSchema v1',
  summary: 'Stub critique summary.',
  line_comments: [],
  priorities: ['Pacing', 'Voice'],
  model: { name: 'critique-stub', provider: 'stub' },
  budget: critiqueBudget,
};

const acceptResponse = {
  unit_id: scenes[0]?.id ?? 'sc_0001',
  checksum: 'stub-checksum',
  schema_version: 'DraftAcceptResult v1',
  snapshot: {
    snapshot_id: '20250101T000000Z',
    label: 'accept',
    created_at: '2025-01-01T00:00:00Z',
    path: 'history/snapshots/20250101T000000Z_accept',
  },
  budget: critiqueBudget,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ project, preflight, critique, accept }) => {
      const services = {
        checkHealth: async () => ({ ok: true, data: { status: 'online' }, traceId: 'trace-health' }),
        buildOutline: async () => ({ ok: true, data: project.outline, traceId: 'trace-outline' }),
        preflightDraft: async () => ({ ok: true, data: preflight, traceId: 'trace-preflight' }),
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
        critiqueDraft: async () => ({ ok: true, data: critique, traceId: 'trace-critique' }),
        acceptDraft: async () => ({ ok: true, data: accept, traceId: 'trace-accept' }),
        createSnapshot: async () => ({ ok: true, data: accept.snapshot, traceId: 'trace-snapshot' }),
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

      Object.defineProperty(window, 'services', { value: services, configurable: true });
      Object.defineProperty(window, 'projectLoader', { value: projectLoader, configurable: true });
    },
    {
      project: loadedProject,
      preflight: preflightEstimate,
      critique: critiqueResponse,
      accept: acceptResponse,
    },
  );
  await bootstrapHarness(page);
});

test.describe('Budget meter (packaged)', () => {
  test('updates immediately after critique', async ({ page }) => {
    await expect(page.getByRole('heading', { name: projectMeta.name })).toBeVisible();

    const generateButton = page.getByRole('button', { name: 'Generate' });
    await generateButton.click();

    await expect(page.getByText('$1.75 / $10.00', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    const critiqueButton = page.getByRole('button', { name: 'Critique' });
    await expect(critiqueButton).toBeEnabled();
    await critiqueButton.click();

    await expect(page.getByText('$1.90 / $10.00', { exact: true })).toBeVisible();
  });
});
