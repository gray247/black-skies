import {
  type CurrentnessV1,
  type SignalImpactV1,
  type StoryIntelligenceProvenanceV1,
  type StoryIntelligenceSourceClassV1,
  type StoryPositionRefV1,
} from './ipc/storyIntelligence.js';
import { isStoryPositionRefV1 } from './storyIntelligencePolicy.js';

export const TIMELINE_SCHEMA_VERSION = 'BlackSkiesTimeline v1' as const;
export const TIMELINE_ORDER_BASES = ['story-world', 'manuscript', 'planning', 'projection', 'reveal'] as const;
export const TIMELINE_TEMPOS = ['very-slow', 'slow', 'steady', 'fast', 'very-fast'] as const;
export const TIMELINE_PRESSURE_DIMENSIONS = ['urgency', 'consequence', 'constraint', 'conflict'] as const;
export const TIMELINE_PRESSURE_BANDS = ['none', 'low', 'medium', 'high', 'very-high', 'unknown'] as const;
export const TIMELINE_TEMPORAL_STATES = ['certain', 'uncertain', 'disputed', 'simultaneous', 'unavailable'] as const;
export const TIMELINE_ALLOWED_ACTIONS = ['return-to-source', 'dismiss', 'mark-intentional', 'park'] as const;

export type TimelineOrderBasisV1 = typeof TIMELINE_ORDER_BASES[number];
export type TimelineTempoV1 = typeof TIMELINE_TEMPOS[number];
export type TimelinePressureDimensionV1 = typeof TIMELINE_PRESSURE_DIMENSIONS[number];
export type TimelinePressureBandV1 = typeof TIMELINE_PRESSURE_BANDS[number];
export type TimelineTemporalStateV1 = typeof TIMELINE_TEMPORAL_STATES[number];
export type TimelineAllowedActionV1 = typeof TIMELINE_ALLOWED_ACTIONS[number];

export interface TimelineSourceRecordV1 {
  readonly sourceRef: StoryPositionRefV1;
  readonly sourceClass: StoryIntelligenceSourceClassV1;
  readonly currentness: CurrentnessV1;
}

