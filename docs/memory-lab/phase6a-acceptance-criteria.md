# Memory Lab: Phase 6A Acceptance Criteria

Phase 6A is complete only when all criteria below are met.

## Required Deliverables
- `phase6a-threshold-tuning-trust-policy.md` finalized
- threshold sweep matrix run across all 9 replay buckets
- recommended default threshold profile documented
- conservative fallback profile documented
- trust-band table with numeric boundaries documented

## Required Hard Criteria (Supported Deterministic Environments)
- no winner drift regression against the selected Phase 5 baseline
- no alternate drift regression against the selected Phase 5 baseline
- deterministic diagnostics fields remain stable for replay checks
- no canon mutation regressions in verification suite

## Required Budget Criteria
Budgets must be evaluated per `metric-definitions.md`:
- memory resolution latency stays within Phase 5 baseline budget
- prompt growth from alternate surfacing remains within configured budget
- event append growth remains bounded

## Required Test Categories
- threshold sweep replay tests
- deterministic replay regression tests
- prompt contract enforcement tests
- diagnostics completeness tests

## Failure Policy
If hard criteria fail in supported environments:
- classify as blocker
- freeze progression to Phase 6B
- record failing scenario bucket and profile
- require rerun after corrective changes

