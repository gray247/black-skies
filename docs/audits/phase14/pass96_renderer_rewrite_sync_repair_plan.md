# Pass 96 - Renderer Rewrite Sync Repair Plan

## 1. Failure Description

The broken visible behavior is the rewrite-sync completion state asserted by `app/renderer/__tests__/AppCritique.test.tsx`.

Observed failure from Pass 92:

- critique succeeds
- rewrite succeeds
- saved rewrite preview is shown
- user clicks `Sync draft view`
- expected visible draft becomes `Revised scene text`
- observed test result kept the original draft text in the mocked `ProjectHome`

This is not a rewrite-route failure.

It is a post-sync renderer visibility failure at the boundary between:

- `useCritique.applyRewrite`
- `App` draft mirror normalization
- `ProjectHome` visible draft precedence
- the `ProjectHome` unit-test mock contract

## 2. Intended Post-Sync Contract

The intended post-sync contract supported by Pass 95 is:

1. The backend rewrite route has already persisted the rewritten text before sync.
2. After `Sync draft view`, the active visible draft in the renderer must match the saved rewrite.
3. `ProjectHome` should show the rewritten text for the active scene.
4. `projectDrafts[targetId]` and `currentProject.drafts[targetId]` should reflect the rewritten text.
5. `draftPreviewSync` should eventually publish the same live draft state for cross-window preview sync.
6. The critique modal should close and show the success toast.

Important non-contract:

- Pass 95 did not support treating long-lived `draftEdits[targetId]` persistence as the primary post-sync contract.
- The contract is visible correctness after sync, not permanent override residency.

## 3. Current Behavior

Current implementation behavior:

- `useCritique.applyRewrite` writes rewritten text into:
  - `projectDrafts`
  - `draftEdits`
  - `currentProject.drafts`
- `ProjectHome` renders `draftOverrides` first, then `activeProject.drafts`
- `App.handleActiveSceneChange` and `App.handleDraftChange` normalize `draftEdits` away when the incoming draft matches the current baseline

Current failing test behavior:

- `ProjectHomeMock` only exposes visible draft from:
  - `draftOverrides?.sc_0001`
  - otherwise static `loadedProject.drafts.sc_0001`
- the mock does not model live `activeProject.drafts` updates from `App`

## 4. Gap Between Current and Intended Behavior

The intended contract says:

- visible active draft must be rewritten after sync

The current failing harness proves only:

- rewritten text remains visible through `draftOverrides`

That creates the main gap:

- implementation authority model allows visible correctness via either updated override state or updated project-draft baseline
- test harness requires override-centric visibility because its fallback project draft is static

The likely gap is therefore not “rewrite sync never updates renderer state.”

The likely gap is narrower:

- either the renderer normalizes away `draftEdits` before the mock sees the change
- or the mock is too narrow to observe the implementation’s real visible post-sync contract
- or both

## 5. Candidate Repair Locations

Primary candidate locations:

1. `app/renderer/hooks/useCritique.ts`
   - owner of `applyRewrite`
   - owns the direct post-sync mutation sequence

2. `app/renderer/App.tsx`
   - owners:
     - `handleActiveSceneChange`
     - `handleDraftChange`
   - these callbacks normalize `draftEdits` against baseline mirrors

3. `app/renderer/__tests__/AppCritique.test.tsx`
   - owner of the failing mock contract
   - currently constrains visible correctness to `draftOverrides` or a static fallback draft

Secondary location to inspect during implementation only if needed:

4. `app/renderer/components/ProjectHome.tsx`
   - real visible precedence is defined here
   - likely reference-only unless implementation proof shows the real component violates the intended visible contract

Reference-only location:

5. `app/renderer/utils/draftPreviewSync.ts`
   - cross-window helper state
   - not the leading owner of the unit failure

## 6. Smallest Repair Scope

The smallest possible change should target only the post-sync invariant for the active scene.

Allowed narrow intent:

- ensure the active visible draft remains observably rewritten after sync according to the intended contract

Disallowed broadening:

- no mirror-model redesign
- no state cleanup refactor
- no preview-architecture rewrite
- no cross-window sync redesign
- no opportunistic hook cleanup

Narrow repair-plan recommendation:

1. First decide the proof target:
   - visible rewritten draft correctness after sync
   - not long-term `draftEdits` persistence as an independent goal
2. Implement the smallest change in one of two bounded forms:
   - renderer-side sequencing adjustment around `applyRewrite` and normalization
   - test-harness contract adjustment so the mock can observe the same visible contract as real `ProjectHome`
3. Avoid touching both implementation and test unless one side alone cannot prove the intended contract.

Preferred minimality order for the future implementation pass:

1. inspect whether the visible contract is already correct in real component terms and only the mock is stale
2. if not, adjust the narrowest renderer-side sequencing at `applyRewrite` / normalization boundary

## 7. Files Potentially Impacted

Most likely impacted:

- `app/renderer/hooks/useCritique.ts`
- `app/renderer/App.tsx`
- `app/renderer/__tests__/AppCritique.test.tsx`

Possibly referenced but ideally unchanged:

- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/utils/draftPreviewSync.ts`

## 8. Test Impact Analysis

Tests that are directly relevant:

- `app/renderer/__tests__/AppCritique.test.tsx`
  - failing lane and primary proof target

Tests indirectly affected by draft precedence semantics:

- payload-source test in `AppCritique.test.tsx`
  - proves `draftEdits` wins before rewrite request
- any `ProjectHome` tests that depend on preview precedence or active scene updates

Success proof must include:

- the critique/rewrite/apply test passes
- post-sync visible draft is the rewritten text
- route-path assertions still use `draft/critique` and `draft/rewrite`
- advisory/non-mutative critique behavior still holds before rewrite

What does not prove success:

- toast alone
- modal close alone
- `projectDrafts` update without visible draft proof
- `currentProject.drafts` update without visible draft proof
- a green build
- truth-lane success alone

## 9. Risk Analysis

Primary risks:

1. Over-repairing the mirror model
   - risk: accidental authority redesign instead of a bounded post-sync fix

2. Fixing the test while leaving visible runtime semantics ambiguous
   - risk: false green

3. Fixing renderer sequencing in a way that breaks local edit normalization
   - risk: `draftEdits` no longer clears correctly when matching baseline

4. Expanding into cross-window preview sync or broader project reload logic
   - risk: scope creep beyond the failing seam

5. Misreading the contract as override persistence rather than visible correctness
   - risk: sticky override behavior that hardens the wrong invariant

Risk containment for the later implementation pass:

- keep the change bound to the active scene rewrite-sync postcondition
- verify visible draft behavior, not only internal mirror mutation
- do not alter unrelated draft loading, generation, or recovery flows

## 10. Validation Plan

Minimum validation for the later implementation pass:

1. Targeted renderer test proof for `app/renderer/__tests__/AppCritique.test.tsx`
   - exact failing scenario must pass

2. Confirm related assertions in the same file still hold:
   - critique remains advisory before rewrite
   - rewrite conflict handling still surfaces conflict copy
   - draft route preference over phase4 routes still holds
   - rewrite payload still prefers `draftEdits` over `projectDrafts`

3. Repo hygiene validation:
   - `git diff --check`
   - `pnpm lint:docs`

If a later implementation pass can run a narrower app-test invocation cleanly, that is preferred.
If the current test wrapper still blocks targeted execution, the pass may need to run the existing app test command and classify the extra scope explicitly.

## 11. Stop Conditions

Stop or re-scope the later implementation pass if:

- the change starts redesigning the draft mirror model
- repair requires unrelated `ProjectHome` loader or diagnostics work
- cross-window preview sync becomes the main focus
- rewrite route/service behavior starts getting modified
- the fix depends on speculative GUI redesign
- more than the narrow post-sync invariant needs to change

## 12. Final Verdict

- `READY FOR NARROW IMPLEMENTATION PLAN`

Final planning conclusion:

- the broken behavior is the visible active draft after `Sync draft view`
- the intended postcondition is visible rewritten draft correctness, not permanent override persistence
- the narrowest repair lane is the post-sync seam among `useCritique.applyRewrite`, `App` normalization callbacks, and the `AppCritique` mock contract
- success must be proven by visible rewritten draft state after sync, not by toast, internal mirror writes, or broad green lanes alone
