import { useCallback, useState } from 'react';
import type { MutableRefObject } from 'react';
import type {
  DraftPreflightEstimate,
  DraftGenerateBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';
import type { ToastPayload } from '../types/toast';
import type ProjectSummary from '../types/project';
import { mergeSceneMarkdown } from '../utils/sceneMarkdown';

export interface PreflightState {
  open: boolean;
  loading: boolean;
  error: string | null;
  errorDetails: unknown | null;
  estimate?: DraftPreflightEstimate;
}

interface UsePreflightOptions {
  services: ServicesBridge | undefined;
  projectSummary: ProjectSummary | null;
  isMountedRef: MutableRefObject<boolean>;
  pushToast: (toast: ToastPayload) => void;
  projectDraftsRef: MutableRefObject<Record<string, string>>;
  setProjectDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDraftEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  reloadProjectFromDisk: () => Promise<void>;
  onBudgetUpdate?: (budget: DraftGenerateBridgeResponse['budget']) => void;
}

const INITIAL_STATE: PreflightState = {
  open: false,
  loading: false,
  error: null,
  errorDetails: null,
};

function mergeGeneratedDrafts(
  response: DraftGenerateBridgeResponse,
  projectDrafts: Record<string, string>,
): Record<string, string> {
  const nextDrafts: Record<string, string> = { ...projectDrafts };
  for (const unit of response.units) {
    const canonical = projectDrafts[unit.id];
    if (canonical) {
      nextDrafts[unit.id] = mergeSceneMarkdown(canonical, unit.text);
    } else {
      nextDrafts[unit.id] = unit.text;
    }
  }
  return nextDrafts;
}

export function usePreflight({
  services,
  projectSummary,
  isMountedRef,
  pushToast,
  projectDraftsRef,
  setProjectDrafts,
  setDraftEdits,
  reloadProjectFromDisk,
  onBudgetUpdate,
}: UsePreflightOptions) {
  const [state, setState] = useState<PreflightState>(INITIAL_STATE);

  const openPreflight = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Services unavailable',
        description: 'Cannot connect to the local drafting service; preflight aborted.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Load a project first',
        description: 'Select a project before running generation.',
      });
      return;
    }

    setState({
      open: true,
      loading: true,
      error: null,
      errorDetails: null,
      estimate: undefined,
    });

    const result = await services.preflightDraft({
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitIds: projectSummary.unitIds,
    });

    if (!isMountedRef.current) {
      return;
    }

    if (result.ok) {
      setState({
        open: true,
        loading: false,
        error: null,
        errorDetails: null,
        estimate: result.data,
      });
    } else {
      setState({
        open: true,
        loading: false,
        error: result.error.message,
        errorDetails: result.error.details ?? null,
        estimate: undefined,
      });
    }
  }, [isMountedRef, projectSummary, services, pushToast]);

  const closePreflight = useCallback(() => {
    setState((previous) => ({ ...previous, open: false }));
  }, []);

  const proceedPreflight = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Services unavailable',
        description: 'Cannot generate drafts while services are offline.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Load a project first',
        description: 'Select a project before running generation.',
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
      errorDetails: null,
    }));

    const result = await services.generateDraft({
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitIds: projectSummary.unitIds,
    });

    if (!isMountedRef.current) {
      return;
    }

    if (result.ok) {
      const nextDrafts = mergeGeneratedDrafts(result.data, projectDraftsRef.current);
      setProjectDrafts(nextDrafts);
      setDraftEdits({ ...nextDrafts });
      projectDraftsRef.current = nextDrafts;

      setState({
        open: false,
        loading: false,
        error: null,
        errorDetails: null,
        estimate: undefined,
      });

      if (result.data.budget) {
        onBudgetUpdate?.(result.data.budget);
      }

      pushToast({
        tone: 'success',
        title: 'Draft generation requested',
        description: `Draft ${result.data.draft_id} queued with ${result.data.units.length} unit(s).`,
        traceId: result.traceId,
      });

      await reloadProjectFromDisk();
    } else {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: result.error.message,
        errorDetails: result.error.details ?? null,
      }));
      pushToast({
        tone: 'error',
        title: 'Draft generation failed',
        description: result.error.message,
        traceId: result.traceId ?? result.error.traceId,
      });
    }
  }, [
    isMountedRef,
    projectSummary,
    services,
    pushToast,
    projectDraftsRef,
    setProjectDrafts,
    setDraftEdits,
    reloadProjectFromDisk,
    onBudgetUpdate,
  ]);

  return {
    state,
    openPreflight,
    closePreflight,
    proceedPreflight,
  };
}

export default usePreflight;
