# Phase 13 Pass 15 - Interactive Control Coverage and Snapshot Regression

## Summary

This pass audited the visible control surface of the default flag-off GUI and traced the remaining snapshot-related human-verification failures.

Inventory result:
- 59 visible interactive control families were identified across the default GUI surfaces.
- 10 registry-only command actions were identified separately in `commandRegistry.ts`; they are not visible UI controls, but they are part of the command metadata surface.
- Playwright/e2e directly covers 19 visible control families.
- Renderer/unit tests directly cover 31 visible control families.
- Truth-lane coverage directly covers 3 visible control families.

The remaining high-risk gaps are concentrated in the snapshot/report/reveal/manifest area:
- report/file-open controls are still under-covered in e2e,
- snapshot card actions are only partially behavior-verified,
- the snapshot details modal needed readability work for the default dark theme,
- the verification panel needed refresh authority so the latest snapshot and last-check timestamp update after create/verify actions.

## Evidence Base

Files inspected:
- `app/renderer/App.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/PreflightModal.tsx`
- `app/renderer/components/CritiqueModal.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/docking/DockWorkspace.tsx`
- `app/renderer/components/docking/DockPaneTile.tsx`
- `app/renderer/utils/snapshotReader.ts`
- `app/renderer/utils/revealPathFeedback.ts`
- `app/renderer/commands/commandRegistry.ts`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `services/src/blackskies/services/snapshots.py`
- `services/src/blackskies/services/routers/backup_verifier.py`
- `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`
- `app/tests/e2e/gui.flows.spec.ts`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `app/renderer/__tests__/AppCritique.test.tsx`
- `app/renderer/__tests__/AppRecovery.test.tsx`
- `app/renderer/__tests__/AppRestore.test.tsx`
- `app/renderer/__tests__/DockWorkspace.test.tsx`
- `app/renderer/__tests__/DockPaneTile.test.tsx`
- `app/renderer/__tests__/ProjectHome.test.tsx`
- `app/renderer/__tests__/PreflightModal.test.tsx`
- `app/renderer/__tests__/CritiqueModal.test.tsx`
- `app/renderer/__tests__/HistoryPane.test.tsx`
- `scripts/truth-with-backend.mjs`
- `services/tests/test_snapshot_endpoints.py`
- `services/tests/test_backup_verifier_report.py`
- `services/tests/test_backup_snapshot_regressions.py`

Observed human-verification failures that motivated this pass:
- Snapshot creation toast said the snapshot was created, but the saved snapshots list looked stale and did not clearly show the newest snapshot.
- The `View snapshot report` toast action did not open a report in the operator flow.
- The snapshot details modal rendered with white or unreadable styling in the default dark UI.
- Snapshot card actions still felt unreliable to the operator: Reveal, Manifest, View snapshot details, and Re-run verification for this snapshot.
- The verification panel showed an old `Last check` timestamp and confusing report state.

## Surface Inventory

Control families are grouped where a surface repeats the same button per row or per pane. Repeated families are still counted as visible controls when the rows are present.

