# Stage 13 Current Authority and Salvage-Source Inventory

Status: Stage 13 creation artifact; ready for read-only review.

## 1. Purpose and scope

This inventory identifies the authority records, supporting product-system records, historical salvage-planning evidence, and repository source groups that later Stage 13 passes may inspect.

It defines how source groups should be treated. It does not perform detailed runtime, test, schema, UI, packaging, provider, model, queue, cache, telemetry, cost, archival, cleanup, deletion, implementation, or release assessment.

## 2. Repository checkpoint

Repository gate for this pass:

- Canonical repository: `C:\Dev\black-skies`
- Canonical branch: `salvage/minimal-two-surface-shell`
- Tracking branch: `origin/salvage/minimal-two-surface-shell`
- Worktree at pass start: clean
- Current HEAD: `332d1a6 docs(product): define stage 13 salvage completion plan program`
- Verified Stage 12 closure checkpoint: `62ad8b4 docs(product): close stage 12 architecture readiness contract`

The Stage 13 program is present locally and on the tracked upstream.

## 3. Stage 13 program checkpoint hash

Stage 13 program artifact:

- Path: `docs/product_systems/stage13_salvage_completion_plan_program.md`
- Commit: `332d1a6`
- Commit message: `docs(product): define stage 13 salvage completion plan program`

## 4. Inspection limits

This pass inspected current authority records, product-system indexes, governance records, closure records, audit filenames, documentation directory names, and top-level repository directory names.

This pass did not inspect runtime implementation contents, test contents, fixture contents, harness contents, schema contents, migration contents, UI implementation contents, packaging implementation contents, provider or model implementation contents, queue implementation contents, telemetry implementation contents, cache implementation contents, or cost implementation contents.

Historical filename discovery was used only to identify source groups and candidate records for later passes.

## 5. Authority-tier model

Use this hierarchy unless a later current authority record explicitly refines it:

| Tier | Class | Treatment |
| --- | --- | --- |
| Tier 1 | Current controlling authority | Controls Stage 13 interpretation and conflict resolution. |
| Tier 2 | Stage 12 bounded family authority | Controls bounded architecture floors and handoffs inside each family domain. |
| Tier 3 | Prior closed-stage authority | Carries authority for closed-stage findings and handoffs that remain current. |
| Tier 4 | Supporting current records | Supports product doctrine, ownership, workflows, policy, and current indexes without automatically becoming universal authority. |
| Tier 5 | Historical evidence | May prove existence, observed behavior, prior intent, failure, or earlier planning only. Does not control current product truth. |

Do not promote a lower tier because it is more detailed, more convenient, more recently modified, or closer to implementation.

## 6. Current controlling authority inventory

| Record | Tier | Current role | Stage 13 treatment |
| --- | --- | --- | --- |
| `docs/product_systems/current_truth_index.md` | Tier 1 | Doctrine, precedence, canonical source rules, conflict resolution, and promotion rules. | First authority for truth and historical-evidence boundaries. |
| `docs/product_systems/current_product_roadmap.md` | Tier 1 | Sequencing authority for the 19-stage path and salvage subsequence. | Controls Stage 13 placement and Stage 14/16/19 boundaries. |
| `docs/product_systems/pre_code_discovery_plan.md` | Tier 1 | Detailed readiness-gate, batch discipline, and planning-spine authority. | Controls pass discipline and no-runtime-permission posture. |
| `docs/product_systems/stage12_architecture_readiness_contract_program.md` | Tier 1 | Stage 12 contract-family program and intake authority. | Defines Stage 12 family scope and reopening expectations. |
| `docs/product_systems/stage12_cross_family_integration_audit.md` | Tier 1 | Cross-family consistency, identity, propagation, evidence, and policy audit. | Controls cross-family coherence evidence for Stage 13. |
| `docs/product_systems/stage12_architecture_readiness_contract.md` | Tier 1 | Consolidated Stage 12 architecture contract. | Primary architecture floor for identity, evidence, refusal, propagation, and proof obligations. |
| `docs/product_systems/stage12_architecture_readiness_contract_closure.md` | Tier 1 | Stage 12 closure and Stage 13 eligibility record. | Confirms Stage 13 boundary and reopening triggers. |
| `docs/product_systems/stage13_salvage_completion_plan_program.md` | Tier 1 | Stage 13 program and charter. | Controls this inventory and later Stage 13 pass boundaries. |

