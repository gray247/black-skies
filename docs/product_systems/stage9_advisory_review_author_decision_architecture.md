# Stage 9 Advisory Review and Author-Decision Architecture

Status: active, read-only planning pass complete, implementation blocked.

## Purpose

This document defines the product-experience architecture for advisory review and intentional author decisions in Stage 9. It is bounded by `docs/product_systems/stage9_product_experience_gui_architecture_program.md` and `docs/product_systems/stage9_surface_experience_architecture.md`, and it relies on the existing doctrine in `feedback_notes_revision_resolution.md`, `signal_architecture.md`, `critique_evaluation.md`, `continuity.md`, `draft_generation_rewrite_loop.md`, `outline.md`, `timeline_pacing_pressure.md`, and `authorship_provenance_ai_visibility.md`.

The architecture exists to keep review objects visible without collapsing their meaning, to keep owner-preserving projections distinct from owner acceptance, and to make the return path to Writing Surface explicit after advisory review.

## Authority

Authority remains with the existing product-system dossiers and the approved Stage 9 constitution. This file does not create new product ownership, new lifecycle states, or a universal review queue. It records conceptual product-experience architecture only.

## Scope

This architecture covers:

- Notes
- Signals
- critique findings
- continuity conflicts
- rewrite candidates
- partial acceptance
- reorder previews
- evidence and uncertainty
- accepted and unaccepted material
- route-to-owner behavior
- return to Writing Surface

It does not prescribe layouts, components, APIs, schemas, classes, libraries, ranking algorithms, or automatic acceptance behavior.

## Advisory Object Distinctions

The following distinctions remain mandatory:

- Notes are not Signals.
- Notes and Signals are not critique findings.
- critique findings are not continuity conflicts.
- findings are not rewrite candidates.
- candidate visibility is not acceptance.
- partial acceptance preserves the unaccepted remainder.
- manuscript acceptance is not planning acceptance.
- preview is not application.
- route-to-owner is not owner acceptance.
- parked, rejected, stale, and historical material remain distinguishable.
- acceptance does not silently close Notes or Signals.
- Continuity does not decide canon.
- Critique does not rewrite truth.
- Rewrite Loop does not accept prose.

These distinctions are visible obligations, not interchangeable lifecycle labels.

## Review-Entry Principles

Review entry begins from the author’s need to inspect a result, compare options, or resolve a decision without losing ownership context. The entry surface must show why the object exists, which owner produced it, and what action is actually available.

Review entry does not imply that the author has accepted the object, that the object is current, or that the object is the same kind of thing as a note, signal, candidate, or accepted manuscript material.

## Owner-Preserving Projections

Advisory objects may be projected into review views, but the projection does not transfer ownership.

Required owner-preserving presentation rules:

- the source owner remains visible
- the destination owner remains visible
- projected objects retain their origin identity
- projection state does not become durable truth
- review visibility does not imply lifecycle ownership
- route-to-owner keeps the receiving owner responsible for its own acceptance path

The projection is informational. The owner remains the authoritative source for durable state.

## Grouping Without Semantic Collapse

Related review items may be grouped for readability when the grouping does not erase their differences.

Grouping may be used to connect:

- related Notes
- related Signals
- related critique findings
- related continuity conflicts
- related rewrite candidates

Grouping must not:

- merge lifecycle meanings
- invent a shared state
- hide source ownership
- collapse evidence into conclusion
- make a candidate look accepted

The point of grouping is to reduce scanning cost, not to invent a universal issue type.

## Evidence Presentation

Evidence must remain attached to the object that produced it.

Evidence presentation should make visible:

- what was observed
- which source produced it
- whether it is direct evidence, inference, or synthesis
- whether the item is current, stale, historical, or parked
- what the evidence supports and what it does not support

Evidence may be summarized, but summary must not replace source identity or owner boundaries.

## Uncertainty Presentation

Uncertainty must remain visible when the object is advisory, incomplete, or conflicting.

Uncertainty presentation should preserve:

- unresolved questions
- ambiguity
- competing interpretations
- currentness limits
- source conflicts

Uncertainty is not a failure state by itself. It is a property of the review material and should not be hidden behind confident language.

## Comparison Behavior

Comparison is used to help the author judge relationship and difference. It does not mutate accepted manuscript truth.

Comparison must preserve:

- current versus proposed order
- accepted versus unaccepted material
- source text versus candidate text
- owner-produced evidence versus route-to-owner guidance

Comparison may support partial acceptance, but it cannot silently convert comparison into approval or application.

## Accepted-Span Visibility

