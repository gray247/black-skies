# Stage 19 Package 19.12 Scope and Inspection

Status: scope-and-inspection record only

Package: 19.12 — history/recovery/interruption safety

Repository state inspected: `0ad5768d76cb69635fe1b88e4cb91d1b6d1df7f0` on `salvage/minimal-two-surface-shell`

Authority synchronization: `0ad5768 docs(product): synchronize Stage 19 current authority`

This scope-and-inspection record does not authorize Package 19.12 runtime mutation.

## 1. Purpose and planning opinion

Package 19.12 must establish the minimum trustworthy V1 recovery floor for interrupted unsaved writing without creating a second Project Spine, weakening durable-save authority, or expanding into general history, backup, restore, or version control.

The proposed combined 19.12–19.13 orchestrator horizon is sound with one control: the packages may be planned together, but they must be authorized, implemented, verified, and closed sequentially. Package 19.12 must first establish recovery authority and its read-only projection data. Package 19.13 may then prove that Command Center reports that authority honestly while retaining no mutation capability. A shared integration pass after both individual closures is appropriate. Implementing the two packages as one mutation would violate the one-package-at-a-time rule and would make recovery ownership harder to prove.

The horizon should stop after 19.12 if recovery ownership, last-durable-save protection, cross-project isolation, or interruption evidence remains unresolved. It should stop after 19.13 if Command Center cannot remain projection-only. No Package 19.14 scope should be pulled forward.

## 2. Repository gate

The scope pass began from a clean, synchronized repository:

- branch: `salvage/minimal-two-surface-shell`;
- HEAD: `0ad5768d76cb69635fe1b88e4cb91d1b6d1df7f0`;
- upstream: `0ad5768d76cb69635fe1b88e4cb91d1b6d1df7f0`;
- ahead/behind: `0/0`;
- worktree: clean before this record was created;
- Stage 19 authority synchronization: present at HEAD;
- accepted implementation closure immediately below HEAD: `d780f52 docs(product): close Stage 19 packages 19.9 through 19.11` and `ff2e5d1 feat(stage19): complete project lifecycle save and close spine`.

The gate therefore permitted read-only inspection and creation of this single planning record.

## 3. Authority inspected

### 3.1 Controlling current authority

The following current-authority records were inspected first:

- `docs/product_systems/current_truth_index.md`;
- `docs/product_systems/current_product_roadmap.md`;
- `docs/product_systems/stage19_v1_master_implementation_and_acceptance_plan.md`;
- `docs/product_systems/stage19_v1_scope_lock.md`;
- `docs/product_systems/stage19_v1_salvage_traceability_matrix.md`;
- `docs/product_systems/stage19_packages_19_9_through_19_11_closure.md`;
- `docs/product_systems/stage19_v1_authority_alignment_decision.md`.

Together they establish that Stage 19 remains open; Package 19.12 is titled `history/recovery/interruption safety`; it depends on the accepted 19.10–19.11 Project Spine; and its exit gate is accepted project-scoped recovery accept/reject behavior. They also establish the minimum safety rule: interruption recovery must not silently replace the last durable save and must remain isolated to the originating project. Full backup and history beyond the minimum recovery floor are not mandatory Package 19.12 work.

### 3.2 Directly relevant doctrine and prior evidence

The inspection also covered the directly relevant records for persistence, save truth, snapshots, recovery, restore, and prior exclusion boundaries:

- `docs/product_systems/project_persistence_local_save.md`;
- `docs/product_systems/save_state_and_degraded_writing_workflow.md`;
- `docs/product_systems/snapshots_backup_restore_history.md`;
- `docs/product_systems/snapshot_protected_recovery_contract.md`;
- `docs/product_systems/stage18_restore_import_exclusion_confirmation.md`;
- `docs/product_systems/workflow_proof_WP-09_restore_copy_reentry.md`.

These records reinforce that save confirmation and recovery availability are distinct truths; recovery cannot be presented as a successful save; destructive replacement requires explicit approval; inspection should be non-mutating; partial, corrupt, unavailable, and failed states must be reported honestly; and Command Center may surface status but cannot own recovery truth. WP-09 is workflow doctrine, not proof of the current Package 19.12 implementation or storage model.

