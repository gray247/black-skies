Status: Active (Canonical)
Version: 1.0.0
Last Reviewed: 2026-03-31

# Control Plane

This document is the canonical description of how the Black Skies runtime is controlled today.

## Target Model

Black Skies is a **service-first platform with optional test-support wrappers**.

That means:
- services own the real work and state transitions
- routers translate HTTP into service calls and HTTP errors
- the app factory wires the runtime together
- wrapper classes live in `blackskies.services.test_support`, not the runtime control plane

## Current Control Plane

The real control plane is `services/src/blackskies/services/app.py`.

`create_app()` wires:
- `ModelRouter`
- `CritiqueService`
- `ServiceResilienceRegistry`
- `BuildTracker`
- `RecoveryTracker`
- `BackupVerificationDaemon` when `backup_verifier_enabled` is true
- `VerificationScheduler`
- the HTTP routers under `services/src/blackskies/services/routers/`

There is no runtime job coordinator component in the codebase.
There is no runtime `AgentOrchestrator` component in the codebase.

## Component Roles

### Service

A service is a module or class that owns a bounded piece of business logic, persistence, or workflow execution.

Services may:
- load and persist project state
- classify budget state
- route model tasks
- enforce retry and timeout policy for their own operation
- emit diagnostics

Services should not be treated as UI abstractions.

### Test-Support Wrappers

Support-only wrappers live in `blackskies.services.test_support`.

Current examples:
- `BaseAgent`
- `OutlineAgent`
- `DraftAgent`
- `RewriteAgent`
- `CritiqueAgent`
- `AgentOrchestrator`

These wrappers are not wired into production runtime. They exist for tests and isolated experiments only.

What is not a wrapper:
- routers
- request models
- persistence helpers
- background daemons
- the model router
- the budget service
- the plugin sandbox

### ModelRouter

`ModelRouter` is the model selection and run-policy component.

It:
- selects local or remote providers
- resolves routing decisions for model-backed tasks
- evaluates run policy from budget status
- can attach routing metadata to responses when enabled

It is not the budget authority.

### BudgetService

`BudgetService` owns project budget loading, classification, blocked/allowed decisions, summary building, and persistence.

If code needs to know whether a run is allowed, the budget decision starts here.

### Resilience Layer

The shared runtime resilience layer is:
- `ServiceResilienceExecutor`
- `ServiceResilienceRegistry`
- `ExecutionPolicyRunner`

The tool-specific resilience layer is:
- `ToolRunner`
- `ToolCircuitBreaker`

These components own retry, timeout, and circuit-breaker policy for the operations they wrap.

They are intentionally separate layers, not one generic orchestration surface:
- `ExecutionPolicyRunner` is shared execution policy for bounded service work
- `ServiceResilienceExecutor` is service-level resilience with circuit state
- `ToolRunner` is tool/plugin boundary resilience

`ExecutionPolicyRunner` is the shared execution-policy helper for service work that still needs local retries and wall-clock limits. Current users include draft generation and long-form adapter calls.

### Routers

Routers are the HTTP boundary.

They:
- validate payloads
- fetch services from application state or dependencies
- translate service exceptions into HTTP responses
- should not duplicate business rules unless the route is the actual owner of the operation

## Plugin Reality

The current plugin implementation is entrypoint-based sandbox execution:
- `PluginRegistry` stores manifests
- `launch_plugin()` shells out to the runner
- `runner.py` executes the plugin callable

There is no implemented hook dispatcher.
There is no plugin HTTP router.
There is no `on_plan` / `on_analyze` / `on_rewrite` / `on_export` / `on_report` runtime.

## When a Coordinator Becomes Necessary

A true job coordinator is only needed if Black Skies adds:
- durable jobs
- persisted job status and cancellation
- cross-request orchestration
- multi-step background workflows that outlive a single HTTP request
- a single scheduler for shared job state

Until then, `create_app()` plus the service layer is the control plane.

## Architectural Guardrails

- Do not add new control-plane abstractions without a concrete runtime need.
- Do not reintroduce an agent runtime unless the design and implementation exist together.
- Do not duplicate execution-policy, budget, or resilience ownership across layers.
- Keep routers thin.
- Keep services as the owners of execution behavior.
- Keep budget authority centralized in `BudgetService`.
