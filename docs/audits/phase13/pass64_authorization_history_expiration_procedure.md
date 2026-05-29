# Pass 64 - Authorization History / Expiration Procedure

## 1. Scope Declaration

Pass 64 is planning/governance/docs-only.

This pass does not authorize implementation.

This pass does not create authorization tooling.

Blocked domains remain blocked unless separately reauthorized.

This pass defines procedural governance for authorization validity, staleness, expiration, supersession, and audit handling only.

## 2. Purpose

Authorization records cannot remain informal or permanent because scope, dependency interpretation, currentness, readiness, and governance posture can all drift after an authorization is written.

Without lifecycle procedure, stale authorization can be reused as if it were current, roadmap presence can be mistaken for approval continuity, and adjacent work can inherit permission that was never granted.

Pass 64 exists to define how authorization records remain valid, become stale, expire, supersede one another, and are later audited without turning history into automatic authority.

## 3. Authorization Lifecycle States

Pass 64 uses these provisional lifecycle states:

- `ACTIVE`
- `SUPERSEDED`
- `EXPIRED`
- `REVOKED`
- `HISTORICAL`
- `INVALID`

Interpretation:

- `ACTIVE`: the most current known authorization record for a named scope that has not been superseded, expired, revoked, or invalidated
- `SUPERSEDED`: replaced by a later authorization record for the same or narrower governing scope
- `EXPIRED`: no longer reusable because time, context, dependencies, or stated expiration conditions have lapsed
- `REVOKED`: intentionally withdrawn before or during use
- `HISTORICAL`: retained for audit/history only and not reusable as live approval
- `INVALID`: not trustworthy for use because the record is contradictory, scope-broken, procedurally incomplete, or later shown to rely on false assumptions

These states are governance semantics, not UI labels or tooling states.

## 4. Active vs Superseded Authorization

`ACTIVE` authorization is not permanent.

Authorization does not transfer across domains, adjacent scopes, or later candidate lanes unless those scopes are explicitly named.

An authorization becomes `SUPERSEDED` when:

- a later authorization record explicitly replaces it
- a narrower follow-up authorization replaces part of its scope and declares the earlier scope split
- later control interpretation makes the earlier scope unsafe to reuse without update

Superseded authorization is retained as history, not as live permission.

Roadmap presence is not authorization.

Readiness is not authorization.

Candidate review is not authorization.

## 5. Expiration Conditions

Authorization should be treated as `EXPIRED` when any of the following occurs:

- a stated expiration condition is reached
- the relevant candidate lane changes readiness category materially
- dependency-gate interpretation changes materially
- blocked-domain adjacency appears that was not included in the record
- required validation expectations can no longer be satisfied as written
- source-of-truth, recovery, retrieval, lifecycle/currentness, or validation assumptions drift materially
- the approved file/system scope can no longer be bounded confidently
- later governance artifacts classify the relied-on assumptions as stale, superseded, or invalid

Stale authorization cannot be reused.

Expired authorization cannot be resumed by convenience, repetition, or historical visibility.

## 6. Revalidation Conditions

Authorization should be revalidated before reuse when:

- the same scope is revisited after a pause
- a later pass changed readiness interpretation
- a later pass changed current/stale/superseded semantics relevant to the authorization
- the work now touches additional files, systems, or authority families
- validation evidence has aged materially
- rollback or stop conditions are no longer well matched to the present scope
- dependency gates, contradictions, or blocked-promotion exposure have changed

Revalidation must at minimum restate:

- current lifecycle state of the old authorization
- whether scope is unchanged
- whether dependency gates and contradictions remain acceptable
- whether validation expectations still fit the current scope
- whether a new authorization record is required instead of reusing the prior one

If those answers are ambiguous, escalation is required.

## 7. Authorization Conflict Handling

Authorization conflict exists when:

- two records appear to govern overlapping scope differently
- a later record narrows scope without clearly superseding the earlier one
- maintenance approval and implementation authorization appear to overlap
- a candidate-review record is quoted as if it were implementation permission
- a historical or expired authorization is treated as active

