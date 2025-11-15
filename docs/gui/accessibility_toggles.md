# Accessibility Toggles – Implementation Plan (Phase 10)
> **Status:** In progress (T-9146) · 2025-10-07
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Owner:** Desktop UX Team
> **Charter Reference:** docs/phases/phase_charter.md §52, docs/gui/gui_layouts.md (Hotkeys section)

## Objective
Deliver large-font and high-contrast modes with keyboard toggles and persistent settings, fulfilling Phase 10 accessibility commitments.

## Requirements
- **Large-font mode:** scales base font size (1.25×) across renderer; persists per profile.
- **High-contrast mode:** swaps to WCAG AA-compliant palette, affects main/renderer/dock panes.
- **Hotkeys:** `Ctrl/Cmd+Alt+F` (large-font), `Ctrl/Cmd+Alt+H` (high-contrast) as documented.
- **Settings UI:** toggles in Preferences dialog with preview.
- **Persistence:** store in `settings.json` (app data) + sync to renderer on launch.
- **Announcements:** screen reader-friendly notifications when toggles change.

## Task Breakdown
1. **Settings model:** extend shared settings schema + IPC messaging (Phase 10.0).
2. **Renderer theming:** implement CSS variables + `prefers-color-scheme` fallback (Phase 10.1).
3. **Hotkey handling:** reuse global shortcut infrastructure; ensure conflict resolution (Phase 10.2).
4. **Dock integration:** ensure docked panes inherit theme/size adjustments (Phase 10.3).
5. **Persistence:** write to disk, hydrate on preload, update menu state (Phase 10.4).
6. **Testing:** unit tests for settings store, accessibility audit via Playwright/lighthouse (Phase 10.5).
7. **Docs:** update `docs/gui/gui_layouts.md`, support playbook, release checklist (Phase 10.6).

## Risks
- Theme overrides clashing with existing custom CSS (dock components) → ensure variable mapping.
- Performance hit when toggling (avoid full reload; use CSS classes).

## Dependencies
- Docking feature to propagate theme values.
- Settings/preferences UI (baseline in place from Phase 8).
