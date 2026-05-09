# Editorial Workflow Contract

Status: Phase 12 closed contract
Last Reviewed: 2026-05-09

## Purpose

This contract defines the exact meaning of the editorial workflow terms used by Phase 12.
Its job is to remove ambiguity around critique, rewrite, sync, snapshot, export, provenance, and recovery.

The core rule is simple: the UI may guide the user, but it must not blur what is advisory, what is saved, what is synced, and what is merely a recovery artifact.

## Source Of Truth

- `app/renderer/App.tsx`
- `app/renderer/hooks/useCritique.ts`
- `app/renderer/components/CritiqueModal.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/utils/snapshotReader.ts`
- `app/renderer/components/WorkspaceHeader.tsx`
- `services/src/blackskies/services/routers/draft/revision.py`
- `app/shared/ipc/services.ts`
- `docs/specs/critique_rewrite_provenance.md`
- `docs/specs/workflow_spine.md`
- `docs/specs/generation_scope.md`
- `docs/specs/error_visibility.md`
- `docs/specs/draft_preview_contract.md`
- `docs/specs/scene_metadata_contract.md`

## Canonical Terminology

### critique

A critique is an advisory review of the current draft text for a selected scene.
It may contain summary text, issues, suggestions, priorities, line comments, provenance, and trace ids.
Critique is renderer-visible and transient.
Critique does not save or mutate draft text.

### rewrite

A rewrite is the request and response pair that produces revised draft text.
The backend rewrite route persists the revised draft immediately.
The renderer may still need to reconcile its local view after the saved result exists.

### rewritten draft

The rewritten draft is the revised manuscript text produced by a rewrite request.
It is the content that was saved by the rewrite route.

### saved rewrite

A saved rewrite is a rewrite whose revised text already exists on disk.
It is not merely a candidate once persistence has completed.

### synced rewrite

A synced rewrite is the renderer-side draft view after the local mirror has been reconciled with the saved rewrite.
Sync is a renderer state alignment step, not the persistence step itself.

### local draft

A local draft is the renderer-held text for the active scene.
It may come from the current project draft, a local edit, or a synced rewrite.
It is display state, not the canonical persistence layer.

### persisted draft

A persisted draft is the on-disk project draft file for a scene.
It is the canonical saved manuscript text until another save or rewrite changes it.

### active draft

An active draft is the draft text currently visible for the selected scene in the renderer.
It may be the persisted draft, a generated draft, or a synced rewrite depending on the current workflow step.

### candidate rewrite

A candidate rewrite is a proposed revised result that has not yet been saved.
In the current runtime, this term should only be used before persistence or in clearly temporary preview copy.
Once the backend rewrite route saves the result, the term should no longer be used for that revision.

### reconciliation

Reconciliation is the act of bringing the renderer draft view into alignment with the already-saved rewrite result.
It is a local state update, not a new rewrite.

### snapshot

A snapshot is a recoverable project artifact that captures state for audit or restoration.
Snapshots are separate from rewrite persistence.

### export

An export is a generated output artifact for sharing or delivery.
Export is separate from draft persistence and does not define canonical manuscript state.

### provenance

Provenance is the truth-chain metadata that explains where a critique or rewrite result came from.
It can include route name, provider origin, result origin, budget delta, and trace context when known.
Provenance is descriptive, not executable.

### revision state

Revision state is the workflow state that describes where the current scene stands in the critique/rewrite/sync lifecycle.
It is a UI and contract concept, not a new storage system.

### draft mutation

Draft mutation is any change to the persisted or local draft text.
Only explicit user actions or explicit workflow operations may cause mutation.
Hidden mutation is forbidden.

### discard

Discard means clear the current review or rewrite preview without applying it to the renderer draft view again.
Discard does not mean delete the saved draft on disk.

### restore

Restore means recover project state from a snapshot or backup artifact.
Restore is a recovery action, not a rewrite action.

### recovery

Recovery is the process of returning to a usable project state after a failure, corruption, or restore event.
It is a durability concept, not a revision proposal.

## Snapshot / Recovery Relationship

Snapshot and recovery terms must stay separate from critique, rewrite, sync, and export terms.

### Snapshot truth

- A snapshot is a persisted recovery artifact.
- Manual snapshots are listed from `.snapshots/*`.
- Accept/recovery snapshots use `history/snapshots/*`.
- Snapshot metadata and manifests may survive restart.
- Creating a snapshot captures project files; it does not approve, rewrite, critique, sync, or export the draft.

### Restore truth

- Recovery restore from `history/snapshots/*` can change the current project files back to the restored snapshot state.
- ZIP restore creates a duplicate project copy and must not imply it overwrites the current project.
- Restore is a recovery action, not an editorial action.
- A failed restore must say whether the current project was modified.

### Recovery truth

- Recovery status tells the renderer whether a project needs recovery and which recovery snapshot is available.
- Recovery survives restart when the backend recovery tracker or snapshot metadata says the project still needs attention.
- Recovery does not create a new revision unless the restore operation actually changes project files.

### Snapshot versus rewrite

- Rewrite creates new draft text and persists it through the draft rewrite route.
- Snapshot captures project state for recovery.
- Snapshot must not sound like a rewrite checkpoint unless the exact snapshot authority and captured state are stated.

### Snapshot versus sync

- Sync reconciles the renderer draft view with an already-saved rewrite.
- Snapshot captures files for durability.
- Sync must never imply that a snapshot was created.
- Snapshot must never imply that the local renderer view was reconciled.

### Snapshot versus export

