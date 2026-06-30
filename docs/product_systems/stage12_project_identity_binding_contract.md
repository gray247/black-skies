# Stage 12 Project Identity Transition and Binding Propagation Contract

Status: Stage 12 family contract for Project Identity Transition and Binding Propagation.

Current posture:

- Stage 12 is active.
- The Migration and Restored-Copy Identity contract is the upstream Stage 12 identity input.
- Implementation remains blocked.
- Release remains unauthorized.
- This record defines architecture contracts only. It does not implement identity storage, migration, binding propagation, databases, schemas, file formats, queue mechanics, package mechanics, or runtime verification.

## 1. Scope

This contract covers the Stage 12 family `Project Identity Transition and Binding Propagation`.

Primary Stage 11 dependency covered:

- Batch 4 Q46: Stage 12 must define how project identity transitions affect project identifier, project path, project display name, restored-copy identity, migration identity, queue job binding, cache binding, result destination, approval binding, package binding, budget and accounting binding, and provenance/history binding. Display-name change alone must not silently rebind identity. Path change alone must not silently create a new project identity. A restored copy may require a distinct identity. Migration may transform or replace identity only under the Batch 2 migration contract. Queue, cache, approval, package, budget, and result bindings must not follow by convenience, and unresolved identity must block safe continuation of affected jobs.

Upstream dependency incorporated:

- `stage12_migration_copy_identity_contract.md` defines restored-copy identity, migration identity, migrated replacement identity, migrated copy identity, source identity, destination identity, version identity, and identity-unresolved posture for the migration/restored-copy family.

Definitions:

- Stable project identity: the authoritative project identity used to bind project-local state and project-bound claims across save, recovery, migration, queue, cache, approval, package, budget, provenance, history, evidence, model reference, result destination, and deployment contexts.
- Project path: the current known location or access route for a project. Path is location, not identity.
- Display name: the human-facing project name or title. Display name is presentation, not identity.
- Project move: a location change for the same project identity, only when identity witnesses verify that the moved object is the same project.
- Project copy: a duplicate or derived project object that may become an independent project identity only through explicit classification and evidence.
- Restored-copy identity: the distinct identity or explicitly classified non-project inspection object defined by the Migration and Restored-Copy Identity contract.
- Migrated identity: the identity outcome of a migration, including same project after in-place migration, migrated replacement, migrated copy, or unresolved migration identity.
- Replacement identity: a destination identity that replaces current project state only through an authorized and verified transition.
- Unresolved identity: a blocked state where project identity, transition identity, binding identity, or version identity cannot be verified for the claimed scope.

Authority rule:

- Path, folder name, display name, nearby files, recent-file lists, shell ownership, successful file opening, or successful parsing do not determine authority.
- Name, path, or proximity may be evidence to inspect, but they do not independently prove project identity or authorize binding propagation.

## 2. Ownership

Named owners for this contract:

- Project-identity authority: `Project Identity Authority`, responsible for authoritative project identity classification and identity-transition claims.
- Identity-transition workflow owner: `Project Identity Transition Workflow`, responsible for transition intake, proposed transition classification, author approval boundary where required, refusal posture, and transition-state reporting.
- Binding-propagation owner: `Project Binding Propagation Owner`, responsible for the inventory, propagation, invalidation, archival, refusal, and unresolved status of project-bound relationships during identity transitions.
- Conflict-detection owner: `Project Identity Conflict Detection Owner`, responsible for duplicate identity detection, path and version conflict detection, multi-owner conflict detection, and visible conflict reporting.
- Verification owner: `Project Identity Transition Verification Owner`, responsible for verifying identity witnesses, before/after comparison, binding inventory comparison, unresolved binding reports, and verified-for-stated-scope wording.

Preserved doctrine:

- The author remains final authority over project truth.
- Accepted manuscript truth remains owned by `Narrative Assertion / Narrative Insertion`; accepted project truth remains owned by its explicit truth owner.
- Systems own workflows and bounded durable state according to their contracts.
- Models, views, queues, caches, package builders, deployment forms, Companion, Command Center, and support surfaces do not own project identity.
- Displaying, opening, queuing, caching, packaging, routing, transmitting, analyzing, restoring, or migrating a project does not grant identity authority.

