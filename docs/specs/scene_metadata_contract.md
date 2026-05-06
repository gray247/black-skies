# Scene Metadata Contract

Status: Phase 11 contract draft
Last Reviewed: 2026-05-06

## Source Of Truth
- `app/renderer/components/ProjectHome.tsx`
- `app/shared/ipc/projectLoader.ts`
- `services/src/blackskies/services/models/outline.py`
- `services/src/blackskies/services/draft_synthesizer.py`

## Owned State
- Selected scene id.
- Scene card list.
- Active scene header metadata.
- Metadata-to-draft linkage for generation and preview.

## Transient State
- Active selection highlight.
- Scene list loading state.
- Empty-state messaging when no project is open.

## Persisted State
- Scene metadata lives in the loaded project files and outline artifacts.
- Any user-authored metadata is persisted through the project data model, not through the sidebar itself.
- Current sidebar rendering is display-only in this phase; no metadata editing bridge exists yet.

## Field Classification
| Field | Classification | Notes |
| --- | --- | --- |
| `id`, `title`, `order`, `chapter_id`, `beat_refs` | System-derived / read-only | Comes from the loaded project and outline. |
| `slug` | Display-only | Useful for lookup and support. |
| `pov`, `goal`, `conflict`, `turn` | User-authored or AI-assisted | Can influence generation and critique context. |
| `purpose`, `emotion_tag`, `word_target` | Generation-affecting / Companion guidance | Feed draft synthesis, preflight budgeting, and overlay guidance. |

## User-Visible Behavior
- The sidebar shows the current scene list and updates the active scene when a card is selected.
- The draft header and Draft Preview should reflect the same active scene.
- If a field affects generation or critique, the UI should make that effect obvious when the field is displayed, even when it is not editable yet.
- Read-only fields should look read-only.
- Future editability would require a metadata edit surface, save IPC, validation rules, and prompt/guidance contract updates.

## Failure Behavior
- A missing scene should clear the active-scene contract rather than showing a wrong card.
- A stale scene list after project reload must not leave the preview bound to an old scene.
- Partial metadata should not prevent the scene list from rendering.

## Recovery Behavior
- The active scene should be rebound after project load when possible.
- Scene switch should refresh the visible metadata and preview together.
- If the current scene disappears after reload, the app should fall back cleanly rather than keeping stale metadata.

## Test Requirements
- Active scene selection updates.
- Draft preview updates after scene switch.
- Generated draft override remains tied to the active scene.
- Metadata/preview state stays aligned across project reloads.

## Anti-Patterns
- Hiding the effect of an editable field.
- Treating display-only values as generation inputs.
- Leaving stale scene metadata visible after selection changes.
- Mixing project-scoped metadata with global app state.
