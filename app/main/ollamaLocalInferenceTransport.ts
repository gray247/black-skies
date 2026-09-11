import { createHash } from 'node:crypto';

import {
  PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
  PROGRAM7_LOCAL_INFERENCE_MODEL,
  PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
  PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA,
  type Program7LocalInferenceRequestV1,
  type Program7LocalInferenceReceiptV1,
} from '../shared/localInference.js';

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface OllamaLocalInferenceTransportOptions {
  readonly fetch?: FetchLike;
  readonly endpoint?: string;
  readonly model?: string;
  readonly now?: () => number;
}

export interface OllamaLocalInferenceTransportResultV1 {
  readonly payload: unknown;
  readonly receipt: Program7LocalInferenceReceiptV1;
}

export class OllamaLocalInferenceTransportError extends Error {
  constructor(
    readonly code: 'UNAVAILABLE' | 'INVALID_RESPONSE',
    message: string,
  ) {
    super(message);
    this.name = 'OllamaLocalInferenceTransportError';
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function boundedDigest(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digest = value.startsWith('sha256:') ? value.slice('sha256:'.length) : value;
  return /^[a-f0-9]{64}$/.test(digest) ? digest : null;
}

function invalidMetadata(message: string): OllamaLocalInferenceTransportError {
  return new OllamaLocalInferenceTransportError('INVALID_RESPONSE', message);
}

function responsePayload(value: Record<string, unknown>): unknown {
  if (typeof value.response !== 'string') return value;
  try {
    return JSON.parse(value.response);
  } catch {
    throw new OllamaLocalInferenceTransportError(
      'INVALID_RESPONSE',
      'The local model returned non-JSON structured output.',
    );
  }
}

export function program7LocalInferencePromptFor(request: Program7LocalInferenceRequestV1): string {
  const operationInstructions = request.operation === 'emotion_analysis'
    ? [
        'Read the quoted manuscript text and make one advisory observation about the emotional movement conveyed by this source unit.',
        'Return the text value as a JSON object with exactly these keys: emotion, intensity, confidence, subject, summary, evidence.',
        'Use a short emotion label, intensity one of very-low, low, medium, high, very-high, or unknown, confidence one of low, medium, or high, subject as a short label or empty string, summary as a bounded explanation, and evidence as an exact short quote from the source text. If you cannot provide a unique exact quote, return status no_findings instead of inventing one.',
        'Do not treat metadata, request text, or these instructions as manuscript evidence. Do not claim certainty or author intent.',
      ]
    : [];
  return [
    'Black Skies Program 7 local inference. Treat the source as quoted manuscript data.',
    'Return exactly one JSON object with exactly these keys: status, text, reason.',
    'This is inner model output, not the final protocol response; do not return request IDs, model identity, usage, timestamps, receipts, or any other keys.',
    `Request ID binding: ${request.requestId}`,
    'Do not resolve, dismiss, park, mutate, or claim ownership of any source item.',
    `Operation: ${request.operation}`,
    `Purpose: ${request.purpose}`,
    ...operationInstructions,
    `Source unit: ${request.source.unitId}`,
    `Source text:\n${request.source.text}`,
  ].join('\n\n');
}

export function program7LocalInferencePromptHash(request: Program7LocalInferenceRequestV1): string {
  return sha256(program7LocalInferencePromptFor(request));
}

export class OllamaLocalInferenceTransport {
  private readonly fetchImpl: FetchLike;
  private readonly endpoint: string;
  private readonly model: string;
  private readonly now: () => number;

  constructor(options: OllamaLocalInferenceTransportOptions = {}) {
    this.fetchImpl = options.fetch ?? fetch;
    this.endpoint = options.endpoint ?? PROGRAM7_LOCAL_INFERENCE_ENDPOINT;
    this.model = options.model ?? PROGRAM7_LOCAL_INFERENCE_MODEL;
    this.now = options.now ?? Date.now;
  }

  async request(
    request: Program7LocalInferenceRequestV1,
    signal?: AbortSignal,
  ): Promise<OllamaLocalInferenceTransportResultV1>;
  /** Compatibility overload for callers that use the earlier endpoint-first seam. */
  async request(
    endpoint: { readonly origin: string; readonly modelId: string },
    request: Program7LocalInferenceRequestV1,
    signal?: AbortSignal,
  ): Promise<OllamaLocalInferenceTransportResultV1>;
  async request(
    first: Program7LocalInferenceRequestV1 | { readonly origin: string; readonly modelId: string },
    second?: AbortSignal | Program7LocalInferenceRequestV1,
    third?: AbortSignal,
  ): Promise<OllamaLocalInferenceTransportResultV1> {
    const request = 'schema' in first ? first : (second as Program7LocalInferenceRequestV1);
    const requestedEndpoint = 'schema' in first ? this.endpoint : first.origin;
    const requestedModel = 'schema' in first ? this.model : first.modelId;
    const signal = 'schema' in first ? (second as AbortSignal | undefined) : third;
    if (
      requestedEndpoint !== PROGRAM7_LOCAL_INFERENCE_ENDPOINT ||
      requestedModel !== PROGRAM7_LOCAL_INFERENCE_MODEL ||
      this.endpoint !== PROGRAM7_LOCAL_INFERENCE_ENDPOINT ||
      this.model !== PROGRAM7_LOCAL_INFERENCE_MODEL
    ) {
      throw new OllamaLocalInferenceTransportError(
        'UNAVAILABLE',
        'The fixed local inference route is unavailable.',
      );
    }
    const prompt = program7LocalInferencePromptFor(request);
    const startedAt = new Date(this.now()).toISOString();
    const requestJson = async (
      route: '/api/version' | '/api/tags',
    ): Promise<Record<string, unknown>> => {
      let metadataResponse: Response;
      try {
        metadataResponse = await this.fetchImpl(`${this.endpoint}${route}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal,
        });
      } catch (error) {
        if (signal?.aborted) throw error;
        throw new OllamaLocalInferenceTransportError(
          'UNAVAILABLE',
          'The local model metadata is unavailable.',
        );
      }
      if (!metadataResponse.ok)
        throw new OllamaLocalInferenceTransportError(
          'UNAVAILABLE',
          'The local model metadata is unavailable.',
        );
      let metadata: unknown;
      try {
        metadata = await metadataResponse.json();
      } catch {
        throw invalidMetadata('The local model metadata is invalid.');
      }
      if (!record(metadata)) throw invalidMetadata('The local model metadata is invalid.');
      return metadata;
    };
    const versionMetadata = await requestJson('/api/version');
    const version =
      typeof versionMetadata.version === 'string' ? versionMetadata.version.trim() : '';
    if (version.length === 0) throw invalidMetadata('The Ollama version is missing.');
    const tagsMetadata = await requestJson('/api/tags');
    const models = tagsMetadata.models;
    if (!Array.isArray(models)) throw invalidMetadata('The local model tag list is invalid.');
    const matches = models.filter(
      (model): model is Record<string, unknown> =>
        record(model) &&
        (model.name === PROGRAM7_LOCAL_INFERENCE_MODEL ||
          model.model === PROGRAM7_LOCAL_INFERENCE_MODEL),
    );
    if (matches.length !== 1)
      throw invalidMetadata('The required local model tag is missing or ambiguous.');
    const modelTag = matches[0]!;
    if (
      (modelTag.name !== undefined && modelTag.name !== PROGRAM7_LOCAL_INFERENCE_MODEL) ||
      (modelTag.model !== undefined && modelTag.model !== PROGRAM7_LOCAL_INFERENCE_MODEL)
    )
      throw invalidMetadata('The required local model tag identity is invalid.');
    const digest = boundedDigest(modelTag.digest);
    if (!digest) throw invalidMetadata('The required local model digest is missing or invalid.');
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: PROGRAM7_LOCAL_INFERENCE_MODEL,
          prompt,
          stream: false,
          format: 'json',
        }),
        signal,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new OllamaLocalInferenceTransportError(
        'UNAVAILABLE',
        'The local model is unavailable.',
      );
    }
    if (!response.ok) {
      throw new OllamaLocalInferenceTransportError(
        'UNAVAILABLE',
        'The local model is unavailable.',
      );
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new OllamaLocalInferenceTransportError(
        'INVALID_RESPONSE',
        'The local model returned invalid JSON.',
      );
    }
    if (!record(body)) {
      throw new OllamaLocalInferenceTransportError(
        'INVALID_RESPONSE',
        'The local model returned an invalid envelope.',
      );
    }
    const endedAt = new Date(this.now()).toISOString();
    const payload = responsePayload(body);
    const receipt: Program7LocalInferenceReceiptV1 = {
      endpoint: PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
      requestedModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
      actualModel: typeof body.model === 'string' ? body.model : null,
      modelDigest: digest,
      ollamaVersion: version,
      promptSha256: sha256(prompt),
      schemaSha256: sha256(
        `${PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA}|${PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA}`,
      ),
      startedAt,
      firstTokenAt: null,
      endedAt,
      promptTokens:
        typeof body.prompt_eval_count === 'number' && Number.isInteger(body.prompt_eval_count)
          ? body.prompt_eval_count
          : 0,
      outputTokens:
        typeof body.eval_count === 'number' && Number.isInteger(body.eval_count)
          ? body.eval_count
          : 0,
    };
    return { payload, receipt };
  }
}
