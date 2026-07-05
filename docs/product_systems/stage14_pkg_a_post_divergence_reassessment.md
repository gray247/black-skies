# PKG-A Post-Divergence Reassessment

## 1. Repository checkpoint

- Commit inspected: `a6213e8103cbf24d0d9630a9e16079275d82da4f`
- Branch inspected: `salvage/minimal-two-surface-shell`
- Repository gate status: satisfied
- Evidence label: confirmed by source inspection

## 2. Records inspected

- `docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md`
- `docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`
- `docs/product_systems/stage14_pkg_a_isolated_identity_witness_execution.md`
- `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_execution.md`
- `docs/product_systems/stage14_pkg_a_mutation_a1_scope.md`
- `docs/product_systems/stage14_pkg_a_mutation_a1_execution.md`
- `docs/product_systems/stage14_pkg_a_post_a1_reassessment.md`
- `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_witness_execution.md`
- `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_hygiene_scope.md`
- `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_hygiene_execution.md`
- `docs/product_systems/stage14_pkg_a_post_hygiene_reassessment.md`
- `docs/product_systems/stage14_pkg_a_divergence_visibility_witness_execution.md`
- `docs/product_systems/stage14_pkg_a_divergence_visibility_scope.md`
- `docs/product_systems/stage14_pkg_a_divergence_visibility_execution.md`
- `docs/product_systems/stage12_project_identity_binding_contract.md`
- `docs/product_systems/project_persistence_local_save.md`

