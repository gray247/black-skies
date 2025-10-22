import BudgetMeter, { type BudgetMeterProps } from './BudgetMeter';
import ServiceStatusPill from './ServiceStatusPill';
import type { ServiceStatus } from './ServiceStatusPill';

interface WorkspaceHeaderProps {
  projectLabel: string;
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
}

export function WorkspaceHeader({
  projectLabel,
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
}: WorkspaceHeaderProps): JSX.Element {
  return (
    <header className="app-shell__workspace-header">
      <div>
        <span className="app-shell__workspace-title">Project console</span>
        <p className="app-shell__workspace-subtitle">{projectLabel}</p>
      </div>
      <div className="app-shell__workspace-actions">
        {budget ? <BudgetMeter {...budget} /> : null}
        <ServiceStatusPill status={serviceStatus} onRetry={onRetry} />
        <button
          type="button"
          className={`app-shell__workspace-button${
            companionOpen ? ' app-shell__workspace-button--active' : ''
          }`}
          disabled={disableCompanion}
          aria-pressed={companionOpen}
          onClick={onToggleCompanion}
        >
          Companion
        </button>
        <button
          type="button"
          className="app-shell__workspace-button"
          disabled={disableGenerate}
          onClick={onGenerate}
        >
          Generate
        </button>
        <button
          type="button"
          className="app-shell__workspace-button"
          disabled={disableCritique}
          onClick={onCritique}
        >
          Critique
        </button>
      </div>
    </header>
  );
}

export default WorkspaceHeader;
