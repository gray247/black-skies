# Black Skies Product System Dossier Registry

## Purpose

This registry defines the master document targets for Black Skies product-system planning.

It does not finalize product vision.
It does not implement product systems.
It identifies the dossier set that must exist before broader salvage implementation expands.

## Why The Dossier Registry Exists

The salvage rebuild needs a stable planning spine before more code lands.
Without a registry, large systems get built out of sequence, hidden dependencies become normal, and visible tools outrun the foundations that should govern them.

This registry exists to:

- keep the two-work-surface model explicit,
- keep `Narrative Insertion / Narrative Assertion` as the smallest narrative foundation,
- keep prose and scene as projection or compatibility concepts rather than base authority,
- prevent Story Units from becoming a mandatory entry gate,
- keep visual arrangement views non-owning,
- ensure system and plumbing dossiers are documented alongside visible writer-facing tools,
- stop product drift before it becomes runtime drift.

## Product / Intelligence / System Grouping

The full dossier set is grouped into three classes:

- `Product`
  - systems the writer directly touches or intentionally summons
- `Intelligence`
  - systems that analyze, evaluate, route, or interpret writing or narrative structure
- `System`
  - systems that keep the app stable, bounded, recoverable, and operational

## Full 44-Dossier List

### A. Product Dossiers

| ID | Dossier | Class | Initial status |
| --- | --- | --- | --- |
| 1 | Writing Surface | Product | planned |
| 2 | Command Center Surface | Product | planned |
| 3 | [Workflow Spine / Author Journey](workflow_spine_author_journey.md) | Product | planned |
| 43 | [Author Intent / Story Setup](author_intent_story_setup.md) | Product | planned |
| 4 | [Binder / Project Library](binder_project_library.md) | Product | planned |
| 5 | [Visual Arrangement View](scene_cards_corkboard.md) | Product | planned |
| 6 | Story Unit | Product | planned |
| 7 | Narrative Insertion / Assertion | Product | planned |
| 8 | Prose / Scene Projection | Product | planned |
| 10 | Outline | Product | planned |
| 16 | [Feedback Notes / Revision Resolution](feedback_notes_revision_resolution.md) | Product | planned |
| 17 | Lore Cards | Product | planned |
| 18 | Character Cards | Product | planned |
| 19 | [Project Index / Search / Retrieval](project_index_search_retrieval.md) | Product | planned |
| 20 | [Series Binder / Cross-Story Linking](series_binder_cross_story_linking.md) | Product | planned |
| 28 | [Theme System](theme_system.md) | Product | planned |
| 29 | [Accessibility / Hotkeys / Large-Font Mode](accessibility_hotkeys_large_font_mode.md) | Product | planned |
| 30 | [Settings / Preferences / Workspace Layout](settings_preferences_workspace_layout.md) | Product | planned |
| 31 | [Splash / Startup Experience](splash_startup_experience.md) | Product | planned |
| 32 | [Import / Export / Google Docs](import_export_document_interchange.md) | Product | planned |
| 34 | [File Manager / Asset Pane](file_manager_asset_pane.md) | Product | planned |

### B. Intelligence Dossiers

| ID | Dossier | Class | Initial status |
| --- | --- | --- | --- |
| 9 | [Draft Generation / Rewrite Loop](draft_generation_rewrite_loop.md) | Intelligence | planned |
| 11 | [Timeline / Pacing / Pressure](timeline_pacing_pressure.md) | Intelligence | planned |
| 12 | Relationship Map | Intelligence | planned |
| 13 | Emotion Graph | Intelligence | planned |
| 14 | Continuity | Intelligence | planned |
| 15 | [Critique / Evaluation](critique_evaluation.md) | Intelligence | planned |
| 21 | [Senses Usage](senses_usage.md) | Intelligence | planned |
| 22 | [Overused Words](overused_words.md) | Intelligence | planned |
| 23 | [Cliche Detection](cliche_detection.md) | Intelligence | planned |
| 24 | [Foreshadow / Payoff](foreshadow_payoff.md) | Intelligence | planned |
| 25 | Explicit-Content Marker / Send-Package Censor | Intelligence | planned |
| 26 | Companion | Intelligence | planned |
| 27 | Memory Lab | Intelligence | planned |
| 35 | Local LLM vs Paid API Routing | Intelligence | planned |
| 36 | Model Router / Provider Execution Policy | Intelligence | planned |
| 37 | Budget / Token / Cost Guardrails | Intelligence | planned |
| 41 | [Plugin / Rubric System](plugin_rubric_system.md) | Intelligence | planned |

