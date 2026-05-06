import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type {
  DraftCritiqueBridgeResponse,
  DraftRewriteBridgeRequest,
  Phase4CritiqueBridgeRequest,
  Phase4CritiqueBridgeResponse,
  Phase4CritiqueMode,
  Phase4RewriteBridgeRequest,
  ActionProvenance,
  ServicesBridge,
} from '../../shared/ipc/services';
import type ProjectSummary from '../types/project';
import type { ToastPayload } from '../types/toast';
import { generateDraftId } from '../utils/draft';
import type { BudgetSnapshotSource } from '../utils/budgetIndicator';
import { recordDebugEvent } from '../utils/debugLog';
import { describeServiceError } from '../utils/serviceErrors';

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
  critique: Phase4CritiqueBridgeResponse | DraftCritiqueBridgeResponse | null;
  traceId?: string;
  draftId: string | null;
  unitId: string | null;
  instructions: string;
  rewrite: RewritePreview | null;
  rewriteLoading: boolean;
  rewriteError: string | null;
  critiqueProvenance: ActionProvenance | null;
  rewriteProvenance: ActionProvenance | null;
  budgetStatusLine: string | null;
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
    critiqueProvenance: null,
    rewriteProvenance: null,
    budgetStatusLine: null,
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

export function resolveSceneDraftText(
  unitId: string,
  edits: Record<string, string>,
  drafts: Record<string, string>,
): string {
  return (edits[unitId] ?? drafts[unitId] ?? '').trim();
}

function usePhase4MockFlow(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const win = window as typeof window & {
    __phase4MockFlowEnabled?: boolean;
    __BLACKSKIES_PHASE4_MOCK?: boolean;
  };
  return win.__phase4MockFlowEnabled === true || win.__BLACKSKIES_PHASE4_MOCK === true;
}

function deriveBudgetDelta(payload: DraftCritiqueBridgeResponse['budget'] | undefined): number | null {
  if (!payload) {
    return null;
  }
  const estimated = payload.estimated_usd;
  return typeof estimated === 'number' && Number.isFinite(estimated) ? estimated : null;
}

function budgetSourceLine(provenance: ActionProvenance): string {
  if (provenance.budget_delta === null || provenance.budget_delta <= 0) {
    return 'Budget source: no budgeted action.';
  }
  if (provenance.result_origin === 'provider') {
    return `Budget source: budgeted provider call (+$${provenance.budget_delta.toFixed(2)} est).`;
  }
  return `Budget source: estimate only (+$${provenance.budget_delta.toFixed(2)} est).`;
}

function buildCritiqueProvenance(
  routeName: string,
  payload: Phase4CritiqueBridgeResponse | DraftCritiqueBridgeResponse,
): ActionProvenance {
  const incoming = payload.provenance;
  if (incoming) {
    return incoming;
  }
  if (routeName === 'phase4/critique') {
    return {
      route_name: routeName,
      provider_called: false,
      result_origin: 'mock',
      budget_delta: deriveBudgetDelta(payload.budget),
    };
  }
  const provider = (payload as DraftCritiqueBridgeResponse).model?.provider ?? 'offline';
  const resultOrigin = provider === 'offline' ? 'fallback' : 'provider';
  return {
    route_name: routeName,
    provider_called: resultOrigin === 'provider',
    result_origin: resultOrigin,
    budget_delta: deriveBudgetDelta(payload.budget),
  };
}

function deriveInstructionHint(payload: Phase4CritiqueBridgeResponse | DraftCritiqueBridgeResponse): string {
  if ('suggestions' in payload && Array.isArray(payload.suggestions)) {
    return payload.suggestions.join(' ').trim();
  }
  if ('priorities' in payload && Array.isArray(payload.priorities)) {
    return payload.priorities.join(' ').trim();
  }
  return '';
}