## 4. Current accepted baseline

The accepted Project Spine provides one active project session with durable project identity and canonical path, a session generation, monotonically updated revision, an active unit, dirty-unit IDs, typed save state, and role-specific Writing Studio and Command Center projections. Writing Studio owns prose buffers and mutation controls. Main owns the active session, validates project/session bindings, performs durable mutations, and publishes snapshots. Command Center remains read-only.

Durable project loading and structural repository functions are exported by `app/main/projectSpineIpc.ts`. There is no production file named `app/main/projectSpineRepository.ts` at the inspected revision. The focused file `app/main/__tests__/projectSpineRepository.test.ts` imports repository functions from `projectSpineIpc.ts`; its name describes the tested concern rather than a corresponding production module. This is an inventory fact, not authority to refactor existing code.

`app/main/projectSpineIpc.ts` already contains a useful atomic-write pattern: write a uniquely named temporary file exclusively, sync it, close it, and rename it to the target, with bounded temporary-file cleanup on failure. That implementation is accepted evidence for a local atomic persistence technique. It is not itself a recovery implementation.

`app/renderer/Stage19WritingSpineApp.tsx` holds per-unit local prose buffers in renderer memory. A unit is locally dirty when its buffer differs from the durable draft in the latest accepted snapshot. Snapshot application preserves a newer local edit, handles empty-string content as real content, rejects older generation/revision snapshots, and clears prior-session buffer state on generation change. Save completion reconciles only the content version submitted; a newer edit remains dirty. These are the accepted data-ordering rules a recovery design must preserve.

The current close workflow protects ordinary guarded close through a correlated renderer decision and coordinated main-process shutdown. It does not persist renderer buffers for abnormal renderer termination, main-process termination, or machine interruption. The shared Project Spine contract contains no recovery channel, recovery candidate, recovery state, accept command, or reject command. Therefore Package 19.12 production recovery is not implemented.

## 5. Historical and disconnected inventory

The repository contains recovery, snapshot, and restore code predating the accepted dedicated Project Spine:

- `app/renderer/hooks/useRecovery.ts`;
- `app/renderer/components/RecoveryBanner.tsx`;
- `app/renderer/recovery/actions.mjs` and `actions.d.ts`;
- `app/renderer/components/SnapshotsPanel.tsx`;
- `app/renderer/utils/snapshotReader.ts`;
- recovery and snapshot types in `app/shared/ipc/services.ts`;
- service bridge calls in `app/main/preload.ts` for `draft/recovery`, `draft/recovery/restore`, and snapshot endpoints;
- legacy recovery wiring in the prior renderer application path and test/harness recovery modes;
- `services/src/blackskies/services/routers/recovery.py` and the service-owned recovery tracker;
- renderer, service, and E2E tests covering those older surfaces.

This inventory is not accepted Package 19.12 authority. The current service recovery path depends on optional service availability and a `ProjectSummary`, uses a service-owned project base directory, and tracks an AI/draft accept-in-progress workflow. Its restore operation is represented as replacing current project files. `RecoveryBanner` likewise describes replacing current project files. That behavior conflicts with the Package 19.12 contract fixed below: last durable content remains protected until explicit recovery acceptance, and acceptance first creates dirty local truth before a separate normal save.

Snapshot verification and ZIP backup/restore flows address broader artifact management. They neither persist the accepted Writing Studio's local prose buffers nor prove current project/generation isolation. Synthetic harness recovery flags prove test presentation paths only. None may be connected to the accepted Project Spine merely because its name includes recovery or snapshots.

## 6. Classification table

