# Stage 14 PKG-D Read-Only Baseline

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
26fe9137fc596d43a337a84e5c55d77b4df37b2b docs(product): charter Stage 14 PKG-D
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
26fe913 docs(product): charter Stage 14 PKG-D
409b4f2 docs(product): close Stage 14 PKG-A
```

No runtime code, tests, fixtures, protected evidence, recovery, restore, receipts, snapshots, witness plan, mutation scope, or Stage 15 work was created or modified during this baseline.

## 2. Required records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_a_closure_review.md`
- `docs/product_systems/stage14_pkg_a_closure_preparation.md`
- `docs/product_systems/stage14_pkg_a_post_divergence_reassessment.md`

Additional controlling records inspected:

- `docs/product_systems/stage12_project_identity_binding_contract.md`
- `docs/product_systems/project_persistence_local_save.md`

## 3. Source and test files inspected

Renderer and bridge files:

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/hooks/useRecovery.ts`
- `app/renderer/recovery/actions.mjs`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `app/shared/ipc/projectLoader.ts`
- `app/main/projectLoaderIpc.ts`

Backend files:

- `services/src/blackskies/services/routers/recovery.py`
- `services/src/blackskies/services/persistence/snapshot.py`
- `services/src/blackskies/services/routers/snapshots.py`
- `services/src/blackskies/services/snapshots.py`
- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/restore_service.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/backup_service.py`
- `services/src/blackskies/services/routers/backup_verifier.py`
- `services/src/blackskies/services/backup_verifier.py`
- `services/src/blackskies/services/routers/draft/acceptance.py`
- `services/src/blackskies/services/operations/draft_accept.py`
- `services/src/blackskies/services/routers/draft/generation.py`
- `services/src/blackskies/services/persistence/draft.py`

Existing tests inspected as read-only evidence:

- `app/main/__tests__/serviceApi.test.ts`
- `app/renderer/__tests__/useRecovery.test.tsx`
- `app/main/__tests__/projectLoaderIdentityWitness.test.ts`
- `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
- `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
- `services/tests/test_backup_verifier_report.py`
- `services/tests/unit/test_runtime_truth.py`

No broad tests or targeted tests were run. Static inspection was sufficient for this baseline.

## 4. Controlling PKG-D charter summary

PKG-D authority is limited to read-only governance and evidence work until a later reviewed scope explicitly authorizes mutation.

PKG-D may evaluate persistence, recovery, restore, and write-target identity safety after PKG-A renderer identity repairs. The package question is whether runtime persistence, recovery, restore, and write-target behavior bind operations to canonical project identity and the correct project root after those repairs.

The charter permits inspection of renderer write request formation, persistence IPC request formation, recovery and restore request formation, backend write-target handling, loader identity/path handoff as context, and existing tests as read-only evidence.

The charter does not authorize runtime mutation, test mutation, backend mutation, recovery execution, restore execution, fixture materialization, receipt creation, snapshot update, protected evidence regeneration, or Stage 15 work.

## 5. PKG-A inheritance verification

Status: confirmed by accepted PKG-A records. PKG-A is not reopened by this baseline.

Inherited resolved facts:

- confirmed by executable witness: A1 fixed App missing-ID activation by failing closed when `projectId` is missing.
- confirmed by executable witness: A1 prevents basename-derived App active identity.
- confirmed by executable witness: A1 prevents missing-ID active App state, missing-ID datasets, immediate missing-ID recovery-status requests, and replacement of a prior valid active project.
- confirmed by executable witness: explicit metadata-ID handoff remains preserved when path basename and metadata `project_id` diverge.
- confirmed by executable witness: ProjectHome remembered-path hygiene prevents missing-ID loader-success projects from writing recents, `blackskies.last-project`, or stored remembered-path state.
- confirmed by executable witness: valid-ID remembered-path behavior remains preserved.
- confirmed by executable witness: ProjectHome details show canonical Project ID for loaded valid-ID projects.

Inherited unresolved or deferred facts:

- confirmed by source inspection and prior witness: loader tolerance of missing `project_id` remains reachable but is contained by App A1 and ProjectHome hygiene at the renderer seams.
- unresolved: persistence and recovery destination safety under path/metadata-ID divergence was not proved by PKG-A.
- deferred non-blocking: recents identity visibility and divergence-warning UX are outside PKG-D unless direct write-target dependency is proved.