## 3. Identity Transition Rules

All identity transitions require explicit classification and evidence. This contract does not assume every copy preserves identity, and it does not assume every copy creates a new identity automatically.

Same project moved to new path:

- A move may preserve stable project identity only when identity witnesses verify that the object at the new path is the same project.
- Path change alone must not create new identity.
- Path change alone must not rebind queued jobs, cached results, approvals, packages, budgets, model references, provenance, history, evidence, or result destinations.
- If the move is verified, bindings may be preserved only by class-specific propagation rules and verification.

Project copied as independent project:

- A copied project must be classified as independent project, non-project evidence, temporary inspection object, or unresolved.
- Independent project copy requires new identity or explicit distinct-copy identity classification.
- Active queued jobs, live approvals, package approvals, cached results, budgets, result destinations, and release evidence do not follow the copy by default.
- Provenance, history, snapshots, and recovery records may be duplicated or retained as source trail only when their evidence class stays clear.

Project restored as copy:

- Restore as copy follows the upstream restored-copy identity contract.
- Restored copy does not replace current project state.
- Restored copy does not inherit active queue execution, approval, package, cache, budget, model, deployment, or release-evidence claims by convenience.
- Restored-copy provenance and history remain visible as source trail and evidence, not current truth authority.

Project migrated in place:

- In-place migration may preserve the same stable project identity only when the migration contract verifies same-project identity, source preservation, destination identity, preservation scope, compatibility, and binding disposition.
- Migration completion does not equal binding verification.
- Bindings that depend on version, source, package, approval, model, cache, provider, or evidence currentness must be revalidated or invalidated.

Project migrated as new identity:

- Migration as new identity creates a distinct project identity or migrated-copy identity under the upstream migration contract.
- Active bindings do not follow unless the binding class explicitly permits duplication, archival retention, or explicit rebinding.
- Any inherited-looking state must remain source trail, archived witness, or unresolved until verified for the stated scope.

Project renamed:

- Display-name change is presentation only.
- Rename must not silently rebind identity or create identity.
- Same-name projects must remain distinct unless stable identity witnesses prove sameness.
- Name collision is a conflict condition, not an identity proof.

Project reopened after path loss:

- Reopen after missing path, stale shortcut, moved folder, unavailable drive, broken link, or restored location requires identity revalidation.
- Successful opening is not identity proof.
- If identity cannot be verified, the project may be inspected only under a blocked or identity-unresolved posture; project-bound bindings must not reactivate.

Project opened by multiple app versions:

- Application version, installation identity, portable copy, side-by-side build, or older/newer build does not own project identity.
- Multiple app versions opening or claiming the same project is a conflict-prone transition and must hand off to deployment/multi-install ownership.
- Until deployment versioning defines allowed ownership, conflicting version ownership fails closed for mutable project-bound bindings.

Identity unresolved or conflicting:

- Unresolved or conflicting identity blocks safe continuation of affected jobs, cached results, approvals, packages, budgets, model references, result destinations, recovery claims, and release evidence claims.
- Unknown identity remains visibly unknown.
- No workflow may silently choose a project identity because it is nearby, recently opened, similarly named, or convenient.

## 4. Binding Inventory

Project-bound relationships include:

- queued jobs
- execution attempts
- retry attempts
- cancellation and completion records
- cached results
- generic cache artifacts
- analysis results
- advisory artifacts
- approvals
- route approvals
- package approvals
- packages and payloads
- hidden-context package wrappers
- transmission records
- provider-reported statuses
- budgets and cost records
- spend estimates
- attempted spend records
- reconciled, unknown, or disputed cost states
- model qualification references
- saved model or provider assumptions
- provenance records
- history records
- snapshots
- backup records
- restore records
- recovery records
- migration and rollback witnesses
- evidence witnesses
- diagnostics witnesses
- installed application ownership records
- portable application ownership records
- side-by-side version ownership records
- result destinations
- output acceptance destinations
- workflow resume markers
- project-local settings or preferences where later authority makes them project-bound

