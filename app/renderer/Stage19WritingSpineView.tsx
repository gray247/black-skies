import type { ReactNode } from 'react';

import type {
  ProjectSpineCommandStatusProjection,
  ProjectSpineRecoveryCandidateProjection,
  ProjectSpineSessionSnapshot,
  ProjectSpineUnitSummary,
  ProjectSpineWindowRole,
} from '../shared/ipc/projectSpine';
import type {
  AiCritiqueCompletedResult,
  AiCritiquePreview,
  AiCritiqueState,
} from '../shared/ipc/aiCritique';
import type { FeedbackNote } from '../shared/ipc/feedbackNotes';
import type {
  LivingOutlineItemKind,
  LivingOutlineItemState,
  LivingOutlineItemV1,
  LivingOutlineSnapshotV1,
} from '../shared/ipc/livingOutline';
import type {
  SplitCommandLogicalSurface,
  SplitCommandSecondarySurfaceStatus,
  SplitCommandSurfaceHostNotice,
} from '../shared/ipc/splitCommand';
import DraftEditor, { type DraftEditorSelectionEvidence } from './DraftEditor';
import type { Stage19ViewPhase } from './stage19WritingSpineController';

export interface MarkdownExportNotice {
  readonly projectId: string;
  readonly projectTitle: string;
  readonly tone: 'neutral' | 'success' | 'failure';
  readonly message: string;
}

export type Stage19WritingRail = 'top' | 'left' | 'right' | 'bottom';

export interface Stage19WritingSpineViewModel {
  readonly phase: Stage19ViewPhase;
  readonly windowRole: ProjectSpineWindowRole;
  readonly logicalSurface: SplitCommandLogicalSurface;
  readonly commandSnapshot: ProjectSpineSessionSnapshot | null;
  readonly surfaceHostAvailable: boolean;
  readonly commandPlacement: 'current-window' | 'secondary-window';
  readonly secondarySurfaceStatus: SplitCommandSecondarySurfaceStatus;
  readonly surfaceHostNotice: SplitCommandSurfaceHostNotice;
  readonly surfaceHostError: string | null;
  readonly snapshot: ProjectSpineSessionSnapshot;
  readonly notice: string | null;
  readonly activeUnit: ProjectSpineUnitSummary | null;
  readonly writingSaveSummary: string;
  readonly projectBridgeAvailable: boolean;
  readonly markdownExportAvailable: boolean;
  readonly exportingMarkdown: boolean;
  readonly markdownExportRequiresSave: boolean;
  readonly markdownExportNotice: MarkdownExportNotice | null;
  readonly focusMode: boolean;
  readonly openWritingRail: Stage19WritingRail | null;
  readonly recoveryDecisionUnitId: string | null;
  readonly projectTitle: string;
  readonly reviewPaneOpen: boolean;
  readonly newUnitTitle: string;
  readonly renameTitle: string;
  readonly dirtyUnitIds: ReadonlySet<string>;
  readonly recoveryBlocksEditing: boolean;
  readonly livingOutline: LivingOutlineSnapshotV1 | null;
  readonly livingOutlineLoading: boolean;
  readonly livingOutlineNotice: string | null;
  readonly selectedOutlineItem: LivingOutlineItemV1 | null;
  readonly selectedOutlineItemId: string | null;
  readonly outlineLabel: string;
  readonly outlineKind: LivingOutlineItemKind;
  readonly outlineState: LivingOutlineItemState;
  readonly outlineLinkActiveUnit: boolean;
  readonly projectedWritingOrder: readonly {
    readonly item: LivingOutlineItemV1;
    readonly unit: ProjectSpineUnitSummary;
  }[];
  readonly activeBuffer: string;
  readonly activeDirty: boolean;
  readonly aiBridgeAvailable: boolean;
  readonly aiSelection: DraftEditorSelectionEvidence | null;
  readonly aiCredential: string;
  readonly aiCredentialConfigured: boolean;
  readonly aiPreview: AiCritiquePreview | null;
  readonly aiClearanceConfirmed: boolean;
  readonly aiState: AiCritiqueState | null;
  readonly aiResult: AiCritiqueCompletedResult | null;
  readonly aiResultStale: boolean;
  readonly aiNotice: string | null;
  readonly feedbackNotesAvailable: boolean;
  readonly feedbackNoteBody: string;
  readonly feedbackNoteSaving: boolean;
  readonly feedbackNoteNotice: string | null;
  readonly savedFeedbackNotes: readonly FeedbackNote[];
  readonly overlays: ReactNode;
}

type MaybeAsync = void | Promise<void>;

export interface Stage19WritingSpineViewActions {
  readonly showWritingSurface: () => MaybeAsync;
  readonly showCommandSurface: () => MaybeAsync;
  readonly openCommandInSecondaryWindow: () => MaybeAsync;
  readonly exportMarkdown: () => MaybeAsync;
  readonly toggleFocusMode: () => void;
  readonly toggleWritingRail: (rail: Stage19WritingRail) => void;
  readonly closeWritingRail: (rail: Stage19WritingRail) => void;
  readonly submitRecoveryDecision: (
    candidate: ProjectSpineRecoveryCandidateProjection,
    decision: 'accept' | 'reject',
  ) => MaybeAsync;
  readonly openProject: () => MaybeAsync;
  readonly setProjectTitle: (value: string) => void;
  readonly createProject: () => MaybeAsync;
  readonly setNewUnitTitle: (value: string) => void;
  readonly createUnit: () => MaybeAsync;
  readonly selectUnit: (unitId: string) => MaybeAsync;
  readonly setRenameTitle: (value: string) => void;
  readonly renameUnit: () => MaybeAsync;
  readonly moveActiveUnit: (direction: -1 | 1) => MaybeAsync;
  readonly deleteUnit: () => MaybeAsync;
  readonly setOutlineLabel: (value: string) => void;
  readonly setOutlineKind: (value: LivingOutlineItemKind) => void;
  readonly setOutlineState: (value: LivingOutlineItemState) => void;
  readonly setOutlineLinkActiveUnit: (value: boolean) => void;
  readonly createOutlineItem: () => MaybeAsync;
  readonly updateOutlineItem: () => MaybeAsync;
  readonly selectOutlineItem: (itemId: string) => MaybeAsync;
  readonly moveOutlineItem: (direction: -1 | 1) => MaybeAsync;
  readonly linkOutlineItem: (unitId: string | null) => MaybeAsync;
  readonly deleteOutlineItem: () => MaybeAsync;
  readonly saveUnit: (unitId: string, body?: string) => MaybeAsync;
  readonly changeBuffer: (unitId: string, body: string) => void;
  readonly changeAiSelection: (selection: DraftEditorSelectionEvidence) => void;
  readonly setAiCredential: (value: string) => void;
  readonly configureAiCredential: () => MaybeAsync;
  readonly clearAiCredential: () => MaybeAsync;
  readonly prepareAiCritique: () => MaybeAsync;
  readonly setAiClearanceConfirmed: (value: boolean) => void;
  readonly approveAiCritique: () => MaybeAsync;
  readonly stopWaitingForAi: () => MaybeAsync;
  readonly dismissAiCritique: () => void;
  readonly openReviewPane: () => void;
  readonly closeReviewPane: () => void;
  readonly copyAiResult: () => MaybeAsync;
  readonly setFeedbackNoteBody: (value: string) => void;
  readonly saveFeedbackNote: () => MaybeAsync;
  readonly openRecent: (projectPath: string) => MaybeAsync;
  readonly removeRecent: (projectPath: string) => MaybeAsync;
}

