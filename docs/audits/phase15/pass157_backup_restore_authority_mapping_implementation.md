# Pass 157 - Backup / Restore Authority Mapping Implementation

## 1. Files/Artifacts Reviewed
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase15/pass155_post_restore_as_copy_forward_build_checkpoint.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `app/shared/ipc/services.ts`
- `services/tests/unit/test_restore_service.py`
- `services/tests/test_backups.py`
- `services/tests/test_app.py`

## 2. Implementation Summary
- Implemented the backup / restore authority mapping contract for Phase 15 Lane 1.
- The shared restore eligibility decision now carries explicit source-identity metadata instead of leaving the renderer to infer it from route shape.
- Backup and ZIP restore paths now thread a `selection_mode` through the shared helper so the current source can be labeled as `named-backup`, `latest-backup`, `named-zip`, or `latest-zip`.

## 3. Contract Fields Added
- `source_family`
- `selection_mode`
- `source_label`
- `authority_state`
- `target_semantics`
- Existing blocked reasons and evidence checks remain in place.

## 4. Backend Changes
- `evaluate_restore_as_copy_eligibility(...)` now reports source family, selection mode, canonical source label, authority state, and target semantics.
- `BackupService.restore_backup(...)` now accepts a selection mode and threads it into the authority decision.
- `/api/v1/backups/restore` now declares the selection mode as `named`.
- `/api/v1/restore` now declares `named` for explicit ZIP restores and `latest` for restore-latest fallback paths.

## 5. Frontend / Bridge Surface
- `app/shared/ipc/services.ts` now knows the extended restore eligibility decision shape.
- No renderer behavior change was required for this lane because the current UI already consumes blocked-reason decisions and the contract is intended to make authority explicit in the response payload first.

## 6. Tests Added / Updated
- Unit coverage now pins the new source labels and target semantics in `services/tests/unit/test_restore_service.py`.
- Backend route coverage now asserts authority labels for:
  - named backup restore
  - named ZIP restore
  - latest backup restore
  - latest ZIP restore
- Monkeypatched health-concurrency tests were updated to accept the new selection-mode parameter.

## 7. Validation Results
- `python -m pytest services/tests/unit/test_restore_service.py services/tests/test_backups.py services/tests/test_app.py -k "restore or backup"` passed: `24 passed, 66 deselected`
- `pnpm --filter app test` passed: `59 files passed / 336 tests passed`
- `pnpm --filter app build` passed

## 8. Remaining Caveats
- Restore-as-copy remains closed with a performance caveat from the prior lane.
- The new authority labels do not change restore eligibility rules; they make the existing authority boundary explicit.
- `browseability` and `continuity` remain separate follow-on concerns for later Phase 15 lanes.

## 9. Phase 15 Status
- Lane 1 is implemented.
- The backup / restore authority mapping contract is now explicit in the backend and exposed through the shared bridge types.

## 10. Final Verdict
- `BACKUP / RESTORE AUTHORITY MAPPING CONTRACT IMPLEMENTED`
