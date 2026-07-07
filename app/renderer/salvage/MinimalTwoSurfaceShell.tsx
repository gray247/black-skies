import { useState } from "react";

import { MINIMAL_SALVAGE_SHELL_MODEL } from "./salvageShellModel";

const FUTURE_COMMAND_CENTER_AREAS = [
  "Story Units",
  "Narrative Gaps",
  "Relationships",
  "Continuity",
  "Qualitative Signals",
  "Outline / Lore / Character Tools",
] as const;

export default function MinimalTwoSurfaceShell() {
  const selectedScene =
    MINIMAL_SALVAGE_SHELL_MODEL.sceneList.find(
      (scene) => scene.id === MINIMAL_SALVAGE_SHELL_MODEL.selectedSceneId,
    ) ?? MINIMAL_SALVAGE_SHELL_MODEL.sceneList[0];
  const [draftText, setDraftText] = useState(MINIMAL_SALVAGE_SHELL_MODEL.prosePlaceholder);
  const [isSaved, setIsSaved] = useState(true);
  const syntheticProjectId = "project_signal_house_draft";
  const syntheticProjectContextLabel = "Synthetic active project context";
  const saveStateLabel = isSaved ? "Save-state: Local draft ready" : "Save-state: Unsaved local edits";
  const saveStateDetail = isSaved
    ? "Bounded status only. No runtime persistence, recovery, or restore wiring."
    : "Edits exist only in local synthetic state. No runtime persistence, recovery, or restore wiring.";

  return (
    <main
      data-testid="minimal-two-surface-shell"
      aria-label="Minimal Two-Surface Shell"
    >
      <header aria-label="Shell boundary summary">
        <h1>Black Skies Minimal Two-Surface Shell</h1>
        <p>
          Two work surfaces are scaffolded here. Writing remains available first, and the
          Command Center remains separate and supporting.
        </p>
      </header>

      <section aria-label="Synthetic project frame" data-testid="synthetic-project-frame">
        <h2>{syntheticProjectContextLabel}</h2>
        <p>
          This shell is attached to one synthetic/minimal active project context so first-slice UI
          behavior can stay explicit without real project loading.
        </p>
        <p>Active project title: {MINIMAL_SALVAGE_SHELL_MODEL.projectTitle}</p>
        <p>Active project identity: {syntheticProjectId}</p>
      </section>

      <div data-testid="minimal-two-surface-shell-layout">
        <section
          aria-label="Writing Surface"
          data-testid="writing-surface"
          data-surface-role="sovereign"
        >
          <header>
            <h2>Writing Surface</h2>
            <p>Direct writing remains available first.</p>
          </header>

          <section aria-label="Current project context">
            <h3>Current Project Context</h3>
            <p>{MINIMAL_SALVAGE_SHELL_MODEL.projectTitle}</p>
            <p>{MINIMAL_SALVAGE_SHELL_MODEL.projectStatusText}</p>
            <p>Active project identity matches the synthetic project frame: {syntheticProjectId}</p>
            <p>Selected scene: {MINIMAL_SALVAGE_SHELL_MODEL.currentSceneLabel}</p>
          </section>

          <section aria-label="Save-state status framing">
            <h3>Save-State Status</h3>
            <p>{saveStateLabel}</p>
            <p>{saveStateDetail}</p>
          </section>

          <nav aria-label="Minimal scene navigation">
            <h3>Minimal Scene Navigation</h3>
            <p>Direct writing remains available before any command-side selection or tool action.</p>
          </nav>

          <section aria-label="Writing entry">
            <label htmlFor="minimal-writing-surface-editor">Writing Surface editor</label>
            <textarea
              id="minimal-writing-surface-editor"
              aria-label="Writing Surface editor"
              value={draftText}
              onChange={(event) => {
                setDraftText(event.target.value);
                setIsSaved(false);
              }}
              rows={10}
            />
            <div aria-label="Local edit controls">
              <button type="button" onClick={() => setIsSaved(true)}>
                Mark local draft as reviewed
              </button>
              <p>Synthetic/local only editing flow. No persistence or project loading is connected.</p>
            </div>
            <p>Story Units are optional later and are not required before writing begins.</p>
            {selectedScene ? <p>Current writing focus: {selectedScene.label}</p> : null}
          </section>
        </section>

        <aside
          aria-label="Command Center Surface"
          data-testid="command-center-surface"
          data-surface-role="supporting"
          data-gating="non-blocking"
        >
          <header>
            <h2>Command Center Surface</h2>
            <p>Supports planning and inspection. It does not gate writing.</p>
          </header>

          <section aria-label="Command Center role">
            <h3>Contextual Workspace</h3>
            <p>
              This surface stays separate from writing and can begin minimal or empty while the
              writing path remains usable.
            </p>
          </section>

          <section aria-label="Project status">
            <h3>Project Status</h3>
            <p>{MINIMAL_SALVAGE_SHELL_MODEL.projectTitle}</p>
            <p>{MINIMAL_SALVAGE_SHELL_MODEL.projectStatusText}</p>
            <p>{saveStateLabel}</p>
          </section>

          <section aria-label="Static scene list">
            <h3>Scene List Skeleton</h3>
            <ul>
              {MINIMAL_SALVAGE_SHELL_MODEL.sceneList.map((scene) => {
                const isSelected = scene.id === MINIMAL_SALVAGE_SHELL_MODEL.selectedSceneId;

                return (
                  <li
                    key={scene.id}
                    data-scene-id={scene.id}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <span>{scene.label}</span>
                    <span>{scene.statusText}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Future Command Center tools">
            <h3>Future Tools Placeholder</h3>
            <ul>
              {FUTURE_COMMAND_CENTER_AREAS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
