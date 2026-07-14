# Stage 19 Package 19.13 Scope and Inspection Record

Status: scope and inspection complete; runtime and test mutation not authorized

Package: 19.13 — Command Center integrity

Branch: `salvage/minimal-two-surface-shell`

Inspection date: 2026-07-14

## 1. Purpose and authority boundary

This record fixes the repository-grounded Package 19.13 boundary, describes the
current Command Center projection and capability surface, identifies the gaps
between visible passivity and process-level integrity, and recommends one
smallest safe first implementation mutation. It creates no runtime or test
authority.

The controlling master plan defines Package 19.13 as **Command Center
integrity**, dependent on Packages 19.9 through 19.12, with the exit gate:
`truthful, non-mutating, project-scoped status`. The V1.0 scope lock separately
requires actual-host Command Center integration and honest clean, dirty,
saving, saved, failed, and stale/conflict semantics.

The gate began at synchronized commit
`b7939986eaca38a7cca400e9b71e9377e1737fb4` (`docs(product): close Package
19.12`). That commit added and pushed the Package 19.12 closure record, thereby
satisfying the record's explicit effective-commit condition. Package 19.12 is
therefore formally closed. The earlier authority-reconciliation boundary is
`ad3b41724b4514f28744707a1ce59013ee3c9782` (`docs(product): reconcile Package
19.12 authorization`).

Stage 19 remains open. Package 19.13 is next in the approved sequence, but no
Package 19.13 runtime or test mutation is currently authorized.

## 2. Gate receipt

The inspection started from a clean synchronized repository:

| Gate item | Result |
| --- | --- |
| Branch | `salvage/minimal-two-surface-shell` tracking `origin/salvage/minimal-two-surface-shell` |
| Local `HEAD` | `b7939986eaca38a7cca400e9b71e9377e1737fb4` |
| Upstream | `b7939986eaca38a7cca400e9b71e9377e1737fb4` |
| Ahead/behind | `0/0` |
| Worktree | clean |
| Package 19.12 | closure record committed and pushed; formally closed |
| Package 19.13 authority | this docs-only scope/inspection record only; implementation not authorized |

## 3. Controlling authority inspected

The following records were read as controlling or directly relevant
authority:

- `docs/product_systems/current_truth_index.md`;
- `docs/product_systems/current_product_roadmap.md`;
- `docs/product_systems/stage19_v1_master_implementation_and_acceptance_plan.md`;
- `docs/product_systems/stage19_v1_scope_lock.md`;
- `docs/product_systems/stage19_package_19_12_scope_and_inspection.md`;
- `docs/product_systems/stage19_package_19_12_authorization_reconciliation.md`;
- `docs/product_systems/stage19_package_19_12_closure.md`; and
- `docs/product_systems/stage19_packages_19_9_through_19_11_closure.md`.

The resulting authority position is:

1. Package 19.12 recovery truth and bounded accept/reject behavior are closed.
2. Package 19.13 may inspect and later prove a truthful Command Center view of
   the same main-owned project session, but may not reopen Package 19.12.
3. Command Center must not receive manuscript prose, recovered prose, or
   manuscript/recovery mutation authority.
4. Navigation selection may remain a main-validated shared navigation action;
   it is not permission to mutate project structure or manuscript content.
5. Package 19.14 optional AI work, later packages, Stage 19 closure, V1.0
   closure, packaging, and release remain outside this package.

Some current-authority summaries preserve their pre-closure temporal wording
that Package 19.12 closure was pending. The later, specific closure record and
its now-pushed effective commit resolve that condition; this record does not
rewrite those historical statements.

## 4. Files inspected and authority classification

The classification is relative to the dedicated Stage 19 Writing
Studio/Command Center production path and Package 19.13, not a declaration that
all reference paths may be deleted.

