# Product-Support Diagnostics vs Developer/Test Diagnostics Vocabulary Split - Pass 17

## Purpose

This document reconstructs the vocabulary boundary between product-support diagnostics and developer/test diagnostics so internal test, harness, frozen/offline, bridge, and diagnostic terms do not become ordinary user-facing workflow language.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not product copy rewrite approval, not GUI redesign approval, not diagnostics expansion approval, not topology authorization, not Story Unit persistence approval, and not Phase 32 activation.

This pass distinguishes product-support diagnostics from developer/test diagnostics, internal reason keys from user-facing condition language, operator-facing investigation from developer-facing investigation, and recovery vocabulary from ordinary product-support vocabulary.

Assumption handling:
- Current GUI vocabulary is treated as transitional evidence, not final product language.
- `test-offline` and frozen-state terminology are treated as dev/test exposure only unless explicitly classified otherwise by later orchestrator ruling.
- Where evidence conflicts, this pass reports the conflict rather than resolving it into implementation or copy direction.

## Source Documents / Code Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/support_truth_diagnostics_leakage_boundaries_pass14.md`
- `docs/audits/operator_support_vs_developer_diagnostics_pass15.md`
- `docs/audits/internal_semantics_vs_user_workflow_vocabulary_pass16.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/dev_surface_initial_findings.md`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/App.tsx`
- `app/main/preload.ts`
- `app/shared/ipc/diagnostics.ts`
- `app/renderer/testMode/testModeManager.ts`

## Diagnostics Vocabulary Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Product-Support Diagnostics`: bounded operator-facing investigation language used to help support a real user-visible condition without exposing developer/test internals as workflow truth.
- `Developer/Test Diagnostics`: diagnostics language for harnesses, fixtures, test modes, bridge readiness, logging channels, debug seams, and engineering failure analysis.
- `Internal Reason Keys`: implementation-facing identifiers such as `test-offline`, `service_port_unavailable`, `test:service-status`, or frozen-state flags.
- `Operator-Facing Investigation Language`: user-visible language that invites bounded inspection of support evidence without implying ordinary workflow authority.
- `Developer-Facing Investigation Language`: engineering vocabulary for reproducing, diagnosing, tracing, or validating system behavior.
- `Recovery Diagnostics Vocabulary`: diagnostics language that appears in or near recovery-only states and therefore inherits exception-path sensitivity.
- `Support-Facing Condition Language`: product-support wording that translates internal state into user-relevant condition, limitation, retry, or recovery availability.
- `Workflow Legitimacy Language`: diagnostics wording that makes investigation feel like routine authoring, routine recovery, readiness approval, or advanced-user workflow.
- `Leakage Vocabulary`: developer/test/internal diagnostic terms that become visible or adjacent enough to borrow product-support or workflow legitimacy.

## Executive Findings

- Diagnostics vocabulary needs a split before diagnostics placement can be stabilized: product-support diagnostics and developer/test diagnostics are different authority families.
- Product-support diagnostics may explain or expose bounded support evidence for real operator conditions. It should not expose harness terms, test reasons, frozen flags, bridge names, or readiness checks as user workflow vocabulary.
- Developer/test diagnostics may use precise internal language, but that precision is not product-facing authority.
- Recovery diagnostics vocabulary is especially sensitive because recovery is its own exceptional vocabulary family, not ordinary support vocabulary.
- The strongest leakage vector remains shared wording: `diagnostics`, `offline`, `test`, `retry`, and `recovery` can each be truthful while still causing workflow legitimacy drift when combined.

## Product-Support Diagnostics Vocabulary Findings

- Product-support diagnostics vocabulary should answer:
  - what user-visible condition exists?
  - what bounded evidence can help support or recovery?
  - what investigation path is available without making it a routine workflow action?
- Candidate product-support diagnostic vocabulary is narrower than developer diagnostics. It can refer to support evidence or diagnostics only when tied to a real condition.
- Product-support diagnostics should avoid naming:
  - test modes
  - harness events
  - bridge APIs
  - frozen flags
  - internal reason keys
  - validation scaffolding

Pass 17 finding:
- product-support diagnostics survives as bounded support investigation language, not as ordinary workflow or developer vocabulary.

