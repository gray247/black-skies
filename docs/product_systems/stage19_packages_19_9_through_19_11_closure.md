# Stage 19 Packages 19.9–19.11 Closure Record

## 1. Purpose

This document is the formal repository closure record for Packages 19.9–19.11
on branch `salvage/minimal-two-surface-shell`. It records the bounded Project
Spine production system delivered across Project Lifecycle and Isolation,
Durable Manuscript Save, and Outline, Binder, and Core Writing Workflow. It
records the authority boundaries established by that system, the defects
corrected while proving it, the verification represented in the repository,
the accepted manual-launch outcome, and the scope that remains outside this
package-horizon closure.

The accepted implementation baseline is commit
`ff2e5d1de3af701a19018465b419850e6bfb7a66`, titled
`feat(stage19): complete project lifecycle save and close spine`. At the
documentation gate:

- the current branch was `salvage/minimal-two-surface-shell`;
- the configured upstream was
  `origin/salvage/minimal-two-surface-shell`;
- local `HEAD` and upstream resolved to the same commit;
- the ahead/behind count was `0/0`; and
- the worktree was clean before this document was created.

This record uses repository evidence and the accepted manual receipt. It does
not enlarge the implemented feature set, reinterpret unimplemented planning
as delivered behavior, or make a claim for deferred systems. The package-
horizon closure becomes effective when this closure record is committed. It
does not claim that closure occurred at the implementation baseline itself.

The Packages 19.9–19.11 Project Spine horizon will be formally closed when
that record becomes effective. Stage 19 remains open under the approved V1.0
package sequence.

Earlier Stage 19 planning records remain useful for provenance. In particular,
the Foundation Spine records describe the initial local project-open/save and
re-entry proof, while the later Package 19.7 inventory and Package 19.8 host
charter identify the production-path gaps that had to be resolved. This
package-horizon record reflects the later repository state rather than
repeating an earlier readiness snapshot.

## 2. Packages 19.9–19.11 objective

The implemented Packages 19.9–19.11 objective was to establish one
authoritative local writing spine in the real Electron application. That spine
had to support a
writer-facing path through project identity, project creation and opening,
manuscript-unit organization, prose editing, durable save, honest dirty state,
normal re-entry, and guarded application close while preserving the distinct
roles of Writing Studio and Command Center.

The objective was narrower than the full product-system catalog. Its required
properties were:

1. the production Electron entry reaches the intended two-window application
   rather than a synthetic shell or component-test-only path;
2. one main-process project authority owns the active project identity,
   generation, revision, structural order, and durable-save result;
3. Writing Studio alone owns prose and manuscript-structure mutation;
4. Command Center receives a derived, read-only projection and never becomes a
   second manuscript authority;
5. renderer-local edits become dirty immediately without being mistaken for a
   durable save;
6. successful save reconciles only the content that was submitted, so a newer
   edit made while a save is in flight remains dirty;
7. project and generation changes isolate session state and reject stale work;
8. an unsaved close is correlated across main, preload, shared IPC, and the
   Writing Studio renderer;
9. Keep editing preserves the manuscript and dirty state, while Discard leaves
   shutdown authority in the main process; and
10. both clean and dirty shutdown paths terminate the paired Electron windows
    normally without forced process termination.

The accepted production-host requirement also included a direct renderer-load
decision. An explicitly configured development URL remains valid for
development, but an unpackaged production build without such a URL must load
the built renderer file directly. Unpackaged status alone is not authority to
invent a local development server.

## 3. Delivered scope

### 3.1 Authoritative Electron host and two-window shell

`app/main/main.ts`, compiled to the package entry declared by
`app/package.json`, remains the production main-process authority. It creates
the Writing Studio primary window and the Command Center secondary window,
loads the current preload, registers project-spine window roles, and owns the
paired-window lifecycle.

The current host provides these delivered behaviors:

- Writing Studio and Command Center are distinct `BrowserWindow` instances;
- both windows load the same renderer entry and resolve their role inside that
  renderer;
- Command Center is subordinate to Writing Studio for pair lifecycle;
- losing or crashing a window produces bounded degraded/stale state rather
  than silently creating a second authority;
