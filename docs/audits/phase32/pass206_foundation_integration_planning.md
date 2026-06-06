# Pass 206 - Foundation Integration Planning

## Purpose

This pass plans a test-only foundation integration proof for the current narrative foundation slice.
It does not plan runtime integration, UI behavior, migration, persistence changes, or scene-loading changes.

## Current Foundation Inventory

### Contract authority

- `app/shared/narrativeObjectContract.ts`
- `app/shared/narrativeQualitativeSignals.ts`

These files define the allowable object and signal shapes, provenance fields, relationship categories, signal categories, and bounded confidence values.

### Validation authority

- `app/shared/narrativeObjectValidation.ts`
- `app/shared/narrativeQualitativeSignalValidation.ts`

These files own structural validation, known-id checks, provenance boundaries, duplicate-id rejection, and grading-field rejection.

### Fixture authority

- `app/shared/narrativeObjectFixtures.ts`
- `app/shared/narrativeQualitativeFixtures.ts`

These files provide manually authored object and qualitative fixture inputs for bounded tests.

### Adapter authority

- `app/shared/narrativeSceneCompatibility.ts`

This file owns the optional read-only scene-first compatibility bridge that derives a narrative bundle without runtime writes or prose extraction.

### Signal authority

- `app/shared/narrativeQualitativeSignals.ts`
- `app/shared/narrativeQualitativeSignalValidation.ts`

These files define and validate the non-authoritative qualitative signal contract.

### Evaluator authority

- `app/shared/narrativeStaticQualitativeEvaluator.ts`

This file maps manually authored qualitative fixture bundles to bounded, derived qualitative signals.

### Test authority

- `app/renderer/utils/__tests__/narrativeObjectContract.test.ts`
- `app/renderer/utils/__tests__/narrativeSceneCompatibility.test.ts`
- `app/renderer/utils/__tests__/narrativeQualitativeFixtures.test.ts`
- `app/renderer/utils/__tests__/narrativeQualitativeSignals.test.ts`
- `app/renderer/utils/__tests__/narrativeStaticQualitativeEvaluator.test.ts`
- `app/vitest.config.mjs`

These files prove the existing contract, adapter, fixture, signal, and evaluator boundaries under existing Vitest globs.

### Runtime authority

- runtime renderer, preload, main-process, project-loading, export, recovery, and project-switch files outside this planning slice

These remain out of scope. No runtime file should import the test-only integration proof.

### Docs/tracker authority

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase32/pass203_static_qualitative_evaluator_v0_planning.md`
- `docs/audits/phase32/pass198_qualitative_evaluation_fixture_foundation_planning.md`
- `docs/audits/phase32/pass195_read_only_scene_compatibility_planning.md`

These hold the active continuity record and the prior planning boundaries that this pass must respect.

## Safe Integration Path

The smallest safe integration chain is:

`manual qualitative fixture bundle`
-> `validate narrative objects`
-> `static qualitative evaluator`
-> `emitted qualitative signals`
-> `validate qualitative signals`

This chain is already compatible with the existing authorities because:

- the qualitative fixtures are manually authored and already validate as `NarrativeObjectBundle` inputs,
- the evaluator consumes only fixture data and remains read-only,
- emitted signals stay derived and non-authoritative,
- signal validation already rejects grading fields and unknown referenced ids.

The optional safe chain, only for tests, is:

`scene-like fixture`
-> `read-only scene compatibility adapter`
-> `derived/read-only narrative bundle`
-> `no prose extraction`
-> `no runtime import`

This optional chain is safe only if it stays fully inside tests and only proves read-only derivation, preserved scene ids/order, and derived provenance.

## Integration Non-Goals

This bundle must not introduce:

- runtime behavior
- UI behavior
- migration
- persistence writes
- Companion or AI inference
- prose extraction
- grading, scoring, rating, or quality verdicts
- a Story Unit mandatory entry gate

## Pass 207 Implementation Plan

The narrowest implementation slice is one new test file:

- `app/renderer/utils/__tests__/narrativeFoundationIntegration.test.ts`

Preferred approach:

- use `NARRATIVE_QUALITATIVE_FIXTURES` directly as the manual authored integration input,
- validate each fixture bundle with `validateNarrativeObjectBundle`,
- evaluate all fixtures with `evaluateStaticQualitativeFixtures`,
- validate emitted signals with `validateNarrativeQualitativeSignal`,
- assert id-only references, non-mutation, non-authoritative provenance, no grading metadata, and no prose extraction behavior,
- optionally include one read-only adapter test using `deriveReadOnlyNarrativeObjectsFromScenes` only if it remains derived/read-only and preserves scene ids/order.

No new shared helper should be created unless an existing helper proves insufficient. Current inventory suggests direct use of existing helpers is enough.

## Acceptance Criteria

The integration proof is acceptable only if:

- all emitted signals validate,
- qualitative fixture bundles validate,
- no input mutation occurs,
- no runtime imports are introduced,
- no prose parsing or extraction occurs,
- no score, grade, rating, pass/fail, or quality verdict metadata appears,
- Story Units remain non-mandatory,
- scene-first compatibility remains read-only if the optional adapter path is included.
