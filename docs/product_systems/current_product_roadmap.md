# Current Product Roadmap

## 1. Status And Authority

This roadmap is canonical for the current Black Skies product position,
discovery priorities, product horizons, deferrals, remaining
foundation-changing unknowns, and the conditions for a future
implementation-planning review.

Current status:

- product discovery remains active
- capability reconciliation is substantially developed
- roadmap reconstruction remains active
- implementation planning has not started
- runtime and GUI implementation remain blocked
- meeting the roadmap criteria below does not automatically authorize
  implementation
- Product Experience and Surface Convergence is closed with recorded
  convergence items in
  [orchestrator_9_product_experience_surface_convergence_closure_checkpoint.md](/C:/Dev/black-skies/docs/product_systems/orchestrator_9_product_experience_surface_convergence_closure_checkpoint.md).
- The next approved construction campaign is Structural Manuscript
  Systems, with initial scope:
  `Narrative Insertion / Assertion`, `Story Unit`, `Outline`, `Prose /
  Scene Projection`, and `Visual Arrangement View`.
- That construction campaign begins only after the closure checkpoint is
  committed.

Preparatory boundary artifacts for a later constrained foundation review
already exist, but their presence does not mean implementation planning
is underway.

This document is subordinate to
[current_truth_index.md](/C:/Dev/black-skies/docs/product_systems/current_truth_index.md)
for doctrine and precedence.

This document does not replace:

- dossier definitions in
  [README.md](/C:/Dev/black-skies/docs/product_systems/README.md)
- discovery procedure in
  [pre_code_discovery_plan.md](/C:/Dev/black-skies/docs/product_systems/pre_code_discovery_plan.md)
- capability ownership details in
  [capability_ownership_map.md](/C:/Dev/black-skies/docs/product_systems/capability_ownership_map.md)
- interaction and relationship notes in
  [system_interaction_map.md](/C:/Dev/black-skies/docs/product_systems/system_interaction_map.md)
- provisional constrained-foundation details in
  [v1_foundation_scope_lock.md](/C:/Dev/black-skies/docs/product_systems/v1_foundation_scope_lock.md)

## 2. Planning Authority Hierarchy

Black Skies now has multiple authoritative documents because different
questions have different owners.

- [current_truth_index.md](/C:/Dev/black-skies/docs/product_systems/current_truth_index.md)
  owns doctrine, precedence, canonical-source rules, and conflict
  resolution.
- [README.md](/C:/Dev/black-skies/docs/product_systems/README.md)
  owns the dossier registry, dossier status model, and the full named
  product-system inventory.
- [dossier_maturity_inventory.md](/C:/Dev/black-skies/docs/product_systems/dossier_maturity_inventory.md)
  owns the current maturity classification, planning status, lane
  placement, and next-treatment sequencing across planned systems.
  It does not override product doctrine inside current dossiers.
- [pre_code_discovery_plan.md](/C:/Dev/black-skies/docs/product_systems/pre_code_discovery_plan.md)
  owns discovery procedure, batch discipline, stop conditions, and the
  planning-spine process.
- [current_product_roadmap.md](/C:/Dev/black-skies/docs/product_systems/current_product_roadmap.md)
  owns the current product-discovery posture, discovery priorities,
  horizons, deferrals, and future implementation-planning review
  conditions.
- [capability_ownership_map.md](/C:/Dev/black-skies/docs/product_systems/capability_ownership_map.md)
  owns current capability placement, ownership, overlap risks, and the
  distinction between missing owners and intentionally cross-system
  workflows.
- [system_interaction_map.md](/C:/Dev/black-skies/docs/product_systems/system_interaction_map.md)
  owns rough relationship mapping among systems and surfaces without
  implying runtime wiring or inherited authority.
- [v1_foundation_scope_lock.md](/C:/Dev/black-skies/docs/product_systems/v1_foundation_scope_lock.md)
  owns the provisional narrow implementation-planning boundary for a
  later constrained foundation review.

Authority is distributed, not universal.
A document can be authoritative for its owned question without becoming
the authority for every other question.

## 3. Salvage, Recovery, And Rebuild Terminology

These terms are distinct and should stay distinct.

`Repository salvage`

- preservation of useful code, tests, documents, audit evidence, and
  forensic carry-forward knowledge from the existing repository

`Product recovery`

- the current work of recovering product intent, defining systems,
  reconciling ownership, recovering parked concepts, and reconstructing
  a canonical current roadmap

