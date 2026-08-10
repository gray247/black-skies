import type {
  SplitCommandOwnershipSyncMessage,
  SplitCommandWindowRole,
} from '../splitCommandAuthority';
import type { PhysicalSurfacePlacementV1 } from './contextualProductShell';
import type { ProjectSpineSessionSnapshot } from './projectSpine';

export const SPLIT_COMMAND_CHANNELS = {
  requestOwnershipSync: 'split-command:ownership-sync:request',
  ownershipSync: 'split-command:ownership-sync',
  requestSurfaceHostState: 'split-command:surface-host:request',
  activateSurface: 'split-command:surface-host:activate',
  surfaceHostChanged: 'split-command:surface-host:changed',
} as const;

export type SplitCommandChannel =
  (typeof SPLIT_COMMAND_CHANNELS)[keyof typeof SPLIT_COMMAND_CHANNELS];

export type SplitCommandLogicalSurface = 'writing' | 'command';

export type SplitCommandSecondarySurfaceStatus =
  | 'closed'
  | 'opening'
  | 'open'
  | 'lost'
  | 'unavailable';

export type SplitCommandSurfaceHostNotice =
  | 'secondary-closed'
  | 'secondary-lost'
  | 'display-removed'
  | 'secondary-launch-failed'
  | null;

/**
 * Main-authored placement and prose-free Command projection. The primary
 * renderer may use this to present either logical surface without creating a
 * second Project Session or manuscript owner.
 */
export interface SplitCommandSurfaceHostState {
  readonly schemaVersion: 1;
  readonly primarySurface: SplitCommandLogicalSurface;
  readonly commandPlacement: Extract<
    PhysicalSurfacePlacementV1,
    'current-window' | 'secondary-window'
  >;
  readonly secondaryStatus: SplitCommandSecondarySurfaceStatus;
  readonly notice: SplitCommandSurfaceHostNotice;
  readonly projectId: string | null;
  readonly generation: number;
  readonly revision: number;
  readonly commandSnapshot: ProjectSpineSessionSnapshot;
}

export interface ActivateSplitCommandSurfaceRequest {
  readonly operationId: string;
  readonly projectId: string | null;
  readonly generation: number;
  readonly targetSurface: SplitCommandLogicalSurface;
  readonly placement: Extract<
    PhysicalSurfacePlacementV1,
    'current-window' | 'secondary-window'
  >;
}

export type SplitCommandSurfaceHostErrorCode =
  | 'INVALID_REQUEST'
  | 'WRONG_WINDOW_ROLE'
  | 'STALE_PROJECT'
  | 'STALE_GENERATION'
  | 'SECONDARY_UNAVAILABLE';

export type SplitCommandSurfaceHostResult =
  | {
      readonly ok: true;
      readonly state: SplitCommandSurfaceHostState;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: SplitCommandSurfaceHostErrorCode;
        readonly message: string;
      };
      readonly state: SplitCommandSurfaceHostState;
    };

export interface SplitCommandOwnershipBridge {
  readonly windowRole: SplitCommandWindowRole;
  requestOwnershipSync(): Promise<SplitCommandOwnershipSyncMessage | null>;
  readOwnershipSync(): SplitCommandOwnershipSyncMessage | null;
  subscribeOwnershipSync(
    listener: (message: SplitCommandOwnershipSyncMessage) => void,
  ): () => void;
  requestSurfaceHostState(): Promise<SplitCommandSurfaceHostState | null>;
  activateSurface(
    request: ActivateSplitCommandSurfaceRequest,
  ): Promise<SplitCommandSurfaceHostResult>;
  readSurfaceHostState(): SplitCommandSurfaceHostState | null;
  subscribeSurfaceHostState(
    listener: (state: SplitCommandSurfaceHostState) => void,
  ): () => void;
}
