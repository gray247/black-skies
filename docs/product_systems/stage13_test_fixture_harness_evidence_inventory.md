# Stage 13 Test, Fixture, Harness, and Evidence Inventory

## 1. Purpose and Scope

This inventory records current test, fixture, harness, stub, screenshot, report, and verification evidence available for later Stage 13 salvage planning.

It identifies what each evidence lane can prove, what it cannot prove, where historical claims may overreach the exercised scope, and which later bounded pass owns further review.

This pass is read-only evidence inventory. It does not repair tests, update baselines, run broad verification, assign final Preserve/Replace/Retire dispositions, authorize archive or cleanup, authorize implementation, or make release-readiness claims.

## 2. Repository and Pass 4 Checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Pass 4 checkpoint: `27ad997 docs(product): inventory runtime and structural artifacts`
- Upstream posture at inspection: branch tracked `origin/salvage/minimal-two-surface-shell` with no ahead/behind discrepancy.
- Worktree posture before creation: clean.

## 3. Evidence Classes

| Evidence class | Present examples | What it can prove | What it cannot prove |
| --- | --- | --- | --- |
| Unit evidence | `services/tests/unit/**`, `app/main/__tests__/**`, `app/shared/__tests__/**`, root `tests/*.py` | Exercised function, branch, contract, adapter, or policy behavior in the configured test environment. | End-to-end workflow correctness, packaged behavior, live provider behavior, release readiness. |
| Component and renderer evidence | `app/renderer/__tests__/**`, `app/renderer/hooks/__tests__/**`, `app/renderer/utils/__tests__/**` | Renderer/component behavior under Vitest, jsdom, setup mocks, and local snapshots. | Backend correctness, Electron packaging, actual IPC transport, packaged desktop behavior. |
| Backend evidence | `services/tests/**`, `services/tests/conftest.py` | Service behavior under pytest, TestClient or ASGI transport, temp project roots, and configured service settings. | Electron behavior, packaged app behavior, live provider results, durable production deployment. |
| IPC evidence | `app/renderer/__tests__/IPCContracts.test.tsx`, `app/main/__tests__/**`, `app/tests/e2e/**` | Contract-shape, mocked bridge, preload, or Electron harness behavior when directly exercised. | Full cross-process correctness unless the lane actually uses the real process boundary and verifies both sides. |
| Fixture evidence | `sample_project/**`, `app/tests/e2e/utils/sampleProject.ts`, `scripts/materialize_e2e_fixture.mjs`, `services/src/blackskies/services/fixtures/**` | Fixture shape, alias parity, deterministic sample data, and scenario setup. | Runtime truth outside the fixture, author project identity, migration safety, restore identity, release readiness. |
| Harness evidence | `app/tests/e2e/_electron.fixture.ts`, `app/tests/e2e/utils/serviceStubs.ts`, `scripts/e2e-with-backend.mjs`, `scripts/truth-with-backend.mjs` | Harness wiring, launch discipline, scenario routing, receipt capture, teardown, and bounded flow observation. | Broad product correctness, installer behavior, live provider behavior, or current authority by itself. |
| Stub and fake-service evidence | `app/tests/e2e/utils/serviceStubs.ts`, provider monkeypatch tests, `analytics_stub.py` | Caller behavior against controlled responses and failure modes. | Live service, live provider, queue, telemetry, or cost correctness. |
| Screenshot and visual evidence | `app/tests/e2e/visual.home.spec.ts`, `app/tests/e2e/visual.home.spec.ts-snapshots/**`, Playwright screenshots/videos/traces when present | Captured state in the specific viewport, harness mode, platform, and time. | UX readiness, accessibility completeness, release readiness, or behavior outside the captured state. |
| Report and retained-witness evidence | `build/truth_receipts/**`, `build/runtime_truth.json`, `ci_artifacts/**`, historical audit/review records | A record of what a prior command, pass, or audit observed. | Current proof unless tied to the current commit and verified lane. |

