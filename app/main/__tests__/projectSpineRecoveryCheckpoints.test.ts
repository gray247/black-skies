import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LoadedProject } from '../../shared/ipc/projectLoader';
import {
  ProjectSpineRecoveryCheckpointError,
  ProjectSpineRecoveryCheckpointService,
  extractRecoveryProse,
  type ProjectSpineRecoveryCheckpointContext,
} from '../projectSpineRecoveryCheckpoints';
import { ProjectSpineRecoveryRepository } from '../projectSpineRecoveryRepository';

const temporaryRoots: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'black-skies-recovery-checkpoints-'));
  temporaryRoots.push(root);
  return path.resolve(root);
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function project(projectPath: string): LoadedProject & { projectId: string } {
  return {
    path: projectPath,
    projectId: 'proj_checkpoints',
    name: 'Checkpoint Project',
    outline: {
      schema_version: 'OutlineSchema v1',
      outline_id: 'outline_checkpoints',
      project_id: 'proj_checkpoints',
      acts: [],
      chapters: [],
      scenes: [
        { id: 'unit_1', title: 'One', order: 1 },
        { id: 'unit_2', title: 'Two', order: 2 },
      ],
    },
    scenes: [
      { id: 'unit_1', title: 'One', order: 1 },
      { id: 'unit_2', title: 'Two', order: 2 },
    ],
    drafts: {
      unit_1: '---\nid: unit_1\n---\nDurable one\n',
      unit_2: '---\nid: unit_2\n---\nDurable two\n',
    },
  };
}

function context(active: LoadedProject & { projectId: string }, revision = 4): ProjectSpineRecoveryCheckpointContext {
  return { project: active, generation: 1, revision };
}

