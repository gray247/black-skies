Status: Active (Canonical)
Version: 1.0.1
Last Reviewed: 2026-03-16

# Black Skies – Phase Charter (v1.1)

Purpose: Extend the roadmap beyond P7 (RC1) into the P8–P11 expansion cycles.
Source of Truth: This charter defines the phase sequence, scope, and gating for v1.1; reference it before aligning other phase materials.

Status tracking lives in [docs/roadmap.md](../roadmap.md); use this charter as the scope authority.

Canonical Links:
- `docs/BUILD_PLAN.md`
- `docs/specs/architecture.md`
- `docs/specs/data_model.md`
- `docs/specs/endpoints.md`
- `docs/specs/rescue_pipeline_architecture.md`
- `docs/gui/gui_layouts.md`
- `docs/specs/analytics_service_spec.md`
- `docs/specs/agents_and_services.md`
- `docs/CHANGELOG.md`
- `docs/version_manifest.json`

---

## Glossary (aligned with [UI copy spec v1](../ui_copy_spec_v1.md))
| Term | Description |
| :--- | :---------- |
| Outline flow | The planning workflow that replaces the legacy "Wizard" terminology. |
| Writing flow | Draft creation experience formerly labelled "Generate." |
| Feedback flow | Review experience previously called "Critique." |
| Insights overlay | Contextual assistant surface that succeeded "Insights Overlay." |
| Budget meter | Soft/Hard budget indicator rendered in Outline/Writing flows. |
| Feedback export bundle | Packaged PDF/Markdown bundle replacing "Critique export." |

---

## Core Flow (Shipping)
Project open → Wizard/Outline → Draft generation → Critique automation → Snapshots/Recovery → Exports.  
Each transition is backed by the corresponding endpoints (`/outline/build`, `/draft/generate`, `/draft/critique`, `/batch/critique`, `/history/*`, `/export/*`) and the renderer panes described in `docs/gui/gui_layouts.md`. No voice input or backup daemon UX is present in this flow; the user navigates between the existing panes and uses the built-in Recovery/Export controls.

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
- Telemetry for first-run flows recorded (per `docs/specs/performance_telemetry_policy.md`).

### Impacted docs
[onboarding.md](../onboarding.md), [gui_layouts.md](../gui/gui_layouts.md), [data_model.md](../specs/data_model.md)

## Phase 7 – Release candidate (unchanged)
Scope remains: finalize GUI + API parity, smoke tests, offline docs.  
**No new features introduced here.**

---

## Phase 8 – Insights & feedback expansion
**Goal:** Add AI-assisted creative utilities within existing panes.

**Sequencing note:** UI polish (docking persistence, accessibility sign-off) remains important, but core writing-engine milestones may proceed in parallel. UI polish is not treated as a hard blocker for backend engine progress.

**Engine closeout status (2026-03-17):** long-form rescue-plumbing / reliability-control is closed. The closeout fixed deterministic rescue-path failures including slot binding and alias handling, stale-target handling, specificity followthrough credit, and repair-only sentence-slot collapse. See [docs/runbooks/long_form_rescue_phase_exit.md](../runbooks/long_form_rescue_phase_exit.md).

**Current backend phase:** Outline-Faithful Editorial Reliability. This phase addresses generation-side variance inside rewrite and rescue generation after rescue-plumbing closeout. The operating principle remains constrained assistance: the model trails the outline, preserves scene intent, character facts, and rough length band, and does not act as an autonomous co-author during rewrite.

**Current rescue architecture:** see [docs/specs/rescue_pipeline_architecture.md](../specs/rescue_pipeline_architecture.md). The active model is controlled escalation: `generation -> detection -> slot_patch -> validation -> local_rewrite_block -> validation`, with `slot_patch` as the primary local repair and `local_rewrite_block` as bounded escalation only after a classified validation miss.

**Transition note:** rescue plumbing is closed because the replay regression pack stayed green, adversarial remained healthy, and the remaining clean misses were artifact-confirmed as generation-side classes (`dialogue_grounding_unresolved`, `patch_dialogue_grounding_unresolved`, `patch_specificity_unresolved`) rather than deterministic rescue-path regressions.

**Phase definition:** this phase is about editorial quality stability, not rescue-path wiring. It covers prompt/model strategy, slot-level quality shaping, and outline-faithful rewrite behavior. It does not reopen slot binding, stale-target handling, followthrough-credit plumbing, or other bounded-slot transport bugs unless a new artifact proves a deterministic regression.

