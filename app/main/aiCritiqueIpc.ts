import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import {
  AI_CRITIQUE_CHANNELS,
  type AiCritiqueApprovalRequest,
  type AiCritiqueCredentialStatus,
  type AiCritiqueError,
  type AiCritiquePrepareRequest,
  type AiCritiqueRequestReference,
  type AiCritiqueResult,
  type AiCritiqueState,
} from '../shared/ipc/aiCritique.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import {
  AiCritiqueCoordinator,
  AiCritiqueCoordinatorError,
  type AiCritiqueMainAuthority,
} from './aiCritiqueCoordinator.js';
import { AiCritiqueGateway, AiCritiqueGatewayError } from './aiCritiqueGateway.js';

export interface AiCritiqueExecutionContext {
  readonly requestId: string;
  readonly credential: string;
  readonly coordinator: AiCritiqueCoordinator;
  publish(state: AiCritiqueState): void;
}

export interface RegisterAiCritiqueIpcOptions {
  readonly processSessionId: string;
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly execute?: (context: AiCritiqueExecutionContext) => void;
  readonly cancelExecution?: (requestId: string) => void;
  readonly gateway?: AiCritiqueGateway;
}

interface SenderSession {
  readonly senderId: number;
  readonly coordinator: AiCritiqueCoordinator;
  readonly operationIds: Map<string, string>;
  publish(state: AiCritiqueState): void;
}

let options: RegisterAiCritiqueIpcOptions | null = null;
let sessionCredential: string | null = null;
let cancelCurrentExecution: ((requestId: string) => void) | null = null;
const senderSessions = new Map<number, SenderSession>();

const UNKNOWN_ERROR: AiCritiqueError = {
  code: 'INVALID_REQUEST',
  message: 'The critique request could not be completed.',
  retryable: false,
};

function success<T>(data: T): AiCritiqueResult<T> {
  return { ok: true, data };
}

function failure<T>(error: unknown): AiCritiqueResult<T> {
  return {
    ok: false,
    error: error instanceof AiCritiqueCoordinatorError ? error.detail : UNKNOWN_ERROR,
  };
}

function configured(): AiCritiqueCredentialStatus {
  return { configured: sessionCredential !== null };
}

function currentAuthority(senderId: number): AiCritiqueMainAuthority {
  if (!options) {
    return {
      senderRole: null,
      processSessionId: '',
      projectId: null,
      projectPath: null,
      unitId: null,
      generation: 0,
      projectRevision: 0,
    };
  }
  const snapshot = options.getWritingSnapshot();
  return {
    senderRole: options.resolveWindowRole(senderId),
    processSessionId: options.processSessionId,
    projectId: snapshot.project?.projectId ?? null,
    projectPath: snapshot.project?.path ?? null,
    unitId: snapshot.activeUnitId,
    generation: snapshot.generation,
    projectRevision: snapshot.revision,
  };
}

function senderSession(event: IpcMainInvokeEvent): SenderSession {
  const senderId = event.sender.id;
  const existing = senderSessions.get(senderId);
  if (existing) return existing;
  const session: SenderSession = {
    senderId,
    coordinator: new AiCritiqueCoordinator({
      resolveAuthority: () => currentAuthority(senderId),
    }),
    operationIds: new Map(),
    publish(state) {
      if (!event.sender.isDestroyed()) {
        event.sender.send(AI_CRITIQUE_CHANNELS.stateChanged, state);
      }
    },
  };
  senderSessions.set(senderId, session);
  return session;
}

function requireWritingStudio(event: IpcMainInvokeEvent): void {
  if (!options || options.resolveWindowRole(event.sender.id) !== 'writing') {
    throw new AiCritiqueCoordinatorError({
      code: 'NOT_WRITING_STUDIO',
      message: 'AI critique is available only to the registered Writing Studio.',
      retryable: false,
    });
  }
}

function requireReference(session: SenderSession, reference: AiCritiqueRequestReference): void {
  if (
    !reference ||
    typeof reference.requestId !== 'string' ||
    typeof reference.operationId !== 'string' ||
    session.operationIds.get(reference.requestId) !== reference.operationId
  ) {
    throw new AiCritiqueCoordinatorError({
      code: 'REQUEST_NOT_FOUND',
      message: 'The critique request is unavailable.',
      retryable: false,
    });
  }
}

function installHandler<TRequest = undefined>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, request: TRequest) => Promise<unknown> | unknown,
): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, (event, request: unknown) => handler(event, request as TRequest));
}