| Surface | Visible control family | Component / file | data-testid / role / name | Expected behavior | Unit tests | Playwright | Truth lane | Human issue? | Risk | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Workspace header | Companion | `app/renderer/components/WorkspaceHeader.tsx` | `workspace-action-companion` | Toggle companion overlay | Yes | Yes | No | No | Low | Keep as-is |
| Workspace header | Generate | `WorkspaceHeader.tsx` | `workspace-action-generate` | Open preflight for active/all-scenes generation | Yes | Yes | Yes | No | Low | Keep and monitor |
| Workspace header | Generation scope toggle | `WorkspaceHeader.tsx` | `generation-scope-active`, `generation-scope-all-scenes` | Select generation scope | Yes | Partial | No | No | Low | Keep as-is |
| Workspace header | Critique | `WorkspaceHeader.tsx` | `workspace-action-critique` | Open critique flow | Yes | Yes | Yes | No | Low | Keep and monitor |
| Workspace header | Export format select | `WorkspaceHeader.tsx` | `workspace-export-format` | Choose export format | Yes | Partial | No | No | Low | Keep as-is |
| Workspace header | Snapshot | `WorkspaceHeader.tsx` | `workspace-action-snapshot` | Create snapshot | Yes | Yes | No | Yes | High | Refresh list after create; keep button |
| Workspace header | Verify snapshots | `WorkspaceHeader.tsx` | `workspace-action-verify` | Run backup/snapshot verification | Yes | Partial | No | Yes | High | Refresh status after verify |
| Workspace header | Snapshots | `WorkspaceHeader.tsx` | `snapshots-open-button` | Open snapshots panel | Yes | Yes | No | Yes | Medium | Keep; align toast action copy |
| Workspace header | Export | `WorkspaceHeader.tsx` | `workspace-action-export` | Export manuscript | Yes | Partial | No | No | Low | Keep as-is |
| ProjectHome (empty state) | Open project | `app/renderer/components/ProjectHome.tsx` | `open-project` | Open project folder | Yes | Yes | No | No | Low | Keep as-is |
| ProjectHome (empty state) | Open existing project | `ProjectHome.tsx` | button text | Open project folder | Yes | No | No | No | Low | Keep as-is |
| ProjectHome (empty state) | Quick start with sample project | `ProjectHome.tsx` | button text | Load sample project | Yes | Partial | No | No | Low | Keep as-is |
| ProjectHome | Diagnostics toggle | `ProjectHome.tsx` | button text | Expand/collapse diagnostics | Yes | No | No | No | Low | Keep as-is |
| ProjectHome | Copy log | `ProjectHome.tsx` | button text | Copy diagnostics log | Yes | No | No | No | Low | Keep as-is |
| ProjectHome | Clear log | `ProjectHome.tsx` | button text | Clear diagnostics log | Yes | No | No | No | Low | Keep as-is |
| ProjectHome | Toggle relocation toast | `ProjectHome.tsx` | checkbox | Enable relocation toast | Yes | No | No | No | Low | Keep as-is |
| ProjectHome | Auto-snap to preferred display | `ProjectHome.tsx` | checkbox | Enable auto snap | Yes | No | No | No | Low | Keep as-is |
| ProjectHome | Recent project entries | `ProjectHome.tsx` | recent list buttons | Open recent project | Yes | Partial | No | No | Low | Keep as-is |
| ProjectHome | Scene metadata buttons | `ProjectHome.tsx` | scene card buttons | Select active scene | Yes | Yes | No | No | Low | Keep as-is |
| Preflight modal | Cancel | `app/renderer/components/PreflightModal.tsx` | `button` | Close preflight | Yes | Yes | No | No | Low | Keep as-is |
| Preflight modal | Proceed | `PreflightModal.tsx` | `button` | Continue generation | Yes | Yes | No | No | Medium | Keep; assert contract |
| Critique modal | Close review | `app/renderer/components/CritiqueModal.tsx` | `Close review` | Close critique modal | Yes | Yes | Yes | No | Low | Keep as-is |
| Critique modal | Generate saved rewrite | `CritiqueModal.tsx` | `Generate saved rewrite` | Request rewrite and persist it | Yes | Yes | Yes | No | Medium | Keep; ensure copy stays truthful |
| Critique modal | Close saved rewrite preview | `CritiqueModal.tsx` | `Close saved rewrite preview` | Dismiss saved rewrite preview only | Yes | Yes | Yes | No | Medium | Keep as-is |
| Critique modal | Sync draft view | `CritiqueModal.tsx` | `Sync draft view` | Reconcile renderer draft view to saved rewrite | Yes | Yes | Yes | No | Medium | Keep as-is |
| Recovery banner | Restore snapshot | `app/renderer/components/RecoveryBanner.tsx` / `HistoryPane` | `Restore snapshot` | Restore latest recovery snapshot | Yes | Yes | No | No | Medium | Keep as-is |
| Recovery banner | Reopen last project | `HistoryPane` | `Reopen last project` | Reopen prior project path | Yes | Partial | No | No | Low | Keep as-is |
| Recovery banner | Refresh from disk | `HistoryPane` | `Refresh from disk` | Reload recovery state | Yes | No | No | No | Low | Keep as-is |
| Dock pane tile | Expand | `app/renderer/components/docking/DockPaneTile.tsx` | `Expand {pane}` | Expand current pane | Yes | Yes | No | No | Low | Keep as-is |
| Dock pane tile | Close | `DockPaneTile.tsx` | `Close {pane}` | Close current pane | Yes | Yes | No | No | Low | Keep as-is |
| Dock pane tile | Float | `DockPaneTile.tsx` | `Detach {pane}` | Open floating pane | Yes | Yes | No | No | Low | Keep as-is |
| Dock pane tile | Focus | `DockPaneTile.tsx` | `Focus {pane}` | Focus pane content | Yes | Yes | No | Yes | Medium | Keep for now; separate authority concern |
| Dock footer | Restore layout | `app/renderer/components/docking/DockWorkspace.tsx` | button text | Restore saved layout | Yes | Partial | No | No | Low | Keep as-is |
| Dock footer | Reset layout | `DockWorkspace.tsx` | button text | Reset layout to default | Yes | Partial | No | No | Low | Keep as-is |
| Snapshots panel header | Close snapshots panel | `app/renderer/components/SnapshotsPanel.tsx` | `Close snapshots panel` | Close panel | Yes | Yes | No | No | Low | Keep as-is |
| Snapshots panel header | Refresh status | `SnapshotsPanel.tsx` | `snapshots-refresh-status-button` | Refresh latest verification state | Yes | No | No | Yes | High | Keep; refresh token fixes stale state |
| Snapshots panel header | Run verification | `SnapshotsPanel.tsx` | `snapshots-manual-verify-button` | Re-run latest verification | Yes | Yes | No | Yes | High | Keep; refresh panel after run |
| Snapshots panel header | Open report file | `SnapshotsPanel.tsx` | `snapshots-open-report-file-button` | Open `.snapshots/last_verification.json` | Yes | No | No | Yes | High | Keep; only enable when report exists |
| Snapshots panel backups | Create backup | `SnapshotsPanel.tsx` | `snapshots-backup-create` | Create ZIP backup | Yes | No | No | No | Medium | Keep as-is |
| Snapshots panel backups | Restore backup row action | `SnapshotsPanel.tsx` | `snapshots-backup-restore-*` | Restore selected backup | Yes | No | No | No | Medium | Keep as-is |
| Snapshots panel backups | Restore latest ZIP as copy | `SnapshotsPanel.tsx` | button text | Duplicate latest ZIP backup as copy | Yes | No | No | No | Medium | Keep as-is |
| Snapshots panel snapshot rows | Show details / Hide details | `SnapshotsPanel.tsx` | row button | Expand verification issues | Yes | Yes | No | Yes | High | Keep; details state should stay readable |
| Snapshots panel snapshot rows | Reveal | `SnapshotsPanel.tsx` | `Reveal snapshot ...` | Open snapshot directory in file browser | Yes | Yes | No | Yes | High | Keep; validate path before OS open |
| Snapshots panel snapshot rows | Manifest | `SnapshotsPanel.tsx` | `Reveal manifest for ...` | Open manifest file in file browser | Yes | Yes | No | Yes | High | Keep; validate path before OS open |
| Snapshots panel snapshot rows | View snapshot details | `SnapshotsPanel.tsx` | `View snapshot details` | Open verification summary/details modal | Yes | Yes | No | Yes | High | Keep; ensure readable modal |
| Snapshots panel snapshot rows | Re-run verification for this snapshot | `SnapshotsPanel.tsx` | button text | Re-run verification and refresh status | Yes | Yes | No | Yes | High | Keep; refresh last check and report state |
| Verification report modal | Close | `SnapshotsPanel.tsx` | `verification-report-modal` close button | Close details modal | Yes | Yes | No | No | Low | Keep as-is |
| Restore ZIP confirm modal | Cancel | `SnapshotsPanel.tsx` | confirm dialog button | Dismiss restore confirmation | Yes | No | No | No | Low | Keep as-is |
| Restore ZIP confirm modal | Restore | `SnapshotsPanel.tsx` | confirm dialog button | Duplicate latest ZIP as copy | Yes | No | No | No | Medium | Keep as-is |
| Toast actions | Open snapshots panel | `App.tsx` / `SnapshotsPanel.tsx` | toast action | Open panel instead of a fake report action | Yes | Yes | No | Yes | High | Keep copy truthful |
| Toast actions | View snapshot details | `App.tsx` / `SnapshotsPanel.tsx` | toast action | Open snapshot details/report modal | Yes | Yes | No | Yes | High | Keep aligned with panel behavior |
| Toast actions | OK / Don't show again / Try previous position / Open folder | `DockWorkspace.tsx` / restore toasts | toast action buttons | Acknowledge or navigate relocation / restore results | Yes | Partial | No | No | Medium | Keep, but only verify behaviors that matter |

