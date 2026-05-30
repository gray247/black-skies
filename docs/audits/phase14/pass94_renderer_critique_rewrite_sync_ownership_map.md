# Pass 94 - Renderer Critique/Rewrite Sync Ownership Map

## 1. Scope Declaration

Pass 94 is a recovery-planning and ownership-discovery pass only.

It maps responsibility for the renderer critique/rewrite sync failure discovered in Pass 92 and prioritized in Pass 93.

It does not:

- modify renderer code
- modify tests
- repair the failing path
- reinterpret the backend route as broken without new evidence
- authorize roadmap, workflow-state canon, GUI redesign, or source-of-truth work

## 2. Starting Repo State

- Repo: `C:\Dev\black-skies`
- Branch: `phase-b2-memory-lab`
- Preflight `git status --short`: clean
- Preflight `git status -sb`: `## phase-b2-memory-lab...origin/phase-b2-memory-lab [ahead 9]`
- Preflight `git log -1 --oneline`: `0cee7f8 docs: triage operational baseline recovery`

Pass 94 started because the working tree was clean, the branch matched, and the latest commit matched the Pass 93 prerequisite.

## 3. Evidence Base

Primary evidence files inspected:

- `docs/audits/phase14/pass92_operational_baseline_audit.md`
- `docs/audits/phase14/pass93_operational_baseline_recovery_triage.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/specs/current_state.md`
- `docs/specs/capability_truth_matrix.md`
- `docs/specs/editorial_workflow_contract.md`
- `docs/reviews/validation_failures_and_blockers.md`
- `app/renderer/__tests__/AppCritique.test.tsx`
- `app/renderer/__tests__/useCritique.test.ts`
- `app/renderer/__tests__/CritiqueModal.test.tsx`
- `app/renderer/App.tsx`
- `app/renderer/hooks/useCritique.ts`
- `app/renderer/components/CritiqueModal.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/utils/draftPreviewSync.ts`
- `app/shared/ipc/services.ts`
- `app/main/preload.ts`
- `services/src/blackskies/services/routers/draft/revision.py`
- `package.json`
- `app/package.json`

Command evidence used in this pass:

| Command | Result | What it can prove | What it cannot prove | Forbidden claim |
| --- | --- | --- | --- | --- |
| `git status --short` | PASS | Pre-pass tree cleanliness | Nothing about runtime correctness | Do not claim product health |
| `git status -sb` | PASS | Active branch and ahead/behind state | Nothing about code behavior | Do not claim the pass is valid without the other preflight checks |
| `git log -1 --oneline` | PASS | Latest commit matches Pass 93 prerequisite | Nothing about working tree cleanliness | Do not claim repo readiness by commit message alone |
| `Get-Content` on Pass 92 / Pass 93 artifacts | PASS | Prior audit and triage conclusions | Nothing about current code beyond recorded evidence | Do not treat prior docs as stronger than code |
| `Get-Content` on renderer, preload, service, and spec files | PASS | Ownership surfaces and contracts visible in code/docs | Nothing about live GUI behavior | Do not claim human-smoked correctness |
| `rg -n "critique\|rewrite\|feedback\|apply\|suggestion\|revision" app services docs` | FAIL / PARTIAL | Broad ownership references and route vocabulary | Full inventory, because access-denied paths under `services/testtmp-*` interrupted clean enumeration | Do not claim exhaustive grep coverage |
| `rg --files app \| rg "Critique\|critique\|Rewrite\|rewrite\|Feedback\|feedback\|draftPreview\|ProjectHome\|services\|preload\|App\.tsx"` | PASS | Relevant app-side ownership files | Nothing about behavior | Do not claim these are the only relevant files |
| `rg --files services \| rg "critique\|rewrite\|revision\|draft"` | PASS | Relevant service-side route/model/persistence files | Nothing about runtime correctness | Do not claim service routes are healthy from presence alone |
| `pnpm --filter app test -- --run renderer/__tests__/AppCritique.test.tsx` | FAIL | Current `pnpm test` wrapper does not accept `--run` passthrough as attempted | The underlying test body outcome in this invocation | Do not claim targeted repro succeeded or failed from the test body |
| `rg -n` targeted ownership searches over `App.tsx`, `useCritique.ts`, `CritiqueModal.tsx`, `ProjectHome.tsx`, tests, preload, and `revision.py` | PASS | Concrete ownership points, bridge calls, route names, and state seams | Human GUI truth, timing under live browser rendering, or durable fix direction | Do not claim full runtime proof |
| one malformed `rg` against `revision.py` | FAIL | Only that the attempted regex was invalid | Nothing about the route | Do not treat the parse error as route evidence |

