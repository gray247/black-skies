import type { Page } from '@playwright/test';
import { test, expect } from './_electron.fixture';
import { bootstrapHarness } from './_bootstrap';
import { loadSampleProject } from './utils/sampleProject';
import { SERVICE_PORT } from './servicePort';
import { TID } from '../../renderer/utils/testIds';

const { loadedProject } = loadSampleProject();
const FULL_ANALYTICS_E2E = process.env.FULL_ANALYTICS_E2E === '1';
const primaryScene = loadedProject.scenes[0];

type ServiceScenario = 'normal' | 'snapshot' | 'budget' | 'budget-indicator';

const preflightEstimate = {
  projectId: loadedProject.project_id,
  unitScope: 'scene',
  unitIds: [primaryScene.id],
  model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
  scenes: loadedProject.scenes.map((scene) => ({
    id: scene.id,
    title: scene.title ?? 'Scene',
    order: scene.order ?? 1,
    chapter_id: scene.chapter_id,
    beat_refs: scene.beat_refs ?? [],
  })),
  budget: {
    estimated_usd: 0.02,
    status: 'ok',
    message: 'Estimate within budget.',
    soft_limit_usd: 5.0,
    hard_limit_usd: 10.0,
    spent_usd: 0.02,
    total_after_usd: 0.02,
  },
};

const generateDraftResponse = {
  project_id: loadedProject.project_id,
  unit_scope: 'scene',
  unit_ids: [primaryScene.id],
  draft_id: 'flow-draft',
  schema_version: 'DraftUnitSchema v1',
  units: [
    {
      id: primaryScene.id,
      title: primaryScene.title ?? 'Scene',
      text: loadedProject.drafts[primaryScene.id] ?? 'Story text',
      meta: {
        id: primaryScene.id,
        slug: primaryScene.id,
        title: primaryScene.title ?? 'Scene',
        order: primaryScene.order ?? 1,
        chapter_id: primaryScene.chapter_id,
        purpose: 'escalation',
        emotion_tag: 'tension',
        pov: 'Mara',
        conflict: 'rising tension',
        word_target: 900,
      },
    },
  ],
  budget: {
    estimated_usd: 0.02,
    status: 'ok',
    message: 'Estimate within budget.',
    soft_limit_usd: 5.0,
    hard_limit_usd: 10.0,
    spent_usd: 0.02,
    total_after_usd: 0.02,
  },
};

const critiqueResponse = {
  unit_id: primaryScene.id,
  schema_version: 'CritiqueOutputSchema v1',
  summary: 'Scene champions the pacing goals with a decisive turn.',
  line_comments: [
    {
      line: 1,
      note: 'Focus this paragraph for clarity.',
      excerpt: 'The cellar hums.',
    },
  ],
  priorities: ['Maintain tension', 'Clarify stakes'],
  rubric: ['Logic', 'Pacing'],
  rubric_id: 'baseline',
  suggested_edits: [],
  severity: 'medium',
  model: { name: 'critique-model-v1', provider: 'offline' },
  heuristics: {
    pov_consistency: 1.0,
    goal_clarity: 0.8,
    conflict_clarity: 0.9,
    pacing_fit: 0.85,
  },
  budget: {
    estimated_usd: 0.01,
    status: 'ok',
    message: 'Critique complete.',
    soft_limit_usd: 5.0,
    hard_limit_usd: 10.0,
    spent_usd: 0.02,
    total_after_usd: 0.02,
  },
};

const snapshotResponse = {
  snapshot_id: 'pw-wizard-final',
  label: 'wizard-finalize',
  created_at: new Date().toISOString(),
  path: 'history/snapshots/pw-wizard-final',
  includes: ['outline.json', 'drafts'],
};

const recoveryStatus = {
  project_id: loadedProject.project_id,
  status: 'idle',
  needs_recovery: false,
  last_snapshot: null,
};

const restoreResponse = {
  project_id: loadedProject.project_id,
  status: 'idle',
  needs_recovery: false,
  last_snapshot: snapshotResponse,
};

