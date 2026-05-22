# Phase 29 Pass 1 GUI Surface Inventory

Status: Draft inventory
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 1 - Surface Inventory

## Purpose

This artifact catalogs visible GUI surfaces and major panes found during the bounded Phase 29 Pass 1 inspection.
It is inventory evidence only.
It does not make final keep, merge, hide, defer, or delete decisions.

Review status for all rows is `pending`.

## Inventory Rows

### P29-SURF-001

- classification_id: `P29-SURF-001`
- surface_or_item: Project Home
- type: landing/status surface
- source_area: renderer component
- file_or_component_path: `app/renderer/components/ProjectHome.tsx`
- owner_doc_or_runtime_source: `app/renderer/components/ProjectHome.tsx`; `docs/audits/phase27/phase27_validation_checklist.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: default project entry surface and stable-home fallback
- workflow_role: project open/create, recent projects, session-truth visibility, relocation preferences
- overlaps_with: `P29-SURF-003`; `P29-CTRL-001`; `P29-CTRL-002`; `P29-CTRL-018`
- recommended_disposition: validate_first
- disposition_reason: Core surface, but later passes must separate product controls from support/debug affordances.
- evidence: `app/renderer/App.tsx:2691`; `app/renderer/components/ProjectHome.tsx:275`; `app/renderer/components/ProjectHome.tsx:1194`; `app/renderer/components/ProjectHome.tsx:1258`; `app/renderer/components/ProjectHome.tsx:1488`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 2 and Pass 5
- review_status: pending
- notes: Includes current session-truth labels and floating-window behavior preferences.

### P29-SURF-002

- classification_id: `P29-SURF-002`
- surface_or_item: Workspace Header
- type: global toolbar
- source_area: renderer component
- file_or_component_path: `app/renderer/components/WorkspaceHeader.tsx`
- owner_doc_or_runtime_source: `app/renderer/components/WorkspaceHeader.tsx`; `app/renderer/App.tsx`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: visible when the main workspace renders outside stable-home mode
- workflow_role: exposes generation, critique, snapshot, export, companion, and budget controls
- overlaps_with: `P29-CTRL-003`; `P29-CTRL-004`; `P29-CTRL-005`; `P29-CTRL-006`; `P29-CTRL-007`; `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`
- recommended_disposition: validate_first
- disposition_reason: Later passes must classify toolbar density and user-facing versus transitional controls.
- evidence: `app/renderer/App.tsx:3037`; `app/renderer/App.tsx:3063`; `app/renderer/components/WorkspaceHeader.tsx:45`; `app/renderer/components/WorkspaceHeader.tsx:116`; `app/renderer/components/WorkspaceHeader.tsx:228`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2 and Pass 5
- review_status: pending
- notes: High risk because many unrelated actions are always close together.

### P29-SURF-003

- classification_id: `P29-SURF-003`
- surface_or_item: Docked Workspace
- type: pane layout surface
- source_area: workspace/layout/docking
- file_or_component_path: `app/renderer/components/docking/DockWorkspace.tsx`
- owner_doc_or_runtime_source: `app/shared/ipc/layout.ts`; `docs/specs/pane_lifecycle.md`; `docs/specs/layout_persistence.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: gated by runtime UI config and project state
- workflow_role: hosts docked panes, hidden panes, floating panes, presets, reset, and focus cycling
- overlaps_with: `P29-SURF-004`; `P29-SURF-005`; `P29-SURF-006`; `P29-SURF-007`; `P29-SURF-008`; `P29-SURF-009`; `P29-CTRL-012`; `P29-CTRL-013`; `P29-CTRL-014`
- recommended_disposition: validate_first
- disposition_reason: Core runtime surface, but Phase 27 smoke found UX debt around pane usability.
- evidence: `app/renderer/App.tsx:510`; `app/renderer/App.tsx:2845`; `app/renderer/components/docking/DockWorkspace.tsx:186`; `app/renderer/components/docking/DockWorkspace.tsx:1202`; `docs/specs/layout_persistence.md:8`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2 and Pass 5
- review_status: pending
- notes: Docking is runtime-backed, but disposition of individual panes remains undecided.

### P29-SURF-004

