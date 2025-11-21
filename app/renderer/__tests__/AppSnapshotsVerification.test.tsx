import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SnapshotsPanel from '../components/SnapshotsPanel';

import type {
  BackupSummary,
  BackupVerificationReport,
  ServicesBridge,
  SnapshotManifest,
} from '../../shared/ipc/services';

describe('SnapshotsPanel verification details', () => {
  it('shows badges, expands issues, and re-runs verification', async () => {
    const snapshots: SnapshotManifest[] = [
      {
        snapshot_id: 'snapshot-ok',
        created_at: '2025-11-17T12:00:00Z',
        path: '.snapshots/snapshot-ok',
        files_included: [],
      },
      {
        snapshot_id: 'snapshot-issues',
        created_at: '2025-11-17T13:00:00Z',
        path: '.snapshots/snapshot-issues',
        files_included: [],
      },
      {
        snapshot_id: 'snapshot-unknown',
        created_at: '2025-11-17T14:00:00Z',
        path: '.snapshots/snapshot-unknown',
        files_included: [],
      },
    ];

    const listProjectSnapshots = vi.fn().mockResolvedValue({
      ok: true,
      data: snapshots,
    });

    const verificationReport: BackupVerificationReport = {
      project_id: 'proj',
      snapshots: [
        {
          snapshot_id: 'snapshot-ok',
          status: 'ok',
        },
        {
          snapshot_id: 'snapshot-issues',
          status: 'errors',
          errors: ['missing foo'],
        },
      ],
    };

    const getLastVerification = vi.fn().mockResolvedValue({
      ok: true,
      data: verificationReport,
    });

    const runBackupVerification = vi.fn().mockResolvedValue({
      ok: true,
      data: verificationReport,
    });
    const getBackupVerificationReport = vi.fn().mockResolvedValue({
      ok: true,
      data: verificationReport,
    });

    const revealPath = vi.fn();
    const pushToast = vi.fn();

    const services: Partial<ServicesBridge> = {
      listProjectSnapshots,
      getLastVerification,
      runBackupVerification,
      getBackupVerificationReport,
      revealPath,
    };

    render(
      <SnapshotsPanel
        projectId="proj"
        projectPath="/projects/proj"
        services={services as ServicesBridge}
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    await waitFor(() =>
      expect(listProjectSnapshots).toHaveBeenCalledWith({ projectId: 'proj' }),
    );
    await waitFor(() =>
      expect(getLastVerification).toHaveBeenCalledWith({
        projectId: 'proj',
        projectPath: '/projects/proj',
      }),
    );

    expect(await screen.findByTestId('snapshot-badge-snapshot-ok')).toHaveTextContent('OK');
    expect(screen.getByTestId('snapshot-badge-snapshot-issues')).toHaveTextContent('Issues');
    expect(screen.getByTestId('snapshot-badge-snapshot-unknown')).toHaveTextContent('Unknown');

    fireEvent.click(
      screen.getByLabelText('Toggle verification details for snapshot-issues'),
    );
    expect(await screen.findByText('missing foo')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /view full report/i }));
    await waitFor(() =>
      expect(getBackupVerificationReport).toHaveBeenCalledWith({ projectId: 'proj' }),
    );
    expect(screen.getByTestId('verification-report-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Re-run verification for this snapshot' }),
    );
    await waitFor(() =>
      expect(runBackupVerification).toHaveBeenCalledWith({
        projectId: 'proj',
        latestOnly: true,
      }),
    );
    await waitFor(() => expect(getLastVerification).toHaveBeenCalledTimes(2));
  });

  it('opens the verification report modal from the toast action', async () => {
    const snapshots: SnapshotManifest[] = [
      {
        snapshot_id: 'snapshot-a',
        created_at: '2025-11-17T12:00:00Z',
        path: '.snapshots/snapshot-a',
        files_included: [],
      },
    ];

    const listProjectSnapshots = vi.fn().mockResolvedValue({
      ok: true,
      data: snapshots,
    });
    const verificationReport: BackupVerificationReport = {
      project_id: 'proj',
      snapshots: [
        {
          snapshot_id: 'snapshot-a',
          status: 'ok',
        },
      ],
    };
    const getLastVerification = vi.fn().mockResolvedValue({
      ok: true,
      data: verificationReport,
    });
    const runBackupVerification = vi.fn().mockResolvedValue({
      ok: true,
      data: verificationReport,
    });
    const getBackupVerificationReport = vi.fn().mockResolvedValue({
      ok: true,
      data: verificationReport,
    });
    const pushToast = vi.fn();

    render(
      <SnapshotsPanel
        projectId="proj"
        projectPath="/projects/proj"
        services={
          {
            listProjectSnapshots,
            getLastVerification,
            runBackupVerification,
            getBackupVerificationReport,
          } as Partial<ServicesBridge>
        }
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    await waitFor(() =>
      expect(listProjectSnapshots).toHaveBeenCalledWith({ projectId: 'proj' }),
    );
    await waitFor(() =>
      expect(getLastVerification).toHaveBeenCalledWith({
        projectId: 'proj',
        projectPath: '/projects/proj',
      }),
    );

    fireEvent.click(screen.getByTestId('snapshots-manual-verify-button'));
    await waitFor(() =>
      expect(runBackupVerification).toHaveBeenCalledWith({
        projectId: 'proj',
        latestOnly: true,
      }),
    );

    const toastPayloads = pushToast.mock.calls.map((call) => call[0]);
    const successToast = toastPayloads.find((payload) =>
      payload.actions?.some((action) => action.label === 'View report'),
    );
    expect(successToast).toBeDefined();
    const action = successToast?.actions?.[0];
    expect(action).toBeDefined();

    await act(async () => {
      await action?.onPress();
    });

    await waitFor(() => expect(getBackupVerificationReport).toHaveBeenCalledWith({ projectId: 'proj' }));
    expect(screen.getByTestId('verification-report-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  });

  it('shows an error toast when verification report fetch fails', async () => {
    const snapshots: SnapshotManifest[] = [
      {
        snapshot_id: 'snapshot-a',
        created_at: '2025-11-17T12:00:00Z',
        path: '.snapshots/snapshot-a',
        files_included: [],
      },
    ];

    const listProjectSnapshots = vi.fn().mockResolvedValue({
      ok: true,
      data: snapshots,
    });
    const verificationReport: BackupVerificationReport = {
      project_id: 'proj',
      snapshots: [
        {
          snapshot_id: 'snapshot-a',
          status: 'ok',
        },
      ],
    };
    const getLastVerification = vi.fn().mockResolvedValue({
      ok: true,
      data: verificationReport,
    });
    const runBackupVerification = vi.fn().mockResolvedValue({
      ok: true,
      data: verificationReport,
    });
    const getBackupVerificationReport = vi.fn().mockRejectedValue(new Error('Bridge offline'));
    const pushToast = vi.fn();

    render(
      <SnapshotsPanel
        projectId="proj"
        projectPath="/projects/proj"
        services={
          {
            listProjectSnapshots,
            getLastVerification,
            runBackupVerification,
            getBackupVerificationReport,
          } as Partial<ServicesBridge>
        }
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    await waitFor(() =>
      expect(listProjectSnapshots).toHaveBeenCalledWith({ projectId: 'proj' }),
    );

    fireEvent.click(screen.getByTestId('snapshots-manual-verify-button'));
    await waitFor(() =>
      expect(runBackupVerification).toHaveBeenCalledWith({
        projectId: 'proj',
        latestOnly: true,
      }),
    );

    const toastPayloads = pushToast.mock.calls.map((call) => call[0]);
    const successToast = toastPayloads.find((payload) =>
      payload.actions?.some((action) => action.label === 'View report'),
    );
    expect(successToast).toBeDefined();
    const action = successToast?.actions?.[0];
    expect(action).toBeDefined();

    await act(async () => {
      await action?.onPress();
    });

    await waitFor(() =>
      expect(pushToast.mock.calls.at(-1)?.[0]?.title).toBe('Verification report unavailable'),
    );
    expect(screen.getByTestId('verification-report-modal')).toBeInTheDocument();
    expect(screen.getByText(/Bridge offline/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByTestId('verification-report-modal')).toBeNull(),
    );
  });
});

it('renders backup list and triggers backup actions', async () => {
  const snapshots: SnapshotManifest[] = [
    {
      snapshot_id: 'snapshot-ok',
      created_at: '2025-11-17T12:00:00Z',
      path: '.snapshots/snapshot-ok',
      files_included: [],
    },
  ];

  const listProjectSnapshots = vi.fn().mockResolvedValue({
    ok: true,
    data: snapshots,
  });

  const verificationReport: BackupVerificationReport = {
    project_id: 'proj',
    snapshots: [
      {
        snapshot_id: 'snapshot-ok',
        status: 'ok',
      },
    ],
  };

  const getLastVerification = vi.fn().mockResolvedValue({
    ok: true,
    data: verificationReport,
  });

  const createBackup = vi.fn().mockResolvedValue({
    ok: true,
    data: {
      filename: 'BS_20251120_000000.zip',
      project_id: 'proj',
      path: 'backups/BS_20251120_000000.zip',
      created_at: '2025-11-20T00:00:00Z',
      checksum: 'abc',
    },
  });

  const backupEntries: BackupSummary[] = [
    {
      filename: 'BS_20251119_120000.zip',
      project_id: 'proj',
      path: 'backups/BS_20251119_120000.zip',
      created_at: '2025-11-19T12:00:00Z',
      checksum: 'def',
    },
  ];

  const listBackups = vi
    .fn()
    .mockResolvedValue({ ok: true, data: backupEntries } as const);

  const restoreBackup = vi.fn().mockResolvedValue({
    ok: true,
    data: {
      status: 'ok',
      restored_project_slug: 'proj_restored_001',
      restored_path: '/tmp/proj_restored_001',
    },
  });

  const runBackupVerification = vi.fn().mockResolvedValue({
    ok: true,
    data: verificationReport,
  });

  const revealPath = vi.fn();
  const pushToast = vi.fn();

  const services: Partial<ServicesBridge> = {
    listProjectSnapshots,
    getLastVerification,
    runBackupVerification,
    listBackups,
    createBackup,
    restoreBackup,
    revealPath,
  };

  render(
    <SnapshotsPanel
      projectId="proj"
      projectPath="/projects/proj"
      services={services as ServicesBridge}
      serviceStatus="online"
      pushToast={pushToast}
    />,
  );

  await waitFor(() =>
    expect(listBackups).toHaveBeenCalledWith({ projectId: 'proj' }),
  );
  expect(await screen.findByText('BS_20251119_120000.zip')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Create backup/i }));
  await waitFor(() =>
    expect(createBackup).toHaveBeenCalledWith({ projectId: 'proj' }),
  );
  await waitFor(() => expect(listBackups).toHaveBeenCalledTimes(2));

  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  fireEvent.click(
    await screen.findByRole('button', {
      name: /Restore backup BS_20251119_120000\.zip/i,
    }),
  );
  await waitFor(() =>
    expect(restoreBackup).toHaveBeenCalledWith({
      backupName: 'BS_20251119_120000.zip',
    }),
  );
  confirmSpy.mockRestore();
});