export interface Stage19WritingSpineViewProps {
  readonly model: Stage19WritingSpineViewModel;
  readonly actions: Stage19WritingSpineViewActions;
}

function commandLifecycleLabel(status: ProjectSpineCommandStatusProjection): string {
  switch (status.lifecycle) {
    case 'active':
      return 'Active and available';
    case 'operation-failed':
      return 'Project operation failed';
    default:
      return 'No active project';
  }
}

function commandRecoveryLabel(status: ProjectSpineCommandStatusProjection): string {
  switch (status.recovery) {
    case 'decision-required':
      return 'Recovery decision required in Writing Studio';
    case 'accepted-pending-save':
      return 'Recovered work is unsaved and pending normal Save';
    case 'degraded':
      return 'Recovery evidence is degraded or unavailable';
    default:
      return 'No recovery action required';
  }
}

function commandSaveLabel(
  snapshot: ProjectSpineSessionSnapshot,
  status: ProjectSpineCommandStatusProjection,
): string {
  if (status.save === 'save-failed') return 'Save failed in Writing Studio';
  if (status.save === 'saving') return 'Saving…';
  if (status.recovery === 'decision-required' || status.recovery === 'degraded') {
    return commandRecoveryLabel(status);
  }
  if (status.save === 'accepted-recovery-pending-save') return 'Recovered work pending Save';
  if (!snapshot.project) return 'No active project';
  if (status.save === 'dirty') {
    return `${snapshot.dirtyUnitIds.length} unsaved unit${snapshot.dirtyUnitIds.length === 1 ? '' : 's'}`;
  }
  return 'Saved durably';
}

function surfaceHostNoticeLabel(notice: SplitCommandSurfaceHostNotice): string | null {
  switch (notice) {
    case 'secondary-closed':
      return 'Command Center returned to this window after its second window closed.';
    case 'secondary-lost':
      return 'Command Center returned safely after its second window stopped responding.';
    case 'display-removed':
      return 'Command Center returned safely because the second display was disconnected.';
    case 'secondary-launch-failed':
      return 'The second window was unavailable. Command Center remains available here.';
    default:
      return null;
  }
}

function SurfaceControlsView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element | null {
  if (!model.surfaceHostAvailable) return null;
  const secondaryBusy = model.secondarySurfaceStatus === 'opening';
  const secondaryOpen = model.commandPlacement === 'secondary-window' &&
    model.secondarySurfaceStatus === 'open';
  const notice = model.surfaceHostError ?? surfaceHostNoticeLabel(model.surfaceHostNotice);
  return (
    <div className="stage19-spine__surface-host">
      <nav className="stage19-spine__surface-actions" aria-label="Writing and Command surfaces">
        {model.logicalSurface === 'writing' ? (
          <>
            <button type="button" onClick={() => void actions.showCommandSurface()}>
              Open Command Center here
            </button>
            <button
              type="button"
              onClick={() => void actions.openCommandInSecondaryWindow()}
              disabled={secondaryBusy || secondaryOpen}
            >
              {secondaryBusy ? 'Opening second window…' : secondaryOpen
                ? 'Command Center open in second window'
                : 'Open Command Center in second window'}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => void actions.showWritingSurface()}>
              Return to Writing Studio
            </button>
            {model.windowRole === 'writing' ? (
              <button
                type="button"
                onClick={() => void actions.openCommandInSecondaryWindow()}
                disabled={secondaryBusy || secondaryOpen}
              >
                {secondaryBusy ? 'Opening second window…' : 'Move Command Center to second window'}
              </button>
            ) : null}
          </>
        )}
      </nav>
      {notice ? <p className="stage19-spine__surface-notice" role="status">{notice}</p> : null}
    </div>
  );
}

function CommandUnavailableView(props: Stage19WritingSpineViewProps): JSX.Element {
  return (
    <main className="stage19-spine stage19-spine--command" data-stage19-role={props.model.logicalSurface === 'command' ? 'command' : undefined} data-primary-scroll-container="true" role="region" aria-label="Command Center">
      <header className="stage19-spine__header">
        <div>
          <span className="stage19-spine__eyebrow">Command Center</span>
          <h1>Command status unavailable</h1>
          <p>Writing Studio authority could not be reached. No saved or recovery claim is shown.</p>
        </div>
        <div className="stage19-spine__project-actions">
          <span className="stage19-spine__save-state stage19-spine__save-state--save-failed" role="status">Status unavailable</span>
          <SurfaceControlsView {...props} />
        </div>
      </header>
      <p className="stage19-spine__notice" role="alert">The authoritative project-session bridge is unavailable.</p>
      <section className="stage19-spine__empty-state">
        <h2>Project status unavailable</h2>
        <p>Continue in Writing Studio and wait for Command Center synchronization.</p>
      </section>
    </main>
  );
}

