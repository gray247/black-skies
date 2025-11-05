# Black Skies — Phase Overview (P0–P11)

This roadmap mirrors the scope defined in `docs/phase_charter.md` and layers in execution status so the two sources stay in sync. Treat the charter as the source of truth for **what** we ship, and this file as the tracker for **when** we land it.

## Phase index

| Phase | Name | Status | Scope reference | Notes |
| :---- | :--- | :----- | :--------------- | :---- |
| P0 | Foundation | ? complete | Charter v1.0 §0 | Environment scaffolding, project bootstrap |
| P1 | Core backend API | ? complete | Charter v1.0 §1 | CRUD + core services landed |
| P2 | GUI skeleton & panes | ? complete | Charter v1.0 §2 | Wizard, Draft board, History primitives |
| P3 | Draft & Critique loop | ? complete | Charter v1.0 §3 | First end-to-end authoring loop |
| P4.0 | Observability baseline | ? complete | Charter v1.0 §4 | Metrics, structured logging |
| P4.1 | Documentation/tagging sweep | ? complete | Charter v1.0 §4.1 | Docs and schema tagging |
| P5 | Tools, Data, & Evaluation Harness | ? complete | Charter v1.0 §5 | Eval harness + tool adapters |
| P6 | End-to-End Integration & Contracts | ? complete | Charter v1.0 §6 | `/api/v1` contracts, session restore |
| P7 | Release Candidate | ? complete | Charter v1.1 §7 | v1.0.0-rc1 packaged and documented |
| P8 | Companion & Critique Expansion | ?? in progress | Charter v1.1 §8 | Companion overlay, rubric editor, critique UX, docking resilience |
| P9 | Analytics & Visualization | ? planned | Charter v1.1 §9 | Emotion arc & pacing graphs — planning doc `docs/dashboard_initiatives.md` (draft) |
| P10 | Accessibility & Writer Exports | ? planned | Charter v1.1 §10 | Voice notes, contrast mode, export templates |
| P11 | Agents & Plugins | ? planned | Charter v1.1 §11 | Agent hooks, plugin registry, backup services |

See `docs/phase_log.md` for dated milestones and unlock/lock history.

---

## Phase summaries

### P7 — Release Candidate (RC)
**Goal:** Freeze public interfaces and cut a build that exercises every major workflow end to end.  
**Deliverables:** API/schema freeze (`v1.0.0-rc1`), reproducible packaging, cross-platform smoke scripts, offline quickstart.  
**Status:** ? Complete — tagged `v1.0.0-rc1` (2025-10-10) with smoke + offline docs verified.

### P8 — Companion & Critique Expansion
**Goal:** Add AI-assisted creative utilities inside the existing workspace while hardening the dock.  
**Key deliverables (charter §8):**
- Companion overlay with contextual chat & scene insights  
- Batch critique mode with rubric-aware bulk actions  
- Custom rubric editor and critique export bundle  
- Soft/hard budget meter with live cost display  
- Quick restore toast for History actions  
- AI rewrite assistant (multi-tone)

**Supporting resilience backlog:**
- Layout persistence & docking accessibility (see `docs/phase8_gui_enhancements.md`)  
- Load/smoke suites, retries & circuit breakers, input validation strict mode  
- Security + `.env` hardening, dependency review

**Status:** ?? In progress — companion overlay, batch critique UI, rubric editing, and budget meter are live in the renderer; docking hotkeys and persistence are undergoing manual verification (scheduled mid-Jan 2026).

### P9 — Analytics & Visualization
**Goal:** Introduce quantitative story analysis and dashboards.  
**Deliverables:** Emotion arc timeline, adaptive pacing graph, conflict heatmap, scene length analyzer, revision streak tracker, project health dashboard, outline validation engine (`docs/dashboard_initiatives.md`).  
**Status:** ? Planned — charter scope captured; implementation begins once P8 verification closes.

### P10 — Accessibility & Writer Exports
**Goal:** Expand accessibility support and professional output tooling.  
**Deliverables:** Voice notes/dictation, high-contrast & large-font toggles, dynamic export templates (MD/DOCX/PDF), corkboard cards PDF, batch outline report, chapter/scene status badges (`docs/accessibility_toggles.md`).  
**Status:** ? Planned — design stubs exist; execution queued after P9 analytics work.

### P11 — Agents & Plugins
**Goal:** Deliver controlled automation and third-party integrations.  
**Deliverables:** Read-only agent hooks, plugin registry + sandbox layout, AI safety layer, auto-backup verification, multi-project dashboard, smart merge tool, offline cache manager (`docs/backup_verification_daemon.md`, `docs/smart_merge_tool.md`, `docs/offline_cache_manager.md`).  
**Status:** ? Planned — scoping tracked in charter; depends on P9/P10 telemetry and export features.

---

## Milestone checklist (Codex-owned execution)

- [x] Add tool adapters and registry (P5)  
- [x] Create eval dataset & `scripts/eval.py` (P5)  
- [x] Add `/api/v1` router + contracts in `docs/endpoints.md` (P6)  
- [x] Implement session snapshots & restore (P6)  
- [x] Package RC, smoke tests, docs (P7)  
- [x] Ship Companion overlay & batch critique prototype (P8)  
- [x] Add load/e2e tests; resilience settings (P8) — automation suite (Vitest + Playwright) + CI artifacts  
- [ ] Implement dock manager + layout persistence + accessibility pass (P8) — pending Jan 2026 smoke/a11y sign-off  
- [ ] Tag GA and add release/support docs (P9)

---

## Release plan

### v1.1 (P8–P9 integration)
- **Target dates:** Feature freeze 2026-01-15 · RC build 2026-01-22 · GA release 2026-02-05  
- **Readiness criteria:** P8 hardening closed; analytics accuracy within ±5?% of golden set; voice notes MVP usable offline; zero open P0/P1 issues; docs updated.  
- **Gating:** Eval benchmarks =95?% pass with p95 latency < 800?ms; accessibility audit (new panels) meets WCAG AA; plugin registry security review complete.

### v1.2 (P10–P11 finalisation)
- **Target dates:** Planning kickoff 2026-02-12 · Feature freeze 2026-03-20 · RC build 2026-03-27 · GA release 2026-04-10  
- **Scope:** Export template engine, plugin lifecycle, automation agents, backup verification, multi-project UX.  
- **Acceptance criteria:** Export diff suite green; plugin registry audited; dashboards surface plugin outputs & analytics overlays.  
- **Gating:** Eval suite expanded with plugin/analytics scenarios (=92?% pass); heavy export pipeline < 90?s on reference hardware; release docs reviewed.
