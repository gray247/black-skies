# GUI Fix Plan (Consolidated)
> **Status:** Active – keep this file synced with the renderer fixes that ship with Phase 8/9.
> **Version:** v1
> **Last Reviewed:** 2025-11-05
> **Source of Truth:** Canonical GUI fix/rescue plan for Insights gating & offline resilience; other GUI docs should point here.
> **Category:** GUI fix / Rescue plan

## Background
- `docs/gui_fix_plan_todo.md`, `docs/gui_insights_playwright_status.md`, and `tools/gui fixes 2.md` previously tracked outstanding GUI items (Insights gating, floating-pane messaging, Playwright instability). This file replaces them with a single reference so future updates live in one spot.
- The goals remain: keep the packaged renderer stable for Playwright, ensure offline/model gating behaves predictably, and document the verification/rescue steps for GUI automation.

## Completed Plan Items
1. **Insights offline gating + telemetry** – Local vs. model chips are classified, the offline banner/tooltip copy is wired to `bridge.status`, and the companion overlay emits `insights.local_ran`, `insights.model_queued_offline`, and `insights.model_ran_after_reconnect`.
2. **Model queue handling** – Model insights queue offline in volatile memory, replay on reconnect, and log the offline/after-reconnect counts. “Run all” never sends network calls while offline.
3. **Floating-pane clamp + relocation toast** – Off-screen restores run through `clampBoundsToDisplay`, the Diagnostics JSON logs `{pane, from, to, reason}`, and a Surfaced toast + highlight tell writers what changed.
4. **Relocation preferences** – Project Home exposes the floating-window behavior card (notify + auto-snap toggles), the implementation honors “Don’t show again,” and the toast fires once per session.
5. **Test coverage** – Vitest includes the layout suite; Playwright specs now rely on stable `data-testid`s instead of copy-text; the rescue kit rebuilds bundles and reruns `gui.insights` with trace output.

## Playwright Status & Guidance
- **Packaged window boots** – Playwright hits `dist/index.html` (`[electron.url] file:///…/dist/index.html`) and logs `[dbg:boot] app ready` before the timeout. The new `_bootstrap.ts` helper waits for the boot flag, hides overlays, opens the sample project, and waits for `data-testid="dock-workspace"` so every spec starts from the same state.
- **Service health is stubbed** – `window.__testEnv.isPlaywright` (exposed by `app/main/preload.ts`) short-circuits `useServiceHealth` to `status: online`, removing the repeated “Service port is unavailable” noise. Offline behavior still runs via the `__testInsights.setServiceStatus` bridge when tests trigger the companion overlay.
- **Trace tooling** – The Electron fixture now logs `[electron.url]`, `[boot.screenshot]`, and the console output on every run, making it easy to inspect `trace.zip` artifacts. Use `scripts/insights-rescue.ps1` or `pnpm --filter app run e2e:test` with `--trace=on` for reproducible results.

## Playwright Test IDs Introduced
- `app-root` – root of the React shell, ensures the app layout is mounted.
- `open-project` – deterministic button used by `_bootstrap.ts` to open the sample project.
- `dock-workspace` – DockWorkspace root; waiting on this ensures panels are ready.
- `companion-overlay` – overlay that can cover the workspace; `_bootstrap.ts` hides it before interactions.
- `insights-toolbar`, `insights-local-ran`, `insights-model-queued`, `insights-model-resumed` – provide stable hooks for insights telemetry assertions.

## Recommendations & Next Steps
1. Continue collecting Playwright traces (see `app/test-results/.../trace.zip`) so each rerun documents the `[electron.url]`, `[dbg:boot]`, and `[boot.screenshot]` output before the spec finishes.
2. If additional Electron specs fail, rely on `_bootstrap.ts` plus the new IDs to diagnose selectors or overlay issues—avoid touching backend ports or service processes, since health is mocked via `__testEnv`.
3. Once the GUI automation set is stable, remove this doc only after ensuring new plans roll into the codebase’s onboarding/reference docs as needed.
