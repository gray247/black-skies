# Pass 187 - Narrative Object Lifecycle and Identity Review

Date: 2026-06-05
Mode: Research + architecture review

## Files Inspected

- `docs/audits/phase17/pass186_narrative_object_model_foundation.md`
- `docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`
- `docs/audits/phase17/pass183_product_spine_reconciliation.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/audits/phase30/phase30_story_unit_governance.md`
- `docs/audits/phase30/phase30_pass2_workflow_policy_summary.md`
- `docs/audits/phase30/phase30_gui_workflow_realignment_spec.md`
- `docs/specs/design_system_v1.md`
- `docs/memory-lab/roadmap.md`
- `docs/memory-lab/phase5-contested-memory-spec.md`
- `docs/memory-lab/compatibility.md`
- `docs/memory-lab/events.md`
- `app/renderer/utils/storyUnits.ts`
- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
- `app/renderer/components/CompanionOverlay.tsx`
- `app/shared/ipc/projectLoader.ts`
- `services/src/blackskies/services/analytics_stub.py`
- `services/src/blackskies/services/routers/analytics.py`

## Lifecycle Model

Lifecycle must be defined per object class, but the shared pattern is:

```text
create -> modify -> relate -> merge/split -> promote/demote -> archive -> delete/recover
```

Object-specific notes:

- Narrative Assertion / Event: can be created, modified, related, contradicted, merged into higher-level groups, promoted into Story Units or scenes, archived, and recovered. Deletion should preserve history unless explicitly purged by an authorized retention policy.
- Story Unit: can be created, modified, merged, split, bridged, promoted to scene candidate, demoted back to a looser cluster, archived, and recovered.
- Narrative Gap: can be created, narrowed, widened, bridged, resolved, parked, archived, and recovered.
- Relationship: can be created, revised, retyped, superseded, archived, and recovered; deletion should usually become a tombstoned or superseded edge, not silent erasure.
- Scene: can be created, modified, promoted from lower objects, demoted to a candidate or draft precursor only conceptually, archived, and recovered; scene deletion is high-risk because current runtime already treats scenes as the mature container.
- Chapter: can be created, modified, reorganized, archived, and recovered.

## Identity Rules

### Same object vs new object

An object remains the same object when:

- its meaning is revised but not replaced
- its text changes but the object continues to represent the same narrative unit
- its order changes
- its parent/container changes
- its relationships change without replacing the underlying referent
- it is promoted to a more mature container while preserving identity

A new object should be created when:

- the author intends a distinct narrative referent
- a split produces two independently meaningful children
- a merge creates a new composite object that should not erase the constituents
- a contradiction produces a competing assertion with different truth conditions
- a versioned revision is semantically different enough that later reasoning must distinguish it

### Versioning

Versioning is required when a narrative object changes meaning without becoming a new referent.

Recommended versioning model:

- same object id for the enduring referent
- revision records for meaning changes
- provenance on each revision
- optional branch labels when contradictions or alternative interpretations coexist

## Contradiction Model

Contradictions should be stored explicitly, not overwritten.

Recommended treatment:

- keep both assertions
- mark contradiction with a dedicated relationship or conflict record
- preserve provenance and confidence
- allow one to be preferred, unresolved, or superseded without deleting the other

For the Larry case:

- `Larry died` and `Larry survives` are distinct assertions and should not collapse into one object
- `Larry was poisoned` and `Larry was not poisoned` are contradictory assertions
- the system should preserve both and track their conflict, rather than rewriting prose to force a single truth too early

## Merge / Split Model

### Merge

A merge combines multiple narrative objects into a higher-order object while preserving child identity and lineage.

Rules:

- the merged object may become the current working object
- original objects should remain recoverable and traceable
- provenance should record what was merged and why
- merge is not silent deletion

### Split

A split breaks one object into multiple children while preserving parent lineage.

Rules:

- the parent keeps identity as the originating container or archive record
- children receive distinct identities
- the split event is preserved as provenance
- the split should not destroy the parent history

## Promotion Model

Promotion should be monotonic in maturity, not in authority erasure.

Recommended promotion chain:

```text
Narrative Assertion / Event
-> Story Unit
-> Scene
-> Chapter
```

Rules:

- promotion should retain identity lineage when possible
- promotion changes container and maturity, not the fact that the object existed
- a promoted object should remain traceable back to its origin
- promotion may create a new projection object while preserving the source object

## Continuity Implications

Continuity should track:

- object identity
- revision history
- parent/child lineage
- contradiction branches
- promotion and demotion history
- archive and recovery state

Continuity must answer:

- which object is the same referent?
- which object is a new branch?
- which object is only a projection?
- which object remains unresolved?

## Memory Implications

Memory should store:

- the object identity
- the current accepted revision
- the unresolved alternatives
- the provenance trail
- the relationships to neighboring assertions and gaps

Memory must not flatten:

- contradictions
- alternative interpretations
- unresolved gaps

Memory should be able to answer:

- what was true before?
- what is preferred now?
- what remains unresolved?
- what branch did the user choose?

## Companion Implications

Companion should:

- suggest merges, splits, bridges, and promotions
- surface contradictions and gaps
- explain why a recommendation exists
- remain advisory
- avoid silent authority escalation

Companion should not:

- rewrite identity automatically
- collapse competing assertions without explicit author choice
- convert a suggestion into truth

## Risks

- treating scene promotion as identity replacement
- losing provenance during merge/split
- collapsing contradictory assertions into one “correct” object
- making Story Units mandatory and breaking normal writing flow
- letting derived views masquerade as canonical storage
- allowing Companion suggestions to become implicit authority

## Roadmap Implications

- `Candidate Phase 32` should remain replaced with `Story Unit Data Model + Qualitative Evaluation Foundation`
- the next phase family should define durable object identity and version history before any full persistence implementation
- continuity and memory should consume the lifecycle contract, not invent their own object semantics

## Validation Results

- `git diff --check` passed
- `pnpm lint:docs` passed

## Dirty Tree

- `?? docs/audits/phase17/pass183_product_spine_reconciliation.md`
- `?? docs/audits/phase17/pass185_narrative_ontology_decision_and_architecture_boundary.md`
- `?? docs/audits/phase17/pass186_narrative_object_model_foundation.md`
- `?? docs/audits/phase17/pass187_narrative_object_lifecycle_and_identity_review.md`
- `?? logs/`

## Commit Recommendation

- No commit recommendation
- This is research and architecture review only

## Lifecycle Summary

- identity survives meaning-preserving change
- new objects are created for new referents, split children, and explicit contradiction branches
- merges preserve lineage
- splits preserve origin
- promotions increase maturity without erasing source history
- archives preserve traceability
- deletion should be retention-aware and preferably tombstoned rather than silently erased

## Larry Test Summary

- `Larry dies` and `Larry survives` should be separate objects/branches
- `Larry was poisoned` and `Larry was not poisoned` should be separate contradictory assertions
- the contradiction should be represented as an explicit conflict relationship or conflict record
- continuity should preserve both branches and the author’s chosen resolution
- memory should remember the branch, not just the winner

## Accepted Architecture Decisions

- narrative objects need durable identity beyond prose placement
- contradiction must be explicit
- merge and split must preserve lineage
- promotion must not erase source history
- continuity and memory must track branch history, not just current truth

## Deferred Decisions

- exact versioning schema
- exact tombstone / purge policy
- exact merge lineage UI
- exact conflict resolution UX
- exact branch-selection semantics for Companion
- exact persistence schema for lifecycle history

## Open Questions Requiring Future Phases

- should every narrative object class have version branches, or only assertions/events and Story Units?
- what is the minimum safe tombstone model for deleted narrative objects?
- how should recovered objects reconcile with prior contradictions?
- when does a promoted scene become a new version versus a new object?
- what is the final persistence format for lifecycle history and provenance?

## Candidate Phase 32 Recommendation

Keep the replacement recommendation unchanged:

- Story Unit Data Model + Qualitative Evaluation Foundation

Reason:

- lifecycle and identity rules now reinforce the need for a concrete data model before implementation
- persistence and continuity cannot safely proceed without a stable object model
- multi-monitor or topology work remains downstream of object identity and lifecycle law
