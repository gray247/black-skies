import type {
  ConfidenceBandV1,
  EvidenceClassV1,
  StoryIntelligenceProvenanceV1,
  StoryIntelligenceSourceClassV1,
  StoryPositionRefV1,
} from './storyIntelligence.js';
import {
  isStoryIntelligenceProvenanceV1,
  isStoryPositionRefV1,
} from '../storyIntelligencePolicy.js';

export const AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION =
  'BlackSkiesAutomaticStoryIntelligence v1' as const;
export const AUTOMATIC_STORY_INTELLIGENCE_LENSES = [
  'emotion', 'continuity', 'timeline', 'pacing', 'pressure', 'signals',
] as const;
export const AUTOMATIC_STORY_INTELLIGENCE_BOUNDS = {
  maxUnits: 256, maxExcludedUnits: 256, maxFindingsPerLens: 128, maxFindings: 512,
  maxBodyChars: 500_000, maxEvidenceSummaryLength: 1_200, maxSummaryLength: 800,
  maxReasonLength: 240,
} as const;

export type AutomaticStoryIntelligenceLensV1 = (typeof AUTOMATIC_STORY_INTELLIGENCE_LENSES)[number];
export type AutomaticStoryIntelligenceOriginV1 = 'deterministic' | 'local-inference';
export type AutomaticStoryIntelligenceRunStatusV1 =
  | 'idle' | 'running' | 'completed' | 'cancelled' | 'failed' | 'stale';
export type AutomaticStoryIntelligenceUncertaintyV1 = 'unknown' | 'low' | 'medium' | 'high';

