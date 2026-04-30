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

## Batch 1 Validation Evidence (2026-04-29)
- runs inspected:
  - eval: `25139874808` (`Validation & Eval Harness`)
  - security: `25139874820` (`Security Audit`)
  - both on commit `08b69c6d96654b6a80f6ad109a97c8731f27d838`
- workflow status:
  - eval: `success`
  - security: `success`
- observability job status:
  - eval `CI Observability Summary`: `success`
  - security `CI Observability Summary`: `success`
- artifact presence:
  - `ci-observability-ci-observability` present in both runs
  - contains:
    - `ci-run-summary.json`
    - `ci-sha-consistency.json`
- SHA consistency check:
  - eval: `github_sha == actual_sha`, `sha_match=true`
  - security: `github_sha == actual_sha`, `sha_match=true`
- metadata sanity:
  - workflow names, run IDs, event (`push`), ref (`refs/heads/phase-b2-memory-lab`), actor, and job status are correct in both files

## Batch 1 Validation Notes
- naming caveat:
  - artifact name `ci-observability-${{ github.job }}` resolves to `ci-observability-ci-observability` in both workflows.
  - this is valid and non-conflicting per-run, but can be visually ambiguous when comparing across workflows.
- recommendation:
  - keep Batch 1 closed as successful.
  - for Batch 2, optionally improve readability with workflow-scoped names (for example include `${{ github.workflow }}` or `${{ github.run_id }}`) while preserving additive semantics.

## Batch 2 Planning (Artifact Completeness) - 2026-04-29

### Objective
- add machine-readable artifact completeness reporting without changing existing workflow behavior.
- keep implementation additive and non-gating.

### Planned Report
- file: `ci-artifact-completeness.json`
- one report per workflow run, generated by each workflow's `ci-observability` job.

### Planned Classification Values
- `present`
- `missing_expected`
- `ignored_no_files`
- `skipped_due_upstream_failure`

### Proposed JSON Shape
```json
{
  "schema_version": 1,
  "workflow": "Validation & Eval Harness",
  "run_id": "25139874808",
  "run_number": "294",
  "event": "push",
  "ref": "refs/heads/phase-b2-memory-lab",
  "github_sha": "<sha>",
  "job_status": "success",
  "generated_at_utc": "2026-04-29T23:54:27Z",
  "artifacts": [
    {
      "group": "gauntlet_pass_proof",
      "name": "gauntlet-pass3-proof",
      "classification": "present",
      "producer_job": "gauntlet-pass3-proof",
      "notes": ""
    }
  ],
  "counts": {
    "present": 0,
    "missing_expected": 0,
    "ignored_no_files": 0,
    "skipped_due_upstream_failure": 0
  }
}
```

### Artifact Groups To Report
- `gauntlet_pass_proof`:
  - `gauntlet-pass3-proof`
  - `gauntlet-pass4-proof`
  - `gauntlet-pass5-proof`
  - `gauntlet-pass6-proof`
- `gauntlet_manifest`:
  - `gauntlet-ci-proof-manifest`
- `playwright_artifacts`:
  - `playwright-artifacts`
- `eval_report`:
  - `eval-report`
- `load_ledger`:
  - eval: `load-ledger`
  - security: `load-ledger-${os}` (matrix scope recorded in notes)
- `dependency_security_reports`:
  - `pip-audit-report-${os}`
  - `safety-report-${os}`
  - `pnpm-audit-report-${os}`
  - `dependency-report-${os}`

### Where Produced
- `eval.yml`:
  - extend current `ci-observability` job to synthesize `ci-artifact-completeness.json` after existing summary files.
- `security.yml`:
  - extend current `ci-observability` job similarly.

### Classification Rules (Batch 2)
- `present`:
  - artifact is expected and upload evidence/file presence is confirmed.
- `missing_expected`:
  - artifact expected, no ignore-mode path, and no upstream-failure exemption applies.
- `ignored_no_files`:
  - artifact step is configured with `if-no-files-found: ignore` and produced no files.
- `skipped_due_upstream_failure`:
  - artifact absent because producer job was not successful or was cancelled (derived from `needs.<job>.result` where available).

