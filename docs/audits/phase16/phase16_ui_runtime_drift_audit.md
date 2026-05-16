Canonical role: Phase 16 UI/runtime drift audit.
Scope: classify whether current toasts, modals, labels, and button states describe the actual runtime outcome or overstate it.
Owns: drift classification, wording-truth notes, and deferred GUI ownership.
Does not own: visual redesign, modal modernization, or alias/folder presentation cleanup.
Last reviewed: 2026-05-16.
Acceptance record: No operator acceptance recorded yet.

# Phase 16 UI / Runtime Drift Audit

## Source Evidence Used

- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/hooks/useRecovery.ts`
- `app/renderer/hooks/useCritique.ts`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/main/preload.ts`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/routers/recovery.py`
- `services/src/blackskies/services/routers/export.py`

## Drift Matrix

| Surface | Current wording / behavior | Classification | Why |
| --- | --- | --- | --- |
| Backup create toast | Announces backup creation and can expose the created path | No issue | The wording matches the backend/archive result, and timeout handling now says completion is unknown instead of overclaiming failure |
| Restore latest ZIP toast | Says a restored project copy was created, or that completion is unknown on timeout | No issue | The copy-materialization claim is bounded and does not imply overwrite or continuity proof |
| Selected backup restore confirm dialog | Says the action creates a new sibling copy and does not overwrite existing folders | No issue | The wording matches the restore-as-copy contract |
| Selected backup restore confirmation path | Uses native `window.confirm(...)` | Misleading but deferred | The control surface is old, but the behavior itself is not lying; the modernization belongs to Phase 17 |
| Recovery banner | Says crash recovery is available and offers restore/reopen actions | No issue | The banner matches the recovery route and the reopen affordance |
| Recovery restore toast | Says current project files were restored from a recovery snapshot | No issue | The wording matches the in-place recovery contract |
| Open verification record / open folder / reveal actions | Local browse verbs only | No issue | These are browse actions, not validity claims |
| Snapshot details modal | Describes metadata and integrity evidence for the report being viewed | Documentation-only | The modal is a record view, not a live truth claim |
| Verification toast | Distinguishes the current verification record from the local project state | No issue | The wording stays inside report authority |
| Export toast | Says the export completed and exposes the export folder | No issue | This is aligned with the export file write, though the timeout boundary remains a separate long-running risk |
| Generate / critique wording | Uses action verbs and advisory language | No issue | The copy is about producing draft/feedback content, not about final project authority |
| Project load / switch wording | Uses project identity language and load/reopen concepts | No issue | The wording is still authority-sensitive, but the current copy does not overclaim more than the loaded project state supports |
| Service health wording | `Checking writing tools` / `Writing tools offline` | Misleading but deferred | It collapses backend reachability into broad product wording; that is GUI debt unless it blocks a proof claim |

## Findings

- No active semantic lie was found that demands a Phase 16 runtime fix.
- The main drift is the global health wording and the native confirm surface on selected-backup restore.
- Several toasts are intentionally cautious now: they say completion is unknown or that a current project was not overwritten, which is the correct proof boundary.
- Snapshot/report browsing is still presented as browsing, not as truth about restorable validity.

## Classification Legend

- `semantic lie / fix now`: a statement that directly contradicts runtime truth.
- `misleading but deferred`: old wording or a legacy control that is not wrong enough to justify Phase 16 runtime churn.
- `cosmetic Phase 17`: control-surface cleanup or wording simplification with no authority change.
- `documentation-only`: record viewing or browsing affordances.
- `no issue`: the current wording matches the runtime contract.

## Closure Impact

- Phase 16 does not need a broad copy rewrite to close the audit.
- The remaining drift belongs to Phase 17 unless a later proof run shows the wording is preventing an operator from understanding an actually-important runtime distinction.
