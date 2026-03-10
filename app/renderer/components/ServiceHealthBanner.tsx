import { memo, useMemo } from 'react';
import type { ServiceStatus } from './ServiceStatusPill';
import { TID } from '../utils/testIds';

interface ServiceHealthBannerProps {
  visible: boolean;
  serviceStatus: ServiceStatus;
  isPortUnavailable: boolean;
  reason?: string;
  errorMessage?: string | null;
  onRetry: () => void;
  freezeBanner?: boolean;
  testHardFreezeHealth?: boolean;
  testFreezeUntilRetry?: boolean;
  onRetryClickClearFreeze?: () => void;
}

const ServiceHealthBanner = memo(function ServiceHealthBanner({
  visible,
  serviceStatus,
  isPortUnavailable,
  reason,
  errorMessage,
  onRetry,
  freezeBanner = false,
  testHardFreezeHealth = false,
  testFreezeUntilRetry = false,
  onRetryClickClearFreeze,
}: ServiceHealthBannerProps): JSX.Element {
  const reasonKey = reason ?? (isPortUnavailable ? 'service_port_unavailable' : serviceStatus);

  const message = useMemo(() => {
    if (reasonKey === 'service_port_unavailable') {
      return 'The writing tools service port is unavailable. Start the FastAPI services or point the launcher to the correct port.';
    }
    if (reasonKey === 'test-offline') {
      return 'The writing tools services are forced offline for this automated test run.';
    }
    return 'The writing tools are temporarily unreachable. We will retry shortly.';
  }, [reasonKey]);

  if (testFreezeUntilRetry) {
    const handleFrozenRetry = () => {
      onRetry();
      onRetryClickClearFreeze?.();
    };

    return (
      <div
        className={[
          "service-health-banner",
          "service-health-banner--frozen",
          "service-banner",
          "test-frozen",
          "test-banner-locked",
        ].join(" ")}
        data-testid={TID.serviceHealthBanner}
        role="status"
        aria-live="polite"
        aria-hidden={false}
      >
        <div className="service-health-banner__content">
          <strong>Writing tools offline</strong>
          <p>
            The writing tools service port is unavailable. Start the FastAPI services or point the launcher
            to the correct port.
          </p>
        </div>
        <button
          type="button"
          className="service-health-banner__retry"
          data-testid="service-banner-retry"
          onClick={handleFrozenRetry}
        >
          Retry connection
        </button>
      </div>
    );
  }

  const isFrozen = freezeBanner || testHardFreezeHealth;
  const isHidden = !visible && !isFrozen;
  const containerClasses = [
    'service-health-banner',
    isFrozen ? 'service-health-banner--frozen service-banner test-frozen' : '',
    isHidden ? 'service-health-banner--hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const displayMessage = isFrozen
    ? 'The writing tools service port is unavailable. The automated test environment currently holds service access, so retry once the services respond.'
    : message;
  const retryDisabled = !isFrozen && serviceStatus === 'checking';
  const bannerTestId = visible || isFrozen ? TID.serviceHealthBanner : undefined;


  return (
    <div
      className={containerClasses}
      data-testid={bannerTestId}
      role="status"
      aria-live="polite"
      aria-hidden={isHidden}
    >
      <div className="service-health-banner__content">
        <strong>Writing tools offline</strong>
        <p>{displayMessage}</p>
        {!isFrozen && errorMessage ? (
          <p className="service-health-banner__error">{errorMessage}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="service-health-banner__retry"
        data-testid={TID.serviceHealthRetry}
        disabled={retryDisabled}
        onClick={onRetry}
      >
        Retry connection
      </button>
    </div>
  );
});

ServiceHealthBanner.displayName = 'ServiceHealthBanner';

export default ServiceHealthBanner;
