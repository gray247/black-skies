# Pass 61 - Roadmap Reconstruction Draft

## 1. Scope Declaration

Pass 61 is planning/governance/docs-only.

This pass does not authorize implementation.

This pass does not reopen blocked domains.

This pass does not create final roadmap promises or dates.

This draft organizes future work, but candidate lanes remain unapproved and blocked domains remain blocked unless later explicitly reauthorized.

## 2. Roadmap Purpose

The Reconstruction Control Map established governed domains, domain classifications, pressure fields, and reentry constraints.

Pass 54 added prioritization and sequencing logic.

Pass 59 narrowed what maintenance work might realistically be safe to review.

Pass 60 narrowed which limited implementation-candidate lanes appear survivable enough to review later.

Pass 61 exists to combine those planning surfaces into one governed roadmap draft so future work can be ordered without turning planning into permission.

The draft is needed because maintenance, ambiguity reduction, candidate review, and implementation authorization are still easy to blur together if they are not separated operationally.

## 3. Roadmap Principles

The roadmap follows these principles:

- governance stabilization precedes broader reentry
- ambiguity reduction precedes truth-dependent planning
- maintenance-safe work stays separate from candidate implementation review
- candidate review does not authorize implementation
- blocked domains remain blocked until separately reauthorized
- explicit human/orchestrator authorization is required before any implementation
- clean validation, tracker progress, and control-map coverage do not create approval
- no phase ordering in this draft should be read as date commitment or delivery promise

## 4. Near-Term Planning Lanes

Near-term planning lanes are:

- maintenance lane review and selection
- ambiguity-reduction passes for unresolved authority clusters
- limited candidate-lane review and narrowing
- authorization-record discipline for any future scope-bearing request
- dependency and pressure-field monitoring through existing control artifacts

These lanes are planning lanes only. They are not implementation lanes.

## 5. Maintenance Lane Plan

Near-term maintenance planning should stay inside the following governed lanes:

- typo and dead-link fixes
- docs cleanup without semantic drift
- constrained test/build maintenance
- constrained dependency/security maintenance with review
- narrow non-authority-affecting fixes

Maintenance work that remains review-required before later execution planning:

- diagnostics/logging changes
- export/output-adjacent changes
- validation/lint/test config changes
- lifecycle/archive docs changes
- source-of-truth wording changes
- recovery/retrieval-adjacent docs changes

Maintenance work must remain separate from candidate implementation review. Maintenance does not widen authorization.

## 6. Ambiguity-Reduction Plan

Ambiguity-reduction planning remains the highest leverage lane because unresolved authority semantics still block downstream review.

The current ambiguity-reduction roadmap cluster is:

- source-of-truth current / stale / active semantics
- recovery legitimacy boundary
- retrieval grouped-legitimacy boundary
- lifecycle/currentness and archival interpretation follow-up
- validation-authority interpretation follow-up where needed

Ambiguity-reduction work is governance-only unless later explicitly reauthorized otherwise.

## 7. Candidate Review Plan

Candidate review remains bounded to already identified lanes and must not be overread as approval.

Current candidate-review lanes are:

- governance-support tooling
- maintenance automation
- artifact lifecycle tooling
- constrained validation tooling
- constrained diagnostics tooling
- constrained export/output tooling

Recommended candidate-review order:

1. governance-support tooling
2. maintenance automation
3. artifact lifecycle tooling
4. constrained validation tooling
5. constrained diagnostics tooling
6. constrained export/output tooling

The first three lanes are the least product-adjacent and most likely to remain governance-bounded. The later lanes remain more exposed to truth, recovery, visibility, and output-authority drift.

## 8. Deferred / Hard-Blocked Domains

The following remain deferred or hard blocked and must not be treated as near-term reconstruction targets:

- GUI redesign
- command/search implementation
- workflow-state canon
- topology architecture
- Story Unit persistence
- retrieval authority
- recovery authority
- structural mutation authority
- diagnostics-as-workflow tooling
- advisory-to-apply behavior

These remain deferred because they are still tightly coupled to unresolved truth, recovery, retrieval, identity, topology, and workflow-legitimacy questions.

## 9. Required Authorization Before Implementation

Before any implementation could even be considered, the following must already be true:

- the work is classified through the controlled reentry procedure
- affected domains are named precisely
- blocked-promotion exposure is reviewed
- dependency gates are reviewed
- contradictions are reviewed
- authority families are identified
- maintenance status and candidate status are not conflated
- required validation scope is stated
- rollback and stop conditions are stated
- an authorization record exists
- explicit human/orchestrator approval exists for any implementation scope

Pass 61 does not satisfy or grant those requirements. It only places them in the roadmap structure.

## 10. Proposed Reconstruction Sequence

The governed reconstruction sequence is:

1. Governance stabilization
   - maintain tracker/control-map hygiene
   - preserve allow/block/escalate discipline
   - keep authorization records and planning artifacts non-authorizing

2. Maintenance lane review and evidence discipline
   - select low-risk maintenance reviews
   - preserve blocked-domain boundaries
   - avoid maintenance-to-feature drift

3. Ambiguity reduction
   - reduce source-of-truth, lifecycle/currentness, recovery, retrieval, and validation-authority ambiguity
   - narrow semantics before broader candidate review expands

4. Candidate-lane narrowing
   - compare survivable limited tooling candidates
   - preserve defer versus candidate-only distinctions
   - avoid scope-bearing promises

5. Authorization-ready review preparation
   - shape exact scope records for any future request
   - define exclusions, rollback, stop, and validation boundaries
   - require human/orchestrator approval before implementation

6. Continued deferral of high-risk domains
   - keep hard-blocked domains blocked until major ambiguity clusters are reduced and separately reauthorized

This is a governed planning sequence, not a delivery schedule.

## 11. Risks / Anti-Fake-Completeness Notes

The roadmap must remain guarded against:

- fake roadmap progress
- implementation hunger
- candidate-lane overpromotion
- maintenance-to-feature drift
- accidental canonization
- hidden reauthorization
- stale governance artifact reuse
- green-means-approved drift
- control-map completeness being mistaken for implementation readiness

Arc coverage is not closure for implementation. Planning density is not proof of readiness.

## 12. Register / Tracker Impact

Pass 61 references existing control structures without creating new stable IDs.

Referenced existing registers:

- Contradiction Register: `C-002`, `C-017`
- Blocked-Promotion Register: `BP-014`, `BP-016`, `BP-017`
- Dependency-Gate Register: `DG-006`, `DG-008`, `DG-009`, `DG-010`
- Governance-Domain Register: `GD-006`, `GD-011`
- Pressure-Field Register: `PF-001`, `PF-003`, `PF-010`
- Implementation-Eligibility Register: `IE-002`, `IE-003`, `IE-004`, `IE-005`
- Authority-Family Register: `AF-011`, `AF-017`
- Safe-Maintenance Lane Register: `SM-001`

Register impact:

- No new contradiction, blocked-promotion, dependency-gate, governance-domain, pressure-field, reconstruction-state, implementation-eligibility, vocabulary-containment, authority-family, or safe-maintenance IDs are required in Pass 61.
- `VC-###` entries remain unitemized.
- `RS-###` entries remain unitemized.
- Pass 43 reserved-ID clarification is preserved.

## 13. Blocked Areas Not Touched

Pass 61 does not touch or reopen:

- GUI redesign
- command/search implementation
- workflow-state canon
- topology architecture
- Story Unit persistence
- retrieval authority
- recovery authority
- structural mutation authority
- diagnostics-as-workflow tooling
- advisory-to-apply behavior
- export/output implementation
- diagnostics implementation
- source-of-truth implementation
- lifecycle tooling implementation
- validation tooling implementation
- implementation work of any kind

## 14. Discovered But Not Fixed

Unresolved issues carried forward by the roadmap draft:

- source-of-truth remains the dominant unresolved authority cluster
- recovery, retrieval, and workflow-state remain too coupled for safe near-term reentry
- lifecycle/currentness follow-up is still needed before lifecycle tooling review can mature
- diagnostics and export/output remain candidate lanes with heavy blocked-domain adjacency
- candidate lanes still lack formal implementation-readiness criteria
- approval storage, authorization history handling, and authorization expiration handling remain procedural only
- roadmap structure still needs care to avoid being mistaken for implementation sequencing promises

## 15. Governance Outcome

Pass 61 drafts a governed reconstruction roadmap by organizing maintenance review, ambiguity reduction, candidate review, authorization prerequisites, and deferred domains into one planning sequence without authorizing implementation.

Blocked domains remain blocked, candidate lanes remain unapproved, and no roadmap promise is created by this pass.
