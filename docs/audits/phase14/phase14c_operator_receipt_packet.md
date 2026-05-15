# Phase 14C Operator Receipt Packet

Status: Produced
Canonical role: Receipt template and evidence-capture packet for Phase 14C human verification.
Scope: Standardize the operator record for continuity-sensitive, restore-sensitive, and authority-sensitive verification runs.
Owns: The receipt form, capture checklist, evidence labels, and operator notes needed to record 14C honestly.
Does not own: Verification execution, runtime behavior changes, or closure decisions.
Upstream dependencies: [human_verification_receipt_and_checkpoint_design.md](/C:/Dev/black-skies/docs/audits/phase14/human_verification_receipt_and_checkpoint_design.md), [human_verification_planning_for_continuity_sensitive_flows.md](/C:/Dev/black-skies/docs/audits/phase14/human_verification_planning_for_continuity_sensitive_flows.md), [phase14c_human_verification_execution_plan.md](/C:/Dev/black-skies/docs/audits/phase14/phase14c_human_verification_execution_plan.md), [phase14b_stop_gate_checklist.md](/C:/Dev/black-skies/docs/audits/phase14/phase14b_stop_gate_checklist.md), [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
Downstream dependencies: Operator-completed receipts, archived screenshots/logs, tracker follow-up, and any Phase 15 escalation entries.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

## Receipt Template

```text
Verification ID:
Date/Time:
Operator:
Branch:
Commit hash:
Worktree state:
Shell:
Repo root:
Project root:
Fixture or real project:
localStorage/session state:
Synthetic/harness/stub surfaces present:
Flow tested:
Expected result:
Actual result:
Authority layers observed:
Evidence source: Current runtime run | Persisted report read | Renderer witness | Mixed
Screenshots attached:
Logs attached:
Outcome: Pass | Fail | Blocked
Failure bucket:
Escalation required:
Escalation target:
Notes:
```

## Mandatory Capture Rules

- record one receipt per flow or tightly related flow bundle
- separate restore evidence from continuity evidence unless the operator explicitly records them as one bundle
- never write a receipt from memory after the fact if screenshots or logs are available
- if a flow is blocked, record the blocking reason instead of forcing a pass/fail label
- if the evidence source is mixed, state which parts came from current runtime and which came from persisted records
- real local projects are required for authority and continuity closure claims
- fixtures may be used only as secondary comparison evidence
- restore-latest must use its own receipt section
- floating-pane reload/rebind is observation-only in 14C and must not be fixed in the receipt pass

## Evidence Labels

Use these labels in the receipt:

- `Current runtime run`
- `Persisted report read`
- `Renderer witness`
- `Mixed`

Use these authority labels in the receipt:

- `A1` real filesystem/runtime
- `A2` real backend service
- `A3` canonical persisted records
- `A4` renderer/UI state
- `A5` harness/fixture state
- `A6` synthetic mode
- `A7` mock/stub behavior

## Screenshot Rules

- capture screenshots for every trust-sensitive transition
- capture before/after shots for project switch, reopen, restore, and floating-pane rebind
- capture the visible report or recovery banner whenever it is part of the claim
- screenshots are not repo-tracked by default
- if screenshots are not captured, the receipt must explain why
- if a specific failure requires permanent audit evidence, screenshots may be committed intentionally and marked as promoted evidence rather than incidental operator files

## Log Rules

- include any runtime warnings, error text, or trace identifiers that explain the result
- include a note when the UI and runtime disagree, even if the flow otherwise completes
- include the exact wording of any trust-sensitive labels that mattered to the operator
- include a short note when the run depended on synthetic hooks, stubs, or fixture-only behavior

## Flow Receipt Sections

Use the following receipt sections in the execution packet. Each section must record:

- expected claim
- forbidden claim
- authority layers observed
- evidence required
- outcome options: `Pass`, `Fail`, `Blocked`
- screenshot/log reference field
- follow-up `RDM-*` IDs
- whether fixture evidence is allowed
- whether real project evidence is required

### Project Load

- Expected claim: the active project opens at the correct root without stale recent-project contamination.
- Forbidden claim: a load route proves cross-project cleanliness or long-lived continuity.
- Authority layers observed: `A1`, `A3`, `A4`.
- Evidence required: real local project evidence, operator note, screenshot of the initial loaded state, and any path/root indicator visible in UI.
- Screenshot/log reference field: startup state, active project label, visible path or root indicator.
- Follow-up `RDM-*` IDs: `RDM-CONTINUITY-001`, `RDM-ALIAS-001`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

### Project Switch

- Expected claim: switching projects clears or rebinds visible state cleanly.
- Forbidden claim: a successful switch route proves pane, preview, or cache hygiene.
- Authority layers observed: `A1`, `A3`, `A4`, `A5`.
- Evidence required: real local project evidence, before/after screenshots, and note of any pane or preview carryover.
- Screenshot/log reference field: source project, target project, stale-pane state, final visible project identity.
- Follow-up `RDM-*` IDs: `RDM-CONTINUITY-001`, `RDM-ALIAS-001`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

### Recovery Snapshot Restore

- Expected claim: the restore action behaves honestly about the current restore context and completion state.
- Forbidden claim: browseability or report presence means restore safety.
- Authority layers observed: `A1`, `A2`, `A4`.
- Evidence required: real local project evidence, restore banner/surface screenshot, and completion screenshot if the UI changes.
- Screenshot/log reference field: restore affordance, confirmation dialog if present, completion state, toast or banner text.
- Follow-up `RDM-*` IDs: `RDM-RESTORE-001`, `RDM-CONTINUITY-001`.
- Fixture evidence allowed: no for closure; comparison only if needed.
- Real project evidence required: yes.

### ZIP Restore-As-Copy

- Expected claim: a restored copy is clearly presented as a new materialized folder, not as an implied safety certification.
- Forbidden claim: copy creation proves source integrity or full continuity.
- Authority layers observed: `A1`, `A2`, `A4`.
- Evidence required: real local project evidence, confirmation dialog screenshot, result screenshot, and destination folder open/reveal evidence when relevant.
- Screenshot/log reference field: copy-target wording, created-folder wording, open-folder affordance.
- Follow-up `RDM-*` IDs: `RDM-RESTORE-001`, `RDM-BACKUP-001`.
- Fixture evidence allowed: no for closure; comparison only if needed.
- Real project evidence required: yes.

### Backup Restore

- Expected claim: restore from backup is bounded, explicit, and not confused with browseability or historical record access.
- Forbidden claim: a backup exists therefore the restore target is safe.
- Authority layers observed: `A1`, `A2`, `A4`.
- Evidence required: real local project evidence, backup list screenshot, restore confirmation screenshot, and post-restore state screenshot.
- Screenshot/log reference field: target name, destination path, restore success or failure toast.
- Follow-up `RDM-*` IDs: `RDM-RESTORE-001`, `RDM-BACKUP-001`.
- Fixture evidence allowed: no for closure; comparison only if needed.
- Real project evidence required: yes.

### Restore-Latest

- Expected claim: the latest restore affordance matches the current project and does not imply universal trust.
- Forbidden claim: latest means safe, fresh, or root-correct without verifying the current context.
- Authority layers observed: `A1`, `A2`, `A3`, `A4`.
- Evidence required: real local project evidence, before/after screenshots, and explicit note of which snapshot or backup was treated as latest.
- Screenshot/log reference field: latest-selection evidence, target label, visible restore outcome.
- Follow-up `RDM-*` IDs: `RDM-RESTORE-001`, `RDM-BACKUP-001`, `RDM-BROWSE-001`.
- Fixture evidence allowed: no for closure; comparison only if needed.
- Real project evidence required: yes.

### Reopen After Restore

- Expected claim: reopen lands on the restored project without stale recent-project carryover.
- Forbidden claim: reopen correctness proves all reload or restart behavior.
- Authority layers observed: `A1`, `A3`, `A4`.
- Evidence required: real local project evidence and reopen-after-restore screenshot sequence.
- Screenshot/log reference field: restored state, reopen action, resulting project identity.
- Follow-up `RDM-*` IDs: `RDM-CONTINUITY-001`, `RDM-ALIAS-001`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

### Continuity After Restore

- Expected claim: post-restore state remains coherent across visible panes and project identity.
- Forbidden claim: one clean surface proves full continuity.
- Authority layers observed: `A1`, `A3`, `A4`, `A5`.
- Evidence required: real local project evidence, screenshot pair after restore and after a short interaction sequence.
- Screenshot/log reference field: panel state, project label, visible preview or report carryover.
- Follow-up `RDM-*` IDs: `RDM-CONTINUITY-001`, `RDM-ALIAS-001`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

### Degraded Restore State

- Expected claim: degraded states remain visibly degraded and do not pretend to be healthy.
- Forbidden claim: degraded means broken, or degraded state can be trusted as healthy.
- Authority layers observed: `A1`, `A2`, `A4`.
- Evidence required: real local project evidence, degraded-state screenshot, and note of the exact wording shown.
- Screenshot/log reference field: degraded banner, disablement state, explanation copy.
- Follow-up `RDM-*` IDs: `RDM-GUI-001`, `RDM-SNAP-003`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

### Stale Verification / Report State

- Expected claim: stale historical evidence is labeled as stale or historical-only, not current.
- Forbidden claim: historical evidence implies current integrity or current freshness.
- Authority layers observed: `A3`, `A4`, with `A1` or `A2` where current backing is needed.
- Evidence required: real local project evidence, screenshot of the stale/history surface, and note of the visible label.
- Screenshot/log reference field: stale label, historical-only label, current-status comparison if visible.
- Follow-up `RDM-*` IDs: `RDM-SNAP-001`, `RDM-SNAP-002`, `RDM-GUI-001`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

### Reveal / Open / Report Affordance Behavior

- Expected claim: local reveal/open/report actions behave as access actions, not truth claims.
- Forbidden claim: open/reveal means verified, restorable, or safe.
- Authority layers observed: `A1`, `A4`.
- Evidence required: real local project evidence and screenshots of the action labels and resulting file or folder open.
- Screenshot/log reference field: button labels, target type, open result.
- Follow-up `RDM-*` IDs: `RDM-BROWSE-001`, `RDM-SNAP-001`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

### Floating-Pane Reload / Rebind Observation

- Expected claim: floating panes reload and rebind to the current project rather than stale state.
- Forbidden claim: a docked or floated pane proves continuity just because it opened.
- Authority layers observed: `A3`, `A4`, `A5`.
- Evidence required: real local project evidence, pane state screenshot before reload, and screenshot after reload/rebind.
- Screenshot/log reference field: pane identity, project identity, visible stale content.
- Follow-up `RDM-*` IDs: `RDM-CONTINUITY-001`, `RDM-WRAPPER-001`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

### Preload / Runtime / Renderer Agreement

- Expected claim: the visible UI, preload bridge, and runtime evidence remain aligned in the live operator session.
- Forbidden claim: harness-only preload success proves live agreement.
- Authority layers observed: `A2`, `A4`, `A5`, with `A1` where filesystem claims appear.
- Evidence required: real local project evidence, visible UI screenshot, and operator note about bridge or runtime mismatch.
- Screenshot/log reference field: visible label, action state, diagnostic text.
- Follow-up `RDM-*` IDs: `RDM-WRAPPER-001`, `RDM-CONTINUITY-001`, `RDM-TRUTH-001`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

### Light Recovery Observation

- Expected claim: a light, deterministic recovery observation restores the operator to a coherent, honest state.
- Forbidden claim: a crash path is stable just because recovery appears once.
- Authority layers observed: `A2`, `A4`, `A5`.
- Evidence required: real local project evidence, pre-recovery and post-recovery screenshots, and a note describing whether the path was deterministic and non-destructive.
- Screenshot/log reference field: recovery banner, reopen state, recovery action outcome.
- Follow-up `RDM-*` IDs: `RDM-CONTINUITY-001`, `RDM-RESTORE-001`.
- Fixture evidence allowed: yes, only as secondary comparison.
- Real project evidence required: yes.

## Expected Packet Contents

For each operator bundle, the packet should contain:

- the receipt entry itself
- any screenshots collected for that bundle
- any logs collected for that bundle
- a short operator summary of the claim being tested
- a note for anything deferred to Phase 15

## Classification Guidance

When the flow fails, assign one primary bucket:

- semantic mismatch
- authority mismatch
- continuity defect
- stale-state contamination
- renderer/preload disagreement
- reopen/rebind defect
- restore trust overclaim
- degraded-state dishonesty
- harness-only contradiction
- operator-trust contradiction

If more than one bucket seems plausible, choose the one that best explains what the operator actually saw.

## Stop Rules

Stop the operator run and record escalation if:

- the UI implies stronger trust than the evidence supports
- a restore or continuity flow becomes ambiguous
- the operator can no longer tell current evidence from historical evidence
- a new contradiction appears that would make the rest of the packet misleading
- the flow starts requiring implementation changes rather than observation

## Closure Checklist

Before marking a packet complete, confirm:

- every intended flow has a receipt entry
- every receipt entry has an outcome
- every failure has a bucket
- every blocked flow has a reason
- every screenshot set is either attached or explicitly unavailable
- every log set is either attached or explicitly unavailable
- any Phase 15 escalation target is named

## Operator Decisions Applied

- screenshots are operator evidence by default and are not repo-tracked unless a specific failure needs permanent audit evidence
- real local projects are required for authority and continuity closure claims
- fixtures may be used only as secondary comparison evidence
- destructive or chaotic crash testing is deferred to Phase 15
- light deterministic recovery observation may be attempted in 14C
- restore-latest has its own dedicated receipt section
- floating-pane reload and rebind is mandatory observation-only verification in 14C
