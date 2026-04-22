# Memory Lab: Phase 7B Experiment Log

## Purpose
Record experiment outcomes using a consistent, auditable format.

## Log Entry Format
- Wave ID
- Experiment ID
- Owner
- Baseline Profile
- Flags / Namespace Keys
- Environment Tier(s)
- Replay Corpus Coverage
- Determinism Result (pass/fail)
- Comparator Mutation Check (pass/fail)
- Prompt Contract Mutation Check (pass/fail)
- Canon Mutation Check (pass/fail)
- Prompt Budget Result (pass/fail)
- Event Growth Result (pass/fail)
- Latency Budget Result (pass/fail)
- Combined-Mode Result (pass/fail)
- Rollback SLA Result (pass/fail)
- Diagnostics SLO Result (pass/fail)
- Regression Budget Summary
- Decision: promote / defer / kill
- Rationale
- Revisit Condition (required for defer)

## Hard Rules
- Every completed experiment must have a log entry.
- No promotion is allowed without a complete entry.
- Deferred experiments must include an explicit revisit condition and target wave.
- Killed experiments must include rollback confirmation.

## Wave-Level Summary Requirement
Each wave must include:
- total experiments run (max 2)
- total promoted
- total deferred
- total killed
- blocker incidents count

## Phase 7B Wave 1 Locked Experiments
- `A1 — Exploration Pressure (Exposure Pressure Only)`
- `B1 — Reinforcement Saturation Cap`

Wave 1 hard logging requirements:
- A1-only result set recorded
- B1-only result set recorded
- combined `A1+B1` result set recorded
- mandatory assertion results recorded:
  - no comparator mutation
  - no prompt contract mutation
  - no canon mutation
- rollback SLA evidence recorded:
  - single-flag disable restores baseline behavior in one run
  - no migration, cleanup, or persistent state conversion
