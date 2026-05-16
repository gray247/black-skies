Status: Produced
Canonical role: Docs-first current-state baseline and execution plan for Phase 15 backup/restore authority hardening.
Scope: Record the live backup/restore entry points, timeout owners, sync boundaries, format assumptions, destination/collision rules, cleanup behavior, claim-scope rules, proof gaps, and next-slice boundaries for Phase 15.
Owns: `15A` current-state baseline, Phase 15 slice structure, timeout/source/destination/claim matrices, current proof-strength summary, and the rolling phase-entry review checklist for Phases 16-19.
Does not own: Runtime implementation, async/job architecture implementation, closure claims, deferred-work ID ownership changes, or execution of Phases 16-19.
Upstream dependencies: [BLACK_SKIES_FIX_TRACKER.md](/C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md), [phase14d_closure_audit.md](/C:/Dev/black-skies/docs/audits/phase14/phase14d_closure_audit.md), [phase14c_operator_receipt_results.md](/C:/Dev/black-skies/docs/audits/phase14/phase14c_operator_receipt_results.md), [master_phase_allocation_plan.md](/C:/Dev/black-skies/docs/roadmap/master_phase_allocation_plan.md), [deferred_work_matrix.md](/C:/Dev/black-skies/docs/roadmap/deferred_work_matrix.md), [authority_reconciliation_strategy.md](/C:/Dev/black-skies/docs/roadmap/authority_reconciliation_strategy.md), [snapshot_state_vocabulary_and_evidence_contract.md](/C:/Dev/black-skies/docs/specs/snapshot_state_vocabulary_and_evidence_contract.md)
Downstream dependencies: `15B` operation-authority modeling, `15C` backup-timeout hardening, `15D` restore validation/cleanup policy, `15E` trust wording alignment, `15F` regression/human verification, and later phase-entry reviews for Phases 16-19.
Last reviewed: 2026-05-16.
Acceptance record: No operator acceptance recorded yet.

# Phase 15 Backup / Restore Hardening Plan

## Purpose

Phase 15 exists to make backup and restore behavior reliable, bounded, explainable, and operator-safe after Phase 14 settled the authority vocabulary and copy-materialization semantics.

`15A` is evidence-first and docs-only. It does not implement hardening. It records the live current state so later slices can change the system intentionally rather than implicitly.

## Inputs Inspected

Runtime and route surfaces inspected for this baseline:

- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/routers/recovery.py`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/RecoveryBanner.tsx`

Existing proof lanes reread for current coverage:

- `services/tests/test_app.py`
- `services/tests/test_backups.py`
- `services/tests/unit/test_restore_service.py`
- `app/main/__tests__/serviceApi.test.ts`
- `app/renderer/__tests__/AppRestore.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`

## 15A Baseline Summary

Current live state:

- Backup create, backup restore, ZIP restore, and recovery restore are all synchronous request/response flows.
- Preload owns client-side timeout behavior. Only `POST /api/v1/restore` currently gets a restore-specific timeout budget.
- Omitted-`zipName` restore-latest now prefers the global backup-bundle source first and falls back to `<project>/exports`.
- Backup bundle restore and export ZIP restore use different service implementations and different format assumptions.
- `POST /api/v1/restore` validates the restored copy after materialization. `POST /api/v1/backups/restore` does not.
- Temporary extraction directories are cleaned reliably. Final restored sibling folders are not cleaned automatically if a later validation step or downstream route step fails after the folder is moved into place.
- Current UI wording already reflects Phase 14 authority semantics and must not be regressed by Phase 15 hardening.

## Phase 15 Structure

### 15A - Backup / Restore Current-State Baseline

Deliverables:

- route and entry-point matrix
- timeout ownership matrix
- sync vs async current-state summary
- source ZIP / backup-bundle format matrix
- destination / collision / cleanup matrix
- success / failure claim-scope matrix
- proof-strength and coverage-gap summary
- exact `15B` boundary recommendation

Non-goals:

- no runtime edits
- no timeout tuning
- no cleanup-policy changes
- no wording changes
- no Phase 16-19 implementation

### 15B - Operation Authority Model + Long-Running Restore Behavior

Primary decision:

- who owns completion truth when a long-running restore is in flight:
  - client
  - preload bridge
  - backend route
  - filesystem result
  - follow-up validation

Questions this slice must answer:

- is the current synchronous request model still acceptable?
- if the client times out but the backend continues, what state should the UI claim?
- must Phase 15 remain synchronous with larger/route-specific budgets, or does it need an async/job model?

### 15C - Backup Creation Timeout Hardening

Primary targets:

- backup-create timeout ownership
- backup bundle size and project-size telemetry
- create-backup elapsed-time evidence
- decision whether backup create needs a dedicated timeout budget or the same async/job consideration as restore

### 15D - Restore Validation + Cleanup Policy

Primary targets:

- supported format contract
- unsupported format response contract
- destination collision policy
- partial restore cleanup policy
- preserved degraded partial vs automatic cleanup rules
- duplicate restored-clone policy
- post-materialization validation scope

### 15E - Restore / Backup User-Facing Trust Wording

Primary targets:

- runtime-truth-aligned success messaging
- timeout / degraded / unknown-completion messaging
- surfaced restored path and actionable next step

Guardrail:

- no copy polish that hides unresolved runtime ambiguity

### 15F - Regression + Human Verification

Minimum closure behaviors:

- repeated restore-latest success
- repeated selected-backup restore success
- repeated backup-create success
- failed restore leaves no ambiguous garbage
- restored copy opens
- copy flows leave original project untouched
- no false trust claims remain in the UI

## Route And Entry-Point Matrix

| Flow | UI entry point | Backend route | Service path | Current result model | Current claim scope |
| --- | --- | --- | --- | --- | --- |
| Backup create | `SnapshotsPanel` `Create backup` | `POST /api/v1/backups` | `BackupService.create_backup()` | synchronous create-in-request | backup bundle created |
| Backup list | `SnapshotsPanel` `Project backups` | `GET /api/v1/backups?projectId=...` | `BackupService.list_backups()` | synchronous list | historical/current list of backup bundles |
| Backup restore | `SnapshotsPanel` `Restore backup` | `POST /api/v1/backups/restore` | `BackupService.restore_backup()` | synchronous restore-in-request | restored copy materialized from backup archive |
| Restore latest / explicit ZIP restore | `SnapshotsPanel` `Restore latest ZIP as copy` | `POST /api/v1/restore` | `BackupService.restore_backup()` when latest backup bundle exists; otherwise `restore_service.restore_from_zip()` | synchronous restore-in-request plus post-restore validation | restored copy materialized from backup archive or ZIP export |
| Recovery restore | `RecoveryBanner` restore action | `POST /api/v1/draft/recovery/restore` | `RecoveryService.restore_snapshot()` | synchronous current-project restore-in-request | current project files restored from recovery snapshot |

## Timeout Ownership Matrix

| Flow | Preload path | Current timeout owner | Current timeout budget | Retry policy | Notes |
| --- | --- | --- | --- | --- | --- |
| Backup create | `backups` | preload generic `REQUEST_POLICY.timeoutMs` | default `45_000ms` | no POST retry | no dedicated backup-create override exists |
| Backup restore | `backups/restore` | preload generic `REQUEST_POLICY.timeoutMs` | default `45_000ms` | no POST retry | not covered by restore-specific timeout despite being long-running filesystem work |
| Restore latest / explicit ZIP restore | `restore` | preload `RESTORE_REQUEST_TIMEOUT_MS` | default `300_000ms`, floor = generic timeout | no POST retry | dedicated route-specific timeout added in Phase 14C |
| Recovery restore | `draft/recovery/restore` | preload generic `REQUEST_POLICY.timeoutMs` | default `45_000ms` | no POST retry | current-project replace flow, not copy-materialization flow |

Additional preload facts:

- generic bridge timeout is `BLACKSKIES_BRIDGE_TIMEOUT_MS` with default `45_000ms`
- restore-specific timeout is `BLACKSKIES_BRIDGE_RESTORE_TIMEOUT_MS` with default `300_000ms`
- POST requests are single-attempt under `fetchWithResilience()`
- GET requests may retry; POST requests do not

## Sync Vs Async Current-State Summary

Current state is fully synchronous:

- archive creation, extraction, directory move, and post-restore validation all happen before the route returns
- no job ID, no polling contract, no progress contract, and no durable operation-state record exist for backup/restore flows
- preload timeout aborts the client request, not the backend work itself

Current consequence already proven by Phase 14 evidence:

- `/api/v1/restore` can continue materializing a restored copy even after the client times out

This is the key `15B` decision boundary. Phase 15 must decide whether:

