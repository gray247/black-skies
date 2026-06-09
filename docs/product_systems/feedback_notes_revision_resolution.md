# Feedback Notes / Revision Resolution

## 1. Status Header

- Dossier name: `Feedback Notes / Revision Resolution`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Writing Surface`, `Command Center Surface`, `Signal Architecture`, `Companion`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Narrative Insertion / Narrative Assertion`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define a bounded revision-note and resolution system that helps the writer review feedback and resolve it without turning notes into automatic edits or truth mutations.

## 3. User Problem Solved

The writer needs a place to track feedback and revision work without losing control over what changes actually become accepted prose or truth.

## 4. What The System Does

- collect feedback notes,
- organize revision candidates,
- support explicit resolution workflows.

## 5. What The System Does Not Do

- auto-apply edits,
- auto-accept critique,
- own manuscript truth.

## 6. User-Facing Behavior

Visible behavior should emphasize review, choice, and explicit resolution.

## 7. Hidden/Background Behavior

Background grouping or deduping may exist later, but it remains advisory.

## 8. What Appears First

- open notes,
- current revision blockers,
- clear link back to prose.

## 9. What Is Summonable

- note history,
- source evidence,
- candidate resolutions,
- signal detail.

## 10. What Is Hidden Until Needed

- deep history,
- bulk operations,
- critique-heavy evidence.

## 11. Inputs

- author notes,
- critique signals,
- Companion suggestions,
- manuscript references.

## 12. Outputs

- revision-note views,
- resolution candidates,
- accepted or dismissed note states.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Narrative Insertion / Narrative Assertion`

## 14. What Gets Stored

- notes,
- status labels,
- source labels,
- author resolution history.

## 15. What Remains Temporary

- temporary suggested fixes,
- transient clustering,
- unresolved summaries.

## 16. Relationship To Narrative Insertion / Assertion

Accepted revisions still require explicit narrative action.

## 17. Relationship To Story Units

Story Units may group revision work, but remain optional.

## 18. Relationship To Prose / Scene Projection

Projection may help review affected material without replacing accepted text.

## 19. Relationship To Writing Surface

The Writing Surface may show bounded current-text revision actions, not bulk review control.

## 20. Relationship To Command Center Surface

Heavier review, acceptance, cleanup, and conflict workflows belong in the Command Center.

## 21. GUI Placement Principles

Keep revision support close to writing while avoiding clutter and hidden authority.

## 22. Local LLM Role

Local AI may later suggest rewrites or summaries only as advisory material.

## 23. Paid API Role

Paid critique or rewrite help remains approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

All AI-assisted revision help must respect routing and spend rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Revision help must respect masking and send-package boundaries.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected content must not leak through revision-note context.

## 27. Testing Requirements

Prove notes do not silently mutate prose or truth.

## 28. Governance Rules And Risks

- no hidden auto-apply behavior,
- no critique-as-canon,
- no silent truth mutation.

## 29. Failure Modes

If revision support fails, the writer can still edit directly.

## 30. v1 Boundary

Basic note capture, review, and explicit resolution.

## 31. v2 Boundary

Richer grouping, filtering, and history.

## 32. Future-Only Boundary

Deep automation of rewrite resolution.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from `# 14. Feedback Notes / Revision Resolution Questions`
- stale placeholder questions removed or superseded: yes
- active question count after merge: 9
- remaining blocker summary: `0 Fatal`, `4 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: what note states are durable, and what actions require explicit author confirmation, especially accept, reject, resolve, park, hide, expire, or convert-to-revision-task?
- Critical: how are `Feedback Notes` separated from `Signal Architecture` signal state, from future `Critique` outputs, and from explicit author-owned revision decisions?
- Critical: what source and anchor scopes may notes attach to, such as prose ranges, assertions, Story Units, Outline nodes, or full-project context, and what happens when those anchors are rewritten, deleted, or become stale?
- Critical: what kinds of note outcomes may feed `Memory Lab`, `Companion`, or signal candidates, and which must remain local advisory notes only unless explicitly converted?

### Major Questions

- Major: how much revision review belongs inline versus in `Command Center Surface`, and what is the smallest useful current-text note interaction in `Writing Surface`?
- Major: should resolved or rejected notes remain searchable or visible in history, and if so, with what boundaries so they do not become clutter or shadow truth?
- Jason decision candidate: should early support focus on author-created and imported-editor notes first, or also include bounded AI-created note forms from rewrite and support systems?

### Minor Questions

- Minor: should `Feedback Notes` and `Revision Resolution` stay paired, or should one become the clearer writer-facing term?

### Answered / Superseded Questions

- Advisory output does not become truth automatically.
- Revision resolution must not silently mutate manuscript, truth, `Memory Lab`, or durable signal state.
- Questions better owned elsewhere: exact critique report shape belongs to a future one-to-one `Critique` dossier, and exact export/sync/comment transport belongs to the future `Import / Export / Google Docs` dossier.

### Deferred Questions

- Deferred: exact note taxonomy, severity vocabulary, and UI-density rules.

## 34. Acceptance Criteria

This dossier is acceptable only if revision support remains advisory and explicit.