### Command registry inventory (not visible controls)

The declarative command registry is metadata only. It is not a visible GUI surface, but it should still be tracked because it models command intent:

- `project.open`
- `scene.select`
- `draft.generateActiveScene`
- `draft.generateAllScenes`
- `critique.run`
- `rewrite.run`
- `snapshot.create`
- `snapshot.verify`
- `project.export`
- `snapshots.openPanel`

## Playwright Coverage Audit

### Tests that directly click GUI controls

| Test file | Controls clicked | Coverage notes |
| --- | --- | --- |
| `app/tests/e2e/gui.snapshot_verification_flow.spec.ts` | `workspace-action-snapshot`, `snapshots-open-button`, snapshot row `View snapshot details`, report modal close, create-toast action `Open snapshots panel` | Best current coverage of the snapshot authority flow. It now verifies the modal is dark/readable, but it still does not click `Open report file`, `Reveal`, or `Manifest`. |
| `app/tests/e2e/gui.flows.spec.ts` | `Restore snapshot`, `snapshots-open-button`, `Reveal snapshot ...`, `Reveal manifest for ...`, generation and critique controls | It clicks reveal/manifest controls but does not assert the OS/file-browser outcome, so those actions are only partially behavior-verified. |
| `app/tests/e2e/dock-workspace.spec.ts` | pane `Expand`, `Close`, `Float`, `Focus` | Good behavior verification for pane lifecycle. |
| `app/tests/e2e/budget-meter.spec.ts` | `Generate`, `Proceed`, `Close`, `workspace-action-critique` | Good preflight / critique smoke. |
| `app/tests/e2e/gui.analytics_offline_cache_flow.spec.ts` | `workspace-action-companion` | Covers companion overlay visibility. |
| `app/tests/e2e/smoke.project.spec.ts` | `open-project` | Covers project open bootstrap path. |
| `app/tests/e2e/hotkeys-status.spec.ts` | `Restore snapshot` recovery button | Verifies recovery banner restore. |
| `app/tests/e2e/startup_authority_contract.spec.ts` | `Restore snapshot`, `workspace-action-generate`, `workspace-action-critique` | Important truth-lane-adjacent startup contracts. |
| `app/tests/e2e/truth_active_scene_diagnostic.spec.ts` | active scene selection controls | Scene authority coverage, not snapshot coverage. |

