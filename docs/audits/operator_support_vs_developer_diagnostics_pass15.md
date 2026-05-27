# Operator Support vs Developer Diagnostics Exposure Reconstruction - Pass 15

## Purpose

This document reconstructs the exposure boundary between operator-facing support truth, developer-facing diagnostics authority, validation/test scaffolding, internal system semantics, and ordinary workflow legitimacy.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not GUI redesign approval, not diagnostics expansion approval, not topology authorization, not Story Unit persistence approval, and not Phase 32 activation.

This pass distinguishes operator support from developer diagnostics, runtime truth from internal implementation semantics, validation scaffolding from ordinary workflow behavior, and test-state semantics from user-facing workflow legitimacy.

Assumption handling:
- Current GUI placement is treated as transitional evidence, not final workflow architecture.
- Test and diagnostics evidence is treated as developer reality unless a source explicitly classifies it as product-visible support.
- Where evidence conflicts, this pass reports the conflict rather than resolving it into an implementation decision.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/runtime_truth_diagnostics_support_leakage_pass12.md`
- `docs/audits/runtime_truth_vs_transparency_truth_pass13.md`
- `docs/audits/support_truth_diagnostics_leakage_boundaries_pass14.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/authority_boundary_matrix.md`
- `docs/audits/phase29/dev_surface_initial_findings.md`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/App.tsx`

## Exposure Boundary Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Operator Support Truth`: honest product-facing explanation of a current condition, limitation, retry option, or recovery availability.
- `Developer Diagnostics Authority`: investigation, debugging, diagnostic folder access, harness readiness, or failure-analysis authority intended for engineering and support diagnosis rather than ordinary workflow.
- `Runtime Truth`: accurate reporting of current service, recovery, availability, or degraded-state condition.
- `Validation Scaffolding`: test harness bridges, injected states, synthetic events, stable visual modes, and fixture behaviors used to prove or stabilize behavior.
- `Test-State Semantics`: labels, reasons, branches, or modes that describe a test condition rather than a user workflow condition.
- `Frozen/Offline Semantics`: forced, frozen, unavailable, or degraded states that may be valid in tests or support but should not automatically become product workflow meaning.
- `Workflow Legitimacy`: the inferred belief that a visible surface belongs to ordinary accepted product workflow.
- `Exposure Contamination`: drift caused when developer/test/internal semantics become visible or adjacent enough to inherit product legitimacy.
- `Internal Operational Semantics`: implementation concepts such as bridge state, test mode, service reason keys, harness freeze, or readiness probes that may be true internally but are not necessarily user-facing workflow truth.
- `Ordinary Workflow Authority`: authority users assign to routine authoring, generation, review, navigation, and persistence actions because they appear as accepted product controls.

## Executive Findings

- The main Pass 15 problem is exposure, not falsity. Developer diagnostics and validation scaffolding can be technically accurate while still contaminating ordinary workflow legitimacy if they appear through support/runtime surfaces.
- Operator support survives as a necessary product-facing family for offline truth, retry truth, recovery availability, and local failure explanation.
- Developer diagnostics authority survives only when it remains bounded as investigation or evidence, not as a routine workflow control.
- Test-state semantics such as `test-offline`, frozen rendering, synthetic service events, and test bridges are developer reality. They should not become operator workflow truth merely because they reuse support/status surfaces.
- The most dangerous exposure pattern is shared-family inheritance: support surfaces earn operator trust, then diagnostics/test/internal meanings borrow that trust through proximity, wording, or repeated visibility.

## Operator Support Findings

- Operator support is valid when it answers a bounded user question:
  - what condition is the app or service currently in?
  - is retry meaningful right now?
  - is recovery available because an exception occurred?
  - what local action can safely continue or inspect the current support condition?
- `ServiceStatusPill` and `ServiceHealthBanner` carry legitimate operator support truth for service online/offline, port unavailable, and retry-relevant degraded states.
- `RecoveryBanner` carries legitimate operator support truth when recovery is actually required.
- Offline banner and toast-style support signals are legitimate when they describe real runtime prerequisites or service unavailability.

Pass 15 finding:
- operator support truth is safest when it remains narrow, contextual, and condition-driven
- it becomes exposure-sensitive when it carries developer/test explanations or diagnostics entry points in the same visible family

