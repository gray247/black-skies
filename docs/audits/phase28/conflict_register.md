# Phase 28 - Conflict Register Resolution

Status: Finalized for Phase 28 closure
Date: 2026-05-21
Pass: Phase 28 closure pass

## Resolution Categories Used

- `confirm conflict`
- `downgrade as non-conflict due to authority hierarchy`
- `classify as terminology conflict`
- `classify as runtime-vs-planning mismatch`
- `classify as historical/current ambiguity`
- `classify as future-only claim needing label`
- `unresolved/blocker`

## Resolved Conflict Entries

| Conflict id | Involved documents | Preliminary type | Final classification | Decision and evidence | Owner / next phase | Severity |
| --- | --- | --- | --- | --- | --- | --- |
| `C28P1-001` | `docs/audits/phase27/phase27_execution_plan.md`; `docs/BLACK_SKIES_FIX_TRACKER.md` | `historical_vs_current` | `confirm conflict` + `classify as historical/current ambiguity` | Confirmed wording conflict: `docs/audits/phase27/phase27_execution_plan.md:3` says `Status: Planning`; closure is explicit in `docs/BLACK_SKIES_FIX_TRACKER.md:3008` through `docs/BLACK_SKIES_FIX_TRACKER.md:3012`. Resolution is authority hierarchy: tracker current-state authority, Phase 27 plan historical artifact. | Phase 31 doc-label hygiene | high |
| `C28P1-002` | `docs/phases/phase11b_implementation_plan.md`; `docs/BLACK_SKIES_FIX_TRACKER.md` | `historical_vs_current` | `classify as historical/current ambiguity` | Header language is stale (`docs/phases/phase11b_implementation_plan.md:3`, `docs/phases/phase11b_implementation_plan.md:26`) but closure is also present in-file (`docs/phases/phase11b_implementation_plan.md:45`, `docs/phases/phase11b_implementation_plan.md:46`, `docs/phases/phase11b_implementation_plan.md:420`). Treated as historical artifact with stale header, not active authority contradiction. | Phase 31 migration/label pass | medium |
| `C28P1-003` | `docs/roadmap.md`; `docs/roadmap/master_phase_allocation_plan.md` | `authority_overlap` | `downgrade as non-conflict due to authority hierarchy` | Hierarchy is explicit: `docs/roadmap.md:1` and `docs/roadmap.md:8` scope roadmap.md as planning/status and non-runtime; `docs/roadmap/master_phase_allocation_plan.md:2` and `docs/roadmap/master_phase_allocation_plan.md:606` scope master plan as canonical sequencing authority. | No further action in Phase 28 | low |
| `C28P1-004` | `docs/gui/gui_layouts.md`; `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` | `gui_spec_vs_runtime` | `classify as future-only claim needing label` | `docs/gui/gui_layouts.md:17` documents current shipped layout while `docs/gui/gui_layouts.md:46` and `docs/gui/gui_layouts.md:129` include future-only sections; Phase 30 doc is explicitly future target (`docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:19`). Boundary exists but needs stronger label discipline later. | Phase 29 inventory and Phase 30 policy pass | medium |
| `C28P1-005` | `docs/specs/workflow_spine.md`; `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` | `terminology_conflict` | `classify as terminology conflict` | `docs/specs/workflow_spine.md:50` documents current three-pane-era workflow visibility; Phase 30 defines future Writing Surface + Command Center direction (`docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:35`, `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:62`). Temporal scope differs; terminology alignment still required. | Phase 30 terminology normalization | medium |
| `C28P1-006` | `docs/specs/design_system_v1.md`; `docs/specs/current_state.md` | `future_claim_presented_as_current` | `classify as runtime-vs-planning mismatch` | Design-system language states Split Command topology (`docs/specs/design_system_v1.md:125`, `docs/specs/design_system_v1.md:1818`) while runtime baseline authority is `docs/specs/current_state.md:1`. Resolution: classify design system as speculative planning reference, not runtime authority. | Phase 29 risk inventory; Phase 31 label/placement hardening | high |
| `C28P1-007` | `docs/gui/README.md`; `docs/roadmap/master_phase_allocation_plan.md`; `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` | `authority_overlap` | `downgrade as non-conflict due to authority hierarchy` | Scope separation is explicit: GUI README is an index (`docs/gui/README.md:8`), master roadmap owns sequencing (`docs/roadmap/master_phase_allocation_plan.md:2`), and Phase 30 is future target spec (`docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:19`). | No blocker; retain in Phase 29 context map | low |
| `C28P1-008` | `docs/specs/pane_lifecycle.md`; `docs/specs/layout_persistence.md`; `docs/specs/current_state.md` | `runtime_vs_planning` | `downgrade as non-conflict due to authority hierarchy` | Contract drafts are clearly labeled (`docs/specs/pane_lifecycle.md:3`, `docs/specs/layout_persistence.md:3`) and current runtime authority remains explicit in `docs/specs/current_state.md:1`. No direct contradiction found in Phase 28; retain runtime-first precedence rule. | No immediate action; monitor for drift in Phase 29 evidence review | low |

## Phase 28 Outcome

- No conflict entry remains `unresolved/blocker`.
- Confirmed conflicts are now bounded to labeling and authority-scope fixes, not runtime behavior claims.
