import type { AnalyticsBudgetBridgeResponse } from "../../shared/ipc/services";
import type { BudgetIndicatorState } from "../components/BudgetIndicator";

export type BudgetSnapshotSource = {
  soft_limit_usd?: number | null;
  hard_limit_usd?: number | null;
  spent_usd?: number | null;
  total_after_usd?: number | null;
  estimated_usd?: number | null;
  status?: string | null;
  message?: string | null;
};

export function normaliseBudgetNumber(value?: number | null): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function formatUsd(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "$0.00";
  }
  return `$${value.toFixed(2)}`;
}

export function buildBudgetIndicatorState(
  response: AnalyticsBudgetBridgeResponse,
): BudgetIndicatorState {
  const budget = response.budget;
  const softLimit = normaliseBudgetNumber(budget.soft_limit_usd);
  const hardLimit = normaliseBudgetNumber(budget.hard_limit_usd);
  const spent = normaliseBudgetNumber(budget.spent_usd);
  const remaining = normaliseBudgetNumber(budget.remaining_usd);
  const status =
    response.hint === "over_budget"
      ? "blocked"
      : response.hint === "near_cap"
        ? "warning"
        : "ok";

  let message: string | null = response.message ?? null;
  if (!message) {
    if (response.hint === "over_budget") {
      message = "Budget exhausted for this project/session.";
    } else if (response.hint === "near_cap") {
      message = remaining !== undefined ? `${formatUsd(remaining)} remaining` : "Approaching soft cap.";
    } else if (response.hint === "ample" && softLimit !== undefined && spent !== undefined) {
      const saved = Math.max(softLimit - spent, 0);
      if (saved > 0) {
        message = `Saved ${formatUsd(saved)} vs soft cap.`;
      }
    }
  }

  return {
    hint: response.hint,
    spent,
    remaining,
    softLimit,
    hardLimit,
    status,
    message,
  };
}
