import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { loadSampleProject } from './utils/sampleProject';
import type { Page } from '@playwright/test';

const fixture = loadSampleProject();
const { projectId, outline, drafts, scenes } = fixture;

// NOTE: These fixtures mirror sample_project/proj_esther_estate. If the sample project
// budgets or outline change, update the stub values below to keep the test in sync.
const loadedProject = fixture.loadedProject;

const preflightBudget = {
  estimated_usd: 0.02,
  status: 'ok',
  message: 'Estimate within budget.',
  soft_limit_usd: 5.0,
  hard_limit_usd: 10.0,
  spent_usd: 0.02,
  total_after_usd: 0.02,
  cost: 0.02,
  limit: 10.0,
  remaining: 9.98,
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
console.log('[budget-mock:preflight]', preflightBudget);

const HARNESS_ONLY_METADATA = {
  reason: 'Validates packaged UI budget rendering with deterministic stubbed services.',
  owner: 'app/tests/e2e/budget-meter.spec.ts',
  retireWhen:
    'truth-lane coverage provides equivalent budget assertions without synthetic service stubs',
} as const;
// HARNESS_ONLY:
// Reason: validates packaged UI budget rendering with deterministic stubbed services.
// Owner: app/tests/e2e/budget-meter.spec.ts
// Retire when: truth-lane coverage provides equivalent budget assertions without synthetic service stubs.
console.log('[HARNESS_ONLY]', HARNESS_ONLY_METADATA);

const critiqueBudget = {
  estimated_usd: 0.01,
  status: 'ok',
  message: 'Critique complete.',
  soft_limit_usd: 5.0,
  hard_limit_usd: 10.0,
  spent_usd: 0.02,
  total_after_usd: 0.02,
  cost: 0.02,
  limit: 10.0,
  remaining: 9.98,
};

const critiqueBudgetLabel = `$${critiqueBudget.total_after_usd.toFixed(2)} / $${critiqueBudget.hard_limit_usd.toFixed(2)}`;

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

type BudgetHarnessPayload = {
  project: typeof loadedProject;
  preflight: typeof preflightEstimate;
  critique: typeof critiqueResponse;
  accept: typeof acceptResponse;
};

async function installBudgetHarnessOverrides(
  page: Page,
  payload: BudgetHarnessPayload,
): Promise<void> {
  const installer = ({ project, preflight, critique, accept }: BudgetHarnessPayload) => {
    const services = {
      checkHealth: async () => ({
        ok: true,
        data: { status: 'online' },
        traceId: 'trace-health',
      }),
      buildOutline: async () => ({ ok: true, data: project.outline, traceId: 'trace-outline' }),
      preflightDraft: async () => {
        return { ok: true, data: preflight, traceId: 'trace-preflight' };
      },
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
      critiqueDraft: async () => {
        return { ok: true, data: critique, traceId: 'trace-critique' };
      },
      acceptDraft: async () => {
        return { ok: true, data: accept, traceId: 'trace-accept' };
      },
      createSnapshot: async () => ({
        ok: true,
        data: accept.snapshot,
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

    (window as typeof window & { services?: unknown }).services = services;
    (
      window as typeof window & {
        __dev?: { overrideServices?: (overrides: Partial<typeof services>) => void };
      }
    ).__dev?.overrideServices?.(services);
    (window as typeof window & { projectLoader?: unknown }).projectLoader = projectLoader;
  };

  await page.addInitScript(installer, payload);
  await page.evaluate(installer, payload);
}

test.beforeEach(async ({ page }) => {
  await installBudgetHarnessOverrides(page, {
    project: loadedProject,
    preflight: preflightEstimate,
    critique: critiqueResponse,
    accept: acceptResponse,
  });
  await bootstrapHarness(page);
});

test.describe('HARNESS_ONLY: Budget meter (packaged)', () => {
  test('updates immediately after critique', async ({ page }) => {
    await expect(page.getByTestId('dock-workspace')).toBeVisible();
    await installBudgetHarnessOverrides(page, {
      project: loadedProject,
      preflight: preflightEstimate,
      critique: critiqueResponse,
      accept: acceptResponse,
    });
    const generateButton = page.getByRole('button', { name: 'Generate' });
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    const preflightDialog = page.getByRole('dialog', { name: 'Draft preflight' });
    await expect(preflightDialog).toBeVisible({ timeout: 30_000 });
    await expect(preflightDialog.getByText('Estimate within budget.')).toBeVisible();
    await expect(preflightDialog.getByRole('button', { name: 'Proceed' })).toBeEnabled();
    const closePreflightButton = preflightDialog.getByRole('button', { name: 'Close' });
    if (await closePreflightButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await closePreflightButton.click();
    }

    const critiqueButton = page.getByTestId('workspace-action-critique');
    await expect(critiqueButton).toBeEnabled();
    await critiqueButton.click();

    await page.evaluate(() => {
      window.__budgetRefresh?.();
    });
    await expect(page.getByText(critiqueBudgetLabel, { exact: true })).toBeVisible();
  });
});
