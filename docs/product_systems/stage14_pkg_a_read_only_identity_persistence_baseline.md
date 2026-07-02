# Stage 14 PKG-A Read-Only Identity and Persistence Baseline

## 1. Scope and method

This baseline records current committed repository evidence for runtime project identity, active-project selection, and persistence destination authority. It uses current Stage 12 through Stage 14 records as controlling product authority and current source, configuration, and tests as evidence only.

Evidence classes used below:

1. confirmed by controlling product record
2. confirmed by current source code
3. confirmed by current configuration
4. confirmed by current test
5. inferred from multiple sources
6. unresolved
7. contradictory

## 2. Controlling records inspected

1. `docs/product_systems/stage14_salvage_execution_program.md`
2. `docs/product_systems/stage14_pkg_c_closure_record.md`
3. `docs/product_systems/stage13_salvage_completion_plan.md`
4. `docs/product_systems/stage12_architecture_readiness_contract.md`
5. `docs/product_systems/current_truth_index.md`
6. `docs/product_systems/stage12_project_identity_binding_contract.md`
7. `docs/product_systems/stage12_migration_copy_identity_contract.md`
8. `docs/product_systems/stage12_evidence_retention_last_witness_contract.md`
9. `docs/product_systems/project_persistence_local_save.md`
10. `docs/product_systems/snapshot_protected_recovery_contract.md`
11. `docs/product_systems/snapshots_backup_restore_history.md`
12. `docs/product_systems/import_export_document_interchange.md`

## 3. Runtime files inspected

1. `app/main/projectLoaderIpc.ts`
2. `app/shared/ipc/projectLoader.ts`
3. `app/electron/projectLoader.ts`
4. `app/renderer/App.tsx`
5. `app/renderer/components/ProjectHome.tsx`
6. `app/renderer/components/SnapshotsPanel.tsx`
7. `app/renderer/hooks/useRecovery.ts`
8. `app/renderer/recovery/actions.mjs`
9. `app/renderer/utils/draftPreviewSync.ts`
10. `app/renderer/types/project.ts`
11. `app/shared/ipc/services.ts`
12. `services/src/blackskies/services/config.py`
13. `services/src/blackskies/services/persistence/draft.py`
14. `services/src/blackskies/services/persistence/outline.py`
15. `services/src/blackskies/services/persistence/snapshot.py`
16. `services/src/blackskies/services/backup_service.py`
17. `services/src/blackskies/services/export_service.py`
18. `services/src/blackskies/services/restore_service.py`
19. `services/src/blackskies/services/routers/recovery.py`
20. `services/src/blackskies/services/routers/restore.py`
21. `services/src/blackskies/services/routers/draft/acceptance.py`
22. `services/src/blackskies/services/operations/draft_accept.py`
23. `app/renderer/__tests__/ProjectHome.test.tsx`
24. `app/renderer/__tests__/useRecovery.test.tsx`
25. `app/offline-tests/AppRecovery.offline.test.mjs`

## 4. Product authority baseline

### 4.1 Confirmed product authority

1. Stable project identity must not be silently derived from folder path, display name, or recents state. Evidence class: confirmed by controlling product record. Evidence: `stage12_project_identity_binding_contract.md`.
2. Runtime behavior is evidence, not product authority. Evidence class: confirmed by controlling product record. Evidence: `stage14_salvage_execution_program.md`, `stage14_pkg_c_closure_record.md`.
3. Current accepted project truth and local save authority belong to the local save contract, not to snapshots or backup history. Evidence class: confirmed by controlling product record. Evidence: `project_persistence_local_save.md`, `snapshots_backup_restore_history.md`.
4. Recovery and restore are distinct lifecycles and must not silently redefine current-save authority. Evidence class: confirmed by controlling product record. Evidence: `snapshot_protected_recovery_contract.md`, `snapshots_backup_restore_history.md`.
5. Copy and import must not silently inherit incompatible authority. Evidence class: confirmed by controlling product record. Evidence: `stage12_migration_copy_identity_contract.md`, `import_export_document_interchange.md`.

### 4.2 PKG-A doctrine carried forward

1. Project identity is distinct from project path.
2. Active-project selection is distinct from persistence destination.
3. Snapshot identity and historical evidence are distinct from current runtime authority.
4. Unknown, missing, conflicting, and ambiguous state should remain visible rather than fabricated.