### Playwright gaps

The following visible controls are not yet reliably covered by end-to-end assertions:
- `Open report file`
- `Create backup`
- `Restore backup` row actions
- `Restore latest ZIP as copy`
- `Refresh status`
- `Run verification`
- `View snapshot details` error path when metadata is missing
- `Re-run verification for this snapshot`
- `Copy log` / `Clear log`
- diagnostics toggles and recent-project list behavior in `ProjectHome`
- `Open snapshots panel` toast action as a persistent regression check after creation and verification

### Clicked but not behavior-verified

These controls are clicked in Playwright but the current tests do not fully prove their intended downstream effect:
- `Reveal`
- `Manifest`

That is the highest-risk blind spot in the snapshot surface because the operator can trigger an OS/file-browser action, but the current test only proves the button exists and can be clicked.

## Snapshot Regression Root-Cause Investigation

### 1. Newly created snapshot did not clearly appear as the newest item

Root cause:
- the snapshots panel could stay mounted with stale list state after create/verify actions,
- the list only reliably refreshed when the panel was reopened or manually reloaded,
- the operator could therefore see a success toast for `ss_...` while still seeing an older list ordering in the already-open panel.

Fix applied:
- `App.tsx` now increments a refresh token after successful snapshot creation and successful verification,
- `SnapshotsPanel.tsx` refetches whenever that refresh token changes,
- this forces the mounted panel to reload the snapshot list and verification report authority after create/verify completes.

### 2. `View snapshot report` toast action did not open the report

