# Canonical Diagnostics Audience Vocabulary Reconstruction - Pass 19

## Purpose

This document reconstructs provisional canonical vocabulary families for diagnostics audiences so product-support diagnostics, developer/test diagnostics, and recovery diagnostics do not collapse into one shared product meaning.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not product copy rewrite approval, not GUI redesign approval, not diagnostics expansion approval, not topology authorization, not Story Unit persistence approval, and not Phase 32 activation.

This pass does not define final product copy. It defines provisional audience-vocabulary boundaries for later governance and workflow-state reconstruction.

Assumption handling:
- Current GUI vocabulary remains transitional evidence, not final product language.
- `openDiagnosticsFolder` may remain a shared bridge method only if visible/audience vocabulary is governed separately.
- Diagnostics folder access is context-dependent until later governance assigns stronger audience-specific treatment.
- `service_port_unavailable` remains internal unless translated later.

## Source Documents Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/support_truth_diagnostics_leakage_boundaries_pass14.md`
- `docs/audits/operator_support_vs_developer_diagnostics_pass15.md`
- `docs/audits/internal_semantics_vs_user_workflow_vocabulary_pass16.md`
- `docs/audits/product_support_vs_dev_test_diagnostics_vocabulary_pass17.md`
- `docs/audits/diagnostics_bridge_authority_split_pass18.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/dev_surface_initial_findings.md`

## Audience Vocabulary Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization or final product copy.

- `Product-Support Diagnostics Vocabulary`: bounded operator/support language for investigating a real user-visible condition without exposing developer/test internals.
- `Developer/Test Diagnostics Vocabulary`: precise engineering, harness, fixture, logging, bridge, and validation language.
- `Recovery Diagnostics Vocabulary`: exceptional diagnostics language tied to recovery state, restore/reopen context, or crash/recovery evidence.
- `Internal-Only Vocabulary`: reason keys, event names, class names, flags, bridge identifiers, and implementation terms that should not be product-facing unless translated later.
- `Translated Support Condition Language`: user-relevant condition wording derived from internal causes without exposing internal reason identity.
- `Context-Dependent Diagnostics Access`: diagnostics folder or evidence access whose audience depends on whether the active context is product support, recovery, or developer/test investigation.
- `Leakage-Sensitive Vocabulary`: terms that are truthful but prone to transferring legitimacy across audiences.

## Executive Findings

- Product-support diagnostics, developer/test diagnostics, and recovery diagnostics should be treated as three separate provisional vocabulary families.
- Recovery diagnostics is not ordinary support diagnostics. It is an exceptional family because recovery actions already carry mutation/navigation authority.
- Developer/test diagnostics may keep precise internal terms, but those terms should not become product-support vocabulary without translation.
- Product-support diagnostics should describe support evidence and visible condition, not harness state, bridge state, internal reason keys, or validation scaffolding.
- Shared bridge access can remain technically shared only if audience vocabulary stays split. A shared method must not imply shared product meaning.

## Product-Support Diagnostics Vocabulary

Purpose:
- explain a real support condition
- identify bounded support evidence
- help an operator or support process inspect what happened without making diagnostics a routine workflow tool

Provisional safe vocabulary family:
- support evidence
- service condition
- connection issue
- unavailable service
- support details
- diagnostic evidence
- current condition
- retry status

Boundary language:
- product-support diagnostics may describe what the operator can inspect
- product-support diagnostics should not name harnesses, test modes, bridge APIs, frozen flags, or reason keys
- product-support diagnostics should remain tied to current support or recovery need

## Developer/Test Diagnostics Vocabulary

Purpose:
- reproduce and debug implementation behavior
- validate service-state, bridge, recovery, and diagnostics paths
- preserve precise test and harness evidence

Provisional safe vocabulary family:
- `__testInsights`
- `window.testMode`
- `test:service-status`
- `test-offline`
- `test-frozen`
- `testFreezeUntilRetry`
- `testModeFreezeServiceHealth`
- diagnostics bridge
- diagnostic spec
- harness readiness
- logging channel
- fixture state