| Classification | Files or seams | Evidence and consequence |
| --- | --- | --- |
| `CURRENT_PRODUCTION_AUTHORITY` | `app/main/main.ts`; `app/main/projectSessionCoordinator.ts`; `app/main/projectSpineIpc.ts`; `app/main/closeConfirmationCoordinator.ts`; the Project Spine section of `app/main/preload.ts`; `app/shared/ipc/projectSpine.ts`; `app/renderer/Stage19WritingSpineApp.tsx`; focused Stage 19 Project Spine, close, and renderer tests | These implement and verify the accepted project identity, generation/revision, durable save, dirty-state, role projection, close, and shutdown authority on which 19.12 depends. They contain no current recovery contract. |
| `REUSE_AS_IS` | Typed `ProjectSpineResult` envelopes and request-binding conventions; durable project ID/path validation; role-scoped preload capability; generation/revision snapshot ordering; exact-submitted-content save reconciliation | These are accepted invariants. New recovery behavior must use them rather than creating a parallel result, identity, or ordering system. |
| `REUSE_WITH_REPAIR` | The atomic temporary-write/sync/rename technique in `projectSpineIpc.ts` | The technique is suitable for a recovery sidecar, but recovery needs its own schema, validation, path, typed failure behavior, and tests. Existing project mutations must not be repurposed as recovery writes. |
| `REFERENCE_ONLY` | `useRecovery.ts`; `RecoveryBanner.tsx`; renderer recovery actions; `SnapshotsPanel.tsx`; `snapshotReader.ts`; service recovery/snapshot bridge types and calls; Python recovery router/tracker; associated tests; WP-09 | These provide prior language, failure cases, accessibility ideas, and test scenarios. They are disconnected from the accepted Project Spine or implement different semantics and cannot be adopted as authority without a later explicit decision. |
| `HISTORICAL_OR_DEAD` | Old application recovery wiring, service-dependent recovery modes, and synthetic harness flags relative to the dedicated Stage 19 Writing Spine path | They do not persist or restore the accepted Writing Studio's current per-unit buffers. Harness flags are not production detection evidence. |
| `EXCLUDED_FROM_19_12` | ZIP backup/restore, restore-as-copy, general snapshots/history browser, Gray Skies import, migration, automatic rollback, cloud sync, AI-accept recovery, advanced integrity repair | These exceed the minimum interruption-recovery exit gate or belong to separately governed workflows. |
| `BLOCKED_PENDING_AUTHORITY` | Structural recovery; destructive restore-as-current; retention/pruning policy; multi-source history and diff; full-project rollback | Current authority does not require or define these for 19.12. They must not enter the first mutation through implementation convenience. |

## 7. Fixed Package 19.12 boundary and contract answers

The repository establishes the accepted Project Spine constraints. This scope record fixes the following bounded V1 contract for later implementation authorization; it does not itself authorize implementation.

