# Phase 14C Human Verification Execution Plan

Status: Produced
Canonical role: Planning artifact for Phase 14C human verification, regression framing, execution order, and closure criteria.
Scope: Define the operator-observed verification program for continuity-sensitive, restore-sensitive, and authority-sensitive claims after Phase 14B implementation slices.
Owns: 14C structure, flow inventory, operator execution order, evidence rules, failure classification, stop/escalation rules, and closure criteria for the 14C human-verification pass.
Does not own: Runtime implementation, test implementation, behavior changes, proof doctrine, phase sequencing, or closure claims beyond the planned receipt model.
Upstream dependencies: [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md), [phase14a_operator_acceptance_record.md](/C:/Dev/black-skies/docs/audits/phase14/phase14a_operator_acceptance_record.md), [phase14b_runtime_alignment_planning_review.md](/C:/Dev/black-skies/docs/audits/phase14/phase14b_runtime_alignment_planning_review.md), [phase14b_stop_gate_checklist.md](/C:/Dev/black-skies/docs/audits/phase14/phase14b_stop_gate_checklist.md), [human_verification_receipt_and_checkpoint_design.md](/C:/Dev/black-skies/docs/audits/phase14/human_verification_receipt_and_checkpoint_design.md), [human_verification_planning_for_continuity_sensitive_flows.md](/C:/Dev/black-skies/docs/audits/phase14/human_verification_planning_for_continuity_sensitive_flows.md), [recovery_load_project_switch_continuity_audit.md](/C:/Dev/black-skies/docs/audits/phase14/recovery_load_project_switch_continuity_audit.md), [project_switch_preload_continuity_followup.md](/C:/Dev/black-skies/docs/audits/phase14/project_switch_preload_continuity_followup.md), [wrapper_launcher_cwd_audit.md](/C:/Dev/black-skies/docs/audits/phase14/wrapper_launcher_cwd_audit.md), [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md), [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
Downstream dependencies: Phase 14C operator execution, tracker updates for findings, and any Phase 15 reopen decisions triggered by human-observed contradictions.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

## Purpose

Phase 14C exists to validate the operator-facing trust claims that automation and harness lanes cannot close by themselves.

It is a bounded human-verification pass, not exploratory QA. The goal is to validate the exact claims touched by Phase 14B and to record receipts for the flows where current runtime evidence, persisted-record evidence, renderer witness, and operator trust can be mistaken for one another.

For authority and continuity closure claims in 14C, the default evidentiary source is a real local project. Fixtures may be used only as secondary comparison evidence and must not be used to close live operator-trust claims.

## 14C Structure

Recommended structure:

1. `14C.1` Receipt packet finalization and run prep
2. `14C.2` Restore and backup trust verification
3. `14C.3` Continuity and reopen verification
4. `14C.4` Degraded-state and stale-state honesty verification
5. `14C.5` Regression-only reread of authority layers and evidence gaps
6. `14C.6` Findings triage and Phase 15 escalation decision

Recommended split:

- run restore-sensitive flows separately from continuity-sensitive flows
- keep stale-state and reopen verification in a dedicated bundle after restore is observed
- treat crash/recovery as optional and only attempt a light, deterministic recovery observation if the environment is already stable enough to support a clean receipt
- defer destructive or chaotic crash testing to Phase 15
- treat floating-pane reload and rebind as mandatory observation-only verification; do not fix it in 14C

## What Human Verification Can Prove

Only a human can validate:

- whether the UI wording is honest enough for an operator to trust
- whether visible state matches the operator's expectation after restore, reopen, reload, or project switch
- whether a recovery banner, restore affordance, or report affordance creates a trust overclaim
- whether stale local state is still visible after the runtime says it should be gone
- whether renderer and preload surfaces feel aligned in the live operator session
- whether floating-pane reload and rebind behavior is actually trustworthy in the real UI
- whether restore-latest is isolated into its own receipt section and remains honest at the current project root

## What Automation Already Proved

Automation already covers the following claim families, so 14C must not redo them as human-only tasks:

- snapshot vocabulary and evidence-contract semantics from `14A`
- bounded backend/runtime authority alignment from `14B.1`
- freshness and persisted-record reconciliation from `14B.2`
- renderer/preload copy alignment from `14B.3`
- restore/copy semantics and additive restore metadata from `14B.4`
- checkpoint-stop doctrine and receipt structure preparation from `14B.5`
- harness-scoped witness tests for snapshots, restore, recovery, and continuity-adjacent behaviors

Human verification must treat those as inputs, not as closure proof for operator trust.

## Flow Inventory

### Project load

- Expected behavior: the active project opens at the correct root, without stale recent-project contamination.
- Forbidden claims: that a load route proves cross-project cleanliness or long-lived continuity.
- Expected authority layers: `A1`, `A3`, `A4`.
- Required evidence: receipt entry, operator note, and screenshot of the initial loaded state.
- Screenshot/log requirements: startup state, active project label, and any root/path indicators that are visible.
- Pass condition: the loaded project identity matches the intended root and no stale state is surfaced.
- Fail condition: wrong root, stale recents, or contradictory visible state.
- Escalation trigger: any mismatch between visible root identity and the intended project root.

### Project switch

- Expected behavior: switching projects clears or rebinds visible state cleanly.
- Forbidden claims: that a successful switch route proves pane, preview, or cache hygiene.
- Expected authority layers: `A1`, `A3`, `A4`, `A5`.
- Required evidence: receipt entry, before/after screenshot pair, and note of any pane or preview carryover.
- Screenshot/log requirements: source project, target project, stale-pane state, and final visible project identity.
- Pass condition: no visible carryover from the prior project remains.
- Fail condition: stale pane content, stale preview content, or root confusion.
- Escalation trigger: any cross-project contamination or alias-root divergence.

### Recovery snapshot restore

- Expected behavior: the restore action behaves honestly about the current restore context and completion state.
- Forbidden claims: that browseability or report presence means restore safety.
- Expected authority layers: `A1`, `A2`, `A4`.
- Required evidence: receipt entry, restore banner/surface screenshot, and completion screenshot if the UI changes.
- Screenshot/log requirements: restore affordance, confirmation dialog if present, completion state, and any toast or banner text.
- Pass condition: restore behaves as the runtime and UI claim it should, without overclaiming safety.
- Fail condition: restore succeeds while the UI overstates what was restored, or restore fails while UI implies trust.
- Escalation trigger: any restore trust overclaim, any mismatch between restore semantics and operator-visible copy.

### ZIP restore-as-copy

- Expected behavior: a restored copy is clearly presented as a new materialized folder, not as an implied safety certification.
- Forbidden claims: that copy creation proves source integrity or full continuity.
- Expected authority layers: `A1`, `A2`, `A4`.
- Required evidence: receipt entry, confirmation dialog screenshot, result screenshot, and destination folder open/reveal evidence when relevant.
- Screenshot/log requirements: copy-target wording, created-folder wording, and any open-folder affordance.
- Pass condition: the UI stays explicit that this is a copy/materialization flow.
- Fail condition: the UI implies stronger safety than the flow actually provides.
- Escalation trigger: wording that sounds like restore closure, not copy creation.

### Backup restore

- Expected behavior: restore from backup is bounded, explicit, and not confused with browseability or historical record access.
- Forbidden claims: that a backup exists therefore the restore target is safe.
- Expected authority layers: `A1`, `A2`, `A4`.
- Required evidence: receipt entry, backup list screenshot, restore confirmation screenshot, and post-restore state screenshot.
- Screenshot/log requirements: target name, destination path, and any restore success or failure toast.
- Pass condition: the user-facing flow stays explicit about what was restored and where.
- Fail condition: the UI implies restore success beyond the supported evidence.
- Escalation trigger: any mismatch between restore eligibility wording and actual runtime result.

### Restore-latest flow

- Expected behavior: the latest restore affordance matches the current project and does not imply universal trust.
- Forbidden claims: that latest means safe, fresh, or root-correct without verifying the current context.
- Expected authority layers: `A1`, `A2`, `A3`, `A4`.
- Required evidence: receipt entry, before/after screenshots, and explicit note of which snapshot or backup was treated as latest.
- Screenshot/log requirements: latest-selection evidence, target label, and the visible restore outcome.
- Pass condition: latest selection and restore outcome are consistent and honest.
- Fail condition: the latest affordance resolves to the wrong project, stale record, or confusing UI wording.
- Escalation trigger: any contradiction between the current runtime and the persisted latest record.

### Reopen after restore

- Expected behavior: reopen should land on the restored project without stale recent-project carryover.
- Forbidden claims: that reopen correctness proves all reload or restart behavior.
- Expected authority layers: `A1`, `A3`, `A4`.
- Required evidence: receipt entry and reopen-after-restore screenshot sequence.
- Screenshot/log requirements: restored state, reopen action, and the resulting project identity.
- Pass condition: reopen lands on the intended restored project and does not resurrect stale content.
- Fail condition: reopen returns to the wrong project or rehydrates stale state.
- Escalation trigger: any stale recent-project or alias-root contamination after restore.

### Continuity after restore

- Expected behavior: post-restore state remains coherent across visible panes and project identity.
- Forbidden claims: that one clean surface proves full continuity.
- Expected authority layers: `A1`, `A3`, `A4`, `A5`.
- Required evidence: receipt entry, screenshot pair after restore and after a short interaction sequence.
- Screenshot/log requirements: panel state, project label, and any visible preview or report carryover.
- Pass condition: the restored project remains coherent after basic interaction.
- Fail condition: hidden or floating state reveals stale bindings.
- Escalation trigger: any rebind failure, cross-project carryover, or hidden-pane mismatch.

### Degraded restore states

- Expected behavior: degraded states remain visibly degraded and do not pretend to be healthy.
- Forbidden claims: that degraded means broken, or that degraded state can be trusted as healthy.
- Expected authority layers: `A1`, `A2`, `A4`.
- Required evidence: receipt entry, degraded-state screenshot, and note of the exact wording shown.
- Screenshot/log requirements: degraded banner, disablement state, and any explanation copy.
- Pass condition: the UI surfaces reduced confidence honestly.
- Fail condition: the UI presents an overstrong trust claim while degraded.
- Escalation trigger: any honest-degraded failure that is copied as healthy or verified.

### Stale verification states

- Expected behavior: stale historical evidence is labeled as stale or historical-only, not current.
- Forbidden claims: that historical evidence implies current integrity or current freshness.
- Expected authority layers: `A3`, `A4`, with `A1` or `A2` where the claim needs current backing.
- Required evidence: receipt entry, screenshot of the stale/history surface, and note of the visible label.
- Screenshot/log requirements: stale label, historical-only label, and current-status comparison if visible.
- Pass condition: the app refuses to overclaim from historical records.
- Fail condition: old verification data is presented as present truth.
- Escalation trigger: any report freshness contradiction.

### Report observation versus current runtime evidence

- Expected behavior: the operator can tell whether the surface is reading a persisted record, a current runtime run, or both.
- Forbidden claims: that a report read is the same as current runtime truth.
- Expected authority layers: `A1`, `A2`, `A3`, `A4`.
- Required evidence: receipt entry and explicit note of the evidence source type observed.
- Screenshot/log requirements: report label, timestamp or freshness marker, and any visible distinction between current and historical state.
- Pass condition: the source type is obvious enough that the operator would not confuse it.
- Fail condition: the UI blurs current versus historical evidence.
- Escalation trigger: any overclaim that a report read is a fresh runtime result.

### Reveal/open/report affordance behavior

- Expected behavior: local reveal/open/report actions behave as access actions, not truth claims.
- Forbidden claims: that open/reveal means verified, restorable, or safe.
- Expected authority layers: `A1`, `A4`.
- Required evidence: receipt entry and screenshots of the action labels and resulting file or folder open.
- Screenshot/log requirements: button labels, target type, and open result.
- Pass condition: the affordance stays clearly local and non-authoritative.
- Fail condition: the UI wording implies more trust than browseability.
- Escalation trigger: any label that sounds like proof instead of access.

### Floating-pane reload and rebind observations

- Expected behavior: floating panes reload and rebind to the current project rather than stale state.
- Forbidden claims: that a docked or floated pane proves continuity just because it opened.
- Expected authority layers: `A3`, `A4`, `A5`.
- Required evidence: receipt entry, pane state screenshot before reload, and screenshot after reload/rebind.
- Screenshot/log requirements: pane identity, project identity, and any visible stale content.
- Pass condition: the floated surface rebinds cleanly.
- Fail condition: stale content, wrong project context, or missing rebind.
- Escalation trigger: any pane that survives switch/reload with the wrong authority context.

### Preload / runtime / renderer agreement observations

- Expected behavior: the visible UI, preload bridge, and runtime evidence remain aligned in the live operator session.
- Forbidden claims: that harness-only preload success proves live agreement.
- Expected authority layers: `A2`, `A4`, `A5`, with `A1` where filesystem claims appear.
- Required evidence: receipt entry, visible UI screenshot, and any operator note about bridge or runtime mismatch.
- Screenshot/log requirements: visible label, action state, and any diagnostic text the operator can inspect.
- Pass condition: the operator sees one coherent story across the surfaces.
- Fail condition: any visible disagreement among renderer, preload, or runtime claims.
- Escalation trigger: renderer/preload disagreement or a hidden harness seam becoming visible.

### Alias-root observations, if encountered

- Expected behavior: alias roots do not split the operator's trust story.
- Forbidden claims: that one alias proving a claim proves every alias.
- Expected authority layers: `A1`, `A3`, `A4`.
- Required evidence: receipt entry and explicit root-path comparison if an alias appears.
- Screenshot/log requirements: visible root, persisted record path, and the operator's note on alias behavior.
- Pass condition: aliases behave consistently for the scoped claim.
- Fail condition: root divergence or a stale alias read.
- Escalation trigger: any alias-root divergence.

### Crash / recovery continuity, if realistically testable

- Expected behavior: the crash/recovery path restores the operator to a coherent, honest state.
- Forbidden claims: that a crash path is stable just because recovery appears once.
- Expected authority layers: `A2`, `A4`, `A5`.
- Required evidence: receipt entry, pre-crash and post-recovery screenshots, and a note describing whether the path was truly realistic.
- Screenshot/log requirements: recovery banner, reopen state, and any recovery action outcome.
- Pass condition: the recovery surface is coherent and honest.
- Fail condition: the recovery path overclaims or rehydrates the wrong state.
- Escalation trigger: any hint of unrecoverable stale state, trust contradiction, or unstable harness-only behavior.

## Evidence Requirements

Each receipt entry should capture:

- verification ID
- date/time
- operator
- branch and commit hash
- worktree state
- shell and repo root
- project root and fixture status
- whether localStorage/session state was cleared, preserved, or intentionally seeded
- whether synthetic, harness, or stub surfaces were active
- the flow name
- the authority layers observed
- the exact source of the evidence
- the expected result
- the actual result
- the screenshots/logs captured
- the outcome classification
- the follow-up or escalation ID if any

Recommended archival rule:

- keep raw screenshots and logs with the receipt packet while the phase is in progress
- screenshots are not repo-tracked by default
- if a specific failure requires permanent audit evidence, screenshots may be committed intentionally after the operator decides they should become canonical audit evidence

## Failure Classification

Use one primary bucket per failure:

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

Classification guidance:

- semantic mismatch: the wording or contract is wrong even if the mechanics worked
- authority mismatch: the wrong evidence layer is being used to support the claim
- continuity defect: state failed to carry forward or reset correctly across load/switch/reload/reopen
- stale-state contamination: old local state remained visible or influential when it should not
- renderer/preload disagreement: visible UI and bridge/runtime story diverged
- reopen/rebind defect: reload or reopen landed in the wrong project or pane context
- restore trust overclaim: the flow implied stronger restore safety than the evidence supports
- degraded-state dishonesty: degraded state was shown or copied as healthy
- harness-only contradiction: test-only evidence conflicts with live runtime expectations
- operator-trust contradiction: the operator saw a problem that lower lanes did not capture

## Stop And Escalation Rules

Stop 14C immediately if:

- the next claim requires a different phase of implementation rather than human observation
- the operator cannot distinguish current-run evidence from persisted-record evidence
- any flow starts to broaden into unrelated cleanup or refactor work
- a restore or continuity path contradicts the accepted 14B semantics in a material way
- screenshots or logs reveal a trust overclaim that would mislead an operator

Escalate to Phase 15 when:

- restore-latest, backup restore, or continuity after restore remains ambiguous after human observation
- project-switch, reopen, or floating-pane rebinding is not trustworthy enough for closure
- stale-state contamination persists beyond the slice boundary
- a human-observed contradiction shows that 14B assumptions were too optimistic

Reopen semantic reconciliation when:

- the runtime wording conflicts with the accepted 14A vocabulary
- historical-only, stale, browseable, or restorable are still being conflated
- renderer copy again implies current truth from persisted evidence

Classify as implementation defect only when:

- the claim is narrow
- the evidence layer is clear
- the failure is local to the implemented slice
- the operator-observed result can be fixed without reopening Phase 14 semantics

Classify as wording-only only when:

- the mechanics are correct
- the user-facing claim is too strong, too vague, or mislabeled
- the issue can be corrected without changing runtime authority

Escalate to broader continuity work when:

- multiple flows fail the same stale-state or rebind pattern
- project load, switch, reopen, and restore all point to the same continuity gap
- the defect shows up across more than one authority layer

## Execution Strategy

Recommended operator order:

1. project load
2. project switch
3. restore snapshot
4. ZIP restore-as-copy
5. backup restore
6. restore-latest
7. reopen after restore
8. continuity after restore
9. degraded-state and stale-state checks
10. report and affordance honesty checks
11. floating-pane reload and rebind checks
12. preload / runtime / renderer agreement checks
13. alias-root checks if encountered
14. crash / recovery checks only if the environment remains stable

Recommended split:

- isolate restore verification from continuity verification
- keep alias-root checks as conditional, not mandatory unless encountered
- treat crash/recovery as last and optional because it can contaminate the rest of the receipt sequence

Recommended reset and cleanup strategy:

- start from a known clean worktree and a declared repo root
- clear local renderer state between runs unless a specific test requires preserving it
- record any intentionally seeded localStorage or session state in the receipt
- close and reopen the app between the restore bundle and the continuity bundle if the operator needs to prove reopen behavior
- avoid mixing fixture and real-project receipts in the same bundle unless the packet explicitly separates them

Recommended archival strategy:

- store one receipt packet per operator bundle
- keep screenshots grouped by flow and by bundle
- retain logs needed to explain any contradiction
- if a run fails, archive the failed receipt as part of the same packet instead of overwriting it

## Closure Criteria

14C can close only when all of the following are true:

- the receipt packet is complete for the selected flows
- every intended flow has an explicit outcome classification
- all contradictions are either resolved or escalated
- any human-observed mismatch is recorded against the correct authority layer
- any Phase 15 candidate has a documented reason
- no claim remains that relies on operator trust without operator evidence

14C cannot close if:

- a restore or continuity claim is still visually ambiguous
- the operator cannot tell current evidence from historical evidence
- the receipt packet is missing screenshots or logs needed to defend the result
- a flow was skipped without a documented reason
- a known contradiction was left unclassified

## Operator Decisions Applied

- screenshots are operator evidence by default and are not repo-tracked unless a specific failure needs permanent audit evidence
- real local projects are required for authority and continuity closure claims
- fixtures may be used only as secondary comparison evidence
- destructive or chaotic crash testing is deferred to Phase 15
- light deterministic recovery observation may be attempted in 14C
- restore-latest has its own receipt section
- floating-pane reload and rebind is mandatory observation-only verification in 14C
