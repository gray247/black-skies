import {
  createEmotionGraphProjection,
  readEmotionGraphPoints,
  resolveEmotionGraphPointCurrentness,
  type EmotionGraphProjectionV1,
} from './emotionGraph.js';
import { runContinuityV1, type ContinuityRunResultV1 } from './continuity.js';
import type { ProjectSpineProjectContext } from './ipc/projectSpine.js';
import type {
  CurrentnessV1,
  StoryIntelligenceDocumentV1,
  StoryPositionRefV1,
  StoryIntelligenceSourceClassV1,
  StoryIntelligenceAuthorRecordV1,
} from './ipc/storyIntelligence.js';
import { runTimelineV1, type TimelineRunResultV1 } from './timeline.js';
import { deriveStoryPositionCurrentness } from './storyIntelligencePolicy.js';

export interface Program6ProductionProjectionV1 {
  readonly projectId: string;
  readonly generation: number;
  readonly sourceUnitCount: number;
  readonly emotion: EmotionGraphProjectionV1;
  readonly continuity: ContinuityRunResultV1;
  readonly timeline: TimelineRunResultV1;
  readonly signals: StoryIntelligenceDocumentV1['durableSignals'];
}

function sourceRef(
  project: ProjectSpineProjectContext,
  generation: number,
  unitId: string,
  order: number,
  anchor?: Pick<StoryPositionRefV1, 'selectionFingerprint' | 'selectionStart' | 'selectionEnd'>,
): StoryPositionRefV1 {
  const bodySha256 = project.unitMetrics?.[unitId]?.bodySha256;
  return {
    projectId: project.projectId,
    sourceKind: 'story-unit',
    sourceId: unitId,
    sourceRevision: generation,
    sourceFingerprint: bodySha256 ?? `${project.projectId}:${unitId}:${generation}`,
    ...(bodySha256 ? { bodySha256 } : {}),
    ...(anchor?.selectionFingerprint !== undefined &&
    anchor.selectionStart !== undefined &&
    anchor.selectionEnd !== undefined
      ? {
          selectionFingerprint: anchor.selectionFingerprint,
          selectionStart: anchor.selectionStart,
          selectionEnd: anchor.selectionEnd,
        }
      : {}),
    unitId,
    orderIndex: order,
    orderBasis: 'manuscript',
  };
}

function sourceKey(ref: StoryPositionRefV1): string {
  return `${ref.sourceKind}:${ref.sourceId}`;
}

function currentnessForReference(
  reference: StoryPositionRefV1,
  currentRefs: readonly StoryPositionRefV1[],
): CurrentnessV1 {
  const current = currentRefs.find(
    (candidate) =>
      (reference.unitId !== undefined && candidate.unitId === reference.unitId) ||
      (candidate.sourceKind === reference.sourceKind && candidate.sourceId === reference.sourceId),
  );
  // Older in-session records used this exact non-hash synthetic fingerprint.
  // Preserve only that known shape while no body hash exists; arbitrary
  // non-hash values remain stale rather than bypassing currentness.
  if (
    current !== undefined &&
    !/^[a-f0-9]{64}$/iu.test(current.sourceFingerprint) &&
    reference.sourceRevision === current.sourceRevision
  ) {
    const prefix = `${current.projectId}:${current.sourceId}:${current.sourceRevision}:`;
    const suffix = reference.sourceFingerprint.startsWith(prefix)
      ? reference.sourceFingerprint.slice(prefix.length).split(':')
      : [];
    if (
      suffix.length === 2 &&
      ['general', 'emotion-graph', 'timeline-event', 'pacing-intent', 'pressure-point'].includes(
        suffix[0] ?? '',
      ) &&
      ['planned', 'observed', 'reader-effect-optional'].includes(suffix[1] ?? '')
    )
      return 'current';
  }
  return deriveStoryPositionCurrentness(
    reference,
    current === undefined
      ? { available: false }
      : {
          available: true,
          sourceRevision: current.sourceRevision,
          sourceFingerprint: current.sourceFingerprint,
          bodySha256: current.bodySha256,
        },
  );
}

function currentnessForReferences(
  references: readonly StoryPositionRefV1[],
  currentRefs: readonly StoryPositionRefV1[],
): CurrentnessV1 {
  const states = references.map((reference) => currentnessForReference(reference, currentRefs));
  return states.includes('unavailable')
    ? 'unavailable'
    : states.includes('stale')
      ? 'stale'
      : 'current';
}

function mergeCurrentness(stored: CurrentnessV1, derived: CurrentnessV1): CurrentnessV1 {
  if (derived === 'unavailable' || stored === 'unavailable') return 'unavailable';
  if (derived === 'stale' || stored === 'stale' || stored === 'trimmed')
    return stored === 'trimmed' ? 'trimmed' : 'stale';
  return 'current';
}

