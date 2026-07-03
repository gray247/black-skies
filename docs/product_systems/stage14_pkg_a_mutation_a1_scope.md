# Stage 14 PKG-A Mutation A1 Scope

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD`: `514a926ab0e9f22c5e1d7dfc9b12f92178a7c0fe`
- Verified subject: `test(product): capture PKG-A renderer identity handoff witnesses`

## 2. Controlling authority

Records inspected:

1. `docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md`
2. `docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`
3. `docs/product_systems/stage14_pkg_a_executable_identity_witness_baseline.md`
4. `docs/product_systems/stage14_pkg_a_isolated_identity_witness_execution.md`
5. `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_plan.md`
6. `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_execution.md`
7. `docs/product_systems/stage12_project_identity_binding_contract.md`
8. `docs/product_systems/project_persistence_local_save.md`

Authority posture preserved:

1. project identity is distinct from path;
2. unknown identity must remain visibly unknown;
3. runtime behavior is evidence, not product authority;
4. current-save and persistence authority remain out of scope for this mutation;
5. Stage 12 remains coherent and implementable;
6. Mutation A1 may repair runtime noncompliance without reopening Stage 12.

## 3. Established executable evidence

### 3.1 Loader seam

Confirmed by committed executable witnesses:

1. when `project.json.project_id` is absent, the loader accepts the project, returns `projectId = undefined`, and emits no issue;
2. when path basename differs from explicit metadata ID, the loader preserves the explicit metadata `projectId`, preserves the path, and does not reject or normalize the divergence.

### 3.2 Renderer seam

Confirmed by committed executable witnesses:

1. when App receives `projectId = undefined`, it derives identity from the path basename;
2. that derived value becomes App-managed identity state;
3. document identity datasets receive the derived value;
4. `getRecoveryStatus` receives the derived value;
5. when App receives explicit `projectId = "proj_alpha"` with divergent path, App preserves `proj_alpha`, does not use basename fallback, keeps path separately represented, and passes `proj_alpha` into `getRecoveryStatus`.

### 3.3 Contract classification

This is confirmed runtime noncompliance with the Stage 12 identity contract at the renderer handoff seam.

This is not a Stage 12 reopening trigger.

## 4. Confirmed runtime contradiction

Confirmed contradiction:

1. the loader can return missing project identity;
2. App currently derives active project identity from path context;
3. App promotes that derived value into identity-bearing renderer state;
4. App immediately passes that derived value into a project-bound request.

Why this matters:

1. Stage 12 forbids path convenience from becoming project identity authority;
2. PKG-A now has enough evidence to scope a first repair at the renderer handoff seam without widening into backend or persistence redesign.

## 5. Mutation-selection analysis

Candidate mutations considered:

### 5.1 Remove the basename-derived fallback in `activateProject()`

Assessment:

1. small authority seam;
2. directly repairs the confirmed contradiction;
3. still requires a decision about what App does next when `projectId` is absent.

Status:

1. included as the technical core of A1;
2. insufficient by itself unless paired with a bounded fail-closed behavior.

### 5.2 Preserve missing identity as an explicit unknown renderer state

Assessment:

1. aligns with Stage 12 doctrine;
2. may require type widening across `ProjectSummary`, downstream consumers, and action gating;
3. risks expanding A1 into a broader renderer-state redesign.

Status:

1. deferred;
2. too broad for the first mutation because `ProjectSummary.projectId` is currently required `string` and multiple downstream consumers assume that invariant.

### 5.3 Block project activation when canonical project identity is absent

Assessment:

1. smallest safe fail-closed behavior at the proven contradiction seam;
2. avoids fabricating identity;
3. avoids type-file changes if App simply refuses to promote the loaded project into active App state;
4. prevents immediate project-bound requests from receiving fabricated IDs.

Status:

1. selected as the behavioral core of Mutation A1.

### 5.4 Allow activation but block project-bound requests until identity is resolved

Assessment:

1. still requires representing an active project with no canonical identity;
2. would spread gating across recovery, preflight, generation, snapshots, critique, export, and related consumers;
3. creates a broader rollback boundary than the first repair needs.

Status:

1. rejected as too broad for A1;
2. suitable only after a later explicit unknown-identity state design, if still needed.

### 5.5 Introduce a bounded identity-validity result at the loader-to-renderer handoff

Assessment:

1. could be architecturally cleaner long-term;
2. likely touches shared transport shapes or additional lifecycle surfaces;
3. exceeds the smallest safe first mutation boundary.

Status:

1. deferred as later follow-up;
2. not required to stop the current contradiction at the App seam.

### 5.6 Loader or backend redesign

Assessment:

1. not required by current evidence for the first repair;
2. would widen into intake, persistence, or recovery authority changes.

Status:

1. rejected for A1;
2. outside current authorization and outside the smallest safe rollback boundary.

## 6. Selected Mutation A1

Selected Mutation A1:

**Fail closed at the App activation seam when the loader-supplied `projectId` is absent. Remove basename-derived activation fallback and do not promote the loaded project into active App identity state or issue the immediate recovery-status request.**

Why this is the smallest safe first mutation:

1. it repairs the confirmed contradiction exactly where the fabricated identity is created;
2. it preserves valid explicit metadata IDs unchanged;
3. it avoids widening into backend persistence, recovery correctness, Save As, copy, import, or full identity-lifecycle redesign;
4. it can likely be contained to `app/renderer/App.tsx` plus the renderer handoff witness file.

## 7. Exact intended behavior

Mutation A1 must change only the App handoff behavior for missing loader identity.

Core intended behavior:

1. App must not derive `projectId` from `project.path` when the supplied loaded project has no canonical `projectId`;
2. App must not promote that loaded project into active App identity state;
3. App must not issue `getRecoveryStatus` for a fabricated or absent ID;
4. explicit metadata IDs must continue to activate normally;
5. path must remain path context, not substitute identity.

## 8. Required behavior for missing identity

When App receives a loaded project with `projectId = undefined`, A1 should:

1. reject that activation attempt at the App seam;
2. run the missing-ID guard before any active-project mutation occurs;
3. avoid setting a fabricated `projectId` in `currentProjectRef`, `currentProject`, draft state, active-scene state, `projectSummary`, document identity datasets, or `window.__testProjectState.projectId`;
4. avoid calling `fetchRecoveryStatus` or `getRecoveryStatus`;
5. surface one bounded failure signal through the existing `pushToast` / `ToastStack` plumbing only; the toast must communicate that activation was rejected because project identity is missing, while exact copy may remain implementation-time confirmation unless later scope locks the text;
6. leave path available only as load context within the loading surface, not as active App identity.

For the first mutation, A1 should not:

1. introduce a broad new unknown-identity UI model;
2. redesign ProjectHome issue rendering;
3. redesign downstream request gating for every project-bound action;
4. change loader acceptance behavior.

Recommended bounded fail-closed posture:

1. if no prior active project exists, App remains with no active project;
2. if a prior valid project is already active, the missing-ID load must leave that active project state unchanged rather than clearing or overwriting it;
3. the missing-ID branch must not transiently write the rejected project's path or identity into active App state, dataset markers, or `window.__testProjectState` before failing closed;
4. the newly attempted missing-ID project must not become the active App project until a later authorized design says how explicit unknown identity should be represented.

## 9. Preserved behavior for explicit identity

When App receives:

- `path: "/projects/path-beta"`
- `projectId: "proj_alpha"`

A1 must preserve:

1. `proj_alpha` remains the active project identity;
2. basename fallback is not used;
3. path remains separately represented as `/projects/path-beta`;
4. `getRecoveryStatus` continues to receive `proj_alpha`;
5. no new divergence-warning feature is required in A1.

## 10. Included scope

Included in A1:

1. the App activation seam where basename fallback is currently created;
2. immediate downstream suppression of `fetchRecoveryStatus` for missing identity at that seam;
3. renderer witness updates needed to encode the new fail-closed expectation for missing identity;
4. preservation of the explicit-ID divergence witness as a regression guard.

## 11. Excluded scope

Explicitly excluded from A1:

1. loader behavior changes;
2. backend persistence or recovery behavior changes;
3. Save As;
4. copy;
5. import;
6. snapshot, restore, or backup semantics;
7. full explicit unknown-identity state redesign across the entire App;
8. path/ID divergence diagnostics beyond preserving the explicit-ID case;
9. global UI visibility redesign;
10. Stage 12 reopening;
11. package splitting.

## 12. Deferred follow-up work

Deferred after A1:

1. explicit unknown-identity state design for later surfaces, if still needed;
2. whether all project-bound actions beyond recovery-status requests should be blocked when identity is absent;
3. path/ID divergence visibility or diagnostics;
4. loader-to-renderer handoff redesign using explicit validity state or typed unknown identity;
5. persistence, recovery, Save As, copy, and import lifecycle repairs.

## 13. Proposed files

Likely files to change for implementation:

1. `app/renderer/App.tsx`
2. `app/renderer/__tests__/AppIdentityHandoff.test.tsx`

Likely files not required to change:

1. `app/renderer/types/project.ts`
2. `app/shared/ipc/projectLoader.ts`
3. `app/main/projectLoaderIpc.ts`

Why:

1. `App.tsx` is where the fallback is created and where the immediate `fetchRecoveryStatus(projectId)` call happens;
2. `AppIdentityHandoff.test.tsx` already isolates the exact contradictory behavior and is the narrowest regression witness.

## 14. Proposed code boundary

### `app/renderer/App.tsx`

Why it must change:

1. it currently computes `project.projectId ?? deriveProjectIdFromPath(project.path)`;
2. it then writes the derived value into App-managed identity state and calls `fetchRecoveryStatus(projectId)`.

Intended change:

1. remove basename-derived activation fallback for the missing-ID path;
2. short-circuit activation when `project.projectId` is absent before any active-project mutation occurs;
3. prevent writes to `currentProjectRef`, `setCurrentProject`, draft state, scene selection, `projectSummary`, dataset markers, and `window.__testProjectState` for that case;
4. preserve the prior active App state unchanged when one already exists, or leave no active App state when none exists;
5. prevent the recovery-status request for that case;
6. emit one bounded warning or error toast through existing `pushToast` / `ToastStack` plumbing, with exact message copy confirmed during implementation unless separately specified.

Prohibited adjacent changes:

1. no loader edits;
2. no backend edits;
3. no recovery algorithm edits;
4. no broad downstream gating sweep;
5. no opportunistic refactor of unrelated App state.

Rollback consequence:

1. revert one App seam and regain the current fallback behavior if necessary.

### `app/renderer/__tests__/AppIdentityHandoff.test.tsx`

Why it must change:

1. the current missing-ID witness encodes the contradictory fallback behavior as passing expectation;
2. that expectation must flip to the new fail-closed contract.

Intended change:

1. replace the missing-ID fallback assertions with no-activation/no-`getRecoveryStatus` assertions and the bounded failure signal chosen for A1;
2. leave the explicit-ID divergence witness as the preservation regression.

Prohibited adjacent changes:

1. no expansion into persistence, recovery-execution, Save As, copy, or import tests;
2. no broad mock-surface cleanup redesign.

Rollback consequence:

1. revert one witness file and recover the previous contradiction witness.

## 15. Proposed test changes

### Missing-ID case with no prior active project

The current witness expects basename fallback. After A1 it should assert, from an empty starting state:

1. `getRecoveryStatus` is not called for the rejected project;
2. the missing-ID guard runs before any active-project mutation for the rejected load;
3. no basename-derived identity is created;
4. no active project identity is written into root or body `projectId` datasets for the rejected activation;
5. no active project path is written into App-managed path datasets for the rejected activation;
6. no root or body `projectLoaded` marker is written for the rejected activation;
7. `window.__testProjectState` does not report the missing-ID project as the active App project;
8. rejected project drafts do not initialize or replace active draft state;
9. rejected project draft edits do not initialize or replace active edit state;
10. rejected project active-scene state does not initialize or replace active scene state;
11. no rejected scene ID becomes active;
12. no `projectSummary` is created or retained for the rejected project, using an existing observable where available or otherwise requiring implementation review to prove that `setProjectSummary` is never reached because the missing-ID guard short-circuits before all active-project mutations, without adding a new production test hook;
13. the bounded warning or error toast is emitted through the existing `pushToast` / `ToastStack` plumbing and communicates that activation was rejected because project identity is missing.

Stable observables should use the existing App test seam where available, including:

1. `window.__testProjectState`
2. root and body dataset markers
3. loaded-state markers
4. active-scene markers or rendered active-scene state
5. mocked child props, if the existing seam already exposes them

If draft state, draft edits, or active scene state are not all exposed through a stable test observable, the implementation review must prove the no-write ordering directly from the guarded activation seam and document that observability limit rather than adding a new production test hook.

Recommended pass condition:

1. the missing-ID load does not become active App identity state;
2. no fabricated ID is generated from basename;
3. no active path, loaded marker, draft state, draft-edit state, or active-scene state is initialized from the rejected project;
4. no immediate recovery-status request is issued.

### Missing-ID case with prior valid active project

`app/renderer/__tests__/AppIdentityHandoff.test.tsx` should add a dedicated third regression case covering:

1. a valid project becomes active first;
2. a second load attempt supplies `projectId = undefined`;
3. the second activation is rejected.

That regression must prove the prior valid project remains unchanged. At minimum it should assert preservation of:

1. prior active project ID;
2. prior active project path;
3. prior root and body `projectLoaded` markers;
4. prior root and body `projectId` datasets;
5. prior root and body `projectPath` datasets;
6. prior `window.__testProjectState`;
7. prior project-summary observable, where available through the existing seam;
8. prior draft state, where observable;
9. prior draft-edit state, where observable;
10. prior active scene and active scene ID, where observable;
11. prior recovery-bound identity.

That regression must also assert:

1. the missing-ID project's basename is not adopted;
2. the rejected path is not written into active markers;
3. no rejected project data appears in test-only active-project observables;
4. `getRecoveryStatus` is not called for the rejected project or any basename-derived value from it;
5. the bounded failure toast is emitted through existing `pushToast` / `ToastStack` plumbing.

The test may allow the earlier valid-project recovery-status call that occurred during initial activation. It must specifically prove that no additional recovery-status call occurs using the rejected project's path or basename-derived value.

### Explicit metadata-ID case

Keep the existing regression expectation:

1. `proj_alpha` remains active;
2. path remains `/projects/path-beta`;
3. `getRecoveryStatus` receives `proj_alpha`.

Recommended pass condition:

1. no regression to explicit metadata-ID handling.

## 16. Targeted commands

Primary targeted command:

1. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppIdentityHandoff.test.tsx`

