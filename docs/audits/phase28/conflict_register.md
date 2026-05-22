# Phase 28 Pass 1 - Preliminary Conflict Register

Status: Draft
Date: 2026-05-21
Pass: Phase 28 Pass 1 - Authority Inventory

## Scope Note

This is a preliminary conflict register.
Conflicts are logged for Phase 28 Pass 2 review; they are not resolved in Pass 1.

## Preliminary Conflicts

| Conflict id | Involved documents | Conflict type | Summary | Evidence | Proposed next review pass | Severity |
| --- | --- | --- | --- | --- | --- | --- |
| `C28P1-001` | `docs/audits/phase27/phase27_execution_plan.md`; `docs/BLACK_SKIES_FIX_TRACKER.md` | `historical_vs_current` | Phase 27 execution plan still says planning, while tracker records Phase 27 closed. | `docs/audits/phase27/phase27_execution_plan.md:3`; `docs/BLACK_SKIES_FIX_TRACKER.md:3008`, `:3012` | Phase 28 Pass 2 | high |
| `C28P1-002` | `docs/phases/phase11b_implementation_plan.md`; `docs/BLACK_SKIES_FIX_TRACKER.md` | `historical_vs_current` | Phase 11B plan reads as living canonical roadmap, while tracker describes Phase 11B closure state. | `docs/phases/phase11b_implementation_plan.md:3`, `:26`; `docs/BLACK_SKIES_FIX_TRACKER.md:19`, `:29` | Phase 28 Pass 2 | medium |
| `C28P1-003` | `docs/roadmap.md`; `docs/roadmap/master_phase_allocation_plan.md` | `authority_overlap` | `roadmap.md` is planning/status authority at high level, while master plan is canonical sequencing authority; overlap may cause readers to infer different phase coverage depth. | `docs/roadmap.md:1`, `:7`; `docs/roadmap/master_phase_allocation_plan.md:2`, `:606` | Phase 28 Pass 2 | medium |
| `C28P1-004` | `docs/gui/gui_layouts.md`; `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` | `gui_spec_vs_runtime` | GUI layout doc is marked canonical and mixes shipped state with future-only sections; Phase 30 is a future target spec and explicitly non-runtime. Boundary may be unclear to readers. | `docs/gui/gui_layouts.md:1`, `:65`, `:164`; `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:19` | Phase 28 Pass 2 | medium |
| `C28P1-005` | `docs/specs/workflow_spine.md`; `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` | `terminology_conflict` | Workflow contract contains phase-era three-pane wording while Phase 30 defines the future Writing Surface/Command Center direction. | `docs/specs/workflow_spine.md:31`; `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:10`, `:57` | Phase 28 Pass 2 | medium |
| `C28P1-006` | `docs/specs/design_system_v1.md`; `docs/specs/current_state.md` | `future_claim_presented_as_current` | Design system describes Split Command topology as primary model; current runtime reference is explicit runtime baseline and should remain source for shipped behavior claims. | `docs/specs/design_system_v1.md:102`; `docs/specs/current_state.md:1`, `:8` | Phase 28 Pass 2 | high |
| `C28P1-007` | `docs/gui/README.md`; `docs/roadmap/master_phase_allocation_plan.md`; `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` | `authority_overlap` | GUI docs index, master roadmap, and future GUI/workflow spec each describe GUI direction from different authority layers; explicit hierarchy may need hardening. | `docs/gui/README.md:8`; `docs/roadmap/master_phase_allocation_plan.md:2`; `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:19` | Phase 28 Pass 2 | medium |
| `C28P1-008` | `docs/specs/pane_lifecycle.md`; `docs/specs/layout_persistence.md`; `docs/specs/current_state.md` | `runtime_vs_planning` | Phase 11 contract drafts define pane/layout behavior as contracts; runtime reference doc is canonical for current state. Need Pass 2 confirmation that contract details still map cleanly to runtime reality. | `docs/specs/pane_lifecycle.md:3`; `docs/specs/layout_persistence.md:3`; `docs/specs/current_state.md:1` | Phase 28 Pass 2 | medium |

## Pass 1 Handling Rules

- Conflicts are recorded, not resolved.
- No authority source is demoted in this pass unless explicit runtime evidence already disproves it.
- Resolution priorities for Pass 2: high first, then medium, then low.
