import { createHash } from 'node:crypto';

import {
  PROGRAM7_LOCAL_INFERENCE_BOUNDS,
  PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
  PROGRAM7_LOCAL_INFERENCE_MODEL,
  PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
  PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA,
  type Program7LocalInferenceOperationV1,
  type Program7LocalInferenceModelOutputV1,
  type Program7LocalInferenceReceiptV1,
  type Program7LocalInferenceRequestV1,
  type Program7LocalInferenceResponseV1,
  type Program7LocalInferenceStatusV1,
} from '../shared/localInference.js';
import {
  OllamaLocalInferenceTransportError,
  program7LocalInferencePromptHash,
  type OllamaLocalInferenceTransportResultV1,
} from './ollamaLocalInferenceTransport.js';

export const PROGRAM7_LOCAL_INFERENCE_DEFAULT_TIMEOUT_MS = 30_000 as const;

export interface Program7LocalInferenceTransportV1 {
  request(
    request: Program7LocalInferenceRequestV1,
    signal?: AbortSignal,
  ): Promise<unknown | OllamaLocalInferenceTransportResultV1>;
}

export interface Program7LocalInferenceServiceOptions {
  readonly transport: Program7LocalInferenceTransportV1;
  readonly timeoutMs?: number;
  readonly now?: () => number;
}

interface ActiveRequest {
  readonly controller: AbortController;
  cancelled: boolean;
  timedOut: boolean;
  cause: 'cancelled' | 'timeout' | null;
}

export class Program7LocalInferenceServiceError extends Error {
  constructor(
    readonly status: Program7LocalInferenceStatusV1,
    message: string,
  ) {
    super(message);
    this.name = 'Program7LocalInferenceServiceError';
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).sort().join('|') === [...keys].sort().join('|');
}

