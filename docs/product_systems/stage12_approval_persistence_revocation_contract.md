# Stage 12 Approval Persistence, Inheritance, and Revocation Contract

Status: Stage 12 family contract for Approval Persistence, Inheritance, and Revocation.

Current posture:

- Stage 12 is active.
- Families 1 through 3 are upstream inputs for project identity, migration/restored-copy identity, and deployment/multi-install ownership.
- Implementation remains blocked.
- Release remains unauthorized.
- This record defines approval architecture contracts only. It does not implement approval storage, approval UI, provider behavior, transmission behavior, queues, caches, schemas, databases, or runtime verification.

## 1. Scope and Distinctions

This contract covers the Stage 12 family `Approval Persistence, Inheritance, and Revocation`.

Primary Stage 11 dependencies covered:

- Batch 3 Q15: Stage 12 must define exact approval persistence, expiry, visibility, and scope boundaries for reusable or session-approved AI work before runtime wiring can rely on them.
- Batch 3 Q16: Stage 12 must define whether approval may ever be reused across package, route, provider, model, task, project, retry, queue, restart, or cached-package boundaries.
- Batch 3 Q17: Stage 12 must define revocation visibility, propagation to packages and queued jobs, and non-success posture after approval withdrawal.
- Batch 3 Q19: Stage 12 must define how approval expiry, revocation, project changes, provider changes, and protection changes invalidate cached package artifacts and queued requests before execution.

Layer distinctions:

- Route approval: author-governed permission to use a route class, provider posture, privacy posture, cost posture, or route selection for a bounded task scope.
- Package approval: author-governed permission for a named package, package summary, visible context, protected-content treatment, and outbound or local-use package posture.
- Transmission approval: author-governed permission for a bounded outbound transmission or transfer attempt to a named provider or destination under stated scope.
- Provider acknowledgment: provider-reported or locally observed provider state about receipt, cancellation, refusal, deletion, completion, or other provider-side status. It is not author approval.
- Destination acceptance: destination-owner or author action accepting an output into a destination system. It is not route approval, package approval, transmission approval, or provider acknowledgment.
- Author acceptance into project truth: explicit author action through the project truth owner that mutates accepted project truth. It is not created by any approval, provider acknowledgment, queue completion, transmission success, or destination receipt.

Definitions:

- Approval object: a governed record or state claim that a named approval class was granted, refused, expired, invalidated, revoked, or left unresolved for a stated scope.
- Approval identity: the authoritative identity of an approval object, including approval class, approving actor, owning system, project identity where relevant, route/provider/model/package/payload/destination scope where relevant, duration or event boundary, evidence class, and lifecycle state.
- Approval scope: the exact allowed boundary of the approval, including action type, project identity, route, provider, model, model version, wrapper/task contract, package identity, payload identity, visible and hidden context, policy version, destination, duration, event boundary, and protection posture where relevant.
- Approval evidence: bounded evidence that the approval state exists for the stated scope, including who approved, what was approved, when it was approved, what evidence class supports it, what invalidates it, and what remains unknown.
- Active approval: approval currently valid for its exact stated scope and evidence class.
- Expired approval: approval no longer valid because its time, session, event, state, or policy boundary ended.
- Invalidated approval: approval no longer valid because material scope, identity, policy, protection, project, package, payload, provider, model, route, destination, queue, cache, or evidence conditions changed.
- Revoked approval: approval withdrawn by the author or governing approval owner for the affected scope.
- Unresolved approval state: approval state cannot be verified as active, expired, invalidated, revoked, refused, or not required for the stated scope.

Scope rules:

- Approval at one layer must not silently authorize another layer.
- Route approval does not approve an unseen package.
- Package approval does not approve transmission, provider substitution, destination acceptance, truth mutation, or future package revisions.
- Transmission approval does not prove provider completion, provider deletion, destination acceptance, or author acceptance into project truth.
- Provider acknowledgment does not grant project authority, author consent, destination acceptance, or truth authority.
- Queue completion, cache hit, successful retry, successful opening, matching display label, nearby record, timestamp, or similar text does not prove approval.

