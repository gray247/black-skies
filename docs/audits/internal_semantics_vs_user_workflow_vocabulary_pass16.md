# Internal Operational Semantics vs User-Facing Workflow Vocabulary - Pass 16

## Purpose

This document reconstructs the boundary between internal operational semantics and user-facing workflow vocabulary, especially where developer/test/runtime concepts risk becoming product language, workflow truth, or operator-facing authority.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not copy rewrite approval, not GUI redesign approval, not diagnostics expansion approval, not topology authorization, not Story Unit persistence approval, and not Phase 32 activation.

This pass distinguishes internal vocabulary from user-facing vocabulary, developer/test language from product-support language, and runtime truth language from workflow legitimacy language.

Assumption handling:
- Current GUI wording is treated as transitional evidence, not final product language.
- Internal names and test labels are treated as developer/test vocabulary unless a source explicitly classifies them as operator support.
- Where evidence conflicts, this pass reports the conflict rather than resolving it into implementation direction.

## Source Documents / Code Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/support_truth_diagnostics_leakage_boundaries_pass14.md`
- `docs/audits/operator_support_vs_developer_diagnostics_pass15.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/dev_surface_initial_findings.md`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/App.tsx`
- `app/main/preload.ts`
- `app/renderer/testMode/testModeManager.ts`

## Vocabulary Boundary Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Internal Operational Semantics`: implementation or runtime concepts such as service reason keys, test mode, bridge state, frozen state, harness events, preload exposure, or diagnostics folder access.
- `Developer/Test Vocabulary`: words, labels, event names, APIs, or mode names intended for engineering, test harnesses, fixtures, and validation evidence.
- `Product-Support Vocabulary`: operator-facing language that explains current support conditions, limited recovery paths, service unavailability, or bounded retry actions.
- `Operator-Facing Support Truth`: accurate product-visible support language that reports a real user-relevant condition without importing debug authority.
- `User-Facing Workflow Vocabulary`: words that define ordinary authoring, review, navigation, generation, persistence, or recovery concepts for users.
- `Runtime Truth Language`: vocabulary that reports actual service, availability, port, recovery, or degraded-state condition.
- `Diagnostics Authority Language`: vocabulary that invokes investigation, diagnostics, readiness checks, logs, bridge state, or failure-analysis authority.
- `Workflow Legitimacy Language`: wording that makes a surface feel approved, routine, mature, or part of ordinary product workflow.
- `Leakage Terminology`: internal, test, diagnostic, or implementation vocabulary that becomes visible or adjacent enough to borrow user-facing legitimacy.

## Executive Findings

- Vocabulary is now a governance surface. Even technically accurate language can leak authority if internal/test terminology appears through product support or workflow surfaces.
- `test-offline`, frozen-state naming, test mode APIs, synthetic service events, and bridge concepts are developer/test vocabulary. They should not become ordinary user-facing workflow vocabulary.
- Runtime truth language is legitimate when it reports real condition, but it creates workflow-readiness pressure when it is always visible or placed near primary workflow actions.
- Product-support vocabulary survives when it remains contextual, narrow, and condition-driven. It weakens when it absorbs diagnostics authority language or internal reason semantics.
- The strongest safe contract is not the current wording. It is the separation between internal cause, support-facing condition, diagnostic investigation, and ordinary workflow meaning.

## Internal Operational Semantics Findings

- Current internal semantics include:
  - `service_port_unavailable`
  - `test-offline`
  - `testFreezeUntilRetry`
  - `testModeFreezeServiceHealth`
  - `test:service-status`
  - `__testInsights`
  - `window.testMode`
  - diagnostics bridge exposure
  - dataset-driven test/stable modes
- These terms are useful for implementation, diagnostics, and test control.
- They are not automatically safe as user-facing product language because they explain internal cause rather than user workflow condition.

Pass 16 finding:
- internal operational semantics can remain valid internally while still being unsafe as workflow vocabulary
- the boundary should be based on audience and authority, not whether the term is technically true

## Developer/Test Vocabulary Findings

- Developer/test vocabulary appears in:
  - main-world test bridges
  - service health test events
  - forced-offline reasons
  - visual-stable and recovery-mode datasets
  - test UI sandbox utilities
  - Playwright/debug logging seams
