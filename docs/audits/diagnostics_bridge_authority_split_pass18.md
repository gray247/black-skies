# Diagnostics Bridge Authority Split Reconstruction - Pass 18

## Purpose

This document reconstructs how the diagnostics bridge currently blends product-support diagnostics, developer/test diagnostics, runtime truth, validation scaffolding, recovery investigation, and support investigation.

It is a reconstruction-planning artifact only. These findings are not implementation authorization, not product copy rewrite approval, not GUI redesign approval, not diagnostics expansion approval, not topology authorization, not Story Unit persistence approval, and not Phase 32 activation.

This pass distinguishes product-support diagnostics from developer/test diagnostics, recovery diagnostics from ordinary support diagnostics, support investigation from developer investigation, and validation scaffolding from product workflow legitimacy.

Assumption handling:
- The current GUI remains transitional evidence, not final product architecture.
- The current bridge implementation is treated as evidence of mixed authority, not as approval to expand or redesign diagnostics.
- Where source evidence is in tension, this pass reports the tension rather than resolving it into implementation direction.

## Source Documents / Code Reviewed

- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase_r2_governance_snapshot.md`
- `docs/audits/phase_r2_roadmap_survivability_ledger.md`
- `docs/audits/support_truth_diagnostics_leakage_boundaries_pass14.md`
- `docs/audits/operator_support_vs_developer_diagnostics_pass15.md`
- `docs/audits/internal_semantics_vs_user_workflow_vocabulary_pass16.md`
- `docs/audits/product_support_vs_dev_test_diagnostics_vocabulary_pass17.md`
- `docs/audits/phase29/support_vs_dev_boundary_review.md`
- `docs/audits/phase29/dev_surface_initial_findings.md`
- `app/shared/ipc/diagnostics.ts`
- `app/main/preload.ts`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/App.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/testMode/testModeManager.ts`

## Diagnostics Bridge Classification Model

These are reconstruction-planning classifications only. They are not implementation authorization.

- `Product-Support Diagnostics`: bounded operator-facing diagnostics used to support a real user-visible condition.
- `Developer/Test Diagnostics`: diagnostics used by engineering, test harnesses, diagnostic specs, logging, bridge readiness checks, or validation tooling.
- `Recovery Diagnostics`: diagnostics that appear in exception-path recovery contexts and inherit recovery vocabulary sensitivity.
- `Support Investigation`: operator-support inspection of current condition or support evidence without ordinary workflow authority.
- `Developer Investigation`: engineering-oriented debugging, reproduction, tracing, logging, or harness inspection.
- `Runtime Truth Crossover`: drift where service state, recovery state, or diagnostics state are read as one shared truth family.
- `Validation Scaffolding`: test bridges, injected service states, diagnostic specs, and harness modes used to prove behavior rather than define product workflow.
- `Workflow Legitimacy Transfer`: the process by which a diagnostics bridge borrows legitimacy from support, recovery, or runtime placement.
- `Audience-Boundary Leakage`: drift where one exposed bridge family serves operator, support, developer, test, and recovery audiences without clear semantic separation.

## Executive Findings

- The diagnostics bridge is small in implementation but large in authority pressure because one exposed `diagnostics` family touches recovery UI, support evidence, developer/test diagnostics, IPC vocabulary, and validation specs.
- The current bridge semantics blend audiences more than they blend code paths. That audience mixing is the governance risk.
- Product-support diagnostics, recovery diagnostics, and developer/test diagnostics need separate semantic treatment before any diagnostics placement can be stabilized.
- Runtime truth crossover increases the risk: service health, recovery state, and diagnostics access can appear to be one operational truth lane even though they answer different questions.
- The safest surviving contract is bounded investigation. The risky current contract is a single diagnostics bridge that can transfer legitimacy across support, recovery, validation, and developer investigation.

## Diagnostics Bridge Findings

- `app/shared/ipc/diagnostics.ts` defines a narrow `DiagnosticsBridge` with `openDiagnosticsFolder`.
- `app/main/preload.ts` exposes that bridge to the renderer as `window.diagnostics`.
- The bridge returns structured success/failure payloads and an error when the payload is unexpected.
- The implementation does not itself redesign workflow or expand diagnostics.
- The authority issue comes from semantic reach:
  - visible recovery diagnostics access
  - developer/test diagnostic specs
  - preload IPC exposure
  - support investigation expectations
  - runtime and recovery adjacency

