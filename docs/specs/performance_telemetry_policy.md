# docs/specs/performance_telemetry_policy.md — DRAFT
> **Status:** Draft
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Reference:** Align telemetry targets and collection rules with `./analytics_service_spec.md`.

## Targets
- Local critique: `p50 ≤ 1.5s/scene`, `p95 ≤ 4s`.
- Export (MD only): `p50 ≤ 10s/100k words`.
- Snapshot write: `≤ 150ms per unit`.

## Collection
- Event stream is persisted to `.perf/` as JSONL within the project.
- No telemetry leaves disk; users can purge the `.perf/` folder from Settings.

## Red Lines
- If any p95 exceeds the target ×2 within a session, show a “Performance Degraded” toast and recommend toggling to Local-only mode.
