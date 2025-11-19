import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AnalyticsBudgetBridgeResponse, ServicesBridge } from "../../shared/ipc/services";
import type { ToastPayload } from "../types/toast";
import { ANALYTICS_WARNING_TOAST, handleServiceError } from "../utils/serviceErrors";
import { buildBudgetIndicatorState, type BudgetSnapshotSource } from "../utils/budgetIndicator";
import useMountedRef from "./useMountedRef";
import type { BudgetIndicatorState } from "../components/BudgetIndicator";
import type { ServiceStatus } from "../components/ServiceStatusPill";

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
  serviceStatus: ServiceStatus;
  pushToast: (payload: ToastPayload) => void;
  onBudgetUpdate?: (payload: BudgetSnapshotSource) => void;
}

export interface UseBudgetIndicatorResult {
  indicator: BudgetIndicatorState;
  blocked: boolean;
  refreshBudget: (options?: { force?: boolean }) => Promise<void>;
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
  serviceStatus,
  pushToast,
  onBudgetUpdate,
}: UseBudgetIndicatorOptions): UseBudgetIndicatorResult {
  const mountedRef = useMountedRef();
  const [indicator, setIndicator] = useState<BudgetIndicatorState>(DEFAULT_INDICATOR_STATE);
  const [blocked, setBlocked] = useState<boolean>(false);
  const analyticsToastShownRef = useRef(false);
  const prevServiceStatusRef = useRef<ServiceStatus>(serviceStatus);

  const fetchResponse = useCallback(
    async (options: { force?: boolean } = {}): Promise<AnalyticsBudgetBridgeResponse | null> => {
      const { force = false } = options;
      if (typeof window !== "undefined" && window.__testBudgetResponse !== undefined) {
        return window.__testBudgetResponse;
      }
      if (!services || !projectId || !serviceHealthy || typeof services.analyticsBudget !== 'function') {
        return null;
      }
      if (!force && serviceStatus !== 'online') {
        return null;
      }

      const result = await services.analyticsBudget({ projectId });
      if (!mountedRef.current) {
        return null;
      }

      if (result.ok && result.data) {
        return result.data;
      }

      if (!force && serviceStatus === 'online' && result.error) {
        const interpretation = handleServiceError(
          result.error,
          'analytics',
          pushToast,
          undefined,
          result.traceId ?? result.error.traceId,
          { suppressToast: analyticsToastShownRef.current },
        );
        if (interpretation.analyticsWarning) {
          analyticsToastShownRef.current = true;
        }
      }
      return null;
    },
    [mountedRef, projectId, pushToast, serviceHealthy, serviceStatus, services],
  );

  const maybeShowAnalyticsToast = useCallback(() => {
    if (analyticsToastShownRef.current) {
      return;
    }
    analyticsToastShownRef.current = true;
    pushToast(ANALYTICS_WARNING_TOAST);
  }, [pushToast]);

  useEffect(() => {
    if (prevServiceStatusRef.current === 'online' && serviceStatus === 'offline') {
      maybeShowAnalyticsToast();
    }
    if (serviceStatus === 'online') {
      analyticsToastShownRef.current = false;
    }
    prevServiceStatusRef.current = serviceStatus;
  }, [maybeShowAnalyticsToast, serviceStatus]);

  const refreshBudget = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      const response = await fetchResponse({ force });
      if (!mountedRef.current) {
        return;
      }
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
    },
    [fetchResponse, mountedRef, onBudgetUpdate],
  );
  const markBudgetBlocked = useCallback(() => {
    setBlocked(true);
    void refreshBudget();
  }, [refreshBudget]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as typeof window & { __budgetRefresh?: () => Promise<void> }).__budgetRefresh = () =>
        refreshBudget({ force: true });
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
