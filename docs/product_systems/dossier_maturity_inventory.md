# Dossier Maturity Inventory

Status: discovery and planning-control artifact only
Purpose: define the canonical dossier maturity and coverage map before
any more hardening, reconciliation, or dossier-building passes
Scope: registry-backed product systems, bridge-backed current authority,
and outside-registry concept dispositions
Non-goals: no implementation planning, no runtime permission, no
dossier-complete claim by implication

## 1. Why This Artifact Exists

Recent convergence work hardened shared doctrine across surfaces,
workspaces, navigation, startup, restoration, attention, Notes,
Signals, review collections, recurrence, and analyzer history.

That work was useful, but it did not answer a different planning
question:

- which planned systems now have real current-authority dossiers
- which are still ownership-defined or only partially developed
- which are mature enough for dossier completion work now
- which still need construction first
- which outside-registry concepts remain excluded, rejected, parked,
  unresolved, or otherwise non-promoted

This inventory exists to answer those questions explicitly and to turn
the remaining work into a bounded queue instead of an intuition.

## 2. Maturity Scale

Use this scale for current product-definition maturity:

### 0. Missing

No current dossier exists.

### 1. Placeholder Or Rough Discovery

A file exists, but it is still mostly fragments, intake, historical
carry-forward, or unresolved questions.

### 2. Ownership-Defined

Purpose and authority boundaries are mostly settled, but workflows,
lifecycle, or major interactions remain too incomplete for productive
hardening.

### 3. Partially Developed

The dossier contains meaningful product behavior and system shape, but
important sections, decisions, failure paths, or cross-system
interactions are still incomplete.

### 4. Reconciled And Hardened

The dossier has been aligned to current ownership, lifecycle, surface,
protection, and shared-contract doctrine.
This still does not mean dossier-complete.

### 5. Dossier-Complete

The dossier is sufficiently developed across purpose, user experience,
ownership, inputs and outputs, lifecycle, interactions, failure
behavior, protection, AI posture, unresolved decisions, and deferred
boundaries.

### 6. Cross-Dossier Validated

The completed dossier has survived final convergence against adjacent
systems.

## 3. Inventory Rules

- The base set is the current `45` registry targets in
  [README.md](/C:/Dev/black-skies/docs/product_systems/README.md).
- Bridge-backed current authority counts as dossier existence for
  maturity purposes, but it is not the same as a one-to-one dossier.
- Historical shorthand does not count as current authority by itself.
- Recent shared-contract passes can move a dossier into category `4`
  without making it category `5`.
- Outside-registry concepts must not be flattened into "missing
  dossiers" without current authority that actually promotes them.
- This artifact classifies current maturity.
  It does not declare implementation readiness, and it does not
  override product doctrine inside current dossiers or governance
  contracts.

## 4. Legend

- `Exists`
  - `1:1` = one-to-one current dossier file exists
  - `bridge` = current authority exists through a bridge or
    architecture dossier rather than a one-to-one file
  - `no` = no current dossier exists
- `Authority`
  - `current` = current repo doctrine exists in the named dossier
  - `current bridge` = current repo doctrine exists, but through a
    bridge-backed artifact
  - `historical / parked` = only historical or parked references exist
- `Own.`, `Rec.`, `Hard.`, `Done`
  - `yes`, `partial`, or `no`
- `Lane`
  - `A` = existing dossier ready for dossier completion work and later
    cross-dossier validation
  - `B` = existing dossier needs more construction before more
    hardening
  - `C` = outside-registry concept requiring explicit non-promotion,
    continued parking, or later boundary review

## 5. Summary

### 5.1 Registry Coverage

- Registry targets: `45`
- One-to-one current dossier files: `41`
- Bridge-backed current dossier targets: `4`
- Fully unrepresented registry targets: `0`

### 5.2 Registry Maturity Counts

- Category `0`: `0`
- Category `1`: `0`
- Category `2`: `4`
- Category `3`: `3`
- Category `4`: `38`
- Category `5`: `0`
- Category `6`: `0`

### 5.3 Highest-Signal Conclusion

- The repository now has broad registry coverage.
- It does not yet have any registry target that should be called
  dossier-complete.
- Recent convergence work primarily moved a defined subset of dossiers
  into category `4`, not category `5`.
- Structural Manuscript Systems is closed with recorded convergence
  items in
  [orchestrator_9_structural_manuscript_systems_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_structural_manuscript_systems_closure_checkpoint.md).
