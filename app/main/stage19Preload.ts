import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type {
  CaptureRecoveryCheckpointRequest,
  CreateManuscriptUnitRequest,
  CreateProjectRequest,
  DeleteManuscriptUnitRequest,
  ExportMarkdownRequest,
  ExportMarkdownResultData,
  OpenProjectRequest,
  ProjectSpineBridge,
  ProjectSpineCloseConfirmationRequest,
  ProjectSpineCloseConfirmationResponse,
  ProjectSpineResult,
  ProjectSpineSessionSnapshot,
  RecoveryCandidateDecisionRequest,
  RecoveryCandidateDecisionResultData,
  RecoveryCheckpointResultData,
  RemoveRecentProjectRequest,
  RenameManuscriptUnitRequest,
  ReorderManuscriptUnitsRequest,
  SaveManuscriptUnitRequest,
  SaveManuscriptUnitResultData,
  SelectManuscriptUnitRequest,
  SetManuscriptUnitDirtyRequest,
} from '../shared/ipc/projectSpine';
import type {
  ActivateSplitCommandSurfaceRequest,
  SplitCommandOwnershipBridge,
  SplitCommandSurfaceHostErrorCode,
  SplitCommandSurfaceHostResult,
  SplitCommandSurfaceHostState,
} from '../shared/ipc/splitCommand';
import type {
  AiCritiqueApprovalRequest,
  AiCritiqueBridge,
  AiCritiquePrepareRequest,
  AiCritiqueRequestReference,
  AiCritiqueState,
} from '../shared/ipc/aiCritique';
import type {
  CreateFeedbackNoteFromCritiqueRequest,
  FeedbackNotesBridge,
  ListFeedbackNotesRequest,
} from '../shared/ipc/feedbackNotes';
import type {
  CreateLivingOutlineItemRequest,
  DeleteLivingOutlineItemRequest,
  GetLivingOutlineRequest,
  LinkLivingOutlineItemRequest,
  LivingOutlineBridge,
  MoveLivingOutlineItemRequest,
  UpdateLivingOutlineItemRequest,
} from '../shared/ipc/livingOutline';
import type {
  SplitCommandOwnershipSyncMessage,
  SplitCommandWindowRole,
} from '../shared/splitCommandAuthority';
import type {
  CritiqueReviewActionResultV1,
  CritiqueReviewBridge,
  CritiqueReviewReferenceV1,
  CritiqueReviewSourceReturnMessageV1,
  CritiqueReviewSurfaceStateV1,
  SaveCritiqueReviewFeedbackNoteActionV1,
} from '../shared/ipc/contextualProductShell';

/**
 * Electron's sandboxed preload loader cannot require arbitrary local CommonJS
 * modules. Keep all runtime values in this emitted file; parity tests bind
 * these duplicated channel values to the canonical shared contracts.
 */
