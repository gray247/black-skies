# Pass 124 - Scene Instrumentation Regression and Oscillation Root-Cause Review

## 1. Files inspected

- `git diff HEAD~1..HEAD`
- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/tests/e2e/startup_authority_contract.spec.ts`
- `docs/audits/phase14/pass121a_scene_selection_oscillation_investigation.md`
- `docs/audits/phase14/pass122_scene_selection_runtime_instrumentation_plan.md`
- `docs/audits/phase14/pass123_scene_selection_runtime_instrumentation_implementation.md`

## 2. Workflow failure summary

Two red signals are present after Pass 123:

1. React warning:
   - `Cannot update ProjectHome while rendering ProjectHome.`
2. CI failure:
   - `startup_authority_contract`
   - `action readiness contract`
   - `NO_SCENE_FALSE_READY`
   - Generate/Critique enabled when no scene.

The human repro logs also show scene oscillation after project switch, with writer names alternating between:

- `project_home_prop_sync`
- `project_home_callback`
- `draft_preview_replay`

and scene ids alternating between `sc_0001` and `sc_0002`.

## 3. React warning root-cause assessment

Pass 123 introduced a render-phase side effect in `ProjectHome.tsx`.

The problematic path is the `loadProjectAtPath(...)` success branch, where `setActiveSceneId((previous) => { ... })` now calls `recordSceneWriteTrace(...)` inside the functional updater.

That is not a pure updater. `recordSceneWriteTrace(...)` calls `recordDebugEvent(...)`, and `recordDebugEvent(...)` notifies `useSyncExternalStore` subscribers via `appendEvent(...) -> notifyListeners()`.

`ProjectHome` itself subscribes to the debug log with `useSyncExternalStore(subscribeDebugLog, getDebugLogSnapshot)`, so the new instrumentation can trigger a state update while React is still processing the updater for `ProjectHome`.

Assessment:

- Pass 123 did introduce a render-phase update side effect.
- This warning is therefore an instrumentation regression, not a scene-authority repair regression.
- The smallest safe fix is to remove the side effect from the functional updater path in `ProjectHome.tsx`, or move the trace emission to a passive effect that runs after the state commit.

## 4. Instrumentation regression assessment

The regression is localized to `ProjectHome.tsx`.

Confirmed facts:

- `ProjectHome` now records trace events from:
  - `requestedActiveSceneIdEffect`
  - `commitActiveSceneSelection`
  - `loadProjectAtPath`
  - `activeSceneEchoEffect`
- The `loadProjectAtPath` branch uses a functional updater for `setActiveSceneId`.
- The updater contains `recordSceneWriteTrace(...)`, which writes into the shared debug log and can notify the same component through `useSyncExternalStore`.

Conclusion:

- The render warning is caused by the new instrumentation path.
- This is not proof that the underlying scene-selection semantics changed.
- It is a regression introduced by the logging mechanism itself.

## 5. Scene oscillation root-cause assessment

The runtime trace names now support a multi-writer loop, but they do not prove a single dominant writer.

Observed writer pattern from the human repro:

- `project_home_prop_sync`
- `project_home_callback`
- `draft_preview_replay`

Those names are consistent with at least two independent authority paths:

1. `ProjectHome` re-emitting local scene state back to `App`.
2. `App` reapplying draft-preview hydration state.

Assessment:

- The log now strengthens the existing multi-writer theory.
- It does not prove one writer is dominant at the required `>= 80%` threshold.
- The evidence still fits `MULTIPLE CAUSES REMAIN` better than `ROOT CAUSE IDENTIFIED`.

## 6. Smallest safe repair recommendation

Do not start the broad scene-selection repair yet.

The smallest safe next step is:

1. Remove the render-phase debug write from `ProjectHome.tsx` by moving `recordSceneWriteTrace(...)` out of the functional `setActiveSceneId` updater.
2. Preserve the existing scene-selection behavior and keep all authority logic unchanged.
3. Rerun the readiness contract after the warning is removed.
4. If `NO_SCENE_FALSE_READY` still fails, then investigate the underlying authority race separately with the existing runtime trace surface.

This keeps the instrumentation regression isolated from the pre-existing scene-authority bug.

## 7. Files authorized for next implementation

- `app/renderer/components/ProjectHome.tsx`

Conditional only after the warning is removed and the readiness failure is reproven:

- `app/renderer/App.tsx`

## 8. Files explicitly unauthorized

- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/utils/splitCommandShellState.ts`
- `services/src/blackskies/services/*`
- `services/tests/*`
- any snapshot, backend, schema, provider, or dependency change

## 9. Final verdict

`MULTIPLE CAUSES REMAIN`

Reason:

- The React warning is a confirmed Pass 123 instrumentation regression.
- The `NO_SCENE_FALSE_READY` failure still appears to involve the underlying scene-authority/readiness bug, but it is not yet separated cleanly from the new render-phase instrumentation side effect.
- The runtime logs show oscillation, but not a dominant writer at `>= 80%` confidence.
