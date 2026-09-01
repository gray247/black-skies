import {
  STORY_INTELLIGENCE_SCHEMA_VERSION,
  type CurrentnessV1,
  type EmotionGraphIntensityV1,
  type StoryIntelligenceAuthorRecordV1,
  type StoryIntelligenceDocumentV1,
  type StoryIntelligenceProvenanceV1,
  type StoryPositionRefV1,
} from './ipc/storyIntelligence.js';
import {
  isStoryIntelligenceProvenanceV1,
  isStoryPositionRefV1,
} from './storyIntelligencePolicy.js';

export const EMOTION_GRAPH_SCHEMA_VERSION = 'BlackSkiesEmotionGraph v1' as const;
export const EMOTION_GRAPH_LANES_V1 = [
  'planned', 'observed', 'inferred', 'reader-effect-optional',
] as const;
export const EMOTION_GRAPH_DURABLE_LANES_V1 = [
  'planned', 'observed', 'reader-effect-optional',
] as const;
export const EMOTION_GRAPH_INTENSITIES_V1 = [
  'very-low', 'low', 'medium', 'high', 'very-high', 'unknown',
] as const;
export const EMOTION_GRAPH_MOVEMENTS_V1 = [
  'rising', 'falling', 'steady', 'changed-label', 'unknown',
] as const;

export type EmotionGraphLaneV1 = typeof EMOTION_GRAPH_LANES_V1[number];
export type EmotionGraphDurableLaneV1 = typeof EMOTION_GRAPH_DURABLE_LANES_V1[number];
export type EmotionGraphMovementDirectionV1 = typeof EMOTION_GRAPH_MOVEMENTS_V1[number];

