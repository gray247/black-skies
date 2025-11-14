# docs/gui_layouts.md - Black Skies v1.1
**Status:** Updated - 2025-10-20

The renderer still ships the fixed three-pane layout (Outline | Writing | Feedback) with a collapsible Timeline drawer. Docking, floating Story insights panes, and Phase 9 dashboards remain experimental and are not available in production builds even though runtime flags exist.

See [Agents & Services](./agents_and_services.md) for the long-term analytics/agent contracts, but treat the sections below as the source of truth for what end users can access today.

---

## Default Layout (shipping)
Outline (left) | Writing view (center) | Feedback notes (right). The Timeline renders as a drawer below Feedback and can be toggled via the toolbar. Analytics uses the existing drawer/modal rather than a floating window.

### Current Scope
- Docking is **not** available in packaged builds. The `ui.enable_docking` flag exists for internal experiments but is left disabled by default and is not supported.
- Layout state persists only per-pane width and Collapse/Expand toggles in `.blackskies/layout.json`. There is no multi-display awareness or floating window metadata yet.
- Presets (`standard`, `analysis`, `critique`) are defined but hidden; the renderer always loads the standard arrangement until docking ships.
- Keyboard navigation still focuses each pane (`Ctrl+Alt+]` / `Ctrl+Alt+[`) and panes keep `role="group"` for assistive tooling.
- The Analytics/Story insights view button exists in the toolbar (`Ctrl+Shift+A`) but currently only opens a placeholder overlay; the analytics service is disabled until Phase 9, so no derived data is shown.

---

## Pane Responsibilities
- **Outline:** Decision checklist, scene planning, and quick links to validation panels.
- **Writing view:** Scene editor, diff toggle, Companion overlay, and budget meter.
- **Feedback notes:** Feedback threads, accept/undo controls, rubric editor, plus the collapsible Timeline drawer.
- **Analytics drawer (Collapsible):** Placeholder region reserved for emotion arc, adaptive pacing, conflict heatmap, and scene length distribution metrics; the actual data will be sourced from `/api/v1/analytics/summary` only once Phase 9 enables the analytics service. This future drawer replaces the previously documented floating “Story insights” window.

---

## Story Insights & Project Health (future state)
The floating Story insights / Project Health pane referenced in earlier drafts is still on the roadmap. Until docking lands, analytics content stays in the drawer described above. Agents that emit new reports can continue to target the analytics service—the UI will pick them up once the floating pane ships.

---

## Service Health / Offline Experience
- When the FastAPI service port is unavailable we show a single `Writing tools offline` banner that surfaces the port error, offers a `Retry connection` action, and keeps model-dependent actions (Generate, Critique) disabled until the health probe succeeds.
- The banner clears as soon as the health hook detects a successful probe or the manual retry returns online, so writers do not need to restart the app after transient networking blips.
- The retry action triggers the same health probe loop that `useServiceHealth` uses, ensuring telemetry/analytics stay aligned while the UI gates the actions and hints appropriately once the port is back.

---

## Preflight Panel
The Preflight panel lives in the Draft Board sidebar below the Outline. It surfaces budgeting output (token + dollar projections) and links to the analytics drawer. It cannot be re-docked or floated at this time.

---

## Read-Through Mode
Read-Through remains the distraction-free preview overlay. Analytics badges stay hidden in Phase 8 because `/api/v1/analytics/summary` is not yet enabled; there is no docking integration until Phase 9.

---

## Hotkeys (shipping)
- Global: Ctrl/Cmd+Shift+A (toggle Analytics drawer) · Ctrl/Cmd+M (open Companion overlay)
- Focus cycling: Ctrl+Alt+] (next pane) · Ctrl+Alt+[ (previous pane)
- Critique: Ctrl/Cmd+B (run Batch Critique) · Ctrl/Cmd+E (edit Custom Rubric)
- Export: Ctrl/Cmd+Shift+X (open Export Template Picker)
> Preset hotkeys (Ctrl+Alt+1/2/3/0) remain hidden because presets are not yet exposed without docking.

---

## Safety Rules
Confirm destructive; show Undo toast; auto-focus nearest control; respect offline status indicator.
See `docs/error_ux.md` for how to escalate inline warnings/toasts/modals consistently.

---

## Tooltips & Inline Help
- Every icon-only button must expose a tooltip string (e.g., “Run All Critique (Ctrl+J)”) and matching `aria-label`/accessibility text that references the hotkey when defined.
- Tooltips come from a centralized string source (shared constants) so the same phrasing feeds the tooltip, command bar entry, and hotkey map, preventing drift.
- Complex overlays (Spark Pad, Visuals Layer) may add inline “?” help icons that open focused popovers explaining context-specific lamps or flange operations.
- Tooltips and popover text must explicitly call out the associated hotkey when present so keyboard users get parity with mouse interactions.

## Project Info Panel (Advanced)
- “Open Project Folder” returns `project_id`, `project_name`, and optional slug; the UI uses these values to seed service requests so users no longer type the ID directly once the folder is chosen.
- Surface `project_id`, folder path, schema version, and runtime flags in a read-only Info/Debug panel (Settings > Advanced) for support scenarios. This panel is informational only and does not appear in normal workflows.
- The Critique Pane, Outline flow, and automation features consume the active `project_id` automatically; all user-entry points simulate context selection rather than manual typing.

---

## Critique Pane Automation (Phase 9)
- Controls: Automation Mode (Local / Local→Model), Run All, Stop.
- Status: per-unit pills (Queued / Running / Blocked / Done), totals, budget bar.
- Safety: Undo toast on Accept/Apply.

## History Pane (Phase 10)
- Actions: Preview Diff, Restore, Reveal Snapshot.
- Filters: by reason (`accept_edits`, `chapter_save`, `export`, `shutdown`).

## Export Panel (Phase 11)
- Checklist: MD / JSON / PDF / EPUB / ZIP.
- Template Select: default, print-compact, ebook-serif.
- Toggles: “Append critique end-notes,” “Split by chapter”.

---

## Planned GUI Enhancements (Not yet implemented)
- Docking/floating panes, Story insights as a floating window, and the Visuals Layer presets remain experimental; no production build exposes these layouts by default.
- Voice-related controls, backup daemon UIs, and the new Visuals + Analytics overs are future additions and do not exist in today's renderer.
