# Stage 13 Salvage Completion Plan Program

Status: active program and charter for Stage 13 Salvage Completion Plan work.

Current posture:

- Stage 13 has begun by explicit author authorization.
- Stage 13 is governance and salvage-planning work only.
- Stage 13 completion may make Stage 14 eligible but does not authorize Stage 14.
- Implementation remains blocked.
- Release remains unauthorized.

## 1. Stage identity and purpose

Stage 13 is the Salvage Completion Plan stage in the controlling 19-stage sequence.

Its purpose is to determine, with evidence and bounded review, what existing Black Skies repository material must be preserved, preserved with constraints, replaced, retired, verified, or archived later before any later salvage execution stage may begin.

Stage 13 produces a plan. It does not execute the plan.

## 2. Entry conditions

Stage 13 may proceed only after:

- Stage 12 Architecture Readiness Contract is closed.
- The verified Stage 12 closure checkpoint is `62ad8b4`.
- The repository gate for the pass matches the authorized branch, tracking branch, clean worktree, and expected HEAD.
- The pass has explicit author authorization.
- Implementation remains blocked.
- Release remains unauthorized.

If any entry condition is missing, ambiguous, or contradicted, the pass stops.

## 3. Authority stack and inspection order

Stage 13 must inspect current authority before historical evidence.

Inspection order:

1. `docs/product_systems/current_truth_index.md`
2. `docs/product_systems/current_product_roadmap.md`
3. `docs/product_systems/pre_code_discovery_plan.md`
4. `docs/product_systems/stage12_architecture_readiness_contract_program.md`
5. `docs/product_systems/stage12_cross_family_integration_audit.md`
6. `docs/product_systems/stage12_architecture_readiness_contract.md`
7. `docs/product_systems/stage12_architecture_readiness_contract_closure.md`
8. Stage 12 family contracts when a salvage question depends on a bounded family rule
9. current product-system dossiers and governance matrices needed for the artifact class under review
10. historical runtime, audit, prototype, test, or planning evidence, only after the current authority frame is known

Current authority controls product truth. Historical implementation behavior is evidence, not product authority.

## 4. Scope

Stage 13 may:

- inventory current authority and salvage-source records
- classify repository artifacts by salvage relevance
- distinguish current authority from historical evidence
- define evidence requirements for later salvage execution
- identify preservation, replacement, retirement, verification, and later archive candidates
- define dependencies and sequencing for Stage 14
- define stop conditions and reopening triggers
- prepare reviewable salvage-planning artifacts

Stage 13 may inspect filenames, directory names, documentation, governance records, audit records, tests, fixtures, runtime source, generated evidence, and historical implementation artifacts only when the pass explicitly authorizes that class of inspection.

## 5. Explicit exclusions

Stage 13 must not:

- begin salvage execution
- implement runtime behavior
- perform GUI work
- select schemas, persistence stores, providers, models, queues, telemetry, caches, packaging systems, build systems, installers, or deployment technologies
- perform provider or model integration
- repair tests or runtime code
- migrate data
- clean, delete, rename, archive, or relocate files
- execute release work
- treat historical runtime behavior as current product authority
- compensate silently for a defective Stage 12 contract
- convert author-policy decisions into architecture assumptions

Stage 13 may identify archive candidates, but archive and cleanup execution remain deferred to Stage 16.

## 6. Planning-versus-execution boundary

Planning may define what should happen later, why, in what order, with what evidence, and under what stop conditions.

Execution would alter runtime behavior, file placement, data state, repository structure, packaged outputs, release posture, or user-facing application behavior.

Stage 13 is limited to planning. Stage 14 is the first eligible salvage execution stage, and only becomes eligible after Stage 13 closes. Stage 14 still requires explicit authorization.

## 7. Current authority versus historical evidence

Current authority includes accepted product-system governance, current dossiers, Stage 12 contracts, and later accepted Stage 13 records.

Historical evidence includes runtime behavior, old tests, fixtures, prototypes, historical audit artifacts, old planning records, branch lineage, filenames, and observed repository state.

Historical evidence may show that something existed, failed, passed, was attempted, or was previously intended. It cannot by itself establish product truth, future architecture, implementation selection, release readiness, or author intent.

## 8. Salvage artifact classes

Stage 13 should classify artifacts into reviewable classes such as:

- current authority records
- historical governance and audit records
- product dossiers and doctrine records
- runtime and structural source artifacts
- tests, fixtures, harnesses, and validation evidence
- data, schema, persistence, migration, and recovery artifacts
- desktop, launcher, packaging, installer, and release artifacts
- surface and UI artifacts
- provider, model, queue, telemetry, cache, cost, and routing artifacts
- generated, temporary, local-only, or environmental artifacts
- external or mirrored planning inputs, where current authority allows inspection

