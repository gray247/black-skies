# Workflow Spine Contract

Status: Phase 11 contract draft
Last Reviewed: 2026-05-06

## Source Of Truth
- `app/renderer/App.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/PreflightModal.tsx`
- `app/renderer/components/CritiqueModal.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/docking/DockWorkspace.tsx`

## Owned State
- Project open state.
- Active scene selection.
- Scene metadata state.
- Generation scope state.
- Draft preview state.
- Critique/rewrite state.
- Snapshot/backup state.

## Transient State
- Modals.
- Toasts.
- Loading indicators.
- Selection focus.
- Layout drag state.

## Persisted State
- Project files.
- Layout file.
- Draft preview sync state.
- Snapshots and backup records.

## Workflow Spine
1. Open or create a project.
2. Build or review the outline.
3. Select a scene.
4. Review scene metadata.
5. Generate the active scene.
6. Preview the draft.
7. Critique the draft.
8. Generate a saved rewrite result.
9. Sync or discard the saved rewrite view.
10. Export or save.

## User-Visible Behavior
- The spine should be visible in the UI even if the layout remains the current three-pane shell.
- Each step should be explicit about what state it reads and what state it mutates.
- A user should be able to tell where they are in the workflow without guessing from hidden state.

## Failure Behavior
- A failure in one step must not silently advance the user to the next step.
- A failed generation or rewrite must keep the current draft context visible.
- A successful rewrite already reflects saved output on disk; sync only reconciles the local renderer view.
- A failed layout load must not erase the current project workflow context.
- Scene metadata is review-only in Phase 11A; the UI should not imply live metadata editing.

## Recovery Behavior
- Every workflow step should have a retry or back-out path.
- Project switch should not leave the workflow spine in an impossible state.
- Reset layout should preserve the current project context while repairing the shell.

## Test Requirements
- Smoke coverage for the open/create -> select scene -> generate -> preview -> critique -> rewrite -> accept flow.
- Error-path coverage for each major workflow boundary.
- Parity between cold start and warm reload.

## Anti-Patterns
- Hidden workflow jumps.
- Implicit mutation without an explicit user action.
- Treating saved rewrite output as if it were still only an unpersisted candidate.
- Reusing one step to secretly perform another.
- Allowing layout or preview recovery to break the workflow contract.
