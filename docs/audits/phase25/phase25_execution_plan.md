# Phase 25 - Long-Session / Large-Project Hardening Plan

Canonical role: bounded hardening plan for long-session durability, large-project behavior, and backend drop/reconnect investigation when the evidence warrants it.

Does not own: AI/intelligence work, two-monitor or detached-window work, Split Command promotion to default, broad renderer/backend rewrites, or speculative performance tuning.

Downstream dependencies: Phase 20 shell stability baselines, Phase 21 command-center hardening, Phase 22 writing-surface scope, Phase 23 intelligence-governance scope, and any later closure review for unresolved instability.

## Core Intent

Phase 25 is a stabilization phase, not a feature phase.

Its job is to convert repeatable long-session and large-project risk into either:

1. a localized fix, or
2. a clearly documented deferred risk with the correct owner and evidence class.

It must not become open-ended bug hunting.

## Protection Rules

- Stable GUI remains the canonical default path and must stay unchanged unless a concrete failure proves otherwise.
- Split Command remains experimental and flag-gated.
- No backend drop claim may be generalized beyond the lane in which it was reproduced.
- No performance change may be justified by vibes, anecdotes, or speculative profiling.
- No warning-classified failure may be silently downgraded without evidence-backed reasoning and recorded classification.
- No speculative optimization may be introduced without reproducible evidence that the path materially affects stability, durability, or usability.

## Evidence Threshold Rules

A Phase 25 issue must be classified before broad hardening work begins:

- `reproducible`
- `intermittent with captured evidence`
- `CI-only`
- `operator-observed only`
- `unverified suspicion`
- `policy-only concern`

Only `reproducible` or `intermittent with captured evidence` issues may trigger broader hardening work.

`CI-only` issues may be investigated if the harness evidence is strong enough to reproduce the failure deterministically in the local lane.

`operator-observed only` issues may be documented, but they do not justify broad code changes until a reproducible lane exists.

`unverified suspicion` and `policy-only concern` items remain deferred unless later evidence upgrades them.

## Session and Scale Definitions

Long-session and large-project terms must be measurable.

Baseline definitions:

- `15-minute baseline` for simple reopen/switch endurance
- `1-hour durability` for sustained session stability
- `project-switch stress` for repeated project load/reload/reopen loops
- `reload/reopen loop count` for bounded restart-style repetition
- `large-project size assumptions` for the current test lane, documented before each run

These are test conditions, not product promises.

Large-project assumptions should be recorded with rough, repeatable counts such as:

- outline size
- scene count
- document count
- project reload frequency

## Baseline / Stress Matrix

Phase 25A uses a small, repeatable matrix to separate baseline behavior from stress behavior before any hardening work begins.

| Lane | Command shape | Purpose | Evidence class |
| --- | --- | --- | --- |
| Smoke baseline | `python scripts/load.py --profile smoke --start-service` | Short repeatable sanity lane for long-session / large-project harness health | reproducible if it passes or fails consistently |
| Default baseline | `python scripts/load.py --profile default --start-service` | Baseline workstation load with moderate concurrency and warmup | reproducible when the same profile is rerun |
| Stress lane | `python scripts/load.py --profile stress --start-service` | Elevated concurrency stress for durability and responsiveness drift | reproducible or intermittent with captured evidence |
| Soak lane | `python scripts/load.py --profile soak --start-service` | Longer-duration drift observation | reproducible or intermittent with captured evidence |
| Project-switch loop | profile-backed load lane with explicit reopen/switch repetition | Capture reload/reopen drift and project-switch behavior | reproducible if the loop count and project assumptions are recorded |

Current matrix guidance:

- keep stable GUI evidence separate from Split Command-only evidence
- record the exact lane, profile, cycle count, concurrency, timeout, and project assumptions before each run
- classify failures before any hardening work:
  - reproducible
  - intermittent with captured evidence
  - CI-only
  - operator-observed only
  - unverified suspicion
  - policy-only concern
