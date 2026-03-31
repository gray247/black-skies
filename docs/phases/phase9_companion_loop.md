Status: Deferred
Version: 1.0
Last Reviewed: 2026-03-31

# Phase 9 Companion Loop

This is a deferred design note, not Phase 9 scope.

Current runtime facts:
- there is no Overseer component
- there is no `/batch/critique` job API
- critique and rewrite are handled through service endpoints, not a durable batch queue
- the UI may present batch-like actions, but the backend does not implement queued job lifecycle semantics

If a future batch system is ever added, it will need:
- durable job IDs
- job status persistence
- explicit cancellation
- queue ownership
- budget enforcement at the job coordinator layer

Until then, this file is only an architecture sketch and should not be read as the Phase 9 plan.
