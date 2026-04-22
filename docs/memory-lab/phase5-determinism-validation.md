# Memory Lab: Phase 5 Determinism Validation

## Purpose
Define deterministic replay and regression validation for contested memory.

## Corpus Definition
Replay corpus must cover:
- Chapter length buckets:
  - short
  - medium
  - long
- Contested density buckets:
  - low
  - medium
  - high

Minimum matrix: 9 scenario buckets.

## Determinism Contract
In supported deterministic environments:
- Run N = 100 replay runs per scenario bucket.
- Require:
  - 0 winner drift
  - 0 alternate drift
  - deterministic diagnostic field stability

## Deterministic Diagnostic Fields
- winner artifact id
- runner-up artifact id
- score delta
- fallback used
- tie-break tuple/rationale
- advisory available/unavailable reason code

Excluded from determinism matching:
- timestamps
- informational free-form strings

## Environment Policy
- Supported deterministic:
  - effective-lock POSIX environments
- Best-effort/report-only:
  - non-POSIX/no-op lock environments

## Drift Triage
On drift in supported deterministic environments:
1. classify as blocker
2. freeze advancement
3. capture failing case
4. rollback or hold branch

## Canon Invariant Checks
Must verify no writes to:
- accepted scenes
- locked facts
- outline files

Violation is a gate failure.

## Required Gate Suites
- `test_contested_selection_determinism.py`
- `test_no_canon_mutation.py`
- `test_prompt_contract_enforcement.py`
- `test_contested_event_append_safety.py`

## Waiver Policy
Gate waivers are allowed only with:
- spec owner approval
- documented revisit condition

