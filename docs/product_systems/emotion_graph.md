# Emotion Graph

## 1. Status Header

- Dossier name: `Emotion Graph`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Continuity`, `Signal Architecture`, `Memory Lab`, `Companion`, `Relationship Map`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Character Cards`, `Relationship Map`, `Outline`, `Continuity`
- Runtime authority: `future`
- Authority level: `derived`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define Emotion Graph as an optional emotion-support and visualization system that projects manuscript-observed emotional movement, planned emotional targets from existing planning owners, accepted character emotional state references, and advisory emotional analysis without becoming a hidden truth owner or shadow canon.

This dossier inherits output vocabulary from `shared_output_vocabulary_contract.md`, truth ownership limits from `truth_and_state_ownership_matrix.md`, memory and provenance boundaries from `memory_lab.md` and `provenance_state_model.md`, protection rules from `protected_content_permission_matrix.md`, signal boundaries from `signal_architecture.md`, and AI conversion limits from `ai_lifecycle_and_approval_matrix.md`.

## 3. User Problem Solved

The writer needs a way to inspect emotional trajectory, tension, mood, intensity, and pacing-adjacent emotional shape without letting inferred emotional analysis silently replace accepted author intent or canonize interpretation and without collapsing planned target, observed movement, character state, and reader effect into one line.

## 4. What The System Does

Emotion Graph may:

- visualize emotional trajectory, tension, mood, intensity, character emotion, scene or chapter emotion, reader-facing emotional movement, or pacing-adjacent emotional shape,
- display manuscript-observed emotional movement as the ordinary default posture,
- display planned emotional targets from `Author Intent / Story Setup`, `Story Unit`, `Outline`, or `Character Cards` as clearly labeled overlays,
- display accepted structured character emotional condition when the author has accepted it into `Character Cards`,
- display intended reader effect when the author has explicitly saved it in the relevant planning owner,
- display inferred or advisory emotional analysis when clearly labeled,
- use manuscript evidence, author notes, accepted assertions, continuity facts, or advisory analysis,
- help the author inspect emotional movement across narrative work without owning emotional truth,
- compare current movement against selected story periods or selected prototype arrangements,
- produce emotion findings, emotional-arc observations, pressure or pacing candidates, warnings, and recommendations.

## 5. What The System Does Not Do

Emotion Graph does not:

- silently create, alter, delete, or canonize emotional truth,
- replace accepted assertions or explicit author decisions as emotional authority,
- collapse planned emotional target, manuscript-observed movement, accepted character emotional state, intended reader effect, and advisory interpretation into one truth line,
- let inferred emotional analysis become accepted intent automatically,
- let signals, continuity, Memory Lab recall, or Companion summaries become emotional truth automatically,
- require graph interaction before writing,
- become a hidden canon tracker for mood or emotion,
- own character truth, author intent, Memory Lab, Signals, Notes, or export.

## 6. User-Facing Behavior

Visible behavior should emphasize:

- clear distinction between accepted or author-defined emotional intent and inferred or advisory analysis,
- accepted or author-defined emotional intent first in the default view,
- readable emotional shape without false certainty,
- useful filtering and inspection,
- support for author review without truth ownership drift.

## 7. Hidden/Background Behavior

Background behavior may later include:

- inferred emotional candidates,
- tension clustering,
- pacing-adjacent emotion hints,
- continuity-linked emotional warnings,
- signal overlays,
- Companion explanation.

Background behavior must remain advisory and must not silently mutate emotional truth.
Inferred emotion is not confirmed author intent.

## 8. What Appears First

What appears first should stay minimal:

- primary emotional shape,
- accepted or author-defined emotional intent when it exists,
- optional and clearly labeled inferred or advisory emotional cues,
- small signal hints when useful.

## 9. What Is Summonable

Summonable within or around Emotion Graph:

- full emotional detail,
- evidence links,
- candidate emotional interpretations,
- advisory analysis,
- continuity evidence,
- signal detail,
- Memory Lab recall,
- Companion explanation,
- character, relationship, Story Unit, or Outline context.

