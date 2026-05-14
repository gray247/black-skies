# Phase 13 Handoff Pass 3 — Future Roadmap and Phase Allocation

## Purpose

This artifact converts the Phase 13 findings, Handoff Pass 1 current-state record, and Handoff Pass 2 authority/deferred ledger into a sequenced future roadmap.

This is governance work, not implementation. It allocates future phases and pass families without starting them.

## Inputs Inspected

- `docs/handoffs/phase13_handoff_pass1_current_state.md`
- `docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md`
- `docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/phases/phase13_audit_trust_validation_plan.md`
- `docs/specs/current_state.md`
- `docs/specs/workflow_spine.md`
- `docs/specs/error_visibility.md`
- existing `docs/audits/phase13/*.md` artifacts as present in the repo

Missing artifact noted during the trilogy:

- `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md` is still missing at that path and is treated as missing evidence rather than inferred context.

## Current Governing Principle

Phase 13 may close only as an audit/handoff phase after the trilogy is reviewed.

Authority closure moves to `Phase 14 - Authority Reconciliation`.

## Definitions

### Closure-grade

A phase or pass can be considered closed only when its stated evidence class supports its claim, known contradictions are either resolved or explicitly deferred, the tracker is current, and human verification is completed when the claim depends on operator-visible runtime truth.

### Authority-grade

A claim is authority-grade only when the proper authority layer proves it.

Examples:

- filesystem existence requires filesystem/runtime evidence, not renderer state
- restore safety requires backend/runtime and operator evidence, not fixture state
- current integrity requires more than a historical verification record

### CI-only acceptable

CI-only closure is acceptable for:

- low-risk docs-only changes
- pure static formatting or lint expectations
- harness-only contracts when the artifact explicitly says the proof is harness-scoped

### CI-only not acceptable

CI-only closure is not acceptable for:

- snapshot integrity
- restore safety
- filesystem existence
- alias migration
- backup validity
- operational safety
- user-facing degraded-state correctness

### Harness-only never enough

Harness-only proof is never enough for:

- real filesystem authority
- real restore eligibility
- real operator safety
- current integrity
- project-root migration safety

### Human Verification Required

Human verification remains required for:

- snapshot browse, restore, and report flows
- backup and restore flows
- degraded-state UX
- offline behavior
- new GUI migration gate decisions
- any destructive or copy/restore behavior

## Authority Hierarchy

- `A1 - Real filesystem/runtime`
- `A2 - Real backend service`
- `A3 - Canonical persisted records`
- `A4 - Renderer/UI state`
- `A5 - Harness/fixture state`
- `A6 - Synthetic mode`
- `A7 - Mock/stub behavior`

Rules:

- `A4` cannot prove `A1`
- `A5` cannot prove `A1`
- `A6` cannot prove `A2`
- `A7` cannot prove operational safety
- historical verification cannot prove current integrity
- renderer visibility cannot prove filesystem existence
- fixture materialization cannot prove real project behavior
- green CI cannot prove authority closure

## Future Phase Allocation

### Phase 14 - Authority Reconciliation

Goal:

Define and implement canonical authority semantics for snapshot, report, integrity, filesystem, and operational truth.

Likely passes:

- `14.1` Snapshot state ontology
- `14.2` Alias/root identity decision
- `14.3` Historical verification vs current integrity rules
- `14.4` Missing directory, manifest, and orphan report handling
- `14.5` Report freshness and staleness policy
- `14.6` Browseable, restorable, and verified distinction
- `14.7` Renderer, backend, and preload alignment
- `14.8` Regression coverage by authority layer
- `14.9` Human verification rerun

Exit criteria:

- no boolean `verified` semantics without substate
- missing physical artifacts degrade correctly
- stale reports cannot imply current OK
- row, details, report, and restore surfaces agree
- required human verification flows pass

### Phase 15 - Backup / Restore Authority Hardening

Goal:

Make backup and restore eligibility safe, explicit, and explainable.

Likely passes:

- `15.1` Backup existence and ZIP validity model
- `15.2` Restore-as-copy eligibility contract
- `15.3` Validation failure reason surfacing
- `15.4` Target path collision and safety rules
- `15.5` Restore UI gating
- `15.6` Backup and restore regression tests
- `15.7` Human restore verification

### Phase 16 - Test Harness / Fixture Governance

Goal:

Prevent fake-green harness drift and make each proof lane explicit about what it does and does not prove.

Likely passes:

- `16.1` Fixture authority contract
- `16.2` Alias fixture policy
- `16.3` Synthetic-mode scope documentation
- `16.4` Negative-toast guard preservation and expansion
- `16.5` Playwright teardown governance
- `16.6` Truth-lane scope matrix
- `16.7` CI workflow trigger documentation
- `16.8` What-each-lane-proves matrix

