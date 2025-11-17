import { useEffect, useMemo, useState } from 'react';
import type { SnapshotManifest, ServicesBridge, BackupVerificationReport } from '../../shared/ipc/services';

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
}

export default function SnapshotsPanel({
  projectId,
  projectPath,
  services,
  onClose,
}: SnapshotsPanelProps) {
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [verification, setVerification] = useState<BackupVerificationReport | null>(null);
  const [loading, setLoading] = useState(true);

  const statusLabel = useMemo(() => {
    if (!verification) return 'Verification pending';
    const latest = verification.snapshots[0];
    if (!latest) return 'No snapshots';
    return latest.status === 'ok' ? 'Verification OK' : 'Issues detected';
  }, [verification]);

  const fetchData = async () => {
    if (!services) return;
    setLoading(true);
    try {
      const [listResponse, verifyResponse] = await Promise.all([
        services.listProjectSnapshots?.({ projectId }),
        services.runBackupVerification?.({ projectId, latestOnly: true }),
      ]);
      if (listResponse?.ok && listResponse.data) {
        setSnapshots(
          listResponse.data.map((entry) => ({
            snapshot_id: entry.snapshot_id,
            created_at: entry.created_at,
            path: entry.path,
          })),
        );
      }
      if (verifyResponse?.ok && verifyResponse.data) {
        setVerification(verifyResponse.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [services, projectId]);

  const reveal = (relative: string) => {
    if (!services?.revealPath) return;
    const resolved = projectPath ? `${projectPath}/${relative}` : relative;
    void services.revealPath(resolved.replace('//', '/'));
  };

  return (
    <div className="snapshots-panel" role="dialog" aria-label="Snapshots">
      <div className="snapshots-panel__header">
        <h2>Snapshots & Verification</h2>
        <button type="button" onClick={onClose} aria-label="Close snapshots panel">
          Close
        </button>
      </div>
      <div className="snapshots-panel__status">
        <span>{statusLabel}</span>
        <button type="button" onClick={fetchData} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <ul className="snapshots-panel__list">
        {snapshots.map((snapshot) => (
          <li key={snapshot.snapshot_id} className="snapshots-panel__item">
            <div>
              <strong>{snapshot.snapshot_id}</strong>
              <p>{snapshot.created_at}</p>
            </div>
            <div className="snapshots-panel__actions">
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
          </li>
        ))}
        {!snapshots.length && !loading && <li>No snapshots found.</li>}
      </ul>
    </div>
  );
}
