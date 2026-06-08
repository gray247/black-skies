# LLM Package Construction Architecture

## 1. Status Header

- Dossier name: `LLM Package Construction Architecture`
- Status: `Exploring`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-07`
- Depends on: `Model Routing And Budget Architecture`, `Authorship Provenance AI Visibility`, `Explicit Content Architecture`
- Feeds into: `Companion`, `Memory Lab`, `Continuity`, `Critique`, `Model Router / Provider Execution Policy`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `partial`
- Hidden/background: `yes`

## 2. Purpose

Define how outbound and local model packages are assembled so Black Skies does not degrade into ad hoc prompt stuffing.

## 3. User Problem Solved

Writers need trustworthy, bounded model interactions that preserve mission, context, privacy, and output expectations.

## 4. What The System Does

- defines package structure,
- orders hard rules, context, and output instructions,
- governs chunking, masking, summaries, and model/provider differences,
- helps preserve evidence and provenance boundaries.

## 5. What The System Does Not Do

- it does not silently dump full manuscript state without policy,
- it does not assume one prompt shape fits every task,
- it does not replace routing or explicit-content policy.

## 6. User-Facing Behavior

Mostly hidden, with later visible summaries for what is being sent, why, and under which model mode.

## 7. Hidden/Background Behavior

- package assembly,
- context prioritization,
- token budgeting,
- chunking and compression later.

## 8. What Appears First

Nothing by default beyond safe, honest tool behavior.

## 9. What Is Summonable

- package summaries,
- package approval previews later,
- send-path explanation later.

## 10. What Is Hidden Until Needed

- low-level chunking,
- provider-specific transforms,
- token accounting details.

## 11. Inputs

- task type,
- mission or hard rules,
- relevant context,
- authorship and provenance rules,
- explicit-content policy,
- model/provider limits.

## 12. Outputs

- structured model packages,
- package summaries later,
- truncation or masking notes later,
- provider-specific send payloads later.

## 13. Which Other Systems Consume Those Outputs

- `Companion`
- `Memory Lab`
- `Continuity`
- `Critique`
- future draft generation or rewrite loops

## 14. What Gets Stored

- templates or schemas later,
- package policy versions later,
- approved package summaries later.

## 15. What Remains Temporary

- per-run packages,
- chunk decisions,
- token estimates,
- provider-specific renderings.

## 16. Relationship To Narrative Insertion / Assertion

Package design must preserve the primacy of narrative primitives when they are the relevant base objects.

## 17. Relationship To Story Units

Story Units may provide optional context, but they must not become mandatory package roots.

## 18. Relationship To Prose / Scene Projection

Packages may include prose or scene projections as context views.
Projection is not foundation authority.

## 19. Relationship To Writing Surface

Package design must support Writing Surface trust by preventing accidental leakage or hidden transformation.

## 20. Relationship To Command Center Surface

The Command Center may later expose package summaries and approvals, but it should not become a raw package console by default.

## 21. GUI Placement Principles

- keep packaging mostly invisible,
- surface summaries only when needed,
- make risky sends inspectable.

## 22. Local LLM Role

Local models use the same disciplined package logic even when running on-device.

## 23. Paid API Role

Paid API paths need stricter packaging, summaries, masking, and approval boundaries.

## 24. Model Routing Notes And Cost / Budget Impact

- package size and shape affect cost and feasibility,
- first tokens carry mission and hard rules,
- middle tokens carry supporting context,
- last tokens repeat mission and output rules,
- package design matters as much as prompt wording.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Package construction must cooperate with masking, summarization, and transformed-package rules without losing essential continuity.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Packages must respect privacy, censorship, and explicit-content boundaries before any provider call.

## 27. Testing Requirements

- package ordering is deterministic,
- hard rules survive truncation pressure,
- package summaries match actual payload intent,
- masking does not destroy required causality without warning.

## 28. Governance Rules And Risks

Governance rules:

- package construction is not casual prompt stuffing,
- no silent package widening,
- no hidden provider-specific behavior that changes authority claims,
- evidence and output rules must survive packaging.

Risks:

- token waste,
- context loss,
- prompt-order bugs,
- unsafe payload assembly,
- provider mismatch behavior.

## 29. Failure Modes

- hard rules fall out of the package,
- late instructions override mission,
- chunking breaks continuity,
- summaries misdescribe the real package.

## 30. v1 Boundary

Basic package-order doctrine plus bounded summaries and masking hooks.

## 31. v2 Boundary

Provider-specific schemas, compression policies, and better evidence citation packaging.

## 32. Future-Only Boundary

- autonomous package mutation with no trace,
- hidden package expansion,
- provider-dependent story-authority behavior.

## 33. Open Questions

### Known Answers

- package construction matters as much as prompt wording,
- first tokens carry mission and hard rules,
- middle tokens carry supporting context,
- last tokens repeat mission and output rules.

### Open Questions

- schema design,
- chunking and compression policy,
- truncation behavior,
- evidence citation packaging,
- provider-specific differences.

### Edge Cases

- masked content removing needed evidence,
- long-context overflow,
- contradictory context bundles.

### Blockers Before Coding

- minimum schema,
- truncation policy,
- masking interaction rules,
- provider-neutral safety boundaries.

### Can Defer

- UI polish for package previews,
- advanced compression tuning,
- per-provider optimization.

### Possible Merge / Shrink / Delete

This dossier may later merge partially into routing or explicit-content dossiers, but only after package rules are stable enough to shrink safely.

### Question Intake Notes

Move package-construction questions here from the raw register and loose notes instead of leaving them as orphan planning items.

## 34. Acceptance Criteria

This rough dossier is acceptable only if:

- package doctrine is explicit,
- no hidden prompt-stuffing assumptions remain,
- masking and safety stay in view,
- no runtime implementation claim is made.
