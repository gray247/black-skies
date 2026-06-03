# Pass 153 - Restore-as-Copy Health-Cascade Implementation

## Files Reviewed
- `docs/audits/phase15/pass146_restore_as_copy_eligibility_contract_plan.md`
- `docs/audits/phase15/pass147_restore_as_copy_eligibility_contract_implementation.md`
- `docs/audits/phase15/pass148_restore_as_copy_implementation_caveat_review.md`
- `docs/audits/phase15/pass149_restore_as_copy_e2e_spillover_correction.md`
- `docs/audits/phase15/pass150_restore_as_copy_human_retest_failure_intake.md`
- `docs/audits/phase15/pass151_restore_as_copy_targeted_repro_evidence_plan.md`
- `docs/audits/phase15/pass152_restore_as_copy_health_cascade_repair_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/restore_service.py`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/__tests__/useServiceHealth.test.tsx`
- `services/tests/test_backups.py`
- `services/tests/test_app.py`

## Files Changed
- `services/src/blackskies/services/routers/restore.py`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/__tests__/useServiceHealth.test.tsx`
- `services/tests/test_backups.py`
- `services/tests/test_app.py`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

## Implementation Summary
- Offloaded the ZIP restore route in `services/src/blackskies/services/routers/restore.py` with `fastapi.concurrency.run_in_threadpool` so long archive work and restored-copy validation no longer run on the request coroutine.
- Kept the existing backup-restore offload path in `services/src/blackskies/services/routers/backups.py` intact.
- Added a narrow restore-in-progress renderer guard that suppresses the false offline transition while a restore-as-copy is actively running.
- Preserved the restore-as-copy eligibility contract from Pass 147 and did not change blocked-reason semantics.

## Offload Coverage
- `backups/restore` already used threadpool offload before this pass.
- `restore` now uses threadpool offload for both ZIP restore and latest-backup fallback paths, plus restored-copy validation.
- This keeps `api/v1/healthz` responsive during the restore window instead of letting the request path monopolize the restore coroutine.

## Renderer Guard Coverage
- `SnapshotsPanel` now marks restore-as-copy operations as in progress for the duration of the restore call.
- `useServiceHealth` ignores transient health probe failures while that restore flag is set, preventing a false offline banner and the contradictory offline-then-success sequence seen during human retest.

## Tests Added / Updated
- Added backend concurrency coverage for `GET /api/v1/healthz` during in-flight restore work in:
  - `services/tests/test_backups.py`
  - `services/tests/test_app.py`
- Added renderer health-hook coverage in:
  - `app/renderer/__tests__/useServiceHealth.test.tsx`

## Validation Results
- `python -m pytest services/tests/unit/test_restore_service.py services/tests/test_backups.py services/tests/test_app.py -k "restore or backup"` passed: `23 passed, 66 deselected`
- `pnpm --filter app test` passed: `59 files passed / 336 tests passed`
- `pnpm --filter app build` passed
- `git diff --check` passed
- `pnpm lint:docs` passed

## Remaining Caveats
- The health-probe timeout budget itself remains unchanged at `45_000ms`; the repair avoids the false offline cascade rather than widening the timeout globally.
- The renderer suppression is intentionally narrow and only applies while the restore-as-copy flow is marked in progress.

## Final Verdict
- `RESTORE HEALTH-CASCADE REPAIR COMPLETE WITH CAVEATS`
