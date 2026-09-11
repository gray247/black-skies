import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  AUTOMATIC_STORY_INTELLIGENCE_LENSES, AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
  isAutomaticStoryIntelligenceRunStateV1, replaceAutomaticStoryIntelligenceRunStateV1,
  analyzeAutomaticStoryIntelligence,
  validateAutomaticStoryIntelligenceAnalysisV1, validateAutomaticStoryIntelligenceRunRequestV1,
  type AutomaticStoryIntelligenceAnalysisV1, type AutomaticStoryIntelligenceRunStateV1,
} from '../ipc/automaticStoryIntelligence';

const hash = 'a'.repeat(64); const now = '2026-09-10T12:00:00.000Z';
function ref(unitId = 'unit-a', orderIndex = 0) {
  return { projectId: 'project-a', sourceKind: 'manuscript' as const, sourceId: unitId, sourceRevision: 4,
    sourceFingerprint: `fingerprint-${unitId}`, unitId, selectionStart: 0, selectionEnd: 4,
    selectionFingerprint: hash, bodySha256: hash, orderIndex, orderBasis: 'manuscript' as const };
}
function request() {
  return { schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION, projectId: 'project-a', generation: 4,
    runId: 'run-1', analysisId: 'analysis-1', requestedAt: now, origin: 'deterministic' as const,
    lenses: [...AUTOMATIC_STORY_INTELLIGENCE_LENSES], units: [{ unitId: 'unit-a', orderIndex: 0,
      orderBasis: 'manuscript' as const, body: 'Saved body', bodySha256: hash, protectionClass: 'included' as const,
      enabled: true as const, sourceRef: ref(), anchor: { unitId: 'unit-a', selectionStart: 0, selectionEnd: 4,
        selectionFingerprint: hash, bodySha256: hash, orderIndex: 0, orderBasis: 'manuscript' as const } }],
    excludedUnits: [{ unitId: 'excluded', orderIndex: 1, orderBasis: 'manuscript' as const,
      protectionClass: 'ai-excluded' as const, exclusionReason: 'protected' as const }] };
}
function finding(lens: (typeof AUTOMATIC_STORY_INTELLIGENCE_LENSES)[number], analysisId = 'analysis-1') {
  return { schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION, findingId: `finding-${lens}`, projectId: 'project-a', analysisId,
    lens, summary: `${lens} note`, evidenceClass: 'observed' as const, confidenceBand: 'medium' as const,
    uncertainty: 'low' as const, evidenceSummary: 'Saved evidence', positionRefs: [ref()],
    provenance: { sourceOwner: 'automatic', origin: 'deterministic' as const, visibility: 'included' as const,
      citationRequired: true, protectionClass: 'included' as const }, temporary: true as const, durableTruthMutation: false as const };
}
function analysis(runId = 'run-1'): AutomaticStoryIntelligenceAnalysisV1 {
  return { schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION, projectId: 'project-a', generation: 4, runId,
    analysisId: 'analysis-1', origin: 'deterministic', lenses: [...AUTOMATIC_STORY_INTELLIGENCE_LENSES], includedUnitCount: 1,
    excludedUnitCount: 1, findingCount: 6, excludedUnits: request().excludedUnits,
    lensResults: AUTOMATIC_STORY_INTELLIGENCE_LENSES.map((lens) => ({ lens, findings: [finding(lens)] })),
    temporary: true, durableTruthMutation: false, createdAt: now };
}
function state(status: AutomaticStoryIntelligenceRunStateV1['status'] = 'completed', runId = 'run-1') {
  const done = status === 'completed';
  return { schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION, projectId: 'project-a', runId, analysisId: 'analysis-1',
    origin: 'deterministic' as const, status, requestedAt: now, updatedAt: now,
    progress: { runId, analysisId: 'analysis-1', status, processedUnitCount: done ? 1 : 0, totalUnitCount: 2,
      includedUnitCount: 1, excludedUnitCount: 1, findingCount: done ? 6 : 0, currentLens: done ? 'signals' as const : null },
    analysis: done ? analysis(runId) : null, error: done ? null : { code: status as 'failed' | 'cancelled' | 'stale', message: 'stopped' },
    terminalAt: done ? now : now, temporary: true as const, durableTruthMutation: false as const } as AutomaticStoryIntelligenceRunStateV1;
}

