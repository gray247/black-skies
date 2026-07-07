# Stage 14 PKG-E Read-Only Baseline

## 1. Repo gate result

Status: passed.

Repository checkpoint:

```text
2d82c558b9275d8a8b8b4ada94cbfe158c88de33 docs(product): charter Stage 14 PKG-E
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
2d82c55 docs(product): charter Stage 14 PKG-E
68d0e8d docs(product): close Stage 14 PKG-D
409b4f2 docs(product): close Stage 14 PKG-A
b063363 docs(product): close Stage 14 PKG-C
```

No runtime code, tests, witnesses, mutation-scope records, protected evidence, Stage 15 records, or PKG-B records were created or modified during this baseline.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_e_charter.md`
- `docs/product_systems/stage14_pkg_a_closure_review.md`
- `docs/product_systems/stage14_pkg_d_closure_review.md`
- `docs/product_systems/current_product_roadmap.md`
- `docs/product_systems/current_truth_index.md`

## 3. Source/test files inspected

Renderer and bridge source inspected:

- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/AnalyticsDashboard.tsx`
- `app/renderer/utils/splitCommandShellState.ts`
- `app/shared/ipc/projectLoader.ts`
- `app/main/projectLoaderIpc.ts`

Existing tests inspected as read-only evidence:

- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
- `app/renderer/__tests__/StoryInsightsRegression.test.tsx`

No tests were run. Inspection was static and read-only.

## 4. PKG-E authority summary

PKG-E is a visibility / diagnostic / presentation package only.

Allowed later seams under this baseline:

- recents identity visibility
- divergence warning behavior
- App UI outside ProjectHome identity visibility
- project picker presentation where visibility/diagnostic related
- loader diagnostics only where user-facing diagnostic clarity is directly involved
- remaining AppPreflight failures only as test-health residuals, not runtime mutation authority

Explicitly not owned by PKG-E:

- recovery/restore destination safety
- snapshot/export/draft write-target behavior
- backup restore behavior
- draft generation write-target behavior
- generic backend root behavior
- broad persistence architecture
- Stage 15 work

## 5. Relevant inherited facts from PKG-A and PKG-D

Inherited accepted facts from PKG-A:

- missing-ID App activation is repaired and contained
- ProjectHome missing-ID remembered-path hygiene is repaired
- ProjectHome details show canonical Project ID for valid-ID projects
- explicit metadata-ID preservation remains proved
- recents remain path/name-only and were carried forward as a later visibility lane
- no dedicated divergence warning marker was added

Inherited accepted facts from PKG-D:

- backup verifier multi-root report persistence contradiction is resolved
- export write-target contradiction is resolved
- draft acceptance write-target contradiction is resolved
- remaining AppPreflight failures were not accepted as PKG-D-caused product contradictions
- recents identity visibility, divergence warning behavior, App UI outside ProjectHome, project picker behavior, and loader diagnostics remained deferred or unresolved outside PKG-D write-target authority

PKG-E does not reopen PKG-A or PKG-D.

## 6. Visibility/diagnostic seams found

- `ProjectHome` is the strongest currently inspected visibility surface. It shows project name, path, bootstrap state, issue list, and canonical `Project ID` when present.
- `ProjectHome` recents presentation remains lightweight: each recent entry shows project name and path only.
- `ProjectHome` diagnostics output includes active project path, active project name, and issue summaries, but not canonical `projectId`.
- `ProjectHome` has no dedicated divergence warning marker or divergence wording in the inspected valid-ID divergent witness seam.
- `AnalyticsDashboard` is an App UI surface outside ProjectHome that explicitly renders `Project ID` and `Project path` in its summary table.
- loader issues are user-visible through ProjectHome issue cards and diagnostic snapshot text when the loader returns issues.
- split-command shell-state reset notices exist as user-facing diagnostic copy for shell-local state resets, but these are shell-state diagnostics rather than project-identity authority proofs.
- remaining `AppPreflight` failures are still described only at targeted test-health level; no accepted package record proves a current runtime visibility contradiction from them.

## 7. Recents identity visibility baseline

