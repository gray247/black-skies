# Error / Toast Visibility Contract

Status: Phase 11 contract draft
Last Reviewed: 2026-05-06

## Source Of Truth
- `app/renderer/utils/serviceErrors.ts`
- `app/renderer/components/ToastStack.tsx`
- `app/renderer/hooks/useToasts.ts`
- `app/renderer/components/PreflightModal.tsx`
- `app/renderer/components/CritiqueModal.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/hooks/useRecovery.ts`

## Owned State
- Toast queue.
- Error banner/modal content.
- Trace ids.
- Retry/recovery actions.

## Transient State
- Auto-dismiss timers.
- In-flight request state.
- Temporary conflict or timeout messages.

## Persisted State
- Error details should not be persisted into user content.
- Diagnostics and logs may be written separately for support, but the toast itself is transient.

## User-Visible Behavior
- Every visible failure should answer: what failed, what project/scene was affected, whether data changed, and what the user should do next.
- When a trace id exists, it should be surfaced in the same error surface.
- Failure text should be specific enough to distinguish preflight, generation, critique, rewrite, backup, and recovery failures.
- A toast should not hide the fact that the action can be retried.

## Failure Behavior
- Generic fallback text is acceptable only for unknown failures.
- Rewrite conflicts should call out the disk mismatch and recovery step.
- Budget failures should say the request was blocked, not merely "failed".
- Analytics warnings should stay separate from generation failures unless they directly caused the failure.

## Recovery Behavior
- Toasts can include retry or view-report actions when the user needs the next step.
- Error surfaces should include a trace id or support hint when one is available.
- Recovery banners and modals should keep the user moving rather than dead-ending the workflow.

## Test Requirements
- Preflight timeout and provider timeout messaging.
- Generation failure toasts with trace ids.
- Rewrite conflict messaging.
- Snapshot verification and backup action toasts.
- Recovery banner error and retry coverage.

## Anti-Patterns
- "Generation failed." with no project or scene context.
- Hiding whether data changed.
- Dropping trace ids when they are available.
- Using the same generic message for preflight, generation, and rewrite failures.
- Treating unrelated analytics failures as the root cause of a generation conflict.
