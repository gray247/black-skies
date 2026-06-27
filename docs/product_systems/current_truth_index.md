# Current Truth Index

## Purpose

This index defines current accepted Black Skies doctrine, document precedence, canonical sources, reference-only sources, conflict-resolution rules, and promotion rules.

It exists to prevent `C:\Dev\plan ideas\continuity` from becoming a second canonical planning tree.
It does not implement runtime behavior.
It does not finalize the entire product vision.

## Why This Index Exists

Black Skies now has:

- repo-tracked audit evidence,
- repo-tracked product dossiers,
- salvage architecture planning,
- code and tests that prove existing behavior,
- external continuity planning that contains useful synthesis but is not repo canon.

Without an explicit truth index, the project risks split-brain planning:

- copied or mirrored docs may compete with canonical docs,
- exploratory planning may outrun accepted doctrine,
- code behavior may be mistaken for approved product direction,
- old scene-first or Story Unit-first gravity may creep back into salvage planning.

## Core Authority Rules

1. Repo-tracked canonical docs win over external planning notes.
2. Product dossiers define product doctrine more strongly than older exploratory planning when they conflict.
3. Salvage architecture docs define rebuild boundaries but do not automatically authorize implementation.
4. Phase 29 audit matrices remain evidence of old runtime truth, not future product law by themselves.
5. Code and tests prove existing behavior, but existing behavior is not automatic product authority.
6. Mirrored or copied docs are not new authorities.
7. AI or inferred output is advisory unless explicitly accepted by the user.
8. No continuity, critique, Companion, or projection layer may silently become authored truth.
9. Architecture-governance contracts in `docs/product_systems/` constrain dossier interpretation before runtime code, tooling convenience, or old planning assumptions may claim authority.
10. Reaching Category `4` across the inventory does not authorize implementation.
11. Sequencing authority belongs to
    `current_product_roadmap.md`; maturity authority belongs to
    `dossier_maturity_inventory.md`; detailed readiness-gate authority
    belongs to `pre_code_discovery_plan.md`.

## Current Product Doctrine Snapshot

Current Black Skies doctrine is:

- Writing Surface is sovereign.
- Command Center supports writing and does not gate it.
- Narrative Insertion / Narrative Assertion is the smallest narrative foundation.
- Scene is projection, container, view, or legacy compatibility only.
- Story Unit is optional.
- Outline is optional.
- Story Unit owns optional narrative-purpose and grouping state, not manuscript truth.
- Outline owns planning structure, intended order, and named prototype arrangements.
- Planning order may differ from manuscript order without becoming automatic error or truth mutation.
- Chapters and scenes may have durable organizational identity in projection or compatibility layers without owning manuscript truth.
- Visual Arrangement View is a reusable display and action-request layer, not a structural truth owner.
- Inferred output is not authored truth.
- AI is advisory unless accepted by the user.
- Author authority controls the final text decision.
- Accepted truth ownership is governed by `truth_and_state_ownership_matrix.md`.
- Durable support-state ownership is governed by `truth_and_state_ownership_matrix.md`.
- Surface visibility does not grant execution authority; action exposure is governed by `surface_to_owner_action_handoff_contract.md`.
- AI route, provider-policy, package-construction, explicit-content,
  approval-contract, and provenance boundaries are governed jointly by
  `model_routing_and_budget_architecture.md`,
  `llm_package_construction_architecture.md`,
  `explicit_content_architecture.md`,
  `ai_lifecycle_and_approval_matrix.md`, and
  `authorship_provenance_ai_visibility.md`.
- No system may silently mutate accepted truth.
- No system may silently create or mutate durable AI-origin memory, note, or signal state.
- No system may silently export, sync, spend money, retain AI-origin durable memory, or transmit protected content.
- Silent or subtle observation is preferred first.
- Manual run is the backup.
- Paid API is reserved for heavy, deep, or long-context work when quality or scale requires it.
- Signals may surface in Outline, Writing Surface, Command Center, Companion, or tool-specific panels, but signals remain advisory unless the user accepts or acts on them.
- Accepted continuity truth lives in author-owned story foundations, notes, lore, character facts, narrative assertions, or other explicit author decisions.
- There is no separate accepted-continuity kingdom or shadow canon.
- Human-author doctrine: "No story is complete until every word on every page is mine."
- AI contribution visibility doctrine is under review, but current doctrine trends toward:
  - black = author text
  - green = AI-generated text
  - purple = AI suggestion
  - red or strikeout = removed, masked, rejected, or censored text
