# Critique / Evaluation

## 1. Status Header

- Dossier name: `Critique / Evaluation`
- Status: `Exploring`
- Class: `Intelligence`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Companion`, `Continuity`, `Signal Architecture`, `Draft Generation / Rewrite Loop`, `Feedback Notes / Revision Resolution`, `Plugin / Rubric System`, `Memory Lab`, `Model Routing And Budget Architecture`, `Explicit Content Architecture`, `Workflow Spine / Author Journey`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Draft Generation / Rewrite Loop`, `Feedback Notes / Revision Resolution`, `Signal Architecture`, `Companion`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `partial`
- Hidden/background: `partial`

## 2. Purpose

Define Critique / Evaluation as an evaluation capability layer that reads evidence from other systems and turns that evidence into advisory findings without becoming a mandatory surface or a hidden truth owner.

## 3. User Problem Solved

The writer needs bounded evaluation support that can identify issues, compare options, and recommend next steps without silently replacing authorship, truth, or workflow ownership.

## 4. What The System Does

- reads evidence from supported systems,
- produces advisory findings, recommendations, evidence bundles, ranked issues, comparison notes, signal candidates, feedback-note candidates, and rewrite prompts,
- helps the author inspect writing, structure, continuity, tone, and related concerns,
- may be invoked by Companion, Writing Surface, Command Center, Draft Generation / Rewrite Loop, or manual author action,
- can use Author Intent / Story Setup as a goal-and-boundary reference while that profile remains hosted in Workflow Spine / Author Journey.

## 5. What The System Does Not Do

- it is not primarily a surface,
- it is not Companion-owned,
- it does not own manuscript truth,
- it does not own author-owned canon,
- it does not own durable signal state,
- it does not own Memory Lab recall,
- it does not own rewrite execution,
- it does not own routing, spend, export, sync, or publish decisions,
- it does not own explicit-content clearance or protected-content permissions,
- it does not replace Plugin / Rubric System, Feedback Notes / Revision Resolution, Signal Architecture, Draft Generation / Rewrite Loop, Continuity, or Companion.

## 6. User-Facing Behavior

Visible behavior should stay optional, bounded, and clearly labeled as advisory evaluation.

## 7. Hidden/Background Behavior

Background evaluation may assemble context, compare evidence, and prepare candidate findings, but it must remain advisory until explicitly accepted or converted through the owning system.

## 8. What Appears First

- a concise evaluation summary,
- the highest-value findings or comparisons,
- clear labels for what is evidence, recommendation, or candidate output,
- a path back to the owning surface that will actually resolve the issue.

## 9. What Is Summonable

- evidence-backed findings,
- ranked issues,
- comparison notes,
- evidence bundles,
- signal candidates,
- feedback-note candidates,
- rewrite prompts,
- direct launch from Companion, Writing Surface, Command Center, Draft Generation / Rewrite Loop, or manual author action.

## 10. What Is Hidden Until Needed

- dense evidence trails,
- provider-specific detail,
- deep comparison mechanics,
- raw rubric internals,
- low-value history,
- protected or excluded raw content,
- implementation-heavy execution detail.

## 11. Inputs

Critique / Evaluation may read:

- Author Intent / Story Setup,
- manuscript text,
- draft history,
- Emotion Graph,
- Timeline / Pacing / Pressure,
- Relationship Map,
- Character Cards,
- Lore Cards,
- Continuity,
- Theme System,
- Foreshadow / Payoff,
- Senses Usage,
- Overused Words,
- Cliche Detection,
- Plugin / Rubric System,
- governed `Memory Lab` recall,
- `Signal Architecture` signal context,
- Companion summaries when the author asks for routed explanation.

## 12. Outputs

Critique / Evaluation may produce:

- advisory findings,
- recommendations,
- evidence bundles,
- ranked issues,
- comparison notes,
- signal candidates,
- feedback-note candidates,
- rewrite prompts,
- bounded explanation views for Companion or the owning surface.

These outputs are advisory unless explicitly accepted or converted through the owning system.