function CommandCenterView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  const { snapshot, notice, activeUnit } = model;
  const commandStatus = snapshot.commandStatus;
  if (!commandStatus) return <CommandUnavailableView model={model} actions={actions} />;
  const commandAlert = notice ?? (
    commandStatus.lifecycle === 'operation-failed'
      ? 'A Writing Studio project operation failed. Current project identity is preserved.'
      : commandStatus.save === 'save-failed'
        ? 'Durable Save failed in Writing Studio. Unsaved local content remains.'
        : null
  );
  return (
    <main className="stage19-spine stage19-spine--command" data-stage19-role={model.logicalSurface === 'command' ? 'command' : undefined} data-primary-scroll-container="true" role="region" aria-label="Command Center">
      <header className="stage19-spine__header">
        <div>
          <span className="stage19-spine__eyebrow">Command Center</span>
          <h1>{snapshot.project?.title ?? 'No project open'}</h1>
          <p>Navigation, project status, and durable save truth. Manuscript mutation is unavailable here.</p>
        </div>
        <div className="stage19-spine__project-actions">
          <span className={`stage19-spine__save-state stage19-spine__save-state--${commandStatus.save}`} role="status">{commandSaveLabel(snapshot, commandStatus)}</span>
          <SurfaceControlsView model={model} actions={actions} />
        </div>
      </header>
      {commandAlert ? <p className="stage19-spine__notice" role="alert">{commandAlert}</p> : null}
      {snapshot.project ? (
        <div className="stage19-spine__command-grid">
          <section className="stage19-spine__card">
            <h2>Active project</h2>
            <dl className="stage19-spine__facts">
              <div><dt>Title</dt><dd>{snapshot.project.title}</dd></div>
              <div><dt>Identity</dt><dd>{snapshot.project.projectId}</dd></div>
              <div><dt>Location</dt><dd>{snapshot.project.path}</dd></div>
              <div><dt>Units</dt><dd>{snapshot.project.units.length}</dd></div>
            </dl>
          </section>
          <section className="stage19-spine__card stage19-spine__card--units">
            <h2>Manuscript navigation</h2>
            {snapshot.project.units.length > 0 ? (
              <ol className="stage19-spine__unit-list">
                {snapshot.project.units.map((unit) => (
                  <li key={unit.id}>
                    <button type="button" className={unit.id === snapshot.activeUnitId ? 'is-active' : ''} onClick={() => void actions.selectUnit(unit.id)} aria-current={unit.id === snapshot.activeUnitId ? 'page' : undefined}>
                      <span>{String(unit.order).padStart(2, '0')}</span><strong>{unit.displayTitle}</strong>
                    </button>
                  </li>
                ))}
              </ol>
            ) : <p className="stage19-spine__empty">This project has no manuscript units yet.</p>}
          </section>
          <section className="stage19-spine__card">
            <h2>Writing state</h2>
            <p><strong>Project:</strong> {commandLifecycleLabel(commandStatus)}</p>
            <p><strong>Recovery:</strong> {commandRecoveryLabel(commandStatus)}</p>
            <p><strong>Save:</strong> {commandSaveLabel(snapshot, commandStatus)}</p>
            <p>{snapshot.activeUnitId ? `Selected unit: ${activeUnit?.displayTitle ?? snapshot.activeUnitId}` : 'No unit selected'}</p>
            <p className="stage19-spine__mutability-note">Advisory/status/navigation only. No prose editor or structural mutation controls are exposed.</p>
          </section>
        </div>
      ) : (
        <section className="stage19-spine__empty-state">
          <h2>No active project</h2>
          <p>Create or open a project in Writing Studio. Command Center will synchronize automatically.</p>
          <p><strong>Recovery:</strong> {commandRecoveryLabel(commandStatus)}</p>
        </section>
      )}
    </main>
  );
}

function RecoveryStateView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element | null {
  const recovery = model.snapshot.recovery;
  if (recovery?.status === 'decision-required') {
    return (
      <section className="stage19-spine__card stage19-spine__recovery" aria-labelledby="stage19-recovery-title">
        <h2 id="stage19-recovery-title">Recover unsaved Writing Studio prose</h2>
        <p>Review every candidate. Recovered prose remains unsaved until you use the normal Save action.</p>
        {recovery.candidates.map((candidate) => {
          const allSelected = recovery.candidates.every((entry) => entry.decision === 'accept-selected');
          const submitting = model.recoveryDecisionUnitId !== null;
          return (
            <article key={`${candidate.unitId}:${candidate.originSessionId}:${candidate.candidateVersion}`}>
              <h3>{candidate.unitTitle.trim() || 'Untitled'}</h3>
              <pre aria-label={`Recovered prose for ${candidate.unitTitle.trim() || 'Untitled'}`}>
                {candidate.prose === '' ? '(Empty manuscript prose)' : candidate.prose}
              </pre>
              <div>
                <button type="button" onClick={() => void actions.submitRecoveryDecision(candidate, 'accept')} disabled={submitting || (candidate.decision === 'accept-selected' && !allSelected)}>
                  {candidate.decision === 'accept-selected'
                    ? allSelected ? 'Retry accepted recovery' : 'Accepted — finish remaining choices'
                    : 'Recover this prose'}
                </button>
                <button type="button" onClick={() => void actions.submitRecoveryDecision(candidate, 'reject')} disabled={submitting}>Reject and delete candidate</button>
              </div>
            </article>
          );
        })}
      </section>
    );
  }
  if (recovery?.status === 'degraded') {
    return (
      <section className="stage19-spine__card stage19-spine__recovery" role="alert">
        <h2>Recovery evidence needs attention</h2>
        <p>{recovery.message}</p>
        <p>Editing is blocked and the recovery artifact has not been deleted. Open another project or close Writing Studio to preserve it.</p>
      </section>
    );
  }
  if (recovery?.status === 'accepted-pending-save') {
    return <p className="stage19-spine__notice" role="status">Recovered prose is applied and remains unsaved. Use Save for each recovered unit to make it durable.</p>;
  }
  return null;
}