| File or group | Classification | Inspection result |
| --- | --- | --- |
| `app/shared/ipc/projectSpine.ts` | `CURRENT_PRODUCTION_AUTHORITY` | Defines the role-projected session snapshot and Project Spine bridge. Command snapshots omit drafts and all recovery detail. The contract needs a later prose-free Command recovery summary, but the canonical seam is correct. |
| `app/main/projectSessionCoordinator.ts` | `CURRENT_PRODUCTION_AUTHORITY` | Owns the canonical active project, generation, revision, selection, dirty set, save state, error, recent-project state, and recovery state. It emits role-specific snapshots and is the source to reuse. |
| `app/main/projectSpineRecoveryCheckpoints.ts` | `REUSE_AS_IS` | Owns Package 19.12 checkpoint/recovery decisions. Package 19.13 may derive a safe status from coordinator-owned recovery state but must not move ownership or expose candidates/prose. |
| `app/main/projectSpineIpc.ts` | `REUSE_AS_IS` | Registers window roles, publishes role-projected snapshots, and rejects Project Spine project/manuscript/recovery mutations unless the sender is Writing Studio. Selection remains available to both roles. |
| `app/main/preload.ts` | `REUSE_WITH_REPAIR` | Correctly shapes the Project Spine command bridge, but also exposes broad legacy and filesystem-capable globals to the secondary window. This is the first blocking integrity gap. |
| `app/main/main.ts` | `REUSE_AS_IS` | Registers Writing Studio and Command Center web contents, publishes role-specific snapshots, makes Command Center subordinate, destroys it on primary loss, and prevents silent stale-secondary resurrection. |
| `app/renderer/Stage19WritingSpineApp.tsx` | `REUSE_WITH_REPAIR` | Renders the current Command Center projection and rejects older generation/revision snapshots. It needs later prose-free recovery/lifecycle status projection after the capability boundary is repaired. |
| `app/renderer/index.tsx` | `REUSE_AS_IS` | Selects the dedicated Stage 19 role and renders the shared Stage 19 app for Writing Studio or Command Center. |
| `app/main/projectLoaderIpc.ts` | `EXCLUDED_FROM_19_13` | Still-current legacy IPC handlers can load drafts, create projects, and save durable drafts without a Stage 19 sender-role guard. They are reachable from Command Center through the shared preload today, but the first Package 19.13 mutation removes that reachability at the secondary preload boundary rather than changing legacy behavior for Writing Studio or the stable path. |
| `app/main/__tests__/projectSessionCoordinator.test.ts` | `REUSE_WITH_REPAIR` | Existing role projection, recovery exclusion, generation/revision, dirty, and save tests are suitable extension seams. |
| `app/main/__tests__/projectSpineIpc.test.ts` | `REUSE_WITH_REPAIR` | Existing Project Spine role-enforcement tests remain authoritative but do not prove legacy globals are absent. |
| `app/main/__tests__/splitCommandPreload.test.ts` | `REUSE_WITH_REPAIR` | Proves Writing-only methods are absent from the command-shaped Project Spine bridge, but does not assert that other exposed globals are withheld. This is the focused test seam for the first mutation. |
| `app/renderer/__tests__/Stage19WritingSpineApp.test.tsx` | `REUSE_WITH_REPAIR` | Proves visible Command Center passivity and current projection. It is the later safe-summary rendering seam. |
| `app/tests/e2e/stage19-project-spine.spec.ts` and `app/tests/e2e/stage19-recovery.spec.ts` | `REUSE_WITH_REPAIR` | Prove synchronized dirty/save truth, passive recovery UI, no recovery field in the Project Spine command snapshot, and missing Project Spine recovery decision methods. They do not inspect every global preload capability. |
| `app/renderer/App.tsx` and `app/renderer/components/workspace/SplitCommandWorkspace.tsx` | `REFERENCE_ONLY` | Older integrated/single-renderer Command Center concepts remain useful for wording and layout comparison but do not control the dedicated Stage 19 two-window path. |
| `app/renderer/salvage/MinimalTwoSurfaceShell.tsx` and its test | `HISTORICAL_OR_DEAD` | Synthetic salvage-shell evidence is not current Package 19.13 production authority. |
| AI, analytics, snapshot, backup/restore, export, connector, and legacy recovery surfaces | `EXCLUDED_FROM_19_13` | Their presence in a shared bridge is an integrity problem to remove from Command Center access, not scope to implement or validate here. |
| Any Package 19.13 runtime or test edit | `BLOCKED_PENDING_AUTHORITY` | Requires a separate bounded Jason authorization. |

## 5. Current ownership and synchronization model

The current intended model is sound at its core:

- the main-process `ProjectSessionCoordinator` owns one canonical active
  project and its project-scoped session truth;
- Writing Studio owns author edits and sends bounded, generation-bound
  mutation requests;
- Command Center receives a `role: "command"` snapshot from the same owner;
- main publishes a separately projected snapshot to every registered window;
- generation changes distinguish project activations, revision changes order
  state updates within the active generation, and the renderer ignores older
  snapshots;
- Command Center selection requests are main-bound to project ID, canonical
  path, generation, operation ID, and valid unit ID;
- Writing Studio alone receives drafts, recovery candidates, recovery prose,
  checkpoint methods, save methods, structure methods, and close-decision
  methods through the Project Spine bridge; and
- Command Center is subordinate to Writing Studio at the window-lifecycle
  layer. A primary collapse destroys the secondary before teardown continues,
  while a lost secondary is not silently resurrected into stale authority.

This intended Project Spine model does not by itself prove Package 19.13
integrity because the shared preload exposes additional non-Project-Spine
capabilities to the same Command Center renderer.

## 6. Current Command Center projection

`CORRECTLY_PROJECTED` means the current main-owned truth is delivered and used
for its Package 19.13 purpose. Numeric/internal values do not need to be shown
verbatim when their purpose is ordering or stale rejection.