- the synchronous model remains acceptable with better timeout ownership and operation-state semantics, or
- a later async/job architecture is required because synchronous authority becomes too ambiguous

## Source Format Matrix

| Flow | Source location | Selector | Expected format signals | Current implementation |
| --- | --- | --- | --- | --- |
| Backup create | `<project_root>` excluding `backups/` | full project walk | zip bundle plus `checksums.json` with `project_id`, `created_at`, file checksums | `BackupService.create_backup()` |
| Backup list | global `settings.backups_dir` | `BS_*.zip`, filtered by `checksums.json.project_id` | valid backup bundle containing `checksums.json` | `BackupService.list_backups()` |
| Backup restore | global `settings.backups_dir/<backupName>` | explicit backup filename | valid backup bundle containing at least `project.json` and `outline.json` | `BackupService.restore_backup()` |
| Restore latest without `zipName` | global `settings.backups_dir` first; `<project_root>/exports` second | latest project backup bundle first, else latest export ZIP by mtime | backup bundle if available; export ZIP only when no backup bundle exists | `routers/restore.py` |
| Restore explicit `zipName` | `<project_root>/exports/<zipName>` | explicit zip name | export ZIP with `project.json` and `outline.json` | `restore_service.restore_from_zip()` |
| Recovery restore | snapshot store | latest or explicit `snapshot_id` | snapshot persistence format, not ZIP | `RecoveryService.restore_snapshot()` |

Important current distinction:

- backup bundle restore and export ZIP restore are not one unified format path today
- backup bundle restore reads `checksums.json` only for listing/filtering; restore itself primarily requires extracted `project.json` and `outline.json`
- export ZIP restore does not understand backup-bundle-specific metadata as a first-class contract

## Destination / Collision / Cleanup Matrix

| Flow | Destination root | Naming rule | Collision rule | Temp cleanup | Final destination cleanup |
| --- | --- | --- | --- | --- | --- |
| Backup create | `settings.backups_dir` | `BS_YYYYMMDD_HHMMSS.zip` | existing target is unlinked before replace | temp zip path `.filename.tmp` removed/replaced | not applicable |
| Backup restore | `settings.project_base_dir` sibling folder | `<slug>_restored_<timestamp>` | `_create_destination()` adds `_01`, `_02`, ... suffix | temp extraction dir removed in `finally` | no explicit cleanup after move |
| ZIP restore | parent of current project root | `<slug>_restored_<timestamp>` | `_create_destination()` adds `_01`, `_02`, ... suffix | temp extraction dir removed in `finally` | no explicit cleanup after move |
| Recovery restore | current project root | in-place replacement via recovery service | not a sibling-copy flow | handled inside recovery service | current-project replace semantics, not copy cleanup |

Important current cleanup finding:

- once `manifest_dir` is moved into the final sibling destination, neither `restore_service.restore_from_zip()` nor `BackupService.restore_backup()` has a rollback/cleanup step for that final destination
- in `POST /api/v1/restore`, post-materialization `validate_project()` runs after the destination already exists
- if that validation fails, the route returns an error but the moved restored folder is not explicitly removed
- `POST /api/v1/backups/restore` currently performs no post-materialization validation step at all

This is a direct `15D` policy gap.

## Success / Failure Claim-Scope Matrix

| Flow | Success claim today | Explicit non-claims today | Failure wording pattern today |
| --- | --- | --- | --- |
| Backup restore route | restored copy materialized from backup archive | not current-project-replaced, not continuity-correct, not recovery-complete, not restore-safe | backend validation/file error surfaced to renderer as backup restore failed |
| Restore route | restored copy materialized from backup archive or ZIP export | not current-project-replaced, not continuity-correct, not recovery-complete, not restore-safe | backend validation/file/integrity failure surfaced to renderer as project restore failed |
| Recovery restore route | current project files restored from recovery snapshot | not continuity-correct, not reopen-correct, not restore-safe | recovery failure returned as invalid snapshot / filesystem error |
| `SnapshotsPanel` backup restore toast | `Backup copy created` with restored slug/path | does not claim current project changed or continuity correctness | `Backup restore failed` plus “Your current project was not changed.” |
| `SnapshotsPanel` restore latest toast | `Restore copy created` with restored path | does not claim overwrite, continuity, reopen, or safety closure | `Project restore failed` plus “No new project was created...” |
| `RecoveryBanner` restore messaging | restore latest recovery snapshot to replace current project files | does not claim continuity/reopen correctness | current-project restore-specific messaging |

