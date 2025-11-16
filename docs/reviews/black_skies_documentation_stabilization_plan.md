# Black Skies Documentation Stabilization Plan  
Version: 1.0.0  
Status: Active  
Last Reviewed: 2025-02-14  

This document defines the multi-phase plan for stabilizing, cleaning, reorganizing, and governing the Black Skies documentation ecosystem.  
It ensures all specs, planning docs, phase definitions, GUI/UX docs, and operational surfaces are consistent, referentially correct, and aligned with the Phase 9–11 roadmap.

---

# 🧭 Overview

The planning/documentation layer currently contains inconsistencies, outdated references, missing canonical surfaces, and structural drift.  
The goal of this plan is to:

- Remove duplication, broken references, and terminology drift  
- Reorganize documentation into a clear canonical hierarchy  
- Create missing Books of Record such as BUILD_PLAN.md  
- Establish consistent status/version headers  
- Align specs (architecture, data model, endpoints, GUI, analytics)  
- Resolve contradictions across phases  
- Migrate deferred/archived docs into correct folders  
- Support long-term governance

This plan is structured into five operational phases.

---

# PHASE 1 — Fast, Zero-Risk Fixes (Mechanical Corrections)

## 🎯 Goal
Eliminate trivial inconsistencies and make all docs clean and lintable, without structural changes yet.

## ✅ Tasks

### **1.1 Fix all broken references**
- Create placeholder files (Status: Deferred):
  - `docs/specs/voice_notes_transcription.md`
  - `docs/specs/model_backend.md`
  - `docs/specs/critique_rubric.md`
- Update or remove links pointing to missing files across:
  - `endpoints.md`
  - `phase_charter.md`
  - `gui` docs with voice-note hooks

---

### **1.2 Remove duplicated Phase-10 deliverables**
- Delete second copy of Phase-10 block in `phase_charter.md` (lines ~96–107).

---

### **1.3 Add consistent Status/Version/Last Reviewed headers**
Apply the following template to *every* doc:

Status: Active | Draft | Deferred | Archived
Version: 0.x
Last Reviewed: YYYY-MM-DD

yaml
Copy code

Priority targets:
- `architecture.md`
- `gui_layouts.md`
- `analytics_service_spec.md`
- all `/phases` docs
- brainstorming docs

---

### **1.4 Update deprecated terminology**
- Replace **Companion Mode** → **Insights Overlay**
- Standardize:
  - Spark Pad  
  - Visuals Layer  
  - Wizard Panel  
  - Project Drawer  
  - Docking Mode (if experimental, mark as such)

---

### **1.5 Fix all internal cross-links**
- Update relative paths
- Remove dead paths left behind after folder restructuring

---

# PHASE 2 — Structural Reorganization (Folders & Canonical Surfaces)

## 🎯 Goal
Build a stable, discoverable, canonical documentation hierarchy.

## ✅ Tasks

### **2.1 Create required missing index docs**
- `docs/agent_reading_guide.md`
- `docs/idea_backlog.md` (migrate ideas from `good_idea_fairies.md`)

---

### **2.2 Create BUILD_PLAN.md (critical)**
This becomes the *master implementation plan*.

Must include:
- Phase → Deliverable mapping  
- Canonical doc references  
- Shipping vs deferred features  
- Cross-links to specs  
- Dependencies  

---

### **2.3 Folder reorganization**
Use long-term stable structure:

docs/
phases/
specs/
gui/
ops/
deferred/
archive/

yaml
Copy code

Migration rules:

| Doc Type | Target Folder |
|----------|----------------|
| Active specs | `/specs` |
| GUI/UX surfaces | `/gui` |
| Troubleshooting / Ops | `/ops` |
| Phase definitions | `/phases` |
| Future ideas | `/deferred` |
| Deprecated/old | `/archive` |

---

### **2.4 Add README.md to each folder**
Each README must include:
- Purpose  
- Index of canonical docs  
- Dependencies  
- Relation to BUILD_PLAN  

---

### **2.5 Add cross-referential “Spec Index” blocks**
Each canonical spec (architecture, endpoints, data model, GUI) must include:

Spec Index:

Architecture

Data Model

Endpoints

GUI Layouts

Analytics Spec

BUILD_PLAN

Phase Charter

yaml
Copy code

---

# PHASE 3 — Deep Consistency Fixes (Planning Layer)

## 🎯 Goal
Resolve contradictions, gaps, missing acceptance criteria, and spec drift.

## ✅ Tasks

### **3.1 Resolve all analytics contradictions**
- Align:
  - `analytics_service_spec.md`
  - `endpoints.md`
  - `dashboard_initiatives.md`
  - `phase_charter.md`
  - GUI analytics drawer behavior

Define canonical rule:
> Analytics fully disabled until Phase-9, experimental drawer exists but hidden unless flag enabled.

---

### **3.2 Write acceptance criteria for Phases 9–11**
Each phase doc must include a “Done When” section.

---

### **3.3 Formalize all missing data-model rules**
From Phase-8 backlog:
- ID/slug lifecycle  
- Pagination semantics  
- Unit max sizes  
- Revision history rules  
- Scene ordering rules  
- Validation constraints  

Update `data_model.md`.

---

### **3.4 Finalize endpoint behaviors**
- Clarify undefined or ambiguous endpoint behaviors  
- Align schemas across specs  
- Remove obsolete fields  

---

### **3.5 Fix all GUI/UX inconsistencies**
Define canonical truth for:
- Docking (experimental/disabled?)  
- Analytics drawer behavior  
- Multi-monitor logic  
- Spark Pad → Wizard → Draft Board transitions  
- Accessibility toggles  

Update:
- `gui_layouts.md`
- phase docs
- BUILD_PLAN.md

---

# PHASE 4 — Final Cleanup + Agent Verification Pass

## 🎯 Goal
Confirm full consistency and identify residual defects.

## ✅ Tasks

### **4.1 Run Agent Mode with verification prompt**
Validate:
- No broken links  
- No missing canonical docs  
- All terms standardized  
- All folders correctly classified  
- All deferred work correctly located  

---

### **4.2 Apply fixes from Agent findings**
Expect 5–20 minor inconsistencies to remain.

---

### **4.3 Freeze documentation**
- Set `Version: 1.0.0` on all shipping docs  
- Create `docs/CHANGELOG.md`  
- Add `docs/version_manifest.json`  

### **4.4 Review folder tidy**
- Archived the legacy review deliverables under `docs/archive/reviews/` and created `docs/reviews/SUMMARY.md` to point agents to these canonical references.
- Tagged each moved file with `Status: Archived` so their history stays discoverable while keeping the cargo-culted review folder lean.
- No production doc references the old `docs/reviews/` layout anymore, ensuring the Phase 4 verification surface stays clean.

---

# PHASE 5 - Ongoing Governance (Prevents Future Rot)

## 🎯 Goal
Keep documentation consistent through all future development.

## ✅ Tasks

### **5.1 Adopt Documentation Policy**
Required for every PR:
- Status/Version headers  
- Updated Spec Index  
- BUILD_PLAN links updated  
- Deferred features → `/deferred`  
- Deprecated docs → `/archive`  

---

### **5.2 Quarterly Agent Audits**
Automate:
codex agent run --review docs/

yaml
Copy code

---

### **5.3 Doc Debt Board**
Track issues similar to technical debt.

---

# ✔ End of Stabilization Plan

When all phases are complete, the Black Skies documentation surface becomes:

- Fully canonical  
- Internally consistent  
- Extensible  
- Agent-auditable  
- Free from structural drift  
- Ready for Phase 9–11 implementation  
