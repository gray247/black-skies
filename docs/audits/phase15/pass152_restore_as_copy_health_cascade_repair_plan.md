# Pass 152 - Restore-as-Copy Health-Cascade Repair Plan

Date: 2026-06-03

## 1. Files inspected
- `docs/audits/phase15/pass146_restore_as_copy_eligibility_contract_plan.md`
- `docs/audits/phase15/pass147_restore_as_copy_eligibility_contract_implementation.md`
- `docs/audits/phase15/pass148_restore_as_copy_implementation_caveat_review.md`
- `docs/audits/phase15/pass149_restore_as_copy_e2e_spillover_correction.md`
- `docs/audits/phase15/pass150_restore_as_copy_human_retest_failure_intake.md`
- `docs/audits/phase15/pass151_restore_as_copy_targeted_repro_evidence_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/App.tsx`
- Relevant Pass 147 restore/backup tests

## 2. Human evidence summary
- The user clicked `Restore backup as copy` for `BS_20260516_182839.zip`.
- The restore modal copy was correct and explicitly promised a new sibling copy without overwriting the current project.
- During the restore, `Invoke-RestMethod "http://127.0.0.1:8000/api/v1/healthz"` would not return.
- DevTools showed `[useServiceHealth] Health probe failed` with `Request timed out after 45000ms` and `code: TIMEOUT`.
- The UI showed backend services offline / temporarily unreachable while the restore was still running.
- The restore later succeeded and produced a success toast.

## 3. Current restore request path
- `app/main/preload.ts` routes `backups/restore` through `BACKUP_RESTORE_REQUEST_TIMEOUT_MS`, which defaults to `300_000ms`.
- `services/src/blackskies/services/routers/backups.py` and `services/src/blackskies/services/routers/restore.py` call the restore service synchronously inside the request handler.
- `services/src/blackskies/services/backup_service.py` performs archive reading, checksum validation, manifest parsing, destination creation, and materialization synchronously.
- `services/src/blackskies/services/restore_service.py` performs ZIP extraction, destination creation, and validation synchronously.

## 4. Current health probe path
- `app/renderer/hooks/useServiceHealth.ts` periodically calls `services.checkHealth()`.
- `app/main/preload.ts` gives `checkHealth()` the generic request timeout path, which is `45_000ms` by default.
- When the probe times out, the hook logs `[useServiceHealth] Health probe failed` and promotes the UI to `offline`.
- `app/renderer/App.tsx` then turns that service-unavailable state into the visible backend-offline banner.

## 5. Why `/healthz` may not respond during restore
- The restore route is doing heavy synchronous file work in the request handler.
- In the current shape, the restore request can monopolize the FastAPI worker / event loop long enough that the health request cannot be scheduled promptly.
- The evidence fits event-loop / worker starvation better than a true backend crash or an eligibility rejection.

## 6. Whether restore code is blocking the FastAPI event loop
- Yes, that is the leading root-cause assessment.
- The restore route is `async def` but immediately calls synchronous restore code instead of offloading it.
- That means the long restore path can block the loop that also serves `/healthz`.

## 7. Whether restore should be moved to a threadpool/background execution boundary
- Yes.
- The smallest safe backend repair is to move the long restore file operations off the request/event-loop thread.
- The preferred low-risk shape is to make the restore routes synchronous `def` handlers or explicitly offload the restore call into a threadpool.
- A full async job system is not required for this pass.

## 8. Whether renderer health should suppress false offline during known long restore operations
- Yes, but only as a follow-on guard if the backend offload does not eliminate the false-offline flip.
- The preferred first fix is backend responsiveness.
- If the UI still flips offline during an in-progress restore, the renderer should downgrade the offline banner or suppress the definitive failure copy while a restore-as-copy request is active.

## 9. Whether contradictory failure/success toasts can occur
- Yes.
- The restore can later succeed after the UI has already shown an offline or failure state from the health probe.
- That produces contradictory user-facing feedback: a timeout/offline warning followed by a success toast.
- The repair should prevent the health cascade from being interpreted as a restore failure while the restore is still in flight.

## 10. Smallest safe repair
- Backend first: offload the long restore copy work so `/healthz` remains responsive during the restore.
- Renderer second: prevent the health timeout from being surfaced as a definitive restore failure while the restore is still pending.
- Do not widen the generic health timeout as the only fix.
- Do not introduce a full async job/progress architecture.

## 11. Authorized implementation files
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/backup_service.py` if the backend needs a small helper boundary
- `services/src/blackskies/services/restore_service.py` if the restore path needs a helper boundary
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/hooks/useServiceHealth.ts` only if the health model needs a narrow restore-in-progress guard
- `app/shared/ipc/services.ts` only if a tiny restore-progress/outcome field is added
- `app/main/preload.ts` only if the bridge payload must carry that new field

## 12. Files not authorized
- `app/tests/e2e/phase5-export-integrity-flow.spec.ts`
- `docs/audits/phase28/*`
- `docs/memory-lab/roadmap.md`
- Any full async-job system scaffolding
- Any global health-timeout inflation as the sole fix

## 13. Tests required
- Backend concurrency test showing the restore route does not starve `/healthz` during a long restore.
- Restore success test still passes for backup restore and ZIP restore.
- Restore timeout/blocked-reason tests from Pass 147 remain intact.
- Renderer test showing the offline banner or failure copy is not contradictory while restore is in flight.
- `pnpm --filter app test`
- `pnpm --filter app build`
- `python -m pytest services/tests/unit/test_restore_service.py services/tests/test_backups.py services/tests/test_app.py -k "restore or backup"`

## 14. Manual validation checklist
- Start the backend and the app.
- Trigger `Restore backup as copy` for a known-good backup.
- While the restore is running, verify `/api/v1/healthz` still responds or at least no longer starves for the entire restore window.
- Verify the UI does not switch to a definitive offline/failure state that later contradicts a successful restore.
- Confirm only one final restore outcome is presented.
- Confirm the sibling restored folder exists and contains `project.json` and `outline.json`.

## 15. Whether the current restore-as-copy implementation can be committed before this repair
- No.
- The human evidence now shows the implementation is functionally viable but the user experience is contradictory during long restores.
- Commiting before this repair would preserve a known health-cascade defect.

## 16. Final verdict
- `READY FOR RESTORE HEALTH-CASCADE IMPLEMENTATION`
