# Support / Recovery Normalization Pressure - Pass 11

## Purpose

This document reconstructs how support, recovery, restore, verification, snapshot, and exceptional-tool visibility gradually normalize into ambient workflow authority through repetition, adjacency, and workflow exposure.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not GUI redesign approval, and not approval to normalize support/recovery into ordinary workflow.

This pass distinguishes inspection from recovery, contextual visibility from ambient visibility, and exceptional authority from ordinary workflow authority.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/audits/roadmap_reconstruction_inventory_pass1.md`
- `docs/audits/phase_status_reconciliation_pass2.md`
- `docs/audits/highest_waste_risk_surface_families_pass6.md`
- `docs/audits/command_search_bypass_risk_pass7.md`
- `docs/audits/mixed_authority_header_concentration_pass8.md`
- `docs/audits/advisory_mutation_verification_separation_pass9.md`
- `docs/audits/semantic_escalation_authority_transition_pass10.md`
- `docs/audits/phase29/persistence_and_recovery_surface_review.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/authority_boundary_matrix.md`
- `docs/audits/phase29/workspace_header_density_review.md`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/App.tsx`

## Normalization Pressure Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Exceptional Authority`: authority that should remain visibly outside ordinary workflow, such as restore or crash recovery.
- `Ambient Workflow Authority`: authority users absorb as ordinary, always-available workflow power.
- `Inspection Authority`: proof/reporting/checking authority that should not inherit mutation or recovery semantics.
- `Recovery Authority`: exceptional repair/restore/reopen authority.
- `Mutation Authority`: direct consequential state change authority.
- `Support Authority`: legitimate operator-facing support/status/retry visibility.
- `Contextual Visibility`: visible when relevant or required, without claiming continuous ordinary workflow status.
- `Ambient Visibility`: repeated always-nearby visibility that can normalize a surface into ordinary workflow.
- `Repeated Exposure Pressure`: pressure created when users repeatedly see the same exceptional/control family during ordinary use.
- `Workflow Normalization Pressure`: drift where exceptional or support semantics start to feel like ordinary workflow semantics.

## Executive Findings

- The main Pass 11 problem is not that support and recovery surfaces exist. It is that repetition and adjacency can gradually reclassify them from exceptional-path authority into ordinary workflow expectations.
- `Verification`, `snapshot creation`, and `restore` remain semantically distinct, but shared safety framing and nearby access routes keep pushing them toward one blended “safety tooling” identity.
- `Service health`, `retry`, and `recovery available` surfaces are legitimate support truth, yet repeated presence can turn operational truth into ambient workflow furniture.
- `SnapshotsPanel` is the strongest normalization-risk container because it combines proof, backup creation, restore, and record access under one repeatedly reachable family.
- The most durable survivors are the underlying contracts: verification proves, snapshot creation preserves version-state, restore mutates exceptional state, and support truth reports condition rather than granting ordinary workflow authority.

## Exceptional -> Ambient Workflow Drift Findings

- Exceptional tooling starts out justified by real operational need.
- Drift begins when the same surfaces or entry points remain visible during steady-state use rather than only during relevant exceptions.
- The header intensifies this drift:
  - snapshot creation
  - verify snapshots
  - snapshots panel access
  all remain one click away from ordinary authoring controls.
- Repeated exposure makes users absorb:
  - “safety tooling is just part of normal writing flow”
  - “restore-adjacent spaces are routine”
  - “verification is one more authoring-side action”

Pass 11 conclusion:
- exceptional authority drifts toward ambient workflow authority through repetition faster than through explicit product claims

## Verification -> Recovery Normalization Findings

- `Verify snapshots` is `Inspection Authority`.
- It reports or proves safety state.
- It does not replace project state.
- Normalization pressure appears because:
  - it sits near snapshot and panel-open actions in the header
  - the panel it opens or relates to also contains restore-capable controls
  - all of these surfaces share safety language

Drift chain:

1. verify appears as a protective action
2. user visits snapshot tooling repeatedly
3. proof and restore live in one family
4. inspection gradually feels like part of recovery execution

Result:
- users can stop feeling the difference between “check the state” and “repair/replace the state”

## Snapshot -> Restore Normalization Findings

- `Snapshot` is not restore.
- `Snapshot` is version-state creation authority.
- `Restore` is recovery mutation authority.
- Normalization pressure arises because both are framed as protective or safety-oriented:
  - snapshot feels preventative
  - restore feels corrective
  - repeated adjacency makes both feel like normal maintenance operations inside everyday workflow

Drift chain:

1. create snapshot from primary workflow area
2. revisit snapshot tooling during normal sessions
3. restore is encountered as a nearby available option
4. restore starts to feel like an expected routine utility instead of an exceptional action

Pass 11 conclusion:
- version-state creation and recovery mutation should remain semantically separate
- shared “safety” framing is not enough to preserve that separation

## Support / Recovery Visibility Pressure Findings

- `RecoveryBanner` is appropriately visible when recovery is required.
- `ServiceHealthBanner` is appropriately visible when services are unavailable.
- `ServiceStatusPill` is legitimate runtime support truth.
- These surfaces survive best under contextual visibility:
  - visible because current state demands attention
  - not visible because the workflow assumes support as a steady peer

