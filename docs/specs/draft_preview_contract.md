# Draft Preview Contract

Status: Phase 11 contract draft
Last Reviewed: 2026-05-06

## Source Of Truth
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/App.tsx`
- `app/renderer/DraftEditor.tsx`

## Owned State
- Active scene id.
- Live draft text for the current scene.
- Draft override state.
- Project-path keyed preview sync state.

## Transient State
- Current docked or floated presentation.
- Hydration from localStorage.
- Active-scene changes from the project loader.
- Preview sync events from another window.

## Persisted State
- Draft preview sync entries in localStorage keyed by project path.
- Canonical draft files on disk after accept or save flows.
- Layout state for the pane that displays the preview.

## User-Visible Behavior
- Draft Preview is a read-oriented rendering surface for the current project and selected scene.
- It must identify what scene and project it is previewing.
- It must prefer live generated or edited draft state over stale disk text.
- It must survive float, dock, reload, and project switch without silently showing the wrong project.
- It must not collapse after generation.

## Failure Behavior
- Missing sync data falls back to the current in-memory project draft.
- Stale sync data from a different project path is ignored.
- If the active scene is unavailable, the preview should clear rather than lie.
- Corrupt sync payloads are treated as absent.

## Recovery Behavior
- Project switch rehydrates from the new project's current live state.
- Floating preview windows hydrate from the shared live state rather than disk-only text.
- When another window publishes a new active scene, the floated preview updates to match.

## Test Requirements
- Generated draft override after Proceed succeeds.
- Floated preview hydration from shared live state.
- Floated preview sync across windows.
- Stale disk text not shown after generation.
- Project-path keyed hydration and reload behavior.

## Anti-Patterns
- Using disk-first state as the primary preview source.
- Treating Draft Preview as a canonical editor.
- Sharing preview state across projects.
- Letting a floated preview drift from the active scene.
- Collapsing or clearing preview content just because generation completed.