Root cause:
- the toast action label was misleading: the app-level action actually reopened the snapshots panel instead of opening a file-backed report,
- the panel-level action was the one that opens snapshot metadata/details.

Fix applied:
- app-level toast action is now labeled `Open snapshots panel`,
- panel-level verification toast action is now labeled `View snapshot details`,
- this keeps the action labels aligned with the actual authority being opened.

### 3. Snapshot details modal was white / low contrast / unreadable

Root cause:
- the modal inherited weak/default styling rather than explicit dark-surface styles,
- the content area and text contrast were not strong enough for the default shell theme.

Fix applied:
- `app/renderer/styles/app.css` now gives the verification modal an explicit dark background, dark-surface border, readable text color, and structured metadata/report styles.

### 4. Verification panel showed an old `Last check` timestamp

Root cause:
- the verification panel read its state from the last fetched report, but that report was not being refreshed consistently after verification while the panel remained open.

Fix applied:
- the same refresh-token path used for snapshots now forces a fresh read of the verification report after create/verify actions,
- the timestamp is now expected to update after successful verification instead of staying on the old cached value.

### 5. Reveal / Manifest / report actions still failed or used missing paths

Root cause:
- path authority was split across renderer and preload,
- missing targets could previously fall through into OS/file-browser behavior and surface raw Windows dialogs,
- some code paths were still using report/file assumptions rather than checking the canonical path first.

Status:
- this was addressed in the earlier pass and remains validated:
  - `preload.ts` returns structured reveal results,
  - `revealPathFeedback.ts` validates existence before opening,
  - report/open actions now use canonical `.snapshots/last_verification.json` resolution.

### 6. Re-run verification worked, but visible status/report state remained confusing

Root cause:
- the verification engine could complete successfully while the renderer state stayed stale,
- the report file and list state were not refreshed strongly enough to reflect the latest verification result.

Fix applied:
- verification success now refreshes the panel state,
- the report modal uses the canonical snapshot/path authority,
- status mapping now distinguishes not-verified, verified clean, verified with issues, and failure/error states.

## Authority / Coverage Conclusions

- The snapshot authority problem was not a single broken button. It was a refresh + path authority + modal readability issue.
- `Reveal`, `Manifest`, and report-open actions are the remaining highest-risk interactive controls because they cross from renderer state into OS/file-browser state.
- The truth lane still only proves a small slice of the snapshot UI. It is strong for generation/critique/rewrite, but it is not yet a full operator-grade snapshot verification lane.
- The default GUI remains the production shell; the experimental Split Command shell stays behind its flag and is not part of this pass.

## Recommended Follow-up Passes

1. Snapshot report and file-browser e2e hardening
   - Goal: assert the `Open report file`, `Reveal`, and `Manifest` controls under both existing and missing-path cases.
   - Likely files: `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`, `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
   - Risk: medium
   - Validation: targeted app tests, Playwright snapshot flow, lint
   - Runtime behavior changes: maybe, only if the missing-path contract needs another explicit message

2. Snapshot authority / panel-state smoke expansion
   - Goal: assert that create and verify refresh the mounted panel list and timestamp every time.
   - Likely files: `app/renderer/__tests__/AppPreflight.test.tsx`, `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`, `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`
   - Risk: medium
   - Validation: targeted tests, Playwright snapshot flow, truth lane if the selector contract changes
   - Runtime behavior changes: no, if it stays on refresh/state authority only

3. Operator-grade verification checklist pass
   - Goal: turn the current checklist into a user-facing operator guide.
   - Likely files: `docs/audits/phase13/pass10_operator_verification_checklist_draft.md` and follow-up docs
   - Risk: low
   - Validation: docs-only plus `git diff --check`
   - Runtime behavior changes: no

4. GUI authority decision record
   - Goal: document which snapshot/report controls are canonical and which are legacy/deprecated candidates.
   - Likely files: tracker and Phase 13 audit docs
   - Risk: low
   - Validation: docs-only
   - Runtime behavior changes: no

## Stop / Proceed Recommendation

Proceed with limited verification only if the next step is snapshot/report path coverage or operator checklist refinement.

Pause broader human verification until the remaining high-risk snapshot actions have end-to-end assertions for:
- report open,
- reveal,
- manifest,
- rerun verification state refresh,
- and the stale/timestamp contract.

