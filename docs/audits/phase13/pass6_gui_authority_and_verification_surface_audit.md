# Phase 13 Pass 6 - GUI Authority And Verification Surface Audit

Status: Audit only
Reviewed: 2026-05-09

## 1. Summary

The snapshot and verification UI is not failing in one isolated place. It is confusing because several different surfaces use nearly the same words for different jobs.

The top toolbar exposes `Snapshot`, `Verify snapshots`, and `Snapshots`, which are easy to read as one workflow even though they point at different actions.

Inside the snapshot panel, the UI exposes `View full report`, `Re-run verification for this snapshot`, `Manifest`, and `Reveal`, which makes the report and file-browser paths feel like overlapping versions of the same thing.

The path/report plumbing is also split across multiple sources of truth:

- the snapshot create response path in `app/renderer/App.tsx`
- the snapshot list response path in `app/renderer/components/SnapshotsPanel.tsx`
- the snapshot metadata fallback search in `app/renderer/utils/snapshotReader.ts`
- the file-browser bridge in `app/main/preload.ts`

That split authority explains the human-verification failures:

- Windows cannot find snapshot path
- Verification report unavailable
- Snapshot directory could not be located
- duplicate or overlapping toolbar controls

The canonical GUI is also not obvious in the UI itself. The production default is still the flag-off shell, while the newer Split Command shell is behind `ui.experimental_split_command_workspace`. A separate `ui.enable_docking` route can also change what the renderer shows, so the visible shell can vary by config even when the product is not on the experimental path.

The human-verification checklist is technically correct, but it reads like a developer checklist rather than an operator walkthrough. It names internal surfaces instead of the user-facing result.

## 2. Evidence

### Files and components involved

- `app/renderer/App.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
- `app/renderer/components/workspace/StoryNavigationPanel.tsx`
- `app/renderer/utils/snapshotReader.ts`
- `app/main/preload.ts`
- `app/shared/config/runtime.ts`
- `app/renderer/commands/commandRegistry.ts`
- `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `docs/specs/editorial_workflow_contract.md`
- `docs/phases/phase12_runtime_audit.md`
- `docs/audits/phase13/pass5_human_verification_plan.md`
- `docs/specs/current_state.md`
- `docs/specs/workflow_spine.md`
- `docs/specs/error_visibility.md`

### Exact labels and surfaces found

- `Snapshot`
- `Verify snapshots`
- `Snapshots`
- `View snapshot report`
- `Open report file`
- `View full report`
- `Re-run verification for this snapshot`
- `Reveal`
- `Manifest`
- `Restore latest ZIP as copy`
- `Verification report unavailable`
- `Snapshot directory could not be located.`
- `Current project restored from latest snapshot.`
- `Generate saved rewrite`
- `Saved rewrite`
- `Sync draft view`
- `Close saved rewrite preview`
- `Story Navigation`
- `Command Center`
- `Writing Studio`

### Observed failures from human verification

- Windows cannot find snapshot path.
- Verification report unavailable.
- Snapshot directory could not be located.
- Duplicate or overlapping toolbar controls.

### Relevant code evidence

- `app/renderer/App.tsx` creates the snapshot toast action labeled `View snapshot report`, opens the Snapshots panel, and then calls `services.revealPath(snapshotPath)` if a path exists.
- `app/renderer/App.tsx` also creates the verification toast action labeled `View snapshot report`, plus an optional `Open report file` action pointing at `projectSummary.path/.snapshots/last_verification.json`.
- `app/renderer/components/SnapshotsPanel.tsx` exposes a verification status section, a panel-level `Run verification` button, per-snapshot `View full report`, `Re-run verification for this snapshot`, `Reveal`, and `Manifest` controls, plus a report modal.
- `app/renderer/utils/snapshotReader.ts` tries to resolve a snapshot directory from the provided path, then from `.snapshots`, then from `history/snapshots`, and throws `Snapshot directory could not be located.` if none resolve.
- `app/main/preload.ts` implements `revealPath` as `shell.openPath(path)` and does not inspect the returned error string, so path failures can be silent.
- `app/shared/config/runtime.ts` defaults `ui.experimental_split_command_workspace` to `false`.
- `app/renderer/App.tsx` renders `SplitCommandWorkspace` only when `runtimeUi?.experimentalSplitCommandWorkspace === true`.

