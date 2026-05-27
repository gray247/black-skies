# Support Truth vs Diagnostics Leakage Boundaries - Pass 14

## Purpose

This document reconstructs the boundary between honest support truth and diagnostics leakage, especially where support-facing language, runtime state, retry/recovery messaging, logs, test/offline branches, and diagnostics affordances can drift into ordinary workflow tooling.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not GUI redesign approval, and not approval to expand diagnostics or support surfaces.

This pass distinguishes support truth from diagnostics authority, operator-facing support from developer diagnostics, runtime truth from operational readiness inference, and support/recovery messaging from ordinary workflow tooling.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/phase_r2_closure_snapshot_draft.md`
- `docs/audits/support_recovery_normalization_pressure_pass11.md`
- `docs/audits/runtime_truth_diagnostics_support_leakage_pass12.md`
- `docs/audits/runtime_truth_vs_transparency_truth_pass13.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/authority_boundary_matrix.md`
- `docs/audits/phase29/workspace_header_density_review.md`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/App.tsx`

Assumption handling:
- No product implementation authority is assumed from these source documents.
- Where source evidence is in tension, this pass reports the tension as a contradiction rather than resolving it into an implementation decision.
- Current GUI placement is treated as transitional evidence, not as final workflow architecture.

## Support / Diagnostics Boundary Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Support Truth`: honest operator-facing explanation of current runtime condition, limitation, or recovery availability.
- `Diagnostics Authority`: debugging, inspection, or failure-analysis capability that should remain bounded from ordinary workflow and ordinary support language.
- `Operator-Facing Support`: product-visible retry, offline, recovery, or service-state guidance intended to help a user continue safely.
- `Developer Diagnostics`: test-mode, debug, frozen-state, logging, or investigation seams intended for validation or engineering diagnosis.
- `Runtime Truth`: accurate reporting of current service or recovery state.
- `Operational Readiness Inference`: the mistaken belief that visible runtime/support truth implies approved workflow readiness.
- `Retry Truth`: honest indication that retry is meaningful under current conditions.
- `Recovery Truth`: honest indication that recovery exists or is needed.
- `Workflow Contamination`: drift where support or diagnostics semantics start behaving like ordinary workflow tooling.
- `Diagnostics Leakage`: drift where diagnostics semantics inherit legitimacy from support language, visibility, or adjacency.

## Executive Findings

- The main Pass 14 problem is not false support messaging. It is that honest support truth and diagnostics semantics already share visible families, making leakage easy even when labels are accurate.
- `ServiceHealthBanner` is the clearest leakage seam because it combines real operator support with test-only frozen and `test-offline` branches.
- `ServiceStatusPill` is legitimate runtime/support truth, but its retry action, test-offline label, and Playwright-only logging seam show how support truth can become a carrier for diagnostics meaning.
- `RecoveryBanner` is legitimate exception-path support, but `View diagnostics` sits beside `Restore snapshot` and `Reopen last project`, which compresses recovery support and diagnostics investigation into one routine-looking family.
- The most durable survivors are the underlying contracts: support truth explains current condition, retry truth reports a bounded operational response, recovery truth reports exceptional state, and diagnostics should remain separate from ordinary support interpretation.

## Support Truth Findings

- `ServiceStatusPill` truthfully reports:
  - checking
  - online
  - offline
  - port unavailable
- `ServiceHealthBanner` truthfully reports:
  - temporary backend unreachability
  - port unavailability
  - forced-offline test state
- `RecoveryBanner` truthfully reports:
  - crash recovery availability
  - snapshot recovery context
  - reopen/restore availability

Pass 14 finding:
- support truth survives best when it stays narrowly descriptive
- support truth becomes risky when it starts carrying test-state, debugging, or investigation semantics inside the same visible family

## Diagnostics Leakage Findings

- `ServiceHealthBanner` contains explicit test-mode and frozen-state branches that are not ordinary operator support semantics.
- `ServiceStatusPill` contains:
  - a `test-offline` label
  - a Playwright-only debug log seam
- `RecoveryBanner` exposes `View diagnostics` inside an otherwise support/recovery action cluster.
- Phase 29 evidence already identified the support-versus-diagnostics boundary as porous where runtime support language and test scaffolding share one surface family.

Leakage chain:

1. honest support surface becomes the trusted place to look
2. diagnostics or test-state variants appear inside the same family
3. diagnostics inherits product-legitimate support visibility
4. users and future implementation can overread diagnostics as ordinary workflow support tooling

## Operator Support vs Developer Diagnostics Findings

- `Operator-facing support` survives in:
  - offline truth
  - retry truth
  - recovery-required messaging
  - reopen and restore framing when recovery is truly active
- `Developer diagnostics` appears in:
  - test-offline wording
  - frozen banner states
  - Playwright/debug logging seams
  - diagnostics entry points

Boundary finding:
- operator support answers "what condition am I in and what bounded support action is relevant now?"
- developer diagnostics answers "what should be inspected, debugged, or explained more deeply?"

Current risk:
- the same support families presently carry both answers

## Runtime State / Retry / Recovery Messaging Findings

- Runtime state messaging is strongest when it reports condition without implying approval.
- Retry messaging is strongest when it remains contextual to actual temporary failure.
- Recovery messaging is strongest when it remains explicitly exceptional.

Observed drift:

1. `offline` truth appears
2. `retry` becomes visible and clickable
3. repeated retry visibility can feel like ordinary workflow rhythm
4. recovery/support semantics begin to look like part of routine operation instead of bounded exception handling