export const STAGE19_PRELOAD_CHANNELS = Object.freeze({
  projectSpine: Object.freeze({
    chooseDirectory: 'project-spine:choose-directory',
    focusWritingWindow: 'project-spine:focus-writing-window',
    openProject: 'project-spine:open-project',
    createProject: 'project-spine:create-project',
    getSession: 'project-spine:get-session',
    removeRecent: 'project-spine:remove-recent',
    selectUnit: 'project-spine:select-unit',
    setUnitDirty: 'project-spine:set-unit-dirty',
    captureRecoveryCheckpoint: 'project-spine:capture-recovery-checkpoint',
    acceptRecoveryCandidate: 'project-spine:accept-recovery-candidate',
    rejectRecoveryCandidate: 'project-spine:reject-recovery-candidate',
    saveUnit: 'project-spine:save-unit',
    createUnit: 'project-spine:create-unit',
    renameUnit: 'project-spine:rename-unit',
    reorderUnits: 'project-spine:reorder-units',
    deleteUnit: 'project-spine:delete-unit',
    exportMarkdown: 'project-spine:export-markdown',
    sessionChanged: 'project-spine:session-changed',
    closeConfirmationRequest: 'project-spine:close-confirmation-request',
    closeConfirmationResponse: 'project-spine:close-confirmation-response',
  }),
  splitCommand: Object.freeze({
    requestOwnershipSync: 'split-command:ownership-sync:request',
    ownershipSync: 'split-command:ownership-sync',
    requestSurfaceHostState: 'split-command:surface-host:request',
    activateSurface: 'split-command:surface-host:activate',
    surfaceHostChanged: 'split-command:surface-host:changed',
  }),
  critiqueReview: Object.freeze({
    requestState: 'critique-review:state:request',
    stateChanged: 'critique-review:state:changed',
    markStale: 'critique-review:mark-stale',
    dismiss: 'critique-review:dismiss',
    saveFeedbackNote: 'critique-review:save-feedback-note',
    returnToSource: 'critique-review:return-to-source',
    sourceReturnRequested: 'critique-review:source-return-requested',
  }),
  aiCritique: Object.freeze({
    credentialStatus: 'ai-critique:credential-status',
    setCredential: 'ai-critique:set-credential',
    clearCredential: 'ai-critique:clear-credential',
    prepare: 'ai-critique:prepare',
    approveAndExecute: 'ai-critique:approve-and-execute',
    cancel: 'ai-critique:cancel',
    invalidate: 'ai-critique:invalidate',
    stateChanged: 'ai-critique:state-changed',
  }),
  feedbackNotes: Object.freeze({
    createFromCritique: 'feedback-notes:create-from-critique',
    list: 'feedback-notes:list',
  }),
  livingOutline: Object.freeze({
    get: 'living-outline:get',
    createItem: 'living-outline:create-item',
    updateItem: 'living-outline:update-item',
    moveItem: 'living-outline:move-item',
    linkItem: 'living-outline:link-item',
    deleteItem: 'living-outline:delete-item',
  }),
  diagnostics: 'logging:diagnostics',
});

interface SplitLaunchContext {
  readonly windowRole: SplitCommandWindowRole;
  readonly pairId: string;
  readonly sessionGeneration: string;
}

function singleArgument(prefix: string): string | null {
  const values = process.argv
    .filter((entry) => entry.startsWith(prefix))
    .map((entry) => entry.slice(prefix.length));
  return values.length === 1 && values[0]?.trim() ? values[0] : null;
}

function readLaunchContext(): SplitLaunchContext {
  const windowRole = singleArgument('--blackskies-split-command-role=');
  const pairId = singleArgument('--blackskies-split-command-pair-id=');
  const sessionGeneration = singleArgument(
    '--blackskies-split-command-session-generation=',
  );
  if (
    (windowRole !== 'primary' && windowRole !== 'secondary') ||
    !pairId ||
    !sessionGeneration
  ) {
    throw new Error('Stage 19 preload requires one complete split-window identity.');
  }
  return { windowRole, pairId, sessionGeneration };
}

function exactKeys(value: unknown, keys: readonly string[]): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function normalizeSnapshot(
  value: unknown,
  expectedRole: 'writing' | 'command',
): ProjectSpineSessionSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Partial<ProjectSpineSessionSnapshot>;
  if (
    snapshot.schemaVersion !== 1 ||
    snapshot.role !== expectedRole ||
    !Number.isInteger(snapshot.generation) ||
    !Number.isInteger(snapshot.revision) ||
    !Array.isArray(snapshot.recentProjects) ||
    !Array.isArray(snapshot.dirtyUnitIds) ||
    !snapshot.saveState ||
    (snapshot.project !== null && (
      !snapshot.project ||
      typeof snapshot.project.projectId !== 'string' ||
      typeof snapshot.project.path !== 'string' ||
      typeof snapshot.project.title !== 'string' ||
      snapshot.project.schemaVersion !== 'ProjectMetadataSchema v1' ||
      !Array.isArray(snapshot.project.units)
    ))
  ) {
    return null;
  }

  if (expectedRole === 'command') {
    if (
      !exactKeys(snapshot, [
        'schemaVersion',
        'role',
        'generation',
        'revision',
        'project',
        'activeUnitId',
        'recentProjects',
        'dirtyUnitIds',
        'saveState',
        'lastError',
        'commandStatus',
      ]) ||
      !snapshot.commandStatus ||
      Object.prototype.hasOwnProperty.call(snapshot.project ?? {}, 'drafts') ||
      Object.prototype.hasOwnProperty.call(snapshot, 'recovery')
    ) {
      return null;
    }
  } else if (
    Object.prototype.hasOwnProperty.call(snapshot, 'commandStatus') ||
    !snapshot.recovery ||
    !Array.isArray(snapshot.recovery.candidates)
  ) {
    return null;
  }

  return snapshot as ProjectSpineSessionSnapshot;
}

