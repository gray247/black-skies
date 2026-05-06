# Black Skies System Truth Map

## Purpose
Define the authoritative state contracts for Black Skies so runtime behavior, harness tests, and CI diagnostics converge on the same proof markers and failure classifications.

## Project Loaded
- owner:
  - Renderer state contract in `App.tsx` (project summary + committed dataset markers).
- setter:
  - Primary: renderer project activation/load path (`activateProject` / project loader handling).
  - Harness bridge path: `window.__dev.setProjectDir(...)` (preload) + `test:set-project` event.
- proof marker:
  - `document.body.dataset.projectLoaded === '1'`
  - `document.documentElement.dataset.projectLoaded === '1'`
  - committed `projectPath` + `projectId` datasets
  - subtitle is not `No project loaded`
- dependent tests:
  - `app/tests/e2e/_bootstrap.ts` (`waitForProjectLoaded`, `assertPostBootstrapStable`)
  - harness flows that require workspace actions (`workspace-action-generate`, etc.)
- failure classification:
  - bridge path missing (`__dev.setProjectDir` unavailable or not awaited)
  - event-only load without committed dataset markers
  - subtitle/path/id drift (debug logs present but project not committed)

## Scene Selected
- owner:
  - Renderer active scene state in `App.tsx` (`activeScene` / `activeSceneId`).
- setter:
  - Canonical: `applySceneSelection(...)` in renderer.
  - Harness API: `window.__blackSkiesSelectScene(...)` and `window.__dev.selectScene(...)` bridge to canonical setter.
  - Null-scene contract: `window.__dev.selectScene(null)` is a supported test path to clear active scene through canonical selection flow.
- proof marker:
  - `body.dataset.activeSceneId`
  - `html.dataset.activeSceneId`
  - debug project state active-scene marker (`__testProjectState` / debug mirrors)
- dependent tests:
  - truth lane scene-selection checks (`scripts/truth-with-backend.mjs`)
  - harness startup/flow tests that require `requireActiveScene`
- failure classification:
  - hook missing (`__blackSkiesSelectScene` absent)
  - selection call returns without commit marker
  - DOM-only selection signal without canonical state commit

## Generate/Critique Readiness
- owner:
  - Renderer action readiness logic (`workspace-action-generate`, `workspace-action-critique` enablement).
- setter:
  - Derived state from project-loaded + active-scene + service status contracts.
  - Readiness guard: actions remain disabled when active scene is null even if project is loaded and service is online.
- proof marker:
  - action button visible and enabled (`disabled === false`)
  - service pill status marker (`data-testid="service-status-pill"`, `data-status`, optional `data-reason`)
  - project/scene commit markers present
- dependent tests:
  - `_bootstrap.ts` (`waitForActionEnabled`, `openPreflightDialog`, `waitForServiceStatus`)
  - truth lane readiness waits and critique/rewrite provenance checks
- failure classification:
  - false-ready (button visible but prerequisites incomplete)
  - service-state mismatch (`online/offline/port-unavailable` drift)
  - preflight opens before contract convergence

## Draft Preview Sync
- owner:
  - Renderer draft preview state in `App.tsx` and the shared preview-sync helpers.
- setter:
  - Generate -> Proceed commits generated drafts into shared live state keyed by project path.
  - Floated windows subscribe to the same live state and hydrate from override text before falling back to disk.
- proof marker:
  - docked and floating Draft Preview show the same generated text
  - a post-generate disk refresh does not erase visible generated output
- dependent tests:
  - `app/renderer/__tests__/AppPreflight.test.tsx`
  - `app/renderer/__tests__/ProjectHome.test.tsx`
- failure classification:
  - stale disk text reappears in a floated pane
  - shared-state key missing for the active project path
  - override text dropped during window handoff or disk refresh

## Startup Config
- owner:
  - Harness startup contract (`_bootstrap.ts` + renderer startup config handling).
- setter:
  - `window.__dev.setStartupConfig(...)`
  - bootstrap defaults (`__testEnvDefaultProjectId`, `__testEnvDefaultProjectPath`, `__testEnvAutoSeedProjectSummary`)
- proof marker:
  - `body/html data-test-mode` in `flat|full|recovery`
  - startup snapshot attachment (`startup-state-snapshot.json`) and committed mode/service/project markers
