# Stage 13 Data, Schema, Persistence, Migration, and Recovery Inventory

## 1. Purpose and Scope

This inventory records the current data structures, schemas, persistence paths, migrations, snapshots, backups, restore flows, and recovery behavior visible in the repository.

It distinguishes save, snapshot, backup, archive, export, import, restore, migration, recovery, and verification. It also distinguishes original, copied, restored, migrated, installation, device, display-name, and filesystem-path identity.

This pass is read-only inventory only. It does not edit code, schemas, migrations, data files, tests, configuration, or historical records. It does not run migrations or restores, rewrite data, or authorize Stage 14.

## 2. Repository and Pass 5 Checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Pass 5 checkpoint: `088cacf docs(product): inventory tests fixtures harnesses and evidence`
- Upstream posture at inspection: branch tracked `origin/salvage/minimal-two-surface-shell` with no ahead/behind discrepancy.
- Worktree posture before creation: clean.

## 3. Inspection Limits

This pass inspected current documentation and implementation needed to identify storage roots, schemas, identity bindings, snapshot/backup/restore paths, and failure handling.

It did not execute migration, restore, cleanup, archive, delete, or release work. It did not treat tests or reports as broad proof beyond their exercised lane.

## 4. Data Roots and Storage Locations

| Path or root | Artifact type | Apparent role | Storage format | Authority class | Identity assumptions | Ownership assumptions | Mutation behavior | Evidence quality | Major risk | Later verification pass | Final disposition pending |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `project_base_dir/<project_id>/` | Project root | Canonical project workspace for service-side persistence | Directory tree | Tier 5 runtime evidence plus Stage 12 identity rules | `project_id` is the binding key; path is location only | Project identity is owner-governed, not path-governed | Contains mutable project state and derived storage roots | Current code and contract evidence | Path or folder name could be mistaken for identity | Data/schema/persistence/migration/recovery pass | Pending |
| `project.json` | Project metadata | Stores project identity and bootstrap metadata | JSON | Stage 12 identity floor | `project_id`, `name`, `schema_version`, `bootstrap_state`, `bootstrap_template` | Project identity authority and local save owner | Written during bootstrap; read during load | Strong current code evidence | Display name or path may be overread as truth | Data/schema identity verification | Pending |
| `outline.json` | Outline schema | Stores project outline, acts, chapters, scenes | JSON | Stage 12 schema floor | `project_id` may be present but is not the only identity signal | Project persistence and outline authority; scene structures remain projections | Written during bootstrap; loaded and validated on project load | Strong current code evidence | Scene/chapter structure could be treated as foundational truth | Data/schema/persistence pass | Pending |
| `drafts/*.md` | Draft scene documents | Mutable scene drafts with front matter and body | Markdown with front matter | Stage 12 manuscript/state floor | Draft file name and scene id are not sufficient identity | Draft persistence owns write path for scene bodies | Atomically rewritten by draft persistence | Strong current code evidence | Draft path can be mistaken for project identity | Data/persistence pass | Pending |
| `history/recovery/state.json` | Recovery state | Persists accept/recovery tracker state | JSON | Recovery evidence and workflow state | Per-project state keyed by `project_id` | Recovery tracker owns this workflow state | Written on accept progress, completion, and recovery failure | Current code evidence | Recovery state could be mistaken for current manuscript truth | Recovery and failure-handling pass | Pending |
| `history/snapshots/*/metadata.json` | Snapshot metadata | Records snapshot id, project id, label, created_at, includes | JSON | Historical recovery evidence | Snapshot id plus project id and include list are required for scope | Snapshot persistence owns capture metadata | Written during snapshot creation | Strong current code evidence | Snapshot metadata can be mistaken for current-save authority | Snapshot and history pass | Pending |
| `history/snapshots/*/snapshot.yaml` | Snapshot manifest | Describes snapshot contents and manifest shape | YAML | Historical recovery evidence | Snapshot id and file list bind the snapshot scope | Snapshot persistence owns manifest generation | Written during snapshot creation | Strong current code evidence | Manifest may be treated as truth instead of evidence | Snapshot and verification pass | Pending |
| `history/snapshots/*/manifest.json` | Snapshot manifest compatibility file | Renderer and test compatibility copy of snapshot manifest | JSON | Compatibility and evidence surface | Same snapshot identity as `snapshot.yaml` | Renderer/helper compatibility; not the only source of truth | Written by legacy or compatibility paths | Current and legacy compatibility evidence | Legacy manifest can look authoritative when it is only compatibility support | Renderer/data compatibility pass | Pending |
| `history/snapshots/last_verification.json` | Verification report | Stores latest backup/snapshot verification report | JSON | Evidence and last-witness boundary | Report is project-scoped and claim-scoped, not authority-scoped | Backup verifier owns report persistence | Written by backup verifier and report readers | Strong current code evidence | Verification report may be overclaimed as current proof | Verification and last-witness pass | Pending |
| `.snapshots/` | Legacy compatibility root | Renderer/test compatibility surface for older snapshot layout | Directory tree | Historical/compatibility evidence | Not authoritative for service-side snapshot creation | Compatibility readers only | Read by renderer and some tests; written by some compatibility paths | Mixed current and legacy evidence | Old layout may be mistaken for current authority | Renderer compatibility and evidence pass | Pending |
| `backups/BS_*.zip` | Backup bundles | Long-term recovery-oriented project archives | ZIP plus `checksums.json` | Backup evidence, not current truth | Backup bundles carry project_id and checksum provenance | Backup service owns bundle creation and classification | Written by backup service; restored as sibling copies | Strong current code evidence | Backup may be mistaken for snapshot or archive authority | Backup and restore pass | Pending |
| `exports/*.md`, `exports/*.txt`, `exports/*.zip` | Export artifacts | Outbound manuscript/package exports | Markdown, text, ZIP | Export evidence, not backup evidence | Export path is not project identity | Export service owns outbound artifact creation | Written by export service; never treated as current truth by default | Strong current code evidence | Export can be mistaken for backup or migration proof | Import/export boundary pass | Pending |
| `bootstrap.invalid.json` | Bootstrap failure marker | Explicit invalid bootstrap sentinel | JSON | Failure evidence | Marker path does not define project identity | Bootstrap flow owns invalid marker creation | Written on bootstrap failure or unsafe cleanup | Current code evidence | Failure marker could be misread as a valid project record | Bootstrap and project-identity pass | Pending |
| `sample_project/proj_esther_estate` and `sample_project/Esther_Estate` | Fixture roots | Sample project aliases and compatibility roots | Directory trees | Test/fixture evidence | Alias parity supports harness setup but does not prove live identity | Fixture materialization owns these roots | Written by fixture scripts and test helpers | Current harness evidence | Sample name/path can be mistaken for author project identity | Data/fixture follow-up pass | Pending |