## 7. Stage 12 family-authority inventory

All twelve Stage 12 family contracts are Tier 2 bounded family authority.

| Family | Record | Bounded authority |
| --- | --- | --- |
| Migration and Restored-Copy Identity | `stage12_migration_copy_identity_contract.md` | Migration, restore, rollback, and restored-copy identity. |
| Project Identity Transition and Binding Propagation | `stage12_project_identity_binding_contract.md` | Project identity changes and binding propagation. |
| Deployment Versioning, Portable Boundary, and Multi-Install Ownership | `stage12_deployment_multi_install_ownership_contract.md` | Instance identity, portable boundary, side-by-side ownership, and compatibility. |
| Approval Persistence, Inheritance, and Revocation | `stage12_approval_persistence_revocation_contract.md` | Approval identity, scope, persistence, invalidation, and revocation. |
| Package, Payload, and Hidden-Context Identity | `stage12_package_payload_context_identity_contract.md` | Package identity, payload identity, visible context, hidden context, and alignment. |
| Provider-Policy Drift and External Assurance | `stage12_provider_policy_external_assurance_contract.md` | Provider policy currentness, drift, external assurance, and claim correction. |
| Telemetry and Generic-Cache Governance | `stage12_telemetry_generic_cache_governance_contract.md` | Telemetry/cache identity, data classes, deletion, purge, and witness boundaries. |
| Queue Attempt Identity, Retry, Cancellation, and Retained State | `stage12_queue_attempt_retry_cancellation_contract.md` | Job identity, attempt identity, retry, cancellation, late results, and retained state. |
| Cost Accounting and Budget Persistence | `stage12_cost_accounting_budget_persistence_contract.md` | Estimate, reservation, attempted spend, reconciliation, correction, and budget persistence. |
| Evidence Retention and Last-Witness Protection | `stage12_evidence_retention_last_witness_contract.md` | Evidence identity, witness retention, correction, archival, deletion, and last-witness protection. |
| Hardware Qualification and Resource-Pressure Protection | `stage12_hardware_resource_pressure_protection_contract.md` | Hardware qualification, workload eligibility, resource pressure, refusal, and recovery. |
| Model Qualification and Lifecycle | `stage12_model_qualification_lifecycle_contract.md` | Model identity, task qualification, regression, dequalification, retirement, and replacement. |

## 8. Prior closed-stage authority inventory

| Stage or family | Records | Tier | Stage 13 treatment |
| --- | --- | --- | --- |
| Stage 11 Fatal Question Review | `stage11_fatal_question_review_program.md`, `stage11_*_questions.md`, `stage11_cross_batch_integration_audit.md`, `stage11_consolidated_verdict_matrix.md`, `stage11_fatal_question_review_closure.md` | Tier 3 | Closed-stage authority for Stage 12 dependency routing, later proof obligations, and fatal-question disposition. |
| Stage 10 Operational Readiness | `stage10_operational_readiness_program.md`, `stage10_*_findings.md`, `stage10_operational_readiness_closure.md` | Tier 3 | Closed-stage authority for operational-readiness findings and implementation/release non-readiness. |
| Stage 9 Product Experience and GUI Architecture | `stage9_product_experience_gui_architecture_program.md`, `stage9_*_architecture.md`, `stage9_product_experience_gui_architecture_closure.md` | Tier 3 | Current architecture-planning evidence for GUI and surface boundaries; no GUI implementation authority. |
| Stages 2-8 findings and closures | `system_composition_emergent_capability_audit_findings.md`, `dossier_regression_doctrine_propagation_findings.md`, `capability_ceiling_breadth_audit_findings.md`, `external_deep_research_challenge_findings.md`, `cross_system_workflow_proof_findings.md`, `missing_connector_review_findings.md`, `front_facing_message_burden_findings.md` | Tier 3 or Tier 4 by use | Closed-stage evidence and current handoffs where explicitly preserved. |
| Orchestrator 8/9 closure checkpoints | `orchestrator_8_arc4_closure_checkpoint.md`, `orchestrator_9_*_closure_checkpoint.md` | Tier 3 or Tier 4 by scope | Closure checkpoints for convergence campaigns and category-4 promotions. |