This baseline uses PKG-A closure facts as authority and does not reinterpret PKG-A closure.

## 6. Context seams inspected

Context seam: `app/shared/ipc/projectLoader.ts`

- Why context only: it defines loaded project identity/path shape, including optional `projectId`, but does not itself perform persistence, recovery, restore, save/edit, or write-target operations.

Context seam: `app/main/projectLoaderIpc.ts`

- Why context only: it reads metadata and preserves both filesystem path and metadata `projectId`; it also still tolerates missing `project_id`. That explains identity/path handoff into renderer state, but does not by itself choose backend write targets.

Context seam: `app/renderer/components/ProjectHome.tsx`

- Why context only: after PKG-A hygiene it controls remembered paths and handoff to App. It no longer persists missing-ID paths. It does not directly call backend persistence/recovery/restore write-target services in the inspected path.

Context seam: `app/renderer/App.tsx` project activation and `projectSummary`

- Why context only: it establishes active renderer identity after A1. The relevant PKG-D evidence begins when App-managed actions form persistence, recovery, restore, export, verification, or draft requests from that state.

Context seam: `app/renderer/recovery/actions.mjs` path-based reopen evaluation

- Why context only: `evaluateReopenRequest` is reopen input handling, not backend write-target selection. It remains relevant only if a later record proves reopen state directly changes a write target.

## 7. Candidate evidence seams inspected

Renderer request formation:

- `app/renderer/App.tsx`: PKG-D-relevant because App gates and forms requests for recovery status, snapshot creation, backup verification, export, and project-bound actions from active `projectSummary`.
- `app/renderer/hooks/useRecovery.ts`: PKG-D-relevant because it forms recovery status and restore snapshot service calls from `projectSummary.projectId`.
- `app/renderer/recovery/actions.mjs`: PKG-D-relevant for restore snapshot request formation through `performRestoreSnapshot`.
- `app/main/preload.ts`: PKG-D-relevant because it serializes renderer bridge requests into backend request payloads and query strings.
- `app/shared/ipc/services.ts`: PKG-D-relevant because it defines service bridge contracts for projectId-based persistence/recovery/restore/export/snapshot/backup requests.

Backend target handling:

- `services/src/blackskies/services/routers/recovery.py`: PKG-D-relevant because it resolves recovery status and current-project snapshot restore roots from `project_id`.
- `services/src/blackskies/services/persistence/snapshot.py`: PKG-D-relevant because it chooses snapshot and restore roots from `settings.project_base_dir / project_id`.
- `services/src/blackskies/services/routers/snapshots.py` and `services/src/blackskies/services/snapshots.py`: PKG-D-relevant because they handle manual snapshot target roots.
- `services/src/blackskies/services/routers/export.py`: PKG-D-relevant because it writes project export artifacts under a project root derived from `project_id`.
- `services/src/blackskies/services/routers/restore.py` and `services/src/blackskies/services/restore_service.py`: PKG-D-relevant because restore-as-copy behavior resolves source root from `projectId`.
- `services/src/blackskies/services/routers/backups.py` and `services/src/blackskies/services/backup_service.py`: PKG-D-relevant because backup and backup-restore behavior resolves current project root from `projectId`.
- `services/src/blackskies/services/routers/backup_verifier.py` and `services/src/blackskies/services/backup_verifier.py`: PKG-D-relevant because backup verification reads project roots and writes verification reports.
- `services/src/blackskies/services/routers/draft/acceptance.py`, `services/src/blackskies/services/operations/draft_accept.py`, `services/src/blackskies/services/routers/draft/generation.py`, and `services/src/blackskies/services/persistence/draft.py`: PKG-D-relevant because draft generation and acceptance can write draft scene artifacts, snapshots, budgets, diagnostics, and runtime events under project roots.

Existing tests:

- `app/main/__tests__/serviceApi.test.ts`: PKG-D-relevant for bridge request serialization.
- `app/renderer/__tests__/useRecovery.test.tsx`: PKG-D-relevant for recovery hook behavior, but source inspection is stronger for payload formation.
- `services/tests/test_backup_verifier_report.py`: PKG-D-relevant because it asserts multi-root verification report write behavior.
- `services/tests/unit/test_runtime_truth.py`: PKG-D-relevant for runtime truth gating context around backup verifier endpoints.

