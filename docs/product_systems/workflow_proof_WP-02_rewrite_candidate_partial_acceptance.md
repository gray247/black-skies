# Workflow Proof WP-02 - Rewrite Candidate to Partial Manuscript Acceptance

## Status

- Passed with Bounded Follow-up
- Official result recorded
- No unresolved author decision blocks the workflow
- Bounded follow-up routed to Stage 9

## Author Goal

Show that rewrite candidates remain temporary until explicit acceptance, and that partial acceptance mutates only the accepted span while leaving the rest of the candidate non-truth.

## Scope

This proof covers explicit rewrite request, candidate creation, author review, partial acceptance, rejection, parking, abandonment, and stale or failed candidate handling.

## Preconditions

- A source passage exists.
- The author explicitly requests rewrite assistance.
- The rewrite workflow can produce a candidate with provenance.

## Initiating Actor and Surface

- Initiating actor: author
- Initiating surface: Writing Surface, with possible review in Command Center

## Participating Systems

- Draft Generation / Rewrite Loop
- Narrative Insertion / Narrative Assertion
- Writing Surface
- Command Center Surface
- Authorship Provenance / AI Visibility
- AI Lifecycle And Approval Matrix

## Source Owner

- Draft Generation / Rewrite Loop

## Destination Owner

- Narrative Insertion / Narrative Assertion

## Objects Read

- source passage
- requested intent
- original text
- provenance context

## Objects Created

- rewrite candidate
- review copy or preview
- acceptance record only if the author explicitly accepts text

## Objects Transformed or Routed

- candidate text routed toward explicit review
- accepted span routed through Narrative Insertion / Narrative Assertion
- unaccepted span remains candidate material

## Path Matrix

| Path | State before | Actor | Owner responsible | Action | Object produced or changed | Truth mutation | Approval required | Author-visible result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Author explicitly requests rewrite | Source text exists; no candidate yet | Author | Draft Generation / Rewrite Loop | Request rewrite | Rewrite request record | No | Yes, explicit request | Rewrite begins |
| 2. Source range and intent are identified | Request received | Rewrite system | Draft Generation / Rewrite Loop | Resolve source span and intent | Candidate inputs | No | No | Selected source and intent visible |
| 3. Candidate is produced with provenance | Candidate not yet available | Rewrite system | Draft Generation / Rewrite Loop | Generate candidate text | Rewrite candidate | No | No | Candidate and provenance visible |
| 4. Author reviews candidate against original | Candidate available | Author | None yet | Compare candidate to source | No new object | No | No | Candidate remains temporary |
| 5. Full acceptance | Candidate reviewed | Author | Narrative Insertion / Narrative Assertion | Accept all candidate text | Accepted manuscript text | Yes, selected text only | Yes | Manuscript updates visibly |
| 6. Partial acceptance | Candidate reviewed | Author | Narrative Insertion / Narrative Assertion | Accept only selected span | Accepted span plus remaining candidate | Yes, selected span only | Yes | Accepted and unaccepted parts stay distinct |
| 7. Author edits candidate before acceptance | Candidate reviewed | Author | Narrative Insertion / Narrative Assertion, with provenance preserved | Edit then accept or reject | Edited candidate and later accepted span if chosen | Only on explicit acceptance | Yes | Contribution provenance remains visible |
| 8. Rejection | Candidate reviewed | Author | Draft Generation / Rewrite Loop | Reject candidate | Rejection disposition | No | No | Candidate remains non-truth |
| 9. Parking for later | Candidate reviewed | Author | Draft Generation / Rewrite Loop | Park candidate | Parked candidate | No | No | Candidate stays available |
| 10. Abandonment | Candidate reviewed | Author | Draft Generation / Rewrite Loop | Abandon candidate | Abandoned candidate | No | No | Candidate is left unaccepted |
| 11. Candidate becomes out of date | Source text changes | System | Draft Generation / Rewrite Loop | Mark candidate stale | Stale candidate marker | No | No | Staleness is visible |
| 12. Generation fails or returns partial text | Request in flight | Rewrite system | Draft Generation / Rewrite Loop | Fail or partially generate | Partial candidate or failure state | No | No | Partial output remains visible |
| 13. Author cancels | Candidate in flight or review | Author | None | Cancel before acceptance | No new object | No | No | Workflow stops cleanly |
| 14. Acceptance succeeds but related concerns remain open | Candidate accepted | Author | Narrative Insertion / Narrative Assertion | Accept text while other issues stay unresolved | Accepted text only | Yes, selected span only | Yes | Notes, Signals, critique, or continuity can remain open |

## Must Prove

- Candidate text remains temporary until explicit acceptance.
- Partial acceptance mutates only the selected accepted portion.
- Unaccepted candidate text remains non-truth.
- Author edits do not erase contribution provenance.
- Acceptance routes through Narrative Insertion / Narrative Assertion.
- Rewrite acceptance does not automatically close Notes, Signals, critique findings, or continuity concerns.
- Job completion is not acceptance.
- Candidate lifecycle does not become a universal manuscript lifecycle.
- Original source, candidate, and accepted result remain distinguishable.

## Special Risk

`Partially accepted` must be read as:

- a candidate lifecycle result,
- the exact accepted span,
- and the remaining unaccepted material.

It must not imply that the entire candidate became accepted.

## Forbidden Shortcuts

- No silent promotion from candidate to manuscript.
- No automatic closure of related findings.
- No provenance erasure after author edits.
- No job-complete equals accepted-text shortcut.

## Unresolved Questions

- How much candidate comparison history should be shown by default?
- What exact author controls should be used for partial acceptance in presentation layers?

## Stage 9 Deferrals

- Candidate diff density.
- Accepted-span highlighting and comparison presentation.
- The exact treatment of parked, abandoned, and stale candidate display.

## Stage 10 Deferrals

- Rewrite model qualification.
- Output-fidelity fixtures.
- Model replacement and retirement reliability.

## What This Proof Explicitly Does Not Prove

- It does not prove the best rewrite UI.
- It does not prove every candidate can be recovered after source changes.
- It does not prove implementation details for partial acceptance.
- It does not prove lifecycle automation beyond owner boundaries.

## Completion-Criteria Assessment

The workflow boundary is well defined if:

- candidate text stays temporary until accepted,
- partial acceptance touches only the selected span,
- provenance survives author edits,
- the accepted result is routed through the manuscript owner,
- unrelated Notes, Signals, critique, and continuity items remain open when appropriate.

## Provisional Assessment

Passed with Bounded Follow-up.
The ownership boundary is proved, and partial-acceptance presentation plus comparison behavior are routed to Stage 9.
