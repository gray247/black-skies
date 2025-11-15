# docs/phases/phase9_11_testplan.md — DRAFT
> **Status:** Draft
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Source of Truth:** `docs/phases/phase_charter.md` defines the Phase 9/11 scope; sync test coverage to that charter.

## Strategy
Blend Playwright, backend service mocks, and golden text diff comparisons to cover Critique automation, recovery, and export scenarios introduced in Phases 9–11.

## Suites
- **Critique Automation:** Batch 10 scenes (local-only) and assert status pills, counters, durations, and queue-to-run transitions. Include the Local→Model path with an explicit budget cap hit to confirm UI blocks and logs correctly.
- **Recovery:** Dirty edit + forced crash → relaunch → verify the restore prompt, caret position, and pane layout are recovered. Simulate hash mismatches to show the warning and safe open path.
- **Export:** Generate MD/JSON/PDF/EPUB artifacts, confirm their existence, validate SHA-256, and assert Markdown outputs contain zero inline critique notes. Run `scripts/export_diff.py` against a golden baseline for the Markdown artifact.
- **Telemetry Assertions:** Ensure `critique.accept_rate` stays between 0–100, durations are captured, and no PII is emitted. Validate telemetry counters from `docs/specs/performance_telemetry_policy.md` appear in the JSONL stream.
- **Visuals & Analytics:** `POST /api/v1/analytics/build` and `/api/v1/analytics/refresh` respond within budget and update cache files. Validate coverage heatmap, critique trendline, and Relationship Graph rendering (heatmap intensities match rubric coverage; clicking data points navigates to the correct scene and filters notes).
