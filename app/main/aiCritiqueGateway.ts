import {
  AI_CRITIQUE_MODEL,
  AI_CRITIQUE_MAX_OUTPUT_TOKENS,
  AI_CRITIQUE_PROVIDER,
  type AiCritiqueCompletedResult,
  type AiCritiqueContent,
  type AiCritiqueError,
  type AiCritiquePriority,
} from '../shared/ipc/aiCritique.js';
import { createHash } from 'node:crypto';
import { sha256 } from './aiCritiqueCoordinator.js';

export const AI_CRITIQUE_RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';
export const AI_CRITIQUE_TIMEOUT_MS = 90_000;

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface AiCritiqueGatewayRequest {
  readonly requestId: string;
  readonly credential: string;
  readonly providerBodyJson: string;
  readonly payloadHash: string;
  readonly selectedText: string;
  readonly sourceFingerprint: string;
  readonly selectionFingerprint: string;
  readonly editorRevision: number;
  /** Main-internal only; never supplied through IPC or returned to a renderer. */
  readonly evidenceAttemptId?: string;
}

export interface AiCritiqueGatewayEvidence {
  readonly attemptId: string;
  readonly status: number;
  readonly body: Uint8Array;
  readonly bodySha256: string;
  readonly byteLength: number;
  readonly providerRequestId: string | null;
}

export interface AiCritiqueGatewayOptions {
  readonly fetch?: FetchLike;
  readonly now?: () => number;
  readonly timeoutMs?: number;
  /** Qualification-only main-process sink. Its absence is the normal product path. */
  readonly evidenceSink?: (evidence: AiCritiqueGatewayEvidence) => Promise<void> | void;
}

export class AiCritiqueGatewayError extends Error {
  constructor(
    readonly detail: AiCritiqueError,
    /** Main-process-only operator metadata. It is never included in the IPC error contract. */
    readonly providerFailure?: AiCritiqueProviderFailure,
  ) {
    super(detail.message);
    this.name = 'AiCritiqueGatewayError';
  }
}

export interface AiCritiqueProviderFailure {
  readonly httpStatus: number;
  readonly providerType: string | null;
  readonly providerCode: string | null;
  /** A fixed local message; never provider-supplied response text. */
  readonly sanitizedMessage: string;
}

interface ActiveRequest {
  readonly controller: AbortController;
  cancelled: boolean;
  timedOut: boolean;
}

function gatewayError(
  code: AiCritiqueError['code'],
  message: string,
  retryable = false,
): AiCritiqueGatewayError {
  return new AiCritiqueGatewayError({ code, message, retryable });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).sort().join('|') === [...keys].sort().join('|');
}

function boundedString(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= maximum;
}

function boundedStringArray(value: unknown, maximumItems: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maximumItems &&
    value.every((entry) => boundedString(entry, 800))
  );
}

function parsePriority(value: unknown, selectedText: string): AiCritiquePriority | null {
  if (!isRecord(value) || !hasExactKeys(value, ['evidence', 'observation', 'impact', 'revisionQuestion'])) {
    return null;
  }
  if (
    !boundedString(value.evidence, 500) ||
    !boundedString(value.observation, 800) ||
    !boundedString(value.impact, 800) ||
    !boundedString(value.revisionQuestion, 800) ||
    !selectedText.includes(value.evidence)
  ) {
    return null;
  }
  return {
    evidence: value.evidence,
    observation: value.observation,
    impact: value.impact,
    revisionQuestion: value.revisionQuestion,
  };
}

export function validateAiCritiqueContent(value: unknown, selectedText: string): AiCritiqueContent {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['overview', 'strengths', 'priorities', 'uncertainties', 'limitations']) ||
    !boundedString(value.overview, 1200) ||
    !boundedStringArray(value.strengths, 3) ||
    !Array.isArray(value.priorities) ||
    value.priorities.length > 5 ||
    !boundedStringArray(value.uncertainties, 3) ||
    !boundedStringArray(value.limitations, 3)
  ) {
    throw gatewayError(
      'PROVIDER_RESPONSE_INVALID',
      'The provider returned an invalid critique response.',
    );
  }
  const priorities = value.priorities.map((entry) => parsePriority(entry, selectedText));
  if (priorities.some((entry) => entry === null)) {
    throw gatewayError(
      'PROVIDER_RESPONSE_INVALID',
      'The provider returned critique evidence that was not verbatim source text.',
    );
  }
  return {
    overview: value.overview,
    strengths: value.strengths,
    priorities: priorities as AiCritiquePriority[],
    uncertainties: value.uncertainties,
    limitations: value.limitations,
  };
}