- only reproducible and intermittent-with-captured-evidence lanes may justify code changes
- `CI-only` lanes need a local reproduction path before they can justify broad hardening
- the smoke lane is the first pass baseline; it is not a substitute for the stress or soak lanes

## Resource and Memory Rules

- Memory pressure must be measured from observed runtime behavior, not inferred from general slowness.
- CPU or memory claims must be tied to a reproducible session condition, a captured log, or a deterministic harness loop.
- If a metric is not reproducible, it is not a Phase 25 blocker.
- Do not broaden a fix into architecture work just because a test feels heavy.

## Stability vs Performance Separation

Phase 25 distinguishes these categories:

| Category | Meaning |
| --- | --- |
| Stability | crashes, reconnect failure, reload corruption |
| Durability | degradation that accumulates over long sessions |
| Responsiveness | slow UI or slow reaction time |
| UX noise | flicker, repaint roughness, visual churn |
| Resource pressure | memory or CPU growth |

The phase should only expand when the observed issue actually belongs to the category being addressed.

## Scope and Batches

### `25A` Reproduction and stress baseline

- build a repeatable long-session / large-project stress matrix
- capture the minimum reproducible path for flicker, reconnect loss, or durability drift
- separate stable GUI reproduction from Split Command-only reproduction
- document the session-length and project-size assumptions used in each run
- start with the smoke baseline lane, then widen only if the same evidence class repeats in the default/stress/soak lanes
- use the project-switch loop only when the run notes include the exact loop count and project assumptions

### `25B` Backend drop / reconnect investigation

- if stable GUI also reproduces the drop, treat it as a cross-surface blocker
- if the issue is Split Command-only, keep the fix within the shell/runtime path
- preserve the canonical stable GUI path while narrowing the failure source

### `25C` Durability and performance hardening

- address long-session flicker, memory pressure, reload/reopen drift, and large-project responsiveness only where reproducible
- keep changes minimal and localized to the failing path
- do not optimize speculative bottlenecks
- status note: a reproducible stress-lane `POST /api/v1/draft/accept` failure was traced to recovery-state file access and same-scene harness collisions; the fix path stayed narrow (per-file recovery lock + per-scene stress serialization) and did not widen into GUI or architecture changes.

### `25D` Closure review and deferred carry-forward

- classify what is runtime-proven, test-lane-proven, human-smoke only, policy-only, and still deferred
- explicitly carry forward anything still unproven rather than relabeling it solved
- close only what has evidence for the lane being claimed

## Exit Criteria

Phase 25 closes when all of the following are true:

- major reproducible durability blockers are resolved or explicitly classified
- the stable GUI baseline remains intact
- reconnect/drop behavior is classified at the correct surface
- long-session degradation is either fixed, reproducible, or deferred with evidence
- unresolved instability is documented instead of silently normalized

## Validation Plan

- Targeted renderer or App tests for any touched durability or reconnect path
- Backend tests only if the failure crosses into service contracts or reconnect behavior
- Playwright smoke for long-session stability, project switch, reload/reopen, and stable GUI baseline checks
- Baseline/stress harness runs using `scripts/load.py` profiles:
  - smoke baseline first
  - default baseline only when smoke evidence needs a higher-confidence baseline
  - stress and soak only when the issue class justifies a longer lane
- Split Command flag-on smoke only if it is part of the reproduced failure
- Lint only if renderer/UI code changes
- Human smoke after a fix only for build/runtime/workflow verification, not quality claims

## Non-Goals

- no AI / intelligence work
- no two-monitor or detached-window work
- no promotion of Split Command to default
- no output-quality validation claims
- no real-author-material maturity claims
- no brand-new story-from-scratch claims
- no broad renderer or backend rewrite
- no roadmap redesign or competing roadmap system

## Closure Note

Phase 25 is a bounded hardening lane.

If the failure is not reproducible in the stable GUI, it should not be promoted into a broader product claim.
