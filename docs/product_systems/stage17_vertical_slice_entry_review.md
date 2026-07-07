# Stage 17 Vertical Slice Entry Review

## 1. Repo gate result

Repository checkpoint commands reviewed:

- `git rev-parse HEAD`
- `git status -sb`
- `git status --short`
- `git log -10 --oneline`

Gate result: pass.

- `HEAD`: `815685488384b3c78021c2e0fac60529f0345ec6`
- branch: `salvage/minimal-two-surface-shell`
- upstream state: synchronized with `origin/salvage/minimal-two-surface-shell`
- worktree: clean

Required recent history present:

- `docs(product): normalize Stage 17 deferred issue routing`
- `docs(product): define Stage 17 deferred issue obligations`
- `docs(product): close Stage 16 repository cleanup scope`

## 2. Records inspected

The following records were inspected:

- `docs/product_systems/stage17_entry_deferred_issue_obligation.md`
- `docs/product_systems/stage17_entry_deferred_issue_routing_correction.md`
- `docs/product_systems/current_truth_index.md`
- `docs/product_systems/current_product_roadmap.md`
- `docs/product_systems/pre_code_discovery_plan.md`
- `docs/product_systems/stage16_closure_review.md`

## 3. Current stage position

Current stage position:

- Stage 16 is closed
- Stage 17 is `Vertical Slice Plan`
- Stage 18 is `Final Pre-Code Build Readiness Review`
- Stage 19 is `Implementation`
- deferred-issue timing audit has passed
- Stage 17 planning may begin as governance and planning work only

## 4. Stage 16 closure confirmation

Stage 16 is closed.

Stage 16 closure remains controlling for:

- repository-cleanup scope-only closure
- no cleanup/archive execution performed
- protected evidence unchanged
- Stage 17 eligibility only through separate Jason authorization

## 5. Stage 17 confirmation

Stage 17 is named exactly `Vertical Slice Plan`.

Stage 17 is not:

- implementation authorization
- coding authorization
- runtime expansion
- test expansion
- cleanup/archive execution

## 6. Implementation block confirmation

Implementation remains blocked until Stage 19.

Stage 17 does not authorize:

- coding
- runtime mutation
- test mutation
- witness creation or regeneration
- protected-evidence mutation

Stage 17 must decide what is included, excluded, promoted, or blocking before implementation.

## 7. Vertical slice definition

For Black Skies, a vertical slice is:

A minimal buildable spine proving Black Skies can open a project, preserve project truth/authority, expose the two-surface workflow, and support one narrow writer-facing flow without broad feature expansion.

This definition is intentionally narrow.

It does not assume:

- broad feature completeness
- multi-lane product expansion
- cleanup/archive execution
- implementation detail selection inside this entry review

## 8. Stage 17 decision boundaries

Stage 17 decision boundaries:

- determine the minimal included slice spine
- determine explicit exclusions
- determine which deferred issues are slice-relevant
- determine which issues must be promoted to Stage 18
- determine which issues block Stage 17 closure
- preserve evidence boundaries, truth authority, and traceability

Stage 17 must not:

- authorize coding
- solve implementation detail mechanics
- widen into broad feature planning
- absorb unrelated later lanes
- touch protected evidence

## 9. Required deferred-issue obligations before Stage 17 closure

### 9.1 Restore/Import Identity Validation slice-impact check

Required obligation:

- perform the Stage 17 slice-impact check
- determine whether restore/import identity affects the first vertical slice, project-opening behavior, truth authority, or evidence-boundary definition

Required Stage 17 outcomes:

- if slice-relevant: resolve or scope the validation lane before Stage 17 closure, or block closure
- if not slice-relevant: exclude from Stage 17 with rationale and carry Stage 18 confirmation

### 9.2 External Challenge lightweight slice-impact check

Required obligation:

- perform the Stage 17 lightweight slice-impact check
- determine whether unresolved external challenge/current validation questions affect the first vertical slice

Required Stage 17 outcomes:

- if slice impact exists: promote into Stage 17 decision scope
- if no slice impact exists: promote to Stage 18 required review

### 9.3 Retained sample-root/evidence-boundary decision

Required obligation:

- decide whether the first vertical slice uses sample-root, retained evidence-root, or related protected-evidence paths
- record the resulting evidence-boundary posture

Required Stage 17 outcomes:

- if the slice depends on those paths: include the boundary decision explicitly in Stage 17 scope
- if the slice excludes those paths: record the exclusion with rationale for Stage 18 confirmation
- if the answer remains unclear: block Stage 17 closure

### 9.4 Unsafe-to-classify traceability bucket split

Required obligation:

- split the unsafe-to-classify traceability bucket into named records or named categories that are slice-relevant, or state that no specific unsafe-to-classify record is slice-relevant

Required Stage 17 outcomes:

- named slice-relevant records/categories with explicit treatment
- or explicit statement that no specific unsafe-to-classify record is slice-relevant
- unsplit bucket cannot pass Stage 17 closure

## 10. Explicit Stage 17 closure blockers

The following conditions block Stage 17 closure:

- restore/import identity is slice-relevant and Stage 17 neither scopes the validation lane nor excludes it with defensible rationale
- external challenge/current validation material is slice-relevant and Stage 17 neither handles the slice decision nor promotes it explicitly
- Stage 17 cannot decide whether the first slice uses sample-root/evidence paths
- the unsafe-to-classify traceability bucket remains unsplit
- any carried issue reaches Stage 17 closure without a named next review stage and a stated consequence of non-resolution

The following do not block Stage 17 closure by themselves:

- an issue is excluded from the first slice with explicit rationale
- an issue is promoted to Stage 18 with explicit rationale
- a later substantive lane remains the home after Stage 17 records explicit non-impact on the first slice

## 11. Stage 18 carry-forward obligations

Stage 18 carry-forward obligations:

1. confirm any Stage 17 exclusion of restore/import identity remains honest for final pre-code readiness
2. conduct full required review for `External Challenge Follow-Up / Current Validation` unless Stage 17 promotes it earlier
3. confirm any Stage 17 exclusion of sample-root dependence remains honest for final pre-code readiness
4. receive any non-slice-relevant unsafe-to-classify traceability concern that still matters to implementation readiness
5. reject vague carry-forward wording before Stage 19

## 12. Protected evidence posture

Protected evidence remains off-limits:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

Nothing in this entry review authorizes modification, regeneration, movement, rename, deletion, archive creation, cleanup, normalization, or casual test use of protected evidence.

## 13. Recommended next safe action

Recommended next safe action:

- Jason review of this Stage 17 entry record

After review, the next safe move is a read-only Stage 17 slice-inclusion/exclusion decision pass that works through the four carried obligations without authorizing coding.

PZ_CONTINUE: Stage 17 Vertical Slice entry review ready for Jason review
