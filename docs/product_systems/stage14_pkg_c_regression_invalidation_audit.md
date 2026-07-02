# Stage 14 PKG-C Regression and Invalidation Audit

## 1. Purpose and checkpoint

Perform a combined read-only regression and invalidation audit for PKG-C after committed Mutation C1 and the later PKG-C assessments.

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- HEAD: `e01f14f docs(product): assess PKG-C stale retained evidence`

## 2. Records inspected

- `docs/product_systems/stage14_pkg_c_evidence_lane_witness_protection_charter.md`
- `docs/product_systems/stage14_pkg_c_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_c_executable_baseline.md`
- `docs/product_systems/stage14_pkg_c_passing_witness_baseline.md`
- `docs/product_systems/stage14_pkg_c_first_mutation_scope.md`
- `docs/product_systems/stage14_pkg_c_c2_necessity_assessment.md`
- `docs/product_systems/stage14_pkg_c_witness_production_stale_evidence_assessment.md`
- `scripts/check_e2e_fixture_contract.mjs`

## 3. Commands executed

### Executed exactly as requested

- `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
  - exit: `1`
  - result: known failing fixture witness reproduced
  - worktree change: none

- `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
  - exit: `0`
  - result: `1` test file passed, `3` tests passed
  - offline no-test fallback: not exercised; real Vitest ran
  - worktree change: none

### Path-resolution audit

- Prior correction attempt failed because the replacement command string used a Markdown-corrupted wildcard form instead of a literal expanded `__tests__` path.
- Relative candidate tested:
  - `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
  - exit: `0`
  - result: `1` test file passed, `3` tests passed
  - offline no-test fallback: not exercised; real Vitest ran
  - worktree change: none
- Repository-root candidate tested:
  - `node .\scripts\run-vitest-offline.mjs app/renderer/__tests__/IPCContracts.test.tsx`
  - exit: `0`
  - result: `1` test file passed, `3` tests passed
  - offline no-test fallback: not exercised; real Vitest ran
  - worktree change: none
- Authoritative command selected:
  - `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
  - reason: `scripts/run-vitest-offline.mjs` sets Vitest `root` to `app`, and `app/vitest.config.mjs` includes `renderer/**/*.test.{ts,tsx}` relative to that app root

## 4. Regression results

### Mutation C1 regression result

Confirmed preserved:

- accepted validator CLI
- harness-root derivation
- truth-root derivation
- validation order
- receipt requirements
- failure threshold
- exit-code meaning
- early stop before alias parity
- read-only behavior
- protected sample roots and retained evidence

Confirmed changed:

- diagnostics only

The failing fixture witness still exits `1` and now explicitly reports:

- missing harness receipt
- missing truth receipt
- both canonical verification receipts missing
- alias parity not reached because prerequisite receipt validation failed first

## 5. Protected-evidence result

No repository-controlled file changed during this audit.

Protected evidence remained unchanged:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- visual snapshots
- IPC snapshot witnesses
- producer scripts
- runtime code
- package configuration

## 6. Record-by-record invalidation matrix

| Record | Current status | Audit result | Notes |
| --- | --- | --- | --- |
| Read-only baseline | still relevant | confirmed and narrowed | dependency-only retained roots and optional broader evidence claims remain valid; later Git classification was narrowed to untracked/generated |
| Failing executable baseline | still relevant | confirmed | failing fixture witness remains reproducible, bounded, and read-only |
| Passing IPC witness baseline | still relevant | confirmed | literal expanded `renderer/__tests__/IPCContracts.test.tsx` path resolves correctly under the wrapper and preserves the bounded IPC witness claim |
| First-mutation scope | still relevant | confirmed | retained IPC regression witness command is literal, expanded, and remains a guard only |
| C2 necessity assessment | still relevant | confirmed | carries the same authoritative literal expanded IPC witness command and preserved bounded claim |
| Stale-retained-evidence assessment | current record | confirmed | no contradiction found in its main stale-evidence and no-mutation conclusions |

## 7. Confirmed claims

- Mutation C1 is committed and preserves validator semantics while changing diagnostics only.
- The known failing fixture witness remains reproducible and bounded.
- Both retained roots still lack `.snapshots/last_verification.json`.
- The known failing witness remains dependency-only and stale-retained-evidence scoped.
- The authoritative IPC witness command is `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`.
- The authoritative IPC witness passes with exit `0`, `1` file, and `3` tests.
- C2 remains deferred and unauthorized.
- Producer proof remains only partially sufficient.
- No package split is required.
- No Stage 12 reopening is required.
- Repair/regeneration ownership remains unresolved pending Stage 14 integration/closure review.

## 8. Narrowed or superseded claims

- Git classification for both retained roots is now narrowed to `untracked/generated in the current repository state`.
- Earlier audit wording is narrowed:
  - the Markdown-corrupted wildcard form was wrong
  - the literal expanded relative command is authoritative
  - the repository-root candidate also passes, but it is less consistent with the wrapper root and Vitest include configuration

## 9. Contradictions

No material contradiction remains after validating both literal expanded candidates, selecting the wrapper-consistent authoritative command, and confirming the affected PKG-C records already preserve that command.

## 10. Unresolved items

- deferred repair/regeneration ownership remains unresolved until the Stage 14 integration/closure review assigns or preserves it explicitly
- no passing retained-root fixture witness exists

## 11. Known failing witness

Known failing witness to preserve:

- `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`

Current bounded interpretation:

- exit code `1`
- both retained roots lack `.snapshots/last_verification.json`
- diagnostics identify both missing receipts
- alias parity was not reached
- no repository mutation

## 12. Passing witness

Underlying passing witness lane:

- `app/renderer/__tests__/IPCContracts.test.tsx`

Current read-only result:

- Historical passing witness lane recorded in prior PKG-C evidence:
  - `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
  - exit code `0`
  - `1` test file passed
  - `3` tests passed
  - no repository mutation

## 13. Deferred ownership

- repair/regeneration ownership for retained sample-root evidence remains unresolved
- current records correctly defer it to the Stage 14 cross-package integration and closure review for assignment or explicit carry-forward

## 14. Split and Stage 12 assessment

- Package split required: No
- Stage 12 reopening required: No

Reason:

- both literal expanded IPC candidates were verified read-only and passing
- the authoritative wrapper-consistent command is now explicit
- no producer/validator lifecycle contradiction was introduced
- no unauthorized mutation occurred

## 15. Closure readiness

PKG-C is ready for its closure record.

Reason:

- C1 remains committed and reviewed
- the authoritative IPC witness command passes with exit `0`, `1` file, and `3` tests
- the failing fixture witness remains reproducible, bounded, and unchanged
- earlier witness claims are now internally consistent
- no unauthorized mutation occurred
- C2 remains deferred
- unresolved repair/regeneration ownership remains explicitly carried to the Stage 14 integration/closure review

## 16. Explicit verdict

Audit verdict: `PKG-C ready for closure record`
