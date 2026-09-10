import { describe, expect, it } from 'vitest';

import {
  canTransitionSignalLifecycle,
  checkStoryIntelligencePermission,
  createDefaultStoryIntelligenceDocument,
  defaultStoryIntelligencePolicy,
  deriveStoryPositionCurrentness,
  isDurableSignalLifecycle,
  isStoryPositionRefV1,
  trimStoryIntelligenceHistory,
  validateStoryIntelligenceDocument,
} from '../storyIntelligencePolicy';
import { STORY_INTELLIGENCE_HISTORY_LIMIT } from '../ipc/storyIntelligence';

const now = new Date('2026-08-31T12:00:00.000Z');

describe('story-intelligence policy contracts', () => {
  it('defaults to ask-only signals, develop posture, deterministic-only analysis, and bounded metadata retention', () => {
    const policy = defaultStoryIntelligencePolicy(now);
    const document = createDefaultStoryIntelligenceDocument('project-a', now);

    expect(policy).toMatchObject({
      signalPosture: 'ask-only',
      projectPosture: 'develop',
      deterministicEnabled: true,
      optionalInferenceEnabled: false,
      readerEffectLaneEnabled: false,
      selectedScopePolicy: 'author-selected',
      retentionPolicy: 'metadata-only-bounded',
    });
    expect(document.settings.analysisPolicy).toEqual(policy);
    expect(validateStoryIntelligenceDocument(document, 'project-a')).toEqual(document);
  });

  it('keeps evidence lanes, confidence, intensity, and currentness qualitative and distinct', () => {
    const document = createDefaultStoryIntelligenceDocument('project-a', now);
    const authorRecord = {
      recordId: 'author-record-1',
      projectId: 'project-a',
      evidenceClass: 'planned' as const,
      label: 'The reveal should arrive after the storm.',
      intensityBand: 'high' as const,
      positionRefs: [],
      provenance: {
        sourceOwner: 'author',
        origin: 'author' as const,
        visibility: 'metadata-only' as const,
        citationRequired: true,
        protectionClass: 'local-only' as const,
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const durableSignal = {
      schemaVersion: 'BlackSkiesStoryIntelligence v1' as const,
      signalId: 'signal-1',
      projectId: 'project-a',
      positionRefs: [],
      sourceOwner: 'deterministic',
      evidenceClass: 'inferred' as const,
      impact: 'attention' as const,
      confidenceBand: 'unknown' as const,
      currentness: 'trimmed' as const,
      lifecycle: 'accepted' as const,
      summary: 'A continuity check needs author review.',
      evidenceSummary: 'Metadata-only reference to the checked position.',
      provenance: {
        sourceOwner: 'deterministic',
        origin: 'deterministic' as const,
        visibility: 'metadata-only' as const,
        citationRequired: false,
        protectionClass: 'deterministic-only' as const,
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    expect(
      validateStoryIntelligenceDocument(
        {
          ...document,
          authorRecords: [authorRecord],
          durableSignals: [durableSignal],
        },
        'project-a',
      ).durableSignals[0]?.confidenceBand,
    ).toBe('unknown');
    expect(authorRecord.evidenceClass).not.toBe('inferred');
    expect(durableSignal.evidenceClass).not.toBe('reader-effect-optional');
  });

  it('rejects candidate findings from the durable document', () => {
    const document = createDefaultStoryIntelligenceDocument('project-a', now) as unknown as Record<
      string,
      unknown
    >;
    expect(() =>
      validateStoryIntelligenceDocument({ ...document, findings: [] }, 'project-a'),
    ).toThrow('document shape is not supported');
    expect(isDurableSignalLifecycle('candidate')).toBe(false);
    expect(isDurableSignalLifecycle('accepted')).toBe(true);
  });

  it('allows only explicit lifecycle transitions and never reopens terminal states', () => {
    expect(canTransitionSignalLifecycle('candidate', 'reviewed')).toBe(true);
    expect(canTransitionSignalLifecycle('candidate', 'accepted')).toBe(false);
    expect(canTransitionSignalLifecycle('reviewed', 'converted')).toBe(true);
    expect(canTransitionSignalLifecycle('accepted', 'superseded')).toBe(true);
    expect(canTransitionSignalLifecycle('suppressed', 'accepted')).toBe(true);
    for (const terminal of [
      'dismissed',
      'converted',
      'resolved',
      'expired',
      'superseded',
    ] as const) {
      expect(canTransitionSignalLifecycle(terminal, 'reviewed')).toBe(false);
      expect(canTransitionSignalLifecycle(terminal, terminal)).toBe(false);
    }
  });

  it('derives currentness from availability, revision, and fingerprint', () => {
    const reference = { sourceRevision: 4, sourceFingerprint: 'fingerprint-4' };
    expect(deriveStoryPositionCurrentness(reference, { available: true, ...reference })).toBe(
      'current',
    );
    expect(
      deriveStoryPositionCurrentness(reference, {
        available: true,
        sourceRevision: 5,
        sourceFingerprint: 'fingerprint-5',
      }),
    ).toBe('stale');
    expect(deriveStoryPositionCurrentness(reference, { available: false })).toBe('unavailable');
  });

  it('prefers an unchanged body hash over a changed session generation', () => {
    const bodySha256 = 'a'.repeat(64);
    expect(
      deriveStoryPositionCurrentness(
        { sourceRevision: 4, sourceFingerprint: 'old', bodySha256 },
        { available: true, sourceRevision: 5, sourceFingerprint: 'new', bodySha256 },
      ),
    ).toBe('current');
    expect(
      deriveStoryPositionCurrentness(
        { sourceRevision: 4, sourceFingerprint: 'old', bodySha256 },
        {
          available: true,
          sourceRevision: 5,
          sourceFingerprint: 'new',
          bodySha256: 'b'.repeat(64),
        },
      ),
    ).toBe('stale');
  });

  it('keeps prior v1 position references compatible while requiring complete exact ranges', () => {
    const legacy = {
      projectId: 'project-a',
      sourceKind: 'story-unit' as const,
      sourceId: 'unit-a',
      sourceRevision: 1,
      sourceFingerprint: 'legacy-fingerprint',
      unitId: 'unit-a',
    };
    expect(isStoryPositionRefV1(legacy, 'project-a')).toBe(true);

    const hash = 'a'.repeat(64);
    const exact = {
      ...legacy,
      selectionStart: 0,
      selectionEnd: 4,
      selectionFingerprint: hash,
      bodySha256: hash,
    };
    expect(isStoryPositionRefV1(exact, 'project-a')).toBe(true);
    expect(isStoryPositionRefV1({ ...exact, selectionStart: -1 }, 'project-a')).toBe(false);
    expect(isStoryPositionRefV1({ ...exact, selectionStart: 3, selectionEnd: 2 }, 'project-a')).toBe(false);
    expect(
      isStoryPositionRefV1({ ...exact, selectionFingerprint: 'not-a-sha256' }, 'project-a'),
    ).toBe(false);
    expect(isStoryPositionRefV1({ ...exact, bodySha256: undefined }, 'project-a')).toBe(false);
    expect(isStoryPositionRefV1({ ...legacy, selectionStart: 0, selectionEnd: 4 }, 'project-a')).toBe(false);
  });

  it('enforces protected, deterministic-only, and optional-inference boundaries', () => {
    const policy = defaultStoryIntelligencePolicy(now);
    expect(checkStoryIntelligencePermission('hidden', 'display-metadata', policy)).toMatchObject({
      allowed: true,
      metadataOnly: true,
    });
    expect(
      checkStoryIntelligencePermission('hidden', 'deterministic-analysis', policy),
    ).toMatchObject({ allowed: false, reason: 'excluded-from-analysis' });
    expect(
      checkStoryIntelligencePermission('deterministic-only', 'model-package', policy),
    ).toMatchObject({ allowed: false, reason: 'deterministic-only' });
    expect(checkStoryIntelligencePermission('included', 'model-package', policy)).toMatchObject({
      allowed: false,
      reason: 'policy-disabled',
    });
    expect(
      checkStoryIntelligencePermission('included', 'deterministic-analysis', policy),
    ).toMatchObject({ allowed: true });
  });

  it('trims history to the metadata-only retention limit', () => {
    const history = Array.from({ length: STORY_INTELLIGENCE_HISTORY_LIMIT + 3 }, (_, index) => ({
      eventId: `event-${index}`,
      projectId: 'project-a',
      eventType: 'settings-updated' as const,
      subjectId: 'settings',
      actor: 'author' as const,
      createdAt: now.toISOString(),
    }));
    const trimmed = trimStoryIntelligenceHistory(history);
    expect(trimmed).toHaveLength(STORY_INTELLIGENCE_HISTORY_LIMIT);
    expect(trimmed[0]?.eventId).toBe('event-3');
  });
});
