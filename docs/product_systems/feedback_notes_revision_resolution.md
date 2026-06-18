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

This dossier inherits durable-state ownership from `truth_and_state_ownership_matrix.md`, handoff rules from `surface_to_owner_action_handoff_contract.md`, AI-output and conversion limits from `ai_lifecycle_and_approval_matrix.md`, protection rules from `protected_content_permission_matrix.md`, advisory vocabulary from `shared_output_vocabulary_contract.md`, provenance posture from `provenance_state_model.md`, and degraded-mode limits from `degraded_mode_execution_contract.md`.

## 3. User Problem Solved

The writer needs a place to track feedback and revision work without losing control over what changes actually become accepted prose or truth.

## 4. What The System Does

- owns durable note and revision-note state only,
- collect feedback notes,
- organize revision candidates,
- support explicit resolution workflows.

## 5. What The System Does Not Do

- auto-apply edits,
- auto-accept critique,
- own manuscript truth,
- let note candidates silently become durable notes.

## 6. User-Facing Behavior

Visible behavior should emphasize review, choice, and explicit resolution.
Notes are the durable home for preserved concerns, comments, and
revision items that the author wants to keep even when no signal is
needed.

## 7. Hidden/Background Behavior

Background grouping or deduping may exist later, but it remains advisory.
Any AI-origin note material remains candidate-only until explicitly accepted into durable note state.

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
- critique signals and critique-derived note candidates,
- continuity, theme, relationship, emotion, or other advisory findings only when they become note candidates through owner-governed conversion,
- Companion suggestions,
- imported-editor notes later,
- manuscript references.

## 12. Outputs

- revision-note views,
- durable note state,
- note candidates,
- resolution candidates,
- accepted or dismissed note states,
- note-local revision posture such as `needs review`, `revision intended`,
  `revision underway`, `ready for re-evaluation`, and `resolved`.

Notes remain advisory or workflow artifacts.
They are not truth and not manuscript mutation authority.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Narrative Insertion / Narrative Assertion`

## 14. What Gets Stored

- durable note and revision-note state,
- status labels,
- source labels,
- author resolution history.

## 15. What Remains Temporary

- note candidates,
- temporary suggested fixes,
- transient clustering,
- unresolved summaries.

Note candidate does not equal durable note state.

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
Protected, hidden, deleted, discarded, forgotten, local-only, or AI-excluded source material must not leak through note summaries, previews, or grouped history.

## 27. Testing Requirements

Prove notes do not silently mutate prose or truth.

## 28. Governance Rules And Risks

Governance rules:

- `Feedback Notes / Revision Resolution` owns durable note and revision-note state only,
- notes are advisory or workflow artifacts rather than truth,
- note candidate does not equal durable note,
- no hidden auto-apply behavior,
- no critique-as-canon,
- no silent truth mutation,
- note resolution does not mutate manuscript truth automatically,
- note resolution does not resolve durable signals unless `Signal Architecture` does so through its own owner path,
- critique, continuity, theme, relationship, emotion, `Companion`, and other advisory outputs may become note candidates only through owner-governed conversion,
- a note does not require a signal unless elevated attention, blocking, or routing value is useful,
- midpoint scope is author-created and imported-editor notes first,
- later AI-created note candidates may exist only with explicit author acceptance,
- note summaries, history, and grouped views must preserve protection, provenance, and masking boundaries.

Minimum rough lifecycle vocabulary for note intake and durable note state, inheriting the shared output vocabulary wherever possible:

- `candidate`: a proposed note or revision artifact not yet accepted into durable note state.
- `reviewed`: a note examined without becoming truth or manuscript mutation automatically.
- `accepted`: a note accepted into durable note state or into a bounded author workflow.
- `dismissed`: a note judged not worth active surfacing.
- `parked`: a note intentionally left for later review without being treated as resolved truth.
- `converted`: a note explicitly turned into another downstream artifact or action request without mutating truth on its own.
- `resolved`: the note's review loop is closed for workflow purposes.
- `expired`: a low-value or stale note removed from active surfacing.
- `superseded`: an older note displaced by fresher evidence, newer notes, or later author action.

Durable notes may conceptually carry editorial workflow posture such as
`needs review`, `revision intended`, `revision underway`, `ready for
re-evaluation`, and `resolved`, but those meanings should not be treated
as a separate task-system contract.

Anchor drift remains a condition or repair problem, not a separate canonical shared lifecycle state.

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
- remaining blocker summary: `0 Fatal`, `4 Critical`, `2 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Future contract need: what minimum durable note-state contract, beyond the rough shared lifecycle vocabulary above, must each note carry for source, anchor, provenance, lifecycle state, visibility, and conversion history?
- Critical: what source and anchor scopes may notes attach to, such as prose ranges, assertions, Story Units, Outline nodes, or full-project context, and what happens when those anchors are rewritten, deleted, or become stale?
- Future contract need: what exact boundaries govern later AI-note candidate scope, imported-editor note normalization, and note-to-signal or note-to-memory conversion paths without widening early `v1` scope?
- Future contract need: which note history events should remain durably visible, which may expire, and which should remain local advisory residue only?
- Future contract need: what exact visibility split belongs inline versus in `Command Center Surface` once the smallest useful current-text note interaction is chosen?

### Major Questions

- Major: what is the smallest useful current-text note interaction in `Writing Surface` once heavier review remains in `Command Center Surface`?
- Major: should resolved or rejected notes remain searchable or visible in history, and if so, with what boundaries so they do not become clutter or shadow truth?

### Minor Questions

- Minor: should `Feedback Notes` and `Revision Resolution` stay paired, or should one become the clearer writer-facing term?

### Answered / Superseded Questions

- Advisory output does not become truth automatically.
- Revision resolution must not silently mutate manuscript, truth, `Memory Lab`, or durable signal state.
- Answered / Superseded: `Feedback Notes / Revision Resolution` owns durable note and revision-note state only.
- Answered / Superseded: notes are advisory or workflow artifacts rather than truth.
- Answered / Superseded: note candidate does not equal durable note state.
- Answered / Superseded: critique, continuity, theme, and other advisory outputs may become note candidates only through owner-governed conversion.
- Answered / Superseded: midpoint scope is author-created and imported-editor notes first; later AI-created note candidates require explicit author acceptance.
- Questions better owned elsewhere: exact critique report shape belongs to a future one-to-one `Critique` dossier, and exact export/sync/comment transport belongs to the future `Import / Export / Google Docs` dossier.

### Deferred Questions

- Deferred: exact note taxonomy, severity vocabulary, and UI-density rules.

## 34. Acceptance Criteria

Implementation remains blocked by open Critical and Future contract questions.
This dossier is acceptable only if revision support remains advisory and explicit.
