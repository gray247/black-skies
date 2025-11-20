import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BackupSummary,
  BackupVerificationReport,
  ServicesBridge,
  SnapshotVerificationSummary,
} from '../../shared/ipc/services';
import type { ServiceStatus } from '../components/ServiceStatusPill';
import type { ToastPayload } from '../types/toast';

const MAX_ISSUES_DISPLAY = 10;
const SHORT_ID_LENGTH = 8;

interface SnapshotRow {
  snapshot_id: string;
  created_at: string;
  path: string;
}

interface SnapshotsPanelProps {
  projectId: string;
  projectPath: string | null;
  services: ServicesBridge | undefined;
  onClose?: () => void;
  serviceStatus: ServiceStatus;
  pushToast: (payload: ToastPayload) => void;
  onRunVerification?: () => Promise<void> | void;
}

type IssuePayload = string | { reason?: unknown; [key: string]: unknown };

const formatShortSnapshotId = (snapshotId: string): string =>
  snapshotId.length <= SHORT_ID_LENGTH ? snapshotId : `${snapshotId.slice(0, SHORT_ID_LENGTH)}…`;

const describeIssue = (issue: IssuePayload | undefined): string => {
  if (typeof issue === 'string') {
    return issue;
  }
  if (issue && typeof issue.reason === 'string') {
    return issue.reason;
  }
  try {
    return JSON.stringify(issue);
  } catch {
    return 'Unknown issue';
  }
};

const resolveIssueList = (entry?: SnapshotVerificationSummary): string[] => {
  if (!entry) {
    return [];
  }
  if (entry.errors && entry.errors.length > 0) {
    return entry.errors;
  }
  if (entry.issues && entry.issues.length > 0) {
    return entry.issues.map((issue) => describeIssue(issue));
  }
  return [];
};

