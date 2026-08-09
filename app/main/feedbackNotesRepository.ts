import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  FEEDBACK_NOTE_MAX_BODY_LENGTH,
  FEEDBACK_NOTE_SCHEMA_VERSION,
  type FeedbackNote,
} from '../shared/ipc/feedbackNotes.js';

export const FEEDBACK_NOTES_FILENAME = 'feedback-notes.json';

interface FeedbackNotesEnvelope {
  readonly schemaVersion: typeof FEEDBACK_NOTE_SCHEMA_VERSION;
  readonly projectId: string;
  readonly notes: readonly FeedbackNote[];
}

export class FeedbackNotesRepositoryError extends Error {
  constructor(
    readonly code: 'UNAVAILABLE' | 'WRITE_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'FeedbackNotesRepositoryError';
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFeedbackNote(value: unknown, projectId: string): value is FeedbackNote {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FeedbackNote>;
  return typeof candidate.id === 'string' &&
    candidate.projectId === projectId &&
    isNonEmptyString(candidate.unitId) &&
    isNonEmptyString(candidate.sourceCritiqueRequestId) &&
    isNonEmptyString(candidate.selectionFingerprint) &&
    isNonEmptyString(candidate.createdAt) &&
    candidate.advisory === true &&
    typeof candidate.body === 'string' &&
    candidate.body.length > 0 &&
    candidate.body.length <= FEEDBACK_NOTE_MAX_BODY_LENGTH;
}

function validateEnvelope(value: unknown, projectId: string): FeedbackNotesEnvelope {
  if (!value || typeof value !== 'object') {
    throw new FeedbackNotesRepositoryError('UNAVAILABLE', 'Saved feedback notes are not readable.');
  }
  const candidate = value as Partial<FeedbackNotesEnvelope>;
  if (
    candidate.schemaVersion !== FEEDBACK_NOTE_SCHEMA_VERSION ||
    candidate.projectId !== projectId ||
    !Array.isArray(candidate.notes) ||
    !candidate.notes.every((note) => isFeedbackNote(note, projectId))
  ) {
    throw new FeedbackNotesRepositoryError('UNAVAILABLE', 'Saved feedback notes have an unsupported format.');
  }
  return candidate as FeedbackNotesEnvelope;
}

export class FeedbackNotesRepository {
  readonly filePath: string;

  constructor(
    readonly projectPath: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.filePath = path.join(path.resolve(projectPath), FEEDBACK_NOTES_FILENAME);
  }

  async create(note: Omit<FeedbackNote, 'id' | 'createdAt' | 'advisory'>): Promise<FeedbackNote> {
    const current = await this.readEnvelope(note.projectId);
    const created: FeedbackNote = {
      ...note,
      id: `feedback_${randomUUID()}`,
      createdAt: this.now().toISOString(),
      advisory: true,
    };
    await this.writeEnvelope({
      schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION,
      projectId: note.projectId,
      notes: [...current.notes, created],
    });
    return created;
  }

  async list(projectId: string): Promise<readonly FeedbackNote[]> {
    return (await this.readEnvelope(projectId)).notes;
  }

  private async readEnvelope(projectId: string): Promise<FeedbackNotesEnvelope> {
    try {
      return validateEnvelope(JSON.parse(await fs.readFile(this.filePath, 'utf8')) as unknown, projectId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return { schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION, projectId, notes: [] };
      }
      if (error instanceof FeedbackNotesRepositoryError) throw error;
      throw new FeedbackNotesRepositoryError('UNAVAILABLE', 'Saved feedback notes are not readable.');
    }
  }

  private async writeEnvelope(envelope: FeedbackNotesEnvelope): Promise<void> {
    const directory = path.dirname(this.filePath);
    const tempPath = path.join(directory, `.${FEEDBACK_NOTES_FILENAME}.${randomUUID()}.tmp`);
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(tempPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
      await fs.rename(tempPath, this.filePath);
    } catch {
      await fs.rm(tempPath, { force: true }).catch(() => undefined);
      throw new FeedbackNotesRepositoryError('WRITE_FAILED', 'The feedback note could not be saved.');
    }
  }
}
