# Stage 17 Entry Deferred-Issue Obligation

## 1. Repo gate result

Repository checkpoint commands reviewed:

- `git rev-parse HEAD`
- `git status -sb`
- `git status --short`
- `git log -10 --oneline`

Gate result: pass.

- `HEAD`: `e04a7379b1ae12e9c9e33a13bf63c7f7f9789723`
- branch: `salvage/minimal-two-surface-shell`
- upstream state: synchronized with `origin/salvage/minimal-two-surface-shell`
- worktree: clean

Required recent history present:

- `docs(product): close Stage 16 repository cleanup scope`

## 2. Records inspected

The following records were inspected:

- `docs/product_systems/stage16_closure_review.md`
- `docs/product_systems/stage16_entry_review.md`
- `docs/product_systems/stage16_cleanup_archive_scope.md`
- `docs/product_systems/stage15_residual_ledger_cleanup_readiness_review.md`
- `docs/product_systems/stage15_post_closure_deferral_normalization.md`
- `docs/product_systems/stage15_post_closure_restore_identity_deferral_normalization.md`
- `docs/product_systems/current_truth_index.md`
- `docs/product_systems/current_product_roadmap.md`
- `docs/product_systems/pre_code_discovery_plan.md`

## 3. Purpose and routing rule

Purpose:

- convert carried deferred issues into Stage 17 and Stage 18 review obligations before Stage 19 coding
- prevent named deferred lanes from functioning as vague `later` buckets
- preserve Stage 16 closure while tightening the next required review point for each carried issue

Required routing rule:

No deferred issue may be carried forward unless the next review stage that must touch it is named, and the consequence of non-resolution is stated as `resolve`, `exclude`, `promote`, or `block`.

This record does not:

- reopen Stage 16
- authorize Stage 17 implementation
- authorize Stage 18 implementation
- authorize Stage 19 implementation
- convert review obligations into runtime, test, cleanup, archive, or evidence-mutation work

## 4. Stage position

Current stage position:

- Stage 16 is closed
- Stage 17 is `Vertical Slice Plan`
- Stage 18 is `Final Pre-Code Build Readiness Review`
- Stage 19 is `Implementation`
- implementation remains blocked
- protected evidence remains protected

## 5. Required definitions

### 5.1 Slice-relevant

An issue is slice-relevant if it affects files, evidence boundaries, project-opening behavior, truth authority, or workflow behavior required to define, validate, or safely exclude the first vertical slice.

### 5.2 Stage 17 closure blocker

An issue blocks Stage 17 closure only if it prevents honest slice inclusion/exclusion, evidence-boundary definition, or traceable acceptance of the slice plan.

## 6. Deferred-issue obligations

### 6.1 Restore/Import Identity Validation lane

- current home: `later explicitly authorized Restore/Import Identity Validation lane`
- Stage 17 entry obligation: perform a slice-impact check and decide whether restored-copy identity affects the first vertical slice, project-opening behavior, truth authority, or evidence-boundary definition
- Stage 18 obligation: if Stage 17 excludes the issue from the slice with recorded non-impact rationale, Stage 18 must still confirm that pre-code readiness does not depend on unresolved restore/import identity substance
- slice-impact check required: yes
- possible outcomes:
  - included in Stage 17 decision scope
  - excluded from Stage 17 with rationale
  - promoted to Stage 18 required review
  - routed to later lane with explicit non-impact statement
- consequence if unresolved: `block` if slice-relevant and no scoped validation lane or exclusion rationale exists; otherwise `exclude` or `promote`
- whether Stage 17 may resolve substance: only if Jason explicitly scopes restore/import identity validation inside Stage 17 decision work; otherwise no
- whether implementation is forbidden: yes

Specific Stage 17 rule:

- Stage 17 can exclude restore/import identity from the slice and still close if a non-impact rationale is recorded
- if restored-copy identity is slice-relevant, Stage 17 must scope the validation lane or block closure

### 6.2 External Challenge Follow-Up / Current Validation lane

- current home: `later explicitly authorized External Challenge Follow-Up / Current Validation lane`
- Stage 17 entry obligation: perform only a lightweight slice-impact check to determine whether unresolved external-challenge questions affect the first vertical slice
- Stage 18 obligation: full current validation review belongs to Stage 18 unless Stage 17 finds slice impact that requires earlier promotion
- slice-impact check required: yes
- possible outcomes:
  - included in Stage 17 decision scope if clear slice impact is found
  - excluded from Stage 17 with rationale
  - promoted to Stage 18 required review
  - routed to later lane with explicit non-impact statement
- consequence if unresolved: `promote` to Stage 18 unless Stage 17 finds direct slice impact, in which case `resolve`, `exclude`, or `block` before Stage 17 closure
- whether Stage 17 may resolve substance: no, except to the limited extent needed to judge slice impact
- whether implementation is forbidden: yes

Specific Stage 17 rule:

- Stage 17 does not perform full external challenge or current validation substance work
- Stage 17 only decides whether unresolved external-challenge material is slice-relevant enough to require earlier promotion

### 6.3 Retained sample-root/current-vs-historical classification

