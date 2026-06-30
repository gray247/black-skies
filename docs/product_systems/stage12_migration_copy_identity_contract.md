# Stage 12 Migration and Restored-Copy Identity Contract

Status: Stage 12 family contract for Migration and Restored-Copy Identity.

Current posture:

- Stage 12 is active.
- Implementation remains blocked.
- Release remains unauthorized.
- This record defines architecture contracts only. It does not implement migration, restore, rollback, schemas, storage formats, libraries, database behavior, file formats, packaging behavior, or runtime verification.

## 1. Scope

This contract covers the Stage 12 family `Migration and Restored-Copy Identity`.

Primary Stage 11 dependencies covered:

- Batch 2 Q13: migration must not corrupt, discard, merge, or silently reinterpret accepted project truth.
- Batch 2 Q14: migration must not preserve prose while losing ownership, provenance, history, or acceptance state.
- Batch 2 Q20: restored-copy identity must be resolved before restore-as-copy can be architecture-ready.

Secondary dependencies preserved:

- Batch 4 Q46: project moves, restores, copies, renames, and migrations constrain queue, cache, result, approval, package, budget, provenance, and history bindings.
- Batch 5 Q52, Q53, and Q54: side-by-side versions, downgrade or newer-state refusal, and portable-copy ownership depend on stable project identity, migration identity, and restored-copy identity.
- Batch 5 Q40, Q42, Q43, Q63, Q66, Q72, Q73, Q74, Q75, and Q76 preserve release, rollback, artifact, evidence, and readiness consequences without changing this family's primary count.

Definitions:

- Migration: an owner-governed transformation or compatibility transition from one project state, project format, or version identity into another project state, project format, or version identity.
- Restore: an owner-governed recovery operation from a recoverable source into either current project state or a separate recovered object.
- Restore as copy: a restore mode that creates a separate project copy or recovered project object and does not replace the current project.
- Project move: a location change for the same project identity, when identity is verified and no architecture rule forces a new identity.
- Project copy: creation of a distinct project identity from an existing project or recoverable source.
- Version transition: a change in project data version, application version, compatibility window, or interpretation contract that may require compatibility evaluation, migration, refusal, or restore-as-copy.

Required distinctions:

- Save is durable confirmation of current editable local writing state by `Project Persistence / Local Save`.
- Snapshot is historical evidence, not current-save success and not current truth.
- Backup is recovery-oriented evidence or copy, not proof of recoverability by itself.
- Archive is a transfer or escape artifact, not current truth and not automatically a backup.
- Export is an outward transfer artifact and does not own accepted truth or recovery guarantees.
- Import is staged or candidate intake until explicit owner acceptance.
- Restore is governed recovery and may be restore-as-current or restore-as-copy.
- Restore as copy is separate from current state and requires its own identity.
- Migration is compatibility transformation and does not gain truth authority.
- Verification is evidence that a stated scope was checked; it is not creation, copying, parsing, opening, or visual inspection.

## 2. Ownership

Named owners for this contract:

- Migration workflow owner: `Migration / Compatibility Workflow`, a Stage 12 contract owner responsible for migration preflight, authorization boundary, refusal posture, failure containment, rollback claim limits, and migration-success wording.
- Source-project identity authority: `Project Identity Authority`, operating with `Project Persistence / Local Save` for durable project-local identity and with the existing truth owners for accepted project truth.
- Destination-project identity authority: `Project Identity Authority`, operating with `Project Persistence / Local Save` for destination identity, destination save destination, and identity-binding claims.
- Restored-copy identity authority: `Snapshots / Backup / Restore / History` for recovery source and restore-copy creation, with `Project Identity Authority` for the new restored-copy identifier and `Project Persistence / Local Save` for any durable save destination.
- Compatibility/version authority: `Migration / Compatibility Workflow` for project-data compatibility decisions in this family, with downstream handoff to `Deployment Versioning, Portable Boundary, and Multi-Install Ownership` for install, downgrade, side-by-side, portable-copy, and application-version ownership.
- Verification owner: `Migration / Recovery Verification Owner`, applying `Testing / Harness / Evidence Contract` evidence-class rules and reporting only verified-for-stated-scope claims.