Recommended additional targeted regression:

1. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppPreflight.test.tsx --testNamePattern "uses project.json projectId from the loaded project for preflight and generation requests"`

Reason for the second command:

1. it verifies that valid explicit IDs still flow into later project-bound requests after A1;
2. it stays within the renderer/App seam and avoids broad-suite execution.

No broad suite should be defaulted unless these targeted witnesses expose a bounded regression that cannot be localized further.

## 17. Compatibility analysis

| Area | Classification | Assessment |
| --- | --- | --- |
| ProjectHome load flow | potentially affected | the load callback still fires, but App may now reject activation for missing-ID results |
| active project state | directly affected | missing-ID results must not become active App state |
| draft state and scene selection | directly affected | missing-ID branch must not populate drafts or scene selection before fail-closed rejection |
| document datasets | directly affected | missing-ID activation should no longer populate active App identity/path datasets and must preserve prior markers unchanged when a valid project is already active |
| recovery-status request | directly affected | missing-ID activation should no longer call `getRecoveryStatus` |
| preflight and generation gating | expected unchanged for valid explicit IDs | the explicit-ID path should remain unchanged |
| snapshot-related props | expected unchanged for valid explicit IDs | A1 should not touch valid-ID project summaries |
| existing App tests with explicit IDs | expected unchanged | explicit-ID project flow should remain intact |
| existing App tests relying on fallback contradiction | directly affected | the missing-ID witness must change expectation |
| `window.__testProjectState` | directly affected | missing-ID path should no longer report an activated project |
| loader seam | expected unchanged | A1 does not edit loader behavior |
| backend persistence and recovery behavior | deferred | out of scope for A1 |

## 18. Regression risks

Primary risks:

1. a rejected missing-ID activation could leave stale prior App state if the fail-closed branch is not handled carefully;
2. valid explicit-ID activation could regress if the missing-ID guard is placed too broadly;
3. existing App tests may assume that every loaded project activates, even when identity is absent;
4. downstream UI may show no signal at all unless a bounded toast or equivalent failure cue is included.

Risk classification:

1. App activation branch logic: direct risk;
2. explicit-ID regression: direct risk;
3. broad renderer surface fallout: potentially affected;
4. backend safety or persistence correctness: deferred, not repaired by A1.

## 19. Implementation stop conditions

Stop A1 implementation immediately if:

1. `App.tsx` plus the handoff witness file are not enough;
2. a type redesign across `ProjectSummary` or multiple downstream consumers becomes necessary;
3. loader or backend files must change to make the first repair coherent;
4. recovery or persistence semantics must be changed beyond suppressing the missing-ID recovery-status request;
5. valid explicit-ID projects regress;
6. unrelated App tests require broad rewrites;
7. protected evidence would be touched.

## 20. Rollback boundary

Recommended rollback boundary:

1. one production file: `app/renderer/App.tsx`
2. one test file: `app/renderer/__tests__/AppIdentityHandoff.test.tsx`

Why this is coherent:

1. both files live at the same authority seam;
2. no backend or loader rollback is required;
3. the contradiction and the regression guard are both localized there.

## 21. Protected-evidence boundary

A1 must not use or mutate:

1. `sample_project/proj_esther_estate/**`
2. `sample_project/Esther_Estate/**`
3. `build/truth_receipts/**`
4. `build/runtime_truth.json`
5. `build/runtime_truth.schema.json`
6. `ci_artifacts/**`
7. tracked snapshots
8. IPC snapshot evidence
9. real user projects

No fixture materialization, receipts, recovery execution, restore execution, or backend writes.

## 22. Stage 12 reopening recommendation

Recommendation: do not reopen Stage 12.

Reason:

1. the contract is internally coherent;
2. the contradiction is implementable as a runtime repair at one App seam;
3. A1 does not require architectural reinterpretation to proceed.

## 23. Package-split recommendation

Recommendation: no package split yet.

Reason:

1. the first repair stays within one App-level authority seam;
2. the rollback boundary is coherent;
3. no incompatible backend or persistence lane is required for A1.

App complexity is not a constitutional crisis.

## 24. Implementation authorization required next

A separate authorization is required before any code or test change begins.

That later authorization should permit only:

1. the bounded App activation repair described here;
2. the matching witness update;
3. the targeted renderer commands listed above;
4. no loader, backend, Save As, copy, import, or persistence redesign work.

## 25. Claims not proved

This scope pass does not prove:

1. the final user-facing unknown-identity UX beyond a bounded first repair;
2. backend destination safety;
3. recovery correctness;
4. persistence correctness;
5. Save As behavior;
6. copy behavior;
7. import behavior;
8. that later project-bound actions beyond `getRecoveryStatus` must be gated in A1;
9. that `ProjectSummary` should eventually become optional or tri-state.
