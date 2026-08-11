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

async function createProjectWithUnit(
  writing: Page,
  parentPath: string,
  projectTitle: string,
  unitTitle: string,
): Promise<CreatedProject> {
  return writing.evaluate(async ({ parentPath, projectTitle, unitTitle, operationPrefix }) => {
    const bridge = window.projectSpine!;
    const created = await bridge.createProject({
      parentPath,
      title: projectTitle,
      operationId: `${operationPrefix}-project`,
    });
    if (!created.ok) throw new Error(created.error.message);
    const unit = await bridge.createUnit!({
      projectId: created.snapshot.project!.projectId,
      projectPath: created.snapshot.project!.path,
      generation: created.snapshot.generation,
      operationId: `${operationPrefix}-unit`,
      title: unitTitle,
    });
    if (!unit.ok) throw new Error(unit.error.message);
    return { id: unit.snapshot.project!.projectId, path: unit.snapshot.project!.path };
  }, { parentPath, projectTitle, unitTitle, operationPrefix: operationId('create') });
}

async function openProject(
  writing: Page,
  projectPath: string,
  discardUnsaved = false,
): Promise<void> {
  const snapshot = await writing.evaluate(async ({ projectPath, discardUnsaved, operation }) => {
    const result = await window.projectSpine!.openProject({
      path: projectPath,
      discardUnsaved,
      operationId: operation,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.snapshot;
  }, { projectPath, discardUnsaved, operation: operationId('open') });
  expect(snapshot.project?.path.toLocaleLowerCase()).toBe(projectPath.toLocaleLowerCase());
}

function editorFor(writing: Page, title: string) {
  return writing.getByRole('textbox', { name: `Manuscript editor: ${title}` });
}

async function replaceEditorProse(writing: Page, title: string, prose: string): Promise<void> {
  const editor = editorFor(writing, title);
  await editor.fill(prose);
  await expect(editor).toHaveText(prose);
}

async function saveCurrentUnit(writing: Page, title: string, prose?: string): Promise<void> {
  await openWritingStudioRail(writing, 'manuscript tools');
  await writing.getByRole('button', { name: new RegExp(title) }).click();
  if (prose !== undefined) await replaceEditorProse(writing, title, prose);
  await writing.getByRole('button', { name: /^Save$/ }).click();
  await expect(writing.getByRole('button', { name: new RegExp(`${title} Unsaved`) })).toHaveCount(0);
}

async function expectCommandStatus(
  command: Page,
  expected: {
    readonly projectId: string;
    readonly lifecycle: 'active' | 'operation-failed';
    readonly recovery: 'none' | 'decision-required' | 'accepted-pending-save' | 'degraded';
    readonly save: 'clean' | 'dirty' | 'saving' | 'saved' | 'save-failed' | 'accepted-recovery-pending-save';
  },
): Promise<void> {
  await expect.poll(async () => command.evaluate(async () => {
    try {
      return (await window.projectSpine!.getSession()).commandStatus ?? null;
    } catch {
      return null;
    }
  }), { timeout: 15_000, intervals: [100] }).toMatchObject(expected);
}

async function expectCommandPrivacyAndAuthority(
  command: Page,
  prohibitedText: readonly string[],
): Promise<void> {
  const evidence = await command.evaluate(async () => {
    const surface = window as unknown as Record<string, unknown>;
    const prohibitedGlobals = [
      'projectLoader',
      'services',
      '__electronApi',
      'diagnostics',
      'layout',
      'runtimeConfig',
      '__phase4MockFlowEnabled',
      '__testEnv',
      '__test',
      '__dev',
      '__testInsights',
      'testMode',
      'ipcRenderer',
      'require',
      'process',
      'fs',
      'shell',
    ];
    const session = await window.projectSpine!.getSession();
    return {
      role: session.role,
      projectSpineWindowRole: window.projectSpine!.windowRole,
      splitCommandWindowRole: window.splitCommand!.windowRole,
      projectSpineKeys: Object.keys(window.projectSpine!).sort(),
      splitCommandKeys: Object.keys(window.splitCommand!).sort(),
      prohibitedGlobalTypes: Object.fromEntries(
        prohibitedGlobals.map((name) => [name, typeof surface[name]]),
      ),
      hasDrafts: Boolean(session.project && Object.prototype.hasOwnProperty.call(session.project, 'drafts')),
      hasRecoveryProjection: Object.prototype.hasOwnProperty.call(session, 'recovery'),
      commandStatusKeys: Object.keys(session.commandStatus ?? {}).sort(),
      serializedSession: JSON.stringify(session),
      visibleText: document.body.innerText,
    };
  });

  expect(evidence.role).toBe('command');
  expect(evidence.projectSpineWindowRole).toBe('command');
  expect(evidence.splitCommandWindowRole).toBe('secondary');
  expect(evidence.projectSpineKeys).toEqual(
    ['getSession', 'selectUnit', 'subscribeSession', 'windowRole'].sort(),
  );
  expect(evidence.splitCommandKeys).toEqual(
    [
      'activateSurface',
      'readOwnershipSync',
      'readSurfaceHostState',
      'requestOwnershipSync',
      'requestSurfaceHostState',
      'subscribeOwnershipSync',
      'subscribeSurfaceHostState',
      'windowRole',
    ].sort(),
  );
  expect(evidence.prohibitedGlobalTypes).toEqual(
    Object.fromEntries(Object.keys(evidence.prohibitedGlobalTypes).map((name) => [name, 'undefined'])),
  );
  expect(evidence.hasDrafts).toBe(false);
  expect(evidence.hasRecoveryProjection).toBe(false);
  expect(evidence.commandStatusKeys).toEqual(
    ['generation', 'lifecycle', 'projectId', 'recovery', 'revision', 'save', 'schemaVersion'].sort(),
  );
  for (const forbiddenField of [
    '"drafts"',
    '"candidates"',
    '"prose"',
    '"artifactPath"',
    '"durableBaselineFingerprint"',
    '"baseline"',
    '"hash"',
  ]) {
    expect(evidence.serializedSession).not.toContain(forbiddenField);
  }
  for (const text of prohibitedText) {
    if (!text) continue;
    expect(evidence.serializedSession).not.toContain(text);
    expect(evidence.visibleText).not.toContain(text);
  }

  await expect(command.getByRole('button', { name: /^Save$/ })).toHaveCount(0);
  await expect(command.getByRole('button', { name: 'Recover this prose' })).toHaveCount(0);
  await expect(command.getByRole('button', { name: 'Reject and delete candidate' })).toHaveCount(0);
  await expect(command.getByRole('button', { name: 'Create unit' })).toHaveCount(0);
  await expect(command.getByRole('button', { name: 'Update title' })).toHaveCount(0);
  await expect(command.getByRole('button', { name: 'Delete selected unit' })).toHaveCount(0);
  await expect(command.getByRole('dialog', { name: 'Unsaved manuscript changes' })).toHaveCount(0);
}

async function closeApplicationCleanly(
  application: ElectronApplication,
  fixtureOwned = false,
): Promise<void> {
  const exitPromise = waitForCleanElectronApplicationExit(application);
  await requestWritingStudioClose(application);
  await expect.poll(() => application.windows().length, { timeout: 15_000, intervals: [100] }).toBe(0);
  expect(await exitPromise).toEqual({ code: 0, signal: null });
  if (fixtureOwned) markElectronApplicationExitedCleanly(application);
}

async function cleanupLaunches(launches: readonly LaunchedStage19Application[]): Promise<void> {
  for (const launched of [...launches].reverse()) {
    await closeLaunchedApplicationBestEffort(launched);
  }
}

test('Command Center tracks dirty prose through Writing Studio durable Save without receiving prose or authority', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-command-save-'));
  const title = 'Command Save Unit';
  const prose = 'COMMAND-SAVE::private manuscript prose';
  try {
    const { writing, command } = await getStage19Windows(electronApp, page);
    const project = await createProjectWithUnit(writing, parent, 'P19.13 Command Save', title);
    await replaceEditorProse(writing, title, prose);

    await expectCommandStatus(command, {
      projectId: project.id,
      lifecycle: 'active',
      recovery: 'none',
      save: 'dirty',
    });
    await expect(command.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();
    await expectCommandPrivacyAndAuthority(command, [prose]);

    await writing.getByRole('button', { name: /^Save$/ }).click();
    await expectCommandStatus(command, {
      projectId: project.id,
      lifecycle: 'active',
      recovery: 'none',
      save: 'saved',
    });
    await expect(command.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await expectCommandPrivacyAndAuthority(command, [prose]);
    expect((await readDurableDraftByTitle(project.path, title)).contents).toContain(prose);

    await closeApplicationCleanly(electronApp, true);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

test('Command Center projects interrupted recovery acceptance as pending until Writing Studio saves', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-command-accept-'));
  const launches: LaunchedStage19Application[] = [];
  const title = 'Command Accept Unit';
  const baseline = 'COMMAND-ACCEPT::durable baseline';
  const recovered = 'COMMAND-ACCEPT::private recovered prose';
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const project = await createProjectWithUnit(writing, parent, 'P19.13 Command Accept', title);
    await saveCurrentUnit(writing, title, baseline);
    await replaceEditorProse(writing, title, recovered);
    await waitForRecoveryCandidates(project.path, [recovered]);
    await terminateElectronApplicationAbruptly(electronApp);

    const recoveryLaunch = await launchStage19BuiltApplication('black-skies-stage19-command-accept-');
    launches.push(recoveryLaunch);
    const { writing: recoveredWriting, command } = await getStage19Windows(recoveryLaunch.application);
    await openProject(recoveredWriting, project.path);

    await expect(recoveredWriting.getByRole('heading', { name: 'Recover unsaved Writing Studio prose' })).toBeVisible();
    await expectCommandStatus(command, {
      projectId: project.id,
      lifecycle: 'active',
      recovery: 'decision-required',
      save: 'clean',
    });
    await expect(command.getByText('Recovery decision required in Writing Studio', { exact: true }).first()).toBeVisible();
    await expect(command.getByText('Saved durably', { exact: true })).toHaveCount(0);
    await expectCommandPrivacyAndAuthority(command, [baseline, recovered, recoveryArtifactPath(project.path)]);

    await recoveredWriting.getByRole('button', { name: 'Recover this prose' }).click();
    await expect(recoveredWriting.getByText('Recovered prose is applied and remains unsaved.')).toBeVisible();
    await expectCommandStatus(command, {
      projectId: project.id,
      lifecycle: 'active',
      recovery: 'accepted-pending-save',
      save: 'accepted-recovery-pending-save',
    });
    await expect(command.getByText('Recovered work is unsaved and pending normal Save').first()).toBeVisible();
    await expect(command.getByText('Saved durably', { exact: true })).toHaveCount(0);
    await expectCommandPrivacyAndAuthority(command, [baseline, recovered, recoveryArtifactPath(project.path)]);

    await recoveredWriting.getByRole('button', { name: /^Save$/ }).click();
    await expectCommandStatus(command, {
      projectId: project.id,
      lifecycle: 'active',
      recovery: 'none',
      save: 'saved',
    });
    await expect(command.getByText('No recovery action required').first()).toBeVisible();
    await expect(command.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await expect(recoveredWriting.getByRole('heading', { name: 'Recover unsaved Writing Studio prose' })).toHaveCount(0);
    await waitForRecoveryArtifactRemoval(project.path);
    expect((await readDurableDraftByTitle(project.path, title)).contents).toContain(recovered);
    await closeApplicationCleanly(recoveryLaunch.application);
  } finally {
    await cleanupLaunches(launches);
    await removeTemporaryDirectory(parent);
  }
});

test('Command Center returns to non-pending truth after Writing Studio rejects interrupted recovery', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-command-reject-'));
  const launches: LaunchedStage19Application[] = [];
  const title = 'Command Reject Unit';
  const baseline = 'COMMAND-REJECT::durable baseline';
  const rejected = 'COMMAND-REJECT::private rejected prose';
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const project = await createProjectWithUnit(writing, parent, 'P19.13 Command Reject', title);
    await saveCurrentUnit(writing, title, baseline);
    const durableBefore = await readDurableDraftByTitle(project.path, title);
    await replaceEditorProse(writing, title, rejected);
    await waitForRecoveryCandidates(project.path, [rejected]);
    await terminateElectronApplicationAbruptly(electronApp);

    const rejectLaunch = await launchStage19BuiltApplication('black-skies-stage19-command-reject-');
    launches.push(rejectLaunch);
    const { writing: rejectWriting, command } = await getStage19Windows(rejectLaunch.application);
    await openProject(rejectWriting, project.path);
    await expectCommandStatus(command, {
      projectId: project.id,
      lifecycle: 'active',
      recovery: 'decision-required',
      save: 'clean',
    });
    await expect(command.getByText('Recovery decision required in Writing Studio', { exact: true }).first()).toBeVisible();
    await expectCommandPrivacyAndAuthority(command, [baseline, rejected, recoveryArtifactPath(project.path)]);

    await rejectWriting.getByRole('button', { name: 'Reject and delete candidate' }).click();
    await expect(rejectWriting.getByRole('heading', { name: 'Recover unsaved Writing Studio prose' })).toHaveCount(0);
    await expectCommandStatus(command, {
      projectId: project.id,
      lifecycle: 'active',
      recovery: 'none',
      save: 'clean',
    });
    await expect(command.getByText('No recovery action required').first()).toBeVisible();
    await expectCommandPrivacyAndAuthority(command, [baseline, rejected, recoveryArtifactPath(project.path)]);
    await waitForRecoveryArtifactRemoval(project.path);
    expect(await readFile(durableBefore.draftPath, 'utf8')).toBe(durableBefore.contents);
    await expect(editorFor(rejectWriting, title)).toHaveText(baseline);
    await closeApplicationCleanly(rejectLaunch.application);
  } finally {
    await cleanupLaunches(launches);
    await removeTemporaryDirectory(parent);
  }
});

test('Command Center renders corrupt recovery evidence as degraded without details or repair authority', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-command-degraded-'));
  const launches: LaunchedStage19Application[] = [];
  const title = 'Command Degraded Unit';
  const baseline = 'COMMAND-DEGRADED::durable baseline';
  const corruptBytes = '{ COMMAND-DEGRADED::private corrupt artifact bytes\n';
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const project = await createProjectWithUnit(writing, parent, 'P19.13 Command Degraded', title);
    await saveCurrentUnit(writing, title, baseline);
    const durableBefore = await readDurableDraftByTitle(project.path, title);
    await closeApplicationCleanly(electronApp, true);

    const artifactPath = recoveryArtifactPath(project.path);
    await mkdir(dirname(artifactPath), { recursive: true });
    await writeFile(artifactPath, corruptBytes, 'utf8');

    const degradedLaunch = await launchStage19BuiltApplication('black-skies-stage19-command-degraded-');
    launches.push(degradedLaunch);
    const { writing: degradedWriting, command } = await getStage19Windows(degradedLaunch.application);
    await openProject(degradedWriting, project.path);
    await expect(degradedWriting.getByRole('heading', { name: 'Recovery evidence needs attention' })).toBeVisible();
    await expectCommandStatus(command, {
      projectId: project.id,
      lifecycle: 'active',
      recovery: 'degraded',
      save: 'clean',
    });
    await expect(command.getByText('Recovery evidence is degraded or unavailable', { exact: true }).first()).toBeVisible();
    await expect(command.getByText('Saved durably', { exact: true })).toHaveCount(0);
    await expectCommandPrivacyAndAuthority(command, [baseline, corruptBytes, artifactPath]);
    expect(await readFile(artifactPath, 'utf8')).toBe(corruptBytes);
    expect(await readFile(durableBefore.draftPath, 'utf8')).toBe(durableBefore.contents);
    await closeApplicationCleanly(degradedLaunch.application);
  } finally {
    await cleanupLaunches(launches);
    await removeTemporaryDirectory(parent);
  }
});

test('Command Center replaces Project A dirty state with Project B and restores only current Project A truth', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-command-isolation-'));
  const titleA = 'Command Project A Unit';
  const titleB = 'Command Project B Unit';
  const baselineA = 'COMMAND-PROJECT-A::durable baseline';
  const baselineB = 'COMMAND-PROJECT-B::durable baseline';
  const dirtyA = 'COMMAND-PROJECT-A::private discarded edit';
  try {
    const { writing, command } = await getStage19Windows(electronApp, page);
    const projectA = await createProjectWithUnit(writing, parent, 'P19.13 Command Project A', titleA);
    await saveCurrentUnit(writing, titleA, baselineA);
    const projectB = await createProjectWithUnit(writing, parent, 'P19.13 Command Project B', titleB);
    await saveCurrentUnit(writing, titleB, baselineB);

    await openProject(writing, projectA.path);
    await replaceEditorProse(writing, titleA, dirtyA);
    await expectCommandStatus(command, {
      projectId: projectA.id,
      lifecycle: 'active',
      recovery: 'none',
      save: 'dirty',
    });
    await expect(command.getByRole('heading', { name: 'P19.13 Command Project A' })).toBeVisible();
    await expect(command.getByRole('status').filter({ hasText: '1 unsaved unit' })).toBeVisible();

    await openProject(writing, projectB.path, true);
    await expectCommandStatus(command, {
      projectId: projectB.id,
      lifecycle: 'active',
      recovery: 'none',
      save: 'clean',
    });
    await expect(command.getByRole('heading', { name: 'P19.13 Command Project B' })).toBeVisible();
    await expect(command.getByText(titleB, { exact: true })).toBeVisible();
    await expect(command.getByText('P19.13 Command Project A', { exact: true })).toHaveCount(0);
    await expect(command.getByText(titleA, { exact: true })).toHaveCount(0);
    await expect(command.getByText('1 unsaved unit', { exact: true })).toHaveCount(0);
    await expect(command.getByText('No recovery action required').first()).toBeVisible();
    const commandProjectB = await command.evaluate(() => window.projectSpine!.getSession());
    expect(commandProjectB).toMatchObject({
      project: { projectId: projectB.id },
      dirtyUnitIds: [],
      saveState: { status: 'clean' },
      lastError: null,
      commandStatus: { projectId: projectB.id, lifecycle: 'active', recovery: 'none', save: 'clean' },
    });
    expect(commandProjectB.project?.units.map((unit) => unit.title)).toEqual([titleB]);
    await expectCommandPrivacyAndAuthority(command, [baselineB, dirtyA]);

    await openProject(writing, projectA.path);
    await expectCommandStatus(command, {
      projectId: projectA.id,
      lifecycle: 'active',
      recovery: 'none',
      save: 'clean',
    });
    await expect(command.getByRole('heading', { name: 'P19.13 Command Project A' })).toBeVisible();
    await expect(command.getByText(titleA, { exact: true })).toBeVisible();
    await expect(command.getByText('P19.13 Command Project B', { exact: true })).toHaveCount(0);
    await expect(command.getByText(titleB, { exact: true })).toHaveCount(0);
    await expect(editorFor(writing, titleA)).toHaveText(baselineA);
    const commandProjectA = await command.evaluate(() => window.projectSpine!.getSession());
    expect(commandProjectA).toMatchObject({
      project: { projectId: projectA.id },
      dirtyUnitIds: [],
      saveState: { status: 'clean' },
      lastError: null,
      commandStatus: { projectId: projectA.id, lifecycle: 'active', recovery: 'none', save: 'clean' },
    });
    expect(commandProjectA.project?.units.map((unit) => unit.title)).toEqual([titleA]);
    await expectCommandPrivacyAndAuthority(command, [baselineA, dirtyA]);

    await closeApplicationCleanly(electronApp, true);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});
// HARNESS_ONLY
// Reason: Exercises synthetic Stage 19 Electron state before installed-build qualification.
// Owner: Package 19.22 internal baseline verification.
// Retire when: An installed-build command-center truth lane provides equivalent deterministic coverage.
