# Stage 14 PKG-D Post-Mutation D1 Reassessment

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
a5e57ee78f193424d6c0919b8479cef3a5e84768 fix(product): limit backup verifier report persistence to requested root
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
a5e57ee fix(product): limit backup verifier report persistence to requested root
c0c7370 docs(product): scope PKG-D Mutation D1
b3bc51d docs(product): decide PKG-D Mutation D1 scope eligibility
6140fd6 docs(product): baseline Stage 14 PKG-D
26fe913 docs(product): charter Stage 14 PKG-D
```

No runtime code, tests, witnesses, protected evidence, recovery, restore, snapshots, receipts, or Stage 15 work was created or modified during this reassessment.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_d_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_d_scope_decision.md`
- `docs/product_systems/stage14_pkg_d_mutation_d1_scope.md`
- `docs/product_systems/stage14_pkg_d_mutation_d1_execution.md`

## 3. D1 contradiction result

Classification: resolved.

D1 addressed the accepted contradiction:

```text
A backup verification run for one requested projectId can persist last_verification.json to multiple project roots that advertise the same project_id, including alias roots, instead of limiting report persistence to the singular intended project root for the requested verification operation.
```

Evidence:

- confirmed by execution record: D1 changed report persistence in `services/src/blackskies/services/routers/backup_verifier.py` to write `last_verification.json` only under the requested `project_root / SNAPSHOT_DIR_NAME`.
- confirmed by execution record: alias roots whose `project.json` advertises the same `project_id` are no longer automatic report write targets.
- confirmed by targeted test evidence: `services/tests/test_backup_verifier_report.py` now asserts the intended root receives `last_verification.json` and the alias root does not.

## 4. Scope compliance result

Classification: compliant.

D1 stayed inside the scoped boundary:

- `services/src/blackskies/services/routers/backup_verifier.py`
- `services/tests/test_backup_verifier_report.py`
- `docs/product_systems/stage14_pkg_d_mutation_d1_execution.md`

The conditional file was not changed:

- `services/src/blackskies/services/backup_verifier.py`

D1 did not change:

- renderer/App/ProjectHome behavior
- preload or IPC bridge behavior
- project loader behavior
- recovery behavior
- restore behavior
- snapshot behavior
- export behavior
- backup restore behavior
- draft generation or acceptance behavior
- generic backend project-root resolution
- recents schema
- UI visibility or warning behavior
- runtime truth schema or artifacts
- Stage 15 records

## 5. Targeted test evidence sufficiency

Classification: sufficient for D1.

Execution record command history:

1. `python -m pytest services/tests/test_backup_verifier_report.py`
   - result: failed before test execution because host temp/cache paths were permission-denied
2. `$env:TMP='C:\tmp'; $env:TEMP='C:\tmp'; python -m pytest services/tests/test_backup_verifier_report.py --basetemp C:\tmp\black-skies-pkg-d-d1-pytest -p no:cacheprovider`
   - result: failed before test execution because `C:\tmp` was permission-denied
3. `python -m pytest services/tests/test_backup_verifier_report.py --basetemp .\.codex-pytest-d1 -p no:cacheprovider`
   - result: passed
   - summary: `3 passed in 1.17s`

Assessment:

- The first two failures were environment/temp permission failures, not product failures.
- The successful command preserved the same targeted test file and used a workspace-local synthetic basetemp.
- The evidence is sufficient for the D1 contradiction because it directly covers intended-root report persistence and alias-root non-persistence.

## 6. Backup-verifier residual status

Classification: resolved for D1; no current backup-verifier report persistence residual established.

Resolved:

- report persistence no longer fans out to every root advertising the requested `project_id`
- alias roots no longer receive `last_verification.json` solely from metadata match
- requested-root verification still returns results
- requested-root report persistence remains intact

Not proved by D1:

- all backup-verifier UX or diagnostics behavior
- all duplicate-ID detection or warning behavior
- global project root correctness outside backup-verifier report persistence

No additional backup-verifier mutation is justified by the D1 evidence.

## 7. Broader divergent active-path/backend-root behavior

Classification: narrow unresolved seam needing witness.

This residual remains separate from D1. D1 did not and should not resolve the broader pattern identified by the baseline:

```text
renderer/backend chains may send canonical projectId while backend roots are derived as settings.project_base_dir / project_id, even when the active loaded project path basename differs from metadata projectId.
```

Reason this remains in PKG-D:

- PKG-D charter concerns persistence, recovery, restore, and write-target identity/root safety.
- The baseline classified this as a narrow unresolved seam needing witness.
- D1 explicitly excluded broad backend root resolution and other write-target families.

Next handling:

- create a bounded PKG-D witness plan for divergent active-path/backend-root behavior
- keep it separate from backup-verifier D1
- do not authorize mutation until accepted witness evidence proves a contradiction

## 8. Residual classification table

| Residual | Classification | PKG-D impact |
| --- | --- | --- |
| Broad divergent active-path/backend-root behavior | narrow unresolved seam needing witness | additional bounded witness required before closure preparation |
| Recovery destination safety | unresolved but not contradicted | include only if the broader divergent-root witness selects recovery as a tested lane |
| Restore destination safety | unresolved but not contradicted | include only if the broader divergent-root witness selects restore as a tested lane |
| Snapshot/export/draft write-target behavior | narrow unresolved seam needing witness | candidate surface for the broader divergent-root witness; do not mutate now |
| Draft save/edit identity behavior | narrow unresolved seam needing witness | candidate surface if witness planning selects draft write-targets; do not mutate now |
| Project picker behavior | out-of-scope deferred unless direct write-target dependency is proved | do not absorb picker UX into PKG-D without evidence |
| Loader diagnostics | out-of-scope deferred unless persistence evidence requires it | later loader-diagnostics scope or Stage 14 closure review |
| Recents identity visibility | out-of-scope deferred | PKG-E or later visibility/diagnostic polish |
| Divergence warning behavior | out-of-scope deferred | PKG-E or later UX/visibility diagnostics |
| App UI identity visibility outside ProjectHome | out-of-scope deferred | PKG-E or later visibility lane |

## 9. PKG-A status

PKG-A remains closed.

This reassessment does not reopen PKG-A and does not reinterpret PKG-A closure. PKG-D inherits accepted PKG-A facts:

- A1 fixed missing-ID App activation
- ProjectHome hygiene fixed missing-ID remembered paths
- ProjectHome divergence visibility fixed canonical-ID details visibility
- explicit metadata-ID preservation is proved
- missing-ID loader tolerance remains contained

## 10. Mutation decision

No new mutation is authorized.

Mutation status:

- D1 resolved the accepted backup-verifier report write-target contradiction.
- No additional backup-verifier mutation is currently justified.
- Broader write-target/root safety remains evidence-dependent and requires a bounded witness before any mutation scope.

## 11. Protected evidence posture

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

No recovery execution, restore execution, receipt materialization, protected fixture materialization, protected backend write, protected evidence regeneration, or snapshot update was performed during this reassessment.

## 12. Next required step

PKG-D is not ready for closure preparation yet.

Next required record:

```text
docs/product_systems/stage14_pkg_d_divergent_root_witness_plan.md
```

Purpose of that later record:

- plan a bounded witness for the broader divergent active-path/backend-root seam
- select the smallest representative write-target surface or surfaces
- use synthetic temp roots only
- avoid protected evidence
- avoid recovery/restore execution unless explicitly scoped and necessary
- keep mutation blocked until witness evidence is accepted

## 13. Final verdict

PZ_CONTINUE: PKG-D additional witness required
