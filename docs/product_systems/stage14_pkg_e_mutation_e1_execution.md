# Stage 14 PKG-E Mutation E1 Execution

## 1. Repo gate result

- Verified on branch `salvage/minimal-two-surface-shell`.
- `git rev-parse HEAD` -> `407cc02ee6fc77038774345506badc0f8b7492bf`
- `git status -sb` showed `## salvage/minimal-two-surface-shell...origin/salvage/minimal-two-surface-shell`
- `git status --short` was empty before E1 execution.
- `git log -48 --oneline` included:
  - `407cc02 docs(product): scope PKG-E Mutation E1`
  - `00f6549 docs(product): capture Stage 14 PKG-E witnesses`
  - `8d187be docs(product): plan Stage 14 PKG-E witnesses`
  - `955cf53 docs(product): baseline Stage 14 PKG-E`
  - `2d82c55 docs(product): charter Stage 14 PKG-E`
  - `68d0e8d docs(product): close Stage 14 PKG-D`
- Gate verdict: passed. The branch was clean and synchronized at E1 execution start.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_e_charter.md`
- `docs/product_systems/stage14_pkg_e_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_e_witness_plan.md`
- `docs/product_systems/stage14_pkg_e_witness_execution.md`
- `docs/product_systems/stage14_pkg_e_mutation_e1_scope.md`

## 3. Files changed

- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
- `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
- `docs/product_systems/stage14_pkg_e_mutation_e1_execution.md`

No other files were modified.

## 4. Implementation summary

- Added a smallest-scope display-only recents identity cue in `ProjectHome` for the active recent entry when the active project has a valid canonical `projectId`.
- The recents button now renders `Project ID: <canonical id>` for the active valid-ID entry while preserving existing path and name display.
- The change does not alter loader behavior, diagnostics behavior, Project Details canonical-ID behavior, or remembered-path persistence rules.
- The change does not perform recents schema migration. Stored recent entries remain path/name/timestamp-only.

## 5. Tests changed

- `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
  - updated to require canonical `Project ID` visibility on the active recent entry
  - preserved the assertion that stored recents do not gain a `projectId` field
- `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
  - updated valid-ID remembered-path coverage to require canonical `Project ID` visibility on the recent entry
  - preserved the assertions that missing-ID projects still do not persist recents
  - preserved the assertions that stored recents do not gain a `projectId` field

## 6. Commands run and results

1. `git rev-parse HEAD`
   - result: `407cc02ee6fc77038774345506badc0f8b7492bf`
2. `git status -sb`
   - result: clean synchronized branch `## salvage/minimal-two-surface-shell...origin/salvage/minimal-two-surface-shell`
3. `git status --short`
   - result: empty before E1 execution
4. `git log -48 --oneline`
   - result: required E1 scope, witness capture, witness plan, baseline, charter, and PKG-D closure history present
5. `Get-Content docs/product_systems/stage14_pkg_e_charter.md`
   - result: confirmed PKG-E authority remains visibility/presentation-only
6. `Get-Content docs/product_systems/stage14_pkg_e_read_only_baseline.md`
   - result: confirmed recents/picker identity visibility was the candidate seam
7. `Get-Content docs/product_systems/stage14_pkg_e_witness_plan.md`
   - result: confirmed display-only, synthetic-data, no-scope-widening witness boundaries
8. `Get-Content docs/product_systems/stage14_pkg_e_witness_execution.md`
   - result: confirmed accepted contradiction was recents/picker identity visibility only
9. `Get-Content docs/product_systems/stage14_pkg_e_mutation_e1_scope.md`
   - result: confirmed E1 authorization was limited to the recents/picker contradiction
10. `Get-Content app/renderer/components/ProjectHome.tsx`
    - result: confirmed recents rendered name/path only before mutation
11. `Get-Content app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
    - result: confirmed the contradictory divergent valid-ID witness seam
12. `Get-Content app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
    - result: confirmed missing-ID remembered-path hygiene guardrails
13. `cmd /c pnpm --filter app test -- --run renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
    - result: exited `0`; `1` test file passed and `2` tests passed
14. `cmd /c pnpm --filter app test -- --run renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
    - result: exited `0`; `1` test file passed and `3` tests passed

## 7. Protected evidence posture

- Protected evidence was not touched:
  - `sample_project/proj_esther_estate/**`
  - `sample_project/Esther_Estate/**`
  - `build/truth_receipts/**`
  - `build/runtime_truth.json`
  - `build/runtime_truth.schema.json`
  - `ci_artifacts/**`
  - tracked snapshots
  - IPC snapshot evidence
  - real user projects

Synthetic test data only was used.

No protected sample projects were opened, loaded, or modified.

## 8. Scope compliance

- E1 stayed inside the authorized file list.
- No backend files were modified.
- No loader behavior was modified.
- No persistence or write-target behavior was modified.
- No recovery/restore/snapshot/export/draft behavior was modified.
- No `AnalyticsDashboard` code was modified.
- No recents schema migration was performed.
- No diagnostics mutation was made; diagnostics clarity remains contained.
- The change was display-only and limited to recents/picker identity visibility.

## 9. Residuals not resolved

- recovery/restore destination safety
- backend write-target behavior
- snapshot/export/draft write-target behavior
- loader diagnostics except scoped recents/picker clarity
- divergence warning behavior beyond recents/picker identity display
- App UI outside the scoped recents/picker surface
- remaining AppPreflight test-health residuals

## 10. Next required reassessment record

Next required reassessment record:

- `docs/product_systems/stage14_pkg_e_post_mutation_e1_reassessment.md`

That reassessment must verify whether:

- the recents/picker identity-visibility contradiction is resolved
- diagnostics clarity under divergence remains contained
- existing ProjectHome canonical `Project ID` details remain preserved
- missing-ID remembered-path hygiene remains preserved
- no new residuals were introduced

PZ_CONTINUE: PKG-E Mutation E1 ready for reassessment
