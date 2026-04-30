# Deferred Risk Register - 2026-04-29

Purpose:
- canonical deferred-risk register for stabilization closure and follow-on hardening phases
- single source of truth referenced by closure/tracker/phase docs to avoid drift

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
  - deferred/accepted for current stabilization, high-risk coordinated follow-up lane (post-B2 reviewed)
- evidence doc/source:
  - `docs/technical_debt/dependency_remediation_phase4_2026-04-28.md` (Phase 4.7H-4.7J)
  - `docs/technical_debt/phase4_deferred_risk_triage_2026-04-28.md`
- why deferred:
  - Batch A completed with material reduction (`49 -> 27`) and Batch B2 completed with validated runtime compatibility (`30.5.1 -> 31.7.7`) but unchanged remaining total (`27`); unresolved Electron advisories still require major lines `>=35`, `>=38`, and `>=39`, which exceeds safe incremental stabilization scope
- next safe action:
  - plan a dedicated major Electron modernization lane (likely `39+`) with explicit compatibility budget, instead of incremental `31 -> 32` hops that do not satisfy current advisory floors
- validation required:
  - `pnpm --filter app run build:production`
  - packaging smoke command in release flow
  - `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron --workers=1 --reporter=line`
  - `pnpm test:e2e -- --workers=1`
  - fresh `pnpm audit` delta showing actual advisory-ID reduction, not just runtime version movement

### react-mosaic-component runtime transitive advisories (`uuid`, `lodash`)
- status:
  - partial: `lodash` cleared in stable micro-lane; `uuid` remains deferred compatibility risk
- evidence doc/source:
  - `docs/technical_debt/dependency_remediation_phase4_2026-04-28.md` (Phase 4.7I)
  - `docs/technical_debt/phase4_deferred_risk_triage_2026-04-28.md`
  - `docs/technical_debt/react_mosaic_runtime_transitives_plan_2026-04-30.md`
- why deferred:
  - stable micro-lane (`react-mosaic-component 6.1.1 -> 6.2.0`) cleared `lodash` advisories without overrides and passed validation
  - remaining `uuid` advisory floor (`>=14`) is not reachable through current stable `react-mosaic-component` line and forced major override is not yet proven safe for the current CJS-oriented consumer path
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
  - `pnpm build`
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