| # | Contract question | Status | Answer |
| --- | --- | --- | --- |
| 1 | Exact V1 recoverable state | `FIXED_FOR_19_12` | Unsaved prose buffers for existing manuscript units, including an empty string as valid content. Recovery does not include manuscript structure, unit creation/deletion/reordering, project metadata, full history, or arbitrary file replacement. |
| 2 | Per unit or whole project | `FIXED_FOR_19_12` | Store one main-owned project recovery envelope containing zero or more independently validated per-unit prose candidates. |
| 3 | Structural changes | `DEFER_TO_LATER_PACKAGE` | Exclude from the minimum unless new evidence proves a locally buffered structural state exists. Current Stage 19 structural commands are durable main mutations. |
| 4 | Recovery persistence owner | `FIXED_FOR_19_12` | Main-owned Project Spine recovery repository. Renderer supplies bounded prose checkpoints; it does not own durable recovery storage. The older service must not become a second authority. |
| 5 | Recovery detection owner | `FIXED_FOR_19_12` | Main detects and validates a project-scoped artifact during authoritative project open, after durable identity/path are known and before offering it to Writing Studio. |
| 6 | Who presents choices | `CONFIRMED` | Writing Studio may present the author's recovery choice. Command Center may later display read-only status only. |
| 7 | Who accepts or rejects | `CONFIRMED` | The author acts through Writing Studio; main validates and performs the accepted Project Spine command. Command Center must not receive accept/reject methods. |
| 8 | Accepted state local or durable | `FIXED_FOR_19_12` | Acceptance loads recovered prose into the current Writing Studio buffers as dirty local truth. A separate normal Save is the only path that makes it durable. |
| 9 | Last durable save protection | `CONFIRMED` / `FIXED_FOR_19_12` | Detection, presentation, acceptance, and rejection must not silently overwrite durable manuscript files. Acceptance does not write drafts; rejection removes or invalidates only the exact recovery candidate. |
| 10 | Project identity binding | `FIXED_FOR_19_12` | Bind each envelope and candidate to the durable project ID and normalized canonical project path or path fingerprint; require both to match the opened project. |
| 11 | Generation and revision binding | `FIXED_FOR_19_12` | Prior-session generation and revision are provenance only. A restart receives a fresh active generation; a candidate never regains active mutation authority. Main validates candidate identity, path, unit, durable-baseline fingerprint, schema/version, and candidate version. Active accept/reject requests use the current Project Spine generation. |
| 12 | Stale artifact rejection | `FIXED_FOR_19_12` | Reject application when the candidate is active-session rather than completed-prior-session evidence, project/path differs, schema is unsupported, the unit no longer exists, the durable baseline fingerprint differs, or a newer candidate version supersedes it. A rejected artifact must never be applied or claim recovery success. |
| 13 | Another active project | `CONFIRMED` | Do not surface or apply Project A recovery while Project B is active. Switching projects must clear renderer presentation of the prior candidate while leaving correctly scoped durable evidence intact. |
| 14 | Save in flight | `FIXED_FOR_19_12` | Associate a checkpoint with the submitted buffer/baseline. A successful save may retire only the candidate corresponding to the saved content. If the buffer changed after submission, its newer candidate remains dirty and recoverable. Failed or interrupted save must not erase recovery evidence. |
| 15 | V1 interruption | `FIXED_FOR_19_12` | Cover abnormal renderer loss, app/process termination, and restart with an incomplete save/checkpoint. Treat power loss as an atomic-persistence approximation, not an absolute hardware guarantee. Ordinary guarded close remains the accepted close workflow rather than a recovery trigger. |
| 16 | Persistence failure | `FIXED_FOR_19_12` | Never claim protection or success. Preserve the live local dirty buffer and durable manuscript. Surface writer-facing degraded guidance that recovery protection is unavailable and saving should be retried. |
| 17 | Corrupt or partial artifact | `FIXED_FOR_19_12` | Never apply it or alter durable drafts. Return an honest typed state and leave candidate lifecycle to explicit invalidation/removal rules; do not silently repair it or claim recovery success. |
| 18 | Exact 19.12 behavior | `CONFIRMED` | Project-scoped persistence and detection of minimum interrupted unsaved work, explicit accept/reject in Writing Studio, stale/cross-project rejection, failure preservation, and interruption evidence through durable reopen. |
| 19 | Later integrity behavior | `DEFER_TO_LATER_PACKAGE` | Package 19.13 owns proof of read-only Command Center projection. General history, diff, backup, restore, retention, and integrity repair require later authority. |
| 20 | Explicit exclusions | `CONFIRMED` | Full backup management, history browser, snapshot diff UI, cloud sync, Gray Skies import, migration framework, automatic rollback, version control, advanced integrity repair, AI-assisted recovery, and structural recovery are outside this bounded package unless authority is separately reopened. |

## 8. Contract decisions resolved by this record

This record adopts prose-only V1 recovery, one project envelope with per-unit candidates, acceptance into dirty local truth, and prior generation/revision as provenance rather than cross-restart authority. It also fixes the no-silent-replacement rule: normal Save alone mutates durable manuscript content.

The remaining implementation work is to express these fixed rules in a typed repository schema and test them. Retention, history, structural recovery, and broad restore remain explicitly deferred rather than unresolved Package 19.12 scope.

## 9. Fixed ownership model

The accepted Project Spine remains the only production authority.

