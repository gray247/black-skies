import { useMemo } from 'react';
import BudgetMeter, { type BudgetMeterProps } from './BudgetMeter';
import BudgetIndicator, {
  DEFAULT_BUDGET_INDICATOR_STATE,
  type BudgetIndicatorState,
} from './BudgetIndicator';
import ServiceStatusPill from './ServiceStatusPill';
import type { ServiceStatus } from './ServiceStatusPill';

interface WorkspaceHeaderProps {
  projectLabel: string;
  projectId: string | null;
  serviceStatus: ServiceStatus;
  onRetry: () => Promise<void>;
  onToggleCompanion: () => void;
  onGenerate: () => void;
  onCritique: () => void;
  companionOpen: boolean;
  disableCompanion: boolean;
  disableGenerate: boolean;
  disableCritique: boolean;
  budget?: BudgetMeterProps;
  budgetIndicator?: BudgetIndicatorState | null;
}

export function WorkspaceHeader({
  projectLabel,
  projectId,
  serviceStatus,
  onRetry,
  onToggleCompanion,
  onGenerate,
  onCritique,
  companionOpen,
  disableCompanion,
  disableGenerate,
  disableCritique,
  budget,
  budgetIndicator,
}: WorkspaceHeaderProps): JSX.Element {
  const serviceStatusProps = useMemo(
    () => ({
      status: serviceStatus,
      onRetry,
    }),
    [serviceStatus, onRetry],
  );

  const companionButtonClassName = useMemo(
    () =>
      companionOpen
        ? 'app-shell__workspace-button app-shell__workspace-button--active'
        : 'app-shell__workspace-button',
    [companionOpen],
  );

  return (
    <header className="app-shell__workspace-header">
      <div className="app-shell__workspace-heading">
        <span className="app-shell__workspace-title">Your Story</span>
        <p className="app-shell__workspace-subtitle">{projectLabel}</p>
        {projectId ? (
          <p className="app-shell__workspace-meta">Project ID: {projectId}</p>
        ) : null}
      </div>
      <div className="app-shell__workspace-actions">
        <div className="workspace-header__budget-indicator" data-testid="budget-indicator">
          <BudgetIndicator state={budgetIndicator ?? DEFAULT_BUDGET_INDICATOR_STATE} />
        </div>
        {budget ? <BudgetMeter {...budget} /> : null}
        <ServiceStatusPill {...serviceStatusProps} />
        <button
          type="button"
          className={companionButtonClassName}
          disabled={disableCompanion}
          aria-pressed={companionOpen}
          aria-label="Toggle companion overlay"
          data-testid="workspace-action-companion"
          onClick={onToggleCompanion}
        >
          Companion
        </button>
        <button
          type="button"
          className="app-shell__workspace-button"
          disabled={disableGenerate}
          aria-label="Generate draft"
          data-testid="workspace-action-generate"
          onClick={onGenerate}
        >
          Generate
        </button>
        <button
          type="button"
          className="app-shell__workspace-button"
          disabled={disableCritique}
          aria-label="Run critique workflow"
          data-testid="workspace-action-critique"
          onClick={onCritique}
        >
          Critique
        </button>
      </div>
    </header>
  );
}

export default WorkspaceHeader;
