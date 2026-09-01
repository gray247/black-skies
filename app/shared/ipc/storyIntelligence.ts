export const STORY_INTELLIGENCE_CHANNELS = {
  read: 'story-intelligence:read',
  write: 'story-intelligence:write',
  checkPermission: 'story-intelligence:check-permission',
} as const;

export const STORY_INTELLIGENCE_SCHEMA_VERSION = 'BlackSkiesStoryIntelligence v1' as const;
export const STORY_INTELLIGENCE_POLICY_SCHEMA_VERSION = 1 as const;
export const STORY_INTELLIGENCE_HISTORY_LIMIT = 200 as const;

export type SignalPostureV1 = 'off' | 'ask-only' | 'quiet' | 'alert';
export type ProjectPostureV1 = 'explore' | 'develop' | 'finish';
export type EvidenceClassV1 = 'planned' | 'observed' | 'inferred' | 'reader-effect-optional';
export type ConfidenceBandV1 = 'unknown' | 'low' | 'medium' | 'high';
export type SignalImpactV1 = 'informational' | 'attention' | 'urgent' | 'blocking';
export type SignalLifecycleV1 =
  | 'candidate'
  | 'reviewed'
  | 'accepted'
  | 'dismissed'
  | 'suppressed'
  | 'expired'
  | 'converted'
  | 'resolved'
  | 'superseded';
export type CurrentnessV1 = 'current' | 'stale' | 'unavailable' | 'trimmed';
export type IntensityBandV1 = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
export type EmotionGraphIntensityV1 = IntensityBandV1 | 'unknown';

export type StoryIntelligenceSourceClassV1 =
  | 'included'
  | 'deterministic-only'
  | 'hidden'
  | 'masked'
  | 'deleted'
  | 'forgotten'
  | 'discarded'
  | 'local-only'
  | 'protected'
  | 'ai-excluded';

export type StoryIntelligencePermissionOperationV1 =
  | 'deterministic-analysis'
  | 'model-package'
  | 'display-metadata'
  | 'persist';

export type StoryIntelligenceHistoryActorV1 =
  | 'author'
  | 'deterministic'
  | 'local-inference'
  | 'system';

export type StoryIntelligenceHistoryEventTypeV1 =
  | 'settings-updated'
  | 'author-record-created'
  | 'signal-accepted'
  | 'signal-dismissed'
  | 'signal-suppressed'
  | 'signal-expired'
  | 'signal-converted'
  | 'signal-resolved'
  | 'signal-superseded';

export interface StoryIntelligenceAnalysisPolicyV1 {
  readonly schemaVersion: typeof STORY_INTELLIGENCE_POLICY_SCHEMA_VERSION;
  readonly signalPosture: SignalPostureV1;
  readonly projectPosture: ProjectPostureV1;
  readonly deterministicEnabled: boolean;
  readonly optionalInferenceEnabled: boolean;
  readonly readerEffectLaneEnabled: boolean;
  readonly allowedSourceClasses: readonly StoryIntelligenceSourceClassV1[];
  readonly excludedSourceClasses: readonly StoryIntelligenceSourceClassV1[];
  readonly selectedScopePolicy: 'author-selected' | 'project-local';
  readonly retentionPolicy: 'metadata-only-bounded';
  readonly updatedAt: string;
}

export interface StoryIntelligenceSettingsV1 {
  readonly signalPosture: SignalPostureV1;
  readonly projectPosture: ProjectPostureV1;
  readonly analysisPolicy: StoryIntelligenceAnalysisPolicyV1;
}

export interface StoryIntelligenceUnitPolicyV1 {
  readonly unitId: string;
  readonly enabled: boolean;
  readonly signalPosture?: SignalPostureV1;
  readonly projectPosture?: ProjectPostureV1;
  readonly updatedAt: string;
}

