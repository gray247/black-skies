import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ExportMarkdownResultData,
  ProjectSpineCloseConfirmationRequest,
  ProjectSpineBridge,
  ProjectSpineCommandStatusProjection,
  RecoveryCandidateDecisionResultData,
  ProjectSpineResult,
  ProjectSpineSessionSnapshot,
  ProjectSpineWritingRecoveryState,
  ProjectSpineWindowRole,
} from '../../shared/ipc/projectSpine';
import type { AiCritiqueBridge, AiCritiqueState } from '../../shared/ipc/aiCritique';
import type { FeedbackNotesBridge } from '../../shared/ipc/feedbackNotes';
import {
  CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
  CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION,
  type CritiqueReviewBridge,
  type CritiqueReviewSourceReturnMessageV1,
  type CritiqueReviewSurfaceStateV1,
} from '../../shared/ipc/contextualProductShell';
import type {
  LivingOutlineBridge,
  LivingOutlineDocumentV1,
  LivingOutlineSnapshotV1,
} from '../../shared/ipc/livingOutline';
import type {
  SplitCommandOwnershipBridge,
  SplitCommandSurfaceHostResult,
  SplitCommandSurfaceHostState,
} from '../../shared/ipc/splitCommand';
import Stage19WritingSpineApp, {
  deriveDirtyUnitIds,
  parseStage19Theme,
  STAGE19_THEME_STORAGE_KEY,
  useCloseConfirmationRequest,
} from '../Stage19WritingSpineApp';

vi.mock('../DraftEditor', () => ({
  default: ({
    value,
    onChange,
    onSave,
    onSelectionChange,
    ariaLabel,
    placeholder,
    readOnly,
    selectionRestore,
  }: {
    value: string;
    onChange?: (value: string) => void;
    onSave?: (value: string) => void;
    onSelectionChange?: (selection: {
      selectionStart: number;
      selectionEnd: number;
      selectedText: string;
      editorRevision: number;
      sourceFingerprint: string;
      selectionFingerprint: string;
    }) => void;
    ariaLabel?: string | null;
    placeholder?: string;
    readOnly?: boolean;
    selectionRestore?: { selectionStart: number; selectionEnd: number } | null;
  }) => (
    <textarea
      aria-label={ariaLabel ?? 'Draft editor'}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          onSave?.(event.currentTarget.value);
        }
      }}
      onSelect={(event) => {
        const target = event.currentTarget;
        onSelectionChange?.({
          selectionStart: target.selectionStart,
          selectionEnd: target.selectionEnd,
          selectedText: target.value.slice(target.selectionStart, target.selectionEnd),
          editorRevision: 1,
          sourceFingerprint: 'a'.repeat(64),
          selectionFingerprint: 'b'.repeat(64),
        });
      }}
      readOnly={readOnly}
      data-selection-restore={selectionRestore ? `${selectionRestore.selectionStart}:${selectionRestore.selectionEnd}` : undefined}
    />
  ),
}));

function markdown(id: string, title: string, order: number, body: string): string {
  return `---\nid: ${id}\ntitle: ${JSON.stringify(title)}\norder: ${order}\n---\n${body}\n`;
}

function snapshot(
  role: ProjectSpineWindowRole,
  options: {
    projectId?: string;
    path?: string;
    title?: string;
    activeUnitId?: string | null;
    units?: Array<{ id: string; title: string; order: number; body: string }>;
    generation?: number;
    revision?: number;
    recovery?: ProjectSpineWritingRecoveryState;
    dirtyUnitIds?: string[];
    saveState?: ProjectSpineSessionSnapshot['saveState'];
    lastError?: ProjectSpineSessionSnapshot['lastError'];
    commandStatus?: Partial<ProjectSpineCommandStatusProjection>;
  } = {},
): ProjectSpineSessionSnapshot {
  const units = options.units ?? [
    { id: 'unit_a', title: 'First Unit', order: 1, body: 'Alpha body' },
    { id: 'unit_b', title: '', order: 2, body: 'Beta body' },
  ];
  return {
    schemaVersion: 1,
    role,
    generation: options.generation ?? 1,
    revision: options.revision ?? 1,
    project: {
      projectId: options.projectId ?? 'proj_a',
      path: options.path ?? 'C:\\projects\\a',
      title: options.title ?? 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1',
      units: units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        displayTitle: unit.title || 'Untitled',
        order: unit.order,
      })),
      ...(role === 'writing'
        ? {
            drafts: Object.fromEntries(
              units.map((unit) => [unit.id, markdown(unit.id, unit.title, unit.order, unit.body)]),
            ),
          }
        : {}),
    },
    activeUnitId: options.activeUnitId === undefined ? units[0]?.id ?? null : options.activeUnitId,
    recentProjects: [],
    dirtyUnitIds: options.dirtyUnitIds ?? [],
    saveState: options.saveState ?? { status: 'clean', unitId: null, message: null },
    lastError: options.lastError ?? null,
    ...(role === 'writing'
      ? { recovery: options.recovery ?? { status: 'none' as const, candidates: [] } }
      : {
          commandStatus: {
            schemaVersion: 1 as const,
            projectId: options.projectId ?? 'proj_a',
            generation: options.generation ?? 1,
            revision: options.revision ?? 1,
            lifecycle: 'active' as const,
            recovery: 'none' as const,
            save: options.saveState?.status ?? 'clean' as const,
            ...options.commandStatus,
          },
        }),
  };
}

