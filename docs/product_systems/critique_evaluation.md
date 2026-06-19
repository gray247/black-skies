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

This dossier inherits output vocabulary from `shared_output_vocabulary_contract.md`, AI approval and lifecycle rules from `ai_lifecycle_and_approval_matrix.md`, handoff rules from `surface_to_owner_action_handoff_contract.md`, protection rules from `protected_content_permission_matrix.md`, provenance posture from `provenance_state_model.md`, and truth or durable-state ownership limits from `truth_and_state_ownership_matrix.md`.

## 3. User Problem Solved

The writer needs bounded evaluation support that can identify issues, compare options, and recommend next steps without silently replacing authorship, truth, or workflow ownership.

## 4. What The System Does

- reads evidence from supported systems,
- produces advisory findings, ranked issues, evidence bundles, comparison notes, recommendation lists, signal candidates, feedback-note candidates, and rewrite-prompt candidates,
- helps the author inspect writing, structure, continuity, tone, and related concerns,
- may be invoked by Companion, Writing Surface, Command Center, Draft Generation / Rewrite Loop, or direct manual author action,
- can use Author Intent / Story Setup as a goal-and-boundary reference while that profile remains hosted in Workflow Spine / Author Journey.

## 5. What The System Does Not Do

- it is not primarily a surface,
- it is not Companion-owned,
- it does not own manuscript truth,
- it does not own author-owned canon,
- it does not own durable signal state,
- it does not own Feedback Notes workflow,
- it does not own Memory Lab recall,
- it does not own rewrite execution,
- it does not own routing, spend, export, sync, or publish decisions,
- it does not own explicit-content clearance or protected-content permissions,
- it does not own final author decisions,
- it does not own durable note state or durable memory,
- it does not replace Plugin / Rubric System, Feedback Notes / Revision Resolution, Signal Architecture, Draft Generation / Rewrite Loop, Continuity, or Companion.

## 6. User-Facing Behavior

Visible behavior should stay optional, bounded, and clearly labeled as advisory evaluation.
Temporary critique findings may offer writer-facing actions such as
`Save as Note`, `Flag for attention`, `Dismiss`, `Ignore`, and `Review
source`, but the visible choice remains only a request until the owning
system accepts it.

Invocation posture:

- `Companion` may launch critique, explain critique findings, summarize critique outcomes, or help the author review them,
- `Writing Surface` may show small current-text critique hints only when useful,
- `Command Center Surface` may host heavier critique review, comparison, and cleanup workflows,
- `Draft Generation / Rewrite Loop` may use critique findings to frame rewrite options,
- the author may request critique directly without going through `Companion`.

## 7. Hidden/Background Behavior

Background evaluation may assemble context, compare evidence, and prepare candidate findings, but it must remain advisory until explicitly accepted or converted through the owning system.
It must not silently convert findings into canon, durable signal state, feedback workflow state, or rewrite execution.
Protected, hidden, deleted, discarded, forgotten, local-only, or AI-excluded material must not leak through critique summaries.

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
- rewrite-prompt candidates,
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

When Critique consumes craft-analyzer findings, it must preserve source
analyzer identity, source evidence, uncertainty posture, and temporary
versus durable status rather than flattening those findings into a
generic hidden critique voice.

## 12. Outputs

Critique / Evaluation may produce:

- advisory findings,
- ranked issues,
- evidence bundles,
- comparison notes,
- recommendation lists,
- warnings,
- signal candidates,
- feedback-note candidates,
- rewrite-prompt candidates,
- comparison results,
- bounded explanation views for Companion or the owning surface.

These outputs are advisory unless explicitly accepted or converted through the owning system.
Severity and ranking remain advisory unless converted through an owning system.

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
- critique result state,
- author action history where needed,
- optional links into feedback notes or signal candidates,
- bounded recent completed-run history under the editorial-workflow
  history posture when it is still useful and within trimming limits.
