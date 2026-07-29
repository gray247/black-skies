# Stage 19 Package 19.20 Packaged RC Acceptance Plan

Status: authorized and planned; workflow hardening is qualified; artifact
preparation and hands-on acceptance have not begun

Branch: `salvage/minimal-two-surface-shell`

Starting commit: `82b3962`

Authorization date: 2026-07-29

Planning-audit correction:

```text
BS-19.20-P2-01
The Windows packaging workflow creates and uploads a new installer on every
branch push, including documentation-only commits.
Disposition: CLOSED
Correction: workflow_dispatch is the only packaging trigger; a fixed-gate
policy and six focused tests reject automatic triggers and SHA-less artifacts.
```

## 1. Goal and authority

Jason explicitly authorized Package `19.20` to begin and requested a
twice-reviewed plan with test creation and vulnerability review.

Package `19.20` supplies the human packaged-release-candidate judgment that
automation cannot supply. It answers:

> Does the exact qualified installer produce an installed Black Skies
> experience that Jason can trust for the locked V1.0 create, organize, write,
> save, recover, reopen, export, offline, two-window, and uninstall boundary?

This package does not rebuild the release candidate, add features, start user
documentation, or authorize final release. Package `19.19` automation remains
the authority for ASAR contents, sandbox configuration, bridge allowlists,
process-tree isolation, and exact installed export bytes. Package `19.20`
repeats only release-critical user-visible behavior and known defect seams
against the installed application.

Package `19.21` and Package `19.22` are not authorized by this plan.

## 2. Immutable candidate binding

The only candidate eligible for the first acceptance pass is:

```text
source commit:
85c1524d486cf42d93fa057e3e8c00376071e8fb

installer:
BlackSkies-Setup-1.0.0-rc1.exe

byte length:
89318050

SHA-256:
3f59db2f17566a99a269968cd9dba7785646cc7652f4948cb99dc4d1c163a0e0

signature:
NotSigned

installed executable SHA-256:
4ac995b39fb917f7f1d4b7afa8d2bf148f6caf60bc66e4899b3e20edafc04e59

installed app.asar SHA-256:
2d1343640a53882d4a26589b526973886e899fd3dbabfc4625b8cd34396c3e4b

qualification workflow:
https://github.com/gray247/black-skies/actions/runs/30492203867

artifact ID:
8740270981
```

The installer is an unsigned internal RC. An `Unknown publisher` or
SmartScreen warning is expected and must be recorded honestly. It is safe to
continue only after the filename, byte length, and SHA-256 match this record.

A local rebuild, renamed installer, different hash, changed receipt, or later
commit is a different candidate and cannot inherit this acceptance.

## 3. Evidence and safety boundary

Use only:

- the exact Package `19.19` installer and receipt;
- synthetic acceptance prose;
- generated disposable projects under the Package `19.20` root; and
- machine-readable evidence containing paths, hashes, versions, statuses, and
  timestamps.

Use no real manuscript, `sample_project`, protected evidence, provider
credential, paid provider request, or repository development launch.

The acceptance root will be:

```text
C:\BlackSkiesManualTests\Stage19-20
```

The selected per-user install directory will be beneath:

```text
%LOCALAPPDATA%\BlackSkiesManualTests\Stage19-20\Installed RC1
```

The helper must resolve these paths exactly before any mutation. It must never
delete or rename a broad root, an existing installation, an existing user-data
directory, or an ambiguous project. If a prior Black Skies registration,
shortcut, installation, or conflicting acceptance root exists, preparation
stops for review rather than cleaning it automatically.

Ordinary first-run acceptance also requires uncontaminated application
user-data state. If an existing Black Skies user-data directory is detected,
the helper stops. The preferred resolution is a dedicated clean Windows test
account; any temporary preservation/restoration of existing user data requires
separate explicit approval and byte-manifest evidence. Nothing is deleted
automatically.

## 4. Work batches

### BS-19.20-01 — Authority, artifact intake, and baseline

Codex will:

1. harden the Windows packaging workflow so artifact creation/upload requires
   explicit manual dispatch rather than every branch push, and add a repository
   guard that rejects reintroduction of automatic push/schedule packaging or
   artifact names that omit the exact source SHA;
