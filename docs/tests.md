Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# Test Strategy & Commands

Authority note: this is a practical validation guide, not the canonical lane classifier. Read [Canonical Authority and Validation Lanes](./reviews/canonical_authority_and_validation_lanes.md) first, then [Test Taxonomy and Truth Matrix](./reviews/test_taxonomy_and_truth_matrix.md).

## How to read this guide
- Truth lane is for real-service claims only.
- UI-only and harness-driven runs can be useful, but they do not prove backend or architecture truth.
- Backend contract/state checks prove service behavior, not renderer behavior.
- Renderer/unit checks prove local UI logic, not service routing.
- Repo hygiene checks prove the tree is clean, not that the product is correct.
- Truth-lane results must not be inferred from smoke fallback, stubbed fixtures, or UI-only coverage.

## Command Matrix

| Category | Expected CWD | Command | What it proves | What it does not prove | Evidence class |
| --- | --- | --- | --- | --- | --- |
| Local dev launch | Repo root | `pnpm dev` | Local Electron + renderer dev launch path and repo-root bootstrap | Packaged launch, truth-lane proof, CI parity, or runtime truth | Local |
| Local backend-only launch | Repo root | `python -m uvicorn blackskies.services.app:create_app --factory --reload` or `powershell -ExecutionPolicy Bypass -File scripts/run-dev-backend.ps1` | Backend service bring-up only | Renderer launch, wrapper authority, packaged launch, or truth-lane proof | Backend-only |
| Harness smoke | Repo root | `pnpm test:e2e` | Harness setup, fixture sanity, and interaction sanity | Truth-lane closure, packaged launch, or real backend performance proof | Harness |
| Truth lane | Repo root | `pnpm test:truth` | Scoped receipt-producing truth evidence with live backend and persistence/readback claims in the truth contract | Harness proof, packaged proof, or full product readiness | Truth-lane |
| Service truth | Repo root | `pnpm test:service-truth` | Backend/service contract behavior only | Renderer truth, launch determinism, or product readiness | Backend-only |
| Synthetic / load harness | Repo root | `python scripts/load.py --host <host> --port <port>` | Synthetic E2E wiring and load-harness behavior | Real backend performance, restore safety, or operator workflow safety | Synthetic |
| CI validation | CI workspace | `xvfb-run -a pnpm test:e2e` and `xvfb-run -a pnpm --dir app exec playwright test -c ./playwright.config.ts` | CI launch and artifact expectations | Local Windows launch determinism, truth-lane proof, or runtime readiness without matching local proof | CI |
| Packaged launch | Repo root to packaged artifact | `pnpm --dir app run package:dir` or `pnpm --dir app run package:win` then launch `app/dist-electron/main/main.js` | Packaged build / entrypoint path | Dev launch determinism, smoke proof, or truth-lane proof | Packaged |

Wrapper / launcher / CWD authority for the command matrix is bounded by [Wrapper / Launcher / CWD Authority Contract](./contracts/wrapper_launcher_cwd_authority_contract.md).

## Current commands by lane

### Truth lane
- Authoritative command: `pnpm test:truth`
- Launcher path: `scripts/truth-with-backend.mjs`
- What it does: starts the real backend, materializes a temp `Esther_Estate` project root from the bundled sample snapshot, launches Electron against the real service port, then attaches over CDP and calls the real renderer preflight bridge without service stubs or preload-only overrides.
- Wrapper / launcher / CWD authority is bounded by [Wrapper / Launcher / CWD Authority Contract](./contracts/wrapper_launcher_cwd_authority_contract.md).
- What it does not prove: the Generate button click path itself. It proves the live renderer bridge and the preflight service call from the loaded real project.
- Current status: runnable in this workspace. The lane now reaches the live Electron renderer, verifies the real bridge, and exercises the preflight service against the loaded project.
- Harness-only preload APIs (`__dev`, `__test`, `__testInsights`, `testMode`) are fenced behind `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` and are not part of the truth-lane command.
- Gap report: [Truth Lane Definition and Gap Report](./reviews/truth_lane_definition_and_gap_report.md)
- Do not overclaim: `pnpm test:e2e` is not a truth substitute; it is the smoke-fallback launcher defined in `scripts/e2e-with-backend.mjs`.

### UI-only lane
- `pnpm --dir app exec playwright test tests/e2e/visual.home.spec.ts --project=electron --workers=1`
- `pnpm --dir app exec playwright test tests/e2e/a11y.smoke.spec.ts --project=electron --workers=1`

Use these for renderer appearance and accessibility checks only. They do not prove backend truth.