Boundary language:
- developer/test diagnostics may be precise and internal
- developer/test diagnostics may describe scaffolding, injection, bridge readiness, and forced states
- developer/test diagnostics must not be treated as product workflow vocabulary

## Recovery Diagnostics Vocabulary

Purpose:
- support exceptional recovery investigation
- help inspect evidence around restore, reopen, crash, or recovery state
- keep recovery diagnostics distinct from ordinary support and ordinary workflow

Provisional safe vocabulary family:
- recovery evidence
- recovery diagnostics
- recovery investigation
- recovery support details
- recovery state
- restore/reopen context
- crash recovery details

Boundary language:
- recovery diagnostics should remain exception-path vocabulary
- recovery diagnostics should not become routine maintenance language
- recovery diagnostics should not be visually or semantically equal to restore/reopen authority in later design work

## Internal-Only Vocabulary

Internal-only until translated by later governance:
- `service_port_unavailable`
- `test-offline`
- `test:service-status`
- `testFreezeUntilRetry`
- `testModeFreezeServiceHealth`
- `test-frozen`
- `__testInsights`
- `window.testMode`
- `DiagnosticsBridge`
- `openDiagnosticsFolder`
- IPC channel names such as `diagnostics:open-history`

Pass 19 finding:
- these terms may remain in code, tests, specs, and developer docs
- they should not be treated as user-facing workflow categories or final support copy

## Terms Requiring Translation Before Exposure

- `service_port_unavailable` should translate to a support condition such as service connection unavailable or service port unavailable only if later governance approves that vocabulary.
- `test-offline` should not translate into ordinary product surfaces; it belongs to developer/test diagnostics.
- `test-frozen` and frozen-state flags should stay dev/test only.
- `DiagnosticsBridge` should translate to audience-specific diagnostics access only when a user-facing context requires it.
- `openDiagnosticsFolder` should translate by context:
  - product support: inspect support evidence
  - recovery: inspect recovery diagnostics
  - developer/test: open diagnostics folder

Pass 19 conclusion:
- translation should preserve audience boundaries rather than simply rename internal terms

## Context-Dependent Diagnostics Access Findings

- Diagnostics folder access is context-dependent.
- In product-support context, access may be support evidence.
- In recovery context, access may be recovery investigation.
- In developer/test context, access may be diagnostics folder inspection.
- The same bridge method can support multiple contexts, but the visible vocabulary and authority must not collapse those contexts.

Pass 19 finding:
- context-dependent access is acceptable only as a governance classification, not as authorization for broader diagnostics exposure

## Shared Bridge Vocabulary Risks

- A shared bridge method can cause one audience vocabulary to dominate all contexts.
- `window.diagnostics` and `DiagnosticsBridge.openDiagnosticsFolder` can read as:
  - product-support diagnostics
  - developer inspection
  - recovery investigation
  - validation scaffolding
- The risk is not method count. The risk is one bridge family lending shared legitimacy to separate audiences.

Risk chain:

1. shared bridge vocabulary appears
2. recovery/support UI exposes a diagnostics action
3. developer/test diagnostics uses the same bridge family
4. the bridge inherits product legitimacy and developer precision at the same time

## Leakage-Sensitive Terms

- diagnostics
- View diagnostics
- open diagnostics folder
- diagnostic evidence
- support details
- recovery diagnostics
- recovery evidence
- test-offline
- Backend services offline (test)
- forced offline
- frozen
- test-frozen
- service_port_unavailable
- test:service-status
- readiness
- retry
- online
- offline

Pass 19 finding:
- these terms are not all forbidden
- they require audience classification before being treated as support, recovery, or developer/test vocabulary

## Provisional Vocabulary Boundaries

- Product-support diagnostics vocabulary may describe support evidence for real user-visible conditions.
- Developer/test diagnostics vocabulary may describe internal causes, harnesses, bridge details, and validation scaffolding.
- Recovery diagnostics vocabulary may describe exceptional recovery evidence and investigation only while recovery context is active.
- Internal-only vocabulary may remain in code/tests/docs but must not become ordinary workflow language.
- Translated support condition language must describe operator-relevant condition without exposing internal reason identity.
- Context-dependent diagnostics access must be classified by active audience before it receives visible authority.
- Leakage-sensitive terms require explicit audience labeling before future use.

