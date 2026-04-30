# Electron / Package-Chain Remediation Plan - 2026-04-29

## Scope
- planning-only lane for remaining high-risk Node advisories in Electron and packaging chains
- no dependency changes, lockfile edits, runtime edits, or test edits in this pass

## Current Versions
- `app/package.json`:
  - `electron`: `^30.0.2` (audit path shows resolved `30.5.1`)
  - `electron-builder`: `^24.13.3`
  - `vite`: `^8.0.10`

## Current Advisory Count (fresh `pnpm audit --json`)
- totals:
  - `low: 4`
  - `moderate: 17`
  - `high: 28`
  - `critical: 0`
- total current advisories: `49`

## Advisory Map (target chain + related context)

### 1) `electron` (direct)
- direct package:
  - `electron@30.5.1` (resolved from `^30.0.2`)
- parent:
  - direct app devDependency
- advisory signal:
  - multiple Electron advisories (17 listed paths, mixed moderate/high/low)
- classification:
  - **runtime** (ships in desktop runtime, affects main/renderer process boundary)

### 2) `tar` (transitive)
- package:
  - `tar@6.2.1`
- parent chain:
  - `electron-builder@24.13.3 -> app-builder-lib@24.13.3 -> tar@6.2.1`
- advisory signal:
  - 6 high findings
- classification:
  - **packaging-chain** (build/package stage, not app runtime path)

### 3) `glob` (transitive)
- package:
  - `glob@10.4.5`
- parent chain:
  - `electron-builder@24.13.3 -> read-config-file@6.3.2 -> config-file-ts@0.2.6 -> glob@10.4.5`
- advisory signal:
  - high findings
- classification:
  - **packaging-chain** (builder config/discovery path)

### 4) `minimatch` (transitive, mixed)
- packages seen:
  - `minimatch@3.1.2`, `5.1.6`, `9.0.5`
- parent chains:
  - mainly via `electron-builder@24.13.3 -> app-builder-lib ...` (asar/universal/archiver/read-config-file paths)
  - also via lint deps (`eslint-plugin-jsx-a11y`, `eslint-plugin-react`)
- advisory signal:
  - many high-path hits
- classification:
  - **mixed**:
    - packaging-chain for builder-derived paths
    - dev/build-only for ESLint plugin paths

### 5) `@tootallnate/once` (transitive)
- package:
  - `@tootallnate/once@2.0.0`
- parent chain:
  - `electron-builder@24.13.3 -> builder-util -> http-proxy-agent -> @tootallnate/once`
- advisory signal:
  - low severity
- classification:
  - **packaging-chain** (builder networking/proxy stack)

## Runtime vs Packaging vs Dev-Only Classification Summary
- runtime-critical:
  - `electron` direct advisories
- packaging-only / release-chain:
  - `tar`, `glob`, most `minimatch`, `@tootallnate/once` via `electron-builder` stack
- dev/build-only (non-runtime):
  - `minimatch` occurrences via ESLint plugin chain

## Candidate Upgrade Paths

### Electron path candidates
- current line:
  - `30.x`
- candidate strategy:
  - first move to latest stable patch in current major line, then evaluate next major if advisories remain
- risk:
  - medium/high due to Electron security behavior changes and runtime API shifts across majors

### electron-builder path candidates
- current:
  - `24.13.3`
- latest observed:
  - `26.8.1`
- dependency drift:
  - `24.13.3` uses `app-builder-lib@24.13.3`, `builder-util@24.13.1`
  - `26.8.1` uses `app-builder-lib@26.8.1`, `builder-util@26.8.1`
- implication:
  - significant transitive refresh likely needed to address `tar`/`glob`/`minimatch`/`@tootallnate/once` chains

### Packaging chain-only path
- attempt to upgrade `electron-builder` family first (without Electron major change) to reduce packaging advisories while containing runtime risk

## Primary Risk Areas
- preload / bridge assumptions:
  - Electron runtime changes can impact preload boundary behavior
