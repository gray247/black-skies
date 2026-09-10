import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  REVISION_CANDIDATE_HISTORY_LIMIT,
  REVISION_CANDIDATE_MAX_PURPOSE_LENGTH,
  REVISION_CANDIDATE_MAX_SOURCE_LENGTH,
  REVISION_CANDIDATE_MAX_TEXT_LENGTH,
  REVISION_CANDIDATE_MAX_WARNING_LENGTH,
  REVISION_CANDIDATE_SCHEMA_VERSION,
  type CreateManualRevisionCandidateRequest,
  type RevisionCandidateCurrentness,
  type RevisionCandidateAcceptanceFinalizationRequestV1,
  type RevisionCandidateHistoryEventV1,
  type RevisionCandidateLifecycle,
  type RevisionCandidateProvenanceV1,
  type RevisionCandidateProtectionV1,
  type RevisionCandidateSourceAnchorV1,
  type RevisionCandidateSourceSnapshotV1,
  type RevisionCandidateV1,
  type RevisionCandidatesDocumentV1,
  type RevisionCandidatesSnapshotV1,
} from '../shared/ipc/revisionCandidates.js';
import type {
  Program7LocalInferenceReceiptV1,
  Program7LocalInferenceResponseV1,
  Program7LocalInferenceRequestV1,
} from '../shared/localInference.js';
import { program7LocalInferencePromptHash } from './ollamaLocalInferenceTransport.js';

const PROGRAM7_REQUEST_SCHEMA = 'program7.local-inference.request.v1';
const PROGRAM7_RESPONSE_SCHEMA = 'program7.local-inference.response.v1';

export const REVISION_CANDIDATES_FILENAME = 'revision-candidates.json';
const queues = new Map<string, Promise<void>>();
const LIFECYCLES: readonly RevisionCandidateLifecycle[] = [
  'generated',
  'reviewing',
  'accepted',
  'partially accepted',
  'rejected',
  'parked',
  'abandoned',
  'stale',
];
const CURRENTNESS: readonly RevisionCandidateCurrentness[] = ['current', 'stale', 'unavailable'];

export class RevisionCandidateRepositoryError extends Error {
  constructor(
    readonly code:
      | 'UNAVAILABLE'
      | 'WRITE_FAILED'
      | 'STALE'
      | 'UNKNOWN_CANDIDATE'
      | 'INVALID'
      | 'PROTECTED_SOURCE'
      | 'LOCAL_AI_UNAVAILABLE',
    message: string,
  ) {
    super(message);
    this.name = 'RevisionCandidateRepositoryError';
  }
}

function key(filePath: string): string {
  const normalized = path.normalize(filePath);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

async function serialize<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const previous = queues.get(key(filePath)) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  const tail = result.then(
    () => undefined,
    () => undefined,
  );
  queues.set(key(filePath), tail);
  try {
    return await result;
  } finally {
    if (queues.get(key(filePath)) === tail) queues.delete(key(filePath));
  }
}

function nonEmpty(value: unknown, maximum = 240): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}

function bounded(value: unknown, maximum: number, empty = false): value is string {
  return typeof value === 'string' && (empty || value.length > 0) && value.length <= maximum;
}

