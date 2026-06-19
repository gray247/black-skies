# Project Index / Search / Retrieval

## 1. Status Header

- Dossier name: `Project Index / Search / Retrieval`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Binder / Project Library`, `Writing Surface`, `Memory Lab`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Companion`
- Runtime authority: `future`
- Authority level: `derived`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define project search and retrieval as a bounded find-and-reference system that helps the author locate material without turning retrieval results into truth authority.
This dossier inherits index, protection, provenance, and degraded-mode boundaries from `truth_and_state_ownership_matrix.md`, `surface_to_owner_action_handoff_contract.md`, `ai_lifecycle_and_approval_matrix.md`, `protected_content_permission_matrix.md`, `provenance_state_model.md`, `degraded_mode_execution_contract.md`, and `snapshot_protected_recovery_contract.md`.

## 3. User Problem Solved

The writer needs fast access to relevant project material without relying on memory alone or confusing retrieved context with accepted canon.

## 4. What The System Does

- index project material,
- own local index state, retrieval references, source labels, search scope and filters, and index freshness or stale-state posture,
- support unified project search and scoped retrieval,
- expose relevant references and links.

## 5. What The System Does Not Do

- own truth,
- auto-promote found material,
- leak hidden or excluded content by default,
- become `Memory Lab`,
- turn retrieval into governed recall,
- canonize search hits because they are found.

## 6. User-Facing Behavior

Visible behavior should emphasize unified project search by default, clear source visibility, grouped or labeled result types, bounded context, and easy widening from local scope to broader project scope.

## 7. Hidden/Background Behavior

Background indexing may exist, but retrieved results remain references, not truth.

## 8. What Appears First

- relevant results,
- source labels,
- clear project location,
- source type and owning system,
- visible freshness or stale-index posture when completeness is uncertain.

## 9. What Is Summonable

- broader context,
- related references,
- deeper recall links,
- search filters,
- explicit scopes such as manuscript, planning, notes, lore, characters, assets, and imports.

## 10. What Is Hidden Until Needed

- deep provenance,
- archive-heavy results,
- AI inference layers,
- retired-card and archived-card results unless explicitly requested,
- deleted or archived material,
- snapshots and recovery history,
- unavailable external-file contents,
- temporary analyzer history,
- unclassified import staging content unless explicitly requested and permitted.

## 11. Inputs

- project material,
- author metadata,
- accepted facts,
- approved recall references,
- Binder labels and placement context,
- permitted asset metadata,
- current planning material and chapter or scene metadata where owned elsewhere.

## 12. Outputs

- search results,
- retrieval snippets,
- source-linked references,
- grouped or labeled unified-project results,
- freshness cues when index completeness is uncertain.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Companion`

## 14. What Gets Stored

- index data,
- search preferences,
- source labels,
- retrieval references,
- scope and filter state,
- freshness or stale-state metadata.

## 15. What Remains Temporary

- current query state,
- transient ranking,
- temporary result sets,
- per-launch local scopes that may widen to project search on request.

## 16. Relationship To Narrative Insertion / Assertion

Search may find truth-bearing material, but retrieval does not create truth.
Retrieval never promotes material into manuscript, lore, project truth, notes, or memory automatically.

## 17. Relationship To Story Units

Story Units may be searchable, but remain optional.

## 18. Relationship To Prose / Scene Projection

Search may span projected material while keeping projected views distinct from accepted text.

## 19. Relationship To Writing Surface

The Writing Surface may use quick retrieval without becoming a search dashboard.
Search launched from a specific system may begin scoped there, with an option to widen to the project.

## 20. Relationship To Command Center Surface

Broader retrieval management and conflict review may belong in the Command Center.

## 20A. Relationship To Binder / Project Library

Binder supplies browse context, labels, and placements, but Project Index owns search results and retrieval references.

## 20B. Relationship To File Manager / Asset Pane

Project Index may index permitted asset metadata and references, but file identity, availability, linked-versus-local distinction, and repair posture remain owned by `File Manager / Asset Pane`.

## 20C. Relationship To Memory Lab

`Project Index / Search / Retrieval` retrieves source-linked local project material.
`Memory Lab` performs governed recall of approved memory.
They may point to the same underlying source without collapsing into one owner or one result class.

## 20D. Relationship To Import / Export Document Interchange

Imported material may appear immediately in a distinct `Imports / Staging` search scope or result class where permitted, but unclassified staging content is excluded from default unified search unless explicitly requested.

## 21. GUI Placement Principles

Keep retrieval accessible and uncluttered.

## 22. Local LLM Role

Local AI may later help with semantic retrieval summaries only.

## 23. Paid API Role

Paid retrieval help remains optional and approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI-assisted retrieval must respect routing, privacy, and spend rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Search and retrieval must respect masking and local-only restrictions.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Hidden, deleted, masked, or excluded content must stay protected by default.

## 27. Testing Requirements

Prove retrieval respects source, visibility, and protection boundaries.

## 28. Governance Rules And Risks

- no retrieval-as-canon,
- no protected-content leakage,
- no hidden authority drift,
- default unified search covers current local project artifacts where permitted, not snapshots, deleted history, temporary analyzer history, or unclassified staging by default,
- search snippets, previews, and labels must preserve source type and owning system,
- retired cards should be excluded from ordinary current search by default and available through explicit filtering,
- protected, hidden, unrevealed, masked, or AI-excluded card material must not leak through snippets, labels, or previews,
- degraded or stale indexing must fail honestly rather than pretending completeness.

## 29. Failure Modes

If retrieval fails, direct writing and manual navigation remain available.

## 30. v1 Boundary

Basic search, retrieval, and source-linked results.

## 31. v2 Boundary

Richer filters, semantic retrieval, and cross-system links.

## 32. Future-Only Boundary

Fully automated deep-recall orchestration.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from search, retrieval, source-label, and imported-project discovery questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `3 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: what exact default unified-search breadth is safest while still useful, especially around planning material, Binder labels, approved project-memory references, and asset metadata?
- Critical: how should search and retrieval distinguish direct evidence, references, governed recall, and advisory inference so search results do not read like canon?
- Critical: what protection rules block hidden, deleted, masked, excluded, or AI-protected material from leaking through snippets, previews, ranking, or `Companion` retrieval context?

### Major Questions

- Major: how should search coordinate with `Memory Lab` without turning governed recall into truth or making retrieval a shadow Memory Lab?
- Major: how much context should quick retrieval show in `Writing Surface` versus deeper search, conflict review, or provenance-heavy views in support surfaces?
- Jason decision candidate: should first useful retrieval focus on exact and bounded structural search first, or also include semantic retrieval and summary views early?

### Minor Questions

- Minor: what naming best distinguishes index, search, retrieval, snippet, result, and recall-linked result views?

### Answered / Superseded Questions

- Retrieved material is not automatic canon.
- Search and retrieval results are evidence or references, not truth.
- Governed recall remains `Memory Lab` territory, not search authority.
- Degraded indexing must not fake completeness.
- Search snippets must not leak protected content.
- Unified project search is the general default, with clear source labeling and scoped narrowing or widening.
- Default unified search excludes snapshots, recovery history, deleted or archived material, temporary analyzer history, unavailable external-file contents, and unclassified import staging unless explicitly requested and permitted.
- Questions better owned elsewhere: exact `Memory Lab` retention and recall policy belongs primarily to `memory_lab.md`.

### Deferred Questions

- Deferred: exact ranking, fuzzy-match, semantic-match, and snippet policy.

## 34. Acceptance Criteria

This dossier is acceptable only if retrieval stays bounded, source-labeled, and non-authoritative.
