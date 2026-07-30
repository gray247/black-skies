import { useRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ServicesBridge, ServiceHealthResponse } from '../../shared/ipc/services';
import { useServiceHealth } from '../hooks/useServiceHealth';
import { createServicesBridgeMock } from './testBridgeFactories';

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
  stableHomeMode = false,
  visualStableHome = false,
}: {
  services: ServicesBridge | undefined;
  intervalMs?: number;
  stableHomeMode?: boolean;
  visualStableHome?: boolean;
}) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const { status, retry, isPortUnavailable, lastError } = useServiceHealth(services, {
    intervalMs,
    stableHomeMode,
    visualStableHome,
  });
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="port-flag">{String(isPortUnavailable)}</span>
      <span data-testid="error">{lastError ? lastError.message : ''}</span>
      <span data-testid="render-count">{renderCountRef.current}</span>
      <button type="button" data-testid="retry-button" onClick={() => retry()}>
        Retry
      </button>
      <button type="button" data-testid="background-retry" onClick={() => retry(true)}>
        Background retry
      </button>
    </div>
  );
}

describe('useServiceHealth', () => {
  afterEach(() => {
    delete (window as typeof window & { __restoreOperationInProgress?: boolean })
      .__restoreOperationInProgress;
    vi.restoreAllMocks();
  });

  it('falls back to offline when services are unavailable', async () => {
    render(<Harness services={undefined} />);

    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('offline'));
  });

  it('transitions to online when the health probe succeeds', async () => {
    const services = createServicesBridgeMock({
      checkHealth: vi.fn().mockResolvedValue({
        ok: true,
        data: { status: 'online' },
        traceId: 'trace-online',
      } satisfies ServiceHealthResponse),
      exportProject: vi.fn(),
    });

    render(<Harness services={services} />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('online'));
    expect(services.checkHealth).toHaveBeenCalledTimes(1);
  });

  it('does not churn render state when a background health poll returns the same online snapshot', async () => {
    const services = createServicesBridgeMock({
      checkHealth: vi.fn().mockResolvedValue({
        ok: true,
        data: { status: 'online' },
        traceId: 'trace-online',
      } satisfies ServiceHealthResponse),
      exportProject: vi.fn(),
    });

    render(<Harness services={services} />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('online'));
    const renderCountAfterInitial = Number(screen.getByTestId('render-count').textContent);

    fireEvent.click(screen.getByTestId('background-retry'));

    await waitFor(() => expect(services.checkHealth).toHaveBeenCalledTimes(2));
    expect(Number(screen.getByTestId('render-count').textContent)).toBe(renderCountAfterInitial);
  });

  it('allows manual retries while preserving the latest status', async () => {
    const services = createServicesBridgeMock({
      checkHealth: vi
        .fn()
        .mockResolvedValue({ ok: true, data: { status: 'online' }, traceId: 'trace-online' }),
      exportProject: vi.fn(),
    });

    render(<Harness services={services} />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('online'));
    fireEvent.click(screen.getByTestId('retry-button'));
    await waitFor(() => expect(services.checkHealth).toHaveBeenCalledTimes(2));
  });

  it('flags when the health probe reports a missing port', async () => {
    const services = createServicesBridgeMock({
      checkHealth: vi.fn().mockResolvedValue({
        ok: false,
        error: {
          message: 'Backend service port is unavailable.',
          traceId: 'trace-port',
        },
      }),
      exportProject: vi.fn(),
    });

    render(<Harness services={services} />);

    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('offline'));
    await waitFor(() => expect(screen.getByTestId('port-flag')).toHaveTextContent('true'));
    expect(screen.getByTestId('error')).toHaveTextContent('Backend service port is unavailable.');
  });

  it('keeps the latest service status stable while a restore is in progress', async () => {
    const services = createServicesBridgeMock({
      checkHealth: vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          data: { status: 'online' },
          traceId: 'trace-online',
        } satisfies ServiceHealthResponse)
        .mockResolvedValueOnce({
          ok: false,
          error: {
            message: 'Request timed out after 45000ms',
            code: 'TIMEOUT',
            traceId: 'trace-timeout',
          },
        }),
      exportProject: vi.fn(),
    });

    render(<Harness services={services} />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('online'));

    await new Promise((resolve) => setTimeout(resolve, 1100));
    (window as typeof window & { __restoreOperationInProgress?: boolean }).__restoreOperationInProgress =
      true;
    fireEvent.click(screen.getByTestId('retry-button'));

    await waitFor(() => expect(services.checkHealth).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('status')).toHaveTextContent('online');
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });

  it('registers and cleans up shared test listeners outside stable-home mode', async () => {
    const addWindowSpy = vi.spyOn(window, 'addEventListener');
    const removeWindowSpy = vi.spyOn(window, 'removeEventListener');
    const addDocumentSpy = vi.spyOn(document, 'addEventListener');
    const removeDocumentSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(<Harness services={undefined} />);

    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(addWindowSpy).toHaveBeenCalledWith('test:service-status', expect.any(Function));
      expect(addWindowSpy).toHaveBeenCalledWith('test:service-health', expect.any(Function));
      expect(addWindowSpy).toHaveBeenCalledWith('test:force-offline', expect.any(Function));
      expect(addDocumentSpy).toHaveBeenCalledWith('test:service-status', expect.any(Function));
      expect(addDocumentSpy).toHaveBeenCalledWith('test:service-health', expect.any(Function));
      expect(addDocumentSpy).toHaveBeenCalledWith('test:force-offline', expect.any(Function));
    });

    unmount();

    expect(removeWindowSpy).toHaveBeenCalledWith('test:service-status', expect.any(Function));
    expect(removeWindowSpy).toHaveBeenCalledWith('test:service-health', expect.any(Function));
    expect(removeWindowSpy).toHaveBeenCalledWith('test:force-offline', expect.any(Function));
    expect(removeDocumentSpy).toHaveBeenCalledWith('test:service-status', expect.any(Function));
    expect(removeDocumentSpy).toHaveBeenCalledWith('test:service-health', expect.any(Function));
    expect(removeDocumentSpy).toHaveBeenCalledWith('test:force-offline', expect.any(Function));
  });

  it('skips shared test listeners in stable-home mode', async () => {
    const addWindowSpy = vi.spyOn(window, 'addEventListener');
    const addDocumentSpy = vi.spyOn(document, 'addEventListener');

    render(<Harness services={undefined} stableHomeMode />);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('online'));

    const windowListenerTypes = addWindowSpy.mock.calls.map(([type]) => type);
    const documentListenerTypes = addDocumentSpy.mock.calls.map(([type]) => type);

    expect(windowListenerTypes).not.toContain('test:service-status');
    expect(windowListenerTypes).not.toContain('test:service-health');
    expect(windowListenerTypes).not.toContain('test:force-offline');
    expect(documentListenerTypes).not.toContain('test:service-status');
    expect(documentListenerTypes).not.toContain('test:service-health');
    expect(documentListenerTypes).not.toContain('test:force-offline');
  });
});