Preserved doctrine:

- The author remains final authority over project truth.
- Accepted manuscript truth remains owned by `Narrative Assertion / Narrative Insertion` and other explicit truth owners, not by migration.
- Migration does not grant a new truth authority and does not convert evidence, history, provenance, advisory output, imported material, or recovered material into accepted truth.
- Tools, models, queues, package builders, deployment forms, and provider systems do not own project identity.
- The Writing Surface remains sovereign for ordinary writing; support surfaces may expose recovery or migration status but do not own recovery truth or project truth.

## 3. Identity Contract

Stable project identifier:

- A project must have an authoritative project identity that is distinct from file path, folder name, display name, package name, visible title, successful opening, and nearby files.
- The stable project identifier is the identity key used for project-local binding decisions across save, recovery, migration, queue, cache, approval, package, budget, provenance, and evidence records.
- This contract does not select the storage form or schema of that identifier.

Source identity:

- The source identity is the verified project identity of the object being migrated, moved, copied, restored, or inspected.
- Source identity includes project identifier, project-local state boundary, source version identity, truth owner identities, provenance and history relationship, acceptance state, protected-content state, and relevant binding references.

Destination identity:

- The destination identity is the verified project identity of the target object after migration, move, copy, or restore.
- Destination identity must be explicitly classified as same project, new project, restored copy, migrated replacement, migrated copy, or unresolved.

Restored-copy identity:

- A restored copy receives a distinct project identity unless a later explicitly authorized contract proves that the restored object is only a temporary non-project inspection object.
- Restore as copy does not replace the current project, does not inherit active queue execution by convenience, and does not reuse current project identity merely because the content is similar.
- A restored copy must retain visible source trail, recovery source type, provenance relationship, history relationship, and verification status.

Moved-project behavior:

- A project move may preserve the same project identity only after identity is verified.
- Path change alone must not silently create a new project identity.
- Path change alone must not silently rebind queues, caches, approvals, packages, budgets, model references, or evidence.

Copied-project behavior:

- A project copy is a distinct project identity unless explicitly classified as non-project evidence or temporary inspection state.
- A copy does not inherit active approvals, active queued jobs, package approvals, budgets, cache validity, deployment identity, or release evidence by default.
- Copied provenance and history may remain visible as source trail but do not become proof that every downstream binding remains valid.

Display name versus identity:

- Display name is presentation.
- Display-name change alone must not silently rebind project identity.
- Two projects may not be treated as identical because their display names match.

Path versus identity:

- Path is location.
- Path, folder name, nearby files, successful file opening, recent-file lists, or shell ownership do not independently prove project identity.

Version identity:

- Version identity names the project-data interpretation contract and compatibility posture.
- Version identity is distinct from application version, release artifact name, display label, and package filename.
- Version identity must be checked before migration, downgrade, restore-as-current, or any compatibility claim.

Unresolved-identity state:

- If source identity, destination identity, restored-copy identity, or version identity cannot be verified, the state is `identity unresolved`.
- Identity-unresolved state blocks migration success, restore-as-current success, inherited bindings, queued-job continuation, package reuse, release evidence transfer, and current compatibility claims for the affected object.

## 4. Preservation Contract

Migration, restore-as-current, restore-as-copy, project copy, and version transition must explicitly preserve or explicitly refuse each applicable item below:

- accepted manuscript truth
- accepted `Narrative Assertion / Narrative Insertion` state
- other accepted project truth owner state
- ownership
- provenance
- history
- acceptance state
- protected-content state
- metadata
- project-local identity
- queue bindings
- cache bindings
- package and approval bindings
- budget and accounting bindings
- evidence and recovery witnesses
- version identity and compatibility posture
- recovery source trail
- source and destination relationship

Preservation rules:

- Preserving prose alone is not successful migration.
- Missing, incompatible, partial, unreadable, stale, unsupported, downgraded, or unrepresentable state must not be silently normalized.
- The workflow must either preserve the item for the stated destination identity or refuse with visible reason and consequence.
- If a state can be preserved only as historical evidence, provenance, or warning, it must not be presented as active accepted truth.
- Protected-content state must fail closed for transfer, restore, migration, diagnostics, evidence, and package exposure.
- Existing source project state must remain preserved until a governed replacement boundary has completed and been verified for the stated scope.

## 5. Lifecycle

Allowed architecture states:

- not evaluated
- preflight
- compatible
- incompatible
- migration prepared
- migration authorized
- migration running
- migration interrupted
- migration failed
- migration completed
- verification pending
- verified for stated scope
- verification failed
- rollback pending
- rolled back
- restored as copy
- identity unresolved

State rules:

- `not evaluated` means no compatibility, preservation, identity, or verification claim exists.
- `preflight` may inspect identity, source type, version, compatibility, preservation needs, and refusal conditions; it does not mutate accepted truth.
- `compatible` means the compatibility/version authority has found the stated transition eligible for the stated scope.
- `incompatible` means migration, restore-as-current, or downgrade-like interpretation must fail closed unless a later governed restore-as-copy path is available.
- `migration prepared` means the workflow has a source, destination, preservation plan, refusal plan, rollback claim limit, and verification plan. It is not authorization.
- `migration authorized` requires explicit author approval where current truth, project identity, destination identity, preservation limits, downgrade posture, or destructive replacement is affected.
- `migration running` carries no success claim.
- `migration interrupted` is a visible non-success state.
- `migration failed` is a visible non-success state and must identify whether source, destination, or identity is still trustworthy.
- `migration completed` means the transformation action ended. It is not verified success.
- `verification pending` means no final success claim may be made.
- `verified for stated scope` is the only success wording allowed after verification, and it must name the scope.
- `verification failed` blocks success claims and binding inheritance.
- `rollback pending` means recovery or rollback has not been completed or verified.
- `rolled back` may be claimed only for the stated scope actually verified.
- `restored as copy` means a separate object exists with restored-copy identity rules applied.
- `identity unresolved` blocks continuation, inherited bindings, and success claims.

These states are architecture vocabulary only. They do not select state machines, schemas, storage engines, transactions, queues, or UI mechanics.

## 6. Authorization and Refusal

Explicit author approval is required when a workflow would:

- replace current project state
- mutate accepted truth or acceptance state
- transform project identity
- create a migrated replacement
- create or retain a restored copy as a new project
- drop, downgrade, quarantine, or mark unsupported any accepted truth, provenance, history, protected-content state, metadata, or project-local identity
- rebind approvals, queues, packages, budgets, caches, evidence, model references, or recovery witnesses
- continue after an interruption, partial result, rollback uncertainty, or identity uncertainty

Fail-closed conditions:

- source identity cannot be verified
- destination identity cannot be verified
- restored-copy identity cannot be classified
- version identity or compatibility is unknown
- migration would silently reinterpret accepted truth
- migration would discard accepted truth, ownership, provenance, history, acceptance state, protected-content state, project-local identity, or required evidence
- downgrade or older-build interpretation would silently reinterpret newer project state
- a newer project state is opened by an older or incompatible version without a defined refusal posture
- conflicting identity appears between source, destination, copy, moved project, restored copy, or installed form
- concurrent ownership or lock conflict exists
- active queue, package, approval, cache, budget, model, or deployment binding cannot be revalidated
- verification owner cannot perform the required verification for the stated claim

Restore as copy is required instead of in-place mutation when:

- source compatibility is uncertain but inspection may remain useful
- in-place mutation could overwrite the only known good state
- source and destination identity cannot safely be proven the same
- partial preservation is possible but current truth replacement would overclaim success
- downgrade, newer-state, or unsupported-state risk exists
- the author chooses non-destructive recovery after seeing the consequences

No silent fallback is allowed:

- no silent normalization
- no silent downgrade
- no silent project rebinding
- no silent identity reuse
- no silent approval reuse
- no silent queue continuation
- no silent cache reuse
- no silent package or evidence inheritance
- no silent migration through update, rollback, repair, import, export, or portable-copy behavior

