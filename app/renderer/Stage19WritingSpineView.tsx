import { useEffect, useState, type ReactNode } from 'react';

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
import type { CompanionOrientationResultV1 } from '../shared/companionOrientation';
import type {
  LivingOutlineItemKind,
  LivingOutlineItemState,
  LivingOutlineItemV1,
  LivingOutlineSnapshotV1,
} from '../shared/ipc/livingOutline';
import type {
  ManuscriptStructureProposalV1,
  ManuscriptStructureSnapshotV1,
} from '../shared/ipc/manuscriptStructure';
import type {
  SplitCommandLogicalSurface,
  SplitCommandSecondarySurfaceStatus,
  SplitCommandSurfaceHostNotice,
} from '../shared/ipc/splitCommand';
import type {
  CommandWorkspaceV1,
  CritiqueReviewSourceReturnMessageV1,
  CritiqueReviewSurfaceStateV1,
} from '../shared/ipc/contextualProductShell';
import DraftEditor, { type DraftEditorSelectionEvidence } from './DraftEditor';
import type { Stage19ViewPhase } from './stage19WritingSpineController';

export interface MarkdownExportNotice {
  readonly projectId: string;
  readonly projectTitle: string;
  readonly tone: 'neutral' | 'success' | 'failure';
  readonly message: string;
}

export type Stage19WritingRail = 'top' | 'left' | 'right' | 'bottom';
export type Stage19Theme = 'dark' | 'light';

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
  readonly theme: Stage19Theme;
  readonly focusMode: boolean;
  readonly openWritingRail: Stage19WritingRail | null;
  readonly companionPrompt: string;
  readonly companionResult: CompanionOrientationResultV1 | null;
  readonly companionNotice: string | null;
  readonly recoveryDecisionUnitId: string | null;
  readonly projectTitle: string;
  readonly commandWorkspace: CommandWorkspaceV1;
  readonly critiqueReviewState: CritiqueReviewSurfaceStateV1 | null;
  readonly sourceReturnRequest: CritiqueReviewSourceReturnMessageV1 | null;
  readonly renameTitle: string;
  readonly unitEditingId: string | null;
  readonly unitAdvancedId: string | null;
  readonly dirtyUnitIds: ReadonlySet<string>;
  readonly recoveryBlocksEditing: boolean;
  readonly livingOutline: LivingOutlineSnapshotV1 | null;
  readonly livingOutlineLoading: boolean;
  readonly livingOutlineNotice: string | null;
  readonly manuscriptStructure: ManuscriptStructureSnapshotV1 | null;
  readonly manuscriptStructureLoading: boolean;
  readonly manuscriptStructureNotice: string | null;
  readonly manuscriptStructurePage: number;
  readonly manuscriptStructureOrder: readonly string[] | null;
  readonly structureBoundaryStart: number | null;
  readonly structureBoundaryEnd: number | null;
  readonly selectedManuscriptProposalId: string | null;
  readonly selectedOutlineItem: LivingOutlineItemV1 | null;
  readonly selectedOutlineItemId: string | null;
  readonly multiSelectMode: boolean;
  readonly selectedStoryItemIds: readonly string[];
  readonly storyRailHelpOpen: boolean;
  readonly storyRailAddMenuOpen: boolean;
  readonly outlineEditingItemId: string | null;
  readonly outlineAdvancedItemId: string | null;
  readonly outlineLabel: string;
  readonly outlineBody: string;
  readonly outlineKind: LivingOutlineItemKind;
  readonly outlineState: LivingOutlineItemState;
  readonly projectedWritingOrder: readonly {
    readonly item: LivingOutlineItemV1;
    readonly unit: ProjectSpineUnitSummary;
  }[];
  readonly buffers: Readonly<Record<string, string>>;
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
  readonly toggleTheme: () => void;
  readonly toggleFocusMode: () => void;
  readonly toggleWritingRail: (rail: Stage19WritingRail) => void;
  readonly closeWritingRail: (rail: Stage19WritingRail) => void;
  readonly setCompanionPrompt: (value: string) => void;
  readonly submitCompanionOrientation: () => MaybeAsync;
  readonly dismissCompanion: () => void;
  readonly returnToCompanionWriting: () => MaybeAsync;
  readonly submitRecoveryDecision: (
    candidate: ProjectSpineRecoveryCandidateProjection,
    decision: 'accept' | 'reject',
  ) => MaybeAsync;
  readonly openProject: () => MaybeAsync;
  readonly setProjectTitle: (value: string) => void;
  readonly createProject: () => MaybeAsync;
  readonly createUnit: () => MaybeAsync;
  readonly selectUnit: (unitId: string) => MaybeAsync;
  readonly clearOutlineSelection: () => void;
  readonly setStoryRailAddMenuOpen: (open: boolean) => void;
  readonly toggleMultiSelectMode: () => void;
  readonly toggleStorySelection: (itemId: string) => void;
  readonly clearStorySelection: () => void;
  readonly toggleStoryRailHelp: () => void;
  readonly activateUnitInStream: (unitId: string) => MaybeAsync;
  readonly deleteSelectedStoryItem: () => MaybeAsync;
  readonly setRenameTitle: (value: string) => void;
  readonly editUnit: (unitId: string) => void;
  readonly cancelUnitEdit: () => MaybeAsync;
  readonly openUnitOptions: (unitId: string) => void;
  readonly closeUnitOptions: () => void;
  readonly renameUnit: (unitId: string) => MaybeAsync;
  readonly deleteUnit: (unitId: string) => MaybeAsync;
  readonly setOutlineLabel: (value: string) => void;
  readonly setOutlineBody: (value: string) => void;
  readonly setOutlineKind: (value: LivingOutlineItemKind) => void;
  readonly setOutlineState: (value: LivingOutlineItemState) => void;
  readonly createOutlineItem: () => MaybeAsync;
  readonly updateOutlineItem: (itemId: string) => MaybeAsync;
  readonly selectOutlineItem: (itemId: string) => MaybeAsync;
  readonly editOutlineItem: (itemId: string) => void;
  readonly cancelOutlineItemEdit: () => MaybeAsync;
  readonly openOutlineItemOptions: (itemId: string) => void;
  readonly closeOutlineItemOptions: () => void;
  readonly importManuscriptStructure: () => MaybeAsync;
  readonly discoverManuscriptStructure: () => MaybeAsync;
  readonly acceptStructureProposal: (proposalId: string) => MaybeAsync;
  readonly rejectStructureProposal: (proposalId: string) => MaybeAsync;
  readonly renameStructureProposal: (proposalId: string, label: string) => MaybeAsync;
  readonly setStructureBoundary: (start: number, end: number, label: string) => MaybeAsync;
  readonly selectStructureBoundary: (offset: number, role?: 'start' | 'end') => void;
  readonly pinSelectedStructureBoundary: (label: string) => MaybeAsync;
  readonly splitStructureProposal: (proposalId: string, boundary: number) => MaybeAsync;
  readonly mergeStructureProposals: (proposalIds: readonly string[]) => MaybeAsync;
  readonly stageStructureOrder: (orderedProposalIds: readonly string[]) => void;
  readonly saveStructureOrder: () => MaybeAsync;
  readonly cancelStructureOrder: () => void;
  readonly setManuscriptStructurePage: (page: number) => void;
  readonly applyManuscriptStructure: () => MaybeAsync;
  readonly selectManuscriptStructureProposal: (proposalId: string) => void;
  readonly moveOutlineItem: (itemId: string, direction: -1 | 1) => MaybeAsync;
  readonly moveOutlineItemTo: (itemId: string, targetIndex: number) => MaybeAsync;
  readonly linkOutlineItem: (itemId: string, unitId: string | null) => MaybeAsync;
  readonly deleteOutlineItem: (itemId: string) => MaybeAsync;
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
  readonly selectCommandWorkspace: (workspace: CommandWorkspaceV1) => void;
  readonly openReviewWorkspace: () => MaybeAsync;
  readonly dismissCritiqueReview: () => MaybeAsync;
  readonly returnToCritiqueSource: () => MaybeAsync;
  readonly sourceSelectionRestoreResult: (requestId: string, restored: boolean) => void;
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

function ThemeSwitchView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  return (
    <div className="stage19-theme-switch" role="group" aria-label="Appearance">
      <span aria-hidden="true">Dark</span>
      <button
        type="button"
        role="switch"
        aria-label="Light theme"
        aria-checked={model.theme === 'light'}
        title={model.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        onClick={actions.toggleTheme}
      >
        <span className="stage19-theme-switch__thumb" aria-hidden="true" />
      </button>
      <span aria-hidden="true">Light</span>
    </div>
  );
}

