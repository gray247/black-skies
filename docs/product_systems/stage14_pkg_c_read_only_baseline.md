# Stage 14 PKG-C Read-Only Baseline

## 1. Purpose
This record captures the pre-mutation PKG-C baseline for evidence-lane and witness-protection work.

It is read-only evidence capture. It does not authorize mutation, fixture regeneration, snapshot updates, cleanup, archive execution, or release work.

## 2. Repository checkpoint
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Upstream: `origin/salvage/minimal-two-surface-shell`
- HEAD: `e1ea9bf`
- Charter commit: `e1ea9bf docs(product): define PKG-C evidence witness charter`
- Gate posture: clean synchronized worktree, no ahead/behind discrepancy

## 3. Charter authority
Controlling charter:
- `docs/product_systems/stage14_pkg_c_evidence_lane_witness_protection_charter.md`

Relevant authority:
- PKG-C is first eligible after Stage 14 activation, but still unauthorized until explicit author authorization
- sample-project roots are dependency-only
- runtime-truth artifacts are classification-only witnesses
- broad repo suites are optional broader evidence only
- closure proof must come from enumerated evidence-lane witnesses

## 4. Commands inspected
Inspected command declarations and control surfaces:
- `package.json`
- `app/package.json`
- `pytest.ini`
- `app/vitest.config.mjs`
- `app/playwright.config.ts`
- `scripts/run-vitest-offline.mjs`
- `scripts/offline-vitest-runner.mjs`
- `scripts/e2e-with-backend.mjs`
- `scripts/truth-with-backend.mjs`
- `scripts/check_e2e_fixture_contract.mjs`

Derived command classes:
- repository posture checks
- targeted fixture and harness contract checks
- targeted Playwright harness witnesses
- targeted seam and flag inspection
- retained-evidence path inspection
- targeted unit or schema witness classification
- targeted negative checks

## 5. Commands run
All commands below were read-only. No repository file changed.