**Phase success criteria:**
- rescue/edit quality becomes stable enough that remaining clean misses are clearly rarer than the post-plumbing baseline
- outline-faithful behavior remains intact: no subject drift, no invented story events, no wild local or scene-level length drift
- adversarial healthy-path behavior remains intact
- replay fixtures for prior plumbing bugs remain green while live misses trend toward generation-side quality only
- acceptable remaining misses are rare generation-side classes such as dialogue grounding or specificity underreach; deterministic rescue-path regressions are not acceptable

**Ranked workstreams:**
1. **Dialogue-grounding rescue quality** - improve local rescue edits for floating dialogue beats without broadening scope or drifting scene intent. This matters because `patch_dialogue_grounding_unresolved` remained the most persistent clean rescue class even after the rescue-model switch to `gpt-5.4-mini`.
2. **Specificity rescue quality** - improve literal concrete lift inside bounded rescue slots for vague/metaphorical lines. This matters because `patch_specificity_unresolved` remains a secondary clean limiter, even though it dropped under `gpt-5.4-mini`.
3. **Generation-variance measurement and slot-level quality shaping** - continue using replay fixtures plus bounded live samples to distinguish model-quality misses from regressions. This matters because the remaining variance is stochastic and needs repeated measurement rather than more rescue-plumbing work.

**Current rescue default:** `gpt-5.4-mini` is now the default bounded rescue model. The repaired bakeoff showed clean `4/10` versus `2/10` for `gpt-4o-mini`, with adversarial steady at `5/5`.

**Current stable editorial baseline:** rescue model `gpt-5.4-mini`, rescue strategy `slot_patch`, bounded clean sample `6/10`, adversarial `5/5`.

**Recent rescue-generation branches not adopted:** dialogue anchor-term enforcement, specificity literal slot-patch tightening, hybrid escalation, scene-state-assisted rescue, and structured rescue generation. These branches either tied the stable baseline or made clean reliability worse.

**Next decision point:** see [docs/runbooks/editorial_reliability_decision_record_20260318.md](../runbooks/editorial_reliability_decision_record_20260318.md). The project now has two explicit options:
- hold the stable editorial baseline and move remaining misses to writer/product-level handling
- or run one final higher-capability rescue comparison as a bounded last model-capability check

**Recommended next step:** hold the stable baseline unless there is a strong product reason to spend one more bounded comparison on rescue model capability.

**Writer-facing handling milestone:** expose unresolved generation-side rescue misses as reviewable editorial flags with a minimal human workflow. The first pass is backend-first: surface failure class, explanation, targeted lines, and scaffolded actions so the editor can accept current text, request a local repair retry, mark for manual rewrite, or inspect why the scene was flagged.

**Carryover protection principle:** editorial review flagging and carryover approval are separate decisions. A chunk may be usable enough to keep in the manuscript while still being unsafe to feed future continuity in full. The backend therefore tracks carryover risk independently of review status using `carryover_mode`:
- `safe`
- `restricted`
- `blocked_pending_review`

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
- Manual docking smoke + keyboard-only walkthroughs complete ([docs/phases/phase8_gui_enhancements.md](./phase8_gui_enhancements.md)).  
- Vitest + Playwright suites cover overlay/rubric flows; docs updated.

### Impacted docs
[gui_layouts.md](../gui/gui_layouts.md), [exports.md](../gui/exports.md), [endpoints.md](../specs/endpoints.md) (new routes), [phase_log.md](./phase_log.md)

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
[gui_layouts.md](../gui/gui_layouts.md), [data_model.md](../specs/data_model.md), [exports.md](../gui/exports.md), [architecture.md](../specs/architecture.md), [analytics_service_spec.md](../specs/analytics_service_spec.md)

---

## Phase 10 – Accessibility & professional exports
**Goal:** Expand accessibility and professional output support.

### Key deliverables
- **Large-font & high-contrast mode** toggles  
- **Dynamic export templates** (MD/DOCX/PDF layout selection)  
- **Corkboard cards PDF** (finalise optional stub)  
- **Batch outline report** (decisions + MD/PDF)  
- **Chapter/scene status badges** (locked/rewrite/feedback)  
- Planning reference: [Accessibility toggles](../gui/accessibility_toggles.md)

### Future work (Not yet implemented)
- Voice notes / dictation recorder (planned for a future release; no recorder/transcription UI or endpoints ship today).

### Done when
- Voice notes & accessibility toggles ship with Axe coverage.  
- Export templates deliver MD/DOCX/PDF with diff tests; docs updated.  
- Accessibility audits for new surfaces pass WCAG AA.

### Impacted docs
[exports.md](../gui/exports.md), [gui_layouts.md](../gui/gui_layouts.md), [policies.md](../policies.md), [phase_log.md](./phase_log.md)

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
- Planning references: [Backup verification daemon](../specs/backup_verification_daemon.md), [Dashboard initiatives](./dashboard_initiatives.md), [Smart merge tool](../deferred/smart_merge_tool.md), [Offline cache manager](../offline_cache_manager.md)

