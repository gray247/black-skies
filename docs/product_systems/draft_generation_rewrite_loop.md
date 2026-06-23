# Draft Generation / Rewrite Loop

## 1. Status Header

- Dossier name: `Draft Generation / Rewrite Loop`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-23`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Writing Surface`, `Model Routing And Budget Architecture`, `LLM Package Construction Architecture`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Feedback Notes / Revision Resolution`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define draft generation and rewrite support as an advisory loop that may propose text or revision options without silently becoming authored truth.

## 3. User Problem Solved

The writer may want bounded help drafting or rewriting while preserving authorship, approval, routing, and privacy controls.

## 4. What The System Does

- propose draft text,
- propose rewrite variants,
- support explicit review and acceptance workflows.

## 5. What The System Does Not Do

- auto-accept generated text,
- silently spend money,
- silently mutate manuscript truth.

## 6. User-Facing Behavior

Visible behavior should emphasize advisory text, explicit review, and author control.

## 7. Hidden/Background Behavior

Background preparation may assemble context, but generation remains governed and non-authoritative.

## 8. What Appears First

- advisory outputs,
- clear labels,
- explicit accept or reject or dismiss choices.

## 9. What Is Summonable

- alternate variants,
- source context,
- package and routing detail.

## 10. What Is Hidden Until Needed

- deep provenance,
- heavy comparison,
- provider-specific detail.

## 11. Inputs

- author prompts,
- accepted narrative context,
- approved package context,
- routing state.

## 12. Outputs

- draft suggestions,
- rewrite suggestions,
- critique-adjacent notes,
- rewrite candidates that may optionally keep a source-concern link back
  to the finding, note, or signal that framed the request.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Feedback Notes / Revision Resolution`

## 14. What Gets Stored

- generated artifacts only when explicitly retained or when bounded
  review history is needed,
- provenance,
- author action history where needed,
- candidate-state transitions where needed for honest review posture.

## 15. What Remains Temporary

- all draft and rewrite candidates until explicit acceptance,
- rejected variants unless the author deliberately preserves them,
- transient candidates,
- unsaved rewrite comparisons,
- parked rewrite candidates,
- abandoned rewrite candidates that are not accepted into manuscript
  truth,
- stale candidates whose source changed after request start.

## 15A. Candidate Lifecycle State Model

Draft Generation owns temporary candidate lifecycle only.
It does not own accepted manuscript truth, durable notes, durable
signals, critique findings, AI-governance policy, protected-package
routing, or author-approval doctrine.

Candidate states:

- `generated`
  Meaning: output exists as fresh advisory text that has not yet entered
  active review.
  May do: appear as a labeled candidate with provenance, request
  purpose, and source link where relevant.
  May not do: mutate manuscript truth, close notes, close signals, or
  create memory.
- `reviewing`
  Meaning: the writer is actively inspecting, comparing, or considering
  the candidate.
  May do: surface comparisons, warnings, source context, and related
  request details.
  May not do: silently accept any text or silently convert concern
  state.
- `accepted`
  Meaning: the writer explicitly accepts the full selected candidate
  into manuscript truth through the truth-owner path.
  May do: create accepted manuscript change through
  `Narrative Insertion / Narrative Assertion`.
  May not do: silently close durable notes, durable signals, or create
  accepted project truth elsewhere.
- `partially accepted`
  Meaning: only a bounded subset of the candidate is accepted, while
  the full candidate remains not fully adopted.
  May do: apply only the explicitly accepted portion through the
  truth-owner path and preserve that the remainder stayed advisory.
  May not do: treat the untouched remainder as accepted truth.
- `rejected`
  Meaning: the writer explicitly declines the candidate.
  May do: preserve bounded rejected-history posture if policy allows.
  May not do: remain active context, future model context, memory,
  note, signal, or truth by default.
- `parked`
  Meaning: the writer wants to keep the candidate available for later
  reconsideration without accepting it now.
  May do: stay visible in a bounded preserved queue with provenance and
  source relation.
  May not do: act as accepted truth, active note closure, or automatic
  future-model context.
- `abandoned`
  Meaning: the candidate is no longer under active review and is not
  intentionally preserved as a live alternative.
  May do: remain only in bounded history if retained.
  May not do: surface as current draft guidance by default.
