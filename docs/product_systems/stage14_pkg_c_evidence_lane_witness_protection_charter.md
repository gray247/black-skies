# Stage 14 PKG-C Charter - Evidence Lane and Witness Protection

## 1. Package purpose

PKG-C exists to protect evidence before later Stage 14 packages modify behavior, structure, identity handling, desktop boundaries, operational semantics, or surface ownership.

PKG-C governs witness classification, claim-strength limits, retained-witness protection, fixture and harness boundary discipline, generated-evidence handling, and the bounded proof plan required before any evidence-lane mutation may begin.

## 2. Author authorization

The author has explicitly authorized PKG-C planning in this pass.

This authorizes only:

- creation of the bounded PKG-C charter
- definition of repository checkpoint, scope, proof plan, rollback, stop, split, and reopening rules
- bounded read-only discovery sufficient to define PKG-C file families and baseline commands

This pass does not authorize mutation of runtime code, tests, fixtures, harnesses, generated evidence, retained evidence, or package behavior.

## 3. Stage 14 activation checkpoint

Stage 14 activation checkpoint:

- `2668a7b docs(product): activate stage 14 salvage execution`

This is the pre-PKG-C planning checkpoint.

## 4. Controlling contracts

Primary controlling records:

- `docs/product_systems/stage14_salvage_execution_program.md`
- `docs/product_systems/stage14_salvage_execution_activation.md`
- `docs/product_systems/stage13_test_fixture_harness_evidence_inventory.md`
- `docs/product_systems/stage13_salvage_disposition_matrix.md`
- `docs/product_systems/stage13_dependency_sequence_stage14_execution_gates.md`
- `docs/product_systems/stage13_salvage_completion_plan.md`
- `docs/product_systems/stage12_architecture_readiness_contract.md`
- `docs/product_systems/stage12_architecture_readiness_contract_closure.md`
- `docs/product_systems/stage12_evidence_retention_last_witness_contract.md`

Targeted Stage 12 evidence rules remain controlling where needed for:

- claim strength
- last-witness protection
- historical-versus-current evidence distinction
- prohibition on silent evidence promotion
- prohibition on silent evidence rebinding

## 5. Exact package objective

PKG-C objective:

- classify current evidence lanes by actual proof scope
- identify retained and potentially last-necessary witnesses
- identify test-only seams, fixture aliases, and harness substitutions that can inflate claims
- establish exact baseline commands and evidence artifacts for later PKG-C execution
- define proof, rollback, stop, split, and reopening rules that keep PKG-C inside evidence boundaries

PKG-C does not resolve runtime identity, persistence semantics, packaged-product correctness, queue governance, provider/model qualification, or surface sovereignty. Those belong to later packages.

## 6. Exact in-scope file families

Scope classification model for PKG-C:

- `in scope`: evidence-lane material that PKG-C may later mutate after charter review, commit, and push
- `conditionally in scope`: witness material that PKG-C may classify and possibly mutate only if the execution pass stays inside evidence semantics
- `dependency only`: material PKG-C may reference to explain a boundary but may not mutate
- `explicitly excluded`: material outside PKG-C authority
- `unresolved pending baseline`: material that may matter to PKG-C but needs baseline confirmation before any mutation scope can be granted

In-scope file families:

- root test command and verification declarations:
  - `package.json`
  - `pytest.ini`
- app test command and config declarations:
  - `app/package.json`
  - `app/vitest.config.mjs`
  - `app/playwright.config.ts`
- PKG-C harness and script family:
  - `scripts/run-vitest-offline.mjs`
  - `scripts/offline-vitest-runner.mjs`
  - `scripts/e2e-with-backend.mjs`
  - `scripts/truth-with-backend.mjs`
  - `scripts/run_service_truth.py`
  - `scripts/check_e2e_fixture_contract.mjs`
  - `scripts/materialize_e2e_fixture.mjs`
  - `scripts/verify_gauntlet.py`
  - `scripts/playwright_pipe_preflight.mjs`