## 5. Identity ownership baseline

### 5.1 Current evidence

1. Project identity is stored in `project.json` as `project_id` when metadata is present. Evidence class: confirmed by current source code. Evidence: `app/main/projectLoaderIpc.ts`.
2. Project identity is generated during main-process project creation bootstrap before the created project is reloaded. Evidence class: confirmed by current source code. Evidence: `app/main/projectLoaderIpc.ts`.
3. Project identity is read by the main-process loader from `project.json` and returned in the loaded project payload. Evidence class: confirmed by current source code. Evidence: `app/main/projectLoaderIpc.ts`, `app/shared/ipc/projectLoader.ts`.
4. Renderer active-project state fabricates a fallback project identity from the basename of `project.path` when `project.projectId` is absent. Evidence class: confirmed by current source code. Evidence: `app/renderer/App.tsx`.
5. Backend persistence uses `project_id` as the root selector under `settings.project_base_dir`. Evidence class: confirmed by current source code and current configuration. Evidence: `services/src/blackskies/services/config.py`, `services/src/blackskies/services/persistence/draft.py`, `services/src/blackskies/services/persistence/outline.py`, `services/src/blackskies/services/routers/draft/acceptance.py`.
6. Directory names still influence runtime identity whenever the renderer fallback path-to-id derivation is used. Evidence class: confirmed by current source code. Evidence: `app/renderer/App.tsx`.
7. Project path and project identity are not fully separated in current runtime behavior. Evidence class: inferred from multiple sources. Evidence: `app/main/projectLoaderIpc.ts`, `app/renderer/App.tsx`, `services/src/blackskies/services/config.py`.
8. Multiple apparent identity owners exist today: metadata `project_id`, renderer basename fallback, and backend `project_base_dir / project_id` binding. Evidence class: confirmed by current source code.

### 5.2 Missing and conflicting identity behavior

1. When `project.json` is missing or unreadable, the loader can still resolve a project root through `outline.json` fallback and return a loaded project without canonical metadata proof. Evidence class: confirmed by current source code. Evidence: `app/main/projectLoaderIpc.ts`.
2. When metadata lacks `project_id`, renderer code can still assign a fallback identity from path basename. Evidence class: confirmed by current source code. Evidence: `app/renderer/App.tsx`.
3. Metadata bootstrap mismatches are surfaced as loader warnings and partial status, not as a global identity stop. Evidence class: confirmed by current source code. Evidence: `app/main/projectLoaderIpc.ts`.
4. No inspected source proved a single canonical conflict-resolution owner when metadata and directory context disagree. Evidence class: unresolved.
5. No inspected source proved a complete user-visible contract for conflicting identity across all runtime surfaces. Evidence class: unresolved.

## 6. Active-project ownership baseline

### 6.1 Current evidence

1. Renderer `ProjectHome` selects projects by path through `projectLoader.loadProject({ path })`. Evidence class: confirmed by current source code. Evidence: `app/renderer/components/ProjectHome.tsx`.
2. Successful loads are persisted into local storage recents and last-project state keyed by path. Evidence class: confirmed by current source code. Evidence: `app/renderer/components/ProjectHome.tsx`.
3. Renderer active-project authority is carried by `ProjectSummary { projectId, path, unitScope, unitIds }`. Evidence class: confirmed by current source code. Evidence: `app/renderer/types/project.ts`, `app/renderer/App.tsx`.
4. Recovery reopen requests are path-based and use remembered `lastProjectPath`, not canonical identity rebinding. Evidence class: confirmed by current source code. Evidence: `app/renderer/hooks/useRecovery.ts`, `app/renderer/recovery/actions.mjs`.
5. Draft preview synchronization persists path-scoped state in local storage using `projectPath` keys. Evidence class: confirmed by current source code. Evidence: `app/renderer/utils/draftPreviewSync.ts`, `app/renderer/App.tsx`.
6. Frontend and backend active-project state can diverge because the renderer carries both arbitrary loaded path and current projectId, while backend write paths are resolved solely from `project_id` under `project_base_dir`. Evidence class: inferred from multiple sources. Evidence: `app/renderer/App.tsx`, `app/renderer/components/ProjectHome.tsx`, `services/src/blackskies/services/config.py`.
7. Restart state survives through path persistence, not through a separately proven canonical active-project authority record. Evidence class: confirmed by current source code. Evidence: `app/renderer/components/ProjectHome.tsx`, `app/renderer/hooks/useRecovery.ts`.
8. Current tests confirm path-based recents fallback and path-based reopen behavior. Evidence class: confirmed by current test. Evidence: `app/renderer/__tests__/ProjectHome.test.tsx`, `app/offline-tests/AppRecovery.offline.test.mjs`.

