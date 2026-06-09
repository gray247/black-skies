# Companion

## 1. Status Header

- Dossier name: `Companion`
- Status: `Exploring`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition`
- Last reviewed: `2026-06-08`
- Depends on: `Memory Lab`, `Continuity`, `Signal Architecture`, `Model Routing And Budget Architecture`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Critique`, `Continuity`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define Companion as the likely interface or personality layer over Memory Lab and other systems without letting it become truth owner.

## 3. User Problem Solved

Writers need a bounded guide that can explain, question, summarize, and investigate without taking over authorship or workflow authority.

## 4. What The System Does

- explains findings,
- asks bounded questions,
- summarizes evidence,
- helps investigate when invited,
- may use `Memory Lab` later to retrieve cited, tiered project memory, system knowledge, author preferences, and prior decisions,
- answers product-system navigation and operational questions about Black Skies surfaces, menus, commands, workflows, and feature locations,
- may create temporary non-destructive Writing Surface highlights or annotations when the author asks it to identify a gap, inconsistency, issue, or relevant passage,
- may later run safe local or support actions if settings allow,
- may later trigger tools under explicit user-action boundaries.

## 5. What The System Does Not Do

- it is not truth owner,
- it is not author, judge, or silent actor,
- it does not silently commit story changes,
- it does not replace Writing Surface sovereignty,
- it does not become a mandatory gate before writing.

## 6. User-Facing Behavior

Companion may later:

- explain,
- question,
- summarize,
- investigate,
- guide the author through Black Skies workflows,
- provide system-navigation guidance,
- offer safe local UI navigation support,
- create temporary advisory highlights or annotations when asked,
- point to evidence,
- route into other tools with consent.

## 7. Hidden/Background Behavior

- waiting quietly,
- preparing bounded context,
- preferring the cheapest safe source of context first, starting with current UI state, accepted doctrine, saved project metadata, governed `Memory Lab` recall, existing signals, and prepared findings before offering deeper work,
- deferring to stronger systems for evidence,
- preparing explanations for scheduled, idle, or overnight local findings later without owning the underlying service,
- staying silent by default unless a user-requested watch condition, approval gate, blocked requested task, `no-ai-route-available`, outbound or spending decision, or potentially destructive action requires interruption later.

## 8. What Appears First

Companion should appear only when invited, clearly relevant, or explicitly configured later.

## 9. What Is Summonable

- explanation,
- investigation,
- summary,
- question prompts,
- evidence walk-through,
- workflow guidance and safe panel-opening help later,
- prepared findings from scheduled, idle, or overnight local work later,
- rough capability candidates under review, not implementation commitments: `Where was I?`, `Show me the source`, `Highlight the gap`, `Explain this warning`, `Open the right panel`, `Show package preview`, `Why is AI blocked?`, `Use my mask summary`, `Save this as advisory memory`, `Promote this to canon`, `Forget this`, `What changed since last session?`, `Clean stale signals`, `What needs attention?`, and `Show only things blocking writing`.

Rough workload guidance for those capability candidates:

- `Where was I?` should normally use existing saved, session, or project state first.
- `What changed since last session?` may have a quick existing-context answer and a deeper scheduled or idle analysis later.
- `What needs attention?` should prefer known blockers, signals, and prepared findings before offering heavier scans.
- `Highlight the gap` may be lightweight and current-scope or may require deeper manual or deferred analysis depending on requested scope.
- `Clean stale signals` should prepare suggestions and never silently clean durable signal state.

## 10. What Is Hidden Until Needed

- deeper investigations,
- expensive routed runs,
- mode-specific personality behavior.

## 11. Inputs

- Memory Lab findings,
- governed `Memory Lab` recall later with preserved memory type,
- continuity signals,
- critique outputs,
- routing and budget policy,
- current writing context.

## 12. Outputs

- bounded explanations,
- questions,
- summaries,
- navigation guidance,
- temporary Writing Surface highlights or annotations later,
- manual or no-AI fallback options later,
- prepared-finding explanations later,
- evidence citations later,
- tool-trigger requests later,
- signal candidates later when the author chooses to escalate a temporary highlight or concern.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- writer decisions
- later note, revision, or planning systems

## 14. What Gets Stored

- preferences later,
- conversation boundaries later,
- accepted tool-trigger records later,
- explicit author-approved manual notes or saved actions later.

## 15. What Remains Temporary

- transient summaries,
- unaccepted suggestions,
- ephemeral conversational context,
- one-off investigation prompts,
- temporary Writing Surface highlights or annotations,
- `no-ai-route-available` explanations and fallback menus.