- optional services do not own the core shell's ability to appear; and
- closing Writing Studio performs the paired cleanup owned by main.

The final renderer-load decision in `app/main/main.ts` gives an explicit
configured renderer URL priority. When no explicit URL exists, main requires
and loads `app/dist/index.html` through a file URL. If that built entry is
missing, startup fails with a clear build-or-configure error. There is no
implicit `127.0.0.1:5173` fallback.

### 3.2 Project identity, lifecycle, and isolation

`app/main/projectSessionCoordinator.ts` owns the active project session. Its
state includes the durable project identity, path, generation, revision,
selected unit, dirty units, and role-specific snapshots. Opening the exact
active identity and path is idempotent. Reusing a durable identity at another
path fails closed. Moving to another dirty project requires explicit discard,
and late operations bound to an older session are rejected.

`app/main/projectSpineIpc.ts` is the main-process request boundary for the
Stage 19 lifecycle. It coordinates project create/open, recent-project
references, manuscript-unit operations, durable save, projected state, and
close-confirmation responses. It checks the caller role and the active
project/session generation before mutation. A stale Project A mutation cannot
be applied to Project B, and Command Center cannot use the shared bridge to
acquire Writing Studio mutation rights.

`app/main/projectSpineRepository.ts` is the durable repository boundary. The
focused repository evidence covers exact supported metadata, durable identity
separate from title and path, invalid or unsupported metadata rejection,
stable manuscript-unit identity, structural rename and reorder, confirmed
deletion, exact reopen, and prevention of cross-project saves.

Recent-project references are operational references rather than ownership of
project data. Removing a recent reference does not delete the project
directory. Missing references are reported honestly, and valid active state is
preserved when a recent path fails.

### 3.3 Writing Studio authority and local editing

`app/renderer/Stage19WritingSpineApp.tsx` is the dedicated Stage 19 renderer
application. In the writing role it exposes project lifecycle controls, the
manuscript binder, manuscript-unit creation and structural controls, and the
prose editor. It routes mutations through the typed bridge rather than
maintaining a competing durable project store.

The renderer keeps per-unit local buffers so switching between manuscript
units does not erase unsaved prose. Empty-string content is treated as actual
content rather than an absent buffer. Dirty derivation compares the local
editor buffer with the last main-confirmed durable content. Project or
generation changes clear prior-session reconciliation state, while stale
snapshots cannot overwrite a newer local edit.

Save completion is bound to the project generation and the content submitted
for the affected unit. When the successful result confirms the same content
still held by the buffer, the renderer can reconcile that unit to saved. If
the writer edited again after submission, the newer buffer remains dirty.
Failed or rejected saves preserve the content and dirty state and present the
main-owned error without claiming that the manuscript is saved.

### 3.4 Command Center projection

In the command role, `Stage19WritingSpineApp.tsx` renders project identity,
save/dirty status, active-unit information, and the manuscript-unit list as a
projection. It exposes no prose editor and no manuscript create, rename,
reorder, delete, save, or close-decision controls.

The shared project-spine contract deliberately omits Writing-only mutation and
close-response methods from the Command Center bridge. Main also validates the
caller role, so the user-interface boundary is backed by a process boundary.
Command Center dirty counts and binder/status information derive from the same
active project snapshot that informs Writing Studio; they do not constitute a
second dirty-state authority.

### 3.5 Durable save and honest state

Package 19.10 delivers generation-bound durable save through main. The renderer can
show local dirty state immediately, but only the durable owner can return a
successful saved result. The state model distinguishes local unsaved content,
save in progress, saved content, stale/conflicting completion, and failure.

Repository tests establish that the main process reports dirty and saved only
around the bound durable write and never reports saved after a stale-source
conflict. Renderer tests establish that save failure and transport failure
retain local dirty truth, while a successful save of unchanged submitted
content clears the correct unit. The top status, binder annotation, and
Command Center count are projections of the same conclusion.

### 3.6 Correlated close confirmation and shutdown authority

