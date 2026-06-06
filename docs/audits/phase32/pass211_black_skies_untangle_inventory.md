# Pass 211 - Black Skies Untangle Inventory

## Purpose

This pass audits the current Black Skies structure before persistence or runtime integration work continues.
The goal is to prevent death-spiral complexity by separating known-good foundations from runtime tangles, compatibility duct tape, and authority confusion.

## Known-good Inventory

### Shared foundation and validation

- `app/shared/narrativeObjectContract.ts`
  - classification: `keep`
  - reason: small, pure contract authority with no runtime coupling and clear Phase 32 value.
- `app/shared/narrativeObjectValidation.ts`
  - classification: `keep`
  - reason: pure validation authority, directly supports safe future persistence and runtime boundaries.
- `app/shared/narrativeObjectFixtures.ts`
  - classification: `keep with caveats`
  - reason: useful fixture authority, but still test-only and not project data.
- `app/shared/narrativeSceneCompatibility.ts`
  - classification: `keep with caveats`
  - reason: bounded read-only bridge with test value, but dangerous if promoted into permanent runtime authority.
- `app/shared/narrativeQualitativeFixtures.ts`
  - classification: `keep with caveats`
  - reason: useful manual fixture authority for evaluator testing, but not runtime truth.
- `app/shared/narrativeQualitativeSignals.ts`
  - classification: `keep`
  - reason: clean signal contract with bounded provenance and no grading authority.
- `app/shared/narrativeQualitativeSignalValidation.ts`
  - classification: `keep`
  - reason: pure validation layer with strong boundary value.
- `app/shared/narrativeStaticQualitativeEvaluator.ts`
  - classification: `salvage candidate`
  - reason: useful pure evaluator logic, but should not be promoted into runtime until the authority and persistence lanes exist.

### Project loading and current project-family authority

- `app/shared/ipc/projectLoader.ts`
  - classification: `keep`
  - reason: compact contract for current scene-first runtime authority; high reuse value even if shell changes.
- `app/main/projectLoaderIpc.ts`
  - classification: `keep with caveats`
  - reason: current loader authority is coherent and practical, but tightly bound to the existing project family and scene-first assumptions.
- `app/main/projectBootstrap.ts`
  - classification: `keep with caveats`
  - reason: current bootstrap path is useful and concrete, but tied to the existing file family and starter assumptions.
- `app/main/preload.ts`
  - classification: `discard candidate`
  - reason: very large bridge surface with broad API sprawl and accumulated compatibility/test hooks; a likely source of future coupling debt.

### Renderer shell and workflow surfaces

- `app/renderer/App.tsx`
  - classification: `discard candidate`
  - reason: the app shell is very large, highly stateful, and carries test modes, dock modes, recovery, export, companion, snapshots, and scene-authority orchestration in one place.
- `app/renderer/components/ProjectHome.tsx`
  - classification: `reference only`
  - reason: useful as a behavior map for create/open/recent-project flows, but too broad and stateful to carry forward unchanged.
- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
  - classification: `salvage candidate`
  - reason: small and clear, but still tied to `StoryUnitV1` compatibility output.
- `app/renderer/utils/storyUnits.ts`
  - classification: `keep with caveats`
  - reason: useful compatibility scaffolding today, but likely harmful if it becomes permanent ontology authority.
- `app/renderer/hooks/useRecovery.ts`
  - classification: `reference only`
  - reason: contains real recovery flow knowledge, but remains coupled to existing services, test harness behavior, and current renderer assumptions.

### Tooling, fixtures, and evidence

- `app/package.json`
  - classification: `keep with caveats`
  - reason: current app dependency and script surface is usable, but carries more than a minimal shell needs.
- `app/vitest.config.mjs`
  - classification: `keep`
  - reason: small, readable, and reusable for a narrower shell.
- `sample_project/Esther_Estate`
  - classification: `reference only`
  - reason: useful for real project shape evidence, but highly cluttered with history, exports, revisions, and accumulated diagnostics that should not define a cleaner future shell.
- `tests/test_snapshot_persistence.py`
  - classification: `keep with caveats`
  - reason: valuable backend truth for the current snapshot family, but only for the existing project artifact set.

### Phase 32 planning and checkpoint docs

- `docs/audits/phase32/pass208_foundation_integration_boundary_review_and_checkpoint.md`
  - classification: `keep`
  - reason: accurate statement of current test-only foundation posture.
- `docs/audits/phase32/pass209_narrative_object_persistence_boundary_planning.md`
  - classification: `keep`
  - reason: useful authority boundary and persistence planning anchor.
- `docs/audits/phase32/pass210_narrative_object_persistence_contract_planning.md`
  - classification: `keep`
  - reason: concrete planning baseline for future store/schema work.

## Tangle / Rot Inventory

### App-shell orchestration monolith

- risk
  - `app/renderer/App.tsx` is about 3.5k lines and mixes project activation, scene authority, service health, test modes, recovery, critique, companion, snapshots, export, docking, split-command layout, and floating windows.
- severity: `critical`
- action: `replace`

### Preload bridge sprawl

- risk
  - `app/main/preload.ts` is about 2.1k lines and exposes multiple authorities through one broad bridge surface. The bridge already spans project loading, services, diagnostics, layout, runtime config, and test-only sync behavior.
- severity: `high`
- action: `replace`

### Scene authority duplication

- risk
  - scene selection and activation logic spans `App.tsx`, `ProjectHome.tsx`, `storyUnits.ts`, loader state, and persisted preview-sync helpers. This is already a coordination hotspot before narrative-object authority exists.
- severity: `high`
- action: `isolate`

### ProjectHome as mixed loader/UI/diagnostics/session authority