### C. System Dossiers

| ID | Dossier | Class | Initial status |
| --- | --- | --- | --- |
| 33 | [Snapshots / Backup / Restore / History](snapshots_backup_restore_history.md) | System | planned |
| 44 | [Project Persistence / Local Save](project_persistence_local_save.md) | System | planned |
| 38 | [Async Job Queue / Task Runner](async_job_queue_task_runner.md) | System | planned |
| 39 | [Service Health / Offline / Degraded Mode](service_health_offline_degraded_mode.md) | System | planned |
| 40 | [Diagnostics / Error Visibility / Debug Console](diagnostics_error_visibility_debug_console.md) | System | planned |
| 42 | [Testing / Harness / Evidence Contract](testing_harness_evidence_contract.md) | System | planned |

## Dossier Status Fields

Allowed dossier statuses:

- `planned`
- `drafted`
- `reviewed`
- `accepted`
- `accepted with exceptions`
- `deferred`
- `rejected`

Registry rule:
- a dossier starts as `planned`
- it should not be treated as product authority until it is at least `reviewed`
- `accepted` means the planning boundary is approved, not that runtime implementation is complete

## Repository Checkpoints

- [Orchestrator 8 Arc 4 Closure Checkpoint](orchestrator_8_arc4_closure_checkpoint.md)
- [Orchestrator 9 Product Experience and Surface Convergence Closure Checkpoint](orchestrator_9_product_experience_surface_convergence_closure_checkpoint.md)
- [Orchestrator 9 Structural Manuscript Systems Closure Checkpoint](orchestrator_9_structural_manuscript_systems_closure_checkpoint.md)
- [Orchestrator 9 Truth Cards and Support Maps Closure Checkpoint](orchestrator_9_truth_cards_and_support_maps_closure_checkpoint.md)

## Canonical Inventory

- [Dossier Maturity Inventory](dossier_maturity_inventory.md)

This inventory owns the current maturity classification, coverage map,
planning status, lane placement, and next-treatment sequencing for the
planned-system set.
It does not replace dossier doctrine, ownership doctrine, or the
registry itself.

## Current Rough Dossier Blanks

The following rough dossiers now exist as first-wave `exploring` or `partial` working files.
They are not build-ready.
Some are direct dossier targets from the master list, and some are bridge or architecture dossiers that may later merge, shrink, or split back into the master list.

| File | Maps to registry target(s) | Current posture | Build-ready |
| --- | --- | --- | --- |
| `continuity.md` | `Continuity` | rough / exploring | no |
| `signal_architecture.md` | `Continuity`, `Companion`, `Command Center Surface`, `Writing Surface` | rough / exploring | no |
| `critique_evaluation.md` | `Critique / Evaluation` | rough / exploring | no |
| `author_intent_story_setup.md` | `Author Intent / Story Setup` | drafted / discovery | no |
| `authorship_provenance_ai_visibility.md` | `Writing Surface`, `Command Center Surface`, `Explicit-Content Marker / Send-Package Censor`, `Companion` | rough / exploring | no |
| `model_routing_and_budget_architecture.md` | `Local LLM vs Paid API Routing`, `Model Router / Provider Execution Policy`, `Budget / Token / Cost Guardrails` | rough / exploring | no |
| `llm_package_construction_architecture.md` | `Model Router / Provider Execution Policy`, `Explicit-Content Marker / Send-Package Censor`, `Companion`, `Memory Lab` | rough / exploring | no |
| `explicit_content_architecture.md` | `Explicit-Content Marker / Send-Package Censor` | rough / exploring | no |
| `import_export_document_interchange.md` | `Import / Export / Google Docs` | rough / exploring | no |
| `project_persistence_local_save.md` | `Project Persistence / Local Save` | drafted / discovery | no |
| `memory_lab.md` | `Memory Lab` | rough / exploring | no |
| `companion.md` | `Companion` | rough / exploring | no |
| `system_interaction_map.md` | first-wave cross-dossier interaction map | rough / exploring | no |
| `editorial_workflow.md` | editorial workflow as a cross-system journey map, not a new owner | drafted / discovery | no |
| `craft_analyzer_family_contract.md` | shared craft-family contract for `Senses Usage`, `Overused Words`, and `Cliche Detection` | drafted / discovery | no |

