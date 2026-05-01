# Deferred Risk Register - 2026-04-29

Purpose:
- canonical deferred-risk register for stabilization closure and follow-on hardening phases
- single source of truth referenced by closure/tracker/phase docs to avoid drift
- the normalized issue ledger now lives in `docs/BLACK_SKIES_FIX_TRACKER.md` and includes promoted child issues `32-42` for standalone startup/UI subclaims

## P0

### None currently known
- status:
  - no known P0 blockers as of latest documented green validation (`eval` and `security` green)
- evidence doc/source:
  - `docs/technical_debt/stabilization_closure_2026-04-29.md`
  - `docs/technical_debt/phase5_hardening_plan_2026-04-28.md` (Phase 5D section)
  - `docs/BLACK_SKIES_FIX_TRACKER.md` (Phase 5D/5E entries)
- why deferred:
  - not applicable
- next safe action:
  - continue normal validation cadence and reclassify if a new blocking regression appears
- validation required:
  - latest `eval.yml` and `security.yml` run status check on active branch/commit

## P1

### FastAPI/Starlette blocked advisory path
- status:
  - deferred and compatibility-blocked
- evidence doc/source:
  - `docs/technical_debt/dependency_remediation_phase4_2026-04-28.md` (Phase 4.3C/4.3E)
  - `docs/technical_debt/phase4_deferred_risk_triage_2026-04-28.md`
- why deferred:
  - current FastAPI pin constrains Starlette below advisory fix target; requires coordinated compatibility lane
- next safe action:
  - run dedicated FastAPI+Starlette compatibility upgrade plan with isolated rollback point