describe('automatic whole-manuscript Story Intelligence contracts', () => {
  it('validates binding, saved source body, all six lenses, and exact anchors', () => {
    expect(validateAutomaticStoryIntelligenceRunRequestV1(request()).units[0]?.enabled).toBe(true);
    expect(validateAutomaticStoryIntelligenceAnalysisV1(analysis()).lensResults.map((x) => x.lens)).toEqual(AUTOMATIC_STORY_INTELLIGENCE_LENSES);
  });
  it('rejects malformed shapes, incomplete anchors, duplicate metadata, and bounds violations', () => {
    expect(() => validateAutomaticStoryIntelligenceRunRequestV1({ ...request(), extra: true })).toThrow();
    expect(() => validateAutomaticStoryIntelligenceRunRequestV1({ ...request(), units: [{ ...request().units[0], body: 'x'.repeat(500_001) }] })).toThrow();
    expect(() => validateAutomaticStoryIntelligenceRunRequestV1({ ...request(), units: [{ ...request().units[0], sourceRef: { ...ref(), selectionStart: undefined } }] })).toThrow();
    expect(() => validateAutomaticStoryIntelligenceRunRequestV1({ ...request(), excludedUnits: [request().excludedUnits[0], request().excludedUnits[0]] })).toThrow();
  });
  it('retains excluded units as metadata only and blocks excluded evidence', () => {
    expect(request().excludedUnits[0]).not.toHaveProperty('body');
    expect(() => validateAutomaticStoryIntelligenceRunRequestV1({ ...request(), units: [{ ...request().units[0], protectionClass: 'ai-excluded' as const }] })).toThrow();
    expect(() => validateAutomaticStoryIntelligenceAnalysisV1({ ...analysis(), lensResults: [{ lens: 'emotion', findings: [{ ...finding('emotion'), positionRefs: [ref('excluded', 1)] }] }] } as unknown as AutomaticStoryIntelligenceAnalysisV1)).toThrow();
  });
  it('accepts deterministic and injectable local-inference origins without model admission', () => {
    expect(validateAutomaticStoryIntelligenceRunRequestV1({ ...request(), origin: 'local-inference' as const }).origin).toBe('local-inference');
    expect(() => validateAutomaticStoryIntelligenceRunRequestV1({ ...request(), model: 'not-admitted' })).toThrow();
  });
  it('replaces only completed reruns; failed and cancelled results do not replace', () => {
    const previous = state(); expect(isAutomaticStoryIntelligenceRunStateV1(previous)).toBe(true);
    expect(replaceAutomaticStoryIntelligenceRunStateV1(previous, state('completed', 'run-2'))?.runId).toBe('run-2');
    expect(replaceAutomaticStoryIntelligenceRunStateV1(previous, state('failed', 'run-3'))).toBe(previous);
    expect(replaceAutomaticStoryIntelligenceRunStateV1(previous, state('cancelled', 'run-4'))).toBe(previous);
  });
  it('scans every lens and returns exact saved-prose coordinates without durable mutation', async () => {
    const body = 'She felt fear in the dark. TODO: check the timeline. The threat was immediate.';
    const bodyHash = createHash('sha256').update(body).digest('hex');
    const analyzed = await analyzeAutomaticStoryIntelligence({
      ...request(),
      units: [{
        ...request().units[0],
        body,
        bodySha256: bodyHash,
        sourceRef: { ...request().units[0].sourceRef, sourceFingerprint: bodyHash, bodySha256: bodyHash },
        anchor: { ...request().units[0].anchor, bodySha256: bodyHash },
      }],
    }, {
      sha256: (value) => createHash('sha256').update(value).digest('hex'),
    });
    expect(analyzed.lensResults).toHaveLength(6);
    expect(analyzed.findingCount).toBeGreaterThanOrEqual(4);
    const finding = analyzed.lensResults.flatMap((result) => result.findings).find((candidate) => candidate.lens === 'emotion');
    expect(finding?.positionRefs[0]?.selectionStart).toBe(body.indexOf('fear'));
    expect(finding?.positionRefs[0]?.selectionEnd).toBe(body.indexOf('fear') + 'fear'.length);
    expect(finding?.temporary).toBe(true);
    expect(analyzed.durableTruthMutation).toBe(false);
  });
});
