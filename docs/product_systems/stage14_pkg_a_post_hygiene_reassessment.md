# Stage 14 PKG-A Post-Hygiene Reassessment

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD`: `95cf9631a0a0e93ca2827feaf9d4c3b7c0402527`
- Verified subject: `fix(product): gate ProjectHome remembered paths on project identity`

## 2. Records inspected

1. `docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md`
2. `docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`
3. `docs/product_systems/stage14_pkg_a_isolated_identity_witness_execution.md`
4. `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_execution.md`
5. `docs/product_systems/stage14_pkg_a_mutation_a1_scope.md`
6. `docs/product_systems/stage14_pkg_a_mutation_a1_execution.md`
7. `docs/product_systems/stage14_pkg_a_post_a1_reassessment.md`
8. `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_witness_execution.md`
9. `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_hygiene_scope.md`
10. `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_hygiene_execution.md`
11. `docs/product_systems/stage12_project_identity_binding_contract.md`
12. `docs/product_systems/project_persistence_local_save.md`

## 3. Seams inspected

1. `app/renderer/App.tsx`
2. `app/renderer/components/ProjectHome.tsx`
3. `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
4. `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
5. `app/renderer/__tests__/AppPreflight.test.tsx`
6. `app/renderer/hooks/useRecovery.ts`
7. `app/renderer/recovery/actions.mjs`
8. `app/shared/ipc/projectLoader.ts`
9. `app/main/projectLoaderIpc.ts`

## 4. What A1 resolved

Resolved by A1:

1. basename-derived App active identity on missing `projectId`
   - evidence: confirmed by executable witness
2. missing-ID activation into App-managed active project state
   - evidence: confirmed by executable witness
3. missing-ID dataset publication at the App seam
   - evidence: confirmed by executable witness
4. missing-ID immediate `getRecoveryStatus` / recovery-status request
   - evidence: confirmed by executable witness
5. replacement of a prior valid active App project by a rejected missing-ID project
   - evidence: confirmed by executable witness
6. explicit metadata-ID preservation when path basename differs
   - evidence: confirmed by executable witness
7. successful-activation-path last-project persistence for a rejected missing-ID App activation
   - evidence: confirmed by source inspection and executable witness

No current source or test contradicts these A1 outcomes.

## 5. What ProjectHome hygiene resolved

Resolved by the ProjectHome hygiene mutation:

1. missing-ID loader success no longer writes a recent-project entry
   - evidence: confirmed by executable witness
2. missing-ID loader success no longer writes `blackskies.last-project`
   - evidence: confirmed by executable witness
3. missing-ID loader success no longer updates stored remembered-path state to the missing-ID path
   - evidence: confirmed by executable witness
4. missing-ID explicit `reopenRequest` input no longer leaves remembered-path residue after load success
   - evidence: confirmed by executable witness
5. valid-ID remembered-path behavior remains intact
   - evidence: confirmed by executable witness
6. upward `onProjectLoaded(...)` handoff remains intact so A1 still rejects missing-ID activation later
   - evidence: confirmed by source inspection and executable witness

No current source or test contradicts these hygiene outcomes.

## 6. Missing-ID loader tolerance status

Current status:

1. loader tolerance of missing `project_id` remains reachable
   - evidence: confirmed by executable witness and source inspection
2. loader still returns `projectId = undefined` when metadata lacks `project_id`
   - evidence: confirmed by executable witness and source inspection
3. `LoadedProject.projectId` remains optional at the shared IPC seam
   - evidence: confirmed by source inspection
4. this loader tolerance is now blocked from the proved App active-identity contradiction by A1
   - evidence: confirmed by executable witness
5. this loader tolerance is now blocked from the proved ProjectHome remembered-path contradiction by hygiene
   - evidence: confirmed by executable witness

Assessment:

1. loader tolerance remains a real reachable runtime condition
2. loader tolerance is no longer a currently proved PKG-A contradiction after A1 plus hygiene
3. loader mutation is not justified from current evidence alone
4. loader diagnostics remains best classified as diagnostic or compatibility debt unless a later witness proves a stronger product contradiction

Overall label:

1. still reachable
2. executable-witness-supported
3. blocked by A1 / ProjectHome hygiene for the two previously proved renderer contradictions

## 7. Path / metadata-ID divergence status

Established:

1. loader preserves explicit metadata `projectId` when path basename differs
   - evidence: confirmed by executable witness
2. App preserves explicit metadata `projectId` under the exercised divergence handoff
   - evidence: confirmed by executable witness
3. broader visible divergence handling remains unresolved
   - evidence: unresolved

Current unresolved divergence areas:

1. visible warning or explicit divergence notice
   - evidence: unresolved
2. project-picker / ProjectHome details ambiguity because path and name are shown without any project-ID or divergence marker
   - evidence: confirmed by source inspection
3. recents display ambiguity because recents show `name` and `path`, not a canonical identity marker or divergence signal
   - evidence: confirmed by source inspection
4. recovery destination ambiguity because reopen input remains path-based while recovery status and restore operate by `projectId`
   - evidence: confirmed by source inspection
5. persistence destination ambiguity because backend selection remains `project_id`-based while renderer-visible context still includes path-first presentation
   - evidence: inferred from source inspection and prior witnesses

Assessment:

1. divergence is no longer a missing-ID mutation lane
2. divergence visibility is now the smallest remaining evidence lane with direct user-facing value
3. no divergence mutation is justified yet without a bounded witness proving what is currently shown or concealed

## 8. App project-bound action status

### 8.1 Recovery status

1. immediate missing-ID recovery-status request is blocked at the App activation seam
   - evidence: confirmed by executable witness
2. later recovery fetches operate by `projectSummary.projectId`
   - evidence: confirmed by source inspection

### 8.2 Snapshot / restore

1. snapshot creation requires `projectSummary?.projectId`
   - evidence: confirmed by source inspection
2. snapshot verification requires `projectSummary?.projectId`
   - evidence: confirmed by source inspection
3. recovery restore uses `projectSummary.projectId` or an already-bound recovery record
   - evidence: confirmed by source inspection

### 8.3 Export

1. export requires `projectSummary?.projectId`
   - evidence: confirmed by source inspection

### 8.4 Critique

1. batch critique requires `projectSummary?.projectId`
   - evidence: confirmed by source inspection

### 8.5 Preflight / generation

1. explicit metadata-ID still reaches preflight and generation unchanged in the exercised witness
   - evidence: confirmed by executable witness
2. App request formation uses canonical `projectId`
   - evidence: confirmed by source inspection

### 8.6 Draft save / edit paths

1. no newly proved contradiction was found in the inspected visible draft-edit paths after A1 and hygiene
   - evidence: unresolved

Overall App-action assessment:

1. App-managed project-bound actions currently appear canonically `projectId`-gated after A1
2. this is executable-witness-supported for recovery-status blocking and explicit-ID preflight/generation preservation
3. it is source-supported for snapshot, verify, export, critique, and restore request formation

## 9. ProjectHome remembered-path residual status

Resolved:

1. the specific missing-ID remembered-path residue proved before hygiene is now resolved
   - evidence: confirmed by executable witness

Still present but distinct:

1. `ProjectHome` still sets local `activeProject` and `activeSceneId` before App rejects missing-ID activation
   - evidence: confirmed by source inspection
2. this local loaded-state behavior is not itself a remembered-path persistence route
   - evidence: confirmed by source inspection

Other persistence routes inspected:

1. the repaired `loadProjectAtPath(...)` success path no longer persists missing-ID recents or last-project state
   - evidence: confirmed by source inspection and executable witness
2. explicit reopen input still loads by path, but it no longer creates remembered-path residue for missing-ID projects
   - evidence: confirmed by executable witness
3. other `persistLastProjectPath(...)` writes in `ProjectHome.tsx` are tied to fallback-project success or stale-path cleanup, not a newly proved missing-ID route
   - evidence: confirmed by source inspection

Assessment:

1. no additional source-supported missing-ID remembered-path contradiction was found in `ProjectHome` after hygiene
2. no further ProjectHome mutation is justified from current evidence
3. if the remaining local loaded-state asymmetry matters later, it should be treated as a separate lane rather than a remembered-path residue lane

## 10. Persistence / recovery destination status

Current status:

1. backend persistence destination selection remains `project_id`-based under the configured base directory
   - evidence: confirmed by source inspection
2. recovery status and restore remain `projectId`-bound at the API seam
   - evidence: confirmed by source inspection
3. reopen input remains path-based
   - evidence: confirmed by source inspection
4. no new contradicted backend or recovery seam is established by A1 plus hygiene
   - evidence: confirmed by source inspection and executable witness

Assessment:

1. destination safety remains unproved
2. recovery binding safety under divergence remains unproved
3. snapshot and export destination safety under divergence remains unproved
4. no concrete persistence or recovery mutation is justified yet

Acceptable summary:

1. destination safety remains unproved, but no new contradicted backend or recovery seam is established by A1 plus hygiene

## 11. Remaining risk table

| Area | Current status | Evidence label | Mutation justified now |
| --- | --- | --- | --- |
| Missing-ID App activation | Resolved by A1 | confirmed by executable witness | no |
| Missing-ID remembered paths | Resolved by hygiene | confirmed by executable witness | no |
| Loader missing-ID tolerance | Still reachable but contained | confirmed by executable witness and source inspection | no |
| Path / metadata-ID divergence visibility | Unresolved | unresolved | no |
| Project picker / recents divergence ambiguity | Source-supported display ambiguity | confirmed by source inspection | no |
| App project-bound action gating | Canonical-ID gated in inspected seams | confirmed by source inspection; partly confirmed by executable witness | no |
| Persistence destination safety | Unproved | unresolved | no |
| Recovery destination safety | Unproved | unresolved | no |
| PKG-A closure readiness | Not yet ready | inferred | no |

## 12. Mutation decision

Remaining mutation count judgment:

1. definitely required mutations remaining: `0`
2. likely remaining mutations: `0`
3. evidence-dependent mutations: `0-1`

Reason:

1. no currently proved contradiction remains after A1 plus the ProjectHome hygiene mutation
2. one later bounded mutation remains possible if a divergence-visibility witness proves a user-facing concealment or authority problem
3. loader diagnostics, persistence safety, and recovery safety remain evidence questions, not current mutation authorizations

## 13. Recommended next PKG-A lane

Recommended next lane:

**divergence visibility witness**

Why this lane is next:

1. explicit metadata-ID preservation is already proved at loader and App seams
2. the strongest remaining unresolved question is what the runtime shows or hides when path and canonical metadata identity diverge
3. this is smaller and safer than jumping directly to loader mutation or persistence/recovery mutation
4. PKG-A closure preparation is still premature without this visibility classification

Exact intent:

1. prove what current runtime surfaces show for divergent path versus metadata ID
2. prove whether recents, ProjectHome details, and related renderer state present ambiguity silently
3. avoid implementation selection unless the witness proves a product-significant concealment

## 14. Rationale for rejecting other candidate lanes

### 14.1 Loader missing-identity diagnostics

1. rejected as the immediate next lane because loader tolerance is now contained by A1 plus hygiene
2. current evidence does not prove that loader rejection or warning is product-required

### 14.2 Persistence / recovery evidence

1. rejected as the immediate next lane because no new contradiction was established in backend or recovery seams
2. this lane remains valuable later, but it is broader and less directly actionable than divergence visibility

### 14.3 PKG-A closure preparation

1. rejected as premature because divergence visibility remains unresolved
2. destination safety also remains unproved even though no contradiction is currently proved

### 14.4 Another bounded mutation

1. rejected because no remaining proved contradiction currently demands implementation
2. the prior missing-ID remembered-path contradiction has already been repaired

## 15. Stage 12 reopening recommendation

Recommendation:

1. do not reopen Stage 12

Reason:

1. the controlling identity contract remains coherent
2. current remaining issues are evidence and visibility questions, not contract incoherence
3. no inspected seam now proves a Stage 12 structural failure

## 16. Package-split recommendation

Recommendation:

1. no package split

Reason:

1. the recommended next lane remains a bounded renderer evidence pass
2. no incompatible rollback boundary has been proved

## 17. Claims not proved

This reassessment does not prove:

1. that loader diagnostics must change
2. that divergence visibility definitely requires a mutation
3. that persistence destination safety is fully correct
4. that recovery cannot target the wrong project under all divergence conditions
5. that ProjectHome local loaded-state asymmetry is product-significant
6. that PKG-A is ready for closure today
7. that Save As, copy, or import require no further review

## 18. Exact next step

Create and review one bounded **divergence visibility witness** focused on current renderer presentation of:

1. explicit metadata `projectId`
2. divergent filesystem path
3. ProjectHome details and recents presentation
4. any existing warning, badge, or diagnostic visibility

Do not authorize loader mutation, persistence/recovery mutation, or PKG-A closure preparation before that witness is assessed.
