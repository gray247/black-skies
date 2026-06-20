# Story Unit

## 1. Status Header

- Dossier name: `Story Unit`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-17`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Writing Surface`, `Command Center Surface`, `Prose / Scene Projection`
- Feeds into: `Outline`, `Continuity`, `Critique`, `Relationship Map`, `Memory Lab`, `Feedback Notes / Revision Resolution`
- Runtime authority: `future`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define Story Unit as an optional flexible grouping and work-container system that helps package work, cluster related narrative material, and provide durable working anchors without replacing the smaller narrative foundation or turning grouped material into manuscript truth.

## 3. User Problem Solved

The writer needs a durable way to group or span related narrative work without being forced to write only in raw prose, only in planning nodes, or only inside projection containers.

## 4. What The System Does

The Story Unit system:

- provides an author-facing grouping, span, cluster, work package, or anchor,
- groups or references related narrative material,
- helps organize revisions, continuity review, and planning,
- supports durable work packages that can survive reorder, split, merge, and promotion without silently converting grouped material into assertion truth,
- gives the writer a bounded structure for ongoing narrative work without claiming to be the smallest unit,
- can group blobs, beats, scenes, chapters, sections, arcs, sequences, flashbacks, character threads, or revision work areas,
- may hold Story Unit-scoped pacing purpose or target as
  narrative-purpose planning state,
- may hold Story Unit-scoped emotional purpose or target as narrative-purpose planning state,
- can support drag-and-drop organization, prototype inputs, signal grouping, and structural context.

## 5. What The System Does Not Do

The Story Unit system does not:

- replace `Narrative Insertion / Narrative Assertion` as the smallest narrative primitive,
- force itself as the only way to write,
- require setup before prose can begin,
- act as a default scene replacement,
- become authorial truth merely because a grouping exists,
- silently accept inferred grouping as authored structure,
- convert the Command Center into a mandatory workflow gate,
- silently mutate manuscript text, canon, or durable signal state,
- become the hidden owner of structural authority,
- require the writer to create a Story Unit before there is anything to group,
- delete underlying assertions when the grouping is removed.

## 6. User-Facing Behavior

Visible behavior should emphasize:

- optional organization,
- durable working anchors,
- low-friction grouping,
- flexible grouping shape,
- clear links to narrative primitives,
- clear authored-versus-proposed boundaries,
- useful structure without setup ceremony.

## 7. Hidden/Background Behavior

Background behavior may later include:

- split and merge lineage tracking,
- archive and dissolve lineage tracking,
- provisional grouping suggestions,
- linked continuity or critique refresh,
- optional structure assistance,
- future retrieval or memory preparation,
- prototype-input preparation,
- grouped signal context.

Background behavior must not silently claim that inferred grouping is authored truth.
Conceptually, Story Unit lifecycle should remain bounded to `candidate`,
`planned`, `grounded`, `archived`, `dissolved`, and `retired` states without turning those labels into a mandatory implementation enum in this pass.

## 8. What Appears First

What appears first should stay minimal:

- the existence of Story Unit as an optional organization tool,
- a label or title when the writer wants one,
- identity, type, status, order or grouping, and attached material reference when a Story Unit exists,
- linked narrative work when it already exists,
- mass or progress info and signal summary when useful,
- clear status or lifecycle state when relevant.

It must not appear as a prerequisite to start writing.
A Story Unit may also exist empty until references are added.

## 9. What Is Summonable

Summonable within or around a Story Unit:

- linked insertions or assertions,
- linked gaps,
- linked relationships,
- linked projection fragments,
- revision notes,
- outline links,
- continuity signals,
- critique signals,
- future Memory Lab or Companion proposals.

## 10. What Is Hidden Until Needed

Hidden until needed:

- inferred grouping proposals,
- split and merge lineage detail,
- deep relationship detail,
- continuity or critique overlays,
- Companion grouping suggestions,
- memory-related expansion views.

## 11. Inputs

Story Unit inputs may include:

- authored blobs, beats, scenes, chapters, sections, arcs, sequences, flashbacks, or character-thread material,
- authored narrative insertions or assertions,
- optional gaps,
- optional relationships,
- prose or projection fragments,
- outline links,
- revision tasks,
- continuity signals,
- critique notes,
- author-provided labels, purpose, or status,
- optional pacing purpose or target,
- optional emotional purpose or target,
- later inferred grouping proposals that remain non-authoritative until accepted.

