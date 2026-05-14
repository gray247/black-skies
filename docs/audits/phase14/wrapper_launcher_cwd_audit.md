Status: Produced
Canonical role: Audit/classification artifact for wrapper, launcher, CWD, environment, and command-normalization risks before broad implementation or `/goals` campaigns.
Scope: Classify wrapper, launcher, working-directory, environment, and command-normalization seams by operational risk, authority-layer impact, execution-surface impact, and recommended ownership/follow-up.
Owns: Wrapper/launcher/CWD risk classification for the audited surfaces; `/goals` readiness guidance for those surfaces; ownership recommendation for any dedicated deferred roadmap item created from this audit.
Does not own: Proof doctrine, phase sequencing, deferred-matrix ID governance beyond any new item explicitly added here, production implementation, test implementation, GUI redesign, or Phase 14A.1 vocabulary semantics.
Upstream dependencies: [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md), [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md), [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md), [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md), [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md), [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md), [stable_environment_confirmation.md](/C:/Dev/black-skies/docs/reviews/stable_environment_confirmation.md), [canonical_authority_and_validation_lanes.md](/C:/Dev/black-skies/docs/reviews/canonical_authority_and_validation_lanes.md), [false_confidence_reduction_plan.md](/C:/Dev/black-skies/docs/reviews/false_confidence_reduction_plan.md)
Downstream dependencies: Future wrapper/CWD follow-up allocation, `/goals` guardrails, `Phase 14B` readiness review, and any later launcher/preflight hardening work.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

# Wrapper / Launcher / CWD Operational Risk Audit

## Purpose

Wrapper, launcher, current-working-directory, and environment seams can distort runtime reality even when the code under test has not changed.

Broad `/goals` campaigns amplify those seams because they increase:

- command variation
- shell variation
- cwd variation
- environment inheritance
- launcher indirection

This audit classifies those risks, assigns likely ownership, and recommends follow-up.

This audit does not modify behavior.

## Evidence Inspected

Governance and planning inputs:

- [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md)
- [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md)
- [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md)
- [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md)
- [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md)
- [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
- [current_state.md](/C:/Dev/black-skies/docs/specs/current_state.md)
- [workflow_spine.md](/C:/Dev/black-skies/docs/specs/workflow_spine.md)
- [error_visibility.md](/C:/Dev/black-skies/docs/specs/error_visibility.md)
- [stable_environment_confirmation.md](/C:/Dev/black-skies/docs/reviews/stable_environment_confirmation.md)
- [canonical_authority_and_validation_lanes.md](/C:/Dev/black-skies/docs/reviews/canonical_authority_and_validation_lanes.md)
- [false_confidence_reduction_plan.md](/C:/Dev/black-skies/docs/reviews/false_confidence_reduction_plan.md)

Source and script surfaces inspected:

- [package.json](/C:/Dev/black-skies/package.json)
- [app/package.json](/C:/Dev/black-skies/app/package.json)
- [dev-runner.mjs](/C:/Dev/black-skies/scripts/dev-runner.mjs)
- [electron-dev.mjs](/C:/Dev/black-skies/scripts/electron-dev.mjs)
- [e2e-with-backend.mjs](/C:/Dev/black-skies/scripts/e2e-with-backend.mjs)
- [truth-with-backend.mjs](/C:/Dev/black-skies/scripts/truth-with-backend.mjs)
- [materialize_e2e_fixture.mjs](/C:/Dev/black-skies/scripts/materialize_e2e_fixture.mjs)
- [check_e2e_fixture_contract.mjs](/C:/Dev/black-skies/scripts/check_e2e_fixture_contract.mjs)
- [test_e2e_launcher_args.mjs](/C:/Dev/black-skies/scripts/test_e2e_launcher_args.mjs)
- [run-dev-backend.ps1](/C:/Dev/black-skies/scripts/run-dev-backend.ps1)
- [smoke.ps1](/C:/Dev/black-skies/scripts/smoke.ps1)
- [smoke.sh](/C:/Dev/black-skies/scripts/smoke.sh)
- [smoke_runner.py](/C:/Dev/black-skies/scripts/smoke_runner.py)
- [run_service_truth.py](/C:/Dev/black-skies/scripts/run_service_truth.py)
- [preload.ts](/C:/Dev/black-skies/app/main/preload.ts)
- [ProjectHome.tsx](/C:/Dev/black-skies/app/renderer/components/ProjectHome.tsx)
- [App.tsx](/C:/Dev/black-skies/app/renderer/App.tsx)
- [eval.yml](/C:/Dev/black-skies/.github/workflows/eval.yml)

Search surfaces inspected:

- repo searches for `cwd`, `process.cwd`, `working directory`, `launcher`, `wrapper`, `playwright`, `electron`, `uvicorn`, `pnpm`, `powershell`, `python`, `spawn`, `exec`, `argv`, `project root`, `repo root`, `PYTHONPATH`, `serviceStubs`, `overrideServices`, `fixture`, `materialize`, and `truth-lane`

Missing or weak evidence:

- This audit is classification-only and does not rerun local launch paths.
- CI job results are documented, but the latest green GitHub state is still not locally repo-provable by this pass alone.

## Risk Model

- `Trusted`
- `Partially trusted`
- `Observed risk`
- `Governance-only`
- `Deferred future`

Authority layers are interpreted from the roadmap authority hierarchy:

- `A1` real filesystem/runtime
- `A2` real backend service
- `A3` canonical persisted records
- `A4` renderer/UI state
- `A5` harness/fixture state
- `A6` synthetic mode
- `A7` mock/stub behavior

## Audit Table

| Surface | Evidence found | Risk class | Authority layers affected | Known or likely distortion | Local impact | CI impact | Playwright impact | Codex `/goals` impact | Existing owner/RDM | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| app launch scripts | [dev-runner.mjs](/C:/Dev/black-skies/scripts/dev-runner.mjs) forces `cwd` to repo root; [electron-dev.mjs](/C:/Dev/black-skies/scripts/electron-dev.mjs) switches Electron `cwd` to `app/` and injects `BLACKSKIES_PYTHON` | Partially trusted | `A1`, `A2`, `A4` | Different launch entrypoints can exercise different roots and Python resolution paths | Medium | Low | Medium | Medium | none direct | Keep explicit root-setting, but treat launch-entry equivalence as unproven until a canonical local recipe exists |
| Electron launch/dev commands | `pnpm dev` delegates to `scripts/dev-runner.mjs`; `electron-dev.mjs` uses `shell: process.platform === 'win32'` and app-root `cwd` | Partially trusted | `A1`, `A4` | Windows shell handling and app-root launch can drift from repo-root assumptions in other commands | Medium | Low | Medium | Medium | none direct | Standardize recommended local launch recipe before broad implementation work |
| Playwright launch/bootstrap | [e2e-with-backend.mjs](/C:/Dev/black-skies/scripts/e2e-with-backend.mjs) still has smoke-vs-full-suite synthesis and selector restrictions; regression guard exists in [test_e2e_launcher_args.mjs](/C:/Dev/black-skies/scripts/test_e2e_launcher_args.mjs) | Observed risk | `A1`, `A5`, `A6` | Launcher may narrow scope by default or prove only smoke coverage when misread | Medium | High | High | High | `RDM-CI-001`, `RDM-RISK-001` | Keep explicit lane separation; do not use default e2e launcher as broad implementation proof |
| Python/service launch commands | [run_service_truth.py](/C:/Dev/black-skies/scripts/run_service_truth.py) uses repo-root `cwd`; [run-dev-backend.ps1](/C:/Dev/black-skies/scripts/run-dev-backend.ps1) sets `PYTHONPATH` and uses a different uvicorn module path; smoke scripts use other service entrypoints | Observed risk | `A1`, `A2`, `A3` | Service bring-up path can vary by shell, module path, and env bootstrap | High | Medium | Medium | High | `RDM-CI-001`, `RDM-RISK-001` | Audit and normalize the canonical service-launch recipe before deeper implementation campaigns |
| wrapper scripts | Dedicated wrappers exist for dev, e2e, truth, smoke, and backend startup; Windows and non-Windows paths differ materially | Observed risk | `A1`, `A2`, `A5`, `A6` | Wrapper logic can hide root/env drift behind a successful launch | High | Medium | High | High | `RDM-RISK-001` | Create a dedicated wrapper/CWD roadmap item and treat wrapper determinism as a governed dependency |
| smoke/contract commands | [smoke.sh](/C:/Dev/black-skies/scripts/smoke.sh) and [smoke.ps1](/C:/Dev/black-skies/scripts/smoke.ps1) set `BLACKSKIES_PROJECT_BASE_DIR` and `PYTHONPATH`; [smoke_runner.py](/C:/Dev/black-skies/scripts/smoke_runner.py) falls back to `Path.cwd() / sample_project` when env is absent | Partially trusted | `A1`, `A2`, `A3`, `A5` | A passing smoke run may depend on hidden cwd or env assumptions | Medium | Medium | Medium | Medium | `RDM-CI-001` | Keep smoke lane non-truth-bearing and document cwd/env preconditions explicitly |
| fixture materialization commands | [materialize_e2e_fixture.mjs](/C:/Dev/black-skies/scripts/materialize_e2e_fixture.mjs) and [check_e2e_fixture_contract.mjs](/C:/Dev/black-skies/scripts/check_e2e_fixture_contract.mjs) resolve from repo root and inspect sample roots | Partially trusted | `A1`, `A3`, `A5`, `A6` | Fixture correctness can be mistaken for runtime correctness | Medium | Medium | High | Medium | `RDM-HARNESS-001` | Keep fixture contract fenced as harness evidence only |
| truth-lane commands | [truth-with-backend.mjs](/C:/Dev/black-skies/scripts/truth-with-backend.mjs) explicitly fixes root/env, forbids arbitrary test selection, and rejects synthetic fallback in the truth lane | Partially trusted | `A1`, `A2`, `A3`, `A5` | Narrow truth path is strong, but it is still one launcher stack with OS-specific wrappers | Low | Medium | High | Medium | `RDM-TRUTH-001` | Preserve as narrow truth proof; do not generalize it to every execution surface |
| project-root resolution | Most audited scripts compute `REPO_ROOT` from `__dirname`/`PSScriptRoot`, but smoke runner still allows cwd fallback | Partially trusted | `A1`, `A3` | Relative resolution can silently pick the wrong sample root when env wiring is absent | Medium | Medium | Medium | High | `RDM-RISK-001` | Prefer explicit root/env injection over cwd fallback in future fixes |
| repo-root resolution | Dev, truth, e2e, and service-truth launchers mostly pin repo root explicitly | Partially trusted | `A1` | Good defensive pattern exists, but it is not universal across all helper surfaces | Low | Low | Medium | Medium | none direct | Keep this pattern; extend it before treating launch determinism as solved |
| relative path usage | Build artifacts, sample project roots, and helper scripts rely on relative joins from root or app root; some helper defaults still assume cwd | Observed risk | `A1`, `A3` | Wrong working directory can redirect reads, writes, or fixture discovery | Medium | Medium | Medium | High | `RDM-RISK-001` | Treat relative-path assumptions as an audit target before broad implementation campaigns |
| PowerShell command assumptions | [run-dev-backend.ps1](/C:/Dev/black-skies/scripts/run-dev-backend.ps1), [smoke.ps1](/C:/Dev/black-skies/scripts/smoke.ps1), and Windows truth launch use PowerShell-specific process and quoting behavior | Observed risk | `A1`, `A2`, `A5` | Windows-only wrappers may behave differently from bash/Node launch paths while still appearing healthy | High | Low | Medium | High | `RDM-RISK-001` | Audit PowerShell command determinism before using broad Windows-heavy `/goals` campaigns |
| CI workflow command assumptions | [eval.yml](/C:/Dev/black-skies/.github/workflows/eval.yml) uses bash, explicit `pnpm --dir app`, explicit Playwright install, fixture prep, and env manifests | Partially trusted | `A1`, `A2`, `A5` | CI is more explicit than local usage, so green CI can hide local wrapper divergence | Medium | Medium | Medium | Medium | `RDM-CI-001` | Keep CI assumptions documented separately from local execution assumptions |
| Codex shell command patterns | Governance now warns against broad implementation `/goals`, but there is no canonical repo-level preflight recipe yet for agent execution | Governance-only | `A1`, `A2`, `A3` | Agents can mix shells, roots, and entrypoints unless explicitly constrained | High | Low | Medium | High | `RDM-RISK-001` | Add a dedicated roadmap item and require explicit root/env guardrails before broad implementation `/goals` |
| `PYTHONPATH` / environment assumptions | `PYTHONPATH`, `BLACKSKIES_PROJECT_BASE_DIR`, `PROJECT_BASE_DIR`, `BLACKSKIES_PYTHON`, and Playwright env toggles are set differently across launchers | Observed risk | `A1`, `A2`, `A3`, `A5`, `A6` | Behavior can shift because environment composition differs even when the command name is similar | High | Medium | High | High | `RDM-RISK-001` | Treat env determinism as a first-class follow-up, not as incidental wrapper trivia |

## Findings

### Confirmed Risks

- `scripts/e2e-with-backend.mjs` still carries smoke-mode behavior that can narrow what a green run proves.
- Service launch is not normalized to one path: dev backend, smoke, truth lane, and CI use materially different entrypoints and env bootstrap.
- PowerShell and non-PowerShell launch behavior are both active, which means quoting, shell, and process-start assumptions are not single-path deterministic.
- `app/main/preload.ts` still exposes Playwright-only helper surfaces such as `setDevProjectPath` and `overrideServices`; those are necessary harness seams, but they are also execution-surface distortion risks if overread.
- `scripts/smoke_runner.py` still contains cwd-based fallback behavior when `BLACKSKIES_PROJECT_BASE_DIR` is absent.

### Likely Risks

- Broad implementation `/goals` work will tend to mix repo-root, app-root, and shell-specific invocation styles unless preflight guardrails are explicit.
- CI command determinism is stronger than local determinism, so CI green can overstate local wrapper health.
- Wrapper behavior is likely to matter more as Phase 14B begins because deeper alignment work will touch backend, preload, renderer, and truth-lane surfaces in one campaign.

### Non-Issues

- The truth lane already contains explicit anti-drift controls:
  - fixed root resolution
  - explicit fixture materialization
  - synthetic fallback disallowed
  - bounded test-selection contract
- Several audited scripts already prefer `REPO_ROOT` over implicit cwd, which is the right direction and should be preserved.

### Unknowns Needing Source or Runtime Verification

- Whether the current local Windows launch stack is deterministic across repeated broad implementation campaigns.
- Whether `run-dev-backend.ps1` still reflects the canonical local backend bring-up path or is now legacy convenience tooling.
- Whether all broad agent-driven command paths can be forced onto a single canonical local recipe without additional wrapper work.

## `/goals` Readiness Impact

Broad `/goals` is not yet safe for implementation-heavy campaigns that depend on wrapper, launcher, cwd, or environment determinism.

Safe now:

- small docs/spec/governance `/goals`
- narrow read-only analysis
- targeted tracker/doc planning passes
- explicitly scoped command verification where cwd and env are stated up front

Unsafe now:

- broad implementation `/goals` spanning backend, preload, renderer, and test lanes
- campaigns that assume local launch behavior is equivalent across PowerShell, bash, CI, and Codex execution
- campaigns that cite smoke/e2e wrapper success as proof of deeper runtime readiness

Required guardrails before broad implementation `/goals`:

- explicit working directory for every command
- explicit shell choice where Windows behavior matters
- explicit `pnpm --dir app` versus repo-root script choice
- explicit Python executable or `.venv` expectation where backend commands run
- explicit statement of whether a command is truth-lane, harness-lane, smoke-only, CI-only, or docs-only
- explicit warning when a command depends on `BLACKSKIES_PROJECT_BASE_DIR`, `PROJECT_BASE_DIR`, `PYTHONPATH`, or Playwright harness env

## RDM Recommendation

Evidence is strong enough to create a dedicated deferred roadmap item.

Recommended item:

- `RDM-WRAPPER-001`
- Title: `Wrapper / launcher / CWD authority and execution determinism`
- Severity: `S1 Closure-critical`
- Ownership: primary matrix owner `Operator workflow`, with cross-surface impact on `CI/GitHub Actions` and `Playwright/harness`
- Future phase: `Phase 16`
- Future pass/slice: `wrapper/launcher/CWD audit and canonical command recipe`

Rationale:

- the risk is cross-cutting and no existing item owns it cleanly
- `RDM-CI-001` is too narrow because this is not just workflow-trigger drift
- `RDM-RISK-001` owns the sweep itself, not the concrete wrapper/CWD follow-up

## Impact on Phase 14A.1 and 14B

### Phase 14A.1

Wrapper/launcher/CWD does not block `Phase 14A.1`.

`14A.1` remains a vocabulary/evidence-contract planning slice and can proceed without runtime behavior changes.

### Phase 14B

Wrapper/launcher/CWD materially constrains `Phase 14B`.

It should be audited and then either:

- fixed before broad implementation `/goals`, or
- explicitly accepted as scoped execution risk with command guardrails

Current recommendation:

- do not treat broad implementation `/goals` as ready before wrapper/CWD follow-up
- do not let `14B` assume launcher determinism that has not been normalized

## Open Questions for Operator

- Should wrapper/CWD become a required preflight before implementation `/goals`?
- Should Codex prompts standardize shell command patterns for this repo?
- Should there be a canonical local command recipe before `Phase 14B`?
- Should CI command assumptions be separately audited after this?
- Do you want `RDM-WRAPPER-001` to stay under `Phase 16`, or do you want it treated as explicit pre-`14B` support work inside the next planning pass?