- `stale` or `source changed`
  Meaning: the relevant source text, scope, or governing context changed
  after the request began or after the candidate was produced.
  May do: remain inspectable with an honest stale label and route to
  comparison or rerun.
  May not do: present itself as current-fit text or silently reattach
  to changed prose.

State-transition doctrine:

- `generated` normally moves to `reviewing`, `rejected`, `parked`, or
  `stale`.
- `reviewing` may move to `accepted`, `partially accepted`, `rejected`,
  `parked`, `abandoned`, or `stale`.
- `parked` may later return to `reviewing`, become `rejected`, or
  become `abandoned`.
- `stale` may return to `reviewing` only after explicit author review;
  otherwise it may be parked, rejected, or abandoned.
- only `accepted` and `partially accepted` may mutate manuscript truth,
  and only through explicit truth-owner acceptance.

## 15B. Partial Accept Behavior

Partial acceptance means the writer may accept only a selected portion
of a candidate without accepting the whole output.

Required posture:

- the accepted portion becomes manuscript truth only through explicit
  acceptance into `Narrative Insertion / Narrative Assertion`
- the unaccepted remainder stays advisory
- the original full candidate remains provenance-visible as the source
  of the accepted subset
- partial acceptance does not silently convert the remaining text into a
  parked alternative, memory, note, or signal
- later review may still reject, park, or abandon the unaccepted
  remainder
- partial acceptance must remain distinguishable from full acceptance in
  history and review posture

## 15C. Comparison Posture

Side-by-side comparison is:

- mandatory for rewrite output that proposes direct alteration of
  accepted manuscript text
- mandatory when source text changed and a stale candidate is still
  being considered
- recommended when warnings indicate canon drift, voice drift,
  foreshadow or payoff damage, continuity risk, or explicit-content
  sensitivity
- optional for blank-page drafting, small bounded continuations, or
  exploratory alternates that do not overwrite existing accepted prose

Comparison remains advisory display.
It does not perform acceptance, truth mutation, or note or signal
closure by itself.

## 15D. Mandatory Warning Classes Before Acceptance

Before accepting a candidate, the system must be able to surface
relevant warnings such as:

- `canon drift risk`
- `voice drift risk`
- `foreshadow or payoff damage risk`
- `continuity risk`
- `explicit-content or protected-package risk`
- `source-staleness risk`

Warning doctrine:

- warnings are advisory review aids, not automatic refusal by
  themselves
- warnings must not silently rewrite, suppress, or auto-correct the
  candidate
- acceptance with warnings still requires explicit author action
- protected-content and outbound-package risks must respect the
  existing AI-governance authorities rather than inventing local policy

## 15E. Rejected-Output Retention And Visibility

Rejected output is not retained as active writing context by default.

Required posture:

- rejected candidates may remain in bounded local review history
- rejected candidates must stay clearly labeled as rejected
- rejected candidates must be excluded from ordinary `Memory Lab`
  transfer, durable signals, durable notes, and future model context by
  default
- rejected candidates must not be treated as accepted truth, preferred
  draft, or approved summary
- the author may deliberately preserve rejected output as a manual
  retained artifact for later comparison or reconsideration
- deliberate preservation does not change its rejected status unless the
  author later re-enters review and explicitly accepts some or all of it

## 15F. Stale-Result Reattachment

If source text changes after the request starts, the candidate becomes
`stale` rather than silently reattaching to the changed passage.

Required posture:

- preserve the original source relation and last-known scope honestly
- mark the candidate `stale` or `source changed`
- offer explicit review paths such as compare against current source,
  park, rerun, reject, or abandon
- do not silently bind the candidate to similar nearby text
- do not silently apply the candidate to a changed location
- if the writer still wants to accept text from a stale candidate, the
  stale condition must remain visible during review
- partial acceptance from a stale candidate remains allowed only through
  explicit author review

## 16. Relationship To Narrative Insertion / Assertion

Only explicit author acceptance may convert generated material into author-owned truth.
Rewrite candidate closure is owner-specific: a candidate may be
rejected, abandoned, or accepted into manuscript truth, but accepting
or rejecting the rewrite does not silently close a durable note or
durable signal.

## 17. Relationship To Story Units

Story Units may scope generation context optionally.

