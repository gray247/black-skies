# Phase 9 Charter — Analytics & Stability
**Status:** Draft • 2025-11-05  
**Version:** v1 (Phase 9)

This charter mirrors the structure of `docs/phase_charter.md` and captures the Phase 9 focus areas—bringing analytics online while tightening API contracts, revision safety, and GUI stability. It names what Phase 9 will ship, what remains deferred, and the gates/tests required before we graduate to later phases.

## Scope
- **Analytics Service & Dashboards:** Deliver the analytics service, cached payloads, exports, and GUI surfaces (insights drawer, Story Insights, Project Health) once tooling, budgets, and data model stability are confirmed. Tie the service into the renderer via guarded API calls and ensure exports/heuristics update in step.
- **API/Data Model Schema Validation:** Harden every endpoint contract (DraftUnit, outline, revisions, critique, exports) with explicit schema validation, rate/concurrency guidance, error codes, guardrails for large payloads, and consistent metadata fields aligned with `docs/data_model.md`.
- **Revision & History Integrity:** Enforce consistent naming, duplicate detection, revision folder cleanup/rotation, checksum verification, and snapshot/recovery policies so automated merges/restores behave predictably.
- **GUI/UX Stability & Cleanup:** Align the renderer/pane docs with shipping features, finalize offline/reconnect semantics, remove deferred docking/hotkeys from the default experience, and clarify heuristics/insights that rely on analytics data.

## Out of Scope
- **Exports beyond Phase 9 concepts:** Advanced export templates (Pandoc/DOCX/EPUB), analytics appendices, or dynamic badge injection remain Phase 10+ territory.
- **Plugin sandboxing & agent host (Phase 11):** The plugin/agent runner, sandbox guarantees, and doc hooks stay gated behind `BLACKSKIES_ENABLE_PLUGINS` and are tracked under later phases.
- **Voice notes/transcription:** Voice-recording fixtures, transcription services, or voice-related dashboards remain deferred per Phase 8 gating.

## Deliverables
- **User-facing:**  
  * Analytics drawer/insights with emotion arc, pacing, conflict, and project health metrics powered by analytics endpoints and cached JSON (`analytics/scene_metrics.json`, `analytics/critique_scores.json`, `analytics/graph.json`).  
  * Export bundles that optionally include analytics summaries when `BLACKSKIES_ENABLE_ANALYTICS=1`, plus telemetry-safe metadata.  
  * Revision/restore UX updates: clearer snapshot previews, consistent hotkeys/tooltips, and offline banner behaviors matching actual status.
- **Internal:**  
  * Hardened schema enforcement for `/draft/generate`, `/draft/critique`, `/outline/build`, and export metadata with fenced error codes + rate/concurrency guidance.  
  * Revision folder policies: naming, duplicate detection, rotation, checksum audits, tamper detection for snapshots/history.  
  * Analytics service readiness: service orchestrations, diagnostics, resilience guards, and budget/analytics error handling.

## Acceptance Criteria
- Analytics endpoints `/api/v1/analytics/*` only succeed when the service flag is enabled; disabled builds return 404.  
- All relevant exports drop analytics payloads when analytics is disabled and supply guarded metadata when enabled.  
- Schema validation errors surface `VALIDATION` payloads with consistent details; there is no uncaught crashing via broad `except Exception`.  
- Revision/store integrity improves: snapshots include checksums, revision folder policies prevent orphaned files, and restore flows show previews/diff prompts.  
- GUI docs/hotkeys/offline signals match the actual renderer (no undocumented docking or hotkeys) and offline banners follow the service health contract from Phase 8.

## Testing Requirements
- Regression suites should cover analytics gating (`pnpm --filter app exec playwright test --grep "analytics"`), export behaviors (`pytest services/tests/test_app.py -k export`), and schema-enforced endpoints (`pytest services/tests/test_app.py -k validation`).  
- Add spec regression for revision integrity (duplicate ID detection, merge/split sequences) and snapshot restore flows.  
- GUI Vitest/Playwright tests should verify offline banner/reconnect behavior, insights drawer fallback states, and analytics flag interactions.

## Risks & Mitigations
- **Analytics timing/performance:** Budgets + analytics builds may delay responses. Mitigate with circuit breakers/resilience executors and phase gate analytics exports behind `BLACKSKIES_ENABLE_ANALYTICS`.  
- **Schema migration drift:** Tightening schemas may break older projects. Publish schema diffs, use clear version tags in payloads, and provide migration helpers before rolling out.  
- **Revision corruption:** New policies may surface legacy files. Add diagnostics/logging (including the redacted diagnostics infrastructure from Phase 8) and run offline health checks during any schema rollout.

## Optional / Future Themes (Phase 10+)
- Advanced exports (Pandoc, DOCX/EPUB, template plugins)  
- Plugin sandbox hardening + agent host automation  
- Voice note recording/transcription and voice analytics  
