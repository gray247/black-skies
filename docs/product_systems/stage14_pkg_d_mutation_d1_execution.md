# Stage 14 PKG-D Mutation D1 Execution

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
c0c7370680dcef6bfc2eb3a8d0bb590ace030620 docs(product): scope PKG-D Mutation D1
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
c0c7370 docs(product): scope PKG-D Mutation D1
b3bc51d docs(product): decide PKG-D Mutation D1 scope eligibility
6140fd6 docs(product): baseline Stage 14 PKG-D
26fe913 docs(product): charter Stage 14 PKG-D
```

## 2. Records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_d_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_d_scope_decision.md`
- `docs/product_systems/stage14_pkg_d_mutation_d1_scope.md`
- `docs/product_systems/stage14_pkg_a_closure_review.md`
- `docs/product_systems/stage14_pkg_a_closure_preparation.md`

## 3. Files changed

Changed production file:

- `services/src/blackskies/services/routers/backup_verifier.py`

Changed targeted test file:

- `services/tests/test_backup_verifier_report.py`

Created execution record:

- `docs/product_systems/stage14_pkg_d_mutation_d1_execution.md`

Conditional scoped file not changed:

- `services/src/blackskies/services/backup_verifier.py`

## 4. Contradiction addressed

Accepted contradiction:

A backup verification run for one requested `projectId` could persist `last_verification.json` to multiple project roots that advertise the same `project_id`, including alias roots, instead of limiting report persistence to the singular intended project root for the requested verification operation.

## 5. Implementation summary

In `services/src/blackskies/services/routers/backup_verifier.py`, D1 changed only the report persistence target after `run_verification(...)`.

Before D1:

- the route computed `report_roots = _project_report_roots(settings, validated_id) or [project_root]`
- it looped over every report root
- it wrote the same `last_verification.json` into each metadata-matching root

After D1:

- the route still validates `projectId`
- the route still resolves the intended requested root as `settings.project_base_dir / validated_id`
- the route still runs verification for that root
- the route writes `last_verification.json` only under that intended `project_root / SNAPSHOT_DIR_NAME`
- alias roots that merely advertise the same `project_id` are no longer automatic report write targets

No router request shape, feature flag, runtime truth schema, recovery, restore, snapshot, export, backup-restore, draft, renderer, loader, recents, UI, or generic backend root behavior was changed.

## 6. Test changes

In `services/tests/test_backup_verifier_report.py`, the targeted backup verifier run test was updated.

The updated test now proves:

- a backup verification run persists `last_verification.json` to the intended project root
- the same run does not persist `last_verification.json` to an alias root whose `project.json` advertises the same `project_id`
- the report endpoint still returns the persisted report from the intended root

The test continues to use synthetic temp roots through the existing test client fixture. No protected sample projects are used.

Existing runtime-truth / feature-gating expectations were preserved by not changing runtime truth files or tests.

## 7. Commands run and results

Command 1:

```text
python -m pytest services/tests/test_backup_verifier_report.py
```

Result: failed before test execution.

Exit code: `1`

Failure summary:

- collected 3 tests
- all 3 errored during setup
- pytest could not access `C:\Users\gray2\AppData\Local\Temp\pytest-of-gray2`
- pytest also warned it could not create `services\.pytest_cache`

Classification: environment/temp permission failure, not product failure.

Command 2:

```text
$env:TMP='C:\tmp'; $env:TEMP='C:\tmp'; python -m pytest services/tests/test_backup_verifier_report.py --basetemp C:\tmp\black-skies-pkg-d-d1-pytest -p no:cacheprovider
```

Result: failed before test execution.

Exit code: `1`

Failure summary:

- collected 3 tests
- all 3 errored during setup
- pytest could not create `C:\tmp\black-skies-pkg-d-d1-pytest`

Classification: environment/temp permission failure, not product failure.

Command 3:

```text
python -m pytest services/tests/test_backup_verifier_report.py --basetemp .\.codex-pytest-d1 -p no:cacheprovider
```

Result: passed.

Exit code: `0`

Summary:

```text
3 passed in 1.17s
```

Rationale for adjusted command:

- the required exact command could not execute due host temp/cache permission failures
- the adjusted command kept the same test target
- the adjusted command used a synthetic workspace basetemp
- pytest cache writes were disabled to avoid unrelated cache permission failures

Cleanup:

- `.codex-pytest-d1` was removed after the run
- the deletion target was resolved and verified to be inside `C:\Dev\black-skies`

## 8. Protected evidence posture

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

No recovery execution, restore execution, receipt materialization, protected fixture materialization, protected backend write, protected evidence regeneration, or snapshot update was performed.

## 9. Scope compliance review

D1 stayed inside the scoped files:

- `services/src/blackskies/services/routers/backup_verifier.py`
- `services/tests/test_backup_verifier_report.py`

The conditional file `services/src/blackskies/services/backup_verifier.py` did not require mutation.

No forbidden areas were changed:

- renderer files
- App / ProjectHome files
- preload / IPC bridge files
- project loader files
- recovery routers/services
- restore routers/services
- snapshot services
- export services
- backup restore behavior
- draft generation/acceptance/persistence files
- generic backend project-root resolution
- recents schema/storage
- UI visibility or warning behavior
- runtime truth schema or artifacts
- Stage 15 records

## 10. Residuals not resolved

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

Broad divergent active-path/backend-root behavior remains a narrow unresolved seam needing later witness unless later evidence changes that classification.

## 11. Post-mutation reassessment requirement

The next required record is:

```text
docs/product_systems/stage14_pkg_d_post_mutation_d1_reassessment.md
```

That reassessment must decide whether:

- D1 resolved the backup verifier report write-target contradiction
- any backup-verifier report persistence residual remains
- broader PKG-D witness work is still needed
- closure preparation is eligible

## 12. Final verdict

PZ_CONTINUE: PKG-D Mutation D1 ready for reassessment
