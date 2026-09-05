import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STORY_INTELLIGENCE_CHANNELS } from '../../shared/ipc/storyIntelligence';
import { createDefaultStoryIntelligenceDocument } from '../../shared/storyIntelligencePolicy';
import type {
  DurableSignalV1,
  StoryIntelligenceDocumentV1,
  StoryPositionRefV1,
} from '../../shared/ipc/storyIntelligence';
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

function snapshotWithUnit(
  projectPath: string,
  generation = 7,
  bodySha256 = 'a'.repeat(64),
  saveStatus: ProjectSpineSessionSnapshot['saveState']['status'] = 'clean',
): ProjectSpineSessionSnapshot {
  const base = snapshot(projectPath, generation);
  return {
    ...base,
    saveState: { status: saveStatus, unitId: saveStatus === 'clean' ? null : 'unit-a', message: null },
    project: {
      ...base.project!,
      units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 1 }],
      unitMetrics: {
        'unit-a': { wordCount: 3, sentenceCount: 1, paragraphCount: 1, dialogueRatio: 0, bodySha256 },
      },
    },
  };
}

function signalRef(sourceRevision = 7, sourceFingerprint = 'a'.repeat(64)): StoryPositionRefV1 {
  return {
    projectId: 'project-a',
    sourceKind: 'story-unit',
    sourceId: 'unit-a',
    sourceRevision,
    sourceFingerprint,
    unitId: 'unit-a',
    orderIndex: 1,
    orderBasis: 'manuscript',
  };
}

function signal(options: {
  readonly currentness?: DurableSignalV1['currentness'];
  readonly positionRefs?: readonly StoryPositionRefV1[];
} = {}): DurableSignalV1 {
  const now = '2026-09-04T12:00:00.000Z';
  return {
    schemaVersion: 'BlackSkiesStoryIntelligence v1',
    signalId: 'signal-a',
    projectId: 'project-a',
    positionRefs: options.positionRefs ?? [signalRef()],
    sourceOwner: 'IPC test fixture',
    evidenceClass: 'observed',
    impact: 'attention',
    confidenceBand: 'high',
    currentness: options.currentness ?? 'current',
    lifecycle: 'reviewed',
    summary: 'A source-linked signal.',
    evidenceSummary: 'The signal has current manuscript evidence.',
    provenance: {
      sourceOwner: 'IPC test fixture',
      origin: 'deterministic',
      visibility: 'included',
      citationRequired: true,
      protectionClass: 'included',
    },
    createdAt: now,
    updatedAt: now,
  };
}

function documentWithSignal(sourceSignal: DurableSignalV1, revision = 1): StoryIntelligenceDocumentV1 {
  return {
    ...createDefaultStoryIntelligenceDocument('project-a', new Date('2026-09-04T12:00:00.000Z')),
    revision,
    durableSignals: [sourceSignal],
  };
}