### Phase 17 - GUI Authority Simplification

Goal:

Simplify user-facing controls after authority semantics exist.

Likely passes:

- `17.1` Snapshot, Verify, and Snapshots control review
- `17.2` Dead or legacy control cleanup, including old Focus behavior if still present
- `17.3` Degraded-state display copy
- `17.4` Report, manifest, and reveal action clarity
- `17.5` Operator checklist rerun

### Phase 18 - New GUI Migration Gate

Goal:

Decide when and how the newer GUI can replace the current production/default GUI.

Likely passes:

- `18.1` Feature flag inventory
- `18.2` Parity matrix
- `18.3` Authority display requirements
- `18.4` Migration blockers
- `18.5` Controlled opt-in test
- `18.6` Promotion criteria

### Phase 19 - Roadmap / Deferred Ledger Reconciliation

Goal:

Ensure all deferred, TODO, later, stub, and refactor items have homes.

Likely passes:

- `19.1` Repo TODO scan
- `19.2` Docs deferred scan
- `19.3` Operator-discovered debt intake
- `19.4` Duplicate normalization
- `19.5` Phase/pass assignment
- `19.6` Obsolete, frozen, or implemented classification

### Phase 20+ - Future Research / Feature Gates

Goal:

Keep future ideas out of stabilization unless they are explicitly scoped and gated.

Possible later areas:

- memory layer
- intelligence layer
- emotion graph
- local LLM experimentation
- writing workflow expansion
- GUI and UX overhaul

## Dependencies

- Phase 14 must precede Phase 17 GUI simplification.
- Phase 14 must precede Phase 18 GUI migration.
- Phase 14 and Phase 15 must precede final operator trust claims.
- Phase 16 can run in parallel with parts of Phase 14, but it cannot replace real authority proof.
- Phase 19 can run after the trilogy review or alongside planning, but it cannot substitute for Phase 14 implementation.
- Phase 20+ must stay gated until the stabilization roadmap is satisfied.

## Gates and Stop Conditions

### Freeze windows

- no broad runtime refactors before authority semantics are defined
- no GUI promotion decisions before the authority gate exists

### Refactor windows

- refactors are allowed only after the semantic target is accepted and the tracker records why the refactor is necessary

### Audit gates

- new closure claims must state their evidence class
- docs cannot claim authority proof from harness-only or fixture-only evidence

### Human verification gates

- if tests are green but human verification contradicts them, stop and treat the contradiction as authoritative for operator-facing behavior
- no snapshot, report, restore, or degraded-state closure without human verification where required

### CI gates

- green CI is necessary but not sufficient
- fixture-only proof cannot be used as a substitute for real behavior

### Documentation gates

- tracker and handoff docs must stay aligned
- no doc may say a phase is closed while unresolved `S0` or `S1` blockers remain active in the ledger

### Stop conditions

Stop work and reclassify if any of the following occurs:

- tests are green but human verification contradicts them
- renderer says OK while the filesystem artifact is missing
- restore is advertised but invalid
- alias drift reappears
- fixture-only proof is being used for real behavior
- docs say a phase is closed while tracker or ledger still shows unresolved `S0` or `S1` blockers

## Phase 13 Closure Policy

Phase 13 can close only after:

- Handoff Pass 1 is reviewed
- Handoff Pass 2 is reviewed
- Handoff Pass 3 is reviewed
- the tracker is updated
- no claim of authority closure remains attached to Phase 13
- Phase 14 entry criteria are accepted

Phase 13 closure should mean:

- audit and handoff phase complete

It must not mean:

- snapshot authority solved
- restore safe
- human verification complete
- CI proves everything

## Phase 14 Entry Criteria

- Handoff Pass 1, Pass 2, and Pass 3 are accepted
- `S0` and `S1` ledger items are reviewed
- the target snapshot ontology is accepted as the Phase 14 starting point
- docs and tracker are current
- the operator understands that Phase 14 is authority reconciliation implementation, not GUI polish

## Roadmap Artifacts Deferred

This Pass 3 references future roadmap artifacts but does not create them yet.

Future artifacts may include:

- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`

## Recommended Next Action

Review Pass 3 first. Then decide whether to close Phase 13 as audit/handoff only or create roadmap artifacts before Phase 14.

If a single next artifact is desired, it should be:

- `docs/roadmap/master_phase_allocation_plan.md`

Only after that review should the repo decide whether to:

- optionally close Phase 13 as audit/handoff only
- create the roadmap artifacts
- begin `Phase 14.1 - Snapshot State Ontology`
