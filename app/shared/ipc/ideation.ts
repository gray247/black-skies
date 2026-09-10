export const IDEATION_CHANNELS = {
  get: 'ideation:get',
  captureSeed: 'ideation:capture-seed',
  updateSeed: 'ideation:update-seed',
  createBranch: 'ideation:create-branch',
  copyBranch: 'ideation:copy-branch',
  mergeBranches: 'ideation:merge-branches',
  splitBranch: 'ideation:split-branch',
  archiveBranch: 'ideation:archive-branch',
  restoreBranch: 'ideation:restore-branch',
  addPremiseVersion: 'ideation:add-premise-version',
  testPremise: 'ideation:test-premise',
  combineSeeds: 'ideation:combine-seeds',
  filterLibrary: 'ideation:filter-library',
  preparePromotion: 'ideation:prepare-promotion',
  requestAiAlternatives: 'ideation:request-ai-alternatives',
} as const;

export const IDEATION_SCHEMA_VERSION = 'BlackSkiesIdeation v1' as const;
export const IDEATION_FILENAME = 'ideation.json' as const;
export const IDEATION_MAX_TEXT_LENGTH = 20_000;
export const IDEATION_MAX_HISTORY = 200;
export const IDEATION_MAX_TEST_HISTORY = 24;
export const IDEATION_MAX_OBJECT_HISTORY = 64;
export const IDEATION_MAX_PROMOTION_HISTORY = 64;
export const IDEATION_MAX_AI_ALTERNATIVE_HISTORY = 64;
export const IDEATION_FIXED_CORE_QUESTIONS: readonly IdeationPremiseQuestionV1[] = [
  { id: 'focal-force', prompt: 'Who or what is the focal force?', required: false, adaptive: false },
  { id: 'desire', prompt: 'What does the focal force want?', required: false, adaptive: false },
  { id: 'opposition', prompt: 'What resists that desire?', required: false, adaptive: false },
  { id: 'stakes', prompt: 'What changes if the focal force fails?', required: false, adaptive: false },
  { id: 'intended-effect', prompt: 'What effect should the premise create?', required: false, adaptive: false },
];

export type IdeationSeedKind =
  | 'fragment' | 'title' | 'image' | 'character' | 'creature' | 'location'
  | 'ending' | 'line' | 'question' | 'mood' | 'partial-premise';
export type IdeationLifecycle = 'active' | 'archived';
export type IdeationBranchPosture =
  | 'draft' | 'active' | 'preferred' | 'paused' | 'stale' | 'merged'
  | 'promoted' | 'rejected' | 'archived';
export type IdeationUnresolvedPosture = 'unknown' | 'intentional-ambiguity' | 'conflict' | 'exploratory';
export type IdeationProvenanceKind = 'author' | 'ai-advisory' | 'mixed';
export type IdeationContributionClass =
  | 'central' | 'supporting' | 'transformed' | 'background' | 'thematic'
  | 'reserved' | 'rejected' | 'unresolved';
export type IdeationImportance = 'anchor' | 'essential' | 'supporting' | 'desirable' | 'optional' | 'experimental';
export type IdeationPromotionDestination =
  | 'author-intent' | 'outline' | 'story-unit' | 'narrative-insertion'
  | 'character' | 'lore' | 'memory';

export interface IdeationProvenanceV1 {
  readonly kind: IdeationProvenanceKind;
  readonly actor: 'author' | 'local-ai';
  readonly capturedAt: string;
  readonly sourceReference: string | null;
  readonly authorRequested: boolean;
}

export interface IdeationSeedVersionV1 {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly kind: IdeationSeedKind;
  readonly provenance: IdeationProvenanceV1;
  readonly createdAt: string;
  readonly supersededAt: string | null;
}

export interface IdeationHistoryEventV1 {
  readonly id: string;
  readonly action: string;
  readonly objectId: string;
  readonly occurredAt: string;
  readonly pinned: boolean;
  readonly lineageRelevant: boolean;
  readonly detail: string | null;
}

export interface IdeationIdeaSeedV1 {
  readonly id: string;
  readonly lifecycle: IdeationLifecycle;
  readonly currentVersionId: string;
  readonly versions: readonly IdeationSeedVersionV1[];
  readonly tags: readonly string[];
  readonly projectReferences: readonly string[];
  readonly branchIds: readonly string[];
  readonly protected: boolean;
  readonly pinned: boolean;
  readonly history: readonly IdeationHistoryEventV1[];
}

