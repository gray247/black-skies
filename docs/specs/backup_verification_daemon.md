Status: Active (Feature-flagged runtime service)
Version: 1.0.1
Last Reviewed: 2026-03-31
Owner: Services Team

# Backup Verification Daemon

This document describes a real backend service that exists in the repo.

Related runtime code:
- `services/src/blackskies/services/backup_verifier.py`
- `services/src/blackskies/services/scheduler.py`
- `services/src/blackskies/services/app.py`

## What Exists Today

`BackupVerificationDaemon` is implemented and `create_app()` wires it when `backup_verifier_enabled` is true.

`VerificationScheduler` is also started from the app factory.

If the feature flag is off, the app exposes a warning state instead of starting the daemon.

## Current Behavior

The daemon:
- verifies snapshot and backup integrity
- updates a persisted state file
- emits diagnostics and health state
- runs on a background task when enabled

What it does not do:
- it does not ship a separate UI
- it does not require a future Phase 11 rewrite to exist
- it does not imply a job queue or Overseer

## Operational Notes

- default state is off
- the app still knows about the daemon state when it is disabled
- health endpoints should report the disabled/warning state clearly

## Future Work

If support wants richer dashboard wiring or alerting, that should be documented as an incremental follow-up, not as a prerequisite for the daemon existing.
