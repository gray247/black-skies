# BLACK SKIES - FIX TRACKER

Status: Active
Last Reviewed: 2026-04-21

## Purpose
This document tracks defects, technical debt, and instability across Black Skies.
If an issue is not tracked here, it is not part of the active fix scope.

## Usage Rules
1. Issues are never deleted; statuses change instead.
2. Every update records date, actor, and change.
3. `VERIFIED` requires evidence (CI result, reproducible command, or logs).
4. Partial fixes must be explicit.
5. Regressions stay under the same issue ID.

## Status Definitions
- `ACTIVE`: known issue, unresolved
- `IN_PROGRESS`: active implementation
- `PARTIAL`: partially fixed, residual risk remains
- `BLOCKED`: waiting on dependency/decision
- `MONITOR`: currently stable but fragile historically
- `VERIFIED`: fixed with evidence
- `REGRESSED`: previously fixed, failing again
- `UNVERIFIED`: cannot currently validate from local environment

---

## Verification Sweep (2026-04-21, Codex)

### Summary
- Tracker content was stale and partly generic; statuses did not reflect current repo state.
- Several CI/workflow issues are now partially fixed.
- New major issues were found and added (doc command drift, encoding corruption, permission-denied temp dirs).

### Evidence Checked
- `.github/workflows/security.yml`
- `.github/workflows/eval.yml`
- `scripts/e2e-with-backend.mjs`
- `scripts/dev-runner.mjs`
- `scripts/electron-dev.mjs`
- `docs/tests.md`
- `docs/roadmap.md`
- `docs/phases/phase_log.md`
- `docs/phase_bridge.md`
- `docs/ops/start_codex_gui_notes.md`
- `.gitignore`
- `git status --short`

### Local Validation Gaps
- Root `.venv` tooling is now reproducible in WSL using lockfile install:
  `./.venv/bin/python -m pip install -c constraints.txt -r requirements.lock -r requirements.dev.lock`.
- Remaining blocker for blind repo-root mypy recursion: `PermissionError: [Errno 13] Permission denied: 'codex_temp/m700'`.

---

## Top 3 Execution Plan (2026-04-21)

### Priority 1: [1] security.yml workflow failures
- Why top priority: CI security lane can fail despite code health; this blocks reliable vulnerability reporting.
- Files: `.github/workflows/security.yml`
- Likely root cause: matrix artifact naming not made unique after multi-OS fan-out.
- Smallest safe fix path: rename artifact uploads to include `${{ matrix.os }}` with no behavioral changes.
- Validation: workflow YAML review + grep for unique artifact names + CI run confirmation.
- Batch safety: can batch with [8] (artifact upload logic issues); should stay isolated from Black/mypy debt.

### Priority 2: [2] Black failing in CI
- Why top priority: formatting lane is still intentionally narrowed, leaving unknown repo-wide debt.
- Files: `.github/workflows/eval.yml`, Python source files failing black once discovered.
- Likely root cause: mechanical formatting debt across non-scoped paths.
- Smallest safe fix path: install tooling in consistent env, run `black --check .`, then patch in batches by folder.
- Validation: local `black --check .` + CI lane green without temporary scope comments.
- Batch safety: can batch with [10] (scope narrowing) but should stay isolated from mypy fixes.

### Priority 3: [3] Mypy failing in CI
- Why top priority: typing gate remains scoped; full confidence on typed contracts is missing.
- Files: `.github/workflows/eval.yml`, typed modules discovered by full mypy run.
- Likely root cause: legacy typing debt beyond currently scoped scripts/tools.
- Smallest safe fix path: run full mypy in prepared env, bucket failures by module, fix highest-impact modules first.
- Validation: reproducible mypy command with zero errors for agreed scope; CI type lane green.
- Batch safety: can batch with [10] scope-retirement sequencing; should stay isolated from security workflow edits.

---

# Tier 1 - CI/Workflow Blockers

## [1] security.yml workflow failures
- Tier: 1
- Status: PARTIAL
- Priority: Critical
- Owner: Codex / Human
- Last Updated: 2026-04-23

#### Description
Security workflow had setup/artifact reliability issues.

#### Known Facts
- `security.yml` now sets up Node and pnpm without `setup-node` pnpm-cache coupling that required a pre-existing `pnpm` binary.
- Dynamic artifact path handling for load-ledger is hardened:
  - `find_latest_run.py` is called with required `--kind load-test`
  - fallback artifact file `load-ledger-missing.json` is created when discovery fails
  - upload step always receives a non-empty path output
