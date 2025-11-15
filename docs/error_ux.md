# docs/error_ux.md — DRAFT

## Purpose
Define how errors surface across Model Router failures, exports, and snapshot restores so the renderer stays consistent across toasts, inline warnings, and blocking modals.

## Error Tiers
- **Inline warnings:** Non-blocking issues (e.g., budget warning, rubric mismatch) show next to the control alongside an icon and summary.
- **Toasts:** Transient notifications for recoverable errors (Model Router fallback hit, export warning). Toasts should include a “Retry” action when meaningful and link to logs.
- **Blocking modals:** Critical issues (snapshot hash mismatch, unrecoverable export failure, API credentials revoked) require explicit acknowledgment and optionally direct the user to “Open logs” or “Contact support”.

## Model Backend Failures
- For local model faults, show a toast with “Retry Local Critique” plus the ability to fallback to API mode if policy allows (`docs/specs/model_backend.md`).
- For external API rejections, display the budget error toast with details (`BUDGET_EXCEEDED`, quotas).
- Companion Mode suppresses remote error toasts by showing a helper badge (“API blocked in Companion Mode”) instead of raising UX-level alerts.

## Export Failures
- Export builder errors emit blocking modals when artifacts cannot be created; provide “Retry export” and “Open logs” options.
- Partial exports (some artifacts succeed, others fail) show a summary toast referencing `logs/export_diff.log` and list the failed targets in the Export Panel.
- Export telemetry logs each failure event with artifact IDs (not prose content) for diagnostics.

## Snapshot & Restore Failures
- Hash mismatches trigger a blocking warning dialog but still allow “Open anyway” with best-effort restore.
- Journal corruption surfaces a toast with “View Diagnostics” and writes detail to `history/diagnostics/`.
- Retry buttons attempt to rehydrate the last snapshot or rerun the autosave; limit retries to 3 and backoff to prevent loops.

## Retry & Log Hooks
- Toasts include primary actions when retrying makes sense; otherwise they link to an advanced “Open logs” command that opens `logs/app.log` and `logs/backend.log`.
- Errors include trace IDs and may highlight the Project Info panel for advanced debugging.
