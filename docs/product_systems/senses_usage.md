# Senses Usage

## 1. Status Header

- Dossier name: `Senses Usage`
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

Define `Senses Usage` as advisory craft analysis that helps the writer
inspect sensory presence, grounding, balance, and range without turning
descriptive heuristics into story law.

The analyzer uses a stable core sensory taxonomy with optional
project-defined categories and describes presence, distribution,
concentration, and change rather than enforcing quotas.

This dossier inherits shared family behavior from
`craft_analyzer_family_contract.md`.

## 3. User Problem Solved

The writer may want help noticing sensory flatness, imbalance, or weak
grounding without receiving hidden authority about what the prose must
become.

## 4. What The System Does

- inspect sensory presence, balance, grounding, and range,
- describe sensory distribution, concentration, and change across the
  current scope,
- surface advisory cues and source-linked examples,
- support targeted craft review,
- support analyzer-specific exclusions, intentional-use markers, and
  suppression within the family contract.

## 5. What The System Does Not Do

- rewrite prose automatically,
- grade the story as canon,
- silently modify accepted text,
- enforce mechanical sensory quotas,
- treat missing-sense absence as an automatic defect.

## 6. User-Facing Behavior

Visible behavior should emphasize optional craft support, bounded cues,
and direct source explanation.
Low-confidence findings should stay out of ordinary inline warning flow
by default and appear only as subtle aggregate or optional indicators
unless the author asks for broader review.

## 7. Hidden/Background Behavior

Background analysis may produce temporary findings and candidate signal
handoffs, but it remains advisory.

## 8. What Appears First

- light cues,
- relevant examples,
- clear source context.

## 9. What Is Summonable

- deeper analysis,
- comparative views,
- source-linked examples,
- exclusions and intentional-use detail.

## 10. What Is Hidden Until Needed

- dense analysis,
- bulk examples,
- heavy rewrite suggestions,
- history and comparison detail.

## 11. Inputs

- manuscript text,
- accepted narrative context,
- viewpoint, setting, genre, and narrative purpose when known,
- author goals when provided,
- deliberate sensory restraint or restriction when known,
- analyzer-specific project settings and exclusions.

## 12. Outputs

- sensory findings,
- advisory summaries,
- source-linked evidence and method-provenance labels,
- example-linked notes,
- descriptive comparisons of presence, distribution, concentration, or
  change,
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
- stable core category mapping and any project-defined sensory
  categories,
- project-specific exclusions,
- intentional-use markers,
- suppression rules,
- bounded run history,
- comparison state,
- evidence references and source anchors,
- references to related Notes or Signals only by link.

Stored state remains analyzer configuration and support state, not
editorial truth.

## 15. What Remains Temporary

- current analysis outputs,
- unsaved examples,
- transient suggestions,
- unresolved temporary findings.

## 16. Relationship To Narrative Insertion / Assertion

Craft analysis reads narrative text and evidence, but it does not create
or replace story truth.

## 17. Relationship To Story Units

Story Units may scope review context optionally.
They do not own sensory findings.

## 18. Relationship To Prose / Scene Projection

Projection may host examples or scope review context without becoming
authority.

## 19. Relationship To Writing Surface

The Writing Surface may show small current-text cues, requested
highlights, and direct source explanation only.
It must not become a constant craft-policing surface.
Low-confidence findings should not create ordinary inline warnings by
default.

## 20. Relationship To Command Center Surface

Broader review, grouped findings, history, exclusions, intentional-use
review, reruns, confidence framing, evidence detail, and method detail
belong in the Command Center.

## 21. GUI Placement Principles

Keep craft cues lightweight, non-crowding, and easy to dismiss or mark
intentional.

## 22. Local LLM Role

Local AI may later assist with deeper sensory analysis only within the
family contract and should degrade gracefully when unavailable rather
than blocking writing.

## 23. Paid API Role

Paid analysis remains optional and approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Heavier craft analysis must respect routing and spend rules.
Silent lightweight local analysis is allowed only under the family
contract's enablement and safety posture.
Model assistance is optional, advisory, and should not be required for
the core sensory scan.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Any outbound analysis must respect masking, package, and exclusion
rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected material must not leak through examples or summaries.
Local execution does not override protected or AI-excluded boundaries.

## 27. Testing Requirements

Prove:

- craft analysis remains advisory and bounded,
- stable core and project-defined categories remain compatible,
- absence is treated as low presence or deliberate restraint rather
  than an automatic defect,
- intentional restraint and exclusions stop repetitive warnings within
  approved scope,
- low-confidence findings stay out of ordinary inline warnings by
  default,
- findings do not mutate prose, Notes, or Signals,
- stale markers surface honestly after material source change.

## 28. Governance Rules And Risks

- no hidden grading authority,
- no silent rewrite,
- no false certainty,
- no mechanical sensory quota enforcement,
- no automatic missing-sense defect,
- descriptive evidence before judgment,
- intentional minimalism, POV restriction, sparse style, genre
  restraint, and deliberate coldness must remain valid,
- findings, dismissals, suppressions, and intentional-use markers follow
  the shared family contract.

## 29. Failure Modes

If analysis fails, the writer still revises manually.

## 30. v1 Boundary

Basic sensory cues, bounded examples, exclusions, and intentional-use
handling.

## 31. v2 Boundary

Richer examples, filters, and multi-passage comparisons.

## 32. Future-Only Boundary

Deep stylistic coaching or auto-rewrite behavior.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None yet.

### Critical Questions

- What sensory-imbalance cues are strong enough to surface at all
  without turning the system into writing police?
- How should the system distinguish missing sensory grounding from
  intentional minimalism, POV restriction, or genre-appropriate
  restraint?
- What source examples may be shown safely in `Writing Surface` versus
  support surfaces without crowding drafting or leaking protected text?

### Major Questions

- Which review scopes matter most: current selection, paragraph, scene,
  Story Unit, or larger comparison?
- How much overconcentration or monotony analysis belongs in the early
  slice versus later richer craft review?

### Minor Questions

- What vocabulary best explains sensory balance, grounding, and
  restraint without implying objective verdicts?

### Answered / Superseded Questions

- Inferred output is not authored truth.
- Craft analysis is advisory unless explicitly converted elsewhere.
- Style or craft warnings must not block direct writing.
- Durable signal state belongs to `Signal Architecture`, not to this
  dossier.
- Sensory absence may be low presence, concentrated mode, deliberate
  restraint, or insufficient scope rather than an error.
- Stable core sensory categories remain extensible through
  project-defined categories.

### Deferred Questions

- Exact sensory taxonomy, thresholds, and terminology for nonstandard
  sensory categories.

## 34. Acceptance Criteria

This dossier is acceptable only if sensory analysis stays advisory,
non-authoritative, descriptive before judgmental, and compliant with
the shared craft family contract.

This dossier is acceptable only if stable core sensory categories remain
available while project-defined categories can be custom or
intentionally unclassified, and missing-sense absence is never treated
as an automatic defect.
