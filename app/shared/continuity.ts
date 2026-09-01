import {
  type ConfidenceBandV1,
  type CurrentnessV1,
  type SignalImpactV1,
  type StoryIntelligenceProvenanceV1,
  type StoryIntelligenceSourceClassV1,
  type StoryPositionRefV1,
} from './ipc/storyIntelligence.js';
import {
  isStoryIntelligenceProvenanceV1,
  isStoryPositionRefV1,
} from './storyIntelligencePolicy.js';

export const CONTINUITY_SCHEMA_VERSION = 'BlackSkiesContinuity v1' as const;
export const CONTINUITY_CATEGORIES = ['contradiction', 'omission', 'causality', 'drift'] as const;
export const CONTINUITY_ALLOWED_ACTIONS = [
  'return-to-source',
  'dismiss',
  'mark-intentional',
  'park',
  'save-feedback-note-candidate',
  'elevate-durable-signal',
] as const;
export const CONTINUITY_INTERPRETATION_STATES = [
  'ordinary',
  'unreliable-narration',
  'false-belief',
  'intentional-ambiguity',
  'disputed',
  'hidden',
  'unrevealed',
  'red-herring',
  'unknown',
  'intentional-divergence',
] as const;

export type ContinuityCategoryV1 = typeof CONTINUITY_CATEGORIES[number];
export type ContinuityAllowedActionV1 = typeof CONTINUITY_ALLOWED_ACTIONS[number];
export type ContinuityInterpretationStateV1 = typeof CONTINUITY_INTERPRETATION_STATES[number];
export type ContinuityFactStatusV1 = 'locked' | 'accepted';

export interface ContinuitySourceRecordV1 {
  readonly sourceRef: StoryPositionRefV1;
  readonly sourceClass: StoryIntelligenceSourceClassV1;
  readonly currentness: CurrentnessV1;
}