## 12. Outputs

Story Unit outputs may include:

- durable work-group references,
- grouped narrative context,
- revision focus packages,
- grouped structural context,
- grouped signal context,
- prototype input bundles,
- linked planning context,
- author-approved structural clusters,
- bounded support signals for downstream systems.

These outputs are organizational outputs, not narrative truth by themselves.

## 13. Which Other Systems Consume Those Outputs

Likely consumers:

- `Writing Surface`
- `Command Center Surface`
- `Outline`
- `Continuity`
- `Critique`
- `Relationship Map`
- `Feedback Notes / Revision Resolution`
- `Memory Lab`

Downstream systems should consume Story Unit structure as support context, not as the replacement for authored narrative primitives.

## 14. What Gets Stored

Eventually stored:

- Story Unit identity,
- type,
- title or label,
- status,
- order or grouping,
- attached material reference,
- mass or progress info,
- signal summary,
- authority state,
- bounded lifecycle posture,
- purpose,
- optional pacing purpose or target,
- optional emotional purpose or target,
- linked insertion or assertion ids,
- linked gap ids,
- linked relationship ids,
- optional projection fragment links,
- outline links,
- provenance,
- lineage when split, merged, archived, dissolved, or promoted,
- inactive recoverable state when archived,
- detached-reference state when dissolved.

## 15. What Remains Temporary

Temporary or non-durable:

- AI suggestions,
- inferred grouping proposals,
- unresolved Companion suggestions,
- temporary planning clusters,
- draft-only labels not accepted by the writer,
- transient inspection overlays.

## 16. Relationship To Narrative Insertion / Assertion

Story Units sit above `Narrative Insertion / Narrative Assertion`.
They group, span, cluster, or package work around those smaller units.

They do not replace insertion or assertion identity.
They do not become the base narrative primitive.
They do not turn grouped material into author-owned truth automatically.
Multiple Story Units may reference the same insertion or assertion.
That many-to-many relationship does not duplicate manuscript prose and
does not change authoritative manuscript order by itself.
Story Unit membership is reference semantics, not containment semantics for manuscript truth.

## 17. Relationship To Story Units

This dossier defines Story Units themselves as optional organization tools.

Mandatory check outcome:

- Story Units are optional organization tools.
- Story Units are not the base narrative primitive.
- Story Units must not be required before writing.
- Story Units must not recreate a projection-container hierarchy under a new name.

Removal semantics:

- `Archive` preserves the Story Unit and its references in an inactive, recoverable state.
- `Dissolve` removes the grouping and detaches its references while leaving all Narrative Assertions intact.
- deleting assertions is a separate destructive Narrative Insertion / Assertion operation and is never implied by Story Unit removal.

## 18. Relationship To Prose / Scene Projection

Story Units may reference prose fragments or projection containers when useful, but projection layers remain downstream views or compatibility surfaces.

Story Units are not a disguised projection container system and must not inherit projection authority as narrative truth.
They may help Outline and `Prose / Scene Projection` organize material without becoming hidden manuscript authority.

## 19. Relationship To Writing Surface

The Writing Surface must remain usable without Story Units.

Valid paths include:

- insertion or assertion first, then Story Unit later,
- direct prose first, then Story Unit discovered later,
- gap or outline planning first, then Story Unit,
- Story Unit first when the writer wants that path.

The Writing Surface stays sovereign regardless of whether a Story Unit exists.
Current-text actions belong in the `Writing Surface`.
When the author is editing authoritative manuscript truth directly, Story Unit does not add a second approval step; the editing action itself is the acceptance event.

## 20. Relationship To Command Center Surface

Story Units will likely be easier to inspect and organize in the Command Center, but that does not make the Command Center a gate.

The Command Center may host Story Unit creation, review, grouping, and lineage inspection while still preserving direct writing first.
Review, approval, bulk, routing, export, prototype, and other heavy workflow actions belong in `Command Center Surface`.

## 21. Relationship To Outline

Outline gets structure and map actions for Story Units.
Story Unit can support Outline structure without turning Outline into the owner of grouped narrative truth.

## 22. GUI Placement Principles

Placement rules:

- Story Unit controls should appear when organization helps current work,
- Story Unit views should not flood the default writing path,
- low-risk planning changes may happen directly,
- Story Unit reorder changes grouping or narrative-purpose context unless
  the writer explicitly enters a later manuscript-order apply path,
