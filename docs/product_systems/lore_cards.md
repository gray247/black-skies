# Lore Cards

## 1. Status Header

- Dossier name: `Lore Cards`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Continuity`, `Signal Architecture`, `Memory Lab`, `Companion`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Continuity`, `Relationship Map`, `Outline`, `Emotion Graph`
- Runtime authority: `future`
- Authority level: `accepted structured lore truth plus advisory support`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define Lore Cards as an optional world-support system that owns accepted structured world truth on a fact-by-fact basis while also organizing candidate lore and advisory world inferences without becoming a hidden prose owner or shadow canon.

## 3. User Problem Solved

The writer needs a bounded way to inspect world rules, places, objects, organizations, supernatural rules, history, and setting facts without letting recall, notes, or AI-derived world summaries quietly harden into canon.

## 4. What The System Does

Lore Cards may:

- organize world rules, places, objects, organizations, supernatural rules, history, and setting facts,
- own accepted structured lore facts once the author explicitly accepts them,
- show accepted lore,
- show candidate or advisory lore when clearly labeled,
- surface linked continuity or signal context,
- provide structured world references for writing and review,
- support navigation across related world concepts.

## 5. What The System Does Not Do

Lore Cards do not:

- replace accepted narrative assertions or explicit author decisions as lore authority,
- own manuscript prose or authoritative manuscript order,
- silently create, alter, delete, or canonize lore truth,
- let manuscript wording silently create, overwrite, or delete accepted lore facts,
- silently rewrite manuscript prose because lore truth changed,
- turn world inference into accepted lore automatically,
- let `Memory Lab`, `Companion`, `Continuity`, or signals become hidden lore owners,
- require card creation before writing or world discovery can happen,
- become a junk drawer for archive debris, every note fragment, or unrelated critique material.

## 6. User-Facing Behavior

Visible behavior should emphasize:

- clear accepted-versus-candidate-versus-advisory distinction,
- accepted lore first in the default card view,
- low-friction access to world information,
- author-controlled updates,
- support for writing and review without replacing canonical foundations.

## 7. Hidden/Background Behavior

Background behavior may later include:

- candidate lore extraction,
- manuscript-derived lore suggestions that remain temporary until the author accepts, saves, or dismisses them,
- continuity-linked world warnings,
- grouped signal summaries,
- Companion explanation,
- Memory Lab recall suggestions.

Background behavior must remain advisory and must not silently mutate accepted lore.

## 8. What Appears First

What appears first should stay minimal:

- lore identity,
- accepted high-value lore facts when they exist,
- small world-status or rule cues when useful,
- tiny candidate or signal indicators when useful.

## 9. What Is Summonable

Summonable within or around Lore Cards:

- full accepted fact lists,
- candidate lore,
- advisory world notes,
- linked narrative assertions,
- continuity evidence,
- signal detail,
- relationship links,
- Story Unit or Outline links,
- Memory Lab recall,
- Companion explanation.

## 10. What Is Hidden Until Needed

Hidden until needed:

- candidate lore,
- advisory inferences,
- detailed signal views,
- `Memory Lab` recall,
- `Companion` suggestions,
- dense continuity evidence,
- recall trails,
- archived world material,
- old signal history,
- provenance-heavy change history,
- critique-heavy world analysis.

## 11. Inputs

Lore Card inputs may include:

- accepted narrative assertions,
- accepted lore facts,
- accepted continuity facts,
- manuscript evidence,
- author notes,
- author-approved lore updates,
- advisory inferences,
- signal summaries,
- governed Memory Lab recall,
- optional Outline or Story Unit links.

## 12. Outputs

Lore Card outputs may include:

- accepted lore fact views,
- candidate lore views,
- advisory summaries,
- signal-linked concern views,
- `Memory Lab` recall or reference views,
- `Companion` suggestion views,
- world-rule summaries,
- linked relationship views,
- bounded signal summaries,
- cross-links into narrative, continuity, and support surfaces.

Accepted lore fact views render owner-governed structured truth.
Candidate, planned, disputed, stale, superseded, and other advisory views remain support outputs until explicitly accepted through the lore-truth owner path.

## 13. Which Other Systems Consume Those Outputs

Likely consumers:

- `Writing Surface`
- `Command Center Surface`
- `Continuity`
- `Relationship Map`
- `Outline`
- `Companion`
- `Memory Lab`

Downstream systems must preserve accepted lore versus candidate lore versus advisory world inference boundaries.

## 14. What Gets Stored

Eventually stored:

- lore identity,
- item state labels for accepted author-owned fact, candidate item, advisory inference, signal-linked concern, `Memory Lab` recall or reference, `Companion` suggestion, hidden or suppressed item, deleted or discarded item, and masked or excluded-source item,
- planning or review posture where needed for facts such as `planned`, `disputed`, `stale`, or `superseded`,
- source labels such as author note, manuscript evidence, accepted assertion, continuity fact, `Memory Lab` recall, `Companion` suggestion, signal, Outline or Story Unit link, AI inference, and masked summary,
- accepted fact references,
- candidate fact references,
- world-rule or status labels,
- linked relationship references,
- provenance,
- author action history where needed,
- visibility state for support views,
- effective story-period or time-bounded fact context where needed.

## 15. What Remains Temporary

Temporary or non-durable:

- inferred lore suggestions,
- manuscript-derived temporary suggestions,
- temporary lore candidates,
- unresolved signals,
- advisory summaries,
- transient Companion explanations,
- unsaved Memory Lab recall views.

## 15A. Fact Lifecycle And Time-State

Lore facts follow explicit author-governed lifecycle states:

- candidate: a proposed lore fact, imported fact, advisory inference, or
  AI suggestion that has not yet been accepted
- accepted: the author has explicitly accepted the fact in this owner
- revised: an accepted fact is updated by the author
- superseded: a newer accepted fact replaces an older one while
  retaining lineage
- archive: the fact record or supporting container is retained in an
  inactive state
- restore: the archived record returns to review or active use
- reject: a proposed fact is not accepted
- delete: allowed only when the author explicitly removes the fact

Lore facts may represent historical truth, current truth, regional
variation, disputed belief, false in-world belief, secret truth,
author-known truth, character-known belief, or uncertainty. The card
must keep those states distinct instead of collapsing them into one
accepted author truth line.

Manuscript prose may support, contradict, or leave a lore fact
uncertain, but it does not automatically rewrite the card. Contradictions
remain advisory until the author accepts a durable fact change through
this owner.

## 15B. Primary Ownership, Secondary References, And Transfer

Lore-to-lore or world-structure claims normally route to `Lore Cards`.

Mixed character or lore claims route to the domain that principally
asserts the claim. The non-primary domain keeps a secondary reference
only.

Owner transfer must be explicit, preserve provenance, preserve
secondary references, avoid duplicate authoritative records, and
identify the previous and new owner.

## 15C. Contradiction And Review

Factual contradiction detection is advisory.

The card may show conflicting candidates, uncertain evidence, stale
support, or superseded truth, but it must not auto-resolve them.
Rejected or dismissed findings do not become durable fact state.
Accepted resolutions route through the correct owner.

## 15D. Provenance And Protection

Provenance may include direct author entry, manuscript-derived evidence,
imported material, AI suggestions, Continuity findings, Relationship
Map suggestions, merged facts, owner transfer, or supersession history.

Provenance supports explanation and review without displacing author
ownership.

Hidden, protected, excluded, local-only, never-send, and masked
information remains bounded. Secondary references inherit visibility
restrictions where required.

## 16. Relationship To Narrative Insertion / Assertion

Lore Cards may display lore-related truth that comes from accepted assertions or other explicit author decisions.
One accepted assertion may support several lore facts, and one accepted lore fact may be supported by several assertions.

They do not replace `Narrative Insertion / Narrative Assertion` as the truth foundation.
Accepted lore facts can also be referenced by other systems, but those
systems do not become duplicate authoritative records.

## 17. Relationship To Story Units

Lore Cards may reference Story Units when grouped work or revision focus is useful.

Story Unit links remain optional and must not make structure the owner of lore truth.

## 18. Relationship To Prose / Scene Projection

Lore Cards may reference projected prose or scene views as evidence or navigation context.

Projection remains support or display context rather than the source of lore truth.

## 19. Relationship To Writing Surface

Lore Cards may support the `Writing Surface` through bounded lookups, links, overlays, or support views.

Direct writing must remain available without requiring lore-card interaction.
Small current-text actions such as `show card`, `attach note`, `propose candidate`, and `view related facts` may live near the `Writing Surface`.
Those actions may create or inspect support items, but they must not bulk-review or silently mutate accepted truth.

## 20. Relationship To Command Center Surface

`Command Center Surface` may host heavier review, filtering, inspection, and candidate-acceptance workflows around Lore Cards.