Critique candidates are temporary until retained through an owning
system.
Completed critique history remains advisory evidence rather than
editorial truth or durable workflow closure by itself.
Pinned evidence is preserved for review and provenance rather than
promoted into truth.
Converted evidence should remain linked to its durable destination where
possible, such as a `Feedback Note` or `Signal`.
If an older run trims, surviving retained history should fall back to
honest metadata, bounded summaries, provenance, and any pinned or
converted evidence that remains preservable under the shared
editorial-history posture.

## 15. What Remains Temporary

Temporary or non-durable:

- transient evaluation runs,
- unsaved comparisons,
- scratch findings,
- provisional rankings,
- review drafts,
- candidate outputs not explicitly retained,
- unpinned temporary history that may later expire or trim honestly.

Critique result states may later include:

- `candidate`
- `reviewed`
- `accepted by author`
- `dismissed`
- `ignored`
- `deferred`
- `stale`
- `superseded`
- `converted` through another owning system

Rerunning critique may produce newer advisory findings, comparison
results, or labels such as `appears resolved`, `persists`, `changed
form`, `insufficient evidence`, or `possible recurrence`.
Those outcomes remain advisory.
They must not silently replace, resolve, reopen, or rewrite durable
notes, durable signals, or manuscript truth.

## 15A. History And Evidence Posture

Critique follows the shared bounded analyzer-history defaults:

- roughly `30` recent completed runs per project
- roughly `180 days` for unpinned history
- oldest unpinned history trimmed first
- pinned or converted evidence preserved
- trimming disclosed honestly

Evidence posture rules:

- `current` means the evidence came from the latest still-available run
  for that scope
- `stale` means the finding or evidence may no longer match current prose
  or current owner state
- `trimmed detail` means the earlier run existed, but full inspectable
  detail is no longer retained
- `pinned` means preserved for review or provenance without becoming
  truth
- `converted` means explicitly linked to a durable downstream artifact,
  not automatically accepted as truth
- `protected` means raw source detail degrades to bounded labels,
  approved summaries, source type, or owner-routed explanation
- `unavailable` means the source cannot currently be opened and the
  absence must be disclosed honestly
- `superseded run` means a newer critique run exists, but the older run
  may still remain inspectable for comparison while available
- `comparison-only` means an older run may support comparison view
  without claiming present correctness

Review collections and comparison views may reference stale or
superseded critique runs when that is useful, but they must label the
limitation honestly rather than implying that older evidence is current.
Loss of detailed critique evidence must not silently erase any durable
`Feedback Note` or `Signal` that was previously linked from it.

## 16. Relationship To Narrative Insertion / Assertion

Critique may evaluate narrative assertions and related evidence, but it does not replace `Narrative Insertion / Narrative Assertion` as the authority for authored truth.

## 17. Relationship To Story Units

Story Unit links are optional context only.
They may help scope an evaluation, but they do not own the result.

## 18. Relationship To Prose / Scene Projection

Critique may inspect projected prose or scene views as evidence, comparison material, or navigation context.
Projection remains support context rather than truth authority.

## 19. Relationship To Writing Surface

Writing Surface may show small current-text critique hints when useful, but it must not turn Critique into the default writing interface or a constant report surface.

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
Protected-content summaries must stay redacted where required and must not expose raw AI-excluded or deleted material.

## 27. Testing Requirements

- Critique stays advisory until explicitly accepted,
- Critique does not own truth or durable signal state,
- Critique outputs can be routed into Companion, Draft Generation, Feedback Notes, and Signal Architecture without collapsing those systems,
- protected or excluded material does not leak through critique summaries,
- the system does not become a hidden generic grading surface.

## 28. Governance Rules And Risks

Governance rules:

- advisory findings are not authored truth,
- Critique outputs are advisory findings, warnings, recommendations, comparison results, signal candidates, feedback-note candidates, and rewrite candidates only,
- no shadow canon,
- no silent truth mutation,
- no hidden grading authority,
- no hidden universal grader,
- no alternate truth owner,
- no silent Companion-to-canon conversion,
- no silent critique-to-signal conversion outside `Signal Architecture` rules,
- no silent critique-to-rewrite conversion without explicit author action,
- no silent critique-side closure of durable notes or durable signals,
- no silent routing or spend expansion,
- no protected-content bypass,
- no use of protected, masked, deleted, hidden, or AI-excluded material without permission.

Historical decomposition:

- old Critique is a historical seed,
- that seed decomposes into `Critique / Evaluation`, `Feedback Notes / Revision Resolution`, `Signal Architecture`, `Draft Generation / Rewrite Loop`, `Plugin / Rubric System`, `Continuity`, and `Companion` explanation or routing.

Risks:

- Critique being mistaken for a universal surface,
- evaluation output being mistaken for author truth,
- Companion silently turning critique into canon,
- critique findings becoming durable signals without `Signal Architecture` rules,
- critique recommendations becoming rewrites without explicit author action,
- critique reading protected, masked, deleted, hidden, or AI-excluded material without permission,
- review output becoming a hidden critique police layer,
- provider or routing changes leaking into authority.

## 29. Failure Modes

- conflicting findings,
- stale evaluations after heavy rewrite,
- ranking disagreements,
- overlong or over-dense reports,
- evidence drift after source changes,
- confusion between critique output and accepted prose,
- protected-content boundaries being misread during evaluation,
- critique results remaining visible after they are stale or superseded.

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
- active question count after merge: 14
- remaining blocker summary: `0 Fatal`, `6 Critical`, `2 Major`, `1 Minor`

### Fatal Questions

- None currently. The governance suite answers the prior hidden-authority and conversion-path concerns.

### Critical Questions

- What exact output shape and ordering should be standard first for critique results?
- What exact evidence citation standard applies before Critique claims a finding or comparison is reliable guidance?
- What exact severity, confidence, and evidence-grading model should Critique use before ranked issues appear across surfaces?
- What exact result-detail density belongs in Writing Surface hints versus Command Center review versus Companion explanation versus direct critique review?
- What exact locality, routing, and approval policy applies before heavier critique may run, especially when provider changes or outbound package rules apply?
- What exact v1 critique catalog should ship first versus remain deferred?

### Major Questions

- What default result grouping is most useful first: findings, rankings, evidence bundles, comparison notes, rewrite-prompt candidates, or some other bounded presentation?
- Should accepted, dismissed, deferred, stale, superseded, and converted critique results remain visible as local critique history, or should some states expire by default?

### Minor Questions

- What user-facing label best distinguishes critique result types without implying final authority?

### Answered / Superseded Questions

- Critique is not primarily a surface.
- Companion may route into Critique but does not own it.
- Critique outputs are advisory unless explicitly accepted or converted through the owning system.
- Critique does not own manuscript truth, accepted canon, durable signal state, Feedback Notes workflow, Memory Lab recall, rewrite execution, routing or spend, export or sync, explicit-content clearance, protected-content permissions, or final author decisions.
- Plugin / Rubric System remains separate; Critique does not replace it.
- Broad settings questions such as global-versus-project critique harshness are better owned by settings or future policy work, not by this dossier.
- Critique may produce warnings, comparison results, recommendations, signal candidates, feedback-note candidates, and rewrite candidates without owning the downstream conversion.
- Protected, hidden, deleted, discarded, forgotten, local-only, or AI-excluded material must not leak through critique summaries.

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
- it does not silently turn critique into canon, durable signal state, feedback workflow state, or rewrite execution,
- it does not silently mutate manuscript truth or protected content,
- active questions live in the dossier instead of only in a giant standalone register,
- active questions live only in the centralized `Pre-Rough Alignment Questionnaire`,
- Critical and Future contract questions are not buried inside a generic open-question list,
- the dossier remains rough, investigative, and not build-ready.
