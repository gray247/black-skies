import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, markElectronApplicationExitedCleanly, test } from './_electron.fixture';
import {
  closeLaunchedApplicationBestEffort,
  getStage19Windows,
  launchStage19BuiltApplication,
  openWritingStudioRail,
  removeTemporaryDirectory,
  requestWritingStudioClose,
  waitForCleanElectronApplicationExit,
  type LaunchedStage19Application,
} from './stage19-electron-support';

// This test uses only synthetic temporary directories. It drives the production
// preload bridge directly because native directory pickers are OS-owned.
test.use({ splitCommandRuntimeConfig: true });

function observeElectronBeforeUnload(page: Page): {
  stop: () => void;
  observedTypes: string[];
  unexpectedTypes: string[];
} {
  const observedTypes: string[] = [];
  const unexpectedTypes: string[] = [];
  const handleDialog = (dialog: { type: () => string }) => {
    const type = dialog.type();
    observedTypes.push(type);
    if (type !== 'beforeunload') unexpectedTypes.push(type);
  };
  page.on('dialog', handleDialog);
  return {
    observedTypes,
    unexpectedTypes,
    stop: () => page.off('dialog', handleDialog),
  };
}

test('Stage 19 dedicated windows reach stable startup', async ({ electronApp, page }) => {
  const { writing, command } = await getStage19Windows(electronApp, page);
  await expect(writing.locator('[data-stage19-role="writing"]')).toBeVisible();
  await expect(command.locator('[data-stage19-role="command"]')).toBeVisible();
  await expect.poll(() => electronApp.process()?.exitCode ?? null, { timeout: 2_000 }).toBeNull();
});

test('redo followed immediately by Ctrl+S saves the restored prose durably', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-redo-save-e2e-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const project = await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'Redo save project',
        operationId: 'redo-save-create',
      });
      if (!created.ok) throw new Error(created.error.message);
      const current = await bridge.getSession();
      const unit = await bridge.createUnit!({
        projectId: current.project!.projectId,
        projectPath: current.project!.path,
        generation: current.generation,
        operationId: 'redo-save-unit',
        title: 'Opening unit',
      });
      if (!unit.ok) throw new Error(unit.error.message);
      return {
        path: current.project!.path,
        unitId: unit.data.unitId,
      };
    }, parent);
    const prose = 'ORION-OPENING — Café 🌌 **bold**\nUNDO-CHECK — this line must return';
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Opening unit' });

    await editor.fill(prose);
    await writing.keyboard.press('Control+Z');
    await writing.keyboard.press('Control+Y');
    await writing.keyboard.press('Control+S');

    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await openWritingStudioRail(writing, 'story tools');
    await expect(writing.getByRole('button', { name: 'Opening unit Unsaved' })).toHaveCount(0);
    const durable = await writing.evaluate(async ({ unitId }) => {
      const current = await window.projectSpine!.getSession();
      return current.project?.drafts[unitId] ?? null;
    }, project);
    expect(durable).toContain(prose);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

test('Ctrl+S saves editor prose that ends with an intentional trailing newline', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-trailing-newline-e2e-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const project = await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'Trailing newline project',
        operationId: 'trailing-newline-create',
      });
      if (!created.ok) throw new Error(created.error.message);
      const current = await bridge.getSession();
      const unit = await bridge.createUnit!({
        projectId: current.project!.projectId,
        projectPath: current.project!.path,
        generation: current.generation,
        operationId: 'trailing-newline-unit',
        title: 'Trailing newline unit',
      });
      if (!unit.ok) throw new Error(unit.error.message);
      return { unitId: unit.data.unitId };
    }, parent);
    const editor = writing.getByRole('textbox', {
      name: 'Manuscript editor: Trailing newline unit',
    });

    await editor.fill('Baseline retained after deleting line two.\n');
    await writing.keyboard.press('Control+S');

    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await expect(writing.getByText('The submitted manuscript prose does not match')).toHaveCount(0);
    const durable = await writing.evaluate(async ({ unitId }) => {
      const current = await window.projectSpine!.getSession();
      return current.project?.drafts[unitId] ?? null;
    }, project);
    expect(durable).toContain('Baseline retained after deleting line two.\n\n');
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

