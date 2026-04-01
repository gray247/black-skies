Status: Draft
Version: 1.0
Last Reviewed: 2025-11-15

# Dashboard Initiatives - Phase 9 Planning
> Implementation trace: `docs/BUILD_PLAN.md` -> Phase 9 control/visibility/insight entry.
Owner: Solo maintainer
Linked Charter Items: docs/phases/phase_charter.md sections 9-11
Related Specs: docs/specs/analytics_service_spec.md, docs/gui/gui_layouts.md, docs/ops/support_playbook.md

## Purpose
Consolidate the roadmap for dashboard-related deliverables promised in Phases 9-11:
- Project Health dashboard and insight surfaces (Phase 9)
- File ownership and continuity validation widgets (Phase 10)
- Multi-project launcher and customization surfaces (Phase 11)

This document captures scope, dependencies, and task breakdowns to remove ambiguity from the charter.

---

## Phase 9 - Control, Visibility, and Insight Dashboard
**Goal:** Surface a snapshot of project status, execution flow, provenance, and insight metrics on top of the stabilized runtime.

### Scope
- Renderer dashboard view accessible from the insight drawer or dedicated launcher route.
- Data sources:
  - `GET /api/v1/analytics/summary?project_id=...` (emotion arc, pacing, conflict heatmap, length distribution, revision streaks).
  - Story build timeline data derived from history and revision state.
  - Scene provenance data derived from outline, prompt, and revision records.
  - Budget meter (`project.json::budget`) shared by Outline/Writing flows.
  - Feedback accept streaks + pending feedback items.
- Status badges (`ok`/`warning`/`error`) with tooltips linking to remediation steps in `docs/ops/support_playbook.md`.

### Tasks
1. Backend aggregation helper: `blackskies.services.analytics.project_health` returning an enriched `project_health` payload (Phase 9.1).
2. Renderer UI: responsive card layout + DockWorkspace integration, including timeline and provenance quick links (Phase 9.2).
3. Tests: `pytest -m "insight"` contract coverage plus Playwright `insight-visual` suite (Phase 9.3).
4. Docs: Update `docs/gui/gui_layouts.md`, `docs/ops/support_playbook.md`, and this plan with final endpoint and metric references (Phase 9.4).

### Dependencies
- `docs/specs/analytics_service_spec.md` contract implementation (in progress).
- Docking feature flag (Phase 8).

---

## Phase 10 - File Ownership and Continuity Validation
**Goal:** Validate file ownership, continuity pressure, lore dependencies, and structural consistency.

### Scope
- New service module for ownership and continuity validation invoked on demand or after outline rebuild.
- Validation rules:
  - Gaps / duplicate orders
  - Missing linked draft/scene files
  - Outline decision conflicts
  - Lore dependency pressure
- Renderer dashboard widget showing issue table + quick links back to the Outline pane.

### Tasks
1. Spec finalisation: enumerate validation rules + severities (Phase 10.0).
2. Service implementation: `/api/v1/outline/validate` returning structured issues (Phase 10.1).
3. Renderer integration: Dashboard card with filters + quick navigation (Phase 10.2).
4. Automation: Add evaluation cases in `scripts/eval.py` (Phase 10.3).
5. Docs: Extend `docs/phases/phase_charter.md`, `docs/gui/gui_layouts.md`, support playbook.

### Dependencies
- Stable outline build pipeline.
- Analytics service for cross-linking stats (optional).

---

## Phase 11 - Style, Persona, Plugin, and Multi-Project Support
**Goal:** Provide customization surfaces, plugin support, and a cross-project view for quick switching.

### Scope
- New landing view listing recent projects with status badges (health, backup verification, voice notes).
- Integration with backup verification daemon and sandbox audit signals.
- Optional search/filter.
- Style configs and persona tuning surfaced as user-facing settings.
- Consume `/api/v1/healthz` extensions (`backup_status`, `backup_voice_notes_checked`, `backup_voice_note_issues`) to drive project badges and tooltips.

### Tasks
1. Service endpoint: `/api/v1/projects/summary` returning recent project metadata (Phase 11.1).
2. Renderer launcher: Desktop shell to expose dashboard + quick actions (Phase 11.2).
3. Health integration: Surface backup verifier signal (status + counts) using the new health payload fields (Phase 11.2a).
4. Notifications: Optional system notification on backup failures (Phase 11.3).
5. Docs and support: Document workflows + update release checklist (Phase 11.4).

### Dependencies
- Backup verification daemon (Phase 11).
- Plugin sandbox audit exposure.

---

## Tracking & Reporting
- Log milestones in `phase_log.md` as each sub-phase is planned or executed.
- Maintain personal tracker entries instead of team tickets.
- Keep `docs/ops/support_playbook.md` aligned with shipped dashboards and troubleshooting steps.

## Done When
- Project Health, outline validation, and multi-project dashboards show the metrics described above and read from `docs/specs/analytics_service_spec.md`.
- Health badges rely on `docs/specs/backup_verification_daemon.md` and `docs/specs/plugin_sandbox.md` signals per the dependencies.
- Support playbook references this plan when triaging dashboard issues.
