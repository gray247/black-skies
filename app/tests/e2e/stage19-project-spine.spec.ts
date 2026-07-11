import { mkdtemp, rm } from 'node:fs/promises';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { _electron as electron } from '@playwright/test';
import { expect, test } from './_electron.fixture';

// This test uses only synthetic temporary directories. It drives the production
// preload bridge directly because native directory pickers are OS-owned.
test.use({ splitCommandRuntimeConfig: true });

test('keeps lifecycle, dirty truth, and durable units synchronized across both Stage 19 windows', async ({
  electronApp,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-e2e-'));
  const relaunchUserData = await mkdtemp(join(tmpdir(), 'black-skies-stage19-relaunch-userdata-'));
  const relaunchRuntime = await mkdtemp(join(tmpdir(), 'black-skies-stage19-relaunch-runtime-'));
  let relaunched: Awaited<ReturnType<typeof electron.launch>> | null = null;
  try {
    await expect.poll(() => electronApp.windows().length).toBe(2);
    const windows = electronApp.windows();
    const writing = (await Promise.all(
      windows.map(async (candidate) =>
        (await candidate.locator('[data-stage19-role="writing"]').count()) > 0 ? candidate : null,
      ),
    )).find(Boolean);
    const command = (await Promise.all(
      windows.map(async (candidate) =>
        (await candidate.locator('[data-stage19-role="command"]').count()) > 0 ? candidate : null,
      ),
    )).find(Boolean);
    if (!writing || !command) throw new Error('Stage 19 did not expose both dedicated window roles.');

    const projectA = await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'Stage 19 Project A',
        operationId: 'e2e-create-a',
      });
      if (!created.ok) throw new Error(created.error.message);
      const current = await bridge.getSession();
      const binding = {
        projectId: current.project!.projectId,
        projectPath: current.project!.path,
        generation: current.generation,
        operationId: 'e2e-create-a-unit',
      };
      const unit = await bridge.createUnit!({ ...binding, title: 'A unit' });
      if (!unit.ok) throw new Error(unit.error.message);
      return { path: current.project!.path, id: current.project!.projectId };
    }, parent);

    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: A unit' });
    await expect(editor).toBeVisible();
    await editor.pressSequentially('Project A prose');
    await expect(writing.getByRole('status', { name: '1 unsaved unit' })).toBeVisible();
    await expect(command.getByRole('status', { name: '1 unsaved unit' })).toBeVisible();
    await writing.keyboard.press('Control+S');
    await expect(writing.getByRole('status', { name: 'Saved durably' })).toBeVisible();
    await expect(command.getByRole('status', { name: 'Saved durably' })).toBeVisible();

    const projectB = await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'Stage 19 Project B',
        operationId: 'e2e-create-b',
      });
      if (!created.ok) throw new Error(created.error.message);
      const current = await bridge.getSession();
      const binding = {
        projectId: current.project!.projectId,
        projectPath: current.project!.path,
        generation: current.generation,
        operationId: 'e2e-create-b-unit',
      };
      const unit = await bridge.createUnit!({ ...binding, title: 'B unit' });
      if (!unit.ok) throw new Error(unit.error.message);
      return { path: current.project!.path, id: current.project!.projectId };
    }, parent);

    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: B unit' })).toBeVisible();
    await writing.getByRole('textbox', { name: 'Manuscript editor: B unit' }).pressSequentially('Project B prose');
    await writing.keyboard.press('Control+S');
    await expect(writing.getByRole('status', { name: 'Saved durably' })).toBeVisible();

    await writing.evaluate(async ({ projectAPath, projectBPath }) => {
      const bridge = window.projectSpine!;
      const open = async (path: string, operationId: string, discardUnsaved = false) => {
        const result = await bridge.openProject({ path, operationId, discardUnsaved });
        if (!result.ok) throw new Error(result.error.message);
      };
      await open(projectAPath, 'e2e-open-a');
      await open(projectBPath, 'e2e-open-b');
      await open(projectAPath, 'e2e-open-a-again');
    }, { projectAPath: projectA.path, projectBPath: projectB.path });
    await expect(writing.getByText('Stage 19 Project A')).toBeVisible();
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: A unit' })).toContainText('Project A prose');

    await writing.getByRole('textbox', { name: 'Manuscript editor: A unit' }).pressSequentially(' unsaved');
    const switchResult = await writing.evaluate(async (projectBPath) =>
      window.projectSpine!.openProject({ path: projectBPath, operationId: 'e2e-cancel-switch' }),
    projectB.path);
    expect(switchResult).toMatchObject({ ok: false, error: { code: 'UNSAVED_CHANGES' } });
    await expect(writing.getByText('Stage 19 Project A')).toBeVisible();

    await writing.evaluate(async (projectBPath) => {
      const result = await window.projectSpine!.openProject({
        path: projectBPath,
        operationId: 'e2e-discard-switch',
        discardUnsaved: true,
      });
      if (!result.ok) throw new Error(result.error.message);
    }, projectB.path);
    await expect(writing.getByText('Stage 19 Project B')).toBeVisible();
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: B unit' })).toContainText('Project B prose');

    await electronApp.close();
    await expect.poll(() => electronApp.process()?.exitCode ?? null).not.toBeNull();

    const appDir = resolve(process.cwd());
    const runtimeConfigPath = join(relaunchRuntime, 'runtime.yaml');
    fs.writeFileSync(
      runtimeConfigPath,
      'ui:\n  enable_docking: false\n  experimental_split_command_workspace: true\n',
      'utf8',
    );
    relaunched = await electron.launch({
      args: [
        `--user-data-dir=${relaunchUserData}`,
        resolve(appDir, 'dist-electron', 'main', 'main.js'),
      ],
      env: {
        ...process.env,
        PLAYWRIGHT: '1',
        BLACKSKIES_CONFIG_PATH: runtimeConfigPath,
        ELECTRON_RENDERER_URL: pathToFileURL(resolve(appDir, 'dist', 'index.html')).toString(),
      },
    });
    const reloadedWriting = await relaunched.firstWindow();
    await expect.poll(() => relaunched?.windows().length ?? 0).toBe(2);
    const reopened = await reloadedWriting.evaluate(async (projectPath) => {
      const result = await window.projectSpine!.openProject({
        path: projectPath,
        operationId: 'e2e-relaunch-open-b',
      });
      if (!result.ok) throw new Error(result.error.message);
      return result.snapshot;
    }, projectB.path);
    expect(reopened).toMatchObject({
      project: { projectId: projectB.id, title: 'Stage 19 Project B' },
      dirtyUnitIds: [],
      saveState: { status: 'clean' },
    });
    await expect(reloadedWriting.getByRole('textbox', { name: 'Manuscript editor: B unit' })).toContainText('Project B prose');
    await expect(reloadedWriting.getByRole('status', { name: 'Saved durably' })).toBeVisible();
  } finally {
    if (relaunched) {
      await relaunched.close().catch(() => undefined);
    }
    await rm(parent, { recursive: true, force: true });
    await rm(relaunchUserData, { recursive: true, force: true });
    await rm(relaunchRuntime, { recursive: true, force: true });
  }
});
