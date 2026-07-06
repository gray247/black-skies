# Stage 14 PKG-D Mutation D2 Scope

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
40a8d83106cadf4c4f7cd04a9818e08639ccb944 test(product): capture PKG-D divergent root witnesses
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
40a8d83 test(product): capture PKG-D divergent root witnesses
98aec81 docs(product): plan PKG-D divergent root witnesses
420876e docs(product): reassess PKG-D after Mutation D1
a5e57ee fix(product): limit backup verifier report persistence to requested root
```

## 2. Records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_d_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_d_post_mutation_d1_reassessment.md`
- `docs/product_systems/stage14_pkg_d_divergent_root_witness_plan.md`
- `docs/product_systems/stage14_pkg_d_divergent_root_witness_execution.md`
- `services/tests/test_pkg_d_divergent_root_write_targets.py`

Source files inspected to define the narrow boundary:

- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/export_service.py`
- `services/src/blackskies/services/routers/draft/acceptance.py`
- `services/src/blackskies/services/operations/draft_accept.py`
- `services/src/blackskies/services/persistence/draft.py`

## 3. Witness evidence summary

Accepted divergent-root witness result:

```text
confirmed by executable witness: export write-target behavior writes to <tmp>/proj_alpha/exports when active loaded root is <tmp>/path-beta and canonical projectId is proj_alpha.
confirmed by executable witness: export leaves <tmp>/path-beta/exports absent.
confirmed by executable witness: draft acceptance writes updated scene content to <tmp>/proj_alpha/drafts/sc_1001.md when active loaded root is <tmp>/path-beta and canonical projectId is proj_alpha.
confirmed by executable witness: draft acceptance leaves <tmp>/path-beta/drafts/sc_1001.md unchanged.
```

The witness used synthetic temp roots only and modeled:

```text
active loaded root: <tmp>/path-beta
canonical projectId: proj_alpha
projectId-derived backend root: <tmp>/proj_alpha
both roots advertise project.json.project_id = proj_alpha
```

## 4. Accepted contradiction

Under divergent active path / metadata `projectId` conditions, representative write-target operations can target:

```text
settings.project_base_dir / project_id
```

instead of the active loaded project root intended by the loaded project context.

The accepted contradiction is limited to the representative export and draft acceptance witness lanes. It does not automatically prove unsafe behavior for recovery, restore, snapshot, backup restore, draft generation, loader diagnostics, recents, UI visibility, project picker UX, runtime truth schema, or Stage 15 work.

## 5. Mutation purpose

PKG-D Mutation D2 should ensure the proved representative write-target lanes do not silently write to the `projectId`-derived backend root when the available project roots show a divergent or duplicate metadata identity condition.

The minimum safe behavior is fail-closed containment for the proved witness shape:

```text
if export or draft acceptance sees a requested projectId that is associated with more than one local project root, it must not write export artifacts or accepted scene content to settings.project_base_dir / project_id merely because that folder name matches the requested projectId.
```

D2 must preserve normal non-divergent valid-ID behavior:

```text
settings.project_base_dir / project_id is the singular intended project root
project.json.project_id matches project_id
export continues to write under that root
draft acceptance continues to write accepted scene content under that root
```

D2 is not a mandate to redesign backend root resolution or to add renderer path-bearing request contracts. If D2 execution proves the contradiction cannot be contained inside the named backend lanes without renderer/IPC/generic root changes, implementation must stop and report the blocker.

## 6. Allowed implementation boundary

Later D2 implementation may modify only these files:

- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/routers/draft/acceptance.py`
- `services/tests/test_pkg_d_divergent_root_write_targets.py`

Conditional files, allowed only if D2 execution proves they are directly necessary for the same bounded behavior:

- `services/src/blackskies/services/export_service.py`
- `services/src/blackskies/services/operations/draft_accept.py`
- `services/src/blackskies/services/persistence/draft.py`

The conditional files are not pre-authorized for broad refactor. They may be touched only to pass an explicitly resolved intended project root through the export or draft acceptance lane, or to prevent `DraftPersistence.write_scene(...)` from reselecting `settings.project_base_dir / project_id` after the route has already rejected or resolved an ambiguous root.

Later D2 execution must also create:

- `docs/product_systems/stage14_pkg_d_mutation_d2_execution.md`

No other files may be changed without a reviewed scope amendment.

## 7. Forbidden implementation boundary

D2 must not change:

- renderer files
- App behavior
- ProjectHome behavior
- preload or IPC bridge files
- project loader behavior
- recovery behavior
- restore behavior
- snapshot behavior
- backup restore behavior
- backup verifier D1 behavior
- draft generation behavior
- generic backend project-root resolution
- recents schema or storage
- UI visibility or warnings
- project picker UX
- runtime truth schema
- protected evidence
- Stage 15 records or behavior

