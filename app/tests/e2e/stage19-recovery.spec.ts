import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { ElectronApplication, Page } from '@playwright/test';
import { expect, markElectronApplicationExitedCleanly, test } from './_electron.fixture';
import {
  closeLaunchedApplicationBestEffort,
  getStage19Windows,
  launchStage19BuiltApplication,
  openWritingStudioRail,
  readDurableDraftByTitle,
  readRecoveryArtifact,
  recoveryArtifactPath,
  removeTemporaryDirectory,
  requestWritingStudioClose,
  terminateElectronApplicationAbruptly,
  waitForCleanElectronApplicationExit,
  waitForRecoveryArtifactRemoval,
  waitForRecoveryCandidates,
  type LaunchedStage19Application,
} from './stage19-electron-support';

test.use({
  splitCommandRuntimeConfig: true,
  skipPageCloseTeardown: true,
  skipFailureScreenshotAfterVerifiedExit: true,
});

interface CreatedProject {
  readonly id: string;
  readonly path: string;
}

function operationId(label: string): string {
  return `${label}-${randomUUID()}`;
}

async function createProjectWithUnits(
  writing: Page,
  parentPath: string,
  projectTitle: string,
  unitTitles: readonly string[],
): Promise<CreatedProject> {
  return writing.evaluate(async ({ parentPath, projectTitle, unitTitles, operationPrefix }) => {
    const bridge = window.projectSpine!;
    const created = await bridge.createProject({
      parentPath,
      title: projectTitle,
      operationId: `${operationPrefix}-project`,
    });
    if (!created.ok) throw new Error(created.error.message);
    let snapshot = created.snapshot;
    for (const [index, title] of unitTitles.entries()) {
      const unit = await bridge.createUnit!({
        projectId: snapshot.project!.projectId,
        projectPath: snapshot.project!.path,
        generation: snapshot.generation,
        operationId: `${operationPrefix}-unit-${index}`,
        title,
      });
      if (!unit.ok) throw new Error(unit.error.message);
      snapshot = unit.snapshot;
    }
    return { id: snapshot.project!.projectId, path: snapshot.project!.path };
  }, { parentPath, projectTitle, unitTitles: [...unitTitles], operationPrefix: operationId('create') });
}

async function openProject(writing: Page, projectPath: string): Promise<void> {
  const snapshot = await writing.evaluate(async ({ projectPath, operation }) => {
    const result = await window.projectSpine!.openProject({ path: projectPath, operationId: operation });
    if (!result.ok) throw new Error(result.error.message);
    return result.snapshot;
  }, { projectPath, operation: operationId('open') });
  expect(snapshot.project?.path.toLocaleLowerCase()).toBe(projectPath.toLocaleLowerCase());
}

function editorFor(writing: Page, title: string) {
  return writing.getByRole('textbox', { name: `Manuscript editor: ${title}` });
}

async function selectUnit(writing: Page, title: string): Promise<void> {
  await openWritingStudioRail(writing, 'story tools');
  await writing.locator('.stage19-story-rail__unit-title', { hasText: title }).click();
  await expect(editorFor(writing, title)).toBeVisible();
}

async function replaceEditorProse(writing: Page, title: string, prose: string): Promise<void> {
  const editor = editorFor(writing, title);
  await editor.fill(prose);
  await expect(editor).toHaveText(prose);
}

async function saveUnit(writing: Page, title: string, prose?: string): Promise<void> {
  await selectUnit(writing, title);
  if (prose !== undefined) await replaceEditorProse(writing, title, prose);
  await writing.getByRole('button', { name: /^Save$/ }).click();
  await expect(writing.locator('.stage19-story-rail__unit-row', { hasText: title }).getByText('Unsaved', { exact: true })).toHaveCount(0);
}

