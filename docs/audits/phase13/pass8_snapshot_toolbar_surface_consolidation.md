# Phase 13 Pass 8 - Snapshot Toolbar / Verification Surface Consolidation

Status: Completed
Reviewed: 2026-05-09

## Summary

This pass reduced snapshot and verification surface confusion with minimal copy and accessibility changes only. No snapshot workflow was removed, no toolbar layout was redesigned, and no feature flag behavior changed.

The main decision is that the visible snapshot controls now read as separate actions:

- create a recovery artifact
- run verification
- manage snapshot records
- view snapshot metadata
- reveal a file-system target

## Evidence Inspected

- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/App.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/commands/commandRegistry.ts`
- `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md`
- `docs/audits/phase13/pass7_snapshot_report_path_integrity_fix.md`

## Surface Inventory Before Changes

| Label | File | Meaning before this pass | Risk |
| --- | --- | --- | --- |
| `Snapshot` | `WorkspaceHeader.tsx` | Create a project snapshot | Short label looked like a noun beside `Snapshots` |
| `Verify snapshots` | `WorkspaceHeader.tsx` | Run backup verification | Mostly clear |
| `Snapshots` | `WorkspaceHeader.tsx` | Open snapshot panel | Too close to `Snapshot` |
| `Open snapshots panel` | `App.tsx` toast | Open snapshot panel after creation | Clear after Pass 7 |
| `View snapshot report` | `App.tsx` verification toast | Open the snapshots panel | Still slightly overloaded |
| `Open report file` | `App.tsx` verification toast | Open `.snapshots/last_verification.json` | Clear after Pass 7 |
| `Run verification` | `SnapshotsPanel.tsx` | Run latest verification from panel | Did not say what was verified |
| `View full report` | `SnapshotsPanel.tsx` | Open snapshot metadata modal | Could be confused with the report file |
| `Re-run verification for this snapshot` | `SnapshotsPanel.tsx` | Runs latest-only backup verification | Overstated per-snapshot specificity |
| `Reveal` | `SnapshotsPanel.tsx` | Reveal snapshot directory | Generic file-browser verb |
| `Manifest` | `SnapshotsPanel.tsx` | Reveal manifest file | Noun did not say it opens/reveals |

## Canonical Meaning After Changes

| Control | Canonical meaning | Creates snapshot? | Verifies snapshot? | Opens panel? | Opens report file? | Reveals folder/file? |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `Create snapshot` | Create a recovery snapshot artifact | Yes | No | No | No | No |
| `Verify snapshots` | Run backup verification for snapshots | No | Yes | No | No | No |
| `Manage snapshots` | Open the snapshots management panel | No | No | Yes | No | No |
| `Open snapshots panel` | Toast shortcut to the same management panel | No | No | Yes | No | No |
| `View snapshot report` | Verification toast shortcut to the snapshots panel | No | No | Yes | No | No |
| `Open report file` | Open the canonical verification JSON report file | No | No | No | Yes | Yes |
| `Verify latest snapshots` | Panel-level verification trigger | No | Yes | No | No | No |
| `View snapshot details` | Open the snapshot metadata modal | No | No | Yes, modal only | No | No |
| `Re-run latest verification` | Re-run latest verification from row context | No | Yes | No | No | No |
| `Reveal folder` | Reveal the snapshot directory | No | No | No | No | Yes |
| `Reveal manifest` | Reveal the snapshot manifest file | No | No | No | No | Yes |

## Exact Label Changes

| File | Before | After |
| --- | --- | --- |
| `app/renderer/components/WorkspaceHeader.tsx` | `Snapshot` | `Create snapshot` |
| `app/renderer/components/WorkspaceHeader.tsx` | `aria-label="Create snapshot"` | `aria-label="Create snapshot for project"` |
| `app/renderer/components/WorkspaceHeader.tsx` | `Snapshots` | `Manage snapshots` |
| `app/renderer/components/WorkspaceHeader.tsx` | `aria-label="Open Snapshots panel"` | `aria-label="Open snapshot management panel"` |
| `app/renderer/components/SnapshotsPanel.tsx` | `Run verification` | `Verify latest snapshots` |
| `app/renderer/components/SnapshotsPanel.tsx` | `View full report` | `View snapshot details` |
| `app/renderer/components/SnapshotsPanel.tsx` | `Re-run verification for this snapshot` | `Re-run latest verification` |
| `app/renderer/components/SnapshotsPanel.tsx` | `Reveal` | `Reveal folder` |
| `app/renderer/components/SnapshotsPanel.tsx` | `Manifest` | `Reveal manifest` |
| `app/renderer/commands/commandRegistry.ts` | `Open Snapshots Panel` | `Manage Snapshots` |

## Code And Test Changes

- Updated toolbar and panel copy in `WorkspaceHeader.tsx`, `SnapshotsPanel.tsx`, and `commandRegistry.ts`.
- Updated `AppSnapshotsVerification.test.tsx` and `gui.snapshot_verification_flow.spec.ts` for the new canonical labels.
- Kept `View snapshot report` in the verification toast because it opens the snapshot report surface rather than the raw report file. The raw file action remains `Open report file`.

## Remaining UX Risks

- The toolbar still has adjacent snapshot-related controls.
- The panel still contains both global verification and row-context verification.
- `View snapshot report` and `View snapshot details` are clearer than before, but still close enough to require operator validation in Pass 14.
- No layout consolidation happened in this pass.
