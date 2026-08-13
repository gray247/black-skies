import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  LIVING_OUTLINE_ANCHOR_SCHEMA_VERSION,
  LIVING_OUTLINE_MAX_LABEL_LENGTH,
  LIVING_OUTLINE_SCHEMA_VERSION,
  type LivingOutlineDocumentV1,
  type LivingOutlineItemKind,
  type LivingOutlineItemState,
  type LivingOutlineItemV1,
  type LivingOutlineSnapshotV1,
} from '../shared/ipc/livingOutline.js';

export const LIVING_OUTLINE_FILENAME = 'living-outline.json';
const mutationQueues = new Map<string, Promise<void>>();

export class LivingOutlineRepositoryError extends Error {
  constructor(
    readonly code: 'UNAVAILABLE' | 'WRITE_FAILED' | 'STALE' | 'UNKNOWN_ITEM',
    message: string,
  ) {
    super(message);
    this.name = 'LivingOutlineRepositoryError';
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isKind(value: unknown): value is LivingOutlineItemKind {
  return value === 'fragment' || value === 'gap' || value === 'container';
}

function isState(value: unknown): value is LivingOutlineItemState {
  return value === 'authored' || value === 'planned' || value === 'inferred' || value === 'proposed';
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
}

function isSourceAnchor(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  const candidate = value as NonNullable<LivingOutlineItemV1['sourceAnchor']>;
  return candidate.schemaVersion === LIVING_OUTLINE_ANCHOR_SCHEMA_VERSION &&
    isNonEmptyString(candidate.unitId) &&
    (candidate.anchorKind === 'position' || candidate.anchorKind === 'span') &&
    Number.isInteger(candidate.selectionStart) && candidate.selectionStart >= 0 &&
    Number.isInteger(candidate.selectionEnd) && candidate.selectionEnd >= candidate.selectionStart &&
    (candidate.anchorKind === 'position'
      ? candidate.selectionEnd === candidate.selectionStart
      : candidate.selectionEnd > candidate.selectionStart) &&
    isSha256(candidate.selectionFingerprint) &&
    typeof candidate.selectionSearchFingerprint === 'string' && /^[a-f0-9]{8}$/i.test(candidate.selectionSearchFingerprint) &&
    isSha256(candidate.sourceFingerprint) &&
    Number.isInteger(candidate.prefixLength) && candidate.prefixLength >= 0 && candidate.prefixLength <= 32 &&
    typeof candidate.prefixSearchFingerprint === 'string' && /^[a-f0-9]{8}$/i.test(candidate.prefixSearchFingerprint) &&
    isSha256(candidate.prefixFingerprint) &&
    Number.isInteger(candidate.suffixLength) && candidate.suffixLength >= 0 && candidate.suffixLength <= 32 &&
    typeof candidate.suffixSearchFingerprint === 'string' && /^[a-f0-9]{8}$/i.test(candidate.suffixSearchFingerprint) &&
    isSha256(candidate.suffixFingerprint);
}

function isItem(value: unknown): value is LivingOutlineItemV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LivingOutlineItemV1>;
  return isNonEmptyString(candidate.id) &&
    typeof candidate.label === 'string' &&
    candidate.label.trim().length > 0 &&
    candidate.label.length <= LIVING_OUTLINE_MAX_LABEL_LENGTH &&
    isKind(candidate.kind) &&
    isState(candidate.state) &&
    (candidate.manuscriptUnitId === null || isNonEmptyString(candidate.manuscriptUnitId)) &&
    isSourceAnchor(candidate.sourceAnchor) &&
    (!candidate.sourceAnchor || candidate.sourceAnchor.unitId === candidate.manuscriptUnitId) &&
    isNonEmptyString(candidate.createdAt) &&
    isNonEmptyString(candidate.updatedAt);
}

function emptyDocument(projectId: string): LivingOutlineDocumentV1 {
  return {
    schemaVersion: LIVING_OUTLINE_SCHEMA_VERSION,
    projectId,
    revision: 0,
    items: [],
  };
}

function validateDocument(value: unknown, projectId: string): LivingOutlineDocumentV1 {
  if (!value || typeof value !== 'object') {
    throw new LivingOutlineRepositoryError('UNAVAILABLE', 'The story plan file is not readable. Writing remains available.');
  }
  const candidate = value as Partial<LivingOutlineDocumentV1>;
  if (
    candidate.schemaVersion !== LIVING_OUTLINE_SCHEMA_VERSION ||
    candidate.projectId !== projectId ||
    !Number.isInteger(candidate.revision) ||
    (candidate.revision ?? -1) < 0 ||
    !Array.isArray(candidate.items) ||
    !candidate.items.every(isItem) ||
    new Set(candidate.items.map((item) => item.id)).size !== candidate.items.length
  ) {
    throw new LivingOutlineRepositoryError('UNAVAILABLE', 'The story plan file has an unsupported format. Writing remains available.');
  }
  return candidate as LivingOutlineDocumentV1;
}

export class LivingOutlineRepository {
  readonly filePath: string;

  constructor(
    readonly projectPath: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.filePath = path.join(path.resolve(projectPath), LIVING_OUTLINE_FILENAME);
  }

