import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: any, request?: unknown) => Promise<unknown> | unknown>();
  return {
    handlers,
    handle: vi.fn(
      (channel: string, handler: (event: any, request?: unknown) => Promise<unknown> | unknown) =>
        handlers.set(channel, handler),
    ),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});
vi.mock('electron', () => ({ ipcMain: electronMocks }));

import { REVISION_CANDIDATE_CHANNELS } from '../../shared/ipc/revisionCandidates';
import {
  PROGRAM7_LOCAL_INFERENCE_MODEL,
  type Program7LocalInferenceResponseV1,
} from '../../shared/localInference';
import {
  registerRevisionCandidateIpc,
  resetRevisionCandidateIpcForTests,
} from '../revisionCandidateIpc';
import { RevisionCandidateRepositoryError } from '../revisionCandidateRepository';

const projectPath = 'C:/projects/a';
const binding = {
  operationId: 'candidate-op',
  projectId: 'project-a',
  projectPath,
  generation: 2,
  unitId: 'unit-a',
};
const ready = {
  availability: 'ready' as const,
  document: {
    schemaVersion: 'BlackSkiesRevisionCandidates v1' as const,
    projectId: 'project-a',
    revision: 0,
    candidates: [],
  },
  message: null,
};
const snapshot = {
  schemaVersion: 1 as const,
  role: 'writing' as const,
  generation: 2,
  revision: 4,
  project: {
    projectId: 'project-a',
    path: projectPath,
    title: 'Project A',
    schemaVersion: 'ProjectMetadataSchema v1' as const,
    units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 1 }],
    drafts: { 'unit-a': 'Source unit.' },
    unitMetrics: {
      'unit-a': {
        wordCount: 2,
        sentenceCount: 1,
        paragraphCount: 1,
        dialogueRatio: 0,
        bodySha256: createHash('sha256').update('Source unit.').digest('hex'),
      },
    },
  },
  activeUnitId: 'unit-a',
  recentProjects: [],
  dirtyUnitIds: [],
  saveState: { status: 'clean' as const, unitId: null, message: null },
  lastError: null,
  recovery: { status: 'none' as const, candidates: [] as const },
};
const manual = {
  ...binding,
  expectedRevision: 0,
  sourceSnapshot: {
    unitId: 'unit-a',
    bodySha256: createHash('sha256').update('Source unit.').digest('hex'),
    text: 'Source unit.',
  },
  sourceAnchor: null,
  purpose: 'Revise this.',
  protection: { excluded: false, class: 'ordinary' as const },
  candidateText: 'Candidate text.',
  warnings: [],
};
const aiResponse: Program7LocalInferenceResponseV1 = {
  schema: 'program7.local-inference.response.v1',
  requestId: 'inference-1',
  model: PROGRAM7_LOCAL_INFERENCE_MODEL,
  status: 'candidate',
  text: 'AI candidate.',
  reason: 'Bounded.',
  usage: { inputChars: 12, outputChars: 13 },
  receipt: {
    endpoint: 'http://127.0.0.1:11434',
    requestedModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
    actualModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
    modelDigest: 'c'.repeat(64),
    ollamaVersion: '0.13.0',
    promptSha256: 'd'.repeat(64),
    schemaSha256: 'e'.repeat(64),
    startedAt: '2026-09-09T12:00:00.000Z',
    firstTokenAt: null,
    endedAt: '2026-09-09T12:00:01.000Z',
    promptTokens: 1,
    outputTokens: 2,
  },
};
const inference = {
  schema: 'program7.local-inference.request.v1' as const,
  operation: 'rewrite_candidate' as const,
  model: PROGRAM7_LOCAL_INFERENCE_MODEL,
  requestId: 'inference-1',
  projectId: 'project-a',
  source: {
    unitId: 'unit-a',
    bodySha256: createHash('sha256').update('Source unit.').digest('hex'),
    text: 'Source unit.',
  },
  purpose: 'Offer a candidate.',
  limits: { inputChars: 12000, outputChars: 6000 },
  protection: { excluded: false, class: 'ordinary' as const },
};

