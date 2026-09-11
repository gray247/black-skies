import { describe, expect, it, vi } from 'vitest';
import {
  PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
  PROGRAM7_LOCAL_INFERENCE_MODEL,
  PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
  type Program7LocalInferenceRequestV1,
} from '../../shared/localInference';
import {
  Program7LocalInferenceService,
  program7LocalInferenceSchemaHash,
  validateProgram7LocalInferenceResponse,
  validateProgram7LocalInferenceRequest,
} from '../program7LocalInferenceService';
import { OllamaLocalInferenceTransport, program7LocalInferencePromptHash } from '../ollamaLocalInferenceTransport';

const request: Program7LocalInferenceRequestV1 = {
  schema: PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
  operation: 'rewrite_candidate',
  model: PROGRAM7_LOCAL_INFERENCE_MODEL,
  requestId: 'request-1',
  projectId: 'project-1',
  source: {
    unitId: 'unit-1',
    bodySha256: 'a'.repeat(64),
    text: 'Source passage.',
  },
  purpose: 'Offer an alternative.',
  limits: { inputChars: 12_000, outputChars: 6_000 },
  protection: { excluded: false, class: 'ordinary' },
};

function receipt(forRequest: Program7LocalInferenceRequestV1 = request) {
  return {
    endpoint: PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
    requestedModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
    actualModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
    modelDigest: 'd'.repeat(64),
    ollamaVersion: '0.13.0',
    promptSha256: program7LocalInferencePromptHash(forRequest),
    schemaSha256: program7LocalInferenceSchemaHash(),
    startedAt: '2026-09-01T12:00:00.000Z',
    firstTokenAt: null,
    endedAt: '2026-09-01T12:00:01.000Z',
    promptTokens: 1,
    outputTokens: 2,
  };
}

function validModelOutput(overrides: Record<string, unknown> = {}) {
  return {
    status: 'candidate',
    text: 'An alternative.',
    reason: 'Bounded.',
    ...overrides,
  };
}

function validTransportResult(overrides: Record<string, unknown> = {}, forRequest = request) {
  return { payload: validModelOutput(overrides), receipt: receipt(forRequest) };
}

