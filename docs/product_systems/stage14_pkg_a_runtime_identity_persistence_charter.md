# Stage 14 PKG-A Runtime Identity and Persistence Charter

## 1. Package purpose

PKG-A establishes the read-only authority map and evidence baseline for runtime project identity and persistence before any implementation mutation is considered. Its purpose is to determine who currently owns project identity, active-project selection, and persistence destination selection; where those authorities overlap or conflict; and which later mutation sequence, if any, is required to rebind runtime behavior to Stage 12 through Stage 14 product authority.

Runtime behavior is evidence, not product authority.

## 2. Exact in-scope questions

PKG-A is limited to these questions:

1. What current committed records control runtime identity and persistence authority?
2. Where is project identity stored, generated, loaded, cached, and persisted?
3. Where is project path treated as evidence, projection, alias, or authority?
4. Who selects the active project, and what survives restart?
5. Who chooses the persistence destination for current accepted truth?
6. How do create, open, reopen, save, Save As, copy, import, restore, and recovery currently affect identity and destination authority?
7. Where do current runtime surfaces hide, fabricate, or infer identity, path, or authority?
8. Which risks are confirmed, plausible, unresolved, or contradictory from current committed evidence?
9. Does the current evidence require a Stage 12 reopening or a package split before implementation work can be safely authorized?

## 3. Explicit out-of-scope work

PKG-A does not authorize or include:

1. Implementation mutation.
2. Test mutation.
3. Runtime witness execution that mutates projects, snapshots, backups, receipts, or fixtures.
4. Commit, push, branch change, stash, reset, cleanup, refactor, migration, or salvage execution.
5. Product authority rewrites.
6. Mutation A1 selection or start.
7. Any claim that current runtime behavior is already correct unless the controlling records explicitly prove it.

## 4. Controlling authority

PKG-A is controlled by the current committed Stage 12 through Stage 14 product records, with current truth indexes used to identify the active authorities.

Controlling records:

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

Authority precedence for PKG-A:

1. Current truth index and current controlling Stage 14 through Stage 12 records.
2. Current committed runtime source, configuration, and tests as evidence only.
3. Historical assumptions only when still named by a current controlling record.

## 5. Protected evidence

PKG-A must not mutate, regenerate, normalize, replace, or delete:

1. `sample_project/proj_esther_estate/**`
2. `sample_project/Esther_Estate/**`
3. `build/truth_receipts/**`
4. `build/runtime_truth.json`
5. `build/runtime_truth.schema.json`
6. `ci_artifacts/**`
7. tracked snapshots
8. IPC snapshot evidence

PKG-A must not run fixture materialization, receipt generation, snapshot rewrite, restore, recovery, or copy workflows against protected evidence.

## 6. Probable runtime surfaces

The current read-only baseline is expected to inspect only the minimum necessary surfaces, including:

1. Main-process project loading and bootstrap paths.
2. Renderer active-project state and restart persistence.
3. Services bridge methods that use `projectId`.
4. Backend persistence routers and persistence helpers.
5. Recovery, snapshot, backup, and restore services.
6. Narrow tests that reveal claimed runtime behavior without mutating fixtures.

## 7. Identity and persistence vocabulary

PKG-A uses these terms distinctly and must not collapse them:

1. Project identity: the canonical runtime identifier for a project, if one exists.
2. Project path: the filesystem location used to load or reveal project material.
3. Active-project selection: the current runtime binding that determines which project surface is active.
4. Persistence destination: the location that current accepted truth writes target.
5. Source project: the project material from which an operation begins.
6. Copied project: a separately materialized project created from a source project.
7. Imported project: external material brought into the runtime and staged or mapped into project structures.
8. Opened project: a project loaded from an existing path.
9. Restored project: a project or copy materialized from backup or export restore flows.
10. Recovered project: the current project state after recovery snapshot application.
11. Snapshot identity: the identity carried by historical snapshot evidence, if any.
12. Recovery state: state indicating interrupted truth mutation and eligible recovery actions.
13. Alias or compatibility projection: a historical or compatibility path or label that may refer to a project without becoming canonical authority.
14. Historical evidence: prior receipts, snapshots, backups, paths, or fixtures that document history without becoming current authority.
15. Current runtime authority: the currently effective owner for identity, active-project selection, or persistence destination.

