import { cp, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
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
    showSaveDialog: vi.fn(),
    showMessageBox: vi.fn(),
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
  dialog: {
    showOpenDialog: electronMocks.showOpenDialog,
    showSaveDialog: electronMocks.showSaveDialog,
    showMessageBox: electronMocks.showMessageBox,
  },
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
import { ProjectSpineRecoveryCheckpointService } from '../projectSpineRecoveryCheckpoints';
import { ProjectSpineRecoveryRepository } from '../projectSpineRecoveryRepository';
import { writeMarkdownAtomic } from '../projectSpineMarkdownExport';
import {
  consumeCoordinatedCloseAllowance,
  createPendingCloseRequest,
  grantCoordinatedCloseAllowance,
  hasPendingCloseRequest,
} from '../closeConfirmationCoordinator';

const temporaryRoots: string[] = [];
let testRecentStorePath = '';
let testCoordinator: ProjectSessionCoordinator;
let focusWritingWindow: ReturnType<typeof vi.fn>;

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
    electronMocks.showSaveDialog.mockReset();
    electronMocks.showMessageBox.mockReset();
    electronMocks.showMessageBox.mockResolvedValue({ response: 1 });
    const root = await temporaryRoot();
    testRecentStorePath = join(root, 'recents.json');
    testCoordinator = new ProjectSessionCoordinator();
    focusWritingWindow = vi.fn();
    resetProjectSpineForTests(testCoordinator);
    registerProjectSpineIpc({
      originSessionId: 'test-origin-session',
      coordinator: testCoordinator,
      recentStorePath: testRecentStorePath,
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      publishSession: vi.fn(),
      focusWritingWindow,
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

  it('reloads the active Writing Studio project after durable Apply and invalidates the prior generation', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Reload Project' });
    await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, { path: created.projectPath, operationId: 'open-reload' });
    const before = await invoke(PROJECT_SPINE_CHANNELS.getSession, 1);
    const createdOnDisk = await createManuscriptUnit(testCoordinator.getActiveProject()!, 'Applied Unit');

    const reloaded = await invoke(PROJECT_SPINE_CHANNELS.reloadActiveProject, 1, {
      projectId: created.projectId,
      projectPath: created.projectPath,
      generation: before.generation,
      operationId: 'reload-after-apply',
    });
    expect(reloaded).toMatchObject({ ok: true, data: { activation: 'reloaded' } });
    expect(reloaded.snapshot.generation).toBe(before.generation + 1);
    expect(reloaded.snapshot.project.units).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: createdOnDisk.unitId, title: 'Applied Unit' }),
    ]));
    await expect(invoke(PROJECT_SPINE_CHANNELS.reloadActiveProject, 2, {
      projectId: created.projectId,
      projectPath: created.projectPath,
      generation: reloaded.snapshot.generation,
      operationId: 'command-reload',
    })).rejects.toMatchObject({ code: 'WRONG_WINDOW_ROLE' });
  });

  it('exports a clean immutable main-owned Markdown snapshot with exact evidence', async () => {
    const root = await temporaryRoot();
    const target = join(root, 'outside-project.md');
    const project: LoadedProject = {
      ...syntheticProject('proj_export', join(root, 'project')),
      name: 'Export Project',
      outline: {
        ...syntheticProject('proj_export', join(root, 'project')).outline,
        scenes: [
          { id: 'unit_b', order: 2, title: '', beat_refs: [] },
          { id: 'unit_a', order: 1, title: '# Opening', beat_refs: [] },
        ],
      },
      scenes: [
        { id: 'unit_b', order: 2, title: '' },
        { id: 'unit_a', order: 1, title: '# Opening' },
      ],
      drafts: {
        unit_a: '---\nid: unit_a\ntitle: "# Opening"\norder: 1\n---\nFirst body.\n',
        unit_b: '---\nid: unit_b\ntitle: ""\norder: 2\n---\n',
      },
    };
    testCoordinator.activateProject(project);
    electronMocks.showSaveDialog.mockResolvedValue({ canceled: false, filePath: target });

    const before = testCoordinator.snapshot('writing');
    const result = await invoke(PROJECT_SPINE_CHANNELS.exportMarkdown, 1, {
      projectId: project.projectId,
      projectPath: project.path,
      generation: before.generation,
      revision: before.revision,
      operationId: 'export-clean',
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        status: 'completed',
        projectId: 'proj_export',
        generation: before.generation,
        revision: before.revision,
        operationId: 'export-clean',
        destinationPath: target,
        unitCount: 2,
        orderedUnitIds: ['unit_a', 'unit_b'],
      },
      snapshot: {
        generation: before.generation,
        revision: before.revision,
        dirtyUnitIds: [],
        recovery: { status: 'none' },
      },
    });
    expect(result.data.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.data.sourceSnapshotFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(result.data.byteLength).toBe(Buffer.byteLength(await readFile(target, 'utf8')));
    expect(await readFile(target, 'utf8')).toBe(
      '# Export Project\n\n## \\# Opening\n\nFirst body.\n\n## Untitled\n',
    );
    expect(testCoordinator.snapshot('writing')).toEqual(before);
  });

  it('finishes an immutable Project A snapshot without retargeting after a later project switch', async () => {
    const root = await temporaryRoot();
    const target = join(root, 'project-a-export.md');
    const projectA: LoadedProject = {
      ...syntheticProject('proj_a_export', join(root, 'project-a')),
      name: 'Project A',
      outline: {
        ...syntheticProject('proj_a_export', join(root, 'project-a')).outline,
        scenes: [{ id: 'unit_a', order: 1, title: 'A', beat_refs: [] }],
      },
      scenes: [{ id: 'unit_a', order: 1, title: 'A' }],
      drafts: { unit_a: '---\nid: unit_a\n---\nProject A body\n' },
    };
    const projectB = syntheticProject('proj_b_active', join(root, 'project-b'));
    testCoordinator.activateProject(projectA);
    const before = testCoordinator.snapshot('writing');
    electronMocks.showSaveDialog.mockResolvedValue({ canceled: false, filePath: target });
    registerProjectSpineIpc({
      originSessionId: 'test-origin-session',
      coordinator: testCoordinator,
      recentStorePath: testRecentStorePath,
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      publishSession: vi.fn(),
      writeMarkdownFile: async (...args) => {
        testCoordinator.activateProject(projectB, true);
        await writeMarkdownAtomic(...args);
      },
    });

    const result = await invoke(PROJECT_SPINE_CHANNELS.exportMarkdown, 1, {
      projectId: projectA.projectId,
      projectPath: projectA.path,
      generation: before.generation,
      revision: before.revision,
      operationId: 'export-project-a',
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        status: 'completed',
        projectId: 'proj_a_export',
        generation: before.generation,
        revision: before.revision,
        operationId: 'export-project-a',
      },
      snapshot: { project: { projectId: 'proj_b_active' } },
    });
    expect(await readFile(target, 'utf8')).toBe(
      '# Project A\n\n## A\n\nProject A body\n',
    );
    expect(testCoordinator.snapshot('writing').project?.projectId).toBe('proj_b_active');
  });

  it('treats dialog cancellation and declined replacement as neutral non-mutations', async () => {
    const root = await temporaryRoot();
    const target = join(root, 'existing.md');
    await writeFile(target, 'original\n', 'utf8');
    const project = syntheticProject('proj_cancel', join(root, 'project'));
    testCoordinator.activateProject(project);
    const before = testCoordinator.snapshot('writing');
    const request = {
      projectId: project.projectId,
      projectPath: project.path,
      generation: before.generation,
      revision: before.revision,
      operationId: 'export-cancel',
    };

    electronMocks.showSaveDialog.mockResolvedValueOnce({ canceled: true });
    expect(await invoke(PROJECT_SPINE_CHANNELS.exportMarkdown, 1, request)).toMatchObject({
      ok: true,
      data: { status: 'cancelled', operationId: 'export-cancel' },
    });
    expect(testCoordinator.snapshot('writing')).toEqual(before);

    electronMocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: target });
    electronMocks.showMessageBox.mockResolvedValueOnce({ response: 1 });
    expect(await invoke(PROJECT_SPINE_CHANNELS.exportMarkdown, 1, {
      ...request,
      operationId: 'export-decline',
    })).toMatchObject({
      ok: true,
      data: { status: 'cancelled', operationId: 'export-decline' },
    });
    expect(await readFile(target, 'utf8')).toBe('original\n');
    expect(testCoordinator.snapshot('writing')).toEqual(before);
  });

  it('requires explicit replacement confirmation for the exact destination', async () => {
    const root = await temporaryRoot();
    const target = join(root, 'existing.md');
    await writeFile(target, 'original\n', 'utf8');
    const project = syntheticProject('proj_replace', join(root, 'project'));
    testCoordinator.activateProject(project);
    const before = testCoordinator.snapshot('writing');
    electronMocks.showSaveDialog.mockResolvedValue({ canceled: false, filePath: target });
    electronMocks.showMessageBox.mockResolvedValue({ response: 0 });

    const result = await invoke(PROJECT_SPINE_CHANNELS.exportMarkdown, 1, {
      projectId: project.projectId,
      projectPath: project.path,
      generation: before.generation,
      revision: before.revision,
      operationId: 'export-replace',
    });

    expect(result).toMatchObject({ ok: true, data: { status: 'completed', destinationPath: target } });
    expect(electronMocks.showMessageBox).toHaveBeenCalledWith(expect.objectContaining({
      detail: target,
      defaultId: 1,
      cancelId: 1,
    }));
    expect(await readFile(target, 'utf8')).toBe('# proj\\_replace\n');
  });

  it('blocks dirty state, freezes clean export truth before the dialog, and rejects Command Center export', async () => {
    const root = await temporaryRoot();
    const target = join(root, 'blocked.md');
    const project: LoadedProject = {
      ...syntheticProject('proj_blocked', join(root, 'project')),
      outline: {
        ...syntheticProject('proj_blocked', join(root, 'project')).outline,
        scenes: [{ id: 'unit_a', order: 1, title: 'A', beat_refs: [] }],
      },
      scenes: [{ id: 'unit_a', order: 1, title: 'A' }],
      drafts: { unit_a: '---\nid: unit_a\ntitle: A\norder: 1\n---\nSaved\n' },
    };
    testCoordinator.activateProject(project);
    const clean = testCoordinator.snapshot('writing');
    const binding = {
      projectId: project.projectId,
      projectPath: project.path,
      generation: clean.generation,
      revision: clean.revision,
      operationId: 'export-blocked',
    };

    testCoordinator.setUnitDirty(binding, 'unit_a', true);
    const dirtyBefore = testCoordinator.snapshot('writing');
    expect(await invoke(PROJECT_SPINE_CHANNELS.exportMarkdown, 1, {
      ...binding,
      revision: dirtyBefore.revision,
    })).toMatchObject({
      ok: false,
      error: { code: 'EXPORT_BLOCKED', message: 'Save the project successfully before exporting.' },
    });
    expect(testCoordinator.snapshot('writing')).toEqual(dirtyBefore);
    expect(electronMocks.showSaveDialog).not.toHaveBeenCalled();

    testCoordinator.setUnitDirty({
      ...binding,
      operationId: 'clean-again',
    }, 'unit_a', false);
    const ready = testCoordinator.snapshot('writing');
    electronMocks.showSaveDialog.mockImplementationOnce(async () => {
      testCoordinator.selectUnit({
        projectId: project.projectId!,
        projectPath: project.path,
        generation: ready.generation,
        operationId: 'change-during-dialog',
      }, 'unit_a');
      return { canceled: false, filePath: target };
    });
    expect(await invoke(PROJECT_SPINE_CHANNELS.exportMarkdown, 1, {
      projectId: project.projectId,
      projectPath: project.path,
      generation: ready.generation,
      revision: ready.revision,
      operationId: 'export-stale-dialog',
    })).toMatchObject({
      ok: true,
      data: {
        status: 'completed',
        projectId: project.projectId,
        generation: ready.generation,
        revision: ready.revision,
      },
    });
    await expect(readFile(target, 'utf8')).resolves.toContain('Saved');

    expect(await invoke(PROJECT_SPINE_CHANNELS.exportMarkdown, 2, {
      projectId: project.projectId,
      projectPath: project.path,
      generation: testCoordinator.snapshot('command').generation,
      revision: testCoordinator.snapshot('command').revision,
      operationId: 'command-export',
    })).toMatchObject({ ok: false, error: { code: 'WRONG_WINDOW_ROLE' } });
  });

  it('validates correlated close-confirmation responses without mutating state on rejection', async () => {
    const request = createPendingCloseRequest('proj_a', 7, 1)!;
    const valid = { correlationId: request.correlationId, projectId: 'proj_a', generation: 7, decision: 'keep-editing' as const };
    expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, 1, valid)).toMatchObject({ ok: true });
    expect(focusWritingWindow).toHaveBeenCalledTimes(1);
    expect(hasPendingCloseRequest()).toBe(false);
    expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, 1, valid)).toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });

    const discardProject: LoadedProject = {
      ...syntheticProject('proj_b', 'C:\\projects\\b'),
      outline: { ...syntheticProject('proj_b', 'C:\\projects\\b').outline, scenes: [{ id: 'unit_b', order: 1, title: 'Unit B', beat_refs: [] }] },
      scenes: [{ id: 'unit_b', order: 1, title: 'Unit B' }],
      drafts: { unit_b: 'durable' },
    };
    testCoordinator.activateProject(discardProject);
    testCoordinator.setUnitDirty({ projectId: 'proj_b', projectPath: 'C:\\projects\\b', generation: 1, operationId: 'dirty' }, 'unit_b', true);
    const discard = createPendingCloseRequest('proj_b', 1, 1)!;
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

  it('allows only Writing Studio to re-activate its owning window after a native dialog', async () => {
    expect(await invoke(PROJECT_SPINE_CHANNELS.focusWritingWindow, 1)).toMatchObject({ ok: true });
    expect(focusWritingWindow).toHaveBeenCalledTimes(1);
    await expect(invoke(PROJECT_SPINE_CHANNELS.focusWritingWindow, 2)).rejects.toMatchObject({
      code: 'WRONG_WINDOW_ROLE',
    });
    expect(focusWritingWindow).toHaveBeenCalledTimes(1);
  });

  it('keeps editing without granting a close allowance, initiating shutdown, or changing dirty session state', async () => {
    const initiateCoordinatedShutdown = vi.fn();
    electronMocks.handlers.clear();
    const project: LoadedProject = {
      ...syntheticProject('proj_keep', 'C:\\projects\\keep'),
      outline: {
        ...syntheticProject('proj_keep', 'C:\\projects\\keep').outline,
        scenes: [{ id: 'unit_keep', order: 1, title: 'Keep unit', beat_refs: [] }],
      },
      scenes: [{ id: 'unit_keep', order: 1, title: 'Keep unit' }],
      drafts: { unit_keep: 'durable' },
    };
    testCoordinator.activateProject(project);
    testCoordinator.setUnitDirty(
      { projectId: project.projectId, projectPath: project.path, generation: 1, operationId: 'dirty-keep' },
      'unit_keep',
      true,
    );
    registerProjectSpineIpc({
      originSessionId: 'test-origin-session',
      coordinator: testCoordinator,
      recentStorePath: testRecentStorePath,
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      initiateCoordinatedShutdown,
    });
    const request = createPendingCloseRequest(project.projectId, 1, 1)!;

    expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, 1, {
      ...request,
      decision: 'keep-editing',
    })).toMatchObject({ ok: true });
    expect(hasPendingCloseRequest()).toBe(false);
    expect(consumeCoordinatedCloseAllowance()).toBe(false);
    expect(initiateCoordinatedShutdown).not.toHaveBeenCalled();
    expect(testCoordinator.snapshot('writing')).toMatchObject({
      project: { projectId: project.projectId },
      generation: 1,
      dirtyUnitIds: ['unit_keep'],
    });
  });

  it('keeps the close decision pending when exact recovery cleanup fails', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Cleanup Failure' });
    const withUnit = await createManuscriptUnit(
      await loadProjectForSpine(created.projectPath),
      'Cleanup Unit',
    );
    const opened = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-cleanup-failure',
    });
    const binding = {
      projectId: created.projectId,
      projectPath: created.projectPath,
      generation: opened.snapshot.generation,
      unitId: withUnit.unitId,
    };
    await invoke(PROJECT_SPINE_CHANNELS.setUnitDirty, 1, {
      ...binding,
      operationId: 'dirty-cleanup-failure',
      dirty: true,
    });
    await invoke(PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint, 1, {
      ...binding,
      operationId: 'checkpoint-cleanup-failure',
      prose: 'Protected cleanup prose',
    });
    const keepRequest = createPendingCloseRequest(created.projectId, opened.snapshot.generation, 1)!;
    expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, 1, {
      ...keepRequest,
      decision: 'keep-editing',
    })).toMatchObject({ ok: true });
    await expect(new ProjectSpineRecoveryRepository(created.projectPath).read()).resolves.toMatchObject({
      ok: true,
      data: { status: 'present', envelope: { candidates: [expect.objectContaining({ prose: 'Protected cleanup prose' })] } },
    });
    const initiateCoordinatedShutdown = vi.fn();
    electronMocks.handlers.clear();
    registerProjectSpineIpc({
      originSessionId: 'test-origin-session',
      coordinator: testCoordinator,
      recentStorePath: testRecentStorePath,
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      initiateCoordinatedShutdown,
      recoveryCheckpoints: new ProjectSpineRecoveryCheckpointService('test-origin-session', {
        repositoryFactory: (root) => new ProjectSpineRecoveryRepository(root, {
          deleteArtifact: vi.fn(async () => { throw new Error('cleanup unavailable'); }),
        }),
      }),
    });
    const request = createPendingCloseRequest(created.projectId, opened.snapshot.generation, 1)!;

    expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, 1, {
      ...request,
      decision: 'discard',
    })).toMatchObject({ ok: false, error: { code: 'RECOVERY_CLEANUP_FAILED' } });
    expect(initiateCoordinatedShutdown).not.toHaveBeenCalled();
    expect(hasPendingCloseRequest()).toBe(true);
    expect(testCoordinator.snapshot('writing').dirtyUnitIds).toEqual([withUnit.unitId]);

    electronMocks.handlers.clear();
    registerProjectSpineIpc({
      originSessionId: 'test-origin-session',
      coordinator: testCoordinator,
      recentStorePath: testRecentStorePath,
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      initiateCoordinatedShutdown,
    });
    expect(await invoke(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, 1, {
      ...request,
      decision: 'discard',
    })).toMatchObject({ ok: true });
    expect(initiateCoordinatedShutdown).toHaveBeenCalledTimes(1);
    expect(hasPendingCloseRequest()).toBe(false);
    await expect(new ProjectSpineRecoveryRepository(created.projectPath).read()).resolves.toEqual({
      ok: true,
      data: { status: 'missing', envelope: null },
    });
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

  it('waits for first-activation recovery detection before a concurrent already-active open publishes', async () => {
    const active = syntheticProject('proj_detect', 'C:\\projects\\detect');
    let resolveDetection: ((state: {
      status: 'degraded';
      reason: 'read-failed';
      message: string;
      candidates: [];
    }) => void) | null = null;
    const detection = new Promise<{
      status: 'degraded';
      reason: 'read-failed';
      message: string;
      candidates: [];
    }>((resolve) => {
      resolveDetection = resolve;
    });
    const recoveryCheckpoints = new ProjectSpineRecoveryCheckpointService('test-origin-session');
    const detect = vi.spyOn(recoveryCheckpoints, 'detectPriorSessionRecovery')
      .mockImplementationOnce(() => detection);
    electronMocks.handlers.clear();
    registerProjectSpineIpc({
      originSessionId: 'test-origin-session',
      coordinator: testCoordinator,
      recentStorePath: testRecentStorePath,
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      loadProject: vi.fn(async () => active),
      recoveryCheckpoints,
    });

    const first = invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: active.path,
      operationId: 'open-detect-first',
    });
    await vi.waitFor(() => expect(detect).toHaveBeenCalledTimes(1));
    const second = invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: active.path,
      operationId: 'open-detect-second',
    });
    resolveDetection!({
      status: 'degraded',
      reason: 'read-failed',
      message: 'Detection completed before publication.',
      candidates: [],
    });

    await expect(first).resolves.toMatchObject({
      ok: false,
      error: { code: 'STALE_SESSION' },
    });
    await expect(second).resolves.toMatchObject({
      ok: true,
      data: { activation: 'already-active' },
      snapshot: {
        recovery: {
          status: 'degraded',
          message: 'Detection completed before publication.',
        },
      },
    });
    expect(detect).toHaveBeenCalledTimes(1);
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
      originSessionId: 'test-origin-session',
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
        submittedProse: '',
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
      originSessionId: 'restart-origin-session',
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
      commandStatus: {
        projectId: created.projectId,
        recovery: 'none',
        save: 'dirty',
      },
    });

    const expectedMarkdown = opened.snapshot.project.drafts[withUnit.unitId];
    const acceptedMarkdown = `${expectedMarkdown}Exact accepted prose.\n`;
    const saved = await invoke(PROJECT_SPINE_CHANNELS.saveUnit, 1, {
      ...binding,
      operationId: 'save-save-unit',
      unitId: withUnit.unitId,
      expectedMarkdown,
      markdown: acceptedMarkdown,
      submittedProse: 'Exact accepted prose.',
    });
    expect(saved).toMatchObject({
      ok: true,
      snapshot: { dirtyUnitIds: [], saveState: { status: 'saved', unitId: withUnit.unitId } },
    });
    expect((await loadProjectForSpine(created.projectPath)).drafts[withUnit.unitId]).toBe(
      acceptedMarkdown,
    );
    expect(await invoke(PROJECT_SPINE_CHANNELS.getSession, 2)).toMatchObject({
      commandStatus: {
        projectId: created.projectId,
        recovery: 'none',
        save: 'saved',
      },
    });
  });

  it('saves prose with an intentional trailing newline using the renderer serialization contract', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Trailing Newline' });
    const withUnit = await createManuscriptUnit(
      await loadProjectForSpine(created.projectPath),
      'Trailing Newline Unit',
    );
    const opened = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-trailing-newline-project',
    });
    const binding = {
      projectId: created.projectId,
      projectPath: created.projectPath,
      generation: opened.snapshot.generation,
    };
    const expectedMarkdown = opened.snapshot.project.drafts[withUnit.unitId];
    const submittedProse = 'Retain this trailing blank line.\n';
    const acceptedMarkdown = `${expectedMarkdown}${submittedProse}\n`;

    const saved = await invoke(PROJECT_SPINE_CHANNELS.saveUnit, 1, {
      ...binding,
      operationId: 'save-trailing-newline-unit',
      unitId: withUnit.unitId,
      expectedMarkdown,
      markdown: acceptedMarkdown,
      submittedProse,
    });

    expect(saved).toMatchObject({
      ok: true,
      snapshot: { dirtyUnitIds: [], saveState: { status: 'saved', unitId: withUnit.unitId } },
    });
    expect((await loadProjectForSpine(created.projectPath)).drafts[withUnit.unitId]).toBe(
      acceptedMarkdown,
    );
  });

  it('captures prose only from Writing Studio and retires the matching candidate after Save', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Recovery Project' });
    const withUnit = await createManuscriptUnit(
      await loadProjectForSpine(created.projectPath),
      'Recovery Unit',
    );
    const opened = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-recovery-project',
    });
    const binding = {
      projectId: created.projectId,
      projectPath: created.projectPath,
      generation: opened.snapshot.generation,
    };

    await expect(invoke(PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint, 2, {
      ...binding,
      operationId: 'command-checkpoint',
      unitId: withUnit.unitId,
      prose: 'Command must not write',
    })).rejects.toMatchObject({ code: 'WRONG_WINDOW_ROLE' });
    const captured = await invoke(PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint, 1, {
      ...binding,
      operationId: 'writing-checkpoint',
      unitId: withUnit.unitId,
      prose: 'Protected prose',
    });
    expect(captured).toMatchObject({
      ok: true,
      data: { status: 'stored', candidateVersion: 1 },
    });
    await expect(new ProjectSpineRecoveryRepository(created.projectPath).read()).resolves.toMatchObject({
      ok: true,
      data: {
        status: 'present',
        envelope: {
          projectId: created.projectId,
          candidates: [expect.objectContaining({
            unitId: withUnit.unitId,
            originSessionId: 'test-origin-session',
            prose: 'Protected prose',
          })],
        },
      },
    });

    const expectedMarkdown = opened.snapshot.project.drafts[withUnit.unitId];
    await expect(invoke(PROJECT_SPINE_CHANNELS.saveUnit, 1, {
      ...binding,
      operationId: 'mismatched-recovery-prose',
      unitId: withUnit.unitId,
      expectedMarkdown,
      markdown: `${expectedMarkdown}Protected prose\n`,
      submittedProse: 'Different prose',
    })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    const saved = await invoke(PROJECT_SPINE_CHANNELS.saveUnit, 1, {
      ...binding,
      operationId: 'save-protected-prose',
      unitId: withUnit.unitId,
      expectedMarkdown,
      markdown: `${expectedMarkdown}Protected prose\n`,
      submittedProse: 'Protected prose',
    });
    expect(saved).toMatchObject({
      ok: true,
      data: { recovery: { status: 'retired', message: null } },
    });
    await expect(new ProjectSpineRecoveryRepository(created.projectPath).read()).resolves.toEqual({
      ok: true,
      data: { status: 'missing', envelope: null },
    });
  });

  it('detects prior-session prose only after activation and atomically hands accepted prose to Writing Studio', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Recovered Project' });
    const withUnit = await createManuscriptUnit(
      await loadProjectForSpine(created.projectPath),
      'Recovered Unit',
    );
    const prior = new ProjectSpineRecoveryCheckpointService('prior-origin');
    await prior.capture(
      () => ({ project: withUnit.project as LoadedProject & { projectId: string }, generation: 9, revision: 11 }),
      withUnit.unitId,
      'Recovered prior prose',
    );

    const opened = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-prior-recovery',
    });
    expect(opened).toMatchObject({
      ok: true,
      snapshot: {
        dirtyUnitIds: [],
        recovery: {
          status: 'decision-required',
          candidates: [{
            unitId: withUnit.unitId,
            originSessionId: 'prior-origin',
            prose: 'Recovered prior prose',
          }],
        },
      },
    });
    const command = await invoke(PROJECT_SPINE_CHANNELS.getSession, 2);
    expect(command).not.toHaveProperty('recovery');
    expect(command.project).not.toHaveProperty('drafts');
    expect(command.commandStatus).toMatchObject({
      projectId: created.projectId,
      generation: opened.snapshot.generation,
      recovery: 'decision-required',
      save: 'clean',
    });
    expect(JSON.stringify(command.commandStatus)).not.toContain('Recovered prior prose');
    const candidate = opened.snapshot.recovery.candidates[0];
    const request = {
      projectId: created.projectId,
      projectPath: created.projectPath,
      generation: opened.snapshot.generation,
      operationId: 'accept-prior-recovery',
      unitId: candidate.unitId,
      originSessionId: candidate.originSessionId,
      candidateVersion: candidate.candidateVersion,
      durableBaselineFingerprint: candidate.durableBaselineFingerprint,
    };
    await expect(invoke(PROJECT_SPINE_CHANNELS.acceptRecoveryCandidate, 2, request))
      .rejects.toMatchObject({ code: 'WRONG_WINDOW_ROLE' });
    const accepted = await invoke(PROJECT_SPINE_CHANNELS.acceptRecoveryCandidate, 1, request);
    expect(accepted).toMatchObject({
      ok: true,
      data: { resolution: 'accepted-ready-to-apply' },
      snapshot: {
        dirtyUnitIds: [withUnit.unitId],
        recovery: {
          status: 'accepted-pending-save',
          candidates: [{ originSessionId: 'test-origin-session', prose: 'Recovered prior prose' }],
        },
      },
    });
    expect(await invoke(PROJECT_SPINE_CHANNELS.getSession, 2)).toMatchObject({
      dirtyUnitIds: [withUnit.unitId],
      commandStatus: {
        projectId: created.projectId,
        recovery: 'accepted-pending-save',
        save: 'accepted-recovery-pending-save',
      },
    });
    await expect(new ProjectSpineRecoveryRepository(created.projectPath).read()).resolves.toMatchObject({
      ok: true,
      data: {
        status: 'present',
        envelope: { candidates: [{ originSessionId: 'test-origin-session', candidateVersion: 2 }] },
      },
    });
  });

  it('rejects stale and deleted-unit checkpoints without creating recovery evidence', async () => {
    const parent = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: parent, title: 'Stale Recovery' });
    const withUnit = await createManuscriptUnit(
      await loadProjectForSpine(created.projectPath),
      'Transient Unit',
    );
    const opened = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: created.projectPath,
      operationId: 'open-stale-recovery',
    });
    const request = {
      projectId: created.projectId,
      projectPath: created.projectPath,
      generation: opened.snapshot.generation,
      operationId: 'stale-checkpoint',
      unitId: withUnit.unitId,
      prose: 'Must not land',
    };

    await expect(invoke(PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint, 1, {
      ...request,
      generation: request.generation + 1,
    })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(invoke(PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint, 1, {
      ...request,
      operationId: 'valid-before-delete',
    })).resolves.toMatchObject({ ok: true, data: { status: 'stored' } });
    await invoke(PROJECT_SPINE_CHANNELS.deleteUnit, 1, {
      ...request,
      operationId: 'delete-transient',
      confirmNonEmpty: true,
    });
    await expect(invoke(PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint, 1, request)).resolves.toMatchObject({
      ok: false,
      error: { code: 'UNIT_NOT_FOUND' },
    });
    await expect(new ProjectSpineRecoveryRepository(created.projectPath).read()).resolves.toEqual({
      ok: true,
      data: { status: 'missing', envelope: null },
    });
  });

  it('retires current-session evidence before a discard-authorized project switch', async () => {
    const parent = await temporaryRoot();
    const createdA = await bootstrapFreshProject({ parentPath: parent, title: 'Recovery A' });
    const createdB = await bootstrapFreshProject({ parentPath: parent, title: 'Recovery B' });
    const withUnit = await createManuscriptUnit(
      await loadProjectForSpine(createdA.projectPath),
      'Project A Unit',
    );
    const openedA = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: createdA.projectPath,
      operationId: 'open-recovery-a',
    });
    const bindingA = {
      projectId: createdA.projectId,
      projectPath: createdA.projectPath,
      generation: openedA.snapshot.generation,
      unitId: withUnit.unitId,
    };
    await invoke(PROJECT_SPINE_CHANNELS.setUnitDirty, 1, {
      ...bindingA,
      operationId: 'dirty-recovery-a',
      dirty: true,
    });
    await invoke(PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint, 1, {
      ...bindingA,
      operationId: 'checkpoint-recovery-a',
      prose: 'Project A unsaved prose',
    });

    const switched = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: createdB.projectPath,
      operationId: 'switch-recovery-b',
      discardUnsaved: true,
    });
    expect(switched).toMatchObject({ ok: true, snapshot: { project: { projectId: createdB.projectId } } });
    await expect(new ProjectSpineRecoveryRepository(createdA.projectPath).read()).resolves.toEqual({
      ok: true,
      data: { status: 'missing', envelope: null },
    });
    await expect(invoke(PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint, 1, {
      ...bindingA,
      operationId: 'late-project-a-checkpoint',
      prose: 'Late A prose',
    })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
  });

  it('requires an explicit discard when a current-session checkpoint is the only unsaved-work evidence', async () => {
    const parent = await temporaryRoot();
    const createdA = await bootstrapFreshProject({ parentPath: parent, title: 'Checkpoint Guard A' });
    const createdB = await bootstrapFreshProject({ parentPath: parent, title: 'Checkpoint Guard B' });
    const withUnit = await createManuscriptUnit(
      await loadProjectForSpine(createdA.projectPath),
      'Checkpoint Guard Unit',
    );
    const openedA = await invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: createdA.projectPath,
      operationId: 'open-checkpoint-guard-a',
    });
    const bindingA = {
      projectId: createdA.projectId,
      projectPath: createdA.projectPath,
      generation: openedA.snapshot.generation,
      unitId: withUnit.unitId,
    };

    await expect(invoke(PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint, 1, {
      ...bindingA,
      operationId: 'checkpoint-without-dirty-report',
      prose: 'Protected prose from a delayed dirty report',
    })).resolves.toMatchObject({ ok: true, data: { status: 'stored' } });
    expect((await invoke(PROJECT_SPINE_CHANNELS.getSession, 1)).dirtyUnitIds).toEqual([withUnit.unitId]);

    await expect(invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: createdB.projectPath,
      operationId: 'blocked-checkpoint-switch',
    })).resolves.toMatchObject({ ok: false, error: { code: 'UNSAVED_CHANGES' } });
    await expect(new ProjectSpineRecoveryRepository(createdA.projectPath).read()).resolves.toMatchObject({
      ok: true,
      data: { status: 'present', envelope: { candidates: [{ prose: 'Protected prose from a delayed dirty report' }] } },
    });

    await expect(invoke(PROJECT_SPINE_CHANNELS.openProject, 1, {
      path: createdB.projectPath,
      operationId: 'discard-checkpoint-switch',
      discardUnsaved: true,
    })).resolves.toMatchObject({ ok: true, snapshot: { project: { projectId: createdB.projectId } } });
    await expect(new ProjectSpineRecoveryRepository(createdA.projectPath).read()).resolves.toEqual({
      ok: true,
      data: { status: 'missing', envelope: null },
    });
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
      markdown: 'replacement that must not land\n',
      submittedProse: 'replacement that must not land',
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
    expect(await invoke(PROJECT_SPINE_CHANNELS.getSession, 2)).toMatchObject({
      dirtyUnitIds: [withUnit.unitId],
      commandStatus: {
        projectId: created.projectId,
        lifecycle: 'active',
        recovery: 'none',
        save: 'save-failed',
      },
    });
  });
});