## 3. Surface Inventory

| Label | Component / file | Purpose | Creates snapshot? | Verifies snapshot? | Opens report? | Opens snapshot folder? | Canonical / legacy / unknown | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Snapshot` | `app/renderer/components/WorkspaceHeader.tsx` / `app/renderer/App.tsx` | Create a snapshot from the workspace header | Yes | No | No | Indirect only via toast follow-up | Canonical global entry | Medium |
| `Verify snapshots` | `app/renderer/components/WorkspaceHeader.tsx` / `app/renderer/App.tsx` | Run backup verification from the workspace header | No | Yes | Not directly; shows report-related toast actions | No | Canonical global entry | Medium |
| `Snapshots` | `app/renderer/components/WorkspaceHeader.tsx` / `app/renderer/App.tsx` | Open the snapshot management panel | No | No | No | No | Canonical management entry | Medium |
| `View snapshot report` | `app/renderer/App.tsx` snapshot-create toast action | Open the snapshots panel after snapshot creation and reveal the snapshot path | No | No | Panel only, not the modal report | Yes, via `revealPath(snapshotPath)` | Ambiguous / overloaded | High |
| `View snapshot report` | `app/renderer/App.tsx` verification toast action | Open the snapshots panel after verification | No | No | Panel only, not the modal report | Yes, via optional `Open report file` | Ambiguous / overloaded | High |
| `Open report file` | `app/renderer/App.tsx` verification toast action | Reveal `last_verification.json` in the file browser | No | No | Not the modal report | Yes | Utility / unknown | High |
| `Latest verification` / `Run verification` | `app/renderer/components/SnapshotsPanel.tsx` | Panel-level verification status and rerun control | No | Yes | No | No | Secondary in-panel entry | Medium |
| `View full report` | `app/renderer/components/SnapshotsPanel.tsx` | Open the per-snapshot metadata modal | No | No | Yes | No | Canonical report modal | Medium |
| `Re-run verification for this snapshot` | `app/renderer/components/SnapshotsPanel.tsx` | Re-run verification for the latest snapshot set | No | Yes | No | No | Secondary verification entry | Medium |
| `Reveal` | `app/renderer/components/SnapshotsPanel.tsx` | Reveal the snapshot directory in the file browser | No | No | No | Yes | Utility / unknown | High |
| `Manifest` | `app/renderer/components/SnapshotsPanel.tsx` | Reveal the snapshot manifest file in the file browser | No | No | No | Yes | Utility / unknown | High |
| `Restore latest ZIP as copy` | `app/renderer/components/SnapshotsPanel.tsx` | Duplicate-project recovery path | No | No | No | Yes, indirectly for restored folder | Canonical recovery copy | Medium |

## 4. Feature Flag Inventory

### Operator-facing runtime flags

| Flag or env var | Default | Affected component / path | Exposes | Enablement path |
| --- | --- | --- | --- | --- |
| `ui.experimental_split_command_workspace` | `false` | `app/shared/config/runtime.ts`, `app/renderer/App.tsx`, `app/renderer/components/workspace/SplitCommandWorkspace.tsx` | Experimental Split Command GUI | Runtime YAML (`ui.experimental_split_command_workspace: true`) or test override via `window.__runtimeConfigOverride` |
| `ui.enable_docking` | `false` | `app/shared/config/runtime.ts`, `app/renderer/App.tsx`, `app/renderer/components/docking/DockWorkspace.tsx` | Alternate docked shell route | Runtime YAML (`ui.enable_docking: true`) |
| `ui.hotkeys.enable_preset_hotkeys` | `true` | `app/shared/config/runtime.ts`, `app/renderer/App.tsx`, `app/renderer/components/docking/DockWorkspace.tsx` | Dock hotkeys only | Runtime YAML |
| `ui.hotkeys.focus_cycle_order` | default pane order | `app/shared/config/runtime.ts`, `app/renderer/App.tsx`, `app/renderer/components/docking/DockWorkspace.tsx` | Dock focus order only | Runtime YAML |

### Harness-only routing controls

These are not operator feature flags, but they can make the visible GUI path look different during tests or manual harness runs.

- `data-test-active-flow`
- `data-test-stable-dock`
- `data-test-stable-home`
- `data-test-visual-stable`
- `data-test-needs-recovery`
- `__testEnvSnapshotRestoreFlow`
- `__runtimeConfigOverride`

## 5. Failure-Mode Analysis

### Stale snapshot path

- `App.tsx` prefers `response.data?.path` from snapshot creation and falls back to `projectSummary.path/.snapshots` if the response does not include a path.
- `SnapshotsPanel.tsx` prefers the per-row `snapshot.path` from `listProjectSnapshots`.
- `snapshotReader.ts` then tries the provided path, `.snapshots`, and `history/snapshots`.
- If any of those paths are stale, relative to the wrong root, or missing on disk, the report open path can fail even when the UI label looks correct.

### Missing snapshot directory

- `snapshotReader.ts` throws `Snapshot directory could not be located.` when none of the candidate paths resolve.
- That error can happen if the project path is wrong, the create/list response path is stale, or the snapshot was created under a different authority than the one the reader expects.

### Report unavailable

- `openVerificationReportModal` in `SnapshotsPanel.tsx` emits `Verification report unavailable` when `projectPath` is missing or metadata loading fails.
- The message tells the user that the report is unavailable, but it does not tell them whether the problem is a missing project path, a stale snapshot directory, or a manifest problem.

### Reveal path failure

- `app/main/preload.ts` calls `shell.openPath(path)` and ignores the returned error string.
- On Windows, that means a missing or malformed path can fail without a user-visible error surface.
- `SnapshotsPanel.tsx` also builds reveal targets with string concatenation and `replace('//', '/')` instead of path-aware joining, which is brittle for platform-specific paths.

### Multiple verification entry points

- The toolbar has `Verify snapshots`.
- The panel has `Run verification`.
- Each snapshot row has `Re-run verification for this snapshot`.
- The snapshot-created toast says `View snapshot report`, but it opens the panel and reveals a path instead of opening the row-level report modal.
- The verification toast also says `View snapshot report`, but its secondary action can be `Open report file`.

That combination makes it hard to tell which action is canonical.

## 6. Canonical Authority Questions

| Question | Answer | Confidence | Notes |
| --- | --- | --- | --- |
| Which button creates a snapshot? | `Snapshot` in `WorkspaceHeader.tsx` is the main workspace entry. | High | There are other snapshot-like flows in older wizard/recovery paths, but this is the visible workspace control. |
| Which button verifies snapshots? | `Verify snapshots` in `WorkspaceHeader.tsx` is the global entry; `Run verification` in `SnapshotsPanel.tsx` is a secondary in-panel entry. | Medium | The UI currently has two obvious verification triggers. |
| Which button opens snapshot management? | `Snapshots` in `WorkspaceHeader.tsx`. | High | The toast action labeled `View snapshot report` also opens the panel, but it is not the same kind of entry. |
| Which button opens a verification report? | `View full report` in `SnapshotsPanel.tsx` opens the per-snapshot metadata modal. | High | The toast action labeled `View snapshot report` is a shortcut to the panel and path reveal, not the same report modal. |
| Which snapshot/report path is authoritative? | Split across create-response path, list-response path, and `snapshotReader.ts` fallback resolution. | Medium | There is no single visible authority in the current UI. |
| Which GUI is canonical right now? | The flag-off production shell is canonical; Split Command is experimental. | High | `ui.experimental_split_command_workspace` defaults to `false`. |
| Which GUI is hidden behind flags? | Split Command. | High | `ui.enable_docking` is also a config switch, but it is a layout route rather than the new Split Command shell. |
| Which surfaces should be legacy or deprecation candidates? | The overloaded `View snapshot report` toast action, the duplicate verification entry points, and the generic `Reveal` / `Manifest` labels. | Medium | These are the most likely candidates for consolidation after path authority is fixed. |

## 7. User-Facing Clarity Risks

- `Snapshot`, `Verify snapshots`, and `Snapshots` are too close together for adjacent toolbar controls.
- `View snapshot report` is used for more than one thing, so it sounds authoritative even when it only opens a panel or reveals a path.
- `View full report` and `View snapshot report` are close enough to be mistaken for the same action.
- `Reveal` and `Manifest` do not say what they reveal or why the user should care.
- `Verification report unavailable` does not say whether the report is missing, the project path is missing, or the snapshot path is stale.
- `Snapshot directory could not be located.` reads like an internal exception, not an operator instruction.
- The current manual checklist uses developer-insider nouns and does not always describe the visible user effect first.

## 8. Proposed Follow-Up Fix Passes

### Pass 7 - Snapshot / Report Path Integrity Fix

- Goal: make report opening and reveal paths use one explicit authority, and surface reveal failures instead of swallowing them.
- Files likely touched: `app/renderer/App.tsx`, `app/renderer/components/SnapshotsPanel.tsx`, `app/renderer/utils/snapshotReader.ts`, `app/main/preload.ts`.
- Risk level: medium to high.
- Validation required: targeted renderer tests for snapshot verification/report behavior, plus the narrow e2e snapshot flow that already exercises the report path.
- Runtime behavior changes: yes, but only in snapshot/report path handling and error visibility.

### Pass 8 - Snapshot Toolbar Label Consolidation Plan

- Goal: reduce the overlap between `Snapshot`, `Verify snapshots`, `Snapshots`, `View snapshot report`, `View full report`, `Reveal`, and `Manifest`.
- Files likely touched: `app/renderer/components/WorkspaceHeader.tsx`, `app/renderer/App.tsx`, `app/renderer/components/SnapshotsPanel.tsx`, and the related renderer tests.
- Risk level: medium.
- Validation required: renderer tests for labels and action routing, plus a focused GUI smoke run.
- Runtime behavior changes: maybe copy-only, but it may also reshape which action opens which surface.

### Pass 9 - Canonical GUI Decision Record

- Goal: document the canonical production shell, the experimental Split Command shell, and the operator-visible difference between config routes.
- Files likely touched: `docs/phases/phase13_audit_trust_validation_plan.md`, `docs/specs/current_state.md`, `docs/BLACK_SKIES_FIX_TRACKER.md`, and possibly `docs/phases/phase11b_implementation_plan.md`.
- Risk level: low.
- Validation required: `git diff --check` only unless runtime docs are cross-linked.
- Runtime behavior changes: no.

### Pass 10 - Operator-Grade Human Verification Checklist Rewrite

- Goal: rewrite the checklist so it describes the visible user effect first and the internal surface second.
- Files likely touched: `docs/audits/phase13/pass5_human_verification_plan.md` or a follow-up operator checklist doc.
- Risk level: low.
- Validation required: docs review and `git diff --check`.
- Runtime behavior changes: no.

## 9. Stop / Proceed Recommendation

Pause broader human verification until a fix pass addresses snapshot/report path authority and the overlapping verification surfaces.

Limited verification can continue only if the purpose is evidence collection for the audit, not proof that the flow is already clear.

The next safest scoped Codex pass is Pass 7: snapshot / report path integrity fix.
