import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, markElectronApplicationExitedCleanly, test } from './_electron.fixture';
import {
  closeLaunchedApplicationBestEffort,
  getStage19Windows,
  launchStage19BuiltApplication,
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

test('P4 Companion orientation is temporary, local, and absent after project reopen', async ({
  electronApp,
  page,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-p4-companion-'));
  let relaunched: Awaited<ReturnType<typeof launchStage19BuiltApplication>> | null = null;
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const created = await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const project = await bridge.createProject({
        parentPath,
        title: 'Companion Boundary Project',
        operationId: 'p4-companion-create-project',
      });
      if (!project.ok) throw new Error(project.error.message);
      const unit = await bridge.createUnit!({
        projectId: project.snapshot.project!.projectId,
        projectPath: project.snapshot.project!.path,
        generation: project.snapshot.generation,
        operationId: 'p4-companion-create-unit',
        title: 'Orientation Passage',
      });
      if (!unit.ok) throw new Error(unit.error.message);
      return {
        projectId: unit.snapshot.project!.projectId,
        projectPath: unit.snapshot.project!.path,
        unitId: unit.data.unitId,
      };
    }, parent);

    const protectedBefore = await Promise.all([
      readFile(join(created.projectPath, 'project.json'), 'utf8'),
      readFile(join(created.projectPath, 'drafts', `${created.unitId}.md`), 'utf8'),
    ]);

    await openWritingStudioRail(writing, 'session tools');
    const prompt = writing.getByRole('textbox', { name: 'Ask Black Skies' });
    await prompt.fill('Where am I?');
    await prompt.press('Enter');

    const result = writing.getByRole('region', { name: 'Companion orientation result' });
    await expect(result).toBeVisible();
    await expect(result).toContainText('Companion Boundary Project');
    await expect(result).toContainText('Orientation Passage · unit 1 of 1');
    await expect(result).toContainText('It did not read manuscript prose, call AI, create memory');
    await expect.poll(() => electronApp.windows().length).toBe(1);
    expect(await Promise.all([
      readFile(join(created.projectPath, 'project.json'), 'utf8'),
      readFile(join(created.projectPath, 'drafts', `${created.unitId}.md`), 'utf8'),
    ])).toEqual(protectedBefore);
    expect((await readdir(created.projectPath)).some((name) => /companion/i.test(name))).toBe(false);

    await writing.getByRole('button', { name: 'Return to Writing', exact: true }).click();
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Orientation Passage' }))
      .toBeFocused();

    const firstExit = waitForCleanElectronApplicationExit(electronApp);
    await requestWritingStudioClose(electronApp);
    expect(await firstExit).toEqual({ code: 0, signal: null });
    markElectronApplicationExitedCleanly(electronApp);

    relaunched = await launchStage19BuiltApplication('black-skies-p4-companion-reopen-');
    const reopened = await getStage19Windows(relaunched.application);
    await reopened.writing.evaluate(async (projectPath) => {
      const opened = await window.projectSpine!.openProject({
        path: projectPath,
        operationId: 'p4-companion-reopen-project',
      });
      if (!opened.ok) throw new Error(opened.error.message);
    }, created.projectPath);
    await expect(reopened.writing.getByRole('heading', { name: 'Companion Boundary Project' }))
      .toBeVisible();
    await expect(reopened.writing.getByRole('region', { name: 'Companion orientation result' }))
      .toHaveCount(0);
    await expect(reopened.command.getByRole('region', { name: 'Companion orientation result' }))
      .toHaveCount(0);
    await openWritingStudioRail(reopened.writing, 'session tools');
    await expect(reopened.writing.getByRole('textbox', { name: 'Ask Black Skies' })).toHaveValue('');
    expect(await Promise.all([
      readFile(join(created.projectPath, 'project.json'), 'utf8'),
      readFile(join(created.projectPath, 'drafts', `${created.unitId}.md`), 'utf8'),
    ])).toEqual(protectedBefore);

    const secondExit = waitForCleanElectronApplicationExit(relaunched.application);
    await requestWritingStudioClose(relaunched.application);
    expect(await secondExit).toEqual({ code: 0, signal: null });
    await removeTemporaryDirectory(relaunched.userDataDirectory);
    await removeTemporaryDirectory(relaunched.runtimeDirectory);
    relaunched = null;
  } finally {
    await closeLaunchedApplicationBestEffort(relaunched);
    await removeTemporaryDirectory(parent);
  }
});

// HARNESS_ONLY
// Reason: Proves the built-Electron first Companion route remains local,
// temporary, non-mutating, and absent after a genuine project reopen.
// Owner: Program 4 P4-C automated qualification.
// Retire when: Human Gate 2 installed-product evidence supersedes this route proof.
