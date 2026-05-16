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
- Actual result: Three distinct staged failures were observed across May 15-16, 2026. First: `Project restore failed` with `Request validation failed` because the live preload bundle still emitted `project_id` / `zip_name`. Second: after commit `c387baf` and a rebuilt preload bundle, the rerun reached `/api/v1/restore` and failed with `404 Not Found` plus `No ZIP archives found for this project`. Third: after the lookup fix, operator evidence confirmed the latest backup bundle exists, but the live restore still timed out around `45,000ms` while materializing the restored copy.
- Authority layers observed: Renderer modal wording, preload request serialization, backend restore validation, emitted preload bundle, backend latest-archive lookup path, preload bridge timeout budget
- Screenshot/log reference: Operator screenshot evidence and toast trace ID
- Failure classification: First failure was a frontend/preload payload mismatch with stale emitted bundle. Second failure was a backup-list versus restore-latest lookup mismatch: visible `backups/BS_20260510_012516.zip` evidence came from the long-term backup store, while restore-latest searched only `<project>/exports/`. Third failure was a restore materialization timeout: the real latest backup bundle `BS_20260515_171727.zip` is valid and restorable, but the preload bridge canceled `/api/v1/restore` at `45_000ms` before the synchronous backup restore finished.
- Follow-up RDM IDs:
- Notes: Source and emitted bundle are now aligned on `projectId`, `zipName`, and `restoreAsNew`; omitted-`zipName` restore-latest uses the same per-project backup-bundle source as backup listing before falling back to `exports/`; and `/api/v1/restore` now has a dedicated `120_000ms` preload timeout to allow the observed `45.442s` materialization path to complete. Operator rerun is still required to confirm the live receipt.

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
- Any receipts requiring implementation fixes: restore-latest ZIP-as-copy required three narrow repairs across 2026-05-15 and 2026-05-16: payload contract alignment (`c387baf`), latest-backup lookup alignment after the post-rerun 404, and a restore-specific preload timeout increase after ZIP existence and backup-bundle validity were confirmed.
- Any receipts requiring wording-only fixes: snapshot-panel trust wording remains under Phase 17 GUI debt review.
- Any receipts requiring reopening semantic reconciliation: none proven in this pass.
- Any receipts that remained blocked: none from the latest operator update.
- Whether the packet is complete: partially, but not closure-ready until the operator reruns restore-latest against the lookup-aligned backend with the restore-timeout fix and records the result.