Passing tests prove only the lane and scope exercised. Historical reports remain historical evidence unless current authority explicitly promotes them.

## 4. Test Roots and Frameworks

| Root or file | Framework or runner | Exercised lane | Evidence quality and limits | Later pass |
| --- | --- | --- | --- | --- |
| `app/vitest.config.mjs` | Vitest with jsdom plus node matching for main tests | Renderer, main, shared, hook, utility, and salvage component tests | Current configuration evidence. Uses `renderer/testSetup.ts` and `renderer/vitest.setup.ts`; renderer success does not prove backend, Electron, packaged, or release behavior. | Stage 13 disposition matrix and Stage 14 proof gates |
| `app/playwright.config.ts` | Playwright Electron project | Electron e2e specs under `app/tests/e2e` | Current harness configuration. Reports to `playwright-report`, uses traces/videos on failure, screenshots off by default. Harness evidence remains bounded to configured project, env, fixtures, and test match. | Stage 13 surface/UI and packaging passes |
| `pytest.ini` | pytest | Root `tests` plus `services/tests/unit/test_runtime_truth.py` by default | Current pytest default is narrow. Plain pytest invocation does not prove the full `services/tests/**` tree unless explicitly selected. | Stage 13 evidence matrix |
| `package.json` | npm scripts | Root smoke, service truth, e2e, gauntlet, repo hygiene scripts | Script declarations identify verification lanes; declarations alone are not evidence that the lane passed at current HEAD. | Stage 14 execution gate planning |
| `app/package.json` | npm scripts | Vitest and Playwright app lanes | `test` can call `run-vitest-offline.mjs`, whose fallback changes claim strength if Vitest is unavailable. | Stage 14 proof gates |
| `pyproject.toml` | Python packaging and pytest coverage configuration | Service/package test environment | Coverage settings and test dependencies are configuration evidence, not proof of current execution or product readiness. | Stage 13 packaging/dependency pass |

Observed inventory scale during this pass: 68 app `*.test.*` files, 23 Playwright e2e specs, 124 service test Python files, and 25 root test Python files. These counts are inventory evidence only and do not indicate pass/fail status.

## 5. Fixture and Harness Inventory

| Path | Evidence type | Exercised lane | What it proves | What it does not prove | Later verification need |
| --- | --- | --- | --- | --- | --- |
| `app/tests/e2e/utils/sampleProject.ts` | E2E sample-project loader and synthetic fallback | Playwright fixture setup | The harness can find or materialize `proj_esther_estate` sample data with outline, drafts, snapshots, and loaded project shape. | Author project identity, restore identity, path-as-identity correctness, migration safety, or real project continuity. | Data/schema/persistence/recovery inventory |
| `scripts/materialize_e2e_fixture.mjs` | Fixture materializer | E2E and truth-lane aliases | Creates `sample_project/proj_esther_estate` and `sample_project/Esther_Estate` with matching project id, outline, drafts, and snapshot files. | That the aliases are authoritative identity, or that copy/restore semantics are safe. | Data/schema/persistence/recovery inventory |
| `scripts/check_e2e_fixture_contract.mjs` | Fixture contract checker | Fixture parity and optional analytics preflight | Explicitly declares what fixture checks prove and do not prove. | GUI authority, restore behavior, truth-lane provenance, or broad runtime health. | Evidence matrix and Stage 14 gates |
| `app/tests/e2e/_electron.fixture.ts` | Electron launch and teardown harness | Playwright e2e | Electron launch discipline, service stub lifecycle, runtime-error fail-fast handling, and process cleanup behavior in the harness. | Installer behavior, signed packaged behavior, release readiness, or live backend correctness unless the spec uses an external service and verifies it. | Desktop/packaging pass |
| `app/tests/e2e/utils/serviceStubs.ts` | Stub HTTP service | Playwright e2e | Deterministic UI-facing responses for analytics, draft, recovery, snapshots, backups, export, and verification endpoints. | Live backend, live provider, durable persistence, queue, telemetry, or cost behavior. | Provider/model, queue, telemetry/cache, and data passes |
| `services/tests/conftest.py` | pytest service fixture setup | Backend tests | Service app behavior under temp project roots and TestClient/ASGI transport. | Electron, package, live provider, or long-lived deployment behavior. | Service/data proof gates |
| `services/src/blackskies/services/fixtures/**` | Service JSON fixtures and rubrics | Service tests and eval-like lanes | Request/response shapes and deterministic baseline fixtures. | Real author project data, live model quality, live provider availability. | Provider/model qualification pass |
| `tests/*.py` | Root harness and tool tests | API, cache, eval, tool registry, smoke runner, snapshot persistence | Root-level tool, API, eval, smoke, and persistence expectations in pytest lanes. | Whole product integration or packaged desktop correctness. | Evidence matrix |

