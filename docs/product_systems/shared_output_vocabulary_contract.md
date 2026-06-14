# Shared Output Vocabulary Contract

## 1. Purpose

Define the canonical vocabulary for outputs produced by intelligence, analysis, advisory, and finding-producing systems.

This artifact exists so `Critique`, `Continuity`, `Theme System`, `Relationship Map`, `Emotion Graph`, `Companion`, `Plugin / Rubric System`, and future analysis systems do not invent incompatible meanings for findings, candidates, acceptance, dismissal, retention, conversion, or expiry.

## 2. Scope

This contract governs:

- output object classes
- shared lifecycle states
- conversion rules into truth, notes, signals, memory, rewrite work, and export
- cross-system behavior for analysis and advisory producers
- expiry and retention posture
- conservative failure behavior when classification is unclear

This contract applies across:

- `Critique / Evaluation`
- `Continuity`
- `Theme System`
- `Relationship Map`
- `Emotion Graph`
- `Companion`
- `Plugin / Rubric System`
- future analysis systems

This contract also constrains downstream handoffs into:

- `Signal Architecture`
- `Feedback Notes / Revision Resolution`
- `Memory Lab`
- `Draft Generation / Rewrite Loop`
- `Authorship Provenance AI Visibility`

## 3. Non-Goals

- redesign of any individual intelligence dossier
- runtime schema
- GUI workflow design
- exact severity or confidence scoring models
- prompt design
- provider-specific AI behavior
- storage implementation

## 4. Core Doctrine

- Advisory output is not truth.
- Advisory output is not canon.
- Advisory output is not accepted manuscript.
- Advisory output is not durable signal state.
- Advisory output is not durable note state.
- Advisory output is not durable memory.
- Advisory output is not export content by default.
- Author authority overrides findings.
- A producing system may observe, compare, infer, summarize, recommend, or warn without owning the downstream durable object.
- Conversion may happen only through the target owning system and the approval path already defined by higher governance contracts.

## 5. Output Object Taxonomy

| Output object | Meaning | Owner | Truth status | Retention posture | Conversion eligibility |
| --- | --- | --- | --- | --- | --- |
| `observation` | a bounded descriptive record of what was seen, compared, or detected without judgment | producing system | non-truth | temporary by default; may be kept as bounded advisory history | may support findings, comparison results, or evidence bundles |
| `finding` | a labeled advisory conclusion grounded in evidence, comparison, or analysis | producing system | non-truth | temporary or bounded advisory history | may become a candidate for note, signal, memory, or rewrite framing |
| `insight` | a higher-level interpretive or explanatory finding that helps the author understand a pattern or implication | producing system | non-truth | temporary by default | may become note candidate or advisory memory only through owner-governed path |
| `recommendation` | a suggested action, priority, or review next step | producing system | non-truth | temporary by default | may become note candidate, rewrite candidate, routing recommendation, or governance recommendation |
| `warning` | a highlighted risk, contradiction, omission, drift, or protection concern that warrants attention | producing system | non-truth | bounded advisory history when useful | may become signal candidate or note candidate |
| `candidate` | a proposed downstream artifact not yet accepted by the owning system | target intake owner after handoff, otherwise producing system | non-truth | temporary until accepted, dismissed, parked, expired, or converted | may become a more specific candidate class only through explicit classification |
| `signal candidate` | a proposed signal handoff for `Signal Architecture` review | `Signal Architecture` intake | non-truth | temporary until normalized, dismissed, expired, or converted into durable signal state | may become durable signal only through `Signal Architecture` and `T2 + T6` |
| `note candidate` | a proposed note for `Feedback Notes / Revision Resolution` review | `Feedback Notes / Revision Resolution` intake | non-truth | temporary until accepted, dismissed, parked, or expired | may become durable note only through note owner and required approval |
| `memory candidate` | a proposed retained advisory memory for `Memory Lab` review | `Memory Lab` intake | non-truth | temporary until retained, dismissed, forgotten, or expired | may become durable advisory memory only through `Memory Lab` and required approval |
| `rewrite candidate` | a proposed rewrite direction, rewrite prompt, or generated rewrite option | `Draft Generation / Rewrite Loop` until truth-owner acceptance | non-truth | temporary comparison or rewrite-prep state | may become generated output, then accepted manuscript only through truth owner |
| `comparison result` | a bounded comparison between sources, versions, or interpretations | producing system | non-truth | temporary by default; may persist as bounded advisory history if useful | may support findings, warnings, or recommendations |
| `continuity finding` | an advisory continuity-specific finding about contradiction, omission, causality, or drift | `Continuity` | non-truth | temporary or bounded continuity history | may become signal candidate, note candidate, advisory memory, or explicit truth candidate through owner-governed path |
| `critique finding` | an advisory critique-specific evaluation result, issue, or ranked concern | `Critique / Evaluation` | non-truth | temporary or bounded critique history | may become signal candidate, note candidate, rewrite candidate, or advisory memory |
| `theme finding` | an advisory thematic interpretation, linkage, or thematic concern | `Theme System` | non-truth | temporary by default | may become candidate theme note, advisory memory, or explicit accepted theme intent through owner-governed path |
| `relationship finding` | an advisory relationship inference, candidate link, or relationship concern | `Relationship Map` | non-truth | temporary or bounded map history | may become note candidate, signal candidate, advisory memory, or accepted relationship truth only through truth owner |
| `emotion finding` | an advisory emotional interpretation, intensity concern, or emotional-shape inference | `Emotion Graph` | non-truth | temporary or bounded graph history | may become note candidate, signal candidate, advisory memory, or accepted emotional intent only through truth owner |
| `routing recommendation` | a suggestion about local/manual/heavy/paid route suitability | producing system until routing owner review | non-truth | temporary by default | may inform `Model Routing And Budget Architecture`; may not become route decision automatically |
| `governance recommendation` | a suggestion that approval, masking, protection, or refusal review may be needed | producing system until policy owner review | non-truth | temporary by default | may inform protected-content, routing, or handoff decisions; may not become policy automatically |

