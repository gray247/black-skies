Canonical role: Executable master plan for Phase 16 operational stability and runtime trust audit.
Scope: Phase 16 governance, slice ordering, proof standards, human-verification model, stop gates, and closure criteria. No broad runtime implementation is authorized by this document by itself.
Owns: the complete Phase 16 slice map, sequencing rules, proof model, risk classes, human-verification thresholds, deferred ownership boundaries, stop gates, and closure criteria.
Does not own: Phase 17 GUI modernization, Phase 18 migration-gate work, Phase 19 hygiene/reconciliation, backup/restore runtime redesign, memory-system expansion, or speculative architecture changes.
Upstream dependencies: [phase16_test_harness_fixture_governance_review.md](/C:/Dev/black-skies/docs/audits/phase16/phase16_test_harness_fixture_governance_review.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
Downstream dependencies: any bounded Phase 16 implementation slice, any later Phase 17 GUI simplification, and any future Phase 19 hygiene / deferred-ledger work.
Last reviewed: 2026-05-16.
Acceptance record: No operator acceptance recorded yet.

# Phase 16 Master Execution Plan

## 1. Phase Intent

Phase 16 is an operational stability and runtime trust audit.

Its job is to answer a narrow question:

> What does each proof lane actually prove, what does it not prove, and what work is safe to do next without turning harness success into false runtime confidence?

The phase must surface:

- runtime/UI truth mismatches
- stale-state risks
- false-success conditions
- hidden instability
- harness-vs-runtime proof boundaries
- long-running behavior and timeout ambiguity
- operator trust risks

The phase must not become:

- GUI modernization
- alias-display redesign
- memory-system expansion
- architecture fantasy work
- stabilization without boundaries

## 2. Phase Operating Rules

- Green harness results are not runtime closure proof.
- Green truth-lane results are not broad product proof.
- Synthetic-mode success is not real-service proof.
- Fixture success is not operator authority proof.
- If a slice cannot define a stop gate, it is too big.
- If a slice cannot define its proof boundary, it is not ready.
- If a slice requires broad runtime behavior changes, it needs to be bounded first or deferred.

## 3. Phase Structure

### 16A Runtime Truth Audit

Objective:

- identify places where the renderer, preload, backend, and filesystem disagree about what is true
- classify whether the disagreement is cosmetic, operational, or authority-breaking

Allowed scope:

- runtime truth mapping
- stale-state inspection
- data-flow/authority tracing
- verification of loaded-root, project-root, and status-label meaning
- read-only audits of existing flows

Forbidden scope:

- redesigning GUI surfaces
- changing operator copy for style reasons
- new architecture or memory semantics
- speculative refactors

Required evidence:

- source inspection
- targeted renderer/unit coverage where needed
- explicit claim boundary notes
- operator-visible examples when ambiguity matters

Runtime vs harness proof:

- primarily runtime-oriented
- harness evidence may support the audit but cannot stand alone as closure proof

Human verification:

- required when the truth question is operator-facing or UI-visible
- not required for purely descriptive mapping if the mapping is supported by source and tests

Likely deliverables:

- authority mismatch inventory
- runtime truth map
- drift classification notes

Stop conditions:

- any change request that starts to reshape the GUI
- any request to solve alias presentation globally
- any request to expand into Phase 17 control-surface cleanup

Closure criteria:

- all identified truth mismatches are classified by owner and phase
- no unresolved authority mismatch remains unclassified
- any runtime fix required by the audit is split into a bounded follow-up slice

### 16B Long-Running Operation Stability

Objective:

- verify that backup/restore, snapshot verification, export, generation, and reopen/recovery flows complete safely over long runtimes
- identify timeout ambiguity, duplicated work, and degraded completion semantics

Allowed scope:

- long-running flow observation
- timeout semantics
- completion messaging
- bounded retry or teardown guards
- operator-observed timing notes

Forbidden scope:

- broad performance optimization
- async/job architecture redesign
- batching redesign
- new queue systems

Required evidence:

- repeatable operator runs for long actions
- timing notes
- failure path wording
- proof that completion semantics are not overstated

Runtime vs harness proof:

- runtime proof required for user-visible completion semantics
- harness proof acceptable only for transport/launcher/teardown mechanics

Human verification:

- mandatory for backup/restore and any operator-facing long-running completion claim
- strongly preferred for export and generation if they have operator-visible completion messaging

Likely deliverables:

- long-running behavior matrix
- timeout semantics map
- completion/degraded-state wording notes

Stop conditions:

- any attempt to move into broad performance engineering
- any attempt to make completion messaging more optimistic than the evidence allows

Closure criteria:

- long-running operations have bounded, explicit completion semantics
- timeout paths are no longer ambiguous
- any degraded completion behavior is explicitly labeled and tested

### 16C Service / Health State Authority Audit

Objective:

- verify that health-state propagation reflects actual service authority rather than a collapsed UI label
- separate bridge health, backend availability, and writing-tools wording

Allowed scope:

- service health semantics
- state propagation checks
- disabled/enabled control logic
- offline vs unavailable distinctions

Forbidden scope:

- GUI redesign
- styling cleanup
- replacing health labels for cosmetic reasons only

Required evidence:

- source inspection of health propagation
- targeted tests around disabled/enabled gating
- operator review when a label could mislead users

Runtime vs harness proof:

- hybrid
- source and tests prove propagation logic
- human verification proves operator-facing meaning

Human verification:

- mandatory when a label or state can prevent a critical operator action

Likely deliverables:

- health-state authority matrix
- service availability wording notes
- disabled-state justification notes

Stop conditions:

- any request to modernize the whole status system
- any request to change the global UI language across unrelated surfaces

Closure criteria:

- no critical action is blocked by a mislabeled state without explicit classification
- state labels and action gating meanings are documented consistently

### 16D UI / Runtime Drift Audit

Objective:

- identify where the UI presents a truth that the runtime does not support
- classify drift between toasts, disabled states, copy, and actual backend outcomes

Allowed scope:

- drift detection
- copy semantics
- test coverage for meaning mismatches
- small wording fixes only when they correct an explicit authority contradiction

Forbidden scope:

- control-surface redesign
- visual-system modernization
- deep layout changes

Required evidence:

- operator-visible examples
- screenshot or payload evidence when wording is disputed
- targeted UI tests for authority-sensitive copy

Runtime vs harness proof:

- runtime proof required for meaning
- harness proof only supports the UI path, not the truth claim

Human verification:

- required when the UI copy itself is the source of confusion

Likely deliverables:

- drift matrix
- UI meaning corrections
- ownership notes for deferred GUI cleanup

Stop conditions:

- any drift fix that wants to become a visual redesign
- any request to sweep unrelated UI surfaces in one pass

Closure criteria:

- authority-sensitive UI copy no longer contradicts runtime meaning
- residual visual cleanup is explicitly deferred

### 16E Operational Chaos Testing

Objective:

- stress the harness and runtime boundaries under messy but bounded conditions
- prove that weird inputs, ordering, and teardown conditions fail closed instead of going silent

Allowed scope:

- chaos-style stress of existing flows
- duplicate-operation risk checks
- stale-state and recovery ambiguity checks
- bounded negative-path coverage

Forbidden scope:

- open-ended fault injection
- broad load lab construction
- infrastructure experimentation outside existing lanes

Required evidence:

- reproducible failure or pass cases
- explicit negative assertions
- notes on what scenario was stressed and why it matters

Runtime vs harness proof:

- mostly runtime
- harness can verify fail-closed behavior but cannot replace runtime evidence for user-facing trust

Human verification:

- required if the chaos case impacts operator trust or user-visible completion semantics

Likely deliverables:

- chaos matrix
- duplicate-operation notes
- stale-state resilience notes

Stop conditions:

- the stress case grows into an uncontrolled fuzzing project
- the work becomes general resilience engineering

Closure criteria:

- the most important chaos cases are classified and bounded
- no important ambiguity remains untested or unclassified

### 16F Closure and Deferred-Risk Classification

Objective:

- classify every remaining Phase 16 concern as closed, deferred, or blocked
- separate genuine closure blockers from later work

Allowed scope:

- closure review
- deferred ownership mapping
- stop-gate summary
- explicit exception handling

Forbidden scope:

- new implementation work
- scope creep into Phase 17 or Phase 19

Required evidence:

- final lane-by-lane proof matrix
- human-verification summary
- repetition evidence for any operator-critical flow

Runtime vs harness proof:

- closure must respect the strongest proof required by each category
- if runtime proof is required, harness evidence alone is insufficient

Human verification:

- mandatory for any operator-facing trust claim

Likely deliverables:

- final closure note
- deferred risk inventory
- phase-ready / not-ready call

Stop conditions:

- any unresolved operator trust issue that lacks a proof owner

Closure criteria:

- every remaining item is either closed, explicitly deferred, or blocked with owner and next step
- no ambiguous green is left in the phase summary

## 4. Execution Order

Recommended order:

1. 16A Runtime Truth Audit
2. 16C Service / Health State Authority Audit
3. 16D UI / Runtime Drift Audit
4. 16B Long-Running Operation Stability
5. 16E Operational Chaos Testing
6. 16F Closure and Deferred-Risk Classification

Reasoning:

- the audit must establish truth boundaries before runtime changes are allowed
- health-state semantics should be understood before more action gating is added
- drift must be mapped before long-running or chaos verification is interpreted
- long-running behavior should be stabilized after truth boundaries are clear
- chaos testing is only useful once the baseline lanes are understood
- closure must come last

Parallelism rules:

- 16A and 16C can run in parallel if they stay read-only
- 16D can run in parallel with 16A if it only classifies current drift
- 16B should not begin until the truth map and health-state boundaries are clear
- 16E should not begin until the baseline long-running and drift boundaries are set
- 16F is final and should not overlap with implementation

Dangerous early actions:

- making UI copy changes before the drift map exists
- broad performance work before timeout semantics are classified
- teardown changes before negative-toast and harness proof rules are explicit
- trying to close the phase before human verification is complete for operator-facing claims

## 5. Proof Model

### Fixture and harness proof

Counts as proof:

- fixture roots materialize with the expected files
- harness lanes launch and complete under the expected environment
- teardown does not hang in known harness-managed paths
- fail-closed harness assertions fire on runtime errors

Does not count as proof:

- live runtime correctness
- operator trust
- real filesystem continuity
- restore semantics

### Truth-lane proof

Counts as proof:

- fixed truth-scenario receipt-backed claims
- route/origin/provenance checks within the contract
- real scene-button selection without synthetic fallback

Does not count as proof:

- complete GUI coverage
- all project states
- restore or continuity correctness
- broad runtime trust

### Runtime proof

Counts as proof:

- operator-visible completion
- validated backend outcomes
- file/materialization outcomes that are checked in the real flow
- repeated real-world success under the same conditions

Does not count as proof:

- a green harness run by itself
- a synthetic stub response by itself
- a wording change without the underlying behavior

### Human verification proof

Counts as proof:

- direct operator observation of the critical flow
- pass/fail outcome with timing notes
- screenshot only when needed to explain weird or failed behavior

Does not count as proof:

- implied correctness from CI
- implied correctness from one test lane

### What green means

Green means:

- the lane passed its own contract
- nothing in the lane violated its fail-closed assertions

Green does not mean:

- the full product is correct
- the operator trust problem is solved
- all deferred risks are gone

## 6. Operational Risk Classes

| Risk class | Meaning | Typical owner | Likely phase |
| --- | --- | --- | --- |
| False success | The lane passes while the user-facing truth is wrong | Phase 16 | Phase 16 |
| Stale state | The UI or harness reads old state as current state | Phase 16 | Phase 16 |
| Renderer drift | Renderer copy or behavior no longer matches runtime meaning | Phase 16 / 17 | Phase 16 if authority, Phase 17 if cosmetic |
| Preload drift | Preload and renderer disagree about surfaced state or path | Phase 16 | Phase 16 |
| Backend truth mismatch | Backend returns or persists something different from what the UI claims | Phase 16 | Phase 16 |
| Harness overclaim | Harness success is described as runtime proof | Phase 16 | Phase 16 |
| Timeout ambiguity | Completion/failure wording is unclear during long operations | Phase 16 / 18+ | Phase 16 for meaning, later for engineering |
| Degraded completion | The work finished partially or in a fallback state and the UI must say so | Phase 16 | Phase 16 |
| Duplicate-operation risk | A retry or double-trigger creates ambiguous results | Phase 16 | Phase 16 |
| Recovery ambiguity | Reopen/restore/recovery state is hard to interpret correctly | Phase 16 / Phase 15 adjacency | Phase 16 classification, later implementation if needed |
| Operator trust corruption | The system trains the operator to believe a false authority model | Phase 16 | Phase 16 |

### Ownership mapping

- Phase 16 owns truth, harness, timeout semantics, degraded completion, and operator trust mapping
- Phase 17 owns GUI modernization, control-surface cleanup, and cosmetic copy unification that does not alter authority
- Phase 18+ owns migration-gate or broader promotion work
- Phase 19 owns hygiene, clone sprawl, and repository cleanup
- deferred RDM ownership keeps the long-lived risk identifiers and phase allocations aligned

## 7. Human Verification Model

The operator evidence model should stay simple.

Required operator evidence:

- pass/fail observation
- timing notes for long-running actions
- visible runtime behavior
- screenshots only for weirdness, ambiguity, or failure

Not required:

- bloated paperwork
- exhaustive narrative logs
- repeated screenshots for normal success
- ceremony that does not improve trust

Repeatability expectations:

- any operator-facing claim should be repeatable at least twice if it is a closure blocker
- a one-off success is not enough for repeated-trust flows
- long-running actions should be observed under the same conditions more than once if they are a closure criterion

Chaos-testing expectations:

- bounded, not infinite
- aimed at known ambiguity classes
- stop once the proof boundary is clear

Acceptable proof thresholds:

- operator-visible flows require direct observation
- harness proof can support but not replace operator claims
- if the user could reasonably be misled, human verification is mandatory

## 8. Implementation Boundaries

Phase 16 may modify:

- audit docs and matrix docs
- narrow tests or contract checks that preserve or clarify proof boundaries
- wording that corrects an explicit authority contradiction
- fail-closed harness assertions
- bounded teardown guards

Phase 16 must not modify:

- GUI modernization surfaces
- control-surface redesign
- alias presentation redesign
- broad performance engineering
- async/job architecture
- memory or longform systems
- repository hygiene cleanup
- backup/restore runtime semantics beyond the narrow proof boundary contract

Runtime changes are allowed only when:

- a documented audit shows the current behavior is authority-breaking or misleading
- the change is minimal and directly tied to the audit finding
- the change can be verified without broad refactor drift

Docs-only review is required first when:

- a change could be either cosmetic or authority-bearing
- the operator might interpret the behavior as more trustworthy than it is
- the slice boundary is not yet explicit

Must defer to Phase 17:

- modal modernization
- visual consistency sweeps
- dark-theme cleanup
- legacy control-surface cleanup
- alias-display redesign
- confirm-surface modernization unless it becomes an authority defect again

Must defer to Phase 19:

- restored-folder hygiene
- clone sprawl cleanup
- sample artifact cleanup policy
- broader repo hygiene

## 9. Stop Gates

Phase 16 should stop a slice immediately when:

- the slice starts to require broad refactoring
- the slice begins changing unrelated UI surfaces
- the slice cannot define a proof boundary
- the slice’s runtime claim can no longer be supported by the requested evidence model
- the work starts to consume deferred ownership

Phase 16 should stop the whole phase when:

- a closure-critical operator claim lacks human verification
- a green lane is being used to overclaim runtime truth
- the current proof boundary is no longer explainable in one paragraph
- the phase is drifting into Phase 17 or Phase 19 work

## 10. Closure Criteria

Phase 16 may close when all of the following are true:

- the slice map is complete and each slice has explicit allowed/forbidden scope
- each operational risk class has an owner and a phase assignment
- each proof lane has an explicit proof boundary and non-claims
- human verification has been performed for every operator-facing trust claim
- any runtime changes needed by the audit are either complete or split into bounded follow-up slices
- no green harness result is being used as runtime closure proof
- no unresolved operator trust contradiction remains unclassified

Phase 16 may close with exceptions when:

- a remaining issue is clearly deferred to Phase 17, Phase 18+, or Phase 19
- the issue is not needed to prove the Phase 16 operational trust boundaries
- the exception is explicitly recorded and owned

Phase 16 is blocked when:

- the proof boundary for a closure-critical claim is missing
- the human verification requirement for an operator-facing claim has not happened
- a required runtime change would force uncontrolled scope growth

## 11. Deferred Ownership Map

| Area | Phase 16 position | Deferred owner |
| --- | --- | --- |
| GUI/control-surface cleanup | Not in scope | Phase 17 |
| Native confirm replacement | Not in scope unless it becomes authority-breaking again | Phase 17 |
| Global writing-tools label simplification | Deferred | Phase 17 |
| Alias/folder identity cleanup | Deferred | `RDM-ALIAS-001` / later GUI/docs work |
| Restored-folder hygiene | Deferred | Phase 19 or separate hygiene |
| Performance optimization | Deferred | Later performance work |
| Async/job architecture | Deferred | Later architecture work |
| Memory-system expansion | Not in scope | Later phase, if approved |
| Repository cleanup / clone sprawl | Deferred | Phase 19 |

## 12. Recommended First Executable Slice

Recommended first executable slice: `16A Runtime Truth Audit`.

Reason:

- it creates the truth map that every later slice depends on
- it prevents premature UI or harness changes from being misclassified
- it gives the rest of Phase 16 a stable claim boundary

If the team needs a lower-risk first implementation step after the audit, the next best candidate is:

- `16C Service / Health State Authority Audit` if the team needs to ground current gating semantics
- `16.1` / `16.2` contract tightening if the immediate concern is harness drift rather than runtime drift

## 13. Operator Questions

1. Should `16A` remain strictly read-only until the truth map is finalized, or can it include bounded wording fixes that correct explicit authority contradictions?
2. Do you want long-running operation verification to require repeated real-project runs for every closure-critical lane, or only for backup/restore and recovery/reopen flows?
3. Should any current health-label contradiction be treated as a Phase 16 authority bug, or left as Phase 17 GUI cleanup unless it blocks trust proof?
