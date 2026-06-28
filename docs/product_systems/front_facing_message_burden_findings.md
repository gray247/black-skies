# Front-Facing System and Message-Burden Findings

## Status
- Stage 8 is active and unclosed.
- Stage 8 began through explicit author approval.
- The read-only planning pass is complete.
- Stage 7 — Missing Connector Review is complete and closed.
- The central Stage 8 audit program has been recorded.
- Three audit batches are planned.
- Stage 9 is not eligible.
- No GUI or interaction architecture has been selected.
- Implementation remains blocked.
- The 19-stage sequence is unchanged.

## Scope
Audit what the author must see, understand, decide, dismiss, recover from, or act upon.

## Governing doctrine
- Writing Surface remains the primary direct-writing surface and must stay quiet by default.
- Command Center supports review and routing but is not sovereign or a universal inbox.
- Companion is optional and contextual; it owns no task selection or workflow.
- Critique, Continuity, Notes, Signals, rewrite candidates, AI routes, save-state, recovery, and interchange remain distinct owner spaces.
- Advisory output is not accepted truth.

## Burden principles
- information vs action request
- advisory finding vs accepted truth
- warning vs failure vs degraded operation
- job completion vs destination acceptance
- route approval vs package approval vs destination acceptance
- current vs stale vs historical
- temporary candidate vs durable owner object
- system status vs manuscript status
- presentation burden vs architecture or implementation

## Required distinctions
- Do not merge information and action.
- Do not merge advisory output and accepted truth.
- Do not merge warning, failure, and degraded operation.
- Do not merge job completion and destination acceptance.
- Do not merge route approval, package approval, and destination acceptance.
- Do not merge current, stale, and historical state.
- Do not merge temporary candidates and durable owner objects.
- Do not merge system status and manuscript status.
- Do not treat presentation burden as architecture or implementation.

## Audit-label vocabulary
- essential immediate: must be visible now and usually requires action.
- essential noninterrupting: visible, but should not steal focus unless the author opts in.
- review queue: should be grouped for later review.
- contextual detail: useful supporting information, hidden by default.
- background status: health or state that matters but is not actionable right now.
- exceptional warning: rare or destructive-risk alert requiring stronger treatment.
- recoverable failure: failure with a safe next step.
- blocking decision: author must decide before progress can continue.
- redundant or mergeable: can be grouped with related messages.
- hidden by default: only show on demand or in detail panes.
- unsupported burden: should not be surfaced as a routine message.

## Front-facing inventory
| Object or message | Primary surface | Audit label | Why visible | Required action |
| --- | --- | --- | --- | --- |
| Direct writing and manuscript editing | Writing Surface | essential noninterrupting | Keep the author moving without dashboard friction | None unless the author summons support |
| Command Center summaries, blockers, and routed findings | Command Center | review queue | Help the author review what needs attention without owning it | Review, route, or dismiss |
| Companion summaries and suggestions | Both | contextual detail | Reduce re-entry cost without becoming mandatory | Dismiss, inspect, or follow up |
| Critique, continuity, and rewrite previews | Both | review queue | Show why a change is being suggested | Accept, reject, or defer |
| AI route, privacy, cost, queue, fallback, and result state | Command Center | blocking decision | Make transmission, spend, and route consequences legible | Approve or decline |
| Save, degraded mode, recovery, restore, and verification | Writing Surface and Command Center | exceptional warning | Prevent confusion between current work and recoverable state | Inspect, restore, or continue |
| Export, archive, import, and external provenance | Command Center | contextual detail | Preserve interchange clarity without overloading writing | Export, inspect, or route inward |
| Warnings, failures, stale states, partial results, onboarding, accessibility, focus, dismissal | Both | background status or exceptional warning | Reduce surprise without flooding the author | Acknowledge only when needed |

## Known risks
- warning repetition and fatigue
- Companion verbosity and interruption
- distinction among Notes, Signals, findings, candidates, and accepted truth
- AI disclosure density
- queue completion versus acceptance
- restore and recovery wording
- export/archive/import distinctions
- provenance and currentness visibility
- failure ownership and safe-next-action messaging
- accessibility, focus stability, keyboard readability, and dismissal burden

## Initial conclusions
- Writing Surface must remain usable and quiet by default.
- Command Center supports review and routing but is not sovereign or a universal inbox.
- Companion is optional and contextual; it owns no task selection or workflow.
- Provenance must be reachable without flooding ordinary writing.
- Stale and partial states remain visible without dominating attention.
- Failures must name the responsible system and next safe action.
- Destructive actions require stronger treatment than reversible actions.
- No message may imply AI authority.
- Terminology must remain understandable to a nontechnical author.
- Direct writing, manual handoff, and on-demand provenance are sufficiently governed for audit entry.
- Repeated warnings may require grouping or consolidation, but suppression must not conceal important failures.
- Accessibility is a Stage 8 burden criterion, while Stage 9 owns final accessibility and interaction design.

