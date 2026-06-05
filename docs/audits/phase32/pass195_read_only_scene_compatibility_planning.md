# Pass 195 - Read-Only Scene Compatibility Planning

## Purpose

This pass plans a read-only compatibility layer after Narrative Object Contract v0.
It converts the current scene-first runtime into a future narrative-object-compatible view without changing runtime behavior.

This document is a planning artifact only. It does not introduce an adapter implementation, migration logic, persistence behavior, or UI changes.

## Current Scene Authority Inventory

| Item | Current authority type | Relevant files | Notes |
| --- | --- | --- | --- |
| `LoadedProject` | Runtime authority contract | [`app/shared/ipc/projectLoader.ts`](C:/Dev/black-skies/app/shared/ipc/projectLoader.ts), [`app/main/projectLoaderIpc.ts`](C:/Dev/black-skies/app/main/projectLoaderIpc.ts), [`app/renderer/App.tsx`](C:/Dev/black-skies/app/renderer/App.tsx) | Defines the project payload that still drives the app today. |
| `OutlineFile` / outlines | Runtime authority | [`app/shared/ipc/projectLoader.ts`](C:/Dev/black-skies/app/shared/ipc/projectLoader.ts), [`app/main/projectLoaderIpc.ts`](C:/Dev/black-skies/app/main/projectLoaderIpc.ts), [`app/main/projectBootstrap.ts`](C:/Dev/black-skies/app/main/projectBootstrap.ts) | Outline JSON is still part of the canonical scene-first load path. |
| `SceneDraftMetadata` / scenes | Runtime authority | [`app/shared/ipc/projectLoader.ts`](C:/Dev/black-skies/app/shared/ipc/projectLoader.ts), [`app/main/projectLoaderIpc.ts`](C:/Dev/black-skies/app/main/projectLoaderIpc.ts), [`app/renderer/App.tsx`](C:/Dev/black-skies/app/renderer/App.tsx) | Scene metadata is the current mutable narrative container authority. |
| `drafts` | Runtime authority | [`app/shared/ipc/projectLoader.ts`](C:/Dev/black-skies/app/shared/ipc/projectLoader.ts), [`app/main/projectLoaderIpc.ts`](C:/Dev/black-skies/app/main/projectLoaderIpc.ts), [`app/main/projectBootstrap.ts`](C:/Dev/black-skies/app/main/projectBootstrap.ts), [`app/renderer/App.tsx`](C:/Dev/black-skies/app/renderer/App.tsx) | Draft text remains scene-keyed and scene-first. |
| Project loading | Runtime authority | [`app/main/projectLoaderIpc.ts`](C:/Dev/black-skies/app/main/projectLoaderIpc.ts), [`app/main/preload.ts`](C:/Dev/black-skies/app/main/preload.ts), [`app/renderer/App.tsx`](C:/Dev/black-skies/app/renderer/App.tsx) | Load behavior still resolves project roots, outlines, scenes, and drafts directly. |
| Export | Runtime authority | [`app/main/preload.ts`](C:/Dev/black-skies/app/main/preload.ts), service bridge and export route files under `services/src/blackskies/services/` | Export remains scene-based and should not be altered by the future adapter. |
| Recovery | Runtime authority | [`app/renderer/hooks/useRecovery.ts`](C:/Dev/black-skies/app/renderer/hooks/useRecovery.ts), [`app/main/preload.ts`](C:/Dev/black-skies/app/main/preload.ts), snapshot/persistence code under `services/src/blackskies/services/` | Recovery is still scene/project oriented and must remain untouched by a read-only adapter. |
| Project switch | Runtime authority | [`app/renderer/App.tsx`](C:/Dev/black-skies/app/renderer/App.tsx), [`app/main/preload.ts`](C:/Dev/black-skies/app/main/preload.ts) | Scene selection and project switch continue to be scene-first behaviors. |
| `StoryUnitV1` | Derived compatibility scaffolding | [`app/renderer/utils/storyUnits.ts`](C:/Dev/black-skies/app/renderer/utils/storyUnits.ts), [`app/renderer/components/workspace/StoryNavigationPanel.tsx`](C:/Dev/black-skies/app/renderer/components/workspace/StoryNavigationPanel.tsx) | Already derived from scenes; this is the right conceptual neighbor for a read-only adapter. |
| Sample project fixtures | Fixture authority | [`sample_project/`](C:/Dev/black-skies/sample_project/), [`app/main/__tests__/projectBootstrap.test.ts`](C:/Dev/black-skies/app/main/__tests__/projectBootstrap.test.ts), [`app/main/__tests__/projectLoaderIpc.test.ts`](C:/Dev/black-skies/app/main/__tests__/projectLoaderIpc.test.ts), [`tests/test_snapshot_persistence.py`](C:/Dev/black-skies/tests/test_snapshot_persistence.py) | Existing sample/test data remains the safest source for compatibility checks. |