function CommandUnavailableView(props: Stage19WritingSpineViewProps): JSX.Element {
  return (
    <main className="stage19-spine stage19-spine--command" data-stage19-role={props.model.logicalSurface === 'command' ? 'command' : undefined} data-stage19-theme={props.model.theme} data-primary-scroll-container="true" role="region" aria-label="Command Center">
      <header className="stage19-spine__header">
        <div>
          <span className="stage19-spine__eyebrow">Command Center</span>
          <h1>Command status unavailable</h1>
          <p>Writing Studio authority could not be reached. No saved or recovery claim is shown.</p>
        </div>
        <div className="stage19-spine__project-actions">
          <span className="stage19-spine__save-state stage19-spine__save-state--save-failed" role="status">Status unavailable</span>
          <ThemeSwitchView {...props} />
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

const COMMAND_WORKSPACES: readonly {
  readonly id: CommandWorkspaceV1;
  readonly label: string;
  readonly purpose: string;
}[] = [
  { id: 'review', label: 'Review', purpose: 'Advisory critique and author decisions' },
  { id: 'structure', label: 'Structure', purpose: 'Story planning and structural work' },
  { id: 'story-knowledge', label: 'Story Knowledge', purpose: 'Characters, world, and continuity' },
  { id: 'create-develop', label: 'Create / Develop', purpose: 'Bounded development tools' },
  { id: 'project-interchange', label: 'Project Interchange', purpose: 'Import, export, and handoff' },
  { id: 'operations-approvals', label: 'Operations / Approvals', purpose: 'Explicit project operations' },
] as const;

function ReviewWorkspaceView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  const state = model.critiqueReviewState;
  if (!state || state.availability === 'unavailable') {
    return (
      <section className="stage19-command__empty-state" aria-live="polite">
        <span className="stage19-spine__eyebrow">Review unavailable</span>
        <h2>Writing remains available</h2>
        <p>{state?.message ?? 'The Review projection is not connected in this window.'}</p>
      </section>
    );
  }
  if (state.availability === 'dismissed') {
    return (
      <section className="stage19-command__empty-state" aria-live="polite">
        <span className="stage19-spine__eyebrow">Review dismissed</span>
        <h2>Nothing is waiting for a decision</h2>
        <p>{state.message}</p>
        {model.feedbackNoteNotice ? <p className="stage19-ai__notice">{model.feedbackNoteNotice}</p> : null}
      </section>
    );
  }
  if (state.availability !== 'available' || !state.projection) {
    return (
      <section className="stage19-command__empty-state">
        <span className="stage19-spine__eyebrow">Review workspace</span>
        <h2>No critique is waiting</h2>
        <p>{state.message ?? 'Select prose in Writing Studio when you want a bounded advisory review.'}</p>
        {!model.surfaceHostAvailable
          ? <button type="button" onClick={() => void actions.showWritingSurface()}>Return to Writing Studio</button>
          : null}
      </section>
    );
  }
  const review = state.projection;
  const completed = review.lifecycleState === 'completed';
  const stale = review.lifecycleState === 'invalidated';
  return (
    <article className={`stage19-command-review ${stale ? 'is-stale' : ''}`} aria-labelledby="command-review-title">
      <header className="stage19-command-review__header">
        <div>
          <span className="stage19-spine__eyebrow">{review.advisoryLabel}</span>
          <h2 id="command-review-title">{completed ? 'Critique ready for your review' : 'Critique did not complete'}</h2>
          <p>{review.sourceLabel} · {review.selectedCharacterCount.toLocaleString()} selected characters</p>
        </div>
        <span className={`stage19-command-review__state stage19-command-review__state--${review.lifecycleState}`}>
          {stale ? 'Source changed' : review.lifecycleState}
        </span>
      </header>
      <div className="stage19-command-review__disclosures">
        <p><strong>Provider</strong><span>{review.providerDisclosure}</span></p>
        <p><strong>Model</strong><span>{review.modelDisclosure}</span></p>
        <p><strong>Privacy and cost</strong><span>{review.privacyAndCostDisclosure}</span></p>
      </div>
      {review.resultText ? (
        <section className="stage19-command-review__result" aria-label="Advisory critique result">
          <h3>Advisory result</h3>
          <pre>{review.resultText}</pre>
        </section>
      ) : (
        <section className="stage19-command-review__failure" role="status">
          <h3>{review.failureClass ? review.failureClass.replace(/-/g, ' ') : 'No result available'}</h3>
          <p>{review.limitationText}</p>
        </section>
      )}
      {review.resultText ? <p className="stage19-command-review__limitation"><strong>Limits:</strong> {review.limitationText}</p> : null}
      {review.allowedActions.includes('save-feedback-note') ? (
        <label className="stage19-command-review__note">
          <span>Save only the concise advisory note you choose</span>
          <textarea
            value={model.feedbackNoteBody}
            maxLength={4000}
            rows={4}
            onChange={(event) => actions.setFeedbackNoteBody(event.target.value)}
            placeholder="Your note, in your words..."
          />
        </label>
      ) : null}
      {model.feedbackNoteNotice ? <p className="stage19-ai__notice" role="status">{model.feedbackNoteNotice}</p> : null}
      <div className="stage19-command-review__actions">
        {review.allowedActions.includes('copy-result')
          ? <button type="button" onClick={() => void actions.copyAiResult()}>Copy result</button>
          : null}
        {review.allowedActions.includes('save-feedback-note')
          ? <button type="button" onClick={() => void actions.saveFeedbackNote()} disabled={model.feedbackNoteSaving}>{model.feedbackNoteSaving ? 'Saving note...' : 'Save advisory note'}</button>
          : null}
        {review.allowedActions.includes('dismiss')
          ? <button type="button" onClick={() => void actions.dismissCritiqueReview()}>Dismiss</button>
          : null}
        {review.allowedActions.includes('return-to-source')
          ? <button type="button" className="is-primary" onClick={() => void actions.returnToCritiqueSource()}>{stale ? 'Return to Writing' : 'Return to reviewed passage'}</button>
          : null}
      </div>
      <p className="stage19-spine__mutability-note">These actions cannot accept text into the manuscript, reorder the outline, or change story truth.</p>
    </article>
  );
}

function CommandCenterView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  const { snapshot, notice } = model;
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
    <main className="stage19-spine stage19-spine--command" data-stage19-role={model.logicalSurface === 'command' ? 'command' : undefined} data-stage19-theme={model.theme} data-command-workspace={model.commandWorkspace} data-primary-scroll-container="true" role="region" aria-label="Command Center">
      <header className="stage19-command__header">
        <div className="stage19-command__identity">
          <span className="stage19-spine__eyebrow">Black Skies · Command Center</span>
          <h1>{snapshot.project?.title ?? 'No project open'}</h1>
        </div>
        <div className="stage19-command__status">
          <span className={`stage19-spine__save-state stage19-spine__save-state--${commandStatus.save}`} role="status">{commandSaveLabel(snapshot, commandStatus)}</span>
          <ThemeSwitchView model={model} actions={actions} />
          <SurfaceControlsView model={model} actions={actions} />
        </div>
      </header>
      <div className="stage19-command__notice-slot">
        {commandAlert ? <p className="stage19-spine__notice" role="alert">{commandAlert}</p> : null}
      </div>
      <nav className="stage19-command__workspace-switcher" aria-label="Command Center workspaces">
        {COMMAND_WORKSPACES.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            aria-current={model.commandWorkspace === workspace.id ? 'page' : undefined}
            className={model.commandWorkspace === workspace.id ? 'is-active' : ''}
            title={workspace.purpose}
            onClick={() => actions.selectCommandWorkspace(workspace.id)}
          >{workspace.label}</button>
        ))}
      </nav>
      <div className="stage19-command__task-canvas">
        {model.companionResult ? (
          <CompanionTaskCanvasView model={model} actions={actions} />
        ) : !snapshot.project ? (
          <section className="stage19-command__empty-state">
            <span className="stage19-spine__eyebrow">No active project</span>
            <h2>Begin in Writing Studio</h2>
            <p>Command Center follows the active writing project and never gates opening or editing it.</p>
            {!model.surfaceHostAvailable
              ? <button type="button" onClick={() => void actions.showWritingSurface()}>Return to Writing Studio</button>
              : null}
          </section>
        ) : model.commandWorkspace === 'review' ? (
          <ReviewWorkspaceView model={model} actions={actions} />
        ) : (
          <section className="stage19-command__empty-state">
            <span className="stage19-spine__eyebrow">Stable workspace location</span>
            <h2>{COMMAND_WORKSPACES.find((workspace) => workspace.id === model.commandWorkspace)?.label}</h2>
            <p>{COMMAND_WORKSPACES.find((workspace) => workspace.id === model.commandWorkspace)?.purpose} will be introduced only by its authorized product program. This shell does not pretend the tool exists today.</p>
            <button type="button" onClick={() => actions.selectCommandWorkspace('review')}>Open Review</button>
          </section>
        )}
      </div>
      <footer className="stage19-command__footer">
        <span>{commandLifecycleLabel(commandStatus)}</span>
        <span>{commandRecoveryLabel(commandStatus)}</span>
        <span>Command is optional and non-gating</span>
      </footer>
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
      <div className="stage19-writing-shell__project-tool-group" data-project-tool="open">
        <div className="stage19-writing-shell__project-tool-copy">
          <h3>Open existing project</h3>
          <p className="stage19-spine__lifecycle-help">Select a Black Skies folder containing <code>project.json</code>.</p>
        </div>
        <div className="stage19-writing-shell__project-tool-controls">
          <button
            type="button"
            onClick={() => void actions.openProject()}
            disabled={!model.projectBridgeAvailable}
            title={model.projectBridgeAvailable ? 'Choose an existing Black Skies project folder' : 'Project tools are unavailable in this window'}
          >
            Open project…
          </button>
        </div>
      </div>
      <div className="stage19-writing-shell__project-tool-group" data-project-tool="create">
        <div className="stage19-writing-shell__project-tool-copy">
          <h3>Create new project</h3>
          <p className="stage19-spine__lifecycle-help">Choose a parent folder; Black Skies creates the project folder inside it.</p>
        </div>
        <div className="stage19-writing-shell__project-tool-controls">
          <label>
            <span>Project title</span>
            <input value={model.projectTitle} onChange={(event) => actions.setProjectTitle(event.target.value)} />
          </label>
          <button
            type="button"
            onClick={() => void actions.createProject()}
            disabled={!model.projectBridgeAvailable}
            title={model.projectBridgeAvailable ? 'Choose a parent folder and create this project' : 'Project tools are unavailable in this window'}
          >
            Create project…
          </button>
        </div>
      </div>
    </section>
  );
}

function focusOutlineTitleInput(element: HTMLInputElement | null): void {
  element?.focus();
}

