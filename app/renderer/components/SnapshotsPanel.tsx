import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
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
}: SnapshotsPanelProps) {
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [verification, setVerification] = useState<BackupVerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [runningSnapshotId, setRunningSnapshotId] = useState<string | null>(null);
  const [isRestoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoringZip, setRestoringZip] = useState(false);

  const verificationById = useMemo(() => {
    const index: Record<string, SnapshotVerificationSummary> = {};
    verification?.snapshots?.forEach((entry) => {
      if (entry.snapshot_id) {
        index[entry.snapshot_id] = entry;
      }
    });
    return index;
  }, [verification]);

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
    }
  }, [projectId, projectPath, services]);

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
      <div className="snapshots-panel__status">
        <span>{statusLabel}</span>
        <button type="button" onClick={fetchData} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
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