Question migration is now dossier-centered.
The raw question bank is archive or intake only and should not remain the main active planning spine.
The current external raw question-bank source is `C:\Dev\plan ideas\continuity\open_questions_register.md`.
That external register remains archive, intake, or triage source only and is not active repo canon.
Active questions belong inside the relevant dossier's centralized `Pre-Rough Alignment Questionnaire`.
The 2026-06-09 inventory batch created `23` placeholder dossiers so that every clearly derivable registry target has a dossier home, but placeholder creation is not dossier completion.
All `23 / 23` placeholder dossiers have now received controlled question-intake review from the external archive source.
That leaves `0` remaining unreviewed placeholder dossiers for this intake sweep.
Registry coverage also still includes `4` bridge-backed systems rather than one-to-one dossier files.
Registry target `Import / Export / Google Docs` is now represented by the human document interchange dossier `import_export_document_interchange.md`, with the old registry wording kept only as historical shorthand.
Google Docs-like autosave or instant-save behavior belongs with `Writing Surface`, `Snapshots / Backup / Restore / History`, `Service Health / Offline / Degraded Mode`, and `Workflow Spine / Author Journey`, not with external document interchange.
`Project Persistence / Local Save` now owns the authoritative local
current-save confirmation inside that broader save-state cluster.
`import_export_document_interchange.md` treats Google Docs as one external source or destination inside broader human document interchange rather than the whole scope.
AI or memory transfer format questions remain provisional contract territory for `LLM Package Construction Architecture`, `Model Routing And Budget Architecture`, `Memory Lab`, and later document-interchange sections rather than settled doctrine now.
`0` systems remain fully unrepresented only if bridge-backed systems count as representation for the current registry sweep.
Question-intake review does not equal dossier completion, and all new dossiers remain rough, investigative, and not build-ready.
The interaction map is explanatory only and does not imply runtime wiring, authority, or build readiness.

## Dependency Notes

Dependency posture:

- `Writing Surface`, `Command Center Surface`, `Workflow Spine / Author Journey`, `Author Intent / Story Setup`, `Narrative Insertion / Assertion`, and `Prose / Scene Projection` are the primary foundation dossiers.
- `Story Unit`, `Outline`, and timeline or pacing systems should not outrun the narrative-foundation dossiers.
- `Visual Arrangement View` must remain downstream of `Outline`, `Story Unit`, `Prose / Scene Projection`, or other explicit owners rather than reading like a peer structural authority.
- intelligence systems should not become hidden runtime authority over authored truth.
- system dossiers must exist early enough to constrain execution, evidence, storage, routing, and failure behavior before complex intelligence features expand.
- `Project Persistence / Local Save` now owns durable local current-save
  confirmation without replacing manuscript truth, snapshots, degraded
  health, or startup posture.
- `Command Center Surface` supports writing and organizes support systems, but it does not gate direct writing.
- rough bridge dossiers may exist temporarily when they prevent question-bank sprawl, but they should later merge, shrink, split, or disappear once the permanent dossier boundaries are clearer.

## Not Good-Idea-Fairy Clarification

The following are not automatically good-idea-fairy items:

- themes
- splash pages
- emotion graph
- relationship maps
- lore cards
- character cards
- continuity
- critique
- senses usage
- overused words
- cliche detection
- foreshadow/payoff
- explicit-content markers
- Companion
- Memory Lab

These are candidate core, support, or product systems that require individual definition.

## Actual Good-Idea-Fairy Examples

Examples of actual tangential add-ons:

- book cover generator
- soundtrack generator
- trailer maker
- merch or social promo tools

## Acceptance Criteria

This registry is acceptable only if:

- it does not finalize product vision,
- it creates document targets rather than implementation claims,
- it prevents systems from being forgotten,
- it includes system and plumbing dossiers, not just visible writer-facing tools,
- it preserves the two-work-surface model,
- it keeps `Narrative Insertion / Narrative Assertion` as foundation,
- it keeps prose and scene inside projection or compatibility roles rather than base authority.
