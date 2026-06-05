# Pass 184 - Narrative Ontology Reconciliation Review

Status: Recovered audit artifact

Recovery note: This file was created after Pass 189 identified the missing Pass 184 filesystem artifact. It reconstructs the Pass 184 ontology findings from prior conversation/output and from Passes 185-189. It is not a new implementation pass and does not introduce new runtime claims.

Date: 2026-06-05
Mode: Research only

## Files Inspected

- `docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`
- `docs/audits/phase17/pass186_narrative_object_model_foundation.md`
- `docs/audits/phase17/pass187_narrative_object_lifecycle_and_identity_review.md`
- `docs/audits/phase17/pass188_narrative_persistence_and_migration_boundary_review.md`
- `docs/audits/phase17/pass189_narrative_object_architecture_consolidation_and_handoff_anchor.md`
- `docs/audits/phase30/phase30_story_unit_governance.md`
- `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md`
- `docs/audits/phase30/phase30_pass2_workflow_policy_summary.md`
- `docs/specs/design_system_v1.md`
- `docs/phases/phase11b_implementation_plan.md`
- `docs/memory-lab/roadmap.md`
- `docs/memory-lab/phase5-contested-memory-spec.md`
- `app/shared/ipc/projectLoader.ts`
- `app/renderer/utils/storyUnits.ts`
- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
- `app/renderer/components/CompanionOverlay.tsx`
- `services/src/blackskies/services/analytics_stub.py`
- `services/src/blackskies/services/routers/analytics.py`

## Narrative Ontology Research Summary

Black Skies is not scene-only in the intended product direction.

The current runtime remains scene-first, but the accepted ontology already points to a layered narrative model where:

- Narrative Assertion / Narrative Event is the smallest semantic primitive
- Story Unit is the author-facing organization primitive
- Narrative Gap is first-class
- Relationship is first-class, typed, and provenance-bearing
- Scene remains the mature prose container and current runtime compatibility authority
- Chapter is a higher-order container
- outline nodes, character entries, lore entries, and continuity records are support objects, not core primitives

The ontology must support both:

- idea -> Story Unit -> cluster -> scene -> chapter
- scene -> Story Units discovered later

It must also preserve normal writing workflows so the system does not become bureaucratic.

## Objects Found in Current Runtime

Current runtime authority remains scene-first.

The current runtime objects and containers include:

- `LoadedProject`
- `OutlineFile`
- `OutlineSceneSummary`
- `SceneDraftMetadata`
- scene ids
- outline ids
- drafts keyed by scene id
- scene-based analytics and scene/character co-occurrence surfaces
- scene-select driven navigation
- scene-facing Companion guidance

`StoryUnitV1` exists in the current runtime only as a derived compatibility layer over scenes.

## Objects Found in Planning / Product Philosophy

Planning and product philosophy artifacts recognize:

- Story Units as a governed narrative primitive and workflow object
- Narrative Gaps as a distinct surface
- Companion as bounded and advisory
- Continuity as a base layer
- Hybrid Narrative Memory as a real product direction
- narrative topology as directional, not graph theater
- scene-first runtime compatibility as a requirement during transition

## Scene-First Runtime Reality

The current runtime remains scene-first because:

- project loading still returns scenes and drafts
- current navigation still selects scenes
- current generation / critique / recovery flows still route through scene identity
- current analytics remain scene and character based
- current export and recovery behaviors remain tied to scene/outline structure

Scene authority is therefore still the current runtime contract.

## StoryUnitV1 Compatibility-Layer Reality

`StoryUnitV1` is a read-only, scene-derived compatibility view.

It is constructed from:

- `OutlineSceneSummary`
- `SceneDraftMetadata`
- draft-preview metadata

It is not the canonical persistence model.

It is a bridge, not a replacement for current scenes.

## Recommended Ontology

The recommended narrative ontology is:

1. Narrative Assertion / Event
2. Story Unit
3. Narrative Gap
4. Relationship
5. Scene
6. Chapter
7. Support objects

### Object meanings

