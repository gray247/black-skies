import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ProjectSpineCloseConfirmationDecision,
  ProjectSpineCloseConfirmationRequest,
  ProjectSpineBinding,
  ProjectSpineBridge,
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
import type { FeedbackNote, FeedbackNotesBridge } from '../shared/ipc/feedbackNotes';
import {
  deriveCompanionOrientationResult,
  routeCompanionRequest,
  type CompanionOrientationResultV1,
} from '../shared/companionOrientation';
import type {
  LivingOutlineBridge,
  LivingOutlineItemKind,
  LivingOutlineItemState,
  LivingOutlineSnapshotV1,
} from '../shared/ipc/livingOutline';
import type {
  ManuscriptStructureBridge,
  ManuscriptStructureSnapshotV1,
} from '../shared/ipc/manuscriptStructure';
import { buildLivingOutlineSourceAnchor, resolveLivingOutlineAnchor } from '../shared/livingOutlineAnchors';
import type {
  SplitCommandLogicalSurface,
  SplitCommandOwnershipBridge,
  SplitCommandSurfaceHostState,
} from '../shared/ipc/splitCommand';
import {
  CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
  type CommandWorkspaceV1,
  type CritiqueReviewBridge,
  type CritiqueReviewReferenceV1,
  type CritiqueReviewSourceReturnMessageV1,
  type CritiqueReviewSurfaceStateV1,
} from '../shared/ipc/contextualProductShell';
import type { DraftEditorSelectionEvidence } from './DraftEditor';
import Stage19WritingSpineView, {
  getSelectableImportedManuscriptProposalIds,
  type MarkdownExportNotice,
  type Stage19WritingRail,
  type Stage19WritingSpineViewActions,
  type Stage19WritingSpineViewModel,
  type Stage19Theme,
} from './Stage19WritingSpineView';
import {
  decideStage19SessionProjection,
  deriveStage19ViewPhase,
  deriveStage19WritingAvailability,
} from './stage19WritingSpineController';

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
export const STAGE19_THEME_STORAGE_KEY = 'black-skies.stage19.theme.v1';

export function parseStage19Theme(value: string | null | undefined): Stage19Theme {
  return value === 'light' ? 'light' : 'dark';
}

function readStage19ThemePreference(): Stage19Theme {
  try {
    return parseStage19Theme(window.localStorage.getItem(STAGE19_THEME_STORAGE_KEY));
  } catch {
    return 'dark';
  }
}

function operationId(prefix: string): string {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `${prefix}:${suffix}`;
}

async function fingerprintVisibleText(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')).join('');
}

function defaultOutlineLabel(selection: DraftEditorSelectionEvidence | null): string {
  const selected = selection?.selectedText.replace(/\s+/g, ' ').trim() ?? '';
  if (!selected) return 'New note';
  if (selected.length <= 96) return selected;
  return `${selected.slice(0, 95).trimEnd()}…`;
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
      return snapshot.project ? 'Saved durably' : 'No project open';
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
    }
  }
  return dirty;
}

function focusWritingEditor(unitId?: string): void {
  const escapedUnitId = unitId && globalThis.CSS?.escape ? globalThis.CSS.escape(unitId) : unitId;
  const editor =
    (escapedUnitId ? document.querySelector<HTMLElement>(`[data-manuscript-unit-id="${escapedUnitId}"] [contenteditable="true"]`) : null) ??
    (escapedUnitId ? document.querySelector<HTMLElement>(`[data-manuscript-unit-id="${escapedUnitId}"] [aria-label^="Manuscript editor:"]`) : null) ??
    document.querySelector<HTMLElement>(
      '[contenteditable="true"][aria-label^="Manuscript editor:"]',
    ) ?? document.querySelector<HTMLElement>('[aria-label^="Manuscript editor:"]');
  editor?.focus({ preventScroll: true });
}

async function restoreWritingWindowFocus(
  focusWritingWindow?: () => Promise<unknown>,
): Promise<void> {
  try {
    await focusWritingWindow?.();
  } catch {
    // Focus restoration is best effort; the editor remains available if the window is already active.
  }
  const restore = () => {
    const focus = window.focus as (() => void) & { _isMockFunction?: boolean };
    const runningInJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
    if (!runningInJsdom || focus._isMockFunction) {
      try {
        focus.call(window);
      } catch {
        // jsdom does not implement the browser window-focus primitive.
      }
    }
    focusWritingEditor();
  };
  restore();
  window.setTimeout(restore, 0);
}

