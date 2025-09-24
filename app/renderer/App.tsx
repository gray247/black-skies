import React, { useCallback, useEffect, useRef, useState } from 'react';
import ProjectHome from './components/ProjectHome';
import ServiceStatusPill, {
  type ServiceStatus,
} from './components/ServiceStatusPill';
import { ToastStack } from './components/ToastStack';
import type { ToastInstance, ToastPayload } from './types/toast';

export default function App(): JSX.Element {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const counterRef = useRef(0);
  const isMountedRef = useRef(true);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking');

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setServiceStatusSafe = useCallback((status: ServiceStatus) => {
    if (isMountedRef.current) {
      setServiceStatus(status);
    }
  }, []);

  const checkServices = useCallback(async () => {
    const bridge = window.services;
    if (!bridge) {
      console.error('[App] Services bridge unavailable; project actions disabled');
      setServiceStatusSafe('offline');
      return;
    }

    setServiceStatusSafe('checking');

    try {
      const result = await bridge.checkHealth();
      if (!result.ok) {
        console.warn('[App] Service health check failed', result.error);
      }
      setServiceStatusSafe(result.ok ? 'online' : 'offline');
    } catch (error) {
      console.error('[App] Health probe threw an error', error);
      setServiceStatusSafe('offline');
    }
  }, [setServiceStatusSafe]);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      if (!cancelled) {
        await checkServices();
      }
    };

    void run();

    const intervalId = window.setInterval(() => {
      void run();
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [checkServices]);

  const pushToast = useCallback((payload: ToastPayload) => {
    counterRef.current += 1;
    const id = `${payload.tone}-${Date.now()}-${counterRef.current}`;
    const toast: ToastInstance = {
      ...payload,
      id,
      createdAt: Date.now(),
    };
    setToasts((previous) => [...previous, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  return (
    <div className="app-shell">
      <aside className="app-shell__dock" aria-label="Wizard dock placeholder">
        <div className="app-shell__dock-header">
          <h1>Black Skies</h1>
          <p>Wizard steps</p>
        </div>
        <ul className="app-shell__dock-list">
          <li>Input &amp; Scope</li>
          <li>Structure</li>
          <li>Scenes</li>
          <li>Conflict</li>
          <li>Finalize</li>
        </ul>
      </aside>

      <div className="app-shell__workspace">
        <header className="app-shell__workspace-header">
          <div>
            <span className="app-shell__workspace-title">Project console</span>
            <p className="app-shell__workspace-subtitle">
              Load a project to sync outline, scenes, and critique panes.
            </p>
          </div>
          <div className="app-shell__workspace-actions">
            <ServiceStatusPill status={serviceStatus} onRetry={checkServices} />
            <button
              type="button"
              className="app-shell__workspace-button"
              disabled={serviceStatus !== 'online'}
            >
              Generate
            </button>
            <button
              type="button"
              className="app-shell__workspace-button"
              disabled={serviceStatus !== 'online'}
            >
              Critique
            </button>
          </div>
        </header>
        <main className="app-shell__workspace-body">
          <ProjectHome onToast={pushToast} />
        </main>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
