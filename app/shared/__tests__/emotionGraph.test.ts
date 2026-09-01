import { describe, expect, it } from 'vitest';

import {
  EMOTION_GRAPH_INTENSITIES_V1,
  compareEmotionGraphPoints,
  createEmotionGraphProjection,
  deriveEmotionGraphMovement,
  emotionGraphPointFromAuthorRecord,
  emotionGraphPointToAuthorRecord,
  resolveEmotionGraphPointCurrentness,
  selectEmotionGraphPoint,
  selectEmotionGraphPoints,
  validateEmotionGraphCandidatePoint,
  validateEmotionGraphPoint,
  type EmotionGraphCandidatePointV1,
  type EmotionGraphPointV1,
} from '../emotionGraph';
import { createDefaultStoryIntelligenceDocument, validateStoryIntelligenceDocument } from '../storyIntelligencePolicy';

const timestamp = '2026-08-31T12:00:00.000Z';

function position(sourceKind: 'manuscript' | 'assertion' | 'outline' | 'story-unit' | 'author-intent', orderIndex: number, subject = 'A'): EmotionGraphPointV1['positionRefs'][number] {
  return {
    projectId: 'project-a',
    sourceKind,
    sourceId: `${sourceKind}-${orderIndex}-${subject}`,
    sourceRevision: 1,
    sourceFingerprint: `fingerprint-${orderIndex}-${subject}`,
    unitId: `unit-${subject}`,
    orderIndex,
    orderBasis: sourceKind === 'manuscript' ? 'manuscript' : 'planning',
  };
}

