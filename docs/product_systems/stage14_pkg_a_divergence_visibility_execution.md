# Stage 14 PKG-A Divergence Visibility Execution

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD` at execution start: `07aace3dd377baa7d0293963c161aaa4c9a2d6d5`
- Verified scope commit hash: `07aace3dd377baa7d0293963c161aaa4c9a2d6d5`
- Verified subject: `docs(product): scope PKG-A divergence visibility`

## 2. Selected mutation

Implemented scoped mutation:

**ProjectHome details visibly show canonical Project ID for loaded valid-ID projects.**

## 3. Files changed

1. `app/renderer/components/ProjectHome.tsx`
2. `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
3. `docs/product_systems/stage14_pkg_a_divergence_visibility_execution.md`

## 4. Exact code boundary

Production boundary:

1. the existing `ProjectHome` details card inside `app/renderer/components/ProjectHome.tsx`
2. one read-only conditional row derived from `activeProject.projectId`
3. no changes to recents storage, last-project persistence, `loadProjectAtPath(...)`, `onProjectLoaded(...)`, App activation, loader behavior, backend behavior, or recovery behavior

Test boundary:

1. `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
2. inverted the divergent valid-ID visibility expectation
3. added a non-divergent valid-ID regression

Execution-only target:

1. `app/renderer/__tests__/ProjectHome.test.tsx` was inspected and not modified

## 5. Visible Project ID behavior

Confirmed behavior for loaded valid-ID projects:

1. `ProjectHome` details now visibly render a `Project ID` label
2. `ProjectHome` details now visibly render the canonical `projectId` value
3. this appears as normal details-card visibility, not as an error or warning state

## 6. Divergent valid-ID behavior

For:

1. `path: "/projects/path-beta"`
2. `name: "Divergent Identity Story"`
3. `projectId: "proj_alpha"`

Confirmed behavior:

1. `ProjectHome` still visibly renders `Divergent Identity Story`
2. `ProjectHome` still visibly renders `/projects/path-beta`
3. `ProjectHome` now visibly renders `proj_alpha`
4. no divergence warning or mismatch warning was added in this mutation

## 7. Non-divergent valid-ID behavior

For:

1. `path: "/projects/proj_alpha"`
2. `name: "Matching Identity Story"`
3. `projectId: "proj_alpha"`

Confirmed behavior:

1. `ProjectHome` visibly renders `Matching Identity Story`
2. `ProjectHome` visibly renders `/projects/proj_alpha`
3. `ProjectHome` visibly renders `proj_alpha`
4. no false divergence warning or mismatch warning appears

## 8. Missing-ID behavior preserved

Preserved behavior:

1. this mutation does not add any Project ID row when canonical `projectId` is absent
2. this mutation does not add divergence warning logic
3. this mutation does not restore missing-ID remembered-path persistence
4. this mutation does not change App A1 rejection behavior

Missing-ID behavior remained covered by the existing A1 and ProjectHome hygiene witnesses rather than by a new test in this pass.

## 9. Recents / last-project behavior preserved

Confirmed preserved behavior for the divergent valid-ID witness:

1. `blackskies.recent-projects` still stores `path` and `name` without `projectId`
2. `blackskies.last-project` still stores the loaded project path
3. no recents schema change or localStorage migration was introduced

## 10. Handoff payload preserved

Confirmed preserved behavior:

1. `onProjectLoaded(...)` still receives both path and canonical identity
2. divergent valid-ID case still preserves:
   - `project.projectId = "proj_alpha"`
   - `project.path = "/projects/path-beta"`
   - `targetPath = "/projects/path-beta"`
   - `lastOpenedPath = "/projects/path-beta"`
3. non-divergent valid-ID case still preserves:
   - `project.projectId = "proj_alpha"`
   - `project.path = "/projects/proj_alpha"`
   - `targetPath = "/projects/proj_alpha"`
   - `lastOpenedPath = "/projects/proj_alpha"`

## 11. Tests changed

`app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx` now contains:

1. a divergent valid-ID witness proving canonical Project ID is visible while name, path, recents behavior, last-project behavior, and handoff remain intact
2. a non-divergent valid-ID regression proving canonical Project ID is also visible without a false divergence warning

## 12. Commands and exit codes

Repository gate:

1. `git rev-parse HEAD`
2. `git status -sb`
3. `git status --short`
4. `git log -10 --oneline`

Verification command:

1. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
   - exit code: `0`
   - result: `1` file passed, `2` tests passed

No broader suite was selected.

## 13. Autonomous corrections

Bounded autonomous corrections within the authorized files:

1. added a narrow read-only Project ID row to the existing ProjectHome details card
2. updated the dedicated divergence witness for the new valid-ID visibility behavior
3. added a matching-ID regression in the same dedicated witness file

## 14. Confirmed results

Confirmed by executable witness:

1. divergent valid-ID ProjectHome details now show canonical Project ID
2. matching valid-ID ProjectHome details now show canonical Project ID
3. visible name and path remain intact
4. recents behavior remains path/name-only
5. `blackskies.last-project` behavior remains intact
6. `onProjectLoaded(...)` preserves path and canonical `projectId`

Confirmed by source inspection:

1. the production change is confined to the details-card render path
2. no new divergence-comparison logic was introduced
3. no App, loader, backend, recovery, or persistence architecture behavior was changed

## 15. Unresolved behavior

Still unresolved after this mutation:

1. backend destination safety
2. recovery correctness
3. export correctness
4. snapshot correctness
5. restore correctness
6. loader diagnostics
7. recents schema ambiguity
8. divergence warning behavior
9. all App UI surfaces
10. full project picker behavior
11. broad identity lifecycle handling

## 16. Protected-evidence result

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

No fixture materialization, receipt creation, recovery execution, restore execution, backend write, or snapshot update was performed.

## 17. Claims not proved

This mutation pass does not prove:

1. backend destination safety
2. recovery correctness
3. export correctness
4. snapshot correctness
5. restore correctness
6. loader diagnostics changed
7. recents schema ambiguity is repaired
8. divergence warning behavior is repaired
9. all App UI surfaces expose canonical identity sufficiently
10. full project picker behavior
11. the broad identity lifecycle

## 18. Rollback boundary

Rollback boundary remains:

1. one production file: `app/renderer/components/ProjectHome.tsx`
2. one primary witness file: `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`

This execution record is documentary only.

## 19. Suggestions not implemented

Not implemented in this pass:

1. divergence warning or comparison logic
2. recents schema expansion
3. loader diagnostics
4. App activation changes
5. backend or recovery changes
6. persistence-destination changes
7. project picker redesign
8. broad identity lifecycle redesign

## 20. Recommended next step

Recommended next step:

1. review `app/renderer/components/ProjectHome.tsx`, `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`, and this execution record together
2. if accepted, treat this as the bounded ProjectHome divergence visibility repair
3. keep any later lane for recents schema ambiguity, divergence warning behavior, loader diagnostics, backend/recovery evidence, or broader identity-lifecycle work separately scoped