function createBridge(initial: ProjectSpineSessionSnapshot, options: { closeConfirmations?: boolean } = {}) {
  let current = initial;
  const listeners = new Set<(next: ProjectSpineSessionSnapshot) => void>();
  const closeConfirmationListeners = new Set<(request: ProjectSpineCloseConfirmationRequest) => void>();
  const emit = (next: ProjectSpineSessionSnapshot) => {
    current = next;
    for (const listener of listeners) listener(next);
  };
  const ok = <T,>(data: T, next = current): ProjectSpineResult<T> => ({
    ok: true,
    data,
    snapshot: next,
  });

  const bridge = {
    windowRole: initial.role,
    focusWritingWindow: vi.fn(async () => undefined),
    chooseDirectory: vi.fn().mockResolvedValue({ canceled: true }),
    openProject: vi.fn(async () => ok({ activation: 'activated' as const })),
    createProject: vi.fn(async () => ok({ activation: 'activated' as const })),
    getSession: vi.fn(async () => current),
    removeRecent: vi.fn(async () => ok({})),
    subscribeSession: vi.fn((listener: (next: ProjectSpineSessionSnapshot) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    selectUnit: vi.fn(async (request: { unitId: string | null }) => {
      const next = { ...current, activeUnitId: request.unitId };
      current = next;
      return ok({}, next);
    }),
    ...(initial.role === 'writing'
      ? {
          setUnitDirty: vi.fn(async (request: { unitId: string; dirty: boolean }) => {
            const dirtyUnitIds = request.dirty
              ? [...new Set([...current.dirtyUnitIds, request.unitId])]
              : current.dirtyUnitIds.filter((id) => id !== request.unitId);
            current = {
              ...current,
              revision: current.revision + 1,
              dirtyUnitIds,
              saveState: request.dirty
                ? { status: 'dirty' as const, unitId: request.unitId, message: null }
                : { status: 'clean' as const, unitId: null, message: null },
            };
            return ok({}, current);
          }),
          captureRecoveryCheckpoint: vi.fn(async () => ok({
            status: 'stored' as const,
            candidateVersion: 1,
          })),
          acceptRecoveryCandidate: vi.fn(async () => ok({
            decision: 'accepted' as const,
            resolution: 'decisions-remaining' as const,
            unitId: 'unit_a',
            remainingDecisionCount: 1,
          })),
          rejectRecoveryCandidate: vi.fn(async () => ok({
            decision: 'rejected' as const,
            resolution: 'decisions-remaining' as const,
            unitId: 'unit_a',
            remainingDecisionCount: 1,
          })),
          saveUnit: vi.fn(async (request: { unitId: string; markdown: string }) => {
            current = {
              ...current,
              revision: current.revision + 1,
              project: current.project
                ? {
                    ...current.project,
                    drafts: { ...current.project.drafts, [request.unitId]: request.markdown },
                  }
                : null,
              dirtyUnitIds: current.dirtyUnitIds.filter((id) => id !== request.unitId),
              saveState: { status: 'saved' as const, unitId: request.unitId, message: null },
            };
            return ok({
              recovery: { status: 'retired' as const, message: null },
            }, current);
          }),
          createUnit: vi.fn(async () => ok({ unitId: 'unit_new' })),
          renameUnit: vi.fn(async () => ok({})),
          reorderUnits: vi.fn(async () => ok({})),
          deleteUnit: vi.fn(async () => ok({})),
          exportMarkdown: vi.fn(async (request: {
            projectId: string;
            generation: number;
            revision: number;
            operationId: string;
          }) => ok<ExportMarkdownResultData>({
            status: 'cancelled',
            projectId: request.projectId,
            generation: request.generation,
            revision: request.revision,
            operationId: request.operationId,
          })),
          ...(options.closeConfirmations
            ? {
                onCloseConfirmationRequest: vi.fn((listener: (request: ProjectSpineCloseConfirmationRequest) => void) => {
                  closeConfirmationListeners.add(listener);
                  return () => closeConfirmationListeners.delete(listener);
                }),
                respondToCloseConfirmation: vi.fn(async () => ({ ok: true, data: {}, snapshot: current })),
              }
            : {}),
        }
      : {}),
  } as unknown as ProjectSpineBridge;

  return {
    bridge,
    emit,
    emitCloseConfirmation: (request: ProjectSpineCloseConfirmationRequest) => {
      for (const listener of closeConfirmationListeners) listener(request);
    },
    get current() { return current; },
  };
}

function createSurfaceBridge(
  commandSnapshot: ProjectSpineSessionSnapshot,
  options: {
    initialSurface?: 'writing' | 'command';
    activationFailure?: { code: 'STALE_GENERATION' | 'SECONDARY_UNAVAILABLE'; message: string };
  } = {},
) {
  let current: SplitCommandSurfaceHostState = {
    schemaVersion: 1,
    primarySurface: options.initialSurface ?? 'writing',
    commandPlacement: 'current-window',
    secondaryStatus: 'closed',
    notice: null,
    projectId: commandSnapshot.project?.projectId ?? null,
    generation: commandSnapshot.generation,
    revision: commandSnapshot.revision,
    commandSnapshot,
  };
  const listeners = new Set<(state: SplitCommandSurfaceHostState) => void>();
  const publish = (next: SplitCommandSurfaceHostState) => {
    current = next;
    for (const listener of listeners) listener(next);
  };
  const activateSurface = vi.fn(async (request): Promise<SplitCommandSurfaceHostResult> => {
    if (options.activationFailure) {
      return { ok: false, error: options.activationFailure, state: current };
    }
    const next: SplitCommandSurfaceHostState = request.placement === 'secondary-window'
      ? {
          ...current,
          primarySurface: 'writing',
          commandPlacement: 'secondary-window',
          secondaryStatus: 'open',
          notice: null,
        }
      : {
          ...current,
          primarySurface: request.targetSurface,
          commandPlacement: 'current-window',
          secondaryStatus: 'closed',
          notice: null,
        };
    publish(next);
    return { ok: true, state: next };
  });
  const bridge: SplitCommandOwnershipBridge = {
    windowRole: 'primary',
    requestOwnershipSync: vi.fn(async () => null),
    readOwnershipSync: vi.fn(() => null),
    subscribeOwnershipSync: vi.fn(() => () => undefined),
    requestSurfaceHostState: vi.fn(async () => current),
    activateSurface,
    readSurfaceHostState: vi.fn(() => current),
    subscribeSurfaceHostState: vi.fn((listener) => {
      listeners.add(listener);
      listener(current);
      return () => listeners.delete(listener);
    }),
  };
  return {
    bridge,
    activateSurface,
    publish,
    get current() { return current; },
  };
}

function recoveryCandidate(
  unitId: string,
  prose: string,
  decision: 'available' | 'accept-selected' | 'accepted-pending-save' = 'available',
) {
  return {
    projectId: 'proj_a',
    projectPath: 'C:\\projects\\a',
    unitId,
    unitTitle: unitId === 'unit_a' ? 'First Unit' : '',
    unitOrder: unitId === 'unit_a' ? 1 : 2,
    originSessionId: decision === 'accepted-pending-save' ? 'origin-current' : 'origin-prior',
    priorSessionGeneration: 1,
    priorSessionRevision: 3,
    durableBaselineFingerprint: 'a'.repeat(64),
    candidateVersion: 1,
    updatedAt: '2026-07-13T00:00:00.000Z',
    prose,
    decision,
  } as const;
}

function createAiBridge(selectedText: string) {
  const listeners = new Set<(state: AiCritiqueState) => void>();
  const preview = {
    requestId: 'ai-request-1',
    status: 'prepared' as const,
    expiresAt: '2026-07-14T12:05:00.000Z',
    payloadHash: 'c'.repeat(64),
    providerBodyJson: JSON.stringify({ model: 'gpt-5.4-2026-03-05', input: selectedText }),
    provider: 'openai' as const,
    model: 'gpt-5.4-2026-03-05' as const,
    remote: true as const,
    taskContractVersion: 'black_skies_critique_v2' as const,
    instructions: 'Frozen critique instructions.',
    selectedText,
    cost: {
      currency: 'USD' as const,
      pricingVerifiedAt: '2026-07-14' as const,
      inputUsdPerMillionTokens: 2.5 as const,
      cachedInputUsdPerMillionTokens: 0.25 as const,
      outputUsdPerMillionTokens: 15 as const,
      estimatedInputTokens: 100,
      maximumInputTokens: 400,
      maximumOutputTokens: 1600 as const,
      estimatedUsd: 0.02425,
      maximumCalculatedUsd: 0.025,
      authorizationCeilingUsd: 0.1 as const,
      invoiceDisclaimer: 'Calculated usage cost - not provider invoice.' as const,
    },
    retentionDisclosure: 'Retention disclosure.',
    clearanceDisclosure: 'Confirm exact prose is cleared for remote transmission.',
    cancellationDisclosure: 'Local cancellation does not guarantee provider cancellation.',
  };
  const bridge: AiCritiqueBridge = {
    credentialStatus: vi.fn(async () => ({ configured: false })),
    setCredential: vi.fn(async () => ({ ok: true as const, data: { configured: true } })),
    clearCredential: vi.fn(async () => ({ configured: false })),
    prepare: vi.fn(async () => ({ ok: true as const, data: preview })),
    approveAndExecute: vi.fn(async (request) => ({
      ok: true as const,
      data: { requestId: request.requestId, operationId: request.operationId },
    })),
    cancel: vi.fn(async (request) => ({
      ok: true as const,
      data: { requestId: request.requestId, status: 'cancelled' as const },
    })),
    invalidate: vi.fn(async (request) => ({
      ok: true as const,
      data: { requestId: request.requestId, status: 'invalidated' as const },
    })),
    subscribeState: vi.fn((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };
  return {
    bridge,
    preview,
    emit(state: AiCritiqueState) {
      for (const listener of listeners) listener(state);
    },
  };
}

function completedReviewState(
  overrides: Partial<NonNullable<CritiqueReviewSurfaceStateV1['projection']>> = {},
): CritiqueReviewSurfaceStateV1 {
  return {
    schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
    projectId: 'proj_a',
    generation: 1,
    availability: 'available',
    sourceReturnAnchor: {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId: 'proj_a',
      generation: 1,
      unitId: 'unit_a',
      editorRevision: 1,
      selectionStart: 0,
      selectionEnd: 320,
      selectionFingerprint: 'b'.repeat(64),
    },
    projection: {
      schemaVersion: CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION,
      projectId: 'proj_a',
      generation: 1,
      requestId: 'ai-request-1',
      unitId: 'unit_a',
      selectionFingerprint: 'b'.repeat(64),
      sourceLabel: 'First Unit',
      selectedCharacterCount: 320,
      lifecycleState: 'completed',
      advisoryLabel: 'Advisory critique - the author decides what to keep.',
      providerDisclosure: 'Remote advisory provider: openai.',
      modelDisclosure: 'Model: gpt-5.4-2026-03-05.',
      privacyAndCostDisclosure: 'Only the author-approved selected passage is transmitted. Maximum calculated cost: $0.025000.',
      resultText: 'The passage sustains a controlled temporal unease.\n\nStrengths\n- The sensory frame is specific.',
      limitationText: 'Advisory interpretation, not story truth.',
      completedAt: '2026-08-09T12:00:00.000Z',
      allowedActions: ['copy-result', 'save-feedback-note', 'dismiss', 'return-to-source'],
      ...overrides,
    },
  };
}

function createCritiqueReviewBridge(
  initialState: CritiqueReviewSurfaceStateV1 = {
    schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
    projectId: 'proj_a',
    generation: 1,
    availability: 'empty',
    message: 'No critique review is waiting in Command Center.',
  },
  options: {
    saveFailure?: string;
    returnStatus?: 'exact' | 'stale';
  } = {},
) {
  let current = initialState;
  const stateListeners = new Set<(state: CritiqueReviewSurfaceStateV1) => void>();
  const sourceListeners = new Set<(message: CritiqueReviewSourceReturnMessageV1) => void>();
  const publish = (state: CritiqueReviewSurfaceStateV1) => {
    current = state;
    for (const listener of stateListeners) listener(state);
  };
  const bridge: CritiqueReviewBridge = {
    requestState: vi.fn(async () => current),
    readState: vi.fn(() => current),
    subscribeState: vi.fn((listener) => {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    }),
    markStale: vi.fn(async () => {
      if (current.availability === 'available' && current.projection) {
        publish({
          ...current,
          projection: {
            ...current.projection,
            lifecycleState: 'invalidated',
            resultText: undefined,
            failureClass: 'source-changed',
            limitationText: 'The source context changed after this review was created.',
            allowedActions: ['dismiss', 'return-to-source'],
          },
        });
      }
      return { ok: true as const, data: {}, state: current };
    }),
    dismiss: vi.fn(async () => {
      const requestId = current.projection?.requestId;
      publish({
        schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
        projectId: current.projectId,
        generation: current.generation,
        availability: 'dismissed',
        ...(requestId ? { dismissedRequestId: requestId } : {}),
        message: 'The Review presentation was dismissed. The Writing owner was not changed.',
      });
      return { ok: true as const, data: {}, state: current };
    }),
    saveFeedbackNote: vi.fn(async () => options.saveFailure
      ? {
          ok: false as const,
          error: { code: 'NOTE_WRITE_FAILED' as const, message: options.saveFailure },
          state: current,
        }
      : { ok: true as const, data: { noteId: 'feedback-note-1' }, state: current }),
    returnToSource: vi.fn(async () => {
      const status = options.returnStatus ?? 'exact';
      const projection = current.projection;
      const message: CritiqueReviewSourceReturnMessageV1 = {
        schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
        projectId: current.projectId ?? 'proj_a',
        generation: current.generation,
        requestId: projection?.requestId ?? 'ai-request-1',
        status,
        message: status === 'exact'
          ? 'Returned to the reviewed passage in First Unit.'
          : 'Returned to Writing Studio, but the reviewed passage is no longer current.',
        ...(status === 'exact' && current.sourceReturnAnchor
          ? { anchor: current.sourceReturnAnchor }
          : {}),
      };
      for (const listener of sourceListeners) listener(message);
      return { ok: true as const, data: { status }, state: current };
    }),
    subscribeSourceReturn: vi.fn((listener) => {
      sourceListeners.add(listener);
      return () => sourceListeners.delete(listener);
    }),
  };
  return {
    bridge,
    publish,
    get current() { return current; },
  };
}

function createLivingOutlineBridge(initialItems: LivingOutlineDocumentV1['items'] = []) {
  let current: LivingOutlineSnapshotV1 = {
    availability: 'ready',
    document: {
      schemaVersion: 'BlackSkiesLivingOutline v1',
      projectId: 'proj_a',
      revision: 0,
      items: initialItems,
    },
    message: null,
  };
  const success = () => ({ ok: true as const, data: current });
  const update = (items: LivingOutlineDocumentV1['items']) => {
    current = {
      availability: 'ready',
      document: { ...current.document, revision: current.document.revision + 1, items },
      message: null,
    };
    return success();
  };
  const bridge: LivingOutlineBridge = {
    get: vi.fn(async () => success()),
    createItem: vi.fn(async (request) => update([...current.document.items, {
      id: `item-${current.document.items.length + 1}`,
      label: request.label.trim(), kind: request.kind, state: request.state,
      manuscriptUnitId: request.manuscriptUnitId,
      sourceAnchor: request.sourceAnchor,
      createdAt: '2026-08-09T12:00:00.000Z', updatedAt: '2026-08-09T12:00:00.000Z',
    }])),
    updateItem: vi.fn(async (request) => update(current.document.items.map((item) => item.id === request.itemId
      ? { ...item, label: request.label, kind: request.kind, state: request.state }
      : item))),
    moveItem: vi.fn(async (request) => {
      const items = [...current.document.items];
      const index = items.findIndex((item) => item.id === request.itemId);
      const destination = index + request.direction;
      if (index >= 0 && destination >= 0 && destination < items.length) {
        [items[index], items[destination]] = [items[destination]!, items[index]!];
      }
      return update(items);
    }),
    linkItem: vi.fn(async (request) => update(current.document.items.map((item) => item.id === request.itemId
      ? { ...item, manuscriptUnitId: request.manuscriptUnitId }
      : item))),
    deleteItem: vi.fn(async (request) => update(current.document.items.filter((item) => item.id !== request.itemId))),
  };
  return { bridge, get current() { return current; } };
}

function completedCritiqueState(): AiCritiqueState {
  return {
    requestId: 'ai-request-1',
    status: 'completed',
    result: {
      requestId: 'ai-request-1', provider: 'openai', model: 'gpt-5.4-2026-03-05',
      taskContractVersion: 'black_skies_critique_v2', sourceFingerprint: 'a'.repeat(64),
      selectionFingerprint: 'b'.repeat(64), editorRevision: 1,
      completedAt: '2026-08-09T12:00:00.000Z',
      content: {
        overview: 'The passage sustains a controlled temporal unease.',
        strengths: ['The sensory frame is specific.'], priorities: [],
        uncertainties: ['The critique saw only the selected passage.'],
        limitations: ['Advisory interpretation, not story truth.'],
      },
      usage: {
        inputTokens: 100, cachedInputTokens: 0, outputTokens: 50, calculatedUsd: 0.001,
        invoiceDisclaimer: 'Calculated usage cost - not provider invoice.',
      },
    },
  };
}

let closeRequestState: ReturnType<typeof useCloseConfirmationRequest>;

function CloseRequestHarness({
  bridge,
  current,
  windowRole,
}: {
  readonly bridge: ProjectSpineBridge;
  readonly current: ProjectSpineSessionSnapshot;
  readonly windowRole: ProjectSpineWindowRole;
}): JSX.Element {
  closeRequestState = useCloseConfirmationRequest({
    bridge,
    windowRole,
    projectId: current.project?.projectId ?? null,
    generation: current.generation,
  });
  return (
    <div
      data-testid="close-request-state"
      data-correlation-id={closeRequestState.activeRequest?.correlationId ?? ''}
    />
  );
}

afterEach(() => {
  vi.useRealTimers();
  delete window.projectSpine;
  delete document.body.dataset.stage19Spine;
  delete document.body.dataset.stage19Theme;
  delete document.documentElement.dataset.stage19Theme;
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
});

beforeEach(() => {
  Object.defineProperty(Range.prototype, 'getClientRects', {
    configurable: true,
    value: vi.fn(() => ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* iterator() {},
    })),
  });
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: vi.fn(() => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })),
  });
});

type WritingRailLabel = 'project tools' | 'story tools' | 'writing support' | 'session tools';

async function openWritingRail(label: WritingRailLabel): Promise<void> {
  if (screen.queryByRole('button', { name: `Close ${label}` })) return;
  const openControl = await screen.findByRole('button', { name: `Open ${label}` });
  await act(async () => {
    fireEvent.click(openControl);
    await Promise.resolve();
  });
  await screen.findByRole('button', { name: `Close ${label}` });
}

async function findExportButton(): Promise<HTMLElement> {
  await openWritingRail('project tools');
  return screen.findByRole('button', { name: /Export Markdown/ });
}