2. record this authorization and clean starting commit;
3. copy the exact retained CI installer and receipt into the disposable
   acceptance root without modifying either;
4. independently verify filename, byte length, SHA-256, source commit,
   receipt identity, and `NotSigned` status;
5. record existing Black Skies per-user/system registration, shortcuts,
   processes, installation paths, and user-data paths without changing them;
6. reject acceptance or installation roots that are existing reparse points,
   junctions, symbolic links, or non-empty ambiguous directories;
7. create a small unrelated sentinel file adjacent to, but outside, the
   selected installation directory and record its exact bytes and SHA-256; and
8. fail closed if the machine cannot distinguish the candidate or its target
   from an existing Black Skies installation.

No installer is executed in this batch.

This control is required because audit loop 2 confirmed that documentation-only
closure commit `82b3962` automatically produced and uploaded artifact
`black-skies-1.0.0-rc1-82b3962ba49817b98d96197c4531dead2661c475`
(artifact ID `8740581108`, workflow run `30492961808`). That artifact is
explicitly disqualified from Package `19.20` and must not be downloaded or
executed. Only the `85c1524` candidate bound in section 2 is eligible.

`BS-19.20-P2-01` is a bounded release-identity vulnerability with the
hash-bound candidate as a safe workaround, but this plan requires correction
rather than deferral.

### BS-19.20-02 — Acceptance witness and negative tests

Before Jason begins, Codex will add and validate a bounded Windows acceptance
witness. The witness may create only the disposable acceptance directories,
synthetic sentinels, and JSON receipts. It may inspect but not remove existing
installations.

The witness will support four read-only or narrowly constructive phases:

```text
preflight
installed
post-uninstall
reinstalled
```

It will verify:

- candidate and receipt identity;
- a second candidate hash immediately before execution and an unchanged hash
  after installer exit, closing the check/use substitution window;
- installed executable path, version, exact SHA-256, file identity, and
  `NotSigned` truth;
- exact installed `app.asar` SHA-256;
- per-user registration and absence of an unexpected machine-wide
  registration;
- desktop and Start Menu shortcut targets, arguments, working directories, and
  icon sources;
- running executable origin and absence of external `node`, `python`, or
  `python3` descendants, using process creation time as well as PID ancestry
  so Windows PID reuse cannot create a false result;
- survival and byte identity of the adjacent sentinel, disposable projects,
  and Markdown exports; and
- application, shortcut, and registration removal after uninstall.

Negative self-tests will prove that the witness rejects:

- a changed expected installer hash;
- a receipt bound to another source SHA or installer hash;
- a shortcut target outside the selected install directory;
- an unexpected version or signature status;
- an unexpected installed executable or ASAR hash;
- an ambiguous pre-existing installation; and
- a reparse-point/junction acceptance or installation target;
- a changed adjacent sentinel or external-data manifest.

The tests use synthetic metadata or a disposable copied fixture. A deliberately
mismatched or modified installer is never executed.

Codex will also prepare a packaged representative-project check for the exact
installed executable. Immediately after the assisted installation and
`installed` witness pass, but before section 4 human testing, it will create a
generated partition-B 100-unit project,
exercise selection at the far end, save representative Unicode/Markdown
content, close, relaunch, reopen, and export it. The existing Package `19.16`
ceilings remain regression bounds rather than broad performance claims:

```text
100-unit creation: less than 15 seconds
unit-100 selection: less than 3 seconds
```

This automated packaged check satisfies the representative-larger-project RC
lane without asking Jason to type or manually inspect 100 units.

### BS-19.20-03 — Assisted installation and first launch

Jason will run the exact verified installer interactively, not silently.

Acceptance requires:

1. the installer identifies Black Skies `1.0.0-rc1`;
2. it permits the approved selectable per-user destination;
3. it does not require administrator elevation or create an unexpected
   machine-wide installation;
4. it offers and creates the expected desktop and Start Menu shortcuts;
5. the unsigned-publisher warning matches the recorded signature truth;
6. launch occurs from the installed shortcut, not the repository, a
   development server, or Electron; and
7. exactly one Writing Studio and one Command Center open and remain usable.

Codex then runs the `installed` witness before manuscript acceptance
continues.

### BS-19.20-04 — Consolidated packaged core acceptance

Use these generated projects:

```text
P19.20 Orion RC
P19.20 Vega RC
P19.20 Recovery Accept RC
P19.20 Recovery Reject RC
P19.20 Save Failure RC
```

Use recognizable synthetic markers:

```text
ORION-RC-ONLY — Café 🌌
VEGA-RC-ONLY — River Δ
RECOVERY-ACCEPT-RC — keep this
RECOVERY-REJECT-RC — discard this
SAVE-FAILURE-RC — preserve locally
```

#### A. Installed happy path and defect retest

In `P19.20 Orion RC`:

1. create, rename, and reorder at least three units, including an empty title;
2. use `Opening # [α]` with `Saved A — Café 🌌 **bold**`;
3. use `Duplicate *Title*` with
   `[Signal](https://example.invalid/signal)`;
4. type a new recognizable line, immediately use Ctrl+Z, Ctrl+Y, and Ctrl+S,
   and confirm the restored line is durably saved;
5. close both windows normally, relaunch from the installed shortcut, reopen
   Orion, and confirm exact titles, order, Unicode, Markdown, and prose; and
6. export Markdown outside both the installation and project directories and
   inspect the readable result.

Step 4 is mandatory regression coverage for the Save race found during
Packages `19.18` and `19.19`.

#### B. Isolation and state truth

1. Create `P19.20 Vega RC` with its unique marker.
2. Switch repeatedly between Orion and Vega.
3. Confirm project identity, prose, unit order, dirty state, recovery state,
   export destination, and Command Center status never cross projects.
4. Leave Orion dirty, cancel a switch once, and confirm local prose remains.
5. Confirm dirty export is blocked with the Save remedy; Save, then export.
6. Confirm Command Center remains status-only and exposes neither manuscript
   prose nor recovery-decision controls.

#### C. Bounded failure, recovery, and offline core

1. Open an ordinary non-project folder and confirm bounded rejection without
   replacing the active project.
2. Cancel one native export dialog and confirm a neutral no-op.
3. Decline replacement of an existing export and confirm its bytes remain;
   then explicitly accept replacement.
4. In `P19.20 Save Failure RC`, perform the exact project-directory rename
   failure exercise: Save a baseline, type the marker, rename only that
   disposable project directory, attempt Save, confirm visible failure and
   retained local prose, restore the exact directory name, Save, relaunch, and
   confirm durability.
5. Perform one interrupted recovery acceptance and one interrupted recovery
   rejection in their named disposable projects. Accepted recovery must remain
   unsaved until normal Save; rejected recovery must preserve the durable
   baseline and must not reappear.
6. Disconnect network access once during a clean core-writing interval and
   confirm create/edit/Save/reopen/export remains usable. Do not invoke AI and
   do not provide or test provider credentials. Reconnect after the check.

For steps 4 and 5, Codex will generate the exact copy/paste commands from the
resolved disposable project and installed-executable paths. The rename helper
must reject a target outside the Package `19.20` acceptance root. The
interruption helper must display the matched executable path and process IDs
before termination and must never use a broad Electron, application-name, or
all-process kill.

#### D. Packaged two-window behavior

1. Place Writing Studio and Command Center on different monitors.
2. Move, resize, maximize/restore, and focus each window.
3. Close normally and relaunch from the installed shortcut.
4. Disconnect one monitor, confirm both windows remain reachable, reconnect
   it, and arrange them again.
5. At the Windows scaling used during acceptance, use Tab and Shift+Tab
   through the primary controls, activate representative controls from the
   keyboard, confirm focus remains visible, and confirm clean/dirty/saving/
   failed status and error messages are conveyed by readable text rather than
   color alone.

This is a focused packaged-host check. It does not repeat an arbitrary timed
writing quota or claim that elapsed use proves reliability.

### BS-19.20-05 — Uninstall boundary and same-candidate reinstall

After all projects are clean and both windows are closed:

1. record manifests and hashes for every disposable project, export, and the
   adjacent sentinel;
2. uninstall through the ordinary Windows application entry;
3. confirm no unexpected elevation or deletion target is requested;
4. confirm the installed application, uninstaller, shortcuts, and registration
   are removed;
5. distinguish the intentionally retained Electron user-data directory from
   stale application files without opening or recording its prose-bearing
   content;
6. confirm every external project, export, and adjacent sentinel remains
   byte-identical;
