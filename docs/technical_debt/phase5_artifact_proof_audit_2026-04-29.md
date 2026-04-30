# Phase 5C - CI Artifact/Proof Hardening Audit (2026-04-29)

## Scope
- `.github/workflows/eval.yml`
- `.github/workflows/security.yml`
- `build/ci_proof` conventions
- prior hardening notes in `docs/technical_debt/phase5_hardening_plan_2026-04-28.md`

## Local Convention Check
- local proof convention root exists: `build/ci_proof/`
- local sample file present: `build/ci_proof/gauntlet_ci_proof_local.json`
- CI convention aligns to:
  - `build/ci_proof/pass{3,4,5,6}/summary.json`
  - `build/ci_proof/gauntlet_ci_proof.json`
  - pass4 truth receipts under `build/truth_receipts/*`

## Artifact Inventory
| Artifact name | Producer job | Consumer job | Upload condition | Expected files | Failure behavior today |
|---|---|---|---|---|---|
| `playwright-artifacts` | `app-tests` | Human/debug only | `if: always()` | diagnostics dir + playwright report/results | `if-no-files-found: ignore`; missing artifact can be easy to misread without log review |
| `gauntlet-pass3-proof` | `gauntlet-pass3-proof` | `gauntlet-proof-manifest` | `if: always()` | `build/ci_proof/pass3/summary.json` | summary now written under `if: always()` with explicit status |
| `gauntlet-pass4-proof` | `app-truth-lane` | `gauntlet-proof-manifest` | `if: always()` | pass4 summary + truth receipts | summary now written under `if: always()` with explicit status |
| `gauntlet-pass5-proof` | `gauntlet-pass5-proof` | `gauntlet-proof-manifest` | `if: always()` | `build/ci_proof/pass5/summary.json` | explicit status already derived from `job.status` |
| `gauntlet-pass6-proof` | `gauntlet-pass6-proof` | `gauntlet-proof-manifest` | `if: always()` | `build/ci_proof/pass6/summary.json` | summary now written under `if: always()` with explicit status |
| `gauntlet-ci-proof-manifest` | `gauntlet-proof-manifest` | Human/downstream audit | unconditional in job | global manifest + pass summaries + pass4 receipts | robust: downloads use `continue-on-error`, then missing placeholders are materialized |
| `load-ledger` | `eval` | Human/SLO evidence | `if: always()` | `sample_project/_runtime/runs` | if load failed early, artifact may exist but content quality varies |
| `eval-report` | `eval` | Human/eval audit | `if: always()` | `out/eval.html`, `out/eval.json` | `if-no-files-found: ignore` can suppress a hard signal when output is absent |
| `pip-audit-report-${os}` | `pip-audit` matrix | Security summary script | `if: always()` | `pip-audit-report.json` | guarded by fallback JSON error file |
| `safety-report-${os}` | `pip-audit` matrix | Security summary script | `if: always()` | `safety-report.json` | guarded by fallback JSON error file |
| `pnpm-audit-report-${os}` | `pip-audit` matrix | Security summary script | `if: always()` | `pnpm-audit-report.json` | guarded by fallback JSON error file |
| `load-ledger-${os}` | `pip-audit` matrix | Human/security audit | `if: always()` | `load-ledger.json` | guarded by fallback error JSON if ledger is missing |
| `dependency-report-${os}` | `pip-audit` matrix | Human/security audit | `if: always()` | `dependency-report.json` | guarded by fallback error JSON if generation fails |

## Naming/Handshake Check
- pass proof upload names and manifest download names match:
  - `gauntlet-pass3-proof`, `gauntlet-pass4-proof`, `gauntlet-pass5-proof`, `gauntlet-pass6-proof`
- manifest upload name matches expected:
  - `gauntlet-ci-proof-manifest`
- security matrix artifact names are consistent with `${{ matrix.os }}` suffix conventions and existing consumers.

## Missing-Artifact Classification Check
- `gauntlet-proof-manifest` already classifies missing pass artifacts clearly:
  - download steps use `continue-on-error: true`
  - placeholder summaries include:
    - `status: "missing_artifact"`
    - `artifact`
    - `upstream_result`
    - `reason`

## Tiny Fixes Applied In Phase 5C-2
1. PASS 3/4/6 proof summary generation now mirrors PASS 5.
- `Write PASS 3 proof summary`, `Write PASS 4 proof summary`, `Write PASS 6 proof summary` changed to `if: always()`.
- each step now derives status from `job.status` (`success`, `failure`, `cancelled`) and writes summary deterministically.
- artifact names, dependencies, retention, and test commands are unchanged.

## Remaining Gaps
1. `playwright-artifacts` and `eval-report` still use `if-no-files-found: ignore`.
- impact: avoids noise, but can hide absent-output cases unless logs are reviewed.

2. No dedicated artifact-contract summary step exists yet.
- impact: final artifact completeness still requires multi-job manual inspection.

## Safe Deferred Fixes
1. Add lightweight marker files for ignored uploads.
- when files are absent by design or upstream failure, emit a tiny JSON marker with reason.

2. Add a final artifact-contract summary artifact.
- generate a single machine-readable produced/missing summary for all key artifacts.

## Phase 5C Recommendation
- Phase 5C implementation was partially completed by this tiny pass.
- Phase 5D final validation is appropriate next to verify clearer classification behavior on real red/green workflow runs.

## Phase 5D Validation Follow-Up
- validated against latest green CI pair on commit `c8d42bae16e2a35805a69fba0353a9f8fc35b717`:
  - eval run `25137899738` (`success`)
  - security run `25137899691` (`success`)
- confirmed PASS summary production path is active on success for hardened lanes:
  - PASS 3 summary step executed and uploaded artifact `gauntlet-pass3-proof`
  - PASS 4 summary step executed and uploaded artifact `gauntlet-pass4-proof`
  - PASS 6 summary step executed and uploaded artifact `gauntlet-pass6-proof`
- confirmed proof-manifest consumer handshake remains clean:
  - manifest job downloaded PASS 3/4/5/6 artifacts successfully
  - no artifact naming mismatch observed
  - `gauntlet-ci-proof-manifest` uploaded successfully
