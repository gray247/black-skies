# Stage 13 Salvage Completion Plan

## 1. Purpose and controlling authority
This is the controlling consolidated Stage 13 Salvage Completion Plan.

It consolidates the Stage 13 program, inventories, disposition matrix, dependency sequence, and cross-pass integration audit into one planning record.

It is planning only. It does not authorize Stage 14, does not execute any salvage package, and does not authorize implementation, migration, packaging, archive execution, cleanup, deletion, or release work.

Current authority controls this plan. Runtime behavior remains evidence, not product authority.

## 2. Repository and Stage 13 checkpoints
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified Stage 12 closure checkpoint: `62ad8b4 docs(product): close stage 12 architecture readiness contract`
- Stage 13 program checkpoint: `332d1a6 docs(product): define stage 13 salvage completion plan program`
- Stage 13 disposition matrix checkpoint: `634d1cb docs(product): define stage 13 salvage disposition matrix`
- Stage 13 dependency/gate checkpoint: `1d93232 docs(product): define stage 14 dependency sequence and execution gates`
- Stage 13 cross-pass integration audit checkpoint: `899b3c0 docs(product): audit stage 13 cross-pass integration`

## 3. Scope and exclusions
Stage 13 scope:
- define the controlling salvage plan
- preserve current-authority versus historical-evidence separation
- summarize inventory findings
- state provisional dispositions
- define the five candidate Stage 14 packages
- define package order, evidence requirements, stop conditions, reopening triggers, and global entry gates

Stage 13 exclusions:
- no Stage 14 execution
- no runtime, GUI, schema, provider, model, queue, telemetry, cache, packaging, launcher, or migration implementation
- no data mutation
- no test repair or runtime repair
- no archive, cleanup, deletion, or relocation
- no release work

## 4. Authority stack
Authority order for this consolidated plan:
1. `docs/product_systems/current_truth_index.md`
2. `docs/product_systems/current_product_roadmap.md`
3. `docs/product_systems/pre_code_discovery_plan.md`
4. `docs/product_systems/stage12_architecture_readiness_contract_program.md`
5. `docs/product_systems/stage12_cross_family_integration_audit.md`
6. `docs/product_systems/stage12_architecture_readiness_contract.md`
7. `docs/product_systems/stage12_architecture_readiness_contract_closure.md`
8. relevant Stage 12 family contracts for bounded identity, evidence, deployment, approval, provider, queue, telemetry, cost, hardware, and model rules
9. accepted Stage 13 records
10. historical runtime, audit, prototype, test, and salvage evidence only after the current-authority frame is known

## 5. Current-versus-historical distinction
Current authority:
- accepted product-system governance
- Stage 12 contracts and closure
- accepted Stage 13 program, inventories, matrix, dependency/gate plan, and integration audit

Historical evidence:
- historical Phase 29 and Phase 32 salvage records
- old runtime structure
- historical tests, reports, fixtures, branches, screenshots, and audit records
- observed runtime behavior

Historical evidence may inform risk, witness value, or later verification. It does not independently establish product truth, architecture authority, implementation selection, or release readiness.

## 6. Salvage doctrine
This plan preserves these rules:
- the author is final authority over project truth
- AI remains advisory and may not silently mutate project truth
- Narrative Assertion / Narrative Insertion remains foundational
- scenes and chapters remain projections, containers, views, or compatibility surfaces
- Writing Surface and Command Center remain distinct
- Companion remains optional, advisory, non-owning, and non-authoritative
- runtime behavior is evidence, not authority
- passing tests prove only their exercised lane
- unknown state remains visible
- missing or ambiguous authority fails closed
- no silent identity, approval, qualification, queue, cost, or authority inheritance
- `Retire` does not mean delete
- `Archive later` remains deferred to Stage 16
- Stage 13 closure makes Stage 14 eligible, not authorized
- implementation and release remain blocked

