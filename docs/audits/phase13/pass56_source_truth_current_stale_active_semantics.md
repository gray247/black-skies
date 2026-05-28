# Pass 56 - Source-of-Truth Current / Stale / Active Semantics

## 1. Scope Declaration

Pass 56 is planning/governance/docs-only.

No implementation is authorized by this pass.

This pass does not create a final source-of-truth canon.

## 2. Purpose

Current/stale/active ambiguity blocks planning because recovery, retrieval, exports, lifecycle interpretation, validation evidence, and later implementation review all depend on whether an artifact or state may be treated as presently usable, merely visible, or no longer decision-bearing.

Without narrower semantics, recovery state can be mistaken for current truth, retrieved structures can be mistaken for persistent objects, validation results can be mistaken for authoritative status, and archived governance artifacts can be mistaken for active control.

Pass 56 reduces one ambiguity cluster so later planning can distinguish currentness, activity, stale relevance, supersession, and authority without pretending that final source-of-truth architecture is solved.

## 3. Semantic Definitions

Pass 56 defines these provisional governance meanings:

- `current`: the most recent materially relevant state or artifact known within a defined scope and time context; current does not itself confer authority
- `active`: presently in operational use, under active consideration, or governing a live procedure; active does not itself confer source-of-truth status
- `stale`: no longer reliably current for direct decision use without re-checking, but potentially still relevant as evidence, history, or comparison context
- `obsolete`: no longer suitable for operational use because later governance, process, or context has displaced it beyond ordinary decision value
- `superseded`: replaced by a later scoped artifact, statement, or control; retained as history unless separately removed
- `authoritative`: explicitly permitted to govern a decision within a named scope; authority must be granted, not inferred from visibility, recency, or activity
- `provisional`: intentionally incomplete, non-final, and subject to later governance revision; may guide review but not settle truth by itself
- `historical`: retained as past evidence or process record rather than as present control
- `invalid`: not trustworthy for the intended claim because it is contradicted, scope-broken, stale beyond use, or procedurally disqualified

These are governance semantics, not UI labels or product copy.

## 4. Boundary Rules

Pass 56 preserves these boundary rules:

- current does not mean authoritative
- active does not mean source of truth
- stale does not mean useless
- historical does not mean active
- superseded does not mean deleted
- visible does not mean current
- validated does not mean authoritative

Additional boundaries:

- provisional does not mean invalid
- obsolete does not mean erased
- invalid does not automatically mean historical material has no evidentiary value

## 5. Artifact/State Classification

These terms apply to the following surfaces:

- governance artifacts: may be active, historical, superseded, or obsolete; visibility alone does not make them current control
- tracker entries: may remain current within tracker scope while still being non-authoritative for implementation
- generated summaries: are provisional by default and may become stale quickly unless revalidated
- exports/reports: may be current snapshots for a bounded moment while remaining non-authoritative
- diagnostics output: may be current evidence without being authoritative diagnosis or recovery permission
- recovery state: may be active or recently recovered without being current or valid
- retrieved structures: may be current retrieval results without being persisted, authoritative, or active control objects
- validation results: may be current mechanical evidence while still non-authoritative for governance, truth, or implementation approval

Classification must stay scoped. The same artifact can be current as evidence and stale as decision support if its decision context has moved.

## 6. False Authority Risks

Pass 56 preserves these false-authority risks:

- stale material appears current
- active artifact appears authoritative
- superseded prompt is reused as law
- validation result is treated as truth
- recovery state is treated as current
- retrieved structure is treated as persisted

Additional risks:

- a current-looking export is reused after its source basis has drifted
- an active governance artifact is quoted as if it settled implementation readiness
- a historical but polished summary outranks rougher, newer evidence

## 7. Authorization Interaction

Authorization records must declare currentness and supersession status for the artifacts, evidence, and control references they rely on.

Stale or superseded authorization cannot be reused as current approval.

If currentness, activity, or supersession status is ambiguous, the work must escalate rather than assume that the newest-looking artifact governs.

Validation recency, tracker currency, and control-map activity may support review, but none of them substitute for explicit authorization.

## 8. Reconstruction Control Map Interaction

Pass 56 supports later planning by narrowing the currentness vocabulary used across source-of-truth, lifecycle, validation, export/output, retrieval, recovery, and authorization review.

This pass does not authorize implementation, reopen blocked domains, or settle final source-of-truth architecture.

It exists so future planning can distinguish current control, active procedure, stale evidence, historical record, and superseded artifacts without borrowing authority by visibility.

## 9. Open Questions

Still unresolved:

- final source-of-truth canon
- UI labels
- enforcement tooling
- automatic stale/current detection
- conflict adjudication

## 10. Register / Tracker Impact

Pass 56 references existing control structures without creating new stable IDs.

Referenced existing registers:

- Contradiction Register: `C-007`, `C-009`, `C-012`, `C-017`
- Blocked-Promotion Register: `BP-005`, `BP-010`, `BP-014`, `BP-016`, `BP-017`
- Dependency-Gate Register: `DG-006`, `DG-008`, `DG-009`, `DG-010`
- Governance-Domain Register: `GD-006`, `GD-011`
- Pressure-Field Register: `PF-001`, `PF-003`, `PF-010`
- Implementation-Eligibility Register: `IE-002`, `IE-004`
- Authority-Family Register: `AF-011`, `AF-017`
- Safe-Maintenance Lane Register: `SM-001`

Register impact:

- No new contradiction, blocked-promotion, dependency-gate, governance-domain, pressure-field, reconstruction-state, implementation-eligibility, vocabulary-containment, authority-family, or safe-maintenance IDs are required in Pass 56.
- `VC-###` entries remain unitemized.
- `RS-###` entries remain unitemized.
- Pass 43 reserved-ID clarification is preserved.

## 11. Blocked Areas Not Touched

Pass 56 does not touch or reopen:

- GUI redesign
- command/search implementation
- workflow-state canon
- topology architecture
- Story Unit persistence
- retrieval authority
- recovery authority
- structural mutation authority

## 12. Discovered But Not Fixed

Unresolved issues discovered during Pass 56:

- final source-of-truth canon remains intentionally undeclared
- current/active/stale semantics are governance-only and not yet enforced in product surfaces
- automatic stale/current detection remains undefined
- conflict adjudication remains undefined
- authorization-record expiration and reuse rules still need later compression with these semantics

## 13. Semantic Clarification Qualification Evidence

Pass 56 qualifies as planning/governance work because:

- work is docs-only
- touched files are governance/control artifacts only
- no source, GUI, tooling, or implementation files change
- the pass narrows vocabulary semantics without creating source-of-truth canon or implementation permission
- blocked domains remain blocked
- no new stable IDs are created

## 14. Governance Outcome

Pass 56 clarifies provisional meanings for current, active, stale, obsolete, superseded, authoritative, provisional, historical, and invalid so future planning can reason about currentness without overpromoting recency, activity, or visibility into authority.

No implementation is authorized, and a final source-of-truth canon is not created.
