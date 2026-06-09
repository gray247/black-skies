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

## 3. User Problem Solved

The writer needs access to supporting files and assets without losing focus or blurring asset state with narrative authority.

## 4. What The System Does

- organize assets,
- support file browsing,
- expose bounded asset references near writing.

## 5. What The System Does Not Do

- own narrative truth,
- force asset workflows before writing,
- leak protected files by default.

## 6. User-Facing Behavior

Visible behavior should emphasize lightweight access and clear file context.

## 7. Hidden/Background Behavior

Background indexing or preview prep may exist, but remains operational.

## 8. What Appears First

- relevant files,
- clear asset categories,
- current-project context.

## 9. What Is Summonable

- previews,
- metadata,
- related links,
- heavier file operations.

## 10. What Is Hidden Until Needed

- dense metadata,
- archive views,
- advanced file operations.

## 11. Inputs

- project files,
- author asset organization,
- file metadata.

## 12. Outputs

- asset views,
- file links,
- project-context references.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`

## 14. What Gets Stored

- asset metadata,
- organization preferences,
- preview references.

## 15. What Remains Temporary

- transient previews,
- temporary filters,
- current selections.

## 16. Relationship To Narrative Insertion / Assertion

Files may support narrative work but do not replace narrative truth.

## 17. Relationship To Story Units

Assets may be linked to Story Units only as optional support context.

## 18. Relationship To Prose / Scene Projection

Projection may reference assets without turning assets into story authority.

## 19. Relationship To Writing Surface

The asset pane may support current-text work without crowding the manuscript by default.

## 20. Relationship To Command Center Surface

Heavier asset review or cleanup may belong in the Command Center.

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
- no writing gate through asset tooling.

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

### Fatal Questions

- Fatal: what rules prevent File Manager / Asset Pane from exposing hidden, deleted, masked, excluded, or AI-protected files through previews, attachments, asset links, or file operations?

### Critical Questions

- Critical: what file or asset states are visible by default versus protected, archive-only, summonable, or blocked entirely?
- Critical: which file operations may happen here at all versus requiring explicit confirmation or future import/export review, especially attach, move, rename, delete, reveal, repair, or external-open actions?
- Critical: how should the system behave when project folders are on external drives, cloud-synced locations, protected folders, low-space environments, or paths with dangerous permissions or disconnect risks?

### Major Questions

- Major: how much asset context belongs near drafting versus deeper asset browsing and cleanup in support surfaces?
- Jason decision candidate: should early file support focus on browse-and-reference only, or may it include bounded attach/link workflows from day one?

### Minor Questions

- Minor: should `File Manager` and `Asset Pane` remain paired, or should one become the clearer user-facing concept?

### Answered / Superseded Questions

- Direct writing must remain valid.
- File and asset containers do not own narrative truth.
- Questions better owned elsewhere: exact import, export, sync, and Google Docs movement rules belong to the future `Import / Export / Google Docs` dossier.

### Deferred Questions

- Deferred: exact media-type support, preview rules, and attachment metadata policy.

## 34. Acceptance Criteria

This dossier is acceptable only if file support remains bounded, safe, and non-authoritative.