## 6. Stub and Fake-Service Inventory

| Path | Stub or fake class | Current or historical status | Claim-strength limit |
| --- | --- | --- | --- |
| `app/tests/e2e/utils/serviceStubs.ts` | Local HTTP stub server | Current test harness | Proves caller and renderer behavior against controlled responses only. It is not live backend, live provider, queue, telemetry, cache, or cost evidence. |
| `services/tests/unit/test_model_adapters.py` | Monkeypatched provider responses | Current unit evidence | Proves adapter parsing/error handling against fake responses. It is not live OpenAI, Ollama, or provider qualification evidence. |
| `services/tests/unit/test_model_router.py` | Fake provider health/config routing | Current unit evidence | Proves router branch behavior under controlled health/config states. It does not prove model quality or live provider reliability. |
| `services/src/blackskies/services/analytics_stub.py` | Service stub module | Current runtime/test-facing artifact | Requires later telemetry/cache pass before any product or salvage conclusion. |
| `app/renderer/testMode/**` and `app/renderer/screens/TestMode*.tsx` | Renderer test-mode surfaces | Current test/harness support | Useful for recovery or sandbox lanes. Test-only behavior must not be promoted into product behavior without explicit authority. |

## 7. Screenshot and Visual-Evidence Inventory

| Path | Evidence type | Evidence quality | Limits |
| --- | --- | --- | --- |
| `app/tests/e2e/visual.home.spec.ts` | Playwright visual screenshot spec | Harness-only packaged-mode visual capture when `VISUAL_STRICT=1` is set. | Skipped by default when the opt-in flag is absent. Does not prove UX readiness, accessibility, or release readiness. |
| `app/tests/e2e/visual.home.spec.ts-snapshots/home-electron-win32.png` | Visual baseline | Platform-specific retained witness. | Proves only the stored image for the captured context. |
| `app/tests/e2e/visual.home.spec.ts-snapshots/home-electron-linux.png` | Visual baseline | Platform-specific retained witness. | Proves only the stored image for the captured context. |
| `app/playwright-report/**`, `app/test-results/**` when present | Playwright report, trace, video, screenshot artifacts | Potential last-witness evidence for a specific run. | Not current proof unless tied to command, commit, environment, and result. |
| `ci_artifacts/playwright_diagnostics/local-canary-timeline.json` | Historical diagnostic timeline | Historical witness. | Does not prove current behavior at Pass 5 checkpoint. |

## 8. Scripted Smoke and Verification Lanes

