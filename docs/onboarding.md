# docs/onboarding.md — DRAFT

## Purpose
Describe first-run and returning-user flows that connect Bookend 1 (Spark Pad) and Bookend 2 (Visuals Layer) to the core UI.

## First Run Flow
- When no project is open, show a welcome screen that explains Spark Pad + Wizard presets and invites the user to create a new project or open an existing folder.
- The welcome screen defaults to the Spark Pad preset (Spark Pad pane left, Wizard center, Draft Board right, History bottom) and offers a Quick Start button that loads Bookend 1.
- Provide a “Try Visuals Layer” link that previews Bookend 2 (Visuals left, Draft Board center, Critique/History right) without forcing a switch; hitting the link toggles the layout once the user enters the project.
- Once the user selects an option, remember their preference for future launches (persisted via `settings.json`).

## Returning User Flow
- The home screen lists “Recent Projects” with their folder, project name, and last open timestamp.
- A “Reopen Last Project” tile immediately launches the previously active project (restoring layout, caret positions, and story state).
- Expose a “Project Info” panel (see `docs/gui_layouts.md`) that shows project_id, schema version, folder path, and runtime flags for diagnostics.

## Bookend Presentation
- Bookend 1 (Spark Pad) and Bookend 2 (Visuals Layer) exist as preset combos inside Settings > Layout Presets; users may switch between them at any time.
- Bookend 1 sets the stage for Spark Pad + Wizard; Bookend 2 surfaces Visuals + Critique. Theme choice (`docs/gui_theming.md`) and accessibility toggles apply equally to both.

## Notes
- The onboarding flow respects `docs/settings.md` AI mode selection—the Model Router only activates API calls after the user consents via the settings panel.
