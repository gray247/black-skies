# Stage 14 PKG-A Mutation A1 Execution

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD` at execution start: `24c0d123efbecd5b3e471c607a5f2b1f325901e1`
- Verified scope commit hash: `24c0d123efbecd5b3e471c607a5f2b1f325901e1`
- Verified subject: `docs(product): define PKG-A Mutation A1 scope`

## 2. Selected mutation

Implemented Mutation A1:

**Fail closed at the App activation seam when loader-supplied `projectId` is absent, before any active-project mutation, without deriving identity from path context.**

## 3. Files changed

1. `app/renderer/App.tsx`
2. `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
3. `docs/product_systems/stage14_pkg_a_mutation_a1_execution.md`

## 4. Exact code boundary

Production boundary:

1. `app/renderer/App.tsx`
   - added a missing-ID fail-closed guard inside `activateProject()`
   - removed basename-derived fallback for activation
   - prevented successful path persistence until activation is validated
   - prevented active-project mutation and immediate recovery-status lookup when `projectId` is absent
   - left explicit-ID activation behavior intact

Test boundary:

1. `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
   - replaced the old missing-ID fallback witness with a fail-closed empty-state witness
   - preserved the explicit metadata-ID divergent-path witness
   - added a third witness for prior valid project followed by rejected missing-ID activation

Execution-only regression target:

1. `app/renderer/__tests__/AppPreflight.test.tsx`

## 5. Missing-ID behavior

Confirmed implementation behavior:

1. App no longer derives `projectId` from `project.path` when loader-supplied `projectId` is absent.
2. App rejects the activation before:
   - `currentProjectRef.current`
   - `setCurrentProject`
   - `setProjectDrafts`
   - `setDraftEdits`
   - `setActiveScene`
   - `setProjectSummary`
   - root/body project dataset writes
   - `window.__testProjectState` project activation writes
   - `fetchRecoveryStatus` / `getRecoveryStatus`
3. App emits a bounded warning toast through existing `pushToast` / `ToastStack` plumbing.
4. The toast communicates that activation was rejected because project identity is missing.
5. App no longer persists the rejected project path through `updateLastProjectPath(...)` before successful activation.

## 6. Prior-state preservation

Confirmed behavior from the bounded witness:

1. with no prior active project, rejected activation leaves:
   - no active identity
   - no active path marker
   - no loaded marker
   - no active scene marker
   - no recovery-status request
2. with a valid project already active, a later missing-ID activation attempt preserves:
   - prior active project ID
   - prior active project path
   - prior loaded markers
   - prior root and body datasets
   - prior `window.__testProjectState`
   - prior active scene ID
   - prior recovery-bound identity
3. no rejected basename-derived value or rejected path is written into the active markers during the rejected second activation

## 7. Explicit-ID preservation

Confirmed preserved behavior:

Given:

- `path: "/projects/path-beta"`
- `projectId: "proj_alpha"`

App still:

1. uses `proj_alpha` as active identity
2. keeps `/projects/path-beta` as path context
3. avoids basename substitution
4. writes ID and path separately to root and body datasets
5. calls `getRecoveryStatus({ projectId: "proj_alpha" })`

The targeted preflight regression also confirmed that valid explicit IDs still flow into later preflight and generation requests unchanged.

## 8. Tests changed

Updated `app/renderer/__tests__/AppIdentityHandoff.test.tsx` now contains three primary cases:

1. missing ID with no prior active project
2. explicit metadata ID under divergent path
3. prior valid project followed by rejected missing-ID activation

## 9. Commands and exit codes

Repository gate:

1. `git rev-parse HEAD`
2. `git status -sb`
3. `git status --short`
4. `git log -6 --oneline`
5. `git ls-tree -r --name-only 24c0d12 docs/product_systems/stage14_pkg_a_mutation_a1_scope.md`

Verification commands:

1. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppIdentityHandoff.test.tsx`
   - exit code: `0`
   - result: `1` file passed, `3` tests passed
2. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/AppPreflight.test.tsx --testNamePattern "uses project.json projectId from the loaded project for preflight and generation requests"`
   - exit code: `0`
   - result: `1` file passed, `1` test passed, `46` skipped

No broader suite was run.

## 10. Autonomous corrections made

Bounded autonomous corrections within the authorized files:

1. moved successful `updateLastProjectPath(project.path)` behavior into the guarded activation path so rejected missing-ID projects do not persist rejected path state
2. removed the rejected missing-ID activation fallback from `activateProject()`
3. updated the project-loaded dataset behavior so the empty state no longer publishes a loaded marker
4. replaced the old missing-ID fallback witness with fail-closed assertions
5. added a prior-valid-project rejection witness
6. tightened recovery-call assertions so the rejected second activation proves no additional recovery-status request uses the rejected project or basename-derived value

## 11. Confirmed results

Confirmed by executable witness:

1. missing-ID activation with no prior active project fails closed
2. missing-ID activation with a prior valid project leaves the prior valid project unchanged
3. no recovery-status request occurs for a rejected missing-ID activation
4. explicit metadata-ID activation still succeeds under divergent path input
5. valid explicit project IDs still flow into later preflight and generation requests

Confirmed by source inspection:

1. the activation guard now runs before all active-project mutations in `app/renderer/App.tsx`
2. rejected missing-ID activation does not reach `setProjectSummary(...)`
3. rejected missing-ID activation does not reach successful-path `updateLastProjectPath(...)`

## 12. Unresolved observability limits

The current App witness seam directly proves:

1. dataset state
2. `window.__testProjectState`
3. active-scene ID observability
4. immediate `getRecoveryStatus` request behavior
5. bounded toast visibility

The current seam does not provide a dedicated stable observable for:

1. full `projectSummary` object contents
2. draft-state replacement details
3. draft-edit replacement details

Those no-write guarantees were implemented by guarding the activation seam before the relevant setters and were confirmed by source inspection rather than by a new production test hook.

## 13. Protected-evidence result

No protected evidence was used or modified.

Untouched:

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

## 14. Claims not proved

This mutation pass does not prove:

1. loader behavior changed
2. backend destination safety
3. persistence correctness
4. recovery correctness
5. Save As behavior
6. copy behavior
7. import behavior
8. path/ID divergence visibility
9. the full unknown-identity lifecycle

## 15. Rollback boundary

Rollback boundary remains:

1. one production file: `app/renderer/App.tsx`
2. one witness file: `app/renderer/__tests__/AppIdentityHandoff.test.tsx`

The execution record is documentary only.

## 16. Suggestions not implemented

Not implemented in A1:

1. loader-side rejection or issue emission for missing `projectId`
2. backend or persistence safeguards beyond the current App activation seam
3. a dedicated explicit unknown-identity renderer state model
4. path/ID divergence warning UX
5. broad downstream action-gating redesign beyond the immediate recovery-status request

## 17. Recommended next step

Recommended next step:

1. independently review `app/renderer/App.tsx`, `app/renderer/__tests__/AppIdentityHandoff.test.tsx`, and this execution record
2. if accepted, commit this bounded A1 repair checkpoint
3. separately scope the next PKG-A mutation or evidence pass for unknown-identity lifecycle handling beyond the immediate App activation seam