Unknown compatibility posture is a refusal or blocked state, not a warning-only success path.

## 7. Failure, Rollback, and Recovery

Interrupted migration:

- An interrupted migration is non-success.
- The workflow must visibly identify whether source state, destination state, identity, and preservation status are known, unknown, failed, or verification pending.
- Interrupted migration must not leave current truth partially mutated without visible non-success state and recovery posture.

Partial-write posture:

- Partial writes, partial copies, partial parsing, partial import, partial restore, and partial migration are not completion.
- Partial destination state must remain visibly partial, failed, quarantined, or identity unresolved until verified for a narrower stated scope or refused.

Rollback responsibility:

- The `Migration / Compatibility Workflow` owns rollback claim limits for migration actions.
- `Project Persistence / Local Save` owns current-save confirmation after any restore-as-current or migrated replacement that claims durable current project state.
- `Snapshots / Backup / Restore / History` owns recovery source and restore-copy records.
- The `Migration / Recovery Verification Owner` owns evidence that rollback or recovery was verified for the stated scope.

Original source preservation:

- The original source project must remain untouched when the workflow is inspection-only, preflight-only, restore-as-copy, migration-copy, or compatibility-uncertain.
- The original source project must remain preserved or recoverable before destructive replacement.
- If source preservation cannot be guaranteed, in-place migration or restore-as-current must fail closed.

Recovery evidence:

- Recovery evidence must identify source object, destination object, source version identity, destination version identity, action attempted, interruption or failure state, rollback claim, verification scope, evidence class, environment, and unresolved unknowns.
- Recovery evidence is evidence, not project truth.

Unknown-state visibility:

- Unknown source state, unknown destination state, unknown identity, unknown compatibility, unknown preservation, unknown rollback, and unknown verification must remain visibly unknown.

Rollback cannot be claimed complete when:

- source identity is unverified
- destination identity is unverified
- any partially written destination remains unclassified
- original source preservation is unknown
- compatibility or version identity remains unresolved
- accepted truth, ownership, provenance, history, protected-content state, or metadata preservation is unknown
- verification is missing, failed, stale, historical-only, or outside stated scope

Restore completion does not equal verified recovery. Completed restore action, copied data, successful parsing, successful opening, and visible manuscript text are not sufficient verification.

## 8. Verification

Verification must check, where applicable:

- source identity
- destination identity
- restored-copy identity
- moved or copied project classification
- project-data version identity
- compatibility posture
- accepted truth preservation
- `Narrative Assertion / Narrative Insertion` preservation
- ownership preservation
- provenance and history preservation
- acceptance state preservation
- protected-content state preservation
- metadata preservation
- project-local identity preservation
- queue, cache, approval, package, budget, evidence, recovery, model, and deployment binding disposition
- source/destination comparison
- refusal or quarantine outcome
- rollback or recovery claim
- unknown-state reporting

Verification owner:

- The `Migration / Recovery Verification Owner` verifies migration, restore-copy, rollback, and recovery claims for the stated scope.
- Domain owners verify their own downstream binding disposition when this family hands off to later families.

Evidence class:

- Doctrine and synthesis define the contract.
- Workflow-boundary proof may support the distinction between restore-as-current, restore-as-copy, inspection, recovery re-entry, archive, export, backup, and snapshot.
- Historical, harness, runtime, development, or packaged evidence may inform later proof only when scoped accurately.
- Provider-reported or locally observed evidence may support later proof only for the claim it actually observed.
- Unknown remains unknown.

Verification wording:

- Use `verified for stated scope`.
- Name the stated scope, source, destination, version identity, evidence class, environment, timestamp or record identity, and unresolved exclusions.
- Do not use unqualified `migration successful`, `recovery successful`, `rollback complete`, `compatible`, or `safe` when verification is partial, pending, stale, historical, harness-only, or outside scope.

Historical or harness evidence must not be presented as current packaged proof, current release evidence, operational readiness, or implementation compliance.

## 9. Downstream Bindings

This family defines handoff boundaries only. It does not fully solve the later Stage 12 families.

