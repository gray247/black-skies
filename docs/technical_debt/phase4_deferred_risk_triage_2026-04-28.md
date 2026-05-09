# Phase 4.9A Deferred Risk Triage - 2026-04-28

Canonical register note:
- authoritative deferred-risk state has been consolidated in:
  - `docs/technical_debt/deferred_risk_register_2026-04-29.md`
- this Phase 4.9A document remains as the phase-time snapshot and rationale trail.

## Remaining Deferred Risks

### NO_COLOR / FORCE_COLOR
- current status:
  - deferred; partially mitigated in repo launch paths, still reproducible in parent-shell-driven runs
- severity:
  - low
- owner area:
  - test harness / launcher environment normalization
- why deferred:
  - non-blocking warning only; no contract/smoke failures tied to it
- safe future fix path:
  - add shell-level env normalization so `NO_COLOR` is cleared when `FORCE_COLOR` is set before Node bootstrap
- validation required:
  - `pnpm test:e2e -- --workers=1`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - confirm warning no longer appears in launcher output
- recommended phase:
  - Phase 5.1 (harness hardening)

### Dock Layout Warning
- current status:
  - deferred; warning remains but invalid layouts are safely ignored and default layout fallback is deterministic
- severity:
  - low to medium (noise/compatibility debt, not a blocker)
- owner area:
  - renderer layout persistence and migration
- why deferred:
  - no functional regression; fallback preserves startup stability
- safe future fix path:
  - introduce layout versioning/migration for legacy saved payloads before sanitize path
- validation required:
  - `pnpm test:e2e -- --workers=1`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - targeted saved-layout migration test for legacy snapshot payloads
- recommended phase:
  - Phase 5.2 (layout compatibility hardening)

### Node/Electron Advisories
- current status:
  - deferred checkpoint after Phase 4.7; `pnpm audit` remains at `49 vulnerabilities found`
- severity:
  - high (security and packaging/runtime exposure)
- owner area:
  - app runtime + packaging toolchain
- why deferred:
  - remaining advisories are concentrated in coordinated Electron/runtime-sensitive chains not safe for incremental ad hoc bumps
- safe future fix path:
  - execute coordinated Electron/runtime packaging remediation plan in isolated batches with rollback checkpoints
- validation required:
  - `pnpm --filter app run build:production`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - `pnpm test:e2e -- --workers=1`
  - packaging smoke for installer/build output
- recommended phase:
  - Phase 5.3 (dependency + packaging security hardening)

### pip Advisories
- current status:
  - deferred; `pip-audit` residual advisories include `pip` tooling classification
- severity:
  - medium
- owner area:
  - Python environment/bootstrap tooling
- why deferred:
  - environment/tooling classification; not a runtime contract blocker in current app/service lanes
- safe future fix path:
  - isolated Python tooling remediation pass with environment reproducibility checks
- validation required:
  - `.\.venv\Scripts\python.exe -m pip_audit`
  - `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q`
  - `.\.venv\Scripts\python.exe -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth`
- recommended phase:
  - Phase 5.4 (Python tooling/security hygiene)

### Starlette/FastAPI Blocked Advisory
- current status:
  - deferred and blocked; `starlette` fix target requires version outside current FastAPI constraint
- severity:
  - high (runtime dependency advisory), currently blocked by compatibility
- owner area:
  - backend runtime dependency management
- why deferred:
  - `fastapi==0.118.3` constrains `starlette<0.49.0`; advisory target requires coordinated compatibility move
- safe future fix path:
  - coordinated FastAPI+Starlette compatibility upgrade with pinned regression checks
- validation required:
  - `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q`
  - `pnpm test:e2e -- --workers=1`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - endpoint-specific API regression pass for draft/analytics/readiness routes
- recommended phase:
  - Phase 5.5 (backend runtime dependency compatibility)

### react-mosaic-component / uuid Advisory
- current status:
  - deferred; `uuid` is transitive via `react-mosaic-component@6.1.1`, and audited fix target is not proven drop-in with current CommonJS consumer path
- severity:
  - medium to high (runtime UI dependency path)
- owner area:
  - renderer dependency stack
- why deferred:
  - compatibility risk not resolved; forcing `uuid` target could break mosaic runtime path
- safe future fix path:
  - evaluate compatible `react-mosaic-component` upgrade or replacement path, then remediate `uuid` through consumer-safe upgrade
- validation required:
  - `pnpm --filter app run build:production`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - `pnpm test:e2e -- --workers=1`
  - targeted UI workspace/layout interaction checks
- recommended phase:
  - Phase 5.6 (renderer dependency compatibility)

### Electron Packaging Chain Advisories
- current status:
  - deferred; `tar`, `glob`, `minimatch`, `@tootallnate/once` remain tied to packaging/Electron builder chains
- severity:
  - high
- owner area:
  - packaging and release toolchain
- why deferred:
  - transitive advisories are part of coordinated packaging chain; unsafe to patch piecemeal without Electron/electron-builder plan
- safe future fix path:
  - execute dedicated packaging-chain upgrade batch aligned with Electron runtime plan
- validation required:
  - `pnpm --filter app run build:production`
  - packaging/build artifact smoke (current release packaging command)
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - `pnpm test:e2e -- --workers=1`
- recommended phase:
  - Phase 5.7 (packaging chain hardening)

## Phase 4 Closure Recommendation
- recommendation:
  - Phase 4 can close with these documented deferrals.
- rationale:
  - mypy is fully clean (`Success: no issues found in 346 source files`), and the core validation lanes remain green (`64 passed`, `3 passed`, `11 passed`).
  - remaining items are known, classified, and primarily security/toolchain compatibility hardening work better suited for Phase 5 coordinated upgrades.
- do not defer further before Phase 5:
  - start Phase 5 with high-severity dependency/packaging lanes (Node/Electron advisories, Starlette/FastAPI block, packaging chain) as first hardening priorities.

## Sync Note (2026-04-29)
- grouping alignment update:
  - `Node/Electron Advisories` + `Electron Packaging Chain Advisories` are now treated as one canonical P1 umbrella: `Electron/package-chain advisories`.
- additional deferred items tracked centrally:
  - `CI artifact observability debt for ignored uploads`
  - `ESLint legacy config / flat-config migration`
  - `Renderer TypeError warning noise (if still reproducible)`
  - `Local EPERM Playwright launch caveat`
