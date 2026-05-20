import type {
  SplitCommandOwnershipSyncMessage,
  SplitCommandWindowRole,
} from '../splitCommandAuthority';

export const SPLIT_COMMAND_CHANNELS = {
  requestOwnershipSync: 'split-command:ownership-sync:request',
  ownershipSync: 'split-command:ownership-sync',
} as const;

export type SplitCommandChannel =
  (typeof SPLIT_COMMAND_CHANNELS)[keyof typeof SPLIT_COMMAND_CHANNELS];

export interface SplitCommandOwnershipBridge {
  readonly windowRole: SplitCommandWindowRole;
  requestOwnershipSync(): Promise<SplitCommandOwnershipSyncMessage | null>;
  readOwnershipSync(): SplitCommandOwnershipSyncMessage | null;
  subscribeOwnershipSync(
    listener: (message: SplitCommandOwnershipSyncMessage) => void,
  ): () => void;
}