export interface IdeationSourceContributionV1 {
  readonly seedId: string;
  readonly importance: IdeationImportance;
  readonly classification: IdeationContributionClass;
  readonly sourceVersionId: string | null;
  readonly note: string | null;
}

export interface IdeationUnresolvedAreaV1 {
  readonly id: string;
  readonly statement: string;
  readonly posture: IdeationUnresolvedPosture;
  readonly revisitCondition: string | null;
}

export interface IdeationPremiseVersionV1 {
  readonly id: string;
  readonly text: string;
  readonly unresolvedAreas: readonly IdeationUnresolvedAreaV1[];
  readonly provenance: IdeationProvenanceV1;
  readonly createdAt: string;
  readonly supersededAt: string | null;
}

export interface IdeationExplorationBranchV1 {
  readonly id: string;
  readonly name: string;
  readonly posture: IdeationBranchPosture;
  readonly seedIds: readonly string[];
  readonly sourceContributions: readonly IdeationSourceContributionV1[];
  readonly premiseVersions: readonly IdeationPremiseVersionV1[];
  readonly currentPremiseVersionId: string | null;
  readonly parentBranchId: string | null;
  readonly lineageBranchIds: readonly string[];
  readonly unknowns: readonly IdeationUnresolvedAreaV1[];
  readonly projectReferences: readonly string[];
  readonly pinned: boolean;
  readonly history: readonly IdeationHistoryEventV1[];
}

export interface IdeationPremiseQuestionV1 {
  readonly id: string;
  readonly prompt: string;
  readonly required: boolean;
  readonly adaptive: boolean;
}

export interface IdeationExplorationFindingV1 {
  readonly id: string;
  readonly premiseVersionId: string;
  readonly dimension: string;
  readonly summary: string;
  readonly uncertainty: 'low' | 'medium' | 'high' | 'unknown';
  readonly provenance: IdeationProvenanceV1;
  readonly authorResponse: string | null;
}

export interface IdeationPremiseTestV1 {
  readonly id: string;
  readonly branchId: string;
  readonly premiseVersionId: string;
  readonly branchPosture: IdeationBranchPosture;
  readonly fixedCore: readonly IdeationPremiseQuestionV1[];
  readonly adaptive: readonly IdeationPremiseQuestionV1[];
  readonly answers: Readonly<Record<string, string>>;
  readonly findings: readonly IdeationExplorationFindingV1[];
  readonly createdAt: string;
  readonly provenance: IdeationProvenanceV1;
}

export interface IdeationPromotionPackageV1 {
  readonly id: string;
  readonly branchId: string;
  readonly seedIds: readonly string[];
  readonly destination: IdeationPromotionDestination;
  readonly selectedText: string;
  readonly selectedTextSha256: string;
  readonly sourceContributions: readonly IdeationSourceContributionV1[];
  readonly preparedAt: string;
  readonly provenance: IdeationProvenanceV1;
  readonly status: 'prepared';
}

export interface IdeationAiAlternativeV1 {
  readonly id: string;
  readonly branchId: string;
  readonly premiseVersionId: string;
  readonly text: string;
  readonly request: import('../localInference.js').Program7LocalInferenceRequestV1;
  readonly provenance: IdeationProvenanceV1;
  readonly model: 'qwen3:4b';
  readonly receipt: {
    readonly endpoint: 'http://127.0.0.1:11434';
    readonly requestedModel: 'qwen3:4b';
    readonly actualModel: string | null;
    readonly modelDigest: string | null;
    readonly ollamaVersion: string | null;
    readonly promptSha256: string;
    readonly schemaSha256: string;
    readonly startedAt: string;
    readonly firstTokenAt: string | null;
    readonly endedAt: string;
    readonly promptTokens: number;
    readonly outputTokens: number;
  };
  readonly accepted: false;
}

export interface IdeationDocumentV1 {
  readonly schemaVersion: typeof IDEATION_SCHEMA_VERSION;
  readonly projectId: string;
  readonly revision: number;
  readonly seeds: readonly IdeationIdeaSeedV1[];
  readonly branches: readonly IdeationExplorationBranchV1[];
  readonly premiseTests: readonly IdeationPremiseTestV1[];
  readonly promotionPackages: readonly IdeationPromotionPackageV1[];
  readonly aiAlternatives: readonly IdeationAiAlternativeV1[];
  readonly history: readonly IdeationHistoryEventV1[];
}

export interface IdeationSnapshotV1 {
  readonly availability: 'ready' | 'degraded';
  readonly document: IdeationDocumentV1;
  readonly message: string | null;
}