The shared IPC contract defines a typed close-confirmation request and
response. A request carries correlation ID, active project ID, active
generation, and the Writing Studio web-contents identity. Main creates at most
one pending request and dispatches it only to Writing Studio. Duplicate close
attempts retain the original correlation. Missing identity, missing or
destroyed Writing Studio state, no authoritative dirty units, or IPC dispatch
failure all fail closed without consuming dirty state.

Writing Studio subscribes to one active current-session request. Exact
duplicates and requests for another project or generation are ignored. The
accessible renderer dialog provides Keep editing and Discard changes. It
traps focus between those actions, gives initial focus to Keep editing,
supports Escape as Keep editing, restores prior focus, disables both actions
during submission, and retains the request with writer-facing retry guidance
when submission fails.

The preload bridge preserves the typed main-process result envelope. A
resolved transport is not treated as success unless the result itself is
successful. Both Keep editing and Discard clear renderer request state only on
typed success. Neither renderer action directly closes Electron or clears
manuscript buffers. Main remains the shutdown authority and grants a bounded,
one-shot coordinated-close allowance only for the accepted discard path.

## 4. Repository authority established

Packages 19.9–19.11 establish the following repository authority chain:

| Concern | Repository authority | Enforced boundary |
| --- | --- | --- |
| Electron entry and paired windows | `app/main/main.ts` | owns window creation, role registration, renderer loading, and pair shutdown |
| Active project/session truth | `app/main/projectSessionCoordinator.ts` | owns project ID, path, generation, revision, selection, and authoritative dirty projection |
| Durable project files | `app/main/projectSpineRepository.ts` | validates supported metadata and performs project/unit persistence |
| Lifecycle and mutation IPC | `app/main/projectSpineIpc.ts` | checks caller role, identity, generation, revision, and result semantics |
| Close correlation | `app/main/closeConfirmationCoordinator.ts` | owns pending correlation and the one-shot coordinated-close allowance |
| Renderer bridge | `app/main/preload.ts` and `app/shared/ipc/projectSpine.ts` | exposes typed, role-bounded calls without exposing raw `ipcRenderer` |
| Writing interaction and local buffers | `app/renderer/Stage19WritingSpineApp.tsx` | owns current editor buffers but not durable-save truth or shutdown |
| Command projection | `app/renderer/Stage19WritingSpineApp.tsx` in command role | read-only projection with no manuscript or close-decision mutation controls |

This chain eliminates the principal shadow-authority risks within the Stage 19
scope. File presence, renderer state, and Command Center presentation cannot
independently redefine active identity or durable-save truth. A request from a
stale generation cannot be accepted merely because its UI remains mounted.
Closing a renderer page cannot substitute for the native `BrowserWindow`
close lifecycle. A successful IPC transport cannot substitute for a
successful typed result.

The authoritative production path excludes the duplicated historical
`app/electron/*` path and the synthetic salvage shell from production
ownership. Those files may remain as history or bounded proof, but they are
not the current application entry.

### 4.1 Authority reconciliation

This record is subordinate to the approved Stage 19 V1.0 master sequence. It
closes only Packages 19.9–19.11 and their integrated Project Spine
implementation and acceptance horizon. `current_truth_index.md` and
`stage19_v1_master_implementation_and_acceptance_plan.md` remain authoritative
for Stage 19's open status and remaining package sequence.

Stage 19 remains open. This record does not supersede, shorten, or otherwise
alter the approved Packages 19.12–19.22 sequence. Package 19.12 is the next
roadmap package, but this record does not authorize it. Package 19.12 requires
separate Jason authorization before work begins.

## 5. Production defects discovered during implementation and acceptance

### 5.1 Optional-service startup could block the core host

The Package 19.7 inventory recorded that main started optional services before
creating the window, which contradicted the required offline-capable core
shell. Package 19.8 introduced an explicit optional-service startup boundary
and focused tests. The current host can continue to the writing shell when an
optional service is unavailable while reporting degraded capability honestly.

### 5.2 Unregister cleanup could dereference destroyed web contents

Window-role cleanup originally depended on reading `webContents.id` during
unregistration. Electron can make that object unavailable after destruction.
The current registration path captures the live web-contents ID when the
window is registered and returns an idempotent unregister closure. Closed
handlers invoke that closure without dereferencing destroyed web contents.
Focused launch tests model the destroyed-object behavior.