`Future rebuild`

- a later implementation decision about what gets reused, replaced,
  rewritten, newly built, or intentionally left behind

The branch name `salvage/minimal-two-surface-shell` describes branch
lineage and a historical salvage direction.
It is not the current product-development stage, and it is not a build
order.

## 4. Product Vision And Finite Foundation

The roadmap preserves both of these goals at the same time:

- continue discovering the larger Black Skies product vision
- identify a finite foundation that could later support implementation
  planning

The larger vision still includes support systems, intelligence systems,
workflow systems, and later roadmap lanes that are not inside the
provisional constrained `v1` boundary today.

The finite foundation remains important because discovery needs a
stopping condition before any later implementation-planning review can
be credible.

The roadmap therefore does not collapse into
[v1_foundation_scope_lock.md](/C:/Dev/black-skies/docs/product_systems/v1_foundation_scope_lock.md).
That scope lock is a narrow future boundary reference, not a replacement
for the broader product roadmap.

## 5. Priority Classes

This roadmap now treats remaining work by the depth actually required.
Not every rough or partial dossier needs a full deep dive before a
future implementation-planning review is even possible.

### Foundation-Critical

This class is for the small set of remaining cross-system questions that
can still materially change manuscript or durable truth boundaries,
`Narrative Assertion` identity, the two-surface architecture,
direct-writing availability, project structure, persistence or recovery,
authority boundaries, or the writer's primary workflow.

Current foundation-critical work is limited to:

- save-state and degraded-writing workflow
  Unresolved product question: what should the writer honestly
  understand about `saved`, `pending`, `recoverable`, `degraded`,
  `at risk`, and `blocked` across `Writing Surface`, `Workflow Spine`,
  `Snapshots`, `Service Health`, and startup or resume paths?
  Why it can change the foundation: this work defines direct-writing
  availability, persistence honesty, recovery posture, and startup or
  interruption behavior.
  Resolving artifact: a cross-system save-state and degraded-writing
  workflow map.
  Jason decision required: yes, for bounded startup or resume exposure
  and how explicit degraded-state messaging should be.
- `Editorial Workflow` map
  Resolved artifact: [editorial_workflow.md](/C:/Dev/black-skies/docs/product_systems/editorial_workflow.md)
  Resulting posture: findings remain advisory by default; `Feedback
  Notes / Revision Resolution` owns durable revision items; `Signal
  Architecture` owns durable attention state; `Draft Generation /
  Rewrite Loop` owns rewrite candidates; `Narrative Insertion /
  Narrative Assertion` owns accepted prose; recurrence creates linked
  temporary candidates rather than silent reopen.
  Remaining Jason decision required: some, mostly around default
  visibility, closed-history prominence, and recurrence surfacing.

Save-state and degraded-writing workflow is now the only remaining item
currently treated as foundation-critical.
The structural reconciliation lane now has an approved product model:
`Narrative Insertion / Narrative Assertion` owns manuscript truth and
authoritative order, `Story Unit` owns grouping and narrative-purpose
state, `Outline` owns planning structure plus named prototype
arrangements, `Prose / Scene Projection` owns rendering plus chapter or
scene organization where supported, and `Visual Arrangement View`
remains display-only. Remaining questions in that lane are now bounded
implementation-neutral details rather than foundation-changing owner
questions.
`Author Intent / Story Setup` is now substantively accepted as its own
dossier and is no longer the active foundation-critical mission.
Residual `Narrative Insertion / Assertion` state questions remain
important, but they are now embedded inside the structural, editorial,
and save-state lanes rather than being treated as a separate major
artifact.

### Roadmap-Sufficient

This class is for systems and workflow lanes that still need stable
purpose, ownership, dependencies, risks, and future placement, but do
not require a full product deep dive before a later
implementation-planning review may be considered.

Current roadmap-sufficient work:

- `Author Intent / Story Setup`
  Minimum still needed: keep the bounded optional question set,
  singular accepted-project-truth ownership, consumer limits, and
  non-gating posture stable.
  Can remain intentionally unfinished: exact GUI, exact storage shape,
  final questionnaire polish, and any wizard-like implementation.
- `Ideation / Premise Discovery`
  Minimum still needed: decide whether it is a real user-facing system
  or mostly a workflow posture, keep it distinct from `Author Intent`,
  `Outline`, `Companion`, and notes, and define how seeds avoid
  auto-becoming project truth.
  Can remain intentionally unfinished: durable seed artifacts, AI-first
  behavior, and exact prompts or worksheet depth.
