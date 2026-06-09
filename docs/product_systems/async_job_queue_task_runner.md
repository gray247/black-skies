# Async Job Queue / Task Runner

## 1. Status Header

- Dossier name: `Async Job Queue / Task Runner`
- Status: `drafted`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Model Routing And Budget Architecture`, `Companion`, `Memory Lab`
- Feeds into: background-capable systems
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `partial`
- Hidden/background: `yes`

## 2. Purpose

Define the job queue and task runner that support bounded background work without allowing silent paid, outbound, destructive, or truth-mutating actions.

## 3. User Problem Solved

The writer needs heavier work to be schedulable or deferrable without background execution outrunning approvals, privacy, or writing flow.

## 4. What The System Does

- queue work,
- defer work,
- run allowed background tasks,
- report job state.

## 5. What The System Does Not Do

- silently spend money,
- silently send protected content,
- silently mutate truth or manuscript state.

## 6. User-Facing Behavior

Visible behavior should emphasize queued state, approvals, and reviewable results.

## 7. Hidden/Background Behavior

Background execution is the core role, but it remains bounded by approvals and owning-system contracts.

## 8. What Appears First

- relevant job state,
- current blocker or failure state,
- reviewable outputs when available.

## 9. What Is Summonable

- deeper job history,
- queue detail,
- execution diagnostics.

## 10. What Is Hidden Until Needed

- low-level runner detail,
- dense execution history,
- implementation-heavy telemetry.

## 11. Inputs

- approved tasks,
- routing state,
- privacy and masking state,
- author approvals.

## 12. Outputs

- queued job state,
- job results,
- failure or approval-needed state.

## 13. Which Other Systems Consume Those Outputs

- background-capable systems
- `Command Center Surface`
- `Companion`

## 14. What Gets Stored

- queue state,
- execution records,
- approval references,
- bounded job history.

## 15. What Remains Temporary

- transient worker state,
- intermediate job artifacts,
- in-flight results before review.

## 16. Relationship To Narrative Insertion / Assertion

The task runner may support systems around narrative work, but it does not own or mutate truth by itself.

## 17. Relationship To Story Units

Story Units may scope jobs optionally.

## 18. Relationship To Prose / Scene Projection

Projection tasks may be queued, but queued projection work remains non-authoritative.

## 19. Relationship To Writing Surface

No heavy queued work should disrupt active typing or gate direct writing.

## 20. Relationship To Command Center Surface

The Command Center is the likely home for queued-job review, approval, and failure state.

## 21. GUI Placement Principles

Keep queue state visible when relevant, not always-on clutter.

## 22. Local LLM Role

Local-model jobs are a likely background use case when approved and safe.

## 23. Paid API Role

Paid jobs require explicit approval and spend governance.

## 24. Model Routing Notes And Cost / Budget Impact

All queued AI work must obey routing, approval, spend, and fallback rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Queued work must not bypass masking, package, or explicit-content boundaries.

## 26. Privacy / Safety / Censor Behavior, If Applicable

No background job may bypass masks or exclusion zones.

## 27. Testing Requirements

Prove blocked tasks stay blocked and reviewed findings do not auto-apply.

## 28. Governance Rules And Risks

- no silent paid or outbound work,
- no silent truth mutation,
- no hidden bypass of masks or approvals.

## 29. Failure Modes

If the queue fails, direct writing and manual actions remain available.

## 30. v1 Boundary

Basic queued-state handling for approved local or bounded jobs.

## 31. v2 Boundary

Richer deferred and scheduled workflows with clearer review paths.

## 32. Future-Only Boundary

Broad autonomous orchestration.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from cancel, retry, paid-job, hybrid-job, and queued-review questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 9
- remaining blocker summary: `1 Fatal`, `4 Critical`, `2 Major`

### Fatal Questions

- Fatal: what categories of job are never allowed to run silently, including paid, outbound, destructive, truth-mutating, protected-content, export, sync, publish, memory-retaining, or masked-raw-content-revealing work?

### Critical Questions

- Critical: what approval, block, queue, running, partial-success, failed, canceled, retryable, refused, expired, and review-complete states govern queued work?
- Critical: what happens when a paid or hybrid job is canceled mid-run, partially succeeds, retries after spending begins, or would double cost if retried?
- Critical: what result-review boundaries prevent queued findings or generated artifacts from auto-applying to manuscript text, truth, `Memory Lab`, or durable signal state?
- Critical: which jobs may run in degraded or offline conditions, which must pause or fail closed, and what blocked-task messaging is required when the queue cannot safely continue?

### Major Questions

- Major: how much queue state belongs in `Command Center Surface` versus lighter status cues in `Writing Surface`, `Companion`, or startup/resume contexts?
- Jason decision candidate: should early async support focus on bounded local preparation and review-ready jobs only, or also include deferred multi-stage hybrid jobs that cross local and API steps?

### Minor Questions

- Minor: what user-facing vocabulary best distinguishes queue, task, run, scheduled work, blocked work, retry, and review-ready result states?

### Answered / Superseded Questions

- No silent paid API spend.
- Async jobs must not silently perform paid, outbound, destructive, truth-mutating, protected-content, or export/sync/publish actions.
- Direct writing must remain available even when queued work is blocked or failing.
- Questions better owned elsewhere: exact degraded execution fallback belongs partly to `service_health_offline_degraded_mode.md`, and exact evidence/verification claims belong primarily to `testing_harness_evidence_contract.md`.

### Deferred Questions

- Deferred: exact worker topology, scheduling fairness, and scaling behavior.

## 34. Acceptance Criteria

This dossier is acceptable only if background work remains bounded, reviewable, and governed.
