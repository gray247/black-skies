# Stage 14 PKG-E Mutation E1 Scope

## 1. Repository gate result

- Verified on branch `salvage/minimal-two-surface-shell`.
- `git rev-parse HEAD` -> `00f65495bb317b03e01b8dd9549529e044eb2c5e`
- `git status -sb` showed `## salvage/minimal-two-surface-shell...origin/salvage/minimal-two-surface-shell`
- `git status --short` was empty.
- `git log -44 --oneline` included:
  - `00f6549 docs(product): capture Stage 14 PKG-E witnesses`
  - `8d187be docs(product): plan Stage 14 PKG-E witnesses`
  - `955cf53 docs(product): baseline Stage 14 PKG-E`
  - `2d82c55 docs(product): charter Stage 14 PKG-E`
  - `68d0e8d docs(product): close Stage 14 PKG-D`
- Gate verdict: passed. The branch was clean and synchronized at Mutation E1 scope creation time.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_e_charter.md`
- `docs/product_systems/stage14_pkg_e_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_e_witness_plan.md`
- `docs/product_systems/stage14_pkg_e_witness_execution.md`

## 3. Accepted contradiction

Accepted PKG-E witness findings:

- recents/picker identity visibility: contradiction proved
- diagnostics clarity under divergence: contained

Mutation E1 is scoped only to the proved recents/picker identity-visibility contradiction.

Mutation E1 does not absorb diagnostics clarity work because the accepted witness classified that lane as contained rather than contradictory.

## 4. Mutation purpose

Mutation E1 exists to make the recents/picker user-facing surface expose enough canonical project identity for valid-ID projects, including divergent path/name versus metadata `projectId` conditions, so path/name presentation alone is not treated as identity authority.

This mutation is a visibility/presentation correction only. It is not a backend, persistence, or loader-authority repair.

## 5. Allowed implementation boundary

Mutation E1 may be limited to the smallest direct recents/picker identity-visibility change needed to resolve the accepted contradiction.

Likely allowed files, only if directly needed:

- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
- `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`

Allowed mutation characteristics:

- renderer-only recents/picker identity presentation work
- canonical `Project ID` exposure for valid-ID recent/openable entries where identity could otherwise be inferred only from path/name
- preservation of existing ProjectHome canonical `Project ID` details behavior
- preservation of missing-ID remembered-path hygiene
- targeted synthetic-data witness/test updates only if required to express the bounded display change

Display-first expectation:

- prefer resolving the contradiction through user-facing recents/picker presentation before authorizing any recents schema expansion
- do not widen beyond the exact divergent valid-ID identity seam proved by the witness unless the later implementation record proves the display-only path is insufficient

## 6. Forbidden implementation boundary

Mutation E1 must not authorize:

- backend changes
- loader behavior changes
- persistence or write-target behavior changes
- recovery/restore behavior
- snapshot/export/draft behavior
- runtime persistence architecture work
- App-wide UI redesign
- `AnalyticsDashboard` changes
- diagnostics clarity changes
- divergence warning behavior beyond recents/picker identity display
- recents schema migration unless later implementation evidence proves display-only cannot satisfy the accepted contradiction
- ProjectHome behavior outside recents/picker identity visibility
- Stage 15 work

Mutation E1 does not reopen PKG-A or PKG-D and does not expand into generic identity or diagnostic polish.

## 7. Expected behavior after E1

- recents/picker entries for valid-ID projects expose canonical `Project ID` where identity could otherwise be inferred only from path/name
- divergent valid-ID presentation shows enough canonical identity to avoid identity-authority confusion
- existing ProjectHome canonical `Project ID` details remain preserved
- missing-ID remembered-path hygiene remains preserved
- no protected evidence is mutated

Contained lane preservation:

- diagnostics clarity under divergence remains unchanged unless a strictly incidental renderer presentation adjustment is unavoidable and does not change lane classification or widen authority

## 8. Targeted test expectation

- targeted tests must use synthetic data only
- witness/test coverage should continue to prove the divergent valid-ID condition directly
- targeted coverage should prove that recents/picker-facing entries expose canonical identity for valid-ID projects in the contradictory seam
- targeted coverage should preserve:
  - ProjectHome canonical `Project ID` details visibility
  - missing-ID remembered-path hygiene
- no snapshot updates are authorized
- no AppPreflight expansion is authorized

## 9. Protected evidence posture

Protected evidence remains forbidden:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

Mutation E1 does not authorize touching, regenerating, loading, rewriting, or normalizing protected evidence.

## 10. Rollback boundary

Rollback boundary must remain narrow:

- recents/picker identity-visibility presentation only
- the smallest directly related renderer/test changes only
- no backend, bridge, loader-authority, persistence, or write-target rollback surface

If a proposed implementation requires wider rollback than the bounded recents/picker presentation seam, this scope is insufficient and a new scope decision is required first.

## 11. Post-mutation reassessment requirement

A post-mutation reassessment record is required after any E1 implementation.

That reassessment must confirm:

- whether the accepted recents/picker contradiction is resolved
- whether diagnostics clarity remains contained
- whether ProjectHome canonical `Project ID` details remain preserved
- whether missing-ID remembered-path hygiene remains preserved
- whether any new residuals were introduced

## 12. Residuals not resolved by E1

- recovery/restore destination safety
- backend write-target behavior
- snapshot/export/draft write-target behavior
- loader diagnostics except user-facing recents/picker identity clarity
- divergence warning behavior beyond recents/picker identity display
- App UI outside the scoped recents/picker surface
- remaining AppPreflight test-health residuals

These residuals remain outside Mutation E1 authority and are not resolved by this scope record.

## 13. Scope verdict

Mutation E1 scope is accepted only for the recents/picker identity-visibility contradiction proved by the PKG-E witness execution.

No diagnostics mutation is authorized under E1.

No backend, persistence, recovery, restore, write-target, or Stage 15 work is authorized under E1.

PZ_CONTINUE: PKG-E Mutation E1 scope ready for review