Queued jobs:

- Queued jobs must not follow a migrated, moved, copied, restored, renamed, or identity-unresolved project by convenience.
- Handoff to `Project Identity Transition and Binding Propagation` and `Queue Attempt Identity, Retry, Cancellation, and Retained State`.

Cached results:

- Cache bindings must be invalidated, retained as historical evidence, or explicitly revalidated against source identity, destination identity, version identity, and protected-content state.
- Handoff to `Telemetry and Generic-Cache Governance` and project-identity transition work.

Approvals:

- Approvals do not automatically survive migration, restore-as-copy, copy, downgrade, or identity transition.
- Handoff to `Approval Persistence, Inheritance, and Revocation`.

Packages:

- Packages and hidden-context payloads do not inherit validity from migrated or restored content unless package identity and payload identity are revalidated.
- Handoff to `Package, Payload, and Hidden-Context Identity`.

Transmission records:

- Transmission records remain evidence of a prior transmission scope and do not authorize new outbound work after identity or version transition.
- Handoff to approval, package, provider-policy, queue, and evidence-retention contracts.

Budgets and costs:

- Budget scope, accounting state, attempted spend, provider-reported usage, local observation, and restart reconciliation must not silently rebind to a restored or migrated identity.
- Handoff to `Cost Accounting and Budget Persistence`.

Model qualification references:

- Model qualification, saved workflow assumptions, local-model assumptions, and queued model references must be revalidated or invalidated after identity or version transition.
- Handoff to `Model Qualification and Lifecycle`.

Provenance and history:

- Provenance and history remain evidence and source trail, not truth authority.
- Migration and restore must preserve, quarantine, or visibly refuse provenance and history disposition.
- Handoff to evidence-retention work where pruning or last-witness removal is involved.

Recovery records:

- Recovery records must identify source, destination, restored-copy identity, action, verification scope, and unresolved unknowns.
- Handoff to `Evidence Retention and Last-Witness Protection` for retention minima and last-witness pruning boundaries.

Installed and portable version ownership:

- Application version, installation identity, portable copy, side-by-side build, and downgrade behavior do not own project identity by default.
- Handoff to `Deployment Versioning, Portable Boundary, and Multi-Install Ownership`.

## 10. Author-Policy Separation

Genuine later policy choices preserved:

- retention duration for recovery, migration, and verification witnesses beyond mandatory last-witness protection
- warning depth before refusing or offering restore-as-copy
- override depth for non-destructive inspection, restore-as-copy, and unsupported-state quarantine
- supported version breadth and compatibility window
- presentation depth for source trail, provenance, verification results, and unresolved state
- whether future migration-copy modes are offered in addition to restore-as-copy

Safety floors that are not optional policy:

- no silent truth mutation
- no silent project identity mutation
- no silent downgrade or destructive normalization
- no false migration, restore, rollback, or verification success
- no in-place mutation when identity, compatibility, source preservation, or rollback is unknown
- no inherited queues, approvals, packages, budgets, caches, model references, or release evidence by convenience
- no historical or workflow evidence presented as current packaged or release proof
- no protected-content leakage through migration, restore, evidence, diagnostics, package, or export boundaries

## 11. Proof and Reopening

Later implementation-proof obligations:

- prove source, destination, restored-copy, moved-project, copied-project, and version identity are not inferred from path, name, successful opening, or nearby files
- prove migration cannot silently reinterpret, discard, merge, or normalize accepted truth
- prove prose preservation alone is not reported as migration success
- prove ownership, provenance, history, acceptance state, protected-content state, metadata, project-local identity, and required witnesses are preserved, refused, or visibly quarantined
- prove restore-as-copy creates or classifies a distinct identity and does not replace current state
- prove restore-as-current requires explicit author approval and current-save confirmation
- prove interrupted, partial, failed, and identity-unresolved states remain visible and non-success
- prove rollback and recovery claims are limited to the verified scope
- prove downstream bindings are invalidated, blocked, or handed off rather than silently inherited
- prove historical, harness, development, runtime, packaged, provider-reported, and locally observed evidence classes are labeled accurately

