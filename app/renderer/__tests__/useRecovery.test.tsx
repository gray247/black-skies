import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DiagnosticsBridge } from '../../shared/ipc/diagnostics';
import type { RecoveryStatusBridgeResponse, ServicesBridge } from '../../shared/ipc/services';
import type ProjectSummary from '../types/project';
import useRecovery from '../hooks/useRecovery';

const defaultProjectSummary: ProjectSummary = {
  projectId: 'proj_recovery',
  path: '/projects/recovery',
  unitScope: 'scene',
  unitIds: ['sc_0001'],
};

function createRecoveryStatus(overrides?: Partial<RecoveryStatusBridgeResponse>) {
  const base: RecoveryStatusBridgeResponse = {
    project_id: defaultProjectSummary.projectId,
    status: 'needs-recovery',
    needs_recovery: true,
    pending_unit_id: null,
    draft_id: null,
    started_at: null,
    last_snapshot: {
      snapshot_id: '20250101T000000Z',
      label: 'accept',
      created_at: '2025-01-01T00:00:00Z',
      path: 'history/snapshots/20250101T000000Z_accept',
    },
    message: null,
    failure_reason: null,
  };
  return { ...base, ...overrides };
}

function buildServices(overrides?: {
  getRecoveryStatus?: () => Promise<{ ok: boolean; data: RecoveryStatusBridgeResponse }>;
  restoreSnapshot?: () => Promise<{ ok: boolean; data: RecoveryStatusBridgeResponse }>;
}): { services: ServicesBridge; mocks: { getRecoveryStatus: ReturnType<typeof vi.fn>; restoreSnapshot: ReturnType<typeof vi.fn> } } {
  const getRecoveryStatus =
    overrides?.getRecoveryStatus ??
    vi.fn().mockResolvedValue({
      ok: true,
      data: createRecoveryStatus(),
      traceId: 'trace-status',
    });
  const restoreSnapshot =
    overrides?.restoreSnapshot ??
    vi.fn().mockResolvedValue({
      ok: true,
      data: createRecoveryStatus({ status: 'idle', needs_recovery: false }),
      traceId: 'trace-restore',
    });

  const partial: Partial<ServicesBridge> = {
    getRecoveryStatus,
    restoreSnapshot,
  };

  return { services: partial as ServicesBridge, mocks: { getRecoveryStatus, restoreSnapshot } };
}

function RecoveryHarness({
  services,
  diagnostics,
  serviceStatus = 'online',
  projectSummary = defaultProjectSummary,
  pushToast,
}: {
  services: ServicesBridge;
  diagnostics?: DiagnosticsBridge;
  serviceStatus?: 'online' | 'offline' | 'checking';
  projectSummary?: ProjectSummary;
  pushToast: ReturnType<typeof vi.fn>;
}) {
  const hook = useRecovery({
    services,
    diagnostics,
    serviceStatus,
    projectSummary,
    pushToast,
    isMountedRef: { current: true },
  });

  return (
    <div>
      <span data-testid="recovery-status">{hook.recoveryStatus?.status ?? 'none'}</span>
      <span data-testid="recovery-action">{hook.recoveryAction}</span>
      <button type="button" data-testid="restore" onClick={() => hook.handleRestoreSnapshot()}>
        Restore snapshot
      </button>
      <button
        type="button"
        data-testid="diagnostics"
        onClick={() => hook.handleOpenDiagnostics()}
      >
        Diagnostics
      </button>
    </div>
  );
}

describe('useRecovery', () => {
  it('restores snapshots and updates the recovery status', async () => {
    const { services } = buildServices();
    const pushToast = vi.fn();
    render(<RecoveryHarness services={services} pushToast={pushToast} />);

    await waitFor(() =>
      expect(screen.getByTestId('recovery-status')).toHaveTextContent('needs-recovery'),
    );

    fireEvent.click(screen.getByTestId('restore'));

    await waitFor(() =>
      expect(screen.getByTestId('recovery-status')).toHaveTextContent('idle'),
    );
    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Restored earlier version.' }),
    );
  });

  it('surfaces diagnostics errors when diagnostics bridge is missing', async () => {
    const { services } = buildServices();
    const pushToast = vi.fn();
    render(
      <RecoveryHarness services={services} pushToast={pushToast} diagnostics={undefined} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId('recovery-status')).toHaveTextContent('needs-recovery'),
    );
    fireEvent.click(screen.getByTestId('diagnostics'));

    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Diagnostics unavailable' }),
    );
  });

  it('skips recovery requests when services are offline', async () => {
    const { services, mocks } = buildServices();
    const pushToast = vi.fn();
    render(
      <RecoveryHarness services={services} pushToast={pushToast} serviceStatus="offline" />,
    );

    await waitFor(() =>
      expect(screen.getByTestId('recovery-status')).toHaveTextContent('none'),
    );
    expect(mocks.getRecoveryStatus).not.toHaveBeenCalled();
  });
});
