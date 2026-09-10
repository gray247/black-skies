import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import {
  REVISION_CANDIDATE_SCHEMA_VERSION,
  type RevisionCandidateSourceSnapshotV1,
} from '../../shared/ipc/revisionCandidates';
import {
  PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA,
  PROGRAM7_LOCAL_INFERENCE_MODEL,
  PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
  type Program7LocalInferenceRequestV1,
  type Program7LocalInferenceResponseV1,
} from '../../shared/localInference';
import {
  REVISION_CANDIDATES_FILENAME,
  RevisionCandidateRepository,
  RevisionCandidateRepositoryError,
} from '../revisionCandidateRepository';
import { program7LocalInferencePromptHash } from '../ollamaLocalInferenceTransport';

const roots: string[] = [];
const sourceText = 'The unchanged source unit.';
const source: RevisionCandidateSourceSnapshotV1 = {
  unitId: 'unit-a',
  bodySha256: createHash('sha256').update(sourceText).digest('hex'),
  text: sourceText,
};

async function project(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-candidates-'));
  roots.push(root);
  return root;
}
function store(root: string, sequence = { value: 0 }) {
  return new RevisionCandidateRepository(
    root,
    () => new Date('2026-09-09T12:00:00.000Z'),
    () => `id-${++sequence.value}`,
  );
}
function manualInput() {
  return {
    sourceSnapshot: source,
    sourceAnchor: {
      unitId: 'unit-a',
      selectionStart: 0,
      selectionEnd: 12,
      selectionFingerprint: 'b'.repeat(64),
    },
    purpose: 'Improve the transition.',
    protection: { excluded: false, class: 'ordinary' as const },
    warnings: [],
    candidateText: 'The revised transition.',
  };
}
function inference(): Program7LocalInferenceRequestV1 {
  return {
    schema: 'program7.local-inference.request.v1',
    operation: 'rewrite_candidate',
    model: PROGRAM7_LOCAL_INFERENCE_MODEL,
    requestId: 'inference-1',
    projectId: 'project-a',
    source: { unitId: 'unit-a', bodySha256: source.bodySha256, text: source.text },
    purpose: 'Offer a candidate.',
    limits: { inputChars: 12000, outputChars: 6000 },
    protection: { excluded: false, class: 'ordinary' },
  };
}
function response(): Program7LocalInferenceResponseV1 {
  return {
    schema: PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA,
    requestId: 'inference-1',
    model: PROGRAM7_LOCAL_INFERENCE_MODEL,
    status: 'candidate',
    text: 'AI candidate.',
    reason: 'One bounded alternative.',
    usage: { inputChars: source.text.length, outputChars: 13 },
    receipt: {
      endpoint: PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
      requestedModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
      actualModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
      modelDigest: 'c'.repeat(64),
      ollamaVersion: '0.13.0',
      promptSha256: program7LocalInferencePromptHash(inference()),
      schemaSha256: 'e'.repeat(64),
      startedAt: '2026-09-09T12:00:00.000Z',
      firstTokenAt: null,
      endedAt: '2026-09-09T12:00:01.000Z',
      promptTokens: 1,
      outputTokens: 2,
    },
  };
}

