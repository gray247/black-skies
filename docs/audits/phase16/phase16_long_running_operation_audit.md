Canonical role: Phase 16 long-running operation audit.
Scope: classify timeout ownership, completion semantics, and stale-state risk for operations that can run long enough to confuse operators.
Owns: long-running boundary notes, timeout ambiguity, degraded-completion semantics, and deferred async/job ownership.
Does not own: performance tuning, queue architecture, or broad transport redesign.
Last reviewed: 2026-05-16.
Acceptance record: No operator acceptance recorded yet.

# Phase 16 Long-Running Operation Audit

## Source Evidence Used

- `app/main/preload.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/hooks/useRecovery.ts`
- `services/src/blackskies/services/routers/recovery.py`
- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/routers/draft/revision.py`
- `services/src/blackskies/services/operations/draft_generation.py`
- `services/src/blackskies/services/operations/draft_export.py`
- `docs/audits/phase15/phase15_closure_review.md`
- `docs/audits/phase14/phase14d_closure_audit.md`

## Long-Running Boundary Matrix

| Operation | Current client timeout owner | Current budget | If backend finishes after client timeout | Duplicate-op risk | Renderer reload / window close risk | Orphaned-op risk | Stale loading-state risk | Async/job needed now? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Backup create | Preload route timeout override | `300_000ms` bridge budget | The backend may still be writing the archive after the toast says completion is unknown | Moderate if the action is retried while a prior archive is still writing | Yes; the UI can lose the in-flight state while the file write continues | Yes; completion is backend-synchronous, not job-backed | Yes if the toast is dismissed before the archive is confirmed | Deferred |
| Restore latest ZIP as copy | Preload route timeout override | `300_000ms` bridge budget | The backend may still be creating the sibling restored folder after the client aborts | Moderate; re-clicks can create ambiguity about which copy is current | Yes; a reload can detach the operator from a still-running restore | Yes; timeout can happen while the copy still appears later on disk | Yes; the UI already labels the timeout as completion unknown | Deferred |
| Selected backup restore | Preload route timeout override | `300_000ms` bridge budget | Same as restore latest: the filesystem work can outlive the client response | Moderate; the confirm flow does not itself prevent duplicate initiation | Yes | Yes | Yes if the modal closes before confirmation lands | Deferred |
| Recovery restore | Generic bridge timeout path | `45_000ms` default bridge budget | The backend recovery tracker can still be processing after the client aborts | Moderate; reopen and restore are both exposed from the same banner | Yes | Yes | Yes; the current UI can return to idle before the backend settles | Deferred unless closure requires a longer contract |
| Snapshot verification | Generic bridge timeout path | `45_000ms` default bridge budget | A verification record may still be written after the client timeout, but the report read is the authoritative artifact | Low to moderate; rerun can refresh the record | Low | Low | Yes if the panel keeps showing the old verification state | Deferred |
| Export | Generic bridge timeout path | `45_000ms` default bridge budget | The export file may still be written after the client aborts | Low to moderate; the button disables while exporting, but a reload can obscure progress | Yes | Yes | Yes; the toast can imply failure while the file write continues | Deferred |
| Draft / generation | Preload route timeout derived from unit count | `45_000ms` minimum, scaled by unit count, capped at `300_000ms`; backend service timeout is `120s` per request unit in the service helper | The backend may still be generating after the client aborts, especially for small unit counts | Moderate; retrying can create a second request that competes with the first | Yes | Yes | Yes; a loading state can disappear before the draft persistence finishes | Deferred |
| Critique / rewrite | Generic bridge timeout path for critique; rewrite is route-dependent but still synchronous | `45_000ms` default bridge budget for critique route; backend critique timeout is `90s` | The critique or rewrite result may still arrive after a client timeout | Moderate; repeat clicks can create multiple advisory results | Yes | Yes | Yes if the dialog closes before the rewritten text is persisted | Deferred |

## Findings

- The longest trust-sensitive operations are still synchronous request/response flows, not job-backed workflows.
- Backup create and restore-latest already have the strongest client budgets in the phase, but they still depend on the operator not mistaking timeout for failure.
- Recovery restore, export, critique, and some draft-generation paths still have a shorter client timeout than the backend work they can trigger.
- The current codebase uses disabled-state gating and toast wording to reduce duplicate actions, but reload and window-close risk still exist because the underlying operations are not job-owned.

## Completion Semantics

- A timeout means "completion is not confirmed," not "the work definitely did not happen."
- A success toast means the current response completed, not that no background work remains.
- For backup and restore flows, the safest operator claim is "a copy was created" or "completion remains unknown" until the filesystem result is visible.

## Human Verification Rules

- Mandatory for backup create, restore latest, and selected backup restore.
- Strongly preferred for recovery restore, export, and generation because their meaning is operator-visible.
- Not required for internal transport mechanics, but transport mechanics do not close the phase by themselves.

## Closure Impact

- No async/job architecture is required to finish Phase 16 classification.
- The audit does, however, show that recovery restore, export, critique, and some generation flows still have timeout ambiguity that must be carried forward as deferred risk.
- If later implementation wants to remove that ambiguity, the fix belongs in a narrow follow-up slice, not in a broad refactor pass.