## 5. Schema and Data-Model Inventory

| Schema or model | Where defined | Role | Identity or version rule | Risk |
| --- | --- | --- | --- | --- |
| `ProjectMetadataSchema v1` | `app/main/projectBootstrap.ts`, `app/shared/ipc/projectLoader.ts` | Project bootstrap metadata schema | `project_id` is required for identity; `schema_version` must match for load/validation | Stale metadata can look authoritative |
| `OutlineSchema v1` | `app/main/projectBootstrap.ts`, `app/shared/ipc/projectLoader.ts`, service and test fixtures | Outline schema for acts, chapters, scenes | Outline version is checked on load; scene/chapter structures remain projections | Scene-first structure can be overread as truth authority |
| `SnapshotManifest v1` | `services/src/blackskies/services/snapshots.py` | Snapshot content manifest | Snapshot identity is a generated id; manifest records included paths | Manifest may be mistaken for current state |
| `BackupChecksums v1` | `services/src/blackskies/services/backup_service.py` | Backup integrity manifest | Backup checksum file is required for classification and restore eligibility | Backup may be treated as verified restore without checking scope |
| `ProjectExportResult v1` | `services/src/blackskies/services/export_service.py` | Export response schema | Export result records path, format, chapters, scenes, timestamp | Export success does not imply backup or restore authority |
| `ProjectBootstrapInvalid v1` | `app/main/projectBootstrap.ts` | Invalid bootstrap marker schema | Invalid marker blocks later load; it is a failure sentinel | Marker can be mistaken for a valid workspace artifact |
| `ProjectLoadResponse` / `ProjectBootstrapResponse` | `app/shared/ipc/projectLoader.ts` | IPC contract for loading and bootstrapping projects | Load/bootstrapping can fail closed on identity or schema mismatch | Response shape can be overclaimed as full persistence proof |
| `LoadedProject` | `app/shared/ipc/projectLoader.ts` | Renderer-visible project model | Includes `path`, `projectId`, `name`, `outline`, `scenes`, `drafts`, bootstrap state, and template | Path/name can be conflated with identity |
| `SceneDraftMetadata` | `app/shared/ipc/projectLoader.ts` | Draft scene metadata model | Scene metadata is parsed from drafts and outline structures | Scene-level metadata can be overpromoted to project truth |
| `ProjectIssue` | `app/shared/ipc/projectLoader.ts` | Cross-layer warning/error model | Issues are evidence, not acceptance | Issues may be ignored if not routed visibly |
| Recovery tracker states | `services/src/blackskies/services/routers/recovery.py` | Recovery workflow state model | `idle`, `needs-recovery`, `accept-in-progress` | Tracker state may be confused with manuscript truth |

