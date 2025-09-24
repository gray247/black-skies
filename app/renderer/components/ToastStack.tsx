import React, { useEffect } from 'react';
import type { ToastInstance } from '../types/toast';

interface ToastStackProps {
  toasts: ToastInstance[];
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
}

const DEFAULT_DISMISS_MS = 4000;

interface ToastCardProps {
  toast: ToastInstance;
  onDismiss: (id: string) => void;
  autoDismissMs: number;
}

function ToastCard({ toast, onDismiss, autoDismissMs }: ToastCardProps): JSX.Element {
  useEffect(() => {
    const handle = window.setTimeout(() => onDismiss(toast.id), autoDismissMs);
    return () => window.clearTimeout(handle);
  }, [autoDismissMs, onDismiss, toast.id]);

  return (
    <div className={`toast toast--${toast.tone}`} role="status" aria-live="assertive">
      <div className="toast__body">
        <span className="toast__title">{toast.title}</span>
        {toast.description ? (
          <span className="toast__description">{toast.description}</span>
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
