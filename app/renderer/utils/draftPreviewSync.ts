export interface DraftPreviewSyncState {
  sourceId: string;
  projectPath: string;
  activeSceneId: string | null;
  projectDrafts: Record<string, string>;
  draftEdits: Record<string, string>;
  updatedAt: number;
}

const DRAFT_PREVIEW_SYNC_STORAGE_PREFIX = 'blackskies.draft-preview-state:';

export function getDraftPreviewSyncKey(projectPath: string | null): string | null {
  if (!projectPath || projectPath.length === 0) {
    return null;
  }
  return `${DRAFT_PREVIEW_SYNC_STORAGE_PREFIX}${encodeURIComponent(projectPath)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseStringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>((accumulator, [key, rawValue]) => {
    if (typeof rawValue === 'string') {
      accumulator[key] = rawValue;
    }
    return accumulator;
  }, {});
}

export function parseDraftPreviewSyncState(rawValue: string | null): DraftPreviewSyncState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    const projectPath = typeof parsed.projectPath === 'string' ? parsed.projectPath : '';
    const sourceId = typeof parsed.sourceId === 'string' ? parsed.sourceId : '';
    const activeSceneId = typeof parsed.activeSceneId === 'string' ? parsed.activeSceneId : null;
    const updatedAt =
      typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt)
        ? parsed.updatedAt
        : Date.now();

    if (!projectPath || !sourceId) {
      return null;
    }

    return {
      sourceId,
      projectPath,
      activeSceneId,
      projectDrafts: parseStringMap(parsed.projectDrafts),
      draftEdits: parseStringMap(parsed.draftEdits),
      updatedAt,
    };
  } catch {
    return null;
  }
}

export function readDraftPreviewSyncState(projectPath: string | null): DraftPreviewSyncState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageKey = getDraftPreviewSyncKey(projectPath);
  if (!storageKey) {
    return null;
  }

  return parseDraftPreviewSyncState(window.localStorage.getItem(storageKey));
}

export function writeDraftPreviewSyncState(
  projectPath: string | null,
  state: DraftPreviewSyncState,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = getDraftPreviewSyncKey(projectPath);
  if (!storageKey) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function clearDraftPreviewSyncState(projectPath: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = getDraftPreviewSyncKey(projectPath);
  if (!storageKey) {
    return;
  }

  window.localStorage.removeItem(storageKey);
}

export function createDraftPreviewSyncState(input: {
  sourceId: string;
  projectPath: string;
  activeSceneId: string | null;
  projectDrafts: Record<string, string>;
  draftEdits: Record<string, string>;
}): DraftPreviewSyncState {
  return {
    sourceId: input.sourceId,
    projectPath: input.projectPath,
    activeSceneId: input.activeSceneId,
    projectDrafts: { ...input.projectDrafts },
    draftEdits: { ...input.draftEdits },
    updatedAt: Date.now(),
  };
}
