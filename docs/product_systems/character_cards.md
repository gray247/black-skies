# Character Cards

## 1. Status Header

- Dossier name: `Character Cards`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Continuity`, `Signal Architecture`, `Memory Lab`, `Companion`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Continuity`, `Relationship Map`, `Emotion Graph`, `Outline`
- Runtime authority: `future`
- Authority level: `accepted structured character truth plus advisory support`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define Character Cards as an optional character-support system that owns accepted structured character truth on a fact-by-fact basis while also organizing candidate facts and advisory material without becoming a hidden prose owner or shadow canon.

## 3. User Problem Solved

The writer needs a stable way to inspect, compare, and update character-related information without scattering character truth across raw notes, memory fragments, or advisory systems that blur accepted facts and inferred guesses together.

## 4. What The System Does

Character Cards may:

- organize character facts, traits, history, goals, relationships, status, and notes,
- own accepted structured character facts once the author explicitly accepts them,
- show accepted author-owned character truth,
- show candidate or advisory character material when clearly labeled,
- surface linked continuity or signal context,
- provide quick cross-links into narrative, structure, and support systems,
- help the author inspect character state without turning the card into canon by itself.

## 5. What The System Does Not Do

Character Cards do not:

- replace `Narrative Insertion / Narrative Assertion` as the source of story truth,
- own manuscript prose or authoritative manuscript order,
- silently create, alter, delete, or canonize character facts,
- let manuscript wording silently create, overwrite, or delete accepted character facts,
- silently rewrite manuscript prose because card truth changed,
- turn inferred analysis into accepted character truth automatically,
- let `Memory Lab`, `Companion`, `Continuity`, or signals become hidden fact owners,
- require card setup before writing,
- become a dumping ground for all lore, critique, archive debris, or unrelated memory.

## 6. User-Facing Behavior

Visible behavior should emphasize:

- clear separation between accepted facts and candidate or advisory material,
- accepted facts first in the default card view,
- low-friction inspection of character status and links,
- bounded updates under author control,
- useful organization without replacing manuscript or assertion authority.

## 7. Hidden/Background Behavior

Background behavior may later include:

- inferred candidate extraction from accepted assertions or manuscript evidence,
- manuscript-derived fact suggestions that remain temporary until the author accepts, saves, or dismisses them,
- continuity-linked character warnings,
- signal summaries,
- Companion explanations,
- Memory Lab recall suggestions.

Background behavior must remain advisory and must not silently mutate accepted character truth.

## 8. What Appears First

What appears first should stay minimal:

- character identity,
- accepted high-value facts when they exist,
- clearly labeled status or role cues,
- tiny candidate or signal indicators when useful.

## 9. What Is Summonable

Summonable within or around Character Cards:

- full accepted fact lists,
- candidate facts,
- advisory notes,
- linked narrative assertions,
- relationship links,
- emotion or tension links,
- continuity evidence,
- signal detail,
- Memory Lab recall,
- Companion explanation.

## 10. What Is Hidden Until Needed

Hidden until needed:

- candidate facts,
- advisory inferences,
- detailed signal views,
- `Memory Lab` recall,
- `Companion` suggestions,
- dense continuity evidence,
- old signal history,
- deep recall trails,
- critique-heavy character analysis,
- archive references,
- provenance-heavy change history,
- raw investigative detail that would crowd the default card view.

## 11. Inputs

Character Card inputs may include:

- accepted narrative assertions,
- accepted character facts,
- accepted continuity facts,
- manuscript evidence,
- author notes,
- author-approved character updates,
- advisory inferences,
- signal summaries,
- governed Memory Lab recall,
- optional Outline or Story Unit links.

## 12. Outputs

Character Card outputs may include:

- accepted character fact views,
- candidate fact views,
- advisory summaries,
- signal-linked concern views,
- `Memory Lab` recall or reference views,
- `Companion` suggestion views,
- relationship links,
- emotion or status summaries,
- bounded signal summaries,
- cross-links into narrative, continuity, structure, or support surfaces.