## 6. Project Identity Storage and Binding

`project_id` is observed runtime identity data stored in `project.json`; its validity and authority must be verified under the Stage 12 identity and binding contracts. Storage presence alone does not establish current authority. Path, folder name, display name, slug, sample-project alias, and restored-copy name remain non-authoritative evidence, and copied, restored, or migrated projects must not silently inherit authority merely because `project_id` or nearby metadata matches.

Bootstrap creates `project_id` values from a sanitized slug plus random suffix. That is an identity construction rule, not proof that a filesystem path or display name is the identity.

The loader resolves project roots by scanning for `project.json` and `outline.json`, but Stage 12 doctrine still says path, folder name, nearby files, successful opening, and display name do not independently prove identity.

The renderer and service layers also retain compatibility paths for sample projects and restored copies, so this pass treats alias roots and restored sibling names as evidence, not authority.

## 7. Project-Root and Path Assumptions

Observed assumptions:

- service project roots are under `project_base_dir/<project_id>`
- nested folder selection can be resolved upward to a real project root
- `restore_from_zip` materializes a sibling folder under the parent directory, not in place
- `backup_service.restore_backup` also materializes a sibling folder
- renderer compatibility still recognizes `.snapshots` and `history/snapshots`
- `sample_project` alias roots exist for harness and fixture use

Risk:

- filesystem path, slug, restored folder name, or sample alias can look like identity even when doctrine says they are not sufficient by themselves

## 8. Persistence Ownership

- `Project Persistence / Local Save` owns current editable project state.
- `DraftPersistence` writes scene markdown atomically.
- `SnapshotPersistence` owns capture and restore of project snapshots under `history/snapshots`.
- `BackupService` owns backup bundle creation, classification, and restore-as-copy eligibility.
- `ProjectExportService` owns export artifact creation under `exports/`.
- `RecoveryTracker` owns accept/recovery state persisted under `history/recovery/state.json`.
- `backup_verifier` owns verification report persistence under `.snapshots/last_verification.json`.

Ownership risk:

- multiple storage writers exist, but they do not own accepted manuscript truth or project identity by default

## 9. Snapshot and History Behavior

- Service snapshots now live under `history/snapshots/<snapshot_id>_<label>/`.
- Snapshot creation copies included project files, writes `metadata.json`, and writes `snapshot.yaml`.
- Legacy renderer/test code still reads `.snapshots/` and may fall back to `snapshot.json` or `metadata.json`.
- Retention is bounded in code (`SNAPSHOT_RETENTION = 7`) for manual snapshot creation.
- Recovery can restore the latest snapshot when no explicit snapshot id is provided.

The history folder is recovery evidence, not current-save authority.

## 10. Backup and Archive Distinctions

- Backups are ZIP bundles under `backups/BS_YYYYMMDD_HHMMSS.zip`.
- Backups include `checksums.json` plus copied project files.
- `list_backups` classifies archives as `restorable`, `stale`, or `blocked` based on checksum and project-id scope.
- `restore_backup` creates a sibling restored copy and validates the copy after materialization.
- Export archives are different: they live under `exports/` and are outbound manuscript artifacts, not backup bundles.

Archive is not deletion, and backup is not snapshot. The code keeps those lanes separate, though the names are still easy to blur.

## 11. Restore and Recovered-Copy Behavior

- Snapshot restore writes back onto the current project root through `RecoveryService.restore_snapshot`.
- Backup restore and ZIP export restore both materialize sibling folders with `_restored_<timestamp>` naming.
- Restore eligibility rejects overwrite-in-place, missing manifests, checksum failure, destination overlap, and project-scope mismatch.
- `validate_restored_copy` validates the restored folder and either keeps it for inspection or removes an invalid copy if cleanup succeeds.
- Restore results carry `restore_observation` and `restore_semantic_context` fields that explicitly say restored copy materialized and whether current files were replaced.

Restored-copy identity is distinct from original project identity unless a later Stage 12-authorized claim proves otherwise.

## 12. Migration and Versioning Behavior

Observed versioning and migration-related rules:

- `project.json` must use `ProjectMetadataSchema v1` for the loader to accept it.
- `outline.json` must use `OutlineSchema v1`.
- `snapshot.yaml`, `SnapshotManifest v1`, `BackupChecksums v1`, and `ProjectExportResult v1` each carry their own schema/version labels.
- Unsupported bootstrap state or unsupported project schema is treated as a warning or error, not as a silent fallback to new authority.
- `docs/backup_and_migration.md` is a draft, not a governing implementation contract.

