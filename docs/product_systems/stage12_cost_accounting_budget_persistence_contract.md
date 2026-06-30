# Stage 12 Architecture Readiness Contract
## Family 9 - Cost Accounting and Budget Persistence

## 1. Scope and distinctions
This contract governs cost identity, estimates, actual charges, budget state, reservation, reconciliation, persistence, project attribution, retries, external uncertainty, and author-facing budget claims.

Keep distinct:
- cost estimate
- budget reservation
- projected cost
- attempted cost
- provider-reported usage
- provider-reported charge
- locally calculated cost
- reconciled cost
- final billed cost
- refund or credit
- project budget
- account budget
- route limit
- provider limit
- model limit
- warning threshold
- hard block
- unknown cost state

Estimate is not actual charge. Provider-reported usage is not independently verified billing. Queue completion does not prove a final charge. Cancellation does not prove zero cost. Budget availability does not authorize transmission by itself.

## 2. Ownership
Named owners:
- cost-accounting owner
- estimate authority
- budget-policy owner
- budget-state owner
- reservation owner
- reconciliation owner
- project-attribution owner
- external-billing evidence owner
- correction owner

Preservation rules:
- author owns spending policy choices
- systems enforce bounded policy
- providers report external state but do not own Black Skies budget truth
- models do not own cost authority

## 3. Cost identity
Cost identity is defined by:
- project identity
- job identity
- attempt identity
- route
- provider
- model/version
- task-contract identity
- package or payload identity where relevant
- usage unit type
- price schedule identity
- currency
- account or tier scope
- jurisdiction or tax scope where relevant
- timestamp or billing period
- evidence source
- reconciliation state

Display label, nearby amount, provider name, or matching timestamp are insufficient identity.

## 4. Estimate and reservation
Define:
- preflight estimate
- estimate range
- estimate confidence
- reserved budget
- reservation expiry
- reservation release
- reservation adjustment
- estimate invalidation

Require estimate revalidation after:
- package or payload change
- model change
- provider change
- route change
- price schedule change
- hidden-context expansion
- retry
- task-contract change

No estimate may be presented as guaranteed cost.

## 5. Actual, reported, and reconciled cost
Keep distinct:
- locally observed usage
- provider-reported usage
- provider-reported charge
- provisional cost
- reconciled cost
- final billed cost
- disputed cost
- corrected cost
- unknown cost

Define what may be claimed at each state.

Do not present provider-reported cost as independently verified unless separate evidence exists.

## 6. Retries, duplicates, cancellation, and partial work
Define cost treatment for:
- automatic retry
- author-approved retry
- duplicate attempt
- conflicting concurrent attempt
- canceled-before-start work
- canceled-during-local work
- canceled-after-transmission work
- late-arriving result
- partial result
- provider timeout
- unknown provider completion

Each attempt must remain separately attributable.

No failed, canceled, or duplicate attempt may be assumed cost-free without evidence.

## 7. Budget persistence
Define:
- project budget identity
- account budget identity
- session budget
- task budget
- route/provider/model sub-limit
- persisted spent amount
- persisted reserved amount
- unknown or unreconciled amount
- rollover or reset boundary
- correction history
- archive state

Budget persistence must remain bound to authoritative project/account identity.

Copied, restored, migrated, or rebased projects must not silently inherit spend authority or budget state.

## 8. Budget decisions and enforcement states
Architecture-level states:
- budget available
- warning threshold reached
- near limit
- reservation pending
- reserved
- insufficient budget
- blocked
- cost unknown
- reconciliation pending
- overrun detected
- corrected
- expired
- reset pending
- archived

Distinguish:
- warning
- soft limit
- hard limit
- provider-enforced limit
- local policy block
- unknown state

These are governance states only. They do not define implementation machinery.

## 9. Failure and refusal
Fail closed for:
- missing cost identity
- ambiguous project attribution
- unknown price schedule
- stale estimate
- unresolved currency mismatch
- uncertain provider/model identity
- duplicate attempt ambiguity
- unreconciled material spend
- copied or restored budget conflict
- provider-reported billing conflict
- missing approval where spending requires approval
- protected-content route change affecting price or eligibility

No silent:
- cost substitution
- project rebinding
- estimate reconstruction
- budget reset
- retry authorization
- currency conversion
- optimistic zero-cost assumption

## 10. Corrections and disputes
Define:
- stale or incorrect estimate correction
- provider charge correction
- refund or credit
- disputed charge
- project-attribution correction
- reservation correction
- budget-state recomputation
- user-visible correction
- evidence retention

Corrections must not erase prior evidence or rewrite history invisibly.

## 11. Evidence and verification
Evidence classes:
- estimate inputs
- price schedule
- usage units
- provider/model identity
- job and attempt identity
- project attribution
- reservation
- cancellation timing
- provider-reported usage
- provider-reported charge
- reconciliation
- correction or refund
- uncertainty

Provider-reported billing remains labeled provider-reported.

## 12. Cross-system boundaries
Bounded relationships:
- queue attempt identity
- provider-policy drift
- package/payload identity
- telemetry/cache
- evidence retention
- model qualification
- hardware/resource protection
- Command Center
- Writing Surface

Preserve:
- Command Center may present budget detail and controls
- Writing Surface receives only necessary nonblocking status and blocking warnings
- budget state does not own manuscript truth
- budget availability does not replace approval

Do not pre-solve downstream families.

## 13. Author-policy separation
Likely policy choices:
- project budget amount
- account budget amount
- warning thresholds
- hard-block threshold
- reservation breadth
- estimate confidence display
- retry spending policy
- budget reset cadence
- rollover policy
- correction presentation
- refund or credit handling
- currency display
- archive depth

Safety floors remain mandatory.

## 14. Proof and reopening
Later proof obligations and reopening triggers include:
- estimate displayed as actual
- provider-reported charge shown as verified
- duplicate attempts charged to one identity
- canceled work assumed free
- wrong-project cost attribution
- restored copy inheriting active budget authority
- stale price schedule used
- reservation not released or reconciled
- unknown spend shown as zero
- correction erasing historical evidence
- budget block bypassed by retry or provider substitution

## 15. Contract verdict
Family 9 is structurally resolved for Stage 12 scope.

Remaining dependent families include:
- Hardware Qualification and Resource-Pressure Protection
- Model Qualification and Lifecycle
- Evidence Retention and Last-Witness Protection

Implementation remains blocked.
Release remains unauthorized.