Accepted character fact views render owner-governed structured truth.
Candidate, planned, disputed, stale, superseded, and other advisory views remain support outputs until explicitly accepted through the character-truth owner path.

## 13. Which Other Systems Consume Those Outputs

Likely consumers:

- `Writing Surface`
- `Command Center Surface`
- `Continuity`
- `Relationship Map`
- `Emotion Graph`
- `Companion`
- `Memory Lab`
- `Outline`

Downstream systems must preserve accepted fact versus candidate versus advisory boundaries.

## 14. What Gets Stored

Eventually stored:

- character identity,
- item state labels for accepted author-owned fact, candidate item, advisory inference, signal-linked concern, `Memory Lab` recall or reference, `Companion` suggestion, hidden or suppressed item, deleted or discarded item, and masked or excluded-source item,
- planning or review posture where needed for facts such as `planned`, `disputed`, `stale`, or `superseded`,
- source labels such as author note, manuscript evidence, accepted assertion, continuity fact, `Memory Lab` recall, `Companion` suggestion, signal, Outline or Story Unit link, AI inference, and masked summary,
- accepted fact references,
- candidate fact references,
- role or status labels,
- linked relationship references,
- linked emotion references,
- provenance,
- author action history where needed,
- visibility state for support views,
- effective story-period or time-bounded fact context where needed.

## 15. What Remains Temporary

Temporary or non-durable:

- inferred character suggestions,
- manuscript-derived temporary suggestions,
- temporary fact candidates,
- unresolved signals,
- advisory summaries,
- transient Companion explanations,
- unsaved Memory Lab recall views.

## 16. Relationship To Narrative Insertion / Assertion

Character Cards may display character-related truth that comes from accepted assertions or other explicit author decisions.
One accepted assertion may support several character facts, and one accepted character fact may be supported by several assertions.

They do not replace `Narrative Insertion / Narrative Assertion` as the truth foundation.

## 17. Relationship To Story Units

Character Cards may reference Story Units when grouped work or revision focus is useful.

Story Unit links remain optional and must not make structure the owner of character truth.

## 18. Relationship To Prose / Scene Projection

Character Cards may reference projected scenes or prose as evidence or navigation context.

Projection remains support or display context rather than the source of character truth.

## 19. Relationship To Writing Surface

Character Cards may support the `Writing Surface` through bounded lookups, links, overlays, or support views.

Direct writing must remain available without requiring card interaction.
Small current-text actions such as `show card`, `attach note`, `propose candidate`, and `view related facts` may live near the `Writing Surface`.
Those actions may create or inspect support items, but they must not bulk-review or silently mutate accepted truth.

## 20. Relationship To Command Center Surface

`Command Center Surface` may host heavier review, filtering, inspection, and candidate-acceptance workflows around Character Cards.

That support must not turn the Command Center into the owner of character truth.
Heavier actions such as candidate review, accept or reject, bulk action, unresolved candidate review, conflict review, signal review, and cleanup workflows belong in `Command Center Surface`.
Explicit confirmation is required for accept as author-owned truth, update accepted truth, delete accepted truth, restore deleted truth, expose hidden, masked, or excluded source, convert advisory inference into accepted fact, bulk accept or reject or delete, and export or sync or publish related card data.

## 21. GUI Placement Principles

Placement rules:

- cards should stay readable and bounded,
- accepted facts should appear clearly distinguished from candidates or advisory material,
- the default card should show accepted facts only, plus tiny candidate or signal indicators,
- dense evidence and history should stay summonable,
- card views should not become dashboard clutter,
- support surfaces must not overwhelm writing flow.

## 22. Local LLM Role

Possible later local-model roles:

- candidate fact extraction,
- consistency hints,
- trait clustering,
- conflict spotting,
- bounded summary generation.

Local-model output remains advisory unless explicitly accepted by the author.

## 23. Paid API Role

Possible later paid-model roles:

- deeper long-context character analysis,
- large-cast comparison,
- contradiction clustering,
- archetype or motivation review.

Paid-model output remains advisory unless explicitly accepted by the author.

