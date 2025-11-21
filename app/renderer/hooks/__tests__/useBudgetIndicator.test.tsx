import { act, render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useBudgetIndicator } from '../useBudgetIndicator';

import type { ServicesBridge } from '../../../shared/ipc/services';
import type { ToastPayload } from '../../types/toast';
import type { ServiceStatus } from '../../components/ServiceStatusPill';

type BudgetHarnessProps = {
  services: ServicesBridge;
  serviceHealthy: boolean;
  serviceStatus: ServiceStatus;
  projectId: string;
  pushToast: (toast: ToastPayload) => void;
  onReady: (refresh: (options?: { force?: boolean }) => Promise<void>) => void;
};

function BudgetHarness({
  services,
  serviceHealthy,
  serviceStatus,
  projectId,
  pushToast,
  onReady,
}: BudgetHarnessProps): JSX.Element {
  const { refreshBudget } = useBudgetIndicator({
    services,
    projectId,
    serviceHealthy,
    serviceStatus,
    pushToast,
  });

  useEffect(() => {
    onReady(refreshBudget);
  }, [onReady, refreshBudget]);

  return null;
}

describe('useBudgetIndicator analytics toasts', () => {
  it('suppresses analyticsBudget bridge calls even when provided', async () => {
    const pushToast = vi.fn();
    const services = {
      analyticsBudget: vi.fn().mockResolvedValue({
        ok: true,
        data: null,
      }),
    } as unknown as ServicesBridge;

    let refreshFn: ((options?: { force?: boolean }) => Promise<void>) | undefined;
    const handleReady = (refresh: (options?: { force?: boolean }) => Promise<void>) => {
      refreshFn = refresh;
    };

    render(
      <BudgetHarness
        services={services}
        serviceHealthy
        serviceStatus="online"
        projectId="demo"
        pushToast={pushToast}
        onReady={handleReady}
      />,
    );

    await waitFor(() => expect(refreshFn).toBeDefined());
    await act(async () => {
      await refreshFn?.({ force: true });
    });

    expect(services.analyticsBudget).not.toHaveBeenCalled();
    expect(pushToast).not.toHaveBeenCalled();
  });

  it('emits analytics warning once per offline transition', async () => {
    const pushToast = vi.fn();
    const services = {} as ServicesBridge;
    let refreshFn: ((options?: { force?: boolean }) => Promise<void>) | undefined;
    const handleReady = (refresh: (options?: { force?: boolean }) => Promise<void>) => {
      refreshFn = refresh;
    };

    const { rerender } = render(
      <BudgetHarness
        services={services}
        serviceHealthy
        serviceStatus="online"
        projectId="demo"
        pushToast={pushToast}
        onReady={handleReady}
      />,
    );

    await waitFor(() => expect(refreshFn).toBeDefined());
    expect(pushToast).not.toHaveBeenCalled();

    rerender(
      <BudgetHarness
        services={services}
        serviceHealthy
        serviceStatus="offline"
        projectId="demo"
        pushToast={pushToast}
        onReady={handleReady}
      />,
    );

    await waitFor(() => expect(pushToast).toHaveBeenCalledTimes(1));

    rerender(
      <BudgetHarness
        services={services}
        serviceHealthy
        serviceStatus="online"
        projectId="demo"
        pushToast={pushToast}
        onReady={handleReady}
      />,
    );

    rerender(
      <BudgetHarness
        services={services}
        serviceHealthy
        serviceStatus="offline"
        projectId="demo"
        pushToast={pushToast}
        onReady={handleReady}
      />,
    );

    await waitFor(() => expect(pushToast).toHaveBeenCalledTimes(2));
  });
});
