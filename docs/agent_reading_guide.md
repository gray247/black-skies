Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# Agent Reading Guide

This guide helps agents (and humans) land on the canonical, live documentation surface. Always verify the header on any doc you open: if it is not `Active` or marked as `Deferred`/`Archived`, treat it as a candidate for follow-up before trusting its statements.

## Recommended reading order
1. `docs/phases/phase_charter.md` – scope authority for phases P8–P11 plus the Bookend descriptions.
2. `docs/BUILD_PLAN.md` – implementation bridge linking the phase charter to the canonical specs.
3. `docs/phases/phase_log.md` – status snapshots that document when each milestone was locked or moved forward.
4. Phase-specific deliverables (`docs/phases/phase9_charter.md`, `docs/phases/phase9_11_testplan.md`, `docs/phases/phase9_companion_loop.md`, `docs/phases/dashboard_initiatives.md`, `docs/phases/phase10_recovery_pipeline.md`, `docs/phases/phase11_export_pipeline.md`).
5. The canonical spec suite (`docs/specs/architecture.md`, `docs/specs/data_model.md`, `docs/specs/endpoints.md`, `docs/gui/gui_layouts.md`, `docs/specs/analytics_service_spec.md`, `docs/specs/agents_and_services.md`).
6. `docs/CHANGELOG.md` and `docs/version_manifest.json` for verification of what changed and what the current surface should look like.

## Books of Record
- Architecture: `docs/specs/architecture.md`
- Data Model: `docs/specs/data_model.md`
- Endpoints: `docs/specs/endpoints.md`
- GUI Layouts: `docs/gui/gui_layouts.md`
- Analytics: `docs/specs/analytics_service_spec.md`
- Agent / Plugin contracts: `docs/specs/agents_and_services.md`
- Phase charter: `docs/phases/phase_charter.md`
- Build plan: `docs/BUILD_PLAN.md`
- Changelog: `docs/CHANGELOG.md`
- Backup verifier daemon: `docs/specs/backup_verification_daemon.md`
- Version manifest: `docs/version_manifest.json`

## Folder purpose (canonical surfaces only)
- `docs/phases/`: phase charter, per-phase plans, test plans, and the phase log that documents completion status.
- `docs/specs/`: architecture, data model, endpoints, analytics, agents/plugins, and deferred placeholders that point toward canonical specs.
- `docs/gui/`: renderer layout, theming, accessibility, exports, and supporting rescue/fix guides; `gui_layouts.md` is the canonical GUI spec.
- `docs/ops/`: operational/runbook notes, rescue kits, and support playbooks that reference canonical artifacts.
- `docs/deferred/`: future or experimental ideas that are cross-referenced in `docs/idea_backlog.md`; do not edit these for shipping-phase audits.
- `docs/archive/`: historical records; read `docs/archive/README.md` before relying on any of these docs.
- `docs/reviews/`: now only hosts `docs/reviews/black_skies_documentation_stabilization_plan.md` and `docs/reviews/SUMMARY.md` documenting the stabilization effort.
- `docs/` root: contains the changelog, manifest, backlog, and any high-level glue docs that tie the canonical pieces together (e.g., `docs/idea_backlog.md`, `docs/roadmap.md`).

## How to trust links
- Prefer `docs/phases/`, `docs/specs/`, `docs/gui/`, and `docs/BUILD_PLAN.md` as the primary sources.
- When a link points into `docs/deferred/` or `docs/archive/`, treat the target as reference-only; archive docs should include a status header explaining the historic context.
- Confirm the `Status/Version/Last Reviewed` trio at the top before acting on any document. If the header is missing or contradictory, flag it as a TODO for human review.

## Spec flow & cross-links
- Build plan → phase charter → canonical specs. Use `docs/BUILD_PLAN.md` to find which spec couples with each phase deliverable, then read the supporting spec (architecture/data/endpoints/gui/analytics/agents).
- Each canonical spec points back to the others via Spec Index blocks; follow those to stay within the approved surface.

## GUI/UX index
- Layout baseline: `docs/gui/gui_layouts.md` (canonical).
- Theming and exports: `docs/gui/gui_theming.md` and `docs/gui/exports.md` extend the canonical layout.
- Accessibility: `docs/gui/accessibility_toggles.md`.
- Rescue/fix plans: `docs/gui/gui_fix_plan.md` and `docs/gui/gui_offline_insights_and_floats_plan.md`.

## Deferred & idea surfaces
- `docs/deferred/voice_notes_transcription.md` – future voice notes/transcription plan.
- `docs/deferred/smart_merge_tool.md` – future merge workflow.
- `docs/idea_backlog.md` collects every other idea captured during the stabilization effort; treat this as the backlog, not the canonical plan.

## Archival surface
- Start with `docs/archive/README.md`; it explains why each doc there is stored and points to the canonical replacements.
- Use `docs/reviews/SUMMARY.md` to understand which reviews were archived and where they now live.

## Ops & troubleshooting
- `docs/ops/dev_ops_notes.md` indexes the operational notes. Follow the end-to-end rescue flow via `docs/ops/gui_insights_rescue_kit.md`, `docs/ops/start_codex_gui_notes.md`, `docs/ops/support_playbook.md`, and the security docs under `docs/ops/`.

## How to use this guide
- When Agent Mode requests context, start with the phase charter and build plan, then move into the spec that covers the behavior in question.
- If you encounter unresolved contradictions or missing links, note them as TODOs referencing the relevant doc and route them to the stabilization team before continuing.
