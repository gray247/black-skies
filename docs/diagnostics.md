# docs/diagnostics.md — DRAFT

## Purpose
Capture logging, debugging, and redaction policies so analytics, Model Router, and export failures emit consistent artifacts.

## Log Files
- `logs/app.log` (renderer): UI events, toast triggers, instrumentation.
- `logs/backend.log` (FastAPI): HTTP requests, Model Router routing decisions, endpoint errors.
- `logs/model_router_budget.jsonl`: token/cost events for Model Router (per `.perf/` policy).
- `history/diagnostics/*.json`: crash dumps, snapshot errors, plugin audits.

## Content & Levels
- Logs include timestamps, severity (`INFO`, `WARN`, `ERROR`), trace IDs, and event metadata (IDs, counts, budgets).
- The Model Router logs include provider name, tokens_in/out, estimated USD, and policy decisions (Companion Mode block, budget hit).
- Diagnostics events referencing exports, snapshots, or analytics include pointer to `project_id` + `trace_id`.

## Redaction Policy
- Never log raw manuscript text; log IDs, SHA-256 fingerprints, or summary counts instead.
- Export or critique-specific errors reference `inline_notes_count`, not the text itself.
- Telemetry to `.perf/` sums numbers; any textual context is sanitized before writing.

## Dev vs Production
- Dev builds include verbose logs for Model Router decisions and plugin audits.
- Production builds drop debug-level logs and only write `WARN`/`ERROR` plus sanitized `INFO`.
- Toggle for verbose logs exists in `docs/settings.md` (e.g., `logging.verbose: true`).

## Integration
- Error UX (`docs/error_ux.md`) links back to these logs via “View diagnostics” actions in toasts/modals.
- Performance telemetry (`docs/performance_telemetry_policy.md`) references the diagnostics stream for smoothing high-latency events.
