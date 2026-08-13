import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, markElectronApplicationExitedCleanly, test } from './_electron.fixture';
import {
  getStage19Windows,
  openWritingStudioRail,
  removeTemporaryDirectory,
  requestWritingStudioClose,
  waitForCleanElectronApplicationExit,
} from './stage19-electron-support';

test.use({
  splitCommandRuntimeConfig: true,
  skipPageCloseTeardown: true,
  skipFailureScreenshotAfterVerifiedExit: true,
});

test('selected-prose critique is Writing-Studio-only, preview-bound, optional, and non-blocking', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-ai-e2e-'));
  try {
    const { writing, command } = await getStage19Windows(electronApp, page);
    const exposure = await Promise.all([
      writing.evaluate(() => ({
        role: window.projectSpine?.windowRole,
        aiType: typeof window.aiCritique,
        aiKeys: Object.keys(window.aiCritique ?? {}).sort(),
      })),
      command.evaluate(() => ({
        role: window.projectSpine?.windowRole,
        aiType: typeof window.aiCritique,
        visibleAiSurface: document.body.innerText.includes('Optional remote critique'),
      })),
    ]);
    expect(exposure[0]).toEqual({
      role: 'writing',
      aiType: 'object',
      aiKeys: [
        'approveAndExecute',
        'cancel',
        'clearCredential',
        'credentialStatus',
        'invalidate',
        'prepare',
        'setCredential',
        'subscribeState',
      ].sort(),
    });
    expect(exposure[1]).toEqual({ role: 'command', aiType: 'undefined', visibleAiSurface: false });

    await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'AI preview project',
        operationId: 'ai-e2e-create-project',
      });
      if (!created.ok) throw new Error(created.error.message);
      const unit = await bridge.createUnit!({
        projectId: created.snapshot.project!.projectId,
        projectPath: created.snapshot.project!.path,
        generation: created.snapshot.generation,
        operationId: 'ai-e2e-create-unit',
        title: 'Preview passage',
      });
      if (!unit.ok) throw new Error(unit.error.message);
    }, parent);

    const prose = `${'Rain marked the station glass while Mara waited beneath a clock that had stopped before midnight. '.repeat(5)}End.`;
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Preview passage' });
    await editor.fill(prose);
    await openWritingStudioRail(writing, 'story tools');
    await expect(writing.getByRole('button', { name: '01 Preview passage' })).toBeVisible();
    await expect(writing.getByRole('list', { name: 'Story order' }).getByText('Unsaved', { exact: true })).toBeVisible();
    await editor.focus();
    await writing.keyboard.press('Control+A');
    await openWritingStudioRail(writing, 'writing support');
    const review = writing.getByRole('button', { name: 'Review outbound critique request' });
    await expect(review).toBeEnabled();
    await review.click();

    const preview = writing.getByRole('heading', { name: 'Exact outbound preview' });
    await expect(preview).toBeVisible();
    await expect(writing.getByText('gpt-5.4-2026-03-05', { exact: true })).toBeVisible();
    await expect(writing.getByText('Remote OpenAI Responses API')).toBeVisible();
    await expect(writing.getByText('2026-07-14')).toBeVisible();
    await expect(writing.getByLabel('Exact selected prose to transmit')).toHaveValue(prose);
    await expect(writing.locator('.stage19-ai__preview pre').filter({ hasText: '"store":false' })).toContainText(prose);
    await expect(writing.getByRole('button', { name: 'Approve and send exact payload' })).toBeDisabled();
    await expect(writing.getByRole('button', { name: /apply|insert|rewrite|copy to editor/i })).toHaveCount(0);

    await editor.press('End');
    await editor.pressSequentially(' Changed after preview.');
    await expect(preview).toHaveCount(0);
    await writing.getByRole('button', { name: /^Save$/ }).click();
    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();

    const cleanExit = waitForCleanElectronApplicationExit(electronApp);
    await requestWritingStudioClose(electronApp);
    expect(await cleanExit).toEqual({ code: 0, signal: null });
    markElectronApplicationExitedCleanly(electronApp);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});
// HARNESS_ONLY
// Reason: Exercises synthetic Stage 19 Electron state before installed-build qualification.
// Owner: Package 19.22 internal baseline verification.
// Retire when: An installed-build critique truth lane provides equivalent deterministic coverage.
