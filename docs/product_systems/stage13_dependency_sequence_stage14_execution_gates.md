# Stage 13 Dependency Sequence and Stage 14 Execution Gates

## 1. Purpose and authority
This plan defines the dependency order, package gates, evidence requirements, stop conditions, reopening triggers, and closure requirements for the five provisional Stage 14 salvage packages named in `docs/product_systems/stage13_salvage_disposition_matrix.md`.

It is planning only. It does not authorize Stage 14, does not authorize any package execution, and does not authorize implementation, cleanup, archive execution, deletion, provider/model execution, queue operation, or release work.

Current authority controls this plan. Runtime behavior remains evidence, not product authority.

## 2. Repository and Pass 10 checkpoint
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Pass 10 checkpoint: `634d1cb docs(product): define stage 13 salvage disposition matrix`

## 3. Planning limits
- No new broad repository sweep is performed here.
- This plan sequences only the five candidate packages already defined in the disposition matrix.
- `Verify` items remain unresolved unless a later Stage 14 package proves them within its bounded scope.
- Package completion does not authorize the next package automatically.
- Stage 14 remains unauthorized until Stage 13 is completed, reviewed, committed, pushed, closed, and explicitly approved by the author.

## 4. Package dependency graph
Primary graph:

`PKG-C Evidence/Witness` -> `PKG-A Identity/Persistence` -> `PKG-D Desktop/Packaging` -> `PKG-E Operational Governance` -> `PKG-B Surface Sovereignty`

Supporting dependency notes:
- `PKG-C` is the witness-protection root because later packages may alter or supersede runtime, layout, persistence, and operational evidence.
- `PKG-A` is the identity root because project binding, restored-copy handling, and persistence authority must be corrected before desktop, operational, or surface work can safely depend on them.
- `PKG-D` depends on `PKG-A` because installed/portable and packaged/dev claims cannot be evaluated safely while project or restored-copy identity is unresolved.
- `PKG-E` depends on `PKG-A` and `PKG-D` because provider/model/queue/cost/hardware flows must not inherit stale project, installation, approval, or packaged-state assumptions.
- `PKG-B` is sequenced last in the safe order because surface reduction must not outrun identity, evidence, desktop-boundary, or operational-boundary corrections.

## 5. Recommended execution sequence
Recommended safe order:

1. `PKG-C` Evidence lane and witness protection
2. `PKG-A` Runtime identity and persistence rebinding
3. `PKG-D` Desktop and packaging boundary rebinding
4. `PKG-E` Operational governance rebinding
5. `PKG-B` Surface sovereignty and coordinator reduction

Reasoning:
- witness protection must land before any package that could alter, supersede, or narrow current evidence
- identity and authority corrections must land before packaging, queue, provider, or surface work that depends on project binding
- packaging/install boundaries must be clarified before operational systems can safely reason about installation-scoped state, local-model safety, or packaged claims
- operational governance should be bounded before the final surface package reduces shells and rewires visible control points

## 6. Hard prerequisites
Shared hard prerequisites for every package:
- Stage 14 explicit author authorization
- bounded package scope declared before work starts
- repository checkpoint recorded and clean
- Stage 12 authority records available
- package-specific stop and reopening conditions documented
- no unresolved Stage 12 contradiction affecting the package

Package-specific hard prerequisites:
- `PKG-C`: none beyond the global entry gate
- `PKG-A`: `PKG-C` complete
- `PKG-D`: `PKG-C` and `PKG-A` complete
- `PKG-E`: `PKG-C`, `PKG-A`, and `PKG-D` complete
- `PKG-B`: `PKG-C`, `PKG-A`, `PKG-D`, and `PKG-E` complete in the recommended safe sequence

## 7. Parallel-work rules
Default rule: no package-level parallel execution is recommended for this package set.

Reason:
- the packages share identity, evidence, runtime-entry, preload, persistence, and status-surface dependencies
- package outputs can invalidate downstream assumptions in later packages
- the main risk families are authority inheritance and witness loss, which are harder to control under parallel mutation

Allowed limited parallelism:
- read-only evidence collection within a package may run in parallel when it does not alter evidence, bindings, or package scope
- bounded substreams inside a package may run in parallel only if they do not share authority records, mutation targets, or witness material

Not allowed in parallel:
- any two packages that both depend on unresolved project identity
- any package that changes evidence or witness posture in parallel with a package depending on that evidence
- any surface package running in parallel with an operational package that changes status, approval, cost, or fallback semantics for the same visible workflows

## 8. Shared dependencies
- Stage 12 Families 1-3 and 10 are shared across almost every package
- runtime root boundaries identified in `RT-01` are shared by packages A, D, E, and B
- retained witness material identified in `TEST-03` and `ENV-01` is shared by packages C, A, D, and E
- Stage 12 consolidated invalidation rules apply across all package transitions
- no package may assume that a prior package changed authority unless completion proof explicitly says so

