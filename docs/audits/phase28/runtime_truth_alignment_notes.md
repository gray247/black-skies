# Phase 28 - Runtime Truth Alignment Notes

Status: Finalized for Phase 28 closure
Date: 2026-05-21
Pass: Phase 28 closure pass

## Runtime-Truth Sources Identified (Final)

Primary runtime-truth sources for Phase 28:

- `build/runtime_truth.json` (runtime ledger)
- `docs/specs/current_state.md`
- `docs/specs/memory_runtime.md`
- `docs/specs/model_runtime.md`
- `docs/policies/runtime_truth_policy.md`
- runtime code referenced by the canonical runtime specs

Policy-level governance source:

- `docs/policies/runtime_truth_policy.md` defines that planning docs are not runtime authority and must say so (`docs/policies/runtime_truth_policy.md:36`).

## Docs Properly Deferring to Runtime Truth

- `docs/roadmap.md` explicitly says it is not runtime authority and points to runtime truth sources (`docs/roadmap.md:1`, `docs/roadmap.md:8`).
- `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` states it is a target spec and not a runtime claim (`docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:19`).
- `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md` frames this phase as docs-only audit work (`docs/audits/phase28/phase28_planning_roadmap_authority_audit.md:8`, `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md:10`).
- `docs/specs/current_state.md`, `docs/specs/memory_runtime.md`, and `docs/specs/model_runtime.md` explicitly position themselves as current runtime references.

## Final Runtime-Truth Precedence Rules

1. Runtime claims about shipped behavior must resolve to runtime sources first:
   - `build/runtime_truth.json`
   - `docs/specs/current_state.md`
   - `docs/specs/memory_runtime.md`
   - `docs/specs/model_runtime.md`
2. Policy enforcement source for doc-claim discipline is `docs/policies/runtime_truth_policy.md`.
3. Planning/audit/roadmap/gui docs can guide sequencing and direction but cannot override runtime claims.
4. When a planning doc and runtime source disagree, the runtime source wins and the planning doc must be relabeled or corrected.
5. If a runtime claim cannot be proven from the runtime sources, it must be marked unproven or unknown instead of inferred.

## How Future Phases Must Use Runtime Truth

- Phase 29 must use the runtime sources above when classifying `runtime_backed`, `placeholder`, `mock`, or `future_only`.
- Phase 30 must keep all workflow/spec language explicit that it is future intent until runtime-backed by code and runtime docs.
- Phase 31 must not promote sequencing claims into runtime claims and must preserve runtime/planning separation in renumbering notes.
- Candidate Phase 32, if inserted later, must define persistence/quality claims as planned until runtime evidence exists.

## Docs That May Need Stronger Runtime-Truth Disclaimers Later

- `docs/gui/gui_layouts.md`: marked canonical while mixing shipped behavior and future-only sections (`docs/gui/gui_layouts.md:1`, `docs/gui/gui_layouts.md:46`, `docs/gui/gui_layouts.md:129`).
- `docs/specs/workflow_spine.md`: still a contract draft and may benefit from explicit runtime-authority reminder (`docs/specs/workflow_spine.md:3`).
- `docs/specs/pane_lifecycle.md`: contract draft may need stronger runtime-authority boundary copy (`docs/specs/pane_lifecycle.md:3`).
- `docs/specs/layout_persistence.md`: contract draft may need stronger runtime-authority boundary copy (`docs/specs/layout_persistence.md:3`).
- `docs/specs/generation_scope.md`: contract draft may need stronger runtime-authority boundary copy (`docs/specs/generation_scope.md:3`).
- `docs/phases/phase11b_implementation_plan.md`: stale header language for a historical doc (`docs/phases/phase11b_implementation_plan.md:3`).
- `docs/audits/phase27/phase27_execution_plan.md`: stale status wording for a closed phase (`docs/audits/phase27/phase27_execution_plan.md:3` with closure in `docs/BLACK_SKIES_FIX_TRACKER.md:3008`).

## Docs Safe As-Is for Phase 28 Closure

- `docs/specs/current_state.md`
- `docs/specs/memory_runtime.md`
- `docs/specs/model_runtime.md`
- `docs/policies/runtime_truth_policy.md`
- `docs/roadmap.md` (explicitly non-runtime authority and points to runtime sources)
- `docs/roadmap/master_phase_allocation_plan.md` and `docs/roadmap/deferred_work_matrix.md` (explicitly planning/sequencing/allocation authority with tracker/runtime boundaries)

## Systems Needing Pass 2 Runtime/Planning Alignment Review

- Phase status consistency for closed phases (`Phase 11B`, `Phase 27`) versus stale header language.
- GUI authority boundaries among `docs/gui/gui_layouts.md`, `docs/specs/design_system_v1.md`, and future Phase 30 specs.
- Workflow terminology consistency, especially Writing Surface wording in future-phase docs.
- Story Unit architecture claims between runtime adapters and future persistence-model planning.
- Phase 11 contract drafts that still describe current behavior but may need stronger runtime-boundary copy.

## Phase 28 Runtime-Truth Handling Rules (Final)

During Phase 28 passes:

1. Use `build/runtime_truth.json` and `docs/specs/current_state.md` as the first runtime-claim check.
2. Use `docs/specs/memory_runtime.md` and `docs/specs/model_runtime.md` for subsystem runtime boundaries.
3. Use `docs/policies/runtime_truth_policy.md` as policy authority for doc-claim discipline.
4. Treat roadmap, audit, phase, and GUI planning docs as planning/design evidence unless they explicitly cite runtime truth and stay consistent with runtime sources.
5. Record ambiguous items as `unknown_needs_review` instead of force-classifying.
6. Keep future workflow direction in Phase 30/31 explicitly labeled as planning until runtime-backed.

## Phase 28 Outcome

Runtime-truth precedence is explicit and usable for downstream phases.
Remaining risk is wording/label hygiene in mixed-authority planning and GUI documents, not missing runtime authority sources.
