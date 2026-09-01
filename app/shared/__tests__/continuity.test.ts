import { describe, expect, it } from 'vitest';

import {
  CONTINUITY_ALLOWED_ACTIONS,
  CONTINUITY_SCHEMA_VERSION,
  ContinuityValidationError,
  runContinuityV1,
  validateContinuityFinding,
  type ContinuityInputV1,
  type ContinuitySourceRecordV1,
} from '../continuity';
import { createDefaultStoryIntelligenceDocument, validateStoryIntelligenceDocument } from '../storyIntelligencePolicy';

const timestamp = '2026-09-01T12:00:00.000Z';

function ref(sourceId: string, orderIndex = 1) {
  return {
    projectId: 'project-a',
    sourceKind: 'assertion' as const,
    sourceId,
    sourceRevision: 1,
    sourceFingerprint: `fingerprint-${sourceId}`,
    unitId: 'unit-a',
    orderIndex,
    orderBasis: 'story-world' as const,
  };
}

function source(sourceRef: ReturnType<typeof ref>, currentness: ContinuitySourceRecordV1['currentness'] = 'current', sourceClass: ContinuitySourceRecordV1['sourceClass'] = 'included'): ContinuitySourceRecordV1 {
  return { sourceRef, sourceClass, currentness };
}

function base(overrides: Partial<ContinuityInputV1> = {}): ContinuityInputV1 {
  const unitRef = ref('unit-a');
  return {
    schemaVersion: CONTINUITY_SCHEMA_VERSION,
    projectId: 'project-a',
    generation: 4,
    analysisId: 'analysis-1',
    projectPovExpectation: 'close-third',
    units: [{ unitId: 'unit-a', explicitPovMetadata: 'close-third', interpretationState: 'ordinary', positionRefs: [unitRef] }],
    facts: [],
    events: [],
    carryoverRequirements: [],
    causalDependencies: [],
    sourceRecords: [source(unitRef)],
    priorDecisions: [],
    createdAt: timestamp,
    ...overrides,
  };
}