## 9. Supporting current product-system records

Supporting current records are Tier 4 unless one of the Tier 1 records assigns a narrower or stronger role.

High-value supporting records include:

- `README.md` as the product-system dossier registry.
- `dossier_maturity_inventory.md` as maturity and coverage authority.
- `capability_ownership_map.md` as owner, bridge, projection, and overlap-risk map.
- `system_interaction_map.md` as explanatory cross-system relationship map.
- `truth_and_state_ownership_matrix.md` as truth and state ownership doctrine.
- `surface_to_owner_action_handoff_contract.md` as action-routing and surface non-ownership doctrine.
- `ai_lifecycle_and_approval_matrix.md` as AI lifecycle and approval doctrine.
- `testing_harness_evidence_contract.md` as evidence posture support.
- `save_state_and_degraded_writing_workflow.md` as a current cross-system save-state lane.
- `protected_content_permission_matrix.md`, `shared_output_vocabulary_contract.md`, `provenance_state_model.md`, `snapshot_protected_recovery_contract.md`, `degraded_mode_execution_contract.md`, and `document_interchange_source_destination_contract.md` as supporting contract or policy records.
- The 41 one-to-one product-system dossier files and 4 bridge-backed dossier homes listed in `README.md` and `dossier_maturity_inventory.md`.

These records do not authorize implementation, runtime wiring, or release.

## 10. Historical governance and salvage-planning records

Historical salvage and governance records are Tier 5 unless current authority explicitly promotes a bounded claim.

Phase 32 salvage-planning records discovered by filename include:

- `docs/audits/phase32/pass195_read_only_scene_compatibility_planning.md`
- `docs/audits/phase32/pass198_qualitative_evaluation_fixture_foundation_planning.md`
- `docs/audits/phase32/pass203_static_qualitative_evaluator_v0_planning.md`
- `docs/audits/phase32/pass206_foundation_integration_planning.md`
- `docs/audits/phase32/pass208_foundation_integration_boundary_review_and_checkpoint.md`
- `docs/audits/phase32/pass209_narrative_object_persistence_boundary_planning.md`
- `docs/audits/phase32/pass210_narrative_object_persistence_contract_planning.md`
- `docs/audits/phase32/pass211_black_skies_untangle_inventory.md`
- `docs/audits/phase32/pass212_rebuild_vs_salvage_decision_record.md`
- `docs/audits/phase32/pass213_minimal_clean_shell_boundary.md`
- `docs/audits/phase32/pass214_salvage_carry_forward_plan.md`
- `docs/audits/phase32/pass215_salvage_branch_scaffold_readiness.md`
- `docs/audits/phase32/pass217_salvage_static_project_context_planning.md`
- `docs/audits/phase32/pass219_salvage_exclusion_ledger.md`
- `docs/audits/phase32/pass220_modular_salvage_architecture_blueprint.md`
- `docs/audits/phase32/pass221_salvage_carry_forward_extraction_map.md`
- `docs/audits/phase32/pass222_product_system_dossier_plan.md`
- `docs/audits/phase32/continuity_carry_forward_register.md`
- `docs/audits/phase32/continuity_surface_to_dossier_crosswalk.md`

Other historical source families discovered by filename or directory include:

- `docs/audits/phase29/` surface, intelligence, authority, and disposition matrices.
- `docs/audits/phase30/` workflow and doctrine planning records.
- `docs/audits/phase31/` roadmap rewrite and phase-renumbering records.
- `docs/audits/phase13/` through `docs/audits/phase28/` audit and maintenance records.
- `docs/roadmap/`, `docs/phases/`, `docs/reviews/`, `docs/contracts/`, `docs/testing/`, and `docs/policies/` legacy or supporting documentation.

Historical pass numbering is not current Stage 13 sequencing. Old `salvage` wording does not grant present authority.

## 11. Candidate repository source groups for later Stage 13 inspection

