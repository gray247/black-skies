import { afterEach, describe, expect, it, vi } from 'vitest';

import { AI_CRITIQUE_MODEL } from '../../shared/ipc/aiCritique';
import {
  AiCritiqueGateway,
  AiCritiqueGatewayError,
  AI_CRITIQUE_RESPONSES_ENDPOINT,
  validateAiCritiqueContent,
} from '../aiCritiqueGateway';
import {
  buildAiCritiqueProviderBody,
  serializeAiCritiqueProviderBody,
  sha256,
} from '../aiCritiqueCoordinator';

const passage =
  'Rain worried the station roof while Mara counted the dark panes between each lamp. ' +
  'The timetable promised a train at midnight, but the clock had stopped at eleven forty-three. ' +
  'She kept her ticket folded in her glove and listened for wheels that never came, refusing to name the person who had asked her to wait. ' +
  'Across the tracks, a red signal blinked with the patience of an unanswered question.';

function critique(overrides: Record<string, unknown> = {}) {
  return {
    overview: 'The passage sustains anticipation while withholding the reason for the wait.',
    strengths: ['The weather and stopped clock establish pressure.'],
    priorities: [
      {
        evidence: 'the clock had stopped at eleven forty-three',
        observation: 'The stopped clock is concrete but its relation to the promised train is ambiguous.',
        impact: 'That ambiguity can sharpen suspense if it remains intentional.',
        revisionQuestion: 'Should the clock feel broken, symbolic, or merely unreliable?',
      },
    ],
    uncertainties: ['The passage does not establish why Mara is waiting.'],
    limitations: ['Only the selected passage was reviewed.'],
    ...overrides,
  };
}