## 2. Ownership

Named owners for this contract:

- Approval authority: `Approval Authority`, responsible for approval-class doctrine, author-governed approval boundaries, and the rule that governed approval derives from explicit author action or explicitly classified no-approval-needed posture.
- Approval lifecycle owner: `Approval Lifecycle Owner`, responsible for active, expired, invalidated, revoked, refused, and unresolved approval-state transitions and visibility.
- Approval-scope verification owner: `Approval Scope Verification Owner`, responsible for verifying approval identity, scope, binding, currentness, evidence, exclusions, and verified-for-stated-scope wording.
- Revocation propagation owner: `Approval Revocation Propagation Owner`, responsible for routing revocation consequences to queued work, cached packages, provider state, destinations, local records, and downstream owners without overstating completion.
- Queued/cached invalidation owner: `Approval Queue and Cache Invalidation Owner`, responsible for approval-driven invalidation posture for prepared work, queued work, running attempts, completed local results, cached packages, cached permissions, retry attempts, and duplicate detection handoffs.
- Approval evidence owner: `Approval Evidence Owner`, responsible for evidence retention, evidence class, audit linkage, unknown-state labeling, provider-reported labeling, and last-witness handoff.

Preserved doctrine:

- The author is final authority for governed approval.
- Systems own workflows and bounded durable state according to their contracts.
- Models, providers, queues, caches, package builders, deployment forms, Companion, Command Center, and support surfaces do not grant project authority.
- Provider acknowledgment is not author approval.
- Provider refusal, provider success, queue success, package construction, route eligibility, cache availability, and transmission status do not mutate project truth.
- Author acceptance into project truth remains separate from route approval, package approval, transmission approval, provider acknowledgment, and destination acceptance.

## 3. Approval Identity and Binding

Approval identity must bind, where applicable, to:

- project identity
- route
- provider
- model
- model version
- wrapper or task contract
- package identity
- payload identity
- visible context
- hidden context
- policy version
- destination
- duration or event boundary
- approval class
- approval owner
- approving actor
- protection posture
- evidence class
- lifecycle state

Binding rules:

- No approval may be identified only by display label, timestamp, nearby record, matching text, queue position, package filename, provider name, model nickname, recent activity, user profile, project path, or cache hit.
- Approval identity must name what was approved and what was not approved.
- Approval identity must not be reconstructed from convenience evidence after the fact.
- Approval identity must not transfer across project identity, copied project, restored-copy identity, migrated identity, package identity, payload identity, provider identity, model identity, destination identity, or policy version changes without an explicit rule and verification.
- A human-readable approval label is presentation, not approval identity.
- A provider acknowledgment, provider receipt, provider cancellation, provider deletion claim, or provider result is provider-reported evidence, not approval identity.
- Approval state must remain visibly `unresolved` when any required binding cannot be verified.

Project binding:

- Project-bound approval requires current project identity under the project identity contracts.
- Copied projects, restored copies, migrated new identities, unresolved identities, and conflicting identities do not inherit approval by path, name, content similarity, or convenience.

Package and payload binding:

- Package-bound approval requires package identity, payload identity, visible context, hidden context, protected-content posture, summary posture, and evidence scope.
- A package approval is invalid for a materially different payload or hidden-context boundary.

Route/provider/model binding:

- Route approval requires route, provider where relevant, model where relevant, model version where relevant, wrapper/task contract where relevant, policy posture, privacy posture, and cost posture.
- Provider or model substitution requires renewed approval or explicit bounded reuse rule.

Destination binding:

- Transmission approval must identify destination or provider boundary for the stated transfer scope.
- Destination acceptance remains a separate downstream owner decision.

Duration or event binding:

- Session approval, reusable approval, one-off approval, request-specific approval, and no-approval-needed posture must identify duration or event boundary.
- Saved approval is not perpetual approval by default.

## 4. Persistence and Reuse

