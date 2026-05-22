# Phase 29 Pass 3 Intelligence Surface Matrix

Status: Draft intelligence audit
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 3 - Intelligence Audit

## Purpose

This matrix classifies intelligence-related surfaces by runtime truth, workflow authority, qualitative trustworthiness, visibility pressure, and fake-smart risk.
It does not make final GUI placement decisions.

## Matrix Rows

### P29-INTEL-001

- classification_id: `P29-INTEL-001`
- related_surface_ids: `P29-SURF-006`
- related_control_ids: `P29-CTRL-019`
- related_workflow_ids: `P29-WFLOW-007`
- intelligence_surface_name: Story Insights / Analytics Dashboard
- category: analytics
- runtime_truth_status: partial
- user_visible_authority_level: secondary
- workflow_role: presents scene metrics, emotion trend, pacing strip, and summary metrics
- actual_runtime_capability: fetches analytics summary and scene metrics when service bridges are available; otherwise shows offline or bridge-unavailable errors
- implied_capability: can read as authoritative narrative analysis or project-health intelligence
- qualitative_risk: high
- fake_smart_risk: high
- orchestration_overlap: overlaps Companion Overlay local analytics and docs-declared future Story Insights / Project Health concepts
- visibility_pressure: high
- preliminary_visibility_recommendation: validate_first
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-006`; `app/renderer/components/AnalyticsDashboard.tsx:93`; `app/renderer/components/AnalyticsDashboard.tsx:105`; `app/renderer/components/AnalyticsDashboard.tsx:211`; `app/renderer/components/AnalyticsDashboard.tsx:296`; `docs/gui/gui_layouts.md:33`; `docs/gui/gui_layouts.md:41`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- review_status: pending
- notes: Runtime analytics exist, but current docs overhang into placeholder and future-only expectations.

### P29-INTEL-002

- classification_id: `P29-INTEL-002`
- related_surface_ids: `P29-SURF-012`
- related_control_ids: `P29-CTRL-007`; `P29-CTRL-019`
- related_workflow_ids: `P29-WFLOW-008`
- intelligence_surface_name: Companion Overlay local analytics and advisory insights
- category: workflow_assist
- runtime_truth_status: partial
- user_visible_authority_level: secondary
- workflow_role: gives local pacing, emotion-tag, and scene guidance plus queued/resumed model status text
- actual_runtime_capability: computes local analytics from scene/draft data, queues model insight counters, and labels results as local advisory
- implied_capability: can read as active AI companion with broader story intelligence than current runtime evidence supports
- qualitative_risk: high
- fake_smart_risk: high
- orchestration_overlap: overlaps Story Insights metrics, critique/rewrite guidance, and docs-declared companion mode claims
- visibility_pressure: high
- preliminary_visibility_recommendation: contextual only
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-012`; `app/renderer/components/CompanionOverlay.tsx:286`; `app/renderer/components/CompanionOverlay.tsx:594`; `app/renderer/components/CompanionOverlay.tsx:603`; `app/renderer/components/CompanionOverlay.tsx:785`; `app/renderer/components/CompanionOverlay.tsx:916`; `app/renderer/components/CompanionOverlay.tsx:937`
- evidence_quality: direct_runtime_file
- confidence: high
- review_status: pending
- notes: The overlay is comparatively honest about local/offline state, but its surface area still exceeds proven usefulness.

### P29-INTEL-003

- classification_id: `P29-INTEL-003`
- related_surface_ids: `P29-SURF-012`
- related_control_ids: `P29-CTRL-007`
- related_workflow_ids: `P29-WFLOW-008`
- intelligence_surface_name: Companion Overlay model-insight queue and resume signals
- category: model_status
- runtime_truth_status: partial
- user_visible_authority_level: contextual
- workflow_role: indicates that local insights ran, model insights were queued, and queued runs resumed after reconnect
- actual_runtime_capability: tracks counters and reconnect events; does not show a real model result stream or confidence score
- implied_capability: can imply stronger online model analysis than the runtime currently exposes
- qualitative_risk: medium
- fake_smart_risk: high
- orchestration_overlap: overlaps service-health state and any future routing visibility or model execution UI
- visibility_pressure: medium
- preliminary_visibility_recommendation: contextual only
- evidence: `app/renderer/components/CompanionOverlay.tsx:390`; `app/renderer/components/CompanionOverlay.tsx:595`; `app/renderer/components/CompanionOverlay.tsx:719`; `app/renderer/components/CompanionOverlay.tsx:784`; `app/renderer/components/CompanionOverlay.tsx:796`
- evidence_quality: direct_runtime_file
- confidence: high
- review_status: pending
- notes: Status counters are clearer than qualitative results, but they still need explicit routing-visibility review.

