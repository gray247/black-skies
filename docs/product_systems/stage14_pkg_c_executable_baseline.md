# Stage 14 PKG-C Executable Baseline

## 1. Purpose
This record captures bounded executable baseline discovery for PKG-C.

It converts the prior inspection-only baseline into executable read-only evidence for one exact PKG-C witness lane without authorizing mutation, fixture regeneration, snapshot updates, cleanup, archive execution, or release work.

## 2. Repository checkpoint
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Upstream: `origin/salvage/minimal-two-surface-shell`
- HEAD: `f20e34c`
- Baseline commit: `f20e34c docs(product): capture PKG-C read-only baseline`
- Gate posture before executable discovery: clean synchronized worktree, no ahead/behind discrepancy

## 3. Candidate commands inspected
Inspected command declarations and control surfaces:
- `package.json`
- `app/package.json`
- `pytest.ini`
- `app/vitest.config.mjs`
- `app/playwright.config.ts`
- `scripts/check_e2e_fixture_contract.mjs`
- `scripts/run-vitest-offline.mjs`
- `scripts/offline-vitest-runner.mjs`
- `docs/product_systems/stage14_pkg_c_evidence_lane_witness_protection_charter.md`
- `docs/product_systems/stage14_pkg_c_read_only_baseline.md`
- `docs/product_systems/stage14_salvage_execution_program.md`
- `docs/product_systems/stage12_evidence_retention_last_witness_contract.md`

Equivalent-search result:
- `docs/product_systems/stage14_pkg_c_executable_baseline.md` did not exist before this pass
- no other current PKG-C executable-baseline record was identified in bounded document search

## 4. Commands rejected and why
- `scripts/materialize_e2e_fixture.mjs`
  - rejected because it materializes fixture content and writes dependency-only sample-project and snapshot evidence
- `pnpm --dir app exec playwright test tests/e2e/gui-contract.spec.ts --project=electron --workers=1 --reporter=list --trace=on`
  - rejected because Playwright config writes `test-results` and `playwright-report` under the repository and depends on built Electron artifacts
- `pnpm --dir app exec playwright test tests/e2e/visual.home.spec.ts --project=electron --workers=1 --reporter=list --trace=on`
  - rejected because it writes Playwright outputs, depends on built Electron artifacts, and the visual lane is opt-in
- `pnpm --dir app test`
  - rejected because `scripts/run-vitest-offline.mjs` can fall back to `scripts/offline-vitest-runner.mjs`, and the offline runner can exit `0` with no mapped tests
- `pytest`
  - rejected because it is a broad suite rather than a narrowly bounded PKG-C witness command
- `pnpm test:e2e`
  - rejected because `scripts/e2e-with-backend.mjs` materializes fixtures, starts backend services, and crosses package boundaries
- `pnpm test:truth`
  - rejected because `scripts/truth-with-backend.mjs` writes receipts and broader runtime-truth evidence
- `pnpm test:service-truth`
  - rejected because it crosses into broader truth and service-runtime semantics
- `pnpm verify:gauntlet`
  - rejected because it is a broad dependency lane rather than a bounded PKG-C witness command

