import {
  createEmotionGraphProjection,
  readEmotionGraphPoints,
  type EmotionGraphProjectionV1,
} from './emotionGraph.js';
import {
  runContinuityV1,
  type ContinuityRunResultV1,
} from './continuity.js';
import type { ProjectSpineProjectContext } from './ipc/projectSpine.js';
import type {
  CurrentnessV1,
  StoryIntelligenceDocumentV1,
  StoryPositionRefV1,
  StoryIntelligenceSourceClassV1,
  StoryIntelligenceAuthorRecordV1,
} from './ipc/storyIntelligence.js';
import { deriveStoryPositionCurrentness } from './storyIntelligencePolicy.js';
import {
  runTimelineV1,
  type TimelineRunResultV1,
} from './timeline.js';

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
  _generation: number,
  unitId: string,
  order: number,
): StoryPositionRefV1 {
  return {
    projectId: project.projectId,
    sourceKind: 'story-unit',
    sourceId: unitId,
    // Project-session generation is not a durable manuscript revision. The
    // V1 body fingerprint carries content currentness across reopen/switch.
    sourceRevision: 1,
    sourceFingerprint: project.unitMetrics?.[unitId]?.sourceFingerprint
      ?? `${project.projectId}:${unitId}:${_generation}`,
    unitId,
    orderIndex: order,
    orderBasis: 'manuscript',
  };
}

function mergeCurrentness(states: readonly CurrentnessV1[]): CurrentnessV1 {
  if (states.includes('unavailable')) return 'unavailable';
  if (states.includes('stale')) return 'stale';
  if (states.includes('trimmed')) return 'trimmed';
  return 'current';
}

function resolveStoredCurrentness(
  explicit: CurrentnessV1,
  refs: readonly StoryPositionRefV1[],
  currentByUnit: ReadonlyMap<string, StoryPositionRefV1>,
): CurrentnessV1 {
  const states = refs.map((reference) => {
    if (explicit !== 'current') return explicit;
    if (reference.sourceKind !== 'manuscript' && reference.sourceKind !== 'story-unit') return 'current' as const;
    const current = currentByUnit.get(reference.unitId ?? reference.sourceId);
    if (!current) return 'unavailable' as const;
    // Legacy persisted refs and legacy fixture metrics use non-hash identities.
    // Preserve their explicit state until a fingerprint-bearing snapshot can
    // establish a safe comparison.
    if (!/^[a-f0-9]{64}$/i.test(reference.sourceFingerprint) ||
      !/^[a-f0-9]{64}$/i.test(current.sourceFingerprint)) return 'current' as const;
    return deriveStoryPositionCurrentness(reference, {
      available: true,
      sourceRevision: current.sourceRevision,
      sourceFingerprint: current.sourceFingerprint,
    });
  });
  return mergeCurrentness(states);
}

function resolvedAuthorRecord(
  record: StoryIntelligenceAuthorRecordV1,
  currentByUnit: ReadonlyMap<string, StoryPositionRefV1>,
): StoryIntelligenceAuthorRecordV1 {
  return {
    ...record,
    currentness: resolveStoredCurrentness(record.currentness ?? 'current', record.positionRefs, currentByUnit),
  };
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? Math.round(((ordered[middle - 1] ?? 0) + (ordered[middle] ?? 0)) / 2)
    : ordered[middle] ?? 0;
}

function latestRecord(records: readonly StoryIntelligenceAuthorRecordV1[]): StoryIntelligenceAuthorRecordV1 | undefined {
  return [...records].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt)).at(-1);
}

function sourceRecordFor(
  ref: StoryPositionRefV1,
  document: StoryIntelligenceDocumentV1,
  currentByUnit: ReadonlyMap<string, StoryPositionRefV1>,
): { readonly sourceRef: StoryPositionRefV1; readonly sourceClass: StoryIntelligenceSourceClassV1; readonly currentness: CurrentnessV1 } {
  const relatedSignals = document.durableSignals.filter((signal) => signal.positionRefs.some((candidate) =>
    (candidate.sourceKind === ref.sourceKind && candidate.sourceId === ref.sourceId) ||
    ((candidate.sourceKind === 'manuscript' || candidate.sourceKind === 'story-unit') &&
      (ref.sourceKind === 'manuscript' || ref.sourceKind === 'story-unit') &&
      (candidate.unitId ?? candidate.sourceId) === (ref.unitId ?? ref.sourceId)),
  ));
  const protectedSignal = relatedSignals.find((signal) =>
    signal.provenance.protectionClass !== 'included' &&
    signal.provenance.protectionClass !== 'deterministic-only' &&
    signal.provenance.protectionClass !== 'local-only',
  );
  if (protectedSignal) {
    return {
      sourceRef: ref,
      sourceClass: protectedSignal.provenance.protectionClass,
      currentness: resolveStoredCurrentness(protectedSignal.currentness, protectedSignal.positionRefs, currentByUnit),
    };
  }
  const currentness = mergeCurrentness(relatedSignals.map((signal) =>
    resolveStoredCurrentness(signal.currentness, signal.positionRefs, currentByUnit)));
  return { sourceRef: ref, sourceClass: 'included', currentness };
}

