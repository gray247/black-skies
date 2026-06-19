# Binder / Project Library

## 1. Status Header

- Dossier name: `Binder / Project Library`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Writing Surface`, `Outline`, `Story Unit`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Project Index / Search / Retrieval`
- Runtime authority: `future`
- Authority level: `derived`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define the Binder / Project Library as the organizational home for project contents without making the binder itself the owner of narrative truth.
This dossier inherits library, protection, provenance, and degraded-mode boundaries from `truth_and_state_ownership_matrix.md`, `surface_to_owner_action_handoff_contract.md`, `ai_lifecycle_and_approval_matrix.md`, `protected_content_permission_matrix.md`, `document_interchange_source_destination_contract.md`, `provenance_state_model.md`, and `degraded_mode_execution_contract.md`.

## 3. User Problem Solved

The writer needs to browse and organize project contents without forcing all truth, structure, or workflow meaning into one container.

## 4. What The System Does

- organize project contents,
- own project organization links, author-created collections, stable system-area navigation, hierarchy and placement metadata, and navigation preferences,
- expose navigation and grouping views,
- support access to writing and support materials,
- allow the same underlying artifact to appear in more than one Binder location by reference,
- expose a distinct navigation area for staged imports without owning staged content.

## 5. What The System Does Not Do

- own manuscript truth,
- replace narrative foundations,
- force one mandatory project shape,
- own `Narrative Assertions`,
- own `Story Units`,
- own `Feedback Notes`, `Signals`, `Lore`, `Character` truth, files, assets, search results, memory, or external-source availability,
- become a filesystem,
- become a universal storage owner,
- become a master dashboard,
- become a second `Outline`.

## 6. User-Facing Behavior

Visible behavior should emphasize clarity, retrieval, light organization, recognizable system areas, and author collections.

## 7. Hidden/Background Behavior

Background indexing or sort preparation may exist, but it does not create truth.

## 8. What Appears First

- current project contents,
- stable system areas such as `Story`, `Planning`, `World`, `Editorial`, `Research and Assets`, `Imports / Staging`, and `Author Collections` as conceptual navigation lanes,
- card references that may appear in more than one collection by reference without changing card ownership,
- clear navigation,
- current focus location when relevant.

## 9. What Is Summonable

- alternate groupings,
- history views,
- support links,
- multi-placement references to the same underlying artifact.

## 10. What Is Hidden Until Needed

- deep metadata,
- archive-heavy views,
- dense support diagnostics.

## 11. Inputs

- project files,
- narrative references,
- structure references,
- author organization choices,
- imported staging references exposed by `Import Export Document Interchange`,
- file and asset references exposed by `File Manager / Asset Pane`.

## 12. Outputs

- project-navigation views,
- grouped references,
- retrieval entry points,
- reference placements that point back to the owning artifact rather than replacing it.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Project Index / Search / Retrieval`

## 14. What Gets Stored

- grouping state,
- placement metadata,
- navigation preferences,
- project organization metadata,
- stable system-area navigation metadata,
- author-created collection membership by reference.

## 15. What Remains Temporary

- transient filters,
- current selection state,
- temporary sort views.

## 16. Relationship To Narrative Insertion / Assertion

The binder may point to accepted truth sources, but it does not replace them.
Removing a Binder placement removes only that organizational reference.
Deleting or mutating the underlying artifact still requires action through its owning system.

## 17. Relationship To Story Units

Story Unit links may appear, but Story Units remain optional.
Binder placement does not create, delete, or own Story Unit identity.

## 18. Relationship To Prose / Scene Projection

Projection views may appear inside binder navigation without becoming authority.

## 19. Relationship To Writing Surface

The binder supports navigation into writing while preserving direct writing.

## 20. Relationship To Command Center Surface

The Command Center may expose higher-level project status without replacing binder navigation.
Binder must not absorb Command Center review, routing, or dashboard posture.

## 20A. Relationship To Import / Export Document Interchange

`Import Export Document Interchange` owns staging and destination classification for imported material.
Binder may expose `Imports / Staging` as a navigation area, but staged material remains owned by interchange until explicit handoff.

## 20B. Relationship To File Manager / Asset Pane

Binder may place references to files or assets in project organization, but it does not own file identity, availability, linked-versus-local distinction, or repair posture.

## 20C. Relationship To Project Index / Search / Retrieval

Binder may supply browse context and labels to search, but it does not own search results or retrieval ranking.

## 21. GUI Placement Principles

Keep binder navigation useful without turning it into a cluttered control center.

## 22. Local LLM Role

Local models are not required for core binder behavior.

## 23. Paid API Role

Paid API is not required for core binder behavior.

## 24. Model Routing Notes And Cost / Budget Impact

Any later AI-assisted organization remains route-governed and optional.

## 25. Explicit-Content / Send-Package Handling, If Applicable

The binder must respect content masking and local-only rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Hidden or excluded material must stay protected in navigation and previews.

## 27. Testing Requirements

Prove navigation works without altering truth ownership.

## 28. Governance Rules And Risks

- no shadow canon through containers,
- no hidden authority drift,
- no forced workflow gate,
- multi-placement is reference placement only, not multi-ownership,
- removing a Binder placement must not silently delete manuscript, notes, lore, files, or other owned artifacts,
- hidden, protected, local-only, or AI-excluded material must not leak through Binder labels, previews, or navigation summaries.

## 29. Failure Modes

If binder views fail, direct project access and writing should still work.

## 30. v1 Boundary

Basic project browsing and grouping.

## 31. v2 Boundary

Richer optional navigation and summary layers.

## 32. Future-Only Boundary

Deep automated project curation.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from project-starting-point, project-folder, and imported-manuscript organization questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `3 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: how visible should the distinction between project artifacts, imported sources, external linked files, local project copies, unavailable sources, and protected items be across navigation surfaces?
- Critical: what project shapes must Binder support at intake, including blank projects, messy imported manuscripts, folders of notes, and mixed-support projects, without forcing one canonical container structure?
- Critical: how much author organizational freedom should Binder allow before it becomes clutter or a shadow workspace?

### Major Questions

- Major: how much structure should Binder expose by default versus hide behind summonable views so project browsing stays useful without becoming a dashboard?
- Major: should Binder multi-placement be visible as one artifact in several locations everywhere, or only where inspection is explicitly requested?
- Jason decision candidate: should `Binder` and `Project Library` remain one paired concept, or should one become the preferred writer-facing name?

### Minor Questions

- Minor: what naming best distinguishes browse, organize, library, binder, archive, and workspace container views?

### Answered / Superseded Questions

- Containers do not own narrative truth.
- Library metadata is durable state, not canon.
- Project organization does not imply story truth.
- Binder navigation must not gate direct writing.
- The same underlying artifact may appear in multiple Binder locations as references.
- Removing a Binder placement removes only that reference.
- `Imports / Staging` may be exposed in Binder for navigation without making Binder the staging owner.
- Questions better owned elsewhere: exact import, export, sync, and Google Docs behavior belong to the future `Import / Export / Google Docs` dossier.

### Deferred Questions

- Deferred: exact archive layering, trash handling, and series-scale binder unification details.

## 34. Acceptance Criteria

This dossier is acceptable only if navigation stays non-authoritative and non-gating.
