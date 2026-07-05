# Stage 14 PKG-A ProjectHome Remembered-Path Hygiene Execution

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD` at execution start: `944cf4c94f4f42582838d594728cc104a98a67d9`
- Verified scope commit hash: `944cf4c94f4f42582838d594728cc104a98a67d9`
- Verified subject: `docs(product): scope PKG-A ProjectHome remembered-path hygiene`

## 2. Selected mutation

Implemented scoped mutation:

**ProjectHome must not persist remembered-path state for a loaded project whose canonical `projectId` is missing.**

## 3. Files changed

1. `app/renderer/components/ProjectHome.tsx`
2. `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
3. `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_hygiene_execution.md`

## 4. Exact code boundary

Production boundary:

1. the successful `loadProjectAtPath(...)` path inside `app/renderer/components/ProjectHome.tsx`
2. specifically the remembered-path write sequence that previously called:
   - `upsertRecent(response.project)`
   - `persistLastProjectPath(response.project.path)`
   - `setStoredLastProjectPath(response.project.path)`
3. added a narrow `canRememberProjectPath` guard derived from `response.project.projectId`
4. left `setActiveProject(...)`, `setActiveSceneId(...)`, and `onProjectLoaded(...)` unchanged

Test boundary:

1. `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
2. inverted the missing-ID witness expectations
3. added a valid-ID preservation witness in the same dedicated seam

Execution-only target:

1. `app/renderer/__tests__/ProjectHome.test.tsx` was inspected and not modified

## 5. Missing-ID behavior

Confirmed implementation behavior for loader success with `projectId: undefined`:

1. `ProjectHome` no longer persists `blackskies.recent-projects`
2. `ProjectHome` no longer persists `blackskies.last-project`
3. `ProjectHome` no longer updates `storedLastProjectPath` to the rejected path
4. the rejected path no longer appears in remembered-path diagnostics state
5. `ProjectHome` still treats the loader result as loaded local content
6. `ProjectHome` still calls `onProjectLoaded(...)` with:
   - `status: "loaded"`
   - the missing-ID project object
   - `targetPath: "/projects/missing-id-story"`
   - `lastOpenedPath: "/projects/missing-id-story"`
7. bounded `reopenRequest` input still loads and reports success, but it does not store remembered-path residue

## 6. Valid-ID preservation

Confirmed preserved behavior for loader success with explicit `projectId`:

1. `ProjectHome` still writes a recent-project entry
2. `ProjectHome` still persists `blackskies.last-project`
3. `ProjectHome` still updates stored last-project-path state
4. remembered reopen input remains usable through `reopenRequest`
5. `ProjectHome` still calls `onProjectLoaded(...)`
6. no App A1, loader, backend, recovery, or persistence-architecture behavior was changed

## 7. Tests changed

`app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx` now contains:

1. a missing-ID dialog-load witness that proves no remembered-path writes occur
2. a missing-ID `reopenRequest` witness that proves explicit reopen input is accepted without storing remembered-path residue
3. a valid-ID preservation witness that proves recents, `blackskies.last-project`, stored last-project-path state, reopen behavior, and `onProjectLoaded(...)` remain intact

## 8. Commands and exit codes

Repository gate:

1. `git rev-parse HEAD`
2. `git status -sb`
3. `git status --short`
4. `git log -8 --oneline`

Verification command:

1. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
   - first run: exit code `1`
   - cause: test-only diagnostics assertion expected a raw `"path"` field that is not present in the current diagnostics payload
   - correction: tightened the witness to the scoped observables already required by this lane
2. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
   - second run: exit code `0`
   - result: `1` file passed, `3` tests passed

No broader suite was run.

## 9. Autonomous corrections

Bounded autonomous corrections within the authorized files:

1. added the narrow `canRememberProjectPath` guard in `ProjectHome.tsx`
2. inverted the missing-ID remembered-path assertions in the dedicated witness file
3. added explicit valid-ID preservation coverage in the dedicated witness file
4. corrected the first-run diagnostics assertion mismatch inside the authorized witness file only

## 10. Confirmed results

Confirmed by executable witness:

1. missing-ID loader success no longer writes recents
2. missing-ID loader success no longer writes `blackskies.last-project`
3. missing-ID loader success no longer updates stored remembered-path state to the rejected path
4. missing-ID loader success still emits `onProjectLoaded(...)`
5. missing-ID explicit `reopenRequest` input still reports success without storing remembered-path residue
6. valid-ID loader success still writes recents
7. valid-ID loader success still writes `blackskies.last-project`
8. valid-ID loader success still updates stored last-project-path state
9. valid-ID reopen input remains usable

Confirmed by source inspection:

1. the mutation is confined to the remembered-path write sequence in `ProjectHome.loadProjectAtPath(...)`
2. local `activeProject` and `activeSceneId` handling were not redesigned
3. upward App A1 handoff through `onProjectLoaded(...)` remains unchanged

## 11. Unresolved behavior

Still unresolved after this mutation:

1. App A1 behavior beyond the preserved handoff
2. loader diagnostics or loader-side missing-ID tolerance
3. backend destination safety
4. persistence correctness beyond local remembered-path acceptance
5. recovery correctness
6. Save As, copy, or import behavior
7. divergence visibility
8. full unknown-identity lifecycle behavior

## 12. Protected-evidence result

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

## 13. Claims not proved

This mutation pass does not prove:

1. App A1 behavior changed
2. loader diagnostics changed
3. backend destination safety
4. persistence correctness outside the local remembered-path seam
5. recovery correctness
6. Save As behavior
7. copy behavior
8. import behavior
9. divergence visibility
10. the full unknown-identity lifecycle

## 14. Rollback boundary

Rollback boundary remains:

1. one production file: `app/renderer/components/ProjectHome.tsx`
2. one primary witness file: `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`

This execution record is documentary only.

## 15. Suggestions not implemented

Not implemented in this pass:

1. loader-side rejection or diagnostics for missing `projectId`
2. App activation changes
3. backend or persistence-destination safeguards
4. recovery behavior changes
5. Save As, copy, or import changes
6. divergence visibility UX
7. broad unknown-identity lifecycle redesign

## 16. Recommended next step

Recommended next step:

1. review `app/renderer/components/ProjectHome.tsx`, `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`, and this execution record together
2. confirm the bounded renderer mutation is accepted as the ProjectHome remembered-path hygiene repair
3. keep any later lane for loader diagnostics, divergence visibility, backend safety, recovery correctness, or broader unknown-identity behavior separately scoped
