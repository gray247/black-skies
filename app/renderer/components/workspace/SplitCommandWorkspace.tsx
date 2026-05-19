import type { ReactNode } from "react";

import type { LoadedProject } from "../../../shared/ipc/projectLoader";
import type { CommandRegistryEntry } from "../../commands/commandRegistry";
import { listCommandRegistryEntries } from "../../commands/commandRegistry";
import type { ActiveOutlineV1, StoryUnitV1 } from "../../utils/storyUnits";
import { deriveActiveOutline } from "../../utils/storyUnits";
import StoryNavigationPanel from "./StoryNavigationPanel";

interface SplitCommandWorkspaceProps {
  readonly project: LoadedProject | null;
  readonly activeSceneId: string | null;
  readonly onSelectScene?: (sceneId: string) => void;
  readonly commandCenterCollapsed?: boolean;
  readonly shellStatusNote?: string | null;
  readonly writingStudio: ReactNode;
}

function WritingStudioContractPanel({
  project,
  activeUnit,
}: {
  readonly project: LoadedProject | null;
  readonly activeUnit: StoryUnitV1 | null;
}): JSX.Element {
  const draftCount = project
    ? Object.values(project.drafts).filter((draft) => draft.trim().length > 0).length
    : 0;

  return (
    <section
      className="split-command__panel split-command__panel--primary split-command__writing-contract"
      aria-label="Writing Studio contract"
      data-panel-id="writing-studio-contract"
      data-panel-authority="editor-local"
      data-panel-priority="primary"
    >
      <div className="split-command__panel-heading">
        <div>
          <h3>Writing Studio contract</h3>
          <p>Deterministic writing-side inventory</p>
        </div>
      </div>
      <dl className="split-command__overview-grid">
        <div>
          <dt>Project</dt>
          <dd>{project?.name ?? "No project loaded"}</dd>
        </div>
        <div>
          <dt>Active scene</dt>
          <dd>{activeUnit?.title ?? "None selected"}</dd>
        </div>
        <div>
          <dt>Drafts</dt>
          <dd>{draftCount}</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>Wrapped stable writing surface only</dd>
        </div>
      </dl>
      <p className="split-command__panel-note">
        Writing Studio currently provides deterministic project context, editor-local state, and
        layout affordances. It does not claim AI analysis, output-quality judgment, or
        detached-window behavior.
      </p>
    </section>
  );
}

function WritingWorkspaceSnapshotPanel({
  project,
  outline,
  activeUnit,
}: {
  readonly project: LoadedProject | null;
  readonly outline: ActiveOutlineV1;
  readonly activeUnit: StoryUnitV1 | null;
}): JSX.Element {
  const draftCount = project
    ? Object.values(project.drafts).filter((draft) => draft.trim().length > 0).length
    : 0;

  return (
    <section
      className="split-command__panel split-command__panel--secondary split-command__writing-snapshot"
      aria-label="Writing Workspace snapshot"
      data-panel-id="writing-workspace-snapshot"
      data-panel-authority="editor-local"
      data-panel-priority="secondary"
    >
      <div className="split-command__panel-heading">
        <div>
          <h3>Writing Workspace snapshot</h3>
          <p>Deterministic writer-facing context</p>
        </div>
      </div>
      <dl className="split-command__overview-grid">
        <div>
          <dt>Project</dt>
          <dd>{project?.name ?? "No project loaded"}</dd>
        </div>
        <div>
          <dt>Outline</dt>
          <dd>{outline.label}</dd>
        </div>
        <div>
          <dt>Active scene</dt>
          <dd>{activeUnit?.title ?? "None selected"}</dd>
        </div>
        <div>
          <dt>Drafts</dt>
          <dd>{draftCount}</dd>
        </div>
      </dl>
      <p className="split-command__panel-note">
        Current writing-side support is limited to project context, outline access, and
        editor-local state. Notes, quick insert, and intelligence-driven assistance remain
        deferred.
      </p>
    </section>
  );
}