An artifact may belong to more than one class, but each claim about it must name the class and evidence used.

## 9. Disposition vocabulary

Stage 13 uses these dispositions:

- Preserve
- Preserve with constraints
- Replace
- Retire
- Verify
- Archive later

No other disposition should be introduced unless a later Stage 13 review explicitly amends this program.

## 10. Meaning and limitations of dispositions

`Preserve`

The artifact or doctrine should carry forward as current authority, current planning support, or necessary evidence. Preserve does not mean implement, ship, or treat runtime behavior as product authority.

`Preserve with constraints`

The artifact has salvage value only under stated boundaries, such as evidence-only status, historical-only status, partial authority, source-specific use, or later verification requirement. Constraints must be explicit.

`Replace`

The artifact's function, claim, or implementation should not carry forward as-is. Replacement may be doctrinal, architectural, or implementation-facing later. Replace does not authorize writing the replacement during Stage 13.

`Retire`

The artifact or claim should stop guiding future planning except as historical evidence. Retire does not delete or archive the artifact during Stage 13.

`Verify`

The artifact or claim cannot receive a final carry-forward disposition until a later bounded pass or stage checks named evidence. Verify is not a positive claim.

`Archive later`

The artifact appears to belong in a later archive or cleanup milestone after required truth, evidence, and last-witness protections are satisfied. Archive later does not authorize archival, deletion, relocation, or cleanup during Stage 13.

## 11. Evidence and claim-strength standards

Evidence strength must match claim strength.

Accepted evidence classes include:

- current authority citation
- source-specific historical evidence
- runtime behavior observation
- test or harness evidence
- fixture evidence
- packaged evidence
- provider-reported evidence
- locally observed evidence
- user-reported evidence
- unknown

Tests prove only the lane and scope exercised. Passing tests do not prove product authority, full runtime correctness, packaged behavior, operational readiness, or release readiness.

Unknown state remains visibly unknown. Missing or ambiguous authority fails closed.

## 12. Required artifact assessment dimensions

Each later artifact assessment should record, where applicable:

- path or artifact identity
- artifact class
- current-authority status
- historical-evidence status
- product doctrine relevance
- Stage 12 contract relevance
- author-policy relevance
- implementation or runtime relevance
- evidence available
- evidence missing
- claim strength allowed
- dependencies
- downstream risks
- proposed disposition
- rationale
- later verification need
- Stage 12 reopening risk
- Stage 14 execution-gate implication
- Stage 16 archive or cleanup implication

## 13. Repository-gate requirements for later passes

Every Stage 13 pass must begin with a repository gate unless the author explicitly narrows the pass to read-only discussion without repository access.

Minimum gate:

- `git status -sb`
- `git status --short`
- `git log -5 --oneline`
- `git branch -vv`

Expected gate unless updated by explicit authorization:

- branch is `salvage/minimal-two-surface-shell`
- branch tracks `origin/salvage/minimal-two-surface-shell`
- HEAD is the authorized checkpoint for that pass
- worktree is clean
- canonical branch has no ahead/behind discrepancy

If the gate differs, stop and report the exact discrepancy. Do not reset, clean, delete, merge, switch branches, stash, or repair automatically.

## 14. Proposed inspection-pass structure

The initial planning hypothesis is:

1. Stage 13 program and charter creation
2. current authority and salvage-source inventory
3. runtime and structural artifact inventory
4. tests, fixtures, harnesses, and evidence inventory
5. data, schema, persistence, migration, and recovery inventory
6. desktop, packaging, launcher, installation, and release-adjacent inventory
7. surfaces and UI inventory
8. providers, models, queues, telemetry, caches, costs, and routing inventory
9. disposition matrix assembly
10. dependency and sequencing audit
11. Stage 14 execution-gate definition
12. integration review
13. consolidated salvage completion plan
14. Stage 13 closure

This is a planning hypothesis, not a fixed fourteen-pass requirement.

## 15. Provisional pass-count rule

The pass count remains provisional throughout Stage 13.

Passes may be combined or split according to:

- materially different authority sources
- materially different artifact classes
- reviewability
- context safety
- evidence boundaries
- dependency boundaries
- risk of architectural drift

No pass should exist only to preserve an expected count. No materially different evidence class should be hidden inside an overbroad pass merely to reduce the count.

## 16. Review workflow

Stage 13 creation, inventory, matrix, audit, consolidated plan, and closure artifacts require review before they become accepted current authority.

Creation passes may end with:

- Ready for review

Later separate read-only reviews must use exactly one of:

- Commit-ready
- Not commit-ready
- Commit-ready with optional refinement

Do not describe a creation artifact as commit-ready in the creation pass.

## 17. Creation and review verdict vocabulary

Creation verdict:

