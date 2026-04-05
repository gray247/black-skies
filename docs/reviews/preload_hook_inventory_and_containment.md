# Preload Hook Inventory and Containment

## Purpose
This document inventories preload-exposed test and harness hooks, then defines containment rules so the repo does not mistake harness control surfaces for production truth.

## Current Preload-Exposed Hook Inventory

There are 16 direct preload-exposed globals in scope here. They are grouped by family because several are always used together.

| Name | Where exposed | Who uses it | What it changes | Current classification | Confidence |
| --- | --- | --- | --- | --- | --- |
| `__electronApi.fs` | `app/main/preload.ts` via `safeExpose('__electronApi', { fs })` | Renderer snapshot / local-analytics code, renderer unit tests that stub `window.__electronApi` | Exposes a real Electron file API wrapper to the renderer | truth-safe | High |
| `__testEnv` | `app/main/preload.ts` via `safeExpose('__testEnv', { isPlaywright })` | Renderer mode detection, service-health timing, toast timing, and truth-lane launch environment | Marks the page as Playwright/test-aware | truth-safe, but not truth evidence | Medium |
| `__test` | `app/main/preload.ts` via `safeExpose('__test', ...)` | Renderer boot path and harness checks | Boot marker / renderer-mounted signal | harness-only | High |
| `__dev` | `app/main/preload.ts` via `safeExpose('__dev', ...)` | `app/tests/e2e/_bootstrap.ts`, `app/tests/e2e/_electron.fixture.ts`, smoke and harness Playwright specs | Sets project directory and injects service overrides | harness-only | High |
| `__testInsights` | `app/main/preload.ts` via `safeExpose('__testInsights', ...)` | `app/tests/e2e/gui.insights.spec.ts`, `app/tests/e2e/hotkeys-status.spec.ts` | Simulates service status and scene-selection events | harness-only | High |
| `testMode` | `app/main/preload.ts` via `safeExpose('testMode', ...)` | No confirmed current consumer outside the preload file itself | Exposes mode getters and debug logging | deprecated | High |
| `__testEnvFlatMode / __testEnvFullMode / __testEnvRecoveryMode` | `app/main/preload.ts` assigns defaults on `window` | `app/renderer/testMode/testModeManager.ts`, `app/tests/e2e/utils/testModeConfig.ts`, recovery / flow harness specs | Selects flat / recovery / full renderer modes | harness-only | Medium |
| `__testEnvStableDock / __testEnvStableHome / __testEnvVisualStable / __testEnvActiveFlow` | `app/main/preload.ts` assigns defaults on `window` | `app/renderer/App.tsx`, `app/renderer/components/DockWorkspace.tsx`, `app/tests/e2e/dock-workspace.spec.ts`, `app/tests/e2e/utils/serviceStubs.ts` | Forces stable dock/home/visual branches and active-flow behavior | harness-only | Medium |
| `__testEnvForceOffline / __testEnvForceOnline / __testEnvForceOfflineReason` | `app/main/preload.ts` and `app/renderer/testMode/testModeManager.ts` | `app/tests/e2e/utils/serviceStubs.ts`, `app/tests/e2e/hotkeys-status.spec.ts`, service-health hooks | Forces offline/online status and offline reason handling | risky / should be removed | High |
| `__testEnvNeedsRecovery` | `app/main/preload.ts` and `app/renderer/hooks/useRecovery.ts` | `app/tests/e2e/hotkeys-status.spec.ts`, recovery harness flows | Forces recovery-mode behavior | harness-only | Medium |

## Related Runtime Globals

These are not directly exposed by preload, but they are part of the same false-confidence surface because tests set or consume them through the renderer.

| Name | Where it lives | Who uses it | What it changes | Current classification | Confidence |
| --- | --- | --- | --- | --- | --- |
| `__testBudgetOverride` | `app/renderer/hooks/useBudgetIndicator.ts` | `app/tests/e2e/budget-meter.spec.ts`, `app/tests/e2e/gui.flows.spec.ts` | Replaces live budget data with a fixture payload | risky / should be removed | High |
| `__testApplyBudgetOverride` | `app/renderer/hooks/useBudgetIndicator.ts` | `app/tests/e2e/budget-meter.spec.ts` | Applies a test budget payload through a helper API | risky / should be removed | High |
| `__testModeFreezeServiceHealth` | `app/renderer/testMode/testModeManager.ts` | test-mode and service-health harness code | Freezes service-health behavior | risky / should be removed | High |
| `__selectSceneForTest` | `app/renderer/App.tsx` | `app/tests/e2e/gui.flows.spec.ts`, `app/tests/e2e/hotkeys-status.spec.ts` | Forces scene selection in the renderer | harness-only | Medium |
| `__blackskiesDebugLog` | `app/renderer/utils/debugLog.ts` | truth lane diagnostics, `ProjectHome`, debug snapshots | Captures renderer debug events | truth-safe diagnostic only | Medium |
| `__APP_READY__` | `app/renderer/index.tsx` | Playwright fixtures and smoke tests | Signals renderer boot completion | harness-only bootstrap marker | High |

## High-Risk Hooks

These are the most likely to create false confidence if a passing test is overread:

- `__dev`
- `__testInsights`
- `testMode`
- `__testEnvForceOffline`
- `__testEnvForceOnline`
- `__testEnvForceOfflineReason`
- `__testBudgetOverride`
- `__testApplyBudgetOverride`
- `__testModeFreezeServiceHealth`
- `__selectSceneForTest`

The main risk is not that every use is wrong. The risk is that these hooks make a harnessed run look like production truth when it is not.

## Truth-Lane Rules

- Truth-lane validation must not use `__dev`, `__test`, `__testInsights`, or `testMode`.
- Truth-lane validation must not depend on `__testEnvForceOffline`, `__testEnvForceOnline`, `__testEnvForceOfflineReason`, `__testBudgetOverride`, `__testApplyBudgetOverride`, `__testModeFreezeServiceHealth`, or `__selectSceneForTest`.
- Truth-lane validation must not rely on any preload-only truth bypass.
- A preload-only truth bypass is any preload hook that fabricates service health, injects fake service responses, auto-selects scene state, or otherwise substitutes for a real backend boundary.
- A passing truth-lane command is only evidence of truth if it succeeds without harness-only preload APIs being available or required.

## Harness-Lane Rules

- Harness tests may use the explicit preload hooks when `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` is set.
- Harness tests may still use renderer-set mode globals such as `__testEnvActiveFlow` or `__testEnvStableDock`, but those values only prove harness wiring, not production truth.
- Harness tests that use service stubs, offline overrides, or budget overrides must be read as harness evidence only.
- If a harness test needs a preload hook to pass, that hook is still harness-only even if the scenario is useful.

## Containment Actions Taken

- Gated `__test`, `__dev`, `__testInsights`, and `testMode` behind `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` in `app/main/preload.ts`.
- Enabled the harness flag in the Playwright Electron launchers under `app/tests/e2e/_electron.fixture.ts` and `app/tests/e2e/electron.launch.ts`.
- Left the truth-lane launcher unchanged so the authoritative truth command does not depend on harness-only preload APIs.
- No hook removal was attempted in this pass.

## Remaining Gaps

- `__testEnv` is still a live test marker in the renderer and should not be cited as production evidence.
- `__testEnvForceOffline*`, budget overrides, and service-health freeze hooks still exist as broad harness control paths.
- `__testEnvActiveFlow`, `__testEnvStableDock`, and `__testEnvVisualStable` still create mode-specific renderer branches that can make a test look more stable than production.
- The repo still needs a later pass to decide whether some of these globals should be removed rather than merely fenced.
