# Overused Words

## 1. Status Header

- Dossier name: `Overused Words`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Writing Surface`, `Signal Architecture`
- Feeds into: `Writing Surface`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define overused-word support as advisory prose-inspection tooling that helps the author notice repetition without turning heuristic detection into story verdict.

## 3. User Problem Solved

The writer may want help spotting distracting repetition without receiving hidden authority about which wording is correct.

## 4. What The System Does

- inspect repeated word patterns,
- surface advisory cues,
- support explicit revision review.

## 5. What The System Does Not Do

- rewrite text automatically,
- silently apply replacements,
- treat heuristics as final judgment.

## 6. User-Facing Behavior

Visible behavior should emphasize optional craft cues and easy dismissal.

## 7. Hidden/Background Behavior

Background scans may produce signals, but remain advisory.

## 8. What Appears First

- small repetition cues,
- current-text examples,
- optional counts or summaries.

## 9. What Is Summonable

- broader lists,
- filters,
- comparison views.

## 10. What Is Hidden Until Needed

- dense frequency tables,
- bulk cleanup actions,
- rewrite-heavy suggestions.

## 11. Inputs

- manuscript text,
- current passage context,
- optional author preferences.

## 12. Outputs

- repetition cues,
- summary lists,
- example-linked notes.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`

## 14. What Gets Stored

- author dismissals,
- retained notes,
- signal references when needed.

## 15. What Remains Temporary

- current scan results,
- transient counts,
- unsaved cleanup suggestions.

## 16. Relationship To Narrative Insertion / Assertion

Word-use analysis does not affect truth ownership.

## 17. Relationship To Story Units

Story Units may scope review context optionally.

## 18. Relationship To Prose / Scene Projection

Projection may support review but is not authority.

## 19. Relationship To Writing Surface

The Writing Surface may host small current-text cues only.

## 20. Relationship To Command Center Surface

Broader pattern review or cleanup belongs in the Command Center.

## 21. GUI Placement Principles

Keep repetition cues lightweight and dismissible.

## 22. Local LLM Role

Local AI may later help with grouped explanations only.

## 23. Paid API Role

Paid analysis is not required for core detection.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI-assisted word analysis remains optional and route-governed.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Analysis packages must respect masking and local-only rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected text must not leak through examples.

## 27. Testing Requirements

Prove advisory cues do not mutate prose and remain dismissible.

## 28. Governance Rules And Risks

- no silent rewrite,
- no fake certainty,
- no clutter overload.

## 29. Failure Modes

If detection fails, manual revision remains available.

## 30. v1 Boundary

Basic repetition cues and optional summaries.

## 31. v2 Boundary

Richer filters and grouped cleanup support.

## 32. Future-Only Boundary

Deep stylistic automation.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from repetition-, style-, and critique-adjacent intake that could be safely narrowed to word-repetition support
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `3 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: what repetition thresholds are signal-worthy versus noise across current passage, scene, chapter, and broader project scope?
- Critical: how should the system distinguish annoying repetition from intentional refrain, character voice, motif, rhythm, incantation, or horror-pattern repetition?
- Critical: what author actions should mark a repetition concern as dismissed, intentional, ignored for this scope, or kept as a useful reminder without creating permanent writing police?

### Major Questions

- Major: how much repetition detail belongs inline versus `Command Center Surface` support views versus optional export-like cleanup summaries?
- Major: which repetition cues should remain local craft hints only, and which may become signal candidates for broader revision attention?
- Jason decision candidate: should first-pass repetition support focus on exact repeated words only, or also include stemmed variants, filler clusters, and repeated openings or sentence patterns?

### Minor Questions

- Minor: what user-facing naming best avoids sounding prescriptive or schoolmarmish while still being clear?

### Answered / Superseded Questions

- Direct writing remains available.
- Overused-word support is advisory and must not silently rewrite prose.
- Craft warnings must remain dismissible and non-authoritative.
- Questions better owned elsewhere: exact rewrite suggestions belong primarily to `draft_generation_rewrite_loop.md`, and durable signal lifecycle belongs to `signal_architecture.md`.

### Deferred Questions

- Deferred: exact split between rules-based detection, local-model grouping, and deeper optional analysis.

## 34. Acceptance Criteria

This dossier is acceptable only if repetition support remains advisory and non-destructive.
