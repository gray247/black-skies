# Backup Verification Daemon – Planning Notes (Phase 11, Deferred)
> **Status:** Deferred – Phase 11 backup verification daemon is gated out of v1.1 builds.
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Owner:** Services Team
> **Related Work:** `./architecture.md` (Runtime Services), docs/phases/phase_charter.md (Phase 11 scope)

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
> The daemon is implemented behind a feature flag (`backup_verifier_enabled`) but **disabled in all builds**. Health endpoints return static `warning` status until Phase 11 ships.
- `services/src/blackskies/services/backup_verifier.py` contains the hashing/manifest logic described below, but the scheduler is not started unless the flag is flipped.
- Voice note coverage and dashboard hooks remain aspirational; treat the sections below as a plan rather than shipping behavior.
- Voice note validation only runs when `BLACKSKIES_ENABLE_VOICE_NOTES=1`; the default Phase 8 surface skips any audio/transcript inspection even if assets exist in `history/voice_notes/`.

## Configuration & Runtime Notes
- Settings live in `ServiceSettings`:
  - `backup_verifier_enabled` (default: `false`) toggles the scheduler.
  - `backup_verifier_interval_seconds` controls the base cadence (default: 30 minutes).
  - `backup_verifier_backoff_max_seconds` caps the exponential back-off while idle.
- State file location: `<project_base_dir>/service_state/backup_verifier/backup_verifier_state.json`. This aggregated service file is rehydrated on boot so the daemon can remember past checksum summaries without touching `_runtime`.
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
