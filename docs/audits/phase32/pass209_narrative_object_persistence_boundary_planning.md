# Pass 209 - Narrative Object Persistence Boundary Planning

## Purpose

This pass plans persistence boundaries for `Narrative Object Contract v0`.
It does not implement persistence, migration, runtime behavior, scene loading changes, export changes, recovery changes, project-switch changes, or project file writes.

## Current Runtime Authority Inventory

Current authority remains scene-first and is already distributed across existing runtime surfaces.

### Runtime authority

- `LoadedProject` in `app/shared/ipc/projectLoader.ts`
  - current in-memory runtime authority for loaded project state,
  - carries `projectId`, `outline`, `scenes`, `drafts`, and optional bootstrap metadata.
- scene files and scene metadata
  - `drafts/*.md` plus `outline.json` scene ordering and chapter placement,
  - currently define live scene identity, order, and chapter membership for the runtime.
- outline files and data
  - `outline.json` is current structural authority for chapters and scene placement.
- drafts
  - scene markdown drafts remain the current authored text authority.
- project loading
  - `app/main/projectLoaderIpc.ts` resolves project roots, reads `project.json`, `outline.json`, and `drafts`, and constructs `LoadedProject`.
- export
  - current export surfaces remain tied to the existing project family and must remain untouched until separately planned.
- recovery
  - `app/renderer/hooks/useRecovery.ts` and related preload/service surfaces remain aligned to existing project data and restore flows.
- project switch
  - current project switching behavior remains anchored to the scene-first load path and existing project metadata.

### Compatibility authority

- `StoryUnitV1` and `deriveStoryUnits` in `app/renderer/utils/storyUnits.ts`
  - current compatibility scaffolding above scenes,
  - derived from `LoadedProject.scenes`,
  - not a durable narrative-object persistence authority.
- `app/shared/narrativeSceneCompatibility.ts`
  - read-only adapter authority for tests and compatibility exploration only,
  - not migration and not runtime storage authority.

### Fixture or test authority

- `sample_project/Esther_Estate`
  - fixture authority for current on-disk project structure.
- `tests/test_snapshot_persistence.py`
  - test authority for current snapshot inclusion behavior.
- narrative object, qualitative fixture, and evaluator test files
  - bounded proof only; not runtime truth.

### Docs-only authority

