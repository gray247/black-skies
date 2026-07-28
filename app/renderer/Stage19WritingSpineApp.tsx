import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ProjectSpineCloseConfirmationDecision,
  ProjectSpineCloseConfirmationRequest,
  ProjectSpineBinding,
  ProjectSpineBridge,
  ProjectSpineCommandStatusProjection,
  ProjectSpineRecoveryCandidateProjection,
  ProjectSpineResult,
  ProjectSpineSessionSnapshot,
  ProjectSpineWindowRole,
} from '../shared/ipc/projectSpine';
import {
  AI_CRITIQUE_AUTHORIZATION_CEILING_USD,
  AI_CRITIQUE_MAX_SELECTION_LENGTH,
  AI_CRITIQUE_MIN_SELECTION_LENGTH,
  type AiCritiqueBridge,
  type AiCritiqueCompletedResult,
  type AiCritiquePreview,
  type AiCritiqueRequestReference,
  type AiCritiqueState,
} from '../shared/ipc/aiCritique';
import DraftEditor, { type DraftEditorSelectionEvidence } from './DraftEditor';

interface DraftEnvelope {
  readonly header: string;
  readonly body: string;
}

interface PendingRecoveryCheckpoint {
  readonly generation: number;
  readonly unitId: string;
  readonly prose: string;
  readonly editRevision: number;
}

interface RecoveryCheckpointSubmission {
  readonly ok: boolean;
  readonly editRevision: number;
}

const RECOVERY_CHECKPOINT_DELAY_MS = 750;
const RECOVERY_NOTICE_PREFIX = 'Recovery protection';

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
  const framedBody = lines.slice(closingIndex + 1).join('\n');
  return {
    header: `${lines.slice(0, closingIndex + 1).join('\n')}\n`,
    body: framedBody.endsWith('\n') ? framedBody.slice(0, -1) : framedBody,
  };
}

function composeDraft(envelope: DraftEnvelope, body: string): string {
  const normalizedBody = body.replace(/\r\n/g, '\n');
  return `${envelope.header}${normalizedBody}\n`;
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

function commandLifecycleLabel(status: ProjectSpineCommandStatusProjection): string {
  switch (status.lifecycle) {
    case 'active':
      return 'Active and available';
    case 'operation-failed':
      return 'Project operation failed';
    default:
      return 'No active project';
  }
}

function commandRecoveryLabel(status: ProjectSpineCommandStatusProjection): string {
  switch (status.recovery) {
    case 'decision-required':
      return 'Recovery decision required in Writing Studio';
    case 'accepted-pending-save':
      return 'Recovered work is unsaved and pending normal Save';
    case 'degraded':
      return 'Recovery evidence is degraded or unavailable';
    default:
      return 'No recovery action required';
  }
}

function commandSaveLabel(
  snapshot: ProjectSpineSessionSnapshot,
  status: ProjectSpineCommandStatusProjection,
): string {
  if (status.save === 'save-failed') {
    return 'Save failed in Writing Studio';
  }
  if (status.save === 'saving') {
    return 'Saving…';
  }
  if (status.recovery === 'decision-required' || status.recovery === 'degraded') {
    return commandRecoveryLabel(status);
  }
  if (status.save === 'accepted-recovery-pending-save') {
    return 'Recovered work pending Save';
  }
  if (!snapshot.project) {
    return 'No active project';
  }
  switch (status.save) {
    case 'dirty':
      return `${snapshot.dirtyUnitIds.length} unsaved unit${snapshot.dirtyUnitIds.length === 1 ? '' : 's'}`;
    default:
      return 'Saved durably';
  }
}

function commandStatusMatchesSnapshot(snapshot: ProjectSpineSessionSnapshot): boolean {
  const status = snapshot.commandStatus;
  return Boolean(
    status &&
    status.projectId === (snapshot.project?.projectId ?? null) &&
    status.generation === snapshot.generation &&
    status.revision === snapshot.revision,
  );
}

function emptySnapshot(role: ProjectSpineWindowRole): ProjectSpineSessionSnapshot {
  const snapshot: ProjectSpineSessionSnapshot = {
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
    ...(role === 'writing' ? { recovery: { status: 'none' as const, candidates: [] } } : {}),
  };
  return snapshot;
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
  beforeResponse,
}: {
  readonly windowRole: ProjectSpineWindowRole;
  readonly bridge?: ProjectSpineBridge;
  readonly projectId: string | null;
  readonly generation: number;
  readonly beforeResponse?: (decision: ProjectSpineCloseConfirmationDecision) => Promise<void>;
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
      await beforeResponse?.(decision);
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
  }, [beforeResponse, bridge]);

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
  readonly aiBridge?: AiCritiqueBridge;
}

interface MarkdownExportNotice {
  readonly projectId: string;
  readonly projectTitle: string;
  readonly tone: 'neutral' | 'success' | 'failure';
  readonly message: string;
}

