# Generation Scope Contract

Status: Phase 11 contract draft
Last Reviewed: 2026-05-06

## Source Of Truth
- `app/renderer/App.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/PreflightModal.tsx`
- `app/renderer/hooks/usePreflight.ts`
- `app/shared/ipc/services.ts`
- `services/src/blackskies/services/models/draft.py`

## Owned State
- Current generation scope in the renderer.
- Active scene selection.
- Preflight request payload.
- Unit ids passed to draft generation.

## Transient State
- Preflight modal loading state.
- Generation pending state.
- Scope-count display state.
- Timeout/cost estimation state.

## Persisted State
- No standalone persisted scope file exists.
- Scope resets with the current project session and active project path.

## User-Visible Behavior
- The UI must make generation explicit.
- Current shipped scopes are `Active scene` and `All scenes only`.
- The UI must show the affected scene count before generation.
- The UI must show whether the request may replace existing text.
- The UI must show timeout or cost warnings when relevant.
- The UI must keep `Generate` from becoming a vague one-click action with hidden scope.

## Supported And Unsupported Scopes
| Scope | Current State | Contract |
| --- | --- | --- |
| `active_scene` | Implemented | Maps to one active scene. |
| `all_scenes` | Implemented | Maps to all loaded eligible scenes in the current project. |
| `selected_scenes` | Not implemented | Must remain hidden, disabled, or clearly unavailable. |
| `chapter_range` | Not implemented | Must remain hidden, disabled, or clearly unavailable. |
| `manuscript_range` | Not implemented | Must remain hidden, disabled, or clearly unavailable. |

## Failure Behavior
- If the request cannot be preflighted or generated, the failure message must say which scope failed.
- If the request exceeds backend limits, the UI must block it rather than pretending the scope is available.
- If generation fails after preflight, the user must know whether draft text changed.

## Recovery Behavior
- Scope changes should be retryable without reloading the app.
- Project switch resets the generation scope back to the default active-scene mode.
- A failed all-scenes request should let the user fall back to active-scene generation.

## Test Requirements
- Active-scene generation coverage.
- All-scenes explicit scope selection coverage.
- Preflight warning copy for scope and count.
- Timeout/cost messaging for generation.
- Canonical project-id behavior for preflight and generation requests.

## Anti-Patterns
- A bare `Generate` action with no visible scope.
- Exposing unsupported scopes as if they are available.
- Silently switching scopes on the user.
- Hiding the affected scene count.
- Treating active-scene and all-scenes as the same contract.
