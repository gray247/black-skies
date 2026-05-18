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

function PlaceholderPanel({
  title,
  importance = "secondary",
  children,
}: {
  readonly title: string;
  readonly importance?: "secondary" | "tertiary";
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <section
      className={`split-command__panel split-command__panel--placeholder split-command__panel--${importance}`}
      aria-label={title}
    >
      <h3>{title}</h3>
      <div className="split-command__panel-body">{children}</div>
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
  const sceneCount = project?.scenes.length ?? 0;

  return (
    <section
      className="split-command__panel split-command__panel--secondary split-command__overview"
      aria-label="Narrative Overview"
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
        Story-health signals are not running in this Phase 11B wrapper.
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
      aria-label="Global Tools"
    >
      <div className="split-command__panel-heading">
        <div>
          <h3>Global Tools</h3>
          <p>Display-only command metadata</p>
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
      <ul className="split-command__tools-list" aria-label="Registered command metadata">
        {commands.slice(0, 5).map((command) => (
          <li key={command.id}>
            <span>{command.label}</span>
            <small>{command.category}</small>
          </li>
        ))}
      </ul>
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
          <h2>Story intelligence</h2>
          <p className="split-command__zone-summary">
            Experimental Phase 11B shell. Panels are read-only placeholders unless marked
            as existing workspace data.
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
              Writing Studio keeps primary workspace width in condensed mode. Supporting command
              surfaces stay collapsed until wider space is available.
            </p>
          ) : null}
        </div>

        <div className="split-command__panel-stack" aria-label="Command Center panels">
          <StoryNavigationPanel
            outline={activeOutline}
            activeSceneId={activeSceneId}
            onSelectScene={onSelectScene}
          />

          <div
            className="split-command__panel-cluster"
            aria-label="Future command surfaces"
            hidden={commandCenterCollapsed}
          >
            <NarrativeOverviewPanel
              project={project}
              outline={activeOutline}
              activeUnit={activeUnit}
            />

            <PlaceholderPanel title="Narrative Gaps">
              <p>Placeholder surface. No gap detection is running in Phase 11B foundation.</p>
            </PlaceholderPanel>

            <PlaceholderPanel title="AI Companion">
              <p>Placeholder surface. Existing Companion behavior remains in the current overlay.</p>
            </PlaceholderPanel>

            <GlobalToolsPanel commands={commands} />
          </div>
        </div>
      </aside>

      <section
        className="split-command__zone split-command__zone--writing"
        aria-label="Writing Studio"
      >
        <div className="split-command__zone-header">
          <span className="split-command__eyebrow">Writing Studio</span>
          <h2>{project?.name ?? "No project loaded"}</h2>
          <p className="split-command__zone-summary">
            {activeUnit
              ? `Active scene: ${activeUnit.title}`
              : "Existing stable writing surfaces are wrapped here without changing workflow behavior."}
          </p>
        </div>
        <div className="split-command__writing-surface">
          <div className="split-command__writing-frame">{writingStudio}</div>
        </div>
      </section>
    </div>
  );
}