export interface TimelineEventRecordV1 {
  readonly eventId: string;
  readonly unitId: string;
  readonly label: string;
  readonly orders: Partial<Record<TimelineOrderBasisV1, number>>;
  readonly durationUnits?: number;
  readonly temporalState: TimelineTemporalStateV1;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export interface TimelinePacingRecordV1 {
  readonly unitId: string;
  readonly plannedTempo?: TimelineTempoV1;
  readonly observedTempo?: TimelineTempoV1;
  readonly plannedDurationUnits?: number;
  readonly observedDurationUnits?: number;
  readonly observedWordCount?: number;
  readonly observedEventCount?: number;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export interface TimelinePressureRecordV1 {
  readonly eventId: string;
  readonly dimension: TimelinePressureDimensionV1;
  readonly band: TimelinePressureBandV1;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export interface TimelineDecisionLineageV1 {
  readonly lineageId: string;
  readonly priorFindingId: string;
  readonly disposition: 'dismissed' | 'suppressed' | 'resolved' | 'intentional' | 'parked';
}

export interface TimelineInputV1 {
  readonly schemaVersion: typeof TIMELINE_SCHEMA_VERSION;
  readonly projectId: string;
  readonly generation: number;
  readonly analysisId: string;
  readonly events: readonly TimelineEventRecordV1[];
  readonly pacing: readonly TimelinePacingRecordV1[];
  readonly pressure: readonly TimelinePressureRecordV1[];
  readonly sourceRecords: readonly TimelineSourceRecordV1[];
  readonly priorDecisions: readonly TimelineDecisionLineageV1[];
  readonly createdAt: string;
}

export interface TimelineChronologyRowV1 {
  readonly eventId: string;
  readonly unitId: string;
  readonly label: string;
  readonly orders: Partial<Record<TimelineOrderBasisV1, number>>;
  readonly durationUnits?: number;
  readonly temporalState: TimelineTemporalStateV1;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export type TimelinePacingDirectionV1 = 'faster-than-planned' | 'slower-than-planned' | 'matches-planned' | 'unknown';

export interface TimelinePacingComparisonV1 {
  readonly unitId: string;
  readonly plannedTempo?: TimelineTempoV1;
  readonly observedTempo?: TimelineTempoV1;
  readonly plannedDurationUnits?: number;
  readonly observedDurationUnits?: number;
  readonly direction: TimelinePacingDirectionV1;
  readonly isReviewOpportunity: boolean;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export interface TimelinePressureProfileV1 {
  readonly eventId: string;
  readonly dimensions: Readonly<Partial<Record<TimelinePressureDimensionV1, TimelinePressureBandV1>>>;
  readonly universalScore: null;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export type TimelineFindingCategoryV1 = 'chronology-review' | 'pacing-review' | 'pressure-review';

export interface TimelineFindingV1 {
  readonly schemaVersion: typeof TIMELINE_SCHEMA_VERSION;
  readonly findingId: string;
  readonly projectId: string;
  readonly generation: number;
  readonly analysisId: string;
  readonly category: TimelineFindingCategoryV1;
  readonly scope: string;
  readonly positionRefs: readonly StoryPositionRefV1[];
  readonly evidenceRefs: readonly { readonly recordType: 'event' | 'pacing' | 'pressure'; readonly recordId: string }[];
  readonly evidenceClass: 'observed' | 'planned';
  readonly confidenceBand: 'unknown' | 'low' | 'medium' | 'high';
  readonly impact: SignalImpactV1;
  readonly currentness: CurrentnessV1;
  readonly summary: string;
  readonly evidenceSummary: string;
  readonly sourceOwner: 'Timeline';
  readonly provenance: StoryIntelligenceProvenanceV1;
  readonly lifecycle: 'candidate';
  readonly lineageId: string;
  readonly recurrence: 'first-observation' | 'new-candidate';
  readonly allowedActions: readonly TimelineAllowedActionV1[];
  readonly createdAt: string;
}

export interface TimelineRunResultV1 {
  readonly schemaVersion: typeof TIMELINE_SCHEMA_VERSION;
  readonly projectId: string;
  readonly generation: number;
  readonly analysisId: string;
  readonly chronology: readonly TimelineChronologyRowV1[];
  readonly pacing: readonly TimelinePacingComparisonV1[];
  readonly pressure: readonly TimelinePressureProfileV1[];
  readonly findings: readonly TimelineFindingV1[];
  readonly blockedSourceCount: number;
  readonly advisoryOnly: true;
  readonly universalPressureScore: null;
  readonly mutatedAuthorState: false;
  readonly createdAt: string;
}

export class TimelineValidationError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Timeline data is invalid: ${issues.join('; ')}`);
    this.name = 'TimelineValidationError';
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.prototype.hasOwnProperty.call(value, key)) && Object.keys(value).every((key) => allowed.has(key));
}

function bounded(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function oneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function orders(value: unknown): value is Partial<Record<TimelineOrderBasisV1, number>> {
  return record(value) && Object.keys(value).every((key) => oneOf(key, TIMELINE_ORDER_BASES) && integer(value[key]));
}

function refs(value: unknown, projectId: string): value is readonly StoryPositionRefV1[] {
  return Array.isArray(value) && value.length > 0 && value.every((ref) => isStoryPositionRefV1(ref, projectId));
}

function source(value: unknown, projectId: string): value is TimelineSourceRecordV1 {
  return record(value) && exactKeys(value, ['sourceRef', 'sourceClass', 'currentness']) &&
    isStoryPositionRefV1(value.sourceRef, projectId) &&
    oneOf(value.sourceClass, ['included', 'deterministic-only', 'hidden', 'masked', 'deleted', 'forgotten', 'discarded', 'local-only', 'protected', 'ai-excluded']) &&
    oneOf(value.currentness, ['current', 'stale', 'unavailable', 'trimmed']);
}

function event(value: unknown, projectId: string): value is TimelineEventRecordV1 {
  return record(value) && exactKeys(value, ['eventId', 'unitId', 'label', 'orders', 'temporalState', 'positionRefs'], ['durationUnits']) &&
    bounded(value.eventId, 160) && bounded(value.unitId, 160) && bounded(value.label, 240) && orders(value.orders) &&
    (value.durationUnits === undefined || integer(value.durationUnits)) && oneOf(value.temporalState, TIMELINE_TEMPORAL_STATES) && refs(value.positionRefs, projectId);
}

function pacing(value: unknown, projectId: string): value is TimelinePacingRecordV1 {
  return record(value) && exactKeys(value, ['unitId', 'positionRefs'], ['plannedTempo', 'observedTempo', 'plannedDurationUnits', 'observedDurationUnits', 'observedWordCount', 'observedEventCount']) &&
    bounded(value.unitId, 160) && (value.plannedTempo === undefined || oneOf(value.plannedTempo, TIMELINE_TEMPOS)) &&
    (value.observedTempo === undefined || oneOf(value.observedTempo, TIMELINE_TEMPOS)) &&
    (value.plannedDurationUnits === undefined || integer(value.plannedDurationUnits)) &&
    (value.observedDurationUnits === undefined || integer(value.observedDurationUnits)) &&
    (value.observedWordCount === undefined || integer(value.observedWordCount)) &&
    (value.observedEventCount === undefined || integer(value.observedEventCount)) && refs(value.positionRefs, projectId);
}

function pressure(value: unknown, projectId: string): value is TimelinePressureRecordV1 {
  return record(value) && exactKeys(value, ['eventId', 'dimension', 'band', 'positionRefs']) && bounded(value.eventId, 160) &&
    oneOf(value.dimension, TIMELINE_PRESSURE_DIMENSIONS) && oneOf(value.band, TIMELINE_PRESSURE_BANDS) && refs(value.positionRefs, projectId);
}

function priorDecision(value: unknown): value is TimelineDecisionLineageV1 {
  return record(value) && exactKeys(value, ['lineageId', 'priorFindingId', 'disposition']) && bounded(value.lineageId, 200) &&
    bounded(value.priorFindingId, 200) && oneOf(value.disposition, ['dismissed', 'suppressed', 'resolved', 'intentional', 'parked']);
}

function validate(input: unknown): asserts input is TimelineInputV1 {
  const issues: string[] = [];
  if (!record(input) || !exactKeys(input, ['schemaVersion', 'projectId', 'generation', 'analysisId', 'events', 'pacing', 'pressure', 'sourceRecords', 'priorDecisions', 'createdAt'])) {
    throw new TimelineValidationError(['input keys or shape are invalid']);
  }
  const candidate = input as Record<string, unknown>;
  const projectId = typeof candidate.projectId === 'string' ? candidate.projectId : '';
  if (candidate.schemaVersion !== TIMELINE_SCHEMA_VERSION) issues.push('schemaVersion');
  if (!bounded(candidate.projectId, 160)) issues.push('projectId');
  if (!integer(candidate.generation)) issues.push('generation');
  if (!bounded(candidate.analysisId, 160)) issues.push('analysisId');
  if (!isoDate(candidate.createdAt)) issues.push('createdAt');
  if (!Array.isArray(candidate.events) || !candidate.events.every((item) => event(item, projectId))) issues.push('events');
  if (!Array.isArray(candidate.pacing) || !candidate.pacing.every((item) => pacing(item, projectId))) issues.push('pacing');
  if (!Array.isArray(candidate.pressure) || !candidate.pressure.every((item) => pressure(item, projectId))) issues.push('pressure');
  if (!Array.isArray(candidate.sourceRecords) || !candidate.sourceRecords.every((item) => source(item, projectId))) issues.push('sourceRecords');
  if (!Array.isArray(candidate.priorDecisions) || !candidate.priorDecisions.every(priorDecision)) issues.push('priorDecisions');
  if (issues.length > 0) throw new TimelineValidationError(issues);
}

const blockedClasses = new Set<StoryIntelligenceSourceClassV1>(['hidden', 'masked', 'deleted', 'forgotten', 'discarded', 'protected', 'ai-excluded']);
function sourceKey(ref: StoryPositionRefV1): string { return `${ref.sourceKind}:${ref.sourceId}`; }
function eligible(refs: readonly StoryPositionRefV1[], byKey: ReadonlyMap<string, TimelineSourceRecordV1>): boolean {
  return refs.every((ref) => {
    const item = byKey.get(sourceKey(ref));
    return item !== undefined && item.currentness === 'current' && !blockedClasses.has(item.sourceClass);
  });
}
function tempoRank(value: TimelineTempoV1 | undefined): number | undefined { return value === undefined ? undefined : TIMELINE_TEMPOS.indexOf(value); }
function direction(planned: TimelineTempoV1 | undefined, observed: TimelineTempoV1 | undefined): TimelinePacingDirectionV1 {
  const plannedRank = tempoRank(planned);
  const observedRank = tempoRank(observed);
  if (plannedRank === undefined || observedRank === undefined) return 'unknown';
  if (observedRank === plannedRank) return 'matches-planned';
  return observedRank > plannedRank ? 'faster-than-planned' : 'slower-than-planned';
}
function finding(
  input: TimelineInputV1,
  category: TimelineFindingCategoryV1,
  key: string,
  summary: string,
  evidenceSummary: string,
  refs: readonly StoryPositionRefV1[],
  evidenceRefs: readonly { readonly recordType: 'event' | 'pacing' | 'pressure'; readonly recordId: string }[],
  evidenceClass: 'observed' | 'planned',
  priorDecisions: readonly TimelineDecisionLineageV1[],
): TimelineFindingV1 {
  const lineageId = `timeline:${category}:${key}`;
  return {
    schemaVersion: TIMELINE_SCHEMA_VERSION, findingId: `${input.analysisId}:${lineageId}`, projectId: input.projectId,
    generation: input.generation, analysisId: input.analysisId, category, scope: key, positionRefs: refs, evidenceRefs,
    evidenceClass, confidenceBand: 'medium', impact: 'attention', currentness: 'current', summary, evidenceSummary,
    sourceOwner: 'Timeline', provenance: { sourceOwner: 'Timeline', origin: 'deterministic', visibility: 'included', citationRequired: true, protectionClass: 'deterministic-only' },
    lifecycle: 'candidate', lineageId, recurrence: priorDecisions.some((item) => item.lineageId === lineageId) ? 'new-candidate' : 'first-observation',
    allowedActions: TIMELINE_ALLOWED_ACTIONS, createdAt: input.createdAt,
  };
}

export function runTimelineV1(input: TimelineInputV1): TimelineRunResultV1 {
  validate(input);
  const byKey = new Map(input.sourceRecords.map((item) => [sourceKey(item.sourceRef), item]));
  const allowedEvents = input.events.filter((item) => eligible(item.positionRefs, byKey));
  const blockedSourceCount = input.events.length - allowedEvents.length + input.pacing.filter((item) => !eligible(item.positionRefs, byKey)).length + input.pressure.filter((item) => !eligible(item.positionRefs, byKey)).length;
  const chronology = allowedEvents.map((item) => ({ eventId: item.eventId, unitId: item.unitId, label: item.label, orders: item.orders, durationUnits: item.durationUnits, temporalState: item.temporalState, positionRefs: item.positionRefs }));
  const findings: TimelineFindingV1[] = [];
  const manuscriptOrder = [...allowedEvents].filter((item) => item.orders.manuscript !== undefined).sort((a, b) => a.orders.manuscript! - b.orders.manuscript!);
  for (let index = 1; index < manuscriptOrder.length; index += 1) {
    const previous = manuscriptOrder[index - 1]!;
    const current = manuscriptOrder[index]!;
    if (previous.orders['story-world'] !== undefined && current.orders['story-world'] !== undefined && previous.orders['story-world'] > current.orders['story-world']) {
      findings.push(finding(input, 'chronology-review', `${previous.eventId}:${current.eventId}`, 'Story-world order differs from manuscript order', 'The explicit story-world and manuscript order references disagree; this may be an intentional flashback or reveal choice.', [...previous.positionRefs, ...current.positionRefs], [{ recordType: 'event', recordId: previous.eventId }, { recordType: 'event', recordId: current.eventId }], 'observed', input.priorDecisions));
    }
  }
  const pacingResult = input.pacing.map((item) => {
    const itemDirection = direction(item.plannedTempo, item.observedTempo);
    const durationMismatch = item.plannedDurationUnits !== undefined && item.observedDurationUnits !== undefined && item.plannedDurationUnits !== item.observedDurationUnits;
    const comparison: TimelinePacingComparisonV1 = { unitId: item.unitId, plannedTempo: item.plannedTempo, observedTempo: item.observedTempo, plannedDurationUnits: item.plannedDurationUnits, observedDurationUnits: item.observedDurationUnits, direction: itemDirection, isReviewOpportunity: itemDirection !== 'unknown' && itemDirection !== 'matches-planned' || durationMismatch, positionRefs: item.positionRefs };
    if (eligible(item.positionRefs, byKey) && comparison.isReviewOpportunity) {
      findings.push(finding(input, 'pacing-review', item.unitId, `Observed pacing is ${itemDirection === 'unknown' ? 'different from the planned duration' : itemDirection.replace('-than-planned', ' than planned')}`, 'This is a review opportunity, not an automatic defect; planned intent and observed evidence remain separate.', item.positionRefs, [{ recordType: 'pacing', recordId: item.unitId }], item.plannedTempo === undefined ? 'observed' : 'planned', input.priorDecisions));
    }
    return comparison;
  });
  const pressureMap = new Map<string, TimelinePressureProfileV1>();
  for (const item of input.pressure) {
    if (!eligible(item.positionRefs, byKey)) continue;
    const existing = pressureMap.get(item.eventId);
    pressureMap.set(item.eventId, { eventId: item.eventId, dimensions: { ...(existing?.dimensions ?? {}), [item.dimension]: item.band }, universalScore: null, positionRefs: [...(existing?.positionRefs ?? []), ...item.positionRefs] });
  }
  const pressureResult = [...pressureMap.values()];
  return { schemaVersion: TIMELINE_SCHEMA_VERSION, projectId: input.projectId, generation: input.generation, analysisId: input.analysisId, chronology, pacing: pacingResult, pressure: pressureResult, findings, blockedSourceCount, advisoryOnly: true, universalPressureScore: null, mutatedAuthorState: false, createdAt: input.createdAt };
}
