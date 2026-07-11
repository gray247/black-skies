import type { ProjectSpineWindowRole } from '../../shared/ipc/projectSpine';
import type { SplitCommandWindowRole } from '../../shared/splitCommandAuthority';

export function resolveStage19RendererRole(
  splitCommandRole: SplitCommandWindowRole | null | undefined,
): ProjectSpineWindowRole | null {
  if (splitCommandRole === 'primary') {
    return 'writing';
  }
  if (splitCommandRole === 'secondary') {
    return 'command';
  }
  return null;
}