## 24. Model Routing Notes And Cost / Budget Impact

Any model-assisted Character Card flow must preserve:

- author approval where routing rules require it,
- no silent paid or outbound work,
- no silent truth mutation,
- no certainty inflation,
- no substitution of card views for accepted author-owned truth.

## 25. Explicit-Content / Send-Package Handling, If Applicable

If Character Cards later participate in model-facing packaging, package handling must preserve:

- masks and AI exclusion zones,
- no raw excluded-text leakage,
- clear distinction between local accepted facts, candidate summaries, and outbound package views.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Privacy and safety rules must ensure:

- hidden or deleted character material does not leak into recall, summaries, or outbound work,
- revelation posture such as unrevealed, partly revealed, revealed, false belief, or disputed knowledge may differ from protection posture such as private, protected, masked, or AI-excluded,
- unrevealed character truth may still be accepted structured truth without appearing in manuscript prose yet,
- masked or excluded material stays protected,
- advisory systems do not silently retain protected raw material as character truth,
- deleted, hidden, masked, or AI-excluded material does not appear in default views, `Companion` context, `Memory Lab` recall, `Relationship Map` edges, `Emotion Graph` inference, prototype inputs, package previews, or outbound payloads unless explicitly permitted by the author and allowed by owning-system rules.

## 27. Testing Requirements

Minimum proof set:

- accepted character facts stay distinct from candidate or advisory material,
- default card view shows accepted facts first without candidate, recall, Companion, or signal detail crowding the card,
- inferred character suggestions do not become accepted truth without author action,
- deleted, hidden, masked, or excluded material does not leak into card summaries,
- Story Unit or Outline links do not become the owner of character truth,
- `Memory Lab` and `Companion` use Character Cards without turning recall into canon.

## 28. Governance Rules And Risks

Governance rules:

- `Character Cards` own accepted structured character truth on a fact-by-fact basis,
- only explicit author acceptance can turn a character candidate, manuscript-derived suggestion, Memory Lab recall, Companion suggestion, continuity finding, import, or AI inference into accepted character truth,
- creating or saving a card does not blanket-accept every fact on it,
- selected facts may be accepted together, but that remains a reviewed fact-level action,
- card-level lifecycle concerns character identity or container state, while fact-level lifecycle concerns accepted, planned, candidate, advisory, disputed, stale, or superseded posture,
- a retired card may still contain historically true accepted facts,
- deleting a card must not delete manuscript prose,
- removing one fact must not delete the card,
- no shadow canon,
- no silent truth mutation,
- no silent prose overwrite from card changes,
- duplicate-card merge or split requires explicit author review and must not silently flatten conflicting facts.

Key risks:

- candidate facts collapsing into accepted truth visually,
- default card clutter causing candidate or advisory material to feel accepted,
- card views becoming a hidden canon tracker,
- `Memory Lab` recall being mistaken for accepted fact,
- `Companion` explanation being mistaken for accepted fact,
- continuity or signals drifting into card-owned truth.

## 29. Failure Modes

Expected failure or degraded states:

- duplicated or conflicting character facts,
- stale accepted facts after manuscript revision,
- intentional divergence that needs explanation rather than auto-repair,
- stale candidate material,
- mismatched accepted versus advisory labels,
- card clutter,
- recall or signal bleed into accepted fact views.

Containment rules:

- preserve accepted fact boundaries,
- surface conflicts instead of flattening them,
- keep evidence and advisory material clearly labeled,
- require explicit author action for truth mutation.

## 30. v1 Boundary

Minimum approved first version:

- character identity,
- accepted fact display,
- planned, candidate, and advisory fact display with accepted truth still visually primary,
- reviewed fact-level acceptance rather than blanket whole-card approval,
- candidate or advisory fact display,
- clear accepted-versus-candidate distinction,
- bounded links to narrative, continuity, and support systems,
- no AI dependency,
- no truth ownership drift.

## 31. v2 Boundary

Next bounded extension:

- stronger relationship links,
- emotion-state support links,
- richer candidate review flows,
- bounded local-model extraction,
- heavier Command Center review support.

