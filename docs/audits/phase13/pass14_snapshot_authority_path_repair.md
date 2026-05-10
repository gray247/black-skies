# Phase 13 Pass 14 - Snapshot Authority / Path Repair

Date: 2026-05-09

## Summary

Pass 14 investigated human-verification failures around manual snapshot creation, snapshot verification reports, reveal actions, manifest actions, toast actions, and snapshot status display.

The failures were not only stale copy. They came from split snapshot authority:

- manual snapshot creation copied generated snapshot/recovery artifacts back into new snapshots, which could create recursive growth and timeout;
- verification could succeed without persisting the report file that the GUI expected;
- renderer actions constructed snapshot, manifest, and report paths by string concatenation;
- the preload bridge swallowed `shell.openPath` failures instead of returning structured results;
- snapshot creation toasts used report language even though creation does not create a verification report;
- unknown/unverified snapshots displayed alongside clean-verification wording.

The repair keeps the existing GUI structure and feature flags intact. It narrows the change to snapshot/report path authority, report persistence, structured reveal failures, and status display.

## Human Verification Failures

| Failure | Evidence | Root cause | Fixed |
| --- | --- | --- | --- |
| Snapshot creation timed out after 45000 ms | Human verification toast: "Snapshot creation failed" / "No snapshot was created. Request timed out after 45000ms." | `create_snapshot()` excluded `.snapshots` and `exports`, but still copied `history/snapshots` and `backups`, allowing generated recovery/backup material to be pulled into manual snapshots. Large or recursive generated artifacts could make creation exceed the renderer timeout. | Yes |
| Reveal opened Windows path error | Human verification: Windows could not find a `.snapshots\ss_...` path or a truncated/relative path. | `SnapshotsPanel.tsx` built reveal paths with string concatenation and the preload bridge passed paths directly to `shell.openPath` without existence checks or structured failure reporting. | Yes |
| Manifest opened Windows path error | Human verification: Windows could not find `manifest.json` or a malformed path. | Manifest used the same fragile reveal path flow and did not check the manifest file before asking the OS to open it. | Yes |
| View full report unavailable | Human verification toast: "Verification report unavailable" / "Snapshot directory could not be located." | `/backup_verifier/run` returned a verification result but did not persist `.snapshots/last_verification.json`; GUI report actions expected that file. The snapshot row action also mixed "full report" language with snapshot metadata display. | Yes |
| Snapshot/verification toast action unreliable | Human verification: "View snapshot report" did not reliably open the report, panel, or file. | Snapshot creation toast used report language and attempted to reveal a snapshot path even though creation does not create a report. Verification report opening and panel opening did not share canonical path behavior. | Yes |
| `UNKNOWN` plus "No verification issues recorded." | Human verification: snapshot card showed both `UNKNOWN` and clean-verification text. | Missing verification metadata was mapped to an unknown badge while the detail text used clean-result wording. | Yes |
| Re-run verification works while report paths fail | Human verification: re-run verification reported latest snapshot verified, but report/reveal paths failed. | Verification engine could return success in memory, while the report endpoint and GUI report action looked for an unpersisted `.snapshots/last_verification.json`. | Yes |
| Focus button appears useless | Human verification note. | Not part of snapshot/report path authority. | Not changed in this pass |

## Files Changed