function normalizeOwnership(value: unknown): SplitCommandOwnershipSyncMessage | null {
  if (!value || typeof value !== 'object') return null;
  const message = value as Partial<SplitCommandOwnershipSyncMessage> & {
    pairIdentity?: { pairId?: unknown; sessionGeneration?: unknown };
  };
  if (
    message.messageVersion !== 1 ||
    (message.messageKind !== 'ownership-snapshot' &&
      message.messageKind !== 'ownership-fallback') ||
    !message.pairIdentity ||
    typeof message.pairIdentity.pairId !== 'string' ||
    typeof message.pairIdentity.sessionGeneration !== 'string'
  ) {
    return null;
  }
  return message as SplitCommandOwnershipSyncMessage;
}

function normalizeSurfaceHostState(value: unknown): SplitCommandSurfaceHostState | null {
  if (!value || typeof value !== 'object') return null;
  const state = value as Partial<SplitCommandSurfaceHostState>;
  const commandSnapshot = normalizeSnapshot(state.commandSnapshot, 'command');
  if (
    state.schemaVersion !== 1 ||
    (state.primarySurface !== 'writing' && state.primarySurface !== 'command') ||
    (state.commandPlacement !== 'current-window' &&
      state.commandPlacement !== 'secondary-window') ||
    !['closed', 'opening', 'open', 'lost', 'unavailable'].includes(
      state.secondaryStatus ?? '',
    ) ||
    ![null, 'secondary-closed', 'secondary-lost', 'display-removed', 'secondary-launch-failed'].includes(
      state.notice ?? null,
    ) ||
    (state.projectId !== null && typeof state.projectId !== 'string') ||
    !Number.isInteger(state.generation) ||
    !Number.isInteger(state.revision) ||
    !commandSnapshot ||
    (commandSnapshot.project?.projectId ?? null) !== state.projectId ||
    commandSnapshot.generation !== state.generation ||
    commandSnapshot.revision !== state.revision
  ) {
    return null;
  }
  return { ...state, commandSnapshot } as SplitCommandSurfaceHostState;
}

function normalizeSurfaceHostResult(value: unknown): SplitCommandSurfaceHostResult | null {
  if (!value || typeof value !== 'object') return null;
  const result = value as Partial<SplitCommandSurfaceHostResult> & {
    state?: unknown;
    error?: { code?: unknown; message?: unknown };
  };
  const state = normalizeSurfaceHostState(result.state);
  if (!state) return null;
  if (result.ok === true) return { ok: true, state };
  if (
    result.ok === false &&
    result.error &&
    ['INVALID_REQUEST', 'WRONG_WINDOW_ROLE', 'STALE_PROJECT', 'STALE_GENERATION', 'SECONDARY_UNAVAILABLE'].includes(
      String(result.error.code),
    ) &&
    typeof result.error.message === 'string'
  ) {
    return {
      ok: false,
      error: {
        code: result.error.code as SplitCommandSurfaceHostErrorCode,
        message: result.error.message,
      },
      state,
    };
  }
  return null;
}

