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

## 20E. Indexed Object Model

Project Index / Search / Retrieval may index references to permitted
project material, including:

- `Narrative Assertions`,
- `Story Units` and `Outline` items,
- scene or chapter projections,
- `Author Intent / Story Setup`,
- `Character Cards`,
- `Lore Cards`,
- Binder labels and placements,
- File Manager metadata,
- permitted Notes and Signals,
- permitted asset metadata,
- explicitly scoped import staging.

Indexing does not copy truth into a new owner.
Each indexed item remains controlled by its source owner.
Search may preserve source labels, source anchors, scopes, freshness
state, and permission state, but it must not become a second manuscript,
card, Binder, File Manager, import, note, signal, or memory store.

Search should distinguish:

- `content indexing`, where searchable current text or accepted object
  content is allowed by the source owner and protection state,
- `metadata-only indexing`, where only labels, source type, owner,
  location, status, or safe summaries may be searched,
- `excluded or restricted indexing`, where the item is absent from
  ordinary search or represented only by bounded restricted metadata,
- archived, missing, deleted, or unavailable sources, which are excluded
  from default current search unless the author explicitly opens an
  allowed scope.

Files and assets are not indexed as truth.
For file-like sources, Project Index may index permitted metadata or
approved text representations, but file identity, linked-versus-managed
posture, availability, and repair state remain owned by
`File Manager / Asset Pane`.

## 20F. Index Lifecycle

Index state should preserve honest lifecycle labels such as:

- `indexed`,
- `refreshed`,
- `stale`,
- `partial`,
- `rebuilding`,
- `unavailable`,
- `failed`,
- `restricted`,
- `archived`,
- `restored`,
- `removed`.

`indexed` means the source is represented in the current index for an
allowed scope.
`refreshed` means the index has been updated against the relevant source
revision or owner state.
`stale` means the index may no longer match current source state.
`partial` means only some sources, fields, or scopes are represented.
`rebuilding` means results may be incomplete while the index owner
refreshes allowed references.
`unavailable` means the source or source owner cannot currently be
reached.
`failed` means an indexing or query operation did not complete.
`restricted` means protection or permission state prevents ordinary
indexing or display.
`archived`, `restored`, and `removed` reflect owner-reported source
posture rather than search-owned truth.

Source-revision mismatch should mark affected results or scopes stale
instead of pretending completeness.
Last-known results may remain visible only when clearly labeled as
last-known, stale, unavailable, or tombstone references.
Index failure, partial indexing, rebuilding, unavailable external
sources, AI failure, or Memory Lab failure must not block safe local
writing or manual navigation.

## 20G. Search Posture And Default Scope

The initial product posture is:

- exact-text retrieval,
- metadata retrieval,
- structural retrieval.

Semantic retrieval remains optional later support.
It is not required for this construction pass and no ranking,
embedding, fuzzy-match, vector, or semantic algorithm is defined here.

Default unified search includes current permitted project material with
clear source labels and owner labels.
Default unified search excludes unless explicitly scoped and permitted:

- deleted sources,
- archived sources,
- snapshots or recovery history,
- unclassified import staging,
- protected or excluded material unavailable to the current operation.

Query scope and filters may narrow or widen source classes, owners,
status labels, Binder contexts, file metadata classes, planning
material, notes, signals, cards, assets, imports, or current manuscript
material, but those filters do not alter source ownership.

## 20H. Search Result Identity

A search result is a reference record, not the source object.
Where relevant, a result should carry:

- result identity,
- source identity,
- source owner,
- source type,
- source anchor,
- matched field or content class,
- query scope,
- freshness,
- protection state,
- duplicate or alias posture,
- advisory ranking,
- availability state.

Result identity must not replace source identity.
Multiple results may point to the same source object, especially when a
source appears in multiple Binder placements, aliases, card sections,
source anchors, or file references.
Duplicate or alias posture should be visible enough to avoid implying
duplicate truth.
Result ranking is advisory presentation only; it is not source
importance, truth priority, canon status, or owner authority.

## 20I. Snippets And Previews

Snippets and previews are bounded, source-labeled representations.
They must:

- respect protection and masks,
- identify stale or unavailable state,
- avoid exposing restricted filenames or metadata,
- distinguish last-known content from current content,
- never imply that a missing source is still authoritative.

A snippet may show current permitted content, safe metadata, approved
summary, masked representation, restriction reason, or no preview,
depending on source owner and protection posture.
Protected raw content must not leak through highlighted text, result
titles, filenames, thumbnails, sort labels, summaries, previews, or
Companion context.

## 20J. Tombstones, Missing Sources, And Deleted Sources

Search uses a tombstone-reference model for missing, deleted, detached,
or unavailable sources.
Ordinary current search excludes missing or deleted sources by default.
Existing results, saved results, pinned results, or history references
may become labeled tombstones when their source is no longer available
as ordinary current material.

Tombstones may preserve:

- last-known source identity,
- source owner,
- source type,
- source anchor where safe,
- provenance or source-lineage reference,
- affected search references,
- protection state,
- missing, deleted, unavailable, detached, or restricted posture.

A dedicated `Missing and Recoverable` scope may expose allowed
tombstones for review.
Actions from tombstones route to the owning system, such as File Manager
repair, restore, relink, replace, or reference removal.
For non-file product objects, actions route to the relevant source owner
or recovery owner.

Search must not silently reconnect to a similar file, silently recreate
deleted source state, invent replacement content, or treat a tombstone as
current truth.

