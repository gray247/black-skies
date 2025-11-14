# docs/critique_loop_terminology.md — DRAFT

## Companion Mode
A renderer-only workspace that opens ChatGPT in an isolated pane, disables all Critique automation endpoints, and ensures no writer content leaves the disk.

## Critique Automation
Batch critique runs triggered from the UI (Run All or per-unit buttons) that execute local/model jobs via the `/batch/critique` endpoints while the Overseer enforces budgets and queue semantics.

## Overseer
The orchestration agent that queues jobs, enforces session/project budgets, watches telemetry, and sequences hand-offs between Critique Service and Rewrite Service.

## Run All
UI action that kicks off a batch critique across the current scope (acts/chapters/scenes) and obeys the automation mode (Local vs Local→Model).

## Accept / Rollback
Actions that apply or revert suggested edits from critiques. Accept still honors Ctrl/Cmd+ hotkeys and triggers an Undo toast; rollback operations log the event and preserve the original draft in snapshots.

## Canonical Usage
Use these terms consistently across UI strings, telemetry counters, and docs to avoid ambiguity between manual review, Companion Mode, and automated critique pipelines.