function providerResponse(overrides: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({
    model: AI_CRITIQUE_MODEL,
    status: 'completed',
    output: [
      {
        type: 'message',
        content: [{ type: 'output_text', text: JSON.stringify(critique()) }],
      },
    ],
    usage: {
      input_tokens: 1000,
      input_tokens_details: { cached_tokens: 200 },
      output_tokens: 400,
    },
    ...overrides,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function request() {
  const providerBodyJson = serializeAiCritiqueProviderBody(buildAiCritiqueProviderBody(passage));
  return {
    requestId: 'request-1',
    credential: 'synthetic-session-credential-never-log',
    providerBodyJson,
    payloadHash: sha256(providerBodyJson),
    selectedText: passage,
    sourceFingerprint: sha256(passage),
    selectionFingerprint: sha256(passage),
    editorRevision: 7,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('fixed OpenAI critique gateway', () => {
  const evidenceSource =
    'Mara said, “Stay here.”  Eli answered, "I will." Then the room…fell quiet.';
  const contentWithEvidence = (evidence: string) => ({
    overview: 'Bounded critique.',
    strengths: [],
    priorities: [{
      evidence,
      observation: 'Observation.',
      impact: 'Impact.',
      revisionQuestion: 'Question?',
    }],
    uncertainties: [],
    limitations: [],
  });

  it.each([
    ['added ASCII quotation wrapper', '"Mara said"'],
    ['straight marks substituted for curly marks', 'Mara said, "Stay here."'],
    ['curly marks substituted for straight marks', 'Eli answered, “I will.”'],
    ['two non-contiguous source spans combined', 'Mara said,Eli answered'],
    ['connective word inserted between source spans', 'Mara said, and Eli answered'],
    ['ellipsis inserted where the source has none', 'Mara said…Stay here.'],
    ['punctuation normalized', 'Mara said: “Stay here.”'],
    ['whitespace normalized', 'here.” Eli answered'],
    ['case altered', 'mara said'],
  ])('rejects evidence that is not one exact source substring: %s', (_label, evidence) => {
    expect(() => validateAiCritiqueContent(contentWithEvidence(evidence), evidenceSource)).toThrowError(
      expect.objectContaining({ detail: expect.objectContaining({ code: 'PROVIDER_RESPONSE_INVALID' }) }),
    );
  });

  it.each([
    ['one exact contiguous substring', 'Mara said'],
    ['exact copied quotation marks', 'Mara said, “Stay here.”'],
    ['an exact source ellipsis', 'room…fell quiet'],
  ])('accepts governed exact-substring evidence: %s', (_label, evidence) => {
    expect(validateAiCritiqueContent(contentWithEvidence(evidence), evidenceSource).priorities[0].evidence)
      .toBe(evidence);
  });

  it('sends the exact approved bytes to the frozen Responses endpoint and accounts returned tokens', async () => {
    const fetchMock = vi.fn(async () => providerResponse());
    const gateway = new AiCritiqueGateway({ fetch: fetchMock, now: () => Date.parse('2026-07-14T12:00:00Z') });
    const input = request();
    const result = await gateway.execute(input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(AI_CRITIQUE_RESPONSES_ENDPOINT);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: input.providerBodyJson,
      headers: {
        Authorization: 'Bearer synthetic-session-credential-never-log',
        'Content-Type': 'application/json',
      },
    });
    expect(result).toMatchObject({
      requestId: 'request-1',
      model: AI_CRITIQUE_MODEL,
      completedAt: '2026-07-14T12:00:00.000Z',
      usage: {
        inputTokens: 1000,
        cachedInputTokens: 200,
        outputTokens: 400,
        calculatedUsd: 0.00805,
      },
    });
  });

  it('rejects a body whose approved payload hash no longer matches before fetch', async () => {
    const fetchMock = vi.fn();
    const gateway = new AiCritiqueGateway({ fetch: fetchMock });
    await expect(gateway.execute({ ...request(), payloadHash: '0'.repeat(64) })).rejects.toMatchObject({
      detail: { code: 'APPROVAL_MISMATCH' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('captures the exact decoded response bytes only for an internal evidence sink', async () => {
    const raw = JSON.stringify({
      model: AI_CRITIQUE_MODEL, status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(critique()) }] }],
      usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 200 }, output_tokens: 400 },
    });
    const sink = vi.fn(async () => undefined);
    const gateway = new AiCritiqueGateway({ fetch: async () => new Response(raw, { status: 200 }), evidenceSink: sink });
    const result = await gateway.execute({ ...request(), evidenceAttemptId: 'qualification-attempt-1' });
    expect(result).not.toHaveProperty('body');
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({
      attemptId: 'qualification-attempt-1', bodySha256: sha256(raw), byteLength: Buffer.byteLength(raw), status: 200,
    }));
    expect(Buffer.from(sink.mock.calls[0][0].body).toString('utf8')).toBe(raw);
  });

  it('captures malformed and HTTP-error bodies without leaking their content into errors', async () => {
    const sink = vi.fn(async () => undefined);
    const gateway = new AiCritiqueGateway({ fetch: async () => new Response('{"private":"never surface"}', { status: 500 }), evidenceSink: sink });
    await expect(gateway.execute({ ...request(), evidenceAttemptId: 'attempt-error' })).rejects.toMatchObject({ detail: { code: 'PROVIDER_UNAVAILABLE' } });
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ status: 500, bodySha256: sha256('{"private":"never surface"}') }));
  });

  it('fails closed when a supplied qualification evidence sink cannot persist', async () => {
    const gateway = new AiCritiqueGateway({ fetch: async () => providerResponse(), evidenceSink: async () => { throw new Error('disk unavailable'); } });
    await expect(gateway.execute({ ...request(), evidenceAttemptId: 'attempt-fail-closed' })).rejects.toMatchObject({ detail: { code: 'PROVIDER_UNAVAILABLE' } });
  });

  it('rejects non-verbatim evidence and malformed structured output', async () => {
    const invalid = providerResponse({
      output: [{
        type: 'message',
        content: [{ type: 'output_text', text: JSON.stringify(critique({
          priorities: [{
            evidence: 'a sentence not present in the manuscript',
            observation: 'Unsupported.',
            impact: 'Unsupported.',
            revisionQuestion: 'Unsupported?',
          }],
        })) }],
      }],
    });
    const gateway = new AiCritiqueGateway({ fetch: vi.fn(async () => invalid) });
    await expect(gateway.execute(request())).rejects.toMatchObject({
      detail: { code: 'PROVIDER_RESPONSE_INVALID' },
    });
  });

  it('classifies malformed provider JSON as an invalid response rather than availability failure', async () => {
    const gateway = new AiCritiqueGateway({
      fetch: vi.fn(async () => new Response('not-json', { status: 200 })),
    });
    await expect(gateway.execute(request())).rejects.toMatchObject({
      detail: { code: 'PROVIDER_RESPONSE_INVALID' },
    });
  });

  it('classifies refusals, authentication, rate limits, and provider outages without response text', async () => {
    const cases: Array<[Response, string]> = [
      [providerResponse({ output: [{ content: [{ type: 'refusal', refusal: 'no' }] }] }), 'PROVIDER_REFUSAL'],
      [new Response('secret-bearing provider body', { status: 401 }), 'PROVIDER_AUTH'],
      [new Response('quota or rate details', { status: 429 }), 'PROVIDER_RATE_LIMIT'],
      [new Response(JSON.stringify({ error: { code: 'insufficient_quota' } }), { status: 429 }), 'PROVIDER_QUOTA'],
      [new Response('provider stack', { status: 503 }), 'PROVIDER_UNAVAILABLE'],
    ];
    for (const [response, code] of cases) {
      const gateway = new AiCritiqueGateway({ fetch: vi.fn(async () => response) });
      await expect(gateway.execute(request())).rejects.toMatchObject({ detail: { code } });
    }
  });

  it('keeps bounded provider validation classification in main-process-only error metadata', async () => {
    const privateMessage = "Invalid value: 'in-memory'. Supported values are: 'in_memory' and '24h'.";
    const gateway = new AiCritiqueGateway({
      fetch: vi.fn(async () => new Response(JSON.stringify({
        error: {
          message: privateMessage,
          type: 'invalid_request_error',
          code: 'invalid_value',
          nested: { request: passage },
        },
      }), { status: 400 })),
    });
    try {
      await gateway.execute(request());
      throw new Error('Expected gateway rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(AiCritiqueGatewayError);
      const gatewayError = error as AiCritiqueGatewayError;
      expect(gatewayError.detail).toEqual({
        code: 'PROVIDER_ERROR',
        message: 'The provider rejected the critique request.',
        retryable: false,
      });
      expect(gatewayError.providerFailure).toEqual({
        httpStatus: 400,
        providerType: 'invalid_request_error',
        providerCode: 'invalid_value',
        sanitizedMessage: 'The provider rejected a request parameter.',
      });
      expect(gatewayError.message).not.toContain('in-memory');
      expect(gatewayError.message).not.toContain('Rain worried');
    }
  });

  it('does not preserve malformed, oversized, or unsafe provider error text', async () => {
    const unsafeMessage = `${'x'.repeat(10_000)} Bearer synthetic-session-credential-never-log ${passage}`;
    const gateway = new AiCritiqueGateway({
      fetch: vi.fn(async () => new Response(JSON.stringify({
        error: {
          message: unsafeMessage,
          type: 'invalid_request_error',
          code: 'invalid_value',
        },
      }), { status: 400 })),
    });
    try {
      await gateway.execute(request());
      throw new Error('Expected gateway rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(AiCritiqueGatewayError);
      const failure = (error as AiCritiqueGatewayError).providerFailure;
      expect(failure?.sanitizedMessage).toBe('The provider rejected a request parameter.');
      expect(failure?.sanitizedMessage.length).toBeLessThanOrEqual(240);
      expect(JSON.stringify(failure)).not.toContain('synthetic-session-credential');
      expect(JSON.stringify(failure)).not.toContain('Rain worried');
    }
  });

  it('fails safely without provider classification for malformed validation envelopes', async () => {
    const gateway = new AiCritiqueGateway({
      fetch: vi.fn(async () => new Response('{"error":{"message":"private only"}}', { status: 400 })),
    });
    await expect(gateway.execute(request())).rejects.toMatchObject({
      detail: { code: 'PROVIDER_ERROR', retryable: false },
      providerFailure: undefined,
    });
  });

  it('locally cancels and rejects a late provider result', async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => { resolveFetch = resolve; });
    const gateway = new AiCritiqueGateway({ fetch: vi.fn(() => fetchPromise) });
    const pending = gateway.execute(request());
    gateway.cancel('request-1');
    resolveFetch(providerResponse());
    await expect(pending).rejects.toMatchObject({ detail: { code: 'CANCELLED' } });
  });

  it('enforces the local timeout without claiming provider-side cancellation', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }));
    const gateway = new AiCritiqueGateway({ fetch: fetchMock });
    const pending = gateway.execute(request());
    const rejection = expect(pending).rejects.toMatchObject({
      detail: { code: 'PROVIDER_TIMEOUT' },
    });
    await vi.advanceTimersByTimeAsync(90_000);
    await rejection;
  });

  it('never includes provider bodies or credentials in classified error messages', async () => {
    const gateway = new AiCritiqueGateway({
      fetch: vi.fn(async () => {
        throw new Error(`network synthetic-session-credential-never-log ${passage}`);
      }),
    });
    try {
      await gateway.execute(request());
      throw new Error('Expected gateway rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(AiCritiqueGatewayError);
      expect(String((error as Error).message)).not.toContain('synthetic-session-credential');
      expect(String((error as Error).message)).not.toContain('Rain worried');
    }
  });
});
