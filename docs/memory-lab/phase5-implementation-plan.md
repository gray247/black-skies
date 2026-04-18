# Memory Lab: Phase 5 Implementation Plan

## Phase 5B Objective
Implement contested memory exactly as frozen in Phase 5A.

## In-Scope
- Chapter-local contested grouping using canonical contested key.
- One winner per slot/type.
- Max one alternate per slot/type using absolute score delta threshold on final score.
- Deterministic comparator with frozen field provenance.
- Losers persist with ordinary lifecycle/decay rules.
- Revival behavior with one-scene anti-thrash grace.
- One lightweight contested outcome event per slot decision.
- Fail-soft write/load/resolve behavior with required diagnostics.
- Prompt contract enforcement for winner/alternate and budget precedence.

## Out of Scope (Hard)
- Cross-chapter contested continuity.
- Multiple alternates.
- Dynamic thresholds.
- Explicit loser penalties.
- Experimental behavior.
- UI analytics.
- Architecture refactors beyond frozen spec.

## Prompt Budget Contract
- Canonical token estimator:
  - the existing whitespace-token approximation used in runtime (`len(text.split())`-style estimator).
- Enforcement point:
  - prompt assembly before final prompt emission.
- Precedence:
  - winner is never dropped.
  - alternate is dropped first if budget exceeded.
  - no nondeterministic truncation.

## Performance Targets (Initial, Environment-Dependent)
- Memory resolution p95 per scene <= 25ms.
- Slot selection p95 <= 5ms.
- Prompt growth from alternate surfacing <= 20%.
- Max 1 contested event per slot per scene decision.

Metric calculation rules are defined in `metric-definitions.md`.

## Deliverables
- Runtime behavior conforms to `phase5-contested-memory-spec.md`.
- CI gates defined in `phase-gates.md` pass for Phase 5B and 5C.
- Contracts documented in `events.md`, `diagnostics.md`, and `prompt-contract.md`.