- Remaining work is now split between a smaller category `3`
  construction set and broader category `4` dossier-completion and
  cross-dossier-validation work.
- Product Experience and Surface Convergence is closed with recorded
  convergence items in
  [orchestrator_9_product_experience_surface_convergence_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_product_experience_surface_convergence_closure_checkpoint.md).
- That closure does not change category `4` dossiers into category `5`
  dossiers.
- Truth Cards and Support Maps is closed with recorded convergence
  items in
  [orchestrator_9_truth_cards_and_support_maps_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_truth_cards_and_support_maps_closure_checkpoint.md).
- That closure promotes the eight campaign dossiers to category `4`;
  it does not make any of them dossier-complete.
- Organization, Retrieval, Memory, and Interchange is closed with
  recorded convergence items in
  [orchestrator_9_organization_retrieval_memory_interchange_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_organization_retrieval_memory_interchange_closure_checkpoint.md).
- That closure promotes the six campaign dossiers to category `4`; it
  does not make any of them dossier-complete.
- `Ideation / Premise Discovery` is closed with recorded convergence
  items in
  [orchestrator_9_ideation_premise_discovery_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_ideation_premise_discovery_closure_checkpoint.md).
- That closure promotes the dossier to category `4`; it does not make
  it dossier-complete.
- AI Governance, Routing, and Protected Package Reconciliation is
  closed with recorded convergence items in
  [orchestrator_9_ai_governance_routing_protected_package_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_ai_governance_routing_protected_package_closure_checkpoint.md).
- That closure promotes the four bridge-backed registry targets to
  category `4`; it does not make any of them dossier-complete.

### 5.4 Outside-Registry Disposition Totals

- active missing dossiers outside the registry: `0`
- `excluded from current scope`: `1`
- `rejected or non-authoritative historical direction`: `1`
- `covered elsewhere and intentionally parked`: `1`
- `cross-cutting experience doctrine and intentionally parked concept`:
  `1`
- `unresolved classification pending owner-boundary review`: `0`

## 6. Registry Inventory

### 6.1 Product Systems

