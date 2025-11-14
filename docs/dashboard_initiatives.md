# Dashboard Initiatives – Phases 9–11 Planning
**Status:** In progress (T-9143) · 2025-10-07  
**Owner:** Solo maintainer  
**Linked Charter Items:** docs/phase_charter.md §§39–41, 71  
**Related Specs:** docs/analytics_service_spec.md, docs/gui_layouts.md, docs/support_playbook.md

## Purpose
Consolidate the roadmap for dashboard-related deliverables promised in Phases 9–11:
- **Project Health dashboard** (Phase 9)
- **Outline Validation engine & dashboard widgets** (Phase 10)
- **Multi-Project launcher/dashboard** (Phase 11)

This document captures scope, dependencies, and task breakdowns to remove ambiguity from the charter.

---

## Phase 9 — Project Health Dashboard
**Goal:** Surface a snapshot of project status (budget state, recent Outline/Writing/Feedback activity, analytics summary metrics).

### Scope
- Renderer dashboard view accessible from the Story insights pane or dedicated launcher route.
- Data sources:
  - `GET /api/v1/analytics/summary?project_id=...` (emotion arc, pacing, conflict heatmap, length distribution, revision streaks).
  - Budget meter (`project.json::budget`) shared by Outline/Writing flows.
  - Feedback accept streaks + pending feedback items.
- Status badges (`ok`/`warning`/`error`) with tooltips linking to remediation steps in `docs/support_playbook.md`.

### Tasks
1. **Backend aggregation helper:** `blackskies.services.analytics.project_health` returning an enriched `project_health` payload (Phase 9.1).
2. **Renderer UI:** responsive card layout + DockWorkspace integration, including Outline/Writing/Feedback quick links (Phase 9.2).
3. **Tests:** `pytest -m "analytics"` contract coverage plus Playwright `analytics-visual` suite (Phase 9.3).
4. **Docs:** Update `docs/gui_layouts.md`, `docs/support_playbook.md`, and this plan with final Endpoint/metrics references (Phase 9.4).

### Dependencies
- `docs/analytics_service_spec.md` contract implementation (in progress).
- Docking feature flag (Phase 8).

---

## Phase 10 — Outline Validation Engine
**Goal:** Validate outline consistency (scene ordering, missing beats, orphan chapters) and present actionable issues.

### Scope
- New service module `outline_validation` invoked on demand or after outline rebuild.
- Validation rules:
  - Gaps / duplicate orders
  - Missing linked draft/scene files
  - Outline decision conflicts
- Renderer dashboard widget showing issue table + quick links back to the Outline pane.

### Tasks
1. **Spec finalisation:** enumerate validation rules + severities (Phase 10.0).
2. **Service implementation:** `/api/v1/outline/validate` returning structured issues (Phase 10.1).
3. **Renderer integration:** Dashboard card with filters + quick navigation (Phase 10.2).
4. **Automation:** Add evaluation cases in `scripts/eval.py` (Phase 10.3).
5. **Docs:** Extend `docs/phase_charter.md`, `docs/gui_layouts.md`, support playbook.

### Dependencies
- Stable outline build pipeline.
- Analytics service for cross-linking stats (optional).

---

## Phase 11 — Multi-Project Dashboard & Launcher
**Goal:** Provide a cross-project view (recent activity, budgets, health states) and allow quick switching.

### Scope
- New landing view listing recent projects with status badges (health, backup verification, voice notes).
- Integration with backup verification daemon & sandbox audit signals.
- Optional search/filter.
- Consume `/api/v1/healthz` extensions (`backup_status`, `backup_voice_notes_checked`, `backup_voice_note_issues`) to drive project badges and tooltips.

### Tasks
1. **Service endpoint:** `/api/v1/projects/summary` returning recent project metadata (Phase 11.1).
2. **Renderer launcher:** Desktop shell to expose dashboard + quick actions (Phase 11.2).
3. **Health integration:** Surface backup verifier signal (status + counts) using the new health payload fields (Phase 11.2a).
4. **Notifications:** Optional system notification on backup failures (Phase 11.3).
5. **Docs & support:** Document workflows + update release checklist (Phase 11.4).

### Dependencies
- Backup verification daemon (Phase 11).
- Plugin sandbox audit exposure.

---

## Tracking & Reporting
- Log milestones in `phase_log.md` as each sub-phase is planned/executed.
- Maintain personal tracker entries instead of team tickets.
- Keep `docs/support_playbook.md` aligned with shipped dashboards and troubleshooting steps.