Approval may persist only when:

- the approval class permits persistence
- the approval owner is named
- the approval scope is explicit
- the duration or event boundary is explicit
- current evidence supports active status
- all material bindings remain unchanged or explicitly revalidated
- invalidation and revocation rules are active
- visible status identifies the approval as active only for the stated scope

Revalidation is required after material change to:

- project identity
- route
- provider
- model
- model version
- wrapper or task contract
- package
- payload
- visible context
- hidden context
- redaction or transformation
- destination
- provider policy
- protected-content classification
- budget or cost posture where approval depended on spend
- deployment instance or version where approval depended on instance scope
- queue attempt state where approval depended on pending execution state
- cache currentness where approval depended on cached permission or package state

Reuse rules:

- Saved approval is not perpetual approval.
- Approval reuse must be explicit, scoped, evidenced, visible, and revocable.
- Convenience must not determine reuse.
- Session approval may persist only for the defined session, scope, route, provider, model, project, package, payload, protection posture, cost posture, and event boundary.
- Reusable approval may exist only if later policy authorizes it and this architecture's safety floors remain intact.
- Approval reuse must fail closed when material scope cannot be verified.
- Expired, invalidated, revoked, refused, or unresolved approval must not be visually or operationally presented as active.

Non-reuse rules:

- Approval for local advisory work does not authorize outbound work.
- Approval for one provider does not authorize another provider.
- Approval for one model or model version does not authorize another model or version.
- Approval for one package does not authorize a revised package.
- Approval for one payload does not authorize a changed payload.
- Approval for visible context does not authorize hidden-context expansion.
- Approval for one project does not authorize a copied, restored, migrated, renamed, or unresolved project identity.
- Approval for one destination does not authorize another destination.
- Approval for one queue attempt does not authorize a retry or duplicate attempt unless the later queue contract and this approval contract both permit it for the unchanged scope.

## 5. Inheritance

Default posture:

- No silent inheritance.
- Approval inheritance across retries, duplicate attempts, queued jobs, copied projects, restored copies, migrations, installed/portable instances, model replacements, package revisions, or destination changes is blocked unless explicitly permitted and verified.

Potential inheritance contexts:

- Retries: approval may inherit only if retry identity, route, provider, model, package, payload, visible and hidden context, project identity, protection posture, cost posture, destination, policy state, and event boundary remain within the approved scope.
- Duplicate attempts: duplicate execution must not inherit approval by similarity; duplicate detection and queue attempt identity must confirm whether the duplicate is blocked, archived, invalidated, refused, or explicitly permitted.
- Queued jobs: queued work may retain approval only while approval remains active for the queued scope and queue identity remains valid.
- Copied projects: copied projects do not inherit active approvals by default.
- Restored copies: restored-copy identity does not inherit active approvals by default.
- Migrations: migrated in-place identity may preserve approval only if approval scope explicitly permits preservation and all material identity, package, payload, provider, model, protection, destination, and policy bindings remain valid.
- Installed or portable instances: installed/portable instance changes do not inherit approval where approval depended on instance, credential, configuration, provider, cache, or deployment boundary.
- Model replacements: model replacement invalidates approval unless model replacement was explicitly within approved scope and current evidence proves the replacement remains materially equivalent for the approval claim.
- Package revisions: package revision invalidates package approval unless an explicit rule classifies the revision as non-material and current evidence supports that claim.
- Destination changes: destination change invalidates transmission approval unless an explicit rule and current evidence prove the destination remains unchanged for approval purposes.

Permitted inheritance requirements:

- unchanged authoritative identity
- unchanged material scope
- current evidence
- explicit inheritance rule
- visible status
- revocation propagation path
- invalidation triggers
- downstream owner acceptance where relevant

Where any requirement is missing, approval inheritance fails closed.

## 6. Invalidation

Invalidation triggers include:

- route change
- provider change
- model change
- model-version change
- wrapper or task-contract change
- package change
- payload change
- hidden-context expansion
- visible-context material change
- redaction or transformation change
- package-summary change where summary approval was material
- policy drift
- project identity transition
- copied project
- restored-copy creation
- migration creating new identity
- destination change
- protected-content status change
- protection posture uncertainty
- provider privacy posture change
- cost or budget posture change where approval depended on spend
- approval expiry
- approval withdrawal
- stale approval evidence
- missing approval evidence
- conflicting approval records
- queue attempt identity change
- cached package currentness failure
- cached permission currentness failure
- deployment instance or portable boundary change where approval depended on that boundary

Invalidation rules:

- Invalidated approval must not remain visually active.
- Invalidated approval must not remain operationally active.
- Invalidated approval must not authorize package construction, transmission, provider call, retry, cache reuse, queue continuation, destination write, export, sync, truth mutation, deletion, retention, or protected-content exposure.
- Invalidation must propagate to affected prepared work, queued work, running attempts where possible, cached packages, cached permissions, retries, duplicate attempts, and evidence status.
- Invalidation does not prove provider-side cancellation, deletion, or revocation.
- Invalidation must preserve evidence needed to explain what was invalidated and why.

Conflicting approval records:

- Conflicting approval records fail closed.
- The workflow must not choose the newest, nearest, most permissive, most convenient, or most recently displayed approval record as authoritative without verification.
- Conflict remains visible until resolved, archived, invalidated, refused, or marked unresolved by the approval owner.

## 7. Revocation

Revocation states:

- Revocation requested: author or governing owner has requested withdrawal for a stated approval scope.
- Revocation recorded: local approval lifecycle owner has recorded the withdrawal for the stated scope.
- Queued work invalidation: affected prepared and queued work has been identified and marked invalidated, blocked, canceled, or unresolved according to known queue state.
- Cached-package invalidation: affected cached packages and cached permissions have been invalidated, archived, deleted where later policy permits, or marked unresolved.
- Local-stop status: local execution, local queue continuation, local package reuse, local cache reuse, or local transmission preparation has stopped for the stated scope.
- Remote-stop status: provider, destination, or external system has reported stop, cancellation, deletion, non-retention, or revocation for the stated scope.
- Remote state unknown: external state cannot be verified.
- Provider acknowledgment: provider-reported evidence of receipt, cancellation, deletion, revocation, refusal, completion, or inability to act. It is provider-reported, not author approval and not local proof of external completion.
- Destination consequences: destination-side state must remain separate from local approval revocation and provider-reported state.
- Evidence retention: revocation evidence must remain sufficient to explain request, local handling, provider-reported status, unknown external state, and downstream consequences.

Revocation rules:

- Revocation must be scoped to an approval identity and approval scope.
- Revocation of one layer does not automatically prove revocation of another layer, but it must invalidate dependent local claims that rely on the revoked approval.
- Revocation must not be presented as complete when external state is unknown.
- Local revocation may be complete for local execution while remote state remains unknown.
- Provider acknowledgment must remain labeled provider-reported.
- Provider non-response must remain unknown, not success.
- Revocation cannot erase the need for evidence retention where evidence is needed to explain prior approval, transmission, queue, cache, provider, cost, or destination state.
- Revocation must not silently delete last-witness evidence.

External state:

- Requested provider cancellation is not acknowledged provider cancellation.
- Acknowledged provider cancellation is not acknowledged deletion.
- Acknowledged deletion is not proof of all provider-side or destination-side deletion unless the exact scope and evidence support that claim.
- Provider-retained data, unknown retained data, and destination-side state must remain visible when consequential.

## 8. Queue, Cache, and Retry Propagation

This contract defines approval propagation boundaries only. It does not solve queue mechanics.

Prepared but unqueued work:

- Prepared work must be invalidated, rebuilt, refused, or marked unresolved when approval expires, is invalidated, is revoked, or cannot be verified.
- Prepared work must not become queued work on stale approval.

Queued work:

- Queued work must carry approval identity, approval scope, project identity, package identity where relevant, payload identity where relevant, route/provider/model binding where relevant, protection posture, cost posture where relevant, and evidence class.
- Queue continuation must fail closed when approval state is expired, invalidated, revoked, refused, or unresolved.

Running attempts:

- Running attempts require current approval-state evaluation where local stop is possible.
- Revocation or invalidation must mark local stop, remote state unknown, provider acknowledgment, or consequential unknowns according to observed state.
- Running attempt status must not be rewritten into success because revocation arrived late.

Completed local results:

- Completed local results do not prove approval remained valid for all downstream actions.
- Results produced under later-invalidated approval must be labeled with evidence and approval posture and must not become accepted truth by completion.

Transmitted work:

- Transmitted work requires separate transmission evidence, provider-reported state, and external uncertainty handling.
- Local approval revocation after transmission does not prove provider-side deletion, cancellation, or non-retention.

Cached packages:

- Cached packages must be invalidated after approval expiry, revocation, project changes, provider changes, protection changes, payload change, package change, hidden-context change, redaction change, policy drift, or stale evidence.
- Cached packages must not be reused because their text resembles a previously approved package.

Cached permissions:

- Cached permission state must carry approval identity, scope, duration, evidence, invalidation triggers, revocation state, and unresolved external state.
- Cached permission must not become standing permission by storage alone.

Retry attempts:

- Retry attempts require current approval validation under the same authoritative scope or renewed approval.
- Retry may not retransmit protected content, paid work, outbound work, changed package, changed provider, changed model, or changed destination without valid approval.

Duplicate detection:

- Duplicate detection must distinguish duplicate prepared work, duplicate queued work, duplicate running attempt, duplicate transmitted work, duplicate provider acknowledgment, and duplicate evidence.
- Duplicate detection must not merge approval identity across different projects, packages, payloads, providers, models, destinations, or policy versions by similarity.

## 9. Failure and Refusal

Fail-closed conditions:

- approval identity is missing
- approval scope is ambiguous
- approving actor is unknown for governed approval
- approval evidence is missing or stale
- payload differs from approved package
- visible context differs materially from approved scope
- hidden context cannot be verified
- package identity cannot be verified
- provider policy is unknown or stale
- provider, model, model version, wrapper, or task contract changed outside approved scope
- project binding conflicts
- copied, restored, migrated, or unresolved project identity attempts to inherit approval
- destination changed outside approved scope
- protected-content posture changed or is unknown
- revocation propagation is incomplete for consequential local state
- external state is unknown and consequential
- cached package or cached permission cannot prove currentness
- conflicting approval records exist

Refusal posture:

- The workflow must report approval missing, approval ambiguous, approval expired, approval invalidated, approval revoked, approval refused, approval unresolved, revocation pending, local stop complete, remote state unknown, provider-reported only, or downstream owner required as applicable.
- No silent fallback is permitted.
- No silent provider substitution is permitted.
- No silent model substitution is permitted.
- No approval reconstruction is permitted.
- No approval reuse by convenience is permitted.
- No warning-only success is permitted where project truth, protected content, outbound transmission, paid execution, provider substitution, package scope, destination, queue, cache, or evidence claims are affected.

Unknown handling:

- Unknown approval remains visibly unknown.
- Unknown external state remains visibly unknown.
- Unknown revocation propagation remains visibly unknown.
- Unknown provider policy remains visibly unknown.
- Unknown hidden context remains visibly unknown.

## 10. Evidence and Verification

Approval evidence must identify:

- who approved
- what approval class was involved
- what was approved
- exact scope
- project binding
- package identity and payload alignment where relevant
- visible context and hidden context where relevant
- route, provider, model, model version, and wrapper/task binding where relevant
- destination where relevant
- protected-content posture where relevant
- policy state
- approval time
- approval duration or event boundary
- expiry state
- invalidation state
- revocation state
- refusal state where applicable
- queued propagation state where applicable
- cached propagation state where applicable
- external uncertainty
- evidence class
- unresolved exclusions

