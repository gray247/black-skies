Status: Active (Canonical)
Version: 1.1.0
Last Reviewed: 2026-03-31

# Black Skies System Architecture

This document describes the runtime that actually exists.

Canonical control-plane details live in [`control_plane.md`](./control_plane.md).

## Runtime Topology

The current runtime is:

`Electron renderer` -> `FastAPI services` -> `service layer` -> `filesystem / model router / persistence`

The app factory in `services/src/blackskies/services/app.py` is the real composition root.

It wires:
- `ModelRouter`
- `CritiqueService`
- `ServiceResilienceRegistry`
- `BuildTracker`
- `RecoveryTracker`
- `BackupVerificationDaemon` when enabled
- `VerificationScheduler`
- the HTTP routers under `services/src/blackskies/services/routers/`

There is no runtime job coordinator component.
There is no runtime `AgentOrchestrator` component.

## What The Runtime Actually Uses

### Control Plane

`create_app()` owns runtime composition.

Routers call into services, and services own the work:
- draft generation
- rewrite and critique
- long-form execution
- recovery
- export
- backup verification

### Model Routing

`ModelRouter` is the model-selection boundary.

It chooses providers for model-backed tasks and evaluates run policy from budget status, but it does not own project budgets.

### Budgets

`BudgetService` owns budget loading, classification, blocked/allowed decisions, summary construction, and persistence.

If a request is blocked for spend reasons, the decision comes from budget classification, not from a job coordinator.

### Resilience

Shared service resilience lives in `ServiceResilienceExecutor` and `ServiceResilienceRegistry`.

Tool-level resilience lives in `ToolRunner` and `ToolCircuitBreaker`.

Shared execution policy for service work lives in `services/src/blackskies/services/execution_policy.py`.

Draft generation now uses that shared policy for retries and timeouts. Long-form execution uses it for adapter transport calls, but still keeps its own editorial retry/fallback loop. That split is real and should be named, not hidden.

These resilience layers are intentionally distinct:
- execution policy does bounded retry/timeout/cancellation for service work
- service resilience owns service-level circuit state and long-running workflow guards
- tool resilience owns tool/plugin boundary retries, timeouts, and circuit breaking

Support-only agent wrappers live under `blackskies.services.test_support`, not in the runtime control plane.

### Routers

Routers are HTTP adapters.

They validate payloads, map service exceptions to HTTP responses, and keep request-specific plumbing close to the API surface.

### Plugins

The current plugin system is not a hook platform.

It is:
- `PluginRegistry` for manifests and state
- `launch_plugin()` for subprocess execution
- `runner.py` for entrypoint-based execution

There is no plugin router and no implemented hook dispatch.

### Backup Verification

`BackupVerificationDaemon` exists in the codebase and is wired by `create_app()` when `backup_verifier_enabled` is true.

The scheduler is also started at app startup.

The feature is default-off, not absent.

## Deferred Or Absent Surfaces

The following are not runtime facts today:
- batch critique jobs with persisted status
- `/api/v1/plugins` HTTP endpoints
- `on_plan` / `on_analyze` / `on_rewrite` / `on_export` / `on_report`
- wall-clock plugin timeout enforcement in the host
- a durable job coordinator for critique/rewrite batches

## Practical Rule

If a feature needs durable coordination, cross-request cancellation, or job status persistence, that is the point where a true job coordinator becomes necessary.