| Group ID | Representative paths or directories | Apparent authority class | Likely purpose | Salvage-planning value | Allowed inspection stage or pass | Major known risk | Detailed content inspection authorized now | Later disposition decision owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SG-01 current product-system governance | `docs/product_systems/` | Tier 1-4 depending on file | Current doctrine, dossiers, contracts, findings, and closures. | Establishes product truth and planning boundaries. | Stage 13 Pass 2 and later authority reviews. | Stale status text can coexist with newer closures. | Yes for authority records and indexes; no runtime detail. | Stage 13 consolidated plan; author for policy truth. |
| SG-02 prior closed-stage governance | `docs/product_systems/stage9*`, `stage10*`, `stage11*`, earlier findings | Tier 3 | Closed-stage findings and handoffs. | Prevents losing prior blockers, handoffs, and proof obligations. | Stage 13 authority and dependency passes. | Closed-stage records may be overread as current implementation permission. | Filename/index and relevant governance content only. | Stage 13 plan, with Stage 12 reopening if floor is affected. |
| SG-03 historical Phase 32 salvage plans | `docs/audits/phase32/` | Tier 5 unless promoted | Historical salvage, carry-forward, exclusion, and blueprint evidence. | High-value historical salvage evidence and prior source maps. | Later historical salvage-source pass. | Old salvage language may be mistaken for current authority. | Filename discovery only now. | Stage 13 disposition matrix; Stage 16 for archive execution. |
| SG-04 runtime and structural implementation | `app/`, `services/`, `blackskies/`, `black_skies/`, `scripts/`, `tools/`, `config/` | Tier 5 behavior evidence | Existing runtime and structural code. | May reveal reusable or replaceable implementation material. | Later runtime and structural artifact inventory. | Historical behavior may be treated as product authority. | No. | Stage 13 disposition matrix; Stage 14 only if authorized. |
| SG-05 tests, fixtures, harnesses, and evidence | `tests/`, likely service/app test trees, `.pytest*`, `.codex-pytest*`, `ci_artifacts/`, `playwright-artifacts (1)/` | Tier 5 evidence | Test coverage, fixtures, harnesses, and retained validation evidence. | Indicates proof lanes and false-confidence risks. | Later tests, fixtures, harnesses, and evidence pass. | Passing tests can be overclaimed as broad readiness. | No. | Stage 13 evidence matrix and Stage 14 proof gates. |
| SG-06 data, schema, persistence, migration, recovery | `data/`, `sample_project/`, `history/`, `work/`, `tmp*`, `archive/`, persistence-related docs | Tier 5 or supporting docs | Project data, samples, recovery traces, and persistence artifacts. | Key to identity, migration, restored-copy, and last-witness planning. | Later data/schema/persistence/recovery pass. | Data may include stale, generated, or environment-specific state. | No. | Stage 13 disposition matrix; Stage 16 archive/cleanup execution. |
| SG-07 desktop shell, launcher, installation, packaging | `app/`, `dist-electron/`, `build/`, `vendor/`, root launcher scripts, `package.json`, packaging docs | Tier 5 behavior evidence plus supporting docs | Electron shell, launchers, install/package traces, and build metadata. | Needed for deployment, portable boundary, and release-evidence gates. | Later desktop/packaging/launcher pass. | Build artifacts and logs may look like release evidence. | No. | Stage 13 gates; Stage 14/18 only after authorization. |
| SG-08 Writing Surface and Command Center UI artifacts | `app/`, `docs/product_systems/writing_surface.md`, `command_center_surface.md`, `stage9_*` | Tier 4 docs and Tier 5 UI implementation | Surface doctrine and historical UI implementation. | Needed to preserve two-surface distinction. | Later surfaces and UI pass. | UI artifacts may encode scene-first or Command Center overreach. | Docs yes; implementation no. | Stage 13 disposition matrix; author for product surface truth. |
| SG-09 provider and transmission artifacts | AI-routing docs, `services/`, `config/`, logs with provider names | Tier 4 docs and Tier 5 implementation/evidence | Provider paths, transmission assumptions, approvals, and outbound package traces. | Needed for protected-content, approval, and provider-policy boundaries. | Later provider/transmission pass. | Hidden provider or route decisions may be treated as accepted. | No. | Stage 13 gates; author-policy owner where applicable. |
| SG-10 model routing and qualification artifacts | `model_routing_and_budget_architecture.md`, `llm_package_construction_architecture.md`, model-related runtime dirs/logs | Tier 4 docs and Tier 5 evidence | Model selection, package construction, qualification traces. | Needed for model lifecycle and no-silent-substitution gates. | Later model-routing/model-qualification pass. | Mutable model aliases and stale qualification claims. | Docs only at current-authority level; implementation no. | Stage 12 model family plus Stage 13 plan. |
| SG-11 queues, jobs, retries, cancellation | `async_job_queue_task_runner.md`, runtime/service queue code, logs | Tier 4 docs and Tier 5 evidence | Job, attempt, retry, cancellation, and retained-state evidence. | Needed for Stage 12 queue-attempt identity gates. | Later queue/jobs pass. | Completion may be mistaken for acceptance or transmission. | Docs only at current-authority level; implementation no. | Stage 12 queue family plus Stage 13 plan. |
| SG-12 telemetry, diagnostics, logs, caches | `diagnostics_error_visibility_debug_console.md`, `logs/`, `*.log`, cache dirs, telemetry/cache docs | Tier 4 docs and Tier 5 evidence | Diagnostics, retained witnesses, cache and telemetry traces. | Needed for evidence retention and last-witness planning. | Later telemetry/diagnostics/cache pass. | Cleanup pressure could destroy last witnesses. | No. | Stage 12 evidence and telemetry families; Stage 16 for cleanup. |
| SG-13 cost and budget artifacts | `model_routing_and_budget_architecture.md`, cost-related logs/configs | Tier 4 docs and Tier 5 evidence | Budget policy, estimates, attempted spend, and reconciliation traces. | Needed for no-silent-spend and cost-unknown gates. | Later cost/budget pass. | Unknown cost may be presented as zero. | Docs only at current-authority level; implementation no. | Stage 12 cost family plus author-policy owner. |
| SG-14 documentation, screenshots, reports, retained witnesses | `docs/`, root `*.log`, root screenshots, `ci_artifacts/`, reports | Tier 4 or Tier 5 by source | Governance, user-facing docs, screenshots, reports, and proof witnesses. | May contain last witnesses or stale product claims. | Later evidence and disposition passes. | Stale docs in current-looking paths. | Documentation indexes and governance records only now. | Stage 13 matrix; Stage 16 for archive/cleanup. |
| SG-15 legacy branches and separate worktrees | `git branch -vv` entries, external worktree paths shown by Git | Tier 5 branch lineage evidence | Branch lineage and separate worktree state. | May identify historical source groups and divergence. | Later branch/worktree evidence pass if authorized. | Branch name may imply current authority incorrectly. | Branch metadata only now. | Stage 13 plan; user controls branch operations. |

