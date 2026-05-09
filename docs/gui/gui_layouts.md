Status: Active (Canonical)
Version: 1.0.0
Last Reviewed: 2026-05-06
Source of Truth: Canonical pane layout for Outline/Writing/Feedback + drawer/overlay behavior; other GUI docs extend from these expectations.

Spec Index:
- Architecture (`../specs/architecture.md`)
- Data Model (`../specs/data_model.md`)
- Endpoints (`../specs/endpoints.md`)
- GUI Layouts (`./gui_layouts.md`)
- Analytics Spec (`../specs/analytics_service_spec.md`)
- BUILD_PLAN (TBD)
- Phase Charter (`../phases/phase_charter.md`)

# docs/gui/gui_layouts.md - Black Skies v1.1

The renderer still ships the fixed three-pane layout (Outline | Writing | Feedback) with a collapsible Timeline drawer. Docking and floating Draft Preview behavior are live in the Electron workspace, but the remaining work is UX polish around sizing, recovery, and metadata presentation rather than feature enablement.

See [Agents & Services](./agents_and_services.md) for the long-term analytics/agent contracts, but treat the sections below as the source of truth for what end users can access today.

---

## Default Layout (shipping)
Outline (left) | Writing view (center) | Feedback notes (right). The Timeline renders as a drawer below Feedback and can be toggled via the toolbar. Analytics uses the existing drawer/modal rather than a floating window.

Implementation priority note: **ModelRouter seam and routing/policy/budget plumbing come before any splash/onboarding expansion.** GUI work must not block the router-first rollout.

### Current Scope
- Docking and floating Draft Preview support are available in the workspace. The surface is functional, but pane sizing, recovery, and docking ergonomics still need polish.
- Layout state persists only per-pane width and Collapse/Expand toggles in `.blackskies/layout.json`. Live draft-preview sync is handled separately from layout persistence.
- Presets (`standard`, `analysis`, `critique`) are defined but hidden; the renderer still loads the standard arrangement by default.
- Keyboard navigation still focuses each pane (`Ctrl+Alt+]` / `Ctrl+Alt+[`) and panes keep `role="group"` for assistive tooling.
- The Analytics/Story insights view button exists in the toolbar (`Ctrl+Shift+A`) and opens a placeholder overlay when analytics is not enabled for the current runtime mode.

---

## Pane Responsibilities
- **Outline:** Decision checklist, scene planning, and quick links to validation panels.
- **Writing view:** Scene editor, diff toggle, Companion overlay, and budget meter.
- **Feedback notes:** Feedback threads, accept/undo controls, rubric editor, plus the collapsible Timeline drawer.
- **Analytics drawer (Collapsible):** Placeholder region reserved for emotion arc, adaptive pacing, conflict heatmap, and scene length distribution metrics; the actual data will be sourced from `/api/v1/analytics/summary` when analytics is enabled. This future drawer replaces the previously documented floating “Story insights” window.
- **Companion overlay (Writing view):** A dockable in-app browser pane/window that opens ChatGPT. Companion Mode is separate from API Mode and does not route prompts through service providers or ModelRouter.

---

## Story Insights & Project Health (future state)
The floating Story insights / Project Health pane referenced in earlier drafts is still on the roadmap. Analytics data remains gated by runtime configuration; when analytics is disabled, the placeholder overlay is shown instead.

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
Read-Through remains the distraction-free preview overlay. Analytics badges stay hidden while `/api/v1/analytics/summary` is disabled, and there is no separate docking integration in this mode.

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

## Known Deferred UX Issues
- Pane sizing: the current minimum/maximum sizing behavior still feels rough and needs a dedicated polish pass.
- Docking ergonomics: drag targets, float/return affordances, and recovery feedback are functional but still not smooth enough for final UX.
- Scene Metadata usability: the metadata block is useful but still too dense for quick scanning during generation and preview flows.
- Floating pane recovery UX: floated panes now stay in sync with live draft state, but the recovery and return experience still needs clearer guidance and feedback.

## Export Panel (Phase 11)
- Checklist: MD / JSON / PDF / EPUB / ZIP.
- Template Select: default, print-compact, ebook-serif.
- Toggles: “Append critique end-notes,” “Split by chapter”.

---

## GUI/UX Index

- [`docs/gui/gui_fix_plan.md`](./gui_fix_plan.md) – Canonical Insights/gating fix plan that keeps the renderer stable; use it when modifying overlays or telemetry warnings.
- [`docs/gui/gui_offline_insights_and_floats_plan.md`](./gui_offline_insights_and_floats_plan.md) – Supporting deep dive on offline gating and float notifications.
- [`docs/ops/gui_insights_rescue_kit.md`](./gui_insights_rescue_kit.md) – Troubleshooting kit for Playwright Insights failures and packaged renderer debugging.
- [`docs/gui/gui_theming.md`](./gui_theming.md) – Theme tokens + constraints layered over this layout; they must not reposition panes.
- [`docs/phases/phase8_gui_enhancements.md`](./phase8_gui_enhancements.md) – Docking and layout persistence initiatives that evolve from this document.
- [`docs/gui/accessibility_toggles.md`](./accessibility_toggles.md) – High-contrast and large-font toggles scoped to the panes defined here.

## Planned GUI Enhancements (Not yet implemented)
- Story insights as a floating window and the Visuals Layer presets remain roadmap items; the current docking/floating Draft Preview behavior is functional but still being polished.
- Voice-related controls, backup daemon UIs, and the new Visuals + Analytics overs are future additions and do not exist in today's renderer.
