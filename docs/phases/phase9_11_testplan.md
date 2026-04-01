Status: Draft
Version: 1.1
Last Reviewed: 2026-03-31
Source of Truth: `docs/phases/phase_charter.md` defines the phase sequence. Phase 9 test coverage should follow the analytics charter, not the old companion-loop story.

# docs/phases/phase9_11_testplan.md - DRAFT
> Implementation trace: `docs/roadmap.md` -> phases 9/11 rows.

## Strategy
Cover the analytics and visualization surfaces with service-level tests, GUI render tests, and endpoint contracts. Keep the plan service-first and do not assume a job coordinator or agent runtime.

## Phase 9 Suites
- **Analytics payloads:** Validate emotion arc, pacing curve, conflict heatmap, intensity timeline, and project health payloads from the analytics service layer.
- **Outline validation:** Verify outline validation errors, diagnostics, and success paths against representative project data.
- **GUI rendering:** Assert the analytics drawer, dashboard cards, and insight surfaces render the expected data without requiring a new control plane.
- **Telemetry assertions:** Check that analytics metrics emit the expected counters and do not leak PII.

## Phase 11 Suites
- **Plugin sandbox:** Test the entrypoint subprocess model only.
- **Backup verification:** Validate the feature-flagged backup verifier state and health payloads.
- **Optional wrappers:** Keep support-only wrapper tests isolated in `blackskies.services.test_support`.

## Done When
- Phase 9 tests cover the analytics contract and do not require batch/job semantics.
- Phase 11 tests stay confined to plugin sandbox and support-only wrapper behavior.
- The test plan never claims a job coordinator, background worker, or hook dispatcher that the code does not implement.
