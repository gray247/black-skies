import type { LivingOutlineSnapshotV1 } from './ipc/livingOutline';
import type { ProjectSpineSaveStatus, ProjectSpineSessionSnapshot } from './ipc/projectSpine';

export const COMPANION_ORIENTATION_SCHEMA_VERSION = 1 as const;
export const COMPANION_MAX_REQUEST_LENGTH = 500;

export type CompanionRouteV1 = 'orientation' | 'not-routed';
export type CompanionOrientationStatusV1 = 'available' | 'unavailable' | 'not-routed';

export interface CompanionRequestV1 {
  readonly schemaVersion: typeof COMPANION_ORIENTATION_SCHEMA_VERSION;
  readonly requestId: string;
  readonly projectId: string | null;
  readonly generation: number;
  readonly text: string;
  readonly route: CompanionRouteV1;
}

export type CompanionOrientationSourceOwnerV1 =
  | 'Project session'
  | 'Manuscript unit'
  | 'Living Outline';

export interface CompanionOrientationSourceFactV1 {
  readonly owner: CompanionOrientationSourceOwnerV1;
  readonly label: string;
  readonly currentness: 'current' | 'unavailable';
  readonly value: string;
}

export type CompanionOrientationAllowedActionV1 = 'return-to-writing' | 'dismiss';

export interface CompanionOrientationResultV1 {
  readonly schemaVersion: typeof COMPANION_ORIENTATION_SCHEMA_VERSION;
  readonly requestId: string;
  readonly projectId: string | null;
  readonly generation: number;
  readonly route: CompanionRouteV1;
  readonly status: CompanionOrientationStatusV1;
  readonly requestLabel: string;
  readonly sourceFacts: readonly CompanionOrientationSourceFactV1[];
  readonly limitationText: string;
  readonly allowedActions: readonly CompanionOrientationAllowedActionV1[];
}

const ORIENTATION_REQUESTS = new Set([
  'where am i',
  'where was i',
  'what am i working on',
]);

const ORIENTATION_ACTIONS = ['return-to-writing', 'dismiss'] as const;

function normalizeRequestText(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[?!.,]+$/u, '').replace(/\s+/gu, ' ');
}

function saveStateValue(status: ProjectSpineSaveStatus, dirtyUnitCount: number): string {
  switch (status) {
    case 'dirty':
      return `${dirtyUnitCount} unsaved manuscript unit${dirtyUnitCount === 1 ? '' : 's'}`;
    case 'saving':
      return 'Saving the current manuscript state';
    case 'saved':
      return 'Saved durably';
    case 'save-failed':
      return 'Save failed; local writing remains available';
    default:
      return 'No unsaved manuscript changes reported';
  }
}

export function routeCompanionRequest(
  text: string,
  context: {
    readonly requestId: string;
    readonly projectId: string | null;
    readonly generation: number;
  },
): CompanionRequestV1 {
  const trimmed = text.trim().slice(0, COMPANION_MAX_REQUEST_LENGTH);
  return {
    schemaVersion: COMPANION_ORIENTATION_SCHEMA_VERSION,
    requestId: context.requestId,
    projectId: context.projectId,
    generation: context.generation,
    text: trimmed,
    route: ORIENTATION_REQUESTS.has(normalizeRequestText(trimmed))
      ? 'orientation'
      : 'not-routed',
  };
}

export function deriveCompanionOrientationResult(
  request: CompanionRequestV1,
  snapshot: ProjectSpineSessionSnapshot,
  livingOutline: LivingOutlineSnapshotV1 | null,
): CompanionOrientationResultV1 {
  const base = {
    schemaVersion: COMPANION_ORIENTATION_SCHEMA_VERSION,
    requestId: request.requestId,
    projectId: request.projectId,
    generation: request.generation,
    route: request.route,
    requestLabel: request.route === 'orientation'
      ? 'Where you are in this project'
      : 'This request is not routed yet',
    allowedActions: ORIENTATION_ACTIONS,
  } as const;
  const project = snapshot.project;
  const currentProjectMatches = Boolean(
    project && request.projectId === project.projectId && request.generation === snapshot.generation,
  );

  if (request.route === 'not-routed') {
    return {
      ...base,
      status: 'not-routed',
      sourceFacts: [],
      limitationText: 'This first Companion slice only answers where you are in the current project. No AI or provider was called.',
    };
  }

  if (!currentProjectMatches || !project) {
    return {
      ...base,
      status: 'unavailable',
      sourceFacts: [],
      limitationText: 'The project changed or is unavailable, so no local orientation summary was created. Writing remains available.',
    };
  }

  const activeUnit = project.units.find((unit) => unit.id === snapshot.activeUnitId) ?? null;
  const linkedOutlineItems = activeUnit && livingOutline?.availability === 'ready'
    ? livingOutline.document.items.filter((item) => item.manuscriptUnitId === activeUnit.id)
    : [];
  const sourceFacts: CompanionOrientationSourceFactV1[] = [
    {
      owner: 'Project session',
      label: 'Project',
      currentness: 'current',
      value: `${project.title} · ${project.units.length} manuscript unit${project.units.length === 1 ? '' : 's'} · ${saveStateValue(snapshot.saveState.status, snapshot.dirtyUnitIds.length)}`,
    },
    {
      owner: 'Manuscript unit',
      label: 'Current writing',
      currentness: activeUnit ? 'current' : 'unavailable',
      value: activeUnit
        ? `${activeUnit.displayTitle} · unit ${activeUnit.order} of ${project.units.length}`
        : 'No manuscript unit is selected',
    },
    livingOutline?.availability === 'ready'
      ? {
          owner: 'Living Outline',
          label: 'Outline relationship',
          currentness: 'current',
          value: activeUnit
            ? linkedOutlineItems.length === 0
              ? 'No outline item is placed with the current writing'
              : `${linkedOutlineItems.length} outline item${linkedOutlineItems.length === 1 ? '' : 's'} placed with the current writing`
            : 'No current writing is selected to compare with the outline',
        }
      : {
          owner: 'Living Outline',
          label: 'Outline relationship',
          currentness: 'unavailable',
          value: livingOutline?.message ?? 'Living Outline is unavailable; manuscript writing is unaffected',
        },
  ];

  return {
    ...base,
    status: 'available',
    sourceFacts,
    limitationText: 'This is a temporary local orientation summary. It did not read manuscript prose, call AI, create memory, or decide what you should do next.',
  };
}
