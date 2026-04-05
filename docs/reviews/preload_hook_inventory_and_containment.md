# Preload Hook Inventory and Containment

## Purpose
This document inventories preload-exposed test and harness hooks, then defines containment rules so the repo does not mistake harness control surfaces for production truth.

## Current Preload-Exposed Hook Inventory

There are 7 direct preload-exposed globals in scope here. They are grouped by family because several are always used together.

| Name | Where exposed | Who uses it | What it changes | Current classification | Confidence |
| --- | --- | --- | --- | --- | --- |
| `__electronApi.fs` | `app/main/preload.ts` via `safeExpose('__electronApi', { fs })` | Renderer snapshot / local-analytics code, renderer unit tests that stub `window.__electronApi` | Exposes a real Electron file API wrapper to the renderer | truth-safe | High |
| `__testEnv` | `app/main/preload.ts` via `safeExpose('__testEnv', { isPlaywright })` | Renderer mode detection, service-health timing, toast timing, and truth-lane launch environment | Marks the page as Playwright/test-aware | truth-safe, but not truth evidence | Medium |
| `__test` | `app/main/preload.ts` via `safeExpose('__test', ...)` | Renderer boot path and harness checks | Boot marker / renderer-mounted signal | harness-only (fenced) | High |
| `__dev` | `app/main/preload.ts` via `safeExpose('__dev', ...)` | `app/tests/e2e/_bootstrap.ts`, `app/tests/e2e/_electron.fixture.ts`, smoke and harness Playwright specs | Sets project directory and injects service overrides | harness-only (fenced) | High |
| `__testInsights` | `app/main/preload.ts` via `safeExpose('__testInsights', ...)` | `app/tests/e2e/gui.insights.spec.ts`, `app/tests/e2e/hotkeys-status.spec.ts` | Simulates service status and scene-selection events | harness-only (fenced) | High |
| `testMode` | `app/main/preload.ts` via `safeExpose('testMode', ...)` | No confirmed current consumer outside the preload file itself | Exposes mode getters and debug logging | deprecated, fenced | High |
| `__testEnvFlatMode / __testEnvFullMode / __testEnvRecoveryMode` | `app/main/preload.ts` assigns defaults on `window` | `app/renderer/testMode/testModeManager.ts`, `app/tests/e2e/utils/testModeConfig.ts`, recovery / flow harness specs | Selects flat / recovery / full renderer modes | harness-only (fenced) | High |

## Related Runtime Globals

These are not directly exposed by preload, but they are part of the same false-confidence surface because tests set or consume them through the renderer.

| Name | Where it lives | Who uses it | What it changes | Current classification | Confidence |
| --- | --- | --- | --- | --- | --- |
| `data-test-active-flow` | `app/main/preload.ts`, `app/tests/e2e/utils/serviceStubs.ts`, `app/tests/e2e/dock-workspace.spec.ts` | Harness flow setup | Marks active harness flow so the renderer can relax live-flow guards | harness-only dataset flag | High |
| `data-test-stable-dock / data-test-stable-home / data-test-visual-stable` | `app/main/preload.ts`, `app/renderer/App.tsx`, `app/renderer/components/docking/DockWorkspace.tsx`, `app/tests/e2e/dock-workspace.spec.ts` | Harness layout and visual flows | Forces stable dock/home/visual branches without using preload globals | harness-only dataset flags | High |
| `data-test-needs-recovery` | `app/main/preload.ts`, `app/renderer/hooks/useRecovery.ts`, `app/tests/e2e/hotkeys-status.spec.ts` | Recovery harness flows | Forces recovery-mode behavior without a preload global | harness-only dataset flag | High |
| `testModeFreezeServiceHealth` dataset flag | `app/renderer/testMode/testModeManager.ts` | test-mode and service-health harness code | Freezes service-health behavior when the dataset flag is set | harness-only, dataset-only | High |
| `test:select-scene` event | `app/renderer/App.tsx`, `app/tests/e2e/gui.flows.spec.ts`, `app/tests/e2e/hotkeys-status.spec.ts` | Harness scene-selection flows | Selects a scene through the renderer event bridge | harness-only, not preload-exposed | Medium |
| `__blackskiesDebugLog` | `app/renderer/utils/debugLog.ts` | truth lane diagnostics, `ProjectHome`, debug snapshots | Captures renderer debug events | truth-safe diagnostic only | Medium |
| `__APP_READY__` | `app/renderer/index.tsx` | Playwright fixtures and smoke tests | Signals renderer boot completion | harness-only bootstrap marker | High |

