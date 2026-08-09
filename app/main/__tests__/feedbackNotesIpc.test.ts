import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('Feedback Notes IPC authority', () => {
  const create = vi.fn();

  beforeEach(() => {
    resetFeedbackNotesIpcForTests();
    electronMocks.handlers.clear();
    create.mockReset();
    aiMocks.completed.mockReset();
    aiMocks.completed.mockReturnValue({
      requestId: 'critique-a',
      selectionFingerprint: 'selection-a',
    });
    registerFeedbackNotesIpc({
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      getWritingSnapshot: snapshot,
      repositoryFactory: () => ({ create } as never),
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

  it('rejects stale project, changed unit, and unrelated critique results before writing', async () => {
    registerFeedbackNotesIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => ({ ...snapshot(), activeUnitId: 'unit-b' }),
      repositoryFactory: () => ({ create } as never),
    });
    await expect(invoke(1)).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    expect(create).not.toHaveBeenCalled();

    registerFeedbackNotesIpc({
      resolveWindowRole: () => 'writing', getWritingSnapshot: snapshot,
      repositoryFactory: () => ({ create } as never),
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
});