- Playwright and harness-support family:
  - `app/tests/e2e/_electron.fixture.ts`
  - `app/tests/e2e/_bootstrap.ts`
  - `app/tests/e2e/electron.launch.ts`
  - `app/tests/e2e/utils/serviceStubs.ts`
  - `app/tests/e2e/utils/sampleProject.ts`
  - `app/tests/e2e/utils/testModeConfig.ts`
  - `app/tests/e2e/utils/guiContract.ts`
  - `app/tests/e2e/visual.home.spec.ts`
  - `app/tests/e2e/visual.home.spec.ts-snapshots/**`
  - selected harness-lane specs that declare contract, truth, smoke, startup, or GUI witness roles
- test-only runtime seam family:
  - `app/renderer/testMode/testModeManager.ts`
  - `app/renderer/testMode/testUISandbox.ts`
- witness and retained-evidence family:
  - `build/truth_receipts/**`
  - `ci_artifacts/**`
- runtime-truth witness mapping family (classification only):
  - `build/runtime_truth.json`
  - `build/runtime_truth.schema.json`
- fixture and contract evidence family:
  - `sample_project/proj_esther_estate/**`
  - `sample_project/Esther_Estate/**`
  - `services/tests/contracts/**`
  - `services/tests/prototype/fixtures/**`
- selected proof-lane tests whose primary purpose is evidence or witness integrity:
  - `app/renderer/__tests__/IPCContracts.test.tsx`
  - `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`
- classification-only runtime-truth witness:
  - `services/tests/unit/test_runtime_truth.py`

## 7. Candidate specific files

Candidate files identified in bounded discovery by scope class:

- `in scope`
  - `package.json`
  - `app/package.json`
  - `pytest.ini`
  - `app/vitest.config.mjs`
  - `app/playwright.config.ts`
  - `scripts/run-vitest-offline.mjs`
  - `scripts/offline-vitest-runner.mjs`
  - `scripts/e2e-with-backend.mjs`
  - `scripts/truth-with-backend.mjs`
  - `scripts/run_service_truth.py`
  - `scripts/check_e2e_fixture_contract.mjs`
  - `scripts/materialize_e2e_fixture.mjs`
  - `scripts/verify_gauntlet.py`
  - `scripts/playwright_pipe_preflight.mjs`
  - `app/tests/e2e/_electron.fixture.ts`
  - `app/tests/e2e/_bootstrap.ts`
  - `app/tests/e2e/electron.launch.ts`
  - `app/tests/e2e/utils/serviceStubs.ts`
  - `app/tests/e2e/utils/sampleProject.ts`
  - `app/tests/e2e/utils/testModeConfig.ts`
  - `app/tests/e2e/utils/guiContract.ts`
  - `app/tests/e2e/visual.home.spec.ts`
  - `app/tests/e2e/visual.home.spec.ts-snapshots/home-electron-win32.png`
  - `app/tests/e2e/visual.home.spec.ts-snapshots/home-electron-linux.png`
  - `app/renderer/testMode/testModeManager.ts`
  - `app/renderer/testMode/testUISandbox.ts`
  - `app/renderer/__tests__/IPCContracts.test.tsx`
  - `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`
  - `build/truth_receipts/latest.json`
  - `build/truth_receipts/latest.txt`
  - `ci_artifacts/playwright_diagnostics/local-canary-timeline.json`
  - `ci_artifacts/pass3/build/ci_proof/pass3/summary.json`
  - `ci_artifacts/pass4/build/ci_proof/pass4/summary.json`
  - `ci_artifacts/pass5/build/ci_proof/pass5/summary.json`
  - `ci_artifacts/pass6/build/ci_proof/pass6/summary.json`

- `conditionally in scope`
  - `tests/test_snapshot_persistence.py`
  - `services/tests/unit/test_runtime_truth.py`
  - `build/runtime_truth.json`
  - `build/runtime_truth.schema.json`
  - `services/tests/contracts/draft_preflight_ok.json`
  - `services/tests/contracts/draft_critique.json`
  - `services/tests/contracts/outline_build.json`

These are conditionally in scope only for witness classification and claim-strength labeling. Any mutation that crosses into persistence semantics, snapshot authority, recovery behavior, layout persistence, or broader runtime-truth semantics belongs outside PKG-C.

