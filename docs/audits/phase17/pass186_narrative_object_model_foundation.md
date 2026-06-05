# Pass 186 - Narrative Object Model Foundation

Date: 2026-06-05
Mode: Research + architecture planning

## Files Inspected

- `docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`
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

## Object Inventory

| Object | Current role | Required identity | Can exist without prose | Can exist without scenes | Authored | Inferred | Generated | Derived | Persistence candidate | Projection/view candidate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Narrative Assertion / Event | Smallest semantic primitive | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Story Unit | Authoring primitive and durable grouping object | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes, during transition |
| Narrative Gap | Missing-middle object | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Relationship | Typed edge object | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Scene | Mature prose container / projection | Yes | No, usually not | Yes | Yes | Yes | Yes | Yes | Yes | Yes, as a rendered projection |
| Chapter | Higher-order container | Yes | No | Yes | Yes | Yes | Yes | Yes | Yes | Yes, as a structural projection |
| Outline Node | Support object | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Optional | Yes |

## Identity Requirements

Durable identity is required for all core narrative objects in the ontology:

- Narrative Assertion / Event
- Story Unit
- Narrative Gap
- Relationship
- Scene
- Chapter

Identity rules:

- identity must survive reorder, export, import, project switch, recovery, and regeneration
- identity must not depend on prose location alone
- inferred or generated objects must carry provenance alongside identity
- derived projections may be regenerated, but source object identity must remain stable
- the runtime must not confuse view identity with underlying narrative identity

## Ownership Model

### Narrative Assertion / Event

- owned by the narrative meaning layer
- may be authored directly by the writer
- may be inferred or generated as candidate structure later
- forms the semantic ground beneath Story Units and scenes

### Story Unit

- owned by the authoring / organization layer
- may be authored directly or derived from assertions/events
- may group one or more assertions/events
- may be persisted as a first-class object in the future architecture
- remains optional in the writing flow

### Narrative Gap

- owned by the missing-structure / continuity layer
- may be authored or inferred
- must preserve the fact that structure is unresolved
- should never be collapsed into a mere label or UI state

### Relationship

- owned by the relational meaning layer
- may be authored, inferred, or generated
- must preserve provenance and category
- must survive movement of connected objects

### Scene

- owned by the mature prose / projection layer
- may be authored directly or promoted from lower-level objects
- remains the runtime compatibility authority for legacy projects
- should preserve current project behavior while the ontology expands

### Chapter

- owned by the higher-order container layer
- organizes scenes
- remains a structural wrapper, not the semantic atom

## Authored / Inferred / Generated / Derived Boundaries

- Narrative Assertions / Events: authored, inferred, generated, and derived are all possible; the system must keep provenance explicit.
- Story Units: authored or derived are the primary cases; Companion may suggest groupings, but author intent should settle acceptance.
- Narrative Gaps: authored by the writer or inferred by Companion / Continuity.
- Relationships: authored, inferred, or generated, with provenance and category preserved.
- Scenes: authored directly or derived/promoted from lower-level objects.
- Chapters: authored, outlined, or derived from scene organization.

## Provenance Requirements

Provenance is mandatory for any object that may be inferred or generated.

Required provenance fields conceptually include:

- source system or author
- reason or basis
- confidence or certainty class
- whether the object is authored or inferred
- whether the object is canonical or derived

Provenance is especially important for:

- Narrative Assertions / Events
- Narrative Gaps
- Relationships
- scene promotion or extraction

## Persistence Candidates

The most likely persistence candidates are:

- Narrative Assertion / Event
- Story Unit
- Narrative Gap
- Relationship
- Scene
- Chapter

Rationale:

- these objects need durable identity for continuity, recovery, companion reasoning, and future topology
- they need to survive project switch and export
- they are the objects likely to carry meaning across runtime surfaces

## Projection / View Candidates

The following are best treated as projections or views rather than primary storage authorities:

- current `StoryUnitV1` compatibility view
- story-navigation list derived from scenes
- analytics scene metrics
- scene/character co-occurrence graph
- command-center summary panels that summarize loaded project structure

These views may remain useful while the ontology matures, but they should not be mistaken for canonical object storage.

## Implementation Constraints

- do not break scene-first loading
- do not break export / recovery / project switch
- do not force Story Unit-first writing
- do not force scene-first writing
- do not collapse assertions, gaps, and relationships into a single undifferentiated bucket
- do not let inferred Companion suggestions silently become authoritative runtime truth
- do not treat current compatibility views as the final ontology

## Roadmap Implications

- `Candidate Phase 32` should be replaced or re-scoped to `Story Unit Data Model + Qualitative Evaluation Foundation`
- future phases should consume the object model in this order:
  1. Story Unit data model
  2. narrative assertion / event persistence contract
  3. narrative gap handling
  4. relationship storage and provenance
  5. scene promotion / projection contract
  6. continuity and memory consumption
- Hybrid Narrative Memory remains a named workstream candidate, but it should consume the object model rather than define it ad hoc

## Validation Results

- `git diff --check` passed
- `pnpm lint:docs` passed

## Dirty Tree

- `?? docs/audits/phase17/pass183_product_spine_reconciliation.md`
- `?? docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`
- `?? docs/audits/phase17/pass186_narrative_object_model_foundation.md`
- `?? logs/`

## Commit Recommendation

- No commit recommendation
- This is research and architecture planning only

## Accepted Architecture Summary

- Narrative Assertions / Events are the smallest semantic primitives.
- Story Units are first-class authoring primitives and durable grouping objects.
- Narrative Gaps are first-class objects.
- Relationships are first-class typed edges.
- Scenes remain canonical mature containers / projections and current runtime compatibility authority.
- Chapters remain higher-order containers.

## Deferred Decisions

- exact storage schema for each object class
- exact promotion thresholds from assertion to Story Unit to scene
- exact graph / relationship data model
- exact UI for surfaced gaps and relationships
- exact Companion confidence policy
- exact migration mechanics for persisted Story Unit-first projects

## Open Questions Requiring Future Phases

- should Narrative Assertions / Events and Story Units share the same persistence family or separate ones?
- should Story Units be persisted before or alongside narrative assertions/events?
- how should version history be modeled for revised assertions and changed gaps?
- what is the minimal safe migration path from current scene-first projects to ontology-first projects?
- how much of relationship inference can Companion propose before the author must confirm it?

## Candidate Phase 32 Recommendation

Replace Candidate Phase 32 with:

- Story Unit Data Model + Qualitative Evaluation Foundation

Reason:

- the ontology and object-model decisions make Story Unit foundation the necessary bridge
- the current multi-monitor framing outruns the unresolved object model
- future GUI and topology work should consume the object model, not define it