- Dependency report generation now guarantees `dependency-report.json` exists before upload (fallback JSON when generation aborts).
- Matrix artifact names remain OS-unique (`-${{ matrix.os }}` suffix) for pip-audit, safety, pnpm-audit, load-ledger, and dependency-report.
- Runtime load sanity failure remained after trigger/setup fixes:
  - `scripts/load.py` expects an existing project root at `sample_project/proj_esther_estate`
  - that project fixture is not present in CI checkout by default.
- Load-ledger upload still failed in that scenario because `Discover load ledger` did not run after a failed load step, leaving `steps.load_ledger.outputs.run_json` unset.

#### Root Cause
Security workflow still assumed local sample-project fixture state that does not exist in clean CI checkouts, and artifact fallback logic depended on a step that was skipped after earlier failure.

#### Actions
- Re-run `security.yml` matrix (ubuntu + macOS) to confirm:
  - no `pnpm` executable-resolution failures
  - light-load sanity succeeds with the CI-created project fixture
  - no upload-artifact missing-path failures
  - artifacts upload on both matrix OS jobs.

#### Progress Log
- 2026-04-21 - Codex - Verified setup improvements and identified matrix artifact-name collision risk.
- 2026-04-21 - Codex - Began implementation pass to harden matrix artifact naming.
- 2026-04-21 - Codex - Updated matrix artifact upload names to include `${{ matrix.os }}` for pip-audit, safety, pnpm-audit, and dependency reports.
- 2026-04-22 - Codex - Removed `cache: 'pnpm'` from `setup-node` in `security.yml` to avoid pre-install pnpm resolution failure on ubuntu/macos.
- 2026-04-22 - Codex - Fixed load-ledger discovery/upload path contract (`--kind load-test`, fallback file, non-empty output path) to prevent upload-artifact missing `path`.
- 2026-04-22 - Codex - Added dependency-report fallback file creation before upload so artifact path is always valid.
- 2026-04-23 - Codex - Added a minimal CI fixture-prep step to materialize `sample_project/proj_esther_estate` (project.json, outline.json, drafts) before light-load sanity.
- 2026-04-23 - Codex - Set `Discover load ledger` to `if: always()` so it still emits a fallback artifact path after a failing load step.

#### Verification
- Pending CI run after load fixture and always-run ledger discovery fixes.

#### Exit Criteria
- Security workflow green on all matrix OS jobs with no artifact upload errors.

---

## [2] Black failing in CI
- Tier: 1
- Status: VERIFIED
- Priority: Critical
- Owner: Codex / Human
- Last Updated: 2026-04-22

#### Description
Black failures were historically reported and are now resolved in both local and CI repo-wide checks.

#### Known Facts
- `eval.yml` Black lane now runs repo-wide (`black --check .`); temporary Black scope narrowing comments were removed in this pass.
- Local repro now passes exactly with CI-equivalent repo-wide command:
  `./.venv/bin/python -m black --check .`.
- Repo-wide check previously failed reproducibly:
  `./.venv/bin/python -m black --check .` -> 10 files would be reformatted.
- Former repo-wide Black failures were:
  `app/temp-trace/trace_lines.py`, `app/temp-trace/trace_tail.py`, `app/temp-trace/console_logs.py`,
  `list_trace.py`, `trace_search.py`, `scan_trace.py`, `diffscript.py`, `diffpixels.py`,
  `diffregion.py`, `diffstats.py`.
- Those 10 files were reformatted in this pass; repo-wide check now passes locally:
  `./.venv/bin/python -m black --check .` -> 362 files would be left unchanged.
- Python/runtime alignment evidence:
  - Local env: `Python 3.12.3`, `black 25.9.0`
  - CI env: `Python 3.11` (from `actions/setup-python@v5`), constraints pin `black==25.9.0`
  - Additional local repro with CI-equivalent target version passes:
    `./.venv/bin/python -m black --check --target-version py311 .` -> 362 files unchanged.

#### Root Cause
Residual formatting debt plus temporary CI scope narrowing.

#### Actions
- Preserve focused debt retirement on mypy separately (not part of this issue pass).