export interface EmotionGraphPointV1 {
  readonly schemaVersion: typeof EMOTION_GRAPH_SCHEMA_VERSION;
  readonly pointId: string;
  readonly projectId: string;
  readonly lane: EmotionGraphDurableLaneV1;
  readonly emotionLabel: string;
  readonly intensity: EmotionGraphIntensityV1;
  readonly subjectLabel?: string;
  readonly positionRefs: readonly StoryPositionRefV1[];
  readonly sourceOwner: string;
  readonly provenance: StoryIntelligenceProvenanceV1;
  readonly currentness: CurrentnessV1;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EmotionGraphCandidatePointV1 {
  readonly schemaVersion: typeof EMOTION_GRAPH_SCHEMA_VERSION;
  readonly candidateId: string;
  readonly projectId: string;
  readonly lane: 'inferred';
  readonly emotionLabel: string;
  readonly intensity: EmotionGraphIntensityV1;
  readonly subjectLabel?: string;
  readonly positionRefs: readonly StoryPositionRefV1[];
  readonly sourceOwner: string;
  readonly provenance: StoryIntelligenceProvenanceV1;
  readonly currentness: CurrentnessV1;
  readonly temporary: true;
  readonly createdAt: string;
}

export interface EmotionGraphMovementV1 {
  readonly movementId: string;
  readonly projectId: string;
  readonly lane: EmotionGraphDurableLaneV1;
  readonly subjectLabel: string | null;
  readonly fromPointId: string;
  readonly toPointId: string;
  readonly fromNarrativeIndex: number;
  readonly toNarrativeIndex: number;
  readonly direction: EmotionGraphMovementDirectionV1;
  readonly description: string;
}

export interface EmotionGraphComparisonV1 {
  readonly comparisonId: string;
  readonly projectId: string;
  readonly plannedPointId: string;
  readonly observedPointId: string;
  readonly comparable: boolean;
  readonly currentness: CurrentnessV1;
  readonly difference: 'agreement' | 'divergence' | 'not-comparable';
  readonly description: string;
}

export interface EmotionGraphSelectionV1 {
  readonly pointId: string;
  readonly positionRefs: readonly StoryPositionRefV1[];
  readonly status: 'selected' | 'stale' | 'unavailable' | 'missing';
}

export interface EmotionGraphAccessibleSummaryRowV1 {
  readonly pointId: string;
  readonly narrativeIndex: number;
  readonly lane: EmotionGraphDurableLaneV1 | 'inferred';
  readonly subjectLabel: string | null;
  readonly emotionLabel: string;
  readonly intensity: EmotionGraphIntensityV1;
  readonly currentness: CurrentnessV1;
  readonly sourceStatus: string;
}

export interface EmotionGraphAccessibleSummaryV1 {
  readonly name: string;
  readonly description: string;
  readonly rows: readonly EmotionGraphAccessibleSummaryRowV1[];
}

export interface EmotionGraphProjectionPointV1 {
  readonly point: EmotionGraphPointV1 | EmotionGraphCandidatePointV1;
  readonly narrativeIndex: number;
}

export interface EmotionGraphProjectionV1 {
  readonly schemaVersion: typeof EMOTION_GRAPH_SCHEMA_VERSION;
  readonly projectId: string;
  readonly orderedPoints: readonly EmotionGraphProjectionPointV1[];
  readonly visiblePoints: readonly EmotionGraphProjectionPointV1[];
  readonly movements: readonly EmotionGraphMovementV1[];
  readonly comparisons: readonly EmotionGraphComparisonV1[];
  readonly selectedSubject: string | null;
  readonly accessibleSummary: EmotionGraphAccessibleSummaryV1;
}

export interface EmotionGraphViewOptionsV1 {
  readonly showReaderEffect?: boolean;
  readonly showInferredCandidates?: boolean;
  readonly subjectLabel?: string | null;
  readonly multipleSubjects?: boolean;
}

export interface EmotionGraphCurrentReferenceV1 {
  readonly available: boolean;
  readonly sourceRevision?: number;
  readonly sourceFingerprint?: string;
}

export class EmotionGraphValidationError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Emotion Graph data is invalid: ${issues.join('; ')}`);
    this.name = 'EmotionGraphValidationError';
  }
}

function bounded(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}

function isoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function exactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.prototype.hasOwnProperty.call(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key));
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

const excludedSourceClasses = new Set([
  'hidden', 'masked', 'deleted', 'forgotten', 'discarded', 'protected', 'ai-excluded',
]);

function validatePointShape(value: unknown, projectId: string, candidate: boolean): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const required = candidate
    ? ['schemaVersion', 'candidateId', 'projectId', 'lane', 'emotionLabel', 'intensity', 'positionRefs', 'sourceOwner', 'provenance', 'currentness', 'temporary', 'createdAt']
    : ['schemaVersion', 'pointId', 'projectId', 'lane', 'emotionLabel', 'intensity', 'positionRefs', 'sourceOwner', 'provenance', 'currentness', 'createdAt', 'updatedAt'];
  if (!exactKeys(record, required, ['subjectLabel'])) return false;
  const id = candidate ? record.candidateId : record.pointId;
  if (record.schemaVersion !== EMOTION_GRAPH_SCHEMA_VERSION || record.projectId !== projectId || !bounded(id, 160) ||
    !bounded(record.emotionLabel, 120) || !isOneOf(record.intensity, EMOTION_GRAPH_INTENSITIES_V1) ||
    !isOneOf(record.currentness, ['current', 'stale', 'unavailable', 'trimmed']) ||
    !bounded(record.sourceOwner, 160) || !isStoryIntelligenceProvenanceV1(record.provenance) ||
    excludedSourceClasses.has(record.provenance.protectionClass) ||
    !Array.isArray(record.positionRefs) || record.positionRefs.length === 0 ||
    !record.positionRefs.every((ref) => isStoryPositionRefV1(ref, projectId)) ||
    !bounded(record.subjectLabel, 160) && record.subjectLabel !== undefined ||
    !isoDate(record.createdAt) || (!candidate && !isoDate(record.updatedAt))) return false;
  if (candidate) return record.lane === 'inferred' && record.temporary === true && record.provenance.origin === 'deterministic';
  if (!isOneOf(record.lane, EMOTION_GRAPH_DURABLE_LANES_V1)) return false;
  const sourceKinds = new Set(record.positionRefs.map((ref) => ref.sourceKind));
  if (record.lane === 'observed') return sourceKinds.has('manuscript') || sourceKinds.has('assertion');
  return sourceKinds.has('outline') || sourceKinds.has('story-unit') || sourceKinds.has('author-intent');
}

export function validateEmotionGraphPoint(value: unknown, projectId: string): EmotionGraphPointV1 {
  if (!validatePointShape(value, projectId, false)) throw new EmotionGraphValidationError(['durable point shape or source lane is invalid']);
  return value as EmotionGraphPointV1;
}

export function validateEmotionGraphCandidatePoint(value: unknown, projectId: string): EmotionGraphCandidatePointV1 {
  if (!validatePointShape(value, projectId, true)) throw new EmotionGraphValidationError(['candidate point shape or source lane is invalid']);
  return value as EmotionGraphCandidatePointV1;
}

export function emotionGraphPointToAuthorRecord(point: EmotionGraphPointV1): StoryIntelligenceAuthorRecordV1 {
  validateEmotionGraphPoint(point, point.projectId);
  return {
    recordId: point.pointId,
    projectId: point.projectId,
    evidenceClass: point.lane,
    label: point.emotionLabel,
    intensityBand: point.intensity === 'unknown' ? undefined : point.intensity,
    recordKind: 'emotion-graph',
    emotionLane: point.lane,
    emotionIntensity: point.intensity,
    ...(point.subjectLabel === undefined ? {} : { subjectLabel: point.subjectLabel }),
    currentness: point.currentness,
    positionRefs: point.positionRefs,
    provenance: point.provenance,
    createdAt: point.createdAt,
    updatedAt: point.updatedAt,
  };
}

export function emotionGraphPointFromAuthorRecord(record: StoryIntelligenceAuthorRecordV1): EmotionGraphPointV1 | null {
  if (record.recordKind !== 'emotion-graph' || !record.emotionLane || !record.emotionIntensity) return null;
  const point: EmotionGraphPointV1 = {
    schemaVersion: EMOTION_GRAPH_SCHEMA_VERSION,
    pointId: record.recordId,
    projectId: record.projectId,
    lane: record.emotionLane,
    emotionLabel: record.label,
    intensity: record.emotionIntensity,
    ...(record.subjectLabel === undefined ? {} : { subjectLabel: record.subjectLabel }),
    positionRefs: record.positionRefs,
    sourceOwner: record.provenance.sourceOwner,
    provenance: record.provenance,
    currentness: record.currentness ?? 'current',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  return validateEmotionGraphPoint(point, record.projectId);
}

export function readEmotionGraphPoints(document: StoryIntelligenceDocumentV1): readonly EmotionGraphPointV1[] {
  return document.authorRecords
    .filter((record) => record.recordKind === 'emotion-graph')
    .map((record) => emotionGraphPointFromAuthorRecord(record))
    .filter((point): point is EmotionGraphPointV1 => point !== null);
}

export function resolveEmotionGraphPointCurrentness(
  point: EmotionGraphPointV1,
  resolve: (reference: StoryPositionRefV1) => EmotionGraphCurrentReferenceV1,
): EmotionGraphPointV1 {
  const states = point.positionRefs.map((reference) => {
    const current = resolve(reference);
    if (!current.available) return 'unavailable' as const;
    if (current.sourceRevision !== reference.sourceRevision || current.sourceFingerprint !== reference.sourceFingerprint) return 'stale' as const;
    return 'current' as const;
  });
  const currentness = states.includes('unavailable') ? 'unavailable' : states.includes('stale') ? 'stale' : 'current';
  return { ...point, currentness };
}

function orderValue(point: EmotionGraphPointV1 | EmotionGraphCandidatePointV1): [number, string, string] {
  const first = [...point.positionRefs].sort((a, b) => (a.orderIndex ?? Number.MAX_SAFE_INTEGER) - (b.orderIndex ?? Number.MAX_SAFE_INTEGER))[0];
  return [first?.orderIndex ?? Number.MAX_SAFE_INTEGER, first?.sourceId ?? '', 'pointId' in point ? point.pointId : point.candidateId];
}

function ordered<T extends EmotionGraphPointV1 | EmotionGraphCandidatePointV1>(points: readonly T[]): T[] {
  return [...points].sort((a, b) => {
    const left = orderValue(a); const right = orderValue(b);
    return left[0] - right[0] || left[1].localeCompare(right[1]) || left[2].localeCompare(right[2]);
  });
}

function subjectOf(point: EmotionGraphPointV1 | EmotionGraphCandidatePointV1): string | null {
  return point.subjectLabel ?? null;
}

function intensityRank(value: EmotionGraphIntensityV1): number | null {
  const index = EMOTION_GRAPH_INTENSITIES_V1.indexOf(value);
  return index >= 0 && value !== 'unknown' ? index : null;
}

export function deriveEmotionGraphMovement(
  from: EmotionGraphPointV1 | EmotionGraphCandidatePointV1,
  to: EmotionGraphPointV1 | EmotionGraphCandidatePointV1,
  fromNarrativeIndex = 1,
  toNarrativeIndex = 2,
): EmotionGraphMovementV1 {
  const fromRank = intensityRank(from.intensity); const toRank = intensityRank(to.intensity);
  const direction = from.emotionLabel !== to.emotionLabel
    ? 'changed-label'
    : fromRank === null || toRank === null
      ? 'unknown'
      : toRank > fromRank ? 'rising' : toRank < fromRank ? 'falling' : 'steady';
  return {
    movementId: `${'pointId' in from ? from.pointId : from.candidateId}->${'pointId' in to ? to.pointId : to.candidateId}`,
    projectId: from.projectId,
    lane: from.lane === 'inferred' ? 'observed' : from.lane,
    subjectLabel: subjectOf(from),
    fromPointId: 'pointId' in from ? from.pointId : from.candidateId,
    toPointId: 'pointId' in to ? to.pointId : to.candidateId,
    fromNarrativeIndex,
    toNarrativeIndex,
    direction,
    description: direction === 'changed-label'
      ? `Label changed from ${from.emotionLabel} to ${to.emotionLabel}.`
      : direction === 'unknown' ? 'Intensity movement is unknown.' : `Intensity is ${direction}.`,
  };
}

function comparablePosition(left: EmotionGraphPointV1, right: EmotionGraphPointV1): boolean {
  return left.positionRefs.some((a) => right.positionRefs.some((b) =>
    a.projectId === b.projectId &&
    ((a.unitId && a.unitId === b.unitId) || (a.anchorId && a.anchorId === b.anchorId) ||
      (a.orderIndex !== undefined && a.orderIndex === b.orderIndex))));
}

export function compareEmotionGraphPoints(planned: EmotionGraphPointV1, observed: EmotionGraphPointV1): EmotionGraphComparisonV1 {
  const comparable = comparablePosition(planned, observed);
  const agreement = planned.emotionLabel === observed.emotionLabel && planned.intensity === observed.intensity;
  return {
    comparisonId: `${planned.pointId}:${observed.pointId}`,
    projectId: planned.projectId,
    plannedPointId: planned.pointId,
    observedPointId: observed.pointId,
    comparable,
    currentness: planned.currentness === 'unavailable' || observed.currentness === 'unavailable' ? 'unavailable' :
      planned.currentness === 'stale' || observed.currentness === 'stale' ? 'stale' : 'current',
    difference: !comparable ? 'not-comparable' : agreement ? 'agreement' : 'divergence',
    description: !comparable
      ? 'Planned and observed positions are not comparable.'
      : agreement
        ? `Planned and observed emotion agree: ${planned.emotionLabel} (${planned.intensity}).`
        : `Planned ${planned.emotionLabel} (${planned.intensity}) differs from observed ${observed.emotionLabel} (${observed.intensity}).`,
  };
}

export function selectEmotionGraphPoints(
  points: readonly EmotionGraphPointV1[],
  options: EmotionGraphViewOptionsV1 = {},
): readonly EmotionGraphPointV1[] {
  const observedExists = points.some((point) => point.lane === 'observed');
  const subject = options.subjectLabel ?? null;
  return points.filter((point) => {
    if (subject && point.subjectLabel !== subject) return false;
    if (!options.multipleSubjects && !subject) {
      const firstSubject = points.find((candidate) => candidate.lane === 'observed')?.subjectLabel;
      if (firstSubject && point.subjectLabel !== firstSubject) return false;
    }
    if (point.lane === 'reader-effect-optional') return options.showReaderEffect === true;
    if (point.lane === 'planned') return true;
    if (point.lane === 'observed') return true;
    return !observedExists;
  });
}

function accessibleSummary(points: readonly EmotionGraphProjectionPointV1[], candidates: readonly EmotionGraphProjectionPointV1[]): EmotionGraphAccessibleSummaryV1 {
  const rows = [...points, ...candidates].map(({ point, narrativeIndex }) => ({
    pointId: 'pointId' in point ? point.pointId : point.candidateId,
    narrativeIndex,
    lane: point.lane,
    subjectLabel: subjectOf(point),
    emotionLabel: point.emotionLabel,
    intensity: point.intensity,
    currentness: point.currentness,
    sourceStatus: point.currentness === 'current' ? 'Source available' : `Source ${point.currentness}`,
  }));
  return {
    name: 'Emotion Graph accessible summary',
    description: 'An ordered, source-linked summary of visible emotional points. Labels, intensity, lane, and source status are shown as text.',
    rows,
  };
}

export function createEmotionGraphProjection(
  projectId: string,
  points: readonly EmotionGraphPointV1[],
  candidates: readonly EmotionGraphCandidatePointV1[] = [],
  options: EmotionGraphViewOptionsV1 = {},
): EmotionGraphProjectionV1 {
  const durable = ordered(points.filter((point) => point.projectId === projectId).map((point) => validateEmotionGraphPoint(point, projectId)));
  const temporary = options.showInferredCandidates ? ordered(candidates.filter((point) => point.projectId === projectId).map((point) => validateEmotionGraphCandidatePoint(point, projectId))) : [];
  const orderedPoints = durable.map((point, index) => ({ point, narrativeIndex: index + 1 }));
  const visibleDurable = selectEmotionGraphPoints(durable, options).map((point) => ({ point, narrativeIndex: orderedPoints.find((entry) => entry.point === point)!.narrativeIndex }));
  const visiblePoints = [...visibleDurable, ...temporary.map((point, index) => ({ point, narrativeIndex: orderedPoints.length + index + 1 }))];
  const movements: EmotionGraphMovementV1[] = [];
  for (let index = 1; index < visiblePoints.length; index += 1) {
    const previous = visiblePoints[index - 1]; const current = visiblePoints[index];
    if (previous && current && previous.point.lane === current.point.lane && subjectOf(previous.point) === subjectOf(current.point)) {
      movements.push(deriveEmotionGraphMovement(previous.point, current.point, previous.narrativeIndex, current.narrativeIndex));
    }
  }
  const planned = durable.filter((point) => point.lane === 'planned');
  const observed = durable.filter((point) => point.lane === 'observed');
  const comparisons = planned.flatMap((plannedPoint) => observed
    .filter((observedPoint) => subjectOf(plannedPoint) === subjectOf(observedPoint))
    .map((observedPoint) => compareEmotionGraphPoints(plannedPoint, observedPoint)));
  return {
    schemaVersion: EMOTION_GRAPH_SCHEMA_VERSION,
    projectId,
    orderedPoints,
    visiblePoints,
    movements,
    comparisons,
    selectedSubject: options.subjectLabel ?? null,
    accessibleSummary: accessibleSummary(visibleDurable, temporary.map((point, index) => ({ point, narrativeIndex: orderedPoints.length + index + 1 }))),
  };
}

export function selectEmotionGraphPoint(point: EmotionGraphPointV1 | undefined): EmotionGraphSelectionV1 {
  if (!point) return { pointId: '', positionRefs: [], status: 'missing' };
  return {
    pointId: point.pointId,
    positionRefs: point.positionRefs,
    status: point.currentness === 'stale' ? 'stale' : point.currentness === 'unavailable' ? 'unavailable' : 'selected',
  };
}

export function hasEmotionGraphRecord(document: StoryIntelligenceDocumentV1): boolean {
  return document.authorRecords.some((record) => record.recordKind === 'emotion-graph');
}

export type EmotionGraphContractVersionV1 = typeof STORY_INTELLIGENCE_SCHEMA_VERSION | typeof EMOTION_GRAPH_SCHEMA_VERSION;