### 6.2 Restart revalidation and stale paths

1. Current tests show stale recent entries are pruned only after load failure and can trigger fallback to the sample project path. Evidence class: confirmed by current test. Evidence: `app/renderer/__tests__/ProjectHome.test.tsx`.
2. No inspected source proved that a remembered path is revalidated against canonical identity ownership before it regains active-project authority. Evidence class: unresolved.
3. Recent-project state can become effective reopen input without a separately proven explicit author selection at restart time. Evidence class: confirmed by current source code. Evidence: `app/renderer/components/ProjectHome.tsx`, `app/renderer/hooks/useRecovery.ts`.
4. Stale paths can remain authoritative inputs until a load attempt fails. Evidence class: confirmed by current source code and current test. Evidence: `app/renderer/components/ProjectHome.tsx`, `app/renderer/__tests__/ProjectHome.test.tsx`.

## 7. Persistence ownership baseline

### 7.1 Current evidence

1. Current accepted-truth writes for draft acceptance are directed by backend `project_id`, not by the frontend loaded path. Evidence class: confirmed by current source code. Evidence: `services/src/blackskies/services/routers/draft/acceptance.py`, `services/src/blackskies/services/operations/draft_accept.py`, `services/src/blackskies/services/persistence/draft.py`.
2. Outline persistence also writes by backend `project_id` under `project_base_dir`. Evidence class: confirmed by current source code. Evidence: `services/src/blackskies/services/persistence/outline.py`.
3. Snapshot, backup, export, and recovery services all resolve project roots from `project_id` under `project_base_dir`. Evidence class: confirmed by current source code and current configuration. Evidence: `services/src/blackskies/services/persistence/snapshot.py`, `services/src/blackskies/services/backup_service.py`, `services/src/blackskies/services/export_service.py`, `services/src/blackskies/services/restore_service.py`, `services/src/blackskies/services/config.py`.
4. No inspected current bridge method proved a dedicated runtime Save As operation. Evidence class: unresolved. Evidence: `app/shared/ipc/services.ts`.
5. No inspected current bridge method proved a dedicated runtime copy-project operation. Evidence class: unresolved. Evidence: `app/shared/ipc/services.ts`.
6. No inspected current bridge method proved a dedicated runtime import-project operation. Evidence class: unresolved. Evidence: `app/shared/ipc/services.ts`.
7. Current persistence authority is explicit inside backend services, but the authority handoff from renderer path-bound state to backend `project_id` is only partially explicit. Evidence class: inferred from multiple sources. Evidence: `app/renderer/App.tsx`, `app/shared/ipc/services.ts`, `services/src/blackskies/services/config.py`.
8. Current code proves that some write paths can target a different root than the renderer-loaded path whenever `projectId` and `project.path` do not map to the same canonical root. Evidence class: inferred from multiple sources.

### 7.2 Save, Save As, copy, import, restore, recovery

1. Current source proves a save-like accepted-truth path for draft acceptance, but not a separate general Save destination chooser. Evidence class: confirmed by current source code.
2. No inspected runtime source proved whether Save As changes identity because no dedicated Save As implementation was found in the inspected bridge and service surfaces. Evidence class: unresolved.
3. No inspected runtime source proved whether copy changes identity because no dedicated copy implementation was found in the inspected bridge and service surfaces. Evidence class: unresolved.
4. No inspected runtime source proved whether import changes identity because no dedicated import implementation was found in the inspected bridge and service surfaces. Evidence class: unresolved.
5. Snapshot recovery restores current project files into the same backend project root for the supplied `projectId`. Evidence class: confirmed by current source code. Evidence: `services/src/blackskies/services/routers/recovery.py`, `services/src/blackskies/services/persistence/snapshot.py`.
6. Backup and ZIP restore create a new sibling restored copy and do not overwrite the current project folder. Evidence class: confirmed by current source code and current test-facing UI text. Evidence: `services/src/blackskies/services/routers/restore.py`, `services/src/blackskies/services/restore_service.py`, `services/src/blackskies/services/backup_service.py`, `app/renderer/components/SnapshotsPanel.tsx`.