## 8. Persistence/write-target seams found

Renderer-side request formation:

- confirmed by source inspection: App snapshot creation blocks when `projectSummary.projectId` is missing and calls the service with `{ projectId }`.
- confirmed by source inspection: App backup verification blocks when `projectSummary.projectId` is missing and calls the service with `{ projectId, latestOnly: true }`.
- confirmed by source inspection: App export blocks when `projectSummary.projectId` is missing and calls the service with `{ projectId, format }`.
- confirmed by source inspection: draft/preflight/generation/accept bridge contracts serialize canonical `projectId` as `project_id`.

Bridge serialization:

- confirmed by source inspection: `app/main/preload.ts` serializes draft, recovery, restore, export, snapshot, backup, and verification requests using `projectId` / `project_id`; it does not include the active loaded project path in those write-target payloads.
- confirmed by source inspection: `getLastVerification` accepts `projectPath` but uses it to read a local verification file, not to form a backend write.

Backend target handling:

- confirmed by source inspection: recovery, snapshots, export, restore-as-copy, backup, backup-restore, draft generation, draft acceptance, and draft persistence generally resolve project roots as `settings.project_base_dir / project_id` or `settings.project_base_dir / projectId`.
- confirmed by source inspection: `DraftPersistence.ensure_project_root(project_id)` creates `settings.project_base_dir / project_id` if needed, then writes under that root.
- narrow unresolved seam needing witness: after PKG-A, a loaded project may preserve `path=/projects/path-beta` and `projectId=proj_alpha`; renderer write requests generally send only `proj_alpha`, while backend target resolution generally uses `base_dir / proj_alpha`. Static inspection suggests possible active-path/root divergence, but a bounded PKG-D witness is needed before classifying the broad backend pattern as a proved wrong-root contradiction.

## 9. Recovery status seams found

- confirmed by executable witness from PKG-A: missing-ID App activation does not issue immediate recovery-status requests.
- confirmed by source inspection: `useRecovery.fetchRecoveryStatus(projectId)` calls `services.getRecoveryStatus({ projectId })`.
- confirmed by source inspection: preload serializes recovery status as `draft/recovery?project_id=<projectId>`.
- confirmed by source inspection: backend recovery status validates `project_id`, resolves `project_root = settings.project_base_dir / project_id`, and returns status through `RecoveryTracker`.
- unresolved but not contradicted: recovery status uses projectId-derived backend root and does not receive active loaded path; under divergent path/metadata-ID scenarios, destination/root correspondence remains unproved.

## 10. Restore seams found

Current-project recovery restore:

- confirmed by source inspection: `performRestoreSnapshot` calls `services.restoreSnapshot({ projectId: input.projectSummary.projectId })`.
- confirmed by source inspection: preload serializes restore snapshot as `draft/recovery/restore` with `project_id` and optional `snapshot_id`.
- confirmed by source inspection: backend recovery restore validates `project_id`, resolves `project_root = settings.project_base_dir / project_id`, and calls `recovery_service.restore_snapshot(project_id, snapshot_id)`.
- unresolved but not contradicted: `validateRestoreSnapshot` checks that `projectSummary` exists, but not that `projectSummary.projectId` is non-empty inside the isolated helper. In normal App flow, A1 controls creation of `projectSummary`, so this is contained unless a later witness proves an alternate caller can supply missing identity.

Restore-as-copy:

- confirmed by source inspection: preload `restoreFromZip` and backup restore serialize camelCase `projectId`.
- confirmed by source inspection: backend restore-as-copy resolves source `project_root` as `base_dir / projectId`.
- confirmed by source inspection: restore-as-copy performs eligibility checks including source project ID comparison, expected project ID, destination existence, and destination overlap.
- unresolved but not contradicted: restore-as-copy destination safety under divergent active path remains unproved, but static inspection did not prove current-project overwrite through this route.

## 11. Draft save/edit seams found

Draft generation:

