# docs/gui_layouts.md — Black Skies v1.1
**Status:** UNLOCKED · 2025-10-09
Covers: dock presets, pane roles, hotkeys, new analytics and Companion features.

See [Agents & Services](./agents_and_services.md) for Phase 11 analytics + agent module contracts referenced throughout this layout.

---

## Default Dock Preset (v1.1)
Wizard (left) | Draft Board (center) | Critique (right) | History (bottom) | **Analytics/Dashboard (tabbed pane)** (floating)

### Current Scope (v1.1)
- The preset above is locked for Phase 1–7 delivery. Panes resize within their bands, but users cannot drag/dock panes into new regions or detach them yet.
- Layout reset restores this preset and clears any transient runtime resizing.

### Planned Enhancements (Phase 8 GUI Enhancements)
- Unlock pane drag/drop docking with snap targets and keyboard equivalents for accessibility.
- Persist user layouts to `layout.json` (per project and per profile) so custom arrangements survive restarts and sync across devices.
- Allow panes to detach into floating window containers for secondary monitors, with optional “return to dock” controls.
- Expose hotkeys for storing/recalling layout presets (e.g., `Ctrl+Alt+1` for Default, `Ctrl+Alt+2` for Analysis View).
- Provide reset + export/import of layouts to support team-standard presets.

---

## Pane Responsibilities
- **Wizard:** Decision Checklist + Suggest/Accept/Lock.
- **Draft Board:** Scene editor + diff toggle + Companion overlay + budget meter.
- **Critique:** Rubric tabs + Batch Critique controls + Custom Rubric Editor.
- **History:** Snapshots, Quick Restore Undo toast, Streak Tracker.
- **Analytics:** Emotion Arc, Pacing Graph, Conflict Heatmap, Scene Length stats.
- **Dashboard:** Project Health, Outline Validation, Multi-Project Launcher.

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
Critique: Ctrl/Cmd+B (run Batch Critique) · Ctrl/Cmd+E (edit Custom Rubric)
Accessibility: Ctrl/Cmd+Alt+F (toggle Large-Font) · Ctrl/Cmd+Alt+H (toggle High-Contrast)
Export: Ctrl/Cmd+Shift+X (open Export Template Picker)

---

## Safety Rules
Confirm destructive; show Undo toast; auto-focus nearest control; respect offline status indicator.
