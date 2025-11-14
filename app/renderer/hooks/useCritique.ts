import { useCallback, useMemo, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type {
  DraftAcceptBridgeResponse,
  DraftCritiqueBridgeResponse,
  RecoveryStatusBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';
import { computeSha256 } from '../utils/crypto';
import { generateDraftId } from '../utils/draft';
import { extractSceneBody, mergeSceneMarkdown } from '../utils/sceneMarkdown';
import { handleServiceError } from '../utils/serviceErrors';
import type { ToastPayload } from '../types/toast';
import type ProjectSummary from '../types/project';

export interface CritiqueDialogState {
  open: boolean;
  loading: boolean;
  error: string | null;
  data: DraftCritiqueBridgeResponse | null;
  traceId?: string;
  draftId: string | null;
  unitId: string | null;
  accepting: boolean;
}

const DEFAULT_CRITIQUE_RUBRIC = ['Continuity', 'Pacing', 'Voice'] as const;

function createInitialCritiqueState(): CritiqueDialogState {
  return {
    open: false,
    loading: false,
    error: null,
    data: null,
    traceId: undefined,
    draftId: null,
    unitId: null,
    accepting: false,
  };
}

interface UseCritiqueOptions {
  services: ServicesBridge | undefined;
  projectSummary: ProjectSummary | null;
  activeScene: { id: string; title: string | null } | null;
  projectDrafts: Record<string, string>;
  draftEdits: Record<string, string>;
  setProjectDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDraftEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setCurrentProject: React.Dispatch<React.SetStateAction<LoadedProject | null>>;
  setRecoveryStatus: React.Dispatch<React.SetStateAction<RecoveryStatusBridgeResponse | null>>;
  pushToast: (toast: ToastPayload) => void;
  isMountedRef: MutableRefObject<boolean>;
  rubric?: string[];
  onBudgetUpdate?: (
    budget: DraftCritiqueBridgeResponse['budget'] | DraftAcceptBridgeResponse['budget'],
  ) => void;
  onBudgetBlock?: () => void;
}

export function useCritique({
  services,
  projectSummary,
  activeScene,
  projectDrafts,
  draftEdits,
  setProjectDrafts,
  setDraftEdits,
  setCurrentProject,
  setRecoveryStatus,
  pushToast,
  isMountedRef,
  rubric,
  onBudgetUpdate,
  onBudgetBlock,
}: UseCritiqueOptions) {
  const [state, setState] = useState<CritiqueDialogState>(createInitialCritiqueState());
  const onBudgetBlockHandler = onBudgetBlock;
  const activeRubric = useMemo(
    () => (Array.isArray(rubric) && rubric.length > 0 ? [...rubric] : [...DEFAULT_CRITIQUE_RUBRIC]),
    [rubric],
  );

  const resetCritique = useCallback(() => {
    setState(createInitialCritiqueState());
  }, []);

  const closeCritique = useCallback(() => {
    setState((previous) => ({ ...previous, open: false }));
  }, []);

  const openCritique = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Writing tools offline.',
        description: 'Reconnect the writing tools before running feedback.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Open a story to start writing.',
        description: 'Select a story before requesting feedback.',
      });
      return;
    }
    if (!activeScene) {
      pushToast({
        tone: 'warning',
        title: 'Select a scene for feedback.',
        description: 'Choose a scene to request feedback for.',
      });
      return;
    }

    const draftId = generateDraftId(activeScene.id);
    const unitId = activeScene.id;
    const requestRubric = [...new Set(activeRubric.map((item) => item.trim()))].filter(
      (item) => item.length > 0,
    );
    if (requestRubric.length === 0) {
      pushToast({
        tone: 'warning',
        title: 'Add focus points.',
        description: 'Specify at least one focus point before requesting feedback.',
      });
      return;
    }
    setState({
      open: true,
      loading: true,
      error: null,
      data: null,
      traceId: undefined,
      draftId,
      unitId,
      accepting: false,
    });

    try {
      const result = await services.critiqueDraft({
        projectId: projectSummary.projectId,
        draftId,
        unitId,
        rubric: requestRubric,
      });
      if (!isMountedRef.current) {
        return;
      }
      if (result.ok) {
        if (result.data.budget) {
          onBudgetUpdate?.(result.data.budget);
        }
        setState((previous) => ({
          ...previous,
          loading: false,
          data: result.data,
          traceId: result.traceId,
        }));
        pushToast({
          tone: 'success',
          title: 'Feedback ready.',
          traceId: result.traceId,
        });
      } else {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: result.error.message,
        traceId: result.traceId ?? result.error.traceId,
      }));
      handleServiceError(
        result.error,
        'critique',
        pushToast,
        onBudgetBlock,
      );
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      setState((previous) => ({
        ...previous,
        loading: false,
        error: message,
      }));
      pushToast({
        tone: 'error',
        title: 'Feedback unavailable.',
        description: message,
      });
    }
  }, [
    activeScene,
    activeRubric,
    isMountedRef,
    onBudgetUpdate,
    onBudgetBlock,
    projectSummary,
    pushToast,
    services,
  ]);

  const rejectCritique = useCallback(() => {
    resetCritique();
  }, [resetCritique]);

  const acceptCritique = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Writing tools offline.',
        description: 'Reconnect the writing tools before accepting feedback.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Open a story to start writing.',
        description: 'Select a story before accepting feedback.',
      });
      return;
    }
    if (!activeScene) {
      pushToast({
        tone: 'warning',
        title: 'Select a scene for feedback.',
        description: 'Choose a scene before accepting feedback.',
      });
      return;
    }
    const unitId = activeScene.id;
    const draftId = state.draftId ?? generateDraftId(unitId);
    const canonicalText = projectDrafts[unitId] ?? '';
    const nextText = draftEdits[unitId] ?? canonicalText;
    const canonicalBody = extractSceneBody(canonicalText);
    const nextBody = extractSceneBody(nextText);

    let previousSha: string;
    try {
      previousSha = await computeSha256(canonicalBody);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to compute checksum for the current draft.';
      pushToast({
        tone: 'error',
        title: 'Feedback unavailable.',
        description: message,
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      accepting: true,
      error: null,
      draftId,
      unitId,
    }));

    try {
      const result = await services.acceptDraft({
        projectId: projectSummary.projectId,
        draftId,
        unitId,
        unit: {
          id: unitId,
          previous_sha256: previousSha,
          text: nextBody,
        },
        message: `Accepted critique for ${activeScene.title ?? unitId}`,
        snapshotLabel: 'accept',
      });
      if (!isMountedRef.current) {
        return;
      }
      if (result.ok) {
        const mergedDraft = mergeSceneMarkdown(canonicalText, nextBody);
        setProjectDrafts((previous) => ({ ...previous, [unitId]: mergedDraft }));
        setDraftEdits((previous) => ({ ...previous, [unitId]: mergedDraft }));
        setCurrentProject((previous) => {
          if (!previous) {
            return previous;
          }
          return {
            ...previous,
            drafts: {
              ...previous.drafts,
              [unitId]: mergedDraft,
            },
          };
        });
        setRecoveryStatus((previous) => {
          if (previous) {
            return {
              ...previous,
              status: 'idle',
              needs_recovery: false,
              last_snapshot: result.data.snapshot,
            };
          }
          return {
            project_id: projectSummary.projectId,
            status: 'idle',
            needs_recovery: false,
            pending_unit_id: null,
            draft_id: null,
            started_at: null,
            last_snapshot: result.data.snapshot,
            message: null,
            failure_reason: null,
          };
        });
        resetCritique();
        if (result.data.budget) {
          onBudgetUpdate?.(result.data.budget);
        }
        pushToast({
          tone: 'success',
          title: 'Revision accepted.',
          description: 'Snapshot created.',
          traceId: result.traceId,
        });
      } else {
        setState((previous) => ({
          ...previous,
          accepting: false,
          error: result.error.message,
        }));
        handleServiceError(result.error, 'critique', pushToast, onBudgetBlockHandler);
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      setState((previous) => ({ ...previous, accepting: false, error: message }));
      pushToast({
        tone: 'error',
        title: 'Feedback unavailable.',
        description: message,
      });
    }
  }, [
    activeScene,
    draftEdits,
    isMountedRef,
    onBudgetBlockHandler,
    projectDrafts,
    projectSummary,
    pushToast,
    resetCritique,
    services,
    setCurrentProject,
    setDraftEdits,
    setProjectDrafts,
    setRecoveryStatus,
    state.draftId,
    onBudgetUpdate,
  ]);

  return {
    state,
    openCritique,
    closeCritique,
    rejectCritique,
    acceptCritique,
    resetCritique,
  };
}

export { DEFAULT_CRITIQUE_RUBRIC, createInitialCritiqueState };

export default useCritique;