Pass 18 finding:
- narrow bridge implementation does not imply narrow semantic authority
- the bridge currently acts as a shared audience seam

## Product-Support Diagnostics Findings

- Product-support diagnostics are legitimate only when tied to a real support or recovery condition.
- Product-support diagnostics should help an operator or support process inspect evidence without turning diagnostics into ordinary workflow tooling.
- The bridge can support product-support needs, but only if its vocabulary and placement remain contextual.
- Product-support diagnostics should not inherit developer/test terminology such as harness events, test modes, forced offline terms, or bridge readiness checks.

Pass 18 conclusion:
- product-support diagnostics should be bounded support evidence, not a general product utility

## Developer/Test Diagnostics Findings

- Developer/test diagnostics include:
  - diagnostic e2e specs
  - bridge readiness and preload exposure
  - logging channels
  - test-mode APIs
  - forced service states
  - service-health test events
- These uses are valid engineering and validation tools.
- They should not set the language or authority for product-support diagnostics.
- Developer/test diagnostics can expose precise internal cause because their audience is engineering, not ordinary workflow.

Pass 18 finding:
- developer/test diagnostics survive as validation and investigation infrastructure
- they should not borrow product-support legitimacy through the shared bridge name

## Recovery Diagnostics Findings

- Recovery diagnostics are now treated as their own exceptional diagnostics family.
- `RecoveryBanner` exposes `View diagnostics` beside `Restore snapshot` and `Reopen last project`.
- Recovery diagnostics can be legitimate because recovery is exceptional and evidence may be needed.
- The risk is that diagnostics becomes a peer action to restore/reopen, giving investigation the same felt workflow legitimacy as recovery mutation or recovery navigation.

Pass 18 conclusion:
- recovery diagnostics need stronger semantic separation than ordinary product-support diagnostics because recovery already carries exceptional authority

## Runtime Truth Crossover Findings

- Runtime truth appears through service status, offline/online state, retry, port-unavailable handling, and recovery state.
- Diagnostics bridge access can appear adjacent to the same operational state family.
- This creates crossover:
  - service state reports condition
  - recovery state reports exception
  - diagnostics opens investigation
  - users can read all three as one readiness or support authority lane
- Always-visible service status is already classified as workflow-readiness pressure, not neutral ambient truth.

Pass 18 finding:
- runtime truth crossover makes diagnostics feel more operationally authoritative than the bridge itself proves

## Validation Scaffolding Findings

- Validation scaffolding includes `__testInsights`, `window.testMode`, `test:service-status`, `test-offline`, frozen state flags, diagnostic e2e specs, and harness readiness checks.
- These scaffolds can alter visible service truth during tests or verify diagnostics behavior.
- They are not product workflow legitimacy.
- When validation scaffolding shares diagnostics vocabulary with product support, it becomes harder to tell which audience the bridge serves.

Pass 18 conclusion:
- validation scaffolding should remain proof infrastructure, not product diagnostics authority

## Audience-Boundary Leakage Findings

- The bridge currently has at least four audiences:
  - operator support
  - recovery support
  - developer investigation
  - automated validation
- The same `diagnostics` label can serve all four unless governance splits the audience.
- Audience-boundary leakage occurs when a term or entry point designed for one audience becomes meaningful to another:
  - developer diagnostics read as operator support
  - recovery diagnostics read as ordinary workflow
  - validation diagnostics read as product readiness
  - runtime status read as diagnostics authority

Pass 18 finding:
- audience boundaries are governance boundaries
- one exposed diagnostics family is currently doing too much semantic work

## Workflow Legitimacy Transfer Findings

- Workflow legitimacy transfer occurs when diagnostics inherits trust from adjacent surfaces.
- Current transfer paths include:
  - recovery adjacency beside restore/reopen
  - support adjacency beside offline/retry status
  - runtime adjacency beside service truth
  - validation adjacency through diagnostic specs and harness behavior
- This does not require false copy or broad implementation.
- The bridge can remain technically narrow while still transferring workflow meaning across audiences.

Pass 18 conclusion:
- diagnostics bridge legitimacy is shaped by placement, audience, and vocabulary more than by method count

## Highest Bridge-Authority Risk Areas