| Truth | Current receipt/display | Classification | Required disposition |
| --- | --- | --- | --- |
| Active project identity | Receives and displays project ID and title. | `CORRECTLY_PROJECTED` | Retain. |
| Canonical project path | Receives and displays the project location. | `CORRECTLY_PROJECTED` | Retain; never turn path display into broad filesystem authority. |
| Generation and revision | Receives both; renderer rejects lower generation or lower revision within the same generation. Values are not displayed. | `CORRECTLY_PROJECTED` | Retain as internal integrity metadata. Literal numeric UI is `NOT_REQUIRED_FOR_19_13`. |
| Selected unit | Receives active unit ID, marks the selected binder item, and displays the selected title. | `CORRECTLY_PROJECTED` | Retain shared navigation only. |
| Unit list and order | Receives prose-free unit metadata, renders authoritative order and display titles. | `CORRECTLY_PROJECTED` | Retain. |
| Dirty state | Receives exact dirty unit IDs and displays an authoritative dirty count. | `CORRECTLY_PROJECTED` | Retain. Per-unit dirty badges are useful but `NOT_REQUIRED_FOR_19_13` if the count and selection remain truthful. |
| Save state | Receives and displays clean, dirty, saving, saved, and save-failed state; save failure can also appear as an alert. | `CORRECTLY_PROJECTED` | Retain and cover failure transitions. |
| Raw checkpoint capture state | No authoritative current-session checkpoint-pending/protected field exists in the shared snapshot. | `NOT_REQUIRED_FOR_19_13` | Do not invent a protection claim. Raw checkpoint state and prose stay Writing Studio-only. |
| Recovery availability / decision required | Project Spine deliberately omits recovery from command snapshots and the UI displays nothing. | `NOT_PROJECTED_BUT_REQUIRED` | Add only a prose-free, non-actionable summary after the capability boundary is repaired. |
| Accepted recovery pending normal Save | Dirty/save truth reaches Command Center, but recovery provenance is not explicit. | `PROJECTED_BUT_INCOMPLETE` | Later show a prose-free “recovered work remains unsaved in Writing Studio” state; never expose content or acceptance controls. |
| Degraded recovery evidence | Writing Studio receives the degraded state; Command Center receives no recovery status. | `NOT_PROJECTED_BUT_REQUIRED` | Later show a prose-free “Writing Studio recovery needs attention” state without artifact details. |
| Project lifecycle: none/open/switch/reopen | No-project state, active identity, selection, units, and revisions synchronize automatically. | `CORRECTLY_PROJECTED` | Retain and test cross-project reset/isolation. |
| Failed/stale session state | `lastError` and save-failed state are projected, and older snapshots are rejected, but there is no explicit live “sync unavailable/stale” presentation. | `PROJECTED_BUT_INCOMPLETE` | Later add an honest unavailable/stale state only if main/preload can authoritatively distinguish it; never infer “healthy” from elapsed time. |
| Paired-window lifecycle | Main/preload bind messages to pair identity and subordinate Command Center to Writing Studio, but the Stage 19 Command UI does not consume/display ownership sync. | `PROJECTED_BUT_INCOMPLETE` | The required invariant is fail-closed pair binding and teardown, primarily automated. A visible pair-health dashboard is `NOT_REQUIRED_FOR_19_13`. |
| Recent projects | Receives recent-project references but does not render them. | `NOT_REQUIRED_FOR_19_13` | Keep non-actionable or omit from a later minimized Command contract; no recent-project mutation control. |
| Manuscript prose and recovered prose | Omitted from the Project Spine command snapshot and visible UI. | `PROJECTED_INCORRECTLY` at the whole-window boundary | The intended projection is correct, but privileged legacy globals make prose and recovery artifacts statically reachable. Process-level capability repair is blocking. |

## 7. Role capability audit

The classification below describes the whole secondary renderer boundary, not
only visible controls. `Present` means the preload installs the property on the
main-world `window`; `callable` means renderer JavaScript can invoke the exposed
function. A main rejection remains process enforcement even though the method
exists and is callable. Conversely, lack of UI usage is not enforcement.

### 7.1 Production secondary global and method inventory