- confirmed by source inspection: draft generation request formation serializes `project_id`.
- confirmed by source inspection: backend draft generation resolves `resolved_project_root = settings.project_base_dir / request_model.project_id`.
- confirmed by source inspection: draft generation can write draft artifacts through `DraftPersistence.write_scene(request.project_id, ...)` and log runtime/diagnostic artifacts under `project_root`.
- narrow unresolved seam needing witness: under divergent active path/metadata-ID, draft generation appears to target `base_dir / project_id`, not the loaded `project.path`; static inspection suggests a potential write-target mismatch but does not by itself prove a reachable unsafe user path without a bounded witness.

Draft acceptance:

- confirmed by source inspection: draft acceptance request formation serializes `project_id`, `draft_id`, `unit_id`, and unit payload.
- confirmed by source inspection: backend draft acceptance resolves `resolved_project_root = settings.project_base_dir / request_model.project_id`.
- confirmed by source inspection: `DraftAcceptService.accept` writes scenes through `DraftPersistence.write_scene(request.project_id, ...)`, creates snapshots through `create_accept_snapshot(request.project_id, ...)`, and updates project budget using the resolved project root.
- narrow unresolved seam needing witness: draft acceptance has the same divergent active path versus projectId-derived backend root question as draft generation.

Classification:

- draft save/edit seams are PKG-D-relevant because they form write-target requests and can write project-local draft artifacts.
- they should not be absorbed into UX or editor behavior work; the PKG-D concern is only identity/root binding for writes.

## 12. Project picker behavior

Project picker behavior was inspected only as context through `ProjectHome` and loader handoff.

- confirmed by source inspection: ProjectHome path selection and reopen handling produce loaded project payloads and then handoff to App.
- confirmed by accepted PKG-A evidence: missing-ID paths are no longer remembered, and valid-ID paths still load and hand off canonical `projectId`.
- unresolved but not contradicted: project picker UX, display, and recents presentation do not directly affect write-target selection in the inspected seams.

PKG-D should not absorb project picker behavior unless a later record proves that picker state directly changes project root, canonical `projectId`, active project identity, or write-target selection used by persistence/recovery/restore.

## 13. Identity inputs observed at each relevant seam

Renderer App actions:

- canonical `projectId`: `projectSummary.projectId`.
- project path/root: `projectSummary.path` exists for UI context and reveal paths.
- metadata identity: enters App through `LoadedProject.projectId` after loader handoff.
- active/selected project state: `projectSummary`, `activeProject`, and App state after A1 acceptance.

ProjectHome/load handoff:

- canonical `projectId`: `response.project.projectId`.
- project path/root: `response.project.path`.
- metadata identity: parsed from `project.json.project_id`.
- active/selected project state: ProjectHome local `activeProject` plus `onProjectLoaded` handoff.

Preload/service bridge:

- canonical `projectId`: request `projectId` serialized to `project_id` or `projectId`.
- project path/root: generally absent from backend write-target requests; exception is `getLastVerification`, which reads a local report from optional `projectPath`.
- metadata identity: not re-read by bridge.
- active/selected project state: not present beyond request payload.

Backend routers and services:

- canonical `projectId`: request `project_id` or `projectId`.
- project path/root: generally resolved as `settings.project_base_dir / project_id`.
- metadata identity: sometimes read from `project.json` for restore/backup verification validation, duplicate matching, or source-project checks.
- active/selected project state: backend does not receive renderer active path in the inspected write-target requests.

## 14. Missing-ID behavior observed statically

- confirmed by accepted PKG-A evidence: renderer App activation fails closed when `projectId` is missing.
- confirmed by accepted PKG-A evidence: ProjectHome no longer persists missing-ID remembered paths.
- confirmed by source inspection: backend request models and validators generally require non-empty `project_id` / `projectId` before write-target operations.
- contained: loader tolerance of missing `project_id` remains, but accepted PKG-A renderer seams contain the previously proved missing-ID contradictions.
- unresolved but not contradicted: isolated helper seams such as `validateRestoreSnapshot` assume `projectSummary` validity, but normal App state creation is governed by A1.

## 15. Divergent path/metadata-ID behavior observed statically

