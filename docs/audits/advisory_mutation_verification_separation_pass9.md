# Advisory / Mutation / Verification Separation - Pass 9

## Purpose

This document classifies and separates advisory, mutation, verification, recovery, export, telemetry, and generation-boundary authority semantics currently compressed inside header-visible and adjacent workflow surfaces.

It is a reconstruction-planning artifact only. These classifications are not implementation authorization, not GUI redesign approval, not command/search expansion approval, and not approval for topology architecture or Story Unit persistence.

This pass distinguishes surface placement from underlying authority semantics. It also distinguishes advisory from mutation, inspection from recovery, and telemetry from workflow authority.

## Source Documents / Code Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/audits/roadmap_reconstruction_inventory_pass1.md`
- `docs/audits/phase_status_reconciliation_pass2.md`
- `docs/audits/phase20_27_survivability_classification_pass3.md`
- `docs/audits/phase20_24_maintenance_vs_redesign_pass4.md`
- `docs/audits/phase20_24_surface_subsystem_survivability_pass5.md`
- `docs/audits/highest_waste_risk_surface_families_pass6.md`
- `docs/audits/command_search_bypass_risk_pass7.md`
- `docs/audits/mixed_authority_header_concentration_pass8.md`
- `docs/audits/phase29/authority_boundary_matrix.md`
- `docs/audits/phase29/mutation_authority_review.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/persistence_and_recovery_surface_review.md`
- `docs/audits/phase29/workspace_header_density_review.md`
- `docs/audits/phase29/workspace_header_disposition_review.md`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/CritiqueModal.tsx`
- `app/renderer/components/CompanionOverlay.tsx`
- `app/renderer/components/PreflightModal.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/BudgetIndicator.tsx`
- `app/renderer/components/BudgetMeter.tsx`
- `app/renderer/App.tsx`

## Authority Semantics Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Advisory Authority`: guidance or interpretation that should remain explicitly non-executive.
- `Suggestion Authority`: recommends or frames possible change, but does not itself mutate state.
- `Mutation Authority`: directly changes draft, project, recovery, or related state.
- `Mutation-Boundary Authority`: defines scope, target, confirmation, or blast radius for later mutation.
- `Inspect / Verification Authority`: reads, proves, or reports state without being equivalent to mutation.
- `Recovery Authority`: repairs, restores, reopens, or otherwise handles exceptional recovery paths.
- `Version-State Authority`: creates or manages recoverable/snapshot state without being ordinary authoring.
- `Artifact Output Authority`: emits output artifacts and can imply maturity even without mutating core project state.
- `Runtime Status Authority`: communicates current runtime/service/recovery truth relevant to operation.
- `Telemetry Authority`: communicates budget, cost, or model-related transparency rather than workflow control.
- `Historical Scaffolding`: useful historical expression, not a durable semantic anchor.
- `Redesign-Bound`: current visible expression likely does not survive intact.
- `Maintenance-Only`: safe to preserve narrowly without widening authority.

## Executive Findings

- The main Phase 9 problem is semantic compression. Advisory, mutation, verification, recovery, output, and telemetry semantics are materially different, but current visible adjacency keeps making them look like comparable workflow peers.
- `Critique` and `Companion` are advisory/suggestion pressure, but `rewrite/apply` and generation are mutation-bearing. Current visible relationships make it too easy for advice to borrow execution legitimacy.
- `Generation scope` is not just a setting. It is mutation-boundary authority because it changes blast radius.
- `Verification`, `snapshot creation`, and `restore` are three different semantic classes:
  - verification proves or reports
  - snapshot creation creates recoverable version-state
  - restore mutates project/recovery state
- `Service health` and `budget/model` signals survive best as truth and transparency contracts, not as equal peers of authoring controls.

## Advisory vs Mutation Separation Findings

- `Critique` in `WorkspaceHeader.tsx` is advisory entry, not mutation entry.
- `CritiqueModal` makes the advisory/mutation boundary visible in theory:
  - advisory summary, issues, suggestions, priorities, and line comments are suggestion/advisory authority
  - `Generate saved rewrite` crosses into mutation-producing behavior
  - `Sync draft view` crosses into applied mutation behavior, even if phrased more softly