## 4. Failure Summary

The failing renderer behavior is the critique/rewrite/apply loop asserted in `app/renderer/__tests__/AppCritique.test.tsx`.

The core failing assertion from Pass 92 was:

- after critique succeeds
- after rewrite succeeds and the modal shows the saved rewrite
- after the user clicks `Sync draft view`
- the test expects `data-testid="project-home-mock"` to expose `data-draft="Revised scene text"`
- observed failure kept the original draft text instead

The same test also expects:

- critique to use `draft/critique`
- rewrite to use `draft/rewrite`
- the modal to show saved rewrite copy before sync
- the toast `Rewrite synced`

This means the broken surface is not merely "rewrite failed". The broken surface is narrower: a renderer-side reconciliation assertion after a successful saved rewrite.

## 5. User Workflow Represented

The test represents this user-facing workflow:

1. Open a project and select an active scene.
2. Request critique for the active scene.
3. Review advisory critique output.
4. Enter rewrite instructions.
5. Generate a saved rewrite.
6. Review the saved rewrite preview and provenance.
7. Click `Sync draft view`.
8. Expect the local visible draft view to match the already-saved rewrite.

This matches the editorial contract distinction in `docs/specs/editorial_workflow_contract.md`:

- critique is advisory and non-mutative
- rewrite is already saved by the backend route
- sync is a renderer reconciliation step

## 6. File / Component Ownership Map

| Surface | Primary owner(s) | Notes |
| --- | --- | --- |
| Critique action entry | `app/renderer/App.tsx`, `app/renderer/hooks/useCritique.ts` | `App` wires workspace actions into `useCritique` |
| Critique modal UI | `app/renderer/components/CritiqueModal.tsx` | Pure view/controller props surface |
| Critique request logic | `app/renderer/hooks/useCritique.ts` | Builds request, handles provenance, modal state, error handling |
| Rewrite request logic | `app/renderer/hooks/useCritique.ts` | Builds rewrite request from active draft text |
| Rewrite sync/apply logic | `app/renderer/hooks/useCritique.ts` | `applyRewrite` mutates renderer-side mirrors |
| Visible scene draft rendering | `app/renderer/components/ProjectHome.tsx` | Prefers `draftOverrides`, otherwise uses project drafts |
| Draft mirror state in renderer shell | `app/renderer/App.tsx` | Owns `projectDrafts`, `draftEdits`, `currentProject`, active scene callbacks |
| Cross-window draft preview sync | `app/renderer/utils/draftPreviewSync.ts`, `app/renderer/App.tsx` | Local storage sharing; adjacent but not primary failure evidence |
| Service bridge contract | `app/shared/ipc/services.ts` | Request/response types for critique/rewrite |
| Preload service call wiring | `app/main/preload.ts` | Direct `draft/critique` and `draft/rewrite` bridge mapping |
| Backend critique/rewrite routes | `services/src/blackskies/services/routers/draft/revision.py` | Route truth and rewrite persistence |
| Renderer failing harness | `app/renderer/__tests__/AppCritique.test.tsx` | Owns the mocked `ProjectHome` behavior and assertions |

## 7. Renderer State Ownership

Renderer draft-state ownership is split across three related mirrors:

- `projectDrafts` in `app/renderer/App.tsx`
  - canonical renderer-side map of loaded/synced drafts
- `draftEdits` in `app/renderer/App.tsx`
  - local override map for edited scene text
- `currentProject` plus `currentProjectRef` in `app/renderer/App.tsx`
  - loaded project object and draft payload used across the app shell

Relevant ownership facts:

- `useCritique.resolveSceneDraftText` prefers `draftEdits` over `projectDrafts`.
- `useCritique.runCritique` and `useCritique.runRewrite` both read the active text through that resolver.
- `useCritique.applyRewrite` writes the revised text into all three mirrors:
  - `setProjectDrafts`
  - `setDraftEdits`
  - `setCurrentProject(...drafts...)`
- `App` passes `draftOverrides: draftEdits` into `ProjectHome`.
- `ProjectHome` renders the active scene draft from:
  - `draftOverrides[activeSceneId]` first
  - otherwise `activeProject.drafts[activeSceneId]`
- `App.handleActiveSceneChange` and `App.handleDraftChange` normalize `draftEdits` against the current baseline from:
  - `projectDraftsRef.current`
  - or `currentProjectRef.current?.drafts[...]`

This means the visible draft is not owned by one variable. It is owned by a synchronization contract between:

- `useCritique.applyRewrite`
- `App` baseline/normalization callbacks
- `ProjectHome` override-versus-disk selection logic

## 8. API / IPC / Service Boundary Ownership

Renderer-to-service ownership appears narrow and direct.

Renderer contract owners:

- `app/shared/ipc/services.ts`
  - `DraftCritiqueBridgeRequest`
  - `DraftCritiqueBridgeResponse`
  - `DraftRewriteBridgeRequest`
  - `DraftRewriteBridgeResponse`
  - `ActionProvenance`

Preload bridge owner:

- `app/main/preload.ts`
  - `critiqueDraft -> makeServiceCall('draft/critique', 'POST', ...)`
  - `rewriteDraft -> makeServiceCall('draft/rewrite', 'POST', ...)`
  - optional legacy/mock path remains `phase4Critique` and `phase4Rewrite`

Backend route owner:

- `services/src/blackskies/services/routers/draft/revision.py`
  - `@router.post("/critique")`
  - `@router.post("/rewrite")`

Backend rewrite route responsibility visible in code:

- validates request payload
- reads the current scene from disk
- rejects stale submitted draft text with conflict semantics
- persists rewritten scene through `DraftPersistence.write_scene`
- returns `revised_text` plus provenance

Backend critique route responsibility visible in code:

- validates request payload/rubric
- runs critique service
- attaches provenance and budget metadata
- persists critique summary history for export/reporting

Observed conclusion:

- no critique/rewrite-specific preload state machine sits between renderer and service
- the bridge appears to be a straightforward request/response pass-through
- the currently observed failure is therefore not primarily owned by IPC choreography unless later reproduction proves a hidden timing issue

## 9. Persistence / Fixture / Sample Data Ownership

Persistence and sample-state owners for this path are split.

Real product persistence owners:

- backend draft persistence: `services/src/blackskies/services/routers/draft/revision.py`
- draft file writes through `DraftPersistence.write_scene`
- project draft object in renderer shell: `currentProject.drafts`
- project load/open path inside `ProjectHome`

Test/sample-state owners for the failing path:

- `loadedProject` constant in `app/renderer/__tests__/AppCritique.test.tsx`
- `ProjectHomeMock` in the same test file

Important ownership detail:

- the test harness `loadedProject.drafts.sc_0001` is static
- `ProjectHomeMock` renders `data-draft` from `draftOverrides?.sc_0001 ?? loadedProject.drafts.sc_0001`
- unlike real `ProjectHome`, the mock does not consume the live `currentProject.drafts` state from `App`

That makes the test harness especially sensitive to whether the revised text remains in `draftEdits`, instead of allowing the baseline to move into the live project draft store.

## 10. Test Harness / Mock Ownership

The failing test harness owns a meaningful part of the observed failure.

Harness owners:

- `app/renderer/__tests__/AppCritique.test.tsx`
- mocked `ProjectHome`
- mocked `window.services`

Harness behavior that matters:

- bootstraps a fixed project through `onProjectLoaded`
- seeds active scene and draft through `onActiveSceneChange`
- may seed an edited draft through `window.__TEST_PROJECT_HOME_EDITED_DRAFT`
- on later `draftOverrides` changes, emits:
  - `onActiveSceneChange(...draftText...)`
  - `onDraftChange(...draftText...)`
- visible assertion surface is only `data-draft` from `draftOverrides` or the fixed `loadedProject.drafts`

This is not equivalent to the real `ProjectHome` ownership model, where:

- the component owns `activeProject`
- the fallback draft source can move from override to updated project draft

The harness is therefore a legitimate owner of the failure signal, not only a neutral observer.

## 11. Verified-Elsewhere Evidence

Pass 92 already verified the following independently of this failing renderer test:

- backend startup and health passed
- `pnpm test:truth` passed
- critique route path was classified as verified working at the route/truth-chain level
- rewrite route path was classified as verified working at the route/truth-chain level

Supporting authority from `docs/specs/capability_truth_matrix.md`:

- critique UI truth chain:
  - UI entry `workspace-action-critique`
  - preload bridge `services.critiqueDraft`
  - backend route `POST /api/v1/draft/critique`
- rewrite UI truth chain:
  - critique modal `Generate rewrite`
  - preload bridge `services.rewriteDraft`
  - backend route `POST /api/v1/draft/rewrite`

Supporting authority from `docs/specs/editorial_workflow_contract.md`:

- rewrite is already saved by the backend route
- sync is a renderer-side local reconciliation step

Therefore, the rewrite route being healthy elsewhere does not prove the renderer sync is healthy, but it does lower confidence that the backend route is the primary owner of this specific failure.

