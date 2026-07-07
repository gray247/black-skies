# Stage 14 PKG-E Witness Plan

## 1. Repo gate result

- Verified on branch `salvage/minimal-two-surface-shell`.
- `git rev-parse HEAD` -> `955cf53ac3c3cfbbd7aa3a0e107e3cba4fe86590`
- `git status -sb` showed `## salvage/minimal-two-surface-shell...origin/salvage/minimal-two-surface-shell`
- `git status --short` was empty.
- `git log -36 --oneline` included:
  - `955cf53 docs(product): baseline Stage 14 PKG-E`
  - `2d82c55 docs(product): charter Stage 14 PKG-E`
  - `68d0e8d docs(product): close Stage 14 PKG-D`
- Gate verdict: passed. The branch was clean and synchronized at witness-plan creation time.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_e_charter.md`
- `docs/product_systems/stage14_pkg_e_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_a_closure_review.md`
- `docs/product_systems/stage14_pkg_d_closure_review.md`

## 3. Baseline findings under test

- PKG-E baseline identified a narrow unresolved seam in recents and picker-facing presentation: recent entries remain path/name-based and do not carry or display canonical `projectId`.
- PKG-E baseline identified a narrow unresolved seam in divergent valid-ID diagnostics clarity: ProjectHome diagnostic/presentation surfaces can show active path, active name, and issue text without clearly surfacing canonical `projectId` in the same divergent seam.
- PKG-A closure established that ProjectHome can show canonical `Project ID` for valid-ID projects, but did not prove that all recents/picker or diagnostic surfaces remain equally clear under divergent valid-ID conditions.
- PKG-D closure carried forward recents identity visibility, divergence warning behavior, and broader user-facing identity clarity as later homes without reopening backend write-target or root-resolution authority.
- Remaining AppPreflight failures stay classified as test-health residuals only. They are not authority for PKG-E runtime mutation and are not part of this witness plan.

## 4. Witness lane A: recents/picker identity visibility

- Question under test:
  - When a recent/openable project has path/name presentation that can diverge from canonical metadata `projectId`, does the user-facing recents/picker surface expose enough canonical identity to avoid identity-authority confusion?
- Scope:
  - User-facing recents presentation.
  - Picker-adjacent open/reopen presentation only where it is part of the same visibility seam.
  - Divergent valid-ID conditions using synthetic data only.
- Not in scope for lane A:
  - Backend write-target behavior.
  - Activation persistence repair.
  - Recovery/restore or snapshot/export/draft behavior.
- Planned witness shape:
  - Use a synthetic valid-ID project fixture whose canonical `projectId` differs from path basename and/or user-facing name.
  - Observe whether recent/open buttons, labels, and supporting copy expose enough canonical identity before the user acts on the project.
  - Record whether the surface is clearly identity-safe, clearly misleading, or merely incomplete but contained.

## 5. Witness lane B: diagnostics clarity under divergence

- Question under test:
  - When loader diagnostics or project details are visible under divergent valid-ID conditions, does the user-facing diagnostic/presentation surface expose canonical `projectId` clearly enough?
- Scope:
  - ProjectHome user-visible details and issue presentation.
  - Loader-related diagnostic presentation only where shown to the user.
  - Divergent valid-ID conditions using synthetic data only.
- Not in scope for lane B:
  - Generic backend loader behavior absent user-facing presentation.
  - Root resolution repair.
  - Export, snapshot, draft, restore, or backup behavior.
- Planned witness shape:
  - Use a synthetic valid-ID project fixture with divergent path/name presentation and visible loader issue or project-detail context.
  - Observe whether canonical `projectId` is visible and understandable in the same user-facing diagnostic surface.
  - Record whether divergence is clearly understandable, merely implicit, or materially obscured.

## 6. Source/test files likely involved later

- Likely source surfaces:
  - `app/renderer/components/ProjectHome.tsx`
  - `app/renderer/components/AnalyticsDashboard.tsx`
  - `app/shared/ipc/projectLoader.ts`
  - `app/main/projectLoaderIpc.ts`
- Likely test surfaces:
  - `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
  - `app/renderer/__tests__/ProjectHome.test.tsx`
  - `app/renderer/__tests__/StoryInsightsRegression.test.tsx`