## 16. Relationship To Narrative Insertion / Assertion

Companion should speak about narrative primitives when relevant, not replace them with fuzzy narrative authority.

## 17. Relationship To Story Units

Companion may discuss or suggest Story Unit grouping later, but Story Units remain optional and non-foundational.

## 18. Relationship To Prose / Scene Projection

Companion may reference projections and prose views, but projection is not story truth.

## 19A. Relationship To Critique / Evaluation

`Critique` is a capability layer, not a Companion replacement.
Companion may route a request into Critique when the author is asking for evaluation, evidence-backed findings, ranked issues, comparison notes, signal candidates, feedback-note candidates, or rewrite prompts.
Companion may explain or review Critique outcomes, but it does not own Critique's evidence interpretation, issue ranking, or advisory findings.

## 19B. Relationship To Author Intent / Story Setup

Companion may route story-setup requests into Author Intent / Story Setup when the author is setting goals, boundaries, preferences, or story parameters.
Companion may explain or help update those settings, but it does not own them and it must not silently turn them into a universal startup gate.

## 19C. Relationship To Writing Surface

Companion must never gate the Writing Surface.
Direct writing remains available first.
Temporary Companion highlights or annotations are advisory UI overlays, not manuscript edits, not author-owned truth, and not durable signal state unless the author explicitly saves, converts, or accepts them.

## 20. Relationship To Command Center Surface

The Command Center is the more natural default home for Companion interactions, but Companion may later surface contextually elsewhere.

## 20A. Relationship To Memory Lab And System Ownership

`Companion` may use `Memory Lab` for governed recall, but it does not own `Memory Lab`.
`Companion` does not own the underlying systems it references.
`Continuity` owns continuity truth boundaries.
`Signal Architecture` owns durable signal state.
`Memory Lab` owns governed recall.
Routing owns route and spend permission.
`LLM Package Construction Architecture` owns package assembly.
The author owns final manuscript truth.

## 21. GUI Placement Principles

- appear with purpose,
- stay bounded,
- avoid dashboard clutter,
- do not interrupt the writer gratuitously.

## 22. Local LLM Role

Local models may support lightweight explanation or bounded questioning when routing permits.

## 23. Paid API Role

Paid API use must remain explicitly routed, justified, and visible when deeper reasoning is needed.

## 24. Model Routing Notes And Cost / Budget Impact

Companion must respect budget modes, avoid surprise spend, and stay quiet when routing policy says no.
Companion may not silently spend money even if safe local or support actions later become available.
`Companion` should answer from current UI state, accepted doctrine, saved project metadata, governed `Memory Lab` recall, existing signals, and prepared findings before offering heavier work.
`Companion` should communicate when a request requires heavier work and offer cheaper alternatives when possible.
Companion may suggest freely within local and advisory bounds.
Companion may perform safe local support actions only when they are non-destructive, non-authoritative, non-spending, non-outbound, and do not mutate manuscript text or author-owned truth.
Companion must require approval for paid, outbound, tool-using, truth-changing, memory-retaining, export or sync, deletion, or explicit-content outbound actions.
Companion must never silently bypass masks, exclusions, routing approval, or spend guardrails.
Companion may explain or present prepared findings from scheduled, cron, idle, or overnight local work, but it does not own the scheduler or silently apply resulting durable effects.
No scan should run while the author is actively typing unless it is cheap, local, and non-disruptive.
No full-project scan should run on every save.
No paid or outbound scheduled work should run without approval.
Direct writing remains available even when scans or jobs are blocked, deferred, refused, or unavailable.

Companion should explicitly tell the author when a request belongs to another system rather than pretending to absorb that work itself.
Examples of routed requests include evaluation requests for Critique, story-setup requests for Author Intent / Story Setup, rewrite requests for Draft Generation / Rewrite Loop, durable-attention requests for Signal Architecture, continuity-consistency requests for Continuity, and note or revision-tracking requests for Feedback Notes / Revision Resolution.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Companion must respect transformed-package rules and must not reveal masked raw content in its own voice.
Companion must not send raw content without approval.
Companion must honor AI exclusion zones and use only author-approved summaries or package views unless the author explicitly grants access to the raw excluded range.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Companion must not create the illusion that it knows more than the systems and evidence behind it can justify.
Companion system knowledge and app navigation guidance is operational help, not manuscript authority.

## 27. Testing Requirements

- Companion remains advisory,
- Companion does not silently trigger changes,
- Companion cites evidence when claiming investigative support later,
- Companion respects routing and budget boundaries.