7. confirm the removed shortcut cannot launch a stale executable;
8. reinstall the same hash-bound installer;
9. rerun the `reinstalled` witness; and
10. launch from the recreated shortcut and reopen Orion from its preserved
   external location.

The final installed/uninstalled preference after evidence capture does not
alter acceptance. Jason may keep the exact RC installed for Package `19.21`
documentation review or remove it again through the ordinary uninstaller.

### BS-19.20-06 — Failure correction and targeted retest

Any failure pauses acceptance. Codex will preserve only non-prose diagnostics,
classify the finding, and determine its authority owner.

```text
P0: data loss, crossover, corruption, security boundary violation
P1: primary installed workflow, accessibility, launch, save, reopen, export,
    recovery, install, or uninstall failure
P2: major bounded degradation with a viable workaround
P3: minor cosmetic or wording defect
```

Rules:

- P0/P1 blocks the candidate.
- P2 is fixed unless Jason explicitly accepts a documented deferral.
- P3 may defer only with a named future owner and honest limitation record.
- A runtime, preload, builder, dependency, or installer change creates a new
  candidate. The full Package `19.19` exact-commit regression,
  artifact-verifier, clean install/offline lifecycle/uninstall workflow, hash,
  and receipt must pass again before Package `19.20` resumes.
- The previous candidate's human results become historical and do not
  automatically transfer.
- After a bounded fix, repeat artifact identity, install/uninstall safety, the
  failed section, and every section sharing the corrected authority seam.
- Any P0 data-safety or project-isolation correction requires the complete
  Package `19.20` matrix again.
- Feature additions, schema changes, public signing, updater work, or broader
  redesign stop for separate authority.

### BS-19.20-07 — Qualification and closure

The final receipt will bind:

- installer filename, byte length, SHA-256, signature status, source commit,
  and Package `19.19` qualification run;
- acceptance-witness results;
- Jason's section dispositions and observations;
- every correction and targeted/full retest;
- external-data and sentinel preservation evidence;
- protected-evidence status;
- final installation disposition; and
- clean synchronized repository status.

Jason reports:

```text
A — install, launch, happy path, Save-race retest:
B — project isolation and state truth:
C — bounded failure, recovery, and offline core:
D — packaged two-window behavior:
E — uninstall, preservation, reinstall:
overall: PASS | PASS_WITH_ACCEPTED_P2 | FAIL
observations:
```

Package `19.20` closes only after Jason supplies an explicit overall
disposition, there is no unresolved P0/P1, every P2 is fixed or explicitly
accepted, and repository authority is synchronized. Closure makes Package
`19.21` next eligible but does not start it.

## 5. Evidence reuse and non-repetition

The following Package `19.19` evidence carries forward and is not manually
recreated:

- ASAR allowlist and integrity;
- forbidden-content scan;
- preload sandbox and exact bridge allowlists;
- no Node/Python child runtime;
- exact deterministic Markdown byte comparison;
- automated offline firewall proof;
- clean-runner registration and shortcut target proof; and
- automated uninstall preservation.

The following Package `19.18` observations also carry forward unless the
packaged behavior contradicts them:

- the absence of a useful timed-writing quota;
- harmless unpackaged DevTools Autofill messages;
- the accepted monitor-disconnect behavior in which windows remain reachable
  but do not automatically return to their prior monitor; and
- earlier export replacement evidence, supplemented here by one concise
  packaged check.

Human Package `19.20` work remains necessary for installer-dialog trust,
first-launch experience, readable/error-state judgment, physical monitor
behavior, user-visible Save/recovery confidence, and overall acceptance of the
installed RC.

## 6. Vulnerability audit

The acceptance campaign explicitly probes these release-boundary threats:

| Threat | Control or test | Stop condition |
| --- | --- | --- |
| artifact substitution or stale installer | exact filename, size, SHA-256, receipt, source SHA before execution | any mismatch |
| check/use artifact swap | re-hash the same resolved file immediately before execution and after installer exit | any path, identity, or hash change |
| unsigned artifact misrepresentation | signature check plus explicit Windows-warning receipt | any signed/trusted claim or unexpected status |
| privilege/scope expansion | assisted per-user install, no required UAC, HKCU registration check, unexpected HKLM rejection | elevation or machine-wide mutation |
| shortcut/path hijack | reject reparse targets; resolve shortcut targets/arguments and running executable; verify installed EXE and ASAR hashes | target or identity outside exact qualified installation |
| repository/global-runtime dependency | launch only from shortcut; process witness; offline use | repo, external Node, Python, or development-server dependency |
| renderer authority exposure | carry forward sandbox/bridge proof; manually confirm Command Center has no prose or mutation controls | prose or unauthorized control exposure |
| cross-project leakage | unique A/B markers, dirty-switch cancellation, Command Center identity checks | any prose, status, recovery, or destination crossover |
| dishonest Save/export | immediate undo/redo/Save, failure preservation, relaunch, dirty-export block | lost prose or false Saved/export state |
| recovery truth violation | separate accept/reject crash cycles | silent durable overwrite, reoffered rejection, wrong-project recovery |
| network/credential dependency | offline core interval with no AI invocation or credentials | core workflow requires network/provider |
| installer/uninstaller overreach | adjacent sentinel and external-data manifests before/after uninstall | any unrelated deletion or byte change |
| stale registration/executable | post-uninstall witness and failed stale-shortcut launch | application, shortcut, or registration remains |
| stale or contaminating user data | preflight detects existing user data; post-uninstall distinguishes retained user data without inspecting prose | contaminated first run or destructive cleanup |
| evidence leakage | paths/status/hash-only JSON; synthetic prose only; credential-pattern scan | protected prose or credential enters evidence |

Out-of-scope hostile-local-user attacks, code signing, automatic updates,
macOS/Linux packaging, cloud synchronization, plugins, and new feature design
are not silently promoted into Package `19.20`.

## 7. Immediate stop conditions

Stop immediately for:

- installer identity mismatch;
- ambiguous existing installation or unsafe cleanup target;
- protected evidence or credentials entering the process;
- data loss, project crossover, recovery crossover, or dishonest Saved state;
- an installed renderer escaping its bounded authority;
- unexpected administrator or machine-wide installation;
- repository, Python, global Node, development-server, internet, or provider
  dependency in the core workflow;
- installer/uninstaller modification outside its exact scope;
- inability to bind evidence to one candidate; or
- any correction that changes the locked V1.0 feature or schema boundary.

## 8. Completed plan reviews

### Loop 1 — Seam, gap, redundancy, and efficiency review

The first review corrected the draft by:

- separating Package `19.19` automated proof from Package `19.20` human
  judgment;
- removing a repeated timed-writing quota;
- consolidating happy path, isolation, export, failure, recovery, offline, and
  two-monitor checks into one generated-project campaign;
- retaining direct packaged retests only for release-critical behavior and the
  known immediate-Ctrl+S defect;
- adding exact artifact intake before installer execution;
- adding assisted-install and first-launch checks absent from development-build
  acceptance;
- adding an automated installed 100-unit representative-project check instead
  of burdening the human checklist;
- adding the missing manual keyboard, focus, scaling, non-color status, and
  error-readability check;
- binding Save-failure and interruption commands to resolved disposable paths
  rather than generic process or filesystem patterns; and
- making uninstall/reinstall preservation one coherent final section.

### Loop 2 — Adversarial hardening and audit

The second review hardened the corrected plan by:

- failing closed on pre-existing or ambiguous installations;
- preventing automatic cleanup of installations or user data;
- identifying and disqualifying the extra artifact emitted from
  documentation-only commit `82b3962`;
- requiring manual-dispatch-only packaging plus a guard against renewed
  push-triggered artifact proliferation;
- closing the artifact check/use window with immediate pre-execution and
  post-execution hashing;
- rejecting reparse-point, junction, and symbolic-link install/acceptance
  targets;
- binding installed executable and ASAR bytes to the Package `19.19` receipt;
- preventing stale application user data from masquerading as a clean
  first-run result;
- adding negative tests for the acceptance witness itself;
- checking per-user versus machine-wide registration and unexpected
  elevation;
- resolving shortcuts and the running process to the exact installed
  executable;
- guarding process ancestry with creation time so PID reuse cannot create a
  false witness;