- confirmed by accepted PKG-A evidence: loader and App preserve explicit metadata `projectId` when filesystem path basename differs.
- confirmed by accepted PKG-A evidence: ProjectHome details now visibly expose canonical Project ID for loaded valid-ID projects.
- confirmed by source inspection: renderer write-target requests generally send canonical `projectId`, not active loaded project path.
- confirmed by source inspection: backend write-target routers generally derive roots as `settings.project_base_dir / project_id`.
- narrow unresolved seam needing witness: for a loaded project where `path=/projects/path-beta` and `projectId=proj_alpha`, the renderer/backend chain may target `/projects/proj_alpha` for writes while the active loaded root is `/projects/path-beta`. Static evidence shows the chain shape, but a bounded witness is needed to prove runtime reachability and classify actual wrong-root behavior for the broad write-target family.
- contradiction proved by static evidence: backup verification report persistence intentionally writes `last_verification.json` to every project root whose `project.json` advertises the requested `project_id`, not just one canonical active root.

## 16. Wrong-root / wrong-project proof standard

Wrong-root or wrong-project write risk is proved only if accepted evidence shows that a write, restore, recovery, snapshot, export, save, or edit operation can target a project root or project identity different from the canonical active project identity intended by the user/system contract.

Not enough by itself:

- path and `projectId` both exist
- a function accepts a path
- a TODO mentions recovery
- a seam is not fully proven
- a field name is ambiguous

Those are classified as unresolved but not contradicted unless an actual path from input to unsafe target is shown.

Applied standard:

- The broad `projectId -> settings.project_base_dir / project_id` backend pattern is a narrow unresolved seam needing witness under divergent active path scenarios, because static inspection shows plausible mismatch but does not prove all runtime preconditions for each operation.
- The backup verifier alias-report behavior is stronger: source and an existing test show a write to both canonical and alias roots for one requested `projectId`. This is not just ambiguity; it is a source/test-supported over-broad write-target behavior.

## 17. Finding classification table

| Finding | Evidence status | Classification | Notes |
| --- | --- | --- | --- |
| A1 missing-ID App fail-closed behavior remains effective | confirmed by executable witness | resolved | Inherited from PKG-A; not reopened. |
| ProjectHome missing-ID remembered-path persistence remains repaired | confirmed by executable witness | resolved | Inherited from PKG-A; not reopened. |
| Valid-ID remembered-path behavior remains preserved | confirmed by executable witness | resolved | Inherited from PKG-A. |
| ProjectHome canonical ID details visibility remains repaired | confirmed by executable witness | resolved | Inherited from PKG-A. |
| Loader missing-ID tolerance remains | confirmed by source inspection and prior witness | contained | Contained by A1 and ProjectHome hygiene for accepted renderer seams. |
| Renderer App snapshot/export/recovery/verification requests gate on `projectSummary.projectId` | confirmed by source inspection | contained | Missing-ID requests are blocked at App-managed action seams. |
| Preload serializes project-bound write/recovery/restore/export requests by `projectId` / `project_id` | confirmed by source inspection | unresolved but not contradicted | Correct identity is passed, but active path is generally absent. |
| Backend recovery/snapshot/export/backup/draft target roots derive from `settings.project_base_dir / project_id` | confirmed by source inspection | narrow unresolved seam needing witness | Potential divergent active-path mismatch needs bounded witness before mutation scope. |
| Backup verifier run writes `last_verification.json` to every root advertising the requested `project_id` | confirmed by source inspection and existing test | contradiction proved by static evidence | `services/tests/test_backup_verifier_report.py` asserts both canonical and alias report paths exist. Mutation still forbidden until a later scope decision record. |
| Recovery restore helper validation does not independently check non-empty `projectSummary.projectId` | confirmed by source inspection | contained | Normal App state creation is governed by A1; alternate caller reachability is unproved. |
| Draft generation/acceptance write through projectId-derived roots | confirmed by source inspection | narrow unresolved seam needing witness | PKG-D-relevant because these are write seams. |
| Project picker UX affects write targets | unresolved | out-of-scope deferred | No direct write-target dependency was proved by this baseline. |
| Recents identity visibility and divergence-warning UX | confirmed deferred by PKG-A records | out-of-scope deferred | Not PKG-D unless direct write-target dependency is proved. |

## 18. Baseline-to-next-action decision table

