# Stage 14 PKG-D Mutation D2 Scope Amendment

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
3c7d31364fc148bab202a4f55b721e58d74666cc docs(product): record PKG-D Mutation D2 scope block
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
3c7d313 docs(product): record PKG-D Mutation D2 scope block
826b8f5 docs(product): scope PKG-D Mutation D2
40a8d83 test(product): capture PKG-D divergent root witnesses
```

## 2. Records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_d_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_d_divergent_root_witness_execution.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_scope.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_execution.md`

Source files inspected to identify the amended request path:

- `app/renderer/App.tsx`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/export_service.py`
- `services/src/blackskies/services/routers/draft/acceptance.py`
- `services/src/blackskies/services/operations/draft_accept.py`
- `services/src/blackskies/services/persistence/draft.py`

## 3. Reason amendment is needed

D2 execution proved that the original backend-only D2 scope could not bind export and draft acceptance writes to the active loaded root.

The current export and draft acceptance request paths carry canonical identity:

```text
project_id / projectId
```

but they do not carry active loaded root or active loaded path.

Source inspection established:

```text
confirmed by source inspection: App export request formation has access to projectSummary.projectId and projectSummary.path.
confirmed by source inspection: ProjectExportBridgeRequest currently contains projectId, format, and includeMetaHeader, but no projectPath.
confirmed by source inspection: preload serializes export requests with project_id only.
confirmed by source inspection: DraftAcceptBridgeRequest currently contains projectId, draftId, unitId, unit, message, and snapshotLabel, but no projectPath.
confirmed by source inspection: preload serializes draft acceptance requests with project_id only.
confirmed by source inspection: export and draft acceptance backend routers resolve roots as settings.project_base_dir / project_id.
```

Therefore the original D2 scope was insufficient for active-root binding.

## 4. Accepted block from D2 execution

Accepted D2 execution block:

```text
PZ_BLOCKED: PKG-D Mutation D2 requires scope amendment
```

Reason:

```text
The existing request path does not provide enough information to bind writes to the intended active loaded root without changing renderer, preload, IPC, or request-shape boundaries.
```

This amendment accepts that block and amends the scope only as far as needed for the two proved seams.

## 5. Amended mutation purpose

Amended D2 should make export and draft acceptance write-target behavior bind to active loaded root/path when that context is supplied and safely validated.

Canonical project identity remains:

```text
projectId / project_id
```

Active loaded path/root is write-target context only:

```text
projectPath / project_path
```

The amendment does not authorize making filesystem path the canonical identity.

The amendment does not authorize broad backend project-root architecture work.

## 6. Amended allowed implementation boundary

Allowed files for amended D2:

- `app/renderer/App.tsx`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/routers/draft/acceptance.py`
- `services/tests/test_pkg_d_divergent_root_write_targets.py`

Conditional files, allowed only if directly necessary to pass an already validated active root through the two proved seams:

- `services/src/blackskies/services/export_service.py`
- `services/src/blackskies/services/operations/draft_accept.py`
- `services/src/blackskies/services/persistence/draft.py`

Allowed test files, only if needed for request-shape coverage:

- `app/main/__tests__/serviceApi.test.ts`
- one existing targeted renderer test that already exercises export request formation, if source inspection during implementation proves it is the smallest renderer-side coverage

ProjectHome is not authorized because inspected source did not prove ProjectHome is required for export or draft acceptance request formation.

Project loader files are not authorized because inspected source did not prove loader changes are required for the two proved request paths.

Later amended D2 execution must also create:

- `docs/product_systems/stage14_pkg_d_mutation_d2_execution.md`

No other files may change without a reviewed scope amendment.

## 7. Forbidden implementation boundary

Amended D2 must not change:

- ProjectHome behavior
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

Amended D2 must not redesign App activation, ProjectHome loading, loader diagnostics, generic service routing, or global project-root selection.

## 8. Request-shape constraints

Any added request field must be limited to carrying active loaded project path/root for export and draft acceptance write-target binding.

Required constraints:

- preserve `projectId` / `project_id` as canonical identity
- do not replace canonical identity with path
- do not derive canonical identity from path basename
- use active loaded path/root only as write-target context
- keep the new field optional only where needed for backward compatibility, but fail closed for ambiguous divergent-root write attempts when the field is required to select a safe target
- validate supplied path/root on the backend before any write
- reject supplied path/root if it is missing when needed, not absolute when an absolute path is required, malformed, outside the allowed project workspace boundary, or not a directory
- reject supplied path/root if its `project.json.project_id` does not match canonical `project_id`
- reject or fail closed if multiple local roots under the allowed workspace advertise the same `project_id` and the supplied path/root does not identify a singular valid target