## 8. Lifecycle matrix

| Operation | Identity before | Identity after | Path before | Path after | Persistence destination | Truth mutation | Storage-only mutation | Required author action | Ambiguity handling | Evidence confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Create | none | generated metadata `project_id` on bootstrap | selected parent path | created project root path | created root under selected parent, then later backend writes by `project_id` | no accepted truth proven at create time | project scaffold creation | explicit create action | loader bootstrap warnings possible; no broader ambiguity contract proved | confirmed by current source code |
| Open | metadata `project_id` if present, otherwise unresolved | metadata `project_id` or renderer basename fallback | chosen load path | resolved project root path | none from open alone | none | none | explicit open action | outline-only fallback and metadata warnings | confirmed by current source code |
| Reopen after restart | remembered path only | reloaded metadata `project_id` or renderer basename fallback | stored last-project path | reloaded project root path | none from reopen alone | none | recents and last-project updates | reopen input can be sourced from a remembered path | stale path survives until load failure | confirmed by current source code and current test |
| Save | current `projectId` | same `projectId` in inspected save-like path | renderer path may differ | backend root derived from `project_id` | `project_base_dir / project_id` | yes for accepted draft truth | snapshot side effect after acceptance | explicit author acceptance action | no explicit mismatch guard between path and backend root proved | inferred from multiple sources |
| Save As | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved |
| Copy | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved |
| Import | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved |
| Restore | current `projectId` | current source proves new restored copy materialization, not overwrite | current backend root by `projectId` | sibling restored path | restored sibling copy path | no current project truth overwrite in inspected restore flow | yes | explicit restore action | latest backup or latest zip may be inferred when no zip is chosen | confirmed by current source code |
| Recovery | current `projectId` | current `projectId` retained in inspected flow | current backend root by `projectId` | same backend root | same backend root | yes, current project files replaced by snapshot state | snapshot metadata/history read | explicit restore snapshot action | latest snapshot inferred when snapshot id omitted | confirmed by current source code and current test |
| Move | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved |
| Rename | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved | unresolved |
| Missing path | path missing | fallback sample path can become active load target after failure | stale remembered path | fallback sample path or failure | none from load failure alone | none | recents pruning and last-project updates | author action not required for stale-path persistence; explicit open/load attempt still occurs | fallback to sample path rather than canonical identity proof | confirmed by current source code and current test |
| Conflicting metadata | metadata conflict | partial load with warnings proven; final canonical owner unresolved | chosen load path | resolved project root path | unresolved | unresolved | none proven | explicit load/open action | warning and partial status only | confirmed by current source code plus unresolved canonical owner |
| Ambiguous identity | missing or mismatched identity | renderer fallback can fabricate basename identity | chosen or remembered path | resolved project root path | backend still uses `projectId` when provided | unresolved | possible state caching by path | explicit or remembered load path | no single cross-surface rule proved | inferred from multiple sources |

## 9. Recovery and snapshot baseline

1. Snapshot identity is historical evidence associated with a backend `project_id` snapshot directory; no inspected source proved it becomes a separate current project identity. Evidence class: inferred from multiple sources. Evidence: `services/src/blackskies/services/persistence/snapshot.py`, `services/src/blackskies/services/routers/recovery.py`.
2. Recovery restore preserves the current `projectId` in the inspected API shape and writes into the current backend project root. Evidence class: confirmed by current source code.
3. Recovery can override current project files for the supplied `projectId`. Evidence class: confirmed by current source code and current test. Evidence: `services/src/blackskies/services/routers/recovery.py`, `services/src/blackskies/services/persistence/snapshot.py`, `app/renderer/__tests__/useRecovery.test.tsx`.
4. Backup or ZIP restore materializes a separate restored copy and does not overwrite the current project root. Evidence class: confirmed by current source code.
5. Recovery selection is keyed by current `projectId`; reopen selection is keyed by remembered path. Evidence class: confirmed by current source code.
6. Because recovery authority is `projectId`-bound while reopen authority is path-bound, a path/id mismatch could produce wrong-project recovery or post-recovery divergence unless later safeguards exist elsewhere. Evidence class: plausible, inferred from multiple sources.
7. No inspected source proved that historical snapshot state can never become current authority silently in the presence of path/id divergence. Evidence class: unresolved.

