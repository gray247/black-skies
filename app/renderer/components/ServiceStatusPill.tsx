import { memo } from 'react';
import * as testMode from '../testMode/testModeManager';
import { TID } from '../utils/testIds';

export type ServiceStatus = 'checking' | 'online' | 'offline';
type PillStatus = ServiceStatus | 'port-unavailable';

interface ServiceStatusPillProps {
  status: ServiceStatus;
  reason?: string | null;
  onRetry?: () => void;
  serviceOffline: boolean;
}

const STATUS_LABELS: Record<PillStatus, string> = {
  checking: 'Checking backend services',
  online: 'Backend services ready',
  offline: 'Backend services offline',
  'port-unavailable': 'Backend service port unavailable',
};

function ServiceStatusPillComponent({
  status,
  reason,
  onRetry,
  serviceOffline,
}: ServiceStatusPillProps): JSX.Element {
  const isPortUnavailableReason = reason === 'service_port_unavailable';
  const displayStatus: PillStatus = isPortUnavailableReason
    ? 'port-unavailable'
    : serviceOffline
    ? 'offline'
    : status;
  const visualStatus = displayStatus === 'port-unavailable' ? 'offline' : displayStatus;
  const label =
    displayStatus === 'offline' && reason === 'test-offline'
      ? 'Backend services offline (test)'
      : STATUS_LABELS[displayStatus];
  const tooltip =
    displayStatus === 'offline'
      ? reason === 'test-offline'
        ? 'Backend services are forced offline for this automated test run.'
        : 'Backend services are unreachable; retrying.'
      : displayStatus === 'port-unavailable'
      ? 'The backend service port is unavailable.'
      : undefined;
  const handleClick = (): void => {
    if (!onRetry || displayStatus === 'checking') {
      return;
    }
    onRetry();
  };

  if (typeof window !== 'undefined') {
    const globalWindow = window as typeof window & { __testEnv?: { isPlaywright?: boolean } };
    if (globalWindow.__testEnv?.isPlaywright && document.body?.dataset?.testStableDock !== '1') {
      console.log('[pill-hotkeys-debug]', { status, reason, serviceOffline });
    }
  }

  return (
    <button
      type="button"
      className={`service-status-pill service-status-pill--${visualStatus}`}
      onClick={handleClick}
      disabled={displayStatus === 'checking'}
      aria-live="polite"
      data-testid={TID.serviceStatusPill}
      data-status={displayStatus}
      data-reason={reason ?? undefined}
      title={tooltip}
    >
      <span className="service-status-pill__indicator" aria-hidden="true" />
      <span className="service-status-pill__label">{label}</span>
      {displayStatus === 'offline' && onRetry ? (
        <span className="service-status-pill__action">Retry</span>
      ) : null}
    </button>
  );
}

const serviceStatusAreEqual = (
  prev: ServiceStatusPillProps,
  next: ServiceStatusPillProps,
): boolean => {
  if (!testMode.isTestEnv()) {
    return (
      prev.status === next.status &&
      prev.reason === next.reason &&
      prev.serviceOffline === next.serviceOffline
    );
  }
  return prev.reason === next.reason && prev.serviceOffline === next.serviceOffline;
};

const ServiceStatusPill = memo(ServiceStatusPillComponent, serviceStatusAreEqual);

ServiceStatusPill.displayName = 'ServiceStatusPill';

export default ServiceStatusPill;
