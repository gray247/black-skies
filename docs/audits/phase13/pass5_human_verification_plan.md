# Phase 13 Pass 5 - Human Verification Plan

Status: Planned checklist only
Reviewed: 2026-05-09

## Summary

This is a manual verification checklist for the current editorial workflow truth model. It is not an execution report. The goal is to confirm that the runtime text, workflow labels, and contract docs still describe the same behavior.

## Manual Verification Checklist

| Check | Evidence to collect | Expected result | Failure meaning | Follow-up pass candidate |
| --- | --- | --- | --- | --- |
| Critique is advisory and non-mutating | Open critique from the workspace header and inspect the result before rewrite. Capture the modal text and the draft state. | Critique copy says advisory/review, and no draft mutation occurs before rewrite. | The critique path is pretending to save or mutate draft text. | Re-open the editorial workflow contract and renderer copy pass. |
| Saved rewrite is distinct from synced renderer view | Run critique, generate the saved rewrite, and inspect the modal before and after sync. Capture the button labels and the status text. | The UI says `Saved rewrite` and `Sync draft view`, and sync only aligns the local renderer view. | The UI blurs saved rewrite with local sync or implies persistence only after sync. | Re-open rewrite/sync label review. |
| Rewrite failure copy is truthful | Force or observe a rewrite conflict and capture the error text. | The error says the rewrite was not saved and points the user to refresh or rerun critique. | The UI hides whether the rewrite was saved or implies a generic failure. | Re-open error visibility and rewrite conflict wording. |
| Snapshot and recovery copy stay separate from rewrite copy | Open snapshots, create a snapshot, inspect report labels, and inspect restore labels. | The UI says `View snapshot report`, `Restore latest ZIP as copy`, `Restore backup`, and `Current project restored from latest snapshot.` | Snapshot copy is implying a rewrite, a save, or a sync. | Re-open snapshot / recovery wording. |
| Restore-as-copy semantics are explicit | Trigger ZIP restore copy behavior and inspect the result surface. | The UI clearly says the ZIP restore is a copy and does not imply overwriting the current project. | Restore sounds destructive or revision-like when it is a recovery copy. | Re-open recovery contract and restore wording. |
| No hidden persistence behavior changed | Compare the current draft before and after critique, rewrite, sync, snapshot, export, and restore actions. | Only the documented actions mutate persistence; advisory surfaces stay non-mutating. | An advisory surface is silently changing draft data or recovery state. | Re-open authority model and any affected renderer tests. |
| Docs match runtime labels | Compare modal/header/toast text with `docs/specs/editorial_workflow_contract.md` and `docs/phases/phase12_runtime_audit.md`. | Runtime copy and docs use the same saved/synced/recovery language. | Docs and runtime now describe different state authority. | Re-open docs alignment and copy review. |
| Workflow trigger expectations are still true | Inspect workflow behavior for `main`, `phase-b2-memory-lab`, and `phase13-planning-audit`. | Pushes to `main` and `phase-b2-memory-lab` trigger the current workflows; `phase13-planning-audit` does not on push. | The CI trigger matrix has drifted from the workflow files. | Re-open workflow trigger audit. |
| Deferred ledger is sane | Inspect `docs/BLACK_SKIES_FIX_TRACKER.md` and the Phase 12 deferred sections in the audit docs. | Deferred items are still classified as deferred, frozen, merged elsewhere, implemented, or obsolete/cancelled only. | Future work was silently promoted or erased. | Re-open deferred-ledger reconciliation. |
| Test confidence matches the contracts | Read the Phase 13 test audit and compare it to the actual renderer/service tests. | Tests cover the named contracts and the weak spots are known. | The test suite is being treated as stronger than the actual evidence supports. | Re-open the test integrity audit and add a targeted contract test later. |

## Evidence To Collect During Human Verification

- Screenshot or screen recording of the critique modal before sync.
- Screenshot or screen recording of the saved rewrite view and the sync action.
- Screenshot or screen recording of a rewrite conflict toast or modal.
- Screenshot or screen recording of snapshot and restore labels.
- A short note that the current draft did or did not change after each action.
- A quick comparison of runtime labels against the Phase 12 contract docs.
- Current `git status` and workflow trigger expectation notes.

## Expected Result For Each Check

- The runtime should keep the saved rewrite, sync, snapshot, export, and recovery concepts distinct.
- The advisory critique path should stay non-mutating.
- The saved rewrite should still be described as saved before sync runs.
- Restore copy should make the project/file effect explicit.
- Deferred work should still read as deferred, not secretly implemented.

## Failure Meaning For Each Check

- If critique mutates the draft, the editorial contract is broken.
- If sync sounds like save, the workflow truth is unclear.
- If snapshot sounds like rewrite, the recovery contract is blurred.
- If restore sounds like authoring, recovery can be misunderstood as editorial mutation.
- If docs and runtime labels diverge, the contract is stale.
- If workflow triggers differ from the inspected YAML, CI expectations are stale.
- If deferred items have changed classification without documentation, roadmap discipline has drifted.

## Follow-Up Pass Candidates If A Check Fails

- Editorial workflow contract review
- Rewrite / sync label review
- Snapshot / recovery relationship review
- Workflow trigger audit
- Deferred ledger reconciliation
- Test integrity audit

## Phase 13 Exit Criteria Draft

### What was proven

- Repository integrity is stable enough for the current audit lane.
- Test coverage maps to named editorial and recovery contracts.
- Workflow triggers match the current branch filters.
- The recent Codex speed-run stayed within the documented editorial boundary.

### What was deferred

- Rich diff UI
- Persistent revision history
- Provenance storage
- Recovery preview / dry-run restore
- Any future memory, graph, local LLM, or command-middleware system

### What became obsolete

- Any older wording that blurs critique, rewrite, sync, snapshot, or export authority.
- Any stale assumption that saved rewrite is still only a candidate after the backend route succeeds.

### What must not expand until later

- Backend behavior
- Project format
- Rewrite persistence rules
- Workflow behavior
- Command middleware
- Memory / graph / local LLM systems
- Split Command default promotion