Each binding must identify its owning system, project identity basis, evidence class, currentness posture, and whether it is active, archived, invalidated, duplicated, refused, or unresolved.

## 5. Binding Propagation Rules

No binding may follow a transition merely because names or paths match.

For each binding class, the transition must classify the binding as one or more of:

- preservation
- explicit rebinding
- invalidation
- duplication
- archival retention
- refusal
- unresolved status

Queued jobs:

- Same verified project move may preserve queued jobs only after project identity and source assumptions are revalidated.
- Project copy, restored copy, migrated new identity, unresolved identity, version conflict, or path-only match requires invalidation, archival retention, refusal, or explicit rebinding in a later queue contract.
- Queued jobs must not follow by path, name, recent-open state, or result convenience.

Execution and retry attempts:

- Attempts are bound to the original project identity, attempt identity, route/package/model/budget assumptions, and evidence witnesses.
- Attempts may be retained as archived witnesses after transition.
- Attempts must not be duplicated into a new project identity as active attempts without explicit later queue and cost contracts.

Cached results:

- Cache bindings require identity, source scope, protection posture, approval posture, package posture, model/provider posture, and currentness evidence.
- Cache may be invalidated, retained as archived evidence, or explicitly revalidated.
- Path-only cache binding is invalid for identity transition.

Analysis results:

- Analysis results remain advisory unless accepted through the relevant truth owner.
- Analysis results may be retained as historical advisory artifacts only if their project identity, source scope, and currentness remain visible.
- Analysis results must not become current because a project was copied, moved, restored, renamed, or migrated.

Approvals:

- Approvals are scoped to the project, package, route, provider, model, task, protection state, and time or session boundary defined by the approval owner.
- Any project identity change requires invalidation, explicit rebinding, archival retention, refusal, or unresolved status.
- Cross-project approval reuse is blocked unless the later approval contract explicitly permits it for a bounded scope.

Packages and payloads:

- Packages and payloads are bound to source identity, source scope, package identity, hidden-context boundary, protection state, approval state, and payload evidence.
- They must be invalidated or explicitly revalidated after identity transition.
- Payloads must not inherit validity because the new project has similar text or the same display name.

Transmission records:

- Transmission records remain evidence of prior outbound attempt, local observation, provider report, or destination report.
- They do not authorize new transmission after identity transition.
- They may be archived with source identity and evidence class.

Budgets and cost records:

- Budget and cost records remain bound to original project identity, route/provider/model/task, attempt identity, and evidence class.
- New identity requires explicit budget scope decision by the later cost contract.
- Spend evidence may remain archived; active budget authority must not silently rebind.

Model qualification references:

- Model qualification references must be revalidated after project identity transition when saved workflows, queued work, packages, local-model assumptions, or provider assumptions depend on the project state.
- Model references may be archived as history but do not prove current qualification for the transitioned project.

Provenance and history:

- Provenance and history may preserve source trail, acceptance lineage, protection posture, and transition events.
- They remain evidence and history, not truth authority.
- Mismatched provenance/history blocks verified binding propagation until resolved, archived, or marked unknown.

Snapshots and recovery records:

- Snapshots and recovery records remain governed by `Snapshots / Backup / Restore / History` and the upstream migration/restored-copy contract.
- They may be preserved as recovery witnesses or duplicated as source trail when identity distinctions remain clear.
- They do not become current truth or current save authority after a transition.

Evidence witnesses:

- Evidence witnesses must retain source identity, destination identity if applicable, evidence class, revision/build/artifact/environment where relevant, and scope.
- Evidence for one identity must not transfer to another identity by similarity.

Installed and portable application ownership:

- Installed or portable application ownership cannot reassign project identity.
- Multiple installs or portable copies require downstream deployment/multi-install rules before active shared ownership claims may be made.

Result destinations:

- Result destinations must be revalidated after identity transition.
- Ambiguous result destination fails closed.
- Returned results must not land in a new identity merely because that identity was opened most recently.

