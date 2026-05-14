Status: Accepted with exceptions
Canonical role: Operational roadmap spine for future phase and pass sequencing, gates, and phase-level closure requirements.
Scope: Convert the Phase 13 handoff trilogy and authority strategy into future phase structure, pass breakdowns, dependencies, gates, entry/exit criteria, and readiness boundaries for post-Phase-13 work.
Owns: Future phase/pass structure, sequencing, dependencies, entry criteria, exit criteria, audit gates, freeze/refactor/migration windows, human verification gates, handoff requirements, and the split of Phase 14 into governed subphases.
Does not own: Proof doctrine, deferred item inventory, runtime implementation, snapshot ontology implementation, restore behavior implementation, GUI redesign, or Phase 14 execution artifacts.
Upstream dependencies: [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [phase13_handoff_pass1_current_state.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass1_current_state.md), [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md), [phase13_handoff_pass3_future_roadmap_and_phase_allocation.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md), [pass26_snapshot_authority_map_and_todo_inventory.md](/C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [phase13_audit_trust_validation_plan.md](/C:/Dev/black-skies/docs/phases/phase13_audit_trust_validation_plan.md), [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md), [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md), [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)
Downstream dependencies: [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
Last reviewed: 2026-05-14.
Acceptance record: 2026-05-14 - Operator-approved - Accepted with exceptions after governance review passed; exceptions are non-blocking for Phase 14A.1 readiness, and Phase 14 implementation has not started.

# Master Phase Allocation Plan

## Purpose

This artifact converts the Phase 13 handoff trilogy and the authority strategy into future phase and pass structure.

It is the operational roadmap spine for post-Phase-13 work. It applies the proof doctrine from [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md) to phase boundaries, sequencing, closure requirements, and readiness gates.

## Inputs and Dependencies

### Upstream Dependencies

- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- [phase13_handoff_pass1_current_state.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass1_current_state.md)
- [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md)
- [phase13_handoff_pass3_future_roadmap_and_phase_allocation.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md)
- [pass26_snapshot_authority_map_and_todo_inventory.md](/C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md)
- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
- [phase13_audit_trust_validation_plan.md](/C:/Dev/black-skies/docs/phases/phase13_audit_trust_validation_plan.md)
- [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md)
- [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md)
- [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)

### Planned Downstream Dependency

- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)

### Missing Artifact Note

- `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md` remains missing at that path and is treated as missing evidence rather than inferred content.

## Non-Goals

This artifact does not:

- implement Phase 14
- modify production behavior
- create deferred backlog tables
- define proof doctrine
- replace [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- create or edit [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
- close Phase 13 authority
- declare Phase 14 started

## Current Operating State

- Phase 13 is closed as audit, trust validation, handoff, and governance-readiness only.
- The handoff trilogy was accepted for Phase 13 closure use.
- `RGR-1`, `RGR-2`, and `RGR-3` exist and are accepted with exceptions.
- Governance rebuild is accepted with exceptions.
- Phase 14 implementation has not started.
- Authority closure remains Phase 14+ work.

## Acceptance Model

### Handoff Acceptance

Handoff acceptance means the Phase 13 handoff trilogy accurately describes Phase 13 reality.

### Governance Acceptance

Governance acceptance means the roadmap artifacts are consistent enough to govern future work.

### Slice Acceptance

Slice acceptance means the first Phase 14 pass is mapped, scoped, and approved to begin.

### Closure Rule

- Phase 13 may close as audit/handoff only after handoff acceptance and governance acceptance are recorded.
- Slice acceptance may remain pending after Phase 13 closes.
- Authority closure remains Phase 14+ work.

## Governance Artifact Status Model

This document uses the status model defined in [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md).

- Current status: `Accepted with exceptions`
- New roadmap governance artifacts start as `Produced`.
- Only operator/user instruction may move an artifact beyond `Produced`.
- Every status change requires a tracker update.

## Governance Drift Control

- This artifact may reference sibling governance docs, but it must not redefine proof doctrine or backlog ownership that belongs elsewhere.
- Sequencing, gates, entry criteria, and exit criteria must be reconciled here before downstream roadmap artifacts inherit them.
- Operational-state references in this document are informational snapshots only; the tracker remains canonical for current operational state.
- If tracker state changes, any operational-state summary here must be treated as stale until reconciled.
- Conflicts between this artifact and sibling governance docs must be corrected in the canonical owning artifact first, then propagated here.

## Phase Structure Overview

| Phase | Role |
| --- | --- |
| Phase 14 - Authority Reconciliation | Define and implement canonical authority semantics for snapshot, report, integrity, filesystem, and operational truth |
| Phase 15 - Backup / Restore Authority Hardening | Make backup/restore eligibility safe, explicit, and explainable after authority semantics exist |
| Phase 16 - Test Harness / Fixture Governance | Prevent fake-green harness drift and define what each proof lane does and does not prove |
| Phase 17 - GUI Authority Simplification | Simplify operator-facing controls after authority semantics exist |
| Phase 18 - New GUI Migration Gate | Decide when and how the newer GUI can replace the current production/default GUI |
| Phase 19 - Roadmap / Deferred Ledger Reconciliation | Keep deferred, TODO, later, stub, and refactor items allocated and non-drifting |

Phase 20+ remains provisional and should not be treated as committed execution work until stabilization phases are accepted.
Phase 20+ items are provisional future governance buckets only, not committed execution phases, not authorized implementation campaigns, and not suitable for broad `/goals` execution until expanded into governed phase plans.

## Phase 14 Structure

### Phase 14A - Semantic Reconciliation

Purpose:

Define what the authority states mean before runtime behavior changes begin.

Likely passes:

- `14A.1` Vocabulary + Evidence Contract
- `14A.2` Authority Claim Separation
- `14A.3` Terminology Drift + Preferred Wording
- `14A.4` Semantic Acceptance + Verification Gate Planning

Entry criteria:

- handoff acceptance recorded
- governance acceptance recorded, or any exceptions explicitly marked non-blocking for `14A`
- proof doctrine is accepted and usable
- tracker and handoff docs are current

Exit criteria:

- vocabulary and semantic contract accepted for the `14A` scope
- authority claim separation is explicit enough to guide implementation alignment
- preferred and discouraged wording guidance exists for high-risk terms
- acceptance and verification-gate boundaries are explicit before `14B`

Proof expectations:

- repo/document evidence and doctrine alignment are required
- no `14A` claim can close on CI-only evidence if it is making runtime safety claims
- `14A` may prepare human-verification dependencies, but it must not claim operator verification occurred

Human verification expectations:

- direct human rerun is generally not required for pure semantic-definition passes
- any user-facing claim borrowed from prior human verification must stay labeled as evidence, not as closure proof

Non-goals:

- no production behavior changes
- no backend, preload, or renderer alignment work
- no deferred backlog inventory

### Phase 14B - Implementation Alignment

Purpose:

Make backend, preload, renderer, and persisted records follow the accepted semantic contract.

Likely passes:

- `14B.1` Runtime Authority Alignment
- `14B.2` Renderer / Preload Alignment
- `14B.3` Restore / Continuity Coordination
- `14B.4` Snapshot Freshness / Reconciliation
- `14B.5` Controlled Human Verification Checkpoint Preparation

Entry criteria:

- `14A` semantic contract accepted for the affected slice
- implementation surfaces are identified
- current tracker state does not contradict the planned alignment work

Exit criteria:

- implementation surfaces follow the accepted contract
- affected user-visible states are internally consistent for the implemented slice
- tracker and docs reflect any narrowed or deferred items

Proof expectations:

- backend/runtime evidence is required for backend behavior claims
- filesystem evidence is required for filesystem-existence claims
- harness evidence may support UI witness behavior but cannot replace runtime proof

Human verification expectations:

- human verification may remain pending for a partial alignment slice
- any deferred human verification requirement must be carried into `14C`

Non-goals:

- no broad GUI simplification
- no deferred-matrix creation inside implementation passes
- no closure claim for the whole phase from one aligned slice

### Phase 14C - Regression + Human Verification

Purpose:

Prove the accepted contract with the correct evidence lanes and rerun the required human verification.

Likely passes:

- `14C.1` Unit Tests by State Contract
- `14C.2` Backend / Runtime Tests
- `14C.3` Playwright UI Witness Tests
- `14C.4` Truth-Lane Scoped Proof Update
- `14C.5` Human Verification Rerun

Entry criteria:

- at least one implementation slice from `14B` is complete
- validation scope for the slice is defined
- required human verification paths are identified

Exit criteria:

- contract tests exist for the implemented state behavior
- runtime, harness, and human evidence are recorded at the correct scope
- no lane is claiming proof beyond its authority class

Proof expectations:

- each validation lane must state what it proves and what it does not prove
- human/operator evidence is required for operator-facing degraded-state and restore-safety claims

Human verification expectations:

- human verification is required before closing any claim about browse/restore/report/degraded operational safety

Non-goals:

- no broad refactor for cleanliness
- no replacement of doctrine with test output

### Phase 14D - Closure Audit

Purpose:

Confirm that Phase 14 did not use incorrect proof classes or drift away from the documented contract.

Likely passes:

- `14D.1` Authority Evidence Review
- `14D.2` Tracker / Matrix Sync Check
- `14D.3` Human Verification Evidence Check
- `14D.4` Closure Report

Entry criteria:

- `14A` through `14C` work for the intended closure slice is complete
- deferred work boundaries are recorded
- tracker and matrix can be checked against the claimed closure state

Exit criteria:

- closure report states what was proven, what was deferred, and what remains out of scope
- tracker, matrix, and docs do not conflict on the closure claim
- human verification evidence is present where required

Proof expectations:

- closure must be authority-grade and closure-grade for the actual claim being made
- stale canonical-source mismatches must be reconciled or explicitly deferred

Human verification expectations:

- closure cannot claim operator safety if required human verification evidence is missing

Non-goals:

- no new implementation work
- no reinvention of the phase plan

## Phase 15 Structure

### Phase 15 - Backup / Restore Authority Hardening

Purpose:

Make backup and restore eligibility safe, explicit, and explainable after authority semantics exist.

Likely passes:

- backup existence and ZIP validity model
- restore-as-copy eligibility contract
- validation failure reason surfacing
- target path collision and safety rules
- restore UI gating
- backup/restore regression tests
- human restore verification

## Phase 16 Structure

### Phase 16 - Test Harness / Fixture Governance

Purpose:

Prevent fake-green harness drift.

Likely passes:

- fixture authority contract
- alias fixture policy
- synthetic-mode scope documentation
- negative-toast guard preservation and expansion
- Playwright teardown governance
- truth-lane scope matrix
- CI workflow trigger documentation
- what each lane proves matrix

## Phase 17 Structure

### Phase 17 - GUI Authority Simplification

Purpose:

Simplify operator-facing controls after authority semantics exist.

Likely passes:

- Snapshot / Verify / Snapshots control review
- dead and legacy control cleanup
- degraded-state display copy
- report, manifest, and reveal action clarity
- operator checklist rerun

## Phase 18 Structure

### Phase 18 - New GUI Migration Gate

Purpose:

Decide when and how the experimental or newer GUI can replace the current production/default GUI.

Likely passes:

- feature flag inventory
- parity matrix
- authority display requirements
- migration blockers
- controlled opt-in test
- promotion criteria

## Phase 19 Structure

### Phase 19 - Roadmap / Deferred Ledger Reconciliation

Purpose:

Ensure deferred, TODO, later, stub, and refactor items remain allocated and do not drift.
This phase owns governance artifact drift reconciliation, cross-artifact contradiction scans, stale canonical-source reconciliation, tracker/matrix/phase-plan alignment checks, and deferred-ledger hygiene.

Likely passes:

- repo TODO scan
- docs deferred scan
- operator-discovered debt intake
- duplicate normalization
- phase and pass assignment
- obsolete, frozen, or implemented classification
- governance artifact drift reconciliation
- cross-artifact contradiction scans
- stale canonical-source reconciliation
- tracker / matrix / phase-plan alignment checks
- deferred-ledger hygiene

## Phase Dependencies

- Phase 14 precedes Phase 15 restore hardening where restore depends on snapshot authority semantics.
- Phase 14 precedes Phase 17 GUI simplification.
- Phase 14 precedes Phase 18 GUI migration.
- Phase 16 may run in parallel with parts of Phase 14 but cannot replace real authority proof.
- Phase 19 depends on [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md).
- Phase 20+ remains provisional until stabilization phases are accepted.

## Cross-System Operational Risk Sweep

Before deeper Phase 14 implementation alignment, the project should run a bounded cross-system operational risk sweep to classify runtime-adjacent systems by operational trust level.

This sweep is not Phase 14 implementation.
This sweep is not another open-ended Phase 13.
This sweep is a bounded confidence map used to classify operational trust and dependency risk before deeper implementation work.

### Minimum Sweep Scope

- critique and intelligence flow
- snapshot freshness and report refresh behavior
- restore and backup user-facing path
- wrapper, launcher, and current-working-directory behavior
- truth-lane realism
- harness and fixture realism
- GUI authority flows
- runtime JavaScript exception capture
- memory persistence read/write flow
- longform continuation and generation flow
- offline and degraded-state behavior
- report persistence chain
- materialized fixture contract
- recovery and load behavior

### Required Sweep Output Per System

- operational risk class
- known symptoms
- evidence basis
- authority layer affected
- current owner phase
- blocker status for `Phase 14A.1`
- blocker status for `Phase 14B` implementation
- future phase allocation
- recommended next action

## Dependency Awareness Rules

- `Phase 14A.1` can proceed if unresolved risks do not invalidate snapshot vocabulary or evidence-contract planning.
- `Phase 14B` implementation alignment should not proceed if a system it depends on is `Observed risk` or `Partially trusted` without explicit risk acceptance.
- Later phases must not build on `Governance-only` systems as if they are runtime-trusted.
- Phase 15 restore hardening depends on Phase 14 authority semantics and the operational risk sweep's restore-path classification.
- Phase 16 harness governance should use the sweep findings to prioritize fixture, truth-lane, wrapper, and CI work.
- Phase 17 GUI simplification should use the sweep findings for GUI authority flow and old Focus behavior.
- Phases 18+ must not treat provisional future buckets as executable until their dependency risks are classified.

## Gates and Stop Conditions

### Gates

- phase closure claims must use the proof doctrine from [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- no phase may claim closure while tracker or matrix still shows unresolved `S0` or `S1` blockers for the same scope
- freeze, refactor, migration, and human-verification gates must be stated before implementation work begins for the affected phase

### Stop Conditions

- CI is green but human verification contradicts it
- renderer says OK while the filesystem artifact is missing
- restore is advertised but invalid
- alias drift reappears
- fixture-only proof is being used for real behavior
- docs say a phase is closed while tracker or matrix has unresolved `S0` or `S1` blockers
- canonical source appears stale and is not reconciled or tracked

## Phase 14 Starting Slice

### Likely First Slice

`Phase 14A.1 - Snapshot State Vocabulary and Evidence Contract`

### Owned Scope

- define the vocabulary for snapshot state and evidence-backed status terms
- define how those terms relate to later implementation work

### Non-Goals

- no production behavior changes
- no runtime alignment work
- no backlog inventory creation
- no human-verification closure claim

### Candidate Affected Surfaces

These are non-binding implementation surfaces for later inspection:

- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- existing spec documents under `docs/specs/`
- snapshot/report/recovery UI and service surfaces identified in Pass 26 and the handoff docs

### Inventory References

- source ledger IDs: `P2-SNAP-001`, `P2-REPORT-001`, `P2-ALIAS-001`, `P2-DEGRADE-001`, `P2-DOCS-001`, `PA26-T01`, `PA26-T02`, `PA26-T04`, `PA26-T05`, `PA26-T06`
- roadmap IDs: `RDM-SNAP-001`, `RDM-SNAP-002`, `RDM-SNAP-003`, `RDM-ALIAS-001`, `RDM-GUI-001`, `RDM-DOCS-001`
- authority doctrine references should point to [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)

### Dependencies

- governance review must be at least `Reviewed`
- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md) must remain canonical for proof rules
- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md) must remain canonical for `RDM-*` and source-ID mapping
- tracker must continue to show Phase 14 implementation as not started

### Validation Method

- docs and spec review first
- no production behavior change in this slice
- code inspection is allowed
- later implementation validation belongs in `14B` and `14C`

### Human Verification Need

- note the future need for human verification after implementation alignment
- direct human verification is likely deferred until `14C`

### Stop Conditions

- vocabulary proposal conflicts with the doctrine in [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- the slice tries to introduce runtime behavior changes before vocabulary acceptance
- an assumed source ID or roadmap ID is invented before the matrix exists

### Exit Criteria

- vocabulary and evidence-contract terms are documented
- non-goals are explicit
- affected surfaces are identified at a planning level only
- the slice is ready to hand off to implementation-alignment planning

## Relationship to Deferred Work Matrix

This artifact does not create the deferred matrix.

`RGR-3` must map Pass 2 source IDs into stable `RDM-*` roadmap IDs. The matrix will own detailed item inventory and future allocation.

## Relationship to Tracker

The tracker remains canonical for current operational status.

This phase plan is canonical for phase and pass sequencing. Status changes or phase acceptance changes must update the tracker.

## Cross-Links

- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
- [phase13_handoff_pass1_current_state.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass1_current_state.md)
- [phase13_handoff_pass2_authority_and_deferred_ledger.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md)
- [phase13_handoff_pass3_future_roadmap_and_phase_allocation.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md)
- [pass26_snapshot_authority_map_and_todo_inventory.md](/C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md)

## Open Questions and Deferred Decisions

| Question | Current status |
| --- | --- |
| Whether Phase 13 closure should happen immediately after governance acceptance or after slice acceptance | Deferred; current default is that slice acceptance may remain pending after Phase 13 closes |
| Whether Phase 14A.1 updates an existing spec or creates a narrow new spec | Deferred; inspect current spec ownership before deciding |
| Whether Phase 20+ buckets need names now or should remain unnamed categories | Deferred; current plan keeps them provisional only |
| Whether governance acceptance with exceptions can proceed if exceptions do not affect the starting slice | Deferred; likely yes only when every exception is explicitly marked non-blocking for the slice |
