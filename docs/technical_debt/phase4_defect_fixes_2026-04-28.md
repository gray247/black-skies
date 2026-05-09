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

## Phase 4.9 - CI-Red Recovery Pass

## Root Cause
- CI Black lane failed because formatting drift accumulated (`23 files would be reformatted`), and formatter target compatibility with CI Python 3.11 was not explicitly pinned.
- DockWorkspace unit tests failed due a timer cleanup mismatch in `usePaneBoundsLogger.ts` under Vitest/jsdom timer shims:
  - a requestAnimationFrame handle can be timeout-backed in tests,
  - cleanup used `cancelAnimationFrame(...)` only and raised `Cannot clear timer: timer created with setTimeout() but cleared with cancelAnimationFrame()`.

## Files Changed
- `pyproject.toml`
- `app/renderer/components/docking/usePaneBoundsLogger.ts`
- black reformat set (23 files):
  - `scripts/find_latest_run.py`
  - `scripts/pytest_repo_temp_compat.py`
  - `scripts/run_service_truth.py`
  - `scripts/check_roadmap_vs_phase_log.py`
  - `services/src/blackskies/services/analytics/text_utils.py`
  - `scripts/eval.py`
  - `services/src/blackskies/services/analytics_stub.py`
  - `services/src/blackskies/services/memory_prototype/task_packet_assembler.py`
  - `scripts/verify_gauntlet.py`
  - `services/src/blackskies/services/routers/phase4.py`
  - `services/src/blackskies/services/memory_lab/resolver.py`
  - `services/src/blackskies/services/memory_lab/storage.py`
  - `services/tests/test_draft_read_endpoint.py`
  - `services/tests/test_e2e_synthetic_switch.py`
  - `services/tests/prototype/test_memory_non_mutation.py`
  - `services/tests/test_integrity_validator.py`
  - `services/tests/test_export_consistency.py`
  - `services/tests/unit/test_e2e_seam_metadata.py`
  - `services/tests/test_gui_bridge_contracts.py`
  - `services/tests/unit/test_diagnostics.py`
  - `services/tests/unit/test_config.py`
  - `services/tools/check_startup.py`
  - `services/tests/unit/test_project_export_service.py`

## Exact Fix
- Black config:
  - set `[tool.black] target-version = ["py311"]` in `pyproject.toml`.
  - executed full format + check.
- Timer cleanup:
  - retained `cancelAnimationFrame(frame)` as primary cleanup.
  - added a narrow fallback to `clearTimeout(frame)` when timer shim behavior throws in tests.

## Commands Run
- `.\.venv\Scripts\python.exe -m black .`
- `.\.venv\Scripts\python.exe -m black --check .`
- `pnpm --filter app test -- DockWorkspace`
- `pnpm lint`
- `pnpm --filter app run build:production`
- `pnpm test:e2e -- --workers=1`
- `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`

## Results
- Black check: passed (`362 files would be left unchanged`).
- DockWorkspace test slice: passed (`7 passed`).
- `pnpm lint`: passed.
- `build:production`: passed.
- e2e smoke lane: passed (`3 passed`).
- mypy: passed (`Success: no issues found in 346 source files`).
- backend app tests: passed (`64 passed`).
- contract lane: passed (`11 passed`).

## Remaining CI Warnings
- `NO_COLOR` / `FORCE_COLOR` warning remains (known deferred environment-level warning).
- Dock layout warning remains (known deferred compatibility warning with safe fallback).

## CI-Red App Unit Recovery Pass (2026-04-29)

## Workflow Commit Check
- failing workflow inspected: `https://github.com/gray247/black-skies/actions/runs/25136317998`
- workflow commit SHA: `d2b50a8ee9fbf33784e860040c8836b5c52ea106`
- local `HEAD`: `8d154c8064011f63772cf9014b6e87db0d2ac9e7`
- conclusion: reported app-unit failures were on an older workflow commit than current local branch state.

## Reproduction Results (Targeted Failing Slices)
- `pnpm --filter app test -- StoryInsightsRegression`: `6 passed`
- `pnpm --filter app test -- DraftEditor`: `3 passed`
- `pnpm --filter app test -- AppPreflight`: `12 passed`
- `pnpm --filter app test -- AnalyticsDashboard`: `1 passed`

## Failure Classification
- `StoryInsightsRegression.test.tsx`:
  - classification: stale CI expectation from older workflow commit.
  - local status on current head: pass.
- `DraftEditor.test.tsx` (`sample_project/Esther_Estate/drafts/sc_0001.md`):
  - classification: fixture-materialization/commit-drift issue on workflow commit, not current local head.
  - local status on current head: pass (fixture present through current fixture contract).
- `AppPreflight.test.tsx` (`show snapshots` button):
  - classification: stale UI expectation on older workflow commit.
  - local status on current head: pass.
- `AnalyticsDashboard.test.tsx` (`Easy` label):
  - classification: stale assertion path on older workflow commit.
  - local status on current head: pass.

## Fix Outcome
- no source code edits required in this pass.
- no test loosening applied.
- no runtime behavior changes applied.
- this pass establishes that failures are not reproducible on current branch head and align with commit drift between workflow run SHA and local HEAD.

## CI-Red Runtime Truth Import Fix (2026-04-29)

## Root Cause
- CI failure: `ModuleNotFoundError: No module named 'tools'` while running `pytest -q services/tests/unit/test_runtime_truth.py`.
- the test imports `tools.runtime_truth.build_runtime_truth` and relies on repository-root module visibility.
- local runs passed on current head because local test bootstrap context already resolved repo-root imports; CI needed explicit repo-root path for this targeted step.

## Exact Fix
- workflow-only surgical change in `.github/workflows/eval.yml`:
  - `Validate runtime truth ledger` step changed from:
    - `pytest -q services/tests/unit/test_runtime_truth.py`
  - to:
    - `PYTHONPATH=. pytest -q services/tests/unit/test_runtime_truth.py`
- no runtime code changes, no dependency changes, no test loosening.

## Other Workflow Pytest Commands
- checked other pytest invocations in `eval.yml`.
- only the dedicated runtime-truth step directly depends on `tools.runtime_truth` import path.
- no additional PYTHONPATH change applied in this pass to keep scope minimal.

## Validation
- `.\.venv\Scripts\python.exe -m pytest services/tests/unit/test_runtime_truth.py -q` -> `3 passed`
- `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q` -> `64 passed`
- `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth` -> `Success: no issues found in 346 source files`
- `pnpm lint` -> passed
- `pnpm --filter app test` -> `145 passed`
- `pnpm test:e2e -- --workers=1` -> `3 passed`