## 12. Authority-conflict and ambiguity register

| ID | Classification | Source or symptom | Risk | Current handling |
| --- | --- | --- | --- | --- |
| S13-A-01 | Stale Tier 1 status ambiguity | `current_truth_index.md`, `current_product_roadmap.md`, and `pre_code_discovery_plan.md` contain older sections saying Stage 6 is active, Stage 11 is next eligible or has not begun, or Stage 12 remains after Stage 11, while Stage 12 closed at `62ad8b4` and the Stage 13 program was committed at `332d1a6`. | A reader could understate current stage progress or treat stale eligibility language as overriding verified current posture. | Treat Stage 12 closure and the committed Stage 13 program as controlling for Stage 13 eligibility; do not silently correct source records in this inventory. Route wording cleanup to a later bounded status-cleanup or governance-record correction lane. |
| S13-A-02 | Mixed current/historical salvage authority | `current_truth_index.md` lists some Phase 32 records as canonical salvage architecture docs, while Stage 13 program treats historical runtime and salvage evidence as lower-tier unless promoted. | Phase 32 records may be overpromoted as current Stage 13 authority. | Treat only the specific Phase 32 claims explicitly promoted by current authority as bounded supporting authority; treat other Phase 32 salvage plans as historical evidence. |
| S13-A-03 | Bridge-backed dossier authority | Four registry targets are represented by bridge records rather than one-to-one dossiers. | Bridge records can look like missing authority or overbroad authority. | Preserve bridge-backed status from `dossier_maturity_inventory.md`; route later split/merge decisions to dossier-completion or Stage 13 disposition review. |
| S13-A-04 | Current-looking historical docs | Older `docs/roadmap/`, `docs/phases/`, `docs/reviews/`, and root docs may contain current-sounding claims. | Historical or stale planning may be mistaken for current control. | Classify as Tier 5 or supporting only unless cited by Tier 1 current authority. |
| S13-A-05 | Generated/environmental source groups | Numerous `.codex-*`, `.pytest*`, `tmp*`, log, cache, and artifact directories exist at repository root. | Generated evidence may contain last witnesses, but may also be stale or disposable. | Do not inspect contents now; route to later evidence/cache/log/last-witness pass before any archive-later disposition. |

