# File Manager / Asset Pane

## 1. Status Header

- Dossier name: `File Manager / Asset Pane`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Binder / Project Library`, `Writing Surface`
- Feeds into: `Writing Surface`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define file and asset support for project materials without letting asset containers become narrative truth owners.
This dossier inherits asset, protection, provenance, and degraded-mode boundaries from `truth_and_state_ownership_matrix.md`, `surface_to_owner_action_handoff_contract.md`, `ai_lifecycle_and_approval_matrix.md`, `protected_content_permission_matrix.md`, `document_interchange_source_destination_contract.md`, `provenance_state_model.md`, `degraded_mode_execution_contract.md`, and `snapshot_protected_recovery_contract.md`.

## 3. User Problem Solved

The writer needs access to supporting files and assets without losing focus or blurring asset state with narrative authority.

## 4. What The System Does

- own file and asset identity, availability posture, metadata, preview references, linked-versus-local-copy distinction, missing-file and repair posture, and explicit detach or replacement actions,
- organize assets,
- support file browsing,
- expose bounded asset references near writing,
- keep missing or unavailable files visible as repairable placeholders by default.

## 5. What The System Does Not Do

- own narrative truth,
- force asset workflows before writing,
- leak protected files by default,
- decide manuscript, lore, note, signal, memory, or imported-source truth,
- replace `Import Export Document Interchange` as import or transfer authority.

## 6. User-Facing Behavior

Visible behavior should emphasize lightweight access, clear file context, visible distinction between project artifacts and external files, and inspectable source status.

## 7. Hidden/Background Behavior

Background indexing or preview prep may exist, but remains operational.

## 8. What Appears First

- relevant files,
- clear asset categories,
- current-project context,
- visible linked-versus-local-copy posture where relevant,
- unavailable sources as repairable placeholders rather than silent disappearance.

## 9. What Is Summonable

- previews,
- metadata,
- related links,
- heavier file operations,
- affected references,
- replacement or detach posture,
- last-known source context for unavailable items.

## 10. What Is Hidden Until Needed

- dense metadata,
- archive views,
- advanced file operations.

## 11. Inputs

- project files,
- author asset organization,
- file metadata,
- interchange-created asset placements,
- availability and repair state.

## 12. Outputs

- asset views,
- file links,
- project-context references,
- file-status references such as linked, local copy, unavailable, protected, or repair-needed.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`

## 14. What Gets Stored

- asset metadata,
- organization preferences,
- preview references,
- file and asset identity,
- availability posture,
- linked-versus-local-copy distinction,
- missing-file and repair posture.

## 15. What Remains Temporary

- transient previews,
- temporary filters,
- current selections,
- ephemeral preview caches or availability probes that do not redefine durable file state.

## 16. Relationship To Narrative Insertion / Assertion

Files may support narrative work but do not replace narrative truth.
Attaching, previewing, indexing, or placing a file does not make it manuscript truth.

## 17. Relationship To Story Units

Assets may be linked to Story Units only as optional support context.

## 18. Relationship To Prose / Scene Projection

Projection may reference assets without turning assets into story authority.

## 19. Relationship To Writing Surface

The asset pane may support current-text work without crowding the manuscript by default.

## 20. Relationship To Command Center Surface

Heavier asset review or cleanup may belong in the Command Center.

## 20A. Relationship To Binder / Project Library

Binder may place file references in project organization, but it does not own file identity, file availability, or repair posture.

## 20B. Relationship To Import / Export Document Interchange

`Import Export Document Interchange` owns import classification and staged intake.
`File Manager / Asset Pane` owns durable file and asset metadata after asset placement is explicitly chosen.

## 20C. Relationship To Project Index / Search / Retrieval

Search may index permitted asset metadata and references, but it does not own file identity or availability state.

## 21. GUI Placement Principles

Keep asset access lightweight and avoid turning it into a dashboard.

## 22. Local LLM Role

Not required for core asset behavior.

## 23. Paid API Role

Not required for core asset behavior.

## 24. Model Routing Notes And Cost / Budget Impact

Any later asset-analysis AI use remains optional and governed elsewhere.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Asset previews and file references must respect masking and outbound rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Private, hidden, or excluded files must stay protected by default.

## 27. Testing Requirements

Prove asset browsing does not leak protected material or block writing.

## 28. Governance Rules And Risks

- no file-container authority drift,
- no protected-file leakage,
- no writing gate through asset tooling,
- a missing file is not a deleted file,
- losing or detaching a source file must not silently delete or decanonize manuscript, notes, lore, or other project artifacts derived from it,
- protected, masked, local-only, private, or AI-excluded material must not leak through previews, metadata summaries, repair placeholders, or search-facing asset summaries.

## 29. Failure Modes

If asset support fails, writing should continue and files should remain safely local.

## 30. v1 Boundary

Basic asset browsing and reference support.

## 31. v2 Boundary

Richer previews, grouping, and cross-links.

## 32. Future-Only Boundary

Deep media analysis or automated asset orchestration.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from project-file, folder-location, import, attachment, external-drive, and protected-folder questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `1 Fatal`, `3 Critical`, `2 Major`
- remaining blocker summary: `0 Fatal`, `3 Critical`, `2 Major`

### Fatal Questions

- None. Protected-content behavior for files and assets is governed by the protection matrix, provenance rules, and handoff contract.

### Critical Questions

- Critical: what file or asset states are visible by default versus protected, archive-only, summonable, or blocked entirely?
- Critical: how much of the linked-versus-local-copy distinction and unavailable-source posture should remain constantly visible versus inspectable on demand?
- Critical: how should the system behave when project folders are on external drives, cloud-synced locations, protected folders, low-space environments, or paths with dangerous permissions or disconnect risks?

### Major Questions

- Major: how much asset context belongs near drafting versus deeper asset browsing and cleanup in support surfaces?
- Major: what exact repair and replacement language is most understandable when an external source is unavailable but the project reference remains?
- Jason decision candidate: should early file support focus on browse-and-reference only, or may it include bounded attach/link workflows from day one?

### Minor Questions

- Minor: should `File Manager` and `Asset Pane` remain paired, or should one become the clearer user-facing concept?

### Answered / Superseded Questions

- Direct writing must remain valid.
- File and asset containers do not own narrative truth.
- Protected, local-only, or AI-excluded assets must not silently feed AI packages, diagnostics, export, memory, or search summaries.
- Browse-only is the safest early scope unless attach/link is explicitly bounded.
- Missing or unavailable files remain visible as repairable placeholders by default.
- A missing file is not a deleted file.
- Removing or losing a source file must not silently delete or decanonize derived project artifacts.
- Questions better owned elsewhere: exact import, export, sync, and Google Docs movement rules belong to the future `Import / Export / Google Docs` dossier.

### Deferred Questions

- Deferred: exact media-type support, preview rules, and attachment metadata policy.

## 34. Acceptance Criteria

This dossier is acceptable only if file support remains bounded, safe, and non-authoritative.
