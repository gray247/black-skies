import { useCallback, useEffect } from 'react';
import type { ToastInstance } from '../types/toast';

interface ToastStackProps {
  toasts: ToastInstance[];
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
}

const DEFAULT_DISMISS_MS = 4000;

function fallbackCopy(text: string): void {
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('aria-hidden', 'true');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';
  document.body.appendChild(input);
  input.select();
  try {
    document.execCommand('copy');
  } catch {
    // ignore copy failures; there is no reliable feedback channel without another toast
  }
  document.body.removeChild(input);
}

interface ToastCardProps {
  toast: ToastInstance;
  onDismiss: (id: string) => void;
  autoDismissMs: number;
}

function ToastCard({ toast, onDismiss, autoDismissMs }: ToastCardProps): JSX.Element {
  const dismissDelay = typeof toast.durationMs === 'number' ? toast.durationMs : autoDismissMs;
  useEffect(() => {
    if (dismissDelay <= 0) {
      return () => {};
    }
    const handle = window.setTimeout(() => onDismiss(toast.id), dismissDelay);
    return () => window.clearTimeout(handle);
  }, [dismissDelay, onDismiss, toast.id]);

  const { traceId } = toast;
  const handleCopyTraceId = useCallback(() => {
    if (!traceId) {
      return;
    }
    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(traceId).catch(() => fallbackCopy(traceId));
      return;
    }
    fallbackCopy(traceId);
  }, [traceId]);

  return (
    <div className={`toast toast--${toast.tone}`} role="status" aria-live="assertive">
      <div className="toast__body">
        <span className="toast__title">{toast.title}</span>
        {toast.description ? (
          <span className="toast__description">{toast.description}</span>
        ) : null}
        {traceId ? (
          <div className="toast__trace" aria-label={`Trace identifier ${traceId}`}>
            <span className="toast__trace-label">Trace ID:</span>
            <code className="toast__trace-value">{traceId}</code>
            <button
              type="button"
              className="toast__trace-copy"
              onClick={handleCopyTraceId}
              aria-label={`Copy trace ID ${traceId}`}
            >
              Copy
            </button>
          </div>
        ) : null}
        {toast.actions && toast.actions.length > 0 ? (
          <div className="toast__actions">
            {toast.actions.map((action, index) => (
              <button
                key={`${toast.id}-action-${index}`}
                type="button"
                className="toast__action-button"
                onClick={() => {
                  try {
                    action.onPress();
                  } finally {
                    if (action.dismissOnPress !== false) {
                      onDismiss(toast.id);
                    }
                  }
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="toast__dismiss"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export function ToastStack({
  toasts,
  onDismiss,
  autoDismissMs = DEFAULT_DISMISS_MS,
}: ToastStackProps): JSX.Element {
  if (toasts.length === 0) {
    return <div className="toast-stack" aria-live="polite" aria-atomic="false" />;
  }

  return (
    <div className="toast-stack" aria-live="assertive" aria-atomic="false">
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          autoDismissMs={autoDismissMs}
        />
      ))}
    </div>
  );
}