## 3. Seams inspected

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
- `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
- `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/renderer/hooks/useRecovery.ts`
- `app/renderer/recovery/actions.mjs`
- `app/shared/ipc/projectLoader.ts`
- `app/main/projectLoaderIpc.ts`

## 4. What A1 resolved

- Missing-identity App activation fail-closed behavior remains in place. Evidence label: confirmed by executable witness.
- Basename-derived App active identity no longer occurs when `projectId` is missing. Evidence label: confirmed by executable witness.
- Missing-ID App active project state no longer occurs. Evidence label: confirmed by executable witness.
- Missing-ID dataset activation no longer occurs. Evidence label: confirmed by executable witness.
- Missing-ID immediate recovery-status requests no longer occur. Evidence label: confirmed by executable witness.
- A rejected missing-ID load no longer replaces a prior valid active project. Evidence label: confirmed by executable witness.
- Explicit metadata `projectId` preservation across renderer handoff remains intact when path basename diverges. Evidence label: confirmed by executable witness.

## 5. What ProjectHome hygiene resolved

- Missing-ID loader-success projects no longer create recent-project entries. Evidence label: confirmed by executable witness.
- Missing-ID loader-success projects no longer write `blackskies.last-project`. Evidence label: confirmed by executable witness.
- Missing-ID loader-success projects no longer update stored remembered-path state to the rejected path. Evidence label: confirmed by executable witness.
- Valid-ID remembered-path behavior remains preserved. Evidence label: confirmed by executable witness.
- `onProjectLoaded(...)` still fires for missing-ID loader-success results so App A1 rejection still runs at the existing seam. Evidence label: confirmed by executable witness.

## 6. What divergence visibility resolved

- ProjectHome now visibly shows canonical Project ID in the existing details card for loaded valid-ID projects. Evidence label: confirmed by executable witness.
- Divergent valid-ID projects show name, path, and canonical Project ID together. Evidence label: confirmed by executable witness.
- Non-divergent valid-ID projects show name, path, and canonical Project ID together. Evidence label: confirmed by executable witness.
- No divergence warning logic was added in this mutation. Evidence label: confirmed by executable witness.
- No recents schema change was made in this mutation. Evidence label: confirmed by executable witness.
- No App, loader, backend, recovery, persistence-destination, Save As, copy, or import behavior changed in this mutation. Evidence label: confirmed by source inspection.

## 7. Missing-ID loader tolerance status

- Loader tolerance of missing `project_id` remains reachable. `LoadedProject.projectId` is still optional, and the loader still returns `projectId = undefined` when metadata omits `project_id`. Evidence label: confirmed by executable witness and confirmed by source inspection.
- The previously proved renderer contradictions from that tolerance are now contained by A1 and ProjectHome hygiene. Missing-ID loads no longer become active App identity and no longer persist remembered-path residue. Evidence label: confirmed by executable witness.
- Current evidence does not prove that loader rejection or loader-side diagnostics are required to satisfy the accepted PKG-A contract. Evidence label: inferred.
- Current classification: compatibility / diagnostic debt, not a current PKG-A blocker. Evidence label: inferred.

## 8. Path / metadata-ID divergence status

- Explicit metadata-ID preservation remains proved. ProjectHome handoff and App activation still preserve canonical `projectId` when path basename differs. Evidence label: confirmed by executable witness.
- The specific ProjectHome details-card visibility gap is resolved because canonical Project ID is now visible for loaded valid-ID projects. Evidence label: confirmed by executable witness.
- Recents remain path/name-only structure and do not store canonical `projectId`. Evidence label: confirmed by executable witness and confirmed by source inspection.
- No divergence warning marker is currently shown in the tested ProjectHome seam. Evidence label: confirmed by executable witness.
- App UI visibility outside the tested ProjectHome details surface remains unproved. Evidence label: unresolved.
- Project picker visibility or ambiguity handling remains unproved. Evidence label: unresolved.
- Backend or recovery destination safety under divergence remains unproved. Evidence label: unresolved.
- Current evidence does not establish a new contradiction requiring another divergence mutation. Evidence label: inferred.

## 9. App project-bound action status

- Recovery-status gating on canonical `projectId` remains proved for the immediate post-activation seam. Evidence label: confirmed by executable witness.
- Recovery hook request formation remains `projectId`-based in the inspected source. Evidence label: confirmed by source inspection.
- Restore request formation remains `projectId`-based in the inspected source. Evidence label: confirmed by source inspection.
- Snapshot / verification request formation remains `projectId`-based in the inspected source. Evidence label: confirmed by source inspection.
- Export request formation remains `projectId`-based in the inspected source. Evidence label: confirmed by source inspection.
- Critique request formation remains `projectId`-based in the inspected source. Evidence label: confirmed by source inspection.
- Preflight / generation valid-ID behavior remains preserved, including explicit metadata-ID handoff. Evidence label: confirmed by executable witness.
- Draft save or edit path risk was not newly contradicted by the inspected seams. Evidence label: unresolved.

## 10. ProjectHome remaining surface status

- ProjectHome now has the three major PKG-A surface repairs in place:
- Missing-ID projects are not remembered by path. Evidence label: confirmed by executable witness.
- Valid-ID projects preserve remembered-path behavior. Evidence label: confirmed by executable witness.
- Valid-ID projects visibly show canonical Project ID in details. Evidence label: confirmed by executable witness.
- Remaining ProjectHome limits are narrower:
- Recents remain path/name-only structure. Evidence label: confirmed by executable witness and confirmed by source inspection.
- No divergence warning marker is shown. Evidence label: confirmed by executable witness.
- ProjectHome still sets local `activeProject` and `activeSceneId` before App rejection on missing-ID loader success, but that is not a remembered-path persistence route and is not presently a proved PKG-A contradiction by itself. Evidence label: confirmed by source inspection and inferred.
- Current classification: deferred visibility / evidence debt, not a currently justified mutation. Evidence label: inferred.

## 11. Persistence / recovery destination status

- Backend persistence and recovery routing remains source-supported as `project_id`-based in the inspected records and source. Evidence label: confirmed by source inspection.
- Reopen input remains path-based in renderer recovery-related seams. Evidence label: confirmed by source inspection.
- Destination safety under divergence remains unproved end-to-end. Evidence label: unresolved.
- Recovery correctness under divergence remains unproved end-to-end. Evidence label: unresolved.
- No current contradicted backend or recovery seam is established by A1, ProjectHome hygiene, or divergence visibility. Evidence label: inferred.
- Current evidence does not justify selecting a persistence or recovery mutation. Evidence label: inferred.

## 12. Remaining risk table

| Area | Current status | Evidence label | Mutation implied now |
| --- | --- | --- | --- |
| Missing-ID App activation | repaired by A1 | confirmed by executable witness | no |
| Missing-ID remembered-path persistence | repaired by ProjectHome hygiene | confirmed by executable witness | no |
| ProjectHome canonical ID visibility | repaired by divergence visibility mutation | confirmed by executable witness | no |
| Loader tolerance of missing `project_id` | still reachable but contained | confirmed by executable witness and confirmed by source inspection | no |
| Recents path/name-only identity structure | still present | confirmed by executable witness and confirmed by source inspection | no |
| Divergence warning marker | absent | confirmed by executable witness | no |
| App UI visibility beyond ProjectHome details | unproved | unresolved | no |
| Backend / recovery destination safety | unproved | unresolved | no |
| Save As / copy / import safety | unproved | unresolved | no |

## 13. Mutation decision

- Definitely required mutations remaining: `0`
- Likely remaining mutations: `0`
- Evidence-dependent mutations: `0-1`
- Current evidence does not support selecting another PKG-A mutation now. Evidence label: inferred.

## 14. Recommended next PKG-A lane

- Recommended next lane: `PKG-A closure preparation`
- Rationale: the originally proved missing-ID contradictions are repaired, ProjectHome remembered-path residue is repaired, ProjectHome canonical identity visibility is repaired, loader tolerance is contained, and no further bounded mutation is currently justified by proved contradiction. Evidence label: inferred.

## 15. Rationale for rejecting other candidate lanes

- `loader missing-identity diagnostics scope`: rejected as the immediate next lane because loader tolerance remains contained by renderer fail-closed seams and current evidence does not prove warning or rejection is required. Evidence label: inferred.
- `persistence/recovery destination witness`: rejected as the immediate next lane because destination safety remains unproved, but no current contradicted backend or recovery seam has been established. Evidence label: inferred.
- `recents identity visibility scope`: rejected as the immediate next lane because recents remain path/name-only, but no accepted record currently proves that as a PKG-A contradiction requiring immediate repair. Evidence label: inferred.
- `divergence warning scope`: rejected as the immediate next lane because canonical Project ID visibility now exists in ProjectHome details, and no further divergence-warning requirement has been proved. Evidence label: inferred.
- `another bounded mutation`: rejected because current evidence does not identify a remaining contradiction with a precise repair boundary. Evidence label: inferred.

## 16. Stage 12 reopening recommendation

- Recommendation: no Stage 12 reopening.
- Rationale: the accepted identity contract remains coherent, and current unresolved items do not show that the contract is impossible or internally contradictory. Evidence label: inferred.

## 17. Package-split recommendation

- Recommendation: no package split.
- Rationale: the remaining unproved areas do not require a different authority seam or rollback boundary, and no new mutation is currently selected. Evidence label: inferred.

## 18. Claims not proved

- This reassessment does not prove backend destination safety.
- This reassessment does not prove recovery correctness.
- This reassessment does not prove export correctness.
- This reassessment does not prove snapshot correctness.
- This reassessment does not prove restore correctness.
- This reassessment does not prove all App UI surfaces show canonical identity.
- This reassessment does not prove project picker behavior.
- This reassessment does not prove recents should or should not gain canonical identity in a later package.
- This reassessment does not prove Save As, copy, or import identity safety.

## 19. Exact next step

- Prepare a PKG-A closure-readiness record that consolidates the repaired contradictions, the contained loader-tolerance remainder, the still-unproved destination-safety areas, and the explicit deferred items as diagnostic debt or later evidence lanes.
