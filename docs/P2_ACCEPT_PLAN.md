# Phase 2 Critique Accept & Recovery Plan

This plan refines milestones **P2.0 – P2.2** from `docs/BUILD_PLAN.md`. Each task is mapped to the stub locations already present in the renderer and service so future work can hook directly into the correct modules.

## P2.0 – `/draft/accept` API implementation
1. **Define request/response models** – extend `services/src/blackskies/services/app.py` around the draft router to validate accept payloads (see `@draft_router.post("/critique")` placeholder for nearby placement).
2. **Apply critique revisions** – implement the accept handler in `services/src/blackskies/services/app.py` to merge accepted suggestions into scene markdown (hook into the persistence helpers used by `/draft/rewrite`).
3. **Persist history metadata** – reuse `DraftPersistence` utilities in `services/src/blackskies/services/app.py` to write history entries and expose updated metadata in the response.
4. **Emit diagnostics and conflicts** – ensure the new handler integrates with the `DiagnosticLogger` already injected in `create_app`.
5. **Add pytest coverage** – create focused tests under `services/tests/` covering success, conflict, and logging paths.

## P2.1 – Snapshot persistence & recovery
1. **Write snapshot artifacts** – extend the accept handler in `services/src/blackskies/services/app.py` to persist files under `history/snapshots/` immediately after a successful accept.
2. **Crash flag + detection** – add state tracking within `create_app` in `services/src/blackskies/services/app.py` to surface when the previous run exited mid-accept.
3. **Renderer recovery banner** – introduce UI state in `app/renderer/App.tsx` (see the critique toast placeholder) to display recovery prompts when snapshots exist.
4. **Restore workflow** – add service/renderer bridge calls (hooked via `window.services`) to restore from the latest snapshot.
5. **Test coverage** – extend pytest for snapshot persistence and add Vitest cases for renderer recovery affordances.

## P2.2 – Renderer accept/reject UX
1. **Critique request plumbing** – replace the critique toast stub in `app/renderer/App.tsx` with real IPC calls once `/draft/critique` is fully wired.
2. **Accept/reject controls** – build renderer components for reviewing critique deltas and dispatching accept/reject actions (wired through `WizardPanel` and `ProjectHome`).
3. **History + snapshot display** – present history entries and snapshot timestamps in the renderer state tree (centralize state in `App.tsx`).
4. **Error handling & diagnostics** – surface conflicts and diagnostic summaries in the UI, referencing the payload returned by `/draft/accept`.
5. **Automated testing** – add Vitest (and Playwright smoke, when available) covering accept, reject, and restore flows.

> Follow-up PRs should reference these numbered tasks (e.g., “Implements P2.0 Task 2”) when delivering incremental functionality.
