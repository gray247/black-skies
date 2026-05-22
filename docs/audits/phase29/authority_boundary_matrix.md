# Phase 29 Pass 4 Authority Boundary Matrix

Status: Draft boundary and authority audit
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 4 - Boundary and Authority Separation Audit

## Purpose

This matrix classifies where current surfaces and workflows compete for visible authority.
It does not make final GUI layout or product-policy decisions.

## Matrix Rows

### P29-BOUND-001

- boundary_id: `P29-BOUND-001`
- related_ids: `P29-SURF-005`; `P29-WFLOW-002`
- surface_or_workflow: current Writing Surface authoring flow through Draft Preview and active-scene editing
- authority_type: authoring
- mutation_authority: direct
- user_trust_risk: medium
- workflow_visibility_pressure: high
- orchestration_pressure: medium
- diagnostic_or_support_overlap: low
- dev_leakage_risk: low
- intelligence_authority_risk: low
- current_visibility_level: primary
- likely_future_visibility_class: Writing Surface candidate
- evidence: `docs/audits/phase29/workflow_conflict_register.md:P29-WFLOW-002`; `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-005`; `app/renderer/App.tsx:2698`; `app/shared/ipc/layout.ts:38`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- notes: The authoring path is real but currently shares too much visible space with generation, critique, layout, and support controls.

### P29-BOUND-002

- boundary_id: `P29-BOUND-002`
- related_ids: `P29-SURF-002`; `P29-CTRL-003`; `P29-CTRL-005`; `P29-CTRL-006`; `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`; `P29-WFLOW-003`; `P29-WFLOW-004`; `P29-WFLOW-010`
- surface_or_workflow: Workspace Header mixed action surface
- authority_type: orchestration
- mutation_authority: high_risk
- user_trust_risk: high
- workflow_visibility_pressure: severe
- orchestration_pressure: high
- diagnostic_or_support_overlap: medium
- dev_leakage_risk: low
- intelligence_authority_risk: medium
- current_visibility_level: primary
- likely_future_visibility_class: validate_first
- evidence: `docs/audits/phase29/workspace_header_density_review.md`; `app/renderer/components/WorkspaceHeader.tsx:78`; `app/renderer/components/WorkspaceHeader.tsx:115`; `app/renderer/components/WorkspaceHeader.tsx:127`; `app/renderer/components/WorkspaceHeader.tsx:145`; `app/renderer/components/WorkspaceHeader.tsx:166`
- evidence_quality: direct_runtime_file
- confidence: high
- notes: The header is the clearest mixed-authority surface. It combines authoring-adjacent, persistence-adjacent, export, intelligence-adjacent, and service-status controls without a clear authority boundary.

### P29-BOUND-003

- boundary_id: `P29-BOUND-003`
- related_ids: `P29-SURF-006`; `P29-INTEL-001`; `P29-WFLOW-007`
- surface_or_workflow: Story Insights / Analytics Dashboard
- authority_type: intelligence
- mutation_authority: none
- user_trust_risk: high
- workflow_visibility_pressure: high
- orchestration_pressure: medium
- diagnostic_or_support_overlap: medium
- dev_leakage_risk: low
- intelligence_authority_risk: high
- current_visibility_level: secondary
- likely_future_visibility_class: Command Center candidate
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-001`; `app/renderer/components/AnalyticsDashboard.tsx:93`; `app/renderer/components/AnalyticsDashboard.tsx:105`; `app/renderer/components/AnalyticsDashboard.tsx:211`; `docs/gui/gui_layouts.md:33`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- notes: Runtime analytics exist, but the surface title and future-doc overhang give it more interpretive authority than is currently justified.

### P29-BOUND-004

- boundary_id: `P29-BOUND-004`
- related_ids: `P29-SURF-012`; `P29-CTRL-007`; `P29-INTEL-002`; `P29-INTEL-003`; `P29-WFLOW-008`
- surface_or_workflow: Companion Overlay advisory and model-status surface
- authority_type: intelligence
- mutation_authority: indirect
- user_trust_risk: high
- workflow_visibility_pressure: high
- orchestration_pressure: medium
- diagnostic_or_support_overlap: medium
- dev_leakage_risk: low
- intelligence_authority_risk: high
- current_visibility_level: secondary
- likely_future_visibility_class: contextual candidate
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-002`; `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-003`; `app/renderer/components/CompanionOverlay.tsx:594`; `app/renderer/components/CompanionOverlay.tsx:603`; `app/renderer/components/CompanionOverlay.tsx:784`; `app/renderer/components/CompanionOverlay.tsx:916`
- evidence_quality: direct_runtime_file
- confidence: high
- notes: The overlay is more honest than some other intelligence surfaces, but still competes with core authoring attention and can imply stronger AI companionship than the runtime proves.

