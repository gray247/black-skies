import { memo, useMemo } from 'react';
import type { AnalyticsBudgetHint } from '../../shared/ipc/services';
import { TID } from '../utils/testIds';

export interface BudgetIndicatorState {
  hint: AnalyticsBudgetHint;
  spent?: number;
  remaining?: number;
  softLimit?: number;
  hardLimit?: number;
  message?: string | null;
  status: 'ok' | 'warning' | 'blocked';
}

export const DEFAULT_BUDGET_INDICATOR_STATE: BudgetIndicatorState = {
  hint: 'stable',
  status: 'ok',
  message: 'Budget healthy.',
};

interface BudgetIndicatorProps {
  state: BudgetIndicatorState;
}

function formatCurrency(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0.00';
  }
  return `$${value.toFixed(2)}`;
}

function deriveLabel(state: BudgetIndicatorState): string {
  if (state.status === 'blocked') {
    return 'Budget exhausted';
  }
  if (state.status === 'warning') {
    return 'Budget warning';
  }
  return 'Budget OK';
}

const BudgetIndicator = memo(function BudgetIndicator({
  state,
}: BudgetIndicatorProps): JSX.Element {
  const label = deriveLabel(state);
  const helperMessage = useMemo(() => {
    if (state.message) {
      return state.message;
    }
    if (state.remaining !== undefined && state.status !== 'blocked') {
      return `${formatCurrency(state.remaining)} remaining`;
    }
    if (state.softLimit !== undefined && state.spent !== undefined) {
      const saved = Math.max(state.softLimit - state.spent, 0);
      if (saved > 0) {
        return `Saved ${formatCurrency(saved)} vs soft cap`;
      }
    }
    return null;
  }, [state.hint, state.remaining, state.softLimit, state.spent, state.message, state.status]);

  return (
    <div
      className={`budget-indicator budget-indicator--${state.status}`}
      data-testid={TID.budgetIndicator}
    >
      <span className="budget-indicator__label">{label}</span>
      {helperMessage ? (
        <span className="budget-indicator__message">{helperMessage}</span>
      ) : null}
    </div>
  );
});

BudgetIndicator.displayName = 'BudgetIndicator';

export default BudgetIndicator;