## 9. Package definitions and entry gates

### PKG-C Evidence Lane and Witness Protection
- Objective: preserve bounded evidence value, prevent overclaim, and protect last necessary witnesses before later mutation packages run
- Included disposition items: `TEST-01`, `TEST-02`, `TEST-03`, `ENV-01`
- Prerequisite packages: none
- Prerequisite decisions: none beyond Stage 14 authorization and package-scope confirmation
- Required evidence:
  - current evidence-lane map
  - witness-role map
  - generated/environmental classification inputs
  - current commit binding for retained proof artifacts
- Allowed execution scope:
  - evidence-lane classification
  - witness protection and proof-lane boundary work
  - non-destructive evidence labeling or containment changes if later authorized
- Excluded work:
  - cleanup
  - archival execution
  - deletion
  - release-proof claims
  - broad reruns presented as release readiness
- Entry gate:
  - current witness set identified
  - no unresolved ambiguity about whether the package would destroy or replace evidence
  - Stage 12 family 10 available and current
- Stop conditions:
  - sole witness for a material claim cannot be preserved
  - evidence identity is ambiguous
  - a package proposes cleanup or archival execution
  - proof-lane scope cannot be stated precisely
- Reopening triggers:
  - evidence identity conflict
  - last-witness protection contradiction
  - claim-strength requirement impossible to satisfy
- Completion proof:
  - lane-by-lane claim-strength map recorded
  - retained witness set recorded
  - generated/environmental verify backlog updated
  - no material claim left dependent on an unlabeled or at-risk witness
- Downstream dependents: `PKG-A`, `PKG-D`, `PKG-E`, `PKG-B`

### PKG-A Runtime Identity and Persistence Rebinding
- Objective: rebind project loading, persistence, snapshot, backup, restore, recovery, and sample-alias behavior to Stage 12 identity and evidence floors
- Included disposition items: `RT-01`, `DATA-01`, `DATA-02`, `DATA-03`, `DATA-04`
- Prerequisite packages: `PKG-C`
- Prerequisite decisions:
  - witness-protection set accepted
  - no unresolved author-policy choice is being used as a substitute for identity rules
- Required evidence:
  - active caller map for project loading and persistence
  - identity-chain validation inputs
  - restore/copy semantics map
  - compatibility-root witness-role confirmation
- Allowed execution scope:
  - project identity binding correction
  - persistence authority correction
  - restore/copy/snapshot/recovery rebinding
  - fixture alias isolation
- Excluded work:
  - packaging/install changes
  - provider/model execution
  - queue implementation
  - cleanup and archive execution
  - release work
- Entry gate:
  - `PKG-C` completion proof accepted
  - Stage 12 families 1-3 and 10 available
  - source, destination, copy, and restored-copy identity chain is expressible for the bounded package scope
- Stop conditions:
  - any silent identity inheritance appears necessary
  - scene/chapter structures would need to become foundational truth owners
  - restore/copy boundaries cannot remain explicit
  - witness loss risk appears during rebinding
- Reopening triggers:
  - migration/copy identity contradiction
  - project-binding propagation gap
  - restored-copy identity cannot be resolved without breaking current doctrine
- Completion proof:
  - authoritative project-binding map recorded
  - sample-alias dependency retired outside fixture scope
  - compatibility roots either rebound or left as explicit verify items
  - restore/copy/materialized-sibling distinctions preserved in the package evidence
- Downstream dependents: `PKG-D`, `PKG-E`, `PKG-B`

### PKG-D Desktop and Packaging Boundary Rebinding
- Objective: separate dev launch, packaged launch, installed-instance, and portable-instance claims, and resolve duplicate Electron-path reachability
- Included disposition items: `DESK-01`, `DESK-02`
- Prerequisite packages: `PKG-C`, `PKG-A`
- Prerequisite decisions:
  - project identity and restored-copy handling are stable enough to reason about install/project boundaries
  - witness-protection controls cover launch artifacts and packaged evidence
- Required evidence:
  - active path map for main, preload, launch, and package entry points
  - packaged-versus-dev claim map
  - install/portable boundary map
  - duplicate path reachability evidence for `app/electron/**`
- Allowed execution scope:
  - desktop entry and launch-boundary rebinding
  - packaged/dev distinction work
  - install/portable identity-boundary correction
- Excluded work:
  - package build as release proof
  - installer execution as release approval
  - uninstall cleanup
  - release work
- Entry gate:
  - `PKG-A` completion proof accepted
  - Stage 12 family 3 available
  - project identity no longer depends on path or alias assumptions
- Stop conditions:
  - install identity collapses into project identity
  - packaged behavior must be inferred from development behavior
  - duplicate entry-path reachability cannot be proven or bounded