function normalizeCritiqueReviewState(value: unknown): CritiqueReviewSurfaceStateV1 | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const state = value as Partial<CritiqueReviewSurfaceStateV1>;
  const allowedStateKeys = [
    'schemaVersion',
    'projectId',
    'generation',
    'availability',
    'projection',
    'sourceReturnAnchor',
    'dismissedRequestId',
    'message',
  ];
  if (
    !Object.keys(state).every((key) => allowedStateKeys.includes(key)) ||
    state.schemaVersion !== 1 ||
    (state.projectId !== null && typeof state.projectId !== 'string') ||
    !Number.isInteger(state.generation) ||
    !['empty', 'available', 'dismissed', 'unavailable'].includes(state.availability ?? '') ||
    (state.message !== undefined && (typeof state.message !== 'string' || !state.message.trim())) ||
    (state.availability !== 'available' && (
      state.projection !== undefined || state.sourceReturnAnchor !== undefined
    ))
  ) return null;
  if (state.availability === 'available') {
    const projection = state.projection as Record<string, unknown> | undefined;
    const anchor = state.sourceReturnAnchor as Record<string, unknown> | undefined;
    const projectionKeys = [
      'schemaVersion', 'projectId', 'generation', 'requestId', 'unitId',
      'selectionFingerprint', 'sourceLabel', 'selectedCharacterCount',
      'lifecycleState', 'advisoryLabel', 'providerDisclosure', 'modelDisclosure',
      'privacyAndCostDisclosure', 'resultText', 'limitationText', 'failureClass',
      'completedAt', 'allowedActions',
    ];
    const lifecycle = projection?.lifecycleState;
    const expectedActions = lifecycle === 'completed'
      ? ['copy-result', 'save-feedback-note', 'dismiss', 'return-to-source']
      : ['dismiss', 'return-to-source'];
    if (
      !projection || !anchor ||
      !Object.keys(projection).every((key) => projectionKeys.includes(key)) ||
      projection.schemaVersion !== 1 ||
      projection.projectId !== state.projectId ||
      projection.generation !== state.generation ||
      typeof projection.requestId !== 'string' || !projection.requestId.trim() ||
      typeof projection.unitId !== 'string' || !projection.unitId.trim() ||
      typeof projection.selectionFingerprint !== 'string' || !projection.selectionFingerprint.trim() ||
      typeof projection.sourceLabel !== 'string' || !projection.sourceLabel.trim() ||
      !Number.isInteger(projection.selectedCharacterCount) || Number(projection.selectedCharacterCount) < 0 ||
      !['completed', 'failed', 'cancelled', 'expired', 'invalidated'].includes(String(lifecycle)) ||
      typeof projection.advisoryLabel !== 'string' || !projection.advisoryLabel.trim() ||
      typeof projection.providerDisclosure !== 'string' || !projection.providerDisclosure.trim() ||
      typeof projection.modelDisclosure !== 'string' || !projection.modelDisclosure.trim() ||
      typeof projection.privacyAndCostDisclosure !== 'string' || !projection.privacyAndCostDisclosure.trim() ||
      typeof projection.limitationText !== 'string' || !projection.limitationText.trim() ||
      !Array.isArray(projection.allowedActions) ||
      projection.allowedActions.length !== expectedActions.length ||
      projection.allowedActions.some((action, index) => action !== expectedActions[index]) ||
      (lifecycle === 'completed' && (
        typeof projection.resultText !== 'string' || !projection.resultText.trim() ||
        typeof projection.completedAt !== 'string' || !projection.completedAt.trim() ||
        projection.failureClass !== undefined
      )) ||
      (lifecycle !== 'completed' && (
        projection.resultText !== undefined || projection.completedAt !== undefined ||
        !['provider-unavailable', 'provider-rejected', 'request-cancelled', 'request-expired', 'source-changed', 'unknown']
          .includes(String(projection.failureClass))
      )) ||
      !exactKeys(anchor, [
        'schemaVersion', 'projectId', 'generation', 'unitId', 'editorRevision',
        'selectionStart', 'selectionEnd', 'selectionFingerprint',
      ]) ||
      anchor.schemaVersion !== 1 ||
      anchor.projectId !== state.projectId ||
      anchor.generation !== state.generation ||
      anchor.unitId !== projection.unitId ||
      anchor.selectionFingerprint !== projection.selectionFingerprint ||
      !Number.isInteger(anchor.editorRevision) || Number(anchor.editorRevision) < 0 ||
      !Number.isInteger(anchor.selectionStart) || Number(anchor.selectionStart) < 0 ||
      !Number.isInteger(anchor.selectionEnd) || Number(anchor.selectionEnd) <= Number(anchor.selectionStart)
    ) return null;
  }
  const serialized = JSON.stringify(state);
  if (/"(?:apiKey|credential|selectedText|providerBodyJson|hiddenContext|manuscript|outline|drafts)"/.test(serialized)) {
    return null;
  }
  return state as CritiqueReviewSurfaceStateV1;
}

