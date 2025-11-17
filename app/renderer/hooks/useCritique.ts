import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type {
  Phase4CritiqueBridgeRequest,
  Phase4CritiqueBridgeResponse,
  Phase4CritiqueMode,
  Phase4RewriteBridgeRequest,
  Phase4RewriteBridgeResponse,
  RecoveryStatusBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';
import type ProjectSummary from '../types/project';
import type { ToastPayload } from '../types/toast';
import { generateDraftId } from '../utils/draft';

export type CritiqueLoopPhase =
  | 'idle'
  | 'critique_running'
  | 'critique_ready'
  | 'critique_error'
  | 'rewrite_running'
  | 'rewrite_ready'
  | 'rewrite_error';

export interface RewritePreview {
  originalText: string;
  revisedText: string;
}

export interface CritiqueDialogState {
  open: boolean;
  phase: CritiqueLoopPhase;
  loading: boolean;
  error: string | null;
  critique: Phase4CritiqueBridgeResponse | null;
  traceId?: string;
  draftId: string | null;
  unitId: string | null;
  instructions: string;
  rewrite: RewritePreview | null;
  rewriteLoading: boolean;
  rewriteError: string | null;
}

export const DEFAULT_CRITIQUE_RUBRIC = ['Continuity', 'Pacing', 'Voice'] as const;

export function createInitialCritiqueState(): CritiqueDialogState {
  return {
    open: false,
    phase: 'idle',
    loading: false,
    error: null,
    critique: null,
    traceId: undefined,
    draftId: null,
    unitId: null,
    instructions: '',
    rewrite: null,
    rewriteLoading: false,
    rewriteError: null,
  };
}

function normalizeRubric(rubric?: string[]): string[] {
  if (!Array.isArray(rubric) || rubric.length === 0) {
    return [...DEFAULT_CRITIQUE_RUBRIC];
  }
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const entry of rubric) {
    if (typeof entry !== 'string') {
      continue;
    }
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(trimmed);
  }
  if (normalized.length === 0) {
    return [...DEFAULT_CRITIQUE_RUBRIC];
  }
  return normalized;
}

function deriveCritiqueMode(categories: string[]): Phase4CritiqueMode {
  const normalized = categories.map((item) => item.toLowerCase());
  if (normalized.some((value) => value.includes('line') || value.includes('edit'))) {
    return 'line_edit';
  }
  if (normalized.some((value) => value.includes('pacing'))) {
    return 'pacing';
  }
  if (normalized.some((value) => value.includes('tone'))) {
    return 'tone';
  }
  return 'big_picture';
}

function buildSceneText(
  unitId: string,
  edits: Record<string, string>,
  drafts: Record<string, string>,
): string {
  return (edits[unitId] ?? drafts[unitId] ?? '').trim();
}