function boundedString(value: unknown, maximum: number, allowEmpty = false): value is string {
  return typeof value === 'string' && (allowEmpty || value.length > 0) && value.length <= maximum;
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function validIso(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function validHash(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function validOperation(value: unknown): value is Program7LocalInferenceOperationV1 {
  return (
    value === 'rewrite_candidate' || value === 'revision_recheck' || value === 'premise_alternative'
  );
}

export function program7LocalInferenceSchemaHash(): string {
  return sha256(
    `${PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA}|${PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA}`,
  );
}

function baseReceipt(
  request: Program7LocalInferenceRequestV1,
  now: () => number,
  startedAt = new Date(now()).toISOString(),
): Program7LocalInferenceReceiptV1 {
  return {
    endpoint: PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
    requestedModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
    actualModel: null,
    modelDigest: null,
    ollamaVersion: null,
    promptSha256: program7LocalInferencePromptHash(request),
    schemaSha256: program7LocalInferenceSchemaHash(),
    startedAt,
    firstTokenAt: null,
    endedAt: new Date(now()).toISOString(),
    promptTokens: 0,
    outputTokens: 0,
  };
}

export function validateProgram7LocalInferenceRequest(
  request: Program7LocalInferenceRequestV1,
): string | null {
  if (
    !record(request) ||
    !exactKeys(request, [
      'schema',
      'operation',
      'model',
      'requestId',
      'projectId',
      'source',
      'purpose',
      'limits',
      'protection',
    ])
  )
    return 'The local inference request shape is invalid.';
  if (
    request.schema !== PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA ||
    !validOperation(request.operation) ||
    request.model !== PROGRAM7_LOCAL_INFERENCE_MODEL ||
    !boundedString(request.requestId, 160) ||
    !boundedString(request.projectId, 240) ||
    !boundedString(request.purpose, 1_000) ||
    !record(request.source) ||
    !exactKeys(request.source, ['unitId', 'bodySha256', 'text']) ||
    !boundedString(request.source.unitId, 240) ||
    !validHash(request.source.bodySha256) ||
    !boundedString(
      request.source.text,
      PROGRAM7_LOCAL_INFERENCE_BOUNDS[request.operation].inputChars,
    ) ||
    !record(request.limits) ||
    !exactKeys(request.limits, ['inputChars', 'outputChars']) ||
    request.limits.inputChars !== PROGRAM7_LOCAL_INFERENCE_BOUNDS[request.operation].inputChars ||
    request.limits.outputChars !== PROGRAM7_LOCAL_INFERENCE_BOUNDS[request.operation].outputChars ||
    !record(request.protection) ||
    !exactKeys(request.protection, ['excluded', 'class']) ||
    typeof request.protection.excluded !== 'boolean' ||
    !['ordinary', 'metadata-only'].includes(String(request.protection.class))
  ) {
    return 'The local inference request exceeds its operation, source, or protection contract.';
  }
  return null;
}

function validReceipt(value: unknown): value is Program7LocalInferenceReceiptV1 {
  if (
    !record(value) ||
    !exactKeys(value, [
      'endpoint',
      'requestedModel',
      'actualModel',
      'modelDigest',
      'ollamaVersion',
      'promptSha256',
      'schemaSha256',
      'startedAt',
      'firstTokenAt',
      'endedAt',
      'promptTokens',
      'outputTokens',
    ])
  )
    return false;
  const promptTokens = value.promptTokens;
  const outputTokens = value.outputTokens;
  return (
    value.endpoint === PROGRAM7_LOCAL_INFERENCE_ENDPOINT &&
    value.requestedModel === PROGRAM7_LOCAL_INFERENCE_MODEL &&
    (value.actualModel === null || value.actualModel === PROGRAM7_LOCAL_INFERENCE_MODEL) &&
    (value.modelDigest === null || validHash(value.modelDigest)) &&
    (value.ollamaVersion === null || boundedString(value.ollamaVersion, 80)) &&
    validHash(value.promptSha256) &&
    validHash(value.schemaSha256) &&
    validIso(value.startedAt) &&
    (value.firstTokenAt === null || validIso(value.firstTokenAt)) &&
    validIso(value.endedAt) &&
    Number.isInteger(promptTokens) &&
    (promptTokens as number) >= 0 &&
    Number.isInteger(outputTokens) &&
    (outputTokens as number) >= 0
  );
}

function validSuccessfulReceipt(value: unknown): value is Program7LocalInferenceReceiptV1 {
  return (
    validReceipt(value) &&
    value.actualModel === PROGRAM7_LOCAL_INFERENCE_MODEL &&
    validHash(value.modelDigest) &&
    boundedString(value.ollamaVersion, 80) &&
    value.ollamaVersion.trim().length > 0
  );
}

function receiptMatchesRequest(
  value: unknown,
  request: Program7LocalInferenceRequestV1,
): value is Program7LocalInferenceReceiptV1 {
  return (
    validReceipt(value) &&
    value.promptSha256 === program7LocalInferencePromptHash(request) &&
    value.schemaSha256 === program7LocalInferenceSchemaHash()
  );
}

function validateModelOutput(
  value: unknown,
  request: Program7LocalInferenceRequestV1,
): Program7LocalInferenceModelOutputV1 | null {
  if (!record(value) || !exactKeys(value, ['status', 'text', 'reason'])) return null;
  const allowedStatus =
    request.operation === 'revision_recheck'
      ? ['appears_resolved', 'still_appears_present']
      : ['candidate'];
  if (
    !allowedStatus.includes(String(value.status)) ||
    !boundedString(value.text, request.limits.outputChars, true) ||
    !boundedString(value.reason, 1_000)
  )
    return null;
  if (value.status === 'candidate' && value.text.length === 0) return null;
  return value as unknown as Program7LocalInferenceModelOutputV1;
}

export function validateProgram7LocalInferenceResponse(
  value: unknown,
  request: Program7LocalInferenceRequestV1,
): Program7LocalInferenceResponseV1 | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      'schema',
      'requestId',
      'model',
      'status',
      'text',
      'reason',
      'usage',
      'receipt',
    ])
  ) {
    return null;
  }
  const usage = value.usage;
  const inputChars = record(usage) ? usage.inputChars : undefined;
  const outputChars = record(usage) ? usage.outputChars : undefined;
  if (
    value.schema !== PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA ||
    value.requestId !== request.requestId ||
    value.model !== PROGRAM7_LOCAL_INFERENCE_MODEL ||
    ![
      'candidate',
      'appears_resolved',
      'still_appears_present',
      'unavailable',
      'failed',
      'cancelled',
    ].includes(String(value.status)) ||
    !boundedString(value.text, request.limits.outputChars, true) ||
    !boundedString(value.reason, 1_000) ||
    !record(usage) ||
    !exactKeys(usage, ['inputChars', 'outputChars']) ||
    !Number.isInteger(inputChars) ||
    (inputChars as number) < 0 ||
    inputChars !== request.source.text.length ||
    (inputChars as number) > request.limits.inputChars ||
    !Number.isInteger(outputChars) ||
    outputChars !== value.text.length ||
    (outputChars as number) > request.limits.outputChars ||
    !receiptMatchesRequest(value.receipt, request)
  )
    return null;
  const status = value.status as Program7LocalInferenceStatusV1;
  if (status === 'candidate' && value.text.length === 0) return null;
  if (status !== 'candidate' && value.text.length > request.limits.outputChars) return null;
  if (
    (status === 'candidate' ||
      status === 'appears_resolved' ||
      status === 'still_appears_present') &&
    !validSuccessfulReceipt(value.receipt)
  )
    return null;
  return value as unknown as Program7LocalInferenceResponseV1;
}

