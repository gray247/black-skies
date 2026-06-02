# Pass 125 - ProjectHome Instrumentation Regression Fix

## 1. Files changed

- `app/renderer/components/ProjectHome.tsx`
- `docs/audits/phase14/pass125_projecthome_instrumentation_regression_fix.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

## 2. Implementation summary

Fixed the Pass 123 instrumentation regression in `ProjectHome.tsx`.

The `loadProjectAtPath(...)` success path no longer emits `recordSceneWriteTrace(...)` inside the functional `setActiveSceneId((previous) => { ... })` updater.

Instead:

- the updater only computes and returns the next scene id,
- the trace emission happens immediately after `setActiveSceneId(...)` returns,
- the diagnostic payload keeps the same meaning:
  - `writerKind: 'project_switch'`
  - `sourceFunction: 'loadProjectAtPath'`
  - `requestedSceneId`
  - `previousSceneId`
  - `committedSceneId`
  - `projectSwitchGenerationToken`
  - `causalTriggerId: 'project-home.load.success'`

Scene selection behavior was not changed.

## 3. Whether behavior changed

No intended behavior change.

The fix only removes the render-phase debug side effect. The project-switch and scene-selection result remain the same.

## 4. Whether scope expanded

No scope expansion.

Only `ProjectHome.tsx` was modified for runtime behavior. No backend, snapshot, hydration, or authority logic was changed.

## 5. React warning status

The specific Pass 124 warning path is removed from the updater.

Validation did not reproduce `Cannot update ProjectHome while rendering ProjectHome.` during the targeted Playwright run.

## 6. startup_authority_contract status

Still failing in the existing readiness contract:

- `NO_SCENE_FALSE_READY`
- Generate/Critique were enabled after clearing the scene in the project-loaded/no-active-scene case.

That failure is separate from the render-phase instrumentation regression and remains out of scope for this pass.

## 7. Validation results

- `pnpm --filter app test` -> pass (`59 passed`, `330 passed`)
- `pnpm --filter app build` -> pass
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron` -> 10 passed, 1 failed
  - failed test: `startup_authority_contract › action readiness contract`
  - failure: `NO_SCENE_FALSE_READY`
- `git diff --check` -> pass
- `pnpm lint:docs` -> pass

## 8. Dirty tree

- `M app/renderer/components/ProjectHome.tsx`
- `M docs/BLACK_SKIES_FIX_TRACKER.md`
- `?? docs/audits/phase14/pass125_projecthome_instrumentation_regression_fix.md`

## 9. Final verdict

`REGRESSION FIXED WITH CAVEATS`

The instrumentation-caused render-phase regression is fixed. The startup authority readiness bug remains and requires a separate pass.