describe('Program 7 local inference service', () => {
  it('requires explicit author invocation and rejects protected input before transport', async () => {
    const transport = { request: vi.fn() };
    const service = new Program7LocalInferenceService({ transport });
    const notManual = await service.run(request);
    const protectedResult = await service.run({
      ...request,
      protection: { excluded: false, class: 'metadata-only' },
    });
    const excludedResult = await service.run({
      ...request,
      protection: { excluded: true, class: 'ordinary' },
    });
    expect(notManual).toMatchObject({ status: 'failed' });
    expect(protectedResult).toMatchObject({ status: 'failed' });
    expect(excludedResult).toMatchObject({ status: 'failed' });
    expect(JSON.stringify(protectedResult)).not.toContain('Source passage.');
    expect(JSON.stringify(excludedResult)).not.toContain('Source passage.');
    expect(transport.request).not.toHaveBeenCalled();
  });

  it('validates the closed response and returns a visible receipt', async () => {
    const transport = { request: vi.fn().mockResolvedValue(validTransportResult()) };
    const service = new Program7LocalInferenceService({ transport });
    const result = await service.run(request, { authorInvoked: true });
    expect(result).toMatchObject({
      status: 'candidate',
      requestId: 'request-1',
      model: PROGRAM7_LOCAL_INFERENCE_MODEL,
    });
    expect(result.receipt).toMatchObject({
      endpoint: PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
      ollamaVersion: '0.13.0',
    });
  });

  it('supports the protocol-shaped request when invocation evidence is supplied out of band', async () => {
    const transport = { request: vi.fn().mockResolvedValue(validTransportResult()) };
    const service = new Program7LocalInferenceService({ transport });
    const result = await service.run(request, { authorInvoked: true });
    expect(result.status).toBe('candidate');
    expect(transport.request).toHaveBeenCalledTimes(1);
  });

  it('fails closed on unknown response keys and never retries', async () => {
    const transport = {
      request: vi.fn().mockResolvedValue({
        payload: { ...validModelOutput(), private: 'leak' },
        receipt: receipt(),
      }),
    };
    const service = new Program7LocalInferenceService({ transport });
    const result = await service.run(request, { authorInvoked: true });
    expect(result).toMatchObject({ status: 'failed' });
    expect(transport.request).toHaveBeenCalledTimes(1);
  });

  it('rejects unknown request keys before packaging', async () => {
    const transport = { request: vi.fn() };
    const service = new Program7LocalInferenceService({ transport });
    await expect(
      service.run({ ...request, unapproved: 'value' } as never, { authorInvoked: true }),
    ).rejects.toMatchObject({ name: 'Program7LocalInferenceServiceError' });
    expect(transport.request).not.toHaveBeenCalled();
  });

  it('fails closed when a candidate receipt does not prove model identity', async () => {
    const transport = {
      request: vi.fn().mockResolvedValue({
        payload: validModelOutput(),
        receipt: { ...receipt(), actualModel: 'qwen3:8b' },
      }),
    };
    const service = new Program7LocalInferenceService({ transport });
    const result = await service.run(request, { authorInvoked: true });
    expect(result).toMatchObject({ status: 'failed' });
    expect(transport.request).toHaveBeenCalledTimes(1);
  });

  it('fails closed when receipt hashes do not match the request contract', async () => {
    const transport = {
      request: vi.fn().mockResolvedValue({
        payload: validModelOutput(),
        receipt: { ...receipt(), promptSha256: 'a'.repeat(64) },
      }),
    };
    const service = new Program7LocalInferenceService({ transport });
    await expect(service.run(request, { authorInvoked: true })).resolves.toMatchObject({ status: 'failed' });
  });

  it('accepts a selected passage whose hash is the full-unit fingerprint', async () => {
    expect(validateProgram7LocalInferenceRequest(request)).toBeNull();
    const transport = { request: vi.fn().mockResolvedValue(validTransportResult()) };
    const service = new Program7LocalInferenceService({ transport });
    await expect(service.run(request, { authorInvoked: true })).resolves.toMatchObject({
      status: 'candidate',
    });
  });

  it('rejects a fabricated final response envelope from the model', async () => {
    const transport = {
      request: vi.fn().mockResolvedValue({
        payload: {
          ...validModelOutput(),
          schema: 'program7.local-inference.response.v1',
          requestId: request.requestId,
          model: PROGRAM7_LOCAL_INFERENCE_MODEL,
          usage: { inputChars: request.source.text.length, outputChars: 0 },
          receipt: receipt(),
        },
        receipt: receipt(),
      }),
    };
    const service = new Program7LocalInferenceService({ transport });
    await expect(service.run(request, { authorInvoked: true })).resolves.toMatchObject({
      status: 'failed',
    });
  });

  it('requires usage input characters to equal the selected source length', () => {
    expect(
      validateProgram7LocalInferenceResponse(
        {
          schema: 'program7.local-inference.response.v1',
          requestId: request.requestId,
          model: PROGRAM7_LOCAL_INFERENCE_MODEL,
          status: 'candidate',
          text: 'An alternative.',
          reason: 'Bounded.',
          usage: { inputChars: 1, outputChars: 'An alternative.'.length },
          receipt: receipt(),
        },
        request,
      ),
    ).toBeNull();
  });

  it('composes the trusted final response from the real transport result', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/version')) return new Response(JSON.stringify({ version: '0.13.0' }));
      if (url.endsWith('/api/tags'))
        return new Response(
          JSON.stringify({
            models: [{ name: PROGRAM7_LOCAL_INFERENCE_MODEL, digest: `sha256:${'e'.repeat(64)}` }],
          }),
        );
      expect(init?.body).toEqual(expect.stringContaining(request.requestId));
      return new Response(
        JSON.stringify({
          model: PROGRAM7_LOCAL_INFERENCE_MODEL,
          response: JSON.stringify(validModelOutput()),
          prompt_eval_count: 5,
          eval_count: 3,
        }),
        { status: 200 },
      );
    });
    const service = new Program7LocalInferenceService({
      transport: new OllamaLocalInferenceTransport({
        fetch: fetchMock,
        now: () => Date.parse('2026-09-01T12:00:00.000Z'),
      }),
    });
    const result = await service.run(request, { authorInvoked: true });
    expect(result).toMatchObject({
      schema: 'program7.local-inference.response.v1',
      requestId: request.requestId,
      model: PROGRAM7_LOCAL_INFERENCE_MODEL,
      status: 'candidate',
      usage: { inputChars: request.source.text.length, outputChars: 'An alternative.'.length },
      receipt: {
        actualModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
        modelDigest: 'e'.repeat(64),
        ollamaVersion: '0.13.0',
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rejects a candidate status for revision recheck', async () => {
    const transport = { request: vi.fn().mockResolvedValue(validTransportResult()) };
    const service = new Program7LocalInferenceService({ transport });
    const result = await service.run(
      {
        ...request,
        operation: 'revision_recheck',
        limits: { inputChars: 8_000, outputChars: 2_000 },
      },
      { authorInvoked: true },
    );
    expect(result.status).toBe('failed');
    const resolvedTransport = {
      request: vi
        .fn()
        .mockResolvedValue(validTransportResult({ status: 'appears_resolved', text: '' }, { ...request, operation: 'revision_recheck', limits: { inputChars: 8_000, outputChars: 2_000 } })),
    };
    const resolved = await new Program7LocalInferenceService({
      transport: resolvedTransport,
    }).run(
      {
        ...request,
        operation: 'revision_recheck',
        limits: { inputChars: 8_000, outputChars: 2_000 },
      },
      { authorInvoked: true },
    );
    expect(resolved.status).toBe('appears_resolved');
  });

  it('allows an emotion analysis to return no findings without fabricating a candidate', async () => {
    const emotionRequest = {
      ...request,
      operation: 'emotion_analysis' as const,
      limits: { inputChars: 12_000, outputChars: 2_000 },
    };
    const transport = {
      request: vi.fn().mockResolvedValue(validTransportResult({ status: 'no_findings', text: '' }, emotionRequest)),
    };
    const result = await new Program7LocalInferenceService({ transport }).run(emotionRequest, { authorInvoked: true });
    expect(result).toMatchObject({ status: 'no_findings', text: '' });
  });

  it('returns cancelled before invoking an abort-ignoring transport for a pre-aborted signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const transport = {
      request: vi.fn(() => new Promise(() => undefined)),
    };
    const service = new Program7LocalInferenceService({ transport, timeoutMs: 10_000 });
    await expect(
      service.run(request, { authorInvoked: true, signal: controller.signal }),
    ).resolves.toMatchObject({
      status: 'cancelled',
    });
    expect(transport.request).not.toHaveBeenCalled();
  });

  it('preserves the first abort cause when timeout and author cancellation race', async () => {
    vi.useFakeTimers();
    try {
      const transport = { request: vi.fn(() => new Promise(() => undefined)) };
      const service = new Program7LocalInferenceService({ transport, timeoutMs: 100 });
      const timedOut = service.run(
        { ...request, requestId: 'timeout-first' },
        { authorInvoked: true },
      );
      await vi.advanceTimersByTimeAsync(100);
      service.cancel('timeout-first');
      await expect(timedOut).resolves.toMatchObject({ status: 'unavailable' });

      const cancelled = service.run(
        { ...request, requestId: 'cancel-first' },
        { authorInvoked: true },
      );
      service.cancel('cancel-first');
      await vi.advanceTimersByTimeAsync(100);
      await expect(cancelled).resolves.toMatchObject({ status: 'cancelled' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('aborts the underlying request on cancellation', async () => {
    const transport = {
      request: vi.fn(
        (_request: Program7LocalInferenceRequestV1, signal?: AbortSignal) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener(
              'abort',
              () => reject(new DOMException('Aborted', 'AbortError')),
              { once: true },
            );
          }),
      ),
    };
    const service = new Program7LocalInferenceService({ transport, timeoutMs: 10_000 });
    const pending = service.run(request, { authorInvoked: true });
    service.cancel(request.requestId);
    await expect(pending).resolves.toMatchObject({ status: 'cancelled' });
    expect(transport.request).toHaveBeenCalledTimes(1);
  });
});
