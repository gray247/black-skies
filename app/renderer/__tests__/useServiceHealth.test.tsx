import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ServicesBridge, ServiceHealthResponse } from '../../shared/ipc/services';
import { useServiceHealth } from '../hooks/useServiceHealth';

vi.mock('../utils/env', async () => {
  const actual = await vi.importActual<typeof import('../utils/env')>('../utils/env');
  return {
    ...actual,
    isTestEnvironment: () => true,
  };
});

function Harness({
  services,
  intervalMs = 0,
}: {
  services: ServicesBridge | undefined;
  intervalMs?: number;
}) {
  const { status, retry, isPortUnavailable, lastError } = useServiceHealth(services, { intervalMs });
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="port-flag">{String(isPortUnavailable)}</span>
      <span data-testid="error">{lastError ? lastError.message : ''}</span>
      <button type="button" data-testid="retry-button" onClick={() => retry()}>
        Retry
      </button>
    </div>
  );
}

describe('useServiceHealth', () => {
  it('falls back to offline when services are unavailable', async () => {
    render(<Harness services={undefined} />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('offline'));
  });

  it('transitions to online when the health probe succeeds', async () => {
    const services = {
      checkHealth: vi.fn().mockResolvedValue({
        ok: true,
        data: { status: 'online' },
        traceId: 'trace-online',
      } satisfies ServiceHealthResponse),
      exportProject: vi.fn(),
    } as ServicesBridge;

    render(<Harness services={services} />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('online'));
    expect(services.checkHealth).toHaveBeenCalledTimes(1);
  });

  it('allows manual retries while preserving the latest status', async () => {
    const services = {
      checkHealth: vi
        .fn()
        .mockResolvedValue({ ok: true, data: { status: 'online' }, traceId: 'trace-online' }),
      exportProject: vi.fn(),
    } as ServicesBridge;

    render(<Harness services={services} />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('online'));
    fireEvent.click(screen.getByTestId('retry-button'));
    await waitFor(() => expect(services.checkHealth).toHaveBeenCalledTimes(2));
  });

  it('flags when the health probe reports a missing port', async () => {
    const services = {
      checkHealth: vi.fn().mockResolvedValue({
        ok: false,
        error: {
          message: 'Service port is unavailable.',
          traceId: 'trace-port',
        },
      }),
      exportProject: vi.fn(),
    } as ServicesBridge;

    render(<Harness services={services} />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('offline'));
    await waitFor(() => expect(screen.getByTestId('port-flag')).toHaveTextContent('true'));
    expect(screen.getByTestId('error')).toHaveTextContent('Service port is unavailable.');
  });
});
