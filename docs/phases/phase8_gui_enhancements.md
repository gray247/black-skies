Status: Active implementation notes (Phase 8)
Version: 1.2
Last Reviewed: 2026-04-19

# Phase 8 - GUI Docking Enhancements

Authority note: this document tracks verified Phase 8 implementation behavior and remaining work.
For runtime truth, use `build/runtime_truth.json` and `docs/specs/current_state.md`.

## Verified implementation snapshot

### Dock manager integration
- Implemented using `react-mosaic-component` in `app/renderer/components/docking/DockWorkspace.tsx`.
- Docking, splitting, pane relocation, and preset switching are implemented.

### Layout persistence and multi-monitor behavior
- Persisted layout is stored via `app/main/layoutIpc.ts` in schema v2 payloads.
- Floating pane bounds are clamped for monitor changes.
- Renderer restores compatible docked layouts.
- Current behavior: persisted floating panes are intentionally not restored on load; the renderer logs skip/clear events and saves layout with an empty floating set.

### Accessibility and hotkeys
- Keyboard focus cycling and hotkey handling are implemented in docking workspace paths.
- Docking instructions include hidden helper text for accessibility.

### Companion and feedback expansion in this phase
- Budget meter is active in workspace header.
- Batch critique selection/run flow is implemented.
- Rubric editor add/remove validation flow is implemented.

## Evidence references
- `app/renderer/components/docking/DockWorkspace.tsx`
- `app/main/layoutIpc.ts`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/CompanionOverlay.tsx`
- `app/renderer/__tests__/DockWorkspace.test.tsx`
- `app/renderer/__tests__/LayoutPersistence.test.tsx`

## Remaining Phase 8 work
- Resolve and lock product policy for persisted floating pane restore behavior on app load.
- Complete any remaining manual accessibility verification artifacts tied to docking + floating workflows.

## Notes
Older wording that claimed persisted floating panes are reopened on load has been retired because it does not match current renderer behavior.
