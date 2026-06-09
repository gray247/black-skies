# Theme System

## 1. Status Header

- Dossier name: `Theme System`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Outline`, `Companion`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Outline`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define Theme System as an optional thematic planning and inspection support tool that helps the author organize theme without turning inferred themes into story truth automatically.

## 3. User Problem Solved

The writer may want to track and inspect theme intentionally without relying on vague memory or allowing AI inference to overclaim meaning.

## 4. What The System Does

- organize author-defined themes,
- show theme-linked notes and references,
- surface advisory thematic analysis when clearly labeled.

## 5. What The System Does Not Do

- own truth,
- grade the story automatically,
- canonize inferred theme claims silently.

## 6. User-Facing Behavior

Visible behavior should emphasize author-defined theme first and advisory inference second.

## 7. Hidden/Background Behavior

Background thematic hints may exist later, but they remain advisory.

## 8. What Appears First

- author-defined themes,
- linked accepted material,
- small advisory indicators when useful.

## 9. What Is Summonable

- theme evidence,
- candidate theme notes,
- advisory analysis,
- structure links.

## 10. What Is Hidden Until Needed

- dense thematic critique,
- provenance-heavy history,
- deep AI explanation.

## 11. Inputs

- accepted assertions,
- manuscript evidence,
- author notes,
- advisory analysis.

## 12. Outputs

- theme views,
- theme-linked references,
- advisory theme suggestions.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Outline`

## 14. What Gets Stored

- author-defined themes,
- linked references,
- candidate theme notes,
- visibility state.

## 15. What Remains Temporary

- inferred theme suggestions,
- transient analyses,
- unsaved notes.

## 16. Relationship To Narrative Insertion / Assertion

Theme support may read accepted narrative truth, but it does not replace it.

## 17. Relationship To Story Units

Story Units may group theme work optionally.

## 18. Relationship To Prose / Scene Projection

Projection may show theme-linked material without becoming theme authority.

## 19. Relationship To Writing Surface

Theme support may be summonable from writing, but must not crowd drafting by default.

## 20. Relationship To Command Center Surface

The Command Center may host broader theme review and cleanup.

## 21. GUI Placement Principles

Keep theme support optional and bounded.

## 22. Local LLM Role

Local AI may later assist with optional thematic analysis only.

## 23. Paid API Role

Paid theme analysis remains optional and approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI theme analysis must respect routing and spend rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Theme support must respect masking and send-package rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected material must not leak through theme summaries or examples.

## 27. Testing Requirements

Prove advisory theme analysis does not become accepted truth silently.

## 28. Governance Rules And Risks

- no hidden thematic canon,
- no fake certainty,
- no automatic grading.

## 29. Failure Modes

If theme support fails, the writer still writes and organizes theme manually.

## 30. v1 Boundary

Basic author-defined theme organization and bounded advisory cues.

## 31. v2 Boundary

Richer linkage and optional thematic analysis.

## 32. Future-Only Boundary

Deep automated theme scoring or prescriptive guidance.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from theme-, tone-, and interpretation-adjacent intake; visual-theme questions were excluded as not relevant to story theme support
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `3 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: what counts as accepted theme intent versus candidate theme note versus advisory theme inference?
- Critical: who may create, update, hide, delete, or accept theme records, and what explicit author action turns a thematic interpretation into accepted author-owned intent?
- Critical: how should the system distinguish theme evidence, motif linkage, tone resonance, and interpretive overreach so inferred meaning does not become shadow canon?

### Major Questions

- Major: how much theme support belongs near drafting versus support surfaces versus `Outline`-adjacent structure views?
- Major: how should theme links appear across assertions, notes, scenes, Story Units, and outline structure without making any of those systems the owner of theme truth?
- Jason decision candidate: should early theme support focus on author-defined themes and linked evidence only, or also allow bounded inferred theme candidates from manuscript analysis?

### Minor Questions

- Minor: should theme be framed as a `system`, `theme board`, `theme notes`, or some lighter support concept for writers?

### Answered / Superseded Questions

- Inferred output is not authored truth.
- Theme support is optional and must not canonize inferred meaning silently.
- Questions about visual themes, palette themes, and cosmetic UI theming belong elsewhere, not in this story-theme dossier.

### Deferred Questions

- Deferred: exact theme taxonomy, visualization rules, and motif-link display language.

## 34. Acceptance Criteria

This dossier is acceptable only if theme support remains optional and non-authoritative.
