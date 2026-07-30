import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type {
  ProjectSpineBridge,
  ProjectSpineCloseConfirmationRequest,
  ProjectSpineResult,
  ProjectSpineSessionSnapshot,
  ProjectSpineWindowRole,
} from '../../shared/ipc/projectSpine';
import { CloseConfirmationDialog, useCloseConfirmationRequest } from '../Stage19WritingSpineApp';

function snapshot(role: ProjectSpineWindowRole, projectId = 'proj_a', generation = 1): ProjectSpineSessionSnapshot {
  return {
    schemaVersion: 1, role, generation, revision: 1,
    project: {
      projectId, path: 'C:\\projects\\a', title: 'Project A', schemaVersion: 'ProjectMetadataSchema v1',
      units: [], ...(role === 'writing' ? { drafts: {} } : {}),
    },
    activeUnitId: null, recentProjects: [], dirtyUnitIds: [],
    saveState: { status: 'clean', unitId: null, message: null }, lastError: null,
  };
}

function bridgeHarness() {
  const listeners = new Set<(request: ProjectSpineCloseConfirmationRequest) => void>();
  const bridge = {
    windowRole: 'writing',
    onCloseConfirmationRequest: vi.fn((listener: (request: ProjectSpineCloseConfirmationRequest) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    respondToCloseConfirmation: vi.fn(async () => ({ ok: true, data: {}, snapshot: snapshot('writing') })),
  } as unknown as ProjectSpineBridge;
  return {
    bridge,
    emit: (request: ProjectSpineCloseConfirmationRequest) => listeners.forEach((listener) => listener(request)),
  };
}

let state: ReturnType<typeof useCloseConfirmationRequest>;

function Harness({ bridge, current, windowRole }: {
  bridge: ProjectSpineBridge; current: ProjectSpineSessionSnapshot; windowRole: ProjectSpineWindowRole;
}): JSX.Element {
  state = useCloseConfirmationRequest({
    bridge, windowRole, projectId: current.project?.projectId ?? null, generation: current.generation,
  });
  return <div />;
}

function dialogProps(overrides: Partial<ComponentProps<typeof CloseConfirmationDialog>> = {}) {
  return {
    windowRole: 'writing' as const,
    activeRequest: { correlationId: 'dialog', projectId: 'proj_a', generation: 1 },
    responseSubmitting: false,
    responseError: null,
    keepEditing: vi.fn(async () => {}),
    discardChanges: vi.fn(async () => {}),
    ...overrides,
  };
}

describe('Stage 19 close-confirmation renderer seam', () => {
  it('renders an accessible Writing Studio dialog and keeps Command Center passive', () => {
    const props = dialogProps();
    const { rerender } = render(<CloseConfirmationDialog {...props} />);
    const dialog = screen.getByRole('dialog', { name: 'Unsaved manuscript changes' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(
      /This project has manuscript changes that have not been saved/i,
    );
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    rerender(<CloseConfirmationDialog {...dialogProps({ windowRole: 'command' })} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps focus within the two actions and sends Keep editing for Escape', () => {
    const props = dialogProps();
    render(<CloseConfirmationDialog {...props} />);
    const keep = screen.getByRole('button', { name: 'Keep editing' });
    const discard = screen.getByRole('button', { name: 'Discard changes' });
    discard.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(keep).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(discard).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(props.keepEditing).toHaveBeenCalledTimes(1);
  });

  it('dispatches both decisions, disables actions while sending, reports failure, and restores focus', () => {
    const previous = document.createElement('button');
    document.body.appendChild(previous);
    previous.focus();
    const props = dialogProps();
    const { rerender } = render(<CloseConfirmationDialog {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(props.keepEditing).toHaveBeenCalledTimes(1);
    expect(props.discardChanges).toHaveBeenCalledTimes(1);

    rerender(<CloseConfirmationDialog {...dialogProps({ responseSubmitting: true })} />);
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(/Sending your choice/i);
    rerender(<CloseConfirmationDialog {...dialogProps({ responseError: 'request failed' })} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/could not send your choice/i);
    rerender(<CloseConfirmationDialog {...dialogProps({ activeRequest: null })} />);
    expect(previous).toHaveFocus();
    previous.remove();
  });

  it('subscribes only for Writing Studio and unsubscribes on unmount', () => {
    const writing = bridgeHarness();
    const { unmount } = render(<Harness bridge={writing.bridge} current={snapshot('writing')} windowRole="writing" />);
    expect(writing.bridge.onCloseConfirmationRequest).toHaveBeenCalledTimes(1);
    unmount();
    writing.emit({ correlationId: 'late', projectId: 'proj_a', generation: 1 });
    expect(state.activeRequest).toBeNull();

    const command = bridgeHarness();
    render(<Harness bridge={command.bridge} current={snapshot('command')} windowRole="command" />);
    expect(command.bridge.onCloseConfirmationRequest).not.toHaveBeenCalled();
  });

  it('retains one current-session request, ignores duplicates and stale requests, and replaces a current request', async () => {
    const harness = bridgeHarness();
    render(<Harness bridge={harness.bridge} current={snapshot('writing')} windowRole="writing" />);
    const first = { correlationId: 'one', projectId: 'proj_a', generation: 1 };
    act(() => harness.emit(first));
    await waitFor(() => expect(state.activeRequest).toEqual(first));
    act(() => harness.emit(first));
    act(() => harness.emit({ correlationId: 'wrong-project', projectId: 'proj_b', generation: 1 }));
    act(() => harness.emit({ correlationId: 'wrong-generation', projectId: 'proj_a', generation: 2 }));
    expect(state.activeRequest).toEqual(first);
    const replacement = { correlationId: 'two', projectId: 'proj_a', generation: 1 };
    act(() => harness.emit(replacement));
    await waitFor(() => expect(state.activeRequest).toEqual(replacement));
  });

  it.each([['keepEditing', 'keep-editing'], ['discardChanges', 'discard']] as const)(
    '%s sends its active correlated response and clears after success',
    async (callback, decision) => {
      const harness = bridgeHarness();
      render(<Harness bridge={harness.bridge} current={snapshot('writing')} windowRole="writing" />);
      const request = { correlationId: decision, projectId: 'proj_a', generation: 1 };
      act(() => harness.emit(request));
      await waitFor(() => expect(state.activeRequest).toEqual(request));
      await act(async () => state[callback]());
      expect(harness.bridge.respondToCloseConfirmation).toHaveBeenCalledWith({ ...request, decision });
      expect(state.activeRequest).toBeNull();
    },
  );

  it('prevents duplicate submission and preserves a failed response for retry', async () => {
    const harness = bridgeHarness();
    let resolve: ((value: ProjectSpineResult) => void) | undefined;
    vi.mocked(harness.bridge.respondToCloseConfirmation!).mockImplementation(
      () => new Promise((done) => { resolve = done; }),
    );
    render(<Harness bridge={harness.bridge} current={snapshot('writing')} windowRole="writing" />);
    const request = { correlationId: 'retry', projectId: 'proj_a', generation: 1 };
    act(() => harness.emit(request));
    await waitFor(() => expect(state.activeRequest).toEqual(request));
    let first: Promise<void>;
    act(() => { first = state.keepEditing(); });
    await waitFor(() => expect(state.responseSubmitting).toBe(true));
    await state.keepEditing();
    expect(harness.bridge.respondToCloseConfirmation).toHaveBeenCalledTimes(1);
    await act(async () => { resolve?.({ ok: true, data: {}, snapshot: snapshot('writing') }); await first!; });
    await waitFor(() => expect(state.activeRequest).toBeNull());

    vi.mocked(harness.bridge.respondToCloseConfirmation!).mockRejectedValueOnce(new Error('response unavailable'));
    act(() => harness.emit(request));
    await waitFor(() => expect(state.activeRequest).toEqual(request));
    await act(async () => state.discardChanges());
    expect(state.activeRequest).toEqual(request);
    expect(state.responseError).toBe('response unavailable');
  });
});
