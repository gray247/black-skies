# Explicit Content Architecture

## 1. Status Header

- Dossier name: `Explicit Content Architecture`
- Status: `Exploring`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-08`
- Depends on: `Authorship Provenance AI Visibility`, `LLM Package Construction Architecture`, `Model Routing And Budget Architecture`
- Feeds into: `Explicit-Content Marker / Send-Package Censor`, `Writing Surface`, `Command Center Surface`, `Import / Export / Google Docs`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define how Black Skies handles explicit material safely without corrupting local authorship or continuity.

## 3. User Problem Solved

Writers need to keep their local story intact while safely deciding what can be sent outward and how.

## 4. What The System Does

- distinguishes marker, censor, and package behavior,
- keeps raw local prose separate from outbound transformed packages,
- allows author-controlled masking, summarization, substitution, and AI exclusion before routing or outbound package construction,
- preserves continuity and causality where possible,
- supports preview and approval later,
- keeps local-only raw analysis possible.

## 5. What The System Does Not Do

- it does not silently censor local authored prose,
- it does not mutate original prose through censor behavior,
- it does not force all writing into safe-mode presentation,
- it does not assume every explicit problem is the same as every privacy problem.

## 6. User-Facing Behavior

- explicit-content markers later,
- safe send-package status later,
- masked or summarized package previews later,
- approval steps when needed.

## 7. Hidden/Background Behavior

- local-only raw analysis later,
- package transformation later,
- policy checks before outbound runs,
- refusal or fallback behavior later when outbound policy blocks a run.

## 8. What Appears First

Nothing should block direct writing by default.

## 9. What Is Summonable

- safe send-package preview,
- transformed-package explanation,
- approval controls.

## 10. What Is Hidden Until Needed

- raw masking rules,
- provider-specific safety transforms,
- package-level censor logic.

## 11. Inputs

- local raw prose,
- narrative primitives,
- explicit-content markers later,
- routing policy,
- package construction rules.

## 12. Outputs

- marker states later,
- local-only, outbound-blocked, or transform-required classifications later,
- author-approved redacted or package views later,
- masked or summarized outbound packages,
- approval prompts later,
- refusal or fallback states later,
- `no-ai-route-available` state later,
- risk classifications later.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Companion`
- `Import / Export / Google Docs`
- routing and package systems

## 14. What Gets Stored

- explicit-content preferences later,
- marker metadata later,
- approval and refusal history later,
- author redaction or mask maps later,
- transformed-package audit records later,
- local-only lock decisions later.

## 15. What Remains Temporary

- one-off transformed packages,
- masked summaries or substitutions used only as package or context artifacts unless explicitly saved or converted by the author,
- masking previews,
- ephemeral safety summaries,
- pre-send warnings,
- provider refusal states awaiting local fallback or abandonment.

## 16. Relationship To Narrative Insertion / Assertion

Explicit-content handling may reference narrative primitives to preserve continuity and causality, but it must not replace their identity.

## 17. Relationship To Story Units

Story Units may carry contextual packaging rules later, but they are not required for explicit-content handling.

## 18. Relationship To Prose / Scene Projection

Explicit-content handling often acts on prose or projection views.
Projection remains view-level context, not root authority.

## 19. Relationship To Writing Surface

Writing must remain usable with no setup gate.
Local authored prose must remain visible and intact unless the writer chooses otherwise.

## 20. Relationship To Command Center Surface

The Command Center may show status, previews, and approvals, but it should not become a censorship dashboard.

## 21. GUI Placement Principles

- protect writing flow,
- surface risk only when relevant,
- avoid moralizing UI,
- keep transformation honest and inspectable.

## 22. Local LLM Role

Local models may help with raw local analysis later if allowed and bounded.

## 23. Paid API Role

Paid API must never receive raw local explicit story content unless future rules explicitly allow it.
Exact refusal and fallback behavior remains unresolved.
Starting never-send or raw outbound categories include explicit sexual content, extreme violence or gore, minor-related sensitive content, private author notes marked local-only, deleted drafts marked archived or private, raw manuscript text from local-only projects, and anything the user marks never-send.

## 24. Model Routing Notes And Cost / Budget Impact

- raw story remains local,
- outbound packages may be masked, summarized, or transformed,
- local-only raw analysis is preferred,
- routing must respect explicit-content risk before cost optimization,
- explicit-content classification may force local-only handling, block outbound packaging, or require transformed-package approval,
- original prose must remain unchanged by censor behavior.

## 25. Explicit-Content / Send-Package Handling, If Applicable

- marker, censor, and package systems are related but not identical,
- masking should preserve continuity and causality where possible,
- never-send or raw outbound categories are a starting doctrine rather than a finished exhaustive list,
- transformed packages should be previewable and later approvable,
- explicit-content handling must hand a clear local-only, transform-required, or outbound-blocked state to routing and package construction before any provider call,
- outbound package construction must use the author-approved redacted or package view rather than excluded raw manuscript ranges.

