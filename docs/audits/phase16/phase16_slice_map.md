Canonical role: Compact execution index for Phase 16 slices.
Scope: summary only; see [phase16_master_execution_plan.md](/C:/Dev/black-skies/docs/audits/phase16/phase16_master_execution_plan.md) for the full operational model.
Last reviewed: 2026-05-16.

# Phase 16 Slice Map

| Slice | Objective | Allowed scope | Forbidden scope | Required evidence | Runtime vs harness proof | Human verification | Deliverables | Stop conditions | Closure criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 16A Runtime Truth Audit | Map truth mismatches across renderer, preload, backend, and filesystem | Read-only authority tracing, stale-state inspection, truth mapping | GUI redesign, alias-display redesign, speculative refactors | Source inspection, targeted tests, operator-visible examples when needed | Runtime-first, harness only supports | Mandatory for operator-facing truth claims | Authority mismatch inventory, runtime truth map | Any drift fix turning into GUI modernization or broad refactor | Every mismatch classified by owner and phase |
| 16B Long-Running Operation Stability | Prove long-running actions complete safely and clearly | Backup/restore, snapshot verification, export, generation, recovery/reopen timing semantics | Broad performance work, async/job redesign, queue systems | Real runs, timing notes, completion/degraded wording checks | Runtime proof required | Mandatory for backup/restore, strongly preferred elsewhere | Timeout semantics map, long-running behavior matrix | Any attempt to become performance engineering | Explicit completion semantics and no timeout ambiguity |
| 16C Service / Health State Authority Audit | Verify health-state propagation and action gating meaning | Health semantics, disabled/enabled gating, offline/unavailable distinctions | Status-system modernization, cosmetic copy sweeps | Source inspection, targeted tests, operator review for misleading labels | Hybrid | Mandatory when a label can block critical action | Health-state authority matrix | Any attempt to modernize the whole status system | No critical action blocked by mislabeled state |
| 16D UI / Runtime Drift Audit | Find UI copy/behavior that misstates runtime truth | Drift detection, authority-sensitive copy fixes | Control-surface redesign, visual modernization | Operator-visible examples, screenshot/payload evidence, targeted UI tests | Runtime proof for meaning, harness supports path only | Mandatory when UI copy is the source of confusion | Drift matrix, wording corrections, deferred-ownership notes | Any drift fix becoming a visual redesign | Authority-sensitive copy no longer contradicts runtime meaning |
| 16E Operational Chaos Testing | Stress bounded negative-path and duplicate-operation risk | Chaos-style stress of existing flows, stale-state and recovery ambiguity checks | Open-ended fuzzing, infrastructure experiments | Reproducible fail/pass cases, negative assertions, stress notes | Mostly runtime | Mandatory when operator trust is affected | Chaos matrix, duplicate-op notes, stale-state notes | Unbounded fuzzing or general resilience engineering | Important chaos cases classified and bounded |
| 16F Closure & Deferred-Risk Classification | Classify remaining items as closed, deferred, or blocked | Closure review, deferred ownership mapping, stop-gate summary | New implementation work, Phase 17/19 scope creep | Final proof matrix, human-verification summary, repetition evidence | Closure respects strongest proof per category | Mandatory for operator-facing claims | Final closure note, deferred-risk inventory | Any unresolved trust issue lacking owner | Every item closed, deferred, or blocked with owner |

# Execution Order

Recommended order:

1. `16A`
2. `16C`
3. `16D`
4. `16B`
5. `16E`
6. `16F`

Parallel-safe pairs:

- `16A` and `16C` when both stay read-only
- `16A` and `16D` when `16D` only classifies current drift

Not parallel-safe:

- `16B` before `16A` / `16C`
- `16E` before `16B` / `16D`
- any implementation work before the proof boundary is explicit

# Proof Reminder

- Harness green proves harness contract only
- Truth-lane green proves truth-lane contract only
- Synthetic green proves synthetic wiring only
- Human verification proves operator-facing meaning
- Closure requires the strongest proof needed for each claim