| Command | Working directory | Exit code | Files or lane exercised | Result | Limitation | File changed? |
| --- | --- | --- | --- | --- | --- | --- |
| `git status -sb` | `C:\Dev\black-skies` | `0` | Repository gate | Branch tracks `origin/salvage/minimal-two-surface-shell`; worktree clean. | Snapshot only. | No |
| `git status --short` | `C:\Dev\black-skies` | `0` | Repository gate | No tracked changes; clean worktree. | Snapshot only. | No |
| `git log -5 --oneline` | `C:\Dev\black-skies` | `0` | History check | `e1ea9bf docs(product): define PKG-C evidence witness charter` is current HEAD. | History only. | No |
| `Get-Content 'docs/product_systems/stage14_pkg_c_evidence_lane_witness_protection_charter.md'` | `C:\Dev\black-skies` | `0` | Charter review source | Charter text reviewed for scope, baseline, and witness classification. | Read-only inspection only. | No |
| `Get-Content 'docs/product_systems/stage14_salvage_execution_program.md'` | `C:\Dev\black-skies` | `0` | Program authority source | Stage 14 governance and package-order rules confirmed. | Read-only inspection only. | No |
| `Get-Content 'docs/product_systems/stage14_salvage_execution_activation.md'` | `C:\Dev\black-skies` | `0` | Activation authority source | Stage 14 activation conditions confirmed. | Read-only inspection only. | No |
| `Get-Content 'docs/product_systems/stage13_test_fixture_harness_evidence_inventory.md'` | `C:\Dev\black-skies` | `0` | Evidence inventory source | Fixture, harness, retained-report, and skip taxonomy confirmed. | Read-only inspection only. | No |
| `Get-Content 'docs/product_systems/stage12_evidence_retention_last_witness_contract.md'` | `C:\Dev\black-skies` | `0` | Last-witness authority source | Last-witness protection doctrine confirmed. | Read-only inspection only. | No |
| `Get-Content 'package.json'` | `C:\Dev\black-skies` | `0` | Root command declarations | Root scripts for `test:e2e`, `test:truth`, `test:service-truth`, and `verify:gauntlet` confirmed. | Script inspection only. | No |
| `Get-Content 'app/package.json'` | `C:\Dev\black-skies` | `0` | App command declarations | App scripts for Vitest and Playwright confirmed. | Script inspection only. | No |
| `Get-Content 'pytest.ini'` | `C:\Dev\black-skies` | `0` | Pytest collection rules | Default collection is `tests` plus `services/tests/unit/test_runtime_truth.py`. | Configuration inspection only. | No |
| `Get-Content 'app/vitest.config.mjs'` | `C:\Dev\black-skies` | `0` | Vitest config | Renderer/main test globs confirmed. | Configuration inspection only. | No |
| `Get-Content 'app/playwright.config.ts'` | `C:\Dev\black-skies` | `0` | Playwright config | Electron project, retain-on-failure traces/videos, and preflight setup confirmed. | Configuration inspection only. | No |
| `Get-Content 'scripts/run-vitest-offline.mjs'` | `C:\Dev\black-skies` | `0` | Vitest fallback logic | Offline fallback exists when Vitest node modules are unavailable. | Script inspection only. | No |
| `Get-Content 'scripts/offline-vitest-runner.mjs'` | `C:\Dev\black-skies` | `0` | Offline runner logic | No mapped offline tests prints a zero-result message and exits `0`. | Script inspection only. | No |
| `Get-Content 'scripts/e2e-with-backend.mjs'` | `C:\Dev\black-skies` | `0` | E2E launcher logic | The launcher materializes fixtures, starts backend services, and runs Playwright smoke/full lanes. | Not run; inspected only to classify mutation risk. | No |
| `Get-Content 'scripts/truth-with-backend.mjs'` | `C:\Dev\black-skies` | `0` | Truth lane logic | The truth lane writes receipts and can touch snapshots/verification artifacts. | Not run; inspected only to classify mutation risk. | No |
| `Get-Content 'scripts/check_e2e_fixture_contract.mjs'` | `C:\Dev\black-skies` | `0` | Fixture contract checker | Contract checker is read-only and validates alias parity plus analytics preflight. | Script inspection only. | No |
| `rg -n "VISUAL_STRICT|FULL_ANALYTICS_E2E|BLACKSKIES_E2E_EXTERNAL_SERVICE|testForceOffline|testModeFreezeServiceHealth|snapshot-restore|testMode|serviceStubs|sampleProject|playwright_pipe_preflight|truth_receipts|runtime_truth|last_verification|ci_proof|snapshot" app/tests/e2e app/renderer/testMode scripts app/playwright.config.ts app/package.json` | `C:\Dev\black-skies` | `0` | Seam, skip, and retained-evidence inventory | Confirmed test-only seams, opt-in gates, and retained-evidence references. | Read-only search only. | No |
| `Test-Path 'docs/product_systems/stage14_pkg_c_read_only_baseline.md'` | `C:\Dev\black-skies` | `0` | Baseline record existence check | No prior canonical baseline file existed. | Read-only check only. | No |
| `Test-Path` checks for `build/truth_receipts`, `build/runtime_truth.json`, `build/runtime_truth.schema.json`, `ci_artifacts`, `app/tests/e2e/visual.home.spec.ts-snapshots`, `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`, `sample_project/proj_esther_estate`, `sample_project/Esther_Estate` | `C:\Dev\black-skies` | `0` | Retained-evidence root inventory | All requested roots existed at inspection time. | Read-only check only. | No |
| `rg -n "test_runtime_truth.py|build/runtime_truth.json|build/runtime_truth.schema.json|materialize_e2e_fixture.mjs" docs/product_systems/stage14_pkg_c_evidence_lane_witness_protection_charter.md` | `C:\Dev\black-skies` | `0` | Charter occurrence check | Runtime-truth paths are classification-only; `materialize_e2e_fixture.mjs` is only documented as a dependency-side tool. | Read-only search only. | No |

## 6. Commands not run
Commands not run because they would mutate controlled evidence, regenerate fixtures, or produce new receipts/artifacts:
- `scripts/materialize_e2e_fixture.mjs`
- `pnpm --dir app e2e:test`
- `pnpm --dir app test`
- `pytest`
- `pnpm test:e2e`
- `pnpm test:truth`
- `pnpm test:service-truth`
- `pnpm verify:gauntlet`
- any command using `--update`, `-u`, snapshot update modes, visual baseline update modes, or repair/normalization modes

## 7. Witness lanes
- repository posture
- fixture and harness contract
- Playwright harness witnesses
- seam and flag inspection
- retained-evidence root inspection
- skip and opt-in lane inspection
- historical and generated witness classification
- last-witness risk identification

## 8. Command-to-proof mapping
- `git status*` and `git log*` prove repository posture only
- `Get-Content` on authority and control files proves command declaration and scope only
- `rg` searches prove presence of gates, seams, and retained-evidence references only
- `Test-Path` proves existence of evidence roots only

## 9. Existing passes
- Visual baseline lane is opt-in via `VISUAL_STRICT=1`
- Full analytics e2e coverage is opt-in via `FULL_ANALYTICS_E2E=1`
- Real-service truth lane is opt-in via `BLACKSKIES_E2E_EXTERNAL_SERVICE=1`
- Vitest offline fallback exists if node modules are unavailable
- `check_e2e_fixture_contract.mjs` can validate fixture parity without mutating evidence