## 7. Inventory findings summary
The completed Stage 13 inventories established:
- current authority is sufficient to plan salvage without reopening Stage 12 at audit time
- historical Phase 32 material retains witness value but does not regain active authority
- runtime roots, persistence, desktop boundaries, surface shells, and operational systems remain needed capabilities but require rebinding to Stage 12 floors
- evidence lanes remain useful only when lane-bound and witness-protected
- sample-project alias dependence outside explicit fixture lanes must stop guiding live identity handling
- queue, hardware, duplicate Electron-path, compatibility-root, and generated-environmental families remain evidence-thin and require `Verify`
- last-witness protection must precede any cleanup-adjacent or evidence-altering work

## 8. Disposition totals and rationale
Current authority is excluded from salvage totals.

Disposition totals:
- Preserve: `0`
- Preserve with constraints: `13`
- Replace: `3`
- Retire: `2`
- Verify: `5`
- Archive later: `1`

Rationale summary:
- `Preserve with constraints` applies where the capability remains needed but only after identity, evidence, deployment, surface, or operational rebinding
- `Replace` applies where the capability remains needed but the current structural shape conflicts materially with current doctrine
- `Retire` applies where an active planning or runtime dependence must stop guiding future work
- `Verify` applies where evidence is insufficient for a stronger disposition
- `Archive later` applies only to historically valuable witness material, with execution deferred to Stage 16

## 9. Verify backlog
- `VERIFY-01` `.snapshots/**` and related compatibility manifests
  - unresolved active role versus compatibility-only role
  - resolving stage: Stage 14 package A
- `VERIFY-02` `app/electron/**` and other duplicate Electron entry-like paths
  - unresolved active reachability and witness role
  - resolving stage: Stage 14 package D
- `VERIFY-03` queue/attempt/retry/cancellation runtime family
  - insufficient structural evidence for preserve/replace/retire
  - resolving stage: Stage 14 package E
- `VERIFY-04` hardware qualification/runtime safety family
  - doctrine stronger than direct runtime evidence
  - resolving stage: Stage 14 package E
- `VERIFY-05` generated/environmental artifacts without established witness role
  - cleanup planning unsafe without witness classification
  - resolving stage: Stage 16 preparation

## 10. Replace backlog
- `REPL-01` large renderer and shell coordinators
- `REPL-02` Command Center, dock, and split-command operational shells
- `REPL-03` Companion overlay shape

These remain provisional replacements of structure, not of the bounded capabilities themselves.

## 11. Retire and Archive-later register
- `RA-01` historical Phase 32 and Phase 29 record set as an active planning lane
  - disposition: `Archive later`
  - limitation: retain through Stage 14 planning; Stage 16 owns archival execution
- `RA-02` historical carry-forward labels and prior salvage sequencing as active planning drivers
  - disposition: `Retire`
  - limitation: records remain evidence; only the active planning role ends
- `RA-03` sample-project alias dependence outside fixture lanes
  - disposition: `Retire`
  - limitation: preserve explicit fixture-only use; do not delete fixture roots here

## 12. Five Stage 14 candidate packages
`PKG-C` Evidence lane and witness protection
- included items: `TEST-01`, `TEST-02`, `TEST-03`, `ENV-01`
- objective: preserve bounded evidence value, prevent overclaim, and protect last necessary witnesses

`PKG-A` Runtime identity and persistence rebinding
- included items: `RT-01`, `DATA-01`, `DATA-02`, `DATA-03`, `DATA-04`
- objective: rebind project loading, persistence, snapshot, backup, restore, recovery, and sample-alias behavior to Stage 12 identity and evidence floors

`PKG-D` Desktop and packaging boundary rebinding
- included items: `DESK-01`, `DESK-02`
- objective: separate dev, packaged, installed, and portable claims and resolve duplicate Electron-path reachability

`PKG-E` Operational governance rebinding
- included items: `OPS-01`, `OPS-02`, `OPS-03`, `OPS-04`, `OPS-05`, `OPS-06`
- objective: rebind provider/model/transmission, queue semantics, telemetry/cache, cost/budget, and hardware/local-safety behavior to Stage 12 floors