- validation required:
  - `.\.venv\Scripts\python.exe -m pytest services/tests/test_app.py -q`
  - `pnpm test:e2e -- --workers=1`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`

### Electron/package-chain advisories
- status:
  - partially resolved in Phase 6B; major-line runtime advisories cleared, residual non-Electron advisories remain deferred
- evidence doc/source:
  - `docs/technical_debt/dependency_remediation_phase4_2026-04-28.md` (Phase 4.7H-4.7J)
  - `docs/technical_debt/phase4_deferred_risk_triage_2026-04-28.md`
- why deferred:
  - historical state required higher Electron majors than `31.x`; Phase 6B upgraded Electron to `39.8.9` and cleared Electron-specific advisories without runtime code changes
  - remaining advisories are now outside the Electron major-line set (dev/tooling + uuid transitive) and stay deferred by existing lane decisions
- next safe action:
  - retain Electron at secure `39.x` line and continue deferred-risk handling for non-Electron residual advisories in their dedicated lanes
- validation required:
  - `pnpm --filter app run build:production`
  - packaging smoke command in release flow
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - `pnpm test:e2e -- --workers=1`
  - fresh `pnpm audit` delta showing actual advisory-ID reduction, not just runtime version movement
- Phase 6A baseline evidence (2026-04-30):
   - runtime versions: `electron ^31.7.7` (resolved `31.7.7`), `electron-builder ^26.8.1`,
   - `pnpm audit` totals unchanged at `24` (`3 low | 12 moderate | 9 high`),
   - Electron advisory set remains `17` IDs on `app > electron@31.7.7` with patched floors at `>=35.7.5`, `>=38.8.6`, `>=39.8.1`, and `>=39.8.5`,
   - baseline validation passed: app tests (`145`), `build:production` pass, `package:dir` pass, smoke e2e (`3 passed`), startup authority contract (`11 passed`),
   - interpretation: baseline is stable enough to attempt an isolated Phase 6B Electron-major bump lane.
 - Phase 6B upgrade evidence (2026-04-30):
   - Electron upgraded `31.7.7 -> 39.8.9` (`app/package.json`, `pnpm-lock.yaml`) with no `electron-builder` change (`26.8.1` retained),
   - required validation passed: app tests (`145`), `build:production` pass, `package:dir` pass, `pnpm audit` pass-as-reporting,
   - optional validation passed: smoke e2e (`3 passed`) and startup authority contract lane (`11 passed`) with port `9999` preflight free,
   - advisory delta: `pnpm audit` reduced from `24` (`3 low | 12 moderate | 9 high`) to `7` (`2 moderate | 5 high`), and Electron advisory IDs were removed from the remaining set.

### react-mosaic-component runtime transitive advisories (`uuid`, `lodash`)
- status:
  - partial: `lodash` cleared in stable micro-lane; `uuid` remains deferred compatibility risk
- evidence doc/source:
  - `docs/technical_debt/dependency_remediation_phase4_2026-04-28.md` (Phase 4.7I)
  - `docs/technical_debt/phase4_deferred_risk_triage_2026-04-28.md`
  - `docs/technical_debt/react_mosaic_runtime_transitives_plan_2026-04-30.md`
- why deferred:
  - stable micro-lane (`react-mosaic-component 6.1.1 -> 6.2.0`) cleared `lodash` advisories without overrides and passed validation
  - remaining `uuid` advisory (`1116970`, `GHSA-w5hq-g745-h8pq`, moderate, vulnerable `<14.0.0`, fixed `>=14.0.0`) is runtime-affecting on path `app > react-mosaic-component@6.2.0 > uuid@9.0.1`
  - current stable upstream line does not provide a clean fix: `react-mosaic-component@6.2.0` still depends on `uuid^9.0.0`; next upstream line is `7.0.0-beta0` with `uuid^11.1.0` (still below patched floor and prerelease)
  - no override/patch-package/transitive surgery approved in Phase 5
- next safe action:
  - keep `uuid` remediation deferred until stable upstream path or dedicated major migration/replacement strategy is approved
- validation required:
  - `pnpm audit`
  - `pnpm --filter app test -- DockWorkspace`
  - `pnpm --filter app run build:production`
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - `pnpm test:e2e -- --workers=1`

### CI artifact observability debt for ignored uploads
- status:
  - deferred observability improvement
- evidence doc/source:
  - `docs/technical_debt/phase5_artifact_proof_audit_2026-04-29.md` (remaining gaps)
  - `docs/technical_debt/phase5_hardening_plan_2026-04-28.md` (Phase 5C/5D)
- why deferred:
  - current `if-no-files-found: ignore` behavior is intentionally non-blocking but can hide absent-output context without extra markers
- next safe action:
  - add lightweight missing-output marker artifacts and/or final artifact-contract summary artifact
- validation required:
  - inspect a green run and a forced-failure run for explicit artifact-absence classification
  - verify no artifact name/path/retention behavior regressions

### Visual snapshot instability in `visual.home.spec.ts`
- status:
  - deferred visual-lane limitation
- evidence doc/source:
  - `docs/BLACK_SKIES_FIX_TRACKER.md` (Issue 43)
  - `app/tests/e2e/visual.home.spec.ts`
  - `app/renderer/components/ProjectHome.tsx`
- why deferred:
  - the welcome-card regression has already been isolated and gated correctly, but the remaining whole-page snapshot diff is dominated by cross-platform toolbar/header rendering drift
  - visual normalization and focus stabilization reduced but did not eliminate the delta
  - the current whole-page pixel snapshot approach is not deterministic enough on Windows vs. the committed baseline
- what has already been fixed:
  - welcome card suppressed in visual-home mode
  - bootstrap/sample-project path suppressed in visual-home mode
  - visual-mode CSS normalization applied for focus/checkbox/font smoothing
- future redesign options:
  - region masking for stable sub-areas
  - segmented visual assertions instead of a single full-page capture
  - semantic UI checks for toolbar/home-state correctness instead of pixel-only comparison
- next safe action:
  - keep the test documented as a known limitation until the visual lane is redesigned around stable subregions or non-pixel assertions
- validation required:
  - future redesign must prove deterministic output on CI and local Windows/Linux captures before reclassifying

## P2

### NO_COLOR/FORCE_COLOR warning
- status:
  - deferred, partially mitigated
- evidence doc/source:
  - `docs/technical_debt/warning_cleanup_phase4_2026-04-28.md`
  - `docs/technical_debt/phase4_deferred_risk_triage_2026-04-28.md`
- why deferred:
  - non-blocking environment warning; controlled paths mitigated, parent-shell injection still possible
- next safe action:
  - shell-level env normalization for `NO_COLOR` when `FORCE_COLOR` is set
- validation required:
  - `pnpm test:e2e -- --workers=1`
  - contract lane run and log check for warning disappearance

### Dock layout compatibility warning / migration
- status:
  - deferred compatibility debt with safe fallback
- evidence doc/source:
  - `docs/technical_debt/warning_cleanup_phase4_2026-04-28.md`
  - `docs/technical_debt/phase4_deferred_risk_triage_2026-04-28.md`
- why deferred:
  - invalid legacy layout payloads are intentionally ignored with deterministic default fallback
- next safe action:
  - add layout versioning/migration strategy for legacy payload normalization
- validation required:
  - smoke + contract lanes
  - targeted migration regression test with legacy saved layout payloads

### ESLint legacy config / flat-config migration
- status:
  - deferred migration work
- evidence doc/source:
  - `docs/technical_debt/dependency_remediation_phase4_2026-04-28.md` (Phase 4.7F/4.7G)
  - `docs/technical_debt/stabilization_closure_2026-04-29.md`
- why deferred:
  - current bridge path is stable; migration is non-blocking and best handled as standalone config modernization
- next safe action:
  - dedicated ESLint flat-config migration pass with no runtime behavior scope
- validation required:
  - `pnpm lint`
  - `pnpm --filter app test`
  - `pnpm --filter app run build:production`

### Dev/tooling advisory residue (`minimatch`, `flatted`, `brace-expansion`)
- status:
  - deferred after targeted Lane 1 review (no safe minimal fix found under current constraints)
- evidence doc/source:
  - `docs/BLACK_SKIES_FIX_TRACKER.md` (2026-04-30 Lane 1 entry)
  - `pnpm audit` and `pnpm audit --json` dependency-path capture
- why deferred:
  - `minimatch`: vulnerable `3.1.2` is pulled by latest stable `eslint-plugin-jsx-a11y@6.10.2` and `eslint-plugin-react@7.37.5`; no smaller in-lane upgrade was available
  - `flatted`: vulnerable `3.3.3` is transitive through `eslint@9.39.4 -> file-entry-cache@8 -> flat-cache@4`; fix likely requires broader lint-stack movement
  - `brace-expansion`: mixed dev/tooling + packaging transitive exposure; packaging-side paths are tied to the Electron/package-chain lane and are out of scope for this pass
- next safe action:
  - defer to a dedicated tooling-only remediation pass that can absorb controlled ESLint-stack churn, while keeping Electron/runtime lanes isolated
- validation required:
  - `pnpm lint`
  - `pnpm --filter app test`
  - `pnpm build` not applicable at repo root (no root build script)
  - `pnpm --filter app run build:production`
  - `pnpm audit`

### Renderer TypeError warning noise (if still reproducible)
- status:
  - deferred pending reproducibility confirmation
- evidence doc/source:
  - `docs/technical_debt/mypy_reduction_phase4_2026-04-28.md` (Phase 4.8C/4.8I infra notes)
  - `docs/BLACK_SKIES_FIX_TRACKER.md` (historical notes)
- why deferred:
  - warning noise did not fail current lanes; ownership and reproduction scope not isolated
- next safe action:
  - capture latest reproducible trace and classify source (test-only harness noise vs product defect)
- validation required:
  - reproduce on latest branch with smoke + targeted renderer flow
  - confirm no hidden assertion failures masked by warning

### Local EPERM Playwright launch caveat
- status:
  - deferred local-environment caveat
- evidence doc/source:
  - `docs/BLACK_SKIES_FIX_TRACKER.md` (local environment-blocked notes)
- why deferred:
  - platform/host permissions issue; CI evidence already available for authoritative validation
- next safe action:
  - document local launch prerequisites and optional fallback execution environments
- validation required:
  - local Playwright launch preflight on target environment
  - parity check against CI artifact outputs

### Python advisory residue (`pip` only)
- status:
  - deferred as pip/environment-only residual risk after classification pass
- evidence doc/source:
  - `docs/BLACK_SKIES_FIX_TRACKER.md` (2026-04-30 Lane 4 entry)
  - `.\.venv\Scripts\python.exe -m pip_audit`
  - `.\.venv\Scripts\python.exe -m pip_audit -f json`
- why deferred:
  - current advisories are only on the environment installer tool (`pip`) and are not in service runtime packages
  - one advisory has no published fixed version yet in audit output (`CVE-2026-3219`)
  - no backend/runtime package vulnerability was detected in the current pass
- classification table:
  - `pip` `25.3` `CVE-2026-1703` (`GHSA-6vgw-5pg2-w6jp`) fix `26.0`:
    pip/environment-only; no direct runtime package path; safe direct bump likely but deferred in stabilization lane
  - `pip` `25.3` `CVE-2026-3219` (`GHSA-58qw-9mgm-455v`) fix `none listed`:
    pip/environment-only; no direct runtime package path; cannot fully close until upstream publishes a fix version
- next safe action:
  - defer to a small, isolated Python tooling lane after stabilization closure (pip installer tool update policy and lock refresh)
- validation required:
  - `.\.venv\Scripts\python.exe -m pip_audit`

### Uncommitted working-tree drift during Codex passes
- status:
  - process risk (managed manually)
- evidence doc/source:
  - `docs/BLACK_SKIES_FIX_TRACKER.md` (deferred-risk documentation sync notes)
  - observed pass behavior where existing uncommitted workflow/doc changes were detected and intentionally avoided
- why deferred:
  - not currently breaking CI/test gates, but increases mixed-commit and ownership ambiguity risk
- symptom:
  - Codex notices existing uncommitted workflow/doc changes and avoids touching them
- why it matters:
  - can cause mixed commits, skipped files, stale diffs, or confusion about phase ownership of changes
- next safe action:
  - require `git status --short`, `git diff --cached --name-status`, and `git diff --cached --check` before every commit
- future improvement:
  - add a phase handoff checklist and/or a pre-commit/commit helper script that enforces these checks
- validation required:
  - clean working tree or intentionally staged-only tree before each phase handoff

## Node 20 Warning Evidence Date Tags
- pre-upgrade evidence:
  - runs on commit `4fb029eecc5c0ba1fb9461a75f7f9e2d7c4dd0a3` still showed Node 20 deprecation warnings tied to old action pins
- post-upgrade evidence:
  - later Phase 5D evidence is green on commit `c8d42bae16e2a35805a69fba0353a9f8fc35b717`
- note:
  - historical warning records are retained for timeline accuracy and should not be read as current pin state.
