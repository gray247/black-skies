Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# GUI-P8-VERIFY-02 — Keyboard & Accessibility Walkthrough
**Status:** Scheduled – 2026-01-16  
**Owner:** Maintainer (solo)

This runbook validates keyboard-only workflows and accessibility affordances for DockWorkspace across the Writing and Feedback flows. It ensures the renamed panes, hotkeys, and focus states align with `docs/phases/phase8_gui_enhancements.md` and `docs/ui_copy_spec_v1.md`.

## Prerequisites
- Windows 11 accessibility rig with screen reader (Narrator or NVDA) and high-contrast mode available.
- Latest `phase8-docking` build with `ui.enable_docking=true`.
- External monitor connected to exercise floating windows.
- Fresh user profile (remove `%APPDATA%/BlackSkies/` to reset layouts and preferences).
- Accessibility tooling ready: Axe DevTools or Playwright axe suite (optional but recommended).

## Test Data Setup
1. Launch the Electron app and open **Esther Estate**.
2. Confirm DockWorkspace displays panes labeled `Outline`, `Writing view`, `Feedback notes`, `Timeline`, and `Story insights`.

## Verification Steps
1. **Keyboard navigation**
   - Use `Ctrl+Alt+]` and `Ctrl+Alt+[` to cycle forward/backward through panes.
   - Ensure the active pane shows focused styling and the screen reader announces the pane name (Outline, Writing view, etc.).
2. **Preset hotkeys**
   - Press `Ctrl+Alt+1` (default preset) and `Ctrl+Alt+2` (analysis preset) as configured.
   - Confirm the toast copy references the preset names and that docked panes update without mouse interaction.
3. **Floating window access**
   - Focus Writing view and press `Ctrl+Alt+Shift+F` (float). Navigate to the floating window using `Alt+Tab` then arrow keys; ensure screen reader announces “Writing view window”.
   - Use `Ctrl+Alt+Shift+D` (dock) to return it. Toast should read “Workspace restored.”.
4. **Feedback notes traversal**
   - Cycle focus to Feedback notes, expand comments with `Enter`, and verify arrow keys move between feedback items.
   - Confirm Timeline pane can be reached and that focus order loops back to Outline without trapping.
5. **Overlay toggle**
   - With keyboard only, open the Story insights menu (`Alt` to toolbar, arrow navigation). Toggle overlay and confirm focus returns to prior pane.
6. **Accessibility helpers**
   - Trigger hidden helper text (`Shift+F10`, open context menu) and listen for docking instructions.
   - Inspect ARIA roles via accessibility tree: pane titles have `role="tab"` and floating windows provide `aria-describedby` linking to helper text.
7. **Screen reader narration**
   - Drag focus between Outline and Writing view; confirm Narrator announces updated location using rebranded pane names.

## Expected Results & Evidence
- Accessibility log capturing focus order, hotkey functionality, and screen reader narration transcripts.
- Playwright axe report (optional) showing zero violations for DockWorkspace overlays.
- Notes on toast and tooltip text matched to UI spec terminology.

## Failure Handling
- Missing or incorrect announcement: capture screen reader transcript, note the expected label, and create a personal follow-up task.
- Hotkeys unresponsive: check `config/runtime.yaml::shortcuts` and renderer console (`Ctrl+Shift+I`) for binding errors.
- Overlay trapping focus: record screen share, collect renderer logs, and log the scenario in your tracker for fix-up.

## Sign-off
After running, update `docs/phases/phase8_gui_enhancements.md` with the actual run details and mark this runbook as completed in your personal tracker.
