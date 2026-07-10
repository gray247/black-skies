# Stage 19 Package 19.4 Normal Project Re-Entry Readiness Review

## 1. Entry condition

Package `19.3` is complete and provides one bounded manual scene-save path.

Package `19.4` now proves that a normally loaded local project can be loaded again after that save and expose the saved Markdown under the same project and scene identity.

## 2. Re-entry owner

The re-entry owner is the existing normal project-loader path:

- `projectLoader.loadProject`
- `projectLoaderIpc.ts` `loadProjectFromDisk`
- `ProjectHome` normal path load/reopen request consumption

The recovery subsystem is not the owner of normal re-entry.

## 3. Required proof

Using a temporary project outside protected evidence:

1. create valid `project.json`, `outline.json`, and one scene Markdown file
2. load through `loadProjectFromDisk`
3. retain the returned project identity, path, scene identity, and loaded Markdown as the save baseline
4. save a valid edited Markdown document through `saveProjectDraft`
5. load the same root again through `loadProjectFromDisk`
6. confirm project identity and canonical path are unchanged
7. confirm the same scene identity is present
8. confirm the second load returns the durably saved Markdown
9. confirm no recovery, restore, import, snapshot, backup, or service route participates

## 4. Authorized scope

Test-only scope is preferred:

- `app/main/__tests__/projectLoaderDraftReentry.test.ts`
- existing focused normal-reopen tests may be executed read-only

Runtime correction is authorized only if the temporary-project proof exposes a concrete defect in:

- `app/main/projectLoaderIpc.ts`
- `app/shared/ipc/projectLoader.ts`

Any runtime correction must remain within normal loading and the already authorized save contract.

## 5. Exclusions

Package `19.4` does not authorize:

- `useRecovery`
- `RecoveryBanner`
- restore or restore-as-copy
- import or backup replay
- snapshots
- migration or rollback
- recent-project UX redesign
- startup automation changes
- sample-root or protected evidence
- real user projects
- broad test repair

## 6. Stop conditions

Stop and block if the proof requires recovery semantics, protected evidence, a service route, a new project identity rule, migration, or any mutation outside the bounded normal loader/save files.

## 7. Authorization

Package `19.4` is authorized as a temporary-project, normal-loader re-entry proof. Test-only closure is preferred if the existing runtime already passes.

PZ_CONTINUE: Stage 19 Package 19.4 normal project re-entry proof authorized through temporary project save and normal reload only
