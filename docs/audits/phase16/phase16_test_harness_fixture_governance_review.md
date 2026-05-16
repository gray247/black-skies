Canonical role: Planning-first Phase 16 governance review that classifies the harness, fixture, truth-lane, teardown, wrapper/CWD, and CI trigger surfaces by what they prove and what they do not prove.
Scope: Review-only plus narrow contract clarification for fixture governance. No product/runtime feature work, no GUI cleanup, no hygiene cleanup, and no backup/restore implementation belongs here.
Owns: `16.1` fixture authority contract, `16.2` alias fixture policy, `16.3` synthetic-mode scope documentation, `16.4` negative-toast guard preservation, `16.5` Playwright teardown governance, `16.6` truth-lane scope matrix, `16.7` CI workflow trigger documentation, and `16.8` what-each-lane-proves matrix.
Does not own: Phase 17 GUI simplification, Phase 19 hygiene/repository cleanup, preload/runtime reconciliation, backup/restore runtime logic, or broad `/goals` confidence.
Upstream dependencies: [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [phase13_handoff_pass3_future_roadmap_and_phase_allocation.md](/C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md), [cross_system_operational_risk_sweep.md](/C:/Dev/black-skies/docs/audits/phase14/cross_system_operational_risk_sweep.md), [wrapper_launcher_cwd_audit.md](/C:/Dev/black-skies/docs/audits/phase14/wrapper_launcher_cwd_audit.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md)
Downstream dependencies: any later bounded harness slice, any future wrapper/CWD hardening, and any future truth-lane or CI governance refinement.
Last reviewed: 2026-05-16.
Acceptance record: No operator acceptance recorded yet.

# Phase 16 Test Harness / Fixture Governance Review

## 1. Purpose

Phase 16 exists to prevent fake-green harness drift.

The required stance is narrow:

- harness evidence is harness evidence
- synthetic success is synthetic success
- fixture success is fixture success
- truth-lane success is truth-lane success

None of those lanes, alone or combined, should be restated as broad runtime, GUI, restore, continuity, or operator proof.

## 2. Review Outcome

Current source already contains most of the underlying mechanics the roadmap expected:

- fixture materialization and fixture-contract verification are explicit
- harness and truth lanes use different synthetic-mode settings
- the Playwright Electron fixture fails closed on unexpected runtime errors and has bounded teardown escalation
- CI already labels the Playwright lane `HARNESS_ONLY`

The main remaining gap was governance visibility, not missing machinery. Proof boundaries were distributed across tracker notes, code comments, launcher flags, and workflow job names rather than captured in one explicit Phase 16 artifact.

This review therefore keeps runtime behavior unchanged and clarifies the contract in two places:

- this audit records the lane-by-lane evidence map
- [check_e2e_fixture_contract.mjs](/C:/Dev/black-skies/scripts/check_e2e_fixture_contract.mjs) now fails if the required harness/truth aliases drift apart and prints explicit non-claims for the fixture lane

## 3. Surface Inventory

Reviewed surfaces:

- [e2e-with-backend.mjs](/C:/Dev/black-skies/scripts/e2e-with-backend.mjs)
- [truth-with-backend.mjs](/C:/Dev/black-skies/scripts/truth-with-backend.mjs)
- [materialize_e2e_fixture.mjs](/C:/Dev/black-skies/scripts/materialize_e2e_fixture.mjs)
- [check_e2e_fixture_contract.mjs](/C:/Dev/black-skies/scripts/check_e2e_fixture_contract.mjs)
- [_bootstrap.ts](/C:/Dev/black-skies/app/tests/e2e/_bootstrap.ts)
- [_electron.fixture.ts](/C:/Dev/black-skies/app/tests/e2e/_electron.fixture.ts)
- [serviceStubs.ts](/C:/Dev/black-skies/app/tests/e2e/utils/serviceStubs.ts)
- [playwright.config.ts](/C:/Dev/black-skies/app/playwright.config.ts)
- [eval.yml](/C:/Dev/black-skies/.github/workflows/eval.yml)

## 4. Slice Findings

### 16.1 Fixture authority contract

Current contract status:

- [materialize_e2e_fixture.mjs](/C:/Dev/black-skies/scripts/materialize_e2e_fixture.mjs) writes synthetic project roots, drafts, snapshot directories, and `last_verification.json`
- [check_e2e_fixture_contract.mjs](/C:/Dev/black-skies/scripts/check_e2e_fixture_contract.mjs) verifies outline shape, snapshot shape, and optional analytics endpoint health

Phase 16 clarification:

- fixture materialization proves only that the expected synthetic fixture witness exists and is internally coherent
- it does not prove live runtime truth, GUI correctness, or real-project filesystem semantics

Contract hardening added in this pass:

- harness and truth alias roots are now required to agree on `project_id`
- harness and truth alias roots are now required to agree on `outline_id`
- harness and truth alias roots are now required to agree on `scene_count`
- harness and truth alias roots are now required to agree on the required snapshot directories/files

### 16.2 Alias fixture policy

Observed policy in current code:

- harness analytics root uses `sample_project/proj_esther_estate`
- truth-lane root and several renderer-facing reads use `sample_project/Esther_Estate`
- shared stub verification report paths deliberately mirror both aliases

Phase 16 boundary:

- alias mirroring in the harness exists to keep test roots coherent
- alias mirroring does not resolve the broader operator-facing alias debt
- UI alias/folder cleanup remains deferred outside this phase

### 16.3 Synthetic-mode scope documentation

Observed contract:

- [e2e-with-backend.mjs](/C:/Dev/black-skies/scripts/e2e-with-backend.mjs) forces `BLACKSKIES_E2E_SYNTHETIC_MODE=1`, `BLACKSKIES_E2E_EXTERNAL_SERVICE=1`, and `BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW=1`
- [truth-with-backend.mjs](/C:/Dev/black-skies/scripts/truth-with-backend.mjs) forces `BLACKSKIES_E2E_SYNTHETIC_MODE=0` and `BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW=0`
- service-side tests already describe synthetic mode as a bypass with authority limits

Phase 16 boundary:

- synthetic mode may prove launcher wiring, page-flow timing, and selected harness contracts
- synthetic mode does not prove real backend behavior, restore semantics, or real filesystem durability

### 16.4 Negative-toast guard preservation

Observed contract:

- [_electron.fixture.ts](/C:/Dev/black-skies/app/tests/e2e/_electron.fixture.ts) keeps `FAIL_ON_RUNTIME_ERRORS = true`
- the runtime-error allowlist is intentionally empty
- unexpected renderer console/page errors are attached as diagnostics and fail the test

Phase 16 boundary:

- this is a fail-closed harness guard
- it reduces false-green risk
- it still does not convert harness success into full runtime proof

### 16.5 Playwright teardown governance

Observed contract:

- page cleanup is bounded per step
- runtime diagnostics are attached before teardown finishes
- Electron close waits for real process exit and escalates to `SIGKILL` when needed
- stub-server shutdown closes idle connections and destroys lingering sockets on timeout

Phase 16 boundary:

- clean teardown proves the worker did not hang in known teardown paths
- it does not prove the product is free of runtime lifecycle bugs outside the harness envelope

### 16.6 Truth-lane scope matrix

Observed contract:

- the truth lane rejects test-selection arguments and fixes the scenario
- synthetic fallback is explicitly forbidden during real scene-button selection
- receipt enforcement checks route/origin rules against the audited-chain contract

Phase 16 boundary:

- truth lane is authoritative for its narrow receipt-backed claims
- truth lane is not a substitute for broad GUI coverage, continuity proof, restore proof, or human verification

### 16.7 CI workflow trigger documentation

Observed contract in [eval.yml](/C:/Dev/black-skies/.github/workflows/eval.yml):

- triggers are `push`, `pull_request`, and `workflow_dispatch`
- there are no path filters
- the Playwright lane is explicitly named `HARNESS_ONLY App Smoke (Playwright)`
- the workflow materializes and checks fixtures in multiple jobs before harness/truth runs

Phase 16 boundary:

- current CI runs are broad by event type, not narrowed by changed-path intent
- docs-only or tracker-only edits still trigger the workflow today unless run manually elsewhere
- a green CI run therefore proves the configured workflow jobs passed; it does not prove that the workflow selected a semantically exhaustive lane set

### 16.8 What-each-lane-proves matrix

The key governance conclusion is below.

## 5. What Each Lane Proves

| Lane | Primary surfaces | What it proves | What it does not prove |
| --- | --- | --- | --- |
| Fixture materialization | [materialize_e2e_fixture.mjs](/C:/Dev/black-skies/scripts/materialize_e2e_fixture.mjs), [check_e2e_fixture_contract.mjs](/C:/Dev/black-skies/scripts/check_e2e_fixture_contract.mjs) | Synthetic fixture roots exist and match the expected alias/outline/snapshot contract | Live runtime truth, GUI authority, restore semantics, or real-project continuity |
| HARNESS_ONLY Playwright smoke/full suite | [e2e-with-backend.mjs](/C:/Dev/black-skies/scripts/e2e-with-backend.mjs), [_bootstrap.ts](/C:/Dev/black-skies/app/tests/e2e/_bootstrap.ts), [_electron.fixture.ts](/C:/Dev/black-skies/app/tests/e2e/_electron.fixture.ts), [serviceStubs.ts](/C:/Dev/black-skies/app/tests/e2e/utils/serviceStubs.ts), [playwright.config.ts](/C:/Dev/black-skies/app/playwright.config.ts) | Packaged Electron build can launch under the harness, selected UI contracts hold, runtime errors fail closed, and teardown completes within the harness limits | Real backend/provider behavior, truth-lane provenance, operator-level backup/restore confidence, or broad runtime closure |
| Truth lane | [truth-with-backend.mjs](/C:/Dev/black-skies/scripts/truth-with-backend.mjs) | Narrow receipt-backed route/provenance/artifact claims under the fixed truth scenario with synthetic bypasses disabled | Exhaustive GUI behavior, all project states, restore/continuity correctness, or complete runtime trust |
| Playwright teardown | [_electron.fixture.ts](/C:/Dev/black-skies/app/tests/e2e/_electron.fixture.ts), [serviceStubs.ts](/C:/Dev/black-skies/app/tests/e2e/utils/serviceStubs.ts) | Known worker hang classes are bounded and escalated deterministically | That all lifecycle/resource bugs are eliminated outside harness-managed shutdown |
| CI workflow | [eval.yml](/C:/Dev/black-skies/.github/workflows/eval.yml) | The configured jobs and gates passed for the triggering event | That CI selected every lane needed for a closure-grade claim, or that docs-only changes are semantically exempt today |

## 6. Wrapper / Launcher / CWD Constraint

Phase 16 must keep wrapper/launcher/CWD determinism visible because broad confidence still depends on it.

Observed facts:

- the E2E launcher spawns fixture and backend steps with `cwd: REPO_ROOT`
- the E2E launcher runs Playwright from the `app` directory
- the truth lane also launches helper steps from `REPO_ROOT`
- [playwright.config.ts](/C:/Dev/black-skies/app/playwright.config.ts) derives `reportRoot` from `PLAYWRIGHT_OUTPUT_DIR ?? process.cwd()`

Governance interpretation:

- current scripts are better than ambient-shell-only behavior because major launch points set `cwd` explicitly
- broad proof is still constrained because output/report locations and some surrounding operator workflows remain sensitive to launcher context and environment choice
- Phase 16 should therefore treat wrapper/launcher/CWD success as a precondition note, not as solved authority

## 7. Explicit Non-Claims

- Phase 16 does not claim that synthetic or harness success equals runtime closure.
- Phase 16 does not claim that truth-lane success equals broad product proof.
- Phase 16 does not claim alias debt is resolved.
- Phase 16 does not claim GUI/control-surface cleanup is complete.
- Phase 16 does not claim repository hygiene or restored-folder cleanup.
- Phase 16 does not change backup/restore runtime behavior.

## 8. Recommended Next Use

This artifact is now the launch point for any later bounded Phase 16 slice.

Safe follow-up rules:

- treat fixture contract failures as fixture-governance failures first
- treat synthetic green as synthetic-only witness unless another lane independently proves more
- treat truth-lane green as truth-scope witness only
- keep teardown changes bounded and explicitly regression-tested
- keep wrapper/CWD determinism in scope before any broad implementation or closure-grade confidence claim
