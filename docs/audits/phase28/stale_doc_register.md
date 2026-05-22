# Phase 28 Pass 1 - Preliminary Stale Doc Register

Status: Draft
Date: 2026-05-21
Pass: Phase 28 Pass 1 - Authority Inventory

## Scope Note

This is a preliminary, evidence-linked suspicion register.
Items here are flagged as potentially stale and require Phase 28 Pass 2 conflict/staleness review.

## Suspected Stale Items

| Document path | Suspected stale claim | Why it may be stale | Evidence source | Review needed in Phase 28 Pass 2 | Severity |
| --- | --- | --- | --- | --- | --- |
| `docs/audits/phase27/phase27_execution_plan.md` | `Status: Planning` for Phase 27 | Tracker records Phase 27 as closed after human smoke remediation and closure notes | `docs/audits/phase27/phase27_execution_plan.md:3`; `docs/BLACK_SKIES_FIX_TRACKER.md:3008`, `:3012` | Confirm whether artifact should be relabeled as historical and non-current planning | high |
| `docs/phases/phase11b_implementation_plan.md` | `Status: Living roadmap` and canonical phrasing for active roadmap ownership | Tracker history states completed passes and closure review for Phase 11B foundation | `docs/phases/phase11b_implementation_plan.md:3`, `:26`; `docs/BLACK_SKIES_FIX_TRACKER.md:19`, `:29` | Confirm whether this should be relabeled historical in Phase 28 context | medium |
| `docs/gui/gui_layouts.md` | `Status: Active (Canonical)` while including multiple future-only sections and placeholders | The same doc contains shipped layout notes plus explicitly future/pending sections | `docs/gui/gui_layouts.md:1`, `:65`, `:164` | Determine whether canonical label needs stronger runtime/future split warning | medium |
| `docs/specs/workflow_spine.md` | `Status: Phase 11 contract draft` with phase-era wording like three-pane shell and Phase 11A metadata rule | Doc may still be valid but contains phase-era assumptions that may not reflect current correction-block terminology and ownership | `docs/specs/workflow_spine.md:3`, `:31`, `:44` | Verify runtime alignment and terminology alignment with current workflows | medium |
| `docs/specs/pane_lifecycle.md` | `Status: Phase 11 contract draft` | Draft contract may still be accurate but dated; Phase 27-31 work may require stricter authority labeling | `docs/specs/pane_lifecycle.md:3` | Check whether draft state is still appropriate and whether warning labels are needed | low |
| `docs/specs/layout_persistence.md` | `Status: Phase 11 contract draft` | Draft contract may still be accurate but dated; correction block may require updated authority framing | `docs/specs/layout_persistence.md:3` | Confirm whether to keep as current draft contract or relabel | low |
| `docs/specs/generation_scope.md` | `Status: Phase 11 contract draft` | Draft contract appears runtime-derived but phase-era status may confuse current authority hierarchy | `docs/specs/generation_scope.md:3` | Confirm status framing and scope boundaries against current runtime docs | low |
| `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` | Uses mixed terminology for the authoring area in purpose text | Current correction-block guidance requires stable terminology: `Writing Surface` | `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:10` | Normalize terminology and ensure no alternate loose terms remain | medium |
| `docs/roadmap.md` | Narrow phase summary (`P7-P11`) may be read as full roadmap while master plan governs full correction block and shifted phases | Not necessarily wrong, but potential interpretive staleness/ambiguity against full master phase authority | `docs/roadmap.md:33`; `docs/roadmap/master_phase_allocation_plan.md:121`, `:125` | Clarify read order and scope boundaries so summary does not masquerade as full sequencing authority | medium |

## Register Handling Rules (Pass 1)

- `suspected` does not equal `confirmed stale`.
- No document is relabeled, archived, or removed in Pass 1.
- Confirmation, downgrade, or dismissal happens in Phase 28 Pass 2.