## 20K. Retrieval Versus Memory Lab

Retrieval is query-driven and source-linked.
`Memory Lab` is durable, governed recall.
The same source may appear in search results and memory references, but
the result classes must remain distinct.

Viewing, opening, pinning, or repeatedly retrieving a result does not
create durable memory.
Saving a result to Memory Lab requires an explicit Memory Lab workflow
and the appropriate owner-governed approval.
Any saved memory must preserve provenance, source labels, memory type,
and protection labels.
Source deletion, revision, owner change, or protection changes may stale,
restrict, or invalidate a memory reference, but Search does not repair
or delete durable memory on its own.

## 20L. Companion And AI Boundary

`Companion` may search, summarize permitted evidence, show source
labels, explain result state, and route the author to source material.
Companion does not own search results, source truth, source files, index
state, query state, or durable memory.

Companion summaries must preserve source labels and uncertainty.
They must not reveal protected raw content through summaries, previews,
or explanation.
Outbound AI use of retrieved material must obey masks, approvals,
routing, spend, local-only, never-send, and explicit-content
restrictions.

Search failure, AI failure, routing failure, and Memory Lab failure are
distinct states.
Search must not imply that an AI or Memory Lab failure means local
indexed retrieval failed, and AI or Memory Lab must not imply that search
results are canon because they were retrieved.

## 20M. Handoffs And Return

Search handoffs should preserve:

- visible surface,
- query scope,
- result identity,
- source identity,
- source owner,
- source type,
- source anchor,
- freshness and availability state,
- protection state,
- requested action,
- return-to-prior-location anchor where available.

Search may hand off to:

- open in the source owner,
- open in `Writing Surface`,
- inspect in `Command Center Surface`,
- open File Manager repair for file or asset source posture,
- save through an explicit Memory Lab workflow,
- return to the prior location.

Opening a result, selecting its source, changing the active surface, and
moving keyboard focus are distinct actions.
Search must not steal focus across surfaces automatically.
Writing Surface quick retrieval should preserve the current writing
location and return path.
Command Center inspection may show deeper result, provenance, conflict,
or stale-source detail without becoming the source owner.

If a source anchor is moved, stale, missing, or restricted, Search should
label that state and route to the owner or repair path rather than
guessing a replacement anchor.

## 20N. Search History And Saved Retrieval State

Search history, saved queries, filters, scoped searches, and pinned
results may be durable convenience state owned by Project Index / Search
/ Retrieval.
They do not become truth owners, memory records, Notes, Signals, source
objects, Binder placements, or File Manager records.

Saved retrieval state should preserve enough source labels, freshness
state, scope, and protection posture to avoid misleading reuse.
When a source changes, is deleted, becomes protected, moves, or becomes
unavailable, saved queries and pinned results should show stale,
restricted, removed, archived, unavailable, or tombstone posture instead
of silently reconstructing the old result.

History depth, pruning, and final presentation limits remain future
product-detail work, not implementation doctrine in this pass.

## 21. GUI Placement Principles

Keep retrieval accessible and uncluttered.
Clear result type and source come first.
Deeper evidence, history, and metadata should appear through drill-down.
Narrowing should be easy without requiring users to understand the full
project model.
Final search interface remains deferred to Stage 9.

## 22. Local LLM Role

Local AI is not required for the initial exact-text, metadata, and
structural retrieval posture.
Local AI may later help with semantic retrieval summaries only when
routing, protection, and approval rules allow it.

## 23. Paid API Role

Paid retrieval help remains optional, approval-governed, and outside the
initial construction posture.

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
If indexing is stale, partial, rebuilding, unavailable, restricted, or
failed, the system must say so honestly.
Search must not pretend completeness, silently widen scope, leak
protected material, or invent replacement source content.
Manual Binder navigation, owner-surface opening, File Manager inspection,
and direct writing remain available where their owners allow them.

## 30. v1 Boundary

Basic search, retrieval, and source-linked results.

First release uses project-wide search across the current local project,
including manuscript, outline and planning material, `Character Cards`,
`Lore Cards`, `Notes`, imported source text, and approved memory
references.

First release requires strong source-type labels, source-owner
visibility, easy narrowing and filtering, current-versus-historical
distinction, stale or unavailable source visibility, and source-linked
results.

Retrieval is not memory. Retrieval is not canon. Ranking is not evidence
quality. Project-wide search does not own project information. Approved
memory references remain memory-linked references rather than source
evidence.

Generated candidates, rejected material, deleted material, archives,
historical states, and superseded material require explicit filters or
scopes and must not silently mix into ordinary current results.

First release should not require semantic search across every possible
artifact, automatic canon ranking, universal relevance scoring,
cross-project search, silent search across deleted or private material,
or automatic conversion of search results into memory or truth.

## 31. v2 Boundary

Richer filters, semantic retrieval, and cross-system links.

Mature ceiling may later include semantic retrieval, richer source
filters, evidence bundles, conflict discovery, comparison across source
classes, and bounded historical search.

Later expansion requires repeated author demand, Stage 5 external
challenge findings, Stage 6 workflow proof, or demonstrated retrieval
failures that bounded filters cannot solve.

## 32. Future-Only Boundary

Fully automated deep-recall orchestration.

Explicit exclusions:

- no memory ownership,
- no canon ownership,
- no universal information owner,
- no hidden mixing of current and historical state,
- no ranking treated as confidence or truth.

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