## Existing Proof Coverage

Current automated proof already in place:

- payload contract tests for restore-from-zip serialization in `app/main/__tests__/serviceApi.test.ts`
- restore-specific timeout-budget tests in `app/main/__tests__/serviceApi.test.ts`
- backup listing latest-first tests in `services/tests/test_backups.py`
- restore-latest backup-bundle alignment tests in `services/tests/test_app.py`
- unique restored sibling naming test in `services/tests/unit/test_restore_service.py`
- UI toast/action expectations for restore latest in `app/renderer/__tests__/AppRestore.test.tsx`
- backup-row rendering and backup-action tests in `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`

Coverage gaps that Phase 15 still needs:

- backup-create timeout ownership and timeout metadata
- backup-restore timeout ownership and whether it needs route-specific handling
- client-timeout / backend-continues behavior for backup restore, not just `/restore`
- partial restored-folder cleanup when post-materialization validation fails
- unsupported backup-bundle format messaging as a user-facing contract
- repeated real-project success for backup create, restore latest, and selected backup restore
- explicit degraded-state contract when completion truth is ambiguous

## Recommended 15B Boundary

`15B` should start with a decision artifact, not implementation.

It should answer these concrete questions first:

1. Is synchronous restore still acceptable for:
   - `/api/v1/restore`
   - `/api/v1/backups/restore`
   - `/api/v1/backups`
2. If the client times out and the backend continues, who owns completion truth:
   - preload result
   - backend route return
   - filesystem existence
   - follow-up validation
3. Should backup restore receive restore-like timeout treatment immediately, or does that hide a deeper operation-state ambiguity?
4. What exact degraded/unknown-completion state should the UI surface when client timeout and backend completion can diverge?

Recommended no-go line for `15B`:

- do not add progress UI, job IDs, or queue orchestration until the authority model is chosen

## Phase 15 Closure Criteria

Phase 15 can close only when:

- backup create, restore latest, and backup restore have explicit timeout ownership
- supported source formats and unsupported-format behavior are documented and enforced
- partial/dangling restore outputs are either cleaned or explicitly surfaced as degraded-state results
- user-facing success/failure wording follows runtime truth rather than hiding ambiguity
- repeated human-verified success exists for the real-project critical flows
- no remaining claim relies on browseability, report presence, or historical evidence as a restore-safety shortcut

Phase 15 cannot close on CI alone.

Human verification remains required for:

- operator-facing success/failure truth
- timeout-after-completion behavior
- degraded/unknown completion handling
- repeated real-project backup/restore stability claims

## Stop Gates

Stop Phase 15 implementation immediately if:

- backup or restore exceeds safe synchronous limits and the current request model becomes indefensible
- completion truth cannot be expressed honestly without an async/job result model
- partial restored-folder cleanup cannot be made unambiguous with bounded changes
- restore hardening begins coupling into project-switch, continuity, session, or floating-pane behavior
- GUI wording requires a product/design choice rather than an authority correction
- harness-only evidence becomes the strongest support for operator-trust claims

## Rolling Phase-Entry Review Model For Phases 16-19

Every later phase should remain draft-planned until a phase-entry review reruns these checks:

1. What changed in the immediately prior phase?
2. Which deferred items were added, narrowed, or retired?
3. Which assumptions in the draft phase plan are now stale?
4. Which CI lanes passed, and what do they actually prove?
5. Which human-verification results changed the trust model?
6. Does scope ownership still match `master_phase_allocation_plan.md` and `deferred_work_matrix.md`?
7. Are new stop gates needed before implementation starts?

Recommended artifact pattern for Phases 16-19:

- one draft phase plan
- one phase-entry review
- one closure audit

## Recommended Next Artifact Updates

Primary next artifact:

- `docs/audits/phase15/phase15_backup_restore_hardening_plan.md`
  - this file