- The current flow still compresses these together because rewrite generation and draft sync live inside the same review surface and inherit critique legitimacy.
- `Companion` is advisory pressure, not mutation authority:
  - it frames guidance, pacing feedback, local insights, and advisory insights
  - it also carries model/service/offline semantics nearby
  - that makes it especially vulnerable to borrowing stronger workflow legitimacy from adjacency
- Visibility-driven implied authority remains the main risk:
  - when advisory and mutation-bearing actions share one nearby visible band, users can absorb suggestion as partial approval for action

## Mutation-Boundary Findings

- `Generation` is mutation authority because it changes authoring state.
- `Generation scope` is mutation-boundary authority because it controls which scenes are affected.
- `All scenes only` is the clearest blast-radius signal in the current header family.
- `PreflightModal` is one of the better surviving contracts in this whole area:
  - it names generation scope
  - it names affected scene count
  - it warns that draft text may be replaced
  - it surfaces budget/model context before proceeding
- `Rewrite/apply` implications remain higher-risk than plain generation:
  - critique-like interpretation and rewrite generation sit in one family
  - `Sync draft view` still executes a consequential change after advisory framing
- Pass 9 conclusion:
  - explicit scope, target, and confirmation semantics survive
  - current visible compression of those semantics into one mixed workflow family does not

## Verification vs Recovery Findings

### Verification

- semantic class:
  - `Inspect / Verification Authority`
- meaning:
  - reads, checks, and reports safety or state evidence
- user expectation implication:
  - should feel like proof, status, or record review
- visibility implication:
  - current header placement makes it look closer to ordinary action than it really is
- mutation adjacency risk:
  - sits too near snapshot and restore-capable families
- implied safety-equivalence risk:
  - can be mentally collapsed with restore and snapshot creation even though it is not equivalent

### Snapshot creation

- semantic class:
  - `Version-State Authority`
- meaning:
  - creates recoverable/versioned state
- user expectation implication:
  - should feel like safety preparation, not ordinary writing
- visibility implication:
  - current header placement makes it read more like one more workflow action
- mutation adjacency risk:
  - sits near verification and panel access that lead toward restore
- implied safety-equivalence risk:
  - can be mistaken as equivalent to verification because both feel protective

### Restore

- semantic class:
  - `Recovery Authority`
- meaning:
  - mutates project or recovery state during exception-path handling
- user expectation implication:
  - should feel consequential, exceptional, and clearly separate from normal workflow
- visibility implication:
  - restore lives downstream in `SnapshotsPanel` and `RecoveryBanner`, but header access routes point toward it
- mutation adjacency risk:
  - highest in this family
- implied safety-equivalence risk:
  - restore can be over-softened if mentally grouped with verification rather than with state replacement

Pass 9 conclusion:
- verification, snapshot creation, and restore must remain separate semantic families
- inspection is not recovery
- version-state creation is not proof
- recovery mutation is not ordinary workflow

## Export / Artifact Output Findings

- `Export` is `Artifact Output Authority`.
- It is not direct draft mutation, but it is not neutral either because it can imply workflow maturity, output readiness, or stable save/export semantics.
- Export capability itself appears durable.
- Current workflow placement remains pressured because header visibility makes export look more central and settled than current reconstruction evidence supports.
- Survivability:
  - `Maintenance-Only` for capability
  - `Redesign-Bound` for current placement and authority adjacency

## Runtime Status / Telemetry Findings

### Service health and retry truth

- `ServiceStatusPill` is `Runtime Status Authority`.
- It communicates live service state and retry availability.
- This is legitimate operational truth, but it is not the same as authoring authority.
- Test-offline branches and diagnostics-adjacent semantics make this family especially sensitive to support/dev leakage.

### Model provenance and cost transparency

- `BudgetIndicator` and `BudgetMeter` are primarily `Telemetry Authority`.
- They communicate budget state, remaining/spent amounts, and messaging.
- In nearby flows such as preflight and critique provenance lines, model/provider/budget metadata becomes semantic context rather than control authority.
- These telemetry semantics survive better than current placement beside action controls.

