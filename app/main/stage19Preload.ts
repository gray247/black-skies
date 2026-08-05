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
import type { SplitCommandOwnershipBridge } from '../shared/ipc/splitCommand';
import type {
  AiCritiqueApprovalRequest,
  AiCritiqueBridge,
  AiCritiquePrepareRequest,
  AiCritiqueRequestReference,
  AiCritiqueState,
} from '../shared/ipc/aiCritique';
import type {
  SplitCommandOwnershipSyncMessage,
  SplitCommandWindowRole,
} from '../shared/splitCommandAuthority';

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

const launch = readLaunchContext();
const projectRole = launch.windowRole === 'secondary' ? 'command' : 'writing';
let ownership: SplitCommandOwnershipSyncMessage | null = null;
const ownershipListeners = new Set<(message: SplitCommandOwnershipSyncMessage) => void>();

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
if (projectRole === 'writing') {
  contextBridge.exposeInMainWorld('aiCritique', aiCritique);
}
