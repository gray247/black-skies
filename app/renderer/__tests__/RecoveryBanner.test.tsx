import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RecoveryBanner from '../components/RecoveryBanner';
import { TID } from '../utils/testIds';

describe('RecoveryBanner', () => {
  it('does not render when not visible', () => {
    const { container } = render(
      <RecoveryBanner
        visible={false}
        restoreDisabled={false}
        reopenDisabled={false}
        diagnosticsDisabled={false}
        restoreLabel="Restore"
        onRestore={vi.fn()}
        onReopen={vi.fn()}
        onOpenDiagnostics={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders actions with snapshot metadata', () => {
    render(
      <RecoveryBanner
        visible
        snapshotLabel="autosave"
        snapshotTimestamp="2026-01-01T00:00:00Z"
        restoreDisabled={false}
        reopenDisabled
        diagnosticsDisabled
        restoreLabel="Restore latest"
        onRestore={vi.fn()}
        onReopen={vi.fn()}
        onOpenDiagnostics={vi.fn()}
      />,
    );

    const banner = screen.getByTestId(TID.recoveryBanner);
    expect(banner).toHaveTextContent(/Snapshot autosave captured/i);
    expect(screen.getByRole('button', { name: /Restore latest/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Reopen last project/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /View diagnostics/i })).toBeDisabled();
  });

  it('invokes handlers on click', () => {
    const handleRestore = vi.fn();
    const handleReopen = vi.fn();
    const handleDiagnostics = vi.fn();

    render(
      <RecoveryBanner
        visible
        restoreDisabled={false}
        reopenDisabled={false}
        diagnosticsDisabled={false}
        restoreLabel="Restore snapshot"
        onRestore={handleRestore}
        onReopen={handleReopen}
        onOpenDiagnostics={handleDiagnostics}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Restore snapshot/i }));
    fireEvent.click(screen.getByRole('button', { name: /Reopen last project/i }));
    fireEvent.click(screen.getByRole('button', { name: /View diagnostics/i }));

    expect(handleRestore).toHaveBeenCalledTimes(1);
    expect(handleReopen).toHaveBeenCalledTimes(1);
    expect(handleDiagnostics).toHaveBeenCalledTimes(1);
  });
});