- Export writes a deliverable artifact.
- Snapshot writes a recovery artifact.
- Export must not imply that project state was persisted.
- Snapshot must not imply that a shareable manuscript artifact was created.

### Draft authority

- Current draft authority changes when draft files are written by generation, rewrite, accept/save flows, or recovery restore.
- Current draft authority does not change when critique runs, provenance is displayed, export succeeds, snapshot verification runs, or a snapshot is merely viewed.
- Manual snapshot creation creates a recovery artifact but does not itself alter the draft content being captured.

## Authority Model

### Authoritative source

- Persisted draft text on disk is the authoritative source for manuscript content.
- A saved rewrite becomes authoritative as soon as the rewrite route writes it successfully.
- Snapshot files are authoritative for recovery history, not for current draft intent.

### Temporary source

- Critique output is temporary renderer state.
- Rewrite output is temporary renderer state until the local view is reconciled.
- Loading and conflict states are temporary UI states.

### Recoverable source

- Snapshot history is recoverable.
- Backup records are recoverable.
- Failed critique or failed rewrite results are not recoverable manuscript content.

### Display-only source

- Summary text, provenance, line comments, status labels, and comparison views are display-only.
- These surfaces may describe saved content, but they do not own it.

## Revision State Model

Phase 12 uses the following state model.

| State | Meaning | Persistence | Transitions | User-visible expectation | Recovery implication |
| --- | --- | --- | --- | --- | --- |
| untouched | No critique or rewrite has happened for the current scene | None beyond the current draft text | initial load, scene switch | The scene can be edited or critiqued normally | No special recovery handling |
| critiqued | A critique result exists for the active scene | Renderer-only | critique start -> critique complete | The user can review advice and decide whether to rewrite | No draft mutation yet |
| rewrite-generated | A rewrite result has been produced | Renderer-only until reconcile; backend may already have persisted the revised draft | critique complete -> rewrite complete | The user can compare original and revised text | Saved rewrite exists even before sync |
| rewrite-saved | The revised draft has been written to disk | Persisted draft file | rewrite complete -> persistence complete | The result is saved, not tentative | Snapshot can capture it |
| rewrite-synced | The renderer draft view now matches the saved rewrite | Renderer mirror updated to the saved text | saved rewrite -> sync action | The visible draft matches the saved result | Restart should show the persisted draft |
| locally-edited | The user has changed the renderer draft view locally | Renderer state; may later persist through other flows | sync -> edit, or draft editing workflows | The visible draft may differ from disk until saved | Local edits may be lost if not persisted |
| snapshot-created | A snapshot or backup artifact exists after a state capture | Persisted recovery artifact | snapshot action | A recovery artifact is available | Restore can recover from it |
| exported | An export artifact was written | Persisted export artifact | export action | A deliverable artifact exists | Export does not define the draft source of truth |

## User Trust Rules

### Editorial truthfulness doctrine

- Critique is non-mutative.
- Rewrite persistence must never be hidden.
- Sync must never sound like save.
- Snapshot must never sound like rewrite.
- Export must never imply draft persistence.
- UI copy must prefer precision over magic.
- Hidden AI mutation is forbidden.

### Forbidden misleading language

- "candidate rewrite" after the backend has already saved the revision
- "sync" when the action actually persists the draft
- "snapshot" when the action actually rewrites text
- "export" when the action actually writes back canonical draft content
- "AI decided" when the system only reflected explicit user intent or backend state

### Preferred terminology

- "critique review"
- "advisory summary"
- "submitted draft"
- "saved rewrite"
- "sync draft view"
- "close saved rewrite preview"
- "persisted draft"
- "renderer draft view"
- "recovery artifact"
- "view snapshot report"
- "restore latest ZIP as copy"
- "current project restored from latest snapshot"
- "review result"
- "provenance"

### Future review expectations

- If a label can be read two ways, tighten it.
- If a state can be mistaken for persistence, name the persistence step explicitly.
- If a surface mixes advice and mutation, split the copy or the controls.

## Phase 12 Implementation Safety Rules

- No hidden draft mutation.
- No automatic reconciliation.
- No duplicate state stores for the same draft authority.
- No invisible rewrite replacement.
- No fake provenance.
- No implied AI certainty.
- No orchestration hidden behind "assistive" language.
- No state transition that depends on unstated backend behavior.
- No copy that suggests a saved revision is still only a proposal.
- No contract that makes recovery look like content authoring.
- No restore copy that hides whether current project files may change.
- No snapshot copy that implies editorial approval.
- No export copy that implies canonical draft persistence.

## Contract Gaps

The following residual gaps remain visible after Phase 12 closure:

- provenance is present, but richer provider/model/timestamp metadata still lacks durable storage authority
- snapshot-linked and export-linked provenance remain deferred until a revision/snapshot/export relationship is designed
- rich diff UI, revision history, and per-hunk accept/reject remain deferred future systems
- recovery restore and ZIP restore copy must continue to keep destructive current-project restore and duplicate-project restore clearly separated
- the renderer currently mirrors draft text in more than one place, so the authority boundaries need to remain explicit in future passes

## Cross-References

- [Phase 12 plan](../phases/phase12_editorial_workflow_plan.md)
- [Critique / Rewrite Provenance Contract](./critique_rewrite_provenance.md)
- [Workflow Spine Contract](./workflow_spine.md)
- [Generation Scope Contract](./generation_scope.md)
- [Error / Toast Visibility Contract](./error_visibility.md)
- [Draft Preview Contract](./draft_preview_contract.md)
- [Scene Metadata Contract](./scene_metadata_contract.md)
