# Stage 14 PKG-D Scope Decision

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
6140fd6981184b440ce98f4947c4841d1931bc18 docs(product): baseline Stage 14 PKG-D
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
6140fd6 docs(product): baseline Stage 14 PKG-D
26fe913 docs(product): charter Stage 14 PKG-D
409b4f2 docs(product): close Stage 14 PKG-A
```

No runtime code, tests, fixtures, protected evidence, recovery, restore, receipts, snapshots, witness execution, Mutation D1 scope, backup-verifier behavior mutation, or Stage 15 work was created or modified.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_d_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_a_closure_review.md`
- `docs/product_systems/stage14_pkg_a_closure_preparation.md`

## 3. Source/test files inspected

- `services/src/blackskies/services/routers/backup_verifier.py`
- `services/src/blackskies/services/backup_verifier.py`
- `services/tests/test_backup_verifier_report.py`
- `services/tests/unit/test_runtime_truth.py`

No tests were run. The inspection was static and read-only.

## 4. Baseline finding under decision

The PKG-D read-only baseline found that backup verifier report persistence can write `last_verification.json` to multiple project roots that advertise the same `project_id`.

Baseline classification:

- confirmed by source inspection and existing test
- contradiction proved by static evidence
- mutation remains forbidden until a later scope decision and then a bounded mutation scope

The baseline also identified a broader divergent active-path/backend-root concern, but classified that separately as a narrow unresolved seam needing witness. This decision record evaluates only the backup-verifier report persistence finding.

## 5. Decision standard

A static finding may justify a mutation scope only if source and accepted existing tests directly show a reachable write-target behavior that can write project-local state to a root other than the singular intended project root for the requested operation.

If the source/test evidence shows only ambiguity or possible mismatch, a bounded witness is required before mutation scope.

Applied interpretation:

- "Direct" requires an actual write path, not merely a field-name ambiguity or a function that accepts both `projectId` and path.
- "Reachable" may be established by source route behavior plus existing tests using the route, without running a new witness in this decision pass.
- "Mutation scope eligible" does not authorize mutation. It only authorizes the next governance record to scope a bounded mutation.

## 6. Evidence review

### 6.1 Router source

Evidence label: confirmed by source inspection.

In `services/src/blackskies/services/routers/backup_verifier.py`, `_project_report_roots(settings, project_id)`:

- starts with `settings.project_base_dir`
- considers `base_dir / project_id`
- then iterates sibling entries under `base_dir`
- reads each candidate `project.json`
- includes every root whose `project.json.project_id` equals the requested `project_id`

In the same router, `run_backup_verifier(...)`:

- validates the requested `projectId`
- sets `project_root = settings.project_base_dir / validated_id`
- runs verification against that singular `project_root`
- serializes the report
- computes `report_roots = _project_report_roots(settings, validated_id) or [project_root]`
- writes the same `last_verification.json` to every `report_root / SNAPSHOT_DIR_NAME`

This is not merely an ambiguous path field. It is a write loop over multiple roots selected by advertised metadata identity.

### 6.2 Service source

Evidence label: confirmed by source inspection.

In `services/src/blackskies/services/backup_verifier.py`, `run_verification(project_root, ...)` verifies the single `project_root` supplied by the router and returns a report with `project_id = project_root.name`.

This matters because the report content is generated from one root, while router persistence can duplicate that report into other roots advertising the same metadata `project_id`.

### 6.3 Existing test

Evidence label: confirmed by existing executable test source.

In `services/tests/test_backup_verifier_report.py`, `test_backup_verification_run_persists_latest_report`:

- creates a canonical project root named `verify-run-writes-report`
- creates an alias root named `Esther_Estate`
- writes `project.json` in the alias root with `project_id = verify-run-writes-report`
- calls `POST /api/v1/backup_verifier/run?projectId=verify-run-writes-report&latest_only=true`
- asserts that `canonical_report_path.exists()`
- asserts that `alias_report_path.exists()`

That existing test directly documents and verifies the multi-root report write behavior.

