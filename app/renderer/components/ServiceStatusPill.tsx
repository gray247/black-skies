export type ServiceStatus = 'checking' | 'online' | 'offline';

interface ServiceStatusPillProps {
  status: ServiceStatus;
  onRetry?: () => void;
}

const STATUS_LABELS: Record<ServiceStatus, string> = {
  checking: 'Checking services',
  online: 'Services online',
  offline: 'Services offline',
};

export default function ServiceStatusPill({
  status,
  onRetry,
}: ServiceStatusPillProps): JSX.Element {
  const label = STATUS_LABELS[status];
  const className = `service-status-pill service-status-pill--${status}`;
  const handleClick = (): void => {
    if (status === 'offline' && onRetry) {
      onRetry();
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={status === 'checking'}
      aria-live="polite"
    >
      <span className="service-status-pill__indicator" aria-hidden="true" />
      <span className="service-status-pill__label">{label}</span>
      {status === 'offline' && onRetry ? (
        <span className="service-status-pill__action">Retry</span>
      ) : null}
    </button>
  );
}