| Path | Lane | What it can prove when run and retained | What it cannot prove |
| --- | --- | --- | --- |
| `scripts/e2e-with-backend.mjs` | E2E smoke launcher | Materialized fixture, backend health waiting, selected Playwright smoke specs, and bounded e2e harness behavior. | Full e2e coverage, release readiness, or all analytics/snapshot flows when selectors are restricted by defaults. |
| `scripts/truth-with-backend.mjs` | Receipt-producing truth lane | Real backend route observation, UI-chain and service-extension receipt artifacts, provenance fields, and retained artifacts for the exercised lane. | Current proof unless rerun at current commit; broad release readiness; all workflow, provider, or persistence guarantees outside the receipt. |
| `scripts/run_service_truth.py` | Backend/service truth lane | Backend service truth observations for its selected scope. | Electron, renderer, packaged, live provider, or release behavior. |
| `scripts/verify_gauntlet.py` | Verification orchestration | Declared verification gauntlet behavior if executed and retained. | Proof without captured current execution evidence. |
| `scripts/smoke_runner.py`, `scripts/smoke.sh`, `scripts/smoke.ps1` | Smoke scripts | Smoke-lane behavior and script wiring. | Broad product correctness or release readiness. |
| `scripts/run-vitest-offline.mjs`, `scripts/offline-vitest-runner.mjs` | Vitest/offline fallback lane | Vitest execution if available, or fallback parser/runner behavior if not. | Equivalent claim strength across both modes. The fallback must be labeled as fallback evidence. |
| `scripts/playwright_pipe_preflight.mjs` | Playwright pipe preflight | Harness precondition checking. | Application correctness or product readiness. |

No broad test run was performed in this pass. Script declarations and retained reports are inventory evidence, not current pass/fail proof.

## 9. Historical Reports and Retained Witnesses

| Path or group | Evidence type | Current status | Last-witness importance |
| --- | --- | --- | --- |
| `build/truth_receipts/latest.json`, `build/truth_receipts/latest.txt` | Generated truth-lane receipt pointers | Historical retained evidence unless tied to a current rerun. | High. May be last witness for route/provenance/artifact claims from a prior run. |
| `build/runtime_truth.json`, `build/runtime_truth.schema.json` | Generated runtime truth report and schema | Historical/generated report evidence. | High if no newer equivalent report exists. |
| `ci_artifacts/pass3/**`, `ci_artifacts/pass4/**`, `ci_artifacts/pass5/**`, `ci_artifacts/pass6/**` | Historical CI proof summaries | Historical evidence; observed summaries reference commit `1947f94c8d1797c3ebc660ebe0cac13729a3f5f1`, not the Pass 5 checkpoint. | High for reconstructing prior verification claims. |
| `docs/reviews/test_taxonomy_and_truth_matrix.md` | Historical/current review evidence | Supporting evidence taxonomy. | Medium to high as a classification witness. |
| `docs/reviews/fixture_dependency_and_layout_contract.md` | Fixture dependency evidence | Historical/supporting record. | Medium to high for fixture-layout history. |
| `docs/reviews/truth_lane_definition_and_gap_report.md` | Truth-lane gap evidence | Historical/supporting record. | High for prior known gaps. |
| `docs/audits/**`, especially Phase 13/14/16/18 and Phase 32 evidence records | Historical audit evidence | Historical evidence unless promoted by current authority. | High where records are sole witnesses for decisions, gaps, or prior observations. |
| `docs/contracts/harness_fixture_contract.md`, `docs/contracts/truth_lane_claim_matrix_contract.md`, `docs/product_systems/testing_harness_evidence_contract.md` | Current/supporting evidence contracts | Current or supporting doctrine for claim strength. | High as authority for evidence classification. |

Stage 13 may identify these as retained-witness risks but may not archive, delete, clean, or retire them operationally. Stage 16 owns archive and cleanup execution.

## 10. Claim-Strength Limits by Lane

- Unit evidence proves only the function, branch, adapter, policy, or contract shape exercised by the test.
- Component evidence proves only renderer/component behavior under jsdom, mocks, and local setup.
- Renderer success does not prove backend, packaged, provider, queue, migration, or release behavior.
- Backend success does not prove Electron, renderer, packaged, or user-flow behavior.
- IPC snapshot or mocked bridge evidence does not prove live cross-process behavior by itself.
- Fixture evidence proves fixture behavior.
- Stub evidence proves caller behavior against controlled substitutes.
- Fake provider evidence does not prove live provider behavior.
- Harness evidence proves harness setup and observed lane behavior, not broad product correctness.
- Unpackaged runtime evidence does not prove packaged application behavior.
- Packaged harness evidence does not prove installer, update, release, or signed distribution behavior.
- Screenshot evidence proves only the captured state, viewport, platform, data, and command context.
- Historical reports prove what they recorded, not that the same claim holds at the current commit.
- Passing tests do not equal implementation completion, Stage 14 authorization, or release readiness.

