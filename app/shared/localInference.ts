import type {
  StoryIntelligenceAnalysisPolicyV1,
  StoryIntelligenceProvenanceV1,
  StoryIntelligenceSourceClassV1,
  StoryPositionRefV1,
} from './ipc/storyIntelligence';
import { checkStoryIntelligencePermission, isStoryPositionRefV1 } from './storyIntelligencePolicy';

export const LOCAL_INFERENCE_SCHEMA_VERSION = 'BlackSkiesLocalInference v1' as const;
export const LOCAL_INFERENCE_OPERATIONS = ['structured-story-observation'] as const;
export const LOCAL_INFERENCE_DEFAULT_TIMEOUT_MS = 8_000 as const;

export type LocalInferenceOperationV1 = typeof LOCAL_INFERENCE_OPERATIONS[number];

export interface LocalInferenceSourceV1 {
  readonly ref: StoryPositionRefV1;
  readonly sourceClass: StoryIntelligenceSourceClassV1;
}

export interface LocalInferenceRequestV1 {
  readonly schemaVersion: typeof LOCAL_INFERENCE_SCHEMA_VERSION;
  readonly operationId: string;
  readonly projectId: string;
  readonly operation: LocalInferenceOperationV1;
  readonly sources: readonly LocalInferenceSourceV1[];
  readonly requestedAt: string;
  readonly manuallyRequested: true;
}

export interface LocalInferenceEndpointV1 {
  readonly origin: string;
  readonly modelId: string;
}

export interface LocalInferenceTransportV1 {
  request(
    endpoint: LocalInferenceEndpointV1,
    request: LocalInferenceRequestV1,
  ): Promise<unknown>;
}

export interface LocalInferenceCandidateV1 {
  readonly schemaVersion: typeof LOCAL_INFERENCE_SCHEMA_VERSION;
  readonly candidateId: string;
  readonly operationId: string;
  readonly projectId: string;
  readonly positionRefs: readonly StoryPositionRefV1[];
  readonly evidenceClass: 'inferred';
  readonly summary: string;
  readonly provenance: StoryIntelligenceProvenanceV1;
  readonly lifecycle: 'candidate';
  readonly expiresAt: string;
}

export type LocalInferenceFailureCodeV1 =
  | 'INVALID_REQUEST'
  | 'POLICY_DISABLED'
  | 'SOURCE_DENIED'
  | 'NON_LOCAL_ENDPOINT'
  | 'INVALID_RESPONSE'
  | 'TIMEOUT'
  | 'TRANSPORT_FAILED';

export interface LocalInferenceFailureV1 {
  readonly ok: false;
  readonly code: LocalInferenceFailureCodeV1;
  readonly message: string;
}

export interface LocalInferenceSuccessV1 {
  readonly ok: true;
  readonly candidate: LocalInferenceCandidateV1;
}

export type LocalInferenceResultV1 = LocalInferenceSuccessV1 | LocalInferenceFailureV1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function endpointIsLoopback(origin: string): boolean {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    return (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username && !url.password &&
      ['localhost', '127.0.0.1', '::1'].includes(hostname);
  } catch {
    return false;
  }
}

function invalid(message: string): LocalInferenceFailureV1 {
  return { ok: false, code: 'INVALID_REQUEST', message };
}

function validateRequest(request: LocalInferenceRequestV1): LocalInferenceFailureV1 | null {
  if (request.schemaVersion !== LOCAL_INFERENCE_SCHEMA_VERSION ||
    !isBoundedString(request.operationId, 160) ||
    !isBoundedString(request.projectId, 240) ||
    !LOCAL_INFERENCE_OPERATIONS.includes(request.operation) ||
    !isIsoDate(request.requestedAt) ||
    request.manuallyRequested !== true ||
    request.sources.length === 0 ||
    request.sources.length > 32 ||
    !request.sources.every((source) =>
      isRecord(source) &&
      isStoryPositionRefV1(source.ref, request.projectId) &&
      ['included', 'deterministic-only', 'hidden', 'masked', 'deleted', 'forgotten',
        'discarded', 'local-only', 'protected', 'ai-excluded'].includes(source.sourceClass))) {
    return invalid('request shape, project binding, manual trigger, or source boundary is invalid');
  }
  return null;
}

function candidateId(request: LocalInferenceRequestV1): string {
  return `local-inference:${request.projectId}:${request.operationId}`;
}

export async function runLocalInferenceV1(
  request: LocalInferenceRequestV1,
  options: {
    readonly policy: StoryIntelligenceAnalysisPolicyV1;
    readonly endpoint: LocalInferenceEndpointV1;
    readonly transport: LocalInferenceTransportV1;
    readonly now?: Date;
    readonly timeoutMs?: number;
  },
): Promise<LocalInferenceResultV1> {
  const requestError = validateRequest(request);
  if (requestError) return requestError;
  if (!options.policy.optionalInferenceEnabled) {
    return { ok: false, code: 'POLICY_DISABLED', message: 'Optional local inference is disabled by policy' };
  }
  if (!endpointIsLoopback(options.endpoint.origin)) {
    return { ok: false, code: 'NON_LOCAL_ENDPOINT', message: 'Local inference requires a loopback endpoint' };
  }
  for (const source of request.sources) {
    const permission = checkStoryIntelligencePermission(source.sourceClass, 'model-package', options.policy);
    if (!permission.allowed) {
      return { ok: false, code: 'SOURCE_DENIED', message: 'One or more selected sources cannot be packaged for local inference' };
    }
  }

  const timeoutMs = options.timeoutMs ?? LOCAL_INFERENCE_DEFAULT_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) {
    return invalid('timeout must be an integer between 1 and 30000 milliseconds');
  }

  let response: unknown;
  try {
    response = await Promise.race([
      options.transport.request(options.endpoint, request),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === 'timeout') {
      return { ok: false, code: 'TIMEOUT', message: 'Local inference timed out; no candidate was retained' };
    }
    return { ok: false, code: 'TRANSPORT_FAILED', message: 'Local inference was unavailable; no candidate was retained' };
  }

  if (!isRecord(response) || !isBoundedString(response.summary, 1_200)) {
    return { ok: false, code: 'INVALID_RESPONSE', message: 'Local inference returned no bounded structured observation' };
  }

  const now = options.now ?? new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString();
  return {
    ok: true,
    candidate: {
      schemaVersion: LOCAL_INFERENCE_SCHEMA_VERSION,
      candidateId: candidateId(request),
      operationId: request.operationId,
      projectId: request.projectId,
      positionRefs: request.sources.map((source) => source.ref),
      evidenceClass: 'inferred',
      summary: response.summary,
      provenance: {
        sourceOwner: 'Local inference gateway',
        origin: 'local-inference',
        visibility: 'included',
        citationRequired: true,
        protectionClass: 'local-only',
      },
      lifecycle: 'candidate',
      expiresAt,
    },
  };
}
