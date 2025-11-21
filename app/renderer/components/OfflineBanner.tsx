import { memo } from 'react';

interface OfflineBannerProps {
  message?: string;
  onRetry?: () => void;
}

const OfflineBanner = memo(function OfflineBanner({
  message,
  onRetry,
}: OfflineBannerProps): JSX.Element {
  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <div className="offline-banner__content">
        <strong>Writing tools offline</strong>
        <p>{message ?? 'Analytics data is temporarily unavailable.'}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          className="offline-banner__retry"
          onClick={onRetry}
        >
          Retry connection
        </button>
      ) : null}
    </div>
  );
});

OfflineBanner.displayName = 'OfflineBanner';

export default OfflineBanner;
