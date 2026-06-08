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
- point to evidence,
- route into other tools with consent.

## 7. Hidden/Background Behavior

- waiting quietly,
- preparing bounded context,
- deferring to stronger systems for evidence.

## 8. What Appears First

Companion should appear only when invited, clearly relevant, or explicitly configured later.

## 9. What Is Summonable

- explanation,
- investigation,
- summary,
- question prompts,
- evidence walk-through.

## 10. What Is Hidden Until Needed

- deeper investigations,
- expensive routed runs,
- mode-specific personality behavior.

## 11. Inputs

- Memory Lab findings,
- continuity signals,
- critique outputs,
- routing and budget policy,
- current writing context.

## 12. Outputs

- bounded explanations,
- questions,
- summaries,
- evidence citations later,
- tool-trigger requests later.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- writer decisions
- later note, revision, or planning systems

## 14. What Gets Stored

- preferences later,
- conversation boundaries later,
- accepted tool-trigger records later.

## 15. What Remains Temporary

- transient summaries,
- unaccepted suggestions,
- ephemeral conversational context,
- one-off investigation prompts.

## 16. Relationship To Narrative Insertion / Assertion

Companion should speak about narrative primitives when relevant, not replace them with fuzzy narrative authority.

## 17. Relationship To Story Units

Companion may discuss or suggest Story Unit grouping later, but Story Units remain optional and non-foundational.

## 18. Relationship To Prose / Scene Projection

Companion may reference projections and prose views, but projection is not story truth.

## 19. Relationship To Writing Surface

Companion must never gate the Writing Surface.
Direct writing remains available first.

## 20. Relationship To Command Center Surface

The Command Center is the more natural default home for Companion interactions, but Companion may later surface contextually elsewhere.

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

## 25. Explicit-Content / Send-Package Handling, If Applicable

Companion must respect transformed-package rules and must not reveal masked raw content in its own voice.
Companion must not send raw content without approval.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Companion must not create the illusion that it knows more than the systems and evidence behind it can justify.

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
- Companion must not silently spend, rewrite, send raw content, mutate story truth, or canonize facts without approval.

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

- What visibility triggers are allowed?
- What interruption rules are allowed?
- What escalation rules are allowed?
- What API spending rules govern Companion work?
- What evidence citation expectations apply before Companion claims investigative support?
- What explicit user-action permission model governs tool triggers?

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

### Deferred Questions

- Advanced conversation memory.
- Surface or tone consolidation from bridge docs after the Companion contract is stable.
- Does the `no-ai-route-available` escalation contract eventually need a reusable Companion-facing artifact, or can the fallback explanation and manual or no-AI options remain split across routing, explicit-content, package construction, and Companion dossiers?

## 34. Acceptance Criteria

This rough dossier is acceptable only if:

- Companion stays advisory,
- Companion does not become truth owner,
- Companion does not become author, judge, or silent actor,
- any future safe local or support actions remain settings-bound and approval-bound,
- writing remains sovereign,
- Fatal and Critical questions remain open, so this dossier cannot be treated as build-ready,
- no runtime implementation is implied.
