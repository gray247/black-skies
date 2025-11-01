# Phase 8 – GUI Docking Enhancements
**Status:** Verification pending  
**Owner:** Desktop UI team  
**Linked Phase:** P8 – Hardening, Performance, Resilience

This document tracks the actionable work items required to upgrade the dockable panes architecture from the current locked preset to full IDE-style docking as promised in the README and layout specs.

---

## Background
- README advertises a “modular, dockable desktop writing environment.”
- `docs/architecture.md` and `docs/gui_layouts.md` now clarify that P1–P7 ship only the fixed preset layout.
- Phase 8 unlocks true docking: drag/drop snap targets, floating panes, persistent custom layouts, and keyboard-accessible workflows.

---

## Ticket Breakdown

### 1. Dock Manager Integration (GUI-P8-001)
- **Decision (2025-10-07):** Adopt `react-mosaic-component` for the in-app dock manager layered over project panes, with Electron-managed floating windows for multi-monitor detach. Alternatives (Golden Layout, custom DnD) were rejected due to bundle size and lack of strict TypeScript support. Mosaic keeps the bundle delta under 60 KB once tree-shaken and matches our existing dependency graph (already shipped indirectly for prototypes).
- **Goal:** Introduce a docking framework that supports drag, snap, re-dock, and floating windows inside the Electron shell.
- **Scope:**
  - Evaluate Golden Layout, Mosaic, or custom React/Electron manager; record decision and trade-offs.
  - Prototype docking with the core panes (Wizard, Draft Board, Critique, History) hidden behind a feature flag.
  - Ensure multi-pane resizing, double-click to float/dock, and programmatic APIs for future automation.
- **Deliverables:** Decision note, feature flag wiring, baseline implementation with unit/snapshot coverage of the layout container.
- **Implementation status (2025-10-28):** `DockWorkspace` wraps Mosaic with toolbar affordances, preset switching, and runtime-driven enablement.

### 2. Layout Persistence & Multi-monitor Support (GUI-P8-002)
- **Goal:** Persist user-defined layouts and enable detached panes across monitors.
- **Scope:**
  - Serialize layout state to `layout.json` (per project + per user profile).
  - Restore saved layouts on launch with validation/fallback to locked preset if invalid.
  - Provide floating window containers with “return to dock” and auto-reconnect when monitors change.
- **Deliverables:** Persistence module, migration logic, tests covering save/restore & corruption handling, update to `docs/gui_layouts.md` detailing storage format.
- **Implementation status (2025-10-28):** `layoutIpc` saves schema v2 payloads (including display ids) and clamps floating window bounds to active monitors; the renderer reopens saved floating panes and debounces persistence writes.

### 3. Accessibility & Hotkeys (GUI-P8-003)
- **Goal:** Ensure the docking system is fully operable via keyboard and meets accessibility policies.
- **Scope:**
  - Keyboard equivalents for docking actions, traversal between panes, and focus management when panes move or float.
  - Hotkeys for preset switching (default, analysis, critique view, etc.) and layout reset.
  - Screen-reader labels and ARIA roles for draggable regions, drop targets, and floating windows.
- **Deliverables:** Implemented key bindings, updated accessibility regression tests, documentation in `docs/gui_layouts.md` and `docs/policies.md`.
- **Implementation status (2025-10-28):** Docking instructions surface via hidden helper text, focus cycling is covered by Vitest, and runtime configuration exposes hotkey enablement plus preset ordering.

---

## Timeline & Dependencies
- **Target phase completion:** Align with other P8 resilience items (load/performance, retries, security).
- **Dependencies:** Dock manager evaluation may surface new npm packages; ensure license review via `scripts/security_sweep.py`.
- **Risks:** Electron window management quirks on multi-monitor setups, increased renderer bundle size from docking library.

---

## Acceptance Criteria
- Users can drag panes to new positions, float/dock them, and save/restore layouts.
- Layout changes persist between sessions and survive monitor changes or app restarts.
- Keyboard-only users can perform all docking actions; hotkeys documented and tested.
- Documentation reflects both the default preset and customizable docking workflows.

---

## Verification (updated 2025-10-28)
- ✅ `pnpm --filter app test` (renderer + main Vitest suites, including `DockWorkspace` and layout boundary coverage).
- ✅ `pytest services/tests/unit/test_backup_verifier.py` (checksum drift, voice note gaps, nested directories, include validation).
- ⏳ Manual Electron smoke (renderer reload, floating window detach/restore) — pending scheduling.
- ⏳ Accessibility keyboard-only walkthrough across DockWorkspace and floating panes — requires hardware validation.