function extractOutputText(response: Record<string, unknown>): string {
  if (!Array.isArray(response.output)) {
    throw gatewayError('PROVIDER_RESPONSE_INVALID', 'The provider returned no critique output.');
  }
  let outputText: string | null = null;
  for (const outputItem of response.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) continue;
    for (const content of outputItem.content) {
      if (!isRecord(content)) continue;
      if (content.type === 'refusal') {
        throw gatewayError('PROVIDER_REFUSAL', 'The provider declined the critique request.');
      }
      if (content.type === 'output_text' && typeof content.text === 'string') {
        if (outputText !== null) {
          throw gatewayError('PROVIDER_RESPONSE_INVALID', 'The provider returned ambiguous critique output.');
        }
        outputText = content.text;
      }
    }
  }
  if (outputText === null) {
    throw gatewayError('PROVIDER_RESPONSE_INVALID', 'The provider returned no critique output.');
  }
  return outputText;
}

function parseUsage(value: unknown): {
  readonly inputTokens: number;
  readonly cachedInputTokens: number;
  readonly outputTokens: number;
} {
  if (!isRecord(value)) {
    throw gatewayError('PROVIDER_RESPONSE_INVALID', 'The provider returned invalid usage accounting.');
  }
  const inputTokens = value.input_tokens;
  const outputTokens = value.output_tokens;
  const details = value.input_tokens_details;
  const cachedInputTokens = isRecord(details) ? details.cached_tokens : 0;
  if (
    !Number.isInteger(inputTokens) ||
    !Number.isInteger(outputTokens) ||
    !Number.isInteger(cachedInputTokens) ||
    (inputTokens as number) < 0 ||
    (outputTokens as number) < 0 ||
    (cachedInputTokens as number) < 0 ||
    (cachedInputTokens as number) > (inputTokens as number) ||
    (outputTokens as number) > AI_CRITIQUE_MAX_OUTPUT_TOKENS
  ) {
    throw gatewayError('PROVIDER_RESPONSE_INVALID', 'The provider returned invalid usage accounting.');
  }
  return {
    inputTokens: inputTokens as number,
    outputTokens: outputTokens as number,
    cachedInputTokens: cachedInputTokens as number,
  };
}

function calculatedUsd(inputTokens: number, cachedInputTokens: number, outputTokens: number): number {
  const value =
    ((inputTokens - cachedInputTokens) * 2.5 + cachedInputTokens * 0.25 + outputTokens * 15) /
    1_000_000;
  return Math.round(value * 1_000_000) / 1_000_000;
}

function parseJsonBytes(bytes: Uint8Array): unknown | null {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function providerIdentifier(value: unknown): string | null {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/i.test(value)) return null;
  return value;
}

function providerFailure(status: number, body: Uint8Array): AiCritiqueProviderFailure | null {
  const parsed = parseJsonBytes(body);
  if (!isRecord(parsed) || !isRecord(parsed.error)) return null;
  const providerType = providerIdentifier(parsed.error.type);
  const providerCode = providerIdentifier(parsed.error.code);
  if (providerType === null && providerCode === null) return null;
  return {
    httpStatus: status,
    providerType,
    providerCode,
    // Do not retain provider-supplied text: it can echo private request content.
    sanitizedMessage: 'The provider rejected a request parameter.',
  };
}

function classifyHttpFailure(status: number, body: Uint8Array): AiCritiqueGatewayError {
  if (status === 401 || status === 403) {
    return gatewayError('PROVIDER_AUTH', 'The provider rejected the session credential.');
  }
  if (status === 429) {
    const parsed = parseJsonBytes(body);
    if (
      isRecord(parsed) &&
      isRecord(parsed.error) &&
      (parsed.error.code === 'insufficient_quota' || parsed.error.type === 'insufficient_quota')
    ) {
      return gatewayError('PROVIDER_QUOTA', 'The provider account has insufficient quota.');
    }
    return gatewayError('PROVIDER_RATE_LIMIT', 'The provider rate-limited the critique request.', true);
  }
  if (status >= 500) {
    return gatewayError('PROVIDER_UNAVAILABLE', 'The provider is temporarily unavailable.', true);
  }
  const failure = providerFailure(status, body);
  if (status === 400 && failure) {
    return new AiCritiqueGatewayError(
      {
        code: 'PROVIDER_ERROR',
        message: 'The provider rejected the critique request.',
        retryable: false,
      },
      failure,
    );
  }
  return gatewayError('PROVIDER_ERROR', 'The provider rejected the critique request.');
}

export class AiCritiqueGateway {
  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;
  private readonly timeoutMs: number;
  private readonly evidenceSink: AiCritiqueGatewayOptions['evidenceSink'];
  private readonly active = new Map<string, ActiveRequest>();

