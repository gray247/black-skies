# react-mosaic Runtime Transitives Plan - 2026-04-30

## Scope
- planning-only lane for runtime advisories pulled through `react-mosaic-component`
- target advisories in this lane:
  - `uuid`
  - `lodash`
- no dependency, lockfile, runtime, or test edits in this pass

## Current Dependency Paths
- from `pnpm-lock.yaml`:
  - `app -> react-mosaic-component@6.1.1 -> uuid@9.0.1`
  - `app -> react-mosaic-component@6.1.1 -> lodash@4.17.21`
- direct app dependency:
  - `app/package.json`: `react-mosaic-component: ^6.1.1`

## Advisory Map (Runtime Transitives)
- `uuid`:
  - advisory ID: `1116970`
  - path: `app > react-mosaic-component > uuid`
  - current: `9.0.1`
  - patched: `>=14.0.0`
  - severity: `moderate`
- `lodash`:
  - advisory IDs: `1112455`, `1115806`, `1115810`
  - path: `app > react-mosaic-component > lodash`
  - current: `4.17.21`
  - patched: `>=4.17.23` and `>=4.18.0` (audit update target surfaced as `4.18.1`)
  - severities: `moderate` + `high`

## Upstream Version Facts
- `react-mosaic-component` latest published version: `7.0.0-beta0`
- stable line latest: `6.2.0`
- dependency metadata:
  - `6.1.1`: `uuid:^9.0.0`, `lodash:^4.17.21`
  - `6.2.0`: `uuid:^9.0.0`, `lodash:^4.18.1`
  - `7.0.0-beta0`: `uuid:^11.1.0`, `lodash-es:^4.17.21`

## Override Safety Assessment
- `lodash` override risk:
  - lower risk than `uuid` because upgrade remains same package family and stable `react-mosaic-component@6.2.0` already expects newer lodash.
  - still needs runtime/UI validation because docking layout behavior is high-surface (`DockWorkspace`, `DockPaneTile`, typed shims, and e2e docking flows).
- `uuid` override risk:
  - high risk if forced via override because current consumer chain is CommonJS-oriented and owned by upstream package internals.
  - advisory floor `>=14` implies multiple major jumps from `9.0.1`.
  - prior evidence shows current mosaic build path uses CJS `require("uuid")`, so forced major override is not safe without explicit compatibility proof.
- CJS/ESM concern summary:
  - do not force `uuid` major through overrides on `react-mosaic-component@6.x`.
  - treat `uuid` remediation as coupled to upstream mosaic major migration/replacement.

## Remediation Options

### Option 1: Defer both (lowest risk)
- keep current state; document accepted runtime residual risk for this cycle.
- use when stabilization and CI signal remain primary.

### Option 2: Override lodash only (targeted, medium risk)
- attempt a narrow `lodash` remediation path only if done in isolated lane with rollback.
- preferred implementation shape:
  - first try upgrading `react-mosaic-component` within stable line to `6.2.0` (natural dependency update path),
  - use override only if lock resolution still leaves vulnerable `lodash`.
- do not couple with `uuid` remediation in same batch.

### Option 3: Isolated beta migration (`react-mosaic-component@7.0.0-beta0`) (high risk)
- can reduce transitive pressure but still does not reach `uuid>=14` and introduces beta/major API risk.
- only for dedicated compatibility branch with full docking regression budget.

### Option 4: Replace mosaic library (future architecture lane)
- highest effort but most control.
- defer to a planned UI architecture cycle, not a stabilization patch lane.

## Validation Plan (for any implementation lane)
- `pnpm audit`
- `pnpm --filter app test -- DockWorkspace`
- `pnpm --filter app run build:production`
- `pnpm test:e2e -- --workers=1`
- contract lane if port `9999` is free:
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`

## Recommendation
- current recommendation: **defer immediate implementation** for `uuid`, and optionally schedule a separate micro-lane for `lodash`-only remediation.
- rationale:
  - `uuid` fix floor (`>=14`) is not available from stable `react-mosaic-component` and override risk is high.
  - `lodash` has a safer potential path (`react-mosaic-component 6.2.0` / targeted override), but should be isolated from Electron-major and other stabilization lanes.

## Micro-Lane Execution Result (2026-04-30)

### Applied Change
- upgraded stable dependency only:
  - `react-mosaic-component: 6.1.1 -> 6.2.0`
- explicitly not changed:
  - no `uuid` override
  - no beta mosaic migration
  - no mosaic library replacement

### Advisory Delta (`pnpm audit --json`)
- before:
  - `27` (`low: 3`, `moderate: 14`, `high: 10`)
  - included runtime transitive `lodash` advisories on `app > react-mosaic-component@6.1.1 > lodash@4.17.21`
- after:
  - `24` (`low: 3`, `moderate: 12`, `high: 9`)
  - `lodash` advisory IDs (`1112455`, `1115806`, `1115810`) no longer present
  - `uuid` advisory (`1116970`) remains on `app > react-mosaic-component@6.2.0 > uuid@9.0.1`

### Validation Results
- `pnpm --filter app test -- DockWorkspace` -> pass (`7 passed`)
- `pnpm --filter app run build:production` -> pass
- `pnpm test:e2e -- --workers=1` -> pass (`3 passed`)
- contract lane (port `9999` free):
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line` -> pass (`11 passed`)

### Outcome
- lodash-only remediation succeeded using the safest stable path.
- `uuid` remains deferred for a separate compatibility lane; no override was applied in this pass.
