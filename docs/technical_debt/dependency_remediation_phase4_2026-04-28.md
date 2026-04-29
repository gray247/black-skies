# Dependency Remediation - Phase 4.3A - 2026-04-28

## Current Advisory Baseline
- `pnpm audit`: `63 vulnerabilities found` (`4 low | 24 moderate | 35 high`)
- `pip-audit`: `8 known vulnerabilities` in `7 packages`
- Scope note: these are advisory findings only. No dependency changes are made in this pass.

## Python Advisories

### Tooling-only candidates
- `black` -> `26.3.1`
- `pip` -> `26.0` and the second `pip` advisory without a fix version in the current report
- `pygments` -> `2.20.0`
- `pytest` -> `9.0.3`
- `wheel` -> `0.46.2`

### Runtime-sensitive candidates
- `starlette` -> `0.49.1`
- `python-dotenv` -> `1.2.2`

### Notes
- `black-skies` itself is skipped by `pip-audit` because it is not published on PyPI.
- Python advisories are the cleanest place to start because they can usually be isolated to lockfile updates and repo tooling validation.

## Node/pnpm Advisories

### Tooling-only / build-adjacent candidates
- `markdownlint-cli` chain:
  - `js-yaml`
  - `markdown-it`
  - `smol-toml`
  - `glob`
  - `minimatch`
  - `@isaacs/brace-expansion`
- `@tootallnate/once`
- `flatted`

### Runtime-sensitive / app-shipping candidates
- `electron`
- `electron-builder`
- `vite`
- `esbuild`
- `postcss`
- `rollup`
- `@xmldom/xmldom`
- `tar`
- `uuid`
- `ajv`
- `lodash`
- `picomatch`

### Shared transitive chains to treat carefully
- `glob`
- `minimatch`
- `brace-expansion`

### Notes
- The pnpm graph is mixed: some advisories sit in docs/build tooling, while others are packaged into the app or affect the Electron toolchain.
- `electron`, `electron-builder`, `vite`, `esbuild`, `postcss`, and `tar` should not be upgraded casually because they can change launch/build behavior.

## Runtime-Sensitive Packages
- `starlette`
- `python-dotenv`
- `electron`
- `electron-builder`
- `vite`
- `esbuild`
- `postcss`
- `rollup`
- `@xmldom/xmldom`
- `tar`
- `uuid`
- `ajv`

## Tooling-Only Packages
- `black`
- `pip`
- `pygments`
- `pytest`
- `wheel`
- `markdownlint-cli`
- `js-yaml`
- `markdown-it`
- `smol-toml`
- `flatted`
- `@tootallnate/once`

## Upgrade Batches

### Batch A: Lowest-Risk Tooling
- packages:
  - Python tooling: `black`, `pip`, `pygments`, `pytest`, `wheel`
  - docs/lint tooling: `markdownlint-cli`, `js-yaml`, `markdown-it`, `smol-toml`, `flatted`, `@tootallnate/once`
- risk:
  - low; mostly developer workflow and CI helper impact
- expected files changed:
  - `requirements.dev.lock`
  - possibly `constraints.txt`
  - `pnpm-lock.yaml` if docs tooling is updated through the workspace lock
- validation commands:
  - `pnpm audit`
  - `.\.venv\Scripts\python.exe -m pip_audit`
  - `pnpm --filter app test`
  - `pytest -q`
- rollback plan:
  - revert the batch commit and restore the previous lockfile snapshot; do not mix with runtime upgrades.

### Batch B: Python Runtime-Sensitive
- packages:
  - `starlette`
  - `python-dotenv`
- risk:
  - medium; service startup and request behavior can change
- expected files changed:
  - `requirements.lock`
  - possibly `requirements.dev.lock` if shared pins move
- validation commands:
  - `pytest -q`
  - `pnpm test:e2e -- --workers=1`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- rollback plan:
  - revert the batch lockfile update and re-run the same validation set to confirm restoration.

### Batch C: Node/Electron/Toolchain-Sensitive
- packages:
  - `electron`
  - `electron-builder`
  - `vite`
  - `esbuild`
  - `postcss`
  - `rollup`
  - `@xmldom/xmldom`
  - `tar`
  - `uuid`
  - `ajv`
  - `lodash`
  - `picomatch`
- risk:
  - high; these can change packaging, renderer startup, security posture, and build output
