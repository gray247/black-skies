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
    const revealPath = vi.fn();
    const pushToast = vi.fn();

    const services: Partial<ServicesBridge> = {
      restoreFromZip,
      revealPath,
    };

    render(
      <SnapshotsPanel
        projectId="demo"
        projectPath="/projects/demo"
        services={services}
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

    const successToast = pushToast.mock.calls.find(([payload]) => payload.title === 'Restore copy created');
    expect(successToast).toBeDefined();
    expect(successToast?.[0].description).toBe('Materialized a restored project copy at /tmp/demo_restored.');
    const action = successToast?.[0].actions?.[0];
    expect(action).toBeDefined();
    expect(action?.label).toBe('Open folder');

    action?.onPress();
    expect(revealPath).toHaveBeenCalledWith('/tmp/demo_restored');
  });

  it('shows an unknown-completion warning when restore times out', async () => {
    const restoreFromZip = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'TIMEOUT',
        message: 'Request timed out after 300000ms.',
        details: {
          timeout_ms: 300000,
          backend_may_still_be_running: true,
          completion_status: 'unknown',
          operation_name: 'restore-copy',
        },
      },
    });
    const pushToast = vi.fn();

    render(
      <SnapshotsPanel
        projectId="demo"
        projectPath="/projects/demo"
        services={{ restoreFromZip }}
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /restore latest zip/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^restore$/i }));

    await waitFor(() =>
      expect(pushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'warning',
          title: 'Restore completion unknown',
        }),
      ),
    );
  });

  it('shows a degraded inspection warning when restore preserves an invalid copy', async () => {
    const restoreFromZip = vi.fn().mockResolvedValue({
      ok: false,
      traceId: 'trace-restore-degraded',
      error: {
        code: 'VALIDATION',
        message: 'Restored project failed integrity validation and the copy was preserved for inspection.',
        details: {
          operation: {
            completion_status: 'degraded-preserved',
            destination_path: '/tmp/demo_restored_bad',
          },
        },
      },
    });
    const revealPath = vi.fn();
    const pushToast = vi.fn();

    render(
      <SnapshotsPanel
        projectId="demo"
        projectPath="/projects/demo"
        services={{ restoreFromZip, revealPath }}
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /restore latest zip/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^restore$/i }));

    await waitFor(() => {
      const degradedToast = pushToast.mock.calls.find(
        ([payload]) => payload.title === 'Restore copy needs inspection',
      );
      expect(degradedToast).toBeDefined();
      expect(degradedToast?.[0].description).toContain('/tmp/demo_restored_bad');
      degradedToast?.[0].actions?.[0]?.onPress();
      expect(revealPath).toHaveBeenCalledWith('/tmp/demo_restored_bad');
    });
  });

  it('surfaces blocked restore eligibility reasons for ZIP restores', async () => {
    const restoreFromZip = vi.fn().mockResolvedValue({
      ok: false,
      traceId: 'trace-restore-blocked',
      error: {
        code: 'VALIDATION',
        message: 'restore-as-copy eligibility blocked',
        details: {
          eligibility_decision: {
            eligible: false,
            blocked_reasons: ['missing_manifest', 'scope_mismatch'],
          },
        },
      },
    });
    const pushToast = vi.fn();

    render(
      <SnapshotsPanel
        projectId="demo"
        projectPath="/projects/demo"
        services={{ restoreFromZip }}
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /restore latest zip/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^restore$/i }));

    await waitFor(() =>
      expect(pushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'warning',
          title: 'Restore not available',
        }),
      ),
    );
    expect(
      pushToast.mock.calls.some((call) =>
        String(call[0]?.description ?? '').includes('required manifest files are missing'),
      ),
    ).toBe(true);
  });
});