| Global and exact surface | Present/callable in secondary | Main/process outcome | Classification | First-mutation disposition |
| --- | --- | --- | --- | --- |
| `projectSpine.windowRole`, `getSession`, `subscribeSession` | Present; reads/subscription callable. | Main resolves the registered `webContents` role and emits a command snapshot without drafts or recovery. | `ALLOWED_COMMAND_CENTER_READ_ONLY` | Retain. |
| `projectSpine.selectUnit` | Present and callable. | Main allows it only as project/path/generation/unit-bound shared navigation. It changes selection, not project structure, prose, recovery, or durable truth. | `ALLOWED_COMMAND_CENTER_READ_ONLY` | Retain as the sole allowed navigation action; “read-only” in this record means non-authoring/non-durable. |
| `projectSpine.chooseDirectory`, `openProject`, `createProject`, `removeRecent` | Present and callable from renderer JavaScript. | Each handler calls `requireWritingRole`; a registered Command Center sender is rejected. `openProject({ discardUnsaved: true })` therefore cannot switch or discard through this seam. | `UNREACHABLE_BY_ROLE_ENFORCEMENT` | May remain on the related Project Spine global for this first mutation because main already fails closed. Surface minimization would require a broader shared-contract decision and is not needed to close the alternate-global bypass. |
| `projectSpine.setUnitDirty`, `saveUnit`, `createUnit`, `renameUnit`, `reorderUnits`, `deleteUnit` | Absent from the command-shaped bridge. | The corresponding main handlers also require Writing Studio. | `UNREACHABLE_BY_ROLE_ENFORCEMENT` | Continue to omit. |
| `projectSpine.captureRecoveryCheckpoint`, `acceptRecoveryCandidate`, `rejectRecoveryCandidate`, `onCloseConfirmationRequest`, `respondToCloseConfirmation` | Absent from the command-shaped bridge. | Checkpoint/decision/close-response handlers require Writing Studio; close requests are not subscribed in Command Center. | `UNREACHABLE_BY_ROLE_ENFORCEMENT` | Continue to omit. |
| `splitCommand.windowRole`, `requestOwnershipSync`, `readOwnershipSync`, `subscribeOwnershipSync` | Present and callable for a valid split launch. | Main answers only for the actual primary or secondary `BrowserWindow`; preload accepts only the exact main-issued pair ID/session generation. The bridge exposes ownership state, not a mutation method. | `ALLOWED_COMMAND_CENTER_READ_ONLY` | Retain. |
| `projectLoader.openProjectDialog`, `loadProject`, `getSampleProjectPath` | Present and callable. | Legacy main handlers have no Stage 19 sender-role check. `loadProject` returns `LoadedProject.drafts`, so arbitrary selected project prose can be read. It does not activate or switch the canonical Project Spine coordinator. | `PROHIBITED_FILESYSTEM_OR_SERVICE_ACCESS` | Remove the entire `projectLoader` global from secondary. |
| `projectLoader.createProject`, `saveDraft` | Present and callable. | Legacy main handlers have no Stage 19 sender-role check. `createProject` writes a new project; `saveDraft` can write durable prose when given the canonical path, project/unit identity, and exact baseline obtainable from `loadProject`. Neither action is blocked by the Command Center role. | `PROHIBITED_MANUSCRIPT_OR_PROJECT_MUTATION` | Remove the entire `projectLoader` global from secondary. |
| `__electronApi.fs.resolvePath` | Present and callable; it performs path composition only. | No filesystem read or mutation occurs, but the method is unrelated to the minimum Command contract. | `ALLOWED_COMMAND_CENTER_READ_ONLY` | Remove the whole `__electronApi` global from secondary under the strict allowlist. |
| `__electronApi.fs.readDir`, `stat` | Present and callable; target path is renderer-supplied. | Operations execute in privileged preload with no project-root or role restriction. | `PROHIBITED_FILESYSTEM_OR_SERVICE_ACCESS` | Remove `__electronApi` from secondary. |
| `__electronApi.fs.readJson` | Present and callable; target path is renderer-supplied. | It reads arbitrary JSON in privileged preload. Given the already displayed project path and repository-defined `recovery/project-spine-recovery-v1.json` location, Package 19.12 candidate prose is statically reachable. This is a static reachability proof, not a claim that the review read an artifact. | `PROHIBITED_RECOVERY_CONTENT_OR_DECISION` | Remove `__electronApi` from secondary. |
| `services.checkHealth`, `buildOutline`, `generateDraft`, `critiqueDraft`, `rewriteDraft`, `phase4Critique`, `phase4Rewrite`, `preflightDraft`, `listBackups`, `listProjectSnapshots`, `getLastVerification`, `getBackupVerificationReport`, `getAnalyticsSummary`, `getAnalyticsScenes`, `getAnalyticsRelationships` | Present and callable. | Calls run in preload against optional service or filesystem-backed helpers without a Stage 19 secondary-role gate. This classification does not claim every optional service is running or that every response mutates state. | `PROHIBITED_FILESYSTEM_OR_SERVICE_ACCESS` | Remove `services` from secondary; do not repair or admit these optional features in 19.13. |
| `services.getRecoveryStatus`, `restoreSnapshot` | Present and callable. | These are historical service-owned recovery seams, not the accepted Package 19.12 Project Spine decision contract; they have no Command Center role gate. | `PROHIBITED_RECOVERY_CONTENT_OR_DECISION` | Remove `services` from secondary without changing Package 19.12 behavior. |
| `services.acceptDraft`, `restoreFromZip`, `restoreBackup` | Present and callable. | They issue manuscript/project acceptance or restore operations outside Project Spine sender-role enforcement. Success can depend on optional-service availability, but renderer callability is established. | `PROHIBITED_MANUSCRIPT_OR_PROJECT_MUTATION` | Remove `services` from secondary. |
| `services.createSnapshot`, `createProjectSnapshot`, `createBackup`, `exportProject`, `runBackupVerification` | Present and callable. | They issue filesystem-producing or optional-service POST operations outside the minimum Command contract. This record does not relabel export or verification as manuscript mutation. | `PROHIBITED_FILESYSTEM_OR_SERVICE_ACCESS` | Remove `services` from secondary. |
| `services.revealPath` | Present and callable with renderer-supplied path. | Privileged preload stats the path and calls `shell.openPath`; there is no secondary-role gate. | `PROHIBITED_FILESYSTEM_OR_SERVICE_ACCESS` | Remove `services` from secondary. |
| `diagnostics.openDiagnosticsFolder` | Present and callable. | Main opens the diagnostics directory without checking the Stage 19 sender role. | `PROHIBITED_FILESYSTEM_OR_SERVICE_ACCESS` | Remove `diagnostics` from secondary. |
| `layout.loadLayout`, `saveLayout`, `resetLayout`, `openFloatingPane`, `closeFloatingPane`, `listFloatingPanes` | Present and callable. | These invoke shared layout/floating-window handlers, including persistent and path-bound presentation operations, without a Package 19.13 role allowlist. They are not manuscript mutation, but they are outside the minimum Command contract. | `PROHIBITED_FILESYSTEM_OR_SERVICE_ACCESS` | Remove `layout` from secondary; any later Command-local presentation capability needs a separate bounded proof. |
| `runtimeConfig` | Present as read-only configuration data, including service, budget, analytics, and UI configuration. | No callable mutation method is exposed by this object. It is unrelated to the minimum dedicated Command surface. | `ALLOWED_COMMAND_CENTER_READ_ONLY` | Remove from secondary under the strict two-global allowlist; removal is least-authority minimization, not correction of a mutation exploit. |
| `__phase4MockFlowEnabled`, `__testEnv` | Always present as booleans/read-only metadata. | No project, prose, recovery, filesystem, or service operation is exposed. | `ALLOWED_COMMAND_CENTER_READ_ONLY` | Remove from the production secondary because they are unrelated to the two-global contract. |

Direct assignments made by preload code to its isolated-world `window` are not
counted as main-world globals unless passed through `contextBridge`.

### 7.2 Harness-conditional secondary globals

When `PLAYWRIGHT=1` or harness hooks are enabled, the same secondary preload
also attempts to expose the following. They are not production capabilities,
but the strict allowlist must prevent them from becoming a secondary escape
hatch in integration evidence.