Conflict handling rules:

- prefer explicit later scoped authorization only if it clearly declares supersession
- if supersession is unclear, treat both records as non-reusable until human/orchestrator review resolves the conflict
- maintenance approval never outranks implementation authorization, and implementation authorization never widens itself into unnamed maintenance cleanup
- authorization conflict resolution must not be inferred from roadmap order, tracker order, or artifact visibility

Unresolved conflict means no active reusable authorization for the disputed scope.

## 8. Authorization Audit Requirements

Future authorization use must be auditable by recording:

- which authorization record was relied on
- its lifecycle state at time of use
- whether it was active, revalidated, or replaced
- what scope was actually exercised
- what exclusions remained untouched
- what stop conditions were encountered
- whether rollback conditions were triggered
- what validation evidence was gathered
- whether any scope drift or conflict appeared

Authorization audit must be able to show not only that an approval existed, but that it was current, bounded, and not exceeded.

## 9. Authorization History Requirements

Authorization history must preserve:

- the original authorization record
- later supersession or revocation status
- whether the record became historical, expired, or invalid
- what later artifact changed its status
- whether reuse was denied, revalidated, or replaced

History rules:

- history is preserved for audit, not for silent permission reuse
- historical authorization remains evidence only
- superseded and expired records must stay distinguishable from active records
- authorization history must not be compressed into roadmap shorthand that hides lifecycle state

## 10. Relationship To Readiness Criteria

Pass 63 defines what must be true before implementation review could begin.

Pass 64 defines how any later authorization record remains usable, becomes stale, expires, or is superseded after that point.

Readiness categories do not make authorization permanent.

An authorization can expire even if a lane remains plausible.

A lane can remain `AUTHORIZATION REVIEW ELIGIBLE` while all prior authorizations for related work are expired, revoked, or historical.

## 11. Risks

Pass 64 preserves these risks:

- stale authorization reuse
- hidden reauthorization through historical artifacts
- roadmap continuity being mistaken for approval continuity
- readiness-to-authorization drift
- maintenance-to-feature escalation
- approval conflict hidden by artifact compression
- supersession ambiguity
- history being mistaken for active permission

Additional risk:

- later summaries may overcompress lifecycle states and erase the difference between `ACTIVE`, `SUPERSEDED`, `EXPIRED`, `REVOKED`, `HISTORICAL`, and `INVALID`

## 12. Remaining Unresolved Questions

Still unresolved:

- authorization storage/history mechanism
- exact expiration windows or aging heuristics
- cross-domain authorization conflict procedure detail
- enforcement tooling
- implementation review procedure detail
- how authorization history should appear in later planning/control artifacts without creating fake approval continuity

## 13. Register / Tracker Impact

Pass 64 references existing control structures without creating new stable IDs.

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

- No new contradiction, blocked-promotion, dependency-gate, governance-domain, pressure-field, reconstruction-state, implementation-eligibility, vocabulary-containment, authority-family, or safe-maintenance IDs are required in Pass 64.
- `VC-###` entries remain unitemized.
- `RS-###` entries remain unitemized.
- Pass 43 reserved-ID clarification is preserved.

## 14. Blocked Areas Not Touched

Pass 64 does not touch or reopen:

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
- implementation work of any kind

## 15. Discovered But Not Fixed

Unresolved authorization/governance gaps carried forward:

- authorization history remains procedural and not tool-backed
- expiration handling still lacks explicit time-based policy and remains condition-based only
- cross-domain conflict handling still needs more detailed escalation procedure
- readiness and authorization remain linked but still separable enough to confuse later summaries
- source-of-truth and lifecycle/currentness ambiguity still affect how authorization staleness is judged

## 16. Governance Outcome

Pass 64 defines a procedural authorization lifecycle for active, superseded, expired, revoked, historical, and invalid authorization records so future approval history can be audited and revalidated without granting permanent or transferable permission.

No implementation is authorized, stale authorization cannot be reused, and blocked domains remain blocked.