| ID | System | Home | Exists | Authority | Mat. | Own. | Rec. | Hard. | Done | Still missing | Main blocker | Lane |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Writing Surface | `writing_surface.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final interaction and display detail | adjacent dossier completion, not owner drift | A |
| 2 | Command Center Surface | `command_center_surface.md` | `1:1` | `current` | 4 | yes | yes | yes | no | deeper workflow organization detail | adjacent dossier completion, not owner drift | A |
| 3 | Workflow Spine / Author Journey | `workflow_spine_author_journey.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final journey and summary detail | must stay narrow and non-owning | A |
| 43 | Author Intent / Story Setup | `author_intent_story_setup.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final questionnaire, presentation, and dossier-completion detail | Truth Cards closure settled project-truth ownership, lifecycle, consumer limits, protection, and non-gating posture | A |
| 45 | Ideation / Premise Discovery | `ideation_premise_discovery.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final writer-facing naming, final archive/recovery/readiness wording, and exact downstream support-surface treatment for relationship, timeline, and theme candidates | Ideation closure settled owned objects, `Idea Library`, premise testing, combination posture, surfaces, protection, recovery, and reviewed promotion boundaries while keeping adjacent intake and reimagining workflows deferred | A |
| 4 | Binder / Project Library | `binder_project_library.md` | `1:1` | `current` | 4 | yes | yes | yes | no | later dossier-completion browse, archive, and reference presentation detail | campaign closure settled non-owning organization, missing-source posture, file boundary, and handoffs | A |
| 5 | Visual Arrangement View | `scene_cards_corkboard.md` | `1:1` | `current` | 4 | yes | yes | yes | no | owner handoffs and arrangement semantics | later dossier-completion wording and layout detail | A |
| 6 | Story Unit | `story_unit.md` | `1:1` | `current` | 4 | yes | yes | yes | no | payload, lifecycle, split or merge, promotion detail | later dossier-completion wording and grouping detail | A |
| 7 | Narrative Insertion / Assertion | `narrative_insertion_assertion.md` | `1:1` | `current` | 4 | yes | yes | yes | no | exact state, conversion, and provenance behavior | later dossier-completion wording and provenance detail | A |
| 8 | Prose / Scene Projection | `prose_scene_projection.md` | `1:1` | `current` | 4 | yes | yes | yes | no | projection labeling and workflow detail | later dossier-completion wording and source-anchor detail | A |
| 10 | Outline | `outline.md` | `1:1` | `current` | 4 | yes | yes | yes | no | reorder, prototype, and review workflow detail | later dossier-completion wording and proposal detail | A |
| 16 | Feedback Notes / Revision Resolution | `feedback_notes_revision_resolution.md` | `1:1` | `current` | 4 | yes | yes | yes | no | note taxonomy and closed-history policy | mature enough for dossier completion work | A |
| 17 | Lore Cards | `lore_cards.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final field grouping, merge review, and time-state presentation | Truth Cards closure settled accepted lore ownership, candidate boundaries, provenance, protection, and secondary-reference posture | A |
| 18 | Character Cards | `character_cards.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final field grouping, merge review, and time-state presentation | Truth Cards closure settled accepted character ownership, candidate boundaries, provenance, protection, and secondary-reference posture | A |
| 19 | Project Index / Search / Retrieval | `project_index_search_retrieval.md` | `1:1` | `current` | 4 | yes | yes | yes | no | writer-facing retrieval terminology, history depth, and optional semantic retrieval detail | campaign closure settled index ownership, source-linked results, tombstones, handoffs, and Memory Lab separation | A |
| 20 | Series Binder / Cross-Story Linking | `series_binder_cross_story_linking.md` | `1:1` | `current` | 4 | yes | yes | yes | no | series-level owner surfaces, shared-fact conflict presentation, manuscript comparison, and detailed reimagining workflow | campaign closure settled Story Chains, shared identities, lineage, visibility boundaries, and Memory Lab separation | A |
| 28 | Theme System | `theme_system.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final theme taxonomy, motif vocabulary, and presentation detail | Truth Cards closure settled Story Theme support, detected-theme advisory posture, source evidence, protection, and UI-theme separation | A |
| 29 | Accessibility / Hotkeys / Large-Font Mode | `accessibility_hotkeys_large_font_mode.md` | `1:1` | `current` | 2 | yes | no | no | no | cross-surface interaction model and rule depth | needs construction before hardening is useful | B |
| 30 | Settings / Preferences / Workspace Layout | `settings_preferences_workspace_layout.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final storage-scope and restoration detail | mature enough for dossier completion work | A |
| 31 | Splash / Startup Experience | `splash_startup_experience.md` | `1:1` | `current` | 4 | yes | yes | yes | no | startup polish and bounded disclosure detail | mature enough for dossier completion work | A |
| 32 | Import / Export / Google Docs | `import_export_document_interchange.md` | `1:1` | `current` | 4 | yes | yes | yes | no | format-specific fidelity, endpoint depth, and export-provenance presentation detail | campaign closure settled governed staging, explicit owner routing, reimport posture, Google Docs manual boundary, and outbound artifact model | A |
| 34 | File Manager / Asset Pane | `file_manager_asset_pane.md` | `1:1` | `current` | 4 | yes | yes | yes | no | preview breadth, richer repair UX, and later attach-or-link depth | campaign closure settled file identity, linked-versus-managed posture, recovery distinctions, and handoffs | A |

### 6.2 Intelligence Systems

