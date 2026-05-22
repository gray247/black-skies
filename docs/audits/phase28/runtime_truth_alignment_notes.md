# Phase 28 Pass 1 - Runtime Truth Alignment Notes

Status: Draft
Date: 2026-05-21
Pass: Phase 28 Pass 1 - Authority Inventory

## Runtime-Truth Sources Identified

Primary runtime-truth sources for Phase 28:

- `build/runtime_truth.json` (runtime ledger)
- `docs/specs/current_state.md`
- `docs/specs/memory_runtime.md`
- `docs/specs/model_runtime.md`
- `docs/policies/runtime_truth_policy.md`
- runtime code referenced by the canonical runtime specs

Policy-level governance source:

- `docs/policies/runtime_truth_policy.md` defines that planning docs are not runtime authority and must say so (`:36`).

## Docs Properly Deferring to Runtime Truth

- `docs/roadmap.md` explicitly says it is not runtime authority and points to runtime truth sources (`:1`, `:8`).
- `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` states it is a target spec and not a runtime claim (`:19`).
- `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md` frames this phase as docs-only audit work (`:8`, `:10`).
- `docs/specs/current_state.md`, `docs/specs/memory_runtime.md`, and `docs/specs/model_runtime.md` explicitly position themselves as current runtime references.

## Docs That May Need Stronger Runtime-Truth Disclaimers

- `docs/gui/gui_layouts.md`: marked `Active (Canonical)` while mixing shipped behavior with future-only sections.
- `docs/specs/workflow_spine.md`: phase-era contract draft with no explicit reminder that current runtime authority remains in runtime docs/code.
- `docs/specs/pane_lifecycle.md`: contract draft may need explicit runtime-authority boundary language.
- `docs/specs/layout_persistence.md`: contract draft may need explicit runtime-authority boundary language.
- `docs/specs/generation_scope.md`: contract draft may need explicit runtime-authority boundary language.
- `docs/phases/phase11b_implementation_plan.md`: still labeled as living roadmap, but now used mostly as historical provenance.
- `docs/audits/phase27/phase27_execution_plan.md`: status text appears outdated for a closed phase and can confuse current runtime/planning status readers.

These are inventory observations only. Labeling changes and copy changes are Pass 2+ work.

## Systems Needing Pass 2 Runtime/Planning Alignment Review

- Phase status consistency for closed phases (`Phase 11B`, `Phase 27`) versus legacy planning artifacts.
- GUI authority boundaries among:
  - `docs/gui/gui_layouts.md`
  - `docs/specs/design_system_v1.md`
  - correction-block phase specs
- Workflow terminology consistency, especially Writing Surface vocabulary and phase-era terms in older contracts.
- Story Unit architecture claims:
  - current runtime adapters and scene-first model references
  - future planning claims in Phase 30 and candidate Phase 32 triggers
- Contract drafts from Phase 11 that still describe current behavior but may not carry enough runtime-truth disclaimers.

## Phase 28 Runtime-Truth Handling Rules

During Phase 28 passes:

1. Use `build/runtime_truth.json` and `docs/specs/current_state.md` as the first runtime-claim check.
2. Use `docs/specs/memory_runtime.md` and `docs/specs/model_runtime.md` for subsystem runtime boundaries.
3. Use `docs/policies/runtime_truth_policy.md` as policy authority for doc claim discipline.
4. Treat roadmap, audit, phase, and GUI planning docs as planning/design evidence unless they explicitly cite runtime truth and remain consistent with runtime references.
5. Record ambiguous items as `unknown_needs_review` instead of force-classifying.

## Pass 1 Outcome

Runtime truth sources are present and explicit. The main risk is not missing runtime truth docs; it is mixed-authority wording in planning and GUI documents that can be misread as current runtime authority.
