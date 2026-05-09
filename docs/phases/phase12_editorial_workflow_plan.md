# Phase 12 Editorial Workflow / Revision Intelligence Foundation

Status: Living roadmap
Last Reviewed: 2026-05-08
Canonical Contract Source: `docs/specs/editorial_workflow_contract.md`
Supporting Design Sources: `docs/specs/critique_rewrite_provenance.md`, `docs/specs/workflow_spine.md`, `docs/specs/generation_scope.md`, `docs/specs/error_visibility.md`, `docs/specs/draft_preview_contract.md`, `docs/specs/scene_metadata_contract.md`

## Purpose

Phase 12 makes the critique/rewrite workflow truthful, explainable, and easy to trust.
The goal is not to add new intelligence. The goal is to make the existing editorial loop legible:

- critique starts from the selected scene and produces a review result
- rewrite starts from that critique context and produces a persisted revised draft
- sync reconciles the renderer view with the already-saved draft
- snapshots and exports remain separate durability steps, not hidden rewrite steps
- the user can tell what changed, what was saved, and what still needs an explicit action

Phase 12 is the editorial workflow foundation for later revision features.

## What Phase 12 Is Not

Phase 12 does not add:

- persisted Story Units
- memory lifecycle or memory-aware state
- embeddings
- relationship graphs
- constellation graphs
- emotional pulse graphs
- local LLM orchestration
- command execution middleware
- autonomous rewriting
- automatic AI restructuring
- multi-outline branching
- plugin systems

If a future idea requires one of those systems, it belongs in a later phase and must be deferred here.

## Current Runtime Reality

The current critique/rewrite loop is already real, but the user-facing contract is only partially explicit.

### Where critique starts

- The main workspace header launches critique from `app/renderer/App.tsx`.
- `useCritique.ts` validates that services, a project, and a selected scene all exist before it calls the service bridge.
- `CritiqueModal.tsx` is the renderer surface that displays the critique result, provenance, instructions, and rewrite controls.

### Where rewrite starts

- Rewrite is triggered from the critique modal after critique has completed.
- `useCritique.ts` builds either a draft rewrite request or a phase 4 mock request depending on runtime mode.
- The backend rewrite route persists the revised draft immediately.

### Whether rewrite persists immediately

- Yes. The rewrite service writes the revised draft to disk as part of the rewrite request lifecycle.
- The renderer does not hold the authoritative draft text after rewrite completes; it holds a local view that still has to be reconciled.

### How sync and reconcile work

- `applyRewrite()` in `useCritique.ts` copies the revised text into `projectDrafts`, `draftEdits`, and `currentProject.drafts`.
- That sync step updates the renderer-side view to match the saved result.
- Discarding the rewrite clears the preview without mutating the saved draft again.

### How snapshots relate

- Snapshots are a separate durability and recovery surface.
- `App.tsx` owns snapshot creation and verification actions.
- `SnapshotsPanel.tsx` and `snapshotReader.ts` inspect snapshot history and manifest metadata.
- Snapshots provide audit and recovery context after mutation; they do not replace critique or rewrite state.

### How exports relate

- Export is its own action in `App.tsx` and `WorkspaceHeader.tsx`.
- Export should describe the current manuscript state, not silently become part of the rewrite contract.

### What is currently misleading, weak, or under-tested

- The UI does not yet make the saved-vs-synced distinction explicit enough.
- Provenance is present, but the editorial lifecycle vocabulary is not yet standardized across surfaces.
- The difference between critique advice and rewrite output can still blur in the modal copy.
- Snapshot/recovery is durable, but its relationship to rewrite persistence is not yet documented as a user-facing contract.
- The current tests cover the main paths, but the trust model around state ownership, sync, and provenance is not yet written down as a stable editorial contract.

## Authority Model

Use the following source-of-truth rules for Phase 12 work.