## 6. Shared Lifecycle States

### 6.1 State Definitions

| State | Meaning | Owner | Allowed transitions | Forbidden transitions |
| --- | --- | --- | --- | --- |
| `created` | the output now exists as a newly produced advisory artifact | producing system | `reviewed`, `dismissed`, `expired`, `parked` | direct jump to accepted truth, durable signal, durable note, durable memory, or export |
| `reviewed` | a human or owning system has explicitly inspected the output | producing system until handoff, then target owner for target-specific decisions | `accepted`, `rejected`, `dismissed`, `parked`, `converted`, `resolved`, `retained`, `superseded` | silent auto-conversion to any durable or truth state |
| `accepted` | the output has been explicitly accepted as meaningful within its own owner-governed lane | target owner or producing system where acceptance is local-only | `converted`, `retained`, `resolved`, `superseded` | interpreting acceptance as truth by default |
| `rejected` | the reviewed output is explicitly declined as not fit for downstream use | current decision owner | `superseded`, `expired` | direct conversion to durable state without new review |
| `dismissed` | the output is judged not worth active surfacing or action | current decision owner | `superseded`, `expired` | silent reactivation as active output |
| `parked` | the output is intentionally kept for later review without acceptance | current decision owner | `reviewed`, `accepted`, `dismissed`, `expired`, `superseded` | silent durable retention as memory, note, or signal without owner path |
| `converted` | the output has been explicitly handed off into another artifact class | target owning system | depends on target class lifecycle | conversion straight into truth/export without target owner and approval |
| `resolved` | the attention loop for the output is closed, whether by acceptance, dismissal, suppression, or downstream action | current decision owner | `superseded` or bounded historical retention | treating resolution as truth mutation by itself |
| `retained` | the output or a derivative summary has been explicitly kept as bounded advisory history or memory | durable-state owner | `forgotten`, `superseded`, `expired`, `resolved` | retaining raw protected content against higher contracts |
| `forgotten` | retained advisory material has been intentionally removed from active recall | `Memory Lab` or relevant retention owner | `superseded` only, or later explicit recovery under separate contract | silent reactivation as active recall |
| `expired` | the output is no longer relevant enough to surface actively | current owner or durable-state owner | `superseded` only, or bounded historical reference if preserved | silent return to active status without review |
| `superseded` | a newer or stronger output, source, or decision replaces the older one | current owner or downstream owner | bounded historical retention, `expired` | old output silently regaining priority over newer accepted state |

