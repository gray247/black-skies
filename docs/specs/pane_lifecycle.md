# Pane Lifecycle Contract

Status: Phase 11 contract draft
Last Reviewed: 2026-05-06

## Source Of Truth
- `app/renderer/components/docking/DockWorkspace.tsx`
- `app/renderer/components/docking/DockPaneTile.tsx`
- `app/shared/ipc/layout.ts`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/utils/draftPreviewSync.ts`

## Pane Classification Matrix
| Pane | Id | Scope | Source Of Truth | Persisted State | Transient State | Project Switch | Scene Switch | Reload | Known Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Outline | `outline` | Project-scoped | Dock workspace layout plus project model | Layout tree and per-project floating descriptor | Focus, split state, relocation highlight | Rebind to the current project root | No direct scene mutation | Restored from the current project layout | Can feel stale if the project root is not reloaded |
| Draft Preview | `draftPreview` | Selection-scoped | `ProjectHome` + `draftPreviewSync` | Project-path keyed live draft sync | Floating window state, sync override, selection focus | Rebind to the new project path and current active scene | Follows active scene and draft overrides | Restores from project-path keyed live state | Stale preview if project-path sync is not refreshed |
| Story Insights | `storyInsights` | Project-scoped | Analytics/project summary pipeline | Layout tree and floating descriptor | Focus and relocation highlight | Rebind to current project analytics | No direct scene mutation | Restored from the current project layout | Could show stale analytics if project state is not reloaded |
| Corkboard | `corkboard` | Project-scoped | Project outline / scene card surface | Layout tree and floating descriptor | Focus and resize state | Rebind to the current project | Scene-card state updates with project selection | Restored from the current project layout | Stale cards if project switch is skipped |
| Timeline | `timeline` | Project-scoped | Project history/progress view | Layout tree and floating descriptor | Focus and split state | Rebind to the current project | No direct scene mutation | Restored from the current project layout | History can look stale if the project does not reload |
| Critique | `critique` | Selection-scoped | Critique/rewrite workflow state | Layout tree and floating descriptor | Dialog state, rewrite/review state, trace state | Rebind to the new project and clear invalid rewrite context | Follows the selected scene or draft unit | Restores with the current project layout | Can retain stale review context if selection changes are missed |
| Relationship Graph | `relationshipGraph` | Project-scoped | Hidden analytics/relationship surface | Layout tree and floating descriptor | Hidden-state and focus state | Rebind to the current project | No direct scene mutation | Restored only when explicitly requested | Hidden by default, so stale data is easy to overlook |

## Scope Notes
- No current pane is global.
- No current pane is generation-scoped.
- The shared registry now carries an explicit `scope` field in `app/shared/ipc/layout.ts` so the classification is a contract, not just a doc note.

## Owned State
- Pane open/close state.
- Dock or float state.
- Current layout tree.
- Floating window bounds.
- Current active scene for selection-scoped panes.
- Current project path for project-scoped panes.

## Transient State
- Focus ring and keyboard focus cycle.
- Expansion state inside the mosaic tree.
- Drag hover state and split handle state.
- Floating relocation toasts.
- Auto-snap and clamp diagnostics.

## Persisted State
- Layout tree and floating pane descriptors.
- Layout schema version.
- Project-path keyed draft preview sync state for the active scene.
- Any project-local metadata already written by the workflow itself.

## User-Visible Behavior
- Open/close, dock, float, and resize actions must not expose stale project data.
- Project-scoped panes reset to the current project when the project changes.
- Selection-scoped panes follow the selected scene.
- Floating panes remain usable after reload and after display changes.
- Invalid or missing pane ids are normalized or ignored rather than crashing the workspace.

## Failure Behavior
- Invalid layout payloads fall back to the default layout.
- Offscreen floating panes are clamped back into view.
- Missing project or invalid scene selection clears the dependent pane content.
- A pane should never silently show data from a different project.
- Unknown floating-pane ids are dropped during layout load instead of being trusted.

## Recovery Behavior
- Layout reset returns the user to the default preset.
- Project switch clears project-specific pane content and rebinds current selection.
- Reload rehydrates the current project from persisted layout and local live state.
- Stale floating-pane records are cleared instead of being trusted blindly.
- Corrupt floating descriptors are normalized away on load.

## Test Requirements
- Reload with docked panes.
- Reload with floated panes.
- Project switch with floated Draft Preview.
- Project switch with floated Scene Metadata.
- Corrupted layout recovery.
- Offscreen floating window recovery.
- No cross-test contamination from persisted renderer state.

## Anti-Patterns
- Treating floating panes as stateless.
- Allowing stale project or scene content after a project switch.
- Letting a hidden pane keep live state from a previous project.
- Persisting invalid pane ids or unsanitized layout trees.
- Reopening stale floating panes without checking the current project path.