function LivingOutlineView({
  model,
  actions,
  placementUnitId,
  showAdvanced = true,
  showChrome = true,
  showEmpty = true,
  showPreview = true,
}: Stage19WritingSpineViewProps & {
  readonly placementUnitId?: string | null;
  readonly showAdvanced?: boolean;
  readonly showChrome?: boolean;
  readonly showEmpty?: boolean;
  readonly showPreview?: boolean;
}): JSX.Element {
  const {
    activeUnit,
    aiSelection,
    livingOutline,
    livingOutlineLoading,
    livingOutlineNotice,
    outlineAdvancedItemId,
    outlineEditingItemId,
    outlineKind,
    outlineLabel,
    outlineBody,
    outlineState,
    projectedWritingOrder,
    selectedOutlineItemId,
    multiSelectMode,
    selectedStoryItemIds,
    snapshot,
  } = model;
  const detailItemId = outlineAdvancedItemId ?? outlineEditingItemId;
  const advancedItem = livingOutline?.document.items.find((item) => item.id === detailItemId) ?? null;
  const visibleItems = livingOutline?.document.items.filter((item) =>
    placementUnitId === undefined ? true : item.manuscriptUnitId === placementUnitId,
  ) ?? [];
  const markerTargetItem = visibleItems.find((item) => item.id === selectedOutlineItemId) ?? visibleItems[0] ?? null;
  const hasSelectedPassage = Boolean(aiSelection?.selectedText.trim());
  const creationContext = hasSelectedPassage
    ? `Selected passage in ${activeUnit?.displayTitle ?? 'the current writing'}`
    : activeUnit
      ? `Current position in ${activeUnit.displayTitle}`
      : 'No manuscript context; the new item will be Not placed yet';
  return (
    <section className={`stage19-living-outline ${showChrome ? '' : 'stage19-living-outline--nested'}`} aria-label={showChrome ? 'Story plan' : undefined}>
      {showChrome ? <div className="stage19-living-outline__heading">
        <div>
          <h2>Story plan</h2>
          <span className="stage19-living-outline__count" aria-label={`${livingOutline?.document.items.length ?? 0} Notes`}>
            {livingOutline?.document.items.length ?? 0}
          </span>
        </div>
        <button
          type="button"
          className="stage19-living-outline__add"
          aria-label="Add to story here"
          aria-describedby="stage19-outline-creation-context"
          title="Add a Note at the current writing position"
          onClick={() => void actions.createOutlineItem()}
          disabled={livingOutlineLoading || livingOutline?.availability !== 'ready'}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div> : null}
      {showChrome ? <p id="stage19-outline-creation-context" className="stage19-living-outline__context">{creationContext}</p> : null}
      {showChrome ? <p className="stage19-living-outline__boundary">A lightweight map beside your writing. It can point to the story, but it never rewrites your words.</p> : null}
      {showChrome && livingOutlineNotice ? <p className="stage19-living-outline__notice" role="status">{livingOutlineNotice}</p> : null}
      {livingOutlineLoading && !livingOutline ? <p>Loading story plan…</p> : null}
      {livingOutline?.availability === 'ready' ? (
        <>
          {visibleItems.length > 0 ? (
            <div className={`stage19-note-marker-cluster ${visibleItems.some((item) => selectedStoryItemIds.includes(item.id)) ? 'is-multi-selected' : ''}`} data-note-marker-cluster="true" data-note-cluster-count={visibleItems.length}>
              <button
                type="button"
                className={`stage19-note-marker-cluster__button ${visibleItems.some((item) => item.id === selectedOutlineItemId) ? 'is-active' : ''}`}
                aria-label={visibleItems.length === 1
                  ? `Open Note ${visibleItems[0]!.label}${placementUnitId ? ` for ${snapshot.project?.units.find((unit) => unit.id === placementUnitId)?.displayTitle ?? 'this Unit'}` : ' not placed yet'}`
                  : `Open ${visibleItems.length} Notes${placementUnitId ? ` for ${snapshot.project?.units.find((unit) => unit.id === placementUnitId)?.displayTitle ?? 'this Unit'}` : ' not placed yet'}`}
                aria-expanded={Boolean(advancedItem && visibleItems.some((item) => item.id === advancedItem.id))}
                title={visibleItems.length === 1 ? 'Double-click or press F2 to rename this Note' : 'Open Notes in this cluster'}
                onClick={() => markerTargetItem && actions.openOutlineItemOptions(markerTargetItem.id)}
                onDoubleClick={() => markerTargetItem && actions.editOutlineItem(markerTargetItem.id)}
                onKeyDown={(event) => {
                  if (event.key === 'F2' && markerTargetItem) {
                    event.preventDefault();
                    actions.editOutlineItem(markerTargetItem.id);
                  }
                }}
              >
                <span className="stage19-note-marker-cluster__marker" aria-hidden="true" />
                <span className="stage19-note-marker-cluster__label">
                  {visibleItems.length === 1 ? visibleItems[0]!.label : `${visibleItems.length} Notes`}
                </span>
              </button>
              {multiSelectMode ? <div className="stage19-note-marker-cluster__selection" role="group" aria-label="Select Notes in this marker cluster">
                {visibleItems.map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      aria-label={`Select Note ${item.label}`}
                      checked={selectedStoryItemIds.includes(item.id)}
                      onChange={() => actions.toggleStorySelection(item.id)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div> : null}
            </div>
          ) : showEmpty ? <p className="stage19-spine__empty">No notes yet. Keep writing, or use + when a planning thought matters.</p> : null}
          {showAdvanced && advancedItem && (placementUnitId === undefined || advancedItem.manuscriptUnitId === placementUnitId) ? (
            <section className="stage19-living-outline__advanced" aria-label={`More options for ${advancedItem.label}`}>
              <div className="stage19-living-outline__advanced-heading">
                <div><span className="stage19-spine__eyebrow">Advanced context</span><h3>{advancedItem.label}</h3></div>
                <button
                  type="button"
                  onClick={actions.closeOutlineItemOptions}
                  aria-label="Close note editor; discard unsaved edits"
                  title="Close note editor; discard unsaved edits"
                >Close</button>
              </div>
              {visibleItems.length > 1 ? <div className="stage19-note-marker-cluster__details" role="group" aria-label="Notes in this marker cluster">
                {visibleItems.map((item) => <button key={item.id} type="button" className={item.id === advancedItem.id ? 'is-active' : ''} onClick={() => actions.openOutlineItemOptions(item.id)}>{item.label}</button>)}
              </div> : null}
              <p className="stage19-living-outline__explanation">
                Double-click the note to rename it. Use − in the Story rail to delete it.
              </p>
              <button type="button" onClick={() => void actions.selectOutlineItem(advancedItem.id)}>Locate in manuscript</button>
              <label>
                <span>Note title</span>
                <input
                  ref={outlineEditingItemId === advancedItem.id ? focusOutlineTitleInput : undefined}
                  id={`stage19-outline-detail-title-${advancedItem.id}`}
                  aria-label={`Title for ${advancedItem.label}`}
                  value={outlineLabel}
                  maxLength={240}
                  onChange={(event) => actions.setOutlineLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') void actions.cancelOutlineItemEdit();
                  }}
                />
              </label>
              {outlineKind === 'gap' ? <span className="stage19-living-outline__meaning">Something goes here</span> : null}
              {outlineState === 'proposed' ? <span className="stage19-living-outline__suggested">Suggested</span> : null}
              {outlineAdvancedItemId ? <>
                <label>
                  <span>Structural meaning</span>
                  <select value={outlineKind} onChange={(event) => actions.setOutlineKind(event.target.value as LivingOutlineItemKind)}>
                    <option value="fragment">Note</option>
                    <option value="gap">Something goes here</option>
                    <option value="container">Planning area</option>
                  </select>
                </label>
                <p className="stage19-living-outline__explanation">
                  {outlineKind === 'gap'
                    ? 'A deliberate empty place you expect to fill later.'
                    : outlineKind === 'container'
                      ? 'A planning area that groups or holds structural thoughts.'
                      : 'An ordinary structural thought beside the manuscript.'}
                </p>
                <label>
                  <span>Source state</span>
                  <select value={outlineState} onChange={(event) => actions.setOutlineState(event.target.value as LivingOutlineItemState)}>
                    <option value="authored">Already in the writing</option>
                    <option value="planned">Planned by me</option>
                    <option value="inferred">Observed from the writing</option>
                    <option value="proposed">Suggested for consideration</option>
                  </select>
                </label>
                <p className="stage19-living-outline__explanation">
                  {outlineState === 'authored'
                    ? 'This reflects writing already accepted on the page.'
                    : outlineState === 'planned'
                      ? 'This records your own intention for the story.'
                      : outlineState === 'inferred'
                        ? 'This was observed from existing writing and remains advisory.'
                        : 'This is a suggestion and remains advisory until you decide otherwise.'}
                </p>
              </> : null}
              <label>
                <span>Note body</span>
                <textarea aria-label={`Body for ${advancedItem.label}`} value={outlineBody} maxLength={4000} rows={4} onChange={(event) => actions.setOutlineBody(event.target.value)} />
              </label>
              <button
                type="button"
                onClick={() => void actions.updateOutlineItem(advancedItem.id)}
                disabled={livingOutlineLoading || !outlineLabel.trim()}
                aria-label="Save note and close"
                title="Save this Note and close the detail panel"
              >Save note and close</button>
              <div className="stage19-living-outline__relationship">
                <strong>{advancedItem.manuscriptUnitId ? `Belongs with: ${snapshot.project?.units.find((unit) => unit.id === advancedItem.manuscriptUnitId)?.displayTitle ?? 'writing'}` : 'Not placed yet'}</strong>
                <button type="button" onClick={() => void actions.linkOutlineItem(advancedItem.id, snapshot.activeUnitId)} disabled={livingOutlineLoading || !snapshot.activeUnitId || advancedItem.manuscriptUnitId === snapshot.activeUnitId}>Place with current writing</button>
                <button type="button" onClick={() => void actions.linkOutlineItem(advancedItem.id, null)} disabled={livingOutlineLoading || !advancedItem.manuscriptUnitId}>Mark Not placed yet</button>
              </div>
              <dl className="stage19-living-outline__provenance">
                <div><dt>Created</dt><dd>{advancedItem.createdAt}</dd></div>
                <div><dt>Updated</dt><dd>{advancedItem.updatedAt}</dd></div>
              </dl>
            </section>
          ) : null}
          {showPreview ? <details className="stage19-living-outline__preview">
            <summary>Compare the story plan with the manuscript</summary>
            <p>Preview only. Moving this plan never moves your written pages.</p>
            {projectedWritingOrder.length > 0
              ? <ol>{projectedWritingOrder.map(({ item, unit }) => <li key={item.id}>{unit.displayTitle}</li>)}</ol>
              : <p>No notes are placed with writing yet.</p>}
          </details> : null}
        </>
      ) : null}
    </section>
  );
}

interface ImportedManuscriptProposalRange {
  readonly id: string;
  readonly label: string;
  readonly start: number;
  readonly end: number;
}

interface ImportedManuscriptRanges {
  readonly ranges: readonly ImportedManuscriptProposalRange[];
  readonly invalidProposalIds: readonly string[];
  readonly overlappingProposalIds: readonly string[];
}

function hasCurrentImportedAnchor(
  proposal: ManuscriptStructureProposalV1,
  structure: ManuscriptStructureSnapshotV1,
): boolean {
  const { anchor } = proposal;
  return structure.sourceStatus === 'current' &&
    proposal.state !== 'stale' &&
    !proposal.appliedUnitId &&
    anchor.sourceFingerprint === structure.document.source.sourceFingerprint &&
    Number.isSafeInteger(anchor.selectionStart) &&
    Number.isSafeInteger(anchor.selectionEnd) &&
    anchor.selectionStart >= 0 &&
    anchor.selectionEnd > anchor.selectionStart &&
    anchor.selectionEnd <= structure.sourceText.length;
}

function resolveImportedManuscriptRanges(structure: ManuscriptStructureSnapshotV1): ImportedManuscriptRanges {
  if (structure.sourceStatus !== 'current') {
    return { ranges: [], invalidProposalIds: [], overlappingProposalIds: [] };
  }
  const invalidProposalIds: string[] = [];
  const candidates: ImportedManuscriptProposalRange[] = [];
  for (const proposal of structure.document.proposals) {
    if (proposal.state === 'stale' || proposal.appliedUnitId) continue;
    if (!hasCurrentImportedAnchor(proposal, structure)) {
      invalidProposalIds.push(proposal.id);
      continue;
    }
    candidates.push({
      id: proposal.id,
      label: proposal.label,
      start: proposal.anchor.selectionStart,
      end: proposal.anchor.selectionEnd,
    });
  }
  candidates.sort((left, right) => left.start - right.start || left.end - right.end);
  const overlapping = new Set<string>();
  let previous: ImportedManuscriptProposalRange | null = null;
  for (const candidate of candidates) {
    if (previous && candidate.start < previous.end) {
      overlapping.add(previous.id);
      overlapping.add(candidate.id);
    }
    if (!previous || candidate.end > previous.end) previous = candidate;
  }
  return {
    ranges: candidates.filter((candidate) => !overlapping.has(candidate.id)),
    invalidProposalIds,
    overlappingProposalIds: [...overlapping],
  };
}

export function getSelectableImportedManuscriptProposalIds(
  structure: ManuscriptStructureSnapshotV1 | null,
): readonly string[] {
  return structure ? resolveImportedManuscriptRanges(structure).ranges.map((range) => range.id) : [];
}

function ImportedManuscriptSourceLine({
  line,
  lineStart,
  ranges,
  selectedProposalId,
  selectProposal,
}: {
  readonly line: string;
  readonly lineStart: number;
  readonly ranges: readonly ImportedManuscriptProposalRange[];
  readonly selectedProposalId: string | null;
  readonly selectProposal: (proposalId: string) => void;
}): JSX.Element {
  const lineEnd = lineStart + line.length;
  const lineRanges = ranges.filter((range) => range.start < lineEnd && range.end > lineStart);
  const points = [...new Set([
    lineStart,
    lineEnd,
    ...lineRanges.flatMap((range) => [
      Math.max(lineStart, range.start),
      Math.min(lineEnd, range.end),
    ]),
  ])].sort((left, right) => left - right);
  const heading = /^\s{0,3}#{1,6}\s+/.test(line);
  return (
    <span
      className={`stage19-imported-manuscript__line ${heading ? 'is-heading' : ''}`}
      data-imported-manuscript-line="true"
    >
      {points.slice(0, -1).map((start, index) => {
        const end = points[index + 1]!;
        const range = lineRanges.find((candidate) => candidate.start <= start && candidate.end >= end);
        const value = line.slice(start - lineStart, end - lineStart);
        if (!range) return <span key={`${start}:${end}`}>{value}</span>;
        const selected = range.id === selectedProposalId;
        const startsRange = range.start >= lineStart && range.start < lineEnd;
        return (
          <button
            key={`${range.id}:${start}:${end}`}
            id={startsRange ? `stage19-imported-proposal-${range.id}` : undefined}
            type="button"
            className={`stage19-imported-manuscript__proposal ${selected ? 'is-selected' : ''} ${startsRange ? 'is-range-start' : ''}`}
            data-imported-proposal-range="true"
            data-imported-proposal-id={range.id}
            aria-current={selected ? 'true' : undefined}
            aria-pressed={selected}
            aria-label={`${selected ? 'Selected' : 'Select'} proposal range: ${range.label}`}
            onClick={() => selectProposal(range.id)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              selectProposal(range.id);
            }}
          >
            {value}
          </button>
        );
      })}
    </span>
  );
}

