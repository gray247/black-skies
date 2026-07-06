# Stage 14 PKG-D Mutation D1 Scope

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
b3bc51d0a4e32b6907c271576770954d2f6b5c32 docs(product): decide PKG-D Mutation D1 scope eligibility
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
b3bc51d docs(product): decide PKG-D Mutation D1 scope eligibility
6140fd6 docs(product): baseline Stage 14 PKG-D
26fe913 docs(product): charter Stage 14 PKG-D
409b4f2 docs(product): close Stage 14 PKG-A
```

No runtime code, tests, fixtures, protected evidence, recovery, restore, receipts, snapshots, witness execution, mutation execution, or Stage 15 work was created or modified.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_d_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_d_scope_decision.md`
- `docs/product_systems/stage14_pkg_a_closure_review.md`
- `docs/product_systems/stage14_pkg_a_closure_preparation.md`

## 3. Source/test files inspected

- `services/src/blackskies/services/routers/backup_verifier.py`
- `services/src/blackskies/services/backup_verifier.py`
- `services/tests/test_backup_verifier_report.py`
- `services/tests/unit/test_runtime_truth.py`

No tests were run. Inspection was static and read-only.

## 4. Accepted contradiction

Accepted contradiction:

A backup verification run for one requested `projectId` can persist `last_verification.json` to multiple project roots that advertise the same `project_id`, including alias roots, instead of limiting report persistence to the singular intended project root for the requested verification operation.

Evidence basis:

- confirmed by source inspection: `services/src/blackskies/services/routers/backup_verifier.py` computes report roots by scanning every project root whose `project.json.project_id` matches the requested ID.
- confirmed by source inspection: `run_backup_verifier(...)` writes the same report payload to every root returned by that metadata match.
- confirmed by existing test source: `services/tests/test_backup_verifier_report.py` creates a canonical root and alias root with the same `project_id`, runs backup verification once, and asserts both report paths exist.

D1 does not broaden this contradiction into:

- generic backend root resolution
- recovery root selection
- restore root selection
- snapshot root selection
- export root selection
- backup restore root selection
- draft generation/acceptance root selection
- loader diagnostics
- recents identity
- UX visibility

## 5. Mutation purpose

Mutation D1 purpose:

Ensure backup verifier report persistence for a requested verification operation writes report state only to the intended project root for that operation, not to every root whose `project.json` advertises the same `project_id`.

D1 is not:

- broad backend root rebinding
- recovery architecture repair
- restore repair
- draft persistence repair
- loader diagnostics
- recents/schema repair
- UI visibility work
- Stage 15 cleanup

## 6. Allowed implementation boundary

Allowed files for later implementation consideration:

- `services/src/blackskies/services/routers/backup_verifier.py`
- `services/tests/test_backup_verifier_report.py`

Conditional allowed file:

- `services/src/blackskies/services/backup_verifier.py`

The conditional file may be changed only if D1 execution proves a direct need to adjust backup-verifier service behavior involved in report target handling. Current scope inspection indicates the primary write-target behavior lives in the router.

No other files are authorized by this scope. Any additional file requires a later reviewed scope amendment that explains direct necessity and names the file explicitly.

## 7. Forbidden implementation boundary

D1 must not change:

- recovery behavior
- restore behavior
- snapshot behavior
- export behavior
- backup restore behavior
- draft generation behavior
- draft acceptance behavior
- generic backend project-root resolution
- project loader behavior
- renderer App behavior
- ProjectHome behavior
- recents schema
- UI visibility or warnings
- runtime truth schema
- protected evidence
- Stage 15 records or behavior

Forbidden file/area examples:

- `app/renderer/**`
- `app/main/preload.ts`
- `app/shared/ipc/**`
- `app/main/projectLoaderIpc.ts`
- `services/src/blackskies/services/routers/recovery.py`
- `services/src/blackskies/services/routers/restore.py`
- `services/src/blackskies/services/routers/snapshots.py`
- `services/src/blackskies/services/routers/export.py`
- `services/src/blackskies/services/routers/backups.py`
- `services/src/blackskies/services/routers/draft/**`
- `services/src/blackskies/services/persistence/**` except the conditional backup-verifier service file named above does not live there
- protected evidence paths listed in section 10

## 8. Expected behavior after D1

D1 should preserve:

- ability to run backup verification for the requested `projectId`
- ability to return verification results
- existing runtime truth / feature-gating expectations
- report persistence for the intended project root
- use of synthetic temp roots in tests
- no protected evidence mutation

D1 should prevent:

- writing `last_verification.json` into alias roots merely because their `project.json` advertises the same `project_id`
- duplicating one verification report across multiple roots in one run
- treating duplicate-ID/alias roots as automatic report persistence targets

D1 may allow:

- duplicate-ID or alias-root conditions to be detected or reported if current architecture already supports that or if the later implementation can do so within the allowed file boundary

D1 must not require:

- new recovery/restore behavior
- new global project-root model
- new schema migration
- new protected fixture materialization

## 9. Test / witness expectation

D1 implementation must include targeted test coverage or targeted test update showing:

- a backup verification run persists `last_verification.json` to the intended project root
- the same run does not persist `last_verification.json` to an alias root that advertises the same `project_id`
- existing feature-gating/runtime-truth expectations remain intact

Test substrate:

- synthetic temp roots only
- no protected sample projects
- no receipts
- no snapshot updates
- no recovery execution
- no restore execution

Expected targeted command shape:

```text
python -m pytest services/tests/test_backup_verifier_report.py
```

If runtime-truth expectations are touched by mistake, D1 execution must stop unless the scoped behavior truly requires that change. This scope does not authorize runtime truth schema or artifact changes.

Do not require broad service test suites unless D1 execution identifies and reports a narrow shared-harness need.

## 10. Protected evidence posture

D1 scope does not authorize touching:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

No fixture materialization, receipt creation, recovery execution, restore execution, backend write against protected evidence, protected evidence regeneration, or snapshot update is authorized.

## 11. Rollback boundary

Rollback for D1 is:

- revert the D1 implementation commit
- revert the D1 execution record if needed
- no protected evidence cleanup expected because D1 must not touch protected evidence

No schema or migration rollback is expected. If D1 execution unexpectedly requires schema or migration work, it must stop because this scope does not authorize that boundary.

## 12. Post-mutation reassessment requirement

After implementation, a post-D1 reassessment record is required before PKG-D can proceed.

Expected later record:

```text
docs/product_systems/stage14_pkg_d_post_mutation_d1_reassessment.md
```

The reassessment must decide whether:

- D1 resolved the backup verifier report write-target contradiction
- any backup-verifier report persistence residual remains
- broader PKG-D witness work is still needed
- closure preparation is eligible

## 13. Residuals explicitly not resolved by D1

D1 does not resolve:

- broad divergent active-path/backend-root behavior
- recovery destination safety generally
- restore destination safety generally
- snapshot/export/draft write-target behavior
- draft save/edit identity behavior generally
- project picker behavior
- loader missing-ID diagnostics
- recents identity visibility
- divergence warning behavior
- App UI identity visibility outside ProjectHome

Broad divergent active-path/backend-root behavior remains classified as:

```text
narrow unresolved seam needing later witness
```

That residual must not be folded into D1 unless later accepted evidence and a reviewed scope amendment change the boundary.

## 14. Scope verdict

PZ_CONTINUE: PKG-D Mutation D1 scope ready for review