function point(
  pointId: string,
  lane: EmotionGraphPointV1['lane'],
  intensity: EmotionGraphPointV1['intensity'],
  sourceKind: 'manuscript' | 'assertion' | 'outline' | 'story-unit' | 'author-intent',
  orderIndex: number,
  emotionLabel = 'guarded',
  subjectLabel?: string,
): EmotionGraphPointV1 {
  return {
    schemaVersion: 'BlackSkiesEmotionGraph v1',
    pointId,
    projectId: 'project-a',
    lane,
    emotionLabel,
    intensity,
    ...(subjectLabel === undefined ? {} : { subjectLabel }),
    positionRefs: [position(sourceKind, orderIndex, subjectLabel)],
    sourceOwner: lane === 'observed' ? 'Narrative Insertion / Assertion' : 'Author Intent / Story Setup',
    provenance: {
      sourceOwner: lane === 'observed' ? 'Narrative Insertion / Assertion' : 'Author Intent / Story Setup',
      origin: 'author',
      visibility: 'metadata-only',
      citationRequired: true,
      protectionClass: 'included',
    },
    currentness: 'current',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('Emotion Graph deterministic contracts', () => {
  it('validates flexible labels, all qualitative intensity bands, source lanes, and no universal taxonomy', () => {
    for (const [index, intensity] of EMOTION_GRAPH_INTENSITIES_V1.entries()) {
      const sourceKind = intensity === 'unknown' ? 'assertion' : 'manuscript';
      const value = validateEmotionGraphPoint(point(`observed-${index}`, 'observed', intensity, sourceKind, index + 1, `author-label-${index}`), 'project-a');
      expect(value.intensity).toBe(intensity);
      expect(value.emotionLabel).toBe(`author-label-${index}`);
    }
    expect(() => validateEmotionGraphPoint({ ...point('bad', 'observed', 'medium', 'outline', 1), emotionLabel: ' ' }, 'project-a')).toThrow();
    expect(() => validateEmotionGraphPoint(point('wrong-source', 'observed', 'medium', 'outline', 1), 'project-a')).toThrow();
    expect(() => validateEmotionGraphPoint(point('wrong-source', 'planned', 'medium', 'manuscript', 1), 'project-a')).toThrow();
  });

  it('extends P6-A author records compatibly and keeps reader effect separate from character emotion', () => {
    const planned = point('planned-1', 'planned', 'high', 'outline', 1);
    const readerEffect = point('reader-1', 'reader-effect-optional', 'unknown', 'author-intent', 1, 'uneasy', undefined);
    const document = createDefaultStoryIntelligenceDocument('project-a', new Date(timestamp));
    const extended = {
      ...document,
      authorRecords: [emotionGraphPointToAuthorRecord(planned), emotionGraphPointToAuthorRecord(readerEffect)],
    };
    expect(validateStoryIntelligenceDocument(extended, 'project-a').authorRecords).toHaveLength(2);
    expect(emotionGraphPointFromAuthorRecord(extended.authorRecords[0]!)).toMatchObject({ lane: 'planned', intensity: 'high' });
    expect(emotionGraphPointFromAuthorRecord(extended.authorRecords[1]!)).toMatchObject({ lane: 'reader-effect-optional', intensity: 'unknown' });
    expect(JSON.stringify(extended)).not.toContain('candidate');
  });

  it('rejects inferred durable points and excluded sources while allowing deterministic-only local analysis', () => {
    const candidate: EmotionGraphCandidatePointV1 = {
      schemaVersion: 'BlackSkiesEmotionGraph v1',
      candidateId: 'candidate-1',
      projectId: 'project-a',
      lane: 'inferred',
      emotionLabel: 'uncertain',
      intensity: 'unknown',
      positionRefs: [position('manuscript', 1)],
      sourceOwner: 'deterministic',
      provenance: { sourceOwner: 'deterministic', origin: 'deterministic', visibility: 'metadata-only', citationRequired: false, protectionClass: 'deterministic-only' },
      currentness: 'current',
      temporary: true,
      createdAt: timestamp,
    };
    expect(validateEmotionGraphCandidatePoint(candidate, 'project-a')).toEqual(candidate);
    expect(() => validateEmotionGraphPoint(candidate as unknown as EmotionGraphPointV1, 'project-a')).toThrow();
    expect(() => validateEmotionGraphPoint({ ...point('excluded', 'observed', 'medium', 'manuscript', 1), provenance: { ...point('x', 'observed', 'medium', 'manuscript', 1).provenance, protectionClass: 'ai-excluded' } }, 'project-a')).toThrow();
  });

  it('resolves stale and unavailable references without reconstructing source state', () => {
    const original = point('observed-1', 'observed', 'medium', 'manuscript', 1);
    expect(resolveEmotionGraphPointCurrentness(original, () => ({ available: true, sourceRevision: 2, sourceFingerprint: 'changed' })).currentness).toBe('stale');
    expect(resolveEmotionGraphPointCurrentness(original, () => ({ available: false })).currentness).toBe('unavailable');
  });

  it('orders by stable source position rather than chronology and derives qualitative movement', () => {
    const early = point('early', 'observed', 'low', 'manuscript', 2, 'guarded');
    const late = point('late', 'observed', 'high', 'manuscript', 10, 'guarded');
    const projection = createEmotionGraphProjection('project-a', [late, early]);
    expect(projection.orderedPoints.map(({ point: value }) => 'pointId' in value ? value.pointId : value.candidateId)).toEqual(['early', 'late']);
    expect(projection.movements[0]).toMatchObject({ direction: 'rising', fromPointId: 'early', toPointId: 'late' });
    expect(deriveEmotionGraphMovement(early, { ...late, emotionLabel: 'relieved' }, 1, 2).direction).toBe('changed-label');
    expect(deriveEmotionGraphMovement(early, { ...late, intensity: 'unknown' }, 1, 2).direction).toBe('unknown');
    expect(deriveEmotionGraphMovement(early, { ...late, intensity: 'low' }, 1, 2).direction).toBe('steady');
  });

  it('compares planned and observed positions as agreement, divergence, or not-comparable', () => {
    const planned = point('planned', 'planned', 'high', 'outline', 3, 'guarded');
    const observed = point('observed', 'observed', 'medium', 'manuscript', 3, 'relieved');
    expect(compareEmotionGraphPoints(planned, observed)).toMatchObject({ comparable: true, difference: 'divergence' });
    expect(compareEmotionGraphPoints(planned, { ...observed, emotionLabel: 'guarded', intensity: 'high' })).toMatchObject({ difference: 'agreement' });
    expect(compareEmotionGraphPoints(planned, { ...observed, positionRefs: [position('manuscript', 99, 'B')] })).toMatchObject({ comparable: false, difference: 'not-comparable' });
  });

  it('keeps default observed/ planned visibility, hides reader effect and candidates, and supports filtering', () => {
    const points = [
      point('observed-a', 'observed', 'medium', 'manuscript', 1, 'guarded', 'A'),
      point('planned-a', 'planned', 'high', 'outline', 1, 'relieved', 'A'),
      point('reader-a', 'reader-effect-optional', 'unknown', 'author-intent', 1, 'uneasy', 'A'),
      point('observed-b', 'observed', 'low', 'manuscript', 2, 'tender', 'B'),
    ];
    const { pointId: _pointId, updatedAt: _updatedAt, ...candidateBase } = points[0]!;
    const candidate = { ...candidateBase, candidateId: 'candidate', lane: 'inferred' as const, temporary: true, provenance: { ...points[0]!.provenance, origin: 'deterministic' as const }, createdAt: timestamp } as unknown as EmotionGraphCandidatePointV1;
    const projection = createEmotionGraphProjection('project-a', points, [candidate]);
    expect(projection.visiblePoints.map(({ point: value }) => value.lane)).toEqual(['observed', 'planned']);
    expect(selectEmotionGraphPoints(points, { showReaderEffect: true, subjectLabel: 'A' }).map((value) => value.lane)).toEqual(['observed', 'planned', 'reader-effect-optional']);
    expect(createEmotionGraphProjection('project-a', points, [candidate], { showReaderEffect: true, showInferredCandidates: true, subjectLabel: 'A' }).visiblePoints.map(({ point: value }) => value.lane)).toEqual(['reader-effect-optional', 'observed', 'planned', 'inferred']);
    expect(projection.accessibleSummary.rows.map((row) => row.lane)).toEqual(['observed', 'planned']);
    expect(selectEmotionGraphPoint(points[0])).toMatchObject({ pointId: 'observed-a', status: 'selected' });
    expect(selectEmotionGraphPoint({ ...points[0]!, currentness: 'stale' })).toMatchObject({ status: 'stale' });
    expect(selectEmotionGraphPoint(undefined)).toMatchObject({ status: 'missing' });
  });
});
