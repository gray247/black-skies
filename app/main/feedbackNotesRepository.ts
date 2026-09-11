import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  FEEDBACK_NOTE_HISTORY_LIMIT,
  FEEDBACK_NOTE_MAX_BODY_LENGTH,
  FEEDBACK_NOTE_SCHEMA_VERSION,
  type CreateRevisionItemInput,
  type AdvisoryFeedbackNote,
  type FeedbackNoteRecord,
  type FeedbackNoteDisposition,
  type FeedbackNotesDocument,
  type FeedbackNoteMutationResult,
  type FeedbackNoteRecheck,
  type FeedbackRevisionDisposition,
  type FeedbackRevisionLifecycle,
  type FeedbackRecheckStatus,
  type RevisionItem,
} from '../shared/ipc/feedbackNotes.js';

export const FEEDBACK_NOTES_FILENAME = 'feedback-notes.json';
const projectWriteQueues = new Map<string, Promise<void>>();

function serializationKey(filePath: string): string {
  const normalized = path.normalize(filePath);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

async function serializeProjectWrite<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const key = serializationKey(filePath);
  const previous = projectWriteQueues.get(key) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  const tail = result.then(
    () => undefined,
    () => undefined,
  );
  projectWriteQueues.set(key, tail);
  try {
    return await result;
  } finally {
    if (projectWriteQueues.get(key) === tail) projectWriteQueues.delete(key);
  }
}

interface LoadedDocument {
  readonly document: FeedbackNotesDocument;
  readonly legacy: boolean;
}