function normalizeTransportResult(value: unknown): {
  payload: unknown;
  receipt: Program7LocalInferenceReceiptV1 | null;
} {
  if (record(value) && 'payload' in value && 'receipt' in value) {
    return { payload: value.payload, receipt: validReceipt(value.receipt) ? value.receipt : null };
  }
  if (record(value) && 'response' in value && 'receipt' in value) {
    return { payload: value.response, receipt: validReceipt(value.receipt) ? value.receipt : null };
  }
  return { payload: value, receipt: null };
}

function failure(
  request: Program7LocalInferenceRequestV1,
  now: () => number,
  status: 'unavailable' | 'failed' | 'cancelled',
  reason: string,
  receipt?: Program7LocalInferenceReceiptV1 | null,
): Program7LocalInferenceResponseV1 {
  const resolvedReceipt = receipt ?? baseReceipt(request, now);
  return {
    schema: PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA,
    requestId: request.requestId,
    model: PROGRAM7_LOCAL_INFERENCE_MODEL,
    status,
    text: '',
    reason,
    usage: { inputChars: request.source.text.length, outputChars: 0 },
    receipt: resolvedReceipt,
  };
}

export class Program7LocalInferenceService {
  private readonly timeoutMs: number;
  private readonly now: () => number;
  private readonly active = new Map<string, ActiveRequest>();

  constructor(private readonly options: Program7LocalInferenceServiceOptions) {
    this.timeoutMs = options.timeoutMs ?? PROGRAM7_LOCAL_INFERENCE_DEFAULT_TIMEOUT_MS;
    this.now = options.now ?? Date.now;
  }

  cancel(requestId: string): void {
    const active = this.active.get(requestId);
    if (!active) return;
    if (active.cause === null) {
      active.cancelled = true;
      active.cause = 'cancelled';
    }
    active.controller.abort();
  }