- dependent tests:
  - mode-specific readiness helpers (`waitForFlatModeReady`, `waitForFullModeReady`, `waitForRecoveryModeReady`)
  - startup diagnostic and contract suites
- failure classification:
  - mode drift (expected mode != committed mode)
  - startup config injected post-mount with no committed state effect
  - broad bootstrap assumptions (dock/pane assumptions not mode-aware)

## Recovery/Snapshot Authority
- owner:
  - Renderer recovery state + service snapshot contract.
- setter:
  - restore action path and recovery signaling in renderer/service bridge.
- proof marker:
  - recovery banner presence only when allowed (`data-testid="recovery-banner"`)
  - restore completion marker: `window.__snapshotRestoreDone === true`
  - optional banner dismissal when required by flow
- dependent tests:
  - `_bootstrap.ts` `waitForSnapshotRestoreComplete`
  - recovery/hotkeys/snapshot verification flows
- failure classification:
  - banner-only inference without completion marker
  - completion marker missing after restore action
  - mode-specific dismissal assumptions applied universally

## Test Lane Responsibilities
- smoke lane:
  - fast harness launcher sanity (`pnpm test:e2e` default smoke filter), fixture/materialization path, startup contract health.
- contract lane:
  - backend/service API contract checks (`services/tests/*` targeted suites), bridge contract assertions.
- evaluation lane:
  - repo validation/eval/route smoke + load sanity (`eval.yml` eval job path).
- security lane:
  - workflow reliability + advisory reporting (`security.yml`), with reliability distinct from advisory debt.
- artifact/proof lane:
  - gauntlet/pass proof summaries and manifest artifacts; evidence packaging, not product-runtime truth by itself.

## High-Coupling Zones
- App/preload bridge:
  - `test:set-project`, `__dev` bridge methods, scene selection hook wiring.
- project open/load flow:
  - cross-talk between preload path override and renderer committed project state.
- Electron startup state:
  - mode, service status, project commit, and persisted layout interactions.
- scene selection state:
  - hook readiness + active-scene commit markers across truth/harness flows.
- service online/offline markers:
  - `service-status-pill` status/reason semantics in assertions.
- recovery snapshot flow:
  - banner visibility, restore trigger, and `__snapshotRestoreDone` completion coupling.
- Playwright readiness helpers:
  - `_bootstrap.ts` is authority-critical; assumptions here can invalidate multiple suites simultaneously.

## Renderer Isolation / Contamination Controls
- cleanup contract:
  - reset `document.body.dataset` and `document.documentElement.dataset` markers after each renderer spec.
  - clear `window.__*` helpers, `window.timeline`, `localStorage`, `sessionStorage`, timers, and `modal-root` portal state between specs.
- residual risk:
  - any new renderer-global helper or dataset marker must be added to the cleanup allowlist before it is safe to rely on in test suites.

## Unsupported Mutation Paths
Tests should not mutate these directly unless a dedicated dev-only bridge exists:
- direct DOM dataset writes for authoritative project/scene/service markers
- direct localStorage surgery for startup/recovery truth
- debug-log string matching as proof of committed state
- bypassing `__dev` / canonical hooks with synthetic-only event spam
- direct mutation of runtime internals without bridge/event contract

## CI/Local Parity Notes
- Scheduled `main` vs branch workflow drift:
  - scheduled `main` can fail with older workflow path while branch push passes with updated path.
- PowerShell vs WSL compatibility:
  - local command surfaces differ (e.g., tool availability, shell semantics); document exact command context in evidence.
- venv mypy/pip-audit reality:
  - authoritative local Python tooling runs via `.venv\\Scripts\\python.exe` in this workspace.
- artifact path assumptions:
  - harness/report artifacts require explicit stable paths and fallback behavior; missing artifacts can be fallout, not root cause.
- workers=1 first truth, default workers second signal:
  - serial canary first establishes single-launch health; default workers then test contention.

## Contract Test Design Rules
- no sleeps; wait on explicit contract markers.
- assert authoritative markers, not incidental UI text/logs.
- classify failure before fixing (setup/tool crash vs advisory vs contract regression).
- each test must list preconditions (project loaded, scene selected, service status, mode).
- no broad setup assumptions across modes/layout states.
- no debug-log fallback as authority source.