- Narrative Assertion / Event: smallest independently meaningful narrative object
- Story Unit: author-facing grouping / anchor object between idea and scene
- Narrative Gap: explicit unresolved middle between known anchors
- Relationship: typed, provenance-bearing edge between objects
- Scene: mature prose container and runtime compatibility authority
- Chapter: higher-order container
- Support objects: outline nodes, character entries, lore entries, continuity records

## Larry Manipulation Test

The ontology should represent these as narrative assertions / events first:

- Larry got on a boat
- Larry caught a fish
- Larry had dinner with friends
- Larry died of poison
- Larry's wife poisoned him

### How they become narrative assertions / events

Each statement becomes a distinct narrative assertion/event object with its own identity and provenance.

The first three may later be grouped into a Story Unit or Story Unit cluster.

The last two may be related causally or explanatorily unless later evidence produces a contradiction.

### How reordering works without rewriting prose

Reordering should change sequence metadata and relationship metadata, not rewrite the original assertions.

That preserves object identity while allowing the story structure to evolve.

### How contradictions are represented

Contradictions should be explicit:

- keep competing assertions
- connect them with contradiction or conflict relationships / records
- preserve provenance and confidence
- do not flatten them into a single forced truth too early

### How gaps are represented

Gaps should be first-class objects, not just placeholder text.

They should capture:

- known start
- known end
- unresolved middle

Companion may suggest bridges.
Continuity should track the unresolved state.
Hybrid Narrative Memory should preserve the gap and its competing explanations.

### How Companion, Continuity, and Hybrid Narrative Memory should reason

- Companion: suggest clustering, ordering, contradiction detection, and bridge candidates; remain advisory
- Continuity: preserve identity, history, unresolved branches, and recovery state
- Hybrid Narrative Memory: store assertions/events, gaps, relationships, and provenance without flattening contradictions

## Runtime Conflicts Found

The runtime still assumes scenes are primary.

Conflicts include:

- `StoryUnitV1` is scene-derived only, not canonical persistence
- navigation still selects scenes by `sceneId`
- analytics are scene/character based, not semantic narrative-object based
- Companion still reasons from scene and draft state
- current persistence/export/recovery still depend on scene/outline structure

## Migration Implications

The future ontology cannot replace scene authority immediately.

Migration must preserve:

- scene-based loading
- scene ids
- current export behavior
- current recovery behavior
- current project-switch behavior
- current `StoryUnitV1` compatibility scaffolding

The future ontology may be layered above scenes, but not in a way that breaks existing projects or makes scene-first writing mandatory.

## Risks

- treating Story Units as scene replacements
- collapsing authored, inferred, and derived objects into one bucket
- losing provenance during merge, split, or promotion
- breaking scene-first compatibility while introducing narrative-object authority
- letting Companion suggestions become authored truth
- over-interpreting analytics as semantic narrative authority

## Bottom-Line Recommendation

Black Skies should adopt a layered narrative ontology with durable identity and explicit provenance.

The near-term architecture should preserve scene-first runtime compatibility while preparing a Story Unit data model, Narrative Assertion / Event model, Narrative Gap model, and Relationship model that can later feed continuity, Companion, Hybrid Narrative Memory, and topology without rewriting existing projects.

## Validation Results

- `git diff --check` passed
- `pnpm lint:docs` passed

## Dirty Tree

- `?? docs/audits/phase17/pass183_product_spine_reconciliation.md`
- `?? docs/audits/phase17/pass184_narrative_ontology_reconciliation_review.md`
- `?? docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`
- `?? docs/audits/phase17/pass186_narrative_object_model_foundation.md`
- `?? docs/audits/phase17/pass187_narrative_object_lifecycle_and_identity_review.md`
- `?? docs/audits/phase17/pass188_narrative_persistence_and_migration_boundary_review.md`
- `?? docs/audits/phase17/pass189_narrative_object_architecture_consolidation_and_handoff_anchor.md`
- `?? logs/`

## Commit Recommendation

- No commit recommendation.
- This is a recovered documentation artifact only.