- explicit author action may make AI-origin text author-owned text,
- visible difference after acceptance is user-controlled rather than permanently forced,
- export behavior for AI visibility and provenance is user-controlled,
- exact provenance storage, private metadata, and sync behavior remain unresolved,
- human document interchange is a separate capability from local save-state or autosave behavior,
- Document Interchange governs human-readable import and export workflows, with Google Docs as one external source or destination rather than the whole scope,
- AI or memory transfer-format doctrine remains provisional and is not settled by the document-interchange dossier,
- Memory Lab is currently understood as a likely narrative intelligence or forensic layer, not a build-ready runtime authority.
- Memory Lab may retain meaningful information when it supports continuity, memory, structure, investigation, or author decision support.
- Memory Lab must not hoard data that does not become information or serve a clear purpose.
- Companion is currently understood as a likely interface or personality layer over Memory Lab and other systems, not a build-ready runtime authority.
- Companion may eventually run safe local or support actions if settings allow, but it must not silently spend money, rewrite prose, mutate story truth, send raw content, or canonize facts without approval.
- Critique / Evaluation is currently understood as an advisory capability layer rather than a mandatory surface or truth owner.
- Budget and model routing affect whether work runs silently, manually, locally, or through paid API.
- Starting routing precedence is:
  - user approval or refusal
  - privacy or local-only restrictions
  - explicit-content restrictions
  - route mode, budget policy, and spend limits
  - project settings
  - model quality preference
  - convenience or automation
- Current writer-facing route modes are `Local Only`,
  `Privacy Preferred`, `Free Only`, `Balanced`, and
  `Best Within Budget`.
- `Ask Before Paid` remains a separate approval policy.
- LLM package construction matters as much as prompt wording:
  - first tokens carry mission and hard rules
  - middle tokens carry supporting context
  - last tokens repeat mission and output rules
- provider-specific packaging may evolve by genre, task, model strength, local-versus-paid path, and writing mode, but it must not silently change mission, meaning, author intent, evidence scope, canon facts, or task purpose
- Explicit-content package doctrine currently assumes:
  - raw story remains local
  - outbound packages may be masked, summarized, or transformed
  - continuity and causality should be preserved where possible
- Starting never-send or raw outbound categories include:
  - explicit sexual content
  - extreme violence or gore
  - minor-related sensitive content
  - private author notes marked local-only
  - deleted drafts marked archived or private
  - raw manuscript text from local-only projects
  - anything the user marks never-send
- Durable advisory history may exist when it is purposeful and relevant; data points are not automatically worth keeping.
- Throwaway prototypes are allowed only if they are isolated, disposable, and not treated as architecture proof.
- The raw 2,500-question register is archive or intake only. Active design questions must live in the relevant dossier.
- Product dossiers are living investigation files, not locked milestone claims.
- `current_product_roadmap.md` is the sequencing authority for the
  active campaign and the later post-category-4 architecture sequence.
- `pre_code_discovery_plan.md` is the detailed readiness-gate
  authority.
- `system_interaction_map.md` is rough cross-system and constellation
  evidence, not sequencing authority.
- `capability_ownership_map.md` is the owner, bridge, projection, and
  workflow-classification authority.
- Product Experience and Surface Convergence is closed with recorded
  convergence items in
  [orchestrator_9_product_experience_surface_convergence_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_product_experience_surface_convergence_closure_checkpoint.md).
- Structural Manuscript Systems is closed with recorded convergence
  items in
  [orchestrator_9_structural_manuscript_systems_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_structural_manuscript_systems_closure_checkpoint.md).
- Truth Cards and Support Maps is closed with recorded convergence
  items in
  [orchestrator_9_truth_cards_and_support_maps_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_truth_cards_and_support_maps_closure_checkpoint.md).
- Organization, Retrieval, Memory, and Interchange is closed with
  recorded convergence items in
  [orchestrator_9_organization_retrieval_memory_interchange_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_organization_retrieval_memory_interchange_closure_checkpoint.md).
- Ideation / Premise Discovery is closed with recorded convergence
  items in
  [orchestrator_9_ideation_premise_discovery_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_ideation_premise_discovery_closure_checkpoint.md).
- AI Governance, Routing, and Protected Package Reconciliation is
  closed with recorded convergence items in
  [orchestrator_9_ai_governance_routing_protected_package_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_ai_governance_routing_protected_package_closure_checkpoint.md).
- Current Ideation authority now lives in
  [ideation_premise_discovery.md](/C:/Dev/black-skies/docs/product_systems/ideation_premise_discovery.md).
- `Accessibility / Hotkeys / Large-Font Mode` is category `4` and its
  guided-shaping campaign is complete.