#### Progress Log
- 2026-04-21 - Codex - Confirmed scope narrowing remains in CI; local repro blocked by missing tool install.
- 2026-04-21 - Codex - Installed lockfile Python deps in root `.venv` and verified Black availability in WSL.
- 2026-04-21 - Codex - Reproduced scoped CI Black command locally: PASS (346 files unchanged).
- 2026-04-21 - Codex - Reproduced repo-wide Black locally: FAIL (10 files need reformat).
- 2026-04-21 - Codex - Reformatted the 10 failing files with Black and reran checks:
  - `./.venv/bin/python -m black --check .` -> PASS (362 files unchanged)
  - `./.venv/bin/python -m black --check services/src services/tests scripts tests tools/runtime_truth` -> PASS (346 files unchanged)
- 2026-04-21 - Codex - Updated `eval.yml` Black lane to repo-wide (`black --check .`) without changing flake8/mypy scope.
- 2026-04-21 - Codex - Validated Black version/runtime alignment risk as low: CI and local both use Black 25.9.0; local `--target-version py311` check passes.
- 2026-04-22 - Codex - Verified GitHub Actions `eval.yml` lint job passed with repo-wide Black step (`black --check .`) on Python 3.11.

#### Verification
- Verified: local repo-wide Black is clean and GitHub Actions passed with repo-wide Black in CI.

#### Exit Criteria
- `black --check .` passes in CI and local dev baseline.

---

## [3] Mypy failing in CI
- Tier: 1
- Status: PARTIAL
- Priority: Critical
- Owner: Codex / Human
- Last Updated: 2026-04-21

#### Description
Type checking debt is managed by scoped CI checks.

#### Known Facts
- `eval.yml` runs mypy only on selected scripts/tools.
- Repo-wide package mypy is deferred by explicit temporary-scope comments.
- Local scoped repro now passes exactly with CI command:
  `./.venv/bin/python -m mypy --follow-imports=skip scripts/verify_gauntlet.py scripts/gauntlet_capability_probe.py scripts/write_gauntlet_ci_manifest.py scripts/write_gauntlet_pass_summary.py scripts/run_service_truth.py tools/runtime_truth/build_runtime_truth.py tools/runtime_truth/validate_runtime_docs.py tools/runtime_truth/validate_deferred_feature_containment.py`.
- Expanded scope repro fails:
  `./.venv/bin/python -m mypy --follow-imports=skip services/src services/tests scripts tests tools/runtime_truth`
  -> 173 errors in 49 files.
- Blind repo-root run fails before type analysis due filesystem blocker:
  `./.venv/bin/python -m mypy --follow-imports=skip .`
  -> `PermissionError: [Errno 13] Permission denied: 'codex_temp/m700'`.

#### Root Cause
Unresolved repo-wide typing debt and temporary CI scope narrowing.

#### Actions
- Resolve permission-denied directories that break recursive source discovery.
- Split expanded-scope typing failures into fix batches (services runtime, routers, tests).

#### Progress Log
- 2026-04-21 - Codex - Confirmed scoped mypy is still active and full check is deferred.
- 2026-04-21 - Codex - Installed lockfile Python deps in root `.venv`; `mypy 1.11.2` now available in WSL.
- 2026-04-21 - Codex - Reproduced scoped CI mypy command locally: PASS (no issues in 8 files).
- 2026-04-21 - Codex - Reproduced expanded-scope mypy locally: FAIL (173 errors across 49 files).
- 2026-04-21 - Codex - Reproduced repo-root mypy recursion blocker: permission denied at `codex_temp/m700`.

#### Verification
- Partial: scoped command reproduced locally; expanded and repo-root blockers reproduced locally.

#### Exit Criteria
- Full targeted package/typecheck scope agreed and consistently green.

---

# Tier 2 - Fragile Test Systems

## [4] PASS 4 truth-lane fragility
- Status: MONITOR
- Last Updated: 2026-04-21

#### Notes
Truth lane path appears intentionally separated (`scripts/truth-with-backend.mjs` sets synthetic/mock flags to `0`). Keep monitoring for drift.

---

## [5] PASS 5 harness fragility
- Status: MONITOR
- Last Updated: 2026-04-21

#### Notes
Harness lane remains intentionally synthetic and hook-driven.

---

## [6] PASS 6 build/startup assumptions
- Status: MONITOR
- Last Updated: 2026-04-21

#### Notes
No new direct failures found in this sweep; continue monitoring startup assumptions across OS.

---

# Tier 3 - CI Architecture Debt

## [7] Node/pnpm inconsistency
- Status: PARTIAL
- Last Updated: 2026-04-21

#### Known Facts
- Both `eval.yml` and `security.yml` now set Node 20 and pnpm 8.
- Duplication and minor setup drift still exist across workflow jobs.

#### Actions
- Consider shared composite action or reusable workflow.

