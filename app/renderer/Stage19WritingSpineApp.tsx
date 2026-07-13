import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ProjectSpineCloseConfirmationDecision,
  ProjectSpineCloseConfirmationRequest,
  ProjectSpineBinding,
  ProjectSpineBridge,
  ProjectSpineResult,
  ProjectSpineSessionSnapshot,
  ProjectSpineWindowRole,
} from '../shared/ipc/projectSpine';
import DraftEditor from './DraftEditor';

interface DraftEnvelope {
  readonly header: string;
  readonly body: string;
}

function operationId(prefix: string): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `${prefix}:${suffix}`;
}

function splitDraft(markdown: string): DraftEnvelope {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== '---') {
    return { header: '', body: normalized };
  }
  const closingOffset = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (closingOffset < 0) {
    return { header: '', body: normalized };
  }
  const closingIndex = closingOffset + 1;
  return {
    header: `${lines.slice(0, closingIndex + 1).join('\n')}\n`,
    body: lines.slice(closingIndex + 1).join('\n'),
  };
}

function composeDraft(envelope: DraftEnvelope, body: string): string {
  const normalizedBody = body.replace(/\r\n/g, '\n');
  const bodyWithNewline = normalizedBody.endsWith('\n') ? normalizedBody : `${normalizedBody}\n`;
  return `${envelope.header}${bodyWithNewline}`;
}

function bindingFor(
  snapshot: ProjectSpineSessionSnapshot,
  prefix: string,
): ProjectSpineBinding | null {
  if (!snapshot.project) {
    return null;
  }
  return {
    projectId: snapshot.project.projectId,
    projectPath: snapshot.project.path,
    generation: snapshot.generation,
    operationId: operationId(prefix),
  };
}

function saveStatusLabel(snapshot: ProjectSpineSessionSnapshot): string {
  switch (snapshot.saveState.status) {
    case 'dirty':
      return `${snapshot.dirtyUnitIds.length} unsaved unit${snapshot.dirtyUnitIds.length === 1 ? '' : 's'}`;
    case 'saving':
      return 'Saving…';
    case 'saved':
      return 'Saved durably';
    case 'save-failed':
      return `Save failed${snapshot.saveState.message ? `: ${snapshot.saveState.message}` : ''}`;
    default:
      return snapshot.project ? 'Saved durably' : 'All changes saved';
  }
}

export function deriveDirtyUnitIds(
  snapshot: ProjectSpineSessionSnapshot,
  buffers: Readonly<Record<string, string>>,
): ReadonlySet<string> {
  const dirty = new Set(snapshot.dirtyUnitIds);
  const drafts = snapshot.project?.drafts;
  if (!drafts) return dirty;
  for (const unit of snapshot.project?.units ?? []) {
    const durable = splitDraft(drafts[unit.id] ?? '').body;
    if (Object.prototype.hasOwnProperty.call(buffers, unit.id) && buffers[unit.id] !== durable) {
      dirty.add(unit.id);
    } else if (Object.prototype.hasOwnProperty.call(buffers, unit.id)) {
      dirty.delete(unit.id);
    }
  }
  return dirty;
}

function saveSummaryLabel(snapshot: ProjectSpineSessionSnapshot, dirtyUnitIds: ReadonlySet<string>): string {
  if (dirtyUnitIds.size > 0 && snapshot.saveState.status !== 'saving') {
    return `${dirtyUnitIds.size} unsaved unit${dirtyUnitIds.size === 1 ? '' : 's'}`;
  }
  return saveStatusLabel(snapshot);
}

function emptySnapshot(role: ProjectSpineWindowRole): ProjectSpineSessionSnapshot {
  return {
    schemaVersion: 1,
    role,
    generation: 0,
    revision: 0,
    project: null,
    activeUnitId: null,
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'clean', unitId: null, message: null },
    lastError: null,
  };
}

function resultMessage(result: ProjectSpineResult<unknown>): string | null {
  return result.ok === false ? result.error.message : null;
}

