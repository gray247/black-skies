# Pass 65 - Source-of-Truth Canon Planning

## 1. Scope Declaration

Pass 65 is planning/governance/docs-only.

This pass does not define a final source-of-truth canon.

This pass does not authorize implementation.

Blocked domains remain blocked unless separately reauthorized.

## 2. Purpose

The source-of-truth canon remains one of the largest unresolved dependency clusters in reconstruction planning.

Passes 47, 56, 57, and 58 narrowed truth-adjacent ambiguity, but they intentionally did not decide final canon structure.

Pass 65 exists to define what a future source-of-truth canon would need to decide, what still blocks those decisions, which domains depend on those decisions, and why early canonization would be dangerous.

This pass plans canon work. It does not perform canon work.

## 3. What A Future Source-of-Truth Canon Must Decide

A future source-of-truth canon would need to decide at minimum:

- what can count as authoritative within named scope
- how current differs from active
- how recovered differs from valid
- how restored differs from current
- how retrieved differs from persisted
- how generated summary differs from evidence
- how tracker/control artifacts differ from authority
- how validation results differ from truth
- how stale, superseded, historical, obsolete, and invalid states interact
- how conflict adjudication works when artifacts disagree
- how authorization currentness depends on currentness/supersession state

Further canon decisions would also be required for:

- whether any artifact can be authoritative across more than one domain
- how truth scope is bounded when artifacts are current in one context but stale in another
- what kinds of evidence may participate in truth adjudication without becoming authoritative by visibility
- what relationship exists between truth authority and recovery/retrieval continuity surfaces

## 4. Domains Dependent On Source-of-Truth Canon

The following domains remain dependent on eventual source-of-truth canon decisions:

- source-of-truth itself
- recovery
- retrieval
- workflow-state
- export/output
- lifecycle/supersession
- validation
- governance artifacts
- authorization history and expiration handling
- topology
- Story Unit persistence

These domains do not all need final architecture first, but they do depend on a clearer answer about truth authority, currentness, validity, persistence, and conflict handling.

## 5. Current Known Boundaries

The following boundaries are already known and should constrain any future canon work:

- visibility is not authorization
- generated output is not source of truth
- retrieved is not persisted
- grouped is not object identity
- recovered is not valid
- restored is not current
- current does not automatically mean authoritative
- active does not automatically mean source of truth
- validation green is not governance approval
- tracker/control artifacts are not implementation authority by default
- stale authorization cannot be reused

These are inputs to later canon planning, not the canon itself.

## 6. Open Truth Questions

Open truth questions that still block canon creation include:

- current vs active
- recovered vs valid
- restored vs current
- retrieved vs persisted
- generated summary vs evidence
- tracker/control artifact vs authority
- validation result vs truth
- stale/superseded/historical handling
- conflict adjudication
- authorization currentness

Additional open questions:

- whether different authority families can have different truth rules without causing cross-domain contradiction
- how truth should be scoped when recovery, retrieval, lifecycle, and validation all supply partially relevant evidence
- what counts as sufficient disqualification for an artifact to become invalid

## 7. Premature Canonization Risks

Defining the canon too early would create these risks:

- unresolved ambiguity would harden into fake certainty
- recovery language could become accidental legitimacy law
- retrieval convenience could become persistence canon
- summaries could outrank evidence
- validation results could become fake truth approval
- tracker/control artifacts could become accidental architecture law
- stale or superseded material could inherit authority through premature labeling
- blocked domains could gain indirect permission by truth-adjacent canon placement

Premature canonization would likely produce more hidden reauthorization than clarity.

## 8. Candidate Decision Areas

If a future canon-planning sequence is attempted, it should likely break decisions into at least these areas:

1. Truth scope and authority classes
2. Current / active / stale / superseded / historical / invalid semantics
3. Recovery truth interaction
4. Retrieval and persistence truth interaction
5. Validation evidence versus truth
6. Governance artifact and tracker/control truth status
7. Conflict adjudication procedure
8. Authorization currentness and truth dependence

These are candidate decision areas only. They are not approved canon sections.

## 9. Disqualifying Conditions For Canon Creation

A future source-of-truth canon should not be attempted while any of the following remain true:

- unresolved authority ambiguity is still too broad to bound
- recovery legitimacy remains too underdefined
- retrieval/persistence interaction remains too underdefined
- lifecycle/currentness interpretation remains too unstable
- validation truth interaction remains too unstable
- conflict adjudication remains undefined
- authorization history/currentness handling remains too procedural
- blocked-domain adjacency would let canon wording silently authorize implementation assumptions

Further disqualifiers:

- inability to define scope without bleeding into final architecture
- inability to keep canon planning separate from UI labels or product copy
- inability to state how canon decisions would avoid reopening blocked domains

## 10. Recommended Future Canon Procedure

If a future source-of-truth canon effort is attempted, it should proceed through a bounded procedure:

1. confirm blocked domains remain blocked
2. identify the exact truth question being decided
3. identify dependent domains and authority families
4. restate existing non-authorizing boundaries
5. isolate conflicts between currentness, validity, persistence, and evidence
6. define candidate decision options without choosing architecture
7. identify disqualifying unresolved dependencies
8. require human/orchestrator review before any canon adoption

Recommended operating constraints:

- one truth cluster at a time
- no implementation readiness implied by canon planning
- no UI labeling or product wording decisions bundled into canon work
- no persistence, recovery, topology, or workflow-state architecture decided by adjacency

## 11. Register / Tracker Impact

Pass 65 references existing control structures without creating new stable IDs.

Referenced existing registers:

- Contradiction Register: `C-007`, `C-008`, `C-009`, `C-012`, `C-017`
- Blocked-Promotion Register: `BP-005`, `BP-010`, `BP-014`, `BP-016`, `BP-017`
- Dependency-Gate Register: `DG-006`, `DG-008`, `DG-009`, `DG-010`
- Governance-Domain Register: `GD-006`, `GD-011`
- Pressure-Field Register: `PF-001`, `PF-003`, `PF-010`
- Implementation-Eligibility Register: `IE-002`, `IE-004`
- Authority-Family Register: `AF-011`, `AF-017`
- Safe-Maintenance Lane Register: `SM-001`

Register impact:

- No new contradiction, blocked-promotion, dependency-gate, governance-domain, pressure-field, reconstruction-state, implementation-eligibility, vocabulary-containment, authority-family, or safe-maintenance IDs are required in Pass 65.
- `VC-###` entries remain unitemized.
- `RS-###` entries remain unitemized.
- Pass 43 reserved-ID clarification is preserved.

## 12. Blocked Areas Not Touched

Pass 65 does not touch or reopen:

- GUI redesign
- command/search implementation
- workflow-state canon
- topology architecture
- Story Unit persistence
- retrieval authority
- recovery authority
- structural mutation authority
- source-of-truth implementation
- implementation work of any kind

## 13. Discovered But Not Fixed

Unresolved issues carried forward by canon planning:

- the source-of-truth canon remains intentionally undefined
- conflict adjudication remains one of the largest unresolved truth questions
- authorization currentness still depends on broader current/stale/superseded handling
- recovery and retrieval remain too coupled to truth questions for casual separation
- truth-dependent planning still risks overcompressing governance into fake clarity

## 14. Governance Outcome

Pass 65 plans what a future source-of-truth canon would need to decide, what currently blocks those decisions, and why defining the canon too early would be unsafe.

This pass does not define the canon, no implementation is authorized, and blocked domains remain blocked.