- The unresolved user-facing umbrella name remains a bounded wording
  question and does not reverse the maturity promotion.
- `Draft Generation / Rewrite Loop` is category `4` and its campaign is
  complete.
- `Craft Analyzer Family Reconciliation` is complete; `Senses Usage`,
  `Overused Words`, and `Cliche Detection` are category `4`.
- `Testing / Harness / Evidence Contract` is category `4` and its
  construction campaign is complete.
- `Plugin / Rubric System` is category `4` and its construction
  campaign is complete.
- `Async Job Queue / Task Runner` is category `4` and its
  construction campaign is complete.
- Category `4` coverage is complete across all `45` registry targets.
- Stage 1 is complete; Stage 2 — `System Composition and Emergent Capability Audit` is complete.
- SC-01 through SC-06 remain the controlling Stage 2 findings.
- The identified composed capabilities are product-level outcomes, not new systems, assets, connectors, or owners.
- Stage 3 — `Dossier Regression and Doctrine Propagation Audit` is complete and closed.
- The initial Stage 3 read-only regression inventory was completed.
- DR-01 through DR-06 in `docs/product_systems/dossier_regression_doctrine_propagation_findings.md` were completed at doctrine level.
- The six bounded dossier corrections were performed and reviewed.
- No Category-4 demotion is required.
- No substantive dossier reopening is required.
- No unresolved Stage 3 finding remains.
- No connector has been admitted.
- Stage 4 — `Capability Ceiling and Breadth Audit` is complete and closed.
- Stage 4 began through explicit author approval.
- The initial Stage 4 read-only breadth inventory was completed.
- CB-01 through CB-07 in `docs/product_systems/capability_ceiling_breadth_audit_findings.md` were completed at doctrine level.
- The four approved author breadth decisions were propagated.
- Both bounded breadth-propagation batches were performed and reviewed.
- The risk-based coverage sampling pass was completed.
- No missed material breadth gap was found.
- No additional propagation or sampling pass is required.
- No Category-4 demotion is required.
- No substantive dossier reopening is required.
- No unresolved Stage 4 finding remains.
- Stage 5 — `External Deep-Research Challenge Audit` is complete and closed.
- Stage 5 began through explicit author approval.
- External research Passes A through D were completed.
- Findings were recorded in `docs/product_systems/external_deep_research_challenge_findings.md`.
- All ER findings were disposed with final Stage 5 dispositions.
- Bounded doctrine propagation is complete.
- No unresolved Stage 5 finding remains.
- Stage 6 is next eligible but not begun.
- Explicit author approval is required before Stage 6 begins.
- Stage 5 does not admit connectors automatically.
- Stage 5 does not unblock implementation.
- External challenge questions, cross-system workflow proofs, GUI presentation work, and operational-readiness work remain deferred to Stages 5, 6, 9, and 10 respectively.
- `Capability Ceiling and Breadth Audit`,
  `External Deep-Research Challenge Audit`,
  `Cross-System Workflow Proofs`, `Missing Connector Review`,
  `Fatal Question Review`, `Architecture Readiness Contract`, and
  `Vertical Slice Plan` remain sequenced after it.
- Implementation, GUI implementation, architecture selection,
  salvage execution, current-versus-historical separation, and
  repository cleanup remain blocked.
- Reaching Category `4` across the inventory does not authorize
  implementation.
- Reaching Category `4` across the inventory activates the System
  Constellation and Architecture Readiness sequence defined by the
  roadmap.
- Save-State and Degraded-Writing Workflow remains a standing
  foundation dependency and reference, not the next construction
  campaign.

## Living Dossier Rule

Product dossiers in `docs/product_systems/` are living investigation documents.

That means:

- a dossier may define current doctrine and still remain open,
- a dossier may be partially accepted while unresolved sections remain,
- later evidence may tighten, narrow, or correct a dossier,
- a dossier is not an implementation mandate by default,
- a dossier should be treated as stronger authority than exploratory planning once its doctrine is accepted or actively used as repo canon,
- a dossier may end as `build`, `merge`, `shrink`, `split`, `defer`, `reject`, or `unknown`,
- active questions should live inside the relevant dossier rather than only in a giant standalone register,
- raw question banks remain archive or intake sources only,
- answered questions should be marked `resolved` or `superseded` instead of being recopied forever.

## Current Governance / Orchestrator Required Reading

Mandatory current-authority reading for a new Governance / Orchestrator
thread:

1. [current_truth_index.md](/C:/Dev/black-skies/docs/product_systems/current_truth_index.md)
2. [current_product_roadmap.md](/C:/Dev/black-skies/docs/product_systems/current_product_roadmap.md)
3. [dossier_maturity_inventory.md](/C:/Dev/black-skies/docs/product_systems/dossier_maturity_inventory.md)
4. [capability_ownership_map.md](/C:/Dev/black-skies/docs/product_systems/capability_ownership_map.md)
5. [system_interaction_map.md](/C:/Dev/black-skies/docs/product_systems/system_interaction_map.md)
6. the current active campaign dossier, when a campaign is active.

When a campaign is active, its dossier is mandatory reading.
When no campaign is active, `current_product_roadmap.md` identifies the
next eligible planning action.
Historical campaign context remains
[draft_generation_rewrite_loop.md](/C:/Dev/black-skies/docs/product_systems/draft_generation_rewrite_loop.md).
Historical pass documents, old readiness drafts, salvage-lane
architecture artifacts, and prototype memory specifications remain
evidence only unless current authority explicitly promotes them.

## Canonical Document Order

Current precedence order is:

1. accepted product dossiers in `docs/product_systems/`
2. current dossier registry and dossier template in `docs/product_systems/`
3. accepted salvage architecture docs in `docs/audits/phase32/`
4. accepted Phase 29 audit matrices in `docs/audits/phase29/`
5. code and tests as evidence of existing behavior, not automatic product authority
6. `C:\Dev\plan ideas\continuity` as reference-only planning input

If two sources disagree, the higher item in this order wins unless a newer accepted repo-tracked correction explicitly says otherwise.

## Canonical Source List

Current canonical repo-tracked sources include:

- [README.md](/C:/Dev/black-skies/docs/product_systems/README.md)
- [dossier_maturity_inventory.md](/C:/Dev/black-skies/docs/product_systems/dossier_maturity_inventory.md)
- [current_product_roadmap.md](/C:/Dev/black-skies/docs/product_systems/current_product_roadmap.md)
- [_dossier_template.md](/C:/Dev/black-skies/docs/product_systems/_dossier_template.md)
- [truth_and_state_ownership_matrix.md](/C:/Dev/black-skies/docs/product_systems/truth_and_state_ownership_matrix.md)
- [surface_to_owner_action_handoff_contract.md](/C:/Dev/black-skies/docs/product_systems/surface_to_owner_action_handoff_contract.md)
- [ai_lifecycle_and_approval_matrix.md](/C:/Dev/black-skies/docs/product_systems/ai_lifecycle_and_approval_matrix.md)
- [writing_surface.md](/C:/Dev/black-skies/docs/product_systems/writing_surface.md)
- [command_center_surface.md](/C:/Dev/black-skies/docs/product_systems/command_center_surface.md)
- [narrative_insertion_assertion.md](/C:/Dev/black-skies/docs/product_systems/narrative_insertion_assertion.md)
- [prose_scene_projection.md](/C:/Dev/black-skies/docs/product_systems/prose_scene_projection.md)
- [story_unit.md](/C:/Dev/black-skies/docs/product_systems/story_unit.md)
- [outline.md](/C:/Dev/black-skies/docs/product_systems/outline.md)
- [critique_evaluation.md](/C:/Dev/black-skies/docs/product_systems/critique_evaluation.md)
- [import_export_document_interchange.md](/C:/Dev/black-skies/docs/product_systems/import_export_document_interchange.md)
- [orchestrator_9_truth_cards_and_support_maps_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_truth_cards_and_support_maps_closure_checkpoint.md)
- [pass220_modular_salvage_architecture_blueprint.md](/C:/Dev/black-skies/docs/audits/phase32/pass220_modular_salvage_architecture_blueprint.md)
- [pass221_salvage_carry_forward_extraction_map.md](/C:/Dev/black-skies/docs/audits/phase32/pass221_salvage_carry_forward_extraction_map.md)
- [authority_boundary_matrix.md](/C:/Dev/black-skies/docs/audits/phase29/authority_boundary_matrix.md)
- [keep_merge_hide_defer_delete_matrix.md](/C:/Dev/black-skies/docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md)
- [gui_surface_inventory.md](/C:/Dev/black-skies/docs/audits/phase29/gui_surface_inventory.md)
- [tool_button_control_inventory.md](/C:/Dev/black-skies/docs/audits/phase29/tool_button_control_inventory.md)
- [intelligence_surface_matrix.md](/C:/Dev/black-skies/docs/audits/phase29/intelligence_surface_matrix.md)