## Developer Diagnostics Findings

- Developer diagnostics authority appears in:
  - diagnostics bridge and diagnostic e2e specs
  - diagnostic folder access and harness readiness checks
  - Playwright/debug logging seams
  - diagnostics entry from recovery/support surfaces
  - test-mode APIs and service-state injection bridges
- Phase 29 classified the diagnostics bridge as requiring `validate_first` because it has both user-facing support implications and test-only diagnostic evidence.
- Diagnostics authority should support investigation and proof. It should not silently become:
  - ordinary authoring support
  - routine recovery workflow
  - advanced-user product mode
  - readiness or quality certification

Pass 15 finding:
- diagnostics does not become safe merely because it is useful during support
- the boundary depends on exposure context, not only on whether the diagnostic data is true

## Validation / Test-State Findings

- Validation scaffolding includes:
  - `__testEnv`
  - `__testInsights`
  - `window.testMode`
  - service health test events
  - visual-stable and animation-disable harnesses
  - test UI sandbox utilities
  - offline/stable/frozen test modes
- These seams are valuable for proof and stability.
- They are not ordinary operator workflow semantics.
- The highest risk is when validation scaffolding changes visible service state or scene-selection evidence, because the resulting surface can look like product truth even when the cause is test-only.

Pass 15 conclusion:
- validation scaffolding survives as dev/test infrastructure
- validation scaffolding must not define product support language, workflow behavior, or ordinary legitimacy

## Frozen / Offline Semantics Findings

- Offline semantics split into two families:
  - real runtime support truth, such as service unavailable or port unavailable
  - test/frozen semantics, such as forced offline for an automated test or frozen service-health rendering
- `ServiceHealthBanner` contains forced-offline and frozen-state branches inside the same broad service-health family used for real operator support.
- `ServiceStatusPill` contains test-offline labeling inside the runtime status family.
- `App.tsx` wires forced-offline/test-freeze state into the same service-health area that also supports real runtime degradation.

Pass 15 finding:
- offline truth is safe when it reports real operator condition
- frozen/offline test semantics become contaminating when ordinary users or future implementation can read them as product workflow behavior

## Internal Operational Semantics Leakage Findings

- Internal operational semantics include:
  - service reason keys
  - test-offline causes
  - frozen banner state
  - bridge readiness
  - harness event injection
  - diagnostics folder access
  - synthetic stable-mode flags
- These concepts are legitimate internally, but they should not automatically become external workflow vocabulary.
- Leakage occurs when internal state names, test causality, or harness behavior become visible through support surfaces with product authority.

Observed leakage chain:

1. internal/test condition determines runtime surface state
2. support surface displays a truthful but internally flavored condition
3. repeated exposure makes the condition feel product-normal
4. future workflow decisions treat the internal/test concept as user-facing authority

## Workflow Contamination Findings

- Workflow contamination happens when support, diagnostics, validation, or internal semantics start behaving like ordinary workflow tooling.
- Current contamination vectors include:
  - service status near primary workflow controls
  - retry becoming a familiar rhythm during degraded states
  - diagnostics entry beside recovery mutation/navigation actions
  - test-state semantics sharing product-visible support families
  - header-visible status signals lending action-readiness meaning
- The contamination does not require false wording. It only requires visibility, adjacency, and repeated exposure.

Pass 15 conclusion:
- workflow contamination is an exposure problem before it is a copy or layout problem

## Ordinary Workflow Legitimacy Findings

- Ordinary workflow legitimacy is created by what users repeatedly see as normal, nearby, and actionable.
- Runtime truth can create operational readiness inference.
- Support truth can create a sense that degraded operation is routine.
- Diagnostics visibility can create a sense that investigation is ordinary workflow tooling.
- Test-state exposure can create a sense that harness concepts are product concepts.

Pass 15 finding:
- visibility creates implied legitimacy
- repeated visibility creates normalization pressure
- support and diagnostics surfaces therefore need stricter semantic containment than ordinary status text

## Highest Exposure-Contamination Areas

