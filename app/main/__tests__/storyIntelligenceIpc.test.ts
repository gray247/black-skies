import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STORY_INTELLIGENCE_CHANNELS } from '../../shared/ipc/storyIntelligence';
import { createDefaultStoryIntelligenceDocument } from '../../shared/storyIntelligencePolicy';
import type { ProjectSpineSessionSnapshot } from '../../shared/ipc/projectSpine';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: { sender: { id: number } }, request?: unknown) => Promise<unknown>>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: { sender: { id: number } }, request?: unknown) => Promise<unknown>) => {
      handlers.set(channel, handler);
    }),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});

vi.mock('electron', () => ({ ipcMain: electronMocks }));

import {
  registerStoryIntelligenceIpc,
  resetStoryIntelligenceIpcForTests,
} from '../storyIntelligenceIpc';
import { StoryIntelligenceRepository } from '../storyIntelligenceRepository';

const temporaryRoots: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-story-intelligence-ipc-'));
  temporaryRoots.push(root);
  return root;
}

function snapshot(projectPath: string | null, generation = 7): ProjectSpineSessionSnapshot {
  return {
    schemaVersion: 1,
    role: 'writing',
    generation,
    revision: 3,
    project: projectPath ? {
      projectId: 'project-a',
      path: projectPath,
      title: 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1',
      units: [],
      drafts: {},
    } : null,
    activeUnitId: null,
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'clean', unitId: null, message: null },
    lastError: null,
  };
}

function invoke(channel: string, senderId: number, request: unknown): Promise<unknown> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Missing IPC handler ${channel}`);
  return handler({ sender: { id: senderId } }, request);
}

describe('story-intelligence IPC', () => {
  beforeEach(() => {
    electronMocks.handlers.clear();
    electronMocks.handle.mockClear();
  });

  afterEach(async () => {
    resetStoryIntelligenceIpcForTests();
    await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('registers typed named handlers and denies the Command Center', async () => {
    const projectPath = await temporaryProject();
    registerStoryIntelligenceIpc({
      resolveWindowRole: (id) => (id === 1 ? 'writing' : 'command'),
      getWritingSnapshot: () => snapshot(projectPath),
    });
    expect([...electronMocks.handlers.keys()]).toEqual(Object.values(STORY_INTELLIGENCE_CHANNELS));

    const request = { operationId: 'op-1', projectId: 'project-a', projectPath, generation: 7 };
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.read, 2, request)).resolves.toEqual({
      ok: false,
      error: { code: 'NOT_WRITING_STUDIO', message: 'Story intelligence is available only in Writing Studio.' },
    });
  });

  it('fails closed for no project, stale identity, and invalid permission input', async () => {
    const projectPath = await temporaryProject();
    let repositoryCalls = 0;
    registerStoryIntelligenceIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => snapshot(null),
      repositoryFactory: () => {
        repositoryCalls += 1;
        return new StoryIntelligenceRepository(projectPath);
      },
    });
    const base = { operationId: 'op-1', projectId: 'project-a', projectPath, generation: 7 };
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.read, 1, base)).resolves.toMatchObject({ error: { code: 'NO_ACTIVE_PROJECT' } });
    expect(repositoryCalls).toBe(0);

    registerStoryIntelligenceIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => snapshot(projectPath, 8),
      repositoryFactory: () => {
        repositoryCalls += 1;
        return new StoryIntelligenceRepository(projectPath);
      },
    });
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.read, 1, base)).resolves.toMatchObject({ error: { code: 'STALE_SESSION' } });
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.checkPermission, 1, {
      ...base,
      generation: 8,
      sourceClass: 'not-a-source',
      operation: 'model-package',
    })).resolves.toMatchObject({ error: { code: 'INVALID_REQUEST' } });
  });

  it('reads, writes, and checks policy for the active Writing Studio project', async () => {
    const projectPath = await temporaryProject();
    registerStoryIntelligenceIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => snapshot(projectPath),
    });
    const binding = { operationId: 'op-1', projectId: 'project-a', projectPath, generation: 7 };
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.read, 1, binding)).resolves.toMatchObject({ ok: true, data: { revision: 0 } });
    const document = {
      ...createDefaultStoryIntelligenceDocument('project-a', new Date('2026-08-31T12:00:00.000Z')),
      revision: 1,
    };
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.write, 1, { ...binding, expectedRevision: 0, document })).resolves.toMatchObject({
      ok: true,
      data: { revision: 1 },
    });
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.checkPermission, 1, {
      ...binding,
      sourceClass: 'deterministic-only',
      operation: 'model-package',
    })).resolves.toMatchObject({ ok: true, data: { allowed: false, reason: 'deterministic-only' } });
  });

  it('maps unavailable, stale, and write failures to truthful typed errors', async () => {
    const projectPath = await temporaryProject();
    const repository = new StoryIntelligenceRepository(projectPath);
    const factory = vi.fn(() => repository);
    registerStoryIntelligenceIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => snapshot(projectPath),
      repositoryFactory: factory,
    });
    const binding = { operationId: 'op-1', projectId: 'project-a', projectPath, generation: 7 };
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.write, 1, {
      ...binding,
      expectedRevision: 0,
      document: { ...createDefaultStoryIntelligenceDocument('wrong-project'), revision: 1 },
    })).resolves.toMatchObject({ error: { code: 'INVALID_REQUEST' } });
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.write, 1, {
      ...binding,
      expectedRevision: 2,
      document: { ...createDefaultStoryIntelligenceDocument('project-a'), revision: 3 },
    })).resolves.toMatchObject({ error: { code: 'STORY_INTELLIGENCE_STALE' } });
    expect(factory).toHaveBeenCalled();
  });
});
