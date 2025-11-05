import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Page } from '@playwright/test';
import { test, expect } from './electron.launch';
import { TID } from '../../renderer/utils/testIds';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleProjectPath = path.resolve(__dirname, '../../sample_project/Esther_Estate');

async function bootstrapHarness(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__dev?.overrideServices?.({
      async checkHealth() {
        return {
          ok: true,
          data: { status: 'online' },
          traceId: 'pw-health',
        };
      },
      async getRecoveryStatus() {
        return {
          ok: true,
          data: { needs_recovery: false },
          traceId: 'pw-recovery',
        };
      },
      async createSnapshot() {
        return {
          ok: true,
          data: {
            snapshot_id: 'pw-snapshot',
            label: 'test',
            created_at: new Date().toISOString(),
            path: 'history/snapshots/pw-snapshot',
          },
          traceId: 'pw-create-snapshot',
        };
      },
      async restoreSnapshot() {
        return {
          ok: true,
          data: { restored: true },
          traceId: 'pw-restore',
        };
      },
      async preflightDraft() {
        return {
          ok: true,
          data: {
            projectId: 'proj_esther_estate',
            unitScope: 'scene',
            unitIds: ['sc_0001'],
            model: { name: 'stub-model', provider: 'test' },
            scenes: [{ id: 'sc_0001', title: 'Arrival', order: 1 }],
            budget: {
              estimated_usd: 1.25,
              status: 'ok',
              soft_limit_usd: 10,
              hard_limit_usd: 10,
              spent_usd: 1.25,
              total_after_usd: 1.25,
            },
          },
          traceId: 'pw-preflight',
        };
      },
      async generateDraft() {
        return {
          ok: true,
          data: {
            draft_id: 'pw-draft',
            schema_version: 'DraftUnitSchema v1',
            units: [],
            budget: { status: 'ok' },
          },
          traceId: 'pw-generate',
        };
      },
      async critiqueDraft() {
        return {
          ok: true,
          data: {
            unit_id: 'sc_0001',
            schema_version: 'CritiqueOutputSchema v1',
            summary: 'Stub critique output for Playwright smoke test.',
            line_comments: [],
            priorities: [],
            budget: { status: 'ok' },
          },
          traceId: 'pw-critique',
        };
      },
      async acceptDraft() {
        return {
          ok: true,
          data: {
            unit_id: 'sc_0001',
            checksum: 'pw-checksum',
            schema_version: 'DraftAcceptResult v1',
            snapshot: {
              snapshot_id: 'pw-accept',
              label: 'accept',
              created_at: new Date().toISOString(),
              path: 'history/snapshots/pw-accept',
            },
            budget: { status: 'ok' },
          },
          traceId: 'pw-accept',
        };
      },
    });
  });
}

test.describe('Electron smoke', () => {
  test('load project, advance wizard, and surface dock workspace', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await bootstrapHarness(page);

    await expect(page.getByTestId(TID.openProjectBtn)).toBeVisible();
    await page.evaluate(async (projectPath) => {
      await window.__dev?.setProjectDir?.(projectPath ?? null);
    }, sampleProjectPath);

    await page.getByTestId(TID.openProjectBtn).click();

    await expect(page.getByTestId(TID.dockWorkspace)).toBeVisible();
    await expect(page.getByTestId(TID.wizardRoot)).toBeVisible();

    const outlineEditor = page.getByTestId(TID.outlineEditor);
    const wizardNext = page.getByTestId(TID.wizardNext);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (await outlineEditor.isVisible()) {
        break;
      }
      await wizardNext.click();
    }

    await expect(outlineEditor).toBeVisible();
  });
});
