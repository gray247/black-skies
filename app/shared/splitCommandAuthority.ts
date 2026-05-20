export const SPLIT_COMMAND_WINDOW_ROLES = ['primary', 'secondary'] as const;

export type SplitCommandWindowRole = (typeof SPLIT_COMMAND_WINDOW_ROLES)[number];

export type SplitCommandStateBoundary =
  | 'shared-session-truth'
  | 'local-presentation-state'
  | 'ephemeral-ui-state';

export type SplitCommandSecondaryLossReason =
  | 'closed'
  | 'crashed'
  | 'destroyed';

export type SplitCommandPairHealthStatus = 'healthy' | 'secondary-lost' | 'cleared';

export interface SplitCommandPairFallbackState {
  readonly pairHealthStatus: SplitCommandPairHealthStatus;
  readonly secondaryLossReason: SplitCommandSecondaryLossReason | null;
}

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

export interface SplitCommandSecondaryLaunchContract {
  readonly windowRole: 'secondary';
  readonly pairIdentity: SplitCommandPairIdentity;
  readonly authority: SplitCommandAuthorityProfile;
  readonly launchArguments: readonly string[];
  readonly requiresLivePrimaryPair: true;
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
  readonly fallbackState: SplitCommandPairFallbackState;
  registerPrimaryWindow(): SplitCommandWindowLifecycleState;
  registerSecondaryWindow(): SplitCommandWindowLifecycleState;
  releaseSecondaryWindow(): void;
  markSecondaryLost(reason: SplitCommandSecondaryLossReason): SplitCommandPairFallbackState;
  createSecondaryLaunchContract(): SplitCommandSecondaryLaunchContract;
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

export function createSplitCommandSecondaryLaunchContract(
  registry: Pick<
    SplitCommandLifecycleRegistry,
    | 'pairIdentity'
    | 'authority'
    | 'isActive'
    | 'primaryWindowRegistered'
    | 'secondaryWindowRegistered'
    | 'fallbackState'
  >,
): SplitCommandSecondaryLaunchContract {
  if (!registry.isActive) {
    throw new Error('Split command lifecycle registry has been cleared.');
  }
  if (!registry.primaryWindowRegistered) {
    throw new Error('Primary Split command window must be registered before secondary launch.');
  }
  if (registry.secondaryWindowRegistered) {
    throw new Error('Secondary Split command window is already registered.');
  }
  if (registry.fallbackState.pairHealthStatus !== 'healthy') {
    throw new Error('Split command pair is not healthy enough to launch a secondary window.');
  }

  const authority = createSplitCommandAuthorityProfile('secondary');
  return {
    windowRole: 'secondary',
    pairIdentity: registry.pairIdentity,
    authority,
    requiresLivePrimaryPair: true,
    launchArguments: [
      `--blackskies-split-command-role=${authority.windowRole}`,
      `--blackskies-split-command-pair-id=${registry.pairIdentity.pairId}`,
      `--blackskies-split-command-session-generation=${registry.pairIdentity.sessionGeneration}`,
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
  let fallbackState: SplitCommandPairFallbackState = {
    pairHealthStatus: 'healthy',
    secondaryLossReason: null,
  };

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
    get fallbackState() {
      return fallbackState;
    },
    registerPrimaryWindow() {
      assertActive();
      if (primaryWindowRegistered) {
        throw new Error('Primary Split command window is already registered.');
      }
      primaryWindowRegistered = true;
      return buildWindowLifecycleState('primary');
    },
    registerSecondaryWindow() {
      assertActive();
      if (!primaryWindowRegistered) {
        throw new Error('Primary Split command window must be registered before secondary registration.');
      }
      if (secondaryWindowRegistered) {
        throw new Error('Secondary Split command window is already registered.');
      }
      secondaryWindowRegistered = true;
      fallbackState = {
        pairHealthStatus: 'healthy',
        secondaryLossReason: null,
      };
      return buildWindowLifecycleState('secondary');
    },
    releaseSecondaryWindow() {
      if (!active) {
        return;
      }
      secondaryWindowRegistered = false;
    },
    markSecondaryLost(reason: SplitCommandSecondaryLossReason) {
      if (!active) {
        return fallbackState;
      }
      secondaryWindowRegistered = false;
      fallbackState = {
        pairHealthStatus: 'secondary-lost',
        secondaryLossReason: reason,
      };
      return fallbackState;
    },
    createSecondaryLaunchContract() {
      return createSplitCommandSecondaryLaunchContract({
        pairIdentity: runtimeContext.pairIdentity,
        authority: runtimeContext.authority,
        isActive: active,
        primaryWindowRegistered,
        secondaryWindowRegistered,
        fallbackState,
      });
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
      fallbackState = {
        pairHealthStatus: 'cleared',
        secondaryLossReason: null,
      };
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
