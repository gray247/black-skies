import { describe, expect, it, vi } from 'vitest';

import { runLocalInferenceV1, type LocalInferenceRequestV1 } from '../localInference';
import { createDefaultStoryIntelligenceDocument, defaultStoryIntelligencePolicy } from '../storyIntelligencePolicy';
import { buildProgram6ProductionProjection } from '../program6ProductionProjection';
import { runTimelineV1, type TimelineInputV1 } from '../timeline';
import type { DurableSignalV1, StoryIntelligenceAuthorRecordV1 } from '../ipc/storyIntelligence';

const CORPUS = ['Lantern House', 'Northline Letters', 'Glass Orchard'] as const;

function source(projectId: string, sourceId: string, orderIndex: number) {
  return {
    projectId,
    sourceKind: 'story-unit' as const,
    sourceId,
    sourceRevision: 1,
    sourceFingerprint: `${projectId}:${sourceId}:1`,
    unitId: sourceId,
    orderIndex,
    orderBasis: 'story-world' as const,
  };
}

function timeline(projectId: string): TimelineInputV1 {
  const first = source(projectId, 'unit-1', 1);
  const second = source(projectId, 'unit-2', 2);
  return {
    schemaVersion: 'BlackSkiesTimeline v1',
    projectId,
    generation: 1,
    analysisId: `${projectId}:timeline`,
    events: [
      { eventId: 'event-1', unitId: 'unit-1', label: 'Arrival', orders: { 'story-world': 1, manuscript: 1 }, temporalState: 'certain', positionRefs: [first] },
      { eventId: 'event-2', unitId: 'unit-2', label: 'Departure', orders: { 'story-world': 2, manuscript: 2 }, temporalState: 'certain', positionRefs: [second] },
    ],
    pacing: [],
    pressure: [],
    sourceRecords: [
      { sourceRef: first, sourceClass: 'included', currentness: 'current' },
      { sourceRef: second, sourceClass: 'included', currentness: 'current' },
    ],
    priorDecisions: [],
    createdAt: '2026-09-01T12:00:00.000Z',
  };
}

function inferenceRequest(projectId: string, sourceId: string): LocalInferenceRequestV1 {
  return {
    schemaVersion: 'BlackSkiesLocalInference v1',
    operationId: `${projectId}:inference`,
    projectId,
    operation: 'structured-story-observation',
    sources: [{ ref: source(projectId, sourceId, 1), sourceClass: 'local-only' }],
    requestedAt: '2026-09-01T12:00:00.000Z',
    manuallyRequested: true,
  };
}

