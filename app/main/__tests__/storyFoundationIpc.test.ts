import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  STORY_FOUNDATION_CHANNELS,
  STORY_FOUNDATION_QUESTIONS,
  STORY_FOUNDATION_SCHEMA_VERSION,
} from '../../shared/ipc/storyFoundation';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: any, request?: unknown) => Promise<unknown> | unknown>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: any, request?: unknown) => Promise<unknown> | unknown) => handlers.set(channel, handler)),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});

vi.mock('electron', () => ({ ipcMain: electronMocks }));

import { registerStoryFoundationIpc, resetStoryFoundationIpcForTests } from '../storyFoundationIpc';
import { StoryFoundationRepositoryError } from '../storyFoundationRepository';

const projectPath = 'C:/projects/a';
const binding = {
  operationId: 'foundation-op',
  projectId: 'project-a',
  projectPath,
  generation: 2,
};
const ready = {
  availability: 'ready' as const,
  document: {
    schemaVersion: STORY_FOUNDATION_SCHEMA_VERSION,
    questionSetVersion: 1 as const,
    projectId: 'project-a',
    revision: 0,
    entries: [],
  },
  questions: STORY_FOUNDATION_QUESTIONS,
  message: null,
};

function snapshot() {
  return {
    schemaVersion: 1 as const,
    role: 'writing' as const,
    generation: 2,
    revision: 4,
    project: {
      projectId: 'project-a', path: projectPath, title: 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1' as const,
      units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 1 }],
      drafts: { 'unit-a': 'Protected manuscript prose.' },
    },
    activeUnitId: 'unit-a', recentProjects: [], dirtyUnitIds: [],
    saveState: { status: 'clean' as const, unitId: null, message: null }, lastError: null,
    recovery: { status: 'none' as const, candidates: [] as const },
  };
}