## 5. Commands selected
- `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
  - reason selected: smallest exact command derived from the charter baseline list that executes real validations, reads dependency-only sample-project witnesses, does not regenerate fixtures, does not update snapshots, and has an interpretable exit result
  - proof lane: fixture contract verification
  - expected result: validate fixture outline structure, snapshot structure, and alias parity without changing repository files

## 6. Pre-execution safety checks
- Script inspection confirmed `scripts/check_e2e_fixture_contract.mjs` only uses read APIs such as `existsSync` and `readFileSync`, plus optional `fetch` only when `--base-url` is supplied
- The selected command was run without `--base-url`, so it did not depend on backend startup or external services
- The script contains no fixture materialization, snapshot update, normalization, cleanup, or write calls
- Pre-command worktree state was recorded with `git status --short`
- Post-command worktree state was recorded with `git status --short`

## 7. Commands executed
| Command | Working directory | Reason selected | Proof lane | Expected result |
| --- | --- | --- | --- | --- |
| `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate` | `C:\Dev\black-skies` | smallest exact read-only PKG-C witness command with deterministic exit behavior | fixture contract verification | validate fixture outline structure, snapshot structure, and alias parity without mutating evidence |

## 8. Exit codes and results
| Command | Exit code | Stdout or stderr summary | Files exercised | Result | Limitation |
| --- | --- | --- | --- | --- | --- |
| `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate` | `1` | failed with `invalid sample snapshot fixtures`; both harness and truth roots reported `.snapshots/last_verification.json` missing | `sample_project/proj_esther_estate/**`, `sample_project/Esther_Estate/**`, their `project.json`, `outline.json`, `drafts/`, `.snapshots/`, and `last_verification.json` expectations | real validation executed and produced bounded failing evidence for the fixture snapshot witness lane | execution stopped at snapshot verification, so later alias-parity and analytics branches were not reached |

## 9. Assertion or validation counts where available
- real validation executed against `2` fixture roots: `harness` and `truth`
- snapshot validation executed against `2` snapshot roots and reported `2` missing `last_verification.json` artifacts
- outline validation, required snapshot-directory validation, and alias-parity logic are present in the script
- this run did not reach alias-parity completion because snapshot verification failed first
- the script does not emit a formal assertion count, so proof is bounded to the observed validation branches and exit result

## 10. Git status before and after
- Pre-command `git status --short`: clean
- Post-command `git status --short`: clean
- Repository file changed: `No`

## 11. Witness claims established
- An exact PKG-C executable witness command was identified and run
- The command is reproducible and read-only in the exercised form used here
- The fixture-contract lane currently fails at snapshot verification because `sample_project/proj_esther_estate/.snapshots/last_verification.json` and `sample_project/Esther_Estate/.snapshots/last_verification.json` are missing
- This command proves only fixture-contract and snapshot-structure expectations for the two dependency-only sample-project roots
- The result is interpretable and bounded to the exercised fixture-contract lane

## 12. Claims not established
- No claim is established about runtime identity, persistence, recovery, packaged behavior, queue/provider behavior, or surface ownership
- No claim is established that alias parity passes, because execution stopped before that branch completed
- No claim is established about analytics preflight, because the command was intentionally run without `--base-url`
- No claim is established for Playwright, renderer, IPC snapshot, runtime-truth semantics, or broad regression lanes
- No mutation readiness claim is established from this command alone

## 13. Environmental limits
- The selected command depends on the current sample-project fixture state already present in the repository working tree
- The selected command does not require backend startup, built Electron artifacts, or external services in the form used here
- Broader harness lanes remain limited by Playwright output writes, Electron build requirements, backend startup, and opt-in gates

## 14. Negative-check candidates
- run the same fixture-contract validator against an isolated temporary copy with one required snapshot verification artifact removed
- run the validator against an isolated temporary copy with an invalid `outline_id`
- run the validator against an isolated temporary copy with harness/truth alias mismatch
- detect offline-runner no-test success as non-proof before selecting any Vitest-based witness lane

These candidates remain unexecuted because they require isolated temporary copies or a separate bounded pass.

## 15. Remaining executable gaps
- no passing executable PKG-C witness command has yet been recorded in this package
- renderer and IPC witness lanes remain unexecuted
- targeted Playwright witness lanes remain unexecuted because they would write repository-controlled outputs
- runtime-truth artifacts remain classification-only and unexecuted as semantic witnesses
- negative checks remain unexecuted
- broader suite results remain intentionally outside controlling PKG-C proof

## 16. First-mutation readiness
- At least one executable witness command was identified: `Yes`
- At least one executable witness command was run: `Yes`
- Real validation executed: `Yes`
- Worktree remained unchanged: `Yes`
- One witness lane is now baselined: `Yes`, the fixture-contract snapshot-structure lane
- Exact claim now protected: the current sample-project fixture lane lacks the expected `last_verification.json` snapshot witness in both harness and truth roots
- What remains unexecuted: renderer, IPC snapshot validation, Playwright harness execution, runtime-truth semantic witnesses, and bounded negative checks
- Another executable baseline pass is required: `Yes`
- The first mutation scope is concrete enough to authorize: `No`
- PKG-C mutation remains blocked: `Yes`

## 17. Package split assessment
- No package split is required from this executable baseline alone

## 18. Stage 12 reopening assessment
- Stage 12 reopening is not required from this executable baseline alone

## 19. Explicit verdict
Executable baseline verdict: `Executable baseline ready for review`

This record captures executable evidence only. It does not authorize PKG-C mutation, fixture regeneration, snapshot replacement, or later-package execution.
