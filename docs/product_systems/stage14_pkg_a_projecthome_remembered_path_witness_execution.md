# Stage 14 PKG-A ProjectHome Remembered-Path Witness Execution

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD`: `792cea4e2d13997d3c4508b2c5d49f2915cfb4a4`
- Verified subject: `docs(product): reassess PKG-A after Mutation A1`

## 2. Post-A1 reassessment authority

Controlling authority for this pass:

1. `docs/product_systems/stage14_pkg_a_post_a1_reassessment.md`
2. `docs/product_systems/stage14_pkg_a_mutation_a1_execution.md`
3. `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_execution.md`
4. `docs/product_systems/stage12_project_identity_binding_contract.md`

This pass followed the reassessment's selected next lane:

1. `ProjectHome missing-ID remembered-path witness`
2. evidence lane only
3. no implementation mutation selected
4. no A2 mutation selected

## 3. Witness purpose

Determine whether current `ProjectHome.loadProjectAtPath(...)` behavior still persists a missing-ID loader-success project into remembered-path state before any later App validation and A1 rejection.

This pass was scoped to prove only:

1. recent-project persistence
2. `blackskies.last-project` persistence
3. `ProjectHome` stored last-project-path state observability
4. `onProjectLoaded(...)` handoff with a missing-ID project
5. bounded reopen-path acceptance through `ProjectHome`'s existing `reopenRequest` seam

This pass was not scoped to prove:

1. App activation success
2. App active identity after A1
3. project-bound service calls
4. backend writes
5. persistence destination safety
6. recovery correctness
7. Save As, copy, or import behavior
8. final A2 scope

## 4. Files created

1. `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
2. `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_witness_execution.md`

## 5. Seam inspected

Source seams inspected:

1. `app/renderer/components/ProjectHome.tsx`
2. `app/renderer/App.tsx`
3. `app/renderer/__tests__/ProjectHome.test.tsx`
4. `app/renderer/__tests__/AppIdentityHandoff.test.tsx`

Selected executable seam:

1. `ProjectHome` only
2. mocked `window.projectLoader`
3. direct storage observation through `window.localStorage`
4. direct callback observation through `onProjectLoaded(...)`
5. direct observable diagnostics state through the existing ProjectHome diagnostics textarea
6. bounded reopen acceptance through `reopenRequest`

Why this seam was chosen:

1. it proves remembered-path persistence directly
2. it avoids widening into App activation
3. it avoids widening into service, recovery, or backend behavior
4. it preserves the A1 App rejection proof boundary as separately established evidence

## 6. Mocked loader result

Mocked successful loaded project:

1. `path: "/projects/missing-id-story"`
2. `name: "Missing Identity Story"`
3. `projectId: undefined`
4. valid outline, scene, and draft payload
5. `bootstrapState: "empty"`

Mocked loader outcomes:

1. dialog-driven load success for the missing-ID project
2. reopen-request-driven load success for the same missing-ID project path

## 7. Persistence surfaces observed

Observed directly in the witness:

1. `blackskies.recent-projects`
2. `blackskies.last-project`
3. ProjectHome diagnostics payload field `storedLastProjectPath`
4. ProjectHome diagnostics payload field `activeProjectPath`
5. recent-project UI entry for `Missing Identity Story`
6. `onProjectLoaded(...)` payload
7. `onReopenConsumed(...)` success result for the bounded reopen seam

Observed by source inspection only:

1. `ProjectHome.loadProjectAtPath(...)` calls `setActiveProject(response.project)`
2. `ProjectHome.loadProjectAtPath(...)` calls `upsertRecent(response.project)`
3. `ProjectHome.loadProjectAtPath(...)` calls `persistLastProjectPath(response.project.path)`
4. `ProjectHome.loadProjectAtPath(...)` calls `setStoredLastProjectPath(response.project.path)`
5. those steps occur before `onProjectLoaded(...)`
6. `App.activateProject(...)` fails closed when `project.projectId` is absent
7. `useRecovery` and `evaluateReopenRequest(...)` keep reopen state path-based

## 8. Exact assertions

`ProjectHomeRememberedPathWitness.test.tsx` asserts that a missing-ID loader success currently:

1. calls `projectLoader.loadProject({ path: "/projects/missing-id-story" })`
2. writes one recent-project entry with:
   - `path: "/projects/missing-id-story"`
   - `name: "Missing Identity Story"`