export function registerAiCritiqueIpc(nextOptions: RegisterAiCritiqueIpcOptions): void {
  options = nextOptions;
  senderSessions.clear();
  sessionCredential = null;
  const gateway = nextOptions.gateway ?? new AiCritiqueGateway();
  const cancelExecution = nextOptions.cancelExecution ?? ((requestId: string) => gateway.cancel(requestId));
  cancelCurrentExecution = cancelExecution;
  const execute = nextOptions.execute ?? ((context: AiCritiqueExecutionContext) => {
    const execution = context.coordinator.beginExecution(context.requestId);
    context.publish(execution.state);
    void gateway.execute({
      requestId: context.requestId,
      credential: context.credential,
      providerBodyJson: execution.providerBodyJson,
      payloadHash: execution.payloadHash,
      selectedText: execution.selectedText,
      sourceFingerprint: execution.sourceFingerprint,
      selectionFingerprint: execution.selectionFingerprint,
      editorRevision: execution.editorRevision,
    }).then((result) => {
      if (context.coordinator.readState(context.requestId).status === 'executing') {
        context.publish(context.coordinator.complete(context.requestId, result));
      }
    }).catch((error: unknown) => {
      if (context.coordinator.readState(context.requestId).status !== 'executing') return;
      const detail = error instanceof AiCritiqueGatewayError
        ? error.detail
        : {
            code: 'PROVIDER_ERROR' as const,
            message: 'The provider request could not be completed.',
            retryable: false,
          };
      context.publish(context.coordinator.fail(context.requestId, detail));
    });
  });

  installHandler(AI_CRITIQUE_CHANNELS.credentialStatus, (event) => {
    try {
      requireWritingStudio(event);
      return configured();
    } catch (error) {
      return failure(error);
    }
  });

  installHandler(AI_CRITIQUE_CHANNELS.setCredential, (event, credential: unknown) => {
    try {
      requireWritingStudio(event);
      if (typeof credential !== 'string' || credential.length < 20 || credential.length > 512) {
        throw new AiCritiqueCoordinatorError({
          code: 'INVALID_REQUEST',
          message: 'Enter a valid session credential.',
          retryable: false,
        });
      }
      sessionCredential = credential;
      return success(configured());
    } catch (error) {
      return failure(error);
    }
  });

  installHandler(AI_CRITIQUE_CHANNELS.clearCredential, (event) => {
    try {
      requireWritingStudio(event);
      sessionCredential = null;
      return configured();
    } catch (error) {
      return failure(error);
    }
  });

  installHandler(AI_CRITIQUE_CHANNELS.prepare, (event, request: AiCritiquePrepareRequest) => {
    try {
      requireWritingStudio(event);
      const session = senderSession(event);
      const preview = session.coordinator.prepare(request);
      session.operationIds.set(preview.requestId, request.operationId);
      return success(preview);
    } catch (error) {
      return failure(error);
    }
  });

  installHandler(AI_CRITIQUE_CHANNELS.approveAndExecute, (event, request: AiCritiqueApprovalRequest) => {
    try {
      requireWritingStudio(event);
      const session = senderSession(event);
      requireReference(session, request);
      if (!sessionCredential) {
        throw new AiCritiqueCoordinatorError({
          code: 'CREDENTIAL_MISSING',
          message: 'A session credential is required before approval.',
          retryable: false,
        });
      }
      session.publish(session.coordinator.approve(request));
      execute({
        requestId: request.requestId,
        credential: sessionCredential,
        coordinator: session.coordinator,
        publish: session.publish,
      });
      return success({ requestId: request.requestId, operationId: request.operationId });
    } catch (error) {
      return failure(error);
    }
  });

  installHandler(AI_CRITIQUE_CHANNELS.cancel, (event, reference: AiCritiqueRequestReference) => {
    try {
      requireWritingStudio(event);
      const session = senderSession(event);
      requireReference(session, reference);
      cancelExecution(reference.requestId);
      const state = session.coordinator.cancel(reference.requestId);
      session.publish(state);
      return success(state);
    } catch (error) {
      return failure(error);
    }
  });

  installHandler(AI_CRITIQUE_CHANNELS.invalidate, (event, reference: AiCritiqueRequestReference) => {
    try {
      requireWritingStudio(event);
      const session = senderSession(event);
      requireReference(session, reference);
      cancelExecution(reference.requestId);
      const state = session.coordinator.invalidate(reference.requestId);
      session.publish(state);
      return success(state);
    } catch (error) {
      return failure(error);
    }
  });
}

export function invalidateAllAiCritiqueArtifacts(): void {
  for (const session of senderSessions.values()) {
    for (const state of session.coordinator.invalidateActive()) {
      cancelCurrentExecution?.(state.requestId);
      session.publish(state);
    }
  }
}

export function resetAiCritiqueIpcForTests(): void {
  for (const channel of Object.values(AI_CRITIQUE_CHANNELS)) {
    if (channel !== AI_CRITIQUE_CHANNELS.stateChanged) ipcMain.removeHandler(channel);
  }
  senderSessions.clear();
  sessionCredential = null;
  options = null;
  cancelCurrentExecution = null;
}
