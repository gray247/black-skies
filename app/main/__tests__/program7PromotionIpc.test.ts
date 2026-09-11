import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PROGRAM7_PROMOTION_CHANNELS,
  type Program7PromotionHandoffRequestV1,
  type Program7PromotionItemV1,
} from '../../shared/ipc/program7Promotion';
import type { ProjectSpineSessionSnapshot } from '../../shared/ipc/projectSpine';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: any, request?: unknown) => Promise<unknown> | unknown>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: any, request?: unknown) => Promise<unknown> | unknown) => handlers.set(channel, handler)),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});

vi.mock('electron', () => ({ ipcMain: electronMocks }));

import {
  registerProgram7PromotionIpc,
  resetProgram7PromotionIpcForTests,
} from '../program7PromotionIpc';

const projectPath = 'C:/projects/a';
const sourceText = 'Before selected passage after.';
const sourceFingerprint = hash(sourceText);
const selectedTextSha256 = hash('selected passage');

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function snapshot(): ProjectSpineSessionSnapshot {
  return {
    schemaVersion: 1,
    role: 'writing',
    generation: 2,
    revision: 4,
    project: {
      projectId: 'project-a',
      path: projectPath,
      title: 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1',
      units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 0 }],
      drafts: { 'unit-a': sourceText },
    },
    activeUnitId: 'unit-a',
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'clean', unitId: null, message: null },
    lastError: null,
    recovery: { status: 'none', candidates: [] },
  };
}

function source(overrides: Partial<Program7PromotionItemV1['source']> = {}): Program7PromotionItemV1['source'] {
  return {
    kind: 'ideation-seed',
    sourceId: 'seed-a',
    sourceRevision: 1,
    sourceFingerprint,
    selectedTextSha256,
    provenance: { origin: 'author', sourceReference: 'ideation:seed-a', authorRequested: true },
    protection: { excluded: false, class: 'ordinary' },
    ...overrides,
  };
}

function acceptance(id: string) {
  return { accepted: true as const, actor: 'author' as const, acceptanceId: id };
}

function baseItem(overrides: Partial<Program7PromotionItemV1> = {}): Program7PromotionItemV1 {
  return {
    itemId: 'item-a',
    destination: 'author-intent',
    source: source(),
    payload: { destination: 'author-intent', questionId: 'aboutness', posture: 'answered', text: 'A house teaching its occupants to forget.' },
    ownerAcceptance: acceptance('accept-a'),
    ...overrides,
  } as Program7PromotionItemV1;
}

function request(items: readonly Program7PromotionItemV1[], overrides: Partial<Program7PromotionHandoffRequestV1> = {}): Program7PromotionHandoffRequestV1 {
  return {
    operationId: 'promotion-op',
    projectId: 'project-a',
    projectPath,
    generation: 2,
    items,
    ...overrides,
  };
}

function narrativeItem(itemId = 'item-narrative'): Program7PromotionItemV1 {
  return baseItem({
    itemId,
    destination: 'narrative-insertion',
    source: source({ kind: 'revision-candidate', sourceId: 'candidate-a' }),
    payload: {
      destination: 'narrative-insertion',
      calculation: {
        candidate: {
          projectId: 'project-a',
          unitId: 'unit-a',
          sourceSnapshot: { unitId: 'unit-a', bodySha256: sourceFingerprint, text: sourceText },
          sourceAnchor: { unitId: 'unit-a', selectionStart: 7, selectionEnd: 23, selectionFingerprint: selectedTextSha256 },
          candidateText: 'Replacement.',
          editedCandidateText: null,
        },
        currentBody: sourceText,
        mode: 'accept-all',
      },
    },
    ownerAcceptance: acceptance('accept-narrative'),
  });
}

function invoke(senderId: number, value: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(PROGRAM7_PROMOTION_CHANNELS.handoff);
  if (!handler) throw new Error('Missing promotion handoff handler.');
  return Promise.resolve(handler({ sender: { id: senderId } }, value));
}