function normalizeSourceReturnMessage(value: unknown): CritiqueReviewSourceReturnMessageV1 | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const message = value as Partial<CritiqueReviewSourceReturnMessageV1>;
  if (
    !Object.keys(message).every((key) => [
      'schemaVersion', 'projectId', 'generation', 'requestId', 'status', 'message', 'anchor',
    ].includes(key)) ||
    message.schemaVersion !== 1 ||
    typeof message.projectId !== 'string' ||
    !Number.isInteger(message.generation) ||
    typeof message.requestId !== 'string' ||
    (message.status !== 'exact' && message.status !== 'stale') ||
    typeof message.message !== 'string' ||
    (message.status === 'exact' && !message.anchor)
  ) return null;
  return message as CritiqueReviewSourceReturnMessageV1;
}

const launch = readLaunchContext();
const projectRole = launch.windowRole === 'secondary' ? 'command' : 'writing';
let ownership: SplitCommandOwnershipSyncMessage | null = null;
const ownershipListeners = new Set<(message: SplitCommandOwnershipSyncMessage) => void>();
let surfaceHostState: SplitCommandSurfaceHostState | null = null;
const surfaceHostListeners = new Set<(state: SplitCommandSurfaceHostState) => void>();
let critiqueReviewState: CritiqueReviewSurfaceStateV1 | null = null;
const critiqueReviewListeners = new Set<(state: CritiqueReviewSurfaceStateV1) => void>();
const sourceReturnListeners = new Set<(message: CritiqueReviewSourceReturnMessageV1) => void>();

function applyOwnership(message: SplitCommandOwnershipSyncMessage): boolean {
  if (
    message.pairIdentity.pairId !== launch.pairId ||
    message.pairIdentity.sessionGeneration !== launch.sessionGeneration ||
    (ownership && (
      message.pairIdentity.pairId !== ownership.pairIdentity.pairId ||
      message.pairIdentity.sessionGeneration !== ownership.pairIdentity.sessionGeneration
    ))
  ) {
    return false;
  }
  ownership = message;
  for (const listener of ownershipListeners) {
    try {
      listener(message);
    } catch (error) {
      console.warn('[stage19-preload] ownership listener failed', error);
    }
  }
  return true;
}

ipcRenderer.on(
  STAGE19_PRELOAD_CHANNELS.splitCommand.ownershipSync,
  (_event, value: unknown) => {
    const message = normalizeOwnership(value);
    if (message) applyOwnership(message);
  },
);

function applySurfaceHostState(state: SplitCommandSurfaceHostState): void {
  surfaceHostState = state;
  for (const listener of surfaceHostListeners) {
    try {
      listener(state);
    } catch (error) {
      console.warn('[stage19-preload] surface-host listener failed', error);
    }
  }
}

ipcRenderer.on(
  STAGE19_PRELOAD_CHANNELS.splitCommand.surfaceHostChanged,
  (_event, value: unknown) => {
    const state = normalizeSurfaceHostState(value);
    if (state) applySurfaceHostState(state);
  },
);

ipcRenderer.on(
  STAGE19_PRELOAD_CHANNELS.critiqueReview.stateChanged,
  (_event, value: unknown) => {
    const state = normalizeCritiqueReviewState(value);
    if (!state) return;
    critiqueReviewState = state;
    for (const listener of critiqueReviewListeners) listener(state);
  },
);

ipcRenderer.on(
  STAGE19_PRELOAD_CHANNELS.critiqueReview.sourceReturnRequested,
  (_event, value: unknown) => {
    const message = normalizeSourceReturnMessage(value);
    if (!message) return;
    for (const listener of sourceReturnListeners) listener(message);
  },
);

type BaseProjectSpineBridge = Pick<
  ProjectSpineBridge,
  | 'windowRole'
  | 'chooseDirectory'
  | 'openProject'
  | 'createProject'
  | 'getSession'
  | 'removeRecent'
  | 'selectUnit'
  | 'subscribeSession'
