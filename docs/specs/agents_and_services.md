Status: Active
Version: 1.1.0
Last Reviewed: 2026-03-31

# Agents and Services

This document is the compatibility note for service orchestration, test-support wrappers, and the current plugin implementation.

Canonical control-plane details live in [`control_plane.md`](./control_plane.md).

## Current Runtime

Black Skies is service-first.

The runtime uses services for real work:
- `CritiqueService`
- `DraftGenerationService`
- `LongFormExecutionService`
- rewrite and accept services under `services/src/blackskies/services/operations/`
- recovery services and trackers
- export services
- analytics services
- backup verification services

There is no production `Overseer`.
There is no production `AgentOrchestrator`.

## Test-Support Wrappers

The codebase does contain support-only wrappers under `blackskies.services.test_support`:
- `BaseAgent`
- `OutlineAgent`
- `DraftAgent`
- `RewriteAgent`
- `CritiqueAgent`
- `AgentOrchestrator`

These wrap worker callables and add local retry/backoff behavior.

They are not wired into the production app factory, so they should be treated as test-support code, not the runtime architecture.

## Services And Boundaries

Services should own the actual operation they implement.

Examples:
- `ModelRouter` handles provider selection and routing policy
- `BudgetService` owns budget state, classification, and blocked/allowed decisions
- `ServiceResilienceExecutor` owns service-level retry/timeout/circuit policy
- `ExecutionPolicyRunner` owns the shared retry/timeout loop for draft generation and long-form adapter calls
- `ToolRunner` owns tool/plugin boundary resilience
- routers validate requests and map errors

That is the current boundary. Do not move business logic into a fake orchestration layer just to match old naming.

## Plugin Reality

The current plugin implementation is entrypoint-based.

The actual code is:
- `services/src/blackskies/services/plugins/registry.py`
- `services/src/blackskies/services/plugins/host.py`
- `services/src/blackskies/services/plugins/runner.py`

It does the following:
- stores plugin manifests
- validates plugin IDs and manifest structure
- launches a subprocess
- executes a single callable entrypoint

It does not do the following:
- expose a plugin HTTP router
- dispatch hook names like `on_plan`
- orchestrate plugin lifecycles as a first-class job system
- implement the dashboard/plugin API surface described in older planning docs

## Deferred Hook Design

The hook names in older docs:
- `on_plan`
- `on_analyze`
- `on_rewrite`
- `on_export`
- `on_report`

are future design only.

They do not exist in runtime code today, so they should not be described as shipping behavior.

## What To Call What

Use these terms consistently:
- service = a concrete business-logic boundary with persistence or workflow ownership
- agent = a support-only worker wrapper in `blackskies.services.test_support`
- orchestrator = a support-only coordination facade in `blackskies.services.test_support`
- plugin = an entrypoint-based sandboxed extension

Do not use `agent` for routers, request models, queues, or model routing policy.
