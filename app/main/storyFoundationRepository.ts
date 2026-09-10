import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  STORY_FOUNDATION_MAX_ANSWER_LENGTH,
  STORY_FOUNDATION_QUESTIONS,
  STORY_FOUNDATION_QUESTION_SET_VERSION,
  STORY_FOUNDATION_SCHEMA_VERSION,
  type StoryFoundationAnswerVersionV1,
  type StoryFoundationDocumentV1,
  type StoryFoundationEntryV1,
  type StoryFoundationHistoryEventV1,
  type StoryFoundationHistoryAction,
  type StoryFoundationPosture,
  type StoryFoundationQuestionId,
  type StoryFoundationSnapshotV1,
} from '../shared/ipc/storyFoundation.js';

export const STORY_FOUNDATION_FILENAME = 'story-foundation.json';
const mutationQueues = new Map<string, Promise<void>>();
const questionIds = new Set<string>(STORY_FOUNDATION_QUESTIONS.map((question) => question.id));

export class StoryFoundationRepositoryError extends Error {
  constructor(
    readonly code: 'UNAVAILABLE' | 'WRITE_FAILED' | 'STALE' | 'UNKNOWN_QUESTION' | 'ARCHIVED' | 'INVALID',
    message: string,
  ) {
    super(message);
    this.name = 'StoryFoundationRepositoryError';
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasExactKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isTimestamp(value: unknown): value is string {
  return (
    isNonEmptyString(value) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function isQuestionId(value: unknown): value is StoryFoundationQuestionId {
  return typeof value === 'string' && questionIds.has(value);
}

function isPosture(value: unknown): value is StoryFoundationPosture {
  return value === 'blank' || value === 'unknown' || value === 'undecided' || value === 'answered';
}

function isHistoryAction(value: unknown): value is StoryFoundationHistoryAction {
  return value === 'created' || value === 'revised' || value === 'superseded' ||
    value === 'archived' || value === 'restored';
}

function isVersion(value: unknown): value is StoryFoundationAnswerVersionV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoryFoundationAnswerVersionV1>;
  return hasExactKeys(value, ['id', 'posture', 'text', 'provenance', 'createdAt', 'supersededAt']) &&
    isNonEmptyString(candidate.id) &&
    isPosture(candidate.posture) &&
    typeof candidate.text === 'string' && candidate.text.length <= STORY_FOUNDATION_MAX_ANSWER_LENGTH &&
    (candidate.posture !== 'blank' || candidate.text.length === 0) &&
    (candidate.posture !== 'answered' || candidate.text.trim().length > 0) &&
    candidate.provenance === 'author' &&
    isTimestamp(candidate.createdAt) &&
    (candidate.supersededAt === null || isTimestamp(candidate.supersededAt));
}

function isHistoryEvent(value: unknown): value is StoryFoundationHistoryEventV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoryFoundationHistoryEventV1>;
  return hasExactKeys(value, ['id', 'action', 'versionId', 'occurredAt']) &&
    isNonEmptyString(candidate.id) &&
    isHistoryAction(candidate.action) &&
    (candidate.versionId === null || isNonEmptyString(candidate.versionId)) &&
    isTimestamp(candidate.occurredAt);
}

function isEntry(value: unknown): value is StoryFoundationEntryV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoryFoundationEntryV1>;
  if (
    !hasExactKeys(value, ['questionId', 'lifecycle', 'currentVersionId', 'versions', 'history']) ||
    !isQuestionId(candidate.questionId) ||
    (candidate.lifecycle !== 'active' && candidate.lifecycle !== 'archived') ||
    !isNonEmptyString(candidate.currentVersionId) ||
    !Array.isArray(candidate.versions) || candidate.versions.length === 0 ||
    !candidate.versions.every(isVersion) ||
    !Array.isArray(candidate.history) || !candidate.history.every(isHistoryEvent)
  ) return false;
  const versionIds = candidate.versions.map((version) => version.id);
  const historyIds = candidate.history.map((event) => event.id);
  if (new Set(versionIds).size !== versionIds.length || new Set(historyIds).size !== historyIds.length) return false;
  const current = candidate.versions.find((version) => version.id === candidate.currentVersionId);
  if (!current || current.supersededAt !== null) return false;
  if (candidate.versions.some((version) => version.id !== current.id && version.supersededAt === null)) return false;
  const knownVersions = new Set(versionIds);
  if (!candidate.history.every((event) => event.versionId === null || knownVersions.has(event.versionId))) return false;
  if (candidate.currentVersionId !== candidate.versions[candidate.versions.length - 1]?.id) return false;
  if (candidate.history[0]?.action !== 'created' || candidate.history[0].versionId !== candidate.versions[0]?.id) return false;

  let versionIndex = 0;
  let lifecycle: StoryFoundationEntryV1['lifecycle'] = 'active';
  for (let index = 1; index < candidate.history.length; index += 1) {
    const event = candidate.history[index]!;
    const activeVersion = candidate.versions[versionIndex]!;
    if (event.action === 'created' || event.action === 'revised') return false;
    if (event.action === 'superseded') {
      const revised = candidate.history[index + 1];
      const nextVersion = candidate.versions[versionIndex + 1];
      if (
        lifecycle !== 'active' ||
        event.versionId !== activeVersion.id ||
        activeVersion.supersededAt !== event.occurredAt ||
        !revised || revised.action !== 'revised' ||
        !nextVersion || revised.versionId !== nextVersion.id ||
        revised.occurredAt !== nextVersion.createdAt
      ) return false;
      versionIndex += 1;
      index += 1;
      continue;
    }
    if (event.versionId !== activeVersion.id) return false;
    if (event.action === 'archived') {
      if (lifecycle !== 'active') return false;
      lifecycle = 'archived';
    } else if (event.action === 'restored') {
      if (lifecycle !== 'archived') return false;
      lifecycle = 'active';
    }
  }
  return versionIndex === candidate.versions.length - 1 && lifecycle === candidate.lifecycle;
}

function emptyDocument(projectId: string): StoryFoundationDocumentV1 {
  return {
    schemaVersion: STORY_FOUNDATION_SCHEMA_VERSION,
    questionSetVersion: STORY_FOUNDATION_QUESTION_SET_VERSION,
    projectId,
    revision: 0,
    entries: [],
  };
}

function validateDocument(value: unknown, projectId: string): StoryFoundationDocumentV1 {
  if (!value || typeof value !== 'object') {
    throw new StoryFoundationRepositoryError('UNAVAILABLE', 'Story Foundation is not readable. Writing remains available.');
  }
  const candidate = value as Partial<StoryFoundationDocumentV1>;
  if (
    !hasExactKeys(value, ['schemaVersion', 'questionSetVersion', 'projectId', 'revision', 'entries']) ||
    candidate.schemaVersion !== STORY_FOUNDATION_SCHEMA_VERSION ||
    candidate.questionSetVersion !== STORY_FOUNDATION_QUESTION_SET_VERSION ||
    candidate.projectId !== projectId ||
    !Number.isInteger(candidate.revision) || (candidate.revision ?? -1) < 0 ||
    !Array.isArray(candidate.entries) || !candidate.entries.every(isEntry) ||
    new Set(candidate.entries.map((entry) => entry.questionId)).size !== candidate.entries.length
  ) {
    throw new StoryFoundationRepositoryError('UNAVAILABLE', 'Story Foundation has an unsupported format. Writing remains available.');
  }
  return candidate as StoryFoundationDocumentV1;
}

function snapshot(document: StoryFoundationDocumentV1): StoryFoundationSnapshotV1 {
  return { availability: 'ready', document, questions: STORY_FOUNDATION_QUESTIONS, message: null };
}

export class StoryFoundationRepository {
  readonly filePath: string;