## 10. Copy, import, and Save As baseline

1. No inspected current runtime bridge or service surface proved a dedicated Save As lifecycle implementation. Evidence class: unresolved.
2. No inspected current runtime bridge or service surface proved a dedicated copy-project lifecycle implementation. Evidence class: unresolved.
3. No inspected current runtime bridge or service surface proved a dedicated import-project lifecycle implementation. Evidence class: unresolved.
4. Current restore-copy flows prove only backup or ZIP restore materialization into a sibling path; they do not prove the product contracts for copy, import, or Save As. Evidence class: confirmed by current source code.
5. PKG-A must treat copy, import, Save As, restore, and recovery as separate lifecycle operations unless later evidence proves otherwise. Evidence class: confirmed by controlling product record and current source evidence.

## 11. Alias and historical behavior

1. Sample-project compatibility paths still reference `sample_project/Esther_Estate` in inspected loader logic and tests. Evidence class: confirmed by current source code and current test. Evidence: `app/main/projectLoaderIpc.ts`, `app/electron/projectLoader.ts`, `app/renderer/__tests__/ProjectHome.test.tsx`.
2. Current inspected source did not prove that compatibility roots are prevented from becoming active runtime owners. Evidence class: unresolved.
3. Historical paths can become active runtime inputs through local-storage recents and last-project state. Evidence class: confirmed by current source code.
4. Current inspected source did not prove a clean distinction between projection and authority everywhere path aliases are used. Evidence class: plausible, inferred from multiple sources.
5. No inspected source proved that fixture identity logic is fully isolated from production runtime identity logic. Evidence class: plausible. Evidence: `app/main/projectLoaderIpc.ts`, `app/electron/projectLoader.ts`, renderer tests that assert sample fallback.

## 12. Identity-owner map

| File or module | State owned | Read responsibility | Write responsibility | Lifecycle events affected | Authority classification | Overlap or conflict |
| --- | --- | --- | --- | --- | --- | --- |
| `app/main/projectLoaderIpc.ts` | loaded project metadata, resolved root path, optional `projectId` | load project metadata and filesystem shape | create/bootstrap metadata during project creation; authorize path | create, open, reopen, sample fallback | apparent runtime intake owner | conflicts with renderer fallback identity and backend fixed-root ownership |
| `app/shared/ipc/projectLoader.ts` | shared loaded-project shape | expose optional `projectId` to renderer | none | open, create payload handoff | transport surface | inherits upstream ambiguity |
| `app/renderer/App.tsx` | `ProjectSummary.projectId` and active project summary | derive active renderer identity and path | fallback identity fabrication from path basename | open, reopen, save-facing service calls, recovery-facing service calls | apparent frontend active-project owner | conflicts with metadata-only identity and backend root resolution |
| `app/renderer/components/ProjectHome.tsx` | recents, last-project path, loaded project handoff | reopen path, load by path, display project details | persist recents and last-project path | open, reopen after restart, fallback sample load | path-based active-project intake owner | can promote stale or compatibility paths into active inputs |
| `app/renderer/hooks/useRecovery.ts` | remembered `lastProjectPath`, recovery status | fetch recovery by `projectId`, reopen by path | update remembered reopen path in hook state | recovery, reopen after restart | split authority surface | path/id split creates divergence risk |
| `app/renderer/utils/draftPreviewSync.ts` | local draft preview sync keyed by path | load local preview state | persist local preview state | active editing session persistence | path-scoped cache owner | path may outlive canonical identity rebinding |
| `services/.../config.py` plus persistence and router modules | backend persistence-root resolution by `project_id` | read settings and compute project root | write accepted truth, snapshots, backups, exports, recovery target | save, recovery, restore, export, backup | apparent backend persistence owner | conflicts with arbitrary renderer-loaded path when path and id diverge |