function invoke(channel: string, senderId: number, request: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Missing handler: ${channel}`);
  return Promise.resolve(handler({ sender: { id: senderId } }, request));
}

describe('Story Foundation IPC authority', () => {
  const repository = {
    read: vi.fn(),
    setAnswer: vi.fn(),
    archiveAnswer: vi.fn(),
    restoreAnswer: vi.fn(),
  };

  beforeEach(() => {
    resetStoryFoundationIpcForTests();
    electronMocks.handlers.clear();
    Object.values(repository).forEach((mock) => mock.mockReset().mockResolvedValue(ready));
    registerStoryFoundationIpc({
      resolveWindowRole: (id) => id === 1 ? 'writing' : id === 2 ? 'command' : null,
      getWritingSnapshot: snapshot,
      repositoryFactory: () => repository as never,
    });
  });

  it('allows read-only downstream projection in Writing and Command surfaces', async () => {
    await expect(invoke(STORY_FOUNDATION_CHANNELS.get, 1, binding)).resolves.toEqual({ ok: true, data: ready });
    await expect(invoke(STORY_FOUNDATION_CHANNELS.get, 2, binding)).resolves.toEqual({ ok: true, data: ready });
    await expect(invoke(STORY_FOUNDATION_CHANNELS.get, 3, binding)).resolves.toMatchObject({
      ok: false, error: { code: 'NOT_AUTHORIZED' },
    });
    expect(repository.read).toHaveBeenCalledTimes(2);
  });

  it('keeps mutations author-controlled in Writing Studio', async () => {
    const request = {
      ...binding,
      expectedRevision: 0,
      questionId: 'aboutness' as const,
      posture: 'answered' as const,
      text: 'A house teaching its occupants to forget.',
    };
    await expect(invoke(STORY_FOUNDATION_CHANNELS.setAnswer, 2, request)).resolves.toMatchObject({
      ok: false, error: { code: 'NOT_AUTHORIZED' },
    });
    await expect(invoke(STORY_FOUNDATION_CHANNELS.setAnswer, 1, request)).resolves.toEqual({ ok: true, data: ready });
    expect(repository.setAnswer).toHaveBeenCalledWith('project-a', 0, {
      questionId: 'aboutness', posture: 'answered', text: request.text,
    });
  });

  it('rejects stale project, path, and generation bindings before repository access', async () => {
    await expect(invoke(STORY_FOUNDATION_CHANNELS.get, 1, { ...binding, generation: 1 })).resolves.toMatchObject({
      ok: false, error: { code: 'STALE_SESSION' },
    });
    await expect(invoke(STORY_FOUNDATION_CHANNELS.get, 1, { ...binding, projectId: 'project-b' })).resolves.toMatchObject({
      ok: false, error: { code: 'STALE_SESSION' },
    });
    await expect(invoke(STORY_FOUNDATION_CHANNELS.get, 1, { ...binding, projectPath: 'C:/projects/b' })).resolves.toMatchObject({
      ok: false, error: { code: 'STALE_SESSION' },
    });
    expect(repository.read).not.toHaveBeenCalled();
  });

  it('validates explicit blank and answered posture without inferring missing intent', async () => {
    const base = { ...binding, expectedRevision: 0, questionId: 'project-kind' as const };
    await expect(invoke(STORY_FOUNDATION_CHANNELS.setAnswer, 1, {
      ...base, posture: 'blank', text: 'inferred value',
    })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    await expect(invoke(STORY_FOUNDATION_CHANNELS.setAnswer, 1, {
      ...base, posture: 'answered', text: '   ',
    })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    await expect(invoke(STORY_FOUNDATION_CHANNELS.setAnswer, 1, {
      ...base, questionId: 'not-a-question', posture: 'unknown', text: '',
    })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(repository.setAnswer).not.toHaveBeenCalled();
  });

  it('binds archive and restore to an expected document revision', async () => {
    const request = { ...binding, expectedRevision: 3, questionId: 'tone' as const };
    await expect(invoke(STORY_FOUNDATION_CHANNELS.archiveAnswer, 1, request)).resolves.toEqual({ ok: true, data: ready });
    await expect(invoke(STORY_FOUNDATION_CHANNELS.restoreAnswer, 1, { ...request, expectedRevision: 4 })).resolves.toEqual({ ok: true, data: ready });
    expect(repository.archiveAnswer).toHaveBeenCalledWith('project-a', 3, 'tone');
    expect(repository.restoreAnswer).toHaveBeenCalledWith('project-a', 4, 'tone');
  });

  it('maps stale, archived, unavailable, and failed writes honestly', async () => {
    const request = {
      ...binding, expectedRevision: 0, questionId: 'tone' as const, posture: 'answered' as const, text: 'Quiet',
    };
    repository.setAnswer.mockRejectedValueOnce(new StoryFoundationRepositoryError('STALE', 'Reload.'));
    await expect(invoke(STORY_FOUNDATION_CHANNELS.setAnswer, 1, request)).resolves.toMatchObject({
      ok: false, error: { code: 'STALE_FOUNDATION' },
    });
    repository.setAnswer.mockRejectedValueOnce(new StoryFoundationRepositoryError('ARCHIVED', 'Restore first.'));
    await expect(invoke(STORY_FOUNDATION_CHANNELS.setAnswer, 1, request)).resolves.toMatchObject({
      ok: false, error: { code: 'ANSWER_ARCHIVED' },
    });
    repository.read.mockRejectedValueOnce(new StoryFoundationRepositoryError('UNAVAILABLE', 'Malformed.'));
    await expect(invoke(STORY_FOUNDATION_CHANNELS.get, 1, binding)).resolves.toMatchObject({
      ok: false, error: { code: 'FOUNDATION_UNAVAILABLE' },
    });
    repository.archiveAnswer.mockRejectedValueOnce(new StoryFoundationRepositoryError('WRITE_FAILED', 'Disk full.'));
    await expect(invoke(STORY_FOUNDATION_CHANNELS.archiveAnswer, 1, {
      ...binding, expectedRevision: 0, questionId: 'tone',
    })).resolves.toMatchObject({ ok: false, error: { code: 'FOUNDATION_WRITE_FAILED' } });
  });

  it('rejects unknown IPC request keys at the trust boundary', async () => {
    await expect(invoke(STORY_FOUNDATION_CHANNELS.get, 1, { ...binding, unexpected: true })).resolves.toMatchObject({
      ok: false, error: { code: 'INVALID_REQUEST' },
    });
    await expect(invoke(STORY_FOUNDATION_CHANNELS.setAnswer, 1, {
      ...binding,
      expectedRevision: 0,
      questionId: 'tone',
      posture: 'answered',
      text: 'Quiet',
      unexpected: true,
    })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(repository.read).not.toHaveBeenCalled();
    expect(repository.setAnswer).not.toHaveBeenCalled();
  });
});