- classification_id: `P29-SURF-004`
- surface_or_item: Outline / Wizard Panel
- type: planning pane
- source_area: renderer component and dock pane
- file_or_component_path: `app/renderer/components/WizardPanel.tsx`
- owner_doc_or_runtime_source: `app/renderer/App.tsx`; `docs/specs/workflow_spine.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: dock pane and legacy sidebar surface
- workflow_role: story planning steps, step locking, outline build action
- overlaps_with: `P29-SURF-015`; `P29-CTRL-015`; future Story Unit workflow docs
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed, but later workflow mapping must decide how it survives the correction-block direction.
- evidence: `app/renderer/App.tsx:2608`; `app/renderer/App.tsx:2695`; `app/renderer/components/WizardPanel.tsx:418`; `app/renderer/components/WizardPanel.tsx:890`; `docs/specs/workflow_spine.md:50`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 2 and Phase 30 input
- review_status: pending
- notes: Do not resolve future outline policy in this pass.

### P29-SURF-005

- classification_id: `P29-SURF-005`
- surface_or_item: Writing Surface / Draft Preview
- type: authoring and preview surface
- source_area: renderer component and dock pane
- file_or_component_path: `app/renderer/components/ProjectHome.tsx`
- owner_doc_or_runtime_source: `app/renderer/App.tsx`; `app/shared/ipc/layout.ts`; `docs/gui/gui_layouts.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: partial
- current_visibility: rendered as Project Home / draft preview content in docked workspace
- workflow_role: active scene draft view, local draft edits, session-truth classification
- overlaps_with: `P29-SURF-001`; `P29-SURF-003`; `P29-CTRL-003`; `P29-CTRL-004`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed as a current surface, but Phase 30 must later define future Writing Surface policy.
- evidence: `app/renderer/App.tsx:2698`; `app/renderer/App.tsx:2776`; `app/shared/ipc/layout.ts:38`; `docs/gui/gui_layouts.md:39`; `docs/specs/design_system_v1.md:43`
- evidence_quality: inferred_from_multiple_sources
- confidence: medium
- risk_level: high
- target_phase: Phase 29 Pass 2 and Phase 30 input
- review_status: pending
- notes: Uses the required term Writing Surface; no Phase 30 policy decision is made here.

### P29-SURF-006

- classification_id: `P29-SURF-006`
- surface_or_item: Story Insights / Analytics Dashboard
- type: analytics and intelligence surface
- source_area: renderer component and docs-declared GUI surface
- file_or_component_path: `app/renderer/components/AnalyticsDashboard.tsx`
- owner_doc_or_runtime_source: `docs/gui/gui_layouts.md`; `app/renderer/components/AnalyticsDashboard.tsx`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: partial
- current_visibility: dock pane when Story Insights pane renders; offline banner when services unavailable
- workflow_role: emotion trend, pacing strip, scene metrics, story-insight display
- overlaps_with: `P29-SURF-008`; `P29-SURF-012`; `P29-CTRL-019`
- recommended_disposition: validate_first
- disposition_reason: Runtime component exists, but docs explicitly mix current placeholder behavior and future analytics claims.
- evidence: `app/renderer/App.tsx:2721`; `app/renderer/components/AnalyticsDashboard.tsx:65`; `app/renderer/components/AnalyticsDashboard.tsx:225`; `app/renderer/components/AnalyticsDashboard.tsx:296`; `docs/gui/gui_layouts.md:33`; `docs/gui/gui_layouts.md:41`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 3
- review_status: pending
- notes: Must be revisited in the intelligence audit to prevent placeholder or partial intelligence from reading as complete.

### P29-SURF-007

- classification_id: `P29-SURF-007`
- surface_or_item: Corkboard
- type: scene-card pane
- source_area: renderer component and dock pane
- file_or_component_path: `app/renderer/components/Corkboard.tsx`
- owner_doc_or_runtime_source: `app/renderer/components/Corkboard.tsx`; `docs/specs/pane_lifecycle.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: dock pane
- workflow_role: browse scene cards with metadata
- overlaps_with: `P29-SURF-004`; `P29-SURF-015`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed, but later workflow mapping must clarify relation to outline and Story Unit navigation.
- evidence: `app/renderer/App.tsx:2731`; `app/renderer/components/Corkboard.tsx:24`; `app/renderer/components/Corkboard.tsx:122`; `docs/specs/pane_lifecycle.md:19`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 2
- review_status: pending
- notes: Scene-card surface may overlap future Story Unit tree behavior.

### P29-SURF-008

- classification_id: `P29-SURF-008`
- surface_or_item: Relationship Graph
- type: hidden analytics relationship pane
- source_area: renderer component and dock pane metadata
- file_or_component_path: `app/renderer/components/RelationshipGraph.tsx`
- owner_doc_or_runtime_source: `app/shared/ipc/layout.ts`; `docs/specs/pane_lifecycle.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: partial
- current_visibility: hidden by default in layout metadata; can be rendered by App pane map
- workflow_role: character-scene relationship visualization
- overlaps_with: `P29-SURF-006`; `P29-SURF-015`
- recommended_disposition: validate_first
- disposition_reason: Hidden runtime surface with analytics dependence; later intelligence audit must classify capability level.
- evidence: `app/renderer/App.tsx:2742`; `app/renderer/components/RelationshipGraph.tsx:30`; `app/renderer/components/RelationshipGraph.tsx:103`; `app/shared/ipc/layout.ts:59`; `app/shared/ipc/layout.ts:63`; `docs/specs/pane_lifecycle.md:22`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 3
- review_status: pending
- notes: Hidden default makes stale or partial capability easy to miss.