### P29-INTEL-004

- classification_id: `P29-INTEL-004`
- related_surface_ids: `P29-SURF-008`
- related_control_ids: `P29-CTRL-019`
- related_workflow_ids: `P29-WFLOW-009`
- intelligence_surface_name: Relationship Graph
- category: relationship_analysis
- runtime_truth_status: partial
- user_visible_authority_level: hidden
- workflow_role: visualizes relationship nodes and edges when analytics relationships are available
- actual_runtime_capability: fetches relationship data through analytics bridge when services are online; otherwise shows bridge/offline errors
- implied_capability: can imply strong character/network intelligence despite hidden-default status and limited runtime proof
- qualitative_risk: high
- fake_smart_risk: high
- orchestration_overlap: overlaps Story Insights, future visualization systems, and docs-declared Project Health / Visuals ambitions
- visibility_pressure: medium
- preliminary_visibility_recommendation: hide pending validation
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-008`; `app/renderer/components/RelationshipGraph.tsx:39`; `app/renderer/components/RelationshipGraph.tsx:52`; `app/renderer/components/RelationshipGraph.tsx:103`; `app/shared/ipc/layout.ts:63`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- review_status: pending
- notes: Hidden default reduces pressure, but also makes stale or weak authority harder to notice.

### P29-INTEL-005

- classification_id: `P29-INTEL-005`
- related_surface_ids: `P29-SURF-010`
- related_control_ids: `P29-CTRL-005`
- related_workflow_ids: `P29-WFLOW-004`
- intelligence_surface_name: Critique review surface
- category: critique
- runtime_truth_status: runtime_backed
- user_visible_authority_level: contextual
- workflow_role: presents critique response, provenance, and budget status line inside modal review
- actual_runtime_capability: shows critique output and provenance metadata after a critique request completes
- implied_capability: can read as authoritative story-quality judgment if presented without clear limits
- qualitative_risk: medium
- fake_smart_risk: medium
- orchestration_overlap: overlaps Companion Overlay advisory guidance and rewrite/apply workflow
- visibility_pressure: medium
- preliminary_visibility_recommendation: contextual only
- evidence: `app/renderer/components/CritiqueModal.tsx:115`; `app/renderer/components/CritiqueModal.tsx:165`; `app/renderer/components/CritiqueModal.tsx:186`; `app/renderer/components/CritiqueModal.tsx:187`; `docs/specs/editorial_workflow_contract.md:36`
- evidence_quality: direct_runtime_file
- confidence: high
- review_status: pending
- notes: Better grounded than Story Insights surfaces because it exposes provenance and is scoped to an explicit user action.

### P29-INTEL-006

- classification_id: `P29-INTEL-006`
- related_surface_ids: `P29-SURF-010`
- related_control_ids: `P29-CTRL-005`
- related_workflow_ids: `P29-WFLOW-004`
- intelligence_surface_name: Rewrite/apply controls
- category: rewrite
- runtime_truth_status: runtime_backed
- user_visible_authority_level: contextual
- workflow_role: generates saved rewrite preview and applies rewrite after critique review
- actual_runtime_capability: creates and applies rewrite candidates inside a critique-scoped modal
- implied_capability: can imply a trustworthy improvement engine even when qualitative usefulness is unproven
- qualitative_risk: high
- fake_smart_risk: high
- orchestration_overlap: overlaps critique authority, companion advisory tone, and any future command-center automation
- visibility_pressure: medium
- preliminary_visibility_recommendation: validate_first
- evidence: `app/renderer/components/CritiqueModal.tsx:204`; `app/renderer/components/CritiqueModal.tsx:220`; `app/renderer/components/CritiqueModal.tsx:252`; `docs/audits/phase29/workflow_conflict_register.md:P29-WFLOW-004`
- evidence_quality: direct_runtime_file
- confidence: high
- review_status: pending
- notes: This is a major trust surface because it crosses from analysis into mutation.

### P29-INTEL-007

- classification_id: `P29-INTEL-007`
- related_surface_ids: `P29-SURF-015`
- related_control_ids: `P29-CTRL-020`
- related_workflow_ids: `P29-WFLOW-012`
- intelligence_surface_name: Split Command intelligence readiness and command-center shell
- category: orchestration
- runtime_truth_status: partial
- user_visible_authority_level: advanced
- workflow_role: presents Command Center shell, narrative overview, intelligence readiness copy, and deterministic command surfaces
- actual_runtime_capability: exposes deterministic loaded-data panels and explicitly states no AI certainty or story-quality judgment is active
- implied_capability: spec and shell naming can still imply a broader orchestration/intelligence authority than current runtime proves
- qualitative_risk: medium
- fake_smart_risk: medium
- orchestration_overlap: directly overlaps future Command Center, Story Unit, and split-workspace ambitions
- visibility_pressure: medium
- preliminary_visibility_recommendation: advanced/settings only
- evidence: `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-015`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:353`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:376`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:418`; `docs/specs/design_system_v1.md:125`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- review_status: pending
- notes: Lower fake-smart risk than other surfaces because it carries explicit disclaimers, but it remains experimental.

