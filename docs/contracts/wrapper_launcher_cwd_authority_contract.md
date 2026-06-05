# Wrapper / Launcher / CWD Authority Contract

## Purpose
This contract defines what wrapper, launcher, and current-working-directory evidence can prove, and what it cannot prove.
It exists so that command success, CI success, smoke success, or a visible app window are not mistaken for runtime truth or product readiness.

## Canonical Command Authority
- `pnpm dev` is the local dev launcher.
- `pnpm test:e2e` is the harness/smoke launcher.
- `pnpm test:truth` is the authoritative truth-lane launcher.
- `pnpm test:service-truth` is backend service truth only.
- `pnpm --dir app exec playwright test ...` is a command-guidance / harness invocation surface, not a proof boundary by itself.
- Packaged app execution is the `app/dist-electron/main/main.js` entrypoint built through `app/package.json` package commands.

## Authority Boundaries
- Repo-root CWD boundary: scripts that resolve from the repo root should be treated as repo-root authority only.
- App-root CWD boundary: Electron packaged/dev bootstrap may intentionally switch to `app/` and must not be compared to repo-root commands without qualification.
- Dev launch boundary: local `pnpm dev` and its helper scripts prove dev launch only.
- Packaged launch boundary: packaged entrypoints prove packaged launch only.
- Backend spawn boundary: starting FastAPI from the main process proves backend spawn behavior only.
- Port/process ownership boundary: a launcher may own the port it starts, reuse a healthy backend, or attach to an external backend; those are different authority states.
- PowerShell/local Windows command boundary: `.ps1` helpers prove Windows command guidance only.
- CI command boundary: workflow and CI scripts prove CI launch guidance only.
- Smoke/harness boundary: smoke and harness commands prove launcher/fixture/interaction sanity only.
- Truth-lane boundary: truth-lane commands prove the scoped receipt-producing truth path only.
- Load/synthetic boundary: synthetic load commands prove synthetic wiring and smoke behavior only.

## What This Evidence Can Prove
- The command path used the intended launcher.
- The launch path resolved the intended CWD.
- The expected env and port ownership rules were applied.
- The backend was spawned or attached as designed for that lane.
- The packaged or dev entrypoint matched the requested lane.
- The smoke, harness, truth, or synthetic lane behaved according to its own contract.

## What This Evidence Cannot Prove
- Runtime truth.
- Product readiness.
- GUI correctness.
- Restore safety.
- Teardown stability.
- Truth-lane closure from harness or synthetic passes.
- Packaged launch correctness from dev launch success.
- Dev launch correctness from packaged launch success.
- Local launch determinism from CI green alone.

## Classified Surfaces
| Surface | Expected CWD | Evidence class | What it proves | What it must not prove |
| --- | --- | --- | --- | --- |
| `pnpm dev` -> `scripts/dev-runner.mjs` | Repo root | Dev launch guidance | Local dev launch path and repo-root bootstrap | Packaged launch, truth-lane proof, or general runtime readiness |
| `scripts/dev-runner.mjs` | Repo root | Dev wrapper | Repo-root command routing into the dev launcher | Packaged launch or CI parity |
| `scripts/electron-dev.mjs` | `app/` | Dev/app launch boundary | Electron main build + app-root launch wiring | Packaged readiness or truth-lane proof |
| `pnpm test:e2e` -> `scripts/e2e-with-backend.mjs` | Repo root | Harness/smoke launcher | Harness setup, fixture sanity, and interaction sanity | Truth-lane closure or real backend performance proof |
| `scripts/e2e-with-backend.mjs` | Repo root | Harness/smoke launcher | Smoke subset and fixture setup with port checks | Packaged launch proof or full runtime authority |
| `pnpm test:truth` -> `scripts/truth-with-backend.mjs` | Repo root | Truth-lane launcher | Scoped receipt-producing truth evidence | Harness/smoke proof, packaged proof, or full product readiness |
| `scripts/truth-with-backend.mjs` | Repo root | Truth lane | Real backend route truth plus persistence/readback truth for the scoped lane | Generic smoke proof or general launch determinism |
| `pnpm test:service-truth` -> `scripts/run_service_truth.py` | Repo root | Backend service truth | Backend/service contract behavior only | Renderer truth, launch determinism, or product readiness |
| `scripts/run_service_truth.py` | Repo root | Backend service truth | Service-level pytest evidence | UI behavior or packaged launch proof |
| `scripts/run-dev-backend.ps1` | Repo root | Local Windows helper | PowerShell backend bring-up guidance | Canonical authority across non-Windows or packaged launch paths |
| `scripts/load.py` | Repo root | Synthetic/load command | Synthetic E2E wiring and load harness behavior | Real backend performance, runtime truth, or restore safety |
| `scripts/smoke_runner.py` | Repo root or fallback cwd | Smoke helper | Smoke fixture prep and fallback guidance | Canonical project-root authority or runtime correctness |
| `scripts/smoke.sh` / `scripts/smoke.ps1` | Repo root | Smoke helper | Smoke launch guidance and fixture prep | Truth-lane proof or packaged proof |
| `scripts/test_e2e_launcher_args.mjs` | Repo root | Command-synthesis witness | Argument normalization and launcher-shape checks | Runtime truth or launch determinism by itself |
| `app/main/main.ts` | Dev: repo-root services cwd; packaged: `process.resourcesPath` | Main-process launch authority | Backend spawn, health probe, and packaged-vs-dev resolution | UI correctness or full product readiness |
| `app/main/preload.ts` | Service port resolved by env/bridge | Bridge authority | Request routing, port ownership, and timeout policy on the bridge | Launch determinism or runtime truth without the command path |
| `app/playwright.config.ts` | Repo root | Playwright harness config | Preflight, worker topology, and report/result routing | Truth-lane receipt proof or packaged launch proof |
| `.github/workflows/eval.yml` | CI workspace | CI authority | CI launch and artifact expectations | Local launch determinism or runtime readiness without matching local proof |

## Forbidden Overclaim Language
- CI green proves local launch determinism.
- Smoke launch proves packaged launch.
- Packaged launch proves dev launch.
- Synthetic/load launch proves real backend performance.
- UI opens once proves wrapper authority.
- Backend health alone proves full launch correctness.
- Command docs prove runtime behavior without execution evidence.

## Relationship to Other Contracts
- Harness evidence remains bounded by `docs/contracts/harness_fixture_contract.md`.
- Truth-lane evidence remains bounded by `docs/contracts/truth_lane_claim_matrix_contract.md`.
- Synthetic evidence remains bounded by `docs/contracts/synthetic_mode_claim_matrix_contract.md`.
- Teardown evidence remains bounded by `docs/contracts/playwright_teardown_governance_contract.md`.

## How Evidence May Be Cited
- Cite wrapper evidence only with the exact command, CWD, env assumptions, and lane class that produced it.
- Cite launch evidence as launch evidence, not runtime truth.
- Cite CI evidence as CI authority, not local authority.
- Cite smoke/harness evidence as witness evidence only.
- Cite truth-lane output only within the truth-lane claim matrix.

## Human Spot-Check Requirement
- A focused human spot-check is required after any implementation pass that changes canonical command guidance, launcher routing, or CWD resolution.
- The spot-check should confirm the intended command path on the intended platform before the lane can close.

## Closure-Grade Evidence Requirements
- A closure claim must show the canonical command path, the intended CWD, the expected env/port ownership, and a successful run in the intended lane.
- If the implementation changes dev launch, packaged launch, or CI launch routing, each changed path needs its own evidence.
- No closure claim may rely on command docs alone without an execution result.
- No closure claim may use one lane’s success to prove another lane’s authority.