function isProtectedSignal(
  signal: StoryIntelligenceDocumentV1['durableSignals'][number],
): boolean {
  return !['included', 'deterministic-only', 'local-only'].includes(
    signal.provenance.protectionClass,
  );
}

function projectSignal(
  signal: StoryIntelligenceDocumentV1['durableSignals'][number],
  currentness: CurrentnessV1,
): StoryIntelligenceDocumentV1['durableSignals'][number] {
  if (!isProtectedSignal(signal)) return { ...signal, currentness };
  return {
    ...signal,
    currentness,
    summary: 'Protected signal metadata',
    evidenceSummary: 'Protected content is excluded from this production projection.',
  };
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? Math.round(((ordered[middle - 1] ?? 0) + (ordered[middle] ?? 0)) / 2)
    : (ordered[middle] ?? 0);
}

function latestRecord(
  records: readonly StoryIntelligenceAuthorRecordV1[],
): StoryIntelligenceAuthorRecordV1 | undefined {
  return [...records].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt)).at(-1);
}

function sourceRecordFor(
  ref: StoryPositionRefV1,
  signals: readonly StoryIntelligenceDocumentV1['durableSignals'][number][],
  currentRefs: readonly StoryPositionRefV1[],
): {
  readonly sourceRef: StoryPositionRefV1;
  readonly sourceClass: StoryIntelligenceSourceClassV1;
  readonly currentness: CurrentnessV1;
} {
  const relatedSignals = signals.filter((signal) =>
    signal.positionRefs.some(
      (candidate) =>
        sourceKey(candidate) === sourceKey(ref) ||
        (candidate.unitId !== undefined && candidate.unitId === ref.unitId),
    ),
  );
  const protectedSignal = relatedSignals.find(
    (signal) =>
      signal.provenance.protectionClass !== 'included' &&
      signal.provenance.protectionClass !== 'deterministic-only' &&
      signal.provenance.protectionClass !== 'local-only',
  );
  if (protectedSignal) {
    return {
      sourceRef: ref,
      sourceClass: protectedSignal.provenance.protectionClass,
      currentness: mergeCurrentness(
        protectedSignal.currentness,
        currentnessForReferences(protectedSignal.positionRefs, currentRefs),
      ),
    };
  }
  const currentness = relatedSignals.reduce<CurrentnessV1>(
    (state, signal) =>
      mergeCurrentness(
        state,
        mergeCurrentness(
          signal.currentness,
          currentnessForReferences(signal.positionRefs, currentRefs),
        ),
      ),
    'current',
  );
  return { sourceRef: ref, sourceClass: 'included', currentness };
}