| Global and exact surface | Present/callable in harness secondary | Classification | First-mutation disposition |
| --- | --- | --- | --- |
| `__test.markBoot` | Present and callable; console marker only. | `ALLOWED_COMMAND_CENTER_READ_ONLY` | Omit from secondary. |
| `testMode.getMode`, `isFlat`, `isRecovery`, `isFull`, `getOfflineReason`, `debug` | Present and callable; reads/logs harness mode state. | `ALLOWED_COMMAND_CENTER_READ_ONLY` | Omit from secondary. |
| `__testInsights.setServiceStatus`, `selectScene` | Present and callable; dispatches harness-only UI events. Its effect is not part of the dedicated Stage 19 authority contract. | `UNKNOWN` | Omit from secondary rather than admit a test-only control. |
| `__dev.setProjectDir`, `selectScene`, `setStartupConfig` | Present and callable at exposure time; dispatches legacy/harness project, selection, and startup events rather than using the Project Spine role contract. Exact effect in the dedicated Command renderer is not established by the inspected focused test. | `UNKNOWN` | Omit the entire `__dev` global from secondary. |
| Late assignments of `__dev.setProjectDir` to invoke `setDevProjectPath` and `__dev.overrideServices` | Preload mutates the source `devApi` object after calling `contextBridge.exposeInMainWorld`. Whether those replacement/additional properties become visible through Electron's already-exposed proxy is not proved by the inspected focused test. | `UNKNOWN` | Omit `__dev` before this distinction matters; no additional production file is required. |

### 7.3 Requested capability disposition

| Requested capability | Exact result |
| --- | --- |
| Manuscript prose reads | Prohibited but reachable through callable `projectLoader.loadProject`; not reachable through the command Project Spine snapshot. |
| Recovered prose/artifact reads | Prohibited but statically reachable through callable `__electronApi.fs.readJson`; not reachable through command Project Spine. |
| Durable Save | Prohibited but callable through `projectLoader.saveDraft`; `projectSpine.saveUnit` is absent and its main handler is Writing-only. |
| Canonical Project Spine create/open/switch/discard | Related methods exist and are callable, but main rejects the registered Command sender: `UNREACHABLE_BY_ROLE_ENFORCEMENT`. Legacy `projectLoader.createProject` can create on disk but does not activate/switch the coordinator. |
| Unit create/rename/reorder/delete | Methods are absent from command Project Spine and main is Writing-only: `UNREACHABLE_BY_ROLE_ENFORCEMENT`. No exact legacy unit-operation method was found. Broader service project actions remain prohibited. |
| Checkpoint capture | Absent from command Project Spine and main is Writing-only: `UNREACHABLE_BY_ROLE_ENFORCEMENT`. |
| Package 19.12 recovery accept/reject | Absent from command Project Spine and main is Writing-only: `UNREACHABLE_BY_ROLE_ENFORCEMENT`. Historical `services.restoreSnapshot` is separately prohibited and is not reclassified as Package 19.12 acceptance. |
| Close/discard decisions | Close request/response methods are absent; main accepts responses only from Writing Studio. `openProject(discardUnsaved)` is callable but main-rejected. |
| Filesystem paths/generic methods | The canonical active-project path is an allowed read-only Project Spine status field. Generic path inspection/opening/persistence is prohibited and callable through `__electronApi`, project loader, diagnostics, `services.revealPath`, and layout seams. |
| Optional services | Prohibited and callable when exposed; actual service success remains environment-dependent. |
| Historical/legacy mutation APIs | Prohibited and callable through project loader and service bridges; the dedicated Command UI simply does not use them. |

### 7.4 Enforcement conclusion

Current Project Spine IPC enforcement is process-level for its own methods:
main resolves the sender role and `requireWritingRole` rejects Command Center
mutation requests. Visible UI restrictions and optional-method omission add
defense in depth.

The whole Command Center is not yet process-level non-mutating because its
preload gives the renderer alternative privileged routes whose main/service
handlers do not apply the Project Spine sender-role check. The defect is
therefore confirmed for `projectLoader`, `services`, `__electronApi`, and the
other unrelated globals identified above. It is not confirmed for canonical
Project Spine create/open/switch/discard or Writing-only Project Spine methods,
which already fail closed by registered sender role. Current tests prove a
passive Project Spine surface, not the whole-window Package 19.13 exit gate.

`app/renderer/index.tsx` chooses which React surface to render from the
read-only `window.splitCommand.windowRole`, but that renderer presentation
choice grants no authority. The preload capability role comes from main-issued
`additionalArguments`, while Project Spine main enforcement independently
comes from the actual registered `webContents` ID. The first mutation must
preserve that separation and must not consult renderer-controlled state.

The Command branch of `Stage19WritingSpineApp.tsx` uses session reads,
subscription, and `selectUnit`; it does not call project loader, services,
filesystem, diagnostics, layout, Save, structure, checkpoint, recovery, or
close-decision methods. That is UI non-use only. The callable global inventory
above, not the rendered buttons, determines the capability defect.

## 8. Confirmed Package 19.13 contract and safety boundary

