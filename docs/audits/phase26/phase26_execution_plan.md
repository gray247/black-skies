# Phase 26 Execution Plan: Project Bootstrap Truth + Brand-New Story Creation Workflow

Status: Planned
Date: 2026-05-20

## Phase Objective

Phase 26 proves a true fresh project can be created from scratch, validated, loaded, and entered into the normal workflow spine without inheriting sample/demo/runtime state.

This phase is about project-bootstrap truth and the first-story scaffold boundary. It is not a claim about story quality, originality, or authoring maturity.

## Explicit Non-Goals

Phase 26 does not prove:

- output quality
- story originality
- real-author-material maturity
- production readiness
- AI usefulness

Phase 26 does not:

- create a new roadmap system
- introduce a parallel fake loader
- silently auto-heal invalid projects
- copy sample/demo history into fresh projects
- broaden into a persistence or backend rewrite unless bootstrap truth requires it
- overclaim harness or sample-project evidence as fresh-project proof

## Bootstrap Truth & Corruption Rules

The loader is the sole project-validity authority.

Bootstrap truth must explicitly define:

- schema migration authority
- backup-before-migration rules
- migration rollback/failure semantics
- unsupported-version behavior
- runtime vs persistent state boundary
- canonical first-scaffold authority
- fixture/runtime proof separation
- no silent repair
- explicit corruption classifications

### Migration Authority

- Old project schema loads must route through an explicit migration path when supported.
- A partially upgraded project is not silently normalized into success.
- Migration failure must be rollback-aware and must preserve the pre-migration project state when possible.
- Unsupported future versions must fail closed as `unsupported-version`.
- Backups must be taken before any destructive migration attempt.

### Runtime vs Persistent Boundary

New project creation may initialize persistent metadata only.

New project creation may not initialize:

- runtime IDs
- recovery snapshots
- critique history
- session generations
- cached memory state
- generated draft lineage

Runtime/session state must be created only by runtime/session start, not by project bootstrap.

### Canonical First-Scaffold Authority

For Phase 26A, first-scaffold ownership defaults to filesystem/bootstrap.

Backend handoff is deferred unless implementation proves bootstrap alone cannot create a loader-valid blank project.

UI, backend, and template injection must not invent competing first-scaffold truth.

### Fixture / Runtime Separation

Fixture-generated projects must be visibly distinguishable from operator-created projects.

Harness proof cannot inflate runtime proof.

### No Silent Repair

Loader/bootstrap must not silently repair invalid projects.

Allowed:

- explicit repair flow
- deterministic recovery mode
- visible repair-needed state

Forbidden:

- hidden mutation during load
- silent schema rewrite
- implicit project normalization that changes user data without explicit repair flow

## New Project Validity Contract

A minimum valid blank project must define:

- required files
- required metadata
- required directories
- schema/version expectations
- a stable blank-project identity

Required baseline contract:

- `project.json` exists and identifies the project
- `outline.json` exists and uses the expected schema version
- the root project directory exists and is valid
- the project path is canonical and loadable by the existing loader

The exact blank-project contents must be explicit enough that the loader can decide validity without guessing.

## Project Identity Rules

Phase 26 must define:

- generated `project_id`
- collision prevention
- title vs id separation
- path/name sanitization

Identity rules:

- the project title is user-facing and may differ from the stable project id
- project id generation must be deterministic enough to avoid collisions in the same workspace
- existing folder conflicts must fail closed rather than silently overwriting or renaming
- invalid path characters must be sanitized or rejected before creation

## Atomic Creation and Rollback

Bootstrap creation must be atomic from the user perspective.

If creation fails halfway:

- partial project files must be cleaned up when safe
- rollback must leave the workspace in a known state
- invalid-project marker rules must be used when cleanup is unsafe

The plan must explicitly distinguish:

- failed creation with safe cleanup
- failed creation with unsafe cleanup
- invalid-project marker state that requires operator attention

## Sample-Project Firewall

New project creation must not copy sample/demo runtime truth.

Fresh projects must not inherit:

- history
- recovery state
- drafts
- snapshots
- runtime IDs
- session generations
- cached memory state

Sample/demo validation cannot count as new-project proof.

## Corruption Classifications

The loader must classify projects explicitly as one of:

- `valid`
- `partial`
- `corrupt`
- `unsupported-version`
- `recovery-required`
- `template-seeded`
- `empty`

Loader behavior by class:

- `valid`: load normally
- `partial`: load only if a deterministic repair/recovery path exists and is explicitly invoked; otherwise fail closed
- `corrupt`: fail closed and surface the corruption status
- `unsupported-version`: fail closed and surface the version mismatch
- `recovery-required`: load only through an explicit recovery path, not via silent repair
- `template-seeded`: load normally, but label as scaffold/template-derived rather than author-original proof
- `empty`: load normally with an honest empty-state UI

## Empty-State Lifecycle

The new-project lifecycle must be explicit:

- blank project
- scaffold initialized
- first scene exists
- draft exists
- accepted draft exists
- history exists

UI and backend must agree on which state is present. The plan must prevent “ready” labels that exceed actual state.

## Template / Scaffold Honesty

- starter scaffold may be template-seeded
- UI/docs must not imply author originality or output quality
- no AI-quality claims
- no authorial maturity claims

## Loader Compatibility

New projects must load through the existing project loader path.

There is no parallel fake loader for new projects.

## Backend / Service Compatibility

Phase 26 must define whether draft generate / critique / accept work immediately on a fresh blank project.