No ambiguity discovered in this pass requires Stage 12 reopening.

## 13. Duplicate-role or overlapping-record register

| ID | Overlap | Records or groups | Risk | Later routing |
| --- | --- | --- | --- | --- |
| S13-D-01 | Routing, provider policy, package construction, budget | `model_routing_and_budget_architecture.md`, `llm_package_construction_architecture.md`, `ai_lifecycle_and_approval_matrix.md`, `explicit_content_architecture.md` | AI-governance roles may blur into one hidden owner. | Provider/model/routing/cost source passes; preserve Stage 12 approval, package, provider, model, and cost floors. |
| S13-D-02 | Save, recovery, degraded state | `project_persistence_local_save.md`, `save_state_and_degraded_writing_workflow.md`, `snapshots_backup_restore_history.md`, `service_health_offline_degraded_mode.md`, `splash_startup_experience.md`, `workflow_spine_author_journey.md` | Save-state language may drift across owners. | Data/persistence/recovery pass before runtime disposition. |
| S13-D-03 | Navigation, files, search | `binder_project_library.md`, `file_manager_asset_pane.md`, `project_index_search_retrieval.md` | Browse, file identity, and retrieval authority may collapse. | Runtime/structural and data/source passes after authority framing. |
| S13-D-04 | Structural planning views | `outline.md`, `story_unit.md`, `prose_scene_projection.md`, `scene_cards_corkboard.md` | Scene-first or Story Unit-first assumptions may re-enter salvage decisions. | Surfaces/UI and structural runtime pass; keep Narrative Assertion / Insertion as smallest truth unit. |
| S13-D-05 | Editorial lane | `critique_evaluation.md`, `continuity.md`, `feedback_notes_revision_resolution.md`, `signal_architecture.md`, `draft_generation_rewrite_loop.md`, `companion.md`, `editorial_workflow.md` | Advisory findings may become durable truth or hidden workflow ownership. | Tests/evidence and provider/model passes after product authority checks. |
| S13-D-06 | Historical salvage records | Phase 32 pass records, Phase 29 matrices, older roadmap/governance docs | Old salvage conclusions may compete with Stage 13 planning. | Historical salvage-source pass and disposition matrix. |

## 14. Missing expected source register

| ID | Expected source | Result | Current handling |
| --- | --- | --- | --- |
| S13-M-01 | Stage 13 program | Present at `docs/product_systems/stage13_salvage_completion_plan_program.md`, commit `332d1a6`. | No issue. |
| S13-M-02 | Current Stage 13 authority/source inventory | No existing canonical equivalent found before this file. | Create this inventory as the bounded target. |
| S13-M-03 | One-to-one dossier files for all 45 registry targets | `dossier_maturity_inventory.md` records 41 one-to-one files and 4 bridge-backed targets. | Not missing for current coverage; later split decisions remain possible. |
| S13-M-04 | Stage 12 family contracts | All twelve listed in Stage 12 closure and present by filename. | No issue. |

No missing expected source found in this pass blocks Stage 13 planning.

## 15. Stale-status or stale-reference register