async function closeApplicationCleanly(
  application: ElectronApplication,
  fixtureOwned = false,
): Promise<void> {
  const exitPromise = waitForCleanElectronApplicationExit(application);
  await requestWritingStudioClose(application);
  await expect.poll(() => application.windows().length, { timeout: 15_000 }).toBe(0);
  expect(await exitPromise).toEqual({ code: 0, signal: null });
  if (fixtureOwned) markElectronApplicationExitedCleanly(application);
}

async function expectCommandCenterPassive(command: Page, prohibitedProse: readonly string[]): Promise<void> {
  await expect(command.getByRole('heading', { name: 'Recover unsaved Writing Studio prose' })).toHaveCount(0);
  await expect(command.getByRole('heading', { name: 'Recovery evidence needs attention' })).toHaveCount(0);
  await expect(command.getByRole('button', { name: 'Recover this prose' })).toHaveCount(0);
  await expect(command.getByRole('button', { name: 'Reject and delete candidate' })).toHaveCount(0);
  for (const prose of prohibitedProse) {
    if (prose) await expect(command.getByText(prose, { exact: true })).toHaveCount(0);
  }
  const bridgeShape = await command.evaluate(async () => {
    const session = await window.projectSpine!.getSession();
    return {
      hasRecoveryProjection: Object.prototype.hasOwnProperty.call(session, 'recovery'),
      acceptType: typeof window.projectSpine!.acceptRecoveryCandidate,
      rejectType: typeof window.projectSpine!.rejectRecoveryCandidate,
    };
  });
  expect(bridgeShape).toEqual({
    hasRecoveryProjection: false,
    acceptType: 'undefined',
    rejectType: 'undefined',
  });
}

async function expectRecoveryChoice(
  writing: Page,
  title: string,
  prose: string,
): Promise<void> {
  await expect(writing.getByRole('heading', { name: 'Recover unsaved Writing Studio prose' })).toBeVisible();
  await expect(writing.getByRole('heading', { name: title, level: 3 })).toBeVisible();
  await expect(writing.getByLabel(`Recovered prose for ${title}`)).toHaveText(prose || '(Empty manuscript prose)');
  await openWritingStudioRail(writing, 'story tools');
  const addMenu = writing.locator('#stage19-story-rail-add-menu');
  const writingSectionChoice = addMenu.locator('button').filter({ hasText: 'Writing section' });
  await expect(writingSectionChoice).toHaveCount(1);
  await expect(writingSectionChoice).toBeDisabled();
}

async function cleanupLaunches(launches: LaunchedStage19Application[]): Promise<void> {
  for (const launched of [...launches].reverse()) {
    await closeLaunchedApplicationBestEffort(launched);
  }
}

