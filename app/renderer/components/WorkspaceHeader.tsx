import ServiceStatusPill from './ServiceStatusPill';
import type { ServiceStatus } from './ServiceStatusPill';

interface WorkspaceHeaderProps {
  projectLabel: string;
  serviceStatus: ServiceStatus;
  onRetry: () => Promise<void>;
  onGenerate: () => void;
  onCritique: () => void;
  disableGenerate: boolean;
  disableCritique: boolean;
}

export function WorkspaceHeader({
  projectLabel,
  serviceStatus,
  onRetry,
  onGenerate,
  onCritique,
  disableGenerate,
  disableCritique,
}: WorkspaceHeaderProps): JSX.Element {
  return (
    <header className="app-shell__workspace-header">
      <div>
        <span className="app-shell__workspace-title">Project console</span>
        <p className="app-shell__workspace-subtitle">{projectLabel}</p>
      </div>
      <div className="app-shell__workspace-actions">
        <ServiceStatusPill status={serviceStatus} onRetry={onRetry} />
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