- Phase 29 classified these as dev/test-only or validate-first evidence, not product workflow vocabulary.
- Pass 15 clarified that test-state semantics are developer reality, not operator workflow truth.

Pass 16 conclusion:
- developer/test language may remain in test surfaces, fixtures, and internal diagnostics
- it should not define product-support copy, ordinary workflow terms, or user-facing readiness concepts

## Product-Support Vocabulary Findings

- Product-support vocabulary survives in:
  - `Backend services offline`
  - `Retry connection`
  - port unavailable messaging
  - recovery availability wording
  - restore/reopen wording when recovery is actually active
- This vocabulary is strongest when it tells the operator:
  - what condition exists
  - what limited response is available
  - whether the condition is exceptional
- It becomes weaker when it embeds developer-specific cause, test-mode state, diagnostics readiness, or internal implementation vocabulary.

Pass 16 finding:
- product-support vocabulary should translate internal cause into user-relevant condition without making the internal cause a workflow category

## User-Facing Workflow Vocabulary Findings

- User-facing workflow vocabulary should describe ordinary product work:
  - writing
  - reviewing
  - generating
  - saving
  - restoring only when exceptional
  - reopening only when recovery context exists
- It should not absorb vocabulary from:
  - test harness state
  - diagnostics bridge behavior
  - frozen service-health scaffolding
  - internal reason keys
  - validation mode names
- The current risk is not that workflow vocabulary has fully absorbed these terms. The risk is that support/runtime placement can make internal terms feel workflow-legitimate over time.

Pass 16 conclusion:
- ordinary workflow vocabulary should remain separate from support, diagnostics, and test vocabulary even when the same UI family displays all three during transitional states

## Test/Offline/Frozen Wording Findings

- `test-offline` and frozen-state semantics are acceptable only as test/dev exposure.
- `Backend services offline (test)` is accurate as test disclosure, but it also places developer/test causality inside a product-visible support phrase.
- `The backend services are forced offline for this automated test run.` is honest, but its intended audience is developer/test validation rather than ordinary operator workflow.
- `test-frozen` class and frozen retry behavior are implementation/test semantics, not user workflow vocabulary.

Pass 16 finding:
- test/offline/frozen wording should be treated as leakage-sensitive evidence
- its safety depends on confinement to dev/test exposure, not on wording honesty alone

## Diagnostics Vocabulary Findings

- Diagnostics vocabulary appears through:
  - `View diagnostics`
  - diagnostics bridge exposure
  - diagnostics folder access
  - diagnostic e2e specs
  - harness readiness checks
  - logging channels
- `View diagnostics` is the most visible vocabulary bridge because it sits beside recovery actions.
- Pass 15 already identified that diagnostics bridge authority should later split into product-support diagnostics and developer/test diagnostics.

Pass 16 conclusion:
- diagnostics vocabulary should not become a casual workflow verb
- diagnostics authority language should remain investigative, contextual, and separate from ordinary recovery or authoring vocabulary

## Runtime Status Vocabulary Findings

- Runtime status vocabulary includes:
  - checking
  - online
  - offline
  - port unavailable
  - service unavailable
  - retry
- These terms are runtime truth language.
- Always-visible service status is support truth plus workflow-readiness pressure, not neutral ambient truth.
- `online` can be read as readiness approval.
- `offline` can be read as workflow blockage.
- `retry` can be read as routine workflow progression if repeatedly visible.

Pass 16 finding:
- runtime status vocabulary is safe as condition language
- it is risky as workflow legitimacy language

## Support/Recovery Wording Findings

- Support/recovery wording survives when it remains exceptional and condition-bound:
  - `Restore snapshot`
  - `Reopen last project`
  - recovery-available messaging
  - retry tied to actual degradation
- Recovery vocabulary becomes workflow-legitimacy language when it appears routine, repeated, or equal to ordinary workflow controls.
- Diagnostics vocabulary beside restore/reopen makes investigation read as a peer recovery action.

Pass 16 conclusion:
- support/recovery wording should preserve exception-path meaning
- recovery language should not become ordinary authoring or maintenance vocabulary through repetition

## Highest Vocabulary-Leakage Risk Areas

