import { describe, expect, it } from 'vitest';

import {
  buildSplitCommandRuntimeContext,
  createSplitCommandLifecycleRegistry,
  createSplitCommandLifecycleSeam,
  createSplitCommandAuthorityProfile,
  deriveSplitCommandFocusOwnershipState,
  deriveSplitCommandInputRoutingAuthority,
  createSplitCommandSecondaryLaunchContract,
  createSplitCommandPairIdentity,
} from '../../shared/splitCommandAuthority';

describe('splitCommandAuthority', () => {
  it('creates a stable pair identity from the session generation', () => {
    expect(
      createSplitCommandPairIdentity({
        sessionGeneration: 'session-123',
      }),
    ).toEqual({
      pairId: 'split-command:session-123',
      sessionGeneration: 'session-123',
    });
  });

  it('rejects empty session generation and pair identifiers', () => {
    expect(() =>
      createSplitCommandPairIdentity({
        sessionGeneration: '   ',
      }),
    ).toThrow('Split command session generation must not be empty.');
    expect(() =>
      createSplitCommandPairIdentity({
        sessionGeneration: 'session-123',
        pairId: ' ',
      }),
    ).toThrow('Split command pair id must not be empty.');
  });

  it('classifies primary and secondary authority boundaries consistently', () => {
    expect(createSplitCommandAuthorityProfile()).toEqual({
      windowRole: 'primary',
      sharedSessionTruthOwner: 'primary',
      localPresentationStateOwner: 'primary',
      staleSecondaryResurrectionForbidden: true,
      stateBoundaries: {
        sharedSessionTruth: 'shared-session-truth',
        localPresentationState: 'local-presentation-state',
        ephemeralUiState: 'ephemeral-ui-state',
      },
    });

    expect(createSplitCommandAuthorityProfile('secondary')).toEqual({
      windowRole: 'secondary',
      sharedSessionTruthOwner: 'primary',
      localPresentationStateOwner: 'secondary',
      staleSecondaryResurrectionForbidden: true,
      stateBoundaries: {
        sharedSessionTruth: 'shared-session-truth',
        localPresentationState: 'local-presentation-state',
        ephemeralUiState: 'ephemeral-ui-state',
      },
    });
  });

  it('builds launch arguments that carry pair identity and authority', () => {
    expect(
      buildSplitCommandRuntimeContext({
        sessionGeneration: 'session-123',
        windowRole: 'secondary',
        pairId: 'pair-abc',
      }),
    ).toEqual({
      pairIdentity: {
        pairId: 'pair-abc',
        sessionGeneration: 'session-123',
      },
      authority: {
        windowRole: 'secondary',
        sharedSessionTruthOwner: 'primary',
        localPresentationStateOwner: 'secondary',
        staleSecondaryResurrectionForbidden: true,
        stateBoundaries: {
          sharedSessionTruth: 'shared-session-truth',
          localPresentationState: 'local-presentation-state',
          ephemeralUiState: 'ephemeral-ui-state',
        },
      },
      launchArguments: [
        '--blackskies-split-command-role=secondary',
        '--blackskies-split-command-pair-id=pair-abc',
        '--blackskies-split-command-session-generation=session-123',
        '--blackskies-split-command-shared-session-owner=primary',
        '--blackskies-split-command-local-presentation-owner=secondary',
        '--blackskies-split-command-stale-secondary-resurrection-forbidden=true',
      ],
    });
  });

  it('keeps the stable path free of split command pairing state', () => {
    expect(
      createSplitCommandLifecycleSeam({
        experimentalEnabled: false,
        sessionGeneration: 'session-123',
      }),
    ).toBeNull();
  });

  it('creates only the expected runtime context and lifecycle registry when enabled', () => {
    const seam = createSplitCommandLifecycleSeam({
      experimentalEnabled: true,
      sessionGeneration: 'session-123',
    });

    expect(seam).not.toBeNull();
    expect(seam?.runtimeContext.pairIdentity).toEqual({
      pairId: 'split-command:session-123',
      sessionGeneration: 'session-123',
    });
    expect(seam?.registry.isActive).toBe(true);
    expect(seam?.registry.primaryWindowRegistered).toBe(false);
    expect(seam?.registry.secondaryWindowRegistered).toBe(false);
  });

  it('runs the explicit teardown callback before clearing the split command registry', () => {
    let teardownCalls = 0;
    const seam = createSplitCommandLifecycleSeam({
      experimentalEnabled: true,
      sessionGeneration: 'session-123',
      onClear: () => {
        teardownCalls += 1;
      },
    });

    expect(seam).not.toBeNull();
    seam?.registry.registerPrimaryWindow();
    seam?.registry.registerSecondaryWindow();

    seam?.clear();
    seam?.clear();

    expect(teardownCalls).toBe(2);
    expect(seam?.registry.isActive).toBe(false);
    expect(seam?.registry.fallbackState).toEqual({
      pairHealthStatus: 'cleared',
      primaryCollapseReason: null,
      secondaryLossReason: null,
      rebuildBlockReason: null,
    });
  });

  it('classifies primary and secondary focus ownership consistently', () => {
    const primaryPairIdentity = createSplitCommandPairIdentity({
      sessionGeneration: 'session-123',
    });

    expect(
      deriveSplitCommandFocusOwnershipState({
        activePairIdentity: primaryPairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-123',
        },
        windowRole: 'primary',
        fallbackState: {
          pairHealthStatus: 'healthy',
          primaryCollapseReason: null,
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    ).toEqual({
      activeWindowIdentity: {
        pairIdentity: primaryPairIdentity,
        windowRole: 'primary',
        focusOwner: 'primary',
      },
      globalFocusOwner: 'primary',
      sharedFocusAuthorityOwner: 'primary',
      localFocusOwner: 'primary',
      canOwnSharedFocus: true,
      canOwnLocalFocus: true,
      focusValidationReason: 'healthy',
    });

    expect(
      deriveSplitCommandFocusOwnershipState({
        activePairIdentity: primaryPairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-123',
        },
        windowRole: 'secondary',
        fallbackState: {
          pairHealthStatus: 'healthy',
          primaryCollapseReason: null,
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    ).toEqual({
      activeWindowIdentity: {
        pairIdentity: primaryPairIdentity,
        windowRole: 'secondary',
        focusOwner: 'secondary',
      },
      globalFocusOwner: 'primary',
      sharedFocusAuthorityOwner: 'primary',
      localFocusOwner: 'secondary',
      canOwnSharedFocus: false,
      canOwnLocalFocus: true,
      focusValidationReason: 'healthy',
    });
  });

  it('rejects stale focus ownership after primary collapse', () => {
    const activePairIdentity = createSplitCommandPairIdentity({
      sessionGeneration: 'session-123',
    });

    expect(
      deriveSplitCommandFocusOwnershipState({
        activePairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-123',
        },
        windowRole: 'primary',
        fallbackState: {
          pairHealthStatus: 'primary-lost',
          primaryCollapseReason: 'closed',
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    ).toMatchObject({
      localFocusOwner: 'none',
      canOwnSharedFocus: false,
      canOwnLocalFocus: false,
      focusValidationReason: 'primary-lost',
    });
  });

  it('blocks focus ownership reuse after teardown', () => {
    const activePairIdentity = createSplitCommandPairIdentity({
      sessionGeneration: 'session-123',
    });

    expect(
      deriveSplitCommandFocusOwnershipState({
        activePairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-123',
        },
        windowRole: 'secondary',
        fallbackState: {
          pairHealthStatus: 'cleared',
          primaryCollapseReason: null,
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    ).toMatchObject({
      localFocusOwner: 'none',
      canOwnSharedFocus: false,
      canOwnLocalFocus: false,
      focusValidationReason: 'cleared',
    });
  });

  it('rejects stale generation focus claims', () => {
    const activePairIdentity = createSplitCommandPairIdentity({
      sessionGeneration: 'session-123',
    });

    expect(
      deriveSplitCommandFocusOwnershipState({
        activePairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-456',
        },
        windowRole: 'secondary',
        fallbackState: {
          pairHealthStatus: 'healthy',
          primaryCollapseReason: null,
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    ).toMatchObject({
      localFocusOwner: 'none',
      canOwnSharedFocus: false,
      canOwnLocalFocus: false,
      focusValidationReason: 'stale-generation',
    });
  });

  it('preserves primary authority as the global focus owner', () => {
    const activePairIdentity = createSplitCommandPairIdentity({
      sessionGeneration: 'session-123',
    });

    expect(
      deriveSplitCommandFocusOwnershipState({
        activePairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-123',
        },
        windowRole: 'secondary',
        fallbackState: {
          pairHealthStatus: 'healthy',
          primaryCollapseReason: null,
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    ).toMatchObject({
      globalFocusOwner: 'primary',
      sharedFocusAuthorityOwner: 'primary',
      localFocusOwner: 'secondary',
    });
  });

  it('keeps secondary focus local-only', () => {
    const activePairIdentity = createSplitCommandPairIdentity({
      sessionGeneration: 'session-123',
    });

    expect(
      deriveSplitCommandFocusOwnershipState({
        activePairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-123',
        },
        windowRole: 'secondary',
        fallbackState: {
          pairHealthStatus: 'healthy',
          primaryCollapseReason: null,
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    ).toMatchObject({
      canOwnSharedFocus: false,
      canOwnLocalFocus: true,
      localFocusOwner: 'secondary',
    });
  });

  it('routes global input ownership to primary and keeps secondary local-only', () => {
    const activePairIdentity = createSplitCommandPairIdentity({
      sessionGeneration: 'session-123',
    });

    expect(
      deriveSplitCommandInputRoutingAuthority({
        activePairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-123',
        },
        windowRole: 'primary',
        fallbackState: {
          pairHealthStatus: 'healthy',
          primaryCollapseReason: null,
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    ).toMatchObject({
      globalFocusOwner: 'primary',
      sharedInputOwner: 'primary',
      localInputOwner: 'primary',
      staleInputClaimsRejected: true,
      focusValidationReason: 'healthy',
    });

    expect(
      deriveSplitCommandInputRoutingAuthority({
        activePairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-123',
        },
        windowRole: 'secondary',
        fallbackState: {
          pairHealthStatus: 'healthy',
          primaryCollapseReason: null,
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    ).toMatchObject({
      globalFocusOwner: 'primary',
      sharedInputOwner: 'primary',
      localInputOwner: 'secondary',
      staleInputClaimsRejected: true,
      focusValidationReason: 'healthy',
    });
  });

  it('rejects stale secondary input claims when focus ownership is invalid', () => {
    const activePairIdentity = createSplitCommandPairIdentity({
      sessionGeneration: 'session-123',
    });

    expect(
      deriveSplitCommandInputRoutingAuthority({
        activePairIdentity,
        claimedPairIdentity: {
          sessionGeneration: 'session-999',
        },
        windowRole: 'secondary',
        fallbackState: {
          pairHealthStatus: 'secondary-lost',
          primaryCollapseReason: null,
          secondaryLossReason: 'closed',
          rebuildBlockReason: null,
        },
      }),
    ).toMatchObject({
      localInputOwner: 'none',
      staleInputClaimsRejected: true,
      focusValidationReason: 'secondary-lost',
    });
  });

  it('prevents pair identity reuse after teardown and keeps secondary authority local', () => {
    const registry = createSplitCommandLifecycleRegistry({
      sessionGeneration: 'session-123',
    });

    expect(
      registry.matchesPairIdentity({
        sessionGeneration: 'session-123',
      }),
    ).toBe(true);
    expect(
      registry.matchesPairIdentity({
        sessionGeneration: 'session-456',
      }),
    ).toBe(false);

    registry.registerPrimaryWindow();
    const secondaryState = registry.registerSecondaryWindow();
    expect(secondaryState.authority.sharedSessionTruthOwner).toBe('primary');
    expect(secondaryState.authority.localPresentationStateOwner).toBe('secondary');
    expect(secondaryState.windowRole).toBe('secondary');

    registry.clear();

    expect(registry.isActive).toBe(false);
    expect(registry.primaryWindowRegistered).toBe(false);
    expect(registry.secondaryWindowRegistered).toBe(false);
    expect(registry.fallbackState).toEqual({
      pairHealthStatus: 'cleared',
      primaryCollapseReason: null,
      secondaryLossReason: null,
      rebuildBlockReason: null,
    });
    expect(
      registry.matchesPairIdentity({
        sessionGeneration: 'session-123',
      }),
    ).toBe(false);
    expect(() =>
      registry.registerPrimaryWindow(),
    ).toThrow('Split command lifecycle registry has been cleared.');
  });

  it('requires a live primary pair before preparing a secondary launch contract', () => {
    const registry = createSplitCommandLifecycleRegistry({
      sessionGeneration: 'session-123',
    });

    expect(() =>
      createSplitCommandSecondaryLaunchContract(registry),
    ).toThrow('Primary Split command window must be registered before secondary launch.');

    const primaryState = registry.registerPrimaryWindow();
    expect(primaryState.windowRole).toBe('primary');

    expect(
      createSplitCommandSecondaryLaunchContract(registry),
    ).toEqual({
      windowRole: 'secondary',
      pairIdentity: {
        pairId: 'split-command:session-123',
        sessionGeneration: 'session-123',
      },
      authority: {
        windowRole: 'secondary',
        sharedSessionTruthOwner: 'primary',
        localPresentationStateOwner: 'secondary',
        staleSecondaryResurrectionForbidden: true,
        stateBoundaries: {
          sharedSessionTruth: 'shared-session-truth',
          localPresentationState: 'local-presentation-state',
          ephemeralUiState: 'ephemeral-ui-state',
        },
      },
      requiresLivePrimaryPair: true,
      launchArguments: [
        '--blackskies-split-command-role=secondary',
        '--blackskies-split-command-pair-id=split-command:session-123',
        '--blackskies-split-command-session-generation=session-123',
        '--blackskies-split-command-shared-session-owner=primary',
        '--blackskies-split-command-local-presentation-owner=secondary',
        '--blackskies-split-command-stale-secondary-resurrection-forbidden=true',
      ],
    });

    registry.clear();

    expect(() =>
      createSplitCommandSecondaryLaunchContract(registry),
    ).toThrow('Split command lifecycle registry has been cleared.');
  });

  it('releases only the secondary registration without losing primary authority', () => {
    const registry = createSplitCommandLifecycleRegistry({
      sessionGeneration: 'session-123',
    });

    registry.registerPrimaryWindow();
    registry.registerSecondaryWindow();
    registry.releaseSecondaryWindow();

    expect(registry.primaryWindowRegistered).toBe(true);
    expect(registry.secondaryWindowRegistered).toBe(false);
    expect(
      createSplitCommandSecondaryLaunchContract(registry),
    ).toEqual(
      expect.objectContaining({
        windowRole: 'secondary',
        requiresLivePrimaryPair: true,
      }),
    );
  });

  it('marks the pair as degraded when the secondary is lost and blocks respawn until cleared', () => {
    const registry = createSplitCommandLifecycleRegistry({
      sessionGeneration: 'session-123',
    });

    registry.registerPrimaryWindow();
    registry.registerSecondaryWindow();

    expect(registry.fallbackState).toEqual({
      pairHealthStatus: 'healthy',
      primaryCollapseReason: null,
      secondaryLossReason: null,
      rebuildBlockReason: null,
    });

    expect(registry.markSecondaryLost('closed')).toEqual({
      pairHealthStatus: 'secondary-lost',
      primaryCollapseReason: null,
      secondaryLossReason: 'closed',
      rebuildBlockReason: null,
    });
    expect(registry.secondaryWindowRegistered).toBe(false);

    expect(() => createSplitCommandSecondaryLaunchContract(registry)).toThrow(
      'Split command pair is not healthy enough to launch a secondary window.',
    );

    registry.clear();

    expect(registry.fallbackState).toEqual({
      pairHealthStatus: 'cleared',
      primaryCollapseReason: null,
      secondaryLossReason: null,
      rebuildBlockReason: null,
    });
  });

  it('invalidates stale pair identity when the primary collapses', () => {
    const registry = createSplitCommandLifecycleRegistry({
      sessionGeneration: 'session-123',
    });

    registry.registerPrimaryWindow();
    registry.registerSecondaryWindow();

    expect(registry.markPrimaryCollapsed('closed')).toEqual({
      pairHealthStatus: 'primary-lost',
      primaryCollapseReason: 'closed',
      secondaryLossReason: null,
      rebuildBlockReason: null,
    });
    expect(registry.isActive).toBe(false);
    expect(registry.primaryWindowRegistered).toBe(false);
    expect(registry.secondaryWindowRegistered).toBe(false);
    expect(
      registry.matchesPairIdentity({
        sessionGeneration: 'session-123',
      }),
    ).toBe(false);
    expect(() =>
      createSplitCommandSecondaryLaunchContract(registry),
    ).toThrow('Split command pair was invalidated by primary collapse.');

    registry.clear();

    expect(registry.fallbackState).toEqual({
      pairHealthStatus: 'cleared',
      primaryCollapseReason: null,
      secondaryLossReason: null,
      rebuildBlockReason: null,
    });
  });

  it('marks rebuild attempts blocked after a secondary launch failure', () => {
    const registry = createSplitCommandLifecycleRegistry({
      sessionGeneration: 'session-123',
    });

    registry.registerPrimaryWindow();
    registry.registerSecondaryWindow();

    expect(registry.markSecondaryRebuildBlocked('secondary-launch-failed')).toEqual({
      pairHealthStatus: 'rebuild-blocked',
      primaryCollapseReason: null,
      secondaryLossReason: null,
      rebuildBlockReason: 'secondary-launch-failed',
    });
    expect(() => createSplitCommandSecondaryLaunchContract(registry)).toThrow(
      'Split command pair is not healthy enough to launch a secondary window.',
    );

    registry.clear();

    expect(registry.fallbackState).toEqual({
      pairHealthStatus: 'cleared',
      primaryCollapseReason: null,
      secondaryLossReason: null,
      rebuildBlockReason: null,
    });
  });
});