## 13. Persistence-owner map

| File or module | Destination-selection responsibility | Write responsibility | Path derivation | Project-ID dependency | Recovery dependency | Ambiguity handling | Overlap or conflict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `services/src/blackskies/services/routers/draft/acceptance.py` | selects accepted-truth target from request `project_id` | orchestrates draft acceptance write flow | `project_base_dir / project_id` | required | recovery tracker integration | no explicit path/id mismatch guard found | may write somewhere other than renderer-loaded path |
| `services/src/blackskies/services/persistence/draft.py` | derive scene draft destination | write scene markdown | `project_base_dir / project_id / drafts` | required | none direct | assumes projectId is authoritative | fixed-root owner |
| `services/src/blackskies/services/persistence/outline.py` | derive outline destination | write outline file | `project_base_dir / project_id / outline.json` | required | none direct | assumes projectId is authoritative | fixed-root owner |
| `services/src/blackskies/services/persistence/snapshot.py` | derive snapshot root and recovery overwrite target | restore snapshot into current project root | `project_base_dir / project_id / history/snapshots` and current root | required | direct | latest snapshot inferred when omitted | overwrite semantics differ from restore-copy flows |
| `services/src/blackskies/services/routers/recovery.py` | select recovery target and snapshot | invoke snapshot recovery | current root by `project_id` | required | direct | latest snapshot inferred when no id provided | conflicts with path-based reopen authority |
| `services/src/blackskies/services/restore_service.py` | select restored-copy destination | materialize sibling restored copy | sibling path beside `project_base_dir / project_id` root | required | indirect historical dependency on exports/backups | validates against overwrite/current-root overlap | distinct authority model from recovery |
| `services/src/blackskies/services/routers/restore.py` | select backup or zip restore copy flow | invoke restore copy materialization | backend root by `project_id`, output sibling restored path | required | historical artifact lookup | chooses latest backup or latest zip when inputs omitted | differs from current-file recovery contract |
| `services/src/blackskies/services/backup_service.py` | select backup archive source and restore-as-new destination | archive and restore backup copy | current root and sibling restored copy under base dir | required | historical backup dependency | validates restore target | distinct from save and recovery |
| `services/src/blackskies/services/export_service.py` | select export destination | write export and zip outputs | `project_base_dir / project_id / exports` | required | historical artifact producer | assumes `project_id` authority | export history is not current-save authority |

## 14. Risk register

| Risk | Classification | Exact repository evidence |
| --- | --- | --- |
| 1. project-ID and path conflation | confirmed | `app/renderer/App.tsx` derives `projectId` from path basename; `ProjectHome.tsx` persists path; backend writes by `project_id` under `project_base_dir` in `services/.../config.py`, `persistence/draft.py`, `routers/draft/acceptance.py` |
| 2. copied-project identity inheritance | unresolved | no dedicated copy lifecycle implementation found in `app/shared/ipc/services.ts`; current restore-copy flows in `restore_service.py` do not prove product copy contract |
| 3. import identity ambiguity | unresolved | no dedicated import lifecycle implementation found in inspected bridge or services; product authority still requires distinction |
| 4. Save As identity ambiguity | unresolved | no dedicated Save As lifecycle implementation found in inspected bridge or services |
| 5. restore authority ambiguity | plausible | `routers/restore.py` and `restore_service.py` clearly create sibling copies, but no inspected source proves how restored copy identity is rebound into active-project authority |
| 6. recovery authority ambiguity | plausible | recovery overwrites current backend root by `projectId` in `routers/recovery.py` and `persistence/snapshot.py`, while reopen is path-based in `useRecovery.ts` and `actions.mjs` |
| 7. stale active-project state | confirmed | `ProjectHome.tsx` persists `blackskies.last-project`; tests show stale path survives until failure and then sample fallback occurs in `ProjectHome.test.tsx` |
| 8. aliases becoming canonical owners | plausible | sample compatibility roots appear in `projectLoaderIpc.ts`, `app/electron/projectLoader.ts`, and `ProjectHome.test.tsx`; no inspected source proves strict projection-only enforcement |
| 9. persistence to stale or historical paths | plausible | renderer state is path-based while backend writes are id-based; divergence risk shown across `App.tsx`, `ProjectHome.tsx`, and backend persistence modules |
| 10. historical assumptions surviving in runtime code | confirmed | compatibility/sample-path logic remains in `projectLoaderIpc.ts`, `app/electron/projectLoader.ts`, and tests asserting sample fallback |
| 11. shared helpers across incompatible lifecycle operations | plausible | `projectId`-based backend root resolution is reused across save/recovery/restore surfaces even though recovery overwrites current root and restore creates sibling copy |
| 12. missing or conflicting identity hidden by fallback | confirmed | loader allows outline-only fallback in `projectLoaderIpc.ts`; renderer fabricates basename identity in `App.tsx` |
| 13. frontend/backend active-project divergence | plausible | frontend stores `projectId` plus arbitrary path; backend writes by fixed `project_id` root; see `App.tsx`, `ProjectHome.tsx`, `config.py`, `persistence/draft.py` |
| 14. inadequate rollback boundaries | plausible | recovery and restore already use distinct authority models in `routers/recovery.py` and `routers/restore.py`; identity and path are split across frontend and backend surfaces |