Pressure grows when:

- banners persist beyond the actual exception-path need
- retry affordances become familiar workflow controls
- recovery phrasing becomes part of the normal interface rhythm
- header and panel access keep support/recovery nearby during ordinary authoring

Pass 11 conclusion:
- support truth is legitimate
- support truth repeated too often without context becomes ambient workflow pressure

## Diagnostics / Support Exposure Findings

- Diagnostics and support remain especially vulnerable to leakage because the same family can carry:
  - real support truth
  - test-offline scaffolding
  - diagnostics affordances
  - recovery-state explanation
- `RecoveryBanner` includes `View diagnostics`.
- `ServiceHealthBanner` includes retry and test-oriented branches.
- Prior Phase 29 findings already showed the weakest boundary is where support language and diagnostics/test language share one family.

Normalization risk:
- once diagnostics-like entry lives beside support and recovery entry long enough, users can absorb diagnostics as a routine operational workflow tool rather than a bounded support aid

## Repetition / Familiarity Governance Findings

- Familiarity is itself a governance vector.
- A control or banner does not need a policy promotion to become normalized.
- Repetition creates:
  - trust through mere exposure
  - expectation through habit
  - perceived legitimacy through routine availability

This matters most for:

- restore-capable families
- snapshot/verification families
- retry/service-health families
- diagnostics-adjacent support entry

Pass 11 conclusion:
- governance must treat repeated exposure as authority-shaping, not just aesthetics

## Ambient Workflow Authority Findings

- Ambient workflow authority emerges when users start to read a surface as:
  - always relevant
  - always nearby
  - part of ordinary progression
- In the current repo, support/recovery surfaces risk ambient authority through:
  - header adjacency
  - snapshots panel reachability
  - repeated support/retry/status signals
  - shared safety/protection language

Most at-risk surfaces:

- verify snapshots
- snapshot creation
- snapshots panel access
- restore routes inside snapshots tooling
- retry / service status visibility when repeatedly encountered

## Highest Normalization-Risk Areas

- header-visible snapshot / verify / snapshots-panel cluster
- snapshots panel as a combined proof + backup + restore family
- repeated recovery banner visibility when present often enough to feel routine
- service health / retry visibility when it becomes part of ordinary session rhythm
- diagnostics entry coexisting with support/recovery language

## Maintenance-Only Safe Areas

- verification/reporting capability
- snapshot/version-state creation capability
- restore exception-path safety framing
- service health honesty
- retry truth when tied to real current unavailability
- diagnostics/support separation language
- offline/recovery explanation that stays contextual

## Areas That Should Pause

- expanding header-visible support/recovery entry points
- blending verification, snapshot creation, and restore under one convenience family
- broadening diagnostics visibility through support/recovery surfaces
- making support/recovery tooling feel like routine authoring-side utilities
- increasing repeated exposure of exceptional tooling without stronger contextual boundaries

## Underlying Contracts That Survive Better Than Repeated Visibility

- verification proves or reports state
- snapshot creation preserves recoverable version-state
- restore mutates exceptional recovery/project state
- retry is operational support, not workflow progression
- service health communicates runtime truth, not permission
- recovery is exceptional, not ambient
- diagnostics should remain bounded from product support semantics

Current Pass 11 conclusion:
The contracts survive. Repetition is what distorts them.

## Contradictions Found

- Safety/protection language honestly covers verification, snapshotting, and restore, but that same shared language accelerates semantic blending.
- Support visibility is necessary when failure is real, yet repeated support visibility can quietly reclassify itself into ordinary workflow presence.
- Recovery banners are correctly exceptional in principle, but any repeated exposure trains familiarity that works against exception-path framing.
- Diagnostics access is useful in support scenarios, but support-adjacent placement can make diagnostics feel routine.

## Areas Too Ambiguous To Stabilize Yet

- how much support/recovery visibility can remain steady-state without becoming ambient workflow
- whether snapshots panel access should later be treated as contextual support or advanced-only tooling
- how often retry/status surfaces can appear before they materially reshape workflow expectations
- whether some verification visibility can survive as ordinary reassurance without dragging restore semantics with it

## Questions For Orchestrator

- Should Reconstruction Pass 12 focus next on `runtime truth` versus `diagnostics/support leakage`, or stay centered on `verification/snapshot/restore` separation under repeated exposure?
- Should future reconstruction classify `snapshots panel access` as its own normalization family separate from the underlying verification and restore actions?
- Should support/recovery normalization pressure later be mapped phase-by-phase against actual user exposure frequency, or remain conceptual until workflow-state canon stabilizes?

## Recommended Reconstruction Pass 12

Run a twelfth reconstruction pass focused on runtime truth versus diagnostics/support leakage boundaries.

Pass 12 should:

- keep support truth separate from diagnostics semantics
- preserve the distinction between contextual support visibility and ambient support presence
- avoid redesigning surfaces while clarifying which support/recovery semantics must stay exceptional
- retain the separation between verification, snapshot creation, and restore

Pass 12 should not rewrite the roadmap, redesign the GUI, authorize topology architecture, or authorize Story Unit persistence.
