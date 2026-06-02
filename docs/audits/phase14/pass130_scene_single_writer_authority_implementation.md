# PASS 130 - SCENE SINGLE-WRITER AUTHORITY IMPLEMENTATION

## Files Changed
- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `docs/BLACK_SKIES_FIX_TRACKER.md`

## Implementation Summary
- `ProjectHome.tsx` now keeps a local mirror for standalone rendering and emits scene intent through the normal callback path.
- The child-level `activeScene` echo effect remains removed, so `ProjectHome` no longer independently reasserts scene state back into `App` after an explicit clear.
- `App.tsx` remains the canonical writer for `activeSceneId`.
- Explicit clear handling still writes the cleared draft-preview state and suppresses scene replay while the clear lock is active.
- `resolveStartupScene()` keeps the first-scene fallback so startup authority stays deterministic when no persisted or requested scene is available.

## Single-Writer Authority Summary
- Canonical authority: `App.tsx`
- Non-authoritative mirror / intent emitter: `ProjectHome.tsx`
- The remaining direct `activeSceneId` writes are App-owned:
  - explicit user selection
  - explicit clear
  - startup scene restore
  - draft-preview replay
  - split-command replay

## Whether ProjectHome Still Independently Writes `activeSceneId`
- Yes, but only as a local mirror for standalone rendering and user-intent tracking.
- `ProjectHome` no longer independently reasserts canonical scene state back into `App` on parent-driven clear, and it no longer serves as a second canonical authority.

## Whether `App.tsx` Changed
- Yes.
- `resolveStartupScene()` now preserves the first-scene fallback again so startup contracts remain authoritative.
- Draft-preview replay is additionally blocked while the scene-clear lock is active.
- Clear handling continues to write cleared draft-preview state for the current project path.

## Whether Conditional Utility Files Changed
- No.
- `app/renderer/utils/draftPreviewSync.ts` and `app/renderer/utils/splitCommandShellState.ts` were not modified.

## Validation Results
- `pnpm --filter app exec playwright test tests/e2e/startup_authority_contract.spec.ts --project=electron`
  - Passed.
- `pnpm --filter app test`
  - Passed (`59 passed`, `330 tests`).
- `pnpm --filter app build`
  - Passed after the final runtime change.
- `git diff --check`
  - Passed after the final runtime change.
- `pnpm lint:docs`
  - Passed after the final runtime change.

## Human Repro Evidence
- The runtime logs now show the explicit clear path staying cleared until the next intentional scene selection.
- The startup authority contract exercises the clear path and shows `Generate` / `Critique` disabled while no scene exists, then enabled only after a deliberate scene selection.
- The old `ProjectHome` child echo loop is not present in the runtime logs.

## Non-Proof Boundary
- This pass does not prove the remaining startup-contract failures are unrelated.
- It does prove the `ProjectHome` child echo was removed and `App` is the canonical active scene authority.
- It does not substitute for ad hoc human smoke, but the startup authority suite now covers the explicit clear / reselect path that was failing.

## Remaining Risks
- The startup authority suite is green, but the broader GUI still benefits from a human smoke retest when time allows.
- The App-side clear-lock and replay guards are intentionally narrow and should stay under regression watch.
- The local ProjectHome mirror still exists for standalone rendering, so any future authority drift should be caught with the same startup contract.

## Final Verdict
- `SINGLE-WRITER REPAIR COMPLETE WITH CAVEATS`