### P29-BOUND-005

- boundary_id: `P29-BOUND-005`
- related_ids: `P29-SURF-010`; `P29-CTRL-005`; `P29-INTEL-005`; `P29-INTEL-006`; `P29-WFLOW-004`
- surface_or_workflow: Critique and rewrite/apply flow
- authority_type: intelligence
- mutation_authority: high_risk
- user_trust_risk: severe
- workflow_visibility_pressure: high
- orchestration_pressure: medium
- diagnostic_or_support_overlap: low
- dev_leakage_risk: low
- intelligence_authority_risk: high
- current_visibility_level: secondary
- likely_future_visibility_class: validate_first
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-005`; `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-006`; `app/renderer/components/CritiqueModal.tsx:204`; `app/renderer/components/CritiqueModal.tsx:252`; `docs/specs/editorial_workflow_contract.md:224`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- notes: This is the clearest case where interpretation and mutation are coupled. Visible authority must stay below qualitative proof.

### P29-BOUND-006

- boundary_id: `P29-BOUND-006`
- related_ids: `P29-SURF-008`; `P29-INTEL-004`; `P29-WFLOW-009`
- surface_or_workflow: Relationship Graph
- authority_type: intelligence
- mutation_authority: none
- user_trust_risk: high
- workflow_visibility_pressure: medium
- orchestration_pressure: medium
- diagnostic_or_support_overlap: medium
- dev_leakage_risk: low
- intelligence_authority_risk: high
- current_visibility_level: advanced
- likely_future_visibility_class: validate_first
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-004`; `app/renderer/components/RelationshipGraph.tsx:39`; `app/renderer/components/RelationshipGraph.tsx:52`; `app/renderer/components/RelationshipGraph.tsx:103`; `app/shared/ipc/layout.ts:63`
- evidence_quality: direct_runtime_file
- confidence: high
- notes: The graph carries pattern-authority pressure even when hidden by default because its name and form imply strong interpretive truth.

### P29-BOUND-007

- boundary_id: `P29-BOUND-007`
- related_ids: `P29-SURF-013`; `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`; `P29-CTRL-011`; `P29-WFLOW-010`
- surface_or_workflow: snapshots, verification, backup, and restore controls
- authority_type: persistence
- mutation_authority: high_risk
- user_trust_risk: high
- workflow_visibility_pressure: high
- orchestration_pressure: medium
- diagnostic_or_support_overlap: high
- dev_leakage_risk: low
- intelligence_authority_risk: low
- current_visibility_level: secondary
- likely_future_visibility_class: support/recovery candidate
- evidence: `docs/audits/phase29/persistence_and_recovery_surface_review.md`; `docs/audits/phase29/gui_surface_inventory.md:P29-SURF-013`; `app/tests/e2e/startup_authority_contract.spec.ts:505`; `app/renderer/__tests__/HistoryPane.test.tsx:49`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- notes: These controls are runtime-backed and necessary, but they sit too close to ordinary authoring and can be mistaken for everyday workflow rather than safety tooling.

### P29-BOUND-008

