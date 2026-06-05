# Pass 198 - Qualitative Evaluation Fixture Foundation Planning

## Purpose

This pass plans fixture foundations for future qualitative evaluation using Narrative Object Contract v0 and the existing read-only scene compatibility bridge.

It does **not** implement an evaluator, grading system, Companion inference, prose extraction, or runtime behavior changes. The goal is to build stable manually authored fixtures that future read-only evaluators can inspect for explainable narrative signals.

## Current Implementation Inventory

| File | Classification | Why it matters |
| --- | --- | --- |
| `app/shared/narrativeObjectContract.ts` | Contract authority | Defines the JSON-safe Narrative Object Contract v0 shapes and shared lifecycle/provenance metadata. |
| `app/shared/narrativeObjectValidation.ts` | Validation authority | Validates ids, provenance, lineage, relationship targets, and bundle consistency without mutation. |
| `app/shared/narrativeObjectFixtures.ts` | Fixture authority | Holds manually authored Larry-based narrative-object fixtures used to exercise the contract. |
| `app/shared/narrativeSceneCompatibility.ts` | Adapter/test authority | Derives read-only narrative-object-compatible bundles from scene-first input without writing back. |
| `app/renderer/utils/__tests__/narrativeObjectContract.test.ts` | Adapter/test authority | Proves the contract and validation helpers accept valid objects and reject malformed ones. |
| `app/renderer/utils/__tests__/narrativeSceneCompatibility.test.ts` | Adapter/test authority | Proves the read-only compatibility bridge stays derived, immutable, and scene-first safe. |
| `app/renderer/utils/storyUnits.ts` | Unrelated current runtime compatibility authority | Still derives `StoryUnitV1` from scenes for the current UI; useful context, but not the qualitative fixture foundation. |
| `app/renderer/components/storyInsightsLabels.ts` | Unrelated current runtime helper | Current UI label helper; adjacent to analysis vocabulary but not part of the fixture foundation. |
| `docs/critique_loop_terminology.md` | Docs-only authority | Establishes existing critique terminology and automation vocabulary. |
| `docs/critique_rubric.md` | Docs-only authority | Defines the critique category vocabulary and output shape the repo already uses. |
| `docs/specs/critique_rewrite_provenance.md` | Docs-only authority | Defines critique/rewrite provenance and anti-pattern boundaries. |
| `docs/audits/continuity_authority_reconstruction_pass30.md` | Docs-only authority | Supplies continuity terminology and the distinction between continuity pressure and persistence authority. |
| `docs/audits/phase30/narrative_cognition_principles.md` | Docs-only authority | Provides the narrative cognition direction that later evaluators should remain subordinate to. |
| `docs/audits/phase30/narrative_structure_system_governance.md` | Docs-only authority | Documents structure/governance boundaries relevant to future narrative signals. |
| `docs/roadmap/candidate_phase32_story_unit_data_model_and_qualitative_evaluation_foundation.md` | Docs-only authority / roadmap charter | Replacement-charter context for the next implementation arc after fixture planning. |

## Qualitative Fixture Categories

### Contradiction Fixture

- Purpose: represent competing assertions that should coexist and be explainable as conflict, not overwritten truth.
- Required objects: at least two `NarrativeAssertion` objects, one `NarrativeRelationship` with contradiction semantics, and provenance on each assertion.
- Expected future signal: the evaluator should be able to point to a contradiction pair or contradiction chain.
- Must not be overclaimed: the fixture must not imply one assertion automatically wins.

### Unresolved Narrative Gap Fixture

- Purpose: represent a known beginning and ending with missing middle.
- Required objects: anchor assertions or story units, a `NarrativeGap`, and optional relationships to the anchors.
- Expected future signal: missing-middle or unresolved-structure detection.
- Must not be overclaimed: the fixture must not pretend the missing middle has been resolved.

### Relationship / Provenance Fixture