- main process:
  - lifecycle, BrowserWindow defaults, protocol/security defaults
- packaged build outputs:
  - asar and target packaging behavior through `electron-builder` chain
- Playwright Electron launch:
  - canary + contract lane stability against changed binary/runtime behavior
- artifact generation / CI proof:
  - eval harness expects deterministic artifacts and proof manifests; packaging-chain shifts can affect artifact presence/timing

## Safest Implementation Batches

### Batch A (first): `electron-builder` + packaging-chain only
- scope:
  - upgrade `electron-builder` line and transitive packaging stack first
  - keep Electron major unchanged in this batch
- objective:
  - reduce `tar`/`glob`/`minimatch`/`@tootallnate/once` packaging findings with lower runtime blast radius

### Batch B: Electron upgrade
- scope:
  - upgrade Electron (patch/minor first, major only if required)
- objective:
  - close direct Electron advisories after packaging stack is stabilized

### Batch C: compatibility fixes (only if failures appear)
- scope:
  - narrow fixes for preload/main/build/CI harness compatibility regressions introduced by A/B
- non-goal:
  - no unrelated refactors

## Validation Plan (for implementation phases)
- `pnpm audit`
- `pnpm --filter app run build:production`
- `pnpm --filter app test`
- `pnpm test:e2e -- --workers=1`
- startup authority contract lane:
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- CI proof:
  - fresh `eval.yml` and `security.yml` runs after each batch commit

## CI / Workflow Relevance
- `eval.yml` currently validates renderer/main build and Playwright Electron lanes.
- It does not perform full installer packaging (`electron-builder --win/--dir`) in the main validation path.
- implication:
  - include at least one explicit packaging smoke command in the implementation lane before closing advisories tied to packaging-only chains.

## Recommendation
- **Implement now, but only as an isolated high-risk lane starting with Batch A.**
- rationale:
  - advisories are concentrated in Electron and builder chains and should be addressed before long-term release hardening,
  - safest order is packaging stack first, then Electron runtime, with strict validation/rollback gates between batches.

## Batch A Execution Evidence (2026-04-30)

### Applied Change
- upgraded `electron-builder` in `app/package.json`:
  - `^24.13.3 -> ^26.8.1`
- Electron runtime major was preserved:
  - `electron` remains `^30.0.2` (resolved `30.5.1`)

### Advisory Delta (`pnpm audit`)
- before:
  - `49 vulnerabilities` (`4 low | 17 moderate | 28 high`)
- after:
  - `27 vulnerabilities` (`3 low | 14 moderate | 10 high`)

### What Improved
- packaging-chain findings tied to legacy `electron-builder@24.x` transitive stack (`tar`, `glob`, many `minimatch`, `@tootallnate/once`) were substantially reduced.

### Remaining Risk Concentration
- direct Electron advisories on `electron@30.5.1` remain.
- residual `minimatch` findings still include lint/dev chains (`eslint-plugin-*`) and some package-chain remnants.

