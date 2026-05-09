# Phase 13 Pass 7 - Snapshot / Report Path Integrity Fix

## Summary
This pass fixed the broken snapshot/report path boundary in the renderer bridge and removed silent failure behavior from reveal/open actions.

The previous behavior mixed snapshot directory actions with report/report-file actions and swallowed `shell.openPath` failures. That made it unclear whether a snapshot action was supposed to open a folder, a report file, or merely reopen the snapshots panel. This pass makes the failure cases explicit and ensures the canonical report path is used when a report file is available.

## Root Cause
The path integrity problem came from two layers:

1. `app/main/preload.ts` returned `void` from `revealPath`, so `shell.openPath` failures were logged but not surfaced to the renderer.
2. `app/renderer/App.tsx` and `app/renderer/components/SnapshotsPanel.tsx` were using reveal helpers that treated different snapshot-related surfaces as interchangeable. The snapshot-created toast previously implied a report action while revealing a snapshot directory, and panel actions like `Reveal`, `Manifest`, and restore-folder open did not report failure clearly.

There was also one stale e2e selector in `app/tests/e2e/gui.snapshot_verification_flow.spec.ts` that matched the permanent workspace `Snapshots` button instead of the toast action.

## Files Changed
- `app/shared/ipc/services.ts`
- `app/main/preload.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/vitest.setup.ts`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/renderer/__tests__/AppRestore.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`

## Behavior Before
- `revealPath` returned no structured success/failure result.
- `shell.openPath` failures could be swallowed.
- Snapshot-created toast wording suggested a report action while actually targeting the snapshot directory.
- Missing report files and missing snapshot directories did not always produce a clear renderer-visible explanation.
- Panel `Reveal`, `Manifest`, and restore-folder actions could fail without a structured toast error.
- The Playwright snapshot flow test could match the persistent workspace `Snapshots` button as well as the toast action.

## Behavior After
- `revealPath` now returns a structured result:
  - `{ ok: true, path }` on success
  - `{ ok: false, error }` when the OS cannot open the path
- Renderer helpers now distinguish between:
  - snapshot directory
  - report file
  - export folder
  - snapshot manifest
  - restored folder
- Missing paths now produce clear renderer-visible errors such as:
  - `Snapshot directory missing`
  - `Report file missing`
  - `Snapshot manifest missing`
  - `Restored folder missing`
- OS open failures now surface as:
  - `Unable to open ...`
  - `OS could not open path: ...`
- The snapshot-created toast action now opens the snapshots panel only and no longer pretends to be a report open.
- The verification toast now uses the canonical report file path when present and offers a distinct `Open report file` action.
- The snapshot panel now reports reveal failures for `Reveal`, `Manifest`, and restore-folder actions instead of swallowing them.
- The Playwright snapshot flow test now scopes the toast action to the toast button, not the permanent workspace control.

## Tests Added / Updated
- `app/renderer/__tests__/AppPreflight.test.tsx`
  - verifies the snapshot toast opens the panel without revealing a folder
  - verifies the canonical verification report file is used when requested
  - verifies missing report-file open failures show a clear error
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
  - verifies missing snapshot directories produce a clear failure message
- `app/renderer/__tests__/AppRestore.test.tsx`
  - verifies restore-folder open failures are surfaced clearly
- `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`
  - scopes the snapshot toast action selector to the toast button

## Validation Results
Validated successfully:
- `pnpm --filter app test -- AppSnapshotsVerification.test.tsx AppRecovery.test.tsx AppRestore.test.tsx`
- `pnpm --filter app test`
- `pnpm --filter app lint`
- `pnpm --filter app run build:production`
- `pnpm --dir app exec playwright test tests/e2e/gui.snapshot_verification_flow.spec.ts -c ./playwright.config.ts`
- `git diff --check`

Observed warnings only:
- existing React hook dependency warnings in `App.tsx` and `SnapshotsPanel.tsx`
- existing ESLintRC deprecation warning
- existing `NO_COLOR` / `FORCE_COLOR` warning in Playwright

## Remaining Risks
- The snapshot/report surface is now truthful, but the broader GUI still has overlapping snapshot-related controls that are intentionally not consolidated in this pass.
- The canonical GUI decision remains separate from path integrity.
- The hidden/experimental shell is still behind `ui.experimental_split_command_workspace`.

## Broader Human Verification
Limited human verification may resume for snapshot/report path behavior now that the failure mode is explicit and the canonical report file can be opened when present.

The broader verification pass should still treat toolbar duplication and canonical GUI authority as separate follow-up work.