- **Writing Studio renderer:** owns live editing buffers, submits bounded recovery checkpoints, presents validated recovery choices, and applies accepted prose to local buffers as dirty content. It does not decide whether an artifact is valid and does not write recovery files.
- **Main Project Spine coordinator/IPC:** binds requests to the active project and current generation, invokes persistence and validation, publishes recovery state, and enforces that only Writing Studio can accept or reject.
- **Recovery repository seam:** atomically reads and writes a project-local recovery sidecar; validates schema and basic identity; never mutates manuscript drafts. At the inspected revision this should be a narrow new seam rather than extending the service-owned recovery path. Existing durable repository helpers remain in `projectSpineIpc.ts` unless a later mutation explicitly creates the recovery module.
- **Command Center:** receives only a main-authored read-only projection in Package 19.13. It receives no recovered prose and no recovery mutation methods.
- **Durable manuscript:** remains the last confirmed save until the writer explicitly accepts recovery and then separately uses the normal save path.

The recovery envelope and each candidate must identify a supported recovery schema version, durable project ID, normalized canonical project path or path fingerprint, manuscript-unit ID, prior-session generation and revision as provenance, durable-baseline content fingerprint, candidate content including empty string, candidate version or monotonic update sequence, and creation/update time. Candidate validation status may be recorded where applicable. A timestamp alone is not ordering authority. An artifact is eligible only as completed-prior-session evidence; it never becomes authority for the active session.

## 10. First bounded implementation mutation

### Recommendation

Implement only a main-owned, Project-Spine-native atomic repository for prose recovery candidates, with focused repository tests. Do not yet add IPC, preload exposure, renderer UI, startup detection, accept/reject commands, or Command Center projection.

### Exact behavior

The repository writes, reads, validates, and explicitly deletes or invalidates one project-scoped envelope containing per-unit prose candidates. It validates schema, durable project ID, canonical project path, unit IDs, baseline fingerprints, candidate versions, and prior-session provenance. Writes use an atomic temporary-file/sync/rename sequence. A corrupt, partial, cross-project, stale, or unsupported artifact returns a typed classification and never changes manuscript files. Deletion or invalidation requires the expected project identity and candidate version so a late completion cannot remove newer evidence.

### Production seam and likely files

- add `app/main/projectSpineRecoveryRepository.ts`;
- add `app/main/__tests__/projectSpineRecoveryRepository.test.ts`;
- reuse existing Project Spine error/result conventions where they fit, without adding public bridge types in this first mutation.

The new seam is preferred over placing more repository responsibilities in `projectSpineIpc.ts`, but this recommendation does not authorize a refactor of existing durable project functions.

### Focused tests

- Project A and Project B artifact isolation by ID and canonical path;
- round-trip of multiple per-unit candidates;
- empty-string prose round-trip;
- candidate-version supersession and expected-version deletion;
- mismatch and missing-unit classification;
- durable-baseline mismatch classification;
- corrupt and partial JSON classification without destructive cleanup;
- failed atomic replacement preserves the prior valid artifact and removes only the bounded temporary file;
- no operation reads or writes manuscript draft files.

### Exclusions

No renderer behavior, bridge channel, detection-on-open, acceptance, rejection, history UI, retention pruning, service integration, structure recovery, snapshot creation, backup, restore, or Command Center work.

### Success criteria

Focused repository tests pass; main build passes; `git diff --check` passes; a failure cannot modify the last durable draft or erase a prior valid candidate; and the mutation introduces no competing project/session authority.

This is the smallest safe mutation because all later behavior depends on demonstrably safe persistence and classification. Adding UI or IPC first would create an apparent recovery workflow before its data-loss boundary had been proven.

## 11. Package 19.12 acceptance plan

### 11.1 Required for the first mutation

- focused repository logic for schema, identity/path isolation, per-unit candidates, empty strings, candidate ordering, stale/corrupt classification, and atomic failure preservation;
- explicit proof that manuscript drafts are untouched;
- main-process build and diff check.

### 11.2 Required before Package 19.12 closure

**Focused logic and main-process evidence**

- checkpoint creation and replacement obey exact project/current-generation bindings;
- stale-generation requests cannot create, accept, reject, or delete a candidate;
- Project A and Project B remain isolated across open/switch/reopen;
- detection occurs only after durable identity validation;
- acceptance and rejection are correlated to the exact candidate version;
- a save in flight retires only matching submitted content and retains a newer edit;
- save failure and recovery-persistence failure preserve dirty state and durable contents;
- corrupt, partial, cross-project, missing-unit, and stale-baseline artifacts are not applied;
- success and failure use typed Project Spine results and honest messages.

