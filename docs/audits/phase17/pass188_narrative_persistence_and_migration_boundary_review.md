# Pass 188 - Narrative Persistence and Migration Boundary Review

Date: 2026-06-05
Mode: Research + architecture boundary review only

## Files Inspected

- `docs/audits/phase17/pass183_product_spine_reconciliation.md`
- `docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`
- `docs/audits/phase17/pass186_narrative_object_model_foundation.md`
- `docs/audits/phase17/pass187_narrative_object_lifecycle_and_identity_review.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/phases/phase11b_implementation_plan.md`
- `docs/audits/phase30/phase30_story_unit_governance.md`
- `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md`
- `docs/specs/design_system_v1.md`
- `docs/memory-lab/roadmap.md`
- `docs/memory-lab/phase5-contested-memory-spec.md`
- `app/shared/ipc/projectLoader.ts`
- `app/renderer/utils/storyUnits.ts`
- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
- `app/renderer/components/CompanionOverlay.tsx`
- `services/src/blackskies/services/analytics_stub.py`
- `services/src/blackskies/services/routers/analytics.py`

## Current Runtime Authority Map

The current runtime is still scene-first.

### Scene authority remains with:

- `LoadedProject` in `app/shared/ipc/projectLoader.ts`
- `outline` and `scenes` as the persisted project shape
- `drafts` keyed by scene id
- generation, preflight, critique, snapshot, export, and recovery flows that still route through scene identity

### StoryUnitV1 remains:

- a read-only, scene-derived compatibility layer
- a renderer/shared adapter over `OutlineSceneSummary` + `SceneDraftMetadata` + draft preview metadata
- dependent on `scene.id`, `scene.order`, and `scene.chapter_id`

### Navigation authority remains:

- `StoryNavigationPanel` still selects scenes by `sceneId`
- the panel presents story-unit language, but its action path is scene selection

### Companion authority remains:

- `CompanionOverlay` reasons over active scene, draft text, pacing, emotion arc, and analytics
- it does not yet reason over first-class narrative assertions/events, narrative gaps, or relationship provenance

### Analytics authority remains:

- scene metrics
- scene/character co-occurrence graph
- scene-level pacing and summary

### Persistence/export/recovery assumptions remain:

- existing projects open as scene/outline/draft sets
- current project recovery and export behavior remain scene-based
- scene ids and outline shape are still compatibility anchors

## Future Ontology Authority Map

The future ontology is layered above the current runtime, not substituted into it yet.

### Future first-class narrative objects:

- Narrative Assertion / Narrative Event
- Story Unit
- Narrative Gap
- Relationship
- Scene
- Chapter

### Suggested authority ordering:

1. Narrative Assertion / Narrative Event
2. Story Unit
3. Narrative Gap
4. Relationship
5. Scene
6. Chapter

### Authority intent:

- Narrative Assertion / Event: smallest semantic unit of story meaning
- Story Unit: authoring primitive and durable grouping object
- Narrative Gap: first-class missing-middle object
- Relationship: first-class typed edge with provenance
- Scene: canonical mature container / projection
- Chapter: higher-order container

## Migration Boundary

The migration boundary is the line between:

- the current scene-first runtime contract
- the future narrative-object-first ontology

### What remains scene authority

- scene persistence
- scene selection
- draft association by scene id
- export/recovery/project-switch behavior
- current analytics surfaces
- current Companion scene-facing reasoning
- `StoryUnitV1` as a compatibility view

### What becomes narrative-object authority

- future persistent Narrative Assertions / Events
- future Story Units as durable grouping objects
- future Narrative Gaps as explicit objects
- future Relationships as provenance-bearing edges
- future scene promotion and scene projection logic

### What can be layered above scenes

- read-only Story Unit compatibility views
- Story Unit grouping/ordering overlays
- narrative gap detection and advisory surfacing
- relationship maps and continuity overlays
- Companion suggestions that reference the richer ontology
- memory layers that reason over assertions, gaps, and relationships

### What cannot be layered above scenes yet

