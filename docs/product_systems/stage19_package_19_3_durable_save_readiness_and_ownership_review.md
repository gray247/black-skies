# Stage 19 Package 19.3 Durable-Save Readiness And Ownership Review

## 1. Repository gate

- `HEAD`: `a5066ed80c3b6507661f7249a209d6139926ec6a`
- branch: `salvage/minimal-two-surface-shell`
- upstream state: synchronized with `origin/salvage/minimal-two-surface-shell`
- worktree: clean before this record was created
- Package `19.2`: committed, pushed, and closed

## 2. Purpose

Package `19.3` establishes one narrow manual save path for one loaded scene draft.

It must preserve the ownership doctrine already present in `app/shared/runtimeSessionTruth.ts`:

- main process owns persistence gating
- renderer owns visible authoring state and user intent capture
- persisted project files own durable draft truth
- renderer does not own durable truth promotion or project identity authority

## 3. Read-only findings

The current renderer:

- edits full scene Markdown through `DraftEditor`
- tracks deviations from the loaded baseline in `App.tsx` `draftEdits`
- labels loaded state as persisted and edited state as dirty/unsaved
- writes preview synchronization data to localStorage, which is not durable project truth

The current project loader:

- loads project metadata, outline, scene metadata, and full scene Markdown
- validates project and scene identity during loading
- already acts as the main-process bridge for normal local project access

No dedicated manual scene-save bridge currently exists.

`acceptDraft` is not a valid manual-save owner because it also performs AI-draft acceptance semantics, snapshots, recovery tracking, diff accounting, and budget mutation.

## 4. Selected save ownership

Selected owner chain:

1. `ProjectHome` captures explicit `Save scene` intent.
2. `App.tsx` owns the visible save request state and current loaded-versus-edited baselines.
3. `window.projectLoader.saveDraft` carries a bounded request through preload.
4. `projectLoaderIpc.ts` gates the project path and identity, validates scene identity and optimistic baseline, and performs the atomic durable replacement.
5. the scene Markdown file under the loaded project `drafts/` directory remains durable truth.

No service, AI acceptance route, snapshot owner, recovery owner, or localStorage preview record becomes the save owner.

## 5. Request and result contract

Required request fields:

- `projectPath`
- `projectId`
- `sceneId`
- `expectedMarkdown`
- `markdown`

`expectedMarkdown` is the exact loaded baseline. The main process must reject the save if the current file no longer matches it.

Required success result:

- `ok: true`
- `projectPath`
- `projectId`
- `sceneId`
- authoritative saved `markdown`

Required failure codes:

- invalid request or scene identity
- project not found or invalid
- project identity mismatch
- scene not found
- stale draft conflict
- filesystem save failure
- unknown failure

## 6. Write and validation contract

Before writing, the main process must:

1. resolve the normal project root
2. reject a missing or mismatched project identity
3. constrain `sceneId` to a safe filename identity
4. confirm the existing scene file is present
5. confirm the current file equals `expectedMarkdown`
6. parse the submitted front matter
7. confirm submitted `id` equals `sceneId`
8. confirm required `title` and numeric `order` remain valid

The write must:

- occur in the existing scene file only
- write UTF-8 with normalized final newline
- use a same-directory temporary file
- flush and synchronize the temporary file
- atomically replace the target
- clean up the temporary file on failure where possible

## 7. Renderer save-state contract

Writer-facing states:

- `idle`: no save attempt is active
- `dirty`: current editor value differs from the loaded durable baseline
- `saving`: one explicit save request is in flight
- `saved`: the request succeeded and the durable baseline was updated
- `error`: the request failed; the edited value remains dirty and unsaved

The Save button must:

- appear only for an active scene
- be disabled without a dirty edit
- be disabled while saving
- invoke only the active-scene save request

Success must update `projectDrafts`, `currentProject.drafts`, and remove the matching `draftEdits` override.

Failure must retain the dirty override and expose an honest error status.

## 8. Authorized scope

Runtime files authorized:

- `app/shared/ipc/projectLoader.ts`
- `app/main/projectLoaderIpc.ts`
- `app/main/preload.ts`
- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`

Focused tests authorized:

- `app/main/__tests__/projectLoaderDraftSave.test.ts`
- `app/renderer/__tests__/ProjectHome.test.tsx`
- one existing or new focused App save-flow test under `app/renderer/__tests__/`

Reference-only unless a concrete compile contract requires otherwise:

- `app/renderer/DraftEditor.tsx`
- `app/shared/runtimeSessionTruth.ts`
- `app/renderer/components/workspace/SplitCommandWorkspace.tsx`

## 9. Exclusions

Package `19.3` does not authorize:

- `acceptDraft` reuse or mutation
- AI generation, critique, or rewrite
- snapshots or backup creation
- recovery tracking or restore/import
- migration, rollback, or provenance/sync
- autosave
- save-all
- multi-scene transactions
- outline persistence
- protected evidence or real user projects
- sample-root data
- broad refactoring
- unrelated tests or cleanup

## 10. Verification requirements

Required proof:

1. valid save replaces only the selected scene atomically
2. project identity mismatch fails closed
3. scene identity mismatch fails closed
4. stale baseline fails closed without overwriting disk
5. renderer transitions dirty to saving to saved on success
6. renderer retains dirty/unsaved state on failure
7. normal project loading reads the saved Markdown
8. existing Package `19.2` integrated-boundary tests remain green

## 11. Authorization and stop conditions

Package `19.3` is authorized only within this record.

Stop and block if implementation requires service routing, AI acceptance, snapshots, recovery/restore, protected evidence, broad persistence redesign, or any file outside the authorized scope without a separate governance amendment.

PZ_CONTINUE: Stage 19 Package 19.3 durable-save ownership established; one bounded manual scene-save implementation authorized