test('accepts two interrupted candidates, guards them, saves, and reopens cleanly', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-recovery-accept-'));
  const launches: LaunchedStage19Application[] = [];
  const alpha = { title: 'Recovery Alpha', baseline: 'BASELINE-A::durable', recovered: 'UNSAVED-A::checkpoint' };
  const beta = { title: 'Recovery Beta', baseline: 'BASELINE-B::durable', recovered: 'UNSAVED-B::checkpoint' };
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const project = await createProjectWithUnits(writing, parent, 'P19.12 Accept', [alpha.title, beta.title]);
    await saveUnit(writing, alpha.title, alpha.baseline);
    await saveUnit(writing, beta.title, beta.baseline);
    const durableAlpha = await readDurableDraftByTitle(project.path, alpha.title);
    const durableBeta = await readDurableDraftByTitle(project.path, beta.title);

    await selectUnit(writing, alpha.title);
    await replaceEditorProse(writing, alpha.title, alpha.recovered);
    await selectUnit(writing, beta.title);
    await replaceEditorProse(writing, beta.title, beta.recovered);
    const interruptedArtifact = await waitForRecoveryCandidates(project.path, [alpha.recovered, beta.recovered]);
    expect(new Set(interruptedArtifact.candidates.map((candidate) => candidate.originSessionId)).size).toBe(1);
    expect(interruptedArtifact.candidates.every((candidate) => candidate.projectId === project.id)).toBe(true);
    await terminateElectronApplicationAbruptly(electronApp);

    const recoveryLaunch = await launchStage19BuiltApplication('black-skies-stage19-recovery-accept-');
    launches.push(recoveryLaunch);
    const { writing: recoveredWriting, command: recoveredCommand } = await getStage19Windows(recoveryLaunch.application);
    await openProject(recoveredWriting, project.path);
    await expectRecoveryChoice(recoveredWriting, alpha.title, alpha.recovered);
    await expectRecoveryChoice(recoveredWriting, beta.title, beta.recovered);
    await expectCommandCenterPassive(recoveredCommand, [alpha.recovered, beta.recovered]);

    const alphaChoice = recoveredWriting.locator('article').filter({ hasText: alpha.title });
    await alphaChoice.getByRole('button', { name: 'Recover this prose' }).click();
    await expect(alphaChoice.getByRole('button', { name: /Accepted/ })).toBeVisible();
    const afterFirstDecision = await recoveredWriting.evaluate(() => window.projectSpine!.getSession());
    expect(afterFirstDecision.recovery?.status).toBe('decision-required');
    expect(afterFirstDecision.dirtyUnitIds).toEqual([]);
    expect(afterFirstDecision.project?.drafts?.[durableAlpha.unitId]).toBe(durableAlpha.contents);
    expect(afterFirstDecision.project?.drafts?.[durableBeta.unitId]).toBe(durableBeta.contents);
    const activeAfterFirstDecision = afterFirstDecision.project?.units.find(
      (unit) => unit.id === afterFirstDecision.activeUnitId,
    );
    if (!activeAfterFirstDecision) throw new Error('No active unit remained after the first recovery selection.');
    const activeDurableProse = activeAfterFirstDecision.id === durableAlpha.unitId
      ? alpha.baseline
      : beta.baseline;
    await expect(editorFor(recoveredWriting, activeAfterFirstDecision.displayTitle)).toHaveText(activeDurableProse);

    const betaChoice = recoveredWriting.locator('article').filter({ hasText: beta.title });
    await betaChoice.getByRole('button', { name: 'Recover this prose' }).click();
    await expect(recoveredWriting.getByText('Recovered prose is applied and remains unsaved.')).toBeVisible();
    await selectUnit(recoveredWriting, alpha.title);
    await expect(editorFor(recoveredWriting, alpha.title)).toHaveText(alpha.recovered);
    await selectUnit(recoveredWriting, beta.title);
    await expect(editorFor(recoveredWriting, beta.title)).toHaveText(beta.recovered);
    await expect(recoveredWriting.getByRole('status').filter({ hasText: '2 unsaved units' })).toBeVisible();
    expect((await readFile(durableAlpha.draftPath, 'utf8'))).toBe(durableAlpha.contents);
    expect((await readFile(durableBeta.draftPath, 'utf8'))).toBe(durableBeta.contents);

    const observedDialogs: string[] = [];
    const observeBeforeUnload = (dialog: { type: () => string }) => observedDialogs.push(dialog.type());
    recoveredWriting.on('dialog', observeBeforeUnload);
    await requestWritingStudioClose(recoveryLaunch.application);
    const closeDialog = recoveredWriting.getByRole('dialog', { name: 'Unsaved manuscript changes' });
    await expect(closeDialog).toBeVisible();
    await recoveredWriting.getByRole('button', { name: 'Keep editing' }).click();
    await expect(closeDialog).toHaveCount(0);
    recoveredWriting.off('dialog', observeBeforeUnload);
    expect(observedDialogs).toEqual(['beforeunload']);
    expect(recoveryLaunch.application.windows()).toHaveLength(2);
    await selectUnit(recoveredWriting, alpha.title);
    await expect(editorFor(recoveredWriting, alpha.title)).toHaveText(alpha.recovered);
    await selectUnit(recoveredWriting, beta.title);
    await expect(editorFor(recoveredWriting, beta.title)).toHaveText(beta.recovered);

    await saveUnit(recoveredWriting, alpha.title);
    await saveUnit(recoveredWriting, beta.title);
    await waitForRecoveryArtifactRemoval(project.path);
    await closeApplicationCleanly(recoveryLaunch.application);

    const durableLaunch = await launchStage19BuiltApplication('black-skies-stage19-recovery-durable-');
    launches.push(durableLaunch);
    const { writing: durableWriting, command: durableCommand } = await getStage19Windows(durableLaunch.application);
    await openProject(durableWriting, project.path);
    await expect(durableWriting.getByRole('heading', { name: 'Recover unsaved Writing Studio prose' })).toHaveCount(0);
    await selectUnit(durableWriting, alpha.title);
    await expect(editorFor(durableWriting, alpha.title)).toHaveText(alpha.recovered);
    await selectUnit(durableWriting, beta.title);
    await expect(editorFor(durableWriting, beta.title)).toHaveText(beta.recovered);
    await expectCommandCenterPassive(durableCommand, [alpha.recovered, beta.recovered]);
    await closeApplicationCleanly(durableLaunch.application);
  } finally {
    await cleanupLaunches(launches);
    await removeTemporaryDirectory(parent);
  }
});

