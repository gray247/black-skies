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

### Foundation-Critical

This class is for unresolved work that could still change the truth
model, narrative primitive, two-surface architecture, persistence or
recovery posture, project structure, authority boundaries, or the
primary writer workflow.

Current foundation-critical work:

- `Author Intent / Story Setup`
- save-state, recovery, and degraded-writing semantics across `Writing
  Surface`, `Workflow Spine`, `Snapshots`, and `Service Health`
- structural reconciliation among `Outline`, `Story Unit`, `Prose /
  Scene Projection`, and `Scene Cards / Corkboard` where those decisions
  still affect foundation boundaries or writer workflow

### Roadmap-Sufficient

This class is for systems and workflow lanes that need enough definition
to establish purpose, ownership, dependencies, risks, and future
placement now, but do not require a full deep dive in the current
discovery cycle.

Current roadmap-sufficient work:

- editorial workflow recovery as an end-to-end cross-system map
- `Ideation / Premise Discovery`
- research or deep-research workflow classification
- near-core support and analysis systems whose boundaries are mostly
  known but whose workflow placement still needs clarification
- later product-expansion systems that need stable ownership and future
  placement more than immediate deep specification

### Research Or Deferred

This class is for programs, future possibilities, and advanced lanes
that should be preserved and classified now without pretending they need
full present-cycle dossiers.

Current research or deferred work:

- voice notes, dictation, transcription, and command-input possibilities
- originality or similarity studies
- model benchmarking and local-versus-API evaluation programs
- narrative validation and stress-test programs
- advanced branching or what-if exploration
- strong presentation-identity and delight work beyond current discovery

Not every imperfect or shallow dossier is foundation-critical.
The current goal is a disciplined roadmap, not universal deep closure.

## 6. Current Controlled Mission

The approved next dossier mission is `Author Intent / Story Setup`.

Current mission constraints:

- it is optional
- it is skippable
- it is editable
- it cannot gate direct writing
- it owns author-stated creative goals, preferences, boundaries,
  unknowns, and non-assumptions
- it does not own system permissions
- it does not own protected-content policy
- it does not own transfer policy
- it does not own routing
- it does not own spend
- it does not own export controls
- it does not own manuscript truth
- it does not own canon

Before any final questionnaire is proposed, the original eleven `Wizard`
questions must be recovered and classified so the new artifact does not
quietly inherit stale assumptions or lose useful seed material.

This mission is discovery only.
It does not authorize a startup wizard, a gating intake flow, or a new
implementation surface.

## 7. Candidate Later Missions

These are ranked candidates for later discovery work after the current
controlled mission.
The ranking is current guidance, not binding authorization.
It does not preselect the second major artifact as fixed.

1. `Editorial Workflow` map
   Product question: how does Black Skies move from finding to note to
   signal to action to revision to closure without re-creating a
   monolithic `Critique` system?
2. `Outline / Story Unit / Projection / Corkboard` reconciliation
   Product question: which optional structural and projection objects
   exist, how do they relate to `Narrative Insertion / Narrative
   Assertion`, and how do they avoid becoming hidden foundation?
3. save-state and degraded-writing workflow
   Product question: what should the writer honestly understand about
   `saved`, `pending`, `recoverable`, `degraded`, `at risk`, and
   `blocked` across direct writing and recovery?
4. `Ideation / Premise Discovery` dossier
   Product question: what early creative-discovery support belongs in
   Black Skies, what remains manual, and how do seeds or premise
   candidates avoid auto-becoming project truth?

The ordering may change if the current mission exposes a stronger
foundation conflict than expected.

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

A future implementation-planning review may be justified only when all
of the following are true:

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

- every craft analyzer
- voice workflows
- advanced branching
- the full `Series Binder`
- originality research execution
- model benchmarking execution
- complete historical archive migration
- full GUI specification

It also does not need to finish every downstream intelligence or product
expansion lane before the roadmap is considered usable.
