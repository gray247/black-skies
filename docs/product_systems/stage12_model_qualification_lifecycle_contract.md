# Stage 12 Architecture Readiness Contract
## Family 12 - Model Qualification and Lifecycle

## 1. Scope and distinctions
This contract governs model identity, capability classification, task-specific qualification, lifecycle state, regression, dequalification, retirement, replacement, local-model artifact change, provider-model drift, substitution, fallback, and evidence.

Keep distinct:
- model identity
- provider identity
- local model
- remote model
- model family
- exact version
- build or quantization
- endpoint or deployment
- capability claim
- evaluation result
- qualification decision
- task eligibility
- route eligibility
- approval
- availability
- quality
- safety
- cost
- lifecycle state
- accepted project truth

Availability is not qualification. Provider listing is not capability proof. One successful task is not general qualification. Hardware compatibility is not task qualification. Lower cost is not qualification. Model output does not become project truth without explicit author acceptance.

## 2. Ownership
Named owners:
- model-identity authority
- capability-matrix owner
- task-qualification owner
- evaluation-policy owner
- model-lifecycle owner
- substitution and fallback owner
- dequalification owner
- retirement and replacement owner
- local-model artifact owner
- requalification owner
- evidence owner

Preservation rules:
- author authority over project truth remains unchanged
- systems own routing, task, and qualification workflows
- models do not own task routing
- models do not own tools or systems
- providers may report model availability or capability but do not define Black Skies qualification truth
- queue state, cache state, saved workflow state, or lower cost cannot override model refusal

## 3. Model identity
Model identity is defined by:
- provider or local runner
- model family
- exact version
- endpoint or deployment where relevant
- local artifact identity where relevant
- build or quantization where relevant
- declared capacity
- tool or function capability where relevant
- policy or moderation profile where relevant
- release or effective date
- wrapper identity
- prompt or task-contract identity
- route identity
- qualification evidence source
- qualification state
- lifecycle state
- uncertainty state

Display name, alias, marketing label, "latest", remembered model name, nearby configuration, or matching filename are insufficient identity.

Mutable aliases cannot serve as stable qualification identity. Alias movement requires identity resolution and requalification before affected use can continue.

Local model identity must include artifact identity, exact build or quantization where relevant, runner/runtime identity, device and installation binding, storage/install context, integrity status where available, and drift or corruption state.

This contract does not choose a model format, checksum scheme, model runner, provider API, evaluation harness, database, schema, or UI.

## 4. AI Model Capability Matrix
Each model and task class must have an AI Model Capability Matrix before it can be claimed qualified for that task class.

The matrix must define:
- task category
- input and output form
- context needs
- structural-reasoning requirements
- extraction or classification requirements
- drafting or rewrite requirements
- critique or analysis requirements
- tool use where relevant
- protected-content constraints
- local hardware requirements where relevant
- cost and latency profile
- evidence level
- qualification status
- failure modes
- requalification triggers

Models perform tasks. They do not own tools, systems, workflows, project truth, or task contracts.

## 5. Task-contract qualification
Qualification is task-specific and must bind to:
- task-contract identity
- required capability
- allowed output type
- truth-mutation prohibition
- protected-content class
- context or payload demand
- latency tolerance
- cost tolerance
- hardware demand
- provider-policy requirement
- wrapper and prompt identity
- package or payload class
- evidence threshold
- currentness rule

No global "qualified model" status exists without stated scope. A model qualified for one task, route, wrapper, package shape, protected-content class, context size, cost posture, hardware mode, or output type is not qualified for a materially different one without evidence.

Qualification does not authorize implementation, release, transmission, or project-truth mutation by itself.

## 6. Evaluation evidence
Keep distinct:
- provider documentation
- provider-reported evidence
- user-reported evidence
- local inspection
- fixture result
- benchmark result
- synthetic evaluation
- project-representative evaluation
- adversarial evaluation
- sustained-use evaluation
- packaged-application evidence
- hardware/runtime evidence
- qualification decision

Evidence strength must match claim strength. Fixture success proves only its fixture and lane. Benchmark success does not prove product suitability. Provider documentation is not independent verification. Development evidence is not packaged evidence. Narrow evaluation is not broad qualification. Passing evaluation alone does not grant route authority.

No evidence class may be silently promoted into broader workload safety, packaged behavior, release readiness, broad production qualification, unrelated task qualification, or current eligibility without sufficient evidence.

## 7. Qualification states
Architecture-level states:
- unassessed
- assessment pending
- provisionally qualified
- qualified for stated task
- conditionally qualified
- restricted
- degraded
- temporarily unavailable
- stale qualification
- requalification required
- dequalified
- retired
- unsupported
- unknown
- refused

These are governance states only. They do not define implementation machinery.

## 8. Requalification triggers
Requalification is required after:
- model version change
- alias movement
- endpoint or deployment change
- build or quantization change
- context-window change
- tool-capability change
- moderation or policy change
- provider-policy drift
- task-contract change
- wrapper or prompt change
- package or payload change
- hidden-context change
- hardware or runtime change
- cost-profile change
- quality or safety regression
- protected-content requirement change
- local artifact movement, corruption, deletion, replacement, or repair
- stale evidence
- conflicting evidence
- unexplained behavior change

Material change invalidates affected qualification until revalidated. Unknown drift remains visibly unknown.

## 9. Substitution and fallback
Keep distinct:
- equivalent substitution
- non-equivalent substitution
- local-to-local substitution
- remote-to-remote substitution
- local-to-remote substitution
- remote-to-local substitution
- provider substitution
- version substitution
- emergency unavailability handling

