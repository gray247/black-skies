# Black Skies – Canonical Build Plan (Full Roadmap)

> **Purpose**  
> This document defines the *complete* development roadmap for Black Skies, including all phases, goals, dependencies, exit criteria, and the feature mapping for the entire system.  
> This is the authoritative source of truth for what the project is, what remains, and how it reaches the final packaging phase.

---

#  Phase Overview (Summary)

| Phase | Name | Purpose | Status |
|------|------|---------|--------|
| 1 | Foundations & Architecture | Establish core engine, services, environment, repo structure | ✔ Done (historical) |
| 2 | Wizard & Project Intake | Create project creation flow, initial scaffolding, binder integration | ✔ Done |
| 3 | Draft Board & Binder | Core writing surfaces, scene control, binder structure | ✔ Done |
| 4 | Critique & Rewrite Loop | End-to-end critique + rewrite pipeline, state management | ✔ Complete (mock loop) |
| 5 | Export & Integrity | PDF/DOCX/MD export, metadata, snapshots, scene IDs | ◐ Partially done |
| 6 | Analytics & Dashboards | Emotion graph, corkboard, pacing heatmaps, readability stats | ◯ Not started |
| 7 | Advanced Tools | Plugins, voice notes, smart merge, offline cache | ◯ Not started |
| 8 | GUI Polish & Accessibility | Theming, font scaling, layout cleanup, test stabilization | ✔ Done (historical) |
| 9 | Packaging & Release Gate | Installer, E2E verification, documentation sync, shopping wrap | ◯ Not started |

---

#  Phase 1 — Foundations & Architecture  
**Status: ✔ Complete (Historical)**  
Core engine, project structure, services layout, and high-level environment setup.

### Deliverables
- Overseer implemented as orchestration layer  
- Core service architecture established  
- File layout, folder conventions, naming conventions  
- Development tooling, scripts, environment bootstrap  

### Exit Criteria
- Project boots  
- Services load  
- Test environment functional  

---

#  Phase 2 — Wizard & Project Intake  
**Status: ✔ Complete**

### Deliverables
- Wizard onboarding flow  
- Project creation + metadata intake  
- Story type initialization  
- Binder project scaffolding  

### Exit Criteria
- User can create a new project  
- Wizard → Binder transition is stable  

---

#  Phase 3 — Draft Board & Binder  
**Status: ✔ Complete**

### Deliverables
- Draft Board editor  
- Scene management  
- Binder and scene graph  
- Auto-save  
- Pane persistence (DockWorkspace foundation)  

### Exit Criteria
- User can write, edit, and manage scenes  
- Binder and Draft remain in sync  

---

#  Phase 4 — Critique & Rewrite Loop  
**Status: ✔ Complete (mock loop)**

### Deliverables
- Critique Service  
- Rewrite Service  
- Critique → Rewrite → Accept workflow  
- Local diffs  
- Scene replacement & refactoring logic  
- Loop state handling  
- Integrity checks inside rewrite flow  

### Remaining Tasks
- AI provider integration (Phase 7) will plug into this mock plumbing once the loop proves stable.

### Exit Criteria
- User can generate critiques  
- User can apply rewrites  
- Loop produces stable output end-to-end  

---

#  Phase 5 — Export & Integrity  
**Status: ◐ Partially Complete**

### Purpose
Enable full export pipeline + project data integrity & snapshot system.

### Deliverables
- Export Service  
- DOCX, PDF, Markdown export  
- Metadata integrity system:  
  - Scene IDs  
  - Binder → Draft mapping  
  - Timestamps  
  - Project manifest  
- Integrity checks  
- Snapshot system (short-term)  
- Backup system (long-term ZIP)  
- Backup verification daemon  

### Exit Criteria
- All export formats work on sample projects  
- Snapshots recover successfully  
- ZIP backups validated  
- Project metadata remains internally consistent  

---

#  Phase 6 — Analytics & Dashboards  
**Status: ◯ Not Started**

### Purpose
Provide high-value visual tools writers use during drafting & revision.

### Deliverables
- Emotion Graph (scene-level emotional trajectory)  
- Corkboard (visual layout of scenes as cards)  
- Relationship graph (optional stretch)  
- Pacing heatmap  
- Readability & density metrics  
- Local-only insights (offline-capable)  
- Analytics Service backend  

### Exit Criteria
- Dashboard pane functional  
- Emotion graph functional  
- Corkboard functional  
- Insights panel displays analytics locally or via backend  
- Offline analytics fully supported  

---

#  Phase 7 — Advanced Tools  
**Status: ◯ Not Started**

### Purpose
Deliver the productivity “superpowers” that differentiate this product long-term.

### Deliverables
- Voice Notes Tool  
- Plugin Sandbox  
- Smart Merge engine  
- Offline cache for long projects  
- Custom prompts library  
- Advanced editing macros  

### Exit Criteria
- Advanced tools panel functional  
- Plugins load safely  
- Merge engine stable  
- Offline cache survives unplugged multi-hour sessions  

---

#  Phase 8 — GUI Polish & Accessibility  
**Status: ✔ Complete (Historical)**  
**(All fixes are now historical. No new work happens here.)**

### Purpose
Stabilize GUI, tests, layout, and accessibility.

### Historical Fixes Included
- DockWorkspace test suite  
- Float clamping  
- Insight gating  
- Offline behavior  
- General cleanup & refactor  

### Exit Criteria
- All GUI tests green  
- No layout drift at 1920×1080 baseline  

---

#  Phase 9 — Packaging & Release Gate  
**Status: ◯ Starting Soon**

### Purpose
Prepare the app for external testers. No new features are built here.

### Deliverables
- Windows installer (Electron)  
- Uninstall correctness  
- Upgrade path validation  
- Full E2E test pass  
- Offline/online test coverage  
- Export → Import → Restore test  
- Version tagging  
- Repo cleanup  
- Final documentation sync  
- Post-release checklist certification  

### Exit Criteria
- Installer works on two clean machines  
- All docs are in final form  
- All phases fully completed  
- No red TODOs anywhere  
- “Ready for shopping” certificate achieved  

---

#  Appendix A — Canonical Services Map

| Service | Purpose |
|---------|---------|
| Overseer | Orchestrates all operations |
| Critique Service | Generates critique output |
| Rewrite Service | Applies revisions |
| Export Service | Generates DOCX/PDF/MD |
| Recovery Service | Snapshots, restore, crash handling |
| Analytics Service | Emotion graph, pacing, insights |
| Plugin Sandbox | Extension platform |
| Voice Notes | Audio capture and transcription |
| Merge Engine | Smart merge and scene resolution |

---

#  Appendix B — Project Completion Definition

The project is considered **complete** when:

1. All phases (1–9) show green status.  
2. Installer & E2E tests pass.  
3. Documentation is synchronized.  
4. All dashboards and analytics surfaces exist.  
5. All advanced tools are operational.  
6. No planning doc contains open TODOs.  

This is the final gate before public distribution.
