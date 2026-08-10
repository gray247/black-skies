import type {
  ProjectSpineSessionSnapshot,
  ProjectSpineWindowRole,
} from '../shared/ipc/projectSpine';

export type Stage19SessionProjectionDecision =
  | {
      readonly accepted: true;
      readonly generationChanged: boolean;
    }
  | {
      readonly accepted: false;
      readonly reason:
        | 'wrong-window-role'
        | 'unbound-command-status'
        | 'older-generation'
        | 'older-revision';
    };

function commandStatusMatchesSnapshot(snapshot: ProjectSpineSessionSnapshot): boolean {
  const status = snapshot.commandStatus;
  return Boolean(
    status &&
    status.projectId === (snapshot.project?.projectId ?? null) &&
    status.generation === snapshot.generation &&
    status.revision === snapshot.revision,
  );
}

/**
 * Pure admission rule for a renderer session projection. Main-process project
 * truth remains authoritative; this only prevents a renderer from applying a
 * projection for the wrong role or an older session/revision.
 */
export function decideStage19SessionProjection(
  current: ProjectSpineSessionSnapshot,
  next: ProjectSpineSessionSnapshot,
  windowRole: ProjectSpineWindowRole,
): Stage19SessionProjectionDecision {
  if (next.role !== windowRole) {
    return { accepted: false, reason: 'wrong-window-role' };
  }
  if (windowRole === 'command' && !commandStatusMatchesSnapshot(next)) {
    return { accepted: false, reason: 'unbound-command-status' };
  }
  if (next.generation < current.generation) {
    return { accepted: false, reason: 'older-generation' };
  }
  if (next.generation === current.generation && next.revision < current.revision) {
    return { accepted: false, reason: 'older-revision' };
  }
  return {
    accepted: true,
    generationChanged: next.generation !== current.generation,
  };
}

export type Stage19ViewPhase =
  | 'loading'
  | 'writing'
  | 'command'
  | 'command-unavailable';

export function deriveStage19ViewPhase(
  windowRole: ProjectSpineWindowRole,
  loading: boolean,
  projectionUnavailable: boolean,
  snapshot: ProjectSpineSessionSnapshot,
): Stage19ViewPhase {
  if (loading) return 'loading';
  if (windowRole === 'writing') return 'writing';
  return projectionUnavailable || !snapshot.commandStatus ? 'command-unavailable' : 'command';
}

export interface Stage19WritingAvailability {
  readonly activeDirty: boolean;
  readonly hasLocalUnsaved: boolean;
  readonly recoveryBlocksEditing: boolean;
  readonly markdownExportRequiresSave: boolean;
}

export function deriveStage19WritingAvailability(
  snapshot: ProjectSpineSessionSnapshot,
  dirtyUnitIds: ReadonlySet<string>,
): Stage19WritingAvailability {
  const activeDirty = Boolean(snapshot.activeUnitId && dirtyUnitIds.has(snapshot.activeUnitId));
  const hasLocalUnsaved = dirtyUnitIds.size > 0;
  const recoveryBlocksEditing =
    snapshot.recovery?.status === 'decision-required' || snapshot.recovery?.status === 'degraded';
  const markdownExportRequiresSave = Boolean(snapshot.project) && (
    hasLocalUnsaved ||
    (snapshot.saveState.status !== 'clean' && snapshot.saveState.status !== 'saved') ||
    snapshot.recovery?.status !== 'none'
  );
  return {
    activeDirty,
    hasLocalUnsaved,
    recoveryBlocksEditing,
    markdownExportRequiresSave,
  };
}