D2 must not add a broad cross-service root resolver unless a later reviewed scope amendment authorizes that broader boundary.

## 8. Expected behavior after D2

For the accepted divergent witness shape:

```text
active loaded root: <tmp>/path-beta
canonical projectId: proj_alpha
projectId-derived backend root: <tmp>/proj_alpha
both roots advertise project.json.project_id = proj_alpha
```

D2 must prevent:

- export artifact writes under `<tmp>/proj_alpha/exports` merely because the request used `project_id=proj_alpha`
- draft acceptance scene-content writes under `<tmp>/proj_alpha/drafts/sc_1001.md` merely because the request used `project_id=proj_alpha`
- silent success when the request target is ambiguous between duplicate or divergent local roots that advertise the same canonical identity

D2 may satisfy the scope by failing closed before write in the ambiguous duplicate-root condition. If implementation chooses a different containment mechanism, it must prove that the selected root is the singular intended root and must not broaden into generic root-resolution redesign.

D2 must preserve:

- export success for ordinary non-divergent projects rooted at `settings.project_base_dir / project_id`
- draft acceptance success for ordinary non-divergent projects rooted at `settings.project_base_dir / project_id`
- existing request validation for invalid project IDs
- existing runtime truth and feature-gating behavior
- synthetic temp-root-only test substrate
- no protected evidence mutation

## 9. Targeted test expectation

Later D2 execution must update targeted test evidence in:

```text
services/tests/test_pkg_d_divergent_root_write_targets.py
```

Required missing-safe assertions:

- export with the divergent duplicate-root witness setup must not write an export artifact to the `projectId`-derived root
- export must not write an export artifact to the active root unless implementation explicitly proves it is the singular intended root
- export should fail closed with a validation or conflict-style response when duplicate local roots advertise the same `project_id`
- draft acceptance with the divergent duplicate-root witness setup must not update scene content in the `projectId`-derived root
- draft acceptance must not update scene content in the active root unless implementation explicitly proves it is the singular intended root
- draft acceptance should fail closed with a validation or conflict-style response when duplicate local roots advertise the same `project_id`

Required valid-ID preservation assertions:

- export still writes under `settings.project_base_dir / project_id` for a normal non-divergent valid project
- draft acceptance still updates `settings.project_base_dir / project_id` for a normal non-divergent valid project

Execution should run only targeted tests needed for D2, likely:

```powershell
python -m pytest services/tests/test_pkg_d_divergent_root_write_targets.py --basetemp .\.codex-pytest-d2 -p no:cacheprovider
```

If the existing environment requires a different workspace-local basetemp, D2 execution must report the exact command and result.

## 10. Protected evidence posture

D2 scope does not authorize touching:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

D2 tests must use synthetic temp roots only.

No recovery execution, restore execution, receipt creation, protected evidence regeneration, protected fixture materialization, or snapshot baseline update is authorized.

## 11. Rollback boundary

Rollback is:

- revert the D2 implementation commit
- revert `docs/product_systems/stage14_pkg_d_mutation_d2_execution.md` if committed with the implementation
- no protected evidence cleanup expected because D2 must not touch protected evidence
- no schema, migration, snapshot, receipt, or runtime truth rollback expected because this scope does not authorize those changes

## 12. Post-mutation reassessment requirement

After D2 implementation, create:

```text
docs/product_systems/stage14_pkg_d_post_mutation_d2_reassessment.md
```

The reassessment must decide:

- whether D2 resolved the export representative contradiction
- whether D2 resolved the draft acceptance representative contradiction
- whether normal non-divergent export and draft acceptance behavior remains preserved
- whether any D2 residual remains
- whether recovery, restore, snapshot, draft generation, and other untested seams remain unresolved but not contradicted
- whether PKG-D closure preparation is eligible

## 13. Residuals not resolved by D2

D2 does not resolve:

- recovery destination safety generally
- restore destination safety generally
- snapshot write-target behavior
- backup restore behavior
- draft generation behavior
- draft save/edit identity behavior outside draft acceptance
- project picker behavior or UX
- loader missing-ID diagnostics
- recents identity visibility
- divergence warning behavior
- App UI identity visibility outside ProjectHome
- generic backend project-root resolution
- Stage 15 eligibility

Classifications preserved unless later evidence changes them:

```text
recovery/restore: unresolved but not contradicted, not blockers by default
snapshot: unresolved but not contradicted because export was selected as representative artifact lane
backup verifier report persistence: resolved by D1
loader diagnostics / recents / UI / picker UX: out-of-scope deferred unless direct write-target dependency is later proved
```

## 14. Scope verdict

PZ_CONTINUE: PKG-D Mutation D2 scope ready for review
