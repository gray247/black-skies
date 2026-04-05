# Test Taxonomy and Truth Matrix

## Purpose
This document classifies the current tests by what they actually prove so humans do not mistake harness stability, UI smoke, or backend contracts for real-service truth.

## Lane Definitions

Use the canonical lane meanings from [Canonical Authority and Validation Lanes](./canonical_authority_and_validation_lanes.md).

- Truth lane: real-service behavior against the canonical production boundary.
- UI-only lane: presentation, workflow, or interaction behavior only.
- Harness lane: launcher, fixture, and test orchestration behavior only.
- Backend contract/state lane: HTTP shapes, service state transitions, and backend-only behavior.
- Renderer/unit lane: local component and adapter behavior.
- Repo hygiene lane: tracked-tree cleanliness and hook/enforcement checks.

## Current Test Inventory by Category

### Truth-lane tests

| Path | Current category | What it proves | What it does not prove | Confidence | Notes |
| --- | --- | --- | --- | --- | --- |
| `cmd /c pnpm phase10:review` | Truth-lane launcher reference | Intended real-service review gate | It does not prove current truth-lane availability because `package.json` does not expose `phase10:review` | Low | The underlying spec path is not confirmed in the current inventory; treat this as a planning reference until repo-state confirmation lands. |

No file-based truth-lane suite is confirmed in the current visible inventory.

### UI-only tests

| Path | Current category | What it proves | What it does not prove | Confidence | Notes |
| --- | --- | --- | --- | --- | --- |
| `app/tests/e2e/visual.home.spec.ts` | UI-only | Renderer layout and screenshot stability of the home screen | Backend truth, service routing, or harness correctness | High | Uses the Electron launch fixture, but the intent is visual regression only. |
| `app/tests/e2e/a11y.smoke.spec.ts` | UI-only | Accessibility of the current renderer shell | Backend truth or service contract correctness | High | Uses the Electron launch fixture without service stubs. |

The named `app/tests/e2e/editorial-review-workflow.spec.ts` path from the weakness register is not present in the current inventory; no direct current equivalent was confirmed.

### Harness-driven tests

| Path | Current category | What it proves | What it does not prove | Confidence | Notes |
| --- | --- | --- | --- | --- | --- |
| `app/tests/e2e/smoke.project.spec.ts` | Harness-driven | Minimal project-open and wizard/dock smoke via the launcher | Backend truth or architecture readiness | High | Uses `bootstrapHarness` and injected service overrides. |
| `app/tests/e2e/gui.smoke.spec.ts` | Harness-driven | Smoke workflows over the stubbed GUI path | Real-service truth | High | Explicitly installs service stubs and flips `__testEnvActiveFlow`. |
| `app/tests/e2e/gui.flows.spec.ts` | Harness-driven | Mixed smoke flows, budget guards, restore behavior, and service-port handling under test stubs | Real-service truth | High | This is a classic false-confidence risk file because it mixes presentation and harness behavior. |
| `app/tests/e2e/dock-workspace.spec.ts` | Harness-driven | Dock/layout behavior in the harnessed Electron shell | Backend truth or production routing | High | Uses bootstrap plus stubbed services and runtime config overrides. |
| `app/tests/e2e/layout-no-floating-panes.spec.ts` | Harness-driven | Layout regression behavior in a bootstrapped renderer | Backend truth | High | Validates window/layout shape, not service correctness. |
| `app/tests/e2e/gui.insights.spec.ts` | Harness-driven | Insights interactions with stubbed service-status toggles | Backend truth | High | Uses `__testInsights` and harnessed state changes. |
| `app/tests/e2e/gui.analytics_offline_cache_flow.spec.ts` | Harness-driven | Analytics/offline-cache behavior in a stubbed renderer | Backend truth | High | Uses `__dev.overrideServices` and service-health events. |
| `app/tests/e2e/budget-meter.spec.ts` | Harness-driven | Budget-meter UI behavior under stubbed service responses | Backend truth | High | Uses injected budget responses and harness overrides. |
| `app/tests/e2e/hotkeys-status.spec.ts` | Harness-driven | Hotkey/recovery/status behavior under injected state | Backend truth | High | Heavy use of test-only globals and service overrides. |
| `app/tests/e2e/gui.snapshot_verification_flow.spec.ts` | Harness-driven | Snapshot-verification UI flow in a stubbed environment | Backend truth | High | Presentation and verification modal coverage only. |
| `app/tests/e2e/phase5-export-integrity-flow.spec.ts` | Harness-driven, backend-shaped | Snapshot/backup/export interactions through the harnessed service bridge | Real-service truth | High | Backend-shaped assertions, but still driven through injected services. |
| `app/tests/e2e/gui-contract.spec.ts` | Harness-driven, backend-shaped | GUI contract checks against stubbed services and layout bridges | Real-service truth | High | Contract-shaped, but not a truth-lane test. |

Support files that are part of the harness lane, not standalone tests:

| Path | Current category | What it proves | What it does not prove | Confidence | Notes |
| --- | --- | --- | --- | --- | --- |
| `app/tests/e2e/_electron.fixture.ts` | Harness support | Electron launch and fixture wiring | Product correctness | High | Core launcher fixture. |
| `app/tests/e2e/_bootstrap.ts` | Harness support | Harness startup sequence | Product correctness | High | Shared bootstrap glue. |
| `app/tests/e2e/electron.launch.ts` | Harness support | Electron launch path for non-stub UI smoke | Backend truth | High | Useful for UI-only checks, not proof of service behavior. |
| `app/tests/e2e/servicePort.ts` | Harness support | Port coordination for local E2E runs | Product correctness | High | Launcher glue only. |
| `app/tests/e2e/utils/serviceStubs.ts` | Harness support | Stubbed service behavior used by harness-driven tests | Real-service truth | High | Explicitly injects fake service behavior. |
| `app/tests/e2e/utils/sampleProject.ts` | Harness support | Sample-project fixture loading | Truth-lane readiness | Medium | Depends on local filesystem layout. |
| `app/tests/e2e/utils/loadRenderer.ts` | Harness support | Packaged renderer loading | Product correctness | High | Launcher helper only. |
| `app/tests/e2e/utils/guiContract.ts` | Harness support | GUI contract lookup data | Product correctness | High | Assertion data helper only. |
| `app/tests/e2e/utils/testModeConfig.ts` | Harness support | Test-mode toggles | Product correctness | High | Test-mode helper only. |

### Backend contract/state tests

| Path | Current category | What it proves | What it does not prove | Confidence | Notes |
| --- | --- | --- | --- | --- | --- |
| `services/tests/test_analytics_endpoints.py` | Backend contract/state | Analytics endpoint shapes and payload values | Renderer behavior or UI interaction | High | HTTP contract coverage. |
| `services/tests/test_api_gateway.py` | Backend contract/state | Gateway routing and error handling | Renderer behavior | High | Backend-only API coverage. |
| `services/tests/test_app.py` | Backend contract/state | Core app routes and service integration behavior | UI-only rendering behavior | High | Strong backend integration coverage. |
| `services/tests/test_export_endpoints.py` | Backend contract/state | Export endpoint behavior and payloads | Renderer truth | High | Backend contract coverage. |
| `services/tests/test_snapshot_endpoints.py` | Backend contract/state | Snapshot endpoint behavior | UI truth | High | Backend-only state checks. |
| `services/tests/test_gui_bridge_contracts.py` | Backend contract/state | GUI bridge contract shapes | Renderer UI behavior | High | Contract-oriented, not UI proof. |
| `services/tests/test_long_form_endpoint.py` | Backend contract/state | Long-form endpoint behavior | Renderer behavior | High | Backend API coverage. |
| `services/tests/test_phase4_loop.py` | Backend contract/state | Phase-4 loop service behavior | UI polish or launcher truth | Medium | Integration-heavy, but still backend-side. |
| `services/tests/test_service_process.py` | Backend contract/state | Service startup and health behavior in-process | Renderer truth | High | Process/health probe only. |
| `services/tests/test_end_to_end_gui_flow.py` | Backend contract/state | Backend-side end-to-end GUI flow support | UI-only rendering truth | Medium | Name is broad; keep a human eye on intent. |
| `services/tests/unit/*.py` | Backend unit | Backend utilities, orchestration, and domain behavior | Renderer truth or UI truth | High | Unit tests support the backend lane even when they are not contract tests. |

### Renderer/unit tests

| Path | Current category | What it proves | What it does not prove | Confidence | Notes |
| --- | --- | --- | --- | --- | --- |
| `app/renderer/__tests__/*.test.ts`, `app/renderer/__tests__/*.test.tsx` | Renderer/unit | Component, adapter, and local renderer behavior | Service routing or truth-lane readiness | High | This includes `IPCContracts.test.tsx`, snapshot-backed component tests, and behavior tests. |
| `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap` | Renderer/unit support | Snapshot expectations for the renderer test suite | Anything by itself | High | Snapshot artifact, not a standalone test. |

### Repo hygiene / ops enforcement checks

| Path | Current category | What it proves | What it does not prove | Confidence | Notes |
| --- | --- | --- | --- | --- | --- |
| `python scripts/check_repo_hygiene.py --tracked` | Repo hygiene | Tracked-tree hygiene | Product correctness | High | Validates banned tracked artifacts. |
| `python scripts/check_repo_hygiene.py --staged` | Repo hygiene | Staged-path hygiene before commit | Product correctness | High | Hook-oriented staged scan. |
| `git diff --check` | Repo hygiene | Whitespace / patch sanity | Product correctness | High | Diff formatting guard only. |
| `git hook run pre-commit` | Repo hygiene / harness | Local hook execution and staged enforcement wiring | Product correctness | High | Validates hook reliability, not app behavior. |
| `cmd /c pnpm repo:hygiene` | Repo hygiene | Repo hygiene command wiring | Product correctness | High | Convenience wrapper around the hygiene scanner. |