3. writes `window.localStorage["blackskies.last-project"] = "/projects/missing-id-story"`
4. exposes `storedLastProjectPath` as `/projects/missing-id-story` in the diagnostics payload
5. exposes `activeProjectPath` as `/projects/missing-id-story` in the diagnostics payload
6. renders a recent-project entry for `Missing Identity Story`
7. calls `onProjectLoaded(...)` with:
   - `status: "loaded"`
   - the same missing-ID project object
   - `targetPath: "/projects/missing-id-story"`
   - `lastOpenedPath: "/projects/missing-id-story"`
8. accepts the same path through `reopenRequest`
9. reports `{ requestId: 7, status: "success" }` through `onReopenConsumed(...)`

## 9. Commands and exit codes

Repository gate:

1. `git rev-parse HEAD`
2. `git status -sb`
3. `git status --short`
4. `git log -8 --oneline`

Targeted witness command:

1. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
   - first run: exit code `1`
   - cause: assertion API mismatch in the diagnostics textarea check
   - correction: test-only assertion tightening inside the authorized witness file
2. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
   - second run: exit code `0`
   - result: `1` file passed, `2` tests passed

No broader suite was run.

## 10. Confirmed behavior

Confirmed by executable witness:

1. a missing-ID loader-success project is still treated as a successful `ProjectHome` load
2. `ProjectHome` still persists that project into `blackskies.recent-projects`
3. `ProjectHome` still persists that path into `blackskies.last-project`
4. `ProjectHome` still updates its stored last-project-path state, observable through diagnostics
5. `ProjectHome` still emits `onProjectLoaded(...)` with the missing-ID project
6. the same path is still accepted through the bounded `reopenRequest` seam

Confirmed by source inspection:

1. the remembered-path persistence steps occur inside `ProjectHome.loadProjectAtPath(...)` before the upward handoff
2. A1 App rejection remains separate and later than this `ProjectHome` persistence seam
3. App-managed active identity remains fail-closed after A1

Inferred:

1. a loader-success then App-rejection sequence can still preserve a rejected missing-ID path as future reopen-oriented path state
2. that inference depends on combining this `ProjectHome` witness with the already proved A1 App fail-closed witness

## 11. Unresolved behavior

Unresolved after this pass:

1. whether the remembered-path residue is product-significant enough to justify mutation
2. whether higher-layer restart or reopen flows always promote the stored path into a real reopen request in every runtime path
3. whether path-based remembered reopen input is acceptable final product behavior
4. divergence visibility
5. backend destination safety
6. recovery correctness

## 12. Claims not proved

This execution record does not prove:

1. App activation success for the missing-ID project
2. App active identity after A1
3. any project-bound service call from the missing-ID project
4. any backend write
5. persistence destination safety
6. recovery execution or correctness
7. Save As, copy, or import behavior
8. final A2 scope

## 13. Whether implementation mutation is now justified

Current result:

1. implementation mutation is not yet justified automatically

Reason:

1. the witness confirms remembered-path persistence residue
2. App-managed active identity remains fail-closed after A1
3. backend or persistence misbinding is still not proved
4. the next decision is still a classification judgment, not an automatic mutation authorization

Evidence label:

1. remembered-path persistence residue: confirmed by executable witness
2. App fail-closed active identity: confirmed by prior executable witness and source inspection
3. backend or persistence misbinding: unresolved

## 14. Recommended next PKG-A step

Recommended next step:

1. review this witness together with the A1 App rejection record
2. classify whether remembered-path retention for missing-ID loader success is:
   - a remaining contradiction requiring a bounded renderer mutation
   - or deferred remembered-path hygiene / diagnostic debt
3. do not select loader mutation, backend mutation, or persistence-destination mutation from this pass alone

## 15. Protected-evidence result

No protected evidence was used or modified.

Untouched:

1. `sample_project/proj_esther_estate/**`
2. `sample_project/Esther_Estate/**`
3. `build/truth_receipts/**`
4. `build/runtime_truth.json`
5. `build/runtime_truth.schema.json`
6. `ci_artifacts/**`
7. tracked snapshots
8. IPC snapshot evidence
9. real user projects

No fixture materialization, receipt creation, recovery execution, restore execution, or backend write was performed.