### 6.2 Shared Rules

- `accepted` means accepted within the current advisory lane unless the target owner explicitly says otherwise.
- `accepted` does not mean accepted truth by default.
- `resolved` closes attention, not authority.
- `retained` means purposefully kept, not canonized.
- `expired` and `superseded` are different:
  - `expired` means no longer timely or relevant enough to surface
  - `superseded` means replaced by newer evidence, new writing, or a stronger decision

## 7. Conversion Rules

### 7.1 May a Finding Become Truth?

Yes, but only through a truth owner:

- manuscript or assertion truth -> `Narrative Insertion / Assertion`
- lore truth -> lore truth owner
- character truth -> character truth owner
- project truth -> provisional parked owner in `Workflow Spine / Author Journey`

Required path:

- explicit review
- explicit author action
- target truth owner acceptance
- approval tier `T2 + T6` minimum

No producing system may convert its own finding directly into accepted truth.

### 7.2 May a Finding Become Signal?

Yes, but only through `Signal Architecture`.

Required path:

- produce `signal candidate`
- preserve source trace and protection state
- `Signal Architecture` accepts or rejects
- approval tier `T2 + T6` for durable signal creation

### 7.3 May a Finding Become Note?

Yes, but only through `Feedback Notes / Revision Resolution`.

Required path:

- produce `note candidate`
- preserve anchor and source context
- note owner accepts or rejects
- AI-origin durable note creation requires explicit acceptance and `T2 + T6`

### 7.4 May a Finding Become Memory?

Yes, but only through `Memory Lab`.

Required path:

- produce `memory candidate`
- preserve memory type and source trace
- `Memory Lab` decides retention
- approval tier `T2 + T6`

Raw protected or excluded content may not become durable memory automatically.

### 7.5 May a Finding Become Rewrite?

Yes, but only through `Draft Generation / Rewrite Loop`, and then only into accepted manuscript through the truth owner.

Required path:

- produce `rewrite candidate`
- optional rewrite or generation run under routing/approval rules
- resulting output remains advisory
- truth owner accepts manuscript change through explicit author action

### 7.6 May a Finding Become Export Content?

Not directly.

Findings may appear in export only if a later explicit export mode exists and `Import Export Document Interchange` owns the transfer.

Until that mode exists:

- findings are not default export content
- critique, graph, and similar advisory outputs remain non-export by default or `T5` future-only where already declared

## 8. Cross-System Output Behavior Rules

### 8.1 `Critique / Evaluation`

May produce:

- critique findings
- comparison results
- warnings
- recommendations
- signal candidates
- note candidates
- rewrite candidates

May not produce:

- accepted truth
- durable signals
- durable notes
- durable memory
- export artifacts

### 8.2 `Continuity`

May produce:

- continuity findings
- contradiction candidates
- unresolved-causality warnings
- evidence bundles
- signal candidates
- note candidates or truth-support candidates only through explicit review framing

May not produce:

- accepted continuity truth
- durable signal state
- silent rewrite

### 8.3 `Theme System`

May produce:

- theme findings
- candidate theme notes
- advisory theme suggestions
- bounded thematic recommendations

May not produce:

- accepted theme intent automatically
- thematic canon
- automatic grading authority

### 8.4 `Relationship Map`

May produce:

- relationship findings
- candidate relationship views
- advisory relationship summaries
- bounded signal-linked concern views

May not produce:

- accepted relationship truth automatically
- shadow canon through graph presence
- durable signal or note state on its own

### 8.5 `Emotion Graph`

May produce:

- emotion findings
- candidate emotional interpretations
- advisory emotional summaries
- bounded signal-linked concern views

May not produce:

- accepted emotional intent automatically
- silent emotional canon
- durable signal or note state on its own

