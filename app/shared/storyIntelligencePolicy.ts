import {
  STORY_INTELLIGENCE_HISTORY_LIMIT,
  STORY_INTELLIGENCE_POLICY_SCHEMA_VERSION,
  STORY_INTELLIGENCE_SCHEMA_VERSION,
  type ConfidenceBandV1,
  type CurrentnessV1,
  type DurableSignalV1,
  type EvidenceClassV1,
  type IntensityBandV1,
  type ProjectPostureV1,
  type SignalImpactV1,
  type SignalLifecycleV1,
  type SignalPostureV1,
  type StoryIntelligenceAnalysisPolicyV1,
  type StoryIntelligenceAuthorRecordV1,
  type StoryIntelligenceDocumentV1,
  type StoryIntelligenceHistoryEventV1,
  type StoryIntelligencePermissionOperationV1,
  type StoryIntelligencePermissionResultV1,
  type StoryIntelligenceProvenanceV1,
  type StoryIntelligenceSourceClassV1,
  type StoryPositionRefV1,
} from './ipc/storyIntelligence.js';

export const SIGNAL_POSTURES_V1 = ['off', 'ask-only', 'quiet', 'alert'] as const;
export const PROJECT_POSTURES_V1 = ['explore', 'develop', 'finish'] as const;
export const EVIDENCE_CLASSES_V1 = ['planned', 'observed', 'inferred', 'reader-effect-optional'] as const;
export const CONFIDENCE_BANDS_V1 = ['unknown', 'low', 'medium', 'high'] as const;
export const SIGNAL_IMPACTS_V1 = ['informational', 'attention', 'urgent', 'blocking'] as const;
export const SIGNAL_LIFECYCLES_V1 = [
  'candidate', 'reviewed', 'accepted', 'dismissed', 'suppressed', 'expired',
  'converted', 'resolved', 'superseded',
] as const;
export const CURRENTNESS_VALUES_V1 = ['current', 'stale', 'unavailable', 'trimmed'] as const;
export const INTENSITY_BANDS_V1 = ['very-low', 'low', 'medium', 'high', 'very-high'] as const;
export const SOURCE_CLASSES_V1 = [
  'included', 'deterministic-only', 'hidden', 'masked', 'deleted', 'forgotten',
  'discarded', 'local-only', 'protected', 'ai-excluded',
] as const;
export const PERMISSION_OPERATIONS_V1 = [
  'deterministic-analysis', 'model-package', 'display-metadata', 'persist',
] as const;

const PROTECTED_SOURCE_CLASSES = new Set<StoryIntelligenceSourceClassV1>([
  'hidden', 'masked', 'deleted', 'forgotten', 'discarded', 'protected', 'ai-excluded',
]);
const TERMINAL_LIFECYCLES = new Set<SignalLifecycleV1>([
  'dismissed', 'converted', 'resolved', 'expired', 'superseded',
]);

