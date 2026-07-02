# Stage 14 PKG-C Passing Witness Baseline

## 1. Purpose
This record captures one exact, passing, read-only PKG-C witness command.

It preserves the prior failing fixture-contract executable baseline and adds a separate passing witness lane without authorizing mutation, fixture regeneration, snapshot updates, cleanup, archive execution, or release work.

## 2. Repository checkpoint
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Upstream: `origin/salvage/minimal-two-surface-shell`
- HEAD: `9869c05`
- Executable-baseline commit: `9869c05 docs(product): capture PKG-C executable baseline`
- Gate posture before passing-witness discovery: clean synchronized worktree, no ahead/behind discrepancy

## 3. Prior failing baseline preserved
Previously established failing executable witness remains preserved:
- `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
- prior bounded claim: the fixture-contract snapshot-structure lane fails because both `sample_project/proj_esther_estate/.snapshots/last_verification.json` and `sample_project/Esther_Estate/.snapshots/last_verification.json` are missing
- this passing-witness record does not repair, reinterpret, supersede, or erase that failing baseline

## 4. Candidate commands inspected
Inspected sources and declarations:
- `docs/product_systems/stage14_pkg_c_evidence_lane_witness_protection_charter.md`
- `docs/product_systems/stage14_pkg_c_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_c_executable_baseline.md`
- `docs/product_systems/stage14_salvage_execution_program.md`
- `docs/product_systems/stage12_evidence_retention_last_witness_contract.md`
- `app/package.json`
- `app/vitest.config.mjs`
- `scripts/run-vitest-offline.mjs`
- `scripts/offline-vitest-runner.mjs`
- `app/renderer/testSetup.ts`
- `app/renderer/vitest.setup.ts`
- `app/renderer/__tests__/IPCContracts.test.tsx`
- `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`

Equivalent-search result:
- `docs/product_systems/stage14_pkg_c_passing_witness_baseline.md` did not exist before this pass
- no other current PKG-C passing-witness baseline record was identified in bounded document search

## 5. Candidates rejected
- `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
  - rejected as the passing witness candidate because it is already preserved as a reproducible failing witness
- targeted Playwright witness commands
  - rejected because Playwright config writes `test-results` and `playwright-report` under the repository
- `pnpm --dir app test` without exact file selection
  - rejected because it is broader than needed for one passing PKG-C witness lane
- `pnpm --dir app test` through offline fallback conditions
  - rejected when fallback behavior is uncertain, because `scripts/offline-vitest-runner.mjs` can exit `0` with no mapped tests
- `pytest`
  - rejected because it is a broad suite and includes non-PKG-C scope
- `pnpm test:e2e`, `pnpm test:truth`, `pnpm test:service-truth`, and `pnpm verify:gauntlet`
  - rejected because they are broader lanes, mutating lanes, or cross package boundaries

## 6. Selected command
- `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
  - working directory: `C:\Dev\black-skies`
  - witness lane: renderer / IPC contract snapshot witness
  - reason selected: smallest exact assertion-bearing PKG-C witness candidate that can run through real Vitest, uses explicit file selection, reads an existing committed snapshot witness, does not require external services, and has deterministic non-zero-on-failure behavior

## 7. Safety inspection
- `scripts/run-vitest-offline.mjs` was inspected first
  - it prefers real Vitest if `vitest/node` exists
  - `app/node_modules/vitest` exists, so the offline no-test fallback is not the exercised path
- `scripts/offline-vitest-runner.mjs` was inspected to confirm the no-test risk that would apply only if Vitest were unavailable
- `app/vitest.config.mjs` limits execution to test files under `renderer/**/*.test.{ts,tsx}` and `main/**/*.test.{ts,tsx}`
- `app/renderer/testSetup.ts` and `app/renderer/vitest.setup.ts` install test stubs, DOM helpers, and cleanup hooks only; no repository writes were identified
- `app/renderer/__tests__/IPCContracts.test.tsx` performs three explicit assertions, including one snapshot assertion and two negative assertions around malformed payload and forbidden endpoint behavior
- `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap` exists as a committed snapshot witness, so the selected run did not require snapshot creation or update
- expected writes: none to fixtures, snapshots, reports, receipts, sample projects, or retained evidence

## 8. Execution result
- Pre-command `git status --short`: clean
- Command run:
  - `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