| Finding type | Next action |
| --- | --- |
| resolved | Carry to reassessment / possible closure path. |
| contained | Carry to reassessment / possible closure path. |
| unresolved but not contradicted | Defer to named home unless a narrow witness is justified. |
| narrow unresolved seam needing witness | Witness plan may be recommended only for that seam. |
| contradiction proved by static evidence | Mutation remains forbidden until scope; recommend scope decision record or bounded confirmation witness. |
| protected evidence required | Stop and require separate authorization before touching protected evidence. |
| out-of-scope deferred | Defer to named home; do not absorb into PKG-D. |

Applied next action:

- Backup verifier multi-root report persistence is source/test-supported strongly enough to require a PKG-D scope decision record or a bounded confirmation witness if reviewers want executable confirmation before scope.
- Broad divergent active-path versus projectId-derived backend root behavior justifies a narrow witness plan if the scope decision does not already cover the relevant target-handling boundary.
- No mutation is authorized by this baseline.

## 19. Candidate witness lanes, only if justified

Witness lane A: divergent active path versus backend projectId-root resolution

- Justification: confirmed source chain shows renderer sends only `projectId` for multiple write-target operations while backend derives roots from `settings.project_base_dir / project_id`; PKG-A proved divergent active path and metadata ID can be preserved.
- Question: for a valid loaded project whose path basename differs from metadata `projectId`, do snapshot, export, recovery, restore, draft generation, or draft acceptance target the loaded active root or `base_dir / projectId`?
- Evidence type needed: bounded unit-level or integration-light witness using synthetic temp roots, not protected projects.
- What would prove contradiction: accepted evidence that a write/restore/snapshot/export/save/edit operation targets a root different from the active loaded project root intended by the user/system contract.
- What would remain unresolved: request formation alone without target observation.

Witness lane B: backup verifier duplicate-ID report write confirmation

- Justification: source and existing test already show `last_verification.json` is written to both canonical and alias roots sharing one `project_id`.
- Question: is this accepted as a static contradiction now, or does review require a bounded confirmation witness before scoping?
- Evidence type needed only if requested: targeted existing test review or a bounded test asserting report writes are restricted to the intended project root.
- What would prove contradiction: executable evidence matching the existing source/test finding that a single verification run writes report state to more than one project root.
- Current baseline position: scope decision is already supportable from static source/test evidence.

No broad witness plan is recommended. Witness planning is justified only for the named seams above.

## 20. Deferral homes for out-of-scope findings

| Item | Deferral home | Reason |
| --- | --- | --- |
| Recents identity visibility | PKG-E or later visibility/diagnostic polish | PKG-A deferred it as non-blocking and this baseline found no direct write-target dependency. |
| Divergence warning behavior | PKG-E or later visibility/diagnostic polish | ProjectHome canonical ID visibility was repaired; warning UX is not a PKG-D write-target requirement. |
| App UI outside ProjectHome details | PKG-E or later visibility lane | No direct persistence/recovery/restore target dependency was proved. |
| General UX polish | PKG-E or later product UX work | Outside persistence/recovery/restore/write-target identity safety. |
| Project picker UX if it does not affect write-target selection | Later picker evidence lane or PKG-E | Baseline did not prove direct write-target dependency. |
| Loader missing-ID diagnostics | Later loader-diagnostics scope or later Stage 14 closure review | Loader tolerance is contained by PKG-A renderer seams unless persistence evidence later requires loader behavior changes. |
| Loader diagnostic UX/presentation | PKG-E or later visibility/diagnostic polish | Presentation is not PKG-D write-target safety. |
| Loader behavior directly affecting write-target identity/root safety | PKG-D may inspect only as needed | Only direct write-target dependency brings it into PKG-D. |

Stage 15 remains blocked by current Stage 14 governance. PKG-D closure alone does not make Stage 15 eligible.

## 21. Protected evidence posture

Protected evidence was not touched:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

No fixture materialization, receipt creation, recovery execution, restore execution, backend write, protected evidence regeneration, or snapshot update was performed.

## 22. Baseline verdict

PZ_CONTINUE: PKG-D scope decision required

Rationale:

- A source/test-supported backup-verifier finding shows verification report persistence can write to multiple roots that advertise the same `project_id`.
- Mutation remains forbidden until a later reviewed scope. The next record should decide whether the static finding is sufficient for a bounded scope or whether a small confirmation witness is required first.
- A separate divergent active-path versus projectId-derived backend-root witness is justified if reviewers choose to continue evidence gathering beyond the backup-verifier scope decision.
