# Stage 19 Package 19.18 Manual Acceptance Plan

## 1. Authority and boundary

Jason explicitly authorized Package `19.18` on 2026-07-26 and directed that it
be performed once after Codex completed Packages `19.16` and `19.17`.

Package `19.17` is closed. Stable runtime commit `611fc06` passed the exact
clean Windows gate and GitHub Linux run `30230183707`. Documentation-only
Package `19.17` closure commit `09ac5df` does not change runtime bytes.

Package `19.18` is human judgment against the production-built development
entry. It does not qualify an installer; that belongs to Package `19.19`.
Automation may support setup and preserve facts, but it may not supply Jason's
experience or acceptance judgment.

## 2. One canonical launch path

From a fresh ordinary PowerShell window:

```powershell
Set-Location C:\Dev\black-skies
powershell.exe -ExecutionPolicy Bypass -File .\scripts\start-stage19-acceptance.ps1
```

This path:

- refuses a dirty worktree;
- removes dev-server, Playwright, E2E, and harness launch flags;
- rebuilds the production renderer and main entry;
- uses the approved local Python environment; and
- launches Electron in the foreground from `app/dist` and
  `app/dist-electron`.

Close both Black Skies windows normally to return to PowerShell. Do not use
`pnpm dev`, `start-codex.ps1 -SmokeTest`, a Vite URL, Playwright, or an
installer for this package.

## 3. Disposable acceptance location

Use:

```text
C:\BlackSkiesManualTests\Stage19-18
```

Create only disposable Package `19.18` projects there. Do not use a real
manuscript or protected evidence.

Recommended project names:

```text
P19.18 Orion
P19.18 Vega
P19.18 Recovery Accept
P19.18 Recovery Reject
P19.18 Save Failure
```

Use unmistakable prose markers such as:

```text
ORION-ONLY — Café 🌌
VEGA-ONLY — River Δ
RECOVERY-ACCEPT — keep this
RECOVERY-REJECT — discard this
SAVE-FAILURE — preserve locally
```

## 4. Consolidated single-pass checklist

Record each section as `PASS`, `FAIL`, or `NOT RUN`. A failure stops closure
and begins a bounded repair/retest cycle.

### A. Stable launch and happy path

1. Launch with the canonical command and confirm exactly two usable windows:
   Writing Studio and Command Center.
2. Create `P19.18 Orion` under the disposable location.
3. Create at least three units, including one blank/Untitled title.
4. Rename and reorder units.
5. Write recognizable Unicode and Markdown prose in multiple units.
6. Use `Ctrl+Z`, `Ctrl+Y`, and `Ctrl+S`; confirm visible prose and dirty/Saved
   status remain truthful in both windows.
7. Close normally, relaunch with the same command, reopen Orion, and confirm
   unit order, titles, and exact durable prose.
8. Continue writing, Save, export Markdown outside the project, and inspect the
   readable file for order/content/Unicode.

### B. Project isolation

1. Create `P19.18 Vega` with the `VEGA-ONLY` marker.
2. Switch repeatedly between Orion and Vega.
3. Confirm prose, unit order, dirty status, recovery status, export
   destination, and Command Center project identity never cross projects.
4. Leave one project dirty, cancel the switch once, confirm its prose remains,
   then Save or explicitly discard and switch.
5. Relaunch and reopen both projects; confirm only their own durable content.

### C. Bounded failures

1. Try opening an ordinary folder that is not a Black Skies project. Confirm
   bounded rejection and preservation of the active project.
2. Begin an export and cancel the native dialog. Confirm neutral cancellation.
3. Make a unit dirty and confirm export is blocked with the Save remedy.
4. Decline replacement of an existing Markdown destination and confirm its old
   bytes remain; then accept replacement and confirm the new export.
5. Perform the Save-failure exercise in section 5 and confirm local prose is
   retained, failure is visible, and Save succeeds after restoration.
6. Launch once with the optional-service-failure command in section 6 and
   confirm core create/write/Save/reopen remains usable.

### D. Recovery accept and reject

1. In `P19.18 Recovery Accept`, Save a baseline, type the
   `RECOVERY-ACCEPT` marker, wait at least two seconds, then terminate the
   Electron process from a second PowerShell as described in section 7.
