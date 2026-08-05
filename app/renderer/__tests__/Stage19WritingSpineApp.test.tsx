import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
import Stage19WritingSpineApp, {
  deriveDirtyUnitIds,
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

describe('Stage19WritingSpineApp', () => {
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

  it('renders a role-projected Command Center with no prose or structural mutation controls', async () => {
    const harness = createBridge(snapshot('command'));
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

    expect(await screen.findByRole('heading', { name: 'Project A' })).toBeVisible();
    expect(screen.getByText('proj_a')).toBeVisible();
    expect(screen.getByRole('button', { name: /First Unit/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Untitled/i })).toBeVisible();
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

    expect(await screen.findByRole('heading', { name: 'No active project' })).toBeVisible();
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
    expect(screen.getByRole('button', { name: 'Create unit' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Update title' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete unit…' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Export Markdown…' })).toBeEnabled();
    expect(document.querySelector('[data-stage19-role="writing"]')).toHaveAttribute(
      'data-primary-scroll-container',
      'true',
    );
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

    const exportButton = await screen.findByRole('button', { name: 'Export Markdown…' });
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

    expect(await screen.findByRole('button', { name: 'Export Markdown…' })).toBeDisabled();
    expect(screen.getByText('Save the project successfully before exporting.')).toBeVisible();
    expect(harness.bridge.exportMarkdown).not.toHaveBeenCalled();
  });

  it('treats Save-dialog cancellation as a neutral no-op', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const exportButton = await screen.findByRole('button', { name: 'Export Markdown…' });
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

    const exportButton = await screen.findByRole('button', { name: 'Export Markdown…' });
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

    const projectAExportButton = await screen.findByRole('button', { name: 'Export Markdown…' });
    await act(async () => {
      await userEvent.click(projectAExportButton);
    });
    expect(screen.getByText(/Markdown export for Project A/)).toBeVisible();
    expect(screen.getByText(/Export cancelled\. No file was created\./)).toBeVisible();

    act(() => harness.emit(projectB));
    expect(await screen.findByRole('heading', { name: 'Project B' })).toBeVisible();
    expect(screen.getByText('Saved durably')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Export Markdown…' })).toBeEnabled();
    expect(screen.queryByText(/Markdown export for Project A/)).not.toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Export Markdown…' }));
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

    const exportButton = await screen.findByRole('button', { name: 'Export Markdown…' });
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

    const exportButton = await screen.findByRole('button', { name: 'Export Markdown…' });
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

    const exportButton = await screen.findByRole('button', { name: 'Export Markdown…' });
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
    expect(screen.getByRole('button', { name: 'Create unit' })).toBeDisabled();
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

  it('routes create, title, reorder, and delete actions through Writing-only bindings', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Create unit' }));
    });
    expect(harness.bridge.createUnit).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_a',
        generation: 1,
        title: '',
      }),
    );

    const titleInput = screen.getByLabelText('Selected unit title');
    await act(async () => {
      await user.clear(titleInput);
      await user.type(titleInput, 'Renamed Unit');
      await user.click(screen.getByRole('button', { name: 'Update title' }));
    });
    expect(harness.bridge.renameUnit).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'unit_a', title: 'Renamed Unit' }),
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Move down' }));
    });
    expect(harness.bridge.reorderUnits).toHaveBeenCalledWith(
      expect.objectContaining({ orderedUnitIds: ['unit_b', 'unit_a'] }),
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Delete unit…' }));
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

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Create unit' }));
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The manuscript unit could not be created',
    );
    expect(screen.getByRole('heading', { name: 'Project A' })).toBeVisible();

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
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const focus = vi.spyOn(window, 'focus').mockImplementation(() => undefined);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const openButton = await screen.findByRole('button', { name: 'Open project…' });

    await act(async () => {
      await user.click(openButton);
    });

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(harness.bridge.openProject).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: 'C:\\projects\\b', discardUnsaved: false }),
    );
    expect(harness.bridge.openProject).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ path: 'C:\\projects\\b', discardUnsaved: true }),
    );
    expect(await screen.findByRole('heading', { name: 'Project B' })).toBeVisible();
    await waitFor(() => expect(focus).toHaveBeenCalledTimes(2));
    confirm.mockRestore();
    focus.mockRestore();
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
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const focus = vi.spyOn(window, 'focus').mockImplementation(() => undefined);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    fireEvent.click(await screen.findByRole('button', { name: /Open project/ }));

    await waitFor(() => expect(focus).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(document.activeElement).toBe(editor));
    expect(harness.bridge.focusWritingWindow).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(harness.bridge.openProject).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Project switch cancelled');
    confirm.mockRestore();
    focus.mockRestore();
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

  it('keeps completed same-unit advice visible but unmistakably stale after editing', async () => {
    const prose = `${'A narrow beam crossed the empty hall while the clock repeated the same minute. '.repeat(5)}End.`;
    const project = createBridge(snapshot('writing', {
      units: [{ id: 'unit_a', title: 'Staleness', order: 1, body: prose }],
    }));
    const ai = createAiBridge(`${prose}\n`);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={project.bridge} aiBridge={ai.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: Staleness' });
    await act(async () => {
      (editor as HTMLTextAreaElement).setSelectionRange(0, (editor as HTMLTextAreaElement).value.length);
      fireEvent.select(editor);
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Review outbound critique request' }));
      await Promise.resolve();
    });
    await screen.findByRole('heading', { name: 'Exact outbound preview' });

    await act(async () => {
      ai.emit({
        requestId: 'ai-request-1',
        status: 'completed',
        result: {
          requestId: 'ai-request-1',
          provider: 'openai',
          model: 'gpt-5.4-2026-03-05',
          taskContractVersion: 'black_skies_critique_v2',
          sourceFingerprint: 'a'.repeat(64),
          selectionFingerprint: 'b'.repeat(64),
          editorRevision: 1,
          completedAt: '2026-07-14T12:00:00.000Z',
          content: {
            overview: 'The passage sustains a controlled temporal unease.',
            strengths: [],
            priorities: [],
            uncertainties: [],
            limitations: ['Selected passage only.'],
          },
          usage: {
            inputTokens: 100,
            cachedInputTokens: 0,
            outputTokens: 50,
            calculatedUsd: 0.001,
            invoiceDisclaimer: 'Calculated usage cost - not provider invoice.',
          },
        },
      });
      await Promise.resolve();
    });
    expect(screen.getByText('The passage sustains a controlled temporal unease.')).toBeVisible();
    await act(async () => {
      fireEvent.change(editor, { target: { value: `${prose}\nChanged.` } });
      await Promise.resolve();
    });
    expect(screen.getByText('Stale: the manuscript changed after this critique completed.')).toBeVisible();
    expect(screen.getByText('The passage sustains a controlled temporal unease.')).toBeVisible();
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
