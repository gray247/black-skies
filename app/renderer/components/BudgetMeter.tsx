interface BudgetMeterProps {
  softLimitUsd?: number;
  hardLimitUsd?: number;
  spentUsd?: number;
  projectedUsd?: number;
  status?: 'ok' | 'soft-limit' | 'blocked';
  message?: string | null;
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return `$${value.toFixed(2)}`;
}

function statusLabel(status: BudgetMeterProps['status']): string {
  switch (status) {
    case 'soft-limit':
      return 'Soft limit reached';
    case 'blocked':
      return 'Over budget';
    default:
      return 'Within budget';
  }
}

export default function BudgetMeter({
  softLimitUsd,
  hardLimitUsd,
  spentUsd,
  projectedUsd,
  status = 'ok',
  message,
}: BudgetMeterProps): JSX.Element {
  const hardLimit = hardLimitUsd ?? 0;
  const projected = projectedUsd ?? spentUsd ?? 0;
  const progress = hardLimit > 0 ? Math.min(Math.max(projected / hardLimit, 0), 1) : 0;
  const softPercent =
    softLimitUsd && hardLimit > 0 ? Math.min(Math.max(softLimitUsd / hardLimit, 0), 1) : null;

  const spentLabel = typeof spentUsd === 'number' && !Number.isNaN(spentUsd)
    ? formatCurrency(spentUsd)
    : '—';
  const softLabel = typeof softLimitUsd === 'number' && !Number.isNaN(softLimitUsd)
    ? formatCurrency(softLimitUsd)
    : null;

  return (
    <div className={`budget-meter budget-meter--${status}`}>
      <div className="budget-meter__header">
        <span>Budget</span>
        <strong>{formatCurrency(projected)} / {formatCurrency(hardLimitUsd)}</strong>
      </div>
      <div className="budget-meter__bar">
        <div className="budget-meter__fill" style={{ width: `${progress * 100}%` }} />
        {softPercent !== null ? (
          <span
            className="budget-meter__soft-marker"
            style={{ left: `${softPercent * 100}%` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="budget-meter__footer">
        <span>
          Spent {spentLabel}
          {softLabel ? ` · Soft ${softLabel}` : ''}
        </span>
        <span>{statusLabel(status)}</span>
      </div>
      {message ? <p className="budget-meter__message">{message}</p> : null}
    </div>
  );
}

export type { BudgetMeterProps };