Verification responsibilities:

- `Approval Scope Verification Owner` verifies approval identity, scope, binding, currentness, and verified-for-stated-scope claims.
- `Approval Revocation Propagation Owner` verifies local revocation routing and labels external uncertainty.
- `Approval Queue and Cache Invalidation Owner` verifies approval-driven queue/cache invalidation handoff status for the stated scope.
- `Approval Evidence Owner` preserves evidence class, provider-reported labels, and last-witness handoff.

Evidence-class rules:

- Provider-reported state must remain labeled provider-reported.
- Provider-reported state is not local observation unless locally observed.
- Local stop evidence is not remote stop evidence.
- Requested revocation is not completed revocation.
- Historical, harness, development, runtime, packaged, provider-reported, locally observed, manual witness, and unknown evidence remain distinct.
- Historical or harness evidence may inform later proof only when scoped accurately.
- Evidence for one approval, package, project, provider, model, destination, policy, queue, cache, or artifact must not transfer to another by similarity.

Verification wording:

- Use `verified for stated scope`.
- Name the approval identity, approval class, project identity where relevant, package/payload identity where relevant, route/provider/model binding where relevant, destination where relevant, policy state, approval state, evidence class, external uncertainty, and exclusions.
- Do not claim `approved`, `still approved`, `revoked`, `externally revoked`, `provider deleted`, `safe to retry`, `safe to reuse`, `package valid`, `payload aligned`, or `permission current` unless the stated scope was verified.

## 11. Downstream Handoffs

This contract defines approval boundaries only. It does not solve later Stage 12 families.

Package, Payload, and Hidden-Context Identity:

- Define package identity, payload identity, hidden-context identity, visible context, hidden context, package revision, and package/payload alignment. Approval depends on those identities but does not define them here.

Provider-Policy Drift and External Assurance:

- Define provider-policy change monitoring, provider-reported assurance, external cancellation, external deletion, retention, revocation assurance, and limits of provider claims.

Telemetry and Generic-Cache Governance:

- Define generic cache ownership, cache identity, protected-content eligibility, telemetry data classes, retention, deletion, and cache invalidation after approval revocation.

Queue Attempt Identity:

- Define job identity, execution-attempt identity, retry-attempt identity, cancellation state, retained failed or abandoned state, duplicate detection, and queue propagation mechanics.

Evidence Retention:

- Define minimum approval, transmission, provider, queue, cache, revocation, and external-state witnesses before cleanup or pruning.

Cost Accounting:

- Define spend approval, budget scope, attempted spend, reconciled cost, unknown cost, disputed cost, provider-reported usage, and cost evidence after revocation or retry.

Model Qualification:

- Define model identity, model version, wrapper/task identity, qualification currentness, retirement, replacement, and requalification after approval-relevant model change.

## 12. Author-Policy Separation

Genuine later policy choices preserved:

- approval duration
- reusable-approval breadth
- session-approval scope
- warning depth
- confirmation wording
- revocation presentation
- protected-content approval depth
- whether any future approval templates are allowed
- approval audit display depth
- stale approval presentation
- remote-state uncertainty wording
- retention duration for approval and revocation witnesses

Safety floors that are not optional policy:

- governed approval derives from explicit author action or explicitly classified no-approval-needed posture
- approval layers remain distinct
- approval identity and scope are mandatory
- saved approval is not perpetual approval by default
- no silent inheritance
- no approval reuse by convenience
- material scope change requires revalidation or refusal
- invalidated approval must not remain active
- revoked approval must not remain active
- provider acknowledgment is not author approval
- provider-reported state remains provider-reported
- unknown external state remains visibly unknown
- protected-content approval cannot be broadened silently
- approval cannot mutate project truth
- release remains unauthorized

## 13. Proof and Reopening

Later implementation-proof obligations:

- prove approval records only arise from actual granted consent or explicitly classified no-approval-needed posture
- prove false consent records cannot be created by display, timestamp, cache, provider acknowledgment, queue status, or matching text
- prove stale approval reuse is blocked
- prove approval does not survive material project, route, provider, model, package, payload, visible-context, hidden-context, destination, policy, or protected-content change
- prove revocation reaches prepared work, queued work, cached packages, cached permissions, retry attempts, and local execution state according to known execution state
- prove remote state remains unknown when provider or destination state cannot be verified
- prove payload differing from approved package fails closed
- prove provider substitution and model substitution require renewed approval or explicit verified bounded rule
- prove approval does not inherit across copied projects, restored copies, migrated new identities, unresolved identities, installed/portable instance changes, or cross-project contexts by convenience
- prove provider-reported evidence is labeled provider-reported
- prove approval evidence classes are labeled accurately for current claimed scope

Reopening triggers:

- architecture permits false consent records
- architecture permits stale approval reuse
- architecture permits approval to survive material context change without explicit rule and current evidence
- architecture permits revocation not to reach queued or cached work while still presenting approval as active
- architecture permits payload to differ from approved package
- architecture permits hidden-context expansion without renewed approval or explicit verified rule
- architecture permits provider substitution or model substitution by fallback convenience
- architecture overclaims external provider or destination state
- architecture permits cross-project approval inheritance
- architecture treats provider acknowledgment as author approval
- architecture treats package approval as transmission approval or destination acceptance
- architecture treats transmission success as author acceptance into project truth
- architecture conflicts with project identity, migration/restored-copy, deployment/multi-install, package, provider, queue, cache, protected-content, or evidence authority

Consequences:

- Affected approval, package, payload, route, provider, model, destination, queue, cache, retry, transmission, revocation, external-state, or truth claim remains blocked.
- Architecture readiness for this family remains blocked if a named owner, approval identity rule, scope rule, persistence rule, inheritance rule, invalidation rule, revocation rule, propagation rule, refusal rule, or verification rule is missing.
- Later implementation may not claim compliance for affected approval behavior until current scoped proof exists.
- Release remains unauthorized for any affected claim.

Conditions showing structural misclassification:

- current authority already defines approval persistence, inheritance, revocation, and propagation differently
- Stage 11 Q15, Q16, Q17, or Q19 cannot be resolved as Stage 12 architecture dependencies without reopening Stage 11 classification
- a required approval owner is missing or conflicts with route, package, provider, protected-content, project identity, queue, cache, transmission, provenance, or evidence ownership
- source evidence shows approvals can safely persist by timestamp, display label, matching text, cache hit, provider acknowledgment, path, project copy, or convenience, contradicting current doctrine

## 14. Contract Verdict

Stage 12 structural verdict:

- Approval Persistence, Inheritance, and Revocation is structurally resolved for Stage 12 scope by this contract.
- Batch 3 Q15 now has approval persistence, expiry, visibility, scope, reuse, stale-approval, and permission-state boundaries.
- Batch 3 Q16 now has approval inheritance and no-silent-reuse rules across package, route, provider, model, task, project, retry, queue, restart, cache, and identity boundaries.
- Batch 3 Q17 now has revocation visibility, local propagation, external uncertainty, provider acknowledgment, package/queue/cache invalidation, and non-success posture.
- Batch 3 Q19 now has approval expiry, revocation, project-change, provider-change, protection-change, cached-package, and queued-request invalidation rules.
- This contract does not authorize implementation.
- This contract does not authorize release.
- This contract does not prove runtime, harness, packaged, operational, provider, external, or release compliance.

Dependent contracts remaining:

- `Package, Payload, and Hidden-Context Identity`
- `Provider-Policy Drift and External Assurance`
- `Telemetry and Generic-Cache Governance`
- `Queue Attempt Identity, Retry, Cancellation, and Retained State`
- `Evidence Retention and Last-Witness Protection`
- `Cost Accounting and Budget Persistence`
- `Model Qualification and Lifecycle`

Final bounded declaration:

- This Stage 12 family contract is ready for contract review.
- Implementation remains blocked.
- Release remains unauthorized.