- `docs/audits/phase32/pass208_foundation_integration_boundary_review_and_checkpoint.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

These describe current posture and boundaries but do not change runtime behavior.

### Future or non-authority today

- `app/shared/narrativeObjectContract.ts`
- `app/shared/narrativeObjectValidation.ts`
- `app/shared/narrativeObjectFixtures.ts`
- `app/shared/narrativeQualitativeFixtures.ts`
- `app/shared/narrativeQualitativeSignals.ts`
- `app/shared/narrativeStaticQualitativeEvaluator.ts`

These are real code and tests, but they are not persistence authority, migration authority, or runtime load authority today.

## Future Persistence Boundary Candidates

### A. Separate narrative object store beside scene data

- Safety
  - safer than rewriting current scene or outline files because it can remain optional.
- Migration risk
  - moderate; a future migration still needs to define when and how the store is created.
- Export, recovery, and project-switch impact
  - contained if treated as a new explicit artifact family, but still requires later planning.
- Scene-first compatibility
  - strong, because missing store can remain valid.
- Identity durability
  - strong if the store owns durable ids and lineage metadata.
- Provenance support
  - strong; separate records can preserve authored, inferred, and derived boundaries.
- Contradiction support
  - strong; contradictory assertions can coexist without overwriting scene data.
- Rollback and repair risk
  - lower than embedded mutation because the store can be ignored, repaired, archived, or removed independently.
- Story Unit mandatory risk
  - low if assertions, gaps, and relationships can exist without Story Unit ownership.

### B. Embedded narrative metadata inside existing project or scene files

- Safety
  - weakest option because it directly expands current authority files.
- Migration risk
  - high; every existing project file family would need rewrite or compatibility branching.
- Export, recovery, and project-switch impact
  - high; current file contracts, snapshots, and recovery assumptions would all change together.
- Scene-first compatibility
  - weaker because the scene-first path becomes storage-coupled to new ontology data.
- Identity durability
  - possible, but vulnerable to reorder and split behavior if ids are distributed across multiple files.
- Provenance support
  - possible, but more brittle because authored scene text and inferred metadata would live too close together.
- Contradiction support
  - possible, but risks noisy or conflicting inline state in scene-owned files.
- Rollback and repair risk
  - high because repair would involve core runtime files.
- Story Unit mandatory risk
  - elevated if scene or outline files become responsible for ontology completeness.

### C. Derived-only no-write layer for now

- Safety
  - safest immediate posture because it writes nothing.
- Migration risk
  - none for now.
- Export, recovery, and project-switch impact
  - none for now.
- Scene-first compatibility
  - perfect, because current runtime remains unchanged.
- Identity durability
  - weak as a future persistence answer because derived objects do not yet own durable storage.
- Provenance support
  - bounded, but only as test or compatibility evidence.
- Contradiction support
  - possible only in memory or fixtures, not durably across sessions.
- Rollback and repair risk
  - minimal because nothing new is stored.
- Story Unit mandatory risk
  - low.

This is the current posture, but it is not enough as the final persistence strategy.

### D. Hybrid: separate store plus scene projection links

- Safety
  - strongest long-term candidate if kept optional and versioned.
- Migration risk
  - moderate, but less invasive than embedding because scene files stay authoritative during transition.
- Export, recovery, and project-switch impact
  - explicit and plannable because the new store can be treated as a distinct artifact beside existing files.
- Scene-first compatibility
  - strong because the store can be absent and projection links can remain read-only until later runtime authorization.
- Identity durability
  - strongest option because object ids can survive scene reorder, merge, split, archive, and contradiction branching while still linking to scene ids.
- Provenance support
  - strong; authored, inferred, and derived records can be stored explicitly without rewriting scenes.
- Contradiction support
  - strong; contradiction branches can coexist inside the narrative store instead of overwriting scene data.
- Rollback and repair risk
  - lower than embedding because the store and links can be validated and repaired separately from scenes.
- Story Unit mandatory risk
  - low if scene projection links remain optional and assertions are allowed outside Story Unit ownership.

## Recommended Boundary

The safest next posture is:

- no persistence implementation yet,
- plan a separate versioned narrative object store beside existing scene data,
- include explicit scene and chapter projection links inside that future store,
- keep the runtime read-only with respect to the narrative store until a later migration and runtime-boundary plan exists.

This recommendation preserves the current doctrine:

- scene-first runtime remains authority today,
- old projects remain valid without any narrative store,
- export, recovery, and project-switch authority remain unchanged,
- durable identity can be planned without rewriting scene ids or scene order,
- inferred or derived outputs remain bounded and cannot silently become authored truth.

The boundary should be hybrid in structure but conservative in rollout:

- separate store for narrative objects and lineage,
- projection links back to existing scene and chapter ids,
- missing store remains valid,
- no runtime reads or writes until a later controlled implementation bundle.

## Non-goals

- no persistence writes yet,
- no migration yet,
- no scene loading changes,
- no export changes,
- no recovery changes,
- no project-switch changes,
- no UI,
- no Companion or AI inference,
- no prose extraction,
- no Story Unit mandatory gate.

## Risk Register

- split-brain risk between scene data and a future narrative store,
- identity drift if scene projections and object lineage are not validated together,
- stale derived objects if compatibility adapters outlive their intended temporary role,
- inferred or derived data being mistaken for authored truth,
- migration corrupting old projects if introduced too early,
- export or recovery mismatch if future artifact inclusion rules are unclear,
- project-switch mismatch if store identity is not tightly scoped to a project id,
- adapter becoming a permanent native model instead of a temporary bridge,
- overclaiming the current test-only foundation as runtime-ready.

## Acceptance Criteria

This boundary plan is acceptable only if:

- scene-first runtime remains authority,
- no runtime behavior changes are implied,
- no migration is implied as already safe,
- old projects remain valid,
- existing export, recovery, and project-switch authority is preserved,
- inferred and derived provenance remains bounded,
- future persistence can be implemented behind tests before any runtime wiring.
