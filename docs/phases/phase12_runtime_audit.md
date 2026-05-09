# Phase 12 Runtime Audit and Surface Plans

Status: Phase 12 Passes 2-10 audit and closure artifact
Last Reviewed: 2026-05-09

Canonical sources:

- `docs/phases/phase12_editorial_workflow_plan.md`
- `docs/specs/editorial_workflow_contract.md`
- `docs/specs/critique_rewrite_provenance.md`
- `docs/specs/workflow_spine.md`
- `docs/specs/error_visibility.md`

Runtime files inspected:

- `app/renderer/App.tsx`
- `app/renderer/hooks/useCritique.ts`
- `app/renderer/components/CritiqueModal.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/recovery/actions.mjs`
- `app/renderer/utils/serviceErrors.ts`
- `services/src/blackskies/services/routers/draft/revision.py`
- `app/renderer/__tests__/AppCritique.test.tsx`
- `app/renderer/__tests__/AppPreflight.test.tsx`
- `app/renderer/__tests__/AppRecovery.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `services/tests/test_rewrite_error_path.py`
- `services/tests/unit/test_audited_chain_contract.py`
- `services/tests/test_snapshot_authority_enforcement.py`
- `services/tests/test_snapshot_endpoints.py`
- `services/tests/unit/test_project_export_service.py`

## Pass 2 - Current Critique / Rewrite State Audit

### Critique entry

- `WorkspaceHeader` exposes the `Critique` action through `workspace-action-critique`.
- `App.tsx` passes that action to `openCritique` from `useCritique`.
- `useCritique.runCritique()` blocks the request unless services, project summary, active scene, and non-empty scene text are available.
- The draft text used for critique is resolved from `draftEdits` before `projectDrafts`.

### Critique result lifecycle

- Successful critique sets `phase: critique_ready`, stores the critique response, stores `traceId`, derives rewrite instructions from suggestions or priorities, stores critique provenance, and may update budget state.
- Critique result state is renderer-held and transient.
- Critique does not mutate the draft.
- Batch critique summaries may be persisted by the backend for export history, but the modal critique result remains a renderer workflow surface.

### Rewrite entry

- Rewrite starts inside `CritiqueModal` through the `Generate rewrite` action.
- `useCritique.runRewrite()` requires services, project summary, and the critique-selected `unitId`.
- The rewrite request uses the current resolved scene text, again preferring `draftEdits` over `projectDrafts`.
- The default renderer path prefers `draft/rewrite`; phase 4 rewrite is only used by explicit mock flow fallback.

### Rewrite persistence

- `services/src/blackskies/services/routers/draft/revision.py` writes the revised draft to disk inside the rewrite route.
- The backend validates that the submitted scene body still matches the on-disk scene before writing.
- On conflict, the backend returns a 409-style conflict payload with route provenance in details.
- On success, the backend returns `revised_text`, `diff`, `schema_version`, `model`, and `provenance`.
- The renderer currently keeps only `originalText` and `revisedText` in `RewritePreview`; it does not retain the backend diff payload.

### Sync / reconcile behavior

- `applyRewrite()` copies `state.rewrite.revisedText` into `projectDrafts`, `draftEdits`, and `currentProject.drafts`.
- Sync closes the critique modal and resets critique state.
- Sync does not call the backend and does not persist the draft again.
- The success toast says `Rewrite synced` and `Local draft view updated from the saved rewrite.`

### Discard behavior

- `discardRewrite()` clears the renderer rewrite preview and rewrite error state.
- It returns the phase to `critique_ready` when a critique is still present.
- It does not delete or roll back the saved draft on disk.
- This is currently the highest terminology risk because `Discard rewrite` can be read as removing the saved rewrite.

### Snapshot relationship

- Header snapshot creation calls `createProjectSnapshot`.
- The snapshot panel lists manual snapshots from `.snapshots/*`.
- Existing service-side contracts also distinguish accept/recovery snapshots in `history/snapshots/*`.
- Snapshot is a recovery/audit artifact, not part of the rewrite operation.
- The manual snapshot path and accept/recovery snapshot path remain separate and should be described carefully.

### Export relationship

- Header export calls `exportProject` with the selected export format.
- Export writes output artifacts under an export path and may reveal the export folder.
- Export does not define canonical draft state and does not sync renderer state.

### Error / recovery copy

- Rewrite conflicts are mapped to: `The scene changed on disk after critique. The rewrite request was not saved. Refresh the project or rerun critique, then request the rewrite again.`
- This copy is aligned with the contract because failed rewrite conflicts do not save the rewrite.
- Snapshot and backup errors generally state that the current project was not changed.
- Restore language correctly uses `Restore snapshot`, but should remain recovery-specific and never imply content authoring.

### Provenance visibility

- Critique provenance and rewrite provenance are displayed in the critique modal as route, origin, provider_called, and budget_delta.
- Trace id is displayed separately in the modal footer.
- Budget source is displayed as a separate line.
- Failed rewrite provenance is intentionally not displayed as an accepted result.

### Test coverage

- `AppCritique.test.tsx` covers critique route selection, rewrite route selection, saved rewrite copy, rewrite provenance visibility, sync button presence, conflict copy, and absence of failed rewrite provenance.
- `AppCritique.test.tsx` covers rewrite payload source precedence from active draft edits.
- `AppPreflight.test.tsx` covers snapshot/export wiring through the standard shell and flagged Split Command wrapper.
- `AppRecovery.test.tsx` covers recovery restore behavior.
- `AppSnapshotsVerification.test.tsx` covers snapshot panel verification states.
- `services/tests/test_rewrite_error_path.py` covers backend rewrite conflict provenance and full scene submission.
- `services/tests/unit/test_audited_chain_contract.py` covers workflow chain and snapshot authority rules.

### Misleading terminology risks

- `Discard rewrite` is risky because the rewrite may already be saved.
- `Generate rewrite` is acceptable as the action entry, but the result state must immediately say saved when persistence succeeds.
- `Sync draft view` is currently accurate; future copy must not shorten it to `Apply` or `Save`.
- `Original` and `Revised` are clear but do not yet identify which source is local request text and which source is saved backend output.
- Snapshot labels should stay recovery/audit oriented and avoid implying they are revision checkpoints unless the exact authority is shown.

## Pass 3 - Rewrite / Sync State Labels Plan

| Current wording | Problem | Proposed wording | Surface / file | Risk level | Test required later |
| --- | --- | --- | --- | --- | --- |
| Critique summary | Acceptable, but could better reinforce advice-only state | Critique summary | `CritiqueModal.tsx` | Low | Existing modal render test is enough unless copy changes |
| Requesting critique... | Accurate loading state | Requesting critique... | `CritiqueModal.tsx` | Low | Existing interaction tests likely enough |
| Rewrite instructions | Acceptable, but should stay clearly user-authored | Rewrite instructions | `CritiqueModal.tsx` | Low | Existing rewrite request test |
| Generate rewrite | Accurate before the request, but the result persists on success | Generate saved rewrite | `CritiqueModal.tsx` | Medium | Rewrite button/action test |
| Rewriting... | Could imply an in-memory-only process | Saving rewrite... | `CritiqueModal.tsx` | Medium | Loading-state assertion if changed |
| Saved rewrite | Correct and should be preserved | Saved rewrite | `CritiqueModal.tsx` | Low | Existing `Saved rewrite` assertion |
| Compare the original and revised scene text. | Needs stronger source clarity | Compare the submitted draft text with the saved rewrite. | `CritiqueModal.tsx` | Medium | Modal copy test |
| The rewritten output has already been generated and saved; syncing this view will reconcile the local draft with the saved result. | Contract-aligned but a little dense | The rewrite has already been saved. Sync only updates this local draft view to match it. | `CritiqueModal.tsx` | Medium | Saved-vs-synced copy test |
| Original | Does not identify source authority | Submitted draft | `CritiqueModal.tsx` | Medium | Comparison heading test |
| Revised | Does not identify persistence | Saved rewrite | `CritiqueModal.tsx` | Medium | Comparison heading test |
| Discard rewrite | Can sound like deleting the saved rewrite | Close saved rewrite preview | `CritiqueModal.tsx` | High | Discard copy and no-local-sync test |
| Dismiss | Acceptable for closing critique result, but ambiguous when rewrite is visible | Close review | `CritiqueModal.tsx` | Low | Modal close test if changed |
| Sync draft view | Correct; should be preserved | Sync draft view | `CritiqueModal.tsx` | Low | Existing sync button test |
| Rewrite synced | Correct, but should keep local view wording in description | Rewrite synced | `useCritique.ts` | Low | Toast assertion if added |
| Local draft view updated from the saved rewrite. | Correct and precise | Local draft view updated from the saved rewrite. | `useCritique.ts` | Low | Toast assertion if added |
| The scene changed on disk after critique. The rewrite request was not saved. Refresh the project or rerun critique, then request the rewrite again. | Correct conflict truth; should be preserved | Same wording | `serviceErrors.ts` | Low | Existing conflict test |
| Snapshot saved | Correct for manual snapshot, but should not imply rewrite checkpoint | Snapshot saved | `App.tsx` | Low | Existing snapshot toast tests if changed |
| Restore snapshot | Correct recovery language | Restore snapshot | `App.tsx`, `SnapshotsPanel.tsx` | Low | Existing recovery tests |
| Export project manuscript | Correct output language | Export project manuscript | `WorkspaceHeader.tsx` | Low | Existing export wiring test |
| Exported Markdown to ... | Correct output artifact language | Exported Markdown to ... | `App.tsx` | Low | Existing export test if changed |

## Pass 4 - Revision Comparison Surface Plan

### Minimum comparison UX

- Show the submitted draft text used for the rewrite request.
- Show the saved rewrite text returned by the backend.
- Label both columns by authority, not by vague chronology.
- Keep the sync action visually and verbally separate from the saved rewrite result.
- Show provenance near the saved rewrite result without making it look like an action.

### Source text versus saved rewrite

- Source text should be labeled as `Submitted draft`.
- Saved rewrite should be labeled as `Saved rewrite`.
- If the source text was taken from `draftEdits`, the comparison should not claim it is the persisted draft.
- If the source text was taken from `projectDrafts`, the comparison may still call it submitted draft because the rewrite request body is the actual source for comparison.

### Synced view

- The comparison surface should not disappear in a way that hides what happened.
- Sync should make clear that the local renderer draft now matches the saved rewrite.
- Phase 12 can keep the current modal-close behavior if copy/tests make the saved-vs-synced distinction clear.

### Diff requirements

- The backend already returns a `diff` payload with added, removed, changed, and anchors.
- The renderer currently drops that diff and stores only original/revised text.
- Phase 12 should not implement a rich diff UI until the copy and authority model are stable.
- Minimum safe diff display, when implemented, should be read-only and generated from the returned rewrite result or a deterministic client comparison.

### Fallback if original text is unavailable

- Show `Submitted draft unavailable`.
- Keep the saved rewrite visible if available.
- Do not fabricate an original text block from the current draft if it may have changed after the rewrite request.
- Prompt the user to refresh or rerun critique/rewrite if comparison authority is lost.

### Phase 12 scope

- Allowed in Phase 12: copy plan, comparison authority labels, source/fallback behavior, and tests for saved-vs-synced language.
- Requires explicit implementation pass: changing modal labels, displaying backend diff data, or retaining diff in renderer state.

### Deferred beyond Phase 12

- Persistent revision history.
- Multi-revision comparison.
- Inline diff editor.
- Accept/reject per hunk.
- AI explanation of changes.

### Must never be implied

- That sync is the save operation.
- That a saved rewrite is still only a candidate.
- That the current active draft is necessarily the same text submitted for rewrite.
- That export or snapshot created the revision.

## Pass 5 - Provenance Metadata Surface Plan

### Metadata currently available

- `route_name`
- `provider_called`
- `result_origin`
- `budget_delta`
- `traceId` from bridge responses
- critique `budget` payload when present
- rewrite `model` name and provider in backend response
- optional rewrite `routing` metadata when model-router routing metadata is enabled
- backend rewrite `diff` payload
- conflict details may include rewrite route provenance

### Metadata currently displayed

- critique route, origin, provider_called, and budget_delta
- rewrite route, origin, provider_called, and budget_delta
- trace id in the modal footer
- budget source line

### Metadata not currently displayed

- rewrite model name
- rewrite provider name as a user-friendly label
- routing metadata
- backend diff counts
- request source hash or draft text identity
- persistence timestamp
- snapshot id associated with a later snapshot
- export id or export timestamp in the critique/rewrite modal

### Metadata missing from the runtime contract

- stable revision id
- saved rewrite timestamp
- original submitted text hash
- persisted draft path or scene document revision
- sync timestamp
- user id or local actor identity
- persistent provenance history

### Minimum safe provenance language

- Use `Route`, `Origin`, `Provider called`, and `Budget delta`.
- Keep `trace id` separate from provenance unless the data model is changed later.
- Use `fallback` plainly; do not call fallback output low-quality or unofficial.
- Do not show failed rewrite provenance as if it produced a saved rewrite.

### Deferred provenance work

- persistent provenance ledger
- revision ids
- provenance linked to snapshots
- provenance linked to exports
- user-friendly provider badges
- route/routing explainer UI
- provenance search or history

### Tests needed later

- provenance remains visible for successful critique and successful rewrite
- failed rewrite conflict does not show provenance as accepted output
- copy distinguishes trace id from provenance fields
- fallback/provider origins render in stable user-facing terms
- budget delta display handles `null`, zero, and positive estimates

## Deferred Items From Passes 2-5

| Item | Reason deferred | Risk level | Future phase | Unblock condition | Blocks Phase 12 |
| --- | --- | --- | --- | --- | --- |
| Rich diff UI | Requires renderer state and UI implementation beyond planning | Medium | Phase 12 implementation or Phase 13 | Saved-vs-synced copy and tests are stable | No |
| Persisted revision history | Requires new storage authority and likely project format decisions | High | Phase 13+ | Revision id and storage contract approved | No |
| Persistent provenance ledger | Requires durable metadata storage and retention rules | High | Phase 13+ | Provenance schema and storage owner approved | No |
| Snapshot-linked revision provenance | Requires linking rewrite events to later snapshot ids | Medium | Phase 13+ | Snapshot/revision relationship design approved | No |
| Export-linked revision provenance | Requires export metadata relationship to revision state | Medium | Phase 13+ | Export artifact metadata contract approved | No |
| Per-hunk accept/reject | Requires new mutation workflow and comparison UI | High | Phase 14+ | Rich diff UI and mutation policy approved | No |

## Pass 6 - Snapshot / Recovery Relationship Polish

### Snapshot / recovery truth

- Snapshot means a recoverable project artifact, not an editorial decision.
- Manual snapshots are created and listed through the snapshot feature under `.snapshots/*`.
- Recovery snapshots used by accept/recovery flows live under `history/snapshots/*`.
- Restore means applying a recovery source. In the recovery banner path, restoring a snapshot can change the current project files.
- ZIP restore means creating a duplicate project copy from an export-style archive; it should not imply the current project is overwritten.
- Recovery means returning the project to a usable state after a failure or crash condition.
- Snapshot creation does not critique, rewrite, sync, export, or approve text.
- Snapshot verification checks recovery artifacts; it does not mutate draft text.
- Export creates a deliverable artifact and does not define canonical draft authority.
- What survives restart: persisted draft files, snapshot artifacts, backup/export artifacts, and recovery tracker state.
- What changes current draft authority: draft generation, rewrite persistence, accept/save flows, and recovery restore. Critique, snapshot verification, export, and viewing snapshot reports do not.

### Risky wording table

| Surface / file | Current wording | Risk | Proposed wording | Implementation phase | Test required |
| --- | --- | --- | --- | --- | --- |
| `App.tsx` snapshot toast | `Snapshot created` / `Snapshot <id>` | Low; accurate but does not say it is a recovery artifact | `Snapshot created` with optional body `Recovery artifact created: <id>` | Phase 12 copy pass | Snapshot toast test |
| `App.tsx` snapshot action | `View report` | Medium; action also opens panel and may reveal path, not just a report | `View snapshot report` | Phase 12 copy pass | Snapshot toast action test |
| `WorkspaceHeader.tsx` snapshot button | `Snapshot` | Low; short but acceptable in toolbar context | `Snapshot` | No change needed unless broader toolbar copy pass happens | Existing snapshot wiring test |
| `WorkspaceHeader.tsx` verify button | `Verify` | Medium; does not say snapshots/backups | `Verify snapshots` | Phase 12 copy pass | Header action accessibility test |
| `SnapshotsPanel.tsx` heading | `Snapshots & Verification` | Low; accurate | `Snapshots & Verification` | No change needed | Existing panel test |
| `SnapshotsPanel.tsx` restore ZIP button | `Restore latest ZIP` | Medium; could sound destructive without nearby copy | `Restore latest ZIP as copy` | Phase 12 copy pass | Restore modal test |
| `SnapshotsPanel.tsx` ZIP restore modal | `This creates a duplicate copy of the current project in a sibling folder. Existing projects are not overwritten.` | Low; clearly non-destructive | Keep wording | No change needed | Existing or future modal test |
| `SnapshotsPanel.tsx` backup row action | `Restore` | Medium; backup restore outcome is less explicit than ZIP restore modal | `Restore backup` | Phase 12 copy pass | Backup action test |
| `SnapshotsPanel.tsx` backup restore success | `Backup restored` / `Restored as <slug>` | Low; reasonably clear duplicate/project result | Keep or clarify as `Backup restored as <slug>` | Later copy pass | Backup restore toast test |
| `useRecovery.ts` banner button | `Restore snapshot` | Medium; correctly names action but does not state current project files may change | `Restore snapshot` with supporting banner copy later | Phase 12 recovery copy pass | Recovery banner test |
| `recovery/actions.mjs` success toast | `Restored earlier version.` / `Latest snapshot restored successfully.` | Medium; true, but should clarify current project may now match the restored snapshot | `Current project restored from latest snapshot.` | Phase 12 copy pass | Recovery toast test |
| `recovery/actions.mjs` validation toast | `Select a story to restore its latest snapshot.` | Low; accurate | Keep wording | No change needed | Existing recovery validation coverage |
| `App.tsx` export toast | `Export complete` / `Exported <format> to <path>` | Low; output artifact language is accurate | Keep wording | No change needed | Existing export test |
| `WorkspaceHeader.tsx` export aria-label | `Export project manuscript` | Low; accurate output language | Keep wording | No change needed | Existing export wiring test |

### Future implementation rules

- Snapshot restore must never sound like rewrite.
- Snapshot creation must never imply editorial approval.
- Snapshot verification must never imply the draft was changed.
- Export must never imply canonical draft persistence.
- Sync must never imply snapshot creation.
- Restore copy must say whether current project files may change or a duplicate project will be created.
- Failed restore copy must say whether the current project was modified.
- Manual snapshot copy must not be mixed with accept/recovery snapshot authority unless both paths are named.
- Snapshot-linked provenance must stay deferred until a durable revision/snapshot relationship exists.

### Pass 6 deferrals

| Item | Reason deferred | Risk level | Future phase | Unblock condition | Blocks Phase 12 |
| --- | --- | --- | --- | --- | --- |
| Persistent recovery audit log | Requires durable recovery event storage and retention rules | Medium | Phase 13+ | Recovery event schema and storage authority approved | No |
| Revision-history timeline | Requires persisted revision history and timeline semantics | High | Phase 13+ | Revision storage model approved | No |
| Restore preview / dry-run restore | Requires backend or renderer comparison support before applying restore | Medium | Phase 13+ | Restore preview contract and failure policy approved | No |
| Per-scene restore comparison | Requires scene-level snapshot diff and selective restore policy | High | Phase 14+ | Restore preview plus per-scene mutation rules approved | No |

## Pass 7 - Critique Entry And Result Clarity

### Runtime copy changes

- `Critique summary` became `Critique review` so the modal title names the surface as review, not mutation.
- The critique result section now uses `Advisory summary`.
- Loading copy uses `Requesting critique...`.
- Existing entry guards and service calls did not change.

### Test coverage

- `AppCritique.test.tsx` now asserts critique renders as advisory and does not mutate the renderer draft mirror before rewrite.
- The test also verifies no rewrite call happens during critique-only review.

## Pass 8 - Rewrite Result Clarity

### Runtime copy changes

- `Generate rewrite` became `Generate saved rewrite`.
- `Rewriting...` became `Saving rewrite...`.
- The saved rewrite explainer now says the rewrite has already been saved and sync only updates the local draft view.
- Comparison columns now read `Submitted draft` and `Saved rewrite`.
- `Discard rewrite` became `Close saved rewrite preview`.
- The footer close action now reads `Close review`.
- Snapshot/recovery copy also received the safe Phase 12 wording already identified by Pass 6: `View snapshot report`, `Restore latest ZIP as copy`, `Restore backup`, and `Current project restored from latest snapshot.`

### Behavior preserved

- Rewrite still persists through the existing backend route before renderer sync.
- Sync still updates `projectDrafts`, `draftEdits`, and `currentProject.drafts` only in the renderer mirror.
- Closing the saved rewrite preview still clears renderer preview state only; it does not roll back the saved draft.
- Conflict copy still says the rewrite request was not saved and no failed rewrite provenance is shown.

## Pass 9 - Mutation / Sync / Provenance Test Coverage

Added or strengthened renderer coverage for:

- critique is advisory and non-mutative
- saved rewrite copy appears before sync
- submitted draft versus saved rewrite comparison labels are visible
- sync updates the renderer draft mirror to the saved rewrite
- the sync toast states local draft view reconciliation
- rewrite conflict copy remains specific and does not show accepted rewrite provenance
- snapshot and recovery labels remain separate from rewrite/sync language

No backend tests changed because no backend behavior changed.

## Pass 10 - Cleanup / Closure Review

Closure outcome:

- Phase 12 is closed as an editorial workflow truthfulness foundation.
- Runtime behavior changed only in user-facing copy and test-only mocks/assertions.
- Backend behavior, project format, rewrite persistence, snapshot/export behavior, and Split Command defaults are unchanged.
- Deferred ledger entries remain preserved.

Validation evidence:

- `pnpm --filter app test -- AppCritique.test.tsx AppPreflight.test.tsx AppRecovery.test.tsx AppSnapshotsVerification.test.tsx AppRestore.test.tsx useRecovery.test.tsx`
- `pnpm --filter app test`
- `pnpm --filter app lint`
- `pnpm --filter app run build:production`
- `git diff --check`
