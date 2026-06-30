# Stage 12 Architecture Readiness Contract
## Family 11 - Hardware Qualification and Resource-Pressure Protection

## 1. Scope and distinctions
This contract governs hardware qualification, resource-pressure detection, workload eligibility, degradation, refusal, recovery, local-model execution, and evidence.

Keep distinct:
- detected hardware
- reported hardware
- qualified hardware
- current available resources
- historical capacity
- minimum requirement
- recommended requirement
- workload eligibility
- model eligibility
- execution permission
- resource warning
- degraded operation
- hard refusal
- runtime failure
- recovery state

Distinguish:
- system RAM
- available RAM
- graphics memory
- shared graphics memory
- CPU capability
- storage capacity
- available storage
- thermal state
- power state
- process pressure
- installation architecture

Hardware detection is not qualification. Qualification is not current availability. Successful launch is not proof of workload safety. Prior success is not proof of current eligibility.

## 2. Ownership
Named owners:
- hardware-qualification authority
- resource-pressure owner
- workload-eligibility owner
- local-model eligibility owner
- degradation-policy owner
- refusal owner
- recovery owner
- evidence owner

Preservation rules:
- systems enforce bounded eligibility policy
- models do not determine their own eligibility
- provider availability does not redefine local safety
- queue state does not override hardware refusal

## 3. Hardware identity
Hardware identity is defined by:
- installation identity
- device identity or bounded device witness
- operating-system architecture
- CPU architecture and relevant capability
- system memory
- graphics capability and memory classification
- storage identity and availability
- execution environment
- power or thermal context where relevant
- detection time
- evidence source
- uncertainty state

Display names, marketing labels, or prior benchmark names are insufficient identity.

Avoid requiring invasive fingerprinting.

## 4. Qualification classes
Architecture-level classes:
- unknown
- unsupported
- minimally qualified
- conditionally qualified
- qualified
- temporarily resource-constrained
- degraded-operation eligible
- workload-specific refusal
- requalification required

Qualification must be workload-specific where resource demands differ.

Do not define exact numerical thresholds unless already canonical.

## 5. Workload identity and eligibility
Workload identity is defined by:
- originating system
- task-contract identity
- model/version where relevant
- execution mode
- estimated memory demand
- estimated compute demand
- storage demand
- duration or sustained-load class
- concurrency expectation
- protection classification
- fallback implications

Eligibility must be evaluated against both qualified capacity and current pressure.

## 6. Resource-pressure detection
Cover:
- memory pressure
- graphics-memory pressure
- CPU saturation
- disk-space pressure
- sustained disk activity
- thermal throttling
- power or battery constraints
- concurrent model/workload pressure
- queue accumulation
- process instability
- operating-system termination risk

Keep distinct:
- predicted pressure
- observed pressure
- critical pressure
- unknown pressure

Do not claim exact state without sufficient evidence.

## 7. Degradation and refusal
Allowed outcomes:
- proceed normally
- proceed with warning
- reduce concurrency
- use smaller qualified local model
- defer workload
- pause queue dispatch
- preserve partial state
- refuse workload
- require explicit route reconsideration

State:
- degradation must remain visible
- substitution requires policy and qualification
- local refusal does not silently authorize API escalation
- remote fallback requires its own approval, provider-policy, package, cost, and protected-content checks

No silent model substitution or execution-mode change.

## 8. Queue and concurrency protection
Define:
- admission control
- workload concurrency boundaries
- queued-versus-running resource claims
- reservation versus actual usage
- restart revalidation
- stale qualification handling
- orphaned resource reservation
- cancellation under pressure
- partial-result retention

A queued job does not reserve indefinite authority to run later. Restart or resume requires current revalidation.

## 9. Failure, interruption, and recovery
Keep distinct:
- workload refused before start
- workload interrupted locally
- operating-system termination
- model process failure
- application process failure
- partial completion
- recoverable retained state
- corrupted or unverifiable state
- recovery attempted
- recovery verified
- recovery failed