| ID | Reference | Stale or potentially stale claim | Treatment |
| --- | --- | --- | --- |
| S13-S-01 | `current_truth_index.md` | Preserves stale Tier 1 stage-status language saying Stage 11 is next eligible or has not begun and Stage 12 remains after Stage 11. | Does not override the verified current posture: Stage 12 closed at `62ad8b4`, and the Stage 13 program was committed at `332d1a6`. Later bounded status-cleanup or governance-record correction lane must resolve the source wording; this pass does not edit the source record. |
| S13-S-02 | `current_product_roadmap.md` | Some sections preserve older stage-status text, including Stage 6 active and Stage 11 not begun language. | Later status-cleanup candidate only; Stage 13 uses Stage 12 closure plus Stage 13 program as current controlling records. |
| S13-S-03 | `pre_code_discovery_plan.md` | Contains older next-action and stage-status text from prior governance phases. | Later status-cleanup candidate only; not a blocker because it also preserves the 19-stage sequence and implementation block. |
| S13-S-04 | `docs/roadmap/`, `docs/phases/`, root docs | Current-sounding filenames may contain old plans. | Treat as Tier 5 or supporting only until a later pass classifies content. |
| S13-S-05 | Root logs, generated artifacts, and temporary directories | Names imply validation, security, package, or runtime evidence without currentness proof. | Treat as evidence candidates only; no cleanup or archive execution during Stage 13. |

## 16. Later-pass routing

Recommended next bounded pass: historical salvage-source inventory focused on Phase 32 and other explicitly named historical governance/salvage-planning records.

Reasoning:

- Authority risk: Phase 32 records include old salvage language that could be overread as current Stage 13 authority.
- Dependency order: historical salvage evidence should be classified before detailed runtime artifacts are inspected.
- Architectural drift risk: old salvage plans may contain scene-first, branch-lineage, or implementation-assumption gravity.
- Evidence fragility: Phase 32 records may identify retained witnesses, exclusion ledgers, and carry-forward maps needed before later disposition.
- Runtime boundary need: clarifying historical salvage claims first will reduce the risk of runtime files being assessed against stale assumptions.
- Context and reviewability: a documentation-only historical pass is bounded and reviewable before runtime source groups are opened.

Do not begin that pass from this inventory.

## 17. Evidence limitations

This inventory proves only that the listed records, directories, filenames, and source groups were discovered during this pass.

It does not prove:

- runtime correctness
- test validity
- fixture validity
- packaged behavior
- release readiness
- data integrity
- provider-policy currentness
- model qualification
- queue correctness
- cache or telemetry compliance
- cost accuracy
- archive eligibility
- implementation readiness

Tests and reports prove only their observed lane. Existing runtime behavior is evidence, not product authority. Unknown authority remains visibly unknown.

## 18. Stop and reopening conditions

Stop later Stage 13 work if:

- repository gates differ from authorization
- current authority is missing, ambiguous, or contradictory
- a lower-tier source appears to contradict Tier 1 authority
- a Stage 12 architecture floor appears infeasible, contradictory, incomplete, or missing propagation
- a Stage 12 reopening trigger is found
- a pass would require salvage execution, implementation, cleanup, deletion, archival execution, release work, or implementation technology selection
- author-policy choices would need to be resolved by assumption

Stage 12 reopening must be invoked if later work discovers contradiction among contracts, ownership collision, identity-chain break, invalidation or propagation gap, evidence overclaim, silent authority transfer, family-contract regression, unresolved architecture dependency, author-policy change to a mandatory floor, implementation infeasibility, or release evidence contradicting the contract.

## 19. Explicit next-pass boundary

The next pass, if authorized, should inspect historical salvage-planning records as documentation evidence only.

It must not:

- inspect runtime implementation contents
- inspect detailed test, fixture, harness, schema, migration, UI, packaging, provider, model, queue, telemetry, cache, or cost implementation contents
- execute salvage actions
- archive, delete, clean, move, rename, or retire files operationally
- treat historical Phase 32 pass numbering as Stage 13 sequencing
- authorize Stage 14 execution

Stage 13 planning does not authorize Stage 14 execution. Stage 16 owns archival and cleanup execution.
