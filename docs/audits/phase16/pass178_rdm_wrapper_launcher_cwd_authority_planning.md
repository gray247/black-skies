# Pass 178 - RDM-WRAPPER-001 Wrapper / Launcher / CWD Authority Planning

## Files Inspected
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/audits/phase16/pass177_phase16_closure_and_next_lane_selection_review.md`
- `package.json`
- `app/package.json`
- `app/main/main.ts`
- `app/main/preload.ts`
- `app/playwright.config.ts`
- `scripts/dev-runner.mjs`
- `scripts/electron-dev.mjs`
- `scripts/e2e-with-backend.mjs`
- `scripts/truth-with-backend.mjs`
- `scripts/test_e2e_launcher_args.mjs`
- `scripts/run-dev-backend.ps1`
- `scripts/load.py`
- `scripts/smoke_runner.py`
- `scripts/smoke.sh`
- `scripts/smoke.ps1`
- `.github/workflows/eval.yml`
- `docs/tests.md`
- `docs/runbooks/ci_playwright_diagnostic_plan.md`
- wrapper / launcher / CWD references across docs and audits

## RDM-WRAPPER-001 Scope
- Define wrapper, launcher, and current-working-directory authority.
- Separate canonical dev, smoke, truth, CI, and packaged launch paths so a green run does not overclaim readiness.
- Keep the lane focused on command determinism, root resolution, and environment composition.

## Current Launch Surfaces
- `pnpm dev` delegates to `scripts/dev-runner.mjs`.
- `scripts/dev-runner.mjs` launches the renderer from repo root and Electron via `scripts/electron-dev.mjs`.
- `scripts/electron-dev.mjs` builds the main bundle, launches Electron from `app/`, and injects `BLACKSKIES_PYTHON`.
- `pnpm test:e2e` delegates to `scripts/e2e-with-backend.mjs`.
- `pnpm test:truth` delegates to `scripts/truth-with-backend.mjs`.
- `pnpm test:service-truth` delegates to `scripts/run_service_truth.py`.
- `app/playwright.config.ts` uses `scripts/playwright_pipe_preflight.mjs` and the `electron` project with one worker.
- `scripts/run-dev-backend.ps1` is a local PowerShell backend helper, not a truth lane.

## Current Wrapper / Backend-Start Surfaces
- `app/main/main.ts` spawns the FastAPI backend, probes `/api/v1/healthz`, and resolves service cwd differently for packaged versus dev mode.
- `scripts/e2e-with-backend.mjs` materializes the e2e fixture, checks port availability, and sets `BLACKSKIES_E2E_MODE`, `BLACKSKIES_E2E_PORT`, and `BLACKSKIES_SERVICES_PORT`.
- `scripts/truth-with-backend.mjs` uses the real backend, CDP launch, and receipt production with its own port and debug-port boundary.
- `scripts/load.py` explicitly opts into synthetic E2E mode for self-hosted load runs.
- `scripts/smoke_runner.py` can fall back to `Path.cwd() / sample_project` when project base dir is absent.

## Current CWD Assumptions
- `scripts/dev-runner.mjs` forces `cwd` to the repo root.
- `scripts/electron-dev.mjs` switches Electron `cwd` to `app/`.
- `app/main/main.ts` uses `resolveServicesCwd()` which points to repo-relative services in dev and `process.resourcesPath` when packaged.
- `scripts/run-dev-backend.ps1` assumes the repo root and sets `PYTHONPATH` from there.
- `scripts/e2e-with-backend.mjs` and `scripts/truth-with-backend.mjs` both run from repo-root assumptions while launching app-root / service-root work.
- `scripts/smoke_runner.py` still has a cwd fallback path, which is a launch-risk seam.

## Current Port / Process Assumptions
- Dev and truth/e2e lanes probe for available backend ports rather than assuming a fixed one.
- `scripts/e2e-with-backend.mjs` uses service port `9999` and reuses a healthy backend if the port is already occupied.
- `scripts/truth-with-backend.mjs` uses service port `9999` and an explicit Electron debug port `9222`.
- `app/main/main.ts` can spawn the backend itself unless `BLACKSKIES_SERVICES_PORT` points to an externally managed backend.
- `app/main/preload.ts` treats missing service port as a hard error for bridge calls.

## Packaged vs Dev Launch Differences
- Dev launch uses `scripts/dev-runner.mjs` and `scripts/electron-dev.mjs`, with source-tree paths and repo-root assumptions.
- Packaged launch uses `app/dist-electron/main/main.js`, packaged resources, and `process.resourcesPath`.
- Packaged mode resolves bundled executable paths through app resources instead of repo-root source paths.
- The lane must keep packaged and dev entrypoints distinct so a working dev launch is not treated as packaged readiness.

## CI vs Local Launch Differences
- CI e2e uses `xvfb-run -a pnpm --dir app exec playwright test -c ./playwright.config.ts`.
- Local launch paths may use `pnpm dev`, `pnpm test:e2e`, `pnpm test:truth`, or the PowerShell backend helper.
- CI launch is more explicit about artifacts, preflight, and headless execution than several local convenience paths.
- A green CI path does not prove local wrapper determinism unless the same authority boundaries are exercised.

## Known Risks and Prior Evidence
- Wrapper / launcher / cwd drift can make one command path look healthy while another path is broken.
- Smoke and harness success can overstate readiness if the launch recipe is not canonicalized.
- PowerShell and non-PowerShell launch behavior differ materially.
- Truth-lane evidence is intentionally narrow and should not be generalized to all launch surfaces.
- `RDM-WRAPPER-001` remains open in the deferred matrix because broad implementation work can still appear healthy under the wrong root or environment.

## What This Lane Must Prove
- Which launch paths are canonical for dev, smoke, truth, CI, and packaged use.
- Which cwd and env assumptions each path depends on.
- Which port and process assumptions are required for each path.
- Which command path should be cited as the operator-safe canonical recipe.
- Which wrapper risks are real authority risks versus merely convenience differences.

## What This Lane Must Not Prove
- It must not prove runtime truth, product readiness, restore safety, teardown stability, or synthetic/harness truth.
- It must not reopen already-closed proof-boundary lanes.
- It must not turn launch success into a general runtime guarantee.
- It must not start GUI cleanup, critique repair, continuity repair, or `sc_0001` work.

## Human Spot-Check Requirement
- Required after implementation.
- This lane affects operator-visible launch behavior and canonical command guidance, so the follow-up should include a focused local launch spot-check before any closure claim.

## Proposed Implementation Boundary
- Keep the next implementation pass limited to wrapper / launcher / cwd authority mapping and canonical command recipe wording.
- Prefer existing launch scripts and docs over introducing new wrappers.
- Touch only the narrow surfaces needed to document or enforce the canonical command path and boundary assumptions.
- Do not expand into GUI cleanup, truth-lane implementation, synthetic-mode work, teardown governance, or continuity hardening.

## Recommended Next Pass
- `Pass 179 - RDM-WRAPPER-001 Wrapper / Launcher / CWD Authority Contract`
- Purpose: define the canonical command recipe and the exact authority boundaries before any runtime or workflow changes.