- changes that affect accepted manuscript, author-owned truth, deletion, export or sync or publish, durable signal state, retained memory, or paid or outbound work require explicit confirmation,
- delete, merge, split, promote-to-truth, accepted-manuscript reorder, and archive-with-material require the strongest confirmation, undo or recovery, and provenance handling when they affect accepted manuscript, author-owned truth, retained memory, durable signal state, export or sync or publish, paid or outbound work, or deletion,
- lifecycle and grouping detail should stay readable and bounded,
- the system must resist becoming a renamed scene tree,
- the Command Center must not turn Story Units into dashboard clutter,
- grouped structural context should remain support context rather than a hidden canon layer.

## 23. Local LLM Role

Possible later local-model roles:

- grouping suggestions,
- label suggestions,
- split or merge candidates,
- revision-package preparation,
- continuity-linked clustering support,
- cheap structured grouping context before deeper scans.

All local-model output remains proposed structure until the writer accepts it.

## 24. Paid API Role

Possible later paid-model roles:

- large-context grouping review,
- deeper structure analysis across many narrative primitives,
- long-context clustering or split suggestions,
- continuity-aware grouping comparisons,
- prototype-bundle comparison.

Paid-model output remains advisory until accepted by the writer.

## 25. Model Routing Notes

Routing should remain behind later policy layers.

Any AI-assisted Story Unit flow must preserve:

- explicit author control,
- clear provenance,
- no silent commit,
- no certainty inflation,
- no default dependency on AI,
- no silent mutation of manuscript, canon, or durable signal state.

## 26. Explicit-Content / Send-Package Handling, If Applicable

If Story Units later package explicit material for review or routing, package handling must preserve:

- author approval,
- masking or redaction rules where relevant,
- continuity preservation,
- no silent rewrite of authored structure,
- no leakage of raw excluded text through grouped previews, prototype bundles, or signal groupings unless explicitly permitted by the author.

## 27. Privacy / Safety / Censor Behavior, If Applicable

If Story Units participate in model-facing packaging later, privacy and safety rules must ensure:

- explicit handling of sensitive passages,
- bounded routing decisions,
- no hidden censor authority over authored narrative,
- clear user awareness when content leaves the local boundary,
- masks and AI exclusion zones remain in force even when grouped work is reorganized.

## 28. Testing Requirements

Minimum proof set:

- Story Unit can exist without prose,
- prose can exist without Story Unit,
- insertion or assertion can exist without Story Unit,
- inferred Story Unit cannot claim authored truth,
- split and merge preserve lineage,
- promoted or archived lifecycle states preserve identity history,
- multiple Story Units may reference the same insertion or assertion
  without duplicating prose or mutating manuscript order,
- Story Unit links do not replace insertion or assertion identity,
- grouped work does not silently become accepted manuscript structure,
- grouped signals do not grant Story Unit ownership of durable signal state,
- smallest stable payload can be shown without turning Story Unit into a junk drawer,
- high-risk lifecycle changes require explicit confirmation,
- delete, merge, split, promote-to-truth, accepted-manuscript reorder, and archive-with-material receive the strongest undo, recovery, and provenance handling.

## 29. Governance Risks

Key risks:

- Story Unit becoming a mandatory gate,
- Story Unit replacing insertion or assertion foundation,
- Story Unit becoming a disguised projection-container hierarchy,
- Story Unit hardening into a hidden structural truth owner,
- Story Unit becoming a junk drawer for memory, provenance, critique, or archive material,
- strongest-risk lifecycle transitions being treated like casual low-risk planning actions,
- inferred grouping becoming authorial truth,
- Command Center forcing Story Unit workflow before writing,
- AI grouping acquiring more authority than the writer intended.

## 30. Failure Modes

Expected failure or degraded states:

- empty Story Units,
- duplicate or overlapping grouping,
- stale links after reorder or split,
- over-clustered work packages,
- grouping that obscures manuscript-order versus work-container purpose,
- lifecycle changes applied without clear confirmation boundary,
- strongest-risk lifecycle transitions applied without strong undo, recovery, or provenance handling,
- conflicting inferred grouping proposals,
- lineage confusion after merge or promotion.

Containment rules:

- preserve authored links,
- keep proposals non-authoritative,
- surface ambiguity instead of silently rewriting structure.

## 31. v1 Boundary

Minimum approved first version:

- durable Story Unit identity,
- type,
- status,
- order or grouping,
- attached material reference,
- mass or progress info,
- signal summary,
- authority state,
- optional title or label,
- clear authored-versus-proposed boundary,
- no AI dependency,
- no mandate to create Story Units before writing.

## 32. v2 Boundary

Next bounded extension:

- linked gaps and relationships,
- split and merge lineage,
- outline and continuity linkage,
- optional revision-package workflows,
- bounded local-model grouping suggestions,
- prototype-bundle preparation,
- grouped signal review support.

## 33. Future-Only Boundary

Future-only items:

- auto-grouping that feels authoritative,
- deep Memory Lab orchestration,
- broad Companion-driven structural restructuring,
- any workflow that makes Story Units the default mandatory shell,
- any attempt to redefine Story Units as the base narrative primitive,
- any workflow that lets Story Units silently mutate manuscript truth or durable signal state.

## 34. Pre-Rough Alignment Questionnaire

### Critical

- What exact workflow mechanics, recovery paths, and provenance handling should be shaped first for delete, merge, split, promote-to-truth, accepted-manuscript reorder, and archive-with-material?

### Major

- How much grouping overlap should be allowed before UX becomes noisy?
- When should a Story Unit promote into a stronger planning or revision container?
- Which grouped contexts are useful enough to surface by default versus summonable only?

### Answered / Accepted Doctrine

- Story Unit is an optional flexible grouping or work container rather than a required narrative primitive.
- Story Unit may group blobs, beats, scenes, chapters, sections, arcs, sequences, flashbacks, character threads, or revision work areas.
- Story Unit may support drag-and-drop organization, prototype input preparation, signal grouping, and structural context.
- Story Unit does not own narrative truth and must not silently mutate manuscript text, canon, or durable signal state.
- Story Unit may help Outline and `Prose / Scene Projection` organize material without becoming a hidden authority layer.
- Story Unit lifecycle is conceptually bounded to `candidate`,
  `planned`, `grounded`, and `retired`.
- Multiple Story Units may reference the same insertion or assertion
  without duplicating prose or creating more than one authoritative
  manuscript position.
- The smallest stable Story Unit payload includes identity, type, status, order or grouping, attached material reference, mass or progress info, signal summary, and authority state.
- Low-risk planning changes may happen directly.
- Changes affecting accepted manuscript, author-owned truth, deletion, export or sync or publish, durable signal state, retained memory, or paid or outbound work require explicit confirmation.
- Delete, merge, split, promote-to-truth, accepted-manuscript reorder, and archive-with-material require the strongest confirmation, undo or recovery, and provenance handling when they affect protected manuscript, truth, memory, signal, export, spend, or deletion boundaries.
- Exact workflow shaping should prioritize delete, merge, split, promote-to-truth, accepted-manuscript reorder, and archive-with-material before lower-risk lifecycle actions.
- `Writing Surface` gets current-text actions, Outline gets structure and map actions, and `Command Center Surface` gets review, approval, bulk, routing, export, prototype, and other heavy workflow actions.

### Jason Decision Candidates

### Future Contract Needs

- Exact Story Unit payload and state contract.
- Exact split, merge, archive, and promotion contract.
- Exact grouped-signal and prototype-input contract.
- Exact cross-surface interaction contract for `Writing Surface`, Outline, and `Command Center Surface`.
- Exact lifecycle confirmation, undo, recovery, and provenance contract.
- Exact highest-risk workflow-priority shaping order and dependency contract.

## 35. Current-Cluster Rough Stability

This dossier remains rough, investigative, and blocked for implementation. The structural story system cluster is not yet stable enough to pause after this first connected-system tightening pass.

## 36. Acceptance Criteria

This dossier is acceptable only if it states explicitly that:

- projection containers do not replace narrative foundation authority,
- Story Units are not treated as a mandatory gate by default,
- inferred, derived, or Companion output does not become authored truth without author action,
- the system does not present fake certainty,
- the system does not introduce story grading unless a future explicitly approved tool authorizes it,
- the system does not create dashboard clutter as default behavior,
- the system does not claim hidden runtime authority that the implementation does not actually own,
- Story Units do not silently mutate manuscript truth, canon, or durable signal state.
