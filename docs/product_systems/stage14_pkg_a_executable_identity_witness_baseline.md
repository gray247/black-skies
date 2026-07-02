# Stage 14 PKG-A Executable Identity-Witness Baseline

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified PKG-A baseline commit: `f51370407ec219d2bc4ced28a29a6b073c1160fb`
- Verified PKG-A baseline commit subject: `docs(product): establish PKG-A identity persistence baseline`
- Starting `HEAD` for this executable baseline pass: `f51370407ec219d2bc4ced28a29a6b073c1160fb`

## 2. Purpose and scope

This record establishes a bounded executable baseline for current runtime identity and active-project selection behavior before any PKG-A mutation scope is proposed.

This pass is limited to:

1. checkpoint verification;
2. safe executable witnesses using existing targeted tests;
3. source-level behavior checks where no comparably safe executable seam was available;
4. preservation of protected evidence and real project roots.

This pass does not authorize Mutation A1 or any implementation change.

## 3. Controlling authority

Controlling records inspected:

1. `docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md`
2. `docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`
3. `docs/product_systems/stage12_project_identity_binding_contract.md`
4. `docs/product_systems/project_persistence_local_save.md`
5. `docs/product_systems/snapshot_protected_recovery_contract.md`
6. `docs/product_systems/stage14_pkg_c_closure_record.md`

Authority posture preserved:

1. runtime behavior is evidence, not product authority;
2. Stage 12 remains the controlling identity doctrine;
3. save authority remains distinct from snapshot and recovery history;
4. PKG-C did not close runtime identity or persistence correctness;
5. Mutation A1 remains unauthorized.

## 4. Protected-evidence boundary

This pass did not mutate, regenerate, normalize, replace, or delete:

1. `sample_project/proj_esther_estate/**`
2. `sample_project/Esther_Estate/**`
3. `build/truth_receipts/**`
4. `build/runtime_truth.json`
5. `build/runtime_truth.schema.json`
6. `ci_artifacts/**`
7. tracked visual snapshots
8. IPC snapshot evidence

This pass did not run fixture materialization, create receipts, or execute recovery or restore against retained project roots.

## 5. Witness-selection rationale

The selected witness set was the smallest useful set that answered current PKG-A baseline questions without mutating protected or real project state.

Selected executable witnesses:

1. valid identity load through the existing loader-authoritative `ProjectHome` seam;
2. remembered-path reopen input through the offline recovery action seam;
3. recovery targeting through the existing `useRecovery` seam.

Source-only checks were used for:

1. missing identity behavior, because no comparably safe existing executable seam was available without adding temporary harness code;
2. renderer path-derived fallback identity, because the fallback function is internal to `App.tsx` and no isolated existing witness targeted it directly;
3. path/ID divergence visibility or rejection posture, because no safe existing executable seam isolated that scenario without writing custom fixtures or altering tests.

## 6. Commands executed

Repository verification commands:

1. `git rev-parse HEAD`
2. `git status -sb`
3. `git status --short`
4. `git log -8 --oneline`
5. `git show --stat --name-only --format=fuller f513704`
6. `git ls-tree -r --name-only f513704 docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`

Witness-selection inspection commands:

1. `rg -n -C 3 "deriveProjectIdFromPath|project.projectId \?\? deriveProjectIdFromPath|blackskies.last-project|reopenRequest|lastProjectPath|restoreSnapshot\(|projectId: input.projectSummary.projectId|createProject|loadProject\(|project.json|project_id" app/main/projectLoaderIpc.ts app/shared/ipc/projectLoader.ts app/electron/projectLoader.ts app/renderer/App.tsx app/renderer/components/ProjectHome.tsx app/renderer/hooks/useRecovery.ts app/renderer/recovery/actions.mjs services/src/blackskies/services/routers/recovery.py app/renderer/__tests__/ProjectHome.test.tsx app/renderer/__tests__/useRecovery.test.tsx app/offline-tests/AppRecovery.offline.test.mjs`
2. `rg -n -C 2 "vitest|test:|offline-tests|tsx|loader" package.json app/package.json pnpm-workspace.yaml`
3. `Get-ChildItem app\node_modules\.bin | Select-Object -ExpandProperty Name`

Executed witness commands:

1. `cmd /c pnpm --filter app test -- --run app/renderer/__tests__/ProjectHome.test.tsx --testNamePattern "creates a blank project through the loader-authoritative bootstrap path"`
2. `node app/offline-tests/AppRecovery.offline.test.mjs`
3. `cmd /c pnpm --filter app test -- --run renderer/__tests__/ProjectHome.test.tsx --testNamePattern "creates a blank project through the loader-authoritative bootstrap path"`
4. `cmd /c pnpm --filter app test -- --run renderer/__tests__/useRecovery.test.tsx --testNamePattern "restores snapshots and updates the recovery status"`
5. `node --test --test-name-pattern "evaluateReopenRequest returns request payload when allowed" app/offline-tests/AppRecovery.offline.test.mjs`

## 7. Exact results

### 7.1 Command 1

- Exit code: `1`
- Files exercised: intended `app/renderer/__tests__/ProjectHome.test.tsx`
- Fixture or temporary-directory setup: none
- Anything written: none observed
- Observed behavior: Vitest reported `No test files found` because the file argument used the repository-relative path instead of the app-relative path expected by the app test runner.
- Expected behavior from current source: not applicable as a runtime identity result; this was a command-path selection failure.
- What it proves: the original command path was wrong for the app-local Vitest include pattern.
- What it does not prove: any identity behavior.
- Protected-evidence impact: none
- Cleanup performed: none required

### 7.2 Command 2

- Exit code: `1`
- Files exercised: `app/offline-tests/AppRecovery.offline.test.mjs`, `app/renderer/recovery/actions.mjs`
- Fixture or temporary-directory setup: none
- Anything written: none observed
- Tests passed or failed: `8` passed, `2` failed
- Observed behavior:
  1. `evaluateReopenRequest returns request payload when allowed` passed.
  2. `performRestoreSnapshot returns updated recovery status on success` failed because the expected toast title in the offline test is stale.
  3. `validateRestoreSnapshot surfaces toast when services are offline` failed because the expected offline toast text is stale.
- Expected behavior from current source:
  1. `performRestoreSnapshot()` calls `services.restoreSnapshot({ projectId: input.projectSummary.projectId })`.
  2. `evaluateReopenRequest()` returns `{ path: options.lastProjectPath, requestId }` when allowed.
- What it proves: the offline seam remains usable for reopen-input behavior; some offline expectations are stale relative to current user-facing recovery text.
- What it does not prove: end-to-end recovery correctness or wrong-project protection under path/ID divergence.
- Protected-evidence impact: none
- Cleanup performed: none required

### 7.3 Command 3

- Exit code: `0`
- Files exercised: `app/renderer/__tests__/ProjectHome.test.tsx`, `app/renderer/components/ProjectHome.tsx`, mocked loader bridge surface
- Fixture or temporary-directory setup: test-local mocks only
- Anything written: browser-like test local storage inside the test environment only
- Tests passed or failed: `1` passed, `26` skipped by name filter
- Observed behavior: the selected test passed and exercised the loader-authoritative bootstrap path for a created blank project with loader-supplied `projectId`.
- Expected behavior from current source: `ProjectHome` should accept the loader response and reload the created project through `loadProjectAtPath(response.project.path, ...)`.
- What it proves: current executable behavior preserves loader-supplied project identity on the valid create/load path used by the renderer home surface.
- What it does not prove: missing-identity handling, backend save destination, or path/ID mismatch rejection.
- Protected-evidence impact: none
- Cleanup performed: Vitest process exited cleanly; no repository writes observed

### 7.4 Command 4

- Exit code: `0`
- Files exercised: `app/renderer/__tests__/useRecovery.test.tsx`, `app/renderer/hooks/useRecovery.ts`, mocked services bridge
- Fixture or temporary-directory setup: in-test mocked services only
- Anything written: none outside the test environment
- Tests passed or failed: `1` passed, `2` skipped by name filter
- Observed behavior: the selected test passed and confirmed that restore-snapshot handling updates recovery status successfully through the current hook seam.
- Expected behavior from current source: `useRecovery` should validate `projectSummary`, call the action helper, and update recovery status on success.
- What it proves: the current hook-level recovery witness is executable and passing for the success path.
- What it does not prove: backend overwrite safety against path/ID divergence or product-authority compliance for restore-as-current.
- Protected-evidence impact: none
- Cleanup performed: Vitest process exited cleanly; no repository writes observed

### 7.5 Command 5