test('cancelled project switch leaves the editor immediately editable', async ({ electronApp, page }) => {
  const parentA = await mkdtemp(join(tmpdir(), 'black-skies-stage19-cancel-focus-a-'));
  const parentB = await mkdtemp(join(tmpdir(), 'black-skies-stage19-cancel-focus-b-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const projects = await writing.evaluate(async ({ parentAPath, parentBPath }) => {
      const bridge = window.projectSpine!;
      const createdA = await bridge.createProject({ parentPath: parentAPath, title: 'Cancel focus A', operationId: 'cancel-focus-create-a' });
      if (!createdA.ok) throw new Error(createdA.error.message);
      const pathA = createdA.snapshot.project!.path;
      const currentA = await bridge.getSession();
      const unit = await bridge.createUnit!({
        projectId: currentA.project!.projectId,
        projectPath: currentA.project!.path,
        generation: currentA.generation,
        operationId: 'cancel-focus-create-unit',
        title: 'Cancel focus unit',
      });
      if (!unit.ok) throw new Error(unit.error.message);
      const createdB = await bridge.createProject({ parentPath: parentBPath, title: 'Cancel focus B', operationId: 'cancel-focus-create-b' });
      if (!createdB.ok) throw new Error(createdB.error.message);
      const pathB = createdB.snapshot.project!.path;
      const reopenedA = await bridge.openProject({ path: pathA, operationId: 'cancel-focus-reopen-a', discardUnsaved: true });
      if (!reopenedA.ok) throw new Error(reopenedA.error.message);
      return { pathA, pathB };
    }, { parentAPath: parentA, parentBPath: parentB });
    await electronApp.evaluate(({ dialog }, targetPath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [targetPath] });
    }, projects.pathB);
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Cancel focus unit' });
    await editor.fill('Before cancelling the project switch');
    await openWritingStudioRail(writing, 'project tools');
    await writing.getByRole('button', { name: 'Open project…' }).click();
    const switchDialog = writing.getByRole('dialog', { name: 'Unsaved manuscript changes' });
    await expect(switchDialog).toBeVisible();
    await switchDialog.getByRole('button', { name: 'Continue editing' }).click();
    await expect(writing.getByRole('alert')).toHaveText(/Project switch cancelled/);
    await expect.poll(() => writing.evaluate(() => ({
      hasFocus: document.hasFocus(),
      activeLabel: document.activeElement?.getAttribute('aria-label') ?? null,
    }))).toEqual({ hasFocus: true, activeLabel: 'Manuscript editor: Cancel focus unit' });
    await writing.keyboard.type(' and this must work immediately');
    await expect(editor).toContainText('and this must work immediately');

    await electronApp.evaluate(({ dialog }, targetPath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [targetPath] });
    }, projects.pathB);
    await writing.getByRole('button', { name: 'Open project…' }).click();
    await writing.getByRole('dialog', { name: 'Unsaved manuscript changes' })
      .getByRole('button', { name: 'Discard changes' })
      .click();
    await expect(writing.getByRole('heading', { name: 'Cancel focus B' })).toBeVisible();

    const reopened = await writing.evaluate(async (targetPath) => {
      return window.projectSpine!.openProject({
        path: targetPath,
        operationId: 'cancel-focus-direct-reopen-a',
        discardUnsaved: false,
      });
    }, projects.pathA);
    if (!reopened.ok) throw new Error(reopened.error.message);
    await expect(writing.getByRole('heading', { name: 'Cancel focus A' })).toBeVisible();
    await expect(writing.getByText('Editing is blocked')).toHaveCount(0);
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Cancel focus unit' })).toBeEditable();
  } finally {
    await removeTemporaryDirectory(parentA);
    await removeTemporaryDirectory(parentB);
  }
});

