# Stage 12 Architecture Readiness Contract
## Family 10 - Evidence Retention and Last-Witness Protection

## 1. Scope and distinctions
This contract governs evidence identity, retention, deletion, archival, correction, witness sufficiency, last-witness protection, and uncertainty.

Keep distinct:
- evidence
- evidence reference
- witness
- last necessary witness
- provenance record
- audit record
- diagnostic record
- telemetry
- log
- snapshot
- backup
- archive
- transmission record
- provider acknowledgment
- test result
- release evidence
- accepted project truth

Evidence does not become project truth. Retained evidence does not grant authority. Absence of evidence is not proof of absence. Passing tests are not automatically release evidence. Provider-reported evidence remains provider-reported.

## 2. Ownership
Named owners:
- evidence-governance owner
- evidence-identity authority
- retention-policy owner
- deletion owner
- archival owner
- last-witness protection owner
- evidence-correction owner
- release-evidence owner
- project-boundary verification owner

Preservation rules:
- author owns project truth
- systems own evidence workflows
- providers and models do not own evidence meaning

## 3. Evidence identity
Evidence identity is defined by:
- project identity
- evidence class
- originating system
- source event
- subject identity
- job or attempt identity where relevant
- package or payload identity where relevant
- provider or model identity where relevant
- timestamp or event sequence
- protection classification
- evidence source
- verification level
- retention state
- correction or supersession state

Filename, path, timestamp, display label, or nearby record are insufficient identity.

## 4. Evidence classes and claim strength
Claim levels:
- self-reported
- provider-reported
- locally observed
- independently verified
- cross-checked
- incomplete
- disputed
- superseded
- unknown

Claims must match evidence strength. No evidence class may be silently promoted.

## 5. Retention
Retention treatment applies to:
- approvals
- revocations
- package or payload alignment
- provider-policy validation
- queue attempts
- cancellations
- cost and budget records
- migration or restored-copy identity
- deletion requests
- model qualification
- hardware qualification
- test results
- release claims
- failures and corrections

Retention is bounded by need, policy, and protection obligations. Indefinite retention is not required by default.

## 6. Last-witness protection
Define:
- what qualifies as a last necessary witness
- how it is identified
- who may authorize its deletion
- replacement-witness requirements
- conflict between cleanup and proof needs
- migration and recovery implications
- release-claim implications
- correction-history implications

Cleanup, purge, archive, migration, or uninstall must not destroy the only remaining witness needed to support a material claim.

## 7. Deletion, purge, and archival
Keep distinct:
- deletion requested
- deletion authorized
- deletion attempted
- deletion completed locally
- deletion provider-reported
- deletion independently verified
- deletion failed
- deletion unknown
- archived
- purged
- witness retained

Define what may still be claimed at each state. Archive is not deletion. Purge is not verified external deletion.

## 8. Correction, supersession, and dispute
Define:
- incorrect evidence correction
- superseding evidence
- disputed evidence
- conflicting witnesses
- stale evidence
- retracted claim
- corrected claim
- retained correction history

Corrections must not erase prior evidence invisibly. Superseded evidence must remain distinguishable from current evidence.

## 9. Project and installation boundaries
Define:
- project-local evidence
- installation-level evidence
- account-level evidence
- provider-level evidence
- copied, restored, or migrated project evidence
- installed versus portable evidence
- cross-project aggregation

Evidence must not silently rebind across project or installation identities. Historical evidence must not automatically become current authority.

## 10. Lifecycle
Architecture-level states:
- captured
- classified
- unverified
- verified for stated scope
- incomplete
- disputed
- stale
- superseded
- correction required
- retained
- last-witness protected
- archive eligible
- archived
- deletion requested
- deleted locally
- external deletion unknown
- purged
- inaccessible
- lost

These are governance states only. They do not define implementation machinery.

## 11. Failure and refusal
Fail closed for:
- missing evidence identity
- ambiguous project binding
- unknown evidence class
- claim stronger than evidence
- deletion that would remove last witness
- stale release evidence
- conflicting witnesses
- provider-reported state presented as verified
- copied or restored evidence treated as current authority
- missing correction history
- unknown external deletion state

No silent:
- evidence reconstruction
- identity rebinding
- witness substitution
- claim promotion
- historical rewrite
- deletion overclaim

## 12. Verification and sufficiency
Define:
- minimum evidence for approvals
- minimum evidence for transmission claims
- minimum evidence for deletion claims
- minimum evidence for migration or recovery claims
- minimum evidence for cost claims
- minimum evidence for release readiness
- when multiple witnesses are required
- when evidence remains insufficient

A test result proves only the lane and scope it actually exercised.

## 13. Cross-system boundaries
Bounded relationships:
- migration and restored-copy identity
- approval persistence and revocation
- package/payload identity
- provider-policy assurance
- telemetry/cache
- queue attempt identity
- cost accounting
- hardware qualification
- model qualification
- salvage and release review

Do not pre-solve downstream contracts or authorize implementation.

## 14. Author-policy separation
Likely policy choices:
- retention duration by evidence class
- archive depth
- warning depth
- deletion confirmation wording
- correction presentation
- support-export breadth
- disputed-evidence display
- last-witness override process
- release-evidence review depth

Safety floors remain mandatory.

## 15. Proof and reopening
Later proof obligations and reopening triggers include:
- last witness deleted
- provider-reported state shown as verified
- stale evidence supporting a current claim
- test evidence overclaimed across lanes
- copied or restored evidence silently rebound
- correction history erased
- archive presented as deletion
- external deletion shown complete while unknown
- conflicting evidence hidden
- release claim lacking sufficient evidence
- evidence loss concealed as absence

## 16. Contract verdict
Family 10 is structurally resolved for Stage 12 scope.

Remaining dependent families include:
- Hardware Qualification and Resource-Pressure Protection
- Model Qualification and Lifecycle

Implementation remains blocked.
Release remains unauthorized.
