import { mkdtemp, rm } from 'node:fs/promises';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { expect, markElectronApplicationExitedCleanly, test } from './_electron.fixture';

// This test uses only synthetic temporary directories. It drives the production
// preload bridge directly because native directory pickers are OS-owned.
test.use({ splitCommandRuntimeConfig: true });

async function requestWritingStudioClose(electronApp: ElectronApplication): Promise<void> {
  await electronApp.evaluate(async ({ BrowserWindow }) => {
    const candidates = await Promise.all(
      BrowserWindow.getAllWindows()
        .filter((window) => !window.isDestroyed())
        .map(async (window) => ({
          window,
          role: await window.webContents.executeJavaScript(
            "document.querySelector('[data-stage19-role=\"writing\"]') ? 'writing' : document.querySelector('[data-stage19-role=\"command\"]') ? 'command' : 'unknown'",
          ),
        })),
    );
    const writingWindows = candidates.filter((candidate) => candidate.role === 'writing');
    const commandWindows = candidates.filter((candidate) => candidate.role === 'command');
    if (writingWindows.length !== 1) {
      throw new Error(`Expected exactly one Writing Studio BrowserWindow; found ${writingWindows.length}.`);
    }
    if (commandWindows.length !== 1 || commandWindows[0].window.id === writingWindows[0].window.id) {
      throw new Error(`Expected exactly one distinct Command Center BrowserWindow; found ${commandWindows.length}.`);
    }
    writingWindows[0].window.close();
  });
}

type ElectronProcess = NonNullable<ReturnType<ElectronApplication['process']>>;

async function getStage19Windows(
  electronApp: ElectronApplication,
  fixturePage?: Page,
): Promise<{ writing: Page; command: Page }> {
  await expect.poll(async () => {
    const roles = await Promise.all(electronApp.windows().map(async (candidate) => ({
      writing: await candidate.locator('[data-stage19-role="writing"]').count(),
      command: await candidate.locator('[data-stage19-role="command"]').count(),
    })));
    return roles.filter((role) => role.writing > 0).length === 1 &&
      roles.filter((role) => role.command > 0).length === 1;
  }, { timeout: 30_000 }).toBe(true);

  const candidates = fixturePage
    ? [fixturePage, ...electronApp.windows().filter((candidate) => candidate !== fixturePage)]
    : electronApp.windows();
  const identified = await Promise.all(candidates.map(async (candidate) => ({
    candidate,
    writing: await candidate.locator('[data-stage19-role="writing"]').count(),
    command: await candidate.locator('[data-stage19-role="command"]').count(),
  })));
  const writing = identified.find((entry) => entry.writing > 0)?.candidate;
  const command = identified.find((entry) => entry.command > 0)?.candidate;
  if (!writing || !command || writing === command) {
    throw new Error('Stage 19 did not expose one distinct Writing Studio and Command Center.');
  }
  return { writing, command };
}

async function removeTemporaryDirectory(directory: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await rm(directory, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      const code = (error as NodeJS.ErrnoException).code;
      if (!['EBUSY', 'EPERM', 'ENOTEMPTY'].includes(code ?? '') || attempt === 3) {
        throw error;
      }
      console.warn('[stage19.cleanup] temporary directory remained busy; retrying', {
        directory,
        attempt,
        code,
      });
      await new Promise((resolve) => setTimeout(resolve, attempt * 100));
    }
  }
  throw lastError;
}

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