- Reopening triggers:
  - deployment boundary contradiction
  - multi-install ownership conflict
  - packaged evidence needed for a claim but unavailable without violating planning limits
- Completion proof:
  - dev, packaged, installed, and portable lanes explicitly separated
  - duplicate Electron path role classified as active, compatibility, or verify backlog
  - no package claim depends on path/name inheritance
- Downstream dependents: `PKG-E`, `PKG-B`

### PKG-E Operational Governance Rebinding
- Objective: rebind provider/model/transmission, queue semantics, telemetry/cache, cost/budget, and hardware/local-safety behavior to Stage 12 floors
- Included disposition items: `OPS-01`, `OPS-02`, `OPS-03`, `OPS-04`, `OPS-05`, `OPS-06`
- Prerequisite packages: `PKG-C`, `PKG-A`, `PKG-D`
- Prerequisite decisions:
  - project and installation identity boundaries are stable enough to prevent inherited operational authority
  - witness protection is active for telemetry, cost, and queue evidence
- Required evidence:
  - explicit fallback map
  - approval/budget/queue invalidation map
  - telemetry/cache classification map
  - hardware/runtime safety map
  - queue attempt identity and cancellation propagation evidence
- Allowed execution scope:
  - operational boundary rebinding
  - fallback and invalidation correction
  - cache/telemetry governance correction
  - queue and cost state rebinding
- Excluded work:
  - provider/model execution
  - benchmark runs
  - budget changes
  - telemetry cleanup
  - release claims
- Entry gate:
  - `PKG-D` completion proof accepted
  - Stage 12 families 4-12 available for the bounded operational scope
  - no unresolved project/install identity inheritance remains in the targeted operational surfaces
- Stop conditions:
  - silent provider substitution appears necessary
  - local refusal silently triggers remote escalation
  - queue state inherits stale approval or identity
  - unknown cost must be treated as zero to continue
  - telemetry or caches act as shadow truth
- Reopening triggers:
  - provider-policy contradiction
  - queue identity or cancellation contradiction
  - hardware or model qualification contradiction
  - cost-state contradiction
- Completion proof:
  - fallback classes recorded and bounded
  - approval/identity/cost/queue invalidation map recorded
  - telemetry/cache non-ownership preserved
  - hardware and model verify backlog narrowed or explicitly carried forward
- Downstream dependents: `PKG-B`

### PKG-B Surface Sovereignty and Coordinator Reduction
- Objective: restore a bounded two-surface shell with Writing Surface sovereignty, non-gating Command Center behavior, and optional Companion behavior
- Included disposition items: `RT-02`, `RT-03`, `UI-01`, `UI-02`, `UI-03`
- Prerequisite packages: `PKG-C`, `PKG-A`, `PKG-D`, `PKG-E`
- Prerequisite decisions:
  - operational boundary rules are stable enough that surface reductions do not encode stale status semantics
  - project identity and mutation paths are already explicit
- Required evidence:
  - workflow ownership map
  - explicit truth-mutation path map
  - current support-pane non-authority status
  - operational status-output constraints from `PKG-E`
- Allowed execution scope:
  - surface-boundary correction
  - coordinator reduction
  - Companion optionality and non-ownership preservation
  - writing-first shell rebinding
- Excluded work:
  - provider/model integration
  - packaging work
  - release-readiness work
  - cleanup or archive execution
- Entry gate:
  - `PKG-E` completion proof accepted
  - Stage 12 Writing Surface, Command Center, and Companion floors remain satisfiable for the bounded scope
  - explicit mutation paths are already protected by package A outputs
- Stop conditions:
  - Command Center becomes a truth owner or writing gate
  - Companion becomes required, authoritative, or acceptance-owning
  - scene-first or status-overclaim behavior would be preserved to make the package work
- Reopening triggers:
  - surface ownership contradiction
  - truth-mutation path contradiction
  - operational status contract contradiction
- Completion proof:
  - Writing Surface remains usable without AI, Companion, provider, or queue
  - Command Center remains support-only and non-gating
  - Companion remains optional, advisory, non-owning, and non-authoritative
  - coordinator reductions do not reintroduce stale identity or operational authority
- Downstream dependents: Stage 14 integration review and Stage 14 closure

## 10. Required evidence for each package
Minimum evidence bundle by package:
- `PKG-C`: claim-strength matrix, witness-role ledger, generated/environmental classification ledger
- `PKG-A`: identity-chain map, restore/copy semantics map, compatibility-root role map
- `PKG-D`: active entry-path map, packaged-versus-dev claim matrix, install/portable boundary matrix
- `PKG-E`: fallback matrix, invalidation-propagation map, queue identity/cancellation proof, telemetry/cache classification ledger, hardware/runtime safety map
- `PKG-B`: workflow ownership map, surface sovereignty proof, non-authority status map for Command Center and Companion, explicit mutation-path map