function convertedDocument(document: StoryIntelligenceDocumentV1): StoryIntelligenceDocumentV1 {
  return {
    ...document,
    revision: document.revision + 1,
    durableSignals: document.durableSignals.map((sourceSignal) => ({
      ...sourceSignal,
      lifecycle: 'converted' as const,
      disposition: 'converted' as const,
    })),
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

  it('registers typed named handlers for the Stage 19 project surfaces', async () => {
    const projectPath = await temporaryProject();
    registerStoryIntelligenceIpc({
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      getWritingSnapshot: () => snapshot(projectPath),
    });
    expect([...electronMocks.handlers.keys()]).toEqual(Object.values(STORY_INTELLIGENCE_CHANNELS));

    const request = { operationId: 'op-1', projectId: 'project-a', projectPath, generation: 7 };
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.read, 2, request)).resolves.toMatchObject({ ok: true, data: { revision: 0 } });
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.write, 2, {
      ...request,
      expectedRevision: 0,
      document: { ...createDefaultStoryIntelligenceDocument('project-a'), revision: 1 },
    })).resolves.toMatchObject({ ok: true, data: { revision: 1 } });
    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.read, 3, request)).resolves.toEqual({
      ok: false,
      error: { code: 'NOT_WRITING_STUDIO', message: 'Story intelligence is available only in the Stage 19 project surfaces.' },
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

  it.each(['stale', 'trimmed'] as const)('denies conversion when the persisted signal is %s', async (currentness) => {
    const projectPath = await temporaryProject();
    const repository = new StoryIntelligenceRepository(projectPath);
    const persisted = await repository.write('project-a', 0, documentWithSignal(signal({ currentness })));
    registerStoryIntelligenceIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => snapshotWithUnit(projectPath),
      repositoryFactory: () => repository,
    });

    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.write, 1, {
      operationId: 'convert-stale-signal',
      projectId: 'project-a',
      projectPath,
      generation: 7,
      expectedRevision: persisted.revision,
      document: convertedDocument(persisted),
    })).resolves.toMatchObject({ error: { code: 'STORY_INTELLIGENCE_STALE' } });
    await expect(repository.read('project-a')).resolves.toMatchObject({
      durableSignals: [{ lifecycle: 'reviewed', currentness }],
    });
  });

  it('denies conversion when the persisted or requested signal has no source references', async () => {
    const projectPath = await temporaryProject();
    const repository = new StoryIntelligenceRepository(projectPath);
    const persisted = await repository.write('project-a', 0, documentWithSignal(signal({ positionRefs: [] })));
    registerStoryIntelligenceIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => snapshotWithUnit(projectPath),
      repositoryFactory: () => repository,
    });

    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.write, 1, {
      operationId: 'convert-unlinked-signal',
      projectId: 'project-a',
      projectPath,
      generation: 7,
      expectedRevision: persisted.revision,
      document: convertedDocument(persisted),
    })).resolves.toMatchObject({ error: { code: 'STORY_INTELLIGENCE_STALE' } });
  });

  it.each([
    ['source revision', signalRef(6)],
    ['source fingerprint', signalRef(7, 'b'.repeat(64))],
  ] as const)('denies conversion with a stale %s', async (_description, staleRef) => {
    const projectPath = await temporaryProject();
    const repository = new StoryIntelligenceRepository(projectPath);
    const persisted = await repository.write('project-a', 0, documentWithSignal(signal({ positionRefs: [staleRef] })));
    registerStoryIntelligenceIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => snapshotWithUnit(projectPath),
      repositoryFactory: () => repository,
    });

    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.write, 1, {
      operationId: 'convert-stale-source',
      projectId: 'project-a',
      projectPath,
      generation: 7,
      expectedRevision: persisted.revision,
      document: convertedDocument(persisted),
    })).resolves.toMatchObject({ error: { code: 'STORY_INTELLIGENCE_STALE' } });
  });

  it('denies conversion when a save changes the Writing Studio snapshot during the repository read', async () => {
    const projectPath = await temporaryProject();
    const repository = new StoryIntelligenceRepository(projectPath);
    const persisted = await repository.write('project-a', 0, documentWithSignal(signal()));
    let liveSnapshot = snapshotWithUnit(projectPath);
    const read = vi.spyOn(repository, 'read').mockImplementation(async () => {
      liveSnapshot = {
        ...liveSnapshot,
        revision: liveSnapshot.revision + 1,
        saveState: { status: 'saving', unitId: 'unit-a', message: null },
      };
      return persisted;
    });
    const write = vi.spyOn(repository, 'write');
    registerStoryIntelligenceIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => liveSnapshot,
      repositoryFactory: () => repository,
    });

    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.write, 1, {
      operationId: 'convert-save-race',
      projectId: 'project-a',
      projectPath,
      generation: 7,
      expectedRevision: persisted.revision,
      document: convertedDocument(persisted),
    })).resolves.toMatchObject({ error: { code: 'STORY_INTELLIGENCE_STALE' } });
    expect(read).toHaveBeenCalledTimes(1);
    expect(write).not.toHaveBeenCalled();
  });

  it('converts a persisted signal only when its source and Writing Studio snapshot are current', async () => {
    const projectPath = await temporaryProject();
    const repository = new StoryIntelligenceRepository(projectPath);
    const persisted = await repository.write('project-a', 0, documentWithSignal(signal()));
    registerStoryIntelligenceIpc({
      resolveWindowRole: () => 'writing',
      getWritingSnapshot: () => snapshotWithUnit(projectPath),
      repositoryFactory: () => repository,
    });

    await expect(invoke(STORY_INTELLIGENCE_CHANNELS.write, 1, {
      operationId: 'convert-current-signal',
      projectId: 'project-a',
      projectPath,
      generation: 7,
      expectedRevision: persisted.revision,
      document: convertedDocument(persisted),
    })).resolves.toMatchObject({
      ok: true,
      data: { durableSignals: [{ lifecycle: 'converted', currentness: 'current' }] },
    });
  });
});
