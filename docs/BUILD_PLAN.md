Status: Active (Canonical)
Version: 1.0.0
Last Reviewed: 2025-11-15

# Build Plan – Phase 8–11 Implementation Bridge

Canonical Links:
- `docs/specs/architecture.md`
- `docs/specs/data_model.md`
- `docs/specs/endpoints.md`
- `docs/gui/gui_layouts.md`
- `docs/specs/analytics_service_spec.md`
- `docs/specs/agents_and_services.md`
- `docs/phases/phase_charter.md`
- `docs/CHANGELOG.md`
- `docs/version_manifest.json`

This bridge document ties the roadmap/phase charter into the canonical specs so every surface knows which doc to consult before shipping changes. Use it to trace Phase 8–11 deliverables back to their spec families (`docs/phases/`, `docs/specs/`, `docs/gui/`) and to the roadmap timeline (`docs/roadmap.md`). When BUILD_PLAN stabilizes, point tooling and agents back here to resolve scope debates.

## Phase → Deliverable mapping
| Phase | Key Deliverables | Canonical Docs | Notes |
| :---- | :--------------- | :-------------- | :---- |
| Phase 8 – Insights & Docking | Docking resiliency, Insights overlay gating, budget meter polish, onboarding tweaks | `docs/phases/phase_charter.md`, `docs/phases/phase8_gui_enhancements.md`, `docs/gui/gui_layouts.md`, `docs/gui/gui_fix_plan.md` | Active scope (shipping); analytics drawer stays hidden until Phase 9; Spark Pad/Wizard flows defined here. |
| Phase 9 – Analytics & Dashboards | Analytics service, Project Health dashboard, Companion automation stability, analytics gating | `docs/phases/phase9_charter.md`, `docs/phases/phase9_11_testplan.md`, `docs/phases/phase9_companion_loop.md`, `docs/specs/analytics_service_spec.md`, `docs/phases/dashboard_initiatives.md`, `docs/gui/gui_layouts.md` | Analytics endpoints are deferred in Phase 8; they become active in Phase 9 under feature flags. Dashboard UI relies on analytics cache spec + `Insights Overlay` wiring. |
| Phase 10 – Accessibility & Exports | Accessibility toggles, export templates & rates, snapshot/recovery refinements | `docs/phases/phase10_recovery_pipeline.md`, `docs/gui/gui_layouts.md`, `docs/gui/accessibility_toggles.md`, `docs/gui/exports.md`, `docs/specs/data_model.md` | Accessibility/exports ship once Phase 9 analytics baseline is stable. Voice notes remain deferred. |
| Phase 11 – Agents, Plugins & Backups | Agent sandbox, backup verifier, plugin audit trails, export pipelines | `docs/phases/phase11_export_pipeline.md`, `docs/specs/agents_and_services.md`, `docs/specs/plugin_sandbox.md`, `docs/specs/backup_verification_daemon.md`, `docs/specs/model_backend.md`, `docs/deferred/voice_notes_transcription.md` | Agent/backup work gated by feature flags; treat docs under `docs/deferred/` as future-facing until nav commands flip. |

## Notes on scope
- Each row links back to `docs/roadmap.md` for status tracking and `docs/phases/phase_charter.md` for scope alignment.
- Use the spec index blocks in `docs/specs/` and `docs/gui/gui_layouts.md` to jump between architecture/data/endpoints/analytics as needed.
- Deferred items live under `docs/deferred/`; consult the backlog (`docs/idea_backlog.md`) before adding new future work.
