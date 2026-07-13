import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PROJECT_SPINE_RECOVERY_FILENAME,
  PROJECT_SPINE_RECOVERY_SCHEMA_VERSION,
  ProjectSpineRecoveryRepository,
  createRecoveryContentFingerprint,
  type ProjectSpineRecoveryCandidate,
  type ProjectSpineRecoveryDeletionRequest,
  type ProjectSpineRecoveryEnvelope,
  type ProjectSpineRecoveryValidationContext,
} from '../projectSpineRecoveryRepository';

const CREATED_AT = '2026-07-13T12:00:00.000Z';
const UPDATED_AT = '2026-07-13T12:05:00.000Z';
const DELETION_AT = '2026-07-13T12:10:00.000Z';
const temporaryRoots: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'black-skies-recovery-repository-'));
  temporaryRoots.push(root);
  return path.resolve(root);
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function candidate(
  projectPath: string,
  unitId = 'unit_1',
  overrides: Partial<ProjectSpineRecoveryCandidate> = {},
): ProjectSpineRecoveryCandidate {
  const baseline = unitId === 'unit_2'
    ? 'Durable two'
    : unitId === 'unit_3'
      ? 'Durable three'
      : 'Durable one';
  return {
    schemaVersion: PROJECT_SPINE_RECOVERY_SCHEMA_VERSION,
    projectId: 'proj_recovery',
    projectPath,
    unitId,
    originSessionId: 'session-origin',
    priorSessionGeneration: 1,
    priorSessionRevision: 7,
    durableBaselineFingerprint: createRecoveryContentFingerprint(baseline),
    prose: `Recovered ${unitId}`,
    candidateVersion: unitId === 'unit_2' ? 2 : 1,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...overrides,
  };
}

function envelope(
  projectPath: string,
  candidates: readonly ProjectSpineRecoveryCandidate[] = [candidate(projectPath)],
  overrides: Partial<ProjectSpineRecoveryEnvelope> = {},
): ProjectSpineRecoveryEnvelope {
  return {
    schemaVersion: PROJECT_SPINE_RECOVERY_SCHEMA_VERSION,
    projectId: 'proj_recovery',
    projectPath,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    candidates,
    ...overrides,
  };
}

function validationContext(
  projectPath: string,
  overrides: Partial<ProjectSpineRecoveryValidationContext> = {},
): ProjectSpineRecoveryValidationContext {
  return {
    mode: 'checkpoint-write',
    projectId: 'proj_recovery',
    projectPath,
    activeSessionId: 'session-origin',
    durableBaselineFingerprintByUnit: {
      unit_1: createRecoveryContentFingerprint('Durable one'),
      unit_2: createRecoveryContentFingerprint('Durable two'),
      unit_3: createRecoveryContentFingerprint('Durable three'),
    },
    ...overrides,
  };
}

function deletionRequest(
  target: ProjectSpineRecoveryCandidate,
  overrides: Partial<ProjectSpineRecoveryDeletionRequest> = {},
): ProjectSpineRecoveryDeletionRequest {
  return {
    projectId: target.projectId,
    projectPath: target.projectPath,
    unitId: target.unitId,
    originSessionId: target.originSessionId,
    candidateVersion: target.candidateVersion,
    durableBaselineFingerprint: target.durableBaselineFingerprint,
    ...overrides,
  };
}

async function writeEnvelope(
  repository: ProjectSpineRecoveryRepository,
  value: ProjectSpineRecoveryEnvelope,
): Promise<void> {
  const result = await repository.write(
    value,
    validationContext(repository.projectPath) as ProjectSpineRecoveryValidationContext & {
      readonly mode: 'checkpoint-write';
    },
  );
  expect(result).toMatchObject({ ok: true });
}

async function artifactBytes(repository: ProjectSpineRecoveryRepository): Promise<string> {
  return readFile(repository.artifactPath, 'utf8');
}

