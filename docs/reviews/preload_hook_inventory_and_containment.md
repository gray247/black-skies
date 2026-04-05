# Preload Hook Inventory and Containment

## Purpose
This document inventories preload-exposed test and harness hooks, then defines containment rules so the repo does not mistake harness control surfaces for production truth.

## Current Preload-Exposed Hook Inventory

There are 14 direct preload-exposed globals in scope here. They are grouped by family because several are always used together.

| Name | Where exposed | Who uses it | What it changes | Current classification | Confidence |
| --- | --- | --- | --- | --- | --- |
| `__electronApi.fs` | `app/main/preload.ts` via `safeExpose('__electronApi', { fs })` | Renderer snapshot / local-analytics code, renderer unit tests that stub `window.__electronApi` | Exposes a real Electron file API wrapper to the renderer | truth-safe | High |
| `__testEnv` | `app/main/preload.ts` via `safeExpose('__testEnv', { isPlaywright })` | Renderer mode detection, service-health timing, toast timing, and truth-lane launch environment | Marks the page as Playwright/test-aware | truth-safe, but not truth evidence | Medium |
| `__test` | `app/main/preload.ts` via `safeExpose('__test', ...)` | Renderer boot path and harness checks | Boot marker / renderer-mounted signal | harness-only (fenced) | High |
| `__dev` | `app/main/preload.ts` via `safeExpose('__dev', ...)` | `app/tests/e2e/_bootstrap.ts`, `app/tests/e2e/_electron.fixture.ts`, smoke and harness Playwright specs | Sets project directory and injects service overrides | harness-only (fenced) | High |
| `__testInsights` | `app/main/preload.ts` via `safeExpose('__testInsights', ...)` | `app/tests/e2e/gui.insights.spec.ts`, `app/tests/e2e/hotkeys-status.spec.ts` | Simulates service status and scene-selection events | harness-only (fenced) | High |
| `testMode` | `app/main/preload.ts` via `safeExpose('testMode', ...)` | No confirmed current consumer outside the preload file itself | Exposes mode getters and debug logging | deprecated, fenced | High |
| `__testEnvFlatMode / __testEnvFullMode / __testEnvRecoveryMode` | `app/main/preload.ts` assigns defaults on `window` | `app/renderer/testMode/testModeManager.ts`, `app/tests/e2e/utils/testModeConfig.ts`, recovery / flow harness specs | Selects flat / recovery / full renderer modes | harness-only (fenced) | High |
| `__testEnvStableDock / __testEnvStableHome / __testEnvVisualStable / __testEnvActiveFlow` | `app/main/preload.ts` assigns defaults on `window` | `app/renderer/App.tsx`, `app/renderer/components/DockWorkspace.tsx`, `app/tests/e2e/dock-workspace.spec.ts`, `app/tests/e2e/utils/serviceStubs.ts` | Forces stable dock/home/visual branches and active-flow behavior | harness-only (fenced) | High |
| `force-offline dataset/event path` | `app/tests/e2e/utils/serviceStubs.ts`, `app/tests/e2e/hotkeys-status.spec.ts`, `app/renderer/testMode/testModeManager.ts` | service-health hooks and harness flows | Sets `data-test-force-offline` plus `test:force-offline` events and carries the offline reason in `data-test-env-force-offline-reason` | harness-only, narrowed and not preload-exposed | High |
| `__testEnvNeedsRecovery` | `app/main/preload.ts` and `app/renderer/hooks/useRecovery.ts` | `app/tests/e2e/hotkeys-status.spec.ts`, recovery harness flows | Forces recovery-mode behavior | harness-only (fenced) | High |

## Related Runtime Globals

These are not directly exposed by preload, but they are part of the same false-confidence surface because tests set or consume them through the renderer.

