# Phase 13 Pass 19 - Test Harness Distortion Audit

## Summary
This pass started as an audit. A later harness-repair addendum on 2026-05-13 converted the highest-risk findings into targeted fixes without broadening product scope.

The strongest finding is that the current CI failures were plausibly harness distortion rather than a live backend contract break. The real backend path does write verification summaries, and the Playwright shell uses several layers of fixture materialization, cwd-sensitive wrapper logic, and stubbed project state that can move the loaded project root away from the report authority the renderer reads.

The highest-risk seams are:
- `scripts/e2e-with-backend.mjs` argument synthesis and cwd redirection
- `app/tests/e2e/utils/sampleProject.ts` root selection and synthetic fallback
- `app/tests/e2e/utils/serviceStubs.ts` fake verification report persistence
- `app/main/preload.ts` `getLastVerification(projectPath)` reading only the passed project root
- `app/playwright.config.ts` report/artifact root defaulting to `process.cwd()`

## 2026-05-13 Addendum

Targeted fixes landed for the highest-value harness risks identified in this audit:

1. Electron teardown authority
   - Both Electron launch paths now use the same bounded close helper.
   - If `electronApp.close()` stalls, the fixture emits teardown diagnostics and escalates to `SIGKILL`.
   - Result: the worker no longer depends on graceful renderer shutdown to exit.

2. Stub-backend shutdown authority
   - `app/tests/e2e/utils/serviceStubs.ts` now sets `Connection: close` on synthetic responses, tracks active sockets, calls `closeIdleConnections()` during shutdown, and destroys lingering sockets after a short timeout.
   - Root cause: plain `server.close()` could wait on keep-alive connections after otherwise passing tests, which matches the CI symptom where teardown timed out after 42 completed tests.

3. Renderer runtime-noise source
   - The `Cannot read properties of undefined (reading 'push')` noise came from the Playwright/debug-log seam, not from business logic.
   - Harness cleanup deletes `window.__blackskiesDebugLog`, while the renderer previously assumed it remained defined forever.
   - The debug-log path now recreates the array before every append, and the Playwright runtime-error allowlist no longer hides that exception.

4. Workflow quoting
   - The `node -p` step in `.github/workflows/eval.yml` now uses valid shell/JS quoting for Node 24, so the Playwright cache-version probe no longer fails with `Expected unicode escape`.

5. Budget-exceeded noise
   - HTTP 402 `BUDGET_EXCEEDED` remains expected only in the explicit budget-guardrail harness scenario.
   - It was not the source of the teardown hang. The harness still gates that console noise behind the dedicated `__allowBudget402Noise` flag instead of weakening assertions globally.

Validation after the addendum:
- `pnpm --dir app exec playwright test -c ./playwright.config.ts` passed when run sequentially.
- `pnpm --filter app test` passed.
- `pnpm --filter app lint` passed.
- `pnpm --filter app run build:production` passed.
- `pnpm test:truth` passed.

## Wrapper / Launcher Inventory

| File | Behavior | Risk |
| --- | --- | --- |
| `package.json` | `test:e2e`, `test:truth`, and `test:e2e:args` all route through custom Node launchers. | Launcher indirection can hide cwd and argument drift. |
| `app/package.json` | `test`, `lint`, `e2e`, `e2e:test`, and `package:dir` all wrap other commands. | The app workspace is not the same as repo-root execution. |
| `scripts/e2e-with-backend.mjs` | Materializes fixtures, injects env, forces `cwd: app`, and synthesizes Playwright args. | High. This is the main smoke launcher seam. |
| `scripts/truth-with-backend.mjs` | Materializes a temp project base, launches backend + Electron, and enforces truth-lane receipt rules. | High. It controls the real-service lane end to end. |
| `scripts/materialize_e2e_fixture.mjs` | Writes both `sample_project/proj_esther_estate` and `sample_project/Esther_Estate`. | Duplicate roots can mask authority drift. |
| `scripts/check_e2e_fixture_contract.mjs` | Verifies fixture shape and analytics endpoints before tests run. | Good guardrail, but still only checks contract shape, not path authority. |
| `scripts/run-vitest-offline.mjs` | Falls back to offline Vitest execution if the Node module lookup fails. | Medium. Local and CI can diverge if the fallback path is hit. |
| `scripts/run-app-eslint.mjs` | Forces `cwd: app` and legacy ESLint config. | Low to medium. Cwd-sensitive, but not snapshot-specific. |
| `scripts/test_e2e_launcher_args.mjs` | Verifies wrapper arg normalization and smoke selector rules. | Good guardrail against separator/worker drift. |
| `.github/workflows/eval.yml` | Runs canary/full Playwright, truth lane, and fixture prep with explicit env and `pnpm --dir app`. | High because it mixes wrapper types and cwd assumptions. |
| `app/playwright.config.ts` | Uses `PLAYWRIGHT_OUTPUT_DIR ?? process.cwd()` for report/output roots. | High. Artifact paths depend on launch cwd unless pinned. |

