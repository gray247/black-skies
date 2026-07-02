# Stage 14 PKG-A Renderer Identity Handoff Witness Execution

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD`: `81c5c78e7119042c1fdfe4271908648f4d117ac5`
- Verified renderer-witness-plan commit: `81c5c78e7119042c1fdfe4271908648f4d117ac5`
- Verified subject: `docs(product): plan PKG-A renderer identity handoff witnesses`

## 2. Controlling plan

- `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_plan.md`

This execution pass followed the plan's bounded App-level seam:

1. mocked `ProjectHome` callback;
2. `App.handleProjectLoaded()`;
3. `activateProject()`;
4. immediate `getRecoveryStatus({ projectId })` observation.

## 3. Authorized scope

Authorized and performed:

1. verification of the committed renderer-handoff witness plan checkpoint;
2. creation of one renderer test file:
   - `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
3. execution of exactly two App-level identity-handoff witnesses;
4. creation of this execution record.

Not authorized and not performed:

1. production-code changes;
2. renderer behavior changes;
3. persistence changes;
4. recovery or restore execution;
5. Mutation A1 scope or implementation;
6. commit or push.

## 4. Established loader evidence

Already established before this pass:

1. the real loader accepts missing `project.json.project_id` and returns `projectId = undefined`;
2. the real loader preserves metadata `name`, returns `bootstrapState = "empty"`, and emits no loader issue on the exercised missing-ID fixture;
3. the real loader accepts directory-basename versus metadata-ID divergence and returns both filesystem `path` and explicit metadata `projectId`;
4. the real loader does not reject or normalize that divergence on the exercised loader fixture.

Those loader facts remained source context and prior executable evidence. This pass did not rerun them.

## 5. Protected-evidence boundary

This pass did not use or mutate:

1. `sample_project/proj_esther_estate/**`
2. `sample_project/Esther_Estate/**`
3. `build/truth_receipts/**`
4. `build/runtime_truth.json`
5. `build/runtime_truth.schema.json`
6. `ci_artifacts/**`
7. tracked snapshots
8. IPC snapshot evidence
9. real user projects

No fixture materialization, receipt creation, recovery execution, restore execution, or backend write was performed.

## 6. App harness design

Harness shape:

1. one dedicated test file: `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
2. `ProjectHome` mocked to emit a controlled `LoadedProject` directly into `App` through the callback seam
3. `WizardPanel` mocked to avoid unrelated App surface complexity
4. `window.services` injected with deterministic `ServicesBridge` mocks
5. renderer state observed through:
   - `window.__testProjectState`
   - `document.documentElement.dataset.projectId`
   - `document.documentElement.dataset.projectPath`
   - matching `document.body` dataset markers
   - immediate `getRecoveryStatus({ projectId })` request payload

This harness proves renderer handoff from a supplied loader-result shape only. It does not prove real disk-backed loading.

## 7. Mandatory service mocks

Required neutral mocks provided:

1. `checkHealth`
   - deterministic healthy result
   - purpose: neutralize App mount-time service-health behavior
2. `getRecoveryStatus`
   - deterministic idle, non-recovery result
   - purpose: neutralize App activation-time recovery-status behavior while preserving immediate downstream ID observation

Additional service methods were stubbed only to satisfy the existing App runtime surface safely. No additional downstream request was selected for primary proof beyond `getRecoveryStatus`.

## 8. Missing-ID renderer witness

Witness name:

- missing-ID renderer handoff

Supplied project shape:

1. `path: "/projects/missing-id-story"`
2. deterministic basename: `missing-id-story`
3. `name: "Missing Identity Story"`
4. `projectId: undefined`
5. valid outline, scene, and draft payload
6. `bootstrapState: "empty"`

Exact mocks used:

1. `ProjectHome` callback emission
2. `checkHealth` healthy deterministic result
3. `getRecoveryStatus` idle deterministic result
4. no recovery or restore execution

Executable result:

1. activation completed
2. `window.__testProjectState.projectId` became `missing-id-story`
3. `document.documentElement.dataset.projectId` became `missing-id-story`
4. `document.body.dataset.projectId` became `missing-id-story`
5. `document.documentElement.dataset.projectPath` remained `/projects/missing-id-story`
6. `document.body.dataset.projectPath` remained `/projects/missing-id-story`
7. immediate downstream request observed:
   - `getRecoveryStatus({ projectId: "missing-id-story" })`
8. `restoreSnapshot` was not called

Evidence classification:

1. fallback adoption through App handoff: confirmed by executable witness
2. document dataset identity and path state: confirmed by executable witness
3. immediate recovery-status request receiving fallback ID: confirmed by executable witness
4. fallback source expression `project.projectId ?? deriveProjectIdFromPath(project.path)`: confirmed by source inspection

What this witness proves:

1. current renderer handoff adopts a path-derived fallback when the supplied loaded project has no `projectId`
2. that fallback becomes active renderer identity in the exercised App seam
3. the immediate recovery-status request receives that fallback ID in the exercised App seam

What this witness does not prove:

1. real disk loading
2. backend destination safety
3. persistence correctness
4. wrong-project recovery protection
5. Save As, copy, or import behavior
6. product compliance with Stage 12 doctrine

## 9. Explicit metadata-ID divergence witness

Witness name:

- explicit metadata-ID path-divergence handoff

Supplied project shape:

1. `path: "/projects/path-beta"`
2. deterministic basename: `path-beta`
3. `name: "Alpha Divergence Story"`
4. `projectId: "proj_alpha"`
5. valid outline, scene, and draft payload
6. basename differs from metadata ID

Exact mocks used:

1. `ProjectHome` callback emission
2. `checkHealth` healthy deterministic result
3. `getRecoveryStatus` idle deterministic result
4. no recovery or restore execution

Executable result:

1. activation completed
2. `window.__testProjectState.projectId` remained `proj_alpha`
3. `window.__testProjectState.path` remained `/projects/path-beta`
4. `document.documentElement.dataset.projectId` remained `proj_alpha`
5. `document.body.dataset.projectId` remained `proj_alpha`
6. `document.documentElement.dataset.projectPath` remained `/projects/path-beta`
7. `document.body.dataset.projectPath` remained `/projects/path-beta`
8. basename `path-beta` was not substituted into the dataset identity fields
9. immediate downstream request observed:
   - `getRecoveryStatus({ projectId: "proj_alpha" })`
10. `restoreSnapshot` was not called

Evidence classification:

1. explicit metadata-ID preservation through App handoff: confirmed by executable witness
2. path remaining separately represented: confirmed by executable witness
3. immediate recovery-status request receiving explicit metadata ID: confirmed by executable witness
4. fallback skipped when `project.projectId` is present: confirmed by executable witness and consistent with source inspection

What this witness proves:

1. current renderer handoff preserves an explicit metadata `projectId` when path basename differs
2. path remains distinct in document state
3. the immediate recovery-status request receives the explicit metadata ID in the exercised App seam

What this witness does not prove:

1. canonical conflict resolution
2. backend destination safety
3. persistence correctness
4. wrong-project recovery protection
5. actual competing canonical identity claims

## 10. Exact command history

Commands executed:

1. repository gate:
   - `git rev-parse HEAD`
   - `git status -sb`
   - `git status --short`
   - `git log -8 --oneline`
2. targeted witness command:
   - `node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppIdentityHandoff.test.tsx`

Command-shape result:

1. the app-relative Vitest path executed successfully on the first run
2. no command-path correction was required

## 11. Pass/fail results

Targeted test run result:

1. exit code: `0`
2. test files: `1 passed`
3. tests: `2 passed`
4. duration: `3.27s`

Per witness:

1. missing-ID renderer handoff: passed
2. explicit metadata-ID divergence handoff: passed

## 12. Document and renderer state observations

Observed renderer/document state on the exercised App seam:

1. App writes `projectId` and `projectPath` into both `document.documentElement.dataset` and `document.body.dataset`
2. App writes committed project state into `window.__testProjectState`
3. missing-ID supplied loader result produced fallback identity `missing-id-story`
4. explicit metadata-ID supplied loader result preserved `proj_alpha`
5. path remained separate from identity in both exercised cases

## 13. Immediate downstream observations

Bounded downstream observation selected for this pass:

1. immediate `getRecoveryStatus({ projectId })` request only

Observed values:

1. missing-ID case: `missing-id-story`
2. explicit metadata-ID divergence case: `proj_alpha`

This is an App-to-service request observation only. It does not prove backend target safety.

## 14. Warning visibility result

No dedicated identity-warning surface was asserted in this pass.

Reason:

1. current App seam provided a stable identity and downstream observation surface
2. no narrow, identity-specific warning marker was selected for durable proof

Classification:

1. broader user-visible concealment remains unresolved
2. no bounded identity-specific warning was observed or asserted in this execution pass

## 15. Cleanup verification

Cleanup implemented in `afterEach`:

1. rendered React roots
2. `localStorage`
3. `sessionStorage`
4. mocks
5. timers
6. `window.services`
7. `window.projectLoader`
8. `window.__testProjectState`
9. `window.__blackskiesDebugProjectState`
10. `window.__serviceHealthRetry`
11. `window.__runtimeConfigOverride`
12. `document.documentElement.dataset.projectLoaded`
13. `document.documentElement.dataset.projectPath`
14. `document.documentElement.dataset.projectId`
15. matching `document.body` dataset markers
16. `document.documentElement.dataset.activeSceneId`
17. matching `document.body` active-scene marker

Cleanup result:

1. tests passed independently in one file
2. no state-leak failure was observed between the two witness cases
3. no temporary fixture, local-storage artifact, or document dataset artifact persisted outside the test process

## 16. Repository mutation verification

Repository mutations from this pass:

1. `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
2. `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_execution.md`

