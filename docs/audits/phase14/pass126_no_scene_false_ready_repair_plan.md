# Pass 126 - NO_SCENE_FALSE_READY Action Readiness Repair Plan

## 1. Files inspected

- `app/tests/e2e/startup_authority_contract.spec.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `docs/audits/phase14/pass124_scene_instrumentation_regression_and_root_cause_review.md`
- `docs/audits/phase14/pass125_projecthome_instrumentation_regression_fix.md`

## 2. Failure summary

The failing startup authority contract is:

- `startup_authority_contract › action readiness contract`
- classification: `NO_SCENE_FALSE_READY`

Observed failure:

- Generate and Critique remain enabled after the scene has been cleared in the project-loaded state.

This is separate from the Pass 123 instrumentation regression.
Pass 125 removed the render-phase warning path, but this readiness failure still reproduces.

## 3. Action-readiness ownership map

### Where the buttons are rendered

The buttons are rendered in `WorkspaceHeader.tsx`:

- `workspace-action-generate`
- `workspace-action-critique`

### Where enabled/disabled state is computed

The parent `App.tsx` computes the gate:

- `projectReadyForActions`
- `sceneReadyForActions = Boolean(activeSceneId)`
- `servicesReadyForActions`
- `disableGenerate`
- `disableCritique`

### What state drives readiness

The readiness contract currently depends on renderer state in `App.tsx`, not directly on `ProjectHome.tsx`.

The critical gate is:

- `sceneReadyForActions` from `activeSceneId`

## 4. Expected contract

From `startup_authority_contract.spec.ts`:

- Case A: no project loaded -> actions must be disabled.
- Case B: project loaded, no active scene -> actions must remain disabled.
- Case C: project loaded, selected scene present, service online -> actions may be enabled.

The `NO_SCENE_FALSE_READY` classification means:

- the test cleared the active scene,
- the DOM showed `activeSceneId = null`,
- but `workspace-action-generate` and `workspace-action-critique` were still enabled.

## 5. Actual broken behavior

The most likely broken path is a stale local scene state in `ProjectHome.tsx`.

Current ownership flow:

1. `App.tsx` clears `activeSceneId` through the harness scene-selection path.
2. `ProjectHome.tsx` receives `requestedActiveSceneId={activeSceneId}` from `App`.
3. `ProjectHome.tsx` keeps its own local `activeSceneId` state.
4. The `requestedActiveSceneId` sync effect only handles non-null values.
5. When the parent clears the scene to `null`, the child local state is not explicitly cleared.
6. The `activeSceneEchoEffect` can then re-emit the stale local scene back to `App`.
7. `App.tsx` sees a scene again, so `sceneReadyForActions` becomes true and the buttons re-enable.

This matches the observed failure mode:

- parent scene cleared
- readiness briefly or persistently reasserts as ready
- action buttons remain enabled

## 6. Candidate root cause ranked by confidence

1. **ProjectHome local scene state is not cleared when the parent clears `requestedActiveSceneId`** - **85%**
   - `requestedActiveSceneIdEffect` only handles non-null values.
   - `activeSceneEchoEffect` can re-emit stale local selection after a parent clear.
   - This is consistent with `NO_SCENE_FALSE_READY` and with the earlier oscillation evidence.
2. **App readiness is reading stale scene state during a re-render window** - **10%**
   - Possible as a symptom, but the current data flow suggests the stale writer is in `ProjectHome`.
3. **Pass 123/125 instrumentation caused the readiness bug** - **5%**
   - Pass 125 removed the render-phase warning regression.
   - The readiness failure still reproduces, so instrumentation is not the primary cause.

## 7. Smallest safe repair plan

Keep the fix narrow and local to scene-state synchronization.

Recommended change:

1. Update `ProjectHome.tsx` so the local `activeSceneId` is explicitly cleared when `requestedActiveSceneId` becomes `null` and an active project exists.
2. Preserve the existing non-null sync behavior for valid requested scenes.
3. Keep `activeSceneEchoEffect` behavior intact unless the null-sync fix proves sufficient.
4. Do not touch the workspace action gating in `App.tsx` unless the local sync fix fails to remove the false-ready state.

Why this is the smallest safe fix:

- It addresses the stale local state at the boundary where the mismatch originates.
- It does not change the readiness contract itself.
- It does not add debounce, generation guards, or broader authority logic.

## 8. Authorized files for implementation

- `app/renderer/components/ProjectHome.tsx`

Conditional only if the local sync fix is insufficient:

- `app/renderer/App.tsx`

## 9. Unauthorized files

- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/utils/splitCommandShellState.ts`
- backend/service/snapshot files
- tests, fixtures, dependencies, and lockfiles

## 10. Validation plan

If implemented, validate with:

- `git diff --check`
- `pnpm lint:docs`

Then re-run the targeted contract:

- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron`

Expected result after the fix:

- `NO_SCENE_FALSE_READY` should no longer fail.
- Generate/Critique should remain disabled when the scene is cleared.

## 11. Final verdict

`READY FOR IMPLEMENTATION`

Reason:

- The failure is a real product bug, not test drift.
- The likely root cause is isolated to a stale local scene-selection sync in `ProjectHome.tsx`.
- The smallest safe repair path is identified and remains narrow.
