# Pass 190 - Story Unit Data Model + Narrative Object Contract Planning

Date: 2026-06-05
Mode: Docs/spec planning only

## Purpose

This pass converts the Phase 17 narrative-object architecture law into a minimum safe implementation-boundary plan.

This document is intentionally placed under `docs/audits/phase17/` because it is an audit/spec hybrid: it records the planning boundary, the compatibility posture, and the next safe contract slice without starting runtime implementation.

## Non-goals

- No runtime behavior changes.
- No migration implementation.
- No GUI implementation.
- No Companion inference implementation.
- No Memory Lab implementation.
- No export/recovery/project-switch changes.
- No replacement of scene-first loading.
- No Story Unit mandatory entry gate.
- No runtime code changes.
- No test behavior changes.

## Current Authority Boundary

The following remain authoritative today:

- `LoadedProject`
- outline files
- scenes
- drafts
- current export behavior
- current recovery behavior
- current project-switch behavior
- `StoryUnitV1` as derived compatibility scaffolding, where present in current docs/code

### Current runtime authority shape

- current project loading is scene/outline/draft based
- scene ids remain stable anchors for the existing runtime
- current navigation and Companion surfaces still route through scene selection
- current analytics still summarize scenes and scene/character structure
- current persistence and export assumptions remain scene-first compatible

## Future Object Contract Candidates

The following are planning-level contracts, not implemented runtime objects yet.

### Narrative Assertion / Event

- Purpose: smallest semantic unit of story meaning
- Minimum fields likely needed: id, normalized text/value, provenance, confidence, authored/inferred status, lifecycle state, revision history pointer, relationship ids
- Identity requirement: durable object id, stable across reorder, recovery, export, and project switch
- Provenance requirement: mandatory for inferred or generated assertions, and recommended for authored assertions
- Lifecycle notes: can be created, revised, contradicted, merged into groups, promoted into Story Units or scenes, archived, recovered
- Relationship to scene-first runtime: should remain representable without breaking current scene-first projects
- What must not be inferred as authored truth: inferred or generated assertions must stay labeled as provisional until explicitly accepted

### Story Unit

- Purpose: author-facing organization primitive and durable grouping object
- Minimum fields likely needed: id, title, anchor/assertion ids, order, state, grouping/placement metadata, provenance, confidence, lifecycle state, scene-candidate pointers
- Identity requirement: durable object id, stable across reorder, merge, split, recovery, export, and project switch
- Provenance requirement: mandatory for derived or suggested groupings, recommended for authored groupings
- Lifecycle notes: can be created, modified, merged, split, bridged, promoted to scene candidate, demoted, archived, recovered
- Relationship to scene-first runtime: may remain a read-only derived view initially, then later become persisted if migration is justified
- What must not be inferred as authored truth: Companion-suggested groupings must not become canonical without explicit author confirmation

### Narrative Gap

- Purpose: explicit unresolved middle between known anchors
- Minimum fields likely needed: id, start anchor ids, end anchor ids, unresolved description, provenance, confidence, state, branch/continuation metadata
- Identity requirement: durable object id, stable while the gap remains unresolved or parked
- Provenance requirement: mandatory if inferred, recommended if authored
- Lifecycle notes: can be created, narrowed, widened, bridged, resolved, parked, archived, recovered
- Relationship to scene-first runtime: can be layered above scenes as advisory structure before any migration
- What must not be inferred as authored truth: a gap is not merely a placeholder label; inferred gap candidates must not be silently promoted

### Relationship

- Purpose: typed edge between narrative objects
- Minimum fields likely needed: id, source id, target id, relationship type, provenance, confidence, authored/inferred status, lifecycle state, supersession/lineage pointers
- Identity requirement: durable object id, stable even if connected objects move
- Provenance requirement: mandatory for inferred or generated relationships
- Lifecycle notes: can be created, revised, retyped, superseded, archived, recovered
- Relationship to scene-first runtime: should be able to coexist with current scene/character analytics without replacing them immediately
- What must not be inferred as authored truth: inferred relationships must remain advisory until explicitly accepted

### Scene

- Purpose: mature prose container and current runtime compatibility authority
- Minimum fields likely needed: id, title, order, chapter id, outline linkage, prose/draft linkage, provenance, state
- Identity requirement: durable object id, stable across project switch, export, and recovery
- Provenance requirement: required for promotion or extraction flows
- Lifecycle notes: can be authored directly, promoted from lower objects, archived, recovered
- Relationship to scene-first runtime: remains authoritative today and must not be displaced yet
- What must not be inferred as authored truth: a derived scene projection must not be treated as independent authored meaning without provenance

### Chapter

- Purpose: higher-order container above scenes
- Minimum fields likely needed: id, title, order, scene ids, provenance, state
- Identity requirement: durable object id, stable across reordering and recovery
- Provenance requirement: recommended when derived from structure
- Lifecycle notes: can be authored, organized, archived, recovered
- Relationship to scene-first runtime: remains a structural wrapper and does not replace scene authority
- What must not be inferred as authored truth: chapter organization should not be mistaken for semantic narrative assertions