## 12. Suspected Failure Seam Classification

Primary classification:

- `MIXED / MULTI-SEAM`

Dominant contributing seams:

- `UI STATE SYNC SEAM`
- `TEST EXPECTATION SEAM`

Why this classification fits the evidence:

1. `useCritique.applyRewrite` updates three renderer mirrors, not one.
2. `App` separately normalizes `draftEdits` against `projectDraftsRef` and `currentProjectRef`.
3. `ProjectHome` real behavior can render from either override or updated project draft.
4. `ProjectHomeMock` only proves success if the revised text remains visible through `draftOverrides`.
5. The mock does not track the live `currentProject.drafts` baseline that the real component can use.

Most likely interpretation from current evidence:

- the broken seam is probably not the backend route
- the broken seam is probably not provenance or modal copy
- the observed red signal is most likely created by a renderer-state reconciliation edge, a harness mismatch, or both

Secondary seam candidates still possible but not primary:

- `ASYNC / TIMING SEAM`
  - because `projectDraftsRef` updates in `useLayoutEffect` and `currentProjectRef` updates in `useEffect`
  - later normalization callbacks may see different baselines across adjacent render cycles
- `PERSISTENCE / PROJECT STATE SEAM`
  - only as a renderer-held project object synchronization concern, not as a backend file-write concern

Lowest-probability seam from current evidence:

- `BACKEND ROUTE SEAM`

## 13. Unknowns / Not Proven

The following remain unproven after Pass 94:

- whether the real GUI path fails for a human in the same way as the test harness
- whether the renderer actually shows the revised text briefly and then normalizes it away, or never shows it at all
- whether `draftEdits` is being cleared intentionally after baseline promotion
- whether `currentProjectRef` / `projectDraftsRef` timing is materially contributing to the observed test failure
- whether the failing test is stale relative to the current real `ProjectHome` ownership model
- whether the existing truth lane exercises the exact same renderer reconciliation semantics as this unit test

Pass 94 also did not prove:

- packaging behavior
- broader renderer health
- backend failure-classification beyond the critique/rewrite path

## 14. Repair-Readiness Assessment

Assessment:

- `READY FOR NARROW REPAIR PLAN`

Reason:

- the failure surface is already narrow
- the likely owners are identifiable
- backend route ownership is sufficiently bounded by other evidence
- the next step does not require reopening broad product-state discovery or blocked domains

Why this is not yet a repair pass:

- the ownership split still needs a controlled repair plan that decides whether the first target is:
  - renderer state normalization
  - the `ProjectHome` mock contract
  - or a targeted reproduction that compares real `ProjectHome` against the harness

## 15. Smallest Safe Next Repair-Planning Unit

Smallest safe next unit:

- create a narrow repair plan for the rewrite-sync seam centered on `useCritique.applyRewrite`, `App.handleActiveSceneChange`, `App.handleDraftChange`, and the `ProjectHome` test harness contract

That next planning unit should answer only:

1. After `applyRewrite`, which state store is intended to remain authoritative for visible text:
   - `draftEdits`
   - `projectDrafts`
   - `currentProject.drafts`
   - or a deliberate sequence between them
2. Is `AppCritique.test.tsx` supposed to prove:
   - visible override persistence
   - or visible draft correctness regardless of which mirror owns it
3. Does the mock need to represent live `activeProject.drafts` ownership more faithfully before any repair is chosen

This is the smallest safe unit because it reduces uncertainty without broadening into critique redesign, source-of-truth work, or backend recovery.

## 16. Stop Conditions Encountered

Observed stop/containment conditions in this pass:

- the targeted test invocation attempt through `pnpm --filter app test -- --run ...` did not work because the current app test wrapper rejects `--run`
- broad grep across `services/` hit access-denied paths under `services/testtmp-*`, so full brute-force enumeration was not treated as exhaustive
- no source or test files were changed
- no repair work was performed

No pass-invalidating stop condition was encountered.

## 17. Final Verdict

- `OWNERSHIP MAP COMPLETE — READY FOR NARROW REPAIR PLAN`

Final ownership conclusion:

- the failing workflow is the renderer-side reconciliation from saved rewrite to visible local draft view
- primary ownership sits in the renderer state handoff between `useCritique`, `App`, and `ProjectHome`
- the failing unit harness itself owns part of the red signal because its mocked `ProjectHome` only treats `draftOverrides` as observable truth
- backend critique/rewrite routes remain independently supported by prior truth-lane evidence and are not the leading suspected owner of this failure