| Contract item | Disposition | Boundary |
| --- | --- | --- |
| One canonical session owner | `CONFIRMED` | Main-process coordinator remains the sole source of shared project/session truth. |
| Project-scoped binding | `CONFIRMED` | Identity, canonical path, generation, revision, operation ID, and unit validation remain mandatory. |
| Non-mutating Command Center | `CONFIRMED` | Command Center may observe status and select navigation only. It may never change durable prose, dirty buffers, project structure, project lifecycle, recovery evidence/decisions, or shared author decisions. |
| Prose-free projection | `CONFIRMED` | No manuscript draft, recovered prose, checkpoint payload, diff, baseline, or recovery artifact content may cross into Command Center. |
| Navigation selection | `CONFIRMED` | Selecting an existing unit is allowed as synchronized navigation, provided main validates the current binding and the action cannot mutate manuscript/project truth. |
| Save truth | `CONFIRMED` | Command Center displays coordinator-owned dirty/save state and never originates Save. |
| Recovery interaction with Package 19.12 | `CONFIRMED` | Package 19.13 may display only a derived status. Acceptance, rejection, cleanup, checkpointing, and prose application remain closed Package 19.12 behavior owned by Writing Studio/main. |
| Command recovery summary | `PROPOSED` | Add a command-only, prose-free summary with status `none`, `decision-required`, `accepted-pending-save`, or `degraded`, plus at most an affected-unit count and stable non-content reason code. No candidate IDs, titles beyond already-authorized binder metadata, timestamps, baselines, fingerprints, paths beyond the already-projected project path, or prose. |
| Honest lifecycle failure | `PROPOSED` | Show syncing/unavailable/stale only from authoritative main/preload evidence. Keep the last known project visually marked stale or unavailable; never report current/healthy by assumption. |
| Per-unit dirty decoration | `DEFER` | Useful but not required if authoritative dirty count, selected unit, and save state remain clear. Reopen within 19.13 only if manual acceptance finds the aggregate status misleading. |
| Numeric generation/revision UI | `DEFER` | Internal enforcement remains required; literal numbers are developer metadata, not a V1 author-facing requirement. |
| Recent-project controls | `DEFER` | No Package 19.13 need; mutation stays Writing Studio-only. |
| Broad local presentation/layout capability | `DEFER` | Admit only after a separately bounded role/ownership proof if Command Center actually needs it. |
| Privileged preload bypass | `BLOCKING` | Must be removed before any projection expansion can count as integrity. |
| Process-level negative proof | `BLOCKING` | Package 19.13 cannot close on hidden controls alone; unit and Electron evidence must prove forbidden globals/content/mutations are unavailable. |

## 9. Gaps found

### 9.1 Blocking: shared preload defeats least authority

`app/main/preload.ts` determines the secondary role correctly and constructs a
restricted `projectSpine` bridge, but later exposes the same broad globals to
both windows:

- `__electronApi` with filesystem reads;
- `projectLoader` with load/create/save operations;
- `services` with project-affecting, recovery-era, backup/restore, export, AI,
  and analysis operations;
- `diagnostics` with filesystem-opening behavior;
- `layout` with persistent/floating presentation operations; and
- `runtimeConfig` plus test/harness globals.

The material first-order bypasses are `__electronApi`, `projectLoader`, and
`services`: together they make manuscript prose, the JSON recovery artifact,
durable save, project creation/restore, and other project actions reachable
outside Project Spine role enforcement. This is a Package 19.13 closure
blocker. It does not reopen Package 19.12; it is precisely the cross-surface
integrity work reserved for Package 19.13.

### 9.2 Required later projection: recovery status without recovery content

Current Command Center correctly stays passive during Package 19.12 recovery,
but total silence can make its status dishonest: after restart it can show a
project as clean while Writing Studio is blocked on a recovery decision, and
after acceptance it shows dirty state without explaining that recovered work
still needs normal Save. Concretely, `installRecoveryState` advances revision
without changing `saveState`; immediately after project activation that state
remains clean for `decision-required` or `degraded`, while the current Command
label renders a clean active project as `Saved durably` even though coordinator
mutation is blocked pending Writing Studio recovery. That
repository evidence supports a prose-free blocked/attention summary after the
capability boundary is closed. Recovery provenance for an already-truthful
dirty count remains `PROPOSED`, and the exact later summary schema remains a
separately authorized mutation rather than part of the preload correction.

### 9.3 Required later proof: stale/failure and pair lifecycle

Generation/revision rejection and main-owned pair teardown exist, but the
accepted evidence must prove:

- Project A status cannot survive a switch to Project B;
- an older same-generation revision cannot overwrite a newer Command view;
- a stale pair message cannot bind to a new pair;
- Command Center cannot outlive primary collapse as an authoritative orphan;
- secondary loss does not silently create another Command Center; and
- transport/session failure is presented honestly if a live Command window
  can remain visible.

## 10. First bounded implementation mutation

### 10.1 Recommendation

Recommend exactly one first runtime mutation: **make the secondary Command
Center preload a strict role allowlist**.

### 10.2 Exact behavior

When the validated split-command launch role is `secondary`:

1. expose only the command-shaped `projectSpine` bridge and matching-pair
   `splitCommand` ownership-sync bridge to application renderer code;
2. do not expose `__electronApi`, `projectLoader`, `services`, `diagnostics`,
   `layout`, `runtimeConfig`, `__phase4MockFlowEnabled`, `__testEnv`, or any
   harness/test/dev bridge to that renderer;
3. preserve current stable/single-window and primary Writing Studio exposure
   unchanged;
4. preserve the current command `projectSpine` global: `getSession`,
   `subscribeSession`, and main-validated `selectUnit` remain effective;
   Writing-only methods remain absent; and base lifecycle methods may remain
   present because main already rejects them by registered sender role;