---

## [8] Artifact upload logic issues
- Status: PARTIAL
- Last Updated: 2026-04-23

#### Known Facts
- File-existence guards are now present.
- Matrix artifact naming collision risk was addressed in a prior pass and remains fixed.
- Dynamic load-ledger upload path in `security.yml` could be empty when `find_latest_run.py` failed, which maps to upload-artifact missing required `path`.
- `security.yml` now guarantees path-safe uploads for dynamic and generated artifacts (load-ledger and dependency report fallbacks).
- Additional failure mode identified: when light-load sanity step fails, downstream ledger-discovery step is skipped by default step conditions unless explicitly marked `if: always()`.

#### Actions
- Confirm CI uploads all security artifacts successfully on ubuntu and macOS.

#### Progress Log
- 2026-04-21 - Codex - Issue execution batched with [1] due same file and same root cause.
- 2026-04-21 - Codex - Implemented matrix-unique artifact names in `security.yml`; awaiting CI confirmation.
- 2026-04-22 - Codex - Fixed dynamic load-ledger artifact path contract so upload-artifact always receives a valid `path`.
- 2026-04-22 - Codex - Added dependency report fallback file generation to keep upload path valid when command exits early.
- 2026-04-23 - Codex - Marked `Discover load ledger` as `if: always()` so upload path fallback executes even after load sanity failure.

---

## [9] Workflow duplication/divergence
- Status: ACTIVE
- Last Updated: 2026-04-22

#### Known Facts
- `eval.yml` and `security.yml` still duplicate setup and policy logic.
- Trigger gap was present: workflow runs were not configured on push for active development branches (`main`, `phase-b2-memory-lab`), so branch pushes did not automatically execute these lanes.

#### Actions
- Consolidate shared workflow patterns.
- Keep push/pull_request/workflow_dispatch trigger coverage explicit for active verification workflows.

#### Progress Log
- 2026-04-22 - Codex - Added `push` triggers for `main` and `phase-b2-memory-lab` in `eval.yml` and `security.yml`; retained existing `pull_request` and manual dispatch triggers.

---

## [10] Temporary CI scope narrowing
- Status: ACTIVE
- Last Updated: 2026-04-22

#### Known Facts
- Black scope narrowing is retired and validated:
  - `eval.yml` now runs repo-wide Black (`black --check .`).
  - GitHub Actions passed the repo-wide Black step.
- Temporary scope narrowing remains for flake8 and mypy only.
- Scoped mypy command still passes while expanded mypy fails with 173 errors in 49 files.

#### Actions
- Keep Black narrowing retired; do not reintroduce scoped Black paths.
- Keep temporary mypy/flake8 scope decisions isolated until their debt retirement passes complete.

---

# Tier 4 - Testing and Verification Debt

## [11] Smoke vs truth-lane boundary
- Status: ACTIVE
- Last Updated: 2026-04-21

#### Known Facts
- `scripts/e2e-with-backend.mjs` defaults to smoke filtering (`--grep smoke_`) when no explicit tests are passed.
- Harness lane also sets synthetic/mock assumptions by default (`BLACKSKIES_E2E_SYNTHETIC_MODE=1`, `BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW=1`).

---

## [12] Capability coverage gaps
- Status: ACTIVE

## [13] Accept step not in UI chain
- Status: ACTIVE

## [14] Dual snapshot system risk
- Status: ACTIVE

## [15] No-silent-success enforcement
- Status: ACTIVE

---

# Tier 5 - Docs and Governance Debt

## [16] Phase docs out of sync
- Status: PARTIAL
- Last Updated: 2026-04-21

#### Known Facts
- `docs/roadmap.md` and `docs/phases/phase_log.md` are aligned on authority.
- `docs/phase_bridge.md` had transitional framing and encoding corruption.

#### Actions
- Keep transitional bridge doc explicit and UTF-8 clean.

#### Progress Log
- 2026-04-21 - Codex - Rewrote `docs/phase_bridge.md` to remove mojibake and preserve current transitional scope wording.

---

## [17] Doc authority drift
- Status: PARTIAL
- Last Updated: 2026-04-21

#### Known Facts
- Authority notes exist in key docs, reducing ambiguity.
- Operational docs contained stale command paths and behavior.

#### Actions
- Keep active docs aligned with current scripts and startup paths.

