# Phase 5 Hardening Plan - 2026-04-28

## Phase 5B - GitHub Actions Node 20 Deprecation Warning Audit

### Scope
- files audited:
  - `.github/workflows/eval.yml`
  - `.github/workflows/security.yml`
- objective:
  - reduce Node 20 deprecation warning surface using safe action-version upgrades only
  - preserve workflow semantics and job behavior

### Safe Upgrades Applied
- `actions/checkout`:
  - from `@v4` to `@v5`
  - rationale: official v5 release line is available and explicitly prepared for Node 24 runtime usage
- `actions/cache`:
  - from `@v4` to `@v5`
  - rationale: official v5 release line is available and documented for Node 24 runtime
- `actions/setup-python`:
  - from `@v5` to `@v6`
  - rationale: official v6 release line is available and current in upstream usage docs
- `pnpm/action-setup`:
  - from `@v2` to `@v4`
  - rationale: v2 is legacy; current maintained major lines are newer, and v4 is a conservative major bump while keeping existing inputs (`version`, `run_install`) intact

### Deferred Action Pins
- `actions/upload-artifact@v4`
- `actions/download-artifact@v4`

### Why Deferred
- artifact actions have active major-line churn and runtime-transition behavior (`v5`/`v6`/`v7` signals) with backend/service coupling.
- current workflows are artifact-heavy and cross-job dependent; forcing a major-line jump without a dedicated artifact-lane regression run is higher risk than this audit pass allows.
- these are classified as external action/runtime deprecation noise pending a focused artifact action compatibility pass.

### Validation
- `git diff -- .github/workflows` reviewed and confirms only action-version pin updates.
- workflow YAML syntax check:
  - no built-in YAML parser/linter was available in this local environment without introducing new tooling.
  - manual diff review did not introduce structural YAML changes beyond `uses:` version tag updates.

### Risk Assessment
- applied changes:
  - low to medium (pin-only changes on widely used first-party actions + pnpm setup action)
- deferred artifact actions:
  - medium (warning noise remains, but behavior preserved)

### Remaining Warning Classification
- likely remaining Node 20 deprecation warnings, if still present after this pass, are expected to be dominated by artifact action runtime migration lag and runner-side rollout timing.

### Recommended Next Step
1. Run one CI cycle and inspect warning emitters after the new pins land.
2. If warnings remain on artifact actions, execute a dedicated artifact-action compatibility lane (upgrade `upload-artifact`/`download-artifact` majors together with artifact fetch/upload regression checks).

### Sources Used
- `actions/checkout` releases and marketplace:
  - https://github.com/actions/checkout/releases
  - https://github.com/marketplace/actions/checkout
- `actions/cache` repository/release notes:
  - https://github.com/actions/cache
- `actions/setup-python` repository/docs:
  - https://github.com/actions/setup-python
- `pnpm/action-setup` releases/repository:
  - https://github.com/pnpm/action-setup/releases
  - https://github.com/pnpm/action-setup
- Node 20 deprecation background:
  - https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
- artifact action release signals:
  - https://github.com/actions/upload-artifact/releases

## Phase 5B-2 - Artifact Action Compatibility Follow-Up

### Trigger
- follow-up lane executed because remaining Node 20 deprecation warning surface was still classified as artifact-action dominated in prior Phase 5B notes.

### Artifact Action Upgrades Applied
- `actions/upload-artifact`:
  - `@v4` -> `@v6`
- `actions/download-artifact`:
  - `@v4` -> `@v7`

### Why These Versions
- upstream release notes indicate the newer majors run on Node 24 runtime lines.
- upgrade was applied as a paired change to keep artifact service contracts aligned between upload and download actions.

### Semantics Preservation Check
- no artifact names changed.
- no artifact paths changed.
- no retention behavior changed.
- proof-manifest flow remains structurally identical:
  - PASS artifact uploads unchanged by name/path
  - manifest job downloads unchanged by name/path
  - published manifest upload unchanged by name/path

### Risk
- medium
- reason: artifact backend major changes can affect cross-job handoff behavior even when workflow YAML inputs stay the same.

