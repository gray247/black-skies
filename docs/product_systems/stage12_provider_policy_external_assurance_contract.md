# Stage 12 Architecture Readiness Contract
## Family 6 - Provider-Policy Drift and External Assurance

## 1. Scope and distinctions
This contract governs provider-policy identity, policy drift, external-state uncertainty, retention and deletion assurance, permission invalidation, and claim correction for Stage 12.

Distinct objects and claims:
- provider policy
- provider capability
- provider configuration
- provider-reported state
- locally observed state
- independently verified state
- retention claim
- deletion request
- deletion acknowledgment
- deletion assurance
- model availability
- service availability
- permission
- approval

Provider acknowledgment is not independent verification. Policy wording is not proof of actual deletion or retention behavior. External unknown state remains unknown until it is independently resolved for the stated scope.

## 2. Ownership
Named owners:
- provider-policy authority
- policy-version tracking owner
- provider-assurance owner
- permission-invalidation owner
- deletion/revocation assurance owner
- external-claim correction owner
- evidence owner

Preservation rules:
- author approval remains separate from provider policy
- providers do not own project truth
- provider state does not silently redefine Black Skies doctrine

## 3. Policy identity
Provider policy identity is defined by:
- provider
- policy type
- version or effective date
- jurisdiction or account scope where relevant
- service or product scope
- model or endpoint scope
- retention and deletion terms
- protected-content treatment
- evidence source
- last validation time
- uncertainty state

A policy URL, display label, or cached summary alone is insufficient identity.

## 4. Drift and revalidation
Revalidation is required when any of the following change:
- policy revision
- provider notice
- model retirement or replacement
- endpoint change
- account-tier change
- region or jurisdiction change
- retention or deletion term change
- protected-content handling change
- unknown or stale validation evidence
- conflicting provider statements

Material drift invalidates affected assumptions and permissions.

## 5. Permission and approval invalidation
Provider-policy drift affects:
- route eligibility
- provider eligibility
- model eligibility
- saved approval
- queued work
- cached packages
- transmission authorization
- protected-content eligibility
- retained evidence

No approval or permission may silently survive a materially changed provider policy.

## 6. Retention and deletion assurance
Keep distinct:
- deletion requested
- request accepted
- acknowledgment received
- deletion provider-reported
- deletion independently verified
- deletion unknown
- deletion failed
- retention unknown

Black Skies may only claim the level of assurance supported by the evidence class in hand. It may not promise deletion beyond available evidence.

## 7. External uncertainty and refusal
Fail closed when:
- policy identity is unknown
- material policy is stale
- retention behavior is unclear
- deletion assurance is insufficient
- provider substitution would change scope
- protected-content eligibility cannot be determined
- conflicting provider claims remain unresolved
- required evidence is unavailable

No silent fallback, provider substitution, or optimistic interpretation.

## 8. Claim correction
Claim correction requires:
- stale claim detection
- correction owner
- affected approval invalidation
- queued or cached work disposition
- user-visible correction
- evidence retention
- downstream proof impact

A previously accurate claim must be corrected when later evidence changes its status.

## 9. Lifecycle
Architecture-level states:
- policy unverified
- policy current
- policy stale
- drift detected
- revalidation pending
- permission valid
- permission invalidated
- deletion requested
- deletion acknowledged
- deletion provider-reported
- deletion verified for stated scope
- deletion unknown
- assurance failed
- claim correction required

These are governance states only. They do not define implementation machinery.

## 10. Evidence and verification
Evidence classes:
- provider identity
- policy version or effective state
- account or region scope
- model or endpoint applicability
- retention claim
- deletion request and acknowledgment
- permission invalidation
- claim correction
- external uncertainty

Provider-reported evidence must remain labeled provider-reported. It does not become independent verification by relabeling.

## 11. Downstream handoffs
This contract bounds, but does not solve:
- Telemetry and Generic-Cache Governance
- Queue Attempt Identity
- Cost Accounting
- Evidence Retention
- Model Qualification and Lifecycle
- Hardware and Resource Protection where provider fallback affects routing

## 12. Author-policy separation
Likely policy choices:
- acceptable provider breadth
- revalidation interval
- warning depth
- provider-risk tolerance
- whether protected content may use specific provider classes
- deletion-assurance presentation
- fallback presentation
- provider-policy archive depth

Safety floors remain mandatory.

## 13. Proof and reopening
Later proof obligations:
- stale policy presented as current
- approval surviving material drift
- deletion claim exceeding evidence
- silent provider substitution
- provider-reported state shown as verified
- protected content sent under invalid assumptions
- conflicting policy sources
- missing claim correction

Reopening triggers include:
- missing or conflicting ownership
- policy identity ambiguity
- independently verified state contradicting an earlier claim
- provider-policy drift that invalidates an active approval or permission
- any unresolved claim that changes routing or retention posture

## 14. Contract verdict
Family 6 is structurally resolved for Stage 12 scope.

Remaining dependent families include:
- Telemetry and Generic-Cache Governance
- Queue Attempt Identity, Retry, Cancellation, and Retained State
- Cost Accounting and Budget Persistence
- Evidence Retention and Last-Witness Protection
- Model Qualification and Lifecycle
- Hardware Qualification and Resource-Pressure Protection

Implementation remains blocked.
Release remains unauthorized.