export function buildProgram6ProductionProjection(input: {
  readonly project: ProjectSpineProjectContext;
  readonly generation: number;
  readonly document: StoryIntelligenceDocumentV1;
}): Program6ProductionProjectionV1 {
  const { project, generation, document } = input;
  const refs = project.units.map((unit) => sourceRef(project, generation, unit.id, unit.order));
  const refByUnit = new Map(project.units.map((unit, index) => [unit.id, refs[index]!]));
  const currentByUnit = refByUnit;
  const authorRecords = document.authorRecords
    .filter((record) => record.projectId === project.projectId)
    .map((record) => resolvedAuthorRecord(record, currentByUnit));
  const sourceRecords = refs.map((ref) => sourceRecordFor(ref, document, currentByUnit));
  const events = authorRecords.filter((record) => record.recordKind === 'timeline-event' &&
    (record.evidenceClass === 'planned' || record.currentness === 'current') &&
    record.unitId && record.timelineWorldOrder !== undefined && record.timelineTemporalState).flatMap((record) => {
    const unit = project.units.find((candidate) => candidate.id === record.unitId);
    const ref = record.unitId ? refByUnit.get(record.unitId) : undefined;
    if (!unit || !ref) return [];
    return [{
      eventId: record.recordId,
      unitId: unit.id,
      label: record.label,
      orders: { manuscript: unit.order, 'story-world': record.timelineWorldOrder },
      temporalState: record.timelineTemporalState!,
      positionRefs: [ref],
    }];
  });
  const measuredWordCounts = project.units.map((unit) => project.unitMetrics?.[unit.id]?.wordCount).filter((value): value is number => value !== undefined);
  const medianWordCount = median(measuredWordCounts);
  const pacing = project.units.flatMap((unit) => {
    const ref = refByUnit.get(unit.id);
    const metrics = project.unitMetrics?.[unit.id];
    const intent = latestRecord(authorRecords.filter((record) => record.recordKind === 'pacing-intent' && record.unitId === unit.id &&
      (record.evidenceClass === 'planned' || record.currentness === 'current')));
    if (!ref || (!metrics && !intent?.pacingTempo)) return [];
    const relativeLength = !metrics || medianWordCount === 0 ? undefined
      : metrics.wordCount < medianWordCount * 0.75 ? 'shorter' as const
        : metrics.wordCount > medianWordCount * 1.25 ? 'longer' as const
          : 'typical' as const;
    return [{
      unitId: unit.id,
      ...(intent?.pacingTempo ? { plannedTempo: intent.pacingTempo } : {}),
      ...(metrics ? {
        observedWordCount: metrics.wordCount,
        observedSentenceCount: metrics.sentenceCount,
        observedParagraphCount: metrics.paragraphCount,
        observedDialogueRatio: metrics.dialogueRatio,
        medianWordCount,
        ...(relativeLength ? { relativeLength } : {}),
      } : {}),
      positionRefs: [ref],
    }];
  });
  const pressure = authorRecords.filter((record) => record.recordKind === 'pressure-point' && record.unitId && record.pressureDimension && record.pressureBand &&
    (record.evidenceClass === 'planned' || record.currentness === 'current')).flatMap((record) => {
    const ref = record.unitId ? refByUnit.get(record.unitId) : undefined;
    if (!ref) return [];
    return [{
      eventId: record.unitId!,
      dimension: record.pressureDimension!,
      band: record.pressureBand!,
      evidenceClass: record.evidenceClass === 'observed' ? 'observed' as const : 'planned' as const,
      positionRefs: [ref],
    }];
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
  const points = readEmotionGraphPoints({ ...document, authorRecords }).filter((point) => point.projectId === project.projectId);
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
    signals: document.durableSignals
      .filter((signal) => signal.projectId === project.projectId)
      .map((signal) => ({
        ...signal,
        currentness: resolveStoredCurrentness(signal.currentness, signal.positionRefs, currentByUnit),
      })),
  };
}
