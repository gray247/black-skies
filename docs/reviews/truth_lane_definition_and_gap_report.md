# Truth Lane Definition and Gap Report

## Purpose
This document defines the actual truth-lane path and records the remaining gaps so humans do not confuse a runnable real-service gate with smoke, harness, or UI-only validation.

## Current Reality
- Prior truth-lane references in the repo were stale or unbacked. The old `phase10:review` reference was not an executable command in the visible package manifest, and the previously named real-service Playwright specs were not a confirmed authoritative path.
- `pnpm test:e2e` is not sufficient for truth claims because it routes through the smoke/harness launcher and can narrow coverage without making that obvious.
- The current truth lane is now explicit: `pnpm test:truth`.
- The launcher path is `scripts/truth-with-backend.mjs` -> `scripts/launch_truth_electron.py` -> real Electron + CDP attach.
- In this workspace, the repo-level launcher still fails with `spawn EPERM` before it can complete. The helper module itself can be run directly from shell with `python -m scripts.launch_truth_electron`, and that direct run successfully starts Electron and prints a PID. The remaining gap is the repo-orchestrated launch path, not the helper module logic.

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
- `scripts/launch_truth_electron.py`: Electron process launcher support.

## Selected Truth Lane Path
- Exact command: `pnpm test:truth`
- Exact launcher/config used: `scripts/truth-with-backend.mjs`, `scripts/launch_truth_electron.py`, fixed CDP port `9222`
- Exact runtime boundary: backend `uvicorn` process plus Electron launched against `app/dist-electron/main/main.js` or `app/main/main.ts` fallback, with the renderer pointed at `app/dist/index.html`
- Why this is the chosen path: it is explicit, does not rely on service stubs, and exercises the real backend + Electron boundary while keeping the lane small and honest

## What This Lane Proves
- The backend can boot and answer health checks.
- Electron can be launched against the real service port.
- The renderer can connect to the real bridge and report service health.
- The UI can reach the specific real-service interaction path under validation.

## What This Lane Does Not Prove
- UI polish or screenshot stability by itself.
- Harness correctness by itself.
- Backend contract behavior by itself.
- Any test path that still uses stubs, preload-only overrides, or smoke fallback behavior.

## Remaining Gaps
- `pnpm test:truth` still fails in this workspace with `spawn EPERM` before the Electron helper starts through the repo launcher.
- The helper module itself works when run directly from shell, which means the remaining problem is the repo-level invocation path, not the Electron launch logic inside the helper.
- The Playwright reference spec `app/tests/e2e/truth.real-service.spec.ts` remains supporting material rather than the authoritative lane.

## Next Follow-on Work
- Make the repo-level truth launcher executable in this workspace without changing the truth criteria.
- Keep the truth lane small until the launcher path is stable.
- After the launcher is stable, decide whether the reference Playwright spec should remain as documentation-only guidance or be wired into a secondary review-only path.