### 6.4 Runtime truth context

Evidence label: confirmed by source inspection.

`services/tests/unit/test_runtime_truth.py` verifies that `/api/v1/backup_verifier/report` is not baseline-enabled and is guarded by `BLACKSKIES_BACKUP_VERIFIER_ENABLED`.

This does not negate the route/source/test evidence for the run endpoint's write behavior. It only limits broader default-baseline claims. The decision remains bounded to backup-verifier report persistence, not all runtime writes.

### 6.5 Distinction from broader divergent root seam

Evidence label: unresolved.

The broader backend pattern where many operations derive roots as `settings.project_base_dir / project_id` remains separate. This decision does not scope a broad recovery, restore, snapshot, export, backup, draft, or backend project-root rewrite.

The broad divergent-root concern may still need a later bounded witness, but it is not part of this backup-verifier scope decision.

## 7. Decision

PZ_CONTINUE: PKG-D Mutation D1 scope eligible

Reason:

- Source directly shows a report write loop over every root advertising the requested `project_id`.
- Existing test source directly asserts that a single verification run persists `last_verification.json` to both canonical and alias roots.
- The behavior is specific enough for a bounded Mutation D1 scope record.
- A confirmation witness is optional, not required, before scoping this narrow mutation.

This decision authorizes only the next governance record. It does not authorize implementation.

## 8. If Mutation D1 scope is eligible

Next record only:

```text
docs/product_systems/stage14_pkg_d_mutation_d1_scope.md
```

Likely D1 boundary:

- limited to backup verifier report write-target behavior
- prevent or bound `last_verification.json` persistence so one requested verification operation does not write report state into multiple project roots
- preserve the intended ability to run backup verification for the requested project
- preserve protected-evidence posture
- require a post-mutation reassessment if later implemented

Out of scope for D1:

- broad recovery rewrite
- broad restore rewrite
- broad backend project-root rewrite
- draft generation or acceptance write-target redesign
- loader diagnostics
- recents schema
- UX visibility work
- Stage 15 work

Likely files for later scope consideration, conditional only:

- `services/src/blackskies/services/backup_verifier.py`
- `services/src/blackskies/services/routers/backup_verifier.py` only if routing/request shape or report-root selection is directly implicated
- `services/tests/test_backup_verifier_report.py` only for targeted assertion update if later scoped

This decision record does not authorize mutation of those files.

## 9. If bounded confirmation witness is required

Not selected.

If reviewers reject static scope eligibility and require a confirmation witness, the next record should be:

```text
docs/product_systems/stage14_pkg_d_backup_verifier_witness_plan.md
```

That witness would need to be bounded to backup verifier duplicate-ID report persistence and synthetic temp roots only.

## 10. Broader divergent root seam handling

Classification: narrow unresolved seam needing witness.

The broad backend `projectId -> settings.project_base_dir / project_id` concern remains separate from this decision.

This decision does not scope:

- recovery-root mutation
- restore-root mutation
- snapshot-root mutation
- export-root mutation
- backup-root mutation
- draft save/edit-root mutation
- generic backend root resolution mutation

If pursued later, the broad divergent root seam should be handled by a separate PKG-D witness plan grounded in the baseline's broader seam analysis.

## 11. Protected evidence posture

No protected evidence was modified, regenerated, materialized, or executed against.

Protected evidence not touched for mutation:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

No fixture materialization, receipt creation, recovery execution, restore execution, backend write, protected evidence regeneration, or snapshot update was performed.

## 12. Forbidden next actions

The following remain forbidden by this decision record:

- immediate mutation
- broad recovery/restore implementation
- backend project-root rewrite
- loader diagnostics
- recents identity work
- UX visibility work
- protected evidence mutation
- Stage 15 work

Mutation D1 may only proceed after a separate reviewed scope record names the exact contradiction, allowed files, tests, protected-evidence posture, rollback boundary, and post-mutation reassessment requirement.

## 13. Final verdict

PZ_CONTINUE: PKG-D Mutation D1 scope eligible