## 28. Governance Rules And Risks

Governance rules:

- Companion is likely the interface or personality layer over Memory Lab and other systems,
- Companion is not truth owner,
- Companion is not author, judge, or silent actor,
- Companion may question, summarize, investigate, and explain,
- Companion may later run safe local or support actions if settings allow,
- Companion may provide local navigation guidance and safe local UI navigation support when the action is non-destructive, non-spending, non-outbound, and does not mutate manuscript text or author-owned truth,
- Companion may create temporary advisory highlights or annotations when asked, but durable signal state remains owned by `Signal Architecture`,
- Companion may guide workflows and explain system state, but guided action is not system ownership,
- recall used by `Companion` must preserve memory type such as author-owned truth, advisory memory, session context, preference, system knowledge, archive reference, or excluded or never-store,
- `Companion` must not treat recalled memory as author-owned truth unless the memory tier says it is author-owned truth,
- `Companion` and `Memory Lab` must prefer the cheapest safe source of truth or context first rather than jumping immediately to deeper scans,
- Companion may present prepared findings from scheduled, cron, idle, or overnight local work, but it does not own the scheduled service and must not silently apply results,
- Companion must interrupt only for user-requested watch conditions, approval gates, blocked requested tasks, `no-ai-route-available`, potentially destructive actions, or spending or outbound decisions,
- Companion must not silently spend, rewrite, send raw content, mutate story truth, retain memory, export or sync, delete, or canonize facts without approval.

Minimum rough workload tiers for later `Companion` guidance:

- `instant existing-context lookup`
- `lightweight local scan`
- `idle or deferred local analysis`
- `scheduled or overnight local analysis`
- `manual heavy scan`
- `paid or outbound approved work`

Minimum rough Companion source labels for investigative guidance:

- `accepted continuity truth`
- `author note`
- `Memory Lab advisory memory`
- `unresolved signal candidate`
- `current manuscript text`
- `system or navigation knowledge`
- `routing or package state`
- `scheduled or idle prepared finding`
- `archive reference`

Minimum rough temporary highlight or annotation lifecycle:

- `suggested`
- `visible`
- `dismissed`
- `snoozed`
- `saved as advisory note`
- `converted to signal candidate`
- `promoted through owning system`
- `expired`

These are rough product-definition labels, not a final runtime state model.
`Companion` should be able to answer `show me the source` and distinguish canon from advisory, temporary, scheduled, and archive material.
Simple app-navigation answers may rely directly on system or navigation knowledge without pretending to be manuscript authority.
Temporary highlights or annotations are advisory overlays, must respect masks and AI exclusion zones, must be dismissible, and must not leak raw excluded text.

Risks:

- over-personified authority,
- interruption overload,
- evidence-free confidence,
- spending creep.

## 29. Failure Modes

- Companion speaks with false certainty,
- Companion interrupts at the wrong time,
- Companion triggers hidden tool work,
- Companion becomes a proxy truth owner for Memory Lab.

## 30. v1 Boundary

Doctrine only plus visibility, evidence, and interruption boundaries.

## 31. v2 Boundary

Summonable explanation flows, bounded investigation runs, and better evidence-backed dialogue.

## 32. Future-Only Boundary

- automatic mutation authority,
- always-on interruption,
- silent paid deep-reasoning loops,
- personality-first behavior without evidence discipline.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently. Jason's doctrine reduces the architecture-level authority risk; remaining questions are exact tool, setting, and approval boundaries.

### Critical Questions

- Future contract need: beyond the rough source labels above, what exact evidence citation expectations apply before `Companion` claims investigative support or presents downstream conclusions as reliable guidance?
- Future contract need: beyond the rough highlight lifecycle above, what exact visibility, dismissal, snooze, expiry, and handoff rules should govern temporary `Companion` Writing Surface highlights or annotations before they are dismissed, saved, converted, or offered as signal candidates?
- Future contract need: what exact routing language should Companion use when it tells the author a request belongs to Critique, Author Intent / Story Setup, Draft Generation / Rewrite Loop, Signal Architecture, Continuity, or Feedback Notes / Revision Resolution instead of Companion itself?

### Major Questions

- What personality boundaries keep Companion from over-personified authority?
- How should Companion degrade on weak hardware or local-only mode?
- How should Companion handle explicit-content-heavy material?
- How should Companion present contradictory downstream systems?

### Minor Questions

- What exact personality voice should survive into UI?
- What cosmetic presentation polish is useful after authority and routing boundaries are stable?