## 32. Future-Only Boundary

Future-only items:

- automatic canonization of character facts,
- card-owned truth independent of accepted assertions or author decisions,
- silent AI mutation of character truth,
- card systems that replace writing or assertions as the truth source.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently.

### Critical Questions

- What exact default field grouping and review contract should govern accepted, planned, candidate, disputed, stale, and superseded fact posture without turning those meanings into noisy runtime enums?
- Who may create, update, hide, delete, accept, reject, merge, split, retire, or restore character facts or cards through explicit owner-governed review?
- How must deleted, hidden, masked, unrevealed, or AI-excluded material be protected from card views, recall, retrieval, and summaries?
- What exact time-bounded fact contract should govern changes in age, condition, aliases, relationships, possessions, status, and other story-period-sensitive character truth?

### Major Questions

- How should relationship, emotion, and continuity links appear without cluttering the default card?
- How should signals appear on Character Cards without turning them into a signal dashboard?
- How should Outline and Story Unit links appear without making structure the truth owner?
- How should duplicate-card merge review preserve identity, aliases, accepted facts, planned facts, provenance, linked assertions, notes, signals, memory references, and historical identity without silently combining conflicts?

### Minor Questions

- Which default fields are most useful first?
- Which visual labels best distinguish accepted, candidate, and advisory material?

### Answered / Superseded Questions

- Character Cards may organize facts, traits, history, goals, relationships, status, and notes.
- Character Cards may display accepted author-owned facts and advisory or candidate material, but they must clearly distinguish them.
- `Character Cards` own accepted structured character truth once facts are explicitly author-accepted.
- Only explicit author acceptance can turn a character candidate or fact into author-owned truth.
- Card creation or save does not automatically accept every field.
- Manuscript-derived suggestions remain temporary until explicitly accepted, saved as planned or candidate material, or dismissed.
- Character Cards must not silently create, alter, or canonize character truth.
- Character truth does not silently rewrite manuscript prose, and manuscript prose does not silently rewrite accepted character truth.
- Character Cards default view should show accepted facts only, plus tiny candidate or signal indicators.
- Candidate facts, advisory inference, `Memory Lab` recall, `Companion` suggestions, and signal details must not crowd the default card view.
- `Writing Surface` gets small current-text actions such as `show card`, `attach note`, `propose candidate`, and `view related facts`.
- `Command Center Surface` gets heavier review and management actions such as review candidates, accept or reject, bulk actions, unresolved candidates, conflicts, signals, and cleanup workflows.
- Each Character Card item may distinguish accepted author-owned fact, candidate item, advisory inference, signal-linked concern, `Memory Lab` recall or reference, `Companion` suggestion, hidden or suppressed item, deleted or discarded item, and masked or excluded-source item.
- Every candidate, advisory, or inferred item should preserve a source label such as author note, manuscript evidence, accepted assertion, continuity fact, `Memory Lab` recall, `Companion` suggestion, signal, Outline or Story Unit link, AI inference, or masked summary.
- Direct small actions may create candidate items, attach notes, hide advisory items, dismiss advisory items, or open related sources.
- Explicit confirmation is required for accepting truth, updating accepted truth, deleting or restoring accepted truth, exposing protected source, converting advisory inference into accepted fact, bulk accept or reject or delete, and export or sync or publish related data.
- Character Cards may hold accepted facts only when explicitly author-accepted.

### Jason Decision Candidates

### Future Contract Needs

- Exact accepted fact, candidate fact, and advisory inference contract.
- Exact item-state and source-label contract.
- Exact create, update, hide, delete, accept, and reject workflow contract.
- Exact signal, continuity, Memory Lab, and Companion display contract for Character Cards.
- Exact protection contract for deleted, hidden, masked, and excluded material.
- Exact default-card indicator, expansion, and clutter-boundary contract.
- Exact `Writing Surface` versus `Command Center Surface` action-routing contract for Character Cards.

### Deferred Questions

- Rich comparison views across multiple characters at once.
- Deeper long-context AI-assisted cast analysis.

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
