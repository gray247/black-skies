# Pass 150 - Restore-as-Copy Human Retest Failure Intake

Date: 2026-06-03

## 1. Files inspected
- `docs/audits/phase15/pass146_restore_as_copy_eligibility_contract_plan.md`
- `docs/audits/phase15/pass147_restore_as_copy_eligibility_contract_implementation.md`
- `docs/audits/phase15/pass148_restore_as_copy_implementation_caveat_review.md`
- `docs/audits/phase15/pass149_restore_as_copy_e2e_spillover_correction.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/App.tsx`
- `app/renderer/hooks/useServiceHealth.ts`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- Pass 147 restore/backup tests and their updated bridge/renderer coverage
- `logs/` was treated as read-only evidence only

## 2. Human retest failure summary
- The user opened Black Skies, opened the backups/snapshots panel, and selected `Restore backup as copy` for `BS_20260516_182839.zip`.
- The confirmation modal copy was correct and explicitly promised a new sibling copy without overwriting the current project.
- The restore ran for a while, then stopped/fell back to a failure state.
- The UI reported backend services as offline / temporarily unreachable.
- The console showed `[useServiceHealth] Health probe failed` with `Request timed out after 45000ms` and `code: TIMEOUT`.
- The user also observed backend/PowerShell evidence that health/backups requests were returning HTTP 200 around the same period.

## 3. Failure classification

| Candidate | Classification |
| --- | --- |
| eligibility rejection | No evidence |
| backend exception | No direct evidence in the current intake |
| backend slow success after frontend timeout | Plausible, not yet proven |
| backend still running after frontend timeout | Plausible, not yet proven |
| true service offline | Unlikely from the evidence provided |
| health probe false cascade | Primary classification |
| unknown / needs targeted repro | Secondary classification for the restore outcome |

## 4. Where the 45000ms timeout applies
- The 45-second timeout applies to the generic service-health probe path in `app/renderer/hooks/useServiceHealth.ts`, which calls `services.checkHealth()`.
- That health probe is distinct from the restore request path.
- The observed `Request timed out after 45000ms` is therefore not evidence that the restore-as-copy request itself used a 45-second budget.

## 5. Whether backup restore uses the generic request timeout
- No.
- `app/main/preload.ts` assigns `backups/restore` a dedicated `BACKUP_RESTORE_REQUEST_TIMEOUT_MS`.
- The default is `300_000ms`, not the generic `45_000ms` request policy.
- That means the restore-as-copy request path already has an operation-specific timeout budget, unlike the health probe.

## 6. Whether restore-as-copy needs an operation-specific timeout like snapshot creation
- Not as a new runtime change.
- The restore-as-copy request path already has an operation-specific timeout budget in preload.
- The failure signal here is the generic health probe, not the restore request timeout.

## 7. Whether the user-facing offline / failed message is truthful
- Not fully.
- The message is truthful about the health probe timing out, but it is too strong if it is being interpreted as proof that the restore itself failed.
- The current evidence supports: `health probe timed out; restore may still be running or may have completed elsewhere`.
- It does not support `backend is truly offline` as a final conclusion.

## 8. Whether implementation should be blocked from commit
- Yes, temporarily.
- The runtime restore-as-copy implementation is not disproven, but the human retest outcome is unresolved because the restore completion was not independently captured.
- The correct next step is not an eligibility fix, but a targeted repro that separates restore completion from health-probe cascade behavior.

## 9. Whether a small correction is enough or targeted repro is required
- Targeted repro is required.
- A small correction is not justified yet because the restore request timeout is already operation-specific and the only explicit 45-second timeout observed is on health checking.
- The unresolved question is whether the restore request is slow, still running, or completed successfully while the UI was driven offline by the health probe.

## 10. Recommended next pass
- Run a targeted restore repro that captures:
  - restore request start and end timestamps,
  - health probe timestamps,
  - backend request logs for `backups/restore`,
  - whether the restored sibling folder appears after the UI marks backend as offline,
  - whether the timeout comes from health checking only or from the restore request itself.

## 11. Final verdict
- `NEEDS TARGETED RESTORE REPRO`