**Preload and renderer evidence**

- only Writing Studio receives checkpoint and accept/reject capabilities;
- Command Center receives no recovery mutation methods;
- a validated candidate is presented with explicit accept and reject choices;
- acceptance populates the correct per-unit local buffers as dirty, including empty content;
- rejection leaves durable content and ordinary local buffers unchanged;
- submission failure keeps the choice retryable and prevents duplicate submission;
- project/generation switches clear prior-session presentation;
- stale snapshots cannot erase accepted local recovery or resurrect rejected recovery.

**Electron integration evidence**

- a real unsaved edit is checkpointed, the app/process is interrupted through the approved test mechanism, and reopen detects it;
- accept restores exact prose into Writing Studio, marks it dirty, and does not mutate the durable draft until Save;
- after Save and a durable reopen, accepted prose is present and the candidate is retired;
- reject retains the last durable prose through reopen and does not re-offer a successfully rejected candidate;
- Project A recovery never appears in Project B;
- an interrupted save and a newer post-submission edit preserve the newest valid recovery evidence;
- both windows remain consistent, with Command Center passive;
- the production build and the established integration regression pass.

**Manual acceptance**

Jason verifies on Windows, using a production-built launch:

1. Open Project A, edit existing prose without saving, and confirm unsaved truth.
2. Trigger the approved interruption procedure and relaunch.
3. Confirm recovery is offered only for Project A and previews enough identity/context to make an informed choice.
4. Accept; confirm recovered prose appears dirty, the previous durable file is unchanged until Save, and Save then survives a fresh reopen.
5. Repeat with new unsaved prose and reject; confirm the prior durable prose survives a fresh reopen and the rejected candidate is not re-offered.
6. Open Project B while Project A has recovery evidence; confirm no Project A prose or decision control appears.
7. Exercise an unavailable/corrupt recovery fixture through an approved bounded mechanism; confirm honest failure, no claimed success, and no durable-data loss.
8. Confirm Command Center reports status only and exposes no accept/reject or prose mutation control.

### 11.3 Deferred beyond Package 19.12

Full history browsing, multi-version retention, diff/merge UI, backup management, restore-as-copy, destructive restore-as-current, structural recovery, cloud sync, import/migration, automated rollback, advanced repair, AI-assisted recovery, and generalized version control remain deferred. Package 19.13 separately proves Command Center projection integrity after 19.12 closes.

## 12. Package 19.13 handoff boundary

Package 19.13 remains separately authorized and projection-only. Planning the shared horizon does not combine Package 19.12 and Package 19.13 implementation or closure.

Before Package 19.13 begins, Package 19.12 must have a main-authored, read-only recovery projection contract suitable for later inclusion in role-specific session snapshots. The minimum contract should communicate availability, candidate count or affected unit identities, freshness/version, current lifecycle state, and honest stale/degraded/failure state. It should not include recovered prose unless a later explicit privacy and presentation decision requires it.

Candidate projection states likely needed by 19.13 are: none, available, applying/decision-in-progress, accepted-into-dirty-local-state, rejected, stale/quarantined, and failed/degraded. These names are not a final public contract; 19.12 should select the smallest state machine needed by its accepted behavior and tests.

Data remains owned by main Project Spine. Package 19.13 may consume only the role-projected state and verify synchronization after detection, accept, reject, save, failure, project switch, and generation change. Command Center must not receive checkpoint, accept, reject, restore, save, prose mutation, or durable mutation methods. Package 19.12 must hand over focused evidence for state transitions, identity isolation, generation binding, candidate correlation, and failure preservation so 19.13 can test projection without reopening recovery semantics.

## 13. Authorization boundary

This record fixes the Package 19.12 scope and recommended implementation sequence. It does not authorize runtime or test mutation. Each implementation mutation requires separate Jason authorization.

The fixed contract does not itself authorize a new repository file, IPC channels, preload exposure, renderer controls, recovery UI, Command Center projection, or reuse of historical service recovery. Those require a separately authorized implementation mutation.

Only this scope-and-inspection document was authorized for creation during this pass.