That support must not turn the Command Center into the owner of lore truth.
Heavier actions such as candidate review, accept or reject, bulk action, unresolved candidate review, conflict review, signal review, and cleanup workflows belong in `Command Center Surface`.
Explicit confirmation is required for accept as author-owned truth, update accepted truth, delete accepted truth, restore deleted truth, expose hidden, masked, or excluded source, convert advisory inference into accepted fact, bulk accept or reject or delete, and export or sync or publish related card data.

## 21. GUI Placement Principles

Placement rules:

- cards should stay readable and bounded,
- accepted lore should appear clearly distinguished from candidate or advisory material,
- the default card should show accepted lore or rules only, plus tiny candidate or signal indicators,
- dense evidence and history should stay summonable,
- card views should not become dashboard clutter,
- support surfaces must not overwhelm writing flow.

## 22. Local LLM Role

Possible later local-model roles:

- candidate lore extraction,
- consistency hints,
- world-rule clustering,
- contradiction spotting,
- bounded summary generation.

Local-model output remains advisory unless explicitly accepted by the author.

## 23. Paid API Role

Possible later paid-model roles:

- deeper long-context world analysis,
- large-lore consistency review,
- contradiction clustering,
- rule-system review.

Paid-model output remains advisory unless explicitly accepted by the author.

## 24. Model Routing Notes And Cost / Budget Impact

Any model-assisted Lore Card flow must preserve:

- author approval where routing rules require it,
- no silent paid or outbound work,
- no silent truth mutation,
- no certainty inflation,
- no substitution of card views for accepted lore truth.

## 25. Explicit-Content / Send-Package Handling, If Applicable

If Lore Cards later participate in model-facing packaging, package handling must preserve:

- masks and AI exclusion zones,
- no raw excluded-text leakage,
- clear distinction between local accepted lore, candidate summaries, and outbound package views.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Privacy and safety rules must ensure:

- hidden or deleted lore material does not leak into recall, summaries, or outbound work,
- revelation posture such as unrevealed, partly revealed, revealed, false belief, or disputed knowledge may differ from protection posture such as private, protected, masked, or AI-excluded,
- unrevealed lore truth may still be accepted structured truth without appearing in manuscript prose yet,
- masked or excluded material stays protected,
- advisory systems do not silently retain protected raw material as lore truth,
- deleted, hidden, masked, or AI-excluded material does not appear in default views, `Companion` context, `Memory Lab` recall, `Relationship Map` edges, `Emotion Graph` inference, prototype inputs, package previews, or outbound payloads unless explicitly permitted by the author and allowed by owning-system rules.

## 27. Testing Requirements

Minimum proof set:

- accepted lore facts stay distinct from candidate or advisory material,
- default card view shows accepted lore first without candidate, recall, Companion, or signal detail crowding the card,
- inferred lore suggestions do not become accepted truth without author action,
- deleted, hidden, masked, or excluded material does not leak into lore summaries,
- Story Unit or Outline links do not become the owner of lore truth,
- `Memory Lab` and `Companion` use Lore Cards without turning recall into canon.

## 28. Governance Rules And Risks

Governance rules:

- `Lore Cards` own accepted structured world truth on a fact-by-fact basis,
- only explicit author acceptance can turn a lore candidate, manuscript-derived suggestion, Memory Lab recall, Companion suggestion, continuity finding, import, or AI inference into accepted lore truth,
- creating or saving a card does not blanket-accept every fact on it,
- selected facts may be accepted together, but that remains a reviewed fact-level action,
- card-level lifecycle concerns world-entity identity or container state, while fact-level lifecycle concerns accepted, planned, candidate, advisory, disputed, stale, or superseded posture,
- a retired card may still contain historically true accepted facts,
- deleting a card must not delete manuscript prose,
- removing one fact must not delete the card,
- no shadow canon,
- no silent truth mutation,
- no silent prose overwrite from card changes,
- duplicate-card merge or split requires explicit author review and must not silently flatten conflicting facts.

Key risks:

- candidate lore collapsing into accepted lore visually,
- default card clutter causing candidate or advisory material to feel accepted,
- card views becoming a hidden canon tracker,
- `Memory Lab` recall being mistaken for accepted lore,
- `Companion` explanation being mistaken for accepted lore,
- continuity or signals drifting into card-owned truth.

## 29. Failure Modes

Expected failure or degraded states:

- duplicated or conflicting lore facts,
- stale accepted facts after manuscript revision,
- intentional divergence that needs explanation rather than auto-repair,
- stale candidate material,
- mismatched accepted versus advisory labels,
- card clutter,
- recall or signal bleed into accepted lore views.

