# Pass 121A - Scene Selection Oscillation Investigation

## 1. Files inspected

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/utils/splitCommandShellState.ts`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/renderer/__tests__/ProjectHome.test.tsx`
- `app/main/preload.ts`
- `config/runtime.yaml`
- `docs/audits/phase14/pass120_workflow_smoke_human_verification_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

## 2. ActiveScene ownership map

Primary committed `activeScene` owner is in `App.tsx` state (`const [activeScene, setActiveScene]`), but multiple write paths exist:

1. `applySceneSelection(...)` writes `setActiveScene(...)` (`App.tsx:769-843`).
2. Draft-preview sync hydration writes `setActiveScene(...)` from shared state (`App.tsx:1048-1057`).
3. `activateProject(...)` writes startup scene with `setActiveScene(nextScene)` (`App.tsx:1486-1523`).
4. `handleActiveSceneChange(...)` writes `setActiveScene(...)` from `ProjectHome` callbacks/effects (`App.tsx:2049-2058`).
5. Reset/clear paths write `setActiveScene(null)` (`App.tsx:1201-1207`, `App.tsx:2050-2052`, `App.tsx:772-783`).

`ProjectHome` has its own local `activeSceneId` state and can drive `App` writes through `onActiveSceneChange`:

1. Scene click path: `commitActiveSceneSelection(...)` -> `onActiveSceneChange(...)` (`ProjectHome.tsx:377-395`, `ProjectHome.tsx:1580-1585`).
2. Effect echo path: whenever `activeProject/activeScene/activeSceneDraft` change, `onActiveSceneChange(...)` re-emits (`ProjectHome.tsx:1136-1149`).
3. Prop sync path: `requestedActiveSceneId` can overwrite local `activeSceneId` (`ProjectHome.tsx:368-375`).

## 3. Project-switch ownership map

Project switch writes span `ProjectHome` and `App`:

1. `ProjectHome.loadProjectAtPath(...)` sets local `activeProject`, chooses local `activeSceneId`, then emits `onProjectLoaded(status: loaded, project)` (`ProjectHome.tsx:750-785`).
2. `App.handleProjectLoaded(...)` receives payload and calls `activateProject(project)` (`App.tsx:1900-1984`).
3. `activateProject(...)` sets `currentProject`, drafts, and startup `activeScene` (`App.tsx:1486-1531`).
4. Updated `activeSceneId` is passed back into `ProjectHome` as `requestedActiveSceneId` (`App.tsx:2650-2661`), enabling a second scene-selection write path in the child.

Conclusion: project switching and scene switching share the same authority boundary; both mutate scene selection through `App` + `ProjectHome` bidirectional coupling.

## 4. Hydration ownership map

Hydration/restoration-capable writers:

1. Startup persisted scene restore via `resolveStartupScene(...)` reading `readDraftPreviewSyncState(project.path)?.activeSceneId` (`App.tsx:197-218`).
2. Draft-preview storage hydration effect:
   - parses shared localStorage state,
   - can set drafts/current project,
   - can write `setActiveScene(...)` from `sharedState.activeSceneId` (`App.tsx:1006-1057`).
3. Split-command shell hydrate/select sync (feature-flagged):
   - hydrates persisted shell `selectedSceneId`,
   - can call `applySceneSelection(shell.selectedSceneId)` when mismatch exists (`App.tsx:2223-2315`, `splitCommandShellState.ts:36-75`).
4. `ProjectHome` requested-scene sync effect can reapply upstream scene choice to local selection (`ProjectHome.tsx:368-375`).

## 5. Write-order timeline

Observed smoke behavior (Pass 120 human run) reports repeated scene reassertion by Scene 1 while user attempts Scene 2.

Ordered write trace supported by code and runtime instrumentation:

1. Project load/switch commits a startup scene through `activateProject(...)` (`App.tsx:1486-1523`).
2. User scene click calls `commitActiveSceneSelection(...)` (`ProjectHome.tsx:377-395`, `1580-1585`).
3. `App.handleActiveSceneChange(...)` commits clicked scene (`App.tsx:2049-2058`).
4. Competing hydration-capable paths can reapply prior scene:
   - draft-preview shared-state hydration (`App.tsx:1048-1057`);
   - split-command selected-scene reapply when feature is active (`App.tsx:2298-2309`).
5. Commit markers emit from `scene.select.commit` instrumentation (`App.tsx:2553-2571`).

Runtime evidence used in this pass:

- Existing human-smoke runtime evidence: user-reported deterministic oscillation and Scene 1 reassertion during switching.
- Reproduced ordered runtime trace proof seam:
  - command: `pnpm --filter app exec vitest run renderer/__tests__/AppPreflight.test.tsx -t "does not re-emit scene commit diagnostics when the active scene identity is unchanged" --silent=false`
  - result: pass (`1 passed | 45 skipped`), confirming live scene-commit event sequencing contract is active in runtime tests.
  - trace anchor in test: `AppPreflight.test.tsx:2157-2186` (`commitLogs` count remains stable on same-scene select and increments only on true scene change).

## 6. Candidate root causes ranked by confidence

1. **Competing writer loop across App scene owner and hydration reapply paths** - **65%**
2. **ProjectHome bidirectional sync churn (`requestedActiveSceneId` + `onActiveSceneChange` echo) under project-switch transitions** - **25%**
3. **Split-command persisted selected-scene reapply loop** - **10%** (conditional on feature enablement)

## 7. Evidence supporting each candidate

### Candidate 1 (65%)

- Multiple authoritative writers exist in `App.tsx` (`applySceneSelection`, hydration write, activateProject write, callback write).
- Hydration writer can set scene from persisted/shared state after user-driven changes (`App.tsx:1048-1057`).
- Human smoke symptom ("Scene 1 fighting selection") matches stale-state reapply profile.

### Candidate 2 (25%)

- `ProjectHome` local scene state can be overwritten from parent prop (`ProjectHome.tsx:368-375`) and also emits scene back to parent on effect (`ProjectHome.tsx:1136-1149`).
- That two-way sync can create repeated scene commits during project switch/rebind windows.

### Candidate 3 (10%)

- Split-command mode can reapply hydrated shell selection via `applySceneSelection(...)` when selected scene and active scene diverge (`App.tsx:2298-2309`).
- `config/runtime.yaml` does not set `experimentalSplitCommandWorkspace`, so this lane is not default in ordinary runtime config.

## 8. Recommended smallest investigation-confirmed repair direction

No repair is implemented in this pass.

Smallest high-probability repair direction for the next lane:

1. Enforce a single commit authority in `App` for live `activeScene`.
2. During project-switch/hydration windows, gate non-user scene reapply writes behind generation/token checks so stale hydration cannot overwrite a newer user selection.
3. Narrow `ProjectHome` echo behavior so passive re-renders do not re-emit equivalent scene ownership writes.
4. Keep split-command logic out of scope unless reproduction confirms feature enabled in failing run.

## 9. Files likely involved

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/utils/splitCommandShellState.ts` (only if split-command mode is proven active)

## 10. Files definitely not involved

- `services/src/blackskies/services/io.py`
- `services/src/blackskies/services/memory_prototype/storage.py`
- `services/src/blackskies/services/routers/snapshots.py`
- `services/src/blackskies/services/snapshots.py`

These backend/snapshot files do not own renderer `activeScene` state and have no scene-selection write path.

## 11. Final verdict

`MULTIPLE CANDIDATES REMAIN`

Reason:

- A dominant candidate is present but below the required `>= 80%` confidence threshold.
- This pass contains runtime evidence and ordered trace anchors, but not a direct reproduced oscillation log sequence proving one writer path as the sole cause.
- Per pass rule, static code-path analysis plus indirect runtime signals is insufficient to claim `ROOT CAUSE IDENTIFIED`.
