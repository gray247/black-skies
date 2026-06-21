# Foreshadow / Payoff

## 1. Status Header

- Dossier name: `Foreshadow / Payoff`
- Status: `drafted`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-19`
- Depends on: `Narrative Insertion / Narrative Assertion`, `Story Unit`, `Continuity`, `Signal Architecture`, `Outline`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Outline`
- Runtime authority: `future`
- Authority level: `support state and advisory findings`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define Foreshadow / Payoff as advisory setup-payoff analysis and
author-approved linkage support across narrative elements without
creating hidden canon, silent structural rewrites, or a second
narrative-truth owner.

## 3. User Problem Solved

The writer may want help spotting missing setup, weak payoff links,
callbacks, reveals, or intentional misdirection without surrendering
authorship or structural authority.

## 4. What The System Does

- inspect possible setup, payoff, reveal, callback, clue, promise, and
  misdirection relationships,
- surface advisory cues when review is relevant,
- store author-approved durable support links that the author wants
  Black Skies to track together,
- support explicit review of linked narrative moments across
  manuscript, planning, and prototype contexts.

## 5. What The System Does Not Do

- invent accepted links automatically,
- own underlying plan, prose, or narrative truth,
- prove interpretation merely because passages are linked,
- rewrite structure silently,
- claim perfect causal understanding.

## 6. User-Facing Behavior

Visible behavior should emphasize optional cues, clear evidence, bounded
confidence, and the difference between saved support links and
temporary inferred links.

## 7. Hidden/Background Behavior

Background pattern analysis may exist later, but remains advisory.
Unresolved setup is not a defect unless review context makes it
relevant.

## 8. What Appears First

- small setup or payoff cues,
- current relevant links,
- saved durable links,
- clear evidence references.

## 9. What Is Summonable

- deeper link maps,
- evidence trails,
- candidate link detail,
- prototype timing comparison,
- stale-link detail.

## 10. What Is Hidden Until Needed

- dense chain graphs,
- broader analytical history,
- heavy review workflows.

## 11. Inputs

- planned placement and intended order from `Outline`,
- narrative-purpose grouping from `Story Unit`,
- accepted assertions,
- manuscript evidence,
- continuity support,
- prototype context.

## 12. Outputs

- advisory setup or payoff cues,
- candidate-link views,
- saved durable-link views,
- unresolved, fulfilled, abandoned, ambiguous, red-herring, or stale
  support posture,