export interface ContinuityUnitRecordV1 {
  readonly unitId: string;
  readonly explicitPovMetadata?: string;
  readonly interpretationState: ContinuityInterpretationStateV1;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export interface ContinuityFactRecordV1 {
  readonly factId: string;
  readonly subjectId: string;
  readonly attribute: string;
  readonly value: string | number | boolean | null;
  readonly status: ContinuityFactStatusV1;
  readonly interpretationState: ContinuityInterpretationStateV1;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export interface ContinuityEventRecordV1 {
  readonly eventId: string;
  readonly unitId: string;
  readonly stableEventIdentity?: string;
  readonly duplicateOfEventId?: string;
  readonly interpretationState: ContinuityInterpretationStateV1;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export interface ContinuityCarryoverRequirementV1 {
  readonly requirementId: string;
  readonly fromEventId: string;
  readonly toUnitId: string;
  readonly requiredKey: string;
  readonly nextRecordAvailable: boolean;
  readonly nextRecordKeys: readonly string[];
  readonly interpretationState: ContinuityInterpretationStateV1;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export interface ContinuityCausalDependencyV1 {
  readonly dependencyId: string;
  readonly eventId: string;
  readonly predecessorEventId: string;
  readonly interpretationState: ContinuityInterpretationStateV1;
  readonly positionRefs: readonly StoryPositionRefV1[];
}

export interface ContinuityDecisionLineageV1 {
  readonly lineageId: string;
  readonly priorFindingId: string;
  readonly disposition: 'dismissed' | 'suppressed' | 'resolved' | 'intentional' | 'parked';
}

export interface ContinuityInputV1 {
  readonly schemaVersion: typeof CONTINUITY_SCHEMA_VERSION;
  readonly projectId: string;
  readonly generation: number;
  readonly analysisId: string;
  readonly projectPovExpectation?: string;
  readonly units: readonly ContinuityUnitRecordV1[];
  readonly facts: readonly ContinuityFactRecordV1[];
  readonly events: readonly ContinuityEventRecordV1[];
  readonly carryoverRequirements: readonly ContinuityCarryoverRequirementV1[];
  readonly causalDependencies: readonly ContinuityCausalDependencyV1[];
  readonly sourceRecords: readonly ContinuitySourceRecordV1[];
  readonly priorDecisions: readonly ContinuityDecisionLineageV1[];
  readonly createdAt: string;
}

export interface ContinuityEvidenceRefV1 {
  readonly recordType: 'unit' | 'fact' | 'event' | 'anchor' | 'carryover' | 'causal-dependency';
  readonly recordId: string;
}

export interface ContinuityFindingV1 {
  readonly schemaVersion: typeof CONTINUITY_SCHEMA_VERSION;
  readonly findingId: string;
  readonly projectId: string;
  readonly generation: number;
  readonly analysisId: string;
  readonly category: ContinuityCategoryV1;
  readonly producerId: string;
  readonly scope: string;
  readonly positionRefs: readonly StoryPositionRefV1[];
  readonly evidenceRefs: readonly ContinuityEvidenceRefV1[];
  readonly evidenceClass: 'observed';
  readonly confidenceBand: ConfidenceBandV1;
  readonly impact: SignalImpactV1;
  readonly currentness: CurrentnessV1;
  readonly summary: string;
  readonly evidenceSummary: string;
  readonly sourceOwner: 'Continuity';
  readonly provenance: StoryIntelligenceProvenanceV1;
  readonly lifecycle: 'candidate';
  readonly lineageId: string;
  readonly recurrence: 'first-observation' | 'new-candidate';
  readonly allowedActions: readonly ContinuityAllowedActionV1[];
  readonly createdAt: string;
}

export interface ContinuityRunResultV1 {
  readonly schemaVersion: typeof CONTINUITY_SCHEMA_VERSION;
  readonly projectId: string;
  readonly generation: number;
  readonly analysisId: string;
  readonly findings: readonly ContinuityFindingV1[];
  readonly blockedSourceCount: number;
  readonly advisoryOnly: true;
  readonly mutatedAuthorState: false;
  readonly createdAt: string;
}

export class ContinuityValidationError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Continuity data is invalid: ${issues.join('; ')}`);
    this.name = 'ContinuityValidationError';
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.prototype.hasOwnProperty.call(value, key)) && Object.keys(value).every((key) => allowed.has(key));
}

function bounded(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}

function isoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function oneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function primitive(value: unknown): value is string | number | boolean | null {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function interpretationIsProtected(value: ContinuityInterpretationStateV1): boolean {
  return value !== 'ordinary';
}

function referenceKey(reference: StoryPositionRefV1): string {
  return [reference.projectId, reference.sourceKind, reference.sourceId, reference.anchorId ?? ''].join('|');
}

function recordRefs(value: unknown, projectId: string): value is readonly StoryPositionRefV1[] {
  return Array.isArray(value) && value.length > 0 && value.every((ref) => isStoryPositionRefV1(ref, projectId));
}

function validateSourceRecord(value: unknown, projectId: string): boolean {
  if (!record(value) || !exactKeys(value, ['sourceRef', 'sourceClass', 'currentness'])) return false;
  return isStoryPositionRefV1(value.sourceRef, projectId) &&
    oneOf(value.sourceClass, ['included', 'deterministic-only', 'hidden', 'masked', 'deleted', 'forgotten', 'discarded', 'local-only', 'protected', 'ai-excluded']) &&
    oneOf(value.currentness, ['current', 'stale', 'unavailable', 'trimmed']);
}

function validateUnit(value: unknown, projectId: string): boolean {
  if (!record(value) || !exactKeys(value, ['unitId', 'interpretationState', 'positionRefs'], ['explicitPovMetadata'])) return false;
  return bounded(value.unitId, 160) &&
    (value.explicitPovMetadata === undefined || bounded(value.explicitPovMetadata, 160)) &&
    oneOf(value.interpretationState, CONTINUITY_INTERPRETATION_STATES) && recordRefs(value.positionRefs, projectId);
}

function validateFact(value: unknown, projectId: string): boolean {
  if (!record(value) || !exactKeys(value, ['factId', 'subjectId', 'attribute', 'value', 'status', 'interpretationState', 'positionRefs'])) return false;
  return bounded(value.factId, 160) && bounded(value.subjectId, 160) && bounded(value.attribute, 160) && primitive(value.value) &&
    oneOf(value.status, ['locked', 'accepted']) && oneOf(value.interpretationState, CONTINUITY_INTERPRETATION_STATES) && recordRefs(value.positionRefs, projectId);
}

function validateEvent(value: unknown, projectId: string): boolean {
  if (!record(value) || !exactKeys(value, ['eventId', 'unitId', 'interpretationState', 'positionRefs'], ['stableEventIdentity', 'duplicateOfEventId'])) return false;
  return bounded(value.eventId, 160) && bounded(value.unitId, 160) &&
    (value.stableEventIdentity === undefined || bounded(value.stableEventIdentity, 200)) &&
    (value.duplicateOfEventId === undefined || bounded(value.duplicateOfEventId, 160)) &&
    oneOf(value.interpretationState, CONTINUITY_INTERPRETATION_STATES) && recordRefs(value.positionRefs, projectId);
}

function validateCarryover(value: unknown, projectId: string): boolean {
  if (!record(value) || !exactKeys(value, ['requirementId', 'fromEventId', 'toUnitId', 'requiredKey', 'nextRecordAvailable', 'nextRecordKeys', 'interpretationState', 'positionRefs'])) return false;
  return bounded(value.requirementId, 160) && bounded(value.fromEventId, 160) && bounded(value.toUnitId, 160) && bounded(value.requiredKey, 160) &&
    typeof value.nextRecordAvailable === 'boolean' && Array.isArray(value.nextRecordKeys) && value.nextRecordKeys.every((key) => bounded(key, 160)) &&
    oneOf(value.interpretationState, CONTINUITY_INTERPRETATION_STATES) && recordRefs(value.positionRefs, projectId);
}

function validateCausal(value: unknown, projectId: string): boolean {
  if (!record(value) || !exactKeys(value, ['dependencyId', 'eventId', 'predecessorEventId', 'interpretationState', 'positionRefs'])) return false;
  return bounded(value.dependencyId, 160) && bounded(value.eventId, 160) && bounded(value.predecessorEventId, 160) &&
    oneOf(value.interpretationState, CONTINUITY_INTERPRETATION_STATES) && recordRefs(value.positionRefs, projectId);
}

export function validateContinuityInput(value: unknown): ContinuityInputV1 {
  if (!record(value) || !exactKeys(value, [
    'schemaVersion', 'projectId', 'generation', 'analysisId', 'units', 'facts', 'events',
    'carryoverRequirements', 'causalDependencies', 'sourceRecords', 'priorDecisions', 'createdAt',
  ], ['projectPovExpectation'])) throw new ContinuityValidationError(['input shape is not supported']);
  const projectId = value.projectId;
  const issues: string[] = [];
  if (value.schemaVersion !== CONTINUITY_SCHEMA_VERSION) issues.push('unsupported schema version');
  if (!bounded(projectId, 160)) issues.push('project identity is invalid');
  if (!integer(value.generation)) issues.push('generation is invalid');
  if (!bounded(value.analysisId, 160)) issues.push('analysis identity is invalid');
  if (value.projectPovExpectation !== undefined && !bounded(value.projectPovExpectation, 160)) issues.push('project POV expectation is invalid');
  if (!Array.isArray(value.units) || !value.units.every((item) => validateUnit(item, projectId as string))) issues.push('units are invalid');
  if (!Array.isArray(value.facts) || !value.facts.every((item) => validateFact(item, projectId as string))) issues.push('facts are invalid');
  if (!Array.isArray(value.events) || !value.events.every((item) => validateEvent(item, projectId as string))) issues.push('events are invalid');
  if (!Array.isArray(value.carryoverRequirements) || !value.carryoverRequirements.every((item) => validateCarryover(item, projectId as string))) issues.push('carryover requirements are invalid');
  if (!Array.isArray(value.causalDependencies) || !value.causalDependencies.every((item) => validateCausal(item, projectId as string))) issues.push('causal dependencies are invalid');
  if (!Array.isArray(value.sourceRecords) || !value.sourceRecords.every((item) => validateSourceRecord(item, projectId as string))) issues.push('source records are invalid');
  if (!Array.isArray(value.priorDecisions) || !value.priorDecisions.every((item) => record(item) && exactKeys(item, ['lineageId', 'priorFindingId', 'disposition']) && bounded(item.lineageId, 200) && bounded(item.priorFindingId, 160) && oneOf(item.disposition, ['dismissed', 'suppressed', 'resolved', 'intentional', 'parked']))) issues.push('prior decisions are invalid');
  if (!isoDate(value.createdAt)) issues.push('createdAt is invalid');
  if (issues.length > 0) throw new ContinuityValidationError(issues);
  return value as unknown as ContinuityInputV1;
}

function currentnessFor(refs: readonly StoryPositionRefV1[], sources: ReadonlyMap<string, ContinuitySourceRecordV1>): CurrentnessV1 {
  const states = refs.map((ref) => sources.get(referenceKey(ref))?.currentness ?? 'unavailable');
  if (states.includes('unavailable')) return 'unavailable';
  if (states.includes('stale')) return 'stale';
  if (states.includes('trimmed')) return 'trimmed';
  return 'current';
}

function sourceClassFor(refs: readonly StoryPositionRefV1[], sources: ReadonlyMap<string, ContinuitySourceRecordV1>): StoryIntelligenceSourceClassV1 {
  return refs.map((ref) => sources.get(referenceKey(ref))?.sourceClass ?? 'included').find((sourceClass) => sourceClass !== 'included') ?? 'included';
}

function allowedActions(currentness: CurrentnessV1): readonly ContinuityAllowedActionV1[] {
  return currentness === 'current'
    ? CONTINUITY_ALLOWED_ACTIONS
    : CONTINUITY_ALLOWED_ACTIONS.filter((action) => action !== 'elevate-durable-signal');
}

function stableLineage(input: ContinuityInputV1, producerId: string, ids: readonly string[]): string {
  return `continuity:${input.projectId}:${input.generation}:${producerId}:${ids.join(',')}`;
}

function stableFindingId(input: ContinuityInputV1, producerId: string, ids: readonly string[]): string {
  return `${input.analysisId}:${producerId}:${ids.join('-')}`.slice(0, 160);
}

function makeFinding(
  input: ContinuityInputV1,
  sources: ReadonlyMap<string, ContinuitySourceRecordV1>,
  category: ContinuityCategoryV1,
  producerId: string,
  ids: readonly string[],
  scope: string,
  positionRefs: readonly StoryPositionRefV1[],
  evidenceRefs: readonly ContinuityEvidenceRefV1[],
  confidenceBand: ConfidenceBandV1,
  impact: SignalImpactV1,
  summary: string,
  evidenceSummary: string,
): ContinuityFindingV1 {
  const currentness = currentnessFor(positionRefs, sources);
  const lineageId = stableLineage(input, producerId, ids);
  const prior = input.priorDecisions.some((decision) => decision.lineageId === lineageId);
  const protectionClass = sourceClassFor(positionRefs, sources);
  return {
    schemaVersion: CONTINUITY_SCHEMA_VERSION,
    findingId: stableFindingId(input, producerId, ids),
    projectId: input.projectId,
    generation: input.generation,
    analysisId: input.analysisId,
    category,
    producerId,
    scope,
    positionRefs,
    evidenceRefs,
    evidenceClass: 'observed',
    confidenceBand,
    impact,
    currentness,
    summary,
    evidenceSummary,
    sourceOwner: 'Continuity',
    provenance: {
      sourceOwner: 'Continuity',
      origin: 'deterministic',
      visibility: 'metadata-only',
      citationRequired: true,
      protectionClass,
    },
    lifecycle: 'candidate',
    lineageId,
    recurrence: prior ? 'new-candidate' : 'first-observation',
    allowedActions: allowedActions(currentness),
    createdAt: input.createdAt,
  };
}

function usable(refs: readonly StoryPositionRefV1[], sources: ReadonlyMap<string, ContinuitySourceRecordV1>): boolean {
  return sourceClassFor(refs, sources) !== 'hidden' &&
    sourceClassFor(refs, sources) !== 'masked' &&
    sourceClassFor(refs, sources) !== 'deleted' &&
    sourceClassFor(refs, sources) !== 'forgotten' &&
    sourceClassFor(refs, sources) !== 'discarded' &&
    sourceClassFor(refs, sources) !== 'protected' &&
    sourceClassFor(refs, sources) !== 'ai-excluded';
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

function findingOrder(left: ContinuityFindingV1, right: ContinuityFindingV1): number {
  return left.category.localeCompare(right.category) || left.producerId.localeCompare(right.producerId) || left.findingId.localeCompare(right.findingId);
}

export function runContinuityV1(rawInput: ContinuityInputV1): ContinuityRunResultV1 {
  const input = validateContinuityInput(rawInput);
  const sources = new Map(input.sourceRecords.map((source) => [referenceKey(source.sourceRef), source]));
  const findings: ContinuityFindingV1[] = [];
  let blockedSourceCount = 0;
  const add = (...finding: ContinuityFindingV1[]) => findings.push(...finding.filter((item) => usable(item.positionRefs, sources)));

  for (const source of input.sourceRecords) {
    if (!usable([source.sourceRef], sources)) { blockedSourceCount += 1; continue; }
    if (source.currentness !== 'current') {
      add(makeFinding(input, sources, 'drift', 'anchor-currentness', [source.sourceRef.sourceId], 'source anchor', [source.sourceRef], [
        { recordType: 'anchor', recordId: source.sourceRef.sourceId },
      ], 'medium', 'informational', 'A source anchor needs revalidation.', `The structured source anchor is ${source.currentness}.`));
    }
  }

  if (input.projectPovExpectation) {
    for (const unit of input.units) {
      if (!unit.explicitPovMetadata || interpretationIsProtected(unit.interpretationState) || !usable(unit.positionRefs, sources)) continue;
      if (normalize(input.projectPovExpectation) !== normalize(unit.explicitPovMetadata)) {
        add(makeFinding(input, sources, 'drift', 'pov-mismatch', [unit.unitId], `unit ${unit.unitId}`, unit.positionRefs, [
          { recordType: 'unit', recordId: unit.unitId },
        ], 'high', 'attention', 'Explicit POV metadata differs from the project expectation.', 'The project expectation and unit metadata are different structured values.'));
      }
    }
  }

  const factsByKey = new Map<string, ContinuityFactRecordV1[]>();
  for (const fact of input.facts) {
    if (fact.status === 'accepted' || fact.status === 'locked') {
      const key = `${fact.subjectId}|${fact.attribute}`;
      factsByKey.set(key, [...(factsByKey.get(key) ?? []), fact]);
    }
  }
  for (const facts of factsByKey.values()) {
    const distinct = facts.filter((fact, index) => facts.findIndex((other) => JSON.stringify(other.value) === JSON.stringify(fact.value)) === index);
    const ordinary = distinct.filter((fact) => !interpretationIsProtected(fact.interpretationState));
    if (ordinary.length < 2) continue;
    const left = ordinary[0]!; const right = ordinary[1]!;
    if (JSON.stringify(left.value) === JSON.stringify(right.value) || !usable([...left.positionRefs, ...right.positionRefs], sources)) continue;
    add(makeFinding(input, sources, 'contradiction', 'locked-fact-conflict', [left.factId, right.factId], `fact ${left.subjectId}/${left.attribute}`, [...left.positionRefs, ...right.positionRefs], [
      { recordType: 'fact', recordId: left.factId }, { recordType: 'fact', recordId: right.factId },
    ], 'high', 'attention', 'Explicit structured facts conflict.', 'Two locked or accepted values for the same subject and attribute differ.'));
  }

  const eventById = new Map(input.events.map((event) => [event.eventId, event]));
  const identityGroups = new Map<string, ContinuityEventRecordV1[]>();
  for (const event of input.events) {
    if (event.stableEventIdentity) identityGroups.set(event.stableEventIdentity, [...(identityGroups.get(event.stableEventIdentity) ?? []), event]);
  }
  for (const group of identityGroups.values()) {
    if (group.length < 2 || group.some((event) => interpretationIsProtected(event.interpretationState))) continue;
    const first = group[0]!; const second = group[1]!;
    if (!usable([...first.positionRefs, ...second.positionRefs], sources)) continue;
    add(makeFinding(input, sources, 'contradiction', 'duplicate-event-identity', [first.eventId, second.eventId], 'structured event identity', [...first.positionRefs, ...second.positionRefs], [
      { recordType: 'event', recordId: first.eventId }, { recordType: 'event', recordId: second.eventId },
    ], 'medium', 'attention', 'Structured events share a stable identity.', 'The same stable event identity appears in more than one explicit event record.'));
  }
  for (const event of input.events) {
    if (!event.duplicateOfEventId || !eventById.has(event.duplicateOfEventId) || interpretationIsProtected(event.interpretationState) || !usable(event.positionRefs, sources)) continue;
    const other = eventById.get(event.duplicateOfEventId)!;
    if (interpretationIsProtected(other.interpretationState) || !usable(other.positionRefs, sources)) continue;
    add(makeFinding(input, sources, 'contradiction', 'explicit-duplicate-reference', [event.eventId, other.eventId], 'explicit duplicate reference', [...event.positionRefs, ...other.positionRefs], [
      { recordType: 'event', recordId: event.eventId }, { recordType: 'event', recordId: other.eventId },
    ], 'high', 'attention', 'A structured event explicitly references a duplicate.', 'The event record points to another event as its duplicate.'));
  }

  for (const requirement of input.carryoverRequirements) {
    if (!requirement.nextRecordAvailable || requirement.nextRecordKeys.includes(requirement.requiredKey) || interpretationIsProtected(requirement.interpretationState) || !usable(requirement.positionRefs, sources)) continue;
    add(makeFinding(input, sources, 'omission', 'required-carryover', [requirement.requirementId], `carryover ${requirement.toUnitId}`, requirement.positionRefs, [
      { recordType: 'carryover', recordId: requirement.requirementId }, { recordType: 'event', recordId: requirement.fromEventId },
    ], 'low', 'informational', 'An author-defined carryover key is absent from the next explicit record.', 'The next structured record is available but does not contain the required carryover key.'));
  }

  for (const dependency of input.causalDependencies) {
    if (interpretationIsProtected(dependency.interpretationState) || !usable(dependency.positionRefs, sources)) continue;
    const predecessor = eventById.get(dependency.predecessorEventId);
    const predecessorUsable = predecessor && !interpretationIsProtected(predecessor.interpretationState) && usable(predecessor.positionRefs, sources);
    if (predecessorUsable) continue;
    add(makeFinding(input, sources, 'causality', 'missing-causal-predecessor', [dependency.dependencyId, dependency.eventId, dependency.predecessorEventId], `causal dependency ${dependency.dependencyId}`, dependency.positionRefs, [
      { recordType: 'causal-dependency', recordId: dependency.dependencyId }, { recordType: 'event', recordId: dependency.eventId }, { recordType: 'event', recordId: dependency.predecessorEventId },
    ], 'medium', 'attention', 'A structured event points to an unavailable predecessor.', 'The required predecessor is missing or its explicit source is not usable.'));
  }

  findings.sort(findingOrder);
  return {
    schemaVersion: CONTINUITY_SCHEMA_VERSION,
    projectId: input.projectId,
    generation: input.generation,
    analysisId: input.analysisId,
    findings,
    blockedSourceCount,
    advisoryOnly: true,
    mutatedAuthorState: false,
    createdAt: input.createdAt,
  };
}

export function validateContinuityFinding(value: unknown, projectId: string, generation: number): ContinuityFindingV1 {
  if (!record(value) || !exactKeys(value, [
    'schemaVersion', 'findingId', 'projectId', 'generation', 'analysisId', 'category', 'producerId', 'scope', 'positionRefs', 'evidenceRefs',
    'evidenceClass', 'confidenceBand', 'impact', 'currentness', 'summary', 'evidenceSummary', 'sourceOwner', 'provenance', 'lifecycle',
    'lineageId', 'recurrence', 'allowedActions', 'createdAt',
  ])) throw new ContinuityValidationError(['finding shape is not supported']);
  if (value.schemaVersion !== CONTINUITY_SCHEMA_VERSION || value.projectId !== projectId || value.generation !== generation ||
    !bounded(value.findingId, 160) || !bounded(value.analysisId, 160) || !oneOf(value.category, CONTINUITY_CATEGORIES) || !bounded(value.producerId, 160) ||
    !bounded(value.scope, 240) || !recordRefs(value.positionRefs, projectId) || !Array.isArray(value.evidenceRefs) ||
    !value.evidenceRefs.every((item) => record(item) && exactKeys(item, ['recordType', 'recordId']) && oneOf(item.recordType, ['unit', 'fact', 'event', 'anchor', 'carryover', 'causal-dependency']) && bounded(item.recordId, 160)) ||
    value.evidenceClass !== 'observed' || !oneOf(value.confidenceBand, ['unknown', 'low', 'medium', 'high']) || !oneOf(value.impact, ['informational', 'attention', 'urgent', 'blocking']) ||
    !oneOf(value.currentness, ['current', 'stale', 'unavailable', 'trimmed']) || !bounded(value.summary, 800) || !bounded(value.evidenceSummary, 1200) ||
    value.sourceOwner !== 'Continuity' || !isStoryIntelligenceProvenanceV1(value.provenance) || value.lifecycle !== 'candidate' || !bounded(value.lineageId, 240) ||
    !oneOf(value.recurrence, ['first-observation', 'new-candidate']) || !Array.isArray(value.allowedActions) || !value.allowedActions.every((action) => oneOf(action, CONTINUITY_ALLOWED_ACTIONS)) || !isoDate(value.createdAt)) {
    throw new ContinuityValidationError(['finding shape, binding, or advisory policy is invalid']);
  }
  return value as unknown as ContinuityFindingV1;
}
