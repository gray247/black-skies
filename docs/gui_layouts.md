# docs/gui_layouts.md — Black Skies v1.1
**Status:** LOCKED · 2025-10-10
Covers: dock presets, pane roles, hotkeys, new analytics and Companion features.

See [Agents & Services](./agents_and_services.md) for Phase 11 analytics + agent module contracts referenced throughout this layout.

---

## Default Dock Preset (v1.1)
Wizard (left) | Draft Board (center) | Critique (right) | History (bottom) | **Analytics/Dashboard (tabbed pane)** (floating)

---

## Pane Responsibilities
- **Wizard:** Decision Checklist + Suggest/Accept/Lock.
- **Draft Board:** Scene editor + diff toggle + Companion overlay + budget meter.
- **Critique:** Rubric tabs + Batch Critique controls + Custom Rubric Editor.
- **History:** Snapshots, Quick Restore Undo toast, Streak Tracker.
- **Analytics:** Emotion Arc, Pacing Graph, Conflict Heatmap, Scene Length stats.
- **Dashboard:** Project Health, Outline Validation, Multi-Project Launcher.

### Companion Overlay (Draft Board)
- **Placement:** Docked overlay anchored to the right edge of the Draft Board; collapses to a 56px pill when hidden.
- **States & copy:**
  - *Idle:* "Ask Companion about tone, stakes, or continuity…" (input placeholder).
  - *Thinking:* header badge `GENERATING…` with subtext "Budget impact: ~${projected_usd}".
  - *Response:* message groups show **Assistant** replies with chips for `Apply`, `Copy`, `Critique`. Footers display "Press Enter to send · Shift+Enter for newline".
- **Context chips:** scene title + word count pinned top-left; `Rubric` selector pinned top-right and syncs with Critique pane selection.
- **Actions:**
  - Primary button `Send Prompt` (Ctrl/Cmd+Enter).
  - Secondary `Insert Suggestion` when diff snippet returned.
  - Overflow menu: `Open Batch Critique`, `Save Rubric Preset…`, `View Budget Ledger`.
- **Hotkeys:**
  - Toggle overlay: Ctrl/Cmd+M.
  - Focus prompt input: Ctrl/Cmd+Shift+M.
  - Cycle previous prompts: Alt+Up/Down.

### Budget Meter (Draft Board footer)
- **Layout:** Persistent footer bar with dual gauges (soft + hard). Soft threshold left-aligned with label `Soft cap $5`; hard threshold right with `Hard stop $10`.
- **Copy:**
  - Default: "Spent $${spent} · Pending $${pending}".
  - Warning (>= soft cap): banner tint amber with text "Heads up — ${delta} before hard stop" and action button `Open Budget Details`.
  - Blocked (>= hard cap): banner tint red with "Budget exceeded — critique and generate disabled" plus link `Review ledger`.
- **Interaction:** Clicking meter opens modal (Budget Details) summarising session spend, estimated next action, and `Request Override` stub (Phase 9).
- **Hotkeys:** Ctrl/Cmd+Shift+B opens Budget Details modal from anywhere.

### Critique Pane Enhancements
- **Batch Critique controls:** toolbar row with `Select Units…` dropdown (multi-select scenes/chapters), `Run Batch` primary button, and `Schedule` secondary (future stub). Progress list displays chips `Queued`, `Running`, `Complete`, `Failed`.
- **Custom Rubric Editor:** inline editor opens as sub-pane; header copy `Custom Rubric — Phase 8 Beta`. Fields: `Name`, `Description`, `Criteria` (reorderable). Save button copy `Save for Project`; Cancel `Discard`.
- **Companion sync:** rubric selection mirrored via overlay context chips; tooltip "Changes update Companion suggestions".
- **Hotkeys:**
  - Ctrl/Cmd+B: open Batch Critique dialog (focus `Select Units`).
  - Ctrl/Cmd+E: toggle Custom Rubric Editor.
  - Ctrl/Cmd+Shift+R: rerun last batch with same selection.

### History Toast (History pane)
- **Trigger:** when user accepts/reverts critique or restore snapshot.
- **Layout:** toast slides up from History pane bottom; 320px width, includes icon, summary copy, and actions.
- **Copy variants:**
  - Accept: "Critique applied — Snapshot ${snapshot_id} saved." actions `Undo` (primary), `View diff` (link).
  - Revert: "Scene restored to ${timestamp}." actions `Redo`, `Open in Draft`.
  - Batch: "Batch critique queued — results will appear here." action `Show queue`.
- **Hotkeys:**
  - Undo last History action: Ctrl/Cmd+Z (scoped to History toast when focused).
  - Redo: Ctrl/Cmd+Shift+Z.
- **Timeout:** auto-dismiss after 8s unless hovered; toast logs into History list as `toast_event` entry for audit.

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
Global: Ctrl/Cmd+Shift+A (toggle Analytics pane) · Ctrl/Cmd+M (open Companion overlay) · Ctrl/Cmd+Shift+B (Budget Details) · Ctrl/Cmd+Shift+M (focus Companion input)
Critique: Ctrl/Cmd+B (run Batch Critique) · Ctrl/Cmd+E (edit Custom Rubric) · Ctrl/Cmd+Shift+R (rerun last batch)
History: Ctrl/Cmd+Z (undo last History action) · Ctrl/Cmd+Shift+Z (redo) · Alt+Up/Down (cycle Companion prompts)
Accessibility: Ctrl/Cmd+Alt+F (toggle Large-Font) · Ctrl/Cmd+Alt+H (toggle High-Contrast)
Export: Ctrl/Cmd+Shift+X (open Export Template Picker)

---

## Safety Rules
Confirm destructive; show Undo toast; auto-focus nearest control; respect offline status indicator.