test('rejects an interrupted candidate without changing the durable baseline or reoffering it', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-recovery-reject-'));
  const launches: LaunchedStage19Application[] = [];
  const title = 'Reject Unit';
  const baseline = 'REJECT-BASELINE::durable';
  const unsaved = 'REJECT-UNSAVED::checkpoint';
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const project = await createProjectWithUnits(writing, parent, 'P19.12 Reject', [title]);
    await saveUnit(writing, title, baseline);
    const durable = await readDurableDraftByTitle(project.path, title);
    await replaceEditorProse(writing, title, unsaved);
    await waitForRecoveryCandidates(project.path, [unsaved]);
    await terminateElectronApplicationAbruptly(electronApp);

    const rejectLaunch = await launchStage19BuiltApplication('black-skies-stage19-recovery-reject-');
    launches.push(rejectLaunch);
    const { writing: rejectWriting, command: rejectCommand } = await getStage19Windows(rejectLaunch.application);
    await openProject(rejectWriting, project.path);
    await expectRecoveryChoice(rejectWriting, title, unsaved);
    await expectCommandCenterPassive(rejectCommand, [unsaved]);
    await rejectWriting.getByRole('button', { name: 'Reject and delete candidate' }).click();
    await expect(rejectWriting.getByRole('heading', { name: 'Recover unsaved Writing Studio prose' })).toHaveCount(0);
    await waitForRecoveryArtifactRemoval(project.path);
    expect((await readFile(durable.draftPath, 'utf8'))).toBe(durable.contents);
    await expect(editorFor(rejectWriting, title)).toHaveText(baseline);
    await closeApplicationCleanly(rejectLaunch.application);

    const reopenLaunch = await launchStage19BuiltApplication('black-skies-stage19-recovery-reject-reopen-');
    launches.push(reopenLaunch);
    const { writing: reopenedWriting } = await getStage19Windows(reopenLaunch.application);
    await openProject(reopenedWriting, project.path);
    await expect(reopenedWriting.getByRole('heading', { name: 'Recover unsaved Writing Studio prose' })).toHaveCount(0);
    await expect(editorFor(reopenedWriting, title)).toHaveText(baseline);
    expect((await readFile(durable.draftPath, 'utf8'))).toBe(durable.contents);
    await closeApplicationCleanly(reopenLaunch.application);
  } finally {
    await cleanupLaunches(launches);
    await removeTemporaryDirectory(parent);
  }
});

