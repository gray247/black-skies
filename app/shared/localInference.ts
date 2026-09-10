import type {
  StoryIntelligenceAnalysisPolicyV1,
  StoryIntelligenceProvenanceV1,
  StoryIntelligenceSourceClassV1,
  StoryPositionRefV1,
} from './ipc/storyIntelligence';
import { checkStoryIntelligencePermission, isStoryPositionRefV1 } from './storyIntelligencePolicy';

export const LOCAL_INFERENCE_SCHEMA_VERSION = 'BlackSkiesLocalInference v1' as const;
/**
 * The original Program 6 operation remains supported. Program 7 uses the
 * closed operation names below; the two contracts intentionally share the
 * cancellation-aware transport seam.
 */
export const LOCAL_INFERENCE_OPERATIONS = ['structured-story-observation'] as const;
export const PROGRAM7_LOCAL_INFERENCE_OPERATIONS = [
  'rewrite_candidate',
  'revision_recheck',
  'premise_alternative',
] as const;
export const PROGRAM7_LOCAL_INFERENCE_ENDPOINT = 'http://127.0.0.1:11434' as const;
export const PROGRAM7_LOCAL_INFERENCE_BASE_URL = PROGRAM7_LOCAL_INFERENCE_ENDPOINT;
export const PROGRAM7_LOCAL_INFERENCE_MODEL = 'qwen3:4b' as const;
export const PROGRAM7_LOCAL_INFERENCE_MODEL_ID = PROGRAM7_LOCAL_INFERENCE_MODEL;
export const PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA =
  'program7.local-inference.request.v1' as const;
export const PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA =
  'program7.local-inference.response.v1' as const;
export const PROGRAM7_LOCAL_INFERENCE_MODEL_OUTPUT_SCHEMA =
  'program7.local-inference.model-output.v1' as const;
export const PROGRAM7_LOCAL_INFERENCE_BOUNDS = {
  rewrite_candidate: { inputChars: 12_000, outputChars: 6_000 },
  revision_recheck: { inputChars: 8_000, outputChars: 2_000 },
  premise_alternative: { inputChars: 12_000, outputChars: 6_000 },
} as const;
export const LOCAL_INFERENCE_DEFAULT_TIMEOUT_MS = 8_000 as const;

export type LocalInferenceOperationV1 = (typeof LOCAL_INFERENCE_OPERATIONS)[number];

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
    signal?: AbortSignal,
  ): Promise<unknown>;
}

export type Program7LocalInferenceOperationV1 =
  (typeof PROGRAM7_LOCAL_INFERENCE_OPERATIONS)[number];

export interface Program7LocalInferenceRequestV1 {
  readonly schema: typeof PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA;
  readonly operation: Program7LocalInferenceOperationV1;
  readonly model: typeof PROGRAM7_LOCAL_INFERENCE_MODEL;
  readonly requestId: string;
  readonly projectId: string;
  readonly source: {
    readonly unitId: string;
    readonly bodySha256: string;
    readonly text: string;
  };
  readonly purpose: string;
  readonly limits: {
    readonly inputChars: number;
    readonly outputChars: number;
  };
  readonly protection: {
    readonly excluded: boolean;
    readonly class: 'ordinary' | 'metadata-only';
  };
}

export type Program7LocalInferenceStatusV1 =
  | 'candidate'
  | 'appears_resolved'
  | 'still_appears_present'
  | 'unavailable'
  | 'failed'
  | 'cancelled';

export interface Program7LocalInferenceReceiptV1 {
  readonly endpoint: typeof PROGRAM7_LOCAL_INFERENCE_ENDPOINT;
  readonly requestedModel: typeof PROGRAM7_LOCAL_INFERENCE_MODEL;
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
}

/** The only shape the model is allowed to return. The service adds all
 * identity, usage, and receipt fields after validating this inner result. */
export interface Program7LocalInferenceModelOutputV1 {
  readonly status: 'candidate' | 'appears_resolved' | 'still_appears_present';
  readonly text: string;
  readonly reason: string;
}