export default function SnapshotsPanel({
  projectId,
  projectPath,
  services,
  onClose,
  serviceStatus,
  pushToast,
  onRunVerification,
}: SnapshotsPanelProps) {
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [verification, setVerification] = useState<BackupVerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [runningSnapshotId, setRunningSnapshotId] = useState<string | null>(null);
  const [isRestoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoringZip, setRestoringZip] = useState(false);
  const [backups, setBackups] = useState<BackupSummary[]>([]);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(true);
  const [creatingBackup, setCreatingBackup] = useState<boolean>(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [runningVerification, setRunningVerification] = useState<boolean>(false);

  const verificationById = useMemo(() => {
    const index: Record<string, SnapshotVerificationSummary> = {};
    verification?.snapshots?.forEach((entry) => {
      if (entry.snapshot_id) {
        index[entry.snapshot_id] = entry;
      }
    });
    return index;
  }, [verification]);

  const fetchBackups = useCallback(async () => {
    if (!services?.listBackups || !projectId) {
      setBackups([]);
      setLoadingBackups(false);
      return;
    }

    setLoadingBackups(true);
    try {
      const response = await services.listBackups({ projectId });
      if (response.ok && Array.isArray(response.data)) {
        setBackups(response.data);
      } else {
        setBackups([]);
      }
    } catch (error) {
      console.warn('[SnapshotsPanel] Failed to refresh backups', error);
      setBackups([]);
    } finally {
      setLoadingBackups(false);
    }
  }, [projectId, services]);

  const fetchData = useCallback(async () => {
    if (!services) {
      setSnapshots([]);
      setVerification(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const listPromise =
        services.listProjectSnapshots?.({ projectId }) ??
        Promise.resolve({ ok: true, data: [] });
      const verificationPromise =
        services.getLastVerification?.({ projectId, projectPath }) ??
        Promise.resolve({ ok: true, data: null });

      const [listResponse, verificationResponse] = await Promise.all([
        listPromise,
        verificationPromise,
      ]);

      if (listResponse?.ok && listResponse.data) {
        setSnapshots(
          listResponse.data.map((entry) => ({
            snapshot_id: entry.snapshot_id,
            created_at: entry.created_at,
            path: entry.path,
          })),
        );
      } else {
        setSnapshots([]);
      }

      if (verificationResponse?.ok) {
        setVerification(verificationResponse.data);
      } else {
        setVerification(null);
      }
    } finally {
      setLoading(false);
      void fetchBackups();
    }
  }, [projectId, projectPath, services, fetchBackups]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    setExpandedIds({});
  }, [projectId]);

  const toggleDetails = useCallback((snapshotId: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [snapshotId]: !prev[snapshotId],
    }));
  }, []);

  const reveal = (relative: string) => {
    if (!services?.revealPath) {
      return;
    }
    const resolved = projectPath ? `${projectPath}/${relative}` : relative;
    void services.revealPath(resolved.replace('//', '/'));
  };

  const offline = serviceStatus !== 'online';
  const canRevealReport = Boolean(projectPath && services?.revealPath);
  const hasProject = Boolean(projectId || projectPath);
  const canRestoreFromZip = Boolean(projectId && services?.restoreFromZip && !offline);
  const backupsUnavailable = Boolean(!services?.listBackups);
  const statusLabel = useMemo(() => {
    if (loading) {
      return 'Refreshing verification...';
    }
    if (!verification) {
      return 'Verification data unavailable';
    }
    if (verification.snapshots.length === 0) {
      return 'No snapshots verified';
    }
    const latest = verification.snapshots[0];
    if (latest?.status === 'ok') {
      return 'Latest snapshot verified';
    }
    return 'Verification issues detected';
  }, [loading, verification]);

  const lastVerificationTimestamp = useMemo(() => {
    if (!verification?.verified_at) {
      return 'Not checked yet';
    }
    const parsed = new Date(verification.verified_at);
    if (Number.isNaN(parsed.getTime())) {
      return verification.verified_at;
    }
    return parsed.toLocaleString();
  }, [verification?.verified_at]);

  const verificationMessage =
    verification?.message ?? 'Last verification report not available.';

  const handleReRun = useCallback(
    async (snapshotId: string) => {
      if (runningSnapshotId || offline) {
        return;
      }
      if (!services?.runBackupVerification) {
        pushToast({
          tone: 'warning',
          title: 'Verification unavailable',
          description: 'Local services are still starting.',
        });
        return;
      }

      const shortId = formatShortSnapshotId(snapshotId);
      pushToast({
        tone: 'info',
        title: 'Re-running verification',
        description: `Checking snapshot ${shortId}.`,
      });

      setRunningSnapshotId(snapshotId);
      try {
        const response = await services.runBackupVerification({
          projectId,
          latestOnly: true,
        });
        if (!response.ok) {
          pushToast({
            tone: 'error',
            title: 'Verification failed',
            description: response.error?.message ?? 'Unable to verify snapshots.',
          });
          return;
        }

        const latestResult = response.data?.snapshots?.[0];
        const hasIssues =
          latestResult?.status === 'errors' ||
          (latestResult?.errors?.length ?? 0) > 0 ||
          (latestResult?.issues?.length ?? 0) > 0;
        const tone: ToastPayload['tone'] = hasIssues ? 'warning' : 'success';
        const issueCount =
          latestResult?.errors?.length ??
          latestResult?.issues?.length ??
          (hasIssues ? 1 : 0);

        pushToast({
          tone,
          title: 'Snapshot verification',
          description: hasIssues
            ? `${issueCount} issue(s) detected`
            : 'Latest snapshot verified',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to verify snapshots.';
        pushToast({
          tone: 'error',
          title: 'Verification failed',
          description: message,
        });
      } finally {
        setRunningSnapshotId(null);
        void fetchData();
      }
    },
    [fetchData, offline, projectId, pushToast, runningSnapshotId, services],
  );

  const handleManualVerification = useCallback(async () => {
    if (runningVerification) {
      return;
    }

    if (!projectId) {
      pushToast({
        tone: 'warning',
        title: 'Verification unavailable',
        description: 'Open a project before running verification.',
      });
      return;
    }

    if (onRunVerification) {
      setRunningVerification(true);
      try {
        await onRunVerification();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to verify snapshots.';
        pushToast({
          tone: 'error',
          title: 'Verification failed',
          description: message,
        });
      } finally {
        setRunningVerification(false);
        void fetchData();
      }
      return;
    }

    if (!services?.runBackupVerification || offline) {
      pushToast({
        tone: 'warning',
        title: 'Verification unavailable',
        description: 'Local services are still starting.',
      });
      return;
    }

    setRunningVerification(true);
    pushToast({
      tone: 'info',
      title: 'Running verification',
      description: 'Checking backups and snapshots.',
    });
    try {
      const response = await services.runBackupVerification({
        projectId,
        latestOnly: true,
      });
      if (!response.ok) {
        pushToast({
          tone: 'error',
          title: 'Verification failed',
          description: response.error?.message ?? 'Unable to verify snapshots.',
        });
        return;
      }

      const latestResult = response.data?.snapshots?.[0];
      const hasIssues =
        latestResult?.status === 'errors' ||
        (latestResult?.errors?.length ?? 0) > 0 ||
        (latestResult?.issues?.length ?? 0) > 0;
      const tone: ToastPayload['tone'] = hasIssues ? 'warning' : 'success';
      const issueCount =
        latestResult?.errors?.length ??
        latestResult?.issues?.length ??
        (hasIssues ? 1 : 0);

      pushToast({
        tone,
        title: 'Snapshot verification',
        description: hasIssues
          ? `${issueCount} issue(s) detected`
          : 'Latest snapshot verified',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify snapshots.';
      pushToast({
        tone: 'error',
        title: 'Verification failed',
        description: message,
      });
    } finally {
      setRunningVerification(false);
      void fetchData();
    }
  }, [fetchData, offline, onRunVerification, projectId, pushToast, runningVerification, services]);

  const handleCreateBackup = useCallback(async () => {
    if (creatingBackup) {
      return;
    }

    if (!projectId) {
      pushToast({
        tone: 'warning',
        title: 'Backup unavailable',
        description: 'Open a project before creating a backup.',
      });
      return;
    }

    if (!services?.createBackup || offline) {
      pushToast({
        tone: 'warning',
        title: 'Backup unavailable',
        description: 'Local services are still starting.',
      });
      return;
    }

    setCreatingBackup(true);
    try {
      const response = await services.createBackup({ projectId });
      if (!response.ok) {
        pushToast({
          tone: 'error',
          title: 'Backup failed',
          description: response.error?.message ?? 'Unable to create backup.',
        });
        return;
      }

      const backupName = response.data?.filename ?? 'backup bundle';
      pushToast({
        tone: 'success',
        title: 'Backup created',
        description: `Created backup ${backupName}`,
      });
      void fetchBackups();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create backup.';
      pushToast({
        tone: 'error',
        title: 'Backup failed',
        description: message,
      });
    } finally {
      setCreatingBackup(false);
    }
  }, [creatingBackup, fetchBackups, offline, projectId, pushToast, services]);

  const handleRestoreBackup = useCallback(
    async (backupName: string) => {
      if (!projectId) {
        pushToast({
          tone: 'warning',
          title: 'Backup restore unavailable',
          description: 'Open a project before restoring a backup.',
        });
        return;
      }

      if (!services?.restoreBackup || offline) {
        pushToast({
          tone: 'warning',
          title: 'Backup restore unavailable',
          description: 'Local services are still starting.',
        });
        return;
      }

      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm(`Restore backup "${backupName}" into a new project folder?`)
          : true;
      if (!confirmed) {
        return;
      }

      setRestoringBackup(backupName);
      try {
        const response = await services.restoreBackup({ backupName });
        if (!response.ok) {
          pushToast({
            tone: 'error',
            title: 'Backup restore failed',
            description: response.error?.message ?? 'Unable to restore backup.',
          });
          return;
        }

        const payload = response.data;
        if (payload?.status !== 'ok') {
          pushToast({
            tone: 'error',
            title: 'Backup restore failed',
            description: payload?.message ?? 'Unable to restore backup.',
          });
          return;
        }

        pushToast({
          tone: 'success',
          title: 'Backup restored',
          description: payload.restored_project_slug
            ? `Restored as ${payload.restored_project_slug}`
            : 'Backup restored successfully.',
          actions:
            payload.restored_path && services.revealPath
              ? [
                  {
                    label: 'Open folder',
                    onPress: () => {
                      void services.revealPath?.(payload.restored_path);
                    },
                  },
                ]
              : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to restore backup.';
        pushToast({
          tone: 'error',
          title: 'Backup restore failed',
          description: message,
        });
      } finally {
        setRestoringBackup(null);
      }
    },
    [offline, projectId, pushToast, services],
  );

  const handleConfirmRestore = useCallback(async () => {
    if (!projectId || !services?.restoreFromZip) {
      setRestoreConfirmOpen(false);
      return;
    }

    setRestoringZip(true);
    pushToast({
      tone: 'info',
      title: 'Restoring from ZIP',
      description: 'A duplicate of the project will be created.',
    });

    try {
      const response = await services.restoreFromZip({
        projectId,
        restoreAsNew: true,
      });
      if (!response.ok) {
        pushToast({
          tone: 'error',
          title: 'Restore failed',
          description: response.error?.message ?? 'Unable to restore from ZIP.',
        });
        return;
      }

      const payload = response.data;
      if (!payload || payload.status !== 'ok') {
        pushToast({
          tone: 'error',
          title: 'Restore failed',
          description: payload?.message ?? 'Unable to restore from ZIP.',
        });
        return;
      }

      const restoredPath = payload.restored_path;
      pushToast({
        tone: 'success',
        title: 'Restore complete',
        description: restoredPath
          ? `Restored to ${restoredPath}`
          : 'Project restored successfully.',
        actions:
          restoredPath && services.revealPath
            ? [
                {
                  label: 'Open folder',
                  onPress: () => {
                    void services.revealPath?.(restoredPath);
                  },
                },
              ]
            : undefined,
      });
    } finally {
      setRestoringZip(false);
      setRestoreConfirmOpen(false);
    }
  }, [projectId, pushToast, services]);

  if (!hasProject) {
    return (
      <div
        id="snapshots-panel"
        data-testid="snapshots-panel"
        className="snapshots-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Snapshots"
      >
        <div className="snapshots-panel__header">
          <h2>Snapshots</h2>
        </div>
        <div className="snapshots-empty">No project selected</div>
      </div>
    );
  }

  return (
    <div
      id="snapshots-panel"
      data-testid="snapshots-panel"
      className="snapshots-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Snapshots"
    >
      <div className="snapshots-panel__header">
        <h2>Snapshots & Verification</h2>
        <button type="button" onClick={onClose} aria-label="Close snapshots panel">
          Close
        </button>
      </div>
      <div className="snapshots-panel__health">
        <div className="snapshots-panel__health__details">
          <p className="snapshots-panel__health__label">Backup & snapshots health</p>
          <p
            className="snapshots-panel__health__status"
            data-testid="snapshots-health-status"
          >
            {statusLabel}
          </p>
          <p className="snapshots-panel__health__timestamp">
            Last check: {lastVerificationTimestamp}
          </p>
          <p className="snapshots-panel__health__message">{verificationMessage}</p>
        </div>
        <div className="snapshots-panel__health__actions">
          <button
            type="button"
            className="snapshots-panel__health-button"
            data-testid="snapshots-refresh-status-button"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh status'}
          </button>
          <button
            type="button"
            className="snapshots-panel__health-button"
            data-testid="snapshots-manual-verify-button"
            onClick={handleManualVerification}
            disabled={runningVerification || offline}
          >
            {runningVerification ? 'Running verification…' : 'Run verification'}
          </button>
        </div>
      </div>
      <div className="snapshots-panel__backups">
        <div className="snapshots-panel__backups-header">
          <strong>Backups</strong>
          <button
            type="button"
            className="snapshots-panel__backups-create"
            data-testid="snapshots-backup-create"
            onClick={handleCreateBackup}
            disabled={creatingBackup || offline || backupsUnavailable || !services?.createBackup}
          >
            {creatingBackup ? 'Creating backup…' : 'Create backup'}
          </button>
        </div>
        <div className="snapshots-panel__backups-content">
          {backupsUnavailable ? (
            <p className="snapshots-panel__backups-empty">
              Backup listing is unavailable while services start.
            </p>
          ) : loadingBackups ? (
            <p className="snapshots-panel__backups-empty">Loading backups…</p>
          ) : backups.length ? (
            <ul className="snapshots-panel__backups-list">
              {backups.map((entry) => (
                <li
                  key={entry.filename}
                  className="snapshots-panel__backup-row"
                  data-testid="snapshots-backup-row"
                >
                  <div className="snapshots-panel__backup-meta">
                    <strong>{entry.filename}</strong>
                    <p>{entry.created_at}</p>
                    <p className="snapshots-panel__backup-path">{entry.path}</p>
                  </div>
                  <div className="snapshots-panel__backup-actions">
                    <button
                      type="button"
                      aria-label={`Restore backup ${entry.filename}`}
                      data-testid={`snapshots-backup-restore-${entry.filename}`}
                      onClick={() => handleRestoreBackup(entry.filename)}
                      disabled={
                        restoringBackup === entry.filename || offline || !services?.restoreBackup
                      }
                    >
                      {restoringBackup === entry.filename ? 'Restoring…' : 'Restore'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="snapshots-panel__backups-empty">No backups available yet.</p>
          )}
        </div>
      </div>
      <div className="snapshots-panel__restore">
        <button
          type="button"
          className="snapshots-panel__restore-button"
          onClick={() => setRestoreConfirmOpen(true)}
          disabled={!canRestoreFromZip || restoringZip}
        >
          Restore latest ZIP
        </button>
      </div>
      <ul className="snapshots-panel__list snapshots-list">
        {snapshots.map((snapshot) => {
          const record = verificationById[snapshot.snapshot_id];
          const issueMessages = resolveIssueList(record);
          const displayedIssues = issueMessages.slice(0, MAX_ISSUES_DISPLAY);
          const extraIssueCount = Math.max(issueMessages.length - displayedIssues.length, 0);
          const hasIssues = issueMessages.length > 0;
          const statusKey = record
            ? hasIssues
              ? 'issues'
              : 'ok'
            : 'unknown';
          const badgeLabel =
            statusKey === 'ok' ? 'OK' : statusKey === 'issues' ? 'Issues' : 'Unknown';
          const expanded = Boolean(expandedIds[snapshot.snapshot_id]);
          const verifyingThisRow = runningSnapshotId === snapshot.snapshot_id;
          const verifyButtonTitle = offline
            ? 'Verification requires online services'
            : services?.runBackupVerification
            ? undefined
            : 'Verification unavailable';

          const badgeClassName = `snapshots-panel__badge badge badge--${statusKey}`;
          return (
            <li key={snapshot.snapshot_id} className="snapshots-panel__item snapshot-row">
              <div className="snapshots-panel__item__header">
                <div>
                  <strong title={snapshot.snapshot_id}>
                    {formatShortSnapshotId(snapshot.snapshot_id)}
                  </strong>
                  <p>{snapshot.created_at}</p>
                </div>
                <span
                  className={badgeClassName}
                  data-testid={`snapshot-badge-${snapshot.snapshot_id}`}
                >
                  {badgeLabel}
                </span>
              </div>
              <div className="snapshots-panel__item__actions">
                <button
                  type="button"
                  onClick={() => toggleDetails(snapshot.snapshot_id)}
                  aria-expanded={expanded}
                  aria-label={`Toggle verification details for ${snapshot.snapshot_id}`}
                >
                  {expanded ? 'Hide details' : 'Show details'}
                </button>
                <button
                  type="button"
                  onClick={() => reveal(snapshot.path)}
                  aria-label={`Reveal snapshot ${snapshot.snapshot_id}`}
                >
                  Reveal
                </button>
                <button
                  type="button"
                  onClick={() => reveal(`${snapshot.path}/manifest.json`)}
                  aria-label={`Reveal manifest for ${snapshot.snapshot_id}`}
                >
                  Manifest
                </button>
              </div>
              {expanded ? (
                <div
                  className="snapshots-panel__item__details snapshot-details"
                  data-testid={`snapshot-issues-${snapshot.snapshot_id}`}
                >
                  {hasIssues ? (
                    <ul>
                      {displayedIssues.map((issue, index) => (
                        <li key={`${snapshot.snapshot_id}-issue-${index}`}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No verification issues recorded.</p>
                  )}
                  {extraIssueCount > 0 ? (
                    <p className="snapshots-panel__item__more">
                      And {extraIssueCount} more issue{extraIssueCount === 1 ? '' : 's'}…
                    </p>
                  ) : null}
                  <div className="snapshots-panel__item__details__actions">
                    <button
                      type="button"
                      onClick={() => reveal('.snapshots/last_verification.json')}
                      disabled={!canRevealReport}
                      title={canRevealReport ? undefined : 'Verification report unavailable'}
                    >
                      View full report
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReRun(snapshot.snapshot_id)}
                      disabled={verifyButtonTitle !== undefined || verifyingThisRow}
                      title={verifyButtonTitle}
                    >
                      {verifyingThisRow ? 'Running verification…' : 'Re-run verification for this snapshot'}
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
        {!snapshots.length && !loading && <li>No snapshots found.</li>}
      </ul>
      {isRestoreConfirmOpen && (
        <div className="snapshots-panel__modal-backdrop">
          <div
            className="snapshots-panel__modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm restore from ZIP"
          >
            <h3>Restore latest ZIP</h3>
            <p>
              This creates a duplicate copy of the current project in a sibling folder. Existing
              projects are not overwritten.
            </p>
            <div className="snapshots-panel__modal-actions">
              <button type="button" onClick={() => setRestoreConfirmOpen(false)} disabled={restoringZip}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={!canRestoreFromZip || restoringZip}
              >
                {restoringZip ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
