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
- Restore-latest ZIP-as-copy failure: backend request validation failed after the preload bridge sent a payload shape the route does not accept. The likely immediate mismatch is `restore_as_new` from `app/main/preload.ts` versus the backend model field `restoreAsNew` in `services/src/blackskies/services/routers/restore.py`.
- Visible failure details: the confirmation wording correctly promised a new sibling copy and no overwrite; the restore attempt then produced `Project restore failed`, `Request validation failed`, and a visible trace ID.
- DevTools noise note: `Autofill.setAddresses` appeared in console output, but nothing in the current evidence ties it to the restore failure.
- UX trust debt: snapshot-panel trust signals remain a Phase 17 GUI issue unless the operator later proves a current semantic overtrust contradiction.
- Continuity still pending: project-switch and floating-pane continuity verification are now complete; broader continuity work remains only if later receipts uncover additional gaps.
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
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

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
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

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
- Fixture or real project:
- localStorage/session state:
- Expected result:
- Actual result:
- Authority layers observed:
- Screenshot/log reference:
- Failure classification:
- Follow-up RDM IDs:
- Notes:

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

- Any receipts deferred to Phase 15: backup timeout remains deferred as an operational-risk item, pending reproduction; restore-latest ZIP-as-copy is a likely Phase 15 restore-hardening item unless the operator accepts the preload payload mismatch as an explicit deferred defect.
- Any receipts requiring implementation fixes: restore-latest ZIP-as-copy likely requires a preload payload contract fix.
- Any receipts requiring wording-only fixes: snapshot-panel trust wording remains under Phase 17 GUI debt review.
- Any receipts requiring reopening semantic reconciliation: none proven in this pass.
- Any receipts that remained blocked: none from the latest operator update.
- Whether the packet is complete: partially, but not closure-ready because restore-latest failed and must be deferred or fixed before final closure.