describe('ProjectSpineRecoveryCheckpointService', () => {
  it('captures empty prose and multiple units with main-assigned monotonic versions', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const service = new ProjectSpineRecoveryCheckpointService('origin-main');

    await expect(service.capture(() => context(active), 'unit_1', '')).resolves.toEqual({
      status: 'stored',
      candidateVersion: 1,
    });
    await expect(service.capture(() => context(active, 5), 'unit_1', 'Newer one')).resolves.toEqual({
      status: 'stored',
      candidateVersion: 2,
    });
    await expect(service.capture(() => context(active, 6), 'unit_2', 'Recovered two')).resolves.toEqual({
      status: 'stored',
      candidateVersion: 1,
    });

    const read = await new ProjectSpineRecoveryRepository(projectPath).read();
    expect(read).toMatchObject({ ok: true, data: { status: 'present' } });
    if (read.ok && read.data.status === 'present') {
      expect(read.data.envelope.candidates).toEqual([
        expect.objectContaining({ unitId: 'unit_1', prose: 'Newer one', candidateVersion: 2 }),
        expect.objectContaining({ unitId: 'unit_2', prose: 'Recovered two', candidateVersion: 1 }),
      ]);
      expect(read.data.envelope.candidates[0].durableBaselineFingerprint).not.toBe(
        read.data.envelope.candidates[1].durableBaselineFingerprint,
      );
    }
  });

  it('clears only the active candidate when prose returns to the durable baseline', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const service = new ProjectSpineRecoveryCheckpointService('origin-main');
    await service.capture(() => context(active), 'unit_1', 'Unsaved one');
    await service.capture(() => context(active), 'unit_2', 'Unsaved two');

    await expect(
      service.capture(() => context(active), 'unit_1', extractRecoveryProse(active.drafts.unit_1)),
    ).resolves.toEqual({ status: 'cleared', candidateVersion: null });
    const read = await new ProjectSpineRecoveryRepository(projectPath).read();
    expect(read).toMatchObject({
      ok: true,
      data: { status: 'present', envelope: { candidates: [expect.objectContaining({ unitId: 'unit_2' })] } },
    });
  });

  it('refuses to overwrite prior-session evidence', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const prior = new ProjectSpineRecoveryCheckpointService('origin-prior');
    await prior.capture(() => context(active), 'unit_1', 'Prior evidence');
    const before = await readFile(
      new ProjectSpineRecoveryRepository(projectPath).artifactPath,
      'utf8',
    );

    const current = new ProjectSpineRecoveryCheckpointService('origin-current');
    await expect(current.capture(() => context(active), 'unit_1', 'Current prose')).rejects.toMatchObject({
      code: 'RECOVERY_UNAVAILABLE',
    });
    await expect(readFile(new ProjectSpineRecoveryRepository(projectPath).artifactPath, 'utf8')).resolves.toBe(before);
  });

  it('retires submitted prose and rebases a newer candidate after successful Save', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const service = new ProjectSpineRecoveryCheckpointService('origin-main');
    await service.capture(() => context(active), 'unit_1', 'Submitted prose');

    active.drafts.unit_1 = '---\nid: unit_1\n---\nSubmitted prose\n';
    await expect(
      service.reconcileSuccessfulSave(() => context(active, 5), 'unit_1', 'Submitted prose'),
    ).resolves.toEqual({ status: 'retired', message: null });
    await expect(new ProjectSpineRecoveryRepository(projectPath).read()).resolves.toEqual({
      ok: true,
      data: { status: 'missing', envelope: null },
    });

    active.drafts.unit_1 = '---\nid: unit_1\n---\nDurable one\n';
    await service.capture(() => context(active, 6), 'unit_1', 'Submitted again');
    await service.capture(() => context(active, 7), 'unit_1', 'Newer while saving');
    active.drafts.unit_1 = '---\nid: unit_1\n---\nSubmitted again\n';
    await expect(
      service.reconcileSuccessfulSave(() => context(active, 8), 'unit_1', 'Submitted again'),
    ).resolves.toEqual({ status: 'rebased', message: null });
    const read = await new ProjectSpineRecoveryRepository(projectPath).read();
    expect(read).toMatchObject({
      ok: true,
      data: {
        status: 'present',
        envelope: {
          candidates: [expect.objectContaining({ prose: 'Newer while saving', candidateVersion: 4 })],
        },
      },
    });
  });

  it('returns degraded Save reconciliation without touching durable manuscript sentinels', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const draftsPath = path.join(projectPath, 'drafts');
    await mkdir(draftsPath, { recursive: true });
    const draftPath = path.join(draftsPath, 'unit_1.md');
    await writeFile(draftPath, 'durable sentinel', 'utf8');
    const service = new ProjectSpineRecoveryCheckpointService('origin-main');
    await service.capture(() => context(active), 'unit_1', 'Submitted prose');
    const failing = new ProjectSpineRecoveryCheckpointService('origin-main', {
      repositoryFactory: (root) => new ProjectSpineRecoveryRepository(root, {
        deleteArtifact: vi.fn(async () => { throw new Error('delete unavailable'); }),
      }),
    });
    active.drafts.unit_1 = '---\nid: unit_1\n---\nSubmitted prose\n';

    await expect(
      failing.reconcileSuccessfulSave(() => context(active), 'unit_1', 'Submitted prose'),
    ).resolves.toMatchObject({ status: 'degraded', message: expect.stringContaining('was saved') });
    await expect(
      service.capture(() => context(active, 5), 'unit_1', 'New prose after degraded cleanup'),
    ).resolves.toEqual({ status: 'stored', candidateVersion: 2 });
    await expect(readFile(draftPath, 'utf8')).resolves.toBe('durable sentinel');
  });

  it('blocks intentional cleanup failure and restores evidence when the action fails', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const service = new ProjectSpineRecoveryCheckpointService('origin-main');
    await service.capture(() => context(active), 'unit_1', 'Keep evidence');
    const action = vi.fn(async () => 'performed');
    const failingCleanup = new ProjectSpineRecoveryCheckpointService('origin-main', {
      repositoryFactory: (root) => new ProjectSpineRecoveryRepository(root, {
        deleteArtifact: vi.fn(async () => { throw new Error('delete unavailable'); }),
      }),
    });

    await expect(
      failingCleanup.withIntentionalCleanup(() => context(active), ['unit_1'], action),
    ).rejects.toBeInstanceOf(ProjectSpineRecoveryCheckpointError);
    expect(action).not.toHaveBeenCalled();

    await expect(
      service.withIntentionalCleanup(
        () => context(active),
        ['unit_1'],
        async () => { throw new Error('action failed'); },
      ),
    ).rejects.toThrow('action failed');
    await expect(new ProjectSpineRecoveryRepository(projectPath).read()).resolves.toMatchObject({
      ok: true,
      data: { status: 'present', envelope: { candidates: [expect.objectContaining({ prose: 'Keep evidence' })] } },
    });
  });
});
