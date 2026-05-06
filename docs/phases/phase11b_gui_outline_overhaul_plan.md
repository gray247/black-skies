# Phase 11B GUI / Outline Overhaul Plan

Status: Follow-up plan
Last Reviewed: 2026-05-06
Purpose: define the later GUI and outline redesign that should only start after Phase 11 contracts are stable.

## Entry Criteria
- Pane lifecycle is documented and classified.
- Layout persistence has version, recovery, reset, and corruption rules.
- Generation scope is explicit in the UI and tests.
- Draft Preview has a stable read-only role.
- Scene Metadata has a stable role and field classification.
- Critique/rewrite provenance is documented.
- Error/toast visibility is standardized.
- Workflow spine is frozen.

## Scope For The Future Overhaul
- Narrative workspace modes.
- Stronger outline system.
- Scene cards and story-structure surfaces.
- Generation targeting from the outline.
- Visual hierarchy cleanup.
- Accessibility pass.
- Future emotional timeline readiness.
- Future memory panel readiness.

## Non-Goals
- Do not add memory systems.
- Do not add local LLM routing changes.
- Do not add plugin expansion.
- Do not add persona expansion.
- Do not add new major visualization systems during this planning phase.
- Do not treat the current contract freeze as a UI redesign.

## Suggested Sequencing
1. Lock the pane and layout contracts.
2. Lock generation scope and preview semantics.
3. Lock critique/rewrite provenance and error recovery.
4. Review whether the current three-pane shell still fits the documented workflow spine.
5. Only then design the outline-led workspace and broader GUI hierarchy.

## Deliverable Shape
- The later overhaul should be a separate plan, not an implicit Phase 11 side effect.
- It should reuse the frozen contracts instead of redefining them.
- It should specify what changes visually and what must remain behaviorally identical.