- Exit code: `0`
- Files exercised: `app/offline-tests/AppRecovery.offline.test.mjs`, `app/renderer/recovery/actions.mjs`
- Fixture or temporary-directory setup: none
- Anything written: none
- Tests passed or failed: `1` passed
- Observed behavior: the selected test passed and confirmed that `evaluateReopenRequest()` returns a reopen request payload whose input path comes from remembered `lastProjectPath`.
- Expected behavior from current source: the action helper should return `{ path: options.lastProjectPath, requestId }` when recovery is idle and a remembered path exists.
- What it proves: remembered path state can become reopen input.
- What it does not prove: automatic reopen on restart, canonical identity rebinding, or backend destination safety.
- Protected-evidence impact: none
- Cleanup performed: none required

## 8. Valid identity-load result

Result:

1. renderer-flow behavior confirmed by executable witness;
2. disk-loader metadata behavior confirmed by source inspection;
3. integrated disk-backed load behavior unresolved.

Evidence:

1. Command 3 passed.
2. The targeted `ProjectHome` test proves that the mocked create/load path preserves and uses a supplied `projectId` in renderer flow.
3. Source inspection confirms the main-process loader reads `project.json.project_id` in `app/main/projectLoaderIpc.ts`.

Conclusion:

The targeted renderer test confirms that the mocked create/load path preserves and uses a supplied `projectId` in renderer flow. Separately, source inspection confirms that `app/main/projectLoaderIpc.ts` reads `project.json.project_id` and maps it into returned project metadata. This pass did not execute an integrated disk-backed witness proving preservation of `project.json.project_id` through the real loader path.

## 9. Missing-identity result

Result: confirmed by source inspection; executable witness not safely executed in this pass.

Evidence:

1. `app/main/projectLoaderIpc.ts` `readProjectMetadata()` returns `{}` when `project.json` is missing or unreadable.
2. `loadProjectFromDisk()` sets `project.projectId = metadata.projectId`, so a metadata-missing load can return a project with no `projectId`.
3. The read-only PKG-A baseline already identified an isolated temporary-fixture witness as a candidate, but no existing committed executable seam targeted that behavior directly without adding temporary harness code.

Conclusion:

Missing identity remains a real current behavior seam, but this pass did not execute it because no comparably safe existing executable witness was available under the no-test-edit and no-temporary-harness constraints used here.

## 10. Path-derived fallback result

Result: confirmed by source inspection; no isolated executable witness was selected in this pass.

Evidence:

1. `app/renderer/App.tsx` defines `deriveProjectIdFromPath(path)`.
2. The active renderer load path uses `const projectId = project.projectId ?? deriveProjectIdFromPath(project.path);`.

Conclusion:

The renderer currently derives fallback identity from the project-path basename when loader metadata does not supply `projectId`.

## 11. Remembered-path or restart-input result

Result: confirmed by executable witness and source inspection.

Evidence:

1. Command 5 passed.
2. `app/renderer/recovery/actions.mjs` returns a reopen request payload with `path: options.lastProjectPath`.
3. `app/renderer/hooks/useRecovery.ts` stores `lastProjectPath` and forwards the reopen request.
4. `app/renderer/components/ProjectHome.tsx` persists `blackskies.last-project` and consumes `reopenRequest.path`.

Conclusion:

Remembered path state can become reopen input. This proves a path-based selection seam, not canonical identity authority.

## 12. Recovery-targeting result

Result:

1. recovery hook success-path behavior confirmed by executable witness;
2. renderer request binding and backend targeting semantics confirmed by source inspection.

Evidence:

1. Command 4 passed through the `useRecovery` success seam.
2. Command 2 showed the broader offline recovery file still routes through the same `projectId`-bound action despite stale toast expectations.
3. `app/renderer/recovery/actions.mjs` calls `services.restoreSnapshot({ projectId: input.projectSummary.projectId })`.
4. `services/src/blackskies/services/routers/recovery.py` validates `project_id`, resolves `settings.project_base_dir / project_id`, and marks `current_project_files_replaced=True`, `restored_copy_materialized=False`.

Conclusion:

The executable witness proves that the exercised `useRecovery` success path completes, updates recovery status, and emits success feedback on the mocked path. Separately, source inspection proves that `app/renderer/recovery/actions.mjs` sends `projectId` in the recovery request and that `services/src/blackskies/services/routers/recovery.py` resolves the backend target from `project_base_dir / project_id`, reports current project files replaced, and reports no restored sibling copy materialized for that recovery route. This baseline did not execute a witness that directly proves backend root selection or overwrite semantics.

