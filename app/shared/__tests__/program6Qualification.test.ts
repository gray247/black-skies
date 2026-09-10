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
  it('redacts protected signal content at the projection boundary while preserving ordinary signals', () => {
    const projectId = 'currentness-after-save';
    const previousFingerprint = 'a'.repeat(64);
    const currentFingerprint = 'b'.repeat(64);
    const previousRef = { ...source(projectId, 'unit-1', 1), sourceKind: 'manuscript' as const, sourceFingerprint: previousFingerprint };
    const now = '2026-09-04T12:00:00.000Z';
    const provenance = {
      sourceOwner: 'Author',
      origin: 'author' as const,
      visibility: 'metadata-only' as const,
      citationRequired: true,
      protectionClass: 'included' as const,
    };
    const record = (overrides: Partial<StoryIntelligenceAuthorRecordV1>): StoryIntelligenceAuthorRecordV1 => ({
      recordId: `${projectId}:${overrides.recordKind ?? 'emotion-graph'}`,
      projectId,
      unitId: 'unit-1',
      evidenceClass: 'observed',
      label: 'Author observation',
      recordKind: 'emotion-graph',
      emotionLane: 'observed',
      emotionIntensity: 'medium',
      currentness: 'current',
      positionRefs: [previousRef],
      provenance,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
    const document = {
      ...createDefaultStoryIntelligenceDocument(projectId, new Date(now)),
      authorRecords: [
        record({}),
        record({ recordId: `${projectId}:timeline`, label: 'Arrival', recordKind: 'timeline-event', emotionLane: undefined, emotionIntensity: undefined, timelineWorldOrder: 1, timelineTemporalState: 'certain' }),
        record({ recordId: `${projectId}:pacing`, label: 'Steady', recordKind: 'pacing-intent', emotionLane: undefined, emotionIntensity: undefined, pacingTempo: 'steady' }),
        record({ recordId: `${projectId}:pressure`, label: 'Urgency', recordKind: 'pressure-point', emotionLane: undefined, emotionIntensity: undefined, pressureDimension: 'urgency', pressureBand: 'high' }),
      ],
    };
    const project = {
      projectId,
      path: 'C:\\projects\\currentness-after-save',
      title: 'Currentness',
      schemaVersion: 'ProjectMetadataSchema v1' as const,
      units: [{ id: 'unit-1', title: 'Unit 1', displayTitle: 'Unit 1', order: 1 }],
      unitMetrics: { 'unit-1': { wordCount: 4, sentenceCount: 1, paragraphCount: 1, dialogueRatio: 0, bodySha256: currentFingerprint } },
    };
    const protectedSignal: DurableSignalV1 = {
      schemaVersion: 'BlackSkiesStoryIntelligence v1',
      signalId: `${projectId}:protected`,
      projectId,
      positionRefs: [previousRef],
      sourceOwner: 'Author protection',
      evidenceClass: 'observed',
      impact: 'attention',
      confidenceBand: 'medium',
      currentness: 'current',
      lifecycle: 'reviewed',
      summary: 'P6_PROTECTED_SUMMARY_SENTINEL_7F3A',
      evidenceSummary: 'P6_PROTECTED_EVIDENCE_SENTINEL_7F3A',
      provenance: { sourceOwner: 'Author protection', origin: 'author', visibility: 'metadata-only', citationRequired: true, protectionClass: 'protected' },
      createdAt: now,
      updatedAt: now,
    };
    const ordinarySignal: DurableSignalV1 = {
      ...protectedSignal,
      signalId: `${projectId}:ordinary`,
      summary: 'P6_ORDINARY_SUMMARY_SENTINEL_7F3A',
      evidenceSummary: 'P6_ORDINARY_EVIDENCE_SENTINEL_7F3A',
      provenance: { ...protectedSignal.provenance, protectionClass: 'included' },
    };
    const result = buildProgram6ProductionProjection({
      project,
      generation: 1,
      document: { ...document, durableSignals: [protectedSignal, ordinarySignal] },
    });
    expect(result.emotion.orderedPoints[0]?.point).toMatchObject({ currentness: 'stale', positionRefs: [previousRef] });
    expect(result.signals[0]).toMatchObject({
      currentness: 'stale',
      positionRefs: [previousRef],
      provenance: { protectionClass: 'protected' },
      summary: 'Protected signal metadata',
      evidenceSummary: 'Protected content is excluded from this production projection.',
    });
    expect(result.signals[1]).toMatchObject({
      signalId: `${projectId}:ordinary`,
      summary: 'P6_ORDINARY_SUMMARY_SENTINEL_7F3A',
      evidenceSummary: 'P6_ORDINARY_EVIDENCE_SENTINEL_7F3A',
      provenance: { protectionClass: 'included' },
    });
    const serializedProjection = JSON.stringify(result);
    expect(serializedProjection).not.toContain('P6_PROTECTED_SUMMARY_SENTINEL_7F3A');
    expect(serializedProjection).not.toContain('P6_PROTECTED_EVIDENCE_SENTINEL_7F3A');
    expect(serializedProjection).toContain('P6_ORDINARY_SUMMARY_SENTINEL_7F3A');
    expect(serializedProjection).toContain('P6_ORDINARY_EVIDENCE_SENTINEL_7F3A');
    expect(result.timeline.chronology).toEqual([]);
    expect(result.timeline.pacing).toEqual([]);
    expect(result.timeline.pressure).toEqual([]);
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
