import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RecoveryStatusBridgeResponse } from '../../shared/ipc/services';
import { HistoryPane } from '../App';

const baseRecoveryStatus: RecoveryStatusBridgeResponse = {
  project_id: 'proj_hist',
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

function renderHistoryPane(
  overrides: Partial<React.ComponentProps<typeof HistoryPane>> = {},
): void {
  render(
    <HistoryPane
      recoveryStatus={baseRecoveryStatus}
      recoveryAction="idle"
      recoveryAvailable
      lastProjectPath="C:/stories/demo"
      onRestore={vi.fn()}
      onReopen={vi.fn()}
      onReload={vi.fn()}
      {...overrides}
    />,
  );
}

describe('HistoryPane', () => {
  it('renders recovery controls when recovery is available', () => {
    renderHistoryPane();

    expect(
      screen.getByRole('heading', { name: /Recovery/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Restore snapshot/i }),
    ).toBeEnabled();
    const statusParagraphs = screen.getAllByText(/Status:/i);
    expect(statusParagraphs[0]).toHaveTextContent('needs-recovery');
  });

  it('disables restore action when busy', () => {
    renderHistoryPane({ recoveryAction: 'restore' });

    expect(
      screen.getByRole('button', { name: /Restore snapshot/i }),
    ).toBeDisabled();
  });

  it('shows fallback text when no recovery is pending', () => {
    renderHistoryPane({
      recoveryAvailable: false,
      recoveryStatus: { ...baseRecoveryStatus, status: 'idle', needs_recovery: false },
    });

    expect(screen.getByText(/No recovery actions pending/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Restore snapshot/i }),
    ).not.toBeInTheDocument();
  });
});