Pass 14 conclusion:
- retry and recovery messaging survive as support truth
- they become leakage carriers when repeated exposure makes them feel like ordinary workflow tools

## Test / Offline Branch Leakage Findings

- `ServiceHealthBanner` has a dedicated `test-offline` message and frozen-state rendering path.
- `ServiceStatusPill` has a dedicated `Backend services offline (test)` label.
- `App.tsx` wires explicit test-freeze and forced-offline paths into the same service-health family used for real support conditions.

Leakage risk:
- test/offline branches are valuable validation scaffolding
- but when they live in the same product-visible family as real support truth, they blur operator support and developer diagnostics

Pass 14 conclusion:
- test/offline branches should be treated as diagnostics-side evidence, not as ordinary support semantics

## Diagnostics Entry Point Findings

- `RecoveryBanner` is the clearest direct diagnostics entry point in current user-facing recovery/support surfaces.
- `View diagnostics` sits next to:
  - `Restore snapshot`
  - `Reopen last project`
- This creates a visible family where:
  - exceptional recovery mutation
  - recovery navigation
  - diagnostics investigation
  all borrow legitimacy from one another

Pass 14 conclusion:
- diagnostics entry inside a recovery family is highly leakage-sensitive even if the action remains legitimate

## Workflow Contamination Findings

- Support truth contaminates workflow when it becomes:
  - always nearby
  - repeatedly familiar
  - visually equal to ordinary workflow controls
- Diagnostics contaminates workflow when it becomes:
  - support-adjacent
  - recovery-adjacent
  - readable as just another helpful product utility

The strongest contamination vectors here are:
- header-visible status and retry truth near primary actions
- recovery-banner diagnostics entry beside restore and reopen
- test-mode service states inside the same visible support family as real runtime degradation

## Highest Leakage-Risk Areas

- `ServiceHealthBanner` mixing real support truth with `test-offline` and frozen test branches
- `RecoveryBanner` placing `View diagnostics` beside restore and reopen actions
- `ServiceStatusPill` combining real runtime truth, retry affordance, and test-offline semantics
- `App.tsx` wiring test-freeze and offline-test branches into the same product-visible service-health family
- support/recovery families that can make diagnostics feel like ordinary user tooling through repetition

## Maintenance-Only Safe Areas

- honest service offline/online/port-unavailable labeling
- honest retry truth tied to actual runtime conditions
- honest crash-recovery availability messaging
- restore exception-path safety framing
- reopen-last-project support framing when recovery is active
- explicit support-versus-diagnostics language boundaries
- contextual visibility for support/recovery surfaces

## Areas That Should Pause

- expanding diagnostics visibility through support or recovery surfaces
- broadening test-state wording inside ordinary support families
- making diagnostics entry points feel like ordinary workflow utilities
- increasing ambient retry/recovery visibility without stronger contextual boundaries
- deepening adjacency between support messaging and developer-diagnostics semantics

## Underlying Contracts That Survive Better Than Diagnostics Placement

- support truth reports condition, not debug depth
- retry truth reports a bounded operational response, not routine workflow progression
- recovery truth reports exceptional availability, not ordinary workflow tooling
- diagnostics authority supports investigation, not ordinary operator workflow
- operator-facing support should remain distinct from developer/test scaffolding
- test/offline seams can remain valid evidence without inheriting product-visible support authority

Current Pass 14 conclusion:
The support contracts survive. What leaks is diagnostics legitimacy borrowed from support placement and repeated exposure.

## Contradictions Found

- The service-health surfaces are honest about runtime condition while simultaneously carrying test-only branches that are not ordinary support semantics.
- Recovery visibility is correctly exceptional in principle, yet `View diagnostics` makes diagnostics feel like a peer action inside a user-facing recovery family.
- Retry is legitimate operator support, yet repeated retry exposure can normalize degraded-state workflow.
- Test-mode service-state scaffolding is useful for validation, yet its placement inside real support families makes the support boundary harder to preserve.

## Areas Too Ambiguous To Stabilize Yet

- how much support truth can remain steadily visible without pulling diagnostics meaning along with it
- whether diagnostics entry should later be treated as contextual support-adjacent access or strictly deeper-than-support investigation
- how much retry visibility can recur before it materially reshapes operator expectations
- whether some support truth can stay always-available without also normalizing test/offline semantics

## Questions For Orchestrator

- Should Reconstruction Pass 15 focus next on `operator support` versus `developer diagnostics` as separate exposure families, or on exact `recovery/support -> diagnostics entry` transition boundaries?
- Should future reconstruction classify `retry truth` as part of support truth only, or as a separate normalization-sensitive family because of repeated exposure pressure?
- Should the next pass remain conceptual, or explicitly map support-versus-diagnostics leakage back onto concrete banner, pill, and recovery-entry placements one more time?

## Recommended Reconstruction Pass 15

Run a fifteenth reconstruction pass focused on operator support versus developer diagnostics as separate exposure families.

Pass 15 should:

- preserve the distinction between support truth and diagnostics authority
- classify where operator-facing support ends and developer/test semantics begin
- keep retry/recovery messaging distinct from ordinary workflow tooling
- avoid redesigning surfaces while clarifying which support families can remain contextual without dragging diagnostics legitimacy with them

Pass 15 should not rewrite the roadmap, redesign the GUI, authorize diagnostics expansion, authorize topology architecture, or authorize Story Unit persistence.
