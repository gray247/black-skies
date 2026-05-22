# Phase 28 Pass 1 - Authority Map

Status: Draft
Date: 2026-05-21
Pass: Phase 28 Pass 1 - Authority Inventory

## Scope Note

This map is an inventory artifact. It records claimed authority and recommended authority classification.
It does not resolve conflicts or stale claims. Conflict resolution is Phase 28 Pass 2 work.

## Authority Map

| Document path | Document title/purpose | Claimed authority level | Actual recommended authority classification | Authority domain | Runtime-backed or planning-only | Lifecycle state | Evidence reference | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `docs/audits/phase28_31/phase28_31_execution_plan.md` | Correction block execution operating guide | Draft execution guide for Phases 28-31 | `planning_authority` | correction-block execution governance | planning-only | current | `docs/audits/phase28_31/phase28_31_execution_plan.md:1`, `:3` | Operating guide for correction-block passes and gates. |
| `docs/roadmap.md` | High-level roadmap status spine | Active roadmap/status authority, explicitly not runtime authority | `roadmap_authority` | roadmap status summary | planning-only | current | `docs/roadmap.md:1`, `:7`, `:8` | Planning/status authority only; defers runtime truth to runtime docs. |
| `docs/roadmap/master_phase_allocation_plan.md` | Phase sequencing and gate authority | Canonical role: operational roadmap spine for future sequencing | `roadmap_authority` | phase sequencing and renumbering | planning-only | current | `docs/roadmap/master_phase_allocation_plan.md:1`, `:2`, `:606` | Canonical sequencing authority; tracker remains canonical for operational state. |
| `docs/roadmap/deferred_work_matrix.md` | Deferred/backlog allocation authority | Canonical role: deferred and backlog allocation surface | `roadmap_authority` | deferred allocation and lifecycle | planning-only | current | `docs/roadmap/deferred_work_matrix.md:1`, `:2`, `:152`, `:153` | Canonical deferred ledger, not proof doctrine or runtime authority. |
| `docs/BLACK_SKIES_FIX_TRACKER.md` | Operational issue/fix/status tracker | Active tracker for defects, debt, and instability | `planning_authority` | operational status and evidence chain | planning-only | current | `docs/BLACK_SKIES_FIX_TRACKER.md:3`, `:5`, `:8` | Canonical operational status record for active workstream state. |
| `docs/specs/current_state.md` | Current runtime baseline reference | Canonical current runtime reference | `runtime_authority` | backend/runtime current state | runtime-backed | current | `docs/specs/current_state.md:1`, `:8` | Primary runtime orientation doc; defers ultimate truth to code and runtime ledger. |
| `docs/specs/workflow_spine.md` | Workflow spine contract for app flow | Phase 11 contract draft | `workflow_contract` | workflow state/step contract | runtime-backed | current (draft) | `docs/specs/workflow_spine.md:1`, `:3` | Runtime-derived contract draft; may require Pass 2 staleness review. |
| `docs/specs/editorial_workflow_contract.md` | Editorial critique/rewrite/sync contract | Phase 12 closed contract | `workflow_contract` | editorial workflow terminology and authority boundaries | runtime-backed | current (closed contract) | `docs/specs/editorial_workflow_contract.md:1`, `:3` | Canonical editorial terminology contract layer in tracker history. |
| `docs/specs/design_system_v1.md` | Narrative workspace design system direction | Design system architecture spec | `gui_design_reference` | GUI design direction and interaction philosophy | planning-only | speculative | `docs/specs/design_system_v1.md:1`, `:34` | Directional design reference; not runtime truth. |
| `docs/specs/pane_lifecycle.md` | Pane lifecycle behavior contract | Phase 11 contract draft | `workflow_contract` | pane lifecycle and state contracts | runtime-backed | current (draft) | `docs/specs/pane_lifecycle.md:1`, `:3` | Runtime-derived contract draft with known-risk table; needs Pass 2 consistency check. |
| `docs/specs/layout_persistence.md` | Layout persistence behavior contract | Phase 11 contract draft | `workflow_contract` | layout persistence and recovery contract | runtime-backed | current (draft) | `docs/specs/layout_persistence.md:1`, `:3` | Runtime-derived contract draft; references current layout schema/version. |
| `docs/specs/generation_scope.md` | Generation scope behavior contract | Phase 11 contract draft | `workflow_contract` | generation scope and preflight contract | runtime-backed | current (draft) | `docs/specs/generation_scope.md:1`, `:3` | Runtime-derived contract draft for supported/unsupported generation scopes. |
| `docs/specs/memory_runtime.md` | Current memory runtime reference | Canonical current memory runtime reference | `runtime_authority` | memory runtime boundaries | runtime-backed | current | `docs/specs/memory_runtime.md:1`, `:8` | Canon memory runtime layer; explicitly distinguishes prototype/historical memory paths. |
| `docs/specs/model_runtime.md` | Current model/provider runtime reference | Canonical current model/runtime reference | `runtime_authority` | model/provider runtime boundaries | runtime-backed | current | `docs/specs/model_runtime.md:1`, `:8` | Canon model/runtime layer for routing, adapters, and provider flags. |
| `docs/policies/runtime_truth_policy.md` | Runtime-doc claim policy | Active policy; planning docs are not runtime authority | `planning_authority` | runtime-truth documentation governance | planning-only | current | `docs/policies/runtime_truth_policy.md:1`, `:8`, `:36` | Policy authority for runtime claim discipline and enforcement tooling. |
| `docs/gui/README.md` | GUI docs index and scope guidance | Active GUI docs index | `gui_design_reference` | GUI documentation navigation and ownership hints | planning-only | current | `docs/gui/README.md:1`, `:8` | Index/reference layer; not runtime authority by itself. |
| `docs/gui/gui_fix_plan.md` | Historical GUI rescue record | Historical / Phase 8 GUI rescue doc | `historical_reference` | historical GUI rescue and troubleshooting history | planning-only | historical | `docs/gui/gui_fix_plan.md:1`, `:7`, `:20` | Explicitly historical and superseded by current scope docs. |
| `docs/gui/gui_layouts.md` | GUI layout spec and shipped layout notes | Active (Canonical) layout spec | `gui_design_reference` | current GUI layout and roadmap-adjacent UX notes | planning-only | current with future-only sections | `docs/gui/gui_layouts.md:1`, `:26`, `:65` | Mixed current/future content under canonical label; Pass 2 conflict/staleness review needed. |
| `docs/phases/phase11b_implementation_plan.md` | Phase 11B implementation history | Status: Living roadmap; canonical living roadmap for Phase 11B | `historical_reference` | historical phase implementation sequence | planning-only | historical (closure-era artifact) | `docs/phases/phase11b_implementation_plan.md:3`, `:26`, `:379` | Valuable provenance; classification should remain historical in Phase 28 context. |
| `docs/phases/phase12_editorial_workflow_plan.md` | Phase 12 editorial workflow foundation plan | Status: Closed | `historical_reference` | historical phase planning and closure rationale | planning-only | historical | `docs/phases/phase12_editorial_workflow_plan.md:3`, `:229` | Closed phase record; useful for provenance and contract background only. |
| `docs/audits/phase27/phase27_execution_plan.md` | Phase 27 execution planning artifact | Status: Planning | `audit_artifact` | historical phase planning record | planning-only | historical (suspected stale status) | `docs/audits/phase27/phase27_execution_plan.md:1`, `:3` | Planning artifact for closed phase; status text likely stale and flagged for Pass 2 review. |
| `docs/audits/phase27/phase27_validation_checklist.md` | Phase 27 human validation evidence | Status: Closed | `audit_artifact` | closure evidence checklist | planning-only | historical | `docs/audits/phase27/phase27_validation_checklist.md:1`, `:3` | Evidence artifact for closed Phase 27 smoke/closure. |
| `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md` | Phase 28 planning/audit phase definition | Status: Draft | `planning_authority` | phase-specific audit charter and gates | planning-only | current | `docs/audits/phase28/phase28_planning_roadmap_authority_audit.md:1`, `:3`, `:8` | Current phase charter for Phase 28; governs this audit stream. |
| `docs/audits/phase29/phase29_issue_risk_error_reconciliation.md` | Phase 29 reconciliation planning | Status: Draft | `planning_authority` | next-phase inventory and triage charter | planning-only | future-only | `docs/audits/phase29/phase29_issue_risk_error_reconciliation.md:1`, `:3` | Future phase planning artifact; not current execution authority in Pass 1. |
| `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md` | Phase 30 workflow realignment planning spec | Status: Draft; explicitly target spec not runtime claim | `planning_authority` | future GUI/workflow direction | planning-only | future-only | `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md:1`, `:3`, `:19` | Future-direction spec; must not be treated as runtime state. |
| `docs/audits/phase31/phase31_roadmap_rewrite_and_phase_renumbering.md` | Phase 31 roadmap rewrite planning | Status: Draft | `planning_authority` | future roadmap rewrite and preservation logic | planning-only | future-only | `docs/audits/phase31/phase31_roadmap_rewrite_and_phase_renumbering.md:1`, `:3` | Future phase planning artifact; active only when Phase 31 execution begins. |

## Initial Classification Summary

- `runtime_authority`: `docs/specs/current_state.md`, `docs/specs/memory_runtime.md`, `docs/specs/model_runtime.md`
- `roadmap_authority`: `docs/roadmap.md`, `docs/roadmap/master_phase_allocation_plan.md`, `docs/roadmap/deferred_work_matrix.md`
- `planning_authority`: correction-block phase docs and runtime-truth policy
- `workflow_contract`: workflow/pane/layout/generation/editorial contracts
- `gui_design_reference`: design system and GUI layout/index references
- `historical_reference`: closed/historical phase and rescue artifacts
- `audit_artifact`: closed phase evidence/planning artifacts

Rows with ambiguous or mixed claims are intentionally flagged for Pass 2 review in stale/conflict registers.
