# Workflow Proof WP-06 - AI Job Through Route, Package, Queue, Fallback, Mode Transition, and Destination Acceptance

## Status

Status: Passed with Bounded Follow-up
- Draft complete
- Official result recorded
- Bounded follow-up routed to Stage 9 and Stage 10

## Author Goal

Show that AI-assisted work can move through route selection, package preparation, queueing, fallback, and destination acceptance without collapsing route approval, package approval, queue state, execution state, or acceptance into one universal workflow state.

## Scope

This proof covers WP-06 plus the folded concerns from WP-07, WP-08, and the Stage 6 workflow-boundary portion of WP-12.
It proves the boundary between task request, route, package, execution, refusal, fallback, rerun, comparison, and acceptance.
It does not prove Stage 10 model qualification, retirement monitoring, migration fixtures, or operational replacement reliability.

## Preconditions

- The author has a task that may be assisted by AI or non-AI execution.
- The initiating surface can expose route choice, package disclosure, and acceptance controls.
- Author approval rules are visible before any external transmission.
- Source material, exclusions, and currentness can be identified.

## Initiating Actor and Surface

- Initiating actor: author
- Initiating surface: Writing Surface, with route and task visibility possibly surfaced in Command Center Surface

## Participating Systems

- AI Lifecycle And Approval Matrix
- Authorship Provenance / AI Visibility
- Model Routing And Budget Architecture
- LLM Package Construction Architecture
- Async Job Queue / Task Runner
- Service Health / Offline / Degraded Mode
- Explicit Content Architecture
- Draft Generation / Rewrite Loop
- Narrative Insertion / Narrative Assertion
- Project Persistence / Local Save
- Writing Surface
- Command Center Surface

## Source Owner

- AI route governance and package-owning systems, with task-specific source owners preserved per route

## Destination Owner

- Narrative Insertion / Narrative Assertion for accepted manuscript text; otherwise the routed task owner remains responsible for non-accepted outcomes

## Objects Read

- author task request
- source material selected for the package
- source exclusions
- route recommendations
- privacy and transmission disclosures
- provider and model status
- budget state
- queue state
- result state
- prior accepted material and provenance

## Objects Created

- route request or recommendation
- package preview or package
- queue entry or execution record
- partial result, completed result, refusal, failure, cancellation, stale marker, or fallback record as applicable
- acceptance record only if the destination owner explicitly accepts material

## Objects Transformed or Routed

- task request routed to route selection
- package routed to the selected execution path
- result routed to the destination owner
- accepted text routed through Narrative Insertion / Narrative Assertion
- previous result provenance preserved across reruns or model changes

## Required Distinctions

- author task request
- task owner
- destination owner
- package preparation
- package contents
- route recommendation
- route approval
- external-transmission approval
- privacy disclosure
- cost or budget decision
- queue state
- execution state
- partial result
- completed result
- refused result
- failed result
- cancelled result
- stale result
- destination acceptance
- accepted manuscript truth

## Failure Classes to Keep Distinct

- provider refusal
- application or service failure
- route unavailable
- package limitation
- context-size limitation
- budget block
- cancellation
- stale result
- model retirement or substitution
- manuscript or task-quality finding

## Path Matrix

