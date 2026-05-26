# Semantic Escalation & Authority Transition - Pass 10

## Purpose

This document reconstructs the semantic escalation pathways between advisory, suggestion, mutation, mutation-boundary, verification, recovery, telemetry, and workflow authority.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not roadmap law, and not approval for GUI redesign, topology architecture, or Story Unit persistence.

This pass focuses on authority-transition synthesis: how one semantic class psychologically or operationally escalates into another when placement, adjacency, or workflow ambiguity transfers legitimacy.

## Source Documents Reviewed

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
- `docs/audits/advisory_mutation_verification_separation_pass9.md`
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
- `app/renderer/commands/commandRegistry.ts`
- `app/renderer/App.tsx`

## Semantic Authority Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Advisory`: interpretation or guidance that should remain non-executive.
- `Suggestion`: proposes or frames possible action without directly mutating state.
- `Mutation`: directly changes draft, project, recovery, or related state.
- `Mutation-Boundary`: defines scope, target, blast radius, or confirmation rules for later mutation.
- `Inspection / Verification`: reads, proves, or reports state without being recovery or mutation.
- `Recovery`: repairs, restores, reopens, or otherwise handles exceptional continuity failure.
- `Runtime Truth`: communicates current operational state such as service availability or recovery-required state.
- `Transparency Truth`: communicates cost, model, provenance, or budget context without granting permission.
- `Workflow Authority`: semantics that users read as primary, ordinary workflow power.
- `Support / Recovery Authority`: exception-path authority that should remain distinct from normal workflow.

## Executive Findings

- The core escalation problem is not only mixed placement. It is semantic drift: once one class sits near another, users start to infer a transition path that may not actually be authorized.
- The strongest advisory-to-mutation chain is `critique -> rewrite generation -> draft sync`.
- The strongest verification-to-recovery confusion chain is `verify snapshots -> snapshots panel -> restore-capable controls`.
- The strongest telemetry-to-workflow drift is `status/transparency signal -> implied readiness -> action endorsement`.
- `Generation scope` is the clearest mutation-boundary escalator in the current system because it turns a local mutation into a multi-scene blast-radius decision.
- `Command/search` remains the highest hidden-authority escalation family because it can compress these semantic transitions into a single neutral-looking seam.

## Semantic Escalation Pathways

- `Advisory -> Suggestion -> Mutation`
  - critique and companion begin as guidance
  - nearby rewrite/generate/apply paths make them feel increasingly executive
- `Inspection -> Recovery`
  - verification begins as proof/reporting
  - adjacency to snapshot and restore flows makes proof feel like part of the same action family
- `Transparency -> Workflow Endorsement`
  - service, budget, and model status begin as truth
  - visibility near action controls makes them feel like permission, readiness, or endorsement
- `Mutation-Boundary -> Expanded Mutation`
  - scope selectors look small
  - but they redefine who gets changed and therefore alter the authority magnitude
- `Support/Recovery -> Ambient Workflow`
  - repeated visibility makes exception-path actions feel routine
- `Command/Search Proximity -> Hidden Authority`
  - once discoverability and execution are combined, semantic boundaries compress behind one seam

Escalation is amplified when:

- visible adjacency transfers legitimacy
- workflow-state authority remains unresolved
- status truth sits too close to action entry
- support/recovery remains visible without strong exception-path framing
- mutation-bearing follow-ups inherit the softer language of their advisory parent surface

## Advisory -> Mutation Escalation

- `Critique` starts as advisory review.
- Inside `CritiqueModal`, the flow escalates:
  - summary / issues / suggestions / priorities / line comments
  - rewrite instructions
  - `Generate saved rewrite`
  - `Sync draft view`
- The psychological transition is smoother than the governance transition.
- The modal preserves some honesty through provenance fields and explicit rewrite framing, but the escalation still compresses too much semantic distance into one family.

- `Companion` starts as advisory/intelligence guidance.
- It creates generation pressure indirectly through:
  - pacing feedback
  - scene insights
  - local/model advisory framing
  - visible proximity to the header generation control
- Companion does not directly mutate, but it can imply that a next mutation is endorsed or workflow-native.

Pass 10 conclusion:
- advisory becomes dangerous when it sits too close to mutation follow-through
- suggestion becomes pseudo-permission when nearby mutation entry is already visible

## Inspection -> Recovery Escalation

- `Verify snapshots` is inspect/prove authority.
- `Snapshot` is version-state creation authority.
- `Restore` is recovery mutation authority.
- Current user-facing pathways let these feel like one safety cluster even though their semantics differ sharply.

Escalation chain:

1. verify safety state
2. open snapshot tooling
3. encounter backup/restore routes
4. cross from proof to replacement/recovery mutation

Why this escalates:

- all three surfaces borrow safety language
- all three appear protective
- only one actually changes recovery/project state in a high-consequence way

Pass 10 conclusion:
- inspection is not recovery
- proof should not silently inherit restore semantics
- restore should not borrow the low-risk feel of verification

## Telemetry -> Workflow Authority Escalation

- `ServiceStatusPill` begins as runtime truth.
- `BudgetIndicator` and `BudgetMeter` begin as transparency truth.
- provenance and budget status lines in critique/preflight add more context truth.

Escalation chain:

1. visible status/transparency signal
2. repeated adjacency to action controls
3. user reads signal as readiness or approval
4. telemetry becomes ambient workflow endorsement

Examples:

- service online can feel like generation/companion are approved, not merely available
- budget OK can feel like action is recommended, not merely affordable
- model/provider provenance can feel like trust certification, not just disclosed route/context

Pass 10 conclusion:
- transparency is not permission
- runtime truth is not workflow authority

## Generation Scope -> Blast Radius Escalation

- `Generation scope` is mutation-boundary authority.
- `Active scene` and `All scenes only` do not merely change formatting or preference. They redefine the extent of mutation.

Escalation chain:

1. generation button appears as one authoring action
2. scope selector changes target set
3. blast radius expands from local to multi-scene
4. mutation authority magnitude changes even though surface family stays the same

Why this matters:

- users can absorb scope as a minor option when it is actually a boundary decision
- the semantic distance between single-scene and all-scenes mutation is larger than current visual compression suggests

Pass 10 conclusion:
- scope selectors are not cosmetic controls
- mutation-boundary semantics should remain explicit and protected

## Support/Recovery -> Ambient Workflow Escalation

- `RecoveryBanner` and `SnapshotsPanel` are legitimate support/recovery surfaces.
- `ServiceHealthBanner` and related retry/status surfaces are legitimate support truth.

Escalation chain:

1. support/recovery stays visible
2. visibility repeats in ordinary workflow sessions
3. exception-path semantics begin to feel routine
4. support/recovery authority normalizes into ambient workflow

This is especially risky because:

- recovery is necessary when real failure occurs
- visibility alone can gradually reclassify “exception” into “tool I use all the time”
- support and recovery then start competing with authoring for ordinary workflow authority

Pass 10 conclusion:
- recovery is not normal workflow
- support truth should survive
- ambient normalization should not

## Hidden Authority Transfer Findings

- `Command/search` is the most dangerous hidden transfer family because it can make:
  - advisory feel executable
  - verification feel like restore browsing
  - support tooling feel like ordinary commands
  - dev/test-only routes feel like advanced-user power
- The command registry already encodes mutative and cross-zone metadata.
- No live palette/search UI exists yet, but the semantic compression risk already exists in the latent execution model.
- Hidden authority transfer also occurs in smaller ways:
  - status truth beside action controls
  - advisory entry beside mutation entry
  - snapshot access beside authoring controls

## Workflow-State Dependency Findings

- Every escalation chain becomes worse while workflow-state authority remains unresolved.
- Without stable workflow-state canon:
  - advisory surfaces can over-inherit operational legitimacy
  - support/recovery can over-inherit ordinary workflow legitimacy
  - command/search can over-inherit execution legitimacy
  - status truth can over-inherit action endorsement
- Workflow-state ambiguity therefore acts as an escalation amplifier rather than a neutral unknown.

## Underlying Contracts That Survive Better Than Surface Semantics

- suggestion does not equal application
- inspection does not equal mutation
- recovery is exceptional, not ambient
- service health truth is not permission
- budget/model transparency is not endorsement
- generation scope defines blast radius
- provenance disclosure improves honesty without proving quality
- mutation confirmation boundaries matter more than visible convenience

## Highest Governance-Risk Escalation Chains

1. `critique -> rewrite generation -> draft sync`
2. `verify snapshots -> snapshots panel -> restore`
3. `service/budget/model truth -> implied readiness -> action endorsement`
4. `generation -> all-scenes scope -> expanded mutation authority`
5. `support/recovery visibility -> repeated exposure -> ambient workflow normalization`
6. `command/search discovery -> hidden execution/routing -> compressed authority bypass`

## Areas Safe Only As Maintenance

- provenance visibility
- preflight scope disclosure
- explicit blast-radius warnings
- verification/reporting capability
- snapshot/version-state capability
- restore exception-path safety framing
- service status honesty and retry truth
- budget/model transparency
- narrow export capability preservation

## Areas That Should Pause

- expanding advisory surfaces toward execution convenience
- merging verification, snapshot creation, and restore semantics
- normalizing support/recovery visibility as ordinary workflow
- letting telemetry act as workflow endorsement
- broadening command/search into a unified escalation seam
- adding more mixed-authority proximity without workflow-state clarification

## Contradictions Found

- Advisory surfaces repeatedly include or sit near the very mutation paths they are supposed to remain distinct from.
- Verification uses safety/proof semantics, but current routing keeps placing it in the orbit of restore-capable tooling.
- Status and telemetry are presented honestly, yet their placement still risks turning truth into endorsement.
- Recovery surfaces are correctly exceptional in theory, but repeated visibility pressure keeps pushing them toward ordinary-tool status.

## Areas Too Ambiguous To Stabilize Yet

- how much generation should remain ordinary primary workflow once workflow-state canon lands
- whether export ultimately behaves more like contextual output or advanced workflow support
- how visible support/recovery can remain without normalizing it
- whether some telemetry belongs in ordinary runtime view or in contextual/support framing only

## Questions For Orchestrator

- Should Reconstruction Pass 11 focus on support/recovery versus ordinary workflow normalization, or on exact `advisory -> mutation` transition boundaries inside critique and companion families?
- Should `generation scope` now be treated as a standalone mutation-boundary family across future reconstruction work, not just as a header subcontrol?
- Should future reconstruction classify `runtime truth` and `transparency truth` together as non-permission truth, or split them because they escalate differently in practice?

## Recommended Reconstruction Pass 11

Run an eleventh reconstruction pass focused on support/recovery normalization pressure versus ordinary workflow authority.

Pass 11 should:

- classify exception-path support visibility versus ambient workflow visibility
- preserve the distinction between verification, snapshot creation, and restore
- keep runtime truth separate from transparency truth
- avoid redesigning surfaces while clarifying which semantics must never normalize into ordinary authoring workflow

Pass 11 should not rewrite the roadmap, redesign the GUI, authorize command/search expansion, authorize topology architecture, or authorize Story Unit persistence.