  constructor(options: AiCritiqueGatewayOptions = {}) {
    this.fetchImpl = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.timeoutMs = options.timeoutMs ?? AI_CRITIQUE_TIMEOUT_MS;
    this.evidenceSink = options.evidenceSink;
  }

  cancel(requestId: string): void {
    const active = this.active.get(requestId);
    if (!active) return;
    active.cancelled = true;
    active.controller.abort();
  }

  async execute(request: AiCritiqueGatewayRequest): Promise<AiCritiqueCompletedResult> {
    if (this.active.has(request.requestId)) {
      throw gatewayError('REQUEST_TERMINAL', 'The critique request is already executing.');
    }
    if (sha256(request.providerBodyJson) !== request.payloadHash) {
      throw gatewayError('APPROVAL_MISMATCH', 'The approved critique payload no longer matches.');
    }
    const active: ActiveRequest = {
      controller: new AbortController(),
      cancelled: false,
      timedOut: false,
    };
    this.active.set(request.requestId, active);
    const timeout = setTimeout(() => {
      active.timedOut = true;
      active.controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchImpl(AI_CRITIQUE_RESPONSES_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${request.credential}`,
          'Content-Type': 'application/json',
        },
        body: request.providerBodyJson,
        signal: active.controller.signal,
      });
      if (active.cancelled) {
        throw gatewayError('CANCELLED', 'The local critique wait was cancelled.');
      }
      if (active.timedOut) {
        throw gatewayError('PROVIDER_TIMEOUT', 'The provider did not respond within 90 seconds.', true);
      }
      const body = new Uint8Array(await response.arrayBuffer());
      if (this.evidenceSink && request.evidenceAttemptId) {
        await this.evidenceSink({
          attemptId: request.evidenceAttemptId,
          status: response.status,
          body,
          bodySha256: createHash('sha256').update(body).digest('hex'),
          byteLength: body.byteLength,
          providerRequestId: response.headers.get('x-request-id'),
        });
      }
      if (!response.ok) throw classifyHttpFailure(response.status, body);
      const providerResponse = parseJsonBytes(body);
      if (providerResponse === null) {
        throw gatewayError('PROVIDER_RESPONSE_INVALID', 'The provider returned invalid response data.');
      }
      if (
        active.cancelled ||
        active.timedOut ||
        !isRecord(providerResponse) ||
        providerResponse.status !== 'completed' ||
        providerResponse.model !== AI_CRITIQUE_MODEL
      ) {
        if (active.cancelled) throw gatewayError('CANCELLED', 'The local critique wait was cancelled.');
        if (active.timedOut) {
          throw gatewayError('PROVIDER_TIMEOUT', 'The provider did not respond within 90 seconds.', true);
        }
        throw gatewayError('PROVIDER_RESPONSE_INVALID', 'The provider returned invalid model provenance.');
      }
      const outputText = extractOutputText(providerResponse);
      let parsed: unknown;
      try {
        parsed = JSON.parse(outputText);
      } catch {
        throw gatewayError('PROVIDER_RESPONSE_INVALID', 'The provider returned invalid structured output.');
      }
      const content = validateAiCritiqueContent(parsed, request.selectedText);
      const usage = parseUsage(providerResponse.usage);
      if (active.cancelled) throw gatewayError('CANCELLED', 'The local critique wait was cancelled.');
      if (active.timedOut) {
        throw gatewayError('PROVIDER_TIMEOUT', 'The provider did not respond within 90 seconds.', true);
      }
      return {
        requestId: request.requestId,
        provider: AI_CRITIQUE_PROVIDER,
        model: AI_CRITIQUE_MODEL,
        taskContractVersion: 'black_skies_critique_v1',
        sourceFingerprint: request.sourceFingerprint,
        selectionFingerprint: request.selectionFingerprint,
        editorRevision: request.editorRevision,
        completedAt: new Date(this.now()).toISOString(),
        content,
        usage: {
          ...usage,
          calculatedUsd: calculatedUsd(
            usage.inputTokens,
            usage.cachedInputTokens,
            usage.outputTokens,
          ),
          invoiceDisclaimer: 'Calculated usage cost - not provider invoice.',
        },
      };
    } catch (error) {
      if (error instanceof AiCritiqueGatewayError) throw error;
      if (active.cancelled) {
        throw gatewayError('CANCELLED', 'The local critique wait was cancelled.');
      }
      if (active.timedOut) {
        throw gatewayError('PROVIDER_TIMEOUT', 'The provider did not respond within 90 seconds.', true);
      }
      throw gatewayError('PROVIDER_UNAVAILABLE', 'The provider request could not be completed.', true);
    } finally {
      clearTimeout(timeout);
      this.active.delete(request.requestId);
    }
  }
}