- signal summaries.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Outline`

## 14. What Gets Stored

- author-approved durable support links,
- candidate link references,
- source and provenance references for saved links,
- saved support posture,
- signal references,
- view and filter state.

## 14A. Setup / Payoff Object Model

Foreshadow / Payoff tracks relationships among narrative support
objects such as:

- setup
- clue
- promise
- plant
- motif-linked setup
- callback
- reveal
- consequence
- resolution
- payoff
- partial payoff
- deliberate non-payoff
- subversion
- abandoned setup
- superseded plan

An item may be planned, detected, saved, stale, abandoned, or
partially fulfilled.

It may store:

- planned link state
- detected link state
- accepted upstream truth reference
- manuscript evidence reference
- advisory interpretation
- display state
- directionality
- source anchors
- evidence
- confidence
- timeframe
- expected resolution window
- primary truth owner
- secondary references
- accepted-reference or advisory-link state

The map does not become a fact owner.

## 14B. Lifecycle

Foreshadow / Payoff lifecycle states include:

- candidate
- planned
- detected
- reviewed
- accepted through owner
- dismissed
- expired
- stale
- superseded
- partially fulfilled
- abandoned
- archived
- restored
- detached
- deleted support state

Deleting support state must not delete source truth.
Stale state must be exposed rather than silently reconstructed as a new
or still-current link.

## 14C. Planned Versus Detected

Planned support routes according to the claim being made:

- project-level creative promise -> `Author Intent / Story Setup`
- planned structural placement -> `Outline`
- manuscript evidence -> `Narrative Insertion / Narrative Assertion`
- character or lore fact connection -> the respective card owner
- detected setup/payoff relationship -> advisory support

Detected links remain advisory until explicitly routed through the
correct owner.
Acceptance of upstream truth does not make the detected relationship
itself accepted truth.

## 14D. Time, History, And Conflict

Foreshadow / Payoff may represent:

- planned versus detected connection
- source anchors
- directionality
- evidence
- confidence
- timeframe
- expected resolution window
- stale or broken link
- partially fulfilled payoff
- superseded plan
- abandoned setup
- archive, dismissal, and deletion posture

It may also represent deliberate non-payoff or subversion without
treating that as a defect by default.

## 14E. Shared Support State

Foreshadow / Payoff may store:

- author-approved durable support links
- candidate link references
- source and provenance references
- saved support posture
- signal references
- view and filter state

These are support records, not narrative truth.
Unresolved or intentionally unresolved setup/payoff links remain quiet
by default but summonable. They become prominent only when requested,
when blocking a chosen workflow, or when explicitly promoted through the
proper attention owner.

Findings do not automatically become Notes or Signals. Review
collections remain non-owning, dismissal does not delete source truth,
and recurrence creates a linked advisory candidate rather than reopening
durable work automatically.

## 15. What Remains Temporary

- inferred links,
- AI- or analyzer-inferred links,
- transient graph views,
- unsaved analysis.

## 16. Relationship To Narrative Insertion / Assertion

Accepted setup or payoff truth and manuscript evidence must come from
explicit author-owned sources.
A saved Foreshadow / Payoff link only means the author wants those
elements tracked together.

## 17. Relationship To Story Units

Story Units may own grouped narrative-purpose planning that Foreshadow /
Payoff can inspect without owning the underlying plan.

## 18. Relationship To Prose / Scene Projection

Projection may help compare related material, reveal order, and
prototype timing without becoming authority.

## 19. Relationship To Writing Surface

The Writing Surface may host small current-text cues only.
Unresolved-link warnings should stay quiet and summonable unless the
current review boundary makes them relevant.

## 20. Relationship To Command Center Surface

Heavier linkage review, conflict review, stale-link inspection,
prototype comparison, and cleanup belong in the Command Center.

## 21. GUI Placement Principles

Keep cues non-dominating and support-first.

## 22. Local LLM Role

Local AI may later assist with deeper relationship analysis.

## 23. Paid API Role

Paid analysis remains optional and approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Heavier analysis must respect routing and spend rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Any outbound analysis package must respect masking, AI-exclusion,
never-send, approved-summary, and local-only package rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Protected, excluded, local-only, never-send, masked, unrevealed,
author-known secret, character-known belief, reader-hidden, or
AI-excluded material must not leak through evidence paths, labels,
summaries, previews, exports, Companion answers, prototype projections,
or AI packages.
Use masks and approved summaries at reader-visible or recipient-visible
boundaries.

## 27. Testing Requirements

Prove advisory or saved support links do not become accepted truth
silently and do not rewrite planning or manuscript order.

## 28. Governance Rules And Risks

- no hidden canon,
- no false certainty,
- no silent truth mutation,
- candidate links remain temporary by default,
- saved links are support records, not narrative truth,
- unresolved or stale links should surface only when review context
  makes them relevant.

## 29. Failure Modes

If linkage analysis fails, the writer still tracks setup and payoff
manually.

## 30. v1 Boundary

Basic advisory cues, explicit evidence review, and author-approved
durable support links.

## 31. v2 Boundary

Richer relationship views, prototype comparison, and stale-link review
support.

## 32. Future-Only Boundary

Deep automated structural repair suggestions.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed:
  `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, from Outline marker questions,
  critique-scope questions, and continuity contradiction edge cases
- stale placeholder questions removed or superseded: yes
- active question count after merge: 7
- remaining blocker summary: `0 Fatal`, `3 Critical`, `2 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: what exact setup/payoff vocabulary should ship first for
  saved support links and review findings?
- Critical: how should this system distinguish broken setup from
  intentional clue, mystery, contradiction, red herring, or
  `payoff later` state without silently canonizing the interpretation?
- Future contract need: what exact review boundaries should trigger
  temporary unresolved-link findings versus leaving planned links quiet?

### Major Questions

- Jason decision candidate: how much linkage context belongs in
  `Outline` versus `Command Center Surface` versus bounded
  `Writing Surface` cues?
- Major: how visible should abandoned, intentionally unresolved, and
  intentional-red-herring links remain by default after revision?

### Minor Questions

- Minor: what wording best avoids overclaiming causality, inevitability,
  or interpretive certainty?

### Answered / Superseded Questions

- Signals remain advisory unless accepted or acted on.
- Superseded by current doctrine: foreshadow or payoff analysis may
  project or visualize setup and payoff relationships, but it must not
  create accepted truth silently.
- Saved durable links mean tracked-together support only; they do not
  prove interpretation or create manuscript truth.
- Setup/payoff planning belongs to existing planning owners by scope,
  not to Foreshadow / Payoff.
- Questions better owned elsewhere: exact rewrite warnings, exact
  contradiction-resolution workflow, and exact signal-state lifecycle
  belong partly to rewrite, continuity, and signal dossiers.

### Deferred Questions

- Deferred: exact graphing, setup/payoff vocabulary, and
  evidence-density rules.

## 34. Acceptance Criteria

This dossier is acceptable only if setup/payoff support stays
support-only and non-authoritative.
