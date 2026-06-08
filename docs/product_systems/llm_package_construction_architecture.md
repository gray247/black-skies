# LLM Package Construction Architecture

## 1. Status Header

- Dossier name: `LLM Package Construction Architecture`
- Status: `Exploring`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-08`
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
- defines input and output expectations for packaged work,
- governs chunking, masking, summaries, and model/provider differences,
- helps preserve evidence and provenance boundaries.

## 5. What The System Does Not Do

- it does not silently dump full manuscript state without policy,
- it is not casual prompt stuffing,
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

- structured model packages after routing and explicit-content clearance later,
- package summaries later,
- truncation or masking notes later,
- author-approved redacted or package views later,
- blocked-assembly reasons later,
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
- approved package summaries later,
- author-approved redaction or mask-view references later.

## 15. What Remains Temporary

- per-run packages,
- raw-manuscript, redaction-map, and outbound-package-view distinctions before any saved conversion later,
- chunk decisions,
- token estimates,
- provider-specific renderings,
- provider-blocked or policy-blocked package attempts.

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
- provider-specific packaging may evolve by genre, task, model strength, local-versus-paid path, and writing mode,
- meaning, author intent, evidence scope, canon facts, and task purpose must remain controlled even when wrappers or schemas change,
- package design matters as much as prompt wording,
- exact schemas, chunking, compression, truncation, and provider-specific tuning remain unresolved.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Package construction must cooperate with masking, summarization, and transformed-package rules without losing essential continuity.
Starting never-send or raw outbound categories include explicit sexual content, extreme violence or gore, minor-related sensitive content, private author notes marked local-only, deleted drafts marked archived or private, raw manuscript text from local-only projects, and anything the user marks never-send.
Package construction should receive routing approval and explicit-content clearance before any outbound package is assembled, and it must not widen a blocked task into outbound-safe behavior on its own.
Outbound package construction must use the author-approved redacted or package view, not excluded raw manuscript ranges, for masked or AI-excluded sections.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Packages must respect privacy, censorship, and explicit-content boundaries before any provider call.
Package construction must not override local-only, never-send, or refusal states handed down by routing or explicit-content policy.
Package construction must preserve the distinction between raw manuscript, author redaction or mask map, and outbound package view.

Minimum rough package-boundary vocabulary:

- `raw manuscript`: the author's underlying prose or narrative material before redaction, masking, substitution, or exclusion for AI use.
- `author redaction or mask map`: the author's explicit instructions for which ranges may be hidden, summarized, substituted, or excluded for a given AI task.
- `AI exclusion zone`: a range or artifact barred from routing, package assembly, previews, summaries, and outbound payloads unless the author later authorizes a different treatment.
- `author-approved package view`: the redacted, summarized, substituted, or otherwise prepared AI-facing context the author has approved for the task.
- `outbound payload view`: the actual provider-bound payload rendered from the approved package view plus task wrapper, safety wrapper, and provider-specific formatting.

These are rough product-definition boundaries, not a final implementation schema.
Raw excluded ranges must not leak into outbound package construction, package previews, or package summaries, and downstream systems must rely on the approved package view rather than silently reaching back to raw excluded text.

## 27. Testing Requirements

- package ordering is deterministic,
- hard rules survive truncation pressure,
- package summaries match actual payload intent,
- masking does not destroy required causality without warning.

## 28. Governance Rules And Risks

Governance rules:

- package construction is not casual prompt stuffing,
- no silent package widening,
- provider-specific packaging may evolve, but it must not silently change mission, meaning, author intent, evidence scope, canon facts, or task purpose,
- starting never-send or raw outbound categories are real doctrine, but the list may evolve,
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

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently. Jason's doctrine resolves the top-level payload and provider-evolution boundaries; remaining questions are exact schema, enforcement, and packaging mechanics.

### Critical Questions

- What minimum provider-neutral package contract must exist for mission, hard rules, context, and output expectations before any provider wiring is allowed?
- What truncation contract preserves mission, hard rules, evidence scope, and output expectations under token pressure?
- What provider-neutral safety checks must run before any outbound provider call or package approval surface is wired?
- What invariant package contract must survive provider-specific wrappers, schemas, chunking, and model choice without changing mission or evidence scope?
- How must raw manuscript, author redaction or mask map, AI exclusion zones, author-approved package view, and outbound payload view remain distinct through package assembly?
- How must masking notes, package summaries, and the actual outbound payload stay aligned so approval surfaces do not misdescribe what leaves the machine?

### Major Questions

- How should evidence citation packaging work when a task needs explicit evidence traceability?
- What schema design and input/output expectation formats are worth preserving through rough design?
- What chunking and compression policy should exist?
- How should long-context overflow be handled?
- How should contradictory context bundles be represented?
- How should provider-specific differences and tuning be isolated?
- How should changes to never-send or raw outbound categories be reviewed over time after the starting doctrine exists?

### Minor Questions

- What UI polish is useful for package previews after package rules stabilize?
- What preview wording best explains package intent without showing raw package internals by default?

### Answered / Superseded Questions

- Does package construction matter as much as prompt wording? Answered: yes.
- Do first tokens carry mission and hard rules? Answered: yes.
- Do middle tokens carry supporting context? Answered: yes.
- Do last tokens repeat mission and output rules? Answered: yes.
- Is casual prompt stuffing acceptable? Answered: no.
- What routing approval state and explicit-content clearance must exist before outbound package assembly may begin? Answered: outbound package assembly requires approved routing, approved budget or spend state, valid user approval, explicit-content outbound clearance, and provider-neutral package safeguards.
- May provider-specific packaging evolve by genre, task, model strength, local-versus-paid path, and writing mode? Answered: yes.
- May provider-specific packaging silently change mission, meaning, author intent, evidence scope, canon facts, or task purpose? Answered: no.
- Are there starting never-send or raw outbound categories? Answered: yes, as rough doctrine that may evolve.
- Can package construction self-approve outbound work? Answered: no.
- What happens if outbound clearance fails? Answered: package construction must stop or produce only local, non-outbound artifacts.

### Deferred Questions

- Advanced compression tuning.
- Per-provider optimization.
- Partial merge into routing or explicit-content dossiers after package rules are stable enough to shrink safely.
- Does a reusable provider-neutral package contract eventually need to exist, or can the stabilized outbound invariants remain inside routing, package construction, and explicit-content dossiers?
- Does a reusable redaction or mask-map or package-view contract eventually need to exist, or can the stabilized state distinctions remain inside package construction and explicit-content dossiers?

## 34. Acceptance Criteria

This rough dossier is acceptable only if:

- package doctrine is explicit,
- no hidden prompt-stuffing assumptions remain,
- provider-specific packaging is allowed to evolve only inside controlled mission and evidence boundaries,
- unresolved schema, chunking, truncation, provider-tuning, and explicit-content interaction questions stay unresolved until later doctrine answers them,
- masking and safety stay in view,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no runtime implementation claim is made.