### 5.3 Secondary-window cleanup could be bypassed

Automated clean-close acceptance observed Writing Studio close while Command
Center remained alive. This was an automated acceptance discovery, not a Jason
manual observation.

Primary-collapse cleanup was not guaranteed before registry removal and
diagnostics, and a return path could bypass subordinate cleanup. The corrected
primary-collapse path deterministically destroys the subordinate Command
Center, clears the window references, and then performs diagnostics.

The corrected result is zero orphan BrowserWindows, a clean Electron exit with
code `0`, and focused regression coverage for primary close, diagnostic
failure, renderer crash, and subordinate cleanup.

### 5.4 Close response success was erased at the preload boundary

The close-response preload method initially reduced the main-process typed
result to `Promise<void>`. A renderer therefore could not distinguish a
successful decision from a resolved failure result and could dismiss the
modal prematurely. The shared bridge and preload now return the existing
typed result unchanged, including error codes and messages. Renderer request
state clears only for an actual successful result; typed failure and transport
failure remain visible and retryable.

### 5.5 Local-buffer reconciliation could misreport saved state

Early dirty reconciliation could compare a retained local buffer with an old
canonical snapshot or clear state without proving which content had been
saved. The final renderer binds reconciliation to unit identity, session
generation/revision ordering, and the exact content submitted. A save clears
dirty state only if the current buffer still corresponds to the confirmed
content. Newer edits survive an earlier save completion, and stale snapshots
cannot erase or resurrect dirty state.

### 5.6 Unpackaged production builds attempted the development server

The production renderer-load decision used unpackaged status together with a
hard-coded `http://127.0.0.1:5173/` default. A production-built unpackaged
Electron launch therefore attempted the development server even when no
development URL was configured, producing `ERR_CONNECTION_REFUSED` before a
fallback loaded the built renderer.

The final decision uses an explicit URL only when configured. Otherwise it
loads the existing built `dist/index.html` directly, regardless of unpackaged
status. Both windows share that decision. A missing build fails clearly rather
than attempting arbitrary localhost infrastructure.

### 5.7 Verification-harness defects were kept separate from product defects

The Stage 19 Electron proof also exposed harness assumptions: Playwright
`Page.close()` was not the real guarded `BrowserWindow.close()` path; a
contenteditable editor could not be asserted with an input-value matcher;
visible status text was not an accessible name; and Playwright dialog
bookkeeping could survive a self-terminating Electron page. The committed E2E
fixture and Stage 19 specification use role-based window identity, the native
BrowserWindow close path, content-appropriate assertions, scoped status
locators, a bounded child-process exit observer, and cleanup that recognizes a
verified self-exit. These corrections strengthened the proof without changing
production close behavior or accepting forced termination.

## 6. Verification evidence

The final focused unit/component aggregate for the Packages 19.9–19.11
Project Spine horizon was:

```text
Test Files: 8 passed
Tests:      79 passed
```

The aggregate command covered exactly:

- `main/__tests__/splitCommandPreload.test.ts`
- `main/__tests__/splitCommandSecondaryLaunchHook.test.ts`
- `main/__tests__/projectSessionCoordinator.test.ts`
- `main/__tests__/projectSpineIpc.test.ts`
- `main/__tests__/projectSpineRepository.test.ts`
- `renderer/__tests__/Stage19WritingSpineApp.test.tsx`
- `renderer/__tests__/Stage19CloseConfirmation.test.tsx`
- `renderer/__tests__/Stage19WritingSpineLayout.test.ts`

This 8-file/79-test result is the focused unit/component aggregate. The
permanent four-test Electron E2E result in section 6.4 is separate and is not
combined with it into a fabricated total.

### 6.1 Foundation and host evidence

The committed Package 19.5 verification record reports an 11-file focused
matrix with 78 passing tests, a passing main-process TypeScript no-emit check,
a passing renderer production build, and a passing `git diff --check`. That
record covers the initial project loader, bootstrap, identity handoff,
integrated surface boundaries, explicit save, stale-write rejection, normal
saved-draft re-entry, and preload/shared IPC continuity.

