# Layout Persistence Contract

Status: Phase 11 contract draft
Last Reviewed: 2026-05-06

## Source Of Truth
- `app/shared/ipc/layout.ts`
- `app/renderer/components/docking/DockWorkspace.tsx`
- `app/renderer/utils/layout.ts`
- `app/renderer/styles/stable-dock.css`

## Owned State
- Layout tree.
- Floating pane descriptors.
- Schema version.
- Project-specific layout file content.

## Transient State
- Debounced save timer.
- Layout load state.
- Last sanitized layout held in renderer memory.
- Clamp and relocation diagnostics.

## Persisted State
- Current layout schema version: `3`.
- Sanitized layout tree.
- Floating pane descriptors associated with the project path.
- Project-local layout file and its recovery/reset metadata.

## User-Visible Behavior
- Layout loads from the current project path and falls back to the default layout if the saved layout is missing or invalid.
- Schema mismatches are ignored rather than partially applied.
- Reset layout returns the workspace to the default preset and clears stale floating state.
- Offscreen floating panes are clamped back into view.
- Minimum floating-pane size is enforced.
- Unknown floating-pane ids are dropped while loading persisted state.

## Failure Behavior
- Missing or corrupt layout data does not trap the user in a broken shell.
- Invalid pane ids or duplicate panes cause the saved layout to be rejected.
- Failed persistence logs diagnostics and keeps the workspace usable.
- Corrupt floating-pane descriptors are normalized or dropped rather than being trusted.

## Recovery Behavior
- Default layout acts as the fallback default layout.
- Invalid saved state is discarded instead of being mutated in place.
- Offscreen floating panes are normalized into the active display area.
- Reset action is the user escape hatch for layout corruption.
- Floating descriptors that do not match a known pane id do not survive reload.

## Test Requirements
- Saved layout restore.
- Floating pane reload behavior.
- Offscreen clamp behavior.
- Minimum pane size behavior.
- Invalid layout rejection.
- Reset behavior from a dirty layout file.
- Unknown floating-pane id rejection.

## Anti-Patterns
- Storing layout state globally without a project key.
- Trusting a malformed or duplicate layout tree.
- Reopening floating panes without checking display viability.
- Leaving the user trapped with no reset path.
- Treating stale floating descriptors as canonical after reload.
- Persisting pane ids that the runtime no longer recognizes.