### Runtime expectation shaping

- Status and telemetry do shape operator expectations.
- That does not make them equal to workflow authority.
- The risk is ambient authority pressure:
  - when runtime truth and telemetry sit beside high-impact actions, they can start to feel like endorsement, readiness, or approval

## Authority Compression Findings

- Shared visible legitimacy is the main compression engine.
- Adjacency risks observed:
  - advisory entry beside mutation entry
  - verification beside version-state creation
  - support/recovery access beside authoring mutation
  - telemetry beside primary-visible action controls
- Workflow normalization pressure:
  - repetitive header visibility makes exceptional, advanced, and support semantics look routine
- Ambient authority pressure:
  - current placement makes different semantic classes borrow trust from each other without explicit consent

## Highest Governance-Risk Adjacencies

- critique entry adjacent to rewrite/apply mutation family
- companion/advisory entry adjacent to normal workflow controls
- verification adjacent to snapshot and restore-oriented access
- generation adjacent to all-scenes blast-radius control
- service health and budget/model status adjacent to consequential action controls

## Maintenance-Only Safe Areas

- preflight scope/target disclosure
- explicit mutation warnings before generation proceeds
- critique and rewrite provenance visibility
- verification/reporting capability
- snapshot capability
- restore safety framing in exception-path surfaces
- service health honesty and retry truth
- budget/model transparency
- export capability correctness

## Areas That Should Pause

- expanding critique/rewrite/apply visibility or convenience
- expanding companion as a workflow peer
- collapsing verification, snapshot creation, and restore into one convenience family
- widening header-visible safety/support tooling
- treating telemetry as workflow endorsement
- broadening mutation entry duplication across more surfaces

## Underlying Contracts That Survive Better Than Surface Placement

- critique is advisory, not mutation
- rewrite/apply requires explicit review and mutation framing
- generation scope defines blast radius
- verification proves or reports rather than restores
- snapshot creation creates version-state rather than proving state
- restore is exceptional recovery mutation
- export is artifact output, not maturity proof
- service health is runtime truth, not workflow authority
- budget/model data is transparency, not permission

Current Pass 9 conclusion:
The durable value is the semantic separation itself. The current visible arrangement is the unstable part.

## Contradictions Found

- `Critique` is framed as review, but the same family routes quickly into rewrite generation and draft sync.
- `Companion` is advisory, but its entry point sits among direct action controls and can read as a peer workflow pillar.
- `Verification` is inspect/prove authority, but current adjacency lets it borrow the visual grammar of mutation-capable safety tooling.
- `Service health` and `budget/model` are truthful status signals, but nearby action placement risks turning them into ambient workflow endorsement.

## Areas Too Ambiguous To Classify Reliably

- how much generation should remain primary-visible once workflow-state canon stabilizes
- whether export belongs in contextual workflow output or advanced-only output handling
- how visible support/recovery access can remain without normalizing it
- whether telemetry should remain visible in steady-state authoring surfaces or become more contextual

## Questions For Orchestrator

- Should Reconstruction Pass 10 stay at semantic-boundary level and classify exact `advisory -> mutation` transition risks, or move outward to support/recovery versus ordinary workflow separation?
- Should future reconstruction treat `generation scope` as its own mutation-boundary family rather than a subpoint under generation?
- Should `service health` and `budget/model transparency` continue to be reconstructed together as status semantics, or be split because support truth and telemetry truth create different governance pressure?

## Recommended Reconstruction Pass 10

Run a tenth reconstruction pass focused on support/recovery versus ordinary workflow authority separation.

Pass 10 should:

- keep verification separate from restore and snapshot creation
- classify exception-path support authority versus steady-state workflow authority
- preserve the distinction between runtime truth, recovery mutation, and telemetry
- avoid redesigning the GUI while clarifying which semantics should never normalize into ordinary authoring flow

Pass 10 should not rewrite the roadmap, redesign the GUI, authorize command/search expansion, authorize topology architecture, or authorize Story Unit persistence.