## 13. Which Other Systems Consume Those Outputs

Likely consumers:

- `Writing Surface`
- `Command Center Surface`
- `Draft Generation / Rewrite Loop`
- `Feedback Notes / Revision Resolution`
- `Signal Architecture`
- `Companion`
- manual author review

Downstream systems must preserve the distinction between advisory findings and author-owned truth.

## 14. What Gets Stored

Eventually stored, when explicitly retained:

- retained findings,
- evidence references,
- ranked issue records,
- comparison records,
- source labels,
- provenance,
- author action history where needed,
- optional links into feedback notes or signal candidates.

## 15. What Remains Temporary

Temporary or non-durable:

- transient evaluation runs,
- unsaved comparisons,
- scratch findings,
- provisional rankings,
- review drafts,
- candidate outputs not explicitly retained.

## 16. Relationship To Narrative Insertion / Assertion

Critique may evaluate narrative assertions and related evidence, but it does not replace `Narrative Insertion / Narrative Assertion` as the authority for authored truth.

## 17. Relationship To Story Units

Story Unit links are optional context only.
They may help scope an evaluation, but they do not own the result.

## 18. Relationship To Prose / Scene Projection

Critique may inspect projected prose or scene views as evidence, comparison material, or navigation context.
Projection remains support context rather than truth authority.

## 19. Relationship To Writing Surface

Writing Surface may show small current-text critique hints when useful, but it must not turn Critique into the default writing interface.

## 20. Relationship To Command Center Surface

Command Center is the natural home for heavier critique review, comparison, and cleanup workflows.
It may manage critique results, but it does not own Critique itself.

## 20A. Relationship To Companion

Companion may launch Critique, explain Critique findings, or help the author review them.
Companion does not own Critique's evidence interpretation or issue ranking.

## 20B. Relationship To Draft Generation / Rewrite Loop

Draft Generation may use Critique findings to frame rewrite options, but it must not silently mutate manuscript text or convert findings into accepted prose without author action.

## 20C. Relationship To Feedback Notes / Revision Resolution

Feedback Notes may receive critique-derived note candidates, but note resolution still requires the owning feedback workflow.

## 20D. Relationship To Signal Architecture

Critique may emit signal candidates or structured concern candidates, but durable signal state remains owned by `Signal Architecture`.

## 20E. Relationship To Memory Lab

Critique may use governed `Memory Lab` recall as evidence context, but it does not own `Memory Lab` recall and it must not treat recall as canon by itself.

## 20F. Relationship To Plugin / Rubric System

Plugin / Rubric System may provide bounded scoring or review lenses.
Critique is not a hidden generic rubric engine, and Plugin / Rubric output is not automatically Critique authority.

## 21. GUI Placement Principles

- not a mandatory surface,
- not dashboard clutter,
- clearly labeled as evaluation,
- summonable from the surfaces that need it,
- optional on default writing flow.

## 22. Local LLM Role

Local models may later assist with bounded evaluation, comparison, or ranking when routing permits.

## 23. Paid API Role

Paid API use, if later used, must remain optional, approval-governed, and spend-constrained.

## 24. Model Routing Notes And Cost / Budget Impact

Critique / Evaluation must respect routing, privacy, approval, and budget rules.
It must not silently spend, switch providers, or expand scope.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Critique must respect transformed-package rules and must not reveal masked raw content in its own voice.
It may review author-approved summaries or package views only when the author and owning-system rules allow it.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Critique must not leak protected material, and it must not treat excluded or masked material as public evidence.
It must not bypass protected-content permissions.

## 27. Testing Requirements

- Critique stays advisory until explicitly accepted,
- Critique does not own truth or durable signal state,
- Critique outputs can be routed into Companion, Draft Generation, Feedback Notes, and Signal Architecture without collapsing those systems,
- protected or excluded material does not leak through critique summaries,
- the system does not become a hidden generic grading surface.

## 28. Governance Rules And Risks

Governance rules:

- advisory findings are not authored truth,
- no shadow canon,
- no silent truth mutation,
- no hidden grading authority,
- no silent routing or spend expansion,
- no protected-content bypass.

