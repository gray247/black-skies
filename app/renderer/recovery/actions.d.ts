import type { DiagnosticsBridge } from '../../shared/ipc/diagnostics';
import type {
  RecoveryStatusBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';
import type { ToastPayload } from '../types/toast';

export interface ProjectSummary {
  projectId: string;
  path: string;
  unitScope: 'scene';
  unitIds: string[];
}

export interface RestoreSnapshotInput {
  services: ServicesBridge;
  projectSummary: ProjectSummary;
}

export interface RestoreSnapshotResult {
  ok: boolean;
  recoveryStatus?: RecoveryStatusBridgeResponse;
  toast: ToastPayload;
}

export interface ValidationResult<T> {
  canProceed: boolean;
  toast?: ToastPayload;
  input?: T;
}

export declare function validateRestoreSnapshot(options: {
  services: ServicesBridge | undefined;
  projectSummary: ProjectSummary | null;
}): ValidationResult<RestoreSnapshotInput>;

export declare function performRestoreSnapshot(
  input: RestoreSnapshotInput,
): Promise<RestoreSnapshotResult>;

export interface ReopenRequestInput {
  request: { path: string; requestId: number };
}

export declare function evaluateReopenRequest(options: {
  lastProjectPath: string | null;
  reopenInFlight: boolean;
  recoveryAction: 'idle' | 'restore' | 'diagnostics';
  nextRequestId: number;
}): ValidationResult<ReopenRequestInput>;

export interface ReopenConsumptionResult {
  matched: boolean;
  shouldClear: boolean;
  toast?: ToastPayload;
}

export declare function resolveReopenConsumption(options: {
  currentRequestId: number | null;
  event: { requestId: number; status: 'success' | 'error' };
}): ReopenConsumptionResult;

export declare function validateDiagnostics(options: {
  diagnostics: DiagnosticsBridge | undefined;
}): ValidationResult<{ diagnostics: DiagnosticsBridge }>;

export declare function openDiagnostics(input: {
  diagnostics: DiagnosticsBridge;
}): Promise<{ ok: boolean; toast?: ToastPayload }>;