## Persistence Family Decision Review

### Question

Should Story Unit and Narrative Assertion share one persistence family?

### Recommendation

Keep them separate but related for the safest first slice.

### Why separate is safer

- Narrative Assertions / Events are semantic atoms.
- Story Units are author-facing grouping objects.
- The two objects have different lifecycles, different maturity, and different authoring semantics.
- A shared persistence family risks premature coupling and schema lock-in before the migration boundary is settled.

### Risks of sharing one persistence family

- overcoupling semantic atoms to grouping objects
- forcing Story Unit persistence decisions before the assertion model is stable
- making migration harder if one object class stabilizes faster than the other

### Risks of separating too much

- extra coordination cost between assertion and grouping layers
- more adapter logic during early implementation
- potential duplication of provenance/identity envelope rules

### Safest first slice

- separate persistence families
- shared minimal envelope for identity, provenance, authored/inferred status, and lifecycle state
- read-only adapters between the families initially

## Migration Boundary

Minimum safe migration posture:

- no migration implementation yet
- derived views only
- scene-first projects remain valid
- `StoryUnitV1` remains compatibility scaffolding
- scene persistence remains the runtime anchor
- future ontology data may be modeled in docs/specs and fixtures before any storage migration exists

### Why no migration yet

- scene-first runtime behavior is still the current compatibility contract
- export, recovery, and project-switch behavior are still scene-centric
- object identity and versioning rules are not yet stable enough for a safe storage migration

## Contradiction and Versioning Policy

### Revised assertions

- same object id when the referent remains the same
- new revision record when meaning changes without a new referent

### Competing assertions

- keep competing assertions as separate objects or branches
- represent contradiction explicitly rather than overwriting

### Tombstones

- use tombstones or supersession records rather than silent deletion
- preserve lineage and recovery traceability

### Lineage

- every merge, split, promotion, and contradiction branch should preserve lineage metadata

### Confidence and authored/inferred status

- every inferred or generated object must carry provenance and confidence
- authored status must remain distinguishable from inferred or generated status

### Contradiction relationships

- represent contradiction with explicit conflict or contradiction edges/records
- do not flatten contradiction into a single “correct” object too early

## Companion Inference Boundary

Companion may:

- suggest candidate Story Units
- suggest candidate Narrative Assertions / Events
- suggest candidate Narrative Gaps
- suggest candidate Relationships
- explain why a candidate exists

Companion may not:

- convert inferred objects into authored truth without user action
- silently persist inferred objects as canonical truth
- hide provenance or confidence
- collapse competing interpretations into a single authoritative fact by default

Any inferred object must remain clearly labeled as provisional until the author accepts it.

## Minimum Safe Implementation Slice

Recommended first slice:

- docs/spec contract only

Why:

- the architecture boundary is still being stabilized
- runtime mutation would be premature while scene-first compatibility remains the current authority
- the next safe step is to formalize the contract, not to introduce storage or UI behavior

If a later slice is needed, the next safest runtime-adjacent step would be:

- read-only derived StoryUnitV1 mapping

but only after the contract has been accepted and the migration boundary is explicit.

## Acceptance Criteria

This pass is acceptable only if:

- scene-first projects remain valid
- Story Unit-first projects remain valid
- gap-first planning remains valid
- direct writing remains valid
- no mandatory Story Unit gate is introduced
- existing runtime behavior is not changed
- existing export/recovery/project-switch authority is not overclaimed
- Companion/inferred output remains advisory
- the next implementation step is clearly bounded

## Tracker / Roadmap Recommendations

### Phase 17 posture

Phase 17 should remain open through Pass 190 review.

Reason:

- Pass 190 is a planning/spec pass, not a closure review
- the ontology and object-model boundaries still need a formal implementation slice decision
- the architecture cluster is ready for handoff preparation, but not yet ready for final closure language

### Replacement Phase 32 recommendation

Replace the old Candidate Phase 32 framing with:

- `Story Unit Data Model + Qualitative Evaluation Foundation`

### Why this replacement is recommended

- it is the narrowest bridge between the accepted ontology and the current scene-first runtime
- it gives future GUI, continuity, Companion, and memory work a stable object model to consume
- it avoids jumping back into multi-monitor or cross-window hardening before the narrative object model is ready

### Handoff posture

After this planning/spec pass is accepted, the next step should be a replacement Phase 32 planning arc, not a runtime implementation jump.

## Validation Results

- `git diff --check` pending at creation time
- `pnpm lint:docs` pending at creation time

## Dirty Tree

- `?? docs/audits/phase17/pass184_narrative_ontology_reconciliation_review.md`
- `?? docs/audits/phase17/pass189_narrative_object_architecture_consolidation_and_handoff_anchor.md`
- `?? docs/audits/phase17/pass190_story_unit_data_model_and_narrative_object_contract_planning.md`
- `?? logs/pass133-backend.txt`

## Commit Recommendation

- No commit recommendation.
- This is docs/spec planning only.

