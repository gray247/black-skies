import { memo, useMemo } from 'react';
import type { ServiceStatus } from './ServiceStatusPill';
import { TID } from '../utils/testIds';

interface ServiceHealthBannerProps {
  visible: boolean;
  serviceStatus: ServiceStatus;
  isPortUnavailable: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
}

const ServiceHealthBanner = memo(function ServiceHealthBanner({
  visible,
  serviceStatus,
  isPortUnavailable,
  errorMessage,
  onRetry,
}: ServiceHealthBannerProps): JSX.Element | null {
  if (!visible) {
    return null;
  }

  const message = useMemo(() => {
    if (isPortUnavailable) {
      return 'The writing tools service port is unavailable. Start the FastAPI services or point the launcher to the correct port.';
    }
    return 'The writing tools are temporarily unreachable. We will retry shortly.';
  }, [isPortUnavailable]);

  return (
    <div
      className="service-health-banner"
      data-testid={TID.serviceHealthBanner}
      role="status"
      aria-live="polite"
    >
      <div className="service-health-banner__content">
        <strong>Writing tools offline</strong>
        <p>{message}</p>
        {errorMessage ? (
          <p className="service-health-banner__error">{errorMessage}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="service-health-banner__retry"
        data-testid={TID.serviceHealthRetry}
        disabled={serviceStatus === 'checking'}
        onClick={onRetry}
      >
        Retry connection
      </button>
    </div>
  );
});

ServiceHealthBanner.displayName = 'ServiceHealthBanner';

export default ServiceHealthBanner;
