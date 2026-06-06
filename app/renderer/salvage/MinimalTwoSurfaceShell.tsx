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
            <p>Selected scene: {MINIMAL_SALVAGE_SHELL_MODEL.currentSceneLabel}</p>
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
              defaultValue={MINIMAL_SALVAGE_SHELL_MODEL.prosePlaceholder}
              rows={10}
            />
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