export interface StoryPositionRefV1 {
  readonly projectId: string;
  readonly sourceKind: 'manuscript' | 'assertion' | 'outline' | 'story-unit' | 'character' | 'lore' | 'author-intent';
  readonly sourceId: string;
  readonly sourceRevision: number;
  readonly sourceFingerprint: string;
  readonly anchorId?: string;
  readonly unitId?: string;
  readonly selectionFingerprint?: string;
  readonly orderIndex?: number;
  readonly orderBasis?: 'manuscript' | 'story-world' | 'planning' | 'reveal' | 'projection';
}

export interface StoryIntelligenceProvenanceV1 {
  readonly sourceOwner: string;
  readonly origin: 'author' | 'deterministic' | 'local-inference' | 'system';
  readonly visibility: 'included' | 'metadata-only';
  readonly citationRequired: boolean;
  readonly protectionClass: StoryIntelligenceSourceClassV1;
}

export interface StoryIntelligenceFindingV1 {
  readonly schemaVersion: typeof STORY_INTELLIGENCE_SCHEMA_VERSION;
  readonly findingId: string;
  readonly projectId: string;
  readonly analysisId: string;
  readonly scope: string;
  readonly positionRefs: readonly StoryPositionRefV1[];
  readonly evidenceClass: EvidenceClassV1;
  readonly label: string;
  readonly intensityBand?: IntensityBandV1;
  readonly confidenceBand: ConfidenceBandV1;
  readonly impact: SignalImpactV1;
  readonly currentness: CurrentnessV1;
  readonly summary: string;
  readonly evidenceSummary: string;
  readonly sourceOwner: string;
  readonly provenance: StoryIntelligenceProvenanceV1;
  readonly lifecycle: SignalLifecycleV1;
  readonly createdAt: string;
  readonly expiresAt?: string;
}

