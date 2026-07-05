# Stage 14 PKG-A Post-A1 Reassessment

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD`: `121207cb8e712dfaccebc8dd30208230e9bb452a`
- Verified subject: `fix(product): fail closed on missing project identity`

## 2. Controlling records

Records inspected:

1. `docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md`
2. `docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`
3. `docs/product_systems/stage14_pkg_a_isolated_identity_witness_execution.md`
4. `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_execution.md`
5. `docs/product_systems/stage14_pkg_a_mutation_a1_scope.md`
6. `docs/product_systems/stage14_pkg_a_mutation_a1_execution.md`
7. `docs/product_systems/stage12_project_identity_binding_contract.md`
8. `docs/product_systems/project_persistence_local_save.md`

Implementation and test seams inspected:

1. `app/renderer/App.tsx`
2. `app/renderer/types/project.ts`
3. `app/shared/ipc/projectLoader.ts`
4. `app/main/projectLoaderIpc.ts`
5. `app/renderer/hooks/useRecovery.ts`
6. `app/renderer/recovery/actions.mjs`
7. `app/renderer/components/ProjectHome.tsx`
8. `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
9. `app/renderer/__tests__/AppPreflight.test.tsx`

Boundary posture preserved:

1. runtime and tests remain evidence, not product authority;
2. project identity remains distinct from path;
3. unknown identity must not be fabricated into canonical identity;
4. this pass is read-only reassessment only.

## 3. A1 effects

Mutation A1 changed the App activation seam, not the loader and not backend persistence authority.

Confirmed post-A1 effects:

1. `App.activateProject()` now rejects a loaded project whose supplied `projectId` is absent before active-project mutation.
2. basename-derived identity fabrication no longer occurs at the App activation seam.
3. missing-ID activation no longer installs `currentProjectRef`, `currentProject`, draft state, scene state, or `projectSummary`.
4. missing-ID activation no longer writes App-managed `projectLoaded`, `projectPath`, or `projectId` dataset state.
5. missing-ID activation no longer updates `window.__testProjectState` with the rejected project.
6. missing-ID activation no longer calls `fetchRecoveryStatus` / `getRecoveryStatus`.
7. missing-ID activation no longer persists the rejected path through successful-activation `updateLastProjectPath(project.path)`.
8. explicit metadata-ID activation still succeeds unchanged on the exercised divergent-path case.

Evidence classification:

1. App guard placement and ordering: confirmed by source inspection
2. fail-closed missing-ID behavior: confirmed by executable witness
3. explicit-ID preservation: confirmed by executable witness

## 4. Risks absorbed by A1

### 4.1 Central missing-ID risks

1. basename-derived identity at App activation: resolved by A1
2. missing-ID project activation into App-managed active project state: resolved by A1
3. missing-ID immediate recovery-status request: resolved by A1
4. rejected path persistence on the App successful-activation path: resolved by A1
5. rejected project dataset state at the App seam: resolved by A1
6. rejected project test-state markers at the App seam: resolved by A1
7. replacement of a prior valid active project by a missing-ID project at the App seam: resolved by A1

### 4.2 What A1 did not absorb

1. loader tolerance of missing `project_id`: unaffected
2. loader lack of missing-ID issue emission: unaffected
3. path/ID divergence visibility: unaffected
4. backend destination safety: unaffected
5. recovery project-binding safety: unaffected
6. recent-project and remembered-path intake outside the App activation commit point: partially resolved

Why recent/remembered path is only partially resolved:

1. A1 prevents a missing-ID project from becoming active App identity state.
2. A1 does not change `ProjectHome.loadProjectAtPath(...)`, which still sets local `activeProject`, updates recents, and persists `storedLastProjectPath` / `blackskies.last-project` on loader success before App validates identity.
3. That source-level route can preserve a rejected missing-ID path as a future reopen input even though App will later refuse to activate it.

Evidence classification:

1. App-level protection: confirmed by executable witness and source inspection
2. ProjectHome path-memory retention route: confirmed by source inspection

## 5. Alternate missing-ID route analysis

### 5.1 Routes that now reach the A1 guard

1. direct `ProjectHome` load callback into `App.handleProjectLoaded()` -> reaches `activateProject()` and therefore the guard
2. direct loaded-project payload into `App.handleProjectLoaded()` -> reaches the guard
3. `reloadProjectFromDisk()` -> calls `activateProject(response.project, ...)` and gates preserve-drafts logic on the returned activation result
4. test bridge `test:set-project` load path in `App.tsx` -> loads through the bridge and then calls `activateProject(response.project)`
5. recovery reopen path after ProjectHome reload -> if the loader returns a project, the handoff still reaches the App guard