## 10. Existing failures
- No live suite failures were executed in this pass
- `scripts/offline-vitest-runner.mjs` warns that no mapped tests exit `0`, so a zero-result invocation is not a proof of success

## 11. Existing skips
- `app/tests/e2e/visual.home.spec.ts` skips unless `VISUAL_STRICT=1`
- `app/tests/e2e/gui.flows.spec.ts` contains `FULL_ANALYTICS_E2E` gated cases
- `app/tests/e2e/truth.real-service.spec.ts` skips unless `BLACKSKIES_E2E_EXTERNAL_SERVICE=1`

## 12. Environmental limitations
- Playwright Electron lanes depend on built app artifacts
- e2e and truth lanes depend on local backend startup and port `9999`
- Python-backed truth/service lanes depend on a working Python environment and backend imports
- visual baseline evidence is opt-in and cross-platform sensitive
- `scripts/run-vitest-offline.mjs` may degrade to the offline runner if dev dependencies are absent
- retained reports in `build/**` and `ci_artifacts/**` are historical unless rebound to current command, commit, and environment

## 13. Test-only seams
- `app/renderer/testMode/testModeManager.ts`
  - purpose: test-only mode flags and offline gating
  - active lane: renderer/test harness
  - production-leak risk: medium if flags are misread as runtime behavior
  - current guard: dataset flags such as `testForceOffline` and `testModeFreezeServiceHealth`
  - unresolved risk: defaults can be mistaken for product authority
- `app/renderer/testMode/testUISandbox.ts`
  - purpose: test-only UI sandbox
  - active lane: renderer/test harness
  - production-leak risk: medium
  - current guard: test-mode wiring only
  - unresolved risk: sandbox behavior must not become product behavior
- `app/tests/e2e/utils/serviceStubs.ts`
  - purpose: stub service responses and offline control
  - active lane: Playwright harness
  - production-leak risk: high if stubs are treated as live evidence
  - current guard: `BLACKSKIES_E2E_EXTERNAL_SERVICE` and test-mode wiring
  - unresolved risk: stubbed snapshot and recovery flows can overclaim runtime truth
- `app/tests/e2e/utils/testModeConfig.ts`
  - purpose: write `testMode` dataset markers for harness modes
  - active lane: Playwright harness
  - production-leak risk: medium
  - current guard: harness bootstrap only
  - unresolved risk: mode labels can be mistaken for product state
- `app/tests/e2e/_electron.fixture.ts`
  - purpose: Electron launch and teardown control
  - active lane: Playwright Electron harness
  - production-leak risk: medium
  - current guard: harness env and cleanup discipline
  - unresolved risk: harness success does not prove packaged behavior
- `app/playwright.config.ts`
  - purpose: harness configuration and preflight setup
  - active lane: Playwright harness
  - production-leak risk: low
  - current guard: global preflight and retain-on-failure settings
  - unresolved risk: report artifacts remain lane-bound only

## 14. Retained evidence roots
- `build/truth_receipts/**`
  - tracking status: untracked/generated
  - current/historical: historical unless rerun at current HEAD
  - proof lane: truth lane
  - last-witness risk: high
  - mutation authority: none for PKG-C
  - responsible package: later truth/evidence-specific execution if mutation is required
- `build/runtime_truth.json`
  - tracking status: tracked/source-controlled
  - current/historical: historical/generated evidence
  - proof lane: runtime-truth classification
  - last-witness risk: high
  - mutation authority: none for PKG-C
  - responsible package: later package owning runtime-truth semantics
- `build/runtime_truth.schema.json`
  - tracking status: tracked/source-controlled
  - current/historical: historical/generated evidence
  - proof lane: runtime-truth classification
  - last-witness risk: high
  - mutation authority: none for PKG-C
  - responsible package: later package owning runtime-truth semantics
- `ci_artifacts/**`
  - tracking status: mixed tracked and untracked
  - current/historical: historical
  - proof lane: CI proof summaries and diagnostics
  - last-witness risk: high
  - mutation authority: none for PKG-C
  - responsible package: later package or archive-later stage
- `app/tests/e2e/visual.home.spec.ts-snapshots/**`
  - tracking status: tracked/source-controlled
  - current/historical: retained visual witness
  - proof lane: visual harness
  - last-witness risk: high
  - mutation authority: none for PKG-C baseline capture
  - responsible package: later visual proof pass
- `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`
  - tracking status: tracked/source-controlled
  - current/historical: retained component witness
  - proof lane: IPC contract / renderer
  - last-witness risk: high
  - mutation authority: none for PKG-C baseline capture
  - responsible package: later renderer witness pass
