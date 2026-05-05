import { useCallback, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type {
  DraftPreflightEstimate,
  DraftGenerateBridgeResponse,
  ServiceError,
  ServiceResult,
  ServicesBridge,
} from '../../shared/ipc/services';
import type { ToastPayload } from '../types/toast';
import type ProjectSummary from '../types/project';
import { mergeSceneMarkdown } from '../utils/sceneMarkdown';
import { describeServiceError, handleServiceError } from '../utils/serviceErrors';

export type GenerateFlowPhase = 'preflight' | 'generation';

export interface PreflightState {
  open: boolean;
  loading: boolean;
  error: string | null;
  errorDetails: unknown | null;
  estimate?: DraftPreflightEstimate;
  phase: GenerateFlowPhase | null;
  traceId: string | null;
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
  onBudgetBlock?: () => void;
}

const INITIAL_STATE: PreflightState = {
  open: false,
  loading: false,
  error: null,
  errorDetails: null,
  phase: null,
  traceId: null,
};

function createPreflightTraceId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `preflight-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function logGenerateFlowPhase(phase: string, details: Record<string, unknown>): void {
  console.info(`[${phase}]`, details);
}

function summarizeDraftGenerateResult(result: ServiceResult<DraftGenerateBridgeResponse>): Record<string, unknown> {
  if (result.ok) {
    return {
      resultType: 'success',
      resultKeys: Object.keys(result.data),
      unitKeys:
        result.data.units.length > 0 && result.data.units[0] && typeof result.data.units[0] === 'object'
          ? Object.keys(result.data.units[0] as Record<string, unknown>)
          : [],
    };
  }

  return {
    resultType: 'error',
    resultKeys: Object.keys(result.error),
    errorKeys: Object.keys(result.error),
  };
}

function normalizeDraftGenerationThrow(error: unknown, traceId: string): ServiceError {
  if (error && typeof error === 'object') {
    const maybeError = error as Partial<ServiceError> & { name?: string; message?: string };
    if (typeof maybeError.message === 'string') {
      if (maybeError.name === 'AbortError') {
        return {
          code: 'TIMEOUT',
          message: maybeError.message,
          details: { timeout_ms: 45_000 },
          traceId,
        };
      }
      return {
        code: maybeError.code ?? 'INTERNAL',
        message: maybeError.message,
        details: maybeError.details,
        httpStatus: maybeError.httpStatus,
        traceId: maybeError.traceId ?? traceId,
      };
    }
  }

  return {
    code: 'INTERNAL',
    message: error instanceof Error ? error.message : String(error),
    traceId,
  };
}

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
  onBudgetBlock,
}: UsePreflightOptions) {
  const onBudgetBlockHandler = onBudgetBlock;
  const [state, setState] = useState<PreflightState>(INITIAL_STATE);
  const activeRequestIdRef = useRef(0);
  const activeTraceIdRef = useRef<string | null>(null);

  const openPreflight = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Writing tools offline.',
        description: 'Connect the local writing tools before running a preflight.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Open a story to start writing.',
        description: 'Select a story before running generation.',
      });
      return;
    }

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    const traceId = createPreflightTraceId();
    activeTraceIdRef.current = traceId;
    const startedAt = performance.now();
    logGenerateFlowPhase('generate-flow:start', {
      traceId,
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitCount: projectSummary.unitIds.length,
    });
    logGenerateFlowPhase('preflight:request', {
      traceId,
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitCount: projectSummary.unitIds.length,
    });
    setState({
      open: true,
      loading: true,
      error: null,
      errorDetails: null,
      estimate: undefined,
      phase: 'preflight',
      traceId,
    });

    const result = await services.preflightDraft({
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitIds: projectSummary.unitIds,
      traceId,
    });

    if (!isMountedRef.current) {
      return;
    }

    if (result.ok) {
      logGenerateFlowPhase('preflight:response', {
        traceId,
        ok: true,
        durationMs: Math.round(performance.now() - startedAt),
        projectId: projectSummary.projectId,
        unitScope: projectSummary.unitScope,
        unitCount: projectSummary.unitIds.length,
      });
      logGenerateFlowPhase('preflight:modal-open', {
        traceId,
        projectId: projectSummary.projectId,
        unitScope: projectSummary.unitScope,
        unitCount: projectSummary.unitIds.length,
      });
      if (result.data.budget) {
        console.info('[budget:preflight]', result.data.budget);
        onBudgetUpdate?.(result.data.budget);
      }
      setState({
        open: true,
        loading: false,
        error: null,
        errorDetails: null,
        estimate: result.data,
        phase: 'preflight',
        traceId,
      });
    } else {
      logGenerateFlowPhase('preflight:response', {
        traceId,
        ok: false,
        durationMs: Math.round(performance.now() - startedAt),
        projectId: projectSummary.projectId,
        unitScope: projectSummary.unitScope,
        unitCount: projectSummary.unitIds.length,
        code: result.error.code ?? null,
      });
      logGenerateFlowPhase('generate-flow:error', {
        traceId,
        phase: 'preflight',
        code: result.error.code ?? null,
        projectId: projectSummary.projectId,
        unitScope: projectSummary.unitScope,
        unitCount: projectSummary.unitIds.length,
      });
      setState({
        open: true,
        loading: false,
        error: describeServiceError(result.error, 'preflight'),
        errorDetails: result.error.details ?? null,
        estimate: undefined,
        phase: 'preflight',
        traceId,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMountedRef, projectSummary, services, pushToast]);

  const closePreflight = useCallback(() => {
    setState((previous) => ({ ...previous, open: false }));
  }, []);

  const proceedPreflight = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Writing tools offline.',
        description: 'Reconnect the writing tools before generating drafts.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Open a story to start writing.',
        description: 'Select a story before running generation.',
      });
      return;
    }

    const traceId = activeTraceIdRef.current ?? createPreflightTraceId();
    activeTraceIdRef.current = traceId;
    const startedAt = performance.now();
    logGenerateFlowPhase('preflight:proceed-clicked', {
      traceId,
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitCount: projectSummary.unitIds.length,
    });
    logGenerateFlowPhase('draft-generate:request', {
      traceId,
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitCount: projectSummary.unitIds.length,
    });
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
      errorDetails: null,
      phase: 'generation',
      traceId,
    }));
    try {
      logGenerateFlowPhase('renderer:draft-generate:before-await', {
        traceId,
        route: 'draft/generate',
        projectId: projectSummary.projectId,
        unitScope: projectSummary.unitScope,
        unitCount: projectSummary.unitIds.length,
      });
      const result = await services.generateDraft(
        {
          projectId: projectSummary.projectId,
          unitScope: projectSummary.unitScope,
          unitIds: projectSummary.unitIds,
        },
        traceId,
      );

      if (!isMountedRef.current) {
        return;
      }

      logGenerateFlowPhase('renderer:draft-generate:after-await', {
        traceId,
        route: 'draft/generate',
        ok: result.ok,
        durationMs: Math.round(performance.now() - startedAt),
        projectId: projectSummary.projectId,
        unitScope: projectSummary.unitScope,
        unitCount: projectSummary.unitIds.length,
        ...summarizeDraftGenerateResult(result),
      });

      if (result.ok) {
        const nextDrafts = mergeGeneratedDrafts(result.data, projectDraftsRef.current);
        logGenerateFlowPhase('renderer:draft-generate:state-update', {
          traceId,
          route: 'draft/generate',
          nextPhase: null,
          loading: false,
          projectId: projectSummary.projectId,
          unitScope: projectSummary.unitScope,
          unitCount: projectSummary.unitIds.length,
        });
        setProjectDrafts(nextDrafts);
        setDraftEdits({ ...nextDrafts });
        projectDraftsRef.current = nextDrafts;

        setState({
          open: false,
          loading: false,
          error: null,
          errorDetails: null,
          estimate: undefined,
          phase: null,
          traceId,
        });

        if (result.data.budget) {
          onBudgetUpdate?.(result.data.budget);
        }

        pushToast({
          tone: 'success',
          title: 'New draft written.',
          description: `Draft ${result.data.draft_id} queued with ${result.data.units.length} unit(s).`,
          traceId: result.traceId,
        });

        logGenerateFlowPhase('generate-flow:complete', {
          traceId,
          projectId: projectSummary.projectId,
          unitScope: projectSummary.unitScope,
          unitCount: projectSummary.unitIds.length,
        });

        await reloadProjectFromDisk();
      } else {
        logGenerateFlowPhase('generate-flow:error', {
          traceId,
          phase: 'generation',
          code: result.error.code ?? null,
          projectId: projectSummary.projectId,
          unitScope: projectSummary.unitScope,
          unitCount: projectSummary.unitIds.length,
        });
        logGenerateFlowPhase('renderer:draft-generate:state-update', {
          traceId,
          route: 'draft/generate',
          nextPhase: 'generation',
          loading: false,
          projectId: projectSummary.projectId,
          unitScope: projectSummary.unitScope,
          unitCount: projectSummary.unitIds.length,
        });
        setState((previous) => ({
          ...previous,
          loading: false,
          error: describeServiceError(result.error, 'generation'),
          errorDetails: result.error.details ?? null,
          phase: 'generation',
          traceId,
        }));
        handleServiceError(
          result.error,
          'generation',
          pushToast,
          onBudgetBlockHandler,
          result.traceId ?? result.error.traceId,
        );
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const normalizedError = normalizeDraftGenerationThrow(error, traceId);
      logGenerateFlowPhase('renderer:draft-generate:error', {
        traceId,
        route: 'draft/generate',
        durationMs: Math.round(performance.now() - startedAt),
        code: normalizedError.code ?? null,
        message: normalizedError.message,
      });
      logGenerateFlowPhase('generate-flow:error', {
        traceId,
        phase: 'generation',
        code: normalizedError.code ?? null,
        projectId: projectSummary.projectId,
        unitScope: projectSummary.unitScope,
        unitCount: projectSummary.unitIds.length,
      });
      logGenerateFlowPhase('renderer:draft-generate:state-update', {
        traceId,
        route: 'draft/generate',
        nextPhase: 'generation',
        loading: false,
        projectId: projectSummary.projectId,
        unitScope: projectSummary.unitScope,
        unitCount: projectSummary.unitIds.length,
      });
      setState((previous) => ({
        ...previous,
        loading: false,
        error: describeServiceError(normalizedError, 'generation'),
        errorDetails: normalizedError.details ?? null,
        phase: 'generation',
        traceId,
      }));
      handleServiceError(
        normalizedError,
        'generation',
        pushToast,
        onBudgetBlockHandler,
        normalizedError.traceId,
      );
    } finally {
      logGenerateFlowPhase('renderer:draft-generate:finally', {
        traceId,
        route: 'draft/generate',
        durationMs: Math.round(performance.now() - startedAt),
        projectId: projectSummary.projectId,
        unitScope: projectSummary.unitScope,
        unitCount: projectSummary.unitIds.length,
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
    onBudgetBlockHandler,
  ]);

  return {
    state,
    openPreflight,
    closePreflight,
    proceedPreflight,
  };
}

export default usePreflight;
