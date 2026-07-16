import { describe, expect, it } from 'vitest';

import {
  AI_CRITIQUE_AUTHORIZATION_CEILING_USD,
  AI_CRITIQUE_MODEL,
  type AiCritiqueApprovalRequest,
  type AiCritiquePrepareRequest,
} from '../../shared/ipc/aiCritique';
import {
  AI_CRITIQUE_REQUEST_TTL_MS,
  AiCritiqueCoordinator,
  AiCritiqueCoordinatorError,
  buildAiCritiqueProviderBody,
  serializeAiCritiqueProviderBody,
  sha256,
  type AiCritiqueMainAuthority,
} from '../aiCritiqueCoordinator';

const selectedText = 'A quiet sentence crossed the room. '.repeat(12).trim();

function authority(overrides: Partial<AiCritiqueMainAuthority> = {}): AiCritiqueMainAuthority {
  return {
    senderRole: 'writing',
    processSessionId: 'session-1',
    projectId: 'project-a',
    projectPath: 'C:/projects/a',
    unitId: 'unit-1',
    generation: 4,
    projectRevision: 9,
    ...overrides,
  };
}

function prepareRequest(overrides: Partial<AiCritiquePrepareRequest['selection']> = {}): AiCritiquePrepareRequest {
  return {
    operationId: 'prepare-1',
    selection: {
      projectId: 'project-a',
      unitId: 'unit-1',
      generation: 4,
      projectRevision: 9,
      selectionStart: 10,
      selectionEnd: 10 + selectedText.length,
      selectedText,
      editorRevision: 3,
      sourceFingerprint: sha256(`source:${selectedText}`),
      selectionFingerprint: sha256(selectedText),
      ...overrides,
    },
  };
}

function approvalFor(preview: ReturnType<AiCritiqueCoordinator['prepare']>): AiCritiqueApprovalRequest {
  return {
    operationId: 'prepare-1',
    requestId: preview.requestId,
    payloadHash: preview.payloadHash,
    editorRevision: 3,
    sourceFingerprint: sha256(`source:${selectedText}`),
    selectionFingerprint: sha256(selectedText),
    transmissionConfirmed: true,
    authorizationCeilingUsd: AI_CRITIQUE_AUTHORIZATION_CEILING_USD,
  };
}