function hash(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}
function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function exactKeys(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean {
  if (!record(value)) return false;
  const keys = Object.keys(value);
  return (
    keys.length >= required.length &&
    required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
}
function timestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
function lifecycle(value: unknown): value is RevisionCandidateLifecycle {
  return LIFECYCLES.includes(value as RevisionCandidateLifecycle);
}
function currentness(value: unknown): value is RevisionCandidateCurrentness {
  return CURRENTNESS.includes(value as RevisionCandidateCurrentness);
}

function validProtection(value: unknown): value is RevisionCandidateProtectionV1 {
  if (!exactKeys(value, ['excluded', 'class'], ['reason'])) return false;
  const candidate = value as Partial<RevisionCandidateProtectionV1>;
  return (
    typeof candidate.excluded === 'boolean' &&
    ['ordinary', 'protected', 'metadata-only', 'ai-excluded'].includes(String(candidate.class)) &&
    (candidate.reason === undefined || bounded(candidate.reason, 500))
  );
}

function validSnapshot(value: unknown): value is RevisionCandidateSourceSnapshotV1 {
  if (!exactKeys(value, ['unitId', 'bodySha256', 'text'])) return false;
  const candidate = value as Partial<RevisionCandidateSourceSnapshotV1>;
  return (
    nonEmpty(candidate.unitId) &&
    hash(candidate.bodySha256 ?? '') &&
    bounded(candidate.text, REVISION_CANDIDATE_MAX_SOURCE_LENGTH) &&
    candidate.bodySha256 === digest(candidate.text)
  );
}

function validAnchor(value: unknown): value is RevisionCandidateSourceAnchorV1 | null {
  if (value === null) return true;
  if (!exactKeys(value, ['unitId', 'selectionStart', 'selectionEnd', 'selectionFingerprint']))
    return false;
  const candidate = value as Partial<RevisionCandidateSourceAnchorV1>;
  return (
    nonEmpty(candidate.unitId) &&
    Number.isInteger(candidate.selectionStart) &&
    (candidate.selectionStart as number) >= 0 &&
    Number.isInteger(candidate.selectionEnd) &&
    (candidate.selectionEnd as number) >= (candidate.selectionStart as number) &&
    hash(candidate.selectionFingerprint ?? '')
  );
}

function validProvenance(value: unknown): value is RevisionCandidateProvenanceV1 {
  if (!exactKeys(value, ['origin', 'source', 'model', 'receipt'])) return false;
  const candidate = value as Partial<RevisionCandidateProvenanceV1>;
  return (
    (candidate.origin === 'manual' &&
      candidate.source === 'author' &&
      candidate.model === null &&
      candidate.receipt === null) ||
    (candidate.origin === 'local-ai' &&
      candidate.source === 'program7-local-ai' &&
      candidate.model === 'qwen3:4b' &&
      validReceipt(candidate.receipt))
  );
}

function validReceipt(value: unknown): value is Program7LocalInferenceReceiptV1 {
  if (
    !exactKeys(value, [
      'endpoint',
      'requestedModel',
      'actualModel',
      'modelDigest',
      'ollamaVersion',
      'promptSha256',
      'schemaSha256',
      'startedAt',
      'firstTokenAt',
      'endedAt',
      'promptTokens',
      'outputTokens',
    ])
  )
    return false;
  const receipt = value as Partial<Program7LocalInferenceReceiptV1>;
  return (
    receipt.endpoint === 'http://127.0.0.1:11434' &&
    receipt.requestedModel === 'qwen3:4b' &&
    receipt.actualModel === 'qwen3:4b' &&
    hash(receipt.modelDigest ?? '') &&
    typeof receipt.ollamaVersion === 'string' &&
    receipt.ollamaVersion.trim().length > 0 &&
    hash(receipt.promptSha256 ?? '') &&
    hash(receipt.schemaSha256 ?? '') &&
    timestamp(receipt.startedAt) &&
    (receipt.firstTokenAt === null || timestamp(receipt.firstTokenAt)) &&
    timestamp(receipt.endedAt) &&
    Number.isInteger(receipt.promptTokens) &&
    (receipt.promptTokens as number) >= 0 &&
    Number.isInteger(receipt.outputTokens) &&
    (receipt.outputTokens as number) >= 0
  );
}

function validHistory(value: unknown): value is readonly RevisionCandidateHistoryEventV1[] {
  return (
    Array.isArray(value) &&
    value.length <= REVISION_CANDIDATE_HISTORY_LIMIT &&
    value.every((entry) => {
      if (!exactKeys(entry, ['id', 'lifecycle', 'actor', 'occurredAt', 'note'])) return false;
      const candidate = entry as Partial<RevisionCandidateHistoryEventV1>;
      return (
        nonEmpty(candidate.id) &&
        lifecycle(candidate.lifecycle) &&
        ['author', 'local-ai', 'system'].includes(String(candidate.actor)) &&
        timestamp(candidate.occurredAt) &&
        (candidate.note === null || bounded(candidate.note, 1_000, true))
      );
    })
  );
}

function validCandidate(value: unknown, projectId: string): value is RevisionCandidateV1 {
  if (
    !exactKeys(value, [
      'id',
      'projectId',
      'unitId',
      'sourceSnapshot',
      'sourceAnchor',
      'sourceBodySha256',
      'purpose',
      'origin',
      'provenance',
      'protection',
      'warnings',
      'currentness',
      'candidateText',
      'editedCandidateText',
      'lifecycle',
      'history',
      'createdAt',
      'updatedAt',
    ])
  )
    return false;
  const candidate = value as Partial<RevisionCandidateV1>;
  return (
    nonEmpty(candidate.id) &&
    candidate.projectId === projectId &&
    nonEmpty(candidate.unitId) &&
    validSnapshot(candidate.sourceSnapshot) &&
    candidate.sourceSnapshot.unitId === candidate.unitId &&
    candidate.sourceSnapshot.bodySha256 === candidate.sourceBodySha256 &&
    (candidate.sourceAnchor === null ||
      (validAnchor(candidate.sourceAnchor) &&
        candidate.sourceAnchor.unitId === candidate.unitId)) &&
    hash(candidate.sourceBodySha256 ?? '') &&
    bounded(candidate.purpose, REVISION_CANDIDATE_MAX_PURPOSE_LENGTH) &&
    (candidate.origin === 'manual' || candidate.origin === 'local-ai') &&
    validProvenance(candidate.provenance) &&
    candidate.provenance.origin === candidate.origin &&
    validProtection(candidate.protection) &&
    candidate.protection.excluded === false &&
    candidate.protection.class === 'ordinary' &&
    Array.isArray(candidate.warnings) &&
    candidate.warnings.length <= 12 &&
    candidate.warnings.every((warning) =>
      bounded(warning, REVISION_CANDIDATE_MAX_WARNING_LENGTH),
    ) &&
    currentness(candidate.currentness) &&
    bounded(candidate.candidateText, REVISION_CANDIDATE_MAX_TEXT_LENGTH) &&
    (candidate.editedCandidateText === null ||
      bounded(candidate.editedCandidateText, REVISION_CANDIDATE_MAX_TEXT_LENGTH)) &&
    lifecycle(candidate.lifecycle) &&
    (candidate.lifecycle === 'stale'
      ? candidate.currentness === 'stale'
      : candidate.currentness === 'current') &&
    validHistory(candidate.history) &&
    candidate.history.length > 0 &&
    new Set(candidate.history.map((entry) => entry.id)).size === candidate.history.length &&
    candidate.history[0]!.lifecycle === 'generated' &&
    candidate.history[candidate.history.length - 1]!.lifecycle === candidate.lifecycle &&
    timestamp(candidate.createdAt) &&
    timestamp(candidate.updatedAt) &&
    Date.parse(candidate.updatedAt) >= Date.parse(candidate.createdAt)
  );
}

function validDocument(value: unknown, projectId: string): value is RevisionCandidatesDocumentV1 {
  if (!exactKeys(value, ['schemaVersion', 'projectId', 'revision', 'candidates'])) return false;
  const candidate = value as Partial<RevisionCandidatesDocumentV1>;
  return (
    candidate.schemaVersion === REVISION_CANDIDATE_SCHEMA_VERSION &&
    candidate.projectId === projectId &&
    Number.isInteger(candidate.revision) &&
    (candidate.revision as number) >= 0 &&
    Array.isArray(candidate.candidates) &&
    candidate.candidates.every((item) => validCandidate(item, projectId)) &&
    new Set(candidate.candidates.map((item) => item.id)).size === candidate.candidates.length
  );
}

function validInferenceRequest(value: unknown): value is Program7LocalInferenceRequestV1 {
  if (!record(value)) return false;
  const candidate = value as Record<string, any>;
  if (
    !exactKeys(candidate, [
      'schema',
      'operation',
      'model',
      'requestId',
      'projectId',
      'source',
      'purpose',
      'limits',
      'protection',
    ]) ||
    !record(candidate.source) ||
    !exactKeys(candidate.source, ['unitId', 'bodySha256', 'text']) ||
    !record(candidate.limits) ||
    !exactKeys(candidate.limits, ['inputChars', 'outputChars']) ||
    !record(candidate.protection) ||
    !exactKeys(candidate.protection, ['excluded', 'class'])
  )
    return false;
  return (
    candidate.schema === PROGRAM7_REQUEST_SCHEMA &&
    ['rewrite_candidate', 'revision_recheck', 'premise_alternative'].includes(
      String(candidate.operation),
    ) &&
    candidate.model === 'qwen3:4b' &&
    nonEmpty(candidate.requestId, 160) &&
    nonEmpty(candidate.projectId, 240) &&
    nonEmpty(candidate.source.unitId, 240) &&
    hash(String(candidate.source.bodySha256)) &&
    bounded(
      candidate.source.text,
      candidate.operation === 'revision_recheck' ? 8_000 : REVISION_CANDIDATE_MAX_SOURCE_LENGTH,
    ) &&
    candidate.source.bodySha256 === digest(candidate.source.text) &&
    bounded(candidate.purpose, REVISION_CANDIDATE_MAX_PURPOSE_LENGTH) &&
    Number.isInteger(candidate.limits.inputChars) &&
    Number.isInteger(candidate.limits.outputChars) &&
    ((candidate.operation === 'revision_recheck' &&
      candidate.limits.inputChars === 8_000 &&
      candidate.limits.outputChars === 2_000) ||
      (candidate.operation !== 'revision_recheck' &&
        candidate.limits.inputChars === 12_000 &&
        candidate.limits.outputChars === 6_000)) &&
    typeof candidate.protection.excluded === 'boolean' &&
    candidate.protection.class === 'ordinary'
  );
}

function validLocalResponse(
  value: unknown,
  request: Program7LocalInferenceRequestV1,
): value is Program7LocalInferenceResponseV1 {
  if (!record(value)) return false;
  const candidate = value as Record<string, any>;
  if (
    !exactKeys(candidate, [
      'schema',
      'requestId',
      'model',
      'status',
      'text',
      'reason',
      'usage',
      'receipt',
    ]) ||
    !record(candidate.usage) ||
    !exactKeys(candidate.usage, ['inputChars', 'outputChars'])
  )
    return false;
  return (
    candidate.schema === PROGRAM7_RESPONSE_SCHEMA &&
    candidate.requestId === request.requestId &&
    candidate.model === 'qwen3:4b' &&
    candidate.status === 'candidate' &&
    bounded(candidate.text, REVISION_CANDIDATE_MAX_TEXT_LENGTH) &&
    bounded(candidate.reason, REVISION_CANDIDATE_MAX_WARNING_LENGTH) &&
    Number.isInteger(candidate.usage.inputChars) &&
    candidate.usage.inputChars === request.source.text.length &&
    Number.isInteger(candidate.usage.outputChars) &&
    candidate.usage.outputChars === candidate.text.length &&
    validReceipt(candidate.receipt) &&
    candidate.receipt.promptSha256 === program7LocalInferencePromptHash(request)
  );
}

function empty(projectId: string): RevisionCandidatesDocumentV1 {
  return {
    schemaVersion: REVISION_CANDIDATE_SCHEMA_VERSION,
    projectId,
    revision: 0,
    candidates: [],
  };
}

function event(
  id: string,
  value: RevisionCandidateLifecycle,
  actor: 'author' | 'local-ai' | 'system',
  occurredAt: string,
  note: string | null = null,
): RevisionCandidateHistoryEventV1 {
  return { id, lifecycle: value, actor, occurredAt, note };
}

function trimHistory(
  history: readonly RevisionCandidateHistoryEventV1[],
): readonly RevisionCandidateHistoryEventV1[] {
  return history.length <= REVISION_CANDIDATE_HISTORY_LIMIT
    ? history
    : history.slice(history.length - REVISION_CANDIDATE_HISTORY_LIMIT);
}

export class RevisionCandidateRepository {
  readonly filePath: string;

  constructor(
    readonly projectPath: string,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => randomUUID(),
  ) {
    this.filePath = path.join(path.resolve(projectPath), REVISION_CANDIDATES_FILENAME);
  }

  async read(projectId: string): Promise<RevisionCandidatesSnapshotV1> {
    try {
      const document = JSON.parse(await fs.readFile(this.filePath, 'utf8')) as unknown;
      if (!validDocument(document, projectId))
        throw new RevisionCandidateRepositoryError(
          'UNAVAILABLE',
          'Saved revision candidates have an unsupported format.',
        );
      return { availability: 'ready', document, message: null };
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT')
        return { availability: 'ready', document: empty(projectId), message: null };
      return {
        availability: 'degraded',
        document: empty(projectId),
        message:
          error instanceof RevisionCandidateRepositoryError
            ? error.message
            : 'Saved revision candidates are not readable.',
      };
    }
  }

  async createManual(
    projectId: string,
    expectedRevision: number,
    input: Omit<
      CreateManualRevisionCandidateRequest,
      'projectId' | 'projectPath' | 'operationId' | 'generation' | 'expectedRevision'
    >,
  ): Promise<RevisionCandidatesSnapshotV1> {
    if (
      !validSnapshot(input.sourceSnapshot) ||
      !validAnchor(input.sourceAnchor ?? null) ||
      (input.sourceAnchor !== undefined &&
        input.sourceAnchor !== null &&
        input.sourceAnchor.unitId !== input.sourceSnapshot.unitId) ||
      !bounded(input.purpose, REVISION_CANDIDATE_MAX_PURPOSE_LENGTH) ||
      !bounded(input.candidateText, REVISION_CANDIDATE_MAX_TEXT_LENGTH) ||
      !validProtection(input.protection) ||
      input.protection.excluded ||
      input.protection.class !== 'ordinary' ||
      (input.warnings !== undefined &&
        (!Array.isArray(input.warnings) || input.warnings.length > 12)) ||
      !(input.warnings ?? []).every((warning) =>
        bounded(warning, REVISION_CANDIDATE_MAX_WARNING_LENGTH),
      )
    )
      throw new RevisionCandidateRepositoryError(
        'INVALID',
        'The manual revision candidate is invalid.',
      );
    return this.mutate(projectId, expectedRevision, (document) => {
      const occurredAt = this.now().toISOString();
      const candidate: RevisionCandidateV1 = {
        id: `candidate_${this.createId()}`,
        projectId,
        unitId: input.sourceSnapshot.unitId,
        sourceSnapshot: input.sourceSnapshot,
        sourceAnchor: input.sourceAnchor ?? null,
        sourceBodySha256: input.sourceSnapshot.bodySha256,
        purpose: input.purpose.trim(),
        origin: 'manual',
        provenance: { origin: 'manual', source: 'author', model: null, receipt: null },
        protection: input.protection,
        warnings: input.warnings ?? [],
        currentness: 'current',
        candidateText: input.candidateText,
        editedCandidateText: null,
        lifecycle: 'generated',
        history: [event(`candidate_event_${this.createId()}`, 'generated', 'author', occurredAt)],
        createdAt: occurredAt,
        updatedAt: occurredAt,
      };
      return [...document.candidates, candidate];
    });
  }

  async createFromLocalAi(
    projectId: string,
    expectedRevision: number,
    request: Program7LocalInferenceRequestV1,
    response: Program7LocalInferenceResponseV1,
    sourceAnchor: RevisionCandidateSourceAnchorV1 | null = null,
  ): Promise<RevisionCandidatesSnapshotV1> {
    if (
      request.projectId !== projectId ||
      !validInferenceRequest(request) ||
      request.source.text.length > REVISION_CANDIDATE_MAX_SOURCE_LENGTH ||
      request.protection.excluded ||
      request.protection.class !== 'ordinary' ||
      response.requestId !== request.requestId ||
      !validLocalResponse(response, request) ||
      !validAnchor(sourceAnchor) ||
      (sourceAnchor !== null && sourceAnchor.unitId !== request.source.unitId)
    )
      throw new RevisionCandidateRepositoryError(
        'LOCAL_AI_UNAVAILABLE',
        'The local-AI candidate did not satisfy the candidate contract.',
      );
    return this.mutate(projectId, expectedRevision, (document) => {
      const occurredAt = this.now().toISOString();
      const provenance: RevisionCandidateProvenanceV1 = {
        origin: 'local-ai',
        source: 'program7-local-ai',
        model: 'qwen3:4b',
        receipt: response.receipt,
      };
      const candidate: RevisionCandidateV1 = {
        id: `candidate_${this.createId()}`,
        projectId,
        unitId: request.source.unitId,
        sourceSnapshot: {
          unitId: request.source.unitId,
          bodySha256: request.source.bodySha256,
          text: request.source.text,
        },
        sourceAnchor,
        sourceBodySha256: request.source.bodySha256,
        purpose: request.purpose,
        origin: 'local-ai',
        provenance,
        protection: { excluded: false, class: 'ordinary' },
        warnings: [response.reason],
        currentness: 'current',
        candidateText: response.text,
        editedCandidateText: null,
        lifecycle: 'generated',
        history: [
          event(
            `candidate_event_${this.createId()}`,
            'generated',
            'local-ai',
            occurredAt,
            response.reason,
          ),
        ],
        createdAt: occurredAt,
        updatedAt: occurredAt,
      };
      return [...document.candidates, candidate];
    });
  }

  async edit(
    projectId: string,
    expectedRevision: number,
    candidateId: string,
    editedCandidateText: string,
  ): Promise<RevisionCandidatesSnapshotV1> {
    if (!bounded(editedCandidateText, REVISION_CANDIDATE_MAX_TEXT_LENGTH))
      throw new RevisionCandidateRepositoryError('INVALID', 'The edited candidate is invalid.');
    return this.mutate(projectId, expectedRevision, (document) => {
      const found = document.candidates.find((candidate) => candidate.id === candidateId);
      if (!found)
        throw new RevisionCandidateRepositoryError(
          'UNKNOWN_CANDIDATE',
          'The revision candidate does not exist.',
        );
      const occurredAt = this.now().toISOString();
      const updated = {
        ...found,
        editedCandidateText,
        lifecycle: 'reviewing' as const,
        updatedAt: occurredAt,
        history: trimHistory([
          ...found.history,
          event(
            `candidate_event_${this.createId()}`,
            'reviewing',
            'author',
            occurredAt,
            'Candidate text edited.',
          ),
        ]),
      };
      return document.candidates.map((candidate) =>
        candidate.id === candidateId ? updated : candidate,
      );
    });
  }

  async setLifecycle(
    projectId: string,
    expectedRevision: number,
    candidateId: string,
    nextLifecycle: RevisionCandidateLifecycle,
    note: string | undefined = undefined,
  ): Promise<RevisionCandidatesSnapshotV1> {
    if (
      !lifecycle(nextLifecycle) ||
      nextLifecycle === 'accepted' ||
      nextLifecycle === 'partially accepted' ||
      (note !== undefined && !bounded(note, 1_000, true))
    )
      throw new RevisionCandidateRepositoryError(
        'INVALID',
        'The candidate lifecycle change is invalid.',
      );
    return this.mutate(projectId, expectedRevision, (document) => {
      const found = document.candidates.find((candidate) => candidate.id === candidateId);
      if (!found)
        throw new RevisionCandidateRepositoryError(
          'UNKNOWN_CANDIDATE',
          'The revision candidate does not exist.',
        );
      const occurredAt = this.now().toISOString();
      const actor =
        nextLifecycle === 'generated'
          ? found.origin === 'local-ai'
            ? 'local-ai'
            : 'author'
          : 'author';
      const updated = {
        ...found,
        lifecycle: nextLifecycle,
        currentness: nextLifecycle === 'stale' ? ('stale' as const) : found.currentness,
        updatedAt: occurredAt,
        history: trimHistory([
          ...found.history,
          event(
            `candidate_event_${this.createId()}`,
            nextLifecycle,
            actor,
            occurredAt,
            note ?? null,
          ),
        ]),
      };
      return document.candidates.map((candidate) =>
        candidate.id === candidateId ? updated : candidate,
      );
    });
  }

  /** Main-process-only completion hook for Narrative Insertion after durable save. */
  async finalizeAcceptance(
    projectId: string,
    request: RevisionCandidateAcceptanceFinalizationRequestV1,
  ): Promise<RevisionCandidatesSnapshotV1> {
    const receipt = request.receipt;
    if (
      !Number.isInteger(request.expectedRevision) ||
      !nonEmpty(request.candidateId, 240) ||
      (request.lifecycle !== 'accepted' && request.lifecycle !== 'partially accepted') ||
      !record(receipt) ||
      !exactKeys(receipt, [
        'sourceBodySha256',
        'candidateTextSha256',
        'savedBodySha256',
        'savedAt',
      ]) ||
      !hash(receipt.sourceBodySha256) ||
      !hash(receipt.candidateTextSha256) ||
      !hash(receipt.savedBodySha256) ||
      !timestamp(receipt.savedAt) ||
      (request.note !== undefined && !bounded(request.note, 1_000, true))
    )
      throw new RevisionCandidateRepositoryError(
        'INVALID',
        'The acceptance finalization receipt is invalid.',
      );
    return this.mutate(projectId, request.expectedRevision, (document) => {
      const found = document.candidates.find((candidate) => candidate.id === request.candidateId);
      if (!found)
        throw new RevisionCandidateRepositoryError(
          'UNKNOWN_CANDIDATE',
          'The revision candidate does not exist.',
        );
      const acceptedText = found.editedCandidateText ?? found.candidateText;
      if (
        found.currentness !== 'current' ||
        found.sourceBodySha256 !== receipt.sourceBodySha256 ||
        digest(acceptedText) !== receipt.candidateTextSha256
      )
        throw new RevisionCandidateRepositoryError(
          'STALE',
          'The candidate no longer matches the saved manuscript insertion.',
        );
      const occurredAt = receipt.savedAt;
      const updated = {
        ...found,
        lifecycle: request.lifecycle,
        updatedAt: occurredAt,
        history: trimHistory([
          ...found.history,
          event(
            `candidate_event_${this.createId()}`,
            request.lifecycle,
            'system',
            occurredAt,
            request.note ?? 'Narrative insertion saved the candidate.',
          ),
        ]),
      };
      return document.candidates.map((candidate) =>
        candidate.id === request.candidateId ? updated : candidate,
      );
    });
  }

  async create(
    projectId: string,
    expectedRevision: number,
    input: Parameters<RevisionCandidateRepository['createManual']>[2],
  ) {
    return this.createManual(projectId, expectedRevision, input);
  }
  async createLocalAi(
    projectId: string,
    expectedRevision: number,
    request: Program7LocalInferenceRequestV1,
    response: Program7LocalInferenceResponseV1,
    sourceAnchor: RevisionCandidateSourceAnchorV1 | null = null,
  ) {
    return this.createFromLocalAi(projectId, expectedRevision, request, response, sourceAnchor);
  }

  private async mutate(
    projectId: string,
    expectedRevision: number,
    change: (document: RevisionCandidatesDocumentV1) => readonly RevisionCandidateV1[],
  ): Promise<RevisionCandidatesSnapshotV1> {
    return serialize(this.filePath, async () => {
      const current = await this.read(projectId);
      if (current.availability === 'degraded')
        throw new RevisionCandidateRepositoryError(
          'UNAVAILABLE',
          current.message ?? 'Revision candidates are unavailable.',
        );
      if (!Number.isInteger(expectedRevision) || current.document.revision !== expectedRevision)
        throw new RevisionCandidateRepositoryError(
          'STALE',
          'Revision candidates changed. Reload before saving again.',
        );
      const next: RevisionCandidatesDocumentV1 = {
        ...current.document,
        revision: current.document.revision + 1,
        candidates: change(current.document),
      };
      if (!validDocument(next, projectId))
        throw new RevisionCandidateRepositoryError(
          'INVALID',
          'The revision candidate change is invalid.',
        );
      await this.write(next);
      return { availability: 'ready', document: next, message: null };
    });
  }

  private async write(document: RevisionCandidatesDocumentV1): Promise<void> {
    const directory = path.dirname(this.filePath);
    const tempPath = path.join(
      directory,
      `.${REVISION_CANDIDATES_FILENAME}.${this.createId()}.tmp`,
    );
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(tempPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
      await fs.rename(tempPath, this.filePath);
    } catch {
      await fs.rm(tempPath, { force: true }).catch(() => undefined);
      throw new RevisionCandidateRepositoryError(
        'WRITE_FAILED',
        'The revision candidate could not be saved.',
      );
    }
  }
}
