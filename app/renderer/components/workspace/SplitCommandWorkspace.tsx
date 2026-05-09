import type { ReactNode } from "react";

import type { LoadedProject } from "../../../shared/ipc/projectLoader";
import { listCommandRegistryEntries } from "../../commands/commandRegistry";
import { deriveActiveOutline } from "../../utils/storyUnits";
import StoryNavigationPanel from "./StoryNavigationPanel";

interface SplitCommandWorkspaceProps {
  readonly project: LoadedProject | null;
  readonly activeSceneId: string | null;
  readonly onSelectScene?: (sceneId: string) => void;
  readonly writingStudio: ReactNode;
}

function PlaceholderPanel({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <section className="split-command__panel split-command__panel--placeholder" aria-label={title}>
      <h3>{title}</h3>
      <div className="split-command__panel-body">{children}</div>
    </section>
  );
}

export default function SplitCommandWorkspace({
  project,
  activeSceneId,
  onSelectScene,
  writingStudio,
}: SplitCommandWorkspaceProps): JSX.Element {
  const activeOutline = deriveActiveOutline(project);
  const activeUnit =
    activeSceneId ? activeOutline.units.find((unit) => unit.sceneId === activeSceneId) ?? null : null;
  const commandCount = listCommandRegistryEntries().length;

  return (
    <div className="split-command" data-testid="split-command-workspace">
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
        </div>

        <StoryNavigationPanel
          outline={activeOutline}
          activeSceneId={activeSceneId}
          onSelectScene={onSelectScene}
        />

        <PlaceholderPanel title="Narrative Overview">
          <p>
            Placeholder surface. Future story-health signals will appear here after their
            contracts are implemented.
          </p>
        </PlaceholderPanel>

        <PlaceholderPanel title="Narrative Gaps">
          <p>Placeholder surface. No gap detection is running in Phase 11B foundation.</p>
        </PlaceholderPanel>

        <PlaceholderPanel title="AI Companion">
          <p>Placeholder surface. Existing Companion behavior remains in the current overlay.</p>
        </PlaceholderPanel>

        <PlaceholderPanel title="Global Tools">
          <p>
            Placeholder surface. {commandCount} commands are descriptive metadata only; no
            command palette is active.
          </p>
        </PlaceholderPanel>
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
        <div className="split-command__writing-surface">{writingStudio}</div>
      </section>
    </div>
  );
}
