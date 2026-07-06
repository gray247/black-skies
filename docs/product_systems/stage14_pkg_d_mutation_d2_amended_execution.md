# Stage 14 PKG-D Mutation D2 Amended Execution

## 1. Repo Gate Result

Confirmed by command:

```powershell
git rev-parse HEAD
git status -sb
git status --short
git log -48 --oneline
```

Result:

- Repository checkpoint: `a59c1a13ba3250d651061daf9608f87c4f04dbf5`.
- Branch: `salvage/minimal-two-surface-shell`.
- Upstream: synchronized with `origin/salvage/minimal-two-surface-shell`.
- Worktree at gate: clean.
- Required history present:
  - `docs(product): amend PKG-D Mutation D2 scope`
  - `docs(product): record PKG-D Mutation D2 scope block`
  - `docs(product): scope PKG-D Mutation D2`
  - `test(product): capture PKG-D divergent root witnesses`

## 2. Records Inspected

- `docs/product_systems/stage14_pkg_d_mutation_d2_scope.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_execution.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_scope_amendment.md`
- `docs/product_systems/stage14_pkg_d_divergent_root_witness_execution.md`
- `services/tests/test_pkg_d_divergent_root_write_targets.py`

## 3. Files Changed

Authorized files changed:

- `app/renderer/App.tsx`
- `app/main/preload.ts`
- `app/shared/ipc/services.ts`
- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/routers/draft/acceptance.py`
- `services/tests/test_pkg_d_divergent_root_write_targets.py`
- `docs/product_systems/stage14_pkg_d_mutation_d2_amended_execution.md`

Conditional files changed with direct necessity:

- `services/src/blackskies/services/export_service.py`
- `services/src/blackskies/services/operations/draft_accept.py`
- `services/src/blackskies/services/persistence/draft.py`

No other files were changed.

## 4. Implementation Summary

Mutation D2 was executed as amended for export and draft acceptance only.

Export:

- `App.tsx` now passes `projectPath: projectSummary.path` when forming the export bridge request.
- `preload.ts` serializes optional `projectPath` as backend `project_path`.
- `services.ts` adds optional `projectPath` to `ProjectExportBridgeRequest`.
- `routers/export.py` accepts optional `project_path`, validates it as write-target context, and passes the resolved root into `ProjectExportService`.
- `ProjectExportService.export(...)` accepts an optional `project_root` so the router's validated root is not re-resolved back to `settings.project_base_dir / project_id`.

Draft acceptance:

- `services.ts` adds optional `projectPath` to `DraftAcceptBridgeRequest`.
- `preload.ts` serializes optional `projectPath` as backend `project_path`.
- `routers/draft/acceptance.py` strips `project_path` before strict `DraftAcceptRequest` validation, then validates the supplied path as write-target context.
- `DraftAcceptService` writes accepted scene content through the validated `project_root`.
- `DraftPersistence` adds `write_scene_at_root(...)`, preserving existing `write_scene(project_id, ...)` behavior while enabling the scoped active-root write path.

## 5. Request-Shape Changes

Confirmed by source inspection and implementation:

- Canonical identity remains `projectId` / `project_id`.
- Active loaded path is carried only as `projectPath` / `project_path`.
- Path is not used as canonical identity.
- Request-shape plumbing was limited to export and draft acceptance bridge/backend payloads.

## 6. Backend Validation Behavior

Confirmed by source inspection and targeted tests:

- If `project_path` is supplied, export and draft acceptance resolve it to a filesystem path.
- The resolved path must be a directory.
- The resolved path must be inside `settings.project_base_dir`.
- The resolved path must contain readable `project.json`.
- `project.json.project_id` must match requested canonical `project_id`.
- Invalid, escaping, missing, malformed, or mismatched paths fail closed with validation errors before reportable writes.
- If `project_path` is omitted, existing `settings.project_base_dir / project_id` behavior remains for compatibility.

## 7. Tests Changed

`services/tests/test_pkg_d_divergent_root_write_targets.py` was updated from contradiction witness expectations to post-D2 behavior assertions:

- Export with divergent active path now writes to the supplied active root and leaves the `project_id`-derived alias root untouched.
- Export rejects a supplied active root outside the configured project workspace.
- Draft acceptance with divergent active path now writes accepted scene content to the supplied active root and leaves the `project_id`-derived alias root untouched.
- Draft acceptance rejects a supplied active root whose `project.json.project_id` does not match the canonical requested `project_id`.

The tests use synthetic temp roots only.

## 8. Commands Run And Results

Required targeted backend witness:

```powershell
python -m pytest services/tests/test_pkg_d_divergent_root_write_targets.py --basetemp .\.codex-pytest-divergent-root-d2 -p no:cacheprovider
```

Result: exit `0`; `4 passed`.

Additional targeted renderer/contract-adjacent command run because `App.tsx` export request shape changed:

```powershell
node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppPreflight.test.tsx
```

Result: exit `1`; `18 passed`, `29 failed`.

Observed failure classes:

- Existing split-command shell-status assertions failed in the targeted file.
- One directly relevant export request-shape assertion failed because `services.exportProject` now receives `projectPath: "/projects/demo"` in addition to `projectId` and `format`.

No correction was made to `app/renderer/__tests__/AppPreflight.test.tsx` because it is outside the amended D2 authorized file list.

## 9. Protected Evidence Posture

No protected evidence was touched:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

No recovery execution, restore execution, receipt creation, snapshot update, or protected evidence regeneration was performed.

## 10. Scope Compliance

Confirmed:

- The mutation was limited to export and draft acceptance write-target behavior.
- `projectId` remains the canonical identity.
- Active path/root is write-target context only.
- No ProjectHome, loader, recents, UI visibility, runtime truth schema, recovery, restore, snapshot, backup restore, draft generation, or generic backend root-resolution behavior was changed.
- No Stage 15 work was performed.

## 11. Conditional File Justification

`services/src/blackskies/services/export_service.py` was changed because the router can validate `project_path`, but the service previously re-resolved writes to `settings.project_base_dir / project_id`; passing the validated root was directly necessary.

`services/src/blackskies/services/operations/draft_accept.py` was changed because draft acceptance received the validated `project_root`, but scene persistence previously re-resolved by `project_id`; passing the validated root to persistence was directly necessary.

`services/src/blackskies/services/persistence/draft.py` was changed because the persistence helper had no scoped method to write accepted scene content to a validated root without re-resolving by `project_id`.

## 12. Residuals Not Resolved

D2 does not resolve:

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

Snapshot behavior inside draft acceptance was not changed. The draft acceptance witness monkeypatches snapshot creation and asserts no snapshot folders are created in the synthetic roots.

## 13. Next Required Reassessment Record

The next required record is:

```text
docs/product_systems/stage14_pkg_d_post_mutation_d2_reassessment.md
```

The reassessment should decide whether amended D2 is acceptable with the backend witness passing and the targeted renderer test file still failing outside the authorized edit boundary, or whether a follow-up test-boundary scope is required.

## 14. Final Verdict

PZ_CONTINUE: amended PKG-D Mutation D2 ready for reassessment
