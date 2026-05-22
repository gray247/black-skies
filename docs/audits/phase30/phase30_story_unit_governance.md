# Phase 30 Story Unit Governance

Status: Draft
Date: 2026-05-22
Phase: 30 - GUI / Workflow Realignment Spec
Pass: 2 - Workflow Policy and Story Unit Governance

## Purpose

This document defines Story Unit governance at the conceptual and workflow level.
It does not define runtime persistence, schemas, or implementation architecture.

## Conceptual Story Unit Definition

A Story Unit is the smallest workflow-governed narrative object that the product is allowed to treat as an intentional piece of story thinking.
It may originate from highlighted prose, a blank insertion, a fragment, a note, a scene seed, or another captured narrative element.

It is not yet defined here as a persisted data model.
In this pass, Story Unit is a governance object and workflow concept.

## Story Unit Purpose

Story Units exist to let writers capture, rearrange, refine, and connect narrative material before it hardens into a rigid structural category too early.
They are meant to support narrative assembly without forcing the user to decide immediately whether something is a scene, beat, note, thread, or outline node.

## Story Unit Lifecycle Concepts

Conceptually, a Story Unit may move through these workflow states:

- captured from highlighted text
- created blank between existing units
- drafted or expanded
- reorganized relative to neighboring units
- merged with another unit
- split into smaller units
- bridged by a newly inserted unit
- associated with broader outline or scene context

These are workflow expectations only.
They do not imply current runtime persistence or implementation support.

## Relationship to Scenes

Story Units are not governed in Pass 2 as identical to scenes.
A scene may eventually contain, be derived from, or be associated with one or more Story Units.
Story Units therefore sit conceptually below or across scene structure, not automatically at the same level as scenes.

## Relationship to Drafts

Draft text remains authoring content, not the same thing as Story Units.
Story Units may be captured from draft text or may later inform draft text, but draft authority and Story Unit authority must remain distinct.
The Writing Surface owns draft attention.
Story Unit capture must not silently redefine draft persistence or canonical manuscript authority.

## Relationship to Outline Nodes

Outline nodes remain structural navigation and planning context.
Story Units may be associated with outline nodes, grouped beneath them, or help refine them.
Pass 2 does not define whether Story Units are subordinate to outline nodes, peer to outline nodes, or the eventual structure beneath one active outline.
That remains a workflow question for later Phase 30 passes and possibly a Candidate Phase 32 trigger if persistence authority becomes unavoidable.

## Relationship to Narrative Fragments and Notes

Narrative fragments and notes may become Story Units when the user chooses to govern them as intentional story material.
Not every note must automatically become a Story Unit.
Capture is the boundary where informal material may become governed workflow material.

## Relationship to Metadata

Metadata may describe Story Units, but metadata does not own Story Unit meaning.
Pass 2 does not define any metadata schema or persistence structure for Story Units.

## Story Unit Authority Boundaries

- Story Units are governed as conceptual story-building objects, not yet as canonical persisted runtime objects.
- Story Units do not automatically outrank drafts, scenes, or outlines by virtue of being introduced in Phase 30.
- Story Units may become a workflow spine candidate, but not yet a persistence spine.
- Story Units must not silently absorb mutation authority that belongs to authoring, recovery, or implementation systems.

## Story Unit Editing Expectations

- Writers may create, inspect, rename, expand, and reorganize Story Units conceptually.
- Blank Story Units are first-class and must not be treated as placeholder hacks.
- Editing Story Units should feel like shaping story intent, not editing support metadata.
- Story Unit editing expectations do not imply direct persistence or autosave policy.

## Story Unit Contextual Behavior

- Story Units may appear in contextual support of the Writing Surface when the writer is actively shaping narrative structure.
- Story Units may also appear in Command Center candidate contexts when structure, placement, or relationship analysis is the active task.
- Story Units should not require constant primary visibility if the writer is in focused drafting flow.

## Story Unit Merge / Split Governance

- merge and split are governance-approved workflow concepts
- merge and split are not approved here as automated intelligence actions
- merge and split remain user-governed structural actions unless later policy explicitly approves assistance
- merge and split semantics are unresolved at the persistence level

## Story Unit Movement / Reorganization Governance

- movement, rearrangement, insertion-between, and bridge creation are approved workflow concepts
- movement is structural and organizational, not necessarily content mutation
- organizational movement must not be confused with manuscript rewrite authority

## Story Unit Mutation-Risk Considerations

- capture from highlighted text changes workflow structure even if manuscript text is untouched
- merge/split can become high-authority actions if they later imply narrative restructuring
- any intelligence-assisted suggestion that changes Story Unit organization must stay below direct author approval
- Story Unit governance must not inherit the unresolved trust risks already identified for rewrite/apply

## Story Unit Intelligence-Assist Boundaries

- intelligence may suggest grouping, gaps, adjacency, or structural questions later
- intelligence may not silently create, merge, split, or reposition Story Units as approved workflow law
- Story Unit intelligence remains subordinate to user intent and explicit review
- runtime-backed analysis will still not equal qualitative validation

## Unresolved Persistence Questions

- Are Story Units canonical persisted objects or a workflow layer over existing scene/draft structures?
- What persistence authority owns Story Units if they become first-class data?
- How do Story Units map to scenes, drafts, outline nodes, and metadata without duplicating authority?
- What undo/delete guarantees would apply once persistence exists?

## Validate-First Areas

- any intelligence-assisted merge/split/reposition behavior
- any promotion of Story Units into direct mutation authority over manuscript content
- any attempt to treat Story Units as a canonical persisted spine before persistence authority is resolved

## Governance Boundaries Summary

### Conceptual governance

- Story Units are approved as a workflow-governed narrative concept.
- Story Units may organize story thinking without forcing premature rigid structure.

### Workflow expectations

- capture, blank insertion, rearrange, merge, split, and bridge are in-bounds workflow concepts
- Story Units may participate in both Writing Surface-adjacent and Command Center-adjacent contexts

### Unresolved implementation questions

- runtime state model
- persistence authority
- schema and storage shape
- exact interaction mechanics
