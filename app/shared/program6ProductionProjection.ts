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
} from './ipc/storyIntelligence.js';
import {
  runTimelineV1,
  type TimelineRunResultV1,
} from './timeline.js';

export interface Program6ProductionProjectionV1 {
  readonly projectId: string;
  readonly generation: number;
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
): StoryPositionRefV1 {
  return {
    projectId: project.projectId,
    sourceKind: 'story-unit',
    sourceId: unitId,
    sourceRevision: generation,
    sourceFingerprint: `${project.projectId}:${unitId}:${generation}`,
    unitId,
    orderIndex: order,
    orderBasis: 'manuscript',
  };
}

function bandFor(order: number): 'none' | 'low' | 'medium' | 'high' {
  return order % 4 === 1 ? 'low' : order % 4 === 2 ? 'medium' : order % 4 === 3 ? 'high' : 'none';
}

function sourceRecordFor(
  ref: StoryPositionRefV1,
  document: StoryIntelligenceDocumentV1,
): { readonly sourceRef: StoryPositionRefV1; readonly sourceClass: StoryIntelligenceSourceClassV1; readonly currentness: CurrentnessV1 } {
  const relatedSignals = document.durableSignals.filter((signal) => signal.positionRefs.some((candidate) =>
    candidate.sourceKind === ref.sourceKind && candidate.sourceId === ref.sourceId,
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
      currentness: protectedSignal.currentness,
    };
  }
  const currentness = relatedSignals.find((signal) => signal.currentness !== 'current')?.currentness ?? 'current';
  return { sourceRef: ref, sourceClass: 'included', currentness };
}

export function buildProgram6ProductionProjection(input: {
  readonly project: ProjectSpineProjectContext;
  readonly generation: number;
  readonly document: StoryIntelligenceDocumentV1;
}): Program6ProductionProjectionV1 {
  const { project, generation, document } = input;
  const refs = project.units.map((unit) => sourceRef(project, generation, unit.id, unit.order));
  const sourceRecords = refs.map((ref) => sourceRecordFor(ref, document));
  const events = project.units.map((unit, index) => ({
    eventId: `event:${unit.id}`,
    unitId: unit.id,
    label: unit.title,
    orders: {
      manuscript: unit.order,
      'story-world': unit.order,
      planning: unit.order,
      projection: unit.order,
      reveal: unit.order,
    },
    temporalState: 'certain' as const,
    positionRefs: [refs[index]!],
  }));
  const timeline = runTimelineV1({
    schemaVersion: 'BlackSkiesTimeline v1',
    projectId: project.projectId,
    generation,
    analysisId: `stage19:${project.projectId}:timeline:${generation}`,
    events,
    pacing: project.units.map((unit, index) => ({
      unitId: unit.id,
      plannedTempo: index % 2 === 0 ? 'steady' : 'fast',
      observedTempo: index % 2 === 0 ? 'steady' : 'slow',
      positionRefs: [refs[index]!],
    })),
    pressure: project.units.flatMap((unit, index) => [
      { eventId: `event:${unit.id}`, dimension: 'urgency' as const, band: bandFor(index + 1), positionRefs: [refs[index]!] },
      { eventId: `event:${unit.id}`, dimension: 'consequence' as const, band: index % 2 === 0 ? 'medium' as const : 'low' as const, positionRefs: [refs[index]!] },
    ]),
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
  const points = readEmotionGraphPoints(document).filter((point) => point.projectId === project.projectId);
  const emotion = createEmotionGraphProjection(project.projectId, points, [], {
    showReaderEffect: document.settings.analysisPolicy.readerEffectLaneEnabled,
    multipleSubjects: true,
  });
  return {
    projectId: project.projectId,
    generation,
    emotion,
    continuity,
    timeline,
    signals: document.durableSignals.filter((signal) => signal.projectId === project.projectId),
  };
}
