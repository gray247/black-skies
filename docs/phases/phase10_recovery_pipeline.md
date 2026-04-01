Status: Draft
Version: 1.0
Last Reviewed: 2025-11-15
Phase: Phase 10 (File ownership, continuity, and validation)
Source of Truth: See `docs/phases/phase_charter.md` for the Phase 10 commitments and out-of-scope list.
Legacy filename retained; this doc now covers Phase 10 continuity and validation.

# docs/phases/phase10_recovery_pipeline.md - DRAFT
> Implementation trace: `docs/BUILD_PLAN.md` -> Phase 10 row.

## Scope
Define the file ownership system, continuity pressure warnings, lore dependency graph, and stronger validation that keep the writing system internally consistent.

The existing history, snapshot, and restore machinery remains supporting infrastructure. It is not the focus of this phase and it does not imply a queue or background-worker system.

## Done When
- File ownership state is visible and persisted for the relevant scene/chapter/lore records.
- Continuity pressure warnings surface when edits conflict with locked story facts or dependent lore.
- The lore dependency graph is queryable and visible in the UI or support tooling.
- Validation rules catch duplicate ownership, missing links, and structural conflicts before they destabilize the story.

## Ownership & Dependencies
- Track which file owns each scene, chapter, and lore record.
- Record dependency edges so warnings can explain why a change is risky.
- Surface ownership summaries alongside the existing history/recovery data.

## Continuity Pressure
- Warn when a proposed edit contradicts a locked fact, a dependent lore record, or a later scene that already relies on the current state.
- Distinguish warning levels so writers can see whether a change is safe, risky, or blocked.

## Validation
- Validate ownership conflicts, duplicate references, missing links, and stale continuity state.
- Keep the checks service-first and deterministic.

## UI Surface
- The history pane may show ownership summaries, continuity warnings, and validation results.
- Restore behavior remains available through the existing snapshot/recovery path.

## Acceptance
1. Ownership summaries and continuity warnings appear for conflicting edits.
2. Lore dependency lookup explains why a warning was raised.
3. Validation prevents obvious ownership conflicts without introducing a new control plane.