## 15. Lifecycle findings

1. Current runtime intake is path-first in the renderer and loader, but accepted-truth persistence is `projectId`-first in backend services. Evidence class: inferred from multiple sources.
2. The renderer can fabricate identity from directory name when metadata identity is absent. Evidence class: confirmed by current source code.
3. Active-project restart persistence is path-based through local storage recents and last-project state. Evidence class: confirmed by current source code.
4. Recovery and restore already operate under different destination-authority models: recovery overwrites current backend root; restore materializes a sibling copy. Evidence class: confirmed by current source code.
5. Current inspected runtime does not prove dedicated Save As, copy, or import lifecycles. Evidence class: unresolved.
6. Compatibility/sample-path behavior remains live in runtime evidence and tests, so alias and historical-path concerns are not retired. Evidence class: confirmed by current source code and current test.

## 16. Contradictions and unresolved authority boundaries

### 16.1 Contradictions

1. Product authority requires stable identity distinct from path, but current renderer behavior still derives identity from path basename when metadata is absent. Evidence class: contradictory. Evidence: `stage12_project_identity_binding_contract.md`, `app/renderer/App.tsx`.

### 16.2 Unresolved boundaries

1. No single inspected source proves the canonical owner when metadata identity, directory context, and remembered path disagree.
2. No inspected source proves the current runtime contract for Save As.
3. No inspected source proves the current runtime contract for copy.
4. No inspected source proves the current runtime contract for import.
5. No inspected source proves the identity contract for a newly restored sibling copy after backup or ZIP restore.
6. Plausible authority gap: current reopen input remains path-based while recovery targeting is `projectId`-based. This creates a risk of divergent project selection and mutation authority when path and identity disagree. Current evidence does not prove silent transfer of historical recovery state into current-save authority. Evidence class: plausible, inferred from multiple sources. Evidence: `app/renderer/hooks/useRecovery.ts`, `app/renderer/recovery/actions.mjs`, `services/src/blackskies/services/routers/recovery.py`.

## 17. Stage 12 reopening recommendation

Recommendation: do not reopen Stage 12 yet, but keep reopening live as a likely next gate if PKG-A later executable proof or narrower source review cannot identify one canonical runtime identity owner and one canonical persistence-authority handoff.

Current basis:

1. Stage 12 product authority is specific enough for PKG-A read-only analysis.
2. Current repository evidence already shows runtime divergence and contradiction without proving that the Stage 12 contract itself is missing.
3. Reopening should be triggered if later proof cannot resolve canonical runtime ownership for identity, restore, recovery, and destination authority without altering Stage 12 doctrine.

Reopen immediately if any later authorized witness confirms:

1. no canonical identity owner can be enforced,
2. restore or recovery truth mutation cannot be assigned to one authority model,
3. persistence destination can change without explicit authority,
4. aliases operate as both compatibility projection and canonical owner, or
5. copy, import, Save As, restore, and recovery cannot be reconciled under one lifecycle contract.

## 18. Package-split recommendation

Recommendation: no immediate split during the read-only baseline, but prepare to split if executable proof shows identity rebinding and persistence/recovery rebinding cannot share rollback boundaries.

