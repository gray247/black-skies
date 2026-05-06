# Phase 11 Workflow / Pane / UX Audit

Status: Audit snapshot
Last Reviewed: 2026-05-06
Scope: freeze the current workflow architecture before any GUI or outline overhaul work begins.

## What Already Exists
- `App.tsx` already wires the main workflow spine: project load, active scene selection, generation scope, preflight, generate, critique, rewrite, snapshots, and export.
- `DockWorkspace` already owns dock layout load/save/reset, floating pane open/close, layout sanitization, and offscreen clamp handling.
- The shared pane registry now carries an explicit `scope` field for each pane in `app/shared/ipc/layout.ts`.
- `ProjectHome` already owns project loading, active-scene selection, draft display, and scene metadata rendering.
- `Draft Preview` already syncs live draft state through `draftPreviewSync` and uses `projectPath` as the storage key boundary.
- `CritiqueModal` already shows critique output, saved rewrite output, provenance, and explicit sync/discard actions.
- `SnapshotsPanel` already handles backup creation, backup restore, and verification actions with toast feedback.

## What Is Stable
- Canonical project identity now comes from loaded project data, not folder-name drift.
- Layout persistence has schema validation, default-layout fallback, invalid-layout rejection, unknown floating-id rejection, and offscreen floating-window clamping.
- Floating Draft Preview no longer relies on disk-first state when live generated text exists.
- Critique/rewrite failure handling already distinguishes backend conflicts from generic fetch failures.
- Generation scope is already explicit in the workspace header for `Active scene` and `All scenes only`.
- Renderer contamination cleanup is already in place for datasets, `window.__*` helpers, storage, timers, and modal-root state.

## What Is Partially Implemented
- Pane lifecycle exists operationally, but the scope contract is not frozen in one spec and not every pane has a documented ownership class yet.
- Floating window lifecycle exists, but recovery feedback and ergonomics are still incomplete.
- Draft Preview has the right live-sync direction, but its role needs to be frozen as a read-oriented surface rather than a hidden editor.
- Scene Metadata renders and updates with active-scene selection, but the field classification contract is not yet explicit in the UI.
- Critique/rewrite provenance is present, but the sync/discard and failure boundaries need to be documented more tightly.
- Error and toast visibility are useful today, but the message contract is not yet standardized across surfaces.

## What Is Fake-Complete
- Any wording that says persisted floating panes are automatically restored on load is fake-complete. Current behavior clears stale floating records instead of silently reopening them.
- Any wording that says Draft Preview is a canonical editor is fake-complete. It is a preview surface with shared live-state sync.
- Any wording that says `selected_scenes`, `chapter_range`, or `manuscript_range` are currently supported generation scopes is fake-complete.
- Any wording that says Scene Metadata edits are already fully classified by effect is fake-complete. The fields exist, but the effect labels are not frozen yet.

## What Has Tests
- `AppPreflight` covers scope selection, timeout messaging, generated draft hydration, floated preview sync, and canonical project-id behavior.
- `LayoutPersistence` covers saved-layout restore, floating-pane reload behavior, unknown floating-id rejection, and offscreen clamp handling.
- `DockWorkspace` covers layout loading, save behavior, hotkeys, bounds logging, and invalid-layout sanitization.
- `ProjectHome` covers active-scene changes, draft override rendering, and scene card selection behavior.
- `AppCritique` covers critique/rewrite flow, conflict handling, route selection, and payload source integrity.
- `AppSnapshotsVerification` covers backup and verification UI behavior.
- `AppPreflight` now includes a renderer regression that rebinds a floated Draft Preview when the project path changes.
- E2E coverage exists for layout-no-floating-panes and snapshot-verification UI flow.

## What Lacks Tests
- Project switch while a Draft Preview window is floated is now covered at the renderer level, but not yet by Playwright E2E.
- Project switch while Scene Metadata is floated or otherwise detached.
- App reload with docked panes and with floated panes.
- Corrupted layout recovery and invalid pane-id recovery through the full renderer path.
- Offscreen floating-window recovery through the full renderer path.
- Cold-start and warm-reload parity for preview and layout state.
- Active-scene generation coverage for more than one scene at a time in the real path.
- The explicit distinction between critique advice, saved rewrite output, and sync mutation.
- Error/toast copy that guarantees project, scene, retry, and trace information in the same failure surface.

## What Should Be Frozen
- The current fixed dock vocabulary: Outline, Draft Preview, Story Insights, Corkboard, Timeline, Critique, and hidden Relationship Graph.
- The current generation scope vocabulary: `Active scene` and `All scenes only`.
- Draft Preview as a read-oriented rendering surface.
- Scene Metadata as project-scoped metadata display tied to the selected scene.
- Critique as advice, rewrite as saved output, sync as mutation.
- The current layout schema version and recovery fallback behavior.

## What Should Be Deferred
- Pane resizing ergonomics and docking polish.
- Scene Metadata usability improvements.
- Floating pane recovery UX polish.
- Companion Run All Insights warning flicker.
- Multi-select 2-3 scene generation.
- Any outline or GUI redesign beyond contract freezing.

## What Must Be Implemented Now
- Freeze the pane lifecycle contract in dedicated spec docs.
- Freeze the layout persistence and recovery contract in dedicated spec docs.
- Freeze the generation scope contract in dedicated spec docs.
- Freeze the Draft Preview and Scene Metadata contracts in dedicated spec docs.
- Freeze critique/rewrite provenance and error/toast visibility contracts in dedicated spec docs.
- Freeze the workflow spine so later GUI work has a stable foundation.
- Add or extend regression tests only where the contract surface is still ambiguous.

## Phase 11A Closure Checklist
- [x] Generation scope labels are explicit.
- [x] Preflight scope wording is explicit.
- [x] Snapshot, backup, and restore recovery copy is improved.
- [x] Rewrite semantics are truthful in UI and docs.
- [x] Backend rewrite persistence remains unchanged and documented.
- [x] Pane scope metadata is present in the shared layout registry.
- [x] Pane classification matrix is complete.
- [x] Unknown floating pane IDs are dropped on layout load.
- [x] Scene Metadata display-only contract is visible.
- [x] Workflow spine wording is aligned with current behavior.
- [ ] Floated-pane Playwright E2E remains deferred because the temp-project harness path triggers a backend recovery 400.
- [x] Renderer fallback coverage is present for floated Draft Preview stale-state cleanup.
- [x] Remaining known risks are documented in the audit and fix tracker.
