export const AI_CRITIQUE_CHANNELS = {
  credentialStatus: 'ai-critique:credential-status',
  setCredential: 'ai-critique:set-credential',
  clearCredential: 'ai-critique:clear-credential',
  prepare: 'ai-critique:prepare',
  approveAndExecute: 'ai-critique:approve-and-execute',
  cancel: 'ai-critique:cancel',
  invalidate: 'ai-critique:invalidate',
  stateChanged: 'ai-critique:state-changed',
} as const;

export const AI_CRITIQUE_PROVIDER = 'openai' as const;
export const AI_CRITIQUE_MODEL = 'gpt-5.4-2026-03-05' as const;
export const AI_CRITIQUE_TASK_CONTRACT_VERSION = 'black_skies_critique_v2' as const;
export const AI_CRITIQUE_PRICING_VERIFIED_AT = '2026-07-14' as const;
export const AI_CRITIQUE_AUTHORIZATION_CEILING_USD = 0.1 as const;
export const AI_CRITIQUE_MAX_OUTPUT_TOKENS = 1600 as const;
export const AI_CRITIQUE_MIN_SELECTION_LENGTH = 200 as const;
export const AI_CRITIQUE_MAX_SELECTION_LENGTH = 12_000 as const;

export type AiCritiqueLifecycleStatus =
  | 'prepared'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'invalidated';

export type AiCritiqueErrorCode =
  | 'NOT_WRITING_STUDIO'
  | 'NO_ACTIVE_PROJECT'
  | 'STALE_SESSION'
  | 'INVALID_SELECTION'
  | 'INVALID_REQUEST'
  | 'REQUEST_NOT_FOUND'
  | 'REQUEST_EXPIRED'
  | 'REQUEST_TERMINAL'
  | 'APPROVAL_MISMATCH'
  | 'CREDENTIAL_MISSING'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_AUTH'
  | 'PROVIDER_RATE_LIMIT'
  | 'PROVIDER_QUOTA'
  | 'PROVIDER_REFUSAL'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_RESPONSE_INVALID'
  | 'PROVIDER_ERROR'
  | 'CANCELLED';

export interface AiCritiqueError {
  readonly code: AiCritiqueErrorCode;
  readonly message: string;
  readonly retryable: boolean;
}

export interface AiCritiqueSuccess<T> {
  readonly ok: true;
  readonly data: T;
}

export interface AiCritiqueFailure {
  readonly ok: false;
  readonly error: AiCritiqueError;
}

export type AiCritiqueResult<T> = AiCritiqueSuccess<T> | AiCritiqueFailure;

export interface AiCritiqueSelectionEvidence {
  readonly projectId: string;
  readonly unitId: string;
  readonly generation: number;
  readonly projectRevision: number;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly selectedText: string;
  readonly editorRevision: number;
  readonly sourceFingerprint: string;
  readonly selectionFingerprint: string;
}

export interface AiCritiquePrepareRequest {
  readonly operationId: string;
  readonly selection: AiCritiqueSelectionEvidence;
}

export interface AiCritiqueCostPreview {
  readonly currency: 'USD';
  readonly pricingVerifiedAt: typeof AI_CRITIQUE_PRICING_VERIFIED_AT;
  readonly inputUsdPerMillionTokens: 2.5;
  readonly cachedInputUsdPerMillionTokens: 0.25;
  readonly outputUsdPerMillionTokens: 15;
  readonly estimatedInputTokens: number;
  readonly maximumInputTokens: number;
  readonly maximumOutputTokens: typeof AI_CRITIQUE_MAX_OUTPUT_TOKENS;
  readonly estimatedUsd: number;
  readonly maximumCalculatedUsd: number;
  readonly authorizationCeilingUsd: typeof AI_CRITIQUE_AUTHORIZATION_CEILING_USD;
  readonly invoiceDisclaimer: 'Calculated usage cost - not provider invoice.';
}

export interface AiCritiquePreview {
  readonly requestId: string;
  readonly status: 'prepared';
  readonly expiresAt: string;
  readonly payloadHash: string;
  readonly providerBodyJson: string;
  readonly provider: typeof AI_CRITIQUE_PROVIDER;
  readonly model: typeof AI_CRITIQUE_MODEL;
  readonly remote: true;
  readonly taskContractVersion: typeof AI_CRITIQUE_TASK_CONTRACT_VERSION;
  readonly instructions: string;
  readonly selectedText: string;
  readonly cost: AiCritiqueCostPreview;
  readonly retentionDisclosure: string;
  readonly clearanceDisclosure: string;
  readonly cancellationDisclosure: string;
}

export interface AiCritiqueApprovalRequest {
  readonly operationId: string;
  readonly requestId: string;
  readonly payloadHash: string;
  readonly editorRevision: number;
  readonly sourceFingerprint: string;
  readonly selectionFingerprint: string;
  readonly transmissionConfirmed: true;
  readonly authorizationCeilingUsd: typeof AI_CRITIQUE_AUTHORIZATION_CEILING_USD;
}

export interface AiCritiqueRequestReference {
  readonly requestId: string;
  readonly operationId: string;
}

export interface AiCritiquePriority {
  readonly evidence: string;
  readonly observation: string;
  readonly impact: string;
  readonly revisionQuestion: string;
}

export interface AiCritiqueContent {
  readonly overview: string;
  readonly strengths: readonly string[];
  readonly priorities: readonly AiCritiquePriority[];
  readonly uncertainties: readonly string[];
  readonly limitations: readonly string[];
}

export interface AiCritiqueUsage {
  readonly inputTokens: number;
  readonly cachedInputTokens: number;
  readonly outputTokens: number;
  readonly calculatedUsd: number;
  readonly invoiceDisclaimer: 'Calculated usage cost - not provider invoice.';
}

export interface AiCritiqueCompletedResult {
  readonly requestId: string;
  readonly provider: typeof AI_CRITIQUE_PROVIDER;
  readonly model: typeof AI_CRITIQUE_MODEL;
  readonly taskContractVersion: typeof AI_CRITIQUE_TASK_CONTRACT_VERSION;
  readonly sourceFingerprint: string;
  readonly selectionFingerprint: string;
  readonly editorRevision: number;
  readonly completedAt: string;
  readonly content: AiCritiqueContent;
  readonly usage: AiCritiqueUsage;
}

export interface AiCritiqueState {
  readonly requestId: string;
  readonly status: AiCritiqueLifecycleStatus;
  readonly error?: AiCritiqueError;
  readonly result?: AiCritiqueCompletedResult;
}

export interface AiCritiqueCredentialStatus {
  readonly configured: boolean;
}

export interface AiCritiqueBridge {
  credentialStatus(): Promise<AiCritiqueCredentialStatus>;
  setCredential(credential: string): Promise<AiCritiqueResult<AiCritiqueCredentialStatus>>;
  clearCredential(): Promise<AiCritiqueCredentialStatus>;
  prepare(request: AiCritiquePrepareRequest): Promise<AiCritiqueResult<AiCritiquePreview>>;
  approveAndExecute(
    request: AiCritiqueApprovalRequest,
  ): Promise<AiCritiqueResult<AiCritiqueRequestReference>>;
  cancel(request: AiCritiqueRequestReference): Promise<AiCritiqueResult<AiCritiqueState>>;
  invalidate(request: AiCritiqueRequestReference): Promise<AiCritiqueResult<AiCritiqueState>>;
  subscribeState(listener: (state: AiCritiqueState) => void): () => void;
}