interface CloseConfirmationRequestState {
  readonly activeRequest: ProjectSpineCloseConfirmationRequest | null;
  readonly responseSubmitting: boolean;
  readonly responseError: string | null;
  readonly keepEditing: () => Promise<void>;
  readonly discardChanges: () => Promise<void>;
}

interface CloseConfirmationDialogProps extends CloseConfirmationRequestState {
  readonly windowRole: ProjectSpineWindowRole;
}

export function CloseConfirmationDialog({
  windowRole,
  activeRequest,
  responseSubmitting,
  responseError,
  keepEditing,
  discardChanges,
}: CloseConfirmationDialogProps): JSX.Element | null {
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const discardChangesRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const keepEditingCallbackRef = useRef(keepEditing);
  const responseSubmittingRef = useRef(responseSubmitting);
  keepEditingCallbackRef.current = keepEditing;
  responseSubmittingRef.current = responseSubmitting;

  useEffect(() => {
    if (windowRole !== 'writing' || !activeRequest) {
      return;
    }
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    keepEditingRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (responseSubmittingRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        void keepEditingCallbackRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      event.preventDefault();
      (event.shiftKey ? discardChangesRef : keepEditingRef).current?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [activeRequest, windowRole]);

  if (windowRole !== 'writing' || !activeRequest) {
    return null;
  }

  return (
    <div className="stage19-close-confirmation" role="presentation">
      <div className="stage19-close-confirmation__backdrop" aria-hidden="true" />
      <section
        className="stage19-close-confirmation__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage19-close-confirmation-title"
        aria-describedby="stage19-close-confirmation-description"
      >
        <h2 id="stage19-close-confirmation-title">Unsaved manuscript changes</h2>
        <p id="stage19-close-confirmation-description">
          This project has manuscript changes that have not been saved. Keep editing to return to your work, or discard the unsaved changes and close Black Skies.
        </p>
        {responseError ? (
          <p className="stage19-close-confirmation__error" role="alert">
            We could not send your choice. Please try again.
          </p>
        ) : null}
        {responseSubmitting ? <p role="status">Sending your choice…</p> : null}
        <div className="stage19-close-confirmation__actions">
          <button
            ref={keepEditingRef}
            type="button"
            onClick={() => void keepEditing()}
            disabled={responseSubmitting}
          >
            Keep editing
          </button>
          <button
            ref={discardChangesRef}
            type="button"
            onClick={() => void discardChanges()}
            disabled={responseSubmitting}
          >
            Discard changes
          </button>
        </div>
      </section>
    </div>
  );
}

function sameCloseConfirmationRequest(
  left: ProjectSpineCloseConfirmationRequest,
  right: ProjectSpineCloseConfirmationRequest,
): boolean {
  return left.correlationId === right.correlationId &&
    left.projectId === right.projectId &&
    left.generation === right.generation;
}

/** Minimal Writing Studio close-request seam; B2 owns visual presentation. */
export function useCloseConfirmationRequest({
  windowRole,
  bridge,
  projectId,
  generation,
}: {
  readonly windowRole: ProjectSpineWindowRole;
  readonly bridge?: ProjectSpineBridge;
  readonly projectId: string | null;
  readonly generation: number;
}): CloseConfirmationRequestState {
  const [activeRequest, setActiveRequest] = useState<ProjectSpineCloseConfirmationRequest | null>(null);
  const [responseSubmitting, setResponseSubmitting] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const sessionRef = useRef({ projectId, generation });
  const activeRequestRef = useRef(activeRequest);
  const responseSubmittingRef = useRef(false);

  sessionRef.current = { projectId, generation };
  activeRequestRef.current = activeRequest;

  useEffect(() => {
    if (
      activeRequest &&
      (activeRequest.projectId !== projectId || activeRequest.generation !== generation)
    ) {
      setActiveRequest(null);
    }
  }, [activeRequest, generation, projectId]);

  useEffect(() => {
    if (windowRole !== 'writing' || !bridge?.onCloseConfirmationRequest) {
      return;
    }
    return bridge.onCloseConfirmationRequest((request) => {
      const session = sessionRef.current;
      if (request.projectId !== session.projectId || request.generation !== session.generation) {
        return;
      }
      const current = activeRequestRef.current;
      if (current && sameCloseConfirmationRequest(current, request)) {
        return;
      }
      setResponseError(null);
      setActiveRequest(request);
    });
  }, [bridge, windowRole]);

  const submitResponse = useCallback(async (decision: ProjectSpineCloseConfirmationDecision) => {
    const request = activeRequestRef.current;
    if (!request || responseSubmittingRef.current || !bridge?.respondToCloseConfirmation) {
      return;
    }
    responseSubmittingRef.current = true;
    setResponseSubmitting(true);
    setResponseError(null);
    try {
      const result = await bridge.respondToCloseConfirmation({ ...request, decision });
      if (!result.ok) {
        setResponseError(result.error.message || 'We could not send your choice. Please try again.');
        return;
      }
      if (sameCloseConfirmationRequest(activeRequestRef.current ?? request, request)) {
        setActiveRequest(null);
      }
    } catch (error) {
      setResponseError(error instanceof Error ? error.message : String(error));
    } finally {
      responseSubmittingRef.current = false;
      setResponseSubmitting(false);
    }
  }, [bridge]);

  return {
    activeRequest,
    responseSubmitting,
    responseError,
    keepEditing: () => submitResponse('keep-editing'),
    discardChanges: () => submitResponse('discard'),
  };
}

export interface Stage19WritingSpineAppProps {
  readonly windowRole?: ProjectSpineWindowRole;
  readonly bridge?: ProjectSpineBridge;
}

export default function Stage19WritingSpineApp({
  windowRole = window.projectSpine?.windowRole ?? 'writing',
  bridge = window.projectSpine,
}: Stage19WritingSpineAppProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<ProjectSpineSessionSnapshot>(() => emptySnapshot(windowRole));
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [renameTitle, setRenameTitle] = useState('');
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const snapshotRef = useRef(snapshot);
  const buffersRef = useRef(buffers);
  const editRevisionRef = useRef<Record<string, number>>({});
  const reportedDirtyRef = useRef<Record<string, boolean>>({});
  const appliedGenerationRef = useRef(0);

  const closeConfirmation = useCloseConfirmationRequest({
    windowRole,
    bridge,
    projectId: snapshot.project?.projectId ?? null,
    generation: snapshot.generation,
  });

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    buffersRef.current = buffers;
  }, [buffers]);

  useEffect(() => {
    document.body.dataset.stage19Spine = windowRole;
    return () => {
      delete document.body.dataset.stage19Spine;
    };
  }, [windowRole]);

  const applySnapshot = useCallback((next: ProjectSpineSessionSnapshot) => {
    if (next.role !== windowRole) {
      return;
    }
    const previousSnapshot = snapshotRef.current;
    if (
      next.generation < previousSnapshot.generation ||
      (next.generation === previousSnapshot.generation && next.revision < previousSnapshot.revision)
    ) {
      return;
    }
    const generationChanged = next.generation !== previousSnapshot.generation;
    appliedGenerationRef.current = next.generation;
    setSnapshot(next);
    snapshotRef.current = next;
    if (windowRole !== 'writing') {
      return;
    }
    const durableDrafts = next.project?.drafts ?? {};
    const nextUnitIds = new Set(next.project?.units.map((unit) => unit.id) ?? []);
    setBuffers((previous) => {
      const updated: Record<string, string> = {};
      for (const unitId of nextUnitIds) {
        const durableBody = splitDraft(durableDrafts[unitId] ?? '').body;
        const previousBody = previous[unitId];
        const previousDurableBody = splitDraft(
          previousSnapshot.project?.drafts?.[unitId] ?? '',
        ).body;
        const locallyDirty =
          !generationChanged &&
          typeof previousBody === 'string' &&
          previousBody !== previousDurableBody;
        updated[unitId] = locallyDirty ? previousBody : durableBody;
      }
      buffersRef.current = updated;
      return updated;
    });
    if (generationChanged) {
      editRevisionRef.current = {};
      reportedDirtyRef.current = {};
    } else {
      reportedDirtyRef.current = Object.fromEntries(
        (next.project?.units ?? []).map((unit) => [
          unit.id,
          next.dirtyUnitIds.includes(unit.id),
        ]),
      );
    }
  }, [windowRole]);

  useEffect(() => {
    if (!bridge) {
      setLoading(false);
      setNotice('The authoritative project-session bridge is unavailable.');
      return;
    }
    let cancelled = false;
    const unsubscribe = bridge.subscribeSession((next) => {
      if (!cancelled) {
        applySnapshot(next);
        setLoading(false);
      }
    });
    void bridge
      .getSession()
      .then((next) => {
        if (!cancelled) applySnapshot(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) setNotice(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [applySnapshot, bridge]);

  const activeUnit = useMemo(
    () => snapshot.project?.units.find((unit) => unit.id === snapshot.activeUnitId) ?? null,
    [snapshot.activeUnitId, snapshot.project?.units],
  );
  const activeDurableMarkdown = activeUnit
    ? snapshot.project?.drafts?.[activeUnit.id] ?? ''
    : '';
  const activeDurableBody = splitDraft(activeDurableMarkdown).body;
  const activeBuffer = activeUnit ? buffers[activeUnit.id] ?? activeDurableBody : '';
  const activeDirty = Boolean(activeUnit && activeBuffer !== activeDurableBody);
  const dirtyUnitIds = useMemo(() => deriveDirtyUnitIds(snapshot, buffers), [buffers, snapshot]);
  const hasLocalUnsaved = dirtyUnitIds.size > 0;
  const writingSaveSummary = saveSummaryLabel(snapshot, dirtyUnitIds);

  useEffect(() => {
    setRenameTitle(activeUnit?.title ?? '');
  }, [activeUnit?.id, activeUnit?.title]);

  const runLifecycleRequest = useCallback(
    async (
      request: (discardUnsaved: boolean) => Promise<ProjectSpineResult<unknown>>,
    ): Promise<void> => {
      let discardUnsaved = false;
      if (hasLocalUnsaved || snapshotRef.current.saveState.status === 'save-failed') {
        const discard = window.confirm(
          'This project has unsaved manuscript changes. Discard them and switch projects?',
        );
        if (!discard) {
          setNotice('Project switch cancelled; unsaved work was preserved.');
          return;
        }
        discardUnsaved = true;
      }
      let result = await request(discardUnsaved);
      if (result.ok === false && result.error.code === 'UNSAVED_CHANGES' && !discardUnsaved) {
        const discard = window.confirm(
          'This project has unsaved manuscript changes. Discard them and switch projects?',
        );
        if (!discard) {
          setNotice('Project switch cancelled; unsaved work was preserved.');
          return;
        }
        result = await request(true);
      }
      applySnapshot(result.snapshot);
      setNotice(result.ok === false ? result.error.message : null);
    },
    [applySnapshot, hasLocalUnsaved],
  );

  const handleOpenProject = useCallback(async () => {
    if (!bridge) return;
    const selection = await bridge.chooseDirectory();
    if (selection.canceled || !selection.path) return;
    await runLifecycleRequest((discardUnsaved) =>
      bridge.openProject({
        path: selection.path!,
        operationId: operationId('open-project'),
        discardUnsaved,
      }),
    );
  }, [bridge, runLifecycleRequest]);

  const handleCreateProject = useCallback(async () => {
    if (!bridge) return;
    const title = projectTitle.trim();
    if (!title) {
      setNotice('Enter a project title before creating a project.');
      return;
    }
    const selection = await bridge.chooseDirectory();
    if (selection.canceled || !selection.path) return;
    await runLifecycleRequest((discardUnsaved) =>
      bridge.createProject({
        parentPath: selection.path!,
        title,
        operationId: operationId('create-project'),
        discardUnsaved,
      }),
    );
  }, [bridge, projectTitle, runLifecycleRequest]);

  const handleOpenRecent = useCallback(
    async (projectPath: string) => {
      if (!bridge) return;
      await runLifecycleRequest((discardUnsaved) =>
        bridge.openProject({
          path: projectPath,
          operationId: operationId('open-recent'),
          discardUnsaved,
        }),
      );
    },
    [bridge, runLifecycleRequest],
  );

  const handleRemoveRecent = useCallback(
    async (projectPath: string) => {
      if (!bridge) return;
      const result = await bridge.removeRecent({
        path: projectPath,
        operationId: operationId('remove-recent'),
      });
      applySnapshot(result.snapshot);
      setNotice(resultMessage(result));
    },
    [applySnapshot, bridge],
  );

  const handleSelectUnit = useCallback(
    async (unitId: string) => {
      if (!bridge) return;
      const binding = bindingFor(snapshotRef.current, 'select-unit');
      if (!binding) return;
      const result = await bridge.selectUnit({ ...binding, unitId });
      applySnapshot(result.snapshot);
      setNotice(resultMessage(result));
    },
    [applySnapshot, bridge],
  );

  const reportDirty = useCallback(
    (unitId: string, dirty: boolean) => {
      if (!bridge?.setUnitDirty || reportedDirtyRef.current[unitId] === dirty) return;
      const binding = bindingFor(snapshotRef.current, 'set-dirty');
      if (!binding) return;
      reportedDirtyRef.current[unitId] = dirty;
      void bridge.setUnitDirty({ ...binding, unitId, dirty }).then((result) => {
        applySnapshot(result.snapshot);
        if (result.ok === false) {
          reportedDirtyRef.current[unitId] = !dirty;
          setNotice(result.error.message);
        }
      });
    },
    [applySnapshot, bridge],
  );

  const handleBufferChange = useCallback(
    (unitId: string, body: string) => {
      editRevisionRef.current[unitId] = (editRevisionRef.current[unitId] ?? 0) + 1;
      buffersRef.current = { ...buffersRef.current, [unitId]: body };
      setBuffers(buffersRef.current);
      const durableBody = splitDraft(snapshotRef.current.project?.drafts?.[unitId] ?? '').body;
      reportDirty(unitId, body !== durableBody);
    },
    [reportDirty],
  );

  const saveUnit = useCallback(
    async (unitId: string) => {
      const current = snapshotRef.current;
      const binding = bindingFor(current, 'save-unit');
      const api = bridge?.saveUnit;
      const expectedMarkdown = current.project?.drafts?.[unitId];
      const body = buffersRef.current[unitId];
      if (!binding || !api || typeof expectedMarkdown !== 'string' || typeof body !== 'string') {
        setNotice('This manuscript unit cannot be saved in the current session.');
        return;
      }
      const startingGeneration = current.generation;
      const startingEditRevision = editRevisionRef.current[unitId] ?? 0;
      const markdown = composeDraft(splitDraft(expectedMarkdown), body);
      const result = await api({
        ...binding,
        unitId,
        expectedMarkdown,
        markdown,
      });
      if (snapshotRef.current.generation !== startingGeneration) {
        return;
      }
      applySnapshot(result.snapshot);
      if (result.ok) {
        if ((editRevisionRef.current[unitId] ?? 0) !== startingEditRevision) {
          reportDirty(unitId, true);
        } else {
          const confirmedBody = splitDraft(result.snapshot.project?.drafts?.[unitId] ?? markdown).body;
          buffersRef.current = { ...buffersRef.current, [unitId]: confirmedBody };
          setBuffers(buffersRef.current);
        }
      }
      setNotice(resultMessage(result));
    },
    [applySnapshot, bridge, reportDirty],
  );

  useEffect(() => {
    if (windowRole !== 'writing') return;
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        const unitId = snapshotRef.current.activeUnitId;
        if (unitId) void saveUnit(unitId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveUnit, windowRole]);

  useEffect(() => {
    if (windowRole !== 'writing') return;
    const handler = (event: BeforeUnloadEvent) => {
      if (hasLocalUnsaved || snapshotRef.current.saveState.status === 'save-failed') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasLocalUnsaved, windowRole]);

  const handleCreateUnit = useCallback(async () => {
    const binding = bindingFor(snapshotRef.current, 'create-unit');
    if (!binding || !bridge?.createUnit) return;
    const result = await bridge.createUnit({ ...binding, title: newUnitTitle });
    applySnapshot(result.snapshot);
    if (result.ok) setNewUnitTitle('');
    setNotice(resultMessage(result));
  }, [applySnapshot, bridge, newUnitTitle]);

  const handleRenameUnit = useCallback(async () => {
    const unitId = snapshotRef.current.activeUnitId;
    const binding = bindingFor(snapshotRef.current, 'rename-unit');
    if (!binding || !unitId || !bridge?.renameUnit) return;
    const result = await bridge.renameUnit({ ...binding, unitId, title: renameTitle });
    applySnapshot(result.snapshot);
    setNotice(resultMessage(result));
  }, [applySnapshot, bridge, renameTitle]);

  const moveActiveUnit = useCallback(
    async (offset: -1 | 1) => {
      const current = snapshotRef.current;
      const binding = bindingFor(current, 'reorder-units');
      const unitId = current.activeUnitId;
      if (!binding || !unitId || !bridge?.reorderUnits || !current.project) return;
      const ordered = current.project.units.map((unit) => unit.id);
      const index = ordered.indexOf(unitId);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= ordered.length) return;
      [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
      const result = await bridge.reorderUnits({ ...binding, orderedUnitIds: ordered });
      applySnapshot(result.snapshot);
      setNotice(resultMessage(result));
    },
    [applySnapshot, bridge],
  );

  const handleDeleteUnit = useCallback(async () => {
    const current = snapshotRef.current;
    const unitId = current.activeUnitId;
    const unit = current.project?.units.find((candidate) => candidate.id === unitId);
    const binding = bindingFor(current, 'delete-unit');
    if (!binding || !unitId || !unit || !bridge?.deleteUnit) return;
    const confirmed = window.confirm(
      `Delete “${unit.displayTitle}” from the manuscript? This action cannot be undone in this package.`,
    );
    if (!confirmed) return;
    const result = await bridge.deleteUnit({ ...binding, unitId, confirmNonEmpty: true });
    applySnapshot(result.snapshot);
    setNotice(resultMessage(result));
  }, [applySnapshot, bridge]);

  if (loading) {
    return <main className="stage19-spine stage19-spine--loading">Loading local writing session…</main>;
  }

  if (windowRole === 'command') {
    return (
      <main
        className="stage19-spine stage19-spine--command"
        data-stage19-role="command"
        data-primary-scroll-container="true"
        role="region"
        aria-label="Command Center"
      >
        <header className="stage19-spine__header">
          <div>
            <span className="stage19-spine__eyebrow">Command Center</span>
            <h1>{snapshot.project?.title ?? 'No project open'}</h1>
            <p>Navigation, project status, and durable save truth. Manuscript mutation is unavailable here.</p>
          </div>
          <span className={`stage19-spine__save-state stage19-spine__save-state--${snapshot.saveState.status}`} role="status">
            {saveSummaryLabel(snapshot, dirtyUnitIds)}
          </span>
        </header>
        {notice || snapshot.lastError ? (
          <p className="stage19-spine__notice" role="alert">{notice ?? snapshot.lastError?.message}</p>
        ) : null}
        {snapshot.project ? (
          <div className="stage19-spine__command-grid">
            <section className="stage19-spine__card">
              <h2>Active project</h2>
              <dl className="stage19-spine__facts">
                <div><dt>Title</dt><dd>{snapshot.project.title}</dd></div>
                <div><dt>Identity</dt><dd>{snapshot.project.projectId}</dd></div>
                <div><dt>Location</dt><dd>{snapshot.project.path}</dd></div>
                <div><dt>Units</dt><dd>{snapshot.project.units.length}</dd></div>
              </dl>
            </section>
            <section className="stage19-spine__card stage19-spine__card--units">
              <h2>Manuscript navigation</h2>
              {snapshot.project.units.length > 0 ? (
                <ol className="stage19-spine__unit-list">
                  {snapshot.project.units.map((unit) => (
                    <li key={unit.id}>
                      <button
                        type="button"
                        className={unit.id === snapshot.activeUnitId ? 'is-active' : ''}
                        onClick={() => void handleSelectUnit(unit.id)}
                        aria-current={unit.id === snapshot.activeUnitId ? 'page' : undefined}
                      >
                        <span>{String(unit.order).padStart(2, '0')}</span>
                        <strong>{unit.displayTitle}</strong>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : <p className="stage19-spine__empty">This project has no manuscript units yet.</p>}
            </section>
            <section className="stage19-spine__card">
              <h2>Writing state</h2>
              <p>{saveSummaryLabel(snapshot, dirtyUnitIds)}</p>
              <p>{snapshot.activeUnitId ? `Selected unit: ${activeUnit?.displayTitle ?? snapshot.activeUnitId}` : 'No unit selected'}</p>
              <p className="stage19-spine__mutability-note">Advisory/status/navigation only. No prose editor or structural mutation controls are exposed.</p>
            </section>
          </div>
        ) : (
          <section className="stage19-spine__empty-state">
            <h2>No active project</h2>
            <p>Create or open a project in Writing Studio. Command Center will synchronize automatically.</p>
          </section>
        )}
      </main>
    );
  }

  return (
    <main
      className="stage19-spine stage19-spine--writing"
      data-stage19-role="writing"
      data-primary-scroll-container="true"
      role="region"
      aria-label="Writing Studio"
    >
      <header className="stage19-spine__header">
        <div>
          <span className="stage19-spine__eyebrow">Writing Studio</span>
          <h1>{snapshot.project?.title ?? 'Your local writing workspace'}</h1>
          <p>{snapshot.project ? `Project identity: ${snapshot.project.projectId}` : 'Create or open an isolated local project to begin.'}</p>
        </div>
        <span className={`stage19-spine__save-state stage19-spine__save-state--${snapshot.saveState.status}`} role="status">
          {writingSaveSummary}
        </span>
      </header>
      {notice || snapshot.lastError ? (
        <p className="stage19-spine__notice" role="alert">{notice ?? snapshot.lastError?.message}</p>
      ) : null}
      <section className="stage19-spine__lifecycle" aria-label="Project lifecycle">
        <p className="stage19-spine__lifecycle-help">Open: select the actual Black Skies project folder containing <code>project.json</code>.</p>
        <button type="button" onClick={() => void handleOpenProject()} disabled={!bridge}>Open project…</button>
        <label>
          <span>New project title</span>
          <input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} />
        </label>
        <p className="stage19-spine__lifecycle-help">Create: choose a parent folder; Black Skies creates a new project folder inside it.</p>
        <button type="button" onClick={() => void handleCreateProject()} disabled={!bridge}>Create project…</button>
      </section>
      {snapshot.project ? (
        <div className="stage19-spine__writing-grid">
          <aside className="stage19-spine__binder" aria-label="Manuscript binder">
            <div className="stage19-spine__section-heading">
              <div><span className="stage19-spine__eyebrow">Binder</span><h2>Manuscript units</h2></div>
              <span>{snapshot.project.units.length}</span>
            </div>
            <div className="stage19-spine__create-unit">
              <label>
                <span>Unit title (optional)</span>
                <input
                  value={newUnitTitle}
                  onChange={(event) => setNewUnitTitle(event.target.value)}
                  placeholder="Untitled"
                />
              </label>
              <button type="button" onClick={() => void handleCreateUnit()}>Create unit</button>
            </div>
            {snapshot.project.units.length > 0 ? (
              <ol className="stage19-spine__unit-list">
                {snapshot.project.units.map((unit) => (
                  <li key={unit.id}>
                    <button
                      type="button"
                      className={unit.id === snapshot.activeUnitId ? 'is-active' : ''}
                      onClick={() => void handleSelectUnit(unit.id)}
                      aria-current={unit.id === snapshot.activeUnitId ? 'page' : undefined}
                    >
                      <span>{String(unit.order).padStart(2, '0')}</span>
                      <strong>{unit.displayTitle}</strong>
          {dirtyUnitIds.has(unit.id) ? <em>Unsaved</em> : null}
                    </button>
                  </li>
                ))}
              </ol>
            ) : <p className="stage19-spine__empty">Create the first manuscript unit when you are ready to write.</p>}
            {activeUnit ? (
              <div className="stage19-spine__unit-actions">
                <label>
                  <span>Selected unit title</span>
                  <input value={renameTitle} onChange={(event) => setRenameTitle(event.target.value)} placeholder="Untitled" />
                </label>
                <button type="button" onClick={() => void handleRenameUnit()}>Update title</button>
                <div className="stage19-spine__reorder-actions">
                  <button type="button" onClick={() => void moveActiveUnit(-1)} disabled={activeUnit.order <= 1}>Move up</button>
                  <button type="button" onClick={() => void moveActiveUnit(1)} disabled={activeUnit.order >= snapshot.project.units.length}>Move down</button>
                </div>
                <button type="button" className="stage19-spine__danger" onClick={() => void handleDeleteUnit()}>Delete unit…</button>
              </div>
            ) : null}
          </aside>
          <section className="stage19-spine__editor-card" aria-label="Manuscript editor">
            {activeUnit ? (
              <>
                <div className="stage19-spine__editor-header">
                  <div><span className="stage19-spine__eyebrow">Active manuscript unit</span><h2>{activeUnit.displayTitle}</h2></div>
                  <button
                    type="button"
                    onClick={() => void saveUnit(activeUnit.id)}
                    disabled={!activeDirty || snapshot.saveState.status === 'saving'}
                  >
                    {snapshot.saveState.status === 'saving' ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <p className="stage19-spine__shortcut">Ctrl+S saves the selected unit. Switching units preserves unsaved buffers.</p>
                <div className="stage19-spine__editor">
                  <DraftEditor
                    value={activeBuffer}
                    onChange={(body) => handleBufferChange(activeUnit.id, body)}
                    placeholder="Start writing…"
                    ariaLabel={`Manuscript editor: ${activeUnit.displayTitle}`}
                  />
                </div>
              </>
            ) : (
              <div className="stage19-spine__empty-state"><h2>No manuscript unit selected</h2><p>Create or select a unit from the binder.</p></div>
            )}
          </section>
        </div>
      ) : (
        <div className="stage19-spine__welcome-grid">
          <section className="stage19-spine__empty-state">
            <h2>No active project</h2>
            <p>Projects are isolated local folders with durable identity and versioned metadata.</p>
          </section>
          <section className="stage19-spine__card">
            <h2>Recent projects</h2>
            {snapshot.recentProjects.length > 0 ? (
              <ul className="stage19-spine__recent-list">
                {snapshot.recentProjects.map((recent) => (
                  <li key={recent.path}>
                    <button type="button" onClick={() => void handleOpenRecent(recent.path)}>
                      <strong>{recent.title}</strong><span>{recent.path}</span>{recent.stale ? <em>Missing</em> : null}
                    </button>
                    <button type="button" onClick={() => void handleRemoveRecent(recent.path)} aria-label={`Remove ${recent.title} from recent projects`}>Remove</button>
                  </li>
                ))}
              </ul>
            ) : <p className="stage19-spine__empty">No recent project references.</p>}
          </section>
        </div>
      )}
      <CloseConfirmationDialog windowRole={windowRole} {...closeConfirmation} />
    </main>
  );
}
