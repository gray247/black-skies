# Phase 13 Pass 24 - Final Operator Verification Script

## 1. Environment Startup
1. Start the app and the backend exactly as your local setup requires.
2. Open the app to the normal workspace.
3. Load `Esther_Estate`.
4. Open the Snapshots panel.

Expected:
- the panel opens
- the service health state is visible
- the snapshots list is populated

Screenshot checkpoint:
- workspace with the Snapshots panel open

## 2. Snapshot Create
1. Click `Snapshot`.
2. Wait for the snapshot toast.
3. Click `Open snapshots panel` from the toast if needed.

Expected:
- a new snapshot appears without reopening the app
- the list shows the newest item first

Screenshot checkpoint:
- toast visible
- list updated with the new snapshot

## 3. Snapshot List Freshness
1. Confirm the newest snapshot is first in the list.
2. Confirm the panel still shows the current status text.

Expected:
- mounted panel reflects the newly created snapshot
- ordering is obviously newest-first

Screenshot checkpoint:
- current snapshot row at the top

## 4. Verify Snapshots
1. Click `Run verification` if enabled.
2. Or click `Re-run verification for this snapshot` on the current row.

Expected:
- verification completes
- the panel remains readable
- the row status reflects the new verification state

Screenshot checkpoint:
- snapshot row showing the current verification result

## 5. Refresh Status
1. Click `Refresh status`.

Expected:
- the panel rereads current verification state
- the status text updates without closing the app

Screenshot checkpoint:
- updated `Last check` / status text

## 6. Re-Run Verification
1. Click `Re-run verification for this snapshot` on the newest row.

Expected:
- the backend verification runs again
- the panel refreshes after the rerun

Screenshot checkpoint:
- current row after rerun

## 7. Open Report File
1. Click `Open report file`.

Expected:
- the canonical report file opens or a controlled file-browser message appears if the file is missing

Screenshot checkpoint:
- report-file action path evidence in the UI/toast

Terminal/log evidence:
- service log / renderer log for the report-open attempt

## 8. Reveal
1. Click `Reveal` on the current snapshot row.

Expected:
- the snapshot folder is revealed through the OS file browser

Screenshot checkpoint:
- row action used on the current snapshot

## 9. Manifest
1. Click `Manifest` on the current snapshot row.

Expected:
- the manifest file path is revealed through the OS file browser

Screenshot checkpoint:
- row action used on the current snapshot

## 10. Offline Behavior
1. Disable the backend / writing tools.
2. Reopen the Snapshots panel.

Expected:
- local browsing still works
- backend-required actions are disabled or fail clearly

Screenshot checkpoint:
- offline state with local snapshot browsing still visible

## 11. Backup / Restore Controls
1. Check `Create backup`.
2. Check `Restore backup` entries.
3. Check `Restore latest ZIP as copy`.

Expected:
- these controls are backend-required
- they are disabled or clearly unavailable while offline

Screenshot checkpoint:
- disabled backup/restore controls

## 12. Critique / Rewrite Spot Checks
1. Open critique.
2. Generate a rewrite.

Expected:
- critique and rewrite continue to behave as the current editorial workflow expects
- these controls do not interfere with snapshot authority

Screenshot checkpoint:
- critique modal and rewrite result

## 13. Recovery / Restore-as-Copy Spot Checks
1. Open the recovery flow.
2. Check restore-as-copy behavior.

Expected:
- recovery state is clear
- restore-as-copy is backend-required

Screenshot checkpoint:
- recovery banner / restore controls

## 14. Final Pass/Fail Summary Template
- Snapshot create:
- Newest ordering:
- Refresh status:
- Re-run verification:
- Open report file:
- Reveal:
- Manifest:
- Offline local browsing:
- Offline backend actions:
- Backup / restore:
- Critique / rewrite:
- Recovery / restore-as-copy:

