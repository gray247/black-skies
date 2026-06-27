# Workflow Proof WP-04 - Timeline or Outline Reorder Preview to Application

## Status

- Passed with Bounded Follow-up
- Official result recorded
- No unresolved author decision blocks the workflow
- Bounded follow-up routed to Stage 9

## Author Goal

Show that reorder preview remains non-mutating, and that any accepted order change routes through the proper truth owner rather than through Timeline or Outline authority.

## Scope

This proof covers proposed reorder, preview, inspection, partial application, rejection, abandonment, stale proposal handling, failed application, cancellation, and recovery visibility.

## Preconditions

- Accepted manuscript order exists.
- A proposed reorder can be generated from Timeline, Outline, or a related projection.
- The author can compare proposed order with accepted order.

## Initiating Actor and Surface

- Initiating actor: author
- Initiating surface: Writing Surface, Outline, Timeline / Pacing / Pressure, or a projection surface

## Participating Systems

- Timeline / Pacing / Pressure
- Outline
- Prose / Scene Projection
- Narrative Insertion / Narrative Assertion
- Writing Surface
- Command Center Surface
- Project Index / Search / Retrieval
- Snapshots / Backup / Restore / History

## Source Owner

- Timeline / Pacing / Pressure or Outline, depending on the originating reorder proposal

## Destination Owner

- Narrative Insertion / Narrative Assertion for accepted manuscript order

## Objects Read

- current accepted order
- proposed order
- preview projection
- Timeline observations
- Outline plan
- manuscript truth
- scene or chapter containers
- affected references
- recovery or history state

## Objects Created

- reorder proposal
- preview-only projection
- comparison view
- optional recovery note if the proof later triggers a failure path

## Objects Transformed or Routed

- proposed order routed for preview only until explicit author approval
- accepted order changes routed through the manuscript truth owner

## Path Matrix

| Path | State before | Actor | Owner responsible | Action | Object produced or changed | Truth mutation | Approval required | Author-visible result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Author requests or creates reorder proposal | Accepted order exists | Author | Timeline / Outline support surface | Create reorder proposal | Proposed order | No | No | Proposal is visible |
| 2. Non-mutating preview is created | Proposal exists | Timeline / Outline system | Timeline / Outline | Render preview | Preview projection | No | No | Accepted order remains unchanged |
| 3. Affected units, projections, references, and uncertainty are shown | Preview exists | System | Timeline / Outline | Show consequences | Comparison display | No | No | Author sees impact before acting |
| 4. Author inspects consequences | Preview visible | Author | None yet | Review preview and sources | No new object | No | No | Author can accept or reject |
| 5. Full application | Proposal approved | Author | Narrative Insertion / Narrative Assertion | Apply reorder to manuscript order | Accepted order change | Yes | Yes | Accepted order changes visibly |
| 6. Partial application | Proposal approved in part | Author | Narrative Insertion / Narrative Assertion | Apply only selected parts | Partially applied order change | Yes, selected parts only | Yes | Applied and unapplied parts remain distinct |
| 7. Rejection | Proposal reviewed | Author | Timeline / Outline | Reject proposal | Rejection disposition | No | No | Proposal remains non-authoritative |
| 8. Abandonment | Proposal reviewed | Author | Timeline / Outline | Stop using proposal | Abandoned proposal | No | No | Proposal stays non-mutating |
| 9. Proposal becomes stale after source changes | Source changed | System | Timeline / Outline | Mark proposal stale | Stale proposal marker | No | No | Staleness is visible |
| 10. Application fails partway | Mutation in progress | Target owner system | Narrative Insertion / Narrative Assertion | Fail during apply | Partial application or failure state | Partial only if explicitly applied | Yes, for apply | Failure is not reported as complete |
| 11. Cancellation before mutation | Proposal visible | Author | None | Cancel before apply | No new object | No | No | Preview ends without mutation |
| 12. Recovery path after failed or mistaken application | Failed application occurred | Author and recovery system | Snapshots / Backup / Restore / History | Inspect or recover state | Recovery view or restored state | No, unless later accepted | Yes if restoring current | Recovery implications remain visible |
| 13. Timeline suggestion routes to Outline or manuscript owner | Suggestion exists | Author | Relevant owner | Route suggestion to planning or manuscript owner | Route marker | No | Yes only if applying | Suggestion does not self-apply |
| 14. Outline reorder changes planning arrangement without silently rewriting manuscript truth | Outline proposal exists | Outline system | Outline | Rearrange planning structure | Planning-order change | No | No | Planning changes remain advisory |
| 15. Manuscript-order application routes through the correct truth owner | Accepted order change requested | Author | Narrative Insertion / Narrative Assertion | Apply accepted-manuscript reorder | Accepted order change | Yes | Yes | Truth owner changes accepted order |

## Must Prove

- Preview never mutates accepted order.
- Timeline does not own event truth or manuscript order.
- Outline does not silently own accepted manuscript arrangement.
- Applying an order change requires explicit author approval.
- Partial application identifies exactly what changed and what did not.
- Failed application cannot be reported as complete.
- Projection or container order remains distinguishable from Narrative Assertion truth.
- Recovery implications remain visible without claiming restore design is solved.
- No universal reorder owner is created.

## Forbidden Shortcuts

- No preview-as-truth.
- No implicit manuscript rewrite.
- No universal order owner.
- No silent application from proposal to accepted order.

## Unresolved Questions

- How much order-comparison history should be visible by default?
- How should recovery implications be summarized without designing the full recovery UI?

## Stage 9 Deferrals

- Reorder preview density.
- Comparison presentation.
- Recovery-implication display and drill-down.

## Stage 10 Deferrals

- Storage of order history and recovery metadata.
- Failure and restore verification fixtures.
- Any persistence or migration design for reorder records.

## What This Proof Explicitly Does Not Prove

- It does not prove the best reorder UI.
- It does not prove a storage format for reorder history.
- It does not prove automatic conflict resolution after failed application.
- It does not prove recovery implementation details.

## Completion-Criteria Assessment

The workflow boundary is well defined if:

- preview remains non-mutating,
- accepted order changes only through the correct truth owner,
- partial application stays explicit,
- rejection and abandonment remain distinct,
- recovery visibility does not imply solved implementation.

## Provisional Assessment

Passed with Bounded Follow-up.
The ownership boundary is proved, and preview density plus recovery presentation are routed to Stage 9.