### Recommended Validation
1. Run `eval.yml` once and confirm PASS 3/4/5/6 artifacts upload successfully.
2. Confirm `gauntlet-proof-manifest` downloads all four artifacts without missing-artifact placeholders on a healthy run.
3. Verify `playwright-artifacts`, `eval-report`, `load-ledger`, and `dependency-report-*` uploads remain present.
4. Re-check workflow logs for residual Node 20 deprecation warnings tied to artifact actions.

## Phase 5B-3 - CI Action-Upgrade Validation (Evidence Pass)

### Runs Inspected
- Validation & Eval Harness:
  - run `25135049889`
  - URL: `https://github.com/gray247/black-skies/actions/runs/25135049889`
- Security Audit:
  - run `25135049880`
  - URL: `https://github.com/gray247/black-skies/actions/runs/25135049880`

### Important Scope Note
- these are the latest available runs, but they executed on commit `4fb029eecc5c0ba1fb9461a75f7f9e2d7c4dd0a3` before Phase 5B/5B-2 workflow pin upgrades were run in CI.
- therefore this pass validates current baseline behavior/artifact health and identifies warning sources, but cannot yet prove post-upgrade warning removal.

### Job Status Summary
- `eval` run `25135049889`: `success`
  - all jobs completed successfully, including:
    - `Gauntlet PASS 3 Proof (Renderer/Preload)`
    - `App Truth Lane (Real Service Path)` (PASS 4)
    - `Gauntlet PASS 5 Proof (Harness/Smoke)`
    - `Gauntlet PASS 6 Proof (Build/Startup)`
    - `Publish Gauntlet CI Proof Manifest`
    - `Services Validation + Eval + Route Smoke`
- `security` run `25135049880`: `success`
  - `Repo hygiene enforcement` + both matrix `Security sweep` jobs succeeded.

### Node 20 Warning Status
- warning still present in inspected logs:
  - `Node.js 20 is deprecated...`
- remaining warning sources in those runs:
  - `actions/checkout@v4`
  - `actions/cache@v4`
  - `actions/setup-python@v5`
  - `pnpm/action-setup@v2`
  - `actions/upload-artifact@v4`
  - `actions/download-artifact@v4` (manifest job)
- interpretation:
  - expected for these pre-upgrade runs; not representative of the new pins in Phase 5B/5B-2.

### Artifact Health Summary
- `eval` run artifacts present:
  - `gauntlet-pass3-proof`
  - `gauntlet-pass4-proof`
  - `gauntlet-pass5-proof`
  - `gauntlet-pass6-proof`
  - `gauntlet-ci-proof-manifest`
  - `playwright-artifacts`
  - `eval-report`
  - `load-ledger`
- `security` run artifacts present:
  - `load-ledger-ubuntu-latest`
  - `load-ledger-macos-latest`
  - `dependency-report-ubuntu-latest`
  - `dependency-report-macos-latest`
  - plus expected audit report artifacts.

### Gauntlet Proof-Manifest Download Health
- in run `25135049889`, `Publish Gauntlet CI Proof Manifest` job:
  - `Download PASS 3 proof`: success
  - `Download PASS 4 proof`: success
  - `Download PASS 5 proof`: success
  - `Download PASS 6 proof`: success
  - manifest upload step: success

### Remaining Workflow Risks
- primary open risk is unvalidated post-upgrade behavior:
  - Phase 5B/5B-2 pin changes are not yet exercised by a completed CI run in this evidence set.
- secondary warning noise:
  - non-Node20 deprecation warnings remain in logs (e.g., Node `DEP0040`/`DEP0169`, Safety CLI `check` deprecation), unrelated to the Node 20 action-runtime migration objective.

### Next Required Validation
1. Trigger a fresh `eval` and `security` run on the commit containing Phase 5B and 5B-2 workflow changes.
2. Re-run this same evidence checklist:
   - job conclusions
   - Node 20 warning lines
   - artifact inventory
   - gauntlet manifest download steps
3. Close Phase 5B only after confirming Node 20 deprecation warnings are removed (or clearly reduced to external/non-action sources) on the post-upgrade runs.

## Phase X - CI / Workflow / Hardening Re-check

