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
  it('detects ordered prior-session candidates and preserves corrupt evidence as degraded', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const prior = new ProjectSpineRecoveryCheckpointService('origin-prior');
    await prior.capture(() => context(active), 'unit_2', 'Prior two');
    await prior.capture(() => context(active), 'unit_1', '');

    const current = new ProjectSpineRecoveryCheckpointService('origin-current');
    await expect(current.detectPriorSessionRecovery(() => context(active))).resolves.toMatchObject({
      status: 'decision-required',
      candidates: [
        { unitId: 'unit_1', prose: '', decision: 'available' },
        { unitId: 'unit_2', prose: 'Prior two', decision: 'available' },
      ],
    });

    const repository = new ProjectSpineRecoveryRepository(projectPath);
    await writeFile(repository.artifactPath, '{not-json', 'utf8');
    await expect(current.detectPriorSessionRecovery(() => context(active))).resolves.toEqual({
      status: 'degraded',
      reason: 'corrupt-artifact',
      message: 'The recovery artifact does not contain valid JSON.',
      candidates: [],
    });
    await expect(readFile(repository.artifactPath, 'utf8')).resolves.toBe('{not-json');
  });

  it('preserves a mixed-origin envelope as degraded instead of inventing mixed-session authority', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const prior = new ProjectSpineRecoveryCheckpointService('origin-prior');
    await prior.capture(() => context(active), 'unit_1', 'Prior one');
    await prior.capture(() => context(active), 'unit_2', 'Prior two');
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const read = await repository.read();
    if (!read.ok || read.data.status !== 'present') throw new Error('Expected recovery evidence.');
    await writeFile(repository.artifactPath, `${JSON.stringify({
      ...read.data.envelope,
      candidates: [
        read.data.envelope.candidates[0],
        { ...read.data.envelope.candidates[1], originSessionId: 'origin-other-prior' },
      ],
    }, null, 2)}\n`, 'utf8');
    const before = await readFile(repository.artifactPath, 'utf8');

    const current = new ProjectSpineRecoveryCheckpointService('origin-current');
    await expect(current.detectPriorSessionRecovery(() => context(active))).resolves.toEqual({
      status: 'degraded',
      reason: 'corrupt-artifact',
      message: 'The recovery artifact combines candidates from multiple origin sessions.',
      candidates: [],
    });
    await expect(readFile(repository.artifactPath, 'utf8')).resolves.toBe(before);
  });

  it('rebinds the complete accepted set atomically to the current session with advanced versions', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const prior = new ProjectSpineRecoveryCheckpointService('origin-prior');
    await prior.capture(() => context(active), 'unit_1', 'Prior one');
    await prior.capture(() => context(active), 'unit_2', 'Prior two');
    const current = new ProjectSpineRecoveryCheckpointService('origin-current');
    const detected = await current.detectPriorSessionRecovery(() => context(active));
    expect(detected.status).toBe('decision-required');
    if (detected.status !== 'decision-required') return;
    const selected: Array<{
      projectId: string;
      projectPath: string;
      unitId: string;
      originSessionId: string;
      candidateVersion: number;
      durableBaselineFingerprint: string;
    }> = [];
    const requestFor = (index: number) => ({
      projectId: active.projectId,
      projectPath,
      generation: 1,
      operationId: `accept-${index}`,
      unitId: detected.candidates[index].unitId,
      originSessionId: detected.candidates[index].originSessionId,
      candidateVersion: detected.candidates[index].candidateVersion,
      durableBaselineFingerprint: detected.candidates[index].durableBaselineFingerprint,
    });

    await expect(current.acceptPriorSessionCandidate(
      () => context(active),
      requestFor(0),
      (candidate) => {
        selected.push({
          projectId: candidate.projectId,
          projectPath: candidate.projectPath,
          unitId: candidate.unitId,
          originSessionId: candidate.originSessionId,
          candidateVersion: candidate.candidateVersion,
          durableBaselineFingerprint: candidate.durableBaselineFingerprint,
        });
        return { remainingDecisionCount: 1 };
      },
      vi.fn(),
    )).resolves.toMatchObject({ resolution: 'decisions-remaining' });
    const rebound = vi.fn();
    await expect(current.acceptPriorSessionCandidate(
      () => context(active, 7),
      requestFor(1),
      (candidate) => {
        selected.push({
          projectId: candidate.projectId,
          projectPath: candidate.projectPath,
          unitId: candidate.unitId,
          originSessionId: candidate.originSessionId,
          candidateVersion: candidate.candidateVersion,
          durableBaselineFingerprint: candidate.durableBaselineFingerprint,
        });
        return { remainingDecisionCount: 0, acceptedCandidates: selected };
      },
      rebound,
    )).resolves.toMatchObject({ resolution: 'accepted-ready-to-apply' });

    expect(rebound).toHaveBeenCalledOnce();
    const read = await new ProjectSpineRecoveryRepository(projectPath).read();
    expect(read).toMatchObject({
      ok: true,
      data: {
        status: 'present',
        envelope: {
          candidates: [
            { unitId: 'unit_1', originSessionId: 'origin-current', candidateVersion: 2, prose: 'Prior one' },
            { unitId: 'unit_2', originSessionId: 'origin-current', candidateVersion: 2, prose: 'Prior two' },
          ],
        },
      },
    });
  });

  it('rejects only an exact six-field candidate and leaves stale requests fail-closed', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const prior = new ProjectSpineRecoveryCheckpointService('origin-prior');
    await prior.capture(() => context(active), 'unit_1', 'Prior one');
    const current = new ProjectSpineRecoveryCheckpointService('origin-current');
    const detected = await current.detectPriorSessionRecovery(() => context(active));
    if (detected.status !== 'decision-required') throw new Error('Expected recovery candidates.');
    const candidate = detected.candidates[0];
    const request = {
      projectId: active.projectId,
      projectPath,
      generation: 1,
      operationId: 'reject',
      unitId: candidate.unitId,
      originSessionId: candidate.originSessionId,
      candidateVersion: candidate.candidateVersion,
      durableBaselineFingerprint: candidate.durableBaselineFingerprint,
    };
    const onDeleted = vi.fn(() => ({ remainingDecisionCount: 0 }));
    const onRebound = vi.fn();

    await expect(current.rejectPriorSessionCandidate(
      () => context(active),
      { ...request, candidateVersion: request.candidateVersion + 1 },
      onDeleted,
      onRebound,
    )).rejects.toMatchObject({ code: 'RECOVERY_UNAVAILABLE' });
    expect(onDeleted).not.toHaveBeenCalled();
    await expect(current.rejectPriorSessionCandidate(
      () => context(active), request, onDeleted, onRebound,
    )).resolves.toMatchObject({ resolution: 'resolved-without-recovery' });
    await expect(new ProjectSpineRecoveryRepository(projectPath).read()).resolves.toMatchObject({
      ok: true,
      data: { status: 'missing' },
    });
  });

  it('finalizes selected accepts when the last remaining decision is a rejection', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const prior = new ProjectSpineRecoveryCheckpointService('origin-prior');
    await prior.capture(() => context(active), 'unit_1', 'Keep one');
    await prior.capture(() => context(active), 'unit_2', 'Reject two');
    const current = new ProjectSpineRecoveryCheckpointService('origin-current');
    const detected = await current.detectPriorSessionRecovery(() => context(active));
    if (detected.status !== 'decision-required') throw new Error('Expected recovery candidates.');
    const correlation = (index: number) => ({
      projectId: active.projectId,
      projectPath,
      generation: 1,
      operationId: `mixed-${index}`,
      unitId: detected.candidates[index].unitId,
      originSessionId: detected.candidates[index].originSessionId,
      candidateVersion: detected.candidates[index].candidateVersion,
      durableBaselineFingerprint: detected.candidates[index].durableBaselineFingerprint,
    });
    const acceptedCorrelation = {
      projectId: active.projectId,
      projectPath,
      unitId: detected.candidates[0].unitId,
      originSessionId: detected.candidates[0].originSessionId,
      candidateVersion: detected.candidates[0].candidateVersion,
      durableBaselineFingerprint: detected.candidates[0].durableBaselineFingerprint,
    };
    await current.acceptPriorSessionCandidate(
      () => context(active),
      correlation(0),
      () => ({ remainingDecisionCount: 1 }),
      vi.fn(),
    );
    const onRebound = vi.fn();
    await expect(current.rejectPriorSessionCandidate(
      () => context(active, 8),
      correlation(1),
      () => ({ remainingDecisionCount: 0, acceptedCandidates: [acceptedCorrelation] }),
      onRebound,
    )).resolves.toMatchObject({ resolution: 'accepted-ready-to-apply' });
    expect(onRebound).toHaveBeenCalledWith([
      expect.objectContaining({ unitId: 'unit_1', originSessionId: 'origin-current', prose: 'Keep one' }),
    ]);
    await expect(new ProjectSpineRecoveryRepository(projectPath).read()).resolves.toMatchObject({
      ok: true,
      data: {
        status: 'present',
        envelope: { candidates: [{ unitId: 'unit_1', originSessionId: 'origin-current' }] },
      },
    });
  });

  it('keeps the prior-session envelope intact when atomic accepted-set rebinding fails', async () => {
    const projectPath = await temporaryProject();
    const active = project(projectPath);
    const prior = new ProjectSpineRecoveryCheckpointService('origin-prior');
    await prior.capture(() => context(active), 'unit_1', 'Protected prior prose');
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const before = await readFile(repository.artifactPath, 'utf8');
    const current = new ProjectSpineRecoveryCheckpointService('origin-current', {
      repositoryFactory: (root) => new ProjectSpineRecoveryRepository(root, {
        replaceFile: vi.fn(async () => { throw new Error('atomic replace unavailable'); }),
      }),
    });
    const detected = await current.detectPriorSessionRecovery(() => context(active));
    if (detected.status !== 'decision-required') throw new Error('Expected recovery candidates.');
    const candidate = detected.candidates[0];
    const accepted = {
      projectId: candidate.projectId,
      projectPath: candidate.projectPath,
      unitId: candidate.unitId,
      originSessionId: candidate.originSessionId,
      candidateVersion: candidate.candidateVersion,
      durableBaselineFingerprint: candidate.durableBaselineFingerprint,
    };

    await expect(current.acceptPriorSessionCandidate(
      () => context(active),
      {
        ...accepted,
        generation: 1,
        operationId: 'failed-rebind',
      },
      () => ({ remainingDecisionCount: 0, acceptedCandidates: [accepted] }),
      vi.fn(),
    )).rejects.toMatchObject({ code: 'RECOVERY_WRITE_FAILED' });
    await expect(readFile(repository.artifactPath, 'utf8')).resolves.toBe(before);
  });

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