## 26. Privacy / Safety / Censor Behavior, If Applicable

- no silent outward leakage of raw explicit content,
- no silent censorship of the local manuscript,
- AI exclusion zones must be honored by routing, package construction, Continuity, Signal Architecture, Memory Lab, Companion, and any outbound package preview,
- preserve meaning where possible,
- surface uncertainty when masking damages context.

## 27. Testing Requirements

- local raw prose remains unchanged,
- outbound package transforms are inspectable,
- continuity and causality loss is surfaced when unavoidable,
- approval and rejection flows stay non-destructive.

## 28. Governance Rules And Risks

Governance rules:

- raw story remains local,
- outbound transformation must be explicit,
- marker, censor, and package behavior must not collapse into one hidden system,
- starting never-send or raw outbound categories are real doctrine, but the list may evolve,
- no silent author-text mutation.

Risks:

- loss of causal meaning,
- unclear difference between masked package and edited manuscript,
- API refusal loops,
- trust loss if transforms are hidden.

## 29. Failure Modes

- masking breaks continuity,
- transformed packages misrepresent the story,
- user cannot tell what left the machine,
- explicit-content markers become noisy clutter.

## 30. v1 Boundary

Policy-only doctrine plus preview and approval boundaries.

## 31. v2 Boundary

Richer marker systems, per-project policy, and export-aware handling.

## 32. Future-Only Boundary

- autonomous censoring of local prose,
- hidden transformation before send,
- runtime build-out without explicit routing and package rules.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently. Jason's doctrine resolves the raw-local versus outbound-package boundary; remaining questions are transformation, approval, refusal, and local-only analysis details.

### Critical Questions

- What minimum transformation contract is required before any outbound explicit-content package is assembled?
- What preview and approval steps are mandatory before transformed explicit-content material is sent outward?
- What exact state contract must distinguish raw manuscript, author redaction or mask map, author-approved package view, and outbound payload view before runtime wiring is attempted?
- Which local-only raw analysis results may inform local advisory systems, and which must never cross into outbound raw-package behavior without a new author decision?

### Major Questions

- What marker visibility rules should exist?
- How should the system warn when masking removes essential causal evidence?
- How should local-only analysis interact with later export?
- How should imported explicit-content metadata be reconciled with local policy?
- Which retry order is most understandable before the app declares `no-ai-route-available`?

### Minor Questions

- What advanced mode presets are useful later?
- What export metadata polish is desirable after the core contract is settled?

### Answered / Superseded Questions

- Does raw story remain local by default? Answered: yes.
- May outbound packages be masked, summarized, or transformed? Answered: yes.
- Should continuity and causality be preserved where possible? Answered: yes.
- Are marker, censor, and package systems identical? Answered: no, they are related but distinct.
- May censor behavior silently mutate local authored prose? Answered: no.
- Are there starting never-send or raw outbound categories? Answered: yes, as rough doctrine that may evolve.
- What local-only, transform-required, or outbound-blocked classification must explicit-content handling hand to routing and package construction before any provider call is allowed? Answered: explicit-content handling must hand one of those clearance states before any provider call is allowed.
- What refusal and fallback behavior is allowed when explicit-content policy blocks an API path or the provider refuses the transformed package? Answered: blocked or refused outbound explicit-content work must not block direct writing and should offer local-only handling, transform, mask, summarize options, manual continuation, route change where allowed, or cancel. If both local and outbound AI routes fail or refuse, the state becomes `no-ai-route-available`.
- May the author manually mask, summarize, substitute, or exclude selected manuscript ranges before AI routing or outbound package construction? Answered: yes.
- Does manual masking or exclusion alter the manuscript by default? Answered: no. It changes package or context artifacts unless the author explicitly saves the masked version into the manuscript.

### Deferred Questions

- Provider-specific transformations.
- Possible split between writer-visible markers and outbound send-package behavior if one side needs its own dossier.
- Does a reusable explicit-content preview and clearance contract eventually need to exist, or can the stabilized clearance states remain inside explicit-content, routing, and package construction dossiers?
- Does the `no-ai-route-available` escalation contract eventually need a reusable artifact, or can it remain split across routing, explicit-content, package construction, and Companion dossiers?

## 34. Acceptance Criteria

This rough dossier is acceptable only if:

- the local manuscript stays protected,
- outbound transformation stays explicit,
- starting never-send or raw outbound doctrine remains rough rather than exhaustive,
- no censor behavior mutates original prose,
- preview and approval remain explicitly unresolved until later doctrine resolves them,
- continuity preservation remains visible,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no runtime implementation is implied.
