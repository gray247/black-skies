# Visual Arrangement View

## 1. Status Header

- Dossier name: `Visual Arrangement View`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-17`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Outline`, `Prose / Scene Projection`, `Story Unit`
- Feeds into: `Writing Surface`, `Outline`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `none`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define Visual Arrangement View as a reusable card, board, or layout
view that can display structural material from other systems without
becoming an independent structural owner.

This file keeps the existing filename temporarily for continuity with
current references, but the dossier doctrine is now `Visual Arrangement
View` rather than a peer structural system named `Scene Cards /
Corkboard`.

## 3. User Problem Solved

The writer may want a quick card-based or board-style way to compare,
rearrange, and inspect structure without being forced to treat the view
itself as the owner of manuscript truth, planning truth, or grouping
truth.

## 4. What The System Does

- display owner-backed structural material as cards, lanes, boards, or
  compact arrangement views,
- render Narrative Assertions, Story Units, Outline nodes, prototype
  arrangements, scene or chapter projections, containers, notes or
  signals where explicitly allowed, and owner-labeled metadata,
- request rearrangement actions against the active underlying owner,
- support comparison, inspection, and planning review without owning the
  underlying structure.

## 5. What The System Does Not Do

- own manuscript truth,
- own Story Unit grouping truth,
- own Outline planning truth,
- own durable narrative state,
- decide on its own what dragging changes,
- silently rewrite accepted manuscript order,
- make scenes mandatory.

## 6. User-Facing Behavior

Visible behavior should emphasize optional comparison, planning, review,
and quick visual understanding.

## 7. Hidden/Background Behavior

Background card generation, labeling, or arrangement suggestions may
exist later, but they remain advisory and do not become structural truth
automatically.

Saved visual state may include card position, zoom, filters, grouping
presentation, lane layout, collapsed or expanded state, selected
references, workspace-local arrangement, or temporary comparison
arrangement. Saved visual state must remain separate from accepted
manuscript order, planning order, and Story Unit grouping.

## 8. What Appears First

- the currently selected owner-backed arrangement,
- basic labels and structural context,
- clear indication of whether the view is showing Outline, Story Units,
  projection containers, manuscript structure, or a prototype
  arrangement,
- if useful, source labels that identify the owner of the displayed
  material.

## 9. What Is Summonable

- notes,
- projected content,
- owner detail,
- comparison context,
- support detail.

## 10. What Is Hidden Until Needed

- deep history,
- dense evidence,
- heavy review actions,
- apply or confirmation workflows owned elsewhere.

## 11. Inputs

- outline state,
- Story Unit state,
- projection containers,
- manuscript structure references,
- selected prototype arrangements,
- author notes,
- source labels and owner metadata.

## 12. Outputs

