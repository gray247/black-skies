# Cliche Detection

## 1. Status Header

- Dossier name: `Cliche Detection`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Writing Surface`, `Signal Architecture`, `Companion`
- Feeds into: `Writing Surface`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define cliche detection as advisory craft analysis that flags possible stale phrasing or patterns without claiming objective story verdict authority.

## 3. User Problem Solved

The writer may want help noticing tired phrases or predictable patterns without being forced into a single taste model.

## 4. What The System Does

- flag possible cliches,
- show examples and context,
- support explicit review and dismissal.

## 5. What The System Does Not Do

- decide literary value absolutely,
- rewrite text silently,
- auto-reject authorial style.

## 6. User-Facing Behavior

Visible behavior should emphasize possibility, context, and dismissibility.

## 7. Hidden/Background Behavior

Background detection may produce signals, but remains advisory.

## 8. What Appears First

- bounded cues,
- current-text examples,
- clear "possible" framing.

## 9. What Is Summonable

- broader lists,
- examples,
- rationale and source context.

## 10. What Is Hidden Until Needed

- dense analysis,
- bulk cleanup workflows,
- AI-heavy explanation.

## 11. Inputs

- manuscript text,
- author preferences,
- optional genre context.

## 12. Outputs

- possible-cliche cues,
- advisory summaries,
- example-linked notes.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`

## 14. What Gets Stored

- author dismissals,
- retained notes,
- signal references when needed.

## 15. What Remains Temporary

- transient detections,
- unsaved examples,
- temporary suggestions.

## 16. Relationship To Narrative Insertion / Assertion

Cliche analysis does not create or modify truth by itself.

## 17. Relationship To Story Units

Story Units may scope review context optionally.

## 18. Relationship To Prose / Scene Projection

Projection may support review without becoming authority.

## 19. Relationship To Writing Surface

The Writing Surface may host small contextual cues only.

## 20. Relationship To Command Center Surface

Broader pattern review belongs in the Command Center.

## 21. GUI Placement Principles

Keep cues light and avoid turning taste into constant interruption.

## 22. Local LLM Role

Local AI may later assist with pattern explanation.

## 23. Paid API Role

Paid analysis remains optional and approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI-assisted pattern analysis must respect routing and spend rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Packages must respect masking and send boundaries.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected text must not leak through examples or prompts.

## 27. Testing Requirements

Prove cues remain advisory, dismissible, and non-destructive.

## 28. Governance Rules And Risks

- no taste-as-law behavior,
- no silent rewrite,
- no false certainty.

## 29. Failure Modes

If detection fails, the writer still reviews style manually.

## 30. v1 Boundary

Basic possible-cliche cues and review support.

## 31. v2 Boundary

Richer contextual examples and filtering.

## 32. Future-Only Boundary

Deep stylistic taste modeling.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, but mostly from critique-adjacent and local-analysis intake; only cliche-safe questions were retained
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `3 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: how should confidence and `possible cliche` framing be displayed so the tool remains advisory rather than shaming or prescriptive?
- Critical: how should the system distinguish stale phrasing from intentional genre convention, homage, pulp register, dark-comic exaggeration, or voice-consistent repetition?
- Critical: what author actions should mark a cliche warning as false positive, intentional, genre-appropriate, or worth revisiting later without turning the warning into durable law?

### Major Questions

- Major: how much genre, tone, voice, and audience context should shape detection before the tool becomes taste-as-law?
- Major: how much cliche detail belongs inline versus support surfaces, and when should the system show rationale or examples instead of just a badge?
- Jason decision candidate: should early cliche detection focus on phrase-level warnings only, or may it also flag larger scene-pattern or trope-level sameness?

### Minor Questions

- Minor: what user-facing language best avoids shaming the writer while staying honest about the advisory nature of the warning?

### Answered / Superseded Questions

- Inferred output is not authored truth.
- Cliche support must remain advisory, optional, and dismissible.
- Broad critique personality, harshness, and report-shape questions belong to a future one-to-one `Critique` dossier, not here.

### Deferred Questions

- Deferred: exact phrase libraries, local-model assistance, and genre-specific detection strategies.

## 34. Acceptance Criteria

This dossier is acceptable only if cliche support stays advisory and non-prescriptive.
