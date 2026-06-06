# Pass 221 - Salvage Carry-Forward Extraction Map

## Purpose

This map identifies which existing Black Skies code and knowledge can be carried forward into the salvage shell, which items must wait, and which old files should remain reference-only.

It does not implement extraction.
It does not authorize wholesale copying.
It keeps `Narrative Insertion / Narrative Assertion` as the salvage foundation.
It keeps prose and scene as projection or compatibility layers rather than base architecture.

## Immediate Carry-Forward

### `app/shared/narrativeObjectContract.ts`

- what is useful:
  - the shared narrative-object type vocabulary,
  - durable identity fields,
  - provenance, lifecycle, and lineage structure,
  - explicit separation between assertions, gaps, relationships, Story Units, and projections.
- dependencies:
  - TypeScript only
- patch effort:
  - `none`
- risk:
  - low
- target salvage location:
  - continue importing from `app/shared/` rather than copying
- tests needed:
  - import-boundary checks,
  - contract smoke tests in salvage-facing renderer tests once the salvage narrative model starts using it

### `app/shared/narrativeObjectValidation.ts`

- what is useful:
  - bundle validation,
  - provenance guardrails,
  - unknown-reference checks,
  - authored-versus-derived truth boundaries.
- dependencies:
  - `app/shared/narrativeObjectContract.ts`
- patch effort:
  - `none`
- risk:
  - low
- target salvage location:
  - continue importing from `app/shared/` rather than copying
- tests needed:
  - validation regression tests against salvage narrative-model fixtures,
  - negative tests for derived or inferred truth claims

### `app/shared/narrativeQualitativeSignals.ts`

- what is useful:
  - bounded qualitative signal shape,
  - signal categories aligned to current Phase 32 work,
  - explicit provenance-bearing signal contract.
- dependencies:
  - `app/shared/narrativeObjectContract.ts`
- patch effort:
  - `none`
- risk:
  - low
- target salvage location:
  - continue importing from `app/shared/` later when signal consumption becomes real
- tests needed:
  - signal-shape validation tests,
  - no-grading metadata tests

### `app/shared/narrativeQualitativeSignalValidation.ts`

- what is useful:
  - signal validation,
  - grading-field rejection,
  - related-id validation,
  - provenance boundary enforcement.
- dependencies:
  - `app/shared/narrativeQualitativeSignals.ts`,
  - `app/shared/narrativeObjectValidation.ts`
- patch effort:
  - `none`
- risk:
  - low
- target salvage location:
  - continue importing from `app/shared/` later when signal inputs exist
- tests needed:
  - salvage-facing signal validation tests,
  - banned metadata regression coverage

### `app/package.json`

- what is useful:
  - build scripts,
  - lint command shape,
  - Vitest and Playwright script patterns,
  - Electron dependency inventory.
- dependencies:
  - existing app workspace tooling
- patch effort:
  - `low`
- risk:
  - low-medium
- target salvage location:
  - reuse script patterns inside the current app workspace rather than creating a new toolchain first
- tests needed:
  - targeted salvage test command stability,
  - build sanity checks for isolated salvage files

### `app/vitest.config.mjs`

- what is useful:
  - existing renderer test glob,
  - `jsdom` environment,
  - setup file integration already proven by salvage tests.
- dependencies:
  - existing renderer test setup files
- patch effort:
  - `none`
- risk:
  - low
- target salvage location:
  - keep the current config and add salvage tests inside existing globs
- tests needed:
  - continued isolated render tests,
  - import-boundary tests for salvage modules

### Existing salvage scaffold test pattern

- file/module:
  - `app/renderer/salvage/MinimalTwoSurfaceShell.test.tsx`
- what is useful:
  - isolated rendering,
  - surface-separation assertions,
  - non-gating assertions,
  - boundary-focused test language.
- dependencies:
  - Testing Library,
  - current Vitest setup
- patch effort:
  - `low`
- risk:
  - low
- target salvage location:
  - `app/renderer/salvage/testing/` later, or keep colocated until the salvage tree splits
- tests needed:
  - preservation tests when the shell is modularized,
  - non-authority tests for projection placeholders

## Carry-Forward Later

### `app/shared/narrativeStaticQualitativeEvaluator.ts`

- why later:
  - it is pure and useful, but runtime use must stay behind a deliberate signal-consumption boundary
- prerequisite boundary:
  - salvage narrative model,
  - explicit signal-consumption surface,
  - no-authority rule for evaluator output
- risk if carried too early:
  - the evaluator could become accidental runtime authority or UI truth before narrative inputs are settled

### `app/shared/ipc/projectLoader.ts`

- why later:
  - it contains compact contract vocabulary, but its current shape still encodes the legacy runtime family
- prerequisite boundary:
  - salvage-specific project loader contract plan,
  - narrow bridge plan
- risk if carried too early:
  - legacy runtime assumptions leak directly into the salvage shell and reintroduce mixed authority

### `app/main/projectBootstrap.ts`

- why later:
  - it contains useful title sanitization and starter-project semantics, but those semantics belong behind a future loader and project-creation boundary
- prerequisite boundary:
  - explicit salvage project-creation contract,
  - project-IO authorization
- risk if carried too early:
  - bootstrap file-family assumptions become de facto salvage architecture

### `app/main/projectLoaderIpc.ts`

