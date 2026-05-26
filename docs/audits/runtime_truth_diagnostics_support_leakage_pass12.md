# Runtime Truth vs Diagnostics / Support Leakage - Pass 12

## Purpose

This document reconstructs how truthful runtime visibility, service status, retry truth, diagnostics exposure, and support adjacency can gradually drift into operational endorsement, workflow authority, and ambient support normalization.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not GUI redesign approval, and not approval to normalize diagnostics or support semantics into ordinary workflow.

This pass distinguishes runtime truth from operational endorsement, transparency truth from workflow authority, and contextual visibility from ambient visibility.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/audits/command_search_bypass_risk_pass7.md`
- `docs/audits/mixed_authority_header_concentration_pass8.md`
- `docs/audits/advisory_mutation_verification_separation_pass9.md`
- `docs/audits/semantic_escalation_authority_transition_pass10.md`
- `docs/audits/support_recovery_normalization_pressure_pass11.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/authority_boundary_matrix.md`
- `docs/audits/phase29/workspace_header_density_review.md`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/BudgetIndicator.tsx`
- `app/renderer/components/BudgetMeter.tsx`
- `app/renderer/App.tsx`

## Runtime Truth / Support Leakage Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Runtime Truth`: accurate visibility about current system or service state.
- `Transparency Truth`: accurate visibility about budget, model, provenance, or capability context that informs but does not authorize.
- `Diagnostics Authority`: debugging, investigation, or failure-analysis semantics that should remain distinct from ordinary workflow.
- `Support Authority`: operator-facing help, retry, or status semantics that are legitimate but bounded.
- `Operational Endorsement`: the mistaken reading that a visible truth signal implies readiness, approval, or recommended action.
- `Contextual Visibility`: visible because present state or task requires it.
- `Ambient Visibility`: repeatedly present as part of the ordinary interface rhythm.
- `Degraded-State Truth`: honest signaling that the system is limited, unavailable, or in fallback/degraded mode.
- `Retry Truth`: honest signaling that retry is possible or meaningful under current runtime state.
- `Workflow Legitimacy Transfer`: when a truthful status or support surface inherits or lends legitimacy to nearby workflow actions.

## Executive Findings

- The main Pass 12 problem is not that runtime truth is misleading. It is that truthful runtime visibility can still drift into endorsement when it is repeated, adjacent to action controls, or blended with support/diagnostics semantics.
- `ServiceStatusPill` and `ServiceHealthBanner` are generally honest runtime/support surfaces, but their action-adjacent placement and retry affordances can make “available” feel like “approved”.
- `BudgetIndicator` and `BudgetMeter` are transparency truth, not workflow authority, yet nearby placement can make budget OK, soft-limit, or blocked states feel like workflow permission or prohibition rather than context.
- Diagnostics leakage risk is highest where support language, test-offline branches, retry affordances, and diagnostics access share one visible family.
- The most durable contracts are still the underlying ones: service truth reports condition, retry truth reports opportunity, degraded-state truth reports limitation, and transparency truth reports context rather than endorsement.

## Runtime Truth Findings

- `ServiceStatusPill` communicates:
  - checking
  - online
  - offline
  - port unavailable
- It also exposes a retry action when offline and `onRetry` exists.
- `ServiceHealthBanner` communicates:
  - service offline
  - port unavailable
  - temporary unreachability
  - frozen/test-specific offline states
- These are legitimate runtime-truth surfaces.

Key finding:
- runtime truth is most stable when users read it as “what state the system is in now”
- runtime truth becomes risky when users read it as “what workflow move is endorsed next”

## Transparency Truth Findings

Runtime truth and transparency truth should remain separate semantic families.

### Service / runtime truth

- service state
- retry availability
- degraded/unavailable messaging
- recovery-required or support-needed state

### Budget / model / capability transparency

- budget status
- spent/remaining values
- soft-limit/hard-limit framing
- provider/model/provenance disclosure in nearby flows

Key distinction:
- runtime truth answers “what condition is the system in?”
- transparency truth answers “what contextual cost/capability facts surround this action?”

Neither should automatically answer:
- “should I do this now?”
- “is this workflow approved?”
- “is this action recommended?”

## Diagnostics Leakage Findings

- `ServiceHealthBanner` includes test-oriented offline branches and frozen states.
- `ServiceStatusPill` includes test-specific labeling and local debug logging paths under Playwright/test conditions.
- `RecoveryBanner` includes `View diagnostics`.
- Phase 29 already identified the weakest boundary as the family where support language and test/diagnostics states share one conceptual band.

Leakage pattern:

1. truthful support status appears
2. diagnostics/test-state variants share the same family
3. users or future implementations start treating diagnostics as routine operational tooling
4. diagnostics semantics leak into ordinary workflow support meaning

## Support Adjacency Findings

- Support truth becomes riskier when adjacent to primary actions.
- In the current GUI, service/budget/status surfaces are close to:
  - companion entry
  - generation entry
  - critique entry
  - snapshot/verify/export actions
