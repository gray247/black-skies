# Black Skies - phase charter (v1.1)
**Status:** UNLOCKED - 2025-10-09  
**Purpose:** Extend the roadmap beyond P7 (RC1) into the P8-P11 expansion cycles.

_Status tracking lives in docs/roadmap.md; use this charter as the scope authority._

---

## Phase 7 - release candidate (unchanged)
Scope remains: finalize GUI + API parity, smoke tests, offline docs.  
**No new features introduced here.**

---

## Phase 8 - companion & critique expansion
**Goal:** Add AI-assisted creative utilities within existing panes.

### Key deliverables
- Inline **Companion Mode** overlay for contextual chat/critiques  
- **Batch Critique Mode** across multiple scenes  
- **Custom Rubric Editor** for user-defined critique categories  
- **AI Scene Rewrite Assistant** (multi-tone options)  
- **Soft/Hard Budget Meter UI** with live model-cost display  
- **Critique Export Bundle** (PDF/Markdown)  
- **Quick Restore Undo Toast** for History actions

### Done when
- Companion overlay, batch critique, rubric editor, budget meter, and quick restore toast ship with docking-aware UX.  
- Manual docking smoke + keyboard-only walkthroughs complete (docs/phase8_gui_enhancements.md).  
- Vitest + Playwright suites cover overlay/rubric flows; docs updated.

### Impacted docs
gui_layouts.md, exports.md, endpoints.md (add new routes later), phase_log.md

---

## Phase 9 - analytics & visualization
**Goal:** Introduce quantitative and visual story-analysis tools.

### Key deliverables
- **Emotion Arc Timeline** overlay  
- **Adaptive Pacing Graph** (scene-by-scene)  
- **Conflict Heatmap (Chapter View)**  
- **Scene Length Analyzer** (word and beat density)  
- **Revision Streak Tracker** (days active, word delta)  
- **Project Health Dashboard** (summary pane)  
- **Outline Validation Engine** (detect missing beats)  
- **Planning reference:** [Dashboard initiatives](./dashboard_initiatives.md) *(draft)*

### Done when
- Analytics service endpoints provide arc/pacing/conflict metrics with tests.  
- Dashboard surfaces health summaries with Playwright coverage; docs updated.  
- Outline validation engine integrated and reported in dashboard & tests.

### Impacted docs
gui_layouts.md, data_model.md, exports.md, rchitecture.md

---

## Phase 10 - accessibility & writer exports
**Goal:** Expand accessibility and professional output support.

### Key deliverables
- **Voice Notes / Dictation Recorder**  
- **Large-Font & High-Contrast Mode** toggle  
- **Dynamic Export Templates** (MD/DOCX/PDF layout selection)  
- **Corkboard Cards PDF** (finalize optional stub)  
- **Batch Outline Report** (all decisions + MD/PDF)  
- **Chapter/Scene Status Badges** (locked/rewrite/critique)  
- **Planning reference:** [Accessibility toggles](./accessibility_toggles.md)

### Done when
- Voice notes & contrast/large-font toggles ship with Axe coverage.  
- Export templates deliver MD/DOCX/PDF with diff tests; docs updated.  
- Accessibility audits for new surfaces pass WCAG AA.

### Impacted docs
exports.md, gui_layouts.md, policies.md

---

## Phase 11 - agents & plugins
**Goal:** Introduce controlled automation and third-party extensions.

### Key deliverables
- **Read-Only Agent Hooks** (Planner/Drafter/Critic)  
- **Plugin Registry Spec** + sandbox directory layout  
- **AI Safety Layer** (token sanitizer, privacy guard)  
- **Auto-Backup Verification Service**  
- **Multi-Project Dashboard** with recent list  
- **Smart Merge Tool** for safe scene/chapter merges  
- **Offline Mode Indicator** & cache manager  
- **Planning references:** [Backup verification daemon](./backup_verification_daemon.md), [Dashboard initiatives](./dashboard_initiatives.md), [Smart merge tool](./smart_merge_tool.md), [Offline cache manager](./offline_cache_manager.md)

### Done when
- Plugin registry, agent hooks, and safety layer integrate with contract tests.  
- Backup verification and offline cache tooling live with dashboard hooks.  
- Role-based review of plugin submissions documented; multi-project dashboard operational.

### Impacted docs
gents_and_services.md, rchitecture.md, gui_layouts.md, policies.md, phase_log.md

---

## Versioning
- v1.0 -> P7 RC build  
- v1.1 -> P8-P9 integration branch  
- v1.2 -> P10-P11 finalisation branch