## Developer/Test Diagnostics Vocabulary Findings

- Developer/test diagnostics vocabulary includes:
  - `__testInsights`
  - `window.testMode`
  - `test:service-status`
  - diagnostic e2e specs
  - logging diagnostics channels
  - diagnostics bridge implementation names
  - test/frozen/offline mode names
  - harness readiness and fixture vocabulary
- This vocabulary is legitimate for validation, reproduction, debugging, and engineering diagnosis.
- It becomes unsafe when copied or rendered into product-support surfaces without translation.

Pass 17 conclusion:
- developer/test diagnostics vocabulary should remain precise internally
- precision does not grant product-facing legitimacy

## Internal Reason Key Findings

- Current internal reason keys and related terms include:
  - `test-offline`
  - `service_port_unavailable`
  - `test:service-status`
  - `testFreezeUntilRetry`
  - `testModeFreezeServiceHealth`
  - `test-frozen`
- These keys are useful for code paths and tests.
- They should not define user-facing condition language.
- `service_port_unavailable` is closer to product-support condition language than `test-offline`, but it is still an internal reason key and should be translated before becoming operator vocabulary.

Pass 17 finding:
- internal reason keys should classify causes, not become support copy or workflow categories.

## Test / Frozen / Offline Term Findings

- `test-offline` should not appear in ordinary rendered product surfaces.
- Frozen-state terminology is acceptable only as dev/test exposure.
- `Backend services offline (test)` is honest in test context but vocabulary-leakage sensitive because it combines operator support language with developer/test terminology.
- `The backend services are forced offline for this automated test run.` is developer/test-facing investigation language, not ordinary operator support language.
- Offline support language is valid when it describes real runtime unavailability, but test/frozen/offline terms should not become user-facing workflow legitimacy.

Pass 17 conclusion:
- offline support language and test-offline diagnostic language must remain separate even when they share underlying service-health surfaces.

## Diagnostic Bridge Terminology Findings

- The diagnostics bridge currently spans:
  - product-support implications through visible recovery diagnostics access
  - developer/test diagnostics through diagnostic specs and bridge/readiness evidence
  - internal implementation vocabulary through IPC and preload exposure
- Pass 15 and Pass 16 both identified that diagnostics bridge authority should later split.
- The vocabulary split should precede any placement or implementation decision.

Pass 17 finding:
- `diagnostics bridge` is not one vocabulary family
- future governance should separate product-support diagnostics labels from developer/test diagnostics labels before expanding or normalizing any diagnostics entry

## Recovery Diagnostics Vocabulary Findings

- Recovery vocabulary is its own exceptional vocabulary family.
- `View diagnostics` is the highest-risk visible diagnostics phrase because it sits beside recovery actions such as `Restore snapshot` and `Reopen last project`.
- In recovery context, diagnostics can be support-relevant, but the phrase still risks becoming a peer action alongside mutation and navigation.
- Recovery diagnostics vocabulary should preserve exception-path meaning and not read as routine product utility.

Pass 17 conclusion:
- diagnostics vocabulary near recovery must be governed more strictly than diagnostics vocabulary in a developer/test surface

## Operator-Facing vs Developer-Facing Investigation Language

- Operator-facing investigation language should:
  - describe user-relevant condition
  - avoid internal cause names unless needed and translated
  - remain contextual to a visible support or recovery condition
  - avoid implying routine workflow value
- Developer-facing investigation language may:
  - name reason keys
  - name bridge APIs
  - name test events
  - name frozen states
  - expose logs, readiness checks, and harness state
- The boundary is not honesty. Both can be honest.
- The boundary is whether the language grants workflow legitimacy to internal/test/diagnostic concepts.

Pass 17 finding:
- operator-facing investigation should reveal enough to support the user, while developer-facing investigation should reveal enough to debug the system

## Highest Diagnostics Vocabulary Leakage Areas

- `View diagnostics` beside `Restore snapshot` and `Reopen last project`.
- `Backend services offline (test)` inside the service status family.
- `test-offline` shaping visible support condition language.
- `test-frozen` and frozen service-health classes near retry/support behavior.
- diagnostics bridge vocabulary spanning product-support and developer/test evidence.
- `__testInsights`, `window.testMode`, and `test:service-status` as developer/test terms that can alter visible status.
- always-visible service status near workflow controls, because diagnostics/status vocabulary then inherits workflow-readiness pressure.
- `service_port_unavailable` where internal cause and support-facing condition language sit close together.