Safe validation boundary:

```text
The backend must resolve the supplied path/root and prove it remains within the allowed project workspace boundary used by ServiceSettings.project_base_dir, unless an existing inspected setting provides a narrower explicit project workspace authority.
```

If safe validation cannot be implemented inside this amended boundary, amended D2 execution must stop and report:

```text
PZ_BLOCKED: PKG-D Mutation D2 requires scope amendment
```

## 9. Expected behavior after amended D2

For export:

- renderer request formation supplies canonical `projectId` and active loaded `projectPath`
- preload serializes `project_id` and write-target context for export only
- backend validates supplied write-target context
- export writes under the validated active loaded root when supplied and valid
- export fails closed before write when supplied path/root is missing, invalid, outside allowed workspace, or metadata-mismatched

For draft acceptance:

- request shape can carry canonical `projectId` and active loaded `projectPath`
- preload serializes `project_id` and write-target context for draft acceptance only
- backend validates supplied write-target context
- draft acceptance writes accepted scene content under the validated active loaded root when supplied and valid
- draft acceptance fails closed before content write when supplied path/root is missing, invalid, outside allowed workspace, or metadata-mismatched

Shared expectations:

- divergent metadata `projectId` remains canonical identity
- active path/root is write-target context only
- normal non-divergent valid-ID behavior remains preserved
- no protected evidence mutation occurs

## 10. Targeted test expectation

Amended D2 execution must update targeted tests in:

```text
services/tests/test_pkg_d_divergent_root_write_targets.py
```

Required backend witness updates:

- export with `project_id=proj_alpha` and valid `project_path=<tmp>/path-beta` writes under `<tmp>/path-beta/exports`
- export does not write under `<tmp>/proj_alpha/exports`
- export fails closed without write if `project_path` points outside the allowed workspace
- export fails closed without write if `project_path/project.json` does not advertise `proj_alpha`
- draft acceptance with `project_id=proj_alpha` and valid `project_path=<tmp>/path-beta` updates `<tmp>/path-beta/drafts/sc_1001.md`
- draft acceptance does not update `<tmp>/proj_alpha/drafts/sc_1001.md`
- draft acceptance fails closed without write if `project_path` points outside the allowed workspace
- draft acceptance fails closed without write if `project_path/project.json` does not advertise `proj_alpha`
- normal non-divergent export behavior remains preserved
- normal non-divergent draft acceptance behavior remains preserved

If request-shape tests are changed, they must be targeted only to the amended fields for export and draft acceptance.

Expected targeted command:

```powershell
python -m pytest services/tests/test_pkg_d_divergent_root_write_targets.py --basetemp .\.codex-pytest-divergent-root-d2 -p no:cacheprovider
```

Renderer/IPC tests may be run only if amended D2 execution changes those files and must use the narrowest existing targeted command.

## 11. Protected evidence posture

Amended D2 does not authorize touching:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

Tests must use synthetic temp roots only.

No recovery execution, restore execution, receipt creation, protected evidence regeneration, protected fixture materialization, or snapshot baseline update is authorized.

## 12. Rollback boundary

Rollback is:

- revert the amended D2 implementation commit
- revert amended D2 execution record if committed with implementation
- no protected evidence cleanup expected because amended D2 must not touch protected evidence
- no schema, migration, snapshot, receipt, runtime truth, recovery, restore, or Stage 15 rollback expected because those changes are not authorized

## 13. Post-mutation reassessment requirement

After amended D2 implementation, create:

```text
docs/product_systems/stage14_pkg_d_post_mutation_d2_reassessment.md
```

The reassessment must decide:

- whether amended D2 resolved export write-target binding
- whether amended D2 resolved draft acceptance write-target binding
- whether canonical `projectId` remains identity and path/root remains write-target context only
- whether normal non-divergent export and draft acceptance behavior remains preserved
- whether any amended D2 residual remains
- whether recovery, restore, snapshot, draft generation, backup restore, and other untested seams remain unresolved but not contradicted
- whether PKG-D closure preparation is eligible

## 14. Residuals not resolved

Amended D2 does not resolve:

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
- generic backend project-root behavior outside export and draft acceptance
- Stage 15 eligibility

Classifications preserved unless later evidence changes them:

```text
recovery/restore: unresolved but not contradicted, not blockers by default
snapshot: unresolved but not contradicted because export was selected as representative artifact lane
backup verifier report persistence: resolved by D1
loader diagnostics / recents / UI / picker UX: out-of-scope deferred unless direct write-target dependency is later proved
```

## 15. Amendment verdict

PZ_CONTINUE: PKG-D Mutation D2 amended scope ready for review
