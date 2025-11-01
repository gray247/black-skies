# Changelog

## [1.0.0-p9] - Unreleased
### Added
- `/api/v1/analytics/summary` endpoint with cached pacing/emotion/conflict metrics.
- Voice notes recording + transcription pipeline (local/external providers) with budgeting hooks.
- Plugin sandbox registry and audit trail, plus docking UI (feature-flagged) for layout customization.

### Changed
- Release process documentation and support playbook for Phase 9 readiness.
- API documentation refreshed to cover analytics, voice notes, rewrite/accept payload updates.

### Notes
- **TODO:** finalise release date and verification checklist prior to tagging `v1.0.0-p9`.

## [1.0.0-rc1] - 2025-10-10
- Freeze service and package versions for the release candidate.
- Document deliverable coverage for P7 and confirm smoke/offline workflows.
- Retire unversioned `/healthz`, `/metrics`, `/outline`, and `/draft/*` shims in favor of `/api/v1` endpoints; refresh tests,
  tooling, and docs accordingly.

## [1.0.0+phase1] - 2025-09-29
- Phase 1 wrap-up release. Aligns package metadata and prepares artifacts for distribution.
