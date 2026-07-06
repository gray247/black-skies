# Stage 14 PKG-D Post-Amended-D2 Reassessment

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
7ffdb114d1218b101dde253b089611337257827e test(product): align PKG-D export request expectation
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
7ffdb11 test(product): align PKG-D export request expectation
a59c1a1 docs(product): amend PKG-D Mutation D2 scope
3c7d313 docs(product): record PKG-D Mutation D2 scope block
826b8f5 docs(product): scope PKG-D Mutation D2
40a8d83 test(product): capture PKG-D divergent root witnesses
a5e57ee fix(product): limit backup verifier report persistence to requested root
```

## 2. Records inspected

- `docs/product_systems/stage14_pkg_d_charter.md`
- `docs/product_systems/stage14_pkg_d_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_scope.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_execution.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_scope_amendment.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_amended_execution.md`
- `docs/product_systems/stage14_pkg_d_mutation_d2_test_scope_note.md`
- `docs/product_systems/stage14_pkg_d_divergent_root_witness_execution.md`

## 3. Verdict

Amended D2 resolved the accepted export write-target contradiction and the accepted draft acceptance write-target contradiction.

Amended D2 stayed within the amended scope.

The request-shape fallout that was directly caused by amended D2 was handled within the targeted test-scope note.

No new mutation is required from the accepted D2 evidence.

PKG-D closure preparation is eligible.

## 4. Reassessment

### Export contradiction

Classification:

- confirmed by executable witness: resolved

Reason:

- the divergent-root witness had proved export wrote to `settings.project_base_dir / project_id` instead of the active loaded root
- amended D2 added active loaded `projectPath` / `project_path` as write-target context
- targeted backend pytest now proves export writes to the validated active root and leaves the alias `project_id`-derived root untouched

### Draft acceptance contradiction

Classification:

- confirmed by executable witness: resolved

Reason:

- the divergent-root witness had proved draft acceptance content writes targeted `settings.project_base_dir / project_id` instead of the active loaded root
- amended D2 added active loaded `projectPath` / `project_path` as write-target context and routed accepted scene writes through the validated root
- targeted backend pytest now proves draft acceptance updates the validated active root and leaves the alias `project_id`-derived root untouched

### Scope compliance

Classification:

- confirmed by source inspection and execution record: contained within amended scope

Reason:

- canonical `projectId` remained the identity field
- active path/root remained write-target context only
- no ProjectHome, loader, recents, UI visibility, runtime truth schema, recovery, restore, snapshot, backup restore, draft generation, or generic backend root behavior was changed
- conditional backend files were used only where router-level validation would otherwise have been undone by `project_id` re-resolution

### Request-shape fallout

Classification:

- confirmed by targeted test update and rerun: contained

Reason:

- the amended execution record identified one directly relevant renderer failure caused by the new export request shape including `projectPath`
- the targeted note authorized only narrow request-shape expectation updates in `app/renderer/__tests__/AppPreflight.test.tsx`
- the follow-up test alignment commit removed the known `services.exportProject` request mismatch

### Remaining AppPreflight failures

Classification:

- unresolved but not contradicted for PKG-D

Reason:

- the rerun of `renderer/__tests__/AppPreflight.test.tsx` still exited `1`
- accepted follow-up reporting states the D2 request-shape mismatch was resolved
- remaining failures were described as broader AppPreflight issues, including project activation and split-command shell-status assertions
- no accepted evidence in the D2 records proves those failures were caused by amended D2

PKG-D does not chase those failures further on this record.

## 5. Test evidence summary

Accepted backend verification result:

```text
python -m pytest services/tests/test_pkg_d_divergent_root_write_targets.py --basetemp .\.codex-pytest-divergent-root-d2 -p no:cacheprovider
exit 0
4 passed
```

Accepted renderer follow-up result:

```text
node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppPreflight.test.tsx
exit 1
request-shape mismatch for services.exportProject resolved
remaining failures reported as unrelated broader AppPreflight issues
```

Sufficiency decision:

- confirmed by executable witness: the targeted divergent-root pytest result is sufficient for the two accepted PKG-D D2 contradictions because those contradictions were defined in the export and draft acceptance representative seams
- confirmed by targeted follow-up test note and rerun: the renderer request-shape fallout that was directly caused by amended D2 was handled at the authorized boundary
- unresolved broader AppPreflight failures are not accepted as D2-caused evidence on this package record

## 6. Residual classifications

| Residual | Evidence label | Classification | Notes |
| --- | --- | --- | --- |
| recovery/restore destination safety | unresolved | unresolved but not contradicted | D2 did not test or mutate these lanes. |
| snapshot write-target behavior | unresolved | unresolved but not contradicted | Export remained the representative artifact lane; snapshot was excluded. |
| backup restore behavior | unresolved | unresolved but not contradicted | Not reopened by amended D2. |
| draft generation | unresolved | unresolved but not contradicted | Draft acceptance was repaired; generation remains separate. |
| broader draft save/edit identity behavior | unresolved | unresolved but not contradicted | D2 fixed draft acceptance only, not the broader family. |
| project picker behavior | unresolved | out-of-scope deferred | No direct write-target dependency was newly proved. |
| loader diagnostics | unresolved | out-of-scope deferred | Not a D2 blocker and not reopened here. |
| recents identity visibility | unresolved | out-of-scope deferred | PKG-A/PKG-E style visibility concern, not PKG-D write-target proof. |
| divergence warning behavior | unresolved | out-of-scope deferred | Visibility/diagnostic concern, not write-target safety proof. |
| App UI outside ProjectHome | unresolved | out-of-scope deferred | Not a PKG-D mutation target from accepted evidence. |
| generic backend root behavior | unresolved | unresolved but not contradicted | D2 intentionally repaired only the proved export and draft acceptance seams. |

## 7. Mutation decision

Before PKG-D closure preparation:

- definitely required mutations remaining: 0
- likely required mutations remaining: 0
- evidence-dependent mutations remaining: 0-1

Rationale:

- the accepted D2 contradictions were repaired
- no new accepted contradiction was proved during post-amended-D2 verification
- broader unresolved seams remain classified as unresolved but not contradicted or out-of-scope deferred

## 8. Closure preparation eligibility

PKG-D closure preparation is eligible.

Reason:

- D1 repaired the accepted backup verifier report write-target contradiction
- amended D2 repaired the accepted export write-target contradiction
- amended D2 repaired the accepted draft acceptance write-target contradiction
- request-shape fallout caused by D2 was handled within the authorized targeted test note
- no accepted evidence currently proves another active PKG-D contradiction
- remaining residuals have stable non-blocking classifications and can be carried forward into closure preparation

## 9. Final verdict

PZ_CONTINUE: PKG-D closure preparation eligible
