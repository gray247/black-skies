import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

import {
  PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
  PROGRAM7_LOCAL_INFERENCE_MODEL,
  PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
  type Program7LocalInferenceRequestV1,
} from '../../shared/localInference';
import { OllamaLocalInferenceTransport } from '../ollamaLocalInferenceTransport';

const request: Program7LocalInferenceRequestV1 = {
  schema: PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
  operation: 'rewrite_candidate',
  model: PROGRAM7_LOCAL_INFERENCE_MODEL,
  requestId: 'request-1',
  projectId: 'project-1',
  source: {
    unitId: 'unit-1',
    bodySha256: createHash('sha256').update('A bounded source passage.').digest('hex'),
    text: 'A bounded source passage.',
  },
  purpose: 'Offer one bounded alternative.',
  limits: { inputChars: 12_000, outputChars: 6_000 },
  protection: { excluded: false, class: 'ordinary' },
};

describe('Ollama local inference transport', () => {
  it('posts only to the fixed loopback generate route and passes cancellation', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/api/version')) return new Response(JSON.stringify({ version: '0.13.0' }));
      if (url.endsWith('/api/tags'))
        return new Response(
          JSON.stringify({
            models: [{ name: PROGRAM7_LOCAL_INFERENCE_MODEL, digest: `sha256:${'b'.repeat(64)}` }],
          }),
        );
      return new Response(
        JSON.stringify({
          model: PROGRAM7_LOCAL_INFERENCE_MODEL,
          response: JSON.stringify({
            status: 'candidate',
            text: 'Alternative.',
            reason: 'Bounded.',
          }),
          prompt_eval_count: 3,
          eval_count: 4,
        }),
        { status: 200 },
      );
    });
    const transport = new OllamaLocalInferenceTransport({
      fetch: fetchMock,
      now: () => Date.parse('2026-09-01T12:00:00.000Z'),
    });
    const controller = new AbortController();
    const result = await transport.request(request, controller.signal);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${PROGRAM7_LOCAL_INFERENCE_ENDPOINT}/api/version`,
      `${PROGRAM7_LOCAL_INFERENCE_ENDPOINT}/api/tags`,
      `${PROGRAM7_LOCAL_INFERENCE_ENDPOINT}/api/generate`,
    ]);
    expect(fetchMock.mock.calls[2]![1]).toMatchObject({
      method: 'POST',
      signal: controller.signal,
      body: expect.stringContaining('qwen3:4b'),
    });
    expect(fetchMock.mock.calls[2]![1]?.body).toEqual(expect.stringContaining('request-1'));
    expect(result.payload).toEqual({
      status: 'candidate',
      text: 'Alternative.',
      reason: 'Bounded.',
    });
    expect(result.payload).not.toHaveProperty('receipt');
    expect(result.receipt).toMatchObject({
      endpoint: PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
      requestedModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
      actualModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
      modelDigest: 'b'.repeat(64),
      ollamaVersion: '0.13.0',
    });
  });

  it('does not turn malformed model JSON into a successful payload', async () => {
    const transport = new OllamaLocalInferenceTransport({
      fetch: vi.fn(async (url: string) => {
        if (url.endsWith('/api/version'))
          return new Response(JSON.stringify({ version: '0.13.0' }));
        if (url.endsWith('/api/tags'))
          return new Response(
            JSON.stringify({
              models: [{ name: PROGRAM7_LOCAL_INFERENCE_MODEL, digest: 'b'.repeat(64) }],
            }),
          );
        return new Response(
          JSON.stringify({ model: PROGRAM7_LOCAL_INFERENCE_MODEL, response: 'not-json' }),
          { status: 200 },
        );
      }),
    });
    await expect(transport.request(request)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('fails closed when version or the exact model digest is missing or ambiguous', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/api/version')) return new Response(JSON.stringify({}));
      return new Response(JSON.stringify({ models: [] }));
    });
    await expect(
      new OllamaLocalInferenceTransport({ fetch: fetchMock }).request(request),
    ).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const ambiguousFetch = vi.fn(async (url: string) => {
      if (url.endsWith('/api/version')) return new Response(JSON.stringify({ version: '0.13.0' }));
      return new Response(
        JSON.stringify({
          models: [
            { name: PROGRAM7_LOCAL_INFERENCE_MODEL, digest: 'b'.repeat(64) },
            { model: PROGRAM7_LOCAL_INFERENCE_MODEL, digest: 'c'.repeat(64) },
          ],
        }),
      );
    });
    await expect(
      new OllamaLocalInferenceTransport({ fetch: ambiguousFetch }).request(request),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    expect(ambiguousFetch).toHaveBeenCalledTimes(2);
  });

  it('passes an already-aborted signal to fetch without retrying', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal?.aborted).toBe(true);
      throw new DOMException('Aborted', 'AbortError');
    });
    const transport = new OllamaLocalInferenceTransport({ fetch: fetchMock });
    await expect(transport.request(request, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propagates cancellation while loading model metadata without falling back', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal);
      if (url.endsWith('/api/version')) return new Response(JSON.stringify({ version: '0.13.0' }));
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    });
    await expect(
      new OllamaLocalInferenceTransport({ fetch: fetchMock }).request(request, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a non-loopback endpoint or model substitution before fetch', async () => {
    const fetchMock = vi.fn();
    await expect(
      new OllamaLocalInferenceTransport({
        fetch: fetchMock,
        endpoint: 'https://example.test',
      }).request(request),
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    await expect(
      new OllamaLocalInferenceTransport({ fetch: fetchMock, model: 'qwen3:8b' }).request(request),
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