- Purpose: exercise typed relationships with clear source, target, and provenance.
- Required objects: at least two narrative objects and one or more typed relationships.
- Expected future signal: relationship provenance, category, and direction should be readable.
- Must not be overclaimed: the evaluator must not treat inferred relationships as authored truth.

### Foreshadow / Payoff Fixture

- Purpose: capture a narrative setup and later payoff without reducing the story to a score.
- Required objects: setup assertion(s), payoff assertion(s), and a relationship expressing the setup/payoff link.
- Expected future signal: explainable setup/payoff detection.
- Must not be overclaimed: the fixture must not imply grading or "quality points".

### Orphaned Assertion Fixture

- Purpose: test how a standalone assertion is handled when it has no obvious cluster, gap, or scene projection.
- Required objects: at least one `NarrativeAssertion` with provenance and minimal surrounding context.
- Expected future signal: orphaned or unplaced signal.
- Must not be overclaimed: the evaluator must not invent structure that is not present.

### Sequence / Reorder Fixture

- Purpose: test that meaningful order changes can be described without rewriting prose.
- Required objects: multiple assertions or story units with sequence metadata or relationships.
- Expected future signal: reorder-sensitive narrative meaning.
- Must not be overclaimed: the evaluator must not mutate the fixture text to simulate order.

### Scene Projection Fixture

- Purpose: show how scene-first data can project into compatible narrative-object views without changing scene authority.
- Required objects: scene-like input, derived scene-compatible output, and optional derived story units.
- Expected future signal: projection into a read-only scene/narrative-object bridge.
- Must not be overclaimed: the fixture must not imply the adapter is migration or runtime authority.

### Authored vs Inferred Boundary Fixture

- Purpose: ensure future evaluators can distinguish manually authored truth from derived or inferred objects.
- Required objects: a mix of authored and inferred/derived objects with provenance.
- Expected future signal: boundary detection between authored and inferred content.
- Must not be overclaimed: inferred data must not become authored truth without explicit user action.

## Manual Authorship Boundary

- Fixtures must be manually authored.
- No automatic prose extraction.
- No AI inference may become authored truth.
- Inferred and derived objects must remain labeled as inferred or derived.
- Companion is not involved in this pass.

## No Grading Rule

- No story score.
- No quality grade.
- No fake certainty.
- No good/bad writing verdicts.
- Future outputs should be explainable signals, not judgments.

## First Implementation Slice Recommendation

The safest Pass 199 slice is fixture-first:

1. Add qualitative fixture examples only.
2. Add validation tests proving those fixtures conform to Narrative Object Contract v0.
3. Optionally add static signal names in test metadata if that helps future evaluator wiring.
4. Do not add evaluator logic yet.
5. Do not add runtime imports.

Why this is the smallest safe slice:

- It reuses the existing contract and validation authority.
- It keeps the scene-first runtime untouched.
- It gives future evaluators stable, manually authored inputs.
- It avoids turning signals into judgments before the evaluator exists.

## Future Evaluator Boundary

### What a later evaluator may do

- Consume manually authored fixture bundles.
- Identify predefined signal patterns.
- Return explainable findings.
- Preserve provenance.
- Avoid overclaiming authorial truth.

### What a later evaluator may not do yet

- Parse prose.
- Mutate project data.
- Write persistence.
- Drive UI.
- Grade story quality.
- Invoke Companion or AI inference as authority.

## Acceptance Criteria

This plan is acceptable only if:

- scene-first runtime remains valid
- no runtime behavior changes are added
- no Story Unit gate is introduced
- no assertions are extracted from prose
- no grading is introduced
- the next pass can remain a narrow fixture/test slice

## Tracker / Roadmap Recommendation

- Candidate Phase 32 should stay aligned with `Story Unit Data Model + Qualitative Evaluation Foundation`.
- Pass 198 should hand off to a fixture-centric Pass 199 implementation slice.
- The fixture foundation should remain subordinate to the existing contract and read-only compatibility work.
