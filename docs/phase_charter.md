# Black Skies – Phase Charter (v1.1)
**Status:** UNLOCKED – 2025-10-09  
**Purpose:** Extend the roadmap beyond P7 (RC1) into the P8–P11 expansion cycles.

_Status tracking lives in [docs/roadmap.md](./roadmap.md); use this charter as the scope authority._

---

## Glossary (aligned with [UI copy spec v1](./ui_copy_spec_v1.md))
| Term | Description |
| :--- | :---------- |
| Outline flow | The planning workflow that replaces the legacy "Wizard" terminology. |
| Writing flow | Draft creation experience formerly labelled "Generate." |
| Feedback flow | Review experience previously called "Critique." |
| Insights overlay | Contextual assistant surface that succeeded "Companion Mode." |
| Budget meter | Soft/Hard budget indicator rendered in Outline/Writing flows. |
| Feedback export bundle | Packaged PDF/Markdown bundle replacing "Critique export." |

---

## Core Flow (Shipping)
Project open → Wizard/Outline → Draft generation → Critique automation → Snapshots/Recovery → Exports.  
Each transition is backed by the corresponding endpoints (`/outline/build`, `/draft/generate`, `/draft/critique`, `/batch/critique`, `/history/*`, `/export/*`) and the renderer panes described in `docs/gui_layouts.md`. No voice input or backup daemon UX is present in this flow; the user navigates between the existing panes and uses the built-in Recovery/Export controls.

---

## Bookend 1 – Spark Pad
**Goal:** Establish an idea-capture overlay that can segue into Wizard/Outline and reduces friction for first-time launches.

### Key deliverables
- Spark Pad preset (Spark Pad left, Wizard center, Draft Board right, History bottom).
- First-run onboarding screen (see `docs/onboarding.md`) that guides users through Spark Pad + Wizard toggles.
- Automatic project discovery with project ID cached and surfaced in Settings > Project Info.

### Done when
- Spark Pad preset is selectable during first run and respected by keyboard shortcuts/hotkeys.
- Onboarding completes with the option to create a new project or open an existing folder without requiring manual project IDs.
- Telemetry for first-run flows recorded (per `docs/performance_telemetry_policy.md`).

### Impacted docs
[onboarding.md](./onboarding.md), [gui_layouts.md](./gui_layouts.md), [data_model.md](./data_model.md)

## Phase 7 – Release candidate (unchanged)
Scope remains: finalize GUI + API parity, smoke tests, offline docs.  
**No new features introduced here.**

---

## Phase 8 – Insights & feedback expansion
**Goal:** Add AI-assisted creative utilities within existing panes.

### Key deliverables
- Inline **Insights overlay** for contextual guidance and feedback  
- **Batch Feedback mode** across multiple scenes  
- **Feedback rubric editor** for user-defined categories  
- **Scene rewrite assistant** (multi-tone options)  
- **Soft/Hard budget meter UI** with live model-cost display  
- **Feedback export bundle** (PDF/Markdown)  
- **Quick restore toast** for History actions

### Done when
- Insights overlay, batch feedback, rubric editor, budget meter, and quick restore toast ship with docking-aware UX.  
- Manual docking smoke + keyboard-only walkthroughs complete ([docs/phase8_gui_enhancements.md](./phase8_gui_enhancements.md)).  
- Vitest + Playwright suites cover overlay/rubric flows; docs updated.

### Impacted docs
[gui_layouts.md](./gui_layouts.md), [exports.md](./exports.md), [endpoints.md](./endpoints.md) (new routes), [phase_log.md](./phase_log.md)

---

## Phase 9 – Analytics & Visualization
**Goal:** Introduce quantitative and visual story-analysis tools.

### Key deliverables
- **Emotion arc timeline** overlay  
- **Adaptive pacing graph** (scene-by-scene)  
- **Conflict heatmap** (chapter view)  
- **Scene length analyzer** (word and beat density)  
- **Revision streak tracker** (days active, word delta)  
- **Project health dashboard** (summary pane)  
- **Outline validation engine** (detect missing beats)  
- Planning reference: [Dashboard initiatives](./dashboard_initiatives.md) *(draft)*

### Done when
- Analytics service endpoints provide arc/pacing/conflict metrics with tests.  
- Dashboard surfaces health summaries with Playwright coverage; docs updated.  
- Outline validation engine integrated and reported in dashboard & tests.

### Impacted docs
[gui_layouts.md](./gui_layouts.md), [data_model.md](./data_model.md), [exports.md](./exports.md), [architecture.md](./architecture.md), [analytics_service_spec.md](./analytics_service_spec.md)

---

## Phase 10 – Accessibility & professional exports
**Goal:** Expand accessibility and professional output support.

### Key deliverables
- **Large-font & high-contrast mode** toggles  
- **Dynamic export templates** (MD/DOCX/PDF layout selection)  
- **Corkboard cards PDF** (finalise optional stub)  
- **Batch outline report** (decisions + MD/PDF)  
- **Chapter/scene status badges** (locked/rewrite/feedback)  
- Planning reference: [Accessibility toggles](./accessibility_toggles.md)
- **Large-font & high-contrast mode** toggles  
- **Dynamic export templates** (MD/DOCX/PDF layout selection)  
- **Corkboard cards PDF** (finalise optional stub)  
- **Batch outline report** (decisions + MD/PDF)  
- **Chapter/scene status badges** (locked/rewrite/feedback)  
- Planning reference: [Accessibility toggles](./accessibility_toggles.md)