### P29-INTEL-008

- classification_id: `P29-INTEL-008`
- related_surface_ids: `P29-SURF-002`
- related_control_ids: `P29-CTRL-017`
- related_workflow_ids: `P29-WFLOW-013`
- intelligence_surface_name: Command registry model-route and risk metadata
- category: routing_visibility
- runtime_truth_status: partial
- user_visible_authority_level: hidden
- workflow_role: records command categories, preferred zones, model route, mutation flags, and risk levels
- actual_runtime_capability: metadata exists in the registry, but direct user-facing routing visibility was not confirmed
- implied_capability: can imply that command routing, zone policy, and model strategy are visible or enforced in product UX
- qualitative_risk: medium
- fake_smart_risk: medium
- orchestration_overlap: overlaps Split Command command-center claims and any future command palette or routing UI
- visibility_pressure: low
- preliminary_visibility_recommendation: background automation candidate
- evidence: `app/renderer/commands/commandRegistry.ts:10`; `app/renderer/commands/commandRegistry.ts:32`; `app/renderer/commands/commandRegistry.ts:73`; `app/renderer/commands/commandRegistry.ts:99`; `docs/audits/phase29/tool_button_control_inventory.md:P29-CTRL-017`
- evidence_quality: direct_runtime_file
- confidence: high
- review_status: pending
- notes: Useful metadata, but current runtime proof is about declaration, not visible authority.

### P29-INTEL-009

- classification_id: `P29-INTEL-009`
- related_surface_ids: `P29-SURF-002`; `P29-SURF-014`
- related_control_ids: `P29-CTRL-019`
- related_workflow_ids: `P29-WFLOW-011`
- intelligence_surface_name: Service status and retry visibility
- category: diagnostics
- runtime_truth_status: runtime_backed
- user_visible_authority_level: contextual
- workflow_role: shows whether services are offline, checking, or unavailable and exposes retry
- actual_runtime_capability: reports connection/status state and lets users retry service health
- implied_capability: can be mistaken for broader system intelligence or readiness rather than connectivity status
- qualitative_risk: low
- fake_smart_risk: low
- orchestration_overlap: overlaps analytics and companion surfaces because they depend on the same online/offline state
- visibility_pressure: medium
- preliminary_visibility_recommendation: contextual only
- evidence: `app/renderer/components/WorkspaceHeader.tsx:78`; `app/renderer/components/WorkspaceHeader.tsx:115`; `app/renderer/components/ServiceHealthBanner.tsx:33`; `app/renderer/components/ServiceHealthBanner.tsx:106`; `app/renderer/components/ServiceHealthBanner.tsx:119`
- evidence_quality: direct_runtime_file
- confidence: high
- review_status: pending
- notes: This is not intelligence, but it does create visible system-authority signals and should stay honest and narrow.

### P29-INTEL-010

- classification_id: `P29-INTEL-010`
- related_surface_ids: `P29-SURF-002`
- related_control_ids: none
- related_workflow_ids: `P29-WFLOW-013`
- intelligence_surface_name: Budget indicator and budget meter
- category: model_status
- runtime_truth_status: runtime_backed
- user_visible_authority_level: contextual
- workflow_role: shows cost/budget state in the Workspace Header and critique budget status line
- actual_runtime_capability: displays budget indicators and budget metadata; no autonomous optimization or routing decision is shown
- implied_capability: can imply cost-aware intelligence authority if grouped beside companion, generation, and critique surfaces
- qualitative_risk: low
- fake_smart_risk: low
- orchestration_overlap: overlaps critique provenance budget status and any future routing-quality controls
- visibility_pressure: medium
- preliminary_visibility_recommendation: contextual only
- evidence: `app/renderer/components/WorkspaceHeader.tsx:111`; `app/renderer/components/WorkspaceHeader.tsx:114`; `app/renderer/components/CritiqueModal.tsx:115`; `app/renderer/components/CritiqueModal.tsx:187`
- evidence_quality: direct_runtime_file
- confidence: high
- review_status: pending
- notes: Better treated as transparent status than intelligence authority.
