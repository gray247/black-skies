import { randomUUID } from 'node:crypto';
import type {
  ProjectSpineCloseConfirmationRequest,
  ProjectSpineCloseConfirmationResponse,
} from '../shared/ipc/projectSpine.js';

interface PendingCloseConfirmationRequest extends ProjectSpineCloseConfirmationRequest {
  readonly writingWebContentsId: number;
}

let pendingCloseConfirmationRequest: PendingCloseConfirmationRequest | null = null;
let coordinatedCloseAllowance = false;

export function createPendingCloseRequest(
  projectId: string,
  generation: number,
  writingWebContentsId: number,
): PendingCloseConfirmationRequest | null {
  if (pendingCloseConfirmationRequest) return null;
  const request: PendingCloseConfirmationRequest = {
    correlationId: randomUUID(), projectId, generation, writingWebContentsId,
  };
  pendingCloseConfirmationRequest = request;
  return request;
}

export function hasPendingCloseRequest(): boolean { return pendingCloseConfirmationRequest !== null; }
export function clearPendingCloseRequest(): void { pendingCloseConfirmationRequest = null; }

export function validateCloseConfirmationResponse(
  response: ProjectSpineCloseConfirmationResponse,
  senderWebContentsId: number,
): boolean {
  const pending = pendingCloseConfirmationRequest;
  return Boolean(pending && senderWebContentsId === pending.writingWebContentsId &&
    response.correlationId === pending.correlationId && response.projectId === pending.projectId &&
    response.generation === pending.generation);
}

export function grantCoordinatedCloseAllowance(): void { coordinatedCloseAllowance = true; }
export function revokeCoordinatedCloseAllowance(): void { coordinatedCloseAllowance = false; }
export function consumeCoordinatedCloseAllowance(): boolean {
  if (!coordinatedCloseAllowance) return false;
  coordinatedCloseAllowance = false;
  return true;
}
export function handleWritingStudioDestroyed(webContentsId: number): void {
  if (pendingCloseConfirmationRequest?.writingWebContentsId === webContentsId) clearPendingCloseRequest();
}
export function handleSessionGenerationChanged(): void { clearPendingCloseRequest(); }
export function resetCloseConfirmationState(): void {
  pendingCloseConfirmationRequest = null;
  coordinatedCloseAllowance = false;
}
