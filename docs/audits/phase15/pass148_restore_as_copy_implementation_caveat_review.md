# Pass 148 - Restore-as-Copy Implementation Caveat Review

Date: 2026-06-03

## 1. Files inspected
- `docs/audits/phase15/pass146_restore_as_copy_eligibility_contract_plan.md`
- `docs/audits/phase15/pass147_restore_as_copy_eligibility_contract_implementation.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/routers/backups.py`
- `app/shared/ipc/services.ts`
- `app/main/preload.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/main/__tests__/serviceApi.test.ts`
- `app/renderer/__tests__/AppRestore.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `services/tests/unit/test_restore_service.py`
- `services/tests/test_backups.py`
- `services/tests/test_app.py`
- `app/tests/e2e/phase5-export-integrity-flow.spec.ts`

## 2. What Pass 147 implemented
- Added a shared restore-as-copy eligibility helper in `services/src/blackskies/services/restore_service.py`.
- Threaded the eligibility decision through ZIP restore and backup restore before any sibling copy is materialized.
- Required explicit `restoreAsNew: true` on both restore-as-copy request paths.
- Returned blocked reasons through backend validation errors and surfaced them in the renderer.
- Kept snapshot in-place recovery as a separate lane.
- Updated bridge types, preload serialization, and restore CTA copy to match the copy-only contract.

## 3. Explicit caveat list
- ZIP restore does not use checksum evidence because the export ZIP contract does not provide it.
- Restore-latest still resolves source precedence internally when no filename is supplied.
- One E2E test file was updated outside the pass's explicitly authorized test slice.

## 4. Caveat classification

| Caveat | Severity | Affected file or flow | Risk if left unresolved | Recommended action |
| --- | --- | --- | --- | --- |
| ZIP restore remains checksum-free | Monitoring-only | `services/src/blackskies/services/restore_service.py` ZIP restore path; `app/renderer/components/SnapshotsPanel.tsx` copy-restore UX | Future readers may overread the copy gate as checksum-backed for ZIP exports, when the current export format still does not provide checksum evidence | Keep it documented as an intentional format limitation; revisit only if the export format gains checksum evidence |
| Restore-latest source precedence is still implicit | Non-blocking | `services/src/blackskies/services/routers/restore.py` source-selection branch | Users may expect an explicit source choice when both backups and ZIPs exist | Document the precedence in the roadmap/docs stack; defer any UI split to a later arc |
| E2E spillover outside the authorized test slice | Blocker for a clean pass boundary | `app/tests/e2e/phase5-export-integrity-flow.spec.ts` | Commit scope drifts beyond the authorized test surface for this pass, which weakens the review boundary even though the runtime contract is green | Revert or explicitly re-authorize the E2E change in a follow-up pass before committing |

## 5. Whether implementation stayed within authorized scope
- Not fully.
- Runtime changes stayed within the restore/backup/bridge/renderer surfaces authorized for the lane.
- The E2E adjustment in `app/tests/e2e/phase5-export-integrity-flow.spec.ts` falls outside the pass's stated authorized test slice.

## 6. Whether any runtime correction is needed before commit
- No runtime correction is required before commit.
- The runtime restore-as-copy contract is internally consistent and the targeted validations are green.
- The only pre-commit correction is the scope spillover in the E2E test file, which is a test-surface scope issue rather than a runtime defect.

## 7. Whether any docs correction is needed before commit
- Yes.
- `docs/BLACK_SKIES_FIX_TRACKER.md` should record this caveat classification so the pass boundary and the scope spillover are visible in the tracker.
- This audit artifact is the companion record for that tracker note.

## 8. Whether human retest is required before commit or after commit
- No human retest is required before commit.
- If the E2E spillover is removed or explicitly re-authorized, the automated validation already present is sufficient for the commit decision.
- A human retest can still be done after commit as ordinary monitoring, but it is not the gating item here.

## 9. Manual restore-as-copy retest checklist
- Open a project and confirm the snapshots panel shows restore actions only when backend availability and source data are present.
- Confirm the backup restore modal states that the current project will not be overwritten.
- Restore a known-good backup and confirm a sibling project folder is created.
- Restore a known-good ZIP and confirm a sibling project folder is created.
- Attempt a blocked restore case and confirm blocked reasons are surfaced without any folder creation.
- Confirm the current project root remains unchanged after the restore-as-copy flow.

## 10. Final commit recommendation
- `NEEDS SMALL CORRECTION BEFORE COMMIT`
- The runtime contract is ready, but the E2E spillover should be reconciled before the pass is considered clean.
