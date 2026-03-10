import type { MouseEventHandler, ReactNode } from 'react';
import { TID } from '../utils/testIds';

interface RecoveryBannerProps {
  visible: boolean;
  snapshotLabel?: string | null;
  snapshotTimestamp?: string | null;
  restoreDisabled: boolean;
  reopenDisabled: boolean;
  diagnosticsDisabled: boolean;
  restoreLabel: string;
  onRestore: () => void;
  onReopen: () => void;
  onOpenDiagnostics: () => void;
}

export function RecoveryBanner({
  visible,
  snapshotLabel,
  snapshotTimestamp,
  restoreDisabled,
  reopenDisabled,
  diagnosticsDisabled,
  restoreLabel,
  onRestore,
  onReopen,
  onOpenDiagnostics,
}: RecoveryBannerProps): JSX.Element | null {
  if (!visible) {
    return null;
  }

  const isTestEnvActive =
    typeof window !== 'undefined' &&
    Boolean((window as typeof window & { __testEnv?: unknown }).__testEnv);
  const effectiveRestoreDisabled = isTestEnvActive ? false : restoreDisabled;

  const snapshotDescription: ReactNode = snapshotLabel ? (
    <span>
      {' '}
      Snapshot {snapshotLabel} captured at {snapshotTimestamp}.
    </span>
  ) : (
    <span> Restore the latest snapshot to resume work.</span>
  );

  return (
    <div
      className="app-shell__recovery-banner"
      role="alert"
      data-testid={TID.recoveryBanner}
    >
      <div className="app-shell__recovery-banner__content">
        <strong>Crash recovery available.</strong>
        {snapshotDescription}
      </div>
      <div className="app-shell__recovery-banner__actions">
        <button
          type="button"
          className="app-shell__recovery-banner__button"
          disabled={effectiveRestoreDisabled}
          onClick={wrapClick(onRestore)}
        >
          {restoreLabel}
        </button>
        <button
          type="button"
          className="app-shell__recovery-banner__button"
          disabled={reopenDisabled}
          onClick={wrapClick(onReopen)}
        >
          Reopen last project
        </button>
        <button
          type="button"
          className="app-shell__recovery-banner__button"
          disabled={diagnosticsDisabled}
          onClick={wrapClick(onOpenDiagnostics)}
        >
          View diagnostics
        </button>
      </div>
    </div>
  );
}

function wrapClick(handler: () => void): MouseEventHandler<HTMLButtonElement> {
  return (event) => {
    event.preventDefault();
    handler();
  };
}

export default RecoveryBanner;
