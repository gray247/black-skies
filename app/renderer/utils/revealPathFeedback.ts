import type { ServicesBridge } from '../../shared/ipc/services';
import type { ToastPayload } from '../types/toast';

export type RevealTargetKind =
  | 'snapshot directory'
  | 'report file'
  | 'export folder'
  | 'snapshot manifest'
  | 'restored folder';

const PATH_OPEN_ERROR_PATTERNS = /(enoent|not found|cannot find|does not exist|path not found)/i;

const MISSING_PATH_MESSAGES: Record<
  RevealTargetKind,
  { readonly title: string; readonly description: string }
> = {
  'snapshot directory': {
    title: 'Snapshot directory missing',
    description: 'The snapshot directory could not be located.',
  },
  'report file': {
    title: 'Report file missing',
    description: 'The report file could not be located.',
  },
  'export folder': {
    title: 'Export folder missing',
    description: 'The export folder could not be located.',
  },
  'snapshot manifest': {
    title: 'Snapshot manifest missing',
    description: 'The snapshot manifest could not be located.',
  },
  'restored folder': {
    title: 'Restored folder missing',
    description: 'The restored folder could not be located.',
  },
};

function isAbsolutePath(targetPath: string): boolean {
  const normalized = targetPath.replace(/\\/g, '/');
  return normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized);
}

export function resolveProjectPath(
  projectPath: string | null | undefined,
  ...segments: string[]
): string | null {
  if (!projectPath) {
    return null;
  }
  if (segments.length === 1 && isAbsolutePath(segments[0])) {
    return segments[0];
  }
  const fsApi = typeof window !== 'undefined' ? window.__electronApi?.fs : undefined;
  if (fsApi) {
    return fsApi.resolvePath(projectPath, ...segments);
  }
  const joined = [projectPath, ...segments].filter(Boolean).join('/');
  return joined.replace(/\\/g, '/');
}

export function describeRevealFailure(
  kind: RevealTargetKind,
  error?: string | null,
): { title: string; description: string } {
  const normalizedError = error?.trim() ?? '';
  if (!normalizedError) {
    return {
      title: `Unable to open ${kind}`,
      description: 'Unknown failure while opening the path.',
    };
  }
  if (PATH_OPEN_ERROR_PATTERNS.test(normalizedError)) {
    return MISSING_PATH_MESSAGES[kind];
  }
  return {
    title: `Unable to open ${kind}`,
    description: `OS could not open path: ${normalizedError}`,
  };
}

export async function revealPathWithToast({
  services,
  targetPath,
  kind,
  pushToast,
}: {
  readonly services: ServicesBridge | undefined;
  readonly targetPath: string | null | undefined;
  readonly kind: RevealTargetKind;
  readonly pushToast: (payload: ToastPayload) => void;
}): Promise<boolean> {
  if (!targetPath || !services?.revealPath) {
    const failure = describeRevealFailure(kind);
    pushToast({
      tone: 'error',
      title: failure.title,
      description: failure.description,
    });
    return false;
  }

  const result = await services.revealPath(targetPath);
  if (!result.ok) {
    const failure = describeRevealFailure(kind, result.error);
    pushToast({
      tone: 'error',
      title: failure.title,
      description: failure.description,
    });
    return false;
  }

  return true;
}