Runtime-truth no-mutation rule:

- PKG-C may inspect and classify `services/tests/unit/test_runtime_truth.py`, `build/runtime_truth.json`, and `build/runtime_truth.schema.json` as witnesses
- PKG-C may not change their runtime claims, schema meaning, or broader semantic assertions
- any required mutation involving analytics, provider calls, long-form execution, backup verification, Memory Lab, or other cross-package runtime claims must stop and route to the responsible later package or force a package split
- surrounding witness metadata may be changed only in a later reviewed execution pass that separately authorizes the metadata change without altering runtime semantics

- `dependency only`
  - `sample_project/proj_esther_estate/**`
  - `sample_project/Esther_Estate/**`

These paths may be inspected or cited to explain witness provenance, fixture parity, and retained-evidence risk. PKG-C may not mutate them unless a later reviewed execution pass proves the change is evidence-only and does not cross into project identity, recovery, or persistence semantics.

- `unresolved pending baseline`
  - selected harness-lane specs under `app/tests/e2e/**` that declare startup, smoke, contract, truth, or GUI witness roles but were not individually enumerated in this planning pass
  - any additional retained evidence under `build/truth_receipts/**` and `ci_artifacts/**` that baseline execution identifies as a last necessary witness

These remain outside mutation scope until the PKG-C baseline pass records the exact files, claim lane, and retained-witness role.

## 8. Explicit exclusions

Explicitly excluded from PKG-C mutation scope:

- runtime identity and persistence implementation families:
  - `app/main/main.ts`
  - `app/main/projectLoaderIpc.ts`
  - service persistence writers
  - restore and recovery routers
  - snapshot and backup implementation code
- layout persistence implementation, saved-layout recovery behavior, and layout-restoration assertions
- desktop and packaging implementation families:
  - `app/electron/**`
  - `app/electron-builder.yml`
  - installer or portable implementation behavior
- queue, provider, model, telemetry, cache, budget, and hardware implementation families
- runtime-truth semantic assertions spanning analytics, provider calls, long-form execution, backup verification, Memory Lab, or other cross-package runtime claims
- Writing Surface, Command Center, Companion, and renderer coordinator reduction families
- any project data mutation outside explicitly retained witness classification
- any cleanup, archival execution, deletion, or release work

Excluded by default unless later PKG-C review narrows them into evidence-only scope:

- all runtime roots not acting as test-only seams
- all service implementation modules not directly producing or protecting evidence
- all non-evidence UI components

## 9. Dependency boundaries

Dependency-only boundaries:

- runtime identity, copy, restore, snapshot authority, and sample-alias retirement belong to PKG-A
- dev-versus-packaged, installed-versus-portable, and duplicate Electron-path resolution belong to PKG-D
- queue, provider, model, telemetry, cache, budget, and hardware governance belong to PKG-E
- Writing Surface, Command Center, Companion, and coordinator reduction belong to PKG-B

If PKG-C needs mutation in any of those domains to define evidence safely, PKG-C must stop and route the dependency rather than absorb it.

## 10. Repository checkpoint

Pre-PKG-C repository checkpoint:

- `2668a7b docs(product): activate stage 14 salvage execution`

This checkpoint is the rollback anchor for PKG-C planning and the expected pre-mutation checkpoint for later PKG-C execution unless a later reviewed charter amendment records a newer clean checkpoint.

## 11. Baseline commands

Derived bounded baseline commands for later PKG-C execution:

- repository posture:
  - `git status --short`
  - `git log -5 --oneline`
