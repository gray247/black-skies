# Scene Cards / Corkboard

## 1. Status Header

- Dossier name: `Scene Cards / Corkboard`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Outline`, `Prose / Scene Projection`, `Story Unit`
- Feeds into: `Writing Surface`, `Outline`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `derived`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define Scene Cards / Corkboard as an optional planning and projection surface for scene-shaped material without making scene cards the owner of truth.

## 3. User Problem Solved

The writer may want a quick card-based planning view without being forced to treat scenes as the base authority layer.

## 4. What The System Does

- display scene-shaped or card-shaped planning views,
- support rearrangement of planning material,
- link cards to projected prose or structural context.

## 5. What The System Does Not Do

- make scenes mandatory,
- replace narrative foundations,
- silently rewrite accepted manuscript order.

## 6. User-Facing Behavior

Visible behavior should emphasize optional planning, projection, and review.

## 7. Hidden/Background Behavior

Background card generation may exist later, but it remains advisory.

## 8. What Appears First

- scene-shaped cards when chosen,
- basic labels,
- clear structural context.

## 9. What Is Summonable

- notes,
- projected content,
- signals,
- support detail.

## 10. What Is Hidden Until Needed

- deep history,
- dense evidence,
- bulk workflow actions.

## 11. Inputs

- projected prose,
- outline order,
- Story Unit links,
- author notes.

## 12. Outputs

- card views,
- projected arrangement views,
- optional planning cues.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Outline`
- `Command Center Surface`

## 14. What Gets Stored

- card metadata,
- ordering preferences,
- optional notes and labels.

## 15. What Remains Temporary

- projected arrangements,
- unsaved card states,
- advisory suggestions.

## 16. Relationship To Narrative Insertion / Assertion

Scene cards may point to truth-bearing narrative material but do not replace it.

## 17. Relationship To Story Units

Story Units may group cards, but Story Units remain optional.

## 18. Relationship To Prose / Scene Projection

This dossier depends on projection and compatibility rather than scene authority.

## 19. Relationship To Writing Surface

Cards may support writing context, but the Writing Surface remains sovereign.

## 20. Relationship To Command Center Surface

Heavier review or bulk card workflows belong in the Command Center when needed.

## 21. GUI Placement Principles

Keep cards optional and avoid crowding the default writing experience.

## 22. Local LLM Role

Local AI may later assist with optional card suggestions only.

## 23. Paid API Role

Paid AI, if ever used, remains optional and approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI-assisted card generation must follow routing and spend rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Projected or summarized card views must respect masking and exclusion rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Hidden or excluded material must not leak through card previews.

## 27. Testing Requirements

Prove cards remain optional and do not commit accepted-manuscript changes silently.

## 28. Governance Rules And Risks

- no scene-first authority drift,
- no silent manuscript mutation,
- no card-as-canon behavior.

## 29. Failure Modes

If cards fail, writing and outline work should still continue.

## 30. v1 Boundary

Optional card projection and simple planning movement.

## 31. v2 Boundary

Richer filtering, notes, and comparison support.

## 32. Future-Only Boundary

Deep automated card generation and restructuring.

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

- Critical: is corkboard a layout of `Outline` or `Prose / Scene Projection`, a separate support surface, or a hybrid that must still avoid becoming structure authority?
- Future contract need: what card actions affect only projection or planning order versus accepted-manuscript structure, and which require preview, confirmation, undo, and provenance?

### Major Questions

- Jason decision candidate: how much scene terminology should be exposed versus kept as compatibility language, including whether user-facing cards default to `scene`, `section`, `sequence`, `unit`, or user-defined labels?
- Major: should corkboard views distinguish draft structure, accepted structure, and what-if planning structures explicitly?

### Minor Questions

- Minor: should `Corkboard` remain user-facing branding, or should it be a layout name under a broader card surface?

### Answered / Superseded Questions

- Scene is projection, container, view, or compatibility only.
- Superseded by current doctrine: scene cards must not recreate scene-first architecture or make scenes mandatory.
- Questions better owned elsewhere: timeline layout, graph layout, and broad Outline signal policy belong primarily to `outline.md`.

### Deferred Questions

- Deferred: exact card-density and layout rules.

## 34. Acceptance Criteria

This dossier is acceptable only if scenes remain optional and non-authoritative.
