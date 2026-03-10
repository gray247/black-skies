import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SnapshotsPanel from '../components/SnapshotsPanel';

import type {
  BackupSummary,
  BackupVerificationReport,
  ServicesBridge,
  SnapshotManifest,
} from '../../shared/ipc/services';

const createSnapshotFsMock = ({
  metadata,
  manifest,
  statSize = 2048,
}: {
  metadata?: Record<string, unknown>;
  manifest?: { files_included?: Array<{ path?: string }> };
  statSize?: number;
} = {}) => {
  const defaultMetadata = {
    snapshot_id: 'snapshot-default',
    created_at: '2025-11-17T12:00:00Z',
    label: 'accept',
  };
  const defaultManifest = {
    files_included: [
      { path: 'project.json' },
      { path: 'outline.json' },
      { path: 'drafts/sc_0001.md' },
    ],
  };
  return {
    resolvePath: (...segments: string[]) => segments.filter(Boolean).join('/'),
    readJson: vi.fn(async (path: string) => {
      if (path.endsWith('snapshot.json')) {
        throw Object.assign(new Error('snapshot.json missing'), { code: 'ENOENT' });
      }
      if (path.endsWith('metadata.json')) {
        return metadata ?? defaultMetadata;
      }
      if (path.endsWith('manifest.json')) {
        return manifest ?? defaultManifest;
      }
      throw Object.assign(new Error('File missing'), { code: 'ENOENT' });
    }),
    readDir: vi.fn(async () => []),
    stat: vi.fn(async () => ({
      size: statSize,
      isFile: true,
      isDirectory: false,
      mtimeMs: 0,
    })),
  };
};

const attachFsMock = (mock: ReturnType<typeof createSnapshotFsMock>) => {
  window.__electronApi = { fs: mock };
};

beforeEach(() => {
  attachFsMock(createSnapshotFsMock());
});

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

    attachFsMock(
      createSnapshotFsMock({
        metadata: {
          snapshot_id: 'snapshot-issues',
          created_at: '2025-11-17T13:00:00Z',
          label: 'accept',
        },
      }),
    );
    const issueDetails = screen.getByTestId('snapshot-issues-snapshot-issues');
    fireEvent.click(
      within(issueDetails).getByRole('button', { name: /view full report/i }),
    );
    await waitFor(() =>
      expect(window.__electronApi?.fs.readJson).toHaveBeenCalledWith(
        expect.stringMatching(/metadata\.json$/),
      ),
    );
    await waitFor(() =>
      expect(window.__electronApi?.fs.readJson).toHaveBeenCalledWith(
        expect.stringMatching(/manifest\.json$/),
      ),
    );
    expect(window.__electronApi?.fs.stat).toHaveBeenCalledTimes(4);
    expect(screen.getByTestId('verification-report-modal')).toBeInTheDocument();
    expect(screen.getByText('snapshot-issues')).toBeInTheDocument();
    expect(screen.getByText('Snapshot ID')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('6.0 KB')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent.click(
      within(issueDetails).getByRole('button', { name: 'Re-run verification for this snapshot' }),
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

    attachFsMock(
      createSnapshotFsMock({
        metadata: {
          snapshot_id: 'snapshot-a',
          created_at: '2025-11-17T12:00:00Z',
          label: 'analytics',
        },
      }),
    );
    await act(async () => {
      await action?.onPress();
    });

    await waitFor(() =>
      expect(window.__electronApi?.fs.readJson).toHaveBeenCalledWith(
        expect.stringMatching(/metadata\.json$/),
      ),
    );
    expect(screen.getByTestId('verification-report-modal')).toBeInTheDocument();
    expect(screen.getByText('snapshot-a')).toBeInTheDocument();
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

    const failingFsMock = createSnapshotFsMock();
    const baseReadJson = failingFsMock.readJson;
    failingFsMock.readJson = vi.fn(async (path: string) => {
      if (path.endsWith('metadata.json')) {
        throw new Error('Bridge offline');
      }
      return baseReadJson(path);
    });
    attachFsMock(failingFsMock);

    await act(async () => {
      await action?.onPress();
    });

    await waitFor(() =>
      expect(
        pushToast.mock.calls.some((call) => call[0]?.title === 'Verification report unavailable'),
      ).toBe(true),
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

it('renders the updated snapshot and verification sections', async () => {
  const snapshots: SnapshotManifest[] = [
    {
      snapshot_id: 'snapshot-latest',
      created_at: '2025-11-17T14:00:00Z',
      path: '.snapshots/snapshot-latest',
      files_included: [],
    },
  ];

  const listProjectSnapshots = vi.fn().mockResolvedValue({
    ok: true,
    data: snapshots,
  });
  const getLastVerification = vi.fn().mockResolvedValue({
    ok: true,
    data: {
      project_id: 'proj',
      snapshots: [
        {
          snapshot_id: 'snapshot-latest',
          status: 'ok',
        },
      ],
    },
  });

  render(
    <SnapshotsPanel
      projectId="proj"
      projectPath="/projects/proj"
      services={{
        listProjectSnapshots,
        getLastVerification,
      } as Partial<ServicesBridge>}
      serviceStatus="online"
      pushToast={vi.fn()}
    />,
  );

  await waitFor(() =>
    expect(listProjectSnapshots).toHaveBeenCalledWith({ projectId: 'proj' }),
  );
  expect(screen.getByText('Latest verification')).toBeInTheDocument();
  expect(screen.getByText('Project backups')).toBeInTheDocument();
  expect(screen.getByText('Saved snapshots')).toBeInTheDocument();
});
