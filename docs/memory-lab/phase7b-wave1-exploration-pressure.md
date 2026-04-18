# Memory Lab: Phase 7B Wave 1 — A1 Exploration Pressure

## Scope (A1-Only)
- Experiment ID: `A1`
- Mechanism class: `exposure pressure only`
- Allowed effect: bounded increase in near-threshold alternate surfacing opportunity
- Selection contract constraint: winner identity must remain baseline-equivalent in supported deterministic environments

## Explicit Ban (Hard)
- `A2 winner inversion` is out of scope and forbidden in Wave 1.
- A1 must not invert winner selection under any condition in Wave 1.

## Mechanism Description
A1 introduces bounded exposure pressure so near-threshold alternates may be preserved or surfaced more often when baseline conditions already classify them as close competitors.

Mechanism intent:
- increase alternate visibility pressure only
- preserve baseline winner selection semantics
- remain strictly feature-flagged and default-off

Mechanism non-intent:
- no winner inversion
- no comparator tuple/provenance mutation
- no prompt contract mutation
- no canon mutation

## Guardrails (Initial, Hard)
- max alternate surfacing delta vs baseline: `+15%`
- max prompt-token growth vs baseline: `+20%`
- max winner drift in supported deterministic environments: `0`
- max alternate drift in supported deterministic environments: `0`

## Success Criteria
- alternate surfacing increase is measurable and bounded within `+15%`
- prompt-token impact remains within `+20%`
- winner and alternate drift remain `0` in supported deterministic environments
- no comparator mutation, no prompt-contract mutation, no canon mutation assertions all pass
- combined-mode (`A1+B1`) remains within combined Wave 1 guardrails

## Kill Criteria
- any observed winner inversion behavior
- any deterministic winner or alternate drift in supported deterministic environments
- alternate surfacing growth exceeds `+15%`
- prompt-token growth exceeds `+20%`
- any comparator/prompt-contract/canon mutation assertion failure

## Required Tests
- A1-only replay regression vs stable baseline in supported deterministic environments
- deterministic drift assertions (`winner=0`, `alternate=0`)
- alternate surfacing delta assertion (`<= +15%`)
- prompt-token growth assertion (`<= +20%`)
- no comparator mutation assertions
- no prompt contract mutation assertions
- no canon mutation assertions
- mandatory combined-mode (`A1+B1`) validation under Wave 1 combined guardrails
- rollback SLA verification:
  - single-flag disable restores baseline behavior in one run
  - no migration/cleanup/state conversion required
