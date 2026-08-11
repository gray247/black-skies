import { createHash } from 'node:crypto';

import {
  AI_CRITIQUE_MODEL,
  AI_CRITIQUE_PROVIDER,
  AI_CRITIQUE_TASK_CONTRACT_VERSION,
  type AiCritiquePrepareRequest,
  type AiCritiquePreview,
  type AiCritiqueState,
} from '../../shared/ipc/aiCritique';
import {
  CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
  CRITIQUE_REVIEW_CHANNELS,
} from '../../shared/ipc/contextualProductShell';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: any, request?: unknown) => Promise<unknown> | unknown>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: any, request?: unknown) => Promise<unknown> | unknown) => {
      handlers.set(channel, handler);
    }),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});

vi.mock('electron', () => ({ ipcMain: electronMocks }));

import {
  formatCritiqueReviewResult,
  publishCritiqueReviewOwnerState,
  reconcileCritiqueReviewAuthority,
  registerCritiqueReviewIpc,
  registerPreparedCritiqueReview,
  resetCritiqueReviewIpcForTests,
} from '../critiqueReviewIpc';

const selectedText = 'A signal crossed the empty station and changed Mara\'s decision.'.repeat(5);
const selectionFingerprint = createHash('sha256').update(selectedText).digest('hex');
let activeUnitId = 'unit-a';
let projectId = 'project-a';
let generation = 3;

function snapshot() {
  return {
    schemaVersion: 1 as const,
    role: 'writing' as const,
    generation,
    revision: 9,
    project: {
      projectId,
      path: `C:/projects/${projectId}`,
      title: 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1' as const,
      units: [
        { id: 'unit-a', title: 'The Signal', displayTitle: 'The Signal', order: 1 },
        { id: 'unit-b', title: 'The Crossing', displayTitle: 'The Crossing', order: 2 },
      ],
      drafts: { 'unit-a': 'Private prose must never cross.', 'unit-b': 'Also private.' },
    },
    activeUnitId,
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'clean' as const, unitId: null, message: null },
    lastError: null,
    recovery: { status: 'none' as const, candidates: [] as const },
  };
}

function prepared(requestId: string): {
  request: AiCritiquePrepareRequest;
  preview: AiCritiquePreview;
} {
  return {
    request: {
      operationId: `prepare-${requestId}`,
      selection: {
        projectId,
        unitId: 'unit-a',
        generation,
        projectRevision: 9,
        selectionStart: 0,
        selectionEnd: selectedText.length,
        selectedText,
        editorRevision: 4,
        sourceFingerprint: 'a'.repeat(64),
        selectionFingerprint,
      },
    },
    preview: {
      requestId,
      status: 'prepared',
      expiresAt: '2026-08-10T12:05:00.000Z',
      payloadHash: 'b'.repeat(64),
      providerBodyJson: '{"private":"not projected"}',
      provider: AI_CRITIQUE_PROVIDER,
      model: AI_CRITIQUE_MODEL,
      remote: true,
      taskContractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION,
      instructions: 'Private request instructions.',
      selectedText,
      cost: {
        currency: 'USD',
        pricingVerifiedAt: '2026-07-14',
        inputUsdPerMillionTokens: 2.5,
        cachedInputUsdPerMillionTokens: 0.25,
        outputUsdPerMillionTokens: 15,
        estimatedInputTokens: 100,
        maximumInputTokens: 400,
        maximumOutputTokens: 1600,
        estimatedUsd: 0.02425,
        maximumCalculatedUsd: 0.025,
        authorizationCeilingUsd: 0.1,
        invoiceDisclaimer: 'Calculated usage cost - not provider invoice.',
      },
      retentionDisclosure: 'Private preview disclosure.',
      clearanceDisclosure: 'Private clearance.',
      cancellationDisclosure: 'Private cancellation.',
    },
  };
}