- adding an adjacent sentinel to detect uninstaller overreach;
- preventing AI/provider requests during offline core acceptance;
- limiting evidence to synthetic, non-prose machine facts;
- invalidating all artifact-bound evidence after any binary change;
- requiring the complete Package `19.19` qualification pipeline before a
  corrected candidate returns to human testing; and
- defining exact P0/P1/P2/P3 retest and stop rules.

This document is the final plan after both reviews, not the unrevised draft.

## 9. Initial execution record

`BS-19.20-P2-01` was corrected before plan synchronization:

```text
packaging triggers: workflow_dispatch only
artifact names: exact github.sha required
standalone workflow policy: PASS
focused policy tests: 6 passed
full fixed Stage 19 gate:
  historical lint: 0 errors / 6 bounded warnings
  active lint: 0 warnings / 0 errors
  typecheck and production build: PASS
  unit/component/contract: 545 passed / 2 intentional skips
  Electron: 18 passed
  protected evidence: NOT_USED
```

The first restricted-sandbox production-build attempt could not write Vite's
normal dependency-directory temporary file. The same build and complete gate
passed outside that filesystem restriction; no product or repository
correction resulted from the sandbox-only failure.

Two local silent invocations of the exact installer then exited with Windows
access-violation code `0xC0000005`, once with a disposable custom per-user
destination and once with the default destination. Both failed before
registration, shortcuts, application launch, or user-data creation; the exact
empty disposable remnants were inspected and removed. The clean Package
`19.19` Windows runner had already passed silent installation for the same
installer hash.

This is tracked as `BS-19.20-W01`, a local silent-install divergence. Silent
installation is not the Package `19.20` human target. The 100-unit check will
therefore run against the exact executable after the supported assisted
installation. If the assisted installer also fails, the finding promotes
immediately to a P1 candidate blocker.

The fail-closed machine preflight then passed:

```text
existing Black Skies registration: none
existing Black Skies shortcuts: none
selected installation directory: absent
existing Black Skies user data: none
qualified installer copy SHA-256: exact match
qualification receipt binding: exact match
signature status: NotSigned
adjacent uninstall sentinel: created and hashed
protected evidence: NOT_USED
```

Acceptance-witness and representative-test preparation passed:

```text
focused witness/negative/expected-byte tests: 10 passed
full fixed Stage 19 gate:
  unit/component/contract: 555 passed / 2 intentional skips
  Electron: 18 passed
  protected evidence: NOT_USED
```

The packaged 100-unit execution remains correctly pending until the assisted
installer and installed-file witness pass.

### BS-19.20-W01 promotion and correction

The supported assisted launch also returned without displaying a window.
Windows Error Reporting recorded the same failure for all three attempts:

```text
classification: P1 candidate blocker
exception: 0xC0000005
faulting module: extracted NSIS System.dll
fault offset: 0x00001581
WER bucket: f39dc239067558ab49ac63d51bad7fe8
application files written: none
registration or shortcuts written: none
Defender event at failure: none
installer SHA-256: exact qualified match
signature status: NotSigned
protected evidence: NOT_USED
```

A minimal isolated probe proved that the bundled NSIS `3.0.4.1` System
plug-in succeeds for the installer mutex call but fails on the per-user
`SHGetKnownFolderPath` sequence used by `app-builder-lib@26.8.1`. The
Package `19.19` runner did not expose this host-specific Windows 11 failure.

The bounded correction pins a pnpm dependency patch that retains the
template's existing canonical `$LocalAppData\Programs` fallback and removes
only the optional crashing known-folder calls. The configuration now also
sets `allowElevation: false` and `packElevateHelper: false`, matching the
per-user contract and preventing unused machine-wide elevation behavior.
Preflight and fixed-gate tests fail closed if those settings or the pinned
patch disappear.

The corrected local candidate passed:

```text
package preflight: PASS
compatibility patch tests: 2 passed
installer build: PASS
isolated per-user silent install on affected host: exit 0
installed executable present: PASS
HKCU registration only: PASS
isolated silent uninstall: exit 0
application directory removed: PASS
registration removed: PASS
```

This local artifact is diagnostic only because it was built from an uncommitted
tree. The original Package `19.19` installer is disqualified from Package
`19.20`. Human acceptance may resume only after the correction is committed,
the full fixed gate passes, and one new exact candidate completes the clean
Windows packaging/install qualification workflow.