Key wrapper details:
- `scripts/e2e-with-backend.mjs` injects `BLACKSKIES_E2E_MODE=1`, `BLACKSKIES_E2E_SYNTHETIC_MODE=1`, `BLACKSKIES_E2E_EXTERNAL_SERVICE=1`, and `BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW=1`.
- That same launcher injects default smoke files unless `FULL_ANALYTICS_E2E=1`.
- The workflow’s canary path uses `pnpm test:e2e -- --workers=1`; the full-suite path uses `pnpm --dir app exec playwright test -c ./playwright.config.ts`.
- `app/playwright.config.ts` will place `test-results` and `playwright-report` under whatever root `process.cwd()` resolves to when `PLAYWRIGHT_OUTPUT_DIR` is not set.

## Stub / Mock Inventory

| File | Fake / mock surface | Contract fidelity |
| --- | --- | --- |
| `app/tests/e2e/utils/serviceStubs.ts` | In-process fake backend HTTP server with synthetic snapshots, backups, and verification reports. | Partial approximation with dangerous fake-confidence risk. |
| `app/tests/e2e/utils/sampleProject.ts` | Resolves direct project roots, snapshot-backed project roots, or a synthetic project fallback. | High risk. It can promote a different root than the canonical project folder. |
| `app/tests/e2e/_electron.fixture.ts` | Installs the stub backend unless `BLACKSKIES_E2E_EXTERNAL_SERVICE=1`, injects harness flags, and resets state aggressively. | Partial approximation. Good for determinism, but not the real app launch shape. |
| `app/renderer/vitest.setup.ts` | Global `window.bridge` defaults, including `getLastVerification: null` and `runBackupVerification: ok`. | Behavior-only stub. Fine for unit tests, but not authoritative. |
| `app/renderer/__tests__/AppSnapshotsVerification.test.tsx` | Explicit mock service payloads for verification, snapshots, backup restore, and modal behavior. | Good unit coverage, but still a mocked bridge. |
| `app/renderer/__tests__/AppPreflight.test.tsx` | Shared bridge fixture with verification/report defaults. | Good for component behavior, not path authority. |

Important stub shape notes:
- `serviceStubs.ts` fabricates `verified_at`, `snapshots`, and the persisted `last_verification.json` file itself.
- `sampleProject.ts` can switch from the nominal project root to a snapshot directory if it finds a matching `last_verification.json`.
- `app/main/preload.ts` reads verification state from a single `projectPath` root, so the fake layer must match the project path the renderer actually loads.

## Fixture / Materialization Inventory

- `scripts/materialize_e2e_fixture.mjs` writes both `sample_project/proj_esther_estate` and `sample_project/Esther_Estate`.
- `scripts/check_e2e_fixture_contract.mjs` accepts either the canonical project root or an extra root and validates outline/project/drafts plus analytics probes.
- `app/tests/e2e/utils/sampleProject.ts` can materialize a synthetic fixture if `proj_esther_estate` is missing direct files.
- `app/tests/e2e/_electron.fixture.ts` clears persisted layout under both `sample_project/proj_esther_estate/.blackskies` and `sample_project/Esther_Estate/.blackskies`.
- `scripts/truth-with-backend.mjs` creates a temp launch root with both `Esther_Estate` and `proj_esther_estate` aliases.

Where fixtures differ from real projects:
- Harness fixtures are often minimal: `project.json`, `outline.json`, and a small `drafts/` set.
- Snapshot directories may be synthetic or snapshot-backed, not user-authored project roots.
- Some fixture loaders prefer a verified snapshot directory over the nominal project root if a report file exists.

