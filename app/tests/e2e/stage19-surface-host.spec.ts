// HARNESS_ONLY:
// Reason: validates the optional Command surface-host transition and recovery contract in the deterministic Stage 19 harness.
// Owner: app/tests/e2e/stage19-surface-host.spec.ts
// Retire when: the surface-host transition is covered by a protected exact-candidate truth receipt with no harness-only dependency.

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ElectronApplication, Page } from '@playwright/test';
import { expect, test } from './_electron.fixture';
import { removeTemporaryDirectory } from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true });

async function closeOptionalCommandWindow(application: ElectronApplication): Promise<void> {
  await application.evaluate(async ({ BrowserWindow }) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (window.isDestroyed()) continue;
      const role = await window.webContents.executeJavaScript(
        "document.querySelector('[data-stage19-role=\"command\"]') ? 'command' : 'other'",
      );
      if (role === 'command') window.close();
    }
  });
}

async function findCommandWindow(
  application: ElectronApplication,
  primary: Page,
): Promise<Page> {
  await expect.poll(async () => {
    const candidates = await Promise.all(application.windows().map(async (candidate) => ({
      candidate,
      command: await candidate.locator('[data-stage19-role="command"]').count(),
    })));
    return candidates.filter((entry) => entry.command > 0 && entry.candidate !== primary).length;
  }, { timeout: 30_000 }).toBe(1);
  const candidates = await Promise.all(application.windows().map(async (candidate) => ({
    candidate,
    command: await candidate.locator('[data-stage19-role="command"]').count(),
  })));
  const command = candidates.find((entry) =>
    entry.command > 0 && entry.candidate !== primary)?.candidate;
  if (!command) throw new Error('Optional Command Center window was not found.');
  return command;
}

test('P3-C preserves one-window writing state and recovers optional Command placement', async ({
  electronApp,
  page,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-p3c-surface-host-'));
  try {
    await expect(page.locator('[data-stage19-role="writing"]')).toBeVisible();

    await expect.poll(
      () => electronApp.windows().length,
      { timeout: 30_000 },
    ).toBe(1);

    await page.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'P3-C Surface Host',
        operationId: 'p3c-create-project',
      });
      if (!created.ok) throw new Error(created.error.message);
      const unit = await bridge.createUnit!({
        projectId: created.snapshot.project!.projectId,
        projectPath: created.snapshot.project!.path,
        generation: created.snapshot.generation,
        operationId: 'p3c-create-unit',
        title: 'Preserved Draft',
      });
      if (!unit.ok) throw new Error(unit.error.message);
    }, parent);

    const prose = 'This unsaved sentence stays with Writing Studio while Command Center moves.';
    const editor = page.locator(
      '[role="textbox"][aria-label="Manuscript editor: Preserved Draft"]',
    );
    await expect(page.getByRole('textbox', { name: 'Manuscript editor: Preserved Draft' }))
      .toBeVisible();
    await editor.fill(prose);
    expect(await editor.textContent()).toContain(prose);

    await expect.poll(
      () => page.evaluate(() => ({
        bridgePresent: Boolean(window.splitCommand),
        bridgeRole: window.splitCommand?.windowRole ?? null,
      })),
      { timeout: 5_000 },
    ).toEqual({ bridgePresent: true, bridgeRole: 'primary' });

    await page.getByRole('button', { name: 'Open Command Center here' }).click();
    await expect(page.getByRole('region', { name: 'Command Center' })).toBeVisible();
    await expect(page.locator('[data-stage19-logical-surface="command"]')).toBeVisible();
    expect(electronApp.windows()).toHaveLength(1);
    await expect(page.getByRole('textbox', { name: 'Manuscript editor: Preserved Draft' }))
      .toHaveCount(0);
    expect(await editor.textContent()).toContain(prose);

    await page.locator('.stage19-spine__surface-actions').getByRole('button', { name: 'Return to Writing Studio' }).click();
    await expect(editor).toBeVisible();
    expect(await editor.textContent()).toContain(prose);
    await expect(editor).toBeFocused();

    await page.getByRole('button', { name: 'Open Command Center in second window' }).click();
    const command = await findCommandWindow(electronApp, page);
    await expect(command.getByRole('region', { name: 'Command Center' })).toBeVisible();
    expect(await editor.textContent()).toContain(prose);

    await closeOptionalCommandWindow(electronApp);
    await expect.poll(() => electronApp.windows().length, { timeout: 30_000 }).toBe(1);
    await expect(page.getByRole('region', { name: 'Command Center' })).toBeVisible();
    await expect(page.getByText(
      'Command Center returned to this window after its second window closed.',
    ).last()).toBeVisible();
    expect(await editor.textContent()).toContain(prose);

    await page.getByRole('button', { name: 'Move Command Center to second window' }).click();
    const reopenedCommand = await findCommandWindow(electronApp, page);
    await expect(reopenedCommand.getByRole('region', { name: 'Command Center' })).toBeVisible();
    // Returning from the optional Command window intentionally closes that
    // window. Playwright can report the expected self-close as a transport
    // failure; the assertions below still require the primary Writing Studio
    // to receive the requested return.
    try {
      await reopenedCommand
        .locator('.stage19-spine__surface-actions')
        .getByRole('button', { name: 'Return to Writing Studio' })
        .dispatchEvent('click');
    } catch (error) {
      if (!String(error).includes('Target page, context or browser has been closed')) {
        throw error;
      }
    }

    await expect.poll(() => electronApp.windows().length, { timeout: 30_000 }).toBe(1);
    await expect(editor).toBeVisible();
    expect(await editor.textContent()).toContain(prose);
    await expect(editor).toBeFocused();
  } finally {
    await removeTemporaryDirectory(parent);
  }
});
