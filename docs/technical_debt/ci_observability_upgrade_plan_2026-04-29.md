# CI Observability Upgrade Plan - 2026-04-29

## Scope
- planning only for `.github/workflows/eval.yml` and `.github/workflows/security.yml`
- no runtime/app/test/dependency changes
- objective: make red runs classify quickly and consistently without changing job semantics

## Current Baseline
- proof artifacts and pass summaries are largely stable after Phase 5C-2.
- remaining observability gap:
  - some uploads still use `if-no-files-found: ignore` without explicit absence markers.
  - warning signals are present in logs but not summarized in a single machine-readable report.
  - run/commit metadata is distributed across logs/artifacts rather than a single per-run contract.
- references:
  - `docs/technical_debt/deferred_risk_register_2026-04-29.md` (P1 CI artifact observability debt)
  - `docs/technical_debt/phase5_artifact_proof_audit_2026-04-29.md`
  - `docs/technical_debt/stabilization_closure_2026-04-29.md`

## Proposed Observability Upgrades

### 1) CI run summary
- add a lightweight `ci-run-summary.json` artifact in both workflows.
- include:
  - workflow name, run id, run number, run attempt
  - commit SHA, ref, event name
  - branch/head SHA (PR context where present)
  - UTC timestamp
  - top-level classification status (`success`, `failure`, `cancelled`)

### 2) Artifact completeness report
- add `ci-artifact-completeness.json` per workflow.
- fields:
  - expected artifact list
  - produced/missing/empty flags
  - missing reason category (`upstream_failed`, `not_produced`, `ignored_no_files`, `download_error`)
- eval expected:
  - `gauntlet-pass3-proof`, `gauntlet-pass4-proof`, `gauntlet-pass5-proof`, `gauntlet-pass6-proof`, `gauntlet-ci-proof-manifest`, `playwright-artifacts`, `eval-report`, `load-ledger`
- security expected:
  - `pip-audit-report-*`, `safety-report-*`, `pnpm-audit-report-*`, `load-ledger-*`, `dependency-report-*`

### 3) Failure classification report
- add `ci-failure-classification.json` with one primary class and optional secondary classes:
  - `setup_tooling`
  - `dependency_audit`
  - `test_assertion`
  - `infra_port_process`
  - `artifact_missing`
- source signals:
  - step conclusions + known sentinel strings from existing logs/artifacts
  - upstream job result context where artifacts are absent

### 4) Explicit warning summary
- add `ci-warning-summary.json` keyed to known warning families:
  - `NO_COLOR_FORCE_COLOR`
  - `DOCK_LAYOUT_COMPAT`
  - `ESLINTRC_DEPRECATION`
  - `NODE_ACTION_RUNTIME`
- include:
  - `detected` boolean
  - first-seen step
  - sample line hash/text fragment (short)
  - classification (`known_deferred`, `actionable`, `historical_pre_upgrade`)

### 5) Commit/branch/workflow SHA reporting
- ensure every summary artifact includes:
  - `GITHUB_SHA`, `GITHUB_REF`, `GITHUB_WORKFLOW`, `GITHUB_RUN_ID`, `GITHUB_RUN_ATTEMPT`
  - for PRs: `GITHUB_HEAD_REF` and `pull_request.head.sha` when available

### 6) Stale-run / wrong-SHA detection
- add `ci-sha-consistency.json`:
  - compare expected workflow SHA context to reported context in summary artifacts
  - emit `stale_run_suspected=true` when mismatch pattern is detected (for example, evidence review referencing older run against newer workflow-pin claim)
- this is diagnostic-only, non-blocking.

## Proposed Artifacts
- `ci-run-summary`
- `ci-artifact-completeness`
- `ci-failure-classification`
- `ci-warning-summary`
- `ci-sha-consistency`

All JSON artifacts should be uploaded with `if: always()` and stable names/paths.

## Proposed Workflow Steps (No Behavior Change Intent)
1. Add final `if: always()` summary generation step in `eval.yml` and `security.yml`.
2. Read existing job outputs/artifact directories and synthesize the five JSON summaries.
3. Upload summary artifacts with `actions/upload-artifact` using stable names.
4. Keep steps non-blocking (`exit 0`) for first rollout to avoid new false-red risk.

## Risk Level
- overall: low to medium
- low:
  - additive JSON summaries and uploads only
- medium:
  - incorrect parsing heuristics could misclassify warnings/failure classes
  - artifact checks must avoid introducing hard failures in first pass

## Validation Commands
- local/static:
  - `git diff -- .github/workflows`
  - YAML parse check for modified workflows
- CI validation:
  - trigger one `eval.yml` + one `security.yml` run on upgrade commit
  - verify new summary artifacts upload on both green and controlled-failure scenarios
  - verify no change in existing job pass/fail semantics

## Rollback Plan
- revert only added summary-generation/upload steps.
- keep current proof artifact flow untouched.
- rerun eval/security once to confirm baseline behavior restoration.

## Smallest First Implementation Batch
- Batch 1 (safest):
  - implement `ci-run-summary.json` + `ci-sha-consistency.json` only
  - upload as `if: always()` non-blocking artifacts
  - no parsing of warning text yet
- rationale:
  - highest value for stale/wrong-SHA confusion with smallest logic surface

## Follow-on Batches
- Batch 2:
  - add `ci-artifact-completeness.json` with explicit `ignored_no_files` handling
- Batch 3:
  - add `ci-failure-classification.json`
- Batch 4:
  - add `ci-warning-summary.json` with known warning taxonomy and historical/pre-upgrade tagging

## Recommendation
- proceed with Batch 1 first, then inspect one green and one intentionally failing run before enabling Batch 2+ classification logic.

## Batch 1 Implementation Note (2026-04-29)
- status:
  - implemented in workflow files:
    - `.github/workflows/eval.yml`
    - `.github/workflows/security.yml`
- additive behavior:
  - added a final `ci-observability` job per workflow with `if: always()`
  - no app/runtime/test/dependency changes
  - no existing artifact names changed
- artifacts produced:
  - `ci-run-summary.json`
  - `ci-sha-consistency.json`
- uploaded artifact name:
  - `ci-observability-${{ github.job }}`
- metadata captured:
  - workflow, run id, run number, event, ref, `github.sha`, actor, `job.status`
  - `actual_sha` from `git rev-parse HEAD`
  - `sha_match` boolean (`actual_sha == github.sha`)
- safety:
  - upload steps use `if: always()` and `if-no-files-found: ignore`
  - summary generation is non-gating observability only