test('isolates projects and preserves unresolved recovery decisions across a clean close', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-recovery-isolation-'));
  const launches: LaunchedStage19Application[] = [];
  const titleA = 'Project A Unit';
  const proseA = 'PROJECT-A::unresolved checkpoint';
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const projectA = await createProjectWithUnits(writing, parent, 'P19.12 Project A', [titleA]);
    await saveUnit(writing, titleA, 'PROJECT-A::baseline');
    const projectB = await createProjectWithUnits(writing, parent, 'P19.12 Project B', ['Project B Unit']);
    await saveUnit(writing, 'Project B Unit', 'PROJECT-B::baseline');
    await openProject(writing, projectA.path);
    await replaceEditorProse(writing, titleA, proseA);
    await waitForRecoveryCandidates(projectA.path, [proseA]);
    await terminateElectronApplicationAbruptly(electronApp);

    const isolationLaunch = await launchStage19BuiltApplication('black-skies-stage19-recovery-isolation-');
    launches.push(isolationLaunch);
    const { writing: isolationWriting, command: isolationCommand } = await getStage19Windows(isolationLaunch.application);
    await openProject(isolationWriting, projectB.path);
    await expect(isolationWriting.getByRole('heading', { name: 'Recover unsaved Writing Studio prose' })).toHaveCount(0);
    await expect(isolationWriting.getByRole('heading', { name: 'Recovery evidence needs attention' })).toHaveCount(0);
    await expect(editorFor(isolationWriting, 'Project B Unit')).toHaveText('PROJECT-B::baseline');
    await expectCommandCenterPassive(isolationCommand, [proseA]);

    await openProject(isolationWriting, projectA.path);
    await expectRecoveryChoice(isolationWriting, titleA, proseA);
    await expectCommandCenterPassive(isolationCommand, [proseA]);
    await closeApplicationCleanly(isolationLaunch.application);
    expect((await readRecoveryArtifact(projectA.path)).candidates.map((candidate) => candidate.prose)).toEqual([proseA]);

    const persistenceLaunch = await launchStage19BuiltApplication('black-skies-stage19-recovery-persistence-');
    launches.push(persistenceLaunch);
    const { writing: persistenceWriting, command: persistenceCommand } = await getStage19Windows(persistenceLaunch.application);
    await openProject(persistenceWriting, projectA.path);
    await expectRecoveryChoice(persistenceWriting, titleA, proseA);
    await expectCommandCenterPassive(persistenceCommand, [proseA]);
    await closeApplicationCleanly(persistenceLaunch.application);
    expect((await readRecoveryArtifact(projectA.path)).candidates.map((candidate) => candidate.prose)).toEqual([proseA]);
  } finally {
    await cleanupLaunches(launches);
    await removeTemporaryDirectory(parent);
  }
});

test('preserves corrupt recovery evidence as a Writing-only degraded state', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-recovery-corrupt-'));
  const launches: LaunchedStage19Application[] = [];
  const title = 'Corrupt Evidence Unit';
  const baseline = 'CORRUPT-EVIDENCE::baseline';
  const corruptBytes = '{ this is deliberately invalid recovery JSON\n';
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const project = await createProjectWithUnits(writing, parent, 'P19.12 Corrupt', [title]);
    await saveUnit(writing, title, baseline);
    const durable = await readDurableDraftByTitle(project.path, title);
    await closeApplicationCleanly(electronApp, true);

    const artifactPath = recoveryArtifactPath(project.path);
    await mkdir(dirname(artifactPath), { recursive: true });
    await writeFile(artifactPath, corruptBytes, 'utf8');
    const degradedLaunch = await launchStage19BuiltApplication('black-skies-stage19-recovery-corrupt-');
    launches.push(degradedLaunch);
    const { writing: degradedWriting, command: degradedCommand } = await getStage19Windows(degradedLaunch.application);
    await openProject(degradedWriting, project.path);
    await expect(degradedWriting.getByRole('heading', { name: 'Recovery evidence needs attention' })).toBeVisible();
    await expect(degradedWriting.getByText('Editing is blocked and the recovery artifact has not been deleted.')).toBeVisible();
    await expect(editorFor(degradedWriting, title)).toHaveAttribute('contenteditable', 'false');
    await expect(editorFor(degradedWriting, title)).toHaveText(baseline);
    await expectCommandCenterPassive(degradedCommand, [corruptBytes]);
    expect(await readFile(artifactPath, 'utf8')).toBe(corruptBytes);
    expect(await readFile(durable.draftPath, 'utf8')).toBe(durable.contents);
    await closeApplicationCleanly(degradedLaunch.application);
    expect(await readFile(artifactPath, 'utf8')).toBe(corruptBytes);
  } finally {
    await cleanupLaunches(launches);
    await removeTemporaryDirectory(parent);
  }
});