export interface Program7LocalInferenceResponseV1 {
  readonly schema: typeof PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA;
  readonly requestId: string;
  readonly model: typeof PROGRAM7_LOCAL_INFERENCE_MODEL;
  readonly status: Program7LocalInferenceStatusV1;
  readonly text: string;
  readonly reason: string;
  readonly usage: { readonly inputChars: number; readonly outputChars: number };
  readonly receipt: Program7LocalInferenceReceiptV1;
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
  | 'CANCELLED'
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
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username &&
      !url.password &&
      ['localhost', '127.0.0.1', '::1'].includes(hostname)
    );
  } catch {
    return false;
  }
}

function invalid(message: string): LocalInferenceFailureV1 {
  return { ok: false, code: 'INVALID_REQUEST', message };
}

function validateRequest(request: unknown): LocalInferenceFailureV1 | null {
  if (!isRecord(request))
    return invalid('request shape, project binding, manual trigger, or source boundary is invalid');
  const candidate = request as Record<string, unknown>;
  const projectId = isBoundedString(candidate.projectId, 240) ? candidate.projectId : null;
  const sources = Array.isArray(candidate.sources) ? candidate.sources : null;
  if (
    candidate.schemaVersion !== LOCAL_INFERENCE_SCHEMA_VERSION ||
    !isBoundedString(candidate.operationId, 160) ||
    projectId === null ||
    !LOCAL_INFERENCE_OPERATIONS.some((operation) => operation === candidate.operation) ||
    !isIsoDate(candidate.requestedAt) ||
    candidate.manuallyRequested !== true ||
    sources === null ||
    sources.length === 0 ||
    sources.length > 32 ||
    !sources.every(
      (source) =>
        isRecord(source) &&
        isStoryPositionRefV1(source.ref, projectId) &&
        typeof source.sourceClass === 'string' &&
        [
          'included',
          'deterministic-only',
          'hidden',
          'masked',
          'deleted',
          'forgotten',
          'discarded',
          'local-only',
          'protected',
          'ai-excluded',
        ].includes(source.sourceClass),
    )
  ) {
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
    readonly signal?: AbortSignal;
  },
): Promise<LocalInferenceResultV1> {
  const requestError = validateRequest(request);
  if (requestError) return requestError;
  if (!options.policy.optionalInferenceEnabled) {
    return {
      ok: false,
      code: 'POLICY_DISABLED',
      message: 'Optional local inference is disabled by policy',
    };
  }
  if (!endpointIsLoopback(options.endpoint.origin)) {
    return {
      ok: false,
      code: 'NON_LOCAL_ENDPOINT',
      message: 'Local inference requires a loopback endpoint',
    };
  }
  for (const source of request.sources) {
    const permission = checkStoryIntelligencePermission(
      source.sourceClass,
      'model-package',
      options.policy,
    );
    if (!permission.allowed) {
      return {
        ok: false,
        code: 'SOURCE_DENIED',
        message: 'One or more selected sources cannot be packaged for local inference',
      };
    }
  }

  let response: unknown;
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? LOCAL_INFERENCE_DEFAULT_TIMEOUT_MS;
  const abortFromCaller = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  if (options.signal?.aborted) {
    return {
      ok: false,
      code: 'CANCELLED',
      message: 'Local inference was cancelled; no candidate was retained',
    };
  }
  options.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) {
      return invalid('timeout must be an integer between 1 and 30000 milliseconds');
    }
    response = await Promise.race([
      options.transport.request(options.endpoint, request, controller.signal),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('aborted')), {
          once: true,
        });
      }),
    ]);
  } catch {
    if (options.signal?.aborted) {
      return {
        ok: false,
        code: 'CANCELLED',
        message: 'Local inference was cancelled; no candidate was retained',
      };
    }
    if (controller.signal.aborted) {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: 'Local inference timed out; no candidate was retained',
      };
    }
    return {
      ok: false,
      code: 'TRANSPORT_FAILED',
      message: 'Local inference was unavailable; no candidate was retained',
    };
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }

  if (!isRecord(response) || !isBoundedString(response.summary, 1_200)) {
    return {
      ok: false,
      code: 'INVALID_RESPONSE',
      message: 'Local inference returned no bounded structured observation',
    };
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