function saveSummaryLabel(snapshot: ProjectSpineSessionSnapshot, dirtyUnitIds: ReadonlySet<string>): string {
  if (dirtyUnitIds.size > 0 && snapshot.saveState.status !== 'saving') {
    return `${dirtyUnitIds.size} unsaved unit${dirtyUnitIds.size === 1 ? '' : 's'}`;
  }
  return saveStatusLabel(snapshot);
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
      restoreWritingWindowFocus();
      previousFocusRef.current?.focus({ preventScroll: true });
      window.setTimeout(focusWritingEditor, 0);
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

interface ProjectSwitchConfirmationDialogProps {
  readonly open: boolean;
  readonly continueEditing: () => void;
  readonly discardChanges: () => void;
}

export function ProjectSwitchConfirmationDialog({
  open,
  continueEditing,
  discardChanges,
}: ProjectSwitchConfirmationDialogProps): JSX.Element | null {
  const continueEditingRef = useRef<HTMLButtonElement>(null);
  const discardChangesRef = useRef<HTMLButtonElement>(null);
  const continueEditingCallbackRef = useRef(continueEditing);
  continueEditingCallbackRef.current = continueEditing;

  useEffect(() => {
    if (!open) return;
    continueEditingRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        continueEditingCallbackRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      event.preventDefault();
      (event.shiftKey ? discardChangesRef : continueEditingRef).current?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      focusWritingEditor();
      window.setTimeout(focusWritingEditor, 0);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="stage19-close-confirmation" role="presentation">
      <div className="stage19-close-confirmation__backdrop" aria-hidden="true" />
      <section
        className="stage19-close-confirmation__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage19-project-switch-title"
        aria-describedby="stage19-project-switch-description"
      >
        <h2 id="stage19-project-switch-title">Unsaved manuscript changes</h2>
        <p id="stage19-project-switch-description">
          Discard your unsaved changes and switch projects, or continue editing the current project.
        </p>
        <div className="stage19-close-confirmation__actions">
          <button ref={continueEditingRef} type="button" onClick={continueEditing}>
            Continue editing
          </button>
          <button ref={discardChangesRef} type="button" onClick={discardChanges}>
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
  readonly feedbackNotesBridge?: FeedbackNotesBridge;
  readonly livingOutlineBridge?: LivingOutlineBridge;
  readonly manuscriptStructureBridge?: ManuscriptStructureBridge;
  readonly surfaceBridge?: SplitCommandOwnershipBridge;
  readonly critiqueReviewBridge?: CritiqueReviewBridge;
}

export default function Stage19WritingSpineApp({
  windowRole = window.projectSpine?.windowRole ?? 'writing',
  bridge = window.projectSpine,
  aiBridge = window.aiCritique,
  feedbackNotesBridge = window.feedbackNotes,
  livingOutlineBridge = window.livingOutline,
  manuscriptStructureBridge = window.manuscriptStructure,
  surfaceBridge = window.splitCommand,
  critiqueReviewBridge = window.critiqueReview,
}: Stage19WritingSpineAppProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<ProjectSpineSessionSnapshot>(() => emptySnapshot(windowRole));
  const [loading, setLoading] = useState(true);
  const [projectionUnavailable, setProjectionUnavailable] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [exportingMarkdown, setExportingMarkdown] = useState(false);
  const [markdownExportNotice, setMarkdownExportNotice] = useState<MarkdownExportNotice | null>(null);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [renameTitle, setRenameTitle] = useState('');
  const [unitEditingId, setUnitEditingId] = useState<string | null>(null);
  const [pendingCreation, setPendingCreation] = useState<{ kind: 'unit' | 'outline'; id: string } | null>(null);
  const [unitAdvancedId, setUnitAdvancedId] = useState<string | null>(null);
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const [projectSwitchConfirmationOpen, setProjectSwitchConfirmationOpen] = useState(false);
  const projectSwitchDecisionRef = useRef<((discardChanges: boolean) => void) | null>(null);
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
  const [feedbackNoteBody, setFeedbackNoteBody] = useState('');
  const [feedbackNoteSaving, setFeedbackNoteSaving] = useState(false);
  const [feedbackNoteNotice, setFeedbackNoteNotice] = useState<string | null>(null);
  const [savedFeedbackNotes, setSavedFeedbackNotes] = useState<readonly FeedbackNote[]>([]);
  const [theme, setTheme] = useState<Stage19Theme>(readStage19ThemePreference);
  const [focusMode, setFocusMode] = useState(false);
  const [openWritingRail, setOpenWritingRail] = useState<Stage19WritingRail | null>(null);
  const [companionPrompt, setCompanionPrompt] = useState('');
  const [companionResult, setCompanionResult] = useState<CompanionOrientationResultV1 | null>(null);
  const [companionNotice, setCompanionNotice] = useState<string | null>(null);
  const [livingOutline, setLivingOutline] = useState<LivingOutlineSnapshotV1 | null>(null);
  const [livingOutlineLoading, setLivingOutlineLoading] = useState(false);
  const [livingOutlineNotice, setLivingOutlineNotice] = useState<string | null>(null);
  const [manuscriptStructure, setManuscriptStructure] = useState<ManuscriptStructureSnapshotV1 | null>(null);
  const [manuscriptStructureLoading, setManuscriptStructureLoading] = useState(false);
  const [manuscriptStructureNotice, setManuscriptStructureNotice] = useState<string | null>(null);
  const [manuscriptStructurePage, setManuscriptStructurePage] = useState(0);
  const [manuscriptStructureOrder, setManuscriptStructureOrder] = useState<readonly string[] | null>(null);
  const [structureBoundaryStart, setStructureBoundaryStart] = useState<number | null>(null);
  const [structureBoundaryEnd, setStructureBoundaryEnd] = useState<number | null>(null);
  const [selectedManuscriptProposalId, setSelectedManuscriptProposalId] = useState<string | null>(null);
  const [selectedOutlineItemId, setSelectedOutlineItemId] = useState<string | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedStoryItemIds, setSelectedStoryItemIds] = useState<string[]>([]);
  const [storyRailHelpOpen, setStoryRailHelpOpen] = useState(false);
  const [storyRailAddMenuOpen, setStoryRailAddMenuOpen] = useState(false);
  const [selectedRailKind, setSelectedRailKind] = useState<'unit' | 'outline'>('outline');
  const [outlineEditingItemId, setOutlineEditingItemId] = useState<string | null>(null);
  const [outlineAdvancedItemId, setOutlineAdvancedItemId] = useState<string | null>(null);
  const [outlineLabel, setOutlineLabel] = useState('');
  const [outlineBody, setOutlineBody] = useState('');
  const [outlineKind, setOutlineKind] = useState<LivingOutlineItemKind>('fragment');
  const [outlineState, setOutlineState] = useState<LivingOutlineItemState>('planned');
  const [surfaceHostState, setSurfaceHostState] = useState<SplitCommandSurfaceHostState | null>(
    () => surfaceBridge?.readSurfaceHostState() ?? null,
  );
  const [surfaceHostError, setSurfaceHostError] = useState<string | null>(null);
  const [commandWorkspace, setCommandWorkspace] = useState<CommandWorkspaceV1>('review');
  const [critiqueReviewState, setCritiqueReviewState] = useState<CritiqueReviewSurfaceStateV1 | null>(
    () => critiqueReviewBridge?.readState() ?? null,
  );
  const [sourceReturnRequest, setSourceReturnRequest] = useState<CritiqueReviewSourceReturnMessageV1 | null>(null);
  const aiReferenceRef = useRef<AiCritiqueRequestReference | null>(null);
  const snapshotRef = useRef(snapshot);
  const hasAuthoritativeSnapshotRef = useRef(false);
  const buffersRef = useRef(buffers);
  const editRevisionRef = useRef<Record<string, number>>({});
  const reportedDirtyRef = useRef<Record<string, boolean>>({});
  const dirtyReportPromisesRef = useRef(new Map<string, Promise<void>>());
  const appliedGenerationRef = useRef(0);
  const markdownExportOperationRef = useRef(0);
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

  const companionProjectIdentity = `${snapshot.project?.projectId ?? ''}\n${snapshot.generation}`;
  useEffect(() => {
    setCompanionPrompt('');
    setCompanionResult(null);
    setCompanionNotice(null);
    setUnitEditingId(null);
    setUnitAdvancedId(null);
  }, [companionProjectIdentity]);

  useEffect(() => {
    document.body.dataset.stage19Spine = windowRole;
    document.body.dataset.stage19Theme = theme;
    document.documentElement.dataset.stage19Theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(STAGE19_THEME_STORAGE_KEY, theme);
    } catch {
      // Theme remains usable for this session when local preferences are unavailable.
    }
    return () => {
      delete document.body.dataset.stage19Spine;
      delete document.body.dataset.stage19Theme;
      delete document.documentElement.dataset.stage19Theme;
      document.documentElement.style.removeProperty('color-scheme');
    };
  }, [theme, windowRole]);

  useEffect(() => {
    const receiveThemePreference = (event: StorageEvent) => {
      if (event.key === STAGE19_THEME_STORAGE_KEY) {
        setTheme(parseStage19Theme(event.newValue));
      }
    };
    window.addEventListener('storage', receiveThemePreference);
    return () => window.removeEventListener('storage', receiveThemePreference);
  }, []);

  useEffect(() => {
    if (!surfaceBridge) return;
    let active = true;
    let receivedSurfaceHostState = false;
    let retryTimer: number | null = null;
    let retryIndex = 0;
    // Hosted Windows startup can take longer than the local renderer handshake.
    // Keep retrying for a bounded interval so a transient main-process race does
    // not permanently hide the surface controls.
    // The main process can finish creating the surface-host state after the
    // renderer is already interactive on hosted Windows runners. Keep the
    // bridge alive through that late handoff instead of permanently hiding
    // the surface controls after the first short retry burst.
    const retryDelaysMs = [50, 100, 200, 400, 800, 1200, 1600, 2400, 3200, 5000] as const;
    const applySurfaceHostState = (state: SplitCommandSurfaceHostState) => {
      if (!active) return;
      receivedSurfaceHostState = true;
      setSurfaceHostState(state);
    };
    const unsubscribe = surfaceBridge.subscribeSurfaceHostState(applySurfaceHostState);
    const requestSurfaceHostState = () => {
      void surfaceBridge.requestSurfaceHostState()
        .then((state) => {
          if (!active) return;
          if (state) {
            applySurfaceHostState(state);
            return;
          }
          if (receivedSurfaceHostState) return;
          const delay = retryDelaysMs[retryIndex++];
          if (delay !== undefined) retryTimer = window.setTimeout(requestSurfaceHostState, delay);
        })
        .catch(() => {
          if (!active || receivedSurfaceHostState) return;
          const delay = retryDelaysMs[retryIndex++];
          if (delay !== undefined) retryTimer = window.setTimeout(requestSurfaceHostState, delay);
        });
    };
    requestSurfaceHostState();
    return () => {
      active = false;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      unsubscribe();
    };
  }, [surfaceBridge]);

  useEffect(() => {
    if (!critiqueReviewBridge) return;
    let active = true;
    const unsubscribeState = critiqueReviewBridge.subscribeState((state) => {
      if (active) setCritiqueReviewState(state);
    });
    const unsubscribeSourceReturn = critiqueReviewBridge.subscribeSourceReturn((message) => {
      if (!active || windowRole !== 'writing') return;
      const current = snapshotRef.current;
      const exact = Boolean(
        message.status === 'exact' &&
        message.anchor &&
        current.project?.projectId === message.projectId &&
        current.generation === message.generation &&
        current.activeUnitId === message.anchor.unitId,
      );
      setNotice(exact ? message.message : `${message.message} Exact selection restoration was not attempted.`);
      setSourceReturnRequest(exact ? message : null);
    });
    void critiqueReviewBridge.requestState().then((state) => {
      if (active) setCritiqueReviewState(state);
    }).catch(() => {
      if (active) {
        setCritiqueReviewState({
          schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
          projectId: snapshotRef.current.project?.projectId ?? null,
          generation: snapshotRef.current.generation,
          availability: 'unavailable',
          message: 'Review is unavailable. Writing and saving remain available.',
        });
      }
    });
    return () => {
      active = false;
      unsubscribeState();
      unsubscribeSourceReturn();
    };
  }, [critiqueReviewBridge, windowRole]);

  const applySnapshot = useCallback((next: ProjectSpineSessionSnapshot) => {
    const previousSnapshot = snapshotRef.current;
    const decision = decideStage19SessionProjection(previousSnapshot, next, windowRole);
    if (!decision.accepted) return;
    const { generationChanged } = decision;
    hasAuthoritativeSnapshotRef.current = true;
    setProjectionUnavailable(false);
    appliedGenerationRef.current = next.generation;
    if (generationChanged) {
      appliedRecoveryUnitsRef.current.clear();
      recoveryDecisionSubmissionRef.current = null;
      setRecoveryDecisionUnitId(null);
      markdownExportOperationRef.current += 1;
      setExportingMarkdown(false);
      setMarkdownExportNotice(null);
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

  const livingOutlineProjectIdentity = `${snapshot.project?.projectId ?? ''}\n${snapshot.project?.path ?? ''}\n${snapshot.generation}`;
  useEffect(() => {
    if (windowRole !== 'writing') return;
    setSelectedOutlineItemId(null);
    setSelectedStoryItemIds([]);
    setMultiSelectMode(false);
    setStoryRailHelpOpen(false);
    setOutlineEditingItemId(null);
    setOutlineAdvancedItemId(null);
    setOutlineLabel('');
    setOutlineBody('');
    setPendingCreation(null);
    if (!snapshot.project) {
      setLivingOutline(null);
      setLivingOutlineNotice(null);
      return;
    }
    if (!livingOutlineBridge) {
      setLivingOutline(null);
      setLivingOutlineNotice('Story planning is unavailable. Manuscript writing and saving remain available.');
      return;
    }
    let cancelled = false;
    setLivingOutlineLoading(true);
    setLivingOutlineNotice(null);
    void livingOutlineBridge.get({
      operationId: operationId('living-outline-load'),
      projectId: snapshot.project.projectId,
      projectPath: snapshot.project.path,
      generation: snapshot.generation,
    }).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setLivingOutline(result.data);
        setLivingOutlineNotice(result.data.message);
      } else {
        setLivingOutline(null);
        setLivingOutlineNotice(result.error.message);
      }
    }).catch(() => {
      if (!cancelled) setLivingOutlineNotice('The story plan could not be loaded. Manuscript writing remains available.');
    }).finally(() => {
      if (!cancelled) setLivingOutlineLoading(false);
    });
    return () => {
      cancelled = true;
    };
  // The stable identity deliberately avoids reloading after ordinary manuscript revisions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livingOutlineBridge, livingOutlineProjectIdentity, windowRole]);

  const manuscriptStructureProjectIdentity = `${snapshot.project?.projectId ?? ''}\n${snapshot.project?.path ?? ''}\n${snapshot.generation}`;
  useEffect(() => {
    if (windowRole !== 'writing') return;
    setSelectedManuscriptProposalId(null);
    if (!snapshot.project) {
      setManuscriptStructure(null);
      setManuscriptStructureNotice(null);
      setManuscriptStructurePage(0);
      setManuscriptStructureOrder(null);
      setStructureBoundaryStart(null);
      setStructureBoundaryEnd(null);
      return;
    }
    if (!manuscriptStructureBridge) {
      setManuscriptStructure(null);
      setManuscriptStructureNotice('Structure intake is unavailable. Manuscript writing remains available.');
      return;
    }
    let cancelled = false;
    setManuscriptStructureLoading(true);
    setManuscriptStructureNotice(null);
    void manuscriptStructureBridge.get({
      operationId: operationId('manuscript-structure-load'),
      projectId: snapshot.project.projectId,
      projectPath: snapshot.project.path,
      generation: snapshot.generation,
    }).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setManuscriptStructure(result.data);
        setManuscriptStructureNotice(result.data.message);
        setManuscriptStructurePage(0);
        setManuscriptStructureOrder(null);
        setStructureBoundaryStart(null);
        setStructureBoundaryEnd(null);
      } else {
        setManuscriptStructure(null);
        setManuscriptStructureNotice(result.error.message);
      }
    }).catch(() => {
      if (!cancelled) setManuscriptStructureNotice('The structure workspace could not be loaded.');
    }).finally(() => {
      if (!cancelled) setManuscriptStructureLoading(false);
    });
    return () => {
      cancelled = true;
    };
  // The stable identity avoids reloads after ordinary manuscript revisions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscriptStructureBridge, manuscriptStructureProjectIdentity, windowRole]);

  const selectableImportedProposalIds = useMemo(
    () => getSelectableImportedManuscriptProposalIds(manuscriptStructure),
    [manuscriptStructure],
  );
  const structureProposalIds = useMemo(
    () => manuscriptStructure?.document.proposals.map((proposal) => proposal.id) ?? [],
    [manuscriptStructure],
  );
  useEffect(() => {
    if (!snapshot.project || manuscriptStructure?.availability !== 'ready' || structureProposalIds.length === 0) {
      setSelectedManuscriptProposalId(null);
      return;
    }
    setSelectedManuscriptProposalId((current) =>
      current && structureProposalIds.includes(current)
        ? current
        : selectableImportedProposalIds[0] ?? structureProposalIds[0] ?? null,
    );
  }, [manuscriptStructure, selectableImportedProposalIds, snapshot.project, structureProposalIds]);

  useEffect(() => {
    if (!outlineAdvancedItemId) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOutlineAdvancedItemId(null);
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-note-marker-cluster="true"] button')?.focus();
      });
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [outlineAdvancedItemId]);

  useEffect(() => {
    if (windowRole !== 'writing') return;
    if (!snapshot.project || !feedbackNotesBridge?.list) {
      setSavedFeedbackNotes([]);
      return;
    }
    let cancelled = false;
    void feedbackNotesBridge.list({
      operationId: operationId('feedback-notes-list'),
      projectId: snapshot.project.projectId,
      projectPath: snapshot.project.path,
      generation: snapshot.generation,
    }).then((result) => {
      if (cancelled) return;
      if (result.ok) setSavedFeedbackNotes(result.data);
      else setFeedbackNoteNotice(result.error.message);
    }).catch(() => {
      if (!cancelled) setFeedbackNoteNotice('Saved advisory notes could not be loaded. Manuscript writing remains available.');
    });
    return () => {
      cancelled = true;
    };
  // Load only when project identity changes, not after ordinary manuscript revisions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackNotesBridge, livingOutlineProjectIdentity, windowRole]);

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
    setFeedbackNoteBody('');
    setFeedbackNoteSaving(false);
    setFeedbackNoteNotice(null);
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
        setCommandWorkspace('review');
        setFeedbackNoteBody('');
        setFeedbackNoteNotice(null);
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
  const selectedOutlineItem = useMemo(
    () => livingOutline?.document.items.find((item) => item.id === selectedOutlineItemId) ?? null,
    [livingOutline, selectedOutlineItemId],
  );
  const projectedWritingOrder = useMemo(
    () => (livingOutline?.document.items ?? [])
      .flatMap((item) => {
        if (!item.manuscriptUnitId) return [];
        const unit = snapshot.project?.units.find((candidate) => candidate.id === item.manuscriptUnitId);
        return unit ? [{ item, unit }] : [];
      }),
    [livingOutline, snapshot.project?.units],
  );
  const activeLinkedOutlineItemId = useMemo(
    () => livingOutline?.document.items.find((item) => item.manuscriptUnitId === snapshot.activeUnitId)?.id ?? null,
    [livingOutline?.document.items, snapshot.activeUnitId],
  );
  const dirtyUnitIds = useMemo(() => deriveDirtyUnitIds(snapshot, buffers), [buffers, snapshot]);
  const {
    activeDirty,
    hasLocalUnsaved,
    recoveryBlocksEditing,
    markdownExportRequiresSave,
  } = deriveStage19WritingAvailability(snapshot, dirtyUnitIds);
  const writingSaveSummary = saveSummaryLabel(snapshot, dirtyUnitIds);
  const logicalSurface: SplitCommandLogicalSurface = windowRole === 'command'
    ? 'command'
    : surfaceHostState?.primarySurface ?? 'writing';
  const commandSnapshot = windowRole === 'command'
    ? snapshot
    : surfaceHostState &&
        surfaceHostState.projectId === (snapshot.project?.projectId ?? null) &&
        surfaceHostState.generation === snapshot.generation
      ? surfaceHostState.commandSnapshot
      : null;
  const viewPhase = deriveStage19ViewPhase(
    logicalSurface,
    loading,
    projectionUnavailable || (logicalSurface === 'command' && !commandSnapshot),
    logicalSurface === 'command' ? commandSnapshot ?? emptySnapshot('command') : snapshot,
  );

  useEffect(() => {
    if (!storyRailAddMenuOpen || windowRole !== 'writing') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStoryRailAddMenuOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const menu = document.getElementById('stage19-story-rail-add-menu');
      const trigger = document.querySelector('[aria-controls="stage19-story-rail-add-menu"]');
      if (target && menu && trigger && !menu.contains(target) && !trigger.contains(target)) {
        setStoryRailAddMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [storyRailAddMenuOpen, windowRole]);

  const previousLogicalSurfaceRef = useRef<SplitCommandLogicalSurface>(logicalSurface);
  useEffect(() => {
    const previous = previousLogicalSurfaceRef.current;
    previousLogicalSurfaceRef.current = logicalSurface;
    if (windowRole === 'writing' && previous === 'command' && logicalSurface === 'writing') {
      window.setTimeout(focusWritingEditor, 0);
    }
  }, [logicalSurface, windowRole]);

  useEffect(() => {
    setRenameTitle(activeUnit?.title ?? '');
  }, [activeUnit?.id, activeUnit?.title]);

  useEffect(() => {
    if (activeLinkedOutlineItemId) setSelectedOutlineItemId(activeLinkedOutlineItemId);
    else if (selectedRailKind === 'unit') setSelectedOutlineItemId(null);
  }, [activeLinkedOutlineItemId, selectedRailKind]);

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

  const requestProjectSwitchDecision = useCallback((): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      projectSwitchDecisionRef.current = resolve;
      setProjectSwitchConfirmationOpen(true);
    });
  }, []);

  const resolveProjectSwitchDecision = useCallback((discardChanges: boolean): void => {
    const resolve = projectSwitchDecisionRef.current;
    projectSwitchDecisionRef.current = null;
    setProjectSwitchConfirmationOpen(false);
    resolve?.(discardChanges);
  }, []);

  useEffect(() => () => {
    projectSwitchDecisionRef.current?.(false);
    projectSwitchDecisionRef.current = null;
  }, []);
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
        const discard = await requestProjectSwitchDecision();
        if (!discard) {
          setNotice('Project switch cancelled; unsaved work was preserved.');
          return;
        }
        discardUnsaved = true;
      }
      try {
        let result = await request(discardUnsaved);
        if (result.ok === false && result.error.code === 'UNSAVED_CHANGES' && !discardUnsaved) {
          const discard = await requestProjectSwitchDecision();
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
    [applySnapshot, flushAllRecoveryCheckpoints, hasLocalUnsaved, requestProjectSwitchDecision],
  );

  const handleOpenProject = useCallback(async () => {
    if (!bridge) return;
    try {
      const selection = await bridge.chooseDirectory();
      if (selection.canceled || !selection.path) {
        void restoreWritingWindowFocus(bridge.focusWritingWindow);
        return;
      }
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
      if (selection.canceled || !selection.path) {
        void restoreWritingWindowFocus(bridge.focusWritingWindow);
        return;
      }
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

  const importManuscriptStructure = useCallback(async () => {
    if (!bridge || !manuscriptStructureBridge) return;
    if (hasLocalUnsaved) {
      setManuscriptStructureNotice('Save or discard the active project before starting a disposable manuscript intake.');
      return;
    }
    try {
      const sourceSelection = await manuscriptStructureBridge.chooseMarkdown();
      if (sourceSelection.canceled || !sourceSelection.filePath) return;
      const parentSelection = await bridge.chooseDirectory();
      if (parentSelection.canceled || !parentSelection.path) return;
      const result = await manuscriptStructureBridge.importMarkdown({
        operationId: operationId('manuscript-structure-import'),
        projectId: snapshotRef.current.project?.projectId ?? '',
        projectPath: snapshotRef.current.project?.path ?? '',
        generation: snapshotRef.current.generation,
        parentPath: parentSelection.path,
        filePath: sourceSelection.filePath,
      });
      if (!result.ok) {
        setManuscriptStructureNotice(result.error.message);
        return;
      }
      const activation = await bridge.openProject({
        path: result.data.projectPath,
        operationId: operationId('manuscript-structure-activate'),
        discardUnsaved: true,
      });
      applySnapshot(activation.snapshot);
      setManuscriptStructureNotice(result.data.message ?? 'Markdown intake created a new disposable project.');
    } catch {
      setManuscriptStructureNotice('The Markdown intake could not be created. No active manuscript was changed.');
    }
  }, [applySnapshot, bridge, hasLocalUnsaved, manuscriptStructureBridge]);

  const structureMutationBinding = useCallback((prefix: string) => {
    if (!snapshotRef.current.project || !manuscriptStructure) return null;
    return {
      operationId: operationId(prefix),
      projectId: snapshotRef.current.project.projectId,
      projectPath: snapshotRef.current.project.path,
      generation: snapshotRef.current.generation,
      expectedRevision: manuscriptStructure.document.revision,
    };
  }, [manuscriptStructure]);

  const applyManuscriptStructureResult = useCallback((result: Awaited<ReturnType<ManuscriptStructureBridge['get']>>) => {
    if (result.ok) {
      setManuscriptStructure(result.data);
      setManuscriptStructureOrder(null);
      setManuscriptStructureNotice(result.data.message);
    } else {
      setManuscriptStructureNotice(result.error.message);
    }
  }, []);

  const discoverManuscriptStructure = useCallback(async () => {
    if (!manuscriptStructureBridge) return;
    const binding = structureMutationBinding('manuscript-structure-discover');
    if (!binding) return;
    setManuscriptStructureLoading(true);
    try {
      applyManuscriptStructureResult(await manuscriptStructureBridge.discover(binding));
    } finally {
      setManuscriptStructureLoading(false);
    }
  }, [applyManuscriptStructureResult, manuscriptStructureBridge, structureMutationBinding]);

  const mutateStructureProposal = useCallback(async (proposalId: string, mutation: 'accept' | 'reject') => {
    if (!manuscriptStructureBridge) return;
    const binding = structureMutationBinding(`manuscript-structure-${mutation}`);
    if (!binding) return;
    setManuscriptStructureLoading(true);
    try {
      const request = { ...binding, proposalId };
      applyManuscriptStructureResult(await (mutation === 'accept'
        ? manuscriptStructureBridge.acceptProposal(request)
        : manuscriptStructureBridge.rejectProposal(request)));
    } finally {
      setManuscriptStructureLoading(false);
    }
  }, [applyManuscriptStructureResult, manuscriptStructureBridge, structureMutationBinding]);

  const renameStructureProposal = useCallback(async (proposalId: string, label: string) => {
    if (!manuscriptStructureBridge) return;
    const binding = structureMutationBinding('manuscript-structure-rename');
    if (!binding) return;
    setManuscriptStructureLoading(true);
    try {
      applyManuscriptStructureResult(await manuscriptStructureBridge.renameProposal({ ...binding, proposalId, label }));
    } finally {
      setManuscriptStructureLoading(false);
    }
  }, [applyManuscriptStructureResult, manuscriptStructureBridge, structureMutationBinding]);

  const setStructureBoundary = useCallback(async (start: number, end: number, label: string) => {
    if (!manuscriptStructureBridge) return;
    const binding = structureMutationBinding('manuscript-structure-boundary');
    if (!binding) return;
    setManuscriptStructureLoading(true);
    try {
      applyManuscriptStructureResult(await manuscriptStructureBridge.setBoundary({ ...binding, start, end, label }));
    } finally {
      setManuscriptStructureLoading(false);
    }
  }, [applyManuscriptStructureResult, manuscriptStructureBridge, structureMutationBinding]);

  const selectStructureBoundary = useCallback((offset: number, role?: 'start' | 'end') => {
    if (role === 'start') {
      setStructureBoundaryStart(offset);
      setStructureBoundaryEnd(null);
      return;
    }
    if (role === 'end') {
      if (structureBoundaryStart === null || offset <= structureBoundaryStart) {
        setStructureBoundaryStart(null);
        setStructureBoundaryEnd(null);
        setManuscriptStructureNotice('Select the end boundary after the start boundary. The reversed selection was cleared.');
        return;
      }
      setStructureBoundaryEnd(offset);
      return;
    }
    if (structureBoundaryStart === null || structureBoundaryEnd !== null) {
      setStructureBoundaryStart(offset);
      setStructureBoundaryEnd(null);
      return;
    }
    if (offset <= structureBoundaryStart) {
      setStructureBoundaryStart(null);
      setStructureBoundaryEnd(null);
      setManuscriptStructureNotice('Select the end boundary after the start boundary. The reversed selection was cleared.');
      return;
    }
    setStructureBoundaryEnd(offset);
  }, [structureBoundaryEnd, structureBoundaryStart]);

  const selectManuscriptStructureProposal = useCallback((proposalId: string) => {
    if (!structureProposalIds.includes(proposalId)) {
      setSelectedManuscriptProposalId(null);
      return;
    }
    setSelectedManuscriptProposalId(proposalId);
    const orderedIds = manuscriptStructureOrder ?? structureProposalIds;
    const proposalIndex = orderedIds.indexOf(proposalId);
    if (proposalIndex >= 0) setManuscriptStructurePage(Math.floor(proposalIndex / 12));
    window.requestAnimationFrame(() => {
      const disclosure = document.querySelector<HTMLDetailsElement>('details.stage19-manuscript-structure');
      if (disclosure && !disclosure.open) disclosure.open = true;
      window.requestAnimationFrame(() => {
        const railTarget = document.querySelector<HTMLElement>(`[data-structure-proposal-id="${CSS.escape(proposalId)}"]`);
        railTarget?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const canvasTarget = Array.from(document.querySelectorAll<HTMLElement>('[data-imported-proposal-id]'))
          .find((element) => element.dataset.importedProposalId === proposalId);
        canvasTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }, [manuscriptStructureOrder, structureProposalIds]);

  const pinSelectedStructureBoundary = useCallback(async (label: string) => {
    if (structureBoundaryStart === null || structureBoundaryEnd === null) {
      setManuscriptStructureNotice('Select a visible start and end boundary first.');
      return;
    }
    await setStructureBoundary(structureBoundaryStart, structureBoundaryEnd, label);
  }, [setStructureBoundary, structureBoundaryEnd, structureBoundaryStart]);

  const splitStructureProposal = useCallback(async (proposalId: string, boundary: number) => {
    if (!manuscriptStructureBridge) return;
    const binding = structureMutationBinding('manuscript-structure-split');
    if (!binding) return;
    setManuscriptStructureLoading(true);
    try {
      applyManuscriptStructureResult(await manuscriptStructureBridge.splitGroup({ ...binding, proposalId, boundary }));
    } finally {
      setManuscriptStructureLoading(false);
    }
  }, [applyManuscriptStructureResult, manuscriptStructureBridge, structureMutationBinding]);

  const mergeStructureProposals = useCallback(async (proposalIds: readonly string[]) => {
    if (!manuscriptStructureBridge) return;
    const binding = structureMutationBinding('manuscript-structure-merge');
    if (!binding) return;
    setManuscriptStructureLoading(true);
    try {
      applyManuscriptStructureResult(await manuscriptStructureBridge.mergeGroups({ ...binding, proposalIds }));
    } finally {
      setManuscriptStructureLoading(false);
    }
  }, [applyManuscriptStructureResult, manuscriptStructureBridge, structureMutationBinding]);

  const saveStructureOrder = useCallback(async () => {
    const orderedProposalIds = manuscriptStructureOrder;
    if (!orderedProposalIds || !manuscriptStructureBridge) return;
    if (!manuscriptStructureBridge) return;
    const binding = structureMutationBinding('manuscript-structure-reorder');
    if (!binding) return;
    setManuscriptStructureLoading(true);
    try {
      const result = await manuscriptStructureBridge.reorderGroups({ ...binding, orderedProposalIds });
      applyManuscriptStructureResult(result);
      if (result.ok) setManuscriptStructureOrder(null);
    } finally {
      setManuscriptStructureLoading(false);
    }
  }, [applyManuscriptStructureResult, manuscriptStructureBridge, manuscriptStructureOrder, structureMutationBinding]);

  const applyManuscriptStructure = useCallback(async () => {
    if (!manuscriptStructureBridge) return;
    if (hasLocalUnsaved || dirtyUnitIds.size > 0 || !['clean', 'saved'].includes(snapshot.saveState.status)) {
      setManuscriptStructureNotice('Save all manuscript Units before applying structure. No structural files were changed.');
      return;
    }
    if (!bridge?.reloadActiveProject) {
      setManuscriptStructureNotice('The active project reload bridge is unavailable. No structural files were changed.');
      return;
    }
    const binding = structureMutationBinding('manuscript-structure-apply');
    if (!binding) return;
    setManuscriptStructureLoading(true);
    try {
      const result = await manuscriptStructureBridge.apply(binding);
      applyManuscriptStructureResult(result);
      if (result.ok) {
        const refreshed = await bridge.reloadActiveProject({
          projectId: binding.projectId,
          projectPath: result.data.projectPath,
          generation: binding.generation,
          operationId: operationId('manuscript-structure-refresh'),
        });
        if (refreshed.ok) {
          applySnapshot(refreshed.snapshot);
        } else {
          setManuscriptStructureNotice(`Structure was applied to disk, but the active session could not reload: ${refreshed.error.message} Do not retry Apply; reopen the project after resolving this error.`);
        }
      }
    } finally {
      setManuscriptStructureLoading(false);
    }
  }, [applyManuscriptStructureResult, applySnapshot, bridge, dirtyUnitIds, hasLocalUnsaved, manuscriptStructureBridge, snapshot.saveState.status, structureMutationBinding]);

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
        window.requestAnimationFrame(() => {
          const target = document.getElementById(`stage19-manuscript-unit-${unitId}`);
          if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        setNotice(resultMessage(result));
      } catch {
        setNotice('The manuscript unit could not be selected. Your current work was preserved; try again.');
      }
    },
    [applySnapshot, bridge, flushRecoveryCheckpoint],
  );

  const applyLivingOutlineResult = useCallback((result: Awaited<ReturnType<LivingOutlineBridge['get']>>) => {
    if (result.ok) {
      setLivingOutline(result.data);
      setLivingOutlineNotice(result.data.message);
      return true;
    }
    setLivingOutlineNotice(result.error.message);
    return false;
  }, []);

  const livingOutlineMutationBinding = useCallback(() => {
    const current = snapshotRef.current;
    if (!current.project || !livingOutline || livingOutline.availability !== 'ready') return null;
    return {
      projectId: current.project.projectId,
      projectPath: current.project.path,
      generation: current.generation,
      expectedRevision: livingOutline.document.revision,
    };
  }, [livingOutline]);

  const selectLivingOutlineFields = useCallback((itemId: string) => {
    const item = livingOutline?.document.items.find((candidate) => candidate.id === itemId);
    if (!item) return null;
    setSelectedRailKind('outline');
    setSelectedOutlineItemId(item.id);
    setOutlineLabel(item.label);
    setOutlineBody(item.body ?? '');
    setOutlineKind(item.kind);
    setOutlineState(item.state);
    return item;
  }, [livingOutline]);

  const clearOutlineSelection = useCallback(() => {
    setSelectedRailKind('unit');
    setSelectedOutlineItemId(activeLinkedOutlineItemId);
    setOutlineEditingItemId(null);
    setOutlineAdvancedItemId(null);
    setOutlineLabel('');
    setOutlineBody('');
  }, [activeLinkedOutlineItemId]);

  const toggleMultiSelectMode = useCallback(() => {
    setMultiSelectMode((current) => {
      if (current) setSelectedStoryItemIds([]);
      return !current;
    });
  }, []);

  const toggleStorySelection = useCallback((itemId: string) => {
    setSelectedStoryItemIds((current) => current.includes(itemId)
      ? current.filter((candidate) => candidate !== itemId)
      : [...current, itemId]);
  }, []);

  const clearStorySelection = useCallback(() => setSelectedStoryItemIds([]), []);

  const toggleStoryRailHelp = useCallback(() => setStoryRailHelpOpen((current) => !current), []);

  const createLivingOutlineItem = useCallback(async () => {
    const binding = livingOutlineMutationBinding();
    if (!binding || !livingOutlineBridge) return;
    const selectedProse = aiSelection?.selectedText.trim() ?? '';
    const manuscriptUnitId = snapshotRef.current.activeUnitId;
    const sourceAnchor = manuscriptUnitId && aiSelection
      ? await buildLivingOutlineSourceAnchor(
          manuscriptUnitId,
          buffersRef.current[manuscriptUnitId] ?? '',
          aiSelection.selectionStart,
          aiSelection.selectionEnd,
        )
      : null;
    setLivingOutlineLoading(true);
    try {
      const result = await livingOutlineBridge.createItem({
        ...binding,
        operationId: operationId('living-outline-create'),
        label: defaultOutlineLabel(aiSelection),
        body: '',
        kind: 'fragment',
        state: selectedProse ? 'proposed' : 'planned',
        manuscriptUnitId,
        sourceAnchor,
      });
      if (applyLivingOutlineResult(result) && result.ok) {
        const created = result.data.document.items.at(-1);
        setSelectedOutlineItemId(created?.id ?? null);
        setOutlineEditingItemId(created?.id ?? null);
        setOutlineAdvancedItemId(null);
        setOutlineLabel(created?.label ?? '');
        setOutlineBody(created?.body ?? '');
        setOutlineKind(created?.kind ?? 'fragment');
        setOutlineState(created?.state ?? 'planned');
        if (created) setPendingCreation({ kind: 'outline', id: created.id });
        setLivingOutlineNotice(
          selectedProse
            ? 'Note created from the selected passage. Name it when ready; manuscript text was not changed.'
            : manuscriptUnitId
              ? 'Note created with the current writing. Name it when ready.'
              : 'Note created as unlinked. Name it when ready.',
        );
      }
    } catch {
      setLivingOutlineNotice('The note could not be saved. Manuscript text was not changed.');
    } finally {
      setLivingOutlineLoading(false);
    }
  }, [aiSelection, applyLivingOutlineResult, livingOutlineBridge, livingOutlineMutationBinding]);

  const selectLivingOutlineItem = useCallback(async (itemId: string) => {
    const item = selectLivingOutlineFields(itemId);
    if (!item) return;
    setOutlineEditingItemId(null);
    setOutlineAdvancedItemId(null);
    if (item.manuscriptUnitId && item.manuscriptUnitId !== snapshotRef.current.activeUnitId) {
      await handleSelectUnit(item.manuscriptUnitId);
    }
    if (item.sourceAnchor && item.manuscriptUnitId) {
      const currentProse = buffersRef.current[item.manuscriptUnitId] ?? splitDraft(
        snapshotRef.current.project?.drafts?.[item.manuscriptUnitId] ?? '',
      ).body;
      const resolution = await resolveLivingOutlineAnchor(item.sourceAnchor, currentProse);
      if (resolution.status === 'exact' || resolution.status === 'relocated') {
        setSourceReturnRequest({
          schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
          requestId: operationId('story-anchor-return'),
          projectId: snapshotRef.current.project!.projectId,
          generation: snapshotRef.current.generation,
          status: 'exact',
          message: resolution.status === 'exact'
            ? `Returned to ${item.label}.`
            : `Returned to ${item.label} after the unchanged passage moved.`,
          anchor: {
            schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
            projectId: snapshotRef.current.project!.projectId,
            generation: snapshotRef.current.generation,
            unitId: item.manuscriptUnitId,
            editorRevision: editRevisionRef.current[item.manuscriptUnitId] ?? 0,
            selectionStart: resolution.selectionStart,
            selectionEnd: resolution.selectionEnd,
            selectionFingerprint: item.sourceAnchor.selectionFingerprint,
          },
        });
        return;
      }
      setSourceReturnRequest(null);
      setLivingOutlineNotice(
        resolution.status === 'ambiguous'
          ? `${item.label} matches more than one place. The Note remains, but Black Skies did not guess which passage you meant.`
          : `${item.label} no longer matches its source passage. The Note remains, but its place needs review; Black Skies did not guess.`,
      );
    }
    window.setTimeout(() => focusWritingEditor(item.manuscriptUnitId ?? undefined), 0);
  }, [handleSelectUnit, selectLivingOutlineFields]);

  const activateUnitInStream = useCallback(async (unitId: string) => {
    clearOutlineSelection();
    if (unitId !== snapshotRef.current.activeUnitId) {
      await handleSelectUnit(unitId);
    }
    window.requestAnimationFrame(() => focusWritingEditor(unitId));
  }, [clearOutlineSelection, handleSelectUnit]);

  const editLivingOutlineItem = useCallback((itemId: string) => {
    if (!selectLivingOutlineFields(itemId)) return;
    setOutlineAdvancedItemId(null);
    setOutlineEditingItemId(itemId);
  }, [selectLivingOutlineFields]);

  const openLivingOutlineOptions = useCallback((itemId: string) => {
    if (!selectLivingOutlineFields(itemId)) return;
    setOutlineEditingItemId(null);
    setOutlineAdvancedItemId(itemId);
  }, [selectLivingOutlineFields]);

  const updateLivingOutlineItem = useCallback(async (itemId: string) => {
    const binding = livingOutlineMutationBinding();
    const item = livingOutline?.document.items.find((candidate) => candidate.id === itemId);
    if (!binding || !livingOutlineBridge || !item || !outlineLabel.trim()) return;
    setLivingOutlineLoading(true);
    try {
      const updated = await livingOutlineBridge.updateItem({
        ...binding,
        operationId: operationId('living-outline-update'),
        itemId,
        label: outlineLabel,
        body: outlineBody,
        kind: outlineKind,
        state: outlineState,
      });
      if (applyLivingOutlineResult(updated)) {
        setOutlineEditingItemId(null);
        setOutlineAdvancedItemId(null);
        setPendingCreation((pending) => pending?.kind === 'outline' && pending.id === itemId ? null : pending);
        setLivingOutlineNotice('Note saved. Manuscript text was not changed.');
      }
    } catch {
      setLivingOutlineNotice('The note could not be updated. Manuscript text was not changed.');
    } finally {
      setLivingOutlineLoading(false);
    }
  }, [applyLivingOutlineResult, livingOutline, livingOutlineBridge, livingOutlineMutationBinding, outlineBody, outlineKind, outlineLabel, outlineState]);

  const moveLivingOutlineItem = useCallback(async (itemId: string, direction: -1 | 1) => {
    const binding = livingOutlineMutationBinding();
    if (!binding || !livingOutlineBridge || !livingOutline?.document.items.some((item) => item.id === itemId)) return;
    setSelectedOutlineItemId(itemId);
    setLivingOutlineLoading(true);
    try {
      if (applyLivingOutlineResult(await livingOutlineBridge.moveItem({
        ...binding,
        operationId: operationId('living-outline-move'),
        itemId,
        direction,
      }))) {
        setLivingOutlineNotice('Planning order saved. Accepted manuscript order was not changed.');
      }
    } catch {
      setLivingOutlineNotice('The planning order could not be saved. Accepted manuscript order was not changed.');
    } finally {
      setLivingOutlineLoading(false);
    }
  }, [applyLivingOutlineResult, livingOutline, livingOutlineBridge, livingOutlineMutationBinding]);

  const moveLivingOutlineItemTo = useCallback(async (itemId: string, targetIndex: number) => {
    const binding = livingOutlineMutationBinding();
    if (!binding || !livingOutlineBridge || !livingOutline) return;
    let working = livingOutline;
    let currentIndex = working.document.items.findIndex((item) => item.id === itemId);
    const boundedTarget = Math.max(0, Math.min(targetIndex, working.document.items.length - 1));
    if (currentIndex < 0 || currentIndex === boundedTarget) return;
    setSelectedOutlineItemId(itemId);
    setLivingOutlineLoading(true);
    try {
      while (currentIndex !== boundedTarget) {
        const direction: -1 | 1 = currentIndex < boundedTarget ? 1 : -1;
        const result = await livingOutlineBridge.moveItem({
          ...binding,
          expectedRevision: working.document.revision,
          operationId: operationId('living-outline-drag-move'),
          itemId,
          direction,
        });
        if (!result.ok) {
          applyLivingOutlineResult(result);
          return;
        }
        working = result.data;
        currentIndex += direction;
      }
      applyLivingOutlineResult({ ok: true, data: working });
      setLivingOutlineNotice('Planning order saved. Accepted manuscript order was not changed.');
    } catch {
      setLivingOutlineNotice('The planning order could not be saved. Accepted manuscript order was not changed.');
    } finally {
      setLivingOutlineLoading(false);
    }
  }, [applyLivingOutlineResult, livingOutline, livingOutlineBridge, livingOutlineMutationBinding]);

  const linkLivingOutlineItem = useCallback(async (itemId: string, manuscriptUnitId: string | null) => {
    const binding = livingOutlineMutationBinding();
    if (!binding || !livingOutlineBridge || !livingOutline?.document.items.some((item) => item.id === itemId)) return;
    setLivingOutlineLoading(true);
    try {
      if (applyLivingOutlineResult(await livingOutlineBridge.linkItem({
        ...binding,
        operationId: operationId('living-outline-link'),
        itemId,
        manuscriptUnitId,
      }))) {
        setLivingOutlineNotice(
          manuscriptUnitId
          ? 'Note placed with the current writing. Manuscript text was not changed.'
            : 'Note is now unlinked. Manuscript text was not changed.',
        );
      }
    } catch {
      setLivingOutlineNotice('The outline relationship could not be saved. Manuscript text was not changed.');
    } finally {
      setLivingOutlineLoading(false);
    }
  }, [applyLivingOutlineResult, livingOutline, livingOutlineBridge, livingOutlineMutationBinding]);

  const deleteLivingOutlineItem = useCallback(async (itemId: string) => {
    const binding = livingOutlineMutationBinding();
    if (!binding || !livingOutlineBridge || !livingOutline?.document.items.some((item) => item.id === itemId)) return;
    setLivingOutlineLoading(true);
    try {
      if (applyLivingOutlineResult(await livingOutlineBridge.deleteItem({
        ...binding,
        operationId: operationId('living-outline-delete'),
        itemId,
      }))) {
        setSelectedOutlineItemId(null);
        setOutlineEditingItemId(null);
        setOutlineAdvancedItemId(null);
        setOutlineLabel('');
        setOutlineBody('');
        setPendingCreation((pending) => pending?.kind === 'outline' && pending.id === itemId ? null : pending);
      }
    } catch {
      setLivingOutlineNotice('The note could not be removed. Manuscript text was not changed.');
    } finally {
      setLivingOutlineLoading(false);
    }
  }, [applyLivingOutlineResult, livingOutline, livingOutlineBridge, livingOutlineMutationBinding]);

  const cancelOutlineItemEdit = useCallback(async () => {
    const pending = pendingCreation;
    if (pending?.kind === 'outline' && pending.id === outlineEditingItemId) {
      await deleteLivingOutlineItem(pending.id);
      setPendingCreation(null);
    }
    setOutlineEditingItemId(null);
    setOutlineAdvancedItemId(null);
  }, [deleteLivingOutlineItem, outlineEditingItemId, pendingCreation]);

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
      const projection = critiqueReviewState?.availability === 'available'
        ? critiqueReviewState.projection
        : undefined;
      if (
        critiqueReviewBridge &&
        projection?.unitId === unitId &&
        projection.lifecycleState !== 'invalidated'
      ) {
        void critiqueReviewBridge.markStale({
          schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
          operationId: operationId('critique-review-stale'),
          projectId: projection.projectId,
          generation: projection.generation,
          requestId: projection.requestId,
          selectionFingerprint: projection.selectionFingerprint,
        }).catch(() => undefined);
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
    [
      aiBridge,
      aiResult,
      critiqueReviewBridge,
      critiqueReviewState,
      reportDirty,
      scheduleRecoveryCheckpoint,
    ],
  );

  const saveUnit = useCallback(
    async (unitId: string, settledEditorBody?: string) => {
      if (
        typeof settledEditorBody === 'string' &&
        settledEditorBody !== buffersRef.current[unitId]
      ) {
        handleBufferChange(unitId, settledEditorBody);
      }
      const current = snapshotRef.current;
      const api = bridge?.saveUnit;
      if (!current.project || !api || typeof buffersRef.current[unitId] !== 'string') {
        setNotice('This manuscript unit cannot be saved in the current session.');
        return;
      }
      const startingGeneration = current.generation;
      const startingEditRevision = editRevisionRef.current[unitId] ?? 0;
      await flushDirtyReports(unitId);
      if (snapshotRef.current.generation !== startingGeneration) {
        return;
      }
      const body = buffersRef.current[unitId];
      if (typeof body !== 'string') {
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
    [
      applySnapshot,
      bridge,
      flushDirtyReports,
      flushRecoveryCheckpoint,
      handleBufferChange,
      reportDirty,
    ],
  );

  useEffect(() => {
    if (windowRole !== 'writing') return;
    const handler = (event: KeyboardEvent) => {
      // DraftEditor owns Ctrl/Cmd+S while the editor has focus and supplies the
      // exact CodeMirror document. Do not start a second, competing save after
      // that handled editor event bubbles to the window.
      if (event.defaultPrevented) return;
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

  const editUnit = useCallback((unitId: string) => {
    const unit = snapshotRef.current.project?.units.find((candidate) => candidate.id === unitId);
    if (!unit) return;
    clearOutlineSelection();
    setRenameTitle(unit.title);
    setUnitAdvancedId(null);
    setUnitEditingId(unitId);
  }, [clearOutlineSelection]);

  const openUnitOptions = useCallback((unitId: string) => {
    const unit = snapshotRef.current.project?.units.find((candidate) => candidate.id === unitId);
    if (!unit) return;
    clearOutlineSelection();
    setRenameTitle(unit.title);
    setUnitEditingId(null);
    setUnitAdvancedId(unitId);
  }, [clearOutlineSelection]);

  const handleCreateUnit = useCallback(async () => {
    const binding = bindingFor(snapshotRef.current, 'create-unit');
    if (!binding || !bridge?.createUnit) return;
    try {
      const result = await bridge.createUnit({ ...binding, title: '' });
      applySnapshot(result.snapshot);
      if (result.ok) {
        setRenameTitle('');
        setUnitAdvancedId(null);
        setUnitEditingId(result.data.unitId);
        setPendingCreation({ kind: 'unit', id: result.data.unitId });
      }
      setNotice(resultMessage(result));
    } catch {
      setNotice('The manuscript unit could not be created. No existing manuscript content was changed.');
    }
  }, [applySnapshot, bridge]);

  const handleRenameUnit = useCallback(async (unitId: string) => {
    const binding = bindingFor(snapshotRef.current, 'rename-unit');
    if (!binding || !unitId || !bridge?.renameUnit) return;
    try {
      const result = await bridge.renameUnit({ ...binding, unitId, title: renameTitle });
      applySnapshot(result.snapshot);
      if (result.ok) {
        setUnitEditingId(null);
        setPendingCreation((pending) => pending?.kind === 'unit' && pending.id === unitId ? null : pending);
      }
      setNotice(resultMessage(result));
    } catch {
      setNotice('The manuscript title could not be updated. Your current work was preserved.');
    }
  }, [applySnapshot, bridge, renameTitle]);

  const cancelUnitEdit = useCallback(async () => {
    const pending = pendingCreation;
    if (pending?.kind !== 'unit' || pending.id !== unitEditingId) {
      setUnitEditingId(null);
      return;
    }
    const binding = bindingFor(snapshotRef.current, 'cancel-create-unit');
    if (!binding || !bridge?.deleteUnit) return;
    try {
      const result = await bridge.deleteUnit({ ...binding, unitId: pending.id, confirmNonEmpty: false });
      applySnapshot(result.snapshot);
      if (result.ok) {
        setPendingCreation(null);
        setUnitEditingId(null);
        setUnitAdvancedId(null);
        setNotice('Cancelled Unit creation. No manuscript text was kept.');
      }
    } catch {
      setNotice('The new Unit could not be cancelled safely. No existing manuscript content was changed.');
    }
  }, [applySnapshot, bridge, pendingCreation, unitEditingId]);

  const handleDeleteUnit = useCallback(async (unitId: string) => {
    const initial = snapshotRef.current;
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
      if (result.ok) {
        setUnitEditingId(null);
        setUnitAdvancedId(null);
      }
      setNotice(resultMessage(result));
    } catch {
      setNotice('The manuscript unit could not be deleted. Its content remains available.');
    }
  }, [applySnapshot, bridge, flushRecoveryCheckpoint]);

  const deleteSelectedStoryItem = useCallback(async () => {
    const selectedOutlineId = selectedRailKind === 'outline'
      ? selectedOutlineItemId ?? outlineAdvancedItemId
      : null;
    const selectedOutline = livingOutline?.document.items.find((item) => item.id === selectedOutlineId);
    if (selectedOutline) {
      if (!window.confirm(`Delete “${selectedOutline.label}” from the story plan?`)) return;
      await deleteLivingOutlineItem(selectedOutline.id);
      return;
    }
    const unitId = snapshotRef.current.activeUnitId;
    if (unitId) await handleDeleteUnit(unitId);
  }, [deleteLivingOutlineItem, handleDeleteUnit, livingOutline, outlineAdvancedItemId, selectedOutlineItemId, selectedRailKind]);

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
      generation: current.generation,
    };
    const operation = markdownExportOperationRef.current + 1;
    markdownExportOperationRef.current = operation;
    const sourceIsCurrent = () => {
      const latest = snapshotRef.current;
      return (
        markdownExportOperationRef.current === operation &&
        latest.generation === source.generation &&
        latest.project?.projectId === source.projectId
      );
    };
    setExportingMarkdown(true);
    setMarkdownExportNotice(null);
    try {
      const result = await api({ ...binding, revision: current.revision });
      if (!sourceIsCurrent()) return;
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
      if (!sourceIsCurrent()) return;
      setMarkdownExportNotice({
        ...source,
        tone: 'failure',
        message: 'Markdown export could not reach the application service. No completion was recorded.',
      });
    } finally {
      if (markdownExportOperationRef.current === operation) {
        setExportingMarkdown(false);
      }
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

  const activeReviewReference = useCallback((): CritiqueReviewReferenceV1 | null => {
    const projection = critiqueReviewState?.availability === 'available'
      ? critiqueReviewState.projection
      : undefined;
    if (!projection) return null;
    return {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      operationId: operationId('critique-review-action'),
      projectId: projection.projectId,
      generation: projection.generation,
      requestId: projection.requestId,
      selectionFingerprint: projection.selectionFingerprint,
    };
  }, [critiqueReviewState]);

  const copyAiResult = useCallback(async () => {
    const projection = critiqueReviewState?.availability === 'available'
      ? critiqueReviewState.projection
      : undefined;
    if (!projection?.resultText || !projection.allowedActions.includes('copy-result')) return;
    const resultText = `Advisory critique (author review only)\n\n${projection.resultText}`;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Copy is unavailable in this window.');
      await navigator.clipboard.writeText(resultText);
      setFeedbackNoteNotice('Critique copied. This copy is temporary and does not alter the manuscript.');
    } catch {
      setFeedbackNoteNotice('Could not copy the critique. Select and copy the text manually.');
    }
  }, [critiqueReviewState]);

  const saveFeedbackNote = useCallback(async () => {
    const projection = critiqueReviewState?.availability === 'available'
      ? critiqueReviewState.projection
      : undefined;
    if (
      !critiqueReviewBridge ||
      !projection?.resultText ||
      !projection.allowedActions.includes('save-feedback-note')
    ) return;
    const body = feedbackNoteBody.trim();
    if (!body) {
      setFeedbackNoteNotice('Write the concise advisory note you want to keep.');
      return;
    }
    setFeedbackNoteSaving(true);
    setFeedbackNoteNotice(null);
    try {
      const result = await critiqueReviewBridge.saveFeedbackNote({
        schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
        operationId: operationId('feedback-note'),
        projectId: projection.projectId,
        generation: projection.generation,
        unitId: projection.unitId,
        sourceCritiqueRequestId: projection.requestId,
        selectionFingerprint: projection.selectionFingerprint,
        visibleResultFingerprint: await fingerprintVisibleText(projection.resultText),
        body,
      });
      if (result.ok) {
        setFeedbackNoteNotice('Advisory project note saved. It is separate from manuscript and outline files.');
        setFeedbackNoteBody('');
      } else {
        setFeedbackNoteNotice(result.error.message);
      }
    } catch {
      setFeedbackNoteNotice('The feedback note could not be saved. Your manuscript is unchanged.');
    } finally {
      setFeedbackNoteSaving(false);
    }
  }, [critiqueReviewBridge, critiqueReviewState, feedbackNoteBody]);

  const dismissCritiqueReview = useCallback(async () => {
    const reference = activeReviewReference();
    if (!critiqueReviewBridge || !reference) return;
    try {
      const result = await critiqueReviewBridge.dismiss(reference);
      setCritiqueReviewState(result.state);
      setFeedbackNoteBody('');
      setFeedbackNoteNotice(
        result.ok
          ? 'Review dismissed. The Writing owner and manuscript were not changed.'
          : result.error.message,
      );
    } catch {
      setFeedbackNoteNotice('Review could not be dismissed. Writing remains unchanged.');
    }
  }, [activeReviewReference, critiqueReviewBridge]);

  const returnToCritiqueSource = useCallback(async () => {
    const reference = activeReviewReference();
    if (!critiqueReviewBridge || !reference) return;
    try {
      const result = await critiqueReviewBridge.returnToSource(reference);
      setCritiqueReviewState(result.state);
      if (!result.ok) setFeedbackNoteNotice(result.error.message);
    } catch {
      setFeedbackNoteNotice('Writing Studio could not be restored from this Review.');
    }
  }, [activeReviewReference, critiqueReviewBridge]);

  const activateSurface = useCallback(async (
    targetSurface: SplitCommandLogicalSurface,
    placement: 'current-window' | 'secondary-window',
  ): Promise<boolean> => {
    if (!surfaceBridge) {
      setSurfaceHostError('Surface switching is unavailable in this window.');
      return false;
    }
    const current = snapshotRef.current;
    setSurfaceHostError(null);
    try {
      const result = await surfaceBridge.activateSurface({
        operationId: operationId(`surface-${targetSurface}-${placement}`),
        projectId: current.project?.projectId ?? null,
        generation: current.generation,
        targetSurface,
        placement,
      });
      setSurfaceHostState(result.state);
      if (!result.ok) setSurfaceHostError(result.error.message);
      return result.ok;
    } catch {
      setSurfaceHostError(
        'The requested surface could not be moved. Writing and saved project truth remain available.',
      );
      return false;
    }
  }, [surfaceBridge]);

  const submitCompanionOrientation = useCallback(async () => {
    const current = snapshotRef.current;
    if (!current.project) {
      setCompanionNotice('Open a project before asking for local orientation. Writing remains available.');
      return;
    }
    const request = routeCompanionRequest(companionPrompt, {
      requestId: operationId('companion-orientation'),
      projectId: current.project.projectId,
      generation: current.generation,
    });
    if (!request.text) {
      setCompanionNotice('Ask where you are in this project, where you were, or what you are working on.');
      return;
    }
    const result = deriveCompanionOrientationResult(request, current, livingOutline);
    setCompanionNotice(null);
    setCompanionResult(result);
    setCompanionPrompt('');
    const opened = await activateSurface('command', 'current-window');
    if (!opened) {
      setCompanionResult(null);
      setCompanionNotice('Companion could not open Command Center. The request was not saved and writing remains unchanged.');
    }
  }, [activateSurface, companionPrompt, livingOutline]);

  const dismissCompanion = useCallback(() => {
    setCompanionResult(null);
    setCompanionNotice(null);
  }, []);

  const returnToCompanionWriting = useCallback(async () => {
    dismissCompanion();
    await activateSurface('writing', 'current-window');
  }, [activateSurface, dismissCompanion]);

  const autoOpenedReviewRequestRef = useRef<string | null>(null);
  useEffect(() => {
    const projection = critiqueReviewState?.availability === 'available'
      ? critiqueReviewState.projection
      : undefined;
    if (
      windowRole !== 'writing' ||
      !projection ||
      autoOpenedReviewRequestRef.current === projection.requestId
    ) return;
    autoOpenedReviewRequestRef.current = projection.requestId;
    setCommandWorkspace('review');
    if (surfaceHostState?.commandPlacement !== 'secondary-window') {
      void activateSurface('command', 'current-window');
    }
  }, [activateSurface, critiqueReviewState, surfaceHostState?.commandPlacement, windowRole]);

  const handleSourceSelectionRestoreResult = useCallback((requestId: string, restored: boolean) => {
    if (sourceReturnRequest?.requestId !== requestId) return;
    setSourceReturnRequest(null);
    if (restored) {
      setNotice(sourceReturnRequest.message);
      return;
    }
    setNotice('Returned to Writing Studio, but the reviewed passage changed and could not be selected exactly.');
    const reference = activeReviewReference();
    if (reference && critiqueReviewBridge) {
      void critiqueReviewBridge.markStale(reference).catch(() => undefined);
    }
  }, [activeReviewReference, critiqueReviewBridge, sourceReturnRequest]);

  const viewModel: Stage19WritingSpineViewModel = {
    phase: viewPhase,
    windowRole,
    logicalSurface,
    commandSnapshot,
    surfaceHostAvailable: Boolean(surfaceBridge && surfaceHostState),
    commandPlacement: surfaceHostState?.commandPlacement ?? 'current-window',
    secondarySurfaceStatus: surfaceHostState?.secondaryStatus ?? 'closed',
    surfaceHostNotice: surfaceHostState?.notice ?? null,
    surfaceHostError,
    snapshot,
    notice,
    activeUnit,
    writingSaveSummary,
    projectBridgeAvailable: Boolean(bridge),
    markdownExportAvailable: Boolean(bridge?.exportMarkdown),
    exportingMarkdown,
    markdownExportRequiresSave,
    markdownExportNotice,
    theme,
    focusMode,
    openWritingRail,
    companionPrompt,
    companionResult,
    companionNotice,
    recoveryDecisionUnitId,
    projectTitle,
    commandWorkspace,
    critiqueReviewState,
    sourceReturnRequest,
    renameTitle,
    unitEditingId,
    unitAdvancedId,
    dirtyUnitIds,
    recoveryBlocksEditing,
    livingOutline,
    livingOutlineLoading,
    livingOutlineNotice,
    manuscriptStructure,
    manuscriptStructureLoading,
    manuscriptStructureNotice,
    manuscriptStructurePage,
    manuscriptStructureOrder,
    structureBoundaryStart,
    structureBoundaryEnd,
    selectedManuscriptProposalId,
    selectedOutlineItem,
    selectedOutlineItemId,
    multiSelectMode,
    selectedStoryItemIds,
    storyRailHelpOpen,
    storyRailAddMenuOpen,
    outlineEditingItemId,
    outlineAdvancedItemId,
    outlineLabel,
    outlineBody,
    outlineKind,
    outlineState,
    projectedWritingOrder,
    buffers,
    activeBuffer,
    activeDirty,
    aiBridgeAvailable: Boolean(aiBridge),
    aiSelection,
    aiCredential,
    aiCredentialConfigured,
    aiPreview,
    aiClearanceConfirmed,
    aiState,
    aiResult,
    aiResultStale,
    aiNotice,
    feedbackNotesAvailable: Boolean(critiqueReviewBridge),
    feedbackNoteBody,
    feedbackNoteSaving,
    feedbackNoteNotice,
    savedFeedbackNotes,
    overlays: (
      <>
        <CloseConfirmationDialog windowRole={windowRole} {...closeConfirmation} />
        <ProjectSwitchConfirmationDialog
          open={projectSwitchConfirmationOpen}
          continueEditing={() => resolveProjectSwitchDecision(false)}
          discardChanges={() => resolveProjectSwitchDecision(true)}
        />
      </>
    ),
  };
  const viewActions: Stage19WritingSpineViewActions = {
    showWritingSurface: async () => { await activateSurface('writing', 'current-window'); },
    showCommandSurface: async () => { await activateSurface('command', 'current-window'); },
    openCommandInSecondaryWindow: async () => { await activateSurface('command', 'secondary-window'); },
    exportMarkdown: handleExportMarkdown,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
    toggleFocusMode: () => setFocusMode((current) => !current),
    toggleWritingRail: (rail) => setOpenWritingRail((current) => current === rail ? null : rail),
    closeWritingRail: (rail) => {
      setOpenWritingRail(null);
      window.requestAnimationFrame(() => {
        document.getElementById(`stage19-writing-edge-${rail}`)?.focus();
      });
    },
    setCompanionPrompt,
    submitCompanionOrientation,
    dismissCompanion,
    returnToCompanionWriting,
    submitRecoveryDecision,
    openProject: handleOpenProject,
    setProjectTitle,
    createProject: handleCreateProject,
    createUnit: handleCreateUnit,
    selectUnit: handleSelectUnit,
    clearOutlineSelection,
    setStoryRailAddMenuOpen,
    toggleMultiSelectMode,
    toggleStorySelection,
    clearStorySelection,
    toggleStoryRailHelp,
    activateUnitInStream,
    deleteSelectedStoryItem,
    setRenameTitle,
    editUnit,
    cancelUnitEdit,
    openUnitOptions,
    closeUnitOptions: () => setUnitAdvancedId(null),
    renameUnit: handleRenameUnit,
    deleteUnit: handleDeleteUnit,
    setOutlineLabel,
    setOutlineBody,
    setOutlineKind,
    setOutlineState,
    createOutlineItem: createLivingOutlineItem,
    updateOutlineItem: updateLivingOutlineItem,
    selectOutlineItem: selectLivingOutlineItem,
    editOutlineItem: editLivingOutlineItem,
    cancelOutlineItemEdit,
    openOutlineItemOptions: openLivingOutlineOptions,
    closeOutlineItemOptions: () => setOutlineAdvancedItemId(null),
    importManuscriptStructure,
    discoverManuscriptStructure,
    acceptStructureProposal: (proposalId) => mutateStructureProposal(proposalId, 'accept'),
    rejectStructureProposal: (proposalId) => mutateStructureProposal(proposalId, 'reject'),
    renameStructureProposal,
    setStructureBoundary,
    selectStructureBoundary,
    pinSelectedStructureBoundary,
    splitStructureProposal,
    mergeStructureProposals,
    stageStructureOrder: setManuscriptStructureOrder,
    saveStructureOrder,
    cancelStructureOrder: () => setManuscriptStructureOrder(null),
    setManuscriptStructurePage,
    applyManuscriptStructure,
    selectManuscriptStructureProposal,
    moveOutlineItem: moveLivingOutlineItem,
    moveOutlineItemTo: moveLivingOutlineItemTo,
    linkOutlineItem: linkLivingOutlineItem,
    deleteOutlineItem: deleteLivingOutlineItem,
    saveUnit,
    changeBuffer: handleBufferChange,
    changeAiSelection: handleAiSelection,
    setAiCredential,
    configureAiCredential,
    clearAiCredential,
    prepareAiCritique,
    setAiClearanceConfirmed,
    approveAiCritique,
    stopWaitingForAi,
    dismissAiCritique,
    selectCommandWorkspace: setCommandWorkspace,
    openReviewWorkspace: async () => {
      setCommandWorkspace('review');
      await activateSurface(
        'command',
        surfaceHostState?.commandPlacement === 'secondary-window'
          ? 'secondary-window'
          : 'current-window',
      );
    },
    dismissCritiqueReview,
    returnToCritiqueSource,
    sourceSelectionRestoreResult: handleSourceSelectionRestoreResult,
    copyAiResult,
    setFeedbackNoteBody,
    saveFeedbackNote,
    openRecent: handleOpenRecent,
    removeRecent: handleRemoveRecent,
  };

  return <Stage19WritingSpineView model={viewModel} actions={viewActions} />;
}