- current home: Stage 17 `Vertical Slice Plan` entry obligation, with the Stage 16 scope/readiness gate preserved as historical source and with reassignment to a later explicitly authorized current-versus-historical classification follow-up lane if Stage 17 cannot safely classify it
- Stage 17 entry obligation: decide whether the first vertical slice uses sample-root, retained evidence-root, or related protected-evidence paths, and record the resulting evidence-boundary posture
- Stage 18 obligation: if Stage 17 excludes sample-root usage from the slice, Stage 18 must confirm that implementation readiness still preserves the exclusion and evidence boundary
- slice-impact check required: yes
- possible outcomes:
  - included in Stage 17 decision scope
  - excluded from Stage 17 with rationale
  - promoted to Stage 18 required review
  - routed to later lane with explicit non-impact statement
- consequence if unresolved: `block` if Stage 17 cannot state whether the slice uses sample/root/evidence paths
- whether Stage 17 may resolve substance: Stage 17 may resolve classification and slice-boundary substance only; it may not repair, regenerate, move, archive, or normalize evidence
- whether implementation is forbidden: yes

Specific Stage 17 rule:

- Stage 17 must decide whether the first slice uses sample/root/evidence paths
- if that question remains unclear, Stage 17 closure is blocked

### 6.4 Unsafe-to-classify traceability records

- current home: Stage 17 `Vertical Slice Plan` entry obligation to split unsafe-to-classify traceability material into named records or categories, with the carried Stage 16 bucket preserved as historical source
- Stage 17 entry obligation: split the bucket into named records or named categories that are slice-relevant, or state that no specific unsafe-to-classify record is slice-relevant to the first vertical slice
- Stage 18 obligation: any non-slice-relevant unsafe-to-classify traceability concern that still matters for implementation readiness must be promoted to Stage 18 as a required review item
- slice-impact check required: yes
- possible outcomes:
  - included in Stage 17 decision scope
  - excluded from Stage 17 with rationale
  - promoted to Stage 18 required review
  - routed to later lane with explicit non-impact statement
- consequence if unresolved: `block` if the bucket remains unsplit and Stage 17 cannot say which named record or category matters to the slice
- whether Stage 17 may resolve substance: Stage 17 may resolve slice-relevance and classification visibility only; it may not convert the bucket into cleanup, archive, runtime, or test work
- whether implementation is forbidden: yes

Specific Stage 17 rule:

- an unsplit unsafe-to-classify bucket cannot pass Stage 17 closure
- Stage 17 must either name slice-relevant records/categories or state that no specific unsafe-to-classify record is slice-relevant

## 7. Stage 17 obligation summary

Stage 17 obligations:

1. perform a slice-impact check for `Restore/Import Identity Validation lane`
2. perform a lightweight slice-impact check for `External Challenge Follow-Up / Current Validation lane`
3. decide whether the first slice uses sample/root/evidence paths and record the evidence-boundary consequence
4. split the `unsafe-to-classify traceability records` bucket into named slice-relevant records/categories or state that none are slice-relevant
5. record, for each carried issue, whether the Stage 17 consequence is `resolve`, `exclude`, `promote`, or `block`

## 8. Stage 18 obligation summary

Stage 18 obligations:

1. receive promoted `External Challenge Follow-Up / Current Validation` review unless Stage 17 finds and handles slice impact earlier
2. confirm any Stage 17 exclusion of restore/import identity or sample-root dependence remains honest for final pre-code readiness
3. receive any non-slice-relevant unsafe-to-classify traceability concern that still matters to implementation readiness
4. reject vague carry-forward wording and require named review-stage touchpoints before Stage 19

## 9. Stage 17 closure blockers before closure

The following conditions block Stage 17 closure:

- restored-copy identity is slice-relevant and Stage 17 neither scopes the validation lane nor excludes it with a defensible non-impact rationale
- external-challenge material is found slice-relevant and Stage 17 neither handles the slice decision nor promotes it explicitly
- Stage 17 cannot decide whether the first slice uses sample/root/evidence paths
- the unsafe-to-classify traceability bucket remains unsplit
- any carried issue reaches Stage 17 closure without a named next review stage and a stated consequence of non-resolution

The following conditions do not block Stage 17 closure by themselves:

- a carried issue is excluded from the first slice with explicit rationale
- a carried issue is promoted to Stage 18 with explicit rationale
- a later lane remains the substantive home after Stage 17 records explicit non-impact on the first slice

## 10. Protected evidence posture

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

Nothing in this record authorizes modification, regeneration, movement, rename, deletion, archive creation, cleanup, normalization, or casual test use of protected evidence.

## 11. Implementation prohibition

These obligations are review obligations only.

They must not be converted into:

- Stage 17 implementation work
- Stage 18 implementation work
- runtime changes
- test changes
- witness creation or regeneration
- cleanup/archive execution
- protected-evidence mutation

## 12. Final Stage 17 entry posture

Stage 17 may proceed only as `Vertical Slice Plan` review and planning work.

Before Stage 19 coding can be considered:

- Stage 17 must either resolve, exclude, promote, or block each carried issue
- Stage 18 must receive any promoted readiness obligations explicitly
- no deferred issue may continue forward as an unnamed or consequence-free lane

PZ_CONTINUE: Stage 17 deferred-issue obligation record ready for Jason review