#### Progress Log
- 2026-04-21 - Codex - Updated `docs/ops/start_codex_gui_notes.md` to use current scripts (`bootstrap`, `scripts/electron-dev.mjs`) and removed placeholder launcher guidance.
- 2026-04-21 - Codex - Corrected `docs/ops/start_codex_gui_notes.md` bootstrap detail to match `start-codex.ps1` lockfile install command (`pnpm install --frozen-lockfile --prefer-frozen-lockfile`).

---

## [18] Runtime truth sync risk
- Status: ACTIVE

---

# Tier 6 - Repo Hygiene

## [19] Junk artifact buildup
- Status: ACTIVE
- Last Updated: 2026-04-21

#### Known Facts
- Permission-denied temp dirs exist under `services/` (`testtmp-app-1`, `testtmp-budget-1`, `testtmp-longform-1`) and interfere with repo scanning.
- Tracked ad-hoc diagnostics scripts (`app/temp-trace/*.py` and root `diff*/trace*` helpers) created avoidable repo-wide Black debt before this pass.

---

## [20] .gitignore discipline issues
- Status: ACTIVE
- Last Updated: 2026-04-21

#### Known Facts
- `.gitignore` includes `services/testtmp-*/`, but existing directories are still present and causing tooling friction.
- `.gitignore` cannot contain already-tracked ad-hoc scripts; containment needs policy discipline (where such scripts live and how they are maintained), not broad new ignore globs.

---

## [21] Environment instability
- Status: PARTIAL
- Last Updated: 2026-04-21

#### Known Facts
- Root `.venv` in WSL now has `black` and `mypy` available via lockfile install command.
- Remaining environment blocker is narrowed: legacy ACL-locked dirs under `codex_temp/` still return permission denied on this host (`m700`, `probeperm`, one historical `service-truth/.../basetemp`).
- Preventive guardrail added in `scripts/pytest_repo_temp_compat.py` to force traversable perms for pytest-created repo-local temp directories.
- Repo-root mypy discovery is now guarded from known generated temp roots via `[tool.mypy].exclude` in `pyproject.toml`; command now reaches type analysis instead of permission crash.
- Repro evidence for guardrail:
  `./.venv/bin/python -m pytest -q tests/test_cache.py --basetemp codex_temp/permcheck -p scripts.pytest_repo_temp_compat`
  created traversable `codex_temp/permcheck` tree (no permission-denied entries).

---

# Tier 7 - Security and Dependencies

## [22] Security workflow + vulnerability reporting
- Status: PARTIAL
- Last Updated: 2026-04-23

#### Known Facts
- Reporting steps exist and fail-closed behavior is present.
- Matrix artifact naming remains OS-unique.
- Workflow stability fixes were applied for known runner failures:
  - pnpm availability issue in Node setup path
  - upload-artifact missing `path` from failed dynamic ledger discovery
- Load sanity now has an explicit CI fixture-preparation step so the expected project root exists before `scripts/load.py` runs.
- CI confirmation is still required before status can advance.

---

## [23] Dependency update plan missing
- Status: ACTIVE

---

# Tier 8 - Product and UX Debt

## [24] GUI navigation instability
- Status: ACTIVE

## [25] Layout persistence issues
- Status: ACTIVE

## [26] Project creation UX weak
- Status: ACTIVE

## [27] Budget meter reliability
- Status: ACTIVE

---

# Newly Added Issues (2026-04-21)

## [28] Ops doc command drift (invalid dev launcher guidance)
- Tier: 5
- Status: PARTIAL
- Priority: High
- Owner: Codex / Human
- First Identified: 2026-04-21
- Last Updated: 2026-04-21

#### Description
`docs/ops/start_codex_gui_notes.md` documented a placeholder launcher path that no longer exists.

#### Known Facts
- Doc referenced `scripts/electron-dev-placeholder.mjs` and stale `pnpm run install` command.
- Execution and ownership now tracked under [17] to avoid duplicate planning.

#### Root Cause
Operational doc was not updated after dev launcher migration.

#### Actions
- Keep as history issue; execute under [17].

#### Progress Log
- 2026-04-21 - Codex - Added issue after code/doc verification.
- 2026-04-21 - Codex - Partial remediation completed via doc update; consolidated ongoing governance tracking under [17].

#### Verification
- Pending full active-doc sweep.

#### Exit Criteria
- No stale launcher references in active ops docs.

---

## [29] Encoding corruption in active docs
- Tier: 5
- Status: PARTIAL
- Priority: Medium
- Owner: Codex / Human
- First Identified: 2026-04-21
- Last Updated: 2026-04-21