- `app/main/preload.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/utils/revealPathFeedback.ts`
- `app/renderer/vitest.setup.ts`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `app/shared/ipc/services.ts`
- `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`
- `scripts/truth-with-backend.mjs`
- `services/src/blackskies/services/routers/backup_verifier.py`
- `services/src/blackskies/services/snapshots.py`
- `services/tests/test_backup_verifier_report.py`
- `services/tests/test_snapshot_endpoints.py`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase13/pass14_snapshot_authority_path_repair.md`

## Behavior Before

- Manual snapshot creation could include generated snapshot/recovery/backup artifacts under `history/snapshots` and `backups`.
- Backup verification returned a report but did not persist `.snapshots/last_verification.json`.
- Snapshot creation toast offered `View snapshot report`, despite no report being created by snapshot creation.
- Snapshot row report/details controls implied a full report even when only snapshot metadata was available.
- Reveal and manifest actions could pass malformed, relative, or missing paths to the OS.
- `shell.openPath` errors were not surfaced to the renderer.
- Missing snapshot directory, missing manifest, and missing report failures could degrade into raw Windows dialogs or vague unavailable messages.
- Unverified snapshots could display `Unknown` with `No verification issues recorded.`

## Behavior After

- Manual snapshot creation excludes `.snapshots`, `exports`, `backups`, and `history/snapshots`.
- Backup verification persists the latest report to `.snapshots/last_verification.json`.
- Snapshot creation toast action is `Open snapshots panel` and no longer attempts to open a nonexistent report.
- Verification toast keeps `View snapshot report` for opening the panel and `Open report file` for opening the canonical report file.
- Snapshot row action label is `View snapshot details`, reserving report wording for file-backed verification reports.
- Renderer path actions resolve project-relative paths through a shared helper before reveal/open.
- Snapshot directory, manifest, and report paths are checked before the OS bridge is invoked.
- Preload returns structured reveal results:
  - `PATH_MISSING`
  - `OPEN_FAILED`
  - `UNKNOWN`
- Non-empty `shell.openPath` error strings are returned to the renderer instead of being swallowed.
- Missing snapshot directory, manifest, and report paths show specific renderer toasts.
- Unverified snapshots display `Not verified` and explain that the snapshot has not been verified yet.
- Verified clean snapshots display `OK` and `No verification issues recorded.`

## Tests Added Or Updated

- `AppSnapshotsVerification.test.tsx`
  - verifies missing snapshot directory does not call the OS bridge and shows a clear error;
  - verifies missing manifest does not call the OS bridge and shows a clear error;
  - verifies missing report does not call the OS bridge and shows a clear error;
  - verifies canonical report path is used when the report exists;
  - verifies unverified snapshots do not show clean-verification wording;
  - updates details/report label expectations.
- `AppPreflight.test.tsx`
  - verifies snapshot creation toast opens the snapshots panel and does not reveal a snapshot path as if a report existed.
- `gui.snapshot_verification_flow.spec.ts`
  - updates the snapshot creation toast action expectation to `Open snapshots panel`;
  - updates snapshot row action expectation to `View snapshot details`.
- `test_snapshot_endpoints.py`
  - verifies manual snapshot creation excludes generated snapshot/recovery and backup artifacts.
- `test_backup_verifier_report.py`
  - verifies backup verification run persists the latest report file.
- `vitest.setup.ts`
  - updates the default reveal-path mock to the structured bridge result.
- `truth-with-backend.mjs`
  - accepts the Phase 12 canonical `Generate saved rewrite` label in the truth harness.

## Validation Results

| Command | Result |
| --- | --- |
| `pnpm --filter app test -- AppSnapshotsVerification.test.tsx AppPreflight.test.tsx AppRestore.test.tsx AppRecovery.test.tsx` | Passed |
| `pytest services/tests/test_snapshot_endpoints.py services/tests/test_backup_verifier_report.py services/tests/test_backup_snapshot_regressions.py` | Passed |
| `pnpm --filter app test` | Passed |
| `pnpm --filter app lint` | Passed with existing ESLintRC deprecation warning |
| `pnpm --filter app run build:production` | Passed |
| `pnpm --dir app exec playwright test tests/e2e/gui.snapshot_verification_flow.spec.ts -c ./playwright.config.ts` | Passed |
| `pnpm test:truth` | Passed after stale harness selector was updated from `Generate rewrite` to `Generate saved rewrite` |
| `git diff --check` | Passed |
| `git status` | Dirty with intended Pass 14 changes only |

## Remaining Risks

- Snapshot creation can still be slow for legitimately large projects; this pass removes recursive generated-artifact copying rather than raising the 45000 ms timeout.
- The old/default GUI still has multiple snapshot-related entry points. This pass clarified path authority and status behavior but did not redesign or consolidate the toolbar.
- Existing historical snapshots that already contain stale or malformed metadata may still show missing-path errors. The GUI now reports those failures clearly instead of invoking raw OS errors.
- The Focus button was not changed. It remains a separate GUI-authority concern outside this snapshot/report path repair.
- Operator verification should still check the full create, verify, report, reveal, and manifest flow on Windows because the original failures were manually observed there.

## Human Verification Recommendation

Human verification should restart from the snapshot section, beginning with a fresh manual snapshot creation and continuing through:

1. snapshot creation;
2. snapshot verification;
3. report panel action;
4. report file open action;
5. reveal snapshot folder;
6. open manifest;
7. status display for unverified, clean verified, and issue/error states if available.

Earlier non-snapshot editorial checks do not need to restart solely because of this pass.