  constructor(
    readonly projectPath: string,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => randomUUID(),
  ) {
    this.filePath = path.join(path.resolve(projectPath), STORY_FOUNDATION_FILENAME);
  }

  async read(projectId: string): Promise<StoryFoundationSnapshotV1> {
    try {
      return snapshot(validateDocument(JSON.parse(await fs.readFile(this.filePath, 'utf8')) as unknown, projectId));
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return snapshot(emptyDocument(projectId));
      const message = error instanceof StoryFoundationRepositoryError
        ? error.message
        : 'Story Foundation is not readable. Writing remains available.';
      return {
        availability: 'degraded',
        document: emptyDocument(projectId),
        questions: STORY_FOUNDATION_QUESTIONS,
        message,
      };
    }
  }

  async setAnswer(
    projectId: string,
    expectedRevision: number,
    input: { readonly questionId: StoryFoundationQuestionId; readonly posture: StoryFoundationPosture; readonly text: string },
  ): Promise<StoryFoundationSnapshotV1> {
    if (!isQuestionId(input.questionId)) {
      throw new StoryFoundationRepositoryError('UNKNOWN_QUESTION', 'That Story Foundation question does not exist.');
    }
    if (
      !isPosture(input.posture) ||
      typeof input.text !== 'string' ||
      input.text.length > STORY_FOUNDATION_MAX_ANSWER_LENGTH ||
      (input.posture === 'blank' && input.text.trim().length > 0) ||
      (input.posture === 'answered' && input.text.trim().length === 0)
    ) {
      throw new StoryFoundationRepositoryError('INVALID', 'The Story Foundation answer is invalid or incomplete.');
    }
    return this.mutate(projectId, expectedRevision, (document) => {
      const existing = document.entries.find((entry) => entry.questionId === input.questionId);
      if (existing?.lifecycle === 'archived') {
        throw new StoryFoundationRepositoryError('ARCHIVED', 'Restore this Story Foundation answer before revising it.');
      }
      const occurredAt = this.now().toISOString();
      const versionId = `foundation_version_${this.createId()}`;
      const event = (action: StoryFoundationHistoryAction, targetVersionId: string): StoryFoundationHistoryEventV1 => ({
        id: `foundation_event_${this.createId()}`,
        action,
        versionId: targetVersionId,
        occurredAt,
      });
      const version: StoryFoundationAnswerVersionV1 = {
        id: versionId,
        posture: input.posture,
        text: input.posture === 'blank' ? '' : input.text.trim(),
        provenance: 'author',
        createdAt: occurredAt,
        supersededAt: null,
      };
      if (!existing) {
        return [...document.entries, {
          questionId: input.questionId,
          lifecycle: 'active',
          currentVersionId: versionId,
          versions: [version],
          history: [event('created', versionId)],
        }];
      }
      const versions = existing.versions.map((prior) => prior.id === existing.currentVersionId
        ? { ...prior, supersededAt: occurredAt }
        : prior);
      return document.entries.map((entry) => entry.questionId === input.questionId ? {
        ...entry,
        currentVersionId: versionId,
        versions: [...versions, version],
        history: [
          ...entry.history,
          event('superseded', entry.currentVersionId),
          event('revised', versionId),
        ],
      } : entry);
    });
  }

