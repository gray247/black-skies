# Stage 14 PKG-B Mutation B1 Scope

## 1. Repository gate result

- `git rev-parse HEAD` returned `2d5b2658b7467930c4ce44995d84eb844c4d1068`.
- `git status -sb` returned `## salvage/minimal-two-surface-shell...origin/salvage/minimal-two-surface-shell`.
- `git status --short` was empty.
- `git log -52 --oneline` included:
  - `test(product): capture Stage 14 PKG-B writing-state witnesses`
  - `docs(product): plan Stage 14 PKG-B witnesses`
  - `docs(product): control Stage 14 residual deferrals`
  - `docs(product): baseline Stage 14 PKG-B`
  - `docs(product): charter Stage 14 PKG-B`
  - `docs(product): close Stage 14 PKG-E`
  - `docs(product): close Stage 14 PKG-D`
  - `docs(product): close Stage 14 PKG-A`
  - `docs(product): close Stage 14 PKG-C`
- Gate verdict: passed.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_b_charter.md`
- `docs/product_systems/stage14_pkg_b_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_b_witness_plan.md`
- `docs/product_systems/stage14_pkg_b_witness_execution.md`
- `docs/product_systems/stage14_residual_deferral_control.md`
- `app/renderer/__tests__/PkgBWritingStateWitness.test.tsx`

## 3. Accepted contradiction

- Accepted witness finding:
  - Lane A live save-state honesty: contradiction proved
- Accepted contradiction statement:
  - the active writing flow can keep the writer in the editor and workflow controls after local draft change without exposing equivalent writer-facing save-state truth such as `saved`, `dirty`, `unsaved`, `partial`, `stale`, `recovery-required`, `at risk`, or `blocked`
  - current save-state honesty still depends on returning to `ProjectHome`
- Lane B is not in scope for mutation:
  - degraded-writing / recovery / startup-resume truth was classified as contained

## 4. Mutation purpose

Mutation B1 exists only to make the active writing flow expose honest writer-facing save-state / dirty-state truth without requiring the user to return to `ProjectHome` to understand whether writing is saved, pending/dirty, unsaved, partial, stale, recovery-required, at risk, or blocked.

This is a presentation-truth mutation, not a persistence or backend-behavior mutation.

## 5. Allowed implementation boundary

Allowed only if directly needed:

- `app/renderer/components/DraftEditor.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/App.tsx`
- `app/renderer/__tests__/PkgBWritingStateWitness.test.tsx`

Conditionally allowed only if directly necessary and justified by save-state display expectations:

- existing targeted renderer tests affected by the active-writing save-state display

Allowed mutation shape:

- smallest useful active-writing display-only surface that exposes current save-state truth while the writer is editing
- wording that distinguishes saved from pending/dirty/unsaved and does not overstate persistence success
- wiring only as needed to bring already-available state truth into the active writing surface

## 6. Forbidden implementation boundary

Mutation B1 does not authorize:

- backend changes
- recovery or restore behavior changes
- snapshot behavior changes
- service-health behavior changes
- startup or resume behavior changes
- persistence or write-target behavior
- backend root behavior
- generic dirty-state architecture rewrite
- `ProjectHome` behavior unless direct evidence proves the active-writing save-state fix requires it
- UI redesign outside the active-writing save-state surface
- PKG-A identity repair changes
- PKG-D write-target repair changes
- PKG-E identity visibility polish outside save-state / degraded-writing workflow
- protected evidence
- Stage 15 work

Lane B remains out of mutation scope because it was contained, not contradicted.

## 7. Expected behavior after B1

- the active writing flow exposes a clear save-state / dirty-state surface
- the writer can distinguish saved from pending/dirty/unsaved state while writing
- if `partial`, `stale`, `recovery-required`, `at risk`, or `blocked` truth is surfaced, it must reflect current truth and not invent safety
- the fix does not falsely claim persistence success
- the writer no longer needs to return to `ProjectHome` just to understand basic active-writing save-state truth
- existing degraded/recovery/service-health/status surfaces remain unchanged
- no protected evidence is touched

## 8. Targeted test expectation

- targeted tests must use synthetic test data only
- the primary witness expectation is that the active writing flow now exposes the scoped save-state truth that the accepted witness proved was missing
- `PkgBWritingStateWitness.test.tsx` is the primary targeted witness lane and may be updated to assert the new active-writing truth surface
- any additional targeted renderer test updates must stay bounded to active-writing save-state display expectations only
- no snapshot updates
- no broad unrelated renderer test repair

## 9. Deferral-control compliance

All residuals below obey `docs/product_systems/stage14_residual_deferral_control.md`.

| Residual | Current position | Named home | Home status | Promotion trigger | Non-blocking rationale | Stage 14 closure-review visibility |
| --- | --- | --- | --- | --- | --- | --- |
| Broader save-state vocabulary normalization beyond the B1 contradiction | Stage 14 / PKG-B | `Stage 14 closure review` | active | later accepted evidence proves additional contradiction outside the active-writing save-state surface | B1 can resolve the proved contradiction without normalizing every save/degraded term across all surfaces | Yes |
| Lane B degraded/recovery/startup/status surfaces already classified as contained | Stage 14 / PKG-B | `Stage 14 closure review` | active | later accepted evidence proves a contradiction on those contained surfaces | contained status does not block a bounded Lane A mutation | Yes |
| Exploratory `AppRecovery` instability / test-health context | Stage 14 / PKG-B | `Stage 14 closure review` | active | later accepted evidence proves product-system impact rather than test-health noise | the accepted B1 contradiction was proved without relying on that exploratory instability | Yes |
| Inherited backend/write-target residuals | Stage 14 / PKG-B | `Stage 14 closure review` | active | later accepted evidence proves direct PKG-B product-system impact or later explicitly authorized ownership | those seams remain outside B1 authority and do not block a display-only save-state mutation | Yes |
| Recovery/restore destination safety | Stage 14 / PKG-B | `Stage 14 closure review` | active | later accepted evidence proves current Stage 14 action is required | not needed to resolve the active-writing save-state contradiction | Yes |
| Snapshot/export/draft write-target behavior outside prior repaired seams | Stage 14 / PKG-B | `Stage 14 closure review` | active | later accepted evidence proves reopened product-system contradiction | already outside B1 scope and previously carried outside PKG-B ownership | Yes |
| Generic backend root behavior | Stage 14 / PKG-B | `Stage 14 closure review` | active | later accepted evidence proves direct user-facing save-state impact and later authorization | backend root behavior is not required for B1 | Yes |
| Identity visibility polish outside active-writing save-state needs | Stage 14 / PKG-B | `Stage 14 closure review` | active | later accepted evidence proves a still-open Stage 14 product-system impact | B1 is limited to writer-facing save-state honesty, not broader visibility polish | Yes |

## 10. Protected evidence posture

- Protected evidence remains untouched and forbidden:
  - `sample_project/proj_esther_estate/**`
  - `sample_project/Esther_Estate/**`
  - `build/truth_receipts/**`
  - `build/runtime_truth.json`
  - `build/runtime_truth.schema.json`
  - `ci_artifacts/**`
  - tracked snapshots
  - IPC snapshot evidence
  - real user projects
- Mutation B1 scope does not authorize loading, rewriting, regenerating, or using protected evidence.

## 11. Rollback boundary

- Rollback boundary is limited to the active-writing save-state presentation seam authorized above
- no rollback plan may reach into backend behavior, recovery/restore, snapshots, service health, startup/resume, or prior closed-package seams
- if implementation proves a display-only active-writing fix cannot satisfy the contradiction without crossing those boundaries, stop and require scope amendment rather than widening B1 silently

## 12. Post-mutation reassessment requirement

After any B1 execution, a separate post-mutation reassessment record is required to confirm:

- whether the active-writing save-state honesty contradiction is resolved
- whether the mutation stayed within the allowed boundary
- whether the targeted synthetic witness evidence is sufficient
- whether any additional PKG-B mutation remains required
- whether closure preparation becomes eligible

## 13. Residuals not resolved by B1

- broader save-state vocabulary normalization
- Lane B degraded/recovery/startup/status surfaces, already contained
- exploratory `AppRecovery` instability / test-health context
- inherited backend/write-target residuals
- recovery/restore destination safety
- snapshot/export/draft write-target behavior outside prior repaired seams
- generic backend root behavior
- identity visibility polish outside active-writing save-state needs

## 14. Scope verdict

- Mutation B1 scope is accepted only for the Lane A active-writing save-state honesty contradiction
- Lane B is explicitly excluded from mutation because it was contained
- no backend, persistence, recovery/restore, snapshot, service-health, startup/resume, or prior closed-package work is authorized by this scope

PZ_CONTINUE: PKG-B Mutation B1 scope ready for review