These sources are canonical because they are repo-tracked, directly tied to the current salvage cleanup, and aligned to the product-system doctrine now being established.
`dossier_maturity_inventory.md` is narrow planning authority only for
dossier maturity, planning status, lane placement, and next-treatment
sequencing.
It does not override product doctrine, ownership doctrine, or
system-specific behavior defined in current dossiers and governance
matrices.

## Reference-Only External Planning Inputs

The following continuity-folder artifacts may inform future repo docs, but they are not canonical by themselves:

- `C:\Dev\plan ideas\continuity\handover.md`
- `C:\Dev\plan ideas\continuity\phase30_gui_workflow_realignment_spec.md`
- `C:\Dev\plan ideas\continuity\phase30_story_unit_governance.md`
- `C:\Dev\plan ideas\continuity\open_questions_register.md`
- `C:\Dev\plan ideas\continuity\contextual_intelligence_governance.md`
- `C:\Dev\plan ideas\continuity\writing_surface_sovereignty_rules.md`
- `C:\Dev\plan ideas\continuity\dual_monitor_workflow_principles.md`
- `C:\Dev\plan ideas\continuity\support_vs_dev_boundary_review.md`
- `C:\Dev\plan ideas\continuity\experimental_workflow_pressure_review.md`
- `C:\Dev\plan ideas\continuity\intelligence_surface_disposition_review.md`
- `C:\Dev\plan ideas\continuity\mutation_authority_review.md`

They remain valuable as synthesis, question banks, and historical planning inputs.
They do not overrule repo doctrine until their useful content is promoted into repo-tracked docs.

## Derivative Or Mirrored Documents

The following external docs are derivative or mirrored and must not be treated as canonical replacements:

- `C:\Dev\plan ideas\continuity\authority_boundary_matrix.md`
- `C:\Dev\plan ideas\continuity\keep_merge_hide_defer_delete_matrix.md`

The canonical versions remain:

- [authority_boundary_matrix.md](/C:/Dev/black-skies/docs/audits/phase29/authority_boundary_matrix.md)
- [keep_merge_hide_defer_delete_matrix.md](/C:/Dev/black-skies/docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md)

## Conflict Resolution Rule

When sources disagree:

1. Prefer the higher-precedence repo-tracked source.
2. Prefer a newer accepted dossier over an older exploratory planning note.
3. Prefer current salvage doctrine over scene-first, Story Unit-first, or Outline-first drift.
4. Treat code and tests as behavior evidence, then decide whether doctrine should adopt, narrow, or reject that behavior.
5. Treat external continuity planning as input to be translated, not as product authority to be obeyed directly.

No conflict is resolved by popularity, verbosity, or historical momentum.

## Promotion Rule

An external planning idea becomes canonical only when all of the following happen:

1. the useful idea is extracted from the external continuity folder,
2. the idea is rewritten into a repo-tracked audit or dossier,
3. the rewritten version is checked against current product doctrine,
4. conflicts are explicitly resolved,
5. the repo-tracked doc is accepted, or is explicitly treated as the new working authority.

Copying text into a folder outside the repo does not promote it.
Referencing a mirrored matrix does not promote it.

## Known Conflicts To Resolve

Current known doctrine conflicts include:

- `handover.md` describes the external continuity thread as primary governance or orchestrator authority even though repo canon must win.
- `phase30_story_unit_governance.md` over-centers Story Unit as a workflow primitive relative to current dossier doctrine that keeps it optional and non-foundational.
- `phase30_gui_workflow_realignment_spec.md` gives Outline too much organizing authority relative to current dossier doctrine that keeps Outline optional and non-authoritative.
- copied Phase 29 matrices in the external continuity folder risk being mistaken for upgraded authority rather than mirrors.
- continuity planning has useful philosophy but still lacks a repo-tracked continuity carry-forward register, surface-to-dossier crosswalk, and continuity dossier.

## Maintenance Rule

Update this index when:

- a new dossier becomes accepted authority,
- a salvage architecture doc supersedes an older planning artifact,
- external continuity planning is promoted into the repo,
- a major doctrine correction changes foundation, surface authority, or routing rules,
- a mirrored or derivative source creates renewed conflict risk.

## Acceptance Criteria

This index is acceptable only if:

- it defines clear precedence,
- it prevents the external continuity folder from acting as a second authority tree,
- it preserves current salvage doctrine,
- it treats product dossiers as living investigation files rather than locked milestones,
- it keeps the raw question bank in archive or intake posture rather than letting it become active canon,
- it does not imply build permission for Companion, Memory Lab, graph runtime surfaces, rewrite or apply automation, persistence writes, topology search, local AI runtime, paid API runtime, or Google Docs sync.