- visual arrangement views,
- comparison views,
- action requests routed to the active owner,
- optional planning cues,
- return-navigation hints back to the prior writing or planning location.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Outline`
- `Prose / Scene Projection`
- `Story Unit`
- `Command Center Surface`

## 14. What Gets Stored

No structural truth or durable narrative state is owned here.
If a later product version saves layout preferences, that preference
state should remain subordinate to the relevant surface or settings
owner rather than becoming Visual Arrangement View structural
authority.
Card position alone must not imply canonical order. Any saved visual
state remains advisory unless an owning system explicitly applies a
structural change.

## 15. What Remains Temporary

- displayed arrangements,
- unsaved card layout state,
- comparison state,
- advisory suggestions,
- temporary comparison arrangements.

## 16. Relationship To Narrative Insertion / Assertion

Visual Arrangement View may display truth-bearing manuscript structure,
but authoritative manuscript content and order remain in
`Narrative Insertion / Narrative Assertion`.

## 17. Relationship To Story Units

Story Units may be shown here, but Story Unit grouping and
narrative-purpose meaning remain Story Unit-owned.
Story Unit archive or dissolve actions should be reflected as stale,
inactive, or detached visual state rather than being silently converted
into deleted assertions.

## 18. Relationship To Prose / Scene Projection

Chapter or scene containers may be shown here through
`Prose / Scene Projection`, but chapter or scene organization remains
projection-owned rather than view-owned.
The view may surface scene-like or chapter-like containers, but those
containers are projections or compatibility views, not the base
manuscript unit.

## 19. Relationship To Writing Surface

The Writing Surface may show a bounded arrangement context when useful,
but heavy comparison should not crowd direct writing.
When the author is editing authoritative manuscript truth directly, the
underlying owner accepts the edit immediately; the visual layer does not
insert a second approval step.

## 20. Relationship To Command Center Surface

The Command Center is the more natural home for deeper visual-arrangement
comparison, prototype review, and heavier structure inspection.
Handoffs should identify the source owner, affected item set, and return
location, and they should preserve surface-local navigation history
rather than stealing focus automatically.

## 21. GUI Placement Principles

Keep visual arrangement optional, clearly labeled, and subordinate to
its current owner.
The active underlying owner must determine what dragging changes:

- dragging a card may alter only visual layout unless the user chooses an
  owner-routed structural action,
- structural reorder proposals require preview,
- preview identifies the owner state that would change,
- direct author reorder in an authoritative manuscript projection remains
  immediate and accepted,
- Outline or Visual Arrangement proposals remain advisory until
  explicitly applied,
- applying changes routes through `Narrative Insertion / Narrative
  Assertion`, `Story Unit`, `Outline`, or projection/container owners as
  appropriate,
- no generic visual-view mutation bypasses the owner.

Canonical accepted state, advisory arrangement, temporary comparison,
stale visual state, dismissed arrangement, saved workspace layout, and
applied structural result must remain distinct.

- dragging Outline material changes planning structure or prototype
  order,
- dragging Story Units changes grouping or narrative-purpose context,
- dragging projection containers changes projection organization or
  creates movement proposals,
- dragging manuscript structure may create preview-only or proposal-only
  reorder requests unless a later explicit apply workflow is entered.

## 22. Local LLM Role

Local AI may later assist with optional layout or labeling suggestions
only.

## 23. Paid API Role

Paid AI, if ever used, remains optional and approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI-assisted arrangement suggestion must follow routing and spend
rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Projected or summarized arrangement views must respect masking and
exclusion rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Hidden or excluded material must not leak through arrangement previews.

## 27. Testing Requirements

Prove the view remains optional, clearly owner-backed, and does not
commit accepted-manuscript changes silently.

## 28. Governance Rules And Risks

- no scene-first authority drift,
- no silent manuscript mutation,
- no visual-layout-as-canon behavior,
- no confusion about which underlying owner a drag action affects.

## 29. Failure Modes

If the view fails, writing, outline, Story Unit, and projection work
should still continue.

## 30. v1 Boundary

Optional owner-backed arrangement display and simple action-request
handoff.

## 31. v2 Boundary

Richer filtering, notes, comparison support, and prototype review aids.

## 32. Future-Only Boundary

Deep automated arrangement generation and restructuring.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: partial, mainly from scene/projection and Outline layout questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 6
- remaining blocker summary: `0 Fatal`, `2 Critical`, `2 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Future contract need: what exact action labels, previews, and
  confirmation cues should distinguish planning movement, grouping
  movement, projection movement, and manuscript-order proposals?
- Future contract need: what exact saved layout preferences, if any,
  belong here versus in surface or settings ownership?

### Major Questions

- Jason decision candidate: how much scene terminology should be exposed
  versus kept as compatibility language, including whether user-facing
  cards default to `scene`, `section`, `sequence`, `unit`, or
  user-defined labels?
- Major: how explicit should owner labels and apply-path cues be when
  the same visual arrangement component is reused across different
  structural owners?

### Minor Questions

- Minor: should `Corkboard` survive as a user-facing layout label under
  `Visual Arrangement View`, or disappear entirely from writer-facing
  naming?

### Answered / Superseded Questions

- Scene is projection, container, view, or compatibility only.
- The view owns no structural truth or durable narrative state.
- The active underlying owner determines what a drag or reorder action
  means.
- Superseded by current doctrine: the old peer structural reading of
  `Scene Cards / Corkboard` is replaced by `Visual Arrangement View`.
- Questions better owned elsewhere: timeline layout, graph layout,
  prototype ownership, and manuscript-order apply rules belong
  primarily to `outline.md`, `prose_scene_projection.md`, and
  `narrative_insertion_assertion.md`.

### Deferred Questions

- Deferred: exact card-density and layout rules.

## 34. Acceptance Criteria

This dossier is acceptable only if the view remains optional,
non-authoritative, and clearly downstream of explicit structural
owners.
