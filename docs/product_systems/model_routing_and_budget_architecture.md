# Model Routing And Budget Architecture

## 1. Status Header

- Dossier name: `Model Routing And Budget Architecture`
- Status: `Exploring`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-08`
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
- classifying work into rough effort tiers before deeper escalation,
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
- local-only, blocked, or outbound-eligible status later,
- `no-ai-route-available` state later when no permitted AI route remains,
- manual approval prompts later,
- blocked or downgraded run outcomes,
- package-assembly allowed or denied status later,
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
- explicit approval history later,
- run history summaries later.

## 15. What Remains Temporary

- per-run route decisions,
- transient cost estimates,
- fallback warnings,
- one-off manual approvals,
- provider refusal states before retry, local fallback, or abandonment.

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
- systems should prefer the cheapest safe source of truth or context first before escalating into heavier scans or provider work,
- starting precedence is user approval or refusal, then privacy or local-only, explicit-content restrictions, no-money or budget limits, project settings, model quality preference, and convenience or automation,
- silent runs are allowed only for local-only, free, non-destructive, advisory work with no outbound transfer, no paid spend, no manuscript mutation, and no truth mutation,
- paid, outbound, destructive, truth-changing, export or sync, explicit-content outbound, or tool-using work requires session approval or fresh approval depending on risk,
- full-project, local-LLM, paid, outbound, destructive, or durable-state-changing work may not run silently,
- no full-project scan should run on every save,
- no heavier scan should run while the user is actively typing unless it is cheap, local, and non-disruptive,
- scheduled or idle local work may prepare advisory findings, but applying those findings still requires the owning-system contract and author approval where required,
- no paid or outbound scheduled work may run without approval,
- spending guardrails must stay visible and bounded,
- exact spending thresholds remain unresolved.

Minimum rough routing and approval-state vocabulary:

- `silent-local`: local-only, free, non-destructive, advisory work with no outbound transfer, no paid spend, no manuscript mutation, and no truth mutation.
- `session-approved`: work allowed for a bounded risk class after explicit approval in the current session, without implying standing permission forever.
- `fresh-approval-required`: work risky enough to require a new explicit approval because scope, spend, destination, or consequence changed.
- `blocked`: work policy disallows before execution because privacy, explicit-content, budget, project, or user rules forbid the route.
- `refused`: a route that was attempted or considered eligible but then declined by the provider, the system, or the user at approval time.
- `no-ai-route-available`: all permitted AI routes for the task are unavailable, blocked, refused, or clearance-failed, and no allowed AI fallback remains.

Minimum rough workload tiers:

- `instant existing-context lookup`
- `lightweight local scan`
- `idle or deferred local analysis`
- `scheduled or overnight local analysis`
- `manual heavy scan`
- `paid or outbound approved work`

These are rough product-definition states, not a final runtime permission model.
They are rough effort and approval labels, not exact scheduler, job, or hardware contracts.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Routing must respect explicit-content rules.
Some tasks may be local-only because outbound packages are unsafe or unacceptable.
Routing must decide whether work stays local-only, may assemble outbound packages, or must stop entirely after explicit-content checks.
At rough doctrine level, `no-ai-route-available` appears when the local route is unavailable or refused, the outbound route is blocked or refused, masking or substitution is still insufficient, approval is denied or clearance fails, and no permitted AI fallback remains for that task.
`no-ai-route-available` is route failure, not manuscript failure, and direct writing must remain available.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Routing must honor privacy mode, explicit-content boundaries, and no-money or local-only constraints without silently overriding them or silently reclassifying a blocked task as outbound-safe.
Routing must also honor author-controlled masks, summaries, substitutions, and AI exclusion zones before any outbound package path is considered.

## 27. Testing Requirements

- local-only mode blocks paid API use,
- selective API mode requires explicit policy boundaries,
- weak PC mode does not freeze the writer experience,
- silent local observation does not become silent paid observation.

## 28. Governance Rules And Risks

Governance rules:

- no silent paid API spend,
- no silent outbound manuscript transfer,
- no silent truth mutation,
- no silent destructive action,
- no forced AI dependency,
- direct writing stays available,
- routing policy must stay subordinate to writer control,
- routing and budget authority governs whether scheduled or idle work may remain local-only, must ask permission, or must stop,
- routing precedence starts with user approval or refusal, then privacy or local-only rules, explicit-content restrictions, no-money or budget limits, project settings, model quality preference, and convenience or automation,
- provider or model experimentation may evolve by genre, task, model strength, local-versus-paid path, and writing mode,
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

- None currently. Jason's starting routing precedence resolves the architecture-level ordering question; remaining questions are enforcement, thresholds, and per-system application.

### Critical Questions

- Jason decision candidate: which approval classes may rely on session approval, and which must require fresh approval because risk is too high?
- Jason decision candidate: what minimum spending guardrails must exist before any paid-model path can be wired?
- Jason decision candidate: what cost exposure must be visible before a task can leave the local boundary or consume paid tokens?
- Jason decision candidate: which failure combinations should transition directly to `no-ai-route-available`, and which should still offer retryable local-only or manual fallback first?
- Future contract need: how is the starting precedence enforced when user choice, privacy, explicit-content, budget, project settings, and convenience rules collide across tools or surfaces?

### Major Questions

- What exact spending thresholds should exist?
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
- Which task classes may run silently? Answered: only local-only, free, non-destructive, advisory work with no outbound transfer, no paid spend, no manuscript mutation, and no truth mutation.
- Which task classes require approval? Answered: paid, outbound, destructive, truth-changing, export or sync, explicit-content outbound, or tool-using work requires session approval or fresh approval depending on risk.
- Can any system escalate from local or no-money modes to paid API without explicit approval? Answered: no; any exception would require a separate decision pass.
- Which route outcomes must block outbound package assembly entirely, and which may still allow local-only execution without provider calls? Answered: outbound package assembly requires approved routing, approved budget or spend state, valid user approval, explicit-content outbound clearance, and provider-neutral package safeguards. If clearance fails, package assembly must stop or produce only local, non-outbound artifacts.
- Does outbound refusal or failure count as a manuscript failure? Answered: no. A refusal is treated as a route failure, not a manuscript failure.
- What is the starting routing precedence? Answered: user approval or refusal -> privacy or local-only -> explicit-content restrictions -> no-money or budget limits -> project settings -> model quality preference -> convenience or automation.
- What stable approval-class vocabulary should govern silent-local, session-approved, fresh-approval-required, blocked, refused, and `no-ai-route-available` states across routing, package construction, and explicit-content handling? Answered: rough doctrine uses those states with the meanings defined in this dossier; exact approval thresholds and enforcement remain unresolved.
- What rough resource-governed assistance posture should routing enforce before systems escalate into heavier scans or provider work? Answered: systems should prefer the cheapest safe source of truth or context first and escalate into deeper analysis only when cost, privacy, mutation risk, and hardware impact permit.
- What rough workload tiers should routing and budget policy recognize before runtime wiring? Answered: instant existing-context lookup, lightweight local scan, idle or deferred local analysis, scheduled or overnight local analysis, manual heavy scan, and paid or outbound approved work.

### Deferred Questions

- Advanced dashboards.
- Fine-grained provider tuning.
- Possible split into routing policy and budget guardrails, or shrink if master routing dossiers absorb it.
- Does a reusable approval classes and spend guardrails contract eventually need to exist, or can the stabilized class vocabulary remain inside routing, package construction, explicit-content, and Companion dossiers?

## 34. Acceptance Criteria

Current-cluster rough stability note: implementation remains blocked by open Critical questions, but the routing, package, and explicit-content side of this cluster is stable enough to pause tightening and shift the next dossier attention toward `Authorship Provenance AI Visibility`, `Memory Lab`, and `Companion`.

This rough dossier is acceptable only if:

- user control stays explicit,
- silent paid spend is rejected,
- starting routing precedence is explicit but still rough rather than a final runtime contract,
- exact spending thresholds remain unresolved until later doctrine resolves them,
- writing is never gated behind routing setup,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no build-ready runtime claim is made.
