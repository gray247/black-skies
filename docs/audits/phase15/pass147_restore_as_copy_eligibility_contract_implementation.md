# Pass 147 - Restore-as-Copy Eligibility Contract Implementation

Date: 2026-06-03

## 1. Files inspected
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase15/pass146_restore_as_copy_eligibility_contract_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/backup_and_migration.md`
- `docs/specs/snapshot_state_vocabulary_and_evidence_contract.md`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/backup_verifier.py`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/main/__tests__/serviceApi.test.ts`
- `app/renderer/__tests__/AppRestore.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `services/tests/unit/test_restore_service.py`
- `services/tests/test_backups.py`
- `services/tests/test_app.py`
- `app/tests/e2e/phase5-export-integrity-flow.spec.ts`

## 2. Implementation summary
- Added a shared restore-as-copy eligibility helper in `services/src/blackskies/services/restore_service.py`.
- Threaded that decision through ZIP restore and backup restore before any sibling copy is materialized.
- Required explicit `restoreAsNew: true` on both restore-as-copy request paths.
- Preserved snapshot in-place recovery as a separate lane.
- Kept existing successful restore behavior intact while rejecting unsafe or ambiguous copy restores with blocked reasons.

## 3. Eligibility contract implemented
- The backend now evaluates copy restore with a structured decision object before moving files.
- The decision records whether the source is eligible, the current project root, the destination preview, the source scope, and the blocked reasons.
- ZIP restore and backup restore both return the eligibility decision in success payloads and in validation-error details when blocked.

## 4. Blocked reasons added
- `missing_source`
- `unreadable_source`
- `ambiguous_source_kind`
- `missing_manifest`
- `invalid_manifest`
- `checksum_unavailable`
- `checksum_mismatch`
- `scope_mismatch`
- `destination_exists`
- `destination_unavailable`
- `overwrite_not_allowed`
- `policy_blocked`

## 5. Backend changes
- `services/src/blackskies/services/restore_service.py`
  - Added `evaluate_restore_as_copy_eligibility(...)`.
  - Added manifest and destination safety checks for copy restore.
  - Added invalid-manifest rejection for ZIP restore.
- `services/src/blackskies/services/backup_service.py`
  - Added explicit `project_id` and `restore_as_new` parameters to backup restore.
  - Added checksum, manifest, scope, and destination eligibility checks.
  - Added blocked-reason payloads for invalid or missing backup evidence.
- `services/src/blackskies/services/routers/restore.py`
  - Required explicit `restoreAsNew`.
  - Passed copy intent into ZIP and backup-backed restore branches.
  - Returned blocked reasons through validation errors.
- `services/src/blackskies/services/routers/backups.py`
  - Required explicit `projectId` and `restoreAsNew` on restore requests.
  - Returned blocked reasons through validation errors.

## 6. Frontend/bridge changes
- `app/shared/ipc/services.ts`
  - Added `RestoreCopyEligibilityDecision`.
  - Added eligibility fields to restore responses.
  - Required `restoreAsNew` for both restore request shapes.
- `app/main/preload.ts`
  - Serialized `projectId` and `restoreAsNew` for backup restore.
  - Continued to serialize `restoreAsNew` for ZIP restore.
- `app/renderer/components/SnapshotsPanel.tsx`
  - Passed explicit copy intent for backup restore.
  - Surfaced blocked reasons as warning toasts instead of presenting unsafe restore-as-copy as available.
  - Updated backup restore copy to say `Restore backup as copy`.

## 7. Tests added/updated
- Backend:
  - `services/tests/unit/test_restore_service.py`
  - `services/tests/test_backups.py`
  - `services/tests/test_app.py`
- Bridge/runtime:
  - `app/main/__tests__/serviceApi.test.ts`
  - `app/renderer/__tests__/AppRestore.test.tsx`
  - `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
  - `app/tests/e2e/phase5-export-integrity-flow.spec.ts`
- Validation coverage now includes eligible restore, missing source, invalid/missing manifest evidence, scope mismatch, destination conflicts, overwrite-attempt blocking, blocked-reason transport, and renderer surfacing.

## 8. Validation results
- `python -m pytest services/tests/unit/test_restore_service.py services/tests/test_backups.py services/tests/test_app.py -k 'restore or backup'` passed.
- `pnpm --filter app test` passed (`59 files passed / 335 tests passed`).
- `pnpm --filter app build` passed.
- `python -m compileall services/src/blackskies/services` passed.
- `git diff --check` and `pnpm lint:docs` were run after the docs update and passed.

## 9. Remaining caveats
- ZIP restore keeps the existing no-checksum export behavior intact; checksum enforcement is applied where the backup bundle contract actually provides checksum evidence.
- Restore-latest still selects the latest backup or ZIP source when no explicit source filename is supplied, but it now does so through the explicit copy-restore gate.
- The destination preview is intentionally conservative and copy-only; the current project root is never overwritten.

## 10. Final verdict
- `RESTORE-AS-COPY ELIGIBILITY CONTRACT IMPLEMENTED WITH CAVEATS`
