import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import type { ProjectSpineSessionSnapshot } from '../../shared/ipc/projectSpine';
import type { RevisionCandidateV1 } from '../../shared/ipc/revisionCandidates';
import {
  NarrativeInsertionCoordinator,
  type CalculateNarrativeInsertionRequestV1,
} from '../narrativeInsertionCoordinator';

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

const sourceText = 'Before selected passage after.\n';
const draft = `---\ntitle: Unit A\n---\n${sourceText}`;

function candidate(overrides: Partial<RevisionCandidateV1> = {}): RevisionCandidateV1 {
  return {
    id: 'candidate-a',
    projectId: 'project-a',
    unitId: 'unit-a',
    sourceSnapshot: { unitId: 'unit-a', bodySha256: hash(sourceText), text: sourceText },
    sourceAnchor: {
      unitId: 'unit-a',
      selectionStart: 7,
      selectionEnd: 23,
      selectionFingerprint: hash('selected passage'),
    },
    sourceBodySha256: hash(sourceText),
    purpose: 'Clarify the passage.',
    origin: 'manual',
    provenance: { origin: 'manual', source: 'author', model: null, receipt: null },
    protection: { excluded: false, class: 'ordinary' },
    warnings: [],
    currentness: 'current',
    candidateText: 'Replacement.',
    editedCandidateText: null,
    lifecycle: 'generated',
    history: [{ id: 'event-a', lifecycle: 'generated', actor: 'author', occurredAt: '2026-09-11T00:00:00.000Z', note: null }],
    createdAt: '2026-09-11T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z',
    ...overrides,
  };
}

function snapshot(): ProjectSpineSessionSnapshot {
  return {
    schemaVersion: 1,
    role: 'writing',
    generation: 4,
    revision: 8,
    project: {
      projectId: 'project-a',
      path: 'C:/projects/project-a',
      title: 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1',
      units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 0 }],
      drafts: { 'unit-a': draft },
    },
    activeUnitId: 'unit-a',
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'clean', unitId: null, message: null },
    lastError: null,
    recovery: { status: 'none', candidates: [] },
  };
}

function request(overrides: Partial<CalculateNarrativeInsertionRequestV1> = {}): CalculateNarrativeInsertionRequestV1 {
  return {
    operationId: 'calculate-a',
    projectId: 'project-a',
    projectPath: 'C:/projects/project-a',
    generation: 4,
    candidateId: 'candidate-a',
    mode: 'accept-all',
    ...overrides,
  };
}

describe('Narrative Insertion coordinator', () => {
  it('loads the current candidate and calculates against the durable manuscript body without writing', async () => {
    const read = vi.fn().mockResolvedValue({ availability: 'ready', document: { revision: 0, candidates: [candidate()] }, message: null });
    const coordinator = new NarrativeInsertionCoordinator({
      resolveWindowRole: (id) => id === 2 ? 'command' : null,
      getWritingSnapshot: snapshot,
      repositoryFactory: () => ({ read } as never),
    });
    await expect(coordinator.calculate(2, request())).resolves.toMatchObject({
      ok: true,
      data: {
        status: 'ready',
        projectId: 'project-a',
        replacement: { sourceStart: 7, sourceEnd: 23, text: 'Replacement.' },
        acceptedResultSha256: hash('Before Replacement. after.\n'),
      },
    });
    expect(read).toHaveBeenCalledWith('project-a');
  });

  it('returns a blocked calculation for an invalid candidate selection without mutating candidate state', async () => {
    const read = vi.fn().mockResolvedValue({ availability: 'ready', document: { revision: 0, candidates: [candidate()] }, message: null });
    const coordinator = new NarrativeInsertionCoordinator({
      getWritingSnapshot: snapshot,
      repositoryFactory: () => ({ read } as never),
    });
    await expect(coordinator.calculate(0, request({
      mode: 'accept-selected-text',
      candidateSelection: { selectionStart: 0, selectionEnd: 99 },
    }))).resolves.toMatchObject({
      ok: true,
      data: { status: 'blocked', message: expect.stringContaining('selected candidate range') },
    });
  });

  it.each([
    ['wrong window', 99, request(), 'NOT_STAGE19_SURFACE'],
    ['wrong project', 2, request({ projectId: 'other-project' }), 'STALE_SESSION'],
    ['wrong generation', 2, request({ generation: 5 }), 'STALE_SESSION'],
    ['missing candidate', 2, request({ candidateId: 'missing' }), 'UNKNOWN_CANDIDATE'],
  ])('rejects %s before any insertion calculation', async (_label, senderId, value, code) => {
    const read = vi.fn().mockResolvedValue({ availability: 'ready', document: { revision: 0, candidates: [candidate()] }, message: null });
    const coordinator = new NarrativeInsertionCoordinator({
      resolveWindowRole: (id) => id === 2 ? 'command' : null,
      getWritingSnapshot: snapshot,
      repositoryFactory: () => ({ read } as never),
    });
    await expect(coordinator.calculate(senderId as number, value as CalculateNarrativeInsertionRequestV1)).resolves.toMatchObject({
      ok: false, error: { code },
    });
    if (code !== 'NOT_STAGE19_SURFACE' && code !== 'STALE_SESSION') expect(read).toHaveBeenCalled();
  });

  it('refuses stale candidates and degraded candidate storage without claiming insertion readiness', async () => {
    const staleRead = vi.fn().mockResolvedValue({ availability: 'ready', document: { revision: 1, candidates: [candidate({ currentness: 'stale', lifecycle: 'stale' })] }, message: null });
    const stale = new NarrativeInsertionCoordinator({ getWritingSnapshot: snapshot, repositoryFactory: () => ({ read: staleRead } as never) });
    await expect(stale.calculate(0, request())).resolves.toMatchObject({ ok: false, error: { code: 'STALE_CANDIDATE' } });

    const degraded = new NarrativeInsertionCoordinator({ getWritingSnapshot: snapshot, repositoryFactory: () => ({ read: vi.fn().mockResolvedValue({ availability: 'degraded', document: { revision: 0, candidates: [] }, message: 'Unreadable.' }) } as never) });
    await expect(degraded.calculate(0, request())).resolves.toMatchObject({ ok: false, error: { code: 'CANDIDATES_UNAVAILABLE' } });
  });
});