function buildRewriteProvenance(
  routeName: string,
  payloadProvenance: ActionProvenance | undefined,
  provider: string | undefined,
): ActionProvenance {
  if (payloadProvenance) {
    return payloadProvenance;
  }
  if (routeName === 'phase4/rewrite') {
    return {
      route_name: routeName,
      provider_called: false,
      result_origin: 'mock',
      budget_delta: null,
    };
  }
  const resultOrigin = provider && provider !== 'offline' ? 'provider' : 'fallback';
  return {
    route_name: routeName,
    provider_called: resultOrigin === 'provider',
    result_origin: resultOrigin,
    budget_delta: null,
  };
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
  onBudgetUpdate?: (payload: BudgetSnapshotSource) => void;
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
  onBudgetUpdate,
}: UseCritiqueOptions) {
  const [state, setState] = useState<CritiqueDialogState>(createInitialCritiqueState());
  const activeRubric = useMemo(() => normalizeRubric(rubric), [rubric]);
  const critiqueMode = useMemo(() => deriveCritiqueMode(activeRubric), [activeRubric]);
  const phase4MockFlow = usePhase4MockFlow();

  const setInstructions = useCallback((next: string) => {
    setState((previous) => ({ ...previous, instructions: next }));
  }, []);

  const runCritique = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Feedback unavailable.',
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

    const sceneText = resolveSceneDraftText(activeScene.id, draftEdits, projectDrafts);
    if (!sceneText) {
      pushToast({
        tone: 'warning',
        title: 'Empty scene.',
        description: 'Add some text before requesting critique.',
      });
      return;
    }

    const draftId = generateDraftId(activeScene.id);
    const canonicalRequest = {
      projectId: projectSummary.projectId,
      draftId,
      unitId: activeScene.id,
      rubric: activeRubric,
    };
    const mockRequest: Phase4CritiqueBridgeRequest = {
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
      draftId,
      unitId: activeScene.id,
      critique: null,
      instructions: '',
      rewrite: null,
      rewriteError: null,
      rewriteLoading: false,
      critiqueProvenance: null,
      rewriteProvenance: null,
      budgetStatusLine: null,
    }));

    const critiqueRouteName = phase4MockFlow ? 'phase4/critique' : 'draft/critique';
    if (!services.critiqueDraft && !services.phase4Critique) {
      setState((previous) => ({ ...previous, loading: false, phase: 'critique_error', error: 'Critique unavailable.' }));
      pushToast({
        tone: 'error',
        title: 'Feedback unavailable.',
        description: 'Critique service is not available.',
      });
      return;
    }

    try {
      let result;
      let effectiveRouteName = critiqueRouteName;
      if (phase4MockFlow && services.phase4Critique) {
        result = await services.phase4Critique(mockRequest);
      } else if (services.critiqueDraft) {
        result = await services.critiqueDraft(canonicalRequest);
        effectiveRouteName = 'draft/critique';
      } else {
        result = await services.phase4Critique!(mockRequest);
        effectiveRouteName = 'phase4/critique';
      }
      if (!isMountedRef.current) {
        return;
      }
      if (result.ok) {
        const provenance = buildCritiqueProvenance(effectiveRouteName, result.data);
        const budgetLine = budgetSourceLine(provenance);
        const instructionHint = deriveInstructionHint(result.data);
        recordDebugEvent('truth.critique', provenance);
        setState((previous) => ({
          ...previous,
          loading: false,
          phase: 'critique_ready',
          critique: result.data,
          traceId: result.traceId,
          instructions: instructionHint,
          critiqueProvenance: provenance,
          budgetStatusLine: budgetLine,
        }));
        if (result.data.budget) {
          const budgetPayload = {
            ...result.data.budget,
            message: result.data.budget.message ?? budgetLine,
          };
          console.info('[budget:critique]', budgetPayload);
          onBudgetUpdate?.(budgetPayload);
        }
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
    activeRubric,
    critiqueMode,
    phase4MockFlow,
    isMountedRef,
    pushToast,
    onBudgetUpdate,
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

    const sceneText = resolveSceneDraftText(state.unitId, draftEdits, projectDrafts);
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

    const rewriteRouteName = phase4MockFlow ? 'phase4/rewrite' : 'draft/rewrite';
    if (!services.rewriteDraft && !services.phase4Rewrite) {
      setState((previous) => ({
        ...previous,
        rewriteLoading: false,
        rewriteError: 'Rewrite unavailable.',
        phase: 'rewrite_error',
      }));
      return;
    }

    try {
      const canonicalRewriteRequest = {
        projectId: projectSummary.projectId,
        draftId: state.draftId ?? generateDraftId(state.unitId),
        unitId: state.unitId,
        instructions: previousInstructions(state.instructions),
        unit: {
          id: state.unitId,
          text: sceneText,
          meta: {},
        },
      } satisfies DraftRewriteBridgeRequest;
      let result;
      let effectiveRouteName = rewriteRouteName;
      if (phase4MockFlow && services.phase4Rewrite) {
        result = await services.phase4Rewrite(rewriteRequest);
      } else if (services.rewriteDraft) {
        result = await services.rewriteDraft(canonicalRewriteRequest);
        effectiveRouteName = 'draft/rewrite';
      } else {
        result = await services.phase4Rewrite!(rewriteRequest);
        effectiveRouteName = 'phase4/rewrite';
      }
      if (!isMountedRef.current) {
        return;
      }
      if (result.ok) {
        const revisedText =
          'revisedText' in result.data ? result.data.revisedText : result.data.revised_text;
        const provider =
          'model' in result.data && result.data.model ? result.data.model.provider : undefined;
        const provenance = buildRewriteProvenance(
          effectiveRouteName,
          result.data.provenance,
          provider,
        );
        recordDebugEvent('truth.rewrite', provenance);
        setState((previous) => ({
          ...previous,
          rewriteLoading: false,
          rewrite: {
            originalText: sceneText,
            revisedText,
          },
          phase: 'rewrite_ready',
          rewriteProvenance: provenance,
          budgetStatusLine: 'Budget source: no budgeted action.',
        }));
      } else {
        const rewriteMessage = describeServiceError(result.error, 'rewrite');
        setState((previous) => ({
          ...previous,
          rewriteLoading: false,
          rewriteError: rewriteMessage,
          phase: 'rewrite_error',
        }));
        pushToast({
          tone: 'error',
          title: 'Rewrite failed.',
          description: rewriteMessage,
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
    state.draftId,
    state.unitId,
    state.instructions,
    draftEdits,
    projectDrafts,
    phase4MockFlow,
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
    setState({
      ...createInitialCritiqueState(),
      open: false,
    });
    pushToast({
      tone: 'success',
      title: 'Rewrite synced',
      description: 'Local draft view updated from the saved rewrite.',
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
