import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildProgram7SourceEnvelope } from '../../shared/program7SourceBinding';
import { FEEDBACK_NOTE_CHANNELS } from '../../shared/ipc/feedbackNotes';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: any, request?: unknown) => Promise<unknown> | unknown>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: any, request?: unknown) => Promise<unknown> | unknown) => {
      handlers.set(channel, handler);
    }),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});
const aiMocks = vi.hoisted(() => ({ completed: vi.fn() }));
const revisionMocks = vi.hoisted(() => ({
  read: vi.fn(),
  createRevisionItem: vi.fn(),
  setLifecycle: vi.fn(),
  recordRecheck: vi.fn(),
  createRecurrence: vi.fn(),
  localRun: vi.fn(),
}));

vi.mock('electron', () => ({ ipcMain: electronMocks }));
vi.mock('../aiCritiqueIpc', () => ({
  completedAiCritiqueForSender: aiMocks.completed,
}));

import { FeedbackNotesRepositoryError } from '../feedbackNotesRepository';
import { registerFeedbackNotesIpc, resetFeedbackNotesIpcForTests } from '../feedbackNotesIpc';

const projectPath = 'C:/projects/a';
const request = {
  operationId: 'save-feedback-a',
  projectId: 'project-a',
  projectPath,
  generation: 1,
  unitId: 'unit-a',
  sourceCritiqueRequestId: 'critique-a',
  selectionFingerprint: 'selection-a',
  body: 'Clarify why Mara waits for the train.',
};

function snapshot() {
  return {
    schemaVersion: 1 as const,
    role: 'writing' as const,
    generation: 1,
    revision: 1,
    project: {
      projectId: 'project-a',
      path: projectPath,
      title: 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1' as const,
      units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 0 }],
      drafts: { 'unit-a': 'Protected manuscript text.' },
    },
    activeUnitId: 'unit-a',
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'clean' as const, unitId: null, message: null },
    lastError: null,
    recovery: { status: 'none' as const, candidates: [] as const },
  };
}

function invoke(senderId: number, candidate: unknown = request): Promise<any> {
  const handler = electronMocks.handlers.get(FEEDBACK_NOTE_CHANNELS.createFromCritique);
  if (!handler) throw new Error('Feedback Notes IPC handler was not registered.');
  return Promise.resolve(handler({ sender: { id: senderId } }, candidate));
}