describe('ProjectSpineRecoveryRepository', () => {
  it('round-trips a valid envelope with zero candidates', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const value = envelope(projectPath, []);

    await writeEnvelope(repository, value);

    await expect(repository.read()).resolves.toEqual({
      ok: true,
      data: { status: 'present', envelope: value },
    });
  });

  it('round-trips a valid project envelope with multiple candidates and empty prose', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const value = envelope(projectPath, [
      candidate(projectPath, 'unit_1', { prose: '' }),
      candidate(projectPath, 'unit_2'),
    ]);

    await writeEnvelope(repository, value);
    const result = await repository.read();

    expect(result).toEqual({
      ok: true,
      data: {
        status: 'present',
        envelope: value,
      },
    });
    expect(createRecoveryContentFingerprint('Durable one')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('atomically replaces an older valid envelope', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    await writeEnvelope(repository, envelope(projectPath));
    const replacement = envelope(projectPath, [
      candidate(projectPath, 'unit_1', {
        prose: 'Newer recovered prose',
        candidateVersion: 2,
      }),
    ]);

    await writeEnvelope(repository, replacement);

    await expect(repository.read()).resolves.toEqual({
      ok: true,
      data: { status: 'present', envelope: replacement },
    });
  });

  it('preserves the prior envelope and cleans its temporary file when replacement fails', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const original = envelope(projectPath);
    await writeEnvelope(repository, original);
    const before = await artifactBytes(repository);
    const failingRepository = new ProjectSpineRecoveryRepository(projectPath, {
      temporaryId: () => 'failed-replacement',
      replaceFile: vi.fn(async () => {
        throw new Error('simulated rename failure');
      }),
    });

    const result = await failingRepository.write(
      envelope(projectPath, [candidate(projectPath, 'unit_1', { candidateVersion: 2 })]),
      validationContext(projectPath) as ProjectSpineRecoveryValidationContext & {
        readonly mode: 'checkpoint-write';
      },
    );

    expect(result).toMatchObject({ ok: false, error: { code: 'WRITE_FAILED' } });
    await expect(artifactBytes(repository)).resolves.toBe(before);
    await expect(readdir(repository.recoveryDirectory)).resolves.toEqual([
      PROJECT_SPINE_RECOVERY_FILENAME,
    ]);
  });

  it('treats a missing artifact as successful absence', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);

    await expect(repository.read()).resolves.toEqual({
      ok: true,
      data: { status: 'missing', envelope: null },
    });
  });

  it('classifies corrupt JSON and incomplete envelopes without rewriting them', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    await mkdir(repository.recoveryDirectory, { recursive: true });
    await writeFile(repository.artifactPath, '{broken json', 'utf8');

    await expect(repository.read()).resolves.toMatchObject({
      ok: false,
      error: { code: 'CORRUPT_ARTIFACT' },
    });
    await writeFile(
      repository.artifactPath,
      JSON.stringify({ schemaVersion: 1, projectId: 'proj_recovery' }),
      'utf8',
    );
    await expect(repository.read()).resolves.toMatchObject({
      ok: false,
      error: { code: 'CORRUPT_ARTIFACT' },
    });
  });

  it('rejects incomplete candidates and unsupported envelope or candidate schemas', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    await mkdir(repository.recoveryDirectory, { recursive: true });
    const complete = candidate(projectPath) as unknown as Record<string, unknown>;
    const { prose: _prose, ...incomplete } = complete;
    await writeFile(
      repository.artifactPath,
      JSON.stringify({ ...envelope(projectPath), candidates: [incomplete] }),
      'utf8',
    );
    await expect(repository.read()).resolves.toMatchObject({
      ok: false,
      error: { code: 'CORRUPT_ARTIFACT' },
    });

    await writeFile(
      repository.artifactPath,
      JSON.stringify({ ...envelope(projectPath), schemaVersion: 2 }),
      'utf8',
    );
    await expect(repository.read()).resolves.toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_SCHEMA' },
    });

    await writeFile(
      repository.artifactPath,
      JSON.stringify({
        ...envelope(projectPath),
        candidates: [{ ...candidate(projectPath), schemaVersion: 2 }],
      }),
      'utf8',
    );
    await expect(repository.read()).resolves.toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_SCHEMA' },
    });
  });

  it('rejects duplicate current candidates for one manuscript unit', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const duplicateCandidates = envelope(projectPath, [
      candidate(projectPath, 'unit_1'),
      candidate(projectPath, 'unit_1', { candidateVersion: 2 }),
    ]);

    expect(repository.validate(duplicateCandidates, validationContext(projectPath))).toMatchObject({
      ok: false,
      error: { code: 'CORRUPT_ARTIFACT' },
    });
  });

  it('rejects wrong project and canonical path bindings', async () => {
    const projectPath = await temporaryProject();
    const otherPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const value = envelope(projectPath);

    expect(
      repository.validate(value, validationContext(projectPath, { projectId: 'proj_other' })),
    ).toMatchObject({ ok: false, error: { code: 'PROJECT_MISMATCH' } });
    expect(
      repository.validate(value, validationContext(otherPath)),
    ).toMatchObject({ ok: false, error: { code: 'PATH_MISMATCH' } });
    expect(
      repository.validate(envelope(projectPath, [candidate(otherPath)]), validationContext(projectPath)),
    ).toMatchObject({ ok: false, error: { code: 'PATH_MISMATCH' } });
  });

  it('rejects unknown and path-looking unit IDs without using them as paths', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);

    for (const unitId of ['unit_unknown', '../drafts/unit.md']) {
      expect(
        repository.validate(
          envelope(projectPath, [candidate(projectPath, unitId)]),
          validationContext(projectPath),
        ),
      ).toMatchObject({ ok: false, error: { code: 'UNKNOWN_UNIT' } });
    }
    expect(repository.artifactPath).toBe(
      path.join(projectPath, 'recovery', PROJECT_SPINE_RECOVERY_FILENAME),
    );
  });

  it('rejects baseline mismatches and stale candidate versions', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const value = envelope(projectPath);

    expect(
      repository.validate(
        value,
        validationContext(projectPath, {
          durableBaselineFingerprintByUnit: {
            unit_1: createRecoveryContentFingerprint('Different baseline'),
          },
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'BASELINE_MISMATCH' } });
    expect(
      repository.validate(
        envelope(projectPath, [
          candidate(projectPath, 'unit_1', { updatedAt: '2099-01-01T00:00:00.000Z' }),
        ]),
        validationContext(projectPath, { minimumCandidateVersionByUnit: { unit_1: 2 } }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'STALE_CANDIDATE' } });
  });

  it('uses opaque session identity while preserving generation and revision as provenance', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const value = envelope(projectPath, [
      candidate(projectPath, 'unit_1', {
        priorSessionGeneration: 1,
        priorSessionRevision: 99,
      }),
    ]);

    expect(
      repository.validate(
        value,
        validationContext(projectPath, { mode: 'prior-session-recovery' }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'ACTIVE_SESSION_CANDIDATE' } });

    const result = repository.validate(
      value,
      validationContext(projectPath, {
        mode: 'prior-session-recovery',
        activeSessionId: 'session-after-restart',
      }),
    );
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.data.envelope.candidates[0]).toMatchObject({
        priorSessionGeneration: 1,
        priorSessionRevision: 99,
      });
    }
  });

  it('rejects checkpoint candidates from another session', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);

    expect(
      repository.validate(
        envelope(projectPath),
        validationContext(projectPath, { activeSessionId: 'session-other' }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'SESSION_MISMATCH' } });
  });

  it('makes deletion idempotent only when the artifact itself is missing', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const target = candidate(projectPath);

    await expect(repository.deleteCandidate(deletionRequest(target))).resolves.toEqual({
      ok: true,
      data: { deleted: false, remainingCandidates: 0 },
    });
  });

  it('does not modify an existing artifact for project, path, or partial-correlation mismatches', async () => {
    const projectPath = await temporaryProject();
    const otherPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const target = candidate(projectPath);
    const value = envelope(projectPath, [target, candidate(projectPath, 'unit_2')]);
    await writeEnvelope(repository, value);
    const before = await artifactBytes(repository);

    const cases: readonly [Partial<ProjectSpineRecoveryDeletionRequest>, string][] = [
      [{ projectId: 'proj_other' }, 'PROJECT_MISMATCH'],
      [{ projectPath: otherPath }, 'PATH_MISMATCH'],
      [{ originSessionId: 'session-stale' }, 'CANDIDATE_NOT_FOUND'],
      [
        { durableBaselineFingerprint: createRecoveryContentFingerprint('Different baseline') },
        'CANDIDATE_NOT_FOUND',
      ],
      [{ candidateVersion: target.candidateVersion + 1 }, 'CANDIDATE_NOT_FOUND'],
      [{ unitId: 'unit_missing' }, 'CANDIDATE_NOT_FOUND'],
    ];
    for (const [overrides, code] of cases) {
      await expect(
        repository.deleteCandidate(deletionRequest(target, overrides)),
      ).resolves.toMatchObject({ ok: false, error: { code } });
      await expect(artifactBytes(repository)).resolves.toBe(before);
    }
  });

  it('deletes only the exact six-field candidate and preserves deep equality of all others', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath, {
      now: () => DELETION_AT,
    });
    const target = candidate(projectPath, 'unit_1');
    const untouched = candidate(projectPath, 'unit_2');
    await writeEnvelope(repository, envelope(projectPath, [target, untouched]));
    const untouchedBefore = structuredClone(untouched);

    await expect(repository.deleteCandidate(deletionRequest(target))).resolves.toEqual({
      ok: true,
      data: { deleted: true, remainingCandidates: 1 },
    });
    const result = await repository.read();
    expect(result).toMatchObject({ ok: true, data: { status: 'present' } });
    if (result.ok && result.data.status === 'present') {
      expect(result.data.envelope.updatedAt).toBe(DELETION_AT);
      expect(result.data.envelope.candidates).toEqual([untouchedBefore]);
    }
  });

  it('atomically deletes an exactly correlated candidate set and preserves untouched candidates', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath, { now: () => DELETION_AT });
    const first = candidate(projectPath, 'unit_1');
    const second = candidate(projectPath, 'unit_2');
    const untouched = candidate(projectPath, 'unit_3', { candidateVersion: 9, prose: 'Untouched' });
    await writeEnvelope(repository, envelope(projectPath, [first, second, untouched]));
    const untouchedBefore = structuredClone(untouched);

    await expect(repository.deleteCandidates([
      deletionRequest(first),
      deletionRequest(second),
    ])).resolves.toEqual({
      ok: true,
      data: { deleted: true, remainingCandidates: 1 },
    });
    const result = await repository.read();
    expect(result).toMatchObject({ ok: true, data: { status: 'present' } });
    if (result.ok && result.data.status === 'present') {
      expect(result.data.envelope.candidates).toEqual([untouchedBefore]);
    }
  });

  it('does not partially delete when any bulk correlation is stale', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const first = candidate(projectPath, 'unit_1');
    const second = candidate(projectPath, 'unit_2');
    await writeEnvelope(repository, envelope(projectPath, [first, second]));
    const before = await artifactBytes(repository);

    await expect(repository.deleteCandidates([
      deletionRequest(first),
      deletionRequest(second, { originSessionId: 'stale-session' }),
    ])).resolves.toMatchObject({ ok: false, error: { code: 'CANDIDATE_NOT_FOUND' } });
    await expect(artifactBytes(repository)).resolves.toBe(before);
  });

  it('removes the artifact when the exact final candidate is deleted', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const target = candidate(projectPath);
    await writeEnvelope(repository, envelope(projectPath, [target]));

    await expect(repository.deleteCandidate(deletionRequest(target))).resolves.toEqual({
      ok: true,
      data: { deleted: true, remainingCandidates: 0 },
    });
    await expect(stat(repository.artifactPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('preserves the original multi-candidate envelope when deletion rewrite fails', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const target = candidate(projectPath, 'unit_1');
    const value = envelope(projectPath, [target, candidate(projectPath, 'unit_2')]);
    await writeEnvelope(repository, value);
    const before = await artifactBytes(repository);
    const failingRepository = new ProjectSpineRecoveryRepository(projectPath, {
      temporaryId: () => 'failed-deletion-rewrite',
      replaceFile: vi.fn(async () => {
        throw new Error('simulated deletion rewrite failure');
      }),
    });

    await expect(
      failingRepository.deleteCandidate(deletionRequest(target)),
    ).resolves.toMatchObject({ ok: false, error: { code: 'DELETE_FAILED' } });
    await expect(artifactBytes(repository)).resolves.toBe(before);
    await expect(readdir(repository.recoveryDirectory)).resolves.toEqual([
      PROJECT_SPINE_RECOVERY_FILENAME,
    ]);
  });

  it('reports final-artifact deletion failure while preserving the candidate', async () => {
    const projectPath = await temporaryProject();
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const target = candidate(projectPath);
    await writeEnvelope(repository, envelope(projectPath, [target]));
    const failingRepository = new ProjectSpineRecoveryRepository(projectPath, {
      deleteArtifact: vi.fn(async () => {
        throw new Error('simulated delete failure');
      }),
    });

    await expect(
      failingRepository.deleteCandidate(deletionRequest(target)),
    ).resolves.toMatchObject({ ok: false, error: { code: 'DELETE_FAILED' } });
    await expect(repository.read()).resolves.toMatchObject({
      ok: true,
      data: { status: 'present', envelope: { candidates: [target] } },
    });
  });

  it('never mutates manuscript, outline, or project metadata files', async () => {
    const projectPath = await temporaryProject();
    const draftsPath = path.join(projectPath, 'drafts');
    const draftPath = path.join(draftsPath, 'unit_1.md');
    const outlinePath = path.join(projectPath, 'outline.json');
    const metadataPath = path.join(projectPath, 'project.json');
    await mkdir(draftsPath, { recursive: true });
    await writeFile(draftPath, 'durable manuscript sentinel', 'utf8');
    await writeFile(outlinePath, '{"outline":"sentinel"}\n', 'utf8');
    await writeFile(metadataPath, '{"project":"sentinel"}\n', 'utf8');
    const before = await Promise.all([
      readFile(draftPath, 'utf8'),
      readFile(outlinePath, 'utf8'),
      readFile(metadataPath, 'utf8'),
    ]);
    const repository = new ProjectSpineRecoveryRepository(projectPath);
    const target = candidate(projectPath);
    await writeEnvelope(repository, envelope(projectPath, [target]));

    expect(
      repository.validate(
        envelope(projectPath, [candidate(projectPath, '../drafts/unit_1.md')]),
        validationContext(projectPath),
      ),
    ).toMatchObject({ ok: false, error: { code: 'UNKNOWN_UNIT' } });
    await expect(
      repository.deleteCandidate(deletionRequest(target, { originSessionId: 'session-stale' })),
    ).resolves.toMatchObject({ ok: false, error: { code: 'CANDIDATE_NOT_FOUND' } });

    const failingRepository = new ProjectSpineRecoveryRepository(projectPath, {
      temporaryId: () => 'sentinel-failure',
      replaceFile: vi.fn(async () => {
        throw new Error('simulated replacement failure');
      }),
    });
    await expect(
      failingRepository.write(
        envelope(projectPath, [candidate(projectPath, 'unit_1', { candidateVersion: 2 })]),
        validationContext(projectPath) as ProjectSpineRecoveryValidationContext & {
          readonly mode: 'checkpoint-write';
        },
      ),
    ).resolves.toMatchObject({ ok: false, error: { code: 'WRITE_FAILED' } });
    await expect(repository.deleteCandidate(deletionRequest(target))).resolves.toMatchObject({
      ok: true,
      data: { deleted: true },
    });

    await expect(
      Promise.all([
        readFile(draftPath, 'utf8'),
        readFile(outlinePath, 'utf8'),
        readFile(metadataPath, 'utf8'),
      ]),
    ).resolves.toEqual(before);
  });
});
