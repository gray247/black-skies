import { memo, useMemo } from 'react';
import BudgetMeter, { type BudgetMeterProps } from './BudgetMeter';
import BudgetIndicator, {
  DEFAULT_BUDGET_INDICATOR_STATE,
  type BudgetIndicatorState,
} from './BudgetIndicator';
import ServiceStatusPill from './ServiceStatusPill';
import type { ServiceStatus } from './ServiceStatusPill';
import type { ExportFormat } from '../shared/ipc/services';

interface WorkspaceHeaderProps {
  projectLabel: string;
  projectId: string | null;
  serviceStatus: ServiceStatus;
  serviceReason?: string;
  onRetry: () => Promise<void>;
  onToggleCompanion: () => void;
  onGenerate: () => void;
  onCritique: () => void;
  onExport: () => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (next: ExportFormat) => void;
  onSnapshot: () => void;
  onVerify: () => void;
  onSnapshots: () => void;
  companionOpen: boolean;
  disableCompanion: boolean;
  disableGenerate: boolean;
  disableCritique: boolean;
  disableExport: boolean;
  disableSnapshot: boolean;
  disableVerify: boolean;
  disableSnapshots: boolean;
  budget?: BudgetMeterProps;
  budgetIndicator?: BudgetIndicatorState | null;
  showSnapshotsPanel: boolean;
  serviceOffline: boolean;
  testFreezeActions?: boolean;
}

export function WorkspaceHeader(props: WorkspaceHeaderProps): JSX.Element {
  const {
    projectLabel,
    projectId,
    serviceStatus,
    serviceReason,
    onRetry,
    onToggleCompanion,
    onGenerate,
    onCritique,
    onExport,
    exportFormat,
    onExportFormatChange,
    onSnapshot,
    onVerify,
    companionOpen,
    disableCompanion,
    disableGenerate,
    disableCritique,
    disableExport,
    disableSnapshot,
    disableVerify,
    budget,
    budgetIndicator,
  serviceOffline,
  testFreezeActions = false,
} = props;

  const disableSnapshots = props.disableSnapshots;
  const onSnapshots = props.onSnapshots;
  const { showSnapshotsPanel } = props;
  const serviceStatusProps = useMemo(
    () => ({
      status: serviceStatus,
      reason: serviceReason,
      onRetry,
      serviceOffline,
    }),
    [serviceStatus, serviceReason, onRetry, serviceOffline],
  );

  const companionButtonClassName = useMemo(
      () =>
        companionOpen
          ? 'app-shell__workspace-button app-shell__workspace-button--active'
          : 'app-shell__workspace-button',
      [companionOpen],
    );
  const computedDisableGenerate = testFreezeActions ? serviceOffline : disableGenerate;
  const computedDisableCritique = testFreezeActions ? serviceOffline : disableCritique;

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
          disabled={computedDisableGenerate}
          aria-label="Generate draft"
          data-testid="workspace-action-generate"
          onClick={onGenerate}
        >
          Generate
        </button>
        <button
          type="button"
          className="app-shell__workspace-button"
          disabled={computedDisableCritique}
          aria-label="Run critique workflow"
          data-testid="workspace-action-critique"
          onClick={onCritique}
        >
          Critique
        </button>
        <div className="workspace-header__export-picker">
          <label htmlFor="workspace-export-format" className="visually-hidden">
            Export format
          </label>
          <select
            id="workspace-export-format"
            className="workspace-header__export-select"
            data-testid="workspace-export-format"
            value={exportFormat}
            disabled={disableExport}
            onChange={(event) => onExportFormatChange(event.target.value as ExportFormat)}
          >
            <option value="md">Markdown</option>
            <option value="txt">Plain text</option>
            <option value="zip">ZIP archive</option>
          </select>
        </div>
        <div className="workspace-header__export-actions">
          <button
            type="button"
            className="app-shell__workspace-button"
            disabled={disableSnapshot}
            aria-label="Create snapshot"
            data-testid="workspace-action-snapshot"
            onClick={onSnapshot}
          >
            Snapshot
          </button>
          <button
            type="button"
            className="app-shell__workspace-button"
            disabled={disableVerify}
            aria-label="Verify snapshots"
            data-testid="workspace-action-verify"
            onClick={onVerify}
          >
            Verify
          </button>
          <button
            type="button"
            className={`app-shell__workspace-button${
              disableSnapshots ? ' app-shell__workspace-button--disabled' : ''
            }`}
            aria-controls="snapshots-panel"
            aria-expanded={showSnapshotsPanel ? 'true' : 'false'}
            aria-label="Open Snapshots panel"
            aria-disabled={disableSnapshots}
            data-testid="snapshots-open-button"
            onClick={() => {
              onSnapshots();
            }}
          >
            Snapshots
          </button>
          <button
            type="button"
            className="app-shell__workspace-button"
            disabled={disableExport}
            aria-label="Export project manuscript"
            data-testid="workspace-action-export"
            onClick={onExport}
          >
            Export
          </button>
        </div>
      </div>
    </header>
  );
}

const MemoizedWorkspaceHeader = memo(WorkspaceHeader);

export default MemoizedWorkspaceHeader;
