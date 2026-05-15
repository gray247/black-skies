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
- Actual result: Two distinct 2026-05-15 failures were observed. First: `Project restore failed` with `Request validation failed` because the live preload bundle still emitted `project_id` / `zip_name`. After commit `c387baf` and a rebuilt preload bundle, the rerun reached `/api/v1/restore` and failed with `404 Not Found` plus `No ZIP archives found for this project`.
- Authority layers observed: Renderer modal wording, preload request serialization, backend restore validation, emitted preload bundle, backend latest-archive lookup path
- Screenshot/log reference: Operator screenshot evidence and toast trace ID
- Failure classification: First failure was a frontend/preload payload mismatch with stale emitted bundle. Second failure was a backup-list versus restore-latest lookup mismatch: visible `backups/BS_20260510_012516.zip` evidence came from the long-term backup store, while restore-latest searched only `<project>/exports/`.
- Follow-up RDM IDs:
- Notes: Source and emitted bundle are now aligned on `projectId`, `zipName`, and `restoreAsNew`, and omitted-`zipName` restore-latest has been repaired to use the same per-project backup-bundle source as backup listing before falling back to `exports/`. Operator rerun is still required to confirm the live receipt.

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

- Any receipts deferred to Phase 15: backup timeout remains deferred as an operational-risk item, pending reproduction; broader restore hardening remains Phase 15 scope beyond the payload-contract and lookup-alignment fixes.
- Any receipts requiring implementation fixes: restore-latest ZIP-as-copy required two narrow repairs on 2026-05-15: payload contract alignment (`c387baf`) and latest-backup lookup alignment after the post-rerun 404.
- Any receipts requiring wording-only fixes: snapshot-panel trust wording remains under Phase 17 GUI debt review.
- Any receipts requiring reopening semantic reconciliation: none proven in this pass.
- Any receipts that remained blocked: none from the latest operator update.
- Whether the packet is complete: partially, but not closure-ready until the operator reruns restore-latest against the lookup-aligned backend and records the result.
