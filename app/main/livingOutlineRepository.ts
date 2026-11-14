import { isWritingGroups, sameWritingAnchor, validGapWritingOperation } from '../shared/writingRanges.js';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  LIVING_OUTLINE_ANCHOR_SCHEMA_VERSION,
  LIVING_OUTLINE_MAX_LABEL_LENGTH,
  LIVING_OUTLINE_MAX_BODY_LENGTH,
  LIVING_OUTLINE_SCHEMA_VERSION,
  type LivingOutlineDocumentV1,
  type ReplaceWritingStateRequest,
  type LivingOutlineItemKind,
  type LivingOutlineItemState,
  type LivingOutlineItemV1,
  type LivingOutlineSnapshotV1,
  type GapWritingOperationV1,
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
    (candidate.sourcePromotionId === undefined || isNonEmptyString(candidate.sourcePromotionId) && candidate.sourcePromotionId.length <= 240) &&
    typeof candidate.label === 'string' &&
    candidate.label.trim().length > 0 &&
    candidate.label.length <= LIVING_OUTLINE_MAX_LABEL_LENGTH &&
    (candidate.body === undefined || (typeof candidate.body === 'string' && candidate.body.length <= LIVING_OUTLINE_MAX_BODY_LENGTH)) &&
    isKind(candidate.kind) &&
    (candidate.noteScope === undefined || ['whole-story', 'unattached', 'passage'].includes(candidate.noteScope)) &&
    (candidate.sourceWasSpan === undefined || typeof candidate.sourceWasSpan === 'boolean') &&
    (!(candidate.noteScope === 'whole-story' || candidate.noteScope === 'unattached') || (candidate.manuscriptUnitId === null && !candidate.sourceAnchor && !candidate.sourceAnchors)) &&
    isState(candidate.state) &&
    (candidate.manuscriptUnitId === null || isNonEmptyString(candidate.manuscriptUnitId)) &&
    isSourceAnchor(candidate.sourceAnchor) &&
    (candidate.sourceAnchors === undefined || (Array.isArray(candidate.sourceAnchors) && candidate.sourceAnchors.length > 0 && candidate.sourceAnchors.every((anchor) => anchor && isSourceAnchor(anchor)) && candidate.sourceAnchors[0]?.unitId === candidate.manuscriptUnitId && sameWritingAnchor(candidate.sourceAnchor, candidate.sourceAnchors[0]))) &&
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
    (candidate.pendingGap != null && !validGapWritingOperation(candidate.pendingGap, isSourceAnchor)) ||
    (candidate.writingGroups !== undefined && !isWritingGroups(candidate.writingGroups, isSourceAnchor)) ||
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

  async replaceWritingState(projectId: string, expectedRevision: number, input: Pick<ReplaceWritingStateRequest, 'groups' | 'noteAnchors'>): Promise<LivingOutlineSnapshotV1> {
    if (!isWritingGroups(input.groups, isSourceAnchor) || !Array.isArray(input.noteAnchors) ||
        new Set(input.noteAnchors.map((item) => item?.itemId)).size !== input.noteAnchors.length ||
        input.noteAnchors.some((item) => !item || !item.anchor || !isSourceAnchor(item.anchor) || (item.anchors !== undefined && (!Array.isArray(item.anchors) || !item.anchors.length || item.anchors.some((anchor: ReplaceWritingStateRequest['noteAnchors'][number]['anchor']) => !anchor || !isSourceAnchor(anchor)) || !sameWritingAnchor(item.anchors[0], item.anchor))) || (item.reconnect !== undefined && typeof item.reconnect !== 'boolean'))) {
      throw new LivingOutlineRepositoryError('UNAVAILABLE', 'Writing ranges are invalid or overlap. No writing was changed.');
    }
    return this.mutate(projectId, expectedRevision, (document) => {
      for (const update of input.noteAnchors) {
        const note = document.items.find((item) => item.id === update.itemId);
        if (!note || (!update.reconnect && note.manuscriptUnitId !== update.anchor.unitId) || (note.sourceAnchors && note.sourceAnchors.length > 1 && !update.anchors)) throw new LivingOutlineRepositoryError('UNKNOWN_ITEM', 'A linked Note changed. Reload before saving ranges.');
      }
      return document.items.map((item) => {
        const update = input.noteAnchors.find((candidate) => candidate.itemId === item.id);
        return update ? { ...item, ...(update.reconnect ? { noteScope: 'passage' as const, sourceWasSpan: (update.anchors ?? [update.anchor]).some(anchor => anchor.anchorKind === 'span') } : {}), manuscriptUnitId: update.reconnect ? update.anchor.unitId : item.manuscriptUnitId, sourceAnchor: update.anchor, sourceAnchors: update.anchors ?? (item.sourceAnchors ? [update.anchor] : undefined), updatedAt: this.now().toISOString() } : item;
      });
    }, { writingGroups: input.groups });
  }

  async prepareGap(projectId: string, revision: number, pending: GapWritingOperationV1): Promise<LivingOutlineSnapshotV1> {
    if (!validGapWritingOperation(pending, isSourceAnchor)) throw new LivingOutlineRepositoryError('UNAVAILABLE', 'The gap operation is invalid.');
    const current = await this.read(projectId);
    if (current.document.pendingGap?.id === pending.id) {
      if (JSON.stringify(current.document.pendingGap) !== JSON.stringify(pending)) throw new LivingOutlineRepositoryError('STALE', 'This gap operation identity belongs to another proposal.');
      return current;
    }
    return this.mutate(projectId, revision, document => {
      const gap = document.items.find(item => item.id === pending.gapId);
      if (!gap || (pending.direction === 'fill' ? gap.kind !== 'gap' : gap.kind !== 'fragment'))
        throw new LivingOutlineRepositoryError('UNKNOWN_ITEM', 'The gap changed before this operation.');
      if (pending.noteAnchors.some(note => !document.items.some(item => item.id === note.itemId)))
        throw new LivingOutlineRepositoryError('UNKNOWN_ITEM', 'A linked Note changed.');
      return document.items;
    }, { pendingGap: pending });
  }

  async finishGap(projectId: string, revision: number, operationId: string): Promise<LivingOutlineSnapshotV1> {
    const current = await this.read(projectId);
    const pending = current.document.pendingGap;
    if (!pending && current.document.items.some(item => item.completedGapOperationId === operationId)) return current;
    if (!pending || pending.id !== operationId) throw new LivingOutlineRepositoryError('STALE', 'The pending gap operation changed.');
    return this.mutate(projectId, revision, document => document.items.map(item => {
      const update = pending.noteAnchors.find(note => note.itemId === item.id);
      let next = update ? { ...item, manuscriptUnitId: update.anchor.unitId, sourceAnchor: update.anchor, sourceAnchors: update.anchors ?? [update.anchor] } : item;
      if (item.id === pending.gapId) next = { ...next, kind: pending.target.kind, state: pending.target.state,
        noteScope: 'passage', sourceWasSpan: pending.target.anchor.anchorKind === 'span', manuscriptUnitId: pending.unitId, sourceAnchor: pending.target.anchor, sourceAnchors: [pending.target.anchor], completedGapOperationId: operationId };
      return next === item ? item : { ...next, updatedAt: this.now().toISOString() };
    }), { writingGroups: pending.groups, pendingGap: null }, true);
  }

  async restore(projectId: string, revision: number, item: LivingOutlineItemV1, beforeId: string | null): Promise<LivingOutlineSnapshotV1> {
    if (!isItem(item) || item.kind !== 'fragment') throw new LivingOutlineRepositoryError('UNAVAILABLE', 'The deleted Note record is invalid.');
    return this.mutate(projectId, revision, document => {
      if (document.items.some(current => current.id === item.id)) throw new LivingOutlineRepositoryError('STALE', 'This Note identity already exists.');
      const index = beforeId === null ? -1 : document.items.findIndex(current => current.id === beforeId);
      const items = [...document.items]; items.splice(index < 0 ? items.length : index, 0, item); return items;
    });
  }

  async create(
    projectId: string,
    expectedRevision: number,
    input: Pick<LivingOutlineItemV1, 'label' | 'body' | 'kind' | 'state' | 'manuscriptUnitId' | 'sourceAnchor' | 'sourceAnchors' | 'noteScope' | 'sourceWasSpan' | 'sourcePromotionId'>,
  ): Promise<LivingOutlineSnapshotV1> {
    if ((input.noteScope !== undefined && !['whole-story', 'unattached', 'passage'].includes(input.noteScope)) ||
        (input.sourceWasSpan !== undefined && typeof input.sourceWasSpan !== 'boolean') ||
        ((input.noteScope === 'whole-story' || input.noteScope === 'unattached') && (input.manuscriptUnitId !== null || input.sourceAnchor != null || input.sourceAnchors !== undefined)))
      throw new LivingOutlineRepositoryError('UNAVAILABLE', 'The Note scope does not match its source.');
    if (input.sourceAnchors !== undefined && (!Array.isArray(input.sourceAnchors) || !input.sourceAnchors.length || input.sourceAnchors.some((anchor) => !anchor || !isSourceAnchor(anchor)) || !sameWritingAnchor(input.sourceAnchor, input.sourceAnchors[0]))) throw new LivingOutlineRepositoryError('UNAVAILABLE', 'The Note sources are incomplete. No Note was saved.');
    return this.mutate(projectId, expectedRevision, (document) => {
      const timestamp = this.now().toISOString();
      return [...document.items, {
        ...input,
        label: input.label.trim(),
        body: input.body?.trim() ?? '',
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
    input: Pick<LivingOutlineItemV1, 'label' | 'body' | 'kind' | 'state'>,
  ): Promise<LivingOutlineSnapshotV1> {
    return this.mutate(projectId, expectedRevision, (document) => this.replaceItem(document, itemId, (item) => ({
      ...item,
      ...input,
      label: input.label.trim(),
      body: input.body?.trim() ?? '',
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
      if (index < 0) throw new LivingOutlineRepositoryError('UNKNOWN_ITEM', 'The Note no longer exists.');
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
      ...(item.kind === 'fragment' ? { noteScope: manuscriptUnitId === null ? 'unattached' as const : 'passage' as const } : {}),
      sourceAnchor: manuscriptUnitId === item.sourceAnchor?.unitId ? item.sourceAnchor : null,
      sourceAnchors: manuscriptUnitId === item.sourceAnchor?.unitId ? item.sourceAnchors : undefined,
      updatedAt: this.now().toISOString(),
    })));
  }

  async delete(projectId: string, expectedRevision: number, itemId: string): Promise<LivingOutlineSnapshotV1> {
    return this.mutate(projectId, expectedRevision, (document) => {
      if (!document.items.some((item) => item.id === itemId)) {
        throw new LivingOutlineRepositoryError('UNKNOWN_ITEM', 'The Note no longer exists.');
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
    if (!found) throw new LivingOutlineRepositoryError('UNKNOWN_ITEM', 'The Note no longer exists.');
    return items;
  }

  private async mutate(
    projectId: string,
    expectedRevision: number,
    change: (document: LivingOutlineDocumentV1) => readonly LivingOutlineItemV1[],
    extra: Pick<LivingOutlineDocumentV1, 'writingGroups' | 'pendingGap'> = {},
    finishingGap = false,
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
      if (current.document.pendingGap && !finishingGap) throw new LivingOutlineRepositoryError('STALE', 'Finish the pending gap save before changing its linked metadata.');
      const next: LivingOutlineDocumentV1 = {
        ...current.document,
        ...extra,
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
      // A short Windows sharing lock must not discard an otherwise valid save.
      // Keep the mutation queue and atomic replacement; never delete the target.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await fs.rename(tempPath, this.filePath);
          return;
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (attempt === 2 || !['EPERM', 'EACCES', 'EBUSY'].includes(code ?? '')) throw error;
          await delay(25 * (attempt + 1));
        }
      }
    } catch {
      await fs.rm(tempPath, { force: true }).catch(() => undefined);
      throw new LivingOutlineRepositoryError('WRITE_FAILED', 'The story plan change could not be saved.');
    }
  }
}
