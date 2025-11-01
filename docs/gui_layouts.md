# docs/gui_layouts.md - Black Skies v1.1
**Status:** Unlocked - 2025-10-09
Covers: dock presets, pane roles, hotkeys, new analytics and Companion features.

See [Agents & Services](./agents_and_services.md) for Phase 11 analytics + agent module contracts referenced throughout this layout.

---

## Default Dock Preset (v1.1)
Wizard (left) | Draft Board (center) | Critique (right) | History (bottom) | **Analytics/Dashboard (tabbed pane)** (floating)

### Current Scope (v1.1)
- Docking is available behind the runtime flag `ui.enable_docking` (see `config/runtime.yaml`). When enabled, panes can be dragged, resized, or floated into secondary windows.
- Layout changes persist to `.blackskies/layout.json` alongside each project. The schema now records `displayId` so floating windows reopen on the correct monitor when possible.
- Floating panes reopen on launch using persisted bounds and display metadata (schema version 2). Existing floating windows are focused rather than duplicated when the renderer reloads.
- Three presets ship by default: `standard`, `analysis`, and `critique`. Use `Ctrl+Alt+1/2/3` to swap presets, `Ctrl+Alt+0` to reset.
- Keyboard-only navigation is supported: `Ctrl+Alt+]` moves focus to the next pane, `Ctrl+Alt+[` moves backwards. All panes expose `role="group"` with descriptive labels for assistive tech.
- Screen-reader users receive a single instructions paragraph (visually hidden) describing the preset and focus hotkeys via `aria-describedby` on each pane container.
- Layout reset (Dock footer or `Ctrl+Alt+0`) clears the persisted file and restores the preset defined by `ui.default_preset`.

---

## Pane Responsibilities
- **Wizard:** Decision Checklist + Suggest/Accept/Lock.
- **Draft Board:** Scene editor + diff toggle + Companion overlay + budget meter.
- **Critique:** Rubric tabs + Batch Critique controls + Custom Rubric Editor.
- **History:** Snapshots, Quick Restore Undo toast, Streak Tracker.
- **Analytics:** Emotion Arc, Pacing Graph, Conflict Heatmap, Scene Length stats.
- **Dashboard:** Project Health, Outline Validation, Multi-Project Launcher (see [Dashboard initiatives](./dashboard_initiatives.md) for rollout).

---

## Analytics Pane
Phase 11 ships the Analytics tab set as a floating pane. Widgets here subscribe to the analytics service module for real-time metrics:

- **Emotion Arc:** overlays Companion sentiment scoring with manual annotations.
- **Pacing Graph:** highlights slow/fast beats sourced from the Planning agent.
- **Conflict Heatmap:** cross-references antagonist presence with stakes tags.
- **Scene Length Stats:** aggregates draft word counts and flags outliers.

Agents emitting new reports must register via the [Agents & Services](./agents_and_services.md) interfaces; compliant plugins appear here automatically.

---

## Preflight Panel
Accessed from the Draft Board sidebar, the Preflight panel surfaces the budgeting service output:

- Token + dollar projections for Generate/Critique batches.
- Validation flags for structure gaps detected by the Planner agent.
- Links back to the Analytics pane for deeper dives into pacing or emotion anomalies.

It remains dockable; toggle visibility with the Companion overlay or from the Wizard footer.

---

## Read-Through Mode
Read-Through overlays the Draft Board with a distraction-free preview. Inline analytics badges (pacing, emotion) appear when the relevant agents have published updates. Use this mode to validate flow before committing full rewrites.

---

## Hotkeys (Additions)
Global: Ctrl/Cmd+Shift+A (toggle Analytics pane) · Ctrl/Cmd+M (open Companion overlay)
Dock presets: Ctrl+Alt+1 (Standard) · Ctrl+Alt+2 (Analysis) · Ctrl+Alt+3 (Critique) · Ctrl+Alt+0 (Reset)
Dock focus: Ctrl+Alt+] (next pane) · Ctrl+Alt+[ (previous pane)
Critique: Ctrl/Cmd+B (run Batch Critique) · Ctrl/Cmd+E (edit Custom Rubric)
Accessibility: Ctrl/Cmd+Alt+F (toggle Large-Font) · Ctrl/Cmd+Alt+H (toggle High-Contrast) — implementation tracked in [Accessibility toggles plan](./accessibility_toggles.md)
Export: Ctrl/Cmd+Shift+X (open Export Template Picker)

---

## Safety Rules
Confirm destructive; show Undo toast; auto-focus nearest control; respect offline status indicator.