### Answered / Superseded Questions

- Is Companion likely the interface or personality layer over Memory Lab and other systems? Answered: yes, as working rough doctrine.
- Is Companion truth owner? Answered: no.
- Can Companion explain, question, summarize, and investigate with boundaries? Answered: yes.
- May Companion silently spend, rewrite, or canonize? Answered: no.
- Does Companion gate writing by default? Answered: no.
- May Companion eventually run safe local or support actions if settings allow? Answered: yes.
- May Companion send raw content, mutate story truth, or canonize facts without approval? Answered: no.
- Is `Companion` the same thing as `Memory Lab` or a proxy truth owner for it? Answered: no. `Companion` is a bounded interface layer over other systems and remains advisory.
- What visibility triggers and interruption rules allow `Companion` to appear uninvited, and when must it stay silent unless explicitly summoned? Answered: `Companion` is silent and available by default and may interrupt only for user-requested watch conditions, approval gates, spending or outbound or tool-use decisions, blocked requested tasks, `no-ai-route-available`, or potentially destructive actions.
- What permission model governs what `Companion` may suggest, what safe local or support actions it may execute, and what always requires explicit user action? Answered: `Companion` may suggest freely within local and advisory bounds and may perform safe local support actions only when they are non-destructive and non-authoritative. Paid, outbound, tool-using, truth-changing, memory-retaining, export or sync, deletion, and explicit-content outbound actions require approval.
- What routing, spending, outbound, and tool-use approval boundaries govern `Companion` escalation from local advisory help to paid, outbound, or tool-using help? Answered: `Companion` must respect routing, spend, mask, exclusion, and approval boundaries and may never silently bypass them.
- What should `Companion` do when `no-ai-route-available` occurs, and which manual or no-AI fallbacks may it offer without gating direct writing? Answered: `Companion` should explain the route failure and offer manual or no-AI fallbacks such as continue writing, revise mask or summary, skip excluded ranges, run non-model local tools, save a manual note, create a manual signal or task, or cancel.
- How must `Companion` handle masked or AI-excluded ranges so it does not reveal raw content, overstate unavailable evidence, or bypass package-boundary doctrine? Answered: `Companion` must honor AI exclusion zones and use only author-approved summaries or package views unless the author explicitly grants access to the raw excluded range.
- What rough source labels should `Companion` preserve when presenting guidance? Answered: accepted continuity truth, author note, Memory Lab advisory memory, unresolved signal candidate, current manuscript text, system or navigation knowledge, routing or package state, scheduled or idle prepared finding, and archive reference.
- What rough lifecycle states should temporary `Companion` highlights or annotations use? Answered: suggested, visible, dismissed, snoozed, saved as advisory note, converted to signal candidate, promoted through owning system, and expired.
- What rough resource-governed assistance posture should `Companion` follow before offering deeper work? Answered: prefer current UI state, accepted doctrine, saved project metadata, governed `Memory Lab` recall, existing signals, and prepared findings first, then offer heavier scans as optional work.
- What rough workload tiers should `Companion` communicate when help ranges from cheap lookup to expensive analysis? Answered: instant existing-context lookup, lightweight local scan, idle or deferred local analysis, scheduled or overnight local analysis, manual heavy scan, and paid or outbound approved work.
- Should Companion silently absorb every requested task? Answered: no. Companion should route requests to the owning system when the author is actually asking for Critique, Author Intent / Story Setup, Draft Generation / Rewrite Loop, Signal Architecture, Continuity, or Feedback Notes / Revision Resolution work.

### Deferred Questions

- Advanced conversation memory.
- Surface or tone consolidation from bridge docs after the Companion contract is stable.
- Does the `no-ai-route-available` escalation contract eventually need a reusable Companion-facing artifact, or can the fallback explanation and manual or no-AI options remain split across routing, explicit-content, package construction, and Companion dossiers?
- Workflow capability candidates remain rough product possibilities, not implementation commitments or build permission.
- Future scheduled or idle local-service behavior remains a candidate contract area, not a selected implementation artifact.

## 34. Acceptance Criteria

Current-cluster rough stability note: implementation remains blocked by open Critical questions, but the `Memory Lab` and `Companion` cluster is stable enough to pause tightening after this pass and shift later attention to whichever adjacent dossiers still need contract-shaping.

This rough dossier is acceptable only if:

- Companion stays advisory,
- Companion does not become truth owner,
- Companion does not become author, judge, or silent actor,
- any future safe local or support actions remain settings-bound and approval-bound,
- writing remains sovereign,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no runtime implementation is implied.
