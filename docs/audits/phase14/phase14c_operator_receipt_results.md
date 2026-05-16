# Phase 14C Operator Receipt Results

Status: Blank scaffold.
Purpose: Fill this in only with actual operator evidence.
Rule: Do not prefill outcomes, claims, or classifications without recorded operator results.

## Reconciliation Summary

- Path sanity: `docs/auds/phase14/phase14c_operator_receipt_results.md` does not exist, so no merge or move was required.
- Confirmed passes: authority semantics appear aligned; missing-manifest and missing-directory semantics appear correctly scoped.
- Operational defect observed: backup creation timeout, classified here as an operational-risk deferred item until the operator reproduces it with a narrower, stable lane.
- Transient state observed: writing-tools offline/checking state, classified here as a startup-race issue pending reproducible isolation.
- Confirmed operator passes: project switch passed; floating-pane reload/rebind passed.
- Restore-latest ZIP-as-copy failure: the observed failure was a frontend/preload payload mismatch, but the first source-level fix was incomplete because the live emitted preload bundle still serialized `project_id` and `zip_name`. The backend route model expects `projectId` and `zipName`, so the live bundle had to be regenerated before the next operator rerun.
- Restore-latest rerun on 2026-05-15 moved past the earlier 400 validation failure and reached the backend route, confirming the payload-contract repair from commit `c387baf` plus the rebuilt preload bundle. The new observed failure was `POST /api/v1/restore -> 404 Not Found` with `No ZIP archives found for this project`.
- Root-cause classification after source inspection: backup listing and restore-latest were reading different archive sources. The snapshots/backups panel listed `backups/BS_20260510_012516.zip` from the long-term backup store, while omitted-`zipName` restore-latest only searched `<project>/exports/` and never consulted the same backup-bundle source.
- Follow-up fix on 2026-05-15: omitted-`zipName` restore-latest now resolves the newest project backup bundle from the same `backups/BS_*.zip` source used by backup listing, then falls back to `<project>/exports/` only if no project backup bundle exists. Operator rerun is still required.
- Restore-latest operator follow-up on 2026-05-16 confirmed ZIP existence and narrowed the next failure. PowerShell evidence showed `C:\Dev\black-skies\sample_project\backups` contained `BS_20260419_195305.zip` (`148,989` bytes), `BS_20260510_012516.zip` (`66,791,388` bytes), and `BS_20260515_171727.zip` (`69,571,056` bytes); `sample_project\Esther_Estate\exports` had no ZIPs and `sample_project\Esther_Estate\backups` did not exist. The expected latest restore candidate was therefore `C:\Dev\black-skies\sample_project\backups\BS_20260515_171727.zip`.
- Runtime diagnosis on 2026-05-16 confirmed that `BS_20260515_171727.zip` is readable and structurally valid for the backup-restore path (`checksums.json`, `project.json`, `outline.json` present; `project_id=proj_esther_estate`), and that the actual backup restore path completes successfully. The narrow blocker was timeout/materialization budget, not ZIP absence or corruption: isolated restore timing finished in `45.442s`, just over the preload bridge default timeout of `45_000ms`.
- Follow-up fix on 2026-05-16: `/api/v1/restore` now uses a dedicated `120_000ms` bridge timeout in the preload layer. The generic timeout remains unchanged for other routes. Operator rerun is still required.
- Restore-latest operator rerun after the 120s timeout fix still failed on 2026-05-16 with `Request timed out after 120000ms.` Additional investigation confirmed the request is not stalling at response serialization or integrity validation. Timed-out May 16 attempts still created full sibling restored copies under `C:\Dev\black-skies\sample_project`, and `validate_project()` against one of those restored siblings completed in `0.026s`.
- Current root-cause classification after the 120s rerun: slow real-workspace materialization. Direct timing against the actual `sample_project` base showed both raw `BackupService.restore_backup()` and full `POST /api/v1/restore` executions running past `140s`, whereas the earlier temp-base probe finished in `45.442s`. No partial destination folders or destination-name collision buildup was observed during the in-flight operation.
- Follow-up fix on 2026-05-16: restore-only bridge timeout handling is now explicit/configurable via `BLACKSKIES_BRIDGE_RESTORE_TIMEOUT_MS` and defaults to `300_000ms`. Operator rerun is still required.
- Visible failure details: the confirmation wording correctly promised a new sibling copy and no overwrite; the restore attempt then produced `Project restore failed`, `Request validation failed`, and a visible trace ID.
- DevTools noise note: `Autofill.setAddresses` appeared in console output, but nothing in the current evidence ties it to the restore failure.
- UX trust debt: snapshot-panel trust signals remain a Phase 17 GUI issue unless the operator later proves a current semantic overtrust contradiction.
- Continuity still pending: project-switch and floating-pane continuity verification are complete; broader continuity work remains only if later receipts uncover additional gaps.
- No new RDM item is added in this pass; use existing backup, GUI, and continuity follow-up IDs if the operator later files a concrete reproduction.

## Bundle Metadata

- Branch:
- Commit hash:
- Operator:
- Worktree state:
- Repo root:
- Project root:
- Date/time started:
- Date/time finished:
- Screenshot archive location:
- Log archive location:

## Project Load

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## Project Switch

