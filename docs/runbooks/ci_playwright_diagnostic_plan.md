Status: Active
Version: 1.0.0
Last Reviewed: 2026-04-24

# CI Playwright Diagnostic Plan

## Goal
Provide a deterministic incident workflow for `app-e2e` CI failures so teams can identify root cause and avoid symptom-chasing.

## Scope and lane authority
- Primary lane: `HARNESS_ONLY App Smoke (Playwright)` in `.github/workflows/eval.yml`.
- This lane is harness evidence, not truth-lane proof.
- Truth-lane claims still require `pnpm test:truth`.

## Hypothesis map

| Hypothesis class | Typical symptom | First probe |
| --- | --- | --- |
| Process spawn / IPC | `spawn EPERM`, worker host startup failure | Pipe-spawn preflight in Playwright global setup and canary logs |
| Startup ordering race | timeouts before app-ready markers | Canary timeline (`canary-timeline.json`) and first-failure test log |
| Fixture / state drift | project not loaded, wrong mode, stale persisted state | Compare canary log against harness bootstrap expectations |
| Backend readiness | health endpoint or preflight route missing | Canary backend launch + health checks in `pnpm test:e2e` output |
| Artifact/report path mismatch | CI failure with missing diagnostics | Verify `playwright-artifacts` payload includes diagnostics directory |
| Timing nondeterminism | flaky modal/selector readiness | Compare repeated canary outcomes and timestamps |

## Targeted diagnostic tests

### 1) Canary fail-fast lane
- Command: `xvfb-run -a pnpm test:e2e`
- Expected: backend health success, smoke subset execution, timeline + canary log emitted.
- Artifacts:
  - `ci_artifacts/playwright_diagnostics/canary.log`
  - `ci_artifacts/playwright_diagnostics/canary-timeline.json`

### 2) Full harness lane
- Command: `xvfb-run -a pnpm --dir app exec playwright test -c ./playwright.config.ts`
- Expected: full `app/tests/e2e` execution after canary passes.
- Artifact: `ci_artifacts/playwright_diagnostics/full-suite.log`

### 3) CI-vs-local divergence replay
- Run local repro with CI-aligned env:
  - `PLAYWRIGHT_DISABLE_ANIMATIONS=1`
  - `PLAYWRIGHT_RETRIES=0`
  - `PLAYWRIGHT_OUTPUT_DIR=app`
- Compare with `env-manifest.json` from CI artifact.

## Instrumentation and timeline contract

### Env manifest
- File: `ci_artifacts/playwright_diagnostics/env-manifest.json`
- Required fields:
  - CI metadata: workflow/run/sha/ref
  - Runtime metadata: OS, Python, Node, pnpm versions
  - Playwright runtime flags

### Timeline
- File: `ci_artifacts/playwright_diagnostics/canary-timeline.json`
- Event sequence emitted by `scripts/e2e-with-backend.mjs`:
  - `launcher_start`
  - `port_check_passed`
  - `backend_spawned`
  - `backend_healthy`
  - `playwright_start`
  - `playwright_exit`
  - cleanup markers

## Failure artifact contract
- Always upload `playwright-artifacts` for this lane (including on failure and cancellation).
- Required paths:
  - `ci_artifacts/playwright_diagnostics`
  - `app/playwright-report`
  - `app/test-results`
  - fallback package-relative report roots (`app/app/...`)

## Canary and fail-fast policy
- Canary executes before full suite.
- If canary fails, stop job immediately and triage using canary artifacts first.
- Promote to full-suite investigation only when canary is green.

## Decision tree
1. Canary failed before `backend_healthy`:
   investigate environment/process startup boundaries.
2. Canary reached `backend_healthy` but failed before test assertions:
   investigate harness startup ordering and fixture state.
3. Canary passed, full suite failed:
   investigate spec-level nondeterminism or shared-state contamination.
4. Failure without diagnostic artifacts:
   treat as artifact-contract regression and fix workflow first.

## Next actions
1. Run the updated `app-e2e` lane and capture first post-change CI artifact bundle.
2. Triage top flake signatures from `canary.log` and `canary-timeline.json`.
3. Record findings under tracker issue `[5] PASS 5 harness fragility` with reproducible evidence.