## 11. Known Evidence Gaps

| Gap | Why it matters | Later owner |
| --- | --- | --- |
| Current packaged installer/release proof is not established by this inventory. | Release readiness requires package-specific and distribution-specific evidence. | Desktop, packaging, launcher, installation pass; Stage 14 execution gates |
| Live provider and model qualification evidence is not established by fake provider or monkeypatch tests. | Models perform tasks; systems own workflows. Live provider behavior and model qualification require separate proof. | Provider/model pass |
| Queue, retry, cancellation, and completion semantics remain unproven by the evidence lanes inventoried here. | Workflow durability and failure handling cannot be inferred from unit or stub success. | Queue/jobs pass |
| Cost, budget, and provider-spend evidence remains partial and likely test/stub-bound. | Cost policy cannot be inferred from budget UI or fake provider tests alone. | Cost/budget pass |
| Migration, restore identity, project-root authority, and snapshot recovery need dedicated review. | Stage 12 identity rules prohibit path, filename, or restored copy from silently becoming authority. | Data/schema/persistence/migration/recovery pass |
| Approval, hidden-context, and author-policy evidence requires direct bounded review. | Author-policy choices cannot be resolved by assumptions or test defaults. | Policy/workflow proof pass |
| Telemetry, diagnostics, logs, and cache claims remain lane-specific and incomplete. | Observability evidence can easily overclaim workflow or truth status. | Telemetry/cache pass |
| Hardware and model qualification evidence is not established by this pass. | Runtime feasibility and qualification require explicit current evidence. | Provider/model and Stage 14 gate pass |
| Visual baseline evidence is opt-in and capture-bound. | UX readiness and accessibility cannot be inferred from a baseline screenshot. | Surface/UI pass |

## 12. Overclaim or Ambiguity Register

| ID | Affected evidence | Overclaim or ambiguity | Required handling |
| --- | --- | --- | --- |
| S13-P5-OA-01 | `app/tests/e2e/**` specs marked or behaving as harness-only | Harness-only Playwright success may be misread as packaged release, live backend, or live provider proof. | Keep as harness evidence until a later Stage 14 proof gate or packaging pass establishes stronger evidence. |
| S13-P5-OA-02 | `app/tests/e2e/utils/serviceStubs.ts` | Stubbed endpoints can make UI flows look complete without exercising real backend/provider/persistence paths. | Route to provider/model, data, queue, telemetry/cache, and cost passes according to endpoint. |
| S13-P5-OA-03 | `sample_project/proj_esther_estate` and `sample_project/Esther_Estate` | Alias parity supports harness setup but could be mistaken for project identity authority. | Route to data/schema/persistence/migration/recovery pass. |
| S13-P5-OA-04 | `scripts/run-vitest-offline.mjs` | Fallback execution can weaken equivalence with normal Vitest without obvious outward script-name change. | Stage 14 proof gates must record which runner mode actually executed. |
| S13-P5-OA-05 | `pytest.ini` | Default pytest collection is narrower than the full service test tree. | Any future claim based on `pytest` must identify selected paths and deselected coverage. |
| S13-P5-OA-06 | `app/tests/e2e/visual.home.spec.ts` | Visual lane is skipped unless `VISUAL_STRICT=1`; baseline presence can be mistaken for current visual proof. | Surface/UI pass must classify visual baselines and current run requirements separately. |
| S13-P5-OA-07 | Provider/model unit tests | Monkeypatched providers and fake health checks can be misread as live provider qualification. | Provider/model qualification pass must separate fake, local, live, and provider-reported evidence. |
| S13-P5-OA-08 | `build/truth_receipts/**` and `ci_artifacts/**` | Historical reports can be misread as current HEAD proof. | Later proof gates must bind command, commit, environment, timestamp, and artifact identity. |
| S13-P5-OA-09 | Root and service snapshot/persistence tests | Snapshot or persistence fixture success can be overstated into restore identity or migration safety. | Data/schema/persistence/migration/recovery pass must inspect actual identity and recovery semantics. |
| S13-P5-OA-10 | Historical audit and review records | Older evidence labels such as keep, carry forward, or proof may look like current disposition or current proof. | Treat as historical or supporting evidence unless current authority explicitly promotes the record. |

