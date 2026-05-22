# Phase 29 Pass 3 Fake Intelligence Risk Register

Status: Draft risk register
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 3 - Intelligence Audit

## Purpose

This register identifies surfaces that may overstate capability, imply unsupported intelligence, or create AI-theater risk.
It does not assign final hide/keep decisions.

## Risk Rows

### P29-INTEL-001

- related_ids: `P29-INTEL-001`; `P29-SURF-006`; `P29-WFLOW-007`
- why_it_risks_fake_smart_behavior: charts and summary metrics can read as narrative intelligence or project-health authority even when current capability is partial and service-gated
- runtime_capability_supports_visible_authority: only partially
- uncertainty_honesty: partial; offline and bridge errors are explicit, but the surface title still carries high-authority framing
- workflow_risk: competes with the Writing Surface and may distract from direct authoring with low-context analytics
- user_trust_risk: high
- evidence: `app/renderer/components/AnalyticsDashboard.tsx:105`; `app/renderer/components/AnalyticsDashboard.tsx:211`; `app/renderer/components/AnalyticsDashboard.tsx:296`; `docs/gui/gui_layouts.md:41`
- preliminary_mitigation_direction: validate_first and reduce authority claims until Pass 3 classification is accepted

### P29-INTEL-002

- related_ids: `P29-INTEL-002`; `P29-INTEL-003`; `P29-SURF-012`; `P29-WFLOW-008`
- why_it_risks_fake_smart_behavior: “Companion” branding and model-insight language can suggest stronger adaptive intelligence than the runtime currently proves
- runtime_capability_supports_visible_authority: partially for local analytics, weakly for broader model insight authority
- uncertainty_honesty: better than other surfaces; local/offline labels and route/origin text are explicit
- workflow_risk: can pull attention into advisory suggestions while users are trying to write
- user_trust_risk: high
- evidence: `app/renderer/components/CompanionOverlay.tsx:603`; `app/renderer/components/CompanionOverlay.tsx:746`; `app/renderer/components/CompanionOverlay.tsx:784`; `app/renderer/components/CompanionOverlay.tsx:916`; `app/renderer/components/CompanionOverlay.tsx:937`
- preliminary_mitigation_direction: keep contextual and require validation-first before any authority upgrade

### P29-INTEL-004

- related_ids: `P29-INTEL-004`; `P29-SURF-008`; `P29-WFLOW-009`
- why_it_risks_fake_smart_behavior: graph visualization carries strong pattern-discovery authority even when bridge coverage and usefulness are only partial
- runtime_capability_supports_visible_authority: weakly
- uncertainty_honesty: partial; offline and bridge errors are shown, but there is no explicit caveat about interpretation limits
- workflow_risk: may add conceptual clutter without helping immediate writing decisions
- user_trust_risk: high
- evidence: `app/renderer/components/RelationshipGraph.tsx:39`; `app/renderer/components/RelationshipGraph.tsx:52`; `app/renderer/components/RelationshipGraph.tsx:103`; `app/shared/ipc/layout.ts:63`
- preliminary_mitigation_direction: hide pending validation or keep advanced-only until usefulness is proven

### P29-INTEL-006

- related_ids: `P29-INTEL-006`; `P29-SURF-010`; `P29-WFLOW-004`
- why_it_risks_fake_smart_behavior: rewrite/apply crosses from analysis into mutation and can imply trustworthy improvement even without qualitative validation
- runtime_capability_supports_visible_authority: functionally yes, qualitatively unproven
- uncertainty_honesty: partial; critique provenance is shown, but rewrite quality confidence is not
- workflow_risk: users may over-trust saved rewrite actions because they are attached to critique flow
- user_trust_risk: severe
- evidence: `app/renderer/components/CritiqueModal.tsx:204`; `app/renderer/components/CritiqueModal.tsx:220`; `app/renderer/components/CritiqueModal.tsx:252`
- preliminary_mitigation_direction: validate_first and treat as high-risk mutation authority

### P29-INTEL-007

- related_ids: `P29-INTEL-007`; `P29-SURF-015`; `P29-WFLOW-012`
- why_it_risks_fake_smart_behavior: Split Command shell and Command Center naming can imply fully active orchestration and intelligence systems
- runtime_capability_supports_visible_authority: only for deterministic loaded-data surfaces
- uncertainty_honesty: strong; the shell explicitly says no AI certainty or story-quality judgment is active
- workflow_risk: experimental shell can distort expectations if mistaken for the stable product workflow
- user_trust_risk: medium
- evidence: `app/renderer/components/workspace/SplitCommandWorkspace.tsx:376`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:418`; `docs/specs/design_system_v1.md:1818`
- preliminary_mitigation_direction: keep advanced/settings only and preserve experimental framing

### P29-INTEL-008

- related_ids: `P29-INTEL-008`; `P29-CTRL-017`; `P29-WFLOW-013`
- why_it_risks_fake_smart_behavior: command registry metadata can imply user-visible routing/orchestration maturity that is not yet proven in UX
- runtime_capability_supports_visible_authority: not as visible authority, only as internal metadata
- uncertainty_honesty: hidden from users in current evidence, so risk is mostly doc/spec overhang
- workflow_risk: later docs or demos could overstate command-center maturity if this metadata is treated as product truth
- user_trust_risk: medium
- evidence: `app/renderer/commands/commandRegistry.ts:10`; `app/renderer/commands/commandRegistry.ts:32`; `app/renderer/commands/commandRegistry.ts:73`
- preliminary_mitigation_direction: background automation candidate pending later routing-visibility review