## Misclassification Risks

- WK-001, WK-009, WK-013: any test that uses `__dev`, `__testEnv*`, `__testInsights`, or `installServiceStubs` is not truth-lane.
- WK-002, WK-016: `pnpm test:e2e` goes through `scripts/e2e-with-backend.mjs`, which defaults to smoke files and `--grep smoke_` unless explicitly overridden.
- WK-008, WK-010, WK-015: `gui.flows.spec.ts`, `gui.smoke.spec.ts`, `dock-workspace.spec.ts`, `smoke.project.spec.ts`, `gui.insights.spec.ts`, `gui.analytics_offline_cache_flow.spec.ts`, `budget-meter.spec.ts`, `hotkeys-status.spec.ts`, `gui.snapshot_verification_flow.spec.ts`, `phase5-export-integrity-flow.spec.ts`, and `gui-contract.spec.ts` are harness-driven, not truth-lane.
- WK-011: `smoke.project.spec.ts` and any sample-project-driven flow can pass because the filesystem happens to contain the expected fixture layout.
- WK-014: `app/tests/e2e/editorial-review-workflow.spec.ts` is not present in the current inventory, so it must not be cited as a current truth or UI-only suite until the repo-state path is confirmed.

## Proposed Taxonomy Rules

- A test that uses service stubs is not truth-lane.
- A test that uses preload-only overrides, `__dev`, or `__testEnv*` globals is not truth-lane.
- A renderer interaction test is not backend proof.
- A smoke test is not broad architectural proof.
- A backend contract test does not prove renderer behavior.
- A UI-only screenshot or a11y test does not prove the backend is correct.
- A harness pass does not prove the production path is correct.

## Proposed Command Matrix

| Command | Lane | Intent | Allowed claims | Forbidden claims |
| --- | --- | --- | --- | --- |
| `cmd /c pnpm phase10:review` | Truth lane reference | Intended real-service review gate | Only that it is the intended truth-lane launcher once repo-state confirmation lands | Current availability, or any claim that smoke/harness/UI-only runs are equivalent |
| `pnpm test:e2e` | Harness-driven | Smoke-fallback E2E launcher | Smoke path / harness wiring only | Truth-lane or broad architecture proof |
| `pnpm --dir app exec playwright test tests/e2e/visual.home.spec.ts --project=electron --workers=1` | UI-only | Screenshot regression | Visual/layout stability | Backend truth or service correctness |
| `pnpm --dir app exec playwright test tests/e2e/a11y.smoke.spec.ts --project=electron --workers=1` | UI-only | Accessibility smoke | Renderer accessibility of the current shell | Backend truth |
| `pnpm --dir app exec playwright test tests/e2e/gui.smoke.spec.ts --project=electron --workers=1` | Harness-driven | Stubbed GUI smoke | Launcher/fixture sanity and basic UI flow under stubs | Real-service truth |
| `pnpm --dir app exec playwright test tests/e2e/gui.flows.spec.ts --project=electron --workers=1` | Harness-driven | Mixed smoke flows and guardrails | Harnessed interaction behavior | Real-service truth |
| `pnpm --dir app exec playwright test tests/e2e/dock-workspace.spec.ts --project=electron --workers=1` | Harness-driven | Dock/layout behavior | Layout and focus behavior under the harness | Backend truth |
| `pnpm --dir app exec playwright test tests/e2e/gui.insights.spec.ts --project=electron --workers=1` | Harness-driven | Insights workflow behavior | UI interaction under test globals | Backend truth |
| `pnpm --dir app exec playwright test tests/e2e/gui.analytics_offline_cache_flow.spec.ts --project=electron --workers=1` | Harness-driven | Offline-cache UI flow | Cache and status handling under injected service state | Real-service readiness |
| `python -m pytest services/tests/test_analytics_endpoints.py -q` | Backend contract/state | Analytics contract behavior | API shape and payload correctness | Renderer proof |
| `python -m pytest services/tests -q` | Backend contract/state | Backend regression coverage | Backend-only service behavior | Renderer/UI proof |
| `pnpm --filter app test` | Renderer/unit | Component and adapter logic | Renderer-local regressions | Backend truth |
| `python scripts/check_repo_hygiene.py --tracked` | Repo hygiene | Tracked-path cleanliness | Clean tracked tree | Product correctness |
| `git hook run pre-commit` | Repo hygiene / harness | Hook wiring and staged enforcement | Local hook execution | Product correctness |

## Immediate Follow-on Work Enabled by This

- Preload/test-hook containment.
- Fixture dependency cleanup.
- Launcher/default-path truth hardening.
- A later pass can turn the unconfirmed truth launcher into a confirmed truth-lane gate if the repo-state path is restored.
