# react-mosaic-component / uuid Compatibility Plan - 2026-04-29

## Scope
- planning-only lane for the remaining `uuid` advisory path through `react-mosaic-component`
- no dependency, lockfile, runtime, or test changes in this pass

## Current Version Snapshot
- app dependency pins (`app/package.json`):
  - `react-mosaic-component`: `^6.1.1` (resolved `6.1.1`)
  - `react`: `^18.2.0` (lock resolves `18.3.1`)
  - `vite`: `^8.0.10`
- transitive advisory package:
  - `uuid`: resolved `9.0.1`

## Confirmed Dependency Path
- `pnpm --filter @blackskies/app why uuid`:
  - `@blackskies/app -> react-mosaic-component 6.1.1 -> uuid 9.0.1`
- `pnpm --filter @blackskies/app why react-mosaic-component`:
  - direct dependency of `@blackskies/app`
- `pnpm-lock.yaml` confirms:
  - `/react-mosaic-component@6.1.1 ...`
  - dependency entry `uuid: 9.0.1`

## Upstream Candidate Versions
- published versions include:
  - latest stable in 6.x line: `6.2.0`
  - first 7.x line: `7.0.0-beta0`
- dependency metadata:
  - `react-mosaic-component@6.1.1` -> `uuid: ^9.0.0`
  - `react-mosaic-component@6.2.0` -> `uuid: ^9.0.0` (does not resolve advisory path)
  - `react-mosaic-component@7.0.0-beta0` -> `uuid: ^11.1.0` (advisory path likely resolved)

## CJS/ESM Compatibility Risk Findings
- current installed package (`app/node_modules/react-mosaic-component/lib/Mosaic.js`) uses CommonJS-compiled imports:
  - `var uuid_1 = require("uuid");`
  - runtime call `(0, uuid_1.v4)()`
- current app integration relies on stable 6.x surface:
  - heavy docking integration in `app/renderer/components/docking/DockWorkspace.tsx` and `DockPaneTile.tsx`
  - custom typings shim in `app/types/react-mosaic-component.d.ts`
  - multiple docking/layout regression tests under `app/renderer/__tests__/`
- implication:
  - forced override of `uuid` alone is unsafe without proof because consumer/library import semantics are not owned by this repo
  - migration to `react-mosaic-component@7.0.0-beta0` is a major+beta move with API/build behavior risk

## Safe Remediation Options

### Option A (Preferred first implementation lane)
- attempt `react-mosaic-component` upgrade only if a stable (non-beta) release moves to a fixed `uuid` line
- currently blocked because 6.x stable still depends on `uuid^9`

### Option B (Conditional / higher risk)
- evaluate `react-mosaic-component@7.0.0-beta0` in an isolated compatibility branch
- only proceed if full docking/build/e2e matrix remains green
- keep rollback as single commit revert

### Option C (Not recommended now)
- `pnpm.overrides` forcing `uuid` major without upgrading `react-mosaic-component`
- use only if explicit compatibility proof exists for this library chain (currently not proven)

### Option D (Future architecture lane)
- replace `react-mosaic-component` with alternative docking/layout solution
- treat as separate feature/migration project, not advisory quick-fix

## Validation Plan for Any Implementation Lane
- `pnpm audit`
- `pnpm --filter app test -- DockWorkspace`
- `pnpm --filter app run build:production`
- `pnpm test:e2e -- --workers=1`
- contract lane if `9999` is free:
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`

## Recommendation
- **Defer implementation for now**.
- Rationale:
  - no stable `react-mosaic-component` release currently resolves the `uuid` path
  - the first dependency line that moves off `uuid^9` is `7.0.0-beta0`, which is a major beta migration and should not be forced in a stabilization hotfix lane.
