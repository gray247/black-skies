# Black Skies — Phase Charter (v1.1)
**Status:** UNLOCKED · 2025-10-09  
**Purpose:** Extend roadmap beyond P7 (RC1) into P8-P11 expansion cycles.

---

## Phase 7 — Release Candidate (unchanged)
Scope remains: finalize GUI↔API parity, smoke tests, offline docs.  
**No new features introduced here.**

---

## Phase 8 — Companion & Critique Expansion
**Goal:** Add AI-assisted creative utilities within existing panes.

### Key Deliverables
- Inline **Companion Mode** overlay for contextual chat/critiques  
- **Batch Critique Mode** across multiple scenes  
- **Custom Rubric Editor** for user-defined critique categories  
- **AI Scene Rewrite Assistant** (multi-tone options)  
- **Soft/Hard Budget Meter UI** with live model-cost display  
- **Critique Export Bundle** (PDF/Markdown)  
- **Quick Restore Undo Toast** for History actions

### Impacted Docs
`gui_layouts.md`, `exports.md`, `endpoints.md` (add new routes later), `phase_log.md`

---

## Phase 9 — Analytics & Visualization
**Goal:** Introduce quantitative and visual story-analysis tools.

### Key Deliverables
- **Emotion Arc Timeline** overlay  
- **Adaptive Pacing Graph** (scene-by-scene)  
- **Conflict Heatmap (Chapter View)**  
- **Scene Length Analyzer** (word and beat density)  
- **Revision Streak Tracker** (days active, word delta)  
- **Project Health Dashboard** (summary pane)  
- **Outline Validation Engine** (detect missing beats)

### Impacted Docs
`gui_layouts.md`, `data_model.md`, `exports.md`, `architecture.md`

---

## Phase 10 — Accessibility & Writer Exports
**Goal:** Expand accessibility and professional output support.

### Key Deliverables
- **Voice Notes / Dictation Recorder**  
- **Large-Font & High-Contrast Mode** toggle  
- **Dynamic Export Templates** (MD/DOCX/PDF layout selection)  
- **Corkboard Cards PDF** (finalize optional stub)  
- **Batch Outline Report** (all decisions → MD/PDF)  
- **Chapter/Scene Status Badges** (locked/rewrite/critique)

### Impacted Docs
`exports.md`, `gui_layouts.md`, `policies.md` (back-up policy note)

---

## Phase 11 — Agents & Plugins
**Goal:** Introduce controlled automation and third-party extensions.

### Key Deliverables
- **Read-Only Agent Hooks** (Planner/Drafter/Critic)  
- **Plugin Registry Spec** + sandbox directory layout  
- **AI Safety Layer** (token sanitizer, privacy guard)  
- **Auto-Backup Verification Service**  
- **Multi-Project Dashboard** with recent list  
- **Smart Merge Tool** for safe scene/chapter merges  
- **Offline Mode Indicator** & cache manager

### Impacted Docs
`agents_and_services.md`, `architecture.md`, `gui_layouts.md`, `policies.md`, `phase_log.md`

---

## Versioning
- v1.0 → P7 RC build  
- v1.1 → P8-P9 integration branch  
- v1.2 → P10-P11 finalization branch