- `Binder / Project Library`, `File Manager / Asset Pane`, and
  `Project Index / Search / Retrieval`
  Minimum still needed: keep the approved reference-based Binder model,
  file-identity and missing-source posture, unified local retrieval
  model, import-staging separation, and `Memory Lab` boundary stable so
  these systems do not become truth owners or shadow `Memory Lab`.
  Can remain intentionally unfinished: archive depth, file-preview
  breadth, attach or link depth, semantic ranking, and fuzzy retrieval
  polish.
- `Critique / Evaluation`, `Feedback Notes / Revision Resolution`,
  `Signal Architecture`, `Continuity`, `Draft Generation / Rewrite
  Loop`, and `Companion`
  Minimum still needed: stable owner boundaries, evidence and
  conversion rules, and future placement inside the editorial lane.
  Can remain intentionally unfinished: exact report shape, severity
  polish, note taxonomy, `Companion` personality polish, and provider
  tuning.
- `Character Cards`, `Lore Cards`, `Theme System`, `Relationship Map`,
  `Emotion Graph`, and `Foreshadow / Payoff`
  Minimum still needed: keep `Character Cards` and `Lore Cards` as the
  owners of accepted structured truth on a fact-by-fact basis, keep
  accepted truth separate from planned, candidate, or advisory
  material, keep `Theme System`, `Relationship Map`, `Emotion Graph`,
  and `Foreshadow / Payoff` derived and support-only, route
  project-level thematic intent to `Author Intent / Story Setup`, route
  emotional and setup/payoff planning to existing owners by scope, and
  keep continuity, memory, support-link, and consumer boundaries
  stable.
  Can remain intentionally unfinished: taxonomies, visualization depth,
  motif-linking detail, setup/payoff vocabulary, merge/split mechanics,
  time-state display, and full UI richness.
- `Timeline / Pacing / Pressure`
  Minimum still needed: keep it support-only, split it clearly into
  Timeline, Pacing, and Pressure modules, keep accepted time facts in
  existing truth owners, route pacing intent to existing owners by
  scope, keep pressure bounded to urgency, consequence, constraint, and
  conflict pressure, and keep prototype, stale-state, and finding
  behavior advisory.
  Can remain intentionally unfinished: exact chronology vocabulary,
  date or duration field shape, pacing metrics, pressure display,
  history depth, recalculation triggers, and prototype comparison
  presentation.
- `Senses Usage`, `Overused Words`, and `Cliche Detection`
  Minimum still needed: keep them separate writer-facing analyzers
  under one shared craft-family contract, keep them advisory, normalize
  exclusions, intentional-use markers, bounded history, recurrence, and
  conversion rules, and keep Critique, Notes, Signals, and surface
  boundaries stable.
  Can remain intentionally unfinished: exact thresholds, dictionaries,
  algorithms, finding visuals, filter defaults, rerun triggers, and any
  future analyzer catalog.
- `Import / Export`, provenance, routing, package construction,
  explicit-content, and related AI-governance lanes
  Minimum still needed: keep human document interchange distinct from
  local save-state and keep outbound package, routing, approval,
  provenance, and protection boundaries stable.
  Can remain intentionally unfinished: exact schemas, exact package
  shapes, provider-specific tuning, and broader workflow polish.

### Research Or Deferred

This class is for lanes that need preservation, later research,
validation, or more mature foundations rather than current detailed
product definition.

Current research or deferred work:

- advanced branching or what-if exploration
  Why deferred: it is too easy to confuse branching with snapshots,
  restore history, or accepted truth.
  Reopen when: snapshot, restore, projection, and structural authority
  boundaries are stable.
- originality or similarity studies, model benchmarking, and
  long-form or stress-test validation programs
  Why deferred: these are research or validation programs, not current
  product foundations.
  Reopen when: critique, routing, package, and evaluation boundaries
  are stable enough to support honest claims.
- full `Series Binder`, cross-story expansion, and strong product
  identity or delight work
  Why deferred: these lanes require a more settled core project,
  workflow, and surface model first.
  Reopen when: the foundation and near-core workflow posture are stable.

Planning-status correction:

- voice notes, dictation, transcription, and command-input concepts are
  explicitly excluded from the current Black Skies scope; preserve them
  only as historical or deferred evidence
