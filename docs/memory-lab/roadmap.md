# Memory Lab Roadmap (Phase 5A -> 8)

## Program / System
- Program: `Memory Lab`
- System: `Narrative Cognition Layer`

## Phase 5A — Contested Memory Spec + Acceptance Freeze
Purpose: lock contested-memory semantics before code.

Primary outputs:
- frozen contested key, comparator, alternate math, loser policy, anti-thrash, prompt contract
- frozen acceptance criteria and gate definitions
- spec change policy and authority model

## Phase 5B — Contested Memory Narrow Implementation
Purpose: implement only frozen Phase 5 contracts.

Primary outputs:
- chapter-local contested grouping
- deterministic winner + optional alternate behavior
- lightweight contested outcome events
- fail-soft load/resolve/persistence behavior with diagnostics

Out of scope includes:
- cross-chapter continuity
- multiple alternates
- dynamic thresholds
- loser penalties
- UI analytics
- broad architecture refactors

## Phase 5C — Replay / Regression Verification
Purpose: prove deterministic behavior and safety.

Primary outputs:
- replay corpus coverage (9 required buckets)
- deterministic gate results in supported environments
- drift triage process
- required CI gate suites passing

## Phase 6A — Threshold Tuning + Trust Policy
Purpose: run controlled threshold sweeps and freeze trust policy.

Primary outputs:
- sweep matrix results across required replay corpus buckets
- numeric trust-band definitions (`stable`, `contested_useful`, `unstable`)
- selected default threshold profile + conservative fallback profile
- alternate usefulness policy tied to trust bands
- stop-condition report

## Phase 6B — Operational Policy
Purpose: define enforceable runtime governance for stable operation.

Primary outputs:
- versioned default runtime profile
- event retention policy by event type
- diagnostics SLO with measurable targets
- environment support/enforcement matrix
- waiver authority and process policy

## Phase 7A — Experimental Memory Modes Framework
Purpose: freeze isolation and governance before experiments run.

Rules:
- feature-flagged
- separate config namespace
- never default-on
- cannot alter frozen core contracts
- rollback protocol required
- promotion/defer/kill rubric required

## Phase 7B — Experimental Memory Behaviors
Purpose: run controlled experimental waves under 7A governance.

Wave model:
- max 2 experiments per wave
- each experiment requires charter and regression budgets
- each experiment ends with promote/defer/kill decision

### Phase 7B Wave 1 (First Experiment Wave)
Objective:
- test the dominant-risk failure mode: winner lock / runaway confidence

Experiments:
- `A1 — Exploration Pressure (Exposure Pressure Only)`
- `B1 — Reinforcement Saturation Cap`

Wave 1 constraints:
- `A2 winner inversion` explicitly out of scope
- combined-mode testing (`A1+B1`) is mandatory
- rollback SLA must be proven (single-flag disable to baseline in one run)

Subsequent waves:
- only after Wave 1 promote/defer/kill decisions are logged and gates pass

Example future experiment classes (post Wave 1):
- unreliable narrator mode
- emotional salience weighting
- cross-chapter contested continuity (experimental only)

## Phase 8 — Productization / Stable Memory Core
Purpose: finalize stable shipping behavior.

Primary outputs:
- stable defaults
- compatibility/migration contract enforcement
- clear separation of stable vs experimental behavior
- production documentation set