## 8. Entry conditions

PKG-A may proceed only when:

1. Repository HEAD begins with `b063363`.
2. The current branch is `salvage/minimal-two-surface-shell`.
3. Branch and upstream are synchronized.
4. The worktree is clean before PKG-A documentation starts.
5. No implementation, test, or evidence-mutation work is performed.
6. The current truth index and controlling Stage 12 through Stage 14 records are available for inspection.

## 9. Exit conditions

PKG-A exits only when both authorized documents exist and are reviewable:

1. `docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md`
2. `docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`

The baseline must include:

1. Controlling authority summary.
2. Runtime owner maps for identity and persistence.
3. Lifecycle matrix.
4. Recovery and snapshot authority baseline.
5. Copy, import, and Save As evidence summary.
6. Evidence classification for each material conclusion.
7. Risk register with exact repository evidence.
8. Stage 12 reopening recommendation.
9. Package-split recommendation.
10. Candidate later witnesses that remain read-only at this stage.

## 10. Mutation authorization rules

PKG-A is read-only except for the two authorized documentation files.

PKG-A must not:

1. mutate implementation or tests;
2. regenerate or rewrite IDs;
3. alter loaders, persistence destinations, restore flows, recovery flows, recents, or active-project logic;
4. update evidence files or snapshots;
5. select or start Mutation A1.

Any executable witness, mutation sequence, or code change requires later explicit authorization outside PKG-A.

## 11. Witness requirements

PKG-A may identify later witness candidates only when each witness is narrow, names exact files exercised, and states:

1. what the witness would prove;
2. what it would not prove;
3. mutation risk;
4. protected-evidence risk;
5. whether the witness is safe to execute in a later separately authorized pass.

PKG-A must not treat an unrun witness as proof.

## 12. Rollback expectations

Any later mutation sequence derived from PKG-A must preserve clear rollback boundaries for:

1. project identity rebinding,
2. active-project state rebinding,
3. persistence destination authority,
4. restore and recovery authority, and
5. compatibility alias handling.

If evidence shows those boundaries cannot be changed together safely, PKG-A must recommend a package split before implementation work begins.

## 13. Package-split conditions

PKG-A should recommend splitting only if evidence shows:

1. identity and persistence require incompatible rollback boundaries;
2. recovery requires a distinct authority model from normal save;
3. copy and import require independent mutation sequences;
4. unrelated identity systems would otherwise be changed together; or
5. executable proof cannot be isolated safely within one package.

PKG-A must not recommend splitting merely because the package is broad.

## 14. Stage 12 reopening conditions

PKG-A should recommend reopening Stage 12 only for genuine contract failure, including:

1. no canonical identity owner;
2. contradictory canonical identity owners;
3. undefined truth mutation authority during restore or recovery;
4. persistence destination without authority;
5. alias behavior that acts as both projection and canonical owner;
6. incompatible contracts across copy, import, Save As, restore, or recovery;
7. impossible proof requirements; or
8. a missing identity-migration lifecycle that prevents compliant implementation.

PKG-A must not recommend reopening for ordinary code difficulty, stale tests, or inconvenient implementation.

## 15. Claims PKG-A must not make

PKG-A must not claim, without direct proof from current controlling records and current committed evidence:

1. that project identity is canonical in runtime today;
2. that project path and project identity are already cleanly separated;
3. that active-project selection is singular and non-divergent across surfaces;
4. that persistence destination authority is explicit and safe;
5. that copy, import, Save As, restore, and recovery share one compatible lifecycle contract;
6. that aliases are harmless projections only;
7. that historical evidence cannot become runtime authority;
8. that recovery cannot target the wrong project;
9. that missing or conflicting identity is visibly surfaced everywhere;
10. that Stage 12 reopening is unnecessary before the read-only baseline is complete.
