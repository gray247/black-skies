# Phase 13 Pass 18 - Snapshot/Report Authority + Freshness

## Goal
Prove the snapshot/report surface as an authority chain, not a button inventory.

## Authority Proven
- `Open report file` uses the canonical report path under `.snapshots/last_verification.json`.
- `Reveal` uses the canonical snapshot folder path for the selected snapshot.
- `Manifest` uses the canonical manifest path under the selected snapshot folder.
- Missing report, snapshot, or manifest paths surface controlled renderer feedback instead of silent failure.
- `Refresh status` rereads current local/service state.
- `Re-run verification for this snapshot` performs a backend write/read cycle and refreshes the mounted panel.
- A newly created snapshot appears in the mounted panel without reopening the app.
- Newest ordering is visible in the panel after create.
- The status label and details modal stay readable and reflect the current verification state.

## What Was Checked
- Renderer coverage:
  - snapshot details modal readability
  - re-run verification state refresh
  - mounted panel refresh after create
  - local-only report/reveal/manifest authority
- Playwright coverage:
  - create snapshot from the workspace action
  - refresh and rerun on the mounted snapshots panel
  - report/details modal readability
- Backend coverage:
  - snapshot creation endpoints
  - backup verifier report persistence
  - snapshot regression paths
- Truth lane:
  - kept narrow and limited to the backend report persistence claim

## Evidence
- `pnpm --filter app test -- renderer/__tests__/AppSnapshotsVerification.test.tsx renderer/__tests__/AppPreflight.test.tsx`
- `pnpm --filter app test`
- `pnpm --dir app exec playwright test tests/e2e/gui.snapshot_verification_flow.spec.ts -c ./playwright.config.ts`
- `pytest services/tests/test_snapshot_endpoints.py services/tests/test_backup_verifier_report.py services/tests/test_backup_snapshot_regressions.py`
- `pnpm test:truth`

## Residual Risk
- The row-level file-browser authority is now better covered, but the GUI flow still leans on the renderer tests for the canonical path assertions.
- The snapshot/report surface is improved, but Phase 13 is not closure-grade yet.