Containment rules:

- preserve accepted lore boundaries,
- surface conflicts instead of flattening them,
- keep evidence and advisory material clearly labeled,
- require explicit author action for truth mutation.

## 30. v1 Boundary

Minimum approved first version:

- lore identity,
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
- richer candidate review flows,
- bounded local-model extraction,
- heavier Command Center review support,
- linked world-rule comparison views.

## 32. Future-Only Boundary

Future-only items:

- automatic canonization of lore facts,
- card-owned truth independent of accepted assertions or author decisions,
- silent AI mutation of lore truth,
- card systems that replace writing or assertions as the truth source.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently.

### Critical Questions

- What exact default field grouping and review contract should govern accepted, planned, candidate, disputed, stale, and superseded fact posture without turning those meanings into noisy runtime enums?
- Who may create, update, hide, delete, accept, reject, merge, split, retire, or restore lore facts or cards through explicit owner-governed review?
- How must deleted, hidden, masked, unrevealed, or AI-excluded material be protected from card views, recall, retrieval, and summaries?
- What exact time-bounded fact contract should govern changing world rules, locations, organizations, memberships, possessions, history states, and other story-period-sensitive lore truth?

### Major Questions

- How should relationship, continuity, and world-rule links appear without cluttering the default card?
- How should signals appear on Lore Cards without turning them into a signal dashboard?
- How should Outline and Story Unit links appear without making structure the truth owner?
- How should duplicate-card merge review preserve identity, aliases, accepted facts, planned facts, provenance, linked assertions, notes, signals, memory references, and historical identity without silently combining conflicts?

### Minor Questions

- Which default world fields are most useful first?
- Which visual labels best distinguish accepted, candidate, and advisory lore material?

### Answered / Superseded Questions

- Lore Cards may organize world rules, places, objects, organizations, supernatural rules, history, and setting facts.
- Lore Cards may display accepted lore and advisory or candidate lore, but they must clearly distinguish them.
- `Lore Cards` own accepted structured world truth once facts are explicitly author-accepted.
- Only explicit author acceptance can turn lore candidates into author-owned truth.
- Card creation or save does not automatically accept every field.
- Manuscript-derived suggestions remain temporary until explicitly accepted, saved as planned or candidate material, or dismissed.
- Lore Cards must not silently create, alter, or canonize lore truth.
- Lore truth does not silently rewrite manuscript prose, and manuscript prose does not silently rewrite accepted lore truth.
- Lore Cards default view should show accepted lore or rules only, plus tiny candidate or signal indicators.
- Candidate lore, advisory inference, `Memory Lab` recall, `Companion` suggestions, and signal details must not crowd the default card view.
- `Writing Surface` gets small current-text actions such as `show card`, `attach note`, `propose candidate`, and `view related facts`.
- `Command Center Surface` gets heavier review and management actions such as review candidates, accept or reject, bulk actions, unresolved candidates, conflicts, signals, and cleanup workflows.
- Each Lore Card item may distinguish accepted author-owned fact, candidate item, advisory inference, signal-linked concern, `Memory Lab` recall or reference, `Companion` suggestion, hidden or suppressed item, deleted or discarded item, and masked or excluded-source item.
- Every candidate, advisory, or inferred item should preserve a source label such as author note, manuscript evidence, accepted assertion, continuity fact, `Memory Lab` recall, `Companion` suggestion, signal, Outline or Story Unit link, AI inference, or masked summary.
- Direct small actions may create candidate items, attach notes, hide advisory items, dismiss advisory items, or open related sources.
- Explicit confirmation is required for accepting truth, updating accepted truth, deleting or restoring accepted truth, exposing protected source, converting advisory inference into accepted fact, bulk accept or reject or delete, and export or sync or publish related data.
- Lore Cards may hold accepted lore only when explicitly author-accepted.

### Jason Decision Candidates

### Future Contract Needs

- Exact accepted lore, candidate lore, and advisory inference contract.
- Exact item-state and source-label contract.
- Exact create, update, hide, delete, accept, and reject workflow contract.
- Exact signal, continuity, Memory Lab, and Companion display contract for Lore Cards.
- Exact protection contract for deleted, hidden, masked, and excluded material.
- Exact default-card indicator, expansion, and clutter-boundary contract.
- Exact `Writing Surface` versus `Command Center Surface` action-routing contract for Lore Cards.

### Deferred Questions

- Rich comparison views across many world entities at once.
- Deeper long-context AI-assisted world synthesis.

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