If only part of a candidate is accepted, the accepted span must remain visible as the accepted part, not as the entire candidate result.

Accepted-span visibility must preserve:

- the exact accepted portion
- the unaccepted remainder
- the candidate’s temporary status until owner acceptance is complete
- the provenance of any author-edited acceptance

Partial acceptance is a bounded author decision, not a general truth rewrite.

## Unaccepted-Remainder Visibility

The unaccepted remainder must remain visible when that remainder is relevant to decision-making, provenance, or later routing.

The remainder may be:

- rejected
- parked
- deferred
- revised

The remainder must not disappear simply because some other span was accepted.

## Partial-Acceptance Burden

Partial acceptance can increase comparison burden because the author has to reason about accepted span, unaccepted remainder, and source provenance at the same time.

This architecture therefore requires:

- clear accepted-span boundaries
- clear remainder boundaries
- visible comparison context
- no claim that partial acceptance completed the whole candidate

Stage 9 may reduce the burden of partial acceptance, but it may not hide the underlying distinction.

## Proposed-Versus-Applied Distinction

Proposal is advisory. Application is a separate author action.

This distinction applies to:

- reorder previews versus applied order
- route-to-owner suggestions versus routed ownership
- candidate presentation versus acceptance
- comparison output versus truth mutation

The proposed state must not be mistaken for the applied state.

## Current-Order Reference Requirements

When comparing a proposed reorder to the current manuscript order, the current order must remain visible as the reference point.

The reference requirement means:

- the author can tell what is changing
- the author can tell what is staying the same
- the author can tell which owner controls the applied result

This is a conceptual requirement only. It does not select any layout or interaction pattern.

## Route-to-Owner Presentation

Routing to an owner is a presentation boundary, not an acceptance boundary.

Route-to-owner presentation must show:

- which owner should receive the object
- why that owner is responsible
- whether the object is still advisory
- whether the object remains unresolved

Routing is a handoff of attention. It is not a handoff of truth.

## Safe Return to Writing Surface

The author must be able to return to Writing Surface after review without losing manuscript context or mistaking advisory objects for accepted truth.

Safe return must preserve:

- current writing location
- visible provenance if needed
- unresolved advisory material if the author has not resolved it
- a clear separation between review and manuscript work

Writing Surface remains the sovereign place for resumed manuscript work.

## Stale and Historical Material Visibility

Stale, parked, rejected, and historical material must remain visible when it matters to provenance, comparison, or decision-making.

Visibility does not imply current authority. Historical material remains historical unless the owning system changes it through its own rules.

## Keyboard, Focus, Dismissal, and Accessibility Requirements

Stage 9 must support keyboard-first review, stable focus, deliberate dismissal, and accessible review entry without converting those requirements into layout decisions.

The architecture must preserve:

- focus continuity across review and return
- dismissibility of advisory material
- keyboard access to comparison and routing actions
- readable presentation of uncertainty and provenance

These are experience obligations, not component specifications.

## Author-Decision Candidates Requiring Later Approval

The following decisions may require later approval if Stage 9 chooses to make them concrete:

- how much comparison context to show for partial acceptance
- whether and when parked material is re-surfaced
- how aggressively route-to-owner suggestions are promoted
- how much historical material is shown by default
- how far stale material is grouped with current advisory material

These are decision candidates, not current automatic rules.

## Stage 10 Boundary

Stage 10 owns operational matters such as reliability, retry behavior, recovery verification, stale and partial behavior under stress, provider and queue robustness, offline behavior, security, privacy, performance, and conflict testing.

Stage 9 may describe the experience of those matters, but it does not solve their operational correctness.

## Stage 12 Boundary

Stage 12 owns architecture only if a true unresolved identity or ownership question later requires it.

The main deferred Stage 12 question preserved by Stage 9 is the identity of restored-copy handling when that identity remains ambiguous. Stage 9 does not resolve that question.

## Batch 2 Closure Criteria

Batch 2 is complete when this file:

- preserves the advisory-object distinctions listed above
- keeps owner-preserving projections distinct from owner acceptance
- keeps grouping from collapsing lifecycle meaning
- keeps evidence and uncertainty visible
- keeps partial acceptance bounded and non-total
- keeps proposed-versus-applied distinctions explicit
- keeps route-to-owner distinct from acceptance
- keeps return to Writing Surface safe and explicit
- keeps Stage 10 and Stage 12 boundaries intact
- remains implementation-neutral
- does not create universal review states or a universal owner

## Implementation Blocked

This architecture is documentation only. Implementation remains blocked.