function NarrativeOverviewPanel({
  project,
  outline,
  activeUnit,
}: {
  readonly project: LoadedProject | null;
  readonly outline: ActiveOutlineV1;
  readonly activeUnit: StoryUnitV1 | null;
}): JSX.Element {
  const acts = project?.outline.acts ?? [];
  const chapters = project?.outline.chapters ?? [];
  const sceneCount = project?.scenes.length ?? 0;

  return (
    <section
      className="split-command__panel split-command__panel--secondary split-command__overview"
      aria-label="Narrative Overview"
      data-panel-id="narrative-overview"
      data-panel-authority="derived"
      data-panel-priority="secondary"
    >
      <div className="split-command__panel-heading">
        <div>
          <h3>Narrative Overview</h3>
          <p>Loaded workspace data only</p>
        </div>
      </div>
      <dl className="split-command__overview-grid">
        <div>
          <dt>Outline</dt>
          <dd>{outline.label}</dd>
        </div>
        <div>
          <dt>Scenes</dt>
          <dd>{sceneCount}</dd>
        </div>
        <div>
          <dt>Story units</dt>
          <dd>{outline.units.length}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{activeUnit?.title ?? "None selected"}</dd>
        </div>
      </dl>
      <p className="split-command__panel-note">
        Outline source: {outline.sourceOutlineId ?? "No outline loaded"}. Acts: {acts.length}. Chapters:{" "}
        {chapters.length}.
      </p>
    </section>
  );
}

function StructureOverviewPanel({
  project,
}: {
  readonly project: LoadedProject | null;
}): JSX.Element {
  const acts = project?.outline.acts ?? [];
  const chapters = project?.outline.chapters ?? [];
  const sceneCount = project?.outline.scenes.length ?? 0;

  return (
    <section
      className="split-command__panel split-command__panel--secondary split-command__overview"
      aria-label="Structure Overview"
      data-panel-id="structure-overview"
      data-panel-authority="derived"
      data-panel-priority="secondary"
    >
      <div className="split-command__panel-heading">
        <div>
          <h3>Structure Overview</h3>
          <p>Loaded outline hierarchy only</p>
        </div>
      </div>
      <dl className="split-command__overview-grid">
        <div>
          <dt>Acts</dt>
          <dd>{acts.length}</dd>
        </div>
        <div>
          <dt>Chapters</dt>
          <dd>{chapters.length}</dd>
        </div>
        <div>
          <dt>Scenes</dt>
          <dd>{sceneCount}</dd>
        </div>
        <div>
          <dt>Outline ID</dt>
          <dd>{project?.outline.outline_id ?? "None loaded"}</dd>
        </div>
      </dl>
      {acts.length > 0 || chapters.length > 0 ? (
        <div className="split-command__panel-note" aria-label="Loaded structure details">
          <strong>Acts</strong> {acts.length > 0 ? acts.join(" / ") : "None loaded"}
          <br />
          <strong>Chapters</strong>{" "}
          {chapters.length > 0 ? chapters.map((chapter) => chapter.title).join(" / ") : "None loaded"}
        </div>
      ) : (
        <p className="split-command__panel-note">
          Scene-only structure loaded. Act and chapter sections will appear when outline data
          includes them.
        </p>
      )}
    </section>
  );
}

function ProjectStatsPanel({
  project,
  outline,
  activeUnit,
}: {
  readonly project: LoadedProject | null;
  readonly outline: ActiveOutlineV1;
  readonly activeUnit: StoryUnitV1 | null;
}): JSX.Element {
  const acts = project?.outline.acts ?? [];
  const chapters = project?.outline.chapters ?? [];
  const draftCount = project ? Object.values(project.drafts).filter((draft) => draft.trim().length > 0).length : 0;

  return (
    <section
      className="split-command__panel split-command__panel--tertiary split-command__overview"
      aria-label="Project Stats"
      data-panel-id="project-stats"
      data-panel-authority="derived"
      data-panel-priority="tertiary"
    >
      <div className="split-command__panel-heading">
        <div>
          <h3>Project Stats</h3>
          <p>Deterministic counts only</p>
        </div>
      </div>
      <dl className="split-command__overview-grid">
        <div>
          <dt>Acts</dt>
          <dd>{acts.length}</dd>
        </div>
        <div>
          <dt>Chapters</dt>
          <dd>{chapters.length}</dd>
        </div>
        <div>
          <dt>Scenes</dt>
          <dd>{outline.units.length}</dd>
        </div>
        <div>
          <dt>Drafts</dt>
          <dd>{draftCount}</dd>
        </div>
      </dl>
      <p className="split-command__panel-note">
        Active scene: {activeUnit?.title ?? "None selected"}. No inferred health, warning, or AI
        analysis is included here.
      </p>
    </section>
  );
}