`PKG-B` Surface sovereignty and coordinator reduction
- included items: `RT-02`, `RT-03`, `UI-01`, `UI-02`, `UI-03`
- objective: restore a bounded two-surface shell with Writing Surface sovereignty, non-gating Command Center behavior, and optional Companion behavior

## 13. Package dependency sequence
Required package order:
1. PKG-C - Evidence lane and witness protection
2. PKG-A - Runtime identity and persistence rebinding
3. PKG-D - Desktop and packaging boundary rebinding
4. PKG-E - Operational governance rebinding
5. PKG-B - Surface sovereignty and coordinator reduction

Reasoning:
- witness protection must precede evidence-altering work
- identity rebinding must precede installation, packaging, queue, provider, and surface rebinding
- packaging and installation work depend on valid project and installation identity
- operational systems must not inherit stale identity, approval, qualification, queue, or cost state
- surface reduction must not outrun truth-boundary and operational-ownership protection

Package completion must not authorize the next package automatically.

## 14. Package entry and completion gates
Shared entry requirements for any Stage 14 package:
- explicit Stage 14 author authorization
- one named bounded package
- clean recorded repository checkpoint
- Stage 12 authority available for the bounded package
- package stop conditions and reopening triggers documented
- no unresolved Stage 12 contradiction affecting the package

Package-specific entry order:
- `PKG-C`: global entry gate only
- `PKG-A`: `PKG-C` completion proof accepted
- `PKG-D`: `PKG-C` and `PKG-A` completion proof accepted
- `PKG-E`: `PKG-C`, `PKG-A`, and `PKG-D` completion proof accepted
- `PKG-B`: `PKG-C`, `PKG-A`, `PKG-D`, and `PKG-E` completion proof accepted

Completion proof by package:
- `PKG-C`: witness ledger, lane-claim matrix, verify carry-forward list
- `PKG-A`: identity-binding map, sample-alias retirement evidence, restore/copy distinction proof
- `PKG-D`: packaged/dev/install/portable boundary proof, duplicate-path role proof
- `PKG-E`: invalidation map, fallback map, queue/cost/telemetry/hardware boundary proof
- `PKG-B`: surface sovereignty proof, non-gating Command Center proof, optional Companion proof

No package completion proves general release readiness.

## 15. Required evidence
Minimum evidence bundle:
- `PKG-C`: claim-strength matrix, witness-role ledger, generated/environmental classification ledger
- `PKG-A`: identity-chain map, restore/copy semantics map, compatibility-root role map
- `PKG-D`: active entry-path map, packaged-versus-dev claim matrix, install/portable boundary matrix
- `PKG-E`: fallback matrix, invalidation-propagation map, queue identity/cancellation proof, telemetry/cache classification ledger, hardware/runtime safety map
- `PKG-B`: workflow ownership map, surface sovereignty proof, non-authority status map for Command Center and Companion, explicit mutation-path map

Evidence limits remain in force:
- tests, fixtures, harnesses, reports, and screenshots prove only their exercised lane
- historical reports remain historical evidence
- packaged proof is not inferred from development proof
- provider acknowledgment does not prove author acceptance
- queue completion does not prove transmission or destination acceptance

## 16. Package and global stop conditions
Package stop conditions:
- `PKG-C`: witness loss risk, ambiguous evidence identity, proof-lane overclaim, cleanup/archive execution pressure
- `PKG-A`: silent identity inheritance, restore/copy ambiguity, scene-first truth dependency, witness-risk mutation
- `PKG-D`: install/project identity collapse, packaged-from-dev overclaim, unresolved duplicate runtime path collision
- `PKG-E`: silent provider/model fallback, stale approval inheritance, queue authority inheritance, unknown cost as zero, shadow-truth telemetry/cache, local-refusal remote escalation
- `PKG-B`: Command Center truth ownership, Companion authority, scene-first regression, unsupported status certainty, writing-surface operational takeover

