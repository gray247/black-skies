import { afterEach, describe, expect, it, vi } from 'vitest';
import fs, { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
let manualOperation = 0;
function manualInput() {
  return {
    operationId: `manual-operation-${++manualOperation}`,
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
  it('preserves exact proposal whitespace and clones author input before asynchronous preparation', async () => {
    const root = await project(), repo = store(root);
    const input = { ...manualInput(), purpose: '  Keep rhythm.  ', candidateText: '\n  A different rhythm.\n' };
    let release!: () => void, entered!: () => void;
    const waiting = new Promise<void>(resolve => { release = resolve; });
    const prepared = new Promise<void>(resolve => { entered = resolve; });
    const saving = repo.createManual('project-a', 0, input, async () => { entered(); await waiting; });
    await prepared;
    input.candidateText = 'Changed after Save';
    release();
    const saved = await saving;
    expect(saved.document.candidates[0]).toMatchObject({ purpose: '  Keep rhythm.  ', candidateText: '\n  A different rhythm.\n' });
    expect(saved.document.captures![0]!.payload.candidateText).toBe('\n  A different rhythm.\n');
  });

  it('serializes simultaneous same-operation saves into one identity and one creation event', async () => {
    const root = await project(), repo = store(root), input = manualInput();
    const [first, second] = await Promise.all([repo.createManual('project-a', 0, input), repo.createManual('project-a', 0, input)]);
    expect(second).toEqual(first);
    expect(second.document.candidates).toHaveLength(1);
    expect(second.document.candidates[0]!.history).toHaveLength(1);
    expect(second.document.captures).toHaveLength(1);
  });

  it('resumes a prepared capture after interruption without retargeting or a second candidate', async () => {
    const root = await project(), repo = store(root), input = manualInput();
    await expect(repo.createManual('project-a', 0, input, async () => { throw new Error('Simulated process interruption'); })).rejects.toThrow('Simulated process interruption');
    const prepared = await new RevisionCandidateRepository(root).read('project-a');
    expect(prepared.availability).toBe('ready');
    expect(prepared.document.candidates).toEqual([]);
    expect(prepared.document.captures![0]!.status).toBe('prepared');
    const saved = await new RevisionCandidateRepository(root).createManual('project-a', 999, input);
    expect(saved.document.candidates.map(candidate => candidate.id)).toEqual([prepared.document.captures![0]!.candidateId]);
    expect(saved.document.captures![0]!.payload).toEqual(prepared.document.captures![0]!.payload);
  });

  it('keeps one capture when a short sharing lock interrupts atomic replacement', async () => {
    const root = await project();
    const repository = store(root);
    const first = await repository.createManual('project-a', 0, manualInput());
    const file = join(root, REVISION_CANDIDATES_FILENAME);
    const protectedBytes = await fs.readFile(file, 'utf8');
    const originalRename = fs.rename.bind(fs);
    const blockedSources: string[] = [];
    let locksRemaining = 2;
    const replace = vi.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
      if (String(to) === file && locksRemaining > 0) {
        locksRemaining -= 1;
        blockedSources.push(String(from));
        expect(await fs.readFile(file, 'utf8')).toBe(protectedBytes);
        throw Object.assign(new Error('Windows file sharing violation'), { code: 'EPERM' });
      }
      await originalRename(from, to);
    });
    try {
      const input = { ...manualInput(), candidateText: '  Keep exactly this wording.  ' };
      const committed = await repository.createManual('project-a', 1, input);
      expect(blockedSources).toHaveLength(2);
      expect(new Set(blockedSources).size).toBe(1);
      expect(committed.document.candidates).toHaveLength(2);
      expect(committed.document.candidates[0]).toEqual(first.document.candidates[0]);
      expect(committed.document.captures?.[1]).toMatchObject({
        operationId: input.operationId, status: 'committed', committedRevision: 2,
        payload: { candidateText: input.candidateText },
      });
      expect(await new RevisionCandidateRepository(root).createManual('project-a', 1, input)).toEqual(committed);
      expect((await readdir(root)).filter(name => name.endsWith('.tmp'))).toEqual([]);
    } finally {
      replace.mockRestore();
    }
  });

  it('reconciles a committed file when durable readback fails after rename', async () => {
    const root = await project(), repo = store(root), input = manualInput();
    const realRead = fs.readFile.bind(fs);
    let failed = false;
    const read = vi.spyOn(fs, 'readFile').mockImplementation(async (...args: Parameters<typeof fs.readFile>) => {
      const value = await realRead(...args);
      if (!failed && String(args[0]) === join(root, REVISION_CANDIDATES_FILENAME) && String(value).includes('"status": "committed"')) {
        failed = true; throw Object.assign(new Error('Lost completion'), { code: 'EIO' });
      }
      return value;
    });
    await expect(repo.createManual('project-a', 0, input)).rejects.toMatchObject({ code: 'WRITE_FAILED' });
    read.mockRestore();
    expect(failed).toBe(true);
    const validate = vi.fn(async () => { throw new Error('Already committed source must not be revalidated'); });
    const replay = await new RevisionCandidateRepository(root).createManual('project-a', 0, input, validate);
    expect(validate).not.toHaveBeenCalled();
    expect(replay.document.candidates).toHaveLength(1);
    expect(replay.document.captures![0]!.status).toBe('committed');
  });

  it('preserves V1 bytes and existing candidates before the first V2 mutation', async () => {
    const root = await project(), repo = store(root);
    const first = await repo.createManual('project-a', 0, manualInput());
    const legacy = { schemaVersion: REVISION_CANDIDATE_SCHEMA_VERSION, projectId: 'project-a', revision: 1, candidates: first.document.candidates };
    const original = JSON.stringify(legacy, null, 4).replace(/\n/g, '\r\n') + '\r\n';
    await writeFile(join(root, REVISION_CANDIDATES_FILENAME), original);
    expect((await repo.read('project-a')).document).toEqual(legacy);
    const saved = await repo.createManual('project-a', 1, manualInput());
    expect(await readFile(join(root, 'revision-candidates.v1.backup.json'), 'utf8')).toBe(original);
    expect(saved.document.candidates[0]).toEqual(first.document.candidates[0]);
    expect(await new RevisionCandidateRepository(root).read('project-a')).toEqual(saved);
  });

  it('refuses a conflicting migration backup without overwriting either original', async () => {
    const root = await project(), repo = store(root);
    const original = JSON.stringify({ schemaVersion: REVISION_CANDIDATE_SCHEMA_VERSION, projectId: 'project-a', revision: 0, candidates: [] });
    await writeFile(join(root, REVISION_CANDIDATES_FILENAME), original);
    await writeFile(join(root, 'revision-candidates.v1.backup.json'), 'Other preserved history');
    await expect(repo.createManual('project-a', 0, manualInput())).rejects.toMatchObject({ code: 'WRITE_FAILED' });
    expect(await readFile(join(root, REVISION_CANDIDATES_FILENAME), 'utf8')).toBe(original);
    expect(await readFile(join(root, 'revision-candidates.v1.backup.json'), 'utf8')).toBe('Other preserved history');
  });

  it('retains a definitive source rejection and never turns its retry into a different capture', async () => {
    const root = await project(), repo = store(root), input = manualInput();
    const rejected = new RevisionCandidateRepositoryError('STALE', 'Exact source changed.');
    await expect(repo.createManual('project-a', 0, input, async () => { throw rejected; })).rejects.toMatchObject({ code: 'STALE' });
    const snapshot = await repo.read('project-a');
    expect(snapshot.document.candidates).toEqual([]);
    expect(snapshot.document.captures![0]).toMatchObject({ status: 'rejected', rejection: { code: 'STALE', message: 'Exact source changed.' } });
    await expect(new RevisionCandidateRepository(root).createManual('project-a', 0, input)).rejects.toMatchObject({ code: 'STALE' });
    expect(await repo.read('project-a')).toEqual(snapshot);
  });

  it('replays the same capture after a lost reply and fresh repository without another candidate', async () => {
    const root = await project(), repo = store(root);
    const input = { ...manualInput(), operationId: 'same-deliberate-save' };
    const committed = await repo.createManual('project-a', 0, input);
    const id = committed.document.candidates[0]!.id;
    const reopened = new RevisionCandidateRepository(root);
    const replay = await reopened.createManual('project-a', 0, input);
    expect(replay).toEqual(committed);
    expect(replay.document.candidates.map(candidate => candidate.id)).toEqual([id]);
    const disk = JSON.parse(await readFile(join(root, REVISION_CANDIDATES_FILENAME), 'utf8'));
    expect(disk.captures).toHaveLength(1);
    expect(disk.captures[0]).toMatchObject({ operationId: input.operationId, status: 'committed', candidateId: id, committedRevision: 1 });
  });

  it('refuses reuse of a capture identity for different text and preserves the original bytes', async () => {
    const root = await project(), repo = store(root);
    const input = { ...manualInput(), operationId: 'immutable-deliberate-save' };
    const first = await repo.createManual('project-a', 0, input);
    const bytes = await readFile(join(root, REVISION_CANDIDATES_FILENAME), 'utf8');
    await expect(repo.createManual('project-a', first.document.revision, { ...input, candidateText: 'Different text.' })).rejects.toMatchObject({ code: 'INVALID' });
    expect(await readFile(join(root, REVISION_CANDIDATES_FILENAME), 'utf8')).toBe(bytes);
    expect((await new RevisionCandidateRepository(root).read('project-a')).document.candidates).toHaveLength(1);
  });

  it('retains an explicit empty deletion alternative, refuses unlinked or accidental blank alternatives', async () => {
    const root = await project(), repo = store(root);
    await expect(repo.createManual('project-a', 0, { ...manualInput(), candidateText: '' })).rejects.toMatchObject({ code: 'INVALID' });
    await expect(repo.createManual('project-a', 0, { ...manualInput(), candidateText: '', deleteSource: true, sourceAnchor: null })).rejects.toMatchObject({ code: 'INVALID' });
    const saved = await repo.createManual('project-a', 0, { ...manualInput(), candidateText: '', deleteSource: true });
    expect(saved.document.candidates[0]).toMatchObject({ candidateText: '', deleteSource: true, lifecycle: 'generated' });
    expect(await store(root).read('project-a')).toEqual(saved);
  });
  it('preserves a concern identity through candidate edits, dispositions and reopen without changing legacy candidates', async () => {
    const root = await project(), repo = store(root);
    const first = await repo.createManual('project-a', 0, { ...manualInput(), concernId: 'concern-a' });
    const id = first.document.candidates[0]!.id;
    const second = await repo.createManual('project-a', 1, manualInput());
    await repo.edit('project-a', 2, id, 'Edited alternative.');
    await repo.setLifecycle('project-a', 3, id, 'parked');
    const reopened = await store(root).read('project-a');
    expect(reopened.document.candidates.find(candidate => candidate.id === id)).toMatchObject({ concernId: 'concern-a', lifecycle: 'parked', editedCandidateText: 'Edited alternative.' });
    expect(second.document.candidates[1]).not.toHaveProperty('concernId');
  });
  afterEach(async () => {
    vi.restoreAllMocks();
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
    await expect(repository.setLifecycle('project-a', 3, id, 'reviewing')).rejects.toMatchObject({
      code: 'STALE',
    } satisfies Partial<RevisionCandidateRepositoryError>);
    const second = await repository.createManual('project-a', 3, manualInput());
    const secondId = second.document.candidates[1]!.id;
    const reservation = {
      operationId: 'acceptance-1',
      documentRevision: 4,
      sourceBodySha256: source.bodySha256,
      sourceStart: 0,
      sourceEnd: sourceText.length,
      candidateStart: 0,
      candidateEnd: 'The revised transition.'.length,
      candidateTextSha256: createHash('sha256').update('The revised transition.').digest('hex'),
      acceptedResultSha256: 'f'.repeat(64),
      reservedAt: '2026-09-09T12:00:00.000Z',
    };
    const reserved = await repository.reserveAcceptance('project-a', {
      expectedRevision: 4,
      candidateId: secondId,
      reservation,
    });
    await expect(repository.edit('project-a', 5, secondId, 'Not while accepting.')).rejects.toMatchObject({
      code: 'RESERVED',
    } satisfies Partial<RevisionCandidateRepositoryError>);
    const finalized = await repository.finalizeAcceptance('project-a', {
      expectedRevision: reserved.document.revision,
      candidateId: secondId,
      operationId: reservation.operationId,
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
      acceptanceReservation: null,
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
    const rejected = attempts.find((value) => value.status === 'rejected');
    expect(rejected).toMatchObject({ reason: { code: 'STALE' } });
    await expect(first.read('project-a')).resolves.toMatchObject({
      availability: 'ready',
      document: { revision: 1, candidates: [{ candidateText: expect.any(String) }] },
    });
    const filePath = join(root, REVISION_CANDIDATES_FILENAME);
    const bytes = '{broken';
    await writeFile(filePath, bytes);
    await expect(first.read('project-a')).resolves.toMatchObject({ availability: 'degraded' });
    await expect(first.createManual('project-a', 0, manualInput())).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    } satisfies Partial<RevisionCandidateRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe(bytes);
  });

  it('recovers a persisted reservation after reopen and releases only its exact operation', async () => {
    const root = await project();
    const repository = store(root);
    const created = await repository.createManual('project-a', 0, manualInput());
    const candidateId = created.document.candidates[0]!.id;
    const reservation = {
      operationId: 'recovery-operation',
      documentRevision: 1,
      sourceBodySha256: source.bodySha256,
      sourceStart: 0,
      sourceEnd: sourceText.length,
      candidateStart: 0,
      candidateEnd: 'The revised transition.'.length,
      candidateTextSha256: createHash('sha256').update('The revised transition.').digest('hex'),
      acceptedResultSha256: 'f'.repeat(64),
      reservedAt: '2026-09-09T12:00:00.000Z',
    };
    await repository.reserveAcceptance('project-a', {
      expectedRevision: 1,
      candidateId,
      reservation,
    });

    const reopened = store(root);
    await expect(reopened.read('project-a')).resolves.toMatchObject({
      availability: 'ready',
      document: { revision: 2, candidates: [{ acceptanceReservation: { operationId: 'recovery-operation' } }] },
    });
    await expect(reopened.releaseAcceptance('project-a', 2, candidateId, 'wrong-operation')).rejects.toMatchObject({ code: 'STALE' });
    const released = await reopened.releaseAcceptance('project-a', 2, candidateId, 'recovery-operation');
    expect(released.document.candidates[0]).toMatchObject({ acceptanceReservation: null });
    await expect(reopened.setLifecycle('project-a', 3, candidateId, 'accepted')).rejects.toMatchObject({ code: 'INVALID' });
  });

  it('allows only one competing acceptance reservation and preserves the winner', async () => {
    const root = await project();
    const first = store(root);
    const second = store(root);
    const created = await first.createManual('project-a', 0, manualInput());
    const candidateId = created.document.candidates[0]!.id;
    const reservation = (operationId: string) => ({
      operationId,
      documentRevision: 1,
      sourceBodySha256: source.bodySha256,
      sourceStart: 0,
      sourceEnd: sourceText.length,
      candidateStart: 0,
      candidateEnd: 'The revised transition.'.length,
      candidateTextSha256: createHash('sha256').update('The revised transition.').digest('hex'),
      acceptedResultSha256: 'f'.repeat(64),
      reservedAt: '2026-09-09T12:00:00.000Z',
    });
    const attempts = await Promise.allSettled([
      first.reserveAcceptance('project-a', { expectedRevision: 1, candidateId, reservation: reservation('accept-a') }),
      second.reserveAcceptance('project-a', { expectedRevision: 1, candidateId, reservation: reservation('accept-b') }),
    ]);
    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
    const loser = attempts.find((attempt) => attempt.status === 'rejected');
    expect(loser).toMatchObject({ reason: { code: 'STALE' } });
    await expect(first.read('project-a')).resolves.toMatchObject({
      document: { revision: 2, candidates: [{ acceptanceReservation: { operationId: expect.stringMatching(/^accept-[ab]$/) } }] },
    });
  });

  it('fails closed for unsupported persisted schema and duplicate IDs without rewriting bytes', async () => {
    const root = await project();
    const repository = store(root);
    await repository.createManual('project-a', 0, manualInput());
    const filePath = join(root, REVISION_CANDIDATES_FILENAME);
    const original = await readFile(filePath, 'utf8');

    for (const mutate of [
      (document: any) => { document.schemaVersion = 'BlackSkiesRevisionCandidates v99'; },
      (document: any) => { document.candidates.push({ ...document.candidates[0] }); },
    ]) {
      const document = JSON.parse(original) as any;
      mutate(document);
      const tampered = `${JSON.stringify(document)}\n`;
      await writeFile(filePath, tampered, 'utf8');
      await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded' });
      await expect(readFile(filePath, 'utf8')).resolves.toBe(tampered);
    }

    const invalidUtf8 = Buffer.from([0xff, 0xfe, 0xfd]);
    await writeFile(filePath, invalidUtf8);
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded' });
    await expect(readFile(filePath)).resolves.toEqual(invalidUtf8);

    await writeFile(filePath, original, 'utf8');
    await writeFile(join(root, `.${REVISION_CANDIDATES_FILENAME}.abandoned.tmp`), '{partial', 'utf8');
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'ready', document: { revision: 1 } });
    await expect(readFile(filePath, 'utf8')).resolves.toBe(original);
  });

  it('leaves the prior document intact and cleans the temporary file when atomic replacement fails', async () => {
    const root = await project();
    const sequence = { value: 0 };
    const repository = store(root, sequence);
    await repository.createManual('project-a', 0, manualInput());
    const filePath = join(root, REVISION_CANDIDATES_FILENAME);
    const before = await readFile(filePath, 'utf8');
    const realOpen = fs.open.bind(fs);
    vi.spyOn(fs, 'open').mockImplementationOnce(async (...args: any[]) => {
      const handle = await (realOpen as any)(...args);
      vi.spyOn(handle, 'sync').mockRejectedValueOnce(new Error('synthetic sync failure'));
      return handle;
    });

    await expect(repository.createManual('project-a', 1, manualInput())).rejects.toMatchObject({
      code: 'WRITE_FAILED',
    } satisfies Partial<RevisionCandidateRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe(before);
    expect((await readdir(root)).filter((name) => name.endsWith('.tmp'))).toEqual([]);

    vi.restoreAllMocks();
    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('synthetic rename failure'));

    await expect(repository.createManual('project-a', 1, manualInput())).rejects.toMatchObject({
      code: 'WRITE_FAILED',
    } satisfies Partial<RevisionCandidateRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe(before);
    expect((await readdir(root)).filter((name) => name.endsWith('.tmp'))).toEqual([]);
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