describe('Stage19WritingSpineApp', () => {
  it('defaults malformed or missing local appearance preferences to dark', () => {
    expect(parseStage19Theme(null)).toBe('dark');
    expect(parseStage19Theme('blue')).toBe('dark');
    expect(parseStage19Theme('light')).toBe('light');
  });

  it('switches the local appearance without changing manuscript state', async () => {
    const harness = createBridge(snapshot('writing'));
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    const appearance = screen.getByRole('switch', { name: 'Light theme' });
    expect(appearance).toHaveAttribute('aria-checked', 'false');
    expect(document.body).toHaveAttribute('data-stage19-theme', 'dark');
    expect(editor).toHaveValue('Alpha body');

    await user.click(appearance);

    expect(appearance).toHaveAttribute('aria-checked', 'true');
    expect(document.body).toHaveAttribute('data-stage19-theme', 'light');
    expect(window.localStorage.getItem(STAGE19_THEME_STORAGE_KEY)).toBe('light');
    expect(editor).toHaveValue('Alpha body');
    expect(harness.bridge.saveUnit).not.toHaveBeenCalled();
    expect(harness.bridge.reorderUnits).not.toHaveBeenCalled();
  });

  it('restores the local light preference in Command Center without project mutation', async () => {
    window.localStorage.setItem(STAGE19_THEME_STORAGE_KEY, 'light');
    const harness = createBridge(snapshot('command'));
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

    const command = await screen.findByRole('region', { name: 'Command Center' });
    expect(command).toHaveAttribute('data-stage19-theme', 'light');
    expect(screen.getByRole('switch', { name: 'Light theme' })).toHaveAttribute('aria-checked', 'true');
    expect(harness.bridge.saveUnit).toBeUndefined();
  });

  it('uses writer-facing Story language while preserving the existing safe storage calls', async () => {
    const project = createBridge(snapshot('writing'));
    const outline = createLivingOutlineBridge();
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} livingOutlineBridge={outline.bridge} />);

    await openWritingRail('story tools');
    expect(screen.getByRole('complementary', { name: 'Story rail' })).toBeVisible();
    expect(screen.getByRole('list', { name: 'Story order' })).toBeVisible();
    const addToStory = screen.getByRole('button', { name: 'Add to story here' });
    expect(addToStory).toHaveAttribute('title', 'Add a story point at the current writing position');

    await user.click(addToStory);

    expect(outline.bridge.createItem).toHaveBeenCalledWith(expect.objectContaining({
      label: 'New story point',
      manuscriptUnitId: 'unit_a',
    }));
    expect(project.bridge.saveUnit).not.toHaveBeenCalled();
    expect(project.bridge.reorderUnits).not.toHaveBeenCalled();
  });

  it('treats the durable Markdown terminal newline as file framing, not visible prose', () => {
    const current = snapshot('writing');
    const authoredTerminalLine = snapshot('writing', {
      units: [{ id: 'unit_a', title: 'First Unit', order: 1, body: 'Alpha body\n' }],
    });

    expect(deriveDirtyUnitIds(current, { unit_a: 'Alpha body' })).toEqual(new Set());
    expect(deriveDirtyUnitIds(authoredTerminalLine, { unit_a: 'Alpha body\n' })).toEqual(
      new Set(),
    );
    expect(deriveDirtyUnitIds(current, { unit_a: 'Alpha body changed' })).toEqual(
      new Set(['unit_a']),
    );
    expect(deriveDirtyUnitIds(snapshot('writing', {
      dirtyUnitIds: ['unit_a'],
      saveState: { status: 'dirty', unitId: 'unit_a', message: null },
    }), { unit_a: 'Alpha body' })).toEqual(new Set(['unit_a']));
  });

  it('keeps authoritative accepted-recovery dirtiness actionable through the visible Save button', async () => {
    const current = snapshot('writing', {
      dirtyUnitIds: ['unit_a'],
      saveState: { status: 'dirty', unitId: 'unit_a', message: null },
      recovery: {
        status: 'accepted-pending-save',
        candidates: [recoveryCandidate('unit_a', 'Recovered prose', 'accepted-pending-save')],
      },
    });
    const harness = createBridge(current);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    expect(await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' }))
      .toHaveValue('Recovered prose');
    const save = screen.getByRole('button', { name: /^Save$/ });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    await waitFor(() => expect(harness.bridge.saveUnit).toHaveBeenCalledWith(
      expect.objectContaining({ submittedProse: 'Recovered prose' }),
    ));
  });

  it.each(['writing', 'command'] as const)(
    'renders a restored canonical clean project as saved immediately in %s',
    async (windowRole) => {
      const harness = createBridge(snapshot(windowRole));
      render(<Stage19WritingSpineApp windowRole={windowRole} bridge={harness.bridge} />);

      expect(await screen.findByRole('status')).toHaveTextContent('Saved durably');
      expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
    },
  );

  it('subscribes only in Writing Studio and unsubscribes on unmount', () => {
    const writing = createBridge(snapshot('writing'), { closeConfirmations: true });
    const command = createBridge(snapshot('command'));
    const { unmount } = render(
      <CloseRequestHarness bridge={writing.bridge} current={writing.current} windowRole="writing" />,
    );

    expect(writing.bridge.onCloseConfirmationRequest).toHaveBeenCalledTimes(1);
    unmount();
    writing.emitCloseConfirmation({ correlationId: 'after-unmount', projectId: 'proj_a', generation: 1 });
    expect(closeRequestState.activeRequest).toBeNull();

    render(<CloseRequestHarness bridge={command.bridge} current={command.current} windowRole="command" />);
    expect(command.bridge.onCloseConfirmationRequest).toBeUndefined();
    expect(command.bridge.respondToCloseConfirmation).toBeUndefined();
  });

  it('keeps one current-session close request and ignores duplicates or stale requests', async () => {
    const harness = createBridge(snapshot('writing'), { closeConfirmations: true });
    render(<CloseRequestHarness bridge={harness.bridge} current={harness.current} windowRole="writing" />);
    const first = { correlationId: 'close-1', projectId: 'proj_a', generation: 1 };

    act(() => harness.emitCloseConfirmation(first));
    await waitFor(() => expect(closeRequestState.activeRequest).toEqual(first));
    act(() => harness.emitCloseConfirmation(first));
    expect(closeRequestState.activeRequest).toEqual(first);

    act(() => harness.emitCloseConfirmation({ correlationId: 'wrong-project', projectId: 'proj_b', generation: 1 }));
    act(() => harness.emitCloseConfirmation({ correlationId: 'wrong-generation', projectId: 'proj_a', generation: 2 }));
    expect(closeRequestState.activeRequest).toEqual(first);

    const replacement = { correlationId: 'close-2', projectId: 'proj_a', generation: 1 };
    act(() => harness.emitCloseConfirmation(replacement));
    await waitFor(() => expect(closeRequestState.activeRequest).toEqual(replacement));
  });

  it.each([
    ['keepEditing', 'keep-editing'],
    ['discardChanges', 'discard'],
  ] as const)('submits %s with the active correlation and clears only after success', async (callback, decision) => {
    const harness = createBridge(snapshot('writing'), { closeConfirmations: true });
    render(<CloseRequestHarness bridge={harness.bridge} current={harness.current} windowRole="writing" />);
    const request = { correlationId: `close-${decision}`, projectId: 'proj_a', generation: 1 };
    act(() => harness.emitCloseConfirmation(request));
    await waitFor(() => expect(closeRequestState.activeRequest).toEqual(request));

    await act(async () => closeRequestState[callback]());
    expect(harness.bridge.respondToCloseConfirmation).toHaveBeenCalledWith({ ...request, decision });
    expect(closeRequestState.activeRequest).toBeNull();
  });

  it('preserves a failed close response for retry and prevents duplicate submission', async () => {
    const harness = createBridge(snapshot('writing'), { closeConfirmations: true });
    let resolveResponse: ((result: ProjectSpineResult) => void) | undefined;
    vi.mocked(harness.bridge.respondToCloseConfirmation!).mockImplementation(
      () => new Promise<ProjectSpineResult>((resolve) => { resolveResponse = resolve; }),
    );
    render(<CloseRequestHarness bridge={harness.bridge} current={harness.current} windowRole="writing" />);
    const request = { correlationId: 'close-retry', projectId: 'proj_a', generation: 1 };
    act(() => harness.emitCloseConfirmation(request));
    await waitFor(() => expect(closeRequestState.activeRequest).toEqual(request));

    let firstSubmission: Promise<void>;
    act(() => {
      firstSubmission = closeRequestState.keepEditing();
    });
    await waitFor(() => expect(closeRequestState.responseSubmitting).toBe(true));
    await closeRequestState.keepEditing();
    expect(harness.bridge.respondToCloseConfirmation).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveResponse?.({ ok: true, data: {}, snapshot: harness.current });
      await firstSubmission!;
    });
    await waitFor(() => expect(closeRequestState.activeRequest).toBeNull());

    vi.mocked(harness.bridge.respondToCloseConfirmation!).mockRejectedValueOnce(new Error('response unavailable'));
    act(() => harness.emitCloseConfirmation(request));
    await waitFor(() => expect(closeRequestState.activeRequest).toEqual(request));
    await act(async () => closeRequestState.discardChanges());
    expect(closeRequestState.activeRequest).toEqual(request);
    expect(closeRequestState.responseError).toBe('response unavailable');
  });

  it('switches logical surfaces in one window without losing unsaved prose or return focus', async () => {
    const writing = createBridge(snapshot('writing'));
    const surfaces = createSurfaceBridge(snapshot('command'));
    render(
      <Stage19WritingSpineApp
        windowRole="writing"
        bridge={writing.bridge}
        surfaceBridge={surfaces.bridge}
      />,
    );

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    fireEvent.change(editor, { target: { value: 'Unsaved surface-preserved prose' } });
    expect(editor).toHaveValue('Unsaved surface-preserved prose');

    fireEvent.click(screen.getByRole('button', { name: 'Open Command Center here' }));
    expect(await screen.findByRole('region', { name: 'Command Center' })).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Manuscript editor: First Unit' }))
      .not.toBeInTheDocument();
    expect(document.querySelector('textarea')).toHaveValue('Unsaved surface-preserved prose');
    expect(screen.queryByRole('button', { name: /^Save$/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Return to Writing Studio' }));
    const restoredEditor = await screen.findByRole('textbox', {
      name: 'Manuscript editor: First Unit',
    });
    expect(restoredEditor).toHaveValue('Unsaved surface-preserved prose');
    await waitFor(() => expect(restoredEditor).toHaveFocus());
    expect(surfaces.activateSurface).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        projectId: 'proj_a',
        generation: 1,
        targetSurface: 'command',
        placement: 'current-window',
      }),
    );
    expect(surfaces.activateSurface).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        projectId: 'proj_a',
        generation: 1,
        targetSurface: 'writing',
        placement: 'current-window',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Command Center in second window' }));
    await waitFor(() => expect(surfaces.activateSurface).toHaveBeenLastCalledWith(
      expect.objectContaining({
        targetSurface: 'command',
        placement: 'secondary-window',
      }),
    ));
    expect(screen.getByRole('button', { name: 'Command Center open in second window' }))
      .toBeDisabled();
    expect(restoredEditor).toHaveValue('Unsaved surface-preserved prose');
  });

  it('routes a local Companion orientation request through the persistent Companion bar without changing writing', async () => {
    const writing = createBridge(snapshot('writing'));
    const surfaces = createSurfaceBridge(snapshot('command'));
    const outline = createLivingOutlineBridge();
    const user = userEvent.setup();
    render(
      <Stage19WritingSpineApp
        windowRole="writing"
        bridge={writing.bridge}
        surfaceBridge={surfaces.bridge}
        livingOutlineBridge={outline.bridge}
      />,
    );

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    expect(screen.getByText('Local project and current writing only: First Unit. No AI.')).toBeVisible();
    const companionInput = screen.getByRole('textbox', { name: 'Ask Black Skies' });
    await user.type(companionInput, 'Where am I?');
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: 'Here is where you are' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Companion orientation result' })).toHaveTextContent('Project A · 2 manuscript units');
    expect(screen.getByRole('region', { name: 'Companion orientation result' })).toHaveTextContent('First Unit · unit 1 of 2');
    expect(screen.getByRole('region', { name: 'Companion orientation result' })).toHaveTextContent('No story point is placed with the current writing');
    expect(screen.getByText(/It did not read manuscript prose, call AI, create memory/)).toBeVisible();
    expect(surfaces.activateSurface).toHaveBeenLastCalledWith(expect.objectContaining({
      targetSurface: 'command', placement: 'current-window', projectId: 'proj_a', generation: 1,
    }));
    expect(writing.bridge.saveUnit).not.toHaveBeenCalled();
    expect(writing.bridge.reorderUnits).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Return to Writing' }));
    const restoredEditor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    expect(restoredEditor).toHaveValue('Alpha body');
    await waitFor(() => expect(restoredEditor).toHaveFocus());
  });

  it('returns an optional second-window Command placement to the primary surface for a temporary Companion result', async () => {
    const writing = createBridge(snapshot('writing'));
    const surfaces = createSurfaceBridge(snapshot('command'));
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={writing.bridge} surfaceBridge={surfaces.bridge} />);

    act(() => surfaces.publish({
      ...surfaces.current,
      primarySurface: 'writing',
      commandPlacement: 'secondary-window',
      secondaryStatus: 'open',
    }));
    const companionInput = await screen.findByRole('textbox', { name: 'Ask Black Skies' });
    await user.type(companionInput, 'What am I working on?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByRole('region', { name: 'Companion orientation result' })).toBeVisible();
    expect(surfaces.activateSurface).toHaveBeenLastCalledWith(expect.objectContaining({
      targetSurface: 'command', placement: 'current-window',
    }));
    expect(surfaces.current.commandPlacement).toBe('current-window');
    expect(surfaces.current.secondaryStatus).toBe('closed');
  });

  it('drops a temporary Companion result when the active project generation changes', async () => {
    const writing = createBridge(snapshot('writing'));
    const surfaces = createSurfaceBridge(snapshot('command'));
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={writing.bridge} surfaceBridge={surfaces.bridge} />);

    await user.type(await screen.findByRole('textbox', { name: 'Ask Black Skies' }), 'Where am I?');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('region', { name: 'Companion orientation result' })).toBeVisible();

    act(() => writing.emit(snapshot('writing', { generation: 2 })));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Companion orientation result' })).not.toBeInTheDocument());
  });

  it('states that unsupported Companion questions are not routed without exposing an AI workflow', async () => {
    const writing = createBridge(snapshot('writing'));
    const surfaces = createSurfaceBridge(snapshot('command'));
    const user = userEvent.setup();
    render(
      <Stage19WritingSpineApp
        windowRole="writing"
        bridge={writing.bridge}
        surfaceBridge={surfaces.bridge}
      />,
    );

    await user.type(await screen.findByRole('textbox', { name: 'Ask Black Skies' }), 'How should I fix this chapter?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByRole('heading', { name: 'This request is not routed yet' })).toBeVisible();
    expect(screen.getByText('This first Companion slice only answers where you are in the current project. No AI or provider was called.')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Selected prose AI critique' })).not.toBeInTheDocument();
    expect(writing.bridge.saveUnit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('region', { name: 'Companion orientation result' })).not.toBeInTheDocument();
    expect(screen.getByText('Review unavailable')).toBeVisible();
  });

  it('keeps Companion hidden in Focus mode and leaves writing usable if Command cannot open', async () => {
    const writing = createBridge(snapshot('writing'));
    const rejectedSurfaces = createSurfaceBridge(snapshot('command'), {
      activationFailure: {
        code: 'STALE_GENERATION',
        message: 'The project changed before Command Center could move.',
      },
    });
    const user = userEvent.setup();
    render(
      <Stage19WritingSpineApp
        windowRole="writing"
        bridge={writing.bridge}
        surfaceBridge={rejectedSurfaces.bridge}
      />,
    );

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    expect(await screen.findByRole('textbox', { name: 'Ask Black Skies' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Enter Focus mode' }));
    expect(screen.queryByRole('textbox', { name: 'Ask Black Skies' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Writing Studio edge controls' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'One continuous story' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Scroll through the whole story/)).not.toBeInTheDocument();
    expect(document.querySelector('.stage19-writing-shell__focus-context')).toHaveTextContent('Project A');
    expect(screen.getByRole('button', { name: 'Exit Focus mode' })).toBeVisible();
    expect(editor).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Exit Focus mode' }));

    await user.type(await screen.findByRole('textbox', { name: 'Ask Black Skies' }), 'Where was I?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));
    expect(await screen.findByText('Companion could not open Command Center. The request was not saved and writing remains unchanged.')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Companion orientation result' })).not.toBeInTheDocument();
    expect(editor).toBeVisible();
    expect(editor).toHaveValue('Alpha body');
  });

  it('keeps Writing Studio usable when a surface transition is rejected', async () => {
    const writing = createBridge(snapshot('writing'));
    const surfaces = createSurfaceBridge(snapshot('command'), {
      activationFailure: {
        code: 'STALE_GENERATION',
        message: 'The project changed before Command Center could move.',
      },
    });
    render(
      <Stage19WritingSpineApp
        windowRole="writing"
        bridge={writing.bridge}
        surfaceBridge={surfaces.bridge}
      />,
    );

    expect(await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' }))
      .toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Open Command Center here' }));
    expect((await screen.findAllByText(
      'The project changed before Command Center could move.',
    ))[0]).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Manuscript editor: First Unit' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Command Center' })).not.toBeInTheDocument();
  });

  it('renders a role-projected Command Center with no prose or structural mutation controls', async () => {
    const harness = createBridge(snapshot('command'));
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

    expect(await screen.findByRole('heading', { name: 'Project A' })).toBeVisible();
    const workspaces = screen.getByRole('navigation', { name: 'Command Center workspaces' });
    for (const name of [
      'Review',
      'Structure',
      'Story Knowledge',
      'Create / Develop',
      'Project Interchange',
      'Operations / Approvals',
    ]) expect(within(workspaces).getByRole('button', { name })).toBeVisible();
    expect(within(workspaces).getByRole('button', { name: 'Review' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: 'Writing remains available' })).toBeVisible();
    fireEvent.click(within(workspaces).getByRole('button', { name: 'Structure' }));
    expect(screen.getByRole('heading', { name: 'Structure' })).toBeVisible();
    expect(screen.getByText(/will be introduced only by its authorized product program/i)).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Save$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Export Markdown/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create unit/i })).not.toBeInTheDocument();
    expect(document.querySelector('[data-stage19-role="command"]')).toHaveAttribute(
      'data-primary-scroll-container',
      'true',
    );
  });

  it.each([
    [
      'decision-required',
      'clean',
      [],
      'Recovery decision required in Writing Studio',
    ],
    [
      'accepted-pending-save',
      'dirty',
      ['unit_a'],
      'Recovered work is unsaved and pending normal Save',
    ],
    [
      'degraded',
      'clean',
      [],
      'Recovery evidence is degraded or unavailable',
    ],
  ] as const)(
    'renders prose-free Command recovery status %s',
    async (recovery, saveState, dirtyUnitIds, label) => {
      const current = snapshot('command', {
        dirtyUnitIds: [...dirtyUnitIds],
        saveState: { status: saveState, unitId: dirtyUnitIds[0] ?? null, message: null },
        commandStatus: {
          recovery,
          save: recovery === 'accepted-pending-save'
            ? 'accepted-recovery-pending-save'
            : saveState,
        },
      });
      const harness = createBridge(current);
      render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

      expect((await screen.findAllByText(label)).length).toBeGreaterThan(0);
      expect(screen.queryByText('Recovered full prose')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Recover this prose/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Reject/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Save$/i })).not.toBeInTheDocument();
    },
  );

  it.each([
    ['dirty', ['unit_a'], '1 unsaved unit'],
    ['saving', ['unit_a'], 'Saving…'],
    ['saved', [], 'Saved durably'],
    ['save-failed', ['unit_a'], 'Save failed in Writing Studio'],
  ] as const)('renders authoritative Command Save status %s', async (save, dirtyUnitIds, label) => {
    const current = snapshot('command', {
      dirtyUnitIds: [...dirtyUnitIds],
      saveState: {
        status: save,
        unitId: dirtyUnitIds[0] ?? null,
        message: save === 'save-failed' ? 'Sensitive durable path detail' : null,
      },
      lastError: save === 'save-failed'
        ? { code: 'SAVE_FAILED', message: 'Sensitive durable path detail' }
        : null,
      commandStatus: { save },
    });
    const harness = createBridge(current);
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

    expect((await screen.findAllByText(label)).length).toBeGreaterThan(0);
    expect(screen.queryByText('Sensitive durable path detail')).not.toBeInTheDocument();
  });

  it('keeps accepted recovery visible while giving Save failure precedence', async () => {
    const current = snapshot('command', {
      dirtyUnitIds: ['unit_a'],
      saveState: { status: 'save-failed', unitId: 'unit_a', message: 'Private path detail' },
      lastError: { code: 'SAVE_FAILED', message: 'Private path detail' },
      commandStatus: { recovery: 'accepted-pending-save', save: 'save-failed' },
    });
    const harness = createBridge(current);
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

    expect((await screen.findAllByText('Save failed in Writing Studio')).length).toBeGreaterThan(0);
    expect(screen.getByText('Recovered work is unsaved and pending normal Save')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Durable Save failed in Writing Studio');
    expect(screen.queryByText('Private path detail')).not.toBeInTheDocument();
  });

  it('renders no-project status without a saved claim', async () => {
    const active = snapshot('command');
    const noProject: ProjectSpineSessionSnapshot = {
      ...active,
      project: null,
      activeUnitId: null,
      commandStatus: {
        ...active.commandStatus!,
        projectId: null,
        lifecycle: 'operation-failed',
      },
      lastError: { code: 'PROJECT_INVALID', message: 'Private project failure detail' },
    };
    const harness = createBridge(noProject);
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

    expect(await screen.findByRole('heading', { name: 'No project open' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Begin in Writing Studio' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('No active project');
    expect(screen.queryByText('Saved durably')).not.toBeInTheDocument();
  });

  it('replaces Project A recovery status on switch and rejects stale snapshots', async () => {
    const projectA = snapshot('command', {
      generation: 2,
      revision: 5,
      dirtyUnitIds: ['unit_a'],
      saveState: { status: 'dirty', unitId: 'unit_a', message: null },
      commandStatus: {
        recovery: 'accepted-pending-save',
        save: 'accepted-recovery-pending-save',
      },
    });
    const harness = createBridge(projectA);
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);
    expect((await screen.findAllByText('Recovered work is unsaved and pending normal Save')).length)
      .toBeGreaterThan(0);

    const projectB = snapshot('command', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      title: 'Project B',
      generation: 3,
      revision: 2,
    });
    act(() => harness.emit(projectB));
    expect(await screen.findByRole('heading', { name: 'Project B' })).toBeVisible();
    expect(screen.getByText('No recovery action required')).toBeVisible();

    act(() => harness.emit({
      ...projectA,
      revision: 99,
      commandStatus: { ...projectA.commandStatus!, revision: 99 },
    }));
    act(() => harness.emit(snapshot('command', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      title: 'Project B',
      generation: 3,
      revision: 1,
      commandStatus: { recovery: 'degraded' },
    })));
    expect(screen.getByRole('heading', { name: 'Project B' })).toBeVisible();
    expect(screen.getByText('No recovery action required')).toBeVisible();
    expect(screen.queryByText('Recovery evidence is degraded or unavailable')).not.toBeInTheDocument();
  });

  it('renders failed and unavailable Command status without claiming saved truth', async () => {
    const failed = snapshot('command', {
      lastError: { code: 'PROJECT_INVALID', message: 'Sensitive project detail' },
      commandStatus: { lifecycle: 'operation-failed' },
    });
    const failedHarness = createBridge(failed);
    const { unmount } = render(
      <Stage19WritingSpineApp windowRole="command" bridge={failedHarness.bridge} />,
    );
    expect(await screen.findByText('Project operation failed')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A Writing Studio project operation failed. Current project identity is preserved.',
    );
    expect(screen.queryByText('Sensitive project detail')).not.toBeInTheDocument();
    unmount();

    const unavailableHarness = createBridge(snapshot('command'));
    vi.mocked(unavailableHarness.bridge.getSession).mockRejectedValueOnce(
      new Error('authoritative bridge unavailable'),
    );
    render(<Stage19WritingSpineApp windowRole="command" bridge={unavailableHarness.bridge} />);
    expect(await screen.findByRole('status')).toHaveTextContent('Status unavailable');
    expect(screen.getByRole('heading', { name: 'Project status unavailable' })).toBeVisible();
    expect(screen.queryByText('Saved durably')).not.toBeInTheDocument();

    act(() => unavailableHarness.emit(snapshot('command', { generation: 2, revision: 1 })));
    expect(await screen.findByRole('heading', { name: 'Project A' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Saved durably');
    expect(screen.queryByText('Project status unavailable')).not.toBeInTheDocument();
  });

  it('ignores an older initial-read failure after a valid subscription snapshot arrives', async () => {
    const harness = createBridge(snapshot('command'));
    let rejectInitialRead!: (reason: Error) => void;
    const initialRead = new Promise<ProjectSpineSessionSnapshot>((_resolve, reject) => {
      rejectInitialRead = reject;
    });
    vi.mocked(harness.bridge.getSession).mockReturnValueOnce(initialRead);
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

    act(() => harness.emit(snapshot('command', { generation: 2, revision: 1 })));
    expect(await screen.findByRole('heading', { name: 'Project A' })).toBeVisible();

    await act(async () => {
      rejectInitialRead(new Error('obsolete initial read failure'));
      await initialRead.catch(() => undefined);
    });
    await waitFor(() => {
      expect(screen.queryByText('Project status unavailable')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved durably');
  });

  it('fails closed when the initial Command snapshot lacks authoritative status', async () => {
    const initial = snapshot('command');
    const harness = createBridge(initial);
    vi.mocked(harness.bridge.getSession).mockResolvedValueOnce({
      ...initial,
      commandStatus: undefined,
    });
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

    expect(await screen.findByRole('heading', { name: 'Project status unavailable' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Status unavailable');
    expect(screen.queryByText('Saved durably')).not.toBeInTheDocument();
  });

  it('renders Writing Studio as the only prose-editing and structural authority', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    expect(await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' })).toHaveValue('Alpha body');
    expect(screen.queryByText(/id: unit_a/)).not.toBeInTheDocument();
    await openWritingRail('story tools');
    expect(screen.getByRole('button', { name: 'Add to story here' })).toBeVisible();
    expect(screen.getByLabelText('More story actions')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create unit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Update title' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move down' })).not.toBeInTheDocument();
    expect(await findExportButton()).toBeEnabled();
    expect(document.querySelector('[data-stage19-role="writing"]')).toHaveAttribute(
      'data-primary-scroll-container',
      'true',
    );
  });

  it('keeps a directly writable manuscript at the center while every support family starts closed', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const studio = await screen.findByRole('region', { name: 'Writing Studio' });
    const editor = screen.getByRole('textbox', { name: 'Manuscript editor: First Unit' });
    expect(studio).toHaveAttribute('data-stage19-writing-rail', 'closed');
    expect(editor).toBeEnabled();
    for (const label of ['project tools', 'story tools', 'writing support', 'session tools'] as const) {
      expect(screen.getByRole('button', { name: `Open ${label}` })).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.queryByLabelText('Project tools')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Story tools')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Writing support')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Writing session tools')).not.toBeInTheDocument();
  });

  it('opens one edge family at a time without replacing the editor or its selection', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' }) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'Alpha body with a selected phrase' } });
    editor.setSelectionRange(16, 24);
    const expectedSelection = { start: editor.selectionStart, end: editor.selectionEnd };
    const rails = [
      ['project tools', 'Project tools'],
      ['story tools', 'Story tools'],
      ['writing support', 'Writing support'],
      ['session tools', 'Writing session tools'],
    ] as const;

    for (const [controlLabel, panelLabel] of rails) {
      await openWritingRail(controlLabel);
      expect(screen.getByLabelText(panelLabel)).toBeVisible();
      expect(screen.getByRole('textbox', { name: 'Manuscript editor: First Unit' })).toBe(editor);
      expect(editor).toHaveValue('Alpha body with a selected phrase');
      expect({ start: editor.selectionStart, end: editor.selectionEnd }).toEqual(expectedSelection);

      fireEvent.click(screen.getByRole('button', { name: /^Close$/ }));
      const edgeControl = await screen.findByRole('button', { name: `Open ${controlLabel}` });
      await waitFor(() => expect(edgeControl).toHaveFocus());
      expect(screen.queryByLabelText(panelLabel)).not.toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Manuscript editor: First Unit' })).toBe(editor);
    }
  });

  it('binds a clean Markdown export to the exact project revision and reports completion', async () => {
    const current = snapshot('writing', { revision: 7 });
    const harness = createBridge(current);
    vi.mocked(harness.bridge.exportMarkdown!).mockResolvedValueOnce({
      ok: true,
      data: {
        status: 'completed',
        projectId: 'proj_a',
        generation: 1,
        revision: 7,
        operationId: 'export-operation',
        destinationPath: 'C:\\exports\\Project A.md',
        byteLength: 321,
        unitCount: 2,
        sha256: 'a'.repeat(64),
        orderedUnitIds: ['unit_a', 'unit_b'],
        sourceSnapshotFingerprint: 'b'.repeat(64),
        completedAt: '2026-07-26T20:00:00.000Z',
      },
      snapshot: current,
    });
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const exportButton = await findExportButton();
    await act(async () => {
      await userEvent.click(exportButton);
    });

    expect(harness.bridge.exportMarkdown).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 'proj_a',
      projectPath: 'C:\\projects\\a',
      generation: 1,
      revision: 7,
      operationId: expect.stringMatching(/^export-markdown:/),
    }));
    expect(await screen.findByText(/Export complete: C:\\exports\\Project A\.md \(321 bytes, 2 units\)\./))
      .toBeVisible();
  });

  it.each([
    {
      name: 'dirty',
      options: {
        dirtyUnitIds: ['unit_a'],
        saveState: { status: 'dirty' as const, unitId: 'unit_a', message: null },
      },
    },
    {
      name: 'saving',
      options: {
        saveState: { status: 'saving' as const, unitId: 'unit_a', message: null },
      },
    },
    {
      name: 'save-failed',
      options: {
        saveState: { status: 'save-failed' as const, unitId: 'unit_a', message: 'failed' },
      },
    },
    {
      name: 'recovery decision',
      options: {
        recovery: {
          status: 'decision-required' as const,
          candidates: [recoveryCandidate('unit_a', 'Recovered prose')],
        },
      },
    },
    {
      name: 'accepted recovery awaiting Save',
      options: {
        recovery: {
          status: 'accepted-pending-save' as const,
          candidates: [recoveryCandidate('unit_a', 'Recovered prose', 'accepted-pending-save')],
        },
      },
    },
    {
      name: 'degraded recovery',
      options: {
        recovery: {
          status: 'degraded' as const,
          reason: 'read-failed' as const,
          message: 'Recovery evidence could not be read.',
          candidates: [],
        },
      },
    },
  ] satisfies ReadonlyArray<{
    name: string;
    options: NonNullable<Parameters<typeof snapshot>[1]>;
  }>)('blocks Markdown export for $name state with the governed remedy', async ({ options }) => {
    const harness = createBridge(snapshot('writing', options));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    expect(await findExportButton()).toBeDisabled();
    expect(screen.getByText('Save the project successfully before exporting.')).toBeVisible();
    expect(harness.bridge.exportMarkdown).not.toHaveBeenCalled();
  });

  it('treats Save-dialog cancellation as a neutral no-op', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const exportButton = await findExportButton();
    await act(async () => {
      await userEvent.click(exportButton);
    });

    expect(await screen.findByText(/Export cancelled\. No file was created\./)).toBeVisible();
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
  });

  it('discards delayed export completion after an authoritative project switch', async () => {
    const projectA = snapshot('writing');
    const harness = createBridge(projectA);
    let resolveExport: ((result: ProjectSpineResult<ExportMarkdownResultData>) => void) | null = null;
    vi.mocked(harness.bridge.exportMarkdown!).mockImplementationOnce(
      () => new Promise<ProjectSpineResult<ExportMarkdownResultData>>((resolve) => {
        resolveExport = resolve;
      }),
    );
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const exportButton = await findExportButton();
    await act(async () => {
      await userEvent.click(exportButton);
    });
    act(() => harness.emit(snapshot('writing', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      title: 'Project B',
      generation: 2,
      revision: 1,
    })));
    await screen.findByRole('heading', { name: 'Project B' });

    await act(async () => {
      resolveExport!({
        ok: true,
        data: {
          status: 'completed',
          projectId: 'proj_a',
          generation: 1,
          revision: 1,
          operationId: 'export-a',
          destinationPath: 'C:\\exports\\Project A.md',
          byteLength: 111,
          unitCount: 2,
          sha256: 'a'.repeat(64),
          orderedUnitIds: ['unit_a', 'unit_b'],
          sourceSnapshotFingerprint: 'b'.repeat(64),
          completedAt: '2026-07-26T20:00:00.000Z',
        },
        snapshot: projectA,
      });
      await Promise.resolve();
    });

    expect(screen.queryByText(/Markdown export for Project A/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project B' })).toBeVisible();
  });

  it('retires a prior export cancellation when switching projects and keeps the next export independent', async () => {
    const projectA = snapshot('writing');
    const projectB = snapshot('writing', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      title: 'Project B',
      generation: 2,
      revision: 3,
    });
    const harness = createBridge(projectA);
    vi.mocked(harness.bridge.exportMarkdown!)
      .mockResolvedValueOnce({
        ok: true,
        data: {
          status: 'cancelled',
          projectId: 'proj_a',
          generation: 1,
          revision: 1,
          operationId: 'export-a-cancelled',
        },
        snapshot: projectA,
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          status: 'completed',
          projectId: 'proj_b',
          generation: 2,
          revision: 3,
          operationId: 'export-b-completed',
          destinationPath: 'C:\\exports\\Project B.md',
          byteLength: 222,
          unitCount: 2,
          sha256: 'c'.repeat(64),
          orderedUnitIds: ['unit_a', 'unit_b'],
          sourceSnapshotFingerprint: 'd'.repeat(64),
          completedAt: '2026-07-30T05:00:00.000Z',
        },
        snapshot: projectB,
      });
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const projectAExportButton = await findExportButton();
    await act(async () => {
      await userEvent.click(projectAExportButton);
    });
    expect(screen.getByText(/Markdown export for Project A/)).toBeVisible();
    expect(screen.getByText(/Export cancelled\. No file was created\./)).toBeVisible();

    act(() => harness.emit(projectB));
    expect(await screen.findByRole('heading', { name: 'Project B' })).toBeVisible();
    expect(screen.getByText('Saved durably')).toBeVisible();
    expect(await findExportButton()).toBeEnabled();
    expect(screen.queryByText(/Markdown export for Project A/)).not.toBeInTheDocument();

    await act(async () => {
      await userEvent.click(await findExportButton());
    });
    expect(harness.bridge.exportMarkdown).toHaveBeenLastCalledWith(expect.objectContaining({
      projectId: 'proj_b',
      projectPath: 'C:\\projects\\b',
      generation: 2,
      revision: 3,
    }));
    expect(await screen.findByText(/Markdown export for Project B/)).toBeVisible();
    expect(screen.queryByText(/Markdown export for Project A/)).not.toBeInTheDocument();
  });

  it('discards a delayed export failure after an authoritative project switch', async () => {
    const projectA = snapshot('writing');
    const harness = createBridge(projectA);
    let resolveExport: ((result: ProjectSpineResult<ExportMarkdownResultData>) => void) | null = null;
    vi.mocked(harness.bridge.exportMarkdown!).mockImplementationOnce(
      () => new Promise<ProjectSpineResult<ExportMarkdownResultData>>((resolve) => {
        resolveExport = resolve;
      }),
    );
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const exportButton = await findExportButton();
    await act(async () => {
      await userEvent.click(exportButton);
    });
    act(() => harness.emit(snapshot('writing', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      title: 'Project B',
      generation: 2,
    })));
    await screen.findByRole('heading', { name: 'Project B' });

    await act(async () => {
      resolveExport!({
        ok: false,
        error: { code: 'EXPORT_FAILED', message: 'Project A export failed.' },
        snapshot: projectA,
      });
      await Promise.resolve();
    });

    expect(screen.queryByText(/Project A export failed\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Markdown export for Project A/)).not.toBeInTheDocument();
  });

  it('keeps an export notice through a same-project revision', async () => {
    const projectA = snapshot('writing');
    const harness = createBridge(projectA);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const exportButton = await findExportButton();
    await act(async () => {
      await userEvent.click(exportButton);
    });
    expect(await screen.findByText(/Markdown export for Project A/)).toBeVisible();

    act(() => harness.emit(snapshot('writing', { revision: 2 })));
    expect(screen.getByText(/Markdown export for Project A/)).toBeVisible();
  });

  it('does not resurrect an old export after switching away and back to the same project', async () => {
    const projectA = snapshot('writing');
    const projectB = snapshot('writing', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      title: 'Project B',
      generation: 2,
    });
    const returnedProjectA = snapshot('writing', { generation: 3, revision: 1 });
    const harness = createBridge(projectA);
    let resolveExport: ((result: ProjectSpineResult<ExportMarkdownResultData>) => void) | null = null;
    vi.mocked(harness.bridge.exportMarkdown!).mockImplementationOnce(
      () => new Promise<ProjectSpineResult<ExportMarkdownResultData>>((resolve) => {
        resolveExport = resolve;
      }),
    );
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const exportButton = await findExportButton();
    await act(async () => {
      await userEvent.click(exportButton);
    });
    act(() => harness.emit(projectB));
    await screen.findByRole('heading', { name: 'Project B' });
    act(() => harness.emit(returnedProjectA));
    await screen.findByRole('heading', { name: 'Project A' });

    await act(async () => {
      resolveExport!({
        ok: true,
        data: {
          status: 'cancelled',
          projectId: 'proj_a',
          generation: 1,
          revision: 1,
          operationId: 'export-a-cancelled',
        },
        snapshot: projectA,
      });
      await Promise.resolve();
    });

    expect(screen.queryByText(/Markdown export for Project A/)).not.toBeInTheDocument();
  });

  it('blocks editing while showing full prior-session prose and sends exact recovery decisions', async () => {
    const current = snapshot('writing', {
      recovery: {
        status: 'decision-required',
        candidates: [
          recoveryCandidate('unit_a', 'Recovered full prose'),
          recoveryCandidate('unit_b', ''),
        ],
      },
    });
    const harness = createBridge(current);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    expect(await screen.findByText('Recovered full prose')).toBeVisible();
    expect(screen.getByText('(Empty manuscript prose)')).toBeVisible();
    expect(screen.getByLabelText('Manuscript editor: First Unit')).toHaveAttribute('readonly');
    await openWritingRail('story tools');
    await userEvent.click(screen.getByLabelText('More story actions'));
    expect(screen.getByRole('button', { name: 'Start a new written section' })).toBeDisabled();
    await act(async () => {
      await userEvent.click(screen.getAllByRole('button', { name: 'Recover this prose' })[0]);
    });
    expect(harness.bridge.acceptRecoveryCandidate).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 'proj_a',
      projectPath: 'C:\\projects\\a',
      generation: 1,
      unitId: 'unit_a',
      originSessionId: 'origin-prior',
      candidateVersion: 1,
      durableBaselineFingerprint: 'a'.repeat(64),
    }));
  });

  it('ignores a delayed recovery decision completion after a project generation transition', async () => {
    const current = snapshot('writing', {
      recovery: {
        status: 'decision-required',
        candidates: [recoveryCandidate('unit_a', 'Project A recovery')],
      },
    });
    const harness = createBridge(current);
    let resolveOldDecision:
      | ((result: ProjectSpineResult<RecoveryCandidateDecisionResultData>) => void)
      | null = null;
    vi.mocked(harness.bridge.acceptRecoveryCandidate!).mockImplementationOnce(
      () => new Promise<ProjectSpineResult<RecoveryCandidateDecisionResultData>>((resolve) => {
        resolveOldDecision = resolve;
      }),
    );
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const recoverButton = await screen.findByRole('button', { name: 'Recover this prose' });
    await act(async () => {
      await userEvent.click(recoverButton);
    });
    const nextProject = snapshot('writing', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      title: 'Project B',
      generation: 2,
      revision: 2,
      recovery: {
        status: 'decision-required',
        candidates: [{
          ...recoveryCandidate('unit_a', 'Project B recovery'),
          projectId: 'proj_b',
          projectPath: 'C:\\projects\\b',
        }],
      },
    });
    act(() => harness.emit(nextProject));
    expect(await screen.findByRole('heading', { name: 'Project B' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Recover this prose' })).toBeEnabled();

    await act(async () => {
      resolveOldDecision!({
        ok: false,
        error: { code: 'RECOVERY_WRITE_FAILED', message: 'Old decision failed.' },
        snapshot: current,
      });
      await Promise.resolve();
    });
    expect(screen.queryByText('Old decision failed.')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project B' })).toBeVisible();
    expect(screen.getByText('Project B recovery')).toBeVisible();
  });

  it('applies accepted prose once and preserves a newer local edit across later snapshots', async () => {
    const accepted = snapshot('writing', {
      recovery: {
        status: 'accepted-pending-save',
        candidates: [recoveryCandidate('unit_a', 'Recovered prose', 'accepted-pending-save')],
      },
    });
    const harness = createBridge(accepted);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByLabelText('Manuscript editor: First Unit');
    expect(editor).toHaveValue('Recovered prose');

    await act(async () => {
      fireEvent.change(editor, { target: { value: 'Newer local prose' } });
      harness.emit(snapshot('writing', {
        revision: 2,
        recovery: {
          status: 'accepted-pending-save',
          candidates: [{
            ...recoveryCandidate('unit_a', 'Older completed checkpoint', 'accepted-pending-save'),
            candidateVersion: 2,
          }],
        },
      }));
      await Promise.resolve();
    });
    expect(screen.getByLabelText('Manuscript editor: First Unit')).toHaveValue('Newer local prose');
  });

  it('routes contextual create, inline rename, and advanced delete through Writing-only bindings', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await openWritingRail('story tools');

    await user.click(screen.getByLabelText('More story actions'));
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Start a new written section' }));
    });
    expect(harness.bridge.createUnit).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_a',
        generation: 1,
        title: '',
      }),
    );

    await user.dblClick(screen.getByRole('button', { name: '01 First Unit' }));
    const titleInput = screen.getByLabelText('Title for First Unit');
    const titleForm = titleInput.closest('form');
    expect(titleForm).not.toBeNull();
    await act(async () => {
      await user.clear(titleInput);
      await user.type(titleInput, 'Renamed Unit');
      await user.click(within(titleForm as HTMLFormElement).getByRole('button', { name: 'Save' }));
    });
    expect(harness.bridge.renameUnit).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'unit_a', title: 'Renamed Unit' }),
    );

    expect(screen.queryByRole('button', { name: 'Move down' })).not.toBeInTheDocument();
    expect(harness.bridge.reorderUnits).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'More options for written section First Unit' }));
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Delete written section/ }));
    });
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(harness.bridge.deleteUnit).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'unit_a', confirmNonEmpty: true }),
    );
    confirm.mockRestore();
  });

  it('contains structural and lifecycle transport failures without losing the current project', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    vi.mocked(harness.bridge.createUnit!).mockRejectedValueOnce(new Error('transport unavailable'));
    vi.mocked(harness.bridge.chooseDirectory).mockResolvedValueOnce({
      canceled: false,
      path: 'C:\\projects\\b',
    });
    vi.mocked(harness.bridge.openProject).mockRejectedValueOnce(new Error('transport unavailable'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await openWritingRail('story tools');

    await user.click(screen.getByLabelText('More story actions'));
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Start a new written section' }));
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The manuscript unit could not be created',
    );
    expect(screen.getByRole('heading', { name: 'Project A' })).toBeVisible();
    await openWritingRail('project tools');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Open project…' }));
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The project operation could not reach the application service',
    );
    expect(screen.getByRole('heading', { name: 'Project A' })).toBeVisible();
  });

  it('contains dirty-status transport failure while keeping the local prose visible', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    vi.mocked(harness.bridge.setUnitDirty!).mockRejectedValueOnce(new Error('transport unavailable'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.type(editor, ' protected local prose');
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Recovery protection remains active',
    );
    expect((editor as HTMLTextAreaElement).value).toContain('protected local prose');
  });

  it('keeps unsaved prose isolated by unit while navigating', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const firstEditor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.click(firstEditor);
      await user.type(firstEditor, ' changed');
    });
    await waitFor(() => expect(harness.bridge.setUnitDirty).toHaveBeenCalled());
    await openWritingRail('story tools');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /02\s+Untitled/i }));
    });
    expect(await screen.findByRole('textbox', { name: 'Manuscript editor: Untitled' })).toHaveValue('Beta body');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /01\s+First Unit/i }));
    });
    await waitFor(() => {
      const value = (screen.getByRole('textbox', {
        name: 'Manuscript editor: First Unit',
      }) as HTMLTextAreaElement).value;
      expect(value).toMatch(/changed.*Alpha body|Alpha body.*changed/s);
    });
  });

  it('coalesces prose checkpoints for 750 ms and preserves empty content', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    vi.useFakeTimers();

    fireEvent.change(editor, { target: { value: 'First' } });
    fireEvent.change(editor, { target: { value: 'Second' } });
    fireEvent.change(editor, { target: { value: '' } });
    await act(async () => { vi.advanceTimersByTime(749); });
    expect(harness.bridge.captureRecoveryCheckpoint).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(harness.bridge.captureRecoveryCheckpoint).toHaveBeenCalledTimes(1);
    expect(harness.bridge.captureRecoveryCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_a',
        generation: 1,
        unitId: 'unit_a',
        prose: '',
      }),
    );
  });

  it('force-flushes the submitted buffer before Save', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    fireEvent.change(editor, { target: { value: 'Flush before save' } });
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));

    await waitFor(() => expect(harness.bridge.saveUnit).toHaveBeenCalledTimes(1));
    expect(harness.bridge.captureRecoveryCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({ prose: 'Flush before save', unitId: 'unit_a' }),
    );
    expect(vi.mocked(harness.bridge.captureRecoveryCheckpoint!).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(harness.bridge.saveUnit!).mock.invocationCallOrder[0]);
  });

  it('does not start Save when the forced recovery checkpoint fails', async () => {
    const harness = createBridge(snapshot('writing'));
    vi.mocked(harness.bridge.captureRecoveryCheckpoint!).mockResolvedValue({
      ok: false,
      error: { code: 'RECOVERY_WRITE_FAILED', message: 'Checkpoint storage is unavailable.' },
      snapshot: harness.current,
    });
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    fireEvent.change(editor, { target: { value: 'Keep this prose live' } });
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));

    await waitFor(() => expect(harness.bridge.captureRecoveryCheckpoint).toHaveBeenCalledTimes(1));
    expect(harness.bridge.saveUnit).not.toHaveBeenCalled();
    expect(editor).toHaveValue('Keep this prose live');
    expect(await screen.findByText('1 unsaved unit')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Checkpoint storage is unavailable');
  });

  it('force-flushes pending prose before submitting a guarded-close decision', async () => {
    const harness = createBridge(snapshot('writing'), { closeConfirmations: true });
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    fireEvent.change(editor, { target: { value: 'Final prose before close' } });
    act(() => harness.emitCloseConfirmation({
      correlationId: 'checkpoint-before-close',
      projectId: 'proj_a',
      generation: 1,
    }));
    await screen.findByRole('dialog', { name: 'Unsaved manuscript changes' });
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    await waitFor(() => expect(harness.bridge.respondToCloseConfirmation).toHaveBeenCalledTimes(1));
    expect(harness.bridge.captureRecoveryCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({ prose: 'Final prose before close' }),
    );
    expect(vi.mocked(harness.bridge.captureRecoveryCheckpoint!).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(harness.bridge.respondToCloseConfirmation!).mock.invocationCallOrder[0]);
  });

  it('preserves dirty prose after checkpoint failure and retries on a later edit', async () => {
    const harness = createBridge(snapshot('writing'));
    vi.mocked(harness.bridge.captureRecoveryCheckpoint!)
      .mockResolvedValueOnce({
        ok: false,
        error: { code: 'RECOVERY_WRITE_FAILED', message: 'The checkpoint could not be stored.' },
        snapshot: harness.current,
      })
      .mockResolvedValue({
        ok: true,
        data: { status: 'stored', candidateVersion: 2 },
        snapshot: harness.current,
      });
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    vi.useFakeTimers();

    fireEvent.change(editor, { target: { value: 'Still live after failure' } });
    await act(async () => {
      vi.advanceTimersByTime(750);
      await Promise.resolve();
    });
    expect(editor).toHaveValue('Still live after failure');
    expect(screen.getByRole('alert')).toHaveTextContent('Recovery protection is unavailable');

    fireEvent.change(editor, { target: { value: 'Retry this prose' } });
    await act(async () => {
      vi.advanceTimersByTime(750);
      await Promise.resolve();
    });
    expect(harness.bridge.captureRecoveryCheckpoint).toHaveBeenCalledTimes(2);
    expect(editor).toHaveValue('Retry this prose');
  });

  it('submits a later edit after an earlier in-flight checkpoint fails', async () => {
    const harness = createBridge(snapshot('writing'));
    let failEarlierCheckpoint!: (result: ProjectSpineResult<{
      status: 'stored' | 'cleared';
      candidateVersion: number | null;
    }>) => void;
    vi.mocked(harness.bridge.captureRecoveryCheckpoint!)
      .mockImplementationOnce(() => new Promise((resolve) => {
        failEarlierCheckpoint = resolve;
      }))
      .mockResolvedValue({
        ok: true,
        data: { status: 'stored', candidateVersion: 2 },
        snapshot: harness.current,
      });
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    vi.useFakeTimers();

    fireEvent.change(editor, { target: { value: 'Earlier in flight' } });
    await act(async () => {
      vi.advanceTimersByTime(750);
      await Promise.resolve();
    });
    fireEvent.change(editor, { target: { value: 'Newest pending prose' } });
    await act(async () => {
      vi.advanceTimersByTime(750);
      failEarlierCheckpoint({
        ok: false,
        error: { code: 'RECOVERY_WRITE_FAILED', message: 'Earlier checkpoint failed.' },
        snapshot: harness.current,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(harness.bridge.captureRecoveryCheckpoint).toHaveBeenCalledTimes(2);
    expect(harness.bridge.captureRecoveryCheckpoint).toHaveBeenLastCalledWith(
      expect.objectContaining({ prose: 'Newest pending prose', unitId: 'unit_a' }),
    );
    expect(editor).toHaveValue('Newest pending prose');
  });

  it('cancels pending checkpoints when the authoritative project generation changes', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    vi.useFakeTimers();
    fireEvent.change(editor, { target: { value: 'Project A pending prose' } });
    act(() => harness.emit(snapshot('writing', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      generation: 2,
      units: [{ id: 'unit_b', title: 'Project B Unit', order: 1, body: 'B durable' }],
    })));
    await act(async () => {
      vi.advanceTimersByTime(750);
      await Promise.resolve();
    });

    expect(harness.bridge.captureRecoveryCheckpoint).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Manuscript editor: Project B Unit' })).toHaveValue('B durable');
  });

  it('routes Ctrl+S through the generation-bound durable save contract', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.click(editor);
      await user.type(editor, ' saved text');
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    });

    await waitFor(() => expect(harness.bridge.saveUnit).toHaveBeenCalledTimes(1));
    expect(vi.mocked(harness.bridge.saveUnit!)).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_a',
        projectPath: 'C:\\projects\\a',
        generation: 1,
        unitId: 'unit_a',
        expectedMarkdown: expect.stringContaining('Alpha body'),
        markdown: expect.stringMatching(/saved text.*Alpha body|Alpha body.*saved text/s),
      }),
    );
    expect(await screen.findByText('Saved durably')).toBeVisible();
  });

  it('does not duplicate an editor-owned Ctrl+S save at window scope', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    fireEvent.change(editor, { target: { value: 'redone prose' } });
    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

    await waitFor(() => expect(harness.bridge.saveUnit).toHaveBeenCalledTimes(1));
    expect(vi.mocked(harness.bridge.saveUnit!)).toHaveBeenCalledWith(
      expect.objectContaining({
        unitId: 'unit_a',
        markdown: expect.stringContaining('redone prose'),
      }),
    );
    expect(await screen.findByText('Saved durably')).toBeVisible();
  });

  it('waits for rapid dirty-state changes to settle before saving redone prose', async () => {
    const harness = createBridge(snapshot('writing'));
    const releases: Array<() => void> = [];
    vi.mocked(harness.bridge.setUnitDirty!).mockImplementation((request) =>
      new Promise((resolve) => {
        releases.push(() => resolve({
          ok: true,
          data: {},
          snapshot: {
            ...harness.current,
            revision: harness.current.revision + releases.length,
            dirtyUnitIds: request.dirty ? [request.unitId] : [],
            saveState: request.dirty
              ? { status: 'dirty', unitId: request.unitId, message: null }
              : { status: 'clean', unitId: null, message: null },
          },
        }));
      }),
    );
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    fireEvent.change(editor, { target: { value: 'redone prose' } });
    fireEvent.change(editor, { target: { value: 'Alpha body' } });
    fireEvent.change(editor, { target: { value: 'redone prose' } });
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    await waitFor(() => expect(harness.bridge.setUnitDirty).toHaveBeenCalledTimes(1));
    expect(harness.bridge.saveUnit).not.toHaveBeenCalled();
    await act(async () => releases.shift()?.());
    await waitFor(() => expect(harness.bridge.setUnitDirty).toHaveBeenCalledTimes(2));
    expect(harness.bridge.saveUnit).not.toHaveBeenCalled();
    await act(async () => releases.shift()?.());
    await waitFor(() => expect(harness.bridge.setUnitDirty).toHaveBeenCalledTimes(3));
    expect(harness.bridge.saveUnit).not.toHaveBeenCalled();
    await act(async () => releases.shift()?.());

    await waitFor(() => expect(harness.bridge.saveUnit).toHaveBeenCalledTimes(1));
    expect(vi.mocked(harness.bridge.saveUnit!)).toHaveBeenCalledWith(
      expect.objectContaining({
        unitId: 'unit_a',
        markdown: expect.stringContaining('redone prose'),
      }),
    );
  });

  it('preserves an authored terminal line break separately from durable file framing', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.click(editor);
      await user.type(editor, '{enter}');
      await user.click(screen.getByRole('button', { name: /^Save$/ }));
    });

    await waitFor(() => expect(harness.bridge.saveUnit).toHaveBeenCalledTimes(1));
    const request = vi.mocked(harness.bridge.saveUnit!).mock.calls[0][0];
    expect(request.markdown).toMatch(/Alpha body\n\n$/);
    expect(request.expectedMarkdown).toMatch(/Alpha body\n$/);
  });

  it('applies the authoritative dirty and saved result immediately in Writing Studio', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await act(async () => {
      await user.type(editor, ' immediate state');
    });
    expect(await screen.findByText('1 unsaved unit')).toBeVisible();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save' }));
    });
    expect(await screen.findByText('Saved durably')).toBeVisible();
    expect(harness.current.dirtyUnitIds).toEqual([]);
  });

  it('retains editor content and dirty truth when durable save fails', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    vi.mocked(harness.bridge.saveUnit!).mockImplementation(async () => ({
      ok: false,
      error: { code: 'SAVE_FAILED', message: 'Disk is read-only.' },
      snapshot: {
        ...harness.current,
        dirtyUnitIds: ['unit_a'],
        saveState: { status: 'save-failed', unitId: 'unit_a', message: 'Disk is read-only.' },
      },
    }));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.click(editor);
      await user.type(editor, ' retained after failure');
      await user.click(screen.getByRole('button', { name: /^Save$/ }));
    });

    expect(await screen.findByText('1 unsaved unit')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Disk is read-only.');
    expect((screen.getByRole('textbox', {
      name: 'Manuscript editor: First Unit',
    }) as HTMLTextAreaElement).value).toContain('retained after failure');
  });

  it('preserves the checkpointed dirty buffer when Save transport rejects', async () => {
    const harness = createBridge(snapshot('writing'));
    vi.mocked(harness.bridge.saveUnit!).mockRejectedValueOnce(new Error('transport unavailable'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    fireEvent.change(editor, { target: { value: 'Transport-safe prose' } });
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));

    await waitFor(() => expect(harness.bridge.saveUnit).toHaveBeenCalledTimes(1));
    expect(harness.bridge.captureRecoveryCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({ prose: 'Transport-safe prose' }),
    );
    expect(editor).toHaveValue('Transport-safe prose');
    expect(await screen.findByText('1 unsaved unit')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('try Save again');
  });

  it('requires explicit discard confirmation before a dirty project switch', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    vi.mocked(harness.bridge.chooseDirectory).mockResolvedValue({
      canceled: false,
      path: 'C:\\projects\\b',
    });
    const projectB = snapshot('writing', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      title: 'Project B',
      generation: 2,
      units: [],
    });
    vi.mocked(harness.bridge.openProject).mockImplementation(async (request) =>
      request.discardUnsaved
        ? { ok: true, data: { activation: 'activated' }, snapshot: projectB }
        : {
            ok: false,
            error: { code: 'UNSAVED_CHANGES', message: 'Unsaved manuscript changes.' },
            snapshot: harness.current,
          },
    );
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    await openWritingRail('project tools');
    const openButton = await screen.findByRole('button', { name: 'Open project…' });

    await act(async () => {
      await user.click(openButton);
    });

    expect(screen.getByRole('dialog', { name: 'Unsaved manuscript changes' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(harness.bridge.openProject).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: 'C:\\projects\\b', discardUnsaved: false }),
    );
    expect(harness.bridge.openProject).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ path: 'C:\\projects\\b', discardUnsaved: true }),
    );
    expect(await screen.findByRole('heading', { name: 'Project B' })).toBeVisible();
  });

  it('restores Writing Studio focus when a dirty project switch is cancelled', async () => {
    const harness = createBridge(snapshot('writing', {
      dirtyUnitIds: ['unit_a'],
      saveState: { status: 'dirty', unitId: 'unit_a', message: null },
    }));
    vi.mocked(harness.bridge.chooseDirectory).mockResolvedValue({
      canceled: false,
      path: 'C:\\projects\\b',
    });
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await openWritingRail('project tools');
    fireEvent.click(await screen.findByRole('button', { name: /Open project/ }));

    const continueEditing = await screen.findByRole('button', { name: 'Continue editing' });
    expect(continueEditing).toHaveFocus();
    fireEvent.click(continueEditing);
    await waitFor(() => expect(document.activeElement).toBe(editor));
    expect(harness.bridge.openProject).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Project switch cancelled');
  });

  it('clears project-bound buffers when a new project generation arrives', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await act(async () => {
      await user.click(editor);
      await user.type(editor, ' Project A only');
    });

    await act(async () => {
      harness.emit(
        snapshot('writing', {
          projectId: 'proj_b',
          path: 'C:\\projects\\b',
          title: 'Project B',
          generation: 2,
          units: [{ id: 'unit_b1', title: 'B Unit', order: 1, body: 'Project B prose' }],
        }),
      );
    });

    expect(await screen.findByRole('heading', { name: 'Project B' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Manuscript editor: B Unit' })).toHaveValue('Project B prose');
    expect(screen.getByRole('textbox', { name: 'Manuscript editor: B Unit' })).not.toHaveValue(
      expect.stringContaining('Project A only'),
    );
  });

  it('prevents unload while local edits remain unsaved', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await act(async () => {
      await user.click(editor);
      await user.type(editor, ' unsaved');
    });

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('projects every written section as one stream and preserves unsaved prose while moving through it', async () => {
    const project = createBridge(snapshot('writing'));
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} />);

    const stream = await screen.findByLabelText('Continuous manuscript');
    expect(within(stream).getByText('Beta body')).toBeVisible();
    const firstEditor = screen.getByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await user.type(firstEditor, ' still here');
    await user.click(within(stream).getByRole('button', { name: 'Write in Untitled' }));

    expect(await screen.findByRole('textbox', { name: 'Manuscript editor: Untitled' })).toHaveValue('Beta body');
    expect(within(stream).getByRole('button', { name: 'Write in First Unit' })).toHaveTextContent('Alpha body still here');
    await user.click(within(stream).getByRole('button', { name: 'Write in First Unit' }));
    expect(await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' })).toHaveValue('Alpha body still here');
  });

  it('keeps a substantial synthetic manuscript visible with only one live editor', async () => {
    const units = Array.from({ length: 100 }, (_, index) => ({
      id: `unit_${index + 1}`,
      title: `Section ${index + 1}`,
      order: index + 1,
      body: `Synthetic paragraph ${index + 1}. `.repeat(40),
    }));
    const project = createBridge(snapshot('writing', { units }));
    const startedAt = performance.now();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} />);

    const stream = await screen.findByLabelText('Continuous manuscript');
    expect(within(stream).getAllByRole('region', { name: /Written section/ })).toHaveLength(100);
    expect(screen.getAllByRole('textbox', { name: /Manuscript editor:/ })).toHaveLength(1);
    expect(within(stream).getByText(/Synthetic paragraph 100/)).toBeVisible();
    expect(performance.now() - startedAt).toBeLessThan(3_000);
  });

  it('supports outline-first planning with quiet gaps and no manufactured manuscript unit', async () => {
    const project = createBridge(snapshot('writing', { units: [], activeUnitId: null }));
    const outline = createLivingOutlineBridge();
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} livingOutlineBridge={outline.bridge} />);

    await openWritingRail('story tools');
    expect(await screen.findByRole('complementary', { name: 'Story rail' })).toBeVisible();
    expect(screen.getByText(/new story points remain Not placed yet/i)).toBeVisible();
    expect(screen.queryByLabelText('Structural meaning')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Source state')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add to story here' }));
    const title = await screen.findByRole('textbox', { name: 'Title for New story point' });
    await user.clear(title);
    await user.type(title, 'What happens between the signal and arrival?');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'More options for What happens between the signal and arrival?' }));
    await user.selectOptions(screen.getByLabelText('Structural meaning'), 'gap');
    await user.click(screen.getByRole('button', { name: 'Save options' }));
    await user.click(within(screen.getByRole('region', { name: 'More options for What happens between the signal and arrival?' })).getByRole('button', { name: 'Close' }));

    expect(outline.bridge.createItem).toHaveBeenCalledWith(expect.objectContaining({
      label: 'New story point',
      kind: 'fragment',
      state: 'planned',
      manuscriptUnitId: null,
    }));
    expect(outline.bridge.updateItem).toHaveBeenLastCalledWith(expect.objectContaining({
      label: 'What happens between the signal and arrival?',
      kind: 'gap',
      state: 'planned',
    }));
    expect(await screen.findByRole('button', { name: 'What happens between the signal and arrival?' })).toBeVisible();
    expect(screen.getByText('Something goes here')).toBeVisible();
    expect(screen.getAllByText('Not placed yet').length).toBeGreaterThan(0);
    expect(project.bridge.createUnit).not.toHaveBeenCalled();
    expect(screen.queryByText(/warning|alarm/i)).not.toBeInTheDocument();
  });

  it('uses selected prose as quiet advisory outline context without mandatory setup fields', async () => {
    const project = createBridge(snapshot('writing'));
    const outline = createLivingOutlineBridge();
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} livingOutlineBridge={outline.bridge} />);

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' }) as HTMLTextAreaElement;
    editor.setSelectionRange(0, 10);
    fireEvent.select(editor);
    await openWritingRail('story tools');
    expect(screen.getByText('Selected passage in First Unit')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Add to story here' }));

    expect(outline.bridge.createItem).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Alpha body',
      kind: 'fragment',
      state: 'proposed',
      manuscriptUnitId: 'unit_a',
    }));
    expect(await screen.findByRole('textbox', { name: 'Title for Alpha body' })).toHaveFocus();
    expect(screen.getByText('Suggested')).toBeVisible();
    expect(screen.getByText('Belongs with: First Unit')).toBeVisible();
    expect(screen.queryByLabelText('Structural meaning')).not.toBeInTheDocument();
  });

  it('saves a prose-free span anchor and returns a Story Rail point to its exact passage', async () => {
    const project = createBridge(snapshot('writing'));
    const outline = createLivingOutlineBridge();
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} livingOutlineBridge={outline.bridge} />);

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' }) as HTMLTextAreaElement;
    editor.setSelectionRange(0, 5);
    fireEvent.select(editor);
    await openWritingRail('story tools');
    await user.click(screen.getByRole('button', { name: 'Add to story here' }));
    const request = vi.mocked(outline.bridge.createItem).mock.calls[0]?.[0];
    expect(request?.sourceAnchor).toMatchObject({
      anchorKind: 'span', unitId: 'unit_a', selectionStart: 0, selectionEnd: 5,
    });
    expect(JSON.stringify(request?.sourceAnchor)).not.toContain('Alpha');

    await user.click(await screen.findByRole('button', { name: 'Show Alpha in manuscript' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Manuscript editor: First Unit' })).toHaveAttribute('data-selection-restore', '0:5'));
  });

  it('locates linked writing from either side and previews planning movement without reordering manuscript units', async () => {
    const project = createBridge(snapshot('writing'));
    const outline = createLivingOutlineBridge([
      {
        id: 'outline-a', label: 'Opening', kind: 'fragment', state: 'authored', manuscriptUnitId: 'unit_a',
        createdAt: '2026-08-09T12:00:00.000Z', updatedAt: '2026-08-09T12:00:00.000Z',
      },
      {
        id: 'outline-b', label: 'Uncertain turn', kind: 'gap', state: 'proposed', manuscriptUnitId: 'unit_b',
        createdAt: '2026-08-09T12:00:00.000Z', updatedAt: '2026-08-09T12:00:00.000Z',
      },
    ]);
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} livingOutlineBridge={outline.bridge} />);

    await openWritingRail('story tools');
    const opening = await screen.findByRole('button', { name: 'Show Opening in manuscript' });
    const openingRow = opening.closest('.stage19-living-outline__row');
    await waitFor(() => expect(openingRow).toHaveClass('is-writing-linked'));
    const turn = screen.getByRole('button', { name: 'Show Uncertain turn in manuscript' });
    const turnRow = turn.closest('.stage19-living-outline__row');
    await user.click(turn);
    await waitFor(() => expect(project.bridge.selectUnit).toHaveBeenCalledWith(expect.objectContaining({ unitId: 'unit_b' })));
    expect(await screen.findByRole('textbox', { name: 'Manuscript editor: Untitled' })).toHaveValue('Beta body');
    expect(turnRow).toHaveClass('is-writing-linked');

    await user.click(screen.getByRole('button', { name: /^01 First Unit$/ }));
    await waitFor(() => expect(openingRow).toHaveClass('is-active'));
    fireEvent.contextMenu(turn.closest('li') as HTMLLIElement);
    const advanced = screen.getByRole('region', { name: 'More options for Uncertain turn' });
    expect(advanced).toBeVisible();
    await user.click(within(advanced).getByRole('button', { name: 'Move up' }));
    expect(await screen.findByText('Planning order saved. Accepted manuscript order was not changed.')).toBeVisible();
    expect(project.bridge.reorderUnits).not.toHaveBeenCalled();
    await user.click(screen.getByText('Compare the story plan with the manuscript'));
    const preview = screen.getByText('Preview only. Moving this plan never moves your written pages.');
    expect(preview).toBeVisible();
  });

  it('reorders the planning sidecar from the keyboard without moving accepted manuscript units', async () => {
    const project = createBridge(snapshot('writing'));
    const outline = createLivingOutlineBridge([
      {
        id: 'outline-a', label: 'Opening', kind: 'fragment', state: 'authored', manuscriptUnitId: 'unit_a',
        createdAt: '2026-08-09T12:00:00.000Z', updatedAt: '2026-08-09T12:00:00.000Z',
      },
      {
        id: 'outline-b', label: 'Turn', kind: 'fragment', state: 'planned', manuscriptUnitId: 'unit_b',
        createdAt: '2026-08-09T12:00:00.000Z', updatedAt: '2026-08-09T12:00:00.000Z',
      },
    ]);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} livingOutlineBridge={outline.bridge} />);

    await openWritingRail('story tools');
    const turnPosition = await screen.findByRole('button', { name: 'Show Turn in manuscript' });
    fireEvent.keyDown(turnPosition, { key: 'ArrowUp', altKey: true });

    await waitFor(() => expect(outline.bridge.moveItem).toHaveBeenCalledWith(expect.objectContaining({
      itemId: 'outline-b',
      direction: -1,
    })));
    expect(project.bridge.reorderUnits).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Show Turn in manuscript' })).toBeVisible();
  });

  it('places a story point under another written section by direct drop without reordering prose', async () => {
    const project = createBridge(snapshot('writing'));
    const outline = createLivingOutlineBridge([
      {
        id: 'outline-a', label: 'Opening', kind: 'fragment', state: 'authored', manuscriptUnitId: 'unit_a',
        createdAt: '2026-08-09T12:00:00.000Z', updatedAt: '2026-08-09T12:00:00.000Z',
      },
    ]);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} livingOutlineBridge={outline.bridge} />);

    await openWritingRail('story tools');
    const storyPoint = await screen.findByRole('button', { name: 'Show Opening in manuscript' });
    const storyPointItem = storyPoint.closest('li') as HTMLLIElement;
    const targetSection = screen.getByRole('button', { name: '02 Untitled' }).closest('li') as HTMLLIElement;
    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      getData: (type: string) => type === 'application/x-black-skies-outline-item' ? 'outline-a' : '',
      setData: vi.fn(),
    };

    fireEvent.dragStart(storyPointItem, { dataTransfer });
    fireEvent.dragOver(targetSection, { dataTransfer });
    fireEvent.drop(targetSection, { dataTransfer });

    await waitFor(() => expect(outline.bridge.linkItem).toHaveBeenCalledWith(expect.objectContaining({
      itemId: 'outline-a',
      manuscriptUnitId: 'unit_b',
    })));
    expect(project.bridge.reorderUnits).not.toHaveBeenCalled();
    expect(project.bridge.saveUnit).not.toHaveBeenCalled();
  });

  it('keeps manuscript editing available when the optional outline is malformed', async () => {
    const project = createBridge(snapshot('writing'));
    const outline = createLivingOutlineBridge();
    vi.mocked(outline.bridge.get).mockResolvedValueOnce({
      ok: true,
      data: {
        availability: 'degraded',
        document: { schemaVersion: 'BlackSkiesLivingOutline v1', projectId: 'proj_a', revision: 0, items: [] },
        message: 'The story plan file has an unsupported format. Writing remains available.',
      },
    });
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} livingOutlineBridge={outline.bridge} />);

    await openWritingRail('story tools');
    expect(await screen.findByText('The story plan file has an unsupported format. Writing remains available.')).toBeVisible();
    const editor = screen.getByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await user.type(editor, ' still editable');
    expect(editor).toHaveValue('Alpha body still editable');
  });

  it('hides every support pane in one-click Focus mode without stealing editor state', async () => {
    const project = createBridge(snapshot('writing'));
    const outline = createLivingOutlineBridge();
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} livingOutlineBridge={outline.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await user.type(editor, ' focused words');
    await openWritingRail('story tools');

    const focus = screen.getByRole('button', { name: 'Enter Focus mode' });
    await user.click(focus);
    expect(screen.queryByRole('complementary', { name: 'Story rail' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Selected prose AI critique' })).not.toBeInTheDocument();
    expect(editor).toHaveValue('Alpha body focused words');
    expect(screen.getByRole('button', { name: 'Exit Focus mode' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Exit Focus mode' }));
    expect(await screen.findByRole('complementary', { name: 'Story rail' })).toBeVisible();
    expect(editor).toHaveValue('Alpha body focused words');
  });

  it('keeps reopened advisory Feedback Notes out of the Writing canvas', async () => {
    const project = createBridge(snapshot('writing', { generation: 7 }));
    const feedbackNotes: FeedbackNotesBridge = {
      createFromCritique: vi.fn(),
      list: vi.fn(async () => ({
        ok: true as const,
        data: [{
          id: 'feedback-reopened', projectId: 'proj_a', unitId: 'unit_a',
          sourceCritiqueRequestId: 'critique-prior-session', selectionFingerprint: 'f'.repeat(64),
          createdAt: '2026-08-09T12:00:00.000Z', advisory: true as const,
          body: 'Reconsider whether the signal arrives too early.',
        }],
      })),
    };
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} feedbackNotesBridge={feedbackNotes} />);

    await openWritingRail('writing support');
    await waitFor(() => expect(feedbackNotes.list).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 'proj_a', projectPath: 'C:\\projects\\a', generation: 7,
    })));
    expect(screen.queryByRole('region', { name: 'Saved advisory Feedback Notes' })).not.toBeInTheDocument();
    expect(screen.queryByText('Reconsider whether the signal arrives too early.')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Manuscript editor: First Unit' })).toHaveValue('Alpha body');
  });

  it('requires exact selection preview, session credential, clearance, and explicit approval', async () => {
    const prose = `${'The rain marked time against the station glass while Mara waited for a train that did not arrive. '.repeat(4)}End.`;
    const project = createBridge(snapshot('writing', {
      units: [{ id: 'unit_a', title: 'AI Boundary', order: 1, body: prose }],
    }));
    const ai = createAiBridge(prose);
    const user = userEvent.setup();
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} aiBridge={ai.bridge} />);

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: AI Boundary' });
    (editor as HTMLTextAreaElement).setSelectionRange(0, (editor as HTMLTextAreaElement).value.length);
    fireEvent.select(editor);
    await openWritingRail('writing support');
    expect(screen.getByRole('button', { name: 'Review outbound critique request' })).toBeEnabled();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Review outbound critique request' }));
    });

    expect(await screen.findByRole('heading', { name: 'Exact outbound preview' })).toBeVisible();
    expect(screen.getByText('gpt-5.4-2026-03-05')).toBeVisible();
    expect(screen.getByText('2026-07-14')).toBeVisible();
    expect(screen.getByLabelText('Exact selected prose to transmit')).toHaveValue(prose);
    expect(ai.bridge.prepare).toHaveBeenCalledWith(expect.objectContaining({
      selection: expect.objectContaining({
        projectId: 'proj_a',
        unitId: 'unit_a',
        selectedText: prose,
        sourceFingerprint: 'a'.repeat(64),
        selectionFingerprint: 'b'.repeat(64),
      }),
    }));

    const keyInput = screen.getByLabelText('OpenAI API key (session only; no readback)');
    await act(async () => {
      await user.type(keyInput, 'synthetic-session-credential-123456');
      await user.click(screen.getByRole('button', { name: 'Set session key' }));
    });
    expect(keyInput).toHaveValue('');
    expect(ai.bridge.setCredential).toHaveBeenCalledWith('synthetic-session-credential-123456');

    const approve = screen.getByRole('button', { name: 'Approve and send exact payload' });
    expect(approve).toBeDisabled();
    await act(async () => {
      await user.click(screen.getByLabelText('Confirm exact prose is cleared for remote transmission.'));
    });
    expect(approve).toBeEnabled();
    await act(async () => {
      await user.click(approve);
    });
    expect(ai.bridge.approveAndExecute).toHaveBeenCalledWith(expect.objectContaining({
      requestId: 'ai-request-1',
      payloadHash: 'c'.repeat(64),
      transmissionConfirmed: true,
      authorizationCeilingUsd: 0.1,
    }));
    expect(screen.queryByRole('button', { name: /apply|insert|rewrite|copy to editor/i })).not.toBeInTheDocument();
  });

  it.each([
    ['failed', 'The deterministic critique fixture failed.'],
    ['cancelled', null],
    ['expired', 'The approved preview expired.'],
  ] as const)('shows and dismisses an honest %s critique state', async (status, message) => {
    const prose = `${'The rain marked time against the station glass while Mara waited. '.repeat(5)}End.`;
    const project = createBridge(snapshot('writing', {
      units: [{ id: 'unit_a', title: 'Terminal state', order: 1, body: prose }],
    }));
    const ai = createAiBridge(prose);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} aiBridge={ai.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: Terminal state' });
    (editor as HTMLTextAreaElement).setSelectionRange(0, prose.length);
    fireEvent.select(editor);
    await openWritingRail('writing support');
    fireEvent.click(screen.getByRole('button', { name: 'Review outbound critique request' }));
    await screen.findByRole('heading', { name: 'Exact outbound preview' });

    act(() => ai.emit({
      requestId: 'ai-request-1',
      status,
      ...(message ? { error: { code: status === 'failed' ? 'PROVIDER_ERROR' : 'REQUEST_EXPIRED', message } } : {}),
    } as AiCritiqueState));
    if (message) expect(screen.getByText(message)).toBeVisible();
    const dismiss = screen.getByRole('button', { name: 'Dismiss critique status' });
    fireEvent.click(dismiss);
    expect(screen.queryByRole('button', { name: 'Dismiss critique status' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Manuscript editor: Terminal state' })).toHaveValue(prose);
  });

  it('keeps completed Command Review actions advisory and failure-honest', async () => {
    const project = createBridge(snapshot('command'));
    const review = createCritiqueReviewBridge(completedReviewState(), {
      saveFailure: 'The advisory note could not be written.',
    });
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('clipboard unavailable')) },
    });
    render(
      <Stage19WritingSpineApp
        windowRole="command"
        bridge={project.bridge}
        critiqueReviewBridge={review.bridge}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Critique ready for your review' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Advisory critique result' })).toHaveTextContent(
      'The passage sustains a controlled temporal unease.',
    );
    expect(screen.getByText(/These actions cannot accept text into the manuscript/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Copy result' }));
    expect(await screen.findByText('Could not copy the critique. Select and copy the text manually.')).toBeVisible();
    await user.type(screen.getByLabelText('Save only the concise advisory note you choose'), 'Keep the temporal unease.');
    await user.click(screen.getByRole('button', { name: 'Save advisory note' }));
    expect(await screen.findByText('The advisory note could not be written.')).toBeVisible();
    expect(project.bridge.saveUnit).toBeUndefined();
    expect(project.bridge.reorderUnits).toBeUndefined();
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(await screen.findByRole('heading', { name: 'Nothing is waiting for a decision' })).toBeVisible();
    expect(review.bridge.dismiss).toHaveBeenCalledTimes(1);
  });

  it('copies visible Review text and saves only an author-selected advisory note', async () => {
    const project = createBridge(snapshot('command'));
    const review = createCritiqueReviewBridge(completedReviewState());
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    render(
      <Stage19WritingSpineApp
        windowRole="command"
        bridge={project.bridge}
        critiqueReviewBridge={review.bridge}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Critique ready for your review' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Copy result' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('The passage sustains a controlled temporal unease.'));
    expect(await screen.findByText('Critique copied. This copy is temporary and does not alter the manuscript.')).toBeVisible();

    await user.type(screen.getByLabelText('Save only the concise advisory note you choose'), 'Keep the temporal unease.');
    await user.click(screen.getByRole('button', { name: 'Save advisory note' }));
    await waitFor(() => expect(review.bridge.saveFeedbackNote).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 'proj_a',
      unitId: 'unit_a',
      sourceCritiqueRequestId: 'ai-request-1',
      body: 'Keep the temporal unease.',
    })));
    expect(await screen.findByText('Advisory project note saved. It is separate from manuscript and outline files.')).toBeVisible();
    expect(project.bridge.saveUnit).toBeUndefined();
    expect(project.bridge.reorderUnits).toBeUndefined();
  });

  it.each([
    ['failed', 'provider-unavailable'],
    ['cancelled', 'request-cancelled'],
    ['expired', 'request-expired'],
    ['invalidated', 'source-changed'],
  ] as const)('renders a bounded %s Command Review state', async (lifecycleState, failureClass) => {
    const project = createBridge(snapshot('command'));
    const review = createCritiqueReviewBridge(completedReviewState({
      lifecycleState,
      failureClass,
      resultText: undefined,
      completedAt: undefined,
      limitationText: 'No advisory result is available for this request.',
      allowedActions: ['dismiss', 'return-to-source'],
    }));
    render(
      <Stage19WritingSpineApp
        windowRole="command"
        bridge={project.bridge}
        critiqueReviewBridge={review.bridge}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Critique did not complete' })).toBeVisible();
    expect(screen.getByRole('heading', { name: failureClass.replace(/-/g, ' ') })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Advisory critique result' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy result' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save advisory note' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeVisible();
  });

  it('marks a main-owned same-unit Review stale after Writing changes', async () => {
    const prose = `${'A narrow beam crossed the empty hall while the clock repeated the same minute. '.repeat(5)}End.`;
    const project = createBridge(snapshot('writing', {
      units: [{ id: 'unit_a', title: 'Staleness', order: 1, body: prose }],
    }));
    const surfaces = createSurfaceBridge(snapshot('command'));
    const review = createCritiqueReviewBridge();
    render(
      <Stage19WritingSpineApp
        windowRole="writing"
        bridge={project.bridge}
        surfaceBridge={surfaces.bridge}
        critiqueReviewBridge={review.bridge}
      />,
    );
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: Staleness' });
    act(() => review.publish(completedReviewState({ sourceLabel: 'Staleness' })));
    expect(await screen.findByRole('heading', { name: 'Critique ready for your review' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Return to Writing Studio' }));
    const restoredEditor = await screen.findByRole('textbox', { name: 'Manuscript editor: Staleness' });
    fireEvent.change(restoredEditor, { target: { value: `${prose}\nChanged.` } });
    await waitFor(() => expect(review.bridge.markStale).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Open Command Center here' }));
    expect(await screen.findByText('Source changed')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Critique did not complete' })).toBeVisible();
    expect(screen.queryByText('The passage sustains a controlled temporal unease.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save advisory note' })).not.toBeInTheDocument();
    expect(editor).not.toBeVisible();
  });

  it('visibly invalidates a prepared approval when the selected range changes', async () => {
    const prose = `${'A narrow beam crossed the empty hall while the clock repeated the same minute. '.repeat(5)}End.`;
    const project = createBridge(snapshot('writing', {
      units: [{ id: 'unit_a', title: 'Selection binding', order: 1, body: prose }],
    }));
    const ai = createAiBridge(`${prose}\n`);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} aiBridge={ai.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: Selection binding' });
    (editor as HTMLTextAreaElement).setSelectionRange(0, (editor as HTMLTextAreaElement).value.length);
    fireEvent.select(editor);
    await openWritingRail('writing support');
    fireEvent.click(screen.getByRole('button', { name: 'Review outbound critique request' }));
    expect(await screen.findByRole('heading', { name: 'Exact outbound preview' })).toBeVisible();

    (editor as HTMLTextAreaElement).setSelectionRange(10, (editor as HTMLTextAreaElement).value.length);
    fireEvent.select(editor);

    expect(screen.queryByRole('heading', { name: 'Exact outbound preview' })).not.toBeInTheDocument();
    expect(screen.getByText('Selection changed. Review a new outbound critique request.')).toBeVisible();
    expect(ai.bridge.invalidate).toHaveBeenCalledWith({
      requestId: 'ai-request-1',
      operationId: expect.stringMatching(/^ai-critique:/),
    });
  });

  it('never renders an AI surface in Command Center even if a bridge is supplied', async () => {
    const project = createBridge(snapshot('command'));
    const ai = createAiBridge('x'.repeat(300));
    render(<Stage19WritingSpineApp windowRole="command" bridge={project.bridge} aiBridge={ai.bridge} />);
    expect(await screen.findByRole('region', { name: 'Command Center' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Selected prose AI critique' })).not.toBeInTheDocument();
    expect(ai.bridge.credentialStatus).not.toHaveBeenCalled();
  });
});