test('switching back to a saved project does not create a recovery editing lock', async ({ electronApp, page }) => {
  const parentA = await mkdtemp(join(tmpdir(), 'black-skies-stage19-round-trip-a-'));
  const parentB = await mkdtemp(join(tmpdir(), 'black-skies-stage19-round-trip-b-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const projects = await writing.evaluate(async ({ parentAPath, parentBPath }) => {
      const bridge = window.projectSpine!;
      const createdA = await bridge.createProject({ parentPath: parentAPath, title: 'Round trip A', operationId: 'round-trip-create-a' });
      if (!createdA.ok) throw new Error(createdA.error.message);
      const pathA = createdA.snapshot.project!.path;
      const currentA = await bridge.getSession();
      const unit = await bridge.createUnit!({
        projectId: currentA.project!.projectId,
        projectPath: currentA.project!.path,
        generation: currentA.generation,
        operationId: 'round-trip-create-unit',
        title: 'Round trip unit',
      });
      if (!unit.ok) throw new Error(unit.error.message);
      const createdB = await bridge.createProject({ parentPath: parentBPath, title: 'Round trip B', operationId: 'round-trip-create-b' });
      if (!createdB.ok) throw new Error(createdB.error.message);
      const reopenedA = await bridge.openProject({ path: pathA, operationId: 'round-trip-reopen-a', discardUnsaved: true });
      if (!reopenedA.ok) throw new Error(reopenedA.error.message);
      return { pathA, pathB: createdB.snapshot.project!.path };
    }, { parentAPath: parentA, parentBPath: parentB });
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Round trip unit' });
    await editor.fill('Saved round-trip prose');
    await writing.keyboard.press('Control+S');
    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();

    await electronApp.evaluate(({ dialog }, targetPath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [targetPath] });
    }, projects.pathA);
    await openWritingStudioRail(writing, 'project tools');
    await writing.getByRole('button', { name: 'Open project…' }).click();
    await expect(writing.getByRole('heading', { name: 'Round trip A' })).toBeVisible();
    await expect(writing.getByText('Editing is blocked')).toHaveCount(0);
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Round trip unit' })).toBeEditable();
  } finally {
    await removeTemporaryDirectory(parentA);
    await removeTemporaryDirectory(parentB);
  }
});

