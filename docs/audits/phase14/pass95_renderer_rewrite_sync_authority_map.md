# Pass 95 - Renderer Rewrite Sync Authority Map

## 1. Scope Declaration

Pass 95 is an authority-mapping pass only.

It determines the intended authority model for renderer rewrite synchronization without repairing it.

This pass does not:

- modify renderer code
- modify tests
- repair the rewrite sync failure
- redesign critique or renderer workflows
- introduce new source-of-truth architecture
- reopen roadmap or workflow-state canon work

Hard firewall preserved:

- authority mapping discovers intended ownership
- repair changes behavior later

## 2. Starting Repo State

- Repo: `C:\Dev\black-skies`
- Branch: `phase-b2-memory-lab`
- Preflight `git status --short`: clean
- Preflight `git status -sb`: `## phase-b2-memory-lab...origin/phase-b2-memory-lab [ahead 10]`
- Preflight `git log -1 --oneline`: `cbbafd3 docs: map renderer critique rewrite ownership`

Pass 95 started because the working tree was clean, the branch matched, and the latest commit matched the Pass 94 prerequisite.

## 3. Evidence Base

Primary evidence files inspected:

- `docs/audits/phase14/pass94_renderer_critique_rewrite_sync_ownership_map.md`
- `docs/audits/phase14/pass92_operational_baseline_audit.md`
- `docs/audits/phase14/pass93_operational_baseline_recovery_triage.md`
- `docs/specs/current_state.md`
- `docs/specs/capability_truth_matrix.md`
- `docs/specs/editorial_workflow_contract.md`
- `docs/specs/draft_preview_contract.md`
- `docs/specs/scene_metadata_contract.md`
- `app/renderer/App.tsx`
- `app/renderer/hooks/useCritique.ts`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/__tests__/AppCritique.test.tsx`

Command evidence used in this pass:

| Command | Result | What it can prove | What it cannot prove | Forbidden claim |
| --- | --- | --- | --- | --- |
| `git status --short` | PASS | pre-pass tree cleanliness | behavior correctness | do not claim product health |
| `git status -sb` | PASS | branch correctness | code/runtime health | do not claim pass validity from branch alone |
| `git log -1 --oneline` | PASS | latest commit matches prerequisite | working tree cleanliness | do not claim readiness without the full preflight |
| `Get-Content` on Pass 92/93/94 artifacts and authority docs | PASS | prior evidence and explicit contracts | live GUI behavior | do not treat docs as stronger than code |
| `Get-Content` on `App.tsx`, `useCritique.ts`, `ProjectHome.tsx`, `draftPreviewSync.ts`, `AppCritique.test.tsx` | PASS | state containers, reads/writes, and contract seams | human-smoked correctness | do not claim user workflow proof from static reads alone |
| targeted `rg -n` over draft mirror/state identifiers in `App.tsx` | PASS | creation, mutation, and normalization sites for draft mirrors | exact runtime order under React scheduling | do not claim timing proof |
| targeted `rg -n` over `ProjectHome.tsx` draft and scene-selection paths | PASS | view-model and draft override precedence | full loader/runtime behavior | do not claim project loader truth beyond inspected code |
| targeted `rg -n` over `useCritique.ts` | PASS | rewrite request/apply state transitions | route correctness by itself | do not blame or clear the backend from hook inspection alone |
| targeted `rg -n` over draft preview/editorial contracts | PASS | intended contract language around preview, sync, and mirror semantics | implementation conformance by itself | do not equate contract text with verified behavior |

## 4. Rewrite Synchronization Workflow

The intended rewrite synchronization workflow visible in code and docs is:

1. `ProjectHome` exposes the current active scene and visible draft through `onActiveSceneChange`.
2. `App` keeps renderer-held draft state in `projectDrafts` and `draftEdits`.
3. `useCritique.runRewrite` reads the current active draft text through `resolveSceneDraftText`, which prefers `draftEdits` over `projectDrafts`.
4. The backend `draft/rewrite` route persists the revised text immediately.
5. `useCritique` stores the saved rewrite as transient modal state in `state.rewrite`.
6. User clicks `Sync draft view`.
7. `useCritique.applyRewrite` reconciles the renderer-held draft mirrors to the saved rewrite.
8. `ProjectHome` should then show the reconciled live draft view for the active scene.
9. `draftPreviewSync` writes project-path keyed shared preview state to `localStorage` so other windows can hydrate the same live preview state.

This matches the editorial contract:

- persisted rewrite authority is established at the backend route
- renderer sync is a local alignment step after persistence

## 5. Draft Mirror Inventory

| Mirror | Owner | Creation point | Mutation point(s) | Read locations | Persistence relationship | Synchronization relationship | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| on-disk draft file | backend rewrite route / project files | project load and backend persistence | backend `draft/rewrite`, accept/save/recovery flows | project loader, backend, later reloads | canonical persisted manuscript content | renderer can reload or mirror it, but does not author it directly | `PRIMARY AUTHORITY` |
| `currentProject.drafts` | `App.tsx` current loaded project object | `activateProject` from loader result | `activateProject`, `reloadProjectFromDisk(preserveDrafts)`, `applyDraftPreviewState`, `useCritique.applyRewrite` | `ProjectHome` through `activeProject.drafts`, baseline checks through `currentProjectRef`, companion/project props | in-memory mirror of loaded project state, not direct persistence by itself | used as project-scoped draft baseline for visible preview and reload continuity | `DERIVED STATE` |
| `projectDrafts` | `App.tsx` | `activateProject` from loaded project drafts | `activateProject`, `reloadProjectFromDisk(preserveDrafts)`, `applyDraftPreviewState`, `useCritique.applyRewrite` | `resolveSceneDraftText`, companion active draft fallback, baseline checks via `projectDraftsRef`, draft preview sync write payload | renderer-held copy of project draft map | baseline live draft mirror for current session and cross-window preview sync | `VIEW MODEL` |
| `draftEdits` | `App.tsx` | empty on project activation; created by local edit or sync overlay | `handleActiveSceneChange`, `handleDraftChange`, `applyDraftPreviewState`, `reloadProjectFromDisk(preserveDrafts)`, `useCritique.applyRewrite`, cleared by `activateProject` and normalization | `resolveSceneDraftText`, `ProjectHome` via `draftOverrides`, companion active draft, draft preview sync payload | not canonical persistence; local override layer only | preferred visible/live draft layer over project baseline | `TRANSITIONAL STATE` |
| `draftOverrides` prop | `ProjectHome.tsx` prop surface from `App.tsx` | `projectHomeProps` maps `draftEdits` to `draftOverrides` | indirect only, because it is just `draftEdits` passed down | `ProjectHome.activeSceneDraft`, `commitActiveSceneSelection` | none directly | visible override channel for draft preview and scene-change echo back to `App` | `VIEW MODEL` |
| `state.rewrite` | `useCritique.ts` modal state | successful `runRewrite` | set on rewrite success, cleared on discard/reset/apply | `CritiqueModal` preview and `applyRewrite` | none directly; rewrite is already saved elsewhere | transient preview of the already-saved rewrite before local sync | `TRANSITIONAL STATE` |
| `DraftPreviewSyncState` in `localStorage` | `draftPreviewSync.ts` + `App.tsx` | `createDraftPreviewSyncState` after current project + hydrated state | `writeDraftPreviewSyncState`, `clearDraftPreviewSyncState` | floating window/project-path hydration, storage listener, `resolveStartupScene` | persisted helper state only, not manuscript authority | cross-window cache of current live preview state | `CACHE` |
| `loadedProject` in `AppCritique.test.tsx` | failing test harness | static test constant | not updated by the app under test | `ProjectHomeMock` fallback `data-draft` source | none | only a test fallback model | `TEST-ONLY STATE` |

## 6. Authority Classification Matrix

### Intended authority chain

1. Persisted draft on disk
   - `PRIMARY AUTHORITY`
   - editorial contract says saved rewrite becomes authoritative immediately after backend persistence

2. Loaded project draft mirror in renderer
   - `DERIVED STATE`
   - `currentProject.drafts` mirrors the loaded or reloaded project state

3. Session draft map used by renderer features
   - `VIEW MODEL`
   - `projectDrafts` is the renderer’s session-level baseline map

4. Live local override layer for current editing/generation/sync
   - `TRANSITIONAL STATE`
   - `draftEdits` is intentionally preferred when present

5. Cross-window preview snapshot
   - `CACHE`
   - `DraftPreviewSyncState` exists to rehydrate the same live preview state elsewhere

### Why this is the intended model

Evidence from `docs/specs/editorial_workflow_contract.md`:

- persisted draft text on disk is authoritative
- synced rewrite is the renderer-side draft view after local reconciliation

Evidence from `docs/specs/draft_preview_contract.md`:

- Draft Preview must prefer live generated or edited draft state over stale disk text
- Draft Preview must not use disk-first state as the primary preview source
- project-path keyed preview sync is persisted helper state, not manuscript authority

Evidence from code:

- `resolveSceneDraftText` prefers `draftEdits` over `projectDrafts`
- `ProjectHome.activeSceneDraft` prefers `draftOverrides` over `activeProject.drafts`
- `handleDraftChange` removes an override only when the new text matches the current baseline

## 7. State Transition Sequence

### Project load baseline

1. `activateProject` receives a loaded project.
2. `currentProjectRef.current` is set immediately.
3. `setCurrentProject(projectWithId)` stores the loaded project object.
4. `setProjectDrafts(canonicalDrafts)` stores the loaded draft map.
5. `setDraftEdits({})` clears any prior local overrides.
6. `projectDraftsRef.current = canonicalDrafts`.
7. `ProjectHome` renders active draft from:
   - override if present
   - otherwise `activeProject.drafts`

Intended meaning:

- loaded project drafts are the renderer baseline
- override state starts empty

### Local edit baseline

1. `ProjectHome` `DraftEditor` calls `onDraftChange`.
2. `App.handleDraftChange` compares the new text to baseline:
   - `projectDraftsRef.current[sceneId]`
   - or `currentProjectRef.current?.drafts[sceneId]`
3. If the text equals baseline, the override is removed.
4. If the text differs, `draftEdits[sceneId]` is written.

Intended meaning:

- `draftEdits` only exists when the live view differs from the baseline

### Rewrite request

1. `useCritique.runRewrite` reads `sceneText = resolveSceneDraftText(...)`.
2. That resolver prefers `draftEdits` over `projectDrafts`.
3. Rewrite request submits the live local text, not disk-first text.

Intended meaning:

- rewrite should operate on the visible current draft view

### Rewrite success before sync

1. Backend has already persisted the rewrite.
2. `useCritique` stores `state.rewrite = { originalText, revisedText }`.
3. Visible draft preview has not been reconciled yet.

Intended meaning:

- modal preview is transitional only

### Rewrite sync

1. User clicks `Sync draft view`.
2. `useCritique.applyRewrite` writes `updatedText` into:
   - `projectDrafts[targetId]`
   - `draftEdits[targetId]`
   - `currentProject.drafts[targetId]`
3. critique modal state resets and closes.
4. success toast says local draft view updated from saved rewrite.

Intended meaning from current implementation:

- all renderer mirrors are pushed to the same rewritten text immediately
- the implementation does not clear `draftEdits` during sync

### Post-sync normalization

1. `ProjectHome` effect echoes the active scene draft back through `onActiveSceneChange`.
2. `App.handleActiveSceneChange` compares payload draft to baseline.
3. If the payload draft equals baseline, `draftEdits` may be removed.

Intended meaning:

- `draftEdits` is not a permanent authority store
- it is allowed to disappear once the rewritten text is no longer an override relative to the renderer baseline

## 8. Expected Post-Sync State

Immediately after a successful rewrite sync, the intended state supported by code and contracts is:

- on-disk draft:
  - already rewritten by backend route
- `currentProject.drafts[targetId]`:
  - should equal rewritten text
- `projectDrafts[targetId]`:
  - should equal rewritten text
- visible `ProjectHome` draft:
  - should show rewritten text
- `DraftPreviewSyncState`:
  - should publish rewritten text to cross-window preview sync once the state write effect runs
- critique modal:
  - should be closed/reset

Less certain but still implied by current normalization model:

- `draftEdits[targetId]` may temporarily equal rewritten text immediately after sync
- `draftEdits[targetId]` may later be removed if the rewritten text now matches the renderer baseline

That distinction matters:

- visible post-sync correctness appears to be the intended contract
- permanent override persistence does not appear to be the intended contract

## 9. Test Contract Assessment

The test in `app/renderer/__tests__/AppCritique.test.tsx` clearly intends to assert a real workflow:

- rewrite uses `draft/rewrite`
- saved rewrite exists before sync
- sync updates visible draft state

That part matches the editorial contract.

However, the specific mocked `ProjectHome` contract narrows the observable state to:

- `draftOverrides?.sc_0001`
- otherwise static `loadedProject.drafts.sc_0001`

The mock does not model:

- live `currentProject.drafts` updates in the real component
- the real `ProjectHome.activeProject` fallback after app-side project mutation

Assessment:

- workflow-level intent: aligned with intended contract
- mirror-level assertion shape: narrower than the real implementation contract

Classification:

- the test reflects the intended user-visible contract
- the mock does not fully reflect the intended authority contract

## 10. Implementation Contract Assessment

The current implementation reflects this contract:

- disk is canonical manuscript authority
- `projectDrafts` is the renderer baseline map
- `draftEdits` is a preferred live override layer
- `currentProject.drafts` mirrors project-scoped draft state used by `ProjectHome`
- visible preview should prefer live override state when present and otherwise show the project draft baseline

This aligns with:

- editorial contract language around saved rewrite versus synced rewrite
- draft preview contract language preferring live edited/generated draft state over stale disk text

But the implementation also reveals tension:

- `applyRewrite` writes the synced text into both baseline mirrors and override mirrors
- `handleActiveSceneChange` / `handleDraftChange` are built to remove overrides once they match baseline

Assessment:

- implementation reflects the intended visible contract
- implementation does not define one single permanent renderer authority store
- implementation relies on a deliberate baseline-plus-override model

## 11. Contract Drift Assessment

Observed drift risks:

1. Mirror-count drift
   - editorial contract warns against duplicate state stores for the same draft authority
   - implementation currently uses multiple mirrors with partially different roles

2. Test-harness drift
   - `ProjectHomeMock` treats override presence as the main observable truth
   - real `ProjectHome` can render correctly from updated `activeProject.drafts` even if override normalization changes

3. Semantic drift between “visible correctness” and “override persistence”
   - docs support visible correctness after sync
   - the failing test shape can be read as requiring override persistence specifically

4. Cross-window cache drift pressure
   - `DraftPreviewSyncState` stores both `projectDrafts` and `draftEdits`
   - this is useful for live preview hydration, but it further normalizes the multi-mirror model

Contract-drift conclusion:

- there is no strong evidence that the implementation intends `draftEdits` to remain the long-term authority after sync
- there is strong evidence that the implementation intends the visible preview to be correct after sync
- therefore the most likely drift is between the test harness contract and the implementation’s authority model, not between the editorial contract and the visible product contract

## 12. Unknowns / Not Proven

This pass did not prove:

- whether a real human-visible GUI run currently shows the correct rewritten text after sync
- whether `draftEdits` is removed in the failing path before or after the mock assertion checks
- whether React scheduling/timing contributes materially to the failure
- whether cross-window draft preview sync participates in the failing unit test path
- whether there are other consumers of `projectDrafts` or `currentProject.drafts` that depend on one mirror winning over the other after sync

## 13. Repair-Readiness Assessment

Assessment:

- `READY FOR NARROW REPAIR PLAN`

Reason:

- the intended authority chain is now sufficiently clear
- the key ambiguity has been reduced from “which store is authoritative” to “which visible contract is being enforced by repair”
- the next repair-planning step can stay narrow and evidence-backed

## 14. Smallest Safe Repair-Planning Scope

Smallest safe next scope:

- a repair-planning pass limited to rewrite-sync postconditions across:
  - `useCritique.applyRewrite`
  - `App.handleActiveSceneChange`
  - `App.handleDraftChange`
  - `ProjectHome` visible draft precedence
  - `AppCritique.test.tsx` mock/expectation contract

That repair-planning pass should decide only:

1. what post-sync invariant must hold for visible draft correctness
2. whether `draftEdits` must remain populated after sync or may be normalized away
3. whether the failing test should assert visible draft correctness independent of mirror choice, or explicitly assert override persistence

## 15. Stop Conditions Encountered

No pass-invalidating stop condition was encountered.

Boundaries preserved:

- no source code changed
- no tests changed
- no repair work performed
- no package/build/config edits performed

## 16. Final Verdict

- `AUTHORITY MAP COMPLETE — READY FOR REPAIR PLANNING`

Final authority conclusion:

- persisted draft files are the canonical manuscript authority
- renderer rewrite sync uses a baseline-plus-override model, not a single permanent in-memory draft authority
- `projectDrafts` and `currentProject.drafts` act as renderer baseline mirrors
- `draftEdits` acts as a live override layer and may be transitional after sync
- visible post-sync correctness is the intended contract
- the strongest contract-drift risk is between the failing test harness and the implementation’s multi-mirror authority model, not between the implementation and the editorial contract