If they do not, the plan must define deterministic behavior:

- unavailable
- empty-state
- explicit prompt to initialize the scaffold first

No ambiguous “maybe works” state is acceptable.

## Test Fixture Isolation

Fixture-generated projects must be visibly distinguishable from operator-created projects.

Harness proof cannot inflate runtime proof.

Test fixtures must not be mistaken for bootstrap truth.

## Recommended Batches

### `26A` Project creation contract / identity / filesystem foundation

- define the bootstrap contract
- define identity and collision behavior
- define atomic create/rollback semantics
- define corruption classification and migration authority
- enforce the sample-project firewall

### `26B` Starter scaffold / minimum story structure

- define the minimum usable scaffold after creation
- define the first-scaffold ownership boundary
- define deterministic empty-state behavior for story actions

### `26C` UI entry + open/reopen continuity

- add the entry point for creating a fresh project
- ensure open/reopen behavior stays honest for blank projects
- keep stable GUI behavior intact

### `26D` Validation / closure / deferred carry-forward

- classify runtime-proven vs harness-proven vs policy-only items
- record deferred carry-forward honestly
- close only what is actually proven

## High-Risk Files / Systems

- [app/main/projectLoaderIpc.ts](/C:/Dev/black-skies/app/main/projectLoaderIpc.ts)
- [app/shared/ipc/projectLoader.ts](/C:/Dev/black-skies/app/shared/ipc/projectLoader.ts)
- [app/main/preload.ts](/C:/Dev/black-skies/app/main/preload.ts)
- [app/renderer/App.tsx](/C:/Dev/black-skies/app/renderer/App.tsx)
- [app/renderer/components/ProjectHome.tsx](/C:/Dev/black-skies/app/renderer/components/ProjectHome.tsx)
- [services/src/blackskies/services/operations/draft_generation.py](/C:/Dev/black-skies/services/src/blackskies/services/operations/draft_generation.py)
- [services/src/blackskies/services/scene_memory.py](/C:/Dev/black-skies/services/src/blackskies/services/scene_memory.py)
- [services/src/blackskies/services/backup_service.py](/C:/Dev/black-skies/services/src/blackskies/services/backup_service.py)
- filesystem bootstrap helpers
- loader validation and migration helpers

## Validation Plan

### `26A`

- unit tests for:
  - project identity generation
  - project validity checks
  - duplicate-name/path collision handling
  - atomic cleanup and invalid-marker fallback
  - sample-project firewall behavior
  - schema migration authority and unsupported-version handling
  - no-silent-repair rules
- loader tests for:
  - newly created project loads through the existing project loader path
  - invalid or partial creation does not masquerade as valid
- backend tests only if immediate bootstrap requires a service contract
- finish with:
  - `pnpm --filter app lint`
  - `pnpm --filter app run build:main`
  - targeted Vitest/Pytest lanes for touched surfaces

### `26B`

- tests for starter scaffold initialization and empty-state behavior
- loader tests for blank/scaffolded project transitions
- explicit proof that the first scaffold does not copy sample/demo runtime state

### `26C`

- UI tests for new-project entry behavior
- open/reopen continuity tests for blank projects
- honest empty-state labels and workflow-spine continuity tests

### `26D`

- final validation sweep across touched lanes
- closure review only

## Proof Classification Rules

- `runtime-proven`
  - a truly fresh project is created, loaded, and exercised without sample/demo inheritance
- `harness-proven`
  - fixture-only or sample-only creation proves the harness, not the production bootstrap contract
- `test-lane-proven`
  - a lane passes, but only inside its own proof boundary
- `policy-only`
  - roadmap or spec text exists, but no runtime behavior is demonstrated
- `output-quality unverified`
  - must remain explicit until future phases
- `creative-quality deferred`
  - story quality, originality, and authorial maturity remain out of scope
- `build/runtime verified`
  - use only for build/runtime existence, not quality or completeness
- `deferred`
  - intentionally postponed items
- `unverified`
  - no valid proof yet

## Stop / Escalation Triggers

Stop if:

- the only way to create a fresh project is to copy the sample project and mutate it
- implementation requires a broad backend or persistence rewrite beyond bootstrap truth
- stable GUI behavior is threatened
- the plan drifts into output-quality, originality, or real-author maturity claims
- a parallel fake loader is introduced for new projects
- loader validity becomes ambiguous across UI/backend/filesystem layers
- silent repair or hidden mutation appears during load or bootstrap

Escalate if:

- project identity, filesystem validity, and loader compatibility cannot be made atomic and deterministic
- migration behavior cannot be defined without silent repair
- empty-state lifecycle cannot be made honest and consistent

## Definition of Done

Phase 26 is complete when:

- a true fresh project can be created from scratch
- the project is valid by explicit loader rules
- project identity is deterministic and collision-safe
- bootstrap is atomic or leaves a clear invalid state
- sample/demo runtime state is not inherited
- loader compatibility is proven through the existing loader path
- runtime vs persistent boundaries are explicit
- empty-state lifecycle states are honest and consistent
- proof classes are recorded without overclaiming authoring maturity

## Explicit Deferred Carry-Forward Items

- output-quality validation
- story originality claims
- real-author-material maturity
- production readiness claims
- AI usefulness claims
- any broad backend or persistence refactor beyond bootstrap truth
- any later repair/recovery enhancements not required to define a valid blank project
- any future runtime proof of narrative quality or authoring maturity

