import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SnapshotsPanel from '../components/SnapshotsPanel';
import * as testMode from '../testMode/testModeManager';

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
    const toLocaleStringSpy = vi
      .spyOn(Date.prototype, 'toLocaleString')
      .mockImplementation(function (this: Date) {
        return this.toISOString();
      });

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
      verified_at: '2025-11-17T12:00:00Z',
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
    const verificationReportUpdated: BackupVerificationReport = {
      project_id: 'proj',
      verified_at: '2025-11-17T13:00:00Z',
      snapshots: [
        {
          snapshot_id: 'snapshot-ok',
          status: 'ok',
        },
        {
          snapshot_id: 'snapshot-issues',
          status: 'ok',
        },
      ],
    };

    const getLastVerification = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        data: verificationReport,
      })
      .mockResolvedValueOnce({
        ok: true,
        data: verificationReportUpdated,
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
    await waitFor(() =>
      expect(screen.getByText(/Last check:/)).toHaveTextContent(
        '2025-11-17T12:00:00.000Z',
      ),
    );

    expect(await screen.findByTestId('snapshot-badge-snapshot-ok')).toHaveTextContent('No issues');
    expect(screen.getByTestId('snapshot-badge-snapshot-issues')).toHaveTextContent('Issues');
    expect(screen.getByTestId('snapshot-badge-snapshot-unknown')).toHaveTextContent('No record');

    fireEvent.click(
      screen.getByLabelText('Toggle verification details for snapshot-unknown'),
    );
    const unknownDetails = await screen.findByTestId('snapshot-issues-snapshot-unknown');
    expect(
      within(unknownDetails).getByText('No verification record for this snapshot yet.'),
    ).toBeTruthy();
    expect(
      within(unknownDetails).queryByText('No issues recorded in the latest verification record.'),
    ).toBeNull();

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
      within(issueDetails).getByRole('button', { name: /view snapshot details/i }),
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
    expect(screen.getByText('Integrity evidence: Issues recorded')).toBeInTheDocument();
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
    await waitFor(() =>
      expect(screen.getByText(/Last check:/)).toHaveTextContent(
        '2025-11-17T13:00:00.000Z',
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('snapshots-health-status')).toHaveTextContent(
        'Latest verification record shows no issues',
      ),
    );
    fireEvent.click(
      within(screen.getByTestId('snapshot-issues-snapshot-issues')).getByRole('button', {
        name: /view snapshot details/i,
      }),
    );
    await waitFor(() =>
      expect(screen.getByText('Integrity evidence: No issues recorded')).toBeInTheDocument(),
    );
    toLocaleStringSpy.mockRestore();
  });

  it('refreshes the mounted snapshot status without reopening the app', async () => {
    const initialTimestamp = new Date('2025-11-17T12:00:00Z').toLocaleString();
    const refreshedTimestamp = new Date('2025-11-17T14:30:00Z').toLocaleString();

    const snapshots: SnapshotManifest[] = [
      {
        snapshot_id: 'snapshot-refresh',
        created_at: '2025-11-17T15:00:00Z',
        path: '.snapshots/snapshot-refresh',
        files_included: [],
      },
    ];

    const listProjectSnapshots = vi.fn().mockResolvedValue({
      ok: true,
      data: snapshots,
    });

    const verificationReportInitial: BackupVerificationReport = {
      project_id: 'proj',
      verified_at: '2025-11-17T12:00:00Z',
      snapshots: [
        {
          snapshot_id: 'snapshot-refresh',
          status: 'errors',
          errors: ['missing foo'],
        },
      ],
    };
    const verificationReportRefreshed: BackupVerificationReport = {
      project_id: 'proj',
      verified_at: '2025-11-17T14:30:00Z',
      snapshots: [
        {
          snapshot_id: 'snapshot-refresh',
          status: 'ok',
        },
      ],
    };

    const getLastVerification = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        data: verificationReportInitial,
      })
      .mockResolvedValueOnce({
        ok: true,
        data: verificationReportRefreshed,
      });

    render(
      <SnapshotsPanel
        projectId="proj"
        projectPath="/projects/proj"
        services={
          {
            listProjectSnapshots,
            getLastVerification,
          } as Partial<ServicesBridge>
        }
        serviceStatus="online"
        pushToast={vi.fn()}
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
    expect(screen.getByTestId('snapshots-health-status')).toHaveTextContent(
      'Latest verification record shows issues',
    );
    expect(screen.getByText(/Last check:/)).toHaveTextContent(initialTimestamp);

    fireEvent.click(screen.getByTestId('snapshots-refresh-status-button'));

    await waitFor(() => expect(getLastVerification).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(listProjectSnapshots).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId('snapshots-health-status')).toHaveTextContent(
        'Latest verification record shows no issues',
      ),
    );
    await waitFor(() =>
      expect(screen.getByText(/Last check:/)).toHaveTextContent(refreshedTimestamp),
    );
  });

  it('opens the snapshot details modal from the toast action', async () => {
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
      payload.actions?.some((action) => action.label === 'View snapshot details'),
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

  it('shows an error toast when snapshot details fetch fails', async () => {
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
      payload.actions?.some((action) => action.label === 'View snapshot details'),
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
        pushToast.mock.calls.some((call) => call[0]?.title === 'Verification record unavailable'),
      ).toBe(true),
    );
    expect(screen.getByTestId('verification-report-modal')).toBeInTheDocument();
    expect(screen.getByText(/Bridge offline/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByTestId('verification-report-modal')).toBeNull(),
    );
  });

  it('does not call the OS bridge for missing snapshot directories, manifests, or reports', async () => {
    const snapshots: SnapshotManifest[] = [
      {
        snapshot_id: 'snapshot-missing',
        created_at: '2025-11-17T12:00:00Z',
        path: '.snapshots/snapshot-missing',
        files_included: [],
      },
    ];
    const listProjectSnapshots = vi.fn().mockResolvedValue({ ok: true, data: snapshots });
    const getLastVerification = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'proj',
        snapshots: [],
      },
    });
    const revealPath = vi.fn().mockResolvedValue({ ok: true, path: '/projects/proj/.snapshots' });
    const pushToast = vi.fn();
    const fsMock = createSnapshotFsMock();
    fsMock.stat = vi.fn(async (path: string) => {
      if (
        path.endsWith('.snapshots/snapshot-missing') ||
        path.endsWith('.snapshots/snapshot-missing/manifest.json') ||
        path.endsWith('.snapshots/last_verification.json')
      ) {
        throw Object.assign(new Error('missing'), { code: 'ENOENT' });
      }
      return {
        size: 0,
        isDirectory: false,
        isFile: true,
        mtimeMs: 0,
      };
    });
    attachFsMock(fsMock);

    render(
      <SnapshotsPanel
        projectId="proj"
        projectPath="/projects/proj"
        services={
          {
            listProjectSnapshots,
            getLastVerification,
            revealPath,
          } as Partial<ServicesBridge>
        }
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    await waitFor(() =>
      expect(listProjectSnapshots).toHaveBeenCalledWith({ projectId: 'proj' }),
    );

    fireEvent.click(screen.getByRole('button', { name: /Reveal snapshot snapshot-missing/i }));
    await waitFor(() =>
      expect(pushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Snapshot directory unavailable',
        }),
      ),
    );
    expect(revealPath).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Reveal manifest for snapshot-missing/i }));
    await waitFor(() =>
      expect(pushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Snapshot manifest unavailable',
        }),
      ),
    );
    expect(revealPath).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('snapshots-open-report-file-button'));
    await waitFor(() =>
      expect(pushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Verification record unavailable',
        }),
      ),
    );
    expect(revealPath).not.toHaveBeenCalled();
  });

  it('uses the canonical verification report path when the report exists', async () => {
    const listProjectSnapshots = vi.fn().mockResolvedValue({ ok: true, data: [] });
    const getLastVerification = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'proj',
        snapshots: [],
      },
    });
    const revealPath = vi.fn().mockResolvedValue({
      ok: true,
      path: '/projects/proj/.snapshots/last_verification.json',
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
            revealPath,
          } as Partial<ServicesBridge>
        }
        serviceStatus="online"
        pushToast={pushToast}
      />,
    );

    await waitFor(() =>
      expect(listProjectSnapshots).toHaveBeenCalledWith({ projectId: 'proj' }),
    );

    fireEvent.click(screen.getByTestId('snapshots-open-report-file-button'));

    await waitFor(() =>
      expect(revealPath).toHaveBeenCalledWith('/projects/proj/.snapshots/last_verification.json'),
    );
    expect(
      pushToast.mock.calls.some((call) => call[0]?.title === 'Verification record unavailable'),
    ).toBe(false);
  });

  it('keeps local snapshot report browsing available while services are offline', async () => {
    const isTestEnvSpy = vi.spyOn(testMode, 'isTestEnv').mockReturnValue(false);
    try {
      const listProjectSnapshots = vi.fn().mockResolvedValue({
        ok: true,
        data: [
          {
            snapshot_id: 'snapshot-offline',
            created_at: '2025-11-17T12:00:00Z',
            path: '.snapshots/snapshot-offline',
            files_included: [],
          },
        ],
      });
      const getLastVerification = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          project_id: 'proj',
          snapshots: [
            {
              snapshot_id: 'snapshot-offline',
              status: 'ok',
            },
          ],
        },
      });
      const revealPath = vi.fn().mockResolvedValue({
        ok: true,
        path: '/projects/proj/.snapshots/last_verification.json',
      });
      const listBackups = vi.fn().mockResolvedValue({
        ok: true,
        data: [
          {
            filename: 'BS_20251119_120000.zip',
            project_id: 'proj',
            path: 'backups/BS_20251119_120000.zip',
            created_at: '2025-11-19T12:00:00Z',
            checksum: 'def',
          },
        ],
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
            revealPath,
            listBackups,
          } as Partial<ServicesBridge>
          }
          serviceStatus="offline"
          pushToast={pushToast}
        />,
      );

      await waitFor(() =>
        expect(listProjectSnapshots).toHaveBeenCalledWith({ projectId: 'proj' }),
      );
      await waitFor(() => expect(listBackups).toHaveBeenCalledWith({ projectId: 'proj' }));
      expect(await screen.findByText('BS_20251119_120000.zip')).toBeInTheDocument();
      expect(screen.getByTestId('snapshots-manual-verify-button')).toBeDisabled();
      expect(screen.getByTestId('snapshots-refresh-status-button')).toBeEnabled();
      expect(screen.getByTestId('snapshots-open-report-file-button')).toBeEnabled();
      expect(screen.getByTestId('snapshots-backup-create')).toBeDisabled();
      expect(screen.getByRole('button', { name: /Restore backup BS_20251119_120000\.zip/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Restore latest ZIP as copy/i })).toBeDisabled();

      fireEvent.click(screen.getByRole('button', { name: /Reveal snapshot snapshot-offline/i }));
      await waitFor(() =>
        expect(revealPath).toHaveBeenCalledWith('/projects/proj/.snapshots/snapshot-offline'),
      );

      fireEvent.click(
        screen.getByRole('button', { name: /Reveal manifest for snapshot-offline/i }),
      );
      await waitFor(() =>
        expect(revealPath).toHaveBeenCalledWith(
          '/projects/proj/.snapshots/snapshot-offline/manifest.json',
        ),
      );

      fireEvent.click(screen.getByTestId('snapshots-open-report-file-button'));

      await waitFor(() =>
        expect(revealPath).toHaveBeenCalledWith('/projects/proj/.snapshots/last_verification.json'),
      );
      expect(
        pushToast.mock.calls.some((call) => call[0]?.title === 'Verification record unavailable'),
      ).toBe(false);

      expect(
        screen.getByRole('button', { name: /Re-run verification for this snapshot/i }),
      ).toBeDisabled();
      expect(screen.getByTestId('snapshots-refresh-status-button')).toBeEnabled();
    } finally {
      isTestEnvSpy.mockRestore();
    }
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
  await waitFor(() => expect(createBackup).not.toHaveBeenCalled());
  await waitFor(() =>
    expect(
      pushToast.mock.calls.some(
        (call) =>
          call[0]?.title === 'Backup created' &&
          String(call[0]?.description ?? '').includes('Created backup /mock/path'),
      ),
    ).toBe(true),
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

it('surfaces actionable text when backup verification fails', async () => {
  const listProjectSnapshots = vi.fn().mockResolvedValue({
    ok: true,
    data: [],
  });

  const getLastVerification = vi.fn().mockResolvedValue({
    ok: true,
    data: {
      project_id: 'proj',
      snapshots: [],
    },
  });

  const runBackupVerification = vi.fn().mockResolvedValue({
    ok: false,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Verification bridge offline',
      traceId: 'trace-verify-failed',
    },
    traceId: 'trace-verify-failed',
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
    expect(pushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'error',
        title: 'Backup verification failed',
        traceId: 'trace-verify-failed',
      }),
    ),
  );
  expect(
    pushToast.mock.calls.some((call) =>
      String(call[0]?.description ?? '').includes(
        'Backup verification failed. The current project was not changed',
      ),
    ),
  ).toBe(true);
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
  expect(screen.getByText('Latest verification record')).toBeInTheDocument();
  expect(screen.getByText('Project backups')).toBeInTheDocument();
  expect(screen.getByText('Saved snapshots')).toBeInTheDocument();
});