- Research, citation, bibliography, source-capture, web-research, and
  Deep Research directions are not active construction lanes and should
  be treated as non-authoritative historical direction under current
  planning control
- branching remains intentionally parked and partially covered today by
  existing structural-planning and prototype-arrangement doctrine rather
  than promoted as a separate active dossier
- product identity or delight remains a later cross-cutting
  experience-quality concern rather than a standalone current
  product-system dossier

Not every imperfect or shallow dossier is foundation-critical.
The current goal is a disciplined finite model, not universal deep
closure.

## 6. Remaining Foundation-Changing Unknowns

`Author Intent / Story Setup` has now moved out of the active mission
slot and into the accepted current product posture.
No new artifact is automatically authorized by that completion.

The remaining foundation-changing unknowns are now concentrated in:

- honest save-state vocabulary across `Writing Surface`, `Workflow
  Spine`, `Snapshots`, `Service Health`, and startup or resume
- the exact finding-to-note-to-action-to-closure path across critique,
  continuity, signals, notes, rewrite, and `Companion`
- residual insertion, assertion, conversion, and provenance questions
  that must be resolved inside those cross-system lanes rather than by
  spawning a separate fourth major artifact

These unknowns are still discovery work only.
They do not authorize runtime, GUI, persistence, or implementation
planning.

## 7. Pass 6 Candidate Comparison

The remaining candidate missions are now compared by current product
need rather than by placeholder rank.

1. `Editorial Workflow` map
   Status: resolved at product-definition level by
   `editorial_workflow.md`.
   Resulting posture: cross-system workflow only; no new durable-state
   owner; temporary findings, durable notes, durable signals, rewrite
   candidates, and accepted prose now have distinct lanes.
   Remaining work class: implementation-neutral visibility, retention,
   and recurrence details only.
   Likely files affected by the reconciliation pass:
   `editorial_workflow.md`, `workflow_spine_author_journey.md`,
   `critique_evaluation.md`, `feedback_notes_revision_resolution.md`,
   `signal_architecture.md`, `continuity.md`,
   `draft_generation_rewrite_loop.md`, `companion.md`, and this
   roadmap.
   Suitable as the one final major artifact in this thread: `no`,
   because it is no longer an unresolved candidate mission.
2. Structural reconciliation lane
   Status: resolved at product-definition level by the approved model.
   Resulting posture: manuscript truth and authoritative order remain in
   `Narrative Insertion / Narrative Assertion`; `Story Unit` owns
   grouping and narrative-purpose state; `Outline` owns planning
   structure and named prototype arrangements; `Prose / Scene
   Projection` owns rendering plus chapter or scene organization where
   supported; `Visual Arrangement View` owns no structural truth or
   durable narrative state.
   Remaining work class: implementation-neutral workflow, confirmation,
   and presentation details only.
   Likely files affected by the reconciliation pass: `outline.md`,
   `story_unit.md`, `prose_scene_projection.md`,
   `scene_cards_corkboard.md`, `writing_surface.md`,
   `command_center_surface.md`, and this roadmap.
   Suitable as the one final major artifact in this thread: `no`,
   because it is no longer an unresolved candidate mission.
3. save-state and degraded-writing workflow
   Product question: what should the writer believe about save, risk,
   recovery, degraded operation, startup, and resume?
   Foundation impact: very high because it directly affects
   direct-writing availability, persistence honesty, recovery posture,
   and trust in the core writing path.
   Writer-experience value: very high for every writer, including users
   who never touch deeper structure or intelligence lanes.
   Ownership risk: medium-high, but more bounded than the structural or
   editorial cross-system maps.
   Likely files affected: `writing_surface.md`,
   `workflow_spine_author_journey.md`,
   `snapshots_backup_restore_history.md`,
   `service_health_offline_degraded_mode.md`,
   `splash_startup_experience.md`, and this roadmap.
   Suitable as the one final major artifact in this thread: `yes`, and
   it is the strongest current choice.
4. `Ideation / Premise Discovery` dossier
   Product question: what early creative-discovery support belongs in
   Black Skies, what remains manual, and how do seeds avoid
   auto-becoming truth?
   Foundation impact: lower than the other three candidates because it
   does not currently threaten the truth model, two-surface split, or
   save and recovery posture in the same way.
   Writer-experience value: real, but narrower and more discretionary.
   Ownership risk: medium because the lane is still ownerless and can
   blur into `Author Intent`, `Outline`, `Companion`, and notes.
   Likely files affected: a new ideation dossier, `Workflow Spine`,
   `capability_ownership_map.md`, and this roadmap.
   Suitable as the one final major artifact in this thread: `no`, not
   while more foundation-changing cross-system work remains open.

