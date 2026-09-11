import { describe, expect, it } from 'vitest';

import { buildProgram7HistoryProjection } from '../program7History';

function feedback(overrides: Record<string, unknown> = {}) {
  return {
    id: 'feedback-a', projectId: 'project-a', unitId: 'unit-a', createdAt: '2026-09-11T00:00:00.000Z', body: 'Keep this concern.', advisory: false as const, kind: 'revision_item' as const, lifecycle: 'review' as const, sourceId: 'unit-a', sourceBodyFingerprint: 'source', protection: { protected: false }, provenance: { source: 'program6_finding', origin: 'manual' }, ...overrides,
  };
}

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'candidate-a', projectId: 'project-a', unitId: 'unit-a', sourceSnapshot: { unitId: 'unit-a', bodySha256: 'body', text: 'Current' }, sourceAnchor: null, sourceBodySha256: 'body', purpose: 'Candidate', origin: 'manual' as const, provenance: { origin: 'manual' as const, source: 'author' as const, model: null, receipt: null }, protection: { excluded: false, class: 'ordinary' as const }, warnings: [], currentness: 'current' as const, candidateText: 'Candidate text', editedCandidateText: null, lifecycle: 'partially accepted' as const, history: [], createdAt: '2026-09-11T00:00:00.000Z', updatedAt: '2026-09-11T00:00:01.000Z', ...overrides,
  };
}

describe('buildProgram7HistoryProjection', () => {
  it('aggregates owner records by reference with active/history separation and evidence metadata', () => {
    const projection = buildProgram7HistoryProjection({
      feedbackItems: [feedback({ relatedRecurrenceId: 'feedback-root' }) as never],
      revisionCandidates: [candidate() as never],
    });
    expect(projection.items.map((item) => item.reference)).toEqual(['revision-candidate:candidate-a', 'feedback-note:feedback-a']);
    expect(projection.activeItems).toHaveLength(1);
    expect(projection.historyItems).toHaveLength(1);
    expect(projection.items[1]).toMatchObject({ sourceStatus: 'current', recurrenceReference: 'feedback-root', provenance: { origin: 'manual' } });
    expect(projection.items[0]).toMatchObject({ acceptance: 'partial' });
  });

  it('preserves staleness, protection, archive, branch lineage, and promotion outcome posture', () => {
    const ideaSeed = {
      id: 'seed-a', lifecycle: 'archived' as const, currentVersionId: 'seed-a-v1', versions: [{ id: 'seed-a-v1', title: 'Protected seed', body: 'hidden', kind: 'fragment' as const, provenance: { kind: 'author' as const, actor: 'author' as const, capturedAt: '2026-09-11T00:00:00.000Z', sourceReference: null, authorRequested: true }, createdAt: '2026-09-11T00:00:00.000Z', supersededAt: null }], tags: [], projectReferences: [], branchIds: [], protected: true, pinned: false, history: [],
    };
    const branch = { id: 'branch-a', name: 'Branch', posture: 'promoted' as const, seedIds: [], sourceContributions: [], premiseVersions: [{ id: 'premise-a', text: 'Premise', unresolvedAreas: [], provenance: { kind: 'author' as const, actor: 'author' as const, capturedAt: '2026-09-11T00:00:00.000Z', sourceReference: null, authorRequested: true }, createdAt: '2026-09-11T00:00:00.000Z', supersededAt: null }], currentPremiseVersionId: 'premise-a', parentBranchId: 'branch-root', lineageBranchIds: [], unknowns: [], projectReferences: [], pinned: false, history: [] };
    const promotion = { itemId: 'candidate-a', destination: 'lore' as const, status: 'deferred' as const, source: { kind: 'revision-candidate' as const, sourceId: 'candidate-a', sourceRevision: 1, sourceFingerprint: 'source', selectedTextSha256: 'text', provenance: { origin: 'local-ai' as const, sourceReference: 'candidate-a', authorRequested: true }, protection: { excluded: false, class: 'ordinary' as const } }, artifactId: null, message: 'Lore owner required.' };
    const projection = buildProgram7HistoryProjection({ ideaSeeds: [ideaSeed], ideaBranches: [branch], promotionOutcomes: [promotion] });
    expect(projection.historyItems).toHaveLength(3);
    expect(projection.items.find((item) => item.ownerKind === 'idea-seed')).toMatchObject({ protection: { protected: true }, sourceStatus: 'unavailable', lifecycle: 'archived' });
    expect(projection.items.find((item) => item.ownerKind === 'idea-branch')).toMatchObject({ recurrenceReference: 'idea-branch:branch-root', acceptance: 'complete' });
    expect(projection.items.find((item) => item.ownerKind === 'promotion')).toMatchObject({ acceptance: 'deferred', provenance: { origin: 'local-ai' } });
  });

  it('trims deterministically at the requested bound without creating another store', () => {
    const projection = buildProgram7HistoryProjection({ feedbackItems: [feedback({ id: 'feedback-b' }), feedback({ id: 'feedback-a' }), feedback({ id: 'feedback-c' })] as never[] }, 2);
    expect(projection.limit).toBe(2);
    expect(projection.totalSourceItems).toBe(3);
    expect(projection.items).toHaveLength(2);
    expect(projection.trimmedCount).toBe(1);
    expect(new Set(projection.items.map((item) => item.reference)).size).toBe(2);
  });
});