- Status: Pass
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project: Real project
- localStorage/session state: Not recorded in scaffold
- Expected result: Switch to a different project without stale authority claims
- Actual result: Switch completed successfully under operator observation
- Authority layers observed: Renderer, preload, backend project-load/switch authority
- Screenshot/log reference: Operator screenshot evidence
- Failure classification: None
- Follow-up RDM IDs:
- Notes: Operator-tested pass

## Recovery Snapshot Restore

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## ZIP Restore-As-Copy

- Status: Fail
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project: Real project
- localStorage/session state: Not recorded in scaffold
- Expected result: Create a new sibling project copy from the selected ZIP without overwriting the source
- Actual result: Failed validation after restore-latest attempt; no new copy created
- Authority layers observed: Renderer modal copy, preload bridge payload, backend restore validation
- Screenshot/log reference: Operator screenshot evidence and toast trace ID
- Failure classification: Frontend/preload payload mismatch, stale emitted bundle
- Follow-up RDM IDs:
- Notes: This receipt captured the first 2026-05-15 failure state only. Commit `c387baf` plus rebuilt preload corrected the request envelope afterwards; later rerun evidence moved the failure into backend archive lookup.

## Backup Restore

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## Restore-Latest

- Status: Fail
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project: Real project
- localStorage/session state: Not recorded in scaffold
- Expected result: Restore-latest ZIP-as-copy should create a sibling copy and surface honest restore authority
- Actual result: Four distinct staged failures were observed across May 15-16, 2026. First: `Project restore failed` with `Request validation failed` because the live preload bundle still emitted `project_id` / `zip_name`. Second: after commit `c387baf` and a rebuilt preload bundle, the rerun reached `/api/v1/restore` and failed with `404 Not Found` plus `No ZIP archives found for this project`. Third: after the lookup fix, operator evidence confirmed the latest backup bundle exists, but the live restore still timed out around `45,000ms` while materializing the restored copy. Fourth: after the restore-specific timeout was raised to `120,000ms`, the live request still timed out, but investigation confirmed that full sibling restored folders were still being created and the remaining bottleneck was the slow restore/materialization path under the real `sample_project` destination.
- Authority layers observed: Renderer modal wording, preload request serialization, backend restore validation, emitted preload bundle, backend latest-archive lookup path, preload bridge timeout budget, real-workspace materialization behavior
- Screenshot/log reference: Operator screenshot evidence and toast trace ID
- Failure classification: First failure was a frontend/preload payload mismatch with stale emitted bundle. Second failure was a backup-list versus restore-latest lookup mismatch: visible `backups/BS_20260510_012516.zip` evidence came from the long-term backup store, while restore-latest searched only `<project>/exports/`. Third failure was a restore materialization timeout: the real latest backup bundle `BS_20260515_171727.zip` is valid and restorable, but the preload bridge canceled `/api/v1/restore` at `45_000ms` before the synchronous backup restore finished. Fourth failure showed the same class persisted at `120_000ms`, with evidence that real restore attempts still completed the sibling copy and that the remaining delay was the actual materialization into `sample_project`, not response build failure.
- Follow-up RDM IDs:
- Notes: Source and emitted bundle are now aligned on `projectId`, `zipName`, and `restoreAsNew`; omitted-`zipName` restore-latest uses the same per-project backup-bundle source as backup listing before falling back to `exports/`; the restore timeout moved first to `120_000ms`; and the latest pass raised restore-only timeout handling again to a configurable `BLACKSKIES_BRIDGE_RESTORE_TIMEOUT_MS` default of `300_000ms` after confirming the real workspace restore path still exceeded `120s`. Operator rerun is still required to confirm the live receipt.

## Reopen After Restore

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## Continuity After Restore

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## Degraded Restore State

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## Stale Verification / Report State

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## Reveal / Open / Report Affordance Behavior

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## Floating-Pane Reload / Rebind Observation

- Status: Pass
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project: Real project
- localStorage/session state: Not recorded in scaffold
- Expected result: Reload/rebind the floating pane without stale authority drift
- Actual result: Observation passed under operator testing
- Authority layers observed: Renderer, preload, continuity surface
- Screenshot/log reference: Operator screenshot evidence
- Failure classification: None
- Follow-up RDM IDs:
- Notes: Operator-tested pass

## Preload / Runtime / Renderer Agreement

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## Light Recovery Observation

- Status: Not run | Pass | Fail | Blocked
- Date/time:
- Branch:
- Commit hash:
- Project used:
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

## Operator Wrap-Up

- Any receipts deferred to Phase 15: backup timeout remains deferred as an operational-risk item, pending reproduction; broader restore hardening remains Phase 15 scope beyond the payload-contract, lookup-alignment, and narrow restore-timeout fixes.
- Any receipts requiring implementation fixes: restore-latest ZIP-as-copy required four narrow repairs across 2026-05-15 and 2026-05-16: payload contract alignment (`c387baf`), latest-backup lookup alignment after the post-rerun 404, a restore-specific preload timeout increase after ZIP existence and backup-bundle validity were confirmed, and then a second restore-timeout adjustment to `300_000ms` after proving the real workspace restore path still exceeded `120s`.
- Any receipts requiring wording-only fixes: snapshot-panel trust wording remains under Phase 17 GUI debt review.
- Any receipts requiring reopening semantic reconciliation: none proven in this pass.
- Any receipts that remained blocked: none from the latest operator update.
- Whether the packet is complete: partially, but not closure-ready until the operator reruns restore-latest against the lookup-aligned backend with the updated restore-timeout budget and records the result.