- Ready for review

Review verdicts:

- Commit-ready
- Not commit-ready
- Commit-ready with optional refinement

Review verdicts must be findings-led when defects exist and must state the bounded reason for the verdict.

## 18. Stop conditions

Stop a Stage 13 pass if:

- the repository gate differs from authorization
- required current authority is missing, contradictory, or ambiguous
- a Stage 12 contract appears infeasible, contradictory, incomplete, or missing required propagation
- a Stage 12 reopening trigger is found
- the pass would require implementation, runtime repair, GUI work, provider/model integration, queue work, telemetry work, cache work, packaging, cleanup, archival, deletion, or release work
- the pass would require selecting implementation technologies
- the pass would silently convert author-policy decisions into architecture assumptions
- evidence is insufficient for the claim being made
- the requested edit target is ambiguous

Prefer stopping and reporting over guessing.

## 19. Stage 12 reopening triggers

Stage 12 must reopen if Stage 13 discovers:

- contradiction among Stage 12 contracts
- ownership collision
- identity-chain break
- invalidation or propagation gap
- evidence overclaim
- silent authority transfer
- family-contract regression
- architecture dependency not actually resolved
- author-policy decision that changes a mandatory safety floor
- implementation infeasibility
- release evidence contradicting the contract

Stage 13 must not compensate silently for a defective Stage 12 contract.

## 20. Deferred author-policy handling

Author-policy choices remain visible and must be routed to a stage capable of resolving them safely.

Stage 13 may identify author-policy questions that affect salvage disposition, sequencing, verification, or execution gates. It may not convert unresolved author-policy choices into architecture assumptions or implementation selections.

Every author-policy deferral must name the exact later resolution stage and reopening trigger.

## 21. Last-witness protection

Stage 13 must preserve last-witness protection.

An artifact that is the last known witness for a material claim, execution event, transmission, spend, provider assurance, migration, recovery action, qualification, failure, or historical decision cannot be marked for deletion or cleanup during Stage 13.

Stage 13 may mark such an artifact `Archive later` only when it also records the protected claim, required replacement witness or archive condition, and the later stage responsible for execution.

## 22. Stage 14 execution-gate requirements

Stage 14 may become eligible only if Stage 13 closes with:

- a reviewed consolidated Salvage Completion Plan
- a disposition matrix with evidence and claim-strength limits
- explicit current-authority versus historical-evidence separation
- unresolved verification needs named
- Stage 12 reopening risks cleared or invoked
- author-policy deferrals routed
- last-witness protections preserved
- dependencies and sequencing recorded
- stop conditions carried forward
- implementation and release still blocked unless separately authorized later

Stage 14 execution remains unauthorized until the author explicitly authorizes it.

## 23. Stage 13 closure conditions

Stage 13 may close only when:

- required inventories are complete for the approved scope
- artifact classes have bounded dispositions or named verification needs
- current authority and historical evidence remain distinct
- claim-strength limits are explicit
- Stage 12 reopening triggers were checked
- no unresolved Stage 12 defect is being bypassed
- author-policy choices are resolved or routed
- last-witness protections are preserved
- Stage 14 gates are explicit
- Stage 16 archive and cleanup candidates are deferred rather than executed
- consolidated plan review is complete
- implementation remains blocked
- release remains unauthorized

Stage 13 completion makes Stage 14 eligible but does not authorize Stage 14.

## 24. Mandatory doctrine

Stage 13 preserves these rules:

- The author is final authority over project truth.
- AI may analyze and propose but may not silently mutate project truth.
- Narrative Assertion / Narrative Insertion remains the smallest accepted truth unit.
- Scenes and chapters remain projections, containers, views, or compatibility surfaces.
- Writing Surface and Command Center remain distinct.
- Companion remains optional, advisory, non-owning, and non-authoritative.
- Models perform tasks; systems own workflows.
- Historical runtime behavior is evidence, not product authority.
- Passing tests prove only the lane and scope exercised.
- Unknown state remains visibly unknown.
- Missing or ambiguous authority fails closed.
- Stage 13 may identify archive candidates but may not archive, delete, or clean them.
- Archive and cleanup execution remain deferred to Stage 16.
- Stage 13 must not compensate silently for a defective Stage 12 contract.
- If a Stage 12 contract is infeasible, contradictory, incomplete, or missing required propagation, stop and invoke the appropriate Stage 12 reopening rule.
- Author-policy decisions must not be converted into architecture assumptions.
- Implementation technologies must not be selected in this program.

## 25. Implementation and release boundary

Implementation remains blocked.

Release remains unauthorized.

No Stage 13 artifact authorizes runtime implementation, GUI work, schema work, provider or model integration, queue work, telemetry work, cache work, packaging, cleanup, archival, deletion, or release work.
