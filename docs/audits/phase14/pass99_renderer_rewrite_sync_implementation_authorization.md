# Pass 99 - Renderer Rewrite Sync Implementation Authorization

## 1. Evidence Chain Review

The evidence chain is complete and internally consistent.

Pass 94 established:

- the failure is the renderer-side post-sync visibility seam,
- the backend rewrite route is not the leading suspected owner,
- the failing test harness owns part of the red signal.

Pass 95 established:

- persisted draft files are canonical authority,
- renderer state uses a baseline-plus-override model,
- visible post-sync correctness is the intended contract,
- long-lived `draftEdits` persistence is not the intended contract.

Pass 96 established:

- the repair lane should target the active-scene post-sync invariant,
- success must be proven by visible rewritten draft correctness, not by toast or internal writes.

Pass 97 established:

- the original repair scope was still too large,
- `ProjectHome.tsx` and `draftPreviewSync.ts` should not be in the first implementation lane.

Pass 98 established:

- the first implementation move should be test-first,
- `AppCritique.test.tsx` is the primary target,
- runtime widening into `useCritique.ts` or `App.tsx` must be evidence-gated.

## 2. Authorization Candidate Review

The current candidate is a narrow, test-first implementation lane.

That candidate now matches the strongest evidence because:

- the failing assertion is located in `app/renderer/__tests__/AppCritique.test.tsx`,
- the mock currently observes only `draftOverrides` or a static `loadedProject.drafts` fallback,
- the real runtime already supports a broader visible contract through live project-draft fallback,
- `useCritique.applyRewrite` already writes rewritten text into all three renderer mirrors,
- `App` normalization remains plausible but not yet proven to require change.

This means implementation is no longer blocked on ownership or authority ambiguity.

## 3. Scope Validation

Ownership has been mapped:

- yes, in Pass 94

Authority has been mapped:

- yes, in Pass 95

Repair scope has been narrowed:

- yes, across Pass 97 and Pass 98

Is implementation now the cheapest safe move?

- yes

Reason:

- another planning pass would repeat the same conclusion unless new runtime evidence appears,
- the smallest remaining uncertainty is best reduced by a bounded implementation attempt beginning in the failing test harness.

## 4. Minimality Validation

The current lane is minimal enough for authorization.

Why:

- it starts with one file,
- it forbids unrelated runtime expansion,
- it allows widening only if the corrected test still exposes a real renderer failure,
- it rejects broader component or cache work.

The alternative of requiring another planning pass is no longer cheaper or safer than a tightly guarded implementation pass.

## 5. Alternative Explanations Review

Alternative explanation 1:

- the bug is entirely test-only

Status:

- plausible
- directly covered by the authorized test-first lane

Alternative explanation 2:

- the bug is mixed: stale mock plus runtime normalization edge

Status:

- plausible
- directly covered by conditional widening into one runtime seam

Alternative explanation 3:

- the bug is primarily in `ProjectHome.tsx`

Status:

- not supported by current evidence

Alternative explanation 4:

- the bug is primarily in cross-window preview sync

Status:

- not supported by current evidence

Alternative explanation 5:

- the bug is actually backend rewrite failure

Status:

- contradicted by prior truth-lane and route evidence

## 6. Validation Sufficiency Review

Exact validation that must pass for the later implementation pass:

1. The critique/rewrite/sync scenario in `app/renderer/__tests__/AppCritique.test.tsx` must pass.
2. Related assertions in that same file must remain green:
   - critique remains advisory and non-mutative before rewrite
   - rewrite conflict handling remains specific and non-generic
   - draft routes remain preferred over phase4 routes
   - rewrite payload still prefers `draftEdits` over `projectDrafts`
3. Repo hygiene validation must pass:
   - `git diff --check`
   - `pnpm lint:docs`

What this is sufficient to prove:

- the narrow renderer/test contract for visible post-sync correctness

What this is not sufficient to prove:

- full human-smoked GUI proof
- broader renderer health
- cross-window preview correctness

## 7. Authorized Scope

### `app/renderer/__tests__/AppCritique.test.tsx`

Classification:

- `AUTHORIZED`

Allowed purpose:

- repair the failing mock/expectation contract so the test observes visible post-sync correctness rather than override-only persistence

### `app/renderer/hooks/useCritique.ts`

Classification:

- `CONDITIONAL`

May be touched only if:

- the corrected test still fails because `applyRewrite` does not leave any renderer-visible rewritten draft path,
- or the sync-write mutation sequence is directly shown to be insufficient.

### `app/renderer/App.tsx`

Classification:

- `CONDITIONAL`

May be touched only if:

- the corrected test still fails and evidence shows `handleActiveSceneChange` or `handleDraftChange` is erasing visible correctness after sync,
- or normalization is directly shown to be the remaining active seam.

## 8. Explicitly Unauthorized Scope

### `app/renderer/components/ProjectHome.tsx`

Classification:

- `UNAUTHORIZED`

Reason:

- current code already supports the intended visible fallback behavior,
- no current evidence justifies editing it in the first implementation lane.

### `app/renderer/utils/draftPreviewSync.ts`

Classification:

- `UNAUTHORIZED`

Reason:

- helper/cache logic only,
- not part of the failing unit seam,
- widening into it would be scope creep.

### Everything else

Classification:

- `UNAUTHORIZED`

Includes:

- source-of-truth redesign
- authority-model cleanup
- critique workflow redesign
- package/build/config changes
- unrelated test cleanup

## 9. Implementation Guardrails

The later implementation pass must obey these guardrails:

1. Start with `AppCritique.test.tsx` only.
2. If runtime expansion is needed, expand into exactly one of:
   - `useCritique.ts`
   - `App.tsx`
3. Do not touch both runtime files unless one alone is proven insufficient during the implementation pass.
4. Do not touch `ProjectHome.tsx`.
5. Do not touch `draftPreviewSync.ts`.
6. Do not harden permanent `draftEdits` persistence as the goal.
7. Do not redesign the mirror model.
8. Stop if the repair argument depends on broad runtime reinterpretation rather than the active-scene post-sync invariant.

## 10. Final Verdict

- `IMPLEMENTATION AUTHORIZED`

Final authorization conclusion:

- ownership has been mapped,
- authority has been mapped,
- repair scope has been narrowed,
- implementation is now the cheapest safe move,
- the first authorized file is `app/renderer/__tests__/AppCritique.test.tsx`,
- `useCritique.ts` and `App.tsx` are conditional-only,
- `ProjectHome.tsx` and `draftPreviewSync.ts` are not authorized for this lane.
