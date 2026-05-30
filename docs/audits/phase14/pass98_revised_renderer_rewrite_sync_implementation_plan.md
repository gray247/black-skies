# Pass 98 - Revised Renderer Rewrite Sync Implementation Plan

## 1. Original Plan Review

Pass 96 correctly identified the visible post-sync contract:

- after `Sync draft view`,
- the active visible draft should match the saved rewrite,
- without requiring permanent `draftEdits` residency.

Pass 97 then narrowed the problem:

- the original candidate scope was still too large,
- `ProjectHome.tsx` and `draftPreviewSync.ts` should not be part of the first implementation lane,
- the strongest evidence points to a mixed bug with a strong test-harness component.

This pass adopts that narrowing and converts it into an implementation candidate with explicit expansion gates.

## 2. Scope Reduction Decisions

Scope reduction decisions for the next implementation lane:

- `app/renderer/__tests__/AppCritique.test.tsx`
  - `PRIMARY IMPLEMENTATION TARGET`
- `app/renderer/hooks/useCritique.ts`
  - `CONDITIONAL TARGET`
- `app/renderer/App.tsx`
  - `CONDITIONAL TARGET`
- `app/renderer/components/ProjectHome.tsx`
  - `OUT OF SCOPE`
- `app/renderer/utils/draftPreviewSync.ts`
  - `REJECTED FOR THIS LANE`

Reasoning:

- the failing red signal is owned directly by the mocked `ProjectHome` contract in `AppCritique.test.tsx`,
- `useCritique.applyRewrite` already writes rewritten text into all three renderer mirrors,
- `App` normalization remains a plausible runtime seam but is not yet proven to require change,
- `ProjectHome.tsx` already supports the intended visible fallback order,
- `draftPreviewSync.ts` is adjacent helper/cache logic, not part of the failing unit seam.

## 3. Primary Repair Candidate

Primary candidate:

- `app/renderer/__tests__/AppCritique.test.tsx`

Classification:

- `PRIMARY IMPLEMENTATION TARGET`

Can the repair begin with `AppCritique.test.tsx` alone?

- Yes.

Why:

- the current `ProjectHomeMock` exposes visible draft state only from:
  - `draftOverrides?.sc_0001`
  - otherwise static `loadedProject.drafts.sc_0001`
- the real `ProjectHome` supports a broader visible contract by falling back to live `activeProject.drafts`
- that makes the mock the smallest first implementation target

Smallest implementable change set:

- change only the failing mock/expectation surface in `AppCritique.test.tsx`
- make the test observe visible post-sync correctness rather than override-only persistence
- leave runtime code untouched unless that narrower test correction still exposes a real renderer failure

## 4. Conditional Repair Candidates

### `app/renderer/hooks/useCritique.ts`

Classification:

- `CONDITIONAL TARGET`

Evidence that would require expanding into `useCritique.ts`:

- after narrowing the mock contract, the post-sync scenario still fails because `applyRewrite` does not leave any renderer-visible path carrying the rewritten text,
- or the saved rewrite is not being written coherently into the renderer mirrors during sync,
- or the failure is traceable specifically to the mutation sequence inside `applyRewrite`.

Evidence that forbids expansion into `useCritique.ts`:

- if the corrected test passes without runtime edits,
- if the remaining failure is clearly caused by downstream normalization rather than `applyRewrite`,
- if widening into the hook would start redesigning draft authority instead of fixing the active-scene postcondition.

### `app/renderer/App.tsx`

Classification:

- `CONDITIONAL TARGET`

Evidence that would require expanding into `App.tsx`:

- after the mock is corrected, the rewritten text is written by `applyRewrite` but then removed or hidden by `handleActiveSceneChange` or `handleDraftChange`,
- or the failure is specifically caused by baseline normalization erasing visible correctness too early,
- or the bug is shown to live in the `draftEdits` normalization boundary rather than in the test harness.

Evidence that forbids expansion into `App.tsx`:

- if the corrected test passes without runtime edits,
- if the failure is fully satisfied by a test-only contract correction,
- if changing `App.tsx` would require broader mirror-model or authority redesign.

## 5. Explicitly Rejected Scope

### `app/renderer/components/ProjectHome.tsx`

Classification:

- `OUT OF SCOPE`

Reason:

- current code already prefers `draftOverrides` and then falls back to live `activeProject.drafts`,
- no current evidence shows that the real component violates the intended visible contract.

### `app/renderer/utils/draftPreviewSync.ts`

Classification:

- `REJECTED FOR THIS LANE`

Reason:

- it is cross-window helper/cache logic,
- it is not part of the failing unit-test seam,
- widening into it would be scope creep.

## 6. Minimal Change Strategy

The minimal strategy for the next implementation pass is:

1. Start with `AppCritique.test.tsx` only.
2. Adjust the mock so it can observe the same visible contract the real component already supports.
3. Re-run the relevant renderer proof.
4. Expand into exactly one runtime file only if the corrected test still exposes a real post-sync failure.
5. Do not change both `useCritique.ts` and `App.tsx` unless one alone is demonstrably insufficient.

This keeps the first implementation lane bounded to:

- failing proof surface first,
- one runtime seam second only if required,
- no architecture cleanup,
- no mirror redesign,
- no unrelated UI or preview-sync work.

## 7. Validation Plan

Primary validation proof:

- `app/renderer/__tests__/AppCritique.test.tsx` critique/rewrite/sync scenario must pass

Related assertions that must remain green in the same file:

- critique remains advisory and non-mutative before rewrite
- rewrite conflict handling remains specific and non-generic
- draft routes remain preferred over phase4 routes
- rewrite payload still prefers `draftEdits` over `projectDrafts`

Repo hygiene validation:

- `git diff --check`
- `pnpm lint:docs`

What this validation proves:

- the narrow renderer/test contract for visible post-sync draft correctness

What this validation does not prove:

- full human-smoked GUI behavior
- broader renderer health
- cross-window preview correctness

## 8. Failure Criteria

The next implementation attempt should be treated as failed or incomplete if:

- it requires `ProjectHome.tsx` changes without new evidence,
- it requires `draftPreviewSync.ts` changes,
- it expands into both `useCritique.ts` and `App.tsx` without proving one seam is insufficient,
- it hardens permanent `draftEdits` persistence as the goal,
- it fixes toast/modal assertions while leaving visible draft correctness ambiguous,
- it passes only by weakening the workflow-level user-facing contract.

## 9. Stop Conditions

Stop or re-scope the next implementation pass if:

- the change begins redesigning draft authority,
- the repair requires human-smoke-only claims to justify code edits,
- runtime evidence points outside the current seam,
- broad test cleanup or unrelated state work starts entering the lane,
- the change cannot remain limited to the active-scene rewrite-sync postcondition.

## 10. Final Verdict

- `READY FOR IMPLEMENTATION AUTHORIZATION`

Authorization conclusion:

- begin with `AppCritique.test.tsx` alone,
- expand into `useCritique.ts` only if the corrected mock still shows a sync-write failure,
- expand into `App.tsx` only if normalization is proven to erase visible correctness after sync,
- reject `ProjectHome.tsx` and `draftPreviewSync.ts` for this implementation lane.
