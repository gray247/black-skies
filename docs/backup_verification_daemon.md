# Backup Verification Daemon – Planning Notes (Phase 11)
**Status:** In progress (T-9142) · 2025-10-07  
**Owner:** Services Team  
**Related Work:** docs/architecture.md (Runtime Services), docs/phase_charter.md (Phase 11 scope)

## Goal
Guarantee that project snapshots and history archives remain readable. The daemon should routinely verify backups, surface corruption early, and expose status for dashboards/support tooling.

## Key Outcomes
1. Detect corrupted or missing snapshots within 15 minutes of creation.
2. Emit diagnostics + structured events consumable by the P11 dashboards.
3. Provide a CLI hook (`scripts/verify_backups.py`) and service health endpoint for support automation.

## Functional Requirements
- **Scope:** `.blackskies/history/snapshots/` archives + voice note audio/transcripts.
- **Verification cadence:** configurable (default every 30 minutes) with exponential back-off when idle.
- **Checks:** checksum validation (sha256), manifest completeness, ability to extract a random sample file.
- **Reporting:** write structured diagnostics (`history/diagnostics/backup_verifier_*.json`) and update a shared state file summarising last run/last failure.
- **Alerting hooks:** emit `/api/v1/healthz` extension flag (`"backup_status": "ok|warning|error"`) and send structured log events for support ingestion.
- **Failure remediation:** attempt single automatic retry; if still failing, mark snapshot as suspect and notify dashboard/support.

## Current Implementation Snapshot (2025-10-28)
- `services/src/blackskies/services/backup_verifier.py` now computes SHA-256 digests for every file within a snapshot and compares them to the previously recorded checksum (stored in `_runtime/backup_verifier_state.json`). Deltas surface as `"checksum mismatch"` issues.
- Snapshot manifests are parsed (YAML or JSON) and validated against `metadata.json`, ensuring includes/drafts resolve and that a deterministic sample file can be opened without IOError.
- Voice note archives (`history/voice_notes`) are checked for transcript/audio parity and schema validity. Missing or unreadable artefacts raise `"transcript missing"` / `"audio file missing"` diagnostics.
- Health responses expose the extended payload: `backup_checked_snapshots`, `backup_failed_snapshots`, `backup_voice_notes_checked`, and `backup_voice_note_issues`, alongside the human-readable status message.
- Project-level diagnostics emitted under `history/diagnostics/BACKUP_VERIFIER_*.json` capture per-snapshot checksums, retry flags, and voice note issue summaries for support review.

## Configuration & Runtime Notes
- Settings live in `ServiceSettings`:
  - `backup_verifier_enabled` (default: `false`) toggles the scheduler.
  - `backup_verifier_interval_seconds` controls the base cadence (default: 30 minutes).
  - `backup_verifier_backoff_max_seconds` caps the exponential back-off while idle.
- State file location: `<project_base_dir>/_runtime/backup_verifier_state.json`. This file is rehydrated on service boot to retain checksum history.
- Operational hooks:
  - `/api/v1/healthz` provides the quick status for dashboards.
  - Structured diagnostics accumulate under `<project>/history/diagnostics/` with `BACKUP_VERIFIER_OK|ERROR` codes.
  - Support tooling can tail the state file for per-snapshot checksum deltas without re-reading archives.

## Enablement Plan
1. **Phase 11 staging (T-9142.1):** Flip `backup_verifier_enabled: true` in the staging configuration once dashboard consumers ingest the new health fields. Run the daemon for one full cycle to seed baseline checksums.
2. **Production rollout (T-9142.2):** After two green staging cycles and dashboard validation, enable the flag in production runtime configs. Document the change in the release checklist.
3. **Post-enable monitoring:** Watch for `BACKUP_VERIFIER_ERROR` diagnostics; support should acknowledge each new entry and, if necessary, quarantine affected snapshots manually until automated remediation lands.

## Architecture Sketch
```text
┌─────────────────────────┐
│ Backup Verification Task│
├─────────────────────────┤
│ Scheduler (async)       │
│ Snapshot walker         │
│ Checksum + manifest     │
│ Voice note validator    │
│ Metrics/diagnostics     │
└─────────────────────────┘
           │ emits
           ▼
┌─────────────────────────┐
│ Diagnostics Logger      │
│ (history/diagnostics)   │
└─────────────────────────┘
           │ updates
           ▼
┌─────────────────────────┐
│ Service state cache     │
│ (fast API dependency)   │
└─────────────────────────┘
```

## Task Breakdown
1. **Service skeleton**
   - Implement `backup_verifier.py` with pluggable storage adapters.
   - Add scheduler bootstrap in `services/src/blackskies/services/app.py` (Phase 11 feature flag).
2. **Checksum + manifest audit**
   - Generate and persist manifests at snapshot time (dependency on DraftAccept pipeline).
   - Verify file counts, hashes, and expected metadata.
3. **Voice note coverage**
   - Extend verification to `history/voice_notes/*`.
   - Validate JSON transcript schema.
4. **Diagnostics + metrics**
   - Emit structured diagnostics and update `ServiceDiagnostics` state for dashboards.
   - Expose `/api/v1/backup/status` (Phase 11) or extend health payload.
5. **CLI & integration tests**
   - Add `scripts/verify_backups.py` for on-demand runs.
   - Integration tests covering corrupted snapshot, missing file, and successful run.
6. **Documentation**
   - Update support playbook + release checklist once implementation lands.

## Open Questions
- Do we quarantine suspect snapshots or delete them automatically?
- Should the daemon pause verification while large exports run?
- How do we handle encrypted backups (future scope)?

## Dependencies
- Snapshot manifests emitted during accept/export flows.
- Phase 11 dashboards to consume new status metrics.