async function stubServiceEndpoints(page: Page, scenario: ServiceScenario): Promise<void> {
  await page.route(`http://127.0.0.1:${SERVICE_PORT}/api/v1/*`, (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace('/api/v1', '');
    const respond = (data: unknown, options?: { status?: number }) =>
      route.fulfill({
        status: options?.status ?? 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    const blocked = () =>
      respond(
        { code: 'BUDGET_EXCEEDED', message: 'Budget limit exceeded.' },
        { status: 402 },
      );

    switch (path) {
      case '/healthz':
        respond({ status: 'ok' });
        return;
      case '/outline/build':
        respond(loadedProject.outline);
        return;
      case '/draft/preflight':
        respond(preflightEstimate);
        return;
      case '/draft/generate':
        if (scenario === 'budget') {
          blocked();
        } else {
          respond(generateDraftResponse);
        }
        return;
      case '/draft/critique':
        if (scenario === 'budget') {
          blocked();
        } else {
          respond(critiqueResponse);
        }
        return;
      case '/analytics/budget':
        respond(
          {
            code: 'ANALYTICS_DISABLED',
            message: 'Budget analytics calls are suppressed in this build.',
          },
          { status: 410 },
        );
        return;
      case '/draft/wizard/lock':
        respond(snapshotResponse);
        return;
      case '/draft/recovery':
        if (route.request().method() === 'GET') {
          respond(recoveryStatus);
        } else {
          respond(restoreResponse);
        }
        return;
      case '/draft/recovery/restore':
        respond(restoreResponse);
        return;
      default:
        route.fulfill({ status: 404, body: 'Not found' });
    }
  });
}

async function installServiceStubs(page: Page, scenario: ServiceScenario): Promise<void> {
  await stubServiceEndpoints(page, scenario);
}

test.describe('GUI flow smoke tests', () => {
  test('smoke_wizard_to_draft_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'normal');
    await bootstrapHarness(page);

    await expect(page.getByTestId(TID.wizardRoot)).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => window.__selectSceneForTest?.('sc_0001'));

    await expect(page.getByTestId('workspace-action-generate')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('workspace-action-critique')).toBeVisible({ timeout: 30_000 });
  });

  test('smoke_draft_to_critique_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'normal');
    await bootstrapHarness(page);

    await page.evaluate(() => window.__selectSceneForTest?.('sc_0001'));
    const critiqueButton = page.getByTestId('workspace-action-critique');
    await expect(critiqueButton).toBeVisible({ timeout: 30_000 });
  });

  test('snapshot_restore_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'snapshot');
    await bootstrapHarness(page);

    const lockButton = page.getByRole('button', { name: /Lock$/i }).first();
    await lockButton.click();
    await expect(page.locator('.toast__title', { hasText: /locked/i })).toBeVisible();

    const editor = page.locator('.project-home__draft-editor .cm-content');
    const originalText = (await editor.textContent()) ?? '';
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Corrupted by test.');
    await expect(editor).toHaveText('Corrupted by test.');

    await page.getByRole('button', { name: 'Restore snapshot' }).click();
    await expect(page.locator('.toast__title', { hasText: 'Restored earlier version.' })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole('button', { name: 'Refresh from disk' }).click();
    await expect(editor).toHaveText(originalText);
  });

  test('budget_guardrail_smoke (UI)', async ({ page }) => {
    await installServiceStubs(page, 'budget');
    await bootstrapHarness(page);

    await page.evaluate(() => window.__selectSceneForTest?.('sc_0001'));
    await page.getByTestId('workspace-action-generate').click();

    const preflightDialog = page.getByRole('dialog', { name: /draft preflight/i });
    await expect(preflightDialog).toBeVisible({ timeout: 30_000 });
    await preflightDialog.getByRole('button', { name: 'Proceed' }).click();

    await expect(page.locator('.toast__title', { hasText: "Couldn't write draft." })).toBeVisible();
    await expect(
      page.locator('.toast__description', { hasText: 'Budget limit exceeded.' }),
    ).toBeVisible();

    await preflightDialog.getByRole('button', { name: 'Cancel' }).click();

    await page.getByTestId('workspace-action-critique').click();
    await expect(page.locator('.toast__title', { hasText: 'Feedback unavailable.' })).toBeVisible();
    await expect(
      page.locator('.toast__description', { hasText: 'Budget limit exceeded.' }),
    ).toBeVisible();
  });

  (FULL_ANALYTICS_E2E ? test : test.skip)('budget_indicator_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'budget-indicator');
    await bootstrapHarness(page);

    await expect(page.getByTestId(TID.budgetIndicator).first()).toBeVisible({
      timeout: 30_000,
    });
    const indicator = page.getByTestId(TID.budgetIndicator).first();
    const indicatorMessage = indicator.locator('.budget-indicator__message');

    const makeBudgetResponse = (
      hint: 'stable' | 'near_cap' | 'over_budget',
      spent: number,
      remaining: number,
      message: string,
    ) => ({
      project_id: loadedProject.project_id,
      budget: {
        soft_limit_usd: 100,
        hard_limit_usd: 200,
        spent_usd: spent,
        remaining_usd: remaining,
      },
      hint,
      message,
    });

    const applyTestBudgetState = async (response: ReturnType<typeof makeBudgetResponse>) => {
      await page.evaluate((payload) => {
        (window as any).__testBudgetResponse = payload;
        (window as any).__budgetRefresh?.();
      }, response);
      await expect(indicator).toBeVisible({ timeout: 5_000 });
    };

    await applyTestBudgetState(makeBudgetResponse('stable', 5, 95, 'Budget healthy.'));
    await expect(indicator).toHaveText(/Budget OK/i);
    await expect(indicatorMessage).toHaveText(/Budget healthy\./i);

    await applyTestBudgetState(
      makeBudgetResponse('near_cap', 90, 10, 'Approaching soft cap.'),
    );
    await expect(indicator).toHaveText(/Budget warning/i);
    await expect(indicatorMessage).toHaveText(/Approaching soft cap\./i);

    await applyTestBudgetState(
      makeBudgetResponse('over_budget', 110, 0, 'Budget exhausted for this project/session.'),
    );
    await expect(indicator).toHaveText(/Budget exhausted/i);
    await expect(indicatorMessage).toHaveText(/Budget exhausted for this project\/session\./i);
    await expect(page.getByTestId('workspace-action-generate')).toBeDisabled();
    await expect(page.getByTestId('workspace-action-critique')).toBeDisabled();
  });

  (FULL_ANALYTICS_E2E ? test : test.skip)('snapshots_panel_flow (UI)', async ({ page }) => {
    await installServiceStubs(page, 'normal');
    await bootstrapHarness(page);

    const panelSnapshots = [
      {
        snapshot_id: 'pw-wizard-final',
        created_at: '2025-01-17T12:00:00.000Z',
        path: 'history/snapshots/pw-wizard-final',
        files_included: [],
      },
    ];
    const verificationReport = {
      project_id: loadedProject.project_id,
      snapshots: panelSnapshots.map((entry) => ({
        snapshot_id: entry.snapshot_id,
        status: 'ok' as const,
      })),
    };

    await page.evaluate(
      ({ snapshots, verification }) => {
        (window as any).__revealCalls = [];
        window.__dev?.overrideServices?.({
          listProjectSnapshots: async () => ({
            ok: true,
            traceId: 'trace-list-snapshots',
            data: snapshots,
          }),
          runBackupVerification: async () => ({
            ok: true,
            traceId: 'trace-verify-snapshots',
            data: verification,
          }),
          revealPath: async (targetPath: string) => {
            (window as any).__revealCalls.push(targetPath);
          },
        });
      },
      { snapshots: panelSnapshots, verification: verificationReport },
    );

    await page.getByTestId('workspace-action-snapshots').click();
    const panel = page.getByRole('dialog', { name: /snapshots/i });
    await expect(panel).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByText(panelSnapshots[0].snapshot_id)).toBeVisible();
    await expect(panel.getByText(/Verification OK/i)).toBeVisible();

    await panel
      .getByRole('button', { name: `Reveal snapshot ${panelSnapshots[0].snapshot_id}` })
      .click();
    await panel
      .getByRole('button', {
        name: `Reveal manifest for ${panelSnapshots[0].snapshot_id}`,
      })
      .click();

    const revealCalls = await page.evaluate(() => (window as any).__revealCalls ?? []);
    expect(revealCalls).toEqual([
      panelSnapshots[0].path,
      `${panelSnapshots[0].path}/manifest.json`,
    ]);
  });

  test('service_port_unavailable_flow (UI)', async ({ page }) => {
    await page.evaluate(() => {
      window.__dev?.overrideServices?.({
        async checkHealth() {
          return {
            ok: false,
            error: { message: 'Service port is unavailable.' },
            traceId: 'pw-health-port',
          };
        },
      });
    });
    await bootstrapHarness(page);

    await page.waitForFunction(
      () => typeof (window as any).__serviceHealthRetry === 'function',
      null,
      { timeout: 30_000 },
    );

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('test:service-health', {
          detail: {
            status: 'offline',
            portUnavailable: true,
            errorMessage: 'Service port is unavailable.',
          },
        }),
      );
    });

    const banner = page.getByTestId(TID.serviceHealthBanner);
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(
      banner.getByText(/The writing tools service port is unavailable\./i),
    ).toBeVisible();
    await expect(page.getByTestId('workspace-action-generate')).toBeDisabled();
    await expect(page.getByTestId('workspace-action-critique')).toBeDisabled();

    await page.evaluate(() => {
      window.__dev?.overrideServices?.({
        async checkHealth() {
          return {
            ok: true,
            data: { status: 'online' },
            traceId: 'pw-health-retry',
          };
        },
      });
    });

    await banner.getByRole('button', { name: /retry connection/i }).click();
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('test:service-health', {
          detail: { status: 'online' },
        }),
      );
    });
    await expect(page.getByTestId(TID.serviceHealthBanner)).toHaveCount(0);
    await expect(page.getByTestId('workspace-action-generate')).toBeEnabled({
      timeout: 30_000,
    });
    await expect(page.getByTestId('workspace-action-critique')).toBeEnabled({
      timeout: 30_000,
    });
  });
});