  async read(projectId: string): Promise<LivingOutlineSnapshotV1> {
    try {
      const document = validateDocument(
        JSON.parse(await fs.readFile(this.filePath, 'utf8')) as unknown,
        projectId,
      );
      return { availability: 'ready', document, message: null };
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return { availability: 'ready', document: emptyDocument(projectId), message: null };
      }
      const message = error instanceof LivingOutlineRepositoryError
        ? error.message
        : 'The story plan file is not readable. Writing remains available.';
      return { availability: 'degraded', document: emptyDocument(projectId), message };
    }
  }

  async create(
    projectId: string,
    expectedRevision: number,
    input: Pick<LivingOutlineItemV1, 'label' | 'kind' | 'state' | 'manuscriptUnitId' | 'sourceAnchor'>,
  ): Promise<LivingOutlineSnapshotV1> {
    return this.mutate(projectId, expectedRevision, (document) => {
      const timestamp = this.now().toISOString();
      return [...document.items, {
        ...input,
        label: input.label.trim(),
        id: `outline_${randomUUID()}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      }];
    });
  }

  async update(
    projectId: string,
    expectedRevision: number,
    itemId: string,
    input: Pick<LivingOutlineItemV1, 'label' | 'kind' | 'state'>,
  ): Promise<LivingOutlineSnapshotV1> {
    return this.mutate(projectId, expectedRevision, (document) => this.replaceItem(document, itemId, (item) => ({
      ...item,
      ...input,
      label: input.label.trim(),
      updatedAt: this.now().toISOString(),
    })));
  }

  async move(
    projectId: string,
    expectedRevision: number,
    itemId: string,
    direction: -1 | 1,
  ): Promise<LivingOutlineSnapshotV1> {
    return this.mutate(projectId, expectedRevision, (document) => {
      const index = document.items.findIndex((item) => item.id === itemId);
      if (index < 0) throw new LivingOutlineRepositoryError('UNKNOWN_ITEM', 'The story point no longer exists.');
      const destination = index + direction;
      if (destination < 0 || destination >= document.items.length) return [...document.items];
      const items = [...document.items];
      [items[index], items[destination]] = [items[destination], items[index]];
      return items;
    });
  }

  async link(
    projectId: string,
    expectedRevision: number,
    itemId: string,
    manuscriptUnitId: string | null,
  ): Promise<LivingOutlineSnapshotV1> {
    return this.mutate(projectId, expectedRevision, (document) => this.replaceItem(document, itemId, (item) => ({
      ...item,
      manuscriptUnitId,
      sourceAnchor: manuscriptUnitId === item.sourceAnchor?.unitId ? item.sourceAnchor : null,
      updatedAt: this.now().toISOString(),
    })));
  }

  async delete(projectId: string, expectedRevision: number, itemId: string): Promise<LivingOutlineSnapshotV1> {
    return this.mutate(projectId, expectedRevision, (document) => {
      if (!document.items.some((item) => item.id === itemId)) {
        throw new LivingOutlineRepositoryError('UNKNOWN_ITEM', 'The story point no longer exists.');
      }
      return document.items.filter((item) => item.id !== itemId);
    });
  }

  private replaceItem(
    document: LivingOutlineDocumentV1,
    itemId: string,
    update: (item: LivingOutlineItemV1) => LivingOutlineItemV1,
  ): readonly LivingOutlineItemV1[] {
    let found = false;
    const items = document.items.map((item) => {
      if (item.id !== itemId) return item;
      found = true;
      return update(item);
    });
    if (!found) throw new LivingOutlineRepositoryError('UNKNOWN_ITEM', 'The story point no longer exists.');
    return items;
  }

  private async mutate(
    projectId: string,
    expectedRevision: number,
    change: (document: LivingOutlineDocumentV1) => readonly LivingOutlineItemV1[],
  ): Promise<LivingOutlineSnapshotV1> {
    const prior = mutationQueues.get(this.filePath) ?? Promise.resolve();
    let release!: () => void;
    const hold = new Promise<void>((resolve) => { release = resolve; });
    const tail = prior.then(() => hold);
    mutationQueues.set(this.filePath, tail);
    await prior;
    try {
      const current = await this.read(projectId);
      if (current.availability === 'degraded') {
        throw new LivingOutlineRepositoryError('UNAVAILABLE', current.message ?? 'The story plan is unavailable.');
      }
      if (current.document.revision !== expectedRevision) {
        throw new LivingOutlineRepositoryError('STALE', 'The story plan changed. Reload it before trying again.');
      }
      const next: LivingOutlineDocumentV1 = {
        ...current.document,
        revision: current.document.revision + 1,
        items: change(current.document),
      };
      await this.write(next);
      return { availability: 'ready', document: next, message: null };
    } finally {
      release();
      if (mutationQueues.get(this.filePath) === tail) mutationQueues.delete(this.filePath);
    }
  }

  private async write(document: LivingOutlineDocumentV1): Promise<void> {
    const directory = path.dirname(this.filePath);
    const tempPath = path.join(directory, `.${LIVING_OUTLINE_FILENAME}.${randomUUID()}.tmp`);
    try {
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(tempPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
      await fs.rename(tempPath, this.filePath);
    } catch {
      await fs.rm(tempPath, { force: true }).catch(() => undefined);
      throw new LivingOutlineRepositoryError('WRITE_FAILED', 'The story plan change could not be saved.');
    }
  }
}