## Maintenance-Only Safe Areas

- product-support diagnostics limited to real support or recovery conditions
- developer/test diagnostics kept in harnesses, fixtures, logs, diagnostic specs, and dev-only APIs
- internal reason keys kept internal or translated before support exposure
- runtime offline/port-unavailable language kept as support condition language
- recovery diagnostics treated as exception-path investigation, not ordinary workflow
- documentation that preserves the diagnostics split without rewriting product copy globally
- diagnostics bridge maintenance that does not expand visibility or authority

## Areas That Should Pause

- expanding diagnostics entries through support or recovery surfaces
- using `test-offline` in ordinary rendered product surfaces
- exposing frozen/test mode vocabulary through product-support copy
- treating the diagnostics bridge as one unified product vocabulary family
- making diagnostics wording a routine workflow verb
- using internal reason keys as user-facing condition labels
- normalizing recovery diagnostics as ordinary maintenance tooling

## Underlying Contracts That Survive Better Than Current Diagnostics Wording

- product-support diagnostics help explain or gather evidence for real user-visible conditions
- developer/test diagnostics help reproduce, validate, and debug implementation behavior
- internal reason keys classify implementation causes, not user workflow states
- operator-facing investigation language should be contextual and translated
- developer-facing investigation language may be precise and internal
- recovery diagnostics remain exception-path vocabulary
- diagnostics vocabulary should not confer ordinary workflow legitimacy

Current Pass 17 conclusion:
The diagnostics contracts survive. Current wording becomes risky when one `diagnostics` vocabulary family is allowed to cover product support, recovery investigation, developer testing, internal reason keys, and workflow-adjacent action language.

## Contradictions Found

- Diagnostics vocabulary is useful for support, yet the visible phrase `View diagnostics` makes diagnostics feel like a peer recovery action.
- `test-offline` is useful developer/test vocabulary, yet it influences visible service status wording.
- Internal reason keys need precision, yet precision becomes leakage when used as product-support terminology.
- Recovery diagnostics can be legitimate in exceptional conditions, yet recovery adjacency grants workflow legitimacy faster than ordinary support placement.
- The diagnostics bridge is a real support mechanism and a developer/test mechanism, but current vocabulary does not yet split those audiences.

## Areas Too Ambiguous To Stabilize Yet

- what product-support diagnostics should be called without rewriting copy globally
- whether `View diagnostics` can remain in recovery context with stricter transition framing
- where diagnostics bridge vocabulary should split in docs, code, and UI-facing language
- whether `service_port_unavailable` should map to a durable support condition family or remain strictly internal
- how much operator-facing investigation language can reveal before becoming developer diagnostics
- whether recovery diagnostics should be separate from all other support diagnostics vocabulary

## Questions For Orchestrator

- Should Reconstruction Pass 18 focus on recovery diagnostics transition rules or on diagnostics bridge authority splitting?
- Should `View diagnostics` be treated as acceptable recovery-support vocabulary, or as leakage-sensitive wording requiring future containment?
- Should `service_port_unavailable` become a named support condition family, or remain an internal reason key only?
- Should product-support diagnostics and developer/test diagnostics receive separate canonical vocabulary lists in a later governance artifact?
- Should recovery diagnostics be governed as a subfamily of product-support diagnostics or as a separate exceptional family?

## Recommended Reconstruction Pass 18

Run an eighteenth reconstruction pass focused on recovery diagnostics transition rules.

Pass 18 should:

- treat recovery vocabulary as an exceptional family separate from ordinary support vocabulary
- classify when diagnostics language may appear near restore/reopen recovery actions
- preserve the split between product-support diagnostics and developer/test diagnostics
- keep internal reason keys out of user-facing workflow legitimacy
- avoid product copy rewrites while clarifying transition authority boundaries

Pass 18 should not rewrite the roadmap, redesign the GUI, rewrite product copy globally, authorize diagnostics expansion, authorize topology architecture, authorize Story Unit persistence, renumber phases, or activate Phase 32.
