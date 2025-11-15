# docs/phases/phase9_companion_loop.md — DRAFT
> **Status:** Draft
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Source of Truth:** Phase 9 scope lives in `docs/phases/phase_charter.md`; align this companion loop plan with that charter.

## Scope
Automate critique reviews at the scene or chapter level with Overseer-driven orchestration, strict privacy isolation, and Critique Pane toggles that show each batch’s progress and status.

## Roles
- **Overseer:** queues critique work, enforces token budgets, throttles retries, and watches telemetry/budget telemetry for health and policy violations.
- **Critique Service:** executes `/draft/critique` jobs, honoring the local-first run mode before falling back to remote models, and writes per-unit summaries/edits.
- **Rewrite Service:** applies accepted edits via `/draft/rewrite` or the batch-level `/batch/rewrite/apply`, tracks failures, and emits audit-safe logs.
- **Renderer (Critique Pane):** surfaces automation controls, per-unit pills, diffs, telemetry badges, and accept/rollback actions while staying responsive.

## States (Critique Pane)
- Idle (awaits work)
- Queued (batch acknowledged)
- Running (local) → Queued (model) → Running (model) → Results → Applied → Idle for a successful run
- Failed (local) / Failed (model) → Idle with toast + log
- Automation controls always show soft and hard budget bars, per-unit status pills, and aggregate counters when the pane has focus.

## Endpoints (extends `docs/specs/endpoints.md`)
Batch critique exposes `/batch/critique` (start) and `/batch/critique/{job_id}` (status/results), while the rewrite acceptance path uses `/batch/rewrite/apply`. Each contract provides job identifiers, queue status, per-unit summaries/counts, and success/failure tallies so the Critique Pane can render progress without leaking writer content.

## Budgets & Privacy
Runs default to local-only. Model queues require an explicit toggle in the UI, surface a cost estimate tooltip, and are prevented if the session’s soft cap or the project-level hard daily cap would be exceeded (soft cap shows a toast; hard cap stops the request outright).

Token budgets are tracked per session and per project; surpassing the hard cap logs the guardrail and surfaces a toast explaining why the batch was blocked.

Companion Mode keeps writer content on disk and never exports it to a remote model; if Companion Mode is active, automation toggles and endpoints remain disabled and the Critique Pane only permits manual inspection.

## Telemetry (see `docs/specs/performance_telemetry_policy.md`)
- `critique.queue_time_ms`
- `critique.local_duration_ms`
- `critique.model_duration_ms`
- `critique.notes_per_kword`
- `critique.accept_rate`
- `rewrite.apply_latency_ms`

All metrics are anonymized, project-scoped, and written to the local `.perf/` stream; no telemetry leaves disk in Companion Mode.

## GUI Wiring (see `docs/gui/gui_layouts.md`)
- Automation Toggle (Local / Local→Model)
- Run All button plus Stop controls on the Critique Pane toolbar
- Status pills per unit + aggregate counters for Queued / Running / Blocked
- Budget bar with soft/hard indicators
- Safety wiring honors Ctrl/Cmd+ Accept with an Undo toast and Rollback path when needed

## Acceptance
1. A batch run of 20 scenes (local-only) completes within N minutes without freezing the Critique Pane.
2. Model queue is opt-in, respects the hard budget, and shows visible cost/budget counters.
3. Accept/Rollback flows remain undoable, logged, and reload without sending content off-disk when Companion Mode is on.
