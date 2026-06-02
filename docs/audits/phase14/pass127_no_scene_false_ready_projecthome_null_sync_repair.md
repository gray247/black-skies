# Pass 127 - NO_SCENE_FALSE_READY ProjectHome Null-Sync Repair

## 1. Files changed

- `app/renderer/components/ProjectHome.tsx`
- `docs/audits/phase14/pass127_no_scene_false_ready_projecthome_null_sync_repair.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

## 2. Implementation summary

Implemented the narrow `ProjectHome` null-sync repair:

- when `requestedActiveSceneId` becomes `null` while an active project exists, local `activeSceneId` is explicitly cleared,
- the local echo path is suppressed for that parent-driven null-clear transition so it does not immediately re-emit a stale scene,
- the existing non-null sync path remains unchanged.

No changes were made to `App.tsx`, `WorkspaceHeader.tsx`, hydration replay helpers, or backend code.

## 3. Whether behavior changed

Intended behavior change:

- the child `ProjectHome` now clears its local scene state when the parent clears the active scene.

No broader authority or hydration redesign was introduced.

## 4. Whether scope expanded

No scope expansion in implementation.

Only `ProjectHome.tsx` was modified for runtime behavior.

## 5. startup_authority_contract status

The targeted contract did not become green.

Observed Playwright outcome:

- `startup_authority_contract › scene selection authority contract` failed with a bootstrap stability timeout and an unexpected loaded project path in the snapshot.
- `startup_authority_contract › action readiness contract` failed again, now timing out while waiting for Generate to become enabled in the expected sequence.

This means the null-sync fix did not cleanly isolate the ownership problem.

## 6. Full app validation results

- `pnpm --filter app test` -> pass (`59 passed`, `330 tests`)
- `pnpm --filter app build` -> pass
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron` -> `9 passed, 2 failed`
  - failed tests:
    - `startup_authority_contract › scene selection authority contract`
    - `startup_authority_contract › action readiness contract`
- `git diff --check` -> pass
- `pnpm lint:docs` -> pass

## 7. Remaining scene oscillation risk

Still present.

The broader scene-selection authority problem remains unresolved, and the null-sync change did not prove that local `ProjectHome` ownership is the only writer involved.

## 8. Dirty tree

- `M app/renderer/components/ProjectHome.tsx`
- `M docs/BLACK_SKIES_FIX_TRACKER.md`
- `?? docs/audits/phase14/pass127_no_scene_false_ready_projecthome_null_sync_repair.md`

## 9. Final verdict

`REPAIR BLOCKED`

Reason:

- The narrow null-sync change was applied as intended, but the required Playwright contract did not go green.
- The scene authority/readiness surface still has broader coupling that needs another pass before this lane can be called repaired.