### Runs Inspected
- Validation & Eval Harness:
  - latest run: `25135941347`
  - baseline comparator: `25135049889`
- Security Audit:
  - latest run: `25135941342`
  - baseline comparator: `25135049880`
- Standalone gauntlet workflow:
  - none found in `gh run list --limit 20`; gauntlet lanes executed as jobs inside `eval.yml`.

### Job Status Verification
- latest `eval` run `25135941347`: `success`; all jobs succeeded.
- latest `security` run `25135941342`: `success`; all jobs succeeded.
- no partial failures observed.
- no skipped jobs observed in the inspected run payloads.
- no retry markers observed in job metadata or log output.

### Node Runtime Warning Analysis
- summary:
  - the warning banner still appears in latest run logs.
  - warning lines cite action pins such as `actions/checkout@v4` and `actions/upload-artifact@v4`.
  - current workspace workflow files are already upgraded (`checkout@v5`, `cache@v5`, `setup-python@v6`, `pnpm/action-setup@v4`, `upload-artifact@v6`, `download-artifact@v7`), so inspected runs are not executing those upgraded definitions yet.

#### Classification By Emitting Action
- `actions/checkout@v4`: `REAL` (outdated in executed runs; clear upgrade path exists and is already staged in workflow files).
- `actions/cache@v4`: `REAL` (same).
- `actions/setup-python@v5`: `REAL` (same).
- `pnpm/action-setup@v2`: `REAL` (same).
- `actions/upload-artifact@v4`: `REAL` (same).
- `actions/download-artifact@v4`: `REAL` (same; observed in proof manifest job).
- GitHub warning banner itself ("forced to run on Node 24"): `DECLARATION NOISE` after upgraded pins are actually exercised; currently it is still a true signal for the specific run revision.
- `PLATFORM BUG` classification: none confirmed from this pass.

### Artifact Integrity Validation
- `eval` run `25135941347` artifacts present and non-empty:
  - `gauntlet-pass3-proof` (`344 B`)
  - `gauntlet-pass4-proof` (`3026 B`)
  - `gauntlet-pass5-proof` (`322 B`)
  - `gauntlet-pass6-proof` (`336 B`)
  - `gauntlet-ci-proof-manifest` (`3164 B`)
  - `playwright-artifacts` (`8,288,610 B`)
  - `eval-report` (`3327 B`)
  - `load-ledger` (`11,709 B`)
- `security` run `25135941342` required artifacts present:
  - `load-ledger-ubuntu-latest`
  - `load-ledger-macos-latest`
  - `dependency-report-ubuntu-latest`
  - `dependency-report-macos-latest`
- proof manifest job validation:
  - `Publish Gauntlet CI Proof Manifest` downloaded PASS3/PASS4/PASS5/PASS6 successfully.
- missing artifacts: none.
- download failures: none.
- mismatched names: none.

### Regression Scan
- new warnings: none beyond previously seen Node deprecation families (`DEP0040`, `DEP0169`), Safety CLI deprecation text, and ESLint RC deprecation text.
- increased log noise: no meaningful increase relative to baseline run pair.
- timing instability:
  - eval: `3m14s` -> `3m16s` (stable).
  - security: `1m10s` -> `1m04s` (improved).
- hidden failures in successful jobs: none detected.

### Baseline Comparison (vs 25135049889 / 25135049880)
- improved:
  - both latest runs still green.
  - security duration improved.
  - artifact handoff remains healthy.
- unchanged:
  - Node 20 deprecation banner still appears in logs.
  - same warning families continue.
- worse:
  - none observed.

### Final Classification
- `C. ACTIONABLE`
- rationale:
  - execution stability is green, but the Node 20 warning objective is not yet closed because inspected runs still executed old action pins.
  - required action is procedural validation (run upgraded workflow revision), not code/runtime changes.

### Next Move
1. Trigger fresh `eval.yml` and `security.yml` runs on the commit that includes the upgraded action pins.
2. Re-run this exact Phase X checklist and confirm warning lines no longer cite `@v4/@v5` action runtimes.
3. If warnings persist after upgraded-pin runs, classify remaining lines as platform/external noise and close Phase 5B with evidence.