  async archiveAnswer(
    projectId: string,
    expectedRevision: number,
    questionId: StoryFoundationQuestionId,
  ): Promise<StoryFoundationSnapshotV1> {
    return this.changeLifecycle(projectId, expectedRevision, questionId, 'archived', 'archived');
  }

  async restoreAnswer(
    projectId: string,
    expectedRevision: number,
    questionId: StoryFoundationQuestionId,
  ): Promise<StoryFoundationSnapshotV1> {
    return this.changeLifecycle(projectId, expectedRevision, questionId, 'active', 'restored');
  }

  private async changeLifecycle(
    projectId: string,
    expectedRevision: number,
    questionId: StoryFoundationQuestionId,
    lifecycle: StoryFoundationEntryV1['lifecycle'],
    action: 'archived' | 'restored',
  ): Promise<StoryFoundationSnapshotV1> {
    if (!isQuestionId(questionId)) {
      throw new StoryFoundationRepositoryError('UNKNOWN_QUESTION', 'That Story Foundation question does not exist.');
    }
    return this.mutate(projectId, expectedRevision, (document) => {
      const entry = document.entries.find((candidate) => candidate.questionId === questionId);
      if (!entry) throw new StoryFoundationRepositoryError('UNKNOWN_QUESTION', 'That Story Foundation answer does not exist.');
      if (entry.lifecycle === lifecycle) return document.entries;
      const occurredAt = this.now().toISOString();
      return document.entries.map((candidate) => candidate.questionId === questionId ? {
        ...candidate,
        lifecycle,
        history: [...candidate.history, {
          id: `foundation_event_${this.createId()}`,
          action,
          versionId: candidate.currentVersionId,
          occurredAt,
        }],
      } : candidate);
    });
  }

  private async mutate(
    projectId: string,
    expectedRevision: number,
    change: (document: StoryFoundationDocumentV1) => readonly StoryFoundationEntryV1[],
  ): Promise<StoryFoundationSnapshotV1> {
    const prior = mutationQueues.get(this.filePath) ?? Promise.resolve();
    let release!: () => void;
    const hold = new Promise<void>((resolve) => { release = resolve; });
    const tail = prior.then(() => hold);
    mutationQueues.set(this.filePath, tail);
    await prior;
    try {
      const current = await this.read(projectId);
      if (current.availability === 'degraded') {
        throw new StoryFoundationRepositoryError('UNAVAILABLE', current.message ?? 'Story Foundation is unavailable.');
      }
      if (current.document.revision !== expectedRevision) {
        throw new StoryFoundationRepositoryError('STALE', 'Story Foundation changed. Reload it before trying again.');
      }
      const next: StoryFoundationDocumentV1 = {
        ...current.document,
        revision: current.document.revision + 1,
        entries: change(current.document),
      };
      await this.write(next);
      return snapshot(next);
    } finally {
      release();
      if (mutationQueues.get(this.filePath) === tail) mutationQueues.delete(this.filePath);
    }
  }

  private async write(document: StoryFoundationDocumentV1): Promise<void> {
    const directory = path.dirname(this.filePath);
    const tempPath = path.join(directory, `.${STORY_FOUNDATION_FILENAME}.${this.createId()}.tmp`);
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(tempPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
      await fs.rename(tempPath, this.filePath);
    } catch {
      await fs.rm(tempPath, { force: true }).catch(() => undefined);
      throw new StoryFoundationRepositoryError('WRITE_FAILED', 'The Story Foundation change could not be saved.');
    }
  }
}