- `View diagnostics` in `RecoveryBanner` beside restore and reopen actions.
- `window.diagnostics` as one exposed renderer bridge serving both support and developer/test semantics.
- `DiagnosticsBridge.openDiagnosticsFolder` because folder access can be read as product support, developer investigation, or recovery investigation depending on context.
- Diagnostic e2e specs and bridge readiness evidence sharing the same diagnostics vocabulary as product support.
- Runtime status and recovery state adjacency that makes diagnostics feel operationally authoritative.
- Service-health test/frozen/offline scaffolding that can alter visible runtime truth while sharing support/diagnostics vocabulary.
- Always-visible service status creating workflow-readiness pressure near diagnostics/support meanings.

## Maintenance-Only Safe Areas

- keeping the diagnostics bridge narrow and bounded to existing behavior
- structured success/failure return handling without expanded authority
- developer/test diagnostics kept in diagnostic specs, logs, harnesses, and dev-only paths
- product-support diagnostics limited to real support or recovery conditions
- recovery diagnostics treated as exceptional investigation
- internal reason keys such as `service_port_unavailable` kept internal only unless later translated by governance
- documentation that clarifies audience boundaries without implementing diagnostics changes

## Areas That Should Pause

- expanding diagnostics bridge methods or visible entry points
- treating the bridge as one unified product diagnostics family
- normalizing recovery diagnostics as ordinary workflow tooling
- using validation scaffolding to justify product diagnostics authority
- letting runtime status imply diagnostics readiness or workflow approval
- exposing developer/test diagnostics language through product-support surfaces
- global product copy rewrites before diagnostics audience boundaries are stable

## Underlying Contracts That Survive Better Than Current Bridge Semantics

- product-support diagnostics support real operator-facing conditions
- developer/test diagnostics support engineering investigation and validation
- recovery diagnostics support exceptional recovery investigation
- support investigation is contextual and bounded
- developer investigation can be internal and precise
- runtime truth reports condition, not diagnostics authority
- validation scaffolding proves behavior, not product workflow legitimacy
- one bridge implementation does not have to mean one semantic audience

Current Pass 18 conclusion:
The contracts survive. The current bridge semantics are risky because one diagnostics family currently carries multiple audiences and can transfer legitimacy across support, recovery, runtime, validation, and developer investigation.

## Contradictions Found

- The diagnostics bridge is implementation-narrow, yet semantically broad because it is exposed as a shared diagnostics family.
- Recovery diagnostics may be legitimate in exceptional conditions, yet `View diagnostics` appears as a peer action beside restore/reopen.
- Developer/test diagnostics need precise internal vocabulary, yet the shared bridge name can make that precision feel product-facing.
- Runtime truth and diagnostics are distinct, yet service and recovery adjacency can make diagnostics feel like operational readiness evidence.
- Validation scaffolding is necessary proof infrastructure, yet it shares terms and pathways with product-support diagnostics.

## Areas Too Ambiguous To Stabilize Yet

- whether `View diagnostics` should remain acceptable recovery-support vocabulary or require later containment
- where exactly to split product-support diagnostics and developer/test diagnostics in code, docs, and UI-facing language
- whether recovery diagnostics should be governed as a subfamily of product-support diagnostics or as a separate exceptional family
- what operator-facing support investigation should expose without becoming developer investigation
- whether a single renderer bridge can remain acceptable if canonical vocabularies split by audience
- how much diagnostics folder access is product support versus developer inspection

## Questions For Orchestrator

- Should Reconstruction Pass 19 focus on recovery diagnostics transition rules or canonical diagnostics audience vocabularies?
- Should recovery diagnostics be governed as a separate exceptional diagnostics family from product-support diagnostics?
- Should a future governance artifact define separate canonical vocabulary for product-support diagnostics, developer/test diagnostics, and recovery diagnostics?
- Is `openDiagnosticsFolder` acceptable as a shared bridge method if the exposed vocabulary is later split?
- Should diagnostics folder access be classified as product-support evidence, developer investigation, or context-dependent?

## Recommended Reconstruction Pass 19

Run a nineteenth reconstruction pass focused on recovery diagnostics transition rules.

Pass 19 should:

- treat recovery diagnostics as an exceptional diagnostics family
- classify how diagnostics language may transition from recovery state to investigation state
- preserve the split between product-support diagnostics and developer/test diagnostics
- keep validation scaffolding from becoming product workflow legitimacy
- avoid implementation, GUI redesign, diagnostics expansion, or product copy rewrite

Pass 19 should not rewrite the roadmap, redesign the GUI, rewrite product copy globally, authorize diagnostics expansion, authorize topology architecture, authorize Story Unit persistence, renumber phases, or activate Phase 32.
