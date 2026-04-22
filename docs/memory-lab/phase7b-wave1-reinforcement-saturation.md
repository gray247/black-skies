# Memory Lab: Phase 7B Wave 1 — B1 Reinforcement Saturation Cap

## Scope
- Experiment ID: `B1`
- Mechanism class: `reinforcement saturation cap`
- Goal: bound reinforcement growth to reduce runaway confidence accumulation risk
- Selection contract constraint: winner identity must remain baseline-equivalent in supported deterministic environments

## Mechanism Description
B1 applies a cap to reinforcement contribution so additional reinforcement has diminishing or bounded effect after saturation thresholds are reached.

Mechanism intent:
- prevent unbounded reinforcement accumulation from dominating selection dynamics
- keep reinforcement impact bounded and observable
- preserve stable winner/alternate selection contracts in supported deterministic environments

Mechanism non-intent:
- no comparator tuple/provenance mutation
- no prompt contract mutation
- no canon mutation
- no token growth attributable to saturation logic itself

## Bounded Effect Expectations
- bounded additional event growth only (not unbounded event amplification)
- bounded latency overhead only
- no prompt-token overhead from saturation logic itself
- no deterministic winner drift

## Guardrails (Initial, Hard)
- max additional event growth vs baseline: `+10%`
- max selection latency increase vs baseline: `+10%`
- max prompt-token growth from saturation logic itself: `0%`
- max winner drift in supported deterministic environments: `0`

## Success Criteria
- event growth remains within `+10%`
- selection latency increase remains within `+10%`
- prompt-token growth from saturation logic remains `0%`
- winner drift remains `0` in supported deterministic environments
- no comparator mutation, no prompt-contract mutation, no canon mutation assertions all pass
- combined-mode (`A1+B1`) remains within combined Wave 1 guardrails

## Kill Criteria
- event growth exceeds `+10%`
- selection latency increase exceeds `+10%`
- prompt-token growth from saturation logic is non-zero
- any deterministic winner drift in supported deterministic environments
- any comparator/prompt-contract/canon mutation assertion failure

## Required Tests
- B1-only replay regression vs stable baseline in supported deterministic environments
- winner drift assertion (`winner=0`)
- event growth assertion (`<= +10%`)
- selection latency assertion (`<= +10%`)
- prompt-token growth from saturation logic assertion (`= 0%`)
- no comparator mutation assertions
- no prompt contract mutation assertions
- no canon mutation assertions
- mandatory combined-mode (`A1+B1`) validation under Wave 1 combined guardrails
- rollback SLA verification:
  - single-flag disable restores baseline behavior in one run
  - no migration/cleanup/state conversion required
