# Pass 129 - Scene Single-Writer Authority Repair Plan

## 1. Files inspected

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/utils/splitCommandShellState.ts`
- `app/tests/e2e/startup_authority_contract.spec.ts`
- `docs/audits/phase14/pass121a_scene_selection_oscillation_investigation.md`
- `docs/audits/phase14/pass122_scene_selection_runtime_instrumentation_plan.md`
- `docs/audits/phase14/pass123_scene_selection_runtime_instrumentation_implementation.md`
- `docs/audits/phase14/pass124_scene_instrumentation_regression_and_root_cause_review.md`
- `docs/audits/phase14/pass126_no_scene_false_ready_repair_plan.md`
- `docs/audits/phase14/pass127_no_scene_false_ready_projecthome_null_sync_repair.md`
- `docs/audits/phase14/pass128_scene_authority_failure_correction_plan.md`

## 2. Current authority map

### App authority surface

`App.tsx` is already the only component with the right to commit the canonical app-level `activeSceneId`:

- `applySceneSelection(...)`
  - direct user-selection and replay path
  - handles clear, startup, draft-preview replay, and split-command replay branches
- `activateProject(...)`
  - startup scene restore during project activation
- `handleActiveSceneChange(...)`
  - bridge from `ProjectHome` intent into `App`
- scene commit sink / debug markers
  - `scene.select.commit`
  - `__testProjectState.activeSceneId`
  - DOM `data-active-scene-id`

### ProjectHome authority surface

`ProjectHome.tsx` still behaves like a second scene writer today:

- local `activeSceneId` state
- `loadProjectAtPath(...)` computes and sets a startup scene locally
- `requestedActiveSceneIdEffect` mirrors parent scene state into local state
- `commitActiveSceneSelection(...)` writes local state and forwards intent upward
- `activeSceneEchoEffect` forwards local scene state back to `App`

### Replay helper surface

The helper modules do not own `activeSceneId`, but they persist replay state that can feed the App replay paths:

- `draftPreviewSync.ts`
  - persists `activeSceneId` inside draft-preview state
- `splitCommandShellState.ts`
  - persists `selectedSceneId` inside Split Command shell state

## 3. Broken feedback loop summary

The repro evidence after Pass 127 / Pass 128 shows a stale scene can reassert after an explicit clear:

1. `scene.select.clear`
2. `scene.select.commit` with `activeSceneId: null`
3. `scene.select.commit` back to `sc_0001`
4. `workspace.actions` flips back to `generateEnabled: true`

That is not a readiness-gate-only problem. It is a scene authority loop:

- `App` clears the scene
- `ProjectHome` still has local scene state
- `ProjectHome` re-emits a scene selection
- `App` receives the re-emitted scene and re-enables actions

The earlier null-sync repair failed because it added another transition edge instead of removing the second writer.

## 4. Single-writer decision

`App.tsx` should be the single authority for canonical `activeSceneId`.

`ProjectHome.tsx` should become an intent emitter and view mirror only:

- it may notify `App` of a user or load intent
- it may render the active scene as a mirror of the parent-provided value
- it must not independently decide or reassert the canonical scene after a clear

This is the smallest safe way to stop the loop without changing the readiness contract itself.

## 5. Writers to convert/gate

### Convert to intent emitters only

- `ProjectHome.loadProjectAtPath(...)`
  - must stop owning the startup scene as a local authority decision
  - should defer startup scene selection to `App.activateProject(...)`
- `ProjectHome.commitActiveSceneSelection(...)`
  - may emit user intent to `App`, but must not create an independent authority branch
- `ProjectHome.activeSceneEchoEffect`
  - must stop forwarding the mirrored scene back as a second writer
- `ProjectHome.requestedActiveSceneIdEffect`
  - should only synchronize the local mirror from the parent
  - must not be allowed to reassert after parent-driven clear

### Keep as App-only writers

- `App.applySceneSelection(...)`
- `App.activateProject(...)`
- `App.handleActiveSceneChange(...)`
- `App` draft-preview replay branch
- `App` split-command replay branch

## 6. Explicit clear contract

After an explicit clear:

- `App.activeSceneId` becomes `null`
- `ProjectHome` must treat `null` as authoritative, not as a transient value to repair
- no child-level echo path may reassert a scene until `App` sends a new non-null selection
- the local mirror, if retained, must clear to `null` and stay silent

Forbidden after clear:

- `ProjectHome.activeSceneEchoEffect` re-emitting the old scene
- `requestedActiveSceneIdEffect` restoring stale local state from an old scene cache
- any replay path that ignores current project context or generation tokens

## 7. Hydration/replay contract

Hydration and replay are allowed to set `activeSceneId` only through `App`, and only under explicit gates:

### Startup scene restore

- Allowed only in `App.activateProject(...)`
- Requires a project activation event
- Must resolve the startup scene from the activated project, not from stale child state
- May preserve a requested scene only when it is valid for the newly activated project

### Draft-preview replay

- Allowed only in `App` when:
  - the draft-preview state belongs to the current project path
  - the source id is not self
  - the hydration token is current for this project switch
  - the replayed scene exists in the current project

### Split-command replay

- Allowed only in `App` when:
  - Split Command is enabled and hydrated
  - the persisted scene belongs to the current project
  - the selected scene differs from the current active scene
  - the replay uses the current split-command hydration token

### Explicit clear boundary

- Once the current scene is cleared, stale replay state must not reassert the previous scene unless a fresh, current-generation replay is explicitly produced by App-owned logic.

## 8. Minimal implementation plan

The smallest safe runtime patch is:

1. Remove `ProjectHome` as an independent scene writer.
2. Make `App` the only canonical writer for `activeSceneId`.
3. Keep `ProjectHome` as a controlled mirror and intent emitter.
4. Ensure child-level clear handling cannot reassert a stale scene.
5. Keep replay writers in `App`, but gate them by current project and hydration generation token.

The practical patch shape should be:

- in `ProjectHome.tsx`, stop any local scene write that can outlive the parent clear
- keep the user click path as an intent callback to `App`
- keep `requestedActiveSceneId` as a one-way mirror from `App`
- do not touch `WorkspaceHeader` readiness logic in this pass

## 9. Authorized files

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`

Conditional only if the replay gates need to be narrowed after the single-writer patch:

- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/utils/splitCommandShellState.ts`

## 10. Unauthorized files

- `app/renderer/components/WorkspaceHeader.tsx`
- backend/service/snapshot files
- dependency and lockfile changes
- unrelated tests and fixtures
- broad readiness-only edits that do not close the scene authority loop

## 11. Validation plan

The next implementation pass must validate with:

- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron`
- `pnpm --filter app test`
- `pnpm --filter app build`
- human repro retest using the scene debug log
- `git diff --check`
- `pnpm lint:docs`

## 12. Final verdict

`READY FOR SINGLE-WRITER IMPLEMENTATION`

Reason:

- The failing startup contract is downstream of a broader scene authority loop.
- The safe next step is to make `App` the single source of truth for `activeSceneId` and demote `ProjectHome` to a mirror/intent emitter.
- Readiness-gate-only changes are not sufficient on their own.