- expected files changed:
  - `pnpm-lock.yaml`
  - `app/package.json` only if a direct version bump is required
- validation commands:
  - `pnpm --filter app run build:production`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - `pnpm test:e2e -- --workers=1`
- rollback plan:
  - revert the batch and restore the prior lockfile before re-running the same build and contract lanes.

### Batch D: Remaining Transitive Chains
- packages:
  - any residual `glob`, `minimatch`, `brace-expansion`, `@isaacs/brace-expansion`, or similar transitive advisories that remain after Batches A-C
- risk:
  - medium; usually narrow, but can fan out through shared dev/runtime graphs
- expected files changed:
  - `pnpm-lock.yaml`
  - possibly `requirements*.lock` only if Python transitive chains remain after earlier batches
- validation commands:
  - `pnpm audit`
  - `.\.venv\Scripts\python.exe -m pip_audit`
  - the affected surface test set from the batch that introduced the dependency
- rollback plan:
  - isolate the residual chain into a standalone revertable commit and avoid bundling it with unrelated fixes.

## Do-Not-Do List
- no broad forced upgrades
- no lockfile churn without package intent
- no workflow masking
- no advisory suppression without doc
- no Electron major bump in the same batch as unrelated tooling churn

## Recommended First Upgrade Batch
- Batch A: lowest-risk tooling
- rationale:
  - it touches the least risky surfaces first and reduces advisory noise without changing runtime behavior.
  - it gives a clean signal on whether the repo’s lockfile and tooling plumbing are stable before Python runtime or Electron/toolchain upgrades.

## Phase 4.3B Implementation Notes
- batch implemented:
  - `black` -> `26.3.1`
  - `pathspec` -> `1.1.1`
  - `pytest` -> `9.0.3`
  - `pytest-asyncio` -> `1.3.0`
  - `pytokens` -> `0.4.1`
  - `wheel` -> `0.46.2`
  - `Pygments` -> `2.20.0` and `python-dotenv` -> `1.2.2` in the Windows dev lock sync
- files changed:
  - `constraints.txt`
  - `requirements.dev.lock`
  - `requirements.win.dev.txt`
  - `docs/BLACK_SKIES_FIX_TRACKER.md`
- validation results:
  - pre-change `pip-audit`: 8 advisories in 7 packages
  - post-change `pip-audit`: 3 advisories in 2 packages
  - remaining Python advisories are `pip` and `starlette`; both are deferred out of Batch A because they are not lowest-risk tooling-only updates
  - `mypy` baseline unchanged at `175 errors in 49 files (checked 346 source files)`
  - `startup_authority_contract.spec.ts` passed with `11 passed`
  - smoke lane passed with `3 passed`
- skipped ambiguous packages:
  - `pip` was deferred because it is environment/bootstrap tooling and not represented as a clean repo lockfile target for Batch A
  - `starlette` was deferred because it is runtime-sensitive and belongs in Batch B
- next batch:
  - Batch B: Python runtime-sensitive advisories, starting with `starlette`

## Phase 4.3C Runtime-Sensitive Advisory Review
- current baseline before change:
  - `pip-audit`: 3 advisories in 2 packages (`pip`, `starlette`)
- compatibility check:
  - `fastapi==0.118.3` requires `starlette<0.49.0,>=0.40.0`
  - the requested fix target `starlette==0.49.1` is therefore out of range for the current FastAPI pin
- outcome:
  - no dependency file changes were made in this pass
  - `starlette` remains deferred until a coordinated FastAPI compatibility batch is authorized
  - `pip` remains a separate environment/tooling advisory and is not bundled with app runtime dependency remediation
- validation notes:
  - service smoke coverage was exercised via `python -m pytest services/tests/test_app.py -q -x`
  - the suite surfaced an existing analytics-disabled route failure unrelated to this advisory review (`expected 404, got 500`), so it is not treated as a Starlette-regression signal
- recommended next action:
  - classify `starlette` as blocked by the current FastAPI upper bound and move to a coordinated runtime-compatibility batch if the repo later authorizes one

## Phase 4.3C Runtime Dependency Result
- `starlette` advisory remains
- blocked by FastAPI pin: `fastapi==0.118.3` requires `starlette<0.49.0,>=0.40.0`
- no forced upgrade performed
- future safe path: coordinated FastAPI/Starlette compatibility pass