export default function Stage19WritingSpineApp({
  windowRole = window.projectSpine?.windowRole ?? 'writing',
  bridge = window.projectSpine,
  aiBridge = window.aiCritique,
}: Stage19WritingSpineAppProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<ProjectSpineSessionSnapshot>(() => emptySnapshot(windowRole));
  const [loading, setLoading] = useState(true);
  const [projectionUnavailable, setProjectionUnavailable] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [exportingMarkdown, setExportingMarkdown] = useState(false);
  const [markdownExportNotice, setMarkdownExportNotice] = useState<MarkdownExportNotice | null>(null);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [renameTitle, setRenameTitle] = useState('');
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const [recoveryDecisionUnitId, setRecoveryDecisionUnitId] = useState<string | null>(null);
  const [aiSelection, setAiSelection] = useState<DraftEditorSelectionEvidence | null>(null);
  const [aiCredential, setAiCredential] = useState('');
  const [aiCredentialConfigured, setAiCredentialConfigured] = useState(false);
  const [aiPreview, setAiPreview] = useState<AiCritiquePreview | null>(null);
  const [aiClearanceConfirmed, setAiClearanceConfirmed] = useState(false);
  const [aiState, setAiState] = useState<AiCritiqueState | null>(null);
  const [aiResult, setAiResult] = useState<AiCritiqueCompletedResult | null>(null);
  const [aiResultStale, setAiResultStale] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const aiReferenceRef = useRef<AiCritiqueRequestReference | null>(null);
  const snapshotRef = useRef(snapshot);
  const hasAuthoritativeSnapshotRef = useRef(false);
  const buffersRef = useRef(buffers);
  const editRevisionRef = useRef<Record<string, number>>({});
  const reportedDirtyRef = useRef<Record<string, boolean>>({});
  const dirtyReportPromisesRef = useRef(new Map<string, Promise<void>>());
  const appliedGenerationRef = useRef(0);
  const appliedRecoveryUnitsRef = useRef(new Set<string>());
  const recoveryDecisionSubmissionRef = useRef<{
    readonly id: string;
    readonly generation: number;
  } | null>(null);
  const pendingRecoveryCheckpointsRef = useRef(new Map<string, PendingRecoveryCheckpoint>());
  const recoveryCheckpointTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const recoveryCheckpointPromisesRef = useRef(
    new Map<string, Promise<RecoveryCheckpointSubmission>>(),
  );
  const recoveryCheckpointMountedRef = useRef(true);
  const submitRecoveryCheckpointRef = useRef<
    (unitId: string) => Promise<RecoveryCheckpointSubmission>
  >(
    async () => ({ ok: false, editRevision: -1 }),
  );
  const flushBeforeCloseResponseRef = useRef<() => Promise<void>>(async () => undefined);

  const closeConfirmation = useCloseConfirmationRequest({
    windowRole,
    bridge,
    projectId: snapshot.project?.projectId ?? null,
    generation: snapshot.generation,
    beforeResponse: async () => flushBeforeCloseResponseRef.current(),
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
    if (windowRole === 'command' && !commandStatusMatchesSnapshot(next)) {
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
    hasAuthoritativeSnapshotRef.current = true;
    setProjectionUnavailable(false);
    appliedGenerationRef.current = next.generation;
    if (generationChanged) {
      appliedRecoveryUnitsRef.current.clear();
      recoveryDecisionSubmissionRef.current = null;
      setRecoveryDecisionUnitId(null);
    }
    setSnapshot(next);
    snapshotRef.current = next;
    if (windowRole !== 'writing') {
      return;
    }
    const durableDrafts = next.project?.drafts ?? {};
    const acceptedRecoveryCandidates = next.recovery?.status === 'accepted-pending-save'
      ? new Map(next.recovery.candidates.map((candidate) => [candidate.unitId, candidate]))
      : new Map<string, ProjectSpineRecoveryCandidateProjection>();
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
        const acceptedCandidate = acceptedRecoveryCandidates.get(unitId);
        const appliedUnitKey = `${next.generation}\n${unitId}`;
        if (acceptedCandidate && !appliedRecoveryUnitsRef.current.has(appliedUnitKey)) {
          updated[unitId] = acceptedCandidate.prose;
          appliedRecoveryUnitsRef.current.add(appliedUnitKey);
          editRevisionRef.current[unitId] = (editRevisionRef.current[unitId] ?? 0) + 1;
        } else {
          updated[unitId] = locallyDirty ? previousBody : durableBody;
        }
      }
      buffersRef.current = updated;
      return updated;
    });
    if (generationChanged) {
      for (const timer of recoveryCheckpointTimersRef.current.values()) clearTimeout(timer);
      recoveryCheckpointTimersRef.current.clear();
      pendingRecoveryCheckpointsRef.current.clear();
      recoveryCheckpointPromisesRef.current.clear();
      editRevisionRef.current = {};
      reportedDirtyRef.current = {};
      dirtyReportPromisesRef.current.clear();
    } else {
      reportedDirtyRef.current = Object.fromEntries(
        (next.project?.units ?? []).map((unit) => [
          unit.id,
          dirtyReportPromisesRef.current.has(unit.id)
            ? (reportedDirtyRef.current[unit.id] ?? next.dirtyUnitIds.includes(unit.id))
            : next.dirtyUnitIds.includes(unit.id),
        ]),
      );
    }
  }, [windowRole]);

  useEffect(() => {
    if (!bridge) {
      setLoading(false);
      if (windowRole === 'command') {
        setProjectionUnavailable(true);
      } else {
        setNotice('The authoritative project-session bridge is unavailable.');
      }
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
        if (!cancelled) {
          if (windowRole === 'command') {
            if (!hasAuthoritativeSnapshotRef.current) {
              setProjectionUnavailable(true);
            }
          } else {
            setNotice(error instanceof Error ? error.message : String(error));
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [applySnapshot, bridge, windowRole]);

  const clearAiSurface = useCallback((invalidateActive: boolean) => {
    const reference = aiReferenceRef.current;
    if (invalidateActive && reference && aiBridge) {
      void aiBridge.invalidate(reference).catch(() => undefined);
    }
    aiReferenceRef.current = null;
    setAiPreview(null);
    setAiClearanceConfirmed(false);
    setAiState(null);
    setAiResult(null);
    setAiResultStale(false);
    setAiNotice(null);
  }, [aiBridge]);

  useEffect(() => {
    if (windowRole !== 'writing' || !aiBridge) return;
    let cancelled = false;
    void aiBridge.credentialStatus().then((status) => {
      if (!cancelled && 'configured' in status) setAiCredentialConfigured(status.configured);
    }).catch(() => {
      if (!cancelled) setAiCredentialConfigured(false);
    });
    const unsubscribe = aiBridge.subscribeState((state) => {
      if (state.requestId !== aiReferenceRef.current?.requestId) return;
      setAiState(state);
      if (state.status === 'completed' && state.result) {
        setAiResult(state.result);
        setAiResultStale(false);
      }
      if (state.error) setAiNotice(state.error.message);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [aiBridge, windowRole]);

  const aiAuthorityIdentity = `${snapshot.project?.projectId ?? ''}\n${snapshot.activeUnitId ?? ''}\n${snapshot.generation}\n${snapshot.recovery?.status ?? ''}\n${closeConfirmation.activeRequest?.correlationId ?? ''}`;
  const aiAuthorityIdentityRef = useRef(aiAuthorityIdentity);
  useEffect(() => {
    if (aiAuthorityIdentityRef.current !== aiAuthorityIdentity) {
      aiAuthorityIdentityRef.current = aiAuthorityIdentity;
      setAiSelection(null);
      clearAiSurface(true);
    }
  }, [aiAuthorityIdentity, clearAiSurface]);

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
  const recoveryBlocksEditing = snapshot.recovery?.status === 'decision-required' || snapshot.recovery?.status === 'degraded';
  const markdownExportRequiresSave = Boolean(snapshot.project) && (
    hasLocalUnsaved ||
    (snapshot.saveState.status !== 'clean' && snapshot.saveState.status !== 'saved') ||
    snapshot.recovery?.status !== 'none'
  );

  useEffect(() => {
    setRenameTitle(activeUnit?.title ?? '');
  }, [activeUnit?.id, activeUnit?.title]);

  const submitRecoveryCheckpoint = useCallback(async (
    unitId: string,
  ): Promise<RecoveryCheckpointSubmission> => {
    const existingPromise = recoveryCheckpointPromisesRef.current.get(unitId);
    if (existingPromise) return existingPromise;
    const pending = pendingRecoveryCheckpointsRef.current.get(unitId);
    if (!pending) return { ok: true, editRevision: -1 };
    pendingRecoveryCheckpointsRef.current.delete(unitId);
    const timer = recoveryCheckpointTimersRef.current.get(unitId);
    if (timer) clearTimeout(timer);
    recoveryCheckpointTimersRef.current.delete(unitId);

    const submission = (async () => {
      if (snapshotRef.current.generation !== pending.generation) {
        return { ok: true, editRevision: pending.editRevision };
      }
      const binding = bindingFor(snapshotRef.current, 'recovery-checkpoint');
      const api = bridge?.captureRecoveryCheckpoint;
      if (!binding || !api || windowRole !== 'writing') {
        return { ok: false, editRevision: pending.editRevision };
      }
      try {
        const result = await api({ ...binding, unitId, prose: pending.prose });
        if (snapshotRef.current.generation !== pending.generation) {
          return { ok: true, editRevision: pending.editRevision };
        }
        if (!result.ok) {
          const newer = pendingRecoveryCheckpointsRef.current.get(unitId);
          if (!newer || newer.editRevision < pending.editRevision) {
            pendingRecoveryCheckpointsRef.current.set(unitId, pending);
          }
          if (recoveryCheckpointMountedRef.current) {
            setNotice(
              `${RECOVERY_NOTICE_PREFIX} is unavailable for the latest prose. ${result.error.message} Your live manuscript remains unsaved; save or keep editing to retry.`,
            );
          }
          return { ok: false, editRevision: pending.editRevision };
        }
        if (recoveryCheckpointMountedRef.current) {
          setNotice((current) => current?.startsWith(RECOVERY_NOTICE_PREFIX) ? null : current);
        }
        return { ok: true, editRevision: pending.editRevision };
      } catch {
        const newer = pendingRecoveryCheckpointsRef.current.get(unitId);
        if (!newer || newer.editRevision < pending.editRevision) {
          pendingRecoveryCheckpointsRef.current.set(unitId, pending);
        }
        if (
          recoveryCheckpointMountedRef.current &&
          snapshotRef.current.generation === pending.generation
        ) {
          setNotice(
            `${RECOVERY_NOTICE_PREFIX} could not reach the application service. Your live manuscript remains unsaved; save or keep editing to retry.`,
          );
        }
        return { ok: false, editRevision: pending.editRevision };
      }
    })();
    recoveryCheckpointPromisesRef.current.set(unitId, submission);
    try {
      return await submission;
    } finally {
      if (recoveryCheckpointPromisesRef.current.get(unitId) === submission) {
        recoveryCheckpointPromisesRef.current.delete(unitId);
      }
    }
  }, [bridge, windowRole]);
  submitRecoveryCheckpointRef.current = submitRecoveryCheckpoint;

  const scheduleRecoveryCheckpoint = useCallback((checkpoint: PendingRecoveryCheckpoint) => {
    pendingRecoveryCheckpointsRef.current.set(checkpoint.unitId, checkpoint);
    const previousTimer = recoveryCheckpointTimersRef.current.get(checkpoint.unitId);
    if (previousTimer) clearTimeout(previousTimer);
    const timer = setTimeout(() => {
      recoveryCheckpointTimersRef.current.delete(checkpoint.unitId);
      void submitRecoveryCheckpointRef.current(checkpoint.unitId).then((submission) => {
        const pending = pendingRecoveryCheckpointsRef.current.get(checkpoint.unitId);
        if (pending && pending.editRevision > submission.editRevision) {
          void submitRecoveryCheckpointRef.current(checkpoint.unitId);
        }
      });
    }, RECOVERY_CHECKPOINT_DELAY_MS);
    recoveryCheckpointTimersRef.current.set(checkpoint.unitId, timer);
  }, []);

  const flushRecoveryCheckpoint = useCallback(async (unitId: string): Promise<boolean> => {
    const timer = recoveryCheckpointTimersRef.current.get(unitId);
    if (timer) clearTimeout(timer);
    recoveryCheckpointTimersRef.current.delete(unitId);
    const inFlight = recoveryCheckpointPromisesRef.current.get(unitId);
    if (inFlight) await inFlight;
    return (await submitRecoveryCheckpointRef.current(unitId)).ok;
  }, []);

  const flushAllRecoveryCheckpoints = useCallback(async (): Promise<boolean> => {
    const unitIds = new Set([
      ...pendingRecoveryCheckpointsRef.current.keys(),
      ...recoveryCheckpointPromisesRef.current.keys(),
    ]);
    const results = await Promise.all([...unitIds].map((unitId) => flushRecoveryCheckpoint(unitId)));
    return results.every(Boolean);
  }, [flushRecoveryCheckpoint]);
  flushBeforeCloseResponseRef.current = async () => {
    await flushAllRecoveryCheckpoints();
  };

  useEffect(() => {
    const checkpointTimers = recoveryCheckpointTimersRef.current;
    const pendingCheckpoints = pendingRecoveryCheckpointsRef.current;
    recoveryCheckpointMountedRef.current = true;
    return () => {
      recoveryCheckpointMountedRef.current = false;
      for (const timer of checkpointTimers.values()) clearTimeout(timer);
      checkpointTimers.clear();
      pendingCheckpoints.clear();
    };
  }, []);

  const runLifecycleRequest = useCallback(
    async (
      request: (discardUnsaved: boolean) => Promise<ProjectSpineResult<unknown>>,
    ): Promise<void> => {
      await flushAllRecoveryCheckpoints();
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
      try {
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
      } catch {
        setNotice('The project operation could not reach the application service. Your current work was preserved; try again.');
      }
    },
    [applySnapshot, flushAllRecoveryCheckpoints, hasLocalUnsaved],
  );

  const handleOpenProject = useCallback(async () => {
    if (!bridge) return;
    try {
      const selection = await bridge.chooseDirectory();
      if (selection.canceled || !selection.path) return;
      await runLifecycleRequest((discardUnsaved) =>
        bridge.openProject({
          path: selection.path!,
          operationId: operationId('open-project'),
          discardUnsaved,
        }),
      );
    } catch {
      setNotice('The project picker could not be opened. Your current work was preserved; try again.');
    }
  }, [bridge, runLifecycleRequest]);

  const handleCreateProject = useCallback(async () => {
    if (!bridge) return;
    const title = projectTitle.trim();
    if (!title) {
      setNotice('Enter a project title before creating a project.');
      return;
    }
    try {
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
    } catch {
      setNotice('The project picker could not be opened. Your current work was preserved; try again.');
    }
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
      try {
        const result = await bridge.removeRecent({
          path: projectPath,
          operationId: operationId('remove-recent'),
        });
        applySnapshot(result.snapshot);
        setNotice(resultMessage(result));
      } catch {
        setNotice('The recent-project list could not be updated. No project data was changed.');
      }
    },
    [applySnapshot, bridge],
  );

  const handleSelectUnit = useCallback(
    async (unitId: string) => {
      if (!bridge) return;
      const previousUnitId = snapshotRef.current.activeUnitId;
      if (previousUnitId) await flushRecoveryCheckpoint(previousUnitId);
      const binding = bindingFor(snapshotRef.current, 'select-unit');
      if (!binding) return;
      try {
        const result = await bridge.selectUnit({ ...binding, unitId });
        applySnapshot(result.snapshot);
        setNotice(resultMessage(result));
      } catch {
        setNotice('The manuscript unit could not be selected. Your current work was preserved; try again.');
      }
    },
    [applySnapshot, bridge, flushRecoveryCheckpoint],
  );

  const submitRecoveryDecision = useCallback(async (
    candidate: ProjectSpineRecoveryCandidateProjection,
    decision: 'accept' | 'reject',
  ) => {
    const binding = bindingFor(snapshotRef.current, `recovery-${decision}`);
    const api = decision === 'accept'
      ? bridge?.acceptRecoveryCandidate
      : bridge?.rejectRecoveryCandidate;
    if (!binding || !api || recoveryDecisionSubmissionRef.current) return;
    const submission = { id: binding.operationId, generation: binding.generation };
    recoveryDecisionSubmissionRef.current = submission;
    setRecoveryDecisionUnitId(candidate.unitId);
    try {
      const result = await api({
        ...binding,
        unitId: candidate.unitId,
        originSessionId: candidate.originSessionId,
        candidateVersion: candidate.candidateVersion,
        durableBaselineFingerprint: candidate.durableBaselineFingerprint,
      });
      if (
        recoveryDecisionSubmissionRef.current?.id !== submission.id ||
        snapshotRef.current.generation !== submission.generation
      ) return;
      applySnapshot(result.snapshot);
      setNotice(resultMessage(result));
    } catch (error) {
      if (
        recoveryDecisionSubmissionRef.current?.id !== submission.id ||
        snapshotRef.current.generation !== submission.generation
      ) return;
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      if (recoveryDecisionSubmissionRef.current?.id === submission.id) {
        recoveryDecisionSubmissionRef.current = null;
        setRecoveryDecisionUnitId(null);
      }
    }
  }, [applySnapshot, bridge]);

  const reportDirty = useCallback(
    (unitId: string, dirty: boolean) => {
      const api = bridge?.setUnitDirty;
      if (!api || reportedDirtyRef.current[unitId] === dirty) return;
      const binding = bindingFor(snapshotRef.current, 'set-dirty');
      if (!binding) return;
      reportedDirtyRef.current[unitId] = dirty;
      const previous = dirtyReportPromisesRef.current.get(unitId) ?? Promise.resolve();
      const submission = previous
        .catch(() => undefined)
        .then(async () => {
          if (snapshotRef.current.generation !== binding.generation) return;
          try {
            const result = await api({ ...binding, unitId, dirty });
            applySnapshot(result.snapshot);
            if (result.ok === false) {
              if (reportedDirtyRef.current[unitId] === dirty) {
                reportedDirtyRef.current[unitId] = !dirty;
              }
              setNotice(result.error.message);
            }
          } catch {
            if (reportedDirtyRef.current[unitId] === dirty) {
              reportedDirtyRef.current[unitId] = !dirty;
            }
            setNotice('The application could not record the latest unsaved-work status. Recovery protection remains active; try Save.');
          }
        });
      dirtyReportPromisesRef.current.set(unitId, submission);
      void submission.finally(() => {
        if (dirtyReportPromisesRef.current.get(unitId) === submission) {
          dirtyReportPromisesRef.current.delete(unitId);
        }
      });
    },
    [applySnapshot, bridge],
  );

  const flushDirtyReports = useCallback(async (unitId: string): Promise<void> => {
    let pending = dirtyReportPromisesRef.current.get(unitId);
    while (pending) {
      await pending;
      const next = dirtyReportPromisesRef.current.get(unitId);
      if (next === pending) {
        dirtyReportPromisesRef.current.delete(unitId);
        return;
      }
      pending = next;
    }
  }, []);

  const handleBufferChange = useCallback(
    (unitId: string, body: string) => {
      setAiSelection(null);
      if (aiResult) {
        setAiResultStale(true);
      } else if (aiReferenceRef.current && aiBridge) {
        void aiBridge.invalidate(aiReferenceRef.current).catch(() => undefined);
        aiReferenceRef.current = null;
        setAiPreview(null);
        setAiState(null);
        setAiClearanceConfirmed(false);
      }
      editRevisionRef.current[unitId] = (editRevisionRef.current[unitId] ?? 0) + 1;
      buffersRef.current = { ...buffersRef.current, [unitId]: body };
      setBuffers(buffersRef.current);
      const durableBody = splitDraft(snapshotRef.current.project?.drafts?.[unitId] ?? '').body;
      reportDirty(unitId, body !== durableBody);
      scheduleRecoveryCheckpoint({
        generation: snapshotRef.current.generation,
        unitId,
        prose: body,
        editRevision: editRevisionRef.current[unitId],
      });
    },
    [aiBridge, aiResult, reportDirty, scheduleRecoveryCheckpoint],
  );

  const saveUnit = useCallback(
    async (unitId: string) => {
      const current = snapshotRef.current;
      const api = bridge?.saveUnit;
      const body = buffersRef.current[unitId];
      if (!current.project || !api || typeof body !== 'string') {
        setNotice('This manuscript unit cannot be saved in the current session.');
        return;
      }
      const startingGeneration = current.generation;
      const startingEditRevision = editRevisionRef.current[unitId] ?? 0;
      await flushDirtyReports(unitId);
      if (snapshotRef.current.generation !== startingGeneration) {
        return;
      }
      const checkpointReady = await flushRecoveryCheckpoint(unitId);
      if (!checkpointReady) {
        reportDirty(unitId, true);
        setNotice((currentNotice) => currentNotice?.startsWith(RECOVERY_NOTICE_PREFIX)
          ? currentNotice
          : `${RECOVERY_NOTICE_PREFIX} is unavailable for the latest prose. Save was not started; keep editing or try Save again.`);
        return;
      }
      const saveSnapshot = snapshotRef.current;
      const binding = bindingFor(saveSnapshot, 'save-unit');
      const expectedMarkdown = saveSnapshot.project?.drafts?.[unitId];
      if (
        saveSnapshot.generation !== startingGeneration ||
        !binding ||
        typeof expectedMarkdown !== 'string'
      ) {
        return;
      }
      const markdown = composeDraft(splitDraft(expectedMarkdown), body);
      let result: Awaited<ReturnType<NonNullable<ProjectSpineBridge['saveUnit']>>>;
      try {
        result = await api({
          ...binding,
          unitId,
          expectedMarkdown,
          markdown,
          submittedProse: body,
        });
      } catch {
        reportDirty(unitId, true);
        setNotice('The manuscript could not reach durable storage. Your prose and recovery checkpoint remain available; try Save again.');
        return;
      }
      if (snapshotRef.current.generation !== startingGeneration) {
        return;
      }
      applySnapshot(result.snapshot);
      let newerCheckpointFailed = false;
      if (result.ok) {
        if ((editRevisionRef.current[unitId] ?? 0) !== startingEditRevision) {
          reportDirty(unitId, true);
          newerCheckpointFailed = !(await flushRecoveryCheckpoint(unitId));
        } else {
          const pending = pendingRecoveryCheckpointsRef.current.get(unitId);
          if (pending && pending.editRevision <= startingEditRevision) {
            pendingRecoveryCheckpointsRef.current.delete(unitId);
          }
          const timer = recoveryCheckpointTimersRef.current.get(unitId);
          if (timer) clearTimeout(timer);
          recoveryCheckpointTimersRef.current.delete(unitId);
          const confirmedBody = splitDraft(result.snapshot.project?.drafts?.[unitId] ?? markdown).body;
          buffersRef.current = { ...buffersRef.current, [unitId]: confirmedBody };
          setBuffers(buffersRef.current);
        }
      }
      if (!newerCheckpointFailed) {
        setNotice(
          result.ok && result.data.recovery?.status === 'degraded'
            ? result.data.recovery.message
            : resultMessage(result),
        );
      }
    },
    [applySnapshot, bridge, flushDirtyReports, flushRecoveryCheckpoint, reportDirty],
  );

  useEffect(() => {
    if (windowRole !== 'writing') return;
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (snapshotRef.current.recovery?.status === 'decision-required' || snapshotRef.current.recovery?.status === 'degraded') return;
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

  useEffect(() => {
    if (windowRole === 'writing' && closeConfirmation.activeRequest) {
      void flushAllRecoveryCheckpoints();
    }
  }, [closeConfirmation.activeRequest, flushAllRecoveryCheckpoints, windowRole]);

  const handleCreateUnit = useCallback(async () => {
    const binding = bindingFor(snapshotRef.current, 'create-unit');
    if (!binding || !bridge?.createUnit) return;
    try {
      const result = await bridge.createUnit({ ...binding, title: newUnitTitle });
      applySnapshot(result.snapshot);
      if (result.ok) setNewUnitTitle('');
      setNotice(resultMessage(result));
    } catch {
      setNotice('The manuscript unit could not be created. No existing manuscript content was changed.');
    }
  }, [applySnapshot, bridge, newUnitTitle]);

  const handleRenameUnit = useCallback(async () => {
    const unitId = snapshotRef.current.activeUnitId;
    const binding = bindingFor(snapshotRef.current, 'rename-unit');
    if (!binding || !unitId || !bridge?.renameUnit) return;
    try {
      const result = await bridge.renameUnit({ ...binding, unitId, title: renameTitle });
      applySnapshot(result.snapshot);
      setNotice(resultMessage(result));
    } catch {
      setNotice('The manuscript title could not be updated. Your current work was preserved.');
    }
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
      try {
        const result = await bridge.reorderUnits({ ...binding, orderedUnitIds: ordered });
        applySnapshot(result.snapshot);
        setNotice(resultMessage(result));
      } catch {
        setNotice('The manuscript order could not be updated. Your current work was preserved.');
      }
    },
    [applySnapshot, bridge],
  );

  const handleDeleteUnit = useCallback(async () => {
    const initial = snapshotRef.current;
    const unitId = initial.activeUnitId;
    const unit = initial.project?.units.find((candidate) => candidate.id === unitId);
    if (!unitId || !unit || !bridge?.deleteUnit) return;
    const confirmed = window.confirm(
      `Delete “${unit.displayTitle}” from the manuscript? This action cannot be undone in this package.`,
    );
    if (!confirmed) return;
    await flushRecoveryCheckpoint(unitId);
    const binding = bindingFor(snapshotRef.current, 'delete-unit');
    if (!binding) return;
    try {
      const result = await bridge.deleteUnit({ ...binding, unitId, confirmNonEmpty: true });
      applySnapshot(result.snapshot);
      setNotice(resultMessage(result));
    } catch {
      setNotice('The manuscript unit could not be deleted. Its content remains available.');
    }
  }, [applySnapshot, bridge, flushRecoveryCheckpoint]);

  const handleExportMarkdown = useCallback(async () => {
    const current = snapshotRef.current;
    const api = bridge?.exportMarkdown;
    if (!current.project || !api || windowRole !== 'writing') return;
    const localDirty = deriveDirtyUnitIds(current, buffersRef.current);
    if (
      localDirty.size > 0 ||
      (current.saveState.status !== 'clean' && current.saveState.status !== 'saved') ||
      current.recovery?.status !== 'none'
    ) {
      setMarkdownExportNotice({
        projectId: current.project.projectId,
        projectTitle: current.project.title,
        tone: 'failure',
        message: 'Save the project successfully before exporting.',
      });
      return;
    }
    const binding = bindingFor(current, 'export-markdown');
    if (!binding) return;
    const source = {
      projectId: current.project.projectId,
      projectTitle: current.project.title.trim() || 'Untitled Project',
    };
    setExportingMarkdown(true);
    setMarkdownExportNotice(null);
    try {
      const result = await api({ ...binding, revision: current.revision });
      if (!result.ok) {
        setMarkdownExportNotice({
          ...source,
          tone: 'failure',
          message: result.error.message,
        });
        return;
      }
      if (result.data.status === 'cancelled') {
        setMarkdownExportNotice({
          ...source,
          tone: 'neutral',
          message: 'Export cancelled. No file was created.',
        });
        return;
      }
      setMarkdownExportNotice({
        ...source,
        tone: 'success',
        message: `Export complete: ${result.data.destinationPath} (${result.data.byteLength} bytes, ${result.data.unitCount} unit${result.data.unitCount === 1 ? '' : 's'}).`,
      });
    } catch {
      setMarkdownExportNotice({
        ...source,
        tone: 'failure',
        message: 'Markdown export could not reach the application service. No completion was recorded.',
      });
    } finally {
      setExportingMarkdown(false);
    }
  }, [bridge, windowRole]);

  const handleAiSelection = useCallback((selection: DraftEditorSelectionEvidence) => {
    const selectionChanged = Boolean(
      aiSelection &&
      (
        aiSelection.selectionStart !== selection.selectionStart ||
        aiSelection.selectionEnd !== selection.selectionEnd ||
        aiSelection.editorRevision !== selection.editorRevision ||
        aiSelection.sourceFingerprint !== selection.sourceFingerprint ||
        aiSelection.selectionFingerprint !== selection.selectionFingerprint
      )
    );
    if (selectionChanged && aiReferenceRef.current && !aiResult) {
      if (aiBridge) void aiBridge.invalidate(aiReferenceRef.current).catch(() => undefined);
      aiReferenceRef.current = null;
      setAiPreview(null);
      setAiState(null);
      setAiClearanceConfirmed(false);
      setAiNotice('Selection changed. Review a new outbound critique request.');
    }
    setAiSelection(selection);
  }, [aiBridge, aiResult, aiSelection]);

  const configureAiCredential = useCallback(async () => {
    if (!aiBridge || !aiCredential) return;
    const credential = aiCredential;
    setAiCredential('');
    try {
      const result = await aiBridge.setCredential(credential);
      if (result.ok) {
        setAiCredentialConfigured(result.data.configured);
        setAiNotice('Session credential configured in main-process memory.');
      } else {
        setAiNotice(result.error.message);
      }
    } catch {
      setAiNotice('The critique credential service is unavailable. The credential was cleared from this form.');
    }
  }, [aiBridge, aiCredential]);

  const clearAiCredential = useCallback(async () => {
    if (!aiBridge) return;
    try {
      const status = await aiBridge.clearCredential();
      setAiCredentialConfigured(status.configured);
      setAiCredential('');
      setAiNotice('Session credential cleared.');
    } catch {
      setAiNotice('The critique credential service is unavailable. Try clearing the session credential again.');
    }
  }, [aiBridge]);

  const prepareAiCritique = useCallback(async () => {
    if (!aiBridge || !aiSelection || !snapshot.project || !snapshot.activeUnitId) return;
    const nonWhitespaceLength = aiSelection.selectedText.replace(/\s/g, '').length;
    if (
      nonWhitespaceLength < AI_CRITIQUE_MIN_SELECTION_LENGTH ||
      nonWhitespaceLength > AI_CRITIQUE_MAX_SELECTION_LENGTH
    ) {
      setAiNotice('Select between 200 and 12,000 non-whitespace characters.');
      return;
    }
    if (aiReferenceRef.current) {
      void aiBridge.invalidate(aiReferenceRef.current).catch(() => undefined);
    }
    aiReferenceRef.current = null;
    setAiPreview(null);
    setAiState(null);
    setAiResult(null);
    setAiResultStale(false);
    setAiClearanceConfirmed(false);
    setAiNotice(null);
    const request = {
      operationId: operationId('ai-critique'),
      selection: {
        projectId: snapshot.project.projectId,
        unitId: snapshot.activeUnitId,
        generation: snapshot.generation,
        projectRevision: snapshot.revision,
        ...aiSelection,
      },
    };
    try {
      const prepared = await aiBridge.prepare(request);
      if (!prepared.ok) {
        setAiNotice(prepared.error.message);
        return;
      }
      setAiPreview(prepared.data);
      aiReferenceRef.current = {
        requestId: prepared.data.requestId,
        operationId: request.operationId,
      };
      setAiState({ requestId: prepared.data.requestId, status: 'prepared' });
    } catch {
      setAiNotice('The critique service is unavailable. No prose was transmitted by this attempt.');
    }
  }, [aiBridge, aiSelection, snapshot.activeUnitId, snapshot.generation, snapshot.project, snapshot.revision]);

  const approveAiCritique = useCallback(async () => {
    const reference = aiReferenceRef.current;
    if (!aiBridge || !aiPreview || !aiSelection || !reference || !aiClearanceConfirmed) return;
    try {
      const approved = await aiBridge.approveAndExecute({
        ...reference,
        payloadHash: aiPreview.payloadHash,
        editorRevision: aiSelection.editorRevision,
        sourceFingerprint: aiSelection.sourceFingerprint,
        selectionFingerprint: aiSelection.selectionFingerprint,
        transmissionConfirmed: true,
        authorizationCeilingUsd: AI_CRITIQUE_AUTHORIZATION_CEILING_USD,
      });
      if (!approved.ok) {
        setAiNotice(approved.error.message);
      }
    } catch {
      setAiNotice('The critique service is unavailable. Completion was not recorded; review the request before retrying.');
    }
  }, [aiBridge, aiClearanceConfirmed, aiPreview, aiSelection]);

  const stopWaitingForAi = useCallback(async () => {
    if (!aiBridge || !aiReferenceRef.current) return;
    try {
      const cancelled = await aiBridge.cancel(aiReferenceRef.current);
      if (cancelled.ok) setAiState(cancelled.data);
      else setAiNotice(cancelled.error.message);
    } catch {
      setAiNotice('The critique service could not confirm cancellation. Late results remain fail-closed.');
    }
  }, [aiBridge]);

  const dismissAiCritique = useCallback(() => {
    clearAiSurface(Boolean(aiReferenceRef.current && !aiResult));
    setAiSelection(null);
  }, [aiResult, clearAiSurface]);

  if (loading) {
    return <main className="stage19-spine stage19-spine--loading">Loading local writing session…</main>;
  }

  if (windowRole === 'command') {
    const commandStatus = snapshot.commandStatus;
    if (projectionUnavailable || !commandStatus) {
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
              <h1>Command status unavailable</h1>
              <p>Writing Studio authority could not be reached. No saved or recovery claim is shown.</p>
            </div>
            <span className="stage19-spine__save-state stage19-spine__save-state--save-failed" role="status">
              Status unavailable
            </span>
          </header>
          <p className="stage19-spine__notice" role="alert">
            The authoritative project-session bridge is unavailable.
          </p>
          <section className="stage19-spine__empty-state">
            <h2>Project status unavailable</h2>
            <p>Continue in Writing Studio and wait for Command Center synchronization.</p>
          </section>
        </main>
      );
    }
    const commandAlert = notice ?? (
      commandStatus.lifecycle === 'operation-failed'
        ? 'A Writing Studio project operation failed. Current project identity is preserved.'
        : commandStatus.save === 'save-failed'
          ? 'Durable Save failed in Writing Studio. Unsaved local content remains.'
          : null
    );
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
          <span className={`stage19-spine__save-state stage19-spine__save-state--${commandStatus.save}`} role="status">
            {commandSaveLabel(snapshot, commandStatus)}
          </span>
        </header>
        {commandAlert ? <p className="stage19-spine__notice" role="alert">{commandAlert}</p> : null}
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
              <p><strong>Project:</strong> {commandLifecycleLabel(commandStatus)}</p>
              <p><strong>Recovery:</strong> {commandRecoveryLabel(commandStatus)}</p>
              <p><strong>Save:</strong> {commandSaveLabel(snapshot, commandStatus)}</p>
              <p>{snapshot.activeUnitId ? `Selected unit: ${activeUnit?.displayTitle ?? snapshot.activeUnitId}` : 'No unit selected'}</p>
              <p className="stage19-spine__mutability-note">Advisory/status/navigation only. No prose editor or structural mutation controls are exposed.</p>
            </section>
          </div>
        ) : (
          <section className="stage19-spine__empty-state">
            <h2>No active project</h2>
            <p>Create or open a project in Writing Studio. Command Center will synchronize automatically.</p>
            <p><strong>Recovery:</strong> {commandRecoveryLabel(commandStatus)}</p>
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
        <div className="stage19-spine__project-actions">
          <span className={`stage19-spine__save-state stage19-spine__save-state--${snapshot.saveState.status}`} role="status">
            {writingSaveSummary}
          </span>
          <button
            type="button"
            onClick={() => void handleExportMarkdown()}
            disabled={
              !snapshot.project ||
              !bridge?.exportMarkdown ||
              markdownExportRequiresSave ||
              exportingMarkdown
            }
          >
            {exportingMarkdown ? 'Exporting…' : 'Export Markdown…'}
          </button>
        </div>
      </header>
      {markdownExportRequiresSave ? (
        <p className="stage19-spine__export-remedy" role="status">
          Save the project successfully before exporting.
        </p>
      ) : null}
      {markdownExportNotice ? (
        <p
          className={`stage19-spine__export-notice stage19-spine__export-notice--${markdownExportNotice.tone}`}
          role={markdownExportNotice.tone === 'failure' ? 'alert' : 'status'}
        >
          <strong>Markdown export for {markdownExportNotice.projectTitle}</strong>
          {' — '}
          {markdownExportNotice.message}
        </p>
      ) : null}
      {notice || snapshot.lastError ? (
        <p className="stage19-spine__notice" role="alert">{notice ?? snapshot.lastError?.message}</p>
      ) : null}
      {snapshot.recovery?.status === 'decision-required' ? (
        <section className="stage19-spine__card stage19-spine__recovery" aria-labelledby="stage19-recovery-title">
          <h2 id="stage19-recovery-title">Recover unsaved Writing Studio prose</h2>
          <p>Review every candidate. Recovered prose remains unsaved until you use the normal Save action.</p>
          {snapshot.recovery.candidates.map((candidate) => {
            const allSelected = snapshot.recovery?.status === 'decision-required' &&
              snapshot.recovery.candidates.every((entry) => entry.decision === 'accept-selected');
            const submitting = recoveryDecisionUnitId !== null;
            return (
              <article key={`${candidate.unitId}:${candidate.originSessionId}:${candidate.candidateVersion}`}>
                <h3>{candidate.unitTitle.trim() || 'Untitled'}</h3>
                <pre aria-label={`Recovered prose for ${candidate.unitTitle.trim() || 'Untitled'}`}>
                  {candidate.prose === '' ? '(Empty manuscript prose)' : candidate.prose}
                </pre>
                <div>
                  <button
                    type="button"
                    onClick={() => void submitRecoveryDecision(candidate, 'accept')}
                    disabled={submitting || (candidate.decision === 'accept-selected' && !allSelected)}
                  >
                    {candidate.decision === 'accept-selected'
                      ? allSelected ? 'Retry accepted recovery' : 'Accepted — finish remaining choices'
                      : 'Recover this prose'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitRecoveryDecision(candidate, 'reject')}
                    disabled={submitting}
                  >Reject and delete candidate</button>
                </div>
              </article>
            );
          })}
        </section>
      ) : snapshot.recovery?.status === 'degraded' ? (
        <section className="stage19-spine__card stage19-spine__recovery" role="alert">
          <h2>Recovery evidence needs attention</h2>
          <p>{snapshot.recovery.message}</p>
          <p>Editing is blocked and the recovery artifact has not been deleted. Open another project or close Writing Studio to preserve it.</p>
        </section>
      ) : snapshot.recovery?.status === 'accepted-pending-save' ? (
        <p className="stage19-spine__notice" role="status">Recovered prose is applied and remains unsaved. Use Save for each recovered unit to make it durable.</p>
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
                  disabled={recoveryBlocksEditing}
                />
              </label>
              <button type="button" onClick={() => void handleCreateUnit()} disabled={recoveryBlocksEditing}>Create unit</button>
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
                      disabled={recoveryBlocksEditing}
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
                  <input value={renameTitle} onChange={(event) => setRenameTitle(event.target.value)} placeholder="Untitled" disabled={recoveryBlocksEditing} />
                </label>
                <button type="button" onClick={() => void handleRenameUnit()} disabled={recoveryBlocksEditing}>Update title</button>
                <div className="stage19-spine__reorder-actions">
                  <button type="button" onClick={() => void moveActiveUnit(-1)} disabled={recoveryBlocksEditing || activeUnit.order <= 1}>Move up</button>
                  <button type="button" onClick={() => void moveActiveUnit(1)} disabled={recoveryBlocksEditing || activeUnit.order >= snapshot.project.units.length}>Move down</button>
                </div>
                <button type="button" className="stage19-spine__danger" onClick={() => void handleDeleteUnit()} disabled={recoveryBlocksEditing}>Delete unit…</button>
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
                    disabled={recoveryBlocksEditing || !activeDirty || snapshot.saveState.status === 'saving'}
                  >
                    {snapshot.saveState.status === 'saving' ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <p className="stage19-spine__shortcut">Ctrl+S saves the selected unit. Ctrl+Z undoes and Ctrl+Y redoes editor changes. Switching units preserves unsaved buffers.</p>
                <div className="stage19-spine__editor">
                  <DraftEditor
                    key={`${snapshot.project?.projectId ?? 'no-project'}:${snapshot.generation}:${snapshot.activeUnitId ?? 'no-unit'}`}
                    value={activeBuffer}
                    onChange={(body) => handleBufferChange(activeUnit.id, body)}
                    onSelectionChange={handleAiSelection}
                    readOnly={recoveryBlocksEditing}
                    placeholder="Start writing…"
                    ariaLabel={`Manuscript editor: ${activeUnit.displayTitle}`}
                  />
                </div>
                <section className="stage19-ai" aria-label="Selected prose AI critique">
                  <div className="stage19-ai__heading">
                    <div><span className="stage19-spine__eyebrow">Optional remote critique</span><h3>Selected prose only</h3></div>
                    <span className={aiCredentialConfigured ? 'is-ready' : ''}>
                      {aiCredentialConfigured ? 'Session credential ready' : 'No session credential'}
                    </span>
                  </div>
                  {!aiBridge ? (
                    <p>AI critique is unavailable. Writing, Save, recovery, and close remain local and available.</p>
                  ) : (
                    <>
                      <div className="stage19-ai__credential">
                        <label>
                          <span>OpenAI API key (session only; no readback)</span>
                          <input type="password" autoComplete="off" value={aiCredential} onChange={(event) => setAiCredential(event.target.value)} />
                        </label>
                        <button type="button" onClick={() => void configureAiCredential()} disabled={!aiCredential}>Set session key</button>
                        <button type="button" onClick={() => void clearAiCredential()} disabled={!aiCredentialConfigured}>Clear key</button>
                      </div>
                      <div className="stage19-ai__selection">
                        <p>{aiSelection?.selectedText
                          ? `${aiSelection.selectedText.replace(/\s/g, '').length.toLocaleString()} non-whitespace characters selected`
                          : 'Select 200–12,000 non-whitespace characters in the manuscript editor.'}</p>
                        <button
                          type="button"
                          onClick={() => void prepareAiCritique()}
                          disabled={!aiSelection || aiSelection.selectedText.replace(/\s/g, '').length < AI_CRITIQUE_MIN_SELECTION_LENGTH || aiSelection.selectedText.replace(/\s/g, '').length > AI_CRITIQUE_MAX_SELECTION_LENGTH || aiState?.status === 'executing'}
                        >
                          Review outbound critique request
                        </button>
                      </div>
                      {aiPreview ? (
                        <div className="stage19-ai__preview">
                          <h4>Exact outbound preview</h4>
                          <dl>
                            <div><dt>Provider</dt><dd>{aiPreview.provider}</dd></div>
                            <div><dt>Pinned model</dt><dd>{aiPreview.model}</dd></div>
                            <div><dt>Processing</dt><dd>Remote OpenAI Responses API</dd></div>
                            <div><dt>Pricing verified</dt><dd>{aiPreview.cost.pricingVerifiedAt}</dd></div>
                            <div><dt>Current text pricing</dt><dd>${aiPreview.cost.inputUsdPerMillionTokens.toFixed(2)} input / ${aiPreview.cost.cachedInputUsdPerMillionTokens.toFixed(2)} cached input / ${aiPreview.cost.outputUsdPerMillionTokens.toFixed(2)} output per 1M tokens</dd></div>
                            <div><dt>Preview expires</dt><dd>{aiPreview.expiresAt}</dd></div>
                            <div><dt>Estimated usage cost</dt><dd>${aiPreview.cost.estimatedUsd.toFixed(6)} USD</dd></div>
                            <div><dt>Calculated maximum</dt><dd>${aiPreview.cost.maximumCalculatedUsd.toFixed(6)} USD under the $0.10 local ceiling</dd></div>
                            <div><dt>Payload SHA-256</dt><dd><code>{aiPreview.payloadHash}</code></dd></div>
                          </dl>
                          <p>{aiPreview.cost.invoiceDisclaimer}</p>
                          <p>{aiPreview.retentionDisclosure}</p>
                          <p>{aiPreview.cancellationDisclosure}</p>
                          <details><summary>Frozen critique instructions</summary><pre>{aiPreview.instructions}</pre></details>
                          <details><summary>Exact provider request JSON</summary><pre>{aiPreview.providerBodyJson}</pre></details>
                          <label><span>Exact selected prose to transmit</span><textarea readOnly value={aiPreview.selectedText} rows={8} /></label>
                          <label className="stage19-ai__clearance">
                            <input type="checkbox" checked={aiClearanceConfirmed} onChange={(event) => setAiClearanceConfirmed(event.target.checked)} />
                            <span>{aiPreview.clearanceDisclosure}</span>
                          </label>
                          <button type="button" onClick={() => void approveAiCritique()} disabled={!aiClearanceConfirmed || !aiCredentialConfigured || aiState?.status !== 'prepared'}>
                            Approve and send exact payload
                          </button>
                        </div>
                      ) : null}
                      {aiState && ['approved', 'executing'].includes(aiState.status) ? (
                        <div className="stage19-ai__progress" role="status"><p>Waiting for advisory critique. Editing will invalidate and discard this request.</p><button type="button" onClick={() => void stopWaitingForAi()}>Stop waiting</button></div>
                      ) : null}
                      {aiResult ? (
                        <div className={`stage19-ai__result ${aiResultStale ? 'is-stale' : ''}`}>
                          {aiResultStale ? <p className="stage19-ai__stale" role="status">Stale: the manuscript changed after this critique completed.</p> : null}
                          <h4>Advisory critique</h4>
                          <p>{aiResult.content.overview}</p>
                          {aiResult.content.strengths.length > 0 ? <><h5>Strengths</h5><ul>{aiResult.content.strengths.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
                          {aiResult.content.priorities.length > 0 ? <><h5>Priorities</h5><ol>{aiResult.content.priorities.map((item, index) => <li key={`${index}-${item.evidence}`}><blockquote>{item.evidence}</blockquote><p>{item.observation}</p><p>{item.impact}</p><p>{item.revisionQuestion}</p></li>)}</ol></> : null}
                          {aiResult.content.uncertainties.length > 0 ? <><h5>Uncertainties</h5><ul>{aiResult.content.uncertainties.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
                          <p>{aiResult.usage.inputTokens} input tokens; {aiResult.usage.outputTokens} output tokens; ${aiResult.usage.calculatedUsd.toFixed(6)} calculated.</p>
                          <p>{aiResult.usage.invoiceDisclaimer}</p>
                          <button type="button" onClick={dismissAiCritique}>Dismiss critique</button>
                        </div>
                      ) : null}
                      {aiNotice ? <p className="stage19-ai__notice" role="status">{aiNotice}</p> : null}
                      {aiState && ['failed', 'cancelled', 'expired', 'invalidated'].includes(aiState.status) && !aiResult ? <button type="button" onClick={dismissAiCritique}>Dismiss critique status</button> : null}
                    </>
                  )}
                </section>
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
