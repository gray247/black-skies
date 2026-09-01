import { describe, expect, it } from 'vitest';
import { runTimelineV1, TimelineValidationError, type TimelineInputV1 } from '../timeline';

const ref = (sourceId: string, orderIndex: number, orderBasis: 'manuscript' | 'story-world' = 'manuscript') => ({
  projectId: 'project-a', sourceKind: 'manuscript' as const, sourceId, sourceRevision: 1,
  sourceFingerprint: `fingerprint-${sourceId}`, unitId: sourceId, orderIndex, orderBasis,
});
const input = (overrides: Record<string, unknown> = {}): TimelineInputV1 => ({
  schemaVersion: 'BlackSkiesTimeline v1', projectId: 'project-a', generation: 1, analysisId: 'timeline-1',
  events: [
    { eventId: 'event-a', unitId: 'unit-a', label: 'Arrival', orders: { manuscript: 1, 'story-world': 2 }, temporalState: 'certain', positionRefs: [ref('unit-a', 1)] },
    { eventId: 'event-b', unitId: 'unit-b', label: 'Departure', orders: { manuscript: 2, 'story-world': 1 }, temporalState: 'uncertain', positionRefs: [ref('unit-b', 2)] },
  ], pacing: [{ unitId: 'unit-a', plannedTempo: 'steady', observedTempo: 'slow', plannedDurationUnits: 2, observedDurationUnits: 3, positionRefs: [ref('unit-a', 1)] }],
  pressure: [
    { eventId: 'event-a', dimension: 'urgency', band: 'high', positionRefs: [ref('unit-a', 1)] },
    { eventId: 'event-a', dimension: 'consequence', band: 'medium', positionRefs: [ref('unit-a', 1)] },
  ], sourceRecords: [
    { sourceRef: ref('unit-a', 1), sourceClass: 'included', currentness: 'current' },
    { sourceRef: ref('unit-b', 2), sourceClass: 'deterministic-only', currentness: 'current' },
  ], priorDecisions: [], createdAt: '2026-09-01T12:00:00.000Z', ...overrides,
} as TimelineInputV1);

describe('Timeline V1', () => {
  it('keeps distinct order bases and emits an advisory chronology review', () => {
    const result = runTimelineV1(input());
    expect(result.chronology[0]?.orders).toEqual({ manuscript: 1, 'story-world': 2 });
    expect(result.findings.map((item) => item.category)).toContain('chronology-review');
    expect(result.findings[0]?.impact).toBe('attention');
  });

  it('compares planned and observed pacing without calling it a defect', () => {
    const result = runTimelineV1(input());
    const comparison = result.pacing[0]!;
    expect(comparison.direction).toBe('slower-than-planned');
    expect(comparison.isReviewOpportunity).toBe(true);
    expect(result.findings.find((item) => item.category === 'pacing-review')?.evidenceClass).toBe('planned');
  });

  it('keeps pressure dimensions separate and refuses a universal score', () => {
    const result = runTimelineV1(input());
    expect(result.pressure[0]?.dimensions).toEqual({ urgency: 'high', consequence: 'medium' });
    expect(result.pressure[0]?.universalScore).toBeNull();
    expect(result.universalPressureScore).toBeNull();
  });

  it('blocks protected or stale source references without leaking content', () => {
    const result = runTimelineV1(input({ sourceRecords: [{ sourceRef: ref('unit-a', 1), sourceClass: 'protected', currentness: 'current' }, { sourceRef: ref('unit-b', 2), sourceClass: 'included', currentness: 'stale' }] }));
    expect(result.blockedSourceCount).toBeGreaterThan(0);
    expect(result.findings).toHaveLength(0);
    expect(result.chronology).toHaveLength(0);
  });

  it('retains uncertainty and supports recurrence lineage without mutation', () => {
    const result = runTimelineV1(input({ priorDecisions: [{ lineageId: 'timeline:chronology-review:event-a:event-b', priorFindingId: 'old', disposition: 'intentional' }] }));
    expect(result.chronology[1]?.temporalState).toBe('uncertain');
    expect(result.findings[0]?.recurrence).toBe('new-candidate');
    expect(result.mutatedAuthorState).toBe(false);
  });

  it('fails closed on invalid schema and unknown order bases', () => {
    expect(() => runTimelineV1(input({ schemaVersion: 'wrong' }))).toThrow(TimelineValidationError);
    expect(() => runTimelineV1(input({ events: [{ ...input().events[0], orders: { mystery: 1 } }] }))).toThrow(TimelineValidationError);
  });
});