## 6. Invalidation

Invalidation triggers include:

- project identity change
- restored-copy creation
- migration creating new identity
- migrated replacement with changed version identity
- provider change
- model change
- package identity change
- hidden-context change
- protection-state change
- approval revocation, expiry, scope change, or withdrawal
- path conflict
- display-name collision
- concurrent access
- multiple app versions claiming ownership
- portable-copy conflict
- version incompatibility
- stale binding evidence
- missing binding evidence
- source/destination comparison mismatch
- provenance/history mismatch
- recovery or rollback uncertainty
- stale or superseded source state

Bindings that must never silently survive identity change:

- active queued jobs
- active execution or retry attempts
- active cancellation claims
- package approvals
- route approvals
- protected-content approvals
- transmission approvals
- cached package artifacts
- generic caches containing project, package, diagnostics, approval, or provenance-linked artifacts
- active budgets and spend caps
- provider/model qualification references
- result destinations
- release evidence claims
- deployment ownership claims
- recovery success, rollback success, migration success, or verification success claims

Survival requires explicit preservation, archival retention, invalidation, explicit rebinding, refusal, or unresolved status.

## 7. Conflict and Refusal

Fail-closed conditions:

- duplicate stable identifiers are detected
- one project is claimed by multiple active identities
- multiple projects claim one active identity
- multiple builds or installed forms claim mutable ownership of the same project without a deployment contract
- queue result destination is ambiguous
- approval is bound to the wrong project
- package or payload is bound to the wrong project
- cache is bound by path only
- budget or accounting records lack identity linkage
- provenance/history does not match the claimed source or destination identity
- restored-copy or migrated identity conflicts with current project identity
- project opened after path loss cannot be verified
- transition would silently reactivate protected, deleted, discarded, forgotten, AI-excluded, local-only, or export-blocked material

Refusal posture:

- The workflow must report `identity unresolved`, `conflict detected`, `transition refused`, `binding verification pending`, `partially rebound`, or `invalidated` as applicable.
- Unknown identity remains visibly unknown.
- Unknown binding status remains visibly unknown.
- The system must not resolve conflict by choosing the newest path, nearest file, most recent display name, most recent open window, active queue entry, or easiest implementation path.

## 8. Lifecycle

Architecture-level states:

- identity known
- identity transition proposed
- transition authorized
- rebinding pending
- partially rebound
- binding verification pending
- verified for stated scope
- conflict detected
- identity unresolved
- transition refused
- archived binding retained
- invalidated

State rules:

- `identity known` means identity witnesses support the project identity for the stated scope.
- `identity transition proposed` means a move, copy, restore, migration, rename, reopen, or multi-version opening has been detected or requested but not resolved.
- `transition authorized` means required author approval or owner authorization exists for the transition scope. It is not binding verification.
- `rebinding pending` means binding classes have not yet been fully classified.
- `partially rebound` means some bindings have been preserved or explicitly rebound while others remain invalidated, archived, refused, or unresolved.
- `binding verification pending` means no verified binding success claim may be made.
- `verified for stated scope` means the verification owner has verified the identity and binding claim for the named scope only.
- `conflict detected` means identity, owner, path, version, binding, or evidence conflict blocks safe continuation.
- `identity unresolved` means identity cannot be verified.
- `transition refused` means the transition is blocked under the contract.
- `archived binding retained` means the binding remains only as historical or evidence state.
- `invalidated` means the binding no longer supports active continuation or current claims.

These are architecture states only. They do not define state machines, tables, event buses, file markers, locks, or UI implementation.

## 9. Verification

Identity witness requirements:

- stable project identity witness
- source identity witness
- destination identity witness where applicable
- transition type classification
- version identity or compatibility posture where applicable
- source trail and provenance witness
- current-save or recovery witness where relevant
- binding inventory witness
- conflict scan witness
- unresolved binding report

Verification must include:

- before/after identity comparison
- before/after path and display-name comparison
- before/after version posture comparison
- binding inventory comparison
- active versus archived binding classification
- invalidated binding list
- explicitly rebound binding list
- duplicated binding list
- refused binding list
- unresolved binding report
- conflict and refusal report
- evidence class for each verification claim

Verification owner:

- `Project Identity Transition Verification Owner` owns verified-for-stated-scope claims for this family.
- Downstream domain owners verify their own family-specific claims when this contract hands off to later contracts.

Evidence class:

- Doctrine and synthesis define the architecture contract.
- Historical, harness, runtime, packaged, provider-reported, locally observed, manual witness, and unknown evidence remain distinct.
- Historical or harness evidence may inform later proof only when scoped accurately.
- Historical or harness evidence must not be presented as current packaged proof, operational readiness, release evidence, or implementation compliance.

Verification wording:

- Use `verified for stated scope`.
- Name the stated scope, identity witnesses, source identity, destination identity, transition type, binding classes checked, evidence class, environment or artifact where relevant, and unresolved exclusions.
- Do not claim `project moved`, `project copied`, `project restored`, `project migrated`, `bindings preserved`, `jobs safe`, `approval valid`, `cache valid`, `budget valid`, or `evidence transferable` unless the relevant identity and binding scope was verified.

Failure and refusal reporting:

- Failure reports must state which identity witness, binding class, evidence class, owner, or transition rule failed.
- Refusal reports must identify the blocked claim and downstream consequence.
- Unknown remains unknown rather than being treated as success, warning-only success, or default rebinding.

## 10. Downstream Handoffs

This contract defines project identity and binding handoff boundaries. It does not solve the later Stage 12 families.

Deployment and multi-install ownership:

- Define side-by-side build ownership, portable-copy ownership, downgrade or newer-state refusal, shared mutable-state boundaries, lock/conflict ownership, and multi-install verification.

Approval persistence:

- Define whether approval may persist, inherit, expire, revoke, or revalidate across project identity transitions.

Package and payload identity:

- Define package identity, hidden-context identity, payload alignment, package invalidation, and package evidence after identity transition.

Telemetry and cache governance:

- Define telemetry owner, generic-cache owner, allowed data classes, project-local versus aggregate cache boundaries, protected-content treatment, deletion, retention, and cache identity.

Queue attempt identity:

- Define queue job identity, execution-attempt identity, retry-attempt identity, cancellation states, retained failed/abandoned state, and duplicate-detection posture after transition.

Cost accounting:

- Define active budget scope, attempted spend, reconciled or unknown cost, provider-reported usage, restart persistence, and spend evidence after transition.

Evidence retention:

- Define minimum witnesses before cleanup, last-witness protection, pruning boundaries, and archived binding retention.

Model lifecycle:

- Define model identity, task-contract identity, qualification currentness, saved-workflow compatibility, retirement, replacement, local-model drift, and requalification after transition.

Provider-policy drift and external assurance:

- Define provider-policy invalidation, external deletion/cancellation/revocation assurance, and evidence limits where external state was bound to the old identity.

Hardware/resource protection:

- Define resource-pressure refusal and writing/persistence protection where transition verification, local model work, recovery, or migration could stress current writing or save.

## 11. Author-Policy Separation

Genuine later policy choices preserved:

- whether ordinary copies default to new identity, prompt for identity classification, or remain blocked until classified
- warning depth before binding refusal or archival-only retention
- recovery presentation depth for restored-copy and copied-project source trail
- archival visibility for old bindings, stale queue results, historical packages, old approvals, and prior cost records
- supported transition breadth for moves, copies, restore-as-copy, migration, rename, reopen after path loss, and multi-version opening
- display wording for conflict, unresolved identity, partial rebinding, and archived witnesses

Safety floors that are not optional policy:

- identity integrity is mandatory
- path, folder name, display name, nearby files, and successful opening are not identity authority
- no binding follows by convenience
- no queue, approval, package, cache, budget, model, result, deployment, or release-evidence claim silently survives identity change
- unknown identity remains visibly unknown
- conflicting identity fails closed
- evidence for one identity does not transfer to another identity without explicit verification
- author-owned truth cannot be mutated or rebound by identity convenience