No final salvage disposition is assigned by this register.

## 13. Last-Witness Risks

The following groups may contain last witnesses for material verification, audit, or historical claims and must not be cleaned, archived, deleted, overwritten, or treated as disposable during Stage 13:

- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `ci_artifacts/**`
- `app/playwright-report/**` and `app/test-results/**` when present
- `app/tests/e2e/visual.home.spec.ts-snapshots/**`
- `docs/audits/**`
- `docs/reviews/**`
- `docs/contracts/harness_fixture_contract.md`
- `docs/contracts/truth_lane_claim_matrix_contract.md`
- `docs/product_systems/testing_harness_evidence_contract.md`
- Historical Phase 32 evidence and carry-forward records cited by the Stage 13 historical inventory

Last-witness protection does not promote a record into current product authority. It only blocks silent loss, substitution, or claim promotion.

## 14. Later-Pass Routing

| Evidence group | Later pass |
| --- | --- |
| Sample projects, fixture aliases, snapshots, project roots, restore, migration, persistence reports | Data, schema, persistence, migration, and recovery inventory |
| Renderer component tests, Playwright UI specs, visual baselines, accessibility smoke | Surface and UI artifact inventory |
| Electron fixture, Playwright launch behavior, packaged entry selection, install/package claims | Desktop, packaging, launcher, and installation inventory |
| Service stubs, provider monkeypatches, model adapter/router tests | Provider, model-routing, and model-qualification inventory |
| Queue, retry, cancellation, job, async workflow tests | Queue, jobs, retries, and cancellation inventory |
| Analytics, telemetry, diagnostics, logs, cache tests and reports | Telemetry, diagnostics, logs, and caches inventory |
| Budget-meter, cost, provider-spend, error-budget evidence | Cost and budget inventory |
| Truth receipts, CI summaries, retained reports, historical screenshots | Disposition matrix and last-witness review |
| Stage 14 proof lanes and command gates | Stage 14 execution-gate inventory |

## 15. Stop and Reopening Conditions

Stop and invoke the appropriate reopening or authority path if later evidence review finds:

- a Stage 12 architecture floor is infeasible, contradictory, incomplete, or missing required propagation;
- evidence shows current authority cannot support the Stage 13 program;
- historical evidence is the only witness for a required Stage 12 claim and cannot be reconciled without altering product truth;
- a lower-tier test, fixture, or report appears to contradict higher current authority;
- a missing or ambiguous authority chain would require assumption to proceed;
- author-policy choices are being converted into architecture or implementation assumptions;
- implementation, release, archive, cleanup, deletion, migration, or runtime modification would be required to continue the inventory.

Stage 13 may record the issue and route it. It must not patch Stage 12 defects or silently compensate through evidence interpretation.

## 16. Recommended Next Bounded Pass

Recommended next pass: data, schema, persistence, migration, and recovery inventory.

Rationale: the evidence inventory repeatedly depends on sample-project aliases, project-root paths, synthetic fixtures, snapshots, truth receipts, restore services, and persistence reports. Those lanes carry high identity and recovery risk under the Stage 12 contract, especially because path, filename, restored copy, fixture success, or snapshot presence cannot silently become project authority.

The next pass should remain an inventory pass only. It should not perform migrations, repair fixtures, update schemas, change persistence behavior, archive evidence, or authorize Stage 14 execution.
