# Pass 128 - Scene Authority Failure Correction Plan From Dirty Tree

## 1. Files inspected

- `git diff`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/App.tsx`
- `app/tests/e2e/startup_authority_contract.spec.ts`
- `docs/audits/phase14/pass126_no_scene_false_ready_repair_plan.md`
- `docs/audits/phase14/pass127_no_scene_false_ready_projecthome_null_sync_repair.md`
- `docs/audits/phase14/pass121a_scene_selection_oscillation_investigation.md`
- `docs/audits/phase14/pass122_scene_selection_runtime_instrumentation_plan.md`
- `docs/audits/phase14/pass124_scene_instrumentation_regression_and_root_cause_review.md`

## 2. Current dirty diff summary

The working tree is dirty only in documentation after reverting the Pass 127 runtime edge:

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase14/pass127_no_scene_false_ready_projecthome_null_sync_repair.md`

`app/renderer/components/ProjectHome.tsx` is no longer dirty in the current tree. The Pass 127 runtime null-sync change was reverted before this correction plan was finalized.

## 3. Regression assessment of Pass 127

Pass 127 worsened the scene authority surface rather than closing it.

Evidence:

- The attempted `ProjectHome` null-sync change added a new transition edge: parent-driven null clear -> local clear -> local echo suppression.
- After that change, the startup authority suite got worse, not better.
- Reverting the runtime change restored the scene selection authority contract, which indicates the local null-sync edge was not a safe fix.
- The remaining failure still reproduces on the action-readiness path, which means the broader scene ownership problem was not solved by the local null-sync repair.

Conclusion:

- Pass 127 should remain recorded as a failed attempt.
- The runtime null-sync change should stay reverted.

## 4. Revert / revise / escalate decision

Decision: **REVERT PASS 127 RUNTIME CHANGE** and **escalate to a broader scene single-writer repair plan**.

Reasoning:

- Revising the same `ProjectHome` null-sync edge in place is too narrow.
- The retry evidence shows the scene can still reassert after a clear, so the problem is not isolated to the exact null-sync branch that Pass 127 touched.
- The appropriate next repair target is the shared scene authority boundary, not another local null-handling adjustment.

## 5. Updated root-cause assessment

The current evidence does **not** support a claim that the issue is solved by `ProjectHome` local state management alone.

What the logs show after the revert:

- `scene.select.clear` fires.
- `scene.select.commit` records `activeSceneId: null`.
- `scene.select.commit` then records `activeSceneId: sc_0001` again.
- `workspace.actions` reports `generateEnabled: true` after the reassertion.

That sequence means the null-clear path is not authoritative enough to stay cleared. The problem is broader than a one-off null-sync bug:

- either another writer is still reasserting scene ownership,
- or the parent/child authority boundary still allows stale scene state to re-enter after clear,
- or both.

The action-readiness gate itself is therefore not the primary fix target yet. It is reading from a scene state that still has authority churn.

## 6. Smallest safe correction plan

The smallest safe next step is not another local `ProjectHome` null-sync patch.

Recommended next implementation boundary:

1. Reopen the scene authority model as a single-writer problem.
2. Identify every remaining scene writer that can reassert after a parent clear.
3. Gate or remove the reassertion path that survives the clear transition.
4. Keep action-readiness gating unchanged until the scene authority path is stable.

If the next repair proves that `App.tsx` is the only safe authority boundary, the fix should move there. If `ProjectHome` still needs to emit intent, it should do so as a controlled child, not as an independent scene owner.

## 7. Files authorized for correction

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`

Conditional only if the scene authority plan proves the replay paths are still participating:

- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/utils/splitCommandShellState.ts`

## 8. Files explicitly unauthorized

- `app/renderer/components/WorkspaceHeader.tsx`
- backend/service/snapshot files
- dependencies and lockfiles
- unrelated tests and fixtures
- broad readiness-gate-only edits that do not address scene authority

## 9. Validation plan

If the next implementation pass proceeds, validate with:

- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron`
- `pnpm --filter app test`
- `pnpm --filter app build`
- `git diff --check`
- `pnpm lint:docs`

## 10. Final verdict

`REVERT PASS 127 RUNTIME CHANGE`

Reason:

- The Pass 127 runtime edge did not repair the startup authority failure.
- The current tree should remain on the reverted runtime behavior.
- The next repair should be planned as a broader scene single-writer authority effort, not a revision of the failed null-sync edge.
