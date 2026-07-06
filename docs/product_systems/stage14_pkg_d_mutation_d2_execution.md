# Stage 14 PKG-D Mutation D2 Execution

## 1. Repo gate result

Status: passed.

Repository checkpoint:

```text
826b8f5e1b0547622f8ce45c516344dac93f920c docs(product): scope PKG-D Mutation D2
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
826b8f5 docs(product): scope PKG-D Mutation D2
40a8d83 test(product): capture PKG-D divergent root witnesses
a5e57ee fix(product): limit backup verifier report persistence to requested root
```

## 2. Records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_d_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_d_divergent_root_witness_execution.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_scope.md`
- `services/tests/test_pkg_d_divergent_root_write_targets.py`

Source files inspected:

- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/export_service.py`
- `services/src/blackskies/services/routers/draft/acceptance.py`
- `services/src/blackskies/services/operations/draft_accept.py`
- `services/src/blackskies/services/persistence/draft.py`

## 3. Files changed

Created:

- `docs/product_systems/stage14_pkg_d_mutation_d2_execution.md`

No runtime code was changed.

No tests were changed.

No conditional files were changed.

## 4. Contradiction addressed

D2 was intended to address the accepted contradiction:

```text
Export and draft acceptance can write to settings.project_base_dir / project_id under divergent active-path / metadata-ID conditions, leaving the active loaded root untouched.
```

This execution did not implement D2 because source inspection showed the current request path does not provide enough information to bind writes to the intended active loaded root without changing forbidden renderer, preload, IPC, or request-shape boundaries.

## 5. Implementation summary

Implementation blocked before code changes.

Source inspection found:

```text
confirmed by source inspection: ProjectExportRequest contains project_id, format, and include_meta_header.
confirmed by source inspection: ProjectExportRequest does not contain active loaded path, project root, or intended root.
confirmed by source inspection: export_project resolves project_root as settings.project_base_dir / request_model.project_id.
confirmed by source inspection: ProjectExportService.export re-resolves project_root as settings.project_base_dir / project_id.
confirmed by source inspection: DraftAcceptRequest contains project_id, draft_id, unit_id, unit, message, and snapshot_label.
confirmed by source inspection: DraftAcceptRequest does not contain active loaded path, project root, or intended root.
confirmed by source inspection: accept_draft resolves resolved_project_root as settings.project_base_dir / request_model.project_id.
confirmed by source inspection: DraftAcceptService.accept receives resolved_project_root for budget/logging but persists scene content through DraftPersistence.write_scene(request.project_id, ...).
confirmed by source inspection: DraftPersistence.write_scene re-resolves project_root as settings.project_base_dir / project_id.
```

Because the request context contains only `project_id`, D2 cannot select or validate the active loaded root. A fail-closed duplicate-root scan would prevent the accepted witness shape, but it would not satisfy the execution prompt's required behavior:

```text
Make the proved export and draft acceptance write-target behavior bind to the intended active loaded project root when the request context provides it.
```

The current request context does not provide it.

## 6. Tests changed

No tests were changed.

The required targeted test was not run because D2 was blocked before implementation. Running the witness test would re-confirm the accepted contradiction but would not validate D2 behavior.

## 7. Commands run and results

Repository gate:

```powershell
git rev-parse HEAD
git status -sb
git status --short
git log -40 --oneline
```

Result:

```text
exit code: 0
checkpoint: 826b8f5e1b0547622f8ce45c516344dac93f920c
branch: salvage/minimal-two-surface-shell
upstream: synchronized
initial worktree: clean
required history present
```

Inspection commands:

```powershell
Get-Content <scoped records and source files> -Raw
```

Result:

```text
exit code: 0
source inspection completed
```

Targeted test command:

```powershell
python -m pytest services/tests/test_pkg_d_divergent_root_write_targets.py --basetemp .\.codex-pytest-divergent-root-d2 -p no:cacheprovider
```

Result:

```text
not run
reason: D2 requires scope amendment before implementation because the existing request path lacks active loaded root context.
```

## 8. Protected evidence posture

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

No recovery execution, restore execution, receipt creation, protected fixture materialization, protected evidence regeneration, snapshot update, or backend write was performed.

## 9. Scope compliance

Status: blocked, compliant.

This execution stayed inside the D2 scope by stopping before implementation when the existing request path proved insufficient.

No forbidden files or areas were changed:

- renderer files
- App behavior
- ProjectHome behavior
- preload or IPC bridge files
- project loader behavior
- recovery behavior
- restore behavior
- snapshot behavior
- backup restore behavior
- draft generation behavior
- generic backend project-root resolution
- recents schema or storage
- UI visibility or warnings
- runtime truth schema
- Stage 15 records or behavior

## 10. Conditional file justification

No conditional file was changed.

Conditional files were inspected only to determine whether the currently allowed backend request path could bind writes to an active loaded root. It could not:

- `services/src/blackskies/services/export_service.py` re-resolves `settings.project_base_dir / project_id`.
- `services/src/blackskies/services/operations/draft_accept.py` passes `request.project_id` into persistence and snapshot helpers.
- `services/src/blackskies/services/persistence/draft.py` re-resolves `settings.project_base_dir / project_id`.

## 11. Residuals not resolved

D2 did not resolve:

- export divergent active-path/backend-root write-target behavior
- draft acceptance divergent active-path/backend-root write-target behavior
- recovery/restore destination safety
- snapshot write-target behavior
- backup restore behavior
- draft generation
- broader draft save/edit identity behavior
- project picker behavior
- loader diagnostics
- recents identity visibility
- divergence warning behavior
- App UI outside ProjectHome
- generic backend root behavior

The accepted contradiction remains unresolved pending a reviewed scope amendment.

## 12. Next required reassessment record

Because D2 could not be implemented inside the current scope, the next required record is not a post-mutation reassessment.

Next required record:

```text
docs/product_systems/stage14_pkg_d_mutation_d2_scope_amendment.md
```

The amendment must decide whether to authorize one of:

- request-shape changes that carry active loaded root or intended project root to the backend
- renderer/preload/IPC changes needed to supply that context
- a narrower fail-closed duplicate-root containment mutation instead of active-root binding
- a different bounded mutation lane

No mutation is authorized by this blocked execution record.

## 13. Final verdict

PZ_BLOCKED: PKG-D Mutation D2 requires scope amendment
