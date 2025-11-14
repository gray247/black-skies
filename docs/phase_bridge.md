# docs/phase_bridge.md — DRAFT

## Purpose
Clarify how to transition from locked Phase 8 into Phases 9–11 by calling out explicit gates, risks, and rollback paths for the automation, recovery, and export initiatives.

## Gates
- **Phase 9** begins once the Critique automation endpoints and GUI toggles are merged behind a feature flag so testers can exercise local/model flows without touching production defaults.
- **Phase 10** starts when the snapshot schema, autosave cadence, and recovery harness are verified in the test framework (including the hash validation path) so rollbacks are predictable.
- **Phase 11** starts once the async export builder job exists, template cleaning rules are documented, and the Markdown cleanup has been proven via golden outputs.

## Risks & Mitigations
- **Budget overruns:** enforce hard caps, preview cost toasts, and disallow model queues when budgets are exhausted. Track via `critique.queue_time_ms` + budget metrics.
- **Snapshot bloat:** prune to 20 compressed snapshots after 50 uncompressed, log pruning events, and keep gzip thresholds tunable to avoid disk spikes.
- **Export regressions:** verify MD/JSON/PDF/EPUB outputs against golden masters and include automated checksum comparisons in CI.
