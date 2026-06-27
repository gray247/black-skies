# Workflow Proof WP-05 - Companion Re-entry Without Workflow Ownership

## Status

Status: In Proof
- Draft complete
- Official result pending review
- Provisional assessment recommends likely Passed with Bounded Follow-up

## Author Goal

Show that Companion can provide bounded re-entry support without becoming the task owner, workflow owner, memory owner, or truth owner.

## Scope

This proof covers the path from project return through Companion invocation, bounded re-entry summary, route suggestion, dismissal, direct writing, and owner-controlled follow-up.
It proves non-ownership and re-entry visibility.
It does not prove the best presentation design or any operational caching or performance model.

## Preconditions

- A project already exists.
- The author has returned to the project or opened it after a break.
- Companion can summarize from authorized sources only.
- Underlying source owners remain intact and visible.

## Initiating Actor and Surface

- Initiating actor: author
- Initiating surface: Writing Surface, with Companion invoked or surfaced as a bounded support layer; Command Center may show status but does not own re-entry

## Participating Systems

- Companion
- Writing Surface
- Command Center Surface
- Project Index / Search / Retrieval
- Memory Lab
- Feedback Notes / Revision Resolution
- Signal Architecture
- Continuity
- Async Job Queue / Task Runner
- Snapshots / Backup / Restore / History

## Source Owner

- Companion summary surface only; each summarized item remains owned by its original source system

## Destination Owner

- The owner selected by the author after re-entry, or the Writing Surface if the author dismisses Companion and continues directly

## Objects Read

- recent project activity
- source records
- memory records
- unresolved Notes
- active Signals
- critique findings
- continuity findings
- rewrite candidates
- queued, failed, or completed jobs
- history and recovery state
- current project state

## Objects Created

- bounded re-entry summary
- safe route suggestions
- optional author-selected handoff or no handoff

No Note, Signal, critique finding, rewrite candidate, or accepted truth is created automatically.

## Objects Transformed or Routed

- summary assembled from authorized sources
- routes suggested back to the owning systems
- author dismissal or route selection routed to the author-controlled next step
- direct writing resumed without Companion when chosen

## Required Distinctions

- Companion summary
- source record
- memory record
- recent project activity
- unresolved Note
- active Signal
- critique finding
- continuity finding
- rewrite candidate
- queued or completed job
- historical state
- current project state
- suggested next route
- selected author task
- accepted truth

## Path Matrix

| Path | State before | Actor | Owner responsible | Action | Object produced or changed | Truth mutation | Approval required | Author-visible result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Author opens or returns to a project | Project exists; author absent or returning | Author | Writing Surface | Re-enter project | Re-entry context | No | No | Project resumes visibly |
| 2. Companion is invoked or appears | Re-entry underway | System or author | Companion | Surface bounded support | Companion summary frame | No | No | Companion becomes available |
| 3. Recent context is assembled | Source data exists | Companion | Source owners remain original owners | Gather authorized context | Bounded summary inputs | No | No | Relevant context is visible |
| 4. Source owners and timestamps/currentness remain visible | Summary building | Companion | Source owners | Label source and currentness | Source-labeled summary | No | No | Author sees where each item came from |
| 5. Unresolved items are summarized without merging lifecycles | Open items exist | Companion | Each item's owner | Summarize outstanding work | Re-entry summary item | No | No | Items stay distinct |
| 6. Companion offers safe routes back to relevant owners | Summary complete | Companion | Companion, with route owners preserved | Suggest route options | Suggested routes | No | No | Route suggestions are visible |
| 7. Author dismisses Companion | Summary visible | Author | None | Close support layer | Dismissal state | No | No | Companion no longer occupies attention |
| 8. Author begins direct writing | Companion dismissed or ignored | Author | Writing Surface | Continue writing directly | Manuscript work | No | No | Writing proceeds without Companion |
| 9. Author opens a Note | Note exists | Author | Feedback Notes / Revision Resolution | Follow Note route | Note review state | No | Yes, owner route | Note opens through owner path |
| 10. Author inspects a Signal | Signal exists | Author | Signal Architecture | Follow Signal route | Signal review state | No | Yes, owner route | Signal opens through owner path |
| 11. Author reviews critique or continuity finding | Finding exists | Author | Critique / Evaluation or Continuity | Inspect finding | Finding review state | No | No | Finding remains advisory |
| 12. Author resumes candidate review | Candidate exists | Author | Draft Generation / Rewrite Loop | Continue candidate review | Candidate review state | No | No | Candidate remains temporary |
| 13. Author checks a queued, failed, or completed AI job | Job exists | Author | Async Job Queue / Task Runner | Inspect job state | Job status view | No | No | Job state is visible without owning re-entry |
| 14. Author inspects history or recovery state | History exists | Author | Snapshots / Backup / Restore / History | Inspect recovery context | History or restore view | No | No | Current and historical states remain distinct |
| 15. Summary is incomplete | Some sources unavailable or unscannable | Companion | Companion, with source owners still visible | Return partial summary | Partial summary | No | No | Incompleteness is visible |
| 16. One or more sources are unavailable | Source missing or offline | Companion | Original source owner | Mark unavailable source | Missing-source marker | No | No | Missing source remains explicit |
| 17. Summary contains stale material | Source changed after capture | Companion | Source owners | Mark stale context | Stale summary item | No | No | Staleness stays visible |
| 18. Sources conflict | Different sources disagree | Companion | Source owners remain separate | Present conflict without resolving it | Conflict summary | No | No | Conflict remains distinct |
| 19. AI is unavailable | No AI route available | System | Companion or route owner | Continue without AI | No-AI summary path | No | No | Re-entry still works |
| 20. Project is operating without AI | No-AI posture active | Author | Writing Surface | Resume re-entry without AI | Manual re-entry state | No | No | Direct work remains available |
| 21. Companion fails | Support layer errors | System | Companion | Fail gracefully | Failure state | No | No | Failure is visible, not hidden |
| 22. Author cancels or closes re-entry assistance | Support visible | Author | None | Cancel support | Cancellation state | No | No | Companion closes cleanly |
| 23. Companion suggests a route the author rejects | Suggested route visible | Author | Companion remains non-owning | Reject suggestion | No route handoff | No | No | Suggestion is advisory only |
| 24. Author explicitly selects a route | Route visible | Author | Selected owner | Choose owner path | Route handoff | No | Yes, owner route | Selected route becomes the next step |
| 25. Author resumes ordinary Writing Surface work | Re-entry complete | Author | Writing Surface | Continue writing | Manuscript work | No | No | Writing Surface remains sovereign |

