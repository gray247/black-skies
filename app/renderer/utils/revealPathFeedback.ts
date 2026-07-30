import type { ServicesBridge } from '../../shared/ipc/services';
import type { ToastPayload } from '../types/toast';

export type RevealTargetKind =
  | 'snapshot directory'
  | 'snapshot manifest'
  | 'verification record'
  | 'export folder'
  | 'restored folder';

const TARGET_TITLES: Record<RevealTargetKind, string> = {
  'snapshot directory': 'Snapshot directory unavailable',
  'snapshot manifest': 'Snapshot manifest unavailable',
  'verification record': 'Verification record unavailable',
  'export folder': 'Export folder unavailable',
  'restored folder': 'Restored folder unavailable',
};

const TARGET_OPEN_TITLES: Record<RevealTargetKind, string> = {
  'snapshot directory': 'Unable to open snapshot directory',
  'snapshot manifest': 'Unable to open snapshot manifest',
  'verification record': 'Unable to open verification record',
  'export folder': 'Unable to open export folder',
  'restored folder': 'Unable to open restored folder',
};

export function resolveProjectPath(projectPath: string | null | undefined, ...segments: string[]): string | null {
  const validSegments = segments.filter((segment) => segment.trim().length > 0);
  if (validSegments.length === 0) {
    return projectPath ?? null;
  }
  const fsApi = window.__electronApi?.fs;
  if (fsApi) {
    return projectPath ? fsApi.resolvePath(projectPath, ...validSegments) : fsApi.resolvePath(...validSegments);
  }
  const joined = validSegments.join('/');
  return projectPath ? `${projectPath.replace(/[\\/]+$/, '')}/${joined.replace(/^[\\/]+/, '')}` : joined;
}

async function pathExists(path: string): Promise<boolean> {
  const fsApi = window.__electronApi?.fs;
  if (!fsApi) {
    return true;
  }
  try {
    await fsApi.stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function revealPathWithToast({
  services,
  targetPath,
  kind,
  pushToast,
}: {
  services: Pick<ServicesBridge, 'revealPath'> | undefined;
  targetPath: string | null | undefined;
  kind: RevealTargetKind;
  pushToast: (payload: ToastPayload) => void;
}): Promise<boolean> {
  if (!targetPath) {
    pushToast({
      tone: 'error',
      title: TARGET_TITLES[kind],
      description: 'No path was available for this action.',
    });
    return false;
  }

  if (!(await pathExists(targetPath))) {
    pushToast({
      tone: 'error',
      title: TARGET_TITLES[kind],
      description: `${targetPath} does not exist.`,
    });
    return false;
  }

  if (!services?.revealPath) {
    pushToast({
      tone: 'warning',
      title: TARGET_OPEN_TITLES[kind],
      description: 'The file browser bridge is unavailable.',
    });
    return false;
  }

  const result = await services.revealPath(targetPath);
  if (result?.ok === false) {
    const description =
      result.code === 'PATH_MISSING'
        ? `${result.path} does not exist.`
        : `OS could not open path: ${result.error ?? 'Unknown failure.'}`;
    pushToast({
      tone: 'error',
      title: result.code === 'PATH_MISSING' ? TARGET_TITLES[kind] : TARGET_OPEN_TITLES[kind],
      description,
    });
    return false;
  }

  return true;
}
