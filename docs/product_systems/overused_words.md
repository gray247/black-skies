# Overused Words

## 1. Status Header

- Dossier name: `Overused Words`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-19`
- Depends on: `craft_analyzer_family_contract.md`, `Writing Surface`,
  `Command Center Surface`, `Signal Architecture`
- Feeds into: `Writing Surface`, `Command Center Surface`,
  `Critique / Evaluation`
- Runtime authority: `future`
- Authority level: `support state and advisory findings`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define `Overused Words` as advisory prose-inspection tooling that helps
the author notice distracting repetition and repeated word patterns
without turning heuristic detection into story verdict.

The analyzer distinguishes exact repetition, lemma or inflection
families, repeated phrases, nearby clusters, broad manuscript
frequency, narration versus dialogue, character-specific diction,
proper nouns, function words, motifs, deliberate repetition, and
project exclusions or stop lists.

This dossier inherits shared family behavior from
`craft_analyzer_family_contract.md`.

## 3. User Problem Solved

The writer may want help spotting distracting repetition without
receiving hidden authority about which wording is correct.

## 4. What The System Does

- inspect repeated word patterns,
- describe repetition as evidence before it becomes an advisory
  concern,
- surface advisory cues and source-linked examples,
- support explicit revision review,
- support analyzer-specific exclusions, intentional-use markers, and
  suppression within the family contract.

## 5. What The System Does Not Do

- rewrite text automatically,
- silently apply replacements,
- treat heuristics as final judgment,
- flatten voice, refrain, motif, or deliberate repetition into
  automatic defect.

## 6. User-Facing Behavior

Visible behavior should emphasize optional craft cues, easy dismissal,
and clear source evidence.
Low-confidence findings should stay out of ordinary inline warning flow
by default and appear only as subtle aggregate or optional indicators
unless the author asks for broader review.

## 7. Hidden/Background Behavior

Background scans may produce temporary findings and candidate signal
handoffs, but they remain advisory.

## 8. What Appears First

- small repetition cues,
- current-text examples,
- optional counts or summaries.

## 9. What Is Summonable

- broader lists,
- filters,
- comparison views,
- exclusions and intentional-use detail.

## 10. What Is Hidden Until Needed

- dense frequency tables,
- bulk cleanup actions,
- rewrite-heavy suggestions,
- history and comparison detail.

## 11. Inputs

- manuscript text,
- current passage context,
- project baseline or character baseline when available,
- narration versus dialogue context when available,
- optional author preferences,
- analyzer-specific project settings and exclusions.

## 12. Outputs

- repetition findings,
- summary lists,
- source-linked evidence and method-provenance labels,
- descriptive counts or comparisons,
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
- custom term exclusions,
- project or character baseline references,
- intentional-use markers,
- suppression rules,
- bounded run history,
- comparison state,
- evidence references and source anchors,
- references to related Notes or Signals only by link.

Stored state remains analyzer configuration and support state, not
editorial truth.

## 15. What Remains Temporary

- current scan results,
- transient counts,
- unsaved cleanup suggestions,
- unresolved temporary findings.

## 16. Relationship To Narrative Insertion / Assertion

Word-use analysis reads prose and accepted narrative context but does
not affect truth ownership.
Short scopes require caution, and project and character baselines may
matter more than general-language frequency when judging repetition.

## 17. Relationship To Story Units

Story Units may scope review context optionally.
They do not own repetition findings.

## 18. Relationship To Prose / Scene Projection

Projection may support review but is not authority.

## 19. Relationship To Writing Surface

The Writing Surface may host small current-text cues, requested
highlights, and direct source explanation only.
It must not become a constant repetition-policing surface.
Low-confidence findings should not create ordinary inline warnings by
default.

## 20. Relationship To Command Center Surface

Broader pattern review, history, exclusions, intentional-use review,
comparison, reruns, confidence framing, evidence detail, and method
detail belong in the Command Center.

## 21. GUI Placement Principles

Keep repetition cues lightweight, dismissible, and visibly advisory.

## 22. Local LLM Role

Local AI may later help with grouped explanations only within the family
contract and should degrade gracefully when unavailable rather than
blocking writing.

## 23. Paid API Role

Paid analysis is not required for the core early slice.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI-assisted word analysis remains optional and route-governed.
Silent lightweight local analysis is allowed only under the family
contract's enablement and safety posture.
Model assistance is optional, advisory, and should not be required for
the core repetition scan.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Analysis packages must respect masking, local-only, and exclusion
rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected text must not leak through examples or summaries.
Local execution does not override protected or AI-excluded boundaries.

## 27. Testing Requirements

Prove:

- advisory cues do not mutate prose and remain dismissible,
- intentional-use markers stop repetitive warnings within approved
  scope,
- motif, refrain, dialogue habit, ritual language, and incantation can
  remain intentional,
- project and character baselines may refine repetition judgment,
- replacement prose is routed to Draft Generation / Rewrite Loop or a
  bounded Companion-assisted path rather than analyzer ownership,
- stale markers surface honestly after source change.

## 28. Governance Rules And Risks

- no silent rewrite,
- no fake certainty,
- no clutter overload,
- no universal general-language baseline authority over author voice,
- accidental overuse must stay distinct from voice, refrain, motif,
  rhythm, dialogue habit, ritual language, and incantation,
- findings, dismissals, suppressions, and intentional-use markers follow
  the shared family contract.

## 29. Failure Modes

If detection fails, manual revision remains available.

## 30. v1 Boundary

Basic repetition cues, bounded examples, exclusions, and intentional-use
handling.

## 31. v2 Boundary

Richer filters, grouped cleanup support, and broader comparison views.

## 32. Future-Only Boundary

Deep stylistic automation.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None yet.

### Critical Questions

- What repetition thresholds are useful versus noise across selection,
  scene, chapter, or broader project scope?
- How should the system distinguish annoying repetition from intentional
  refrain, character voice, motif, rhythm, dialogue habit, ritual
  language, or incantation?
- What author actions should mark a repetition concern as dismissed,
  intentional, ignored for this scope, or worth revisiting later?

### Major Questions

- How much repetition detail belongs inline versus `Command Center`
  support views?
- Should the early slice focus on exact repeated words only, or also
  include stemmed variants, filler clusters, and repeated openings or
  sentence patterns?

### Minor Questions

- What user-facing naming best avoids sounding prescriptive while still
  being clear?

### Answered / Superseded Questions

- Direct writing remains available.
- Overused-word support is advisory and must not silently rewrite
  prose.
- Craft warnings must remain dismissible and non-authoritative.
- Project and character baselines may matter more than a general
  language baseline.

### Deferred Questions

- Exact split between rules-based detection, local-model grouping, and
  deeper optional analysis.

## 34. Acceptance Criteria

This dossier is acceptable only if repetition support remains advisory,
non-destructive, descriptive before judgmental, and compliant with the
shared craft family contract.