Current recommendation for Pass 6:

- save-state and degraded-writing workflow

This recommendation is current planning guidance only.
It is not Jason approval and it does not begin Pass 6 automatically.

## 8. Product Horizons

The roadmap uses broad horizons rather than build phases.

- `Current critical product discovery`
  Resolve or consciously defer the product questions that can still
  change the foundation model.
- `Foundation clarification`
  Tighten the owned questions, workflow boundaries, and future placement
  of the near-core systems without pretending discovery is globally
  complete.
- `Future implementation-planning review`
  Hold a later review of whether discovery is stable enough for a
  constrained planning lane.
- `Product expansion`
  Revisit later systems, support lanes, and broader workflow
  capabilities after the foundation is stable enough to hold them.
- `Research and advanced possibilities`
  Preserve future validation programs and advanced authoring
  possibilities without smuggling them into the current foundation.

These horizons are product-planning posture only.
They are not build phases, pass numbers, or implementation order.

## 9. Historical Planning Posture

Older runtime-governance plans, salvage plans, and audit artifacts
remain important evidence.
Some also remain lane-specific authority for the narrower questions they
already own.

However:

- they do not govern current product-discovery priorities by default
- they do not replace the current doctrine and dossier authority stack
- they should not be mistaken for a current implementation lane

Heavily referenced historical files should receive status clarification
before any relocation.
Mixed documents should be preserved intact after surviving truth is
extracted.
Broad archive migration is outside this pass.

This includes the major salvage and audit artifacts such as
[pass212_rebuild_vs_salvage_decision_record.md](/C:/Dev/black-skies/docs/audits/phase32/pass212_rebuild_vs_salvage_decision_record.md),
[pass220_modular_salvage_architecture_blueprint.md](/C:/Dev/black-skies/docs/audits/phase32/pass220_modular_salvage_architecture_blueprint.md),
[pass221_salvage_carry_forward_extraction_map.md](/C:/Dev/black-skies/docs/audits/phase32/pass221_salvage_carry_forward_extraction_map.md),
and the older roadmap-governance family under `docs/roadmap/`.
They remain evidence and bounded planning authority, not the current
product-priority owner.

## 10. Transition-Review Conditions

A future implementation-planning review may be justified only after the
remaining discovery path is made finite and then satisfied.

Current finite remaining discovery path:

1. complete one final major foundation artifact in this thread; the
   current recommendation is the save-state and degraded-writing
   workflow
2. either complete or consciously defer the remaining
   foundation-critical cross-system artifacts without creating new
   hidden owners
3. keep roadmap-sufficient families partial but classified rather than
   forcing universal deep closure
4. document residual unresolved questions with explicit owners and
   disposition

After that, all of the following must also be true:

- foundation-changing product questions are resolved or consciously
  deferred
- the narrative primitive and authority model are stable
- two-surface responsibilities are sufficiently defined
- core direct-writing and project workflows are mapped
- save, recovery, and degraded-writing semantics are sufficiently
  understood
- foundational ownership conflicts are resolved
- the provisional constrained-foundation boundary is reconciled with the
  larger roadmap
- unresolved questions are documented with owners and disposition

Satisfying these conditions permits review only.
Implementation remains blocked until Jason explicitly authorizes a lane
change.

## 11. Intentionally Unfinished Work

The current discovery cycle does not need to finish all of the
following:

- every craft analyzer deep dive or analyzer catalog
- full theme taxonomy, motif-link display, or visualization richness
- full character, lore, relationship, or emotion-system polish
- binder archive depth, file-preview breadth, or semantic search polish
- critique severity polish, `Companion` personality polish, or rewrite
  tuning depth
- advanced branching
- the full `Series Binder`
- originality research execution
- model benchmarking execution
- long-form validation program execution
- complete historical archive migration
- full GUI specification

It also does not need to finish every downstream intelligence or product
expansion lane before the roadmap is considered usable.
Several systems should remain intentionally partial after this cycle,
including `Critique`, `Continuity`, `Signal Architecture`,
`Companion`, `Theme System`, `Character Cards`, `Lore Cards`,
`Relationship Map`, `Emotion Graph`, and the broader AI-governance
cluster, so long as their boundaries, purpose, dependencies, and future
placement are stable enough for roadmap use.