## High-Risk Hooks

These are the most likely to create false confidence if a passing test is overread:

- `data-test-force-offline` / `test:force-offline` control path
- `data-test-active-flow`
- `data-test-stable-dock` / `data-test-stable-home` / `data-test-visual-stable`
- `data-test-needs-recovery`
- `testModeFreezeServiceHealth` dataset flag
- `test:select-scene` event

The main risk is not that every use is wrong. The risk is that these hooks make a harnessed run look like production truth when it is not.

## Truth-Lane Rules

- Truth-lane validation must not use `__dev`, `__test`, `__testInsights`, or `testMode`.
- Truth-lane validation must not depend on `data-test-force-offline`, `test:force-offline`, `data-test-active-flow`, `data-test-stable-dock`, `data-test-stable-home`, `data-test-visual-stable`, `data-test-needs-recovery`, `testModeFreezeServiceHealth`, or any scene-selection helper/event.
- Truth-lane validation must not rely on any preload-only truth bypass.
- A preload-only truth bypass is any preload hook that fabricates service health, injects fake service responses, auto-selects scene state, or otherwise substitutes for a real backend boundary.
- A passing truth-lane command is only evidence of truth if it succeeds without harness-only preload APIs being available or required.

## Harness-Lane Rules

- Harness tests may use the explicit preload hooks when `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` is set.
- Harness tests may still use renderer-set mode globals such as `__testEnvFlatMode` or `__testEnvRecoveryMode`, and they may use dataset markers such as `data-test-active-flow` or `data-test-stable-dock`, but those values only prove harness wiring, not production truth.
- Harness tests that use service stubs, offline overrides, or dataset-driven budget results must be read as harness evidence only.
- If a harness test needs a preload hook to pass, that hook is still harness-only even if the scenario is useful.

## Containment Actions Taken

- Gated `__test`, `__dev`, `__testInsights`, `testMode`, and the renderer test-mode defaults behind `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` in `app/main/preload.ts`.
- Gated the force-state attributes behind the same harness flag in `app/main/preload.ts` and moved the recovery marker to the `data-test-needs-recovery` dataset path.
- Removed the redundant `__selectSceneForTest` helper and the preload-global `__testEnvForceOffline` / `__testEnvForceOnline` path; scene selection now uses `test:select-scene`, and offline forcing now uses dataset/event controls.
- Removed the `__testApplyBudgetOverride` helper and moved the active-flow, stable-dock, stable-home, visual-stable, and recovery markers onto dataset/event controls.
- Enabled the harness flag in the Playwright Electron launchers under `app/tests/e2e/_electron.fixture.ts` and `app/tests/e2e/electron.launch.ts`.
- Left the truth-lane launcher unchanged so the authoritative truth command does not depend on harness-only preload APIs.
- The remaining freeze and dataset-driven controls still exist, but they are now a smaller harness-only set rather than a broad preload escape hatch cluster.

## Remaining Gaps

- `__testEnv` is still a live test marker in the renderer and should not be cited as production evidence.
- `data-test-force-offline` / `test:force-offline` are harness-only control paths, even though they no longer use preload globals.
- `data-test-active-flow`, `data-test-stable-dock`, `data-test-stable-home`, and `data-test-visual-stable` still create mode-specific renderer branches inside the harness lane.
- `data-test-needs-recovery` and the service-health freeze dataset flag still exist as harness control paths.
- The repo still needs a later pass to decide whether the remaining harness controls should be removed rather than merely fenced.