Reopening triggers for this Stage 12 family:

- any architecture work that permits migration without named migration owner, identity authority, compatibility authority, or verification owner
- any architecture work that treats path, folder name, display name, successful opening, or nearby files as project identity proof
- any architecture work that allows silent downgrade, destructive normalization, or newer-state reinterpretation
- any architecture work that allows migration or restore to mutate accepted truth without explicit author approval
- any architecture work that lets restored-copy identity remain unresolved while claiming architecture readiness
- any architecture work that treats copied, parsed, opened, or staged data as verified recovery
- any architecture work that allows queue, cache, approval, package, budget, model, evidence, recovery, or deployment bindings to follow a migration or restored copy by convenience
- any architecture work that presents historical, workflow, harness, or development evidence as current packaged or release evidence
- any architecture work that removes the visible unknown state for identity, compatibility, preservation, rollback, or verification
- any architecture work that exposes protected content through migration, restore, diagnostics, evidence, package, import, or export behavior

Consequence of failed proof:

- The affected migration, restore, rollback, identity, preservation, binding, compatibility, or evidence claim remains blocked.
- Architecture readiness for this family remains blocked if the failure shows a missing owner, identity rule, lifecycle rule, refusal rule, recovery rule, or verification rule.
- Later implementation may not claim compliance for the affected behavior until current scoped proof exists.
- Release remains unauthorized for any affected claim.

Conditions that reopen Stage 11 classification:

- evidence of missing or conflicting ownership that this contract cannot resolve without contradicting Stage 11 routing
- structural contradiction between this contract and current doctrine
- proof that Batch 2 Q13, Q14, or Q20 was misclassified as Stage 12 architecture dependency rather than confirmed structural contradiction
- current authority conflict showing migration, restore, or restored-copy identity is already governed differently
- authority conflict showing accepted truth, author authority, Writing Surface sovereignty, evidence-class separation, or project identity ownership has changed

## 12. Contract Verdict

Stage 12 structural verdict:

- Migration and Restored-Copy Identity is structurally resolved for Stage 12 scope by this contract.
- Batch 2 Q13, Q14, and Q20 now have named owners, identity rules, preservation rules, lifecycle states, authorization and refusal posture, failure and recovery posture, verification rules, downstream handoff boundaries, proof obligations, reopening triggers, and consequences if unresolved.
- This contract does not authorize implementation.
- This contract does not authorize release.
- This contract does not prove runtime, harness, packaged, operational, or release compliance.

Dependencies remaining for later Stage 12 families:

- `Project Identity Transition and Binding Propagation` must define full binding propagation across move, restore, copy, rename, migration, and project identity transition.
- `Deployment Versioning, Portable Boundary, and Multi-Install Ownership` must define side-by-side installs, portable-copy ownership, downgrade refusal, newer-state refusal, and install/version ownership.
- `Queue Attempt Identity, Retry, Cancellation, and Retained State` must define queued-job identity and continuation or refusal after project identity transition.
- `Approval Persistence, Inheritance, and Revocation` must define whether any approval survives identity or version transition.
- `Package, Payload, and Hidden-Context Identity` must define package invalidation and payload identity after migration or restore.
- `Telemetry and Generic-Cache Governance` must define cache and telemetry retention or invalidation boundaries.
- `Cost Accounting and Budget Persistence` must define budget and spend-state disposition after migration, restore, copy, or identity transition.
- `Evidence Retention and Last-Witness Protection` must define retention minima for migration, recovery, rollback, transmission, spend, and verification witnesses.
- `Model Qualification and Lifecycle` must define model-reference invalidation after project-data or identity transition.
- `Provider-Policy Drift and External Assurance` must define provider-side assurance limits where external state is part of recovery, transmission, deletion, cancellation, or retention evidence.
- `Hardware Qualification and Resource-Pressure Protection` must define resource-pressure refusal and writing/persistence protection for any later local migration or recovery execution.

Final bounded declaration:

- This Stage 12 family contract is ready for contract review.
- Implementation remains blocked.
- Release remains unauthorized.
