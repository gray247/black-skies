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
  it('shows analytics toast once per failure cycle', async () => {
    const pushToast = vi.fn();
    const services = {
      analyticsBudget: vi.fn().mockResolvedValue({
        ok: false,
        error: { message: 'Analytics down', code: 'SERVICE_UNAVAILABLE' },
        traceId: 'trace-analytics',
      }),
    } as unknown as ServicesBridge;

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

    await waitFor(() => expect(pushToast).toHaveBeenCalledTimes(1));
    await act(async () => {
      await refreshFn?.();
    });
    expect(pushToast).toHaveBeenCalledTimes(1);
    expect(services.analyticsBudget).toHaveBeenCalledTimes(2);

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

    await waitFor(() => expect(services.analyticsBudget).toHaveBeenCalledTimes(3));
    expect(pushToast).toHaveBeenCalledTimes(2);
  });
});
