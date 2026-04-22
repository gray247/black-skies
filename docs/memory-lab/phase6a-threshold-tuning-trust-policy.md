# Memory Lab: Phase 6A Threshold Tuning + Trust Policy

## Purpose
Phase 6A tunes contested-memory behavior without changing frozen Phase 5 semantics.

## Scope
In scope:
- threshold tuning under fixed Phase 5 contracts
- trust-band policy definition
- alternate usefulness policy
- recommendation of safe defaults for Phase 6B governance

Out of scope:
- new selection semantics
- new comparator fields
- new prompt structures
- experimental mode behavior

## Required Sweep Matrix
All tuning runs must evaluate this minimum matrix:
- Threshold sweep points: `0.00, 0.02, 0.05, 0.08, 0.12, 0.16, 0.20`
- Replay corpus buckets:
  - short/low, short/medium, short/high
  - medium/low, medium/medium, medium/high
  - long/low, long/medium, long/high
- Environment tier:
  - supported deterministic environments only for hard gating
  - best-effort environments are report-only

## Stop Condition
Phase 6A tuning stops when all conditions are true:
- one threshold profile is selected as recommended default
- one threshold profile is selected as conservative fallback
- no deterministic regressions vs Phase 5C baseline in supported environments
- prompt growth and latency remain within regression budgets in `metric-definitions.md`
- trust-band outputs are documented and signed off

## Numeric Trust Bands (Frozen for 6A)
Trust bands are defined using final score delta (`winner_score - runner_up_score`):
- `stable`: delta > 0.12
- `contested_useful`: 0.03 < delta <= 0.12
- `unstable`: delta <= 0.03

Policy by band:
- `stable`: winner-only default
- `contested_useful`: winner + alternate allowed under prompt budget contract
- `unstable`: winner-only default unless explicitly enabled by policy profile

## Required Outputs
- threshold sweep report with per-bucket outcomes
- trust-band policy table with numeric definitions
- alternate usefulness recommendation
- recommended default profile proposal for Phase 6B
- rejected profile list with reasons

## Required Validation Categories
- threshold sweep replay tests
- deterministic regression checks (supported env)
- prompt contract conformance checks
- diagnostics completeness checks for contested decisions

