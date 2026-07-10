# Stage 19 Pre-19.5 ProjectHome Baseline Repair Review

## 1. Repository gate

- `HEAD`: `492f5f34475b88eab438ab6b002c697e18d897ee`
- branch: `salvage/minimal-two-surface-shell`
- upstream state: synchronized with `origin/salvage/minimal-two-surface-shell`
- worktree: clean before this repair
- Package `19.3`: committed and pushed
- Package `19.4`: committed and pushed

## 2. Reported baseline failures

The full `renderer/__tests__/ProjectHome.test.tsx` file reproducibly reported two failures:

1. `bootstraps the sample project when no recents are available`
   - expected the successfully loaded sample path to be stored as a recent project
   - no recent entry was stored
2. `labels restored copies in the project details panel`
   - expected the restored path in both the recent-project row and project-details card
   - only the details-card path was present

Initial result:

- test files: `1 failed`
- tests: `25 passed`, `2 failed`

## 3. Root cause

Both failures had one cause:

- the shared `createSampleProject` test fixture returned a successfully loaded project without `projectId`
- current ProjectHome identity doctrine remembers a project path only when the loaded project carries an explicit non-empty `projectId`
- because the fixture lacked identity, ProjectHome correctly did not persist a recent-project entry
- the missing recent entry caused both assertions to fail

This was a stale test fixture, not a runtime ProjectHome defect.

## 4. Bounded repair

File changed:

- `app/renderer/__tests__/ProjectHome.test.tsx`

Change:

- add canonical fixture identity `proj_sample_project` to `createSampleProject`

No runtime code changed.

The repair aligns the successful-project fixture with the project-loader and ProjectHome rule that remembered paths require explicit project identity.

## 5. Verification

Full ProjectHome file:

```powershell
cmd /c pnpm --dir app test -- --run renderer/__tests__/ProjectHome.test.tsx
```

Result:

- test files: `1 passed`
- tests: `27 passed`
- exit code: `0`

Combined Stage 19 project-open/save/re-entry verification:

```powershell
cmd /c pnpm --dir app test -- --run main/__tests__/projectLoaderDraftReentry.test.ts main/__tests__/projectLoaderDraftSave.test.ts main/__tests__/projectLoaderIpc.test.ts main/__tests__/projectLoaderIdentityWitness.test.ts main/__tests__/projectBootstrap.test.ts renderer/__tests__/ProjectHome.test.tsx renderer/__tests__/ProjectHomeSave.test.tsx renderer/__tests__/AppIdentityHandoff.test.tsx renderer/__tests__/SplitCommandWorkspace.test.tsx renderer/__tests__/IPCContracts.test.tsx
```

Result:

- test files: `10 passed`
- tests: `71 passed`
- exit code: `0`

## 6. Scope and authority finding

The repair did not:

- weaken missing-identity rejection
- make identity-less projects rememberable
- change ProjectHome runtime behavior
- touch persistence, save, recovery, restore/import, or services
- inspect or mutate protected evidence
- repair unrelated tests

## 7. 19.5 readiness consequence

The two previously recorded broad ProjectHome baseline failures are resolved.

No known ProjectHome baseline failure now blocks Package `19.5` integrated-spine verification and Stage 19 closure review.

This record does not itself authorize Package `19.5` runtime mutation. Package `19.5` remains a verification and closure segment unless its own bounded review finds a concrete integrated-spine defect.

PZ_CONTINUE: pre-19.5 ProjectHome baseline repaired; full ProjectHome and integrated Stage 19 witness groups pass
