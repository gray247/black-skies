export const SESSION_LIFECYCLE_STATES = [
  'bootstrap',
  'session-attached',
  'project-loaded',
  'draft-hydrated',
  'editing',
  'save-export',
  'reload-reopen',
  'recover-fail-closed',
] as const;

export type SessionLifecycleState = (typeof SESSION_LIFECYCLE_STATES)[number];

export const SESSION_LIFECYCLE_STEPS = SESSION_LIFECYCLE_STATES;
export type SessionLifecycleStep = SessionLifecycleState;

export const DRAFT_SESSION_STATE_CLASSIFICATIONS = [
  'runtime-only',
  'persisted',
  'dirty',
  'unsaved',
  'stale',
  'partial',
  'recovery-required',
] as const;

export type DraftSessionStateClassification = (typeof DRAFT_SESSION_STATE_CLASSIFICATIONS)[number];

export const DRAFT_STATE_CLASSIFICATIONS = DRAFT_SESSION_STATE_CLASSIFICATIONS;
export type DraftStateClassification = DraftSessionStateClassification;

export const RUNTIME_OWNERSHIP_SURFACES = [
  'main-process',
  'renderer',
  'backend-service',
  'persisted-project-files',
] as const;

export type RuntimeOwnershipSurface = (typeof RUNTIME_OWNERSHIP_SURFACES)[number];

export interface SessionLifecycleContract {
  readonly currentState: SessionLifecycleState;
  readonly states: readonly SessionLifecycleState[];
}

export interface RuntimeTruthBoundaryContract {
  readonly runtimeTruth: 'runtime-only';
  readonly projectTruth: 'persisted';
  readonly runtimeOwnershipSurface: 'renderer';
  readonly projectOwnershipSurface: 'persisted-project-files';
}

export interface SessionOwnershipContract {
  readonly mainProcess: {
    readonly owns: readonly [
      'session bootstrap',
      'session lifecycle coordination',
      'project load/recover classification',
      'persistence gating',
    ];
    readonly doesNotOwn: readonly ['draft authoring', 'content quality claims', 'project truth content'];
  };
  readonly renderer: {
    readonly owns: readonly [
      'visible authoring session surface',
      'local editing state',
      'user intent capture',
    ];
    readonly doesNotOwn: readonly [
      'durable truth promotion',
      'silent repair',
      'project identity authority',
    ];
  };
  readonly backendService: {
    readonly owns: readonly ['generation', 'critique', 'accept assistance', 'analysis'];
    readonly doesNotOwn: readonly [
      'session authority',
      'project truth authority',
      'window authority',
    ];
  };
  readonly persistedProjectFiles: {
    readonly owns: readonly ['project truth', 'durable draft/source files', 'recovery artifacts'];
    readonly doesNotOwn: readonly [
      'runtime-only state',
      'window-local UI state',
      'ephemeral caches',
    ];
  };
}

export interface DraftSessionStateContract {
  readonly classifications: readonly DraftStateClassification[];
}

export type DraftStateTruthContract = DraftSessionStateContract;

export interface RuntimeSessionTruthContract {
  readonly runtimeTruthBoundary: RuntimeTruthBoundaryContract;
  readonly sessionLifecycle: SessionLifecycleContract;
  readonly sessionOwnership: SessionOwnershipContract;
  readonly draftSessionState: DraftSessionStateContract;
}

const DRAFT_STATE_CLASSIFICATION_SET = new Set<string>(DRAFT_SESSION_STATE_CLASSIFICATIONS);
const SESSION_LIFECYCLE_STATE_SET = new Set<string>(SESSION_LIFECYCLE_STATES);
const RUNTIME_OWNERSHIP_SURFACE_SET = new Set<string>(RUNTIME_OWNERSHIP_SURFACES);

export function isSessionLifecycleState(value: string): value is SessionLifecycleState {
  return SESSION_LIFECYCLE_STATE_SET.has(value);
}

export function isSessionLifecycleStep(value: string): value is SessionLifecycleState {
  return isSessionLifecycleState(value);
}

export function isDraftSessionStateClassification(
  value: string,
): value is DraftSessionStateClassification {
  return DRAFT_STATE_CLASSIFICATION_SET.has(value);
}

export function isDraftStateClassification(value: string): value is DraftSessionStateClassification {
  return isDraftSessionStateClassification(value);
}

export function isRuntimeOwnershipSurface(value: string): value is RuntimeOwnershipSurface {
  return RUNTIME_OWNERSHIP_SURFACE_SET.has(value);
}

export function createRuntimeTruthBoundaryContract(): RuntimeTruthBoundaryContract {
  return Object.freeze({
    runtimeTruth: 'runtime-only',
    projectTruth: 'persisted',
    runtimeOwnershipSurface: 'renderer',
    projectOwnershipSurface: 'persisted-project-files',
  });
}

export function createSessionOwnershipContract(): SessionOwnershipContract {
  return Object.freeze({
    mainProcess: Object.freeze({
      owns: Object.freeze([
        'session bootstrap',
        'session lifecycle coordination',
        'project load/recover classification',
        'persistence gating',
      ] as const),
      doesNotOwn: Object.freeze([
        'draft authoring',
        'content quality claims',
        'project truth content',
      ] as const),
    }),
    renderer: Object.freeze({
      owns: Object.freeze([
        'visible authoring session surface',
        'local editing state',
        'user intent capture',
      ] as const),
      doesNotOwn: Object.freeze([
        'durable truth promotion',
        'silent repair',
        'project identity authority',
      ] as const),
    }),
    backendService: Object.freeze({
      owns: Object.freeze(['generation', 'critique', 'accept assistance', 'analysis'] as const),
      doesNotOwn: Object.freeze(['session authority', 'project truth authority', 'window authority'] as const),
    }),
    persistedProjectFiles: Object.freeze({
      owns: Object.freeze(['project truth', 'durable draft/source files', 'recovery artifacts'] as const),
      doesNotOwn: Object.freeze([
        'runtime-only state',
        'window-local UI state',
        'ephemeral caches',
      ] as const),
    }),
  });
}

export function createSessionLifecycleContract(
  currentState: SessionLifecycleState,
): SessionLifecycleContract {
  if (!isSessionLifecycleState(currentState)) {
    throw new Error(`Unknown session lifecycle state: ${currentState}`);
  }

  return Object.freeze({
    currentState,
    states: Object.freeze([...SESSION_LIFECYCLE_STATES]),
  });
}

export function createDraftSessionStateContract(
  classifications: readonly DraftSessionStateClassification[],
): DraftSessionStateContract {
  const validated = classifications.map((classification) => {
    if (!isDraftSessionStateClassification(classification)) {
      throw new Error(`Unknown draft/session state classification: ${classification}`);
    }
    return classification;
  });

  return Object.freeze({
    classifications: Object.freeze(validated),
  });
}

export function createRuntimeSessionTruthContract(input: {
  readonly sessionLifecycleState: SessionLifecycleState;
  readonly draftSessionStateClassifications: readonly DraftSessionStateClassification[];
}): RuntimeSessionTruthContract {
  return Object.freeze({
    runtimeTruthBoundary: createRuntimeTruthBoundaryContract(),
    sessionLifecycle: createSessionLifecycleContract(input.sessionLifecycleState),
    sessionOwnership: createSessionOwnershipContract(),
    draftSessionState: createDraftSessionStateContract(input.draftSessionStateClassifications),
  });
}
