import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => process.cwd()),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}));

import { bootstrapFreshProject } from '../projectBootstrap';
import { loadProjectFromDisk } from '../projectLoaderIpc';
import { createMainProcessSessionTruthSnapshot } from '../runtimeSessionTruth';

describe('main-process session truth classification', () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), 'black-skies-main-truth-'));
  });

  afterEach(async () => {
    await rm(workspaceRoot, { recursive: true, force: true });
  });

  it('maps startup to bootstrap runtime-only truth', () => {
    const snapshot = createMainProcessSessionTruthSnapshot({ kind: 'app-startup' });

    expect(snapshot.signal).toBe('app-startup');
    expect(snapshot.truth.runtimeTruthBoundary).toEqual({
      runtimeTruth: 'runtime-only',
      projectTruth: 'persisted',
      runtimeOwnershipSurface: 'renderer',
      projectOwnershipSurface: 'persisted-project-files',
    });
    expect(snapshot.truth.sessionLifecycle.currentState).toBe('bootstrap');
    expect(snapshot.truth.draftSessionState.classifications).toEqual(['runtime-only']);
  });

  it('maps a clean loaded project to persisted project-loaded truth', async () => {
    const created = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Clean Load Story',
    });
    const loaded = await loadProjectFromDisk(created.projectPath);
    const snapshot = createMainProcessSessionTruthSnapshot({
      kind: 'project-load-success',
      project: loaded.project,
      issues: loaded.issues,
    });

    expect(snapshot.truth.sessionLifecycle.currentState).toBe('project-loaded');
    expect(snapshot.truth.draftSessionState.classifications).toEqual(['persisted']);
    expect(snapshot.truth.runtimeTruthBoundary.runtimeTruth).toBe('runtime-only');
    expect(snapshot.truth.runtimeTruthBoundary.projectTruth).toBe('persisted');
  });

  it('maps unsupported load failures to recovery-required without normalizing them away', () => {
    const snapshot = createMainProcessSessionTruthSnapshot({
      kind: 'project-load-failure',
      errorCode: 'PROJECT_UNSUPPORTED_VERSION',
      issues: [
        {
          level: 'error',
          message: 'project.json uses an unsupported schema version.',
          detail: 'Expected schema_version "ProjectMetadata v999".',
          path: 'C:\\broken\\project.json',
        },
      ],
    });

    expect(snapshot.truth.sessionLifecycle.currentState).toBe('recover-fail-closed');
    expect(snapshot.truth.draftSessionState.classifications).toEqual([
      'runtime-only',
      'recovery-required',
    ]);
  });

  it('maps ordinary load failures to partial runtime truth', () => {
    const snapshot = createMainProcessSessionTruthSnapshot({
      kind: 'project-load-failure',
      errorCode: 'PROJECT_NOT_FOUND',
      issues: [
        {
          level: 'error',
          message: 'Project directory missing.',
          detail: 'ENOENT',
          path: 'C:\\missing\\project',
        },
      ],
    });

    expect(snapshot.truth.sessionLifecycle.currentState).toBe('recover-fail-closed');
    expect(snapshot.truth.draftSessionState.classifications).toEqual(['runtime-only', 'partial']);
  });

  it('maps graceful shutdown to runtime-only fail-closed truth', () => {
    const snapshot = createMainProcessSessionTruthSnapshot({ kind: 'graceful-shutdown' });

    expect(snapshot.truth.sessionLifecycle.currentState).toBe('recover-fail-closed');
    expect(snapshot.truth.draftSessionState.classifications).toEqual(['runtime-only']);
  });
});
