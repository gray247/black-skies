# Pass 151 - Restore-as-Copy Targeted Repro Evidence Plan

Date: 2026-06-03

## 1. Files inspected
- `docs/audits/phase15/pass150_restore_as_copy_human_retest_failure_intake.md`
- `docs/audits/phase15/pass147_restore_as_copy_eligibility_contract_implementation.md`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/hooks/useServiceHealth.ts`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- Relevant Pass 147 restore/backup tests

## 2. Existing restore / health logging surfaces
- `app/main/preload.ts` logs route timing, timeout budgets, response codes, and timeout errors for each service request.
- `app/main/preload.ts` gives `backups/restore` a dedicated `BACKUP_RESTORE_REQUEST_TIMEOUT_MS` budget, defaulting to `300_000ms`.
- `app/renderer/hooks/useServiceHealth.ts` logs `[useServiceHealth] Health probe failed` whenever the health check times out or returns an error.
- `app/renderer/components/SnapshotsPanel.tsx` shows restore modal copy, success/failure toasts, and the `backendUnavailable` gating state.
- `services/src/blackskies/services/backup_service.py` and `services/src/blackskies/services/restore_service.py` return `eligibility_decision`, `operation`, and `restored_path` / error payloads that can be checked in the browser console or backend logs.

## 3. Exact manual repro steps
1. Start the backend and the Electron app normally.
2. Open Black Skies and open the backups/snapshots panel.
3. Confirm the panel shows the target backup `BS_20260516_182839.zip`.
4. Open DevTools so you can watch the console and network timing while the restore runs.
5. Before starting restore, run the preflight console commands listed below.
6. Click `Restore backup as copy`.
7. Let the restore run until it either succeeds, shows a restore-specific failure, or the UI flips to offline / temporarily unreachable.
8. Immediately after the UI change, capture the post-stop console commands below.
9. Check the health endpoint and the filesystem before, during, and after the restore window.
10. Record the final backend logs and the existence or non-existence of the restored sibling project folder.

## 4. Exact backend command with log capture
- Start the FastAPI service in a dedicated terminal and capture stdout/stderr to a timestamped file.
- Suggested PowerShell command:

```powershell
$log = Join-Path $PWD "logs\pass151_restore_repro_backend.log"
uvicorn blackskies.services.app:create_app --factory --reload 2>&1 | Tee-Object -FilePath $log
```

- If the app is usually launched through the repo's Electron/dev entrypoint, keep that launch separate from the backend capture so the service logs remain readable.

## 5. Exact renderer console commands before restore
- In the renderer DevTools console, run:

```javascript
await window.services.checkHealth()
```

```javascript
await window.services.listBackups?.({ projectId: '<current-project-id>' })
```

```javascript
await window.services.getRecoveryStatus?.({ projectId: '<current-project-id>' })
```

- Capture the returned payloads or screenshots before clicking restore.

## 6. Exact renderer console commands after restore stops / fails / succeeds
- Run these immediately after the restore attempt resolves or the UI flips offline:

```javascript
await window.services.checkHealth()
```

```javascript
await window.services.listBackups?.({ projectId: '<current-project-id>' })
```

```javascript
await window.services.restoreBackup?.({
  projectId: '<current-project-id>',
  backupName: 'BS_20260516_182839.zip',
  restoreAsNew: true,
})
```

- If the UI already triggered the restore, do not duplicate the destructive action unless the backend clearly never started it. Use the post-stop call only as a readback when safe.

## 7. Exact health endpoint checks before / during / after restore
- Before restore:

```powershell
Invoke-RestMethod "http://127.0.0.1:<port>/api/v1/healthz"
```

- During restore, run the same command once or twice while the copy is still in progress.
- After the UI reports failure or offline state, run the same command again.
- Capture whether the health endpoint returns `200`, `offline`, a timeout, or another payload each time.

## 8. Exact filesystem checks for restored sibling project folder
- Before restore, list the parent directory that should receive the sibling copy:

```powershell
Get-ChildItem "<project-base-dir>" -Directory | Sort-Object Name
```

- During restore, refresh that listing at least once.
- After restore stops or succeeds, check for a sibling folder matching:
  - `<project-id>_restored_*`
  - or the slug-based sibling naming used by the restore path
- Verify whether `project.json` and `outline.json` exist in any newly materialized sibling folder.

## 9. Evidence package the user must send back
- A screenshot of the restore modal before confirmation.
- A screenshot or capture of the restore error/offline state.
- Console output showing:
  - the restore invocation timing,
  - any `useServiceHealth` timeout message,
  - any restore-specific response payload or error details,
  - any `eligibility_decision` or `operation` object returned by the backend.
- Backend log lines covering the restore request window.
- Health endpoint responses before, during, and after the restore window.
- A filesystem listing showing whether a restored sibling folder exists.

## 10. Classification matrix

| Outcome | What it means | Next classification |
| --- | --- | --- |
| restore backend succeeds but health probe times out | Restore likely completed, but the UI was driven offline by health-check failure | Health probe false cascade; restore implementation stays viable |
| restore backend fails with exception | Restore path itself failed inside the backend | Needs restore failure correction if the exception is reproducible |
| restore backend still running after UI failure | Restore is slow or long-running; UI lost confidence before completion | Restore timeout / health-cascade investigation |
| restore request times out despite `300000ms` budget | The restore-specific timeout is too short or the call is using the wrong budget | Needs restore timeout correction |
| restore eligibility rejection is hidden / misreported | The backend blocked the restore but the UI misclassified the reason | Needs restore eligibility correction |
| true backend offline | The service genuinely stopped or became unreachable | Infrastructure or launch/port hygiene issue, not restore eligibility |
| renderer health cascade falsely implies restore failure | Health monitoring changed the UI state even though the restore was not the actual failure | Health cascade correction or copy correction, not restore eligibility |

## 11. Whether temporary instrumentation is needed
- No.
- The existing renderer console, preload timeout logs, backend route logs, health endpoint, and filesystem checks are enough to separate restore timing from health-probe timing.

## 12. Smallest future boundary if instrumentation becomes necessary
- Add only a narrow restore-request timing marker around `backups/restore` and `restore` request start/end.
- Do not expand instrumentation into broader workflow state, health-policy redesign, or new UI logging families unless this repro still cannot separate the failure modes.

## 13. Final verdict
- `READY FOR HUMAN TARGETED RESTORE REPRO`
