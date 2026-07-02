# Stage 14 PKG-A Renderer Identity Handoff Witness Plan

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD`: `4f01246b7f8b2d0b6eecdddf9cfbb10bf9d3dc95`
- Verified isolated-loader-witness commit: `4f01246b7f8b2d0b6eecdddf9cfbb10bf9d3dc95`
- Verified subject: `test(product): capture PKG-A isolated identity witnesses`

## 2. Planning purpose

This record plans, but does not execute, a bounded renderer or loader-to-renderer identity-handoff witness for PKG-A runtime identity and persistence rebinding.

This pass is limited to:

1. verifying the committed isolated-loader-witness checkpoint;
2. identifying the narrowest renderer seam that can prove identity handoff behavior;
3. determining whether current tests can prove fallback adoption, metadata-ID preservation, and visibility posture without production changes;
4. defining one bounded witness-plan document.

This pass does not authorize renderer test creation, witness execution, production mutation, persistence mutation, recovery mutation, Mutation A1 scope, Mutation A1 implementation, commit, or push.

Runtime behavior remains evidence, not product authority.

## 3. Controlling authority

Records inspected:

1. `docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md`
2. `docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`
3. `docs/product_systems/stage14_pkg_a_executable_identity_witness_baseline.md`
4. `docs/product_systems/stage14_pkg_a_isolated_identity_witness_plan.md`
5. `docs/product_systems/stage14_pkg_a_isolated_identity_witness_execution.md`
6. `docs/product_systems/stage12_project_identity_binding_contract.md`
7. `docs/product_systems/project_persistence_local_save.md`

Authority posture preserved:

1. project identity must remain distinct from path;
2. unknown identity must remain visibly unknown;
3. runtime behavior does not redefine Stage 12 doctrine;
4. local-save and persistence authority remain distinct from path convenience and recovery history.

## 4. Established loader evidence

Already established executable evidence from the committed isolated loader witnesses:

1. a loader-valid project whose `project.json` omits `project_id` currently loads successfully and returns `projectId = undefined`;
2. that missing-identity loader result preserves metadata `name`, returns `bootstrapState = "empty"`, and emits no issues on the exercised fixture;
3. a loader-valid project whose directory basename differs from `project.json.project_id` currently loads successfully;
4. that loader-divergence result preserves the filesystem `path` and the metadata `projectId` separately and emits no issues on the exercised fixture.

These are current runtime facts for the loader seam only. They are not product-authority approvals.

## 5. Protected-evidence boundary

No witness planned here may use or mutate:

1. `sample_project/proj_esther_estate/**`
2. `sample_project/Esther_Estate/**`
3. `build/truth_receipts/**`
4. `build/runtime_truth.json`
5. `build/runtime_truth.schema.json`
6. `ci_artifacts/**`
7. tracked visual snapshots
8. IPC snapshot evidence
9. real user projects

No planned renderer witness should require:

1. fixture materialization;
2. receipt creation;
3. recovery execution;
4. restore execution;
5. backend writes;
6. real project roots.

## 6. Current renderer identity flow

Current source indicates this handoff sequence:

1. `ProjectHome` loads projects by path and reports a loaded project object back to `App` through `onProjectLoaded`.
2. `App.handleProjectLoaded()` receives either a `ProjectLoadEvent` or `LoadedProject`.
3. `App.activateProject()` computes `const projectId = project.projectId ?? deriveProjectIdFromPath(project.path);`.
4. `App.activateProject()` writes that value into:
   - `projectWithId`
   - `currentProjectRef`
   - `currentProject` state
   - `projectSummary.projectId`
5. `ProjectSummary.projectId` is typed as required `string`, not optional.
6. `App.activateProject()` immediately calls `fetchRecoveryStatus(projectId)`.
7. later renderer actions can use `projectSummary.projectId` for snapshot, verification, export, critique, preflight, generation, and recovery-facing requests.

Evidence:

1. `app/renderer/App.tsx`
2. `app/renderer/types/project.ts`
3. `app/renderer/components/ProjectHome.tsx`
4. `app/shared/ipc/projectLoader.ts`
5. `app/main/projectLoaderIpc.ts`

## 7. Missing-identity handoff analysis

### 7.1 Current runtime question

When the loader returns:

1. valid `path`
2. valid `name`
3. `projectId = undefined`
4. otherwise valid `LoadedProject`

the renderer handoff question is whether `App.activateProject()`:

1. leaves identity unknown;
2. derives a basename fallback;
3. stores that fallback in `projectSummary`;
4. exposes any warning or issue;
5. blocks project activation;
6. passes the derived value into downstream hooks or service calls.

### 7.2 Source-grounded expectation

Current source strongly suggests:

1. `activateProject()` will derive `projectId` from `project.path` when the loader-supplied value is absent;
2. the derived value will become the renderer's active `projectSummary.projectId`;
3. recovery fetch will receive that derived value immediately;
4. the same derived value can later reach service-facing calls that consume `projectSummary.projectId`.

Current source does not prove:

1. a dedicated visible missing-identity warning;
2. an explicit blocked-activation path for missing identity;
3. any fail-closed renderer posture before service-facing use.

### 7.3 Best proof seam

Best planned seam: `App`-level renderer witness with a mocked `ProjectHome` callback that supplies the loader result.

Reason:

1. it proves renderer handoff from a supplied loader result rather than mocked helper output alone;
2. it reaches `activateProject()` directly;
3. it can observe `projectSummary` consequences through existing App-level requests and body dataset markers;
4. it avoids pretending to prove real disk loading, which is already established separately.

## 8. Path/ID divergence handoff analysis

### 8.1 Current runtime question

When the loader returns:

1. `path` whose basename differs from metadata ID;
2. explicit `projectId = "proj_alpha"`;
3. otherwise valid `LoadedProject`

the renderer handoff question is whether `App.activateProject()`:

1. preserves `proj_alpha`;
2. unnecessarily replaces it with basename fallback;
3. stores both values separately;
4. exposes divergence;
5. conceals divergence;
6. passes the metadata ID into downstream hooks or service calls.

### 8.2 Source-grounded expectation

Current source strongly suggests:

1. the explicit metadata `projectId` will be preserved because fallback is only used when `project.projectId` is absent;
2. `projectSummary.projectId` will stay `proj_alpha`;
3. `projectSummary.path` will stay the divergent filesystem path;
4. downstream calls reading `projectSummary.projectId` will receive `proj_alpha`, not basename.

Current source does not prove:

1. visible divergence diagnostics;
2. a user-facing mismatch warning;
3. any renderer-level refusal when path and metadata ID differ.

### 8.3 Best proof seam

Best planned seam: the same `App`-level renderer witness file, using a mocked `ProjectHome` callback that supplies the divergent loaded-project shape.

Reason:

1. it keeps the rollback boundary unified;
2. it can prove metadata-ID preservation through renderer handoff;
3. it can check whether fallback is skipped when unnecessary;
4. it still avoids backend writes and persistence authority claims.

## 9. Visibility analysis

Current inspected source does not show a dedicated App-level surface for:

1. missing metadata identity warning;
2. project ID mismatch warning;
3. unknown-identity badge;
4. blocked activation banner;
5. dedicated toast for identity ambiguity alone.

Observed current visibility surfaces:

1. `ProjectHome` can render loader issues and issue toasts, but the committed loader witnesses established `issues = []` for both identity scenarios at the loader seam;
2. `WorkspaceHeader` displays `projectLabel`, which is name/path-label oriented, not project-ID oriented;
3. `RecoveryBanner` is recovery-state driven, not identity-diagnostic driven;
4. `App` writes `data-project-id`, `data-project-path`, and `data-project-loaded` attributes to the document body and document element.

Planning consequence:

1. the witness can safely prove silent fallback or silent preservation through observable state and selected downstream requests;
2. the witness can only weakly prove visibility by absence unless a specific visible marker is found;
3. current best plan is to treat "no visible identity warning found in the bounded App seam" as an observable absence, not as a universal UI claim.
4. if no narrow observable warning seam is available, user-visible concealment should remain unresolved.

## 10. Downstream-use map

### 10.1 Immediate activation-time use

When `activateProject()` runs, the selected `projectId` is immediately used for:

1. `currentProjectRef` assignment through `projectWithId`
2. `currentProject` state assignment through `setCurrentProject(projectWithId)`
3. `projectSummary.projectId` assignment through `setProjectSummary(...)`
4. `fetchRecoveryStatus(projectId)`
5. document `data-project-id` and `data-project-path` marker updates

Evidence:

1. `app/renderer/App.tsx`

### 10.2 Hook-consumed use

After activation, mounted hooks can consume project identity in different ways:

1. `useRecovery` consumes `projectSummary` and can fetch recovery state immediately after activation
2. `useRecovery` can later issue `restoreSnapshot({ projectId })` only after a later restore action
3. budget-indicator logic consumes `currentProject?.projectId` after App state has been updated

Classification:

1. `fetchRecoveryStatus(projectId)`: immediate, effect-driven hook consumption
2. `restoreSnapshot({ projectId })`: hook-consumed, but dependent on later user action
3. budget-indicator use: hook/state consumption after activation, not a backend identity-authority proof

Evidence:

1. `app/renderer/App.tsx`
2. `app/renderer/hooks/useRecovery.ts`
3. `app/renderer/recovery/actions.mjs`

### 10.3 Prop pass-through

Some components receive `projectId` through props without proving that any backend request occurs during activation:

1. `SnapshotsPanel`
2. project-bound child surfaces such as analytics, corkboard, relationship graph, and related App children

Classification:

1. `SnapshotsPanel`: prop pass-through only until the panel is opened
2. other project-bound child surfaces: prop pass-through or later render-time consumption, not activation-time request proof

Evidence:

1. `app/renderer/App.tsx`

### 10.4 Later user-action requests

Later user actions or later workflows can use `projectSummary.projectId` for:

1. snapshot creation
2. snapshot verification
3. export
4. critique and batch critique
5. preflight
6. generation

Classification:

1. snapshot creation: source-confirmed only; dependent on later user action
2. snapshot verification: source-confirmed only; dependent on later user action
3. export: source-confirmed only; dependent on later user action
4. critique and batch critique: source-confirmed only; dependent on later user action
5. preflight and generation: source-confirmed and confirmed by existing test; dependent on later user action

Evidence:

1. `app/renderer/App.tsx`
2. `app/renderer/__tests__/AppPreflight.test.tsx`

### 10.5 Existing executable seams

Existing tests already prove some downstream use:

1. `AppPreflight.test.tsx` proves that a loaded-project `projectId` reaches preflight and generation requests
2. `useRecovery.test.tsx` proves the recovery request uses `projectSummary.projectId`
3. `AppRecovery.test.tsx` proves the App seam can exercise the recovery banner flow with the current mock harness

### 10.6 Still unresolved

This planning pass does not prove:

1. backend destination safety;
2. persistence-target identity authority;
3. wrong-project protection;
4. user-visible ambiguity handling outside the bounded renderer seam.

## 11. Witness-layer comparison

| Layer | What it can prove | What it cannot safely prove in first scope | Assessment |
| --- | --- | --- | --- |
| App-level renderer test | actual renderer adoption of loader result; basename fallback use or non-use; `projectSummary` consequences; body dataset markers; selected downstream requests | real disk parsing; backend destination safety; universal UI visibility across every surface | best primary seam |
| ProjectHome-level test | path-based load initiation; recents and last-project path behavior; loader issue display in that component | `App.activateProject()` fallback adoption; required `ProjectSummary.projectId` consequences; downstream App service calls | too low for handoff proof |
| Helper-level test | deterministic basename derivation only | active renderer identity adoption; visibility; downstream handoff | insufficient as primary proof |
| Integration-style renderer test | broader loader-to-renderer chain | more mocks, more setup, higher brittleness, broader rollback boundary | unnecessary for first handoff proof |

## 12. Recommended witness set

### 12.1 Witness 1

1. Witness name: renderer missing-identity handoff witness
2. Purpose: prove what `App.activateProject()` does when the supplied loader result has no `projectId`
3. Layer under test: App-level renderer handoff
4. Exact source files exercised:
   - `app/renderer/App.tsx`
   - mocked `app/renderer/components/ProjectHome.tsx`
   - `app/renderer/types/project.ts`
   - selected service bridge mocks
5. Mocked boundary:
   - `ProjectHome` callback emits a supplied `LoadedProject`
   - services bridge mocks observe only the bounded seams selected for this witness
6. Input project shape:
   - `path: "/projects/missing-id-story"`
   - `name: "Missing Identity Story"`
   - `projectId: undefined`
   - valid outline, scenes, drafts shape
7. Expected current runtime result:
   - basename-derived fallback becomes the renderer's effective `projectId`
   - `data-project-id` is populated with the derived basename
   - `getRecoveryStatus` receives the derived basename if the witness uses the immediate activation seam
   - one later user-action seam such as `preflightDraft` receives the derived basename only if that separate action is explicitly exercised
   - no dedicated identity warning is evident in the bounded seam unless current source shows one elsewhere
8. Stage 12 architectural expectation:
   - missing identity should remain visibly unknown and should not silently become canonical identity
9. Exact assertions:
   - document `data-project-path` equals supplied path
   - document `data-project-id` equals basename of supplied path
   - `getRecoveryStatus` receives the derived basename if the witness uses the immediate activation seam
   - a later user-action request such as `preflightDraft` receives the derived basename only if that separate action is explicitly exercised
   - no stronger product-compliance claim is attached
10. Pass condition:
   - the witness deterministically reaches `activateProject()` and exposes current handoff behavior
11. Fail condition:
   - the test never reaches `activateProject()`
   - the witness depends on production extraction
   - the witness silently broadens into persistence or recovery execution
12. What it proves:
   - renderer fallback adoption behavior for missing loader identity
   - whether that fallback becomes active renderer project identity
13. What it does not prove:
   - real disk loading
   - backend destination safety
   - final product correctness
   - every user-visible ambiguity surface
14. Repository mutation risk: low
15. Protected-evidence risk: low
16. Cleanup requirements:
   - `localStorage` clear
   - rendered React root cleanup
   - mock reset
   - timer cleanup, if timers are used
   - `document.documentElement.dataset.projectId` cleanup
   - `document.documentElement.dataset.projectPath` cleanup
   - corresponding `document.body` dataset cleanup for project markers written by activation
   - service-health retry globals or App test flags, if the harness uses them
   - recovery-related mock state reset
   - window bridge reset
   - cleanup between both witness cases so identity state cannot leak
   - no temp project roots needed
17. Proposed test file: `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
18. Proposed targeted command: `node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppIdentityHandoff.test.tsx`
19. Rollback boundary: one new App-level test file only

### 12.2 Witness 2

1. Witness name: renderer explicit-metadata-ID divergence handoff witness
2. Purpose: prove what `App.activateProject()` does when supplied `path` basename differs from explicit metadata `projectId`
3. Layer under test: App-level renderer handoff
4. Exact source files exercised:
   - `app/renderer/App.tsx`
   - mocked `app/renderer/components/ProjectHome.tsx`
   - `app/renderer/types/project.ts`
   - selected service bridge mocks
5. Mocked boundary:
   - `ProjectHome` callback emits a supplied `LoadedProject`
   - services bridge mocks observe only the bounded seams selected for this witness
6. Input project shape:
   - `path: "/projects/path-beta"`
   - `projectId: "proj_alpha"`
   - `name: "Alpha Divergence Story"`
   - valid outline, scenes, drafts shape
7. Expected current runtime result:
   - explicit `projectId` is preserved
   - basename fallback is not used
   - document `data-project-id` remains `proj_alpha`
   - `getRecoveryStatus` uses `proj_alpha` if the witness uses the immediate activation seam
   - a later user-action request seam such as `preflightDraft` uses `proj_alpha` only if that separate action is explicitly exercised
8. Stage 12 architectural expectation:
   - metadata identity should remain canonical and path should not silently overtake identity authority
9. Exact assertions:
   - document `data-project-path` equals supplied divergent path
   - document `data-project-id` equals `proj_alpha`
   - `getRecoveryStatus` uses `proj_alpha` if the witness uses the immediate activation seam
   - a later request such as `preflightDraft` uses `proj_alpha`, not basename, only if that separate user-action seam is intentionally exercised
   - no visible mismatch warning is asserted unless an actual marker is found
10. Pass condition:
   - the witness deterministically reaches `activateProject()` and shows metadata-ID preservation
11. Fail condition:
   - the test never reaches `activateProject()`
   - the witness widens into backend or persistence claims
12. What it proves:
   - renderer preserves explicit metadata ID when basename fallback is available but unnecessary
   - path remains separately present
13. What it does not prove:
   - visible divergence diagnostics across all surfaces
   - backend write-target safety
   - wrong-project recovery protection
14. Repository mutation risk: low
15. Protected-evidence risk: low
16. Cleanup requirements:
   - `localStorage` clear
   - rendered React root cleanup
   - mock reset
   - timer cleanup, if timers are used
   - `document.documentElement.dataset.projectId` cleanup
   - `document.documentElement.dataset.projectPath` cleanup
   - corresponding `document.body` dataset cleanup for project markers written by activation
   - service-health retry globals or App test flags, if the harness uses them
   - recovery-related mock state reset
   - window bridge reset
   - cleanup between both witness cases so identity state cannot leak
17. Proposed test file: `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
18. Proposed targeted command: `node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppIdentityHandoff.test.tsx`
19. Rollback boundary: one new App-level test file only

## 13. Rejected witness shapes

Rejected for the first renderer handoff lane:

1. helper-only witness for `deriveProjectIdFromPath()`, because it would not prove runtime adoption into `projectSummary`
2. `ProjectHome`-only witness, because it stops before `App.activateProject()` and required downstream identity propagation
3. recovery-executing witness, because it would widen into mutation-capable lifecycle behavior
4. persistence-target witness, because it would widen into backend authority rather than bounded handoff proof
5. broad integration or Electron witness, because current App test harnesses already provide a lower-risk renderer seam

## 14. Proposed test harness

Recommended harness:

1. exact proposed test file: `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
2. test runner: existing app Vitest wrapper
3. likely command: `node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppIdentityHandoff.test.tsx`
4. required mocks:
   - `ProjectHome` mock that emits `onProjectLoaded(...)`
   - `checkHealth` mock returning a stable healthy or otherwise deterministic test state for mount-time service-health behavior
   - `getRecoveryStatus` mock returning a stable non-recovery or otherwise deterministic test state because `activateProject()` immediately calls `fetchRecoveryStatus(projectId)`
   - one selected downstream method for bounded ID observation, only if that witness chooses an action-driven seam such as preflight or another narrow request
5. required app setup:
   - `window.services`
   - optional `window.projectLoader` only if the chosen harness path still depends on it
6. localStorage reset: yes
7. service calls mocked: yes
8. timers or async effects: likely yes, but bounded to existing `waitFor(...)` patterns already used in App tests
9. automatic mount and activation calls must be neutralized so the witness cannot fail because of unrelated health or recovery behavior
10. no real backend call may occur
11. reusable existing harness evidence:
   - `AppPreflight.test.tsx` already mocks `ProjectHome` and injects `window.services`
   - `AppRecovery.test.tsx` already exercises App recovery flows
12. production code changes required: likely none
13. import-safe extraction required: not currently indicated

## 15. Proposed assertions

### Missing identity

Planned strong assertions:

1. the supplied loaded project has `projectId = undefined`
2. after handoff, document `data-project-id` equals the path basename
3. document `data-project-path` equals the supplied path
4. `getRecoveryStatus` receives the derived basename when the witness uses the immediate activation seam
5. a later request such as `preflightDraft` receives the derived basename only if that separate user-action seam is intentionally exercised

Optional bounded absence checks only if they remain stable:

1. no dedicated missing-identity warning text appears
2. no dedicated issue marker appears in the bounded App shell

### Divergent path and metadata ID

Planned strong assertions:

1. the supplied loaded project has explicit `projectId = "proj_alpha"`
2. the supplied path basename differs from `proj_alpha`
3. after handoff, document `data-project-id` remains `proj_alpha`
4. document `data-project-path` remains the divergent path
5. `getRecoveryStatus` uses `proj_alpha` when the witness uses the immediate activation seam
6. a later request such as `preflightDraft` uses `proj_alpha`, not basename, only if that separate user-action seam is intentionally exercised

Optional bounded absence checks only if they remain stable:

1. no dedicated divergence warning text appears

## 16. Execution risks

Primary risks in a later authorized execution pass:

1. accidentally using a mocked `ProjectHome` seam that proves only helper behavior instead of `App.activateProject()` behavior
2. accidentally treating absence of a warning as proof of universal UI concealment
3. accidentally widening the witness into persistence, recovery execution, or backend safety claims
4. accidentally conflating renderer handoff proof with integrated loader proof

Risk classification:

1. App-level handoff witness: low protected-evidence risk, moderate interpretation risk
2. broader integration expansion: moderate scope risk
3. persistence or recovery expansion: high scope and authority risk

## 17. Rollback boundary

Recommended rollback boundary:

1. one new test-only file: `app/renderer/__tests__/AppIdentityHandoff.test.tsx`

No helper file is currently expected.

## 18. Stage 12 reopening recommendation

Recommendation: do not reopen Stage 12 yet.

Reason:

1. current source still shows an implementable renderer handoff seam that can be witnessed
2. no controlling-record contradiction was found in this planning pass
3. awkward renderer tests are not a Stage 12 failure

Reopening should remain live only if a later authorized witness shows:

1. no implementable way to keep identity distinct from path at renderer handoff
2. no coherent way to represent visible unknown identity
3. controlling records cannot coexist with any practical handoff model

## 19. Package-split recommendation

Recommendation: no package split yet.

Reason:

1. both recommended renderer witnesses share one App-level rollback boundary
2. both target the same authority seam: loader result to renderer `projectSummary`
3. no incompatible persistence or recovery mutation lane is required for this proof step

## 20. Provisional Mutation A1 implications

These implications are provisional only and do not authorize Mutation A1.

If later witness execution confirms current expected behavior, later mutation scope will likely need to consider:

1. removing or restricting basename-derived renderer identity fallback
2. representing missing identity explicitly rather than silently fabricating it
3. preserving explicit metadata identity through the renderer handoff as the only active identity source
4. making path/ID divergence visible before project-bound downstream actions proceed
5. preventing path-derived reopen or handoff state from becoming persistence authority by convenience
6. defining one canonical loader-to-renderer identity transfer rule

## 21. Claims not proved

This planning pass did not prove:

1. executable renderer fallback behavior
2. executable renderer preservation of explicit metadata ID under divergent path
3. visible unknown-identity handling
4. visible path/ID divergence handling
5. backend destination safety
6. wrong-project recovery protection
7. integrated end-to-end loader-to-renderer disk-backed identity transfer
8. any Save As, copy, or import identity behavior

## 22. Exact recommended next step

Recommended next step:

1. separately authorize creation of `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
2. limit that pass to the two App-level handoff witnesses planned here
3. review the resulting witness record before any Mutation A1 scope pass begins

That next step should remain proof-only. Mutation A1 selection stays out of scope until the handoff witness results are reviewed.