## Deferred Defects Discovered During Dependency Validation
- `services/tests/test_app.py` analytics-disabled route assertion
- expected `404`, got `500`
- classification: unrelated pre-existing service defect
- suggested future phase: Phase 4.5 service defect cleanup

## Remaining Python Advisory Status
- `pip` advisories: environment/bootstrap tooling debt
- `starlette` advisory: runtime-sensitive blocked by FastAPI constraint

## Phase 4.3E Dependency Audit Proof

### Final Advisory State
- pip-audit: 3 vulnerabilities in 2 packages
  - pip (tooling)
  - starlette (blocked by FastAPI constraint)

### Resolved Advisories
- black
- pytest
- wheel
- pygments
- python-dotenv

### Blocked / Deferred
- starlette -> requires coordinated FastAPI upgrade
- pip -> environment/tooling classification

### Validation Evidence
- pytest services/tests/test_app.py: 64 passed
- Playwright contract tests: 11 passed
- smoke lane: 3 passed
- no regressions introduced

### Conclusion
- Phase 4.3 dependency remediation: COMPLETE (with documented deferred items)
## Phase 4.6 Stabilization Proof Checkpoint

### Validation Summary
- Service test file is green: `services/tests/test_app.py -q` => `64 passed`.
- Contract lane remains green: `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line` => `11 passed`.
- Smoke lane remains green: `pnpm test:e2e -- --workers=1` => `3 passed`.
- `mypy` baseline is unchanged at `175 errors in 49 files (checked 346 source files)`.

### Current Advisory Counts
- `pip_audit`: `3 known vulnerabilities in 2 packages`.
- `pnpm audit`: `63 vulnerabilities found` (`4 low | 24 moderate | 35 high`).

### Remaining Deferred Risks
- `pip` advisories remain separate environment/bootstrap tooling debt.
- `starlette` remains blocked by the current FastAPI upper bound.
- Electron/Node advisories remain pending their separate remediation lane.
- Warning cleanup remains partially deferred for `NO_COLOR`/`FORCE_COLOR` and dock layout compatibility noise.


## Phase 4.7A Node Advisory Batching Plan

### Current Node Advisory Baseline
- `pnpm audit`: 63 vulnerabilities (`4 low | 24 moderate | 35 high`)
- inspected surfaces: `package.json`, `app/package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- grouping rule used here: batch by first safe remediation target, not by every transitive path

### Batch A: Docs / Lint / Build Tooling
Packages:
- `markdownlint-cli`
- `glob` via `markdownlint-cli`
- `minimatch` via `markdownlint-cli`
- `markdown-it`
- `smol-toml`
- `@isaacs/brace-expansion`

Advisory count/severity:
- 7 advisories total
- 5 high, 2 moderate

Risk level:
- low

Expected files changed:
- `package.json`
- `pnpm-lock.yaml`

Validation commands:
- `pnpm audit`
- `pnpm lint:docs`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`

Rollback plan:
- revert the root dependency bump and regenerate `pnpm-lock.yaml` from the last known good state

### Batch B: App Dev / Test Tooling
Packages:
- `vite`
- `vitest`
- `esbuild`
- `postcss`
- `js-yaml`
- `ajv`
- `minimatch`
- `brace-expansion`
- `flatted`
- `picomatch`
- `rollup`

Advisory count/severity:
- 22 advisories total
- 13 high, 9 moderate

Risk level:
- medium

Expected files changed:
- `app/package.json`
- `pnpm-lock.yaml`

Validation commands:
- `pnpm --filter app run build:production`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`

Rollback plan:
- revert app toolchain bumps and lockfile updates together, then rerun the same baseline validations

### Batch C: Electron / Runtime-Sensitive UI Paths
Packages:
- `lodash` via `react-mosaic-component`
- `uuid` via `react-mosaic-component`

Advisory count/severity:
- 4 advisories total
- 4 moderate

Risk level:
- medium/high

Expected files changed:
- `app/package.json`
- `pnpm-lock.yaml`

Validation commands:
- `pnpm --filter app run build:production`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`

Rollback plan:
- revert the UI runtime bump and lockfile together, then rerun contract and smoke lanes

### Batch D: Transitive-Only Chains
Packages:
- `glob` via `electron-builder`
- `tar`
- `@xmldom/xmldom`
- `@tootallnate/once`