## 10. What Is Hidden Until Needed

Hidden until needed:

- inferred or advisory emotional analysis beyond the accepted or author-defined default view,
- dense evidence trails,
- old signal history,
- provenance-heavy change history,
- archive references,
- critique-heavy emotional analysis,
- structural overlays that would overwhelm the default graph.

## 11. Inputs

Emotion Graph inputs may include:

- accepted narrative assertions,
- accepted continuity facts,
- manuscript evidence,
- author notes,
- project-level reader emotion or tonal intent from `Author Intent / Story Setup`,
- Story Unit emotional purpose or target,
- Outline-node emotional target or planning notes,
- accepted character emotional condition from `Character Cards`,
- candidate emotional inferences,
- signal summaries,
- governed Memory Lab recall,
- optional Character Card, Relationship Map, Story Unit, or Outline links,
- selected story periods or selected prototype arrangements for comparison-only projection.

## 12. Outputs

Emotion Graph outputs may include:

- manuscript-observed emotional-movement views,
- planned emotional-target overlays,
- accepted character emotional-state references,
- intended reader-effect overlays,
- candidate emotional-interpretation views,
- advisory emotional summaries,
- signal-linked concern views,
- `Memory Lab` recall or reference views,
- `Companion` suggestion views,
- tension or intensity summaries,
- bounded signal overlays,
- cross-links into cards, narrative, continuity, and support surfaces.

These outputs are support projections, not author-owned truth by themselves.
Emotion Graph findings are advisory unless accepted elsewhere.

## 13. Which Other Systems Consume Those Outputs

Likely consumers:

- `Writing Surface`
- `Command Center Surface`
- `Character Cards`
- `Relationship Map`
- `Outline`
- `Continuity`
- `Companion`
- `Memory Lab`

Downstream systems must preserve accepted emotional intent versus candidate interpretation versus advisory analysis boundaries.

## 14. What Gets Stored

Eventually stored:

- graph identity and scope,
- selected story period, selected order basis, or selected prototype context for projection,
- visibility layers, filters, and saved presentation preferences,
- item state labels for manuscript-observed movement reference, planned target overlay, accepted character-state reference, intended reader-effect overlay, candidate item, advisory inference, signal-linked concern, `Memory Lab` recall or reference, `Companion` suggestion, hidden or suppressed item, deleted or discarded item, and masked or excluded-source item,
- source labels such as author note, manuscript evidence, accepted assertion, continuity fact, `Memory Lab` recall, `Companion` suggestion, signal, Outline or Story Unit link, AI inference, and masked summary,
- manuscript-observed movement references,
- planned emotional-target references,
- accepted character-state references,
- candidate emotional-interpretation references,
- optional provenance,
- optional author action history,
- visibility and filter state where needed.
Stored graph material remains support state or candidate material unless accepted elsewhere.

## 14A. Layer 1 - Accepted Source Truth

Emotion Graph may reference accepted source state owned elsewhere.

Those references may include:

- accepted character emotional facts from `Character Cards`
- project-level emotional intent from `Author Intent / Story Setup`
- accepted manuscript evidence from `Narrative Insertion / Narrative Assertion`
- accepted structural or planning context where relevant

These are references, not duplicate authoritative records.

## 14B. Layer 2 - Planned Emotional Development

Planned emotional development represents proposed emotional beats or
trajectories from `Outline`.

It may store:

- planned subject
- proposed emotional state
- intended transition
- timeframe or structural position
- source planning node
- candidate or proposed state
- stale posture after planning or manuscript changes

Planned emotional development remains advisory until accepted by the
relevant truth owner.

## 14C. Layer 3 - Observed Or Detected Movement

Observed or detected movement represents analytical observations rather
than accepted truth.

It may store:

- detected emotional label
- intensity
- change or transition
- source range
- evidence
- confidence
- uncertainty
- competing interpretations
- manuscript-position context

Detection does not establish character truth.

