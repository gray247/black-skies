import fs from 'node:fs/promises';
import path from 'node:path';

import {
  createDefaultStoryIntelligenceDocument,
  trimStoryIntelligenceHistory,
  validateStoryIntelligenceDocument,
  StoryIntelligenceValidationError,
} from '../shared/storyIntelligencePolicy.js';
import {
  STORY_INTELLIGENCE_HISTORY_LIMIT,
  STORY_INTELLIGENCE_SCHEMA_VERSION,
  type StoryIntelligenceDocumentV1,
} from '../shared/ipc/storyIntelligence.js';

export const STORY_INTELLIGENCE_FILENAME = 'story-intelligence.json';
const projectWriteQueues = new Map<string, Promise<void>>();

function serializationKey(filePath: string): string {
  const normalized = path.normalize(filePath);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

async function serializeProjectWrite<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const key = serializationKey(filePath);
  const previous = projectWriteQueues.get(key) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  const tail = result.then(() => undefined, () => undefined);
  projectWriteQueues.set(key, tail);
  try {
    return await result;
  } finally {
    if (projectWriteQueues.get(key) === tail) projectWriteQueues.delete(key);
  }
}

export class StoryIntelligenceRepositoryError extends Error {
  constructor(
    readonly code: 'UNAVAILABLE' | 'WRITE_FAILED' | 'STALE',
    message: string,
  ) {
    super(message);
    this.name = 'StoryIntelligenceRepositoryError';
  }
}

export class StoryIntelligenceRepository {
  readonly filePath: string;

  constructor(
    readonly projectPath: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.filePath = path.join(path.resolve(projectPath), STORY_INTELLIGENCE_FILENAME);
  }

  async read(projectId: string): Promise<StoryIntelligenceDocumentV1> {
    try {
      const raw = JSON.parse(await fs.readFile(this.filePath, 'utf8')) as unknown;
      return validateStoryIntelligenceDocument(raw, projectId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return createDefaultStoryIntelligenceDocument(projectId, this.now());
      }
      if (error instanceof StoryIntelligenceValidationError) {
        throw new StoryIntelligenceRepositoryError('UNAVAILABLE', 'Story-intelligence data is not readable.');
      }
      if (error instanceof StoryIntelligenceRepositoryError) throw error;
      throw new StoryIntelligenceRepositoryError('UNAVAILABLE', 'Story-intelligence data is not readable.');
    }
  }

  async write(
    projectId: string,
    expectedRevision: number,
    document: StoryIntelligenceDocumentV1,
  ): Promise<StoryIntelligenceDocumentV1> {
    return serializeProjectWrite(this.filePath, async () => {
      const current = await this.read(projectId);
      if (current.revision !== expectedRevision) {
        throw new StoryIntelligenceRepositoryError('STALE', 'Story-intelligence data changed. Reload it before writing again.');
      }
      if (document.revision !== expectedRevision + 1) {
        throw new StoryIntelligenceRepositoryError('STALE', 'Story-intelligence revision is not the next revision.');
      }
      const validated = validateStoryIntelligenceDocument(document, projectId);
      const next: StoryIntelligenceDocumentV1 = {
        ...validated,
        history: trimStoryIntelligenceHistory(validated.history),
        updatedAt: this.now().toISOString(),
      };
      await this.writeAtomically(next);
      return next;
    });
  }

  private async writeAtomically(document: StoryIntelligenceDocumentV1): Promise<void> {
    const directory = path.dirname(this.filePath);
    const tempPath = path.join(directory, `.${STORY_INTELLIGENCE_FILENAME}.${Date.now()}.tmp`);
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(tempPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
      await fs.rename(tempPath, this.filePath);
    } catch {
      await fs.rm(tempPath, { force: true }).catch(() => undefined);
      throw new StoryIntelligenceRepositoryError('WRITE_FAILED', 'Story-intelligence data could not be saved.');
    }
  }
}

export const STORY_INTELLIGENCE_PERSISTENCE_RECEIPT = {
  schemaVersion: STORY_INTELLIGENCE_SCHEMA_VERSION,
  filename: STORY_INTELLIGENCE_FILENAME,
  historyLimit: STORY_INTELLIGENCE_HISTORY_LIMIT,
} as const;