No implementation file, fixture, snapshot, receipt, or protected-evidence path changed.

## 17. Confirmed behavior

Confirmed by executable witness:

1. the current App handoff fabricates a basename-derived active renderer identity when the supplied loaded project has `projectId = undefined`
2. the current App handoff preserves an explicit metadata `projectId` when path basename differs
3. App publishes the selected identity into document dataset markers and `window.__testProjectState`
4. App immediately passes the selected identity into `getRecoveryStatus({ projectId })`

Confirmed by source inspection:

1. `App.activateProject()` computes `project.projectId ?? deriveProjectIdFromPath(project.path)`
2. `ProjectSummary.projectId` is a required string type
3. `useRecovery.fetchRecoveryStatus()` calls `services.getRecoveryStatus({ projectId })`

## 18. Unresolved behavior

This pass did not prove:

1. real disk-backed loader-to-renderer identity transfer
2. user-visible missing-identity warning or divergence warning behavior
3. backend destination safety
4. wrong-project recovery protection
5. persistence correctness
6. Save As, copy, or import behavior
7. whether downstream project-bound actions should be blocked when identity is absent

## 19. Contradictions or divergences

Current evidence shows one renderer-stage contradiction with Stage 12 doctrine:

1. when supplied loader identity is absent, the current App handoff derives active renderer identity from path context and propagates that derived value into App-managed identity state instead of preserving visible unknown state

Current evidence shows one renderer-stage divergence without proving backend failure:

1. when path basename differs from explicit metadata ID, renderer preserves the metadata ID in the exercised App seam, but broader user-visible divergence handling remains unresolved

## 20. Provisional Mutation A1 implications

These implications remain provisional only:

1. basename-derived fallback may need restriction or removal at renderer handoff
2. missing identity may need explicit unknown-state representation instead of fabricating a fallback identity from path context
3. loader-to-renderer identity transfer may need one canonical active identity rule
4. path/ID divergence may need visible handling before project-bound downstream actions proceed
5. project-bound downstream actions may need explicit blocking or warning when identity is absent

Nothing in this pass authorizes Mutation A1 scope or implementation.

## 21. Claims not proved

This execution record does not prove:

1. product compliance
2. real disk loading
3. backend write-target safety
4. recovery safety
5. persistence correctness
6. Save As, copy, or import semantics
7. global UI silence about identity ambiguity
8. final Mutation A1 target

## 22. Recommended next PKG-A step

Recommended next step:

1. perform an independent review of `app/renderer/__tests__/AppIdentityHandoff.test.tsx` and this execution record
2. if review accepts the proof boundaries, run a separately scoped PKG-A mutation-planning pass focused on renderer missing-identity handling and canonical loader-to-renderer identity transfer
3. keep backend persistence and recovery safety in later evidence lanes unless separately authorized