describe('revision candidate repository', () => {
  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('starts empty and stores manual proposals without touching manuscript truth', async () => {
    const root = await project();
    const repository = store(root);
    const initial = await repository.read('project-a');
    expect(initial.document).toMatchObject({
      schemaVersion: REVISION_CANDIDATE_SCHEMA_VERSION,
      revision: 0,
      candidates: [],
    });
    const result = await repository.createManual('project-a', 0, manualInput());
    expect(result.document.revision).toBe(1);
    expect(result.document.candidates[0]).toMatchObject({
      origin: 'manual',
      lifecycle: 'generated',
      currentness: 'current',
      candidateText: 'The revised transition.',
      editedCandidateText: null,
      provenance: { source: 'author', model: null },
      sourceSnapshot: source,
    });
  });

  it('preserves local-AI receipt and rejects protected local-AI source before mutation', async () => {
    const root = await project();
    const repository = store(root);
    const result = await repository.createFromLocalAi('project-a', 0, inference(), response());
    expect(result.document.candidates[0]).toMatchObject({
      origin: 'local-ai',
      lifecycle: 'generated',
      provenance: { model: PROGRAM7_LOCAL_INFERENCE_MODEL, receipt: response().receipt },
    });
    await expect(
      repository.createFromLocalAi(
        'project-a',
        1,
        { ...inference(), protection: { excluded: true, class: 'protected' } },
        response(),
      ),
    ).rejects.toMatchObject({
      code: 'LOCAL_AI_UNAVAILABLE',
    } satisfies Partial<RevisionCandidateRepositoryError>);
  });

  it('supports edit and lifecycle history without accepting manuscript text', async () => {
    const root = await project();
    const repository = store(root);
    const created = await repository.createManual('project-a', 0, manualInput());
    const id = created.document.candidates[0]!.id;
    const edited = await repository.edit('project-a', 1, id, 'Edited candidate.');
    await expect(
      repository.setLifecycle(
        'project-a',
        2,
        id,
        'partially accepted',
        'Author selected one paragraph.',
      ),
    ).rejects.toMatchObject({ code: 'INVALID' });
    const stale = await repository.setLifecycle('project-a', 2, id, 'stale');
    expect(edited.document.candidates[0]).toMatchObject({
      editedCandidateText: 'Edited candidate.',
      lifecycle: 'reviewing',
    });
    expect(stale.document.candidates[0]).toMatchObject({
      lifecycle: 'stale',
      currentness: 'stale',
    });
    expect(stale.document.candidates[0]!.history.map((entry) => entry.lifecycle)).toEqual([
      'generated',
      'reviewing',
      'stale',
    ]);
    const second = await repository.createManual('project-a', 3, manualInput());
    const secondId = second.document.candidates[1]!.id;
    const finalized = await repository.finalizeAcceptance('project-a', {
      expectedRevision: 4,
      candidateId: secondId,
      lifecycle: 'accepted',
      receipt: {
        sourceBodySha256: source.bodySha256,
        candidateTextSha256: createHash('sha256').update('The revised transition.').digest('hex'),
        savedBodySha256: 'f'.repeat(64),
        savedAt: '2026-09-09T12:00:00.000Z',
      },
    });
    expect(finalized.document.candidates[1]).toMatchObject({
      lifecycle: 'accepted',
    });
    expect(
      finalized.document.candidates[1]!.history.some(
        (entry) => entry.lifecycle === 'accepted' && entry.actor === 'system',
      ),
    ).toBe(true);
  });

  it('serializes concurrent expected revisions and preserves corrupt bytes', async () => {
    const root = await project();
    const first = store(root);
    const second = store(root);
    const attempts = await Promise.allSettled([
      first.createManual('project-a', 0, manualInput()),
      second.createManual('project-a', 0, { ...manualInput(), candidateText: 'Other candidate.' }),
    ]);
    expect(attempts.filter((value) => value.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((value) => value.status === 'rejected')).toHaveLength(1);
    const filePath = join(root, REVISION_CANDIDATES_FILENAME);
    const bytes = '{broken';
    await writeFile(filePath, bytes);
    await expect(first.read('project-a')).resolves.toMatchObject({ availability: 'degraded' });
    await expect(first.createManual('project-a', 0, manualInput())).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    } satisfies Partial<RevisionCandidateRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe(bytes);
  });

  it('degrades safely for unknown persisted keys and cross-field mismatches', async () => {
    const root = await project();
    const repository = store(root);
    await repository.createManual('project-a', 0, manualInput());
    const filePath = join(root, REVISION_CANDIDATES_FILENAME);
    const document = JSON.parse(await readFile(filePath, 'utf8')) as any;
    document.candidates[0].provenance.origin = 'local-ai';
    document.candidates[0].sourceSnapshot.private = 'PROTECTED_RAW_SENTINEL';
    await writeFile(filePath, `${JSON.stringify(document)}\n`, 'utf8');
    const result = await repository.read('project-a');
    expect(result.availability).toBe('degraded');
    expect(JSON.stringify(result)).not.toContain('PROTECTED_RAW_SENTINEL');
  });

  it('degrades safely when persisted source text no longer matches its saved digest', async () => {
    const root = await project();
    const repository = store(root);
    await repository.createManual('project-a', 0, manualInput());
    const filePath = join(root, REVISION_CANDIDATES_FILENAME);
    const document = JSON.parse(await readFile(filePath, 'utf8')) as any;
    document.candidates[0].sourceSnapshot.text = 'PROTECTED_RAW_SENTINEL';
    await writeFile(filePath, `${JSON.stringify(document)}\n`, 'utf8');

    const result = await repository.read('project-a');
    expect(result.availability).toBe('degraded');
    expect(JSON.stringify(result)).not.toContain('PROTECTED_RAW_SENTINEL');
  });

  it('rejects local-AI responses whose source, usage, or receipt is not bound to the request', async () => {
    const root = await project();
    const repository = store(root);
    const request = inference();

    await expect(
      repository.createFromLocalAi(
        'project-a',
        0,
        { ...request, source: { ...request.source, text: 'Tampered source.' } },
        response(),
      ),
    ).rejects.toMatchObject({ code: 'LOCAL_AI_UNAVAILABLE' });

    await expect(
      repository.createFromLocalAi('project-a', 0, request, {
        ...response(),
        usage: { ...response().usage, inputChars: request.source.text.length + 1 },
      }),
    ).rejects.toMatchObject({ code: 'LOCAL_AI_UNAVAILABLE' });

    await expect(
      repository.createFromLocalAi('project-a', 0, request, {
        ...response(),
        receipt: { ...response().receipt, promptSha256: 'f'.repeat(64) },
      }),
    ).rejects.toMatchObject({ code: 'LOCAL_AI_UNAVAILABLE' });

    await expect(repository.read('project-a')).resolves.toMatchObject({
      availability: 'ready',
      document: { revision: 0, candidates: [] },
    });
  });
});