| State | Authority | Notes |
| --- | --- | --- |
| Current draft text | On-disk project draft file | This is the persisted manuscript text. |
| Backend persisted rewrite | Rewrite route response plus on-disk draft file | A successful rewrite already saved the revision. |
| Renderer draft view | `projectDrafts`, `draftEdits`, and `currentProject.drafts` in `App.tsx` / `useCritique.ts` | This is a local mirror that can lag until sync runs. |
| Critique result | Critique response payload held in renderer state | Advisory only; it does not mutate the draft. |
| Rewrite result | Rewrite response payload held in renderer state | This is the saved revision preview before sync. |
| Synced draft | Renderer view after `applyRewrite()` | This should match the persisted draft text. |
| Snapshot | Snapshot files and manifest records under the project snapshot history | Durable recovery/audit evidence. |
| Exported text | Export artifact on disk | Output artifact, not the canonical draft source. |

Rules:

- critique may advise, but it must not mutate the draft
- rewrite may persist, but it must not be treated as merely speculative
- sync must reconcile the local view, not re-run rewrite
- snapshot must remain a recovery/audit step, not a hidden rewrite path
- export must remain a separate output action, not a writeback contract

## Proposed Pass Roadmap

Phase 12 remains linear and expandable.

### Pass 0 - Phase 12 planning / scope review

- Confirm the editorial workflow scope.
- Confirm the deferments.
- Confirm the contract vocabulary.
- Confirm what the runtime already does.

### Pass 1 - Editorial workflow contract docs

- Write the normative critique/rewrite authority contract.
- Cross-link the workflow spine, provenance, and snapshot/recovery expectations.
- Define the user-visible terminology for saved, synced, and discarded states.
- Canonicalize the contract layer in `docs/specs/editorial_workflow_contract.md`.

### Pass 2 - Current critique/rewrite state audit

- Audit the runtime entry points and state transitions.
- Document what is local, what is persisted, and what is only advisory.
- Identify copy or labels that still blur the contract.
- Completed as a docs-only audit in `docs/phases/phase12_runtime_audit.md`.

### Pass 3 - Rewrite / sync state labels

- Standardize labels for saved rewrite, local sync, discard, and conflict recovery.
- Make the renderer state transitions easier to read.
- Completed as a docs-only label plan in `docs/phases/phase12_runtime_audit.md`.

### Pass 4 - Revision comparison surface plan

- Define how original versus revised text should be compared.
- Keep this as a display-and-review surface, not a new mutation system.
- Completed as a docs-only surface plan in `docs/phases/phase12_runtime_audit.md`.

### Pass 5 - Provenance metadata surface plan

- Make route origin, provider origin, and budget delta easier to see.
- Keep provenance descriptive, not executable.
- Completed as a docs-only provenance plan in `docs/phases/phase12_runtime_audit.md`.

### Pass 6 - Snapshot / recovery relationship polish

- Clarify where snapshot history fits relative to rewrite persistence.
- Make recovery language explicit and non-overlapping with rewrite language.

### Pass 7 - Critique entry and result clarity

- Tighten the entry conditions and result framing for critique.
- Make the review step feel like advice, not mutation.

### Pass 8 - Rewrite result clarity

- Tighten the saved rewrite presentation.
- Make sync, discard, and conflict outcomes easy to distinguish.

### Pass 9 - Tests for mutation / sync / provenance expectations

- Add or strengthen tests for the truth model.
- Cover saved-vs-synced behavior, provenance visibility, and conflict wording.

### Pass 10 - Cleanup / closure review

- Remove any stale contract language.
- Verify the roadmap, tracker, and runtime truth still match.
- Confirm Phase 12 is ready to close.

## Deferred Ledger

Phase 12 defers the following on purpose.