| ID | System | Home | Exists | Authority | Mat. | Own. | Rec. | Hard. | Done | Still missing | Main blocker | Lane |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Draft Generation / Rewrite Loop | `draft_generation_rewrite_loop.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final writer-facing terminology and dossier-completion polish | category-4 hardening now settled candidate lifecycle, partial acceptance, warning acknowledgement, stale-source handling, rejected-history posture, and editorial review boundary | A |
| 11 | Timeline / Pacing / Pressure | `timeline_pacing_pressure.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final chronology vocabulary, pacing metrics, pressure display, and history depth | Truth Cards closure settled the three-module support model, owner routing, chronology distinctions, advisory pacing and pressure, and bounded history posture | A |
| 12 | Relationship Map | `relationship_map.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final relationship taxonomy, display defaults, and mixed-domain owner-selection detail | Truth Cards closure settled map non-ownership, secondary references, advisory inferences, owner transfer, protection, and stale-state posture | A |
| 13 | Emotion Graph | `emotion_graph.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final emotion taxonomy, display defaults, and trajectory detail | Truth Cards closure settled accepted-source references, planned development, detected movement, intended reader effect, owner routing, and protection posture | A |
| 14 | Continuity | `continuity.md` | `1:1` | `current` | 4 | yes | yes | yes | no | evidence grading and retained-history detail | mature enough for dossier completion work | A |
| 15 | Critique / Evaluation | `critique_evaluation.md` | `1:1` | `current` | 4 | yes | yes | yes | no | finding shape, ranking, and citation density detail | mature enough for dossier completion work | A |
| 21 | Senses Usage | `senses_usage.md` | `1:1` | `current` | 3 | yes | partial | partial | no | analyzer-specific behavior beyond shared family contract | needs family posture propagated into individual dossier | B |
| 22 | Overused Words | `overused_words.md` | `1:1` | `current` | 3 | yes | partial | partial | no | analyzer-specific behavior beyond shared family contract | needs family posture propagated into individual dossier | B |
| 23 | Cliche Detection | `cliche_detection.md` | `1:1` | `current` | 3 | yes | partial | partial | no | analyzer-specific behavior beyond shared family contract | needs family posture propagated into individual dossier | B |
| 24 | Foreshadow / Payoff | `foreshadow_payoff.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final setup/payoff vocabulary, review triggers, and presentation defaults | Truth Cards closure settled planned versus detected links, owner routing, quiet unresolved-link posture, protection, recurrence, and support-only state | A |
| 25 | Explicit-Content Marker / Send-Package Censor | `explicit_content_architecture.md` | `bridge` | `current bridge` | 4 | yes | yes | yes | no | final explicit-content marker taxonomy and approval-presentation detail | AI-governance closure settled outbound eligibility, masks, approved-summary lifecycle, protected-package approval ownership, and fallback order | A |
| 26 | Companion | `companion.md` | `1:1` | `current` | 4 | yes | yes | yes | no | capability-boundary detail and later personality polish | mature enough for dossier completion work | A |
| 27 | Memory Lab | `memory_lab.md` | `1:1` | `current` | 4 | yes | yes | yes | no | retention, expiry, purge, performance, and series-inspection presentation detail | campaign closure settled memory classes, scoped sharing, routed canon-like memory, forgetting distinctions, and AI-package preview posture | A |
| 35 | Local LLM vs Paid API Routing | `model_routing_and_budget_architecture.md` | `bridge` | `current bridge` | 4 | yes | yes | yes | no | session-approval scope and later writer-facing spend presentation detail | AI-governance closure settled route modes, default posture, provider-policy separation, and routing approval-record ownership | A |
| 36 | Model Router / Provider Execution Policy | `model_routing_and_budget_architecture.md`, `llm_package_construction_architecture.md` | `bridge` | `current bridge` | 4 | yes | yes | yes | no | later dossier-completion decision on whether bridge-backed provider policy should split one-to-one | AI-governance closure settled provider-policy boundaries, package-preview ownership, linked approval-status snapshots, and non-owning request-timeline posture | A |
| 37 | Budget / Token / Cost Guardrails | `model_routing_and_budget_architecture.md` | `bridge` | `current bridge` | 4 | yes | yes | yes | no | actual-versus-estimated spend telemetry and cross-surface budget presentation detail | AI-governance closure settled cost estimate ownership, budget modes, distinct approval classes, refusal posture, and no-silent-spend doctrine | A |
| 41 | Plugin / Rubric System | `plugin_rubric_system.md` | `1:1` | `current` | 2 | yes | no | no | no | extension lifecycle and trust model | needs construction before hardening is useful | B |

### 6.3 System Dossiers

| ID | System | Home | Exists | Authority | Mat. | Own. | Rec. | Hard. | Done | Still missing | Main blocker | Lane |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 33 | Snapshots / Backup / Restore / History | `snapshots_backup_restore_history.md` | `1:1` | `current` | 4 | yes | yes | yes | no | restore detail and branch distinction | mature enough for dossier completion work | A |
| 44 | Project Persistence / Local Save | `project_persistence_local_save.md` | `1:1` | `current` | 4 | yes | yes | yes | no | final writer-facing terms and interruption thresholds | mature enough for dossier completion work | A |
| 38 | Async Job Queue / Task Runner | `async_job_queue_task_runner.md` | `1:1` | `current` | 2 | yes | no | no | no | product role beyond control skeleton | needs construction before hardening is useful | B |
| 39 | Service Health / Offline / Degraded Mode | `service_health_offline_degraded_mode.md` | `1:1` | `current` | 4 | yes | yes | yes | no | degraded-state terminology polish | mature enough for dossier completion work | A |
| 40 | Diagnostics / Error Visibility / Debug Console | `diagnostics_error_visibility_debug_console.md` | `1:1` | `current` | 4 | yes | yes | yes | no | support UX and evidence-bundle detail | mature enough for dossier completion work | A |
| 42 | Testing / Harness / Evidence Contract | `testing_harness_evidence_contract.md` | `1:1` | `current` | 2 | yes | no | no | no | validation taxonomy and system-coverage detail | needs later convergence targets before hardening helps | B |

## 7. Bridge And Governance Artifacts That Affect Maturity

These are not separate registry targets in their own right, but they
currently control maturity or coverage for other systems:

| Artifact | Current role | Current maturity use |
| --- | --- | --- |
| `signal_architecture.md` | current bridge artifact for durable attention posture | heavily hardened and already constrains `Continuity`, `Companion`, `Writing Surface`, and `Command Center` |
| `editorial_workflow.md` | current cross-system workflow map | explains how critique, continuity, notes, signals, rewrite, and recurrence fit together without creating a new owner |
| `craft_analyzer_family_contract.md` | current cross-analyzer contract | hardens shared history, recurrence, and conversion posture for `Senses Usage`, `Overused Words`, and `Cliche Detection` |
| `save_state_and_degraded_writing_workflow.md` | current cross-system save-state lane | keeps save, degraded, recovery, and startup semantics from drifting back apart |
| `truth_and_state_ownership_matrix.md` | current ownership doctrine anchor | makes category `4` possible for many dossiers by fixing owner boundaries first |
| `surface_to_owner_action_handoff_contract.md` | current action-boundary doctrine anchor | keeps surfaces, Companion, and support systems from becoming accidental owners |

## 8. Bridge-Backed Registry Target Disposition

These `4` registry targets are represented today through bridge-backed
current authority rather than one-to-one dossier files.

| Registry target | Current bridge home | Current bridge posture | Evidence | Likely next treatment |
| --- | --- | --- | --- | --- |
| `Explicit-Content Marker / Send-Package Censor` | `explicit_content_architecture.md` | reconciled durable current bridge | closure settled outbound eligibility, masks, approved summaries, protected-package approvals, and fallback doctrine without requiring a one-to-one dossier | keep bridge-backed unless later dossier completion proves a clearer product-facing one-to-one split is necessary |
| `Local LLM vs Paid API Routing` | `model_routing_and_budget_architecture.md` | reconciled current bridge inside a shared governance artifact | closure settled writer-facing route modes, defaults, refusal posture, and routing approval-record ownership | keep bridge-backed for now while later dossier completion decides whether the shared routing artifact still needs separation |
| `Model Router / Provider Execution Policy` | `model_routing_and_budget_architecture.md`, `llm_package_construction_architecture.md` | reconciled split bridge across routing and package artifacts | closure settled provider-policy boundaries and preview-link ownership, but later dossier completion may still justify one-to-one separation | revisit during dossier completion; this remains the strongest separation candidate of the four |
| `Budget / Token / Cost Guardrails` | `model_routing_and_budget_architecture.md` | reconciled current bridge inside a shared governance artifact | closure settled cost estimate, budget-mode, approval-class, and refusal posture while keeping routing and provider policy distinct | keep bridge-backed for now, but revisit during dossier completion if budget posture needs a cleaner one-to-one home |

## 9. Outside-Registry Concept Dispositions

These concepts are not counted inside the `45` registry targets above.
They are tracked here so planning status is explicit, but they are not
all active missing dossiers.

| Concept | Current evidence home | Disposition | Authority | Why not active missing dossier | Next treatment |
| --- | --- | --- | --- | --- | --- |
| Voice Notes / Dictation / Transcription | deferred legacy docs plus historical planning references | excluded from current Black Skies scope | historical or deferred evidence only | current planning status does not authorize or await a voice dossier, and current scope should not revive it | preserve historical references only; do not promote |
| Research / Deep Research Workflow | historical planning traces and older parked references | rejected or non-authoritative historical direction | non-authoritative historical direction under current planning control | current planning status must not revive research, citation, bibliography, source-capture, or Deep Research work as an active construction lane | preserve only as historical evidence; do not promote |
| Branching / What-If Exploration | `Outline` prototype-arrangement doctrine plus deferred structural planning references | covered elsewhere and intentionally parked | current doctrine partially covers bounded experimentation through prototype arrangements; broader branching remains parked | current authority does not justify a separate active dossier, and the concept is still easy to confuse with snapshots or accepted truth | keep parked outside the registry pending later structural-boundary review |
| Cross-System Product Identity / Delight | `Settings`, `Splash`, `Accessibility`, and historical GUI planning references | cross-cutting experience doctrine and intentionally parked concept | fragmented current-adjacent planning evidence | this is not a standalone product-system owner today and should not be turned into one by default | keep as a later experience-quality lens, not a dossier promotion target |

### 9.1 Outside-Registry Disposition Count Check

- total outside-registry concepts tracked here: `4`
- active missing dossiers among them: `0`
- excluded from current scope: `1`
- rejected or non-authoritative historical direction: `1`
- covered elsewhere and intentionally parked: `1`
- cross-cutting experience doctrine and intentionally parked concept:
  `1`
- unresolved classification pending owner-boundary review: `0`

These remain different from research or validation programs such as
originality or similarity study, model benchmarking, or stress-test
validation.
Those are not missing dossiers and remain outside this count.

## 10. Lane Summary

### Lane A: Existing Dossiers Ready For Dossier Completion And Later Cross-Dossier Validation

These are current-authority dossiers that are already category `4`:

- `Writing Surface`
- `Command Center Surface`
- `Workflow Spine / Author Journey`
- `Author Intent / Story Setup`
- `Ideation / Premise Discovery`
- `Binder / Project Library`
- `Narrative Insertion / Assertion`
- `Story Unit`
- `Outline`
- `Prose / Scene Projection`
- `Visual Arrangement View`
- `Feedback Notes / Revision Resolution`
- `Character Cards`
- `Lore Cards`
- `Project Index / Search / Retrieval`
- `Series Binder / Cross-Story Linking`
- `Relationship Map`
- `Emotion Graph`
- `Theme System`
- `Timeline / Pacing / Pressure`
- `Foreshadow / Payoff`
- `Draft Generation / Rewrite Loop`
- `Settings / Preferences / Workspace Layout`
- `Splash / Startup Experience`
- `Import / Export / Google Docs`
- `File Manager / Asset Pane`
- `Continuity`
- `Critique / Evaluation`
- `Companion`
- `Memory Lab`
- `Snapshots / Backup / Restore / History`
- `Project Persistence / Local Save`
- `Service Health / Offline / Degraded Mode`
- `Diagnostics / Error Visibility / Debug Console`
- `Explicit-Content Marker / Send-Package Censor`
- `Local LLM vs Paid API Routing`
- `Model Router / Provider Execution Policy`
- `Budget / Token / Cost Guardrails`

Lane A count: `38`

### Lane B: Existing Dossiers That Need Construction Before More Generic Hardening

These are the category `2` and `3` registry targets.
They already exist, but more hardening now would mostly polish partial
structure instead of finishing the actual product model.

Highest-value Lane B construction clusters:

1. partial analyzer and extension systems
   `Senses Usage`, `Overused Words`, `Cliche Detection`,
   `Plugin / Rubric System`
2. remaining product and system construction targets
   `Accessibility / Hotkeys / Large-Font Mode`,
   `Async Job Queue / Task Runner`, and
   `Testing / Harness / Evidence Contract`

Lane B count: `7`

### Lane C: Outside-Registry Concepts With Non-Promotion Or Parking Dispositions

Lane C is not a generic missing-dossier bucket.
It captures outside-registry concepts that are currently:

- excluded from current scope,
- rejected or historical only,
- covered elsewhere,
- intentionally parked,
- or still unresolved in classification.

Lane C count: `4` outside-registry concepts, with `0` active missing
dossiers.

## 11. Work-Queue Conclusions

Use this inventory to answer the next planning questions:

- "How many dossiers are complete?"
  Current answer: `0` registry targets at category `5` or `6`.
- "How many are ready for dossier completion and later
  cross-dossier validation?"
  Current answer: `38` registry targets at category `4`.
- "How many are partial and need construction first?"
  Current answer: `7` registry targets at category `2` or `3`.
- "How many active missing dossiers sit outside the current registry?"
  Current answer: `0`.
- "How many outside-registry concepts still need an explicit planning
  disposition?"
  Current answer: `4`, but those are now split among excluded,
  rejected, covered-elsewhere, intentionally parked, and unresolved
  classifications rather than treated as five active missing dossiers.

Planning rule after this inventory:

- do not schedule another generic hardening pass until the target
  dossier or lane is chosen from this map
- prefer Lane A only when the dossier is already category `4`
- prefer Lane B when the dossier still lacks enough product model for
  hardening to be meaningful
- prefer Lane C only when an outside-registry concept first clears its
  disposition and owner-boundary questions