## Must Prove

- Companion does not choose the author's next task.
- Companion does not prioritize work as binding.
- Companion does not resolve source conflicts.
- Companion does not approve changes.
- Companion does not create or close Notes, Signals, findings, or candidates automatically.
- Companion does not mutate accepted truth.
- Companion does not own memory, search, history, jobs, or project state.
- Companion summary is not a canonical project summary.
- Missing or stale sources remain visible.
- Conflicting sources remain distinct.
- Suggested route is not workflow execution.
- Author can dismiss Companion and write directly.
- Companion is not required for project access or re-entry.
- AI unavailability does not block re-entry.
- Command Center may surface status but does not become the workflow owner.
- Writing Surface remains sovereign.

## Re-entry Source Discipline

For every summarized item, preserve where applicable:

- source system
- source owner
- currentness or timestamp
- confidence or uncertainty
- active, historical, stale, candidate, or unresolved meaning
- route back to the owning system

Do not create a universal important, ready, next, or resolved state.

## Provenance Checkpoints

- summary inputs retain their source owners
- currentness and stale state stay visible
- unresolved item state remains visible
- route suggestions identify the owning system
- no hidden conversion from summary into durable truth

## Approval Checkpoints

- author dismissal of Companion
- author selection of a route
- owner-specific approval only when the selected route requires it

## Mutation Checkpoints

- Companion summary does not mutate truth
- Companion route suggestions do not mutate truth
- only the selected owner workflow may mutate its own objects
- direct writing through Writing Surface remains manual

## Author-Visible State

- summary context
- source labels and currentness
- unresolved items
- stale or missing material
- suggested routes
- dismissible support layer
- direct writing entry path

## Forbidden Shortcuts

- No automatic task selection.
- No automatic conflict resolution.
- No automatic approval.
- No automatic Note, Signal, or candidate creation.
- No canonical project summary.
- No memory or search ownership.
- No workflow ownership.

## Unresolved Questions

- How dense should the re-entry summary be by default?
- Should the support layer appear automatically on return or only by request?

## Stage 9 Deferrals

- Re-entry summary density.
- Default visibility.
- Interruption behavior.
- Source labels.
- Uncertainty display.
- Quiet presentation.
- Dismissal behavior.
- Keyboard and focus behavior.

## Stage 10 Deferrals

- Large-project re-entry performance.
- Cache freshness.
- Source-unavailable behavior under operational stress.
- Local-model qualification if AI summarization is used.
- Reliability and recovery fixtures.

## What This Proof Explicitly Does Not Prove

- It does not prove the best Companion UI.
- It does not prove background caching or persistence policy.
- It does not prove live collaboration or shared editing.
- It does not prove automatic recommendation quality.

## Completion-Criteria Assessment

The workflow boundary is well defined if:

- Companion remains a bounded support layer,
- source ownership stays visible,
- stale and missing material stay visible,
- the author can dismiss Companion and continue directly,
- selected routes return control to the proper owner,
- Companion never becomes the workflow owner.

## Provisional assessment

Likely Passed with Bounded Follow-up.
The non-ownership boundary is proved, and summary density plus re-entry presentation remain Stage 9 work while large-project performance and recovery behavior remain Stage 10 work.
