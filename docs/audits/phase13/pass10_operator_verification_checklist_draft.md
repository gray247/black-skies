# Phase 13 Pass 10 - Operator Verification Checklist Draft

Status: Draft only
Reviewed: 2026-05-09

## Summary

This artifact rewrites the Phase 13 human verification plan as an operator-grade checklist for a later Pass 14. It was not executed in this pass.

Human verification remains deferred. This document defines what to run, what to click, what evidence to capture, and when to stop.

## Startup Commands

Use these commands from the repository root.

```powershell
pnpm install --recursive
```

If dependencies are already installed, skip the install and start the service and app:

```powershell
uvicorn blackskies.services.app:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
pnpm dev
```

Expected startup evidence:

- The backend terminal stays running without import errors.
- The Electron app opens.
- The renderer console does not show fatal startup errors.
- No feature flag is manually changed before baseline checks.

Stop if:

- The backend will not start.
- The app will not open.
- The app opens a different project than expected and the operator cannot return to the project picker.
- Any startup error says project data was modified or recovery was required unexpectedly.

## Project Load

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | Start the app with `pnpm dev` | The default production GUI appears | Startup path may be broken or default GUI may have drifted | Screenshot of first app screen and terminal output |
| 2 | Open a known sample or test project | Project title, scene list, and editor become visible | Project loading, service bridge, or renderer state may be broken | Screenshot of loaded project and console logs |
| 3 | Select a scene | Editor content updates for the selected scene | Shared scene-selection authority may be broken | Screenshot showing active scene and editor |

Stop if the selected scene cannot be identified in the visible UI.

## Snapshot Creation

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | Click `Create snapshot` in the top toolbar | A success toast appears with `Open snapshots panel` | Snapshot creation path failed or the toolbar action is mislabeled | Screenshot of toast and terminal logs |
| 2 | Click `Open snapshots panel` in the toast | The snapshot management panel opens | Toast action target is broken | Screenshot of open panel |
| 3 | Confirm the new snapshot row appears | Snapshot row includes an ID, timestamp, and actions | Snapshot creation may have succeeded without visible management state | Screenshot of row details |

Stop if the toast claims success but no snapshot appears in the panel.

## Snapshot Verification

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | Click `Verify snapshots` in the toolbar | A verification toast appears | Toolbar verification entry point failed | Screenshot of toast |
| 2 | Click `Manage snapshots` | The snapshot management panel opens | Panel routing failed | Screenshot of panel |
| 3 | Click `Verify latest snapshots` in the panel | Verification status updates or a clear failure appears | Panel verification path failed | Screenshot of result and console logs |
| 4 | If a snapshot row has an issue action, click `Re-run latest verification` | Latest verification reruns; it must not claim per-snapshot mutation | Row action wording or behavior may be misleading | Screenshot before and after click |

Stop if verification reports success but no report action or panel status is available.

## Report Open

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | After verification, click `Open report file` in the toast if present | The OS opens the verification report file, or the app shows a precise missing-file error | Report path authority may still be broken | Screenshot of OS result or toast |
| 2 | In the snapshot panel, click `View snapshot details` | Snapshot metadata modal opens | Detail/report surface is broken | Screenshot of modal |
| 3 | Confirm `View snapshot report` opens the snapshot report surface, not an unrelated file path | The snapshots panel or report surface opens | Toast action may be mislabeled or misrouted | Screenshot of destination |

Stop if a report action attempts to reveal a missing snapshot directory while claiming to open a report.

## Reveal Folder

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | In the snapshot panel, click `Reveal folder` for a snapshot | The OS file browser opens the snapshot directory | Snapshot directory path may be stale or missing | Screenshot of file browser or error toast |
| 2 | If the operation fails, read the toast | It must distinguish missing directory, OS open failure, and unknown failure | Pass 7 path-failure surfacing regressed | Screenshot of toast |

Stop if the failure is swallowed or shown as a success.

## Manifest Open

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | In the snapshot panel, click `Reveal manifest` | The OS reveals the manifest file | Manifest path may be stale or missing | Screenshot of file browser or error toast |
| 2 | If the manifest is missing, confirm the message says `Snapshot manifest missing` or equivalent | Missing-file failure is precise | Error copy is too vague for recovery | Screenshot of toast |

Stop if `Reveal manifest` opens the snapshot folder but does not identify the manifest target.

## Critique Advisory Behavior

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | Open the critique workflow | UI describes critique as advisory | Phase 12 editorial truth copy may have drifted | Screenshot of critique entry |
| 2 | Run critique on a scene | Draft text does not change automatically | Advisory/non-mutating contract may be broken | Before/after screenshots of draft text |
| 3 | Review critique result | Result does not imply rewrite, save, or provenance ledger creation | Misleading editorial copy returned | Screenshot of result |

Stop if critique changes draft text without explicit rewrite/sync action.

## Saved Rewrite Behavior

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | Click the rewrite action labeled for saved rewrite generation | UI states rewrite is saved after successful backend route | Phase 12 saved-rewrite contract may have drifted | Screenshot of button and result |
| 2 | Confirm local draft view is not silently replaced until sync/reconcile action | Renderer/local draft authority may be broken | Before/after draft screenshots |
| 3 | Close/discard preview if available | Copy must not imply saved rewrite rollback | Discard semantics are misleading | Screenshot of close/discard copy |

Stop if the UI implies a generated rewrite is merely an unsaved candidate after backend success.

## Recovery / Restore As Copy

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | Open recovery or restore surface if visible | Copy describes restore-as-copy behavior | Recovery authority wording may have drifted | Screenshot of recovery surface |
| 2 | Trigger only the documented restore-as-copy path in a disposable project | Restored project opens as a copy, not destructive overwrite | Restore contract may be unsafe | Screenshot of restored project location |
| 3 | Confirm original project remains accessible | Restore isolation failed if original changed unexpectedly | Screenshot of original and restored project identifiers |

Stop if any restore control implies destructive overwrite without explicit confirmation.

## Feature Flag / Current GUI Confirmation

| Step | Operator action | Expected result | Failure meaning | Evidence to capture |
| --- | --- | --- | --- | --- |
| 1 | Inspect the visible shell without changing flags | Production flag-off shell is visible | Split Command may have been promoted accidentally | Screenshot of shell |
| 2 | Confirm no Split Command placeholder panels are visible by default | Experimental shell remains hidden | Feature flag default drift | Screenshot of workspace |
| 3 | Do not enable `ui.experimental_split_command_workspace` during baseline verification | Baseline remains production-default only | Baseline result would be polluted | Note in verification log |

Stop if the experimental shell appears by default.

## Terminal / Console Error Capture

For every failure, capture:

- backend terminal output
- app dev terminal output
- renderer console messages
- screenshot of the visible UI state
- exact clicked label
- whether the failure happened before or after project mutation

Stop immediately if:

- a mutation appears hidden or automatic
- a recovery/restore action changes the original project unexpectedly
- a snapshot/report action claims success while the OS reports a missing path
- Split Command appears as the default shell

## What Not To Test Yet

- Do not promote or manually enable Split Command for baseline verification.
- Do not test memory, graph, vector, local LLM, or autonomous rewrite systems.
- Do not test rich diff UI, per-hunk accept/reject, or persistent provenance storage.
- Do not treat this checklist as executed until Pass 14 explicitly runs it.

## Pass 14 Readiness

This checklist is ready for Pass 14 only after automated validation for Pass 13 is green and no remaining blocker says human verification should pause.
