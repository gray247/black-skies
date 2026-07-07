# Stage 14 PKG-E Witness Execution

## 1. Repo gate result

- Verified on branch `salvage/minimal-two-surface-shell`.
- `git rev-parse HEAD` -> `8d187be483e8953fb110aded821ff7a0752f4db0`
- `git status -sb` showed `## salvage/minimal-two-surface-shell...origin/salvage/minimal-two-surface-shell`
- `git status --short` was empty before witness execution.
- `git log -40 --oneline` included:
  - `8d187be docs(product): plan Stage 14 PKG-E witnesses`
  - `955cf53 docs(product): baseline Stage 14 PKG-E`
  - `2d82c55 docs(product): charter Stage 14 PKG-E`
  - `68d0e8d docs(product): close Stage 14 PKG-D`
- Gate verdict: passed. The branch was clean and synchronized at witness-execution start.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_e_charter.md`
- `docs/product_systems/stage14_pkg_e_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_e_witness_plan.md`

## 3. Witness lanes executed

- Lane A: recents / picker identity visibility under divergent valid-ID conditions
- Lane B: diagnostics clarity under divergent identity/path presentation

Execution stayed inside the existing synthetic divergent-valid-ID renderer witness seam.

## 4. Files changed

- `docs/product_systems/stage14_pkg_e_witness_execution.md`

No production code changed.

No test files changed.

## 5. Commands run and results

1. `git rev-parse HEAD`
   - result: `8d187be483e8953fb110aded821ff7a0752f4db0`
2. `git status -sb`
   - result: clean synchronized branch `## salvage/minimal-two-surface-shell...origin/salvage/minimal-two-surface-shell`
3. `git status --short`
   - result: empty before witness execution
4. `git log -40 --oneline`
   - result: required PKG-E witness-plan, baseline, charter, and PKG-D closure history present
5. `Get-Content docs/product_systems/stage14_pkg_e_charter.md`
   - result: confirmed PKG-E authority is limited to visibility / diagnostics / presentation
6. `Get-Content docs/product_systems/stage14_pkg_e_read_only_baseline.md`
   - result: confirmed lane A and lane B were the only justified witness lanes
7. `Get-Content docs/product_systems/stage14_pkg_e_witness_plan.md`
   - result: confirmed witness method, exclusions, and contradiction criteria
8. `Get-Content app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
   - result: confirmed the existing synthetic witness already exercises both PKG-E lanes
9. `Get-Content app/renderer/components/ProjectHome.tsx`
   - result: confirmed recents render name/path only, Project Details render canonical `Project ID`, and diagnostics expose story snapshot text
10. `cmd /c pnpm --filter app test -- --run app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
   - result: exited `1` because the file selector was incorrect relative to the `app` Vitest root; no product contradiction inferred from this path error
11. `cmd /c pnpm --filter app test -- --run renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
   - result: exited `0`; `1` test file passed and `2` tests passed
12. `rg -n "project-home__recent-name|project-home__recent-path|Project ID|Story snapshot details|recent-projects|projectId" app/renderer/components/ProjectHome.tsx`
   - result: confirmed recents name/path rendering, diagnostics textarea, and canonical `Project ID` details locations
13. `rg -n "recentProjectButton|storedRecents|Story snapshot details|Project ID|divergence|mismatch|activeProjectPath|activeProjectName|projectId" app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
   - result: confirmed exact witness assertions for recents omission, stored recents omission, Project Details canonical ID visibility, and diagnostics omission

## 6. Recents/picker identity visibility result

Result: contradiction proved.

Accepted witness evidence:

- `ProjectHomeDivergenceVisibilityWitness.test.tsx` passed with a divergent valid-ID synthetic project where `path` and `name` presentation diverged from canonical metadata `projectId`.
- The witness proved ProjectHome shows canonical `Project ID` after load.
- The same witness also proved the recent-project button does not include canonical `projectId`.
- The same witness proved persisted recents contain `path` and `name` only and do not store `projectId`.
- `ProjectHome.tsx` statically confirms the recent-project list renders only:
  - `project-home__recent-name`
  - `project-home__recent-path`

Witness interpretation:

- The user-facing recent/openable surface remains path/name-authoritative in presentation even when canonical identity diverges.
- Because the recents/picker-facing seam is exactly the pre-action identity surface, omission of canonical `projectId` there is not merely incomplete metadata storage. It is a user-facing identity-authority contradiction under the PKG-E lane definition.

## 7. Diagnostics clarity result

Result: contained.

Accepted witness evidence:

- `ProjectHomeDivergenceVisibilityWitness.test.tsx` passed and proved ProjectHome details render:
  - `Project ID`
  - the canonical `project.projectId`
- The same witness proved the diagnostics snapshot contains:
  - `"activeProjectPath"`
  - `"activeProjectName"`
  - and does not contain the canonical `projectId`
- `ProjectHome.tsx` statically confirms:
  - canonical `Project ID` appears in the Project Details card
  - diagnostics are exposed through the `Story snapshot details` textarea

Witness interpretation:

- The diagnostics payload itself omits canonical `projectId`.
- However, under the executed PKG-E seam, the same ProjectHome presentation also exposes canonical `Project ID` clearly in the visible Project Details area.
- No accepted witness proved that the user-facing diagnostic/presentation surface as a whole becomes identity-authority contradictory in this lane.
- The omission remains a presentation limitation, but the executed witness supports containment rather than a second proved contradiction.

## 8. Classification

- Lane A recents/picker identity visibility: contradiction proved
- Lane B diagnostics clarity under divergence: contained
- Remaining broader App UI identity coverage: unresolved but not contradicted
- No lane result was inconclusive in this execution

## 9. Protected evidence posture

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

No protected sample projects were opened or modified.

## 10. Excluded seams preserved

- No backend write-target behavior was modified or re-scoped.
- No recovery/restore/snapshot/export/draft write-target behavior was modified or re-scoped.
- No runtime persistence architecture was modified or re-scoped.
- No ProjectHome behavior or App behavior was modified.
- No AppPreflight repair work was performed.
- No scope widening into PKG-B or Stage 15 occurred.

## 11. Whether mutation scope is required

Yes.

Reason:

- Lane A produced an accepted user-facing contradiction inside PKG-E authority.
- The contradiction is bounded to recents/picker identity visibility under divergent valid-ID conditions.
- A later mutation-scope record is required before any fix work.

## 12. Whether closure preparation is eligible

No.

Reason:

- PKG-E now has an active accepted contradiction in-scope.
- Closure preparation is not eligible while that contradiction remains open and no mutation-scope decision has been recorded.

PZ_CONTINUE: PKG-E mutation scope required
