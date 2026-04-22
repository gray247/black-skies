# Memory Lab: Phase 7A Promotion / Defer / Kill Rubric

## Purpose
Define objective criteria for experimental outcome decisions.

## Decision Outcomes
- `promote`: eligible to become a stable candidate in a future phase
- `defer`: keep experimental, rerun with revised hypothesis
- `kill`: discontinue experiment

## Promotion Criteria (All Required)
1. No canon mutation regressions.
2. Deterministic gates pass in supported environments.
3. Prompt growth remains within regression budget.
4. Event growth remains within retention and append-safety bounds.
5. Diagnostics SLO targets are met.
6. Improvement metric vs stable baseline is statistically and operationally meaningful.

## Defer Criteria
- no critical regressions, but improvement is inconclusive
- requires revised hypothesis and next-wave charter

## Kill Criteria
- violates hard isolation rules
- causes blocker drift in supported deterministic environments
- exceeds regression budgets without credible mitigation
- requires stable-core semantic changes not approved by spec policy

## Rollback Protocol
Required steps on blocker outcome:
1. disable experiment flag
2. restore stable profile
3. capture failing scenario, environment tier, and diagnostics
4. log decision record with owner sign-off

## Required Decision Record Fields
- experiment id
- owner
- baseline used
- metrics summary
- decision (`promote|defer|kill`)
- rationale
- follow-up actions

