# Phase 29 Issue / Risk / Error Reconciliation

Status: Draft
Date: 2026-05-21

## Purpose

Phase 29 inventories unresolved bugs, deferred risks, duplicated controls, hidden dev/test surfaces, fake intelligence surfaces, placeholder UI, stale claims, broken assumptions, qualitative gaps, model-routing ambiguity, local/API quality risks, and user-facing versus dev-only confusion.

This phase is documentation-only. It does not fix runtime behavior by itself.

## Correction Block Handoff

Phase 28 identifies authority. Phase 29 inventories what survives. Phase 30 defines the future workflow. Phase 31 rewrites the roadmap from that evidence.

Candidate Phase 32, if Phase 28-31 evidence proves it is required, is `Story Unit Data Model + Qualitative Evaluation Foundation`. It should resolve Story Unit persistence and model-quality evaluation before any GUI rebuild. It is not inserted permanently by Phase 29.

## What Is Already Resolved

The following Phase 27 human-smoke blockers were remediated and should be treated as resolved, not reopened:

- false dirty/unsaved before edit
- nested project creation
- active-scene flicker / startup ping-pong
- pane collapse that blocked validation

## Current Risk Inventory

| Category | Examples | Current status | Handling |
| --- | --- | --- | --- |
| Watch-only UX issues | relocation popup overlap; floating-pane awkwardness that does not block validation | Watch-only | Keep visible in tracker, but do not expand Phase 29 into cosmetic redesign work. |
| Future GUI redesign debt | crowded panes; too many always-visible controls; raw metadata presentation; buttons and tasks mashed together; need for file/dropdown/contextual systems; transitional shell | Deferred future redesign | Preserve for later GUI phases and do not turn them into Phase 29 product scope. |
| Hidden dev/test surfaces | test toggles, debug controls, and temporary buttons that could leak into the final GUI | Deferred / removal candidate | Label as dev-only or remove when a later GUI phase owns the surface. |
| Fake intelligence surfaces | placeholder gap detection, placeholder tropes/foreshadowing/placement surfaces, fake narrative intelligence panels | Future-only until implemented | Do not present as shipped intelligence capability. |
| Placeholder UI | panels or tools that exist only as scaffolding or placeholder labels | Future-only or warning | Keep them clearly marked so operators do not mistake them for final product capability. |
| Model-routing ambiguity | local-first versus API/stronger-model selection, quality threshold visibility, escalation visibility | Unresolved planning risk | Needs explicit policy in the workflow realignment spec. |
| Local/API quality risks | unclear provenance, invisible escalation, quality claims that outpace routing visibility | Unresolved planning risk | Track in later workflow/spec phases before adding more AI surfaces. |
| User-facing vs dev-only confusion | debug affordances shown as normal UI, test-only controls exposed to operators | Warning / removal candidate | Separate dev tools from product GUI or clearly label them. |
| Stale claims | docs or comments that imply the current shell is final, or that Phase 28+ still means the pre-correction bucket family | Needs rewrite | Reword as historical, future-only, or corrected numbering. |
| Broken assumptions | any doc or note that treats placeholder intelligence or GUI scaffolding as runtime truth | Needs rewrite | Reconcile in the audit and workflow spec. |

## Pass 1 Progress Note

Phase 29 Pass 1 created the initial surface inventory artifacts:

- `docs/audits/phase29/gui_surface_inventory.md`
- `docs/audits/phase29/tool_button_control_inventory.md`
- `docs/audits/phase29/dev_surface_initial_findings.md`
- `docs/audits/phase29/phase29_pass1_surface_inventory_summary.md`

The pass assigned stable `P29-SURF`, `P29-CTRL`, and `P29-DEV` IDs for initial GUI, control, and dev/test surfaces.
All dispositions remain preliminary and pending later Phase 29 review.
Phase 30 workflow/spec decisions were not started.

## Pass 2 Progress Note

Phase 29 Pass 2 created the initial workflow mapping artifacts:

- `docs/audits/phase29/workflow_conflict_register.md`
- `docs/audits/phase29/workspace_header_density_review.md`
- `docs/audits/phase29/persistence_and_recovery_surface_review.md`
- `docs/audits/phase29/phase29_pass2_workflow_mapping_summary.md`

The pass added stable `P29-WFLOW` IDs for workflow mapping only.
Existing `P29-SURF`, `P29-CTRL`, and `P29-DEV` IDs were preserved.
Phase 30 workflow/spec decisions were not started.

## Pass 3 Progress Note

Phase 29 Pass 3 created the initial intelligence-audit artifacts:

- `docs/audits/phase29/intelligence_surface_matrix.md`
- `docs/audits/phase29/fake_intelligence_risk_register.md`
- `docs/audits/phase29/intelligence_visibility_pressure_review.md`
- `docs/audits/phase29/phase29_pass3_intelligence_audit_summary.md`

The pass added stable `P29-INTEL` IDs for intelligence-surface classification only.
Existing `P29-SURF`, `P29-CTRL`, `P29-DEV`, and `P29-WFLOW` IDs were preserved.
Phase 30 workflow/spec decisions were not started.

## Pass 4 Progress Note

Phase 29 Pass 4 created the initial boundary and authority-separation artifacts:

- `docs/audits/phase29/authority_boundary_matrix.md`
- `docs/audits/phase29/mutation_authority_review.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/experimental_workflow_pressure_review.md`
- `docs/audits/phase29/phase29_pass4_boundary_authority_summary.md`

The pass added stable `P29-BOUND` IDs for authority-boundary classification only.
Existing `P29-SURF`, `P29-CTRL`, `P29-DEV`, `P29-WFLOW`, and `P29-INTEL` IDs were preserved.
Phase 30 workflow/spec decisions were not started.

## Pass 5 Progress Note

Phase 29 Pass 5 created the initial disposition and governance-classification artifacts:

- `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md`
- `docs/audits/phase29/workspace_header_disposition_review.md`
- `docs/audits/phase29/intelligence_surface_disposition_review.md`
- `docs/audits/phase29/dev_vs_product_surface_disposition.md`
- `docs/audits/phase29/phase29_pass5_disposition_summary.md`

The pass converted accumulated Phase 29 evidence into preliminary governance dispositions without redesigning the GUI or starting Phase 30 workflow policy.
Existing `P29-SURF`, `P29-CTRL`, `P29-DEV`, `P29-WFLOW`, `P29-INTEL`, and `P29-BOUND` IDs were preserved.

## Pass 6 Progress Note

Phase 29 Pass 6 created the closure-synthesis and carry-forward governance artifacts:

- `docs/audits/phase29/phase29_closure_readiness_report.md`
- `docs/audits/phase29/phase29_carry_forward_register.md`
- `docs/audits/phase29/phase29_human_review_checkpoints.md`
- `docs/audits/phase29/phase29_phase30_dependency_map.md`
- `docs/audits/phase29/phase29_closure_conditions.md`
- `docs/audits/phase29/phase29_pass6_closure_synthesis_summary.md`

The pass consolidated Phase 29 evidence into closure-readiness, carry-forward, and Phase 30 dependency boundaries without redesigning workflows or beginning Phase 30 policy.
Existing `P29-*` IDs were preserved and Phase 29 is now classified as conditionally ready for formal closure pending human review checkpoints.

## Phase 29 Control Requirements

### Stable ID rules

- Every inventory item must carry a stable classification ID.
- IDs must follow the correction-block scheme from `docs/audits/phase28_31/phase28_31_execution_plan.md`.
- Keep the original ID even if the item is later merged, hidden, deferred, or deleted.
- Do not recycle IDs.

### Inventory field requirements

Every row in the Phase 29 inventory must include:

- classification_id
- surface_or_item
- type
- source_area
- file_or_component_path
- owner_doc_or_runtime_source
- user_facing_or_dev_only
- runtime_backed_or_placeholder
- current_visibility
- workflow_role
- overlaps_with
- recommended_disposition
- disposition_reason
- evidence
- evidence_quality
- confidence
- risk_level
- target_phase
- review_status
- notes