## Environment Override Inventory

Observed env controls that materially alter behavior:
- `BLACKSKIES_PROJECT_BASE_DIR`
- `BLACKSKIES_SERVICES_PORT`
- `BLACKSKIES_E2E_PORT`
- `BLACKSKIES_E2E_MODE`
- `BLACKSKIES_E2E_SYNTHETIC_MODE`
- `BLACKSKIES_E2E_EXTERNAL_SERVICE`
- `BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW`
- `BLACKSKIES_ENABLE_HARNESS_HOOKS`
- `BLACKSKIES_VISUAL_STABLE`
- `BLACKSKIES_FORCE_SERVICES`
- `BLACKSKIES_SERVICE_PORT_RANGE`
- `BLACKSKIES_PYTHON`
- `PLAYWRIGHT_OUTPUT_DIR`
- `PLAYWRIGHT_DISABLE_ANIMATIONS`
- `PLAYWRIGHT_RETRIES`
- `FULL_ANALYTICS_E2E`
- `CI`
- `NODE_ENV`
- `PLAYWRIGHT`

CI vs local differences to note:
- CI sets `PLAYWRIGHT_OUTPUT_DIR=app` in the Playwright jobs.
- CI can set `CI=true`, which forces headless mode, Playwright retries, and animation suppression.
- The smoke launcher sets synthetic mode on the backend side; truth lane explicitly turns synthetic mode off.

## CWD / Path-Risk Inventory

Commands and paths that are sensitive to cwd:
- `app/playwright.config.ts` uses `process.cwd()` when `PLAYWRIGHT_OUTPUT_DIR` is unset.
- `app/electron/projectLoader.ts` and `app/main/projectLoaderIpc.ts` both search for `sample_project/Esther_Estate` relative to cwd/app paths.
- `scripts/dev-runner.mjs` always spawns child commands from repo root.
- `scripts/e2e-with-backend.mjs` runs Playwright from `cwd: app`.
- `scripts/truth-with-backend.mjs` launches both backend helper scripts and Electron from repo-root-based temp state.
- `app/main/main.ts` resolves project and services paths relative to build location, app root, and `process.cwd()`.
- `app/main/preload.ts` reads `last_verification.json` from the exact `projectPath` supplied by the renderer.
- `app/tests/e2e/utils/sampleProject.ts` resolves roots relative to repo root and can swap to a nested snapshot directory.

Commands that must run from the repo root:
- `pnpm test:truth`
- `pnpm test:e2e`
- `node scripts/materialize_e2e_fixture.mjs`
- `node scripts/check_e2e_fixture_contract.mjs`

Commands that must run from `app/` or be force-rooted there:
- `pnpm --dir app exec playwright test -c ./playwright.config.ts`
- `pnpm --filter app test`
- `pnpm --filter app lint`

## Lane Comparison Table

| Lane | Backend | Renderer | Preload / bridge | Filesystem / fixture model | Blind spots |
| --- | --- | --- | --- | --- | --- |
| Renderer unit | No backend; jsdom | React component tree in Vitest | `vitest.setup.ts` bridge defaults, often mocked per test | Synthetic in-memory fixture state | No real IPC, no real filesystem, no real project root authority |
| Playwright | Stub HTTP backend by default in HARNESS_ONLY flow; real backend possible in truth-style runs | Electron app + renderer bundle | Real `app/main/preload.ts` bridge in packaged/e2e path; stub overrides may exist only through harness | Shared fixture materialization and temp/user-data cleanup | Can still diverge on project path selection and report root authority |
| Truth lane | Real FastAPI service | Real Electron + renderer | Real preload bridge, no stub service layer | Temp project base dir with alias roots and real report persistence | Narrow by design; only proves the truth path it exercises |
| CI | Mixed: app-e2e uses harness backend; truth lane uses real service | Both Playwright and Electron are exercised | Preload behavior differs by lane and env | `PLAYWRIGHT_OUTPUT_DIR=app`, canary/full artifact paths, fixture prep scripts | Wrapper and cwd drift can change output/report discoverability |
| Manual app run | Real spawned services unless disabled | Electron app | Real preload bridge | Whatever project root the user opens | Least deterministic; depends on user launch path, env, and chosen project |

## Known Divergences From Real App Behavior

