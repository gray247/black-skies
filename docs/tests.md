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

## Current commands by lane

### Truth lane
- Authoritative command: `pnpm test:truth`
- Launcher path: `scripts/truth-with-backend.mjs`
- What it does: starts the real backend, materializes a temp `Esther_Estate` project root from the bundled sample snapshot, launches Electron against the real service port, then attaches over CDP and calls the real renderer preflight bridge without service stubs or preload-only overrides.
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
Harness runs may use the explicit preload hooks listed in [Preload Hook Inventory and Containment](./reviews/preload_hook_inventory_and_containment.md), but those hooks are not truth evidence.
Playwright harness output now writes to temp-sibling report and result folders, and the sample-project loader falls back to the current snapshot layout when a legacy root is missing. If a Windows run still stops at worker spawn, treat that as the tracked blocker in [Validation Failures and Blockers](./reviews/validation_failures_and_blockers.md).

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
The app test launcher now uses `scripts/run-vitest-offline.mjs` with `app/vitest.config.mjs` instead of loading `app/vite.config.ts` directly. The dedicated config preserves symlink paths to reduce Windows realpath spawn failures. If the suite still stops in esbuild or Vite transform with `spawn EPERM`, treat that as the tracked Windows blocker rather than a product regression.

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
- If a command only proves a lane-specific subset, say so explicitly in review notes.

## Where to look next
- [Test Taxonomy and Truth Matrix](./reviews/test_taxonomy_and_truth_matrix.md)
- [Canonical Authority and Validation Lanes](./reviews/canonical_authority_and_validation_lanes.md)
- [Validation Failures and Blockers](./reviews/validation_failures_and_blockers.md)