## Maintenance-Only Safe Areas

- maintaining existing diagnostics bridge behavior without expanding methods or entry points
- developer/test vocabulary in tests, harnesses, fixture docs, and diagnostic specs
- product-support diagnostics tied to real support conditions
- recovery diagnostics tied to exceptional recovery context
- internal-only terms kept internal
- documentation that clarifies vocabulary families without rewriting product copy globally
- context-dependent diagnostics access treated as unresolved governance, not product expansion

## Areas That Should Pause

- treating provisional vocabulary as final product copy
- expanding diagnostics UI or bridge authority based on this vocabulary split
- using `test-offline` or frozen terms in ordinary rendered product surfaces
- treating `openDiagnosticsFolder` as one audience-neutral product concept
- collapsing recovery diagnostics into ordinary support diagnostics
- making diagnostics wording routine workflow language
- translating `service_port_unavailable` into user-facing vocabulary before governance stabilizes

## Underlying Contracts That Survive Better Than Current Vocabulary

- product-support diagnostics support real operator-visible conditions
- developer/test diagnostics support engineering and validation
- recovery diagnostics support exceptional recovery investigation
- internal-only vocabulary classifies implementation state
- translated support condition language must hide internal cause identity unless explicitly approved
- context-dependent diagnostics access depends on active audience
- shared bridge mechanics do not require shared audience meaning

Current Pass 19 conclusion:
The contracts survive. The vocabulary risk is that a single diagnostics lexicon makes product support, recovery investigation, developer/test diagnostics, internal causes, and workflow legitimacy feel like one product meaning.

## Contradictions Found

- `openDiagnosticsFolder` may remain a shared bridge method, yet shared visible vocabulary can collapse audience boundaries.
- Diagnostics folder access is context-dependent, yet the current bridge exposes one diagnostics family.
- Recovery diagnostics is separate and exceptional, yet current visible wording can read as ordinary diagnostics access.
- Developer/test diagnostics needs precise internal vocabulary, yet those terms become leakage when product-facing.
- Product-support diagnostics needs useful evidence language, yet too much detail can become developer investigation.

## Areas Too Ambiguous To Stabilize Yet

- final product-support diagnostics terms
- final recovery diagnostics terms
- whether `View diagnostics` can remain with stricter transition framing
- whether `openDiagnosticsFolder` should remain the canonical bridge name if audience vocabularies split
- how much support evidence should be exposed to operators before it becomes developer diagnostics
- whether canonical vocabulary should live in a later governance artifact, product copy spec, or diagnostics authority matrix

## Questions For Orchestrator

- Should Reconstruction Pass 20 focus on recovery diagnostics transition rules or workflow-state reconstruction preparation?
- Should a later artifact define formal allowed/forbidden vocabulary lists for each diagnostics audience?
- Should `openDiagnosticsFolder` remain acceptable as an internal/shared bridge method name if visible labels split by audience?
- Should `View diagnostics` be treated as provisional recovery diagnostics vocabulary or leakage-sensitive wording pending containment?
- Should product-support diagnostics expose support evidence directly, or route through a stricter recovery/support transition?

## Recommended Reconstruction Pass 20

Run a twentieth reconstruction pass focused on recovery diagnostics transition rules.

Pass 20 should:

- preserve recovery diagnostics as a separate exceptional family
- classify transition boundaries between recovery state, support investigation, diagnostics access, and ordinary workflow
- keep product-support diagnostics, developer/test diagnostics, and recovery diagnostics vocabulary separated
- keep provisional vocabulary from becoming product copy
- prepare for later workflow-state reconstruction without rewriting the roadmap

Pass 20 should not rewrite the roadmap, redesign the GUI, rewrite product copy globally, authorize diagnostics expansion, authorize topology architecture, authorize Story Unit persistence, renumber phases, or activate Phase 32.