>;

const baseProjectSpine: BaseProjectSpineBridge = {
  windowRole: projectRole,
  chooseDirectory: () =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.chooseDirectory),
  openProject: (request: OpenProjectRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.openProject, request),
  createProject: (request: CreateProjectRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.createProject, request),
  async getSession() {
    const snapshot = normalizeSnapshot(
      await ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.getSession),
      projectRole,
    );
    if (!snapshot) throw new Error('Project session bridge returned an invalid snapshot.');
    return snapshot;
  },
  removeRecent: (request: RemoveRecentProjectRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.removeRecent, request),
  selectUnit: (request: SelectManuscriptUnitRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.selectUnit, request),
  subscribeSession(listener: (snapshot: ProjectSpineSessionSnapshot) => void) {
    const handler = (_event: IpcRendererEvent, value: unknown) => {
      const snapshot = normalizeSnapshot(value, projectRole);
      if (snapshot) listener(snapshot);
    };
    ipcRenderer.on(STAGE19_PRELOAD_CHANNELS.projectSpine.sessionChanged, handler);
    return () =>
      ipcRenderer.removeListener(
        STAGE19_PRELOAD_CHANNELS.projectSpine.sessionChanged,
        handler,
      );
  },
};

type CommandProjectSpineBridge = Pick<
  ProjectSpineBridge,
  'windowRole' | 'getSession' | 'selectUnit' | 'subscribeSession'
>;

const commandProjectSpine: CommandProjectSpineBridge = {
  windowRole: baseProjectSpine.windowRole,
  getSession: baseProjectSpine.getSession,
  selectUnit: baseProjectSpine.selectUnit,
  subscribeSession: baseProjectSpine.subscribeSession,
};

const writingProjectSpine: ProjectSpineBridge = {
  ...baseProjectSpine,
  focusWritingWindow: () =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.focusWritingWindow) as Promise<
      ProjectSpineResult
    >,
  setUnitDirty: (request: SetManuscriptUnitDirtyRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.setUnitDirty, request),
  captureRecoveryCheckpoint: (request: CaptureRecoveryCheckpointRequest) =>
    ipcRenderer.invoke(
      STAGE19_PRELOAD_CHANNELS.projectSpine.captureRecoveryCheckpoint,
      request,
    ) as Promise<ProjectSpineResult<RecoveryCheckpointResultData>>,
  acceptRecoveryCandidate: (request: RecoveryCandidateDecisionRequest) =>
    ipcRenderer.invoke(
      STAGE19_PRELOAD_CHANNELS.projectSpine.acceptRecoveryCandidate,
      request,
    ) as Promise<ProjectSpineResult<RecoveryCandidateDecisionResultData>>,
  rejectRecoveryCandidate: (request: RecoveryCandidateDecisionRequest) =>
    ipcRenderer.invoke(
      STAGE19_PRELOAD_CHANNELS.projectSpine.rejectRecoveryCandidate,
      request,
    ) as Promise<ProjectSpineResult<RecoveryCandidateDecisionResultData>>,
  saveUnit: (request: SaveManuscriptUnitRequest) =>
    ipcRenderer.invoke(
      STAGE19_PRELOAD_CHANNELS.projectSpine.saveUnit,
      request,
    ) as Promise<ProjectSpineResult<SaveManuscriptUnitResultData>>,
  createUnit: (request: CreateManuscriptUnitRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.createUnit, request),
  renameUnit: (request: RenameManuscriptUnitRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.renameUnit, request),
  reorderUnits: (request: ReorderManuscriptUnitsRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.reorderUnits, request),
  deleteUnit: (request: DeleteManuscriptUnitRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.projectSpine.deleteUnit, request),
  exportMarkdown: (request: ExportMarkdownRequest) =>
    ipcRenderer.invoke(
      STAGE19_PRELOAD_CHANNELS.projectSpine.exportMarkdown,
      request,
    ) as Promise<ProjectSpineResult<ExportMarkdownResultData>>,
  onCloseConfirmationRequest(
    listener: (request: ProjectSpineCloseConfirmationRequest) => void,
  ) {
    const handler = (
      _event: IpcRendererEvent,
      request: ProjectSpineCloseConfirmationRequest,
    ) => listener(request);
    ipcRenderer.on(
      STAGE19_PRELOAD_CHANNELS.projectSpine.closeConfirmationRequest,
      handler,
    );
    return () =>
      ipcRenderer.removeListener(
        STAGE19_PRELOAD_CHANNELS.projectSpine.closeConfirmationRequest,
        handler,
      );
  },
  respondToCloseConfirmation: (response: ProjectSpineCloseConfirmationResponse) =>
    ipcRenderer.invoke(
      STAGE19_PRELOAD_CHANNELS.projectSpine.closeConfirmationResponse,
      response,
    ) as Promise<ProjectSpineResult>,
};