## 14D. Layer 4 - Intended Reader Effect

Intended reader effect is represented separately from character
emotion.

Distinguish:

- author-intended reader effect
- detected likely reader effect
- actual character emotional state
- manuscript tone or pressure
- advisory interpretation

Accepted reader-effect intent routes to `Author Intent / Story Setup`.

## 14E. Identity And Lifecycle

Emotion Graph lifecycle states include:

- create support record
- link source
- propose
- detect
- compare
- review
- revise advisory state
- accept through owner
- dismiss
- expire
- become stale
- supersede
- archive
- restore
- detach
- delete support state

Deleting graph support state must not delete source truth.

## 14F. Time And History

Emotion Graph may represent:

- current emotional state
- prior emotional state
- proposed future state
- bounded-period state
- emotional trajectory
- abrupt change
- unresolved ambiguity
- hidden or suppressed emotion
- character belief versus author-known state
- historical snapshots

A changed emotional state is not automatically a contradiction.

## 14G. Staleness And Conflict

The graph marks stale or unavailable support openly when:

- source prose changes
- assertions split, merge, move, archive, restore, or delete
- Character Card facts change
- Author Intent changes
- Outline plans change
- source anchors become unavailable
- interpretation loses evidence
- visibility restrictions change

The graph must not silently reconstruct or promote stale support.

## 15. What Remains Temporary

Temporary or non-durable:

- inferred emotional suggestions,
- temporary graph layouts,
- unresolved signal overlays,
- advisory summaries,
- transient Companion explanations,
- unsaved recall views.

Candidate emotion material does not equal accepted emotional intent.

## 16. Relationship To Narrative Insertion / Assertion

Durable emotional planning or emotional truth must come from explicit existing owners when it is meant to become author-owned state.

Project-level reader emotion or tonal intent belongs to `Author Intent / Story Setup`.
Story Unit emotional purpose or target belongs to `Story Unit`.
Structural or outline-node emotional target belongs to `Outline`.
Accepted structured character emotional condition belongs to `Character Cards`.
Manuscript-grounded emotional evidence belongs to accepted assertions.

The graph may display or derive from that truth, but it does not replace `Narrative Insertion / Narrative Assertion` as authority.

## 17. Relationship To Story Units

Emotion Graph may reference Story Units for grouped work context and planned emotional purpose, but Story Unit links remain optional and must not make structure the owner of manuscript truth or accepted character truth.

## 18. Relationship To Prose / Scene Projection

Emotion Graph may reference projected prose or scene views as evidence or navigation context.

Projection remains support or display context rather than the source of emotional truth.

## 19. Relationship To Writing Surface

Emotion Graph may support the `Writing Surface` through bounded overlays, quiet indicators, links, or summonable support views.

Direct writing must remain available without requiring graph interaction.

## 20. Relationship To Command Center Surface

`Command Center Surface` may host heavier emotional inspection, filtering, prototype comparison, history review, candidate review, and blocker review workflows.

That support must not turn the Command Center into the owner of emotional truth.
Explicit confirmation is required before accepted emotional intent is created, updated, deleted, restored, bulk accepted or rejected or deleted, or exported or synced or published through graph workflows.

## 21. GUI Placement Principles

Placement rules:

- graphs should stay readable and bounded,
- accepted intent and advisory analysis should stay visually distinct,
- accepted or author-defined emotional intent should appear first by default,
- inferred emotional analysis must be optional, advisory, and visibly labeled,
- dense evidence and history should stay summonable,
- graph views should not become default clutter,
- support surfaces must not overwhelm writing flow.

## 22. Local LLM Role

Possible later local-model roles:

- emotional-shape suggestions,
- tension clustering,
- pacing-adjacent emotion hints,
- bounded summary generation.

Local-model output remains advisory unless explicitly accepted by the author.

## 23. Paid API Role

Possible later paid-model roles:

- deeper long-context emotion analysis,
- large-arc tension review,
- emotional movement comparison,
- broader pacing-emotion synthesis.

