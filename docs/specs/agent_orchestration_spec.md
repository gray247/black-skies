# Agent Orchestration Spec

Status: Draft
Last Reviewed: 2026-05-19

## Purpose

Black Skies uses semi-manual agent orchestration across ChatGPT, Codex, and future Symphony-style agents.

Current orchestration is for scoped execution, review, and handoff support, not full automation.

Future direction may evolve toward hierarchical orchestration, but only through the existing tracker, roadmap, and deferred-work process.

## Non-Goals

This spec does not create a new roadmap system.

It does not replace:

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`

It does not claim output-quality validation, real-author-material maturity, or brand-new story-from-scratch readiness.

## Agent Execution Limits

Agents may:

- execute scoped work
- propose deferred issues or tickets
- request clarification when scope is unclear
- stop or escalate when scope breaks

Agents may not:

- freely redesign architecture outside the requested scope
- treat planning language as runtime truth
- overclaim evidence authority
- fake AI or intelligence behavior that is not implemented

## Human Verification Semantics

During buildout phases, human verification means build/runtime/workflow verification only.

It confirms:

- the feature or surface exists
- it launches or behaves without obvious runtime errors
- it does not break stable GUI or current workflow
- visible regressions are not obvious

It does not prove:

- literary quality
- AI usefulness
- final writing quality
- complete authoring readiness
- real-author workflow maturity
- output-quality validity

## Proof Classes

The following proof states are recognized for orchestration and planning claims:

- `runtime-proven`
- `harness-proven`
- `test-lane-proven`
- `policy-only`
- `human-smoke verified`
- `build/runtime verified`
- `output-quality unverified`
- `creative-quality deferred`
- `regression-risk`
- `deferred`
- `unverified`

Recommended use:

- `runtime-proven`
  - real runtime behavior is directly observed in the relevant execution path
- `harness-proven`
  - a harness or fixture path is proven, but not the production path
- `test-lane-proven`
  - a lane passes, but the lane only proves its own scope
- `policy-only`
  - the rule exists in docs or governance, but not as runtime-backed behavior
- `human-smoke verified`
  - an operator confirmed existence, launch, and obvious safety
- `build/runtime verified`
  - build or runtime behavior is verified at the system level
- `output-quality unverified`
  - no claim about writing quality or output usefulness should be made yet
- `creative-quality deferred`
  - output usefulness, literary quality, and story-development value are later work
- `regression-risk`
  - a known or suspected issue remains open or unstable
- `deferred`
  - intentionally postponed to a later phase or bucket
- `unverified`
  - no valid proof has been recorded yet

## Validation Batching

Bounded batched execution windows are allowed when:

- scope is narrow
- risk is controlled
- the work is clearly within the current phase or task

Validation is required:

- after a batch
- before commit
- before any workflow-green claim

Immediate validation is required for high-risk changes touching:

- stable GUI
- persistence
- backend contracts
- launcher
- preload
- project loading
- save/export
- authority or proof logic

## Stop And Escalation Rules

Stop and escalate if:

- stable GUI risk appears
- proof claims exceed evidence
- the same failure repeats
- architecture changes are needed outside scope
- runtime and harness evidence conflict
- fake AI or intelligence would be introduced
- phase ownership is unclear

## Roadmap Integration

This spec supplements existing docs.

It does not replace:

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`

Phase numbers may shift only through the existing tracker, roadmap, and deferred-matrix process.

## Current And Future Work

Provisional future buckets, not committed claims:

- brand-new story creation
- real author-material workflow
- Narrative Consequence Engine / Intelligence Layer
- output-quality validation
- partial orchestration automation

These are placeholders for later planning only. They are not proof that the workflows exist today.