### Source boundaries

Phase 29 must inspect, at minimum:

- renderer components
- workspace/layout/docking components
- visible controls/buttons/toggles
- command registry or command-like structures
- IPC/preload bridges that expose visible behavior
- runtime flags/config that expose or hide GUI behavior
- docs-declared GUI surfaces
- tests/dev controls that may leak into product assumptions
- intelligence/analysis surfaces
- workflow entry points

If a new source area is needed, record why before expanding scope.

### Evidence quality and review

- Each row must include explicit evidence and an evidence-quality label.
- Weak evidence is `weak_needs_review`, not assumed truth.
- Human review sign-off must be recorded as `accepted`, `accepted_with_exceptions`, `rejected`, or `needs_rework`.

### Phase 29 closure gate

Phase 30 cannot begin until:

- every inventoried item has a stable ID
- every inventoried item has a disposition or `validate_first` reason
- every `validate_first` item has an owner or next step
- dev-only versus production-visible surfaces are classified
- placeholder/mock/future-only intelligence surfaces are labeled
- human review sign-off is recorded

## Reconciliation Rules

- If an item blocks validation or makes the operator misread truth, treat it as a blocker for the current smoke or audit pass.
- If an item is ugly but not blocking, keep it watch-only instead of inflating it into a product rewrite.
- If an item is part of the future GUI redesign, label it deferred and do not pull it into the current correction block.
- If a claim is not backed by runtime evidence, label it as design intent, placeholder, or future-only.

## Required Outputs

- complete issue/risk/error inventory sourced from the tracker, roadmap, specs, GUI docs, audits, and current known smoke findings
- keep/merge/hide/defer/delete/dev-only/needs-rewrite classification for each item
- owner and future phase recommendation for every surviving item
- explicit list of fake intelligence, placeholder UI, and dev-only surfaces
- model-routing and qualitative-risk register
- test-gap register for gaps that should block later implementation

## Acceptance Gates

- every known issue has one current classification and one owner
- resolved Phase 27 smoke blockers stay resolved and are not reopened as vague GUI debt
- dev/test controls are separated from production GUI expectations
- placeholder intelligence is not classified as shipped capability
- Phase 30 has enough input to define workflow and visibility policy without guessing
- Phase 30 cannot begin until the Phase 29 closure gate above is satisfied

## Stop Conditions

- an item cannot be classified because its authority source is unresolved from Phase 28
- a risk implies data loss, hidden mutation, or false persistence truth that requires immediate product-code intervention
- inventory work turns into feature design or visual redesign
- the same surface receives conflicting keep/delete decisions without an owner decision

## Handoff Requirements

- Phase 30 receives the surviving tool/control/workflow inventory
- candidate deletion or hiding decisions include rollback or verification notes
- model-routing ambiguity and qualitative gaps are carried forward as spec requirements
- candidate Phase 32 triggers are recorded if Story Unit persistence or model-quality evaluation cannot be responsibly resolved inside Phase 30

## Validation Requirements

- docs-only diff check
- repository hygiene check for tracked files
- targeted grep for placeholder, dev-only, fake intelligence, and stale phase-number language if inventory files are updated
- no runtime tests unless runtime files are changed, which is out of scope

## Unresolved-Question Register

| Question | Current handling |
| --- | --- |
| Which existing controls are genuinely user-facing versus debug/test convenience? | Inventory target for Phase 29 execution. |
| Which intelligence panels are placeholders versus real runtime-backed surfaces? | Inventory target; classify before any GUI rebuild. |
| What qualitative bar makes a local model "good enough" before API escalation? | Forward to Phase 30 and candidate Phase 32. |
| Which dead or duplicated controls can be deleted safely? | Requires owner decision and later implementation phase. |

## Exit Criteria

- The tracker distinguishes resolved blockers from watch-only items and future redesign debt.
- Placeholder and dev-only surfaces are clearly separated from product GUI claims.
- Model-routing and AI-quality ambiguity are explicitly called out for later workflow/spec work.
