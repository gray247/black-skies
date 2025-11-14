# GUI-P8-VERIFY-01 — DockWorkspace Smoke (Outline & Layout Persistence)
**Status:** Scheduled – 2026-01-15  
**Owner:** Maintainer (solo)

This runbook verifies DockWorkspace stability for Phase 8 across the Outline and shared layout surfaces. It confirms that the renamed Outline/Writing/Feedback panes, Story insights overlay, and layout persistence behave as documented in `docs/phase8_gui_enhancements.md`.

## Prerequisites
- Windows 11 test machine with multi-monitor setup (internal + external recommended).
- Latest `phase8-docking` build (portable ZIP ok) with `ui.enable_docking=true` in `config/runtime.yaml`.
- Sample project `sample_project/Esther_Estate` extracted locally.
- Clean runtime state: delete `%APPDATA%/BlackSkies/layout.json` and `%APPDATA%/BlackSkies/history/` before starting.

## Test Data Setup
1. Launch the Electron shell via `pnpm dev` or the packaged build.
2. Open **Esther Estate** from **Open Story**.
3. Wait for Outline data to load; confirm the Outline pane shows chapter cards.

## Verification Steps
1. **Baseline layout labels**
   - Confirm the DockWorkspace toolbar shows `Outline`, `Writing view`, `Feedback notes`, `Timeline`, `Story insights`, `Restore layout`, and `Default view`.
   - Hover each control to verify tooltips match `docs/ui_copy_spec_v1.md`.
2. **Outline pane drag & snap**
   - Drag the Outline pane to the right edge; expect snap targets to appear.
   - Drop into the right column. Writing view should relocate to the left, and pane headers retain the updated labels.
3. **Story insights overlay pinning**
   - Toggle Story insights from the toolbar menu; confirm it stays attached to the docked Outline pane.
4. **Floating Outline pane**
   - Double-click the Outline header to float it. Move the floating window to monitor 2, then click **Return to dock**.
   - Verify the pane re-docks left of Writing view without reverting labels.
5. **Layout persistence**
   - Arrange panes: Outline (left, width 30%), Writing view (center), Feedback notes (right), Timeline (bottom), Story insights floating.
   - Close the app. Reopen and reload the same story. Expect the layout to restore with Story insights floating in the same monitor bounds.
6. **Preset restore**
   - Click **Restore layout**. Outline should return to left column, Story insights reattach to DockWorkspace per preset, and floating windows close.
7. **Default view**
   - Click **Default view**. All panes return to the fixed preset (`Outline | Writing view | Feedback notes` with Timeline collapsed). Toast should read “Default view applied.”.

## Expected Results & Evidence
- Screenshots or screen recording showing drag-to-snap, floating Outline, preset restore, and default reset.
- `%APPDATA%/BlackSkies/layout.json` updated with `schema_version: 2` and `panes` entries for `outline`, `writing`, `feedback`, `timeline`, `insights`.
- QA notes capturing tooltip text confirmation and toast strings.

## Failure Handling
- If layout does not persist: capture `layout.json` and renderer logs (`%APPDATA%/BlackSkies/history/diagnostics/renderer.log`).
- If panes display legacy names (Wizard/Draft Board/Critique): verify the build uses the latest `ui_copy_spec_v1.md` strings and record the regression in your tracker.
- Dock manager crashes: export crash dump from `%APPDATA%/BlackSkies/crash/` and note reproduction steps.

## Sign-off
Upon successful completion, update the `Verification & QA` table in `docs/phase8_gui_enhancements.md` with the actual run date and archive notes in your personal tracker.