Package 19.8 then moved the intended shell onto the authoritative host path.
The current `splitCommandSecondaryLaunchHook.test.ts` covers stable single-
window behavior outside the selected mode, dedicated secondary launch,
optional/degraded window behavior, crash and close cleanup, blocked silent
respawn, the close guard, and the final renderer-load decision. Its production
load cases prove:

- an explicit Vite development URL is used by both dedicated windows;
- an unpackaged build with no development URL loads the built renderer in both
  windows;
- packaged launch retains built-renderer loading;
- a missing built renderer fails clearly; and
- no localhost fallback is created without explicit authorization.

### 6.2 Main project-spine evidence

The focused main suites provide direct contract evidence for:

- canonical active identity and role-projected snapshots;
- idempotent same-project open and copied-identity rejection;
- explicit dirty-project switch confirmation;
- monotonic generation/revision behavior and late-result rejection;
- exact metadata validation and unsupported-format rejection;
- stable unit identity across rename and reorder;
- confirmed deletion and exact structural reopen;
- Project A/Project B save and mutation isolation;
- Writing Studio-only mutation authority;
- recent-reference persistence without project deletion;
- generation-bound durable save and stale-conflict failure; and
- correlated close-response validation without mutation on rejection.

The close-guard tests additionally cover one-shot coordinated-close allowance,
single correlated dispatch to Writing Studio, duplicate-close suppression,
fail-closed missing/destroyed state, partial-request cleanup after IPC failure,
and absence of a native unsaved-close dialog from the normal path.

### 6.3 Renderer evidence

`Stage19WritingSpineApp.test.tsx` covers role-specific subscription and
unsubscription, single active close request, duplicate and stale request
rejection, typed failure/retry, Command Center passivity, Writing Studio
mutation authority, unit operations, per-unit buffer isolation, generation-
bound Ctrl+S, immediate dirty and saved projection, failed-save preservation,
dirty project-switch confirmation, project-generation buffer cleanup, and
unload blocking while local edits remain.

`Stage19CloseConfirmation.test.tsx` covers the production dialog's accessible
name and description, Command Center exclusion, focus containment, Escape,
both decisions, disabled submission controls, error presentation, focus
restoration, one active current-session request, duplicate-submission
prevention, retry, and listener cleanup.

### 6.4 Electron end-to-end evidence

The committed `stage19-project-spine.spec.ts` contains four bounded Electron
tests:

1. dedicated Writing Studio and Command Center reach stable startup;
2. an unsaved close opens the Writing Studio modal and Keep editing preserves
   both windows, prose, and dirty state without beginning shutdown;
3. a dirty close followed by Discard closes both windows and produces a clean
   Electron child-process exit; and
4. a saved project closes, relaunches, and restores durable manuscript state.

The E2E helper identifies the two windows by the rendered Stage 19 role rather
than first-window order. The close request is initiated through the real
Writing Studio `BrowserWindow.close()`. Clean exit is observed from the child
process reference captured before shutdown and requires numeric code `0` with
no signal. `SIGKILL` or another forced fixture termination is not accepted as
success.

### 6.5 Package-horizon closure repository gate

The closure repository gate confirms synchronized authority before this
record:

```text
HEAD:     ff2e5d1de3af701a19018465b419850e6bfb7a66
branch:   salvage/minimal-two-surface-shell
upstream: origin/salvage/minimal-two-surface-shell at the same commit
ahead:    0
behind:   0
worktree: clean
```

## 7. Manual acceptance summary

Manual acceptance receipt:

| Field | Value |
| --- | --- |
| Date | 2026-07-13 |
| Operator | Jason |
| Platform | Windows 11 |
| Branch | `salvage/minimal-two-surface-shell` |

Jason's manual observations included:

- project creation under `C:\BlackSkiesManualTests`;
- three distinct manuscript units;
- Writing Studio and Command Center agreement;
- immediate dirty-state projection;
- binder `Unsaved` projection;
- Ctrl+S durable-save confirmation;
- Keep editing preserving both windows and unsaved prose;
- Discard closing both windows;
- relaunch proving discarded prose absent and durable content retained;
- direct built-renderer production launch; and
- clean close with no uncaught destroyed-object exception.

