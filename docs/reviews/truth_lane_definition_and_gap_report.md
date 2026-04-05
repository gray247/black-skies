# Truth Lane Definition and Gap Report

## Purpose
This document defines the actual truth-lane path and records the remaining gaps so humans do not confuse a runnable real-service gate with smoke, harness, or UI-only validation.

## Current Reality
- Prior truth-lane references in the repo were stale or unbacked. The old `phase10:review` reference was not an executable command in the visible package manifest, and the previously named real-service Playwright specs were not a confirmed authoritative path.
- `pnpm test:e2e` is not sufficient for truth claims because it routes through the smoke/harness launcher and can narrow coverage without making that obvious.
- The current truth lane is now explicit: `pnpm test:truth`.
- The launcher path is `scripts/truth-with-backend.mjs` -> real Electron + CDP attach.
- The launcher now materializes a temporary `Esther_Estate` project root from the bundled snapshot source so the renderer and backend agree on the same real project ID.
- The truth lane no longer relies on the Python Electron helper or on a fake truth path. It loads the real project, verifies the live bridge, and calls the real preflight service from the renderer context.

## Truth Lane Criteria
A truth-lane test must satisfy all of these:
- No service stubs.
- No preload-only truth bypass.
- No smoke fallback ambiguity.
- Real service/process boundary exercised.
- Explicit command path.
- Clear claim boundaries.

## Candidate Inventory
- `app/tests/e2e/truth.real-service.spec.ts`: close to truth-lane intent, but it is only a supporting scenario now. It is not the authoritative command path.
- `pnpm test:e2e`: does not qualify. It is a smoke/harness launcher.
- `app/tests/e2e/gui.smoke.spec.ts`, `app/tests/e2e/gui.flows.spec.ts`, `app/tests/e2e/dock-workspace.spec.ts`, and similar harness specs: do not qualify because they use service stubs or harness shortcuts.
- `services/tests/test_analytics_endpoints.py` and other backend contract tests: useful backend evidence, but not full truth-lane proof because they do not cross the runtime boundary through the real Electron path.
- `scripts/truth-with-backend.mjs`: authoritative launcher orchestrator.
- `scripts/launch_truth_electron.py`: legacy helper, no longer part of the authoritative truth path.

## Selected Truth Lane Path
- Exact command: `pnpm test:truth`
- Exact launcher/config used: `scripts/truth-with-backend.mjs`, fixed CDP port `9222`, temporary project base rooted under the launcher temp directory
- Exact runtime boundary: backend `uvicorn` process plus Electron launched against `app/dist-electron/main/main.js` or `app/main/main.ts` fallback, with the renderer pointed at `app/dist/index.html`, a loaded real project, and the live renderer bridge
- Why this is the chosen path: it is explicit, does not rely on service stubs, materializes a real project root with the correct project ID, and exercises the backend + renderer bridge while keeping the lane small and honest

## What This Lane Proves
- The backend can boot and answer health checks.
- Electron can be launched against the real service port.
- The renderer can connect to the real bridge and report service health.
- The renderer can invoke the real preflight bridge against a loaded real project.

## What This Lane Does Not Prove
- UI polish or screenshot stability by itself.
- Harness correctness by itself.
- Backend contract behavior by itself.
- The Generate button click path itself.
- Any test path that still uses stubs, preload-only overrides, or smoke fallback behavior.

## Remaining Gaps
- The truth lane now runs successfully in this workspace, but it still does not prove the Generate button click path itself.
- The renderer debug log snapshot observed during the lane is empty, so that signal is not yet useful as a proof source.
- The Playwright reference spec `app/tests/e2e/truth.real-service.spec.ts` remains supporting material rather than the authoritative lane.

## Next Follow-on Work
- Keep the truth lane small and honest while the launcher path remains stable.
- Decide whether the Generate-button interaction should become a separate UI-harness check or remain out of the truth lane.
- Consider whether the legacy Python helper should be retired entirely now that the repo launcher is stable.
