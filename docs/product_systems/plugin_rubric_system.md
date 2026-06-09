# Plugin / Rubric System

## 1. Status Header

- Dossier name: `Plugin / Rubric System`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Signal Architecture`, `Companion`, `Model Routing And Budget Architecture`
- Feeds into: `Command Center Surface`, `Writing Surface`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define plugin or rubric support as an extensibility layer for bounded analysis rules or review frameworks without allowing plugins to become hidden truth owners.

## 3. User Problem Solved

The writer may want customizable review lenses without hardcoding every rubric into the core product or confusing plugin output with accepted canon.

## 4. What The System Does

- host optional review rubrics,
- run bounded plugin-like analyses,
- surface advisory outputs.

## 5. What The System Does Not Do

- override core authority rules,
- create truth silently,
- bypass routing, privacy, or spend governance.

## 6. User-Facing Behavior

Visible behavior should emphasize opt-in use, clear labels, and bounded output.

## 7. Hidden/Background Behavior

Background execution may exist later, but remains governed and non-authoritative.

## 8. What Appears First

- selected rubric or plugin result,
- clear source or rubric label,
- relevant action choices.

## 9. What Is Summonable

- deeper result detail,
- rubric explanation,
- execution context.

## 10. What Is Hidden Until Needed

- implementation-heavy detail,
- dense execution history,
- low-value raw output.

## 11. Inputs

- approved project context,
- rubric definitions,
- selected scopes,
- routing state when AI is involved.

## 12. Outputs

- rubric findings,
- plugin findings,
- signal candidates or support summaries.

## 13. Which Other Systems Consume Those Outputs

- `Command Center Surface`
- `Writing Surface`
- `Signal Architecture`

## 14. What Gets Stored

- rubric definitions when approved,
- retained findings,
- execution provenance where needed.

## 15. What Remains Temporary

- transient runs,
- unsaved findings,
- temporary execution state.

## 16. Relationship To Narrative Insertion / Assertion

Plugin or rubric output does not replace author-owned narrative truth.

## 17. Relationship To Story Units

Story Units may scope plugin runs optionally.

## 18. Relationship To Prose / Scene Projection

Projection may be consumed as context only.

## 19. Relationship To Writing Surface

The Writing Surface may show bounded current-text findings only.

## 20. Relationship To Command Center Surface

The Command Center is the likely home for heavier rubric review and management.

## 21. GUI Placement Principles

Keep extensibility bounded and do not turn the UI into a plugin junk drawer.

## 22. Local LLM Role

Local models may power optional plugin or rubric analysis.

## 23. Paid API Role

Paid plugin paths remain optional and approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Plugin execution must obey routing, approval, and spend governance.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Plugin context packages must respect masking and send boundaries.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Plugins must not bypass local-only or excluded-content protections.

## 27. Testing Requirements

Prove plugin output stays advisory and bounded by core rules.

## 28. Governance Rules And Risks

- no plugin-as-authority,
- no safety bypass,
- no hidden paid or outbound execution.

## 29. Failure Modes

If a plugin or rubric fails, core writing and review still work.

## 30. v1 Boundary

Minimal bounded rubric execution and advisory output handling.

## 31. v2 Boundary

Richer rubric definitions and controlled extensibility.

## 32. Future-Only Boundary

Open-ended plugin ecosystems.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, but critique and marketplace material was heavily filtered; only bounded rubric/extensibility questions safe for this dossier were retained
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `1 Fatal`, `3 Critical`, `2 Major`

### Fatal Questions

- Fatal: what hard boundaries prevent plugin or rubric output from bypassing core authority, privacy, routing, spend, masking, and protected-content rules?

### Critical Questions

- Critical: what execution classes are local-only, approval-gated, outbound-gated, or disallowed entirely for rubric or plugin runs?
- Critical: what kinds of output may plugins or rubrics produce at all: local advisory notes, candidate findings, signal candidates, bounded comparisons, or only support summaries?
- Critical: how should custom rubrics differ from a future one-to-one `Critique` dossier so Plugin / Rubric support does not become a hidden generic critique engine?

### Major Questions

- Major: how much plugin or rubric management belongs in `Command Center Surface` versus settings versus install-time governance?
- Jason decision candidate: should the first safe scope be internal author-defined rubrics only, or may it include bounded third-party plugin-like extensions later?

### Minor Questions

- Minor: what user-facing language best distinguishes plugin, rubric, pass, analysis lens, and extension without implying core authority?

### Answered / Superseded Questions

- AI is advisory unless accepted.
- Plugin or rubric output must remain advisory unless explicitly accepted through an owning system.
- Broad critique questions about harshness, pass catalogs, report style, and critique personality are not safe to merge here and belong to a future one-to-one `Critique` dossier.

### Deferred Questions

- Deferred: exact plugin packaging, installation, signing, trust, and update rules.

## 34. Acceptance Criteria

This dossier is acceptable only if extensibility remains bounded by core doctrine.