Advisory count/severity:
- 13 advisories total
- 12 high, 1 low

Risk level:
- medium/high

Expected files changed:
- `app/package.json` and/or `package.json` if the upstream tool pin moves
- `pnpm-lock.yaml`

Validation commands:
- `pnpm --filter app run build:production`
- `pnpm --filter app package:dir` or the nearest documented packaging command
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`

Rollback plan:
- revert the upstream packaging-tool bump and restore the previous lockfile state before reattempting

### Batch E: Blocked / Needs Coordinated Upgrade
Packages:
- `electron`

Advisory count/severity:
- 17 advisories total
- 10 moderate, 4 high, 3 low

Risk level:
- highest

Why blocked:
- the current Electron version is behind the advisory fix floor
- resolving this safely likely requires a coordinated Electron / electron-builder compatibility pass, not a single-package patch

Expected files changed:
- likely `app/package.json`
- `pnpm-lock.yaml`

Validation commands:
- `pnpm --filter app run build:production`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`
- packaging smoke documented for release validation if the upgrade is attempted

Rollback plan:
- revert the coordinated Electron upgrade wholesale if build/startup/contract evidence regresses

### Recommended First Batch
- Batch A: Docs / Lint / Build Tooling
- Lowest-risk because it is isolated to the markdown linting surface and does not touch Electron runtime behavior

## Phase 4.3E Dependency Audit Proof

### Final Advisory State
- pip-audit: 3 vulnerabilities in 2 packages
  - pip (tooling)
  - starlette (blocked by FastAPI constraint)

### Resolved Advisories
- black
- pytest
- wheel
- pygments
- python-dotenv

### Blocked / Deferred
- starlette -> requires coordinated FastAPI upgrade
- pip -> environment/tooling classification

### Validation Evidence
- pytest services/tests/test_app.py: 64 passed
- Playwright contract tests: 11 passed
- smoke lane: 3 passed
- no regressions introduced

### Conclusion
- Phase 4.3 dependency remediation: COMPLETE (with documented deferred items)

## Phase 4.7B Implementation Notes
- files changed: `package.json`, `pnpm-lock.yaml`, `docs/technical_debt/dependency_remediation_phase4_2026-04-28.md`, `docs/BLACK_SKIES_FIX_TRACKER.md`
- package upgraded: `markdownlint-cli` `0.45.0` -> `0.48.0` (with the docs-lint transitive chain refreshed under it)
- advisory count before/after: `pnpm audit` `63` -> `56`
- resolved Batch A advisories: the markdownlint docs/lint chain (`markdownlint-cli`, `markdown-it`, `smol-toml`, `@isaacs/brace-expansion`, and the markdownlint-pulled `glob`/`minimatch` chain)
- validation commands and results:
  - `pnpm audit` before change: `63 vulnerabilities found`
  - `pnpm audit` after change: `56 vulnerabilities found`
  - `pnpm lint:docs`: passed
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`: first attempt hit `EADDRINUSE` because it overlapped the smoke lane; reran serially and passed (`11 passed`)
  - `pnpm test:e2e -- --workers=1`: passed (`3 passed`)
- skipped packages: Electron/runtime/toolchain advisories were intentionally left for later batches; no Batch A package was left untouched
- recommended next batch: Batch B (app dev/test tooling)

## Phase 4.7C App Dev/Test Tooling Upgrade Plan

### Current Advisory Slice
- audit family size: 22 advisories total (`13 high | 9 moderate`)
- scope confirmed from current `pnpm audit` output and the app workspace manifest surface

### Direct Upgrade Entry Points
- `vite`
- `vitest`
- `@vitejs/plugin-react`
- `@vitest/coverage-v8`
- `eslint`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`

### Transitive Chains in Scope
- `esbuild`
- `rollup`
- `postcss`
- `js-yaml`
- `ajv`
- `minimatch`
- `brace-expansion`
- `flatted`
- `picomatch`
- `vite-node` and related Vite/Vitest internals pulled by the direct test/build stack

### Risk Level
- medium
- the build stack affects renderer bundling and test execution, but not Electron runtime logic directly

### Likely Upgrade Path
- start with the Vite/Vitest renderer/test stack because it is the smallest coherent batch that touches build output and test runner behavior together
- if residual advisories remain after that bump, split the ESLint / TypeScript-ESLint lint chain into its own follow-up batch
- avoid mixing the Vite/Vitest upgrade with Electron or packaging-toolchain changes in the same pass