The accepted production-built unpackaged launch opened both Writing Studio
and Command Center from `file:///.../dist/index.html` without requiring an
explicit development-server URL. No request to `127.0.0.1:5173`,
`ERR_CONNECTION_REFUSED`, or uncaught lifecycle exception remained after the
renderer-load and cleanup corrections.

Exact multi-unit durable restoration across relaunch was additionally proved
by the permanent Electron automation. This record does not claim that every
automated C2 assertion was manually repeated. The manual acceptance conclusion
is bounded to the observations listed above and does not imply acceptance of
excluded product systems, protected evidence, additional export formats,
cloud operation, optional AI, or distribution channels outside this package
horizon.

## 8. Deferred scope

The Packages 19.9–19.11 closure does not implement or admit the following
scope:

- collaboration, cloud sync, cross-device synchronization, or connectors;
- autonomous agents, broad rewrite automation, or model training;
- a plugin marketplace;
- historical Gray Skies restore/import or sample normalization;
- advanced provenance graphs or a broad diagnostic cockpit;
- macOS or mobile packaging and automatic-update infrastructure;
- protected-evidence use;
- broad AI, critique, rewrite, analytics, or manuscript-signal capability;
- advanced dock, float, or multi-monitor restoration behavior;
- broad backup, snapshot, restore, or recovery systems beyond the delivered
  normal durable save and re-entry spine;
- DOCX, EPUB, JSON-project, or other additional export promises; and
- cleanup, migration, archive, or historical-path removal merely because the
  current production authority is now known.

The historical `app/electron/*` and synthetic salvage surfaces remain outside
production authority. Their continued presence is not permission to revive,
merge, delete, or reinterpret them. Likewise, deferred product-system dossiers
remain planning and governance material unless separately authorized.

These deferrals are exclusions from this closure, not hidden incomplete parts
of the delivered Packages 19.9–19.11 spine. No deferred system may become a required gate
for basic writing, local save, or the current two-surface authority merely by
being present elsewhere in the repository.

## 9. Formal package-horizon closure statement

The Packages 19.9–19.11 Project Spine horizon is formally closed when this
closure record is committed. Stage 19 remains open under the approved V1.0
package sequence. Commit
`ff2e5d1de3af701a19018465b419850e6bfb7a66` is the accepted implementation
baseline; it is not represented as the effective closure commit.

The closed horizon contains one authoritative Electron host for the dedicated
Writing Studio and Command Center; one main-owned active project/session
authority; a role-bounded typed IPC bridge; durable manuscript-unit lifecycle
and save behavior; renderer-local editing with honest reconciliation;
read-only Command Center projection; correlated unsaved-close confirmation;
main-authoritative clean shutdown; normal durable re-entry; focused main and
renderer verification; and real Electron end-to-end proof for startup, Keep
editing, Discard, clean exit, and saved relaunch.

The production defects identified within that package horizon have repository
fixes and focused regression coverage. No known unresolved defect in the
documented Packages 19.9–19.11 boundary requires this package-horizon closure
to be qualified.

This closure does not promote deferred systems, make historical paths
authoritative, close Stage 19, or constitute final V1.0 release authority. It
does not supersede Packages 19.12–19.22.

## 10. Transfer within the governed Stage 19 sequence

The handover from this record transfers orchestrator context for the completed
Packages 19.9–19.11 Project Spine horizon. It does not transfer final V1.0
release authority and grants no automatic runtime permission.

Package 19.12 is the next package named by the approved roadmap. This record
does not authorize Package 19.12; separate Jason authorization is required
before it begins. Any authorized continuation must preserve the established
project identity, durable-save, Writing Studio, Command Center, typed-result,
dirty-state, and shutdown ownership boundaries unless a later governed
decision explicitly changes them with equivalent evidence.

The Packages 19.9–19.11 evidence remains the baseline for those authority
boundaries. Later work may not treat Command Center as a manuscript owner,
renderer state as durable-save truth, an IPC transport resolution as typed
success, unpackaged status as authorization for a development server, or
forced process termination as a clean application exit.

PZ_CONTINUE: Packages 19.9–19.11 closed; Stage 19 remains open; Package 19.12 eligible only for separate authorization