### Done when
- Plugin registry, agent hooks, and safety layer integrate with contract tests.  
- Backup verification and offline cache tooling ship with dashboard hooks.  
- Role-based review of plugin submissions documented; multi-project dashboard operational.

**Sequencing note:** agent hooks remain deferred until long-form reliability/control is closed and the outline-faithful editorial-partner phase is stable.

### Impacted docs
[agents_and_services.md](../specs/agents_and_services.md), [architecture.md](../specs/architecture.md), [gui_layouts.md](../gui/gui_layouts.md), [policies.md](../policies.md), [phase_log.md](./phase_log.md), [backup_and_migration.md](../backup_and_migration.md)

---

## Bookend 2 – Visuals & Analytics Layer
**Goal:** Surface emotion/pacing heatmaps, critique trendlines, and relationship graphs powered by the analytics service (`docs/specs/analytics_service_spec.md`).

### Key deliverables
- Visuals Layer preset (Visuals left, Draft Board center, Critique/History right).
- Coverage heatmap, Critique trendline, and Relationship graph powered by cached analytics JSON files.
- Analytics endpoints (`/api/v1/analytics/*`) that support the Visuals Layer plus automation tests (`docs/phases/phase9_11_testplan.md`).

### Done when
- Visuals Layer renders heatmaps/trendlines reliably; clicking data points jumps to the correct scene and filters notes/threads.
- Analytics service outputs match the spec and is consumed by Visuals Layer components.
- Bookend 2 preset ties into the automatic onboarding path once Phase 9–11 autosave/recovery/export flows are stable.

### Impacted docs
[analytics_service_spec.md](../specs/analytics_service_spec.md), [phase9_11_testplan.md](./phase9_11_testplan.md), [gui_layouts.md](../gui/gui_layouts.md)

## Theming & Visual Overhaul
**Goal:** Rework visual treatment via new tokens/themes and preset tweaks without rewriting the core layout (see `docs/gui/gui_theming.md`).

### Key deliverables
- Theme tokens + defaults plus experimental palettes (dark horror, minimal, etc.).
- Accessibility-aware theme overrides and high-contrast compatibility.
- GUI overhaul executed via new presets/theme pairings instead of a new architecture.

### Done when
- Theme selection merge flows through `docs/settings.md` and persists per-project/global.
- Visual overhaul uses Spark Pad/Visuals presets plus new theme tokens; layout remains intact.

### Impacted docs
[gui_theming.md](../gui/gui_theming.md), [settings.md](../settings.md), [gui_layouts.md](../gui/gui_layouts.md)

## Packaging & Distribution
**Goal:** Ship a polished installer experience once automation, recovery, exports, and Bookends 1/2 are stable.

### Key deliverables
- Windows installer/portable produced via `docs/packaging.md`, writing to `%LOCALAPPDATA%\BlackSkies`, with shortcuts + uninstall metadata.
- First-run welcome screen and Spark Pad wizard integration.
- Project ID context saved so reinstallations reuse the existing setup (unless user chooses otherwise).

### Impacted docs
[packaging.md](../packaging.md), [phase_log.md](./phase_log.md), [policies.md](../policies.md)

## Versioning
- v1.0 → P7 RC build  
- v1.1 → P8–P9 integration branch  
- v1.2 → P10–P11 finalisation branch

---

## Done When
- Phase 8 docking, Insights overlay persistence, and budget meter polish ship per this charter and `docs/gui/gui_layouts.md`.
- Phase 9 analytics dashboards + Companion automation run on the analytics service defined in `docs/specs/analytics_service_spec.md`.
- Phase 10 accessibility toggles + exports honor the themes and templates defined in `docs/gui/accessibility_toggles.md` and `docs/gui/exports.md`.
- Phase 11 agent/plugin/backups integrate `docs/specs/agents_and_services.md`, `docs/specs/plugin_sandbox.md`, and `docs/specs/backup_verification_daemon.md`.

## Future Work (Not yet implemented)
- **Voice Input / Notes:** The planned recorder/transcription workflow continues to be scoped in `docs/deferred/voice_notes_transcription.md` but has no shipping UI or services in v1.1.
- **Backup Daemon UX:** Backup verification runs via scripts/services only; the daemon/dashboard experience is pending implementation.
- **Experimental GUI Layouts:** Docking, floating panels, Visuals Layer presets, and Story insights floaters remain experimental flags and are not available in production; they appear here to remind teams they are future enhancements.
