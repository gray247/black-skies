# Stage 17 Deferred-Issue Slice-Impact Decisions

## 1. Repo gate result

Repository checkpoint commands reviewed:

- `git rev-parse HEAD`
- `git status -sb`
- `git status --short`
- `git log -8 --oneline`

Gate result: pass.

- `HEAD`: `8b10bbe9c4f2fd42683eacd72a15c0caf7c6c162`
- branch: `salvage/minimal-two-surface-shell`
- upstream state: synchronized with `origin/salvage/minimal-two-surface-shell`
- worktree: clean

Required recent history present:

- `docs(product): open Stage 17 vertical slice entry review`

## 2. Records inspected

The following records were inspected:

- `docs/product_systems/stage17_vertical_slice_entry_review.md`
- `docs/product_systems/stage17_entry_deferred_issue_obligation.md`
- `docs/product_systems/stage17_entry_deferred_issue_routing_correction.md`
- `docs/product_systems/current_truth_index.md`
- `docs/product_systems/current_product_roadmap.md`
- `docs/product_systems/pre_code_discovery_plan.md`

## 3. Decision standard

Slice-relevant means the issue affects files, evidence boundaries, project-opening behavior, truth authority, or workflow behavior required to define, validate, or safely exclude the first vertical slice.

Stage 17 uses the current slice definition:

- a minimal buildable spine
- proving Black Skies can open a project
- preserve project truth and authority
- expose the two-surface workflow
- support one narrow writer-facing flow
- without broad feature expansion

## 4. Per-issue decision table

| Issue | Slice-impact decision | Stage 17 outcome | What blocks Stage 17 closure | What carries to Stage 18 | What blocks Stage 19 if unresolved |
| --- | --- | --- | --- | --- | --- |
| Restore/Import Identity Validation lane | not slice-relevant for the first slice as currently defined | excluded from Stage 17 with rationale | only if Stage 17 cannot defend the exclusion or later expands the slice to include restore/import behavior | confirm the exclusion remains honest during final pre-code readiness | implementation blocks if restore/import identity later becomes slice-relevant and remains unresolved |
| External Challenge Follow-Up / Current Validation lane | not slice-relevant for current Stage 17 decision scope based on the minimal first-slice spine | promoted to Stage 18 required review after Stage 17 lightweight slice-impact check | only if Stage 17 finds direct slice impact and neither handles nor promotes it explicitly | full required current-validation review in Stage 18 | implementation blocks if required current validation remains unresolved at Stage 18 closure |
| retained sample-root/current-vs-historical classification | not slice-relevant if the first slice is defined without sample-root, retained evidence-root, or protected-evidence path dependence | excluded from Stage 17 with rationale that the first slice must not depend on protected-evidence or retained sample-root paths | if Stage 17 cannot state whether the first slice uses sample/root/evidence paths | Stage 18 must confirm the exclusion remains honest for final pre-code readiness | implementation blocks if later slice or readiness work depends on sample-root/evidence paths and the boundary remains unresolved |
| unsafe-to-classify traceability records | no specific unsafe-to-classify record or category is slice-relevant to the first slice as currently defined | excluded from Stage 17 decision scope after explicitly stating no specific record/category is slice-relevant | if the bucket remains unsplit or Stage 17 cannot state that no specific record/category is slice-relevant | Stage 18 receives any traceability concern that later proves implementation-readiness relevant | implementation blocks if a traceability concern later proves readiness-relevant and remains unresolved |

## 5. Stage 17 included/excluded/promoted/blocking outcomes

Stage 17 outcomes:

- `Restore/Import Identity Validation lane`: excluded with rationale
- `External Challenge Follow-Up / Current Validation lane`: promoted to Stage 18 required review
- retained sample-root/current-vs-historical classification: excluded with rationale
- unsafe-to-classify traceability records: excluded from slice decision scope after explicit statement that no specific record/category is slice-relevant

No issue is included in substantive Stage 17 slice scope at this decision pass.

No issue is blocking at this decision pass, provided Stage 17 keeps the slice definition narrow:

- no restore/import behavior in the first slice
- no sample-root or retained protected-evidence path dependence in the first slice
- no unsplit unsafe-to-classify bucket carried forward ambiguously

## 6. Stage 18 carry-forward obligations

Stage 18 carry-forward obligations:

1. confirm the Stage 17 exclusion of restore/import identity remains honest for final pre-code readiness
2. conduct full required review for `External Challenge Follow-Up / Current Validation`
3. confirm the Stage 17 exclusion of sample-root/evidence-path dependence remains honest for final pre-code readiness
4. receive any traceability concern that later proves implementation-readiness relevant

## 7. Stage 19 implementation blockers

Stage 19 implementation remains blocked if any of the following becomes true and remains unresolved:

1. restore/import identity becomes slice-relevant or implementation-relevant without resolved validation scope
2. required external challenge/current validation remains unresolved at Stage 18 closure
3. sample-root or retained protected-evidence path dependence becomes necessary without resolved evidence-boundary treatment
4. any traceability concern proves implementation-readiness relevant and remains unresolved

## 8. Protected evidence posture

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

Nothing in this decision record authorizes modification, regeneration, movement, rename, deletion, archive creation, cleanup, normalization, or casual test use of protected evidence.

## 9. Recommended next safe action

Recommended next safe action:

- Jason review of this Stage 17 deferred-issue slice-impact decision record

After review, the next safe move is a read-only Stage 17 slice-scope definition pass that names the minimal included project-opening, truth-authority, two-surface, and narrow writer-flow spine without authorizing coding.

PZ_CONTINUE: Stage 17 deferred-issue slice-impact decisions ready for Jason review