export class StoryIntelligenceValidationError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Story intelligence data is invalid: ${issues.join('; ')}`);
    this.name = 'StoryIntelligenceValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isOptionalBoundedString(value: unknown, maxLength: number): boolean {
  return value === undefined || isBoundedString(value, maxLength);
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function hasExactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.prototype.hasOwnProperty.call(value, key)) && Object.keys(value).every((key) => allowed.has(key));
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function isStoryPositionRefV1(value: unknown, projectId: string): value is StoryPositionRefV1 {
  if (!isRecord(value) || !hasExactKeys(value,
    ['projectId', 'sourceKind', 'sourceId', 'sourceRevision', 'sourceFingerprint'],
    ['anchorId', 'unitId', 'selectionFingerprint', 'orderIndex', 'orderBasis'])) return false;
  return value.projectId === projectId &&
    isOneOf(value.sourceKind, ['manuscript', 'assertion', 'outline', 'story-unit', 'character', 'lore', 'author-intent']) &&
    isBoundedString(value.sourceId, 240) &&
    isInteger(value.sourceRevision) &&
    isBoundedString(value.sourceFingerprint, 128) &&
    isOptionalBoundedString(value.anchorId, 240) &&
    isOptionalBoundedString(value.unitId, 240) &&
    isOptionalBoundedString(value.selectionFingerprint, 128) &&
    (value.orderIndex === undefined || isInteger(value.orderIndex)) &&
    (value.orderBasis === undefined || isOneOf(value.orderBasis, ['manuscript', 'story-world', 'planning', 'reveal', 'projection']));
}

export function isStoryIntelligenceProvenanceV1(value: unknown): value is StoryIntelligenceProvenanceV1 {
  if (!isRecord(value) || !hasExactKeys(value,
    ['sourceOwner', 'origin', 'visibility', 'citationRequired', 'protectionClass'])) return false;
  return isBoundedString(value.sourceOwner, 160) &&
    isOneOf(value.origin, ['author', 'deterministic', 'local-inference', 'system']) &&
    isOneOf(value.visibility, ['included', 'metadata-only']) &&
    typeof value.citationRequired === 'boolean' &&
    isOneOf(value.protectionClass, SOURCE_CLASSES_V1);
}

function isPolicy(value: unknown): value is StoryIntelligenceAnalysisPolicyV1 {
  if (!isRecord(value) || !hasExactKeys(value, [
    'schemaVersion', 'signalPosture', 'projectPosture', 'deterministicEnabled',
    'optionalInferenceEnabled', 'readerEffectLaneEnabled', 'allowedSourceClasses',
    'excludedSourceClasses', 'selectedScopePolicy', 'retentionPolicy', 'updatedAt',
  ])) return false;
  return value.schemaVersion === STORY_INTELLIGENCE_POLICY_SCHEMA_VERSION &&
    isOneOf(value.signalPosture, SIGNAL_POSTURES_V1) &&
    isOneOf(value.projectPosture, PROJECT_POSTURES_V1) &&
    typeof value.deterministicEnabled === 'boolean' &&
    typeof value.optionalInferenceEnabled === 'boolean' &&
    typeof value.readerEffectLaneEnabled === 'boolean' &&
    Array.isArray(value.allowedSourceClasses) && (value.allowedSourceClasses as unknown[]).every((item) => isOneOf(item, SOURCE_CLASSES_V1)) &&
    Array.isArray(value.excludedSourceClasses) && (value.excludedSourceClasses as unknown[]).every((item) => isOneOf(item, SOURCE_CLASSES_V1)) &&
    isOneOf(value.selectedScopePolicy, ['author-selected', 'project-local']) &&
    value.retentionPolicy === 'metadata-only-bounded' &&
    isIsoDate(value.updatedAt);
}

function isAuthorRecord(value: unknown, projectId: string): value is StoryIntelligenceAuthorRecordV1 {
  if (!isRecord(value) || !hasExactKeys(value,
    ['recordId', 'projectId', 'evidenceClass', 'label', 'positionRefs', 'provenance', 'createdAt', 'updatedAt'],
    ['unitId', 'intensityBand', 'recordKind', 'emotionLane', 'emotionIntensity', 'subjectLabel', 'currentness',
      'timelineWorldOrder', 'timelineTemporalState', 'pacingTempo', 'pressureDimension', 'pressureBand'])) return false;
  const emotionRecord = value.recordKind === 'emotion-graph';
  const timelineRecord = value.recordKind === 'timeline-event';
  const pacingRecord = value.recordKind === 'pacing-intent';
  const pressureRecord = value.recordKind === 'pressure-point';
  return value.projectId === projectId &&
    isBoundedString(value.recordId, 160) &&
    (value.unitId === undefined || isBoundedString(value.unitId, 160)) &&
    isOneOf(value.evidenceClass, ['planned', 'observed', 'reader-effect-optional']) &&
    isBoundedString(value.label, 240) &&
    (value.intensityBand === undefined || isOneOf(value.intensityBand, INTENSITY_BANDS_V1)) &&
    (value.recordKind === undefined || isOneOf(value.recordKind, ['general', 'emotion-graph', 'timeline-event', 'pacing-intent', 'pressure-point'])) &&
    (!emotionRecord || (isOneOf(value.emotionLane, ['planned', 'observed', 'reader-effect-optional']) &&
      isOneOf(value.emotionIntensity, ['very-low', 'low', 'medium', 'high', 'very-high', 'unknown']))) &&
    (!timelineRecord || (isInteger(value.timelineWorldOrder) &&
      isOneOf(value.timelineTemporalState, ['certain', 'uncertain', 'disputed', 'simultaneous', 'unavailable']))) &&
    (!pacingRecord || isOneOf(value.pacingTempo, ['very-slow', 'slow', 'steady', 'fast', 'very-fast'])) &&
    (!pressureRecord || (isOneOf(value.evidenceClass, ['planned', 'observed']) &&
      isOneOf(value.pressureDimension, ['urgency', 'consequence', 'constraint', 'conflict']) &&
      isOneOf(value.pressureBand, ['none', 'low', 'medium', 'high', 'very-high', 'unknown']))) &&
    (value.emotionLane === undefined || isOneOf(value.emotionLane, ['planned', 'observed', 'reader-effect-optional'])) &&
    (value.emotionIntensity === undefined || isOneOf(value.emotionIntensity, ['very-low', 'low', 'medium', 'high', 'very-high', 'unknown'])) &&
    (value.subjectLabel === undefined || isBoundedString(value.subjectLabel, 160)) &&
    (value.timelineWorldOrder === undefined || isInteger(value.timelineWorldOrder)) &&
    (value.timelineTemporalState === undefined || isOneOf(value.timelineTemporalState, ['certain', 'uncertain', 'disputed', 'simultaneous', 'unavailable'])) &&
    (value.pacingTempo === undefined || isOneOf(value.pacingTempo, ['very-slow', 'slow', 'steady', 'fast', 'very-fast'])) &&
    (value.pressureDimension === undefined || isOneOf(value.pressureDimension, ['urgency', 'consequence', 'constraint', 'conflict'])) &&
    (value.pressureBand === undefined || isOneOf(value.pressureBand, ['none', 'low', 'medium', 'high', 'very-high', 'unknown'])) &&
    (value.currentness === undefined || isOneOf(value.currentness, CURRENTNESS_VALUES_V1)) &&
    Array.isArray(value.positionRefs) && value.positionRefs.every((ref) => isStoryPositionRefV1(ref, projectId)) &&
    isStoryIntelligenceProvenanceV1(value.provenance) && isIsoDate(value.createdAt) && isIsoDate(value.updatedAt);
}

function isDurableSignal(value: unknown, projectId: string): value is DurableSignalV1 {
  if (!isRecord(value) || !hasExactKeys(value,
    ['schemaVersion', 'signalId', 'projectId', 'positionRefs', 'sourceOwner', 'evidenceClass',
      'impact', 'confidenceBand', 'currentness', 'lifecycle', 'summary', 'evidenceSummary',
      'provenance', 'createdAt', 'updatedAt'],
    ['sourceFindingId', 'disposition'])) return false;
  return value.schemaVersion === STORY_INTELLIGENCE_SCHEMA_VERSION &&
    isBoundedString(value.signalId, 160) && value.projectId === projectId &&
    isOptionalBoundedString(value.sourceFindingId, 160) &&
    Array.isArray(value.positionRefs) && value.positionRefs.every((ref) => isStoryPositionRefV1(ref, projectId)) &&
    isBoundedString(value.sourceOwner, 160) && isOneOf(value.evidenceClass, EVIDENCE_CLASSES_V1) &&
    isOneOf(value.impact, SIGNAL_IMPACTS_V1) && isOneOf(value.confidenceBand, CONFIDENCE_BANDS_V1) &&
    isOneOf(value.currentness, CURRENTNESS_VALUES_V1) && value.lifecycle !== 'candidate' &&
    isOneOf(value.lifecycle, SIGNAL_LIFECYCLES_V1) && isBoundedString(value.summary, 800) &&
    isBoundedString(value.evidenceSummary, 1200) && isStoryIntelligenceProvenanceV1(value.provenance) &&
    (value.disposition === undefined || isOneOf(value.disposition, ['dismissed', 'suppressed', 'expired', 'converted', 'resolved', 'superseded'])) &&
    isIsoDate(value.createdAt) && isIsoDate(value.updatedAt);
}

function isDisposition(value: unknown, projectId: string): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ['dispositionId', 'projectId', 'signalId', 'lifecycle', 'actor', 'createdAt'])) return false;
  return value.projectId === projectId && isBoundedString(value.dispositionId, 160) &&
    isBoundedString(value.signalId, 160) && isOneOf(value.lifecycle, ['dismissed', 'suppressed', 'expired', 'converted', 'resolved', 'superseded']) &&
    isOneOf(value.actor, ['author', 'system']) && isIsoDate(value.createdAt);
}

function isHistoryEvent(value: unknown, projectId: string): value is StoryIntelligenceHistoryEventV1 {
  if (!isRecord(value) || !hasExactKeys(value, ['eventId', 'projectId', 'eventType', 'subjectId', 'actor', 'createdAt'],
    ['sourceRevision', 'lifecycleBefore', 'lifecycleAfter', 'currentness', 'evidenceClass', 'provenanceRef'])) return false;
  return value.projectId === projectId && isBoundedString(value.eventId, 160) &&
    isOneOf(value.eventType, [
      'settings-updated', 'author-record-created', 'signal-accepted', 'signal-dismissed',
      'signal-suppressed', 'signal-expired', 'signal-converted', 'signal-resolved', 'signal-superseded',
    ]) && isBoundedString(value.subjectId, 160) &&
    (value.sourceRevision === undefined || isInteger(value.sourceRevision)) &&
    (value.lifecycleBefore === undefined || isOneOf(value.lifecycleBefore, SIGNAL_LIFECYCLES_V1)) &&
    (value.lifecycleAfter === undefined || isOneOf(value.lifecycleAfter, SIGNAL_LIFECYCLES_V1)) &&
    (value.currentness === undefined || isOneOf(value.currentness, CURRENTNESS_VALUES_V1)) &&
    (value.evidenceClass === undefined || isOneOf(value.evidenceClass, EVIDENCE_CLASSES_V1)) &&
    isOneOf(value.actor, ['author', 'deterministic', 'local-inference', 'system']) &&
    isOptionalBoundedString(value.provenanceRef, 160) && isIsoDate(value.createdAt);
}

export function defaultStoryIntelligencePolicy(now = new Date()): StoryIntelligenceAnalysisPolicyV1 {
  return {
    schemaVersion: STORY_INTELLIGENCE_POLICY_SCHEMA_VERSION,
    signalPosture: 'ask-only',
    projectPosture: 'develop',
    deterministicEnabled: true,
    optionalInferenceEnabled: false,
    readerEffectLaneEnabled: false,
    allowedSourceClasses: ['included', 'deterministic-only', 'local-only'],
    excludedSourceClasses: ['hidden', 'masked', 'deleted', 'forgotten', 'discarded', 'protected', 'ai-excluded'],
    selectedScopePolicy: 'author-selected',
    retentionPolicy: 'metadata-only-bounded',
    updatedAt: now.toISOString(),
  };
}

export function createDefaultStoryIntelligenceDocument(projectId: string, now = new Date()): StoryIntelligenceDocumentV1 {
  const timestamp = now.toISOString();
  return {
    schemaVersion: STORY_INTELLIGENCE_SCHEMA_VERSION,
    projectId,
    revision: 0,
    settings: {
      signalPosture: 'ask-only',
      projectPosture: 'develop',
      analysisPolicy: defaultStoryIntelligencePolicy(now),
    },
    unitPolicies: [],
    authorRecords: [],
    durableSignals: [],
    dispositions: [],
    history: [],
    updatedAt: timestamp,
  };
}

export function validateStoryIntelligenceDocument(value: unknown, projectId: string): StoryIntelligenceDocumentV1 {
  const issues: string[] = [];
  if (!isRecord(value) || !hasExactKeys(value, [
    'schemaVersion', 'projectId', 'revision', 'settings', 'unitPolicies',
    'authorRecords', 'durableSignals', 'dispositions', 'history', 'updatedAt',
  ])) {
    throw new StoryIntelligenceValidationError(['document shape is not supported']);
  }
  if (value.schemaVersion !== STORY_INTELLIGENCE_SCHEMA_VERSION) issues.push('unsupported schema version');
  if (value.projectId !== projectId) issues.push('project identity mismatch');
  if (!isInteger(value.revision)) issues.push('revision is invalid');
  if (!isRecord(value.settings) || !hasExactKeys(value.settings, ['signalPosture', 'projectPosture', 'analysisPolicy']) ||
    !isOneOf(value.settings.signalPosture, SIGNAL_POSTURES_V1) ||
    !isOneOf(value.settings.projectPosture, PROJECT_POSTURES_V1) ||
    !isPolicy(value.settings.analysisPolicy)) issues.push('settings are invalid');
  if (!Array.isArray(value.unitPolicies) || !value.unitPolicies.every((item) => {
    if (!isRecord(item) || !hasExactKeys(item, ['unitId', 'enabled', 'updatedAt'], ['signalPosture', 'projectPosture'])) return false;
    return isBoundedString(item.unitId, 160) && typeof item.enabled === 'boolean' &&
      (item.signalPosture === undefined || isOneOf(item.signalPosture, SIGNAL_POSTURES_V1)) &&
      (item.projectPosture === undefined || isOneOf(item.projectPosture, PROJECT_POSTURES_V1)) && isIsoDate(item.updatedAt);
  })) issues.push('unit policies are invalid');
  if (!Array.isArray(value.authorRecords) || !value.authorRecords.every((item) => isAuthorRecord(item, projectId))) issues.push('author records are invalid');
  if (!Array.isArray(value.durableSignals) || !value.durableSignals.every((item) => isDurableSignal(item, projectId))) issues.push('durable signals are invalid');
  if (!Array.isArray(value.dispositions) || !value.dispositions.every((item) => isDisposition(item, projectId))) issues.push('dispositions are invalid');
  if (!Array.isArray(value.history) || value.history.length > STORY_INTELLIGENCE_HISTORY_LIMIT ||
    !value.history.every((item) => isHistoryEvent(item, projectId))) issues.push('history is invalid or exceeds the bounded limit');
  if (!isIsoDate(value.updatedAt)) issues.push('updatedAt is invalid');
  if (issues.length > 0) throw new StoryIntelligenceValidationError(issues);
  return value as unknown as StoryIntelligenceDocumentV1;
}

export function trimStoryIntelligenceHistory(
  history: readonly StoryIntelligenceHistoryEventV1[],
): readonly StoryIntelligenceHistoryEventV1[] {
  return history.length <= STORY_INTELLIGENCE_HISTORY_LIMIT
    ? history
    : history.slice(history.length - STORY_INTELLIGENCE_HISTORY_LIMIT);
}

export function canTransitionSignalLifecycle(from: SignalLifecycleV1, to: SignalLifecycleV1): boolean {
  if (from === 'candidate') return to === 'reviewed' || to === 'dismissed' || to === 'expired';
  if (from === 'reviewed') return ['accepted', 'dismissed', 'suppressed', 'expired', 'converted', 'resolved'].includes(to);
  if (from === 'accepted') return ['suppressed', 'converted', 'resolved', 'expired', 'superseded'].includes(to);
  if (from === 'suppressed') return ['reviewed', 'accepted', 'resolved', 'expired'].includes(to);
  return !TERMINAL_LIFECYCLES.has(from) && from !== to;
}

export function deriveStoryPositionCurrentness(
  reference: Pick<StoryPositionRefV1, 'sourceRevision' | 'sourceFingerprint'>,
  current: { readonly available: boolean; readonly sourceRevision?: number; readonly sourceFingerprint?: string },
): CurrentnessV1 {
  if (!current.available) return 'unavailable';
  if (current.sourceRevision !== reference.sourceRevision || current.sourceFingerprint !== reference.sourceFingerprint) return 'stale';
  return 'current';
}

export function checkStoryIntelligencePermission(
  sourceClass: StoryIntelligenceSourceClassV1,
  operation: StoryIntelligencePermissionOperationV1,
  policy: StoryIntelligenceAnalysisPolicyV1,
): StoryIntelligencePermissionResultV1 {
  if (operation === 'display-metadata' && PROTECTED_SOURCE_CLASSES.has(sourceClass)) {
    return { allowed: true, sourceClass, operation, metadataOnly: true, reason: 'protected-metadata-only' };
  }
  if (PROTECTED_SOURCE_CLASSES.has(sourceClass)) {
    return { allowed: false, sourceClass, operation, metadataOnly: false, reason: 'excluded-from-analysis' };
  }
  if (!policy.allowedSourceClasses.includes(sourceClass)) {
    return { allowed: false, sourceClass, operation, metadataOnly: false, reason: 'not-allowed-by-policy' };
  }
  if (operation === 'model-package' && sourceClass === 'deterministic-only') {
    return { allowed: false, sourceClass, operation, metadataOnly: false, reason: 'deterministic-only' };
  }
  if (operation === 'deterministic-analysis' && !policy.deterministicEnabled) {
    return { allowed: false, sourceClass, operation, metadataOnly: false, reason: 'policy-disabled' };
  }
  if (operation === 'model-package' && !policy.optionalInferenceEnabled) {
    return { allowed: false, sourceClass, operation, metadataOnly: false, reason: 'policy-disabled' };
  }
  return { allowed: true, sourceClass, operation, metadataOnly: false, reason: 'allowed' };
}

export function isDurableSignalLifecycle(value: SignalLifecycleV1): value is DurableSignalV1['lifecycle'] {
  return value !== 'candidate';
}

export function isTerminalSignalLifecycle(value: SignalLifecycleV1): boolean {
  return TERMINAL_LIFECYCLES.has(value);
}

export type StoryIntelligenceContractValueV1 =
  | SignalPostureV1
  | ProjectPostureV1
  | EvidenceClassV1
  | ConfidenceBandV1
  | SignalImpactV1
  | SignalLifecycleV1
  | CurrentnessV1
  | IntensityBandV1;
