import { cp, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROJECT_SPINE_CHANNELS } from '../../shared/ipc/projectSpine';
import type { LoadedProject } from '../../shared/ipc/projectLoader';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: { sender: { id: number } }, request?: any) => Promise<any>>();
  return {
    handlers,
    showOpenDialog: vi.fn(),
    handle: vi.fn((channel: string, handler: (event: { sender: { id: number } }, request?: any) => Promise<any>) => {
      handlers.set(channel, handler);
    }),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => tmpdir()),
    getAppPath: vi.fn(() => process.cwd()),
    isPackaged: false,
  },
  dialog: { showOpenDialog: electronMocks.showOpenDialog },
  ipcMain: {
    handle: electronMocks.handle,
    removeHandler: electronMocks.removeHandler,
  },
}));

import { bootstrapFreshProject } from '../projectBootstrap';
import {
  createManuscriptUnit,
  loadProjectForSpine,
  registerProjectSpineIpc,
  resetProjectSpineForTests,
} from '../projectSpineIpc';
import { ProjectSessionCoordinator } from '../projectSessionCoordinator';
import {
  consumeCoordinatedCloseAllowance,
  createPendingCloseRequest,
  grantCoordinatedCloseAllowance,
  hasPendingCloseRequest,
} from '../closeConfirmationCoordinator';

const temporaryRoots: string[] = [];
let testRecentStorePath = '';

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-project-spine-ipc-'));
  temporaryRoots.push(root);
  return root;
}

