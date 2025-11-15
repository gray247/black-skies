# Agent Reading Guide

> Use this guide when running Agent Mode: stick to the canonical books of record, skip archived/deferred material unless explicitly cited, and follow the phase order below.

## Canonical doc flow
1. **Phase strategy** – `docs/phases/phase_charter.md` defines the full P8–P11 scope. Follow its sections in order before drilling into phase-specific docs (phase8 docking, phase9 analytics, phase10 recovery, phase11 export).
2. **Phase attachments** – `docs/phases/phase9_charter.md`, `docs/phases/phase9_11_testplan.md`, `docs/phases/phase9_companion_loop.md` and `docs/phases/dashboard_initiatives.md` capture the analytics/dashboards focus for P9–P11. Consult `docs/phases/phase10_recovery_pipeline.md` and `docs/phases/phase11_export_pipeline.md` when validating future pipelines.
3. **Execution log** – Check `docs/phases/phase_log.md` for milestone timestamps before trusting any phase status.

## Core specs
- `docs/specs/architecture.md` (system topology, analytics/agent placement)
- `docs/specs/data_model.md` (project folder layout + schema shapes)
- `docs/specs/endpoints.md` (HTTP contracts and gating)
- `docs/specs/analytics_service_spec.md` (metrics, outputs, caches)
- Supplement with `docs/specs/model_backend.md`, `docs/specs/agents_and_services.md`, `docs/specs/plugin_sandbox.md`, `docs/specs/backup_verification_daemon.md`, and `docs/specs/performance_telemetry_policy.md` as needed.

## GUI/UX index
- Layout baseline: `docs/gui/gui_layouts.md`
- Theming: `docs/gui/gui_theming.md`
- Accessibility toggles: `docs/gui/accessibility_toggles.md`
- Fix/rescue plan and supporting deep dives: `docs/gui/gui_fix_plan.md`, `docs/gui/gui_offline_insights_and_floats_plan.md`
- Export/outputs panel: `docs/gui/exports.md`

## Deferred docs (reference-only)
- `docs/deferred/voice_notes_transcription.md` – Voice notes/transcription plan.
- `docs/deferred/smart_merge_tool.md` – Editorial merge workflow.

## Archived docs
- Use `docs/archive/README.md` then follow `docs/archive/BUILD_STEPS_CHECKLIST.md`, `docs/archive/BUILD_STEPS_DETAILED.md`, and `docs/archive/P2_ACCEPT_PLAN.md` only when tracing historical decisions. Do not treat them as sources of truth for current scope.

## Ops & troubleshooting
- `docs/ops/dev_ops_notes.md` indexes operational helpers. For step-by-step recovery, consult `docs/ops/gui_insights_rescue_kit.md`, `docs/ops/start_codex_gui_notes.md`, `docs/ops/support_playbook.md`, and the security runbooks under `docs/ops/`.

## How to use this guide
- Respect the order above: start with the phase charter, then dig into the spec that feeds the feature you are reviewing.
- When Agent Mode flags a contradiction, confirm whether the doc is canonical (phase/spec/gui) or flagged as deferred/archived before acting.