function ImportedManuscriptPreviewView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  const structure = model.manuscriptStructure!;
  const sourceLines = structure.sourceText.split('\n');
  const { ranges, invalidProposalIds, overlappingProposalIds } = resolveImportedManuscriptRanges(structure);
  const counts = structure.document.proposals.reduce<Record<ManuscriptStructureProposalV1['state'], number>>(
    (result, proposal) => ({ ...result, [proposal.state]: result[proposal.state] + 1 }),
    { proposed: 0, accepted: 0, rejected: 0, stale: 0 },
  );
  const sourceWarning = structure.sourceStatus === 'changed'
    ? 'The imported source changed. Rediscover structure before making further structural changes.'
    : structure.sourceStatus === 'changed-after-apply'
      ? 'The imported source changed after Apply. The existing manuscript remains authoritative.'
      : null;
  const anchorWarning = overlappingProposalIds.length > 0
    ? 'Some current proposal ranges overlap. Their source is shown once as ordinary read-only text.'
    : invalidProposalIds.length > 0
      ? 'Some proposal anchors are not valid for the current source and are shown as ordinary read-only text.'
      : null;
  let lineStart = 0;
  return (
    <section
      className="stage19-imported-manuscript"
      aria-label="Imported manuscript structure review"
      data-imported-manuscript-preview="true"
    >
      <header className="stage19-imported-manuscript__header">
        <div>
          <span className="stage19-spine__eyebrow">Imported manuscript — structure review</span>
          <h2>Imported manuscript — structure review</h2>
          <p>Read-only until accepted structure is applied.</p>
        </div>
        <dl className="stage19-imported-manuscript__metadata">
          <div><dt>Source</dt><dd>{structure.document.source.fileName}</dd></div>
          <div><dt>Characters</dt><dd>{structure.document.source.normalizedLength.toLocaleString()}</dd></div>
          <div><dt>Proposals</dt><dd>{counts.proposed} proposed · {counts.accepted} accepted · {counts.rejected} rejected · {counts.stale} stale</dd></div>
        </dl>
      </header>
      {sourceWarning ? <p className="stage19-imported-manuscript__warning" role="status">{sourceWarning}</p> : null}
      {anchorWarning ? <p className="stage19-imported-manuscript__warning" role="status">{anchorWarning}</p> : null}
      <div className="stage19-imported-manuscript__source" aria-label="Imported manuscript source" data-imported-manuscript-source="true">
        {sourceLines.map((line, index) => {
          const currentLineStart = lineStart;
          lineStart += line.length + 1;
          return (
            <span key={`${currentLineStart}:${index}`}>
              <ImportedManuscriptSourceLine
                line={line}
                lineStart={currentLineStart}
                ranges={ranges}
                selectedProposalId={model.selectedManuscriptProposalId}
                selectProposal={actions.selectManuscriptStructureProposal}
              />
              {index < sourceLines.length - 1 ? '\n' : null}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function shouldShowImportedManuscriptPreview(model: Stage19WritingSpineViewModel): boolean {
  const structure = model.manuscriptStructure;
  const project = model.snapshot?.project;
  return Boolean(
    project &&
    project.units.length === 0 &&
    structure?.availability === 'ready' &&
    structure.sourceStatus !== 'changed-after-apply' &&
    structure.sourceText.length > 0 &&
    structure.document.proposals.some((proposal) => !proposal.appliedUnitId),
  );
}

function structureProposalStateLabel(proposal: ManuscriptStructureProposalV1): string {
  if (proposal.appliedUnitId) return 'Applied';
  if (proposal.state === 'accepted') return 'Accepted';
  if (proposal.state === 'rejected') return 'Rejected';
  if (proposal.state === 'stale') return 'Stale — rediscover';
  return 'Needs decision';
}

function structureProposalStateMarker(proposal: ManuscriptStructureProposalV1): string {
  if (proposal.appliedUnitId) return '✓';
  if (proposal.state === 'accepted') return '●';
  if (proposal.state === 'rejected') return '×';
  if (proposal.state === 'stale') return '!';
  return '○';
}

interface StructureSplitBoundary {
  readonly offset: number;
  readonly ordinal: number;
  readonly preview: string;
}

function getStructureSplitBoundaries(
  sourceText: string,
  proposal: ManuscriptStructureProposalV1,
): readonly StructureSplitBoundary[] {
  const { selectionStart, selectionEnd } = proposal.anchor;
  return Array.from(
    sourceText.slice(selectionStart, selectionEnd).matchAll(/\n/g),
    (match, index) => {
      const offset = selectionStart + (match.index ?? 0) + 1;
      const preview = sourceText.slice(offset).split('\n')[0]?.replace(/\s+/g, ' ').trim() ?? '';
      return { offset, ordinal: index + 1, preview: preview.slice(0, 72) || '(blank paragraph)' };
    },
  ).filter(({ offset }) => offset > selectionStart && offset < selectionEnd);
}

function getStructureBoundaryOffsets(
  sourceText: string,
  proposal: ManuscriptStructureProposalV1,
): readonly number[] {
  return [
    proposal.anchor.selectionStart,
    ...getStructureSplitBoundaries(sourceText, proposal).map((boundary) => boundary.offset),
    proposal.anchor.selectionEnd,
  ];
}

function structureMutationDisabledReason(
  structure: ManuscriptStructureSnapshotV1,
  proposal: ManuscriptStructureProposalV1,
  loading: boolean,
): string | null {
  if (loading) return 'A structure change is already running.';
  if (proposal.appliedUnitId) return 'Applied sections are immutable.';
  if (proposal.state === 'stale') return 'Stale sections require Rediscover before editing.';
  if (structure.sourceStatus !== 'current') return 'The imported source is not current.';
  return null;
}

interface SelectedStructureControlPanelProps {
  readonly structure: ManuscriptStructureSnapshotV1;
  readonly proposal: ManuscriptStructureProposalV1;
  readonly orderedProposals: readonly ManuscriptStructureProposalV1[];
  readonly selectedIndex: number;
  readonly model: Stage19WritingSpineViewModel;
  readonly actions: Stage19WritingSpineViewActions;
}

function SelectedStructureControlPanel({
  structure,
  proposal,
  orderedProposals,
  selectedIndex,
  model,
  actions,
}: SelectedStructureControlPanelProps): JSX.Element {
  const [renameValue, setRenameValue] = useState(proposal.label);
  const [splitBoundary, setSplitBoundary] = useState<number | ''>('');
  const [boundaryLabel, setBoundaryLabel] = useState('');
  const splitBoundaries = getStructureSplitBoundaries(structure.sourceText, proposal);
  const boundaryOffsets = getStructureBoundaryOffsets(structure.sourceText, proposal);
  const previous = orderedProposals[selectedIndex - 1] ?? null;
  const next = orderedProposals[selectedIndex + 1] ?? null;
  const mutationDisabledReason = structureMutationDisabledReason(structure, proposal, model.manuscriptStructureLoading);
  const canMutate = mutationDisabledReason === null;
  const canRename = canMutate;
  const canSplit = canMutate && splitBoundaries.length > 0 && splitBoundary !== '';
  const canPin = canMutate && model.structureBoundaryStart !== null && model.structureBoundaryEnd !== null && boundaryLabel.trim().length > 0;
  const startBoundaryValid = model.structureBoundaryStart !== null && boundaryOffsets.includes(model.structureBoundaryStart);
  const endBoundaryValid = model.structureBoundaryEnd !== null && boundaryOffsets.includes(model.structureBoundaryEnd);
  const mergeable = (candidate: ManuscriptStructureProposalV1 | null): boolean => Boolean(
    candidate &&
    canMutate &&
    !candidate.appliedUnitId &&
    candidate.state !== 'stale',
  );

  useEffect(() => {
    setRenameValue(proposal.label);
    setSplitBoundary('');
    setBoundaryLabel('');
  }, [proposal.id, proposal.label]);

  const stageMove = (direction: -1 | 1) => {
    const targetIndex = selectedIndex + direction;
    if (targetIndex < 0 || targetIndex >= orderedProposals.length) return;
    const target = orderedProposals[targetIndex]!;
    if (!canMutate || target.appliedUnitId || target.state === 'stale') return;
    const orderedIds = orderedProposals.map((candidate) => candidate.id);
    [orderedIds[selectedIndex], orderedIds[targetIndex]] = [orderedIds[targetIndex]!, orderedIds[selectedIndex]!];
    actions.stageStructureOrder(orderedIds);
  };

  return (
    <section className="stage19-manuscript-structure__selected" aria-label="Selected section controls">
      <div className="stage19-manuscript-structure__selected-heading">
        <div>
          <span className="stage19-spine__eyebrow">Selected section</span>
          <h4>{proposal.label}</h4>
        </div>
        <span className="stage19-manuscript-structure__state-marker" aria-label={structureProposalStateLabel(proposal)}>{structureProposalStateMarker(proposal)}</span>
      </div>
      <dl className="stage19-manuscript-structure__selected-summary">
        <div><dt>Order</dt><dd>{selectedIndex + 1} of {orderedProposals.length}</dd></div>
        <div><dt>State</dt><dd>{structureProposalStateLabel(proposal)}</dd></div>
        <div><dt>Provenance</dt><dd>{proposal.provenance === 'heading' ? 'Detected from a Markdown heading.' : `Detected from ${proposal.provenance} structure.`}</dd></div>
      </dl>
      {mutationDisabledReason ? <p className="stage19-manuscript-structure__disabled-reason" role="status">{mutationDisabledReason}</p> : null}
      <div className="stage19-manuscript-structure__decision-actions">
        <button type="button" onClick={() => void actions.acceptStructureProposal(proposal.id)} disabled={!canMutate || proposal.state === 'accepted'}>Accept</button>
        <button type="button" onClick={() => void actions.rejectStructureProposal(proposal.id)} disabled={!canMutate || proposal.state === 'rejected'}>Reject</button>
      </div>
      <details className="stage19-manuscript-structure__more-actions">
        <summary>More section actions</summary>
        <div className="stage19-manuscript-structure__more-content">
          <fieldset className="stage19-manuscript-structure__action-group">
            <legend>Rename</legend>
            <label htmlFor={`structure-section-name-${proposal.id}`}>Section name</label>
            <input id={`structure-section-name-${proposal.id}`} value={renameValue} maxLength={240} onChange={(event) => setRenameValue(event.target.value)} disabled={!canRename} />
            <div className="stage19-manuscript-structure__actions">
              <button type="button" onClick={() => void actions.renameStructureProposal(proposal.id, renameValue)} disabled={!canRename || renameValue.trim().length === 0}>Save name</button>
              <button type="button" onClick={() => setRenameValue(proposal.label)} disabled={!canRename}>Cancel</button>
            </div>
          </fieldset>
          <fieldset className="stage19-manuscript-structure__action-group">
            <legend>Split</legend>
            <label htmlFor={`structure-split-${proposal.id}`}>Split selected section at</label>
            <select id={`structure-split-${proposal.id}`} value={splitBoundary} onChange={(event) => setSplitBoundary(event.target.value ? Number(event.target.value) : '')} disabled={!canMutate || splitBoundaries.length === 0}>
              <option value="">{splitBoundaries.length > 0 ? 'Choose a paragraph boundary' : 'No valid internal boundary'}</option>
              {splitBoundaries.map((boundary) => <option key={boundary.offset} value={boundary.offset}>Paragraph {boundary.ordinal} — {boundary.preview}</option>)}
            </select>
            {splitBoundaries.length === 0 ? <p className="stage19-manuscript-structure__disabled-reason">This section has no valid internal paragraph boundary.</p> : null}
            <button type="button" onClick={() => typeof splitBoundary === 'number' && void actions.splitStructureProposal(proposal.id, splitBoundary)} disabled={!canSplit}>Split section</button>
          </fieldset>
          <fieldset className="stage19-manuscript-structure__action-group">
            <legend>Merge</legend>
            <div className="stage19-manuscript-structure__actions">
              {previous && mergeable(previous) ? <button type="button" onClick={() => void actions.mergeStructureProposals([previous.id, proposal.id])}>Merge with previous: {previous.label}</button> : null}
              {next && mergeable(next) ? <button type="button" onClick={() => void actions.mergeStructureProposals([proposal.id, next.id])}>Merge with next: {next.label}</button> : null}
            </div>
            {!previous && !next ? <p className="stage19-manuscript-structure__disabled-reason">No adjacent section is available.</p> : null}
          </fieldset>
          <fieldset className="stage19-manuscript-structure__action-group">
            <legend>Reorder</legend>
            <div className="stage19-manuscript-structure__actions">
              <button type="button" onClick={() => stageMove(-1)} disabled={!canMutate || !previous || Boolean(previous.appliedUnitId) || previous.state === 'stale'}>Move up</button>
              <button type="button" onClick={() => stageMove(1)} disabled={!canMutate || !next || Boolean(next.appliedUnitId) || next.state === 'stale'}>Move down</button>
            </div>
          </fieldset>
          <details className="stage19-manuscript-structure__advanced">
            <summary>Advanced boundary tools</summary>
            <div className="stage19-manuscript-structure__advanced-content">
              <p>Advanced: create a custom structural range. Most manuscripts do not need this.</p>
              <label htmlFor={`structure-boundary-start-${proposal.id}`}>Start boundary</label>
              <select id={`structure-boundary-start-${proposal.id}`} value={startBoundaryValid ? String(model.structureBoundaryStart) : ''} onChange={(event) => event.target.value && actions.selectStructureBoundary(Number(event.target.value), 'start')} disabled={!canMutate}>
                <option value="">Choose a start boundary</option>
                {boundaryOffsets.map((offset, index) => <option key={offset} value={offset}>{index === 0 ? 'Section start' : index === boundaryOffsets.length - 1 ? 'Section end' : `Internal boundary ${index}`}</option>)}
              </select>
              <label htmlFor={`structure-boundary-end-${proposal.id}`}>End boundary</label>
              <select id={`structure-boundary-end-${proposal.id}`} value={endBoundaryValid ? String(model.structureBoundaryEnd) : ''} onChange={(event) => event.target.value && actions.selectStructureBoundary(Number(event.target.value), 'end')} disabled={!canMutate}>
                <option value="">Choose an end boundary</option>
                {boundaryOffsets.map((offset, index) => <option key={offset} value={offset}>{index === 0 ? 'Section start' : index === boundaryOffsets.length - 1 ? 'Section end' : `Internal boundary ${index}`}</option>)}
              </select>
              <label htmlFor={`structure-boundary-label-${proposal.id}`}>Boundary label</label>
              <input id={`structure-boundary-label-${proposal.id}`} value={boundaryLabel} maxLength={240} onChange={(event) => setBoundaryLabel(event.target.value)} disabled={!canMutate} />
              <button type="button" onClick={() => void actions.pinSelectedStructureBoundary(boundaryLabel.trim())} disabled={!canPin || !startBoundaryValid || !endBoundaryValid}>Pin boundary</button>
              {model.structureBoundaryStart !== null && model.structureBoundaryEnd !== null && (!startBoundaryValid || !endBoundaryValid || model.structureBoundaryStart >= model.structureBoundaryEnd) ? <p className="stage19-manuscript-structure__disabled-reason" role="status">Choose a valid start before the end. The invalid range will not be pinned.</p> : null}
            </div>
          </details>
        </div>
      </details>
    </section>
  );
}

export function ManuscriptStructureView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  const structure = model.manuscriptStructure;
  const proposals = structure?.document.proposals ?? [];
  const pageSize = 12;
  const stagedOrder = model.manuscriptStructureOrder ?? proposals.map((proposal) => proposal.id);
  const proposalById = new Map(proposals.map((proposal) => [proposal.id, proposal]));
  const orderedProposals = stagedOrder.map((proposalId) => proposalById.get(proposalId)).filter((proposal): proposal is typeof proposals[number] => Boolean(proposal));
  const pageCount = Math.max(1, Math.ceil(orderedProposals.length / pageSize));
  const page = Math.min(model.manuscriptStructurePage, pageCount - 1);
  const pageProposals = orderedProposals.slice(page * pageSize, (page + 1) * pageSize);
  const acceptedCount = proposals.filter((proposal) => proposal.state === 'accepted').length;
  const unappliedAcceptedCount = proposals.filter((proposal) => proposal.state === 'accepted' && !proposal.appliedUnitId).length;
  const selectedProposalId = model.selectedManuscriptProposalId;
  const selectedProposal = orderedProposals.find((proposal) => proposal.id === selectedProposalId) ?? null;
  const selectedProposalIndex = selectedProposal ? orderedProposals.findIndex((proposal) => proposal.id === selectedProposal.id) : -1;
  const decisionCounts = [
    `${proposals.filter((proposal) => proposal.state === 'proposed' && !proposal.appliedUnitId).length} needs decision`,
    `${acceptedCount} accepted`,
    `${proposals.filter((proposal) => proposal.state === 'rejected').length} rejected`,
    `${proposals.filter((proposal) => proposal.state === 'stale').length} stale`,
    `${proposals.filter((proposal) => proposal.appliedUnitId).length} applied`,
  ];
  return (
    <details
      className="stage19-manuscript-structure"
      aria-label="Manuscript structure intake"
      onToggle={(event) => {
        if (!event.currentTarget.open && model.manuscriptStructureOrder) {
          actions.cancelStructureOrder();
        }
      }}
    >
      <summary><span>Structure</span>{structure ? <span className="stage19-manuscript-structure__summary">{acceptedCount} accepted / {proposals.length} proposals</span> : <span>Optional Markdown intake</span>}</summary>
      <div className="stage19-manuscript-structure__workspace">
        <div className="stage19-manuscript-structure__heading">
          <div><span className="stage19-spine__eyebrow">Program 5 intake</span><h3>Structure</h3></div>
          <div className="stage19-manuscript-structure__actions">
            <button type="button" onClick={() => void actions.importManuscriptStructure()} disabled={model.manuscriptStructureLoading}>Import Markdown</button>
            {structure ? <button type="button" onClick={() => void actions.discoverManuscriptStructure()} disabled={model.manuscriptStructureLoading || structure.availability !== 'ready' || structure.sourceStatus !== 'current'}>Rediscover</button> : null}
          </div>
        </div>
        <p className="stage19-manuscript-structure__boundary">The central manuscript is the source of truth. Structure decisions stay provisional until explicitly applied to Units.</p>
        {model.manuscriptStructureNotice ? <p className="stage19-manuscript-structure__notice" role="status">{model.manuscriptStructureNotice}</p> : null}
        {structure?.message ? <p className="stage19-manuscript-structure__notice" role="status">{structure.message}</p> : null}
        {model.manuscriptStructureLoading && !structure ? <p>Loading structure…</p> : null}
        {structure?.availability === 'ready' ? (
          <>
            <div className="stage19-manuscript-structure__summary"><span>{structure.document.source.fileName}</span><span>{structure.document.source.normalizedLength.toLocaleString()} characters</span></div>
            <div className="stage19-manuscript-structure__decision-summary" aria-label="Structure decision counts">
              <span>{decisionCounts.join(' · ')}</span>
            </div>
            {selectedProposal && selectedProposalIndex >= 0 ? <SelectedStructureControlPanel
              structure={structure}
              proposal={selectedProposal}
              orderedProposals={orderedProposals}
              selectedIndex={selectedProposalIndex}
              model={model}
              actions={actions}
            /> : <p className="stage19-manuscript-structure__notice" role="status">Select a section to review its structural controls.</p>}
            <ol className="stage19-manuscript-structure__proposals" aria-label="Structure proposals">
              {pageProposals.map((proposal, pageIndex) => {
                const index = page * pageSize + pageIndex;
                const selected = proposal.id === selectedProposalId;
                return <li
                  key={proposal.id}
                  className={`is-${proposal.state} ${proposal.appliedUnitId ? 'is-applied' : ''} ${selected ? 'is-selected' : ''}`}
                  data-structure-proposal="true"
                  data-structure-proposal-id={proposal.id}
                  aria-current={selected ? 'true' : undefined}
                >
                  <span className="stage19-manuscript-structure__proposal-order" aria-label={`Proposal order ${index + 1}`}>{index + 1}</span>
                  <span className="stage19-manuscript-structure__state-marker" aria-hidden="true">{structureProposalStateMarker(proposal)}</span>
                  <button
                    type="button"
                    className="stage19-manuscript-structure__proposal-select"
                    aria-pressed={selected}
                    onClick={() => actions.selectManuscriptStructureProposal(proposal.id)}
                  >
                    <strong>{proposal.label}</strong>
                    <span>{structureProposalStateLabel(proposal)}</span>
                  </button>
                </li>;
              })}
            </ol>
            {model.manuscriptStructureOrder ? <div className="stage19-manuscript-structure__actions" aria-label="Staged structure order"><strong>Section order has unsaved changes.</strong><button type="button" onClick={() => void actions.saveStructureOrder()} disabled={model.manuscriptStructureLoading}>Save order</button><button type="button" onClick={actions.cancelStructureOrder} disabled={model.manuscriptStructureLoading}>Cancel order</button></div> : null}
            <nav className="stage19-manuscript-structure__pagination" aria-label="Structure pages"><button type="button" onClick={() => model.manuscriptStructurePage > 0 && actions.setManuscriptStructurePage(model.manuscriptStructurePage - 1)} disabled={page === 0}>Previous</button><span>Page {page + 1} of {pageCount}</span><button type="button" onClick={() => model.manuscriptStructurePage < pageCount - 1 && actions.setManuscriptStructurePage(model.manuscriptStructurePage + 1)} disabled={page >= pageCount - 1}>Next</button></nav>
            <button type="button" onClick={() => void actions.applyManuscriptStructure()} disabled={model.manuscriptStructureLoading || unappliedAcceptedCount === 0 || structure.sourceStatus !== 'current'}>Apply accepted structure to Units</button>
          </>
        ) : null}
      </div>
    </details>
  );
}

function ManuscriptBinderView(props: Stage19WritingSpineViewProps): JSX.Element {
  const { model, actions } = props;
  const { dirtyUnitIds, multiSelectMode, recoveryBlocksEditing, renameTitle, selectedStoryItemIds, snapshot, storyRailHelpOpen, unitAdvancedId, unitEditingId } = model;
  const advancedUnit = snapshot.project?.units.find((unit) => unit.id === unitAdvancedId) ?? null;
  const outlineItems = model.livingOutline?.document.items ?? [];
  const unplacedCount = outlineItems.filter((item) => !item.manuscriptUnitId).length;
  const hasSelectedPassage = Boolean(model.aiSelection?.selectedText.trim());
  const creationContext = hasSelectedPassage
    ? `Selected passage in ${model.activeUnit?.displayTitle ?? 'the current writing'}`
    : model.activeUnit
      ? `Current position in ${model.activeUnit.displayTitle}`
      : 'No Unit selected; new Notes remain unlinked';
  if (model.focusMode || !snapshot.project) return <></>;
  return (
    <aside className="stage19-spine__binder" aria-label="Story rail">
      <ManuscriptStructureView {...props} />
      <div className="stage19-living-outline__heading stage19-story-rail__heading">
        <div><span className="stage19-spine__sr-only">Story contents</span><span className="stage19-living-outline__count" aria-label={`${snapshot.project.units.length} Units and ${outlineItems.length} Notes`}>{snapshot.project.units.length + outlineItems.length}</span></div>
        <div className="stage19-story-rail__heading-actions">
          <button
            type="button"
            className="stage19-story-rail__help"
            aria-label="Story rail help"
            aria-expanded={storyRailHelpOpen}
            title="Explain Units, Notes, and rail controls"
            onClick={actions.toggleStoryRailHelp}
          >?</button>
          <button
            type="button"
            className={`stage19-story-rail__multi-select ${multiSelectMode ? 'is-active' : ''}`}
            aria-pressed={multiSelectMode}
            onClick={actions.toggleMultiSelectMode}
          >{multiSelectMode ? 'Done selecting' : 'Select multiple'}</button>
          <div className="stage19-story-rail__add-details">
            <button
              type="button"
              className="stage19-living-outline__add"
              aria-label="Add story content"
              aria-expanded={model.storyRailAddMenuOpen}
              aria-controls="stage19-story-rail-add-menu"
              title="Add a Unit or Note"
              onClick={() => actions.setStoryRailAddMenuOpen(!model.storyRailAddMenuOpen)}
            ><span aria-hidden="true">+</span></button>
            <div id="stage19-story-rail-add-menu" className="stage19-story-rail__add-menu" role="group" aria-label="Add story content options" hidden={!model.storyRailAddMenuOpen}>
              <button
                type="button"
                onClick={() => {
                  actions.setStoryRailAddMenuOpen(false);
                  void actions.createUnit();
                }}
                disabled={recoveryBlocksEditing}
              >Unit</button>
              <button
                type="button"
                onClick={() => {
                  actions.setStoryRailAddMenuOpen(false);
                  void actions.createOutlineItem();
                }}
                disabled={model.livingOutlineLoading || model.livingOutline?.availability !== 'ready'}
              >Note</button>
              <button type="button" onClick={() => actions.setStoryRailAddMenuOpen(false)}>Cancel</button>
              <p>Units hold manuscript prose. Notes hold lightweight planning thoughts.</p>
            </div>
          </div>
          <button
            type="button"
            className="stage19-living-outline__remove"
            aria-label="Delete selected story item"
            title="Delete the selected Unit or Note"
            onClick={() => void actions.deleteSelectedStoryItem()}
            disabled={recoveryBlocksEditing || !snapshot.activeUnitId && !model.selectedOutlineItemId}
          ><span aria-hidden="true">−</span></button>
        </div>
      </div>
      {storyRailHelpOpen ? <section className="stage19-story-rail__help-panel" role="note" aria-label="Story rail help">
        <strong>How the story rail works</strong>
        <p><b>Unit</b> is a piece of your manuscript. <b>Note</b> is a quiet planning thought beside it.</p>
        <p>Notes can belong to a Unit or stay unlinked until you choose a place. Use <b>+</b> to add, <b>−</b> to delete the selected item, and <b>More</b> for extra details.</p>
        <p>Select multiple lets you compare Units and Notes. It never changes your prose.</p>
      </section> : null}
      <p className="stage19-living-outline__context">{creationContext}</p>
      {/* The ? help control owns the durable explanation so the rail stays quiet while writing. */}
      {model.livingOutlineNotice ? <p className="stage19-living-outline__notice" role="status">{model.livingOutlineNotice}</p> : null}
      <ol className="stage19-story-rail__sections" aria-label="Story order">
        {snapshot.project.units.map((unit) => (
          <li key={unit.id} className={unit.id === snapshot.activeUnitId ? 'is-current-writing' : ''}>
            <div className={`stage19-story-rail__unit-row ${unit.id === snapshot.activeUnitId ? 'is-derived-context' : ''} ${selectedStoryItemIds.includes(unit.id) ? 'is-multi-selected' : ''}`} onContextMenu={(event) => {
              event.preventDefault();
              actions.openUnitOptions(unit.id);
            }}>
              <span className="stage19-story-rail__unit-order" aria-hidden="true">{String(unit.order).padStart(2, '0')}</span>
              {multiSelectMode ? <label className="stage19-story-rail__selection">
                <input
                  type="checkbox"
                  aria-label={`Select Unit ${unit.displayTitle}`}
                  checked={selectedStoryItemIds.includes(unit.id)}
                  onChange={() => actions.toggleStorySelection(unit.id)}
                />
              </label> : null}
              {unitEditingId === unit.id ? (
                <form className="stage19-story-rail__unit-rename" onSubmit={(event) => {
                  event.preventDefault();
                  void actions.renameUnit(unit.id);
                }}>
                  <label className="stage19-spine__sr-only" htmlFor={`stage19-unit-title-${unit.id}`}>Unit title</label>
                  <input
                    ref={focusOutlineTitleInput}
                    id={`stage19-unit-title-${unit.id}`}
                    aria-label={`Title for ${unit.displayTitle}`}
                    value={renameTitle}
                    onChange={(event) => actions.setRenameTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') actions.cancelUnitEdit();
                    }}
                    placeholder="Untitled Unit"
                    disabled={recoveryBlocksEditing}
                  />
                  <button type="submit" disabled={recoveryBlocksEditing}>Save</button>
                  <button type="button" onClick={actions.cancelUnitEdit}>Cancel</button>
                </form>
              ) : (
                <button
                  type="button"
                  className="stage19-story-rail__unit-title"
                  aria-label={`${String(unit.order).padStart(2, '0')} ${unit.displayTitle}`}
                  aria-current={unit.id === snapshot.activeUnitId ? 'page' : undefined}
                  title="Double-click or press F2 to rename"
                  onClick={() => { actions.clearOutlineSelection(); void actions.selectUnit(unit.id); }}
                  onDoubleClick={() => actions.editUnit(unit.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'F2') {
                      event.preventDefault();
                      actions.editUnit(unit.id);
                    }
                  }}
                  disabled={recoveryBlocksEditing}
                >{unit.displayTitle}</button>
              )}
              {dirtyUnitIds.has(unit.id) ? <span className="stage19-story-rail__dirty">Unsaved</span> : null}
              <button type="button" className="stage19-living-outline__more" aria-label={`More options for Unit ${unit.displayTitle}`} aria-expanded={unitAdvancedId === unit.id} onClick={() => actions.openUnitOptions(unit.id)}>More</button>
            </div>
            <LivingOutlineView {...props} placementUnitId={unit.id} showChrome={false} showEmpty={false} showPreview={false} />
          </li>
        ))}
      </ol>
      {snapshot.project.units.length === 0 && outlineItems.length === 0 ? (
        <p className="stage19-spine__empty">Nothing has been divided yet. Start writing, or use + to add a Unit or Note.</p>
      ) : null}
      {advancedUnit ? (
        <section className="stage19-spine__unit-actions stage19-story-rail__unit-advanced" aria-label={`More options for Unit ${advancedUnit.displayTitle}`}>
          <div className="stage19-living-outline__advanced-heading">
            <div><span className="stage19-spine__eyebrow">Unit</span><h3>{advancedUnit.displayTitle}</h3></div>
            <button type="button" onClick={actions.closeUnitOptions}>Close</button>
          </div>
          <p className="stage19-living-outline__explanation">This is accepted manuscript writing. Notes cannot reorder or rewrite it.</p>
          <p className="stage19-living-outline__explanation">Double-click the section title to rename it. Use − in the Story rail to delete it.</p>
        </section>
      ) : null}
      {unplacedCount > 0 ? <section
        className="stage19-story-rail__unplaced"
        aria-label="Unlinked notes"
      >
        <h3 className="stage19-story-rail__unplaced-heading">Not placed yet</h3>
        <LivingOutlineView {...props} placementUnitId={null} showChrome={false} showEmpty={false} showPreview={false} />
      </section> : null}
      {model.livingOutline?.availability === 'ready' ? (
        <details className="stage19-living-outline__preview">
          <summary>Compare the story plan with the manuscript</summary>
          <p>Preview only. Moving this plan never moves your written pages.</p>
          {model.projectedWritingOrder.length > 0
            ? <ol>{model.projectedWritingOrder.map(({ item, unit }) => <li key={item.id}>{unit.displayTitle}</li>)}</ol>
            : <p>No Notes are placed with writing yet.</p>}
        </details>
      ) : null}
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
            <button
              type="button"
              onClick={() => void actions.configureAiCredential()}
              disabled={!model.aiCredential}
              title={model.aiCredential ? 'Use this API key for the current session only' : 'Enter a session API key first'}
            >
              Set session key
            </button>
            <button
              type="button"
              onClick={() => void actions.clearAiCredential()}
              disabled={!model.aiCredentialConfigured}
              title={model.aiCredentialConfigured ? 'Remove the current session API key' : 'No session credential to clear'}
            >
              Clear key
            </button>
          </div>
          <div className="stage19-ai__selection">
            <p>{model.aiSelection?.selectedText
              ? `${selectedCharacters.toLocaleString()} non-whitespace characters selected`
              : 'Select 200–12,000 non-whitespace characters in the manuscript editor.'}</p>
            <button
              type="button"
              onClick={() => void actions.prepareAiCritique()}
              disabled={!model.aiSelection || !selectionIsValid || model.aiState?.status === 'executing'}
              title={!model.aiSelection
                ? 'Select 200–12,000 non-whitespace characters first'
                : !selectionIsValid
                  ? 'The selected passage must contain 200–12,000 non-whitespace characters'
                  : model.aiState?.status === 'executing'
                    ? 'The current critique request is still running'
                    : 'Review the exact text and cost before sending'}
            >
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
      {model.critiqueReviewState?.availability === 'available' ? (
        <button type="button" onClick={() => void actions.openReviewWorkspace()}>
          Open Review in Command Center
        </button>
      ) : null}
      {model.feedbackNoteNotice ? <p className="stage19-ai__notice" role="status">{model.feedbackNoteNotice}</p> : null}
    </section>
  );
}

function ManuscriptCanvasView(props: Stage19WritingSpineViewProps): JSX.Element {
  const { model, actions } = props;
  const { activeUnit, snapshot } = model;
  const units = snapshot.project?.units ?? [];
  const importedManuscriptPreview = shouldShowImportedManuscriptPreview(model);

  return (
    <section className="stage19-spine__editor-card" aria-label="Manuscript editor">
      {activeUnit ? (
        <>
          {!model.focusMode ? (
            <>
              <div className="stage19-spine__editor-header">
                <div><span className="stage19-spine__eyebrow">Manuscript</span><h2>One continuous story</h2></div>
                <button type="button" onClick={() => void actions.saveUnit(activeUnit.id)} disabled={model.recoveryBlocksEditing || !model.activeDirty || snapshot.saveState.status === 'saving'}>
                  {snapshot.saveState.status === 'saving' ? 'Saving…' : 'Save'}
                </button>
              </div>
              <p className="stage19-spine__shortcut">Scroll through the whole story. Click any section to write there. Ctrl+S saves the section you are writing.</p>
            </>
          ) : null}
          <div className="stage19-continuous-manuscript" aria-label="Continuous manuscript">
            {units.map((unit, index) => {
              const active = unit.id === activeUnit.id;
              const body = model.buffers[unit.id] ?? '';
              return (
                <section
                  key={unit.id}
                  id={`stage19-manuscript-unit-${unit.id}`}
                  data-manuscript-unit-id={unit.id}
                  data-manuscript-unit-anchor="true"
                  tabIndex={-1}
                  className={`stage19-continuous-manuscript__section ${active ? 'is-active' : ''}`}
                  aria-label={`Written section ${unit.displayTitle}`}
                >
                  <button
                    type="button"
                    className="stage19-continuous-manuscript__heading"
                    aria-current={active ? 'location' : undefined}
                    aria-label={`Write here: ${unit.displayTitle}, section ${index + 1}`}
                    onClick={() => void actions.activateUnitInStream(unit.id)}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{unit.displayTitle}</strong>
                    {model.dirtyUnitIds.has(unit.id) ? <em>Unsaved</em> : null}
                  </button>
                  {active ? (
                    <div className="stage19-spine__editor">
                      <DraftEditor
                        key={`${snapshot.project?.projectId ?? 'no-project'}:${snapshot.generation}:${unit.id}`}
                        value={body}
                        onChange={(nextBody) => actions.changeBuffer(unit.id, nextBody)}
                        onSave={(nextBody) => void actions.saveUnit(unit.id, nextBody)}
                        onSelectionChange={actions.changeAiSelection}
                        selectionRestore={
                          model.sourceReturnRequest?.status === 'exact' &&
                          model.sourceReturnRequest.anchor?.unitId === unit.id
                            ? {
                                requestId: model.sourceReturnRequest.requestId,
                                selectionStart: model.sourceReturnRequest.anchor.selectionStart,
                                selectionEnd: model.sourceReturnRequest.anchor.selectionEnd,
                                selectionFingerprint: model.sourceReturnRequest.anchor.selectionFingerprint,
                              }
                            : null
                        }
                        onSelectionRestoreResult={actions.sourceSelectionRestoreResult}
                        readOnly={model.recoveryBlocksEditing}
                        placeholder="Start writing…"
                        ariaLabel={`Manuscript editor: ${unit.displayTitle}`}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="stage19-continuous-manuscript__prose"
                      aria-label={`Write in ${unit.displayTitle}`}
                      onClick={() => void actions.activateUnitInStream(unit.id)}
                    >
                      {body || 'This section is empty. Click to begin writing.'}
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        </>
      ) : importedManuscriptPreview ? (
        <ImportedManuscriptPreviewView {...props} />
      ) : (
        <div className="stage19-spine__empty-state"><h2>No manuscript unit selected</h2><p>Create or select a unit from the binder.</p></div>
      )}
    </section>
  );
}

const WRITING_RAIL_LABELS: Record<Stage19WritingRail, {
  readonly shortLabel: string;
  readonly accessibleLabel: string;
}> = {
  top: { shortLabel: 'Project Tools', accessibleLabel: 'Project Tools' },
  left: { shortLabel: 'Story', accessibleLabel: 'Story' },
  right: { shortLabel: 'Review', accessibleLabel: 'Review' },
  bottom: { shortLabel: 'Writing Session', accessibleLabel: 'Writing Session' },
};

function WritingEdgeControlsView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element | null {
  if (model.focusMode) return null;
  const availableRails = (Object.keys(WRITING_RAIL_LABELS) as Stage19WritingRail[])
    .filter((rail) => model.snapshot.project !== null || rail !== 'bottom');
  return (
    <nav className="stage19-writing-shell__edge-controls" aria-label="Writing Studio edge controls">
      {availableRails.map((rail) => {
        const label = WRITING_RAIL_LABELS[rail];
        const open = model.openWritingRail === rail;
        return (
          <button
            key={rail}
            id={`stage19-writing-edge-${rail}`}
            type="button"
            className={`stage19-writing-shell__edge stage19-writing-shell__edge--${rail} ${open ? 'stage19-spine__sr-only' : ''}`}
            aria-label={`${open ? 'Close' : 'Open'} ${label.accessibleLabel}`}
            title={`${open ? 'Close' : 'Open'} ${label.shortLabel}`}
            aria-expanded={open}
            aria-controls={`stage19-writing-rail-${rail}`}
            onClick={() => actions.toggleWritingRail(rail)}
          >
            <span className="stage19-writing-shell__edge-mark" aria-hidden="true">{open ? '‹' : '›'}</span>
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
      aria-label="Project Tools"
    >
      <WritingRailHeading rail="top" title="Project Tools" actions={actions} />
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
      aria-label="Review"
    >
      <WritingRailHeading rail="right" title="Review" actions={props.actions} />
      <SelectedProseCritiqueView {...props} />
    </aside>
  );
}

function WritingBottomRailView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  const { activeUnit, snapshot } = model;
  return (
    <section
      id="stage19-writing-rail-bottom"
      className="stage19-writing-shell__rail stage19-writing-shell__rail--bottom"
      aria-label="Writing Session"
    >
      <WritingRailHeading rail="bottom" title="Writing Session" actions={actions} />
      <div className="stage19-writing-shell__session-summary">
        <p><strong>Current writing</strong><span>{activeUnit?.displayTitle ?? 'No manuscript unit selected'}</span></p>
        <p><strong>Save state</strong><span>{model.writingSaveSummary}</span></p>
        {activeUnit ? (
          <button
            type="button"
            onClick={() => void actions.saveUnit(activeUnit.id)}
            disabled={model.recoveryBlocksEditing || !model.activeDirty || snapshot.saveState.status === 'saving'}
            title={model.activeDirty ? 'Save the current writing' : 'Nothing is unsaved to save'}
          >
            {snapshot.saveState.status === 'saving' ? 'Saving...' : 'Save current writing'}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function CompanionBarView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element | null {
  const { activeUnit, snapshot } = model;
  if (model.focusMode) return null;
  return (
    <form
      className="stage19-companion-bar"
      aria-label="Local Companion orientation"
      onSubmit={(event) => {
        event.preventDefault();
        void actions.submitCompanionOrientation();
      }}
    >
      <label htmlFor="stage19-companion-prompt">Companion</label>
      <input
        id="stage19-companion-prompt"
        aria-label="Ask Black Skies"
        type="text"
        value={model.companionPrompt}
        onChange={(event) => actions.setCompanionPrompt(event.target.value)}
        placeholder="Ask where you are in this project"
        disabled={!snapshot.project}
        title={snapshot.project ? 'Ask for local orientation within this project' : 'Open a project before asking Companion'}
        maxLength={500}
      />
      <button
        type="submit"
        disabled={!snapshot.project || !model.companionPrompt.trim()}
        title={!snapshot.project
          ? 'Open a project before asking Companion'
          : model.companionPrompt.trim()
            ? 'Ask Companion using local project facts only'
            : 'Enter a question first'}
      >
        Ask
      </button>
      <span className="stage19-companion-bar__scope">
        {snapshot.project
          ? `Local project and current writing only${activeUnit ? `: ${activeUnit.displayTitle}` : ''}. No AI.`
          : 'Open a project to ask. No AI.'}
      </span>
      {model.companionNotice ? <span className="stage19-companion-bar__notice" role="status">{model.companionNotice}</span> : null}
    </form>
  );
}

function CompanionTaskCanvasView({ model, actions }: Stage19WritingSpineViewProps): JSX.Element {
  const result = model.companionResult;
  if (!result) return <></>;
  const heading = result.status === 'available'
    ? 'Here is where you are'
    : result.status === 'not-routed'
      ? 'This request is not routed yet'
      : 'Local orientation is unavailable';
  return (
    <section className="stage19-command-companion" aria-label="Companion orientation result">
      <header className="stage19-command-companion__header">
        <div>
          <span className="stage19-spine__eyebrow">Companion · local orientation</span>
          <h2>{heading}</h2>
          <p>{result.requestLabel}. This is advisory context, not story truth or a recommendation.</p>
        </div>
        <span className={`stage19-command-companion__state stage19-command-companion__state--${result.status}`}>
          {result.status === 'available' ? 'Local facts' : result.status.replace('-', ' ')}
        </span>
      </header>
      {result.sourceFacts.length > 0 ? (
        <dl className="stage19-command-companion__facts">
          {result.sourceFacts.map((fact) => (
            <div key={`${fact.owner}-${fact.label}`}>
              <dt><strong>{fact.owner}</strong><span>{fact.label} · {fact.currentness}</span></dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="stage19-command-companion__limitation">{result.limitationText}</p>
      <div className="stage19-command-companion__actions">
        <button type="button" className="is-primary" onClick={() => void actions.returnToCompanionWriting()}>Return to Writing</button>
        <button type="button" onClick={actions.dismissCompanion}>Dismiss</button>
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
      data-stage19-theme={model.theme}
      data-stage19-writing-rail={model.focusMode ? 'focus' : model.openWritingRail ?? 'closed'}
      data-primary-scroll-container="true"
      role="region"
      aria-label="Writing Studio"
    >
      <div className={`stage19-writing-shell ${model.openWritingRail === 'bottom' && !model.focusMode ? 'has-session-rail' : ''}`}>
      <header className="stage19-writing-shell__topbar">
        {model.focusMode ? (
          <div className="stage19-writing-shell__focus-context">
            <span>{snapshot.project?.title ?? 'Writing Studio'}</span>
            {activeUnit ? <span>{activeUnit.displayTitle}</span> : null}
          </div>
        ) : (
          <div className="stage19-writing-shell__identity">
            <span className="stage19-writing-shell__brand">Black Skies</span>
            <h1 className="stage19-writing-shell__project">{snapshot.project?.title ?? 'Writing Studio'}</h1>
            {activeUnit ? <span className="stage19-writing-shell__location">{activeUnit.displayTitle}</span> : null}
          </div>
        )}
        <div className="stage19-writing-shell__status">
          <span className={`stage19-spine__save-state stage19-spine__save-state--${snapshot.saveState.status}`} role="status">{model.writingSaveSummary}</span>
          {!model.focusMode ? <ThemeSwitchView {...props} /> : null}
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
            aria-label="Story tools"
          >
            <WritingRailHeading rail="left" title="Story" actions={actions} />
            <ManuscriptBinderView {...props} />
          </section>
        ) : null}
        <div className="stage19-writing-shell__canvas" data-manuscript-scroll-owner="true">
          <RecoveryStateView {...props} />
          {snapshot.project
            ? <ManuscriptCanvasView {...props} />
            : <WelcomeView {...props} showProjectLifecycle={model.openWritingRail !== 'top'} />}
        </div>
        {!model.focusMode && model.openWritingRail === 'right' ? <WritingRightRailView {...props} /> : null}
      </div>
      {!model.focusMode && model.openWritingRail === 'bottom' ? <WritingBottomRailView {...props} /> : null}
      <CompanionBarView {...props} />
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
        data-stage19-theme={props.model.theme}
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
      return <main className="stage19-spine stage19-spine--loading" data-stage19-theme={props.model.theme}>Loading local writing session…</main>;
    case 'command-unavailable':
      return <CommandUnavailableView {...props} />;
    case 'command':
      return <CommandCenterView {...props} />;
    default:
      return <WritingStudioView {...props} />;
  }
}