Classification:

1. missing-ID project-bound activation through these routes: resolved by A1

### 5.2 Alternate routes that remain reachable

#### A. ProjectHome local loaded state

Current source shows `ProjectHome.loadProjectAtPath(...)` still:

1. calls `setActiveProject(response.project)`
2. sets local `activeSceneId`
3. calls `upsertRecent(response.project)`
4. calls `persistLastProjectPath(response.project.path)`
5. calls `setStoredLastProjectPath(response.project.path)`
6. only then emits `onProjectLoaded({ status: 'loaded', project: response.project, ... })`

Consequence:

1. a missing-ID project can still become a loaded local `ProjectHome` object and a remembered path input before App rejects activation.

Evidence type:

1. confirmed by source inspection

Current status:

1. missing-ID project-bound backend activity from this route is not proved
2. missing-ID path-memory and reopen-input retention from this route remains reachable

#### B. Remembered-path reopen

Current source shows:

1. `useRecovery` stores `lastProjectPath`
2. `evaluateReopenRequest(...)` reopens by path only
3. `ProjectHome` executes the reopen by calling `loadProjectAtPath(reopenPath, { reason: 'recovery' })`
4. a loaded project then re-enters the App handoff

Consequence:

1. the reopen route does reach the A1 guard before App activation
2. but the remembered path can still be path-authoritative input even when prior canonical identity was missing or unresolved

Evidence type:

1. confirmed by source inspection

Current status:

1. missing-ID active App identity via reopen: resolved by A1
2. path-based remembered reopen input: unresolved as a product-safe behavior

#### C. Project-bound renderer service actions

Current source shows later App actions use `projectSummary?.projectId` or `currentProjectRef.current?.projectId` for:

1. preflight and generation
2. critique
3. snapshot creation
4. export
5. recovery status
6. several analytics and relationship surfaces

Because A1 prevents `projectSummary` and `currentProjectRef` installation for missing-ID activation, those actions no longer receive a fabricated ID through the repaired App seam.

Evidence type:

1. confirmed by source inspection
2. preflight/generation explicit-ID preservation: confirmed by executable witness

Current status:

1. alternate missing-ID propagation through these App-managed project-bound actions: resolved by A1 for the exercised seam

### 5.3 Overall alternate-route conclusion

1. No inspected route currently proves that a missing-ID project can still reach project-bound backend activity without passing through the App guard.
2. One meaningful path-based residue remains: `ProjectHome` still persists and remembers a successfully loaded missing-ID path before App rejects activation.
3. That residue is not the pre-A1 contradiction, but it remains relevant because it can preserve a rejected project as future reopen input and as local loaded state below the App authority seam.

## 6. Divergence visibility analysis

Established evidence still shows:

1. the loader preserves explicit metadata identity when path basename differs;
2. App preserves that explicit metadata identity under the exercised divergent-path handoff;
3. no loader issue is emitted on the exercised loader divergence witness;
4. no renderer visibility witness has yet proved whether divergence is surfaced, concealed, or silently tolerated.

Assessment:

1. divergence visibility is not already covered elsewhere
2. divergence visibility remains useful and likely necessary before PKG-A closure
3. divergence visibility is analytically distinct from backend persistence safety
4. divergence visibility does not need to be the immediate next mutation merely because it remains unresolved

Recommendation:

1. treat divergence visibility as a likely later evidence lane
2. do not select a visibility mutation until a bounded witness proves what the current runtime actually shows or hides

Evidence classification:

1. explicit-ID correctness at loader and App seams: confirmed by executable witness
2. visible divergence handling: unresolved

## 7. Loader-diagnostics analysis

Current source and prior executable evidence still show:

1. the loader accepts missing `project_id`
2. the loader returns `projectId = undefined`
3. the loader emits no issue on the exercised missing-ID fixture

Assessment:

1. App now fails closed centrally, so loader-side tolerance is no longer an immediate App-activation contradiction
2. loader diagnostics are not yet justified as the next mutation merely for architectural neatness
3. changing loader behavior could affect older projects, repairability, read-only inspection, and later import or migration lanes
4. whether loader should reject, warn, or remain tolerant now depends on product intent that this reassessment does not need to decide today

Recommendation:

1. defer loader mutation selection
2. if loader diagnostics become the preferred later lane, begin with a bounded planning or witness pass rather than immediate implementation

Evidence classification:

1. current loader tolerance: confirmed by executable witness
2. whether loader rejection or issue emission is product-required after A1: unresolved

## 8. Persistence and recovery evidence status

### 8.1 Backend path selection

