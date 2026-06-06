# Pass 210 - Narrative Object Persistence Contract Planning

## Purpose

This pass defines a planning-level persistence contract and schema direction for future narrative-object storage.
It does not implement runtime persistence, migration, scene loading changes, export changes, recovery changes, project-switch changes, or project file writes.

## Proposed Persistence Unit

A future persisted narrative-object store should be a separate, versioned unit beside existing scene-first project data.
At planning level, the store should be optional and project-scoped.

Proposed top-level contents:

- `storeVersion`
  - persistence artifact version for the store envelope itself.
- `projectRef`
  - stable project identifier or project-scoped reference; must prevent cross-project identity smear.
- `schemaVersion`
  - version for the narrative-object schema.
- `objects`
  - persisted narrative assertions, events, and Story Units.
- `relationships`
  - persisted relationship edges across objects.
- `gaps`
  - persisted narrative gaps and unresolved questions.
- `sceneProjectionLinks`
  - read-only linkage records from narrative objects to scene ids.
- `chapterProjectionLinks`
  - read-only linkage records from narrative objects to chapter ids.
- `provenanceRecords`
  - explicit authored, inferred, derived, and confirmation boundaries.
- `lineageRecords`
  - merge, split, promotion, demotion, supersession, and contradiction-branch metadata.
- `tombstones`
  - archived or removed object identity preservation records.
- `validationMetadata`
  - contract validation results, warnings, or stamp metadata if later needed.
- `migrationMetadata`
  - reserved for future migration state only; absent or inert until a migration arc exists.

## Object Persistence Shape

Planning-level persistence fields should stay consistent across object kinds.

### Narrative Assertion or Event

- `id`
- `kind`
  - assertion or event subtype
- `version`
- `revision`
- `lifecycleState`
  - active, archived, superseded, tombstoned, or equivalent bounded state
- `provenance`
  - authored, inferred, or derived
- `authoredTruthState`
  - bounded field showing whether author confirmation exists; inferred cannot self-upgrade
- `sourceRefs`
  - scene ids, chapter ids, outline refs, fixture refs, or future explicit author actions
- `objectRefs`
  - ids of related assertions, gaps, Story Units, or relationships
- `lineage`
  - merge, split, promotion, demotion, branch, supersession metadata
- `tombstone`
  - archive or removal metadata if inactive
- `createdAt`
- `updatedAt`
- `createdBy`
  - planning-level actor or source family if later needed
- `validationExpectations`
  - required ids, legal provenance combinations, and legal reference targets

### Story Unit

- `id`
- `kind`
  - Story Unit
- `version`
- `revision`
- `lifecycleState`
- `provenance`
  - may be authored, inferred, or derived, but inferred must remain bounded
- `sourceRefs`
- `objectRefs`
  - child assertions, events, relationships, or gaps if linked
- `lineage`
- `tombstone`
- `createdAt`
- `updatedAt`
- `validationExpectations`

Story Units must not become mandatory ownership containers for every assertion or gap.

### Narrative Gap

- `id`
- `kind`
  - unresolved gap or question subtype
- `version`
- `revision`
- `lifecycleState`
- `provenance`
- `sourceRefs`
- `objectRefs`
  - related assertions, scenes, Story Units, or chapters if present
- `lineage`
- `tombstone`
- `createdAt`
- `updatedAt`
- `validationExpectations`

### Narrative Relationship

- `id`
- `kind`
  - relationship family or category
- `version`
- `revision`
- `lifecycleState`
- `provenance`
- `sourceRefs`
- `objectRefs`
  - source and target ids only; not embedded object instances
- `lineage`
- `tombstone`
- `createdAt`
- `updatedAt`
- `validationExpectations`

### Scene Projection Link

- `id`
- `kind`
  - scene projection link
- `version`
- `lifecycleState`
- `provenance`
  - derived or explicitly authored mapping, but not scene-authority replacement
- `sceneId`
- `objectId`
- `projectionRole`
  - source, mention, placement, chronology anchor, or similar bounded role
- `lineage`
- `createdAt`
- `updatedAt`
- `validationExpectations`

### Chapter Projection Link

- `id`
- `kind`
  - chapter projection link
- `version`
- `lifecycleState`
- `provenance`
- `chapterId`
- `objectId`
- `projectionRole`
- `lineage`
- `createdAt`
- `updatedAt`
- `validationExpectations`

## Relationship Persistence Shape

Relationship storage should remain explicit and id-based.

Planning-level fields:

- `id`
- `sourceId`
- `targetId`
- `relationshipKind`
  - relationship family or category
- `provenance`
  - authored, inferred, or derived
- `boundedStatus`
  - explicit bounded or unconfirmed state if later needed
- `authorConfirmation`
  - separate from provenance so inferred links cannot claim authored truth
- `sourceRefs`
- `lineage`
  - merge, split, promotion, demotion, or branch metadata
- `contradictionBranchId`
  - allows incompatible interpretations to coexist without overwrite
- `lifecycleState`
- `tombstone`
- `createdAt`
- `updatedAt`

Confidence can exist only as a bounded metadata field if needed later.
It must not become a grading score or truth authority.

## Versioning and Tombstones

Future persistence must represent identity history without destroying earlier claims.

Planning requirements:

- `revision`
  - object-level revision count or token
- `archive`
  - bounded inactive state that preserves identity
- `tombstone`
  - persistent removal marker that retains lineage and prevents silent id reuse
- `merge`
  - records prior ids that collapsed into a surviving object
- `split`
  - records parent object ids that produced new descendants
- `promotion`
  - records transitions such as assertion to Story Unit or provisional to confirmed authorial object
- `demotion`
  - records loss of authority or shift back to provisional state
- `contradiction branches`
  - preserve multiple incompatible claims without overwrite
- `recovery after project switch, import, or export`
  - requires project-scoped identity plus lineage preservation so object histories do not smear across projects

## Scene Compatibility Contract

Scene-first projects must remain valid throughout any future persistence work.

The future contract must preserve:

- scenes stay loadable without any narrative-object store,
- the narrative store may be absent,
- the scene compatibility adapter remains read-only unless later explicitly authorized otherwise,
- scene ids and scene order must not be rewritten by the narrative store,
- chapter ids and scene placement remain governed by existing runtime authority until separately changed,
- export, recovery, and project-switch behavior remain unchanged until separately planned and implemented.

## Validation Strategy

Future implementation must add tests that prove:

- the store schema validates,
- a missing store does not break a scene-first project,
- an invalid store fails safely,
- an unknown relationship target fails safely,
- tombstones preserve lineage,
- contradiction branches coexist,
- inferred objects cannot claim authored truth,
- project switch does not smear object identity across projects,
- export and recovery behavior remain unaffected unless explicitly changed in a later authorized pass.

## First Future Implementation Slice

The next safe implementation after this planning bundle is a controlled `Pass 211 / 212` bundle:

- add persistence contract types or schema only,
- add validation helpers and tests,
- do not read or write project files yet,
- do not change runtime loading,
- do not change export, recovery, or project-switch behavior.

This keeps the next step inside contract and validation authority rather than storage authority.

## Acceptance Criteria

This contract plan is acceptable only if:

- no runtime implementation is performed,
- no migration implementation is performed,
- no scene loading, export, recovery, or project-switch changes are implied,
- the schema remains compatible with a missing narrative store,
- scene-first projects remain valid,
- provenance, lineage, and contradiction rules remain preserved.
