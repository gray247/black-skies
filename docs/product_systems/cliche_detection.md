# Cliche Detection

## 1. Status Header

- Dossier name: `Cliche Detection`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-19`
- Depends on: `craft_analyzer_family_contract.md`, `Writing Surface`,
  `Command Center Surface`, `Signal Architecture`, `Companion`
- Feeds into: `Writing Surface`, `Command Center Surface`,
  `Critique / Evaluation`
- Runtime authority: `future`
- Authority level: `support state and advisory findings`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define `Cliche Detection` as advisory craft analysis that flags
potentially stale phrasing or familiar patterns without claiming
objective literary verdict authority.

The broad author-facing label is `possible familiar phrasing`, with
more specific evidence labels such as `possible cliché`, `common
idiom`, `familiar image`, `genre convention`, and `repeated stock
phrasing`.

This dossier inherits shared family behavior from
`craft_analyzer_family_contract.md`.

## 3. User Problem Solved

The writer may want help noticing tired phrases or predictable language
without being forced into a single taste model.

## 4. What The System Does

- flag possible cliches,
- flag phrase-list, heuristic, or model-assisted matches,
- show examples and context,
- support explicit review, dismissal, and intentional-use handling,
- route replacement or rewrite requests to `Draft Generation / Rewrite
  Loop` or a bounded `Companion` workflow rather than analyzer-owned
  rewriting,
- support analyzer-specific exclusions, intentional-use markers, and
  suppression within the family contract.

## 5. What The System Does Not Do

- decide literary value absolutely,
- rewrite text silently,
- auto-reject authorial style,
- collapse genre convention, idiom, allusion, satire, or regional
  speech into automatic defect.

## 6. User-Facing Behavior

Visible behavior should emphasize possibility, context, source
explanation, and dismissibility.
Low-confidence findings should stay out of ordinary inline warning flow
by default and appear mainly in Command Center review.

## 7. Hidden/Background Behavior

Background detection may produce temporary findings and candidate signal
handoffs, but it remains advisory.

## 8. What Appears First

- bounded cues,
- current-text examples,
- clear `possible` framing.

## 9. What Is Summonable

- broader lists,
- examples,
- rationale and source context,
- exclusions and intentional-use detail.

## 10. What Is Hidden Until Needed

- dense analysis,
- bulk cleanup workflows,
- AI-heavy explanation,
- history and comparison detail.

## 11. Inputs

- manuscript text,
- author preferences,
- optional genre context,
- cultural or regional voice context when known,
- analyzer-specific project settings and exclusions.

## 12. Outputs

- possible-cliche findings,
- advisory summaries,
- source-linked evidence and method-provenance labels,
- visible confidence framing,
- example-linked notes,
- note candidates and signal candidates only through owner-governed
  conversion.

Outputs remain temporary by default.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Critique / Evaluation`

## 14. What Gets Stored

- enabled or disabled posture,
- analysis-scope defaults,
- sensitivity preferences,
- display and filter preferences,
- custom term or phrase exclusions,
- project exclusions for deliberate cliché or intentional style,
- intentional-use markers,
- suppression rules,
- bounded run history,
- comparison state,
- evidence references and source anchors,
- references to related Notes or Signals only by link.

Stored state remains analyzer configuration and support state, not
editorial truth.

## 15. What Remains Temporary

- transient detections,
- unsaved examples,
- temporary suggestions,
- unresolved temporary findings.

## 16. Relationship To Narrative Insertion / Assertion

Cliche analysis reads prose and accepted narrative context, but it does
not create or modify truth by itself.

## 17. Relationship To Story Units

Story Units may scope review context optionally.
They do not own cliche findings.

## 18. Relationship To Prose / Scene Projection

Projection may support review without becoming authority.

## 19. Relationship To Writing Surface

The Writing Surface may host small contextual cues, requested
highlights, and direct source explanation only.
It must not become a constant taste-policing surface.
Low-confidence findings should not create ordinary inline warnings by
default.

## 20. Relationship To Command Center Surface

Broader pattern review, history, exclusions, intentional-use review,
comparison, reruns, confidence framing, evidence detail, method detail,
and cultural or regional context belong in the Command Center.

## 21. GUI Placement Principles

Keep cues light and avoid turning taste into constant interruption.

## 22. Local LLM Role

Local AI may later assist with bounded pattern explanation only within
the family contract and should degrade gracefully when unavailable
rather than blocking writing.

## 23. Paid API Role

Paid analysis remains optional and approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI-assisted pattern analysis must respect routing and spend rules.
Silent lightweight local analysis is allowed only under the family
contract's enablement and safety posture.
Model assistance is optional, advisory, and should not be required for
the core cliche scan.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Packages must respect masking, send boundaries, and exclusion rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected text must not leak through examples, prompts, or summaries.
Local execution does not override protected or AI-excluded boundaries.

## 27. Testing Requirements

Prove:

- cues remain advisory, dismissible, and non-destructive,
- intentional-use markers stop repetitive warnings within approved
  scope,
- genre convention, voice, homage, parody, pulp register, and
  deliberate cliche remain distinguishable from weak default language,
- source-list and model-assisted findings remain distinguishable,
- unsupported model judgment is insufficient by itself,
- stale markers surface honestly after source change.

## 28. Governance Rules And Risks

- no taste-as-law behavior,
- no silent rewrite,
- no false certainty,
- no automatic defect verdict from detection,
- familiarity is not automatically a defect,
- findings, dismissals, suppressions, and intentional-use markers follow
  the shared family contract.

## 29. Failure Modes

If detection fails, the writer still reviews style manually.

## 30. v1 Boundary

Basic possible-cliche cues, bounded examples, exclusions, and
intentional-use handling.

## 31. v2 Boundary

Richer contextual examples, filtering, and grouped comparison.

## 32. Future-Only Boundary

Deep stylistic taste modeling.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None yet.

### Critical Questions

- How should confidence and `possible cliche` framing be displayed so
  the tool remains advisory rather than shaming or prescriptive?
- How should the system distinguish stale phrasing from intentional
  genre convention, homage, parody, pulp register, or voice-consistent
  repetition?
- What author actions should mark a cliche warning as false positive,
  intentional, genre-appropriate, or worth revisiting later?

### Major Questions

- How much genre, tone, voice, and audience context should shape
  detection before the tool becomes taste-as-law?
- Should the early slice focus on phrase-level warnings only, or may it
  also flag larger scene-pattern or trope-level sameness?

### Minor Questions

- What user-facing language best avoids shaming the writer while staying
  honest about the advisory nature of the warning?

### Answered / Superseded Questions

- Inferred output is not authored truth.
- Cliche support must remain advisory, optional, and dismissible.
- Broad critique personality and report-shape questions belong to
  `Critique / Evaluation`, not here.
- The broad family label is `possible familiar phrasing`, with more
  specific evidence labels allowed underneath it.

### Deferred Questions

- Exact phrase libraries, local-model assistance, and genre-specific
  detection strategies.

## 34. Acceptance Criteria

This dossier is acceptable only if cliche support stays advisory,
non-prescriptive, descriptive before judgmental, and compliant with the
shared craft family contract.