Substitution or fallback requires:
- explicit substitute model identity
- stated substitution class
- stated reason for fallback
- task-specific qualification evidence
- approval and permission revalidation
- package/payload compatibility
- provider-policy compatibility
- cost and budget revalidation
- hardware qualification where relevant
- protected-content eligibility
- visible status

No silent substitution, downgrade, escalation, provider change, endpoint change, model-family change, local-to-remote escalation, or remote-to-local replacement is permitted.

## 10. Lifecycle and retirement
Lifecycle coverage includes:
- introduction
- assessment
- qualification
- restricted use
- active use
- monitoring
- stale qualification
- dequalification
- retirement
- replacement
- archival record
- emergency suspension

Retired or dequalified models cannot remain silently routable. Historical qualification is evidence, not current authority.

Retirement or unavailability must invalidate affected saved workflows, queued jobs, cached assumptions, reusable approvals, cost estimates, package/payload plans, evidence claims, and release-readiness claims until replacement or fallback is separately qualified and approved where required.

## 11. Regression and dequalification
Regression and dequalification triggers include:
- quality regression
- structural-reasoning regression
- hallucination increase
- extraction or classification failure
- instruction-following regression
- protected-content regression
- context-loss regression
- tool-use regression
- latency or resource regression
- cost regression
- provider-policy conflict
- unexplained behavior change

Dequalification must propagate to:
- routing eligibility
- saved approvals where applicable
- queued jobs
- cached packages
- retries
- fallback eligibility
- evidence status

Regression evidence remains scoped to the observed task, lane, and environment until confirmed more broadly.

## 12. Local-model qualification
Local-model qualification must cover:
- exact model, build, and quantization
- runner/runtime identity
- device and installation binding
- hardware qualification
- workload-specific evaluation
- sustained-load behavior
- memory and resource behavior
- output quality
- task-contract fit
- protected-content posture
- restart and reload behavior
- local artifact drift, corruption, replacement, or removal posture

Qualification does not silently transfer across devices, runners, builds, quantizations, installations, portable copies, or materially changed environments.

Local execution refusal does not silently authorize remote API escalation. Remote fallback requires approval, provider-policy, package, cost, protected-content, and evidence checks.

## 13. Remote-model qualification
Remote-model qualification must cover:
- provider
- endpoint or deployment
- model/version
- mutable alias status
- policy state
- account, tier, or region where relevant
- context and tool capability
- retention/deletion posture
- protected-content eligibility
- cost profile
- availability evidence
- task-specific evaluation

Provider-reported capability remains provider-reported unless independently verified. Mutable aliases require revalidation when the underlying model, endpoint, capability, policy, or behavior may have changed.

## 14. Failure and refusal
Fail closed for:
- unknown model identity
- unresolved mutable alias
- stale qualification
- missing task-contract identity
- weak evidence
- provider-policy uncertainty
- hardware mismatch
- protected-content uncertainty
- unqualified substitution
- unexplained regression
- conflicting evidence
- missing required evidence
- local artifact corruption or removal
- retired or dequalified model reuse
- attempted downgrade or escalation without qualification

No silent:
- routing
- substitution
- downgrade
- escalation
- qualification inheritance
- evidence promotion
- alias assumption
- approval inheritance
- queue resume
- cached-assumption survival
- retired-model reuse
- accepted-truth mutation

## 15. Evidence and verification
Evidence must cover:
- model identity
- task-contract identity
- qualification decision
- capability claim
- evaluation fixture and lane
- hardware/runtime binding
- provider-policy state
- cost profile
- protected-content status
- substitution
- regression
- dequalification
- retirement
- uncertainty

Keep distinct:
- capability claim
- evaluation result
- qualification decision
- current eligibility

Provider-reported evidence remains provider-reported. User-reported evidence remains user-reported. Passing evaluation alone does not grant route authority.

Historical, harness, fixture, stub, development, benchmark, provider documentation, or narrow-task evidence must not be promoted into current packaged behavior, release readiness, broad production qualification, current eligibility, or unrelated task qualification without sufficient evidence.

## 16. Cross-system boundaries
Bounded relationships:
- hardware/resource pressure
- provider-policy assurance
- package/payload identity
- approval persistence and revocation
- queue attempts and retries
- cost accounting
- telemetry/cache
- evidence retention
- deployment and multi-install ownership
- Command Center
- Writing Surface
- Companion
- task-contract-owning systems

Preserve:
- Command Center may manage model visibility, status, and controls
- Writing Surface receives necessary status and warnings only
- Companion does not own qualification
- task-owning systems define required capabilities
- models do not own tools
- qualification does not authorize truth mutation
- Family 12 does not authorize implementation or release

## 17. Author-policy separation
Likely policy choices:
- supported-model breadth
- local or remote preference
- minimum evaluation depth
- requalification cadence
- provisional qualification breadth
- allowed substitution classes
- cost and latency tolerances
- protected-content provider classes
- warning depth
- retirement grace period
- qualification-history visibility
- archived qualification evidence depth

Safety floors remain mandatory.

## 18. Proof and reopening
Later proof obligations and reopening triggers include:
- alias movement without requalification
- provider listing treated as qualification
- benchmark overclaim
- hardware compatibility treated as task qualification
- silent substitution or downgrade
- local refusal causing unapproved remote escalation
- retired or dequalified model remaining routable
- stale qualification use
- wrong-device local qualification reuse
- regression not propagating to queue or routing
- provider-reported capability shown as verified
- model output silently becoming truth
- evidence weaker than the qualification claim
- model name treated as complete identity
- historical qualification treated as current
- protected content sent under invalid model assumptions

## 19. Contract verdict
Family 12 is structurally resolved for Stage 12 scope.

All twelve Stage 12 contract families now have controlling architecture records drafted or committed for review posture.

Stage 12 integration and closure remain required.
Implementation remains blocked.
Release remains unauthorized.