## Sufficiently governed items
- Direct writing without AI or dashboard use.
- Manual handoff and manual interchange boundaries already covered by current doctrine.
- On-demand provenance display.
- Clear save-state, snapshot, backup, restore, export, and import distinctions.
- Advisory findings, notes, signals, and rewrite candidates already have distinct owner paths.

## Deeper-review items
- warning repetition and fatigue
- Companion verbosity and interruption
- distinction among Notes, Signals, findings, candidates, and accepted truth
- AI disclosure density
- queue completion versus acceptance
- restore and recovery wording
- export/archive/import distinctions
- provenance and currentness visibility
- failure ownership and safe-next-action messaging
- accessibility, focus stability, keyboard readability, and dismissal burden

## Batch plan
1. Direct writing and surface responsibility: Writing Surface, Command Center, Companion, direct writing without AI or dashboard use, Notes, Signals, findings, accepted truth, history, and provenance.
2. Advisory and AI workflow burden: critique, continuity, rewrite and partial acceptance, reorder previews, AI route, privacy, cost, package, queue, fallback, results, and acceptance.
3. Recovery, interchange, and cross-cutting burden: save and degraded mode, snapshots, backup, restore, and verification; export, archive, import, and external provenance; warnings, failures, stale and partial results; onboarding, accessibility, focus, dismissal, and nontechnical terminology.

## Batch 1 findings
Batch 1 complete.

| Object or message | Owner | Audit label | Why visible | Required action | Surface |
| --- | --- | --- | --- | --- | --- |
| Direct writing and manuscript editing | Writing Surface | essential noninterrupting | Keep the author moving without dashboard friction | None unless support is summoned | Writing Surface |
| Writing Surface quiet-by-default cues | Writing Surface | background status | Keep the primary surface obvious without noise | None | Writing Surface |
| Command Center summaries, blockers, and routed findings | Command Center | review queue | Help the author review attention without owning it | Review, route, or dismiss | Command Center |
| Companion summaries and suggestions | Companion | contextual detail | Reduce re-entry cost without becoming mandatory | Dismiss, inspect, or follow up | Both |
| Notes and Signals | owner systems | review queue / exceptional warning | Preserve distinct attention objects | Review or route through the owning workflow | Both |
| Critique, continuity, and rewrite previews | owner systems | review queue | Show why a change is suggested | Accept, reject, or defer through owner paths | Both |
| Accepted manuscript truth | Narrative Assertion / truth owner | essential immediate | Durable authored state | None unless the author changes it | Writing Surface |
| Accepted planning truth | planning owner | contextual detail | Helpful planning state distinct from manuscript truth | Inspect or route | Command Center or both |
| History and provenance | history / provenance owners | background status / contextual detail | Make currentness and source identity reachable on demand | Inspect on demand | Both |
| Search and memory-derived context | search / memory owners | hidden by default | Useful only when summoned and may be stale | Inspect on demand | Both |

- Writing Surface remains the obvious primary action and stays quiet by default.
- Command Center supports review and routing, but it owns none of the routed objects.
- Companion is optional and contextual; it should not own task selection or workflow.
- Notes, Signals, findings, candidates, accepted truth, history, and provenance remain distinct.
- Accepted manuscript truth and accepted planning truth remain distinct.
- Search and memory context must remain subordinate to current owner state.
- Direct writing remains the primary action even when support surfaces are visible.
- No dossier corrections or author decisions are required for Batch 1.
- Stage 9 owns labeling, ordering, visibility, warnings, focus, dismissal, and accessibility presentation.
- Stage 10 owns reliability, stale/partial behavior under stress, recovery verification, and provider/queue robustness.
- Stage 12 is reserved for any later true architecture or ownership question.
- Batch 2 is next but unstarted.

## Stage 9 routing
Labels, ordering, visibility, warnings, disclosure density, focus, dismissal, accessibility presentation, and interaction architecture.

## Stage 10 routing
Reliability, recovery verification, stale and partial behavior under stress, provider and queue robustness.

## Stage 12 routing
Only a true architecture identity or ownership question discovered later; do not invent one now.

## Dossier corrections
None identified at planning pass.

## Author decisions
None required at planning pass.

## Remaining Stage 8 work
- Batch 2 is next but unstarted.
- Reassess any surfaced burden and route it to Stage 9, Stage 10, or Stage 12 as appropriate.
- Keep GUI design, exact interaction mechanics, and architecture selection deferred.
