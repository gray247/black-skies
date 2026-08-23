# Black Skies 1.0.0-rc1 Support Playbook

Status: Package `19.22` internal-baseline support guidance

Audience: internal support and release operators

Platform: Windows 11 x64

## Support boundary

Support the accepted packaged application described in `../../RELEASE.md` and
`../quickstart.md`. Do not use retained Python/FastAPI services, legacy
analytics/plugins/Companion flows, development flags, sample projects, or
historical phase documents to explain installed V1 behavior.

Do not request manuscript prose or OpenAI credentials. Ask for the minimum
non-content evidence needed: candidate identity, Windows version, installation
path, project path if the user approves sharing it, exact UI label/message,
time, action sequence, and whether external project files remain present.

## Intake checklist

Record:

1. installer filename, byte length, SHA-256, and signature status;
2. whether installation used the default or a custom per-user directory;
3. whether both **Writing Studio** and **Command Center** opened;
4. project action: Create, Open, Recent project, Save, recovery, or export;
5. exact state text such as **Saved durably**, **N unsaved units**,
   **Save failed**, or **Status unavailable**;
6. whether core writing remains usable;
7. whether the project/export lives outside the application directory; and
8. whether the incident follows install, upgrade/substitution, monitor change,
   interruption, uninstall, or reinstall.

Accepted candidate identity:

```text
BlackSkies-Setup-1.0.0-rc1.exe
87066061 bytes
16bb75a766392d407dbd728f51a6d3a34e66b570f781ea07d499aa7f12b7867d
NotSigned
```

A mismatch is a different candidate. Stop candidate-specific troubleshooting
and route it to the release operator.

## Severity and immediate response

| Severity | Examples | Response |
| --- | --- | --- |
| P0 | confirmed security compromise or destructive cross-project corruption | Stop use, preserve evidence without copying prose/credentials, escalate immediately. |
| P1 | launch failure, silent/dishonest Save, unrecoverable primary workflow, installer boundary violation | Keep files intact, stop destructive retries, escalate as a release blocker. |
| P2 | major bounded degradation with a viable workaround | Document exact workaround and owner; do not call it fixed. |
| P3 | minor usability or cosmetic issue | Record exact UI/location and future owner. |

## Installation and launch

### Unsigned-installer warning

The internal RC is intentionally `NotSigned`. Verify exact filename, byte
length, and SHA-256 before running it. Do not represent it as trusted by
SmartScreen or advise bypassing a warning for an unverified artifact.

### Missing window

Black Skies launches two windows. Check the taskbar and all connected displays.
After monitor disconnect, both windows should remain reachable but can overlap.
Reconnect does not restore former placement automatically.

If launch fails, preserve the installed directory and candidate identity.
Do not install a different build over the accepted candidate as a diagnostic
step.

## Project intake

**Open project…** requires the actual project folder containing `project.json`.
**Create project…** requires a parent folder and creates a new project folder
inside it.

For an invalid project:

- confirm the selected folder level;
- confirm the folder exists and is readable;
- do not manually repair `project.json`, outline metadata, drafts, or recovery
  files during first-line support; and
- preserve the folder and exact error before escalation.

Removing a recent-project reference does not delete project files.

## Markdown structure intake

Program 5 Markdown intake creates a new disposable project and preserves the
normalized source in `manuscript-intake.md`. Detected structure is provisional
sidecar metadata in `manuscript-structure.json`; it is not accepted manuscript
truth until the writer explicitly accepts proposals and applies them.

Apply requires durably saved Units and rejects stale, unresolved, ambiguous, or
overlapping source ranges. Applied ranges are immutable. If the source changes
after Apply, the Writing Studio reports the machine-readable
`SOURCE_CHANGED_AFTER_APPLY` state and blocks rediscovery and Apply; do not
repair this by editing the sidecar or drafts manually. A crash-safe Apply
journal is recovered before structure is shown. If recovery reports a blocking
error, preserve the project directory and escalate with the journal and exact
error code.

Reordering proposals is staged until **Save order** is used. **Cancel order**
or closing the Structure disclosure discards the staged order and restores the
last durable sidecar order. Reopening Structure must not revive an unsaved
arrangement. Packaged applications always use native Markdown and directory
choosers; deterministic chooser paths are test-harness behavior only.

## Save failure

If **Save failed** appears:

1. keep Writing Studio open;
2. do not close, switch candidates, or treat unit switching as Save;
3. preserve the visible local prose without asking the user to transmit it;
4. check project-location availability, write permission, free space, and
   removable/network volume state;
5. retry normal **Save** or `Ctrl+S`; and
6. confirm **Saved durably** before normal close/relaunch.

If retry fails, preserve the project and recovery artifacts unchanged and
escalate. Never claim durability based only on Command Center when it reports
failure or status unavailable.

## Recovery

Recovery candidates must be reviewed in Writing Studio.

- **Recover this prose** applies the displayed candidate as unsaved work.
  Normal Save is still required.
- **Reject and delete candidate** preserves the durable baseline and deletes
  only that confirmed recovery candidate.
- **Recovery evidence needs attention** blocks editing and preserves the
  artifact.

Do not delete or rewrite recovery artifacts manually. Rejection is destructive
and must be initiated by the user against the exact displayed candidate.

## Markdown export

Export requires a clean, saved project and no unresolved recovery state.
Cancellation creates no file. An existing destination is replaced only after
the explicit **Replace existing Markdown file?** → **Replace** decision.

For failure:

- keep the project open and clean;
- choose a writable destination outside the installation directory;
- confirm the destination is not locked by another program;
- preserve the exact error and destination path; and
- never claim completion without the **Export complete** notice and expected
  file.

## Optional remote critique

Optional critique is not part of offline core support.

- Never ask for or record the API key.
- The key is session-only main-process memory and has no readback.
- No prose is sent at preview; transmission requires explicit clearance and
  **Approve and send exact payload**.
- Editing invalidates the request/result relationship.
- **Stop waiting** is fail-closed locally but may not cancel provider-side work
  already accepted.
- Critique is advisory and never mutates manuscript files.

Provider auth, billing, rate limits, availability, and network errors must not
be diagnosed by enabling legacy services or changing core project files.
Confirm core writing remains available and ask the user to clear the session
key if they no longer want remote access enabled.

## Uninstall, reinstall, and data

Uninstall removes application files, per-user registration, and Black Skies
shortcuts. It retains external projects/exports and the Electron per-user
application-data directory.

Before uninstall/reinstall troubleshooting:

1. record the exact candidate identity;
2. back up external projects using ordinary file-copy practices;
3. confirm projects are outside the installation directory;
4. close both windows normally after Save; and
5. verify the same installer hash before reinstall.

Do not describe uninstall as a privacy wipe or project deletion.

## Escalation packet

Provide:

- severity and user impact;
- exact accepted/mismatched candidate identity;
- Windows version and display/scaling arrangement;
- installation path;
- action sequence and exact UI text;
- project/export path only if approved by the user;
- whether external bytes remain present;
- whether core writing remains available;
- whether recovery was offered and whether the user chose accept or reject;
- whether optional network critique was involved; and
- a statement that no manuscript prose or credential was collected.

Do not collect protected manuscript content merely to reproduce an issue. Use
new synthetic text in a disposable project when a reproduction is authorized.