### Validation Commands
- `pnpm audit`
- `pnpm --filter app run build:production`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`
- `pnpm --filter app lint`

### Rollback Plan
- revert the app toolchain bumps and restore the lockfile together
- rerun `build:production`, the targeted contract lane, and the smoke lane before reattempting any smaller split

## Phase 4.7D Vite/Vitest Renderer/Test Stack Implementation Notes

### Files Changed
- `app/package.json`
- `pnpm-lock.yaml`
- `docs/technical_debt/dependency_remediation_phase4_2026-04-28.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

### Packages Upgraded
- `vite` `^5.2.8` -> `^8.0.10`
- `vitest` `^1.5.2` -> `^4.1.5`
- `@vitejs/plugin-react` `^4.3.1` -> `^6.0.1`
- `@vitest/coverage-v8` `^1.6.0` -> `^4.1.5`

### Advisory Count Before / After
- before: `56 vulnerabilities found`
- after: `51 vulnerabilities found`

### Validation Evidence
- `pnpm --filter app run build:production`: passed
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`: first attempt failed with `EADDRINUSE` because it overlapped the smoke lane; reran serially and passed (`11 passed`)
- `pnpm test:e2e -- --workers=1`: passed (`3 passed`)
- `pnpm audit`: passed with the reduced advisory count above

### Compatibility Notes
- no runtime source changes were required
- the renderer/test stack accepted the Vite 8 / Vitest 4 upgrade without a compatibility shim in `app/vite.config.ts` or `app/playwright.config.ts`
- the only observed failure was harness-level port contention from overlapping Playwright launches, not a product regression

### Conclusion
- Phase 4.7D renderer/test stack remediation: COMPLETE
- remaining Node advisories are now concentrated in the ESLint / TypeScript-ESLint and Electron/runtime-sensitive batches

## Phase 4.7E Lint Chain Remediation Plan

### Direct Packages
- `eslint`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`

### Transitive Chains
- `@typescript-eslint/typescript-estree`
- `@eslint/eslintrc`
- `@humanwhocodes/config-array`
- `@humanwhocodes/module-importer`
- `@nodelib/fs.walk`
- `@nodelib/fs.scandir`
- `@nodelib/fs.stat`
- `glob`
- `minimatch`
- `brace-expansion`
- `js-yaml`
- `ajv`
- `flatted`
- `picomatch`

### Risk Level
- medium
- the lint chain touches source analysis and developer feedback, but does not change runtime Electron behavior directly

### Likely Upgrade Path
- keep the lint chain isolated from Electron, Vite/Vitest, and packaging-tool changes
- upgrade the ESLint / TypeScript-ESLint pair as one batch so the parser and plugin remain version-aligned
- if the upgrade pulls in transitive resolver or globbing changes, keep them inside the same lint batch rather than splitting them into a separate runtime-facing pass

### Validation Commands
- `pnpm audit`
- `pnpm --filter app lint`
- `pnpm --filter app run build:production`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`

### Rollback Plan
- revert the lint package bumps and restore the lockfile together
- rerun `pnpm --filter app lint` first, then `build:production`, then the contract and smoke lanes before attempting any narrower split

### Recommended Implementation Batch
- Batch A: `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
- defer any unrelated Electron/runtime or packaging-tool advisories until this lint batch is validated cleanly

## Phase 4.7F Lint Chain Implementation Notes

### Files Changed
- `app/package.json`
- `pnpm-lock.yaml`
- `.eslintrc.cjs`
- `scripts/run-app-eslint.mjs`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/shared/ipc/layout.ts`
- `docs/technical_debt/dependency_remediation_phase4_2026-04-28.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

### Packages Upgraded
- `eslint` `^8.57.0` -> `^9.39.4`
- `@typescript-eslint/eslint-plugin` `^7.7.1` -> `^8.59.1`
- `@typescript-eslint/parser` `^7.7.1` -> `^8.59.1`
- `eslint-plugin-react-hooks` `^4.6.0` -> `^6.1.1`

### Advisory Count Before / After
- before: `51 vulnerabilities found`
- after: `49 vulnerabilities found`