export function buildProgram6ProductionProjection(input: {
  readonly project: ProjectSpineProjectContext;
  readonly generation: number;
  readonly document: StoryIntelligenceDocumentV1;
}): Program6ProductionProjectionV1 {
  const { project, generation, document } = input;
  const storedAnchors = document.durableSignals
    .flatMap((signal) => signal.positionRefs)
    .concat(document.authorRecords.flatMap((record) => record.positionRefs))
    .filter(
      (reference): reference is StoryPositionRefV1 & {
        readonly selectionFingerprint: string;
        readonly selectionStart: number;
        readonly selectionEnd: number;
      } =>
        reference.unitId !== undefined &&
        reference.selectionFingerprint !== undefined &&
        reference.selectionStart !== undefined &&
        reference.selectionEnd !== undefined,
    );
  const refs = project.units.map((unit) =>
    sourceRef(
      project,
      generation,
      unit.id,
      unit.order,
      storedAnchors.find((reference) => reference.unitId === unit.id),
    ),
  );
  const refByUnit = new Map(project.units.map((unit, index) => [unit.id, refs[index]!]));
  const signals = document.durableSignals
    .filter((signal) => signal.projectId === project.projectId)
    .map((signal) =>
      projectSignal(
        signal,
        mergeCurrentness(
          signal.currentness,
          currentnessForReferences(signal.positionRefs, refs),
        ),
      ),
    );
  const sourceRecords = refs.map((ref) => sourceRecordFor(ref, signals, refs));
  const authorRecords = document.authorRecords.filter(
    (record) => record.projectId === project.projectId,
  );
  const actionableRecord = (record: StoryIntelligenceAuthorRecordV1): boolean =>
    currentnessForReferences(record.positionRefs, refs) === 'current' &&
    (record.currentness ?? 'current') === 'current';
  const events = authorRecords
    .filter(
      (record) =>
        actionableRecord(record) &&
        record.recordKind === 'timeline-event' &&
        record.unitId &&
        record.timelineWorldOrder !== undefined &&
        record.timelineTemporalState,
    )
    .flatMap((record) => {
      const unit = project.units.find((candidate) => candidate.id === record.unitId);
      const ref = record.unitId ? refByUnit.get(record.unitId) : undefined;
      if (!unit || !ref) return [];
      return [
        {
          eventId: record.recordId,
          unitId: unit.id,
          label: record.label,
          orders: { manuscript: unit.order, 'story-world': record.timelineWorldOrder },
          temporalState: record.timelineTemporalState!,
          positionRefs: [ref],
        },
      ];
    });
  const measuredWordCounts = project.units
    .map((unit) => project.unitMetrics?.[unit.id]?.wordCount)
    .filter((value): value is number => value !== undefined);
  const medianWordCount = median(measuredWordCounts);
  const pacing = project.units.flatMap((unit) => {
    const ref = refByUnit.get(unit.id);
    const metrics = project.unitMetrics?.[unit.id];
    const intent = latestRecord(
      authorRecords.filter(
        (record) => record.recordKind === 'pacing-intent' && record.unitId === unit.id,
      ),
    );
    if (
      !ref ||
      (!metrics && !intent?.pacingTempo) ||
      (intent !== undefined && !actionableRecord(intent))
    )
      return [];
    const relativeLength =
      !metrics || medianWordCount === 0
        ? undefined
        : metrics.wordCount < medianWordCount * 0.75
          ? ('shorter' as const)
          : metrics.wordCount > medianWordCount * 1.25
            ? ('longer' as const)
            : ('typical' as const);
    return [
      {
        unitId: unit.id,
        ...(intent?.pacingTempo ? { plannedTempo: intent.pacingTempo } : {}),
        ...(metrics
          ? {
              observedWordCount: metrics.wordCount,
              observedSentenceCount: metrics.sentenceCount,
              observedParagraphCount: metrics.paragraphCount,
              observedDialogueRatio: metrics.dialogueRatio,
              medianWordCount,
              ...(relativeLength ? { relativeLength } : {}),
            }
          : {}),
        positionRefs: [ref],
      },
    ];
  });
  const pressure = authorRecords
    .filter(
      (record) =>
        actionableRecord(record) &&
        record.recordKind === 'pressure-point' &&
        record.unitId &&
        record.pressureDimension &&
        record.pressureBand,
    )
    .flatMap((record) => {
      const ref = record.unitId ? refByUnit.get(record.unitId) : undefined;
      if (!ref) return [];
      return [
        {
          eventId: record.unitId!,
          dimension: record.pressureDimension!,
          band: record.pressureBand!,
          evidenceClass:
            record.evidenceClass === 'observed' ? ('observed' as const) : ('planned' as const),
          positionRefs: [ref],
        },
      ];
    });
  const timeline = runTimelineV1({
    schemaVersion: 'BlackSkiesTimeline v1',
    projectId: project.projectId,
    generation,
    analysisId: `stage19:${project.projectId}:timeline:${generation}`,
    events,
    pacing,
    pressure,
    sourceRecords,
    priorDecisions: [],
    createdAt: document.updatedAt,
  });
  const continuity = runContinuityV1({
    schemaVersion: 'BlackSkiesContinuity v1',
    projectId: project.projectId,
    generation,
    analysisId: `stage19:${project.projectId}:continuity:${generation}`,
    units: project.units.map((unit, index) => ({
      unitId: unit.id,
      interpretationState: 'ordinary' as const,
      positionRefs: [refs[index]!],
    })),
    facts: [],
    events: project.units.map((unit, index) => ({
      eventId: `event:${unit.id}`,
      unitId: unit.id,
      stableEventIdentity: unit.title.trim().toLocaleLowerCase('en-US'),
      interpretationState: 'ordinary' as const,
      positionRefs: [refs[index]!],
    })),
    carryoverRequirements: [],
    causalDependencies: [],
    sourceRecords,
    priorDecisions: [],
    createdAt: document.updatedAt,
  });
  const points = readEmotionGraphPoints(document)
    .filter((point) => point.projectId === project.projectId)
    .map((point) => {
      const resolved = resolveEmotionGraphPointCurrentness(point, (reference) => {
        const current = refs.find(
          (candidate) =>
            (reference.unitId !== undefined && candidate.unitId === reference.unitId) ||
            (candidate.sourceKind === reference.sourceKind &&
              candidate.sourceId === reference.sourceId),
        );
        return current === undefined
          ? { available: false }
          : {
              available: true,
              sourceRevision: current.sourceRevision,
              sourceFingerprint: current.sourceFingerprint,
            };
      });
      const compatibilityCurrentness = currentnessForReferences(point.positionRefs, refs);
      return {
        ...resolved,
        currentness: mergeCurrentness(
          point.currentness,
          compatibilityCurrentness === 'current' ? 'current' : resolved.currentness,
        ),
      };
    });
  const emotion = createEmotionGraphProjection(project.projectId, points, [], {
    showReaderEffect: document.settings.analysisPolicy.readerEffectLaneEnabled,
    multipleSubjects: true,
  });
  return {
    projectId: project.projectId,
    generation,
    sourceUnitCount: project.units.length,
    emotion,
    continuity,
    timeline,
    signals,
  };
}
