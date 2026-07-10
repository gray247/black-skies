# Stage 19 Package 19.3 Durable-Save Closure Review

## 1. Package authority

Package `19.3` was authorized by:

- `docs/product_systems/stage19_package_19_3_durable_save_readiness_and_ownership_review.md`

Authorized target: one explicit, bounded, manual scene-save path owned by the renderer intent boundary, main-process persistence gate, and persisted scene file.

## 2. Baseline finding

The initial focused group containing the broad `ProjectHome.test.tsx` file reported:

- `42` passing tests
- `2` pre-existing failures

The failures concerned:

- recent-project storage after sample bootstrap
- restored-copy path display count

They existed before Package `19.3` runtime mutation and are unrelated to manual scene saving. They were not repaired, suppressed, or included in Package `19.3` scope.

## 3. Implemented contract

Shared project-loader contract now includes:

- `project-loader:save-draft`
- bounded save request and response types
- explicit failure vocabulary for invalid request, project mismatch, missing scene, invalid scene, stale draft, save failure, and unknown failure

Main-process persistence gating now:

1. requires canonical project root, project identity, scene identity, loaded baseline, and submitted Markdown
2. rejects unsafe scene filename identities
3. resolves the canonical project root
4. compares `project.json` identity with the request identity
5. reads the existing scene file
6. rejects a stale loaded baseline
7. validates submitted front matter and fixed scene identity
8. writes a same-directory temporary file
9. flushes and synchronizes the file
10. atomically replaces the selected scene file
11. cleans temporary output on failure where possible

Renderer behavior now:

- exposes one `Save scene` action for the active scene
- disables save without a dirty override
- disables save while the request is in flight
- shows loaded, unsaved, saving, saved, and failure posture
- updates the durable renderer baseline after success
- removes only the saved matching override
- preserves newer or failed edits as dirty and unsaved
- reports success and failure through the existing toast boundary

## 4. Files changed

Runtime:

- `app/shared/ipc/projectLoader.ts`
- `app/main/projectLoaderIpc.ts`
- `app/main/preload.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`

Focused tests:

- `app/main/__tests__/projectLoaderDraftSave.test.ts`
- `app/renderer/__tests__/ProjectHomeSave.test.tsx`
- `app/renderer/__tests__/AppIdentityHandoff.test.tsx`

Governance:

- `docs/product_systems/stage19_package_19_3_durable_save_readiness_and_ownership_review.md`
- `docs/product_systems/stage19_package_19_3_durable_save_closure_review.md`

## 5. Verification

Final focused command:

```powershell
cmd /c pnpm --dir app test -- --run main/__tests__/projectLoaderDraftSave.test.ts main/__tests__/projectLoaderIpc.test.ts main/__tests__/projectLoaderIdentityWitness.test.ts main/__tests__/projectBootstrap.test.ts renderer/__tests__/ProjectHomeSave.test.tsx renderer/__tests__/AppIdentityHandoff.test.tsx renderer/__tests__/SplitCommandWorkspace.test.tsx renderer/__tests__/IPCContracts.test.tsx
```

Result:

- test files: `8 passed`
- tests: `43 passed`
- exit code: `0`

Additional verification:

- main-process TypeScript no-emit check: pass
- renderer production bundle: pass
- full production build final write step: blocked by an existing `EPERM` lock on generated `app/dist-electron/main/runtimeSessionTruth.js` and its source map
- broad renderer TypeScript no-emit check: remains red with a large pre-existing repository-wide backlog; no Package `19.3` repair was attempted
- `git diff --check`: pass

The generated build outputs did not appear in Git status.

## 6. Required proof verdict

| Requirement | Verdict |
| --- | --- |
| valid save atomically replaces only the selected scene | pass |
| project identity mismatch fails closed | pass |
| invalid project metadata fails closed as project-invalid | pass |
| scene identity mismatch fails closed | pass |
| stale baseline fails closed without overwrite | pass |
| dirty to saving to saved renderer flow | pass |
| failure retains dirty and unsaved edit | pass |
| saved Markdown remains readable from disk | pass |
| Package 19.2 integrated boundaries remain green | pass |

## 7. Exclusion audit

Package `19.3` did not use or mutate:

- AI acceptance, generation, critique, or rewrite
- snapshot creation
- backup or recovery tracking
- restore/import
- migration or rollback
- autosave or save-all
- outline persistence
- services
- protected evidence
- sample-root data
- real user projects
- generated witnesses or regenerated fixtures

## 8. Closure and next boundary

Package `19.3` completion finding: complete.

Package `19.4` remains the normal project re-entry proof. It is not restore, recovery, restore-as-copy, import, backup replay, or migration.

Package `19.4` may proceed only through a bounded readiness record and temporary-project proof using the normal `saveProjectDraft` and `loadProjectFromDisk` paths.

PZ_CONTINUE: Stage 19 Package 19.3 durable manual scene save closed; Package 19.4 normal project re-entry proof is next eligible
