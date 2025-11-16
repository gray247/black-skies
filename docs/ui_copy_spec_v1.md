Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# Black Skies writer UI copy spec v1

This document defines approved UI text, tooltips, toasts, dialogs, and inline hints. Tone: calm, writer-first, professional (no emojis or exclamation marks).

---

## Top bar and header

| Location | Text |
| :-- | :-- |
| Main title | Your Story |
| Subtitle (prefix) | Working on: {StoryTitle} |
| Status pill | Checking writing tools / Ready / Writing tools offline |
| Companion button | Companion |
| Generate button | Generate |
| Critique button | Critique |

### Tooltips

- View connection status for the writing tools.
- Open the companion panel for scene insights and pacing feedback.
- Generate a new draft or continue the current scene.
- Request feedback on the current scene.

---

## Dock workspace

| Element | Text |
| :-- | :-- |
| Wizard pane | Outline |
| Draft board | Writing view |
| Critique results | Feedback notes |
| History pane | Timeline |
| Analytics pane | Story insights |
| Apply preset button | Restore layout |
| Reset layout button | Default view |
| Restoring layout banner | Rebuilding your workspace... |
| Hidden panes zero state | No panels open. Restore your workspace layout. |
| No project state | Open a story to start writing. |

### Tooltips and controls

- Expand this pane.
- Close this pane.
- Open this pane in a separate window.
- Focus this pane.
- Restore your saved layout preset.
- Return to the default layout.
- Plan chapters, scenes, and beats.
- Write and edit your scene text.
- Review feedback and suggested revisions.
- View previous versions and snapshots.
- See pacing and emotion data.

---

## Companion panel

| Element | Text |
| :-- | :-- |
| Header title | Companion |
| Subheader | Guidance and pacing feedback for your current scene. |
| Scene insights heading | Scene insights |
| Rubric heading | Focus points |
| Batch critique heading | Scene reviews |
| Run batch button | Review selected scenes |
| Empty state | Select a scene to view pacing and feedback recommendations. |

### Buttons and tooltips

- Close the companion panel.
- Add a new focus point.
- Restore default focus points.
- Add this focus point.
- Remove this focus point.
- Select all scenes for review.
- Clear the current selection.
- Review selected scenes.
- Include this scene in the batch review.
- View emotional progression across scenes.
- View pacing and word-count metrics.

---

## Footer and system panels

| Element | Text |
| :-- | :-- |
| Status message | All changes saved. |
| Debug event log | Activity log |
| Recovery entry | Backups |
| Troubleshooting snapshot | Story snapshot |

---

## Toast notifications

| Category | Text |
| :-- | :-- |
| Workspace | Workspace restored. / Default view applied. / Couldn't load saved layout. |
| Story | Story loaded. / Story closed. |
| Writing | New draft written. / Draft updated. / Couldn't write draft. |
| Feedback | Feedback ready. / Feedback unavailable. / Revision accepted. / Revision undone. |
| Batch review | All selected scenes reviewed. / Some scenes failed to review. |
| Insights | Scene insights updated. / No emotion tags yet. / Add a few lines to unlock pacing insights. |
| Snapshots or exports | Snapshot created. / Restored earlier version. / Story exported. / Export incomplete. |
| Connection | Connecting... / Ready. / Writing tools offline. / Back online. |
| General errors | Something went wrong. / Permission needed. / Couldn't reach story files. |

---

## Dialogs and confirmations

| Context | Text |
| :-- | :-- |
| Reset layout | Reset workspace layout? Restores your panels to the default view. |
| Apply preset | Apply this layout preset? Your current arrangement will be replaced. |
| Close story | Close this story? Unsaved changes will be saved automatically. |
| Remove story | Remove this story from your library? Files remain on your drive. |
| Replace draft | Replace current draft? Previous version saved in Timeline. |
| Discard edits | Discard unsaved edits? Cannot be undone. |
| Rerun feedback | Run feedback again? Previous notes will be replaced. |
| Batch review | Review multiple scenes? Each scene is analysed separately. |
| Select focus | Select focus points before running feedback. |
| Restore snapshot | Restore this version? Current text will be replaced. |
| Delete snapshot | Remove this version? Permanently deletes the snapshot. |
| Export | Export story files? Creates Markdown and JSON copies. |
| Reset preferences | Reset preferences to default? Display and editor settings restored. |
| Exit app | Exit Black Skies? All work will be saved automatically. |
| Clear log | Clear the activity log? Removes all recorded events. |

### Standard button labels

Confirm / Cancel / Close / Try again / Remove / Save changes

---

## Inline empty states and hints

| Area | Text |
| :-- | :-- |
| Outline pane | Start your outline here. Add chapters or scenes as cards. |
| Writing view | Your story starts here. Type or import text to begin. |
| Feedback notes | No feedback yet. Click Critique to get suggestions. |
| Timeline | Snapshots appear here as you write and save. |
| Insights panel | Select a scene to see pacing and emotion insights. |
| Activity log | No events recorded yet. Actions will appear here. |

---

## Settings and preferences tooltips

| Control | Text |
| :-- | :-- |
| Theme selector | Switch between light and dark themes. |
| Font size slider | Adjust editor text size. |
| Autosave toggle | Save changes automatically while you write. |
| AI model selector | Choose a writing model or service. |
| Connection retry | Retry connecting to the writing service. |
| Reset preferences | Restore default preferences. |

---

## Keyboard and interaction hints

| Action | Hint |
| :-- | :-- |
| Drag pane border | Drag to resize panels. |
| Double-click title bar | Double-click to toggle full size. |
| Keyboard shortcuts | Press Ctrl + Alt + [ / ] to switch panels. |
| Undo | Revert last change. |
| Redo | Repeat last change. |
| Scroll or zoom charts | Scroll to zoom or pan. |

---

## Tone and voice summary

| Principle | Description |
| :-- | :-- |
| Voice | Calm, supportive, professional. |
| Sentence structure | Short, active voice, verb + object phrasing. |
| Vocabulary | Prefer story, scene, draft, feedback, insight, timeline, snapshot. |
| Avoid | Avoid console or service jargon; favour writer-first language. |
| Punctuation | No exclamation marks, no emojis. |
| Error style | Focus on recovery (for example, "Returning to default view.", "Work saved locally."). |
| Consistency | Maintain plain-English capitalisation across all UI. |
