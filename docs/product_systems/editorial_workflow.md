# Editorial Workflow

## 1. Status Header

- Dossier name: `Editorial Workflow`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-18`
- Depends on: `Critique / Evaluation`, `Continuity`, `Feedback Notes / Revision Resolution`, `Signal Architecture`, `Draft Generation / Rewrite Loop`, `Narrative Insertion / Narrative Assertion`, `Workflow Spine / Author Journey`, `Writing Surface`, `Command Center Surface`, `Outline`, `Companion`
- Feeds into: `current_product_roadmap.md`, `capability_ownership_map.md`, adjacent editorial dossiers
- Runtime authority: `future`
- Authority level: `workflow-only`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Map the cross-system editorial journey from finding or concern through review, note or signal creation, revision action, re-evaluation, closure, and recurrence without creating a new durable-state owner.

## 3. Core Doctrine

- Editorial Workflow is a cross-system journey, not a durable-state owner.
- Temporary findings remain advisory until an owning conversion path accepts them.
- `Feedback Notes / Revision Resolution` owns durable note state.
- `Signal Architecture` owns durable signal state.
- `Draft Generation / Rewrite Loop` owns rewrite candidates only until truth-owner acceptance.
- `Narrative Insertion / Narrative Assertion` owns accepted manuscript changes.
- `Workflow Spine / Author Journey` may summarize progress, but it does not own the durable revision item.
- `Companion`, `Writing Surface`, `Command Center Surface`, and `Outline` may display, explain, or route editorial state without silently mutating it.
- No prose change, analyzer result, or surface gesture may silently close a durable note or durable signal.

## 4. Workflow Participants And Boundaries

| Participant | Owns | Does not own |
| --- | --- | --- |
| `Critique / Evaluation` | temporary critique findings, bounded local critique-run history | durable notes, durable signals, manuscript truth, rewrite acceptance |
| `Continuity` | temporary continuity findings, bounded local continuity-run history | accepted continuity truth, durable notes, durable signals, manuscript truth |
| specialized analyzers | temporary analyzer findings in their own lane | durable notes, durable signals, manuscript truth |
| `Feedback Notes / Revision Resolution` | durable concerns, comments, revision items, note resolution state | manuscript truth, durable signals |
| `Signal Architecture` | durable attention, urgency, blocking, suppression, snooze, and triage state | manuscript truth, durable notes |
| `Draft Generation / Rewrite Loop` | rewrite candidates and generated advisory text | accepted manuscript truth, durable notes, durable signals |
| `Narrative Insertion / Narrative Assertion` | accepted manuscript text and authoritative manuscript order | note closure, signal closure |
| `Workflow Spine / Author Journey` | bounded workflow posture and progress summaries | durable revision item ownership |
| `Companion` and surfaces | explanation, routing, visibility, source access | durable-state mutation by display alone |

## 5. Temporary Finding History Posture

Temporary finding history remains bounded local advisory history rather than a duplicate manuscript archive.

Initial validation defaults:

- retain roughly `30` recent completed runs per analyzer per project
- retain unpinned temporary history for roughly `180 days`
- use a generous project safety ceiling around `5,000` temporary findings
- trim oldest unpinned history first
- preserve manually pinned findings and anything converted into durable state

These numbers are provisional product defaults, not implementation constants.

History rules:

- trimming must be surfaced honestly
- protection, masking, and AI-exclusion rules still apply
- temporary finding history must not become shadow canon, a note archive, or a raw manuscript archive

## 6. Note Versus Signal

`Feedback Note` means a durable concern, comment, revision item, or issue the author wants to preserve and potentially resolve.

`Signal` means a durable attention, urgency, routing, blocking, suppression, snooze, or triage object.

Boundary rules:

- a signal may point to a note
- a note does not require a signal unless elevated attention is useful
- a temporary finding may offer `Save as Note`, `Flag for attention`, `Dismiss`, `Ignore`, and `Review source`
- the visible action is only a request; the owning system performs the durable mutation

## 7. Revision Intent Treatment

No separate revision-task system is introduced.

Durable revision intent lives inside `Feedback Notes / Revision Resolution` as note-local workflow posture. Notes may conceptually pass through states such as:

- `needs review`
- `revision intended`
- `revision underway`
- `ready for re-evaluation`
- `resolved`

These are product-meaning labels, not implementation enums.

`Workflow Spine / Author Journey` may summarize progress or next-step posture, but it does not own the durable revision item.

## 8. Visibility Model

Layered visibility:

- `Writing Surface`: quiet indicators, requested highlights, prominent blockers only, and direct access to source and explanation
- `Command Center Surface`: full review queues, filtering, grouping, evidence, notes, signals, revision status, and re-evaluation review
- `Outline`: linked icons or badges for notes, signals, revision state, recurrence candidates, or blocked analysis; selecting an icon routes to the owner; hiding an icon does not delete durable state
- `Companion`: explains, highlights, and routes; it is never required to access editorial work; it does not close, reopen, convert, or mutate durable artifacts silently

## 9. Closure And Recurrence

Closure is explicit and owner-specific.

Temporary findings may be:

- dismissed
- ignored
- converted
- expired from bounded history

Feedback Notes may be:

- resolved
- intentionally declined
- no longer relevant
- superseded

Signals may be:

- resolved
- dismissed
- suppressed
- expired
- superseded

Rewrite candidates may be:

- rejected
- abandoned
- accepted into manuscript truth

A prose change or analyzer result may recommend closure, but it cannot silently close a durable note or durable signal.

Recurrence rules:

- do not automatically reopen closed durable work
- later manuscript change or later analysis should create a temporary linked recurrence candidate
- the recurrence candidate should reference the earlier closed artifact
- the author may reopen the original, create a new note, or dismiss the recurrence candidate

## 10. Re-Evaluation

The original producer may re-evaluate revised material and report:

- appears resolved
- persists
- changed form
- insufficient evidence
- blocked by protection
- possible recurrence

The producer does not own durable note closure or durable signal closure.

## 11. Workflow Cases

| Case | Source | Durable owner if any | Author action | Durable mutation | Manuscript effect | Re-evaluation path | Closure owner | Forbidden hidden mutation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| finding dismissed | `Critique`, `Continuity`, or analyzer finding | none | dismiss finding | local advisory history may mark dismissed | none | rerun original producer later if needed | producing lane only | dismissed finding silently becoming note, signal, or truth |
| finding converted to note | temporary finding | `Feedback Notes / Revision Resolution` | `Save as Note` | durable note created | none until author revises prose | note may later request producer rerun | note owner | finding silently creating durable note |
| finding elevated to signal | temporary finding | `Signal Architecture` | `Flag for attention` | durable signal created | none | signal may later point back to source and trigger rerun | signal owner | finding silently creating durable signal |
| manual author-created note | author observation or imported editorial comment | `Feedback Notes / Revision Resolution` | create note | durable note created | none until author revises prose | note may later request critique or continuity review | note owner | note silently changing manuscript |
| continuity concern leading to revision | `Continuity` finding or note linked to continuity | note owner, optionally signal owner | save note, revise prose, request re-evaluation | durable note and optional durable signal | manuscript changes only through truth owner | continuity rerun reports outcome | note or signal owner as appropriate | continuity silently rewriting prose or closing note |
| specialized analyzer concern | analyzer finding | note owner or signal owner if converted | save, flag, dismiss, or ignore | note or signal only if explicitly converted | none until manual or accepted rewrite | rerun original analyzer | owner of converted artifact | analyzer silently creating workflow truth |
| manual revision | author prose edit | none unless linked note or signal exists | edit prose directly | manuscript truth changes through author action | accepted prose changes | original producer may re-evaluate later | note or signal owner if linked concern closes | revision silently resolving note or signal |
| rewrite candidate rejected | `Draft Generation / Rewrite Loop` output | none | reject or abandon rewrite | temporary rewrite candidate may be discarded or bounded-history only | none | source concern may remain open | rewrite lane for candidate history; note or signal stays with its owner | rejected rewrite silently retained as memory, note, or truth |
| rewrite candidate accepted | `Draft Generation / Rewrite Loop` output | `Narrative Insertion / Narrative Assertion` for prose; note or signal owner remains separate | explicit accept | accepted manuscript change | prose changes | original producer may re-evaluate changed text | note or signal owner still closes durable concern | accepted rewrite silently closing durable note or signal |
| ready for re-evaluation | durable note after revision | `Feedback Notes / Revision Resolution` | mark ready or request rerun | note posture updated | none beyond existing prose changes | original producer reruns if possible | note owner until explicit closure | workflow marker silently becoming closure |
| concern explicitly closed | durable note or durable signal | current owner | resolve, dismiss, suppress, decline, or supersede | owner-specific closure state | none unless already revised | later rerun may create recurrence candidate | note owner or signal owner | closure silently mutating manuscript |
| linked recurrence candidate | later analyzer or continuity run | none at first; may later point to note or signal owner | reopen original, create new note, or dismiss recurrence | only chosen owner mutates durable state | none until separate author action | future reruns continue through producer lane | chosen note or signal owner | automatic reopening of closed durable work |
| protected or AI-excluded material limiting analysis | any producer | none unless separately converted | inspect source limits, adjust scope, use manual path, or do nothing | maybe bounded blocked-history record only | none | producer may later rerun with allowed evidence | no closure by visibility limit alone | blocked analysis silently exposing excluded text or closing concern |

## 12. Writer-Facing Meaning

The editorial journey should read as:

1. something noticed
2. author reviews the source
3. author decides whether it deserves preservation, urgency, or no action
4. prose revision happens manually or through explicitly accepted rewrite
5. the original producer may re-check the affected material
6. durable concerns close only when their own owner records closure
7. later recurrence creates a new linked candidate rather than silently reopening history

## 13. Remaining Jason Decisions

- how visible editorial guidance should be by default versus summonable
- what exact writer-facing labels best separate notes, signals, blockers, and recurrence candidates
- when temporary history should be pinned or preserved beyond the provisional default posture
- how aggressively recurrence candidates should be surfaced after later manuscript change
- how much detail closed note and signal history should stay searchable without becoming clutter

## 14. Acceptance Criteria

This workflow map is acceptable only if:

- it does not invent a new durable-state owner
- temporary findings remain advisory by default
- notes and signals remain distinct durable lanes
- rewrite acceptance remains separate from note or signal closure
- recurrence creates linked candidates rather than silent reopen
- surfaces, `Outline`, and `Companion` remain display and routing layers rather than hidden editorial authority