test.describe('C1 unsaved close flow', () => {
  test.use({ skipPageCloseTeardown: true, skipFailureScreenshotAfterVerifiedExit: true });

  test('unsaved close keeps editing without beginning shutdown', async ({ electronApp, page }) => {
    const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-keep-e2e-'));
    try {
      const { writing, command } = await getStage19Windows(electronApp, page);
      const electronProcess = electronApp.process();
      if (!electronProcess) throw new Error('Electron child process was unavailable before the close request.');
      await writing.evaluate(async (parentPath) => {
        const bridge = window.projectSpine!;
        const created = await bridge.createProject({ parentPath, title: 'Keep project', operationId: 'keep-create' });
        if (!created.ok) throw new Error(created.error.message);
        const current = await bridge.getSession();
        const unit = await bridge.createUnit!({
          projectId: current.project!.projectId,
          projectPath: current.project!.path,
          generation: current.generation,
          operationId: 'keep-unit',
          title: 'Keep unit',
        });
        if (!unit.ok) throw new Error(unit.error.message);
      }, parent);
      const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Keep unit' });
      await editor.pressSequentially('Keep this unsaved prose');
      await expect(editor).toHaveText('Keep this unsaved prose');
      await writing.keyboard.press('Control+Z');
      await expect(editor).not.toContainText('Keep this unsaved prose');
      await expect(editor).toContainText('Start writing…');
      await writing.keyboard.press('Control+Y');
      await expect(editor).toHaveText('Keep this unsaved prose');
      await writing.evaluate(async () => {
        const bridge = window.projectSpine!;
        const current = await bridge.getSession();
        const unit = await bridge.createUnit!({
          projectId: current.project!.projectId,
          projectPath: current.project!.path,
          generation: current.generation,
          operationId: 'keep-undo-boundary-unit',
          title: 'Undo boundary',
        });
        if (!unit.ok) throw new Error(unit.error.message);
      });
      const boundaryEditor = writing.getByRole('textbox', {
        name: 'Manuscript editor: Undo boundary',
      });
      await expect(boundaryEditor).toContainText('Start writing…');
      await writing.keyboard.press('Control+Z');
      await expect(boundaryEditor).toContainText('Start writing…');
      await openWritingStudioRail(writing, 'story tools');
      await writing.getByRole('button', { name: /Keep unit/ }).click();
      await expect(editor).toHaveText('Keep this unsaved prose');
      await expect(writing.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();
      await expect(command.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();
      await expect(writing.getByRole('button', { name: 'Keep unit Unsaved' })).toBeVisible();

      const beforeUnload = observeElectronBeforeUnload(writing);
      await requestWritingStudioClose(electronApp);
      const dialog = writing.getByRole('dialog', { name: 'Unsaved manuscript changes' });
      await expect(dialog).toBeVisible();
      await expect(writing.getByRole('button', { name: 'Keep editing' })).toBeFocused();
      await expect(command.getByRole('dialog')).toHaveCount(0);
      await writing.getByRole('button', { name: 'Keep editing' }).click();
      beforeUnload.stop();

      await expect(dialog).toHaveCount(0);
      expect(beforeUnload.observedTypes).toEqual(['beforeunload']);
      expect(beforeUnload.unexpectedTypes).toEqual([]);
      await expect
        .poll(() =>
          writing.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? null),
        )
        .toBe('Manuscript editor: Keep unit');
      await writing.keyboard.type(' immediately editable');
      await expect(editor).toContainText('Keep this unsaved prose');
      await expect(editor).toContainText('immediately editable');
      await expect(writing.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();
      await expect(command.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();
      expect(electronApp.windows()).toHaveLength(2);
      expect(electronProcess.exitCode).toBeNull();
      expect(electronProcess.signalCode).toBeNull();

      await writing.keyboard.press('Control+S');
      await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
      const cleanExit = waitForCleanElectronApplicationExit(electronApp);
      await requestWritingStudioClose(electronApp);
      await expect.poll(() => electronApp.windows().length).toBe(0);
      expect(await cleanExit).toEqual({ code: 0, signal: null });
      markElectronApplicationExitedCleanly(electronApp);
    } finally {
      await removeTemporaryDirectory(parent);
    }
  });

  test('dirty close discards and exits cleanly', async ({ electronApp, page }) => {
    const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-discard-only-e2e-'));
    try {
      const { writing, command } = await getStage19Windows(electronApp, page);
      const electronProcess = electronApp.process();
      if (!electronProcess) throw new Error('Electron child process was unavailable before shutdown.');

      await writing.evaluate(async (parentPath) => {
        const bridge = window.projectSpine!;
        const created = await bridge.createProject({ parentPath, title: 'Discard-only project', operationId: 'discard-only-create' });
        if (!created.ok) throw new Error(created.error.message);
        const current = await bridge.getSession();
        const unit = await bridge.createUnit!({
          projectId: current.project!.projectId, projectPath: current.project!.path,
          generation: current.generation, operationId: 'discard-only-unit', title: 'Discard-only unit',
        });
        if (!unit.ok) throw new Error(unit.error.message);
      }, parent);
      const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Discard-only unit' });
      await editor.pressSequentially('Discard-only unsaved prose');
      await expect(editor).toHaveText('Discard-only unsaved prose');
      await expect(writing.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();
      await openWritingStudioRail(writing, 'story tools');
      await expect(writing.getByRole('button', { name: 'Discard-only unit Unsaved' })).toBeVisible();
      await expect(command.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();

      const beforeUnload = observeElectronBeforeUnload(writing);
      await requestWritingStudioClose(electronApp);
      const dialog = writing.getByRole('dialog', { name: 'Unsaved manuscript changes' });
      await expect(dialog).toBeVisible();
      await expect(command.getByRole('dialog')).toHaveCount(0);
      const cleanExit = waitForCleanElectronApplicationExit(electronApp);
      await writing.getByRole('button', { name: 'Discard changes' }).click();
      await expect.poll(() => electronApp.windows().length).toBe(0);
      const exit = await cleanExit;
      expect(exit).toEqual({ code: 0, signal: null });
      beforeUnload.stop();
      expect(beforeUnload.observedTypes).toEqual(['beforeunload', 'beforeunload']);
      expect(beforeUnload.unexpectedTypes).toEqual([]);
      markElectronApplicationExitedCleanly(electronApp);
    } finally {
      await removeTemporaryDirectory(parent);
    }
  });
});

test('saved project closes, relaunches, and restores durable manuscript state', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-c2-'));
  let relaunched: LaunchedStage19Application | null = null;
  let relaunchedExitedCleanly = false;
  try {
    const { writing, command } = await getStage19Windows(electronApp, page);
    const project = await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({ parentPath, title: 'C2 Durable Orbit', operationId: 'c2-create' });
      if (!created.ok) throw new Error(created.error.message);
      const session = await bridge.getSession();
      for (const title of ['Opening Signal', 'Broken Relay', 'Last Orbit']) {
        const unit = await bridge.createUnit!({ projectId: session.project!.projectId, projectPath: session.project!.path, generation: session.generation, operationId: `c2-${title}`, title });
        if (!unit.ok) throw new Error(unit.error.message);
      }
      return { id: session.project!.projectId, path: session.project!.path };
    }, parent);
    const expected = [
      ['Opening Signal', 'OPENING::signal'],
      ['Broken Relay', 'RELAY::broken'],
      ['Last Orbit', 'ORBIT::last'],
    ] as const;
    await openWritingStudioRail(writing, 'story tools');
    for (const [title, prose] of expected) {
      const unitButton = writing.getByRole('button', { name: new RegExp(title) });
      await expect(unitButton).toBeEnabled();
      await unitButton.click();
      const editor = writing.getByRole('textbox', { name: `Manuscript editor: ${title}` });
      await editor.pressSequentially(prose);
      await writing.keyboard.press('Control+S');
      await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    }
    await expect(command.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await expect(writing.getByRole('dialog')).toHaveCount(0);
    const firstExit = waitForCleanElectronApplicationExit(electronApp);
    await requestWritingStudioClose(electronApp);
    await expect.poll(() => electronApp.windows().length).toBe(0);
    expect(await firstExit).toEqual({ code: 0, signal: null });
    markElectronApplicationExitedCleanly(electronApp);

    relaunched = await launchStage19BuiltApplication('black-skies-stage19-c2-');
    const { writing: reWriting, command: reCommand } = await getStage19Windows(relaunched.application);
    const reopened = await reWriting.evaluate(async (projectPath) => {
      const result = await window.projectSpine!.openProject({ path: projectPath, operationId: 'c2-reopen' });
      if (!result.ok) throw new Error(result.error.message);
      return result.snapshot;
    }, project.path);
    expect(reopened).toMatchObject({ project: { projectId: project.id }, dirtyUnitIds: [], saveState: { status: 'clean' } });
    expect(reopened.project?.units.map(({ title, order }) => ({ title, order }))).toEqual([
      { title: 'Opening Signal', order: 1 },
      { title: 'Broken Relay', order: 2 },
      { title: 'Last Orbit', order: 3 },
    ]);
    await openWritingStudioRail(reWriting, 'story tools');
    for (const [title, prose] of expected) {
      const unitButton = reWriting.getByRole('button', { name: new RegExp(title) });
      await expect(unitButton).toBeEnabled();
      await unitButton.click();
      await expect(reWriting.getByRole('textbox', { name: `Manuscript editor: ${title}` })).toHaveText(prose);
      await expect(reWriting.getByRole('button', { name: new RegExp(`${title} Unsaved`) })).toHaveCount(0);
    }
    await expect(reWriting.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await expect(reCommand.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    const secondExit = waitForCleanElectronApplicationExit(relaunched.application);
    await requestWritingStudioClose(relaunched.application);
    await expect.poll(() => relaunched?.application.windows().length ?? 0).toBe(0);
    expect(await secondExit).toEqual({ code: 0, signal: null });
    relaunchedExitedCleanly = true;
  } finally {
    if (relaunched && !relaunchedExitedCleanly) await closeLaunchedApplicationBestEffort(relaunched);
    else if (relaunched) {
      await removeTemporaryDirectory(relaunched.userDataDirectory);
      await removeTemporaryDirectory(relaunched.runtimeDirectory);
    }
    await removeTemporaryDirectory(parent);
  }
});
// HARNESS_ONLY
// Reason: Exercises synthetic Stage 19 Electron state before installed-build qualification.
// Owner: Package 19.22 internal baseline verification.
// Retire when: An installed-build project-spine truth lane provides equivalent deterministic coverage.
