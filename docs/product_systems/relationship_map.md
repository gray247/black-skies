# Relationship Map

## 1. Status Header

- Dossier name: `Relationship Map`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Character Cards`, `Lore Cards`, `Continuity`, `Signal Architecture`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Character Cards`, `Lore Cards`, `Emotion Graph`, `Companion`
- Runtime authority: `future`
- Authority level: `derived`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define Relationship Map as an optional visualization and relationship-support system that projects accepted relationship truth, candidate relationship facts, and advisory relationship inferences without becoming a hidden truth owner or shadow canon.

## 3. User Problem Solved

The writer needs a way to inspect and compare relationships between people, places, groups, objects, lore entities, and structural work areas without forcing relationship meaning to live only in prose, memory, or inferred graphs.

## 4. What The System Does

Relationship Map may:

- visualize relationships between characters, groups, places, objects, lore, and Story Units,
- show emotional, factual, conflict, alliance, family, power, dependency, and timeline relationships,
- display accepted relationship facts,
- display candidate or advisory relationship inferences when clearly labeled,
- project relationship shape across narrative support systems,
- help the author inspect relationship change without owning the underlying truth.

## 5. What The System Does Not Do

Relationship Map does not:

- silently create, alter, delete, or canonize relationship truth,
- replace accepted assertions or explicit author decisions as relationship authority,
- let graph presence imply accepted fact,
- turn signals, continuity, Memory Lab recall, or Companion summaries into relationship truth automatically,
- require map interaction before writing,
- become a hidden social-graph canon store.

## 6. User-Facing Behavior

Visible behavior should emphasize:

- clearly labeled accepted versus candidate versus advisory relationship edges,
- readable visualization without false certainty,
- useful filtering and inspection,
- support for author review without truth ownership drift.

## 7. Hidden/Background Behavior

Background behavior may later include:

- inferred relationship candidates,
- conflict clustering,
- relationship change hints,
- continuity-linked relationship warnings,
- signal overlays,
- Companion explanation.

Background behavior must remain advisory and must not silently mutate relationship truth.

## 8. What Appears First

What appears first should stay minimal:

- primary entities,
- accepted high-value links when they exist,
- clearly labeled candidate or advisory link cues,
- small signal hints when useful.

## 9. What Is Summonable

Summonable within or around Relationship Map:

- full relationship detail,
- evidence links,
- candidate relationships,
- advisory inferences,
- continuity evidence,
- signal detail,
- Memory Lab recall,
- Companion explanation,
- Story Unit or Outline context.

## 10. What Is Hidden Until Needed

Hidden until needed:

- dense evidence trails,
- old signal history,
- provenance-heavy change history,
- archive references,
- critique-heavy relationship analysis,
- structural overlays that would overwhelm the default map.

## 11. Inputs

Relationship Map inputs may include:

- accepted narrative assertions,
- accepted character facts,
- accepted lore facts,
- accepted continuity facts,
- manuscript evidence,
- author notes,
- candidate relationship inferences,
- signal summaries,
- governed Memory Lab recall,
- optional Story Unit or Outline links.

## 12. Outputs

Relationship Map outputs may include:

- accepted relationship views,
- candidate relationship views,
- advisory relationship summaries,
- emotional or factual link summaries,
- bounded signal overlays,
- cross-links into cards, narrative, continuity, and support surfaces.

These outputs are support projections, not author-owned truth by themselves.

## 13. Which Other Systems Consume Those Outputs

Likely consumers:

- `Writing Surface`
- `Command Center Surface`
- `Character Cards`
- `Lore Cards`
- `Emotion Graph`
- `Continuity`
- `Companion`
- `Memory Lab`

Downstream systems must preserve accepted relationship fact versus candidate versus advisory boundaries.

## 14. What Gets Stored

Eventually stored:

- entity identities and references,
- accepted relationship references,
- candidate relationship references,
- relationship type labels,
- optional provenance,
- optional author action history,
- visibility and filter state where needed.

## 15. What Remains Temporary

Temporary or non-durable:

- inferred relationship suggestions,
- temporary edge layouts,
- unresolved signal overlays,
- advisory summaries,
- transient Companion explanations,
- unsaved recall views.

## 16. Relationship To Narrative Insertion / Assertion

Durable relationship facts must come from accepted assertions or other explicit author decisions.

The map may display or derive from that truth, but it does not replace `Narrative Insertion / Narrative Assertion` as authority.

## 17. Relationship To Story Units

Relationship Map may reference Story Units for grouped work context, but Story Unit links remain optional and must not make structure the owner of relationship truth.

## 18. Relationship To Prose / Scene Projection

Relationship Map may reference projected prose or scenes as evidence or navigation context.

Projection remains support or display context rather than the source of relationship truth.

## 19. Relationship To Writing Surface

Relationship Map may support the `Writing Surface` through bounded overlays, links, or support views.

Direct writing must remain available without requiring map interaction.

## 20. Relationship To Command Center Surface

`Command Center Surface` may host heavier relationship inspection, filtering, candidate review, and blocker review workflows.

That support must not turn the Command Center into the owner of relationship truth.