| Item | Reason deferred | Likely future phase | Unblock condition | Current risk | Blocks Phase 12 | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Persisted Story Units | Would turn editorial observations into a new data model and storage contract | Phase 13+ | A distinct storage design and migration plan | High | No | Deferred |
| Memory lifecycle | Would introduce state retention beyond the editorial workflow | Phase 13+ | A memory authority spec and retrieval rules | High | No | Deferred |
| Embeddings | Would add retrieval and similarity machinery unrelated to editorial truthfulness | Phase 13+ | A retrieval-focused data contract | High | No | Deferred |
| Relationship graph | Would shift the phase into relationship modeling instead of revision clarity | Phase 13+ | A graph schema and stable use case | High | No | Deferred |
| Constellation graph | Would expand into narrative topology rather than workflow truth | Phase 14+ | A separate product decision | High | No | Deferred |
| Emotional pulse graph | Would introduce analytics-style inference instead of workflow transparency | Phase 14+ | A validated editorial need | High | No | Deferred |
| Local LLM orchestration | Would blur runtime authority and provider boundaries | Phase 14+ | A dedicated orchestration design | High | No | Deferred |
| Command execution middleware | Would turn metadata into action routing | Phase 14+ | A command-policy contract and approval path | High | No | Deferred |
| Autonomous rewriting | Would remove the user's explicit control over revision | Phase 15+ | An explicit user-approved automation model | High | No | Deferred |
| Automatic AI restructuring | Would reframe revision as hidden transformation | Phase 15+ | A separate rewrite-policy decision | High | No | Deferred |
| Multi-outline branching | Would expand scope into alternate narrative line management | Phase 16+ | A branching model and persistence story | Medium | No | Deferred |
| Plugin system | Would add an orthogonal extension surface unrelated to editorial clarity | Phase 16+ | A plugin policy and execution boundary | Medium | No | Deferred |
| Rich diff UI | Requires renderer state and UI implementation beyond the current planning lane | Phase 12 implementation or Phase 13 | Saved-vs-synced copy and tests are stable | Medium | No | Deferred |
| Persisted revision history | Requires new storage authority and likely project format decisions | Phase 13+ | Revision id and storage contract approved | High | No | Deferred |
| Persistent provenance ledger | Requires durable metadata storage and retention rules | Phase 13+ | Provenance schema and storage owner approved | High | No | Deferred |
| Snapshot-linked revision provenance | Requires linking rewrite events to later snapshot ids | Phase 13+ | Snapshot/revision relationship design approved | Medium | No | Deferred |
| Export-linked revision provenance | Requires export metadata relationship to revision state | Phase 13+ | Export artifact metadata contract approved | Medium | No | Deferred |
| Per-hunk accept/reject | Requires new mutation workflow and comparison UI | Phase 14+ | Rich diff UI and mutation policy approved | High | No | Deferred |

## Closure Definition

Phase 12 is done when:

- critique/rewrite workflow behavior is truthful in the UI and docs
- mutation, reconciliation, and discard states are clearly named
- provenance expectations are documented and reflected in the surface copy
- snapshot and recovery are clearly separated from rewrite persistence
- the user can understand what changed and what did not
- tests cover the key editorial trust contracts
- no future-phase systems leak into the editorial workflow layer
- docs, tracker, and runtime truth match
- full app tests, lint, and production build pass before closure

## Risks

### Highest risk implementation area

The highest risk area is the saved-vs-synced boundary for rewrites. It is easy to accidentally make the UI imply that a rewrite is only a proposal when the backend has already persisted it.

### Likely test gaps

- stale assertions around rewrite copy
- missing coverage for the sync step after a successful rewrite
- missing coverage for provenance visibility after a conflict or fallback
- missing coverage for snapshot language that implies mutation instead of recovery

### Dangerous misleading UI copy

- any copy that calls a saved rewrite "pending" or "candidate" after persistence
- any copy that makes sync sound like the save step
- any copy that makes critique sound like it has already changed the manuscript
- any copy that makes snapshots sound like the rewrite mechanism

### Areas that may tempt redesign

- the critique modal comparison block
- the rewrite result footer and action language
- the snapshot/recovery summary copy
- provenance display formatting

### Explicit approval required before implementation

Require explicit approval before any change that:

- changes whether rewrite persists immediately
- auto-applies rewrite output without user action
- stores revision state outside the existing draft file and renderer mirror
- introduces new provider orchestration or local LLM routing
- introduces command execution behavior from registry metadata
- adds memory, graph, embedding, or plugin behavior