function GlobalToolsPanel({
  commands,
}: {
  readonly commands: readonly CommandRegistryEntry[];
}): JSX.Element {
  const globalCommands = commands.filter((command) => command.allowedZones.includes("global"));
  const commandCenterCommands = commands.filter((command) =>
    command.allowedZones.includes("command_center"),
  );

  return (
    <section
      className="split-command__panel split-command__panel--tertiary split-command__tools"
      aria-label="Global Tools Metadata"
      data-panel-id="global-tools"
      data-panel-authority="metadata-only"
      data-panel-priority="tertiary"
    >
      <div className="split-command__panel-heading">
        <div>
          <h3>Global Tools Metadata</h3>
          <p>Metadata-only command registry</p>
        </div>
      </div>
      <dl className="split-command__tools-summary">
        <div>
          <dt>Total</dt>
          <dd>{commands.length}</dd>
        </div>
        <div>
          <dt>Global</dt>
          <dd>{globalCommands.length}</dd>
        </div>
        <div>
          <dt>Command Center</dt>
          <dd>{commandCenterCommands.length}</dd>
        </div>
      </dl>
      <p className="split-command__panel-note">No command palette or execution path is active.</p>
    </section>
  );
}

export default function SplitCommandWorkspace({
  project,
  activeSceneId,
  onSelectScene,
  commandCenterCollapsed = false,
  shellStatusNote = null,
  writingStudio,
}: SplitCommandWorkspaceProps): JSX.Element {
  const activeOutline = deriveActiveOutline(project);
  const activeUnit =
    activeSceneId ? activeOutline.units.find((unit) => unit.sceneId === activeSceneId) ?? null : null;
  const commands = listCommandRegistryEntries();

  return (
    <div
      className={`split-command${
        commandCenterCollapsed ? " split-command--condensed" : ""
      }`}
      data-testid="split-command-workspace"
      data-command-center-state={commandCenterCollapsed ? "condensed" : "full"}
    >
      <aside
        className="split-command__zone split-command__zone--command"
        aria-label="Command Center"
      >
        <div className="split-command__zone-header">
          <span className="split-command__eyebrow">Command Center</span>
          <h2>Deterministic command surfaces</h2>
          <p className="split-command__zone-summary">
            Experimental Phase 11B shell. Panels are deterministic loaded-data surfaces or
            explicitly demoted metadata views.
          </p>
          <p
            className="split-command__panel-note"
            data-testid="split-command-deferred-note"
          >
            Narrative Gaps and AI Companion are deferred to later phases and are not active
            command panels.
          </p>
          {shellStatusNote ? (
            <p
              className="split-command__panel-note"
              data-testid="split-command-shell-status"
              role="status"
            >
              {shellStatusNote}
            </p>
          ) : null}
          {commandCenterCollapsed ? (
            <p
              className="split-command__panel-note"
              data-testid="split-command-layout-note"
            >
              Writing Studio keeps primary workspace width in condensed mode. Tertiary command
              surfaces collapse first while the deterministic overview lane remains visible.
            </p>
          ) : null}
        </div>

        <div className="split-command__panel-stack" aria-label="Command Center panels">
          <StoryNavigationPanel
            project={project}
            outline={activeOutline}
            activeSceneId={activeSceneId}
            onSelectScene={onSelectScene}
          />

          <div
            className="split-command__panel-cluster"
            aria-label="Deterministic command surfaces"
          >
            <NarrativeOverviewPanel
              project={project}
              outline={activeOutline}
              activeUnit={activeUnit}
            />

            <StructureOverviewPanel project={project} />

            <div
              className="split-command__panel-cluster split-command__panel-cluster--tertiary"
              aria-label="Metadata command surfaces"
              hidden={commandCenterCollapsed}
            >
              <ProjectStatsPanel
                project={project}
                outline={activeOutline}
                activeUnit={activeUnit}
              />

              <GlobalToolsPanel commands={commands} />
            </div>
          </div>
        </div>
      </aside>

      <section
        className="split-command__zone split-command__zone--writing"
        aria-label="Writing Studio"
      >
        <div className="split-command__zone-header split-command__zone-header--writing">
          <span className="split-command__eyebrow">Writing Studio</span>
          <h2>{project?.name ?? "No project loaded"}</h2>
          <p className="split-command__zone-summary">
            {activeUnit
              ? `Active scene: ${activeUnit.title}`
              : "Existing stable writing surfaces are wrapped here without changing workflow behavior."}
          </p>
        </div>
        <div className="split-command__writing-surface">
          <div className="split-command__writing-support" aria-label="Writing Workspace support">
            <div className="split-command__panel-stack" aria-label="Writing Studio surfaces">
              <WritingStudioContractPanel project={project} activeUnit={activeUnit} />
            </div>
            <WritingWorkspaceSnapshotPanel
              project={project}
              outline={activeOutline}
              activeUnit={activeUnit}
            />
          </div>
          <div className="split-command__writing-frame">{writingStudio}</div>
        </div>
      </section>
    </div>
  );
}