### Validation Results
- `pnpm --filter app run build:production` -> pass
- `pnpm --filter app test` -> `145 passed`
- `pnpm test:e2e -- --workers=1` -> `3 passed`
- contract lane (port `9999` free):
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line` -> `11 passed`
- packaging smoke command:
  - `pnpm --filter app run package:dir` -> pass (`electron-builder 26.8.1` completed `win-unpacked` packaging flow)

### Batch A Outcome
- no packaging/build compatibility break was observed in this batch.
- Batch B (Electron runtime upgrade lane) is still required to address remaining direct Electron advisories.

## Batch B Runtime Planning (2026-04-30)

### Current Electron Runtime State
- declared (`app/package.json`):
  - `electron: ^30.0.2`
- resolved (`pnpm-lock.yaml`):
  - `electron@30.5.1`

### Current Advisory State After Batch A
- `pnpm audit` totals:
  - `27 vulnerabilities` (`3 low | 14 moderate | 10 high`)
- Electron-specific:
  - `17` advisories still mapped to `app > electron@30.5.1`
  - severities include `low`, `moderate`, and `high`

### Candidate Target Versions
- B1 candidate (same major, lowest risk):
  - no newer 30.x patch beyond `30.5.1` is currently available
  - implication: patch-only in current major cannot reduce further
- B2 candidate (next major, controlled step-up):
  - `31.7.7` (latest 31.x stable)
- B2 fallback/next step if needed:
  - `32.3.3` (latest 32.x stable) only if 31.x does not sufficiently address advisories

### Electron Breaking-Change Risk Areas (codebase-specific)
- main process startup/window lifecycle:
  - `app/main/main.ts` (`BrowserWindow` creation, startup fallbacks, loadURL/loadFile paths)
- preload bridge and API exposure:
  - `app/main/preload.ts` (`contextBridge`, renderer-facing APIs, IPC invoke/send paths)
- context isolation / sandbox posture:
  - `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` in main/layout windows
- IPC contracts:
  - `ipcMain.handle`/`ipcRenderer.invoke` surfaces in `main.ts`, `layoutIpc.ts`, `projectLoaderIpc.ts`, preload bridge
- `file://` navigation/load protections:
  - explicit URL filtering and fallback loading behavior in `main.ts` and `layoutIpc.ts`
- CSP/security warning behavior:
  - existing security/sandbox regression tests under `app/renderer/__tests__/SecuritySandbox.test.tsx`
- Playwright Electron launch stability:
  - `app/tests/e2e/_electron.fixture.ts`, `app/tests/e2e/electron.launch.ts`
- packaged build behavior:
  - `pnpm --filter app run package:dir` path must stay green after runtime bump

### Batch B Implementation Plan
- B1:
  - attempt same-major patch/minor bump only if new 30.x appears (currently none)
- B2:
  - upgrade Electron to latest stable `31.x` (`31.7.7`) with no other intentional dependency churn
- B3:
  - apply only narrow compatibility fixes if validation fails after B2

### Validation Gate for B2/B3
- `pnpm audit`
- `pnpm --filter app run build:production`
- `pnpm --filter app test`
- `pnpm test:e2e -- --workers=1`
- contract lane:
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- packaging smoke:
  - `pnpm --filter app run package:dir`
- CI:
  - fresh `eval.yml` and `security.yml` runs on upgraded commit

### Recommendation
- **Implement now** as the next isolated lane (`Batch B2`), since Batch A landed clean and no additional 30.x patch path exists.

## Batch B2 Execution Evidence (2026-04-30)

### Applied Change
- upgraded Electron runtime only:
  - `electron` in `app/package.json`: `^30.0.2 -> ^31.7.7`
- explicitly unchanged:
  - `electron-builder` remained `^26.8.1`

### Version Before/After
- before:
  - declared `electron: ^30.0.2`
  - resolved `electron@30.5.1`
- after:
  - declared `electron: ^31.7.7`
  - resolved `electron@31.7.7`

### Advisory Delta (`pnpm audit`)
- before:
  - `27 vulnerabilities` (`3 low | 14 moderate | 10 high`)
- after:
  - `27 vulnerabilities` (`3 low | 14 moderate | 10 high`)
- note:
  - direct Electron advisory paths moved from `electron@30.5.1` to `electron@31.7.7`, but total advisory count did not change.