Current backend persistence still selects project roots by `project_id` under the configured base directory.

Classification:

1. backend path selection: source-supported only
2. end-to-end safety against wrong-root writes after all runtime transitions: unproved

### 8.2 Recovery project binding

Current source shows:

1. recovery status and restore snapshot operate by `projectId`
2. reopen state remains path-based
3. `useRecovery` fetches recovery state only when `projectSummary.projectId` is present and services are online

Classification:

1. recovery project binding at the API surface: source-supported only
2. wrong-project recovery protection under path/ID divergence: unproved

### 8.3 Snapshot project binding

Current source shows snapshot and export surfaces consume `projectSummary?.projectId`.

Classification:

1. snapshot project binding in renderer request formation: source-supported only
2. backend destination safety under divergence: unproved

### 8.4 Persistence destination

Current evidence after A1 proves:

1. fabricated basename identity no longer reaches the immediate recovery-status request at the App seam
2. valid explicit metadata IDs still reach later preflight and generation requests unchanged

Current evidence does not prove:

1. that every later project-bound write path is safe under all path/ID divergence conditions
2. that persistence destination can never diverge from user-perceived project path

Overall classification:

1. backend destination safety: unproved
2. persistence correctness under divergent path and identity: unproved
3. no current contradiction yet proved after A1 at these seams

## 9. Candidate next lanes

### 9.1 No new mutation yet; gather persistence/recovery evidence

Problem addressed:

1. unresolved backend destination and recovery-binding safety

Existing evidence:

1. source-only backend `projectId` destination selection
2. App-level A1 guard

Missing evidence:

1. executable proof of actual destination or wrong-project risk

Likely files:

1. `app/renderer/App.tsx`
2. `app/renderer/hooks/useRecovery.ts`
3. backend persistence and recovery modules

Mutation risk:

1. low for planning
2. high if widened prematurely into implementation

Human input required:

1. no, not for a read-only evidence pass

Recommendation:

1. good candidate, but not the most immediate remaining hole after A1

### 9.2 Divergence visibility witness

Problem addressed:

1. whether path/ID divergence is visibly surfaced or silently tolerated

Existing evidence:

1. explicit-ID preservation is already proved

Missing evidence:

1. visible divergence handling

Likely files:

1. `app/renderer/App.tsx`
2. divergence-related renderer tests

Mutation risk:

1. low for witness planning

Human input required:

1. no for evidence gathering

Recommendation:

1. useful
2. likely later than the remaining missing-ID route reassessment

### 9.3 Loader missing-identity diagnostics

Problem addressed:

1. whether loader should warn or reject when `project_id` is absent

Existing evidence:

1. loader currently tolerates missing identity
2. App now fails closed

Missing evidence:

1. product decision about older projects, repairability, and read-only inspection posture

Likely files:

1. `app/main/projectLoaderIpc.ts`
2. loader witness tests

Mutation risk:

1. medium to high

Human input required:

1. likely yes before implementation

Recommendation:

1. defer

### 9.4 ProjectHome missing-ID remembered-path witness

Problem addressed:

1. whether `ProjectHome` persists missing-ID recents, `lastProjectPath`, or reopen-authoritative path input before App validation after A1

Existing evidence:

1. App-level project-bound actions now depend on guarded active state
2. `ProjectHome` still source-persists recents and `lastProjectPath` before App validates identity

Missing evidence:

1. executable proof of the current post-A1 behavior for rejected missing-ID recents and remembered-path retention
2. proof whether this path-memory retention should be classified as a remaining contradiction or only as deferred usability/diagnostic debt

Likely files:

1. `app/renderer/components/ProjectHome.tsx`
2. `app/renderer/App.tsx`
3. `app/renderer/__tests__/ProjectHome.test.tsx`
4. `app/renderer/__tests__/AppIdentityHandoff.test.tsx`

Mutation risk:

1. low for witness planning
2. medium if it leads to a bounded renderer follow-up mutation

Human input required:

1. no for the evidence lane

Recommendation:

1. strongest next candidate

### 9.5 Persistence destination witness

Problem addressed:

1. whether renderer-visible project path can diverge from backend write destination in a material way

Existing evidence:

1. source-only mismatch risk

Missing evidence:

1. executable proof under a bounded safe seam

Likely files:

1. renderer identity tests
2. backend persistence tests

Mutation risk:

1. medium to high

Human input required:

1. no for planning

Recommendation:

1. defer until the renderer-side remembered-path residue is better classified

### 9.6 Recovery binding witness

Problem addressed:

1. whether recovery can target the wrong project under path/ID divergence or remembered-path mismatch

Existing evidence:

1. source-only split between path-based reopen and `projectId`-based recovery

Missing evidence:

1. bounded executable proof of wrong-project risk or current safety

Likely files:

1. `app/renderer/hooks/useRecovery.ts`
2. recovery tests
3. possibly backend recovery routes

Mutation risk:

1. medium

Human input required:

1. no for evidence gathering

Recommendation:

1. later than the remaining missing-ID path-memory reassessment

### 9.7 PKG-A closure preparation

Problem addressed:

1. package closeout without another mutation

Existing evidence:

1. A1 repaired the original contradiction

Missing evidence:

1. classification of remaining remembered-path residue
2. divergence visibility
3. persistence/recovery safety

Mutation risk:

1. low

Human input required:

1. no

Recommendation:

1. premature

## 10. Selected next lane

Selected next lane:

**ProjectHome missing-ID remembered-path witness**

Why this lane is next:

1. A1 already absorbed the original App activation contradiction.
2. The strongest remaining source-confirmed missing-ID route is not backend execution; it is `ProjectHome` persisting a successfully loaded missing-ID path into local recents and `lastProjectPath` before App validation.
3. That route can preserve rejected identity intake as future reopen input, which means remembered-path reopen input remains path-based even after the App seam now fails closed.
4. This is smaller and safer than jumping immediately to loader mutation or backend persistence mutation.

Exact intent of the next lane:

1. perform a bounded evidence pass, likely executable, around post-A1 `ProjectHome` handling of missing-ID loads
2. determine whether rejected missing-ID projects still:
   - appear as locally active `ProjectHome` content
   - persist into recents
   - persist into remembered `lastProjectPath`
   - re-enter through reopen flows
3. decide only after that evidence whether a second bounded renderer mutation is justified

This selected lane is an evidence lane, not an implementation mutation authorization.
No A2 mutation is selected yet.

## 11. Mutation estimate

Reassessed estimate:

### Absorbed by A1

1. basename-derived App activation fallback
2. immediate missing-ID recovery-status propagation
3. missing-ID replacement of an already active valid App project

### Evidence-dependent

1. ProjectHome remembered-path / recents gating for rejected missing-ID loads
2. path/ID divergence visibility or diagnostics
3. loader diagnostics for missing identity
4. persistence destination or recovery-binding mutation

### Likely required

1. none are definitely required yet without the next evidence lane
2. one additional bounded renderer mutation remains plausible if the remembered-path route is proved to be product-significant after A1

### Deferred outside current justification

1. Save As
2. copy
3. import

### Not justified

1. Stage 12 reopening
2. package split
3. loader/backend redesign as the immediate next step

Working estimate:

1. definitely required remaining mutations: `0`
2. likely required remaining mutations: `0-1`
3. evidence-dependent additional mutations: `1-2`

## 12. Stage 12 reopening recommendation

Recommendation:

1. do not reopen Stage 12

Reason:

1. the controlling contract remains coherent and implementable
2. A1 already repaired the confirmed renderer contradiction locally
3. remaining issues are now bounded runtime or lifecycle evidence questions, not contract incoherence

## 13. Package-split recommendation

Recommendation:

1. no package split

Reason:

1. the next justified lane remains within the renderer/runtime identity handoff and remembered-path family
2. no incompatible rollback boundary has been proved yet

## 14. Human decisions required

Current decision count:

1. none required for the selected next lane

Future human decisions likely needed only if:

1. loader-side rejection or diagnostics becomes the preferred next mutation
2. import, repair, or older-project compatibility posture must be decided

## 15. Claims not proved

This reassessment does not prove:

1. that `ProjectHome` remembered-path persistence for missing-ID loads is acceptable or unacceptable as final product behavior
2. that all reopen or restart paths are now fully canonical-identity-safe
3. that path/ID divergence is visibly surfaced to the user
4. that backend destination safety is repaired
5. that recovery project-binding is safe under all divergence conditions
6. that loader diagnostics must or must not change
7. that PKG-A is ready for closure

## 16. Exact recommended next step

Authorize one bounded post-A1 evidence pass for the selected `ProjectHome missing-ID remembered-path witness` lane.

That next pass should:

1. stay read-only or test-only
2. focus on `ProjectHome` plus the App handoff boundary
3. prove whether missing-ID loads still persist into:
   - local `ProjectHome` active state
   - recents
   - remembered `lastProjectPath`
   - reopen requests
4. decide after that evidence whether a second bounded renderer mutation is justified

Do not begin loader mutation, backend mutation, divergence-visibility mutation, or PKG-A closure preparation before that bounded lane is reassessed.