## 11. Stop conditions for each package
- `PKG-C`: witness loss risk, ambiguous evidence identity, proof-lane overclaim, cleanup/archive execution pressure
- `PKG-A`: silent identity inheritance, restore/copy ambiguity, scene-first truth dependency, witness-risk mutation
- `PKG-D`: install/project identity collapse, packaged-from-dev overclaim, unresolved duplicate runtime path collision
- `PKG-E`: silent provider/model fallback, stale approval inheritance, queue authority inheritance, unknown cost as zero, shadow-truth telemetry/cache, local-refusal remote escalation
- `PKG-B`: Command Center truth ownership, Companion authority, scene-first regression, unsupported status certainty, writing-surface operational takeover

## 12. Completion evidence for each package
- `PKG-C`: witness ledger, lane-claim matrix, verify carry-forward list
- `PKG-A`: identity-binding map, sample-alias retirement evidence, restore/copy distinction proof
- `PKG-D`: packaged/dev/install/portable boundary proof, duplicate-path role proof
- `PKG-E`: invalidation map, fallback map, queue/cost/telemetry/hardware boundary proof
- `PKG-B`: surface sovereignty proof, non-gating Command Center proof, optional Companion proof

Package completion is valid only for the stated scope and evidence class. No package completion proves general release readiness.

## 13. Cross-package invalidation rules
- if `PKG-A` changes project identity semantics, all downstream package evidence tied to prior project-binding assumptions must be revalidated
- if `PKG-D` changes install/portable/runtime path classification, `PKG-E` hardware/local-model and `PKG-B` status-surface assumptions must be revalidated
- if `PKG-E` changes fallback, queue, budget, or telemetry semantics, `PKG-B` must revalidate status language and support-surface behavior
- if `PKG-C` reclassifies a retained artifact as the last necessary witness, no downstream package may supersede, archive, or remove it without replacement witness proof
- any package discovering a Stage 12 contradiction invalidates downstream sequencing until the contradiction is routed and resolved

## 14. Stage 12 reopening triggers
- silent project-identity inheritance across copy, restore, migration, install, or fixture alias paths
- any package requiring scenes or chapters to act as foundational truth owners
- any package requiring stale approvals, queue records, model qualification, or budget state to remain active by inheritance
- any provider/model fallback that cannot remain explicit and revalidated
- any local-refusal path that silently authorizes remote escalation
- any cleanup/archive step needed before Stage 16
- any last-witness loss condition required to continue work

## 15. Author-policy decisions still required
- provider breadth and risk tolerance
- model breadth and qualification depth
- retry breadth and cancellation presentation
- spend thresholds and warning depth
- telemetry retention breadth and cache retention depth
- hardware support floor and degradation posture
- archive visibility and long-term history depth

These remain policy decisions. No package may resolve them by architectural assumption.

## 16. Work explicitly deferred
- Stage 14 authorization
- Stage 16 archive and cleanup execution
- release work and release evidence claims
- implementation technology selection
- provider/model live execution
- hardware benchmarking
- budget changes
- broad test reruns presented as release proof

## 17. Stage 14 global entry gate
Stage 14 may begin only when all of the following are true:
- Stage 13 is completed, reviewed, committed, pushed, and closed
- explicit author authorization for Stage 14 has been granted
- the selected Stage 14 package scope is bounded and named
- repository checkpoint is clean and recorded
- package prerequisites are satisfied
- required authority and evidence are available
- package stop conditions and reopening triggers are documented
- no unresolved Stage 12 contradiction affects the package

## 18. Stage 14 global stop conditions
- repository gate mismatch
- unresolved Stage 12 contradiction
- missing or ambiguous authority chain
- evidence weaker than the claim required by the package
- witness-protection failure
- package scope broadening beyond the approved bounded objective
- execution pressure to perform archive, cleanup, deletion, or release work outside package scope
- any discovery that package completion would silently authorize the next package

## 19. Stage 14 closure prerequisites
- every executed package has scoped completion proof
- all package-level verify carry-forwards are named and bounded
- no package left an unresolved Stage 12 contradiction un-routed
- no witness required for a material claim has been lost or invalidated
- no author-policy choice has been silently resolved by implementation
- Stage 14 closure record distinguishes completed work, deferred work, and any remaining verify items

## 20. Recommended next Stage 13 pass
Recommended next bounded pass: cross-pass integration review and consolidated Salvage Completion Plan.

That pass should:
- test the package order and gate logic against the full Stage 13 record set
- confirm that no inventory or matrix item remains un-routed
- assemble the consolidated Stage 13 closure-ready plan without authorizing Stage 14
