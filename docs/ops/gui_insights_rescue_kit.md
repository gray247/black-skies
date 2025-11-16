Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# GUI Insights Rescue Kit
> **Category:** Troubleshooting / Ops · Supporting plan / Rescue kit / Deep-dive
> **Status:** Ops rescue kit for Insights automation stability; not a canonical spec.
> **Reference:** See `docs/gui/gui_fix_plan.md` for the primary GUI fix/rescue story.
> **Index:** `docs/ops/dev_ops_notes.md`

When `app/tests/e2e/gui.insights.spec.ts` locks up on a blank Electron window, the symptoms line up with the stray `page.goto`, missing renderer logs, and the trace that never reaches `dock-workspace`. This rescue kit forces the packaged renderer, captures the crash trace, and requires a tiny smoke gate before rerunning the Insights scenario.

## What the kit does
- rebuilds `app/dist` and `app/dist-electron` so `ELECTRON_RENDERER_URL` points at the packaged bundle instead of a dev server.
- runs `tests/e2e/smoke.project.spec.ts` first to make sure the harness or project loader can actually start.
- runs `tests/e2e/gui.insights.spec.ts` with tracing enabled and prints the new `app/test-results/.../trace.zip` path so you can inspect the renderer console.

## Run the kit
```powershell
powershell -NoProfile -Command "pwsh scripts/insights-rescue.ps1"
```

The script also accepts `-SkipSmokeTest` if you need to rerun just the Insights spec after smoke already passed:
```powershell
pwsh scripts/insights-rescue.ps1 -SkipSmokeTest
```

## What to look at if it still fails
- The script prints `trace.zip` locations. Open that trace with `pnpm --dir app exec playwright show-trace <path>` and watch the console output (`[renderer:*]`) to see if `App.tsx` hits a crash before `DockWorkspace` renders.
- Use the trace to confirm the stray `page.goto` never executes and that `window.__blackskiesDebugLog` contains the `insights.*` events the spec asserts at the end.
- If the renderer is still blank, check `app/temp-trace` and the new console output for React error boundaries or missing assets. The new build in the kit keeps you on the packaged bundle, so you will only see the real crash.

Add this doc to your discovery workflow so the next investigator has a copy-pasteable kit handy and a quick smoke gate before the Insights spec runs again.
