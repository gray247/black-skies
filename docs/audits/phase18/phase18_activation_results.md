Canonical role: Phase 18 execution results for hidden GUI discovery, activation attempts, smoke evidence, and bounded slice findings.
Scope: Record what was actually inspected, tested, launched, and observed for the hidden Split Command shell during Phase 18.
Owns: slices `18A` through `18D`, execution evidence, activation attempts, and observed non-claims.
Does not own: final closure determination, target screenshot gap matrix ownership, or future architecture implementation.
Upstream dependencies: [phase18_hidden_gui_activation_plan.md](/C:/Dev/black-skies/docs/audits/phase18/phase18_hidden_gui_activation_plan.md), [phase17_closure_review.md](/C:/Dev/black-skies/docs/audits/phase17/phase17_closure_review.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
Last reviewed: 2026-05-17.
Acceptance record: No operator acceptance recorded yet.

# Phase 18 Activation Results

## Determination Summary

- Production default remains the stable GUI.
- The hidden shell is still the renderer-side `SplitCommandWorkspace` branch.
- No real second Split Command window or monitor-specific surface exists.
- The docking/floating BrowserWindow system is separate from Split Command.
- Flag-on shell selection is proven in renderer tests.
- Live Electron activation is now proven automatically through the runtime-config path:
  - renderer/test override seam works in Vitest only
  - packaged Electron should use `BLACKSKIES_CONFIG_PATH`, not `window.__runtimeConfigOverride`
  - the shared Playwright Electron fixture now has a Split Command smoke lane that launches the shell with a temporary runtime config and non-dock bootstrap expectations

## 18A - Hidden GUI Discovery / Activation Map

Source inspection confirmed this activation path:

1. `app/shared/config/runtime.ts`
   - exact flag name: `ui.experimental_split_command_workspace`
   - default value: `false`
2. `app/main/main.ts`
   - runtime config is loaded in the main process through `loadRuntimeConfig(...)`
3. `app/main/preload.ts`
   - runtime config is exposed to renderer as `window.runtimeConfig`
4. `app/renderer/App.tsx`
   - renderer override precedence: `window.__runtimeConfigOverride?.ui ?? window.runtimeConfig?.ui`
   - render gate: `runtimeUi?.experimentalSplitCommandWorkspace === true`
   - `SplitCommandWorkspace` wraps `fullWorkspaceBody`
5. `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
   - single renderer tree with two zones:
     - `Command Center`
     - `Writing Studio`
6. `app/main/layoutIpc.ts`
   - separate floating-pane `BrowserWindow` support exists for dock panes
   - it is not wired into `SplitCommandWorkspace` as a second monitor or second Split Command surface

## 18B - Experimental Launch Smoke Test

### Automated evidence that passed

- `pnpm --filter app test -- runtimeConfig.test.ts SplitCommandWorkspace.test.tsx AppPreflight.test.tsx`
  - result: `3` files passed, `41` tests passed
- `app/renderer/__tests__/AppPreflight.test.tsx`
  - added coverage that floating-pane hosts stay on the floating path even when the Split Command flag is enabled

### Automated Electron activation attempts

Attempt 1: packaged Electron harness with renderer override seam only

- command:
  - `pnpm --dir app exec playwright test tests/e2e/split-command-activation.spec.ts --project=electron --workers=1 --reporter=line`
- outcome:
  - failed to find `split-command-workspace`
  - renderer logs still reported dock-workspace rendering
- classification:
  - packaged Electron does not reliably honor `window.__runtimeConfigOverride` for first render
  - root cause: the shared `page` fixture returns an already-loaded window, so spec-level `page.addInitScript(...)` runs too late for the initial `App.tsx` runtime gate
  - `window.__runtimeConfigOverride` remains a renderer-test seam, not a supported packaged Electron activation seam

Attempt 2: packaged Electron harness with temporary `BLACKSKIES_CONFIG_PATH` enabling the flag

- command shape:
  - temporary `runtime.yaml` with `ui.experimental_split_command_workspace: true`
  - `BLACKSKIES_CONFIG_PATH=<temp-file> pnpm --dir app exec playwright test ...`
- observed result:
  - Electron launched
  - project loaded
  - action buttons enabled
  - renderer logs changed from `paneMode: docked` to `paneMode: standalone`
  - bootstrap helper timed out because it expects `dock-workspace`, which no longer existed in the flag-on path
- classification:
  - runtime-config activation affects the live Electron shell
  - the existing dock-oriented harness helper is incompatible with the activated shell

Attempt 3: packaged Electron smoke with fixture-owned temporary `BLACKSKIES_CONFIG_PATH`

- command:
  - `pnpm --dir app exec playwright test tests/e2e/split-command-smoke.spec.ts --project=electron --workers=1 --reporter=list`
- implementation:
  - `app/tests/e2e/_electron.fixture.ts` now supports `test.use({ splitCommandRuntimeConfig: true })`
  - that option writes a temporary `runtime.yaml` enabling `ui.experimental_split_command_workspace: true`
  - the Electron fixture passes that file through `BLACKSKIES_CONFIG_PATH` before the app launches
  - `app/tests/e2e/_bootstrap.ts` now supports Split Command readiness without requiring dock-only selectors
- outcome:
  - Electron launched
  - project loaded
  - Split Command rendered
  - `Command Center`, `Writing Studio`, and `Story Navigation` were visible
  - generate action remained enabled
  - no extra window or dock workspace was required
- classification:
  - clean repeatable packaged Electron smoke lane now exists for the hidden shell
Attempt 4: one-off Electron smoke script without harness service stubs

- outcome:
  - `electronApplication.firstWindow` timed out
- classification:
  - not product evidence
  - the script omitted the harness service-stub setup used by the supported Electron test fixture

## 18C - One-Monitor Viability Check

Evidence:

- `SplitCommandWorkspace` is a single renderer tree with two zones inside one Electron window.
- No code in the Split Command branch opens a second `BrowserWindow`.
- Renderer tests prove:
  - Command Center renders
  - Writing Studio renders
  - Story Navigation loads project scenes
  - generation/preflight, critique, snapshot, and export remain wired through the wrapped stable surfaces

Result:

- classification: `Exists and works`
- caveat:
  - live operator-grade proof is still pending
  - automatic Electron smoke is only partial because the existing harness bootstrap assumes the dock workspace

## 18D - Two-Monitor / Secondary Surface Check

Evidence:

- `app/main/layoutIpc.ts` creates floating `BrowserWindow`s for dock panes only.
- `App.tsx` treats `floatingPaneId !== null` as a separate floating-pane host path.
- `SplitCommandWorkspace` is disabled when `isFloatingHost` is true.
- the new Phase 18 renderer test proves floating-pane hosts do not render Split Command even when the flag is enabled.

Result:

- there is no real Split Command secondary window
- there is no integrated two-monitor workflow
- floating panes are separate dock infrastructure, not Monitor 2 Writing Studio

## Commands Run

- `pnpm --filter app test -- runtimeConfig.test.ts SplitCommandWorkspace.test.tsx AppPreflight.test.tsx`
- `pnpm --filter app run build:production`
- `pnpm --filter app lint`
- `pnpm --dir app exec playwright test tests/e2e/split-command-activation.spec.ts --project=electron --workers=1 --reporter=line`
- temporary `BLACKSKIES_CONFIG_PATH` rerun of the same narrow Playwright spec
- `pnpm --dir app exec playwright test tests/e2e/split-command-smoke.spec.ts --project=electron --workers=1 --reporter=list`
- one-off Electron smoke script with temporary `runtime.yaml` and built renderer

## Explicit Non-Claims

- This artifact does not claim true two-monitor support exists.
- This artifact does not claim layout persistence is proven for the hidden shell.
- This artifact does not claim long-session durability, cognitive load, or creative-state protection are proven.
- This artifact does not claim the packaged Electron override seam is trustworthy for future activation proof; the supported packaged Electron lane is runtime-config activation through `BLACKSKIES_CONFIG_PATH`.
