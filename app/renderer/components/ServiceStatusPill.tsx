import { memo } from 'react';
import { TID } from '../utils/testIds';

export type ServiceStatus = 'checking' | 'online' | 'offline';

interface ServiceStatusPillProps {
  status: ServiceStatus;
  onRetry?: () => void;
}

const STATUS_LABELS: Record<ServiceStatus, string> = {
  checking: 'Checking writing tools',
  online: 'Ready',
  offline: 'Writing tools offline',
};

const ServiceStatusPill = memo(function ServiceStatusPill({
  status,
  onRetry,
}: ServiceStatusPillProps): JSX.Element {
  const label = STATUS_LABELS[status];
  const className = `service-status-pill service-status-pill--${status}`;
  const tooltip = status === 'offline' ? 'Connection lost — retrying.' : undefined;
  const handleClick = (): void => {
    if (!onRetry || status === 'checking') {
      return;
    }
    onRetry();
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={status === 'checking'}
      aria-live="polite"
      data-testid={TID.serviceStatusPill}
      data-status={status}
      title={tooltip}
    >
      <span className="service-status-pill__indicator" aria-hidden="true" />
      <span className="service-status-pill__label">{label}</span>
      {status === 'offline' && onRetry ? (
        <span className="service-status-pill__action">Retry</span>
      ) : null}
    </button>
  );
});

ServiceStatusPill.displayName = 'ServiceStatusPill';

export default ServiceStatusPill;
