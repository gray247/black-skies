# Model Routing And Budget Architecture

## 1. Status Header

- Dossier name: `Model Routing And Budget Architecture`
- Status: `Exploring`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-07`
- Depends on: `Writing Surface`, `Command Center Surface`, `Companion`, `Memory Lab`
- Feeds into: `Local LLM vs Paid API Routing`, `Model Router / Provider Execution Policy`, `Budget / Token / Cost Guardrails`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define how Black Skies decides between no-AI, local-only, and paid-model work without surprise spend or weak-machine collapse.

## 3. User Problem Solved

Writers need useful intelligence help without hidden cost, lag, privacy surprises, or accidental dependence on expensive modes.

## 4. What The System Does

- defines routing and budget posture,
- names practical budget modes,
- bounds silent versus manual runs,
- preserves user control over cost and privacy.

## 5. What The System Does Not Do

- it does not guarantee best quality every time,
- it does not silently spend paid API budget,
- it does not assume strong local hardware,
- it does not define exact spending thresholds yet,
- it does not make AI mandatory.

## 6. User-Facing Behavior

Working doctrine includes:

- weak PC mode,
- no-money mode,
- local-only mode,
- selective API mode,
- deep API mode.

## 7. Hidden/Background Behavior

- low-cost local observation when feasible and allowed,
- routing preparation,
- blocked or deferred runs when policy forbids escalation.

## 8. What Appears First

Direct writing with minimal routing pressure.

## 9. What Is Summonable

Manual runs, route approvals, and deeper analysis requests.

## 10. What Is Hidden Until Needed

Heavy long-context or expensive provider escalation.

## 11. Inputs

- task type,
- user budget preferences,
- project privacy rules,
- hardware limits,
- context size,
- urgency and depth requirements.

## 12. Outputs

- route decisions,
- manual approval prompts later,
- blocked or downgraded run outcomes,
- visible mode status later.

## 13. Which Other Systems Consume Those Outputs

- `Companion`
- `Memory Lab`
- `Continuity`
- `Critique`
- `Writing Surface`
- `Command Center Surface`

## 14. What Gets Stored

- user mode preferences later,
- budget caps later,
- routing policy selections later,
- run history summaries later.

## 15. What Remains Temporary

- per-run route decisions,
- transient cost estimates,
- fallback warnings,
- one-off manual approvals.

## 16. Relationship To Narrative Insertion / Assertion

Routing decisions must not change the narrative foundation.
They only affect how systems inspect or assist it.

## 17. Relationship To Story Units

Story Units may affect task shape, but they do not own routing policy.

## 18. Relationship To Prose / Scene Projection

Projection context may affect package size or routing cost, but projection does not own model policy.

## 19. Relationship To Writing Surface

The Writing Surface stays usable with no setup gate.
Routing must support writing, not gate writing.

## 20. Relationship To Command Center Surface

The Command Center may expose routing status and deep-run controls, but it must not become budget-control clutter.

## 21. GUI Placement Principles

- show only the routing detail the writer needs,
- avoid hidden spend,
- avoid panic-inducing cost noise,
- make manual escalation explicit.

## 22. Local LLM Role

Local models are preferred for silent or subtle observation when feasible and cheap enough.

## 23. Paid API Role

Paid API is reserved for heavy, deep, or long-context work when quality or scale requires it.

## 24. Model Routing Notes And Cost / Budget Impact

- budget monster matters,
- silent local observation is preferred when feasible,
- manual run is the backup,
- paid API is the later escalation path,
- spending guardrails must stay visible and bounded,
- exact spending thresholds remain unresolved.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Routing must respect explicit-content rules.
Some tasks may be local-only because outbound packages are unsafe or unacceptable.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Routing must honor privacy mode, explicit-content boundaries, and no-money or local-only constraints without silently overriding them.

## 27. Testing Requirements

- local-only mode blocks paid API use,
- selective API mode requires explicit policy boundaries,
- weak PC mode does not freeze the writer experience,
- silent local observation does not become silent paid observation.

## 28. Governance Rules And Risks

Governance rules:

- no silent paid API spend,
- no forced AI dependency,
- direct writing stays available,
- routing policy must stay subordinate to writer control,
- paid API remains the heavy, deep, or long-context escalation path rather than the default path.

Risks:

- hidden cost,
- local-model lag,
- privacy drift,
- policy inconsistency across tools.

## 29. Failure Modes

- user thinks a task ran locally when it did not,
- user expects deep review but gets weak local output,
- silent observation causes lag,
- budget caps block useful work with poor explanation.

## 30. v1 Boundary

Named routing modes plus clear boundaries for silent local observation, manual backup, and heavy paid escalation.

## 31. v2 Boundary

Per-system routing profiles, project-scoped routing policy, and richer cost previews.

## 32. Future-Only Boundary

- autonomous budget escalation,
- hidden provider switching,
- silent API fallback when local fails.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- What non-overridable precedence order governs `no-money`, `local-only`, project privacy, explicit-content, and manual API approval policies when they conflict?

### Critical Questions

- What may run silently?
- What always requires approval?
- What are the minimum spending guardrails?
- What exact spending thresholds should exist?
- What cost exposure rules must be visible before runtime wiring?
- What fallback rules apply when local or API paths fail?

### Major Questions

- How should per-project versus global modes work?
- How should mode changes behave mid-project, especially local-only to API?
- How should API findings be reconciled with local findings when they contradict each other?
- What should happen when a local model is too weak for the requested task?

### Minor Questions

- What polished mode names should replace or refine the working labels?
- What budget-status presentation avoids both hidden spend and panic noise?

### Answered / Superseded Questions

- Does the budget monster matter? Answered: yes.
- Do weak PC, no-money, local-only, selective API, and deep API modes matter? Answered: yes.
- Is silent local observation preferred when feasible? Answered: yes.
- Is paid API the default path? Answered: no, it is for heavy, deep, or long-context work.
- Is silent paid API spend allowed? Answered: no.
- Can any system escalate from local or no-money modes to paid API without explicit approval? Answered: no; any exception would require a separate decision pass.

### Deferred Questions

- Advanced dashboards.
- Fine-grained provider tuning.
- Possible split into routing policy and budget guardrails, or shrink if master routing dossiers absorb it.

## 34. Acceptance Criteria

This rough dossier is acceptable only if:

- user control stays explicit,
- silent paid spend is rejected,
- exact spending thresholds remain unresolved until later doctrine resolves them,
- writing is never gated behind routing setup,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no build-ready runtime claim is made.