## 12. Proof and Reopening

Later implementation-proof obligations:

- prove moved projects retain identity only when identity witnesses verify sameness
- prove copied projects, restored copies, migrated copies, and migrated new identities do not inherit active bindings by name, path, or proximity
- prove display-name change does not rebind identity
- prove path change alone does not create new identity
- prove reopen after path loss blocks or limits bindings until identity is verified
- prove multiple app versions cannot silently share mutable project ownership
- prove queued jobs, attempts, retries, cancellations, and result destinations do not survive the wrong identity
- prove approvals, packages, payloads, transmissions, budgets, caches, model references, provenance/history, recovery records, and evidence witnesses are preserved, explicitly rebound, invalidated, duplicated, archived, refused, or unresolved according to the contract
- prove unknown identity and unknown binding status remain visible
- prove historical, harness, runtime, packaged, provider-reported, locally observed, and manual witness evidence classes are labeled accurately

Reopening triggers:

- any architecture work that treats path, folder name, display name, nearby files, successful opening, or recent-file state as project identity authority
- any architecture work that permits active bindings to follow project move, copy, restore, migration, rename, path loss, or multi-version opening by convenience
- any architecture work that lacks a project-identity authority, transition workflow owner, binding-propagation owner, conflict-detection owner, or verification owner
- any architecture work that allows duplicate stable identifiers without fail-closed conflict handling
- any architecture work that allows queue result destination ambiguity
- any architecture work that allows approval, package, cache, budget, model, provenance/history, recovery, or evidence records to remain active without identity linkage
- any architecture work that hides unknown identity or unknown binding status
- any architecture work that treats historical, harness, development, or workflow evidence as current packaged or release proof
- any architecture work that conflicts with the Migration and Restored-Copy Identity contract's restored-copy, migration, preservation, refusal, rollback, or verification rules

Consequences:

- The affected transition or binding claim remains blocked.
- Architecture readiness for this family remains blocked if a missing owner, identity rule, transition rule, propagation rule, invalidation rule, conflict rule, or verification rule is exposed.
- Later implementation may not claim compliance for affected identity transition or binding behavior until current scoped proof exists.
- Release remains unauthorized for any affected claim.

Conditions showing architecture misclassification:

- current authority already defines project identity transition and binding propagation differently
- Stage 11 Q46 was misclassified as a Stage 12 architecture dependency despite a current structural contradiction
- the Family 1 migration/restored-copy contract cannot coexist with this project's transition and binding rules
- a required owner is missing or conflicting in a way Stage 12 cannot resolve without reopening Stage 11 classification
- source evidence shows active project-bound state may safely follow by path or display name, contradicting current doctrine

## 13. Contract Verdict

Stage 12 structural verdict:

- Project Identity Transition and Binding Propagation is structurally resolved for Stage 12 scope by this contract.
- Batch 4 Q46 now has named owners, identity transition rules, binding inventory, binding propagation rules, invalidation triggers, conflict and refusal posture, lifecycle states, verification rules, downstream handoffs, proof obligations, reopening triggers, and consequences if unresolved.
- This contract does not authorize implementation.
- This contract does not authorize release.
- This contract does not prove runtime, harness, packaged, operational, or release compliance.

Dependent contracts remaining:

- `Deployment Versioning, Portable Boundary, and Multi-Install Ownership`
- `Approval Persistence, Inheritance, and Revocation`
- `Package, Payload, and Hidden-Context Identity`
- `Telemetry and Generic-Cache Governance`
- `Queue Attempt Identity, Retry, Cancellation, and Retained State`
- `Cost Accounting and Budget Persistence`
- `Evidence Retention and Last-Witness Protection`
- `Model Qualification and Lifecycle`
- `Provider-Policy Drift and External Assurance`
- `Hardware Qualification and Resource-Pressure Protection`

Final bounded declaration:

- This Stage 12 family contract is ready for contract review.
- Implementation remains blocked.
- Release remains unauthorized.
