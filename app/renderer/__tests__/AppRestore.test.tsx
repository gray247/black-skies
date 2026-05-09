import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SnapshotsPanel from '../components/SnapshotsPanel';

import type { ServicesBridge } from '../../shared/ipc/services';

describe('SnapshotsPanel restore workflow', () => {
  it('restores from the latest ZIP and exposes the toast action', async () => {
    const restoreFromZip = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        status: 'ok',
        restored_path: '/tmp/demo_restored',
        restored_project_slug: 'demo_restored',
      },
    });
    const revealPath = vi.fn().mockResolvedValue({ ok: true, path: '/tmp/demo_restored' });
    const pushToast = vi.fn();

    const services: Partial<ServicesBridge> = {
      restoreFromZip,
      revealPath,
    };

    render(
      <SnapshotsPanel
        projectId="demo"
        projectPath="/projects/demo"
        services={services as ServicesBridge}
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    const restoreButton = await screen.findByRole('button', { name: /restore latest zip/i });
    fireEvent.click(restoreButton);

    const dialog = await screen.findByRole('dialog', { name: /confirm restore from zip/i });
    expect(dialog).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /^restore$/i });
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(restoreFromZip).toHaveBeenCalledWith({ projectId: 'demo', restoreAsNew: true }),
    );

    const successToast = pushToast.mock.calls.find(([payload]) => payload.title === 'Restore complete');
    expect(successToast).toBeDefined();
    const action = successToast?.[0].actions?.[0];
    expect(action).toBeDefined();
    expect(action?.label).toBe('Open folder');

    action?.onPress();
    expect(revealPath).toHaveBeenCalledWith('/tmp/demo_restored');
  });

  it('reports when the restored folder cannot be opened', async () => {
    const restoreFromZip = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        status: 'ok',
        restored_path: '/tmp/demo_restored',
        restored_project_slug: 'demo_restored',
      },
    });
    const revealPath = vi.fn().mockResolvedValue({
      ok: false,
      error: 'Access denied.',
    });
    const pushToast = vi.fn();

    const services: Partial<ServicesBridge> = {
      restoreFromZip,
      revealPath,
    };

    render(
      <SnapshotsPanel
        projectId="demo"
        projectPath="/projects/demo"
        services={services as ServicesBridge}
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    const restoreButton = await screen.findByRole('button', { name: /restore latest zip/i });
    fireEvent.click(restoreButton);

    await screen.findByRole('dialog', { name: /confirm restore from zip/i });
    fireEvent.click(screen.getByRole('button', { name: /^restore$/i }));

    await waitFor(() =>
      expect(restoreFromZip).toHaveBeenCalledWith({ projectId: 'demo', restoreAsNew: true }),
    );

    const successToast = pushToast.mock.calls.find(([payload]) => payload.title === 'Restore complete');
    const action = successToast?.[0].actions?.[0];
    expect(action).toBeDefined();

    await action?.onPress?.();

    await waitFor(() =>
      expect(
        pushToast.mock.calls.some((call) => call[0]?.title === 'Unable to open restored folder'),
      ).toBe(true),
    );
    expect(
      pushToast.mock.calls.some((call) =>
        String(call[0]?.description ?? '').includes('OS could not open path: Access denied.'),
      ),
    ).toBe(true);
  });

  it('reports an unknown failure when the restored folder error has no details', async () => {
    const restoreFromZip = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        status: 'ok',
        restored_path: '/tmp/demo_restored',
        restored_project_slug: 'demo_restored',
      },
    });
    const revealPath = vi.fn().mockResolvedValue({
      ok: false,
      error: '',
    });
    const pushToast = vi.fn();

    const services: Partial<ServicesBridge> = {
      restoreFromZip,
      revealPath,
    };

    render(
      <SnapshotsPanel
        projectId="demo"
        projectPath="/projects/demo"
        services={services as ServicesBridge}
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /restore latest zip/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^restore$/i }));

    await waitFor(() =>
      expect(restoreFromZip).toHaveBeenCalledWith({ projectId: 'demo', restoreAsNew: true }),
    );

    const successToast = pushToast.mock.calls.find(([payload]) => payload.title === 'Restore complete');
    const action = successToast?.[0].actions?.[0];
    expect(action).toBeDefined();

    await action?.onPress?.();

    await waitFor(() =>
      expect(
        pushToast.mock.calls.some((call) => call[0]?.title === 'Unable to open restored folder'),
      ).toBe(true),
    );
    expect(
      pushToast.mock.calls.some((call) =>
        String(call[0]?.description ?? '').includes('Unknown failure while opening the path.'),
      ),
    ).toBe(true);
  });
});
