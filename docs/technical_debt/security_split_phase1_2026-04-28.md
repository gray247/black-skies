# Security Split — Phase 1.2 — 2026-04-28

## Purpose
Separate security workflow reliability failures (pipeline mechanics/config drift) from dependency advisory remediation (actual package CVEs), so each can be fixed without conflating root causes.

## Lane A — Workflow Reliability
- Current observed behavior:
  - Scheduled `main` Security Audit runs are failing.
  - Recent `phase-b2-memory-lab` push Security Audit runs are succeeding.
- Evidence:
  - Live runs (`gh run list --limit 5`):
    - `25042584310` (schedule, `main`) -> `failure`
    - `24984895989` (schedule, `main`) -> `failure`
    - `24967291747` (push, `phase-b2-memory-lab`) -> `success`
  - `gh run view 25042584310 --json ...` shows failures in both matrix jobs at `Set up Node 20` and downstream skipped/failure artifact steps.
  - Failed-run logs (`gh run view 25042584310 --log-failed`) show:
    - `actions/setup-node@v4` with `node-version: 20` and `cache: pnpm`
    - error: `Unable to locate executable file: pnpm`
    - Safety CLI misuse: `Error: Invalid value for '--output' / '-o': 'safety-report.json' is not one of 'screen', 'text', 'json', 'bare', 'html'.`
    - deprecated Node 20 action warning.
  - Same workflow in current branch file (`.github/workflows/security.yml`) uses:
    - `actions/setup-node@v5`
    - `node-version: '24'`
    - `package-manager-cache: false`
    - explicit pnpm setup + store cache
    - Safety call with `--output json --save-json safety-report.json`.
- Suspected causes:
  - Branch/config drift between `main` and `phase-b2-memory-lab` for `.github/workflows/security.yml`.
  - Schedule runs execute `main`'s older workflow definition (still Node 20 / setup-node@v4 path), while push runs on branch use updated workflow.
  - Some failures are workflow-step/config errors (pnpm/setup, CLI flags), not dependency advisories.
- What must be proven before changing workflow:
  - Confirm exact `main` workflow file at failing SHA (`d2b50a8...`) differs from branch workflow and enumerate line-level deltas.
  - Re-run Security Audit on a branch containing current workflow and verify no command-contract failures (`pnpm` resolution, Safety flags, artifact upload path requirements).
  - Verify that, after reliability fixes are present on target branch, any remaining failure is strictly advisory-gate policy output.

## Lane B — Advisory Remediation
### Node/pnpm advisories
- Baseline evidence (`pnpm audit`): `63 vulnerabilities` (`4 low | 24 moderate | 35 high`).
- Signal: significant advisory backlog across transitive chains plus runtime-adjacent packages.
- Runtime-sensitive likely areas:
  - `electron` major jumps and related packaging stack (`electron-builder`, transitive `tar`, etc.).
  - Vite/renderer toolchain changes impacting build/runtime behavior.
- Tooling-only likely areas:
  - docs/lint/test/dev-only chains (`markdownlint-cli`, some eslint/test/transitive utilities), where production runtime impact is minimal.

### Python/pip advisories
- Baseline evidence (`.venv\\Scripts\\python.exe -m pip_audit`):
  - `8 known vulnerabilities in 7 packages`.
  - Packages/CVEs/fix targets:
    - `black 25.9.0` -> fix `26.3.1` (CVE-2026-32274)
    - `pip 25.3` -> fix `26.0` (CVE-2026-1703)
    - `pip 25.3` (CVE-2026-3219)
    - `pygments 2.19.2` -> fix `2.20.0` (CVE-2026-4539)
    - `pytest 8.4.2` -> fix `9.0.3` (CVE-2025-71176)
    - `python-dotenv 1.1.1` -> fix `1.2.2` (CVE-2026-28684)
    - `starlette 0.48.0` -> fix `0.49.1` (CVE-2025-62727)
    - `wheel 0.45.1` -> fix `0.46.2` (CVE-2026-24049)
  - Skip note: `black-skies (1.0.0rc1)` not found on PyPI.
- Runtime-sensitive likely areas:
  - `starlette` (HTTP/runtime behavior)
  - any framework-adjacent upgrades (`fastapi` coupling, if needed transitively)
- Tooling-only likely areas:
  - `black`, `pytest`, potentially `wheel`, and possibly `pip` in CI/build context

### Recommended remediation order
1. Workflow reliability lane first (no package upgrades): eliminate false-red due to workflow drift/config.
2. Low-risk tooling updates (dev-only / CI-only impact) with tight regression checks.
3. Medium-risk transitive chains (pnpm graph clusters) in isolated batches.
4. Runtime-sensitive framework/runtime packages (`starlette`, Electron/toolchain) with full compatibility gates.

