# Pass 203 - Static Qualitative Evaluator v0 Planning

## Purpose

This pass plans a deterministic, read-only static qualitative evaluator that consumes manually authored qualitative fixture bundles and emits bounded qualitative signals.

The evaluator is intentionally planned as a non-authoritative, fixture-driven layer. It should remain explainable, deterministic, and strictly subordinate to the existing qualitative signal contract.

## Current Foundation Inventory

| File | Classification | Why it matters |
| --- | --- | --- |
| `app/shared/narrativeObjectContract.ts` | Contract authority | Defines the JSON-safe Narrative Object Contract v0 shapes, provenance, lifecycle, and lineage model that any evaluator input must respect. |
| `app/shared/narrativeObjectValidation.ts` | Validation authority | Validates narrative object ids, provenance, references, and bundle consistency without mutation. |
| `app/shared/narrativeObjectFixtures.ts` | Fixture authority | Holds manually authored narrative-object fixtures that demonstrate the baseline contract behavior. |
| `app/shared/narrativeSceneCompatibility.ts` | Adapter authority | Provides the read-only scene-to-narrative-object compatibility adapter and demonstrates derived, non-authoritative projection behavior. |
| `app/shared/narrativeQualitativeFixtures.ts` | Fixture authority | Holds manually authored qualitative fixture bundles for contradiction, gaps, relationships, foreshadow/payoff, orphaned assertions, reorder, projection, and authored/inferred boundaries. |
| `app/shared/narrativeQualitativeSignals.ts` | Signal authority | Defines the qualitative signal contract v0 for explainable observations with bounded confidence and object-id references. |
| `app/shared/narrativeQualitativeSignalValidation.ts` | Validation authority | Validates qualitative signal objects and rejects grading metadata, invalid provenance, and non-conforming references. |
| `app/renderer/utils/__tests__/narrativeObjectContract.test.ts` | Test authority | Proves the core narrative object contract and validation rules. |
| `app/renderer/utils/__tests__/narrativeSceneCompatibility.test.ts` | Test authority | Proves the read-only scene compatibility adapter remains derived, immutable, and prose-extraction free. |
| `app/renderer/utils/__tests__/narrativeQualitativeFixtures.test.ts` | Test authority | Proves the qualitative fixture foundation covers the required categories and remains contract-valid. |
| `app/renderer/utils/__tests__/narrativeQualitativeSignals.test.ts` | Test authority | Proves the qualitative signal contract v0 accepts bounded explainable signals and rejects grading metadata. |

## Evaluator V0 Boundary

### What the future evaluator may do

- accept manually authored qualitative fixture bundles
- validate fixture bundles against Narrative Object Contract v0
- match static fixture categories to expected signal categories
- emit Qualitative Signal Contract v0 objects
- preserve object-id references
- preserve provenance
- preserve bounded confidence
- return explainable observations

### What the future evaluator may not do

- parse prose
- infer authorial truth
- call AI
- call Companion
- mutate objects
- write project files
- change scene loading
- drive UI
- grade story quality
- produce score, grade, rating, or pass/fail results

## Required Evaluator Categories

The first evaluator slice should cover the existing eight qualitative fixture categories only:

1. contradiction
2. unresolved_gap
3. relationship_provenance
4. foreshadow_payoff
5. orphaned_assertion
6. sequence_reorder
7. scene_projection
8. authored_inferred_boundary

### Category Plans

#### contradiction
- Input fixture expectation: two competing authored assertions and an explicit contradiction relationship.
- Output signal category: `contradiction`.
- Required object references: the competing assertion ids and the contradiction relationship id.
- Provenance behavior: authored provenance on the assertions, with the signal describing the conflict rather than resolving it.
- Confidence behavior: bounded to a non-oracular label such as `low`, `medium`, or `high`.
- Must not be overclaimed: the signal must not imply that one assertion automatically wins.

#### unresolved_gap
- Input fixture expectation: a first-class `NarrativeGap` with anchors and an optional related relationship.
- Output signal category: `unresolved_gap`.
- Required object references: the start anchors, end anchors, and gap id.
- Provenance behavior: the gap stays explicitly unresolved.
- Confidence behavior: bounded and explainable, not absolute.
- Must not be overclaimed: the signal must not claim the missing middle is known.

#### relationship_provenance
- Input fixture expectation: a typed relationship with explicit source and target ids and provenance.
- Output signal category: `relationship_provenance`.
- Required object references: source id, target id, and relationship id.
- Provenance behavior: preserve the relationship provenance exactly.
- Confidence behavior: bounded.
- Must not be overclaimed: inferred relationships must not be presented as authored truth.

