# Stage 14 PKG-D Divergent Active-Path / Backend-Root Witness Plan

## 1. Repository gate result

Confirmed at checkpoint:

```text
420876e511be7b38cfafb23d03e7b3bbd800ca44 docs(product): reassess PKG-D after Mutation D1
```

Gate status:

```text
confirmed by source inspection: branch is salvage/minimal-two-surface-shell
confirmed by source inspection: upstream is synchronized
confirmed by source inspection: worktree was clean before this plan
confirmed by source inspection: history includes docs(product): reassess PKG-D after Mutation D1
confirmed by source inspection: history includes fix(product): limit backup verifier report persistence to requested root
confirmed by source inspection: history includes docs(product): scope PKG-D Mutation D1
```

## 2. Records inspected

```text
confirmed by source inspection: docs/product_systems/stage14_pkg_d_charter.md
confirmed by source inspection: docs/product_systems/stage14_pkg_d_read_only_baseline.md
confirmed by source inspection: docs/product_systems/stage14_pkg_d_scope_decision.md
confirmed by source inspection: docs/product_systems/stage14_pkg_d_mutation_d1_scope.md
confirmed by source inspection: docs/product_systems/stage14_pkg_d_mutation_d1_execution.md
confirmed by source inspection: docs/product_systems/stage14_pkg_d_post_mutation_d1_reassessment.md
```

## 3. Exact unresolved seam under test

The unresolved PKG-D seam is:

```text
unresolved: when renderer active project path and canonical metadata projectId diverge, representative backend write-target operations may resolve their target root from settings.project_base_dir / project_id rather than the active loaded project root.
```

Accepted PKG-A evidence established that a valid loaded project can preserve both:

```text
project.path = /projects/path-beta
project.projectId = proj_alpha
```

The PKG-D baseline then found that several backend write-target seams appear to derive roots from `project_id` under the backend base directory. Static inspection alone did not prove every representative operation reaches the wrong root in a divergent active-path scenario, so this plan limits follow-up witness work to representative write-target evidence.

## 4. Why this witness is needed after D1

```text
confirmed by executable witness: D1 resolved backup verifier report persistence writing last_verification.json to duplicate or alias roots that advertise the same project_id.
confirmed by source inspection: D1 was intentionally limited to backup verifier report write-target behavior.
confirmed by source inspection: D1 did not resolve broad divergent active-path / backend-root behavior.
unresolved: representative non-backup-verifier write-target operations still need bounded evidence before PKG-D can classify the residual as safe, contradicted, or deferred.
```

This witness is needed because the remaining question is not whether duplicate backup verifier reports are contained; it is whether representative project write operations target the active loaded root or silently target `settings.project_base_dir / project_id` when path and metadata identity diverge.

## 5. Selected representative seams

This plan selects two representative lanes only.

### Lane A: project-level artifact write lane

Selected seam:

```text
export write-target behavior
```

Purpose:

```text
confirmed by source inspection: export is a project-level artifact operation that can represent backend write-target selection without requiring recovery execution, restore execution, receipt creation, or snapshot baseline updates.
```

### Lane B: draft/content write lane

Selected seam:

```text
draft acceptance write-target behavior
```

Purpose:

```text
confirmed by source inspection: draft acceptance is a content-write operation that can represent whether project content writes are bound to the active loaded root or to the backend project_id-derived root.
```

## 6. Why each selected seam is representative

### Export

Export is representative because it is a project-level artifact operation. If export request formation and backend handling use only canonical `projectId` and resolve the write root as `settings.project_base_dir / project_id`, then a divergent active root can remain untouched while the ID-derived root receives artifacts. That directly exercises the PKG-D wrong-root proof standard for project-level write output.

### Draft acceptance

Draft acceptance is representative because it is a content-write operation. It can test whether a write intended for the loaded project context lands in the active loaded root or in a backend root selected only by `projectId`. It is narrower than broad draft lifecycle coverage and should not be expanded into draft generation quality, model-provider behavior, UX, or recovery semantics.

## 7. Seams intentionally excluded

```text
unresolved but not contradicted: recovery status and recovery destination safety are excluded because this plan has safer representative write-target lanes and must not execute recovery.
unresolved but not contradicted: restore destination safety is excluded because this plan has safer representative write-target lanes and must not execute restore.
unresolved but not contradicted: snapshot write-target behavior is excluded because export is selected as the project-level artifact representative and this plan forbids snapshot baseline updates.
out-of-scope deferred: backup verifier report persistence is excluded because D1 already resolved that specific contradiction.
out-of-scope deferred: loader missing-ID diagnostics are excluded unless later evidence proves direct write-target dependency.
out-of-scope deferred: recents identity visibility and divergence warning behavior are PKG-E or later visibility/diagnostic concerns, not PKG-D write-target witnesses.
out-of-scope deferred: App UI outside ProjectHome details and general UX polish are excluded.
out-of-scope deferred: project picker UX is excluded unless later evidence proves direct write-target selection dependency.
```

Recovery and restore are intentionally excluded because the inspected records do not prove that they are the only useful representative seams. They remain unresolved but not contradicted, and they are not blockers by default.

## 8. Witness method

