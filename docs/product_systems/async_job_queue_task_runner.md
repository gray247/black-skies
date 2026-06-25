# Async Job Queue / Task Runner

## 1. Status Header

- Dossier name: `Async Job Queue / Task Runner`
- Status: `drafted`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-24`
- Depends on: `Model Routing And Budget Architecture`, `Companion`, `Memory Lab`
- Feeds into: background-capable systems
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `partial`
- Hidden/background: `yes`

## 2. Purpose

Define the job queue and task runner that support bounded background work without allowing silent paid, outbound, destructive, or truth-mutating actions.
This first-safe scope covers local, advisory, protection-safe, project-bound, reviewable jobs only.
This dossier inherits routing, approval, protection, provenance, and degraded-mode boundaries from `truth_and_state_ownership_matrix.md`, `surface_to_owner_action_handoff_contract.md`, `ai_lifecycle_and_approval_matrix.md`, `protected_content_permission_matrix.md`, `provenance_state_model.md`, `degraded_mode_execution_contract.md`, and `snapshot_protected_recovery_contract.md`.

## 3. User Problem Solved

The writer needs heavier work to be schedulable or deferrable without background execution outrunning approvals, privacy, or writing flow.

## 4. What The System Does

- coordinate allowed background execution,
- queue approved local advisory jobs,
- defer bounded work until safe conditions exist,
- report queue and run state,
- preserve bounded run history and revalidation posture,
- surface reviewable advisory results without silently converting them.

## 5. What The System Does Not Do

- own manuscript truth,
- own accepted project truth,
- own `Notes`,
- own `Signals`,
- own `Memory Lab` retention,
- own critique authority,
- own destination acceptance,
- silently spend money,
- silently send protected content,
- silently mutate truth or manuscript state,
- silently continue risky work after restart, project change, or failed revalidation,
- silently convert queued output into durable accepted state.

## 6. User-Facing Behavior

Visible behavior should emphasize queued state, approvals, blocked conditions, and reviewable advisory results.
The queue should feel governed rather than ambient or autonomous.

## 7. Hidden/Background Behavior

Background execution is the core role, but it remains bounded by approvals and owning-system contracts.
Safe local work may wait, run, resume after revalidation, or return stale warnings without interrupting ordinary writing.

## 8. What Appears First

- relevant job state,
- current blocker or failure state,
- review-required outputs when available.

## 9. What Is Summonable

- deeper job history,
- queue detail,
- execution diagnostics,
- stale or superseded explanation,
- provenance and limitation detail.

## 10. What Is Hidden Until Needed

- low-level runner detail,
- dense execution history,
- implementation-heavy telemetry.

## 11. Inputs

- approved local advisory tasks,
- current project identity,
- source scope and source revision,
- routing and execution-class state,
- privacy, masking, and protection state,
- author approvals and approval references,
- restart or recovery posture when relevant.

## 12. Outputs

- queued job state,
- reviewable advisory job results,
- partial advisory artifacts,
- failure, blocked, stale, superseded, or approval-needed state,
- bounded provenance and limitation records.

## 13. Which Other Systems Consume Those Outputs

- background-capable systems
- `Command Center Surface`
- `Companion`

## 14. What Gets Stored

- queue state,
- execution records,
- approval references,
- bounded job history,
- stale and superseded status,
- bounded result provenance.

## 15. What Remains Temporary

- transient worker state,
- intermediate job artifacts,
- in-flight results before review,
- temporary partial artifacts that are never accepted automatically.

## 16. Relationship To Narrative Insertion / Assertion

The task runner may support systems around narrative work, but it does not own or mutate truth by itself.

## 17. Relationship To Story Units

Story Units may scope jobs optionally.

## 18. Relationship To Prose / Scene Projection

Projection tasks may be queued, but queued projection work remains non-authoritative.

## 19. Relationship To Writing Surface

The `Writing Surface` remains available while queued work runs, fails, blocks, or waits for approval.
It should show only light, nonblocking queue status when relevant.
The queue must not turn the Writing Surface into a background-job console.

## 20. Relationship To Command Center Surface

`Command Center Surface` is the home for queue management, approval review, blocked and failed state, retry and cancel actions, partial-result review, and stale or superseded explanation.
Visibility there does not grant ownership of results or destination acceptance.

## 21. GUI Placement Principles

Keep queue state visible when relevant, not always-on clutter.
Queue visibility should become heavier only in `Command Center Surface`.

## 22. Local LLM Role

Local-model jobs are within the first-safe scope only when they remain local, advisory, protection-safe, project-bound, and reviewable.
Local execution remains subject to approval, routing, degraded-mode, and provenance rules.

## 23. Paid API Role

Paid API, outbound, and hybrid jobs are deferred.
They are not part of the first-safe Category-4 scope for this dossier.

## 24. Model Routing Notes And Cost / Budget Impact

All queued AI work must obey routing, approval, spend, and fallback rules.
Within the first-safe scope, queued execution is limited to local advisory work only.
The queue must not silently widen a local-safe job into a paid, outbound, or hybrid route.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Queued work must not bypass masking, package, or explicit-content boundaries.
If a safe local advisory job later no longer satisfies the required protection posture, it must block, cancel, or remain parked rather than continue.

## 26. Privacy / Safety / Censor Behavior, If Applicable

No background job may bypass masks or exclusion zones.
Protected content must not leak through results, logs, previews, or queue history.

## 27. Ownership And Non-Ownership

The queue may own:

- execution coordination,
- queue state,
- run status,
- approval references,
- bounded run history,
- stale and superseded status.

The queue must not own:

- manuscript truth,
- accepted project truth,
- `Notes`,
- `Signals`,
- `Memory Lab` retention,
- critique authority,
- destination acceptance.

Destination systems own durable conversion and acceptance.
Queue review does not become destination-owner review by implication.

## 28. First-Safe Execution Scope

The first-safe scope allows only jobs that are:

- local,
- advisory,
- protection-safe,
- project-bound,
- reviewable.

The first-safe scope does not define:

- paid execution,
- outbound execution,
- API execution,
- hybrid local-plus-API execution,
- autonomous multi-stage orchestration.

## 29. Minimum Lifecycle

The minimum queue lifecycle is:

- `approval required`
- `queued`
- `blocked`
- `running`
- `completed, review required`
- `partial, review required`
- `failed`
- `cancelled`
- `stale`
- `superseded`

This dossier intentionally avoids richer queue-state vocabulary until later planning.
The queue should stay explicit enough to govern behavior without turning into a taxonomy project.

## 30. Revalidation

Queued work must be revalidated when relevant conditions change, including:

- source revision,
- source scope,
- project identity,
- protection or masking state,
- route or execution class,
- requested action,
- approval scope,
- restart or recovery posture.

A job must not resume merely because it existed before restart.
If revalidation fails, the job must cancel, park, or remain blocked instead of silently continuing.

## 31. Restart And Project Boundaries

Safe local advisory jobs may survive restart only when revalidation passes.

Jobs remain tied to their original project.
They must not silently migrate across project boundaries, adopt a different source project, or continue after unsafe project-context change.

On project close, deletion, unsafe context change, or failed revalidation, jobs must cancel, park, or remain blocked rather than silently continue.
Returned results based on older revisions must be marked `stale` or `superseded`.

## 32. Retry And Cancellation

Automatic retry is allowed only for narrowly safe local advisory jobs where:

- no spend occurred,
- no outbound transfer occurred,
- no durable mutation occurred,
- source and approval conditions still match,
- protection posture still matches.

All other retries require explicit review.
Cancellation must not hide partial results, side effects, or failure context.
Cancelled work that already produced bounded output may still surface that output as partial advisory material with explicit warnings.

## 33. Partial Results

Partial results may remain visible only as clearly labeled advisory artifacts.
They must identify:

- incomplete scope,
- source revision,
- completed portion,
- missing portion,
- limitations,
- failure or cancellation cause when known.

Partial artifacts do not become accepted truth, durable notes, durable signals, or durable memory by virtue of being visible.

## 34. Surface Posture

### Writing Surface

- light status only,
- nonblocking,
- ordinary writing remains available.

### Command Center Surface

- queue list,
- approvals,
- blocked and failed jobs,
- retry and cancel,
- partial-result review,
- stale and superseded status,
- provenance and limitations.

### Companion

`Companion` may explain queue state, result status, fallback, and limitations.
It does not own scheduling, approval, or results.

## 35. Protection And Provenance

Execution must remain protection-aware.
No protected-content leakage may occur through results, logs, previews, or history.

The queue should preserve bounded provenance for:

- job identity,
- project identity,
- source scope,
- source revision,
- execution method,
- execution route,
- relevant timestamps,
- limitations.

Provenance remains evidence, not truth authority.

## 36. Testing Requirements

Prove:

- blocked tasks stay blocked,
- reviewed findings do not auto-apply,
- restart revalidation is required before job continuation,
- stale or superseded results are labeled honestly,
- partial results remain visibly incomplete,
- protected-content boundaries survive queueing, failure, cancellation, restart, and history review.

## 37. Governance Rules And Risks

Governance rules:

- no silent paid or outbound work,
- no silent truth mutation,
- no hidden bypass of masks or approvals,
- no silent project-crossing execution,
- no silent background continuation after restart without revalidation,
- no silent conversion of queue results into durable owner state.

Risks:

- stale results presented as current,
- hidden queue continuation after project or revision drift,
- partial-result overclaiming,
- queue history leaking protected material,
- local-safe posture silently widening into a riskier route.

## 38. Failure Modes

If the queue fails, direct writing and manual actions remain available.
If a queued result becomes stale, the queue must say so instead of presenting it as current.
If approval, source, project, or protection posture changes, the queue must block, cancel, or park work rather than quietly proceeding.

## 39. v1 Boundary

Basic queued-state handling for approved local advisory jobs with explicit review, revalidation, stale handling, and bounded restart survival.

## 40. v2 Boundary

Richer local deferred and scheduled workflows with clearer review paths and better project-facing status explanation.

## 41. Future-Only Boundary

Broad autonomous orchestration, API jobs, outbound jobs, paid jobs, hybrid jobs, and richer queue-state language.

## 42. Deferrals

- Deferred: API and hybrid jobs.
  - Why deferred: they introduce approval, spend, outbound, and partial-side-effect complexity beyond the first-safe local scope.
  - Resolution stage: `Cross-System Workflow Proofs`
  - Reopening trigger: when the repository is ready to define end-to-end approved multi-stage execution without violating route, package, protection, or approval doctrine.
- Deferred: richer queue-state vocabulary.
  - Why deferred: the current dossier needs a compact lifecycle more than a dense state taxonomy.
  - Resolution stage: `Vertical Slice Plan`
  - Reopening trigger: when a concrete first-slice workflow needs tighter user-facing wording or state distinctions than the compact lifecycle can support.
- Deferred: worker topology.
  - Why deferred: depends on final execution boundaries, reliability requirements, and deployment assumptions.
  - Resolution stage: `Architecture Readiness Contract`
  - Reopening trigger: when architecture readiness must define required execution roles and isolation boundaries.
- Deferred: scheduling fairness.
  - Why deferred: depends on workload classes, priority rules, cancellation expectations, and resource limits.
  - Resolution stage: `Architecture Readiness Contract`
  - Reopening trigger: when readiness must define minimum queue behavior under competing jobs.
- Deferred: scaling strategy.
  - Why deferred: depends on validated workload, hardware limits, concurrency expectations, and version-one scope.
  - Resolution stage: `Architecture Readiness Contract`
  - Reopening trigger: when readiness must state the minimum supported workload and concurrency posture.
- Deferred: background-service architecture.
  - Why deferred: depends on restart, persistence, recovery, process-isolation, and desktop-runtime requirements.
  - Resolution stage: `Architecture Readiness Contract`
  - Reopening trigger: when readiness must define whether background execution requires a distinct service or process boundary.
- Deferred: storage implementation.
  - Why deferred: depends on queue lifecycle, recovery requirements, history retention, project isolation, and persistence boundaries.
  - Resolution stage: `Architecture Readiness Contract`
  - Reopening trigger: when readiness must define persistence requirements before the `Vertical Slice Plan` selects a bounded implementation.

## 43. Acceptance Criteria

This dossier is acceptable only if background work remains bounded, reviewable, and governed.
Category 4 for this dossier means ownership, lifecycle, revalidation, restart, result, and surface behavior are coherent for the first-safe local advisory scope.
It does not authorize implementation, API execution, hybrid jobs, or post-Category-4 architecture work.
