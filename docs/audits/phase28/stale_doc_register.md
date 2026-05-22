# Phase 28 - Stale Doc Register Resolution

Status: Finalized for Phase 28 closure
Date: 2026-05-21
Pass: Phase 28 closure pass

## Decision Legend

Allowed dispositions used in this register:

- `confirm stale`
- `downgrade to watch-only`
- `classify historical`
- `classify future-only`
- `classify as no-action-needed`
- `unresolved/blocker`

## Resolved Entries

| Document path | Preliminary suspected stale claim | Final disposition | Evidence and decision basis | Owner / next phase | Severity |
| --- | --- | --- | --- | --- | --- |
| `docs/audits/phase27/phase27_execution_plan.md` | `Status: Planning` for Phase 27 | `confirm stale` + `classify historical` | `docs/audits/phase27/phase27_execution_plan.md:3` still reads `Status: Planning`, while closure is recorded in `docs/BLACK_SKIES_FIX_TRACKER.md:3008` through `docs/BLACK_SKIES_FIX_TRACKER.md:3012`. Keep file as historical planning artifact; status wording is stale. | Phase 31 doc-label hygiene follow-up | high |
| `docs/phases/phase11b_implementation_plan.md` | `Status: Living roadmap` and canonical phrasing for active roadmap ownership | `confirm stale` + `classify historical` | Header and scope language remain present at `docs/phases/phase11b_implementation_plan.md:3` and `docs/phases/phase11b_implementation_plan.md:26`, while closure evidence is in the same file at `docs/phases/phase11b_implementation_plan.md:45`, `docs/phases/phase11b_implementation_plan.md:46`, and `docs/phases/phase11b_implementation_plan.md:420`. Stale wording is header-level, not whole-document invalidity. | Phase 31 migration/label normalization | medium |
| `docs/gui/gui_layouts.md` | `Status: Active (Canonical)` while including multiple future-only sections and placeholders | `downgrade to watch-only` | Current behavior and explicit future-only statements coexist by design: current layout text at `docs/gui/gui_layouts.md:17`, future-only language at `docs/gui/gui_layouts.md:46` and `docs/gui/gui_layouts.md:129`. Not stale by itself, but needs clearer split labeling later. | Phase 29 inventory and Phase 30 visibility policy | medium |
| `docs/specs/workflow_spine.md` | `Status: Phase 11 contract draft` with phase-era wording | `classify as no-action-needed` | Contract-draft status remains explicit at `docs/specs/workflow_spine.md:3`; document still describes current spine behavior such as active-scene generation at `docs/specs/workflow_spine.md:42` and current three-pane visibility note at `docs/specs/workflow_spine.md:50`. Treated as active draft contract, not stale. | None for Phase 28; revisit only if runtime drift appears | low |
| `docs/specs/pane_lifecycle.md` | `Status: Phase 11 contract draft` | `classify as no-action-needed` | Draft designation is explicit at `docs/specs/pane_lifecycle.md:3`, and content remains runtime-contract style (for example project-path keyed draft-preview sync at `docs/specs/pane_lifecycle.md:17` and `docs/specs/pane_lifecycle.md:47`). | None for Phase 28 | low |
| `docs/specs/layout_persistence.md` | `Status: Phase 11 contract draft` | `classify as no-action-needed` | Draft designation is explicit at `docs/specs/layout_persistence.md:3`; contract details align with current behavior expectations such as offscreen normalization at `docs/specs/layout_persistence.md:47`. | None for Phase 28 | low |
| `docs/specs/generation_scope.md` | `Status: Phase 11 contract draft` | `classify as no-action-needed` | Draft status at `docs/specs/generation_scope.md:3`; scope rules remain explicit and current-facing (`Active scene` and `All scenes only`) at `docs/specs/generation_scope.md:32` and `docs/specs/generation_scope.md:41`. | None for Phase 28 | low |
| `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` | Mixed authoring-area terminology in target spec text | `classify future-only` | File is explicitly future-planning (`Status: Draft` at `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:3` and target-spec disclaimer at `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:19`). Terminology normalization remains required before Phase 30 acceptance. | Phase 30 wording cleanup gate | medium |
| `docs/roadmap.md` | Risk that summary is read as full sequencing authority | `classify as no-action-needed` | Authority boundaries are already explicit (`docs/roadmap.md:1`, `docs/roadmap.md:8`) and correction-block coverage is explicit at `docs/roadmap.md:28`; canonical sequencing authority remains `docs/roadmap/master_phase_allocation_plan.md:2` and `docs/roadmap/master_phase_allocation_plan.md:606`. | None for Phase 28 | low |

## Phase 28 Outcome

- No stale entry remains `unresolved/blocker`.
- Two entries are confirmed stale header-language issues and are carried forward as doc-label hygiene.
- One entry is watch-only and intentionally deferred to Phase 29/30 policy work.
