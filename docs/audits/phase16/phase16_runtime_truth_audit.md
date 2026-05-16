Canonical role: Phase 16 runtime truth map.
Scope: classify what the current runtime surfaces actually prove across backup, restore, recovery, snapshots, export, generation, critique, project load/switch, and service-health UI.
Owns: authority-layer mapping, stale-state risk notes, false-success / false-failure classification, and the proof boundary for operator-facing claims.
Does not own: GUI modernization, confirm-surface redesign, async/job architecture, or broad runtime fixes.
Last reviewed: 2026-05-16.
Acceptance record: No operator acceptance recorded yet.

# Phase 16 Runtime Truth Audit

## Source Evidence Used

- [phase16_master_execution_plan.md](phase16_master_execution_plan.md)
- [phase16_test_harness_fixture_governance_review.md](phase16_test_harness_fixture_governance_review.md)
- [phase15_closure_review.md](../phase15/phase15_closure_review.md)
- [phase14d_closure_audit.md](../phase14/phase14d_closure_audit.md)
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/hooks/useRecovery.ts`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/hooks/useCritique.ts`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/routers/recovery.py`
- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/routers/draft/revision.py`
- `services/src/blackskies/services/operations/draft_generation.py`
- `services/src/blackskies/services/operations/draft_export.py`
- `app/tests/e2e/_bootstrap.ts`
- `app/tests/e2e/utils/serviceStubs.ts`
- `docs/audits/phase14/phase14c_operator_receipt_results.md`
- `docs/audits/phase15/phase15_closure_review.md`

## Runtime Truth Matrix

| Surface | User-visible claim | Authority owner(s) | Actual completion authority | Stale-state / false-success risk | Harness proof | Runtime proof required | Human verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backup create | Creates a backup archive for the current project | Renderer `SnapshotsPanel`, preload `backups`, backend `BackupService` / `/backups`, filesystem | Backend archive write plus filesystem persistence | Toast can overclaim if the archive is still being materialized or the bridge times out | Renderer tests, e2e harness, contract checks | Yes | Yes for operator trust claims |
| Restore latest ZIP as copy | Creates a sibling restored project folder from the latest ZIP | `SnapshotsPanel`, preload `restore`, backend `/api/v1/restore`, filesystem | Backend restore completion plus post-materialization validation | Client timeout can fire while backend is still creating the copy; stale UI state can overclaim failure | Renderer tests and real restore-lane evidence from Phase 15 | Yes | Yes, closure-critical |
| Selected backup restore | Creates a sibling restored project folder from a chosen backup | `SnapshotsPanel`, native confirm, preload `backups/restore`, backend restore route, filesystem | Backend restore completion plus restored-path confirmation | Native confirm is still an authority surface; UI can imply a simple copy when the real work is restore-plus-validation | Renderer tests and backend route coverage | Yes | Yes, closure-critical |
| Recovery restore | Restores current project files from a recovery snapshot | `RecoveryBanner`, `useRecovery`, preload `draft/recovery/restore`, backend recovery route | Backend recovery restore completion | Generic bridge timeout can understate backend progress; `reopen` state can lag the actual recovery action | Hook tests and e2e harness recovery lane | Yes | Yes, closure-critical adjacency |
| Snapshot verification | Produces or refreshes the latest verification record | `SnapshotsPanel`, preload `backup_verifier`, backend verifier, verification file on disk | Verification record write and reread | The UI can treat a persisted report as if it were current truth when it is only a historical record | Renderer tests, fixture contract checks, file-backed stub seeding | Yes for operator trust claims | Not always; required when currentness is disputed |
| Verification report viewing | Opens the local verification record or snapshot metadata | `SnapshotsPanel`, preload `revealPath`, local filesystem | Local file browse only | Can be mistaken for integrity proof even though it is just browsing the record | Renderer tests and local-path browse checks | No for validity, yes for meaning disputes | Only if the operator may confuse browseability with validity |
| Reveal/open folder | Opens a local folder or file for inspection | `SnapshotsPanel`, `revealPathWithToast`, filesystem | Local browse authority only | If described as proof of restorable state, it becomes an overclaim | Renderer tests | No | No unless the browse action is part of a trust claim |
| Export flow | Writes export artifacts for the current project | `App`, preload `export`, backend export service, filesystem | Export file write plus optional analytics side effects | Bridge timeout can fire before export completion is confirmed; UI may imply completion before the export write is durable | Renderer tests, service route coverage | Yes | Preferred for operator-facing export claims |
| Draft / generation flow | Produces generated draft units | `useCritique` / generation path, preload route timeout, backend draft generation service | Backend generation result plus draft persistence | Client timeout is still shorter than backend budget for some routes; duplicate clicks can overstate completion unless disabled states hold | Renderer tests, backend service tests, e2e harness | Yes | Preferred for operator-facing generation claims |
| Critique / rewrite flow | Produces an advisory critique or persisted rewrite | `useCritique`, backend critique/rewrite routes, draft persistence | Backend response and persisted rewrite content | Synthetic-mode success can be mistaken for real-service proof; rewrite can appear saved before persistence is confirmed | Renderer tests, service tests, synthetic harness | Yes | Preferred for operator-facing rewrite claims |
| Project load / reopen | Loads the intended project root and rebinds state | `ProjectHome`, `useRecovery`, preload project loader, filesystem/local storage | Real project load and state rebind | Stale recent-project or localStorage state can point the UI at the wrong root; reopen can drift from load truth | Renderer tests and prior Phase 14 operator receipts for project switch | Yes | Yes for reopen / continuity claims |
| Project switch | Switches to the intended project without stale carryover | `ProjectHome`, preload project loader, renderer state | New project root load plus rebind | Switch success can hide stale draft or pane state if rebind is not checked | Renderer tests and Phase 14 operator receipts | Yes | Yes for continuity-sensitive claims |
| Service health / offline banner | Reports service availability and the availability of writing actions | `useServiceHealth`, `ServiceStatusPill`, `ServiceHealthBanner`, `SnapshotsPanel` gating | Health poll plus action gating, not content validity | The global wording can overgeneralize local backend availability into a writing-tools-wide outage | Unit tests, harness service-status checks | Yes when the label is used to justify control availability | Yes when the label could mislead an operator |

## Findings

- Backup, restore, export, generation, critique, and recovery are all real runtime flows with real filesystem effects. They cannot be closed by harness success alone.
- `SnapshotsPanel` now uses more truthful copy for copy-materialization flows, but the global service-health wording still collapses distinct states into "Writing tools offline" / "Checking writing tools".
- The recovery/reopen path still lacks the Phase 16 operator receipt that would prove reopen truth after restore. The Phase 14 receipt scaffold still shows `Reopen After Restore` as `Not run`.
- Snapshot verification and report browsing are local-record authorities, not evidence that the project is valid or restorable.

## Proof Boundary

- Harness green proves the lane contract only.
- Truth-lane green proves the specific lane contract only.
- Runtime truth requires the actual file, backend, or rebind outcome the user sees.
- Human verification is mandatory when the claim could reasonably change operator behavior.

## Closure Impact

- Closure-critical runtime claims remain backup/restore and recovery/reopen.
- Snapshot verification, report viewing, reveal/open, export, generation, critique, and project switch are truth-sensitive but not all closure blockers by themselves.
- The global health labels are Phase 17 GUI debt unless they become the only thing standing between the operator and a trust-proof claim.
