import { describe, expect, it, vi } from 'vitest';

import { runLocalInferenceV1, type LocalInferenceRequestV1 } from '../localInference';
import { defaultStoryIntelligencePolicy } from '../storyIntelligencePolicy';
import { runTimelineV1, type TimelineInputV1 } from '../timeline';

const CORPUS = ['Lantern House', 'Glass Orchard', 'The Long Return'] as const;

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
    const result = await runLocalInferenceV1(inferenceRequest('The Long Return', 'unit-1'), {
      policy: defaultStoryIntelligencePolicy(),
      endpoint: { origin: 'http://localhost:11434', modelId: 'qualification-local' },
      transport,
    });
    expect(result).toMatchObject({ ok: false, code: 'POLICY_DISABLED' });
    expect(transport.request).not.toHaveBeenCalled();
  });
});
