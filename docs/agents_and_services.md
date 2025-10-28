# docs/agents_and_services.md — Agent Hooks v1.1
**Status:** UNLOCKED · 2025-10-09  
Defines Phase 11 agent and plugin interfaces.

---

## Agent Roles
- **Planner:** outline validation, beat analysis.  
- **Drafter:** AI rewrite & tone variants (read-only).  
- **Critic:** batch rubric evaluation.  
- **Librarian:** backup verification + archive exports.

---

## Plugin Registry Spec
`/plugins/{plugin_name}/manifest.json`  
```json
{
  "id": "example.plugin",
  "description": "Adds new analytics graph",
  "permissions": ["read:project","emit:report"]
}
```

---

## Guardrails (unchanged core)

* Read-only until explicit approval; diffs must be human-applied.
* Must respect token budgets and privacy policy.
* Agents execute inside sandbox with limited I/O.

## Registry API & Lifecycle
- **Registry service** (`blackskies.services.plugins.registry`) exposes:
  - `GET /api/v1/plugins` — list installed plugins with metadata.
  - `POST /api/v1/plugins/install` — register plugin by manifest URL/path.
  - `POST /api/v1/plugins/{id}/enable` / `disable` — toggle availability.
  - `DELETE /api/v1/plugins/{id}` — uninstall (removes files, audit entry).
- Manifest schema:
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
- Permission matrix: `read:*`, `write:*`, `emit:*`, `network:*` (default deny). Installer validates allowed set against `docs/policies.md`.
- Lifecycle:
  1. **Install**: verify checksum/signature, copy to sandbox directory, record in registry DB (`plugins.json`).
  2. **Load**: agent runtime imports plugin entrypoint within jailed interpreter (per plugin virtualenv).
  3. **Execute**: agents call `plugin.run(context)` with limited API surface; all outputs logged.
  4. **Report**: plugin returns structured result; registry enforces schema and audit log entry.
  5. **Audit**: maintain execution history (`plugins/history/{id}.jsonl`) for review.

## Agent Hook Interfaces
- Define `AgentContext` (`project_id`, `scene_id`, `settings`, `budget`, `logger`).
- Plugins register hooks via `register_plugin(hooks: dict[str, Callable])`:
  - `on_plan`, `on_analyze`, `on_export`, `on_report`.
- Hooks execute asynchronously; failures bubble to agent supervisor with retries capped at 1.
- UI exposes plugin status (enabled, update available, last error) in Settings > Plugins.

## Sandbox Summary
- Execution uses isolated subprocess (`python -I`) with minimal virtualenv and temp working directory.
- Resource limits enforced via `rlimit` (CPU/memory/FDS) with 30s wall-clock timeout by default.
- No network access unless manifest requests `network:*` and policy allows it.
- Filesystem access mediated through host APIs; plugins cannot open arbitrary paths.
- All lifecycle events (install, enable, execute, terminate) logged to `history/plugins/<id>/audit.log`.
- Detailed design: see `docs/plugin_sandbox.md`.
