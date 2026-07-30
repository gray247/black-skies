# Black Skies 1.0.0-rc1 User Guide

Status: Package `19.21` current installed-product guidance

Platform: Windows 11 x64

Installer: `BlackSkies-Setup-1.0.0-rc1.exe`

Signature: `NotSigned` (unsigned internal RC)

This guide describes the accepted Package `19.20` application. It does not
require a repository checkout, Python, global Node.js, a development server,
or an OpenAI credential for core writing.

## Install and first launch

1. Obtain the exact internal installer from the authorized release operator.
2. Verify the installer before running it:

   ```powershell
   Get-Item -LiteralPath .\BlackSkies-Setup-1.0.0-rc1.exe |
     Select-Object Name,Length
   Get-FileHash -Algorithm SHA256 -LiteralPath .\BlackSkies-Setup-1.0.0-rc1.exe
   Get-AuthenticodeSignature -LiteralPath .\BlackSkies-Setup-1.0.0-rc1.exe |
     Select-Object Status
   ```

   Expected result:

   ```text
   filename: BlackSkies-Setup-1.0.0-rc1.exe
   bytes: 89275742
   SHA-256: 93220059613b1fd8fb78cdbbe08539b033c4d93c2e30cb8abe0d67a95623458b
   signature: NotSigned
   ```

3. Run the assisted installer. Installation is per-user, does not request
   elevation, and allows a custom installation directory.
4. Leave **Run Black Skies** selected, or launch **Black Skies** from the
   desktop or Start Menu shortcut.

Windows may warn because this internal RC is unsigned. Verify the exact hash
above before choosing to run it. A different byte length or hash is a
different candidate and is not covered by this acceptance.

Black Skies opens two independent Windows: **Writing Studio** and
**Command Center**.

## Create or open a project

Use project controls in Writing Studio:

- **Open project…** — select the actual Black Skies project folder containing
  `project.json`.
- **Create project…** — enter **New project title**, then select a parent
  folder. Black Skies creates a new project folder inside that parent.
- **Recent projects** — reopen a remembered project reference. **Missing**
  means the remembered folder is no longer available. **Remove** forgets only
  that recent reference; it does not delete project files.

Projects are isolated local folders. Project files live outside the
installation directory at locations you choose.

## Organize and write

The **Binder** lists **Manuscript units** in durable order.

1. Enter an optional **Unit title** and choose **Create unit**. A blank title
   displays as **Untitled**.
2. Select a unit in the binder.
3. To rename it, edit **Selected unit title** and choose **Update title**.
4. Use **Move up** and **Move down** to change durable manuscript order.
5. Use **Delete unit…** only after reviewing its confirmation. Unit deletion
   cannot be undone in this release.
6. Write in **Manuscript editor**.

Editor shortcuts:

| Action | Shortcut |
| --- | --- |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` or `Ctrl+Shift+Z` |
| Save selected unit | `Ctrl+S` |

Switching units preserves unsaved buffers during the live session. It is not
a durable Save.

## Understand Save state

Writing Studio uses these exact state families:

- **Saved durably** — current manuscript changes reached project storage.
- **1 unsaved unit** / **N unsaved units** — local editor work still needs
  Save.
- **Saving…** — a Save is in progress.
- **Save failed: …** — durable storage did not accept the Save. The editor
  retains local prose and recovery protection where available; correct the
  storage problem and try **Save** again.

Command Center mirrors durable-save truth and identifies failures as occurring
in Writing Studio. It does not provide mutation controls.

When closing with unsaved work, Writing Studio offers **Keep editing** or
**Discard changes**. Discard intentionally abandons the
unsaved buffers; it is not Save.

## Close, reopen, and continue

1. Save every changed unit until Writing Studio reports **Saved durably**.
2. Close the Black Skies windows normally.
3. Relaunch from the desktop or Start Menu shortcut.
4. Reopen the project through **Recent projects** or **Open project…**.
5. Confirm unit names, order, and prose before continuing.

## Export deterministic Markdown

Export is available only from Writing Studio when the project is clean:

1. Save every changed unit successfully.
2. Choose **Export Markdown…**.
3. In **Export Markdown manuscript**, choose a destination. Black Skies
   creates a `.md` file; if another extension is entered, `.md` is appended.
4. Cancelling the save dialog records **Export cancelled. No file was
   created.**
5. If the destination exists, **Replace existing Markdown file?** offers
   **Replace** or **Cancel**. Replacement occurs only after **Replace**.

The export contains the project title followed by units in binder order. Unit
titles are escaped as Markdown headings, blank titles become **Untitled**, and
saved prose is preserved deterministically. Project files are not modified by
export.

If export is disabled or reports **Save the project successfully before
exporting**, resolve unsaved, failed-Save, or recovery state first. If export
fails, the app does not claim completion; choose another writable destination
or retry after resolving the reported storage error.

## Recover interrupted work

After an interrupted session, Writing Studio may show **Recover unsaved
Writing Studio prose**.

1. Review every displayed candidate.
2. Choose **Recover this prose** to apply that candidate, or **Reject and
   delete candidate** to keep the durable baseline and delete only the
   displayed recovery candidate.
3. Complete a decision for every candidate.
4. Recovered prose remains explicitly unsaved. Use the normal **Save** action
   for each recovered unit to make it durable.

If **Recovery evidence needs attention** appears, editing is blocked and the
recovery artifact is preserved. Do not manually delete project recovery files.
Open another project or close Writing Studio, preserve the project folder, and
follow the support escalation in `ops/support_playbook.md`.

## Optional remote OpenAI critique

Core writing is offline. The **Optional remote critique — Selected prose
only** surface is opt-in:

1. Enter an **OpenAI API key (session only; no readback)** and choose **Set
   session key**. The key remains only in main-process memory for the running
   session and is not written to project files.
2. Select 200–12,000 non-whitespace characters in the active editor.
3. Choose **Review outbound critique request**.
4. Review the **Exact outbound preview**, including exact selected prose,
   frozen instructions, provider request JSON, model, pricing snapshot, cost
   estimate, retention/cancellation disclosures, and payload hash.
5. Confirm the transmission clearance, then choose **Approve and send exact
   payload**.

No prose is sent during preview. Transmission requires explicit approval.
Results are advisory only and never rewrite manuscript files. Editing or
changing the selection invalidates a pending result; **Stop waiting** stops
local waiting, but may not prevent provider-side work already accepted.
**Clear key** removes the session credential.

V1 does not provide automatic critique, background sending, local-model
routing, model choice, rewrite application, critique persistence, or critique
from Command Center. Provider access, billing, and network availability are
the user's responsibility.

## Keyboard, focus, scaling, and two-window use

- Use `Tab` and `Shift+Tab` to move through interactive controls. Focus is
  visibly indicated.
- Use the normal Windows move, resize, maximize, restore, and focus commands
  for both windows.
- Windows scaling used during acceptance is supported; if content feels
  crowded, resize or maximize the affected window and use Windows display
  settings.
- A common two-monitor layout places Writing Studio on the primary writing
  display and Command Center on the second display.
- If a monitor disconnects, both windows should remain reachable on a
  surviving display, but they can overlap. Reconnecting does not
  automatically return a window to its previous monitor; arrange the windows
  again.

## Uninstall and data retention

Use Windows **Installed apps** or the Black Skies uninstaller.

Uninstall removes application files, per-user registration, and Black Skies
desktop/Start Menu shortcuts. It intentionally retains:

- projects and Markdown exports stored outside the installation directory;
  and
- the Electron per-user application-data directory.

Uninstall is not project deletion or a privacy wipe. Back up external projects
before any operating-system or storage maintenance. Reinstalling the exact
candidate can reopen preserved projects through **Open project…**.

## Troubleshooting

| Symptom | Response |
| --- | --- |
| Windows warns when installing | This RC is unsigned. Stop unless filename, byte length, and SHA-256 match this guide. |
| Two windows do not appear | Check the taskbar and surviving displays. If launch still fails, record the installed path and contact support; do not install a different candidate over it. |
| Project is rejected | For Open, select the project folder containing valid `project.json`, not its parent or a manuscript subfolder. Do not hand-edit project metadata as a first response. |
| Save fails | Keep Writing Studio open, preserve the visible prose, restore write access/free space to the project location, and retry Save. Do not treat switching units or closing as Save. |
| Export is disabled | Save all units and complete any recovery decision first. |
| Export fails | Choose a writable destination outside the installation directory, or retry after correcting the reported storage problem. |
| Recovery is offered | Review every candidate; accept or reject explicitly. Accepted prose still needs normal Save. |
| Recovery is degraded | Preserve the project folder and recovery artifact; do not delete either manually. Escalate with the exact on-screen message. |
| Optional critique fails | Core writing remains available. Check network/key/provider access, review a fresh outbound preview, or clear the session key. |
| Command Center appears stale | Continue work in Writing Studio and wait for synchronization. Never infer Saved state from Command Center when it says status is unavailable. |

For intake and escalation details, see
[`ops/support_playbook.md`](ops/support_playbook.md).