Historical decomposition:

- old Critique is a historical seed,
- that seed decomposes into `Critique / Evaluation`, `Feedback Notes / Revision Resolution`, `Signal Architecture`, `Draft Generation / Rewrite Loop`, `Plugin / Rubric System`, `Continuity`, and `Companion` explanation or routing.

Risks:

- Critique being mistaken for a universal surface,
- evaluation output being mistaken for author truth,
- review output becoming a hidden critique police layer,
- provider or routing changes leaking into authority.

## 29. Failure Modes

- conflicting findings,
- stale evaluations after heavy rewrite,
- ranking disagreements,
- overlong or over-dense reports,
- evidence drift after source changes,
- confusion between critique output and accepted prose.

## 30. v1 Boundary

Minimum approved first version:

- advisory evaluation summaries,
- bounded evidence-backed findings,
- clear separation from authoritative truth,
- launchable from Companion, Writing Surface, Command Center, Draft Generation, or manual action,
- no automatic mutation,
- no mandatory startup gate.

## 31. v2 Boundary

Next bounded extension:

- richer comparison bundles,
- optional ranking workflows,
- better evidence grouping,
- deeper local-model support,
- heavier Command Center review support.

## 32. Future-Only Boundary

Future-only items:

- automatic grading,
- universal critique mode,
- critique-owned truth,
- silent rewrite execution,
- hidden provider switching,
- critique as a replacement for owning systems.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from critique / review / report / evidence / rewrite adjacency, with broad settings and personality questions filtered out when they were not safe for this dossier
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `5 Critical`, `2 Major`, `1 Minor`

### Fatal Questions

- None currently.

### Critical Questions

- What exact authority model prevents Critique / Evaluation from becoming a hidden universal grader or alternate truth owner?
- What exact output classes are permitted: advisory findings, recommendations, evidence bundles, ranked issues, comparison notes, signal candidates, feedback-note candidates, rewrite prompts, or a narrower subset?
- What exact evidence citation standard applies before Critique claims a finding or comparison is reliable guidance?
- Which surfaces may invoke Critique directly, and which may only consume Critique outputs after a handoff?
- What exact separation keeps Critique from overwriting Signal Architecture, Memory Lab, routing or spend, export or sync, or explicit-content permissions?

### Major Questions

- How much result detail belongs in Writing Surface hints versus Command Center review versus Companion explanation?
- What default result grouping is most useful first: findings, rankings, evidence bundles, comparison notes, rewrite prompts, or some other bounded presentation?

### Minor Questions

- What user-facing label best distinguishes critique result types without implying final authority?

### Answered / Superseded Questions

- Critique is not primarily a surface.
- Companion may route into Critique but does not own it.
- Critique outputs are advisory unless explicitly accepted or converted through the owning system.
- Critique does not own manuscript truth, durable signal state, Memory Lab recall, rewrite execution, routing or spend, export or sync, or explicit-content clearance.
- Plugin / Rubric System remains separate; Critique does not replace it.
- Broad settings questions such as global-versus-project critique harshness are better owned by settings or future policy work, not by this dossier.

### Deferred Questions

- Deferred: exact severity vocabulary and escalation language.
- Deferred: whether any future settings-facing critique mode belongs in a separate support policy dossier.

## 34. Acceptance Criteria

This dossier is acceptable only if it explicitly states that:

- Critique / Evaluation is a capability layer, not a hidden truth owner,
- it remains advisory until explicitly accepted or converted through an owning system,
- it is not Companion-owned,
- it does not replace Plugin / Rubric System, Feedback Notes, Signal Architecture, Draft Generation, Continuity, or Companion,
- it may be invoked by multiple surfaces without becoming a universal surface,
- it does not silently mutate manuscript truth or protected content,
- active questions live in the dossier instead of only in a giant standalone register,
- active questions live only in the centralized `Pre-Rough Alignment Questionnaire`,
- Fatal and Critical questions are not buried inside a generic open-question list,
- the dossier remains rough, investigative, and not build-ready.