- replacing scene persistence as the current project contract
- forcing Story Unit-first or scene-first writing
- breaking export, recovery, or project-switch semantics
- silently changing `scene.id` or outline shape
- letting derived views become canonical storage without a migration contract

## Compatibility Strategy

### Scene persistence

- keep current `LoadedProject.outline`, `LoadedProject.scenes`, and `drafts` untouched
- preserve scene ids as stable anchors for current projects
- do not require a new on-disk narrative object model before compatibility exists

### StoryUnitV1 compatibility layer

- keep StoryUnitV1 as a derived adapter over scenes
- do not promote StoryUnitV1 to canonical storage in the transition path
- use it as the bridge between the current scene runtime and the future ontology

### Export assumptions

- export remains scene-facing for current projects
- future narrative objects may feed export later, but export must remain valid for scene-first projects during transition
- no narrative-object layer may invalidate existing exports without a migration plan

### Recovery assumptions

- recovery must continue to restore scene/outline/draft state first
- future narrative objects may be recoverable later, but not at the cost of current project restore behavior
- recovery cannot become dependent on the new ontology before migration support exists

### Continuity assumptions

- continuity currently tracks scene-based project state and project-switch behavior
- future continuity should consume narrative-object identity, branch history, and unresolved contradictions
- until then, continuity must keep treating scenes as the stable runtime anchor

### Companion assumptions

- Companion can continue to reason over scenes and drafts
- future Companion reasoning may incorporate assertions/events, gaps, and relationships
- Companion must remain advisory and must not become the source of canonical truth

## Non-Breaking Transition Strategy

1. Preserve current scene-first projects.
2. Keep StoryUnitV1 as a read-only derived layer.
3. Introduce future narrative objects without removing scene persistence.
4. Add migration or adapter code only when the new object model is stable enough to coexist with current projects.
5. Preserve old exports, recovery flows, and project switch semantics while the new model is introduced.
6. Do not make Story Unit-first writing mandatory.
7. Do not make scene-first writing mandatory.

## Risks

- dual authority between scenes and narrative objects if both become write sources too early
- export/recovery breakage if scene ids or outline shape change before a compatibility bridge exists
- StoryUnitV1 being mistaken for canonical storage
- Companion or analytics overreading scene-level data as full narrative ontology
- continuity drift if identity and provenance are not stable across promotion and recovery
- roadmap drift if the ontology foundation is treated as optional infrastructure instead of the next product spine

## Recommended Replacement for Candidate Phase 32

Replace or re-scope the current Phase 32 bucket with:

- `Story Unit Data Model + Qualitative Evaluation Foundation`

Reason:

- the ontology work shows Story Units need a stable model before broader GUI or multi-monitor expansion can safely consume them
- the current Phase 32 label in the master roadmap still points to multi-monitor / cross-window hardening, which is strategically later than the narrative-object foundation work
- the replacement should come with a compatibility-preserving migration contract, not a runtime rewrite

## Recommended Next Implementation Arc

Recommended arc:

1. Story Unit data model and identity contract
2. Narrative Assertion / Event persistence contract
3. Narrative Gap storage and lifecycle contract
4. Relationship storage and provenance contract
5. Scene promotion / projection contract
6. Continuity and memory consumption contract

If only one arc can begin next, start with:

- Story Unit data model + qualitative evaluation foundation

because it is the narrowest bridge between the accepted ontology and the current scene-first runtime.

## Validation Results

- `git diff --check` passed
- `pnpm lint:docs` passed

## Dirty Tree

- `?? docs/audits/phase17/pass183_product_spine_reconciliation.md`
- `?? docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`
- `?? docs/audits/phase17/pass186_narrative_object_model_foundation.md`
- `?? docs/audits/phase17/pass187_narrative_object_lifecycle_and_identity_review.md`
- `?? docs/audits/phase17/pass188_narrative_persistence_and_migration_boundary_review.md`
- `?? logs/`

## Commit Recommendation

- No commit recommendation.
- This is a research and architecture boundary review only.