2. Relaunch, reopen the project, accept the recovery candidate, confirm the
   recovered prose is editable but unsaved, Save, relaunch, and confirm it is
   durable.
3. Repeat with `P19.18 Recovery Reject` and the `RECOVERY-REJECT` marker.
4. Reject that candidate; confirm the durable baseline remains and the rejected
   marker is not offered again after relaunch.
5. Throughout both exercises, confirm Command Center reports status but never
   exposes prose or recovery decision controls.

### E. Real writing session

Use the stable build for one continuous 60–90 minute real writing session.
Create or continue a disposable manuscript with several units. Organize,
write, navigate, undo/redo, Save periodically, close/reopen once if natural,
and export at the end.

Record:

- approximate duration;
- approximate word count and unit count;
- any lag, focus loss, confusing state, or friction;
- whether any prose was lost or crossed projects; and
- whether you would trust this development build for the same session again.

### F. Two-monitor/window behavior

During the same pass:

1. place Writing Studio and Command Center on different monitors;
2. test ordinary move, resize, maximize/restore, and focus switching;
3. close and relaunch with both monitors connected;
4. disconnect one monitor, confirm both windows remain reachable, reconnect it,
   and arrange the windows again;
5. test the scaling settings you actually use; and
6. confirm no off-screen, unusably small, overlapping-authority, or stranded
   window state.

## 5. Save-failure exercise

Use only the disposable `P19.18 Save Failure` project.

1. Create and Save a baseline, then type the `SAVE-FAILURE` marker without
   saving.
2. In a second PowerShell, rename that project directory by appending
   `.temporarily-offline`.
3. Press Save in Writing Studio.
4. Confirm Save fails visibly and the full local marker remains in the editor.
5. In the second PowerShell, restore the directory's exact original name.
6. Press Save again, close, relaunch, reopen, and confirm the marker is durable.

Do not rename the acceptance root or any non-disposable directory. If the exact
project path is unclear, stop and ask Codex before running the rename.

## 6. Optional-service failure launch

Close the normal app, then run:

```powershell
Set-Location C:\Dev\black-skies
powershell.exe -ExecutionPolicy Bypass -File .\scripts\start-stage19-acceptance.ps1 -OptionalServiceFailure
```

The intentionally invalid optional-service port must degrade optional services
without blocking the local core. No API key, internet access, or paid provider
operation is required.

## 7. Controlled interruption command

After typing the recovery marker and waiting at least two seconds, open a
second PowerShell and inspect the exact Black Skies Electron processes:

```powershell
Get-CimInstance Win32_Process |
    Where-Object {
        $_.Name -eq 'electron.exe' -and
        $_.CommandLine -like '*C:\Dev\black-skies*'
    } |
    Select-Object ProcessId, CommandLine
```

If every listed process clearly belongs to this Black Skies acceptance launch,
terminate that exact process group:

```powershell
Get-CimInstance Win32_Process |
    Where-Object {
        $_.Name -eq 'electron.exe' -and
        $_.CommandLine -like '*C:\Dev\black-skies*'
    } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

If unrelated Electron applications appear or the identity is ambiguous, stop
and ask Codex. Do not broaden the process filter.

## 8. Receipt

Jason supplies:

```text
stable launch and happy path:
project isolation:
bounded failures:
recovery accept:
recovery reject:
60–90 minute session:
two-monitor/window behavior:
overall disposition: PASS | PASS_WITH_ACCEPTED_P2 | FAIL
observations:
```

Package `19.18` closes only after the receipt is recorded, every failure is
fixed/retested or explicitly routed under the blocker taxonomy, and the
repository authority is synchronized. Package `19.19` does not begin by
inference.

## 9. Live acceptance correction record

### 2026-07-27 — undo/redo followed immediately by Save

Jason completed the stable launch and the rest of section A1 successfully, but
observed one bounded failure in `P19.18 Orion`:

```text
Ctrl+Z removed the new line.
Ctrl+Y restored it.
Immediate Ctrl+S produced no visible Save result.
After another edit, Save completed normally.
```

This is an acceptance failure, not operator error. The checklist paused before
section A2.

The correction serializes rapid dirty/clean/dirty status submissions and makes
Save wait for the selected unit's latest dirty-status submission before it
captures the settled editor buffer, captures recovery, and begins durable
persistence. The first clean-gate run proved why both boundaries are required:
the early implementation could acknowledge Save while persisting an earlier
buffer. The edit-revision guard still preserves any genuinely later edit as
dirty, and the operation neither delays ordinary typing nor retargets a Save
across a project generation change.

Permanent proof now includes:

- a renderer regression that holds three rapid dirty-state submissions open
  and proves Save cannot begin until the final redone state settles;
- a production Electron regression that types recognizable Unicode prose,
  performs undo and redo, immediately invokes `Ctrl+S`, and confirms both the
  Saved projection and exact durable prose; and
- the existing fixed Package `19.17` gate, which must pass from the clean
  correction commit before human retest.

Jason repeated only the corrected A1 undo/redo/immediate-Save sequence against
commit `5aa8b6d` and reported:

```text
A1 NARROW RETEST: PASS
```

The correction is accepted. Section A1 is `PASS`; Package `19.18` continues
with the remaining single-pass checklist.

Jason then completed the stable-build export exercise and reported:

```text
SECTION A2: PASS
```

Section A, stable launch and happy path, is `PASS`.

Jason completed the project-isolation exercise and reported:

```text
SECTION B: PASS
```

Section B, project isolation, is `PASS`.

## 10. Consolidated evidence disposition

Before continuing section C, Jason asked to remove redundant manual work. The
checklist was consolidated without weakening the acceptance boundary:

- neutral export cancellation carries forward from section B;
- clean stable-build export carries forward from section A2;
- replacement decline/accept carries forward from Jason's Package `19.15`
  acceptance because the export replacement path is unchanged and remains
  covered by the fixed regression gate; and
- ordinary-folder rejection and dirty-state export blocking remained direct
  Package `19.18` checks because they exercise integrated active-project and
  recently corrected dirty-state behavior.

Jason completed those two retained checks and reported:

```text
SECTION C1 CONSOLIDATED: PASS
```

Section C1 is `PASS` with explicit evidence reuse. This is consolidation, not
an unrecorded omission.

Jason completed the combined durable Save-failure and optional-service-failure
exercise and reported:

```text
SECTION C2 CONSOLIDATED: PASS
```

The main-process log independently confirms that the intentional invalid
service port reached the containment boundary:

```text
Optional services unavailable; continuing with core writing shell
```

The lack of visible difference between normal and degraded core use is the
expected result. Writing, Save, close, and reopen remained usable.

Two diagnostic observations were classified separately:

- Chromium `Autofill.enable` and `Autofill.setAddresses` protocol messages are
  harmless unpackaged-DevTools noise and do not represent an application
  failure.
- The unpackaged production-built launcher incorrectly probed the configured
  packaged-Python path before honoring `BLACKSKIES_PYTHON`, then fell back to
  global `python`. Services remained healthy, but this contradicted the
  launcher's approved-environment claim. The in-scope correction requires
  bundled Python only when `app.isPackaged` is true and retains the existing
  allowlist and path validation for explicit unpackaged interpreters.

Section C2 is `PASS`; the Python diagnostic correction requires the fixed clean
regression gate before section D begins.

The first clean-gate run after that correction exposed a gate-only run-order
defect in the existing multi-unit save/reopen scenario. Trace evidence showed
that a binder button was briefly disabled during project hydration; the test
treated that transient state as permission to skip selection and then searched
for the wrong editor. The gate now waits for each requested unit to become
enabled before selecting it. The complete five-scenario project-spine Electron
file passes with that deterministic wait; no runtime correction resulted from
this gate finding.

Final correction qualification:

```text
Python policy correction: 28a2bdb
Deterministic hydration wait: c5c86a0
Windows fixed gate: PASS
Unit/component/contract checks: 523 passed, 2 intentional skips
Production Electron scenarios: 18 passed
Linux fixed gate run: 30482059014 PASS
Worktree: CLEAN_RC_ELIGIBLE
Protected evidence: NOT_USED
```

Jason then completed both distinct interrupted-recovery decisions and
reported:

```text
SECTION D1 RECOVERY ACCEPT: PASS
SECTION D2 RECOVERY REJECT: PASS
```

Section D, recovery accept and reject, is `PASS`. Recovery acceptance remained
unsaved until normal Save and then became durable; recovery rejection preserved
the durable baseline, removed the rejected prose, and did not reoffer it.
Command Center remained status-only in both flows.