- why later:
  - it includes project discovery and classification knowledge, but it is deeply tied to the current IPC surface and runtime authority
- prerequisite boundary:
  - narrow bridge design,
  - loader contract sketch,
  - explicit runtime wiring authorization
- risk if carried too early:
  - salvage starts depending on the old main-process wiring instead of a narrower bridge

### `app/shared/narrativeObjectFixtures.ts`

- why later:
  - fixtures are useful for contract testing once the salvage narrative model becomes real
- prerequisite boundary:
  - salvage narrative state model,
  - focused fixture-consumption tests
- risk if carried too early:
  - fixture structure may drive premature UI assumptions instead of serving narrow validation coverage

### `app/shared/narrativeQualitativeFixtures.ts`

- why later:
  - useful for later signal and continuity work, but not needed for the first salvage shell slices
- prerequisite boundary:
  - signal intake boundary,
  - qualitative review or inspection surfaces planned
- risk if carried too early:
  - salvage shell scope expands toward evaluator-driven behavior before the shell core is stable

### `app/renderer/utils/storyUnits.ts`

- why later:
  - it contains compatibility knowledge worth revisiting once Story Unit behavior is deliberately redefined
- prerequisite boundary:
  - Story Unit dossier,
  - salvage narrative-to-Story Unit boundary
- risk if carried too early:
  - the compatibility adapter becomes the native Story Unit model by inertia

## Reference-Only Knowledge

### `app/renderer/App.tsx`

- useful lessons:
  - the old shell shows where mixed authority accumulates,
  - it exposes how quickly one file can absorb orchestration, layout, services, and diagnostics together
- why not copy:
  - it is the monster-file anti-example the salvage shell is meant to avoid

### `app/main/preload.ts`

- useful lessons:
  - it inventories bridge surface area and shows the cost of a single undifferentiated preload layer
- why not copy:
  - the salvage bridge should be narrower, domain-split, and introduced later

### `app/renderer/components/ProjectHome.tsx`

- useful lessons:
  - create/open/recent-project affordances,
  - project-summary display ideas,
  - launcher friction points
- why not copy:
  - it mixes launcher concerns, diagnostics, preview behavior, state truth display, and other baggage

### `app/renderer/components/workspace/StoryNavigationPanel.tsx`

- useful lessons:
  - compact ordered-list presentation,
  - active-item indication,
  - simple selection affordances
- why not copy:
  - it is tied to compatibility `StoryUnitV1` and legacy projection-led workflow gravity

### `app/renderer/hooks/useRecovery.ts`

- useful lessons:
  - guarded async flow patterns,
  - reopen coordination,
  - action-state management
- why not copy:
  - it is tightly coupled to current services, diagnostics, and test-mode behavior

### `app/main/projectLoaderIpc.ts`

- useful lessons:
  - load error classification,
  - sample-path handling,
  - project-root discovery ideas
- why not copy:
  - it hardwires the current runtime contract family and IPC shape

### `app/main/projectBootstrap.ts`

- useful lessons:
  - safe bootstrap sequencing,
  - title sanitization,
  - starter-project collision handling
- why not copy:
  - its file-family assumptions belong to the current runtime, not to the salvage shell by default

### `app/shared/ipc/projectLoader.ts`

- useful lessons:
  - compact loader contract vocabulary,
  - explicit issue typing,
  - current project-load payload shape
- why not copy:
  - the salvage shell needs a narrower contract centered on future narrative foundations and projections, not the current runtime payload wholesale

### `app/renderer/utils/storyUnits.ts`

- useful lessons:
  - how the old app turned legacy projection material into compact ordered units
- why not copy:
  - it risks reintroducing compatibility scaffolding as base architecture

## Do-Not-Carry-Forward

The following patterns or concepts must not enter the salvage shell:

- monster shell orchestration
- giant preload bridge
- projection-container-led foundation drift
- Story Unit mandatory entry gate
- dashboard clutter as shell identity
- diagnostics-first user experience
- hidden test-mode runtime behavior
- evaluator as runtime authority
- Companion or AI as a required shell dependency
- unbounded project IO
- compatibility structures masquerading as base narrative truth

## Extraction Method

Future extraction must follow these rules:

1. Isolate the target behavior before touching code.
2. Carry forward shared pure contracts directly when possible instead of cloning them.
3. Copy only small pure helpers when shared import is not the right boundary.
4. Add tests before or beside each extraction slice.
5. Do not copy whole components into the salvage shell.
6. Rewrite projection-placeholder language into insertion, assertion, or projection terms when the salvage model is touched.
7. Preserve the two-surface model in every extraction step.
8. Keep the old app available as a reference implementation and cautionary map, not as architecture authority.

## Practical Next Extraction Order

1. Modularize the current salvage scaffold into shell, Writing Surface, Command Center Surface, and local state files without changing behavior.
2. Introduce a salvage narrative model centered on `Narrative Insertion / Narrative Assertion`.
3. Reframe the current projection placeholder model so it stops presenting containers as root identity.
4. Import shared narrative contracts and validators into the salvage model path.
5. Keep loader, bridge, recovery, export, and project-switch logic out until their boundaries are separately planned and approved.

## Acceptance Criteria

This extraction map is acceptable only if:

- it separates immediate carry-forward, later carry-forward, and reference-only material,
- it prevents projection-led foundation drift,
- it does not implement extraction,
- it gives a practical next extraction order.
