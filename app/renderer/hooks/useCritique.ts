import { useCallback, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type {
  DraftCritiqueBridgeResponse,
  RecoveryStatusBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';
import { computeSha256 } from '../utils/crypto';
import { generateDraftId } from '../utils/draft';
import { extractSceneBody, mergeSceneMarkdown } from '../utils/sceneMarkdown';
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

const DEFAULT_CRITIQUE_RUBRIC = ['continuity', 'pacing', 'voice'] as const;

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
}: UseCritiqueOptions) {
  const [state, setState] = useState<CritiqueDialogState>(createInitialCritiqueState());

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
        title: 'Services unavailable',
        description: 'Critique requires the local services bridge.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Load a project first',
        description: 'Open a project before requesting a critique.',
      });
      return;
    }
    if (!activeScene) {
      pushToast({
        tone: 'warning',
        title: 'Select a scene',
        description: 'Choose a scene to critique from the project panel.',
      });
      return;
    }

    const draftId = generateDraftId(activeScene.id);
    const unitId = activeScene.id;
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
        rubric: [...DEFAULT_CRITIQUE_RUBRIC],
      });
      if (!isMountedRef.current) {
        return;
      }
      if (result.ok) {
        setState((previous) => ({
          ...previous,
          loading: false,
          data: result.data,
          traceId: result.traceId,
        }));
      } else {
        setState((previous) => ({
          ...previous,
          loading: false,
          error: result.error.message,
          traceId: result.traceId ?? result.error.traceId,
        }));
        pushToast({
          tone: 'error',
          title: 'Critique failed',
          description: result.error.message,
          traceId: result.traceId ?? result.error.traceId,
        });
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
        title: 'Critique failed',
        description: message,
      });
    }
  }, [activeScene, isMountedRef, projectSummary, pushToast, services]);

  const rejectCritique = useCallback(() => {
    resetCritique();
  }, [resetCritique]);

  const acceptCritique = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Services unavailable',
        description: 'Accept requires the local services bridge.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Load a project first',
        description: 'Select a project before running accept.',
      });
      return;
    }
    if (!activeScene) {
      pushToast({
        tone: 'warning',
        title: 'Select a scene',
        description: 'Choose a scene to accept updates for.',
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
        title: 'Checksum unavailable',
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
        pushToast({
          tone: 'success',
          title: 'Draft accepted',
          description: `Snapshot ${result.data.snapshot.snapshot_id} captured.`,
          traceId: result.traceId,
        });
      } else {
        setState((previous) => ({
          ...previous,
          accepting: false,
          error: result.error.message,
        }));
        pushToast({
          tone: 'error',
          title: 'Accept failed',
          description: result.error.message,
          traceId: result.traceId,
        });
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      setState((previous) => ({ ...previous, accepting: false, error: message }));
      pushToast({
        tone: 'error',
        title: 'Accept failed',
        description: message,
      });
    }
  }, [
    activeScene,
    draftEdits,
    isMountedRef,
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