- targeted fixture and harness contract checks:
  - `node ./scripts/check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
- targeted Playwright harness witnesses:
  - `pnpm --dir app exec playwright test tests/e2e/gui-contract.spec.ts --project=electron --workers=1 --reporter=list --trace=on`
  - `pnpm --dir app exec playwright test tests/e2e/visual.home.spec.ts --project=electron --workers=1 --reporter=list --trace=on`
  - `app/tests/e2e/visual.home.spec.ts` additionally requires `VISUAL_STRICT=1`
  - additional startup, smoke, contract, truth, and GUI witness selectors remain unresolved pending baseline discovery until individually enumerated
- targeted test-only seam and flag posture checks:
  - `rg -n "test.skip|describe.skip|VISUAL_STRICT|FULL_ANALYTICS_E2E|BLACKSKIES_E2E|PLAYWRIGHT_DISABLE_ANIMATIONS|BLACKSKIES_ENABLE_HARNESS_HOOKS|testForceOffline|testMode" app/tests/e2e app/renderer/testMode app/tests/e2e/utils scripts app/playwright.config.ts app/package.json`
- targeted retained-evidence inspections:
  - `rg -n "truth_receipts|runtime_truth|ci_proof|last_verification|snapshot" build ci_artifacts sample_project`
- targeted unit or schema witnesses relevant to evidence retention:
  - exact PKG-C-scoped unit or schema command remains unresolved pending baseline discovery
  - `services/tests/unit/test_runtime_truth.py` may be inspected only as a classification witness for runtime-truth boundaries and is not a direct PKG-C mutation command
- targeted negative checks:
  - exact negative-check command set remains unresolved pending baseline discovery and must be recorded per witness lane instead of substituted with a repo-wide default suite

Optional broader regression or dependency evidence:

- `pytest`
- `pnpm --dir app test`
- `pnpm --dir app e2e:test`
- `pnpm test:e2e`
- `pnpm test:truth`
- `pnpm test:service-truth`
- `pnpm verify:gauntlet`

Broader-suite rule:

- repo-wide suite success does not expand PKG-C authority
- repo-wide suite failure outside PKG-C does not automatically block PKG-C
- any out-of-package failure must be recorded and routed, not silently fixed
- broad suites may be run only as optional broader regression or dependency evidence when their exercised scope is explicitly separated from PKG-C claims
- if a precise targeted command is not yet established, keep it unresolved pending baseline discovery rather than substituting a broad default suite

Closure-proof rule for commands:

- PKG-C closure proof must come from the enumerated evidence-lane witnesses above, not broad suite totals

## 12. Known existing failures

Known existing bounded evidence limitations from discovery:

- `app/tests/e2e/visual.home.spec.ts` is intentionally skipped unless `VISUAL_STRICT=1`
- `app/tests/e2e/gui.flows.spec.ts` contains opt-in coverage gated by `FULL_ANALYTICS_E2E`
- `app/tests/e2e/truth.real-service.spec.ts` is skipped unless `BLACKSKIES_E2E_EXTERNAL_SERVICE=1`
- `scripts/run-vitest-offline.mjs` falls back to `scripts/offline-vitest-runner.mjs` when Vitest node modules are unavailable
- `scripts/offline-vitest-runner.mjs` can exit successfully with no mapped tests for the requested pattern, which weakens naive green-status interpretation
- `scripts/e2e-with-backend.mjs` requires prebuilt Electron artifacts and a free local backend port

No authoritative current failing-test ledger was identified in bounded discovery. Later PKG-C baseline execution must record actual failing lanes from command output instead of assuming none exist.

## 13. Environmental limitations

Observed environmental limitations:

- Playwright Electron lanes depend on built app artifacts and local Electron launch viability
- e2e and truth lanes depend on local backend startup and port `9999`
- Python-backed truth/service lanes depend on a working Python environment and backend imports
- `scripts/run-vitest-offline.mjs` may degrade to the offline runner if dev dependencies are absent
- visual baseline evidence is opt-in and cross-platform sensitive
- retained reports in `build/**` and `ci_artifacts/**` are historical unless rebound to current command, commit, and environment

PKG-C must preserve these limitations in its proof claims.

## 14. Evidence classes

PKG-C witness classes:

- unit
- component
- renderer integration
- Electron development
- IPC boundary
- persistence/recovery
- migration
- packaged application
- installer
- manual inspection
- historical report

Rule:

Each witness proves only the lane it actually exercises.

## 15. Witness inventory

Current witness inventory for PKG-C planning:

- unit and schema witnesses:
  - exact PKG-C-scoped unit or schema command remains unresolved pending baseline discovery
  - `services/tests/unit/test_runtime_truth.py` as a read-only classification witness for runtime-truth boundaries
- component and renderer witnesses:
  - `app/renderer/__tests__/IPCContracts.test.tsx`
  - `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`
- Electron development and harness witnesses:
  - `app/tests/e2e/_electron.fixture.ts`
  - `app/tests/e2e/electron.launch.ts`
  - `app/tests/e2e/visual.home.spec.ts`
  - selected startup, smoke, contract, and GUI specs under `app/tests/e2e/**`
- fixture and harness witnesses:
  - `app/tests/e2e/utils/serviceStubs.ts`
  - `app/tests/e2e/utils/sampleProject.ts`
  - `app/tests/e2e/utils/testModeConfig.ts`
  - `scripts/materialize_e2e_fixture.mjs`
  - `scripts/check_e2e_fixture_contract.mjs`
- truth and receipt witnesses:
  - `scripts/truth-with-backend.mjs`
  - `build/truth_receipts/**`
  - `build/runtime_truth.json` as a classification-only runtime-truth witness
  - `build/runtime_truth.schema.json` as a classification-only runtime-truth witness
- historical and CI witnesses:
  - `ci_artifacts/**`
  - `app/tests/e2e/visual.home.spec.ts-snapshots/**`

## 16. Last-witness risks

Potential last-witness groups identified in PKG-C scope:

- `build/truth_receipts/**`
- `build/runtime_truth.json` as a classification-only witness
- `build/runtime_truth.schema.json` as a classification-only witness
- `ci_artifacts/**`
- `app/tests/e2e/visual.home.spec.ts-snapshots/**`
- `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`
- retained fixture parity and verification artifacts under `sample_project/proj_esther_estate/**` and `sample_project/Esther_Estate/**`

PKG-C must assume these may contain last necessary witnesses until a later reviewed execution pass proves otherwise.

## 17. Execution proof plan

PKG-C execution proof must show that authorized evidence protections were actually installed, such as:

- lane labels added or clarified
- witness role records created or updated
- explicit historical-versus-current evidence labeling added
- test-only seams fenced from production interpretation
- retained-witness protections added without altering non-evidence domains

Execution proof cannot rely on commit presence alone. It must show the bounded evidence-protection change.

## 18. Regression proof plan

PKG-C regression proof must show that protected evidence behavior still works within exercised lanes, including:

- configured Vitest lane still executes in its declared mode
- Playwright Electron harness still launches in its declared harness mode
- fixture materialization and fixture contract checks still function
- truth-lane and service-truth scripts still produce their declared evidence artifacts when exercised
- retained witness paths remain readable and classifiable

Regression proof remains lane-bound. It does not prove packaged correctness, release readiness, or operational governance.

## 19. Closure proof plan

PKG-C closure proof must show:

- exact witnesses preserved, constrained, or explicitly reclassified
- any replaced witness claim is preserved historically before replacement
- any verify carry-forward is named
- no evidence mutation crossed into PKG-A, D, E, or B domains
- all proof limits and environmental limitations are recorded
- closure proof is derived from enumerated evidence-lane witnesses rather than broad suite totals
- no last witness was silently lost

## 20. Required negative checks

PKG-C negative checks must include:

- test-only flag used outside test mode
- fixture identity missing or ambiguous
- stale fixture treated as current
- weakened assertion producing a false green
- removal of the last surviving witness
- historical report cited as current runtime proof
- mocked behavior cited as packaged proof
- generated artifact treated as canonical evidence
- witness claim broader than the exercised lane

## 21. Test-and-runtime mutation rule

Default rule:

Do not modify a witness and the runtime behavior it judges in the same execution pass.

Exception requires:

- prior witness shown invalid under current authority
- original claim preserved
- replacement witness defined first
- combined change justified explicitly
- independent review confirms no assertion weakening

## 22. Expected execution-pass structure

Expected PKG-C execution-pass structure:

1. baseline and witness-role confirmation
2. fixture and harness claim-strength hardening
3. retained-witness and generated-artifact protection
4. bounded verification and negative-check pass
5. PKG-C closure record

If packaged, historical, and live-harness witness families cannot be judged coherently inside one proof set, PKG-C must split rather than widen casually.

## 23. Commit discipline

PKG-C commit discipline:

- one coherent evidence responsibility per commit
- no unrelated cleanup
- no runtime-behavior mutation mixed with witness mutation by default
- explicit identification of evidence-lane changes
- explicit identification of retained-witness changes
- package closure committed only after review

## 24. Rollback checkpoint and methods

Rollback checkpoint:

- `2668a7b docs(product): activate stage 14 salvage execution`

Rollback methods:

- discard uncommitted changes only when no retained witness or generated evidence would be lost
- revert a bounded commit when a PKG-C execution commit crossed scope or weakened evidence claims
- return to package checkpoint when the evidence boundary itself became incoherent
- amend the charter when scope remains coherent but exact files or commands need reviewed narrowing
- split the package when one rollback boundary cannot protect all evidence domains
- reopen Stage 12 when evidence authority or last-witness governance is contract-defective

Evidence to preserve before rollback:

- any retained witness being reclassified
- any generated report or receipt used in proof
- any prior claim-strength record being superseded

## 25. Stop conditions

Stop before mutation if:

- exact scope remains materially unclear
- unauthorized files are required
- a last witness would be lost
- evidence ownership crosses package boundaries
- runtime changes are required to define evidence
- test and runtime changes cannot be separated safely
- current authority is missing or contradictory
- a deferred policy decision is required
- rollback evidence is inadequate
- later-package work becomes necessary

## 26. Package split conditions

Split PKG-C when:

- independent evidence domains appear
- one rollback boundary is unsafe
- one proof set cannot judge all planned changes
- file scope expands materially
- packaged and development witnesses require separate treatment
- review cannot isolate cause and effect

## 27. Stage 12 reopening triggers

Reopen Stage 12 when PKG-C reveals:

- contradictory evidence authority
- missing witness owner
- missing evidence-retention rule
- missing truth or approval boundary
- unresolvable proof ambiguity
- infeasible last-witness protection

Ordinary test difficulty alone does not require reopening.

## 28. Cross-package invalidation risks

PKG-C invalidation risks to later packages:

- reclassifying a retained artifact as a last necessary witness may block later cleanup, desktop, operational, or surface work
- tightening fixture claim strength may invalidate identity assumptions currently embedded in PKG-A evidence
- separating packaged-versus-dev witness claims may invalidate PKG-D desktop assumptions
- relabeling telemetry, queue, or provider-facing reports as historical or stub-bound may invalidate PKG-E assumptions

## 29. Required evidence artifacts

PKG-C must produce or maintain these evidence artifacts:

- claim-strength matrix
- witness-role ledger
- retained-witness register
- generated/environmental classification ledger
- baseline command ledger with environment notes
- verify carry-forward list for unresolved witness families

## 30. Explicit "not proved" statements

PKG-C alone does not prove:

- correct runtime project identity
- safe persistence or recovery
- packaged or installer correctness unless directly exercised
- queue restart behavior
- provider or model qualification
- hardware qualification
- Writing Surface or Command Center sovereignty
- release readiness

## 31. Charter completion gate

This charter is complete for planning only when:

- exact in-scope families are named
- exclusions and dependency-only boundaries are explicit
- baseline commands are derived from current scripts and config
- known evidence limitations are recorded
- proof, rollback, stop, split, and reopening rules are explicit
- mutation remains blocked pending review, commit, and push of the charter

## 32. PKG-C mutation authorization boundary

PKG-C mutation remains unauthorized during this pass.

Mutation may begin only after:

- this charter passes read-only review
- any required correction is completed
- this charter is committed
- this charter is pushed
- the author separately continues bounded PKG-C execution under the reviewed charter gate

No later package is authorized.

## 33. Charter verdict

Charter verdict: PKG-C planning boundary is coherent, mutation remains unauthorized in this pass, and PKG-C may proceed to review as a bounded evidence-lane and witness-protection charter.
