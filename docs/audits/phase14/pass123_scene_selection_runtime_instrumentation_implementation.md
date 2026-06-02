# Pass 123 - Scene Selection Runtime Instrumentation Implementation

## 1. Files changed

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`

No helper or backend files were modified.

## 2. Instrumentation Summary

Added structured debug events for the active-scene write paths identified in Pass 122.

App-side instrumentation now records:

- `scene.write.apply`
- `scene.write.draft-preview`
- `scene.write.activate-project`
- `scene.write.handle-active-scene-change`
- `scene.write.split-command`
- `scene.select.commit` with structured metadata

ProjectHome-side instrumentation now records:

- `project-home.scene.write` for load-default scene selection
- `project-home.scene.write` for `requestedActiveSceneId` sync
- `project-home.scene.write` for scene-card clicks
- `project-home.scene.write` for the callback echo back to `App`

Each structured event includes, where available:

- `eventId`
- `order`
- `timestampMs`
- `perfMs`
- `writerKind`
- `sourceFunction`
- `requestedSceneId`
- `previousSceneId`
- `committedSceneId`
- `projectId`
- `projectPath`
- `projectSwitchGenerationToken`
- `hydrationGenerationToken`
- `causalTriggerId`
- `outcome`
- `skipReason`

## 3. Whether Behavior Changed

No intended behavior changed.

The implementation only adds diagnostic logging and metadata capture. Scene selection, project switching, hydration behavior, and split-command selection logic remain unchanged.

## 4. Whether Scope Expanded

No scope expansion.

The implementation stayed inside the authorized renderer files and did not touch backend code, snapshot code, dependencies, fixtures, or tests beyond existing coverage running against the new logs.

## 5. Validation Results

- `pnpm --filter app test` -> pass (`59 passed`, `330 passed`)
- `pnpm --filter app build` -> pass
- `git diff --check` -> pass
- `pnpm lint:docs` -> pass

## 6. How to Collect Evidence During Human Repro

1. Reproduce the oscillation in the human smoke lane while keeping the app console open.
2. Capture the renderer console output or the debug log payload stream from `window.__blackskiesDebugLog`.
3. Compare the event order for:
   - `project-home.scene.write`
   - `scene.write.apply`
   - `scene.write.draft-preview`
   - `scene.write.activate-project`
   - `scene.write.handle-active-scene-change`
   - `scene.write.split-command`
   - `scene.select.commit`
4. For each oscillation cycle, identify:
   - which writer emitted last before the scene flipped,
   - whether the write was an `apply` or `skip`,
   - which `projectSwitchGenerationToken` and `hydrationGenerationToken` were active,
   - whether the commit sink observed a state change or a no-op.
5. Repeat the repro multiple times to determine whether one writer dominates across runs.

## 7. Final Verdict

`INSTRUMENTATION COMPLETE`

The pass added the required structured runtime evidence surface without implementing any scene-selection repair.