function completedState(requestId: string): AiCritiqueState {
  return {
    requestId,
    status: 'completed',
    result: {
      requestId,
      provider: AI_CRITIQUE_PROVIDER,
      model: AI_CRITIQUE_MODEL,
      taskContractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION,
      sourceFingerprint: 'a'.repeat(64),
      selectionFingerprint,
      editorRevision: 4,
      completedAt: '2026-08-10T12:00:00.000Z',
      content: {
        overview: 'The passage establishes a clear decision point.',
        strengths: ['The signal is concrete.'],
        priorities: [],
        uncertainties: ['The surrounding chapter was not reviewed.'],
        limitations: ['Selected-passage advisory only.'],
      },
      usage: {
        inputTokens: 100,
        cachedInputTokens: 0,
        outputTokens: 50,
        calculatedUsd: 0.001,
        invoiceDisclaimer: 'Calculated usage cost - not provider invoice.',
      },
    },
  };
}

function invoke(channel: string, senderId: number, request?: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Missing handler: ${channel}`);
  return Promise.resolve(handler({ sender: { id: senderId } }, request));
}

describe('Command Review projection IPC', () => {
  const publishState = vi.fn();
  const requestSourceReturn = vi.fn();
  const create = vi.fn();

  beforeEach(() => {
    resetCritiqueReviewIpcForTests();
    electronMocks.handlers.clear();
    activeUnitId = 'unit-a';
    projectId = 'project-a';
    generation = 3;
    publishState.mockReset();
    requestSourceReturn.mockReset();
    create.mockReset();
    registerCritiqueReviewIpc({
      resolveWindowRole: (id) => id === 1 ? 'writing' : id === 2 ? 'command' : null,
      getWritingSnapshot: snapshot,
      publishState,
      requestSourceReturn,
      repositoryFactory: () => ({ create } as never),
    });
  });

  it('projects only approved terminal presentation data to Command', async () => {
    const fixture = prepared('review-completed');
    registerPreparedCritiqueReview(1, fixture.request, fixture.preview, snapshot());
    publishCritiqueReviewOwnerState(1, completedState('review-completed'));

    const state = await invoke(CRITIQUE_REVIEW_CHANNELS.requestState, 2);
    expect(state).toMatchObject({
      availability: 'available',
      projection: {
        projectId: 'project-a',
        generation: 3,
        requestId: 'review-completed',
        unitId: 'unit-a',
        lifecycleState: 'completed',
        allowedActions: ['copy-result', 'save-feedback-note', 'dismiss', 'return-to-source'],
      },
    });
    expect(JSON.stringify(state)).not.toMatch(/private prose|providerBodyJson|selectedText|credential|drafts/i);
    expect(state.sourceReturnAnchor).not.toHaveProperty('selectedText');
  });

  it.each([
    ['failed', { code: 'PROVIDER_UNAVAILABLE', message: 'Provider unavailable.', retryable: true }],
    ['cancelled', { code: 'CANCELLED', message: 'Cancelled.', retryable: false }],
    ['expired', undefined],
    ['invalidated', undefined],
  ] as const)('maps %s into a bounded terminal Review state', async (status, error) => {
    const requestId = `review-${status}`;
    const fixture = prepared(requestId);
    registerPreparedCritiqueReview(1, fixture.request, fixture.preview, snapshot());
    publishCritiqueReviewOwnerState(1, { requestId, status, ...(error ? { error } : {}) });
    const state = await invoke(CRITIQUE_REVIEW_CHANNELS.requestState, 2);
    expect(state.projection).toMatchObject({
      lifecycleState: status,
      allowedActions: ['dismiss', 'return-to-source'],
    });
    expect(state.projection.resultText).toBeUndefined();
  });

  it('routes a note through the main-owned visible-result binding and reports write failure honestly', async () => {
    const fixture = prepared('review-note');
    const completed = completedState('review-note');
    registerPreparedCritiqueReview(1, fixture.request, fixture.preview, snapshot());
    publishCritiqueReviewOwnerState(1, completed);
    const resultText = formatCritiqueReviewResult(completed)!;
    const request = {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      operationId: 'save-note',
      projectId,
      generation,
      unitId: 'unit-a',
      sourceCritiqueRequestId: 'review-note',
      selectionFingerprint,
      visibleResultFingerprint: createHash('sha256').update(resultText).digest('hex'),
      body: 'Keep the signal tied to Mara\'s decision.',
    };
    create.mockResolvedValue({ id: 'note-a' });
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.saveFeedbackNote, 2, request)).resolves.toMatchObject({
      ok: true,
      data: { noteId: 'note-a' },
    });
    expect(create).toHaveBeenCalledWith({
      projectId,
      unitId: 'unit-a',
      sourceCritiqueRequestId: 'review-note',
      selectionFingerprint,
      body: request.body,
    });
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.saveFeedbackNote, 2, {
      ...request,
      visibleResultFingerprint: 'wrong',
    })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    create.mockRejectedValueOnce(new Error('disk unavailable'));
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.saveFeedbackNote, 2, request)).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOTE_WRITE_FAILED' },
    });
  });

  it('dismisses presentation without destroying owner state', async () => {
    const fixture = prepared('review-dismiss');
    const completed = completedState('review-dismiss');
    registerPreparedCritiqueReview(1, fixture.request, fixture.preview, snapshot());
    publishCritiqueReviewOwnerState(1, completed);
    const reference = {
      schemaVersion: 1,
      operationId: 'dismiss-review',
      projectId,
      generation,
      requestId: 'review-dismiss',
      selectionFingerprint,
    };
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.dismiss, 2, reference)).resolves.toMatchObject({
      ok: true,
      state: { availability: 'dismissed' },
    });
    publishCritiqueReviewOwnerState(1, completed);
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.requestState, 2)).resolves.toMatchObject({
      availability: 'available',
      projection: { requestId: 'review-dismiss' },
    });
  });

  it('returns to an exact current source or a truthful stale Writing state', async () => {
    const fixture = prepared('review-return');
    registerPreparedCritiqueReview(1, fixture.request, fixture.preview, snapshot());
    publishCritiqueReviewOwnerState(1, completedState('review-return'));
    const reference = {
      schemaVersion: 1,
      operationId: 'return-review',
      projectId,
      generation,
      requestId: 'review-return',
      selectionFingerprint,
    };
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.returnToSource, 2, reference)).resolves.toMatchObject({
      ok: true,
      data: { status: 'exact' },
    });
    expect(requestSourceReturn).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'exact',
      anchor: expect.objectContaining({ unitId: 'unit-a', selectionFingerprint }),
    }));

    activeUnitId = 'unit-b';
    reconcileCritiqueReviewAuthority();
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.returnToSource, 2, reference)).resolves.toMatchObject({
      ok: true,
      data: { status: 'stale' },
    });
    expect(requestSourceReturn).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'stale',
    }));
    expect(requestSourceReturn.mock.calls.at(-1)?.[0]).not.toHaveProperty('anchor');
  });

  it('rejects wrong-window, wrong-project, and owner-mismatched stale actions', async () => {
    const fixture = prepared('review-boundary');
    registerPreparedCritiqueReview(1, fixture.request, fixture.preview, snapshot());
    publishCritiqueReviewOwnerState(1, completedState('review-boundary'));
    const reference = {
      schemaVersion: 1,
      operationId: 'stale-review',
      projectId,
      generation,
      requestId: 'review-boundary',
      selectionFingerprint,
    };
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.markStale, 2, reference)).resolves.toMatchObject({
      ok: false,
      error: { code: 'WRONG_WINDOW_ROLE' },
    });
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.dismiss, 99, reference)).resolves.toMatchObject({
      ok: false,
      error: { code: 'WRONG_WINDOW_ROLE' },
    });
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.dismiss, 2, {
      ...reference,
      projectId: 'project-other',
    })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_PROJECT' } });
    await expect(invoke(CRITIQUE_REVIEW_CHANNELS.markStale, 1, reference)).resolves.toMatchObject({
      ok: true,
      state: { projection: { lifecycleState: 'invalidated' } },
    });
  });
});