- `Backend services offline (test)` because it combines product-support language with test-state vocabulary.
- `test-offline` and `service_port_unavailable` because internal reason keys can shape visible support wording.
- `testFreezeUntilRetry`, `testModeFreezeServiceHealth`, and `test-frozen` because frozen-state implementation semantics live near support/retry behavior.
- `View diagnostics` because diagnostics authority language appears beside recovery actions.
- `__testInsights`, `window.testMode`, and `test:service-status` because developer/test vocabulary can alter visible runtime truth.
- Always-visible service status vocabulary near primary workflow controls because it creates readiness pressure.
- Diagnostics bridge vocabulary because it currently spans product-support implications and developer/test diagnostics evidence.

## Maintenance-Only Safe Areas

- internal reason keys kept internal to implementation and tests
- developer/test vocabulary kept in harnesses, fixtures, diagnostic specs, and dev-only APIs
- honest support vocabulary that reports real operator conditions
- runtime truth language that reports condition without claiming workflow approval
- recovery wording that remains exceptional and context-bound
- diagnostics vocabulary used for bounded investigation rather than ordinary workflow
- documentation that preserves vocabulary boundaries without rewriting product copy globally

## Areas That Should Pause

- promoting internal reason names into user-facing workflow vocabulary
- expanding `test-offline` or frozen-state wording inside ordinary support surfaces
- making diagnostics vocabulary more visible through recovery/support surfaces
- treating runtime status words as readiness approval
- using validation scaffolding terms to describe product behavior
- normalizing recovery wording as ordinary workflow maintenance language
- globally rewriting product copy before vocabulary authority is stabilized

## Underlying Contracts That Survive Better Than Current Wording

- internal operational semantics explain implementation cause, not user workflow truth
- developer/test vocabulary supports validation, not product legitimacy
- product-support vocabulary explains condition and bounded response, not debug authority
- operator-facing support truth reports real user-relevant state, not internal state identity
- runtime truth language reports condition, not readiness approval
- diagnostics authority language supports investigation, not ordinary authoring workflow
- workflow vocabulary should name user work, not test harness behavior

Current Pass 16 conclusion:
The contracts survive better than the current wording placements. Vocabulary leaks when internal/test/diagnostic terms inherit product meaning through support, recovery, or runtime-status exposure.

## Contradictions Found

- `Backend services offline (test)` is honest for automated testing, yet it combines operator support language with developer/test vocabulary.
- `test-offline` is useful as an internal/test reason, yet it can shape product-visible status semantics.
- Runtime status vocabulary is necessary support truth, yet always-visible status creates workflow-readiness pressure.
- Diagnostics vocabulary is useful for support investigation, yet `View diagnostics` beside recovery actions makes diagnostics feel like ordinary workflow.
- Recovery wording is legitimate when exceptional, yet repeated recovery wording can become routine maintenance language.

## Areas Too Ambiguous To Stabilize Yet

- whether test-specific support copy should remain visible in any rendered product component, even under test-only conditions
- how to split diagnostics vocabulary between product-support diagnostics and developer/test diagnostics
- whether always-visible service status should use support wording, runtime wording, or a separate readiness-pressure classification
- how much internal cause can be exposed to operators when it improves honesty but risks workflow leakage
- whether recovery wording needs a stricter vocabulary family separate from ordinary support wording

## Questions For Orchestrator

- Should Reconstruction Pass 17 focus on diagnostics vocabulary split between product support and developer/test diagnostics?
- Should `test-offline` wording be classified as acceptable test-only disclosure or as a term that should never appear in rendered product components?
- Should always-visible service status vocabulary be governed as support truth, runtime truth, or workflow-readiness pressure?
- Should recovery vocabulary be treated as its own exceptional vocabulary family separate from broader product support?

## Recommended Reconstruction Pass 17

Run a seventeenth reconstruction pass focused on diagnostics vocabulary split and diagnostics entry-transition rules.

Pass 17 should:

- distinguish product-support diagnostics vocabulary from developer/test diagnostics vocabulary
- classify when diagnostics language may appear near support or recovery wording
- preserve runtime truth without turning status vocabulary into readiness approval
- keep internal/test terminology out of ordinary workflow legitimacy
- avoid copy rewrites while clarifying vocabulary authority boundaries

Pass 17 should not rewrite the roadmap, redesign the GUI, rewrite product copy globally, authorize diagnostics expansion, authorize topology architecture, authorize Story Unit persistence, renumber phases, or activate Phase 32.