describe('Continuity V1 deterministic contracts', () => {
  it('emits bounded findings for POV drift, fact contradiction, duplicate identity, omission, and causality', () => {
    const factOneRef = ref('fact-one', 2);
    const factTwoRef = ref('fact-two', 3);
    const eventOneRef = ref('event-one', 4);
    const eventTwoRef = ref('event-two', 5);
    const carryRef = ref('carryover', 6);
    const causalRef = ref('causal', 7);
    const input = base({
      units: [{ unitId: 'unit-a', explicitPovMetadata: 'first-person', interpretationState: 'ordinary', positionRefs: [ref('unit-a')] }],
      facts: [
        { factId: 'fact-one', subjectId: 'hero', attribute: 'allegiance', value: 'north', status: 'locked', interpretationState: 'ordinary', positionRefs: [factOneRef] },
        { factId: 'fact-two', subjectId: 'hero', attribute: 'allegiance', value: 'south', status: 'accepted', interpretationState: 'ordinary', positionRefs: [factTwoRef] },
      ],
      events: [
        { eventId: 'event-one', unitId: 'unit-a', stableEventIdentity: 'door-opens', interpretationState: 'ordinary', positionRefs: [eventOneRef] },
        { eventId: 'event-two', unitId: 'unit-a', stableEventIdentity: 'door-opens', interpretationState: 'ordinary', positionRefs: [eventTwoRef] },
      ],
      carryoverRequirements: [{ requirementId: 'carry-1', fromEventId: 'event-one', toUnitId: 'unit-a', requiredKey: 'wound-status', nextRecordAvailable: true, nextRecordKeys: [], interpretationState: 'ordinary', positionRefs: [carryRef] }],
      causalDependencies: [{ dependencyId: 'causal-1', eventId: 'event-two', predecessorEventId: 'missing-event', interpretationState: 'ordinary', positionRefs: [causalRef] }],
      sourceRecords: [source(ref('unit-a')), source(factOneRef), source(factTwoRef), source(eventOneRef), source(eventTwoRef), source(carryRef), source(causalRef)],
    });
    const result = runContinuityV1(input);
    expect(result.findings.map((finding) => `${finding.category}:${finding.producerId}`)).toEqual([
      'causality:missing-causal-predecessor',
      'contradiction:duplicate-event-identity',
      'contradiction:locked-fact-conflict',
      'drift:pov-mismatch',
      'omission:required-carryover',
    ]);
    expect(result.findings.every((finding) => finding.lifecycle === 'candidate' && finding.projectId === 'project-a' && finding.generation === 4)).toBe(true);
    expect(result.mutatedAuthorState).toBe(false);
  });

  it('uses stable refs only, preserves recurrence lineage, and disables durable elevation for stale evidence', () => {
    const anchor = ref('stale-anchor');
    const input = base({
      analysisId: 'analysis-repeat',
      units: [{ unitId: 'unit-a', explicitPovMetadata: 'first-person', interpretationState: 'ordinary', positionRefs: [anchor] }],
      sourceRecords: [source(anchor, 'stale')],
      priorDecisions: [{ lineageId: 'continuity:project-a:4:pov-mismatch:unit-a', priorFindingId: 'old-finding', disposition: 'dismissed' }],
    });
    const finding = runContinuityV1(input).findings.find((item) => item.producerId === 'pov-mismatch')!;
    expect(finding.recurrence).toBe('new-candidate');
    expect(finding.lineageId).toBe('continuity:project-a:4:pov-mismatch:unit-a');
    expect(finding.currentness).toBe('stale');
    expect(finding.allowedActions).not.toContain('elevate-durable-signal');
    expect(finding.evidenceSummary).not.toMatch(/\b(raw|excerpt|prose)\b/i);
    expect(validateContinuityFinding(finding, 'project-a', 4)).toEqual(finding);
  });

  it('does not collapse intentional, unreliable, disputed, hidden, or unknown states into objective errors', () => {
    const protectedRef = ref('protected');
    const input = base({
      units: [{ unitId: 'unit-a', explicitPovMetadata: 'first-person', interpretationState: 'intentional-divergence', positionRefs: [protectedRef] }],
      facts: [
        { factId: 'one', subjectId: 'hero', attribute: 'truth', value: 'a', status: 'locked', interpretationState: 'false-belief', positionRefs: [protectedRef] },
        { factId: 'two', subjectId: 'hero', attribute: 'truth', value: 'b', status: 'accepted', interpretationState: 'disputed', positionRefs: [protectedRef] },
      ],
      events: [{ eventId: 'hidden-event', unitId: 'unit-a', stableEventIdentity: 'hidden', interpretationState: 'unrevealed', positionRefs: [protectedRef] }],
      sourceRecords: [source(protectedRef, 'current', 'ai-excluded')],
    });
    const result = runContinuityV1(input);
    expect(result.findings).toEqual([]);
    expect(result.blockedSourceCount).toBeGreaterThan(0);
  });

  it('rejects malformed anchors and refuses candidate/raw fields in durable P6-A documents', () => {
    expect(() => validateContinuityFinding({ schemaVersion: CONTINUITY_SCHEMA_VERSION }, 'project-a', 4)).toThrow(ContinuityValidationError);
    expect(() => runContinuityV1({ ...base(), units: [{ ...base().units[0]!, positionRefs: [{ ...ref('bad'), sourceRevision: -1 }] }] })).toThrow(ContinuityValidationError);

    const document = createDefaultStoryIntelligenceDocument('project-a', new Date(timestamp));
    expect(() => validateStoryIntelligenceDocument({ ...document, continuityFindings: runContinuityV1(base()).findings }, 'project-a')).toThrow();
    expect(JSON.stringify(document)).not.toContain('continuityFindings');
    expect(CONTINUITY_ALLOWED_ACTIONS).toContain('save-feedback-note-candidate');
  });

  it('reports explicit stale and unavailable anchors without revealing source content', () => {
    const stale = ref('stale', 2);
    const unavailable = ref('unavailable', 3);
    const result = runContinuityV1(base({ sourceRecords: [source(stale, 'stale'), source(unavailable, 'unavailable')] }));
    expect(result.findings.map((finding) => finding.currentness)).toEqual(['stale', 'unavailable']);
    expect(result.findings.every((finding) => finding.category === 'drift')).toBe(true);
    expect(result.findings.map((finding) => finding.positionRefs[0]?.sourceId)).toEqual(['stale', 'unavailable']);
  });
});