## Proposed Read-Only Adapter Boundary

The future adapter may:

- accept existing scene/project-like data as input
- derive Narrative Assertion / Event, Story Unit, Narrative Gap, and Narrative Relationship-compatible views
- mark derived objects as inferred or derived, not authored
- preserve the current scene ids and scene order
- preserve current project loading behavior
- avoid writing back to project files
- avoid mutating scene, outline, draft, recovery, export, or project-switch data

The future adapter may not:

- change scene authority
- change the meaning of `LoadedProject`
- act as a migration layer
- act as a prose extractor
- become a UI dependency

## Explicit Non-Goals

- No automatic prose extraction in the first adapter implementation.
- No migration.
- No persistence writes.
- No UI wiring.
- No Companion authority.
- No scene loading replacement.
- No export, recovery, or project-switch changes.
- No mandatory Story Unit gate.

## First Implementation Slice Recommendation

The safest Pass 196 slice is a pure helper in shared code that derives a read-only narrative-object bundle from an existing scene/project fixture or `LoadedProject`-shaped object.

Recommended shape:

- input: existing scene/project-like object or fixture
- output: derived read-only narrative object bundle
- provenance: derived/inferred only unless the input is explicitly authored fixture data
- assertions: manually authored fixture assertions only, if assertions are needed
- prose parsing: none
- side effects: none

Why this is the smallest safe slice:

- it can be tested without opening the app UI
- it stays beside the current contract and validation helpers
- it does not require runtime wiring or data migration
- it preserves scene-first authority while proving the object contract can be viewed read-only

## Compatibility Proof Requirements

Pass 196 should add tests that prove:

- an existing scene-like fixture can be passed through without mutation
- a derived Story Unit is not mandatory for loading
- derived objects are marked inferred or derived
- scene id and scene order are preserved
- the adapter does not write files
- Narrative Assertions are not auto-extracted from prose
- invalid scene input fails safely
- existing scene-first tests still pass, or at minimum a targeted scene loader test still passes

## Risk Assessment

- Derived data could be mistaken for authored truth if provenance is not preserved.
- A helper could mutate scene data if it is not kept pure.
- Runtime import wiring could leak into the adapter too early.
- Compatibility could be overclaimed as migration.
- Story Units could accidentally become a gate if the adapter is introduced into the loading path.

## Acceptance Criteria

This plan is acceptable only if:

- scene-first runtime remains the authority
- no runtime behavior changes are made
- no project data migration is implied
- the future implementation can be tested without opening the full app UI
- adapter output is clearly derived and read-only
- Pass 196 can be implemented as a narrow code/test slice

## Tracker / Roadmap Recommendation

- Phase 17 remains closed for architecture discovery.
- Candidate Phase 32 should continue as `Story Unit Data Model + Qualitative Evaluation Foundation`.
- Pass 195 should hand off directly into Pass 196 as the read-only compatibility adapter slice.

## Recommended Next Execution Arc

1. Add a pure read-only compatibility helper in shared code.
2. Keep it fixture-driven and scene-first.
3. Prove derived narrative objects stay clearly inferred or derived.
4. Add targeted tests around shape, immutability, and provenance.
5. Defer any runtime wiring until the compatibility proof is green.

