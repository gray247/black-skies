# Memory Lab: Phase 7B Wave 1 Charter

## Wave Identity
- Wave ID: `phase7b-wave1`
- Date Locked: `2026-04-15`
- Scope: documentation + charter lock only

## Objective
Validate whether bounded experimental pressure can reduce winner-lock/runaway-confidence risk without mutating stable selection contracts.

Primary risk under test:
- winner lock / runaway confidence in contested-memory selection outcomes

## Why A1 and B1 Are Paired
- `A1 (Exploration Pressure)` adds bounded exposure pressure for near-threshold alternates.
- `B1 (Reinforcement Saturation Cap)` limits reinforcement accumulation so confidence does not compound unchecked.
- Pairing is required to test both sides of the same dominant-risk loop in one wave:
  - pressure that may surface alternates
  - cap that constrains runaway reinforcement
- Combined-mode behavior is a hard gate for wave completion.

## Wave Experiments (Exactly Two)
1. `A1 — Exploration Pressure (Exposure Pressure Only)`
2. `B1 — Reinforcement Saturation Cap`

No additional experiments are allowed in Wave 1.

## Out of Scope (Hard)
- `A2 winner inversion` behavior (forbidden in Wave 1)
- any inversion of winner selection
- stable comparator/provenance mutation
- prompt contract mutation
- canon mutation or canon rewrite behavior
- persistent state conversion or migration steps
- default-on enablement of experimental flags

## Hard Numeric Guardrails

### A1 Exploration Pressure
- max alternate surfacing delta vs baseline: `+15%`
- max prompt-token growth vs baseline: `+20%`
- max winner drift in supported deterministic environments: `0`
- max alternate drift in supported deterministic environments: `0`

### B1 Reinforcement Saturation
- max additional event growth vs baseline: `+10%`
- max selection latency increase vs baseline: `+10%`
- max prompt-token growth from saturation logic itself: `0%`
- max winner drift in supported deterministic environments: `0`

### Combined A1+B1
- max prompt-token growth vs baseline: `+20%`
- max event growth vs baseline: `+15%`
- max selection latency increase vs baseline: `+15%`
- max winner/alternate drift in supported deterministic environments: `0`

## Required Outputs
- charter lock document (`phase7b-wave1-charter.md`)
- experiment docs:
  - `phase7b-wave1-exploration-pressure.md`
  - `phase7b-wave1-reinforcement-saturation.md`
- phase-gate updates for Wave 1
- roadmap update naming Wave 1 first and enumerating `A1` + `B1`
- experiment-log section and entry template fields for Wave 1 decisions

## Required Tests / Gates
- combined-mode testing is mandatory
- no comparator mutation assertions are mandatory
- no prompt contract mutation assertions are mandatory
- no canon mutation assertions are mandatory
- deterministic winner/alternate drift assertions in supported deterministic environments are mandatory
- guardrail budget assertions for prompt/event/latency are mandatory

## Rollback SLA (Hard Requirement)
- single-flag disable restores baseline behavior in one run
- no migration steps
- no cleanup steps
- no persistent state conversion

## Decision Rules: Promote / Defer / Kill

### Promote (all required)
- all Wave 1 required gates pass in supported deterministic environments
- A1 and B1 each pass their per-experiment guardrails
- combined A1+B1 pass combined guardrails
- no comparator mutation, no prompt-contract mutation, no canon mutation
- rollback SLA validated by test evidence

### Defer
- no hard contract mutation and rollback SLA remains valid
- at least one improvement signal exists, but one or more non-critical guardrail targets are inconclusive
- explicit next-wave revisit condition is documented

### Kill
- any hard contract mutation detected (comparator, prompt contract, canon)
- any deterministic winner/alternate drift in supported deterministic environments
- any hard guardrail breach without credible bounded mitigation
- rollback SLA cannot be demonstrated
