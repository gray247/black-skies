# Explicit Content Architecture

## 1. Status Header

- Dossier name: `Explicit Content Architecture`
- Status: `Exploring`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-07`
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
- masked or summarized outbound packages,
- approval prompts later,
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
- approval history later,
- transformed-package audit records later.

## 15. What Remains Temporary

- one-off transformed packages,
- masking previews,
- ephemeral safety summaries,
- pre-send warnings.

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

## 24. Model Routing Notes And Cost / Budget Impact

- raw story remains local,
- outbound packages may be masked, summarized, or transformed,
- local-only raw analysis is preferred,
- routing must respect explicit-content risk before cost optimization,
- original prose must remain unchanged by censor behavior.

## 25. Explicit-Content / Send-Package Handling, If Applicable

- marker, censor, and package systems are related but not identical,
- masking should preserve continuity and causality where possible,
- transformed packages should be previewable and later approvable.

## 26. Privacy / Safety / Censor Behavior, If Applicable

- no silent outward leakage of raw explicit content,
- no silent censorship of the local manuscript,
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

- What authority boundary keeps local authored manuscript state separate from transformed outbound package state so censoring cannot masquerade as editing?

### Critical Questions

- What is the minimum transformation contract?
- What preview and approval flow is required before transformed content is sent outward?
- What routing and package interaction rules apply to explicit-content material?
- What API refusal and fallback behavior is acceptable?
- What are the local-only raw analysis boundaries?

### Major Questions

- What marker visibility rules should exist?
- How should the system warn when masking removes essential causal evidence?
- How should local-only analysis interact with later export?
- How should imported explicit-content metadata be reconciled with local policy?

### Minor Questions

- What advanced mode presets are useful later?
- What export metadata polish is desirable after the core contract is settled?

### Answered / Superseded Questions

- Does raw story remain local by default? Answered: yes.
- May outbound packages be masked, summarized, or transformed? Answered: yes.
- Should continuity and causality be preserved where possible? Answered: yes.
- Are marker, censor, and package systems identical? Answered: no, they are related but distinct.
- May censor behavior silently mutate local authored prose? Answered: no.

### Deferred Questions

- Provider-specific transformations.
- Possible split between writer-visible markers and outbound send-package behavior if one side needs its own dossier.

## 34. Acceptance Criteria

This rough dossier is acceptable only if:

- the local manuscript stays protected,
- outbound transformation stays explicit,
- no censor behavior mutates original prose,
- preview and approval remain explicitly unresolved until later doctrine resolves them,
- continuity preservation remains visible,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no runtime implementation is implied.
