Status: Draft
Version: 1.0
Last Reviewed: 2025-11-05

# docs/gui/gui_theming.md — DRAFT

## Purpose
Separate layout (see `docs/gui/gui_layouts.md`) from theming so visual treatments can evolve without disrupting pane placement or keyboard navigation.

## Theme Structure
- **Design tokens:** colors, radii, shadows, spacing, typography scales, motion timing, and icon color palettes.
- **Token layers:** base palette (default color + accent), syntax palette (text, links, headings), surface palette (panes + overlays), and interaction states (hover, focus, disabled).
- **Theme manifests:** `[theme_id].json` includes `label`, `version`, `status` (`locked`/`experimental`), `supports_high_contrast`, and `token_overrides`.

## Themes
- **Default (locked baseline):** the current ship theme; preserves existing colors, fonts, and spacing.
- **Experimental themes:** e.g., “Dark Horror,” “Minimal Contrast,” or “Visuals Layer” variations. Allowed behind flags but must not break layout/pane arrangement or degrade accessibility.
- **Theme guards:** experimental themes must declare whether they allow `Spark Pad`/`Visuals Layer` presets; mismatched combos are disabled by default.

## Constraints
- Themes must leave pane layout untouched; no theme changes should reposition Outline/Writing/Feedback columns (those remain defined in `docs/gui/gui_layouts.md`).
- Core UI contrast & focus outlines must stay within WCAG guidelines (contrast ratios ≥ 4.5:1 for text, visible focus rings).
- Keyboard navigation, hotkeys, and focus management remain unchanged regardless of theme selection.
- Experimental themes must declare feature flags to prevent accidental exposure (e.g., `ui.theme.experimental_visuals`).

## Configuration
- Theme choice is stored globally in `~/.black-skies/config.json` (see `docs/settings.md`) and optionally per-project in `project-root/settings.json` when teams need overrides.
- Themes interact with accessibility toggles (large font, high contrast). A theme may provide `high_contrast_overrides` that respect the global accessibility preference.
- Per-project theme selection falls back to the global theme when unspecified; the renderer merges token overrides deeply (`base -> global -> project -> workspace`).

## Accessibility & GUI Overhaul Relationship
- Accessibility toggles (large font/high contrast) combine with theme tokens to keep readability/performance steady.
- The “GUI overhaul” (future presets like Spark Pad or Visuals Layer) is realized by composing new layouts/presets in `docs/gui/gui_layouts.md` plus these theme changes rather than rewriting the whole architecture.
- Theme evolution should always reference this doc so new palettes stay compatible with the enforced layout constraints and accessibility expectations.