export class FeedbackNotesRepositoryError extends Error {
  constructor(
    readonly code: 'UNAVAILABLE' | 'WRITE_FAILED' | 'STALE' | 'UNKNOWN_ITEM' | 'INVALID',
    message: string,
  ) {
    super(message);
    this.name = 'FeedbackNotesRepositoryError';
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

function isLifecycle(value: unknown): value is FeedbackRevisionLifecycle {
  return (
    value === 'active' ||
    value === 'review' ||
    value === 'intended' ||
    value === 'underway' ||
    value === 'ready_for_recheck' ||
    value === 'stale' ||
    value === 'recheck_pending' ||
    value === 'parked' ||
    value === 'dismissed' ||
    value === 'resolved' ||
    value === 'abandoned'
  );
}

const ACTIVE_REVISION_LIFECYCLES = new Set<FeedbackRevisionLifecycle>([
  'active',
  'review',
  'intended',
  'underway',
  'ready_for_recheck',
  'stale',
  'recheck_pending',
]);

function isDisposition(value: unknown): value is FeedbackRevisionDisposition {
  return (
    value === 'parked' || value === 'dismissed' || value === 'resolved' || value === 'abandoned'
  );
}

function isAnchor(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  const anchor = value as Record<string, unknown>;
  return (
    anchor.schemaVersion === 1 &&
    (anchor.anchorKind === 'position' || anchor.anchorKind === 'span') &&
    Number.isInteger(anchor.selectionStart) &&
    (anchor.selectionStart as number) >= 0 &&
    Number.isInteger(anchor.selectionEnd) &&
    (anchor.selectionEnd as number) >= (anchor.selectionStart as number) &&
    typeof anchor.selectionSearchFingerprint === 'string' &&
    /^[a-f0-9]{8}$/u.test(anchor.selectionSearchFingerprint) &&
    isSha256(anchor.sourceFingerprint) &&
    isSha256(anchor.selectionFingerprint) &&
    Number.isInteger(anchor.prefixLength) &&
    (anchor.prefixLength as number) >= 0 &&
    (anchor.prefixLength as number) <= 32 &&
    Number.isInteger(anchor.suffixLength) &&
    (anchor.suffixLength as number) >= 0 &&
    (anchor.suffixLength as number) <= 32 &&
    typeof anchor.prefixSearchFingerprint === 'string' &&
    /^[a-f0-9]{8}$/u.test(anchor.prefixSearchFingerprint) &&
    isSha256(anchor.prefixFingerprint) &&
    typeof anchor.suffixSearchFingerprint === 'string' &&
    /^[a-f0-9]{8}$/u.test(anchor.suffixSearchFingerprint) &&
    isSha256(anchor.suffixFingerprint)
  );
}

function isDispositionHistory(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  return value.every((entry) =>
    Boolean(
      entry &&
        typeof entry === 'object' &&
        isNonEmptyString((entry as FeedbackNoteDisposition).id) &&
        isDisposition((entry as FeedbackNoteDisposition).disposition) &&
        isNonEmptyString((entry as FeedbackNoteDisposition).createdAt) &&
        isNonEmptyString((entry as FeedbackNoteDisposition).actor),
    ),
  );
}

function isRechecks(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  return value.every((entry) =>
    Boolean(
      entry &&
        typeof entry === 'object' &&
        isNonEmptyString((entry as FeedbackNoteRecheck).id) &&
        ((entry as FeedbackNoteRecheck).status === 'appears_resolved' ||
          (entry as FeedbackNoteRecheck).status === 'still_appears_present' ||
          (entry as FeedbackNoteRecheck).status === 'unavailable' ||
          (entry as FeedbackNoteRecheck).status === 'not_run') &&
        isNonEmptyString((entry as FeedbackNoteRecheck).createdAt),
    ),
  );
}

function isFeedbackNote(value: unknown, projectId: string): value is FeedbackNoteRecord {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (
    !isNonEmptyString(candidate.id) ||
    candidate.projectId !== projectId ||
    !isNonEmptyString(candidate.unitId) ||
    !isNonEmptyString(candidate.createdAt) ||
    typeof candidate.body !== 'string' ||
    candidate.body.length === 0 ||
    candidate.body.length > FEEDBACK_NOTE_MAX_BODY_LENGTH
  )
    return false;
  if (candidate.advisory === true) {
    return (
      isNonEmptyString(candidate.sourceCritiqueRequestId) &&
      isNonEmptyString(candidate.selectionFingerprint)
    );
  }
  return (
    candidate.advisory === false &&
    candidate.kind === 'revision_item' &&
    isLifecycle(candidate.lifecycle) &&
    isAnchor(candidate.anchor) &&
    (candidate.protection === undefined ||
      Boolean(
        candidate.protection &&
        typeof candidate.protection === 'object' &&
          isRecord(candidate.protection) && typeof candidate.protection.protected === 'boolean',
      )) &&
    (candidate.documentRevision === undefined ||
      (typeof candidate.documentRevision === 'number' &&
        Number.isInteger(candidate.documentRevision) &&
        candidate.documentRevision >= 0)) &&
    (candidate.sourceGeneration === undefined ||
      (typeof candidate.sourceGeneration === 'number' &&
        Number.isInteger(candidate.sourceGeneration) && candidate.sourceGeneration >= 0)) &&
    (candidate.sourceRevision === undefined ||
      (typeof candidate.sourceRevision === 'number' &&
        Number.isInteger(candidate.sourceRevision) && candidate.sourceRevision >= 0)) &&
    (candidate.sourceKind === undefined || isNonEmptyString(candidate.sourceKind)) &&
    (candidate.sourceId === undefined || isNonEmptyString(candidate.sourceId)) &&
    (candidate.sourceClass === undefined || isNonEmptyString(candidate.sourceClass)) &&
    isRechecks(candidate.rechecks) &&
    isDispositionHistory(candidate.dispositionHistory)
  );
}

function emptyDocument(projectId: string): FeedbackNotesDocument {
  return { schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION, projectId, revision: 0, notes: [] };
}

function validateDocument(value: unknown, projectId: string): LoadedDocument {
  if (!value || typeof value !== 'object')
    throw new FeedbackNotesRepositoryError('UNAVAILABLE', 'Saved feedback notes are not readable.');
  const candidate = value as Record<string, unknown>;
  const notes = candidate.notes;
  if (
    candidate.schemaVersion !== FEEDBACK_NOTE_SCHEMA_VERSION ||
    candidate.projectId !== projectId ||
    !Array.isArray(notes) ||
    !notes.every((note): note is FeedbackNoteRecord => isFeedbackNote(note, projectId)) ||
    new Set(notes.map((note) => note.id)).size !== notes.length
  ) {
    throw new FeedbackNotesRepositoryError(
      'UNAVAILABLE',
      'Saved feedback notes have an unsupported format.',
    );
  }
  const revisionValue = candidate.revision;
  const legacy = revisionValue === undefined;
  if (
    !legacy &&
    (typeof revisionValue !== 'number' || !Number.isInteger(revisionValue) || revisionValue < 0)
  ) {
    throw new FeedbackNotesRepositoryError(
      'UNAVAILABLE',
      'Saved feedback notes have an unsupported revision.',
    );
  }
  return {
    document: {
      ...candidate,
      schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION,
      projectId,
      revision: legacy ? 0 : revisionValue,
      notes,
    },
    legacy,
  };
}

function noteId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

function makeDisposition(
  id: string,
  value: FeedbackRevisionDisposition,
  now: string,
  reason?: string,
): FeedbackNoteDisposition {
  return { id, disposition: value, createdAt: now, actor: 'author', ...(reason ? { reason } : {}) };
}

function trimHistory(notes: readonly FeedbackNoteRecord[]): readonly FeedbackNoteRecord[] {
  const inactive = notes.filter(
    (note) =>
      note.advisory === false &&
      (note.lifecycle === 'resolved' ||
        note.lifecycle === 'dismissed' ||
        note.lifecycle === 'abandoned' ||
        note.lifecycle === 'parked') &&
      !note.retained,
  );
  if (inactive.length <= FEEDBACK_NOTE_HISTORY_LIMIT) return notes;
  const remove = new Set(
    inactive.slice(0, inactive.length - FEEDBACK_NOTE_HISTORY_LIMIT).map((note) => note.id),
  );
  return notes.filter((note) => !remove.has(note.id));
}

type CreateAdvisoryFeedbackNoteInput = {
  readonly projectId: string;
  readonly unitId: string;
  readonly sourceCritiqueRequestId: string;
  readonly selectionFingerprint: string;
  readonly body: string;
};

export class FeedbackNotesRepository {
  readonly filePath: string;

  constructor(
    readonly projectPath: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.filePath = path.join(path.resolve(projectPath), FEEDBACK_NOTES_FILENAME);
  }

  /** Compatibility entry point used by critiqueReviewIpc; this always creates an advisory note. */
  async create(
    note: CreateAdvisoryFeedbackNoteInput,
    expectedRevision?: number,
  ): Promise<AdvisoryFeedbackNote> {
    return serializeProjectWrite(this.filePath, async () => {
      const loaded = await this.readEnvelope(note.projectId);
      if (expectedRevision !== undefined && loaded.document.revision !== expectedRevision)
        throw new FeedbackNotesRepositoryError(
          'STALE',
          'Feedback notes changed. Reload before saving again.',
        );
      const created: AdvisoryFeedbackNote = {
        ...note,
        id: noteId('feedback'),
        createdAt: this.now().toISOString(),
        advisory: true,
      };
      const nextNotes = [...loaded.document.notes, created];
      // Keep a brand-new legacy IPC sidecar byte-compatible. An existing v1
      // sidecar is upgraded atomically by its first mutation.
      const next =
        expectedRevision === undefined && loaded.legacy && loaded.document.notes.length === 0
          ? {
              schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION,
              projectId: note.projectId,
              notes: nextNotes,
            }
          : this.nextDocument(loaded.document, nextNotes);
      if ('revision' in next) validateDocument(next, note.projectId);
      await this.writeEnvelope(next);
      return created;
    });
  }

  async createRevisionItem(
    input: CreateRevisionItemInput,
    expectedRevision = 0,
  ): Promise<FeedbackNoteMutationResult> {
    return this.mutate(input.projectId, expectedRevision, (document) => {
      const revision = document.revision + 1;
      const created: RevisionItem = {
        ...input,
        id: noteId('revision'),
        createdAt: this.now().toISOString(),
        advisory: false,
        kind: 'revision_item',
        lifecycle: 'active',
        documentRevision: revision,
        rechecks: [],
        dispositionHistory: [],
      };
      return { notes: [...document.notes, created], note: created };
    });
  }

  async createRevision(
    input: CreateRevisionItemInput,
    expectedRevision = 0,
  ): Promise<FeedbackNoteMutationResult> {
    return this.createRevisionItem(input, expectedRevision);
  }

  async read(projectId: string): Promise<FeedbackNotesDocument> {
    await projectWriteQueues.get(serializationKey(this.filePath));
    return (await this.readEnvelope(projectId)).document;
  }

  async write(
    projectId: string,
    expectedRevision: number,
    document: FeedbackNotesDocument,
  ): Promise<FeedbackNotesDocument> {
    if (document.projectId !== projectId || document.revision !== expectedRevision + 1) {
      throw new FeedbackNotesRepositoryError(
        'STALE',
        'Feedback notes revision is not the next revision.',
      );
    }
    const result = await this.mutate(projectId, expectedRevision, () => ({
      notes: document.notes,
    }));
    return result.document;
  }

  async list(projectId: string): Promise<readonly AdvisoryFeedbackNote[]> {
    await projectWriteQueues.get(serializationKey(this.filePath));
    return (await this.readEnvelope(projectId)).document.notes.filter(
      (note): note is AdvisoryFeedbackNote => note.advisory === true,
    );
  }

  async listAll(projectId: string): Promise<readonly FeedbackNoteRecord[]> {
    await projectWriteQueues.get(serializationKey(this.filePath));
    return (await this.readEnvelope(projectId)).document.notes;
  }

  async listRevisionItems(projectId: string): Promise<readonly RevisionItem[]> {
    return (await this.listAll(projectId)).filter(
      (note): note is RevisionItem => note.advisory === false,
    );
  }

  async readRevisionItem(projectId: string, itemId: string): Promise<RevisionItem | undefined> {
    return (await this.listRevisionItems(projectId)).find((item) => item.id === itemId);
  }

  async listActive(projectId: string): Promise<readonly FeedbackNoteRecord[]> {
    return (await this.listAll(projectId)).filter(
      (note) =>
        note.advisory === false &&
        ACTIVE_REVISION_LIFECYCLES.has(note.lifecycle),
    );
  }

  async getActive(projectId: string): Promise<readonly FeedbackNoteRecord[]> {
    return this.listActive(projectId);
  }

  async listHistory(projectId: string): Promise<readonly FeedbackNoteRecord[]> {
    return (await this.listAll(projectId)).filter(
      (note) =>
        note.advisory === false &&
        !ACTIVE_REVISION_LIFECYCLES.has(note.lifecycle),
    );
  }

  async getHistory(projectId: string): Promise<readonly FeedbackNoteRecord[]> {
    return this.listHistory(projectId);
  }

  async mutate(
    projectId: string,
    expectedRevision: number,
    change: (document: FeedbackNotesDocument) => {
      notes: readonly FeedbackNoteRecord[];
      note?: FeedbackNoteRecord;
    },
  ): Promise<FeedbackNoteMutationResult> {
    return serializeProjectWrite(this.filePath, async () => {
      const loaded = await this.readEnvelope(projectId);
      if (loaded.document.revision !== expectedRevision)
        throw new FeedbackNotesRepositoryError(
          'STALE',
          'Feedback notes changed. Reload before saving again.',
        );
      const changed = change(loaded.document);
      const next = this.nextDocument(loaded.document, changed.notes);
      validateDocument(next, projectId);
      await this.writeEnvelope(next);
      return { document: next, ...(changed.note ? { note: changed.note } : {}) };
    });
  }

  async setLifecycle(
    projectId: string,
    expectedRevision: number,
    itemId: string,
    lifecycle: FeedbackRevisionLifecycle,
    reason?: string,
  ): Promise<FeedbackNoteMutationResult> {
    return this.updateRevisionItem(projectId, expectedRevision, itemId, (item, revision) => ({
      ...item,
      lifecycle,
      documentRevision: revision,
      dispositionHistory: isDisposition(lifecycle)
        ? [
            ...(item.dispositionHistory ?? []),
            makeDisposition(noteId('disposition'), lifecycle, this.now().toISOString(), reason),
          ]
        : item.dispositionHistory,
    }));
  }

  async park(projectId: string, expectedRevision: number, itemId: string, reason?: string) {
    return this.setLifecycle(projectId, expectedRevision, itemId, 'parked', reason);
  }
  async dismiss(projectId: string, expectedRevision: number, itemId: string, reason?: string) {
    return this.setLifecycle(projectId, expectedRevision, itemId, 'dismissed', reason);
  }
  async resolve(projectId: string, expectedRevision: number, itemId: string, reason?: string) {
    return this.setLifecycle(projectId, expectedRevision, itemId, 'resolved', reason);
  }

  async update(
    projectId: string,
    expectedRevision: number,
    itemId: string,
    patch: Partial<RevisionItem>,
  ): Promise<FeedbackNoteMutationResult> {
    return this.updateRevisionItem(projectId, expectedRevision, itemId, (item, revision) => ({
      ...item,
      ...patch,
      id: item.id,
      projectId: item.projectId,
      advisory: false,
      kind: 'revision_item',
      lifecycle: patch.lifecycle ?? item.lifecycle,
      documentRevision: revision,
    }));
  }

  async recordRecheck(
    projectId: string,
    expectedRevision: number,
    itemId: string,
    status: FeedbackRecheckStatus,
    evidence?: string,
    metadata?: Pick<FeedbackNoteRecheck, 'method' | 'sourceStatus'>,
  ): Promise<FeedbackNoteMutationResult> {
    return this.updateRevisionItem(projectId, expectedRevision, itemId, (item, revision) => {
      const recheck: FeedbackNoteRecheck = {
        id: noteId('recheck'),
        status,
        ...(evidence ? { evidence } : {}),
        ...(metadata?.method ? { method: metadata.method } : {}),
        ...(metadata?.sourceStatus ? { sourceStatus: metadata.sourceStatus } : {}),
        createdAt: this.now().toISOString(),
        sourceBodyFingerprint: item.sourceBodyFingerprint,
      };
      return {
        ...item,
        lifecycle:
          status === 'not_run' || status === 'unavailable' ? item.lifecycle : 'recheck_pending',
        rechecks: [...(item.rechecks ?? []), recheck],
        documentRevision: revision,
      };
    });
  }

  async recheck(
    projectId: string,
    expectedRevision: number,
    itemId: string,
    status: FeedbackRecheckStatus,
    evidence?: string,
    metadata?: Pick<FeedbackNoteRecheck, 'method' | 'sourceStatus'>,
  ) {
    return this.recordRecheck(projectId, expectedRevision, itemId, status, evidence, metadata);
  }

  async createRecurrence(
    projectId: string,
    expectedRevision: number,
    relatedItemId: string,
    input: CreateRevisionItemInput,
  ): Promise<FeedbackNoteMutationResult> {
    return this.mutate(projectId, expectedRevision, (document) => {
      const related = document.notes.find((note) => note.id === relatedItemId);
      if (!related || related.advisory !== false)
        throw new FeedbackNotesRepositoryError(
          'UNKNOWN_ITEM',
          'The related revision item does not exist.',
        );
      if (related.lifecycle !== 'resolved')
        throw new FeedbackNotesRepositoryError(
          'INVALID',
          'A recurrence may only be created from a resolved revision item.',
        );
      const revision = document.revision + 1;
      const created: RevisionItem = {
        ...input,
        id: noteId('recurrence'),
        createdAt: this.now().toISOString(),
        advisory: false,
        kind: 'revision_item',
        lifecycle: 'active',
        relatedRevisionItemId: relatedItemId,
        relatedItemId,
        recurrenceOf: relatedItemId,
        documentRevision: revision,
        rechecks: [],
        dispositionHistory: [],
      };
      const notes = document.notes.map((entry) =>
        entry.id === relatedItemId ? { ...entry, relatedRecurrenceId: created.id } : entry,
      );
      return { notes: [...notes, created], note: created };
    });
  }

  private async updateRevisionItem(
    projectId: string,
    expectedRevision: number,
    itemId: string,
    update: (item: RevisionItem, revision: number) => RevisionItem,
  ): Promise<FeedbackNoteMutationResult> {
    return this.mutate(projectId, expectedRevision, (document) => {
      const found = document.notes.find((note) => note.id === itemId);
      if (!found || found.advisory !== false)
        throw new FeedbackNotesRepositoryError('UNKNOWN_ITEM', 'The revision item does not exist.');
      const revision = document.revision + 1;
      const note = update(found, revision);
      return { notes: document.notes.map((entry) => (entry.id === itemId ? note : entry)), note };
    });
  }

  private nextDocument(
    document: FeedbackNotesDocument,
    notes: readonly FeedbackNoteRecord[],
  ): FeedbackNotesDocument {
    return { ...document, revision: document.revision + 1, notes: trimHistory(notes) };
  }

  private async readEnvelope(projectId: string): Promise<LoadedDocument> {
    try {
      return validateDocument(
        JSON.parse(await fs.readFile(this.filePath, 'utf8')) as unknown,
        projectId,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT')
        return { document: emptyDocument(projectId), legacy: true };
      if (error instanceof FeedbackNotesRepositoryError) throw error;
      throw new FeedbackNotesRepositoryError(
        'UNAVAILABLE',
        'Saved feedback notes are not readable.',
      );
    }
  }

  private async writeEnvelope(
    envelope:
      | FeedbackNotesDocument
      | {
          schemaVersion: typeof FEEDBACK_NOTE_SCHEMA_VERSION;
          projectId: string;
          notes: readonly FeedbackNoteRecord[];
        },
  ): Promise<void> {
    const directory = path.dirname(this.filePath);
    const tempPath = path.join(directory, `.${FEEDBACK_NOTES_FILENAME}.${randomUUID()}.tmp`);
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(tempPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
      await fs.rename(tempPath, this.filePath);
    } catch {
      await fs.rm(tempPath, { force: true }).catch(() => undefined);
      throw new FeedbackNotesRepositoryError(
        'WRITE_FAILED',
        'The feedback note could not be saved.',
      );
    }
  }
}

export const FEEDBACK_NOTES_PERSISTENCE_RECEIPT = {
  schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION,
  filename: FEEDBACK_NOTES_FILENAME,
  historyLimit: FEEDBACK_NOTE_HISTORY_LIMIT,
} as const;