export interface IdeationProjectBinding {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
}
export interface GetIdeationRequest extends IdeationProjectBinding {}
export interface CaptureIdeaSeedRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly title: string;
  readonly body: string;
  readonly kind: IdeationSeedKind;
  readonly tags: readonly string[];
  readonly protected: boolean;
}
export interface UpdateIdeaSeedRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly seedId: string;
  readonly title: string;
  readonly body: string;
  readonly kind: IdeationSeedKind;
  readonly tags: readonly string[];
}
export interface CreateBranchRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly name: string;
  readonly seedIds: readonly string[];
  readonly premise: string;
  readonly unknowns: readonly IdeationUnresolvedAreaV1[];
}
export interface CopyBranchRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly branchId: string;
  readonly name: string;
}
export interface MergeBranchesRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly branchIds: readonly string[];
  readonly name: string;
  readonly premise: string;
}
export interface SplitBranchRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly branchId: string;
  readonly name: string;
  readonly premise: string;
  readonly seedIds: readonly string[];
}
export interface BranchLifecycleRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly branchId: string;
}
export interface AddPremiseVersionRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly branchId: string;
  readonly text: string;
  readonly unresolvedAreas: readonly IdeationUnresolvedAreaV1[];
}
export interface TestPremiseRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly branchId: string;
  readonly answers: Readonly<Record<string, string>>;
  readonly purpose: string | null;
}
export interface CombineSeedsRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly seedIds: readonly string[];
  readonly name: string;
  readonly premise: string;
  readonly contributions: readonly IdeationSourceContributionV1[];
}
export interface FilterLibraryRequest extends IdeationProjectBinding {
  readonly filters: {
    readonly lifecycle?: IdeationLifecycle;
    readonly kind?: IdeationSeedKind;
    readonly tag?: string;
    readonly provenance?: IdeationProvenanceKind;
    readonly includeArchived?: boolean;
  };
}
export interface PreparePromotionRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly branchId: string;
  readonly destination: IdeationPromotionDestination;
  readonly seedIds: readonly string[];
  readonly selectedText: string;
}
export interface RequestAiAlternativesRequest extends IdeationProjectBinding {
  readonly expectedRevision: number;
  readonly branchId: string;
  readonly authorRequested: true;
  readonly purpose: string;
}

export type IdeationErrorCode =
  | 'NOT_AUTHORIZED' | 'NO_ACTIVE_PROJECT' | 'STALE_SESSION' | 'STALE_IDEATION'
  | 'INVALID_REQUEST' | 'IDEATION_UNAVAILABLE' | 'IDEATION_WRITE_FAILED'
  | 'UNKNOWN_SEED' | 'UNKNOWN_BRANCH' | 'ARCHIVED_BRANCH' | 'INVALID_LINEAGE'
  | 'AI_NOT_REQUESTED' | 'AI_UNAVAILABLE';
export interface IdeationError { readonly code: IdeationErrorCode; readonly message: string; }
export type IdeationResult = { readonly ok: true; readonly data: IdeationSnapshotV1 } | { readonly ok: false; readonly error: IdeationError };
export interface IdeationBridge {
  get(request: GetIdeationRequest): Promise<IdeationResult>;
  captureSeed(request: CaptureIdeaSeedRequest): Promise<IdeationResult>;
  updateSeed(request: UpdateIdeaSeedRequest): Promise<IdeationResult>;
  createBranch(request: CreateBranchRequest): Promise<IdeationResult>;
  copyBranch(request: CopyBranchRequest): Promise<IdeationResult>;
  mergeBranches(request: MergeBranchesRequest): Promise<IdeationResult>;
  splitBranch(request: SplitBranchRequest): Promise<IdeationResult>;
  archiveBranch(request: BranchLifecycleRequest): Promise<IdeationResult>;
  restoreBranch(request: BranchLifecycleRequest): Promise<IdeationResult>;
  addPremiseVersion(request: AddPremiseVersionRequest): Promise<IdeationResult>;
  testPremise(request: TestPremiseRequest): Promise<IdeationResult>;
  combineSeeds(request: CombineSeedsRequest): Promise<IdeationResult>;
  filterLibrary(request: FilterLibraryRequest): Promise<IdeationResult>;
  preparePromotion(request: PreparePromotionRequest): Promise<IdeationResult>;
  requestAiAlternatives(request: RequestAiAlternativesRequest): Promise<IdeationResult>;
}
