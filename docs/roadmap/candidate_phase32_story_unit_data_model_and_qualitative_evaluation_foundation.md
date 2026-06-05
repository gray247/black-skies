Status: Produced
Canonical role: Replacement Candidate Phase 32 charter for Story Unit and narrative-object foundation planning
Scope: Define the minimum safe implementation sequence for the Story Unit Data Model + Qualitative Evaluation Foundation replacement arc, preserving scene-first compatibility while future narrative-object contracts are introduced.
Owns: Narrative Object Contract v0 sequence, fixture assertion planning, validation-helper planning, unit-test planning, read-only compatibility-layer planning, and qualitative evaluation fixture planning.
Does not own: Runtime implementation, migration implementation, GUI implementation, Companion inference, Memory Lab implementation, export/recovery/project-switch changes, or mandatory Story Unit entry gates.
Upstream dependencies: `docs/audits/phase17/pass184_narrative_ontology_reconciliation_review.md`, `docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`, `docs/audits/phase17/pass186_narrative_object_model_foundation.md`, `docs/audits/phase17/pass187_narrative_object_lifecycle_and_identity_review.md`, `docs/audits/phase17/pass188_narrative_persistence_and_migration_boundary_review.md`, `docs/audits/phase17/pass189_narrative_object_architecture_consolidation_and_handoff_anchor.md`, `docs/audits/phase17/pass190_story_unit_data_model_and_narrative_object_contract_planning.md`, `docs/BLACK_SKIES_FIX_TRACKER.md`, `docs/roadmap/master_phase_allocation_plan.md`, `docs/roadmap/deferred_work_matrix.md`, `docs/roadmap/authority_reconciliation_strategy.md`
Downstream dependencies: future Story Unit implementation slices, narrative-object persistence planning, continuity / memory consumption planning, future Companion evaluation policy, and later GUI / topology consumers
Last reviewed: 2026-06-05
Acceptance record: Produced for planning use; awaiting governance review before any implementation is authorized

# Candidate Phase 32 Replacement - Story Unit Data Model + Qualitative Evaluation Foundation

## Purpose

Move from Phase 17 architecture law into safe implementation slices without breaking the scene-first runtime contract.

This charter is a roadmap replacement arc, not an immediate phase jump and not a runtime implementation plan.

## Non-Goals

- No full GUI.
- No full Companion.
- No full Memory Lab.
- No persistence migration.
- No automatic prose extraction.
- No export/recovery/project-switch changes.
- No Story Unit mandatory entry gate.
- No runtime behavior changes.
- No scene loading changes unless explicitly authorized later.

## Primary Goals

- Narrative Object Contract v0
- manually-authored fixture assertions
- validation helpers
- unit tests
- scene-first compatibility proof
- later read-only compatibility view
- later qualitative evaluation fixtures

## Required Implementation Order

### A. Narrative Object Contract v0

- shared types/interfaces
- validation helpers
- fixture examples
- unit tests
- manually-authored fixture assertions only

### B. Scene Compatibility Proof

- prove current scene-first runtime remains valid
- no scene loading changes unless explicitly authorized later

### C. Read-Only Compatibility Layer

- only after the contract exists
- may derive StoryUnitV1 or compatible views from existing scene data
- inferred/derived objects must be marked as not authored truth

### D. Qualitative Evaluation Fixture Foundation

- contradiction fixtures
- unresolved gap fixtures
- relationship/provenance fixtures
- foreshadow/payoff fixture examples
- no grading
- no fake certainty

## Persistence Family Planning

Safest first slice:

- keep Narrative Assertions / Events and Story Units separate but related
- share only a minimal identity/provenance/envelope pattern initially
- avoid premature schema lock-in before the migration boundary is settled

## Acceptance Criteria

- existing scene-first projects remain valid
- direct prose writing remains valid
- Story Units are not mandatory
- Narrative Assertions are not automatically extracted from prose in the first slice
- no migration is required for old projects
- no UI dependency is introduced
- no Companion authority is introduced
- tests cover the new contract before compatibility logic is added

## Roadmap Position

This charter replaces the old multi-monitor / cross-window Phase 32 framing as the next safe planning arc.

The recommended next implementation sequence is:

1. Narrative Object Contract v0
2. Scene compatibility proof
3. Read-only compatibility layer
4. Qualitative evaluation fixture foundation

## Governance Note

This charter should be treated as a replacement planning arc, not a promise of immediate implementation or a commitment to new runtime authority.