export interface AutomaticStoryIntelligenceRunIdentityV1 {
  readonly runId: string;
  readonly cancellationId: string;
  readonly rerunOfRunId?: string;
}
export interface AutomaticStoryIntelligenceExactAnchorV1 {
  readonly unitId: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly selectionFingerprint: string;
  readonly bodySha256: string;
  readonly orderIndex: number;
  readonly orderBasis: 'manuscript';
}
export interface AutomaticStoryIntelligenceSavedUnitV1 {
  readonly unitId: string;
  readonly orderIndex: number;
  readonly orderBasis: 'manuscript';
  readonly body: string;
  readonly bodySha256: string;
  readonly protectionClass: StoryIntelligenceSourceClassV1;
  readonly enabled: true;
  readonly sourceRef: StoryPositionRefV1;
  readonly anchor: AutomaticStoryIntelligenceExactAnchorV1;
}
export type AutomaticStoryIntelligenceUnitInputV1 = AutomaticStoryIntelligenceSavedUnitV1;
export type AutomaticStoryIntelligenceSavedUnitInputV1 = AutomaticStoryIntelligenceSavedUnitV1;
export interface AutomaticStoryIntelligenceExcludedUnitV1 {
  readonly unitId: string;
  readonly orderIndex: number;
  readonly orderBasis: 'manuscript';
  readonly protectionClass: StoryIntelligenceSourceClassV1;
  readonly exclusionReason: 'protected' | 'policy' | 'unavailable';
}
export type AutomaticStoryIntelligenceExcludedUnitMetadataV1 = AutomaticStoryIntelligenceExcludedUnitV1;
export interface AutomaticStoryIntelligenceRerunIdentityV1 { readonly runId: string; readonly analysisId: string; }
export interface AutomaticStoryIntelligenceRunRequestV1 {
  readonly schemaVersion: typeof AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION;
  readonly projectId: string; readonly generation: number; readonly runId: string; readonly analysisId: string;
  readonly requestedAt: string; readonly origin: AutomaticStoryIntelligenceOriginV1;
  readonly lenses: readonly AutomaticStoryIntelligenceLensV1[];
  readonly units: readonly AutomaticStoryIntelligenceSavedUnitV1[];
  readonly excludedUnits: readonly AutomaticStoryIntelligenceExcludedUnitV1[];
  readonly rerunOf?: AutomaticStoryIntelligenceRerunIdentityV1;
}
export interface AutomaticStoryIntelligenceEvidenceV1 {
  readonly evidenceClass: EvidenceClassV1; readonly confidenceBand: ConfidenceBandV1;
  readonly uncertainty: AutomaticStoryIntelligenceUncertaintyV1; readonly evidenceSummary: string;
  readonly positionRefs: readonly StoryPositionRefV1[]; readonly provenance: StoryIntelligenceProvenanceV1;
}
export interface AutomaticStoryIntelligenceFindingV1 extends AutomaticStoryIntelligenceEvidenceV1 {
  readonly schemaVersion: typeof AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION;
  readonly findingId: string; readonly projectId: string; readonly analysisId: string;
  readonly lens: AutomaticStoryIntelligenceLensV1; readonly summary: string;
  readonly emotionLabel?: string; readonly intensityBand?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high' | 'unknown'; readonly subjectLabel?: string;
  readonly temporary: true; readonly durableTruthMutation: false;
}
export interface AutomaticStoryIntelligenceLensResultV1 {
  readonly lens: AutomaticStoryIntelligenceLensV1; readonly findings: readonly AutomaticStoryIntelligenceFindingV1[];
}
export interface AutomaticStoryIntelligenceAnalysisV1 {
  readonly schemaVersion: typeof AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION;
  readonly projectId: string; readonly generation: number; readonly runId: string; readonly analysisId: string;
  readonly origin: AutomaticStoryIntelligenceOriginV1; readonly lenses: readonly AutomaticStoryIntelligenceLensV1[];
  readonly includedUnitCount: number; readonly excludedUnitCount: number; readonly findingCount: number;
  readonly excludedUnits: readonly AutomaticStoryIntelligenceExcludedUnitV1[];
  readonly lensResults: readonly AutomaticStoryIntelligenceLensResultV1[];
  readonly temporary: true; readonly durableTruthMutation: false; readonly createdAt: string;
}
export interface AutomaticStoryIntelligenceRunProgressV1 {
  readonly runId: string; readonly analysisId: string; readonly status: AutomaticStoryIntelligenceRunStatusV1;
  readonly processedUnitCount: number; readonly totalUnitCount: number; readonly includedUnitCount: number;
  readonly excludedUnitCount: number; readonly findingCount: number;
  readonly currentLens: AutomaticStoryIntelligenceLensV1 | null;
}
export interface AutomaticStoryIntelligenceRunErrorV1 {
  readonly code: 'cancelled' | 'failed' | 'stale'; readonly message: string;
}
export interface AutomaticStoryIntelligenceRunStateV1 {
  readonly schemaVersion: typeof AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION;
  readonly projectId: string; readonly runId: string; readonly analysisId: string;
  readonly origin: AutomaticStoryIntelligenceOriginV1; readonly status: AutomaticStoryIntelligenceRunStatusV1;
  readonly requestedAt: string; readonly updatedAt: string; readonly progress: AutomaticStoryIntelligenceRunProgressV1;
  readonly rerunOf?: AutomaticStoryIntelligenceRerunIdentityV1;
  readonly analysis: AutomaticStoryIntelligenceAnalysisV1 | null;
  readonly error: AutomaticStoryIntelligenceRunErrorV1 | null; readonly terminalAt: string | null;
  readonly temporary: true; readonly durableTruthMutation: false;
}
export type AutomaticStoryIntelligenceLifecycleV1 = AutomaticStoryIntelligenceRunStateV1;
export interface AutomaticStoryIntelligenceCancelRequestV1 {
  readonly schemaVersion: typeof AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION;
  readonly projectId: string; readonly runId: string; readonly analysisId: string;
  readonly requestedAt: string; readonly reason: string;
}

