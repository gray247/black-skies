import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AnalyticsBudgetBridgeResponse, ServicesBridge } from "../../shared/ipc/services";
import type { ToastPayload } from "../types/toast";
import { ANALYTICS_WARNING_TOAST } from "../utils/serviceErrors";
import { buildBudgetIndicatorState, type BudgetSnapshotSource } from "../utils/budgetIndicator";
import useMountedRef from "./useMountedRef";
import type { BudgetIndicatorState } from "../components/BudgetIndicator";
import type { ServiceStatus } from "../components/ServiceStatusPill";

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
  const budgetBridgeWarningRef = useRef(false);

  const fetchResponse = useCallback(
    async (options: { force?: boolean } = {}): Promise<AnalyticsBudgetBridgeResponse | null> => {
      const { force = false } = options;
      if (typeof window !== "undefined" && window.__testBudgetResponse !== undefined) {
        return window.__testBudgetResponse;
      }
      if (!projectId) {
        return null;
      }
      if (!force && serviceStatus !== 'online') {
        return null;
      }
      if (services?.analyticsBudget && !budgetBridgeWarningRef.current) {
        console.info('[budget] Skipping analyticsBudget bridge call; endpoint disabled.');
        budgetBridgeWarningRef.current = true;
      }
      if (!serviceHealthy) {
        return null;
      }
      return null;
    },
    [projectId, serviceHealthy, serviceStatus, services],
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

    void refreshBudget({ force: true });

    return () => {
      if (typeof window !== "undefined" && window.__budgetRefresh) {
        window.__budgetRefresh = undefined;
      }
    };
  }, [projectId, refreshBudget]);

  const resolvedIndicator = useMemo(() => indicator, [indicator]);

  return {
    indicator: resolvedIndicator,
    blocked,
    refreshBudget,
    markBudgetBlocked,
  };
}