function invoke(channel: string, senderId: number, request?: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Missing IPC handler ${channel}`);
  return handler({ sender: { id: senderId } }, request);
}

function syntheticProject(projectId: string, projectPath: string): LoadedProject {
  return {
    path: projectPath,
    projectId,
    name: projectId,
    outline: {
      schema_version: 'OutlineSchema v1',
      outline_id: `outline_${projectId}`,
      project_id: projectId,
      acts: [],
      chapters: [],
      scenes: [],
    },
    scenes: [],
    drafts: {},
  };
}

describe('project-spine IPC', () => {
  beforeEach(async () => {
    electronMocks.handlers.clear();
    electronMocks.showOpenDialog.mockReset();
    const root = await temporaryRoot();
    testRecentStorePath = join(root, 'recents.json');
    resetProjectSpineForTests(new ProjectSessionCoordinator());
    registerProjectSpineIpc({
      coordinator: new ProjectSessionCoordinator(),
      recentStorePath: testRecentStorePath,
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      publishSession: vi.fn(),
    });
  });

  afterEach(async () => {
    resetProjectSpineForTests();
    await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('synchronizes one active identity while withholding drafts from Command Center', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Shared Project' });

    const opened = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-a',
    });
    expect(opened).toMatchObject({ ok: true, data: { activation: 'activated' } });

    const writing = await invoke(PROJECT_SPINE_CHANNELS.getSession, 1);
    const command = await invoke(PROJECT_SPINE_CHANNELS.getSession, 2);
    expect(writing.project).toMatchObject({ projectId: created.projectId, drafts: {} });
    expect(command.project).toMatchObject({ projectId: created.projectId });
    expect(command.project.drafts).toBeUndefined();
    expect(command.generation).toBe(writing.generation);
  });

  it('validates correlated close-confirmation responses without mutating state on rejection', async () => {
    const request = createPendingCloseRequest('proj_a', 7, 1)!;
    const valid = { correlationId: request.correlationId, projectId: 'proj_a', generation: 7, decision: 'keep-editing' as const };
    expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, 1, valid)).toMatchObject({ ok: true });
    expect(hasPendingCloseRequest()).toBe(false);
    expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, 1, valid)).toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });

    const discard = createPendingCloseRequest('proj_b', 8, 1)!;
    expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, 1, { ...discard, decision: 'discard' })).toMatchObject({ ok: true });
    expect(consumeCoordinatedCloseAllowance()).toBe(true);
    expect(consumeCoordinatedCloseAllowance()).toBe(false);

    const pending = createPendingCloseRequest('proj_c', 9, 1)!;
    grantCoordinatedCloseAllowance();
    for (const [sender, response, code] of [
      [2, { ...pending, decision: 'keep-editing' }, 'WRONG_WINDOW_ROLE'],
      [1, { ...pending, correlationId: 'stale', decision: 'keep-editing' }, 'STALE_SESSION'],
      [1, { ...pending, projectId: 'wrong', decision: 'keep-editing' }, 'STALE_SESSION'],
      [1, { ...pending, generation: 10, decision: 'keep-editing' }, 'STALE_SESSION'],
      [1, { correlationId: '', projectId: '', generation: -1, decision: 'bad' }, 'INVALID_REQUEST'],
    ] as const) {
      expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, sender, response)).toMatchObject({ ok: false, error: { code } });
      expect(hasPendingCloseRequest()).toBe(true);
    }
    expect(consumeCoordinatedCloseAllowance()).toBe(true);
    resetProjectSpineForTests(new ProjectSessionCoordinator());
    expect(hasPendingCloseRequest()).toBe(false);
  });

  it('protects same-project duplicate open and fails closed on a copied duplicate identity', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Original' });
    await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-original',
    });

    const repeated = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-original-again',
    });
    expect(repeated).toMatchObject({ ok: true, data: { activation: 'already-active' } });
    expect(repeated.snapshot.generation).toBe(1);

    const clonePath = join(parent, `${basename(created.projectPath)}-copy`);
    await cp(created.projectPath, clonePath, { recursive: true });
    const duplicate = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: clonePath,
      operationId: 'open-clone',
    });
    expect(duplicate).toMatchObject({ ok: false, error: { code: 'DUPLICATE_PROJECT_IDENTITY' } });
    expect(duplicate.snapshot.project.path).toBe(created.projectPath);
  });

  it('preserves the valid active project after a missing recent path fails', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Still Active' });
    await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-valid',
    });

    const failed = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: join(parent, 'missing-project'),
      operationId: 'open-missing',
    });
    expect(failed).toMatchObject({
      ok: false,
      error: { code: 'PROJECT_NOT_FOUND' },
      snapshot: { project: { projectId: created.projectId } },
    });
  });

  it('rejects a late project-open result after a newer request wins', async () => {
    let resolveSlow: ((project: LoadedProject) => void) | null = null;
    const slow = new Promise<LoadedProject>((resolve) => {
      resolveSlow = resolve;
    });
    const loadProject = vi.fn((projectPath: string) =>
      projectPath.endsWith('slow')
        ? slow
        : Promise.resolve(syntheticProject('proj_fast', 'C:\\projects\\fast')),
    );
    resetProjectSpineForTests(new ProjectSessionCoordinator());
    electronMocks.handlers.clear();
    registerProjectSpineIpc({
      coordinator: new ProjectSessionCoordinator(),
      recentStorePath: testRecentStorePath,
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      loadProject,
    });

    const slowOpen = invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: 'C:\\projects\\slow',
      operationId: 'slow-open',
    });
    await vi.waitFor(() => expect(loadProject).toHaveBeenCalledTimes(1));
    const fastOpen = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: 'C:\\projects\\fast',
      operationId: 'fast-open',
    });
    expect(fastOpen).toMatchObject({ ok: true, snapshot: { project: { projectId: 'proj_fast' } } });

    resolveSlow!(syntheticProject('proj_slow', 'C:\\projects\\slow'));
    const superseded = await slowOpen;
    expect(superseded).toMatchObject({
      ok: false,
      error: { code: 'STALE_SESSION' },
      snapshot: { project: { projectId: 'proj_fast' }, lastError: null },
    });
  });

  it('drops stale Project A mutations without contaminating Project B status', async () => {
    const parent = await temporaryRoot();
    const createdA = await bootstrapFreshProject({ parentPath: parent, title: 'Project A' });
    const createdB = await bootstrapFreshProject({ parentPath: parent, title: 'Project B' });
    const openedA = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: createdA.projectPath,
      operationId: 'open-a-for-stale',
    });
    await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: createdB.projectPath,
      operationId: 'open-b-for-stale',
    });

    const stale = await invoke(PROJECT_SPINE_CHANNELS.setUnitDirty, 1, {
      projectId: createdA.projectId,
      projectPath: createdA.projectPath,
      generation: openedA.snapshot.generation,
      operationId: 'late-dirty-a',
      unitId: 'unit_a',
      dirty: true,
    });
    expect(stale).toMatchObject({
      ok: false,
      error: { code: 'STALE_SESSION' },
      snapshot: { project: { projectId: createdB.projectId }, lastError: null },
    });
  });

  it('enforces Writing Studio mutation authority in the main process', async () => {
    await expect(
      invoke(PROJECT_SPINE_CHANNELS.saveUnit, 2, {
        projectId: 'proj_x',
        projectPath: 'C:\\projects\\x',
        generation: 1,
        operationId: 'command-save',
        unitId: 'unit_1',
        expectedMarkdown: '',
        markdown: '',
      }),
    ).rejects.toMatchObject({ code: 'WRONG_WINDOW_ROLE' });

    await expect(invoke(PROJECT_SPINE_CHANNELS.createUnit, 2, {})).rejects.toMatchObject({
      code: 'WRONG_WINDOW_ROLE',
    });
  });

  it('removes a recent reference without deleting the project directory', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Keep Files' });
    await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-keep',
    });

    const removed = await invoke(PROJECT_SPINE_CHANNELS.removeRecent, 1, {
      path: created.projectPath,
      operationId: 'remove-reference',
    });
    expect(removed.ok).toBe(true);
    expect(removed.snapshot.recentProjects).toEqual([]);
    await expect(stat(created.projectPath)).resolves.toMatchObject({});
  });

  it('restores durable recent references after a normal application restart', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Reopen Me' });
    await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-before-restart',
    });

    resetProjectSpineForTests(new ProjectSessionCoordinator());
    electronMocks.handlers.clear();
    registerProjectSpineIpc({
      coordinator: new ProjectSessionCoordinator(),
      recentStorePath: testRecentStorePath,
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
    });

    const restarted = await invoke(PROJECT_SPINE_CHANNELS.getSession, 1);
    expect(restarted.project).toBeNull();
    expect(restarted.recentProjects).toEqual([
      expect.objectContaining({ path: created.projectPath, title: 'Reopen Me', stale: false }),
    ]);

    const reopened = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-after-restart',
    });
    expect(reopened).toMatchObject({ ok: true, snapshot: { project: { projectId: created.projectId } } });
  });

  it('reports dirty and saved only around a generation-bound durable write', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Save Project' });
    const withUnit = await createManuscriptUnit(
      await loadProjectForSpine(created.projectPath),
      'Save Unit',
    );
    const opened = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-save-project',
    });
    const binding = {
      projectId: created.projectId,
      projectPath: created.projectPath,
      generation: opened.snapshot.generation,
    };
    await invoke(PROJECT_SPINE_CHANNELS.setUnitDirty, 1, {
      ...binding,
      operationId: 'dirty-save-unit',
      unitId: withUnit.unitId,
      dirty: true,
    });
    const commandDirty = await invoke(PROJECT_SPINE_CHANNELS.getSession, 2);
    expect(commandDirty).toMatchObject({
      dirtyUnitIds: [withUnit.unitId],
      saveState: { status: 'dirty', unitId: withUnit.unitId },
    });

    const expectedMarkdown = opened.snapshot.project.drafts[withUnit.unitId];
    const acceptedMarkdown = `${expectedMarkdown}Exact accepted prose.\n`;
    const saved = await invoke(PROJECT_SPINE_CHANNELS.saveUnit, 1, {
      ...binding,
      operationId: 'save-save-unit',
      unitId: withUnit.unitId,
      expectedMarkdown,
      markdown: acceptedMarkdown,
    });
    expect(saved).toMatchObject({
      ok: true,
      snapshot: { dirtyUnitIds: [], saveState: { status: 'saved', unitId: withUnit.unitId } },
    });
    expect((await loadProjectForSpine(created.projectPath)).drafts[withUnit.unitId]).toBe(
      acceptedMarkdown,
    );
  });

  it('never reports saved after a stale-source conflict', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Conflict Project' });
    const withUnit = await createManuscriptUnit(
      await loadProjectForSpine(created.projectPath),
      'Conflict Unit',
    );
    const opened = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-conflict-project',
    });
    const binding = {
      projectId: created.projectId,
      projectPath: created.projectPath,
      generation: opened.snapshot.generation,
    };
    await invoke(PROJECT_SPINE_CHANNELS.setUnitDirty, 1, {
      ...binding,
      operationId: 'dirty-conflict-unit',
      unitId: withUnit.unitId,
      dirty: true,
    });

    const conflicted = await invoke(PROJECT_SPINE_CHANNELS.saveUnit, 1, {
      ...binding,
      operationId: 'save-conflict-unit',
      unitId: withUnit.unitId,
      expectedMarkdown: 'stale baseline',
      markdown: 'replacement that must not land',
    });
    expect(conflicted).toMatchObject({
      ok: false,
      error: { code: 'STALE_DRAFT' },
      snapshot: {
        dirtyUnitIds: [withUnit.unitId],
        saveState: { status: 'save-failed', unitId: withUnit.unitId },
      },
    });
    expect((await loadProjectForSpine(created.projectPath)).drafts[withUnit.unitId]).toBe(
      withUnit.project.drafts[withUnit.unitId],
    );
  });
});