### 8.6 `Companion`

May produce:

- observations
- bounded recommendations
- routing recommendations
- governance recommendations
- explanatory summaries
- signal candidates only where higher contracts already allow the handoff

May not produce:

- durable signal state
- durable note state
- durable memory
- accepted truth
- hidden policy decisions

`Companion` may explain outputs from stronger systems, but it does not own their findings or conversions.

### 8.7 `Plugin / Rubric System`

May produce:

- rubric findings
- plugin findings
- bounded comparisons
- support summaries
- signal candidates where allowed

May not produce:

- accepted truth
- durable signal state directly
- durable note state directly
- generic hidden critique authority

### 8.8 Future Analysis Systems

Until a later dossier says otherwise, future analysis systems may produce only:

- observations
- findings
- insights
- recommendations
- warnings
- candidates

They may not automatically produce:

- truth
- canon
- durable signal state
- durable note state
- durable memory
- export content

## 9. Expiry And Retention Rules

- Most outputs begin temporary.
- Bounded advisory history is allowed only when it serves review, traceability, learning, or future comparison.
- Output should expire when:
  - source text changed enough to invalidate it
  - a newer output superseded it
  - it no longer justifies active attention
  - it never gained acceptance or retention value
- Output becomes stale when:
  - evidence drift occurred
  - major rewrite or reclassification occurred
  - its source anchor or scope changed materially
- `stale` is a condition, not a canonical shared lifecycle state in this contract.
  Systems may use it as a subtype or explanatory flag that usually leads toward `reviewed`, `expired`, or `superseded`.
- Retention should prefer:
  - accepted downstream derivatives
  - minimal provenance
  - concise summaries
  - bounded advisory history
- Retention should avoid:
  - raw protected payloads
  - indefinite storage of low-value advisory debris
  - shadow memory outside `Memory Lab`

## 10. Author Authority Rules

- Author authority overrides any finding, insight, warning, or recommendation.
- Producing systems may challenge, compare, and recommend; they may not overrule.
- Advisory acceptance is not the same as truth acceptance unless the truth owner performs the conversion.
- Findings do not become canon because they are repeated, ranked highly, or shown in multiple surfaces.
- Multi-surface visibility does not increase authority.
- Retention does not increase authority.
- Provenance does not increase authority.

## 11. Failure Behavior

If output classification is unclear:

- classify conservatively
- downgrade to `observation`, `finding`, or generic `candidate`
- require review before any downstream durable conversion
- avoid automatic conversion
- avoid automatic retention
- avoid automatic export classification
- preserve direct writing and non-destructive review paths

## 12. Future Alignment Targets

- `critique_evaluation.md`
- `continuity.md`
- `theme_system.md`
- `relationship_map.md`
- `emotion_graph.md`
- `companion.md`
- `signal_architecture.md`
- `feedback_notes_revision_resolution.md`
- `memory_lab.md`
- `draft_generation_rewrite_loop.md`
- `plugin_rubric_system.md`
- `authorship_provenance_ai_visibility.md`
- `workflow_spine_author_journey.md`

## 13. Remaining Critical Questions

- Which exact advisory-output subclasses should gain shared severity, confidence, or evidence-grade fields first?
- Should `accepted` remain available as a local advisory state in every producer, or should some systems prefer `reviewed` plus `converted` only?
- What exact bounded history should remain visible by default for dismissed, parked, expired, or superseded outputs?
- Which future export modes, if any, may safely include non-truth advisory outputs without flattening authority layers?
- What exact provenance field minimum should distinguish created, reviewed, accepted, dismissed, parked, converted, retained, forgotten, expired, and superseded states?

## 14. Acceptance Criteria

This contract is acceptable only if:

- output object meanings are explicit enough to stop dossier drift
- lifecycle states are shared enough to normalize downstream handoffs
- producing systems cannot silently become truth, signal, note, memory, or export owners
- advisory outputs remain clearly separate from accepted truth and durable state
- expiry and supersession are explicit enough to prevent permanent low-value advisory clutter
- future dossier alignment can inherit this contract instead of re-creating its own incompatible vocabulary