- The Playwright smoke flow uses a fake backend server, not the production FastAPI app.
- The smoke fixture loader may materialize a synthetic project when direct fixture files are missing.
- The main preload bridge reads `last_verification.json` only from the project path it is passed; it does not search aliases.
- The e2e wrapper can inject default test files and a smoke grep, which is different from a direct Playwright invocation.
- The truth lane uses a temp project base with both canonical and legacy alias roots, which is not the same as a normal user project directory.
- Unit tests for the snapshot surface do not exercise the real preload/fs bridge or the real backend storage path.

Loaded-root authority rule:
- Every E2E project alias used by renderer preload or local snapshot reads must receive the same generated snapshot fixture set.
- That means both `sample_project/proj_esther_estate` and `sample_project/Esther_Estate` need `.snapshots/last_verification.json` plus complete `.snapshots/snapshot-current` and `.snapshots/pw-wizard-final` directories.

Teardown note:
- The Playwright Electron fixtures now use a bounded close-and-kill fallback so a stuck app shutdown cannot turn into a worker teardown timeout during CI.

## High-Risk Fake-Confidence Zones

1. `app/tests/e2e/utils/serviceStubs.ts`
   - It synthesizes a successful verification report regardless of the backend’s real discovery logic.
   - It persists the report to a chosen fixture root, which can hide project-root mismatch problems.

2. `app/tests/e2e/utils/sampleProject.ts`
   - It can switch a test from the nominal project root to a verified snapshot directory.
   - It can also synthesize a fallback project for `proj_esther_estate`.

3. `app/main/preload.ts`
   - `getLastVerification()` is path-authoritative and returns `null` if the report is not present at the exact root.
   - This is correct behavior, but it means any harness path drift becomes a user-visible `Verification data unavailable`.

4. `scripts/e2e-with-backend.mjs`
   - Smoke-mode default file injection and explicit cwd redirection are convenient, but they make the command meaning different from direct Playwright use.

5. `app/playwright.config.ts`
   - Artifacts and outputs are rooted at `process.cwd()` unless pinned.
   - A wrapper or workflow change can silently move `test-results` and `playwright-report`.

## Direct Connection To The Current CI Failures

### 1. Truth lane: `Verification report must contain at least one snapshot summary`
The backend report path is not the primary suspect. `services/src/blackskies/services/backup_verifier.py` still builds reports with `snapshots: [snapshot.as_dict() ...]`, and the router in `services/src/blackskies/services/routers/backup_verifier.py` persists and rereads that report.

The audit risk is instead around which project root the truth lane is verifying. The truth launcher creates a temp project base with alias roots and then reads the report from the loaded project path. If the lane lands on the wrong alias or a fixture root without snapshots, the report can be structurally valid but empty from the lane’s point of view.

### 2. Playwright: `Verification data unavailable`
This string comes from `SnapshotsPanel` when `services.getLastVerification?.({ projectId, projectPath })` returns `null` or is missing. The app preload then reads `projectPath/.snapshots/last_verification.json` directly. If the loaded project path and the seeded report path diverge, the panel will correctly show “Verification data unavailable”.

The high-probability causes are:
- stale or alternate project root selected by `sampleProject.ts`
- stubbed verification file seeded under a different alias than the renderer reads
- direct Playwright launcher / cwd differences causing the app to mount a different project path than the stub expected

## Recommendations

- Refine existing tests first. Add state-wait assertions where the harness currently assumes freshness.
- Add missing assertions only if they prove authority, not just presence. For example, assert the project path used by the panel matches the report root.
- Remove stale wrappers only if they are demonstrably harmful. Right now they are risky, but they still provide useful guardrails.
- Document the required cwd and launch rules for `pnpm test:e2e`, `pnpm test:truth`, and the direct Playwright invocation path.
- Do not broaden the lane into generic UI coverage. The problem is authority and path selection, not a button inventory gap.

## Suggested Next Repair Pass

Keep the next pass narrow and focus on one of these:
1. Trace the exact project root chosen by `sampleProject.ts`, `bootstrapHarness`, and `app/main/preload.ts` in the failing Playwright flow.
2. Trace the truth lane’s temp project base and report read path to prove whether it is an alias mismatch or a missing snapshot seed.
3. Add one regression that asserts the same `projectPath` is used for report persistence and report reread in the Playwright harness.