Current basis:

1. Identity intake and active-project selection are already split across loader, renderer, and backend surfaces.
2. Recovery overwrite and restore-copy flows already use distinct authority models.
3. The read-only evidence is not yet enough to prove that one mutation package can safely carry identity rebinding, destination rebinding, and recovery/restore rebinding together.

Split PKG-A later if:

1. recovery requires a distinct mutation sequence from normal persistence authority;
2. copy or import prove to be independent lifecycles with separate identity rules; or
3. rollback-safe executable proof cannot isolate one package boundary.

## 19. Candidate later witnesses

These are candidate witnesses only. They were not run during PKG-A.

| Witness | Exact command or test | Files exercised | Mutation risk | Protected-evidence risk | What it would prove | What it would not prove |
| --- | --- | --- | --- | --- | --- | --- |
| valid identity load | `cmd /c pnpm --filter app test -- --run app/renderer/__tests__/ProjectHome.test.tsx --testNamePattern "creates a blank project through the loader-authoritative bootstrap path"` | `ProjectHome.tsx`, loader bridge mocks | low | low if isolated test fixtures only | create/load path expects loader-supplied `projectId` on success | does not prove backend save destination or restart revalidation |
| missing identity | targeted unit or offline witness against `loadProjectFromDisk` with `project.json` omitted; must use isolated temporary fixtures, must not use either Esther Estate retained root, must not materialize over protected evidence, and must not create receipts in protected roots | `app/main/projectLoaderIpc.ts` | medium | medium if real fixture dirs are used | whether outline-only fallback loads without canonical metadata | does not prove renderer/backend convergence after load |
| conflicting identity | targeted unit witness for metadata/bootstrap mismatch warnings; must use isolated temporary fixtures, must not use either Esther Estate retained root, must not materialize over protected evidence, and must not create receipts in protected roots | `app/main/projectLoaderIpc.ts` | medium | medium | whether current loader surfaces partial/warning state | does not prove global conflict resolution owner |
| stale active path | `cmd /c pnpm --filter app test -- --run app/renderer/__tests__/ProjectHome.test.tsx --testNamePattern "removes stale recent entries"` | `ProjectHome.tsx` | low | low | path-based recents persistence and stale-path fallback behavior | does not prove canonical identity recovery |
| restart revalidation | targeted app or hook witness around `lastProjectPath` reopen flow | `ProjectHome.tsx`, `useRecovery.ts`, `actions.mjs` | low | low | whether restart uses remembered path as authority input | does not prove backend destination safety |
| copy | no safe current witness identified from inspected source | unresolved | unresolved | unresolved | unresolved | unresolved |
| import | no safe current witness identified from inspected source | unresolved | unresolved | unresolved | unresolved | unresolved |
| Save As | no safe current witness identified from inspected source | unresolved | unresolved | unresolved | unresolved | unresolved |
| restore | targeted service unit witness for `/restore` or `restore_service` copy semantics | `routers/restore.py`, `restore_service.py`, `backup_service.py` | medium | medium if it materializes temp restored copies | sibling-copy restore semantics and no-overwrite guard | does not prove active-project rebinding after restore |
| recovery | existing narrow witness in `app/renderer/__tests__/useRecovery.test.tsx` and `app/offline-tests/AppRecovery.offline.test.mjs` | `useRecovery.ts`, `actions.mjs`, services bridge mocks | low | low | restore snapshot call is `projectId`-bound and updates recovery status | does not prove wrong-project protection under path/id divergence |
| persistence-destination mismatch | new later-authorized integration witness comparing loaded path versus backend write root for same `projectId` | `App.tsx`, backend persistence modules | high | high if real project roots are touched | whether frontend/backend divergence can misdirect writes | does not prove the product-preferred fix by itself |

## 20. Claims not proved

PKG-A did not prove:

1. one canonical runtime identity owner across loader, renderer, and backend;
2. a dedicated Save As contract in current runtime;
3. a dedicated copy contract in current runtime;
4. a dedicated import contract in current runtime;
5. that restored sibling copies receive a compliant identity rebinding contract;
6. that recovery cannot target the wrong project when path and `projectId` diverge;
7. that aliases are projection-only in every runtime surface;
8. that historical paths cannot regain authority through remembered state.