- `ServiceHealthBanner` combining product-visible support with forced-offline and frozen-state branches
- `ServiceStatusPill` combining runtime status, retry affordance, and test-offline semantics
- `RecoveryBanner` placing `View diagnostics` beside restore/reopen support actions
- diagnostics bridge and diagnostic specs crossing product-support and test-only evidence lanes
- `__testInsights` and service-health test events that can alter visible service truth in tests
- header-visible service/status indicators near primary workflow controls
- internal reason keys and test/frozen semantics that can surface through user-facing support language

## Maintenance-Only Safe Areas

- honest operator-facing service-state labeling
- retry truth tied to real current degraded conditions
- recovery availability messaging when recovery is actually required
- diagnostics infrastructure kept bounded to investigation, support evidence, or dev/test validation
- test harness bridges kept dev-only and non-authoritative for product workflow
- contextual support visibility that appears because a real condition requires it
- documentation that preserves support/diagnostics/test distinctions without authorizing expansion

## Areas That Should Pause

- exposing more diagnostics through support or recovery surfaces
- widening test/frozen/offline semantics inside operator-facing status families
- treating diagnostics as advanced-user workflow tooling
- using runtime truth as readiness approval
- using validation scaffolding as product behavior evidence beyond test proof
- making internal operational concepts part of ordinary workflow vocabulary
- increasing ambient status/support visibility without stronger exposure boundaries

## Underlying Contracts That Survive Better Than Exposure Placement

- operator support truth reports condition and bounded support action, not debug authority
- developer diagnostics authority supports investigation, not ordinary workflow progression
- runtime truth reports current state, not operational readiness approval
- validation scaffolding proves behavior, not product workflow legitimacy
- test-state semantics describe harness reality, not user-facing workflow truth
- frozen/offline test states are evidence tools, not ordinary degraded-workflow states
- internal operational semantics may guide implementation, but should not become external workflow authority by leakage

Current Pass 15 conclusion:
The underlying contracts survive. What fails under pressure is exposure placement, especially when developer/test/internal semantics borrow support-surface legitimacy.

## Contradictions Found

- Service-health support is legitimate operator truth, yet the same family carries test/frozen semantics that are not operator workflow truth.
- Diagnostics bridge work has real support value, yet the same diagnostics lane is documented through test-only specs and developer-oriented readiness checks.
- Test scaffolding is necessary to prove runtime behavior, yet it can alter visible support state in ways that should not define product semantics.
- Offline status is a valid support condition, yet `test-offline` wording makes offline truth partly developer-facing inside an operator-visible family.
- Recovery support is correctly exceptional, yet recovery-adjacent diagnostics access makes investigation feel like a peer workflow action.

## Areas Too Ambiguous To Stabilize Yet

- whether diagnostics access should ever remain support-adjacent, or only appear after a deeper support transition
- how much service status can stay continuously visible without creating ordinary workflow readiness inference
- whether test-offline wording should be treated as acceptable harness-visible copy or as leakage evidence requiring later containment
- how diagnostics bridge authority should split between product support, developer diagnostics, and automated validation
- whether some internal operational terms can safely appear in support copy when they improve honesty but weaken workflow boundaries

## Questions For Orchestrator

- Should Reconstruction Pass 16 focus on internal operational semantics versus user-facing workflow vocabulary, or on diagnostics entry-point transition rules?
- Should diagnostics bridge authority be split into product-support diagnostics and developer/test diagnostics as separate future governance families?
- Should `test-offline` and frozen-state semantics be classified as acceptable test-only exposure, or as leakage that later requires containment even if currently useful?
- Should future reconstruction treat always-visible service status as support truth, ambient runtime truth, or workflow-readiness pressure?

## Recommended Reconstruction Pass 16

Run a sixteenth reconstruction pass focused on internal operational semantics versus user-facing workflow vocabulary.

Pass 16 should:

- preserve the distinction between runtime truth and internal implementation semantics
- classify which internal/test concepts may inform support copy without becoming workflow vocabulary
- keep diagnostics authority separate from ordinary support and workflow legitimacy
- avoid redesigning surfaces while clarifying which exposed terms are safe, contextual, support-only, dev-only, or paused

Pass 16 should not rewrite the roadmap, redesign the GUI, authorize diagnostics expansion, authorize topology architecture, authorize Story Unit persistence, renumber phases, or activate Phase 32.
