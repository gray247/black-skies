# Pass 160A - Backup Source-State Offline Regression Fix

## 1. Files / Artifacts Reviewed
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase15/pass160_browseable_verified_restorable_implementation.md`
- `docs/audits/phase15/pass158_backup_restore_authority_mapping_human_spot_check_closure.md`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `app/renderer/components/SnapshotsPanel.tsx`
- `services/tests/test_backups.py`
- `services/tests/test_app.py`

## 2. Regression Summary
- After Pass 160, the backup panel could remain on `Loading backups...` while the renderer health probe reported backend offline.
- The transient scene write to `sc_0001` was reviewed and explicitly treated as a separate non-blocking caveat.
- The backup/offline problem is the active blocker for this pass.

## 3. Root Cause
- `GET /api/v1/backups` was doing heavy archive classification inline on the FastAPI coroutine path.
- The new source-state classification work made backup listing disk-heavy enough to starve `/api/v1/healthz` while the request was running.
- `latest_backup_name()` also uses the same classification path, so restore-latest would have inherited the same event-loop blocking risk if left inline.

## 4. Fix Summary
- `GET /api/v1/backups` now runs backup classification in `run_in_threadpool`.
- `latest_backup_name()` is also resolved in a threadpool inside the restore route, so restore-latest does not block the event loop on source selection.
- No restore-as-copy eligibility logic was reopened or changed.
- No snapshot ontology, recovery-route, GUI redesign, splash, launcher, workflow, Memory Lab, export, packaging, or restore-speed work was added.

## 5. Backend Changes
- `services/src/blackskies/services/routers/backups.py`
  - offloads `BackupService.list_backups(...)` to a threadpool
- `services/src/blackskies/services/routers/restore.py`
  - offloads `BackupService.latest_backup_name(...)` to a threadpool
- `services/tests/test_backups.py`
  - adds concurrency coverage proving `/api/v1/healthz` remains responsive while backup classification is in progress

## 6. Renderer Changes
- None in this pass.
- `SnapshotsPanel` continues to consume the explicit source-state fields added in Pass 160.

## 7. Tests and Validation
- `python -m pytest services/tests/unit/test_restore_service.py services/tests/test_backups.py services/tests/test_app.py -k "restore or backup"` passed: `27 passed, 66 deselected`
- `pnpm --filter app test` passed: `59 files passed / 337 tests passed`
- `pnpm --filter app build` passed
- `git diff --check` passed with the existing CRLF normalization warning on `docs/BLACK_SKIES_FIX_TRACKER.md`
- `pnpm lint:docs` passed

## 8. Human Trace Note
- The previously inspected scene trace remains a non-blocking, deferred scene-authority caveat.
- It is not the cause of the backup/offline regression.

## 9. Final Verdict
- `BACKUP SOURCE-STATE OFFLINE REGRESSION FIXED`