describe('AiCritiqueCoordinator', () => {
  it('builds deterministic exact provider bytes with the pinned route and no hidden context', () => {
    const body = buildAiCritiqueProviderBody(selectedText);
    expect(body).toMatchObject({
      model: AI_CRITIQUE_MODEL,
      store: false,
      stream: false,
      background: false,
      prompt_cache_retention: 'in-memory',
      truncation: 'disabled',
      tools: [],
      tool_choice: 'none',
    });
    expect(body.input[0].content[0].text).toBe(selectedText);
    const serialized = serializeAiCritiqueProviderBody(body);
    expect(serializeAiCritiqueProviderBody(buildAiCritiqueProviderBody(selectedText))).toBe(serialized);
    expect(serialized).not.toContain('project-a');
    expect(serialized).not.toContain('C:/projects/a');
  });

  it('prepares one immutable preview bound to current main authority', () => {
    const coordinator = new AiCritiqueCoordinator({
      now: () => 1_000,
      createRequestId: () => 'request-1',
      resolveAuthority: () => authority(),
    });
    const preview = coordinator.prepare(prepareRequest());
    expect(preview).toMatchObject({
      requestId: 'request-1',
      payloadHash: sha256(serializeAiCritiqueProviderBody(buildAiCritiqueProviderBody(selectedText))),
      providerBodyJson: serializeAiCritiqueProviderBody(buildAiCritiqueProviderBody(selectedText)),
      provider: 'openai',
      model: AI_CRITIQUE_MODEL,
      selectedText,
    });
    expect(preview.expiresAt).toBe(new Date(1_000 + AI_CRITIQUE_REQUEST_TTL_MS).toISOString());
    expect(preview.cost.maximumCalculatedUsd).toBeLessThanOrEqual(
      AI_CRITIQUE_AUTHORIZATION_CEILING_USD,
    );
  });

  it.each([
    ['command sender', authority({ senderRole: 'command' }), 'NOT_WRITING_STUDIO'],
    ['unregistered sender', authority({ senderRole: null }), 'NOT_WRITING_STUDIO'],
    ['missing project', authority({ projectId: null, projectPath: null, unitId: null }), 'NO_ACTIVE_PROJECT'],
    ['wrong project', authority(), 'STALE_SESSION', { projectId: 'project-b' }],
    ['wrong unit', authority(), 'STALE_SESSION', { unitId: 'unit-2' }],
    ['wrong generation', authority(), 'STALE_SESSION', { generation: 5 }],
    ['wrong revision', authority(), 'STALE_SESSION', { projectRevision: 10 }],
  ])('rejects %s', (_label, current, expectedCode, selectionOverrides = {}) => {
    const coordinator = new AiCritiqueCoordinator({
      resolveAuthority: () => current as AiCritiqueMainAuthority,
    });
    expect(() => coordinator.prepare(prepareRequest(selectionOverrides))).toThrowError(
      expect.objectContaining({ detail: expect.objectContaining({ code: expectedCode }) }),
    );
  });

  it('rejects malformed or out-of-bounds renderer selection evidence', () => {
    const coordinator = new AiCritiqueCoordinator({ resolveAuthority: () => authority() });
    expect(() =>
      coordinator.prepare(prepareRequest({ selectionFingerprint: '0'.repeat(64) })),
    ).toThrowError(AiCritiqueCoordinatorError);
    expect(() =>
      coordinator.prepare(
        prepareRequest({
          selectedText: 'too short',
          selectionEnd: 19,
          selectionFingerprint: sha256('too short'),
        }),
      ),
    ).toThrowError(expect.objectContaining({ detail: expect.objectContaining({ code: 'INVALID_SELECTION' }) }));
  });

  it('expires prepared requests and rejects approval after five minutes', () => {
    let now = 0;
    const coordinator = new AiCritiqueCoordinator({
      now: () => now,
      createRequestId: () => 'expiring',
      resolveAuthority: () => authority(),
    });
    const preview = coordinator.prepare(prepareRequest());
    now = AI_CRITIQUE_REQUEST_TTL_MS;
    expect(() => coordinator.approve(approvalFor(preview))).toThrowError(
      expect.objectContaining({ detail: expect.objectContaining({ code: 'REQUEST_EXPIRED' }) }),
    );
    expect(coordinator.readState(preview.requestId).status).toBe('expired');
  });

  it('binds approval to exact payload and renderer evidence and prevents replay', () => {
    const coordinator = new AiCritiqueCoordinator({
      createRequestId: () => 'approved',
      resolveAuthority: () => authority(),
    });
    const preview = coordinator.prepare(prepareRequest());
    expect(coordinator.approve(approvalFor(preview)).status).toBe('approved');
    expect(() => coordinator.approve(approvalFor(preview))).toThrowError(
      expect.objectContaining({ detail: expect.objectContaining({ code: 'REQUEST_TERMINAL' }) }),
    );
    expect(coordinator.beginExecution(preview.requestId).state.status).toBe('executing');
    expect(() => coordinator.beginExecution(preview.requestId)).toThrowError(
      expect.objectContaining({ detail: expect.objectContaining({ code: 'REQUEST_TERMINAL' }) }),
    );
  });

  it('invalidates when main authority changes before approval or execution', () => {
    let current = authority();
    const coordinator = new AiCritiqueCoordinator({
      createRequestId: () => 'stale',
      resolveAuthority: () => current,
    });
    const preview = coordinator.prepare(prepareRequest());
    current = authority({ unitId: 'unit-2', projectRevision: 10 });
    expect(() => coordinator.approve(approvalFor(preview))).toThrowError(
      expect.objectContaining({ detail: expect.objectContaining({ code: 'STALE_SESSION' }) }),
    );
    expect(coordinator.readState(preview.requestId).status).toBe('invalidated');
  });

  it('rejects completed output whose provenance does not match the immutable artifact', () => {
    const coordinator = new AiCritiqueCoordinator({
      createRequestId: () => 'provenance',
      resolveAuthority: () => authority(),
    });
    const preview = coordinator.prepare(prepareRequest());
    coordinator.approve(approvalFor(preview));
    coordinator.beginExecution(preview.requestId);
    const state = coordinator.complete(preview.requestId, {
      requestId: preview.requestId,
      provider: 'openai',
      model: AI_CRITIQUE_MODEL,
      taskContractVersion: 'black_skies_critique_v1',
      sourceFingerprint: '0'.repeat(64),
      selectionFingerprint: sha256(selectedText),
      editorRevision: 3,
      completedAt: '2026-07-14T12:00:00.000Z',
      content: {
        overview: 'Advisory result.',
        strengths: [],
        priorities: [],
        uncertainties: [],
        limitations: [],
      },
      usage: {
        inputTokens: 100,
        cachedInputTokens: 0,
        outputTokens: 25,
        calculatedUsd: 0.001,
        invoiceDisclaimer: 'Calculated usage cost - not provider invoice.',
      },
    });
    expect(state).toMatchObject({
      status: 'failed',
      error: { code: 'PROVIDER_RESPONSE_INVALID' },
    });
    expect(() => coordinator.complete(preview.requestId, state.result!)).toThrowError(
      expect.objectContaining({ detail: expect.objectContaining({ code: 'REQUEST_TERMINAL' }) }),
    );
  });

  it('makes cancelled and invalidated artifacts terminal', () => {
    let id = 0;
    const coordinator = new AiCritiqueCoordinator({
      createRequestId: () => `request-${++id}`,
      resolveAuthority: () => authority(),
    });
    const cancelled = coordinator.prepare(prepareRequest());
    expect(coordinator.cancel(cancelled.requestId).status).toBe('cancelled');
    expect(() => coordinator.approve(approvalFor(cancelled))).toThrowError(AiCritiqueCoordinatorError);

    const invalidated = coordinator.prepare({ ...prepareRequest(), operationId: 'prepare-2' });
    expect(coordinator.invalidate(invalidated.requestId).status).toBe('invalidated');
    expect(() => coordinator.beginExecution(invalidated.requestId)).toThrowError(AiCritiqueCoordinatorError);
  });
});