### Harness-driven lane
- `pnpm test:e2e`
- `pnpm --dir app exec playwright test tests/e2e/gui.smoke.spec.ts --project=electron --workers=1`
- `pnpm --dir app exec playwright test tests/e2e/gui.flows.spec.ts --project=electron --workers=1`
- `pnpm --dir app exec playwright test tests/e2e/dock-workspace.spec.ts --project=electron --workers=1`
- `pnpm --dir app exec playwright test tests/e2e/gui.insights.spec.ts --project=electron --workers=1`
- `pnpm --dir app exec playwright test tests/e2e/gui.analytics_offline_cache_flow.spec.ts --project=electron --workers=1`

Use these for launcher, fixture, and interaction sanity. Do not claim backend truth from a harness pass.
For CI incident handling in `app-e2e`, follow [CI Playwright Diagnostic Plan](./runbooks/ci_playwright_diagnostic_plan.md) for canary-first triage, timeline artifacts, and fail-fast sequencing.
Harness runs may use the explicit preload hooks listed in [Preload Hook Inventory and Containment](./reviews/preload_hook_inventory_and_containment.md), but those hooks are not truth evidence.
Scene selection and forced-offline control now use the existing `test:select-scene` and `test:force-offline` event paths plus dataset flags, not the removed `__selectSceneForTest` helper or any preload-global force-offline toggle.
Remaining harness markers such as `data-test-active-flow`, `data-test-stable-dock`, `data-test-visual-stable`, and `data-test-needs-recovery` are harness-only dataset controls. They are useful for lane setup but they do not prove production behavior. The budget-meter flow now depends on injected budget responses plus the refresh hook, not on a preload budget override.
Playwright harness output now writes to temp-sibling report and result folders, and the sample-project loader stays inside the requested project root. It prefers that root’s own verified snapshot metadata and only uses the root’s own legacy `.snapshots.bak` tree when the historical `proj_esther_estate` layout has not been materialized. The harness command now also runs a pipe-spawn preflight before Playwright workers start; if that preflight or the worker spawn fails on Windows, treat it as the tracked blocker in [Validation Failures and Blockers](./reviews/validation_failures_and_blockers.md).

### Backend contract/state lane
- `python -m pytest services/tests/test_analytics_endpoints.py -q`
- `python -m pytest services/tests/test_api_gateway.py -q`
- `python -m pytest services/tests/test_app.py -q`
- `python -m pytest services/tests/test_export_endpoints.py -q`
- `python -m pytest services/tests/test_snapshot_endpoints.py -q`
- `python -m pytest services/tests/test_gui_bridge_contracts.py -q`
- `python -m pytest services/tests -q`

Use these for HTTP and service-contract checks. Do not claim renderer or UI proof from these runs.

### Renderer/unit lane
- `pnpm --filter app test`

Use this for renderer/component logic. It does not prove real-service behavior.
The app test launcher now uses `scripts/run-vitest-offline.mjs` with `app/vitest.config.mjs` instead of loading `app/vite.config.ts` directly. The dedicated config preserves symlink paths to reduce Windows realpath spawn failures. The dedicated runner now also performs a pipe-spawn preflight before Vitest starts. If that preflight or the later esbuild/Vite transform still stops with `spawn EPERM`, treat it as the tracked Windows blocker rather than a product regression.
On this Windows workspace, the preflight fails fast if pipe-based child processes are blocked, which is the tracked reason the esbuild service cannot start.

### Repo hygiene lane
- `python scripts/check_repo_hygiene.py --tracked`
- `python scripts/check_repo_hygiene.py --staged`
- `git diff --check`
- `git hook run pre-commit`

Use these to verify tracked-file cleanliness and hook wiring. They do not prove product correctness.

## Warnings
- Smoke tests are not broad architectural proof.
- Harness-heavy tests are not truth-lane evidence.
- Backend contract tests do not prove the renderer is using the real service path.
- UI-only tests do not prove service correctness.
- The truth lane is the explicit launcher path above, not any smoke or harness fallback.
- A passing harness run that depends on `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` is still harness evidence, not production truth.
- CI success and smoke success remain harness/CI evidence, not wrapper authority or local Windows determinism proof.
- If a command only proves a lane-specific subset, say so explicitly in review notes.

## Where to look next
- [Test Taxonomy and Truth Matrix](./reviews/test_taxonomy_and_truth_matrix.md)
- [Canonical Authority and Validation Lanes](./reviews/canonical_authority_and_validation_lanes.md)
- [Validation Failures and Blockers](./reviews/validation_failures_and_blockers.md)
