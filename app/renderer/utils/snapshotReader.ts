type SnapshotMetadataPayload = {
  snapshot_id?: string;
  snapshotId?: string;
  created_at?: string;
  timestamp?: string;
  label?: string;
};

export type LocalSnapshotMetadata = {
  snapshotId: string;
  timestamp: string | null;
  label: string | null;
  fileCount: number;
  totalSizeBytes: number;
  manifestFound: boolean;
  manifestNotes?: string;
  metadataSource?: string | null;
};

type SnapshotRequest = {
  projectPath: string;
  snapshotId?: string;
  snapshotPath?: string;
};

const METADATA_FILES = ['snapshot.json', 'metadata.json'];
const SNAPSHOT_DIR_CANDIDATES = ['history/snapshots', '.snapshots'];

function getFsApi() {
  const fsApi = window.__electronApi?.fs;
  if (!fsApi) {
    throw new Error('Filesystem bridge unavailable.');
  }
  return fsApi;
}

async function resolveSnapshotDirectory(
  fsApi: ReturnType<typeof getFsApi>,
  projectPath: string,
  snapshotPath?: string,
  snapshotId?: string,
): Promise<string | null> {
  if (snapshotPath) {
    try {
      const candidate = fsApi.resolvePath(projectPath, snapshotPath);
      await fsApi.stat(candidate);
      return candidate;
    } catch {
      // Ignore missing path.
    }
  }

  if (!snapshotId) {
    return null;
  }

  for (const candidateRoot of SNAPSHOT_DIR_CANDIDATES) {
    const rootPath = fsApi.resolvePath(projectPath, candidateRoot);
    try {
      const entries = await fsApi.readDir(rootPath);
      const match = entries.find(
        (entry) => entry.isDirectory && entry.name.startsWith(snapshotId),
      );
      if (match) {
        return fsApi.resolvePath(rootPath, match.name);
      }
    } catch {
      // Directory may not exist yet.
    }
  }

  return null;
}

async function readSnapshotMetadata(
  fsApi: ReturnType<typeof getFsApi>,
  snapshotDir: string,
  fallbackId?: string,
): Promise<{ snapshotId: string; timestamp: string | null; label: string | null; metadataSource: string | null }> {
  for (const file of METADATA_FILES) {
    try {
      const payload = await fsApi.readJson(fsApi.resolvePath(snapshotDir, file));
      if (payload && typeof payload === 'object') {
        const record = payload as SnapshotMetadataPayload;
        return {
          snapshotId:
            record.snapshot_id ?? record.snapshotId ?? fallbackId ?? 'unknown-snapshot',
          timestamp: record.created_at ?? record.timestamp ?? null,
          label: record.label ?? null,
          metadataSource: file,
        };
      }
    } catch (error) {
      const candidate = error as { code?: string };
      if (candidate.code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }

  return {
    snapshotId: fallbackId ?? 'unknown-snapshot',
    timestamp: null,
    label: null,
    metadataSource: null,
  };
}

async function readManifest(
  fsApi: ReturnType<typeof getFsApi>,
  snapshotDir: string,
): Promise<{ manifest: { files_included?: Array<{ path?: string }> } | null; found: boolean; notes?: string }> {
  try {
    const manifest = await fsApi.readJson(fsApi.resolvePath(snapshotDir, 'manifest.json'));
    if (manifest && typeof manifest === 'object') {
      return { manifest: manifest as { files_included?: Array<{ path?: string }> }, found: true };
    }
    return { manifest: null, found: false, notes: 'Manifest exists but is malformed.' };
  } catch (error) {
    const candidate = error as { code?: string };
    if (candidate.code === 'ENOENT') {
      return {
        manifest: null,
        found: false,
        notes: 'manifest.json not found — using fallback scan.',
      };
    }
    return {
      manifest: null,
      found: false,
      notes: `Failed to read manifest: ${(error as Error).message ?? String(error)}`,
    };
  }
}

async function scanDirectory(
  dirPath: string,
  fsApi: ReturnType<typeof getFsApi>,
): Promise<{ fileCount: number; totalSize: number }> {
  let fileCount = 0;
  let totalSize = 0;
  try {
    const entries = await fsApi.readDir(dirPath);
    for (const entry of entries) {
      const resolved = fsApi.resolvePath(dirPath, entry.name);
      if (entry.isDirectory) {
        const nested = await scanDirectory(resolved, fsApi);
        fileCount += nested.fileCount;
        totalSize += nested.totalSize;
      } else if (entry.isFile) {
        try {
          const stats = await fsApi.stat(resolved);
          fileCount += 1;
          totalSize += stats.size;
        } catch {
          continue;
        }
      }
    }
  } catch {
    // Directory might not exist or be unreadable.
  }
  return { fileCount, totalSize };
}

export async function loadSnapshotMetadata(request: SnapshotRequest): Promise<LocalSnapshotMetadata> {
  const fsApi = getFsApi();
  const directory = await resolveSnapshotDirectory(
    fsApi,
    request.projectPath,
    request.snapshotPath,
    request.snapshotId,
  );
  if (!directory) {
    throw new Error('Snapshot directory could not be located.');
  }

  const metadata = await readSnapshotMetadata(fsApi, directory, request.snapshotId);
  const manifestResult = await readManifest(fsApi, directory);

  let fileCount = 0;
  let totalSizeBytes = 0;

  if (
    manifestResult.manifest &&
    Array.isArray(manifestResult.manifest.files_included) &&
    manifestResult.manifest.files_included.length > 0
  ) {
    for (const entry of manifestResult.manifest.files_included) {
      const relativePath = typeof entry.path === 'string' ? entry.path : undefined;
      if (!relativePath) {
        continue;
      }
      try {
        const stats = await fsApi.stat(fsApi.resolvePath(directory, relativePath));
        if (stats.isFile) {
          fileCount += 1;
          totalSizeBytes += stats.size;
        }
      } catch {
        continue;
      }
    }
  } else {
    const fallback = await scanDirectory(directory, fsApi);
    fileCount = fallback.fileCount;
    totalSizeBytes = fallback.totalSize;
    if (!manifestResult.notes) {
      manifestResult.notes = 'Manifest metadata unavailable; totals derived from snapshot files.';
    }
  }

  return {
    snapshotId: metadata.snapshotId,
    timestamp: metadata.timestamp,
    label: metadata.label,
    fileCount,
    totalSizeBytes,
    manifestFound: manifestResult.found,
    manifestNotes: manifestResult.notes,
    metadataSource: metadata.metadataSource,
  };
}