| Path | State before | Actor | Owner responsible | Action | Object produced or changed | Truth mutation | Approval required | Author-visible result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Author requests AI-assisted task | No AI job exists | Author | Task owner | Request assistance | Task request record | No | No | Assistance path opens |
| 2. Task owner identifies destination workflow | Request visible | Task owner | Destination owner | Select the owning workflow | Destination routing decision | No | No | Destination owner visible |
| 3. Package is prepared from authorized sources | Source set known | Package owner | Package-owning system | Assemble package | Package preview or package | No | No | Included and excluded material visible |
| 4. Package sources and exclusions remain visible | Package prepared | System | Authorship Provenance / AI Visibility | Show source scope and exclusions | Provenance view | No | No | Hidden inputs do not disappear |
| 5. Route is recommended | Package prepared | Routing system | Model Routing And Budget Architecture | Recommend route | Route recommendation | No | No | Candidate routes visible |
| 6. Privacy, transmission, provider, model, cost, and retention are disclosed | Route visible | System | Routing and package governance | Show route terms | Disclosure record | No | No | Author sees route consequences |
| 7. Author approves or rejects an external route | External route offered | Author | Route approval owner | Approve or reject transmission | Approved or rejected route | No until accept route; yes if later accepted text | Yes | Route either opens or stays closed |
| 8. No-AI continuation | AI optional; route not chosen | Author | Writing Surface | Continue directly | Manual manuscript work | No | No | Writing continues without AI |
| 9. Deterministic or non-model continuation where supported | Non-model path available | Author | Destination owner or task owner | Use non-model support | Manual or deterministic result | No | No | Work continues without model dependence |
| 10. Local-AI route | Local route available | Author | Local route owner | Select local AI | Local execution record | No | Yes if route approval is needed | Local route status visible |
| 11. Cloud/API route | Cloud route available | Author | Cloud route owner | Select cloud API route | Cloud execution record | No | Yes, external route approval | Provider and cost stay visible |
| 12. Route queues or executes | Route approved | System | Async Job Queue / Task Runner | Queue or start job | Queue entry or run state | No | No | Job visible as queued or running |
| 13. Successful complete result | Job completes | System | Task owner | Return completed output | Completed result | No | No | Completion is visible, not accepted yet |
| 14. Partial result | Job partially completes | System | Task owner | Return partial output | Partial result | No | No | Partial output remains visible |
| 15. Provider refusal | Request or route blocked by provider | Provider or system | Route governance | Refuse the task | Refusal record | No | No | Refusal is visible and distinct |
| 16. Application or service failure | Service breaks or errors | System | Service Health / Offline / Degraded Mode | Fail the run | Failure record | No | No | Failure is visible and not acceptance |
| 17. Budget block | Budget or spend cap blocks | System | Model Routing And Budget Architecture | Block spend or route | Budget-block record | No | Yes if policy requires route change | Budget block is distinct from refusal |
| 18. Package or context limitation | Input exceeds safe or allowed scope | System | Package-owning system | Limit package | Limited package or rejection | No | No | Limitation is visible |
| 19. Author cancellation before execution | Job not yet running or still queued | Author | Task owner | Cancel request | Cancellation record | No | No | Request stops cleanly |
| 20. Cancellation after partial output | Partial output exists | Author | Task owner | Cancel after partial output | Cancellation plus partial result | No | No | Partial output stays visible |
| 21. Route becomes unavailable | Route had been available | System | Route owner | Mark route unavailable | Unavailable-route record | No | No | Fallback may be offered |
| 22. Approved fallback to another route | Primary route unavailable | Author | Route governance | Approve fallback | New route selection | No | Yes, if route changes | Fallback is explicit |
| 23. Rejected fallback | Fallback offered | Author | Route governance | Decline alternate route | No new route | No | No | Work pauses or stays pending |
| 24. Stale result after source changes | Source changed after run | System | Task owner | Mark result stale | Stale-result marker | No | No | Staleness is visible |
| 25. Rerun using the same route | Stale or partial result visible | Author | Route owner | Rerun on same route | New run record | No | Yes if route policy requires | New run compares to old |
| 26. Rerun using a different approved route | Approved route switch | Author | Route governance | Change route and rerun | New route run record | No | Yes, new route approval | Route change is visible |
| 27. Provider or model replacement | Prior result exists | System | Route and model governance | Replace provider or model | Replacement record | No | Yes if route approval changes | Prior material remains intact |
| 28. Comparison between old and new results | Prior and new results exist | Author | Task owner | Compare results | Comparison view or note | No | No | Differences remain visible |
| 29. Destination owner accepts all, part, edited material, or none | Result visible | Author | Destination owner | Accept some or all, edit, or reject | Accepted text or no acceptance | Yes, explicit acceptance | Acceptance is owner-controlled |
| 30. Completed result remains unaccepted | Job finished but not accepted | Author | Destination owner | Leave result unaccepted | No acceptance record | No | No | Completion is not truth |
| 31. Previously accepted material remains intact when a model changes | Accepted text exists | System | Narrative Insertion / Narrative Assertion | Preserve prior accepted text | Prior accepted truth remains | No | No | Earlier accepted material stays visible |

## Must Prove