const splitCommand: SplitCommandOwnershipBridge = {
  windowRole: launch.windowRole,
  async requestOwnershipSync() {
    try {
      const message = normalizeOwnership(
        await ipcRenderer.invoke(
          STAGE19_PRELOAD_CHANNELS.splitCommand.requestOwnershipSync,
        ),
      );
      if (message && applyOwnership(message)) return message;
    } catch (error) {
      console.warn('[stage19-preload] ownership sync failed', error);
    }
    return ownership;
  },
  readOwnershipSync: () => ownership,
  subscribeOwnershipSync(listener: (message: SplitCommandOwnershipSyncMessage) => void) {
    ownershipListeners.add(listener);
    if (ownership) listener(ownership);
    return () => ownershipListeners.delete(listener);
  },
  async requestSurfaceHostState() {
    try {
      const state = normalizeSurfaceHostState(
        await ipcRenderer.invoke(
          STAGE19_PRELOAD_CHANNELS.splitCommand.requestSurfaceHostState,
        ),
      );
      if (state) applySurfaceHostState(state);
      return state;
    } catch (error) {
      console.warn('[stage19-preload] surface-host sync failed', error);
      return surfaceHostState;
    }
  },
  async activateSurface(request: ActivateSplitCommandSurfaceRequest) {
    const result = normalizeSurfaceHostResult(
      await ipcRenderer.invoke(
        STAGE19_PRELOAD_CHANNELS.splitCommand.activateSurface,
        request,
      ),
    );
    if (!result) throw new Error('Surface host returned an invalid result.');
    applySurfaceHostState(result.state);
    return result;
  },
  readSurfaceHostState: () => surfaceHostState,
  subscribeSurfaceHostState(listener: (state: SplitCommandSurfaceHostState) => void) {
    surfaceHostListeners.add(listener);
    if (surfaceHostState) listener(surfaceHostState);
    return () => surfaceHostListeners.delete(listener);
  },
};

async function invokeCritiqueReviewAction<T>(
  channel: string,
  request: unknown,
): Promise<CritiqueReviewActionResultV1<T>> {
  const result = await ipcRenderer.invoke(channel, request) as CritiqueReviewActionResultV1<T>;
  const state = normalizeCritiqueReviewState(result?.state);
  if (!state || (result.ok !== true && result.ok !== false)) {
    throw new Error('Review returned an invalid result.');
  }
  critiqueReviewState = state;
  return { ...result, state } as CritiqueReviewActionResultV1<T>;
}

const critiqueReview: CritiqueReviewBridge = {
  async requestState() {
    const state = normalizeCritiqueReviewState(
      await ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.critiqueReview.requestState),
    );
    if (!state) throw new Error('Review returned an invalid state.');
    critiqueReviewState = state;
    return state;
  },
  readState: () => critiqueReviewState,
  subscribeState(listener) {
    critiqueReviewListeners.add(listener);
    if (critiqueReviewState) listener(critiqueReviewState);
    return () => critiqueReviewListeners.delete(listener);
  },
  markStale: (request: CritiqueReviewReferenceV1) =>
    invokeCritiqueReviewAction(STAGE19_PRELOAD_CHANNELS.critiqueReview.markStale, request),
  dismiss: (request: CritiqueReviewReferenceV1) =>
    invokeCritiqueReviewAction(STAGE19_PRELOAD_CHANNELS.critiqueReview.dismiss, request),
  saveFeedbackNote: (request: SaveCritiqueReviewFeedbackNoteActionV1) =>
    invokeCritiqueReviewAction<{ readonly noteId: string }>(
      STAGE19_PRELOAD_CHANNELS.critiqueReview.saveFeedbackNote,
      request,
    ),
  returnToSource: (request: CritiqueReviewReferenceV1) =>
    invokeCritiqueReviewAction<{ readonly status: 'exact' | 'stale' }>(
      STAGE19_PRELOAD_CHANNELS.critiqueReview.returnToSource,
      request,
    ),
  subscribeSourceReturn(listener) {
    sourceReturnListeners.add(listener);
    return () => sourceReturnListeners.delete(listener);
  },
};

