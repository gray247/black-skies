# Workflow Proof WP-03 - Continuity Conflict to Owner-Routed Resolution

## Status

- Passed with Bounded Follow-up
- Official result recorded
- No unresolved author decision blocks the workflow
- Bounded follow-up routed to Stage 9

## Author Goal

Show that Continuity can surface conflicts without deciding canon, and that any resolution routes through the actual source owner.

## Scope

This proof covers conflict detection, source visibility, author review, owner-routed resolution, dispute, intentional ambiguity, stale source handling, and cancellation.

## Preconditions

- Potentially conflicting sources exist.
- Source anchors or references are available where possible.
- Continuity can inspect current, historical, candidate, inferred, stale, or missing source states.

## Initiating Actor and Surface

- Initiating actor: author
- Initiating surface: Writing Surface or Command Center, depending on where the conflict is surfaced

## Participating Systems

- Continuity
- Narrative Insertion / Narrative Assertion
- Character Cards
- Lore Cards
- Outline
- Timeline / Pacing / Pressure
- Project Index / Search / Retrieval
- Writing Surface
- Command Center Surface

## Source Owner

- Continuity for detection and surfacing

## Destination Owner

- the actual owner of the conflicting source object, such as Narrative Insertion / Narrative Assertion, Character Cards, Lore Cards, Outline, or Timeline / Pacing / Pressure

## Objects Read

- current manuscript source
- accepted planning source
- historical source
- candidate source
- inferred source
- stale source
- missing source markers
- conflicting owner state

## Objects Created

- continuity finding
- conflict summary
- owner-linked follow-up route only when the author chooses one

## Objects Transformed or Routed

- conflict finding routed toward the actual owner only through an explicit author choice
- related Note, Signal, or rewrite request remains owner-governed

## Path Matrix

| Path | State before | Actor | Owner responsible | Action | Object produced or changed | Truth mutation | Approval required | Author-visible result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Continuity detects a possible conflict | Source material present | Continuity system | Continuity | Detect mismatch or tension | Continuity finding | No | No | Conflict is surfaced |
| 2. Both or all conflicting sources are identified | Possible conflict present | Continuity system | Continuity | Show every relevant source | Conflict set with source links | No | No | Sources and owners are visible |
| 3. Source owners and authority states are visible | Conflict visible | Continuity system | Continuity | Display authority posture | Authority markers | No | No | Author sees who owns what |
| 4. Direct contradiction path | Two sources directly disagree | Continuity system | Continuity | Flag direct contradiction | Contradiction finding | No | No | Contradiction is explicit |
| 5. Possible contradiction path | Conflict is plausible but not certain | Continuity system | Continuity | Flag possibility only | Possible-conflict finding | No | No | Uncertainty stays visible |
| 6. Missing-explanation path | Source context incomplete | Continuity system | Continuity | Report missing explanation | Missing-context finding | No | No | Missing support remains visible |
| 7. Intentional ambiguity or unreliable-narration path | Difference may be deliberate | Author and Continuity | Continuity | Mark ambiguity as intentional or uncertain | Intentional marker or unresolved finding | No | No | Deliberate ambiguity is preserved |
| 8. Stale planning-source path | Planning source changed since capture | Continuity system | Continuity | Mark source stale | Stale finding | No | No | Staleness is visible |
| 9. Author resolves through manuscript owner | Conflict visible | Author | Narrative Insertion / Narrative Assertion | Route resolution to manuscript owner | Owner-routed resolution | Yes, if accepted | Yes | Manuscript owner decides its own object |
| 10. Author resolves through Card, Outline, Lore, Timeline, or other owner | Conflict visible | Author | Relevant actual owner | Route to the owning system | Owner-routed resolution or follow-up | Yes, if accepted | Yes | Source-specific owner remains authoritative |
| 11. Author disputes the finding | Conflict visible | Author | Continuity | Dispute finding | Dispute marker | No | No | Finding remains advisory |
| 12. Author leaves it unresolved | Conflict visible | Author | None | Leave conflict open | No new object | No | No | Conflict stays unresolved |
| 13. Source changes make the finding stale | Source changed after surfacing | System | Continuity | Mark finding stale | Stale marker | No | No | Staleness is visible |
| 14. Evidence is unavailable or incomplete | Evidence missing | Continuity system | Continuity | Surface incomplete evidence | Partial evidence set | No | No | Missing evidence remains visible |
| 15. Analysis fails or is cancelled | Conflict in progress | Continuity system or author | Continuity | Fail or cancel analysis | Failure or cancellation state | No | No | Workflow stops without canon decision |

## Must Prove

- Continuity does not decide canon.
- Continuity does not select which source is true.
- Resolving one owner's object does not silently rewrite another owner's object.
- Historical, candidate, inferred, stale, and accepted sources do not collapse.
- Missing explanation is not automatically contradiction.
- Deliberate ambiguity is not automatically an error.
- Search or retrieval results do not become evidence quality or truth.
- Any resulting Note, Signal, or rewrite request uses that owner's workflow.

## Forbidden Shortcuts

- No shadow canon.
- No silent truth rewrite.
- No collapse of source classes.
- No automatic owner transfer.

## Unresolved Questions

- How should conflicting sources be grouped when several owners are involved?
- How much explanatory context should be visible before the author drills down?

## Stage 9 Deferrals

- Conflict-group presentation.
- Source comparison density.
- Uncertainty display and drill-down treatment.

## Stage 10 Deferrals

- Retrieval/index quality fixtures.
- Source-change detection reliability.
- Long-term conflict revalidation rules.

## What This Proof Explicitly Does Not Prove

- It does not prove the best conflict UI.
- It does not prove a canonical resolution policy.
- It does not prove automatic conflict repair.
- It does not prove implementation of source comparison storage.

## Completion-Criteria Assessment

The workflow boundary is well defined if:

- source classes stay distinct,
- Continuity only surfaces conflicts,
- actual owners resolve their own objects,
- ambiguity and missing explanation remain visible,
- no silent canon decision occurs.

## Provisional Assessment

Passed with Bounded Follow-up.
The owner boundary is proved, and conflict grouping plus deeper comparison handling are routed to Stage 9.