Recovery must not silently present partial or corrupted output as complete.

## 10. Installed and portable boundaries
Define:
- installed-instance qualification
- portable-instance qualification
- device move
- changed hardware
- changed driver or runtime environment
- shared local-model installation
- multiple Black Skies installations
- cached qualification

Qualification must not silently transfer to a different device or materially changed environment. Cached qualification requires revalidation.

## 11. Protected-content and privacy posture
Define safeguards when:
- local processing is unavailable
- fallback would leave the device
- diagnostics contain project-sensitive information
- crash artifacts may contain manuscript or hidden context
- resource reports are exported
- provider routing is proposed after local refusal

No protected content may be transmitted merely because local hardware is insufficient.

## 12. Lifecycle
Architecture-level states:
- detection pending
- hardware unknown
- qualification pending
- qualified for stated workload
- conditionally qualified
- pressure warning
- degraded
- dispatch paused
- workload refused
- interruption detected
- retained state available
- recovery pending
- recovery verified
- recovery failed
- requalification required

These are governance states only. They do not define implementation machinery.

## 13. Failure and refusal
Fail closed for:
- unknown hardware identity
- stale qualification
- unknown current resource state
- workload identity mismatch
- model qualification mismatch
- insufficient storage
- unsafe concurrency
- pressure beyond safety floor
- changed device or environment
- unverifiable retained state
- fallback requiring missing approval
- protected-content route uncertainty

No silent:
- model substitution
- API escalation
- concurrency increase
- qualification reuse
- partial-result promotion
- recovery overclaim
- hardware rebinding

## 14. Evidence and verification
Evidence classes:
- detected hardware
- qualification decision
- workload identity
- model identity
- current resource state
- pressure warning
- degradation decision
- refusal decision
- interruption
- retained state
- recovery result
- changed environment
- uncertainty

Distinguish:
- hardware report
- synthetic benchmark
- workload-specific test
- sustained-load test
- packaged-application evidence
- user-reported evidence

A synthetic benchmark does not automatically prove production workload safety.

Packaged-application evidence must not be inferred from development, unit-test, harness, fixture, stub, or unpackaged-runtime evidence.

Evidence strength must match claim strength. A hardware report, synthetic benchmark, user report, development test, or narrow workload test may support only the scope it actually exercised and must not be promoted into broader workload safety, packaged behavior, sustained-load safety, release readiness, or production qualification without sufficient evidence.

## 15. Cross-system boundaries
Bounded relationships:
- deployment and multi-install ownership
- provider-policy assurance
- telemetry/cache
- queue attempt identity
- cost accounting
- evidence retention
- model qualification and lifecycle
- Command Center
- Writing Surface

Preserve:
- Command Center may present qualification details and controls
- Writing Surface receives necessary warnings without becoming a hardware console
- hardware state does not own project truth
- Family 12 retains model-specific qualification authority

Do not pre-solve Family 12.

## 16. Author-policy separation
Likely policy choices:
- supported hardware breadth
- warning thresholds
- degradation breadth
- concurrency limits
- minimum free-storage policy
- battery-operation policy
- local-versus-remote preference
- diagnostic detail
- benchmark depth
- requalification cadence
- recovery presentation

Safety floors remain mandatory.

## 17. Proof and reopening
Later proof obligations and reopening triggers include:
- detected hardware shown as qualified without proof
- stale qualification reused
- workload started under unsafe pressure
- silent local-model substitution
- local refusal causing unapproved API escalation
- portable copy inheriting device qualification
- partial output shown as complete
- recovery claim exceeding evidence
- synthetic benchmark overclaimed
- protected content exposed through diagnostics or fallback
- queue dispatch bypassing resource refusal

## 18. Contract verdict
Family 11 is structurally resolved for Stage 12 scope.

Family 12 remains dependent.

Implementation remains blocked.
Release remains unauthorized.