## 21. GUI Placement Principles

Placement rules:

- maps should stay readable and bounded,
- accepted and candidate relationships should stay visually distinct,
- dense evidence and history should stay summonable,
- map views should not become default clutter,
- support surfaces must not overwhelm writing flow.

## 22. Local LLM Role

Possible later local-model roles:

- relationship candidate extraction,
- conflict clustering,
- alliance or dependency hints,
- bounded summary generation.

Local-model output remains advisory unless explicitly accepted by the author.

## 23. Paid API Role

Possible later paid-model roles:

- deeper long-context relationship analysis,
- large-network review,
- contradiction clustering,
- broader relationship-shape comparison.

Paid-model output remains advisory unless explicitly accepted by the author.

## 24. Model Routing Notes And Cost / Budget Impact

Any model-assisted Relationship Map flow must preserve:

- author approval where routing rules require it,
- no silent paid or outbound work,
- no silent truth mutation,
- no certainty inflation,
- no substitution of map views for accepted relationship truth.

## 25. Explicit-Content / Send-Package Handling, If Applicable

If Relationship Map later participates in model-facing packaging, package handling must preserve:

- masks and AI exclusion zones,
- no raw excluded-text leakage,
- clear distinction between local relationship truth, candidate summaries, and outbound package views.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Privacy and safety rules must ensure:

- hidden or deleted relationship evidence does not leak into map summaries or recall,
- masked or excluded material stays protected,
- advisory systems do not silently retain protected raw material as relationship truth.

## 27. Testing Requirements

Minimum proof set:

- accepted relationship facts stay distinct from candidate or advisory inferences,
- inferred relationship suggestions do not become accepted truth without author action,
- deleted, hidden, masked, or excluded material does not leak into relationship summaries,
- Story Unit or Outline links do not become the owner of relationship truth,
- `Memory Lab` and `Companion` use Relationship Map without turning recall into canon.

## 28. Governance Rules And Risks

Governance rules:

- durable relationship facts must come from accepted truth or explicit author acceptance,
- Relationship Map may display or project relationships but does not own truth,
- no shadow canon,
- no silent truth mutation.

Key risks:

- graph edges being mistaken for accepted fact,
- inferred relationship analysis collapsing into accepted truth visually,
- map views becoming a hidden canon tracker,
- continuity or signals drifting into graph-owned truth.

## 29. Failure Modes

Expected failure or degraded states:

- duplicated or conflicting relationship edges,
- stale candidate links,
- mismatched accepted versus advisory labels,
- layout clutter,
- recall or signal bleed into accepted relationship views.

Containment rules:

- preserve accepted relationship boundaries,
- surface conflicts instead of flattening them,
- keep evidence and advisory material clearly labeled,
- require explicit author action for truth mutation.

## 30. v1 Boundary

Minimum approved first version:

- entity nodes,
- accepted relationship display,
- candidate or advisory relationship display,
- clear accepted-versus-candidate distinction,
- bounded links to cards, narrative, continuity, and support systems,
- no AI dependency,
- no truth ownership drift.

## 31. v2 Boundary

Next bounded extension:

- richer filters,
- emotion-state link overlays,
- bounded local-model extraction,
- heavier Command Center review support,
- broader multi-entity comparison support.

## 32. Future-Only Boundary

Future-only items:

- automatic canonization of inferred relationship facts,
- graph-owned truth independent of accepted assertions or author decisions,
- silent AI mutation of relationship truth,
- map systems that replace writing or assertions as the truth source.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- What exact authority model prevents Relationship Map from drifting into a hidden relationship canon separate from accepted assertions and explicit author decisions?

### Critical Questions

- What exact accepted relationship fact versus candidate relationship versus advisory inference state model is required?
- Who may create, update, hide, delete, accept, or reject relationship facts?
- How must deleted, hidden, masked, or excluded material be protected from map views, recall, and summaries?

### Major Questions

- How should signals appear on the map without turning it into a signal dashboard?
- How should Memory Lab and Companion use the map without turning recall into truth?
- How should Story Unit and Outline links appear without making structure the truth owner?

### Minor Questions

- Which default relationship types are most useful first?
- Which default filters help readability without clutter?

### Answered / Superseded Questions

- Relationship Map may visualize relationships between characters, groups, places, objects, lore, and Story Units.
- It may show emotional, factual, conflict, alliance, family, power, dependency, and timeline relationships.
- It displays or projects relationships but does not own truth.
- Durable relationship facts must come from author-owned truth or explicit author acceptance.

### Jason Decision Candidates

- What smallest default accepted-relationship view is useful without causing graph clutter?
- Which actions belong in `Writing Surface` versus `Command Center Surface` for relationship review and acceptance?

### Future Contract Needs

- Exact accepted relationship, candidate relationship, and advisory inference contract.
- Exact create, update, hide, delete, accept, and reject workflow contract.
- Exact signal, continuity, Memory Lab, and Companion display contract for Relationship Map.
- Exact protection contract for deleted, hidden, masked, and excluded material.

### Deferred Questions

- Rich multi-layer timeline overlays.
- Deep large-network AI-assisted relationship analysis.

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
