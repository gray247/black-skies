import { useCallback, useEffect, useMemo, useState } from "react";

import type { AnalyticsBudgetBridgeResponse, ServicesBridge } from "../../shared/ipc/services";
import type { ToastPayload } from "../types/toast";
import { handleServiceError } from "../utils/serviceErrors";
import { buildBudgetIndicatorState, type BudgetSnapshotSource } from "../utils/budgetIndicator";
import useMountedRef from "./useMountedRef";
import type { BudgetIndicatorState } from "../components/BudgetIndicator";

const REFRESH_INTERVAL_MS = 45_000;

declare global {
  interface Window {
    __testBudgetResponse?: AnalyticsBudgetBridgeResponse | null;
    __budgetRefresh?: () => Promise<void>;
  }
}

export interface UseBudgetIndicatorOptions {
  services: ServicesBridge | undefined;
  projectId: string | null;
  serviceHealthy: boolean;
  pushToast: (payload: ToastPayload) => void;
  onBudgetUpdate?: (payload: BudgetSnapshotSource) => void;
}

export interface UseBudgetIndicatorResult {
  indicator: BudgetIndicatorState;
  blocked: boolean;
  refreshBudget: () => Promise<void>;
  markBudgetBlocked: () => void;
}

const DEFAULT_INDICATOR_STATE: BudgetIndicatorState = {
  hint: "stable",
  status: "ok",
  message: "Budget healthy.",
};

export function useBudgetIndicator({
  services,
  projectId,
  serviceHealthy,
  pushToast,
  onBudgetUpdate,
}: UseBudgetIndicatorOptions): UseBudgetIndicatorResult {
  const mountedRef = useMountedRef();
  const [indicator, setIndicator] = useState<BudgetIndicatorState>(DEFAULT_INDICATOR_STATE);
  const [blocked, setBlocked] = useState<boolean>(false);

  const fetchResponse = useCallback(async (): Promise<AnalyticsBudgetBridgeResponse | null> => {
    if (typeof window !== "undefined" && window.__testBudgetResponse !== undefined) {
      return window.__testBudgetResponse;
    }
    if (!services || !projectId || !serviceHealthy || typeof services.analyticsBudget !== 'function') {
      return null;
    }

    const result = await services.analyticsBudget({ projectId });
    if (!mountedRef.current) {
      return null;
    }

    if (result.ok && result.data) {
      return result.data;
    }

    if (result.error) {
      handleServiceError(
        result.error,
        "analytics",
        pushToast,
        () => setBlocked(true),
        result.traceId ?? result.error.traceId,
      );
    } else {
      pushToast({
        tone: "warning",
        title: "Budget unavailable.",
        description: "Usage analytics temporarily unreachable; try again soon.",
      });
    }
    return null;
  }, [services, projectId, serviceHealthy, pushToast, mountedRef]);

  const refreshBudget = useCallback(async () => {
    const response = await fetchResponse();
    if (!response) {
      setIndicator(DEFAULT_INDICATOR_STATE);
      setBlocked(false);
      return;
    }

    const nextIndicator = buildBudgetIndicatorState(response);
    setIndicator(nextIndicator);
    setBlocked(nextIndicator.status === "blocked");
    const meterStatus = nextIndicator.status === "warning" ? "soft-limit" : nextIndicator.status;
    onBudgetUpdate?.({
      soft_limit_usd: response.budget.soft_limit_usd,
      hard_limit_usd: response.budget.hard_limit_usd,
      spent_usd: response.budget.spent_usd,
      total_after_usd: response.budget.total_after_usd,
      estimated_usd: response.budget.remaining_usd,
      message: response.message ?? nextIndicator.message ?? undefined,
      status: meterStatus,
    });
  }, [fetchResponse, onBudgetUpdate]);

  const markBudgetBlocked = useCallback(() => {
    setBlocked(true);
    void refreshBudget();
  }, [refreshBudget]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__budgetRefresh = () => refreshBudget();
    }

    if (!projectId) {
      setIndicator(DEFAULT_INDICATOR_STATE);
      setBlocked(false);
      return () => {
        if (typeof window !== "undefined" && window.__budgetRefresh) {
          window.__budgetRefresh = undefined;
        }
      };
    }

    void refreshBudget();

    if (!serviceHealthy) {
      return () => {
        if (typeof window !== "undefined" && window.__budgetRefresh) {
          window.__budgetRefresh = undefined;
        }
      };
    }

    let timer: ReturnType<typeof window.setInterval> | undefined;
    if (typeof window !== "undefined") {
      timer = window.setInterval(() => {
        void refreshBudget();
      }, REFRESH_INTERVAL_MS);
    }

    return () => {
      if (timer !== undefined && typeof window !== "undefined") {
        window.clearInterval(timer);
      }
      if (typeof window !== "undefined" && window.__budgetRefresh) {
        window.__budgetRefresh = undefined;
      }
    };
  }, [projectId, refreshBudget, serviceHealthy]);

  const resolvedIndicator = useMemo(() => indicator, [indicator]);

  return {
    indicator: resolvedIndicator,
    blocked,
    refreshBudget,
    markBudgetBlocked,
  };
}