Global stop conditions:
- repository gate mismatch
- unresolved Stage 12 contradiction
- missing or ambiguous authority chain
- evidence weaker than the package claim
- witness-protection failure
- package scope broadening beyond the approved objective
- any execution pressure to perform archive, cleanup, deletion, or release work outside scope
- any discovery that package completion would silently authorize the next package

## 17. Stage 12 reopening triggers
Reopen Stage 12 if later work reveals:
- silent project-identity inheritance across copy, restore, migration, install, or fixture alias paths
- any need to restore scene/chapter-first ownership
- any stale approval, queue, model qualification, or budget state inherited by convenience
- any provider/model fallback that cannot remain explicit and revalidated
- any local-refusal path that silently authorizes remote escalation
- any cleanup/archive step needed before Stage 16
- any last-witness loss condition required to continue work

## 18. Cross-package invalidation
- if `PKG-A` changes project identity semantics, downstream package evidence tied to prior project-binding assumptions must be revalidated
- if `PKG-D` changes install/portable/runtime-path classification, `PKG-E` and `PKG-B` assumptions must be revalidated
- if `PKG-E` changes fallback, queue, budget, or telemetry semantics, `PKG-B` must revalidate status language and support-surface behavior
- if `PKG-C` reclassifies an artifact as the last necessary witness, no downstream package may supersede, archive, or remove it without replacement witness proof
- any package discovering a Stage 12 contradiction invalidates downstream sequencing until routed and resolved

## 19. Deferred author-policy decisions
Still deferred:
- provider breadth and risk tolerance
- model breadth and qualification depth
- retry breadth and cancellation presentation
- spend thresholds and warning depth
- telemetry retention breadth and cache retention depth
- hardware support floor and degradation posture
- archive visibility and long-term history depth

These remain policy questions. They are not resolved by this plan and must not be converted into architecture or implementation assumptions.

## 20. Work deferred to Stages 15-19
Deferred later-stage work remains outside this consolidated Stage 13 plan.

Named later-stage boundary:
- Stage 16 owns archive and cleanup execution only after witness, authority, and package conditions permit it

All other later-stage work in Stages 15-19 remains future-stage and author-controlled, including:
- any post-Stage-14 integration or follow-on salvage work
- any later proof consolidation beyond bounded package evidence
- any release-gating, release-evidence, or release-authorization work
- any final closure work after authorized execution stages complete

This plan does not authorize, sequence, or implement those later stages beyond preserving the Stage 16 archive/cleanup boundary and continuing to block implementation and release.

## 21. Stage 14 global entry gate
Stage 14 may begin only if all of the following are true:
- Stage 13 is completed, reviewed, committed, pushed, and closed
- explicit author authorization has been granted
- one named bounded package is selected
- repository checkpoint is clean and recorded
- package prerequisites are satisfied
- required evidence is available
- stop and reopening conditions are documented
- no unresolved Stage 12 contradiction affects the package

Stage 14 is eligible only after closure. It is not authorized by Stage 13 alone.

## 22. Stage 13 completion conditions
Stage 13 may close only when:
- inventories are complete for the authorized scope
- current authority and historical evidence remain distinct
- dispositions, dependencies, evidence limits, and gates are explicit
- `Verify` items remain named rather than silently resolved
- Stage 12 reopening triggers were checked
- author-policy decisions are resolved later or routed explicitly
- last-witness protections remain preserved
- Stage 14 gates are explicit
- Stage 16 archive and cleanup execution remains deferred
- implementation remains blocked
- release remains unauthorized
- this consolidated plan receives review

## 23. Explicit readiness verdict
This salvage plan is coherent.

Dispositions, dependencies, evidence requirements, and gates are explicit.

Stage 12 contracts are preserved.

Stage 14 becomes eligible only after Stage 13 closes and explicit author authorization is granted.

Implementation and release remain blocked.
