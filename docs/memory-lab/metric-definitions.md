# Memory Lab: Metric Definitions

## Purpose
Define measurement semantics and regression budgets for Phases 5C, 6A, 6B, 7A, and 7B.

## Reference Environment Requirement
All measured results must include:
- OS
- CPU model/class
- Python/runtime version
- lock mode and lock effectiveness
- run mode (CI/dev/local)
- environment tier (supported deterministic or best-effort)

## Cache Conditions
- Cold cache:
  - first run after process start or explicit cache clear.
- Warm cache:
  - subsequent runs in same process with normal cache reuse.

All latency reports must label cache condition.

## Percentiles
- p50: median latency
- p95: 95th percentile latency
- p99: 99th percentile latency

Primary gate threshold uses p95, with p50/p99 reported.

## Canonical Token Estimator
- `memory_lab_token_estimator_whitespace_v1`
- runtime whitespace-token approximation (`len(text.split())` style)
- used for prompt budget and prompt growth calculations

## Core Performance Targets (Stable Baseline)
- memory resolution p95 per scene <= 25ms
- slot selection p95 <= 5ms
- prompt growth from alternate surfacing <= 20%
- max 1 contested event append per slot per scene decision

## Prompt Growth Formula
`(tokens_with_alternate - tokens_winner_only) / tokens_winner_only`

## Determinism Metrics (Supported Deterministic Environments)
- winner drift count = 0
- alternate drift count = 0
- deterministic diagnostics drift count = 0 for frozen deterministic fields only

## Diagnostics SLO Metrics
- decision explainability coverage >= 99.0%
- advisory unavailable reason-code coverage = 100%
- fail-soft failure visibility coverage = 100%
- event-file corruption visibility coverage = 100%

## Experimental Regression Budgets (Phase 7B)
Each experiment charter must define budgets for:
- latency delta vs stable baseline
- prompt growth delta vs stable baseline
- event growth delta vs stable baseline
- diagnostics coverage delta vs stable baseline

If any budget is exceeded without approved waiver, experiment fails promotion criteria.
