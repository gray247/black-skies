# Draft Generation / Rewrite Loop

## 1. Status Header

- Dossier name: `Draft Generation / Rewrite Loop`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Writing Surface`, `Model Routing And Budget Architecture`, `LLM Package Construction Architecture`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Feedback Notes / Revision Resolution`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define draft generation and rewrite support as an advisory loop that may propose text or revision options without silently becoming authored truth.

## 3. User Problem Solved

The writer may want bounded help drafting or rewriting while preserving authorship, approval, routing, and privacy controls.

## 4. What The System Does

- propose draft text,
- propose rewrite variants,
- support explicit review and acceptance workflows.

## 5. What The System Does Not Do

- auto-accept generated text,
- silently spend money,
- silently mutate manuscript truth.

## 6. User-Facing Behavior

Visible behavior should emphasize advisory text, explicit review, and author control.

## 7. Hidden/Background Behavior

Background preparation may assemble context, but generation remains governed and non-authoritative.

## 8. What Appears First

- advisory outputs,
- clear labels,
- explicit accept or reject or dismiss choices.

## 9. What Is Summonable

- alternate variants,
- source context,
- package and routing detail.

## 10. What Is Hidden Until Needed

- deep provenance,
- heavy comparison,
- provider-specific detail.

## 11. Inputs

- author prompts,
- accepted narrative context,
- approved package context,
- routing state.

## 12. Outputs

- draft suggestions,
- rewrite suggestions,
- critique-adjacent notes.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Feedback Notes / Revision Resolution`

## 14. What Gets Stored

- generated artifacts only when explicitly retained,
- provenance,
- author action history where needed.

## 15. What Remains Temporary

- rejected variants,
- transient candidates,
- unsaved rewrite comparisons.

## 16. Relationship To Narrative Insertion / Assertion

Only explicit author acceptance may convert generated material into author-owned truth.

## 17. Relationship To Story Units

Story Units may scope generation context optionally.

## 18. Relationship To Prose / Scene Projection

Projection may host draft comparisons without becoming truth.

## 19. Relationship To Writing Surface

The Writing Surface may host small current-text generation actions but not hide approval boundaries.

## 20. Relationship To Command Center Surface

Heavier review, routing, package, and bulk comparison workflows belong in the Command Center.

## 21. GUI Placement Principles

Keep generation support bounded and avoid crowding default writing.

## 22. Local LLM Role

Local models are a likely path for cheaper or private generation support.

## 23. Paid API Role

Paid models remain optional, approval-governed, and spend-constrained.

## 24. Model Routing Notes And Cost / Budget Impact

Generation and rewrite flows must obey routing, budget, and approval doctrine.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Outbound generation packages must respect masking, package construction, and explicit-content boundaries.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected or excluded material must not leak into generation context by default.

## 27. Testing Requirements

Prove generated or rewritten text never becomes accepted truth silently.

## 28. Governance Rules And Risks

- no silent truth mutation,
- no silent paid or outbound work,
- no hidden authorship drift.

## 29. Failure Modes

If generation fails, writing still proceeds directly.

## 30. v1 Boundary

Bounded generation and rewrite suggestions with explicit acceptance.

## 31. v2 Boundary

Richer review loops and provider-aware comparisons.

## 32. Future-Only Boundary

Heavy autonomous revision systems.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from `# 27. Revision / Rewrite Questions` plus adjacent AI rewrite questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `4 Critical`, `2 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Future contract need: what exact accept, reject, keep, discard, park, partial-accept, and compare states govern draft and rewrite outputs?
- Critical: should every AI rewrite create side-by-side comparison by default, or only certain rewrite classes?
- Critical: what warnings are mandatory when rewrite output changes canon, voice, foreshadowing, explicit-content risk, or other accepted story-support boundaries?
- Critical: should rejected rewrite output be stored at all, and if stored, must it remain hidden from `Memory Lab`, downstream signals, and future model context by default?

### Major Questions

- Major: which generation or rewrite paths belong inline in `Writing Surface` versus support surfaces versus `Command Center Surface` review flows?
- Major: how should late, partial, or stale rewrite output reattach when the underlying passage moved or changed after the run began?

### Minor Questions

- Minor: what user-facing language best distinguishes generate, rewrite, edit, suggestion, revision task, and branch or version states?

### Answered / Superseded Questions

- AI is advisory unless accepted by the user.
- Superseded by current doctrine: generated or rewritten text must remain untrusted until explicit author acceptance, and no rewrite may silently mutate accepted truth.
- Questions better owned elsewhere: whether rewrite output updates signals, assertions, Outline, Story Units, or Memory Lab belongs partly to those owning-system dossiers.

### Deferred Questions

- Deferred: exact provider-specific tuning behavior.

## 34. Acceptance Criteria

This dossier is acceptable only if generated text remains advisory until explicitly accepted.
