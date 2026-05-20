import { describe, expect, it } from 'vitest';

import {
  buildSplitCommandRuntimeContext,
  createSplitCommandAuthorityProfile,
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
});
