# Pass 185 - Narrative Ontology Decision and Architecture Boundary

Date: 2026-06-05
Mode: Decision reconciliation only

## Files Inspected

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/audits/phase17/pass183_product_spine_reconciliation.md`
- `docs/audits/phase17/phase17_gui_authority_simplification_plan.md`
- `docs/audits/phase17/phase17_closure_review.md`
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

Note: `docs/audits/phase17/pass184_narrative_ontology_reconciliation_review.md` was not present on disk during this pass, so the decision was grounded in Pass 183 plus the supporting governance and runtime artifacts above.

## Architectural Decisions

1. Black Skies should use a layered narrative ontology, not a scene-only model.
2. The smallest independently meaningful narrative object is a Narrative Assertion / Narrative Event.
3. Story Units are first-class authoring objects and durable grouping objects, but they are not the smallest semantic primitive.
4. Narrative Gaps are first-class objects, not merely UI states or relationship states.
5. Relationships are first-class typed edges with provenance.
6. Scenes remain canonical mature containers for finished prose and current runtime compatibility.
7. Chapters remain higher-order containers above scenes.
8. Outline nodes, character entries, lore entries, and continuity records are support objects, not core primitives.

## First-Class Object Table

| Object | Decision | Authored | Inferred | Generated | Derived | Identity required | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Narrative Assertion / Event | Canonical first-class semantic primitive | Yes | Yes | Yes | Yes | Yes | Smallest object that can be independently created, moved, reordered, merged, split, related, promoted, or removed without rewriting prose |
| Story Unit | First-class authoring primitive and durable grouping object | Yes | Yes, as suggested groupings | Yes, as candidate suggestions | Yes, in current runtime compatibility view | Yes | User-facing span / cluster / anchor object; not the smallest primitive and not a mandatory entry gate |
| Narrative Gap | First-class missing-middle object | Yes | Yes | Yes | Yes, when surfaced from anchors | Yes | Represents unresolved work between known anchors |
| Relationship | First-class typed edge object | Yes | Yes | Yes | Yes | Yes | Must preserve provenance and category |
| Scene | Canonical mature container / projection | Yes | Yes, via promotion or extraction | Yes, as candidate scene creation | Yes | Yes | Finished prose artifact and current runtime authority for legacy projects |
| Chapter | Higher-order container | Yes | Yes | Yes | Yes | Yes | Organizes scenes, not a semantic atom |
| Outline Node | Support object | Yes | Yes | Yes | Yes | Yes | Planning/navigation support, not core ontology |
| Character Entry | Support / knowledge object | Yes | Yes | Yes | Yes | Yes | Useful for memory, continuity, and relationship reasoning |
| Lore Entry | Support / knowledge object | Yes | Yes | Yes | Yes | Yes | Useful contextual knowledge, not the narrative primitive |
| Continuity Record | Support / governance object | Yes | Yes | Yes | Yes | Yes | Tracks state, but does not replace narrative meaning |

## Authored vs Inferred Classification

- Narrative Assertions / Events may be authored directly, inferred from prose, or generated as candidate objects by later tooling.
- Story Units may be authored directly or derived from lower-level assertions/events; they may also be suggested by Companion, but author intent should control final acceptance.
- Narrative Gaps may be authored by the writer or inferred by Companion/Continuity as missing-middle candidates.
- Relationships may be authored, inferred, or generated, but provenance must distinguish those cases.
- Scenes may be authored directly or promoted from lower-level narrative objects.
- Chapters may be authored, outlined, or derived from scene organization.
- Support objects may be authored or derived, depending on the source system.

## Identity Ownership Recommendations

Durable identity is required for:

- Narrative Assertion / Event
- Story Unit
- Narrative Gap
- Relationship
- Scene
- Chapter

Identity rules:

- identity must survive reorder, export, import, recovery, and project switch
- identity must not depend on prose location alone
- inferred objects must preserve provenance in addition to identity
- derived views may be regenerated, but the source object identity must remain stable

## Narrative Gap Verdict

Narrative Gap should be a first-class object.

Reasoning:

- the system needs an object for known-start / known-end / unresolved-middle structure
- a gap is more than a relationship label; it is work to be done
- Companion, Continuity, and Hybrid Narrative Memory all benefit from a durable gap object
- if gap is only relationship-derived, the system loses explicit lifecycle and provenance for missing structure

## Relationship Verdict

Relationship should be a first-class typed edge object.

Required categories:

- structural
- narrative
- editorial
- inferred

Relationship rules:

- authored vs inferred must remain explicit
- provenance must be recorded
- relationships must survive scene movement, chapter reshaping, export, recovery, and reordering
- relationships are not the same thing as scene order
- relationship storage should allow multiple edges between the same objects with different provenance or categories

## Story Unit Verdict

Story Units should become a first-class authoring primitive and durable grouping object, but not the smallest semantic primitive.

Direct recommendation:

- Story Units are a hybrid role
- they are the user-facing narrative organization layer between idea and scene
- they may be persisted as first-class objects in the future architecture
- they should remain optional in the authoring flow
- they should not be forced as a mandatory gate before normal writing
- current scene-derived StoryUnitV1 scaffolding remains valid as compatibility until migration

What Story Units are not:

- not scene replacements
- not the only narrative primitive
- not the smallest semantic atom
- not a mandatory entry point for writing

## Scene Verdict

Scenes remain canonical mature containers and the current runtime authority for legacy projects.

Decision:

- scenes are still valid and required for backward compatibility
- scenes are the finished prose artifact / projection layer
- scenes should be promotable from lower-level narrative objects
- scenes should not be treated as the only source of narrative meaning
- scene-first writing must remain supported

## Larry Test Evaluation

The Larry example should be modeled as narrative assertions/events first:

- Larry got on a boat
- Larry caught a fish
- Larry had dinner with friends
- Larry died of poison
- Larry's wife poisoned him

Recommended classification:

- each line is a Narrative Assertion / Event object
- the first three may be grouped into a Story Unit or Story Unit cluster
- the last two are narrative assertions with a causal / explanatory relationship unless later evidence creates a contradiction
- if later evidence conflicts, the contradiction should be stored explicitly rather than erased
- if the middle is unknown, represent it as a Narrative Gap anchored to the known endpoints

Reordering:

- reorder by changing object order / sequence metadata and relationship metadata
- do not rewrite prose to preserve meaning
- prose can be regenerated later, but the object identities and relationships should remain stable

Contradictions:

- keep competing assertions
- link them with contradiction or conflict relationships
- preserve provenance and confidence

Gap handling:

- unresolved middle should be a Narrative Gap object, not just a missing sentence
- Companion may suggest bridges or likely continuations
- Continuity should track the unresolved state until resolved or parked
- Hybrid Narrative Memory should store the gap, its anchors, and its competing explanations

Companion reasoning:

- propose clustering, ordering, contradiction detection, and bridge candidates
- remain advisory
- do not silently resolve the ontology

Continuity reasoning:

- preserve identity across move, reorder, export, and recovery
- track which assertions, gaps, and relationships remain unresolved
- preserve provenance when the story changes

Hybrid Narrative Memory reasoning:

- store assertions/events, gaps, relationships, and provenance
- preserve contradictory possibilities instead of flattening them
- support later recall without pretending every memory is settled truth

## Migration Boundary

Preserved runtime assumptions:

- scene-based loading remains valid
- existing scene IDs remain valid
- current project recovery and export behavior remain valid
- `StoryUnitV1` compatibility can remain scene-derived while migration is planned
- current analytics and Companion surfaces can continue to operate on scenes while the ontology expands

Assumptions challenged:

- Story Units are only scene wrappers
- narrative meaning begins only at scene level
- gaps are only UI placeholders
- relationships are only scene/character co-occurrence edges
- Companion can reason only from the active scene
- continuity only needs to care about scene identity

Assumptions that must not change:

- existing projects must continue to open
- scene-first writing must remain optional and supported
- no workflow may be made mandatory unless explicitly justified
- no runtime migration may silently break export, recovery, or project switch

## Optionality Rules

The following workflows must remain optional:

- scene-first writing
- Story Unit-first writing
- gap-first planning
- outline-first planning
- discovery-after-writing workflows

No workflow may be made mandatory without explicit architectural justification and a compatibility plan.

## Runtime Assumptions Preserved

- [`app/shared/ipc/projectLoader.ts`](C:/Dev/black-skies/app/shared/ipc/projectLoader.ts) remains the scene/outline loader authority for current projects
- [`app/renderer/utils/storyUnits.ts`](C:/Dev/black-skies/app/renderer/utils/storyUnits.ts) can remain a derived compatibility view during transition
- [`app/renderer/components/workspace/StoryNavigationPanel.tsx`](C:/Dev/black-skies/app/renderer/components/workspace/StoryNavigationPanel.tsx) can remain scene-select driven while the ontology is introduced
- [`services/src/blackskies/services/analytics_stub.py`](C:/Dev/black-skies/services/src/blackskies/services/analytics_stub.py) can continue to expose scene and character metrics while a richer narrative graph is designed
- [`app/renderer/components/CompanionOverlay.tsx`](C:/Dev/black-skies/app/renderer/components/CompanionOverlay.tsx) can continue to reason over scenes until the richer ontology is available

## Runtime Assumptions Challenged

- scene-derived Story Unit compatibility is the final product model
- narrative intelligence can be inferred from scenes alone
- narrative gaps are only placeholder copy
- the analytics graph is already a semantic narrative relationship model
- companion reasoning is already enough to support topology, continuity, and memory
- current scene-first runtime assumptions should automatically define the future ontology

## Recommended Roadmap Implications

- Candidate Phase 32 should be replaced or re-scoped away from pure multi-monitor hardening and toward a narrative ontology foundation
- the best bridge is `Story Unit Data Model + Qualitative Evaluation Foundation`
- Hybrid Narrative Memory should be promoted into a named Black Skies workstream rather than staying only in Memory Lab
- continuity should be treated as a base layer for the narrative ontology, not just plumbing
- GUI overhaul should consume the ontology, not define it

## Recommended Next Execution Arc

Recommended next arc:

- Narrative ontology foundation, with Story Unit data model and qualitative evaluation as the first bridge

Why:

- it is the smallest arc that unblocks Story Units, Companion, continuity, and memory without forcing a premature GUI rewrite
- it resolves the current compatibility-layer vs future-primitive mismatch before larger implementation work starts
- it gives the roadmap a stable product spine before more surface work resumes

## Validation Results

- `git diff --check` will be run after this file is finalized
- `pnpm lint:docs` will be run after this file is finalized

## Dirty Tree

- `?? docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`
- `?? logs/`

## Commit Recommendation

- No commit recommendation
- This is an architecture-law memo only

## Accepted Architecture Decisions

- Narrative Assertion / Event is the smallest semantic primitive
- Story Unit is a first-class authoring primitive and durable grouping object
- Narrative Gap is a first-class object
- Relationship is a first-class typed edge
- Scene is a canonical mature container and current runtime compatibility authority
- Chapter is a higher-order container
- support objects remain support objects, not core primitives

## Deferred Decisions

- exact persistence schema for the new ontology
- exact promotion thresholds from assertion to Story Unit to scene
- exact storage layout for relationships and gaps
- exact UI presentation for the new ontology
- exact companion confidence policy for inferred vs authored relationships
- exact migration mechanics for future persisted Story Unit data

## Open Questions Requiring Future Phases

- should Narrative Assertion / Event and Story Unit share a common storage family or separate storage families?
- should Story Units be persisted before or alongside narrative assertions/events?
- what is the minimum safe migration path from scene-first projects to ontology-first projects?
- how much inference can Companion propose before author confirmation is required?
- what is the final visualization contract for gaps and relationships?

## Candidate Phase 32 Decision

Candidate Phase 32 should be replaced, not left unchanged.

Recommended replacement:

- Story Unit Data Model + Qualitative Evaluation Foundation

Reason:

- the current Phase 32 multi-monitor hardening framing outruns the product primitive problem
- the ontology decision makes the Story Unit foundation the more urgent bridge
- multi-monitor work should follow, not define, the narrative spine
