# Stage 14 PKG-D Divergent Active-Path / Backend-Root Witness Execution

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
98aec812d57764b8106a3d28f9c3cb622eae97f6 docs(product): plan PKG-D divergent root witnesses
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
98aec81 docs(product): plan PKG-D divergent root witnesses
420876e docs(product): reassess PKG-D after Mutation D1
a5e57ee fix(product): limit backup verifier report persistence to requested root
```

## 2. Records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_d_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_d_post_mutation_d1_reassessment.md`
- `docs/product_systems/stage14_pkg_d_divergent_root_witness_plan.md`

## 3. Witness seams executed

Executed only the two selected representative seams from the accepted witness plan:

1. export write-target behavior
2. draft acceptance write-target behavior

The witness modeled the accepted divergent identity context with synthetic temp roots:

```text
active loaded root: <tmp>/path-beta
canonical projectId: proj_alpha
projectId-derived backend root: <tmp>/proj_alpha
```

Both synthetic roots advertised the same metadata identity:

```text
project.json.project_id = proj_alpha
```

No recovery, restore, snapshot baseline, backup verifier, loader diagnostic, recents, UI visibility, project picker, generic backend-root, or Stage 15 work was executed.

## 4. Files changed

Created:

- `services/tests/test_pkg_d_divergent_root_write_targets.py`
- `docs/product_systems/stage14_pkg_d_divergent_root_witness_execution.md`

No production code was modified.

## 5. Commands run and results

Command:

```powershell
python -m pytest services/tests/test_pkg_d_divergent_root_write_targets.py --basetemp .\.codex-pytest-divergent-root -p no:cacheprovider
```

First result:

```text
exit code: 1
result: 1 failed, 1 passed
cause: test-fixture shape error. The synthetic outline_id used out_pkg_d_divergent_root, but existing schema requires pattern ^out_\d{3}$.
product classification: not a product failure
```

Correction:

```text
changed synthetic outline_id to out_914
```

Final command:

```powershell
python -m pytest services/tests/test_pkg_d_divergent_root_write_targets.py --basetemp .\.codex-pytest-divergent-root -p no:cacheprovider
```

Final result:

```text
exit code: 0
summary: 2 passed in 0.93s
```

The workspace-local pytest basetemp directory was removed after the successful run.

## 6. Export witness result

Classification: contradiction proved.

Executable witness:

```text
confirmed by executable witness: with active loaded root <tmp>/path-beta and canonical projectId proj_alpha, POST /api/v1/export with project_id=proj_alpha writes the export artifact under <tmp>/proj_alpha/exports.
confirmed by executable witness: <tmp>/path-beta/exports is not created.
confirmed by executable witness: the exported content comes from the projectId-derived root, not the active loaded root.
```

Observed behavior:

```text
request project_id: proj_alpha
write target observed: <tmp>/proj_alpha/exports
active root observed untouched for export output: <tmp>/path-beta
```

This proves the export representative lane targets `settings.project_base_dir / project_id` rather than the active loaded root under divergent active-path/backend-root conditions.

## 7. Draft acceptance witness result

Classification: contradiction proved.

Executable witness:

```text
confirmed by executable witness: with active loaded root <tmp>/path-beta and canonical projectId proj_alpha, POST /api/v1/draft/accept with project_id=proj_alpha updates <tmp>/proj_alpha/drafts/sc_1001.md.
confirmed by executable witness: <tmp>/path-beta/drafts/sc_1001.md remains unchanged.
confirmed by executable witness: the draft acceptance lane used the projectId-derived root for content persistence.
```

Snapshot behavior was test-local monkeypatched to avoid snapshot execution and snapshot artifact creation. The witness tested draft content write-target behavior only.

Observed behavior:

```text
request project_id: proj_alpha
write target observed: <tmp>/proj_alpha/drafts/sc_1001.md
active root observed untouched for accepted scene content: <tmp>/path-beta/drafts/sc_1001.md
```

This proves the draft acceptance representative lane targets `settings.project_base_dir / project_id` rather than the active loaded root under divergent active-path/backend-root conditions.

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

No protected sample projects, receipts, protected evidence regeneration, recovery execution, restore execution, snapshot baseline updates, or production backend writes were used.

The witness used synthetic pytest temp roots only.

## 9. Classification

| Witness item | Evidence status | Classification |
| --- | --- | --- |
| Export write-target behavior | confirmed by executable witness | contradiction proved |
| Draft acceptance write-target behavior | confirmed by executable witness | contradiction proved |
| Representative divergent active-path/backend-root seam | confirmed by executable witness | contradiction proved |
| Recovery destination safety | unresolved | unresolved but not contradicted |
| Restore destination safety | unresolved | unresolved but not contradicted |
| Snapshot write-target behavior | unresolved | unresolved but not contradicted |
| Backup verifier report persistence | confirmed by D1 evidence | excluded; D1 addressed it |

## 10. Excluded seams remain excluded

Recovery and restore:

```text
unresolved but not contradicted, not blockers by default
```

Reason:

```text
the accepted witness plan selected safer representative write-target seams and explicitly excluded recovery/restore execution.
```

Snapshot:

```text
unresolved but not contradicted
```

Reason:

```text
export was selected as the representative project artifact lane; snapshot baseline updates were forbidden.
```

Backup verifier:

```text
excluded
```

Reason:

```text
D1 already addressed backup verifier report write-target containment.
```

Other excluded areas remain outside this witness:

```text
loader diagnostics
recents identity work
UI visibility
project picker UX
generic backend root behavior beyond the selected representative lanes
Stage 15 work
```

## 11. Whether mutation scope is required

Mutation scope is required before any implementation.

Rationale:

```text
confirmed by executable witness: two representative write-target lanes write to the projectId-derived root while the active divergent loaded root remains untouched.
confirmed by accepted PKG-A evidence: valid loaded projects may preserve a path whose basename differs from canonical metadata projectId.
inferred: representative export and draft acceptance evidence is sufficient to require a bounded scope decision for the divergent active-path/backend-root write-target contradiction.
```

No mutation is authorized by this execution record.

The likely next record should scope a bounded mutation around representative write-target root binding. That scope must decide whether the repair belongs at request formation, backend target resolution, or a narrower lane-specific boundary. This execution record does not authorize broad backend root rewrites.

## 12. Whether closure preparation is eligible

PKG-D closure preparation is not eligible yet.

Reason:

```text
contradiction proved: representative export and draft acceptance write-target operations target settings.project_base_dir / project_id rather than the active divergent loaded root.
```

PKG-D should proceed to a bounded mutation scope record, not closure preparation.

## 13. Final verdict

PZ_CONTINUE: PKG-D mutation scope required
