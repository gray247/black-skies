# Memory Lab Phase Gates

## Purpose
Define objective advancement criteria between roadmap phases.

## General Rules
- A phase is not complete until all required gate checks pass.
- Gate waivers are allowed only with:
  - spec owner approval
  - documented revisit condition
- Gate checks must be reproducible in CI where applicable.
- Waiver records must include:
  - gate identifier
  - owner approver
  - explicit expiry/revisit condition
  - rationale and mitigation plan

## Gate: 5A -> 5B
Required:
- `phase5-contested-memory-spec.md` frozen and internally consistent.
- Comparator field provenance frozen.
- Prompt contract frozen.
- Event contract frozen.
- Acceptance criteria frozen in `phase5-acceptance-criteria.md`.
- Spec change policy frozen in `spec-change-policy.md`.

## Gate: 5B -> 5C
Required:
- Narrow implementation shipped without out-of-scope leakage.
- Failure-class policy behavior implemented and observable via diagnostics.
- Prompt budget precedence rule implemented.
- Initial performance targets instrumented and reported (p50/p95/p99, cold/warm labels).

## Gate: 5C -> 6A/6B
Required in supported deterministic environments:
- Replay corpus includes 9 required scenario buckets.
- N=100 replay runs per bucket.
- 0 winner drift.
- 0 alternate drift.
- Deterministic diagnostics stable on frozen deterministic fields.
- No canon mutation checks pass.
- Required CI suites pass:
  - `test_contested_selection_determinism.py`
  - `test_no_canon_mutation.py`
  - `test_prompt_contract_enforcement.py`
  - `test_contested_event_append_safety.py`

Best-effort environments:
- report-only (non-blocking for deterministic gate).

## Gate: 6A Planning -> 6A Execution
Required:
- `phase6a-threshold-tuning-trust-policy.md` published
- `phase6a-acceptance-criteria.md` published
- sweep matrix and stop condition frozen
- trust bands and threshold candidates frozen

## Gate: 6A -> 6B
Required:
- threshold sweep run completed across 9 scenario buckets
- selected default + fallback threshold profiles documented
- no deterministic regression in supported environments
- required validation suites pass:
  - `test_contested_selection_determinism.py`
  - `test_prompt_contract_enforcement.py`
  - `test_no_canon_mutation.py`

## Gate: 6B Planning -> 6B Execution
Required:
- `phase6b-operational-policy-governance.md` published
- `phase6b-default-runtime-profile.md` published
- `phase6b-diagnostics-slo.md` published
- `phase6b-environment-support-matrix.md` published

## Gate: 6B -> 7A
Required:
- runtime default profile finalized and versioned
- retention policy by event type finalized
- diagnostics SLO targets finalized
- environment-tier enforcement finalized
- required validation suites pass:
  - `test_memory_lab_runtime_flags.py`
  - `test_memory_lab_retention_policy.py`
  - `test_memory_lab_diagnostics_slo.py`
  - `test_memory_lab_environment_tiers.py`
  - `test_contested_event_append_safety.py`
  - `test_no_canon_mutation.py`

## Gate: 7A Planning -> 7A Execution
Required:
- `phase7a-experimental-isolation-contract.md` published
- `phase7a-promotion-defer-kill-rubric.md` published
- experimental namespace and isolation rules frozen
- rollback protocol frozen

## Gate: 7A -> 7B
Required:
- isolation contract tests pass:
  - `test_memory_lab_experimental_flag_isolation.py`
  - `test_memory_lab_experimental_default_off.py`
  - `test_memory_lab_experimental_namespace_separation.py`
  - `test_memory_lab_no_core_contract_mutation.py`

## Gate: 7B Wave Start
Required per wave:
- at most 2 experiments declared
- each experiment has charter based on `phase7b-experiment-template.md`
- regression budgets defined for each experiment

Wave 1 lock requirements:
- wave charter published: `phase7b-wave1-charter.md`
- experiment specs published:
  - `phase7b-wave1-exploration-pressure.md`
  - `phase7b-wave1-reinforcement-saturation.md`
- Wave 1 includes exactly two experiments:
  - `A1 — Exploration Pressure (Exposure Pressure Only)`
  - `B1 — Reinforcement Saturation Cap`
- explicit out-of-scope lock for `A2 winner inversion`

## Gate: 7B Wave Complete
Required per experiment:
- determinism check result recorded
- comparator mutation result recorded
- prompt contract mutation result recorded
- no canon mutation result recorded
- prompt budget result recorded
- event growth result recorded
- latency budget result recorded
- decision recorded (`promote|defer|kill`)
- required experiment suites pass:
  - `test_memory_lab_experiment_replay_regression.py`
  - `test_memory_lab_experiment_prompt_budget.py`
  - `test_memory_lab_experiment_event_growth.py`
  - `test_no_canon_mutation.py`

Required wave summary:
- `phase7b-experiment-log.md` updated
- blocker incidents and rollbacks recorded

Wave 1 mandatory gates:
- combined-mode test gate (required):
  - `A1+B1` must be executed and evaluated together
  - combined guardrails must pass (prompt/event/latency)
  - winner/alternate drift in supported deterministic environments must remain `0`
- rollback gate (required):
  - single-flag disable restores baseline behavior in one run
  - no migration steps
  - no cleanup steps
  - no persistent state conversion
- no-comparator-mutation gate (required)
- no-prompt-contract-mutation gate (required)
- no-canon-mutation gate (required)

## Gate: 7B -> 8
Required:
- promoted candidates satisfy 7A promotion rubric
- no frozen core contract regressions
- compatibility and migration policy remains valid