### Optional Artifact Name Readability Improvement
- current:
  - `ci-observability-${{ github.job }}` (valid, but cross-workflow label ambiguity).
- recommended optional adjustment in Batch 2:
  - `ci-observability-${{ github.workflow }}-${{ github.job }}`
  - keeps additive semantics and improves triage readability.
- defer if strict stability preference is higher than readability.

### Smallest Safe Implementation Batch
- Batch 2A:
  - add `ci-artifact-completeness.json` generation only in existing `ci-observability` jobs.
  - keep existing observability artifact name unchanged.
  - upload report in the same observability artifact bundle.
- Batch 2B (optional):
  - apply workflow-scoped observability artifact naming for readability.

### Risk Level
- low to medium
- low:
  - additive report generation only.
- medium:
  - misclassification risk if upstream-failure inference is too broad.
  - matrix artifacts in `security.yml` require careful per-OS classification notes.

### Validation Steps (When Implementing Batch 2)
- local/static:
  - YAML parse check for both workflow files.
  - `git diff -- .github/workflows/eval.yml .github/workflows/security.yml`
- CI:
  - verify `ci-artifact-completeness.json` exists in both workflows.
  - validate all classifications are one of the four enums.
  - verify no existing job conclusions change versus pre-Batch-2 behavior.
- controlled-failure check:
  - validate at least one case of `ignored_no_files` or `skipped_due_upstream_failure` is correctly represented.

### Rollback Plan
- revert only Batch 2 report-generation/upload additions.
- keep Batch 1 `ci-run-summary.json` and `ci-sha-consistency.json` intact.
- rerun eval/security to confirm baseline observability still works.

## Batch 2A Implementation Note (2026-04-29)
- status:
  - implemented in:
    - `.github/workflows/eval.yml`
    - `.github/workflows/security.yml`
- added output:
  - `ci-artifact-completeness.json` in existing `ci-observability` jobs
- upload behavior:
  - unchanged artifact name: `ci-observability-${{ github.job }}`
  - upload remains `if: always()` + `if-no-files-found: ignore`
- classification used:
  - `present`
  - `missing_expected`
  - `ignored_no_files`
  - `skipped_due_upstream_failure`
- current inference model:
  - completeness is inferred from upstream producer job results (`needs.<job>.result`) to keep the pass additive and non-gating.
  - no hard-fail checks were introduced.

## Batch 3 Planning (Failure Classification) - 2026-04-30

### Objective
- add deterministic, non-blocking `ci-failure-classification.json` in the existing `ci-observability` jobs.
- classify failures using stable workflow/job signals first, without brittle log parsing.

### Planned Report
- file: `ci-failure-classification.json`
- generated once per workflow run.

### Proposed JSON Shape
```json
{
  "schema_version": 1,
  "workflow": "Validation & Eval Harness",
  "run_id": "25141347200",
  "run_number": "295",
  "event": "push",
  "ref": "refs/heads/phase-b2-memory-lab",
  "github_sha": "<sha>",
  "job_status": "success",
  "primary_class": "no_failure",
  "secondary_classes": [],
  "source_signals": [
    "all_needs_success"
  ],
  "upstream_results": {
    "app-e2e": "success",
    "gauntlet-pass3-proof": "success"
  },
  "confidence": "high",
  "notes": "Classification based on needs/job result inference only."
}
```

### Class Set
- `setup_tooling`
- `dependency_audit`
- `test_assertion`
- `infra_port_process`
- `artifact_missing`
- `unknown_success`
- `no_failure`

### Design Rules (Batch 3A)
- use `job.status` + `needs.<job>.result` + existing completeness report signals first.
- no new hard-fail behavior.
- avoid step-log text parsing in first implementation.
- green runs:
  - classify as `no_failure`.
- `artifact_missing`:
  - only classify when completeness indicates missing artifact(s) while the mapped producer job result is `success`.
- `setup_tooling`:
  - classify when infra/setup-style jobs fail (for example checkout/setup/cache/dependency install gate jobs), based on known producer-job failure surfaces.
  - keep note that detailed cause granularity (e.g., pnpm/action conflict) remains best-effort without logs.