Paid-model output remains advisory unless explicitly accepted by the author.

## 24. Model Routing Notes And Cost / Budget Impact

Any model-assisted Emotion Graph flow must preserve:

- author approval where routing rules require it,
- no silent paid or outbound work,
- no silent truth mutation,
- no certainty inflation,
- no substitution of graph views for accepted emotional truth.

## 25. Explicit-Content / Send-Package Handling, If Applicable

If Emotion Graph later participates in model-facing packaging, package handling must preserve:

- masks and AI exclusion zones,
- no raw excluded-text leakage,
- clear distinction between local accepted intent, candidate summaries, and outbound package views.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Privacy and safety rules must ensure:

- hidden or deleted emotional evidence does not leak into graph summaries or recall,
- masked or excluded material stays protected,
- advisory systems do not silently retain protected raw material as emotional truth,
- deleted, hidden, masked, or AI-excluded material does not appear in default views, `Companion` context, `Memory Lab` recall, `Relationship Map` edges, `Emotion Graph` default inference, prototype inputs, package previews, or outbound payloads unless explicitly permitted by the author and allowed by owning-system rules.

## 27. Testing Requirements

Minimum proof set:

- accepted emotional intent stays distinct from candidate or advisory analysis,
- default graph view shows accepted or author-defined emotional intent first,
- inferred emotional analysis remains optional, advisory, and visibly labeled,
- inferred emotional suggestions do not become accepted truth without author action,
- deleted, hidden, masked, or excluded material does not leak into graph summaries,
- Story Unit or Outline links do not become the owner of emotional truth,
- `Memory Lab` and `Companion` use Emotion Graph without turning recall into canon.

## 28. Governance Rules And Risks

Governance rules:

- planned emotional target, manuscript-observed emotional movement, accepted character emotional state, intended reader effect, and inferred or advisory analysis must stay distinct,
- Emotion Graph may display or project emotion but does not own truth,
- no shadow canon,
- no silent truth mutation,
- manuscript-observed movement is the default graph posture, while planned targets remain clearly labeled overlays,
- differences between planned targets and observed movement are review opportunities rather than automatic errors,
- inferred emotion is not confirmed author intent,
- inferred relationship or emotion history remains bounded and temporary unless the author explicitly saves, converts, accepts, dismisses, or marks intentional ambiguity through the relevant owner path,
- Emotion Graph does not own character truth, author intent, Memory Lab, Signals, Notes, or export,
- emotional findings and graph mismatches begin as temporary advisory findings unless accepted elsewhere.

Key risks:

- inferred emotion analysis being mistaken for accepted author intent,
- default graph hiding manuscript-observed movement behind planning overlays,
- default graph mixing planned, observed, and inferred emotional analysis without clear distinction,
- graph views becoming a hidden canon tracker,
- prototype context being mistaken for canon change,
- continuity or signals drifting into graph-owned truth,
- advisory pacing analysis collapsing into accepted emotional truth visually.

## 29. Failure Modes

Expected failure or degraded states:

- conflicting emotional analyses,
- stale planned-versus-observed comparisons after revision or planning change,
- stale candidate interpretations,
- mismatched accepted versus advisory labels,
- graph clutter,
- recall or signal bleed into accepted emotional-intent views.

Containment rules:

- preserve planned-versus-observed-versus-accepted-state boundaries,
- surface staleness honestly when manuscript, planning, or accepted facts change,
- surface conflicts instead of flattening them,
- keep evidence and advisory material clearly labeled,
- require explicit author action for truth mutation.

## 30. v1 Boundary

Minimum approved first version:

- emotional shape display,
- manuscript-observed emotional movement display,
- planned emotional-target overlay display,
- candidate or advisory emotional analysis display,
- clear accepted-versus-candidate distinction,
- bounded links to narrative, continuity, and support systems,
- no AI dependency,
- no truth ownership drift.

## 31. v2 Boundary

Next bounded extension:

- richer filters,
- character and relationship overlays,
- bounded local-model extraction,
- heavier Command Center review support,
- broader multi-arc comparison support.

## 32. Future-Only Boundary

Future-only items:

- automatic canonization of inferred emotional facts,
- graph-owned truth independent of accepted assertions or author decisions,
- silent AI mutation of emotional truth,
- graph systems that replace writing or assertions as the truth source.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently. The governance suite answers the prior hidden-canon and hidden-authority concerns.

### Critical Questions

- What exact emotion taxonomy should ship first?
- What exact evidence and confidence/severity model should emotion analysis use?
- What exact distinction should exist between author-confirmed emotional intent and inferred emotional analysis?
- What exact visibility model should govern emotion history and candidate material?

### Major Questions

- How should signals appear on the graph without turning it into a signal dashboard?
- How should Memory Lab and Companion use the graph without turning recall into truth?
- How should Story Unit and Outline links appear without making structure the truth owner?

### Minor Questions

- Which default emotional dimensions are most useful first?
- Which default filters help readability without clutter?

### Answered / Superseded Questions

- Emotion Graph may visualize emotional trajectory, tension, mood, intensity, character emotion, scene or chapter emotion, reader-facing emotional movement, or pacing-adjacent emotional shape.
- It must distinguish planned emotional target, manuscript-observed movement, accepted character emotional state, intended reader effect, and inferred or advisory emotional analysis.
- It must not silently canonize emotional truth.
- Emotion Graph default view should emphasize manuscript-observed emotional movement first.
- Planned emotional targets may appear as clearly labeled overlays rather than replacing observed movement.
- Inferred emotional analysis must be optional, advisory, visibly labeled, and must not silently canonize emotional truth.
- Each Emotion Graph item may distinguish manuscript-observed movement reference, planned target overlay, accepted character-state reference, intended reader-effect overlay, candidate item, advisory inference, signal-linked concern, `Memory Lab` recall or reference, `Companion` suggestion, hidden or suppressed item, deleted or discarded item, and masked or excluded-source item.
- Every candidate, advisory, or inferred emotional item should preserve a source label such as author note, manuscript evidence, accepted assertion, continuity fact, `Memory Lab` recall, `Companion` suggestion, signal, Outline or Story Unit link, AI inference, or masked summary.
- Durable emotional planning remains in its existing owner by scope, even when the graph projects or visualizes it.
- Candidate emotion material does not equal accepted emotional intent.
- Inferred emotion is not confirmed author intent.
- Emotion Graph does not own character truth, author intent, Memory Lab, Signals, Notes, or export.

### Jason Decision Candidates

### Future Contract Needs

- Exact planned emotional target, observed movement, accepted character-state reference, intended reader-effect overlay, candidate interpretation, and advisory analysis contract.
- Exact item-state and source-label contract.
- Exact create, update, hide, delete, accept, and reject workflow contract.
- Exact signal, continuity, Memory Lab, and Companion display contract for Emotion Graph.
- Exact protection contract for deleted, hidden, masked, and excluded material.
- Exact default-view, filter, prototype-context, and visual-distinction contract for planned versus observed versus inferred analysis.

### Deferred Questions

- Rich reader-emotion forecasting beyond bounded advisory use.
- Deep large-arc AI-assisted emotional analysis.

## 34. Acceptance Criteria

This dossier is acceptable only if it states explicitly that:

- projection containers do not replace narrative foundation authority,
- Story Units are not treated as a mandatory gate by default,
- inferred, derived, or Companion output does not become authored truth without author action,
- the system does not present fake certainty,
- the system does not introduce story grading unless a future explicitly approved tool authorizes it,
- the system does not create dashboard clutter as default behavior,
- the system does not claim hidden runtime authority that the implementation does not actually own,
- active questions live in the dossier instead of only in a giant standalone register,
- active questions live only in the centralized `Pre-Rough Alignment Questionnaire`,
- Fatal and Critical questions are not buried inside a generic open-question list,
- the dossier remains a living investigation file rather than a locked milestone claim.
