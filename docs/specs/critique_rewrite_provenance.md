# Critique / Rewrite Provenance Contract

Status: Phase 11 contract draft
Last Reviewed: 2026-05-06

## Source Of Truth
- `app/renderer/hooks/useCritique.ts`
- `app/renderer/components/CritiqueModal.tsx`
- `services/src/blackskies/services/routers/draft/revision.py`
- `app/shared/ipc/services.ts`

## Owned State
- Critique result.
- Rewrite result.
- Provenance payload.
- Trace id.
- Rewrite instructions text.

## Transient State
- Critique loading state.
- Rewrite loading state.
- Rewrite error state.
- Modal open/close state.

## Persisted State
- Successful rewrite output persists to the draft file immediately.
- Critique output and rewrite result are transient in the renderer until the local view is synced or discarded.
- Snapshots and history records provide the durable audit trail after mutation.

## User-Visible Behavior
- Critique advises.
- Rewrite produces a saved result.
- Sync draft view updates the local renderer state to match the saved result.
- Reject or discard keeps the current local view unchanged.
- Provenance should identify the route, model/provider origin, and budget delta when known.
- The user should be able to see what changed before syncing the local view.

## Failure Behavior
- A rewrite conflict must be surfaced as a conflict, not a generic fetch failure.
- A failed rewrite must not masquerade as a saved rewrite.
- A failed rewrite should leave the current draft unchanged.
- A 409 should tell the user to refresh the project or rerun critique before retrying.

## Recovery Behavior
- If the on-disk scene changed, rerun critique before generating a new rewrite.
- If the conflict came from a stale request, refresh the project and request a new rewrite.
- Sync should update the local view from the saved rewrite result.
- Discard should close the result view without further mutation.

## Test Requirements
- Critique route selection.
- Rewrite route selection.
- Rewrite conflict messaging.
- No provenance shown for failed rewrite results.
- Explicit sync path coverage.

## Anti-Patterns
- Auto-applying rewrite output.
- Hiding the difference between critique and rewrite.
- Swallowing a 409 into a generic network error.
- Mutating the draft before accept.
- Showing provenance for a failed rewrite result as if it were accepted.