export interface DurableSignalV1 {
  readonly schemaVersion: typeof STORY_INTELLIGENCE_SCHEMA_VERSION;
  readonly signalId: string;
  readonly projectId: string;
  readonly sourceFindingId?: string;
  readonly positionRefs: readonly StoryPositionRefV1[];
  readonly sourceOwner: string;
  readonly evidenceClass: EvidenceClassV1;
  readonly impact: SignalImpactV1;
  readonly confidenceBand: ConfidenceBandV1;
  readonly currentness: CurrentnessV1;
  readonly lifecycle: Exclude<SignalLifecycleV1, 'candidate'>;
  readonly summary: string;
  readonly evidenceSummary: string;
  readonly provenance: StoryIntelligenceProvenanceV1;
  readonly disposition?: 'dismissed' | 'suppressed' | 'expired' | 'converted' | 'resolved' | 'superseded';
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StoryIntelligenceAuthorRecordV1 {
  readonly recordId: string;
  readonly projectId: string;
  readonly unitId?: string;
  readonly evidenceClass: Exclude<EvidenceClassV1, 'inferred'>;
  readonly label: string;
  readonly intensityBand?: IntensityBandV1;
  readonly recordKind?: 'general' | 'emotion-graph';
  readonly emotionLane?: 'planned' | 'observed' | 'reader-effect-optional';
  readonly emotionIntensity?: EmotionGraphIntensityV1;
  readonly subjectLabel?: string;
  readonly currentness?: CurrentnessV1;
  readonly positionRefs: readonly StoryPositionRefV1[];
  readonly provenance: StoryIntelligenceProvenanceV1;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StoryIntelligenceDispositionV1 {
  readonly dispositionId: string;
  readonly projectId: string;
  readonly signalId: string;
  readonly lifecycle: Exclude<SignalLifecycleV1, 'candidate' | 'reviewed' | 'accepted'>;
  readonly actor: 'author' | 'system';
  readonly createdAt: string;
}

export interface StoryIntelligenceHistoryEventV1 {
  readonly eventId: string;
  readonly projectId: string;
  readonly eventType: StoryIntelligenceHistoryEventTypeV1;
  readonly subjectId: string;
  readonly sourceRevision?: number;
  readonly lifecycleBefore?: SignalLifecycleV1;
  readonly lifecycleAfter?: SignalLifecycleV1;
  readonly currentness?: CurrentnessV1;
  readonly evidenceClass?: EvidenceClassV1;
  readonly actor: StoryIntelligenceHistoryActorV1;
  readonly provenanceRef?: string;
  readonly createdAt: string;
}

export interface StoryIntelligenceDocumentV1 {
  readonly schemaVersion: typeof STORY_INTELLIGENCE_SCHEMA_VERSION;
  readonly projectId: string;
  readonly revision: number;
  readonly settings: StoryIntelligenceSettingsV1;
  readonly unitPolicies: readonly StoryIntelligenceUnitPolicyV1[];
  readonly authorRecords: readonly StoryIntelligenceAuthorRecordV1[];
  readonly durableSignals: readonly DurableSignalV1[];
  readonly dispositions: readonly StoryIntelligenceDispositionV1[];
  readonly history: readonly StoryIntelligenceHistoryEventV1[];
  readonly updatedAt: string;
}

export interface StoryIntelligenceProjectBindingV1 {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
}

export interface GetStoryIntelligenceRequestV1 extends StoryIntelligenceProjectBindingV1 {}

export interface WriteStoryIntelligenceRequestV1 extends StoryIntelligenceProjectBindingV1 {
  readonly expectedRevision: number;
  readonly document: StoryIntelligenceDocumentV1;
}

export interface CheckStoryIntelligencePermissionRequestV1 extends StoryIntelligenceProjectBindingV1 {
  readonly sourceClass: StoryIntelligenceSourceClassV1;
  readonly operation: StoryIntelligencePermissionOperationV1;
}

export type StoryIntelligenceErrorCodeV1 =
  | 'NOT_WRITING_STUDIO'
  | 'NO_ACTIVE_PROJECT'
  | 'STALE_SESSION'
  | 'INVALID_REQUEST'
  | 'STORY_INTELLIGENCE_UNAVAILABLE'
  | 'STORY_INTELLIGENCE_STALE'
  | 'STORY_INTELLIGENCE_WRITE_FAILED'
  | 'STORY_INTELLIGENCE_DENIED';

export interface StoryIntelligenceErrorV1 {
  readonly code: StoryIntelligenceErrorCodeV1;
  readonly message: string;
}

export interface StoryIntelligenceReadSuccessV1 {
  readonly ok: true;
  readonly data: StoryIntelligenceDocumentV1;
}

export interface StoryIntelligenceFailureV1 {
  readonly ok: false;
  readonly error: StoryIntelligenceErrorV1;
}

export type StoryIntelligenceReadResultV1 = StoryIntelligenceReadSuccessV1 | StoryIntelligenceFailureV1;
export type StoryIntelligenceWriteResultV1 = StoryIntelligenceReadResultV1;

export interface StoryIntelligencePermissionResultV1 {
  readonly allowed: boolean;
  readonly sourceClass: StoryIntelligenceSourceClassV1;
  readonly operation: StoryIntelligencePermissionOperationV1;
  readonly metadataOnly: boolean;
  readonly reason:
    | 'allowed'
    | 'protected-metadata-only'
    | 'excluded-from-analysis'
    | 'deterministic-only'
    | 'policy-disabled'
    | 'not-allowed-by-policy';
}

export interface StoryIntelligencePermissionSuccessV1 {
  readonly ok: true;
  readonly data: StoryIntelligencePermissionResultV1;
}

export type StoryIntelligencePermissionResultEnvelopeV1 =
  | StoryIntelligencePermissionSuccessV1
  | StoryIntelligenceFailureV1;

export interface StoryIntelligenceBridge {
  read(request: GetStoryIntelligenceRequestV1): Promise<StoryIntelligenceReadResultV1>;
  write(request: WriteStoryIntelligenceRequestV1): Promise<StoryIntelligenceWriteResultV1>;
  checkPermission(
    request: CheckStoryIntelligencePermissionRequestV1,
  ): Promise<StoryIntelligencePermissionResultEnvelopeV1>;
}