5. derive the allowlist decision only from the validated preload
   `process.argv` launch context supplied through the main-created
   BrowserWindow's `additionalArguments`, never from DOM, URL/query, storage,
   or another renderer-controlled value; and
6. fail closed if secondary role parsing is valid but a proposed exposure is
   not explicitly on the Command allowlist.

Playwright can identify the existing `data-stage19-role="command"` DOM surface
from outside the renderer; no secondary main-world harness global is required
for this first mutation.

This allowlist is a renderer-process capability boundary, not a visual-control
rule: the current Command BrowserWindow has `contextIsolation: true` and
`nodeIntegration: false`, and the main world is not given raw `ipcRenderer`,
`require`, `process`, Node filesystem, or shell objects. `sandbox: false` means
the privileged preload itself remains sensitive, so the allowlist and its
tests must cover every exposure site in that preload. Package 19.16 retains the
broader Electron security audit; that later audit does not excuse this bounded
19.13 correction.

### 10.3 Exact seam and files

Runtime seam:

- `app/main/preload.ts`

Focused automated seam:

- `app/main/__tests__/splitCommandPreload.test.ts`

No other runtime or test file is part of the recommended first mutation. If
implementation discovers that the allowlist cannot be proved within those two
files, stop and return for a revised bounded authorization rather than widening
scope.

`app/main/__tests__/splitCommandSecondaryLaunchHook.test.ts` already proves
that main creates the secondary BrowserWindow with the secondary role and pair
identity in `webPreferences.additionalArguments`; it is inspection evidence,
not a required edit. `app/main/main.ts`, `app/shared/ipc/projectSpine.ts`, and
`app/main/projectSpineIpc.ts` likewise require no first-mutation change because
main already registers the actual secondary `webContents` as `command` and
rejects Project Spine lifecycle/authoring methods by that registration.

### 10.4 Required focused tests

The focused test change should prove:

1. secondary exposes exactly `projectSpine` and `splitCommand` through
   `contextBridge`, with the expected roles;
2. secondary does not expose `__electronApi`, `projectLoader`, `services`,
   `diagnostics`, `layout`, `runtimeConfig`, `__phase4MockFlowEnabled`,
   `__testEnv`, `__test`, `__dev`, `__testInsights`, or `testMode`;
3. secondary Project Spine continues to omit Save, dirty/checkpoint,
   accept/reject, close-response, and structure-mutation methods;
4. the test records that base choose/open/create/remove call sites still exist
   on the command bridge; the already-inspected Project Spine IPC evidence,
   rather than UI absence, remains the proof that main rejects them;
5. primary Writing Studio retains its currently required bridges and methods;
6. the stable non-split path is unchanged;
7. invalid/mismatched pair messages remain rejected;
8. the allowlist role is derived from the validated main-supplied launch
   context, not a renderer-controlled value; and
9. the command main world receives no raw `ipcRenderer`, `require`, `process`,
   Node filesystem, or shell object through the preload.

### 10.5 Explicit exclusions from the first mutation

The first mutation must not:

- add the prose-free recovery summary;
- change coordinator or shared snapshot schemas;
- alter Command Center React UI;
- alter Project Spine IPC handlers;
- change project-loader/service behavior for Writing Studio;
- implement new layout, diagnostics, AI, analytics, backup, restore, export, or
  connector behavior;
- change window creation, placement, teardown, or resurrection behavior;
- modify dependencies, manifests, lockfiles, packaging, or documentation other
  than its separately authorized evidence receipt; or
- begin Package 19.14.

### 10.6 Success criteria and why this is smallest

Success is a focused test proof that Command Center application code has only
the two explicitly allowed bridges, while Writing Studio and the stable path
retain current behavior. No new status field or UI is required for this first
step.

This is the smallest safe first mutation because it closes known alternate
privileged routes at the existing preload boundary without moving ownership,
changing persistence, reopening recovery behavior, or designing UI. Adding a
recovery status first would make the visible projection more informative while
leaving prose and mutation bypasses reachable, so it could not establish
integrity.

## 11. Evidence plan for Package 19.13

### 11.1 Focused unit/component evidence

- preload exposure allowlist by validated role;
- Project Spine command bridge shape and main role rejection;
- command snapshot contains project metadata but no drafts, recovery
  candidates, prose, baselines, or artifact details;
- generation/revision stale rejection;
- project switch clears old identity, selection, units, dirty/save, recovery
  summary, and errors as defined by the new generation;
- binder order, selection, dirty count, clean/dirty/saving/saved/save-failed
  display;
- later prose-free recovery-summary mapping and rendering; and
- no Command buttons, keyboard routes, or callbacks for Save, discard,
  checkpoint, recovery decisions, or unit structure mutation.

### 11.2 IPC/process-boundary evidence

- main rejects all Project Spine Writing-only handlers from Command web
  contents even if invoked outside the typed bridge;
- no alternate renderer global exposes project load/save, arbitrary recovery
  artifact reads, services, restore, backup, export, or mutation authority;
- selection validates exact project ID/path/generation/unit and rejects stale
  or cross-project requests;
- safe recovery summary derives from current coordinator truth and contains no
  recovery candidate content; and
- pair messages bind to exact pair identity/session generation.

### 11.3 Electron integration evidence

Use generated temporary projects only. Required proof should cover:

1. Writing Studio creates Project A with ordered units; Command Center shows
   the same identity/path/order/selection and no prose.
2. Editing and saving in Writing Studio drives truthful Command dirty, saving,
   saved, and failed transitions without a Command mutation path.