The later witness execution should use a synthetic divergent-root setup only.

Recommended shape:

```text
base_dir/
  path-beta/
    project.json with project_id = proj_alpha
    synthetic project content required by the selected lane
  proj_alpha/
    project.json with project_id = proj_alpha or minimal synthetic marker data required to detect wrong-root writes
```

The witness should model accepted PKG-A handoff context:

```text
active loaded project path: <synthetic base_dir>/path-beta
canonical projectId: proj_alpha
```

The witness should then exercise only the selected representative lanes and determine whether write output lands in:

```text
contained result: <synthetic base_dir>/path-beta
contradicted result: <synthetic base_dir>/proj_alpha
```

The witness may combine:

```text
confirmed by source inspection: renderer/request formation sends only projectId or sends both projectId and path/root.
confirmed by executable witness: backend selected lane writes to the active root, the projectId-derived root, neither root, or both roots.
```

The witness must not use protected projects, receipts, recovery execution, restore execution, or snapshot baseline updates.

## 9. Allowed files for later witness execution

Later witness execution may create or modify only files explicitly authorized by the execution prompt. This plan recommends the following narrow file boundary:

```text
docs/product_systems/stage14_pkg_d_divergent_root_witness_execution.md
services/tests/test_pkg_d_divergent_root_write_targets.py
```

Production files should remain read-only during witness execution. If later execution needs source inspection, likely read-only seams include:

```text
services/src/blackskies/services/routers/export.py
services/src/blackskies/services/routers/draft_acceptance.py
services/src/blackskies/services/draft_acceptance.py
services/src/blackskies/services/persistence/draft.py
```

If exact file names differ, later execution must use exact repository paths found at that time and report the substitution. Any production mutation requires a separate accepted scope and is not authorized by this plan.

## 10. Forbidden files/areas

This witness plan forbids:

```text
runtime mutation
renderer/App/ProjectHome/preload/IPC/project loader changes
backend root-resolution rewrites
recovery behavior changes
restore behavior changes
snapshot behavior changes
backup verifier D1 reopening
draft architecture rewrite
generic persistence architecture changes
loader diagnostics
recents identity work
UI visibility or warning work
runtime truth schema changes
protected evidence mutation
Stage 15 work
```

## 11. Protected evidence posture

This plan does not authorize touching:

```text
sample_project/proj_esther_estate/**
sample_project/Esther_Estate/**
build/truth_receipts/**
build/runtime_truth.json
build/runtime_truth.schema.json
ci_artifacts/**
tracked snapshots
IPC snapshot evidence
real user projects
```

Witness execution must use synthetic temp roots only.

## 12. What result proves contradiction

A representative write-target contradiction is proved if either selected lane shows that, under accepted divergent loaded-project context:

```text
active loaded root = <base_dir>/path-beta
canonical projectId = proj_alpha
```

the operation succeeds or performs a write while:

```text
contradicted: write output appears in <base_dir>/proj_alpha
contradicted: active loaded root <base_dir>/path-beta remains unwritten for the intended output
contradicted: one operation writes to both roots without an accepted reason to do so
```

Contradiction must be tied to a reachable operation. A function accepting `project_id`, a field-name ambiguity, or unproved concern is not enough by itself.

## 13. What result proves containment

Containment is proved for a selected lane if the witness shows one of:

```text
confirmed by executable witness: write output lands only in the active loaded root intended by the operation.
confirmed by executable witness: operation fails closed before any wrong-root write when active root and projectId-derived root diverge.
confirmed by executable witness: request formation carries and validates the intended root so the backend does not silently substitute settings.project_base_dir / project_id.
```

Containment for the selected representative lanes does not prove recovery, restore, every draft operation, or every project artifact operation.

## 14. What remains unresolved but not contradicted

If the selected representative lanes are safe, the following remain unresolved but not contradicted unless distinct evidence appears:

```text
recovery destination safety
restore destination safety
snapshot write-target behavior
other export variants outside the selected seam
draft generation behavior if only draft acceptance is tested
draft save/edit behavior outside the selected seam
project picker behavior
loader diagnostics
recents identity visibility
divergence warning behavior
App UI identity visibility outside ProjectHome
```

If a selected lane is inconclusive, only that lane's specific gap should drive follow-up. The result must not automatically expand PKG-D into every unresolved residual.

## 15. Decision table

| Witness result | Next action |
| --- | --- |
| Representative write-target contradiction proved | Reassessment decides whether scoped mutation is needed. |
| Representative lanes safe | Defer untested surfaces unless distinct evidence appears. |
| Representative lanes inconclusive | Narrow follow-up witness only if a specific gap remains. |
| Recovery/restore not tested | Unresolved but not contradicted, not a blocker by default. |

## 16. Next action after witness execution

Create a bounded execution record:

```text
docs/product_systems/stage14_pkg_d_divergent_root_witness_execution.md
```

After witness execution, create a reassessment record that decides whether:

```text
representative write-target contradiction is proved
representative lanes are contained
a narrow follow-up witness is needed
a scoped mutation is justified
closure preparation is eligible
```

No mutation is authorized by this plan.

PZ_CONTINUE: PKG-D divergent root witness plan ready for review
