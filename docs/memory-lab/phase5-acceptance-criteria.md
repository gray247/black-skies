# Memory Lab: Phase 5 Acceptance Criteria

This document defines objective acceptance criteria for Phase 5A, 5B, and 5C.

## Phase 5A: Spec + Acceptance Freeze
Phase 5A is complete only when:
- Contested key schema is frozen exactly as specified.
- Normalization and invalid metadata behavior are frozen.
- Chapter-local scope boundary is frozen.
- Comparator tuple, field provenance, and recency fallback order are frozen.
- Alternate threshold rule is frozen (absolute delta on final score).
- Loser contract is frozen (no explicit penalty).
- Revival + one-scene anti-thrash grace is frozen.
- Prompt contract is frozen (winner + optional alternate, max one alternate).
- Lightweight contested event contract is frozen.
- All freeze items are reflected consistently in Phase 5 docs.

## Phase 5B: Narrow Implementation
Phase 5B is complete only when implementation behavior matches the frozen spec and all out-of-scope items remain excluded.

### Performance Targets (Initial, Environment-Dependent)
- Memory resolution p95 per scene <= 25ms.
- Slot selection p95 <= 5ms.
- Prompt growth from alternate surfacing <= 20%.
- Max 1 contested event per slot per scene decision.

Targets are evaluated per `metric-definitions.md`.

### Failure-Class Behavior (Required)
- Unreadable event file:
  - Unavailable for this run only.
  - Log corruption.
  - Never overwrite or truncate corrupt file.
- Resolver failure:
  - Advisory unavailable for this request.
  - Legacy continuity still applies.
  - Diagnostics required.
- Load failure:
  - Advisory unavailable for this request.
  - Legacy continuity still applies.
  - Diagnostics required.
- Persistence failure:
  - Fail-soft.
  - Diagnostics required.
  - Request continues.

## Phase 5C: Replay / Regression Verification
Phase 5C is complete only when all criteria pass in supported deterministic environments.

### Replay Corpus Requirements
- Chapter length buckets: short, medium, long.
- Contested density buckets: low, medium, high.
- Minimum 9 scenario buckets total.

### Determinism Requirements (Supported Environments)
- N = 100 replay runs per scenario bucket.
- 0 winner drift.
- 0 alternate drift.
- Deterministic diagnostics match only on frozen deterministic fields.

### Deterministic Diagnostic Fields
- winner artifact id
- runner-up artifact id
- score delta
- fallback used
- tie-break tuple/rationale
- advisory available/unavailable reason code

Not in deterministic contract:
- timestamps
- informational free-form strings

### Environment Classification
- Supported deterministic environments:
  - effective-lock POSIX environments
- Best-effort environments:
  - non-POSIX/no-op lock environments (report-only, non-blocking for deterministic gate)

### Drift Triage Policy
On drift in supported deterministic environments:
- Severity: blocker.
- Freeze advancement.
- Capture failing case.
- Roll back last change or hold branch.

### Required CI Gate Suites
- `test_contested_selection_determinism.py`
- `test_no_canon_mutation.py`
- `test_prompt_contract_enforcement.py`
- `test_contested_event_append_safety.py`

### Gate Waivers
Waivers are allowed only when:
- approved by spec owner, and
- documented with explicit revisit condition.