### Initial Mapping Heuristics (No Log Parsing)

Eval workflow:
- if all `needs` are `success` and current job `success`:
  - `primary_class=no_failure`
- else if any completeness entry is `missing_expected` with producer result `success`:
  - `primary_class=artifact_missing`
- else if failing need in `{lint, typecheck, docs-lint, app-tests}`:
  - `primary_class=setup_tooling`
- else if failing need in `{app-e2e}`:
  - `primary_class=infra_port_process` (harness/launcher/runtime surface)
- else if failing need in `{app-truth-lane, gauntlet-pass3-proof, gauntlet-pass5-proof, gauntlet-pass6-proof, eval}`:
  - `primary_class=test_assertion`
- else:
  - `primary_class=unknown_success` when run status is success but signals conflict
  - otherwise fallback to `setup_tooling` for non-success runs with no stronger mapping

Security workflow:
- if all `needs` are `success` and current job `success`:
  - `primary_class=no_failure`
- else if any completeness entry is `missing_expected` with producer result `success`:
  - `primary_class=artifact_missing`
- else if failing need is `pip-audit`:
  - `primary_class=dependency_audit`
- else if failing need is `hygiene`:
  - `primary_class=setup_tooling`
- else:
  - `primary_class=unknown_success` when run status is success but signals conflict
  - otherwise fallback to `setup_tooling`

### Secondary Classes
- add `secondary_classes` when multiple independent failing surfaces are present.
- keep deterministic ordering:
  1. `artifact_missing`
  2. `dependency_audit`
  3. `setup_tooling`
  4. `infra_port_process`
  5. `test_assertion`
  6. `unknown_success`

### Confidence Rules
- `high`:
  - all classification decisions derived from direct `needs`/completeness consistency.
- `medium`:
  - fallback mapping used due to partial signal ambiguity.
- `low`:
  - contradictory signals (for example success run with multiple missing-expected artifacts and no clear producer correlation).

### Smallest Safe Implementation Batch
- Batch 3A:
  - add `ci-failure-classification.json` generation only.
  - derive from existing `needs` env + completeness report.
  - upload in existing `ci-observability-${{ github.job }}` artifact bundle.
  - no naming changes, no dependency changes, no job graph changes.

### Risk Level
- low to medium
- low:
  - additive JSON only, no gate semantics changes.
- medium:
  - class ambiguity without log parsing can mislabel edge-cases (`setup_tooling` vs `infra_port_process`).
  - explicit caveat recorded via `confidence` and `notes`.

### Validation Steps (When Implementing Batch 3A)
- local/static:
  - YAML parse check.
  - `git diff -- .github/workflows/eval.yml .github/workflows/security.yml`
- CI:
  - confirm `ci-failure-classification.json` exists in both workflows.
  - verify green runs classify `no_failure`.
  - verify class value is in allowed enum set.
  - verify `upstream_results` mirrors `needs` values used by classifier.
- controlled-failure validation:
  - induce one security dependency gate failure and verify `dependency_audit`.
  - induce one harness/setup-style failure and verify mapped non-`no_failure` class.

### Rollback Plan
- revert only Batch 3 classification generation/upload changes.
- keep Batch 1 and Batch 2A outputs (`ci-run-summary.json`, `ci-sha-consistency.json`, `ci-artifact-completeness.json`) intact.
- rerun eval/security to confirm observability baseline behavior.

## Batch 3A Implementation Note (2026-04-30)
- status:
  - implemented in:
    - `.github/workflows/eval.yml`
    - `.github/workflows/security.yml`
- added output:
  - `ci-failure-classification.json` in existing `ci-observability` jobs
- upload behavior:
  - unchanged artifact name: `ci-observability-${{ github.job }}`
  - upload remains `if: always()` + `if-no-files-found: ignore`
- implementation approach:
  - uses `job.status` + `needs.<job>.result` + in-job completeness data
  - no brittle log parsing
  - additive/non-blocking only
- green-run behavior:
  - `primary_class=no_failure`
