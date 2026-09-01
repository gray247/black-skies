import { describe, expect, it, vi } from 'vitest';

import { defaultStoryIntelligencePolicy } from '../storyIntelligencePolicy';
import {
  LOCAL_INFERENCE_SCHEMA_VERSION,
  runLocalInferenceV1,
  type LocalInferenceRequestV1,
} from '../localInference';

const ref = {
  projectId: 'project-1',
  sourceKind: 'story-unit' as const,
  sourceId: 'scene-1',
  sourceRevision: 1,
  sourceFingerprint: 'fingerprint-1',
  unitId: 'unit-1',
  orderIndex: 0,
  orderBasis: 'story-world' as const,
};

function request(): LocalInferenceRequestV1 {
  return {
    schemaVersion: LOCAL_INFERENCE_SCHEMA_VERSION,
    operationId: 'operation-1',
    projectId: 'project-1',
    operation: 'structured-story-observation',
    sources: [{ ref, sourceClass: 'local-only' }],
    requestedAt: '2026-09-01T12:00:00.000Z',
    manuallyRequested: true,
  };
}

function enabledPolicy() {
  return { ...defaultStoryIntelligencePolicy(), optionalInferenceEnabled: true };
}

describe('Local inference gateway V1', () => {
  it('refuses disabled policy and non-loopback endpoints before transport', async () => {
    const transport = { request: vi.fn() };
    const disabled = await runLocalInferenceV1(request(), {
      policy: defaultStoryIntelligencePolicy(),
      endpoint: { origin: 'http://127.0.0.1:11434', modelId: 'local-test' },
      transport,
    });
    const remote = await runLocalInferenceV1(request(), {
      policy: enabledPolicy(),
      endpoint: { origin: 'https://example.test', modelId: 'local-test' },
      transport,
    });
    expect(disabled).toMatchObject({ ok: false, code: 'POLICY_DISABLED' });
    expect(remote).toMatchObject({ ok: false, code: 'NON_LOCAL_ENDPOINT' });
    expect(transport.request).not.toHaveBeenCalled();
  });

  it('returns a temporary inferred candidate from a manually requested local response', async () => {
    const result = await runLocalInferenceV1(request(), {
      policy: enabledPolicy(),
      endpoint: { origin: 'http://localhost:11434', modelId: 'local-test' },
      transport: { request: vi.fn().mockResolvedValue({ summary: 'A bounded observation' }) },
      now: new Date('2026-09-01T12:00:00.000Z'),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.candidate).toMatchObject({
        evidenceClass: 'inferred',
        lifecycle: 'candidate',
        projectId: 'project-1',
        provenance: { origin: 'local-inference', protectionClass: 'local-only' },
      });
      expect(result.candidate.expiresAt).toBe('2026-09-01T12:15:00.000Z');
    }
  });

  it('blocks protected sources and does not retain transport failures or timeouts', async () => {
    const protectedResult = await runLocalInferenceV1({
      ...request(),
      sources: [{ ref, sourceClass: 'protected' }],
    }, {
      policy: enabledPolicy(),
      endpoint: { origin: 'http://127.0.0.1:11434', modelId: 'local-test' },
      transport: { request: vi.fn() },
    });
    const failedResult = await runLocalInferenceV1(request(), {
      policy: enabledPolicy(),
      endpoint: { origin: 'http://127.0.0.1:11434', modelId: 'local-test' },
      transport: { request: vi.fn().mockRejectedValue(new Error('offline')) },
    });
    expect(protectedResult).toMatchObject({ ok: false, code: 'SOURCE_DENIED' });
    expect(failedResult).toMatchObject({ ok: false, code: 'TRANSPORT_FAILED' });
  });
});