- Actual exit code: `0`
- Stdout summary:
  - `RUN v4.1.5 C:/Dev/black-skies/app`
  - `Test Files  1 passed (1)`
  - `Tests  3 passed (3)`
  - duration summary emitted by Vitest
- Files exercised:
  - `app/renderer/__tests__/IPCContracts.test.tsx`
  - `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`
  - `app/renderer/testSetup.ts`
  - `app/renderer/vitest.setup.ts`
- Post-command `git status --short`: clean
- Repository-controlled file changed: `No`

## 9. Validation evidence
- real test execution occurred through real Vitest, not the offline fallback
- file count: `1` test file passed
- test count: `3` tests passed
- assertions or validations evidenced by named test bodies:
  - stable IPC shapes snapshot comparison
  - malformed payload rejection before fetch
  - forbidden endpoint block before network attempt
- success is distinguishable from a no-op because Vitest emitted explicit file and test counts

## 10. Worktree before and after
- Worktree before command: clean
- Worktree after command: clean
- Report, snapshot, fixture, sample-project, receipt, or retained-evidence mutation observed: `No`

## 11. Passing witness claim
- Exact passing witness claim now protected:
  - the renderer IPC contract witness lane represented by `app/renderer/__tests__/IPCContracts.test.tsx` currently passes its committed snapshot and two guard assertions in a read-only run
- This passing witness proves only:
  - current stable IPC snapshot shape for the analytics and backup/export bridge payloads in that test
  - malformed backup payload rejection before fetch in that test
  - forbidden endpoint rejection before network attempt in that test

## 12. Claims not established
- No claim is established about runtime identity, persistence, recovery, packaged behavior, installer behavior, queue/provider/model behavior, or surface ownership
- No claim is established about Playwright harness execution
- No claim is established about runtime-truth semantic witnesses
- No claim is established about fixture-contract snapshot verification, which remains preserved as a separate failing witness
- No mutation authorization claim is established from this command

## 13. Environmental limits
- This witness depends on available app dev dependencies, including Vitest and renderer test setup packages
- The passing run is development-lane proof only and does not prove packaged or installer behavior
- The passing run uses a committed snapshot witness and test stubs; it does not prove production network or backend behavior

## 14. Negative-check candidate
- Concrete later negative check:
  - run the same IPC contract test logic against an isolated temporary copy where the allowed-endpoint set omits `analytics/summary`, and confirm the bridge guard fails before any network attempt
- This candidate is executable later in isolated temporary input without modifying repository-controlled files

## 15. Remaining witness gaps
- The prior failing fixture-contract snapshot-structure witness remains unresolved and preserved
- No passing Playwright witness has been recorded
- No passing fixture-contract witness has been recorded
- Runtime-truth artifacts remain classification-only and unexecuted as semantic witnesses
- Broader retained-evidence structure validation remains unexecuted
- Additional negative checks remain unexecuted

## 16. First-mutation readiness
- Was a passing command identified: `Yes`
- Did real validation or assertions execute: `Yes`
- Did the worktree remain unchanged: `Yes`
- Is the command reproducible: `Yes`, in the current dev-dependency-equipped environment
- What exact witness claim is now protected:
  - the targeted renderer IPC contract snapshot witness currently passes in a bounded read-only run with `1` file and `3` tests passing
- What prior failing witness remains preserved:
  - the fixture-contract snapshot-structure command still fails because both sample-project roots lack `.snapshots/last_verification.json`
- Is there now enough executable evidence to define the first mutation: `Not yet`
- What exact mutation candidate, if any, is supported:
  - no mutation candidate is authorized in this pass; at most, the record supports future evidence-lane hardening scoped to renderer IPC witness classification after separate review
- Is another baseline pass required: `Yes`
- PKG-C mutation remains blocked: `Yes`

## 17. Split assessment
- No package split is required from this passing-witness baseline alone

## 18. Stage 12 reopening assessment
- Stage 12 reopening is not required from this passing-witness baseline alone

## 19. Explicit verdict
Passing witness baseline verdict: `Passing witness baseline ready for review`

This record captures bounded passing-witness evidence only. It does not authorize PKG-C mutation, fixture regeneration, snapshot replacement, or later-package execution.