- That adjacency creates an ambient reading:
  - service online looks like action readiness
  - service offline looks like blocked workflow endorsement
  - budget warning looks like discouraged workflow endorsement

Pass 12 conclusion:
- adjacency turns truthful support surfaces into workflow-legitimacy participants even when they were not meant to be

## Runtime Endorsement Drift Findings

- Runtime endorsement drift happens when “truth about state” becomes “felt guidance about action”.

Observed drift chains:

1. `service online -> capability available -> action feels endorsed`
2. `budget OK -> cost acceptable -> action feels recommended`
3. `retry visible -> retry becomes routine rhythm -> degraded state feels normalized`
4. `offline/support banner present often -> support becomes part of ordinary workflow furniture`

This drift is especially strong in a transitional GUI because placement already carries unstable governance pressure.

## Contextual vs Ambient Visibility Findings

- `Contextual visibility` is the healthier mode for runtime/support truth:
  - banner appears because services are down
  - recovery appears because recovery is required
  - retry appears because retry is relevant
- `Ambient visibility` is the risk mode:
  - status is always nearby
  - support surfaces are repeatedly visible
  - degraded-state framing becomes part of normal app rhythm

Pass 12 conclusion:
- contextual visibility preserves semantics better than ambient visibility
- ambient visibility causes semantic flattening and legitimacy transfer

## Workflow Legitimacy Transfer Findings

- Workflow legitimacy transfer is the mechanism by which nearby action controls and truthful status surfaces lend meaning to each other.

Examples:

- `service online` can lend approval to generation/companion/critique
- `budget healthy` can lend apparent permission to mutation-bearing actions
- `retry` can make degraded-state workflows feel routine rather than exceptional
- `view diagnostics` beside recovery/support wording can make diagnostics feel product-normal

This is not because the status is false.
It is because visibility and adjacency let truth surfaces participate in workflow meaning.

## Highest Leakage-Risk Areas

- service status surfaces placed beside primary action controls
- service banner family mixing real support truth with test/dynamic diagnostics branches
- recovery/support surfaces that include diagnostics entry
- budget/model transparency beside mutation-bearing controls
- repeated degraded-state or retry visibility that becomes habitual

## Maintenance-Only Safe Areas

- honest service status labeling
- honest degraded-state messaging
- retry truth tied to real runtime conditions
- budget/model transparency accuracy
- explicit differentiation between runtime truth and action authority
- diagnostics/support separation wording
- contextual recovery/support visibility when truly needed

## Areas That Should Pause

- broadening diagnostics visibility through support/status surfaces
- letting runtime truth act as action endorsement
- letting transparency truth act as permission or prohibition
- increasing ambient status/support presence without stronger contextual boundaries
- deepening mixed placement between status surfaces and high-impact action controls

## Underlying Contracts That Survive Better Than Visibility Placement

- runtime truth reports condition, not endorsement
- transparency truth reports context, not permission
- degraded-state truth reports limitation, not workflow identity
- retry truth reports possible recovery action, not ordinary workflow progression
- diagnostics should remain distinct from ordinary support semantics
- support truth should remain contextual rather than ambient

Current Pass 12 conclusion:
The truth contracts survive. What leaks is the meaning borrowed from placement and repetition.

## Contradictions Found

- The runtime/support surfaces are often honest in wording while still drifting toward endorsement through placement.
- Retry is a legitimate support affordance, yet repeated retry visibility can normalize degraded-state workflow as routine.
- Budget/model transparency is useful context, yet nearby placement can make it feel like workflow approval or denial.
- Diagnostics access can be support-relevant, yet support-adjacent placement risks turning diagnostics into ordinary workflow tooling.

## Areas Too Ambiguous To Stabilize Yet

- how much steady-state service/status visibility can remain without becoming ambient endorsement
- whether budget/model transparency belongs in ordinary workflow surfaces or contextual/status-only surfaces
- how often degraded-state or retry messaging can recur before it materially reshapes workflow expectation
- whether some support truth can remain always-available without dragging diagnostics semantics with it

## Questions For Orchestrator

- Should Reconstruction Pass 13 focus next on `runtime truth` versus `transparency truth` as distinct non-permission families, or on exact `support truth -> diagnostics leakage` boundaries?
- Should future reconstruction classify `retry` as its own support-authority family because of its normalization pressure, or keep it inside broader runtime-support truth?
- Should the next pass stay conceptual, or explicitly map these leakage patterns back onto the concrete header/status/banners/snapshots surfaces one more time?

## Recommended Reconstruction Pass 13

Run a thirteenth reconstruction pass focused on support truth versus diagnostics leakage boundaries as separate semantic families.

Pass 13 should:

- preserve the distinction between runtime truth and transparency truth
- classify where support semantics stop and diagnostics semantics begin
- keep contextual visibility separate from ambient presence
- avoid redesigning surfaces while clarifying which truthful signals must not become workflow endorsement

Pass 13 should not rewrite the roadmap, redesign the GUI, authorize topology architecture, or authorize Story Unit persistence.
