# Test Mode Architecture

This document captures how the renderer enters and flows through the four automated test modes, why each exists, and how the Phase 6 Playwright harness can surface those states safely.

## Mode definitions
- **none** – Production runtime with no overrides; used by every build outside of Playwright.
- **flat** – Wizard/draft-focused flows (wizard ? draft, snapshot restore, budget guardrail) that suppress the dock/Mosaic workspace and expose the flat-only hotkey layout.
- **recovery** – Offline and recovery scenarios (service_port_unavailable, recovery-only flows) that still display the Dock workspace but enable forced-restore instrumentation.
- **full** – All other flows (export integrity, analytics, dock workspace/visual/contract flows, hotkeys) that run the normal DockWorkspace experience.

## Spec-to-mode mapping
| Flow | Playwright spec | Mode | Notes |
| --- | --- | --- | --- |
| Wizard / snapshot restore / budget guardrail | `gui.flows.spec.ts` smoke flows + `budget_guardrail_smoke` | `flat` | Flat mode hides Dock components and keeps the simplified focus cycle. |
| Snapshot recovery / offline banner tests | `gui.flows.spec.ts` `snapshot_restore_flow`, `service_port_unavailable_flow` | `recovery` | Forces rebuild, keeps RecoveryBanner and restore wiring intact. |
| Dock workspace / hotkeys / analytics / visual snapshots / contract checks | `dock-workspace.spec.ts`, `hotkeys-status.spec.ts`, `gui.analytics_offline_cache_flow.spec.ts`, `visual.home.spec.ts`, `gui-contract.spec.ts`, `phase5-export-integrity-flow.spec.ts` | `full` | Real dock and mosaic remain enabled so layout smoke tests exercise the production UI. |

## Flag flow (stub ? hook)
1. Playwright stubs (`app/tests/e2e/utils/testModeConfig.ts`) call `setFlatMode`, `setRecoveryMode`, or `setFullMode` to toggle the globals + `body.dataset.testMode` the renderer knows about.
2. The preload exposes `window.testMode` only when `BLACKSKIES_ENABLE_HARNESS_HOOKS=1` is set, so harness runs can read the current mode and offline reason via `getMode` / `getOfflineReason` without implying that the same surface is valid production evidence.
3. `App.tsx` routes to `TestModeFlatHome`, `TestModeRecoveryHome`, or the full `DockWorkspace` depending on `testModeManager`'s state, and it stamps `document.body.dataset.testMode` so the new `test-mode.css` can scope Dock/Mosaic hiding (`body[data-test-mode='flat'] .dock-workspace` etc).
4. Hooks like `useServiceHealth` (and downstream components such as `ServiceHealthBanner`) read the offline reason from the same manager, which ensures forced-offline stubs show the banner text the tests expect without re-checking ad-hoc globals.
5. `_bootstrap.ts` asks `window.testMode.getMode()` instead of sniffing raw globals, so it can skip the online pill wait in `recovery` / forced-offline runs while still waiting for the Dock in `full`.

## Dock / CSS caveats
- Only **flat** mode hides the Dock/Mosaic chrome (`test-mode.css` targets `body[data-test-mode='flat']`). Recovery and full modes keep DockWorkspace rendered.
- Recovery mode retains the banner/restore flow but inherits the normal layout so `ServiceHealthBanner` and `RecoveryBanner` stay visible when `testModeManager.getMode() === 'recovery'`.
- Flat mode still renders the minimal `<div data-pane-id='outline'>` so hotkey focus cycles succeed even though Dock is suppressed.

## Debugging
- When the harness flag is enabled, the preload exposes `window.testMode.debug()` so you can open DevTools in Playwright/Electron runs and log the current `{ mode, isFlat, isRecovery, isFull, offlineReason }` without re-running the stub logic.

Keep this doc up-to-date any time additional specs lean on a new mode or the stub wiring changes.