  async run(
    request: Program7LocalInferenceRequestV1,
    options: { readonly signal?: AbortSignal; readonly authorInvoked?: boolean } = {},
  ): Promise<Program7LocalInferenceResponseV1> {
    const requestError = validateProgram7LocalInferenceRequest(request);
    if (requestError) throw new Program7LocalInferenceServiceError('failed', requestError);
    if (options.authorInvoked !== true) {
      return failure(
        request,
        this.now,
        'failed',
        'Local inference requires an explicit author invocation.',
      );
    }
    if (request.protection.excluded || request.protection.class !== 'ordinary') {
      return failure(
        request,
        this.now,
        'failed',
        'Protected or metadata-only source content cannot be packaged for local inference.',
      );
    }
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1 || this.timeoutMs > 120_000) {
      return failure(
        request,
        this.now,
        'failed',
        'Local inference timeout configuration is invalid.',
      );
    }
    if (options.signal?.aborted) {
      return failure(request, this.now, 'cancelled', 'Local inference was cancelled.');
    }
    if (this.active.has(request.requestId)) {
      return failure(
        request,
        this.now,
        'failed',
        'This local inference request is already executing.',
      );
    }
    const controller = new AbortController();
    const active: ActiveRequest = { controller, cancelled: false, timedOut: false, cause: null };
    const forwardAbort = () => {
      if (active.cause === null) {
        active.cancelled = true;
        active.cause = 'cancelled';
      }
      controller.abort();
    };
    options.signal?.addEventListener('abort', forwardAbort, { once: true });
    this.active.set(request.requestId, active);
    const timeout = setTimeout(() => {
      if (active.cause === null) {
        active.timedOut = true;
        active.cause = 'timeout';
      }
      controller.abort();
    }, this.timeoutMs);
    try {
      let transportResult: unknown;
      try {
        transportResult = await Promise.race([
          this.options.transport.request(request, controller.signal),
          new Promise<never>((_, reject) =>
            controller.signal.addEventListener('abort', () => reject(new Error('aborted')), {
              once: true,
            }),
          ),
        ]);
      } catch (error) {
        if (controller.signal.aborted) {
          return failure(
            request,
            this.now,
            active.cause === 'cancelled' ? 'cancelled' : 'unavailable',
            active.cause === 'cancelled'
              ? 'Local inference was cancelled.'
              : 'Local inference timed out.',
            null,
          );
        }
        if (
          error instanceof OllamaLocalInferenceTransportError &&
          error.code === 'INVALID_RESPONSE'
        ) {
          return failure(
            request,
            this.now,
            'failed',
            'The local model returned an invalid structured response.',
          );
        }
        return failure(request, this.now, 'unavailable', 'The local model is unavailable.');
      }
      const normalized = normalizeTransportResult(transportResult);
      const trustedReceipt = normalized.receipt && receiptMatchesRequest(normalized.receipt, request) ? normalized.receipt : null;
      const modelOutput = validateModelOutput(normalized.payload, request);
      if (!modelOutput || !trustedReceipt) {
        return failure(
          request,
          this.now,
          'failed',
          'The local model returned an invalid structured response.',
          trustedReceipt,
        );
      }
      const response = validateProgram7LocalInferenceResponse(
        {
          schema: PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA,
          requestId: request.requestId,
          model: PROGRAM7_LOCAL_INFERENCE_MODEL,
          status: modelOutput.status,
          text: modelOutput.text,
          reason: modelOutput.reason,
          usage: {
            inputChars: request.source.text.length,
            outputChars: modelOutput.text.length,
          },
          receipt: trustedReceipt,
        },
        request,
      );
      if (!response) {
        return failure(
          request,
          this.now,
          'failed',
          'The local model returned an invalid structured response.',
          trustedReceipt,
        );
      }
      if (controller.signal.aborted) {
        return failure(
          request,
          this.now,
          active.cause === 'cancelled' ? 'cancelled' : 'unavailable',
          active.cause === 'cancelled'
            ? 'Local inference was cancelled.'
            : 'Local inference timed out.',
          response.receipt,
        );
      }
      return response;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', forwardAbort);
      this.active.delete(request.requestId);
    }
  }

  execute(
    request: Program7LocalInferenceRequestV1,
    options: { readonly signal?: AbortSignal; readonly authorInvoked?: boolean } = {},
  ) {
    return this.run(request, options);
  }

  invoke(
    request: Program7LocalInferenceRequestV1,
    options: { readonly signal?: AbortSignal; readonly authorInvoked?: boolean } = {},
  ) {
    return this.run(request, options);
  }
}

export function createProgram7LocalInferenceService(
  options: Program7LocalInferenceServiceOptions,
): Program7LocalInferenceService {
  return new Program7LocalInferenceService(options);
}