Status: unresolved but not contradicted.

Confirmed by source inspection:

- `ProjectHome` stores recents under `blackskies.recent-projects`
- recent entries contain path, name, and last-opened timestamp
- no `projectId` field is stored in the recents entry shape
- the recent-project list renders project name and project path only

Confirmed by existing executable witness source:

- `ProjectHomeDivergenceVisibilityWitness.test.tsx` asserts that, for a divergent valid-ID project, the recent-project button does not include canonical `projectId`
- the same witness asserts stored recents do not include a `projectId` property

Baseline interpretation:

- recents identity visibility remains limited to path/name presentation
- accepted evidence does not yet prove that this is a product-critical contradiction by itself
- a later PKG-E witness would need to prove concrete user-facing identity confusion, not just path-only storage

## 8. Divergence warning baseline

Status: unresolved but not contradicted.

Confirmed by inherited PKG-A evidence and current source/test inspection:

- ProjectHome details show canonical `Project ID` for valid-ID projects
- no dedicated divergence warning marker or divergence wording is rendered in the inspected divergent valid-ID ProjectHome witness
- ProjectHome diagnostics output in that witness also omits divergence wording

Baseline interpretation:

- the current surface prefers canonical-ID visibility over explicit warning copy
- accepted evidence does not yet prove that absence of a divergence warning creates a current blocker
- this remains a PKG-E-appropriate visibility seam if a later witness shows canonical-ID display alone is insufficient

## 9. App UI outside ProjectHome identity visibility baseline

Status: unresolved but not contradicted.

Inherited PKG-A closure carried this area as unproved. Current source inspection narrows that residual:

- `AnalyticsDashboard` explicitly renders `Project ID` and `Project path`
- existing `StoryInsightsRegression.test.tsx` checks for `Project ID` in that surface

Current baseline interpretation:

- at least one App surface outside ProjectHome now visibly carries canonical identity
- accepted records do not prove broader App-wide identity visibility sufficiency
- the residual narrows from “no outside-ProjectHome evidence” to “partial outside-ProjectHome identity visibility exists, broader surface coverage remains unproved”

## 10. Project picker presentation baseline

Status: narrow unresolved seam needing witness.

Confirmed by source inspection:

- ProjectHome welcome/open/recent flows form the practical picker-facing experience in the currently inspected surface
- recent-project buttons expose name and path only
- the open-project path is driven by loader handoff and then ProjectHome details

Not proved:

- whether current picker-facing path/name presentation causes product-significant identity ambiguity when path basename and canonical `projectId` diverge
- whether a picker-specific visibility adjustment is needed independent of recents and ProjectHome details

Baseline interpretation:

- picker presentation remains visibility-related and therefore PKG-E-relevant
- a later bounded witness is justified if PKG-E proceeds, because current evidence shows the shape of the picker presentation but not yet a proved contradiction

## 11. Loader diagnostic UX/presentation baseline, if relevant

Status: unresolved but not contradicted.

Relevant user-facing loader diagnostic seams found:

- loader returns structured `ProjectIssue` items with `info` / `warning` / `error` levels
- ProjectHome surfaces those issues in an “Issues detected” list
- ProjectHome diagnostics panel exposes a “Story snapshot” payload and an “Activity log”
- loader-root selection warnings such as nested-project-root substitution are user-visible through issue messages

Relevant visibility limitation:

- the existing divergent-identity ProjectHome witness confirms the diagnostics snapshot includes active project path and active project name but does not include canonical `projectId`

Baseline interpretation:

- loader diagnostic UX/presentation is relevant to PKG-E because it is user-facing clarity work
- the current seam is not a proved contradiction yet, but omission of canonical `projectId` from diagnostics is a concrete candidate for later witness selection

## 12. AppPreflight residual classification

Classification: out-of-scope deferred for runtime authority; unresolved but not contradicted as test-health residual.

Confirmed by accepted PKG-D closure records:

- the amended-D2 `services.exportProject` request-shape mismatch was resolved
- the targeted AppPreflight rerun still exited `1`
- remaining reported areas include project activation and split-command shell-status assertions
- no accepted evidence proves those remaining failures were caused by amended D2