function invokeRevision(channel: string, senderId: number, candidate: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Feedback Notes IPC handler was not registered: ${channel}`);
  return Promise.resolve(handler({ sender: { id: senderId } }, candidate));
}

describe('Feedback Notes IPC authority', () => {
  const create = vi.fn();
  const list = vi.fn();

  beforeEach(() => {
    resetFeedbackNotesIpcForTests();
    electronMocks.handlers.clear();
    create.mockReset();
    list.mockReset();
    list.mockResolvedValue([]);
    Object.values(revisionMocks).forEach((mock) => mock.mockReset());
    aiMocks.completed.mockReset();
    aiMocks.completed.mockReturnValue({
      requestId: 'critique-a',
      selectionFingerprint: 'selection-a',
    });
    registerFeedbackNotesIpc({
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      getWritingSnapshot: snapshot,
      repositoryFactory: () => ({
        create,
        list,
        read: revisionMocks.read,
        createRevisionItem: revisionMocks.createRevisionItem,
        setLifecycle: revisionMocks.setLifecycle,
        recordRecheck: revisionMocks.recordRecheck,
        createRecurrence: revisionMocks.createRecurrence,
      } as never),
      localInferenceService: { run: revisionMocks.localRun } as never,
    });
  });

  it('registers one writing-only bridge and saves only an author-selected minimal note', async () => {
    create.mockResolvedValue({
      id: 'feedback-a', createdAt: '2026-08-07T12:00:00.000Z', advisory: true, ...request,
    });
    await expect(invoke(2)).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
    await expect(invoke(1)).resolves.toMatchObject({ ok: true, data: { id: 'feedback-a', advisory: true } });
    expect(aiMocks.completed).toHaveBeenCalledWith(1, 'critique-a');
    expect(create).toHaveBeenCalledWith({
      projectId: 'project-a', unitId: 'unit-a', sourceCritiqueRequestId: 'critique-a',
      selectionFingerprint: 'selection-a', body: request.body,
    });
  });

  it('lists only the active project advisory notes for reopen discovery', async () => {
    const note = {
      id: 'feedback-a', projectId: 'project-a', unitId: 'unit-a', sourceCritiqueRequestId: 'critique-a',
      selectionFingerprint: 'selection-a', createdAt: '2026-08-07T12:00:00.000Z', advisory: true, body: request.body,
    };
    list.mockResolvedValue([note]);
    const handler = electronMocks.handlers.get(FEEDBACK_NOTE_CHANNELS.list)!;
    await expect(Promise.resolve(handler({ sender: { id: 2 } }, request))).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
    await expect(Promise.resolve(handler({ sender: { id: 1 } }, request))).resolves.toEqual({ ok: true, data: [note] });
    expect(list).toHaveBeenCalledWith('project-a');
  });

  it('rejects stale project, changed unit, and unrelated critique results before writing', async () => {
    registerFeedbackNotesIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => ({ ...snapshot(), activeUnitId: 'unit-b' }),
      repositoryFactory: () => ({ create, list } as never),
    });
    await expect(invoke(1)).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    expect(create).not.toHaveBeenCalled();

    registerFeedbackNotesIpc({
      resolveWindowRole: () => 'writing', getWritingSnapshot: snapshot,
      repositoryFactory: () => ({ create, list } as never),
    });
    aiMocks.completed.mockReturnValue(null);
    await expect(invoke(1)).resolves.toMatchObject({ ok: false, error: { code: 'CRITIQUE_UNAVAILABLE' } });
    expect(create).not.toHaveBeenCalled();
  });

  it('reports malformed input and failed durable writes without claiming success', async () => {
    await expect(invoke(1, { ...request, body: '' })).resolves.toMatchObject({
      ok: false, error: { code: 'INVALID_REQUEST' },
    });
    create.mockRejectedValue(new FeedbackNotesRepositoryError('WRITE_FAILED', 'The feedback note could not be saved.'));
    await expect(invoke(1)).resolves.toMatchObject({
      ok: false, error: { code: 'FEEDBACK_NOTE_WRITE_FAILED' },
    });
  });

  it('creates a durable revision item only from a current source envelope and strips source text', async () => {
    const source = await buildProgram7SourceEnvelope({
      projectId: 'project-a',
      generation: 1,
      unitId: 'unit-a',
      sourceText: 'Protected manuscript text.',
      selectionStart: 0,
      selectionEnd: 'Protected manuscript text.'.length,
      findingId: 'finding-a',
      lens: 'continuity',
      evidenceSummary: 'Exact saved-prose cue.',
    });
    const item = {
      id: 'revision-a',
      projectId: 'project-a',
      unitId: 'unit-a',
      body: 'Clarify the signal.',
      advisory: false,
      kind: 'revision_item',
      lifecycle: 'active',
    };
    revisionMocks.createRevisionItem.mockResolvedValue({
      document: { revision: 1 },
      note: item,
    });
    const result = await invokeRevision(FEEDBACK_NOTE_CHANNELS.createRevisionItem, 2, {
      operationId: 'work-on-finding',
      projectId: 'project-a',
      projectPath,
      generation: 1,
      expectedRevision: 0,
      source,
      body: 'Clarify the signal.',
    });
    expect(result).toEqual({ ok: true, data: item, revision: 1 });
    expect(revisionMocks.createRevisionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceFindingId: 'finding-a',
        lens: 'continuity',
        anchor: source.anchor,
        sourceGeneration: 1,
        sourceRevision: source.sourceRef.sourceRevision,
        sourceClass: 'included',
      }),
      0,
    );
    expect(revisionMocks.createRevisionItem.mock.calls[0][0]).not.toHaveProperty('text');
  });

  it('uses a durable signal id as the revision finding identity', async () => {
    const source = await buildProgram7SourceEnvelope({
      projectId: 'project-a',
      generation: 1,
      unitId: 'unit-a',
      sourceText: 'Protected manuscript text.',
      selectionStart: 0,
      selectionEnd: 'Protected manuscript text.'.length,
      signalId: 'signal-a',
      lens: 'signals',
      evidenceSummary: 'Review this signal once.',
    });
    const item = {
      id: 'revision-a', projectId: 'project-a', unitId: 'unit-a',
      body: 'Review this signal once.', advisory: false, kind: 'revision_item', lifecycle: 'active',
    };
    revisionMocks.createRevisionItem.mockResolvedValue({ document: { revision: 1 }, note: item });

    await invokeRevision(FEEDBACK_NOTE_CHANNELS.createRevisionItem, 2, {
      operationId: 'work-on-signal', projectId: 'project-a', projectPath,
      generation: 1, expectedRevision: 0, source, body: 'Review this signal once.',
    });

    expect(revisionMocks.createRevisionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceFindingId: 'signal-a',
        provenance: expect.objectContaining({ findingId: 'signal-a' }),
      }),
      0,
    );
  });

  it('manual concern: verifies both exact sources and persists references without manuscript copies', async () => {
    const source = await buildProgram7SourceEnvelope({ projectId: 'project-a', generation: 1, unitId: 'unit-a', sourceText: 'Protected manuscript text.', selectionStart: 0, selectionEnd: 9 });
    const related = await buildProgram7SourceEnvelope({ projectId: 'project-a', generation: 1, unitId: 'unit-a', sourceText: 'Protected manuscript text.', selectionStart: 10, selectionEnd: 20 });
    revisionMocks.createRevisionItem.mockResolvedValue({ document: { revision: 1 }, note: { id: 'manual', advisory: false } });
    await expect(invokeRevision(FEEDBACK_NOTE_CHANNELS.createRevisionItem, 1, { operationId: 'manual', projectId: 'project-a', projectPath, generation: 1,
      expectedRevision: 0, source, relatedSources: [related], manual: true, body: 'Compare the promise.' })).resolves.toMatchObject({ ok: true });
    const input = revisionMocks.createRevisionItem.mock.calls[0][0];
    expect(input.provenance).toMatchObject({ source: 'manual', origin: 'author' });
    expect(input.relatedSources[0]).toMatchObject({ anchor: related.anchor, protection: related.protection });
    expect(input.relatedSources[0]).not.toHaveProperty('text');
    expect(input).not.toHaveProperty('text');
  });

  it.each(['primary-stale', 'related-stale', 'primary-protected', 'related-protected'])('manual concern: refuses %s without a feedback write', async edge => {
    const source = await buildProgram7SourceEnvelope({ projectId: 'project-a', generation: 1, unitId: 'unit-a', sourceText: edge === 'primary-stale' ? 'Entirely different source.' : 'Protected manuscript text.',
      selectionStart: 0, selectionEnd: 9, sourceClass: edge === 'primary-protected' ? 'protected' : 'included' });
    const related = await buildProgram7SourceEnvelope({ projectId: 'project-a', generation: 1, unitId: 'unit-a', sourceText: edge === 'related-stale' ? 'Entirely different source.' : 'Protected manuscript text.',
      selectionStart: 10, selectionEnd: 20, sourceClass: edge === 'related-protected' ? 'protected' : 'included' });
    await expect(invokeRevision(FEEDBACK_NOTE_CHANNELS.createRevisionItem, 1, { operationId: 'manual', projectId: 'project-a', projectPath, generation: 1,
      expectedRevision: 0, source, relatedSources: [related], manual: true, body: 'Keep this draft.' })).resolves.toMatchObject({ ok: false, error: { code: 'SOURCE_STALE' } });
    expect(revisionMocks.createRevisionItem).not.toHaveBeenCalled();
  });

  it('lists active and history revision projections through the owner', async () => {
    const notes = [
      { id: 'active', projectId: 'project-a', unitId: 'unit-a', body: 'Open', advisory: false, kind: 'revision_item', lifecycle: 'underway' },
      { id: 'history', projectId: 'project-a', unitId: 'unit-a', body: 'Done', advisory: false, kind: 'revision_item', lifecycle: 'resolved' },
      { id: 'advisory', projectId: 'project-a', unitId: 'unit-a', body: 'Advisory', advisory: true },
    ];
    revisionMocks.read.mockResolvedValue({ revision: 4, notes });
    const base = {
      operationId: 'list-revisions', projectId: 'project-a', projectPath, generation: 1,
    };
    const active = await Promise.resolve(electronMocks.handlers.get(FEEDBACK_NOTE_CHANNELS.listRevisionItems)!(
      { sender: { id: 2 } }, { ...base, scope: 'active' },
    ));
    expect(active).toEqual({ ok: true, data: [notes[0]], revision: 4 });
    const history = await Promise.resolve(electronMocks.handlers.get(FEEDBACK_NOTE_CHANNELS.listRevisionItems)!(
      { sender: { id: 2 } }, { ...base, scope: 'history' },
    ));
    expect(history).toEqual({ ok: true, data: [notes[1]], revision: 4 });
  });

  it('keeps posture changes author-owned and refuses stale or invalid lifecycle mutations', async () => {
    const source = await buildProgram7SourceEnvelope({
      projectId: 'project-a', generation: 1, unitId: 'unit-a', sourceText: 'Protected manuscript text.',
      selectionStart: 0, selectionEnd: 'Protected manuscript text.'.length,
    });
    const item = {
      id: 'revision-a', projectId: 'project-a', unitId: 'unit-a', body: 'Open', advisory: false,
      kind: 'revision_item', lifecycle: 'review', sourceGeneration: 1,
      sourceRevision: source.sourceRef.sourceRevision, sourceKind: source.sourceRef.sourceKind,
      sourceId: source.sourceRef.sourceId, sourceClass: 'included', sourceBodyFingerprint: source.bodySha256,
      anchor: source.anchor,
    };
    revisionMocks.read.mockResolvedValue({ revision: 2, notes: [item] });
    revisionMocks.setLifecycle.mockResolvedValue({ document: { revision: 3 }, note: { ...item, lifecycle: 'resolved' } });
    const result = await Promise.resolve(electronMocks.handlers.get(FEEDBACK_NOTE_CHANNELS.setLifecycle)!(
      { sender: { id: 2 } }, {
        operationId: 'resolve-revision', projectId: 'project-a', projectPath, generation: 1,
        expectedRevision: 2, itemId: 'revision-a', lifecycle: 'resolved',
      },
    ));
    expect(result).toMatchObject({ ok: true, data: { lifecycle: 'resolved' }, revision: 3 });
    expect(revisionMocks.setLifecycle).toHaveBeenCalledWith('project-a', 2, 'revision-a', 'resolved', undefined, [expect.objectContaining({ unitId: 'unit-a', text: 'Protected manuscript text.', scope: 'unit' })]);
    await expect(Promise.resolve(electronMocks.handlers.get(FEEDBACK_NOTE_CHANNELS.setLifecycle)!(
      { sender: { id: 2 } }, {
        operationId: 'bad-lifecycle', projectId: 'project-a', projectPath, generation: 1,
        expectedRevision: 2, itemId: 'revision-a', lifecycle: 'recheck_pending',
      },
    ))).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('records a deterministic source check without making a semantic resolution claim', async () => {
    const source = await buildProgram7SourceEnvelope({
      projectId: 'project-a', generation: 1, unitId: 'unit-a', sourceText: 'Protected manuscript text.',
      selectionStart: 0, selectionEnd: 'Protected manuscript text.'.length,
    });
    const item = {
      id: 'revision-a', projectId: 'project-a', unitId: 'unit-a', body: 'Open', advisory: false,
      kind: 'revision_item', lifecycle: 'ready_for_recheck', sourceGeneration: 1,
      sourceRevision: source.sourceRef.sourceRevision, sourceKind: source.sourceRef.sourceKind,
      sourceId: source.sourceRef.sourceId, sourceClass: 'included', sourceBodyFingerprint: source.bodySha256,
      anchor: source.anchor,
    };
    revisionMocks.read.mockResolvedValue({ revision: 2, notes: [item] });
    revisionMocks.recordRecheck.mockResolvedValue({ document: { revision: 3 }, note: item });
    const result = await Promise.resolve(electronMocks.handlers.get(FEEDBACK_NOTE_CHANNELS.deterministicRecheck)!(
      { sender: { id: 2 } }, {
        operationId: 'deterministic-recheck', projectId: 'project-a', projectPath, generation: 1,
        expectedRevision: 2, itemId: 'revision-a',
      },
    ));
    expect(result).toMatchObject({ ok: true, revision: 3 });
    expect(revisionMocks.recordRecheck).toHaveBeenCalledWith(
      'project-a', 2, 'revision-a', 'not_run', expect.stringContaining('did not decide whether the concern is resolved'),
      { method: 'deterministic', sourceStatus: 'exact' },
    );
    expect(revisionMocks.localRun).not.toHaveBeenCalled();
  });

  it('allows local AI to report only advisory recheck status and never resolve the item', async () => {
    const source = await buildProgram7SourceEnvelope({
      projectId: 'project-a', generation: 1, unitId: 'unit-a', sourceText: 'Protected manuscript text.',
      selectionStart: 0, selectionEnd: 'Protected manuscript text.'.length,
    });
    const item = {
      id: 'revision-a', projectId: 'project-a', unitId: 'unit-a', body: 'Open', advisory: false,
      kind: 'revision_item', lifecycle: 'underway', sourceGeneration: 1,
      sourceRevision: source.sourceRef.sourceRevision, sourceKind: source.sourceRef.sourceKind,
      sourceId: source.sourceRef.sourceId, sourceClass: 'included', sourceBodyFingerprint: source.bodySha256,
      anchor: source.anchor,
    };
    revisionMocks.read.mockResolvedValue({ revision: 2, notes: [item] });
    revisionMocks.localRun.mockResolvedValue({ status: 'appears_resolved', reason: 'The concern is not obvious.' });
    revisionMocks.recordRecheck.mockResolvedValue({ document: { revision: 3 }, note: item });
    await expect(Promise.resolve(electronMocks.handlers.get(FEEDBACK_NOTE_CHANNELS.localRecheck)!(
      { sender: { id: 2 } }, {
        operationId: 'local-recheck', projectId: 'project-a', projectPath, generation: 1,
        expectedRevision: 2, itemId: 'revision-a', purpose: 'Check the concern.',
      },
    ))).resolves.toMatchObject({ ok: true, revision: 3 });
    expect(revisionMocks.localRun).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'revision_recheck', projectId: 'project-a',
    }), { authorInvoked: true });
    expect(revisionMocks.recordRecheck).toHaveBeenCalledWith(
      'project-a', 2, 'revision-a', 'appears_resolved', 'The concern is not obvious.',
      { method: 'local-ai', sourceStatus: 'exact' },
    );
    expect(revisionMocks.setLifecycle).not.toHaveBeenCalled();
  });

  it('records main-owned quotes and rejects dirty or concurrently changed decision sources', async () => {
    const body = 'Protected manuscript text.';
    const source = await buildProgram7SourceEnvelope({ projectId: 'project-a', generation: 1, unitId: 'unit-a', sourceText: body, selectionStart: 0, selectionEnd: body.length });
    const item = { id: 'revision-a', projectId: 'project-a', unitId: 'unit-a', body: 'Manual concern', advisory: false, kind: 'revision_item', lifecycle: 'active', provenance: { source: 'manual' }, anchor: source.anchor, sourceBodyFingerprint: source.bodySha256 };
    revisionMocks.read.mockResolvedValue({ revision: 2, notes: [item] });
    revisionMocks.setLifecycle.mockResolvedValue({ document: { revision: 3 }, note: { ...item, lifecycle: 'resolved' } });
    const request = { operationId: 'decision', projectId: 'project-a', projectPath, generation: 1, expectedRevision: 2, itemId: 'revision-a', lifecycle: 'resolved', sourceEvidence: [{ text: 'forged renderer quote' }] };
    registerFeedbackNotesIpc({ resolveWindowRole: () => 'writing', getWritingSnapshot: () => ({ ...snapshot(), project: { ...snapshot().project, drafts: { 'unit-a': '---\nid: unit-a\n---\n\n' + body + '\n' } } }), repositoryFactory: () => ({ read: revisionMocks.read, setLifecycle: revisionMocks.setLifecycle } as never) });
    expect(await invokeRevision(FEEDBACK_NOTE_CHANNELS.setLifecycle, 1, request)).toMatchObject({ ok: true });
    expect(revisionMocks.setLifecycle.mock.calls[0]![5][0]).toMatchObject({ text: body, bodyFingerprint: source.bodySha256 });
    revisionMocks.setLifecycle.mockClear();
    registerFeedbackNotesIpc({ resolveWindowRole: () => 'writing', getWritingSnapshot: () => ({ ...snapshot(), dirtyUnitIds: ['unit-a'] }), repositoryFactory: () => ({ read: revisionMocks.read, setLifecycle: revisionMocks.setLifecycle } as never) });
    expect(await invokeRevision(FEEDBACK_NOTE_CHANNELS.setLifecycle, 1, request)).toMatchObject({ ok: false, error: { code: 'SOURCE_STALE' } });
    expect(revisionMocks.setLifecycle).not.toHaveBeenCalled();
    let reads = 0;
    registerFeedbackNotesIpc({ resolveWindowRole: () => 'writing', getWritingSnapshot: () => (++reads === 1 ? snapshot() : { ...snapshot(), project: { ...snapshot().project, drafts: { 'unit-a': 'Changed while recording.' } } }), repositoryFactory: () => ({ read: revisionMocks.read, setLifecycle: revisionMocks.setLifecycle } as never) });
    expect(await invokeRevision(FEEDBACK_NOTE_CHANNELS.setLifecycle, 1, request)).toMatchObject({ ok: false, error: { code: 'SOURCE_STALE' } });
    expect(revisionMocks.setLifecycle).not.toHaveBeenCalled();
  });

  it('rejects source drift before creating revision work', async () => {
    const source = await buildProgram7SourceEnvelope({
      projectId: 'project-a', generation: 1, unitId: 'unit-a', sourceText: 'Protected manuscript text.',
      selectionStart: 0, selectionEnd: 'Protected manuscript text.'.length,
    });
    registerFeedbackNotesIpc({
      resolveWindowRole: () => 'command',
      getWritingSnapshot: () => ({ ...snapshot(), project: { ...snapshot().project!, drafts: { 'unit-a': 'The source changed.' } } }),
      repositoryFactory: () => ({ create, list, createRevisionItem: revisionMocks.createRevisionItem } as never),
    });
    await expect(invokeRevision(FEEDBACK_NOTE_CHANNELS.createRevisionItem, 2, {
      operationId: 'stale-finding', projectId: 'project-a', projectPath, generation: 1,
      expectedRevision: 0, source, body: 'Clarify the signal.',
    })).resolves.toMatchObject({ ok: false, error: { code: 'SOURCE_STALE' } });
    expect(revisionMocks.createRevisionItem).not.toHaveBeenCalled();
  });
});