#### foreshadow_payoff
- Input fixture expectation: setup and payoff assertions linked by explicit relationships.
- Output signal category: `foreshadow_payoff`.
- Required object references: setup assertion id, payoff assertion id, and relationship id(s).
- Provenance behavior: explain the link via relationship structure, not prose interpretation.
- Confidence behavior: bounded.
- Must not be overclaimed: the evaluator must not convert setup/payoff into a quality verdict.

#### orphaned_assertion
- Input fixture expectation: a standalone assertion with minimal or no surrounding structure.
- Output signal category: `orphaned_assertion`.
- Required object references: the orphaned assertion id.
- Provenance behavior: the assertion stays standalone.
- Confidence behavior: bounded.
- Must not be overclaimed: the evaluator must not invent story-unit or scene ownership.

#### sequence_reorder
- Input fixture expectation: stable ids across baseline and reorder variants with changed presentation order.
- Output signal category: `sequence_reorder`.
- Required object references: the ids that remain stable across the reorder comparison.
- Provenance behavior: preserve durable ids and relation context.
- Confidence behavior: bounded.
- Must not be overclaimed: the evaluator must not rewrite or mutate fixture text to simulate reorder.

#### scene_projection
- Input fixture expectation: derived scene projection fixtures that remain read-only.
- Output signal category: `scene_projection`.
- Required object references: the derived scene, story unit, and chapter ids.
- Provenance behavior: preserve derived/read-only provenance.
- Confidence behavior: bounded.
- Must not be overclaimed: the evaluator must not claim migration authority or extract assertions from draft text.

#### authored_inferred_boundary
- Input fixture expectation: mixed authored and inferred/derived objects with explicit provenance.
- Output signal category: `authored_inferred_boundary`.
- Required object references: the authored and inferred ids involved in the boundary.
- Provenance behavior: keep authored and inferred provenance explicit.
- Confidence behavior: bounded.
- Must not be overclaimed: inferred provenance must not be upgraded to authored truth.

## Signal Generation Rules

- Signal ids must be durable and deterministic so fixture tests can assert exact outputs.
- Signals must reference narrative object ids, not object instances.
- Explanations must be human-readable and explainable.
- Confidence must stay within the existing bounded contract.
- Signal provenance must not claim authored truth from inferred or derived inputs.
- No score, grade, or rating metadata may be emitted.
- No quality verdicts may be emitted.

## Failure Behavior

- Invalid fixture bundles should fail validation clearly before signal generation.
- Unknown categories should fail clearly.
- Missing object references should fail clearly.
- Inferred provenance claiming authored truth should fail clearly.
- No partial mutation should occur.
- No runtime side effects should occur.

## First Implementation Slice Recommendation

The smallest safe Pass 204 implementation should be a pure shared helper, likely:

- `app/shared/narrativeStaticQualitativeEvaluator.ts`

Recommended shape:

- pure function only
- consumes existing qualitative fixture bundle(s)
- emits qualitative signals
- validates output with the qualitative signal validation helper
- tests live under the renderer Vitest glob if required by the current config
- no runtime imports

The first implementation should probably support all eight fixture categories because the fixture structure is already stable and the contract boundaries are now explicit.

If any category proves unstable during implementation, the fallback should be to reduce the slice only for that category and keep the evaluator pure and read-only.

## Test Plan for Pass 204

The Pass 204 tests should prove:

- the evaluator emits signals for all eight fixture categories
- emitted signals validate under Qualitative Signal Contract v0
- emitted signals reference ids only
- contradiction signals preserve competing assertions
- unresolved gap signals reference a first-class Narrative Gap
- foreshadow/payoff signals use relationships, not prose parsing
- orphaned assertion signals do not require Story Unit or Scene ownership
- sequence/reorder signals preserve durable ids
- scene projection signals stay derived/read-only
- authored/inferred boundary signals do not convert inferred content into authored truth
- the evaluator does not mutate input fixtures
- the evaluator does not parse prose
- the evaluator does not produce score, grade, rating, or pass/fail output
- the evaluator is not imported by runtime code

## Import / Runtime Boundary

The Pass 204 import-boundary check should allow only:

- the evaluator file
- the evaluator test file
- qualitative fixture files
- qualitative signal contract and validation files
- tracker/docs references

The Pass 204 import-boundary check should reject runtime matches in:

- `App.tsx`
- `preload.ts`
- `ProjectHome.tsx`
- `StoryNavigationPanel.tsx`
- project loading code
- export code
- recovery code
- project-switch code
- scripts that imply runtime execution

## Acceptance Criteria

This plan is acceptable only if:

- no runtime behavior changes are made
- no UI is introduced
- no prose parsing is introduced
- no AI/Companion inference is introduced
- no grading or score-as-truth is introduced
- scene-first runtime remains valid
- Story Units remain non-mandatory
- Pass 204 can be implemented as a narrow pure-code/test slice