interface UseCritiqueOptions {
  services: ServicesBridge | undefined;
  projectSummary: ProjectSummary | null;
  activeScene: { id: string; title: string | null } | null;
  projectDrafts: Record<string, string>;
  draftEdits: Record<string, string>;
  setProjectDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  setDraftEdits: Dispatch<SetStateAction<Record<string, string>>>;
  setCurrentProject: Dispatch<SetStateAction<LoadedProject | null>>;
  pushToast: (toast: ToastPayload) => void;
  isMountedRef: MutableRefObject<boolean>;
  rubric?: string[];
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
  pushToast,
  isMountedRef,
  rubric,
}: UseCritiqueOptions) {
  const [state, setState] = useState<CritiqueDialogState>(createInitialCritiqueState());
  const activeRubric = useMemo(() => normalizeRubric(rubric), [rubric]);
  const critiqueMode = useMemo(() => deriveCritiqueMode(activeRubric), [activeRubric]);

  const setInstructions = useCallback((next: string) => {
    setState((previous) => ({ ...previous, instructions: next }));
  }, []);

  const runCritique = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Writing tools offline.',
        description: 'Reconnect the services before requesting feedback.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Open a story first.',
        description: 'Load a project before running critique.',
      });
      return;
    }
    if (!activeScene) {
      pushToast({
        tone: 'warning',
        title: 'Select a scene.',
        description: 'Choose a scene before requesting feedback.',
      });
      return;
    }

    const sceneText = buildSceneText(activeScene.id, draftEdits, projectDrafts);
    if (!sceneText) {
      pushToast({
        tone: 'warning',
        title: 'Empty scene.',
        description: 'Add some text before requesting critique.',
      });
      return;
    }

    const request: Phase4CritiqueBridgeRequest = {
      projectId: projectSummary.projectId,
      sceneId: activeScene.id,
      text: sceneText,
      mode: critiqueMode,
    };

    setState((previous) => ({
      ...previous,
      open: true,
      loading: true,
      phase: 'critique_running',
      error: null,
      traceId: undefined,
      draftId: generateDraftId(activeScene.id),
      unitId: activeScene.id,
      critique: null,
      instructions: '',
      rewrite: null,
      rewriteError: null,
      rewriteLoading: false,
    }));

    try {
      const result = await services.phase4Critique(request);
      if (!isMountedRef.current) {
        return;
      }
      if (result.ok) {
        const instructionHint = result.data.suggestions.join(' ').trim();
        setState((previous) => ({
          ...previous,
          loading: false,
          phase: 'critique_ready',
          critique: result.data,
          traceId: result.traceId,
          instructions: instructionHint,
        }));
      } else {
        setState((previous) => ({
          ...previous,
          loading: false,
          phase: 'critique_error',
          error: result.error.message,
          traceId: result.traceId,
        }));
        pushToast({
          tone: 'error',
          title: 'Feedback unavailable.',
          description: result.error.message,
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
        phase: 'critique_error',
        error: message,
      }));
      pushToast({
        tone: 'error',
        title: 'Feedback unavailable.',
        description: message,
      });
    }
  }, [
    services,
    projectSummary,
    activeScene,
    projectDrafts,
    draftEdits,
    critiqueMode,
    isMountedRef,
    pushToast,
  ]);

  const openCritique = useCallback(() => {
    void runCritique();
  }, [runCritique]);

  const closeCritique = useCallback(() => {
    setState((previous) => ({ ...previous, open: false }));
  }, []);

  const rejectCritique = useCallback(() => {
    setState((previous) => ({ ...previous, open: false }));
  }, []);

  const resetCritique = useCallback(() => {
    setState(createInitialCritiqueState());
  }, []);

  const runRewrite = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Writing tools offline.',
        description: 'Reconnect the services before requesting a rewrite.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Open a story first.',
        description: 'Load a project before requesting a rewrite.',
      });
      return;
    }
    if (!state.unitId) {
      pushToast({
        tone: 'warning',
        title: 'Select a scene.',
        description: 'Run a critique before asking for a rewrite.',
      });
      return;
    }

    const sceneText = buildSceneText(state.unitId, draftEdits, projectDrafts);
    if (!sceneText) {
      pushToast({
        tone: 'warning',
        title: 'Empty scene.',
        description: 'Add text before requesting a rewrite.',
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      rewriteLoading: true,
      rewriteError: null,
      phase: 'rewrite_running',
    }));

    const rewriteRequest: Phase4RewriteBridgeRequest = {
      projectId: projectSummary.projectId,
      sceneId: state.unitId,
      originalText: sceneText,
      instructions: previousInstructions(state.instructions),
    };

    try {
      const result = await services.phase4Rewrite(rewriteRequest);
      if (!isMountedRef.current) {
        return;
      }
      if (result.ok) {
        setState((previous) => ({
          ...previous,
          rewriteLoading: false,
          rewrite: {
            originalText: sceneText,
            revisedText: result.data.revisedText,
          },
          phase: 'rewrite_ready',
        }));
      } else {
        setState((previous) => ({
          ...previous,
          rewriteLoading: false,
          rewriteError: result.error.message,
          phase: 'rewrite_error',
        }));
        pushToast({
          tone: 'error',
          title: 'Rewrite failed.',
          description: result.error.message,
        });
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      setState((previous) => ({
        ...previous,
        rewriteLoading: false,
        rewriteError: message,
        phase: 'rewrite_error',
      }));
      pushToast({
        tone: 'error',
        title: 'Rewrite failed.',
        description: message,
      });
    }
  }, [
    services,
    projectSummary,
    state.unitId,
    state.instructions,
    draftEdits,
    projectDrafts,
    isMountedRef,
    pushToast,
  ]);

  const applyRewrite = useCallback(() => {
    if (!state.rewrite || !state.unitId) {
      return;
    }
    const updatedText = state.rewrite.revisedText;
    const targetId = state.unitId;
    setProjectDrafts((previous) => ({ ...previous, [targetId]: updatedText }));
    setDraftEdits((previous) => ({ ...previous, [targetId]: updatedText }));
    setCurrentProject((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        drafts: {
          ...previous.drafts,
          [targetId]: updatedText,
        },
      };
    });
    setState((previous) => ({
      ...createInitialCritiqueState(),
      open: false,
    }));
    pushToast({
      tone: 'success',
      title: 'Rewrite applied',
      description: 'Scene text updated with the mock revision.',
      traceId: state.traceId,
    });
  }, [state.rewrite, state.unitId, state.traceId, setProjectDrafts, setDraftEdits, setCurrentProject, pushToast]);

  const discardRewrite = useCallback(() => {
    setState((previous) => ({
      ...previous,
      rewrite: null,
      rewriteError: null,
      rewriteLoading: false,
      phase: previous.critique ? 'critique_ready' : 'idle',
    }));
  }, []);

  return {
    state,
    openCritique,
    closeCritique,
    rejectCritique,
    resetCritique,
    setInstructions,
    runCritique,
    runRewrite,
    applyRewrite,
    discardRewrite,
  };
}

function previousInstructions(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
