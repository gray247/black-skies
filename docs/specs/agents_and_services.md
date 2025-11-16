Status: Active (Canonical)
Version: 1.0.0
Last Reviewed: 2025-11-15
Note: Defines Phase 11 service and plugin interfaces.

# docs/specs/agents_and_services.md – Service Hooks v1.1

Spec Index:
- Architecture (`./architecture.md`)
- Data Model (`./data_model.md`)
- Endpoints (`./endpoints.md`)
- GUI Layouts (`../gui/gui_layouts.md`)
- Analytics Spec (`./analytics_service_spec.md`)
- BUILD_PLAN (`../BUILD_PLAN.md`)
- Phase Charter (`../phases/phase_charter.md`)

## Core services
- **Overseer** – conductor for higher-level flows (the companion loop, onboarding automation, automation toggles). Overseer queues work with services, enforces budgets, watches telemetry, and exposes health/status to dashboards and tooling.
- **Critique Service** – runs critiques on drafts/scenes, batches rubric evaluations, and reports structured findings to the UI via the Critique Pane. Overseer routes work to this service and honours local-first versus remote-model toggles.
- **Rewrite Service** – applies edits and stylistic revisions based on critique outputs or direct user prompts; it tracks failures, keeps audit-safe logs, and reports status back to Overseer for acceptance/rollback.
- **Export Service** – handles export pipelines and artifact creation (Markdown/PDF/EPUB bundles). It coordinates with Recovery Service manifests and the backup daemon when packaging long-term archives.
- **Recovery Service** – manages snapshots, short-term recovery flows, and interactions with the backup_and_migration pipeline plus the backup verification daemon. It provides the History pane endpoints, enforces retention, and surfaces integrity diagnostics.
- **Analytics Service** – collects telemetry/metrics for dashboards, feeding health insights to Overseer and the Analytics dashboards (Phase 9/6 deliverables).

## Plugin Registry Spec
The Registry service exposes plugin operations that tie into the core services above. Overseer owns the orchestration, but plugins can register hooks that participate in critique, rewrite, export, or recovery workflows.
- `GET /api/v1/plugins` – list installed plugins with metadata and last-run status.
- `POST /api/v1/plugins/install` – register a plugin by manifest URL/path and validate its checksum/signature.
- `POST /api/v1/plugins/{id}/enable` / `disable` – toggle availability while updating Overseer’s routing decisions.
- `DELETE /api/v1/plugins/{id}` – uninstall, remove files, and log an audit entry under `history/plugins/{id}/audit.log`.
The manifest schema declares the plugin capabilities, the services it can influence, and the requested permissions.
```json
{
  "id": "analytics.graph",
  "version": "1.0.0",
  "display_name": "Analytics Graphs",
  "description": "Adds custom dashboards",
  "entrypoint": "./main.py",
  "permissions": ["read:project","read:analytics","emit:report"],
  "capabilities": ["ui.panel"],
  "author": "example",
  "homepage": "https://…",
  "checksum": "sha256:…",
  "signatures": ["----PGP BLOCK----"]
}
```
Installer validation ensures requested permissions align with the policy store (`../policies.md`), registers the manifest in `plugins.json`, and provisions the sandbox for execution.

## Guardrails (unchanged core)
- Guard execution remains read-only until an explicit Overseer approval path grants write capability.
- Budget enforcement and privacy rules are anchored to Overseer: it enforces token budgets, telemetry gating, and logs policy violations before routing work to Critique or Rewrite Services.
- Plugins execute inside a sandboxed subprocess with limited I/O, and they communicate with services through defined bridges—the Model Router (`./model_backend.md`) prevents direct external model calls.
- All lifecycle events (install, enable, execute, terminate) are logged under `history/plugins/<id>/audit.log` so services can surface health, metrics, or issues.

## Plugin Hook Interfaces
Plugins register hooks with the Registry; Overseer binds them into service flows:
- `on_plan` – integrates with Overseer to inspect outlines before critique batches.
- `on_analyze` – augments Critique Service runs with custom checks or telemetry.
- `on_rewrite` – participates alongside the Rewrite Service when applying edits.
- `on_export` – ties into the Export Service pipeline to add artifacts or validations.
- `on_report` – surfaces structured summaries back to the UI dashboards driven via Analytics Service.
Hooks execute asynchronously and obey Overseer-enforced retry limits (default 1). Failures bubble up to the Overseer supervisor so the UI remains responsive, budgets stay consistent, and logs surface to `history/plugins/<id>/audit.log`.

## Sandbox Summary
- Execution runs inside an isolated subprocess (`python -I`) with a lightweight virtualenv and a clean temp working directory.
- Resource limits use `rlimit` (CPU, memory, file descriptors) plus a 30s wall-clock timeout by default; Overseer will preempt a hook if it overruns.
- No plugin has default network access unless the manifest requests `network:*` and policies grant it; Model Router mediates all remote model calls.
- Filesystem access is mediated through host APIs and readonly caches; plugins cannot access arbitrary project paths beyond their permitted context (project_id/scene_id) provided via `PluginContext`.
- Lifecycle telemetry (install, enable, execute, terminate) flows through the Analytics Service, so dashboards and support tooling can inspect plugin health.
- Detailed “plugin sandbox” design remains in `./plugin_sandbox.md`.
