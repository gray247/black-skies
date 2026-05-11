# Phase 13 Pass 20 - Offline Authority Matrix Validation

## Goal
Prove the locked authority matrix under offline conditions.

## Local-Only Controls
These stay usable when the backend is offline, as long as the target paths exist:
- Snapshots panel open
- Open report file
- Reveal
- Manifest
- Refresh status

## Backend-Required Controls
These disable cleanly or fail clearly when services are offline:
- Snapshot
- Run verification
- Re-run verification for this snapshot
- Create backup
- Restore backup
- Restore latest ZIP as copy

## Meaning of `Writing tools offline`
`Writing tools offline` is the shared bridge/service-health state. It does not mean local snapshot browsing is broken. It means backend-mutating operations are unavailable until the service bridge returns.

## What Was Proven
- Offline state does not poison local snapshot browsing.
- Backend-gated controls are disabled rather than pretending to work.
- Local report browsing remains available independently of backend health.
- The snapshots panel still shows the local browsing surface even when service health is degraded.

## Evidence
- Renderer offline coverage for local report browsing and backend-disabled controls.
- App-level snapshot verification coverage.
- Playwright GUI flow using the snapshot harness.
- Backend regression tests for snapshot and verifier routes.

## Validation
- `pnpm --filter app test`
- `pnpm --filter app lint`
- `pnpm --filter app run build:production`
- `pnpm --dir app exec playwright test tests/e2e/gui.snapshot_verification_flow.spec.ts -c ./playwright.config.ts`
- `pnpm test:truth`
- `pytest services/tests/test_snapshot_endpoints.py services/tests/test_backup_verifier_report.py services/tests/test_backup_snapshot_regressions.py`

## Residual Risk
- The offline matrix is much clearer, but human operator verification is still pending.