describe('Program 7 promotion handoff authority', () => {
  beforeEach(() => {
    resetProgram7PromotionIpcForTests();
    electronMocks.handlers.clear();
  });

  it('routes accepted intent and outline through injected destination owners, calculates prose, and defers character/lore', async () => {
    const acceptAuthorIntent = vi.fn().mockResolvedValue({ ok: true, receipt: { artifactId: 'foundation-version-a', message: 'Story Foundation accepted.' } });
    const acceptOutline = vi.fn().mockResolvedValue({ ok: true, receipt: { artifactId: 'outline-item-a', message: 'Living Outline accepted.' } });
    registerProgram7PromotionIpc({
      resolveWindowRole: (id) => id === 1 ? 'writing' : null,
      getWritingSnapshot: snapshot,
      acceptAuthorIntent,
      acceptOutline,
    });
    const items = [
      baseItem(),
      baseItem({
        itemId: 'item-outline', destination: 'outline',
        payload: { destination: 'outline', label: 'A planned turn', body: 'The house forgets first.', kind: 'fragment', state: 'planned', manuscriptUnitId: null, sourceAnchor: null },
        ownerAcceptance: acceptance('accept-outline'),
      }),
      narrativeItem(),
      baseItem({
        itemId: 'item-character', destination: 'character',
        payload: { destination: 'character', label: 'Mara', summary: 'Deferred character material.', selectedText: 'A bounded character note.' },
        ownerAcceptance: acceptance('accept-character'),
      }),
    ];
    const result = await invoke(1, request(items));
    expect(result).toMatchObject({ ok: true, data: { status: 'complete', outcomes: [
      { itemId: 'item-a', status: 'routed', artifactId: 'foundation-version-a' },
      { itemId: 'item-outline', status: 'routed', artifactId: 'outline-item-a' },
      { itemId: 'item-narrative', status: 'routed', narrativeCalculation: { status: 'ready', acceptedResultSha256: hash('Before Replacement. after.') } },
      { itemId: 'item-character', status: 'deferred', deferredPackage: { contentAvailable: true, status: 'deferred' } },
    ] } });
    expect(acceptAuthorIntent).toHaveBeenCalledTimes(1);
    expect(acceptOutline).toHaveBeenCalledTimes(1);
  });

  it('reports partial failure and never calls a missing destination owner', async () => {
    const acceptAuthorIntent = vi.fn().mockResolvedValue({ ok: true, receipt: { artifactId: 'foundation-a', message: 'Accepted.' } });
    registerProgram7PromotionIpc({ resolveWindowRole: () => 'writing', getWritingSnapshot: snapshot, acceptAuthorIntent });
    const result = await invoke(1, request([
      baseItem(),
      baseItem({ itemId: 'item-outline', destination: 'outline', payload: { destination: 'outline', label: 'Plan', body: '', kind: 'gap', state: 'proposed', manuscriptUnitId: null, sourceAnchor: null }, ownerAcceptance: acceptance('accept-outline') }),
    ]));
    expect(result).toMatchObject({ ok: true, data: { status: 'partial', outcomes: [
      { itemId: 'item-a', status: 'routed' },
      { itemId: 'item-outline', status: 'failed', artifactId: null },
    ] } });
  });

  it('keeps protected deferred material metadata-only and rejects protected owner routes', async () => {
    const acceptAuthorIntent = vi.fn();
    registerProgram7PromotionIpc({ resolveWindowRole: () => 'writing', getWritingSnapshot: snapshot, acceptAuthorIntent });
    const result = await invoke(1, request([
      baseItem({ itemId: 'item-protected-intent', source: source({ protection: { excluded: false, class: 'protected' } }) }),
      baseItem({
        itemId: 'item-protected-lore', destination: 'lore',
        source: source({ protection: { excluded: false, class: 'protected' } }),
        payload: { destination: 'lore', label: 'Hidden lore', summary: 'Metadata-only handoff.' },
        ownerAcceptance: acceptance('accept-lore'),
      }),
    ]));
    expect(result).toMatchObject({ ok: true, data: { status: 'partial', outcomes: [
      { itemId: 'item-protected-intent', status: 'failed' },
      { itemId: 'item-protected-lore', status: 'deferred', deferredPackage: { selectedText: null, contentAvailable: false } },
    ] } });
    expect(acceptAuthorIntent).not.toHaveBeenCalled();
  });

  it('makes retries idempotent and rejects reusing an operation ID for different work', async () => {
    const acceptAuthorIntent = vi.fn().mockResolvedValue({ ok: true, receipt: { artifactId: 'foundation-a', message: 'Accepted.' } });
    registerProgram7PromotionIpc({ resolveWindowRole: () => 'writing', getWritingSnapshot: snapshot, acceptAuthorIntent });
    const first = request([baseItem()]);
    const result = await invoke(1, first);
    const retry = await invoke(1, first);
    expect(retry).toEqual(result);
    expect(acceptAuthorIntent).toHaveBeenCalledTimes(1);
    await expect(invoke(1, request([baseItem({ payload: { destination: 'author-intent', questionId: 'tone', posture: 'answered', text: 'A different intent.' } })]))).resolves.toMatchObject({
      ok: false, error: { code: 'IDEMPOTENCY_CONFLICT' },
    });
    expect(acceptAuthorIntent).toHaveBeenCalledTimes(1);
  });

  it('rejects wrong surfaces, stale bindings, malformed keys, and mismatched narrative provenance before routing', async () => {
    const acceptAuthorIntent = vi.fn().mockResolvedValue({ ok: true, receipt: { artifactId: 'foundation-a', message: 'Accepted.' } });
    registerProgram7PromotionIpc({ resolveWindowRole: (id) => id === 1 ? 'writing' : null, getWritingSnapshot: snapshot, acceptAuthorIntent });
    await expect(invoke(2, request([baseItem()]))).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
    await expect(invoke(1, request([baseItem()], { generation: 3 }))).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(invoke(1, { ...request([baseItem()]), unexpected: true })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    const badNarrative = narrativeItem('item-bad');
    (badNarrative.source as any).selectedTextSha256 = hash('wrong');
    await expect(invoke(1, request([badNarrative], { operationId: 'bad-provenance' }))).resolves.toMatchObject({ ok: true, data: { status: 'failed', outcomes: [{ status: 'failed' }] } });
    expect(acceptAuthorIntent).not.toHaveBeenCalled();
  });
});
