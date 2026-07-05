# Stage 14 PKG-A ProjectHome Remembered-Path Acceptance Hygiene Scope

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD`: `da7075ad49c2ed788ef2ac652f6498b49d9698f9`
- Verified subject: `test(product): capture PKG-A ProjectHome remembered-path witness`

## 2. Controlling evidence

Records read:

1. `docs/product_systems/stage14_pkg_a_post_a1_reassessment.md`
2. `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_witness_execution.md`
3. `docs/product_systems/stage14_pkg_a_mutation_a1_execution.md`
4. `docs/product_systems/stage12_project_identity_binding_contract.md`
5. `docs/product_systems/project_persistence_local_save.md`

Seams inspected:

1. `app/renderer/components/ProjectHome.tsx`
2. `app/renderer/App.tsx`
3. `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
4. `app/renderer/__tests__/ProjectHome.test.tsx`

Established evidence treated as confirmed:

1. A1 makes `App.activateProject(...)` fail closed when `projectId` is absent.
2. A1 prevents missing-ID active App identity, rejected datasets, and rejected immediate `getRecoveryStatus`.
3. `ProjectHome` still persists missing-ID loader-success state into recents and `blackskies.last-project` before App validation.
4. `ProjectHome` still exposes stored last-project-path state and accepts the same path through the bounded `reopenRequest` seam.
5. backend misbinding, persistence destination failure, recovery correctness failure, and Save As / copy / import failure remain unproved.

## 3. Scope question

Should the next PKG-A mutation be a bounded `ProjectHome remembered-path acceptance hygiene` change that prevents missing-ID loader-success projects from entering:

1. recent projects
2. `blackskies.last-project`
3. stored reopen-oriented path state

before App identity acceptance?

## 4. Selected or rejected mutation

Selected judgment:

1. a bounded mutation is justified now
2. implementation remains unauthorized in this scope document
3. the next lane should be a scoped renderer-only mutation pass, not a broader identity redesign

Why the mutation is justified now:

1. the remembered-path residue is already confirmed by executable witness
2. the residue is exactly within the `ProjectHome` seam
3. A1 already repaired the App activation contradiction, so this is now a narrower downstream hygiene contradiction
4. Stage 12 doctrine does not allow recent-file or reopen state to become identity-authoritative by convenience

Why the mutation is still bounded:

1. no backend or recovery failure is proved
2. no loader change is required by current evidence
3. no App A1 change is justified by current evidence
4. no broader unknown-identity lifecycle redesign is justified by current evidence

## 5. Intended missing-ID behavior

For a loader-success project whose canonical `projectId` is missing:

1. `ProjectHome` must not call `upsertRecent(...)`
2. `ProjectHome` must not call `persistLastProjectPath(...)`
3. `ProjectHome` must not set `storedLastProjectPath` to the rejected path
4. `ProjectHome` must not make that rejected path available as future reopen-oriented remembered path state
5. `ProjectHome` should still call `onProjectLoaded(...)` so the already-established A1 App rejection seam can run unchanged
6. no backend request, recovery, or persistence-destination behavior may be introduced or widened

Local `ProjectHome` loaded-state posture:

1. do not widen this mutation into a local `activeProject` redesign by default
2. prefer leaving local `activeProject` / `activeSceneId` handling unchanged if remembered-path hygiene can be achieved independently
3. if implementation proves remembered-path suppression cannot be separated from local loaded-state mutation, stop and rescope before changing that broader seam

## 6. Valid-ID behavior to preserve

Valid explicit-ID loader success must remain unchanged:

1. recents still update
2. `blackskies.last-project` still persists
3. reopen input remains usable
4. `onProjectLoaded(...)` still fires
5. App A1 valid-ID behavior remains unchanged

## 7. Proposed files

Likely changed file:

1. `app/renderer/components/ProjectHome.tsx`
   - why it may change: current remembered-path persistence happens there
   - intended change: gate recent-project and last-project persistence on presence of canonical `projectId`
   - prohibited adjacent changes: no loader diagnostics, no App callback redesign, no service or recovery changes, no broad local-state redesign unless separately rescoped

Likely changed witness file:

2. `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
   - why it may change: current witness proves the residue and should become the primary mutation-proof seam
   - intended change: invert missing-ID remembered-path expectations and add valid-ID preservation coverage if not already present there
   - prohibited adjacent changes: no widening into App, backend, or recovery assertions

Possible execution-only regression target:

3. `app/renderer/__tests__/ProjectHome.test.tsx`
   - why it may be used: existing valid-ID recents and reopen behavior is already exercised there
   - intended use: targeted regression verification only unless a later implementation pass shows a specific gap
   - prohibited adjacent changes: do not modify this file unless the implementation pass explicitly authorizes it

## 8. Proposed code boundary

Primary production boundary:

1. the success branch inside `ProjectHome.loadProjectAtPath(...)`
2. specifically the sequence currently containing:
   - `upsertRecent(response.project)`
   - `persistLastProjectPath(response.project.path)`
   - `setStoredLastProjectPath(response.project.path)`

Preferred mutation shape:

1. derive a narrow `canRememberProjectPath` or equivalent guard from canonical `response.project.projectId`
2. apply that guard only to recents / `lastProjectPath` / stored reopen-oriented path acceptance
3. preserve `onProjectLoaded(...)` upward reporting so App A1 can reject unchanged

Prohibited boundary widening:

1. no change to `App.activateProject(...)`
2. no change to loader behavior
3. no change to `useRecovery` semantics
4. no change to backend persistence or recovery services
5. no change to Save As, copy, import, or divergence visibility

Rollback boundary:

1. one production file: `app/renderer/components/ProjectHome.tsx`
2. one primary witness file: `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`

## 9. Proposed tests and commands

Required mutation-proof case:

1. missing-ID remembered-path case
2. expected post-mutation behavior:
   - does not write `blackskies.recent-projects`
   - does not write `blackskies.last-project`
   - does not expose stored rejected path in remembered-path state
   - still reports upward through `onProjectLoaded(...)` if that remains the chosen implementation shape

Required valid-ID preservation case:

1. valid explicit-ID ProjectHome success
2. expected preserved behavior:
   - recents still update
   - `blackskies.last-project` still persists
   - reopen path remains usable
   - `onProjectLoaded(...)` still fires

Targeted commands:

1. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
2. use `ProjectHome.test.tsx` as a targeted regression command only if the implementation pass needs an existing valid-ID seam that the witness file does not cover directly

## 10. Compatibility risks

Compatibility risks if the mutation is selected:

1. older or malformed projects with missing `projectId` would no longer seed remembered-path convenience state
2. local `ProjectHome` display may still show a loaded project while remembered-path acceptance is suppressed, which could feel asymmetric unless messaging remains bounded
3. valid-ID behavior must not regress for normal open, create, recents, or reopen flows

These risks are acceptable within current evidence because:

1. App already rejects missing-ID activation
2. remembered-path convenience for an identity-unresolved project is the specific contradiction now proved
3. no evidence currently requires preserving remembered-path convenience for missing-ID projects

## 11. Stop conditions

Stop and rescope if implementation planning shows any of these are required:

1. changing `App.activateProject(...)`
2. changing loader acceptance or diagnostics
3. changing `useRecovery` or backend recovery behavior
4. changing backend persistence behavior
5. redesigning `ProjectHome` local `activeProject` handling rather than remembered-path acceptance only
6. adding new warning UX or divergence visibility UX

## 12. Exclusions

Explicitly excluded from this scope:

1. loader rejection or diagnostics
2. App A1 behavior changes
3. backend changes
4. persistence destination repair
5. recovery correctness changes
6. Save As
7. copy
8. import
9. divergence visibility UX
10. broad unknown-identity lifecycle design

## 13. Stage 12 reopening recommendation

Recommendation:

1. do not reopen Stage 12

Reason:

1. the current contract is coherent
2. the proved contradiction is local to remembered-path acceptance at the `ProjectHome` seam
3. nothing in this scope requires redefining identity authority or propagation doctrine

## 14. Package-split recommendation

Recommendation:

1. no package split

Reason:

1. the proposed mutation stays within one renderer seam and one primary witness seam
2. the rollback boundary remains compatible with the current PKG-A family
3. no different authority seam is required

## 15. Claims not proved

This scope document does not prove:

1. that local `ProjectHome` loaded-state mutation is required
2. that backend misbinding occurs
3. that persistence destination safety is broken
4. that recovery correctness fails
5. that loader diagnostics should change
6. that divergence visibility should be the next lane
7. that Save As, copy, or import need the same treatment

## 16. Exact recommended next step

Authorize one bounded mutation-planning or implementation pass named:

**ProjectHome remembered-path acceptance hygiene**

That next pass should:

1. edit only `app/renderer/components/ProjectHome.tsx` and the primary witness file unless a narrow regression gap is proved
2. suppress recents and `lastProjectPath` acceptance for missing-ID loader-success projects
3. preserve valid-ID remembered-path behavior
4. preserve the upward App A1 rejection handoff
5. stop and rescope if broader local-state or App behavior changes become necessary