### P29-SURF-009

- classification_id: `P29-SURF-009`
- surface_or_item: Timeline / History Pane
- type: history pane
- source_area: layout metadata and pane lifecycle docs
- file_or_component_path: `app/shared/ipc/layout.ts`
- owner_doc_or_runtime_source: `docs/specs/pane_lifecycle.md`; `app/shared/ipc/layout.ts`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: unknown
- current_visibility: canonical pane id but not found in App pane render map during this pass
- workflow_role: project history and progress review
- overlaps_with: `P29-SURF-013`; `P29-CTRL-008`; `P29-CTRL-009`
- recommended_disposition: validate_first
- disposition_reason: Layout metadata declares it, but line-level rendering evidence was not confirmed in this pass.
- evidence: `app/shared/ipc/layout.ts:18`; `app/shared/ipc/layout.ts:50`; `docs/specs/pane_lifecycle.md:20`
- evidence_quality: weak_needs_review
- confidence: low
- risk_level: medium
- target_phase: Phase 29 Pass 2
- review_status: pending
- notes: Needs follow-up to confirm whether the surface is dormant, hidden, or represented by another component.

### P29-SURF-010

- classification_id: `P29-SURF-010`
- surface_or_item: Critique Modal / Critique Surface
- type: critique and rewrite review modal
- source_area: renderer component
- file_or_component_path: `app/renderer/components/CritiqueModal.tsx`
- owner_doc_or_runtime_source: `docs/specs/editorial_workflow_contract.md`; `app/renderer/components/CritiqueModal.tsx`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: modal when critique workflow is open
- workflow_role: critique output review, rewrite preview, apply/reject actions
- overlaps_with: `P29-CTRL-005`; `P29-CTRL-017`; `P29-SURF-002`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed but later passes must separate non-mutative critique from mutative rewrite controls.
- evidence: `app/renderer/App.tsx:3167`; `app/renderer/components/CritiqueModal.tsx:151`; `app/renderer/components/CritiqueModal.tsx:204`; `docs/specs/editorial_workflow_contract.md:36`; `docs/specs/editorial_workflow_contract.md:224`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2 and Pass 3
- review_status: pending
- notes: Rewrite/apply controls need later risk classification.

### P29-SURF-011

- classification_id: `P29-SURF-011`
- surface_or_item: Preflight Modal
- type: generation preflight modal
- source_area: renderer component
- file_or_component_path: `app/renderer/components/PreflightModal.tsx`
- owner_doc_or_runtime_source: `docs/specs/generation_scope.md`; `app/renderer/components/PreflightModal.tsx`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: modal before draft generation proceeds
- workflow_role: summarizes generation scope, draft replacement warning, budget estimates
- overlaps_with: `P29-CTRL-003`; `P29-CTRL-004`; `P29-SURF-002`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed safety surface; later passes should verify it aligns with current generation authority.
- evidence: `app/renderer/App.tsx:3073`; `app/renderer/components/PreflightModal.tsx:101`; `app/renderer/components/PreflightModal.tsx:130`; `app/renderer/components/PreflightModal.tsx:245`; `docs/specs/generation_scope.md:9`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 2
- review_status: pending
- notes: Important guard surface for generation scope and replacement risk.

### P29-SURF-012