function ProjectLifecycleView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  return (
    <section className="stage19-spine__lifecycle" aria-label="Project lifecycle">
      <p className="stage19-spine__lifecycle-help">Open: select the actual Black Skies project folder containing <code>project.json</code>.</p>
      <button type="button" onClick={() => void actions.openProject()} disabled={!model.projectBridgeAvailable}>Open project…</button>
      <label>
        <span>New project title</span>
        <input value={model.projectTitle} onChange={(event) => actions.setProjectTitle(event.target.value)} />
      </label>
      <p className="stage19-spine__lifecycle-help">Create: choose a parent folder; Black Skies creates a new project folder inside it.</p>
      <button type="button" onClick={() => void actions.createProject()} disabled={!model.projectBridgeAvailable}>Create project…</button>
    </section>
  );
}

function LivingOutlineView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  const {
    activeUnit,
    livingOutline,
    livingOutlineLoading,
    livingOutlineNotice,
    outlineKind,
    outlineLabel,
    outlineLinkActiveUnit,
    outlineState,
    projectedWritingOrder,
    selectedOutlineItem,
    selectedOutlineItemId,
    snapshot,
  } = model;
  return (
    <section className="stage19-living-outline" aria-label="Living Outline">
      <div className="stage19-spine__section-heading">
        <div><span className="stage19-spine__eyebrow">Optional planning layer</span><h2>Living Outline</h2></div>
        <span>{livingOutline?.document.items.length ?? 0}</span>
      </div>
      <p className="stage19-living-outline__boundary">Planning only. It can point to writing, but it cannot rewrite prose or reorder the accepted manuscript.</p>
      {livingOutlineNotice ? <p className="stage19-living-outline__notice" role="status">{livingOutlineNotice}</p> : null}
      {livingOutlineLoading && !livingOutline ? <p>Loading outline…</p> : null}
      {livingOutline?.availability === 'ready' ? (
        <>
          <div className="stage19-living-outline__editor">
            <label>
              <span>Outline item</span>
              <input value={outlineLabel} maxLength={240} onChange={(event) => actions.setOutlineLabel(event.target.value)} placeholder="A fragment, gap, or planning area" />
            </label>
            <label>
              <span>Shape</span>
              <select value={outlineKind} onChange={(event) => actions.setOutlineKind(event.target.value as LivingOutlineItemKind)}>
                <option value="fragment">Fragment</option>
                <option value="gap">Gap</option>
                <option value="container">Planning area</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={outlineState} onChange={(event) => actions.setOutlineState(event.target.value as LivingOutlineItemState)}>
                <option value="authored">Authored</option>
                <option value="planned">Planned</option>
                <option value="inferred">Inferred</option>
                <option value="proposed">Proposed</option>
              </select>
            </label>
            <label className="stage19-living-outline__checkbox">
              <input type="checkbox" checked={outlineLinkActiveUnit} onChange={(event) => actions.setOutlineLinkActiveUnit(event.target.checked)} disabled={!activeUnit} />
              <span>{activeUnit ? `Link new item to ${activeUnit.displayTitle}` : 'Create unlinked (no active writing)'}</span>
            </label>
            <div className="stage19-living-outline__actions">
              <button type="button" onClick={() => void actions.createOutlineItem()} disabled={livingOutlineLoading || !outlineLabel.trim()}>Add outline item</button>
              <button type="button" onClick={() => void actions.updateOutlineItem()} disabled={livingOutlineLoading || !selectedOutlineItem || !outlineLabel.trim()}>Update selected</button>
            </div>
          </div>
          {livingOutline.document.items.length > 0 ? (
            <ol className="stage19-living-outline__items">
              {livingOutline.document.items.map((item, index) => {
                const linkedUnit = snapshot.project?.units.find((unit) => unit.id === item.manuscriptUnitId);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${item.id === selectedOutlineItemId ? 'is-active' : ''} ${item.manuscriptUnitId === snapshot.activeUnitId ? 'is-writing-linked' : ''}`}
                      aria-current={item.id === selectedOutlineItemId ? 'true' : undefined}
                      onClick={() => void actions.selectOutlineItem(item.id)}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{item.label}</strong>
                      <em>{item.kind} · {item.state}</em>
                      <small>{linkedUnit ? `Writing: ${linkedUnit.displayTitle}` : 'Unlinked planning'}</small>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : <p className="stage19-spine__empty">Start with a fragment, a gap, or an empty planning area. No warnings are generated.</p>}
          {selectedOutlineItem ? (
            <div className="stage19-living-outline__selected-actions">
              <button type="button" onClick={() => void actions.moveOutlineItem(-1)} disabled={livingOutlineLoading || livingOutline.document.items[0]?.id === selectedOutlineItem.id}>Move planning up</button>
              <button type="button" onClick={() => void actions.moveOutlineItem(1)} disabled={livingOutlineLoading || livingOutline.document.items.at(-1)?.id === selectedOutlineItem.id}>Move planning down</button>
              <button type="button" onClick={() => void actions.linkOutlineItem(snapshot.activeUnitId)} disabled={livingOutlineLoading || !snapshot.activeUnitId || selectedOutlineItem.manuscriptUnitId === snapshot.activeUnitId}>Link to active writing</button>
              <button type="button" onClick={() => void actions.linkOutlineItem(null)} disabled={livingOutlineLoading || !selectedOutlineItem.manuscriptUnitId}>Unlink</button>
              <button type="button" className="stage19-spine__danger" onClick={() => void actions.deleteOutlineItem()} disabled={livingOutlineLoading}>Delete planning item</button>
            </div>
          ) : null}
          <details className="stage19-living-outline__preview">
            <summary>Preview linked writing order</summary>
            <p>Preview only. Moving this list never moves accepted manuscript units.</p>
            {projectedWritingOrder.length > 0
              ? <ol>{projectedWritingOrder.map(({ item, unit }) => <li key={item.id}>{unit.displayTitle}</li>)}</ol>
              : <p>No outline items are linked to writing yet.</p>}
          </details>
        </>
      ) : null}
    </section>
  );
}

function ManuscriptBinderView(props: Stage19WritingSpineViewProps): JSX.Element {
  const { model, actions } = props;
  const { activeUnit, dirtyUnitIds, newUnitTitle, recoveryBlocksEditing, renameTitle, snapshot } = model;
  if (model.focusMode || !snapshot.project) return <></>;
  return (
    <aside className="stage19-spine__binder" aria-label="Manuscript binder and Living Outline">
      <div className="stage19-spine__section-heading">
        <div><span className="stage19-spine__eyebrow">Binder</span><h2>Manuscript units</h2></div>
        <span>{snapshot.project.units.length}</span>
      </div>
      <div className="stage19-spine__create-unit">
        <label>
          <span>Unit title (optional)</span>
          <input value={newUnitTitle} onChange={(event) => actions.setNewUnitTitle(event.target.value)} placeholder="Untitled" disabled={recoveryBlocksEditing} />
        </label>
        <button type="button" onClick={() => void actions.createUnit()} disabled={recoveryBlocksEditing}>Create unit</button>
      </div>
      {snapshot.project.units.length > 0 ? (
        <ol className="stage19-spine__unit-list">
          {snapshot.project.units.map((unit) => (
            <li key={unit.id}>
              <button type="button" className={unit.id === snapshot.activeUnitId ? 'is-active' : ''} onClick={() => void actions.selectUnit(unit.id)} aria-current={unit.id === snapshot.activeUnitId ? 'page' : undefined} disabled={recoveryBlocksEditing}>
                <span>{String(unit.order).padStart(2, '0')}</span>
                <strong>{unit.displayTitle}</strong>
                {dirtyUnitIds.has(unit.id) ? <em>Unsaved</em> : null}
              </button>
            </li>
          ))}
        </ol>
      ) : <p className="stage19-spine__empty">Create the first manuscript unit when you are ready to write.</p>}
      {activeUnit ? (
        <div className="stage19-spine__unit-actions">
          <label>
            <span>Selected unit title</span>
            <input value={renameTitle} onChange={(event) => actions.setRenameTitle(event.target.value)} placeholder="Untitled" disabled={recoveryBlocksEditing} />
          </label>
          <button type="button" onClick={() => void actions.renameUnit()} disabled={recoveryBlocksEditing}>Update title</button>
          <div className="stage19-spine__reorder-actions">
            <button type="button" onClick={() => void actions.moveActiveUnit(-1)} disabled={recoveryBlocksEditing || activeUnit.order <= 1}>Move up</button>
            <button type="button" onClick={() => void actions.moveActiveUnit(1)} disabled={recoveryBlocksEditing || activeUnit.order >= snapshot.project.units.length}>Move down</button>
          </div>
          <button type="button" className="stage19-spine__danger" onClick={() => void actions.deleteUnit()} disabled={recoveryBlocksEditing}>Delete unit…</button>
        </div>
      ) : null}
      <LivingOutlineView {...props} />
    </aside>
  );
}

function SelectedProseCritiqueView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element | null {
  if (model.focusMode) return null;
  const selectedCharacters = model.aiSelection?.selectedText.replace(/\s/g, '').length ?? 0;
  const selectionIsValid = selectedCharacters >= 200 && selectedCharacters <= 12_000;
  const waiting = model.aiState && ['approved', 'executing'].includes(model.aiState.status);
  const terminalWithoutResult = model.aiState &&
    ['failed', 'cancelled', 'expired', 'invalidated'].includes(model.aiState.status) &&
    !model.aiResult;
  return (
    <section className="stage19-ai" aria-label="Selected prose AI critique">
      <div className="stage19-ai__heading">
        <div><span className="stage19-spine__eyebrow">Optional remote critique</span><h3>Selected prose only</h3></div>
        <span className={model.aiCredentialConfigured ? 'is-ready' : ''}>
          {model.aiCredentialConfigured ? 'Session credential ready' : 'No session credential'}
        </span>
      </div>
      {!model.aiBridgeAvailable ? (
        <p>AI critique is unavailable. Writing, Save, recovery, and close remain local and available.</p>
      ) : (
        <>
          <div className="stage19-ai__credential">
            <label>
              <span>OpenAI API key (session only; no readback)</span>
              <input type="password" autoComplete="off" value={model.aiCredential} onChange={(event) => actions.setAiCredential(event.target.value)} />
            </label>
            <button type="button" onClick={() => void actions.configureAiCredential()} disabled={!model.aiCredential}>Set session key</button>
            <button type="button" onClick={() => void actions.clearAiCredential()} disabled={!model.aiCredentialConfigured}>Clear key</button>
          </div>
          <div className="stage19-ai__selection">
            <p>{model.aiSelection?.selectedText
              ? `${selectedCharacters.toLocaleString()} non-whitespace characters selected`
              : 'Select 200–12,000 non-whitespace characters in the manuscript editor.'}</p>
            <button type="button" onClick={() => void actions.prepareAiCritique()} disabled={!model.aiSelection || !selectionIsValid || model.aiState?.status === 'executing'}>
              Review outbound critique request
            </button>
          </div>
          {model.aiPreview ? (
            <div className="stage19-ai__preview">
              <h4>Exact outbound preview</h4>
              <dl>
                <div><dt>Provider</dt><dd>{model.aiPreview.provider}</dd></div>
                <div><dt>Pinned model</dt><dd>{model.aiPreview.model}</dd></div>
                <div><dt>Processing</dt><dd>Remote OpenAI Responses API</dd></div>
                <div><dt>Pricing verified</dt><dd>{model.aiPreview.cost.pricingVerifiedAt}</dd></div>
                <div><dt>Current text pricing</dt><dd>${model.aiPreview.cost.inputUsdPerMillionTokens.toFixed(2)} input / ${model.aiPreview.cost.cachedInputUsdPerMillionTokens.toFixed(2)} cached input / ${model.aiPreview.cost.outputUsdPerMillionTokens.toFixed(2)} output per 1M tokens</dd></div>
                <div><dt>Preview expires</dt><dd>{model.aiPreview.expiresAt}</dd></div>
                <div><dt>Estimated usage cost</dt><dd>${model.aiPreview.cost.estimatedUsd.toFixed(6)} USD</dd></div>
                <div><dt>Calculated maximum</dt><dd>${model.aiPreview.cost.maximumCalculatedUsd.toFixed(6)} USD under the $0.10 local ceiling</dd></div>
                <div><dt>Payload SHA-256</dt><dd><code>{model.aiPreview.payloadHash}</code></dd></div>
              </dl>
              <p>{model.aiPreview.cost.invoiceDisclaimer}</p>
              <p>{model.aiPreview.retentionDisclosure}</p>
              <p>{model.aiPreview.cancellationDisclosure}</p>
              <details><summary>Frozen critique instructions</summary><pre>{model.aiPreview.instructions}</pre></details>
              <details><summary>Exact provider request JSON</summary><pre>{model.aiPreview.providerBodyJson}</pre></details>
              <label><span>Exact selected prose to transmit</span><textarea readOnly value={model.aiPreview.selectedText} rows={8} /></label>
              <label className="stage19-ai__clearance">
                <input type="checkbox" checked={model.aiClearanceConfirmed} onChange={(event) => actions.setAiClearanceConfirmed(event.target.checked)} />
                <span>{model.aiPreview.clearanceDisclosure}</span>
              </label>
              <button type="button" onClick={() => void actions.approveAiCritique()} disabled={!model.aiClearanceConfirmed || !model.aiCredentialConfigured || model.aiState?.status !== 'prepared'}>
                Approve and send exact payload
              </button>
            </div>
          ) : null}
          {waiting ? (
            <div className="stage19-ai__progress" role="status">
              <p>Waiting for advisory critique. Editing will invalidate and discard this request.</p>
              <button type="button" onClick={() => void actions.stopWaitingForAi()}>Stop waiting</button>
            </div>
          ) : null}
          {model.aiNotice ? <p className="stage19-ai__notice" role="status">{model.aiNotice}</p> : null}
          {terminalWithoutResult ? <button type="button" onClick={actions.dismissAiCritique}>Dismiss critique status</button> : null}
        </>
      )}
      {(model.aiResult || model.savedFeedbackNotes.length > 0) && !model.reviewPaneOpen ? (
        <button type="button" onClick={actions.openReviewPane}>
          {model.aiResult ? 'Open Critique Workbench' : `Open Feedback Notes (${model.savedFeedbackNotes.length})`}
        </button>
      ) : null}
      {!model.reviewPaneOpen && model.feedbackNoteNotice ? <p className="stage19-ai__notice" role="status">{model.feedbackNoteNotice}</p> : null}
    </section>
  );
}

function ManuscriptCanvasView(props: Stage19WritingSpineViewProps): JSX.Element {
  const { model, actions } = props;
  const { activeUnit, snapshot } = model;
  return (
    <section className="stage19-spine__editor-card" aria-label="Manuscript editor">
      {activeUnit ? (
        <>
          <div className="stage19-spine__editor-header">
            <div><span className="stage19-spine__eyebrow">Active manuscript unit</span><h2>{activeUnit.displayTitle}</h2></div>
            <button type="button" onClick={() => void actions.saveUnit(activeUnit.id)} disabled={model.recoveryBlocksEditing || !model.activeDirty || snapshot.saveState.status === 'saving'}>
              {snapshot.saveState.status === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
          <p className="stage19-spine__shortcut">Ctrl+S saves the selected unit. Ctrl+Z undoes and Ctrl+Y redoes editor changes. Switching units preserves unsaved buffers.</p>
          <div className="stage19-spine__editor">
            <DraftEditor
              key={`${snapshot.project?.projectId ?? 'no-project'}:${snapshot.generation}:${snapshot.activeUnitId ?? 'no-unit'}`}
              value={model.activeBuffer}
              onChange={(body) => actions.changeBuffer(activeUnit.id, body)}
              onSave={(body) => void actions.saveUnit(activeUnit.id, body)}
              onSelectionChange={actions.changeAiSelection}
              readOnly={model.recoveryBlocksEditing}
              placeholder="Start writing…"
              ariaLabel={`Manuscript editor: ${activeUnit.displayTitle}`}
            />
          </div>
        </>
      ) : (
        <div className="stage19-spine__empty-state"><h2>No manuscript unit selected</h2><p>Create or select a unit from the binder.</p></div>
      )}
    </section>
  );
}

function CritiqueReviewPaneView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element | null {
  if (!model.reviewPaneOpen || model.focusMode) return null;
  return (
    <aside className="stage19-spine__review-pane" aria-label="Critique Workbench">
      <div className="stage19-ai__heading">
        <div><span className="stage19-spine__eyebrow">Summonable review pane</span><h3>Critique Workbench</h3></div>
        <button type="button" onClick={actions.closeReviewPane}>Hide pane</button>
      </div>
      {model.aiResult ? (
        <div className={`stage19-ai__result ${model.aiResultStale ? 'is-stale' : ''}`}>
          {model.aiResultStale ? <p className="stage19-ai__stale" role="status">Stale: the manuscript changed after this critique completed.</p> : null}
          <p><strong>Advisory only.</strong> This is a suggestion about the original selected prose, not story truth and never a manuscript change.</p>
          <dl className="stage19-ai__summary">
            <div><dt>Scope</dt><dd>Selected prose in {model.activeUnit?.displayTitle ?? 'the active unit'}</dd></div>
            <div><dt>Provider / model</dt><dd>{model.aiResult.provider} / {model.aiResult.model}</dd></div>
            <div><dt>Calculated cost</dt><dd>${model.aiResult.usage.calculatedUsd.toFixed(6)} (not an invoice)</dd></div>
            <div><dt>Privacy</dt><dd>Only the previewed selection was sent after approval.</dd></div>
          </dl>
          <h4>Advisory critique</h4>
          <p>{model.aiResult.content.overview}</p>
          {model.aiResult.content.strengths.length > 0 ? <><h5>Strengths</h5><ul>{model.aiResult.content.strengths.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
          {model.aiResult.content.priorities.length > 0 ? <><h5>Priorities</h5><ol>{model.aiResult.content.priorities.map((item, index) => <li key={`${index}-${item.evidence}`}><blockquote>{item.evidence}</blockquote><p>{item.observation}</p><p>{item.impact}</p><p>{item.revisionQuestion}</p></li>)}</ol></> : null}
          {model.aiResult.content.uncertainties.length > 0 ? <><h5>Uncertainties</h5><ul>{model.aiResult.content.uncertainties.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
          {model.aiResult.content.limitations.length > 0 ? <><h5>Limitations</h5><ul>{model.aiResult.content.limitations.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
          <p>{model.aiResult.usage.inputTokens} input tokens; {model.aiResult.usage.outputTokens} output tokens; {model.aiResult.usage.invoiceDisclaimer}</p>
          <div className="stage19-ai__actions">
            <button type="button" onClick={() => void actions.copyAiResult()}>Copy result text</button>
            <button type="button" onClick={actions.dismissAiCritique}>Dismiss critique</button>
          </div>
          <label className="stage19-ai__note">
            <span>Save a concise advisory project note</span>
            <textarea value={model.feedbackNoteBody} maxLength={4000} rows={4} onChange={(event) => actions.setFeedbackNoteBody(event.target.value)} />
          </label>
          <button type="button" onClick={() => void actions.saveFeedbackNote()} disabled={!model.feedbackNotesAvailable || model.feedbackNoteSaving}>
            {model.feedbackNoteSaving ? 'Saving note…' : 'Save advisory note'}
          </button>
          {!model.feedbackNotesAvailable ? <p className="stage19-ai__notice">Saving notes is unavailable in this window. The critique remains temporary.</p> : null}
          {model.feedbackNoteNotice ? <p className="stage19-ai__notice" role="status">{model.feedbackNoteNotice}</p> : null}
        </div>
      ) : (
        <p>No completed critique is open. Keep writing, or select prose to review an exact outbound request.</p>
      )}
      <section className="stage19-ai__saved-notes" aria-label="Saved advisory Feedback Notes">
        <h4>Saved advisory Feedback Notes</h4>
        {model.savedFeedbackNotes.length > 0 ? (
          <ol>{model.savedFeedbackNotes.map((note) => <li key={note.id}><p>{note.body}</p><small>Advisory · {note.createdAt} · source request {note.sourceCritiqueRequestId}</small></li>)}</ol>
        ) : <p>No author-saved feedback notes in this project.</p>}
      </section>
    </aside>
  );
}

const WRITING_RAIL_LABELS: Record<Stage19WritingRail, {
  readonly shortLabel: string;
  readonly accessibleLabel: string;
}> = {
  top: { shortLabel: 'Project', accessibleLabel: 'project tools' },
  left: { shortLabel: 'Manuscript', accessibleLabel: 'manuscript tools' },
  right: { shortLabel: 'Review', accessibleLabel: 'writing support' },
  bottom: { shortLabel: 'Session', accessibleLabel: 'session tools' },
};

function WritingEdgeControlsView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element | null {
  if (model.focusMode) return null;
  return (
    <nav className="stage19-writing-shell__edge-controls" aria-label="Writing Studio edge controls">
      {(Object.keys(WRITING_RAIL_LABELS) as Stage19WritingRail[]).map((rail) => {
        const label = WRITING_RAIL_LABELS[rail];
        const open = model.openWritingRail === rail;
        return (
          <button
            key={rail}
            id={`stage19-writing-edge-${rail}`}
            type="button"
            className={`stage19-writing-shell__edge stage19-writing-shell__edge--${rail}`}
            aria-label={`${open ? 'Close' : 'Open'} ${label.accessibleLabel}`}
            aria-expanded={open}
            aria-controls={`stage19-writing-rail-${rail}`}
            onClick={() => actions.toggleWritingRail(rail)}
          >
            <span className="stage19-writing-shell__edge-mark" aria-hidden="true" />
            <span className="stage19-writing-shell__edge-label">{label.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}

function WritingRailHeading({
  rail,
  title,
  actions,
}: {
  readonly rail: Stage19WritingRail;
  readonly title: string;
  readonly actions: Stage19WritingSpineViewActions;
}): JSX.Element {
  return (
    <div className="stage19-writing-shell__rail-heading">
      <h2>{title}</h2>
      <button type="button" onClick={() => actions.closeWritingRail(rail)}>
        Close
      </button>
    </div>
  );
}

function WritingTopRailView(props: Stage19WritingSpineViewProps): JSX.Element {
  const { model, actions } = props;
  return (
    <section
      id="stage19-writing-rail-top"
      className="stage19-writing-shell__rail stage19-writing-shell__rail--top"
      aria-label="Project tools"
    >
      <WritingRailHeading rail="top" title="Project tools" actions={actions} />
      <ProjectLifecycleView {...props} />
      {model.snapshot.project ? (
        <div className="stage19-writing-shell__project-tools">
          <button
            type="button"
            onClick={() => void actions.exportMarkdown()}
            disabled={!model.markdownExportAvailable || model.markdownExportRequiresSave || model.exportingMarkdown}
          >
            {model.exportingMarkdown ? 'Exporting...' : 'Export Markdown...'}
          </button>
          <p>Export follows the saved manuscript order and never includes unsaved prose.</p>
        </div>
      ) : null}
      {model.markdownExportRequiresSave ? <p className="stage19-spine__export-remedy" role="status">Save the project successfully before exporting.</p> : null}
      {model.markdownExportNotice ? (
        <p className={`stage19-spine__export-notice stage19-spine__export-notice--${model.markdownExportNotice.tone}`} role={model.markdownExportNotice.tone === 'failure' ? 'alert' : 'status'}>
          <strong>Markdown export for {model.markdownExportNotice.projectTitle}</strong>{' - '}{model.markdownExportNotice.message}
        </p>
      ) : null}
    </section>
  );
}

function WritingRightRailView(props: Stage19WritingSpineViewProps): JSX.Element {
  return (
    <aside
      id="stage19-writing-rail-right"
      className="stage19-writing-shell__rail stage19-writing-shell__rail--right"
      aria-label="Writing support"
    >
      <WritingRailHeading rail="right" title="Writing support" actions={props.actions} />
      <SelectedProseCritiqueView {...props} />
      <CritiqueReviewPaneView {...props} />
    </aside>
  );
}

function WritingBottomRailView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  const { activeUnit, snapshot } = model;
  return (
    <section
      id="stage19-writing-rail-bottom"
      className="stage19-writing-shell__rail stage19-writing-shell__rail--bottom"
      aria-label="Writing session tools"
    >
      <WritingRailHeading rail="bottom" title="Writing session" actions={actions} />
      <div className="stage19-writing-shell__session-summary">
        <p><strong>Current writing</strong><span>{activeUnit?.displayTitle ?? 'No manuscript unit selected'}</span></p>
        <p><strong>Save state</strong><span>{model.writingSaveSummary}</span></p>
        {activeUnit ? (
          <button
            type="button"
            onClick={() => void actions.saveUnit(activeUnit.id)}
            disabled={model.recoveryBlocksEditing || !model.activeDirty || snapshot.saveState.status === 'saving'}
          >
            {snapshot.saveState.status === 'saving' ? 'Saving...' : 'Save current writing'}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function WelcomeView({
  model,
  actions,
  showProjectLifecycle = true,
}: Stage19WritingSpineViewProps & { readonly showProjectLifecycle?: boolean }): JSX.Element {
  return (
    <div className="stage19-spine__welcome-grid">
      <section className="stage19-spine__empty-state">
        <h2>No active project</h2>
        <p>Open a project or begin a new local manuscript. You can start writing before building an outline.</p>
        {showProjectLifecycle ? <ProjectLifecycleView model={model} actions={actions} /> : null}
      </section>
      <section className="stage19-spine__card">
        <h2>Recent projects</h2>
        {model.snapshot.recentProjects.length > 0 ? (
          <ul className="stage19-spine__recent-list">
            {model.snapshot.recentProjects.map((recent) => (
              <li key={recent.path}>
                <button type="button" onClick={() => void actions.openRecent(recent.path)}>
                  <strong>{recent.title}</strong><span>{recent.path}</span>{recent.stale ? <em>Missing</em> : null}
                </button>
                <button type="button" onClick={() => void actions.removeRecent(recent.path)} aria-label={`Remove ${recent.title} from recent projects`}>Remove</button>
              </li>
            ))}
          </ul>
        ) : <p className="stage19-spine__empty">No recent project references.</p>}
      </section>
    </div>
  );
}

function WritingStudioView(props: Stage19WritingSpineViewProps): JSX.Element {
  const { model, actions } = props;
  const { activeUnit, snapshot } = model;
  const supportOpen = !model.focusMode && model.openWritingRail !== null;
  return (
    <main
      className={`stage19-spine stage19-spine--writing ${model.focusMode ? 'is-focus-mode' : ''}`}
      data-stage19-role={model.logicalSurface === 'writing' ? 'writing' : undefined}
      data-stage19-writing-rail={model.focusMode ? 'focus' : model.openWritingRail ?? 'closed'}
      data-primary-scroll-container="true"
      role="region"
      aria-label="Writing Studio"
    >
      <div className="stage19-writing-shell">
      <header className="stage19-writing-shell__topbar">
        <div className="stage19-writing-shell__identity">
          {!model.focusMode ? <span className="stage19-writing-shell__brand">Black Skies</span> : null}
          <h1 className="stage19-writing-shell__project">{snapshot.project?.title ?? 'Writing Studio'}</h1>
          {activeUnit ? <span className="stage19-writing-shell__location">{activeUnit.displayTitle}</span> : null}
        </div>
        <div className="stage19-writing-shell__status">
          <span className={`stage19-spine__save-state stage19-spine__save-state--${snapshot.saveState.status}`} role="status">{model.writingSaveSummary}</span>
          {!model.focusMode ? <SurfaceControlsView {...props} /> : null}
          <button type="button" className="stage19-writing-shell__focus" aria-pressed={model.focusMode} onClick={actions.toggleFocusMode}>
            {model.focusMode ? 'Exit Focus mode' : 'Enter Focus mode'}
          </button>
        </div>
      </header>
      {model.notice || snapshot.lastError ? <p className="stage19-spine__notice" role="alert">{model.notice ?? snapshot.lastError?.message}</p> : null}
      <WritingEdgeControlsView {...props} />
      {!model.focusMode && model.openWritingRail === 'top' ? <WritingTopRailView {...props} /> : null}
      <div className={`stage19-writing-shell__workspace ${supportOpen ? 'has-support' : ''}`}>
        {!model.focusMode && model.openWritingRail === 'left' ? (
          <section
            id="stage19-writing-rail-left"
            className="stage19-writing-shell__rail stage19-writing-shell__rail--left"
            aria-label="Manuscript tools"
          >
            <WritingRailHeading rail="left" title="Manuscript" actions={actions} />
            <ManuscriptBinderView {...props} />
          </section>
        ) : null}
        <div className="stage19-writing-shell__canvas">
          <RecoveryStateView {...props} />
          {snapshot.project
            ? <ManuscriptCanvasView {...props} />
            : <WelcomeView {...props} showProjectLifecycle={model.openWritingRail !== 'top'} />}
        </div>
        {!model.focusMode && model.openWritingRail === 'right' ? <WritingRightRailView {...props} /> : null}
      </div>
      {!model.focusMode && model.openWritingRail === 'bottom' ? <WritingBottomRailView {...props} /> : null}
      {model.overlays}
      </div>
    </main>
  );
}

export default function Stage19WritingSpineView(props: Stage19WritingSpineViewProps): JSX.Element {
  if (
    props.model.windowRole === 'writing' &&
    props.model.surfaceHostAvailable &&
    props.model.phase !== 'loading'
  ) {
    const commandSnapshot = props.model.commandSnapshot;
    const commandActiveUnit = commandSnapshot?.project?.units.find(
      (unit) => unit.id === commandSnapshot.activeUnitId,
    ) ?? null;
    const commandProps: Stage19WritingSpineViewProps = {
      actions: props.actions,
      model: {
        ...props.model,
        phase: commandSnapshot ? 'command' : 'command-unavailable',
        snapshot: commandSnapshot ?? props.model.snapshot,
        activeUnit: commandActiveUnit,
      },
    };
    return (
      <div
        className="stage19-spine-host"
        data-stage19-logical-surface={props.model.logicalSurface}
        data-stage19-command-placement={props.model.commandPlacement}
      >
        <div hidden={props.model.logicalSurface !== 'writing'}>
          <WritingStudioView {...props} />
        </div>
        <div hidden={props.model.logicalSurface !== 'command'}>
          {commandSnapshot
            ? <CommandCenterView {...commandProps} />
            : <CommandUnavailableView {...commandProps} />}
        </div>
      </div>
    );
  }
  switch (props.model.phase) {
    case 'loading':
      return <main className="stage19-spine stage19-spine--loading">Loading local writing session…</main>;
    case 'command-unavailable':
      return <CommandUnavailableView {...props} />;
    case 'command':
      return <CommandCenterView {...props} />;
    default:
      return <WritingStudioView {...props} />;
  }
}