describe('Program 6 complete qualification boundary', () => {
  it('resolves same-generation manuscript edits as stale while retaining exact source linkage', () => {
    const projectId = 'currentness-projection';
    const fingerprintA = 'a'.repeat(64);
    const fingerprintB = 'b'.repeat(64);
    const now = '2026-09-01T12:00:00.000Z';
    const sourceProject = (sourceFingerprint: string) => ({
      projectId,
      path: 'C:\\projects\\currentness',
      title: 'Currentness',
      schemaVersion: 'ProjectMetadataSchema v1' as const,
      units: [{ id: 'unit-1', title: 'One', displayTitle: 'One', order: 1 }],
      unitMetrics: { 'unit-1': { wordCount: 20, sentenceCount: 2, paragraphCount: 1, dialogueRatio: 0, sourceFingerprint } },
    });
    const storedRef = {
      projectId,
      sourceKind: 'story-unit' as const,
      sourceId: 'unit-1',
      sourceRevision: 1,
      sourceFingerprint: fingerprintA,
      unitId: 'unit-1',
      orderIndex: 1,
      orderBasis: 'manuscript' as const,
    };
    const signal: DurableSignalV1 = {
      schemaVersion: 'BlackSkiesStoryIntelligence v1', signalId: 'signal-1', projectId,
      positionRefs: [storedRef], sourceOwner: 'test', evidenceClass: 'observed', impact: 'attention',
      confidenceBand: 'medium', currentness: 'current', lifecycle: 'reviewed',
      summary: 'A source-linked signal.', evidenceSummary: 'Review the source.',
      provenance: { sourceOwner: 'test', origin: 'deterministic', visibility: 'included', citationRequired: true, protectionClass: 'included' },
      createdAt: now, updatedAt: now,
    };
    const authorRecord: StoryIntelligenceAuthorRecordV1 = {
      recordId: 'emotion-1', projectId, unitId: 'unit-1', evidenceClass: 'observed', label: 'tension',
      recordKind: 'emotion-graph', emotionLane: 'observed', emotionIntensity: 'medium', currentness: 'current',
      positionRefs: [{ ...storedRef, sourceKind: 'manuscript' }], provenance: { sourceOwner: 'test', origin: 'author', visibility: 'included', citationRequired: true, protectionClass: 'included' },
      createdAt: now, updatedAt: now,
    };
    const document = { ...createDefaultStoryIntelligenceDocument(projectId, new Date(now)), authorRecords: [authorRecord], durableSignals: [signal] };
    const current = buildProgram6ProductionProjection({ project: sourceProject(fingerprintA), generation: 1, document });
    const stale = buildProgram6ProductionProjection({ project: sourceProject(fingerprintB), generation: 1, document });

    expect(current.timeline.pacing[0]?.positionRefs[0]).toEqual(storedRef);
    expect(current.signals[0]).toMatchObject({ currentness: 'current', positionRefs: [storedRef] });
    expect(stale.signals[0]).toMatchObject({ currentness: 'stale', positionRefs: [storedRef] });
    expect(stale.emotion.orderedPoints[0]?.point.currentness).toBe('stale');
    expect(stale.timeline.pacing).toEqual([]);
    expect(stale.timeline.blockedSourceCount).toBeGreaterThan(0);
  });

  it('keeps protected manuscript sources blocked and redacted at the production boundary', () => {
    const projectId = 'protected-projection';
    const fingerprint = 'c'.repeat(64);
    const now = '2026-09-01T12:00:00.000Z';
    const ref = { projectId, sourceKind: 'story-unit' as const, sourceId: 'unit-1', sourceRevision: 1, sourceFingerprint: fingerprint, unitId: 'unit-1', orderIndex: 1, orderBasis: 'manuscript' as const };
    const signal: DurableSignalV1 = {
      schemaVersion: 'BlackSkiesStoryIntelligence v1', signalId: 'protected-signal', projectId, positionRefs: [ref],
      sourceOwner: 'protected test', evidenceClass: 'observed', impact: 'urgent', confidenceBand: 'high', currentness: 'current', lifecycle: 'reviewed',
      summary: 'PROTECTED SUMMARY MUST NOT APPEAR', evidenceSummary: 'PROTECTED PROSE MUST NOT APPEAR',
      provenance: { sourceOwner: 'protected test', origin: 'deterministic', visibility: 'metadata-only', citationRequired: true, protectionClass: 'protected' },
      createdAt: now, updatedAt: now,
    };
    const projection = buildProgram6ProductionProjection({
      generation: 1,
      document: { ...createDefaultStoryIntelligenceDocument(projectId, new Date(now)), durableSignals: [signal] },
      project: { projectId, path: 'C:\\projects\\protected', title: 'Protected', schemaVersion: 'ProjectMetadataSchema v1', units: [{ id: 'unit-1', title: 'One', displayTitle: 'One', order: 1 }], unitMetrics: { 'unit-1': { wordCount: 10, sentenceCount: 1, paragraphCount: 1, dialogueRatio: 0, sourceFingerprint: fingerprint } } },
    });

    expect(projection.timeline.pacing).toEqual([]);
    expect(projection.timeline.blockedSourceCount).toBeGreaterThan(0);
    expect(projection.continuity.findings).toEqual([]);
    expect(projection.signals[0]).toMatchObject({ positionRefs: [ref], provenance: { protectionClass: 'protected' } });
  });

  it('never manufactures chronology, pacing intent, or pressure from unit position', () => {
    const projectId = 'honest-projection';
    const document = createDefaultStoryIntelligenceDocument(projectId, new Date('2026-09-01T12:00:00.000Z'));
    const result = buildProgram6ProductionProjection({
      generation: 1,
      document,
      project: {
        projectId,
        path: 'C:\\projects\\honest',
        title: 'Honest projection',
        schemaVersion: 'ProjectMetadataSchema v1',
        units: [
          { id: 'unit-1', title: 'One', displayTitle: 'One', order: 1 },
          { id: 'unit-2', title: 'Two', displayTitle: 'Two', order: 2 },
        ],
        unitMetrics: {
          'unit-1': { wordCount: 100, sentenceCount: 5, paragraphCount: 2, dialogueRatio: 0.25 },
          'unit-2': { wordCount: 200, sentenceCount: 8, paragraphCount: 4, dialogueRatio: 0.5 },
        },
      },
    });

    expect(result.timeline.chronology).toEqual([]);
    expect(result.timeline.pressure).toEqual([]);
    expect(result.timeline.pacing).toEqual([
      expect.objectContaining({ unitId: 'unit-1', observedWordCount: 100, plannedTempo: undefined }),
      expect.objectContaining({ unitId: 'unit-2', observedWordCount: 200, plannedTempo: undefined }),
    ]);
  });

  it('runs the deterministic lane independently for all three synthetic review projects', () => {
    for (const project of CORPUS) {
      const result = runTimelineV1(timeline(project));
      expect(result).toMatchObject({
        projectId: project,
        advisoryOnly: true,
        universalPressureScore: null,
        mutatedAuthorState: false,
      });
      expect(result.chronology).toHaveLength(2);
    }
  });

  it('keeps project binding and deterministic/optional lanes separate', async () => {
    const transport = { request: vi.fn().mockResolvedValue({ summary: 'Temporary observation' }) };
    const enabledPolicy = { ...defaultStoryIntelligencePolicy(), optionalInferenceEnabled: true };
    const local = await runLocalInferenceV1(inferenceRequest('Lantern House', 'unit-1'), {
      policy: enabledPolicy,
      endpoint: { origin: 'http://127.0.0.1:11434', modelId: 'qualification-local' },
      transport,
    });
    const mismatched = await runLocalInferenceV1({
      ...inferenceRequest('Glass Orchard', 'unit-1'),
      sources: [{ ref: source('Lantern House', 'unit-1', 1), sourceClass: 'local-only' }],
    }, {
      policy: enabledPolicy,
      endpoint: { origin: 'http://127.0.0.1:11434', modelId: 'qualification-local' },
      transport,
    });
    expect(local).toMatchObject({ ok: true });
    expect(mismatched).toMatchObject({ ok: false, code: 'INVALID_REQUEST' });
    expect(transport.request).toHaveBeenCalledTimes(1);
  });

  it('proves degraded/stale/protected evidence is blocked without source-content leakage', () => {
    const input = timeline('Lantern House');
    const result = runTimelineV1({
      ...input,
      sourceRecords: input.sourceRecords.map((record) => ({
        ...record,
        sourceClass: 'protected' as const,
        currentness: 'stale' as const,
      })),
    });
    expect(result.blockedSourceCount).toBe(2);
    expect(result.findings).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain('Arrival');
    expect(JSON.stringify(result)).not.toContain('Departure');
  });

  it('keeps the AI-disabled default explicit and does not call a transport', async () => {
    const transport = { request: vi.fn() };
    const result = await runLocalInferenceV1(inferenceRequest('Northline Letters', 'unit-1'), {
      policy: defaultStoryIntelligencePolicy(),
      endpoint: { origin: 'http://localhost:11434', modelId: 'qualification-local' },
      transport,
    });
    expect(result).toMatchObject({ ok: false, code: 'POLICY_DISABLED' });
    expect(transport.request).not.toHaveBeenCalled();
  });
});
