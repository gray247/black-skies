# Fixture Dependency and Layout Contract

## Purpose
This document defines the current fixture and layout assumptions used by the validation lanes and records the cleanup actions taken to reduce false confidence.

## Current Fixture Inventory

| Path | Role | Lane(s) affected | What it assumes exists | Explicit or implicit | Confidence |
| --- | --- | --- | --- | --- | --- |
| `app/tests/e2e/utils/sampleProject.ts` | Sample-project loader for harnessed e2e tests | Harness-driven, UI-only, backend-shaped fixtures | A requested project root exists under `sample_project/<projectId>`, and if the root is not materialized yet, that root’s own verified snapshots can provide `outline.json` and `project.json` | Mostly explicit after this pass | High |
| `app/tests/e2e/_bootstrap.ts` | Harness bootstrap for non-stub Playwright runs | Harness-driven, UI-only | `sample_project/Esther_Estate` exists for the renderer bootstrap path, `__dev` is available only in harness mode, and the loaded page exposes `__APP_READY__` and the `app-root` test id | Explicit in code, but still harness-only | High |
| `app/tests/e2e/_electron.fixture.ts` | Electron fixture for harnessed Playwright runs | Harness-driven, UI-only | A built renderer may exist at `app/dist/index.html`; otherwise the launcher can fall back to `app/main/main.ts` | Explicit in code | High |
| `app/tests/e2e/electron.launch.ts` | Secondary harness launcher for UI smoke | Harness-driven, UI-only | Same renderer/main-process fallback shape as the main Playwright fixture | Explicit in code | High |
| `scripts/truth-with-backend.mjs` | Truth-lane launcher | Truth lane | `sample_project/Esther_Estate` contains a project-local outline or verified snapshots; `app/dist/index.html` and the Electron binary are available for the real launch path | Explicit after this pass | High |
| `scripts/run-vitest-offline.mjs` | Dedicated renderer/unit launcher | Renderer/unit | The app workspace can start a Vitest/Vite/esbuild pipeline and the local `app/vitest.config.mjs` exists | Explicit in code | High |
| `app/vitest.config.mjs` | Shared Vitest config | Renderer/unit | The renderer and main test glob sets are stable and symlink preservation is needed on Windows | Explicit in code | High |
| `app/playwright.config.ts` | Playwright worker/output config | Harness-driven, UI-only | The runner can start Playwright workers and can write report/output directories | Explicit in code, but environment-sensitive | High |
| `app/tests/e2e/utils/serviceStubs.ts` | Stubbed service bridge for harness tests | Harness-driven | The harness is allowed to inject fake service behavior | Explicit in code | High |
| `scripts/playwright_pipe_preflight.mjs` | Pipe-spawn preflight | Harness-driven, renderer/unit | Windows can create pipe-based child processes; if not, the affected lanes fail fast | Explicit in code | High |
| `scripts/pipe_spawn_preflight.mjs` | Shared pipe-spawn probe | Harness-driven, renderer/unit | Pipe-based child-process spawn is available on the host | Explicit in code | High |

## Current Layout Assumptions

- `sample_project/proj_esther_estate` is a snapshot-backed harness project root, not a fully materialized project tree.
- `sample_project/Esther_Estate` is the source tree used to materialize the truth-lane project copy and to anchor verified snapshots.
- Snapshot materialization should come from a project-local `last_verification.json` when present, otherwise from the project-local `.snapshots/ss_*` directories.
- Generated project trees for the truth lane are created under a temporary launch root and must not be confused with source material in `sample_project`.
- `app/dist-electron/main/main.js` and `app/dist/index.html` are expected for the packaged truth path; harness launchers may fall back to `app/main/main.ts` when the packaged build is absent.
- Renderer/unit validation assumes the local Vitest pipeline can start `esbuild.exe` with its pipe-based service channel. On this Windows workspace, that assumption currently fails fast and is tracked as a blocker.
- Playwright harness validation assumes worker processes can be forked with IPC. On this Windows workspace, that assumption currently fails fast and is tracked as a blocker.
- The old behavior of searching across unrelated sample-project roots is no longer part of the contract.

## Truth-Lane Fixture Contract

- The truth lane requires a real project tree materialized from `sample_project/Esther_Estate` or that tree’s own verified snapshots.
- The truth lane must not rely on harness-only preload globals, service stubs, or snapshot discovery across unrelated sample-project roots.
- The truth lane may materialize a temporary project copy, but the source for that copy must be explicit and project-local.
- The truth lane must continue to require the real backend, the real Electron launch, and a live renderer bridge.

## Harness-Lane Fixture Contract

- The harness lane may use `sample_project/Esther_Estate` and `sample_project/proj_esther_estate` through their own project-local snapshot layouts.
- The harness lane may use `serviceStubs`, `__dev`, and other harness-only hooks when the lane documentation says so.
- The harness lane does not prove that the production path can load the project without stubs or preload overrides.
- Harness fixtures should be interpreted as launcher and interaction evidence, not real-service truth.

## Cleanup Actions Taken

- Narrowed the sample-project fallback so it stays within the requested project root instead of crossing to another sample-project tree.
- Added project-local verified-snapshot preference for both the harness sample-project loader and the truth-lane materializer.
- Kept a deterministic fallback to the project-local `.snapshots/ss_*` directory order when verification metadata is absent or malformed.
- Documented the minimum required truth and harness fixture contracts.

## Remaining Gaps

- `sample_project/proj_esther_estate` still has a snapshot-backed layout rather than a fully materialized root, so the harness contract still depends on that project-local snapshot structure.
- `sample_project/Esther_Estate` and `sample_project/proj_esther_estate` both carry historical snapshot and backup material that can be mistaken for active source unless reviewers check the contract.
- The Windows runner ceilings from WP-08 still block pipe-based child processes, so harness and renderer/unit validation remain fail-fast on this workspace.
- The docs now describe the contract more explicitly, but human confirmation is still needed on whether any future sample-project roots should be treated as canonical inputs instead of historical compatibility paths.