3. Command navigation changes the selected unit in both windows but cannot
   edit, save, create, rename, reorder, delete, discard, or decide recovery.
4. Project A to Project B switch/reopen leaves no Project A identity, units,
   dirty state, recovery summary, or errors in the Command view.
5. Recovery decision-required, accepted-pending-save, rejected/none, and
   degraded states project only the approved safe summary; candidate prose and
   controls remain Writing Studio-only.
6. In-page capability inspection confirms forbidden globals are absent from
   the production-like secondary renderer.
7. Primary collapse removes Command Center without an authoritative orphan;
   secondary loss does not silently respawn stale state.
8. Clean shutdown leaves no orphan Electron process.

### 11.4 Manual acceptance evidence

Jason should manually verify only author-facing Package 19.13 claims:

- both windows show the same active project, selected unit, order, and
  dirty/save truth during a real writing sequence;
- Command Center is useful as navigation/status but offers no author-content,
  project, Save, discard, or recovery decision action;
- recovery status is understandable without exposing recovered prose;
- switching between two disposable projects leaves no stale/cross-project
  Command state; and
- a failure/unavailable state is honest and does not claim saved/healthy.

Manual acceptance must not be represented as process-level capability proof;
the negative bridge and sender-role claims are automated/static evidence.

### 11.5 Build and repository evidence

For each separately authorized implementation mutation, run the focused tests
first, then the accumulated Package 19.13 focused set. Before Package closure,
run main, renderer, and production builds; combined Package 19.12/19.13
Electron integration; `git diff --check`; an explicit whitespace check for any
new untracked record; and final status/ahead-behind verification. Record
warnings and non-accepted diagnostic runs without converting them into passed
evidence.

## 12. Shared Package 19.12/19.13 integration boundary

Package 19.13 must integrate with the closed Package 19.12 behavior because
recovery changes dirty/save/status truth visible across both windows. The
shared matrix should prove:

- recovery candidates and prose appear only in Writing Studio;
- Command Center receives no checkpoint/recovery mutation method and no raw
  recovery artifact access;
- decision-required and degraded states produce only the approved prose-free
  Command status;
- accepted recovery becomes dirty local Writing Studio content and is
  represented as unsaved in Command Center until normal Save;
- rejection returns Command recovery status to none without altering the
  durable baseline;
- save/reopen clears recovery status consistently; and
- Project A recovery state never appears in Project B Command projection.

This is integration evidence between separately governed packages. It does not
move recovery decisions into Package 19.13, revise Package 19.12 acceptance,
or combine their authorization and closure records.

Package 19.12 remains closed. Shared integration testing does not reopen or combine Package 19.12 and Package 19.13 authority or closure.

## 13. Ecosystem hostile review

The inspection searched the connected preload, IPC, main-window, renderer,
legacy loader/service, older Command workspace, synthetic salvage shell, and
focused/Electron test paths. The following hostile-review conclusions control:

- hidden buttons are not accepted as non-mutation proof;
- Project Spine method omission is not accepted while alternate privileged
  globals remain reachable;
- the current recovery UI test proves passivity, not raw artifact
  inaccessibility;
- no recovered prose, candidate object, baseline fingerprint, or recovery
  decision may enter Command Center merely to make status convenient;
- no broad service bridge may be relabeled “read-only” when it contains Save,
  accept, restore, backup, export, AI, or project-affecting calls;
- older `SplitCommandWorkspace`, legacy `App`, and synthetic salvage shell
  paths cannot displace the dedicated Stage 19 production authority;
- Package 19.12 is not reopened by discovering a cross-surface access defect
  in the next package;
- Package 19.13 does not authorize Package 19.14 optional AI work;
- no connector is admitted and no deferred connector stage is altered;
- no claim is made about packaged installation, release candidate, full
  history, general backup/restore, same-main renderer restoration, Stage 19
  closure, or V1.0 completion; and
- the approved 19.13 through 19.22 sequence remains unchanged.

## 14. Explicit exclusions

Package 19.13 does not include:

- manuscript editing or prose display in Command Center;
- recovered prose, recovery candidate details, checkpoint capture, acceptance,
  rejection, cleanup, or recovery artifact management in Command Center;
- Project create/open/remove-recent/discard, Save, unit create/rename/reorder/
  delete, or durable mutation from Command Center;
- general history, version browser, diff/merge, backup, restore, repair, import,
  migration, or compatibility expansion;
- AI generation, critique, rewrite, acceptance, analytics, budget, routing, or
  model/provider work;
- export, connectors, cloud, collaboration, or synchronization;
- advanced dock/float/multi-monitor restoration;
- accessibility/performance/security audits beyond defects necessary to prove
  this bounded role boundary; those broad audits remain Package 19.16;
- dependency, manifest, lockfile, installer, packaging, updater, version, tag,
  release, or CI expansion;
- protected evidence;
- Package 19.14 through 19.22 implementation;
- Stage 19 closure; or
- V1.0 completion or release.

Every later deferral retains its master-plan resolution stage. Reopen a
deferred item inside 19.13 only if focused or manual evidence proves the
truthful, non-mutating, project-scoped exit gate cannot be met without it.

## 15. Authorization statement

This record does not authorize Package 19.13 runtime or test mutation. Each implementation mutation requires separate Jason authorization.

This record authorizes no branch change, commit, push, Package 19.14 work,
Stage 19 closure, or V1.0 release claim. The recommended first mutation remains
`BLOCKED_PENDING_AUTHORITY` until Jason separately authorizes that exact seam,
behavior, files, tests, exclusions, and success criteria.