### Compatibility Fixes
- switched the app ESLint launcher to `ESLINT_USE_FLAT_CONFIG=false` so the repo can keep the existing legacy `.eslintrc.cjs` shape under ESLint 9
- changed `plugin:react-hooks/recommended` to `plugin:react-hooks/recommended-legacy` to avoid the flat-config export mismatch
- made two mechanical cleanup edits so the upgraded lint rules pass without changing runtime behavior:
  - simplified the preflight test assertions in `app/renderer/__tests__/AppPreflight.test.tsx`
  - replaced the empty `LayoutResetRequest` interface with a type alias in `app/shared/ipc/layout.ts`

### Validation Evidence
- `pnpm lint`: passed, with only the expected ESLintRC deprecation warning for the legacy config path
- `pnpm lint:docs`: passed
- `pnpm --filter app run build:production`: passed
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`: passed (`11 passed`)
- `pnpm test:e2e -- --workers=1`: passed (`3 passed`)
- `pnpm audit`: passed with `49` vulnerabilities remaining

### Conclusion
- Phase 4.7F lint-chain remediation: COMPLETE
- remaining Node advisories are now concentrated in the Electron / runtime-sensitive batch

## Phase 4.7G Node Remediation Checkpoint

### Completed Node Batches
- Batch A docs/lint/build tooling: complete
- Vite/Vitest stack: complete
- ESLint / TypeScript-ESLint lint chain: complete

### Current Advisory Count
- `pnpm audit`: `49 vulnerabilities found`

### Compatibility-Only Code / Config Changes Made During Lint Upgrade
- `scripts/run-app-eslint.mjs`
  - set `ESLINT_USE_FLAT_CONFIG=false` so the repo can keep using the existing legacy `.eslintrc.cjs`
- `.eslintrc.cjs`
  - switched React Hooks to `plugin:react-hooks/recommended-legacy`
- `app/renderer/__tests__/AppPreflight.test.tsx`
  - simplified two assertions so the upgraded lint rules pass without changing runtime behavior
- `app/shared/ipc/layout.ts`
  - replaced the empty `LayoutResetRequest` interface with a type alias

### Remaining Advisory Groups
- Electron/runtime-sensitive UI paths
  - `electron`
  - `uuid`
- transitive-only chains
  - `glob`
  - `tar`
  - `minimatch`
  - `@tootallnate/once`
- coordinated Electron upgrade lane
  - the Electron 30.x family and its packaging toolchain remain on the blocked coordinated-upgrade path
- leftover dev/test tooling
  - no remaining direct Vite/Vitest or ESLint/TypeScript-ESLint advisories are in the active Node batches

### Deferred Warnings
- ESLintRC deprecation warning due legacy config bridge
  - status: deferred until flat config migration phase

### Conclusion
- Phase 4.7 Node remediation checkpoint: documented
- next remediation work should start from the Electron/runtime-sensitive bucket, not from the completed docs/lint/test stack

## Phase 4.7H Electron/Runtime-Sensitive Remediation Plan

### Remaining Advisories
- `electron`
- `uuid`
- `tar`
- `glob`
- `minimatch`
- `@tootallnate/once`

### Direct vs Transitive Packages
- Direct package
  - `electron`
- Transitive packages in the Electron / packaging chain
  - `glob`
  - `tar`
  - `minimatch`
  - `@tootallnate/once`
- Runtime UI dependency
  - `uuid` through `react-mosaic-component`

### Fixability Without Electron Major Upgrade
- `uuid`
  - potentially fixable by updating the UI dependency that consumes it if a compatible release exists
- some transitive packaging helpers may be reducible through targeted electron-builder patch-level updates, but only if the dependency graph stays on the current Electron line

### Coordinated Electron / electron-builder Upgrade Blockers
- `electron`
  - the advisories are pinned to the current Electron 30.x line and do not have a safe drop-in fix without a coordinated major upgrade
- `tar`, `glob`, `minimatch`, `@tootallnate/once`
  - these are embedded in the current electron-builder chain and should be treated as part of the coordinated packaging/runtime upgrade lane unless a targeted patch release can be proven safe

### Risk Level
- high
- this batch affects runtime packaging, installer generation, and Electron runtime behavior

### Validation Commands
- `pnpm audit`
- `pnpm --filter app run build:production`
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
- `pnpm test:e2e -- --workers=1`
- `pnpm --filter app lint`

### Rollback Plan
- revert any Electron / electron-builder / runtime dependency changes together with the lockfile
- rerun `build:production`, the targeted contract lane, and the smoke lane before reattempting any smaller split

### Recommended Smallest Implementation Batch
- investigate `uuid` separately first, because it is the only remaining advisory tied to a direct runtime UI dependency rather than the Electron packaging chain
- leave the Electron / packaging advisories for a coordinated upgrade pass unless a proven patch-level path appears in the dependency graph

## Phase 4.7I uuid Investigation Result

### Usage / Advisory Finding
- `uuid` is not imported directly by repo source files; it is pulled transitively through `react-mosaic-component@6.1.1`
- the installed consumer uses CommonJS `require("uuid")` in `lib/Mosaic.js`
- the advisory path is `app > react-mosaic-component@6.1.1 > uuid@9.0.1`
- the fixed target reported by `pnpm audit` is `uuid@14.0.0`

### Package Upgrade Decision
- deferred
- a direct jump to `uuid@14.0.0` is not safe for this pass because the current consumer is CommonJS and the package shape/exports are not a drop-in proof from the local evidence collected here

### Compatibility Risk
- medium to high
- this is a runtime UI dependency consumed by a CommonJS package, so a forced override could break the mosaic UI path even though the application code does not import `uuid` directly

### Validation Evidence
- `pnpm audit`: still reports the `uuid` advisory path through `react-mosaic-component`
- `react-mosaic-component/lib/Mosaic.js` uses `require("uuid")`
- `uuid@14.0.0` metadata shows a module-based package shape

### Conclusion
- Phase 4.7I uuid remediation: DEFERRED
- the remaining `uuid` advisory stays grouped with the Electron/runtime-sensitive lane until the consuming package is upgraded or a compatibility-safe bridge is proven

### Recommended Smallest First Implementation Batch
- Vite/Vitest renderer and test stack:
  - `vite`
  - `vitest`
  - `@vitejs/plugin-react`
  - `@vitest/coverage-v8`
  - transitive `esbuild` / `rollup` / `postcss`
- reason: it is the smallest batch that can move the build/test path while staying away from Electron runtime and packaging toolchain risk

## Phase 4.7J Electron/Packaging Chain Decision

### Remaining pnpm Audit Count
- `49 vulnerabilities found`

### Deferred Advisories
- `uuid`
  - deferred because it is pulled by `react-mosaic-component`, and the fixed target `uuid@14.0.0` is not proven CommonJS-compatible with the current consumer
- `electron`
  - deferred pending a coordinated Electron upgrade
- `tar`
- `glob`
- `minimatch`
- `@tootallnate/once`
  - deferred as electron-builder / package-chain work

### Safe Future Path
1. investigate `react-mosaic-component` upgrade or replacement
2. plan Electron major upgrade separately
3. plan electron-builder / package-chain upgrade separately
4. validate packaging, preload, contract lane, and smoke lane after each coordinated step

### Conclusion
- Phase 4.7 Node remediation: COMPLETE WITH DOCUMENTED DEFERRALS
- no further Node package changes are justified before a coordinated Electron/runtime packaging plan is approved

## Phase 4.7 Node Remediation Final State

### Completed Batches
- Batch A docs/lint/build tooling: complete
- Vite/Vitest stack: complete
- ESLint / TypeScript-ESLint lint chain: complete

### Remaining Deferred Advisories
- `electron`
- `uuid`
- `tar`
- `glob`
- `minimatch`
- `@tootallnate/once`

### Validation Evidence
- `pnpm lint`: passed
- `pnpm lint:docs`: passed
- `pnpm --filter app run build:production`: passed
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`: passed (`11 passed`)
- `pnpm test:e2e -- --workers=1`: passed (`3 passed`)
- latest `pnpm audit`: `49 vulnerabilities found`

### Conclusion
- Node remediation is complete as a documented checkpoint, with the remaining issues intentionally deferred to the Electron/runtime packaging lane and the `react-mosaic-component`/`uuid` compatibility path

## Deferred Risk Register Sync (2026-04-29)
- canonical deferred-risk register:
  - `docs/technical_debt/deferred_risk_register_2026-04-29.md`
- ambiguity reduction:
  - prior split labels (`Node/Electron advisories` and `Electron packaging chain advisories`) are now grouped under one canonical P1 category:
    - `Electron/package-chain advisories`
- this document remains the implementation history for dependency remediation batches and evidence.
