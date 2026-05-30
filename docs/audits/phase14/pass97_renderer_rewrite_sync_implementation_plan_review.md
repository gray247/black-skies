# Pass 97 - Renderer Rewrite Sync Implementation Plan Review

## 1. Proposed Repair Summary

Pass 96 proposed a narrow repair lane around the post-sync visible draft invariant after `Sync draft view`.

Its main claims were:

- the broken behavior is the visible active draft after sync, not the backend rewrite route,
- the intended contract is visible rewritten draft correctness rather than long-lived `draftEdits` residency,
- the likely implementation seam is shared by `useCritique.applyRewrite`, `App` draft normalization, and the failing `AppCritique` mock contract.

That direction is mostly correct, but the candidate file list was still slightly broader than the strongest evidence supports.

## 2. Candidate Files Review

| File | Keep in implementation scope? | Review |
| --- | --- | --- |
| `app/renderer/__tests__/AppCritique.test.tsx` | Yes | This file owns the failing red signal, and its `ProjectHomeMock` currently exposes only `draftOverrides` or a static `loadedProject.drafts` fallback. |
| `app/renderer/hooks/useCritique.ts` | Maybe, but only if runtime post-sync state is actually wrong | `applyRewrite` already writes the rewritten text into all three renderer mirrors. Current static evidence does not prove this file is the first thing that must change. |
| `app/renderer/App.tsx` | Maybe, but only if normalization is shown to erase visible correctness | `handleActiveSceneChange` and `handleDraftChange` can normalize `draftEdits` away when it matches baseline. That is a real seam, but not yet proven to require repair. |
| `app/renderer/components/ProjectHome.tsx` | No, remove from initial implementation scope | The real component already supports the intended visible contract by preferring `draftOverrides` and then falling back to live `activeProject.drafts`. Static evidence points away from this file as the first repair target. |
| `app/renderer/utils/draftPreviewSync.ts` | No, remove from implementation scope | This is helper/cache state for cross-window preview sync and is not part of the failing unit-test seam. |

## 3. Minimality Assessment

Pass 96 was close, but not yet the smallest possible scope.

The smallest evidence-backed implementation authorization is narrower:

- first-class implementation target: `app/renderer/__tests__/AppCritique.test.tsx`
- conditional implementation targets only if the test harness is not the whole problem:
  - `app/renderer/hooks/useCritique.ts`
  - `app/renderer/App.tsx`

`ProjectHome.tsx` and `draftPreviewSync.ts` should be downgraded to reference-only files for the next implementation pass.

Answer to the core question:

- Is the proposed repair scope the smallest possible?
  - No. It is slightly too large because it still treats `ProjectHome.tsx` and `draftPreviewSync.ts` as potential change targets without evidence that they need to change.
- Can any file be removed from scope?
  - Yes. Remove `ProjectHome.tsx` and `draftPreviewSync.ts` from authorized implementation scope.

## 4. Alternative Smaller Repairs

The smaller alternatives, in order, are:

1. Test-only repair
   - adjust `ProjectHomeMock` so it can observe the same visible contract the real `ProjectHome` already supports.
   - This is the smallest possible lane if the runtime already behaves correctly and only the mock is stale.

2. Test plus one renderer seam
   - if the mock is corrected and the visible post-sync contract still fails, limit repair to:
     - `useCritique.applyRewrite`, or
     - `App` draft normalization
   - Do not touch both renderer files unless one alone cannot satisfy the intended postcondition.

3. Mixed repair only if proven
   - if targeted implementation work shows both mock drift and runtime drift, authorize:
     - `AppCritique.test.tsx`
     - exactly one of `useCritique.ts` or `App.tsx` first
   - expanding to both renderer files should require direct evidence from the implementation pass, not pre-authorization here.

## 5. Over-Repair Risks

The main over-repair risks are:

- treating a stale mock contract as a renderer architecture problem,
- modifying `ProjectHome.tsx` even though the real component already honors the intended fallback order,
- widening into draft-preview cache or cross-window sync work that the failure does not require,
- forcing persistent `draftEdits` residency even though Pass 95 established visible correctness as the contract,
- changing both `useCritique.ts` and `App.tsx` before proving which seam actually violates the post-sync invariant.

## 6. Test Coverage Assessment

`app/renderer/__tests__/AppCritique.test.tsx` is still the right primary proof surface for this bug because it exercises:

- critique route selection,
- rewrite route selection,
- saved rewrite preview,
- sync action,
- post-sync visible draft state,
- rewrite payload precedence from `draftEdits`.

But its current mock narrows the proof surface incorrectly:

- it can only observe `draftOverrides`,
- or a static `loadedProject.drafts`,
- and does not model the live `activeProject.drafts` path that the real `ProjectHome` uses.

So the bug is most likely:

- mixed, with a strong test-harness component,
- not yet proven to be a pure runtime bug.

## 7. Validation Sufficiency Assessment

Pass 96's validation plan is directionally correct but needs one sharper boundary.

What proves the narrow user-facing contract for this lane:

- the critique/rewrite/sync scenario in `AppCritique.test.tsx` passes,
- the visible draft after sync is the rewritten text,
- the route-path assertions remain on `draft/critique` and `draft/rewrite`,
- the payload-source assertion still proves `draftEdits` wins before rewrite submission.

What does not prove the full user-facing contract:

- toast success alone,
- modal close alone,
- internal mirror mutation alone,
- truth-lane success alone,
- this unit test alone as a substitute for human GUI smoke.

So the validation plan is sufficient for a narrow renderer/test repair lane, but not sufficient to claim full runtime human-smoked proof.

## 8. Recommended Implementation Scope

Exact implementation scope that should be authorized:

1. Authorized change target:
   - `app/renderer/__tests__/AppCritique.test.tsx`

2. Conditionally authorized runtime targets, only if the implementation pass proves the mock is not the only issue:
   - `app/renderer/hooks/useCritique.ts`
   - `app/renderer/App.tsx`

3. Not authorized for the first implementation lane:
   - `app/renderer/components/ProjectHome.tsx`
   - `app/renderer/utils/draftPreviewSync.ts`

Implementation rule:

- start with the failing test harness contract,
- only widen into `useCritique.ts` or `App.tsx` if the intended visible post-sync invariant still cannot be satisfied,
- do not authorize `ProjectHome.tsx` or `draftPreviewSync.ts` without fresh evidence.

## 9. Stop Conditions

Stop or re-scope the later implementation pass if:

- the change starts redefining draft authority rather than fixing visible post-sync correctness,
- `ProjectHome.tsx` becomes a proposed edit without new evidence,
- cross-window preview sync enters scope,
- the pass starts changing both `useCritique.ts` and `App.tsx` without proving one is insufficient,
- the repair argument shifts from visible correctness to permanent override persistence.

## 10. Final Verdict

- `REPAIR PLAN REQUIRES REVISION`

Revision required:

- shrink the authorized implementation scope,
- remove `ProjectHome.tsx` and `draftPreviewSync.ts` from initial repair candidates,
- treat the bug as mixed with a strong test-harness component,
- authorize a test-first implementation lane with conditional expansion only into `useCritique.ts` or `App.tsx` if needed.