### Validation Results
- `pnpm --filter app run build:production` -> pass
- `pnpm --filter app test` -> `145 passed`
- `pnpm test:e2e -- --workers=1` -> `3 passed`
- `pnpm --filter app run package:dir` -> pass (unpacked build flow completed on Electron `31.7.7`)
- contract lane (port `9999` free):
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line` -> `11 passed`

### Compatibility Outcome
- no runtime/app/test compatibility fixes were required in this pass.
- because advisory totals remained unchanged, further Electron/runtime remediation may require additional major progression and/or separate advisory interpretation lane.

## Post-B2 Advisory Review (2026-04-30)

### Current Remaining Advisory Map (`pnpm audit --json`)
- total: `27` (`3 low | 14 moderate | 10 high`)
- advisory groups:
  - `electron` (`17` advisories):
    - IDs: `1107272`, `1116041`, `1116045`, `1116049`, `1116053`, `1116057`, `1116060`, `1116064`, `1116068`, `1116072`, `1116076`, `1116080`, `1116084`, `1116088`, `1116092`, `1116259`, `1116320`
    - path: `app > electron@31.7.7`
    - patched ranges: `>=35.7.5`, `>=38.8.6`, `>=39.8.1`, `>=39.8.5`
    - classification: `runtime`
    - Electron 32 sufficiency: `no` (all patches are well above 32)
  - `lodash` (`3` advisories: `1112455`, `1115806`, `1115810`)
    - path: `app > react-mosaic-component@6.1.1 > lodash@4.17.21`
    - patched ranges: `>=4.17.23`, `>=4.18.0`
    - classification: `runtime` (renderer dependency)
  - `uuid` (`1` advisory: `1116970`)
    - path: `app > react-mosaic-component@6.1.1 > uuid@9.0.1`
    - patched range: `>=14.0.0`
    - classification: `runtime` (transitive through docking library)
  - `minimatch` (`3` advisories: `1113459`, `1113538`, `1113546`)
    - path: `eslint-plugin-jsx-a11y` / `eslint-plugin-react` chains
    - patched ranges: `>=3.1.3`, `>=3.1.4`
    - classification: `dev-only`
  - `flatted` (`2` advisories: `1114526`, `1115357`)
    - path: `eslint -> file-entry-cache -> flat-cache -> flatted`
    - patched ranges: `>=3.4.0`, `>=3.4.2`
    - classification: `dev-only`
  - `brace-expansion` (`1` advisory: `1115540`)
    - paths include both eslint chains and remaining electron-builder transitive chains
    - patched range: `>=1.1.13`
    - classification: `mixed` (`dev-only` + `packaging`)

### Why Count Stayed At 27
- Electron `30.5.1 -> 31.7.7` changed the runtime baseline but did not cross advisory fix floors.
- Remaining Electron advisories require major lines `35/38/39`, so B2 is below all current patch thresholds.
- Non-Electron runtime advisories (`react-mosaic-component` transitive `uuid`/`lodash`) and dev-only lint-chain advisories are unaffected by the Electron bump.

### Pre/Post Electron Set Comparison
- pre-B2 and post-B2 totals are identical (`27`).
- Electron advisory IDs remained present; path changed from `electron@30.5.1` to `electron@31.7.7`.
- net result: no advisory removals from the B2 move itself.

### Decision
- Electron 32 escalation is **not justified as a closure move** for the current advisory set.
- Any meaningful Electron advisory reduction now implies a much larger runtime jump (`>=35`, likely `>=39`) with high compatibility risk.
- recommended handling:
  - classify current Electron advisories as deferred accepted runtime risk for this cycle,
  - keep this as a dedicated future modernization lane (major Electron progression with broader compatibility budget),
  - continue separate `react-mosaic-component` lane for `uuid`/`lodash` transitive runtime advisories.

## Closure Checkpoint (2026-04-30)

### Completed Proof
- Batch A (`electron-builder` / package-chain) completed:
  - advisory delta: `49 -> 27`
  - packaging smoke: `pnpm --filter app run package:dir` passed
  - validation: app tests, production build, smoke e2e, and startup authority contract lane passed
- Batch B (Electron runtime) completed:
  - `electron 30.5.1 -> 31.7.7`
  - compatibility validation remained green (no code compatibility patch required)
  - advisory total remained `27`

### Closure Decision
- Electron 32 escalation is not justified for current remaining Electron advisories.
- Current fixed floors require significantly higher majors (`>=35`, `>=38`, `>=39`).
- Required future lane: dedicated Electron major modernization targeting advisory-floor majors (likely `39+`).
- Current stabilization status: deferred/accepted with no P0 blocker while CI remains green.
