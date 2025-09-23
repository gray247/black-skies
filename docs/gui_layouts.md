# docs/gui_layouts.md — Black Skies (Source of truth)
**Status:** LOCKED · 2025-09-15  
Covers: dock presets, pane roles, hotkeys & interaction rules.
Does NOT cover: onboarding content (see Decision Checklist), API details (`docs/endpoints.md`).

## Default Dock Preset (LOCKED)
Wizard (left) | Draft Board (center) | Critique (right) | History (bottom)

## Pane Responsibilities (LOCKED)
- Wizard → Decision Checklist with Suggest/Accept/Lock
- Draft Board → scenes/chapters, editor, diff toggle, purpose & pacing fields
- Critique → rubric tabs + inline suggestions with accept/rollback
- History → snapshots (Accept/Lock + daily), quick restore

## Hotkeys (LOCKED)
Global: Ctrl/Cmd+J (Suggest), Ctrl/Cmd+; (Accept), Ctrl/Cmd+L (Lock), Ctrl/Cmd+→/← (Next/Prev scene), Ctrl/Cmd+D (Diff), Ctrl/Cmd+Shift+C (Companion)
Draft Board: Enter/Esc edit, Ctrl/Cmd+Shift+Enter apply, Alt+↑/↓ move scene (order only)
Critique Pane: A accept, R rollback, T cycle rubric
Safety: confirm destructive; show Undo toast; auto-focus nearest control