Secondary updates recommended when `15B` starts:

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md` only if Phase 15 slice sequencing changes materially
- `docs/roadmap/deferred_work_matrix.md` only if ownership or roadmap IDs change materially

## Current Status Note

`15A` is now produced as a docs-first baseline only.

No runtime behavior, timeout budget, restore algorithm, cleanup policy, or user-facing wording changed in this pass.

## Implementation Status Note

Runtime implementation began later on 2026-05-16 after this baseline was captured.

Implemented runtime changes now in flight against this plan:

- preload now applies explicit long-running timeout budgets to `POST /api/v1/backups`, `POST /api/v1/backups/restore`, and `POST /api/v1/restore`, with timeout payloads that mark completion as unknown rather than confirmed failed
- backup create and restore responses now carry bounded operation metadata (`archive_path`, `destination_path`, elapsed time, completion/validation/cleanup status)
- both sibling-copy restore lanes now validate the materialized copy before UI success is allowed
- failed post-materialization validation now cleans operation-owned restored copies when safe, or preserves them with explicit degraded metadata when cleanup fails
- backup restore now rejects backup archives that do not include `checksums.json`
- renderer trust wording now distinguishes validated success, completion unknown, and degraded preserved-copy inspection states

Still pending against the Phase 15 closure criteria:

- final closure review for `15F`

## Post-Hardening Human-Verification Inspection

Recorded on 2026-05-16 after the first runtime hardening implementation. This section is an inspection/classification pass only. It does not close Phase 15, authorize cleanup of sample artifacts, or broaden scope into async jobs, architecture rewrite, or repository hygiene work.

### Corrected Current Flow

- Human-facing project selection may begin from `C:\Dev\black-skies\sample_project\Esther_Estate`, because the Electron project loader accepts user-facing folders and resolves upward to the nearest valid project root metadata.
- The canonical internal identifier remains the `project_id` from `project.json`, currently `proj_esther_estate`. Backend backup/restore routes then resolve the operational root as `project_base_dir / projectId`, which is `C:\Dev\black-skies\sample_project\proj_esther_estate` under current sample data.
- Backup bundles intentionally live outside the project root under `C:\Dev\black-skies\sample_project\backups\BS_*.zip`.
- `POST /api/v1/restore` without `zipName` does not mean “latest export ZIP first.” Current logic first attempts the newest valid backup bundle for the project from `sample_project\backups`; only if no matching bundle exists does it fall back to the latest export ZIP under `<project>\exports`.
- Both sibling-copy restore lanes materialize a restored copy under `sample_project\<slug>_restored_YYYYMMDD_HHMMSS`, where the slug is currently derived from the canonical internal project metadata. For this sample that usually means `proj_esther_estate_restored_*`, not `Esther_Estate_restored_*`.
- Sibling-copy restore success is authoritative only after backend completion and post-materialization validation. The original project is not overwritten by these copy flows.
- Recovery restore remains a separate route with different semantics and should not be conflated with sibling-copy backup/export restore.

### Issue Classification

| Observation | Source inspection result | Classification | Phase ownership | Blocks Phase 15 closure |
| --- | --- | --- | --- | --- |
| `Writing tools offline` appeared during backup/restore testing | Human rerun passed after the Phase 15 panel fix: backup/restore controls remained usable while the global status still showed `Checking writing tools`, and local panel copy used backend-service wording where relevant | Runtime-authority blocker resolved; residual global label simplification remains deferred | Phase 15 fixed, `RDM-GUI-001` / Phase 17 residual | No |
| Backup create showed `Request timed out after 45000ms` | Human rerun did not reproduce the timeout during backup create, restore latest, or selected-backup restore; current preload source still assigns dedicated `300_000ms` defaults to those long-running routes | Reclassified from blocker to non-reproduced monitor item | Phase 15 monitor | No |
| Selected-backup restore used a native white confirm dialog | Confirmed: `SnapshotsPanel` still calls `window.confirm(...)` for selected-backup restore, but the restore result semantics now remain truthful elsewhere in the flow | Styling/control-surface inconsistency deferred to later GUI/control-surface cleanup | Phase 17 primary | No |
| Selected-backup restore toast said `Backup copy created` | Fixed in the 2026-05-16 Phase 15 UI authority pass and confirmed by human rerun; success now says `Restored project copy created`, shows the restored sibling path, and clarifies that the current project was not overwritten | Fixed semantic mismatch | Phase 15 | No |
| `Esther_Estate` vs `proj_esther_estate` vs `PROJ_ESTHER_ESTATE` felt inconsistent | Confirmed current topology: loader can open `Esther_Estate`, canonical project id is `proj_esther_estate`, backend operates on `sample_project\proj_esther_estate`, UI surfaces uppercase `PROJECT ID` label; human rerun confirmed the topology functions as documented | Expected current behavior but operator-confusing alias/UI debt | Phase 17 / `RDM-ALIAS-001` later cleanup | No |
| Backups under `sample_project\backups` and restored copies as siblings under `sample_project\proj_esther_estate_restored_*` felt odd | Confirmed intentional current storage/destination policy | Expected current behavior that needs explicit documentation and trust wording, not automatic cleanup | Phase 15 documentation/UI clarity | No by itself |
| White block / unstyled confirmation or modal | Likely the selected-backup `window.confirm(...)` unless a separate renderer regression is reproduced | Deferred GUI/control-surface inconsistency unless a second surface is reproduced later | Phase 17 primary | No |

### Timeout Ownership Findings

- Generic bridge requests still default to `45_000ms`.
- `POST /api/v1/restore` currently has a dedicated restore timeout default of `300_000ms`.
- `POST /api/v1/backups` currently has a dedicated backup-create timeout default of `300_000ms`.
- `POST /api/v1/backups/restore` currently has a dedicated backup-restore timeout default of `300_000ms`.
- Health polling and unrelated generic service requests still use the generic bridge timeout unless separately scaled.
- The observed 45-second timeout during backup/restore verification is therefore not explained by the current intended timeout owner and must be treated as a reproduction task, stale-session possibility, or request-path mix-up until proven otherwise.
- Human rerun on 2026-05-16 did not reproduce the prior `45000ms` timeout during backup create, restore latest, or selected-backup restore, so timeout ownership is no longer a Phase 15 closure blocker.

### Implemented UI Authority Corrections

- `SnapshotsPanel` now treats actual renderer-offline state, not any non-`online` health state, as the local blocker for backup create, restore latest, selected-backup restore, and verification.
- Local offline copy inside the snapshots/backups surface now says `Backend services are unavailable` so backup/restore actions are not presented as AI-writing-only failures.
- Selected-backup restore success now says `Restored project copy created` and clarifies that the current project was not overwritten.
- No preload timeout owner changed in this pass because source inspection still confirms dedicated long-running timeout routes for backup create, restore latest, and backup restore.

### Project Topology Findings

- `sample_project\Esther_Estate` is a human-facing sample folder that still contains valid project metadata for `proj_esther_estate`.
- `sample_project\proj_esther_estate` is the canonical backend operational root for `projectId=proj_esther_estate` under current service resolution rules.
- `sample_project\backups` is the intentional shared backup-bundle store.
- `sample_project\proj_esther_estate_restored_*` are restored copy artifacts from sibling-copy restore flows.
- Existing restored siblings and duplicate sample roots must not be deleted as part of Phase 15 verification triage. Any cleanup or archival action requires explicit operator approval and likely belongs to separate repository/operator hygiene work rather than the bounded Phase 15 runtime hardening slice.

### Human Verification Rerun Summary

Recorded on 2026-05-16 after commit `9e481f4`.

- startup/gating: `PASS`
- backup create: `PASS` in roughly 4-5 minutes; created `BS_20260516_182839.zip`
- restore latest ZIP as copy: `PASS` in roughly 2 minutes; created a sibling `proj_esther_estate_restored_*` folder and did not overwrite the original project
- selected-backup restore: `PASS` in roughly 1-2 minutes; surfaced `Restored project copy created`, showed the restored sibling path, and stated that the current project was not overwritten
- no `45000ms` backup/restore timeout reproduced in the rerun

### Closure Posture Update

Phase 15 is now closure-ready as `Closed with exceptions`.

Reasons:

- the scoped runtime/authority blockers were fixed and then confirmed by human verification
- backup create, restore latest, and selected-backup restore each completed successfully under the current synchronous long-running timeout model
- selected-backup restore wording now truthfully describes the restored project copy outcome
- copy-flow restores continued to materialize sibling `proj_esther_estate_restored_*` folders and did not overwrite the original project

Remaining exceptions are explicitly deferred rather than left ambiguous:

- global `Writing tools offline` / `Checking writing tools` label simplification remains Phase 17 GUI debt
- selected-backup `window.confirm(...)` remains Phase 17 control-surface debt
- alias/folder naming confusion remains later GUI/docs cleanup under `RDM-ALIAS-001`
- restored-folder clone sprawl remains Phase 19 or separate hygiene work; no deletion is authorized here
- backup-create slowness remains a known performance/reliability note, but it does not block closure because the operation completed truthfully within the explicit long-running contract