## 18. Relationship To Prose / Scene Projection

Projection may host draft comparisons without becoming truth.

## 19. Relationship To Writing Surface

The Writing Surface may host:

- small current-text generation or rewrite requests,
- quick review of the current candidate,
- explicit accept, partial accept, reject, park, or dismiss actions,
- mandatory side-by-side comparison when direct accepted-prose rewrite
  is under review,
- quiet warning exposure when risk is relevant.

The Writing Surface may not hide approval boundaries, deep protection
warnings, or stale-source posture.

## 20. Relationship To Command Center Surface

The Command Center Surface owns heavier support flow such as:

- bulk candidate review,
- richer side-by-side comparison,
- alternate-variant comparison,
- request history and provenance inspection,
- package, routing, and approval detail,
- stale-source reconciliation,
- preserved rejected or parked candidate review.

This does not make Command Center a truth owner.

## 21. GUI Placement Principles

Keep generation support bounded and avoid crowding default writing.

Surface split:

- `Writing Surface`: fast request, current candidate review,
  explicit acceptance decisions, and minimal high-value warnings
- support flow: comparison, source explanation, and summonable context
  that expands only when needed
- `Command Center Surface`: multi-candidate review, rich history,
  package and routing inspection, stale reconciliation, and preserved
  alternatives

## 22. Local LLM Role

Local models are a likely path for cheaper or private generation support.

## 23. Paid API Role

Paid models remain optional, approval-governed, and spend-constrained.

## 24. Model Routing Notes And Cost / Budget Impact

Generation and rewrite flows must obey routing, budget, and approval doctrine.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Outbound generation packages must respect masking, package construction, and explicit-content boundaries.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected or excluded material must not leak into generation context by default.

## 27. Testing Requirements

Prove generated or rewritten text never becomes accepted truth silently.

## 28. Governance Rules And Risks

- no silent truth mutation,
- no silent paid or outbound work,
- no hidden authorship drift.

## 29. Failure Modes

If generation fails, writing still proceeds directly.

If source changes during a run, the result must surface as stale rather
than silently current.

## 30. v1 Boundary

Bounded generation and rewrite suggestions with explicit acceptance.

## 31. v2 Boundary

Richer review loops and provider-aware comparisons.

## 32. Future-Only Boundary

Heavy autonomous revision systems.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from `# 27. Revision / Rewrite Questions` plus adjacent AI rewrite questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `4 Critical`, `2 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Future contract need: what final writer-facing language should name
  states such as `parked`, `abandoned`, and `partially accepted`
  without blurring them together?

### Major Questions

- Major: how much rejected-history depth should remain visible before it
  becomes clutter rather than useful evidence?
- Major: which warning classes should be quiet badges versus forced
  acknowledgement at review time?

### Minor Questions

- Minor: what user-facing language best distinguishes generate, rewrite, edit, suggestion, revision task, and branch or version states?

### Answered / Superseded Questions

- AI is advisory unless accepted by the user.
- Superseded by current doctrine: generated or rewritten text must remain untrusted until explicit author acceptance, and no rewrite may silently mutate accepted truth.
- Resolved here: candidate lifecycle states are `generated`,
  `reviewing`, `accepted`, `partially accepted`, `rejected`, `parked`,
  `abandoned`, and `stale` or `source changed`.
- Resolved here: side-by-side comparison is mandatory for direct
  accepted-prose rewrite and stale-source review, recommended for
  higher-risk rewrite cases, and optional for bounded drafting cases.
- Resolved here: warning classes include canon drift, voice drift,
  foreshadow or payoff damage, continuity risk, explicit-content or
  protected-package risk, and source-staleness risk.
- Resolved here: rejected output may remain in bounded local review
  history but is excluded from ordinary `Memory Lab`, signal, note, and
  future-model context by default.
- Resolved here: stale output does not silently reattach; it must stay
  visibly stale and route through explicit review.
- Questions better owned elsewhere: whether rewrite output updates signals, assertions, Outline, Story Units, or Memory Lab belongs partly to those owning-system dossiers.

### Deferred Questions

- Deferred: exact provider-specific tuning behavior.

## 34. Acceptance Criteria

This dossier is acceptable only if generated text remains advisory until explicitly accepted.