- risk
  - `ProjectHome.tsx` mixes recent-project persistence, last-project storage, sample loading, project creation, diagnostics, session-truth display, scene selection, and draft preview in one component.
- severity: `high`
- action: `salvage`

### StoryUnit compatibility scaffolding ossification risk

- risk
  - `storyUnits.ts` derives `StoryUnitV1` directly from scenes and is already feeding runtime UI surfaces. If future ontology work routes through it too long, compatibility scaffolding becomes de facto model authority.
- severity: `high`
- action: `replace`

### Recovery and snapshot coupling

- risk
  - snapshot and recovery truth is already split across renderer hooks, preload/service bridges, backend persistence tests, and project artifacts. A narrative-object store would widen this unless isolated first.
- severity: `high`
- action: `needs deeper audit`

### Export and project-switch coupling to current project family

- risk
  - current project loading, export, recovery, and switch behavior all assume the existing `project.json` + `outline.json` + `drafts` family. Persistence work inside the same shell risks invasive coupling quickly.
- severity: `high`
- action: `defer`

### Test-mode and harness gravity

- risk
  - `App.tsx` and recovery flows carry significant test-mode, mode-lock, and diagnostic logic. Tests provide evidence, but the volume of test-path code increases the risk that runtime truth and test truth drift apart.
- severity: `high`
- action: `isolate`

### Sample-project clutter as false authority

- risk
  - `sample_project/Esther_Estate` contains exports, revisions, nested diagnostic history, and long-lived artifacts. It is useful evidence, but unsafe as a clean-shell reference model.
- severity: `medium`
- action: `reference only`

### Read-only compatibility code becoming permanent duct tape

- risk
  - the scene compatibility adapter and StoryUnit scaffolding are safe only while explicitly transitional. If runtime integration keeps deferring native boundaries, these layers will become accidental permanent architecture.
- severity: `high`
- action: `discard`

## Dependency / Lift-out Map

### High-value lift-outs

- `narrativeObjectContract.ts` + `narrativeObjectValidation.ts`
  - dependencies: minimal shared TypeScript only
  - runtime coupling: none
  - test coverage: focused unit coverage exists
  - portability: high
  - salvage value: high

- `narrativeQualitativeSignals.ts` + `narrativeQualitativeSignalValidation.ts`
  - dependencies: shared contract types only
  - runtime coupling: none
  - test coverage: focused unit coverage exists
  - portability: high
  - salvage value: high

- `narrativeStaticQualitativeEvaluator.ts`
  - dependencies: shared fixture and signal contracts
  - runtime coupling: none today
  - test coverage: strong evaluator-only coverage exists
  - portability: high
  - salvage value: medium-high

- `app/shared/ipc/projectLoader.ts`
  - dependencies: current project schema types
  - runtime coupling: low
  - test coverage: indirect coverage through loader/UI tests and runtime behavior
  - portability: medium-high
  - salvage value: high

### Moderate-value lift-outs

- `app/main/projectLoaderIpc.ts`
  - dependencies: filesystem, current project schema, markdown parsing, bootstrap classification
  - runtime coupling: medium
  - test coverage: indirect and behavior-based
  - portability: medium
  - salvage value: medium-high

- `app/main/projectBootstrap.ts`
  - dependencies: current project family and filesystem conventions
  - runtime coupling: medium
  - test coverage: indirect
  - portability: medium
  - salvage value: medium

- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
  - dependencies: `LoadedProject`, `ActiveOutlineV1`
  - runtime coupling: medium
  - test coverage: indirect
  - portability: medium
  - salvage value: medium

### Low-value or risky lift-outs

- `app/renderer/App.tsx`
  - dependencies: extensive renderer, service, layout, and test-mode surfaces
  - runtime coupling: critical
  - test coverage: broad but mixed with harness and mode complexity
  - portability: low
  - salvage value: low

- `app/main/preload.ts`
  - dependencies: many IPC families and bridge responsibilities
  - runtime coupling: critical
  - test coverage: indirect
  - portability: low
  - salvage value: low as a whole, moderate in extracted fragments only

- `app/renderer/components/ProjectHome.tsx`
  - dependencies: loader bridge, local storage, diagnostics, draft editor, scene selection
  - runtime coupling: high
  - test coverage: partial/behavioral
  - portability: low-medium
  - salvage value: medium as behavior reference, low as direct carry-forward code

## Death Spiral Indicators

- every new narrative feature would need another adapter on top of scene-first runtime rather than a clean authority boundary,
- runtime imports would become progressively harder to police because current shell and preload already centralize too much behavior,
- scene-first structures and narrative-object structures would both be tempted to claim authority,
- GUI consumption of the foundation would likely require additional compatibility layers rather than direct clean boundaries,
- persistence planning already points toward a separate store, but the current project loading, recovery, export, and project-switch surfaces are tightly coupled to the existing artifact family,
- test-mode and runtime-mode logic already coexist inside the main shell in a way that increases drift risk,
- compatibility scaffolding such as `StoryUnitV1` and read-only scene projection would be at high risk of becoming permanent native architecture.

## Preliminary Recommendation

The evidence leans toward `salvage rebuild`, not continued internal rebuild and not full scratch rebuild.

Reasoning:

- the new Phase 32 shared foundation is strong enough to preserve,
- the current scene-first loader and bootstrap knowledge are worth salvaging,
- the current renderer shell and preload bridge are already large enough that adding persistence and ontology runtime integration inside them is likely to deepen the tangle,
- full scratch rebuild would throw away too many known-good shared pieces and working knowledge that still have high value.

The current app is still useful as a reference map and salvage source.
It is a weak candidate for carrying the next architecture layers cleanly inside the existing shell.
