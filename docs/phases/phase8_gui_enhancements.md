# Phase 8 – GUI Docking Enhancements
> **Status:** Verification pending
> **Version:** v1.1
> **Last Reviewed:** 2025-10-28
> **Owner:** Solo maintainer
> **Linked Phase:** P8 – Hardening, Performance, Resilience
> **Source of Truth:** `docs/gui/gui_layouts.md`

> **Source of Truth:** `docs/gui/gui_layouts.md` captures the shipped pane layout; this document tracks the Phase 8 docking extensions that build on that baseline.

This document tracks the actionable work items required to upgrade the dockable panes architecture from the current locked preset to full IDE-style docking as promised in the README and layout specs. It covers the Outline, Writing, and Feedback flows plus shared overlays so the terminology stays aligned with the rebranded UI copy.

---

## Background
- README advertises a “modular, dockable desktop writing environment.”
- `docs/specs/architecture.md` and `docs/gui/gui_layouts.md` now clarify that P1–P7 ship only the fixed preset layout.
- The Outline, Writing view, Feedback notes, Timeline, and Story insights panes share DockWorkspace controls and overlays.
- Phase 8 unlocks true docking: drag/drop snap targets, floating panes, persistent custom layouts, and keyboard-accessible workflows.

---

## Ticket Breakdown

### 1. Dock Manager Integration (GUI-P8-001)
- **Decision (2025-10-07):** Adopt `react-mosaic-component` for the in-app dock manager layered over project panes, with Electron-managed floating windows for multi-monitor detach. Alternatives (Golden Layout, custom DnD) were rejected due to bundle size and lack of strict TypeScript support. Mosaic keeps the bundle delta under 60 KB once tree-shaken and matches our existing dependency graph (already shipped indirectly for prototypes).
- **Goal:** Introduce a docking framework that supports drag, snap, re-dock, and floating windows inside the Electron shell.
- **Scope:**
  - Evaluate Golden Layout, Mosaic, or custom React/Electron manager; record decision and trade-offs.
  - Prototype docking with the core panes (Outline, Writing view, Feedback notes, Timeline) hidden behind a feature flag, with Story insights overlay toggles managed alongside the same flag.
  - Ensure multi-pane resizing, double-click to float/dock, and programmatic APIs for future automation.
- **Deliverables:** Decision note, feature flag wiring, baseline implementation with unit/snapshot coverage of the layout container.
- **Implementation status (2025-10-28):** `DockWorkspace` wraps Mosaic with toolbar affordances, preset switching, and runtime-driven enablement.

### 2. Layout Persistence & Multi-monitor Support (GUI-P8-002)
- **Goal:** Persist user-defined layouts and enable detached panes across monitors.
- **Scope:**
  - Serialize layout state to `layout.json` (per project + per user profile).
  - Restore saved layouts on launch with validation/fallback to locked preset if invalid.
  - Provide floating window containers with “return to dock” and auto-reconnect when monitors change.
- **Deliverables:** Persistence module, migration logic, tests covering save/restore & corruption handling, update to `docs/gui/gui_layouts.md` detailing storage format.
- **Implementation status (2025-10-28):** `layoutIpc` saves schema v2 payloads (including display ids) and clamps floating window bounds to active monitors; the renderer reopens saved floating panes and debounces persistence writes.

### 3. Accessibility & Hotkeys (GUI-P8-003)
- **Goal:** Ensure the docking system is fully operable via keyboard and meets accessibility policies.
- **Scope:**
  - Keyboard equivalents for docking actions, traversal between panes, and focus management when panes move or float.
  - Hotkeys for preset switching (default, analysis, feedback view, etc.) and layout reset.
  - Screen-reader labels and ARIA roles for draggable regions, drop targets, and floating windows.
- **Deliverables:** Implemented key bindings, updated accessibility regression tests, documentation in `docs/gui/gui_layouts.md` and `docs/policies.md`.
- **Implementation status (2025-10-28):** Docking instructions surface via hidden helper text, focus cycling is covered by Vitest, and runtime configuration exposes hotkey enablement plus preset ordering.

---

## Milestone Table – Outline/Writing/Feedback Docking

| Slice | Flow | Docking & overlay focus | Status | Evidence |
| :---- | :--- | :---------------------- | :----- | :------- |
| P8.1 | Outline | Outline pane docking, preset switcher labels (`Outline`, `Restore layout`) aligned to `ui_copy_spec_v1.md`, Story insights overlay pinned when docked. | Implemented 2025-10-28 | `DockWorkspace` wraps Mosaic with toolbar affordances, preset switching, and runtime enablement (feature flag); manual validation via [GUI-P8-VERIFY-01](./runbooks/gui_p8_verify_01.md). |
| P8.2 | Writing | Writing view floating window controls, multi-monitor persistence via `layout.json`, double-click float/restore, and overlay hand-off. | Implemented 2025-10-28 | `layoutIpc` saves schema v2 payloads with display IDs and clamps bounds before restoring writing panes; keyboard validation planned in [GUI-P8-VERIFY-02](./runbooks/gui_p8_verify_02.md). |
| P8.3 | Feedback | Feedback notes and Timeline panes participate in docking presets, remain keyboard reachable, and keep overlays synced during verification. | Verification pending | [GUI-P8-VERIFY-02](./runbooks/gui_p8_verify_02.md) (2026-01-16) covers Feedback notes + Timeline focus cycles and hotkeys. |

---

## Timeline & Dependencies
- **Target phase completion:** Align with other P8 resilience items (load/performance, retries, security).
- **Dependencies:** Dock manager evaluation may surface new npm packages; ensure license review via `scripts/security_sweep.py`.
- **Risks:** Electron window management quirks on multi-monitor setups, increased renderer bundle size from docking library.

---

## Acceptance Criteria
- Outline, Writing view, Feedback notes, Timeline, and Story insights panes can be dragged to new positions, floated/docked, and saved/restored via layouts.
- Layout changes persist between sessions and survive monitor changes or app restarts.
- Keyboard-only users can perform all docking actions across Outline/Writing/Feedback panes; hotkeys documented and tested.
- Documentation reflects the Outline/Writing/Feedback vocabulary for both the default preset and customizable docking workflows.

---

## Verification & QA (updated 2025-10-28)

**Automated**
- [done] `pnpm --filter app test` (renderer + main Vitest suites covering DockWorkspace for Outline/Writing/Feedback panes and layout boundary coverage).
- [done] `pytest services/tests/unit/test_backup_verifier.py` (checksum drift, voice note gaps, nested directories, include validation).

**Manual QA – Outline/Writing/Feedback flows**
| Flow | Scenario | Status | Owner | Reference |
| :--- | :------- | :----- | :----- | :-------- |
| Outline | Dock workspace reload, floating window detach/restore, preset application | Scheduled (2026-01-15) | Maintainer | [GUI-P8-VERIFY-01](./runbooks/gui_p8_verify_01.md) – Manual Electron smoke (renderer reload, floating window detach/restore). |
| Writing | Keyboard-only navigation across Writing view, hotkeys for preset switching, float/return | Scheduled (2026-01-16) | Maintainer | [GUI-P8-VERIFY-02](./runbooks/gui_p8_verify_02.md) – Accessibility keyboard-only walkthrough across DockWorkspace and floating panes. |
| Feedback | Focus cycle through Feedback notes & Timeline panes in docked + floating modes | Scheduled (2026-01-16) | Maintainer | [GUI-P8-VERIFY-02](./runbooks/gui_p8_verify_02.md) – Accessibility keyboard-only walkthrough across DockWorkspace and floating panes. |