function waitForCleanElectronExit(
  electronProcess: ElectronProcess | undefined,
  timeoutMs = 15_000,
): Promise<{ code: number; signal: null }> {
  if (!electronProcess) {
    return Promise.reject(new Error('Electron child process was unavailable before shutdown.'));
  }
  const completedExit = (): { code: number; signal: null } | null => {
    if (electronProcess.signalCode) {
      throw new Error(`Electron exited by signal ${electronProcess.signalCode}, not a clean exit.`);
    }
    return typeof electronProcess.exitCode === 'number'
      ? { code: electronProcess.exitCode, signal: null }
      : null;
  };
  try {
    const exit = completedExit();
    if (exit) return Promise.resolve(exit);
  } catch (error) {
    return Promise.reject(error);
  }
  return new Promise((resolve, reject) => {
    let timeoutHandle: NodeJS.Timeout | null = null;
    const cleanup = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      electronProcess.off('exit', onExit);
      electronProcess.off('error', onError);
    };
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup();
      if (signal || code === null) {
        reject(new Error(`Electron exited by signal ${signal ?? 'unknown'}, not a clean exit.`));
        return;
      }
      resolve({ code, signal: null });
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    electronProcess.once('exit', onExit);
    electronProcess.once('error', onError);
    try {
      const exit = completedExit();
      if (exit) {
        cleanup();
        resolve(exit);
        return;
      }
    } catch (error) {
      cleanup();
      reject(error);
      return;
    }
    timeoutHandle = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out after ${timeoutMs}ms waiting for Electron to exit.`));
    }, timeoutMs);
    timeoutHandle.unref?.();
  });
}

test('Stage 19 dedicated windows reach stable startup', async ({ electronApp, page }) => {
  await expect(page.locator('[data-stage19-role="writing"]')).toBeVisible();
  await expect.poll(async () =>
    (await Promise.all(electronApp.windows().map((candidate) =>
      candidate.locator('[data-stage19-role="command"]').count(),
    ))).some((count) => count > 0),
  { timeout: 30_000 }).toBe(true);
  await expect.poll(() => electronApp.process()?.exitCode ?? null, { timeout: 2_000 }).toBeNull();
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
      await expect(editor).toHaveText('Keep this unsaved prose');
      await expect(writing.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();
      await expect(command.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();
      expect(electronApp.windows()).toHaveLength(2);
      expect(electronProcess.exitCode).toBeNull();
      expect(electronProcess.signalCode).toBeNull();

      await writing.keyboard.press('Control+S');
      await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
      const cleanExit = waitForCleanElectronExit(electronProcess);
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
      await expect(writing.getByRole('button', { name: 'Discard-only unit Unsaved' })).toBeVisible();
      await expect(command.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();

      const beforeUnload = observeElectronBeforeUnload(writing);
      await requestWritingStudioClose(electronApp);
      const dialog = writing.getByRole('dialog', { name: 'Unsaved manuscript changes' });
      await expect(dialog).toBeVisible();
      await expect(command.getByRole('dialog')).toHaveCount(0);
      const cleanExit = waitForCleanElectronExit(electronProcess);
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
  const relaunchUserData = await mkdtemp(join(tmpdir(), 'black-skies-stage19-c2-userdata-'));
  const relaunchRuntime = await mkdtemp(join(tmpdir(), 'black-skies-stage19-c2-runtime-'));
  let relaunched: Awaited<ReturnType<typeof electron.launch>> | null = null;
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
    for (const [title, prose] of expected) {
      await writing.getByRole('button', { name: new RegExp(title) }).click();
      const editor = writing.getByRole('textbox', { name: `Manuscript editor: ${title}` });
      await editor.pressSequentially(prose);
      await writing.keyboard.press('Control+S');
      await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    }
    await expect(command.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await expect(writing.getByRole('dialog')).toHaveCount(0);
    const firstProcess = electronApp.process();
    const firstExit = waitForCleanElectronExit(firstProcess);
    await requestWritingStudioClose(electronApp);
    await expect.poll(() => electronApp.windows().length).toBe(0);
    expect(await firstExit).toEqual({ code: 0, signal: null });
    markElectronApplicationExitedCleanly(electronApp);

    const appDir = resolve(process.cwd());
    const runtimeConfigPath = join(relaunchRuntime, 'runtime.yaml');
    fs.writeFileSync(runtimeConfigPath, 'ui:\n  enable_docking: false\n  experimental_split_command_workspace: true\n', 'utf8');
    relaunched = await electron.launch({ args: [`--user-data-dir=${relaunchUserData}`, resolve(appDir, 'dist-electron', 'main', 'main.js')], env: { ...process.env, PLAYWRIGHT: '1', BLACKSKIES_CONFIG_PATH: runtimeConfigPath, ELECTRON_RENDERER_URL: pathToFileURL(resolve(appDir, 'dist', 'index.html')).toString() } });
    const { writing: reWriting, command: reCommand } = await getStage19Windows(relaunched);
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
    for (const [title, prose] of expected) {
      await reWriting.getByRole('button', { name: new RegExp(title) }).click();
      await expect(reWriting.getByRole('textbox', { name: `Manuscript editor: ${title}` })).toHaveText(prose);
      await expect(reWriting.getByRole('button', { name: new RegExp(`${title} Unsaved`) })).toHaveCount(0);
    }
    await expect(reWriting.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await expect(reCommand.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    const secondProcess = relaunched.process();
    const secondExit = waitForCleanElectronExit(secondProcess);
    await requestWritingStudioClose(relaunched);
    await expect.poll(() => relaunched?.windows().length ?? 0).toBe(0);
    expect(await secondExit).toEqual({ code: 0, signal: null });
    relaunchedExitedCleanly = true;
  } finally {
    if (relaunched && !relaunchedExitedCleanly) await relaunched.close().catch(() => undefined);
    await removeTemporaryDirectory(parent);
    await removeTemporaryDirectory(relaunchUserData);
    await removeTemporaryDirectory(relaunchRuntime);
  }
});