- Job completion is not destination acceptance.
- Route approval is not package approval.
- Package approval is not destination acceptance.
- Queue state is not destination lifecycle state.
- No provider, model, or transmission route changes silently.
- External transmission changes require visible approval.
- No-AI, local-AI, and cloud/API-AI remain distinct routes, not universal project modes.
- Switching routes does not mutate project truth.
- Previously accepted material remains available when AI is unavailable.
- A replacement model does not invalidate or overwrite earlier accepted material.
- Prior results and provenance remain visible.
- Partial output is not presented as complete.
- Cancellation does not become rejection unless the destination owner defines that result.
- Refusal is not application failure, budget block, or manuscript defect.
- Models perform tasks but own no workflow, tool, or destination object.
- The destination owner controls any acceptance and mutation.
- Narrative Insertion / Narrative Assertion remains the smallest accepted manuscript-truth object.
- Ordinary writing, Notes, Signals, search, history, and export remain available without AI.

## Provenance Checkpoints

- source material included in the package
- source material excluded
- route and model used
- provider or local execution
- package version or source-currentness concept without choosing a schema
- result time and source state
- fallback or substitution
- author edits before acceptance
- accepted and rejected portions
- preservation of previous result provenance

## Privacy Or Transmission Checkpoints

- visible route disclosure before any external transmission
- explicit approval for external transmission changes
- provider and model disclosure where a route leaves local execution
- cost disclosure before spend-bearing routes
- retention or package handling disclosure where applicable
- no silent fallback to another provider or model

## Approval Checkpoints

- task request approval, if the owner requires it
- external route approval before any non-local transmission
- package approval before outbound use where policy requires it
- destination-owner acceptance before manuscript mutation
- fallback approval before alternate routing
- route-change approval when switching providers or models

## Mutation Checkpoints

- route selection does not mutate manuscript truth
- package preparation does not mutate manuscript truth
- queue state does not mutate manuscript truth
- completed result does not mutate manuscript truth
- only destination-owner acceptance mutates accepted manuscript text
- model replacement does not overwrite prior accepted text

## Author-Visible State

- request state
- route recommendation and approval state
- package contents and exclusions
- queue or execution state
- partial, completed, refused, failed, cancelled, and stale results
- fallback offers and route-change visibility
- prior result provenance
- acceptance or non-acceptance at the destination owner

## Forbidden Shortcuts

- No silent fallback.
- No silent provider substitution.
- No silent model substitution.
- No package approval shortcut into acceptance.
- No queue-complete shortcut into truth.
- No refusal-to-failure conflation.
- No model-change overwrite of accepted text.
- No universal route, job, completion, or failure owner.

## Unresolved Questions

- How much route and cost detail should be shown by default?
- How much comparison history should accompany reruns?
- Which fallback choices are offered automatically versus only on request?

## Stage 9 Deferrals

- Route label presentation.
- Simple versus advanced cost display.
- Queue and result presentation.
- Fallback warning density.
- Partial-result presentation.
- Provenance display at decision time.

## Stage 10 Deferrals

- Model qualification.
- Task fixtures.
- Provider-policy monitoring.
- Model retirement monitoring.
- Migration reliability.
- Hardware qualification.
- Cost accounting.
- Operational retry and failure reliability.
- Exact package and route implementation.

## What This Proof Explicitly Does Not Prove

- It does not prove the best AI-route UI.
- It does not prove package schemas or transport formats.
- It does not prove operational reliability under every model or provider.
- It does not prove every route is always available.

## Completion-Criteria Assessment

The workflow boundary is well defined if:

- route approval stays separate from package approval,
- package approval stays separate from destination acceptance,
- completion is not mistaken for acceptance,
- refusal and failure remain distinct,
- route changes stay visible,
- prior accepted text survives model changes,
- provenance survives reruns and fallbacks.

## Official Result

Passed with Bounded Follow-up.
The ownership and mutation boundary is proved, bounded follow-up remains routed to Stage 9 for route and model labels, privacy and transmission disclosure presentation, simple versus advanced cost presentation, queue and execution-state presentation, fallback warnings, partial-result presentation, stale-result presentation, provenance visibility at decision time, and the distinction among route approval, package approval, and destination acceptance, and to Stage 10 for task-specific model qualification, task fixtures, provider-policy monitoring, retention-policy monitoring, model-retirement monitoring, migration and replacement reliability, hardware qualification, exact cost accounting, retry and operational failure reliability, exact package and route implementation, and operational comparison of replacement-model results.