- Later witness execution should choose the smallest existing seam that can prove or contain the visibility question without widening authority.

## 7. Files explicitly forbidden

- Runtime mutation targets outside later authorized scope, including:
  - export, snapshot, draft, restore, backup, or generic backend-root codepaths
  - persistence architecture files
  - recovery/restore destination logic
- Test-health-only residual surfaces not part of this witness plan, including:
  - `app/renderer/__tests__/AppPreflight.test.tsx`
- Protected evidence and non-synthetic project assets are forbidden for witness use.

## 8. Protected evidence posture

- Protected evidence remains untouched:
  - `sample_project/proj_esther_estate/**`
  - `sample_project/Esther_Estate/**`
  - `build/truth_receipts/**`
  - `build/runtime_truth.json`
  - `build/runtime_truth.schema.json`
  - `ci_artifacts/**`
  - tracked snapshots
  - IPC snapshot evidence
  - real user projects

## 9. Witness method

- Use synthetic test data only.
- Do not use protected sample projects.
- Do not execute against real user projects.
- Do not modify screenshots or tracked snapshots.
- Keep witnesses bounded to renderer/user-facing visibility and diagnostics seams already justified by the PKG-E baseline.
- Prefer the smallest later witness that can answer each question without creating backend or persistence authority by implication.

## 10. What proves safe/contained behavior

- Lane A is safe/contained if the recents or picker-facing surface clearly exposes canonical `projectId`, or otherwise avoids implying incorrect identity authority when path/name presentation diverges.
- Lane B is safe/contained if project details or user-visible diagnostics clearly expose canonical `projectId` in the divergent seam so the user can distinguish canonical identity from path/name presentation.
- Either lane may also be considered contained if the UI explicitly signals limited authority or ambiguity rather than silently presenting misleading identity cues.

## 11. What proves contradiction

- Lane A proves contradiction if a divergent valid-ID project is presented to the user through recents or picker-facing surfaces in a way that materially obscures canonical `projectId` and makes the path/name presentation appear to be the authoritative identity.
- Lane B proves contradiction if user-visible project details or diagnostics under divergence omit or materially bury canonical `projectId` such that the surface presents a misleading identity story.
- A backend-only discrepancy without user-facing visibility impact does not prove a PKG-E contradiction and must be deferred.

## 12. What remains unresolved but not contradicted

- Broader App UI identity clarity outside the narrow recents/picker and ProjectHome diagnostic seams.
- Divergence warning behavior outside the exact seams later executed by witnesses.
- Loader diagnostics beyond direct user-facing presentation.
- Remaining AppPreflight failures as test-health residuals only.
- Recovery/restore destination safety, snapshot/export/draft write-target behavior, backup restore behavior, draft generation write-target behavior, and generic backend root behavior remain outside PKG-E authority.

## 13. Decision table

| Witness result | Next disposition |
| --- | --- |
| contradiction proved | later scope decision required |
| safe/contained | reassessment / closure path |
| inconclusive | narrow follow-up only if specific gap remains |
| out-of-scope backend/root issue | defer, do not absorb into PKG-E |

## 14. Next action after witness execution

- Create a bounded PKG-E witness execution record covering lane A and/or lane B results only.
- If contradiction is proved, create a later PKG-E scope decision record that names the exact user-facing seam, files, rollback boundary, and protected-evidence posture.
- If safe/contained behavior is proved, proceed to PKG-E reassessment rather than widening scope.
- If results are inconclusive, permit only the narrowest follow-up needed to answer the remaining visibility question.

PZ_CONTINUE: PKG-E witness plan ready for review