- classification_id: `P29-SURF-012`
- surface_or_item: Companion Overlay
- type: assistance and local insight overlay
- source_area: renderer component
- file_or_component_path: `app/renderer/components/CompanionOverlay.tsx`
- owner_doc_or_runtime_source: `app/renderer/components/CompanionOverlay.tsx`; `docs/gui/gui_layouts.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: partial
- current_visibility: toggled from workspace header
- workflow_role: companion overlay, local insight cards, model insight queue/status
- overlaps_with: `P29-SURF-006`; `P29-CTRL-007`; `P29-CTRL-019`
- recommended_disposition: validate_first
- disposition_reason: Contains real UI and local calculations, but intelligence claims require Phase 29 Pass 3 classification.
- evidence: `app/renderer/App.tsx:3127`; `app/renderer/components/CompanionOverlay.tsx:370`; `app/renderer/components/CompanionOverlay.tsx:739`; `app/renderer/components/CompanionOverlay.tsx:770`; `docs/gui/gui_layouts.md:42`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 3
- review_status: pending
- notes: Must not be promoted to real narrative intelligence without evidence.

### P29-SURF-013

- classification_id: `P29-SURF-013`
- surface_or_item: Snapshots and Verification Panel
- type: snapshot, backup, restore, and verification panel
- source_area: renderer component
- file_or_component_path: `app/renderer/components/SnapshotsPanel.tsx`
- owner_doc_or_runtime_source: `app/renderer/components/SnapshotsPanel.tsx`; `docs/specs/editorial_workflow_contract.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: modal/panel opened from workspace header
- workflow_role: snapshot browsing, verification report, backup creation, restore flows
- overlaps_with: `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`; `P29-CTRL-011`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed and high-risk because several controls perform persistence or restore operations.
- evidence: `app/renderer/App.tsx:3153`; `app/renderer/components/SnapshotsPanel.tsx:116`; `app/renderer/components/SnapshotsPanel.tsx:983`; `app/renderer/components/SnapshotsPanel.tsx:1053`; `app/renderer/components/SnapshotsPanel.tsx:1337`; `docs/specs/editorial_workflow_contract.md:90`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2 and Pass 5
- review_status: pending
- notes: Later passes should separate support safety tooling from normal writing workflow.

### P29-SURF-014

- classification_id: `P29-SURF-014`
- surface_or_item: Recovery, Service Health, Offline, and Toast Surfaces
- type: status and notification surfaces
- source_area: renderer components
- file_or_component_path: `app/renderer/components/RecoveryBanner.tsx`; `app/renderer/components/ServiceHealthBanner.tsx`; `app/renderer/components/OfflineBanner.tsx`; `app/renderer/components/ToastStack.tsx`
- owner_doc_or_runtime_source: `app/renderer/App.tsx`; `docs/gui/gui_layouts.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: runtime_backed
- current_visibility: conditional banners, offline notices, and toasts
- workflow_role: recovery warning, service retry, offline gating, traceable notifications
- overlaps_with: `P29-CTRL-018`; `P29-CTRL-019`; `P29-DEV-006`
- recommended_disposition: validate_first
- disposition_reason: Runtime-backed, but some status surfaces overlap with test-mode freeze and diagnostic handling.
- evidence: `app/renderer/App.tsx:2620`; `app/renderer/App.tsx:3228`; `app/renderer/App.tsx:3267`; `app/renderer/components/RecoveryBanner.tsx:51`; `app/renderer/components/ServiceHealthBanner.tsx:57`; `app/renderer/components/ToastStack.tsx:118`; `docs/gui/gui_layouts.md:52`
- evidence_quality: direct_runtime_file
- confidence: high
- risk_level: medium
- target_phase: Phase 29 Pass 4
- review_status: pending
- notes: Needs dev-vs-production audit for test freeze and diagnostic interactions.

### P29-SURF-015

- classification_id: `P29-SURF-015`
- surface_or_item: Split Command Workspace
- type: experimental shell and command-center surface
- source_area: workspace component and runtime flag
- file_or_component_path: `app/renderer/components/workspace/SplitCommandWorkspace.tsx`
- owner_doc_or_runtime_source: `app/shared/config/runtime.ts`; `docs/specs/design_system_v1.md`
- user_facing_or_dev_only: user_facing
- runtime_backed_or_placeholder: experimental_flagged
- current_visibility: gated by `experimentalSplitCommandWorkspace`
- workflow_role: Command Center, story navigation, deterministic command surfaces, Writing Surface support
- overlaps_with: `P29-SURF-003`; `P29-SURF-004`; `P29-SURF-005`; `P29-CTRL-020`
- recommended_disposition: validate_first
- disposition_reason: Runtime surface exists behind an experimental flag; Phase 29 must avoid promoting it as stable product behavior.
- evidence: `app/renderer/App.tsx:255`; `app/renderer/App.tsx:2876`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:407`; `app/renderer/components/workspace/SplitCommandWorkspace.tsx:412`; `app/shared/config/runtime.ts:115`; `docs/specs/design_system_v1.md:125`
- evidence_quality: inferred_from_multiple_sources
- confidence: high
- risk_level: high
- target_phase: Phase 29 Pass 2 and Pass 4
- review_status: pending
- notes: Later passes should classify which parts are test/prototype, product candidate, or future-only.