Stage 12 migration doctrine still controls identity, restore, and compatibility decisions; this pass does not select any migration implementation.

## 13. Import/Export Data Boundaries

- Export is implemented for `md`, `txt`, and `zip`.
- Export writes to `exports/` and excludes the `exports/` directory from ZIP payloads.
- Export does not become backup, restore, or migration authority.
- Import is not established as a separate live persistence lane in the inspected code; the closest visible intake paths are restore and bootstrap.
- Restore from ZIP or backup is governed recovery, not generic import.

## 14. Recovery and Failure Handling

- Recovery state is persisted in `history/recovery/state.json`.
- Recovery tracker marks `accept-in-progress`, `needs-recovery`, and `idle`.
- A timeout can move stale accept state to `needs-recovery`.
- Snapshot restore failures raise validation or filesystem errors and may mark the project as needing recovery.
- Backup verification writes `last_verification.json` under the project snapshot root.

Failure handling is explicit, but it is still easy to overread recovery state as manuscript truth.

## 15. Data Mutation Paths

Observed mutation paths:

- `app/main/projectBootstrap.ts` writes `project.json`, `outline.json`, and `drafts/*.md`, plus invalid-bootstrap markers on failure.
- `DraftPersistence.write_scene()` writes scene markdown atomically.
- `SnapshotPersistence.create_snapshot()` copies project files into `history/snapshots`.
- `create_snapshot()` in `services/src/blackskies/services/snapshots.py` copies project files into `.snapshots` for manual snapshot verification and prunes old entries.
- `BackupService.create_backup()` writes ZIP bundles and checksum payloads.
- `ProjectExportService.export()` writes export artifacts to `exports/`.
- `restore_from_zip()` and `restore_backup()` materialize sibling restored copies.
- `RecoveryService.restore_snapshot()` writes a snapshot back to the current project root.
- `backup_verifier.run_verification()` writes verification reports to `.snapshots/last_verification.json`.

These are explicit mutation paths, but they are not all equivalent in authority or risk.

## 16. Last-Witness and Evidence Risks

Potential last-witness material includes:

- `history/snapshots/*/metadata.json`, `snapshot.yaml`, and compatibility manifests
- `backups/BS_*.zip` and their `checksums.json`
- `history/recovery/state.json`
- `.snapshots/last_verification.json`
- renderer compatibility reads of `.snapshots/`
- test fixtures and reports around snapshot, backup, and restore behavior

These records may be the only surviving witness for a material claim, so they must not be treated as disposable or silently replaced by a newer-looking path.

## 17. Unknowns and Later Routing

Unknowns that remain visible:

- whether `.snapshots/` is still required only for compatibility or still used operationally by multiple lanes
- whether sample-project aliases are fixture-only or still influence live project identity decisions
- whether restore-as-current behavior should remain snapshot-only and what exact visible gating it needs
- whether export ZIPs are being used as interchange only or are also acting as hidden backup substitutes
- whether the legacy `app/electron` paths remain active or are only compatibility remnants

Recommended later routing:

- desktop, packaging, launcher, installation, and portable-boundary inventory for sibling-folder restore behavior and app-instance ownership
- surfaces and UI inventory for recovery, restore, and project-identity presentation
- focused identity/recovery follow-up if any claim depends on `app/electron`, sample aliases, or legacy `.snapshots` behavior

## 18. Stop and Reopening Conditions

Stop later Stage 13 work if:

- the repository gate differs from authorization
- current authority is missing, ambiguous, or contradictory
- a lower-tier source appears to contradict Stage 12 identity, migration, or evidence floors
- a pass would require migration execution, restore execution, schema edits, data rewriting, cleanup, archive execution, deletion, or release work
- author-policy choices would need to be resolved by assumption
- evidence is insufficient for the claim being made

Invoke Stage 12 reopening if later evidence reveals contradiction among contracts, ownership collision, identity-chain break, invalidation or propagation gap, evidence overclaim, silent authority transfer, family-contract regression, unresolved architecture dependency, author-policy change to a mandatory floor, implementation infeasibility, or release evidence contradicting the contract.

## 19. Recommended Next Bounded Pass

Recommended next pass: desktop, packaging, launcher, installation, and portable-boundary inventory.

Rationale:

- the restore paths materialize sibling folders and rely on application-instance behavior that crosses packaging and install boundaries
- backup and export artifacts are only useful if launcher and install boundaries keep them distinct from live project identity
- Stage 12 deployment/multi-install and restored-copy contracts make portable and installed ownership a natural next boundary after data persistence

The next pass should remain inventory-only. It should not modify packaging, launcher, installation, or runtime behavior.
