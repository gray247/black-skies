export const SPLIT_COMMAND_WINDOW_ROLES = ['primary', 'secondary'] as const;

export type SplitCommandWindowRole = (typeof SPLIT_COMMAND_WINDOW_ROLES)[number];

export type SplitCommandStateBoundary =
  | 'shared-session-truth'
  | 'local-presentation-state'
  | 'ephemeral-ui-state';

export interface SplitCommandPairIdentity {
  readonly pairId: string;
  readonly sessionGeneration: string;
}

export interface SplitCommandAuthorityProfile {
  readonly windowRole: SplitCommandWindowRole;
  readonly sharedSessionTruthOwner: 'primary';
  readonly localPresentationStateOwner: SplitCommandWindowRole;
  readonly staleSecondaryResurrectionForbidden: true;
  readonly stateBoundaries: {
    readonly sharedSessionTruth: SplitCommandStateBoundary;
    readonly localPresentationState: SplitCommandStateBoundary;
    readonly ephemeralUiState: SplitCommandStateBoundary;
  };
}

export interface SplitCommandRuntimeContext {
  readonly pairIdentity: SplitCommandPairIdentity;
  readonly authority: SplitCommandAuthorityProfile;
  readonly launchArguments: readonly string[];
}

export interface SplitCommandWindowLifecycleState {
  readonly windowRole: SplitCommandWindowRole;
  readonly pairIdentity: SplitCommandPairIdentity;
  readonly authority: SplitCommandAuthorityProfile;
}

export interface SplitCommandLifecycleRegistry {
  readonly pairIdentity: SplitCommandPairIdentity;
  readonly authority: SplitCommandAuthorityProfile;
  readonly primaryWindowRegistered: boolean;
  readonly secondaryWindowRegistered: boolean;
  readonly isActive: boolean;
  registerPrimaryWindow(): SplitCommandWindowLifecycleState;
  registerSecondaryWindow(): SplitCommandWindowLifecycleState;
  matchesPairIdentity(input: SplitCommandRuntimeContextInput): boolean;
  clear(): void;
}

export interface SplitCommandLifecycleSeam {
  readonly runtimeContext: SplitCommandRuntimeContext;
  readonly registry: SplitCommandLifecycleRegistry;
  readonly launchArguments: readonly string[];
  clear(): void;
}

export interface SplitCommandRuntimeContextInput {
  readonly sessionGeneration: string;
  readonly windowRole?: SplitCommandWindowRole;
  readonly pairId?: string;
}

function normalizeNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
  return normalized;
}

export function createSplitCommandPairIdentity(
  input: SplitCommandRuntimeContextInput,
): SplitCommandPairIdentity {
  const sessionGeneration = normalizeNonEmpty(input.sessionGeneration, 'Split command session generation');
  const pairId = normalizeNonEmpty(input.pairId ?? `split-command:${sessionGeneration}`, 'Split command pair id');

  return {
    pairId,
    sessionGeneration,
  };
}

export function createSplitCommandAuthorityProfile(
  windowRole: SplitCommandWindowRole = 'primary',
): SplitCommandAuthorityProfile {
  return {
    windowRole,
    sharedSessionTruthOwner: 'primary',
    localPresentationStateOwner: windowRole,
    staleSecondaryResurrectionForbidden: true,
    stateBoundaries: {
      sharedSessionTruth: 'shared-session-truth',
      localPresentationState: 'local-presentation-state',
      ephemeralUiState: 'ephemeral-ui-state',
    },
  };
}

export function buildSplitCommandRuntimeContext(
  input: SplitCommandRuntimeContextInput,
): SplitCommandRuntimeContext {
  const windowRole = input.windowRole ?? 'primary';
  const pairIdentity = createSplitCommandPairIdentity(input);
  const authority = createSplitCommandAuthorityProfile(windowRole);

  return {
    pairIdentity,
    authority,
    launchArguments: [
      `--blackskies-split-command-role=${authority.windowRole}`,
      `--blackskies-split-command-pair-id=${pairIdentity.pairId}`,
      `--blackskies-split-command-session-generation=${pairIdentity.sessionGeneration}`,
      `--blackskies-split-command-shared-session-owner=${authority.sharedSessionTruthOwner}`,
      `--blackskies-split-command-local-presentation-owner=${authority.localPresentationStateOwner}`,
      `--blackskies-split-command-stale-secondary-resurrection-forbidden=${String(
        authority.staleSecondaryResurrectionForbidden,
      )}`,
    ],
  };
}

export function createSplitCommandLifecycleRegistry(
  input: SplitCommandRuntimeContextInput,
): SplitCommandLifecycleRegistry {
  const runtimeContext = buildSplitCommandRuntimeContext(input);
  let primaryWindowRegistered = false;
  let secondaryWindowRegistered = false;
  let active = true;

  function assertActive(): void {
    if (!active) {
      throw new Error('Split command lifecycle registry has been cleared.');
    }
  }

  function buildWindowLifecycleState(windowRole: SplitCommandWindowRole): SplitCommandWindowLifecycleState {
    return {
      windowRole,
      pairIdentity: runtimeContext.pairIdentity,
      authority: createSplitCommandAuthorityProfile(windowRole),
    };
  }

  return {
    get pairIdentity() {
      return runtimeContext.pairIdentity;
    },
    get authority() {
      return runtimeContext.authority;
    },
    get primaryWindowRegistered() {
      return primaryWindowRegistered;
    },
    get secondaryWindowRegistered() {
      return secondaryWindowRegistered;
    },
    get isActive() {
      return active;
    },
    registerPrimaryWindow() {
      assertActive();
      primaryWindowRegistered = true;
      return buildWindowLifecycleState('primary');
    },
    registerSecondaryWindow() {
      assertActive();
      secondaryWindowRegistered = true;
      return buildWindowLifecycleState('secondary');
    },
    matchesPairIdentity(candidateInput: SplitCommandRuntimeContextInput) {
      if (!active) {
        return false;
      }
      const candidate = createSplitCommandPairIdentity(candidateInput);
      return (
        candidate.sessionGeneration === runtimeContext.pairIdentity.sessionGeneration &&
        candidate.pairId === runtimeContext.pairIdentity.pairId
      );
    },
    clear() {
      active = false;
      primaryWindowRegistered = false;
      secondaryWindowRegistered = false;
    },
  };
}

export function createSplitCommandLifecycleSeam(
  input: SplitCommandRuntimeContextInput & { readonly experimentalEnabled: boolean },
): SplitCommandLifecycleSeam | null {
  if (!input.experimentalEnabled) {
    return null;
  }

  const runtimeContext = buildSplitCommandRuntimeContext(input);
  const registry = createSplitCommandLifecycleRegistry({
    sessionGeneration: runtimeContext.pairIdentity.sessionGeneration,
    windowRole: runtimeContext.authority.windowRole,
    pairId: runtimeContext.pairIdentity.pairId,
  });

  return {
    runtimeContext,
    registry,
    launchArguments: runtimeContext.launchArguments,
    clear: () => registry.clear(),
  };
}
