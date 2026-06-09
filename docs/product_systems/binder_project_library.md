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

## 3. User Problem Solved

The writer needs to browse and organize project contents without forcing all truth, structure, or workflow meaning into one container.

## 4. What The System Does

- organize project contents,
- expose navigation and grouping views,
- support access to writing and support materials.

## 5. What The System Does Not Do

- own manuscript truth,
- replace narrative foundations,
- force one mandatory project shape.

## 6. User-Facing Behavior

Visible behavior should emphasize clarity, retrieval, and light organization.

## 7. Hidden/Background Behavior

Background indexing or sort preparation may exist, but it does not create truth.

## 8. What Appears First

- current project contents,
- clear navigation,
- current focus location when relevant.

## 9. What Is Summonable

- alternate groupings,
- history views,
- support links.

## 10. What Is Hidden Until Needed

- deep metadata,
- archive-heavy views,
- dense support diagnostics.

## 11. Inputs

- project files,
- narrative references,
- structure references,
- author organization choices.

## 12. Outputs

- project-navigation views,
- grouped references,
- retrieval entry points.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Project Index / Search / Retrieval`

## 14. What Gets Stored

- grouping state,
- navigation preferences,
- project organization metadata.

## 15. What Remains Temporary

- transient filters,
- current selection state,
- temporary sort views.

## 16. Relationship To Narrative Insertion / Assertion

The binder may point to accepted truth sources, but it does not replace them.

## 17. Relationship To Story Units

Story Unit links may appear, but Story Units remain optional.

## 18. Relationship To Prose / Scene Projection

Projection views may appear inside binder navigation without becoming authority.

## 19. Relationship To Writing Surface

The binder supports navigation into writing while preserving direct writing.

## 20. Relationship To Command Center Surface

The Command Center may expose higher-level project status without replacing binder navigation.

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
- no forced workflow gate.

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

- Critical: what counts as binder-owned metadata versus truth-bearing project data, especially when imported manuscripts, notes, projections, Story Units, or support artifacts all appear side by side?
- Critical: what project shapes must Binder support at intake, including blank projects, messy imported manuscripts, folders of notes, and mixed-support projects, without forcing one canonical container structure?
- Critical: how should Binder distinguish accepted manuscript material, support notes, projection-compatible groupings, archive material, and hidden or protected items without becoming a truth owner?

### Major Questions

- Major: how much structure should Binder expose by default versus hide behind summonable views so project browsing stays useful without becoming a dashboard?
- Major: which Binder actions are safe navigation or grouping actions only, and which heavier cleanup, repair, or organization actions belong in `Command Center Surface` instead?
- Jason decision candidate: should `Binder` and `Project Library` remain one paired concept, or should one become the preferred writer-facing name?

### Minor Questions

- Minor: what naming best distinguishes browse, organize, library, binder, archive, and workspace container views?

### Answered / Superseded Questions

- Containers do not own narrative truth.
- Binder navigation must not gate direct writing.
- Questions better owned elsewhere: exact import, export, sync, and Google Docs behavior belong to the future `Import / Export / Google Docs` dossier.

### Deferred Questions

- Deferred: exact archive layering, trash handling, and series-scale binder unification details.

## 34. Acceptance Criteria

This dossier is acceptable only if navigation stays non-authoritative and non-gating.