const PROTECTED = new Set<StoryIntelligenceSourceClassV1>([
  'hidden', 'masked', 'deleted', 'forgotten', 'discarded', 'protected', 'ai-excluded',
]);
const LENSES = new Set<string>(AUTOMATIC_STORY_INTELLIGENCE_LENSES);
const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
function exact(v: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  const allowed = new Set([...required, ...optional]);
  return required.every((k) => Object.prototype.hasOwnProperty.call(v, k)) && Object.keys(v).every((k) => allowed.has(k));
}
const bounded = (v: unknown, n: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= n;
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const iso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const hash = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/u.test(v);
const oneOf = <T extends string>(v: unknown, values: readonly T[]): v is T => typeof v === 'string' && values.includes(v as T);
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const validSourceClass = (v: unknown): v is StoryIntelligenceSourceClassV1 => oneOf(v, [
  'included', 'deterministic-only', 'hidden', 'masked', 'deleted', 'forgotten', 'discarded', 'local-only', 'protected', 'ai-excluded',
]);
const validOrigin = (v: unknown): v is AutomaticStoryIntelligenceOriginV1 => oneOf(v, ['deterministic', 'local-inference']);
const exactLenses = (v: unknown): v is readonly AutomaticStoryIntelligenceLensV1[] =>
  Array.isArray(v) && v.length === AUTOMATIC_STORY_INTELLIGENCE_LENSES.length && v.every((x, i) => x === AUTOMATIC_STORY_INTELLIGENCE_LENSES[i]);

function validAnchor(v: unknown): v is AutomaticStoryIntelligenceExactAnchorV1 {
  return isRecord(v) && exact(v, ['unitId', 'selectionStart', 'selectionEnd', 'selectionFingerprint', 'bodySha256', 'orderIndex', 'orderBasis']) &&
    bounded(v.unitId, 240) && integer(v.selectionStart) && integer(v.selectionEnd) && v.selectionEnd >= v.selectionStart &&
    hash(v.selectionFingerprint) && hash(v.bodySha256) && integer(v.orderIndex) && v.orderBasis === 'manuscript';
}
function validExactRef(v: unknown, projectId: string): v is StoryPositionRefV1 {
  return isStoryPositionRefV1(v, projectId) && isRecord(v) && bounded(v.unitId, 240) &&
    integer(v.selectionStart) && integer(v.selectionEnd) && v.selectionEnd >= v.selectionStart &&
    hash(v.selectionFingerprint) && hash(v.bodySha256) && integer(v.orderIndex);
}
function validSavedUnit(v: unknown, projectId: string, origin: AutomaticStoryIntelligenceOriginV1): v is AutomaticStoryIntelligenceSavedUnitV1 {
  return isRecord(v) && exact(v, ['unitId', 'orderIndex', 'orderBasis', 'body', 'bodySha256', 'protectionClass', 'enabled', 'sourceRef', 'anchor']) &&
    bounded(v.unitId, 240) && integer(v.orderIndex) && v.orderBasis === 'manuscript' && typeof v.body === 'string' && v.body.length > 0 &&
    v.body.length <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxBodyChars && hash(v.bodySha256) && validSourceClass(v.protectionClass) &&
    !PROTECTED.has(v.protectionClass) && (origin !== 'local-inference' || v.protectionClass !== 'deterministic-only') && v.enabled === true &&
    validExactRef(v.sourceRef, projectId) && validAnchor(v.anchor) &&
    v.sourceRef.unitId === v.unitId && v.sourceRef.bodySha256 === v.bodySha256 && v.sourceRef.selectionStart === v.anchor.selectionStart &&
    v.sourceRef.selectionEnd === v.anchor.selectionEnd && v.sourceRef.selectionFingerprint === v.anchor.selectionFingerprint &&
    v.sourceRef.orderIndex === v.orderIndex && v.anchor.unitId === v.unitId && v.anchor.bodySha256 === v.bodySha256 && v.anchor.orderIndex === v.orderIndex;
}
function validExcludedUnit(v: unknown): v is AutomaticStoryIntelligenceExcludedUnitV1 {
  return isRecord(v) && exact(v, ['unitId', 'orderIndex', 'orderBasis', 'protectionClass', 'exclusionReason']) && bounded(v.unitId, 240) && integer(v.orderIndex) &&
    v.orderBasis === 'manuscript' && validSourceClass(v.protectionClass) && PROTECTED.has(v.protectionClass) && oneOf(v.exclusionReason, ['protected', 'policy', 'unavailable']);
}
function validIdentity(v: unknown): v is AutomaticStoryIntelligenceRerunIdentityV1 {
  return isRecord(v) && exact(v, ['runId', 'analysisId']) && bounded(v.runId, 160) && bounded(v.analysisId, 160);
}
function validEvidence(v: unknown, projectId: string, origin: AutomaticStoryIntelligenceOriginV1): boolean {
  return isRecord(v) && oneOf(v.evidenceClass, ['planned', 'observed', 'inferred', 'reader-effect-optional']) && oneOf(v.confidenceBand, ['unknown', 'low', 'medium', 'high']) &&
    oneOf(v.uncertainty, ['unknown', 'low', 'medium', 'high']) && bounded(v.evidenceSummary, AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxEvidenceSummaryLength) &&
    Array.isArray(v.positionRefs) && v.positionRefs.length > 0 && v.positionRefs.length <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxUnits &&
    v.positionRefs.every((ref) => validExactRef(ref, projectId)) && isStoryIntelligenceProvenanceV1(v.provenance) &&
    v.provenance.origin === origin && v.provenance.visibility === 'included' && v.provenance.citationRequired === true && !PROTECTED.has(v.provenance.protectionClass);
}
function validFinding(v: unknown, projectId: string, analysisId: string, origin: AutomaticStoryIntelligenceOriginV1): v is AutomaticStoryIntelligenceFindingV1 {
  return isRecord(v) && exact(v, ['schemaVersion', 'findingId', 'projectId', 'analysisId', 'lens', 'summary', 'evidenceClass', 'confidenceBand', 'uncertainty', 'evidenceSummary', 'positionRefs', 'provenance', 'temporary', 'durableTruthMutation'], ['emotionLabel', 'intensityBand', 'subjectLabel']) &&
    v.schemaVersion === AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION && bounded(v.findingId, 160) && v.projectId === projectId && v.analysisId === analysisId && LENSES.has(String(v.lens)) &&
    bounded(v.summary, AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxSummaryLength) &&
    (v.emotionLabel === undefined || bounded(v.emotionLabel, 160)) &&
    (v.subjectLabel === undefined || bounded(v.subjectLabel, 160)) &&
    (v.intensityBand === undefined || oneOf(v.intensityBand, ['very-low', 'low', 'medium', 'high', 'very-high', 'unknown'])) &&
    validEvidence(v, projectId, origin) && v.temporary === true && v.durableTruthMutation === false;
}
function validExcludedList(v: unknown): v is readonly AutomaticStoryIntelligenceExcludedUnitV1[] {
  return Array.isArray(v) && v.length <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxExcludedUnits && v.every(validExcludedUnit) && unique(v.map((x) => x.unitId));
}

export function createAutomaticStoryIntelligenceRunIdentityV1(input: { readonly projectId: string; readonly savedRevision: number; readonly sourceFingerprint: string; readonly rerunOfRunId?: string }): AutomaticStoryIntelligenceRunIdentityV1 {
  const seed = `${input.projectId}:${input.savedRevision}:${input.sourceFingerprint}:${input.rerunOfRunId ?? ''}`;
  let digest = 2_166_136_261;
  for (const char of seed) digest = Math.imul(digest ^ char.charCodeAt(0), 16_777_619);
  const runId = `automatic-story-intelligence:${(digest >>> 0).toString(16)}`;
  return { runId, cancellationId: `${runId}:cancel`, ...(input.rerunOfRunId ? { rerunOfRunId: input.rerunOfRunId } : {}) };
}

function validRequest(v: unknown): v is AutomaticStoryIntelligenceRunRequestV1 {
  if (!isRecord(v) || !exact(v, ['schemaVersion', 'projectId', 'generation', 'runId', 'analysisId', 'requestedAt', 'origin', 'lenses', 'units', 'excludedUnits'], ['rerunOf']) ||
    v.schemaVersion !== AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION || !bounded(v.projectId, 240) || !integer(v.generation) || !bounded(v.runId, 160) || !bounded(v.analysisId, 160) || !iso(v.requestedAt) || !validOrigin(v.origin) || !exactLenses(v.lenses) ||
    !Array.isArray(v.units) || v.units.length === 0 || v.units.length > AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxUnits || !v.units.every((unit) => validSavedUnit(unit, String(v.projectId), v.origin as AutomaticStoryIntelligenceOriginV1)) || !validExcludedList(v.excludedUnits) || (v.rerunOf !== undefined && !validIdentity(v.rerunOf))) return false;
  const all = [...v.units, ...v.excludedUnits];
  return unique(all.map((x) => x.unitId)) && unique(all.map((x) => String(x.orderIndex))) && (v.rerunOf === undefined || (v.rerunOf.runId !== v.runId && v.rerunOf.analysisId !== v.analysisId));
}
export const isAutomaticStoryIntelligenceRunRequestV1 = validRequest;
export function validateAutomaticStoryIntelligenceRunRequestV1(v: unknown): AutomaticStoryIntelligenceRunRequestV1 { if (!validRequest(v)) throw new Error('Automatic story intelligence run request is invalid.'); return v; }
export const isAutomaticStoryIntelligenceSavedUnitV1 = (v: unknown, projectId: string, origin: AutomaticStoryIntelligenceOriginV1 = 'deterministic'): v is AutomaticStoryIntelligenceSavedUnitV1 => validSavedUnit(v, projectId, origin);
export const isAutomaticStoryIntelligenceExactAnchorV1 = validAnchor;
export const isAutomaticStoryIntelligenceExcludedUnitV1 = validExcludedUnit;

function validProgress(v: unknown): v is AutomaticStoryIntelligenceRunProgressV1 {
  return isRecord(v) && exact(v, ['runId', 'analysisId', 'status', 'processedUnitCount', 'totalUnitCount', 'includedUnitCount', 'excludedUnitCount', 'findingCount', 'currentLens']) && bounded(v.runId, 160) && bounded(v.analysisId, 160) && oneOf(v.status, ['idle', 'running', 'completed', 'cancelled', 'failed', 'stale']) && integer(v.processedUnitCount) && integer(v.totalUnitCount) && integer(v.includedUnitCount) && integer(v.excludedUnitCount) && integer(v.findingCount) && (v.currentLens === null || LENSES.has(String(v.currentLens))) && v.totalUnitCount <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxUnits + AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxExcludedUnits && v.includedUnitCount <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxUnits && v.excludedUnitCount <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxExcludedUnits && v.processedUnitCount <= v.includedUnitCount && v.totalUnitCount === v.includedUnitCount + v.excludedUnitCount && v.findingCount <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxFindings;
}
function validAnalysis(v: unknown): v is AutomaticStoryIntelligenceAnalysisV1 {
  if (!isRecord(v) || !exact(v, ['schemaVersion', 'projectId', 'generation', 'runId', 'analysisId', 'origin', 'lenses', 'includedUnitCount', 'excludedUnitCount', 'findingCount', 'excludedUnits', 'lensResults', 'temporary', 'durableTruthMutation', 'createdAt']) || v.schemaVersion !== AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION || !bounded(v.projectId, 240) || !integer(v.generation) || !bounded(v.runId, 160) || !bounded(v.analysisId, 160) || !validOrigin(v.origin) || !exactLenses(v.lenses) || !integer(v.includedUnitCount) || !integer(v.excludedUnitCount) || !integer(v.findingCount) || !validExcludedList(v.excludedUnits) || !Array.isArray(v.lensResults) || v.lensResults.length !== 6 || !iso(v.createdAt) || v.temporary !== true || v.durableTruthMutation !== false) return false;
  if (v.lensResults.some((result) => !isRecord(result) || !exact(result, ['lens', 'findings']) || !LENSES.has(String(result.lens)) || !Array.isArray(result.findings) || result.findings.length > AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxFindingsPerLens || !result.findings.every((f) => validFinding(f, String(v.projectId), String(v.analysisId), v.origin as AutomaticStoryIntelligenceOriginV1)))) return false;
  const findings = v.lensResults.flatMap((result) => result.findings as AutomaticStoryIntelligenceFindingV1[]);
  const excluded = new Set(v.excludedUnits.map((unit) => unit.unitId));
  return v.lensResults.map((result) => result.lens).join('|') === AUTOMATIC_STORY_INTELLIGENCE_LENSES.join('|') && v.includedUnitCount <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxUnits && v.excludedUnitCount <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxExcludedUnits && v.findingCount === findings.length && v.findingCount <= AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxFindings && unique(findings.map((f) => f.findingId)) && findings.every((f) => f.projectId === v.projectId && f.analysisId === v.analysisId && f.positionRefs.every((ref) => !ref.unitId || !excluded.has(ref.unitId)));
}
export const isAutomaticStoryIntelligenceAnalysisV1 = validAnalysis;
export function validateAutomaticStoryIntelligenceAnalysisV1(v: unknown): AutomaticStoryIntelligenceAnalysisV1 { if (!validAnalysis(v)) throw new Error('Automatic story intelligence analysis is invalid.'); return v; }

function validError(v: unknown): v is AutomaticStoryIntelligenceRunErrorV1 { return isRecord(v) && exact(v, ['code', 'message']) && oneOf(v.code, ['cancelled', 'failed', 'stale']) && bounded(v.message, AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxReasonLength); }
export function isAutomaticStoryIntelligenceRunStateV1(v: unknown): v is AutomaticStoryIntelligenceRunStateV1 {
  if (!isRecord(v) || !exact(v, ['schemaVersion', 'projectId', 'runId', 'analysisId', 'origin', 'status', 'requestedAt', 'updatedAt', 'progress', 'analysis', 'error', 'terminalAt', 'temporary', 'durableTruthMutation'], ['rerunOf']) || v.schemaVersion !== AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION || !bounded(v.projectId, 240) || !bounded(v.runId, 160) || !bounded(v.analysisId, 160) || !validOrigin(v.origin) || !oneOf(v.status, ['idle', 'running', 'completed', 'cancelled', 'failed', 'stale']) || !iso(v.requestedAt) || !iso(v.updatedAt) || !validProgress(v.progress) || v.progress.runId !== v.runId || v.progress.analysisId !== v.analysisId || (v.analysis !== null && !validAnalysis(v.analysis)) || (v.error !== null && !validError(v.error)) || (v.terminalAt !== null && !iso(v.terminalAt)) || v.temporary !== true || v.durableTruthMutation !== false || (v.rerunOf !== undefined && !validIdentity(v.rerunOf))) return false;
  if (v.progress.status !== v.status) return false;
  if (v.status === 'idle' || v.status === 'running') return v.analysis === null && v.error === null && v.terminalAt === null;
  if (v.status === 'completed') return v.analysis !== null && v.analysis.runId === v.runId && v.analysis.analysisId === v.analysisId && v.analysis.origin === v.origin && v.error === null && v.terminalAt !== null;
  return v.analysis === null && v.error !== null && v.error.code === v.status && v.terminalAt !== null;
}
export function validateAutomaticStoryIntelligenceRunStateV1(v: unknown): AutomaticStoryIntelligenceRunStateV1 { if (!isAutomaticStoryIntelligenceRunStateV1(v)) throw new Error('Automatic story intelligence run state is invalid.'); return v; }
export const isAutomaticStoryIntelligenceCancelRequestV1 = (v: unknown): v is AutomaticStoryIntelligenceCancelRequestV1 => isRecord(v) && exact(v, ['schemaVersion', 'projectId', 'runId', 'analysisId', 'requestedAt', 'reason']) && v.schemaVersion === AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION && bounded(v.projectId, 240) && bounded(v.runId, 160) && bounded(v.analysisId, 160) && iso(v.requestedAt) && bounded(v.reason, AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxReasonLength);
export function validateAutomaticStoryIntelligenceCancelRequestV1(v: unknown): AutomaticStoryIntelligenceCancelRequestV1 { if (!isAutomaticStoryIntelligenceCancelRequestV1(v)) throw new Error('Automatic story intelligence cancellation request is invalid.'); return v; }

export function replaceAutomaticStoryIntelligenceRunStateV1(previous: AutomaticStoryIntelligenceRunStateV1 | undefined, next: unknown): AutomaticStoryIntelligenceRunStateV1 | undefined {
  const candidate = validateAutomaticStoryIntelligenceRunStateV1(next);
  return candidate.status === 'completed' ? candidate : previous;
}
export const replaceAutomaticStoryIntelligenceResultV1 = replaceAutomaticStoryIntelligenceRunStateV1;

export interface AutomaticStoryIntelligenceAnalyzerOptionsV1 {
  readonly sha256: (value: string) => string;
  readonly now?: string;
  readonly isCancelled?: () => boolean;
}

export class AutomaticStoryIntelligenceCancelledError extends Error {
  constructor() {
    super('Automatic story intelligence scan cancelled.');
    this.name = 'AutomaticStoryIntelligenceCancelledError';
  }
}

interface Cue {
  readonly label: string;
  readonly pattern: RegExp;
  readonly summary: string;
}

const CUES: Readonly<Record<AutomaticStoryIntelligenceLensV1, readonly Cue[]>> = {
  emotion: [
    { label: 'joy', pattern: /\b(happy|happiness|joy|joyful|delighted|laughed|laughter|smile|love|loving|hope|hopeful)\b/iu, summary: 'A positive emotion cue appears in the saved prose.' },
    { label: 'fear', pattern: /\b(fear|afraid|terror|terrified|dread|dreaded|panic|panicked|horror|horrified)\b/iu, summary: 'A fear or dread cue appears in the saved prose.' },
    { label: 'grief', pattern: /\b(sad|sadness|grief|grieving|mourn|mourning|tears|wept|weeping|lonely|loneliness)\b/iu, summary: 'A grief or sadness cue appears in the saved prose.' },
    { label: 'anger', pattern: /\b(angry|anger|rage|raged|furious|fury|resent|resentment|hate|hatred)\b/iu, summary: 'An anger or hostility cue appears in the saved prose.' },
  ],
  continuity: [
    { label: 'review marker', pattern: /\b(TODO|FIXME|TBD|placeholder|contradiction|inconsistent)\b|\?\?\?/iu, summary: 'The saved prose contains a marker that may deserve a continuity review.' },
  ],
  timeline: [
    { label: 'temporal cue', pattern: /\b(yesterday|today|tomorrow|before|after|earlier|later|morning|evening|night|year|month|week|hour|minute|at once|the next day)\b/iu, summary: 'The saved prose contains a temporal cue that can be checked against the manuscript timeline.' },
  ],
  pacing: [],
  pressure: [
    { label: 'pressure cue', pattern: /\b(must|urgent|danger|threat|deadline|escape|trapped|cannot|can't|kill|killed|die|died|consequence|immediately)\b/iu, summary: 'The saved prose contains a cue associated with pressure or consequence.' },
  ],
  signals: [
    { label: 'author marker', pattern: /\b(TODO|FIXME|TBD|NEEDS?|REVISIT|PLACEHOLDER)\b|\?\?\?/iu, summary: 'The saved prose contains an explicit review marker.' },
  ],
};

function throwIfCancelled(options: AutomaticStoryIntelligenceAnalyzerOptionsV1): void {
  if (options.isCancelled?.()) throw new AutomaticStoryIntelligenceCancelledError();
}

function firstCue(body: string, cues: readonly Cue[]): { readonly cue: Cue; readonly start: number; readonly end: number; readonly text: string } | null {
  let best: { readonly cue: Cue; readonly start: number; readonly end: number; readonly text: string } | null = null;
  for (const cue of cues) {
    const match = cue.pattern.exec(body);
    if (!match || match.index < 0) continue;
    const candidate = { cue, start: match.index, end: match.index + match[0].length, text: match[0] };
    if (!best || candidate.start < best.start) best = candidate;
  }
  return best;
}

function pacingCue(body: string): { readonly start: number; readonly end: number; readonly label: string; readonly summary: string } | null {
  const words = body.match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu)?.length ?? 0;
  const sentences = Math.max(1, body.match(/[.!?]+(?=\s|$)/g)?.length ?? 1);
  const average = words / sentences;
  if (average >= 45) return { start: 0, end: Math.min(body.length, 160), label: 'long sentence rhythm', summary: `The saved unit averages about ${Math.round(average)} words per sentence; review whether the rhythm is intentionally slow or dense.` };
  if (average > 0 && average <= 6) return { start: 0, end: Math.min(body.length, 160), label: 'short sentence rhythm', summary: `The saved unit averages about ${Math.round(average)} words per sentence; review whether the rhythm is intentionally quick or clipped.` };
  return null;
}

function findingFor(
  request: AutomaticStoryIntelligenceRunRequestV1,
  unit: AutomaticStoryIntelligenceSavedUnitV1,
  lens: AutomaticStoryIntelligenceLensV1,
  cue: { readonly start: number; readonly end: number; readonly label: string; readonly summary: string },
  options: AutomaticStoryIntelligenceAnalyzerOptionsV1,
  ordinal: number,
): AutomaticStoryIntelligenceFindingV1 {
  const selected = unit.body.slice(cue.start, cue.end);
  const positionRef: StoryPositionRefV1 = {
    ...unit.sourceRef,
    selectionStart: cue.start,
    selectionEnd: cue.end,
    selectionFingerprint: options.sha256(selected),
    bodySha256: unit.bodySha256,
  };
  return {
    schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
    findingId: `${request.analysisId}:${lens}:${unit.unitId}:${cue.start}:${ordinal}`,
    projectId: request.projectId,
    analysisId: request.analysisId,
    lens,
    summary: `${cue.label}: ${cue.summary}`,
    evidenceClass: 'observed',
    confidenceBand: 'low',
    uncertainty: 'medium',
    evidenceSummary: `Exact saved-prose cue: “${selected.slice(0, 120)}”. This is a deterministic review prompt, not a judgment about story quality.`,
    positionRefs: [positionRef],
    provenance: {
      sourceOwner: 'Automatic manuscript scan',
      origin: request.origin,
      visibility: 'included',
      citationRequired: true,
      protectionClass: unit.protectionClass,
    },
    temporary: true,
    durableTruthMutation: false,
  };
}

export async function analyzeAutomaticStoryIntelligence(
  request: AutomaticStoryIntelligenceRunRequestV1,
  options: AutomaticStoryIntelligenceAnalyzerOptionsV1,
): Promise<AutomaticStoryIntelligenceAnalysisV1> {
  validateAutomaticStoryIntelligenceRunRequestV1(request);
  const results: AutomaticStoryIntelligenceLensResultV1[] = [];
  let ordinal = 0;
  for (const lens of request.lenses) {
    const findings: AutomaticStoryIntelligenceFindingV1[] = [];
    for (const unit of request.units) {
      throwIfCancelled(options);
      let cue: { readonly start: number; readonly end: number; readonly label: string; readonly summary: string } | null = null;
      if (lens === 'pacing') {
        cue = pacingCue(unit.body);
      } else {
        const match = firstCue(unit.body, CUES[lens]);
        if (match) cue = { start: match.start, end: match.end, label: match.cue.label, summary: match.cue.summary };
      }
      if (cue && findings.length < AUTOMATIC_STORY_INTELLIGENCE_BOUNDS.maxFindingsPerLens) {
        findings.push(findingFor(request, unit, lens, cue, options, ordinal));
        ordinal += 1;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    results.push({ lens, findings });
  }
  const findingCount = results.reduce((total, result) => total + result.findings.length, 0);
  return validateAutomaticStoryIntelligenceAnalysisV1({
    schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
    projectId: request.projectId,
    generation: request.generation,
    runId: request.runId,
    analysisId: request.analysisId,
    origin: request.origin,
    lenses: request.lenses,
    includedUnitCount: request.units.length,
    excludedUnitCount: request.excludedUnits.length,
    findingCount,
    excludedUnits: request.excludedUnits,
    lensResults: results,
    temporary: true,
    durableTruthMutation: false,
    createdAt: options.now ?? request.requestedAt,
  });
}