const aiCritique: AiCritiqueBridge = {
  credentialStatus: () =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.aiCritique.credentialStatus),
  setCredential: (credential: string) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.aiCritique.setCredential, credential),
  clearCredential: () =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.aiCritique.clearCredential),
  prepare: (request: AiCritiquePrepareRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.aiCritique.prepare, request),
  approveAndExecute: (request: AiCritiqueApprovalRequest) =>
    ipcRenderer.invoke(
      STAGE19_PRELOAD_CHANNELS.aiCritique.approveAndExecute,
      request,
    ),
  cancel: (request: AiCritiqueRequestReference) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.aiCritique.cancel, request),
  invalidate: (request: AiCritiqueRequestReference) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.aiCritique.invalidate, request),
  subscribeState(listener: (state: AiCritiqueState) => void) {
    const handler = (_event: IpcRendererEvent, state: AiCritiqueState) =>
      listener(state);
    ipcRenderer.on(STAGE19_PRELOAD_CHANNELS.aiCritique.stateChanged, handler);
    return () =>
      ipcRenderer.removeListener(
        STAGE19_PRELOAD_CHANNELS.aiCritique.stateChanged,
        handler,
      );
  },
};

const feedbackNotes: FeedbackNotesBridge = {
  createFromCritique: (request: CreateFeedbackNoteFromCritiqueRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.feedbackNotes.createFromCritique, request),
  list: (request: ListFeedbackNotesRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.feedbackNotes.list, request),
};

const livingOutline: LivingOutlineBridge = {
  get: (request: GetLivingOutlineRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.livingOutline.get, request),
  createItem: (request: CreateLivingOutlineItemRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.livingOutline.createItem, request),
  updateItem: (request: UpdateLivingOutlineItemRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.livingOutline.updateItem, request),
  moveItem: (request: MoveLivingOutlineItemRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.livingOutline.moveItem, request),
  linkItem: (request: LinkLivingOutlineItemRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.livingOutline.linkItem, request),
  deleteItem: (request: DeleteLivingOutlineItemRequest) =>
    ipcRenderer.invoke(STAGE19_PRELOAD_CHANNELS.livingOutline.deleteItem, request),
};

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';
const logLevels: Record<ConsoleMethod, 'debug' | 'info' | 'warn' | 'error'> = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
};

function logValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

for (const method of Object.keys(logLevels) as ConsoleMethod[]) {
  const original = console[method].bind(console);
  console[method] = (...args: unknown[]) => {
    original(...args);
    try {
      ipcRenderer.send(STAGE19_PRELOAD_CHANNELS.diagnostics, {
        level: logLevels[method],
        scope: 'renderer.console',
        message: args.map(logValue).join(' '),
      });
    } catch (error) {
      original('Failed to forward renderer log entry', error);
    }
  };
}

contextBridge.exposeInMainWorld(
  'projectSpine',
  projectRole === 'writing' ? writingProjectSpine : commandProjectSpine,
);
contextBridge.exposeInMainWorld('splitCommand', splitCommand);
contextBridge.exposeInMainWorld('critiqueReview', critiqueReview);
if (projectRole === 'writing') {
  contextBridge.exposeInMainWorld('aiCritique', aiCritique);
  contextBridge.exposeInMainWorld('feedbackNotes', feedbackNotes);
  contextBridge.exposeInMainWorld('livingOutline', livingOutline);
}