test('preserves checkpoint evidence through renderer loss and a fresh-process restart', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-recovery-renderer-loss-'));
  const launches: LaunchedStage19Application[] = [];
  const title = 'Renderer Loss Unit';
  const unsaved = 'RENDERER-LOSS::checkpoint survives';
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const project = await createProjectWithUnits(writing, parent, 'P19.12 Renderer Loss', [title]);
    await saveUnit(writing, title, 'RENDERER-LOSS::baseline');
    await replaceEditorProse(writing, title, unsaved);
    await waitForRecoveryCandidates(project.path, [unsaved]);
    const artifactBeforeCrash = await readFile(recoveryArtifactPath(project.path), 'utf8');

    const rendererExitReason = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const roles = await Promise.all(BrowserWindow.getAllWindows().map(async (window) => ({
        window,
        role: await window.webContents.executeJavaScript(
          "document.querySelector('[data-stage19-role=\"writing\"]') ? 'writing' : 'other'",
        ),
      })));
      const writingWindow = roles.find((entry) => entry.role === 'writing')?.window;
      if (!writingWindow) throw new Error('Writing Studio BrowserWindow was unavailable for renderer crash proof.');
      const rendererProcessId = writingWindow.webContents.getOSProcessId();
      if (!Number.isInteger(rendererProcessId) || rendererProcessId <= 0) {
        throw new Error('Writing Studio renderer process identity was unavailable.');
      }
      return new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Writing Studio render-process-gone was not observed.')),
          15_000,
        );
        writingWindow.webContents.once('render-process-gone', (_event, details) => {
          clearTimeout(timeout);
          resolve(details.reason);
        });
        process.kill(rendererProcessId, 'SIGKILL');
      });
    });
    expect(['crashed', 'killed']).toContain(rendererExitReason);
    expect(await readFile(recoveryArtifactPath(project.path), 'utf8')).toBe(artifactBeforeCrash);
    await terminateElectronApplicationAbruptly(electronApp);

    const recoveryLaunch = await launchStage19BuiltApplication('black-skies-stage19-recovery-renderer-restart-');
    launches.push(recoveryLaunch);
    const { writing: recoveredWriting, command: recoveredCommand } = await getStage19Windows(recoveryLaunch.application);
    await openProject(recoveredWriting, project.path);
    await expectRecoveryChoice(recoveredWriting, title, unsaved);
    await expectCommandCenterPassive(recoveredCommand, [unsaved]);
    expect((await readRecoveryArtifact(project.path)).candidates.map((candidate) => candidate.prose)).toEqual([unsaved]);
    await closeApplicationCleanly(recoveryLaunch.application);
  } finally {
    await cleanupLaunches(launches);
    await removeTemporaryDirectory(parent);
  }
});
// HARNESS_ONLY
// Reason: Exercises synthetic Stage 19 Electron state before installed-build qualification.
// Owner: Package 19.22 internal baseline verification.
// Retire when: An installed-build recovery truth lane provides equivalent deterministic coverage.