## 13. Conflicting-identity result

Result: not executed.

Reason:

No safe existing committed executable seam targeted conflicting identity with isolated temporary fixtures only. The committed candidate seam still requires a purpose-built isolated fixture witness, which would have required extra harnessing outside the scope of this pass.

## 14. Observed mutations and cleanup

- Repository file writes from this pass: only this documentation record.
- Executed tests wrote only to their own ephemeral test environments.
- Temporary directories created by this pass: none intentionally created.
- Temporary-fixture cleanup performed: not applicable because no custom temporary fixture was created.
- Protected-evidence cleanup: not applicable because protected evidence was not touched.

## 15. Confirmed behavior

1. The mocked create/load renderer path preserves and uses a supplied `projectId` in renderer flow. Evidence class: confirmed by executable witness.
2. Renderer remembered-project state can become reopen input through `lastProjectPath`. Evidence class: confirmed by executable witness.
3. `app/main/projectLoaderIpc.ts` reads `project.json.project_id` and maps it into returned project metadata. Evidence class: confirmed by source inspection.
4. The exercised `useRecovery` success path completes, updates recovery status, and emits success feedback on the mocked path. Evidence class: confirmed by executable witness.
5. `app/renderer/recovery/actions.mjs` sends `projectId` in the recovery request, and `services/src/blackskies/services/routers/recovery.py` resolves the backend target from `project_base_dir / project_id` with current-project replacement semantics and no restored sibling copy materialized on that route. Evidence class: confirmed by source inspection.
6. Renderer path-derived fallback identity exists when loader metadata does not supply `projectId`. Evidence class: confirmed by source inspection.

## 16. Unresolved behavior

1. Missing-identity executable behavior remains unrun in this pass. Evidence class: unresolved as an executable result; confirmed by source inspection.
2. Conflicting-identity executable behavior remains unrun in this pass. Evidence class: unresolved.
3. Path/ID divergence visibility, rejection, or silent tolerance remains unproven as an executable result. Evidence class: unresolved.
4. Save As, copy, and import remain outside the proven executable seam set. Evidence class: unresolved.

## 17. Contradictions or divergences

1. Renderer path-derived fallback identity remains in direct tension with Stage 12 doctrine that path is location, not identity. Evidence class: contradictory, from controlling record plus source inspection.
2. Reopen input remains path-based while recovery targeting remains `projectId`-based. Evidence class: inferred divergence risk, not an executable proof of silent authority transfer.
3. The broad offline recovery file contains stale assertion text relative to current recovery toast wording. Evidence class: confirmed by executable witness. This is a witness-seam drift observation, not proof of runtime identity failure.

## 18. Candidate Mutation A1 implications

These implications are provisional only and do not authorize Mutation A1.

1. Mutation scope will likely need to address renderer fallback identity creation at the `App.tsx` activation seam.
2. Mutation scope will likely need to define whether remembered path reopen input must be revalidated against canonical project identity before reuse.
3. Mutation scope will likely need an explicit handoff rule between path-based active-project selection inputs and `projectId`-bound recovery targeting.
4. A later authorized isolated witness for missing identity should be prepared before mutation scope is finalized.

## 19. Claims not proved

This pass did not prove:

1. one canonical runtime identity owner across loader, renderer, and backend;
2. executable missing-identity behavior through an isolated witness;
3. executable conflicting-identity behavior through an isolated witness;
4. that path/ID divergence is visibly rejected rather than tolerated;
5. any Save As contract;
6. any copy contract;
7. any import contract;
8. that recovery cannot target the wrong project when path and `projectId` diverge;
9. that historical recovery state silently becomes current-save authority.

## 20. Recommendation for the next PKG-A step

Next PKG-A work should proceed in this sequence:

1. a separately scoped isolated missing/conflicting identity witness-planning pass;
2. review and acceptance of that witness plan;
3. a first-mutation scope pass that converts the observed path-based reopen versus `projectId`-based recovery split into a precise candidate mutation scope;
4. Mutation A1 only after separate authorization and review.

Until then, Save As, copy, and import should remain out of Mutation A1 unless a separate safe proof seam is explicitly authorized.
