# Phase 4 Defect Fixes — 2026-04-28

## Phase 4.5A — Service Defect Cleanup Investigation

## Root Cause
- The failing analytics-disabled assertion in `services/tests/test_app.py` was using a stale disable path.
- Current service behavior keys analytics off `BLACKSKIES_ANALYTICS_MATURITY=off`; deleting the old `BLACKSKIES_ENABLE_ANALYTICS` env var no longer disables the route.
- The service test fixture was also inheriting the checked-in repo `.env`, which introduced routing drift into contract validation.
- A draft critique snapshot was stale as well: `services/tests/contracts/draft_critique.json` was missing the `provenance` block that the live route now returns.

## Files Changed
- `services/tests/test_app.py`
- `services/tests/conftest.py`
- `services/tests/contracts/draft_critique.json`

## Exact Fix
- Updated analytics-disabled tests to set `BLACKSKIES_ANALYTICS_MATURITY=off` instead of relying on the removed legacy toggle.
- Disabled repo `.env` loading inside the service test fixture so local test runs do not inherit production-like routing secrets/config.
- Added the missing `provenance` block to the draft critique contract snapshot so the test matches current route behavior.

## Commands Run
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q -x`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q`
- `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`

## Results
- `services/tests/test_app.py`: `64 passed`
- `mypy`: baseline unchanged (`175 errors in 49 files (checked 346 source files)`)
- `startup_authority_contract.spec.ts`: `11 passed`
- `pnpm test:e2e -- --workers=1`: `3 passed`

## Remaining Risks
- The service layer still has unrelated baseline typing debt.
- The broader repo still carries known deferred warnings tracked elsewhere (dock layout, `NO_COLOR`/`FORCE_COLOR`).

## Phase 4.1 — EADDRINUSE Harness Stability

## Root Cause
- `scripts/e2e-with-backend.mjs` treated any occupied `127.0.0.1:9999` as a hard failure before backend launch.
- That collapsed two different conditions into one failure:
  - healthy backend already running (reusable)
  - stale/unexpected process owning the port (real conflict)
- Teardown logic also did not explicitly scope cleanup to launcher-owned backend processes.

## Files Changed
- `scripts/e2e-with-backend.mjs`

## Exact Fix / Classification
- Added startup port-occupancy classifier:
  - `PORT_OCCUPIED_REUSING_HEALTHY_BACKEND` when `/api/v1/healthz` on `127.0.0.1:9999` is healthy.
  - `PORT_CONFLICT_STALE_OR_UNEXPECTED_SERVICE` when port is occupied but health check fails/non-200.
- Updated preflight behavior:
  - if port is free: launch backend normally.
  - if port is occupied and healthy: reuse existing backend (do not spawn second backend).
  - if port is occupied and unhealthy: fail fast with explicit stale/conflict diagnostics.
- Hardened teardown semantics:
  - track whether backend was started by launcher.
  - only terminate launcher-owned backend.
  - SIGTERM first, bounded wait, then SIGKILL fallback for orphan prevention.

## Commands Run
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`

## Results
- Targeted contract spec run: `11 passed`.
- Smoke lane run (`pnpm test:e2e -- --workers=1`): `3 passed`.
- No EADDRINUSE failure observed in these validation runs post-fix.

## Remaining Risk
- Port `9999` is still fixed by contract for current harness tooling; heavy parallel/local overlap can still create real contention from unrelated external processes.
- Warnings remain non-blocking and deferred:
  - Electron CSP warning
  - Dock layout warning
  - `NO_COLOR`/`FORCE_COLOR` warning



## Phase 4.6 — Stabilization Proof Checkpoint

## Validation Summary
- `services/tests/test_app.py -q`: passed (`64 passed`)
- `startup_authority_contract.spec.ts` targeted lane: passed (`11 passed`)
- `pnpm test:e2e -- --workers=1`: passed (`3 passed`)
- `mypy` baseline unchanged (`175 errors in 49 files (checked 346 source files)`)

## Advisory Baseline
- `pip_audit`: `3 known vulnerabilities in 2 packages`
- `pnpm audit`: `63 vulnerabilities found` (`4 low | 24 moderate | 35 high`)

## Current Deferred Risks
- `pip` advisories remain environment/bootstrap tooling debt.
- `starlette` advisory remains runtime-sensitive and blocked by current FastAPI pin.
- `NO_COLOR`/`FORCE_COLOR` warning still appears in direct Playwright and smoke runs.
- Dock layout warning remains a safe-fallback compatibility warning.
- Repo-wide typing debt remains outside the current service fix lane.

## Decision
- Reopen dependency/security remediation with the above baseline preserved.