| Name | Where it lives | Who uses it | What it changes | Current classification | Confidence |
| --- | --- | --- | --- | --- | --- |
| `__testBudgetOverride` | `app/renderer/hooks/useBudgetIndicator.ts` | `app/tests/e2e/budget-meter.spec.ts`, `app/tests/e2e/gui.flows.spec.ts` | Replaces live budget data with a fixture payload | harness-only (fenced, candidate for later removal) | High |
| `__testApplyBudgetOverride` | `app/renderer/hooks/useBudgetIndicator.ts` | `app/tests/e2e/budget-meter.spec.ts` | Applies a test budget payload through a helper API | harness-only (fenced, candidate for later removal) | High |
| `testModeFreezeServiceHealth` dataset flag | `app/renderer/testMode/testModeManager.ts` | test-mode and service-health harness code | Freezes service-health behavior when the dataset flag is set | harness-only, dataset-only | High |
| `test:select-scene` event | `app/renderer/App.tsx`, `app/tests/e2e/gui.flows.spec.ts`, `app/tests/e2e/hotkeys-status.spec.ts` | Harness scene-selection flows | Selects a scene through the renderer event bridge | harness-only, not preload-exposed | Medium |
| `__blackskiesDebugLog` | `app/renderer/utils/debugLog.ts` | truth lane diagnostics, `ProjectHome`, debug snapshots | Captures renderer debug events | truth-safe diagnostic only | Medium |
| `__APP_READY__` | `app/renderer/index.tsx` | Playwright fixtures and smoke tests | Signals renderer boot completion | harness-only bootstrap marker | High |

## High-Risk Hooks

These are the most likely to create false confidence if a passing test is overread:

- `data-test-force-offline` / `test:force-offline` control path
- `__testBudgetOverride`
- `__testApplyBudgetOverride`
- `testModeFreezeServiceHealth` dataset flag
- `__testEnvNeedsRecovery`

The main risk is not that every use is wrong. The risk is that these hooks make a harnessed run look like production truth when it is not.

## Truth-Lane Rules

- Truth-lane validation must not use `__dev`, `__test`, `__testInsights`, or `testMode`.
- Truth-lane validation must not depend on `data-test-force-offline`, `test:force-offline`, `__testBudgetOverride`, `__testApplyBudgetOverride`, `testModeFreezeServiceHealth`, or any scene-selection helper/event.
- Truth-lane validation must not rely on any preload-only truth bypass.
- A preload-only truth bypass is any preload hook that fabricates service health, injects fake service responses, auto-selects scene state, or otherwise substitutes for a real backend boundary.
- A passing truth-lane command is only evidence of truth if it succeeds without harness-only preload APIs being available or required.

## Harness-Lane Rules

- Harness tests may use the explicit preload hooks when `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` is set.
- Harness tests may still use renderer-set mode globals such as `__testEnvActiveFlow` or `__testEnvStableDock`, but those values only prove harness wiring, not production truth.
- Harness tests that use service stubs, offline overrides, or budget overrides must be read as harness evidence only.
- If a harness test needs a preload hook to pass, that hook is still harness-only even if the scenario is useful.

## Containment Actions Taken

- Gated `__test`, `__dev`, `__testInsights`, `testMode`, and the renderer test-mode defaults behind `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` in `app/main/preload.ts`.
- Gated the force-state attributes and `__testEnvNeedsRecovery` behind the same harness flag in `app/main/preload.ts`.
- Removed the redundant `__selectSceneForTest` helper and the preload-global `__testEnvForceOffline` / `__testEnvForceOnline` path; scene selection now uses `test:select-scene`, and offline forcing now uses dataset/event controls.
- Enabled the harness flag in the Playwright Electron launchers under `app/tests/e2e/_electron.fixture.ts` and `app/tests/e2e/electron.launch.ts`.
- Left the truth-lane launcher unchanged so the authoritative truth command does not depend on harness-only preload APIs.
- The remaining budget-override and freeze controls still exist, but they are now a smaller harness-only set rather than a broad preload escape hatch cluster.

## Remaining Gaps

- `__testEnv` is still a live test marker in the renderer and should not be cited as production evidence.
- `__testEnvForceOffline*` is now a dataset/event control path rather than a preload global, but it is still harness-only and can still make a run look more production-like than it is.
- `__testEnvActiveFlow`, `__testEnvStableDock`, and `__testEnvVisualStable` still create mode-specific renderer branches inside the harness lane.
- `__testEnvNeedsRecovery`, budget overrides, and the service-health freeze dataset flag still exist as harness control paths.
- The repo still needs a later pass to decide whether the remaining harness controls should be removed rather than merely fenced.