## Dependency Upgrade Blast-Radius Policy
- targeted tests:
  - Pre-upgrade baseline commands:
    - `pnpm audit`
    - `.\.venv\Scripts\python.exe -m pip_audit`
    - `pnpm --filter app test`
    - `pytest -q`
    - `pnpm test:e2e -- --project=electron --workers=1 --grep "smoke_"`
  - Post-upgrade required reruns (same set) per batch.
- rollback path:
  - One batch per commit.
  - If regressions: revert commit cleanly (no mixed upgrade/fix-forward commit).
  - Keep upgrade notes mapping package -> observed breakage -> revert SHA.
- compatibility notes:
  - Record API/behavior deltas for each upgraded package before merge.
  - For Python runtime libs, note FastAPI/Starlette and pydantic compatibility constraints.
  - For JS, note Electron main/renderer and packaging toolchain compatibility matrix.
- Electron/toolchain risk:
  - Treat Electron major upgrades as high-risk, multi-step changes with dedicated smoke + harness validation.
  - Avoid combining Electron upgrades with unrelated dependency churn in same PR.
- lockfile discipline:
  - Lockfile changes must be deterministic and scoped to the batch.
  - No manual lockfile edits; regenerate with package manager commands only during remediation phase.
  - Keep `pnpm-lock.yaml`, `requirements.lock`, `requirements.dev.lock`, `constraints.txt` consistent with declared versions.

## Commands Run
```text
Get-ChildItem .github/workflows
Get-Content .github/workflows/security.yml
Get-Content .github/workflows/eval.yml
Get-Content package.json
Get-Content pnpm-workspace.yaml
Get-Content pyproject.toml
Get-Content requirements.lock
Get-Content requirements.dev.lock
Get-Content constraints.txt
Get-Content docs/technical_debt/baseline_2026-04-28.md
gh run view 25042584310 --json name,headBranch,event,status,conclusion,createdAt,updatedAt,jobs
gh run view 24967291747 --json name,headBranch,event,status,conclusion,createdAt,updatedAt,jobs
gh run view 25042584310 --log-failed
```

## Files Inspected
- `.github/workflows/security.yml`
- `.github/workflows/eval.yml`
- `package.json`
- `pnpm-workspace.yaml`
- `pyproject.toml`
- `requirements.lock`
- `requirements.dev.lock`
- `constraints.txt`
- `docs/technical_debt/baseline_2026-04-28.md`
- GitHub Actions run metadata/logs for run IDs: `25042584310`, `24967291747`

## No-Fix Confirmation
- No dependency upgrades performed.
- No lockfiles modified.
- No workflow files modified.
- No app/test/runtime code modified.
- This pass is audit + documentation only.

## Exit Criteria
- [x] Security workflow problems separated from dependency advisories
- [x] Dependency upgrade blast-radius policy documented
- [x] Targeted tests listed
- [x] Rollback path documented
- [x] Compatibility notes documented
- [x] Electron/toolchain risk called out

## Phase 1.2A Workflow Reliability Follow-up
- What changed:
  - No workflow file edits were required in this branch.
  - Current `.github/workflows/security.yml` already matches the known-good reliability path:
    - `actions/setup-node@v5`
    - `node-version: '24'`
    - `package-manager-cache: false`
    - explicit `pnpm/action-setup@v2` before pnpm usage
    - Safety invocation compatible with current CLI (`--output json --save-json safety-report.json`)
    - report fallback file creation for pip-audit / safety / pnpm-audit / dependency report.
- Why:
  - The observed schedule failures are executing `main`'s older workflow definition (Node 20/setup-node@v4 path), not this branch file.
  - Evidence from failed run `25042584310` shows `Set up Node 20` + pnpm resolution failure and invalid Safety `--output safety-report.json` usage.
  - Evidence from passing run `24967291747` shows the updated Node 24 + setup-node@v5 path succeeding on both OS jobs.
- What was intentionally not changed:
  - No dependency versions were upgraded.
  - No lockfiles were modified.
  - No advisory threshold/policy logic was altered.
  - No app/runtime/test/workflow behavior outside reliability analysis was changed.
- Verification command/status:
  - `pnpm audit` -> runs and reports advisories (`63 vulnerabilities`; command exits non-zero due findings).
  - `.\\.venv\\Scripts\\python.exe -m pip_audit` -> runs and reports advisories (`8 vulnerabilities in 7 packages`; command exits non-zero due findings).
  - YAML parse attempt via Python failed due local `yaml` module shadowing/parser incompatibility (`yaml.YAMLError: Expected indented block at line 9`), so parser check was not accepted as authoritative.
  - `git diff -- .github/workflows/security.yml docs/technical_debt/security_split_phase1_2026-04-28.md` currently shows no diff in tracked output in this working tree context.
- Remaining advisory-only failures, if any:
  - Once the updated security workflow is present on `main`, remaining expected failures should be advisory-gate outcomes (HIGH/CRITICAL findings), not setup/tooling crashes.