- boundary_id: `P29-BOUND-008`
- related_ids: `P29-SURF-014`; `P29-CTRL-018`; `P29-INTEL-010`; `P29-WFLOW-011`
- surface_or_workflow: service health, offline, and recovery status surfaces
- authority_type: support
- mutation_authority: indirect
- user_trust_risk: medium
- workflow_visibility_pressure: medium
- orchestration_pressure: low
- diagnostic_or_support_overlap: high
- dev_leakage_risk: medium
- intelligence_authority_risk: low
- current_visibility_level: contextual
- likely_future_visibility_class: support/recovery candidate
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-010`; `app/renderer/components/ServiceHealthBanner.tsx:33`; `app/renderer/components/ServiceHealthBanner.tsx:106`; `app/renderer/components/ServiceHealthBanner.tsx:119`; `app/renderer/components/RecoveryBanner.tsx:51`
- evidence_quality: direct_runtime_file
- confidence: high
- notes: Recovery and service health are legitimate support surfaces, but test-adjacent states and retry behavior make the support-versus-diagnostics boundary porous.

### P29-BOUND-009

- boundary_id: `P29-BOUND-009`
- related_ids: `P29-DEV-003`; `P29-DEV-004`; `P29-DEV-005`; `P29-DEV-007`; `P29-WFLOW-013`
- surface_or_workflow: test harness state injection and diagnostics seams
- authority_type: dev_test
- mutation_authority: indirect
- user_trust_risk: high
- workflow_visibility_pressure: low
- orchestration_pressure: low
- diagnostic_or_support_overlap: high
- dev_leakage_risk: severe
- intelligence_authority_risk: low
- current_visibility_level: hidden
- likely_future_visibility_class: dev_only
- evidence: `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-003`; `docs/audits/phase29/dev_surface_initial_findings.md:P29-DEV-005`; `app/tests/e2e/hotkeys-status.spec.ts:255`; `app/renderer/testMode/testUISandbox.ts`; `app/tests/e2e/utils/serviceStubs.ts:284`
- evidence_quality: test_reference
- confidence: high
- notes: These seams are necessary for validation but must not be mistaken for operator-facing diagnostics or product support controls.

### P29-BOUND-010

- boundary_id: `P29-BOUND-010`
- related_ids: `P29-SURF-015`; `P29-INTEL-007`; `P29-WFLOW-012`
- surface_or_workflow: Split Command experimental shell and intelligence-readiness framing
- authority_type: experimental
- mutation_authority: indirect
- user_trust_risk: high
- workflow_visibility_pressure: medium
- orchestration_pressure: high
- diagnostic_or_support_overlap: low
- dev_leakage_risk: medium
- intelligence_authority_risk: high
- current_visibility_level: advanced
- likely_future_visibility_class: validate_first
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-007`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:515`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:674`; `docs/specs/design_system_v1.md:53`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- notes: The runtime shell is explicit that it is experimental, but its terminology still exerts roadmap and workflow authority pressure.

### P29-BOUND-011

- boundary_id: `P29-BOUND-011`
- related_ids: `P29-CTRL-017`; `P29-INTEL-009`; `P29-WFLOW-013`
- surface_or_workflow: command registry routing and zone metadata
- authority_type: orchestration
- mutation_authority: indirect
- user_trust_risk: medium
- workflow_visibility_pressure: medium
- orchestration_pressure: high
- diagnostic_or_support_overlap: low
- dev_leakage_risk: medium
- intelligence_authority_risk: medium
- current_visibility_level: hidden
- likely_future_visibility_class: advanced/settings candidate
- evidence: `docs/audits/phase29/intelligence_surface_matrix.md:P29-INTEL-009`; `app/renderer/commands/commandRegistry.ts:11`; `app/renderer/commands/commandRegistry.ts:27`; `app/renderer/commands/commandRegistry.ts:79`
- evidence_quality: direct_runtime_file
- confidence: high
- notes: The metadata is real and useful for internal routing, but visible exposure would overstate orchestration maturity.

### P29-BOUND-012

- boundary_id: `P29-BOUND-012`
- related_ids: `P29-SURF-003`; `P29-SURF-015`; `P29-WFLOW-006`; `P29-WFLOW-012`
- surface_or_workflow: docking, pane management, and layout machinery
- authority_type: support
- mutation_authority: direct
- user_trust_risk: medium
- workflow_visibility_pressure: high
- orchestration_pressure: medium
- diagnostic_or_support_overlap: medium
- dev_leakage_risk: medium
- intelligence_authority_risk: low
- current_visibility_level: secondary
- likely_future_visibility_class: advanced/settings candidate
- evidence: `docs/audits/phase29/workflow_conflict_register.md:P29-WFLOW-006`; `app/shared/ipc/layout.ts:16`; `app/shared/ipc/layout.ts:59`; `docs/specs/pane_lifecycle.md:22`; `docs/specs/layout_persistence.md:1`
- evidence_quality: inferred_from_multiple_sources
- confidence: medium
- notes: Docking is a real runtime seam, but too much visible layout machinery can compete with authoring and inflate shell complexity.