#### Description
Multiple active docs contained mojibake characters (`â€”`, `â€œ`, `Ã¢â‚¬â€`).

#### Known Facts
- `docs/phase_bridge.md` and `docs/ops/start_codex_gui_notes.md` were remediated in this pass.
- Remaining active-doc sweep is still required.

#### Root Cause
Mixed encoding/edit pipeline (UTF-8/Windows code page mismatch).

#### Actions
- Continue targeted normalization and add encoding check later if needed.

#### Verification
- Partial (targeted files only).

#### Exit Criteria
- Clean UTF-8 rendering across active docs.

---

## [30] Permission-denied temp directories break tooling scans
- Tier: 6
- Status: PARTIAL
- Priority: High
- Owner: Codex / Human
- First Identified: 2026-04-21
- Last Updated: 2026-04-21

#### Description
Temp directories under `services/` return access denied during recursive searches.

#### Known Facts
- `rg` reports `Access is denied` for:
  - `services/testtmp-app-1`
  - `services/testtmp-budget-1`
  - `services/testtmp-longform-1`
- Historical blocker repro:
  - `mypy --follow-imports=skip .` previously failed immediately with `PermissionError: [Errno 13] Permission denied: 'codex_temp/m700'`.
- Current filesystem evidence for the blocker path:
  - `codex_temp/m700` owner/group: `gray2:gray2`
  - mode: `0111` (`d--x--x--x`)
  - timestamp: 2026-04-20
- Related legacy ACL-locked dirs:
  - `codex_temp/probeperm`
  - `codex_temp/service-truth/20260420_174042_727548/basetemp`
- Direct remediation attempts failed on host ACL boundary (all returned access denied):
  - `chmod`, `rm -rf`, `rmdir`, `icacls`, `takeown`
- Mitigation landed for tooling discovery:
  - `pyproject.toml` mypy exclude now skips known generated temp roots (`codex_temp`, `testtmp-*`, `draft-policy-*`, `long-form-*`, `pytest-cache-files-*`, `tmp/pytest*`).
  - `./.venv/bin/python -m mypy --follow-imports=skip .` now runs and reports typing debt (`Found 174 errors in 50 files`) instead of failing with `PermissionError`.
- Execution and ownership aligned with [19]/[20] cleanup planning.

#### Root Cause
Generated temp trees were left with restrictive host-level ACL/mode combinations; one historical pytest basetemp path in `codex_temp/service-truth/.../basetemp` is part of the affected set.

#### Actions
- Investigate ownership/ACLs. (completed)
- Remove or reset these directories. (blocked by host ACL denial; requires elevated/manual host cleanup)
- Ensure test cleanup path is deterministic. (partially completed via pytest temp compat guardrail hardening)

#### Verification
- Partial:
  - blocker reproduced and characterized with owner/mode evidence;
  - preventive shim behavior validated on a fresh `codex_temp/permcheck` run;
  - tooling discovery path is unblocked for mypy via config exclusion;
  - legacy locked directories still require host-level cleanup.

#### Exit Criteria
- No permission-denied generated dirs in repo root.

---

## [31] Backlog doc references stale TODO inventory
- Tier: 5
- Status: PARTIAL
- Priority: Medium
- Owner: Codex / Human
- First Identified: 2026-04-21
- Last Updated: 2026-04-21

#### Description
`docs/idea_backlog.md` claimed `docs/phases/phase_log.md` contained TODO-marked items that should be moved, but the current phase log no longer contains those TODOs.

#### Root Cause
Backlog note drifted after phase-log cleanup.

#### Actions
- Keep this issue for history; governance ownership is tracked under [17].

#### Progress Log
- 2026-04-21 - Codex - Updated `docs/idea_backlog.md` exploratory note to remove stale TODO claim.

#### Verification
- Partial (specific stale claim removed).

#### Exit Criteria
- No stale cross-doc TODO references in active planning docs.

---

## Change Log
- 2026-04-21 - Codex - Verified tracker against current repo state, updated statuses for CI/doc issues, and added new issues [28]-[31].
- 2026-04-21 - Codex - Added explicit top-3 execution plan, recorded doc remediation progress, and moved [1]/[8] into active implementation.
- 2026-04-21 - Codex - Closed local repo-wide Black formatting debt on 10 files; updated [2]/[10]/[19]/[20] with reproducible evidence and conservative status.
- 2026-04-21 - Codex - Updated CI Black lane to repo-wide check, hardened pytest temp-dir permissions guardrail, and mitigated repo-root mypy discovery crashes by excluding generated temp roots.