function invoke(channel: string, senderId: number, request: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Missing handler ${channel}`);
  return Promise.resolve(handler({ sender: { id: senderId } }, request));
}

describe('revision candidate IPC authority', () => {
  const repository = {
    read: vi.fn(),
    createManual: vi.fn(),
    createFromLocalAi: vi.fn(),
    edit: vi.fn(),
    setLifecycle: vi.fn(),
  };
  const localInferenceService = { run: vi.fn() };
  beforeEach(() => {
    resetRevisionCandidateIpcForTests();
    electronMocks.handlers.clear();
    Object.values(repository).forEach((mock) => mock.mockReset().mockResolvedValue(ready));
    localInferenceService.run.mockReset().mockResolvedValue(aiResponse);
    registerRevisionCandidateIpc({
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      getWritingSnapshot: () => snapshot,
      repositoryFactory: () => repository as never,
      localInferenceService,
    });
  });

  it('allows read-only list in Writing and Command but keeps all mutations Writing-only', async () => {
    await expect(invoke(REVISION_CANDIDATE_CHANNELS.list, 1, binding)).resolves.toEqual({
      ok: true,
      data: ready,
    });
    await expect(invoke(REVISION_CANDIDATE_CHANNELS.list, 2, binding)).resolves.toEqual({
      ok: true,
      data: ready,
    });
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.createManual, 2, manual),
    ).resolves.toMatchObject({ ok: false, error: { code: 'NOT_AUTHORIZED' } });
    await expect(invoke(REVISION_CANDIDATE_CHANNELS.createManual, 1, manual)).resolves.toEqual({
      ok: true,
      data: ready,
    });
    expect(repository.createManual).toHaveBeenCalled();
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.createManual, 1, {
        ...manual,
        sourceSnapshot: { ...manual.sourceSnapshot, text: 'PROTECTED_RAW_SENTINEL' },
        protection: { excluded: true, class: 'protected' },
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'PROTECTED_SOURCE' } });
    expect(repository.createManual).toHaveBeenCalledTimes(1);
  });

  it('enforces project/path/generation/unit binding before repository or model access', async () => {
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.list, 1, { ...binding, projectPath: 'C:/projects/b' }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.createLocalAi, 1, {
        ...binding,
        expectedRevision: 0,
        inference: { ...inference, source: { ...inference.source, unitId: 'unit-b' } },
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(repository.read).not.toHaveBeenCalled();
    expect(localInferenceService.run).not.toHaveBeenCalled();
  });

  it('rejects unknown keys on every channel at the IPC boundary', async () => {
    const cases: Array<[string, unknown]> = [
      [REVISION_CANDIDATE_CHANNELS.list, { ...binding, extra: true }],
      [REVISION_CANDIDATE_CHANNELS.createManual, { ...manual, extra: true }],
      [
        REVISION_CANDIDATE_CHANNELS.createLocalAi,
        { ...binding, expectedRevision: 0, inference, extra: true },
      ],
      [
        REVISION_CANDIDATE_CHANNELS.edit,
        {
          ...binding,
          expectedRevision: 0,
          candidateId: 'candidate-1',
          editedCandidateText: 'Edited.',
          extra: true,
        },
      ],
      [
        REVISION_CANDIDATE_CHANNELS.setLifecycle,
        {
          ...binding,
          expectedRevision: 0,
          candidateId: 'candidate-1',
          lifecycle: 'reviewing',
          extra: true,
        },
      ],
    ];
    for (const [channel, request] of cases) {
      await expect(invoke(channel, 1, request)).resolves.toMatchObject({
        ok: false,
        error: { code: 'INVALID_REQUEST' },
      });
    }
    expect(repository.read).not.toHaveBeenCalled();
    expect(repository.createManual).not.toHaveBeenCalled();
    expect(localInferenceService.run).not.toHaveBeenCalled();
  });

  it('rejects invalid anchors and stale source fingerprints before model work', async () => {
    const invalidAnchor = {
      ...inference,
    };
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.createLocalAi, 1, {
        ...binding,
        expectedRevision: 0,
        inference: invalidAnchor,
        sourceAnchor: {
          unitId: 'unit-a',
          selectionStart: 0,
          selectionEnd: -1,
          selectionFingerprint: 'b'.repeat(64),
        },
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(localInferenceService.run).not.toHaveBeenCalled();
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.createLocalAi, 1, {
        ...binding,
        expectedRevision: 0,
        inference: { ...inference, source: { ...inference.source, bodySha256: 'f'.repeat(64) } },
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'STALE_CANDIDATES' } });
    expect(localInferenceService.run).not.toHaveBeenCalled();
  });

  it('binds full-body and ranged source text to the active normalized draft', async () => {
    const ranged = {
      ...inference,
      source: { ...inference.source, text: 'Source' },
    };
    const anchor = {
      unitId: 'unit-a',
      selectionStart: 0,
      selectionEnd: 6,
      selectionFingerprint: createHash('sha256').update('Source').digest('hex'),
    };
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.createLocalAi, 1, {
        ...binding,
        expectedRevision: 0,
        inference: ranged,
        sourceAnchor: anchor,
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(localInferenceService.run).toHaveBeenCalledTimes(1);
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.createLocalAi, 1, {
        ...binding,
        expectedRevision: 0,
        inference: { ...ranged, source: { ...ranged.source, text: 'SUBSTITUTED' } },
        sourceAnchor: anchor,
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(localInferenceService.run).toHaveBeenCalledTimes(1);
  });

  it('uses only the injected local-AI service and rejects protected source before invocation', async () => {
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.createLocalAi, 1, {
        ...binding,
        expectedRevision: 0,
        inference,
      }),
    ).resolves.toEqual({ ok: true, data: ready });
    expect(localInferenceService.run).toHaveBeenCalledWith(inference, { authorInvoked: true });
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.createLocalAi, 1, {
        ...binding,
        expectedRevision: 0,
        inference: {
          ...inference,
          source: { ...inference.source, text: 'PROTECTED_RAW_SENTINEL' },
          protection: { excluded: true, class: 'protected' },
        },
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'PROTECTED_SOURCE' } });
    expect(localInferenceService.run).toHaveBeenCalledTimes(1);
    expect(
      JSON.stringify(
        await invoke(REVISION_CANDIDATE_CHANNELS.createLocalAi, 1, {
          ...binding,
          expectedRevision: 0,
          inference: {
            ...inference,
            source: { ...inference.source, text: 'PROTECTED_RAW_SENTINEL' },
            protection: { excluded: true, class: 'protected' },
          },
        }),
      ),
    ).not.toContain('PROTECTED_RAW_SENTINEL');
  });

  it('maps stale and unavailable repository failures visibly', async () => {
    repository.edit.mockRejectedValueOnce(new Error('disk'));
    repository.setLifecycle.mockRejectedValueOnce(
      new RevisionCandidateRepositoryError('STALE', 'Reload.'),
    );
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.edit, 1, {
        ...binding,
        expectedRevision: 0,
        candidateId: 'candidate-1',
        editedCandidateText: 'Edited.',
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'CANDIDATE_WRITE_FAILED' } });
    await expect(
      invoke(REVISION_CANDIDATE_CHANNELS.setLifecycle, 1, {
        ...binding,
        expectedRevision: 0,
        candidateId: 'candidate-1',
        lifecycle: 'accepted',
      }),
    ).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });
});