- `sample_project/proj_esther_estate/**` and `sample_project/Esther_Estate/**`
  - tracking status: untracked/generated
  - current/historical: dependency-only evidence roots
  - proof lane: fixture/harness and alias parity
  - last-witness risk: high
  - mutation authority: none during baseline capture
  - responsible package: later separately authorized execution pass

## 15. Runtime-truth classification
- `services/tests/unit/test_runtime_truth.py` is a read-only classification witness only
- `build/runtime_truth.json` is a classification-only witness only
- `build/runtime_truth.schema.json` is a classification-only witness only
- PKG-C may inspect and classify these artifacts, but it may not change runtime claims, schema meaning, or broader semantic assertions
- changes involving analytics, provider calls, long-form execution, backup verification, Memory Lab, or other broader runtime claims must stop PKG-C and route to the responsible later package or an approved package split

## 16. Last-witness risks
- High risk: `build/truth_receipts/**`
- High risk: `build/runtime_truth.json`
- High risk: `build/runtime_truth.schema.json`
- High risk: `ci_artifacts/**`
- High risk: `app/tests/e2e/visual.home.spec.ts-snapshots/**`
- High risk: `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`
- High risk: sample-project verification artifacts under `sample_project/proj_esther_estate/**` and `sample_project/Esther_Estate/**`

## 17. Generated versus canonical evidence
- Git tracking status and evidence authority are separate properties
- tracked status does not make evidence product authority
- untracked or generated status does not make evidence disposable
- mixed roots require file-level inspection before mutation
- Generated output does not automatically become canonical evidence
- generated artifacts may still have last-witness risk
- historical reports remain historical unless rebound to the current commit and lane
- fixture regeneration requires a separately authorized execution pass
- prior witness evidence must be preserved before regeneration
- baseline capture must not mutate sample-project roots
- no retained evidence may be regenerated, deleted, normalized, or replaced during baseline capture
- `scripts/materialize_e2e_fixture.mjs` is a mutating dependency-side tool and is not authorized for baseline capture

## 18. Cross-package dependencies
- PKG-A: runtime identity, copy, restore, snapshot authority, and sample-alias retirement
- PKG-D: dev-versus-packaged and installed-versus-portable Electron path resolution
- PKG-E: queue, provider, model, telemetry, cache, budget, and hardware governance
- PKG-B: Writing Surface, Command Center, Companion, and coordinator reduction
- Stage 16: archive and cleanup execution

## 19. Unresolved baseline gaps
- exact PKG-C-scoped unit or schema command remains unresolved pending baseline discovery
- additional startup, smoke, contract, truth, and GUI selectors under `app/tests/e2e/**` remain unresolved until individually enumerated
- broad repo suites were not run as controlling evidence in this pass
- live failures were not executed in this pass
- fixture materialization was not run because it mutates dependency-only evidence roots

## 20. Negative-check candidates
- test-only flag used outside test mode
- fixture identity missing or ambiguous
- stale fixture treated as current
- weakened assertion producing a false green
- removal of the last surviving witness
- historical report cited as current runtime proof
- mocked behavior cited as packaged proof
- generated artifact treated as canonical evidence
- witness claim broader than the exercised lane

## 21. Baseline invalidation conditions
- a command would mutate controlled evidence
- a targeted witness lane must be widened beyond the chartered scope
- a last witness would be lost
- runtime-truth semantics must change
- fixture regeneration would be required during baseline capture
- package scope expands materially
- Stage 12 reopening becomes necessary
- a package split becomes necessary

## 22. Explicit not-proved statements
- correct runtime project identity is not proved
- safe persistence or recovery is not proved
- packaged or installer correctness is not proved
- queue restart behavior is not proved
- provider or model qualification is not proved
- hardware qualification is not proved
- Writing Surface or Command Center sovereignty is not proved
- release readiness is not proved

## 23. First-mutation readiness assessment
- Exact PKG-C mutation scope is partially known, but unresolved baseline gaps remain
- Required witnesses are available as read-only references, but not all target lanes were executed
- Last-witness risks are identified and documented
- Baseline commands inspected here are read-only and reproducible as inspections, but not all execution lanes were safely runnable
- Existing failures are distinguished from skip gates and from unexecuted lanes
- Additional bounded executable baseline discovery is required before the first mutation pass
- The next bounded activity should identify and execute at least one exact read-only PKG-C witness command
- No package split is required from this baseline alone
- Stage 12 reopening is not required from this baseline alone
- PKG-C mutation remains blocked

## 24. Baseline verdict
Baseline verdict: `Ready for review`

This baseline is evidence capture only. It does not authorize PKG-C execution.