PKG-E baseline interpretation:

- remaining AppPreflight failures are not current runtime mutation authority for PKG-E
- they may be carried only as later test-health residuals, or later Stage 14 closure-review items if product-system impact is eventually proved

## 13. Out-of-scope items explicitly excluded

- recovery/restore destination safety
- snapshot/export/draft write-target behavior
- backup restore behavior
- draft generation write-target behavior
- generic backend root behavior
- broad persistence architecture
- Stage 15 work

These items were not inspected beyond inherited closure context and are not reclassified by this baseline.

## 14. Finding classification table

| Finding | Evidence status | Classification | Notes |
| --- | --- | --- | --- |
| PKG-A missing-ID activation containment remains effective | confirmed by accepted closure record | resolved | Inherited only; not reopened. |
| ProjectHome canonical `Project ID` visibility for valid-ID projects remains effective | confirmed by accepted closure record and source/test inspection | resolved | Current baseline keeps this as accepted context. |
| Recents remain path/name-only in storage and UI | confirmed by source inspection and existing witness source | unresolved but not contradicted | In scope for PKG-E, but not yet a proved blocker. |
| No dedicated divergence warning marker is shown in the inspected divergent valid-ID ProjectHome seam | confirmed by existing witness source | unresolved but not contradicted | Canonical-ID display exists; warning sufficiency remains unproved. |
| At least one App UI surface outside ProjectHome (`AnalyticsDashboard`) shows canonical identity | confirmed by source inspection and existing test source | contained | Narrows the inherited residual but does not prove App-wide sufficiency. |
| Project picker-facing presentation remains name/path-oriented | confirmed by source inspection | narrow unresolved seam needing witness | Needs concrete confusion witness before mutation scope. |
| Loader issues and diagnostics are user-visible, but diagnostics omit canonical `projectId` in the inspected divergent witness seam | confirmed by source inspection and existing witness source | narrow unresolved seam needing witness | Concrete candidate PKG-E seam. |
| Remaining AppPreflight failures are not accepted as current PKG-E runtime contradictions | confirmed by accepted PKG-D closure records | out-of-scope deferred | Test-health residual only. |
| Recovery/restore, write-target, backup-restore, draft-generation, generic backend-root families | inherited closure context only | out-of-scope deferred | Explicitly excluded from PKG-E. |

## 15. Candidate witness lanes only if justified

Witness lanes are justified.

Candidate lane A: recents and picker identity visibility under divergent valid-ID conditions

- justification: current evidence shows recents and picker-facing presentation remain path/name-only while canonical `projectId` may diverge from path basename
- question: does that presentation create product-significant identity ambiguity on current user-facing surfaces even though ProjectHome details can show canonical `Project ID` after load?
- bounded surfaces: recent-project list, picker-facing open/reopen presentation, and immediate post-load identity cues only

Candidate lane B: diagnostics clarity for divergent valid-ID project identity

- justification: current evidence shows ProjectHome diagnostics expose active path and name but omit canonical `projectId` and omit divergence wording in the existing divergent witness seam
- question: is the current diagnostic presentation sufficient for user-facing troubleshooting clarity, or does omission of canonical identity create a real contradiction?
- bounded surfaces: ProjectHome “Story snapshot,” issue list, and directly related loader-facing diagnostic presentation only

No broader witness lane is justified at baseline.

## 16. Protected evidence posture

Protected evidence was not touched:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

No fixture materialization, receipt creation, recovery execution, restore execution, backend write, protected evidence regeneration, or snapshot update was performed.

## 17. Recommended next action

Recommended next action: create a bounded PKG-E witness plan.

Reason:

- current evidence identifies concrete in-scope visibility seams
- the strongest seams are recents/picker path-only presentation and diagnostics omission of canonical `projectId`
- accepted records do not yet prove a current product-critical contradiction sufficient for direct mutation scope
- a bounded witness can test whether these presentation choices create real identity-authority confusion without expanding into runtime persistence or backend-root ownership

PZ_CONTINUE: PKG-E witness plan justified