### Future work (Not yet implemented)
- Voice notes / dictation recorder (planned for a future release; no recorder/transcription UI or endpoints ship today).

### Done when
- Voice notes & accessibility toggles ship with Axe coverage.  
- Export templates deliver MD/DOCX/PDF with diff tests; docs updated.  
- Accessibility audits for new surfaces pass WCAG AA.

### Impacted docs
[exports.md](./exports.md), [gui_layouts.md](./gui_layouts.md), [policies.md](./policies.md), [phase_log.md](./phase_log.md)

---

## Phase 11 – Agents & plugins
**Goal:** Introduce controlled automation and third-party extensions.

### Key deliverables
- **Read-only agent hooks** (Planner/Writing/Feedback roles)  
- **Plugin registry spec** + sandbox directory layout  
- **Safety layer** (token sanitizer, privacy guard)  
- **Auto-backup verification service**  
- **Multi-project dashboard** with recent list  
- **Smart merge tool** for safe scene/chapter merges  
- **Offline mode indicator** & cache manager  
- Planning references: [Backup verification daemon](./backup_verification_daemon.md), [Dashboard initiatives](./dashboard_initiatives.md), [Smart merge tool](./smart_merge_tool.md), [Offline cache manager](./offline_cache_manager.md)

### Done when
- Plugin registry, agent hooks, and safety layer integrate with contract tests.  
- Backup verification and offline cache tooling ship with dashboard hooks.  
- Role-based review of plugin submissions documented; multi-project dashboard operational.

### Impacted docs
[agents_and_services.md](./agents_and_services.md), [architecture.md](./architecture.md), [gui_layouts.md](./gui_layouts.md), [policies.md](./policies.md), [phase_log.md](./phase_log.md), [backup_and_migration.md](./backup_and_migration.md)

---

## Bookend 2 – Visuals & Analytics Layer
**Goal:** Surface emotion/pacing heatmaps, critique trendlines, and relationship graphs powered by the analytics service (`docs/analytics_service_spec.md`).

### Key deliverables
- Visuals Layer preset (Visuals left, Draft Board center, Critique/History right).
- Coverage heatmap, Critique trendline, and Relationship graph powered by cached analytics JSON files.
- Analytics endpoints (`/api/v1/analytics/*`) that support the Visuals Layer plus automation tests (`docs/phase9_11_testplan.md`).

### Done when
- Visuals Layer renders heatmaps/trendlines reliably; clicking data points jumps to the correct scene and filters notes/threads.
- Analytics service outputs match the spec and is consumed by Visuals Layer components.
- Bookend 2 preset ties into the automatic onboarding path once Phase 9–11 autosave/recovery/export flows are stable.

### Impacted docs
[analytics_service_spec.md](./analytics_service_spec.md), [phase9_11_testplan.md](./phase9_11_testplan.md), [gui_layouts.md](./gui_layouts.md)

## Theming & Visual Overhaul
**Goal:** Rework visual treatment via new tokens/themes and preset tweaks without rewriting the core layout (see `docs/gui_theming.md`).

### Key deliverables
- Theme tokens + defaults plus experimental palettes (dark horror, minimal, etc.).
- Accessibility-aware theme overrides and high-contrast compatibility.
- GUI overhaul executed via new presets/theme pairings instead of a new architecture.

### Done when
- Theme selection merge flows through `docs/settings.md` and persists per-project/global.
- Visual overhaul uses Spark Pad/Visuals presets plus new theme tokens; layout remains intact.

### Impacted docs
[gui_theming.md](./gui_theming.md), [settings.md](./settings.md), [gui_layouts.md](./gui_layouts.md)

## Packaging & Distribution
**Goal:** Ship a polished installer experience once automation, recovery, exports, and Bookends 1/2 are stable.

### Key deliverables
- Windows installer/portable produced via `docs/packaging.md`, writing to `%LOCALAPPDATA%\BlackSkies`, with shortcuts + uninstall metadata.
- First-run welcome screen and Spark Pad wizard integration.
- Project ID context saved so reinstallations reuse the existing setup (unless user chooses otherwise).

### Impacted docs
[packaging.md](./packaging.md), [phase_log.md](./phase_log.md), [policies.md](./policies.md)

## Versioning
- v1.0 → P7 RC build  
- v1.1 → P8–P9 integration branch  
- v1.2 → P10–P11 finalisation branch

---

## Future Work (Not yet implemented)
- **Voice Input / Notes:** The planned recorder/transcription workflow continues to be scoped in `docs/voice_notes_transcription.md` but has no shipping UI or services in v1.1.
- **Backup Daemon UX:** Backup verification runs via scripts/services only; the daemon/dashboard experience is pending implementation.
- **Experimental GUI Layouts:** Docking, floating panels, Visuals Layer presets, and Story insights floaters remain experimental flags and are not available in production; they appear here to remind teams they are future enhancements.
