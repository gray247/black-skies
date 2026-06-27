# Workflow Proof WP-01 - Critique Finding to Author Action

## Status

- Passed with Bounded Follow-up
- Official result recorded
- No unresolved author decision blocks the workflow
- Bounded follow-up routed to Stage 9

## Author Goal

Show that critique can surface evidence-backed, advisory findings and hand them to the author without mutating manuscript truth or creating Notes, Signals, or rewrite output automatically.

## Scope

This proof covers the path from a critique request through author review and owner-routed action or non-action.
It does not prove presentation design, recurrence policy, or implementation detail.

## Preconditions

- A manuscript or other source text exists in the Writing Surface or a related projection.
- Author-provided context may be present, but critique must still function when context is partial.
- Critique output is advisory, not accepted truth.

## Initiating Actor and Surface

- Initiating actor: author
- Initiating surface: Writing Surface, with possible handoff to Command Center for review-heavy work

## Participating Systems

- Critique / Evaluation
- Feedback Notes / Revision Resolution
- Signal Architecture
- Draft Generation / Rewrite Loop
- Narrative Insertion / Narrative Assertion
- Writing Surface
- Command Center Surface

## Source Owner

- Critique / Evaluation

## Destination Owner

- Feedback Notes / Revision Resolution, Signal Architecture, Draft Generation / Rewrite Loop, or none if the author leaves the finding unresolved

## Objects Read

- manuscript text
- author-provided context where available
- source passages and evidence anchors
- critique output

## Objects Created

- critique finding
- priority synthesis
- author-facing question
- suggested route

No Note, Signal, rewrite candidate, or accepted truth is created automatically.

## Objects Transformed or Routed

- critique finding routed only through the relevant owner path when the author chooses a downstream action
- source passages may be revisited without creating a new durable object

## Path Matrix

| Path | State before | Actor | Owner responsible | Action | Object produced or changed | Truth mutation | Approval required | Author-visible result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Author requests critique | Manuscript exists; no critique result yet | Author | Critique / Evaluation intake | Request critique | Request record only | No | No | Critique begins or queues |
| 2. Critique receives manuscript and context | Source text and optional context available | Critique system | Critique / Evaluation | Read manuscript and context | Evidence set | No | No | Inputs visible for review |
| 3. Priority synthesis and anchored findings | Evidence gathered | Critique system | Critique / Evaluation | Produce advisory synthesis and findings | Critique findings | No | No | Prioritized findings visible |
| 4. Author inspects evidence | Findings shown | Author | None yet | Review findings and sources | No new object required | No | No | Author can act or leave unresolved |
| 5. Author leaves finding unresolved | Finding visible | Author | None | Do nothing further | No change | No | No | Finding remains unresolved |
| 6. Author dismisses or disputes the finding | Finding visible | Author | Critique / Evaluation only | Mark dismissed or disputed | Local disposition marker | No | No | Finding remains advisory |
| 7. Author marks issue intentional | Finding visible | Author | Critique / Evaluation only | Mark intentional | Intentional marker | No | No | Deliberate choice remains visible |
| 8. Author routes to a Note | Finding and evidence visible | Author | Feedback Notes / Revision Resolution | Create Note through owner path | Note candidate or durable note | No | Yes, owner path | Note appears with source link |
| 9. Author routes to a Signal | Finding and evidence visible | Author | Signal Architecture | Raise Signal through owner path | Signal candidate or durable signal | No | Yes, owner path | Signal appears with source link |
| 10. Author requests rewrite | Finding and evidence visible | Author | Draft Generation / Rewrite Loop | Request rewrite through owner path | Rewrite request or candidate | No | Yes, owner path | Rewrite workflow begins |
| 11. Author inspects source passages only | Findings visible | Author | None | Reopen source passage without creating an object | No new object | No | No | Source remains inspectable |
| 12. Critique fails or returns partial findings | Request in flight | Critique system | Critique / Evaluation | Fail or partially complete analysis | Partial findings or failure state | No | No | Partial evidence remains visible |
| 13. Result becomes stale after source changes | Source changed after finding | System or author | Critique / Evaluation | Mark result stale | Stale finding marker | No | No | Staleness is visible |
| 14. Author cancels before routing | Review in progress | Author | None | Cancel action before downstream routing | No new object | No | No | Nothing is handed off |

## Must Prove

- Critique creates no Note, Signal, rewrite candidate, or accepted truth automatically.
- Suggested route is not destination acceptance.
- Priority is not a universal manuscript score.
- Dismissed, disputed, intentional, and unresolved meanings remain distinct.
- Later recurrence behavior remains a Stage 6 follow-up unless already fully provable.
- Author intent remains author-owned guidance.
- Provider refusal is not manuscript failure.

## Forbidden Shortcuts

- No direct conversion from critique finding to truth.
- No hidden creation of Notes, Signals, or rewrite output.
- No universal grading formula.
- No assumption that dismissal equals falsity.

## Unresolved Questions

- How much recurrence grouping should be presented by default?
- How much intent context should be shown when author-provided context is missing?

## Stage 9 Deferrals

- Priority synthesis display density.
- Grouping of related findings.
- Evidence presentation and uncertainty display.
- The exact Command Center versus Writing Surface treatment of critique detail.

## Stage 10 Deferrals

- Model qualification for critique quality.
- Dialect and language evaluation fixtures.
- Provider-specific refusal behavior beyond the workflow boundary.

## What This Proof Explicitly Does Not Prove

- It does not prove the best UI for critique review.
- It does not prove recurrence suppression policy.
- It does not prove any implementation shape.
- It does not prove that every critique request succeeds.

## Completion-Criteria Assessment

The workflow boundary is well defined if:

- critique output stays advisory,
- downstream objects only appear through their owner paths,
- unresolved findings remain visible,
- source changes can stale existing findings,
- cancellation leaves no hidden mutation behind.

## Provisional Assessment

Passed with Bounded Follow-up.
The core ownership and truth boundaries are proved, and recurrence handling plus presentation density are routed to Stage 9.
